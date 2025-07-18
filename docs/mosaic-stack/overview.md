# MosAIc Stack Overview

## Introduction

The MosAIc Stack represents the evolution of AI-powered software development, combining the power of Tony Framework with enterprise-grade orchestration capabilities. Starting with version 2.8.0, the stack mandates MCP (Model Context Protocol) as the foundational infrastructure for all deployments.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MosAIc Stack                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ @tony/core  │  │@mosaic/core │  │ @mosaic/mcp │       │
│  │   v2.8.0    │  │   v0.1.0    │  │   v0.1.0    │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│         │                 │                 │               │
│         └─────────────────┴─────────────────┘               │
│                           │                                 │
│                  @mosaic/tony-adapter                       │
│                    (Integration Layer)                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### Tony Framework (@tony/core)
- **Version**: 2.8.0+
- **Role**: Core AI development framework
- **Focus**: Single-project orchestration, UPP methodology
- **MCP**: Required (no standalone mode)

### MosAIc Core (@mosaic/core)
- **Version**: 0.1.0+
- **Role**: Enterprise orchestration platform
- **Focus**: Multi-project coordination, team collaboration
- **Features**: Web UI, dashboard, analytics

### MosAIc MCP (@mosaic/mcp)
- **Version**: 0.1.0+
- **Role**: Infrastructure backbone
- **Focus**: Agent coordination, state management
- **Features**: Real-time communication, persistence

### MosAIc Dev (@mosaic/dev)
- **Version**: 0.1.0+
- **Role**: Development tools and SDK
- **Focus**: Testing, migration, tooling
- **Features**: Unified build system, test orchestration

## Key Principles

### 1. MCP-First Architecture
Starting with Tony 2.8.0, MCP is no longer optional. All components communicate through the MCP infrastructure, ensuring:
- Consistent state management
- Reliable agent coordination
- Enterprise-grade scalability
- Unified communication protocols

### 2. Progressive Enhancement
The stack is designed for progressive adoption:
- Start with Tony Framework for individual productivity
- Add MosAIc Core for team coordination
- Scale to enterprise with full platform features
- Maintain backward compatibility within major versions

### 3. Component Independence
While integrated, each component maintains its identity:
- Tony Framework: AI development assistant
- MosAIc Platform: Enterprise orchestration
- MosAIc MCP: Infrastructure layer
- Clear boundaries and responsibilities

## Version Strategy

### Synchronized Releases
- Tony Framework leads with major versions (2.8.0)
- MosAIc components follow milestone progression (0.1.0 → 1.0.0)
- Compatibility matrix ensures smooth integration
- Coordinated releases for stack updates

### Milestone Progression
```
Tony Framework: 2.7.0 (standalone) → 2.8.0 (MCP required)
MosAIc MCP:     0.0.1-beta → 0.1.0 → 0.2.0 → ... → 1.0.0
MosAIc Core:    0.0.1 → 0.1.0 → 0.2.0 → ... → 1.0.0
```

## Use Cases

### Individual Developer
- Use Tony Framework with local MCP
- Single-project focus
- CLI-driven workflow
- Minimal infrastructure

### Small Team
- Add MosAIc Core for coordination
- Multi-project visibility
- Shared agent resources
- Basic web dashboard

### Enterprise
- Full MosAIc Stack deployment
- Kubernetes orchestration
- Advanced analytics
- Compliance and security

## Getting Started

### Quick Installation
```bash
# Install the MosAIc Stack
npm install -g @mosaic/cli
mosaic init

# This installs:
# - @tony/core (2.8.0)
# - @mosaic/mcp (0.1.0)
# - @mosaic/core (0.1.0)
# - @mosaic/dev (0.1.0)
```

### Migration from Standalone Tony
```bash
# For existing Tony 2.7.0 users
npx @mosaic/migrate from-standalone

# This will:
# 1. Add MCP configuration
# 2. Update Tony to 2.8.0
# 3. Migrate existing projects
# 4. Validate the setup
```

## Benefits

### For Developers
- Seamless AI assistance
- Improved coordination
- Better state management
- Enhanced debugging

### For Teams
- Real-time collaboration
- Resource optimization
- Unified workflows
- Progress visibility

### For Organizations
- Enterprise scalability
- Compliance ready
- Cost optimization
- Strategic insights

## Next Steps

- [Architecture Deep Dive](architecture.md)
- [Component Milestones](component-milestones.md)
- [Migration Guide](../migration/tony-sdk-to-mosaic-sdk.md)
- [Getting Started Tutorial](getting-started.md)