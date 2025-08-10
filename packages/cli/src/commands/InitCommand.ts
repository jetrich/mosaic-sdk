/**
 * Initialize Command - SIBKISS 3-Step Setup
 * Implements the See It Big, Keep It Simple & Straightforward methodology
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { existsSync } from 'fs';
import { join } from 'path';

import { loadConfig, saveConfig, getConfigTemplate, EnvResolverImpl } from '@mosaicstack/config';
import type { OperationMode } from '@mosaicstack/config';
import { TelemetryService } from '../utils/TelemetryService';

export interface InitOptions {
  mode?: OperationMode;
  force?: boolean;
  interactive?: boolean;
}

export class InitCommand {
  private envResolver = new EnvResolverImpl();

  constructor(private telemetryService?: TelemetryService) {}

  async execute(options: InitOptions) {
    console.log(chalk.blue.bold('🚀 MosAIc Stack Initialization'));
    console.log(chalk.gray('SIBKISS Methodology: See It Big, Keep It Simple & Straightforward'));
    console.log();

    // Check for existing configuration
    const existingConfig = this.findExistingConfig();
    if (existingConfig && !options.force) {
      console.log(chalk.yellow('⚠️  Configuration already exists:'), existingConfig);
      
      if (options.interactive !== false) {
        const { proceed } = await inquirer.prompt([{
          type: 'confirm',
          name: 'proceed',
          message: 'Overwrite existing configuration?',
          default: false,
        }]);

        if (!proceed) {
          console.log(chalk.gray('Initialization cancelled.'));
          return;
        }
      } else {
        console.log(chalk.red('Use --force to overwrite existing configuration'));
        return;
      }
    }

    try {
      // Initialize telemetry (get consent if needed)
      if (this.telemetryService && options.interactive !== false) {
        await this.telemetryService.initialize();
      }

      // SIBKISS Step 1: Choose Operation Mode
      const mode = await this.chooseMode(options);
      
      // SIBKISS Step 2: Configure Providers
      const providerConfig = await this.configureProviders(mode, options);
      
      // SIBKISS Step 3: Finalize Configuration
      await this.finalizeConfiguration(mode, providerConfig, options);

      // Track initialization event
      if (this.telemetryService) {
        const enabledProviders = Object.keys(providerConfig).filter(
          p => providerConfig[p]?.enabled
        );
        await this.telemetryService.trackInitialization('0.1.0', mode, enabledProviders);
      }
      
      // Success message
      console.log();
      console.log(chalk.green.bold('✅ MosAIc Stack initialized successfully!'));
      console.log();
      console.log(chalk.blue('Next steps:'));
      console.log(chalk.gray('1. Review your configuration: mosaic config show'));
      console.log(chalk.gray('2. Test your providers: mosaic providers health'));
      console.log(chalk.gray('3. Start MosAIc Stack: mosaic start'));
      console.log();

    } catch (error) {
      console.error(chalk.red('❌ Initialization failed:'), (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * SIBKISS Step 1: Choose Operation Mode
   */
  private async chooseMode(options: InitOptions): Promise<OperationMode> {
    console.log(chalk.cyan.bold('Step 1: Choose Operation Mode'));
    console.log(chalk.gray('Select how you want to run MosAIc Stack:'));
    console.log();

    if (options.mode && options.interactive === false) {
      console.log(chalk.green(`✓ Mode: ${options.mode}`));
      return options.mode;
    }

    const choices = [
      {
        name: `${chalk.green('🏠 Local')} - Complete privacy, Ollama-only operation`,
        value: 'local' as const,
        short: 'Local',
      },
      {
        name: `${chalk.blue('🔀 Hybrid')} - Intelligent routing, local + cloud (Recommended)`,
        value: 'hybrid' as const,
        short: 'Hybrid',
      },
      {
        name: `${chalk.magenta('☁️  Cloud')} - Maximum capability, cloud-first operation`,
        value: 'cloud' as const,
        short: 'Cloud',
      },
    ];

    const { mode } = await inquirer.prompt([{
      type: 'list',
      name: 'mode',
      message: 'Select operation mode:',
      choices,
      default: options.mode || 'hybrid',
    }]);

    console.log();
    this.showModeDetails(mode);
    console.log();

    return mode;
  }

  /**
   * SIBKISS Step 2: Configure Providers
   */
  private async configureProviders(mode: OperationMode, options: InitOptions) {
    console.log(chalk.cyan.bold('Step 2: Configure Providers'));
    console.log(chalk.gray('Set up your AI provider connections:'));
    console.log();

    const config: any = {};

    // Configure Ollama (required for local/hybrid)
    if (mode === 'local' || mode === 'hybrid') {
      config.ollama = await this.configureOllama(mode, options);
    }

    // Configure Claude (required for hybrid/cloud)
    if (mode === 'hybrid' || mode === 'cloud') {
      config.claude = await this.configureClaude(mode, options);
    }

    // Configure OpenRouter (optional for cloud)
    if (mode === 'cloud') {
      config.openrouter = await this.configureOpenRouter(options);
    }

    return config;
  }

  /**
   * SIBKISS Step 3: Finalize Configuration
   */
  private async finalizeConfiguration(
    mode: OperationMode, 
    providerConfig: any, 
    options: InitOptions
  ) {
    console.log(chalk.cyan.bold('Step 3: Finalize Configuration'));
    console.log(chalk.gray('Complete your MosAIc Stack setup:'));
    console.log();

    const spinner = ora('Generating configuration...').start();

    try {
      // Get base template
      const template = getConfigTemplate(mode);
      
      // Apply provider configuration
      if (providerConfig.ollama) {
        Object.assign(template.providers.ollama || {}, providerConfig.ollama);
      }
      if (providerConfig.claude) {
        Object.assign(template.providers.claude || {}, providerConfig.claude);
      }
      if (providerConfig.openrouter) {
        Object.assign(template.providers.openrouter || {}, providerConfig.openrouter);
      }

      // Configure MCP port
      let mcpPort = 3456;
      if (options.interactive !== false) {
        const { port } = await inquirer.prompt([{
          type: 'number',
          name: 'port',
          message: 'MCP server port:',
          default: 3456,
          validate: (value) => {
            if (value < 1024 || value > 65535) {
              return 'Port must be between 1024 and 65535';
            }
            return true;
          },
        }]);
        mcpPort = port;
      }
      template.mcp.port = mcpPort;

      spinner.text = 'Saving configuration...';

      // Save configuration
      const configPath = './mosaic.config.yaml';
      await saveConfig(template, configPath);

      // Generate .env template if needed
      const envVars = this.envResolver.extractEnvVars(template);
      if (envVars.length > 0) {
        const envTemplate = this.envResolver.generateEnvTemplate(template);
        const fs = await import('fs/promises');
        await fs.writeFile('.env.example', envTemplate);
        
        spinner.succeed('Configuration saved');
        console.log();
        console.log(chalk.yellow('📝 Environment variables detected:'));
        console.log(chalk.gray('   Created .env.example with required variables'));
        console.log(chalk.gray('   Copy to .env and set your values:'));
        console.log(chalk.gray('   cp .env.example .env'));
        console.log();
      } else {
        spinner.succeed('Configuration saved');
      }

      console.log(chalk.green(`✓ Configuration: ${configPath}`));
      console.log(chalk.green(`✓ Mode: ${mode}`));
      console.log(chalk.green(`✓ MCP Port: ${mcpPort}`));
      console.log(chalk.green(`✓ Providers: ${Object.keys(providerConfig).join(', ')}`));

    } catch (error) {
      spinner.fail('Configuration failed');
      throw error;
    }
  }

  /**
   * Configure Ollama provider
   */
  private async configureOllama(mode: OperationMode, options: InitOptions) {
    console.log(chalk.yellow('🦙 Configuring Ollama...'));

    if (options.interactive === false) {
      return {
        enabled: true,
        location: 'local',
        url: 'http://localhost:11434',
      };
    }

    const questions = [
      {
        type: 'list',
        name: 'location',
        message: 'Ollama installation:',
        choices: [
          { name: 'Local (localhost:11434)', value: 'local' },
          { name: 'Remote (custom URL)', value: 'remote' },
        ],
        default: 'local',
      },
    ];

    const { location } = await inquirer.prompt(questions);

    let url = 'http://localhost:11434';
    if (location === 'remote') {
      const { customUrl } = await inquirer.prompt([{
        type: 'input',
        name: 'customUrl',
        message: 'Ollama URL:',
        default: 'http://192.168.1.100:11434',
        validate: (value) => {
          try {
            new URL(value);
            return true;
          } catch {
            return 'Please enter a valid URL';
          }
        },
      }]);
      url = customUrl;
    }

    return {
      enabled: true,
      location,
      url,
    };
  }

  /**
   * Configure Claude provider
   */
  private async configureClaude(mode: OperationMode, options: InitOptions) {
    console.log(chalk.blue('🤖 Configuring Claude...'));

    if (options.interactive === false) {
      return {
        enabled: true,
        access: 'subscription',
        fallbackToApi: true,
        apiKey: 'env:ANTHROPIC_API_KEY',
      };
    }

    const { access } = await inquirer.prompt([{
      type: 'list',
      name: 'access',
      message: 'Claude access method:',
      choices: [
        { name: 'Max Subscription (recommended)', value: 'subscription' },
        { name: 'API Key', value: 'api' },
        { name: 'Both (subscription with API fallback)', value: 'both' },
      ],
      default: 'subscription',
    }]);

    let apiKey;
    if (access === 'api' || access === 'both') {
      const { hasKey } = await inquirer.prompt([{
        type: 'confirm',
        name: 'hasKey',
        message: 'Do you have an Anthropic API key?',
        default: false,
      }]);

      if (hasKey) {
        const { keyInput } = await inquirer.prompt([{
          type: 'password',
          name: 'keyInput',
          message: 'Enter your API key (will be stored as environment variable):',
          mask: '*',
        }]);
        apiKey = keyInput;
      } else {
        apiKey = 'env:ANTHROPIC_API_KEY';
        console.log(chalk.yellow('💡 Set ANTHROPIC_API_KEY environment variable later'));
      }
    }

    return {
      enabled: true,
      access,
      fallbackToApi: access === 'both',
      ...(apiKey && { apiKey }),
    };
  }

  /**
   * Configure OpenRouter provider
   */
  private async configureOpenRouter(options: InitOptions) {
    console.log(chalk.magenta('🌐 Configuring OpenRouter (optional)...'));

    if (options.interactive === false) {
      return { enabled: false };
    }

    const { enable } = await inquirer.prompt([{
      type: 'confirm',
      name: 'enable',
      message: 'Enable OpenRouter for additional models?',
      default: false,
    }]);

    if (!enable) {
      return { enabled: false };
    }

    return {
      enabled: true,
      apiKey: 'env:OPENROUTER_API_KEY',
      models: ['auto'],
    };
  }

  /**
   * Show mode details
   */
  private showModeDetails(mode: OperationMode) {
    const details = {
      local: {
        icon: '🏠',
        title: 'Local Mode',
        features: [
          '✓ Complete data privacy',
          '✓ Zero external API calls',
          '✓ Ollama-only operation',
          '✓ Air-gapped capable',
        ],
      },
      hybrid: {
        icon: '🔀',
        title: 'Hybrid Mode',
        features: [
          '✓ Intelligent task routing',
          '✓ Cost optimization',
          '✓ Local preference with cloud fallback',
          '✓ Best of both worlds',
        ],
      },
      cloud: {
        icon: '☁️',
        title: 'Cloud Mode',
        features: [
          '✓ Maximum performance',
          '✓ All provider integrations',
          '✓ Enterprise collaboration',
          '✓ Advanced monitoring',
        ],
      },
    };

    const config = details[mode];
    console.log(chalk.bold(`${config.icon} ${config.title} Selected`));
    config.features.forEach(feature => {
      console.log(chalk.gray(`  ${feature}`));
    });
  }

  /**
   * Find existing configuration file
   */
  private findExistingConfig(): string | null {
    const candidates = [
      'mosaic.config.yaml',
      'mosaic.config.json',
      '.mosaicrc.yaml',
      '.mosaicrc.json',
      '.mosaic/mosaic.config.yaml',
      '.mosaic/mosaic.config.json',
    ];

    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }

    return null;
  }
}