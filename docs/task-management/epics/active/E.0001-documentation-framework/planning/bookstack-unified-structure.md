# BookStack Unified Structure Strategy

## Overview

This document defines the unified Project = Shelf approach for BookStack integration, supporting both single and multi-instance deployments with explicit mono-repo handling.

## Core Principle: Project = Shelf

### Universal Rule

**Every project (including submodules) gets its own shelf in BookStack**

```
ProjectName === SubmoduleName === ShelfName
```

### Benefits

1. **No restructuring** when moving between single/multi BookStack instances
2. **Clear project boundaries** for permissions and navigation
3. **Consistent mental model** across all documentation
4. **Duplicate book names** are not a concern (context from shelf)

## Documentation Structure

### Standard Project Structure

```
docs/{{ProjectName}}/
├── task-management/        # UPP methodology (epic-centric)
│   └── [standard structure]
├── architecture/           # Domain: Architecture
│   ├── _bookstack.yaml    # Metadata for sync
│   └── [books/chapters]
├── api/                   # Domain: API Reference
│   ├── _bookstack.yaml
│   └── [books/chapters]
├── operations/            # Domain: Operations
│   ├── _bookstack.yaml
│   └── [books/chapters]
└── _project.yaml          # Project metadata
```

### Mono-repo Structure (e.g., mosaic-sdk)

```
mosaic-sdk/                    # Mono-repo container
├── docs/
│   ├── mosaic-sdk/           # Integration documentation
│   │   ├── architecture/     # Integration architecture
│   │   ├── getting-started/  # Full stack guide
│   │   ├── deployment/       # Stack deployment
│   │   └── task-management/  # Integration epics
│   │
│   ├── mosaic/               # Core platform docs
│   │   ├── architecture/
│   │   ├── api/
│   │   └── task-management/
│   │
│   ├── mosaic-mcp/          # MCP server docs
│   │   ├── architecture/
│   │   ├── api/
│   │   └── task-management/
│   │
│   ├── mosaic-tony/         # Tony framework docs
│   │   ├── architecture/
│   │   ├── api/
│   │   └── task-management/
│   │
│   └── mosaic-webui/        # Web UI docs
│       ├── architecture/
│       ├── api/
│       └── task-management/
```

## BookStack Mapping

### Single Instance (Multiple Projects)

```
BookStack (docs.mosaicstack.dev)
├── Shelf: mosaic-sdk
│   ├── Book: Getting Started
│   ├── Book: Integration Architecture
│   └── Book: Deployment Guide
├── Shelf: mosaic
│   ├── Book: Core Architecture
│   ├── Book: Platform APIs
│   └── Book: Configuration
├── Shelf: mosaic-mcp
│   ├── Book: MCP Protocol
│   ├── Book: Server Architecture
│   └── Book: Tool Development
├── Shelf: dyor-stack
│   ├── Book: Trading Architecture
│   ├── Book: Market Data API
│   └── Book: Strategy Development
└── Shelf: afterlife
    ├── Book: Smart Contracts
    ├── Book: Blockchain Architecture
    └── Book: Web3 API
```

### Multiple Instances (One per Project)

```
BookStack (mosaic-docs.example.com)
└── Shelf: mosaic-sdk
    ├── Book: Getting Started
    ├── Book: Integration Architecture
    └── Book: Deployment Guide

BookStack (dyor-docs.example.com)
└── Shelf: dyor-stack
    ├── Book: Trading Architecture
    ├── Book: Market Data API
    └── Book: Strategy Development
```

## Mono-repo Rules

### Rule 1: Submodule = Independent Project

Each submodule in a mono-repo is treated as an independent project with its own shelf.

### Rule 2: Parent Gets Own Documentation

The mono-repo container (e.g., mosaic-sdk) has its own documentation for:

- Integration between components
- Full stack deployment
- Getting started with the ecosystem
- Cross-component architecture

### Rule 3: Clear Separation

- **Component docs**: In `docs/{submodule}/`
- **Integration docs**: In `docs/{mono-repo-name}/`
- **Never mix**: Component-specific and integration docs

### Rule 4: Task Management Independence

Each project/submodule maintains its own task-management structure:

- Integration epics in `docs/mosaic-sdk/task-management/`
- Component epics in `docs/{submodule}/task-management/`

## Configuration

### Project Configuration (\_project.yaml)

```yaml
# docs/mosaic-sdk/_project.yaml
project:
  name: MosAIc SDK
  type: mono-repo
  shelf_name: mosaic-sdk
  description: Integration and orchestration of MosAIc components

submodules:
  - mosaic
  - mosaic-mcp
  - mosaic-tony
  - mosaic-webui

domains:
  - name: getting-started
    books:
      - quick-start
      - installation
      - tutorials
  - name: architecture
    books:
      - integration-patterns
      - system-overview
  - name: deployment
    books:
      - docker-compose
      - kubernetes
      - production

# docs/mosaic/_project.yaml
project:
  name: MosAIc Core
  type: submodule
  parent: mosaic-sdk
  shelf_name: mosaic
  description: Core MosAIc platform

domains:
  - name: architecture
    books:
      - core-design
      - plugin-system
  - name: api
    books:
      - rest-api
      - graphql-api
```

### BookStack Sync Configuration

```yaml
bookstack:
  instances:
    - name: primary
      url: https://docs.mosaicstack.dev
      api_key: ${BOOKSTACK_API_KEY}
      projects:
        - mosaic-sdk
        - mosaic
        - mosaic-mcp
        - mosaic-tony
        - mosaic-webui

    # Optional: Project-specific instances
    - name: dyor
      url: https://dyor-docs.example.com
      api_key: ${DYOR_BOOKSTACK_KEY}
      projects:
        - dyor-stack
```

## Migration Strategy

### From Old Structure to Unified Structure

1. **Identify Current Structure**
   - Domain-based shelves → Convert to project-based
   - Nested documentation → Flatten to docs/{project}/

2. **Create Project Directories**

   ```bash
   mkdir -p docs/{project-name}/{architecture,api,operations,task-management}
   ```

3. **Move Content**
   - Preserve git history with `git mv`
   - Update internal references
   - Maintain BookStack IDs where possible

4. **Update Metadata**
   - Create \_project.yaml files
   - Add \_bookstack.yaml to domains
   - Configure sync settings

## Benefits Summary

### For Developers

- **One structure** works everywhere
- **Clear rules** for mono-repos
- **No mode confusion**

### For Operations

- **Flexible deployment** - choose instance strategy later
- **Easy migration** between instances
- **Natural permissions** at project level

### For Framework

- **Simple validation** - check project structure
- **Consistent generation** - one template system
- **Clear boundaries** - project = shelf always

## Common Pitfalls to Avoid

### ❌ DON'T: Mix Integration and Component Docs

```
docs/mosaic/how-to-integrate-mcp.md  # WRONG - belongs in mosaic-sdk/
```

### ❌ DON'T: Nest Docs Under Source

```
mosaic-sdk/mosaic/docs/  # WRONG - docs scattered
```

### ❌ DON'T: Create Domain-Based Shelves

```
Shelf: Architecture  # WRONG - use project names
```

### ✅ DO: Keep Project = Shelf

```
Shelf: mosaic-sdk    # CORRECT - project name
Shelf: mosaic        # CORRECT - submodule name
```

This unified approach eliminates complexity while providing maximum flexibility for BookStack deployments.
