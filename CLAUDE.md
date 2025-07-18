# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL: Epic E.055 - MosAIc Stack Transformation In Progress

### ⚡ MANDATORY FIRST READ
**STOP! Before doing ANY work, you MUST read:**
- Primary: `docs/agent-management/tech-lead-tony/E055-PROGRESS.md`
- Context: `docs/agent-management/tech-lead-tony/E055-CORE-DECOMPOSITION.md`
- Status: `STATUS.md`

### 🔒 DO NOT MODIFY (Blocked Areas)
- ❌ **tony/** submodule - Another agent is completing 2.7.0 work
- ❌ **mosaic/** submodule - This is the existing MosAIc platform (not our target)
- ❌ GitHub repository names - Already renamed (mosaic-mcp, mosaic-dev)

### ✅ ACTIVE WORK AREAS
1. **@mosaic/core** - NEW package (NOT the mosaic submodule!)
   - Location: `worktrees/mosaic-worktrees/core-orchestration/packages/core/`
   - Status: Basic implementation complete, needs MCP integration
   - Branch: `feature/core-orchestration`

2. **mosaic-mcp** - Enhance with orchestration tools
   - Add tools for MosAIc orchestration
   - Integrate with @mosaic/core

3. **mosaic-dev** - Update to @mosaic/dev namespace
   - Package namespace migration needed

### 📁 Worktree Structure
```
worktrees/
├── mosaic-worktrees/
│   └── core-orchestration/     # @mosaic/core development (ACTIVE)
├── mosaic-mcp-worktrees/       # For MCP enhancements
├── mosaic-dev-worktrees/       # For dev tools updates
└── tony-worktrees/             # For Tony 2.8.0 (DO NOT USE YET)
```

### 🎯 Current Epic E.055 Status
- MosAIc SDK repository created ✅
- Submodules renamed on GitHub ✅
- @mosaic/core basic implementation ✅
- Waiting for Tony 2.7.0 completion ⏳
- MCP integration needed 🔄

### ⚠️ Common Mistakes to Avoid
1. DO NOT modify the `mosaic/` submodule - it's a separate platform
2. DO NOT create new worktrees without checking existing ones
3. DO NOT work on Tony until 2.7.0 is complete
4. DO NOT start coding without reading E055-PROGRESS.md

## Build Commands

### Initial Setup
```bash
npm run setup          # Install and initialize all submodules
npm run install:all    # Install dependencies in all packages
```

### Development Server
```bash
npm run dev:start      # Start isolated MCP server (port 3456)
npm run dev:stop       # Stop MCP server
npm run dev:status     # Check server status
npm run dev:logs       # View server logs
```

### Building
```bash
npm run build:all      # Build all components
npm run build:mosaic   # Build MosAIc core only
npm run build:mcp      # Build MCP server only
npm run build:dev      # Build dev tools only
```

### Testing
```bash
npm test               # Run all tests
npm run test:mosaic    # Test MosAIc core
npm run test:mcp       # Test MCP server
npm run test:dev       # Test dev tools
```

### Maintenance
```bash
npm run verify         # Verify structure and submodules
npm run update         # Update submodules
npm run clean          # Clean build artifacts
npm run fresh          # Clean install (removes node_modules)
```

### MosAIc CLI Usage
```bash
./mosaic dev start     # Start isolated environment
./mosaic tony plan     # Use MosAIc Tony with isolated MCP
./mosaic claude -p "Help"  # Use MosAIc Claude with isolated MCP
```

## Architecture Overview

### Project Structure
The MosAIc SDK is a monorepo with git submodules:
- `mosaic/` - Core MosAIc Platform (@mosaic/core)
- `mosaic-mcp/` - MCP Server for coordination (@mosaic/mcp)
- `mosaic-dev/` - Development tools and SDK (@mosaic/dev)
- `tony/` - Tony Framework integration (@tony/core)
- `worktrees/` - Git worktrees for parallel development

### MCP-First Architecture
Starting with v2.8.0, all components communicate through MCP (Model Context Protocol):
- Unified state management via MCP server
- Isolated development environment on port 3456
- SQLite database at `.mosaic/data/mcp.db`
- Configuration in `.mosaic/claude/config.json`

### Key Design Principles
1. **Isolation**: Development environment runs independently from other Tony projects
2. **Modularity**: Each component is a separate npm package with its own build
3. **TypeScript**: All code is written in TypeScript with strict mode
4. **Testing**: Comprehensive test coverage with Jest and Playwright
5. **MCP Communication**: All agent coordination happens through MCP infrastructure

### Development Workflow
1. Start the isolated MCP server with `npm run dev:start`
2. Use `./mosaic` CLI wrapper for MosAIc-specific commands
3. Each submodule can be developed independently
4. Changes to submodules require commits in both submodule and parent repo

### Configuration Files
- `.mosaic/claude/config.json` - MCP server configuration
- `.env.development` - Environment variables
- `tsconfig.*.json` - TypeScript configs for different environments
- Each submodule has its own `package.json` and build configuration

### Database Schema
The MCP server uses SQLite for local development with tables for:
- Sessions and state management
- Message history and coordination
- Agent registry and capabilities
- Task tracking and dependencies

When making changes, ensure compatibility with the MCP infrastructure and follow the existing TypeScript patterns in each submodule.