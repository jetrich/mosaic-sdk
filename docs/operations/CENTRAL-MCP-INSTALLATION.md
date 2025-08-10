# MosAIc MCP Central Installation Guide

## Overview

The MosAIc MCP (Model Context Protocol) server is now centrally installed in `~/.config/mosaic` to provide system-wide access across all projects. This ensures consistent tool availability and eliminates the need for project-specific MCP server installations.

## Installation Structure

```
~/.config/mosaic/
├── bin/
│   └── mosaic-mcp-server           # Central MCP server executable
├── mcp-server/                     # Complete MCP server package
│   ├── dist/                       # Compiled JavaScript
│   ├── node_modules/               # Runtime dependencies
│   └── package.json                # Package metadata
├── config/
│   └── config.json                 # Central configuration
├── data/
│   └── mcp.db                      # Central database (shared schema)
└── logs/
    └── mcp-server.log              # Server logs
```

## Automated Installation

Use the provided installation script:

```bash
# From project root
./scripts/install-central-mcp.sh
```

This script:
- Creates the complete directory structure
- Installs the consolidated MCP server
- Creates the startup script with proper paths
- Sets up default configuration
- Provides Claude Code integration instructions

## Manual Installation

If you need to install manually:

1. **Create directory structure:**
   ```bash
   mkdir -p ~/.config/mosaic/{bin,mcp-server,config,data,logs}
   ```

2. **Install MCP server:**
   ```bash
   cp -r packages/mcp-orchestrator/* ~/.config/mosaic/mcp-server/
   ```

3. **Create startup script:**
   ```bash
   cp ~/.config/mosaic/bin/mosaic-mcp-server # (use provided template)
   chmod +x ~/.config/mosaic/bin/mosaic-mcp-server
   ```

## Claude Code Integration

Update your `~/.claude.json` file:

```json
{
  "mcpServers": {
    "mosaic": {
      "command": "/home/jwoltje/.config/mosaic/bin/mosaic-mcp-server",
      "args": ["serve", "--stdio"],
      "env": {
        "MCP_PORT": "3456",
        "MOSAIC_CONFIG": "/home/jwoltje/.config/mosaic/config.json",
        "OLLAMA_HOST": "10.1.1.42",
        "OLLAMA_PORT": "11434"
      }
    }
  }
}
```

## Available Tools

The centrally installed MCP server provides **31 consolidated tools**:

### Task Management (`mosaic_task_*`)
- `mosaic_task_create` - Create new tasks with UPP hierarchy
- `mosaic_task_assign` - Assign tasks to agents  
- `mosaic_task_status` - Update task status
- `mosaic_task_depend` - Define task dependencies
- `mosaic_task_decompose` - Decompose tasks using Sequential Thinking
- `mosaic_task_estimate_batch` - Batch estimate task durations
- `mosaic_task_assign_intelligent` - Intelligent task assignment
- `mosaic_task_analyze_complexity` - Task complexity analysis

### Project Management (`mosaic_project_*`)
- `mosaic_project_create` - Create new projects
- `mosaic_project_list` - List available projects
- `mosaic_project_switch` - Switch between projects  
- `mosaic_project_status` - Get project status
- `mosaic_project_update` - Update project metadata

### Agent Coordination (`mosaic_agent_*`)
- `mosaic_agent_deploy` - Deploy specialized agents
- `mosaic_agent_status` - Monitor agent status
- `mosaic_agent_terminate` - Terminate agents
- `mosaic_agent_message` - Send messages to agents
- `mosaic_agent_handoff` - Handle agent handoffs
- `mosaic_agent_broadcast` - Broadcast to multiple agents

### Workflow Management (`mosaic_workflow_*`)
- `mosaic_workflow_create` - Create workflows
- `mosaic_workflow_execute` - Execute workflows
- `mosaic_workflow_monitor` - Monitor workflow progress
- `mosaic_workflow_list` - List workflows
- `mosaic_workflow_pause/resume/cancel` - Control workflow execution

### Resource Management
- `mosaic_resource_monitor` - Monitor system resources
- `mosaic_agent_limits` - Manage agent resource limits
- `mosaic_performance_report` - Generate performance reports
- `mosaic_resource_alerts` - Resource alerting

## Configuration

### Central Configuration File

`~/.config/mosaic/config/config.json`:

```json
{
  "version": "1.0.0",
  "transport": {
    "type": "stdio",
    "timeout": 30000
  },
  "database": {
    "path": "~/.config/mosaic/data/mcp.db"
  },
  "logging": {
    "level": "info",
    "structured": false,
    "console": true,
    "file": "~/.config/mosaic/logs/mcp-server.log"
  },
  "projects": {
    "defaultPath": "~/src"
  },
  "agents": {
    "maxConcurrent": 5,
    "defaultTimeout": 300000
  },
  "tools": {
    "sequentialThinking": {
      "enabled": true,
      "maxDepth": 6,
      "timeout": 60000
    }
  }
}
```

### Environment Variables

The startup script automatically sets:
- `MOSAIC_CONFIG` - Path to central config
- `MOSAIC_DATA_DIR` - Central data directory
- `DATABASE_PATH` - Central database path
- `MCP_PORT` - Server port (default 3456)

## Database

### Central Database Schema

The central database (`~/.config/mosaic/data/mcp.db`) includes:
- **Fixed `hook_registrations` table** with all required columns
- Task management tables
- Project coordination tables
- Agent state tables
- Workflow execution tables
- Performance metrics tables

### Schema Migration

The server automatically runs migrations on startup to ensure the database schema is current.

## Troubleshooting

### Server Not Starting

1. **Check executable permissions:**
   ```bash
   ls -la ~/.config/mosaic/bin/mosaic-mcp-server
   ```

2. **Verify installation:**
   ```bash
   ~/.config/mosaic/bin/mosaic-mcp-server --help
   ```

3. **Check logs:**
   ```bash
   tail -f ~/.config/mosaic/logs/mcp-server.log
   ```

### "Capabilities: none" in Claude Code

1. **Restart Claude Code** after configuration changes
2. **Check server process:**
   ```bash
   ps aux | grep mosaic-mcp-server
   ```

3. **Test server directly:**
   ```bash
   ~/.config/mosaic/bin/mosaic-mcp-server serve --stdio
   ```

### Database Issues

1. **Check database permissions:**
   ```bash
   ls -la ~/.config/mosaic/data/mcp.db
   ```

2. **Recreate database:**
   ```bash
   rm ~/.config/mosaic/data/mcp.db
   # Server will recreate on next start
   ```

## NPM Package Integration

The installation script is designed to work with both:
- **Local development** (current setup)
- **NPM package installation** (future deployment)

When integrated into the npm package, the script will:
- Run as a `postinstall` hook
- Detect npm installation context
- Install from the npm package location
- Configure system-wide access

## Benefits

✅ **System-wide availability** - All projects can access MCP tools  
✅ **Consistent configuration** - Central config management  
✅ **Shared database** - Cross-project task and agent coordination  
✅ **Simplified maintenance** - Single installation to manage  
✅ **Proper isolation** - Separate from project-specific dependencies  
✅ **Easy updates** - Central location for upgrades

## Migration from Project-Local Installation

If you previously had project-local MCP servers:

1. **Run the central installation:**
   ```bash
   ./scripts/install-central-mcp.sh
   ```

2. **Update Claude Code configuration** to use central server

3. **Remove old project-local servers:**
   ```bash
   # Remove old global npm packages
   npm uninstall -g mosaic-mcp
   
   # Clean up old configurations
   # (Update any hardcoded paths in project configs)
   ```

4. **Verify functionality:**
   ```bash
   # Claude Code: /mcp list
   # Should show mosaic server with all 31 tools
   ```

The central installation maintains all existing functionality while providing better system integration and management.