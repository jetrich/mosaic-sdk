# MosAIc Plugin System Design

## Overview

The MosAIc Plugin System provides a flexible, extensible architecture for integrating multiple service providers into the orchestration platform. This document details the technical design, implementation patterns, and best practices for building and managing plugins.

## Table of Contents

1. [Plugin Architecture Overview](#plugin-architecture-overview)
2. [Plugin Development Guide](#plugin-development-guide)
3. [Plugin Lifecycle Management](#plugin-lifecycle-management)
4. [Configuration Management](#configuration-management)
5. [Security Considerations](#security-considerations)
6. [Performance Optimization](#performance-optimization)
7. [Plugin Examples](#plugin-examples)

## Plugin Architecture Overview

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Plugin System Core                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐  │
│  │  Plugin Loader  │  │ Plugin Registry │  │  Sandbox   │  │
│  │                 │  │                 │  │ Environment│  │
│  └─────────────────┘  └─────────────────┘  └────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐  │
│  │ Config Manager  │  │ Event Dispatcher│  │  Metrics   │  │
│  │                 │  │                 │  │ Collector  │  │
│  └─────────────────┘  └─────────────────┘  └────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐  │
│  │ Health Monitor  │  │ Version Manager │  │   Logger   │  │
│  │                 │  │                 │  │            │  │
│  └─────────────────┘  └─────────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Plugin Structure

```typescript
// Plugin Manifest (plugin.json)
{
  "id": "github-git-provider",
  "name": "GitHub Git Provider",
  "version": "1.0.0",
  "type": "git",
  "provider": "github",
  "author": "MosAIc Team",
  "license": "MIT",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "engines": {
    "mosaic": ">=0.3.0",
    "node": ">=18.0.0"
  },
  "dependencies": {
    "@octokit/rest": "^19.0.0",
    "@mosaic/plugin-sdk": "^1.0.0"
  },
  "configuration": {
    "schema": "./schema/config.json",
    "defaults": "./config/defaults.json"
  },
  "capabilities": {
    "repository": ["create", "read", "update", "delete", "list"],
    "branch": ["create", "delete", "merge", "protect"],
    "pullRequest": ["create", "review", "merge", "close"],
    "webhook": ["create", "delete", "list"],
    "authentication": ["token", "oauth", "app"]
  },
  "permissions": {
    "network": ["api.github.com"],
    "filesystem": ["readonly"],
    "environment": ["GITHUB_TOKEN", "GITHUB_APP_ID"]
  }
}
```

### Plugin Base Class

```typescript
import { 
  IOrchestrationPlugin, 
  PluginContext, 
  PluginConfig,
  HealthStatus,
  PluginMetrics,
  Logger
} from '@mosaic/plugin-sdk';

export abstract class BasePlugin implements IOrchestrationPlugin {
  protected context: PluginContext;
  protected config: PluginConfig;
  protected logger: Logger;
  protected metrics: MetricsCollector;
  
  constructor(context: PluginContext) {
    this.context = context;
    this.logger = context.logger;
    this.metrics = context.metrics;
  }
  
  // Lifecycle methods
  async initialize(config: PluginConfig): Promise<void> {
    this.config = await this.validateConfig(config);
    await this.setupResources();
    this.logger.info(`Plugin ${this.id} initialized`);
  }
  
  async start(): Promise<void> {
    await this.startServices();
    this.metrics.increment('plugin.started');
    this.logger.info(`Plugin ${this.id} started`);
  }
  
  async stop(): Promise<void> {
    await this.stopServices();
    this.metrics.increment('plugin.stopped');
    this.logger.info(`Plugin ${this.id} stopped`);
  }
  
  async dispose(): Promise<void> {
    await this.cleanupResources();
    this.logger.info(`Plugin ${this.id} disposed`);
  }
  
  // Health monitoring
  async healthCheck(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkConnectivity(),
      this.checkAuthentication(),
      this.checkRateLimit(),
      this.checkDependencies()
    ]);
    
    const healthy = checks.every(c => c.healthy);
    
    return {
      status: healthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString()
    };
  }
  
  // Metrics
  async getMetrics(): Promise<PluginMetrics> {
    return {
      requests: this.metrics.get('requests'),
      errors: this.metrics.get('errors'),
      latency: this.metrics.get('latency'),
      rateLimit: await this.getRateLimitStatus(),
      custom: await this.getCustomMetrics()
    };
  }
  
  // Abstract methods for implementation
  protected abstract validateConfig(config: PluginConfig): Promise<PluginConfig>;
  protected abstract setupResources(): Promise<void>;
  protected abstract startServices(): Promise<void>;
  protected abstract stopServices(): Promise<void>;
  protected abstract cleanupResources(): Promise<void>;
  protected abstract checkConnectivity(): Promise<HealthCheck>;
  protected abstract checkAuthentication(): Promise<HealthCheck>;
  protected abstract checkRateLimit(): Promise<HealthCheck>;
  protected abstract checkDependencies(): Promise<HealthCheck>;
  protected abstract getRateLimitStatus(): Promise<RateLimitStatus>;
  protected abstract getCustomMetrics(): Promise<Record<string, any>>;
}
```

## Plugin Development Guide

### Creating a New Plugin

#### 1. Project Setup

```bash
# Create plugin from template
npx @mosaic/create-plugin my-provider-plugin

# Project structure
my-provider-plugin/
├── src/
│   ├── index.ts          # Plugin entry point
│   ├── provider.ts       # Provider implementation
│   ├── auth/            # Authentication logic
│   ├── api/             # API client
│   └── utils/           # Utilities
├── test/
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── fixtures/        # Test fixtures
├── schema/
│   └── config.json      # Configuration schema
├── docs/
│   ├── README.md        # Documentation
│   └── API.md          # API reference
├── plugin.json          # Plugin manifest
├── tsconfig.json        # TypeScript config
└── package.json         # NPM package
```

#### 2. Implementation Example

```typescript
// src/index.ts
import { BasePlugin, GitPlugin } from '@mosaic/plugin-sdk';
import { GitHubProvider } from './provider';
import { GitHubAuthManager } from './auth';
import { GitHubAPIClient } from './api';

export class GitHubGitPlugin extends BasePlugin implements GitPlugin {
  private provider: GitHubProvider;
  private authManager: GitHubAuthManager;
  private apiClient: GitHubAPIClient;
  
  // Metadata
  readonly id = 'github-git-provider';
  readonly name = 'GitHub Git Provider';
  readonly version = '1.0.0';
  readonly type = 'git';
  readonly provider = 'github';
  
  // Lifecycle implementation
  protected async validateConfig(config: PluginConfig): Promise<PluginConfig> {
    const schema = await this.loadConfigSchema();
    return validateAgainstSchema(config, schema);
  }
  
  protected async setupResources(): Promise<void> {
    // Initialize authentication
    this.authManager = new GitHubAuthManager(this.config.auth);
    await this.authManager.initialize();
    
    // Create API client
    this.apiClient = new GitHubAPIClient({
      auth: this.authManager,
      baseUrl: this.config.baseUrl || 'https://api.github.com',
      timeout: this.config.timeout || 30000,
      retry: this.config.retry || { attempts: 3 }
    });
    
    // Initialize provider
    this.provider = new GitHubProvider(this.apiClient, this.logger);
  }
  
  protected async startServices(): Promise<void> {
    // Start background services
    await this.authManager.startTokenRefresh();
    await this.provider.initialize();
  }
  
  // Git operations
  async createRepository(params: CreateRepoParams): Promise<Repository> {
    this.metrics.increment('repository.create');
    const timer = this.metrics.startTimer('repository.create.duration');
    
    try {
      const result = await this.provider.createRepository(params);
      timer.end({ status: 'success' });
      return result;
    } catch (error) {
      timer.end({ status: 'error' });
      this.metrics.increment('repository.create.error');
      throw this.handleError(error);
    }
  }
  
  async getRepository(params: GetRepoParams): Promise<Repository> {
    return this.withMetrics('repository.get', () => 
      this.provider.getRepository(params)
    );
  }
  
  async updateRepository(params: UpdateRepoParams): Promise<Repository> {
    return this.withMetrics('repository.update', () =>
      this.provider.updateRepository(params)
    );
  }
  
  async deleteRepository(params: DeleteRepoParams): Promise<void> {
    return this.withMetrics('repository.delete', () =>
      this.provider.deleteRepository(params)
    );
  }
  
  async listRepositories(params: ListReposParams): Promise<Repository[]> {
    return this.withMetrics('repository.list', () =>
      this.provider.listRepositories(params)
    );
  }
  
  // Utility methods
  private async withMetrics<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    this.metrics.increment(operation);
    const timer = this.metrics.startTimer(`${operation}.duration`);
    
    try {
      const result = await fn();
      timer.end({ status: 'success' });
      return result;
    } catch (error) {
      timer.end({ status: 'error' });
      this.metrics.increment(`${operation}.error`);
      throw this.handleError(error);
    }
  }
  
  private handleError(error: any): Error {
    // Log error
    this.logger.error('Operation failed', error);
    
    // Transform provider-specific errors
    if (error.status === 404) {
      return new NotFoundError(error.message);
    }
    if (error.status === 401) {
      return new AuthenticationError(error.message);
    }
    if (error.status === 403) {
      return new AuthorizationError(error.message);
    }
    if (error.status === 429) {
      return new RateLimitError(error.message);
    }
    
    // Default error
    return new PluginError(`GitHub operation failed: ${error.message}`);
  }
  
  // Capabilities
  getCapabilities(): PluginCapabilities {
    return {
      repository: ['create', 'read', 'update', 'delete', 'list'],
      branch: ['create', 'delete', 'merge', 'protect'],
      pullRequest: ['create', 'review', 'merge', 'close'],
      webhook: ['create', 'delete', 'list'],
      authentication: ['token', 'oauth', 'app']
    };
  }
  
  supportsOperation(operation: string): boolean {
    const [resource, action] = operation.split('.');
    const capabilities = this.getCapabilities();
    return capabilities[resource]?.includes(action) || false;
  }
}

// Export plugin class
export default GitHubGitPlugin;
```

### Plugin Testing

```typescript
// test/unit/plugin.test.ts
import { GitHubGitPlugin } from '../src';
import { createTestContext, mockConfig } from '@mosaic/plugin-testing';

describe('GitHubGitPlugin', () => {
  let plugin: GitHubGitPlugin;
  let context: TestContext;
  
  beforeEach(async () => {
    context = createTestContext();
    plugin = new GitHubGitPlugin(context);
    await plugin.initialize(mockConfig);
  });
  
  afterEach(async () => {
    await plugin.dispose();
  });
  
  describe('Repository Operations', () => {
    it('should create a repository', async () => {
      const params = {
        name: 'test-repo',
        organization: 'test-org',
        private: true
      };
      
      const result = await plugin.createRepository(params);
      
      expect(result).toMatchObject({
        name: 'test-repo',
        owner: 'test-org',
        private: true
      });
    });
    
    it('should handle rate limiting', async () => {
      // Mock rate limit response
      context.mockAPI.setResponse({
        status: 429,
        headers: {
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': '1234567890'
        }
      });
      
      await expect(
        plugin.createRepository({ name: 'test' })
      ).rejects.toThrow(RateLimitError);
    });
  });
  
  describe('Health Checks', () => {
    it('should report healthy status', async () => {
      const health = await plugin.healthCheck();
      
      expect(health.status).toBe('healthy');
      expect(health.checks).toHaveLength(4);
    });
  });
});
```

## Plugin Lifecycle Management

### Loading Process

```typescript
class PluginLoader {
  private validators: Map<string, IPluginValidator>;
  private transformers: Map<string, IPluginTransformer>;
  
  async loadPlugin(pluginPath: string): Promise<LoadedPlugin> {
    // 1. Read manifest
    const manifest = await this.readManifest(pluginPath);
    
    // 2. Validate manifest
    await this.validateManifest(manifest);
    
    // 3. Check compatibility
    await this.checkCompatibility(manifest);
    
    // 4. Load plugin module
    const PluginClass = await this.loadModule(manifest.main);
    
    // 5. Validate plugin class
    await this.validatePluginClass(PluginClass);
    
    // 6. Create sandbox
    const sandbox = await this.createSandbox(manifest);
    
    // 7. Instantiate plugin
    const context = this.createContext(manifest, sandbox);
    const plugin = new PluginClass(context);
    
    // 8. Register plugin
    await this.registry.register(plugin);
    
    return { manifest, plugin, sandbox };
  }
  
  private async createSandbox(manifest: PluginManifest): Promise<Sandbox> {
    const sandbox = new Sandbox({
      permissions: manifest.permissions,
      resources: {
        memory: manifest.resources?.memory || '128MB',
        cpu: manifest.resources?.cpu || '0.5',
        timeout: manifest.resources?.timeout || 30000
      }
    });
    
    // Apply security restrictions
    sandbox.restrictNetwork(manifest.permissions.network);
    sandbox.restrictFilesystem(manifest.permissions.filesystem);
    sandbox.restrictEnvironment(manifest.permissions.environment);
    
    return sandbox;
  }
}
```

### Hot Reload Support

```typescript
class PluginReloader {
  private watcher: FSWatcher;
  private reloadQueue: Queue<ReloadJob>;
  
  async enableHotReload(plugin: IOrchestrationPlugin): Promise<void> {
    const manifest = await this.getManifest(plugin.id);
    
    // Watch plugin files
    this.watcher = watch(manifest.directory, {
      ignored: /node_modules/,
      persistent: true
    });
    
    this.watcher.on('change', async (path) => {
      await this.queueReload(plugin, path);
    });
  }
  
  private async queueReload(
    plugin: IOrchestrationPlugin, 
    changedPath: string
  ): Promise<void> {
    // Debounce multiple changes
    this.reloadQueue.add({
      pluginId: plugin.id,
      changedPath,
      timestamp: Date.now()
    }, {
      delay: 1000,
      dedupe: true
    });
  }
  
  async processReload(job: ReloadJob): Promise<void> {
    const plugin = await this.registry.get(job.pluginId);
    if (!plugin) return;
    
    try {
      // 1. Create new instance
      const newPlugin = await this.loader.reloadPlugin(job.pluginId);
      
      // 2. Pause traffic
      await this.router.pausePlugin(plugin.id);
      
      // 3. Drain existing connections
      await this.drainConnections(plugin);
      
      // 4. Swap instances
      await this.swapPlugins(plugin, newPlugin);
      
      // 5. Resume traffic
      await this.router.resumePlugin(newPlugin.id);
      
      // 6. Cleanup old instance
      await plugin.dispose();
      
      this.logger.info(`Plugin ${job.pluginId} reloaded successfully`);
    } catch (error) {
      this.logger.error(`Failed to reload plugin ${job.pluginId}`, error);
      await this.handleReloadFailure(plugin, error);
    }
  }
}
```

### Version Management

```typescript
class PluginVersionManager {
  private versions: Map<string, PluginVersion[]>;
  
  async upgradePlugin(
    pluginId: string, 
    targetVersion: string
  ): Promise<void> {
    const current = await this.getCurrentVersion(pluginId);
    const target = await this.resolveVersion(pluginId, targetVersion);
    
    // Check if upgrade path exists
    const upgradePath = await this.findUpgradePath(current, target);
    if (!upgradePath) {
      throw new Error(`No upgrade path from ${current} to ${target}`);
    }
    
    // Execute upgrade steps
    for (const step of upgradePath) {
      await this.executeUpgradeStep(pluginId, step);
    }
  }
  
  private async executeUpgradeStep(
    pluginId: string,
    step: UpgradeStep
  ): Promise<void> {
    // 1. Backup current state
    const backup = await this.backupPlugin(pluginId);
    
    try {
      // 2. Run pre-upgrade hooks
      await this.runHooks('pre-upgrade', step);
      
      // 3. Apply version changes
      await this.applyVersionChanges(pluginId, step);
      
      // 4. Run migrations
      await this.runMigrations(pluginId, step);
      
      // 5. Validate upgrade
      await this.validateUpgrade(pluginId, step);
      
      // 6. Run post-upgrade hooks
      await this.runHooks('post-upgrade', step);
    } catch (error) {
      // Rollback on failure
      await this.rollbackPlugin(pluginId, backup);
      throw error;
    }
  }
}
```

## Configuration Management

### Schema-based Configuration

```json
// schema/config.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "GitHub Git Provider Configuration",
  "type": "object",
  "required": ["auth"],
  "properties": {
    "auth": {
      "type": "object",
      "oneOf": [
        {
          "properties": {
            "type": { "const": "token" },
            "token": { 
              "type": "string",
              "pattern": "^(ghp_|github_pat_)",
              "description": "GitHub personal access token"
            }
          },
          "required": ["type", "token"]
        },
        {
          "properties": {
            "type": { "const": "oauth" },
            "clientId": { "type": "string" },
            "clientSecret": { "type": "string" },
            "redirectUri": { "type": "string", "format": "uri" }
          },
          "required": ["type", "clientId", "clientSecret"]
        },
        {
          "properties": {
            "type": { "const": "app" },
            "appId": { "type": "integer" },
            "privateKey": { "type": "string" },
            "installationId": { "type": "integer" }
          },
          "required": ["type", "appId", "privateKey"]
        }
      ]
    },
    "baseUrl": {
      "type": "string",
      "format": "uri",
      "default": "https://api.github.com",
      "description": "GitHub API base URL"
    },
    "timeout": {
      "type": "integer",
      "minimum": 1000,
      "maximum": 300000,
      "default": 30000,
      "description": "Request timeout in milliseconds"
    },
    "retry": {
      "type": "object",
      "properties": {
        "attempts": {
          "type": "integer",
          "minimum": 0,
          "maximum": 10,
          "default": 3
        },
        "delay": {
          "type": "integer",
          "minimum": 100,
          "default": 1000
        },
        "maxDelay": {
          "type": "integer",
          "minimum": 1000,
          "default": 30000
        },
        "factor": {
          "type": "number",
          "minimum": 1,
          "default": 2
        }
      }
    },
    "rateLimit": {
      "type": "object",
      "properties": {
        "maxRequests": {
          "type": "integer",
          "minimum": 1,
          "default": 5000
        },
        "windowMs": {
          "type": "integer",
          "minimum": 1000,
          "default": 3600000
        },
        "strategy": {
          "type": "string",
          "enum": ["throw", "queue", "throttle"],
          "default": "queue"
        }
      }
    },
    "cache": {
      "type": "object",
      "properties": {
        "enabled": {
          "type": "boolean",
          "default": true
        },
        "ttl": {
          "type": "integer",
          "minimum": 0,
          "default": 300
        },
        "maxSize": {
          "type": "integer",
          "minimum": 1,
          "default": 1000
        }
      }
    }
  }
}
```

### Configuration Validation

```typescript
class ConfigurationValidator {
  private ajv: Ajv;
  private schemas: Map<string, JSONSchema>;
  
  async validateConfig(
    config: any,
    schemaPath: string
  ): Promise<ValidationResult> {
    // Load schema
    const schema = await this.loadSchema(schemaPath);
    
    // Compile validator
    const validate = this.ajv.compile(schema);
    
    // Validate config
    const valid = validate(config);
    
    if (!valid) {
      return {
        valid: false,
        errors: this.formatErrors(validate.errors)
      };
    }
    
    // Additional validations
    const customErrors = await this.customValidations(config);
    
    return {
      valid: customErrors.length === 0,
      errors: customErrors
    };
  }
  
  private async customValidations(config: any): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    // Check token validity
    if (config.auth?.type === 'token') {
      const isValid = await this.validateGitHubToken(config.auth.token);
      if (!isValid) {
        errors.push({
          path: '/auth/token',
          message: 'Invalid or expired GitHub token'
        });
      }
    }
    
    // Check network connectivity
    if (config.baseUrl) {
      const isReachable = await this.checkEndpoint(config.baseUrl);
      if (!isReachable) {
        errors.push({
          path: '/baseUrl',
          message: 'GitHub API endpoint is not reachable'
        });
      }
    }
    
    return errors;
  }
}
```

## Security Considerations

### Plugin Isolation

```typescript
class PluginSandbox {
  private vm: VM;
  private permissions: Permissions;
  
  constructor(permissions: Permissions) {
    this.permissions = permissions;
    this.vm = new VM({
      timeout: permissions.timeout || 30000,
      sandbox: this.createSandbox()
    });
  }
  
  private createSandbox(): SandboxGlobals {
    return {
      // Restricted globals
      console: this.createSafeConsole(),
      process: this.createSafeProcess(),
      require: this.createSafeRequire(),
      
      // Plugin SDK
      mosaic: {
        logger: this.createSafeLogger(),
        metrics: this.createSafeMetrics(),
        storage: this.createSafeStorage(),
        http: this.createSafeHttp()
      },
      
      // Remove dangerous globals
      eval: undefined,
      Function: undefined,
      __dirname: undefined,
      __filename: undefined
    };
  }
  
  private createSafeHttp(): SafeHttp {
    return {
      request: async (options: RequestOptions) => {
        // Check network permissions
        const url = new URL(options.url);
        if (!this.permissions.network.includes(url.hostname)) {
          throw new SecurityError(
            `Network access to ${url.hostname} is not allowed`
          );
        }
        
        // Make request with restrictions
        return await this.makeSecureRequest(options);
      }
    };
  }
  
  async execute(code: string, context: any = {}): Promise<any> {
    try {
      return await this.vm.run(code, {
        ...this.createSandbox(),
        ...context
      });
    } catch (error) {
      if (error.message.includes('Script execution timed out')) {
        throw new TimeoutError('Plugin execution timeout');
      }
      throw error;
    }
  }
}
```

### Authentication Security

```typescript
class SecureAuthManager {
  private vault: ISecretVault;
  private crypto: ICrypto;
  
  async storeCredential(
    pluginId: string,
    credential: Credential
  ): Promise<void> {
    // Encrypt sensitive data
    const encrypted = await this.crypto.encrypt(
      credential.value,
      this.getEncryptionKey(pluginId)
    );
    
    // Store in vault
    await this.vault.store(`plugin:${pluginId}:${credential.name}`, {
      value: encrypted,
      metadata: {
        type: credential.type,
        created: new Date().toISOString(),
        expires: credential.expires
      }
    });
  }
  
  async retrieveCredential(
    pluginId: string,
    name: string
  ): Promise<Credential> {
    // Retrieve from vault
    const stored = await this.vault.retrieve(`plugin:${pluginId}:${name}`);
    if (!stored) {
      throw new NotFoundError('Credential not found');
    }
    
    // Check expiration
    if (stored.metadata.expires && new Date(stored.metadata.expires) < new Date()) {
      throw new ExpiredError('Credential has expired');
    }
    
    // Decrypt
    const decrypted = await this.crypto.decrypt(
      stored.value,
      this.getEncryptionKey(pluginId)
    );
    
    return {
      name,
      type: stored.metadata.type,
      value: decrypted,
      expires: stored.metadata.expires
    };
  }
  
  async rotateCredentials(pluginId: string): Promise<void> {
    const credentials = await this.vault.list(`plugin:${pluginId}:*`);
    
    for (const cred of credentials) {
      // Generate new credential
      const newValue = await this.generateNewCredential(cred);
      
      // Update in provider
      await this.updateProviderCredential(pluginId, cred, newValue);
      
      // Store new value
      await this.storeCredential(pluginId, {
        ...cred,
        value: newValue
      });
    }
  }
}
```

## Performance Optimization

### Caching Strategy

```typescript
class PluginCache {
  private l1Cache: LRUCache<string, any>; // Memory
  private l2Cache: IRedisClient;          // Redis
  private strategies: Map<string, CacheStrategy>;
  
  constructor(config: CacheConfig) {
    this.l1Cache = new LRUCache({
      max: config.l1MaxSize || 1000,
      ttl: config.l1TTL || 60000
    });
    
    this.l2Cache = new RedisClient(config.redis);
    
    // Initialize strategies
    this.strategies = new Map([
      ['aggressive', new AggressiveCacheStrategy()],
      ['conservative', new ConservativeCacheStrategy()],
      ['adaptive', new AdaptiveCacheStrategy()]
    ]);
  }
  
  async get(
    key: string,
    options: CacheOptions = {}
  ): Promise<CachedValue | null> {
    // Try L1 cache
    const l1Value = this.l1Cache.get(key);
    if (l1Value && !this.isStale(l1Value, options)) {
      this.metrics.increment('cache.l1.hit');
      return l1Value;
    }
    
    // Try L2 cache
    const l2Value = await this.l2Cache.get(key);
    if (l2Value && !this.isStale(l2Value, options)) {
      // Promote to L1
      this.l1Cache.set(key, l2Value);
      this.metrics.increment('cache.l2.hit');
      return l2Value;
    }
    
    this.metrics.increment('cache.miss');
    return null;
  }
  
  async set(
    key: string,
    value: any,
    options: CacheOptions = {}
  ): Promise<void> {
    const strategy = this.strategies.get(options.strategy || 'conservative');
    const cacheValue = {
      value,
      timestamp: Date.now(),
      ttl: options.ttl || strategy.getDefaultTTL(key),
      metadata: options.metadata
    };
    
    // Write to both caches
    await Promise.all([
      this.l1Cache.set(key, cacheValue),
      this.l2Cache.set(key, cacheValue, cacheValue.ttl)
    ]);
  }
  
  async invalidate(pattern: string): Promise<void> {
    // Invalidate L1
    for (const key of this.l1Cache.keys()) {
      if (minimatch(key, pattern)) {
        this.l1Cache.delete(key);
      }
    }
    
    // Invalidate L2
    const keys = await this.l2Cache.keys(pattern);
    if (keys.length > 0) {
      await this.l2Cache.del(...keys);
    }
  }
}
```

### Connection Pooling

```typescript
class PluginConnectionPool {
  private pools: Map<string, ConnectionPool>;
  private config: PoolConfig;
  
  async getConnection(
    pluginId: string,
    endpoint: string
  ): Promise<Connection> {
    const poolKey = `${pluginId}:${endpoint}`;
    
    // Get or create pool
    let pool = this.pools.get(poolKey);
    if (!pool) {
      pool = await this.createPool(pluginId, endpoint);
      this.pools.set(poolKey, pool);
    }
    
    // Get connection with timeout
    const connection = await pool.acquire({
      timeout: this.config.acquireTimeout || 5000
    });
    
    // Wrap connection for automatic release
    return this.wrapConnection(connection, pool);
  }
  
  private async createPool(
    pluginId: string,
    endpoint: string
  ): Promise<ConnectionPool> {
    const plugin = await this.registry.get(pluginId);
    
    return new ConnectionPool({
      create: async () => {
        const conn = await plugin.createConnection(endpoint);
        await this.validateConnection(conn);
        return conn;
      },
      destroy: async (conn) => {
        await conn.close();
      },
      validate: async (conn) => {
        return conn.isAlive();
      },
      min: this.config.minConnections || 2,
      max: this.config.maxConnections || 10,
      idleTimeout: this.config.idleTimeout || 30000,
      evictionInterval: this.config.evictionInterval || 60000
    });
  }
  
  private wrapConnection(
    connection: Connection,
    pool: ConnectionPool
  ): Connection {
    return new Proxy(connection, {
      get(target, prop) {
        if (prop === 'release') {
          return () => pool.release(connection);
        }
        if (prop === Symbol.asyncDispose) {
          return async () => pool.release(connection);
        }
        return target[prop];
      }
    });
  }
}
```

## Plugin Examples

### Complete GitHub Plugin

```typescript
// plugins/github-git/src/index.ts
import { BasePlugin, GitPlugin } from '@mosaic/plugin-sdk';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { throttling } from '@octokit/plugin-throttling';

const MyOctokit = Octokit.plugin(throttling);

export class GitHubGitPlugin extends BasePlugin implements GitPlugin {
  private octokit: Octokit;
  private authType: string;
  
  readonly id = 'github-git-provider';
  readonly name = 'GitHub Git Provider';
  readonly version = '1.0.0';
  readonly type = 'git';
  readonly provider = 'github';
  
  protected async setupResources(): Promise<void> {
    // Initialize Octokit based on auth type
    this.authType = this.config.auth.type;
    
    switch (this.authType) {
      case 'token':
        this.octokit = new MyOctokit({
          auth: this.config.auth.token,
          throttle: {
            onRateLimit: this.onRateLimit.bind(this),
            onSecondaryRateLimit: this.onSecondaryRateLimit.bind(this)
          }
        });
        break;
        
      case 'app':
        this.octokit = new MyOctokit({
          authStrategy: createAppAuth,
          auth: {
            appId: this.config.auth.appId,
            privateKey: this.config.auth.privateKey,
            installationId: this.config.auth.installationId
          }
        });
        break;
        
      default:
        throw new Error(`Unsupported auth type: ${this.authType}`);
    }
  }
  
  // Repository operations
  async createRepository(params: CreateRepoParams): Promise<Repository> {
    this.logger.debug('Creating repository', params);
    
    try {
      const response = await this.octokit.repos.createForAuthenticatedUser({
        name: params.name,
        description: params.description,
        private: params.private || false,
        auto_init: params.autoInit || false,
        license_template: params.license,
        gitignore_template: params.gitignore
      });
      
      return this.transformRepository(response.data);
    } catch (error) {
      throw this.handleGitHubError(error);
    }
  }
  
  async createBranch(params: CreateBranchParams): Promise<Branch> {
    const [owner, repo] = params.repository.split('/');
    
    // Get base branch ref
    const { data: ref } = await this.octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${params.baseBranch || 'main'}`
    });
    
    // Create new branch
    const { data: newRef } = await this.octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${params.name}`,
      sha: ref.object.sha
    });
    
    return {
      name: params.name,
      sha: newRef.object.sha,
      protected: false
    };
  }
  
  async createPullRequest(params: CreatePRParams): Promise<PullRequest> {
    const [owner, repo] = params.repository.split('/');
    
    const { data: pr } = await this.octokit.pulls.create({
      owner,
      repo,
      title: params.title,
      body: params.description,
      head: params.sourceBranch,
      base: params.targetBranch,
      draft: params.draft || false
    });
    
    return this.transformPullRequest(pr);
  }
  
  // Rate limit handling
  private onRateLimit(retryAfter: number, options: any) {
    this.logger.warn(
      `Rate limit hit for ${options.method} ${options.url}, retrying after ${retryAfter}s`
    );
    
    if (options.request.retryCount < 3) {
      this.logger.info(`Retrying request after ${retryAfter} seconds`);
      return true;
    }
    
    return false;
  }
  
  private onSecondaryRateLimit(retryAfter: number, options: any) {
    this.logger.warn(
      `Secondary rate limit hit for ${options.method} ${options.url}`
    );
    return false;
  }
  
  // Error handling
  private handleGitHubError(error: any): Error {
    if (error.status === 404) {
      return new NotFoundError(
        `GitHub resource not found: ${error.message}`
      );
    }
    
    if (error.status === 401) {
      return new AuthenticationError(
        `GitHub authentication failed: ${error.message}`
      );
    }
    
    if (error.status === 403) {
      if (error.response?.headers['x-ratelimit-remaining'] === '0') {
        const reset = error.response.headers['x-ratelimit-reset'];
        return new RateLimitError(
          `GitHub rate limit exceeded. Resets at ${new Date(reset * 1000)}`
        );
      }
      return new AuthorizationError(
        `GitHub authorization failed: ${error.message}`
      );
    }
    
    if (error.status === 422) {
      return new ValidationError(
        `GitHub validation failed: ${error.message}`,
        error.response?.data?.errors
      );
    }
    
    return new PluginError(
      `GitHub operation failed: ${error.message}`
    );
  }
  
  // Transformers
  private transformRepository(repo: any): Repository {
    return {
      id: repo.id.toString(),
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      url: repo.html_url,
      cloneUrl: repo.clone_url,
      defaultBranch: repo.default_branch,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      provider: 'github'
    };
  }
  
  private transformPullRequest(pr: any): PullRequest {
    return {
      id: pr.id.toString(),
      number: pr.number,
      title: pr.title,
      description: pr.body,
      state: pr.state,
      sourceBranch: pr.head.ref,
      targetBranch: pr.base.ref,
      author: pr.user.login,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      provider: 'github'
    };
  }
}
```

### Multi-Provider Router Plugin

```typescript
// plugins/multi-git-router/src/index.ts
import { BasePlugin, GitPlugin, RouterPlugin } from '@mosaic/plugin-sdk';

export class MultiGitRouterPlugin extends BasePlugin implements RouterPlugin {
  private providers: Map<string, GitPlugin>;
  private rules: RoutingRule[];
  
  readonly id = 'multi-git-router';
  readonly name = 'Multi-Provider Git Router';
  readonly version = '1.0.0';
  readonly type = 'router';
  readonly routerType = 'git';
  
  async initialize(config: PluginConfig): Promise<void> {
    await super.initialize(config);
    
    // Load routing rules
    this.rules = await this.loadRoutingRules(config.rulesPath);
    
    // Initialize provider map
    this.providers = new Map();
  }
  
  async registerProvider(provider: GitPlugin): Promise<void> {
    this.providers.set(provider.id, provider);
    this.logger.info(`Registered provider: ${provider.id}`);
  }
  
  async route(operation: string, params: any): Promise<any> {
    const context = this.buildRoutingContext(operation, params);
    const provider = await this.selectProvider(context);
    
    if (!provider) {
      throw new NoProviderError(
        `No provider available for operation: ${operation}`
      );
    }
    
    // Execute operation
    const method = provider[operation];
    if (typeof method !== 'function') {
      throw new UnsupportedOperationError(
        `Provider ${provider.id} does not support operation: ${operation}`
      );
    }
    
    try {
      return await method.call(provider, params);
    } catch (error) {
      // Try fallback if available
      const fallback = await this.selectFallback(context, provider.id);
      if (fallback) {
        this.logger.warn(
          `Primary provider ${provider.id} failed, trying fallback ${fallback.id}`
        );
        return await fallback[operation](params);
      }
      throw error;
    }
  }
  
  private async selectProvider(context: RoutingContext): Promise<GitPlugin> {
    // Evaluate rules
    for (const rule of this.rules) {
      if (rule.matches(context)) {
        const provider = this.providers.get(rule.providerId);
        if (provider && await this.isHealthy(provider)) {
          return provider;
        }
      }
    }
    
    // Fall back to load balancing
    return this.loadBalance(context);
  }
  
  private async isHealthy(provider: GitPlugin): Promise<boolean> {
    try {
      const health = await provider.healthCheck();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  }
  
  private buildRoutingContext(
    operation: string, 
    params: any
  ): RoutingContext {
    return {
      operation,
      params,
      metadata: {
        timestamp: Date.now(),
        requestId: generateRequestId(),
        user: this.context.user,
        tenant: this.context.tenant
      }
    };
  }
}
```

---

This plugin system design provides a robust, secure, and extensible foundation for building multi-provider orchestration capabilities in the MosAIc platform.