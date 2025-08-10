#!/usr/bin/env node

/**
 * Ollama MCP Server for Claude Code Integration
 * Provides Ollama AI capabilities directly to Claude sessions
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolRequest,
  CallToolResult
} from '@modelcontextprotocol/sdk/types.js';
import { OllamaClient } from './client/OllamaClient.js';
import { ModelManager } from './client/ModelManager.js';
import { OllamaConfig } from './types/index.js';

class OllamaMCPServer {
  private server: Server;
  private ollamaClient: OllamaClient;
  private modelManager: ModelManager;

  constructor() {
    this.server = new Server(
      {
        name: 'ollama-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  async initialize() {
    // Load configuration
    const config: OllamaConfig = {
      endpoints: {
        primary: `http://${process.env.OLLAMA_HOST || '10.1.1.42'}:${process.env.OLLAMA_PORT || '11434'}`
      },
      models: {
        default: process.env.OLLAMA_MODEL || 'gpt-oss',
        code: process.env.OLLAMA_MODEL || 'gpt-oss'
      },
      options: {
        temperature: 0.2,
        num_ctx: 2048,
        num_predict: 200
      }
    };

    // Initialize clients
    this.ollamaClient = new OllamaClient(config);
    this.modelManager = new ModelManager(this.ollamaClient, config);

    // Verify connection
    const connected = await this.ollamaClient.testConnection();
    if (!connected.success) {
      console.error('Failed to connect to Ollama:', connected.error);
      process.exit(1);
    }

    console.error(`✅ Ollama MCP Server initialized - Connected to ${config.endpoints.primary}`);
    console.error(`🤖 Default model: ${config.models.default}`);
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'ollama_generate',
            description: 'Generate text using Ollama with optimized configurations for different use cases',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'The prompt for text generation'
                },
                task_type: {
                  type: 'string',
                  enum: ['quick-answer', 'code-generation', 'code-review', 'documentation', 'debugging', 'explanation'],
                  description: 'Type of task to optimize performance configuration'
                },
                model: {
                  type: 'string',
                  description: 'Specific model to use (optional, defaults to gpt-oss)'
                },
                config: {
                  type: 'string',
                  enum: ['ultra-fast', 'development', 'comprehensive'],
                  description: 'Performance configuration preset'
                },
                language: {
                  type: 'string',
                  description: 'Programming language for code-related tasks'
                },
                options: {
                  type: 'object',
                  properties: {
                    temperature: { type: 'number', minimum: 0, maximum: 1 },
                    max_tokens: { type: 'number', minimum: 1 },
                    stream: { type: 'boolean' }
                  },
                  description: 'Override default generation options'
                }
              },
              required: ['prompt']
            }
          },
          {
            name: 'ollama_model_manage',
            description: 'Manage Ollama models: list, switch, pull, or get information',
            inputSchema: {
              type: 'object',
              properties: {
                operation: {
                  type: 'string',
                  enum: ['list', 'switch', 'pull', 'info', 'running'],
                  description: 'Model management operation'
                },
                model: {
                  type: 'string',
                  description: 'Model name for switch/pull/info operations'
                }
              },
              required: ['operation']
            }
          },
          {
            name: 'ollama_performance_stats',
            description: 'Get performance statistics and optimization recommendations',
            inputSchema: {
              type: 'object',
              properties: {
                include_history: {
                  type: 'boolean',
                  description: 'Include historical performance data'
                }
              }
            }
          }
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest): Promise<CallToolResult> => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'ollama_generate':
            return await this.handleGenerate(args);
          case 'ollama_model_manage':
            return await this.handleModelManage(args);
          case 'ollama_performance_stats':
            return await this.handlePerformanceStats(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    });
  }

  private async handleGenerate(args: any): Promise<CallToolResult> {
    const { prompt, task_type, model, config, language, options } = args;

    // Select optimal configuration
    const selectedConfig = this.selectOptimalConfig(task_type, config);
    const targetModel = model || this.modelManager.getCurrentModel();

    // Build enhanced prompt
    let enhancedPrompt = prompt;
    if (task_type === 'code-generation' && language) {
      enhancedPrompt = `Generate ${language} code for: ${prompt}\n\nProvide clean, working code with comments.`;
    } else if (task_type === 'code-review') {
      enhancedPrompt = `Review this code for bugs, security, and best practices:\n${prompt}`;
    } else if (task_type === 'debugging') {
      enhancedPrompt = `Debug and fix this issue:\n${prompt}\n\nExplain the problem and provide the solution.`;
    }

    // Generate with selected configuration
    const generateParams = {
      model: targetModel,
      prompt: enhancedPrompt,
      stream: false,
      options: {
        ...selectedConfig,
        ...options
      }
    };

    const response = await this.ollamaClient.generate(generateParams);

    if (!response.success) {
      throw new Error(`Generation failed: ${response.error}`);
    }

    const result = response.data!;
    const duration = result.total_duration ? Math.round(result.total_duration / 1000000) : 0;

    return {
      content: [
        {
          type: 'text',
          text: `## Generated Response

${result.response}

---
**Config:** ${config || 'auto'} | **Model:** ${targetModel} | **Duration:** ${duration}ms | **Tokens:** ${result.eval_count || 0}`
        }
      ]
    };
  }

  private async handleModelManage(args: any): Promise<CallToolResult> {
    const { operation, model } = args;

    try {
      switch (operation) {
        case 'list':
          const models = await this.ollamaClient.listModels();
          if (!models.success) throw new Error(models.error);
          
          const modelList = models.data!.models.map((m: any) => 
            `• ${m.name} (${this.formatBytes(m.size)})`
          ).join('\n');
          
          return {
            content: [{
              type: 'text',
              text: `## Available Models\n\n${modelList}\n\n**Current:** ${this.modelManager.getCurrentModel()}`
            }]
          };

        case 'switch':
          if (!model) throw new Error('Model name required for switch operation');
          
          const switchResult = await this.modelManager.switchModel(model);
          return {
            content: [{
              type: 'text', 
              text: switchResult.success 
                ? `✅ Switched to model: ${model}` 
                : `❌ Failed to switch: ${switchResult.error}`
            }]
          };

        case 'info':
          if (!model) throw new Error('Model name required for info operation');
          
          const info = await this.ollamaClient.showModel(model);
          if (!info.success) throw new Error(info.error);
          
          return {
            content: [{
              type: 'text',
              text: `## Model Info: ${model}\n\n\`\`\`json\n${JSON.stringify(info.data, null, 2)}\n\`\`\``
            }]
          };

        case 'running':
          const running = await this.ollamaClient.getRunningModels();
          if (!running.success) throw new Error(running.error);
          
          const runningList = running.data?.models?.map((m: any) => 
            `• ${m.name} (loaded)`
          ).join('\n') || 'No models currently loaded';
          
          return {
            content: [{
              type: 'text',
              text: `## Running Models\n\n${runningList}`
            }]
          };

        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      throw new Error(`Model operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async handlePerformanceStats(args: any): Promise<CallToolResult> {
    const stats = this.modelManager.getPerformanceMetrics();
    
    const report = `## Performance Statistics

**Current Model:** ${this.modelManager.getCurrentModel()}
**Requests Processed:** ${stats.totalRequests}
**Average Response Time:** ${Math.round(stats.averageResponseTime)}ms
**Success Rate:** ${stats.successRate.toFixed(1)}%

### Configuration Usage:
${Object.entries(stats.configUsage).map(([config, count]) => 
  `• ${config}: ${count} requests`
).join('\n')}

### Cost Savings:
• **Ollama Cost:** $0.0000 (FREE!)
• **Estimated Claude Equivalent:** $${(stats.totalRequests * 0.000025).toFixed(6)}
• **Savings:** 100%`;

    return {
      content: [{
        type: 'text',
        text: report
      }]
    };
  }

  private selectOptimalConfig(taskType?: string, preference?: string) {
    const configs = {
      'ultra-fast': {
        temperature: 0.1,
        num_predict: 50,
        top_k: 10,
        top_p: 0.7,
        num_ctx: 1024,
        repeat_penalty: 1.0
      },
      'development': {
        temperature: 0.2,
        num_predict: 80,
        top_k: 15,
        top_p: 0.75,
        num_ctx: 1536,
        repeat_penalty: 1.05
      },
      'comprehensive': {
        temperature: 0.2,
        num_predict: 150,
        top_k: 20,
        top_p: 0.8,
        num_ctx: 2048,
        repeat_penalty: 1.05
      }
    };

    // Use preference if specified
    if (preference && preference in configs) {
      return configs[preference as keyof typeof configs];
    }

    // Auto-select based on task type
    switch (taskType) {
      case 'quick-answer':
        return configs['ultra-fast'];
      case 'code-generation':
      case 'code-review':
      case 'debugging':
        return configs['development'];
      case 'documentation':
      case 'explanation':
        return configs['comprehensive'];
      default:
        return configs['development'];
    }
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      console.error('\n🛑 Shutting down Ollama MCP Server...');
      await this.server.close();
      process.exit(0);
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 Ollama MCP Server running on stdio');
  }
}

// Start the server
async function main() {
  const server = new OllamaMCPServer();
  await server.initialize();
  await server.start();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { OllamaMCPServer };