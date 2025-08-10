/**
 * Factory function for creating MosAIc Stack instances
 */

import { StackOrchestrator } from './orchestrator/StackOrchestrator.js';
import { ModeManager } from './modes/ModeManager.js';
import { ProviderOrchestrator } from './providers/ProviderOrchestrator.js';
import { ValidationService } from './utils/ValidationService.js';
import type { StackOptions, StackInstance } from './types.js';

/**
 * Create a new MosAIc Stack instance
 */
export async function createStack(options: StackOptions): Promise<StackInstance> {
  // Validate options
  const validator = new ValidationService();
  await validator.validateStackOptions(options);

  // Create orchestrator
  const orchestrator = new StackOrchestrator({
    mode: options.mode,
    configPath: options.configPath,
    verbose: options.verbose || false,
    timeout: options.timeout || 30000,
    port: options.port || 3456,
  });

  // Initialize mode manager
  const modeManager = new ModeManager(options.mode);
  await modeManager.initialize();

  // Initialize provider orchestrator
  const providerOrchestrator = new ProviderOrchestrator();
  await providerOrchestrator.initialize(options.mode);

  // Create stack instance
  const stackInstance: StackInstance = {
    async start() {
      await orchestrator.start();
      await modeManager.start();
      await providerOrchestrator.start();
    },

    async stop() {
      await providerOrchestrator.stop();
      await modeManager.stop();
      await orchestrator.stop();
    },

    async restart() {
      await this.stop();
      await this.start();
    },

    async status() {
      const orchestratorStatus = await orchestrator.getStatus();
      const modeStatus = await modeManager.getStatus();
      const providerStatus = await providerOrchestrator.getStatus();

      return {
        status: orchestratorStatus.status,
        mode: options.mode,
        version: '0.1.0',
        uptime: orchestratorStatus.uptime,
        components: orchestratorStatus.components,
        providers: providerStatus.providers,
        health: {
          overall: calculateOverallHealth(orchestratorStatus, modeStatus, providerStatus),
          checks: [
            ...orchestratorStatus.health.checks,
            ...modeStatus.health.checks,
            ...providerStatus.health.checks,
          ],
          lastCheck: new Date().toISOString(),
        },
      };
    },

    async configure(newOptions: Partial<StackOptions>) {
      const updatedOptions = { ...options, ...newOptions };
      await validator.validateStackOptions(updatedOptions);
      
      await orchestrator.configure(updatedOptions);
      
      if (newOptions.mode && newOptions.mode !== options.mode) {
        await modeManager.switchMode(newOptions.mode);
        await providerOrchestrator.reconfigure(newOptions.mode);
      }
      
      Object.assign(options, updatedOptions);
    },

    getMode() {
      return options.mode;
    },

    getConfig() {
      return orchestrator.getConfig();
    },

  };

  // Helper function to calculate overall health
  function calculateOverallHealth(orchestratorStatus: any, modeStatus: any, providerStatus: any) {
    const allChecks = [
      ...orchestratorStatus.health.checks,
      ...modeStatus.health.checks,
      ...providerStatus.health.checks,
    ];

    const failingChecks = allChecks.filter(check => check.status === 'failing');
    const warningChecks = allChecks.filter(check => check.status === 'warning');

    if (failingChecks.length > 0) {
      return 'unhealthy' as const;
    } else if (warningChecks.length > 0) {
      return 'degraded' as const;
    } else {
      return 'healthy' as const;
    }
  }


  // Auto-start if requested
  if (options.autoStart) {
    await stackInstance.start();
  }

  return stackInstance;
}