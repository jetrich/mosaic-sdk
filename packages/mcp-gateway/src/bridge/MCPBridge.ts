import { Server as MCPServer } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface MCPBackend {
  name: string;
  command: string[];
  args?: string[];
  env?: Record<string, string>;
}

export class MCPBridge extends EventEmitter {
  private backends = new Map<string, MCPBackendConnection>();
  
  constructor(private config: {
    backends: MCPBackend[];
  }) {
    super();
  }
  
  /**
   * Connect to all configured MCP backends
   */
  async connect(): Promise<void> {
    console.log(`Connecting to ${this.config.backends.length} MCP backends...`);
    
    const connections = this.config.backends.map(backend => 
      this.connectToBackend(backend)
    );
    
    const results = await Promise.allSettled(connections);
    
    let successCount = 0;
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successCount++;
      } else {
        console.error(`Failed to connect to ${this.config.backends[index].name}:`, result.reason);
      }
    });
    
    console.log(`Connected to ${successCount}/${this.config.backends.length} backends`);
    
    if (successCount === 0) {
      throw new Error('Failed to connect to any MCP backend');
    }
  }
  
  /**
   * Connect to a single MCP backend
   */
  private async connectToBackend(backend: MCPBackend): Promise<void> {
    console.log(`Connecting to backend: ${backend.name}`);
    
    try {
      // Spawn the backend process
      const [command, ...args] = [...backend.command, ...(backend.args || [])];
      const childProcess = spawn(command, args, {
        env: { ...process.env, ...backend.env },
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      // Create stdio transport - it expects readable/writable streams
      const transport = new StdioServerTransport(
        childProcess.stdout,  // readable
        childProcess.stdin    // writable
      );
      
      // Create MCP server instance
      const server = new MCPServer({
        name: backend.name,
        version: '1.0.0'
      }, {
        capabilities: {}
      });
      
      // Connect via transport
      await server.connect(transport);
      
      // Store connection
      const connection: MCPBackendConnection = {
        backend,
        process: childProcess,
        transport,
        server,
        connected: true
      };
      
      this.backends.set(backend.name, connection);
      
      // Handle process events
      childProcess.on('error', (error) => {
        console.error(`Backend ${backend.name} process error:`, error);
        connection.connected = false;
        this.emit('backendError', backend.name, error);
      });
      
      childProcess.on('exit', (code, signal) => {
        console.log(`Backend ${backend.name} exited with code ${code}, signal ${signal}`);
        connection.connected = false;
        this.backends.delete(backend.name);
        this.emit('backendExit', backend.name, code, signal);
      });
      
      // Log stderr for debugging
      childProcess.stderr.on('data', (data) => {
        console.error(`Backend ${backend.name} stderr:`, data.toString());
      });
      
      console.log(`Successfully connected to backend: ${backend.name}`);
      this.emit('backendConnected', backend.name);
      
    } catch (error) {
      throw new Error(`Failed to connect to ${backend.name}: ${error}`);
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
        const response = await this.sendRequest(name, 'tools/list', {});
        if (response?.tools) {
          // Prefix tools with backend name to avoid conflicts
          const prefixedTools = response.tools.map((tool: any) => ({
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
   * Execute a tool on the appropriate backend
   */
  async executeTool(toolName: string, args: any): Promise<any> {
    // Extract backend name from tool name
    const parts = toolName.split('_');
    const backendName = parts[0];
    const actualToolName = parts.slice(1).join('_');
    
    const connection = this.backends.get(backendName);
    if (!connection || !connection.connected) {
      throw new Error(`Backend not available: ${backendName}`);
    }
    
    return await this.sendRequest(backendName, 'tools/call', {
      name: actualToolName,
      arguments: args
    });
  }
  
  /**
   * Send request to specific backend
   */
  private async sendRequest(backendName: string, method: string, params: any): Promise<any> {
    const connection = this.backends.get(backendName);
    if (!connection || !connection.connected) {
      throw new Error(`Backend not connected: ${backendName}`);
    }
    
    // Create JSON-RPC request with proper typing
    const request = {
      jsonrpc: '2.0' as const,
      id: Date.now(),
      method,
      params
    };
    
    // Send via transport - cast to any to handle SDK typing issues
    await connection.transport.send(request as any);
    
    // Wait for response (simplified - real implementation would handle async properly)
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 30000);
      
      connection.transport.onmessage = (message: any) => {
        if (message.id === request.id) {
          clearTimeout(timeout);
          if (message.error) {
            reject(new Error(message.error.message));
          } else {
            resolve(message.result);
          }
        }
      };
    });
  }
  
  /**
   * Get connection status
   */
  getStatus(): { name: string; connected: boolean }[] {
    return Array.from(this.backends.entries()).map(([name, connection]) => ({
      name,
      connected: connection.connected
    }));
  }
  
  /**
   * Disconnect from all backends
   */
  async disconnect(): Promise<void> {
    console.log('Disconnecting from all MCP backends...');
    
    for (const [name, connection] of this.backends) {
      try {
        if (connection.connected) {
          await connection.server.close();
          connection.process.kill('SIGTERM');
        }
      } catch (error) {
        console.error(`Error disconnecting from ${name}:`, error);
      }
    }
    
    this.backends.clear();
  }
}

interface MCPBackendConnection {
  backend: MCPBackend;
  process: ChildProcess;
  transport: StdioServerTransport;
  server: MCPServer;
  connected: boolean;
}