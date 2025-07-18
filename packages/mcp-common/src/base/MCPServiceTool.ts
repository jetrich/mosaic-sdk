/**
 * @fileoverview Base class for all MosAIc MCP service tools
 * @module @mosaic/mcp-common/base
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import winston from 'winston';
import retry from 'retry';
import {
  ServiceConfig,
  AuthConfig,
  MCPResult,
  ServiceOperation,
  MCPServiceError,
  AuthenticationError,
  RateLimitError,
  ServiceUnavailableError,
  AsyncResult,
} from '../types/index.js';
import { AuthManager } from '../auth/AuthManager.js';
import { Logger } from '../utils/Logger.js';
import { CircuitBreaker } from '../utils/CircuitBreaker.js';

/**
 * Abstract base class for all MCP service tools
 * Provides common functionality for authentication, error handling, retry logic, and circuit breaking
 */
export abstract class MCPServiceTool implements Tool {
  protected logger: winston.Logger;
  protected authManager: AuthManager;
  protected circuitBreaker: CircuitBreaker;

  constructor(
    protected serviceName: string,
    protected config: ServiceConfig,
    protected authConfig: AuthConfig
  ) {
    this.logger = Logger.getLogger(`mcp-${serviceName}`);
    this.authManager = new AuthManager(authConfig);
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      recoveryTimeout: 30000,
      monitoringPeriod: 60000,
    });

    this.logger.info(`Initialized ${serviceName} MCP tool`, {
      baseUrl: config.baseUrl,
      timeout: config.timeout,
    });
  }

  // Abstract properties that must be implemented by concrete tools
  abstract get name(): string;
  abstract get description(): string;
  abstract get inputSchema(): z.ZodSchema<any>;

  /**
   * Main execution method - implements the MCP Tool interface
   */
  async call(args: any): Promise<any> {
    const startTime = Date.now();
    const operation = this.extractOperation(args);

    try {
      // Validate input arguments
      const validatedArgs = this.inputSchema.parse(args);

      // Log the operation
      this.logger.info(`Executing ${this.name}`, {
        operation,
        args: this.sanitizeArgs(validatedArgs),
      });

      // Execute with circuit breaker protection
      const result = await this.circuitBreaker.execute(() =>
        this.executeWithRetry(operation, validatedArgs)
      );

      // Log success
      const duration = Date.now() - startTime;
      this.logger.info(`${this.name} completed successfully`, {
        operation,
        duration,
        success: result.success,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`${this.name} failed`, {
        operation,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return this.handleError(error, operation);
    }
  }

  /**
   * Execute operation with retry logic
   */
  private async executeWithRetry(
    operation: ServiceOperation,
    args: any
  ): Promise<MCPResult> {
    const retryOptions = {
      retries: this.config.retryAttempts,
      factor: 2,
      minTimeout: this.config.retryDelay,
      maxTimeout: this.config.retryDelay * 10,
      randomize: true,
    };

    return new Promise((resolve, reject) => {
      const retryOperation = retry.operation(retryOptions);

      retryOperation.attempt(async (currentAttempt) => {
        try {
          const result = await this.executeOperation(operation, args);
          resolve(result);
        } catch (error) {
          // Don't retry authentication errors or client errors
          if (
            error instanceof AuthenticationError ||
            (error instanceof MCPServiceError && error.code.startsWith('CLIENT'))
          ) {
            reject(error);
            return;
          }

          // Retry rate limit errors with exponential backoff
          if (error instanceof RateLimitError) {
            const delay = error.details?.retryAfter || this.config.retryDelay * currentAttempt;
            this.logger.warn(`Rate limited, retrying in ${delay}ms`, {
              attempt: currentAttempt,
              service: this.serviceName,
            });
            setTimeout(() => {
              if (retryOperation.retry(error)) return;
              reject(retryOperation.mainError());
            }, delay);
            return;
          }

          // Retry other errors
          if (retryOperation.retry(error)) {
            this.logger.warn(`Retrying operation`, {
              attempt: currentAttempt,
              error: error instanceof Error ? error.message : String(error),
              service: this.serviceName,
            });
            return;
          }

          reject(retryOperation.mainError());
        }
      });
    });
  }

  /**
   * Abstract method for executing the actual operation
   * Must be implemented by concrete tools
   */
  protected abstract executeOperation(
    operation: ServiceOperation,
    args: any
  ): AsyncResult<any>;

  /**
   * Extract operation type from arguments
   * Can be overridden by concrete tools if needed
   */
  protected extractOperation(args: any): ServiceOperation {
    return args.operation || ServiceOperation.READ;
  }

  /**
   * Sanitize arguments for logging (remove sensitive data)
   */
  protected sanitizeArgs(args: any): any {
    const sanitized = { ...args };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Handle errors and convert them to MCPResult format
   */
  protected handleError(error: any, operation: ServiceOperation): MCPResult {
    if (error instanceof MCPServiceError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        metadata: {
          service: this.serviceName,
          operation,
        },
      };
    }

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input arguments',
          details: error.errors,
        },
        metadata: {
          service: this.serviceName,
          operation,
        },
      };
    }

    // Handle unknown errors
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? error.stack : undefined,
      },
      metadata: {
        service: this.serviceName,
        operation,
      },
    };
  }

  /**
   * Get authentication headers for API requests
   */
  protected async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      return await this.authManager.getAuthHeaders();
    } catch (error) {
      throw new AuthenticationError(this.serviceName, error);
    }
  }

  /**
   * Check if authentication needs refresh
   */
  protected async refreshAuthIfNeeded(): Promise<void> {
    if (this.authManager.needsRefresh()) {
      try {
        await this.authManager.refresh();
        this.logger.info('Authentication refreshed successfully', {
          service: this.serviceName,
        });
      } catch (error) {
        throw new AuthenticationError(this.serviceName, error);
      }
    }
  }

  /**
   * Create a success result
   */
  protected createSuccessResult<T>(data: T, metadata?: Record<string, any>): MCPResult<T> {
    return {
      success: true,
      data,
      metadata: {
        service: this.serviceName,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    };
  }

  /**
   * Create an error result
   */
  protected createErrorResult(
    code: string,
    message: string,
    details?: any
  ): MCPResult {
    return {
      success: false,
      error: {
        code,
        message,
        details,
      },
      metadata: {
        service: this.serviceName,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<MCPResult<{ status: string; details: any }>> {
    try {
      const result = await this.circuitBreaker.execute(async () => {
        // Implement basic health check
        return { status: 'healthy', timestamp: new Date().toISOString() };
      });

      return this.createSuccessResult({
        status: 'healthy',
        details: {
          circuitBreakerState: this.circuitBreaker.getState(),
          authStatus: this.authManager.isAuthenticated() ? 'authenticated' : 'unauthenticated',
          ...result,
        },
      });
    } catch (error) {
      return this.createErrorResult(
        'HEALTH_CHECK_FAILED',
        'Service health check failed',
        error
      );
    }
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    this.logger.info(`Disposing ${this.serviceName} MCP tool`);
    // Cleanup can be implemented by concrete tools if needed
  }
}