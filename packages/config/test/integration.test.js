/**
 * Integration tests for @mosaicstack/config
 */

const { loadConfig, getGlobalConfigLoader } = require('../dist/index.js');
const { writeFileSync, mkdirSync, rmSync } = require('fs');
const { join } = require('path');
const { tmpdir } = require('os');

describe('@mosaicstack/config Integration Tests', () => {
  let tempDir;
  let configPath;

  beforeEach(() => {
    tempDir = join(tmpdir(), 'mosaic-config-test-' + Date.now());
    mkdirSync(tempDir, { recursive: true });
    configPath = join(tempDir, 'test-config.json');
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  test('should load default configuration', async () => {
    const config = await loadConfig({ 
      mode: 'local',
      validateSchema: false  // Skip validation for basic test
    });
    
    expect(config).toBeDefined();
    expect(typeof config).toBe('object');
  });

  test('should load configuration from file', async () => {
    const testConfig = {
      mode: 'hybrid',
      port: 3456,
      providers: [
        { name: 'ollama', type: 'local', enabled: true }
      ]
    };

    writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

    const config = await loadConfig({
      configPath,
      mode: 'hybrid',
      validateSchema: false  // Skip validation for file test
    });

    expect(config.mode).toBe('hybrid');
    expect(config.port).toBe(3456);
    expect(config.providers).toHaveLength(1);
    expect(config.providers[0].name).toBe('ollama');
  });

  test('should resolve environment variables', async () => {
    process.env.TEST_API_KEY = 'test-key-123';
    
    const testConfig = {
      mode: 'cloud',
      apiKey: 'env:TEST_API_KEY|default-key'
    };

    writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

    const config = await loadConfig({ 
      configPath,
      validateSchema: false  // Skip validation for env test
    });
    
    expect(config.apiKey).toBe('test-key-123');
    
    delete process.env.TEST_API_KEY;
  });

  test('should use default values for missing environment variables', async () => {
    const testConfig = {
      mode: 'cloud',
      apiKey: 'env:MISSING_API_KEY|fallback-key'
    };

    writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

    const config = await loadConfig({ 
      configPath,
      validateSchema: false  // Skip validation for default test
    });
    
    expect(config.apiKey).toBe('fallback-key');
  });

  test('should validate configuration schema', async () => {
    const invalidConfig = {
      mode: 'invalid-mode',
      port: 'not-a-number'
    };

    writeFileSync(configPath, JSON.stringify(invalidConfig, null, 2));

    await expect(loadConfig({
      configPath,
      validateSchema: true
    })).rejects.toThrow();
  });

  test('should handle different modes correctly', async () => {
    const modes = ['local', 'hybrid', 'cloud'];
    
    for (const mode of modes) {
      const config = await loadConfig({ 
        mode,
        validateSchema: false  // Skip validation for mode tests
      });
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    }
  });

  test('should use global config loader', () => {
    const loader = getGlobalConfigLoader();
    expect(loader).toBeDefined();
    expect(typeof loader.load).toBe('function');
  });
});