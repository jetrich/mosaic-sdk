/**
 * Tony Framework Hot-Reload Configuration v2.6.0
 *
 * Configuration schema and utilities for hot-reload functionality.
 */

import { HotReloadConfig } from './hot-reload-manager';

/**
 * Environment-specific hot-reload configurations
 */
export const HOT_RELOAD_CONFIGS = {
  development: {
    enabled: true,
    debounceDelay: 300,
    recursive: true,
    extensions: ['.js', '.ts', '.mjs', '.cjs', '.json'],
    ignore: [
      'node_modules/**',
      '.git/**',
      '**/*.test.*',
      '**/*.spec.*',
      '**/test/**',
      '**/tests/**',
      '**/*.d.ts',
      '**/coverage/**',
      '**/dist/**',
      '**/build/**',
    ],
    preserveState: true,
    validateBeforeReload: true,
    maxRetryAttempts: 3,
    reloadDependents: true,
  } as Required<HotReloadConfig>,

  production: {
    enabled: false,
    debounceDelay: 1000,
    recursive: false,
    extensions: ['.js', '.mjs', '.cjs'],
    ignore: ['**/*'],
    preserveState: false,
    validateBeforeReload: true,
    maxRetryAttempts: 1,
    reloadDependents: false,
  } as Required<HotReloadConfig>,

  testing: {
    enabled: false,
    debounceDelay: 100,
    recursive: true,
    extensions: ['.js', '.ts', '.mjs', '.cjs'],
    ignore: ['node_modules/**', '.git/**', '**/coverage/**'],
    preserveState: false,
    validateBeforeReload: true,
    maxRetryAttempts: 1,
    reloadDependents: false,
  } as Required<HotReloadConfig>,
};

/**
 * Gets configuration for the current environment
 */
export function getEnvironmentConfig(env?: string): Required<HotReloadConfig> {
  const environment = env ?? process.env.NODE_ENV ?? 'development';

  switch (environment) {
    case 'production':
      return HOT_RELOAD_CONFIGS.production;
    case 'test':
    case 'testing':
      return HOT_RELOAD_CONFIGS.testing;
    case 'development':
    default:
      return HOT_RELOAD_CONFIGS.development;
  }
}

/**
 * Merges user configuration with environment defaults
 */
export function mergeHotReloadConfig(
  userConfig: HotReloadConfig = {},
  env?: string,
): Required<HotReloadConfig> {
  const envConfig = getEnvironmentConfig(env);

  return {
    ...envConfig,
    ...userConfig,
    // Merge arrays instead of replacing them
    extensions: userConfig.extensions ?? envConfig.extensions,
    ignore: userConfig.ignore ?? envConfig.ignore,
  };
}

/**
 * Validates hot-reload configuration
 */
export function validateHotReloadConfig(config: HotReloadConfig): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (
    config.debounceDelay !== undefined &&
    (config.debounceDelay < 0 || config.debounceDelay > 10000)
  ) {
    errors.push('debounceDelay must be between 0 and 10000 milliseconds');
  }

  if (
    config.maxRetryAttempts !== undefined &&
    (config.maxRetryAttempts < 0 || config.maxRetryAttempts > 10)
  ) {
    errors.push('maxRetryAttempts must be between 0 and 10');
  }

  if (config.extensions !== undefined && !Array.isArray(config.extensions)) {
    errors.push('extensions must be an array of strings');
  }

  if (config.ignore !== undefined && !Array.isArray(config.ignore)) {
    errors.push('ignore must be an array of strings');
  }

  if (
    config.extensions &&
    config.extensions.some(
      ext => typeof ext !== 'string' || !ext.startsWith('.'),
    )
  ) {
    errors.push(
      'all extensions must be strings starting with a dot (e.g., ".js")',
    );
  }

  if (
    config.ignore &&
    config.ignore.some(pattern => typeof pattern !== 'string')
  ) {
    errors.push('all ignore patterns must be strings');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Configuration schema for JSON validation
 */
export const HOT_RELOAD_CONFIG_SCHEMA = {
  type: 'object',
  properties: {
    enabled: {
      type: 'boolean',
      description: 'Whether hot-reload is enabled',
    },
    debounceDelay: {
      type: 'number',
      minimum: 0,
      maximum: 10000,
      description: 'Debounce delay for file changes in milliseconds',
    },
    recursive: {
      type: 'boolean',
      description: 'Whether to watch subdirectories recursively',
    },
    extensions: {
      type: 'array',
      items: {
        type: 'string',
        pattern: '^\\.',
      },
      description: 'File extensions to watch (e.g., [".js", ".ts"])',
    },
    ignore: {
      type: 'array',
      items: {
        type: 'string',
      },
      description: 'Patterns to ignore during watching (glob patterns)',
    },
    preserveState: {
      type: 'boolean',
      description: 'Whether to preserve plugin state during reload',
    },
    validateBeforeReload: {
      type: 'boolean',
      description: 'Whether to validate plugins before reload',
    },
    maxRetryAttempts: {
      type: 'number',
      minimum: 0,
      maximum: 10,
      description: 'Maximum reload attempts before giving up',
    },
    reloadDependents: {
      type: 'boolean',
      description: 'Whether to reload dependencies when a plugin changes',
    },
  },
  additionalProperties: false,
};
