/**
 * Vitest Configuration for Tony Core Tests
 */
import { defineConfig } from 'vitest/config';
import path from 'path';
export default defineConfig({
    test: {
        // Test environment
        environment: 'node',
        // Test file patterns
        include: ['**/*.test.ts', '**/*.spec.ts'],
        exclude: ['**/node_modules/**', '**/dist/**'],
        // Global test timeout
        testTimeout: 10000,
        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'coverage/**',
                'dist/**',
                'node_modules/**',
                '**/*.d.ts',
                '**/*.test.ts',
                '**/*.spec.ts'
            ],
            thresholds: {
                global: {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80
                }
            }
        },
        // Setup files
        setupFiles: ['./test-setup.ts'],
        // Mock handling
        clearMocks: true,
        mockReset: true,
        restoreMocks: true,
        // Reporter configuration
        reporter: ['verbose', 'json'],
        // File watching
        watch: false,
        // Parallel execution
        pool: 'threads',
        poolOptions: {
            threads: {
                singleThread: false,
                maxThreads: 4,
                minThreads: 1
            }
        }
    },
    // Module resolution
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '../core'),
            '@tests': path.resolve(__dirname, '.')
        }
    },
    // Define globals for TypeScript
    define: {
        'import.meta.vitest': 'undefined'
    }
});
//# sourceMappingURL=vitest.config.js.map