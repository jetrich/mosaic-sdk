# MCP Gateway Specification

**Version**: 0.0.2  
**Status**: Technical Specification  
**Date**: August 3, 2025  

## Overview

The MCP Gateway is the universal connection layer that ensures all AI clients (Claude, OpenCode, future tools) can communicate with MosAIc's MCP servers regardless of their transport protocol preferences or implementation quirks.

## Problem Statement

Current issues preventing universal MCP adoption:
- OpenCode expects specific SSE implementation patterns
- Claude uses stdio transport exclusively  
- Different clients have different timeout tolerances
- Protocol version mismatches cause silent failures
- No fallback mechanism when primary transport fails

## Architecture

### Transport Layer Design

```
                    ┌─────────────────┐
                    │   MCP Client    │
                    │(Claude/OpenCode)│
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  MCP Gateway    │
                    │  Port: 3456     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐         ┌─────▼─────┐        ┌─────▼─────┐
   │   SSE   │         │    REST   │        │WebSocket  │
   │Transport│         │ Transport │        │Transport  │
   └────┬────┘         └─────┬─────┘        └─────┬─────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   MCP Servers   │
                    │ (31 tools)      │
                    └─────────────────┘
```

### Transport Specifications

#### 1. SSE Transport (Primary)
```typescript
interface SSETransport {
  endpoint: '/mcp';
  headers: {
    'Accept': 'text/event-stream';
    'Cache-Control': 'no-cache';
    'Connection': 'keep-alive';
  };
  
  // Message format
  events: {
    connection: 'event: connected\ndata: {"sessionId": "uuid"}\n\n';
    message: 'event: message\ndata: {json-rpc}\n\n';
    error: 'event: error\ndata: {"error": "message"}\n\n';
    ping: 'event: ping\ndata: {}\n\n';  // Every 30s
  };
  
  // Session management
  session: {
    post_endpoint: '/mcp/:sessionId';
    timeout: 1800000;  // 30 minutes
    cleanup: 'automatic';
  };
}
```

#### 2. REST Transport (Fallback)
```typescript
interface RESTTransport {
  endpoint: '/api/v1';
  
  // Long-polling for real-time
  polling: {
    endpoint: '/api/v1/messages';
    interval: 1000;  // 1 second
    timeout: 30000;  // 30 second long-poll
  };
  
  // Request/Response pattern
  methods: {
    'tools/list': 'GET /api/v1/tools';
    'execute': 'POST /api/v1/execute';
    'session': 'POST /api/v1/session';
  };
  
  // Batch operations
  batch: {
    endpoint: '/api/v1/batch';
    max_operations: 10;
    max_size: '1MB';
  };
}
```

#### 3. WebSocket Transport (Alternative)
```typescript
interface WebSocketTransport {
  endpoint: '/ws';
  protocols: ['mcp-v1'];
  
  // Message frames
  messages: {
    type: 'text';  // JSON-RPC over text frames
    compression: true;
    max_size: '10MB';
  };
  
  // Connection management
  heartbeat: {
    interval: 30000;
    timeout: 60000;
  };
}
```

### Auto-Detection Logic

```typescript
class TransportDetector {
  static async detectBestTransport(request: Request): Promise<TransportType> {
    const userAgent = request.headers['user-agent'] || '';
    const accept = request.headers['accept'] || '';
    
    // OpenCode detection
    if (userAgent.includes('Bun/')) {
      // OpenCode uses Bun runtime
      if (accept.includes('text/event-stream')) {
        return 'sse-opencode';  // Special SSE handling
      }
      return 'rest';  // Fallback for OpenCode
    }
    
    // Claude detection
    if (userAgent.includes('Claude') || !userAgent) {
      return 'stdio';  // Claude uses stdio
    }
    
    // Feature detection
    if (accept.includes('text/event-stream')) {
      return 'sse';
    }
    
    if (request.headers['upgrade'] === 'websocket') {
      return 'websocket';
    }
    
    // Default fallback
    return 'rest';
  }
}
```

### Protocol Adaptation

#### OpenCode SSE Compatibility
```typescript
// OpenCode expects specific SSE format
class OpenCodeSSEAdapter {
  formatConnection(sessionId: string): string {
    // OpenCode expects endpoint info immediately
    return `event: endpoint\ndata: /mcp?sessionId=${sessionId}\n\n`;
  }
  
  formatMessage(message: any): string {
    // OpenCode needs id field for message tracking
    return `id: ${Date.now()}\nevent: message\ndata: ${JSON.stringify(message)}\n\n`;
  }
  
  handleDisconnect(): void {
    // OpenCode disconnects immediately after initial connection
    // This is NORMAL - it will reconnect for actual operations
  }
}
```

#### Claude Stdio Bridge
```typescript
// Bridge stdio to HTTP for unified handling
class StdioBridge {
  static createServer(): void {
    if (process.stdin.isTTY) {
      // Not in stdio mode
      return;
    }
    
    // Pipe stdio to internal HTTP server
    const bridge = new StdioToHTTP({
      port: 3457,  // Internal port
      transport: 'stdio'
    });
    
    bridge.start();
  }
}
```

### Connection Management

#### Session Lifecycle
```typescript
interface Session {
  id: string;
  transport: TransportType;
  created: Date;
  lastActivity: Date;
  state: 'connecting' | 'active' | 'idle' | 'closing';
  metadata: {
    client: 'claude' | 'opencode' | 'unknown';
    capabilities: string[];
  };
}

class SessionManager {
  private sessions = new Map<string, Session>();
  
  // Automatic cleanup
  startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [id, session] of this.sessions) {
        const idle = now - session.lastActivity.getTime();
        if (idle > 1800000) {  // 30 minutes
          this.close(id);
        }
      }
    }, 60000);  // Check every minute
  }
}
```

### Error Handling

#### Graceful Fallbacks
```typescript
class TransportFallback {
  private fallbackChain = ['sse', 'websocket', 'rest'];
  
  async connect(client: Client): Promise<Transport> {
    let lastError: Error | null = null;
    
    for (const transportType of this.fallbackChain) {
      try {
        const transport = await this.tryTransport(transportType, client);
        console.log(`Connected via ${transportType}`);
        return transport;
      } catch (error) {
        lastError = error as Error;
        console.warn(`${transportType} failed, trying next...`);
      }
    }
    
    throw new Error(`All transports failed. Last error: ${lastError?.message}`);
  }
}
```

### Performance Optimizations

#### Connection Pooling
```typescript
class ConnectionPool {
  private pools = {
    sse: new SSEPool({ max: 100 }),
    websocket: new WSPool({ max: 50 }),
    rest: new HTTPPool({ max: 200 })
  };
  
  // Reuse connections where possible
  async getConnection(type: TransportType): Promise<Connection> {
    return this.pools[type].acquire();
  }
}
```

#### Message Batching
```typescript
class MessageBatcher {
  private queue: Message[] = [];
  private timeout: NodeJS.Timeout | null = null;
  
  add(message: Message): void {
    this.queue.push(message);
    
    if (this.queue.length >= 10) {
      this.flush();
    } else if (!this.timeout) {
      this.timeout = setTimeout(() => this.flush(), 100);
    }
  }
  
  private flush(): void {
    if (this.queue.length === 0) return;
    
    const batch = this.queue.splice(0);
    this.sendBatch(batch);
    
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}
```

## Implementation Guide

### Phase 1: Basic Gateway
```typescript
// packages/mcp-gateway/src/index.ts
export class MCPGateway {
  constructor(config: GatewayConfig) {
    this.app = express();
    this.setupTransports();
    this.setupRoutes();
    this.setupFallbacks();
  }
  
  private setupTransports(): void {
    // SSE with OpenCode compatibility
    this.app.get('/mcp', this.handleSSE.bind(this));
    
    // REST endpoints
    this.app.use('/api/v1', this.restRouter);
    
    // WebSocket upgrade
    this.server.on('upgrade', this.handleWebSocket.bind(this));
  }
}
```

### Phase 2: Client Detection
```typescript
private async handleSSE(req: Request, res: Response): Promise<void> {
  const clientType = this.detectClient(req);
  
  switch (clientType) {
    case 'opencode':
      return this.handleOpenCodeSSE(req, res);
    case 'claude':
      return this.handleClaudeSSE(req, res);
    default:
      return this.handleGenericSSE(req, res);
  }
}
```

### Phase 3: Fallback Chain
```typescript
private async handleConnection(req: Request): Promise<void> {
  const transports = this.getTransportChain(req);
  
  for (const transport of transports) {
    try {
      await this.connectVia(transport, req);
      return;
    } catch (error) {
      console.warn(`Transport ${transport} failed:`, error);
    }
  }
  
  throw new Error('No transport available');
}
```

## Testing Strategy

### Client Simulators
```typescript
// Test different client behaviors
class ClientSimulator {
  static opencode(): Client {
    return {
      headers: {
        'user-agent': 'Bun/1.2.18',
        'accept': 'text/event-stream'
      },
      behavior: 'connect-disconnect-reconnect'
    };
  }
  
  static claude(): Client {
    return {
      transport: 'stdio',
      behavior: 'persistent-connection'
    };
  }
}
```

### Protocol Tests
```bash
# Test SSE
curl -N -H "Accept: text/event-stream" http://localhost:3456/mcp

# Test REST fallback
curl -X POST http://localhost:3456/api/v1/tools/list

# Test WebSocket
wscat -c ws://localhost:3456/ws
```

## Configuration

```yaml
# Gateway configuration
gateway:
  port: 3456
  host: '0.0.0.0'
  
  transports:
    sse:
      enabled: true
      endpoint: '/mcp'
      opencode_compat: true  # Special handling
      timeout: 1800000
      
    rest:
      enabled: true  
      endpoint: '/api/v1'
      long_polling: true
      batch_size: 10
      
    websocket:
      enabled: true
      endpoint: '/ws'
      compression: true
      heartbeat: 30000
      
  fallback:
    enabled: true
    chain: [sse, websocket, rest]
    retry_count: 3
    retry_delay: 1000
    
  security:
    cors:
      origin: '*'  # Configure for production
      credentials: true
    rate_limit:
      requests_per_minute: 100
      
  monitoring:
    health_check: '/health'
    metrics: '/metrics'
    logging: 'info'
```

## Success Criteria

1. **OpenCode Connection**: Successful SSE connection without immediate disconnect
2. **Claude Compatibility**: Stdio bridge works transparently
3. **Fallback Success**: 100% connection success rate via fallbacks
4. **Performance**: <100ms connection establishment
5. **Reliability**: 99.9% uptime with automatic recovery

## Next Steps

1. Implement basic SSE transport with OpenCode fixes
2. Add REST fallback endpoints
3. Create client detection logic
4. Build connection pooling
5. Add comprehensive logging
6. Test with real OpenCode and Claude clients

---

This gateway specification ensures that MosAIc MCP works with any client, current or future, by providing multiple transport options and intelligent adaptation.