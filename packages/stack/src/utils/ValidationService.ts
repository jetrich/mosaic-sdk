/**
 * Validation service for MosAIc Stack operations
 */

import { StackUtils } from './StackUtils.js';
import type { StackOptions } from '../types.js';

export class ValidationService {
  /**
   * Validate stack options
   */
  async validateStackOptions(options: StackOptions): Promise<void> {
    const errors: string[] = [];

    // Validate mode
    if (!StackUtils.isValidMode(options.mode)) {
      errors.push(`Invalid mode: ${options.mode}. Must be 'local', 'hybrid', or 'cloud'`);
    }

    // Validate port
    if (options.port !== undefined && !StackUtils.isValidPort(options.port)) {
      errors.push(`Invalid port: ${options.port}. Must be between 1 and 65535`);
    }

    // Validate timeout
    if (options.timeout !== undefined && (options.timeout < 1000 || options.timeout > 300000)) {
      errors.push(`Invalid timeout: ${options.timeout}. Must be between 1000 and 300000 milliseconds`);
    }

    // Validate config path if provided
    if (options.configPath) {
      try {
        const { promises: fs } = await import('fs');
        await fs.access(options.configPath);
      } catch {
        errors.push(`Config file not found: ${options.configPath}`);
      }
    }

    // Mode-specific validations
    await this.validateModeSpecificRequirements(options.mode, errors);

    if (errors.length > 0) {
      throw new Error(`Validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
    }
  }

  /**
   * Validate configuration object
   */
  validateConfig(config: Record<string, unknown>): void {
    const errors: string[] = [];

    // Check required fields
    if (!config.mode) {
      errors.push('Missing required field: mode');
    }

    if (!config.version) {
      errors.push('Missing required field: version');
    }

    // Validate mode
    if (config.mode && !StackUtils.isValidMode(config.mode as string)) {
      errors.push(`Invalid mode: ${config.mode}`);
    }

    // Validate port
    if (config.port && !StackUtils.isValidPort(config.port as number)) {
      errors.push(`Invalid port: ${config.port}`);
    }

    // Validate providers array
    if (config.providers && Array.isArray(config.providers)) {
      for (const [index, provider] of (config.providers as any[]).entries()) {
        if (!provider.name) {
          errors.push(`Provider ${index}: missing name`);
        }
        if (!provider.type || !['local', 'cloud'].includes(provider.type)) {
          errors.push(`Provider ${index}: invalid type '${provider.type}'`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
    }
  }

  /**
   * Validate provider configuration
   */
  validateProvider(provider: Record<string, unknown>): void {
    const errors: string[] = [];

    if (!provider.name) {
      errors.push('Provider missing required field: name');
    }

    if (!provider.type || !['local', 'cloud'].includes(provider.type as string)) {
      errors.push(`Provider invalid type: ${provider.type}`);
    }

    if (provider.priority !== undefined) {
      const priority = provider.priority as number;
      if (!Number.isInteger(priority) || priority < 1) {
        errors.push(`Provider invalid priority: ${priority}. Must be positive integer`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Provider validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
    }
  }

  /**
   * Validate system requirements
   */
  async validateSystemRequirements(): Promise<void> {
    const errors: string[] = [];

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      errors.push(`Node.js version ${nodeVersion} not supported. Requires Node.js 18 or higher`);
    }

    // Check available memory
    const { freemem, totalmem } = await import('os');
    const freeMemoryMB = freemem() / 1024 / 1024;
    if (freeMemoryMB < 500) {
      errors.push(`Insufficient memory: ${Math.round(freeMemoryMB)}MB free. Requires at least 500MB`);
    }

    // Check disk space
    try {
      const { promises: fs } = await import('fs');
      const stats = await fs.stat(StackUtils.getStackDirectory());
      // Additional disk space checks could go here
    } catch {
      // Directory doesn't exist yet, will be created
    }

    if (errors.length > 0) {
      throw new Error(`System requirements not met:\n${errors.map(e => `  - ${e}`).join('\n')}`);
    }
  }

  /**
   * Validate mode-specific requirements
   */
  private async validateModeSpecificRequirements(mode: string, errors: string[]): Promise<void> {
    switch (mode) {
      case 'local':
        await this.validateLocalModeRequirements(errors);
        break;
      case 'hybrid':
        await this.validateHybridModeRequirements(errors);
        break;
      case 'cloud':
        await this.validateCloudModeRequirements(errors);
        break;
    }
  }

  /**
   * Validate local mode requirements
   */
  private async validateLocalModeRequirements(errors: string[]): Promise<void> {
    // Check if Ollama is available
    try {
      const response = await fetch('http://localhost:11434/api/version', {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        errors.push('Ollama not accessible at http://localhost:11434. Please ensure Ollama is running.');
      }
    } catch {
      errors.push('Ollama not found. Local mode requires Ollama to be installed and running.');
    }
  }

  /**
   * Validate hybrid mode requirements
   */
  private async validateHybridModeRequirements(errors: string[]): Promise<void> {
    // Local requirements (Ollama)
    await this.validateLocalModeRequirements(errors);

    // Internet connectivity check
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      // Even 401/403 means we can reach the endpoint
      if (response.status >= 500) {
        errors.push('Cannot reach cloud providers. Check internet connectivity.');
      }
    } catch {
      errors.push('Internet connectivity required for hybrid mode.');
    }
  }

  /**
   * Validate cloud mode requirements
   */
  private async validateCloudModeRequirements(errors: string[]): Promise<void> {
    // Internet connectivity check
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      if (response.status >= 500) {
        errors.push('Cannot reach cloud providers. Check internet connectivity.');
      }
    } catch {
      errors.push('Internet connectivity required for cloud mode.');
    }

    // Note: API key validation would happen during provider initialization
    // We don't validate API keys here to avoid exposing them
  }
}