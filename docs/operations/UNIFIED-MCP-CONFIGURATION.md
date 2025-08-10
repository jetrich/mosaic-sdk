# Unified MCP Configuration Guide

## Overview

This guide explains the unified MCP (Model Context Protocol) server configuration for MosAIc SDK that provides comprehensive tool access across all projects.

## Unified Configuration Architecture

Instead of scattered, project-specific MCP servers, we now use a centralized approach with multiple specialized servers:

### Core MCP Servers

1. **Context7** - Library documentation and code examples
2. **Official Plane** - Project management with Plane.so integration  
3. **Sequential Thinking** - Advanced reasoning and planning
4. **Mosaic Consolidated** - Task management, agent coordination, and workflow orchestration

## Configuration Structure

### Global Configuration (`~/.claude.json`)

```json
{
  "mcpServers": {
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp"
    },
    "plane": {
      "command": "npx",
      "args": ["-y", "@makeplane/plane-mcp-server"],
      "env": {
        "PLANE_API_KEY": "your-api-key",
        "PLANE_API_HOST_URL": "https://app.plane.so",
        "PLANE_WORKSPACE_SLUG": "your-workspace"
      }
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "mosaic": {
      "command": "/home/jwoltje/.config/mosaic/bin/mosaic-mcp-server",
      "args": [
        "serve",
        "--stdio"
      ],
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

## Available Tools by Server

### Context7 Server
- `mcp__context7__resolve-library-id` - Resolve package names to Context7 library IDs
- `mcp__context7__get-library-docs` - Fetch up-to-date library documentation

### Plane Server (Official)
- `mcp__plane__get_user` - Get user information
- `mcp__plane__get_projects` - List projects
- `mcp__plane__list_states` - List issue states
- `mcp__plane__get_issue_using_readable_identifier` - Get specific issues
- `mcp__plane__list_labels` - List issue labels
- `mcp__plane__list_issue_types` - List issue types
- `mcp__plane__list_modules` - List project modules
- `mcp__plane__create_module` - Create new modules
- `mcp__plane__create_label` - Create new labels
- `mcp__plane__create_state` - Create new states
- `mcp__plane__create_issue` - Create new issues
- `mcp__plane__add_module_issues` - Add issues to modules
- `mcp__plane__list_module_issues` - List module issues
- `mcp__plane__update_issue` - Update existing issues
- `mcp__plane__get_issue_comments` - Get issue comments
- `mcp__plane__add_issue_comment` - Add issue comments

### Sequential Thinking Server
- `sequential-thinking` - Advanced reasoning and planning tool for complex problem-solving

### Mosaic Consolidated Server
- **Task Management**: `mosaic_task_create`, `mosaic_task_assign`, `mosaic_task_status`, etc.
- **Project Management**: `mosaic_project_create`, `mosaic_project_list`, `mosaic_project_switch`, etc.
- **Agent Coordination**: `mosaic_agent_deploy`, `mosaic_agent_status`, `mosaic_agent_coordinate`, etc.
- **Workflow Management**: `mosaic_workflow_create`, `mosaic_workflow_execute`, `mosaic_workflow_monitor`, etc.

## Benefits of Unified Configuration

✅ **Consistent Tool Access** - All projects have access to the same comprehensive toolset  
✅ **Official Integration** - Uses official Plane and Sequential Thinking servers  
✅ **No Reinvention** - Leverages existing, maintained MCP servers  
✅ **Simplified Management** - Single configuration to manage  
✅ **Better Performance** - Official servers are optimized and maintained  

## Setup Requirements

### Plane Configuration
To use Plane tools, you need:
1. **Plane API Key** - Get from your Plane workspace settings
2. **Workspace Slug** - Your Plane workspace identifier
3. **Host URL** - Use `https://app.plane.so` for cloud or your self-hosted URL

Update the environment variables in the configuration:
```json
"env": {
  "PLANE_API_KEY": "your-actual-api-key",
  "PLANE_API_HOST_URL": "https://app.plane.so", 
  "PLANE_WORKSPACE_SLUG": "your-workspace-slug"
}
```

### Mosaic Server Configuration
The mosaic server uses the central installation with professional startup script:
- **Startup Script**: `/home/jwoltje/.config/mosaic/bin/mosaic-mcp-server` (recommended)
- **Direct Binary**: `/home/jwoltje/.config/mosaic/mcp-server/dist/main.js` (fallback)
- **Config**: `/home/jwoltje/.config/mosaic/config.json`
- **Database**: `/home/jwoltje/.config/mosaic/data/mcp.db`

#### Benefits of Using Central Bin File
- ✅ **Better Error Handling** - Proper EPIPE and SIGPIPE signal management
- ✅ **Environment Setup** - Automatic path and configuration management  
- ✅ **Process Isolation** - Improved process spawning and management
- ✅ **Startup Logging** - Clear initialization messages and diagnostics
- ✅ **Professional Standards** - Follows Unix/Linux executable conventions

## Troubleshooting

### Server Not Starting
1. **Check if npx can download packages**:
   ```bash
   npx -y @makeplane/plane-mcp-server --help
   ```

2. **Verify mosaic server**:
   ```bash
   node /home/jwoltje/.config/mosaic/mcp-server/dist/main.js --help
   ```

### Missing Tools
1. **Restart Claude Code** after configuration changes
2. **Check server status**: `/mcp list` should show all servers
3. **Verify credentials** for Plane integration

### Performance Issues
- Sequential thinking and Plane servers use `npx` which downloads on first use
- Subsequent runs are faster due to npm caching
- Mosaic server runs from local installation for best performance

## Migration from Previous Setup

If you previously had:
- Multiple scattered MCP configurations
- Project-specific MCP servers
- Custom Plane implementations

The unified configuration automatically replaces all of these with:
- Single global configuration
- Official, maintained servers
- Consistent tool access across all projects

## Future Enhancements

1. **Tool Namespace Unification**: Potentially prefix all tools with consistent naming
2. **Central Authentication**: Manage API keys centrally
3. **Performance Optimization**: Cache frequently used servers locally
4. **Custom Tool Extensions**: Add project-specific tools while maintaining the unified base

This unified approach provides the best of both worlds: comprehensive tool access and simplified management.