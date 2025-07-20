/**
 * Test Setup for Tony Framework Tests
 * Global test configuration and utilities
 */
declare global {
    interface GlobalTestUtils {
        createTempDir(): Promise<string>;
        cleanupTempDir(dir: string): Promise<void>;
        createMockPlugin(name: string, version?: string): any;
        writePluginFile(filePath: string, plugin: any): Promise<void>;
    }
    var testUtils: GlobalTestUtils;
}
export { testUtils };
//# sourceMappingURL=test-setup.d.ts.map