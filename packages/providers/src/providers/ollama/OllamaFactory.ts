/**
 * Ollama Provider Factory
 * Creates and configures Ollama provider instances
 */

import { ProviderFactory, Provider, ProviderConfig } from '../../interfaces/Provider';
import { OllamaProvider, OllamaConfig, OLLAMA_MODELS } from './OllamaProvider';

export class OllamaFactory implements ProviderFactory {
  async create(config: ProviderConfig): Promise<Provider> {
    if (config.name !== 'ollama') {
      throw new Error('OllamaFactory can only create Ollama providers');
    }

    const ollamaConfig = config as OllamaConfig;
    
    // Set defaults for Ollama config
    const fullConfig: OllamaConfig = {
      ...ollamaConfig,
      name: ollamaConfig.name || 'ollama',
      type: ollamaConfig.type || 'local',
      enabled: ollamaConfig.enabled !== undefined ? ollamaConfig.enabled : true,
      priority: ollamaConfig.priority || 1,
      host: ollamaConfig.host || 'http://127.0.0.1:11434',
      timeout: ollamaConfig.timeout || 30000,
      retryAttempts: ollamaConfig.retryAttempts || 3,
      healthCheckInterval: ollamaConfig.healthCheckInterval || 60000,
    };

    const provider = new OllamaProvider();
    await provider.initialize(fullConfig);
    
    return provider;
  }

  getType(): string {
    return 'ollama';
  }

  getSupportedModels(): string[] {
    return Object.values(OLLAMA_MODELS);
  }

  /**
   * Create provider with default local configuration
   */
  static createDefault(): Promise<Provider> {
    const factory = new OllamaFactory();
    return factory.create({
      name: 'ollama',
      type: 'local',
      enabled: true,
      priority: 1,
      host: 'http://127.0.0.1:11434',
    });
  }

  /**
   * Create provider with custom host
   */
  static createWithHost(host: string): Promise<Provider> {
    const factory = new OllamaFactory();
    return factory.create({
      name: 'ollama',
      type: 'local',
      enabled: true,
      priority: 1,
      host,
    });
  }
}