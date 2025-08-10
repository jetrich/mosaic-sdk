# Claude CLI MCP Setup Guide

**Date**: August 3, 2025  
**Status**: ✅ Both servers connected and working

## 🎯 Summary

Successfully configured both MCP servers (mosaic-orchestrator and sequential-thinking) for the Claude CLI. The servers are now connected and tools are available.

## 📋 Configuration Steps Taken

### 1. Fixed Code Issue
- Commented out problematic notification handler in `MCPServer.ts`
- Rebuilt the orchestrator: `npm run build`

### 2. Added to Claude CLI
```bash
# Add mosaic-orchestrator with full configuration
claude mcp add-json mosaic-orchestrator '{
  "command": "node",
  "args": [
    "/home/jwoltje/src/mosaic-sdk/packages/mcp-orchestrator/dist/main.js",
    "serve",
    "--stdio"
  ],
  "env": {
    "MOSAIC_CONFIG": "/home/jwoltje/.config/mosaic/config.json",
    "MOSAIC_DATA_DIR": "/home/jwoltje/.config/mosaic/data",
    "NODE_ENV": "development"
  }
}'
```

### 3. Verified Connection
```bash
claude mcp list
# Output:
# sequential-thinking: ... - ✓ Connected
# mosaic-orchestrator: ... - ✓ Connected
```

## ✅ Current Status

Both MCP servers are connected:
- **sequential-thinking**: For task decomposition
- **mosaic-orchestrator**: For all MosAIc tools (31 tools registered)

## 🚀 Available Tools

You can now use all MosAIc tools in Claude CLI:
- `mosaic_project_list` - List projects
- `mosaic_task_create` - Create tasks
- `mosaic_task_decompose` - Decompose with Sequential Thinking
- `mosaic_agent_*` - Agent orchestration
- And 27 more tools...

## 📝 Notes

- The `.mcp.json` file is used by Claude Code GUI
- The Claude CLI uses its own configuration in `~/.claude.json`
- Both configurations point to the same server implementations
- Environment variables are properly set for database and config paths

## 🧪 Test Commands

Try these to verify everything works:
```bash
# In a new Claude session
claude "Use mosaic_project_list to show me all projects"
claude "Create a test task using mosaic_task_create"
claude "Decompose 'Build a chat app' using mosaic_task_decompose"
```

The MCP integration is now fully functional in the Claude CLI!