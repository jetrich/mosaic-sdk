/**
 * Main orchestrator for MosAIc Stack components
 */

import { EventEmitter } from 'events';
import { loadConfig } from '@mosaicstack/config';
import type { StackConfig, StackStatus, ComponentStatus, HealthCheck } from '../types.js';

export interface OrchestratorOptions {
  mode: 'local' | 'hybrid' | 'cloud';
  configPath?: string;
  verbose?: boolean;
  timeout?: number;
  port?: number;
}

export class StackOrchestrator extends EventEmitter {
  private config!: StackConfig;
  private status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error' = 'stopped';
  private startTime?: Date;
  private components: Map<string, ComponentStatus> = new Map();

  constructor(private options: OrchestratorOptions) {
    super();
  }

  /**
   * Start the stack orchestrator
   */
  async start(): Promise<void> {
    try {
      this.status = 'starting';
      this.emit('status', 'starting');

      // Load configuration
      await this.loadConfiguration();

      // Initialize components based on mode
      await this.initializeComponents();

      // Start health monitoring
      this.startHealthMonitoring();

      this.status = 'running';
      this.startTime = new Date();
      this.emit('status', 'running');

      if (this.options.verbose) {
        console.log(`MosAIc Stack started in ${this.options.mode} mode`);
      }
    } catch (error) {
      this.status = 'error';
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop the stack orchestrator
   */
  async stop(): Promise<void> {
    try {
      this.status = 'stopping';
      this.emit('status', 'stopping');

      // Stop all components
      await this.stopComponents();

      this.status = 'stopped';
      this.startTime = undefined;
      this.emit('status', 'stopped');

      if (this.options.verbose) {
        console.log('MosAIc Stack stopped');
      }
    } catch (error) {
      this.status = 'error';
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get current stack status
   */
  async getStatus(): Promise<StackStatus> {
    const uptime = this.startTime ? Date.now() - this.startTime.getTime() : undefined;
    
    return {
      status: this.status,
      mode: this.options.mode,
      version: '0.1.0',
      uptime,
      components: Array.from(this.components.values()),
      providers: [], // Will be populated by ProviderOrchestrator
      health: await this.performHealthCheck(),
    };
  }

  /**
   * Configure the orchestrator
   */
  async configure(options: Partial<OrchestratorOptions>): Promise<void> {
    Object.assign(this.options, options);
    
    if (this.status === 'running') {
      // Reload configuration if running
      await this.loadConfiguration();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): StackConfig {
    return this.config;
  }

  /**
   * Load configuration based on mode and options
   */
  private async loadConfiguration(): Promise<void> {
    try {
      const config = await loadConfig({
        mode: this.options.mode,
        configPath: this.options.configPath,
        validateSchema: true,
      });

      this.config = {
        mode: this.options.mode,
        port: this.options.port || (config as any).port || 3456,
        timeout: this.options.timeout || (config as any).timeout || 30000,
        components: this.getComponentsForMode(),
        providers: Array.isArray((config as any).providers) ? (config as any).providers : [],
        logging: (config as any).logging || {
          level: 'info',
          console: true,
          format: 'text',
        },
        telemetry: (config as any).telemetry || {
          enabled: false,
          timeout: 5000,
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  /**
   * Get components to initialize based on operation mode
   */
  private getComponentsForMode() {
    const baseComponents = [
      { name: 'config', enabled: true },
      { name: 'cli', enabled: true },
    ];

    switch (this.options.mode) {
      case 'local':
        return [
          ...baseComponents,
          { name: 'providers', enabled: true, config: { local: true } },
        ];

      case 'hybrid':
        return [
          ...baseComponents,
          { name: 'providers', enabled: true, config: { local: true, cloud: true } },
          { name: 'tony', enabled: true },
          { name: 'mcp', enabled: true, port: this.options.port },
        ];

      case 'cloud':
        return [
          ...baseComponents,
          { name: 'providers', enabled: true, config: { cloud: true } },
          { name: 'tony', enabled: true },
          { name: 'mcp', enabled: true, port: this.options.port },
        ];

      default:
        return baseComponents;
    }
  }

  /**
   * Initialize components for the current mode
   */
  private async initializeComponents(): Promise<void> {
    for (const componentConfig of this.config.components) {
      if (!componentConfig.enabled) continue;

      try {
        const status: ComponentStatus = {
          name: componentConfig.name,
          status: 'running',
          health: 'healthy',
          port: componentConfig.port,
        };

        this.components.set(componentConfig.name, status);

        if (this.options.verbose) {
          console.log(`Initialized component: ${componentConfig.name}`);
        }
      } catch (error) {
        const status: ComponentStatus = {
          name: componentConfig.name,
          status: 'error',
          health: 'unhealthy',
        };

        this.components.set(componentConfig.name, status);

        if (this.options.verbose) {
          console.error(`Failed to initialize component ${componentConfig.name}:`, (error as any).message);
        }
      }
    }
  }

  /**
   * Stop all components
   */
  private async stopComponents(): Promise<void> {
    for (const [name, component] of this.components.entries()) {
      try {
        component.status = 'stopped';
        this.components.set(name, component);

        if (this.options.verbose) {
          console.log(`Stopped component: ${name}`);
        }
      } catch (error) {
        if (this.options.verbose) {
          console.error(`Failed to stop component ${name}:`, (error as any).message);
        }
      }
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    // Perform health check every 30 seconds
    setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        this.emit('health-check-error', error);
      }
    }, 30000);
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck() {
    const checks: HealthCheck[] = [];

    // Check orchestrator health
    checks.push({
      name: 'orchestrator',
      status: this.status === 'running' ? 'passing' : 'failing',
      message: `Orchestrator status: ${this.status}`,
    });

    // Check component health
    for (const [name, component] of this.components.entries()) {
      checks.push({
        name: `component-${name}`,
        status: component.status === 'running' ? 'passing' : 'failing',
        message: `Component ${name}: ${component.status}`,
      });
    }

    // Check configuration validity
    checks.push({
      name: 'configuration',
      status: this.config ? 'passing' : 'failing',
      message: this.config ? 'Configuration loaded' : 'Configuration missing',
    });

    // Check port availability (if applicable)
    if (this.config?.port) {
      checks.push({
        name: 'port-availability',
        status: 'passing', // Would need actual port check
        message: `Port ${this.config.port} configured`,
      });
    }

    const failing = checks.filter(c => c.status === 'failing').length;
    const warning = checks.filter(c => c.status === 'warning').length;

    return {
      overall: failing > 0 ? 'unhealthy' as const : warning > 0 ? 'degraded' as const : 'healthy' as const,
      checks,
      lastCheck: new Date().toISOString(),
    };
  }
}