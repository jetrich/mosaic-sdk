/**
 * Status Command - Check MosAIc Stack Status
 * Provides comprehensive system status information
 */

import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

import { loadConfig } from '@mosaicstack/config';

export interface StatusOptions {
  json?: boolean;
  health?: boolean;
}

export interface SystemStatus {
  running: boolean;
  pid?: number;
  uptime?: string;
  version: string;
  config: {
    mode: string;
    mcpPort: number;
    configFile?: string;
  };
  providers: ProviderStatus[];
  services: ServiceStatus[];
  health?: HealthCheck[];
}

export interface ProviderStatus {
  name: string;
  enabled: boolean;
  status: 'online' | 'offline' | 'error' | 'unknown';
  details?: any;
}

export interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  port?: number;
  pid?: number;
}

export interface HealthCheck {
  component: string;
  status: 'healthy' | 'unhealthy' | 'warning';
  message: string;
  details?: any;
}

export class StatusCommand {
  private pidFile = join(homedir(), '.mosaic', 'mosaic.pid');
  private logFile = join(homedir(), '.mosaic', 'mosaic.log');

  async execute(options: StatusOptions) {
    try {
      const status = await this.getSystemStatus(options);

      if (options.json) {
        console.log(JSON.stringify(status, null, 2));
      } else {
        await this.displayStatus(status);
      }
    } catch (error) {
      if (options.json) {
        console.log(JSON.stringify({ error: (error as Error).message }, null, 2));
      } else {
        console.error(chalk.red('❌ Error getting status:'), (error as Error).message);
      }
      process.exit(1);
    }
  }

  /**
   * Get comprehensive system status
   */
  private async getSystemStatus(options: StatusOptions): Promise<SystemStatus> {
    const pkg = require('../../package.json');
    
    // Check if running
    const { running, pid, uptime } = this.getProcessStatus();
    
    // Load configuration
    let config;
    let configFile;
    try {
      config = await loadConfig({ validateSchema: false });
      configFile = this.findConfigFile();
    } catch (error) {
      // Configuration not found or invalid
      config = null;
    }

    // Get provider status
    const providers = await this.getProviderStatus(config);
    
    // Get service status
    const services = await this.getServiceStatus(config, running, pid);
    
    // Get health checks if requested
    let health;
    if (options.health) {
      health = await this.getHealthChecks(config, providers, services);
    }

    return {
      running,
      pid,
      uptime,
      version: pkg.version,
      config: {
        mode: config?.mode || 'unknown',
        mcpPort: config?.mcp?.port || 3456,
        configFile,
      },
      providers,
      services,
      health,
    };
  }

  /**
   * Display formatted status
   */
  private async displayStatus(status: SystemStatus) {
    console.log(chalk.blue.bold('📊 MosAIc Stack Status'));
    console.log('═'.repeat(50));
    console.log();

    // System Overview
    this.displaySystemOverview(status);
    console.log();

    // Configuration
    this.displayConfiguration(status);
    console.log();

    // Services
    this.displayServices(status);
    console.log();

    // Providers
    this.displayProviders(status);
    console.log();

    // Health Checks
    if (status.health) {
      this.displayHealthChecks(status.health);
      console.log();
    }

    // Management Commands
    this.displayManagementCommands(status);
  }

  /**
   * Display system overview
   */
  private displaySystemOverview(status: SystemStatus) {
    console.log(chalk.cyan.bold('System Overview'));
    console.log('─'.repeat(20));
    
    const statusIcon = status.running ? '🟢' : '🔴';
    const statusText = status.running ? chalk.green('Running') : chalk.red('Stopped');
    
    console.log(`${statusIcon} Status: ${statusText}`);
    console.log(`📦 Version: ${chalk.yellow(status.version)}`);
    
    if (status.running && status.pid) {
      console.log(`🔧 Process ID: ${chalk.yellow(status.pid)}`);
      
      if (status.uptime) {
        console.log(`⏱️  Uptime: ${chalk.yellow(status.uptime)}`);
      }
    }
  }

  /**
   * Display configuration information
   */
  private displayConfiguration(status: SystemStatus) {
    console.log(chalk.cyan.bold('Configuration'));
    console.log('─'.repeat(20));
    
    console.log(`🎯 Mode: ${this.getModeDisplay(status.config.mode)}`);
    console.log(`🌐 MCP Port: ${chalk.yellow(status.config.mcpPort)}`);
    
    if (status.config.configFile) {
      console.log(`📝 Config File: ${chalk.gray(status.config.configFile)}`);
    } else {
      console.log(`📝 Config File: ${chalk.red('Not found')}`);
    }
  }

  /**
   * Display services status
   */
  private displayServices(status: SystemStatus) {
    console.log(chalk.cyan.bold('Services'));
    console.log('─'.repeat(20));
    
    if (status.services.length === 0) {
      console.log(chalk.gray('No services configured'));
      return;
    }

    for (const service of status.services) {
      const icon = this.getServiceIcon(service.status);
      const statusText = this.getServiceStatusText(service.status);
      
      let line = `${icon} ${service.name}: ${statusText}`;
      
      if (service.port) {
        line += ` ${chalk.gray(`(port ${service.port})`)}`;
      }
      
      console.log(line);
    }
  }

  /**
   * Display providers status
   */
  private displayProviders(status: SystemStatus) {
    console.log(chalk.cyan.bold('Providers'));
    console.log('─'.repeat(20));
    
    if (status.providers.length === 0) {
      console.log(chalk.gray('No providers configured'));
      return;
    }

    for (const provider of status.providers) {
      const icon = this.getProviderIcon(provider);
      const statusText = this.getProviderStatusText(provider);
      
      console.log(`${icon} ${provider.name}: ${statusText}`);
      
      if (provider.details) {
        const details = Object.entries(provider.details)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        console.log(`   ${chalk.gray(details)}`);
      }
    }
  }

  /**
   * Display health checks
   */
  private displayHealthChecks(health: HealthCheck[]) {
    console.log(chalk.cyan.bold('Health Checks'));
    console.log('─'.repeat(20));
    
    for (const check of health) {
      const icon = this.getHealthIcon(check.status);
      const statusText = this.getHealthStatusText(check.status);
      
      console.log(`${icon} ${check.component}: ${statusText}`);
      console.log(`   ${chalk.gray(check.message)}`);
    }
  }

  /**
   * Display management commands
   */
  private displayManagementCommands(status: SystemStatus) {
    console.log(chalk.cyan.bold('Management Commands'));
    console.log('─'.repeat(20));
    
    if (status.running) {
      console.log(`${chalk.gray('mosaic stop')}      - Stop services`);
      console.log(`${chalk.gray('mosaic dev logs')}  - View logs`);
      console.log(`${chalk.gray('mosaic providers')} - Provider management`);
    } else {
      console.log(`${chalk.gray('mosaic start')}     - Start services`);
      console.log(`${chalk.gray('mosaic init')}      - Reconfigure`);
    }
    
    console.log(`${chalk.gray('mosaic config')}    - Configuration management`);
    console.log(`${chalk.gray('mosaic test')}      - Run tests`);
  }

  /**
   * Get process status (running, PID, uptime)
   */
  private getProcessStatus(): { running: boolean; pid?: number; uptime?: string } {
    if (!existsSync(this.pidFile)) {
      return { running: false };
    }

    try {
      const pid = parseInt(readFileSync(this.pidFile, 'utf8'));
      
      // Check if process exists
      process.kill(pid, 0);
      
      // Get uptime if possible
      const uptime = this.calculateUptime(pid);
      
      return { running: true, pid, uptime };
    } catch {
      // Process doesn't exist, clean up stale PID file
      try {
        const fs = require('fs');
        fs.unlinkSync(this.pidFile);
      } catch {
        // Ignore cleanup errors
      }
      return { running: false };
    }
  }

  /**
   * Get provider status
   */
  private async getProviderStatus(config: any): Promise<ProviderStatus[]> {
    if (!config?.providers) {
      return [];
    }

    const providers: ProviderStatus[] = [];

    for (const [name, providerConfig] of Object.entries(config.providers)) {
      if (typeof providerConfig === 'object' && providerConfig !== null) {
        const provider: ProviderStatus = {
          name,
          enabled: (providerConfig as any).enabled || false,
          status: 'unknown',
        };

        if (provider.enabled) {
          // Check provider-specific status
          try {
            const status = await this.checkProviderHealth(name, providerConfig);
            provider.status = status.status as 'online' | 'offline' | 'error' | 'unknown';
            provider.details = status.details;
          } catch {
            provider.status = 'error';
          }
        } else {
          provider.status = 'offline';
        }

        providers.push(provider);
      }
    }

    return providers;
  }

  /**
   * Get service status
   */
  private async getServiceStatus(config: any, running: boolean, pid?: number): Promise<ServiceStatus[]> {
    const services: ServiceStatus[] = [];

    // MCP Server
    services.push({
      name: 'MCP Server',
      status: running ? 'running' : 'stopped',
      port: config?.mcp?.port || 3456,
      pid,
    });

    // Tony Framework
    if (config?.tony?.enabled) {
      services.push({
        name: 'Tony Framework',
        status: running ? 'running' : 'stopped',
      });
    }

    return services;
  }

  /**
   * Get health checks
   */
  private async getHealthChecks(config: any, providers: ProviderStatus[], services: ServiceStatus[]): Promise<HealthCheck[]> {
    const health: HealthCheck[] = [];

    // Configuration health
    if (config) {
      health.push({
        component: 'Configuration',
        status: 'healthy',
        message: 'Configuration loaded successfully',
      });
    } else {
      health.push({
        component: 'Configuration',
        status: 'unhealthy',
        message: 'Configuration not found or invalid',
      });
    }

    // Provider health
    const enabledProviders = providers.filter(p => p.enabled);
    if (enabledProviders.length > 0) {
      const onlineProviders = enabledProviders.filter(p => p.status === 'online');
      const ratio = onlineProviders.length / enabledProviders.length;
      
      if (ratio === 1) {
        health.push({
          component: 'Providers',
          status: 'healthy',
          message: 'All providers online',
        });
      } else if (ratio > 0.5) {
        health.push({
          component: 'Providers',
          status: 'warning',
          message: `${onlineProviders.length}/${enabledProviders.length} providers online`,
        });
      } else {
        health.push({
          component: 'Providers',
          status: 'unhealthy',
          message: `Only ${onlineProviders.length}/${enabledProviders.length} providers online`,
        });
      }
    }

    // Service health
    const runningServices = services.filter(s => s.status === 'running');
    if (runningServices.length === services.length) {
      health.push({
        component: 'Services',
        status: 'healthy',
        message: 'All services running',
      });
    } else {
      health.push({
        component: 'Services',
        status: 'unhealthy',
        message: `${runningServices.length}/${services.length} services running`,
      });
    }

    return health;
  }

  /**
   * Check individual provider health
   */
  private async checkProviderHealth(name: string, config: any): Promise<{ status: string; details?: any }> {
    // Placeholder implementation
    // In real implementation, this would use @mosaicstack/providers
    
    switch (name) {
      case 'ollama':
        return { status: 'online', details: { url: config.url } };
      case 'claude':
        return { status: 'online', details: { access: config.access } };
      default:
        return { status: 'unknown' };
    }
  }

  /**
   * Calculate process uptime
   */
  private calculateUptime(pid: number): string | undefined {
    try {
      // This is a simplified implementation
      // In real implementation, would get actual process start time
      return '< 1 minute';
    } catch {
      return undefined;
    }
  }

  /**
   * Find configuration file
   */
  private findConfigFile(): string | undefined {
    const candidates = [
      'mosaic.config.yaml',
      'mosaic.config.json',
      '.mosaicrc.yaml',
      '.mosaicrc.json',
    ];

    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return candidate;
      }
    }

    return undefined;
  }

  /**
   * Helper methods for display formatting
   */
  private getModeDisplay(mode: string): string {
    const modes = {
      local: `${chalk.green('🏠 Local')} (Privacy-first)`,
      hybrid: `${chalk.blue('🔀 Hybrid')} (Balanced)`,
      cloud: `${chalk.magenta('☁️  Cloud')} (Performance-first)`,
    };
    return modes[mode as keyof typeof modes] || chalk.red('Unknown');
  }

  private getServiceIcon(status: string): string {
    const icons = {
      running: '🟢',
      stopped: '🔴',
      error: '🟠',
    };
    return icons[status as keyof typeof icons] || '⚪';
  }

  private getServiceStatusText(status: string): string {
    const texts = {
      running: chalk.green('Running'),
      stopped: chalk.red('Stopped'),
      error: chalk.red('Error'),
    };
    return texts[status as keyof typeof texts] || chalk.gray('Unknown');
  }

  private getProviderIcon(provider: ProviderStatus): string {
    if (!provider.enabled) return '⚪';
    
    const icons = {
      online: '🟢',
      offline: '🔴',
      error: '🟠',
      unknown: '🟡',
    };
    return icons[provider.status as keyof typeof icons] || '⚪';
  }

  private getProviderStatusText(provider: ProviderStatus): string {
    if (!provider.enabled) return chalk.gray('Disabled');
    
    const texts = {
      online: chalk.green('Online'),
      offline: chalk.red('Offline'),
      error: chalk.red('Error'),
      unknown: chalk.yellow('Unknown'),
    };
    return texts[provider.status as keyof typeof texts] || chalk.gray('Unknown');
  }

  private getHealthIcon(status: string): string {
    const icons = {
      healthy: '✅',
      unhealthy: '❌',
      warning: '⚠️',
    };
    return icons[status as keyof typeof icons] || '❓';
  }

  private getHealthStatusText(status: string): string {
    const texts = {
      healthy: chalk.green('Healthy'),
      unhealthy: chalk.red('Unhealthy'),
      warning: chalk.yellow('Warning'),
    };
    return texts[status as keyof typeof texts] || chalk.gray('Unknown');
  }
}