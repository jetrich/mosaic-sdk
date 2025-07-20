import { MockMCPServer } from '../utilities/MockMCPServer';
import net from 'net';
import { v4 as uuidv4 } from 'uuid';

describe('Error Handling Scenarios', () => {
  let mockServer: MockMCPServer;

  beforeAll(async () => {
    mockServer = new MockMCPServer(3457);
    await mockServer.start();
  });

  afterAll(async () => {
    await mockServer.stop();
  });

  beforeEach(() => {
    mockServer.clearHistory();
    mockServer.setShouldFail(false);
    mockServer.setFailureRate(0);
    mockServer.setResponseDelay(0);
  });

  describe('Network Errors', () => {
    it('should handle connection timeouts', async () => {
      // Set a long response delay
      mockServer.setResponseDelay(5000);

      const client = net.createConnection({ port: 3457 });
      client.setTimeout(1000); // 1 second timeout

      const timeoutPromise = new Promise((resolve, reject) => {
        client.on('timeout', () => {
          resolve('timeout');
        });
        client.on('data', () => {
          reject(new Error('Should not receive data'));
        });
      });

      client.on('connect', () => {
        const message = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {}
        };
        client.write(JSON.stringify(message) + '\n');
      });

      const result = await timeoutPromise;
      expect(result).toBe('timeout');

      client.destroy();
    });

    it('should handle partial message transmission', async () => {
      const client = net.createConnection({ port: 3457 });
      
      await new Promise<void>((resolve) => {
        client.on('connect', () => {
          // Send incomplete JSON
          client.write('{"jsonrpc":"2.0","id":1,');
          
          // Close connection before completing message
          setTimeout(() => {
            client.destroy();
            resolve();
          }, 100);
        });
      });

      // Server should still be running
      const testClient = net.createConnection({ port: 3457 });
      const serverAlive = await new Promise(resolve => {
        testClient.on('connect', () => {
          testClient.end();
          resolve(true);
        });
        testClient.on('error', () => resolve(false));
      });

      expect(serverAlive).toBe(true);
    });

    it('should recover from temporary network failures', async () => {
      const client = net.createConnection({ port: 3457 });
      
      // Set server to fail intermittently
      mockServer.setFailureRate(0.5); // 50% failure rate

      const attempts = 10;
      let successes = 0;
      let failures = 0;

      for (let i = 0; i < attempts; i++) {
        const response = await new Promise<any>((resolve) => {
          const messageId = `retry-${i}`;
          
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
            method: 'ping',
            params: {}
          };

          if (client.readyState === 'open') {
            client.write(JSON.stringify(message) + '\n');
          }
        });

        if (response.error) {
          failures++;
        } else {
          successes++;
        }
      }

      // Should have both successes and failures
      expect(successes).toBeGreaterThan(0);
      expect(failures).toBeGreaterThan(0);
      expect(successes + failures).toBe(attempts);

      client.end();
    });
  });

  describe('Protocol Errors', () => {
    it('should handle invalid JSON-RPC format', async () => {
      const client = net.createConnection({ port: 3457 });

      const responses = await new Promise<any[]>((resolve) => {
        const received: any[] = [];
        
        client.on('data', (data: Buffer) => {
          const messages = data.toString().split('\n').filter(m => m.trim());
          messages.forEach(msg => {
            try {
              received.push(JSON.parse(msg));
            } catch (e) {
              // Ignore parse errors
            }
          });
          
          if (received.length >= 3) {
            resolve(received);
          }
        });

        client.on('connect', () => {
          // Send various invalid formats
          const invalidMessages = [
            { id: 1 }, // Missing jsonrpc
            { jsonrpc: '2.0' }, // Missing id and method
            { jsonrpc: '1.0', id: 3, method: 'test' }, // Wrong version
            { jsonrpc: '2.0', id: 4, method: 'test' } // Valid for comparison
          ];

          invalidMessages.forEach(msg => {
            client.write(JSON.stringify(msg) + '\n');
          });
        });
      });

      // Server should handle invalid messages gracefully
      expect(responses.length).toBeGreaterThanOrEqual(1);
      
      client.end();
    });

    it('should handle method not found errors', async () => {
      const client = net.createConnection({ port: 3457 });

      const response = await new Promise<any>((resolve) => {
        client.on('data', (data: Buffer) => {
          resolve(JSON.parse(data.toString()));
        });

        client.on('connect', () => {
          const message = {
            jsonrpc: '2.0',
            id: 1,
            method: 'non_existent_method',
            params: {}
          };
          client.write(JSON.stringify(message) + '\n');
        });
      });

      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(-32601);
      expect(response.error.message).toContain('Method not found');

      client.end();
    });

    it('should handle invalid parameters', async () => {
      const client = net.createConnection({ port: 3457 });

      const response = await new Promise<any>((resolve) => {
        client.on('data', (data: Buffer) => {
          resolve(JSON.parse(data.toString()));
        });

        client.on('connect', () => {
          const message = {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: {
              // Missing required toolName
              arguments: {}
            }
          };
          client.write(JSON.stringify(message) + '\n');
        });
      });

      expect(response.error).toBeDefined();
      
      client.end();
    });
  });

  describe('Server Errors', () => {
    it('should handle server internal errors', async () => {
      // Configure server to always fail
      mockServer.setShouldFail(true);

      const client = net.createConnection({ port: 3457 });

      const response = await new Promise<any>((resolve) => {
        client.on('data', (data: Buffer) => {
          resolve(JSON.parse(data.toString()));
        });

        client.on('connect', () => {
          const message = {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list',
            params: {}
          };
          client.write(JSON.stringify(message) + '\n');
        });
      });

      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(-32603);
      expect(response.error.message).toContain('Internal error');

      client.end();
    });

    it('should maintain error history', async () => {
      const client = net.createConnection({ port: 3457 });
      
      // Send several requests that will generate errors
      const errorRequests = [
        { method: 'invalid_method' },
        { method: 'agent/message', params: { from: 'unregistered' } },
        { method: 'tools/call', params: { toolName: 'non_existent' } }
      ];

      for (let i = 0; i < errorRequests.length; i++) {
        await new Promise<void>((resolve) => {
          client.once('data', () => resolve());

          const message = {
            jsonrpc: '2.0',
            id: i,
            ...errorRequests[i]
          };
          client.write(JSON.stringify(message) + '\n');
        });
      }

      // Check message history
      const history = mockServer.getMessageHistory();
      const errorResponses = history.filter(msg => msg.error);
      
      expect(errorResponses.length).toBeGreaterThanOrEqual(errorRequests.length);

      client.end();
    });
  });

  describe('Fallback Mechanisms', () => {
    it('should activate fallback on repeated failures', async () => {
      const client = net.createConnection({ port: 3457 });
      const maxRetries = 3;
      let retryCount = 0;

      const makeRequestWithRetry = async (message: any): Promise<any> => {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const response = await new Promise<any>((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Request timeout'));
              }, 1000);

              client.once('data', (data: Buffer) => {
                clearTimeout(timeout);
                const response = JSON.parse(data.toString());
                resolve(response);
              });

              client.write(JSON.stringify(message) + '\n');
            });

            if (response.error && attempt < maxRetries) {
              retryCount++;
              // Exponential backoff
              await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
              continue;
            }

            return response;
          } catch (error) {
            if (attempt === maxRetries) {
              return { fallback: true, error: 'Max retries exceeded' };
            }
            retryCount++;
          }
        }
      };

      // Set high failure rate
      mockServer.setFailureRate(0.8);

      const message = {
        jsonrpc: '2.0',
        id: 'fallback-test',
        method: 'tools/list',
        params: {}
      };

      const result = await makeRequestWithRetry(message);
      
      // Should have either succeeded after retries or activated fallback
      expect(result.result || result.fallback).toBeDefined();
      expect(retryCount).toBeLessThanOrEqual(maxRetries);

      client.end();
    });

    it('should gracefully degrade functionality', async () => {
      const client = net.createConnection({ port: 3457 });
      
      // Simulate degraded service
      mockServer.setResponseDelay(2000); // Slow responses
      mockServer.setFailureRate(0.3); // Some failures

      const startTime = Date.now();
      const results = [];

      // Try multiple operations with timeout
      const operations = ['tools/list', 'ping', 'agent/register'];
      
      for (const operation of operations) {
        const result = await new Promise<any>((resolve) => {
          const timeout = setTimeout(() => {
            resolve({ degraded: true, operation, reason: 'timeout' });
          }, 1500); // Timeout before server responds

          client.once('data', (data: Buffer) => {
            clearTimeout(timeout);
            resolve(JSON.parse(data.toString()));
          });

          const message = {
            jsonrpc: '2.0',
            id: operation,
            method: operation,
            params: {}
          };
          client.write(JSON.stringify(message) + '\n');
        });

        results.push(result);
      }

      const duration = Date.now() - startTime;
      const degradedOps = results.filter(r => r.degraded).length;

      // Some operations should have timed out due to slow response
      expect(degradedOps).toBeGreaterThan(0);
      expect(duration).toBeLessThan(5000); // Should not wait for all slow responses

      client.end();
    });
  });

  describe('Recovery Procedures', () => {
    it('should recover agent state after crash', async () => {
      const client = net.createConnection({ port: 3457 });
      
      // Register an agent
      const agentId = await new Promise<string>((resolve) => {
        client.once('data', (data: Buffer) => {
          const response = JSON.parse(data.toString());
          resolve(response.result.agentId);
        });

        client.on('connect', () => {
          const message = {
            jsonrpc: '2.0',
            id: 1,
            method: 'agent/register',
            params: {
              name: 'crash-test-agent',
              role: 'worker',
              capabilities: ['recovery-test']
            }
          };
          client.write(JSON.stringify(message) + '\n');
        });
      });

      // Simulate crash by clearing server state
      mockServer.clearHistory();

      // Try to use the agent ID (should fail)
      const beforeRecovery = await new Promise<any>((resolve) => {
        client.once('data', (data: Buffer) => {
          resolve(JSON.parse(data.toString()));
        });

        const message = {
          jsonrpc: '2.0',
          id: 2,
          method: 'agent/message',
          params: {
            from: agentId,
            to: null,
            content: { test: 'message' }
          }
        };
        client.write(JSON.stringify(message) + '\n');
      });

      expect(beforeRecovery.error).toBeDefined();

      // Re-register the agent (recovery)
      await new Promise<void>((resolve) => {
        client.once('data', () => resolve());

        const message = {
          jsonrpc: '2.0',
          id: 3,
          method: 'agent/register',
          params: {
            agentId: agentId, // Use same ID
            name: 'crash-test-agent',
            role: 'worker',
            capabilities: ['recovery-test']
          }
        };
        client.write(JSON.stringify(message) + '\n');
      });

      // Verify agent is recovered
      const agents = mockServer.getRegisteredAgents();
      expect(agents.some(a => a.id === agentId)).toBe(true);

      client.end();
    });

    it('should handle bulk recovery operations', async () => {
      const agentCount = 10;
      const clients: net.Socket[] = [];
      
      // Register multiple agents
      const agentIds = await Promise.all(
        Array.from({ length: agentCount }, async (_, i) => {
          const client = net.createConnection({ port: 3457 });
          clients.push(client);

          return new Promise<string>((resolve) => {
            client.once('data', (data: Buffer) => {
              const response = JSON.parse(data.toString());
              resolve(response.result.agentId);
            });

            client.on('connect', () => {
              const message = {
                jsonrpc: '2.0',
                id: i,
                method: 'agent/register',
                params: {
                  name: `bulk-agent-${i}`,
                  role: 'worker',
                  capabilities: ['bulk-test']
                }
              };
              client.write(JSON.stringify(message) + '\n');
            });
          });
        })
      );

      // Simulate system crash
      mockServer.clearHistory();

      // Bulk re-registration
      const recoveryStart = Date.now();
      const recoveredIds = await Promise.all(
        agentIds.map(async (agentId, i) => {
          const client = clients[i];
          
          return new Promise<string>((resolve) => {
            client.once('data', (data: Buffer) => {
              const response = JSON.parse(data.toString());
              resolve(response.result.agentId);
            });

            const message = {
              jsonrpc: '2.0',
              id: `recovery-${i}`,
              method: 'agent/register',
              params: {
                agentId: agentId,
                name: `bulk-agent-${i}`,
                role: 'worker',
                capabilities: ['bulk-test']
              }
            };
            client.write(JSON.stringify(message) + '\n');
          });
        })
      );

      const recoveryDuration = Date.now() - recoveryStart;

      // Verify all agents recovered
      expect(recoveredIds).toHaveLength(agentCount);
      expect(new Set(recoveredIds).size).toBe(agentCount); // All unique
      expect(recoveryDuration).toBeLessThan(5000); // Should be fast

      // Clean up
      clients.forEach(client => client.end());
    });
  });
});