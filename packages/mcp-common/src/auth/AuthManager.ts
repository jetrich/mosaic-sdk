/**
 * @fileoverview Authentication manager for MCP service tools
 * @module @mosaic/mcp-common/auth
 */

import jwt from 'jsonwebtoken';
import { AuthConfig, AuthenticationError } from '../types/index.js';
import { Logger } from '../utils/Logger.js';
import winston from 'winston';

/**
 * Manages authentication for MCP service tools
 * Supports token-based, OAuth, SSH key, and basic authentication
 */
export class AuthManager {
  private logger: winston.Logger;
  private cachedCredentials: Record<string, any> = {};
  private lastRefresh: Date | null = null;

  constructor(private config: AuthConfig) {
    this.logger = Logger.getLogger('auth-manager');
    this.validateConfig();
  }

  /**
   * Validate authentication configuration
   */
  private validateConfig(): void {
    if (!this.config.type) {
      throw new Error('Authentication type is required');
    }

    if (!this.config.credentials) {
      throw new Error('Authentication credentials are required');
    }

    // Validate specific auth types
    switch (this.config.type) {
      case 'token':
        if (!this.config.credentials.token) {
          throw new Error('Token is required for token authentication');
        }
        break;
      case 'oauth':
        if (!this.config.credentials.clientId || !this.config.credentials.clientSecret) {
          throw new Error('Client ID and secret are required for OAuth authentication');
        }
        break;
      case 'ssh-key':
        if (!this.config.credentials.privateKey) {
          throw new Error('Private key is required for SSH key authentication');
        }
        break;
      case 'basic':
        if (!this.config.credentials.username || !this.config.credentials.password) {
          throw new Error('Username and password are required for basic authentication');
        }
        break;
      default:
        throw new Error(`Unsupported authentication type: ${this.config.type}`);
    }
  }

  /**
   * Get authentication headers for API requests
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      switch (this.config.type) {
        case 'token':
          return this.getTokenHeaders();
        case 'oauth':
          return await this.getOAuthHeaders();
        case 'basic':
          return this.getBasicAuthHeaders();
        default:
          throw new Error(`Cannot generate headers for auth type: ${this.config.type}`);
      }
    } catch (error) {
      this.logger.error('Failed to get authentication headers', { error });
      throw new AuthenticationError('auth-manager', error);
    }
  }

  /**
   * Get token-based authentication headers
   */
  private getTokenHeaders(): Record<string, string> {
    const token = this.config.credentials.token;
    const tokenType = this.config.credentials.tokenType || 'Bearer';

    return {
      'Authorization': `${tokenType} ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get OAuth authentication headers
   */
  private async getOAuthHeaders(): Promise<Record<string, string>> {
    // Check if we have a cached access token
    if (this.cachedCredentials.accessToken && !this.isTokenExpired()) {
      return {
        'Authorization': `Bearer ${this.cachedCredentials.accessToken}`,
        'Content-Type': 'application/json',
      };
    }

    // Refresh or get new access token
    await this.refreshOAuthToken();

    return {
      'Authorization': `Bearer ${this.cachedCredentials.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get basic authentication headers
   */
  private getBasicAuthHeaders(): Record<string, string> {
    const { username, password } = this.config.credentials;
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');

    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Refresh OAuth token
   */
  private async refreshOAuthToken(): Promise<void> {
    const { clientId, clientSecret, refreshToken, tokenUrl } = this.config.credentials;

    if (!tokenUrl) {
      throw new Error('Token URL is required for OAuth token refresh');
    }

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: refreshToken ? 'refresh_token' : 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          ...(refreshToken && { refresh_token: refreshToken }),
        }),
      });

      if (!response.ok) {
        throw new Error(`OAuth token refresh failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      this.cachedCredentials = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
      };

      this.lastRefresh = new Date();

      this.logger.info('OAuth token refreshed successfully');
    } catch (error) {
      this.logger.error('Failed to refresh OAuth token', { error });
      throw error;
    }
  }

  /**
   * Check if the current token is expired
   */
  private isTokenExpired(): boolean {
    if (!this.cachedCredentials.expiresAt) {
      return false; // No expiration time, assume valid
    }

    // Add 5 minute buffer before actual expiration
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    return new Date() >= new Date(this.cachedCredentials.expiresAt.getTime() - bufferTime);
  }

  /**
   * Check if authentication needs refresh
   */
  needsRefresh(): boolean {
    if (!this.config.refreshable) {
      return false;
    }

    switch (this.config.type) {
      case 'oauth':
        return !this.cachedCredentials.accessToken || this.isTokenExpired();
      case 'token':
        // Check if token has expiration information
        if (this.config.expiresAt) {
          return new Date() >= this.config.expiresAt;
        }
        return false;
      default:
        return false;
    }
  }

  /**
   * Refresh authentication credentials
   */
  async refresh(): Promise<void> {
    switch (this.config.type) {
      case 'oauth':
        await this.refreshOAuthToken();
        break;
      case 'token':
        // For token auth, refresh would typically involve getting a new token
        // This depends on the specific service implementation
        this.logger.warn('Token refresh not implemented for generic token auth');
        break;
      default:
        this.logger.warn(`Refresh not supported for auth type: ${this.config.type}`);
    }
  }

  /**
   * Check if currently authenticated
   */
  isAuthenticated(): boolean {
    switch (this.config.type) {
      case 'token':
        return !!this.config.credentials.token;
      case 'oauth':
        return !!this.cachedCredentials.accessToken && !this.isTokenExpired();
      case 'basic':
        return !!(this.config.credentials.username && this.config.credentials.password);
      case 'ssh-key':
        return !!this.config.credentials.privateKey;
      default:
        return false;
    }
  }

  /**
   * Get SSH credentials for Git operations
   */
  getSSHCredentials(): { privateKey: string; passphrase?: string } {
    if (this.config.type !== 'ssh-key') {
      throw new Error('SSH credentials only available for ssh-key authentication');
    }

    return {
      privateKey: this.config.credentials.privateKey,
      passphrase: this.config.credentials.passphrase,
    };
  }

  /**
   * Validate JWT token (for token-based auth)
   */
  validateJWT(token?: string): boolean {
    const tokenToValidate = token || this.config.credentials.token;

    if (!tokenToValidate) {
      return false;
    }

    try {
      // Decode without verification to check expiration
      const decoded = jwt.decode(tokenToValidate) as any;

      if (!decoded) {
        return false;
      }

      // Check expiration
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.warn('JWT validation failed', { error });
      return false;
    }
  }

  /**
   * Update authentication credentials
   */
  updateCredentials(newCredentials: Record<string, any>): void {
    this.config.credentials = { ...this.config.credentials, ...newCredentials };
    this.cachedCredentials = {}; // Clear cache
    this.lastRefresh = null;
    
    this.logger.info('Authentication credentials updated');
  }

  /**
   * Clear cached credentials
   */
  clearCache(): void {
    this.cachedCredentials = {};
    this.lastRefresh = null;
    this.logger.info('Authentication cache cleared');
  }

  /**
   * Get authentication status information
   */
  getStatus(): {
    type: string;
    authenticated: boolean;
    needsRefresh: boolean;
    lastRefresh: Date | null;
    expiresAt: Date | null;
  } {
    return {
      type: this.config.type,
      authenticated: this.isAuthenticated(),
      needsRefresh: this.needsRefresh(),
      lastRefresh: this.lastRefresh,
      expiresAt: this.cachedCredentials.expiresAt || this.config.expiresAt || null,
    };
  }
}