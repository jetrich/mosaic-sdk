/**
 * Orchestrator for managing providers across different modes
 */

// Note: ProviderManager would be imported from @mosaicstack/providers when available
// For now, we'll create a minimal interface
import type { ProviderConfig, ProviderStatus, ProviderOrchestrationResult, ProviderHealthCheck } from './types.js';
import type { OperationMode } from '../modes/types.js';

// Minimal ProviderManager interface
interface ProviderManager {
  initialize(): Promise<void>;
}

export class ProviderOrchestrator {
  private providerManager?: ProviderManager;
  private currentMode: OperationMode = 'local';
  private providers: Map<string, ProviderStatus> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;

  /**
   * Initialize the provider orchestrator
   */
  async initialize(mode: OperationMode): Promise<void> {
    this.currentMode = mode;
    // this.providerManager = new ProviderManager(); // Would be instantiated when available
    
    // Load providers based on mode
    await this.loadProvidersForMode(mode);
    
    // Start health monitoring
    this.startHealthMonitoring();
  }

  /**
   * Start provider services
   */
  async start(): Promise<void> {
    try {
      if (this.providerManager) {
        await this.providerManager.initialize();
      }
      
      // Update provider statuses
      await this.updateProviderStatuses();
      
      console.log(`Provider orchestrator started in ${this.currentMode} mode`);
    } catch (error: any) {
      throw new Error(`Failed to start providers: ${error.message}`);
    }
  }

  /**
   * Stop provider services
   */
  async stop(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Stop provider manager
    if (this.providerManager) {
      // Would call stop method if available
    }
    
    console.log('Provider orchestrator stopped');
  }

  /**
   * Reconfigure providers for new mode
   */
  async reconfigure(mode: OperationMode): Promise<void> {
    this.currentMode = mode;
    await this.loadProvidersForMode(mode);
    await this.updateProviderStatuses();
  }

  /**
   * Get provider orchestration status
   */
  async getStatus(): Promise<ProviderOrchestrationResult> {
    const healthChecks = await this.performProviderHealthChecks();
    
    return {
      providers: Array.from(this.providers.values()),
      health: {
        overall: this.calculateOverallHealth(healthChecks),
        checks: healthChecks,
      },
    };
  }

  /**
   * Get available providers for current mode
   */
  getAvailableProviders(): ProviderStatus[] {
    return Array.from(this.providers.values()).filter(p => p.status === 'available');
  }

  /**
   * Load providers based on operation mode
   */
  private async loadProvidersForMode(mode: OperationMode): Promise<void> {
    const providerConfigs = this.getProviderConfigsForMode(mode);
    
    // Clear existing providers
    this.providers.clear();
    
    // Initialize providers based on mode
    for (const config of providerConfigs) {
      const status: ProviderStatus = {
        name: config.name,
        type: config.type,
        status: 'unavailable',
        health: 'unknown',
      };
      
      this.providers.set(config.name, status);
    }
  }

  /**
   * Get provider configurations for specific mode
   */
  private getProviderConfigsForMode(mode: OperationMode): ProviderConfig[] {
    const baseConfigs = [
      {
        name: 'ollama',
        type: 'local' as const,
        enabled: true,
        priority: 1,
        config: {
          baseUrl: 'http://localhost:11434',
          timeout: 30000,
        },
      },
    ];

    switch (mode) {
      case 'local':
        return baseConfigs;

      case 'hybrid':
        return [
          ...baseConfigs,
          {
            name: 'claude',
            type: 'cloud' as const,
            enabled: true,
            priority: 2,
            fallback: 'ollama',
            config: {
              timeout: 10000,
            },
          },
          {
            name: 'openai',
            type: 'cloud' as const,
            enabled: true,
            priority: 3,
            fallback: 'ollama',
            config: {
              timeout: 10000,
            },
          },
        ];

      case 'cloud':
        return [
          {
            name: 'claude',
            type: 'cloud' as const,
            enabled: true,
            priority: 1,
            config: {
              timeout: 10000,
            },
          },
          {
            name: 'openai',
            type: 'cloud' as const,
            enabled: true,
            priority: 2,
            config: {
              timeout: 10000,
            },
          },
          {
            name: 'ollama',
            type: 'local' as const,
            enabled: false,
            priority: 3,
            config: {
              baseUrl: 'http://localhost:11434',
              timeout: 30000,
            },
          },
        ];

      default:
        return baseConfigs;
    }
  }

  /**
   * Update provider statuses
   */
  private async updateProviderStatuses(): Promise<void> {
    for (const [name, provider] of this.providers.entries()) {
      try {
        // Check provider availability
        const isAvailable = await this.checkProviderAvailability(name, provider.type);
        
        const updatedProvider: ProviderStatus = {
          ...provider,
          status: isAvailable ? 'available' : 'unavailable',
          health: isAvailable ? 'healthy' : 'unhealthy',
          lastCheck: new Date().toISOString(),
        };
        
        // Add provider-specific information
        if (isAvailable) {
          switch (name) {
            case 'ollama':
              updatedProvider.models = await this.getOllamaModels();
              break;
            case 'claude':
              updatedProvider.models = ['claude-3-sonnet', 'claude-3-haiku'];
              break;
            case 'openai':
              updatedProvider.models = ['gpt-4', 'gpt-3.5-turbo'];
              break;
          }
        }
        
        this.providers.set(name, updatedProvider);
      } catch (error) {
        const errorProvider: ProviderStatus = {
          ...provider,
          status: 'error',
          health: 'unhealthy',
          error: (error as any).message,
          lastCheck: new Date().toISOString(),
        };
        
        this.providers.set(name, errorProvider);
      }
    }
  }

  /**
   * Check if a specific provider is available
   */
  private async checkProviderAvailability(name: string, type: 'local' | 'cloud'): Promise<boolean> {
    try {
      if (type === 'local' && name === 'ollama') {
        // Check Ollama availability
        const response = await fetch('http://localhost:11434/api/version', {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        return response.ok;
      }
      
      if (type === 'cloud') {
        // For cloud providers, check if API keys are configured
        // This would integrate with @mosaicstack/config
        return true; // Placeholder
      }
      
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get available Ollama models
   */
  private async getOllamaModels(): Promise<string[]> {
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      
      if (!response.ok) {
        return [];
      }
      
      const data: any = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch {
      return [];
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    // Update provider statuses every 60 seconds
    this.healthCheckInterval = setInterval(async () => {
      await this.updateProviderStatuses();
    }, 60000);
  }

  /**
   * Perform health checks for all providers
   */
  private async performProviderHealthChecks(): Promise<ProviderHealthCheck[]> {
    const checks: ProviderHealthCheck[] = [];
    
    for (const [name, provider] of this.providers.entries()) {
      checks.push({
        name: `provider-${name}`,
        status: provider.health === 'healthy' ? 'passing' : 
                provider.health === 'unknown' ? 'warning' : 'failing',
        message: `Provider ${name} (${provider.type}): ${provider.status}`,
        duration: provider.latency,
      });
    }
    
    return checks;
  }

  /**
   * Calculate overall health from provider checks
   */
  private calculateOverallHealth(checks: ProviderHealthCheck[]): 'healthy' | 'degraded' | 'unhealthy' {
    const failing = checks.filter(c => c.status === 'failing').length;
    const warning = checks.filter(c => c.status === 'warning').length;
    
    if (failing > 0) {
      return 'unhealthy';
    } else if (warning > 0) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }
}