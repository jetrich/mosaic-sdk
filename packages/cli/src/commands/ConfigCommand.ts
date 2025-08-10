/**
 * Config Command - Configuration Management
 * Handle configuration viewing, validation, and template generation
 */

import chalk from 'chalk';
import { existsSync } from 'fs';
import { 
  loadConfig, 
  validateConfig, 
  getConfigTemplate, 
  saveConfig,
  EnvResolverImpl 
} from '@mosaicstack/config';

export interface ShowOptions {
  json?: boolean;
}

export interface ValidateOptions {
  config?: string;
}

export interface TemplateOptions {
  output?: string;
  format?: 'json' | 'yaml';
}

export class ConfigCommand {
  private envResolver = new EnvResolverImpl();

  /**
   * Show current configuration
   */
  async show(options: ShowOptions) {
    try {
      console.log(chalk.blue.bold('📋 MosAIc Stack Configuration'));
      
      if (!options.json) {
        console.log('═'.repeat(50));
        console.log();
      }

      const config = await loadConfig({ validateSchema: false });

      if (options.json) {
        console.log(JSON.stringify(config, null, 2));
      } else {
        await this.displayConfiguration(config);
      }
    } catch (error) {
      if (options.json) {
        console.log(JSON.stringify({ error: (error as Error).message }, null, 2));
      } else {
        console.error(chalk.red('❌ Error loading configuration:'), (error as Error).message);
        console.log();
        console.log(chalk.yellow('💡 Run "mosaic init" to create a configuration'));
      }
      process.exit(1);
    }
  }

  /**
   * Validate configuration
   */
  async validate(options: ValidateOptions) {
    console.log(chalk.blue.bold('🔍 Configuration Validation'));
    console.log('═'.repeat(40));
    console.log();

    try {
      // Load configuration
      const config = await loadConfig({
        configPath: options.config,
        validateSchema: false, // We'll validate manually
      });

      console.log(chalk.green('✓ Configuration loaded successfully'));
      console.log(`  Mode: ${this.getModeDisplay(config.mode)}`);
      console.log(`  Version: ${chalk.yellow(config.version)}`);
      console.log();

      // Validate structure
      console.log(chalk.cyan('Structural Validation:'));
      const structuralIssues = this.validateStructure(config);
      
      if (structuralIssues.length === 0) {
        console.log(chalk.green('✓ All required sections present'));
      } else {
        structuralIssues.forEach(issue => {
          console.log(chalk.red(`✗ ${issue}`));
        });
      }
      console.log();

      // Validate providers
      console.log(chalk.cyan('Provider Validation:'));
      const providerIssues = this.validateProviders(config);
      
      if (providerIssues.length === 0) {
        console.log(chalk.green('✓ Provider configuration valid'));
      } else {
        providerIssues.forEach(issue => {
          console.log(chalk.yellow(`⚠ ${issue}`));
        });
      }
      console.log();

      // Environment variables
      console.log(chalk.cyan('Environment Variables:'));
      this.validateEnvironmentVariables(config);
      console.log();

      // Mode-specific validation
      console.log(chalk.cyan('Mode-specific Validation:'));
      const modeIssues = this.validateModeSpecific(config);
      
      if (modeIssues.length === 0) {
        console.log(chalk.green(`✓ ${config.mode} mode configuration valid`));
      } else {
        modeIssues.forEach(issue => {
          console.log(chalk.yellow(`⚠ ${issue}`));
        });
      }
      console.log();

      // Summary
      const totalIssues = structuralIssues.length + providerIssues.length + modeIssues.length;
      
      if (totalIssues === 0) {
        console.log(chalk.green.bold('🎉 Configuration is valid!'));
      } else {
        console.log(chalk.yellow.bold(`⚠️  Configuration has ${totalIssues} issue(s)`));
        console.log(chalk.gray('Review the warnings above for optimization suggestions'));
      }

    } catch (error) {
      console.error(chalk.red('❌ Validation failed:'), (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * Generate configuration template
   */
  async template(mode: string, options: TemplateOptions) {
    console.log(chalk.blue.bold('📄 Configuration Template Generation'));
    console.log('═'.repeat(50));
    console.log();

    if (!['local', 'hybrid', 'cloud'].includes(mode)) {
      console.error(chalk.red('❌ Invalid mode:'), mode);
      console.log(chalk.gray('Valid modes: local, hybrid, cloud'));
      process.exit(1);
    }

    try {
      const template = getConfigTemplate(mode as any);
      
      console.log(`Generating ${chalk.cyan(mode)} mode template...`);
      console.log();

      if (options.output) {
        // Save to file
        await saveConfig(template, options.output);
        console.log(chalk.green('✓ Template saved to:'), options.output);
        
        // Show summary
        this.showTemplateSummary(template, mode);
        
        // Generate .env example if needed
        const envVars = this.envResolver.extractEnvVars(template);
        if (envVars.length > 0) {
          const envFile = options.output.replace(/\.(json|yaml|yml)$/, '.env.example');
          const envTemplate = this.envResolver.generateEnvTemplate(template);
          
          const fs = await import('fs/promises');
          await fs.writeFile(envFile, envTemplate);
          
          console.log(chalk.green('✓ Environment template:'), envFile);
          console.log(chalk.gray(`  Required variables: ${envVars.join(', ')}`));
        }
      } else {
        // Display to console
        const format = options.format || 'yaml';
        
        if (format === 'json') {
          console.log(JSON.stringify(template, null, 2));
        } else {
          const yaml = await import('js-yaml');
          console.log(yaml.dump(template, { 
            indent: 2,
            lineWidth: -1,
            noRefs: true,
          }));
        }
      }

    } catch (error) {
      console.error(chalk.red('❌ Template generation failed:'), (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * Display configuration in human-readable format
   */
  private async displayConfiguration(config: any) {
    // General Information
    console.log(chalk.cyan.bold('General'));
    console.log('─'.repeat(20));
    console.log(`Mode: ${this.getModeDisplay(config.mode)}`);
    console.log(`Version: ${chalk.yellow(config.version)}`);
    console.log();

    // MCP Configuration
    console.log(chalk.cyan.bold('MCP Server'));
    console.log('─'.repeat(20));
    console.log(`Port: ${chalk.yellow(config.mcp.port)}`);
    console.log(`Auto Start: ${config.mcp.autoStart ? chalk.green('Yes') : chalk.red('No')}`);
    console.log(`Features: ${Object.entries(config.mcp.features)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name)
      .join(', ')}`);
    console.log();

    // Providers
    console.log(chalk.cyan.bold('Providers'));
    console.log('─'.repeat(20));
    
    if (config.providers) {
      for (const [name, providerConfig] of Object.entries(config.providers)) {
        if (typeof providerConfig === 'object' && providerConfig !== null) {
          const enabled = (providerConfig as any).enabled;
          const icon = enabled ? '🟢' : '🔴';
          const status = enabled ? chalk.green('Enabled') : chalk.red('Disabled');
          
          console.log(`${icon} ${name}: ${status}`);
          
          if (enabled) {
            this.displayProviderDetails(name, providerConfig);
          }
        }
      }
    } else {
      console.log(chalk.gray('No providers configured'));
    }
    console.log();

    // Routing
    console.log(chalk.cyan.bold('Routing'));
    console.log('─'.repeat(20));
    console.log(`Strategy: ${chalk.yellow(config.routing.strategy)}`);
    console.log(`Prefer Local: ${config.routing.preferLocal ? chalk.green('Yes') : chalk.red('No')}`);
    console.log(`Cost Optimization: ${config.routing.costOptimization ? chalk.green('Yes') : chalk.red('No')}`);
    console.log(`Fallback Chain: ${config.routing.fallbackChain.join(' → ')}`);
    console.log();

    // Tony Framework
    console.log(chalk.cyan.bold('Tony Framework'));
    console.log('─'.repeat(20));
    console.log(`Enabled: ${config.tony.enabled ? chalk.green('Yes') : chalk.red('No')}`);
    if (config.tony.enabled) {
      console.log(`Personas: ${config.tony.personas ? chalk.green('Yes') : chalk.red('No')}`);
      console.log(`UPP: ${config.tony.upp ? chalk.green('Yes') : chalk.red('No')}`);
      console.log(`Multi-Agent: ${config.tony.multiAgent ? chalk.green('Yes') : chalk.red('No')}`);
      console.log(`Max Agents: ${chalk.yellow(config.tony.maxConcurrentAgents)}`);
    }
    console.log();

    // Monitoring
    console.log(chalk.cyan.bold('Monitoring'));
    console.log('─'.repeat(20));
    console.log(`Metrics: ${config.monitoring.metrics ? chalk.green('Yes') : chalk.red('No')}`);
    console.log(`Logging: ${chalk.yellow(config.monitoring.logging)}`);
    console.log(`Telemetry: ${config.monitoring.telemetry ? chalk.green('Yes') : chalk.red('No')}`);
  }

  /**
   * Display provider-specific details
   */
  private displayProviderDetails(name: string, config: any) {
    const details = [];
    
    switch (name) {
      case 'ollama':
        details.push(`Location: ${config.location}`);
        details.push(`URL: ${config.url}`);
        break;
      case 'claude':
        details.push(`Access: ${config.access}`);
        if (config.fallbackToApi) {
          details.push('Fallback: API');
        }
        break;
      case 'openrouter':
        details.push(`Models: ${Array.isArray(config.models) ? config.models.join(', ') : config.models}`);
        break;
    }
    
    if (details.length > 0) {
      console.log(`  ${chalk.gray(details.join(', '))}`);
    }
  }

  /**
   * Validate configuration structure
   */
  private validateStructure(config: any): string[] {
    const issues = [];
    const required = ['mode', 'version', 'mcp', 'providers', 'routing', 'tony', 'monitoring'];
    
    for (const field of required) {
      if (!(field in config)) {
        issues.push(`Missing required field: ${field}`);
      }
    }
    
    return issues;
  }

  /**
   * Validate providers configuration
   */
  private validateProviders(config: any): string[] {
    const issues = [];
    
    if (!config.providers) {
      return ['No providers configured'];
    }

    const enabledProviders = Object.entries(config.providers)
      .filter(([, providerConfig]) => (providerConfig as any)?.enabled)
      .map(([name]) => name);

    if (enabledProviders.length === 0) {
      issues.push('No providers enabled');
    }

    // Mode-specific provider validation
    if (config.mode === 'local' && !enabledProviders.includes('ollama')) {
      issues.push('Local mode requires Ollama provider');
    }

    if (config.mode === 'cloud' && !enabledProviders.some(p => ['claude', 'openrouter'].includes(p))) {
      issues.push('Cloud mode requires at least one cloud provider (Claude or OpenRouter)');
    }

    return issues;
  }

  /**
   * Validate environment variables
   */
  private validateEnvironmentVariables(config: any) {
    const envVars = this.envResolver.extractEnvVars(config);
    const { missing, available } = this.envResolver.validateEnvVars(config);

    console.log(`Total variables: ${chalk.yellow(envVars.length)}`);
    console.log(`Available: ${chalk.green(available.length)}`);
    
    if (missing.length > 0) {
      console.log(`Missing: ${chalk.red(missing.length)}`);
      missing.forEach(varName => {
        console.log(chalk.red(`  ✗ ${varName}`));
      });
    } else if (envVars.length > 0) {
      console.log(chalk.green('✓ All environment variables available'));
    } else {
      console.log(chalk.gray('No environment variables required'));
    }
  }

  /**
   * Validate mode-specific configuration
   */
  private validateModeSpecific(config: any): string[] {
    const issues = [];
    
    switch (config.mode) {
      case 'local':
        if (config.providers?.claude?.enabled) {
          issues.push('Claude provider enabled in local mode (reduces privacy)');
        }
        if (config.routing?.preferLocal === false) {
          issues.push('Local mode should prefer local providers');
        }
        break;
        
      case 'cloud':
        if (config.routing?.preferLocal === true) {
          issues.push('Cloud mode should prefer cloud providers for performance');
        }
        if (!config.providers?.claude?.enabled && !config.providers?.openrouter?.enabled) {
          issues.push('Cloud mode should have at least one cloud provider enabled');
        }
        break;
    }
    
    return issues;
  }

  /**
   * Show template summary
   */
  private showTemplateSummary(template: any, mode: string) {
    console.log();
    console.log(chalk.blue('Template Summary:'));
    console.log(`  Mode: ${this.getModeDisplay(mode)}`);
    console.log(`  MCP Port: ${chalk.yellow(template.mcp.port)}`);
    
    const enabledProviders = Object.entries(template.providers)
      .filter(([, config]) => (config as any)?.enabled)
      .map(([name]) => name);
    
    console.log(`  Providers: ${enabledProviders.join(', ')}`);
    console.log(`  Tony Framework: ${template.tony.enabled ? chalk.green('enabled') : chalk.red('disabled')}`);
    console.log();
  }

  /**
   * Get mode display string
   */
  private getModeDisplay(mode: string): string {
    const modes = {
      local: `${chalk.green('🏠 Local')}`,
      hybrid: `${chalk.blue('🔀 Hybrid')}`,
      cloud: `${chalk.magenta('☁️  Cloud')}`,
    };
    return modes[mode as keyof typeof modes] || chalk.red('Unknown');
  }
}