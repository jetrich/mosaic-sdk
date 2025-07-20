import { MockMCPServer } from '../utilities/MockMCPServer';
import net from 'net';
import { v4 as uuidv4 } from 'uuid';

describe('Request Routing Tests', () => {
  let mockServer: MockMCPServer;
  let clients: Map<string, net.Socket> = new Map();

  beforeAll(async () => {
    mockServer = new MockMCPServer(3457);
    await mockServer.start();
  });

  afterAll(async () => {
    // Close all client connections
    for (const [_, client] of clients) {
      client.end();
    }
    await mockServer.stop();
  });

  beforeEach(() => {
    mockServer.clearHistory();
  });

  describe('Tool Routing', () => {
    it('should route tool requests correctly', async () => {
      const client = net.createConnection({ port: 3457 });
      
      const toolsResponse = await new Promise<any>((resolve) => {
        client.on('data', (data: Buffer) => {
          resolve(JSON.parse(data.toString()));
        });

        client.on('connect', () => {
          const listToolsMessage = {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list',
            params: {}
          };
          client.write(JSON.stringify(listToolsMessage) + '\n');
        });
      });

      expect(toolsResponse.result.tools).toBeDefined();
      expect(Array.isArray(toolsResponse.result.tools)).toBe(true);
      expect(toolsResponse.result.tools.length).toBeGreaterThan(0);
      
      // Verify specific tools exist
      const toolNames = toolsResponse.result.tools.map((t: any) => t.name);
      expect(toolNames).toContain('tony_project_list');
      expect(toolNames).toContain('tony_project_create');
      expect(toolNames).toContain('tony_agent_spawn');

      client.end();
    });

    it('should execute tool calls and return results', async () => {
      const client = net.createConnection({ port: 3457 });

      const callResponse = await new Promise<any>((resolve) => {
        let initialized = false;
        
        client.on('data', (data: Buffer) => {
          const response = JSON.parse(data.toString());
          if (!initialized) {
            initialized = true;
            // Send tool call after initialization
            const toolCallMessage = {
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/call',
              params: {
                toolName: 'tony_project_create',
                arguments: {
                  name: 'test-project',
                  description: 'Integration test project'
                }
              }
            };
            client.write(JSON.stringify(toolCallMessage) + '\n');
          } else {
            resolve(response);
          }
        });

        client.on('connect', () => {
          // Initialize first
          const initMessage = {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {}
          };
          client.write(JSON.stringify(initMessage) + '\n');
        });
      });

      expect(callResponse.result).toBeDefined();
      expect(callResponse.result.content).toBeDefined();
      expect(callResponse.result.content[0].type).toBe('text');
      
      const projectData = JSON.parse(callResponse.result.content[0].text);
      expect(projectData.name).toBe('test-project');
      expect(projectData.description).toBe('Integration test project');
      expect(projectData.id).toBeDefined();

      client.end();
    });

    it('should handle invalid tool calls', async () => {
      const client = net.createConnection({ port: 3457 });

      const errorResponse = await new Promise<any>((resolve) => {
        client.on('data', (data: Buffer) => {
          resolve(JSON.parse(data.toString()));
        });

        client.on('connect', () => {
          const invalidToolCall = {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: {
              toolName: 'non_existent_tool',
              arguments: {}
            }
          };
          client.write(JSON.stringify(invalidToolCall) + '\n');
        });
      });

      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.code).toBe(-32602);

      client.end();
    });
  });

  describe('Agent Message Routing', () => {
    it('should route messages between registered agents', async () => {
      // Register two agents
      const agent1Id = await registerAgent('agent-1', 'sender');
      const agent2Id = await registerAgent('agent-2', 'receiver');

      const client = net.createConnection({ port: 3457 });
      
      // Set up message listener
      const messageReceived = new Promise((resolve) => {
        mockServer.once('agent-message', (message) => {
          resolve(message);
        });
      });

      // Send message from agent1 to agent2
      await new Promise<void>((resolve) => {
        client.on('connect', () => {
          const message = {
            jsonrpc: '2.0',
            id: 1,
            method: 'agent/message',
            params: {
              from: agent1Id,
              to: agent2Id,
              content: {
                type: 'task-assignment',
                task: {
                  id: uuidv4(),
                  description: 'Test task'
                }
              }
            }
          };
          client.write(JSON.stringify(message) + '\n');
          resolve();
        });
      });

      const receivedMessage = await messageReceived;
      expect(receivedMessage).toHaveProperty('from', agent1Id);
      expect(receivedMessage).toHaveProperty('to', agent2Id);
      expect(receivedMessage).toHaveProperty('content');

      client.end();
    });

    it('should broadcast messages to all agents', async () => {
      // Register multiple agents
      const agentIds = await Promise.all([
        registerAgent('broadcast-agent-1', 'worker'),
        registerAgent('broadcast-agent-2', 'worker'),
        registerAgent('broadcast-agent-3', 'worker')
      ]);

      const client = net.createConnection({ port: 3457 });
      const coordinatorId = agentIds[0];

      // Track broadcast messages
      const broadcastMessages: any[] = [];
      mockServer.on('agent-message', (message) => {
        if (!message.to) { // Broadcast message
          broadcastMessages.push(message);
        }
      });

      // Send broadcast message
      await new Promise<void>((resolve) => {
        client.on('connect', () => {
          const broadcastMessage = {
            jsonrpc: '2.0',
            id: 1,
            method: 'agent/message',
            params: {
              from: coordinatorId,
              to: null, // Broadcast
              content: {
                type: 'status-update',
                status: 'all-systems-operational'
              }
            }
          };
          client.write(JSON.stringify(broadcastMessage) + '\n');
          setTimeout(resolve, 100); // Wait for processing
        });
      });

      expect(broadcastMessages.length).toBeGreaterThan(0);
      expect(broadcastMessages[0].from).toBe(coordinatorId);
      expect(broadcastMessages[0].content.type).toBe('status-update');

      client.end();
    });

    it('should reject messages from unregistered agents', async () => {
      const client = net.createConnection({ port: 3457 });
      const fakeAgentId = uuidv4();

      const response = await new Promise<any>((resolve) => {
        client.on('data', (data: Buffer) => {
          resolve(JSON.parse(data.toString()));
        });

        client.on('connect', () => {
          const message = {
            jsonrpc: '2.0',
            id: 1,
            method: 'agent/message',
            params: {
              from: fakeAgentId,
              to: null,
              content: { test: 'message' }
            }
          };
          client.write(JSON.stringify(message) + '\n');
        });
      });

      expect(response.error).toBeDefined();
      expect(response.error.message).toContain('not registered');

      client.end();
    });
  });

  describe('Request Prioritization', () => {
    it('should handle concurrent requests from multiple agents', async () => {
      const requestCount = 10;
      const agentCount = 5;
      const responses: any[] = [];

      // Create multiple agent connections
      const agentPromises = Array.from({ length: agentCount }, async (_, agentIndex) => {
        const client = net.createConnection({ port: 3457 });
        clients.set(`agent-${agentIndex}`, client);

        return new Promise<void>((resolve) => {
          let receivedCount = 0;

          client.on('data', (data: Buffer) => {
            const messages = data.toString().split('\n').filter(m => m.trim());
            messages.forEach(msg => {
              responses.push(JSON.parse(msg));
              receivedCount++;
            });

            if (receivedCount >= requestCount) {
              resolve();
            }
          });

          client.on('connect', () => {
            // Send multiple requests from this agent
            for (let i = 0; i < requestCount; i++) {
              const message = {
                jsonrpc: '2.0',
                id: `${agentIndex}-${i}`,
                method: 'ping',
                params: { agentId: agentIndex, requestId: i }
              };
              client.write(JSON.stringify(message) + '\n');
            }
          });
        });
      });

      await Promise.all(agentPromises);

      // Verify all requests were processed
      expect(responses.length).toBe(agentCount * requestCount);
      
      // Verify response integrity
      responses.forEach(response => {
        expect(response.result).toBeDefined();
        expect(response.result.pong).toBe(true);
      });
    });

    it('should maintain request order per connection', async () => {
      const client = net.createConnection({ port: 3457 });
      const requestIds: number[] = [];
      const responseIds: number[] = [];

      await new Promise<void>((resolve) => {
        let responseCount = 0;
        const totalRequests = 20;

        client.on('data', (data: Buffer) => {
          const messages = data.toString().split('\n').filter(m => m.trim());
          messages.forEach(msg => {
            const response = JSON.parse(msg);
            responseIds.push(parseInt(response.id));
            responseCount++;

            if (responseCount >= totalRequests) {
              resolve();
            }
          });
        });

        client.on('connect', () => {
          // Send requests with sequential IDs
          for (let i = 0; i < totalRequests; i++) {
            requestIds.push(i);
            const message = {
              jsonrpc: '2.0',
              id: i,
              method: 'ping',
              params: {}
            };
            client.write(JSON.stringify(message) + '\n');
          }
        });
      });

      // Verify order is maintained
      expect(responseIds).toEqual(requestIds);

      client.end();
    });
  });

  describe('Routing Performance', () => {
    it('should route high-frequency messages efficiently', async () => {
      const messageCount = 1000;
      const startTime = Date.now();
      let processedCount = 0;

      const client = net.createConnection({ port: 3457 });

      await new Promise<void>((resolve) => {
        client.on('data', (data: Buffer) => {
          const messages = data.toString().split('\n').filter(m => m.trim());
          processedCount += messages.length;

          if (processedCount >= messageCount) {
            resolve();
          }
        });

        client.on('connect', () => {
          // Send many messages rapidly
          for (let i = 0; i < messageCount; i++) {
            const message = {
              jsonrpc: '2.0',
              id: i,
              method: 'ping',
              params: { index: i }
            };
            client.write(JSON.stringify(message) + '\n');
          }
        });
      });

      const duration = Date.now() - startTime;
      const messagesPerSecond = (messageCount / duration) * 1000;

      expect(processedCount).toBe(messageCount);
      expect(messagesPerSecond).toBeGreaterThan(100); // At least 100 msg/s

      client.end();
    });

    it('should handle routing table updates dynamically', async () => {
      const client = net.createConnection({ port: 3457 });

      // Register initial agents
      const initialAgents = await Promise.all([
        registerAgent('dynamic-1', 'worker'),
        registerAgent('dynamic-2', 'worker')
      ]);

      // Verify routing works with initial agents
      const response1 = await sendAgentMessage(client, initialAgents[0], initialAgents[1], 'test-1');
      expect(response1.result.status).toBe('delivered');

      // Register additional agents
      const newAgents = await Promise.all([
        registerAgent('dynamic-3', 'worker'),
        registerAgent('dynamic-4', 'worker')
      ]);

      // Verify routing works with new agents
      const response2 = await sendAgentMessage(client, newAgents[0], newAgents[1], 'test-2');
      expect(response2.result.status).toBe('delivered');

      // Verify cross-group routing
      const response3 = await sendAgentMessage(client, initialAgents[0], newAgents[0], 'test-3');
      expect(response3.result.status).toBe('delivered');

      client.end();
    });
  });

  // Helper functions
  async function registerAgent(name: string, role: string): Promise<string> {
    const client = net.createConnection({ port: 3457 });
    
    const agentId = await new Promise<string>((resolve) => {
      client.on('data', (data: Buffer) => {
        const response = JSON.parse(data.toString());
        if (response.result?.agentId) {
          resolve(response.result.agentId);
        }
      });

      client.on('connect', () => {
        const registerMessage = {
          jsonrpc: '2.0',
          id: name,
          method: 'agent/register',
          params: { name, role, capabilities: ['test'] }
        };
        client.write(JSON.stringify(registerMessage) + '\n');
      });
    });

    client.end();
    return agentId;
  }

  async function sendAgentMessage(client: net.Socket, from: string, to: string, content: any): Promise<any> {
    return new Promise((resolve) => {
      const messageId = uuidv4();
      
      const handler = (data: Buffer) => {
        const response = JSON.parse(data.toString());
        if (response.id === messageId) {
          client.removeListener('data', handler);
          resolve(response);
        }
      };

      client.on('data', handler);

      const message = {
        jsonrpc: '2.0',
        id: messageId,
        method: 'agent/message',
        params: { from, to, content }
      };
      client.write(JSON.stringify(message) + '\n');
    });
  }
});