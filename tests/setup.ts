// Test environment setup
import { config } from 'dotenv';
import path from 'path';

// Load test environment variables
config({ path: path.join(__dirname, '../.env.test') });

// Global test timeout
jest.setTimeout(30000);

// Mock console methods during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test helpers
declare global {
  namespace NodeJS {
    interface Global {
      testHelpers: {
        waitForCondition: (condition: () => boolean, timeout?: number) => Promise<void>;
        delay: (ms: number) => Promise<void>;
      };
    }
  }
}

// Test helper utilities
(global as any).testHelpers = {
  waitForCondition: async (condition: () => boolean, timeout = 5000): Promise<void> => {
    const startTime = Date.now();
    while (!condition()) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Condition not met within timeout');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  },
  
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};