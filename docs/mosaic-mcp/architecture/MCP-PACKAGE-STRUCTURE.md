# MCP Package Structure

**Version**: 0.0.2  
**Status**: Package Architecture Design  
**Date**: August 3, 2025  

## Overview

The MosAIc MCP ecosystem is distributed as a set of npm packages under the `@mosaicstack` scope, designed for easy installation, updates, and extensibility. This document defines the package structure, versioning strategy, and dependency management.

## Package Hierarchy

```
@mosaicstack/mcp (meta-package) v0.0.2
├── @mosaicstack/mcp-core v0.0.2         # Core utilities and base classes
├── @mosaicstack/mcp-gateway v0.0.2      # Multi-transport gateway
├── @mosaicstack/mcp-upp v0.0.2          # UPP task decomposition
├── @mosaicstack/mcp-patterns v0.0.2     # Pattern library system
├── @mosaicstack/mcp-commands v0.0.2     # Command routing & NLP
├── @mosaicstack/mcp-plane v0.0.1        # Plane.so integration
├── @mosaicstack/mcp-context v0.0.1      # Context memory system
├── @mosaicstack/mcp-optimizer v0.0.1    # Token optimization
├── @mosaicstack/mcp-dashboard v0.0.1    # Web UI dashboard
└── @mosaicstack/mcp-cli v0.0.2          # CLI tools
```

## Package Specifications

### 1. Meta Package (@mosaicstack/mcp)

The root package that installs all MCP components.

**package.json**:
```json
{
  "name": "@mosaicstack/mcp",
  "version": "0.0.2",
  "description": "MosAIc Model Context Protocol - Complete Stack",
  "keywords": ["mcp", "ai", "mosaic", "orchestration"],
  "homepage": "https://github.com/mosaicstack/mcp",
  "license": "MIT",
  "main": "index.js",
  "bin": {
    "mosaic-mcp": "./bin/mosaic-mcp.js"
  },
  "dependencies": {
    "@mosaicstack/mcp-core": "^0.0.2",
    "@mosaicstack/mcp-gateway": "^0.0.2",
    "@mosaicstack/mcp-upp": "^0.0.2",
    "@mosaicstack/mcp-patterns": "^0.0.2",
    "@mosaicstack/mcp-commands": "^0.0.2",
    "@mosaicstack/mcp-cli": "^0.0.2"
  },
  "optionalDependencies": {
    "@mosaicstack/mcp-plane": "^0.0.1",
    "@mosaicstack/mcp-context": "^0.0.1",
    "@mosaicstack/mcp-optimizer": "^0.0.1",
    "@mosaicstack/mcp-dashboard": "^0.0.1"
  },
  "peerDependencies": {
    "@mosaicstack/tony": "^2.8.0",
    "@modelcontextprotocol/sdk": "^0.4.0"
  },
  "scripts": {
    "postinstall": "mosaic-mcp setup",
    "configure": "mosaic-mcp configure",
    "start": "mosaic-mcp start",
    "health": "mosaic-mcp health"
  }
}
```

### 2. Core Package (@mosaicstack/mcp-core)

Shared utilities, base classes, and common interfaces.

**Structure**:
```
@mosaicstack/mcp-core/
├── src/
│   ├── base/
│   │   ├── MCPServer.ts        # Base MCP server class
│   │   ├── MCPTool.ts          # Base tool definition
│   │   └── MCPTransport.ts     # Transport interfaces
│   ├── utils/
│   │   ├── Logger.ts           # Unified logging
│   │   ├── Config.ts           # Configuration management
│   │   └── Metrics.ts          # Metrics collection
│   ├── interfaces/
│   │   ├── Command.ts          # Command interfaces
│   │   ├── Pattern.ts          # Pattern interfaces
│   │   └── Context.ts          # Context interfaces
│   └── index.ts
├── package.json
└── README.md
```

**Exports**:
```typescript
// Main exports from @mosaicstack/mcp-core
export { MCPServer, MCPServerConfig } from './base/MCPServer';
export { MCPTool, ToolDefinition } from './base/MCPTool';
export { Logger, LogLevel } from './utils/Logger';
export { ConfigLoader, Configuration } from './utils/Config';
export * from './interfaces';
```

### 3. Gateway Package (@mosaicstack/mcp-gateway)

Universal transport layer for client compatibility.

**Structure**:
```
@mosaicstack/mcp-gateway/
├── src/
│   ├── transports/
│   │   ├── SSETransport.ts
│   │   ├── RESTTransport.ts
│   │   └── WebSocketTransport.ts
│   ├── adapters/
│   │   ├── OpenCodeAdapter.ts
│   │   └── ClaudeAdapter.ts
│   ├── Gateway.ts
│   └── index.ts
├── package.json
└── README.md
```

**Key Dependencies**:
```json
{
  "dependencies": {
    "@mosaicstack/mcp-core": "^0.0.2",
    "express": "^4.18.0",
    "ws": "^8.0.0",
    "cors": "^2.8.5"
  }
}
```

### 4. UPP Package (@mosaicstack/mcp-upp)

Task decomposition with UPP methodology.

**Structure**:
```
@mosaicstack/mcp-upp/
├── src/
│   ├── decomposer/
│   │   ├── UPPDecomposer.ts
│   │   ├── ComplexityAnalyzer.ts
│   │   └── HierarchyBuilder.ts
│   ├── patterns/
│   │   ├── PatternMatcher.ts
│   │   └── PatternAdapter.ts
│   ├── validation/
│   │   ├── UPPValidator.ts
│   │   └── TimeEstimator.ts
│   ├── tools/
│   │   ├── PlanTool.ts
│   │   └── EstimateTool.ts
│   └── index.ts
├── patterns/           # Built-in patterns
│   ├── auth-system.yaml
│   ├── crud-api.yaml
│   └── frontend-app.yaml
├── package.json
└── README.md
```

### 5. CLI Package (@mosaicstack/mcp-cli)

Command-line interface for MCP management.

**Structure**:
```
@mosaicstack/mcp-cli/
├── src/
│   ├── commands/
│   │   ├── setup.ts
│   │   ├── start.ts
│   │   ├── stop.ts
│   │   ├── configure.ts
│   │   └── health.ts
│   ├── utils/
│   │   ├── installer.ts
│   │   └── updater.ts
│   └── index.ts
├── bin/
│   └── mosaic-mcp.js
├── package.json
└── README.md
```

**CLI Commands**:
```bash
# Installation and setup
mosaic-mcp setup              # Initial configuration
mosaic-mcp configure          # Reconfigure settings

# Server management  
mosaic-mcp start              # Start all MCP servers
mosaic-mcp stop               # Stop all servers
mosaic-mcp restart            # Restart servers
mosaic-mcp status             # Check status

# Package management
mosaic-mcp update             # Update all packages
mosaic-mcp install <package>  # Install specific MCP
mosaic-mcp list               # List installed MCPs

# Development
mosaic-mcp create <name>      # Create new MCP from template
mosaic-mcp test               # Run integration tests
mosaic-mcp logs               # View logs
```

## Version Strategy

### Semantic Versioning

Following semver with coordinated releases:

```
0.0.x - Alpha (Current)
  - Breaking changes allowed
  - Rapid iteration
  - Limited compatibility

0.1.x - Beta
  - API stabilizing
  - Breaking changes minimized
  - Migration guides provided

0.x.x - Release Candidate
  - Feature complete
  - Production testing
  - Performance optimization

1.0.0 - Stable Release
  - Production ready
  - Backward compatibility
  - LTS support
```

### Version Compatibility Matrix

```typescript
interface VersionCompatibility {
  "@mosaicstack/mcp": {
    "0.0.2": {
      "@mosaicstack/tony": ">=2.8.0",
      "@modelcontextprotocol/sdk": "^0.4.0",
      "node": ">=18.0.0"
    }
  }
}
```

### Update Strategy

```typescript
// Auto-update configuration
interface UpdateConfig {
  channel: 'stable' | 'beta' | 'alpha';
  auto: {
    patch: boolean;    // Auto-install patches
    minor: boolean;    // Auto-install minor updates  
    major: 'never' | 'prompt' | 'auto';
  };
  check: 'startup' | 'daily' | 'weekly' | 'never';
}
```

## Dependency Management

### Core Dependencies

All packages share these core dependencies:

```json
{
  "dependencies": {
    "@mosaicstack/mcp-core": "workspace:*"
  },
  "peerDependencies": {
    "@modelcontextprotocol/sdk": "^0.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

### Workspace Configuration

Using npm workspaces for development:

**Root package.json**:
```json
{
  "name": "@mosaicstack/mcp-monorepo",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces",
    "publish": "npm run publish --workspaces"
  }
}
```

## Installation Scenarios

### 1. Full Installation (Recommended)

```bash
npm install -g @mosaicstack/mcp

# What gets installed:
# ✓ All core packages
# ✓ Gateway with all transports
# ✓ UPP decomposition
# ✓ Pattern library
# ✓ Command system
# ✓ CLI tools
```

### 2. Minimal Installation

```bash
npm install -g @mosaicstack/mcp-core @mosaicstack/mcp-gateway @mosaicstack/mcp-cli

# Just the essentials for basic MCP functionality
```

### 3. Custom Installation

```bash
# Install specific components
npm install -g @mosaicstack/mcp-upp      # Just UPP decomposition
npm install -g @mosaicstack/mcp-plane    # Just Plane.so integration
```

### 4. Development Installation

```bash
# Clone the monorepo
git clone https://github.com/mosaicstack/mcp
cd mcp

# Install dependencies
npm install

# Link packages locally
npm run link:all

# Start development
npm run dev
```

## Package Configuration

### Global Configuration Location

Following XDG Base Directory Specification:

```
~/.config/mosaic/
├── mcp/
│   ├── config.yaml         # Main configuration
│   ├── patterns/           # Pattern library storage
│   ├── cache/              # Token-saving cache
│   └── logs/               # Unified logs
└── .mcp-version            # Version tracking
```

### Per-Package Configuration

Each package can have its own configuration section:

```yaml
# ~/.config/mosaic/mcp/config.yaml
mcp:
  core:
    log_level: info
    metrics: true
    
  gateway:
    port: 3456
    transports: [sse, rest, websocket]
    
  upp:
    sequential_thinking: true
    pattern_cache: true
    
  plane:
    api_key: ${PLANE_API_KEY}
    workspace: mosaic
    
  commands:
    natural_language: true
    aliases: custom-aliases.yaml
```

## Plugin System

### Creating MCP Plugins

Template for new MCP packages:

```typescript
// Template structure
interface MCPPlugin {
  name: string;
  version: string;
  description: string;
  
  // Required exports
  tools: MCPTool[];
  
  // Optional hooks
  onInstall?: () => Promise<void>;
  onStart?: (config: any) => Promise<void>;
  onStop?: () => Promise<void>;
  
  // Configuration schema
  configSchema?: object;
}
```

### Plugin Discovery

```typescript
class PluginDiscovery {
  async discover(): Promise<MCPPlugin[]> {
    // Search locations
    const locations = [
      '/usr/local/lib/node_modules/@mosaicstack/mcp-*',
      '~/.mosaic/mcp/plugins/*',
      './node_modules/@mosaicstack/mcp-*'
    ];
    
    // Load and validate plugins
    return this.loadPlugins(locations);
  }
}
```

## Build and Release Process

### Build Pipeline

```yaml
# GitHub Actions workflow
name: Build and Publish
on:
  push:
    branches: [main]
    
jobs:
  build:
    strategy:
      matrix:
        package: [core, gateway, upp, patterns, commands, cli]
    
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run build -w @mosaicstack/mcp-${{ matrix.package }}
      - run: npm test -w @mosaicstack/mcp-${{ matrix.package }}
      
  publish:
    if: startsWith(github.ref, 'refs/tags/v')
    needs: build
    steps:
      - run: npm publish --workspaces
```

### Release Coordination

```bash
# Version bump all packages together
npm version patch --workspaces

# Publish with tags
npm publish --workspaces --tag alpha   # For 0.0.x
npm publish --workspaces --tag beta    # For 0.1.x  
npm publish --workspaces --tag latest  # For 1.0.0+
```

## Migration Support

### Version Migration

```typescript
// Built-in migration support
class MCPMigrator {
  async migrate(fromVersion: string, toVersion: string): Promise<void> {
    const migrations = await this.loadMigrations(fromVersion, toVersion);
    
    for (const migration of migrations) {
      console.log(`Running migration: ${migration.name}`);
      await migration.run();
    }
  }
}
```

### Breaking Change Management

```yaml
# .migration.yaml in each package
migrations:
  "0.0.2-to-0.0.3":
    breaking:
      - "Renamed config key 'gateway.port' to 'gateway.listen_port'"
      - "Changed tool response format"
    automatic:
      - "Update configuration keys"
      - "Migrate pattern library format"
    manual:
      - "Review custom plugins for compatibility"
```

## Success Metrics

### Package Health
- Download growth rate
- Issue resolution time
- Dependency update frequency
- Security vulnerability response

### Developer Experience
- Installation success rate: >99%
- Update success rate: >95%
- Time to first tool: <5 minutes
- Documentation completeness: 100%

## Next Steps

1. Set up npm organization (@mosaicstack)
2. Create package templates
3. Implement workspace configuration
4. Build CLI installer
5. Create plugin template
6. Set up CI/CD pipeline

---

The MosAIc MCP package structure ensures easy installation, reliable updates, and infinite extensibility while maintaining simplicity for end users.