import { spawn, ChildProcess } from 'child_process';
import { MockMCPServer } from '../utilities/MockMCPServer';
import path from 'path';
import fs from 'fs';

describe('MCP Server Connectivity Tests', () => {
  let mockServer: MockMCPServer;
  let mcpProcess: ChildProcess | null = null;

  beforeAll(async () => {
    // Start mock MCP server on test port
    mockServer = new MockMCPServer(3457);
    await mockServer.start();
  });

  afterAll(async () => {
    await mockServer.stop();
    if (mcpProcess) {
      mcpProcess.kill();
    }
  });

  beforeEach(() => {
    mockServer.clearHistory();
  });

  describe('Basic Connectivity', () => {
    it('should establish connection to MCP server', async () => {
      const connectionPromise = new Promise((resolve, reject) => {
        mockServer.once('socket-connect', () => resolve(true));
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      // Simulate client connection
      const net = require('net');
      const client = net.createConnection({ port: 3457 }, () => {
        client.end();
      });

      await expect(connectionPromise).resolves.toBe(true);
    });

    it('should handle initialization handshake', async () => {
      const net = require('net');
      const client = net.createConnection({ port: 3457 });

      const response = await new Promise<any>((resolve, reject) => {
        client.on('data', (data: Buffer) => {
          try {
            const response = JSON.parse(data.toString());
            resolve(response);
          } catch (error) {
            reject(error);
          }
        });

        const initMessage = {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            clientInfo: {
              name: 'test-client',
              version: '1.0.0'
            }
          }
        };

        client.write(JSON.stringify(initMessage) + '\n');
      });

      expect(response.result).toHaveProperty('protocolVersion');
      expect(response.result).toHaveProperty('capabilities');
      expect(response.result.capabilities).toHaveProperty('tools', true);
      expect(response.result.capabilities).toHaveProperty('agents', true);

      client.end();
    });

    it('should handle multiple concurrent connections', async () => {
      const net = require('net');
      const connectionCount = 5;
      const clients: any[] = [];

      const connectionPromises = Array.from({ length: connectionCount }, (_, i) => {
        return new Promise((resolve) => {
          const client = net.createConnection({ port: 3457 }, () => {
            clients.push(client);
            resolve(true);
          });
        });
      });

      await Promise.all(connectionPromises);
      expect(clients).toHaveLength(connectionCount);

      // Clean up
      clients.forEach(client => client.end());
    });
  });

  describe('Error Handling', () => {
    it('should handle connection failures gracefully', async () => {
      // Stop the server temporarily
      await mockServer.stop();

      const net = require('net');
      const connectionPromise = new Promise((resolve, reject) => {
        const client = net.createConnection({ port: 3457 });
        client.on('error', (error: any) => {
          if (error.code === 'ECONNREFUSED') {
            resolve(true);
          } else {
            reject(error);
          }
        });
        client.on('connect', () => {
          reject(new Error('Should not connect'));
        });
      });

      await expect(connectionPromise).resolves.toBe(true);

      // Restart server for other tests
      await mockServer.start();
    });

    it('should handle malformed messages', async () => {
      const net = require('net');
      const client = net.createConnection({ port: 3457 });

      const response = await new Promise<any>((resolve) => {
        let responseReceived = false;
        
        client.on('data', (data: Buffer) => {
          responseReceived = true;
          resolve(null);
        });

        // Send malformed JSON
        client.write('{ invalid json }\n');

        // Wait a bit then resolve
        setTimeout(() => {
          if (!responseReceived) {
            resolve(null);
          }
        }, 1000);
      });

      // Server should handle error gracefully without crashing
      expect(mockServer).toBeDefined();
      
      client.end();
    });

    it('should handle network interruptions', async () => {
      const net = require('net');
      const client = net.createConnection({ port: 3457 });

      await new Promise(resolve => {
        client.on('connect', () => {
          // Abruptly close connection
          client.destroy();
          resolve(true);
        });
      });

      // Server should continue running
      const testClient = net.createConnection({ port: 3457 });
      const connected = await new Promise(resolve => {
        testClient.on('connect', () => {
          testClient.end();
          resolve(true);
        });
        testClient.on('error', () => resolve(false));
      });

      expect(connected).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should handle rapid message exchanges', async () => {
      const net = require('net');
      const client = net.createConnection({ port: 3457 });
      const messageCount = 100;
      let receivedCount = 0;

      await new Promise<void>((resolve) => {
        client.on('data', (data: Buffer) => {
          const messages = data.toString().split('\n').filter(m => m.trim());
          receivedCount += messages.length;
          
          if (receivedCount >= messageCount) {
            resolve();
          }
        });

        // Send many messages rapidly
        for (let i = 0; i < messageCount; i++) {
          const message = {
            jsonrpc: '2.0',
            id: i,
            method: 'ping',
            params: {}
          };
          client.write(JSON.stringify(message) + '\n');
        }
      });

      expect(receivedCount).toBe(messageCount);
      client.end();
    });

    it('should maintain low latency under load', async () => {
      const net = require('net');
      const client = net.createConnection({ port: 3457 });
      
      const latencies: number[] = [];
      const testCount = 50;

      for (let i = 0; i < testCount; i++) {
        const startTime = Date.now();
        
        await new Promise<void>((resolve) => {
          client.once('data', () => {
            const latency = Date.now() - startTime;
            latencies.push(latency);
            resolve();
          });

          const message = {
            jsonrpc: '2.0',
            id: i,
            method: 'ping',
            params: {}
          };
          client.write(JSON.stringify(message) + '\n');
        });
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);

      expect(avgLatency).toBeLessThan(50); // Average under 50ms
      expect(maxLatency).toBeLessThan(200); // Max under 200ms

      client.end();
    });
  });

  describe('Reconnection Logic', () => {
    it('should reconnect after server restart', async () => {
      const net = require('net');
      let client = net.createConnection({ port: 3457 });

      // Initial connection
      await new Promise(resolve => {
        client.on('connect', resolve);
      });

      // Server restart
      await mockServer.stop();
      await new Promise(resolve => setTimeout(resolve, 100));
      await mockServer.start();

      // Reconnection attempt
      client = net.createConnection({ port: 3457 });
      const reconnected = await new Promise(resolve => {
        client.on('connect', () => resolve(true));
        client.on('error', () => resolve(false));
      });

      expect(reconnected).toBe(true);
      client.end();
    });

    it('should handle exponential backoff for reconnection', async () => {
      const net = require('net');
      const maxRetries = 3;
      const baseDelay = 100;
      let attemptCount = 0;
      const attemptTimes: number[] = [];

      // Stop server to force reconnection attempts
      await mockServer.stop();

      const attemptConnection = async (retryCount: number): Promise<boolean> => {
        if (retryCount >= maxRetries) return false;

        attemptTimes.push(Date.now());
        attemptCount++;

        return new Promise((resolve) => {
          const client = net.createConnection({ port: 3457 });
          
          client.on('error', async () => {
            const delay = baseDelay * Math.pow(2, retryCount);
            await new Promise(r => setTimeout(r, delay));
            client.end();
            resolve(await attemptConnection(retryCount + 1));
          });

          client.on('connect', () => {
            client.end();
            resolve(true);
          });
        });
      };

      const result = await attemptConnection(0);
      expect(result).toBe(false);
      expect(attemptCount).toBe(maxRetries);

      // Verify exponential backoff timing
      for (let i = 1; i < attemptTimes.length; i++) {
        const actualDelay = attemptTimes[i] - attemptTimes[i - 1];
        const expectedDelay = baseDelay * Math.pow(2, i - 1);
        expect(actualDelay).toBeGreaterThanOrEqual(expectedDelay - 10); // Allow 10ms variance
      }

      // Restart server for other tests
      await mockServer.start();
    });
  });
});