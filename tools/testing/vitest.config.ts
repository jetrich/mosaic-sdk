/**
 * Vitest Configuration for Tony Development SDK Testing Framework
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',
    
    // Enable globals so tests don't need to import describe, it, etc.
    globals: true,
    
    // Test file patterns - focus on SDK components
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/coverage/**'],
    
    // Global test timeout
    testTimeout: 10000,
    
    // Setup files
    setupFiles: ['./tests/test-setup.ts'],
    
    // Mock handling
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    
    // Reporter configuration
    reporter: ['verbose'],
    
    // File watching
    watch: false,
    
    // Mock configuration for better test isolation
    deps: {
      external: ['child_process', 'fs', 'os'],
      inline: []
    },
    
    // Coverage configuration for SDK components
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**', 
        'node_modules/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        'fixtures/**',
        'scripts/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  
  // Module resolution for SDK components
  resolve: {
    alias: {
      '@sdk': path.resolve(__dirname, '../'),
      '@tests': path.resolve(__dirname, './tests'),
      '@fixtures': path.resolve(__dirname, './fixtures')
    }
  }
});