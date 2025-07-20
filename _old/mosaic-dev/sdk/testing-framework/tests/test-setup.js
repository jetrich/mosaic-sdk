/**
 * Test Setup for Tony Framework Tests
 * Global test configuration and utilities
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
// Test utilities
globalThis.testUtils = {
    /**
     * Creates a temporary directory for tests
     */
    async createTempDir() {
        return await fs.mkdtemp(path.join(tmpdir(), 'tony-test-'));
    },
    /**
     * Cleans up a temporary directory
     */
    async cleanupTempDir(dir) {
        try {
            await fs.rm(dir, { recursive: true, force: true });
        }
        catch (error) {
            // Ignore cleanup errors
        }
    },
    /**
     * Creates a mock plugin object
     */
    createMockPlugin(name, version = '1.0.0') {
        return {
            name,
            version,
            description: `Test plugin ${name}`,
            author: 'Test Author',
            minTonyVersion: '2.6.0',
            requiredCapabilities: ['file-system'],
            onInstall: vi.fn(async () => { }),
            onActivate: vi.fn(async () => { }),
            onDeactivate: vi.fn(async () => { }),
            onUninstall: vi.fn(async () => { })
        };
    },
    /**
     * Writes a plugin object to a file
     */
    async writePluginFile(filePath, plugin) {
        const content = `
      // Generated test plugin
      export default ${JSON.stringify(plugin, null, 2)};
    `;
        await fs.writeFile(filePath, content);
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
//# sourceMappingURL=test-setup.js.map