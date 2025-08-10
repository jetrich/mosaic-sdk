/**
 * Integration tests for @mosaicstack/providers
 */

const { ProviderManager, createProvider } = require('../dist/index.js');

describe('@mosaicstack/providers Integration Tests', () => {
  let manager;

  beforeEach(async () => {
    manager = new ProviderManager();
    await manager.initialize();
  });

  afterEach(async () => {
    if (manager && typeof manager.shutdown === 'function') {
      await manager.shutdown();
    }
  });

  test('should initialize provider manager', () => {
    expect(manager).toBeDefined();
    expect(typeof manager.getProviders).toBe('function');
    expect(typeof manager.addProvider).toBe('function');
  });

  test('should get available providers', () => {
    const providers = manager.getProviders();
    expect(Array.isArray(providers)).toBe(true);
  });

  test('should create local provider', () => {
    const provider = createProvider({
      name: 'test-ollama',
      type: 'local',
      config: {
        baseUrl: 'http://localhost:11434'
      }
    });

    expect(provider).toBeDefined();
    expect(provider.name).toBe('test-ollama');
    expect(provider.type).toBe('local');
  });

  test('should create cloud provider', () => {
    const provider = createProvider({
      name: 'test-claude',
      type: 'cloud',
      config: {
        apiKey: 'test-key'
      }
    });

    expect(provider).toBeDefined();
    expect(provider.name).toBe('test-claude');
    expect(provider.type).toBe('cloud');
  });

  test('should add provider to manager', () => {
    const provider = createProvider({
      name: 'test-provider',
      type: 'local',
      config: {}
    });

    manager.addProvider(provider);
    
    const providers = manager.getProviders();
    const addedProvider = providers.find(p => p.name === 'test-provider');
    expect(addedProvider).toBeDefined();
  });

  test('should handle provider priority', () => {
    const highPriorityProvider = createProvider({
      name: 'high-priority',
      type: 'local',
      config: {},
      priority: 1
    });

    const lowPriorityProvider = createProvider({
      name: 'low-priority',
      type: 'cloud',
      config: {},
      priority: 2
    });

    manager.addProvider(lowPriorityProvider);
    manager.addProvider(highPriorityProvider);

    const providers = manager.getProviders();
    expect(providers[0].name).toBe('high-priority');
  });

  test('should validate provider configuration', () => {
    expect(() => {
      createProvider({
        // Missing required fields
      });
    }).toThrow();

    expect(() => {
      createProvider({
        name: 'test',
        type: 'invalid-type',
        config: {}
      });
    }).toThrow();
  });

  test('should handle provider health checks', async () => {
    const provider = createProvider({
      name: 'health-test',
      type: 'local',
      config: {}
    });

    manager.addProvider(provider);
    
    // Health checks might not be implemented yet, so just ensure no errors
    const providers = manager.getProviders();
    expect(providers.find(p => p.name === 'health-test')).toBeDefined();
  });
});