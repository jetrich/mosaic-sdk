# @mosaicstack/config

Configuration management for MosAIc Stack multi-mode architecture with SIBKISS methodology (3-step configuration).

## Features

- **Multi-Mode Support**: Local, Hybrid, and Cloud operation modes
- **Type-Safe Configuration**: Full TypeScript interfaces and validation
- **Environment Variables**: Secure credential handling with env resolution
- **Schema Validation**: JSON Schema validation with helpful error messages
- **Smart Defaults**: Mode-specific intelligent defaults
- **Multiple Formats**: JSON and YAML configuration files
- **SIBKISS Methodology**: See It Big, Keep It Simple & Straightforward

## Quick Start

### Installation

```bash
npm install @mosaicstack/config
```

### Basic Usage

```typescript
import { loadConfig, getConfigTemplate } from '@mosaicstack/config';

// Load configuration with defaults
const config = await loadConfig();

// Load specific mode
const localConfig = await loadConfig({ mode: 'local' });

// Load from specific file
const config = await loadConfig({
  configPath: './mosaic.config.yaml',
  mode: 'hybrid'
});
```

### Generate Configuration Template

```typescript
import { getConfigTemplate, saveConfig } from '@mosaicstack/config';

// Generate template for hybrid mode (default)
const template = getConfigTemplate('hybrid');

// Save as YAML
await saveConfig(template, './mosaic.config.yaml');

// Save as JSON
await saveConfig(template, './mosaic.config.json');
```

## Configuration Modes

### Local Mode - Complete Privacy

Zero external API calls, Ollama-only operation:

```typescript
const config = await loadConfig({ mode: 'local' });
```

**Features**:
- Ollama provider only
- No external API calls
- Complete data privacy
- Local model execution

### Hybrid Mode - Intelligent Routing (Default)

Smart balance between local and cloud:

```typescript
const config = await loadConfig({ mode: 'hybrid' });
```

**Features**:
- Ollama + Claude integration
- Cost optimization
- Local preference with cloud fallback
- Intelligent task routing

### Cloud Mode - Maximum Capability

Cloud-first with maximum performance:

```typescript
const config = await loadConfig({ mode: 'cloud' });
```

**Features**:
- Claude API priority
- OpenRouter integration
- Maximum concurrent agents
- Enterprise monitoring

## Environment Variables

The configuration system supports secure environment variable resolution:

```yaml
providers:
  claude:
    apiKey: "env:ANTHROPIC_API_KEY"
    # With default: "env:ANTHROPIC_API_KEY|default_value"
  
  openrouter:
    apiKey: "env:OPENROUTER_API_KEY"
    
  ollama:
    url: "env:OLLAMA_URL|http://localhost:11434"
```

### Generate .env Template

```typescript
import { EnvResolverImpl } from '@mosaicstack/config';

const resolver = new EnvResolverImpl();
const envTemplate = resolver.generateEnvTemplate(config);

console.log(envTemplate);
// Outputs:
// # MosAIc Stack Environment Variables
// # Provider Configuration
// ANTHROPIC_API_KEY=your_anthropic_api_key_here
// OPENROUTER_API_KEY=your_openrouter_api_key_here
```

## Configuration Schema

### Complete Configuration Example

```yaml
$schema: "https://mosaicstack.dev/schemas/config.json"
version: "1.0.0"
mode: "hybrid"

mcp:
  port: 3456
  autoStart: true
  features:
    tony: true
    orchestration: true
    streaming: true
    metrics: true
    health: true

providers:
  ollama:
    enabled: true
    location: "local"
    url: "http://localhost:11434"
    models: ["auto-detect"]
    priority: 1
    timeout: 30000
    retries: 3

  claude:
    enabled: true
    access: "subscription"
    fallbackToApi: true
    apiKey: "env:ANTHROPIC_API_KEY"
    priority: 2
    maxConcurrency: 5

routing:
  strategy: "intelligent"
  preferLocal: true
  costOptimization: true
  fallbackChain: ["ollama", "claude"]
  rules:
    - taskType: "code"
      preferredProvider: "ollama"
      preferredModel: "codellama"

tony:
  enabled: true
  personas: true
  upp: true
  multiAgent: true
  maxConcurrentAgents: 5

monitoring:
  metrics: true
  logging: "info"
  telemetry: false
```

## Configuration File Locations

The loader automatically searches for configuration files in this order:

1. `mosaic.config.json`
2. `mosaic.config.yaml`
3. `mosaic.config.yml`
4. `.mosaicrc.json`
5. `.mosaicrc.yaml`
6. `.mosaic/mosaic.config.json`
7. `.mosaic/mosaic.config.yaml`

## Validation

### Schema Validation

```typescript
import { validateConfig } from '@mosaicstack/config';

const validation = await validateConfig(config);

if (!validation.valid) {
  console.error('Configuration errors:');
  validation.errors.forEach(error => {
    console.error(`  ${error.path}: ${error.message}`);
  });
}

if (validation.warnings.length > 0) {
  console.warn('Configuration warnings:');
  validation.warnings.forEach(warning => {
    console.warn(`  ${warning.path}: ${warning.message}`);
    if (warning.suggestion) {
      console.warn(`    Suggestion: ${warning.suggestion}`);
    }
  });
}
```

### Environment Variable Validation

```typescript
import { EnvResolverImpl } from '@mosaicstack/config';

const resolver = new EnvResolverImpl();
const { missing, available } = resolver.validateEnvVars(config);

if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
}
```

## Advanced Usage

### Custom Configuration Loading

```typescript
import { ConfigLoader } from '@mosaicstack/config';

const loader = new ConfigLoader();

// Load with custom options
const config = await loader.load({
  configPath: './custom-config.yaml',
  envFile: './custom.env',
  mode: 'cloud',
  validateSchema: true,
  resolveEnv: true,
  applyDefaults: true
});
```

### Interactive Configuration

```typescript
const loader = new ConfigLoader();

// Create configuration from answers
const config = loader.initializeConfig({
  mode: 'hybrid',
  ollamaUrl: 'http://192.168.1.100:11434',
  claudeAccess: 'subscription',
  mcpPort: 3456
});

await loader.save(config, './mosaic.config.yaml');
```

### Configuration Merging

```typescript
import { mergeWithDefaults, getModeDefaults } from '@mosaicstack/config';

// Get mode defaults
const defaults = getModeDefaults('hybrid');

// Merge with user config
const userConfig = { 
  mode: 'hybrid',
  mcp: { port: 3500 } 
};

const finalConfig = mergeWithDefaults(userConfig, 'hybrid');
```

## TypeScript Types

Full TypeScript support with comprehensive interfaces:

```typescript
import { 
  MosaicConfig,
  OperationMode,
  ProviderConfig,
  RoutingConfig,
  TonyConfig,
  ValidationResult
} from '@mosaicstack/config';

function processConfig(config: MosaicConfig) {
  // Type-safe configuration access
  if (config.providers.claude?.enabled) {
    console.log(`Claude access: ${config.providers.claude.access}`);
  }
}
```

## SIBKISS Methodology

The configuration system follows SIBKISS (See It Big, Keep It Simple & Straightforward):

### 3-Step Configuration

1. **Choose Mode**: `local`, `hybrid`, or `cloud`
2. **Set Providers**: Ollama URL, Claude access, API keys
3. **Launch**: Everything else uses intelligent defaults

### Smart Defaults

Each mode comes with production-ready defaults:
- **Local**: Privacy-first, Ollama-only
- **Hybrid**: Balanced, cost-optimized
- **Cloud**: Performance-first, full capability

### Progressive Enhancement

Start simple and enhance as needed:
- Begin with mode selection
- Add provider configurations gradually
- Advanced settings available when needed

## Integration with MosAIc Stack

This configuration package is designed for seamless integration with:

- `@mosaicstack/stack` - Meta-package orchestrator
- `@mosaicstack/providers` - Provider abstraction layer
- `@mosaicstack/mcp` - MCP server
- `@mosaicstack/tony` - Tony Framework

```typescript
import { loadConfig } from '@mosaicstack/config';
import { ProviderRegistry } from '@mosaicstack/providers';

const config = await loadConfig();
const registry = new ProviderRegistry();

// Initialize providers from config
if (config.providers.ollama?.enabled) {
  await registry.createProvider(config.providers.ollama);
}
```

## License

MIT - See LICENSE file for details.