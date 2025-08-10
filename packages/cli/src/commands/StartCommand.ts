/**
 * Start Command - Launch MosAIc Stack Services
 * Manages MCP server and provider initialization
 */

import chalk from 'chalk';
import ora from 'ora';
import { spawn, ChildProcess } from 'child_process';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

import { loadConfig } from '@mosaicstack/config';
import type { MosaicConfig } from '@mosaicstack/config';
import { TelemetryService } from '../utils/TelemetryService';

export interface StartOptions {
  config?: string;
  port?: string;
  daemon?: boolean;
  dev?: boolean;
}

export interface StopOptions {
  force?: boolean;
}

export interface LogsOptions {
  follow?: boolean;
  lines?: string;
}

export interface ResetOptions {
  hard?: boolean;
}

export class StartCommand {
  private pidFile = join(homedir(), '.mosaic', 'mosaic.pid');
  private logFile = join(homedir(), '.mosaic', 'mosaic.log');

  constructor(private telemetryService?: TelemetryService) {}

  async execute(options: StartOptions) {
    console.log(chalk.blue.bold('🚀 Starting MosAIc Stack'));
    console.log();

    try {
      // Load configuration
      const config = await this.loadConfiguration(options);
      
      // Validate prerequisites
      await this.validatePrerequisites(config);
      
      // Check if already running
      if (this.isRunning()) {
        console.log(chalk.yellow('⚠️  MosAIc Stack is already running'));
        console.log(chalk.gray('Use "mosaic stop" to stop, or "mosaic status" for details'));
        return;
      }

      // Start services
      await this.startServices(config, options);

      // Track startup event
      if (this.telemetryService) {
        await this.telemetryService.trackStartup('0.1.0', config.mode);
      }
      
      // Success message
      console.log();
      console.log(chalk.green.bold('✅ MosAIc Stack started successfully!'));
      console.log();
      console.log(chalk.blue('Service Information:'));
      console.log(chalk.gray(`  MCP Server: http://localhost:${config.mcp.port}`));
      console.log(chalk.gray(`  Mode: ${config.mode}`));
      console.log(chalk.gray(`  Tony Framework: ${config.tony.enabled ? 'enabled' : 'disabled'}`));
      console.log();
      console.log(chalk.blue('Management Commands:'));
      console.log(chalk.gray('  mosaic status    - Check status'));
      console.log(chalk.gray('  mosaic stop      - Stop services'));
      console.log(chalk.gray('  mosaic dev logs  - View logs'));
      console.log();

    } catch (error) {
      console.error(chalk.red('❌ Failed to start MosAIc Stack:'), (error as Error).message);
      process.exit(1);
    }
  }

  async stop(options: StopOptions) {
    console.log(chalk.blue.bold('🛑 Stopping MosAIc Stack'));
    console.log();

    const spinner = ora('Checking status...').start();

    try {
      if (!this.isRunning()) {
        spinner.warn('MosAIc Stack is not running');
        return;
      }

      const pid = this.getPid();
      if (!pid) {
        spinner.warn('No PID found, cleaning up...');
        this.cleanup();
        return;
      }

      spinner.text = 'Stopping services...';

      try {
        // Try graceful shutdown first
        process.kill(pid, 'SIGTERM');
        
        // Wait for graceful shutdown
        await this.waitForShutdown(pid, 10000);
        
        spinner.succeed('MosAIc Stack stopped gracefully');
      } catch (error) {
        if (options.force) {
          spinner.text = 'Force stopping...';
          try {
            process.kill(pid, 'SIGKILL');
            spinner.succeed('MosAIc Stack force stopped');
          } catch {
            spinner.warn('Process not found, cleaning up...');
          }
        } else {
          spinner.fail('Failed to stop gracefully');
          console.log(chalk.yellow('Use --force to force stop'));
          return;
        }
      }

      // Cleanup
      this.cleanup();

    } catch (error) {
      spinner.fail('Error stopping MosAIc Stack');
      console.error(chalk.red('Error:'), (error as Error).message);
      process.exit(1);
    }
  }

  async logs(options: LogsOptions) {
    console.log(chalk.blue.bold('📝 MosAIc Stack Logs'));
    console.log();

    if (!existsSync(this.logFile)) {
      console.log(chalk.yellow('No log file found'));
      console.log(chalk.gray('Start MosAIc Stack to generate logs: mosaic start'));
      return;
    }

    try {
      if (options.follow) {
        // Follow logs in real-time
        console.log(chalk.gray('Following logs (Ctrl+C to exit)...'));
        console.log();
        
        const tail = spawn('tail', ['-f', this.logFile], { stdio: 'inherit' });
        
        process.on('SIGINT', () => {
          tail.kill();
          process.exit(0);
        });
      } else {
        // Show recent logs
        const lines = parseInt(options.lines || '50');
        const content = readFileSync(this.logFile, 'utf8');
        const logLines = content.split('\n').slice(-lines).join('\n');
        console.log(logLines);
      }
    } catch (error) {
      console.error(chalk.red('Error reading logs:'), (error as Error).message);
      process.exit(1);
    }
  }

  async reset(options: ResetOptions) {
    console.log(chalk.blue.bold('🔄 Resetting MosAIc Stack'));
    console.log();

    if (options.hard) {
      console.log(chalk.red.bold('⚠️  HARD RESET WARNING'));
      console.log(chalk.red('This will remove ALL data including:'));
      console.log(chalk.red('  - Database files'));
      console.log(chalk.red('  - Log files'));
      console.log(chalk.red('  - Cache data'));
      console.log(chalk.red('  - Configuration will be preserved'));
      console.log();

      // Confirmation for hard reset
      const inquirer = await import('inquirer');
      const { confirm } = await inquirer.default.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to perform a hard reset?',
        default: false,
      }]);

      if (!confirm) {
        console.log(chalk.gray('Reset cancelled'));
        return;
      }
    }

    const spinner = ora('Resetting environment...').start();

    try {
      // Stop if running
      if (this.isRunning()) {
        spinner.text = 'Stopping services...';
        await this.stop({ force: true });
      }

      spinner.text = 'Cleaning up files...';
      
      // Remove runtime files
      const mosaicDir = join(homedir(), '.mosaic');
      const filesToRemove = [
        join(mosaicDir, 'mosaic.pid'),
        join(mosaicDir, 'mosaic.log'),
      ];

      if (options.hard) {
        filesToRemove.push(
          join(mosaicDir, 'data', 'mcp.db'),
          join(mosaicDir, 'cache'),
        );
      }

      for (const file of filesToRemove) {
        try {
          const fs = await import('fs/promises');
          await fs.unlink(file);
        } catch {
          // File doesn't exist, ignore
        }
      }

      spinner.succeed('Environment reset complete');
      console.log();
      console.log(chalk.green('✅ MosAIc Stack reset successfully'));
      console.log(chalk.gray('Run "mosaic start" to restart services'));

    } catch (error) {
      spinner.fail('Reset failed');
      console.error(chalk.red('Error:'), (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * Load and validate configuration
   */
  private async loadConfiguration(options: StartOptions): Promise<MosaicConfig> {
    const spinner = ora('Loading configuration...').start();

    try {
      const config = await loadConfig({
        configPath: options.config,
        validateSchema: false, // Skip validation for now
      });

      // Override port if specified
      if (options.port) {
        config.mcp.port = parseInt(options.port);
      }

      spinner.succeed('Configuration loaded');
      return config;
    } catch (error) {
      spinner.fail('Configuration loading failed');
      throw new Error(`Configuration error: ${(error as Error).message}`);
    }
  }

  /**
   * Validate prerequisites before starting
   */
  private async validatePrerequisites(config: MosaicConfig) {
    const spinner = ora('Validating prerequisites...').start();

    try {
      // Check if port is available
      await this.checkPortAvailable(config.mcp.port);

      // Validate enabled providers
      if (config.providers.ollama?.enabled) {
        await this.validateOllama(config.providers.ollama);
      }

      if (config.providers.claude?.enabled) {
        await this.validateClaude(config.providers.claude);
      }

      spinner.succeed('Prerequisites validated');
    } catch (error) {
      spinner.fail('Prerequisites validation failed');
      throw error;
    }
  }

  /**
   * Start MosAIc Stack services
   */
  private async startServices(config: MosaicConfig, options: StartOptions) {
    const spinner = ora('Starting MCP server...').start();

    try {
      // Ensure .mosaic directory exists
      const mosaicDir = join(homedir(), '.mosaic');
      const fs = await import('fs/promises');
      await fs.mkdir(mosaicDir, { recursive: true });

      // Start MCP server
      const serverProcess = await this.startMcpServer(config, options);

      // Save PID for management
      writeFileSync(this.pidFile, serverProcess.pid!.toString());

      spinner.succeed('MCP server started');

      // Initialize providers
      spinner.start('Initializing providers...');
      await this.initializeProviders(config);
      spinner.succeed('Providers initialized');

      // Setup signal handlers for graceful shutdown
      this.setupSignalHandlers();

    } catch (error) {
      spinner.fail('Service startup failed');
      throw error;
    }
  }

  /**
   * Start MCP server process
   */
  private async startMcpServer(config: MosaicConfig, options: StartOptions): Promise<ChildProcess> {
    // This would typically start the actual MCP server
    // For now, we'll simulate it with a placeholder process
    
    const args = [
      '--port', config.mcp.port.toString(),
      '--config', JSON.stringify(config),
    ];

    if (options.dev) {
      args.push('--dev');
    }

    // Placeholder: In real implementation, this would start the MCP server
    const serverProcess = spawn('node', ['-e', `
      console.log('MCP Server starting on port ${config.mcp.port}');
      setInterval(() => {
        console.log('MCP Server heartbeat');
      }, 30000);
    `], {
      detached: options.daemon,
      stdio: options.daemon ? 'ignore' : 'pipe',
    });

    if (options.daemon) {
      serverProcess.unref();
    }

    // Setup logging
    if (serverProcess.stdout) {
      serverProcess.stdout.on('data', (data) => {
        this.appendLog(`[MCP] ${data.toString()}`);
      });
    }

    if (serverProcess.stderr) {
      serverProcess.stderr.on('data', (data) => {
        this.appendLog(`[MCP ERROR] ${data.toString()}`);
      });
    }

    return serverProcess;
  }

  /**
   * Initialize providers based on configuration
   */
  private async initializeProviders(config: MosaicConfig) {
    // Initialize provider registry and create providers
    // This would integrate with @mosaicstack/providers
    
    const enabledProviders = Object.entries(config.providers || {})
      .filter(([, providerConfig]) => providerConfig?.enabled)
      .map(([name]) => name);

    this.appendLog(`Initializing providers: ${enabledProviders.join(', ')}`);
  }

  /**
   * Check if MosAIc Stack is running
   */
  private isRunning(): boolean {
    if (!existsSync(this.pidFile)) {
      return false;
    }

    try {
      const pid = parseInt(readFileSync(this.pidFile, 'utf8'));
      process.kill(pid, 0); // Check if process exists
      return true;
    } catch {
      // Process doesn't exist, clean up stale PID file
      this.cleanup();
      return false;
    }
  }

  /**
   * Get PID from file
   */
  private getPid(): number | null {
    try {
      return parseInt(readFileSync(this.pidFile, 'utf8'));
    } catch {
      return null;
    }
  }

  /**
   * Wait for process to shutdown
   */
  private async waitForShutdown(pid: number, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkInterval = setInterval(() => {
        try {
          process.kill(pid, 0);
          
          if (Date.now() - startTime > timeout) {
            clearInterval(checkInterval);
            reject(new Error('Shutdown timeout'));
          }
        } catch {
          // Process no longer exists
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Cleanup runtime files
   */
  private cleanup() {
    try {
      if (existsSync(this.pidFile)) {
        const fs = require('fs');
        fs.unlinkSync(this.pidFile);
      }
    } catch {
      // Ignore cleanup errors
    }
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers() {
    const gracefulShutdown = () => {
      this.stop({ force: false }).catch(() => {
        process.exit(1);
      });
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  }

  /**
   * Append to log file
   */
  private appendLog(message: string) {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${message}\n`;
      const fs = require('fs');
      fs.appendFileSync(this.logFile, logEntry);
    } catch {
      // Ignore logging errors
    }
  }

  /**
   * Check if port is available
   */
  private async checkPortAvailable(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const net = require('net');
      const server = net.createServer();
      
      server.listen(port, () => {
        server.close(() => resolve());
      });
      
      server.on('error', () => {
        reject(new Error(`Port ${port} is already in use`));
      });
    });
  }

  /**
   * Validate Ollama configuration
   */
  private async validateOllama(config: any): Promise<void> {
    // Placeholder: would check Ollama connectivity
    this.appendLog(`Validating Ollama at ${config.url}`);
  }

  /**
   * Validate Claude configuration
   */
  private async validateClaude(config: any): Promise<void> {
    // Placeholder: would validate Claude access
    this.appendLog(`Validating Claude access: ${config.access}`);
  }
}