/**
 * @fileoverview Ollama API client for interacting with local/remote Ollama instances
 * @module @mosaicstack/mcp-ollama/client
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { EventEmitter } from 'events';
import {
  OllamaGenerateResponse,
  OllamaStreamResponse,
  OllamaModel,
  OllamaEmbeddingResponse,
  OllamaOptions,
  ConnectionError,
  ModelNotFoundError,
  OllamaError
} from '../types/index.js';

/**
 * Client for interacting with Ollama API
 */
export class OllamaClient extends EventEmitter {
  private axios: AxiosInstance;
  private endpoint: string;
  private fallbackEndpoint?: string;
  private currentEndpoint: string;
  private isConnected: boolean = false;
  private connectionRetries: number = 0;
  private maxRetries: number = 3;

  constructor(endpoint: string, fallbackEndpoint?: string) {
    super();
    this.endpoint = endpoint;
    this.fallbackEndpoint = fallbackEndpoint;
    this.currentEndpoint = endpoint;
    
    this.axios = axios.create({
      baseURL: this.currentEndpoint,
      timeout: 120000, // 2 minutes for long generations
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  /**
   * Set up axios interceptors for error handling and retry logic
   */
  private setupInterceptors(): void {
    this.axios.interceptors.response.use(
      response => response,
      async error => {
        if (this.shouldRetryWithFallback(error)) {
          return this.retryWithFallback(error.config);
        }
        throw this.handleError(error);
      }
    );
  }

  /**
   * Check if we should retry with fallback endpoint
   */
  private shouldRetryWithFallback(error: AxiosError): boolean {
    if (!this.fallbackEndpoint || this.connectionRetries >= this.maxRetries) {
      return false;
    }
    
    return error.code === 'ECONNREFUSED' || 
           error.code === 'ETIMEDOUT' ||
           error.response?.status === 503;
  }

  /**
   * Retry request with fallback endpoint
   */
  private async retryWithFallback(config: any): Promise<any> {
    if (!this.fallbackEndpoint) {
      throw new ConnectionError(this.currentEndpoint);
    }

    this.connectionRetries++;
    this.currentEndpoint = this.fallbackEndpoint;
    this.axios.defaults.baseURL = this.currentEndpoint;
    
    this.emit('endpoint-switched', {
      from: this.endpoint,
      to: this.fallbackEndpoint,
      reason: 'connection-failure'
    });

    try {
      const response = await this.axios.request(config);
      this.connectionRetries = 0; // Reset on success
      return response;
    } catch (error) {
      this.connectionRetries = 0;
      throw this.handleError(error as AxiosError);
    }
  }

  /**
   * Handle and transform axios errors
   */
  private handleError(error: AxiosError): Error {
    if (error.code === 'ECONNREFUSED') {
      return new ConnectionError(this.currentEndpoint, { code: error.code });
    }
    
    if (error.response?.status === 404) {
      const message = (error.response.data as any)?.error || 'Resource not found';
      if (message.includes('model')) {
        const modelMatch = message.match(/'([^']+)'/);
        return new ModelNotFoundError(modelMatch?.[1] || 'unknown');
      }
    }
    
    return new OllamaError(
      error.message,
      error.code || 'UNKNOWN_ERROR',
      error.response?.data
    );
  }

  /**
   * Test connection to Ollama
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.axios.get('/api/version');
      this.isConnected = true;
      this.emit('connected', { endpoint: this.currentEndpoint });
      return true;
    } catch (error) {
      this.isConnected = false;
      this.emit('disconnected', { endpoint: this.currentEndpoint, error });
      return false;
    }
  }

  /**
   * Generate text completion
   */
  async generate(
    model: string,
    prompt: string,
    options?: OllamaOptions & { system?: string; format?: any; suffix?: string }
  ): Promise<OllamaGenerateResponse> {
    const response = await this.axios.post<OllamaGenerateResponse>('/api/generate', {
      model,
      prompt,
      stream: false,
      ...options
    });
    
    return response.data;
  }

  /**
   * Generate text completion with streaming
   */
  async *generateStream(
    model: string,
    prompt: string,
    options?: OllamaOptions & { system?: string; format?: any }
  ): AsyncGenerator<OllamaStreamResponse> {
    const response = await this.axios.post('/api/generate', {
      model,
      prompt,
      stream: true,
      ...options
    }, {
      responseType: 'stream'
    });

    const stream = response.data;
    let buffer = '';

    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            yield data;
            
            if (data.done) {
              return;
            }
          } catch (error) {
            console.error('Failed to parse stream chunk:', line);
          }
        }
      }
    }
  }

  /**
   * Generate embeddings
   */
  async embed(
    model: string,
    input: string | string[]
  ): Promise<OllamaEmbeddingResponse> {
    const response = await this.axios.post<OllamaEmbeddingResponse>('/api/embed', {
      model,
      input
    });
    
    return response.data;
  }

  /**
   * List available models
   */
  async listModels(): Promise<OllamaModel[]> {
    const response = await this.axios.get<{ models: OllamaModel[] }>('/api/tags');
    return response.data.models || [];
  }

  /**
   * Get model information
   */
  async showModel(model: string): Promise<any> {
    const response = await this.axios.post('/api/show', { model });
    return response.data;
  }

  /**
   * Pull a model from the registry
   */
  async pullModel(model: string, onProgress?: (progress: any) => void): Promise<void> {
    const response = await this.axios.post('/api/pull', {
      model,
      stream: true
    }, {
      responseType: 'stream'
    });

    const stream = response.data;
    let buffer = '';

    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            if (onProgress) {
              onProgress(data);
            }
            
            if (data.status === 'success') {
              this.emit('model-pulled', { model });
              return;
            }
          } catch (error) {
            console.error('Failed to parse pull progress:', line);
          }
        }
      }
    }
  }

  /**
   * Delete a model
   */
  async deleteModel(model: string): Promise<void> {
    await this.axios.delete('/api/delete', { data: { model } });
    this.emit('model-deleted', { model });
  }

  /**
   * Copy a model
   */
  async copyModel(source: string, destination: string): Promise<void> {
    await this.axios.post('/api/copy', { source, destination });
    this.emit('model-copied', { source, destination });
  }

  /**
   * Create a custom model
   */
  async createModel(
    name: string,
    modelfile: string,
    onProgress?: (progress: any) => void
  ): Promise<void> {
    const response = await this.axios.post('/api/create', {
      name,
      modelfile,
      stream: true
    }, {
      responseType: 'stream'
    });

    const stream = response.data;
    let buffer = '';

    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            if (onProgress) {
              onProgress(data);
            }
            
            if (data.status === 'success') {
              this.emit('model-created', { name });
              return;
            }
          } catch (error) {
            console.error('Failed to parse create progress:', line);
          }
        }
      }
    }
  }

  /**
   * List running models
   */
  async listRunningModels(): Promise<any[]> {
    const response = await this.axios.get('/api/ps');
    return response.data.models || [];
  }

  /**
   * Load a model into memory
   */
  async loadModel(model: string): Promise<void> {
    await this.generate(model, '', { num_predict: 0 });
    this.emit('model-loaded', { model });
  }

  /**
   * Unload a model from memory
   */
  async unloadModel(model: string): Promise<void> {
    // Ollama doesn't have a direct unload API, but we can set keep_alive to 0
    await this.axios.post('/api/generate', {
      model,
      prompt: '',
      keep_alive: '0s'
    });
    this.emit('model-unloaded', { model });
  }

  /**
   * Get current endpoint
   */
  getCurrentEndpoint(): string {
    return this.currentEndpoint;
  }

  /**
   * Check if connected
   */
  isConnectedToOllama(): boolean {
    return this.isConnected;
  }

  /**
   * Switch to a different endpoint
   */
  async switchEndpoint(endpoint: string): Promise<boolean> {
    const previousEndpoint = this.currentEndpoint;
    this.currentEndpoint = endpoint;
    this.axios.defaults.baseURL = endpoint;
    
    const connected = await this.testConnection();
    
    if (connected) {
      this.emit('endpoint-switched', {
        from: previousEndpoint,
        to: endpoint,
        reason: 'manual'
      });
    } else {
      // Revert on failure
      this.currentEndpoint = previousEndpoint;
      this.axios.defaults.baseURL = previousEndpoint;
    }
    
    return connected;
  }
}