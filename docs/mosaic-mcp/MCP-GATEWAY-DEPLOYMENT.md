# MCP Gateway Deployment Guide

## Overview

The MCP Gateway provides a universal connection layer between AI clients (Claude, OpenCode) and the MosAIc MCP services. It handles protocol translation, session management, and intelligent fallbacks.

## Architecture

```
Claude/OpenCode → MCP Gateway (3457) → MCP Orchestrator (3456) → 31 MosAIc Tools
```

## Quick Start

### 1. Start the Orchestrator (Backend)
```bash
./scripts/development/mcp/start-orchestrator.sh
```

### 2. Start the Gateway
```bash
./scripts/development/mcp/start-gateway.sh
```

### 3. Configure OpenCode
Update `opencode.json`:
```json
{
  "mcp": {
    "mosaic": {
      "type": "remote",
      "url": "http://localhost:3457/mcp"
    }
  }
}
```

### 4. Configure Claude
Update `.claude/mcp.json`:
```json
{
  "mcpServers": {
    "mosaic": {
      "command": "node",
      "args": ["/path/to/mosaic-sdk/packages/mcp-gateway/dist/cli.js", "serve", "--stdio"]
    }
  }
}
```

## Management Scripts

### Start Gateway
```bash
./scripts/development/mcp/start-gateway.sh [--build]
```
- Starts the MCP Gateway on port 3457
- Use `--build` to rebuild before starting
- Checks orchestrator connectivity
- Creates PID file for management

### Stop Gateway
```bash
./scripts/development/mcp/stop-gateway.sh
```
- Gracefully stops the gateway
- Waits for connections to close
- Removes PID file

### Restart Gateway
```bash
./scripts/development/mcp/restart-gateway.sh [--build]
```
- Stops and starts the gateway
- Useful after configuration changes

### Check Status
```bash
./scripts/development/mcp/status-gateway.sh
```
- Shows running status
- Displays health check results
- Lists active sessions
- Shows backend connectivity

## Configuration

### Environment Variables
- `MCP_GATEWAY_PORT`: Gateway port (default: 3457)
- `MCP_ORCHESTRATOR_URL`: Backend URL (default: http://localhost:3456/mcp)

### Gateway Configuration File
Create `gateway.config.json`:
```json
{
  "port": 3457,
  "host": "0.0.0.0",
  "transports": {
    "sse": {
      "enabled": true,
      "endpoint": "/mcp",
      "opencode_compat": true,
      "timeout": 1800000
    },
    "rest": {
      "enabled": true,
      "endpoint": "/api/v1",
      "long_polling": true,
      "batch_size": 10
    }
  }
}
```

## Monitoring

### Health Check
```bash
curl http://localhost:3457/health
```

### Metrics (Prometheus Format)
```bash
curl http://localhost:3457/metrics
```

### Logs
```bash
tail -f ~/.mosaic/logs/mcp-gateway.log
```

## Testing

### Test SSE Connection
```bash
curl -N -H "Accept: text/event-stream" http://localhost:3457/mcp
```

### Test REST API
```bash
# List tools
curl http://localhost:3457/api/v1/tools

# Create session
curl -X POST http://localhost:3457/api/v1/session
```

### Test with OpenCode
```bash
opencode --config opencode.json
```

## Troubleshooting

### Gateway Won't Start
1. Check if port 3457 is already in use
2. Verify orchestrator is running on port 3456
3. Check logs: `tail -f ~/.mosaic/logs/mcp-gateway.log`

### OpenCode Connection Fails
1. Ensure gateway is running: `./scripts/development/mcp/status-gateway.sh`
2. Verify OpenCode config points to gateway URL
3. Check OpenCode version is recent (>= 0.3.100)

### No Tools Available
1. Verify orchestrator is running and healthy
2. Check gateway backend connections in status
3. Restart both services

### Session Timeout Issues
1. Gateway sessions timeout after 30 minutes by default
2. Configure longer timeout in gateway config
3. Implement keep-alive in client

## Architecture Benefits

1. **Universal Compatibility**: Works with any MCP client
2. **Protocol Translation**: SSE, REST, WebSocket support
3. **Intelligent Fallbacks**: Automatic transport selection
4. **Session Management**: Handles lifecycle and cleanup
5. **Backend Abstraction**: Single gateway for multiple backends

## Future Enhancements

1. **WebSocket Transport**: Full duplex communication
2. **Load Balancing**: Multiple backend support
3. **Authentication**: Token-based access control
4. **Rate Limiting**: Per-client quotas
5. **Caching**: Response caching for performance

---

The MCP Gateway ensures seamless integration between AI clients and MosAIc services, providing a stable and extensible connection layer for the entire ecosystem.