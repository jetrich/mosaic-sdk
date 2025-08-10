# MCP Migration Plan

**Date**: August 3, 2025  
**Version**: 1.0  
**Prerequisites**: Read all previous MCP documentation

## Executive Summary

This plan outlines the migration from two incompatible MCP servers to a unified orchestrator with multi-transport support. The migration will enable Sequential Thinking across all environments, reducing token usage by 86% while maintaining backward compatibility.

## Migration Overview

### Current State

```
┌─────────────────┐     ┌──────────────────────┐
│  mosaic-mcp     │     │  mcp-orchestrator    │
├─────────────────┤     ├──────────────────────┤
│ ✓ HTTP (3456)   │     │ ✗ HTTP               │
│ ✗ Sequential    │     │ ✓ Sequential         │
│ 6 basic tools   │     │ 31 advanced tools    │
│ OpenCode only   │     │ Claude CLI only      │
└─────────────────┘     └──────────────────────┘
```

### Target State

```
┌────────────────────────────────┐
│    Unified MCP Orchestrator    │
├────────────────────────────────┤
│ ✓ HTTP (3456) + stdio          │
│ ✓ Sequential Thinking          │
│ ✓ 31 advanced tools            │
│ ✓ All environments             │
└────────────────────────────────┘
```

## Pre-Migration Checklist

### 1. Backup Current State

```bash
# Create backup directory
mkdir -p ~/mosaic-backup-$(date +%Y%m%d)

# Backup configurations
cp ~/.config/mosaic/config.json ~/mosaic-backup-$(date +%Y%m%d)/
cp ~/.config/opencode/config.json ~/mosaic-backup-$(date +%Y%m%d)/
cp ~/src/mosaic-sdk/.mcp.json ~/mosaic-backup-$(date +%Y%m%d)/

# Backup database
cp ~/.config/mosaic/data/mosaic.db ~/mosaic-backup-$(date +%Y%m%d)/

# Document current process
ps aux | grep -E "mosaic-mcp|mcp-orchestrator" > ~/mosaic-backup-$(date +%Y%m%d)/processes.txt
```

### 2. Verify Dependencies

```bash
# Check Node.js version (18+ required)
node --version

# Verify npm packages
cd ~/src/mosaic-sdk/packages/mcp-orchestrator
npm ls express cors @modelcontextprotocol/sdk

# If missing, install:
npm install express@^4.19.2 cors@^2.8.5 @types/express@^4.17.21 @types/cors@^2.8.17
```

### 3. Build Components

```bash
# Build orchestrator
cd ~/src/mosaic-sdk/packages/mcp-orchestrator
npm run build

# Verify build
ls -la dist/
# Should see: main.js, server/, types/, utils/, etc.
```

## Phase 1: Stop Current Services

### 1.1 Stop mosaic-mcp

```bash
# Find process
ps aux | grep "MCP_PORT=3456"

# Stop gracefully
pkill -f "MCP_PORT=3456"

# Verify stopped
lsof -i:3456
# Should show no output
```

### 1.2 Document Current Usage

```bash
# Check OpenCode connectivity
curl http://localhost:3456/health

# If still running, force stop
kill -9 $(lsof -t -i:3456)
```

## Phase 2: Implement SSE Transport

### 2.1 Add HTTP Server Module

Create `packages/mcp-orchestrator/src/server/http-server.ts`:

```bash
# Use the implementation from MCP-SSE-IMPLEMENTATION-GUIDE.md
cp /path/to/implementation packages/mcp-orchestrator/src/server/http-server.ts
```

### 2.2 Update MCPServer.ts

```typescript
// Add imports
import { MCPHTTPServer } from './http-server.js';

// Add property
private httpServer?: MCPHTTPServer;

// Update start() method (see implementation guide)
// Update stop() method (see implementation guide)
```

### 2.3 Update Configuration Types

```typescript
// packages/mcp-orchestrator/src/types/index.ts
export interface TransportConfig {
  type: 'stdio' | 'http' | 'sse';
  port?: number;
  host?: string;
  cors?: CorsOptions;
  timeout?: number;
}
```

### 2.4 Build Updated Orchestrator

```bash
cd ~/src/mosaic-sdk/packages/mcp-orchestrator
npm run build

# Verify new files
ls -la dist/server/http-server.js
```

## Phase 3: Configuration Updates

### 3.1 Update Orchestrator Config

Create `~/.config/mosaic/orchestrator.config.json`:

```json
{
  "server": {
    "name": "mosaic-orchestrator",
    "version": "1.0.0"
  },
  "transport": {
    "type": "http",
    "port": 3456,
    "host": "localhost",
    "cors": {
      "origin": ["http://localhost:*", "https://opencode.ai"],
      "credentials": true
    }
  },
  "database": {
    "path": "~/.config/mosaic/data/mosaic.db"
  }
}
```

### 3.2 Update Start Script

Modify `scripts/development/mcp/start-orchestrator.sh`:

```bash
#!/bin/bash
CONFIG_PATH="$HOME/.config/mosaic/orchestrator.config.json"
LOG_FILE="$HOME/.config/mosaic/logs/orchestrator.log"

# Start with HTTP transport
node "$MOSAIC_SDK/packages/mcp-orchestrator/dist/main.js" serve \
  --config "$CONFIG_PATH" \
  --http \
  --port 3456 \
  > "$LOG_FILE" 2>&1 &

echo $! > "$HOME/.config/mosaic/orchestrator.pid"
echo "Orchestrator started with HTTP on port 3456"
```

### 3.3 Update Claude Configuration

Already correct in `.mcp.json`:

```json
{
  "mcpServers": {
    "mosaic": {
      "command": "node",
      "args": [
        "/home/jwoltje/src/mosaic-sdk/packages/mcp-orchestrator/dist/main.js",
        "serve"
      ]
    }
  }
}
```

### 3.4 Verify OpenCode Configuration

Already correct in `opencode.json`:

```json
{
  "mcp": {
    "mosaic": {
      "type": "remote",
      "url": "http://localhost:3456"
    }
  }
}
```

## Phase 4: Start Unified Service

### 4.1 Start Orchestrator

```bash
# Using the script
cd ~/src/mosaic-sdk
./scripts/development/mcp/start-orchestrator.sh

# Or manually
node packages/mcp-orchestrator/dist/main.js serve --http --port 3456
```

### 4.2 Verify Health

```bash
# Check health endpoint
curl http://localhost:3456/health

# Expected response:
{
  "status": "healthy",
  "service": "mcp-orchestrator",
  "version": "1.0.0",
  "transport": "http/sse",
  "activeSessions": 0,
  "timestamp": "2025-08-03T..."
}
```

### 4.3 Test SSE Connection

```bash
# Terminal 1: Start SSE connection
curl -N -H "Accept: text/event-stream" http://localhost:3456/mcp

# Terminal 2: List tools
SESSION_ID="<from-x-session-id-header>"
curl -X POST "http://localhost:3456/mcp/$SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

## Phase 5: Validation

### 5.1 Verify All 31 Tools

```bash
# Check tool count in response
# Should see all tools including:
# - mosaic_task_decompose
# - mosaic_task_estimate_batch
# - mosaic_task_assign_intelligent
# - mosaic_task_analyze_complexity
# And 27 others
```

### 5.2 Test with OpenCode

```bash
# Start OpenCode
opencode --mode mosaic-plan

# In OpenCode, test:
> List available MCP tools

# Should see all 31 tools
```

### 5.3 Test Sequential Thinking

```bash
# In OpenCode
> Use mosaic_task_decompose to break down "Build a REST API with authentication"

# Monitor token usage - should be ~5k instead of 37k
```

### 5.4 Test Claude CLI

```bash
# Start Claude chat
claude chat

# Test tools work via stdio
> List available MCP tools
```

## Phase 6: Cleanup

### 6.1 Remove Old Server

```bash
# Remove old mosaic-mcp start scripts
rm scripts/start-mosaic-mcp.sh

# Update any references in documentation
grep -r "mosaic-mcp" docs/
```

### 6.2 Update Documentation

- Update SEQUENTIAL-THINKING-STATUS.md
- Update MCP-DEVELOPMENT-STATUS.md
- Update README.md with new instructions

### 6.3 Clean Old Processes

```bash
# Remove old systemd services if any
sudo systemctl stop mosaic-mcp
sudo systemctl disable mosaic-mcp

# Clean old log files
rm ~/.config/mosaic/logs/mosaic-mcp*.log
```

## Rollback Plan

If issues occur during migration:

### Immediate Rollback

```bash
# Stop new orchestrator
pkill -f "mcp-orchestrator.*--http"

# Restart old mosaic-mcp
cd ~/src/mosaic-sdk
MCP_PORT=3456 node mosaic-mcp/dist/index.js &

# Restore configurations
cp ~/mosaic-backup-*/config.json ~/.config/mosaic/
cp ~/mosaic-backup-*/opencode.json ~/.config/opencode/
```

### Troubleshooting Common Issues

#### Port Already in Use

```bash
# Find what's using port 3456
lsof -i:3456
# Kill the process
kill -9 <PID>
```

#### CORS Errors

```javascript
// Update cors config in orchestrator
cors: {
  origin: true,  // Allow all origins temporarily
  credentials: true
}
```

#### Session Timeout

```javascript
// Increase timeout in config
session: {
  timeout: 3600000  // 1 hour
}
```

#### Tools Not Loading

```bash
# Check database connection
sqlite3 ~/.config/mosaic/data/mosaic.db "SELECT COUNT(*) FROM tools;"

# Rebuild if needed
cd packages/mcp-orchestrator
npm run build
```

## Post-Migration Tasks

### 1. Performance Monitoring

```bash
# Create monitoring script
cat > ~/scripts/monitor-orchestrator.sh << 'EOF'
#!/bin/bash
while true; do
  curl -s http://localhost:3456/metrics | jq .
  sleep 60
done
EOF

chmod +x ~/scripts/monitor-orchestrator.sh
```

### 2. Log Rotation

```bash
# Add to crontab
0 0 * * * find ~/.config/mosaic/logs -name "*.log" -mtime +7 -delete
```

### 3. Startup Automation

```bash
# Add to shell profile
echo 'alias mosaic-start="cd ~/src/mosaic-sdk && ./scripts/development/mcp/start-orchestrator.sh"' >> ~/.bashrc
```

### 4. Documentation Updates

Update the following files:
- `docs/mosaic-mcp/SEQUENTIAL-THINKING-STATUS.md` - Mark as fully integrated
- `docs/mosaic-mcp/MCP-DEVELOPMENT-STATUS.md` - Update architecture section
- `CLAUDE.md` - Simplify MCP instructions
- `README.md` - Update quick start section

## Success Criteria

Migration is successful when:

1. ✅ Single orchestrator serves both Claude and OpenCode
2. ✅ All 31 tools available in both environments
3. ✅ Sequential Thinking reduces tokens by 80%+
4. ✅ No regression in existing functionality
5. ✅ Health checks pass
6. ✅ No error logs in first 24 hours

## Timeline

- **Phase 1-2**: 30 minutes (Stop services, implement)
- **Phase 3-4**: 20 minutes (Configure, start)
- **Phase 5**: 30 minutes (Validation)
- **Phase 6**: 20 minutes (Cleanup)
- **Total**: ~2 hours

## Support

If issues arise:

1. Check logs: `~/.config/mosaic/logs/orchestrator.log`
2. Verify config: `~/.config/mosaic/orchestrator.config.json`
3. Test endpoints manually with curl
4. Review this migration plan
5. Rollback if necessary

## Conclusion

This migration unifies the MCP implementation, dramatically reduces token usage, and provides a consistent experience across all environments. The phased approach ensures minimal disruption while the comprehensive validation confirms success.