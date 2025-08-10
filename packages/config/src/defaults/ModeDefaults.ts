/**
 * Mode-specific default configurations
 * SIBKISS: 3-step configuration with intelligent defaults
 */

import { MosaicConfig, ModeDefaults } from '../types/ConfigTypes';

/**
 * Default configurations for each operation mode
 */
export const MODE_DEFAULTS: ModeDefaults = {
  /**
   * Local Mode - Complete Privacy
   * Zero external API calls, Ollama-only
   */
  local: {
    mode: 'local',
    version: '1.0.0',
    
    mcp: {
      port: 3456,
      autoStart: true,
      features: {
        tony: true,
        orchestration: true,
        streaming: true,
        metrics: true,
        health: true,
      },
    },
    
    providers: {
      ollama: {
        enabled: true,
        location: 'local',
        url: 'http://localhost:11434',
        models: ['auto-detect'],
        priority: 1,
        timeout: 30000,
        retries: 3,
        healthCheckInterval: 60000,
      },
      claude: {
        enabled: false,
        access: 'subscription',
        priority: 2,
      },
      openrouter: {
        enabled: false,
        apiKey: '',
        models: ['auto'],
        priority: 3,
      },
    },
    
    routing: {
      strategy: 'intelligent',
      preferLocal: true,
      costOptimization: true,
      performanceTracking: true,
      fallbackChain: ['ollama'],
      rules: [
        {
          taskType: 'code',
          preferredProvider: 'ollama',
          preferredModel: 'codellama',
        },
        {
          taskType: 'analysis',
          preferredProvider: 'ollama',
          preferredModel: 'llama3.1',
        },
        {
          taskType: 'documentation',
          preferredProvider: 'ollama',
          preferredModel: 'llama3.1',
        },
        {
          taskType: 'general',
          preferredProvider: 'ollama',
          preferredModel: 'llama3.1',
        },
      ],
      cache: {
        enabled: true,
        maxEntries: 1000,
        ttl: 3600000, // 1 hour
        strategy: 'lru',
      },
    },
    
    tony: {
      enabled: true,
      personas: true,
      upp: true,
      multiAgent: true,
      maxConcurrentAgents: 3, // Conservative for local
    },
    
    monitoring: {
      metrics: true,
      logging: 'info',
      telemetry: false, // Privacy-first
    },
  },

  /**
   * Hybrid Mode - Intelligent Routing (Default)
   * Smart balance between local and cloud
   */
  hybrid: {
    mode: 'hybrid',
    version: '1.0.0',
    
    mcp: {
      port: 3456,
      autoStart: true,
      features: {
        tony: true,
        orchestration: true,
        streaming: true,
        metrics: true,
        health: true,
      },
    },
    
    providers: {
      ollama: {
        enabled: true,
        location: 'local', // Can be overridden to 'remote'
        url: 'http://localhost:11434',
        models: ['auto-detect'],
        priority: 1, // Prefer local
        timeout: 30000,
        retries: 2,
        healthCheckInterval: 60000,
      },
      claude: {
        enabled: true,
        access: 'subscription',
        fallbackToApi: true,
        priority: 2,
        maxConcurrency: 5,
        timeout: 60000,
        retries: 2,
      },
      openrouter: {
        enabled: false, // Can be enabled as needed
        apiKey: '',
        models: ['auto'],
        priority: 3,
      },
    },
    
    routing: {
      strategy: 'intelligent',
      preferLocal: true,
      costOptimization: true,
      performanceTracking: true,
      fallbackChain: ['ollama', 'claude', 'openrouter'],
      rules: [
        {
          taskType: 'code',
          preferredProvider: 'ollama',
          preferredModel: 'codellama',
        },
        {
          taskType: 'analysis',
          complexity: 4,
          preferredProvider: 'claude',
          preferredModel: 'claude-3-sonnet',
        },
        {
          taskType: 'analysis',
          complexity: 3,
          preferredProvider: 'ollama',
          preferredModel: 'llama3.1',
        },
        {
          taskType: 'documentation',
          preferredProvider: 'ollama',
          preferredModel: 'llama3.1',
        },
        {
          contextLength: 8000,
          preferredProvider: 'claude',
          preferredModel: 'claude-3-sonnet',
        },
      ],
      cache: {
        enabled: true,
        maxEntries: 2000,
        ttl: 7200000, // 2 hours
        strategy: 'lru',
      },
    },
    
    tony: {
      enabled: true,
      personas: true,
      upp: true,
      multiAgent: true,
      maxConcurrentAgents: 5,
    },
    
    monitoring: {
      metrics: true,
      logging: 'info',
      telemetry: false, // User choice
    },
  },

  /**
   * Cloud Mode - Maximum Capability
   * Cloud-first with local fallback
   */
  cloud: {
    mode: 'cloud',
    version: '1.0.0',
    
    mcp: {
      port: 3456,
      autoStart: true,
      features: {
        tony: true,
        orchestration: true,
        streaming: true,
        metrics: true,
        health: true,
      },
    },
    
    providers: {
      claude: {
        enabled: true,
        access: 'api', // API-first for cloud mode
        fallbackToApi: false,
        priority: 1, // Prefer cloud
        maxConcurrency: 10,
        timeout: 120000,
        retries: 3,
      },
      openrouter: {
        enabled: true,
        apiKey: '',
        priority: 2,
        models: ['auto'],
        timeout: 60000,
        retries: 2,
      },
      ollama: {
        enabled: true,
        location: 'local',
        url: 'http://localhost:11434',
        models: ['auto-detect'],
        priority: 3, // Fallback only
        timeout: 30000,
        retries: 1,
      },
    },
    
    routing: {
      strategy: 'intelligent',
      preferLocal: false, // Prefer cloud
      costOptimization: false, // Performance first
      performanceTracking: true,
      fallbackChain: ['claude', 'openrouter', 'ollama'],
      rules: [
        {
          taskType: 'code',
          complexity: 4,
          preferredProvider: 'claude',
          preferredModel: 'claude-3-opus',
        },
        {
          taskType: 'code',
          complexity: 3,
          preferredProvider: 'claude',
          preferredModel: 'claude-3-sonnet',
        },
        {
          taskType: 'analysis',
          preferredProvider: 'claude',
          preferredModel: 'claude-3-opus',
        },
        {
          taskType: 'documentation',
          preferredProvider: 'claude',
          preferredModel: 'claude-3-sonnet',
        },
        {
          contextLength: 32000,
          preferredProvider: 'claude',
          preferredModel: 'claude-3-opus',
        },
      ],
      cache: {
        enabled: true,
        maxEntries: 5000,
        ttl: 14400000, // 4 hours
        strategy: 'lru',
      },
    },
    
    tony: {
      enabled: true,
      personas: true,
      upp: true,
      multiAgent: true,
      maxConcurrentAgents: 10, // Maximum capability
    },
    
    monitoring: {
      metrics: true,
      logging: 'info',
      telemetry: true, // Enhanced monitoring
      exporters: [
        {
          type: 'prometheus',
          endpoint: 'http://localhost:9090',
        },
      ],
      retention: {
        metrics: '30d',
        logs: '7d',
        traces: '7d',
      },
    },
  },
};

/**
 * Get default configuration for a specific mode
 */
export function getModeDefaults(mode: 'local' | 'hybrid' | 'cloud'): Partial<MosaicConfig> {
  return MODE_DEFAULTS[mode];
}

/**
 * Merge mode defaults with user configuration
 */
export function mergeWithDefaults(
  userConfig: Partial<MosaicConfig>,
  mode: 'local' | 'hybrid' | 'cloud'
): MosaicConfig {
  const defaults = getModeDefaults(mode);
  
  return deepMerge(defaults, userConfig) as MosaicConfig;
}

/**
 * Deep merge utility for configuration objects
 */
function deepMerge(target: any, source: any): any {
  if (!source) return target;
  if (!target) return source;
  
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}