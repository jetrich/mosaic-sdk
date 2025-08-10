# E.100 NPM Package Architecture - Complete Design

**Status**: ✅ COMPLETE  
**Epic**: E.100 - MosAIc Stack NPM Package Architecture  
**Systems Architect**: ARCH-SYSTEMS-ALEX  
**Version**: 1.0.0  

## Executive Summary

This document defines the complete NPM package architecture for the MosAIc Stack, providing a scalable, maintainable package ecosystem that supports enterprise-grade AI development. The architecture enables independent package publishing, universal provider abstraction, and seamless integration with existing CI/CD pipelines.

## Architecture Overview

### Package Hierarchy

```
@mosaicstack/
├── stack                    # Meta-package & CLI entry point
├── core/                    # Core Framework Packages
│   ├── config              # Configuration management
│   ├── providers           # Universal AI provider abstraction
│   ├── types               # Shared TypeScript definitions
│   └── utils               # Common utilities
├── orchestration/           # Agent & Task Orchestration
│   ├── mcp-orchestrator    # MCP-based task orchestration
│   ├── tony                # Tony Framework integration
│   ├── agents              # Agent management system
│   └── workflow            # Workflow orchestration
├── integrations/            # External Service Integrations
│   ├── mcp-common          # Common MCP utilities
│   ├── mcp-bookstack       # BookStack documentation
│   ├── mcp-gitea-remote    # Gitea integration
│   ├── mcp-woodpecker      # Woodpecker CI/CD
│   └── mcp-plane           # Plane project management
├── platform/               # Platform Services
│   ├── cli                 # Command-line interface
│   ├── dashboard           # Web dashboard
│   ├── telemetry           # Monitoring & analytics
│   └── security           # Security & authentication
└── tools/                  # Development Tools
    ├── build-tools         # Build utilities
    ├── testing             # Testing framework
    └── dev-server          # Development server
```

## Package Specifications

### 1. Meta Package: @mosaicstack/stack

**Purpose**: Primary entry point and orchestrator for the entire MosAIc ecosystem.

```json
{
  "name": "@mosaicstack/stack",
  "version": "0.1.0",
  "description": "Complete enterprise AI development platform orchestrator",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "mosaicstack": "./dist/cli/index.js",
    "mosaic-stack": "./dist/cli/index.js"
  },
  "dependencies": {
    "@mosaicstack/core": "^0.1.0",
    "@mosaicstack/orchestration": "^0.1.0",
    "@mosaicstack/platform": "^0.1.0",
    "@mosaicstack/tools": "^0.1.0"
  },
  "peerDependencies": {
    "node": ">=18.0.0"
  }
}
```

### 2. Core Framework Packages

#### @mosaicstack/core

```json
{
  "name": "@mosaicstack/core",
  "version": "0.1.0",
  "description": "Core framework components for MosAIc Stack",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./config": "./dist/config/index.js",
    "./providers": "./dist/providers/index.js",
    "./types": "./dist/types/index.js",
    "./utils": "./dist/utils/index.js"
  },
  "dependencies": {
    "@mosaicstack/types": "^0.1.0",
    "@mosaicstack/utils": "^0.1.0"
  }
}
```

#### @mosaicstack/providers

```json
{
  "name": "@mosaicstack/providers",
  "version": "0.1.0",
  "description": "Universal AI provider abstraction layer supporting 75+ LLM providers",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./claude": "./dist/providers/claude/index.js",
    "./openai": "./dist/providers/openai/index.js",
    "./ollama": "./dist/providers/ollama/index.js",
    "./anthropic": "./dist/providers/anthropic/index.js",
    "./registry": "./dist/registry/index.js"
  },
  "dependencies": {
    "@mosaicstack/types": "^0.1.0",
    "ollama": "^0.5.0"
  },
  "peerDependencies": {
    "@anthropic-ai/sdk": "^0.20.0",
    "openai": "^4.0.0"
  }
}
```

### 3. Orchestration Packages

#### @mosaicstack/mcp-orchestrator

```json
{
  "name": "@mosaicstack/mcp-orchestrator",
  "version": "1.0.0",
  "description": "MCP-based agent and task orchestration system",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "mosaic-mcp": "./bin/mosaic-mcp"
  },
  "dependencies": {
    "@mosaicstack/core": "^0.1.0",
    "@mosaicstack/types": "^0.1.0",
    "sqlite3": "^5.1.0"
  }
}
```

#### @mosaicstack/tony

```json
{
  "name": "@mosaicstack/tony",
  "version": "0.1.0",
  "description": "Tony Framework for AI agent orchestration",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "tony": "./bin/tony"
  },
  "dependencies": {
    "@mosaicstack/core": "^0.1.0",
    "@mosaicstack/mcp-orchestrator": "^1.0.0"
  }
}
```

### 4. Integration Packages

All MCP integration packages follow a consistent pattern:

```json
{
  "name": "@mosaicstack/mcp-{service}",
  "version": "0.1.0",
  "description": "MosAIc integration for {Service}",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "@mosaicstack/mcp-common": "^0.1.0",
    "@mosaicstack/types": "^0.1.0"
  }
}
```

### 5. Platform Packages

#### @mosaicstack/cli

```json
{
  "name": "@mosaicstack/cli",
  "version": "0.1.0",
  "description": "Command-line interface for MosAIc Stack",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "mosaic": "./bin/mosaic"
  },
  "dependencies": {
    "@mosaicstack/core": "^0.1.0",
    "@mosaicstack/providers": "^0.1.0",
    "commander": "^11.0.0",
    "inquirer": "^9.2.0"
  }
}
```

## Provider Abstraction Interface

### Universal Provider Interface

```typescript
// @mosaicstack/types/src/providers/index.ts

export interface AIProvider {
  readonly name: string;
  readonly type: 'local' | 'remote' | 'hybrid';
  readonly capabilities: ProviderCapabilities;
  
  // Core Methods
  initialize(config: ProviderConfig): Promise<void>;
  getStatus(): Promise<ProviderStatus>;
  listModels(): Promise<ModelInfo[]>;
  
  // Chat & Completion
  chat(request: ChatRequest): Promise<ChatResponse>;
  chatStream(request: ChatRequest): AsyncGenerator<ChatChunk>;
  
  // Advanced Features
  embed?(text: string): Promise<number[]>;
  moderate?(content: string): Promise<ModerationResult>;
  
  // Resource Management
  dispose(): Promise<void>;
}

export interface ProviderCapabilities {
  chat: boolean;
  streaming: boolean;
  embeddings: boolean;
  moderation: boolean;
  vision: boolean;
  functionCalling: boolean;
  codeExecution: boolean;
}

export interface ProviderRegistry {
  register(provider: AIProvider): void;
  unregister(name: string): void;
  get(name: string): AIProvider | undefined;
  list(): AIProvider[];
  getByCapability(capability: keyof ProviderCapabilities): AIProvider[];
}
```

### Provider Factory Pattern

```typescript
// @mosaicstack/providers/src/factories/ProviderFactory.ts

export abstract class ProviderFactory<T extends AIProvider = AIProvider> {
  abstract readonly type: string;
  abstract readonly supportedModels: string[];
  
  abstract create(config: ProviderConfig): Promise<T>;
  abstract validate(config: ProviderConfig): boolean;
  
  static register<F extends ProviderFactory>(factory: F): void {
    ProviderRegistry.registerFactory(factory);
  }
}

// Example implementations
export class ClaudeProviderFactory extends ProviderFactory<ClaudeProvider> {
  readonly type = 'claude';
  readonly supportedModels = ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'];
  
  async create(config: ProviderConfig): Promise<ClaudeProvider> {
    return new ClaudeProvider(config);
  }
}

export class OllamaProviderFactory extends ProviderFactory<OllamaProvider> {
  readonly type = 'ollama';
  readonly supportedModels = ['llama2', 'codellama', 'mistral'];
  
  async create(config: ProviderConfig): Promise<OllamaProvider> {
    return new OllamaProvider(config);
  }
}
```

## Mono-repo Integration Strategy

### Workspace Configuration

#### Option 1: NPM Workspaces (Current Implementation)

```json
{
  "name": "@mosaicstack/sdk",
  "private": true,
  "workspaces": [
    "packages/core/*",
    "packages/orchestration/*",
    "packages/integrations/*",
    "packages/platform/*",
    "packages/tools/*"
  ],
  "scripts": {
    "build:all": "npm run build --workspaces",
    "test:all": "npm run test --workspaces",
    "publish:all": "npm run publish --workspaces"
  }
}
```

#### Option 2: Lerna Configuration (Recommended for Scale)

```json
{
  "version": "independent",
  "npmClient": "npm",
  "command": {
    "publish": {
      "conventionalCommits": true,
      "message": "chore(release): publish packages",
      "registry": "https://npm.pkg.github.com"
    },
    "version": {
      "allowBranch": ["main", "release/*"],
      "conventionalCommits": true
    }
  },
  "packages": [
    "packages/core/*",
    "packages/orchestration/*",
    "packages/integrations/*",
    "packages/platform/*",
    "packages/tools/*"
  ]
}
```

#### Option 3: NX Configuration (Enterprise Scale)

```json
{
  "version": 2,
  "projects": {
    "core": "packages/core",
    "providers": "packages/core/providers",
    "mcp-orchestrator": "packages/orchestration/mcp-orchestrator",
    "tony": "packages/orchestration/tony",
    "cli": "packages/platform/cli",
    "stack": "packages/stack"
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["{projectRoot}/dist"]
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

### Build and Dependency Management

#### Dependency Resolution Strategy

```typescript
// tools/dependency-resolver/src/index.ts

export class DependencyResolver {
  static async resolveBuildOrder(packages: Package[]): Promise<Package[]> {
    const graph = new DependencyGraph();
    
    // Build dependency graph
    for (const pkg of packages) {
      graph.addNode(pkg.name);
      for (const dep of pkg.dependencies) {
        if (packages.find(p => p.name === dep)) {
          graph.addEdge(dep, pkg.name);
        }
      }
    }
    
    return graph.topologicalSort();
  }
}
```

#### Version Management

```typescript
// tools/version-manager/src/index.ts

export class VersionManager {
  static async syncVersions(packages: Package[]): Promise<void> {
    const matrix = await this.buildVersionMatrix(packages);
    
    for (const pkg of packages) {
      await this.updatePackageVersions(pkg, matrix);
    }
  }
  
  private static async buildVersionMatrix(packages: Package[]): Promise<VersionMatrix> {
    // Build version compatibility matrix
    const matrix: VersionMatrix = {};
    
    for (const pkg of packages) {
      matrix[pkg.name] = {
        current: pkg.version,
        dependencies: pkg.dependencies,
        compatibleWith: await this.getCompatibleVersions(pkg)
      };
    }
    
    return matrix;
  }
}
```

## CI/CD Integration

### GitHub Actions Workflow Template

```yaml
name: Package CI/CD Pipeline

on:
  push:
    branches: [main, develop, feature/*]
    paths:
      - 'packages/**'
      - '.github/workflows/**'
  pull_request:
    branches: [main, develop]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      packages: ${{ steps.changes.outputs.packages }}
    steps:
      - uses: actions/checkout@v4
      - id: changes
        run: |
          CHANGED_PACKAGES=$(node scripts/detect-package-changes.js)
          echo "packages=$CHANGED_PACKAGES" >> $GITHUB_OUTPUT

  build-and-test:
    needs: detect-changes
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package: ${{ fromJson(needs.detect-changes.outputs.packages) }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build package
        run: npm run build --workspace=${{ matrix.package }}
      
      - name: Test package
        run: npm run test --workspace=${{ matrix.package }}

  publish:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Publish packages
        run: npm run publish:changed
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Package Publishing Strategy

### Independent Versioning

Each package maintains its own semantic version:

- **@mosaicstack/core**: Foundation packages (0.x.x)
- **@mosaicstack/orchestration**: Stable orchestration (1.x.x)
- **@mosaicstack/integrations**: Service integrations (0.x.x)
- **@mosaicstack/platform**: Platform services (0.x.x)
- **@mosaicstack/tools**: Development tools (0.x.x)

### Publishing Workflow

```typescript
// scripts/publish-packages.ts

export class PackagePublisher {
  static async publishChanged(): Promise<void> {
    const changedPackages = await this.detectChangedPackages();
    const buildOrder = await DependencyResolver.resolveBuildOrder(changedPackages);
    
    for (const pkg of buildOrder) {
      await this.buildPackage(pkg);
      await this.testPackage(pkg);
      await this.publishPackage(pkg);
    }
  }
  
  private static async publishPackage(pkg: Package): Promise<void> {
    const newVersion = await this.calculateNextVersion(pkg);
    
    await this.updateVersion(pkg, newVersion);
    await this.buildFinalPackage(pkg);
    await this.publish(pkg);
    await this.tagRelease(pkg, newVersion);
  }
}
```

## Migration Strategy

### Phase 1: Package Structure Migration

1. **Reorganize existing packages** into new hierarchy
2. **Update import paths** across all packages
3. **Migrate CI/CD pipelines** to support new structure
4. **Update documentation** to reflect new architecture

### Phase 2: Provider Abstraction Implementation

1. **Extract common provider interfaces** from existing implementations
2. **Implement universal provider registry**
3. **Create factory pattern** for provider instantiation
4. **Add support for 75+ LLM providers**

### Phase 3: Mono-repo Optimization

1. **Implement Lerna or NX** for advanced dependency management
2. **Optimize build pipelines** for changed package detection
3. **Implement independent publishing** workflows
4. **Add cross-package testing** strategies

### Phase 4: Enterprise Features

1. **Add telemetry and monitoring** to all packages
2. **Implement security scanning** for all dependencies
3. **Create package usage analytics**
4. **Add enterprise deployment** templates

## Quality Gates

### Package Quality Standards

- **Code Coverage**: Minimum 80% for core packages, 70% for integrations
- **Type Safety**: Full TypeScript strict mode compliance
- **Security**: Zero high/critical vulnerabilities
- **Performance**: Package load time < 500ms
- **Size**: Core packages < 5MB, integrations < 2MB

### Automated Quality Checks

```typescript
// tools/quality-gates/src/index.ts

export class QualityGates {
  static async validatePackage(pkg: Package): Promise<ValidationResult> {
    const results = await Promise.all([
      this.checkCoverage(pkg),
      this.checkTypes(pkg),
      this.checkSecurity(pkg),
      this.checkPerformance(pkg),
      this.checkSize(pkg)
    ]);
    
    return {
      package: pkg.name,
      passed: results.every(r => r.passed),
      results
    };
  }
}
```

## OpenCode Integration

### Models.dev Compatibility

The provider abstraction layer is designed to be compatible with OpenCode's models.dev approach:

```typescript
// @mosaicstack/providers/src/opencode/ModelsDevAdapter.ts

export class ModelsDevAdapter implements AIProvider {
  readonly name = 'models.dev';
  readonly type = 'remote';
  
  async initialize(config: ProviderConfig): Promise<void> {
    // Initialize with models.dev endpoint
  }
  
  async listModels(): Promise<ModelInfo[]> {
    // Fetch available models from models.dev
  }
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    // Route to appropriate model via models.dev
  }
}
```

## Conclusion

This NPM package architecture provides:

1. **Scalable Structure**: Clear separation of concerns with logical package boundaries
2. **Universal Provider Support**: Abstraction layer supporting 75+ LLM providers
3. **Enterprise-Ready**: Independent versioning, quality gates, and CI/CD integration
4. **Developer-Friendly**: Consistent APIs, comprehensive tooling, and clear documentation
5. **Future-Proof**: Extensible design supporting new providers and capabilities

The architecture enables the MosAIc platform to scale from individual development to enterprise deployment while maintaining code quality and developer experience.

---

**Next Steps**:
1. Implement the new package structure
2. Migrate existing packages to new hierarchy
3. Create provider abstraction layer
4. Setup mono-repo tooling (Lerna/NX)
5. Implement CI/CD pipeline templates
6. Create migration guides for existing users

**Dependencies**: This epic completion enables E.200 (Agent Orchestration) and provides foundation for all subsequent development work.