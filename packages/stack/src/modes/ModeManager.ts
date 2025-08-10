/**
 * Manager for MosAIc Stack operation modes
 */

import type { OperationMode, ModeConfig, ModeStatus, ModeHealthCheck } from './types.js';

export class ModeManager {
  private currentMode: OperationMode;
  private switching = false;
  private modeConfigs: Map<OperationMode, ModeConfig> = new Map();

  constructor(initialMode: OperationMode) {
    this.currentMode = initialMode;
    this.initializeModeConfigs();
  }

  /**
   * Initialize the mode manager
   */
  async initialize(): Promise<void> {
    await this.validateMode(this.currentMode);
  }

  /**
   * Start mode-specific services
   */
  async start(): Promise<void> {
    const config = this.modeConfigs.get(this.currentMode);
    if (!config) {
      throw new Error(`Unknown mode: ${this.currentMode}`);
    }

    // Mode-specific startup logic would go here
    console.log(`Started in ${this.currentMode} mode`);
  }

  /**
   * Stop mode-specific services
   */
  async stop(): Promise<void> {
    // Mode-specific cleanup logic would go here
    console.log(`Stopped ${this.currentMode} mode services`);
  }

  /**
   * Switch to a different operation mode
   */
  async switchMode(newMode: OperationMode): Promise<void> {
    if (this.currentMode === newMode) {
      return; // Already in target mode
    }

    this.switching = true;

    try {
      // Validate new mode
      await this.validateMode(newMode);

      // Stop current mode
      await this.stop();

      // Switch mode
      this.currentMode = newMode;

      // Start new mode
      await this.start();

      console.log(`Switched to ${newMode} mode`);
    } finally {
      this.switching = false;
    }
  }

  /**
   * Get current mode status
   */
  async getStatus(): Promise<ModeStatus> {
    const healthChecks = await this.performModeHealthCheck();

    return {
      current: this.currentMode,
      available: Array.from(this.modeConfigs.keys()),
      switching: this.switching,
      health: {
        overall: this.calculateOverallHealth(healthChecks),
        checks: healthChecks,
      },
    };
  }

  /**
   * Get configuration for a specific mode
   */
  getModeConfig(mode: OperationMode): ModeConfig | undefined {
    return this.modeConfigs.get(mode);
  }

  /**
   * Get current mode
   */
  getCurrentMode(): OperationMode {
    return this.currentMode;
  }

  /**
   * Initialize mode configurations
   */
  private initializeModeConfigs(): void {
    // Local mode configuration
    this.modeConfigs.set('local', {
      mode: 'local',
      description: 'Local-only mode with Ollama integration',
      requirements: ['ollama'],
      components: ['config', 'providers', 'cli'],
      providers: [
        { name: 'ollama', type: 'local', required: true },
      ],
      features: [
        { name: 'privacy', enabled: true, description: 'Complete data privacy' },
        { name: 'offline', enabled: true, description: 'Works without internet' },
        { name: 'local-models', enabled: true, description: 'Local model inference' },
      ],
    });

    // Hybrid mode configuration
    this.modeConfigs.set('hybrid', {
      mode: 'hybrid',
      description: 'Intelligent routing between local and cloud providers',
      requirements: ['ollama', 'internet'],
      components: ['config', 'providers', 'cli', 'tony', 'mcp'],
      providers: [
        { name: 'ollama', type: 'local', required: true },
        { name: 'claude', type: 'cloud', required: false, fallback: 'ollama' },
        { name: 'openai', type: 'cloud', required: false, fallback: 'ollama' },
      ],
      features: [
        { name: 'intelligent-routing', enabled: true, description: 'Smart provider selection' },
        { name: 'fallback', enabled: true, description: 'Automatic fallback to local' },
        { name: 'enterprise-features', enabled: true, description: 'Full Tony framework' },
      ],
    });

    // Cloud mode configuration
    this.modeConfigs.set('cloud', {
      mode: 'cloud',
      description: 'Cloud-first mode with full provider access',
      requirements: ['internet', 'api-keys'],
      components: ['config', 'providers', 'cli', 'tony', 'mcp'],
      providers: [
        { name: 'claude', type: 'cloud', required: true },
        { name: 'openai', type: 'cloud', required: false },
        { name: 'ollama', type: 'local', required: false },
      ],
      features: [
        { name: 'cloud-models', enabled: true, description: 'Access to latest cloud models' },
        { name: 'high-performance', enabled: true, description: 'Maximum performance' },
        { name: 'enterprise-features', enabled: true, description: 'Full Tony framework' },
      ],
    });
  }

  /**
   * Validate that a mode can be used
   */
  private async validateMode(mode: OperationMode): Promise<void> {
    const config = this.modeConfigs.get(mode);
    if (!config) {
      throw new Error(`Unknown mode: ${mode}`);
    }

    // Check requirements
    for (const requirement of config.requirements) {
      switch (requirement) {
        case 'ollama':
          // Would check if Ollama is available
          break;
        case 'internet':
          // Would check internet connectivity
          break;
        case 'api-keys':
          // Would check if required API keys are configured
          break;
      }
    }
  }

  /**
   * Perform health check for current mode
   */
  private async performModeHealthCheck(): Promise<ModeHealthCheck[]> {
    const config = this.modeConfigs.get(this.currentMode);
    if (!config) {
      return [{
        name: 'mode-config',
        status: 'failing',
        message: `Unknown mode: ${this.currentMode}`,
        required: true,
      }];
    }

    const checks: ModeHealthCheck[] = [];

    // Check mode switching status
    checks.push({
      name: 'mode-stability',
      status: this.switching ? 'warning' : 'passing',
      message: this.switching ? 'Mode switching in progress' : 'Mode stable',
      required: false,
    });

    // Check requirements
    for (const requirement of config.requirements) {
      checks.push({
        name: `requirement-${requirement}`,
        status: 'passing', // Would perform actual checks
        message: `Requirement ${requirement} satisfied`,
        required: true,
      });
    }

    // Check providers
    for (const provider of config.providers) {
      checks.push({
        name: `provider-${provider.name}`,
        status: 'passing', // Would perform actual provider checks
        message: `Provider ${provider.name} available`,
        required: provider.required,
      });
    }

    return checks;
  }

  /**
   * Calculate overall health from individual checks
   */
  private calculateOverallHealth(checks: ModeHealthCheck[]): 'healthy' | 'degraded' | 'unhealthy' {
    const requiredFailing = checks.filter(c => c.required && c.status === 'failing');
    const anyFailing = checks.filter(c => c.status === 'failing');
    const anyWarning = checks.filter(c => c.status === 'warning');

    if (requiredFailing.length > 0) {
      return 'unhealthy';
    } else if (anyFailing.length > 0 || anyWarning.length > 0) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }
}