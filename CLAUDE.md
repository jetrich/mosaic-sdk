# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 MosAIc SDK - Enterprise AI Development Platform

You are working in the **MosAIc SDK**, a comprehensive development platform that orchestrates multiple AI components for enterprise-scale software development.

### Core Components

The SDK integrates four main submodules:
- **tony/** - Tony Framework for AI agent orchestration
- **mosaic/** - Enterprise platform extending Tony for multi-project coordination
- **mosaic-mcp/** - Model Context Protocol server for agent communication
- **mosaic-docs/** - Centralized documentation repository

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
├── tony/               # Tony Framework (AI orchestration)
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
- Database: `.mosaic/data/mcp.db`
- Config: `.mosaic/claude/config.json`

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

- **MCP Config**: `.mosaic/claude/config.json`
- **Stack Config**: `.mosaic/stack.config.json`
- **Version Matrix**: `.mosaic/version-matrix.json`
- **Agent Logs**: `logs/agent-tasks/{agent-name}/`
- **Personas**: `tony/personas/{domain}/`

## 💡 Getting Help

- **Documentation**: See `mosaic-docs/` for comprehensive guides
- **Examples**: Check `examples/` for usage patterns
- **Scripts**: Browse `scripts/` for automation tools
- **Tools**: Explore `tools/` for development utilities

---

When working in this repository, focus on maintaining the clean architecture, following established patterns, and ensuring all changes align with the enterprise-scale vision of the MosAIc platform.