# Component Ownership Matrix - MosAIc Ecosystem

## Overview

This document defines which components and features belong to which repository in the MosAIc ecosystem.

## Repository Responsibilities

### mosaic-sdk (Parent Repository)

**Purpose**: Orchestration and integration of all MosAIc components
**Owns**:

- Overall project structure and integration
- Cross-component documentation
- Integration testing between components
- Deployment configurations
- Meta-level task management (epics that span multiple components)

### mosaic (Core Platform)

**Purpose**: Enterprise platform extending Tony for multi-project coordination
**Owns**:

- Core MosAIc platform functionality
- Project coordination features
- Enterprise features (SSO, audit trails, etc.)
- Platform-level APIs

### mosaic-mcp (Model Context Protocol Server)

**Purpose**: MCP server for agent communication
**Owns**:

- MCP protocol implementation
- Agent communication tools
- Task management MCP tools
- Real-time coordination features

### mosaic-tony (Tony Framework)

**Purpose**: AI agent orchestration framework
**Owns**:

- Tony core methodology
- Agent personas
- UPP (Ultrathink Planning Protocol) implementation
- Agent handoff protocols

### mosaic-docs (Documentation Repository)

**Purpose**: Centralized documentation using BookStack structure
**Owns**:

- All user-facing documentation
- API documentation
- Architecture documentation
- BookStack integration
  **BookStack Instance**:
- URL: https://docs.mosaicstack.dev
- Sync User: syncagent@mosaicstack.dev
- Structure: Must align with new 4-level hierarchy

### mosaic-site (Public Website)

**Purpose**: Public-facing informational website for MosAIc
**Owns**:

- Marketing content
- Documentation portal
- Community resources
- Public API documentation
- Download links
- Getting started guides

### mosaic-webui (Internal Web Interface) - TO BE CREATED

**Purpose**: Internal web UI for MosAIc configuration and monitoring
**Owns**:

- Configuration Web UI (E.3001)
- Project dashboards
- Agent monitoring interfaces
- Visual configuration editors
- Real-time system monitoring
- Administrative controls

## Epic Assignment by Component

### Documentation Framework (E.0001)

- **Primary**: mosaic-sdk (orchestration)
- **Secondary**: mosaic-docs (BookStack structure implementation)
- **Supporting**: All components (adopt structure)

### Planning & Decomposition (E.0002)

- **Primary**: mosaic-tony (UPP methodology)
- **Secondary**: mosaic (project coordination)
- **Supporting**: mosaic-mcp (MCP tools)

### Agent Coordination (E.0003)

- **Primary**: mosaic-tony (agent framework)
- **Secondary**: mosaic-mcp (communication layer)
- **Supporting**: mosaic (enterprise features)

### Configuration Web UI (E.3001)

- **Primary**: mosaic-webui (UI implementation) - NEW COMPONENT
- **Secondary**: mosaic (backend APIs)
- **Supporting**: mosaic-mcp (real-time updates)
- **Note**: This requires creating a new mosaic-webui component

## Implementation Guidelines

1. **Task Management Location**:
   - Component-specific tasks: In respective component's `docs/task-management/`
   - Cross-component tasks: In mosaic-sdk's `docs/task-management/`
   - Integration tasks: Always in mosaic-sdk

2. **Documentation Location**:
   - Component APIs: In component's `docs/api/`
   - User guides: In mosaic-docs following BookStack structure
   - Integration guides: In mosaic-sdk's `docs/`

3. **Configuration**:
   - Component configs: In component's root or config/
   - Integration configs: In mosaic-sdk's root
   - User configs: In ~/.config/mosaic/

4. **Testing**:
   - Unit tests: In respective components
   - Integration tests: In mosaic-sdk/tests/integration/
   - E2E tests: In mosaic-sdk/tests/e2e/

## Decision Tree for Feature Placement

```
Is the feature about:
├── Agent orchestration? → mosaic-tony
├── MCP communication? → mosaic-mcp
├── Enterprise coordination? → mosaic
├── Web UI? → mosaic-site
├── Documentation? → mosaic-docs
└── Integration of above? → mosaic-sdk
```

## Version Management

- Each component maintains independent versioning
- mosaic-sdk version reflects integration compatibility
- Breaking changes require coordinated releases
- Use git submodule commits to lock compatible versions
