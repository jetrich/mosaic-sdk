# @mosaicstack/stack

**Complete MosAIc Stack orchestrator providing unified access to all MosAIc Stack components with multi-mode architecture.**

## Overview

The `@mosaicstack/stack` meta-package serves as the central orchestrator for the entire MosAIc Stack platform, providing:

- **Multi-mode Architecture**: Local, Hybrid, and Cloud operation modes
- **Unified Configuration**: Single configuration system across all components
- **Provider Orchestration**: Intelligent routing between local and cloud AI providers
- **Health Monitoring**: Comprehensive health checks and status reporting
- **CLI Integration**: Command-line interface for all operations

## Installation

```bash
npm install @mosaicstack/stack
```

## Quick Start

### Basic Usage

```typescript
import { createStack } from '@mosaicstack/stack';

// Create a hybrid-mode stack (local + cloud providers)
const stack = await createStack({
  mode: 'hybrid',
  port: 3456,
  autoStart: true,
});

console.log(`Stack running in ${stack.getMode()} mode`);

// Get comprehensive status
const status = await stack.status();
console.log(`Health: ${status.health.overall}`);
console.log(`Components: ${status.components.length} active`);
console.log(`Providers: ${status.providers.length} available`);
```

## Operation Modes

### Local Mode
- **Privacy-first**: All processing happens locally
- **Requirements**: Ollama installed and running
- **Features**: Complete data privacy, offline operation

### Hybrid Mode (Recommended)
- **Intelligent routing**: Local-first with cloud fallback
- **Requirements**: Ollama + internet connection
- **Features**: Best of both worlds, automatic fallback

### Cloud Mode
- **Performance-first**: Latest cloud models
- **Requirements**: Internet + API keys configured
- **Features**: Maximum performance, latest models

## Architecture

The stack integrates all MosAIc components:

```
@mosaicstack/stack (meta-package)
├── @mosaicstack/config    # Configuration management
├── @mosaicstack/providers # Provider abstraction
├── @mosaicstack/cli       # Command-line interface
├── @mosaicstack/tony      # Tony Framework
└── @mosaicstack/mcp       # Model Context Protocol
```

For complete documentation, see the examples directory and individual package READMEs.