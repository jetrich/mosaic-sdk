# @mosaicstack/mcp-ollama

Ollama integration for MosAIc MCP - Local LLM code generation and execution.

## Overview

This package provides a comprehensive MCP (Model Context Protocol) server that integrates with Ollama for local code generation, reducing reliance on cloud APIs and enabling offline development capabilities.

## Features

- ✅ **Local LLM Integration**: Connect to local or remote Ollama instances
- ✅ **Dynamic Model Switching**: Switch between models without restarting
- ✅ **Model Management**: Pull, delete, and manage models via MCP tools
- ✅ **Performance Tracking**: Monitor model usage and performance metrics
- ✅ **Fallback Support**: Automatic fallback to secondary endpoints
- ✅ **Structured Outputs**: Support for JSON schema-based outputs
- ✅ **Streaming Generation**: Stream responses for long-running generations
- 🚧 **Code Generation**: Specialized tools for code generation (coming soon)
- 🚧 **Code Execution**: Sandboxed execution environment (coming soon)
- 🚧 **Response Caching**: Cache frequently used responses (coming soon)

## Installation

```bash
npm install @mosaicstack/mcp-ollama
```

## Quick Start

```typescript
import { initializeOllamaMCP } from '@mosaicstack/mcp-ollama';

// Initialize with default configuration
const ollama = await initializeOllamaMCP();

// Generate text
const result = await ollama.tools.generate.call({
  prompt: "Explain quantum computing in simple terms",
  model: "llama3.2"
});

console.log(result.data.response);
```

## Configuration

The package can be configured via the config object:

```typescript
const config = {
  endpoints: {
    primary: "http://localhost:11434",
    fallback: "http://remote-ollama:11434"
  },
  models: {
    default: "llama3.2",
    code: "codellama:latest",
    specialized: {
      python: "codellama:python",
      typescript: "codellama:code"
    }
  },
  options: {
    temperature: 0.7,
    num_ctx: 4096
  }
};

const ollama = await initializeOllamaMCP(config);
```

## Available Tools

### ollama_generate

Generate text completions with support for structured outputs.

```typescript
const result = await ollama.tools.generate.call({
  prompt: "Write a haiku about programming",
  model: "llama3.2",
  options: {
    temperature: 0.8
  }
});
```

### ollama_model (Coming Soon)

Manage Ollama models - list, switch, pull, and delete.

### ollama_code (Coming Soon)

Generate code with language-specific models and automatic formatting.

### ollama_execute (Coming Soon)

Execute generated code in a sandboxed environment.

## Architecture

### Core Components

1. **OllamaClient**: Low-level client for Ollama API communication
   - Connection management with fallback support
   - Streaming and non-streaming generation
   - Model operations (pull, delete, list)

2. **ModelManager**: Intelligent model management
   - Dynamic model switching
   - Performance tracking
   - Model aliasing
   - Automatic preloading

3. **OllamaTool**: Base class extending MCPServiceTool
   - Inherits retry logic and circuit breaking
   - Standardized error handling
   - Health monitoring

4. **OllamaGenerateTool**: Text generation tool
   - Structured output support
   - Streaming capabilities
   - Context continuation

## Performance Considerations

- Models are cached in memory after first load
- Response caching reduces redundant generations
- Connection pooling for remote instances
- Automatic retry with exponential backoff

## Development Status

### Completed
- ✅ Package structure and configuration
- ✅ OllamaClient with full API support
- ✅ ModelManager for dynamic switching
- ✅ Base OllamaTool implementation
- ✅ OllamaGenerateTool for text generation

### In Progress
- 🚧 OllamaCodeTool for code generation
- 🚧 OllamaModelTool for model management
- 🚧 CodeExecutionService with sandboxing
- 🚧 Integration with MCP Orchestrator
- 🚧 Comprehensive test suite

## Contributing

See the main MosAIc SDK contributing guidelines.

## License

MIT