import { EventEmitter } from 'events';
import { Server, createServer } from 'net';
import { v4 as uuidv4 } from 'uuid';

interface MCPMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

interface RegisteredAgent {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  registeredAt: Date;
}

export class MockMCPServer extends EventEmitter {
  private server: Server | null = null;
  private port: number;
  private registeredAgents: Map<string, RegisteredAgent> = new Map();
  private messageHistory: MCPMessage[] = [];
  private responseDelay: number = 0;
  private shouldFail: boolean = false;
  private failureRate: number = 0;

  constructor(port: number = 3457) {
    super();
    this.port = port;
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = createServer((socket) => {
        let buffer = '';

        socket.on('data', (data) => {
          buffer += data.toString();
          
          // Process complete messages
          const messages = buffer.split('\n').filter(line => line.trim());
          messages.forEach(async (messageStr) => {
            try {
              const message: MCPMessage = JSON.parse(messageStr);
              this.messageHistory.push(message);
              
              // Simulate network delay
              if (this.responseDelay > 0) {
                await new Promise(resolve => setTimeout(resolve, this.responseDelay));
              }

              // Simulate random failures
              if (this.shouldFail || (this.failureRate > 0 && Math.random() < this.failureRate)) {
                const errorResponse: MCPMessage = {
                  jsonrpc: '2.0',
                  id: message.id,
                  error: {
                    code: -32603,
                    message: 'Internal error',
                    data: 'Simulated failure for testing'
                  }
                };
                socket.write(JSON.stringify(errorResponse) + '\n');
                return;
              }

              // Handle different method calls
              const response = await this.handleMessage(message);
              if (response) {
                socket.write(JSON.stringify(response) + '\n');
              }
            } catch (error) {
              console.error('Error processing message:', error);
            }
          });
          
          // Clear processed messages from buffer
          buffer = '';
        });

        socket.on('error', (error) => {
          this.emit('socket-error', error);
        });

        socket.on('close', () => {
          this.emit('socket-close');
        });
      });

      this.server.listen(this.port, () => {
        this.emit('server-started', this.port);
        resolve();
      });

      this.server.on('error', (error) => {
        reject(error);
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.server = null;
          this.emit('server-stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private async handleMessage(message: MCPMessage): Promise<MCPMessage | null> {
    if (!message.method) {
      return null;
    }

    switch (message.method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            protocolVersion: '1.0',
            capabilities: {
              tools: true,
              resources: true,
              agents: true
            },
            serverInfo: {
              name: 'mock-mcp-server',
              version: '1.0.0'
            }
          }
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            tools: this.getMockTools()
          }
        };

      case 'tools/call':
        return this.handleToolCall(message);

      case 'agent/register':
        return this.handleAgentRegistration(message);

      case 'agent/message':
        return this.handleAgentMessage(message);

      case 'ping':
        return {
          jsonrpc: '2.0',
          id: message.id,
          result: { pong: true, timestamp: new Date().toISOString() }
        };

      default:
        return {
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32601,
            message: 'Method not found'
          }
        };
    }
  }

  private getMockTools() {
    return [
      {
        name: 'tony_project_list',
        description: 'List all Tony projects',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'tony_project_create',
        description: 'Create a new Tony project',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' }
          },
          required: ['name']
        }
      },
      {
        name: 'tony_agent_spawn',
        description: 'Spawn a new agent',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            role: { type: 'string' },
            task: { type: 'string' }
          },
          required: ['name', 'role', 'task']
        }
      }
    ];
  }

  private handleToolCall(message: MCPMessage): MCPMessage {
    const { toolName, arguments: args } = message.params || {};

    switch (toolName) {
      case 'tony_project_list':
        return {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify([
                  { id: '1', name: 'test-project-1', status: 'active' },
                  { id: '2', name: 'test-project-2', status: 'completed' }
                ])
              }
            ]
          }
        };

      case 'tony_project_create':
        return {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  id: uuidv4(),
                  name: args.name,
                  description: args.description || '',
                  created: new Date().toISOString()
                })
              }
            ]
          }
        };

      case 'tony_agent_spawn':
        const agentId = uuidv4();
        this.emit('agent-spawned', { id: agentId, ...args });
        return {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  agentId,
                  status: 'spawned',
                  ...args
                })
              }
            ]
          }
        };

      default:
        return {
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32602,
            message: 'Unknown tool'
          }
        };
    }
  }

  private handleAgentRegistration(message: MCPMessage): MCPMessage {
    const { agentId, name, role, capabilities } = message.params || {};
    
    const agent: RegisteredAgent = {
      id: agentId || uuidv4(),
      name,
      role,
      capabilities: capabilities || [],
      registeredAt: new Date()
    };

    this.registeredAgents.set(agent.id, agent);
    this.emit('agent-registered', agent);

    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        agentId: agent.id,
        status: 'registered'
      }
    };
  }

  private handleAgentMessage(message: MCPMessage): MCPMessage {
    const { from, to, content } = message.params || {};
    
    if (!this.registeredAgents.has(from)) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32602,
          message: 'Sender agent not registered'
        }
      };
    }

    if (to && !this.registeredAgents.has(to)) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32602,
          message: 'Recipient agent not registered'
        }
      };
    }

    this.emit('agent-message', { from, to, content, timestamp: new Date() });

    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        status: 'delivered',
        timestamp: new Date().toISOString()
      }
    };
  }

  // Test control methods
  setResponseDelay(ms: number): void {
    this.responseDelay = ms;
  }

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  setFailureRate(rate: number): void {
    this.failureRate = Math.max(0, Math.min(1, rate));
  }

  getRegisteredAgents(): RegisteredAgent[] {
    return Array.from(this.registeredAgents.values());
  }

  getMessageHistory(): MCPMessage[] {
    return [...this.messageHistory];
  }

  clearHistory(): void {
    this.messageHistory = [];
    this.registeredAgents.clear();
  }
}