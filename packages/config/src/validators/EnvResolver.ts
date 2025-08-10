/**
 * Environment Variable Resolver
 * Resolves environment variables in configuration values
 */

import { EnvResolver } from '../types/ConfigTypes';

/**
 * Environment variable resolver implementation
 */
export class EnvResolverImpl implements EnvResolver {
  private readonly ENV_PATTERN = /^env:([A-Z_][A-Z0-9_]*)$/;
  private readonly ENV_DEFAULT_PATTERN = /^env:([A-Z_][A-Z0-9_]*)\|(.*?)$/;

  /**
   * Resolve a single value that may contain environment variable references
   * 
   * Supported formats:
   * - "env:VAR_NAME" - Required environment variable
   * - "env:VAR_NAME|default_value" - Environment variable with default
   * - "literal_value" - Literal value (passed through unchanged)
   */
  resolve(value: string): string {
    if (typeof value !== 'string') {
      return value;
    }

    // Check for env variable with default
    const defaultMatch = value.match(this.ENV_DEFAULT_PATTERN);
    if (defaultMatch) {
      const [, envVar, defaultValue] = defaultMatch;
      return process.env[envVar] ?? defaultValue;
    }

    // Check for required env variable
    const envMatch = value.match(this.ENV_PATTERN);
    if (envMatch) {
      const [, envVar] = envMatch;
      const envValue = process.env[envVar];
      
      if (envValue === undefined) {
        throw new Error(`Required environment variable ${envVar} is not set`);
      }
      
      return envValue;
    }

    // Return literal value
    return value;
  }

  /**
   * Recursively resolve environment variables in an object
   */
  resolveObject<T>(obj: T): T {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.resolve(obj) as unknown as T;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.resolveObject(item)) as unknown as T;
    }

    if (typeof obj === 'object') {
      const resolved: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        resolved[key] = this.resolveObject(value);
      }
      
      return resolved as T;
    }

    // Primitive values (number, boolean, etc.)
    return obj;
  }

  /**
   * Check if a value contains environment variable references
   */
  hasEnvReferences(value: any): boolean {
    if (typeof value === 'string') {
      return this.ENV_PATTERN.test(value) || this.ENV_DEFAULT_PATTERN.test(value);
    }

    if (Array.isArray(value)) {
      return value.some(item => this.hasEnvReferences(item));
    }

    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(item => this.hasEnvReferences(item));
    }

    return false;
  }

  /**
   * Extract all environment variable names referenced in a value
   */
  extractEnvVars(value: any): string[] {
    const envVars: string[] = [];

    if (typeof value === 'string') {
      const defaultMatch = value.match(this.ENV_DEFAULT_PATTERN);
      if (defaultMatch) {
        envVars.push(defaultMatch[1]);
        return envVars;
      }

      const envMatch = value.match(this.ENV_PATTERN);
      if (envMatch) {
        envVars.push(envMatch[1]);
        return envVars;
      }
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        envVars.push(...this.extractEnvVars(item));
      }
    }

    if (typeof value === 'object' && value !== null) {
      for (const item of Object.values(value)) {
        envVars.push(...this.extractEnvVars(item));
      }
    }

    return [...new Set(envVars)]; // Remove duplicates
  }

  /**
   * Validate that all required environment variables are available
   */
  validateEnvVars(obj: any): { missing: string[]; available: string[] } {
    const allEnvVars = this.extractEnvVars(obj);
    const missing: string[] = [];
    const available: string[] = [];

    for (const envVar of allEnvVars) {
      if (process.env[envVar] !== undefined) {
        available.push(envVar);
      } else {
        // Check if it has a default value
        const hasDefault = this.hasDefaultValue(obj, envVar);
        if (!hasDefault) {
          missing.push(envVar);
        } else {
          available.push(envVar); // Has default, so it's effectively available
        }
      }
    }

    return { missing, available };
  }

  /**
   * Check if an environment variable has a default value in the configuration
   */
  private hasDefaultValue(obj: any, envVar: string): boolean {
    if (typeof obj === 'string') {
      const pattern = new RegExp(`^env:${envVar}\\|`);
      return pattern.test(obj);
    }

    if (Array.isArray(obj)) {
      return obj.some(item => this.hasDefaultValue(item, envVar));
    }

    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(item => this.hasDefaultValue(item, envVar));
    }

    return false;
  }

  /**
   * Generate example .env file content based on configuration
   */
  generateEnvTemplate(obj: any): string {
    const envVars = this.extractEnvVars(obj);
    const lines: string[] = [
      '# MosAIc Stack Environment Variables',
      '# Copy this file to .env and set your values',
      '',
    ];

    const categorized = this.categorizeEnvVars(envVars);

    if (categorized.providers.length > 0) {
      lines.push('# Provider Configuration');
      for (const envVar of categorized.providers) {
        lines.push(`${envVar}=your_${envVar.toLowerCase()}_here`);
      }
      lines.push('');
    }

    if (categorized.database.length > 0) {
      lines.push('# Database Configuration');
      for (const envVar of categorized.database) {
        lines.push(`${envVar}=your_${envVar.toLowerCase()}_here`);
      }
      lines.push('');
    }

    if (categorized.monitoring.length > 0) {
      lines.push('# Monitoring Configuration');
      for (const envVar of categorized.monitoring) {
        lines.push(`${envVar}=your_${envVar.toLowerCase()}_here`);
      }
      lines.push('');
    }

    if (categorized.other.length > 0) {
      lines.push('# Other Configuration');
      for (const envVar of categorized.other) {
        lines.push(`${envVar}=your_${envVar.toLowerCase()}_here`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Categorize environment variables by purpose
   */
  private categorizeEnvVars(envVars: string[]): {
    providers: string[];
    database: string[];
    monitoring: string[];
    other: string[];
  } {
    const categorized = {
      providers: [] as string[],
      database: [] as string[],
      monitoring: [] as string[],
      other: [] as string[],
    };

    for (const envVar of envVars) {
      if (envVar.includes('API_KEY') || envVar.includes('TOKEN') || envVar.includes('SECRET')) {
        categorized.providers.push(envVar);
      } else if (envVar.includes('DATABASE') || envVar.includes('DB_')) {
        categorized.database.push(envVar);
      } else if (envVar.includes('METRICS') || envVar.includes('TELEMETRY') || envVar.includes('LOG')) {
        categorized.monitoring.push(envVar);
      } else {
        categorized.other.push(envVar);
      }
    }

    return categorized;
  }
}