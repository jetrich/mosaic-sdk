import { EventEmitter } from 'events';
import { Message } from '../types/index.js';

export interface HTTPBackend {
  name: string;
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export class HTTPBridge extends EventEmitter {
  private backends = new Map<string, HTTPBackendConnection>();
  
  constructor(private config: {
    backends: HTTPBackend[];
  }) {
    super();
  }
  
  /**
   * Connect to all HTTP MCP backends
   */
  async connect(): Promise<void> {
    console.log(`Connecting to ${this.config.backends.length} HTTP backends...`);
    
    for (const backend of this.config.backends) {
      try {
        await this.connectToBackend(backend);
      } catch (error) {
        console.error(`Failed to connect to ${backend.name}:`, error);
      }
    }
    
    const connectedCount = Array.from(this.backends.values()).filter(c => c.connected).length;
    console.log(`Connected to ${connectedCount}/${this.config.backends.length} HTTP backends`);
    
    if (connectedCount === 0) {
      throw new Error('Failed to connect to any HTTP backend');
    }
  }
  
  /**
   * Connect to a single HTTP backend
   */
  private async connectToBackend(backend: HTTPBackend): Promise<void> {
    console.log(`Testing HTTP backend: ${backend.name} at ${backend.url}`);
    
    try {
      // Test connection with health check
      const healthUrl = new URL(backend.url);
      healthUrl.pathname = healthUrl.pathname.replace(/\/mcp\/?$/, '/health');
      
      const response = await fetch(healthUrl.toString(), {
        headers: backend.headers,
        signal: AbortSignal.timeout(backend.timeout || 5000)
      });
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      
      const connection: HTTPBackendConnection = {
        backend,
        connected: true,
        sessionId: null
      };
      
      this.backends.set(backend.name, connection);
      console.log(`Successfully connected to HTTP backend: ${backend.name}`);
      this.emit('backendConnected', backend.name);
      
    } catch (error) {
      throw new Error(`Failed to connect to ${backend.name}: ${error}`);
    }
  }
  
  /**
   * Establish SSE session with backend
   */
  async establishSession(backendName: string): Promise<string> {
    const connection = this.backends.get(backendName);
    if (!connection || !connection.connected) {
      throw new Error(`Backend not available: ${backendName}`);
    }
    
    try {
      const response = await fetch(connection.backend.url, {
        headers: {
          ...connection.backend.headers,
          'Accept': 'text/event-stream'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to establish session: ${response.status}`);
      }
      
      // Parse SSE response to get session ID
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }
      
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value);
        const lines = buffer.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.includes('sessionId=')) {
              const match = data.match(/sessionId=([^&\s]+)/);
              if (match) {
                connection.sessionId = match[1];
                return match[1];
              }
            }
          }
        }
      }
      
      throw new Error('No session ID received');
      
    } catch (error) {
      connection.connected = false;
      throw new Error(`Failed to establish session with ${backendName}: ${error}`);
    }
  }
  
  /**
   * Get list of available tools from all backends
   */
  async getTools(): Promise<any[]> {
    const allTools: any[] = [];
    
    for (const [name, connection] of this.backends) {
      if (!connection.connected) continue;
      
      try {
        // Get tools via HTTP endpoint
        const toolsUrl = new URL(connection.backend.url);
        toolsUrl.pathname = toolsUrl.pathname.replace(/\/mcp\/?$/, '/tools');
        
        const response = await fetch(toolsUrl.toString(), {
          headers: connection.backend.headers
        });
        
        if (response.ok) {
          const data = await response.json() as any;
          
          // Handle different response formats
          let tools = [];
          if (Array.isArray(data)) {
            tools = data;
          } else if (data.tools) {
            tools = data.tools;
          } else if (data.result?.tools) {
            tools = data.result.tools;
          }
          
          // Prefix tools with backend name
          const prefixedTools = tools.map((tool: any) => ({
            ...tool,
            name: `${name}_${tool.name}`,
            backend: name
          }));
          
          allTools.push(...prefixedTools);
        }
      } catch (error) {
        console.error(`Failed to get tools from ${name}:`, error);
      }
    }
    
    return allTools;
  }
  
  /**
   * Send message to backend
   */
  async sendMessage(backendName: string, message: Message): Promise<any> {
    const connection = this.backends.get(backendName);
    if (!connection || !connection.connected) {
      throw new Error(`Backend not available: ${backendName}`);
    }
    
    // Ensure we have a session
    if (!connection.sessionId) {
      connection.sessionId = await this.establishSession(backendName);
    }
    
    try {
      // Send message via POST
      const messageUrl = new URL(connection.backend.url);
      messageUrl.searchParams.set('sessionId', connection.sessionId);
      
      const response = await fetch(messageUrl.toString(), {
        method: 'POST',
        headers: {
          ...connection.backend.headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message),
        signal: AbortSignal.timeout(connection.backend.timeout || 30000)
      });
      
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }
      
      // For SSE backends, response is typically 202 Accepted
      if (response.status === 202) {
        return { accepted: true };
      }
      
      return await response.json();
      
    } catch (error) {
      // Mark as disconnected on error
      connection.connected = false;
      connection.sessionId = null;
      throw new Error(`Failed to send message to ${backendName}: ${error}`);
    }
  }
  
  /**
   * Execute a tool on the appropriate backend
   */
  async executeTool(toolName: string, args: any): Promise<any> {
    // Extract backend name from tool name
    const parts = toolName.split('_');
    const backendName = parts[0];
    const actualToolName = parts.slice(1).join('_');
    
    const message: Message = {
      jsonrpc: '2.0',
      id: Date.now().toString(),
      method: 'tools/call',
      params: {
        name: actualToolName,
        arguments: args
      }
    };
    
    return await this.sendMessage(backendName, message);
  }
  
  /**
   * Get connection status
   */
  getStatus(): { name: string; connected: boolean; hasSession: boolean }[] {
    return Array.from(this.backends.entries()).map(([name, connection]) => ({
      name,
      connected: connection.connected,
      hasSession: !!connection.sessionId
    }));
  }
  
  /**
   * Disconnect from all backends
   */
  async disconnect(): Promise<void> {
    console.log('Disconnecting from all HTTP backends...');
    
    // No persistent connections to close for HTTP
    this.backends.clear();
  }
}

interface HTTPBackendConnection {
  backend: HTTPBackend;
  connected: boolean;
  sessionId: string | null;
}