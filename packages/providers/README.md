# @mosaicstack/providers

Provider abstraction layer for AI models, extracted from mosaic-mcp for reusable multi-mode architecture.

## Features

- **Multi-Provider Support**: Unified interface for Ollama, Claude, and future providers
- **Intelligent Routing**: Smart task routing based on complexity, type, and preferences
- **Provider Registry**: Dynamic provider management and discovery
- **Performance Tracking**: Built-in performance metrics and fallback strategies
- **Type Safety**: Full TypeScript support with comprehensive interfaces

## Architecture

```
packages/providers/
├── src/
│   ├── interfaces/           # Core abstractions
│   │   ├── Provider.ts       # Base provider interface
│   │   └── TaskRouter.ts     # Routing interfaces
│   ├── providers/            # Provider implementations
│   │   ├── ollama/          # Ollama provider (local)
│   │   └── claude/          # Claude provider (remote)
│   ├── routing/             # Intelligent routing
│   │   └── TaskRouterImpl.ts
│   └── registry/            # Provider management
│       └── ProviderRegistry.ts
```

## Quick Start

### Basic Usage

```typescript
import {
  ProviderRegistry,
  OllamaFactory,
  ClaudeFactory,
  TaskRouterImpl,
} from '@mosaicstack/providers';

// Initialize registry
const registry = new ProviderRegistry();

// Register provider factories
registry.register(new OllamaFactory());
registry.register(new ClaudeFactory());

// Create providers
const ollamaProvider = await registry.createProvider({
  name: 'ollama',
  type: 'local',
  enabled: true,
  priority: 1,
  host: 'http://localhost:11434',
});

const claudeProvider = await registry.createProvider({
  name: 'claude',
  type: 'remote',
  enabled: true,
  priority: 2,
  apiKey: 'your-api-key',
});

// Create router and register providers
const router = new TaskRouterImpl();
router.registerProvider(ollamaProvider);
router.registerProvider(claudeProvider);

// Execute tasks with intelligent routing
const task = {
  type: 'code',
  content: 'Write a TypeScript function to validate email addresses',
  complexity: 3,
  preferences: {
    prefer_local: true,
    fallback_enabled: true,
  },
};

const response = await router.executeTask(task);
console.log(response.content);
```

### Manual Provider Usage

```typescript
import { OllamaProvider } from '@mosaicstack/providers';

const provider = new OllamaProvider();
await provider.initialize({
  name: 'ollama',
  type: 'local',
  enabled: true,
  priority: 1,
  host: 'http://localhost:11434',
});

const response = await provider.chat(
  'llama3.1',
  [{ role: 'user', content: 'Hello, world!' }]
);
```

## Provider Types

### Ollama Provider (Local)
- **Type**: `local`
- **Models**: llama3.1, codellama, mistral, gemma2, etc.
- **Features**: Local execution, fast response, offline capability
- **Configuration**: Host URL, timeout, retry settings

### Claude Provider (Remote)
- **Type**: `remote`
- **Models**: claude-3-opus, claude-3-sonnet, claude-3-haiku
- **Features**: High-quality reasoning, creative tasks, large context
- **Configuration**: API key, model selection, token limits

## Task Routing

The `TaskRouterImpl` provides intelligent routing based on:

- **Task Type**: code, analysis, documentation, general
- **Complexity**: 1-5 scale for model selection
- **Preferences**: Local vs remote, speed vs quality
- **Provider Health**: Automatic failover and fallback
- **Performance Metrics**: Historical success rates and response times

### Routing Example

```typescript
const task = {
  type: 'code',           // Code generation task
  complexity: 4,          // High complexity
  content: 'Complex algorithm implementation',
  preferences: {
    prefer_local: false,  // Allow remote providers
    max_response_time: 30, // 30 second timeout
    fallback_enabled: true, // Enable fallback
  },
};

// Router will select best provider/model and handle fallbacks
const routing = await router.routeTask(task);
console.log(routing.reasoning); // "CodeLlama specialized for code tasks, High-capability model for complex task"
```

## Provider Interface

All providers implement the base `Provider` interface:

```typescript
interface Provider {
  readonly name: string;
  readonly type: 'local' | 'remote';
  
  initialize(config: ProviderConfig): Promise<void>;
  getStatus(): Promise<ProviderStatus>;
  listModels(): Promise<ModelInfo[]>;
  isModelAvailable(modelName: string): Promise<boolean>;
  chat(model: string, messages: ChatMessage[], context?: TaskContext): Promise<TaskResponse>;
  getCapabilities(): string[];
  testConnection(): Promise<boolean>;
  dispose(): Promise<void>;
}
```

## Development

### Building

```bash
npm run build        # Build TypeScript
npm run build:watch  # Watch mode
npm run clean        # Clean dist/
```

### Testing

```bash
npm test            # Run tests
npm run test:watch  # Watch mode
```

### Linting

```bash
npm run lint        # Check code style
npm run lint:fix    # Fix issues
```

## Extracted from mosaic-mcp

This package was extracted and refactored from the original mosaic-mcp codebase to provide a reusable provider abstraction layer for the @mosaicstack/stack multi-mode architecture.

### Original Files
- `mosaic-mcp/src/services/router.ts` → `routing/TaskRouterImpl.ts`
- `mosaic-mcp/src/services/ollama.ts` → `providers/ollama/OllamaProvider.ts`
- `mosaic-mcp/src/services/OllamaService.ts` → Combined into `OllamaProvider.ts`

### Enhancements
- Full TypeScript interfaces and type safety
- Provider registry for dynamic management
- Enhanced error handling and retry logic
- Performance tracking and metrics
- Pluggable architecture for new providers
- Improved routing intelligence

## License

MIT - See LICENSE file for details.