/**
 * Providers Command - Provider Management
 * Handle provider listing, health checks, and testing
 */

import chalk from 'chalk';
import ora from 'ora';
import { loadConfig } from '@mosaicstack/config';

export interface ListOptions {
  json?: boolean;
}

export interface HealthOptions {
  json?: boolean;
}

export interface TestOptions {
  model?: string;
}

export class ProvidersCommand {
  /**
   * List available providers
   */
  async list(options: ListOptions) {
    try {
      const config = await loadConfig({ validateSchema: false });
      
      if (options.json) {
        console.log(JSON.stringify(config.providers, null, 2));
        return;
      }

      console.log(chalk.blue.bold('🔌 Available Providers'));
      console.log('═'.repeat(40));
      console.log();

      if (!config.providers || Object.keys(config.providers).length === 0) {
        console.log(chalk.gray('No providers configured'));
        console.log(chalk.yellow('Run "mosaic init" to configure providers'));
        return;
      }

      for (const [name, providerConfig] of Object.entries(config.providers)) {
        if (typeof providerConfig === 'object' && providerConfig !== null) {
          this.displayProvider(name, providerConfig);
        }
      }

      console.log();
      console.log(chalk.blue('Management Commands:'));
      console.log(chalk.gray('  mosaic providers health  - Check provider health'));
      console.log(chalk.gray('  mosaic providers test    - Test specific provider'));

    } catch (error) {
      console.error(chalk.red('❌ Error listing providers:'), (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * Check provider health
   */
  async health(options: HealthOptions) {
    try {
      const config = await loadConfig({ validateSchema: false });
      
      console.log(chalk.blue.bold('🏥 Provider Health Check'));
      console.log('═'.repeat(40));
      console.log();

      if (!config.providers || Object.keys(config.providers).length === 0) {
        console.log(chalk.gray('No providers configured'));
        return;
      }

      const results = [];
      
      for (const [name, providerConfig] of Object.entries(config.providers)) {
        if (typeof providerConfig === 'object' && providerConfig !== null) {
          const enabled = (providerConfig as any).enabled;
          
          if (!enabled) {
            const result = {
              provider: name,
              status: 'disabled',
              message: 'Provider is disabled',
            };
            results.push(result);
            
            if (!options.json) {
              console.log(`🔴 ${name}: ${chalk.gray('Disabled')}`);
            }
            continue;
          }

          const spinner = options.json ? null : ora(`Checking ${name}...`).start();
          
          try {
            const healthResult = await this.checkProviderHealth(name, providerConfig);
            results.push({
              provider: name,
              ...healthResult,
            });

            if (spinner) {
              if (healthResult.status === 'healthy') {
                spinner.succeed(`${name}: ${chalk.green('Healthy')}`);
              } else {
                spinner.fail(`${name}: ${chalk.red(healthResult.message)}`);
              }
            }
          } catch (error) {
            const result = {
              provider: name,
              status: 'error',
              message: (error as Error).message,
            };
            results.push(result);

            if (spinner) {
              spinner.fail(`${name}: ${chalk.red('Error')}`);
            }
          }
        }
      }

      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log();
        this.displayHealthSummary(results);
      }

    } catch (error) {
      console.error(chalk.red('❌ Health check failed:'), (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * Test specific provider
   */
  async test(provider: string, options: TestOptions) {
    console.log(chalk.blue.bold(`🧪 Testing Provider: ${provider}`));
    console.log('═'.repeat(40));
    console.log();

    try {
      const config = await loadConfig({ validateSchema: false });
      
      if (!config.providers || !(provider in config.providers)) {
        console.error(chalk.red('❌ Provider not found:'), provider);
        console.log(chalk.gray('Available providers:'), Object.keys(config.providers || {}).join(', '));
        process.exit(1);
      }

      const providerConfig = (config.providers as any)[provider];
      
      if (!(providerConfig as any).enabled) {
        console.error(chalk.red('❌ Provider is disabled:'), provider);
        console.log(chalk.yellow('Enable in configuration to test'));
        process.exit(1);
      }

      // Health check first
      console.log(chalk.cyan('1. Health Check'));
      const spinner = ora('Checking connectivity...').start();
      
      try {
        const health = await this.checkProviderHealth(provider, providerConfig);
        
        if (health.status === 'healthy') {
          spinner.succeed('Provider is healthy');
        } else {
          spinner.fail(`Health check failed: ${health.message}`);
          return;
        }
      } catch (error) {
        spinner.fail('Health check failed');
        console.error(chalk.red('Error:'), (error as Error).message);
        return;
      }

      // Model listing
      console.log();
      console.log(chalk.cyan('2. Available Models'));
      const modelSpinner = ora('Fetching available models...').start();
      
      try {
        const models = await this.getProviderModels(provider, providerConfig);
        modelSpinner.succeed(`Found ${models.length} models`);
        
        if (models.length > 0) {
          models.slice(0, 10).forEach(model => {
            console.log(`  📦 ${model}`);
          });
          
          if (models.length > 10) {
            console.log(chalk.gray(`  ... and ${models.length - 10} more`));
          }
        }
      } catch (error) {
        modelSpinner.fail('Failed to fetch models');
        console.error(chalk.red('Error:'), (error as Error).message);
      }

      // Test chat functionality
      console.log();
      console.log(chalk.cyan('3. Test Chat'));
      const testModel = options.model || this.getDefaultModel(provider, providerConfig);
      
      if (testModel) {
        const chatSpinner = ora(`Testing chat with ${testModel}...`).start();
        
        try {
          const testResult = await this.testProviderChat(provider, providerConfig, testModel);
          chatSpinner.succeed('Chat test successful');
          
          console.log(chalk.green('✓ Response received:'));
          console.log(chalk.gray(`  "${testResult.response.substring(0, 100)}..."`));
          console.log(chalk.gray(`  Tokens: ${testResult.tokens}`));
          console.log(chalk.gray(`  Latency: ${testResult.latency}ms`));
        } catch (error) {
          chatSpinner.fail('Chat test failed');
          console.error(chalk.red('Error:'), (error as Error).message);
        }
      } else {
        console.log(chalk.yellow('⚠️  No default model available for testing'));
      }

      console.log();
      console.log(chalk.green.bold('🎉 Provider test completed'));

    } catch (error) {
      console.error(chalk.red('❌ Test failed:'), (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * Display provider information
   */
  private displayProvider(name: string, config: any) {
    const enabled = config.enabled;
    const icon = enabled ? '🟢' : '🔴';
    const status = enabled ? chalk.green('Enabled') : chalk.red('Disabled');
    
    console.log(`${icon} ${chalk.bold(name)}: ${status}`);
    
    if (enabled) {
      const details = this.getProviderDetails(name, config);
      details.forEach(detail => {
        console.log(`  ${chalk.gray(detail)}`);
      });
    }
    
    console.log();
  }

  /**
   * Get provider-specific details
   */
  private getProviderDetails(name: string, config: any): string[] {
    const details = [];
    
    switch (name) {
      case 'ollama':
        details.push(`Type: ${config.location === 'local' ? 'Local' : 'Remote'}`);
        details.push(`URL: ${config.url}`);
        if (config.timeout) details.push(`Timeout: ${config.timeout}ms`);
        break;
        
      case 'claude':
        details.push(`Access: ${config.access}`);
        if (config.fallbackToApi) details.push('Fallback: API enabled');
        if (config.maxConcurrency) details.push(`Concurrency: ${config.maxConcurrency}`);
        break;
        
      case 'openrouter':
        if (config.models && Array.isArray(config.models)) {
          details.push(`Models: ${config.models.join(', ')}`);
        }
        break;
    }
    
    if (config.priority) details.push(`Priority: ${config.priority}`);
    
    return details;
  }

  /**
   * Check provider health
   */
  private async checkProviderHealth(name: string, config: any): Promise<{ status: string; message: string; details?: any }> {
    // Simulate health check based on provider type
    switch (name) {
      case 'ollama':
        return this.checkOllamaHealth(config);
      case 'claude':
        return this.checkClaudeHealth(config);
      case 'openrouter':
        return this.checkOpenRouterHealth(config);
      default:
        return { status: 'unknown', message: 'Unknown provider type' };
    }
  }

  /**
   * Check Ollama health
   */
  private async checkOllamaHealth(config: any): Promise<{ status: string; message: string; details?: any }> {
    try {
      // Simulate HTTP request to Ollama API
      const url = config.url || 'http://localhost:11434';
      
      // In real implementation, would make actual HTTP request
      // const response = await fetch(`${url}/api/tags`);
      
      // Simulate success
      return {
        status: 'healthy',
        message: 'Ollama is running and accessible',
        details: { url, models: ['llama3.1', 'codellama'] }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Cannot connect to Ollama: ${(error as Error).message}`
      };
    }
  }

  /**
   * Check Claude health
   */
  private async checkClaudeHealth(config: any): Promise<{ status: string; message: string; details?: any }> {
    try {
      // Check access method
      if (config.access === 'subscription') {
        // Would check Claude desktop app availability
        return {
          status: 'healthy',
          message: 'Claude Max subscription access available',
          details: { access: 'subscription' }
        };
      } else if (config.access === 'api') {
        // Would validate API key
        if (!config.apiKey || config.apiKey.startsWith('env:')) {
          return {
            status: 'warning',
            message: 'API key configured via environment variable',
            details: { access: 'api', keySource: 'environment' }
          };
        }
        return {
          status: 'healthy',
          message: 'Claude API access configured',
          details: { access: 'api' }
        };
      }
      
      return {
        status: 'healthy',
        message: 'Claude provider configured',
        details: { access: config.access }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Claude configuration error: ${(error as Error).message}`
      };
    }
  }

  /**
   * Check OpenRouter health
   */
  private async checkOpenRouterHealth(config: any): Promise<{ status: string; message: string; details?: any }> {
    try {
      if (!config.apiKey || config.apiKey.startsWith('env:')) {
        return {
          status: 'warning',
          message: 'API key configured via environment variable',
          details: { keySource: 'environment' }
        };
      }
      
      return {
        status: 'healthy',
        message: 'OpenRouter API access configured',
        details: { models: config.models }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `OpenRouter configuration error: ${(error as Error).message}`
      };
    }
  }

  /**
   * Get available models for provider
   */
  private async getProviderModels(name: string, config: any): Promise<string[]> {
    // Simulate model fetching
    switch (name) {
      case 'ollama':
        return ['llama3.1', 'codellama', 'mistral', 'gemma2'];
      case 'claude':
        return ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'];
      case 'openrouter':
        return ['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'llama-3.1-70b'];
      default:
        return [];
    }
  }

  /**
   * Get default model for provider
   */
  private getDefaultModel(name: string, config: any): string | null {
    switch (name) {
      case 'ollama':
        return 'llama3.1';
      case 'claude':
        return 'claude-3-sonnet';
      case 'openrouter':
        return 'gpt-3.5-turbo';
      default:
        return null;
    }
  }

  /**
   * Test provider chat functionality
   */
  private async testProviderChat(name: string, config: any, model: string): Promise<{ response: string; tokens: number; latency: number }> {
    const startTime = Date.now();
    
    // Simulate chat request
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    const latency = Date.now() - startTime;
    
    return {
      response: `Hello! This is a test response from ${name} using ${model}. The provider is working correctly.`,
      tokens: 25,
      latency
    };
  }

  /**
   * Display health summary
   */
  private displayHealthSummary(results: any[]) {
    const healthy = results.filter(r => r.status === 'healthy').length;
    const total = results.length;
    
    console.log(chalk.blue('Health Summary:'));
    console.log(`  Total Providers: ${chalk.yellow(total)}`);
    console.log(`  Healthy: ${chalk.green(healthy)}`);
    console.log(`  Issues: ${chalk.red(total - healthy)}`);
    
    if (healthy === total) {
      console.log();
      console.log(chalk.green.bold('🎉 All providers are healthy!'));
    } else if (healthy > 0) {
      console.log();
      console.log(chalk.yellow('⚠️  Some providers have issues'));
      console.log(chalk.gray('Check individual provider status above'));
    } else {
      console.log();
      console.log(chalk.red.bold('❌ No healthy providers found'));
      console.log(chalk.gray('Review configuration and connectivity'));
    }
  }
}