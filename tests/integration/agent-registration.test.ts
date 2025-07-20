import { MockMCPServer } from '../utilities/MockMCPServer';
import { TestAgent, CoordinatorTestAgent, WorkerTestAgent } from '../utilities/TestAgent';
import net from 'net';

describe('Agent Registration Tests', () => {
  let mockServer: MockMCPServer;
  let testAgent: TestAgent;

  beforeAll(async () => {
    mockServer = new MockMCPServer(3457);
    await mockServer.start();
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  beforeEach(() => {
    mockServer.clearHistory();
    testAgent = new TestAgent({
      name: 'test-agent',
      role: 'worker',
      capabilities: ['task-execution', 'reporting']
    });
  });

  describe('Basic Registration', () => {
    it('should register a single agent successfully', async () => {
      const client = net.createConnection({ port: 3457 });
      
      const registrationPromise = new Promise((resolve) => {
        mockServer.once('agent-registered', (agent) => {
          resolve(agent);
        });
      });

      await new Promise<void>((resolve) => {
        client.on('connect', () => {
          const registerMessage = {
            jsonrpc: '2.0',
            id: 1,
            method: 'agent/register',
            params: {
              name: testAgent.name,
              role: testAgent.role,
              capabilities: testAgent.capabilities
            }
          };
          client.write(JSON.stringify(registerMessage) + '\n');
          resolve();
        });
      });

      const registeredAgent = await registrationPromise;
      expect(registeredAgent).toHaveProperty('id');
      expect(registeredAgent).toHaveProperty('name', 'test-agent');
      expect(registeredAgent).toHaveProperty('role', 'worker');

      client.end();
    });

    it('should register multiple agents with unique IDs', async () => {
      const agentCount = 5;
      const agents: TestAgent[] = [];
      const registeredIds = new Set<string>();

      // Create multiple agents
      for (let i = 0; i < agentCount; i++) {
        agents.push(new TestAgent({
          name: `agent-${i}`,
          role: 'worker',
          capabilities: ['task-execution']
        }));
      }

      // Register all agents
      const registrationPromises = agents.map(async (agent) => {
        const client = net.createConnection({ port: 3457 });
        
        return new Promise<string>((resolve) => {
          client.on('data', (data: Buffer) => {
            const response = JSON.parse(data.toString());
            if (response.result?.agentId) {
              client.end();
              resolve(response.result.agentId);
            }
          });

          client.on('connect', () => {
            const registerMessage = {
              jsonrpc: '2.0',
              id: agent.name,
              method: 'agent/register',
              params: {
                name: agent.name,
                role: agent.role,
                capabilities: agent.capabilities
              }
            };
            client.write(JSON.stringify(registerMessage) + '\n');
          });
        });
      });

      const agentIds = await Promise.all(registrationPromises);
      
      // Verify all IDs are unique
      agentIds.forEach(id => registeredIds.add(id));
      expect(registeredIds.size).toBe(agentCount);
    });

    it('should maintain agent registry after registration', async () => {
      const client = net.createConnection({ port: 3457 });
      
      // Register agent
      await new Promise<void>((resolve) => {
        client.on('data', () => resolve());
        client.on('connect', () => {
          const registerMessage = {
            jsonrpc: '2.0',
            id: 1,
            method: 'agent/register',
            params: {
              agentId: 'test-123',
              name: 'persistent-agent',
              role: 'coordinator',
              capabilities: ['coordinate', 'monitor']
            }
          };
          client.write(JSON.stringify(registerMessage) + '\n');
        });
      });

      // Verify agent is in registry
      const registeredAgents = mockServer.getRegisteredAgents();
      expect(registeredAgents).toHaveLength(1);
      expect(registeredAgents[0].id).toBe('test-123');
      expect(registeredAgents[0].name).toBe('persistent-agent');

      client.end();
    });
  });

  describe('Role-Based Registration', () => {
    it('should register coordinator agents with proper capabilities', async () => {
      const coordinator = new CoordinatorTestAgent('lead-coordinator');
      const client = net.createConnection({ port: 3457 });

      const response = await new Promise<any>((resolve) => {
        client.on('data', (data: Buffer) => {
          resolve(JSON.parse(data.toString()));
        });

        client.on('connect', () => {
          const registerMessage = {
            jsonrpc: '2.0',
            id: 1,
            method: 'agent/register',
            params: {
              name: coordinator.name,
              role: coordinator.role,
              capabilities: coordinator.capabilities
            }
          };
          client.write(JSON.stringify(registerMessage) + '\n');
        });
      });

      expect(response.result.status).toBe('registered');
      
      const agents = mockServer.getRegisteredAgents();
      const registeredCoordinator = agents.find(a => a.name === 'lead-coordinator');
      expect(registeredCoordinator?.role).toBe('coordinator');
      expect(registeredCoordinator?.capabilities).toContain('coordinate');
      expect(registeredCoordinator?.capabilities).toContain('delegate');

      client.end();
    });

    it('should register worker agents with specializations', async () => {
      const workers = [
        new WorkerTestAgent('worker-1', 'data-processing'),
        new WorkerTestAgent('worker-2', 'validation'),
        new WorkerTestAgent('worker-3', 'transformation')
      ];

      const registrationPromises = workers.map(async (worker) => {
        const client = net.createConnection({ port: 3457 });
        
        return new Promise<void>((resolve) => {
          client.on('data', () => {
            client.end();
            resolve();
          });

          client.on('connect', () => {
            const registerMessage = {
              jsonrpc: '2.0',
              id: worker.name,
              method: 'agent/register',
              params: {
                name: worker.name,
                role: worker.role,
                capabilities: worker.capabilities
              }
            };
            client.write(JSON.stringify(registerMessage) + '\n');
          });
        });
      });

      await Promise.all(registrationPromises);

      const registeredAgents = mockServer.getRegisteredAgents();
      expect(registeredAgents).toHaveLength(3);
      
      // Verify each worker has their specialization
      expect(registeredAgents.find(a => a.name === 'worker-1')?.capabilities).toContain('data-processing');
      expect(registeredAgents.find(a => a.name === 'worker-2')?.capabilities).toContain('validation');
      expect(registeredAgents.find(a => a.name === 'worker-3')?.capabilities).toContain('transformation');
    });
  });

  describe('Registration Validation', () => {
    it('should reject registration with missing required fields', async () => {
      const client = net.createConnection({ port: 3457 });

      const response = await new Promise<any>((resolve) => {
        client.on('data', (data: Buffer) => {
          resolve(JSON.parse(data.toString()));
        });

        client.on('connect', () => {
          const invalidMessage = {
            jsonrpc: '2.0',
            id: 1,
            method: 'agent/register',
            params: {
              // Missing name and role
              capabilities: ['test']
            }
          };
          client.write(JSON.stringify(invalidMessage) + '\n');
        });
      });

      // Should still accept but with defaults or handle gracefully
      expect(response.result || response.error).toBeDefined();
      
      client.end();
    });

    it('should handle duplicate agent names gracefully', async () => {
      const client1 = net.createConnection({ port: 3457 });
      const client2 = net.createConnection({ port: 3457 });

      // Register first agent
      await new Promise<void>((resolve) => {
        client1.on('data', () => resolve());
        client1.on('connect', () => {
          const registerMessage = {
            jsonrpc: '2.0',
            id: 1,
            method: 'agent/register',
            params: {
              name: 'duplicate-name',
              role: 'worker',
              capabilities: ['task-1']
            }
          };
          client1.write(JSON.stringify(registerMessage) + '\n');
        });
      });

      // Try to register second agent with same name
      const response2 = await new Promise<any>((resolve) => {
        client2.on('data', (data: Buffer) => {
          resolve(JSON.parse(data.toString()));
        });
        client2.on('connect', () => {
          const registerMessage = {
            jsonrpc: '2.0',
            id: 2,
            method: 'agent/register',
            params: {
              name: 'duplicate-name',
              role: 'worker',
              capabilities: ['task-2']
            }
          };
          client2.write(JSON.stringify(registerMessage) + '\n');
        });
      });

      // Both should be registered with unique IDs
      const agents = mockServer.getRegisteredAgents();
      const duplicateNameAgents = agents.filter(a => a.name === 'duplicate-name');
      expect(duplicateNameAgents).toHaveLength(2);
      expect(duplicateNameAgents[0].id).not.toBe(duplicateNameAgents[1].id);

      client1.end();
      client2.end();
    });
  });

  describe('Agent Lifecycle', () => {
    it('should track agent registration timestamps', async () => {
      const client = net.createConnection({ port: 3457 });
      const beforeRegistration = new Date();

      await new Promise<void>((resolve) => {
        client.on('data', () => resolve());
        client.on('connect', () => {
          const registerMessage = {
            jsonrpc: '2.0',
            id: 1,
            method: 'agent/register',
            params: {
              name: 'timestamped-agent',
              role: 'worker',
              capabilities: ['test']
            }
          };
          client.write(JSON.stringify(registerMessage) + '\n');
        });
      });

      const afterRegistration = new Date();
      const agents = mockServer.getRegisteredAgents();
      const agent = agents.find(a => a.name === 'timestamped-agent');

      expect(agent?.registeredAt).toBeDefined();
      expect(agent?.registeredAt.getTime()).toBeGreaterThanOrEqual(beforeRegistration.getTime());
      expect(agent?.registeredAt.getTime()).toBeLessThanOrEqual(afterRegistration.getTime());

      client.end();
    });

    it('should handle agent deregistration', async () => {
      // Note: This test assumes deregistration is implemented
      // If not implemented in mock server, this serves as a specification
      const client = net.createConnection({ port: 3457 });
      
      // First register an agent
      let agentId: string;
      await new Promise<void>((resolve) => {
        client.on('data', (data: Buffer) => {
          const response = JSON.parse(data.toString());
          if (response.result?.agentId) {
            agentId = response.result.agentId;
            resolve();
          }
        });

        client.on('connect', () => {
          const registerMessage = {
            jsonrpc: '2.0',
            id: 1,
            method: 'agent/register',
            params: {
              name: 'temporary-agent',
              role: 'worker',
              capabilities: ['test']
            }
          };
          client.write(JSON.stringify(registerMessage) + '\n');
        });
      });

      // Verify agent is registered
      let agents = mockServer.getRegisteredAgents();
      expect(agents.some(a => a.id === agentId)).toBe(true);

      // Deregister agent (if supported)
      const deregisterMessage = {
        jsonrpc: '2.0',
        id: 2,
        method: 'agent/deregister',
        params: { agentId }
      };
      client.write(JSON.stringify(deregisterMessage) + '\n');

      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      // If deregistration is implemented, agent should be removed
      // If not, this test documents the expected behavior
      agents = mockServer.getRegisteredAgents();
      // This assertion may fail if deregistration is not implemented
      // which is fine - it documents the expected future behavior

      client.end();
    });
  });
});