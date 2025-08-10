# OpenCode HTTP MCP Integration Solution

**Date**: August 3, 2025  
**Status**: ✅ Using existing mosaic-mcp HTTP server

## 🎯 Key Discovery

There's already a **mosaic-mcp HTTP server running on port 3456**! This is the Tony Framework MCP server that supports HTTP mode.

## 📊 Current Situation

### What's Running
```bash
ps aux | grep 3456
# Shows: MCP_PORT=3456 node dist/main.js (mosaic-mcp)
```

### Health Check
```bash
curl http://localhost:3456/health
# Returns: {"status": "healthy", "service": "mosaic-mcp", "version": "0.0.1-beta.1"}
```

## ⚠️ Important Limitation

The **mosaic-mcp** server provides:
- ✅ HTTP/SSE transport (what OpenCode needs)
- ✅ Basic Tony Framework tools
- ❌ **NO Sequential Thinking tools** (only 6 basic tools)

The **mcp-orchestrator** provides:
- ✅ 31 tools including Sequential Thinking
- ❌ **Only stdio transport** (not compatible with OpenCode)

## 🔧 Current Solution

OpenCode is already configured to use `http://localhost:3456` which connects to the running mosaic-mcp server. This provides basic functionality but **without Sequential Thinking integration**.

## 🚀 Options for Sequential Thinking

### Option 1: Extend mosaic-mcp
Add Sequential Thinking tools to the mosaic-mcp server that already supports HTTP.

### Option 2: Add HTTP to orchestrator
Implement HTTP/SSE transport in mcp-orchestrator (significant work).

### Option 3: Use Claude CLI
For Sequential Thinking tasks, use Claude CLI which supports stdio:
```bash
claude "Use mosaic_task_decompose to break down 'Build a chat app'"
```

### Option 4: HTTP Proxy (Complex)
Create a robust HTTP-to-stdio proxy (more complex than initial attempt).

## 📝 Recommendation

For now, use:
- **OpenCode** with mosaic-mcp for basic task management (HTTP)
- **Claude CLI** with mcp-orchestrator for Sequential Thinking (stdio)

This provides the best of both worlds until a unified solution is implemented.

## 🎉 Summary

The HTTP connection error in OpenCode should be resolved since mosaic-mcp is already running on port 3456. However, Sequential Thinking tools are not available through this server, limiting token reduction capabilities in OpenCode.