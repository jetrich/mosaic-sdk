/**
 * Test Setup for Tony Development SDK Tests
 * Global test configuration and utilities for SDK testing
 */

import { vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

// Global test utilities for SDK testing
declare global {
  interface GlobalTestUtils {
    createTempDir(): Promise<string>;
    cleanupTempDir(dir: string): Promise<void>;
    createMockConfig(type: string, content?: any): any;
    writeConfigFile(filePath: string, config: any): Promise<void>;
    createMockPackageJson(name: string, version?: string): any;
    validateJsonFile(filePath: string): Promise<boolean>;
    mockShellCommand(command: string, output: string): void;
  }
  
  var testUtils: GlobalTestUtils;
}

// Test utilities for SDK components
globalThis.testUtils = {
  /**
   * Creates a temporary directory for tests
   */
  async createTempDir(): Promise<string> {
    return await fs.mkdtemp(path.join(tmpdir(), 'tony-sdk-test-'));
  },

  /**
   * Cleans up a temporary directory
   */
  async cleanupTempDir(dir: string): Promise<void> {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  },

  /**
   * Creates a mock configuration object for SDK testing
   */
  createMockConfig(type: string, content: any = {}): any {
    const baseConfig = {
      type,
      version: '1.0.0',
      created: new Date().toISOString(),
      ...content
    };

    switch (type) {
      case 'package':
        return {
          name: '@tony/test-component',
          version: '1.0.0',
          private: true,
          ...content
        };
      case 'tsconfig':
        return {
          compilerOptions: {
            target: 'ES2020',
            module: 'ESNext',
            strict: true,
            ...content.compilerOptions
          },
          ...content
        };
      default:
        return baseConfig;
    }
  },

  /**
   * Writes a configuration object to a file
   */
  async writeConfigFile(filePath: string, config: any): Promise<void> {
    const content = JSON.stringify(config, null, 2);
    await fs.writeFile(filePath, content);
  },

  /**
   * Creates a mock package.json for SDK testing
   */
  createMockPackageJson(name: string, version: string = '1.0.0'): any {
    return {
      name,
      version,
      description: `Test SDK component ${name}`,
      private: true,
      type: 'module',
      scripts: {
        test: 'vitest run',
        build: 'tsc',
        lint: 'eslint .'
      },
      devDependencies: {
        vitest: '^1.0.0',
        typescript: '^5.0.0'
      },
      dependencies: {}
    };
  },

  /**
   * Validates that a file contains valid JSON
   */
  async validateJsonFile(filePath: string): Promise<boolean> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Mocks shell command execution for testing
   */
  mockShellCommand(command: string, output: string): void {
    vi.mocked(process.stdout.write = vi.fn().mockReturnValue(true));
  }
};

// Global test configuration
vi.stubGlobal('TEST_MODE', true);

// Mock Node.js built-in modules for testing
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    watch: vi.fn(() => ({
      close: vi.fn(),
      on: vi.fn()
    }))
  };
});

// Setup and teardown hooks
beforeAll(() => {
  // Global setup
});

afterAll(() => {
  // Global cleanup
});

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
});

// Export test utilities for use in test files
export { testUtils };