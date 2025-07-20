import { EventEmitter } from 'events';
import net from 'net';
import { v4 as uuidv4 } from 'uuid';

export interface LoadTestConfig {
  targetHost: string;
  targetPort: number;
  duration: number; // milliseconds
  rampUpTime: number; // milliseconds
  maxConnections: number;
  requestsPerConnection: number;
  scenario: LoadScenario;
}

export interface LoadScenario {
  name: string;
  steps: ScenarioStep[];
}

export interface ScenarioStep {
  action: 'connect' | 'register' | 'message' | 'tool' | 'disconnect' | 'wait';
  params?: any;
  weight?: number; // For weighted random selection
}

export interface LoadTestResult {
  scenario: string;
  duration: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  maxLatency: number;
  minLatency: number;
  requestsPerSecond: number;
  connectionsCreated: number;
  connectionsFailed: number;
  errors: ErrorSummary[];
  latencyHistogram: LatencyBucket[];
}

export interface ErrorSummary {
  type: string;
  count: number;
  message: string;
}

export interface LatencyBucket {
  range: string;
  count: number;
  percentage: number;
}

export class LoadTester extends EventEmitter {
  private config: LoadTestConfig;
  private connections: Map<string, net.Socket> = new Map();
  private agents: Map<string, string> = new Map(); // socket -> agentId
  private metrics: LoadTestMetrics;
  private running: boolean = false;
  private startTime: number = 0;

  constructor(config: LoadTestConfig) {
    super();
    this.config = config;
    this.metrics = new LoadTestMetrics();
  }

  async start(): Promise<LoadTestResult> {
    this.running = true;
    this.startTime = Date.now();
    this.emit('test-started', { scenario: this.config.scenario.name });

    try {
      // Ramp up connections
      await this.rampUp();

      // Run load test
      await this.runScenario();

      // Ramp down
      await this.rampDown();

    } catch (error) {
      this.emit('test-error', error);
      throw error;
    } finally {
      this.running = false;
    }

    const result = this.generateReport();
    this.emit('test-completed', result);
    return result;
  }

  stop(): void {
    this.running = false;
    this.emit('test-stopped');
  }

  private async rampUp(): Promise<void> {
    const connectionInterval = this.config.rampUpTime / this.config.maxConnections;
    
    for (let i = 0; i < this.config.maxConnections; i++) {
      if (!this.running) break;

      const connectionId = uuidv4();
      
      try {
        const socket = await this.createConnection(connectionId);
        this.connections.set(connectionId, socket);
        this.metrics.connectionCreated();
        
        this.emit('connection-created', { connectionId, current: i + 1, total: this.config.maxConnections });
      } catch (error) {
        this.metrics.connectionFailed(error as Error);
        this.emit('connection-failed', { connectionId, error });
      }

      if (i < this.config.maxConnections - 1) {
        await new Promise(resolve => setTimeout(resolve, connectionInterval));
      }
    }
  }

  private async runScenario(): Promise<void> {
    const endTime = this.startTime + this.config.duration;
    const workers: Promise<void>[] = [];

    // Start workers for each connection
    for (const [connectionId, socket] of this.connections) {
      workers.push(this.connectionWorker(connectionId, socket, endTime));
    }

    // Wait for all workers to complete or timeout
    await Promise.allSettled(workers);
  }

  private async connectionWorker(connectionId: string, socket: net.Socket, endTime: number): Promise<void> {
    while (this.running && Date.now() < endTime) {
      const step = this.selectRandomStep();
      
      try {
        await this.executeStep(connectionId, socket, step);
      } catch (error) {
        this.metrics.requestFailed(error as Error);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    }
  }

  private selectRandomStep(): ScenarioStep {
    const weightedSteps = this.config.scenario.steps.filter(s => s.weight && s.weight > 0);
    
    if (weightedSteps.length === 0) {
      // No weights, select randomly
      return this.config.scenario.steps[Math.floor(Math.random() * this.config.scenario.steps.length)];
    }

    // Weighted random selection
    const totalWeight = weightedSteps.reduce((sum, step) => sum + (step.weight || 0), 0);
    let random = Math.random() * totalWeight;

    for (const step of weightedSteps) {
      random -= step.weight || 0;
      if (random <= 0) {
        return step;
      }
    }

    return weightedSteps[0];
  }

  private async executeStep(connectionId: string, socket: net.Socket, step: ScenarioStep): Promise<void> {
    const requestId = uuidv4();
    const startTime = process.hrtime.bigint();

    try {
      switch (step.action) {
        case 'register':
          await this.registerAgent(connectionId, socket, step.params);
          break;

        case 'message':
          await this.sendMessage(connectionId, socket, step.params);
          break;

        case 'tool':
          await this.callTool(socket, step.params);
          break;

        case 'wait':
          await new Promise(resolve => setTimeout(resolve, step.params?.duration || 1000));
          break;

        case 'disconnect':
          socket.destroy();
          this.connections.delete(connectionId);
          break;
      }

      const endTime = process.hrtime.bigint();
      const latency = Number(endTime - startTime) / 1e6; // Convert to ms
      
      this.metrics.requestCompleted(latency);
      this.emit('request-completed', { connectionId, requestId, action: step.action, latency });

    } catch (error) {
      const endTime = process.hrtime.bigint();
      const latency = Number(endTime - startTime) / 1e6;
      
      this.metrics.requestFailed(error as Error);
      this.emit('request-failed', { connectionId, requestId, action: step.action, error, latency });
      throw error;
    }
  }

  private async createConnection(connectionId: string): Promise<net.Socket> {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection({
        host: this.config.targetHost,
        port: this.config.targetPort
      });

      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      }, 5000);

      socket.once('connect', () => {
        clearTimeout(timeout);
        resolve(socket);
      });

      socket.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  private async registerAgent(connectionId: string, socket: net.Socket, params: any): Promise<void> {
    const agentName = params?.name || `load-agent-${connectionId}`;
    const role = params?.role || 'worker';

    const response = await this.sendRequest(socket, {
      method: 'agent/register',
      params: {
        name: agentName,
        role: role,
        capabilities: params?.capabilities || ['load-test']
      }
    });

    if (response.result?.agentId) {
      this.agents.set(connectionId, response.result.agentId);
    }
  }

  private async sendMessage(connectionId: string, socket: net.Socket, params: any): Promise<void> {
    const agentId = this.agents.get(connectionId);
    if (!agentId) {
      throw new Error('Agent not registered');
    }

    await this.sendRequest(socket, {
      method: 'agent/message',
      params: {
        from: agentId,
        to: params?.to || null,
        content: params?.content || { type: 'load-test', timestamp: Date.now() }
      }
    });
  }

  private async callTool(socket: net.Socket, params: any): Promise<void> {
    await this.sendRequest(socket, {
      method: 'tools/call',
      params: {
        toolName: params?.toolName || 'ping',
        arguments: params?.arguments || {}
      }
    });
  }

  private async sendRequest(socket: net.Socket, request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const message = {
        jsonrpc: '2.0',
        id,
        ...request
      };

      const timeout = setTimeout(() => {
        socket.removeListener('data', handler);
        reject(new Error('Request timeout'));
      }, 5000);

      const handler = (data: Buffer) => {
        const responses = data.toString().split('\n').filter(line => line.trim());
        
        for (const responseStr of responses) {
          try {
            const response = JSON.parse(responseStr);
            if (response.id === id) {
              clearTimeout(timeout);
              socket.removeListener('data', handler);
              
              if (response.error) {
                reject(new Error(response.error.message));
              } else {
                resolve(response);
              }
              return;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      };

      socket.on('data', handler);
      socket.write(JSON.stringify(message) + '\n');
    });
  }

  private async rampDown(): Promise<void> {
    const connections = Array.from(this.connections.values());
    
    for (const socket of connections) {
      socket.end();
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    this.connections.clear();
    this.agents.clear();
  }

  private generateReport(): LoadTestResult {
    const latencies = this.metrics.getLatencies();
    const errors = this.metrics.getErrors();
    const duration = Date.now() - this.startTime;

    // Calculate latency histogram
    const histogram = this.calculateHistogram(latencies);

    return {
      scenario: this.config.scenario.name,
      duration,
      totalRequests: this.metrics.getTotalRequests(),
      successfulRequests: this.metrics.getSuccessfulRequests(),
      failedRequests: this.metrics.getFailedRequests(),
      averageLatency: this.calculateAverage(latencies),
      maxLatency: Math.max(...latencies, 0),
      minLatency: Math.min(...latencies, Infinity),
      requestsPerSecond: (this.metrics.getTotalRequests() / duration) * 1000,
      connectionsCreated: this.metrics.getConnectionsCreated(),
      connectionsFailed: this.metrics.getConnectionsFailed(),
      errors: errors,
      latencyHistogram: histogram
    };
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateHistogram(latencies: number[]): LatencyBucket[] {
    if (latencies.length === 0) return [];

    const buckets = [
      { min: 0, max: 10, range: '0-10ms', count: 0 },
      { min: 10, max: 50, range: '10-50ms', count: 0 },
      { min: 50, max: 100, range: '50-100ms', count: 0 },
      { min: 100, max: 500, range: '100-500ms', count: 0 },
      { min: 500, max: 1000, range: '500-1000ms', count: 0 },
      { min: 1000, max: Infinity, range: '>1000ms', count: 0 }
    ];

    for (const latency of latencies) {
      for (const bucket of buckets) {
        if (latency >= bucket.min && latency < bucket.max) {
          bucket.count++;
          break;
        }
      }
    }

    const total = latencies.length;
    return buckets.map(b => ({
      range: b.range,
      count: b.count,
      percentage: (b.count / total) * 100
    }));
  }
}

// Metrics collection class
class LoadTestMetrics {
  private totalRequests = 0;
  private successfulRequests = 0;
  private failedRequests = 0;
  private connectionsCreated = 0;
  private connectionsFailed = 0;
  private latencies: number[] = [];
  private errors = new Map<string, { count: number; message: string }>();

  requestCompleted(latency: number): void {
    this.totalRequests++;
    this.successfulRequests++;
    this.latencies.push(latency);
  }

  requestFailed(error: Error): void {
    this.totalRequests++;
    this.failedRequests++;
    
    const errorType = error.constructor.name;
    const existing = this.errors.get(errorType) || { count: 0, message: error.message };
    existing.count++;
    this.errors.set(errorType, existing);
  }

  connectionCreated(): void {
    this.connectionsCreated++;
  }

  connectionFailed(error: Error): void {
    this.connectionsFailed++;
    this.requestFailed(error);
  }

  getTotalRequests(): number {
    return this.totalRequests;
  }

  getSuccessfulRequests(): number {
    return this.successfulRequests;
  }

  getFailedRequests(): number {
    return this.failedRequests;
  }

  getConnectionsCreated(): number {
    return this.connectionsCreated;
  }

  getConnectionsFailed(): number {
    return this.connectionsFailed;
  }

  getLatencies(): number[] {
    return [...this.latencies];
  }

  getErrors(): ErrorSummary[] {
    return Array.from(this.errors.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      message: data.message
    }));
  }
}

// Pre-defined load scenarios
export const StandardScenarios = {
  basicLoad: {
    name: 'Basic Load Test',
    steps: [
      { action: 'register' as const, weight: 1 },
      { action: 'message' as const, weight: 8 },
      { action: 'tool' as const, params: { toolName: 'ping' }, weight: 1 }
    ]
  },

  agentCoordination: {
    name: 'Agent Coordination Load',
    steps: [
      { action: 'register' as const, weight: 1 },
      { action: 'message' as const, params: { content: { type: 'task-request' } }, weight: 5 },
      { action: 'message' as const, params: { content: { type: 'status-update' } }, weight: 3 },
      { action: 'tool' as const, params: { toolName: 'tony_agent_spawn' }, weight: 1 }
    ]
  },

  toolHeavy: {
    name: 'Tool-Heavy Load',
    steps: [
      { action: 'register' as const, weight: 1 },
      { action: 'tool' as const, params: { toolName: 'tony_project_list' }, weight: 3 },
      { action: 'tool' as const, params: { toolName: 'tony_project_create' }, weight: 2 },
      { action: 'tool' as const, params: { toolName: 'tony_agent_spawn' }, weight: 2 }
    ]
  },

  connectionStress: {
    name: 'Connection Stress Test',
    steps: [
      { action: 'register' as const, weight: 1 },
      { action: 'message' as const, weight: 2 },
      { action: 'disconnect' as const, weight: 1 },
      { action: 'connect' as const, weight: 1 }
    ]
  }
};