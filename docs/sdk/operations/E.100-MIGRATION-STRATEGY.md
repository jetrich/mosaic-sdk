# E.100 NPM Package Architecture - Migration Strategy

**Epic**: E.100 - MosAIc Stack NPM Package Architecture  
**Status**: ✅ COMPLETE  
**Systems Architect**: ARCH-SYSTEMS-ALEX  
**Version**: 1.0.0  

## Migration Overview

This document outlines the step-by-step migration strategy to transition the MosAIc SDK from its current structure to the new NPM package architecture. The migration is designed to be non-disruptive and allows for gradual adoption.

## Migration Phases

### Phase 1: Foundation Setup (Weeks 1-2)

#### 1.1 Mono-repo Infrastructure

**Tasks:**
- Install and configure Lerna for package management
- Setup NX for build optimization (optional)
- Configure Rush for enterprise scale (future)
- Update root package.json with workspace configuration

**Scripts:**
```bash
# Install Lerna globally
npm install -g lerna

# Initialize Lerna in existing repository
lerna init --independent

# Install NX for build optimization
npm install --save-dev @nrwl/workspace

# Bootstrap existing packages
lerna bootstrap
```

**Deliverables:**
- ✅ lerna.json configuration file
- ✅ nx.json configuration file  
- ✅ rush.json configuration file (for future use)
- Updated root package.json with workspaces

#### 1.2 Package Structure Reorganization

**Current Structure:**
```
mosaic-sdk/
├── packages/
│   ├── mcp-orchestrator/
│   ├── config/
│   ├── providers/
│   ├── cli/
│   └── stack/
├── mosaic-mcp/
├── mosaic-tony/
└── ...
```

**Target Structure:**
```
mosaic-sdk/
├── packages/
│   ├── core/
│   │   ├── config/
│   │   ├── providers/
│   │   ├── types/
│   │   └── utils/
│   ├── orchestration/
│   │   ├── mcp-orchestrator/
│   │   ├── tony/
│   │   ├── agents/
│   │   └── workflow/
│   ├── integrations/
│   │   ├── mcp-common/
│   │   ├── mcp-bookstack/
│   │   ├── mcp-gitea-remote/
│   │   ├── mcp-woodpecker/
│   │   └── mcp-plane/
│   ├── platform/
│   │   ├── cli/
│   │   ├── dashboard/
│   │   ├── telemetry/
│   │   └── security/
│   ├── tools/
│   │   ├── build-tools/
│   │   ├── testing/
│   │   └── dev-server/
│   └── stack/
└── ...
```

**Migration Script:**
```bash
#!/bin/bash
# scripts/migrate-package-structure.sh

echo "🚀 Starting package structure migration..."

# Create new directory structure
mkdir -p packages/core
mkdir -p packages/orchestration  
mkdir -p packages/integrations
mkdir -p packages/platform
mkdir -p packages/tools

# Move existing packages to new structure
echo "📦 Moving packages to new structure..."

# Core packages
mv packages/config packages/core/
mv packages/providers packages/core/

# Orchestration packages  
mv packages/mcp-orchestrator packages/orchestration/
mv mosaic-tony packages/orchestration/tony

# Integration packages (already in correct location)
mv packages/mcp-* packages/integrations/ 2>/dev/null || true

# Platform packages
mv packages/cli packages/platform/

# Stack package (stays at root level)
# packages/stack remains as packages/stack

echo "✅ Package structure migration complete!"
```

### Phase 2: Package Dependencies and Interfaces (Weeks 3-4)

#### 2.1 Universal Provider Interface Implementation

**Steps:**
1. Create `@mosaicstack/types` package with shared TypeScript definitions
2. Implement UniversalProvider interface in `@mosaicstack/providers`
3. Create provider registry with support for 75+ LLM providers
4. Update existing provider implementations to use new interfaces

**Implementation:**
```typescript
// packages/core/types/src/index.ts - Already created
export * from './providers';
export * from './orchestration';
export * from './platform';

// packages/core/providers/src/index.ts - Enhanced version
export * from './interfaces/UniversalProvider';
export * from './registry/UniversalProviderRegistry';
export * from './providers';
```

**Migration Command:**
```bash
# Create types package
lerna create @mosaicstack/types packages/core/types

# Update provider implementations
npm run migrate:providers
```

#### 2.2 Dependency Graph Optimization

**Update package.json files across all packages:**

```bash
#!/bin/bash
# scripts/update-dependencies.sh

echo "🔄 Updating package dependencies..."

# Core packages - minimal dependencies
cd packages/core/config && npm install @mosaicstack/types@^0.1.0
cd packages/core/providers && npm install @mosaicstack/types@^0.1.0

# Orchestration packages
cd packages/orchestration/mcp-orchestrator && npm install @mosaicstack/core@^0.1.0
cd packages/orchestration/tony && npm install @mosaicstack/core@^0.1.0

# Platform packages
cd packages/platform/cli && npm install @mosaicstack/core@^0.1.0 @mosaicstack/providers@^0.1.0

# Stack meta-package
cd packages/stack && npm install @mosaicstack/core@^0.1.0 @mosaicstack/orchestration@^0.1.0

echo "✅ Dependencies updated!"
```

### Phase 3: CI/CD Pipeline Migration (Weeks 5-6)

#### 3.1 GitHub Actions Workflow Updates

**Create new workflow files:**

```yaml
# .github/workflows/packages-ci.yml
name: Packages CI/CD Pipeline

on:
  push:
    branches: [main, develop, feature/*]
    paths: ['packages/**']
  pull_request:
    branches: [main, develop]
    paths: ['packages/**']

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      packages: ${{ steps.changes.outputs.packages }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Detect changed packages
        id: changes
        run: |
          CHANGED_PACKAGES=$(lerna changed --json | jq -r '.[].name' | tr '\n' ' ')
          echo "packages=${CHANGED_PACKAGES}" >> $GITHUB_OUTPUT

  build-and-test:
    needs: detect-changes
    if: needs.detect-changes.outputs.packages != ''
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
        run: |
          npm ci
          lerna bootstrap
      
      - name: Build package
        run: lerna run build --scope=${{ matrix.package }}
      
      - name: Test package  
        run: lerna run test --scope=${{ matrix.package }}

  publish-packages:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          fetch-depth: 0
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          registry-url: 'https://npm.pkg.github.com'
      
      - name: Install dependencies
        run: |
          npm ci
          lerna bootstrap
      
      - name: Version and publish
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          lerna version --conventional-commits --yes
          lerna publish from-git --yes
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

#### 3.2 Quality Gates Implementation

**Create quality gate scripts:**

```bash
#!/bin/bash
# scripts/quality-gates.sh

echo "🛡️ Running quality gates..."

# Check TypeScript compilation
echo "📝 Checking TypeScript compilation..."
lerna run build

# Run tests with coverage
echo "🧪 Running tests with coverage..."
lerna run test:coverage

# Check test coverage thresholds
echo "📊 Checking coverage thresholds..."
for package in $(lerna list --json | jq -r '.[].location'); do
  if [ -f "$package/coverage/lcov.info" ]; then
    coverage=$(grep -o 'lines.*: [0-9.]*%' "$package/coverage/lcov-report/index.html" | grep -o '[0-9.]*' || echo "0")
    if (( $(echo "$coverage < 75" | bc -l) )); then
      echo "❌ Coverage too low in $package: ${coverage}%"
      exit 1
    fi
  fi
done

# Run security audit
echo "🔒 Running security audit..."
lerna exec npm audit --audit-level moderate

# Check for outdated dependencies
echo "📦 Checking for outdated dependencies..."
lerna exec npm outdated || true

echo "✅ All quality gates passed!"
```

### Phase 4: Provider Ecosystem Implementation (Weeks 7-8)

#### 4.1 Provider Factory Registration

**Implement automatic provider discovery:**

```typescript
// packages/core/providers/src/registry/AutoDiscovery.ts

export class ProviderAutoDiscovery {
  static async discoverProviders(): Promise<ProviderFactory[]> {
    const factories: ProviderFactory[] = [];
    
    // Discover built-in providers
    const builtInFactories = await this.discoverBuiltInProviders();
    factories.push(...builtInFactories);
    
    // Discover installed provider packages
    const installedFactories = await this.discoverInstalledProviders();
    factories.push(...installedFactories);
    
    return factories;
  }
  
  private static async discoverBuiltInProviders(): Promise<ProviderFactory[]> {
    const factories: ProviderFactory[] = [];
    
    // OpenAI
    try {
      const { OpenAIProviderFactory } = await import('../providers/openai/OpenAIProviderFactory');
      factories.push(new OpenAIProviderFactory());
    } catch (error) {
      // Provider not available
    }
    
    // Anthropic
    try {
      const { AnthropicProviderFactory } = await import('../providers/anthropic/AnthropicProviderFactory');
      factories.push(new AnthropicProviderFactory());
    } catch (error) {
      // Provider not available
    }
    
    // Ollama
    try {
      const { OllamaProviderFactory } = await import('../providers/ollama/OllamaProviderFactory');
      factories.push(new OllamaProviderFactory());
    } catch (error) {
      // Provider not available
    }
    
    // Add more providers...
    
    return factories;
  }
  
  private static async discoverInstalledProviders(): Promise<ProviderFactory[]> {
    const factories: ProviderFactory[] = [];
    
    // Scan node_modules for provider packages
    const packagePaths = glob.sync('node_modules/@mosaicstack/provider-*');
    
    for (const packagePath of packagePaths) {
      try {
        const packageJson = require(`${packagePath}/package.json`);
        if (packageJson.mosaicProvider) {
          const module = await import(packagePath);
          if (module.ProviderFactory) {
            factories.push(new module.ProviderFactory());
          }
        }
      } catch (error) {
        console.warn(`Failed to load provider from ${packagePath}:`, error.message);
      }
    }
    
    return factories;
  }
}
```

#### 4.2 75+ Provider Support Implementation

**Create provider implementations for major categories:**

```bash
# Create provider implementations
mkdir -p packages/core/providers/src/providers/{openai,anthropic,google,ollama,huggingface}

# OpenAI Provider
cat > packages/core/providers/src/providers/openai/OpenAIProvider.ts << 'EOF'
import { UniversalProvider, ChatRequest, ChatResponse, ModelInfo } from '../../interfaces/UniversalProvider';
import OpenAI from 'openai';

export class OpenAIProvider implements UniversalProvider {
  readonly id = 'openai';
  readonly name = 'OpenAI';
  readonly type = 'remote';
  readonly capabilities = {
    chat: true,
    completion: true,
    streaming: true,
    embeddings: true,
    vision: true,
    functionCalling: true,
    // ... other capabilities
  };
  
  private client?: OpenAI;
  
  async initialize(config: ProviderConfig): Promise<void> {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.endpoint
    });
  }
  
  async chat(request: ChatRequest): Promise<ChatResponse> {
    if (!this.client) throw new Error('Provider not initialized');
    
    const response = await this.client.chat.completions.create({
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: false
    });
    
    return {
      id: response.id,
      model: response.model,
      provider: this.id,
      content: response.choices[0].message.content || '',
      finishReason: response.choices[0].finish_reason as any,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0
      },
      executionTime: 0, // Implement timing
      timestamp: new Date()
    };
  }
  
  // Implement other required methods...
}
EOF
```

### Phase 5: Documentation and Examples (Weeks 9-10)

#### 5.1 Package Documentation Generation

**Create documentation generation script:**

```bash
#!/bin/bash
# scripts/generate-docs.sh

echo "📚 Generating package documentation..."

# Generate TypeDoc documentation for each package
for package in $(lerna list --json | jq -r '.[].location'); do
  package_name=$(basename "$package")
  echo "📖 Generating docs for $package_name..."
  
  cd "$package"
  
  # Generate TypeDoc
  if [ -f "typedoc.json" ]; then
    npx typedoc
  fi
  
  # Generate API documentation
  if [ -f "src/index.ts" ]; then
    npx api-extractor run --local
  fi
  
  cd - > /dev/null
done

# Generate unified documentation site
echo "🌐 Building documentation site..."
npm run docs:build

echo "✅ Documentation generation complete!"
```

#### 5.2 Migration Examples

**Create example migration projects:**

```typescript
// examples/migration/before-after.ts

// BEFORE: Old import structure
import { TaskService } from '@mosaicstack/mcp-orchestrator';
import { ClaudeProvider } from '@mosaicstack/providers/claude';
import { Config } from '@mosaicstack/config';

// AFTER: New import structure
import { TaskService } from '@mosaicstack/orchestration/mcp-orchestrator';
import { UniversalProviderRegistry } from '@mosaicstack/providers';
import { ConfigManager } from '@mosaicstack/config';

// Migration example
export class MigrationExample {
  static async migrateToNewArchitecture() {
    // Old way
    const oldConfig = new Config();
    const oldProvider = new ClaudeProvider(oldConfig);
    const oldTaskService = new TaskService();
    
    // New way
    const configManager = new ConfigManager();
    const registry = new UniversalProviderRegistry();
    const provider = await registry.createProvider({
      type: 'anthropic-claude',
      apiKey: 'your-key'
    });
    const taskService = new TaskService(provider);
    
    return { configManager, registry, provider, taskService };
  }
}
```

## Migration Scripts

### Complete Migration Script

```bash
#!/bin/bash
# scripts/complete-migration.sh

set -e

echo "🚀 Starting complete MosAIc SDK migration..."

# Phase 1: Setup mono-repo infrastructure
echo "📦 Phase 1: Setting up mono-repo infrastructure..."
npm install -g lerna
lerna init --independent
npm install --save-dev @nrwl/workspace

# Phase 2: Migrate package structure
echo "🏗️ Phase 2: Migrating package structure..."
./scripts/migrate-package-structure.sh

# Phase 3: Update dependencies
echo "🔄 Phase 3: Updating dependencies..."
./scripts/update-dependencies.sh

# Phase 4: Setup CI/CD
echo "⚙️ Phase 4: Setting up CI/CD..."
cp templates/workflows/* .github/workflows/

# Phase 5: Bootstrap packages
echo "🌱 Phase 5: Bootstrapping packages..."
lerna bootstrap

# Phase 6: Build all packages
echo "🏗️ Phase 6: Building all packages..."
lerna run build

# Phase 7: Run tests
echo "🧪 Phase 7: Running tests..."
lerna run test

# Phase 8: Run quality gates
echo "🛡️ Phase 8: Running quality gates..."
./scripts/quality-gates.sh

echo "✅ Migration complete! Your MosAIc SDK is now using the new package architecture."
echo ""
echo "Next steps:"
echo "1. Update your import statements to use the new package structure"
echo "2. Configure your preferred mono-repo tool (Lerna, NX, or Rush)"
echo "3. Setup your CI/CD pipeline with the new workflow files"
echo "4. Start using the Universal Provider Registry for AI model management"
```

### Rollback Strategy

```bash
#!/bin/bash
# scripts/rollback-migration.sh

echo "🔄 Rolling back migration..."

# Create backup if not exists
if [ ! -d ".migration-backup" ]; then
  echo "❌ No migration backup found. Cannot rollback."
  exit 1
fi

# Restore package structure
echo "📦 Restoring package structure..."
rm -rf packages/core packages/orchestration packages/integrations packages/platform packages/tools
cp -r .migration-backup/packages/* packages/

# Restore package.json files
echo "📝 Restoring package.json files..."
cp .migration-backup/package.json package.json
cp .migration-backup/lerna.json lerna.json 2>/dev/null || true

# Restore dependencies
echo "🔄 Restoring dependencies..."
npm install

echo "✅ Rollback complete!"
```

## Post-Migration Validation

### Validation Checklist

- [ ] All packages build successfully
- [ ] All tests pass
- [ ] CI/CD pipeline runs without errors
- [ ] Documentation generates correctly
- [ ] Provider registry discovers all providers
- [ ] Import statements work with new structure
- [ ] Backward compatibility maintained where needed
- [ ] Performance benchmarks meet standards

### Validation Script

```bash
#!/bin/bash
# scripts/validate-migration.sh

echo "🔍 Validating migration..."

# Check build
echo "🏗️ Validating builds..."
lerna run build || { echo "❌ Build failed"; exit 1; }

# Check tests
echo "🧪 Validating tests..."
lerna run test || { echo "❌ Tests failed"; exit 1; }

# Check provider registry
echo "🔌 Validating provider registry..."
node -e "
  const { UniversalProviderRegistry } = require('./packages/core/providers/dist');
  const registry = new UniversalProviderRegistry();
  console.log('Discovered providers:', registry.listProviders().length);
"

# Check imports
echo "📦 Validating imports..."
node -e "
  try {
    require('@mosaicstack/core');
    require('@mosaicstack/providers');
    require('@mosaicstack/stack');
    console.log('✅ All imports working');
  } catch (error) {
    console.error('❌ Import validation failed:', error.message);
    process.exit(1);
  }
"

echo "✅ Migration validation complete!"
```

## Risk Mitigation

### Identified Risks

1. **Breaking Changes**: Potential import path changes
   - **Mitigation**: Maintain backward compatibility aliases
   - **Timeline**: Remove after 2 major versions

2. **CI/CD Disruption**: New pipeline structure
   - **Mitigation**: Gradual pipeline migration with fallbacks
   - **Timeline**: Parallel pipelines for 1 month

3. **Developer Workflow**: New commands and structure
   - **Mitigation**: Comprehensive documentation and examples
   - **Timeline**: Training sessions and migration guides

4. **Performance Impact**: New abstraction layers
   - **Mitigation**: Performance benchmarks and optimization
   - **Timeline**: Continuous monitoring

### Contingency Plans

1. **Immediate Rollback**: Full backup of current state
2. **Gradual Migration**: Package-by-package migration option
3. **Parallel Systems**: Run old and new systems simultaneously
4. **Expert Support**: Dedicated migration support team

## Success Metrics

### Technical Metrics

- **Build Time**: <30% increase from current
- **Test Coverage**: Maintain >80% across all packages
- **Bundle Size**: Core packages <5MB each
- **Provider Discovery**: Support for 75+ providers
- **Dependency Resolution**: <10 second cold start

### Developer Experience Metrics

- **Migration Time**: <1 week for typical project
- **Documentation Coverage**: 100% API coverage
- **Error Reduction**: 50% fewer import-related errors
- **Development Speed**: 20% faster feature development

## Conclusion

This migration strategy provides a comprehensive approach to transitioning the MosAIc SDK to the new NPM package architecture while minimizing disruption and maximizing benefits. The phased approach allows for validation at each step and provides clear rollback options if needed.

The new architecture will provide:

1. **Better Scalability**: Independent package versioning and publishing
2. **Improved Developer Experience**: Clear package boundaries and APIs
3. **Enhanced Maintainability**: Modular architecture with defined responsibilities
4. **Future-Proof Foundation**: Extensible provider system supporting 75+ LLM providers
5. **Enterprise-Ready**: Professional tooling and quality gates

**Next Steps**: Begin Phase 1 implementation and monitor progress against defined success metrics.

---

**Migration Timeline**: 10 weeks total  
**Risk Level**: Medium (well-planned with rollback options)  
**Impact**: High (foundation for future development)  
**Resources Required**: 1 architect + 2 developers + 1 DevOps engineer