import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{js,ts}'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'scripts/**',
      'docs/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['core/**/*.ts'],
      exclude: [
        'core/**/*.test.ts',
        'core/**/*.spec.ts',
        'core/**/*.d.ts',
        'core/**/index.ts',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 10000,
    reporters: ['verbose'],
    outputFile: {
      json: './coverage/test-results.json',
      junit: './coverage/junit.xml',
    },
  },
});