# @mosaic/mcp-common

Common utilities and base classes for MosAIc MCP (Model Context Protocol) service integrations.

## Installation

```bash
npm install @mosaic/mcp-common
```

## Overview

This package provides the foundational components for building MCP service integrations in the MosAIc ecosystem:

- **Base Classes**: Abstract service tool implementations
- **Authentication**: JWT and API key management
- **Utilities**: Circuit breaker, retry logic, and logging
- **Type Definitions**: Common TypeScript interfaces

## Usage

```typescript
import { MCPServiceTool, Logger, CircuitBreaker } from '@mosaic/mcp-common';

// Extend the base service tool
class MyServiceTool extends MCPServiceTool {
  // Implementation details
}
```

## Features

- 🔒 Built-in authentication management
- 🔄 Automatic retry with exponential backoff
- 🚦 Circuit breaker pattern for fault tolerance
- 📊 Structured logging with Winston
- 🏷️ Full TypeScript support

## Documentation

For detailed documentation, visit [MosAIc Documentation](https://mosaicstack.dev/docs).

## License

MIT © MosAIc Team