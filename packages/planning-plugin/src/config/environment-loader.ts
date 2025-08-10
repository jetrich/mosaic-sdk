/**
 * Environment Configuration Loader
 * Processes MCP environment variables from .claude.json for intelligent routing
 * Part of the unified MosAIc Planning Plugin routing system
 */

import { RoutingPreferences } from '../types/routing';
import { PlanningAgentConfig } from '../agents/base/UnifiedPlanningAgent';

export interface RoutingConfiguration {
  strategy: 'local-first' | 'remote-first' | 'local-only' | 'remote-only' | 'hybrid';
  models: {
    coding: string;
    general: string;
    fallback: string;
  };
  endpoints: {
    ollama: string;
    remote: string;
  };
  planningMode: 'local' | 'remote' | 'hybrid';
}

/**
 * Environment Configuration Loader
 * Reads MCP environment variables from process.env and converts them
 * into routing configurations for the planning system
 */
export class EnvironmentConfigLoader {
  private static instance: EnvironmentConfigLoader;

  private constructor() {}

  public static getInstance(): EnvironmentConfigLoader {
    if (!EnvironmentConfigLoader.instance) {
      EnvironmentConfigLoader.instance = new EnvironmentConfigLoader();
    }
    return EnvironmentConfigLoader.instance;
  }

  /**
   * Load routing configuration from MCP environment variables
   * These are set in .claude.json under the mosaic MCP server env section
   */
  public loadRoutingConfiguration(): RoutingConfiguration {
    const config: RoutingConfiguration = {
      strategy: this.getRoutingStrategy(),
      models: {
        coding: process.env.MOSAIC_CODING_MODEL || 'codellama:7b',
        general: process.env.MOSAIC_GENERAL_MODEL || 'llama3.2:3b', 
        fallback: process.env.MOSAIC_FALLBACK_MODEL || 'gpt-oss'
      },
      endpoints: {
        ollama: process.env.MOSAIC_OLLAMA_URL || 'http://localhost:11434',
        remote: process.env.MOSAIC_REMOTE_API || 'claude'
      },
      planningMode: this.getPlanningMode()
    };

    this.logConfiguration(config);
    return config;
  }

  /**
   * Convert routing configuration to RoutingPreferences for TaskRouter
   */
  public toRoutingPreferences(config: RoutingConfiguration): RoutingPreferences {
    return {
      prefer_local: config.strategy === 'local-first' || config.strategy === 'local-only',
      prefer_fast: config.models.general.includes('3b') || config.models.general.includes('1b'),
      max_response_time: this.getMaxResponseTime(config.strategy),
      fallback_enabled: config.strategy !== 'local-only' && config.strategy !== 'remote-only'
    };
  }

  /**
   * Convert routing configuration to PlanningAgentConfig
   */
  public toPlanningAgentConfig(
    agentType: string,
    config: RoutingConfiguration,
    baseConfig: Partial<PlanningAgentConfig> = {}
  ): PlanningAgentConfig {
    return {
      ...baseConfig,
      agentType,
      serviceName: agentType,
      baseUrl: baseConfig.baseUrl || 'http://localhost:3456',
      processingStrategy: this.mapStrategyToPlanningStrategy(config.strategy),
      mcpRouting: {
        preferLocal: config.strategy.includes('local'),
        fallbackChain: this.buildFallbackChain(config),
        timeout: 30000 // 30 seconds
      },
      domainConfigs: baseConfig.domainConfigs || {},
      modelPreferences: {
        code: [config.models.coding, config.models.fallback],
        analysis: [config.models.general, config.models.fallback], 
        planning: [config.models.general, config.models.fallback],
        general: [config.models.general, config.models.fallback]
      }
    };
  }

  /**
   * Get current routing strategy from environment
   */
  private getRoutingStrategy(): RoutingConfiguration['strategy'] {
    const strategy = process.env.MOSAIC_ROUTING_STRATEGY;
    const validStrategies = ['local-first', 'remote-first', 'local-only', 'remote-only', 'hybrid'];
    
    if (strategy && validStrategies.includes(strategy)) {
      return strategy as RoutingConfiguration['strategy'];
    }
    
    return 'local-first'; // Default to local-first
  }

  /**
   * Get planning mode from environment
   */
  private getPlanningMode(): 'local' | 'remote' | 'hybrid' {
    const mode = process.env.MOSAIC_PLANNING_MODE;
    if (mode === 'local' || mode === 'remote' || mode === 'hybrid') {
      return mode;
    }
    return 'hybrid'; // Default
  }

  /**
   * Map routing strategy to planning agent processing strategy
   */
  private mapStrategyToPlanningStrategy(
    strategy: RoutingConfiguration['strategy']
  ): PlanningAgentConfig['processingStrategy'] {
    switch (strategy) {
      case 'local-first':
      case 'hybrid':
        return 'local-first';
      case 'remote-first':
        return 'remote-first';
      case 'local-only':
        return 'local-only';
      case 'remote-only':
        return 'remote-only';
      default:
        return 'local-first';
    }
  }

  /**
   * Build fallback chain based on configuration
   */
  private buildFallbackChain(config: RoutingConfiguration): string[] {
    const chain: string[] = [];
    
    if (config.strategy.includes('local')) {
      chain.push('ollama', config.models.general);
    }
    
    if (config.strategy !== 'local-only') {
      chain.push(config.endpoints.remote, config.models.fallback);
    }
    
    return chain;
  }

  /**
   * Get maximum response time based on strategy
   */
  private getMaxResponseTime(strategy: RoutingConfiguration['strategy']): number {
    switch (strategy) {
      case 'local-first':
      case 'local-only':
        return 45; // Local models can be slower
      case 'remote-first':
      case 'remote-only':
        return 30; // Remote APIs are typically faster
      case 'hybrid':
        return 60; // Allow time for fallback
      default:
        return 45;
    }
  }

  /**
   * Log the loaded configuration for debugging
   */
  private logConfiguration(config: RoutingConfiguration): void {
    console.log('[ENVIRONMENT_CONFIG] Loaded routing configuration:', {
      strategy: config.strategy,
      planningMode: config.planningMode,
      models: config.models,
      endpoints: config.endpoints
    });
  }

  /**
   * Check if all required environment variables are set
   */
  public validateEnvironment(): { valid: boolean; missing: string[] } {
    const required = [
      'MOSAIC_ROUTING_STRATEGY',
      'MOSAIC_CODING_MODEL',
      'MOSAIC_GENERAL_MODEL',
      'MOSAIC_FALLBACK_MODEL',
      'MOSAIC_OLLAMA_URL',
      'MOSAIC_PLANNING_MODE'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Get configuration for a specific task type
   */
  public getModelForTaskType(taskType: 'code' | 'analysis' | 'planning' | 'general'): string {
    const config = this.loadRoutingConfiguration();
    
    switch (taskType) {
      case 'code':
        return config.models.coding;
      case 'analysis':
      case 'planning': 
      case 'general':
        return config.models.general;
      default:
        return config.models.general;
    }
  }

  /**
   * Check if local processing is preferred
   */
  public isLocalPreferred(): boolean {
    const config = this.loadRoutingConfiguration();
    return config.strategy === 'local-first' || config.strategy === 'local-only';
  }

  /**
   * Check if fallback is enabled  
   */
  public isFallbackEnabled(): boolean {
    const config = this.loadRoutingConfiguration();
    return config.strategy !== 'local-only' && config.strategy !== 'remote-only';
  }
}

export default EnvironmentConfigLoader;