/**
 * CLI integration for MosAIc Stack
 */

import { createStack } from '../createStack.js';
import type { StackInstance, StackOptions } from '../types.js';
import type { CLIOptions } from './types.js';

export class StackCLI {
  private stack?: StackInstance;

  /**
   * Initialize stack from CLI options
   */
  async initialize(options: CLIOptions): Promise<StackInstance> {
    const stackOptions: StackOptions = {
      mode: options.mode || 'hybrid',
      configPath: options.configPath,
      verbose: options.verbose || false,
      timeout: options.timeout || 30000,
      port: options.port || 3456,
      autoStart: false, // CLI controls start/stop
    };

    this.stack = await createStack(stackOptions);
    return this.stack;
  }

  /**
   * Start the stack
   */
  async start(): Promise<void> {
    if (!this.stack) {
      throw new Error('Stack not initialized. Call initialize() first.');
    }

    await this.stack.start();
  }

  /**
   * Stop the stack
   */
  async stop(): Promise<void> {
    if (!this.stack) {
      throw new Error('Stack not initialized. Call initialize() first.');
    }

    await this.stack.stop();
  }

  /**
   * Get stack status
   */
  async status() {
    if (!this.stack) {
      throw new Error('Stack not initialized. Call initialize() first.');
    }

    return await this.stack.status();
  }

  /**
   * Configure the stack
   */
  async configure(options: Partial<StackOptions>): Promise<void> {
    if (!this.stack) {
      throw new Error('Stack not initialized. Call initialize() first.');
    }

    await this.stack.configure(options);
  }

  /**
   * Get current stack instance
   */
  getStack(): StackInstance | undefined {
    return this.stack;
  }
}