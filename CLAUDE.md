# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 MosAIc SDK - Enterprise AI Development Platform

You are working in the **MosAIc SDK**, a comprehensive development platform that orchestrates multiple AI components for enterprise-scale software development.

### Core Components

The SDK integrates four main submodules:
- **mosaic/** - Enterprise platform extending Tony for multi-project coordination
- **mosaic-docs/** - Centralized documentation repository
- **mosaic-mcp/** - Model Context Protocol server for agent communication
- **mosaic-tony/** - Tony Framework for AI agent orchestration

### Quick Start Commands

```bash
# Initial setup
npm run setup          # Install and initialize all submodules
npm run install:all    # Install dependencies in all packages

# Development
npm run dev:start      # Start isolated MCP server (port 3456)
npm run dev:stop       # Stop MCP server
npm run dev:status     # Check server status

# Building
npm run build:all      # Build all components

# Testing
npm test              # Run all tests
```

## 📁 Project Structure

```
mosaic-sdk/
├── mosaic-tony/        # Tony Framework (AI orchestration)
├── mosaic/             # Enterprise platform (extends Tony)
├── mosaic-mcp/         # MCP server (agent communication)
├── mosaic-docs/        # Documentation repository
│
├── tools/              # Development tools
│   ├── development/    # Build and dev utilities
│   ├── migration/      # Migration tools
│   ├── task-management/# Task tracking
│   └── testing/        # Test framework
│
├── scripts/            # Operational scripts
│   ├── development/    # Dev scripts
│   ├── operations/     # Ops scripts
│   └── utilities/      # Utility scripts
│
├── conf/               # Configuration templates
│   ├── development/    # Dev configs
│   ├── infrastructure/ # Infra configs
│   └── platform/       # Platform configs
│
├── templates/          # Project templates
│   ├── development/    # Dev templates
│   ├── infrastructure/ # Infra templates
│   └── services/       # Service templates
│
├── bootstrap/          # Project initialization
├── examples/           # Usage examples
├── docs/               # Minimal SDK docs
└── worktrees/          # Git worktrees
```

## 📚 Documentation

### Documentation Architecture
- **Full Documentation**: Available in `mosaic-docs/` submodule
- **SDK-Specific Docs**: Minimal docs in `docs/sdk/`
- **BookStack Integration**: Documentation syncs to BookStack for web access

### Key Documentation Locations
- Architecture: `docs/sdk/architecture/`
- Development Guide: `docs/sdk/development/`
- Operations: `docs/sdk/operations/`

### Documentation Standards
All documentation must follow the 4-level BookStack hierarchy:
- Shelf → Book → Chapter → Page
- See `mosaic-docs/standards/DOCUMENTATION-GUIDE.md` for details

## 🛠️ Development Workflow

### Working with Submodules
```bash
# Update all submodules
git submodule update --init --recursive

# Work in a specific submodule
cd tony
git checkout main
git pull origin main
```

### Using Worktrees
```bash
# List existing worktrees
git worktree list

# Work with @mosaic/core
cd worktrees/mosaic-worktrees/core-orchestration
```

### MCP Development
The SDK includes an isolated MCP server for testing:
- Port: 3456 (isolated from other projects)
- Database: `~/.config/mosaic/data/mcp.db`
- Config: `~/.config/mosaic/claude/config.json`

#### Sequential Thinking Integration ✅
- **Full Guide**: See `docs/mosaic-mcp/SEQUENTIAL-THINKING-INTEGRATION.md`
- **POC Documentation**: `docs/mosaic-mcp/SEQUENTIAL-THINKING-POC.md`
- **Test Config**: `docs/mosaic-mcp/sequential-thinking-test-config.md`
- **Implementation**: 
  - Client: `packages/mcp-orchestrator/src/clients/SequentialThinkingClient.ts`
  - Service: `packages/mcp-orchestrator/src/services/SequentialTaskService.ts`
  - Mapper: `packages/mcp-orchestrator/src/services/TonyHierarchyMapper.ts`
  - Tools: `packages/mcp-orchestrator/src/tools/SequentialTaskTools.ts`
- **Configuration**:
  - Claude Code: `.claude/mcp.json`
  - OpenCode: `opencode.json`
- **Startup**: `./scripts/development/mcp/start-orchestrator.sh`

## 🖥️ Terminal UI (OpenCode Integration)

### TUI Commands and Workflow

MosAIc SDK integrates with [OpenCode](https://github.com/sst/opencode) for professional terminal-based development. The integration uses MCP servers for zero-modification enhancement.

#### Prerequisites Setup
```bash
# Install Bun runtime (required by OpenCode)
curl -fsSL https://bun.sh/install | bash

# Install OpenCode CLI
npm install -g opencode-ai@latest

# Configure OpenCode for MosAIc
mosaic tui setup
```

#### TUI Commands
```bash
# Launch OpenCode with MosAIc integration
mosaic tui                        # Default mode with all MosAIc tools

# Specialized modes
mosaic tui --mode mosaic-plan     # Enterprise planning mode
mosaic tui --mode mosaic-execute  # Full development mode
mosaic tui --mode build          # Standard OpenCode build mode
mosaic tui --mode plan           # Standard OpenCode planning mode

# Configuration management
mosaic tui config                # Show current configuration
mosaic tui config --validate     # Validate OpenCode configuration
mosaic tui config --reset        # Reset to default MosAIc configuration
```

#### Available Modes

**`mosaic-plan`** - Enterprise Planning Mode:
- UPP task decomposition tools
- Multi-project coordination
- Agent assignment capabilities
- Enterprise task tracking
- Limited to planning tools only

**`mosaic-execute`** - Full Development Mode:
- Complete development toolset
- Agent orchestration
- File system operations
- Code execution capabilities
- Full MosAIc Stack integration

**`build`** - Standard Build Mode:
- OpenCode's default build mode
- Enhanced with MosAIc project awareness
- Access to MosAIc file templates

**`plan`** - Standard Planning Mode:
- OpenCode's default planning mode
- Enhanced with MosAIc task management

#### Integration Architecture

The integration works through MCP (Model Context Protocol) servers:

```json
{
  "mcp": {
    "mosaic": {
      "type": "local",
      "command": ["mosaic-mcp", "serve"],
      "environment": {
        "MOSAIC_CONFIG": "~/.config/mosaic/config.json",
        "MOSAIC_DATA_DIR": "~/.config/mosaic/data"
      }
    }
  }
}
```

#### Available Tools

**Task Management Tools** (namespace: `mosaic_task_*`):
- `mosaic_task_create` - Create new tasks with UPP hierarchy
- `mosaic_task_assign` - Assign tasks to agents
- `mosaic_task_depend` - Define task dependencies
- `mosaic_task_status` - Update task status
- `mosaic_task_decompose` - Decompose high-level tasks using Sequential Thinking
- `mosaic_task_estimate_batch` - Batch estimate task durations with AI
- `mosaic_task_assign_intelligent` - Intelligently assign tasks to agents
- `mosaic_task_analyze_complexity` - Analyze task complexity for planning

**Project Coordination Tools** (namespace: `mosaic_project_*`):
- `mosaic_project_list` - List available projects
- `mosaic_project_switch` - Switch between projects
- `mosaic_project_status` - Get project status

**Agent Orchestration Tools** (namespace: `mosaic_agent_*`):
- `mosaic_agent_spawn` - Spawn specialized agents
- `mosaic_agent_coordinate` - Coordinate multi-agent tasks
- `mosaic_agent_monitor` - Monitor agent progress

#### Configuration Files

**Global Configuration**: `~/.config/opencode/config.json`
**Project Configuration**: `opencode.json` or `opencode.jsonc`

Example project configuration:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "mosaic": {
      "type": "local",
      "command": ["mosaic-mcp", "serve"]
    }
  },
  "mode": {
    "mosaic-plan": {
      "prompt": "You are using MosAIc planning mode with enterprise task management tools.",
      "tools": {
        "mosaic_task_create": true,
        "mosaic_task_assign": true,
        "mosaic_project_switch": true,
        "todowrite": false
      }
    }
  }
}
```

#### Workflow Integration

1. **Project Initialization**:
   ```bash
   mosaic tui setup                # Configure OpenCode integration
   mosaic tui --mode mosaic-plan   # Start planning session
   ```

2. **Planning Phase**:
   - Use `mosaic_task_create` for UPP task decomposition
   - Assign agents with `mosaic_task_assign`
   - Define dependencies with `mosaic_task_depend`

3. **Execution Phase**:
   ```bash
   mosaic tui --mode mosaic-execute  # Switch to execution mode
   ```
   - Spawn specialized agents
   - Coordinate multi-agent development
   - Monitor progress through TUI

4. **Monitoring**:
   - Real-time task progress in TUI
   - Agent status and coordination
   - Project-wide visibility

#### Benefits

- ✅ **Zero OpenCode Modifications**: Plugin-based integration
- ✅ **Automatic Updates**: Benefit from OpenCode team improvements
- ✅ **Enterprise Features**: UPP methodology and agent coordination
- ✅ **Familiar Interface**: Professional terminal experience
- ✅ **Mode Switching**: Seamless transition between planning and execution

## 🎭 Agent Persona System

### Mandatory Personas
All agents MUST use predefined personas from `tony/personas/`:
- Naming: `DOMAIN-ROLE-NAME` (e.g., `BE-BACKEND-BENJAMIN`)
- No custom personas allowed
- Personas define tools, models, and communication style

### Common Personas
- **Development**: BE-BACKEND-BENJAMIN, FE-FRONTEND-FIONA, FS-FULLSTACK-FELIX
- **Quality**: QA-QUALITY-QUINN, TEST-AUTOMATION-TARA
- **Security**: SEC-SECURITY-SARAH, AUDIT-COMPLIANCE-ALEX
- **Operations**: DEVOPS-OPERATIONS-OLIVER, SRE-RELIABILITY-RACHEL
- **Management**: TL-LEAD-TONY, PM-PROJECT-PAUL

### Using Personas
```bash
# List available personas
./tony/scripts/operations/agents/persona-loader.sh --list

# Deploy agent with persona
./scripts/spawn-agent.sh --persona BE-BACKEND-BENJAMIN
```

## 🔧 Key Technologies

- **TypeScript**: All code in strict mode
- **Node.js**: v18+ required
- **MCP**: Model Context Protocol for agent communication
- **SQLite**: Local development database
- **Git Submodules**: Component management

## 📋 Important Patterns

### 4-Domain Architecture
1. **conf/**: All configuration files
2. **scripts/**: Executable scripts
3. **templates/**: Reusable templates
4. **docs/**: Documentation (minimal, most in mosaic-docs)

### Commit Standards
- Use conventional commits: `type(scope): description`
- Include task IDs when applicable
- Keep commits atomic and focused

### Testing Requirements
- Never commit without running tests
- Maintain test coverage above 80%
- All new features need tests

## 🚨 Critical Reminders

1. **Check Your Location**: Always verify you're in `mosaic-sdk/`
2. **Update Submodules**: Keep submodules current with parent repo
3. **Use Personas**: Every agent must have an assigned persona
4. **Follow Standards**: Adhere to documentation and code standards
5. **Test Everything**: Run tests before committing

## 🔍 Quick Reference Paths

- **MCP Config**: `~/.config/mosaic/claude/config.json`
- **Stack Config**: `~/.config/mosaic/stack.config.json`
- **Version Matrix**: `~/.config/mosaic/version-matrix.json`
- **Agent Logs**: `~/.config/mosaic/logs/agent-tasks/{agent-name}/`
- **Personas**: `tony/personas/{domain}/`

## 💡 Getting Help

- **Documentation**: See `mosaic-docs/` for comprehensive guides
- **Examples**: Check `examples/` for usage patterns
- **Scripts**: Browse `scripts/` for automation tools
- **Tools**: Explore `tools/` for development utilities

---

When working in this repository, focus on maintaining the clean architecture, following established patterns, and ensuring all changes align with the enterprise-scale vision of the MosAIc platform.