/**
 * Claude Provider Factory
 * Creates and configures Claude provider instances
 */

import { ProviderFactory, Provider, ProviderConfig } from '../../interfaces/Provider';
import { ClaudeProvider, ClaudeConfig, CLAUDE_MODELS } from './ClaudeProvider';

export class ClaudeFactory implements ProviderFactory {
  async create(config: ProviderConfig): Promise<Provider> {
    if (config.name !== 'claude') {
      throw new Error('ClaudeFactory can only create Claude providers');
    }

    const claudeConfig = config as ClaudeConfig;
    
    if (!claudeConfig.apiKey) {
      throw new Error('Claude API key is required');
    }

    // Set defaults for Claude config
    const fullConfig: ClaudeConfig = {
      ...claudeConfig,
      name: claudeConfig.name || 'claude',
      type: claudeConfig.type || 'remote',
      enabled: claudeConfig.enabled !== undefined ? claudeConfig.enabled : true,
      priority: claudeConfig.priority || 2,
      apiUrl: claudeConfig.apiUrl || 'https://api.anthropic.com',
      model: claudeConfig.model || CLAUDE_MODELS.SONNET,
      maxTokens: claudeConfig.maxTokens || 4096,
      temperature: claudeConfig.temperature || 0.7,
    };

    const provider = new ClaudeProvider();
    await provider.initialize(fullConfig);
    
    return provider;
  }

  getType(): string {
    return 'claude';
  }

  getSupportedModels(): string[] {
    return Object.values(CLAUDE_MODELS);
  }

  /**
   * Create provider with API key
   */
  static createWithApiKey(apiKey: string, model?: string): Promise<Provider> {
    const factory = new ClaudeFactory();
    return factory.create({
      name: 'claude',
      type: 'remote',
      enabled: true,
      priority: 2,
      apiKey,
      model: model || CLAUDE_MODELS.SONNET,
    });
  }
}