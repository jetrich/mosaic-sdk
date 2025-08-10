# OpenCode MCP Integration Fix

**Date**: August 3, 2025  
**Status**: ✅ Configuration Updated

## 🔧 Issues Fixed

### 1. Wrong MCP Server
- **Problem**: OpenCode was configured to use `mcp-orchestrator` which is for Claude Code
- **Solution**: Updated to use `opencode-mcp` package which is designed for OpenCode

### 2. Missing Global Config
- **Problem**: OpenCode needs configuration in `~/.config/opencode/config.json`
- **Solution**: Created proper global configuration

## 📋 Updated Configuration

### Project Config (`opencode.json`)
```json
{
  "mcp": {
    "mosaic": {
      "type": "local",
      "command": ["node", "/home/jwoltje/src/mosaic-sdk/packages/opencode-mcp/dist/index.js"],
      "environment": {
        "MOSAIC_CONFIG": "/home/jwoltje/.config/mosaic/config.json",
        "MOSAIC_DATA_DIR": "/home/jwoltje/.config/mosaic/data",
        "MOSAIC_PROJECT_ROOT": "/home/jwoltje/src/mosaic-sdk"
      }
    }
  }
}
```

### Global Config (`~/.config/opencode/config.json`)
Same configuration for global access.

## 🚀 Next Steps

1. **Restart OpenCode** if it's running
2. **Try MOSAIC-PLAN mode** again
3. **Test tools** like:
   - Ask: "What MCP tools are available?"
   - Try: "Use mosaic_project_list to show projects"

## ✅ Available Features

The OpenCode MCP integration provides:
- Task management tools
- Project coordination
- Agent orchestration
- All through the proper OpenCode MCP interface

## 📝 Notes

- The `mosaic` command is now available globally via `/usr/local/bin/mosaic`
- OpenCode uses its own MCP implementation (`opencode-mcp`)
- Claude Code uses a different implementation (`mcp-orchestrator`)
- Both point to the same underlying functionality

The integration should now work properly in OpenCode!