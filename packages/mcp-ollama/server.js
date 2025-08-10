#!/usr/bin/env node

/**
 * Ollama MCP Server - Simplified JavaScript Implementation
 * Provides optimized Ollama AI capabilities directly to Claude sessions
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const http = require('http');
const { performance } = require('perf_hooks');

class OllamaMCPServer {
  constructor() {
    this.ollamaHost = process.env.OLLAMA_HOST || '10.1.1.42';
    this.ollamaPort = process.env.OLLAMA_PORT || '11434';
    this.model = process.env.OLLAMA_MODEL || 'gpt-oss';
    this.currentModel = this.model;
    
    // Optimized configurations from A/B testing
    this.configs = {
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
    
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      totalResponseTime: 0,
      configUsage: {}
    };

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

    this.setupHandlers();
  }

  async initialize() {
    // Test connection
    const connected = await this.testConnection();
    if (!connected) {
      console.error('❌ Failed to connect to Ollama at', `${this.ollamaHost}:${this.ollamaPort}`);
      process.exit(1);
    }
    
    console.error(`✅ Ollama MCP Server initialized`);
    console.error(`🎯 Connected to: ${this.ollamaHost}:${this.ollamaPort}`);
    console.error(`🤖 Default model: ${this.model}`);
  }

  async testConnection() {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: this.ollamaHost,
        port: this.ollamaPort,
        path: '/api/version',
        method: 'GET',
        timeout: 5000
      }, (res) => resolve(res.statusCode === 200));
      
      req.on('error', () => resolve(false));
      req.on('timeout', () => resolve(false));
      req.end();
    });
  }

  setupHandlers() {
    // List tools
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'ollama_generate',
            description: 'Generate text using optimized Ollama configurations. Perfect for code generation, reviews, debugging, and explanations.',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'The prompt for generation'
                },
                task_type: {
                  type: 'string',
                  enum: ['quick-answer', 'code', 'review', 'debug', 'explain', 'documentation'],
                  description: 'Task type for optimal configuration selection'
                },
                language: {
                  type: 'string',
                  description: 'Programming language (for code tasks)'
                },
                config: {
                  type: 'string',
                  enum: ['ultra-fast', 'development', 'comprehensive'],
                  description: 'Performance configuration: ultra-fast (~2.5s), development (~3.8s), comprehensive (~4.5s)'
                },
                model: {
                  type: 'string',
                  description: 'Specific model to use (optional)'
                }
              },
              required: ['prompt']
            }
          },
          {
            name: 'ollama_models',
            description: 'Manage Ollama models: list available models, switch models, or get model information',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  enum: ['list', 'switch', 'current', 'info'],
                  description: 'Model management action'
                },
                model: {
                  type: 'string',
                  description: 'Model name (required for switch/info actions)'
                }
              },
              required: ['action']
            }
          },
          {
            name: 'ollama_stats',
            description: 'Get performance statistics, cost savings, and usage analytics',
            inputSchema: {
              type: 'object',
              properties: {
                detailed: {
                  type: 'boolean',
                  description: 'Include detailed breakdown'
                }
              }
            }
          }
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'ollama_generate':
            return await this.handleGenerate(args);
          case 'ollama_models':
            return await this.handleModels(args);
          case 'ollama_stats':
            return await this.handleStats(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });

    // Error handling
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      console.error('\\n🛑 Shutting down Ollama MCP Server...');
      await this.server.close();
      process.exit(0);
    });
  }

  async handleGenerate(args) {
    const { prompt, task_type, language, config, model } = args;
    const startTime = performance.now();
    
    this.stats.totalRequests++;
    
    // Select optimal configuration
    const selectedConfig = this.selectConfig(task_type, config);
    const targetModel = model || this.currentModel;
    
    // Enhance prompt based on task type
    const enhancedPrompt = this.enhancePrompt(prompt, task_type, language);
    
    // Generate response
    const result = await this.generateWithOllama(enhancedPrompt, targetModel, selectedConfig);
    const duration = performance.now() - startTime;
    
    if (result.success) {
      this.stats.successfulRequests++;
      this.stats.totalResponseTime += duration;
      this.stats.configUsage[config || 'auto'] = (this.stats.configUsage[config || 'auto'] || 0) + 1;
    }
    
    if (!result.success) {
      throw new Error(result.error);
    }

    const configName = this.getConfigName(selectedConfig);
    const responseText = `## 🤖 Generated Response

${result.response}

---
**⚡ Config:** ${configName} | **🤖 Model:** ${targetModel} | **⏱️ Duration:** ${Math.round(duration)}ms | **📊 Tokens:** ${result.tokens || 0} | **💰 Cost:** FREE!`;

    return {
      content: [
        {
          type: 'text',
          text: responseText
        }
      ]
    };
  }

  async handleModels(args) {
    const { action, model } = args;
    
    switch (action) {
      case 'list':
        const models = await this.listModels();
        if (!models.success) {
          throw new Error(models.error);
        }
        
        const modelList = models.models.map(m => 
          `• **${m.name}** (${this.formatBytes(m.size)}) ${m.name === this.currentModel ? '← *current*' : ''}`
        ).join('\\n');
        
        return {
          content: [{
            type: 'text',
            text: `## 🤖 Available Models\\n\\n${modelList}\\n\\n**Current Model:** ${this.currentModel}`
          }]
        };
        
      case 'switch':
        if (!model) throw new Error('Model name required for switch');
        
        // Verify model exists
        const available = await this.listModels();
        if (!available.success) throw new Error('Failed to list models');
        
        const modelExists = available.models.some(m => m.name.includes(model));
        if (!modelExists) {
          throw new Error(`Model '${model}' not found. Use ollama_models with action 'list' to see available models.`);
        }
        
        const previousModel = this.currentModel;
        this.currentModel = model;
        
        return {
          content: [{
            type: 'text',
            text: `✅ **Switched Model**\\n\\n**From:** ${previousModel}\\n**To:** ${this.currentModel}\\n\\nThe new model will be used for all subsequent generations.`
          }]
        };
        
      case 'current':
        return {
          content: [{
            type: 'text',
            text: `## 🤖 Current Model\\n\\n**Active:** ${this.currentModel}\\n**Endpoint:** ${this.ollamaHost}:${this.ollamaPort}`
          }]
        };
        
      case 'info':
        if (!model) throw new Error('Model name required for info');
        
        const info = await this.getModelInfo(model);
        if (!info.success) throw new Error(info.error);
        
        return {
          content: [{
            type: 'text',
            text: `## 📋 Model Information: ${model}\\n\\n\`\`\`json\\n${JSON.stringify(info.data, null, 2)}\\n\`\`\``
          }]
        };
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async handleStats(args) {
    const { detailed } = args;
    const avgResponseTime = this.stats.totalRequests > 0 
      ? this.stats.totalResponseTime / this.stats.successfulRequests 
      : 0;
    const successRate = this.stats.totalRequests > 0
      ? (this.stats.successfulRequests / this.stats.totalRequests) * 100
      : 0;
    
    // Cost comparison
    const estimatedClaudeCost = this.stats.totalRequests * 0.000025; // Rough estimate
    
    let report = `## 📊 Performance Statistics

**Current Model:** ${this.currentModel}
**Requests Processed:** ${this.stats.totalRequests}
**Success Rate:** ${successRate.toFixed(1)}%
**Average Response Time:** ${Math.round(avgResponseTime)}ms

### 💰 Cost Analysis
• **Ollama Cost:** $0.0000 (FREE!)
• **Estimated Claude Cost:** $${estimatedClaudeCost.toFixed(6)}
• **Savings:** 100% ($${estimatedClaudeCost.toFixed(6)} saved)`;

    if (detailed && Object.keys(this.stats.configUsage).length > 0) {
      report += `\\n\\n### 🎯 Configuration Usage\\n`;
      for (const [config, count] of Object.entries(this.stats.configUsage)) {
        report += `• ${config}: ${count} requests\\n`;
      }
    }

    if (detailed) {
      report += `\\n\\n### ⚡ Configuration Details
• **ultra-fast**: ~2.5s response time, 50 tokens max
• **development**: ~3.8s response time, 80 tokens max  
• **comprehensive**: ~4.5s response time, 150 tokens max

### 🎯 Optimized for:
• **Code Generation**: Fast, accurate code with comments
• **Code Review**: Bug detection and best practices
• **Debugging**: Problem identification and solutions
• **Documentation**: Clear explanations and examples`;
    }

    return {
      content: [{
        type: 'text',
        text: report
      }]
    };
  }

  selectConfig(taskType, preference) {
    if (preference && this.configs[preference]) {
      return this.configs[preference];
    }
    
    // Auto-select based on task type
    switch (taskType) {
      case 'quick-answer':
        return this.configs['ultra-fast'];
      case 'code':
      case 'review':
      case 'debug':
        return this.configs['development'];
      case 'documentation':
      case 'explain':
        return this.configs['comprehensive'];
      default:
        return this.configs['development'];
    }
  }

  enhancePrompt(prompt, taskType, language) {
    if (taskType === 'code' && language) {
      return `Generate ${language} code for: ${prompt}\\n\\nProvide clean, working code with appropriate comments.`;
    } else if (taskType === 'review') {
      return `Review this code for bugs, security issues, and best practices:\\n${prompt}`;
    } else if (taskType === 'debug') {
      return `Debug this issue and provide a solution:\\n${prompt}\\n\\nExplain the problem and provide the fix.`;
    } else if (taskType === 'explain') {
      return `Explain this clearly and concisely:\\n${prompt}`;
    }
    
    return prompt;
  }

  getConfigName(config) {
    for (const [name, conf] of Object.entries(this.configs)) {
      if (JSON.stringify(conf) === JSON.stringify(config)) {
        return name.replace('-', ' ').replace(/\\b\\w/g, l => l.toUpperCase());
      }
    }
    return 'Custom';
  }

  async generateWithOllama(prompt, model, options) {
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        model,
        prompt,
        stream: false,
        options
      });

      const req = http.request({
        hostname: this.ollamaHost,
        port: this.ollamaPort,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        },
        timeout: 15000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve({
              success: true,
              response: result.response || '',
              tokens: result.eval_count || 0,
              model: result.model || model
            });
          } catch (error) {
            resolve({
              success: false,
              error: `Parse error: ${error.message}`
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          error: `Request error: ${error.message}`
        });
      });

      req.on('timeout', () => {
        resolve({
          success: false,
          error: 'Request timeout'
        });
      });

      req.write(postData);
      req.end();
    });
  }

  async listModels() {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: this.ollamaHost,
        port: this.ollamaPort,
        path: '/api/tags',
        method: 'GET',
        timeout: 10000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve({
              success: true,
              models: result.models || []
            });
          } catch (error) {
            resolve({
              success: false,
              error: `Parse error: ${error.message}`
            });
          }
        });
      });
      
      req.on('error', (error) => {
        resolve({
          success: false,
          error: `Request error: ${error.message}`
        });
      });
      
      req.end();
    });
  }

  async getModelInfo(modelName) {
    return new Promise((resolve) => {
      const postData = JSON.stringify({ name: modelName });
      
      const req = http.request({
        hostname: this.ollamaHost,
        port: this.ollamaPort,
        path: '/api/show',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        },
        timeout: 10000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve({
              success: true,
              data: result
            });
          } catch (error) {
            resolve({
              success: false,
              error: `Parse error: ${error.message}`
            });
          }
        });
      });
      
      req.on('error', (error) => {
        resolve({
          success: false,
          error: `Request error: ${error.message}`
        });
      });
      
      req.write(postData);
      req.end();
    });
  }

  formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 Ollama MCP Server running');
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
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
}