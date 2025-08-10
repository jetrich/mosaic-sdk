/**
 * Provider Registry Implementation
 * Manages multiple AI providers and their factories
 */

import {
  ProviderRegistry as IProviderRegistry,
  ProviderFactory,
  Provider,
  ProviderConfig,
} from '../interfaces/Provider';

export class ProviderRegistry implements IProviderRegistry {
  private factories: Map<string, ProviderFactory> = new Map();
  private providers: Map<string, Provider> = new Map();

  register(factory: ProviderFactory): void {
    const type = factory.getType();
    
    if (this.factories.has(type)) {
      throw new Error(`Provider factory for type '${type}' already registered`);
    }
    
    this.factories.set(type, factory);
  }

  unregister(type: string): void {
    this.factories.delete(type);
    
    // Dispose and remove any providers of this type
    const providersToRemove = Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.name === type);
      
    for (const [key, provider] of providersToRemove) {
      provider.dispose().catch(console.error);
      this.providers.delete(key);
    }
  }

  async createProvider(config: ProviderConfig): Promise<Provider> {
    const factory = this.factories.get(config.name);
    
    if (!factory) {
      throw new Error(`No factory registered for provider type '${config.name}'`);
    }

    const provider = await factory.create(config);
    
    // Store provider with a unique key (name + instance counter if needed)
    const key = this.generateProviderKey(config.name);
    this.providers.set(key, provider);
    
    return provider;
  }

  getAvailableTypes(): string[] {
    return Array.from(this.factories.keys());
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): Provider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get provider by name
   */
  getProvider(name: string): Provider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get providers by type
   */
  getProvidersByType(type: string): Provider[] {
    return Array.from(this.providers.values())
      .filter(provider => provider.name === type);
  }

  /**
   * Remove a specific provider instance
   */
  async removeProvider(key: string): Promise<void> {
    const provider = this.providers.get(key);
    
    if (provider) {
      await provider.dispose();
      this.providers.delete(key);
    }
  }

  /**
   * Get health status of all providers
   */
  async getProvidersHealth(): Promise<Record<string, any>> {
    const health: Record<string, any> = {};
    
    for (const [key, provider] of this.providers) {
      try {
        health[key] = await provider.getStatus();
      } catch (error) {
        health[key] = {
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
          last_checked: new Date(),
        };
      }
    }
    
    return health;
  }

  /**
   * Get provider statistics
   */
  getProviderStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [key, provider] of this.providers) {
      stats[key] = {
        name: provider.name,
        type: provider.type,
        capabilities: provider.getCapabilities(),
      };
    }
    
    return stats;
  }

  /**
   * Dispose all providers and clean up
   */
  async dispose(): Promise<void> {
    const disposePromises = Array.from(this.providers.values())
      .map(provider => provider.dispose().catch(console.error));
      
    await Promise.all(disposePromises);
    
    this.providers.clear();
    this.factories.clear();
  }

  private generateProviderKey(type: string): string {
    const existingKeys = Array.from(this.providers.keys())
      .filter(key => key.startsWith(type));
      
    if (existingKeys.length === 0) {
      return type;
    }
    
    return `${type}-${existingKeys.length}`;
  }
}

/**
 * Global provider registry instance
 */
let globalRegistry: ProviderRegistry | null = null;

export function getGlobalProviderRegistry(): ProviderRegistry {
  if (!globalRegistry) {
    globalRegistry = new ProviderRegistry();
  }
  return globalRegistry;
}

/**
 * Reset global registry (useful for testing)
 */
export function resetGlobalProviderRegistry(): void {
  if (globalRegistry) {
    globalRegistry.dispose().catch(console.error);
    globalRegistry = null;
  }
}