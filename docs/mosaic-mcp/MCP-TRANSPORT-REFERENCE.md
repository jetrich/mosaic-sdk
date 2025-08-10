# MCP Transport Reference

**Date**: August 3, 2025  
**Version**: 1.0  
**Prerequisites**: Read MCP-UNIFIED-ARCHITECTURE.md and MCP-SSE-IMPLEMENTATION-GUIDE.md

## Overview

This reference provides comprehensive documentation on MCP (Model Context Protocol) transport types, their implementations, configurations, and use cases. Understanding transports is critical for implementing unified MCP servers that work across different environments.

## Transport Types

### 1. stdio (Standard Input/Output)

**Description**: Uses process standard input/output streams for communication.

**Use Cases**:
- Claude CLI (`claude chat`)
- Direct process spawning
- Local development
- Testing and debugging

**Implementation**:
```typescript
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const transport = new StdioServerTransport();
await server.connect(transport);
```

**Configuration**:
```json
{
  "transport": {
    "type": "stdio"
  }
}
```

**Pros**:
- ✅ Zero network overhead
- ✅ Built-in process isolation
- ✅ Simple implementation
- ✅ No port conflicts

**Cons**:
- ❌ Limited to local processes
- ❌ No multi-client support
- ❌ Difficult to debug
- ❌ No browser support

### 2. SSE (Server-Sent Events) / Streamable HTTP

**Description**: HTTP-based transport using Server-Sent Events for server-to-client streaming and POST requests for client-to-server communication.

**Note**: Originally called "SSE" in early MCP versions, now referred to as "Streamable HTTP" in the SDK.

**Use Cases**:
- OpenCode integration
- Web browsers
- HTTP-based clients
- Multi-client scenarios

**Implementation**:
```typescript
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';

const app = express();

// SSE endpoint
app.get('/mcp', async (req, res) => {
  const transport = new SSEServerTransport('/mcp', res);
  await server.connect(transport);
});

// Message endpoint
app.post('/mcp/:sessionId', async (req, res) => {
  const transport = sessions.get(req.params.sessionId);
  await transport.handlePostMessage(req, res);
});
```

**Configuration**:
```json
{
  "transport": {
    "type": "sse",
    "port": 3456,
    "host": "localhost",
    "cors": {
      "origin": "*"
    }
  }
}
```

**Pros**:
- ✅ Browser compatible
- ✅ Multi-client support
- ✅ Standard HTTP
- ✅ Easy debugging

**Cons**:
- ❌ Network overhead
- ❌ Requires session management
- ❌ More complex implementation
- ❌ Unidirectional streaming

### 3. WebSocket (Future)

**Description**: Full-duplex bidirectional communication over a single TCP connection.

**Status**: Not yet implemented in MCP SDK, but planned.

**Use Cases**:
- Real-time collaboration
- Low-latency communication
- Bidirectional streaming
- Mobile applications

**Expected Implementation**:
```typescript
// Future API (not yet available)
import { WebSocketServerTransport } from '@modelcontextprotocol/sdk/server/websocket.js';

const wss = new WebSocketServer({ port: 3456 });
wss.on('connection', async (ws) => {
  const transport = new WebSocketServerTransport(ws);
  await server.connect(transport);
});
```

**Pros**:
- ✅ Full duplex
- ✅ Low latency
- ✅ Efficient for frequent updates
- ✅ Wide client support

**Cons**:
- ❌ More complex than HTTP
- ❌ Proxy/firewall issues
- ❌ Connection state management
- ❌ Not yet available

## MCP SDK Transport Interfaces

### Base Transport Interface

All transports implement the core `Transport` interface:

```typescript
interface Transport {
  // Send a message to the client
  send(message: JSONRPCMessage): Promise<void>;
  
  // Close the transport
  close(): Promise<void>;
  
  // Event emitters
  on(event: 'message', handler: (message: JSONRPCMessage) => void): void;
  on(event: 'close', handler: () => void): void;
  on(event: 'error', handler: (error: Error) => void): void;
}
```

### Server Transport Classes

#### StdioServerTransport

```typescript
class StdioServerTransport implements Transport {
  constructor();
  // Automatically connects to process.stdin/stdout
}
```

#### SSEServerTransport

```typescript
class SSEServerTransport implements Transport {
  readonly sessionId: string;
  
  constructor(
    endpoint: string,
    response: ServerResponse
  );
  
  // Handle POST messages
  async handlePostMessage(
    request: IncomingMessage,
    response: ServerResponse
  ): Promise<void>;
}
```

### Creating Custom Transports

To create a custom transport, implement the Transport interface:

```typescript
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

export class CustomTransport implements Transport {
  async send(message: JSONRPCMessage): Promise<void> {
    // Implementation
  }
  
  async close(): Promise<void> {
    // Cleanup
  }
  
  // Event handling
  private emit(event: string, ...args: any[]): void {
    // Emit events
  }
}
```

## Configuration Examples

### Claude Configuration (.mcp.json)

```json
{
  "mcpServers": {
    "mosaic": {
      "command": "node",
      "args": ["./dist/main.js", "serve"],
      "env": {
        "TRANSPORT": "stdio"
      }
    }
  }
}
```

### OpenCode Configuration (opencode.json)

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

### Unified Server Configuration

```yaml
# config.yaml
server:
  name: mosaic-orchestrator
  version: 1.0.0

transport:
  type: auto  # Detects based on environment
  
  # stdio config (when type is stdio or auto with no TTY)
  stdio:
    encoding: utf8
    
  # HTTP/SSE config (when type is sse/http or auto with port)
  http:
    port: 3456
    host: 0.0.0.0
    cors:
      origin: ["http://localhost:*", "https://opencode.ai"]
      credentials: true
    session:
      timeout: 1800000  # 30 minutes
      cleanup: 300000   # 5 minutes
```

### Environment-Based Configuration

```typescript
// Automatic transport selection
function getTransportConfig(): TransportConfig {
  // Check for HTTP port
  if (process.env.MCP_PORT) {
    return {
      type: 'sse',
      port: parseInt(process.env.MCP_PORT),
      host: process.env.MCP_HOST || 'localhost'
    };
  }
  
  // Check if running in TTY (terminal)
  if (process.stdout.isTTY) {
    return { type: 'stdio' };
  }
  
  // Default to stdio for Claude CLI
  return { type: 'stdio' };
}
```

## Transport Selection Guide

### Decision Matrix

| Factor | stdio | SSE/HTTP | WebSocket |
|--------|-------|----------|-----------|
| Claude CLI | ✅ Best | ❌ No | ❌ No |
| OpenCode | ❌ No | ✅ Best | 🔄 Future |
| Browser | ❌ No | ✅ Yes | ✅ Yes |
| Multi-client | ❌ No | ✅ Yes | ✅ Yes |
| Performance | ⚡ Fast | 🔄 Good | ⚡ Fast |
| Debugging | 😕 Hard | 😊 Easy | 😊 Easy |
| Implementation | 😊 Simple | 🔄 Medium | 😕 Complex |

### Use Case Recommendations

**Use stdio when**:
- Building for Claude CLI
- Single-client local tool
- Maximum performance needed
- Simple implementation preferred

**Use SSE/HTTP when**:
- Building for OpenCode
- Web browser support needed
- Multiple clients required
- HTTP infrastructure exists

**Wait for WebSocket when**:
- Real-time collaboration needed
- Bidirectional streaming required
- Building mobile apps
- Low latency critical

## Session Management (SSE/HTTP)

### Session Lifecycle

```typescript
interface Session {
  id: string;
  transport: SSEServerTransport;
  createdAt: Date;
  lastActivity: Date;
  metadata?: Record<string, any>;
}

class SessionManager {
  private sessions = new Map<string, Session>();
  
  create(transport: SSEServerTransport): Session {
    const session = {
      id: transport.sessionId,
      transport,
      createdAt: new Date(),
      lastActivity: new Date()
    };
    this.sessions.set(session.id, session);
    return session;
  }
  
  get(id: string): Session | undefined {
    const session = this.sessions.get(id);
    if (session) {
      session.lastActivity = new Date();
    }
    return session;
  }
  
  cleanup(maxAge: number = 30 * 60 * 1000): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.lastActivity.getTime() > maxAge) {
        session.transport.close();
        this.sessions.delete(id);
      }
    }
  }
}
```

### Session Security

```typescript
// Add authentication
app.use('/mcp', authenticate);

// Session tokens
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Rate limiting per session
const rateLimiter = new Map<string, number[]>();

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const window = 60000; // 1 minute
  const limit = 100; // requests per window
  
  const requests = rateLimiter.get(sessionId) || [];
  const recent = requests.filter(t => now - t < window);
  
  if (recent.length >= limit) {
    return false;
  }
  
  recent.push(now);
  rateLimiter.set(sessionId, recent);
  return true;
}
```

## Error Handling

### Transport-Specific Errors

```typescript
// stdio errors
process.stdin.on('error', (error) => {
  if (error.code === 'EPIPE') {
    // Parent process terminated
    process.exit(0);
  }
});

// SSE errors
transport.on('error', (error) => {
  if (error.code === 'ECONNRESET') {
    // Client disconnected
    sessions.delete(transport.sessionId);
  }
});

// HTTP errors
app.use((error, req, res, next) => {
  if (error.type === 'entity.too.large') {
    res.status(413).json({
      error: 'Payload too large',
      maxSize: '10MB'
    });
  }
});
```

### Reconnection Strategies

```typescript
// Client-side SSE reconnection
class MCPClient {
  private eventSource: EventSource | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  
  connect(url: string): void {
    this.eventSource = new EventSource(url);
    
    this.eventSource.onerror = () => {
      this.reconnect();
    };
  }
  
  private reconnect(): void {
    setTimeout(() => {
      this.connect(this.url);
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        this.maxReconnectDelay
      );
    }, this.reconnectDelay);
  }
}
```

## Performance Optimization

### stdio Optimization

```typescript
// Use line-delimited JSON for better streaming
class OptimizedStdioTransport extends StdioServerTransport {
  constructor() {
    super();
    // Increase buffer size
    process.stdin.setEncoding('utf8');
    process.stdout.setDefaultEncoding('utf8');
  }
}
```

### SSE Optimization

```typescript
// Compression
app.use(compression({
  filter: (req, res) => {
    // Don't compress SSE streams
    if (req.headers.accept?.includes('text/event-stream')) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Connection pooling
const connectionPool = new Set<Response>();
const maxConnections = 1000;

app.get('/mcp', (req, res) => {
  if (connectionPool.size >= maxConnections) {
    res.status(503).json({ error: 'Server at capacity' });
    return;
  }
  connectionPool.add(res);
  // ... rest of SSE setup
});
```

## Testing Transports

### Unit Testing

```typescript
// Mock stdio transport
class MockStdioTransport implements Transport {
  messages: JSONRPCMessage[] = [];
  
  async send(message: JSONRPCMessage): Promise<void> {
    this.messages.push(message);
  }
  
  async close(): Promise<void> {
    // No-op
  }
}

// Test example
describe('MCP Server', () => {
  it('should handle tool requests', async () => {
    const transport = new MockStdioTransport();
    const server = new MCPServer();
    await server.connect(transport);
    
    // Simulate request
    transport.emit('message', {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    });
    
    // Verify response
    expect(transport.messages).toHaveLength(1);
    expect(transport.messages[0].result).toBeDefined();
  });
});
```

### Integration Testing

```bash
# Test stdio transport
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  node dist/main.js serve --transport stdio

# Test HTTP transport
curl -X POST http://localhost:3456/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Test SSE connection
curl -N -H "Accept: text/event-stream" http://localhost:3456/mcp
```

## Migration Guide

### From stdio to SSE

```typescript
// Before (stdio only)
const server = new MCPServer();
const transport = new StdioServerTransport();
await server.connect(transport);

// After (unified)
const server = new MCPServer();
if (process.env.MCP_PORT) {
  const httpServer = new MCPHTTPServer(server, {
    port: parseInt(process.env.MCP_PORT)
  });
  await httpServer.start();
} else {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
```

### From Custom HTTP to SDK SSE

```typescript
// Before (custom implementation)
app.post('/api/mcp', async (req, res) => {
  const result = await processCustomProtocol(req.body);
  res.json(result);
});

// After (SDK-based)
app.get('/mcp', async (req, res) => {
  const transport = new SSEServerTransport('/mcp', res);
  await mcpServer.connect(transport);
});
```

## Best Practices

### 1. Transport Abstraction

```typescript
// Abstract transport selection
class TransportFactory {
  static create(config: TransportConfig): Transport {
    switch (config.type) {
      case 'stdio':
        return new StdioServerTransport();
      case 'sse':
      case 'http':
        throw new Error('SSE requires HTTP server setup');
      default:
        throw new Error(`Unknown transport: ${config.type}`);
    }
  }
}
```

### 2. Graceful Shutdown

```typescript
// Handle all transports
class MCPServerManager {
  async shutdown(): Promise<void> {
    // Close HTTP server
    if (this.httpServer) {
      await this.httpServer.stop();
    }
    
    // Close MCP server
    await this.mcpServer.close();
    
    // Clean up resources
    await this.cleanup();
  }
}

// Signal handling
process.on('SIGTERM', async () => {
  await serverManager.shutdown();
  process.exit(0);
});
```

### 3. Monitoring

```typescript
// Transport metrics
interface TransportMetrics {
  type: string;
  connections: number;
  messagesIn: number;
  messagesOut: number;
  errors: number;
  avgResponseTime: number;
}

// Collect metrics
class MetricsCollector {
  collect(): TransportMetrics {
    return {
      type: this.transport.type,
      connections: this.getConnectionCount(),
      messagesIn: this.counters.in,
      messagesOut: this.counters.out,
      errors: this.counters.errors,
      avgResponseTime: this.getAverageResponseTime()
    };
  }
}
```

## Conclusion

Understanding MCP transports is essential for building unified servers that work across different environments. The key principles are:

1. **Use SDK transports** - Don't reinvent the wheel
2. **Support multiple transports** - One server, many clients
3. **Handle errors gracefully** - Transports will fail
4. **Monitor performance** - Know your bottlenecks
5. **Plan for the future** - WebSocket is coming

By following this reference and implementing transports correctly, you can ensure your MCP server works seamlessly with Claude CLI, OpenCode, and future clients while maintaining excellent performance and reliability.