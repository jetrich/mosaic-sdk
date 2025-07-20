import { EventEmitter } from 'events';
import net from 'net';
import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

export interface DebugOptions {
  host: string;
  port: number;
  verbose: boolean;
  logFile?: string;
  interceptMode?: boolean;
}

export interface MessageTrace {
  id: string;
  timestamp: Date;
  direction: 'sent' | 'received';
  message: any;
  latency?: number;
  error?: string;
}

export interface ConnectionMetrics {
  connected: boolean;
  connectionTime?: number;
  messageseSent: number;
  messagesReceived: number;
  errors: number;
  averageLatency: number;
  uptime: number;
}

export class MCPDebugger extends EventEmitter {
  private options: DebugOptions;
  private socket: net.Socket | null = null;
  private traces: MessageTrace[] = [];
  private pendingRequests: Map<string, { timestamp: number; request: any }> = new Map();
  private metrics: ConnectionMetrics = {
    connected: false,
    messageseSent: 0,
    messagesReceived: 0,
    errors: 0,
    averageLatency: 0,
    uptime: 0
  };
  private connectionStartTime: number = 0;
  private logStream?: NodeJS.WritableStream;

  constructor(options: DebugOptions) {
    super();
    this.options = options;
    
    if (options.logFile) {
      const fs = require('fs');
      this.logStream = fs.createWriteStream(options.logFile, { flags: 'a' });
    }
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      this.socket = net.createConnection({
        host: this.options.host,
        port: this.options.port
      });

      this.socket.on('connect', () => {
        this.connectionStartTime = Date.now();
        this.metrics.connected = true;
        this.metrics.connectionTime = Date.now() - startTime;
        
        this.log('info', chalk.green(`Connected to MCP server at ${this.options.host}:${this.options.port}`));
        this.emit('connected');
        
        // Set up data handler
        this.setupDataHandler();
        
        resolve();
      });

      this.socket.on('error', (error) => {
        this.log('error', chalk.red(`Connection error: ${error.message}`));
        this.metrics.errors++;
        this.emit('error', error);
        reject(error);
      });

      this.socket.on('close', () => {
        this.metrics.connected = false;
        this.log('info', chalk.yellow('Connection closed'));
        this.emit('disconnected');
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.end();
      this.socket = null;
    }
    
    if (this.logStream) {
      this.logStream.end();
    }
  }

  async sendMessage(method: string, params?: any): Promise<any> {
    if (!this.socket || !this.metrics.connected) {
      throw new Error('Not connected to MCP server');
    }

    const id = uuidv4();
    const message = {
      jsonrpc: '2.0',
      id,
      method,
      params: params || {}
    };

    const timestamp = Date.now();
    this.pendingRequests.set(id, { timestamp, request: message });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout for ${method}`));
      }, 30000);

      const handler = (response: any) => {
        if (response.id === id) {
          clearTimeout(timeout);
          this.removeListener('response', handler);
          
          const latency = Date.now() - timestamp;
          this.updateLatency(latency);
          
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response.result);
          }
        }
      };

      this.on('response', handler);
      
      // Send the message
      this.socket!.write(JSON.stringify(message) + '\n');
      this.metrics.messageseSent++;
      
      // Trace the message
      this.addTrace({
        id,
        timestamp: new Date(),
        direction: 'sent',
        message
      });
      
      this.log('debug', chalk.blue(`→ ${method}`), message);
    });
  }

  private setupDataHandler(): void {
    if (!this.socket) return;

    let buffer = '';
    
    this.socket.on('data', (data: Buffer) => {
      buffer += data.toString();
      
      // Process complete messages
      const messages = buffer.split('\n');
      buffer = messages.pop() || ''; // Keep incomplete message in buffer
      
      messages.filter(msg => msg.trim()).forEach(messageStr => {
        try {
          const message = JSON.parse(messageStr);
          this.metrics.messagesReceived++;
          
          // Add trace
          this.addTrace({
            id: message.id || uuidv4(),
            timestamp: new Date(),
            direction: 'received',
            message
          });
          
          this.log('debug', chalk.green(`← ${message.method || 'response'}`), message);
          
          // Handle response
          if (message.id && this.pendingRequests.has(message.id)) {
            const pending = this.pendingRequests.get(message.id)!;
            const latency = Date.now() - pending.timestamp;
            
            this.addTrace({
              id: message.id,
              timestamp: new Date(),
              direction: 'received',
              message,
              latency
            });
            
            this.pendingRequests.delete(message.id);
          }
          
          this.emit('message', message);
          
          if (message.id) {
            this.emit('response', message);
          } else if (message.method) {
            this.emit('notification', message);
          }
          
        } catch (error) {
          this.log('error', chalk.red('Failed to parse message:'), messageStr);
          this.metrics.errors++;
        }
      });
    });
  }

  private addTrace(trace: MessageTrace): void {
    this.traces.push(trace);
    
    // Keep only last 1000 traces
    if (this.traces.length > 1000) {
      this.traces.shift();
    }
    
    this.emit('trace', trace);
  }

  private updateLatency(latency: number): void {
    const totalLatency = this.metrics.averageLatency * (this.metrics.messagesReceived - 1) + latency;
    this.metrics.averageLatency = totalLatency / this.metrics.messagesReceived;
  }

  private log(level: string, ...args: any[]): void {
    if (!this.options.verbose && level === 'debug') {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] [${level.toUpperCase()}] ${args.map(a => 
      typeof a === 'object' ? JSON.stringify(a, null, 2) : a
    ).join(' ')}`;
    
    console.log(message);
    
    if (this.logStream) {
      this.logStream.write(message + '\n');
    }
  }

  // Debugging utilities
  async runDiagnostics(): Promise<any> {
    const diagnostics = {
      connection: await this.testConnection(),
      tools: await this.testTools(),
      agents: await this.testAgentRegistration(),
      performance: await this.testPerformance()
    };
    
    return diagnostics;
  }

  private async testConnection(): Promise<any> {
    try {
      const result = await this.sendMessage('ping');
      return {
        status: 'ok',
        latency: this.metrics.averageLatency,
        uptime: Date.now() - this.connectionStartTime
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  private async testTools(): Promise<any> {
    try {
      const tools = await this.sendMessage('tools/list');
      return {
        status: 'ok',
        count: tools.tools?.length || 0,
        tools: tools.tools?.map((t: any) => t.name) || []
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  private async testAgentRegistration(): Promise<any> {
    try {
      const result = await this.sendMessage('agent/register', {
        name: 'debug-agent',
        role: 'debugger',
        capabilities: ['debug']
      });
      
      return {
        status: 'ok',
        agentId: result.agentId
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  private async testPerformance(): Promise<any> {
    const iterations = 100;
    const latencies: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      try {
        await this.sendMessage('ping');
        latencies.push(Date.now() - start);
      } catch (error) {
        // Ignore errors in performance test
      }
    }
    
    latencies.sort((a, b) => a - b);
    
    return {
      iterations,
      averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      minLatency: latencies[0],
      maxLatency: latencies[latencies.length - 1],
      p50: latencies[Math.floor(latencies.length * 0.5)],
      p95: latencies[Math.floor(latencies.length * 0.95)],
      p99: latencies[Math.floor(latencies.length * 0.99)]
    };
  }

  // Interactive debugging mode
  async startInteractiveMode(): Promise<void> {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('mcp> ')
    });

    console.log(chalk.yellow('MCP Interactive Debugger'));
    console.log(chalk.gray('Type "help" for available commands'));
    
    rl.prompt();

    rl.on('line', async (line: string) => {
      const [command, ...args] = line.trim().split(' ');
      
      try {
        switch (command) {
          case 'help':
            this.showHelp();
            break;
            
          case 'ping':
            const pingResult = await this.sendMessage('ping');
            console.log(chalk.green('Pong!'), pingResult);
            break;
            
          case 'tools':
            const tools = await this.sendMessage('tools/list');
            console.log(chalk.green('Available tools:'));
            tools.tools.forEach((tool: any) => {
              console.log(`  - ${tool.name}: ${tool.description}`);
            });
            break;
            
          case 'call':
            if (args.length < 1) {
              console.log(chalk.red('Usage: call <toolName> [args...]'));
            } else {
              const [toolName, ...toolArgs] = args;
              const result = await this.sendMessage('tools/call', {
                toolName,
                arguments: toolArgs.length > 0 ? JSON.parse(toolArgs.join(' ')) : {}
              });
              console.log(chalk.green('Result:'), result);
            }
            break;
            
          case 'register':
            const agentName = args[0] || 'debug-agent';
            const regResult = await this.sendMessage('agent/register', {
              name: agentName,
              role: 'debugger',
              capabilities: ['debug', 'test']
            });
            console.log(chalk.green('Agent registered:'), regResult);
            break;
            
          case 'metrics':
            console.log(chalk.green('Connection Metrics:'));
            console.log(this.getMetrics());
            break;
            
          case 'traces':
            const count = parseInt(args[0]) || 10;
            const recentTraces = this.traces.slice(-count);
            console.log(chalk.green(`Last ${count} traces:`));
            recentTraces.forEach(trace => {
              const arrow = trace.direction === 'sent' ? '→' : '←';
              const color = trace.direction === 'sent' ? chalk.blue : chalk.green;
              console.log(color(`${arrow} [${trace.timestamp.toISOString()}] ${trace.message.method || 'response'}`));
              if (trace.latency) {
                console.log(chalk.gray(`  Latency: ${trace.latency}ms`));
              }
            });
            break;
            
          case 'diagnostics':
            console.log(chalk.yellow('Running diagnostics...'));
            const diag = await this.runDiagnostics();
            console.log(chalk.green('Diagnostics Results:'));
            console.log(JSON.stringify(diag, null, 2));
            break;
            
          case 'clear':
            console.clear();
            break;
            
          case 'exit':
          case 'quit':
            rl.close();
            return;
            
          default:
            if (command) {
              console.log(chalk.red(`Unknown command: ${command}`));
            }
        }
      } catch (error) {
        console.log(chalk.red('Error:'), error.message);
      }
      
      rl.prompt();
    });

    rl.on('close', () => {
      console.log(chalk.yellow('Goodbye!'));
      this.disconnect();
      process.exit(0);
    });
  }

  private showHelp(): void {
    console.log(chalk.yellow('Available commands:'));
    console.log('  help                - Show this help message');
    console.log('  ping                - Send a ping request');
    console.log('  tools               - List available tools');
    console.log('  call <tool> [args]  - Call a tool with optional arguments');
    console.log('  register [name]     - Register a debug agent');
    console.log('  metrics             - Show connection metrics');
    console.log('  traces [count]      - Show recent message traces');
    console.log('  diagnostics         - Run full diagnostics');
    console.log('  clear               - Clear the screen');
    console.log('  exit/quit           - Exit the debugger');
  }

  getMetrics(): ConnectionMetrics {
    return {
      ...this.metrics,
      uptime: this.metrics.connected ? Date.now() - this.connectionStartTime : 0
    };
  }

  getTraces(count?: number): MessageTrace[] {
    return count ? this.traces.slice(-count) : [...this.traces];
  }

  exportTraces(filename: string): void {
    const fs = require('fs');
    fs.writeFileSync(filename, JSON.stringify(this.traces, null, 2));
    this.log('info', chalk.green(`Traces exported to ${filename}`));
  }
}

// CLI interface
if (require.main === module) {
  const program = require('commander');
  
  program
    .option('-h, --host <host>', 'MCP server host', 'localhost')
    .option('-p, --port <port>', 'MCP server port', '3456')
    .option('-v, --verbose', 'Enable verbose logging', false)
    .option('-l, --log <file>', 'Log to file')
    .option('-i, --interactive', 'Start in interactive mode', false)
    .parse(process.argv);

  const options = program.opts();
  
  const debugger = new MCPDebugger({
    host: options.host,
    port: parseInt(options.port),
    verbose: options.verbose,
    logFile: options.log
  });

  debugger.connect()
    .then(() => {
      if (options.interactive) {
        return debugger.startInteractiveMode();
      } else {
        // Run diagnostics and exit
        return debugger.runDiagnostics().then(results => {
          console.log(JSON.stringify(results, null, 2));
          debugger.disconnect();
        });
      }
    })
    .catch(error => {
      console.error(chalk.red('Failed to connect:'), error.message);
      process.exit(1);
    });
}