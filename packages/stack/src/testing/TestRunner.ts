/**
 * Comprehensive test runner for MosAIc Stack
 * Validates all components, modes, and integration points
 */

import { createStack } from '../createStack.js';
import { ValidationService } from '../utils/ValidationService.js';
import { StackUtils } from '../utils/StackUtils.js';
import type { StackInstance, StackStatus } from '../types.js';
import type { OperationMode } from '../modes/types.js';

export interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  message?: string;
  error?: string;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  duration: number;
  passed: number;
  failed: number;
  skipped: number;
}

export class TestRunner {
  private results: TestSuite[] = [];
  private verbose: boolean;

  constructor(options: { verbose?: boolean } = {}) {
    this.verbose = options.verbose || false;
  }

  /**
   * Run comprehensive end-to-end tests
   */
  async runAllTests(): Promise<TestSuite[]> {
    console.log('🧪 Starting MosAIc Stack End-to-End Tests');
    console.log('==========================================');

    // System validation tests
    await this.runSystemTests();

    // Configuration tests
    await this.runConfigurationTests();

    // Mode-specific tests
    await this.runModeTests();

    // Integration tests
    await this.runIntegrationTests();

    // Performance tests
    await this.runPerformanceTests();

    // Generate summary
    this.generateSummary();

    return this.results;
  }

  /**
   * Run system validation tests
   */
  private async runSystemTests(): Promise<void> {
    const suite = this.createSuite('System Validation');
    const validator = new ValidationService();

    // Node.js version test
    await this.runTest(suite, 'Node.js Version Check', async () => {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      if (majorVersion < 18) {
        throw new Error(`Node.js ${nodeVersion} not supported. Requires 18+`);
      }
      return `Node.js ${nodeVersion} ✅`;
    });

    // Memory availability test
    await this.runTest(suite, 'Memory Availability', async () => {
      const { freemem, totalmem } = await import('os');
      const freeMemoryMB = freemem() / 1024 / 1024;
      if (freeMemoryMB < 500) {
        throw new Error(`Insufficient memory: ${Math.round(freeMemoryMB)}MB`);
      }
      return `${Math.round(freeMemoryMB)}MB available`;
    });

    // Stack directory creation
    await this.runTest(suite, 'Stack Directory Creation', async () => {
      await StackUtils.ensureStackDirectory();
      return `Directory created: ${StackUtils.getStackDirectory()}`;
    });

    // Port availability test
    await this.runTest(suite, 'Port Availability', async () => {
      const testPort = 3456;
      const inUse = await StackUtils.isPortInUse(testPort);
      if (inUse) {
        throw new Error(`Port ${testPort} already in use`);
      }
      return `Port ${testPort} available`;
    });

    this.results.push(suite);
  }

  /**
   * Run configuration tests
   */
  private async runConfigurationTests(): Promise<void> {
    const suite = this.createSuite('Configuration System');
    const validator = new ValidationService();

    // Default configuration generation
    await this.runTest(suite, 'Default Config Generation', async () => {
      const configs = ['local', 'hybrid', 'cloud'] as const;
      for (const mode of configs) {
        const config = StackUtils.getDefaultConfig(mode);
        if (!config.mode || config.mode !== mode) {
          throw new Error(`Invalid default config for ${mode}`);
        }
      }
      return 'All default configs valid';
    });

    // Configuration validation
    await this.runTest(suite, 'Config Validation', async () => {
      const validConfig = {
        mode: 'hybrid',
        version: '0.1.0',
        port: 3456,
        providers: [
          { name: 'ollama', type: 'local' },
          { name: 'claude', type: 'cloud' }
        ]
      };
      
      validator.validateConfig(validConfig);
      return 'Configuration validation passed';
    });

    // Invalid configuration rejection
    await this.runTest(suite, 'Invalid Config Rejection', async () => {
      const invalidConfig = {
        mode: 'invalid-mode',
        port: 99999
      };
      
      try {
        validator.validateConfig(invalidConfig);
        throw new Error('Should have rejected invalid config');
      } catch (error: any) {
        if (error.message.includes('Configuration validation failed')) {
          return 'Invalid config properly rejected';
        }
        throw error;
      }
    });

    this.results.push(suite);
  }

  /**
   * Run mode-specific tests
   */
  private async runModeTests(): Promise<void> {
    const modes: OperationMode[] = ['local', 'hybrid', 'cloud'];

    for (const mode of modes) {
      await this.runModeTest(mode);
    }
  }

  /**
   * Run tests for a specific mode
   */
  private async runModeTest(mode: OperationMode): Promise<void> {
    const suite = this.createSuite(`${mode.toUpperCase()} Mode Tests`);

    // Stack creation test
    await this.runTest(suite, `${mode} Stack Creation`, async () => {
      try {
        const stack = await createStack({
          mode,
          port: 3456 + (mode === 'local' ? 0 : mode === 'hybrid' ? 1 : 2),
          autoStart: false,
          timeout: 10000,
        });

        if (stack.getMode() !== mode) {
          throw new Error(`Expected ${mode}, got ${stack.getMode()}`);
        }

        return `${mode} stack created successfully`;
      } catch (error: any) {
        // Skip if mode requirements not met (e.g., Ollama not installed)
        if (this.isRequirementError(error, mode)) {
          throw new Error(`SKIP: ${error.message}`);
        }
        throw error;
      }
    });

    // Configuration test
    await this.runTest(suite, `${mode} Configuration`, async () => {
      const stack = await createStack({ mode, autoStart: false });
      const config = stack.getConfig();
      
      if (!config || config.mode !== mode) {
        throw new Error(`Invalid configuration for ${mode}`);
      }
      
      return `${mode} configuration valid`;
    });

    // Status test (without starting)
    await this.runTest(suite, `${mode} Status Check`, async () => {
      const stack = await createStack({ mode, autoStart: false });
      const status = await stack.status();
      
      if (!status || typeof status.status !== 'string') {
        throw new Error('Invalid status response');
      }
      
      return `${mode} status: ${status.status}`;
    });

    this.results.push(suite);
  }

  /**
   * Run integration tests
   */
  private async runIntegrationTests(): Promise<void> {
    const suite = this.createSuite('Integration Tests');

    // CLI integration test
    await this.runTest(suite, 'CLI Integration', async () => {
      const { StackCLI } = await import('../cli/StackCLI.js');
      const cli = new StackCLI();
      
      // Test initialization (without starting)
      const stack = await cli.initialize({
        mode: 'local',
        port: 3459,
      });
      
      if (!stack || stack.getMode() !== 'local') {
        throw new Error('CLI integration failed');
      }
      
      return 'CLI integration successful';
    });

    // Provider orchestration test
    await this.runTest(suite, 'Provider Orchestration', async () => {
      const { ProviderOrchestrator } = await import('../providers/ProviderOrchestrator.js');
      const orchestrator = new ProviderOrchestrator();
      
      await orchestrator.initialize('local');
      const status = await orchestrator.getStatus();
      
      if (!status || !Array.isArray(status.providers)) {
        throw new Error('Provider orchestration failed');
      }
      
      return `Provider orchestration: ${status.providers.length} providers`;
    });

    // Mode manager test
    await this.runTest(suite, 'Mode Management', async () => {
      const { ModeManager } = await import('../modes/ModeManager.js');
      const manager = new ModeManager('local');
      
      await manager.initialize();
      const status = await manager.getStatus();
      
      if (!status || status.current !== 'local') {
        throw new Error('Mode management failed');
      }
      
      return `Mode manager: ${status.current} mode active`;
    });

    this.results.push(suite);
  }

  /**
   * Run performance tests
   */
  private async runPerformanceTests(): Promise<void> {
    const suite = this.createSuite('Performance Tests');

    // Stack creation performance
    await this.runTest(suite, 'Stack Creation Performance', async () => {
      const start = Date.now();
      const stack = await createStack({ mode: 'local', autoStart: false });
      const duration = Date.now() - start;
      
      if (duration > 5000) {
        throw new Error(`Stack creation too slow: ${duration}ms`);
      }
      
      return `Stack created in ${duration}ms`;
    });

    // Configuration loading performance
    await this.runTest(suite, 'Config Loading Performance', async () => {
      const start = Date.now();
      const config = StackUtils.getDefaultConfig('hybrid');
      const duration = Date.now() - start;
      
      if (duration > 100) {
        throw new Error(`Config loading too slow: ${duration}ms`);
      }
      
      return `Config loaded in ${duration}ms`;
    });

    // Memory usage test
    await this.runTest(suite, 'Memory Usage', async () => {
      const beforeMB = process.memoryUsage().heapUsed / 1024 / 1024;
      
      // Create and destroy multiple stacks
      for (let i = 0; i < 5; i++) {
        const stack = await createStack({ mode: 'local', autoStart: false });
        // Simulate some operations
        await stack.status();
      }
      
      const afterMB = process.memoryUsage().heapUsed / 1024 / 1024;
      const usedMB = afterMB - beforeMB;
      
      if (usedMB > 50) {
        throw new Error(`Excessive memory usage: ${Math.round(usedMB)}MB`);
      }
      
      return `Memory usage: ${Math.round(usedMB)}MB`;
    });

    this.results.push(suite);
  }

  /**
   * Run a single test with timing and error handling
   */
  private async runTest(
    suite: TestSuite,
    name: string,
    testFn: () => Promise<string>
  ): Promise<void> {
    if (this.verbose) {
      process.stdout.write(`  ${name}... `);
    }

    const start = Date.now();
    
    try {
      const message = await testFn();
      const duration = Date.now() - start;
      
      suite.tests.push({
        name,
        status: 'pass',
        duration,
        message,
      });
      suite.passed++;
      
      if (this.verbose) {
        console.log(`✅ (${duration}ms)`);
      }
    } catch (error: any) {
      const duration = Date.now() - start;
      
      if (error.message.startsWith('SKIP:')) {
        suite.tests.push({
          name,
          status: 'skip',
          duration,
          message: error.message.replace('SKIP: ', ''),
        });
        suite.skipped++;
        
        if (this.verbose) {
          console.log(`⏭️  (${duration}ms) - ${error.message.replace('SKIP: ', '')}`);
        }
      } else {
        suite.tests.push({
          name,
          status: 'fail',
          duration,
          error: error.message,
        });
        suite.failed++;
        
        if (this.verbose) {
          console.log(`❌ (${duration}ms) - ${error.message}`);
        }
      }
    }
  }

  /**
   * Create a new test suite
   */
  private createSuite(name: string): TestSuite {
    const suite: TestSuite = {
      name,
      tests: [],
      duration: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
    };

    if (this.verbose) {
      console.log(`\n📋 ${name}`);
      console.log('─'.repeat(name.length + 4));
    }

    return suite;
  }

  /**
   * Check if error is due to missing requirements
   */
  private isRequirementError(error: any, mode: OperationMode): boolean {
    const message = error.message.toLowerCase();
    
    if (mode === 'local' || mode === 'hybrid') {
      return message.includes('ollama');
    }
    
    if (mode === 'cloud') {
      return message.includes('api') || message.includes('internet');
    }
    
    return false;
  }

  /**
   * Generate test summary
   */
  private generateSummary(): void {
    console.log('\n🎯 Test Summary');
    console.log('================');

    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let totalTests = 0;
    let totalDuration = 0;

    for (const suite of this.results) {
      suite.duration = suite.tests.reduce((sum, test) => sum + test.duration, 0);
      totalPassed += suite.passed;
      totalFailed += suite.failed;
      totalSkipped += suite.skipped;
      totalTests += suite.tests.length;
      totalDuration += suite.duration;

      const status = suite.failed > 0 ? '❌' : suite.skipped === suite.tests.length ? '⏭️' : '✅';
      console.log(`${status} ${suite.name}: ${suite.passed}/${suite.tests.length} passed (${suite.duration}ms)`);
      
      if (suite.failed > 0 && this.verbose) {
        suite.tests.filter(t => t.status === 'fail').forEach(test => {
          console.log(`    ❌ ${test.name}: ${test.error}`);
        });
      }
    }

    console.log('\n📊 Overall Results:');
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  ✅ Passed: ${totalPassed}`);
    console.log(`  ❌ Failed: ${totalFailed}`);
    console.log(`  ⏭️  Skipped: ${totalSkipped}`);
    console.log(`  ⏱️  Duration: ${totalDuration}ms`);
    
    const successRate = totalTests > 0 ? (totalPassed / (totalTests - totalSkipped) * 100).toFixed(1) : '0';
    console.log(`  📈 Success Rate: ${successRate}%`);

    if (totalFailed === 0) {
      console.log('\n🎉 All tests passed! MosAIc Stack is ready for deployment.');
    } else {
      console.log(`\n⚠️  ${totalFailed} tests failed. Please review and fix issues before deployment.`);
    }
  }

  /**
   * Get test results
   */
  getResults(): TestSuite[] {
    return this.results;
  }
}