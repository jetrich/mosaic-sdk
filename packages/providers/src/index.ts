/**
 * @mosaicstack/providers - Provider Abstraction Layer
 * Extracted from mosaic-mcp for reusable provider system
 */

// Core interfaces
export * from './interfaces/Provider';
export * from './interfaces/TaskRouter';

// Provider implementations
export * from './providers/ollama/OllamaProvider';
export * from './providers/ollama/OllamaFactory';
export * from './providers/claude/ClaudeProvider';
export * from './providers/claude/ClaudeFactory';

// Routing and task management
export * from './routing/TaskRouterImpl';

// Registry
export * from './registry/ProviderRegistry';

// Convenience exports for common use cases
export {
  OllamaFactory,
  ClaudeFactory,
  OLLAMA_MODELS,
  CLAUDE_MODELS,
} from './providers';

export {
  TaskRouterImpl,
} from './routing/TaskRouterImpl';

export {
  ProviderRegistry,
  getGlobalProviderRegistry,
  resetGlobalProviderRegistry,
} from './registry/ProviderRegistry';

// Re-export provider classes for direct instantiation
export { OllamaProvider } from './providers/ollama/OllamaProvider';
export { ClaudeProvider } from './providers/claude/ClaudeProvider';