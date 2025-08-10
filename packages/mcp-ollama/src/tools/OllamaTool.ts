/**
 * @fileoverview Base Ollama tool extending MCPServiceTool
 * @module @mosaicstack/mcp-ollama/tools
 */

import { MCPServiceTool } from '@mosaicstack/mcp-common';
import { 
  ServiceConfig, 
  AuthConfig, 
  ServiceOperation,
  AsyncResult,
  MCPResult
} from '@mosaicstack/mcp-common';
import { OllamaClient } from '../client/OllamaClient.js';
import { ModelManager } from '../client/ModelManager.js';
import { OllamaConfig, OllamaOperation } from '../types/index.js';
const defaultConfig = require('../config/default.json');

/**
 * Base class for all Ollama MCP tools
 */
export abstract class OllamaTool extends MCPServiceTool {
  protected ollamaClient: OllamaClient;
  protected modelManager: ModelManager;
  protected ollamaConfig: OllamaConfig;

  constructor(
    serviceName: string,
    config?: Partial<OllamaConfig>
  ) {
    // Merge with default config
    const mergedConfig = {
      ...defaultConfig.ollama,
      ...config
    } as OllamaConfig;
    
    // Create service config for MCPServiceTool
    const serviceConfig: ServiceConfig = {
      name: `ollama-${serviceName}`,
      baseUrl: mergedConfig.endpoints.primary,
      apiUrl: mergedConfig.endpoints.primary,
      timeout: mergedConfig.execution?.timeout || 30000,
      retryAttempts: 3,
      retryDelay: 1000
    };
    
    // Create auth config (can be extended for authenticated Ollama instances)
    const authConfig: AuthConfig = {
      type: 'basic',
      credentials: {
        username: '',
        password: ''
      },
      refreshable: false
    };
    
    super(`ollama-${serviceName}`, serviceConfig, authConfig);
    
    this.ollamaConfig = mergedConfig;
    
    // Initialize Ollama client
    this.ollamaClient = new OllamaClient(
      mergedConfig.endpoints.primary,
      mergedConfig.endpoints.fallback
    );
    
    // Initialize model manager
    this.modelManager = new ModelManager(
      this.ollamaClient,
      mergedConfig.models.default,
      mergedConfig.models.specialized
    );
    
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for client and model manager
   */
  private setupEventListeners(): void {
    // Client events
    this.ollamaClient.on('connected', (data) => {
      this.logger.info('Connected to Ollama', data);
    });
    
    this.ollamaClient.on('disconnected', (data) => {
      this.logger.warn('Disconnected from Ollama', data);
    });
    
    this.ollamaClient.on('endpoint-switched', (data) => {
      this.logger.info('Switched Ollama endpoint', data);
    });
    
    // Model manager events
    this.modelManager.on('model-switched', (data) => {
      this.logger.info('Switched model', data);
    });
    
    this.modelManager.on('model-pulled', (data) => {
      this.logger.info('Model pulled', data);
    });
    
    this.modelManager.on('usage-recorded', (data) => {
      this.logger.debug('Model usage recorded', data);
    });
  }

  /**
   * Extract operation type from arguments
   */
  protected override extractOperation(args: any): ServiceOperation {
    // Map Ollama operations to service operations
    const operationMap: Record<OllamaOperation, ServiceOperation> = {
      [OllamaOperation.GENERATE]: ServiceOperation.CREATE,
      [OllamaOperation.CODE]: ServiceOperation.CREATE,
      [OllamaOperation.MODEL]: ServiceOperation.UPDATE,
      [OllamaOperation.EXECUTE]: ServiceOperation.CREATE,
      [OllamaOperation.OPTIMIZE]: ServiceOperation.UPDATE,
      [OllamaOperation.EMBED]: ServiceOperation.CREATE
    };
    
    const ollamaOp = args.operation || OllamaOperation.GENERATE;
    return operationMap[ollamaOp as OllamaOperation] || ServiceOperation.READ;
  }

  /**
   * Test connection to Ollama
   */
  async testConnection(): Promise<boolean> {
    return await this.ollamaClient.testConnection();
  }

  /**
   * Get current model
   */
  getCurrentModel(): string {
    return this.modelManager.getCurrentModel();
  }

  /**
   * Switch to a different model
   */
  async switchModel(model: string): Promise<MCPResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.modelManager.switchModel(model);
      const duration = Date.now() - startTime;
      
      if (result.success) {
        return this.createSuccessResult({
          previousModel: result.previousModel,
          currentModel: result.currentModel,
          loadTime: result.loadTime
        }, {
          operation: 'model-switch',
          duration
        });
      } else {
        return this.createErrorResult(
          'MODEL_SWITCH_FAILED',
          result.error || 'Failed to switch model',
          { model }
        );
      }
    } catch (error) {
      return this.handleError(error, ServiceOperation.UPDATE);
    }
  }

  /**
   * Record model usage for performance tracking
   */
  protected recordModelUsage(
    model: string,
    duration: number,
    success: boolean = true
  ): void {
    this.modelManager.recordUsage(model, duration, success);
  }

  /**
   * Get the best model for a specific task
   */
  protected getBestModelForTask(task: string): string {
    return this.modelManager.getBestModelForTask(task);
  }

  /**
   * Generate text with the current or specified model
   */
  protected async generateText(
    prompt: string,
    model?: string,
    options?: any
  ): AsyncResult<string> {
    const startTime = Date.now();
    const targetModel = model || this.getCurrentModel();
    
    try {
      const response = await this.ollamaClient.generate(
        targetModel,
        prompt,
        {
          ...this.ollamaConfig.options,
          ...options
        }
      );
      
      const duration = Date.now() - startTime;
      this.recordModelUsage(targetModel, duration, true);
      
      return this.createSuccessResult(response.response, {
        model: targetModel,
        duration,
        tokens: response.eval_count
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordModelUsage(targetModel, duration, false);
      throw error;
    }
  }

  /**
   * Generate embeddings with the current or specified model
   */
  protected async generateEmbeddings(
    input: string | string[],
    model?: string
  ): AsyncResult<number[][]> {
    const startTime = Date.now();
    const targetModel = model || 'all-minilm:latest';
    
    try {
      const response = await this.ollamaClient.embed(targetModel, input);
      
      const duration = Date.now() - startTime;
      this.recordModelUsage(targetModel, duration, true);
      
      return this.createSuccessResult(response.embeddings, {
        model: targetModel,
        duration,
        count: response.embeddings.length
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordModelUsage(targetModel, duration, false);
      throw error;
    }
  }

  /**
   * Stream generate text (for tools that support streaming)
   */
  protected async *streamGenerateText(
    prompt: string,
    model?: string,
    options?: any
  ): AsyncGenerator<string> {
    const targetModel = model || this.getCurrentModel();
    const startTime = Date.now();
    
    try {
      const stream = this.ollamaClient.generateStream(
        targetModel,
        prompt,
        {
          ...this.ollamaConfig.options,
          ...options
        }
      );
      
      for await (const chunk of stream) {
        yield chunk.response;
        
        if (chunk.done) {
          const duration = Date.now() - startTime;
          this.recordModelUsage(targetModel, duration, true);
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordModelUsage(targetModel, duration, false);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  override async dispose(): Promise<void> {
    await super.dispose();
    
    // Remove event listeners
    this.ollamaClient.removeAllListeners();
    this.modelManager.removeAllListeners();
  }

  /**
   * Get health status including Ollama connection
   */
  override async getHealthStatus(): Promise<MCPResult<{ status: string; details: any }>> {
    const baseHealth = await super.getHealthStatus();
    
    if (!baseHealth.success) {
      return baseHealth;
    }
    
    const ollamaConnected = await this.testConnection();
    const currentModel = this.getCurrentModel();
    const modelInfo = await this.modelManager.getModelInfo(currentModel);
    
    return this.createSuccessResult({
      status: ollamaConnected ? 'healthy' : 'degraded',
      details: {
        ...baseHealth.data?.details,
        ollama: {
          connected: ollamaConnected,
          endpoint: this.ollamaClient.getCurrentEndpoint(),
          currentModel,
          modelInfo
        }
      }
    });
  }
}