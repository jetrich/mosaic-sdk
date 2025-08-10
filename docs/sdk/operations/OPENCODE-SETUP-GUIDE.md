# OpenCode Setup Guide for MosAIc Integration

**Version**: 1.0.0  
**Date**: 2025-07-21  
**Status**: Complete  

## Overview

This guide provides step-by-step instructions for setting up OpenCode TUI with MosAIc Stack integration. The integration uses Model Context Protocol (MCP) servers to provide enterprise features without modifying OpenCode core.

## Prerequisites

### System Requirements

- **Operating System**: macOS, Linux, or Windows with WSL2
- **Node.js**: v18.0.0 or higher
- **Git**: Latest version
- **Terminal**: Modern terminal with Unicode support

### Required Runtime

OpenCode requires the Bun JavaScript runtime:

```bash
# Install Bun (macOS/Linux)
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version
```

## Installation

### 1. Install OpenCode CLI

```bash
# Install globally via npm
npm install -g opencode-ai@latest

# Verify installation
opencode --version

# Check available commands
opencode --help
```

### 2. Install MosAIc SDK

If you haven't already installed the MosAIc SDK:

```bash
# Clone MosAIc SDK
git clone https://github.com/jetrich/mosaic-sdk.git
cd mosaic-sdk

# Initialize submodules
git submodule update --init --recursive

# Install dependencies
npm install

# Build MCP server
npm run build:all
```

### 3. Install MosAIc MCP Server

```bash
# Install MCP orchestrator package (when available)
npm install -g @mosaicstack/mcp-orchestrator

# Or build from source
cd mosaic-mcp
npm run build
npm link

# Verify MCP server
mosaic-mcp --version
```

## Configuration

### 1. Create OpenCode Configuration

Create configuration file in your project root:

**File**: `opencode.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-3-5-sonnet-20241022",
  "mcp": {
    "mosaic": {
      "type": "local",
      "command": ["mosaic-mcp", "serve"],
      "environment": {
        "MOSAIC_CONFIG": "~/.mosaic/config.json",
        "MOSAIC_DATA_DIR": "~/.mosaic/data",
        "MOSAIC_PROJECT_ROOT": "."
      }
    }
  },
  "mode": {
    "mosaic-plan": {
      "prompt": "You are using MosAIc planning mode with enterprise task management tools. Focus on UPP task decomposition, agent assignment, and project coordination.",
      "tools": {
        "mosaic_task_create": true,
        "mosaic_task_assign": true,
        "mosaic_task_depend": true,
        "mosaic_project_list": true,
        "mosaic_project_switch": true,
        "mosaic_project_status": true,
        "todowrite": false,
        "todoread": false
      }
    },
    "mosaic-execute": {
      "prompt": "You are using MosAIc execution mode with full development capabilities. You can spawn agents, coordinate tasks, and perform all development operations.",
      "tools": {
        "write": true,
        "edit": true,
        "bash": true,
        "read": true,
        "glob": true,
        "grep": true,
        "mosaic_agent_spawn": true,
        "mosaic_agent_coordinate": true,
        "mosaic_agent_monitor": true,
        "mosaic_task_create": true,
        "mosaic_task_assign": true,
        "mosaic_task_status": true
      }
    },
    "mosaic-monitor": {
      "prompt": "You are in MosAIc monitoring mode. Focus on observing agent progress, task status, and system health.",
      "tools": {
        "mosaic_agent_monitor": true,
        "mosaic_task_status": true,
        "mosaic_project_status": true,
        "read": true,
        "bash": false,
        "write": false
      }
    }
  },
  "experimental": {
    "hook": {
      "session_completed": [{
        "command": ["mosaic-cli", "task", "complete"],
        "environment": {
          "MOSAIC_SESSION_ID": "{sessionId}"
        }
      }],
      "file_edited": {
        "*.ts": [{
          "command": ["mosaic-cli", "track", "edit", "{filePath}"]
        }],
        "*.tsx": [{
          "command": ["mosaic-cli", "track", "edit", "{filePath}"]
        }],
        "*.js": [{
          "command": ["mosaic-cli", "track", "edit", "{filePath}"]
        }],
        "*.jsx": [{
          "command": ["mosaic-cli", "track", "edit", "{filePath}"]
        }]
      }
    }
  }
}
```

### 2. Global OpenCode Configuration

For system-wide defaults, create:

**File**: `~/.config/opencode/config.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-3-5-sonnet-20241022",
  "autoupdate": true,
  "share": "manual",
  "keybinds": {
    "leader": "ctrl+x",
    "switch_mode": "tab",
    "session_new": "<leader>n",
    "session_list": "<leader>l",
    "tool_details": "<leader>d",
    "model_list": "<leader>m"
  },
  "mcp": {
    "mosaic": {
      "type": "local",
      "command": ["mosaic-mcp", "serve"],
      "environment": {
        "MOSAIC_CONFIG": "~/.mosaic/config.json"
      }
    }
  }
}
```

### 3. MosAIc MCP Server Configuration

Create MCP server configuration:

**File**: `~/.mosaic/config.json`

```json
{
  "version": "1.0.0",
  "mcp": {
    "server": {
      "port": 3456,
      "host": "localhost",
      "protocol": "stdio"
    },
    "tools": {
      "task_management": {
        "enabled": true,
        "namespace": "mosaic_task"
      },
      "project_coordination": {
        "enabled": true,
        "namespace": "mosaic_project"
      },
      "agent_orchestration": {
        "enabled": true,
        "namespace": "mosaic_agent"
      }
    },
    "storage": {
      "database": "~/.mosaic/data/mcp.db",
      "backup_interval": "1h"
    }
  },
  "logging": {
    "level": "info",
    "file": "~/.mosaic/logs/mcp.log"
  }
}
```

## Quick Start

### 1. Initialize MosAIc in Project

```bash
# Navigate to your project
cd /path/to/your/project

# Initialize MosAIc stack
mosaic init

# Setup OpenCode integration
mosaic tui setup
```

### 2. Launch OpenCode with MosAIc

```bash
# Default mode (all tools available)
opencode

# Planning mode (enterprise task management)
opencode --mode mosaic-plan

# Execution mode (full development)
opencode --mode mosaic-execute

# Monitoring mode (read-only observation)
opencode --mode mosaic-monitor
```

### 3. Using MosAIc Commands

In OpenCode, you can use MosAIc tools by their namespaced names:

```bash
# Task management
mosaic_task_create "Epic E.300: Implement user authentication"
mosaic_task_assign task_id=T.300.01 agent="BE-BACKEND-BENJAMIN"

# Project coordination  
mosaic_project_list
mosaic_project_switch project_name="web-app"

# Agent orchestration
mosaic_agent_spawn persona="FE-FRONTEND-FIONA" task="Build login component"
mosaic_agent_monitor
```

## Usage Modes

### Planning Mode (`mosaic-plan`)

**Purpose**: Enterprise task planning and decomposition  
**Available Tools**: Task management, project coordination  
**Use Case**: Breaking down epics, assigning agents, planning sprints

```bash
opencode --mode mosaic-plan
```

**Example Session**:
```
User: Create a new epic for user authentication system
AI: I'll use mosaic_task_create to create this epic...

User: Break it down into features
AI: I'll decompose this using UPP methodology...
```

### Execution Mode (`mosaic-execute`)

**Purpose**: Full development with agent coordination  
**Available Tools**: All development tools + agent orchestration  
**Use Case**: Active development, code writing, testing

```bash
opencode --mode mosaic-execute
```

**Example Session**:
```
User: Implement the login API endpoint
AI: I'll spawn a backend agent and coordinate the implementation...

User: Add tests for the endpoint
AI: I'll create test files and run the test suite...
```

### Monitoring Mode (`mosaic-monitor`)

**Purpose**: Observe progress and system status  
**Available Tools**: Read-only monitoring tools  
**Use Case**: Checking agent progress, reviewing task status

```bash
opencode --mode mosaic-monitor
```

**Example Session**:
```
User: Show me the status of all active tasks
AI: Using mosaic_task_status to check all tasks...

User: How are the agents performing?
AI: Let me check agent progress with mosaic_agent_monitor...
```

## Troubleshooting

### Common Issues

#### 1. MCP Server Not Starting

**Error**: `Failed to connect to MCP server`

**Solutions**:
```bash
# Check if MCP server is installed
mosaic-mcp --version

# Test MCP server manually
mosaic-mcp serve --debug

# Check configuration
cat ~/.mosaic/config.json

# Verify OpenCode configuration
opencode config show
```

#### 2. Tool Not Available

**Error**: `Tool 'mosaic_task_create' not found`

**Solutions**:
```bash
# Check MCP server logs
tail -f ~/.mosaic/logs/mcp.log

# Verify tool registration
mosaic-mcp tools list

# Check mode configuration
opencode config validate
```

#### 3. Permission Issues

**Error**: `Permission denied accessing ~/.mosaic/`

**Solutions**:
```bash
# Fix permissions
chmod -R 755 ~/.mosaic/
chown -R $USER ~/.mosaic/

# Recreate directories
rm -rf ~/.mosaic/
mosaic init
```

#### 4. Configuration Conflicts

**Error**: `Invalid configuration format`

**Solutions**:
```bash
# Validate JSON syntax
cat opencode.json | jq .

# Reset to defaults
mv opencode.json opencode.json.bak
mosaic tui setup

# Check schema compliance
opencode config validate --schema
```

### Debugging Mode

Enable detailed logging for troubleshooting:

```bash
# Environment variables
export MOSAIC_DEBUG=true
export MOSAIC_LOG_LEVEL=debug

# Launch with debug info
opencode --mode mosaic-execute --debug

# Check all logs
tail -f ~/.mosaic/logs/*.log
```

### Health Checks

Verify system health:

```bash
# Check OpenCode installation
opencode doctor

# Verify MCP connectivity
mosaic-mcp health-check

# Test MosAIc integration
mosaic tui test

# Validate configuration
opencode config validate
mosaic config validate
```

## Advanced Configuration

### Custom Tool Configuration

Disable specific tools in modes:

```json
{
  "mode": {
    "custom-mode": {
      "tools": {
        "bash": false,           // Disable shell access
        "write": false,          // Disable file writing
        "mosaic_agent_spawn": true  // Enable agent spawning
      }
    }
  }
}
```

### Environment Variables

Configure MCP server behavior:

```bash
# MCP server configuration
export MOSAIC_CONFIG=~/.mosaic/config.json
export MOSAIC_DATA_DIR=~/.mosaic/data
export MOSAIC_LOG_LEVEL=info
export MOSAIC_PROJECT_ROOT=.

# OpenCode integration
export OPENCODE_MCP_TIMEOUT=30000
export OPENCODE_MCP_RETRY_COUNT=3
```

### Custom Keybindings

Modify OpenCode keybindings for MosAIc:

```json
{
  "keybinds": {
    "mosaic_agent_spawn": "<leader>a",
    "mosaic_task_create": "<leader>t",
    "mosaic_project_switch": "<leader>p",
    "mosaic_mode_toggle": "<leader>m"
  }
}
```

## Integration with Existing Workflows

### Git Hooks

Integrate with Git workflows:

```bash
# .git/hooks/pre-commit
#!/bin/bash
mosaic-mcp task status --format=json > .mosaic/task-status.json
```

### CI/CD Integration

Use in automated environments:

```bash
# In CI pipeline
export OPENCODE_MODE=mosaic-execute
export MOSAIC_CI=true
opencode --batch < commands.txt
```

### IDE Integration

Configure IDE to launch OpenCode:

```json
// VS Code settings.json
{
  "terminal.integrated.profiles.linux": {
    "OpenCode MosAIc": {
      "path": "opencode",
      "args": ["--mode", "mosaic-execute"]
    }
  }
}
```

## Updating

### OpenCode Updates

OpenCode updates automatically by default. To control updates:

```json
{
  "autoupdate": false  // Disable auto-updates
}
```

Update manually:
```bash
npm update -g opencode-ai
```

### MosAIc MCP Server Updates

```bash
# Update MCP server
npm update -g @mosaicstack/mcp-orchestrator

# Or rebuild from source
cd mosaic-mcp
git pull origin main
npm run build
npm link
```

### Configuration Migration

When updating, use migration tools:

```bash
# Backup current config
cp opencode.json opencode.json.backup

# Run migration
mosaic config migrate --from=1.0.0 --to=1.1.0

# Validate new configuration
opencode config validate
```

## Support and Resources

### Documentation

- **OpenCode Docs**: https://opencode.ai/docs
- **MCP Protocol**: https://github.com/modelcontextprotocol/specification
- **MosAIc Documentation**: Available in `mosaic-docs/` submodule

### Community

- **GitHub Issues**: Report integration issues
- **Discord**: Join the MosAIc community
- **Documentation Feedback**: Contribute improvements

### Getting Help

1. **Check Logs**: Start with `~/.mosaic/logs/mcp.log`
2. **Validate Configuration**: Use `opencode config validate`
3. **Test Connectivity**: Run `mosaic-mcp health-check`
4. **Community Support**: Ask in Discord or GitHub Discussions
5. **Enterprise Support**: Contact enterprise@mosaicstack.dev

---

**Next Steps**: Once configured, explore the [TUI Workflow Guide](../development/TUI-WORKFLOW-GUIDE.md) for advanced usage patterns.