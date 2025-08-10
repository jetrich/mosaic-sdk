/**
 * Ollama Provider Implementation
 * Extracted and refactored from mosaic-mcp ollama services
 */

import { Ollama } from 'ollama';
import {
  Provider,
  ProviderConfig,
  ProviderStatus,
  ModelInfo,
  ChatMessage,
  TaskContext,
  TaskResponse,
} from '../../interfaces/Provider';

export interface OllamaConfig extends ProviderConfig {
  host: string;
  timeout?: number;
  retryAttempts?: number;
  healthCheckInterval?: number;
}

export interface OllamaModelInfo {
  name: string;
  model: string;
  modified_at: Date;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaChatResponse {
  message: {
    role: string;
    content: string;
  };
  created_at: Date;
  model: string;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export class OllamaConnectionError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'OllamaConnectionError';
  }
}

export class OllamaModelError extends Error {
  constructor(message: string, public modelName?: string) {
    super(message);
    this.name = 'OllamaModelError';
  }
}

/**
 * Ollama Provider for local LLM integration
 */
export class OllamaProvider implements Provider {
  readonly name = 'ollama';
  readonly type = 'local' as const;
  
  private client!: Ollama;
  private config!: Required<OllamaConfig>;
  private lastHealthCheck: Date | null = null;
  private healthStatus: ProviderStatus = {
    status: 'offline',
    message: 'Not initialized',
    last_checked: new Date(),
  };

  async initialize(config: ProviderConfig): Promise<void> {
    if (config.name !== 'ollama') {
      throw new Error('Invalid config for Ollama provider');
    }
    
    const ollamaConfig = config as OllamaConfig;
    this.validateConfig(ollamaConfig);
    
    this.config = {
      ...ollamaConfig,
      timeout: ollamaConfig.timeout ?? 30000,
      retryAttempts: ollamaConfig.retryAttempts ?? 3,
      healthCheckInterval: ollamaConfig.healthCheckInterval ?? 60000,
    };

    this.client = new Ollama({
      host: this.config.host,
    });

    // Perform initial health check
    await this.getStatus();
  }

  private validateConfig(config: OllamaConfig): void {
    if (!config.host) {
      throw new Error('Ollama host is required');
    }

    try {
      new URL(config.host);
    } catch {
      throw new Error(`Invalid Ollama host URL: ${config.host}`);
    }
  }

  async getStatus(): Promise<ProviderStatus> {
    try {
      const models = await this.listModels();
      
      this.healthStatus = {
        status: 'online',
        message: 'Ollama server is responding',
        last_checked: new Date(),
        models_available: models.length,
        capabilities: this.getCapabilities(),
      };
    } catch (error) {
      this.healthStatus = {
        status: 'offline',
        message: error instanceof Error ? error.message : 'Unknown error',
        last_checked: new Date(),
        models_available: 0,
      };
    }

    this.lastHealthCheck = new Date();
    return this.healthStatus;
  }

  async listModels(): Promise<ModelInfo[]> {
    try {
      const response = await this.withRetry(
        () => this.client.list(),
        'List models'
      );

      return response.models.map((model: any) => ({
        name: model.name,
        size: model.size,
        family: model.details?.family || 'unknown',
        capabilities: this.getModelCapabilities(model.name),
        performance_score: this.calculatePerformanceScore(model),
      }));
    } catch (error) {
      throw new OllamaConnectionError(
        `Failed to list models: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async isModelAvailable(modelName: string): Promise<boolean> {
    try {
      const models = await this.listModels();
      return models.some(model => model.name === modelName);
    } catch {
      return false;
    }
  }

  async chat(
    model: string,
    messages: ChatMessage[],
    context?: TaskContext,
    options?: Record<string, any>
  ): Promise<TaskResponse> {
    const startTime = Date.now();
    
    try {
      // Add context as system message if provided
      const contextualMessages = context?.previous_context 
        ? [
            { role: 'system' as const, content: `Context: ${context.previous_context}` },
            ...messages
          ]
        : messages;

      const response = await this.withRetry(
        () => this.client.chat({
          model,
          messages: contextualMessages,
          stream: false,
          options: options || {},
        }),
        `Chat with model ${model}`
      );

      const typedResponse = response as unknown as OllamaChatResponse;

      return {
        content: typedResponse.message.content,
        model_used: model,
        execution_time: Date.now() - startTime,
        token_count: typedResponse.eval_count,
        success: true,
        provider: this.name,
      };
    } catch (error) {
      return {
        content: '',
        model_used: model,
        execution_time: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        provider: this.name,
      };
    }
  }

  async *chatStream(
    model: string,
    messages: ChatMessage[],
    context?: TaskContext,
    options?: Record<string, any>
  ): AsyncGenerator<Partial<TaskResponse>> {
    const startTime = Date.now();
    
    try {
      const contextualMessages = context?.previous_context 
        ? [
            { role: 'system' as const, content: `Context: ${context.previous_context}` },
            ...messages
          ]
        : messages;

      const stream = await this.client.chat({
        model,
        messages: contextualMessages,
        stream: true,
        options: options || {},
      });

      for await (const chunk of stream) {
        const typedChunk = chunk as unknown as OllamaChatResponse;
        yield {
          content: typedChunk.message.content,
          model_used: model,
          execution_time: Date.now() - startTime,
          success: true,
          provider: this.name,
        };
      }
    } catch (error) {
      yield {
        content: '',
        model_used: model,
        execution_time: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        provider: this.name,
      };
    }
  }

  getCapabilities(): string[] {
    return [
      'chat',
      'completion',
      'streaming',
      'local_execution',
      'code_generation',
      'analysis',
      'documentation',
    ];
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.list();
      return true;
    } catch {
      return false;
    }
  }

  async dispose(): Promise<void> {
    // Ollama client doesn't require explicit cleanup
    this.healthStatus = {
      status: 'offline',
      message: 'Provider disposed',
      last_checked: new Date(),
    };
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.config.retryAttempts) {
          break;
        }

        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new OllamaConnectionError(
      `${operationName} failed after ${this.config.retryAttempts} attempts: ${lastError!.message}`,
      lastError!
    );
  }

  private getModelCapabilities(modelName: string): string[] {
    const capabilities = ['chat', 'completion'];
    
    if (modelName.includes('codellama') || modelName.includes('code')) {
      capabilities.push('code_generation', 'code_analysis');
    }
    
    if (modelName.includes('llama') || modelName.includes('mistral')) {
      capabilities.push('analysis', 'reasoning');
    }
    
    return capabilities;
  }

  private calculatePerformanceScore(model: any): number {
    // Base score calculation - can be enhanced with real metrics
    let score = 0.7;
    
    if (model.name.includes('70b')) score += 0.2;
    else if (model.name.includes('13b')) score += 0.1;
    else if (model.name.includes('7b')) score += 0.05;
    
    if (model.name.includes('codellama')) score += 0.1;
    
    return Math.min(score, 1.0);
  }
}

// Common Ollama model names
export const OLLAMA_MODELS = {
  LLAMA3_1: 'llama3.1',
  LLAMA3_1_8B: 'llama3.1:8b',
  LLAMA3_1_70B: 'llama3.1:70b',
  CODELLAMA: 'codellama',
  CODELLAMA_7B: 'codellama:7b',
  CODELLAMA_13B: 'codellama:13b',
  MISTRAL: 'mistral',
  MISTRAL_7B: 'mistral:7b',
  GEMMA2: 'gemma2',
  GEMMA2_9B: 'gemma2:9b',
} as const;

export type OllamaModelName = typeof OLLAMA_MODELS[keyof typeof OLLAMA_MODELS];