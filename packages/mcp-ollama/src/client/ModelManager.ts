/**
 * @fileoverview Model manager for Ollama model switching and management
 * @module @mosaicstack/mcp-ollama/client
 */

import { EventEmitter } from 'events';
import { OllamaClient } from './OllamaClient.js';
import {
  ModelInfo,
  ModelSwitchResult,
  OllamaError
} from '../types/index.js';

/**
 * Manages Ollama models including switching, loading, and performance tracking
 */
export class ModelManager extends EventEmitter {
  private client: OllamaClient;
  private currentModel: string;
  private modelAliases: Map<string, string>;
  private modelCache: Map<string, ModelInfo>;
  private performanceMetrics: Map<string, {
    totalRequests: number;
    totalDuration: number;
    errors: number;
    lastUsed: Date;
  }>;
  private autoLoadModels: Set<string>;

  constructor(
    client: OllamaClient,
    defaultModel: string,
    aliases?: Record<string, string>
  ) {
    super();
    this.client = client;
    this.currentModel = defaultModel;
    this.modelAliases = new Map(Object.entries(aliases || {}));
    this.modelCache = new Map();
    this.performanceMetrics = new Map();
    this.autoLoadModels = new Set([defaultModel]);
    
    // Initialize metrics for default model
    this.initializeMetrics(defaultModel);
  }

  /**
   * Initialize performance metrics for a model
   */
  private initializeMetrics(model: string): void {
    if (!this.performanceMetrics.has(model)) {
      this.performanceMetrics.set(model, {
        totalRequests: 0,
        totalDuration: 0,
        errors: 0,
        lastUsed: new Date()
      });
    }
  }

  /**
   * Resolve model alias to actual model name
   */
  resolveModel(modelOrAlias: string): string {
    return this.modelAliases.get(modelOrAlias) || modelOrAlias;
  }

  /**
   * Set model alias
   */
  setAlias(alias: string, model: string): void {
    this.modelAliases.set(alias, model);
    this.emit('alias-set', { alias, model });
  }

  /**
   * Remove model alias
   */
  removeAlias(alias: string): void {
    this.modelAliases.delete(alias);
    this.emit('alias-removed', { alias });
  }

  /**
   * Get all aliases
   */
  getAliases(): Record<string, string> {
    return Object.fromEntries(this.modelAliases);
  }

  /**
   * Get current model
   */
  getCurrentModel(): string {
    return this.currentModel;
  }

  /**
   * Switch to a different model
   */
  async switchModel(modelOrAlias: string): Promise<ModelSwitchResult> {
    const model = this.resolveModel(modelOrAlias);
    const previousModel = this.currentModel;
    
    if (model === this.currentModel) {
      return {
        success: true,
        previousModel,
        currentModel: model,
        loadTime: 0
      };
    }

    const startTime = Date.now();
    
    try {
      // Check if model exists
      const available = await this.isModelAvailable(model);
      if (!available) {
        // Try to pull the model
        await this.pullModel(model);
      }
      
      // Load the model
      await this.client.loadModel(model);
      
      const loadTime = Date.now() - startTime;
      this.currentModel = model;
      this.initializeMetrics(model);
      
      // Update cache
      await this.refreshModelInfo(model);
      
      this.emit('model-switched', {
        previousModel,
        currentModel: model,
        loadTime
      });
      
      return {
        success: true,
        previousModel,
        currentModel: model,
        loadTime
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        success: false,
        previousModel,
        currentModel: previousModel,
        error: errorMessage
      };
    }
  }

  /**
   * Check if a model is available
   */
  async isModelAvailable(modelOrAlias: string): Promise<boolean> {
    const model = this.resolveModel(modelOrAlias);
    
    try {
      const models = await this.client.listModels();
      return models.some(m => m.name === model || m.model === model);
    } catch (error) {
      return false;
    }
  }

  /**
   * List available models
   */
  async listAvailableModels(): Promise<ModelInfo[]> {
    const models = await this.client.listModels();
    const runningModels = await this.client.listRunningModels();
    const runningModelNames = new Set(runningModels.map(m => m.name));
    
    const modelInfos: ModelInfo[] = [];
    
    for (const model of models) {
      const metrics = this.performanceMetrics.get(model.name);
      
      const info: ModelInfo = {
        name: model.name,
        size: model.size,
        parameterSize: model.details.parameter_size,
        quantization: model.details.quantization_level,
        loaded: runningModelNames.has(model.name),
        lastUsed: metrics?.lastUsed,
        performance: metrics ? {
          avgResponseTime: metrics.totalRequests > 0 
            ? metrics.totalDuration / metrics.totalRequests 
            : 0,
          totalRequests: metrics.totalRequests,
          errorRate: metrics.totalRequests > 0 
            ? metrics.errors / metrics.totalRequests 
            : 0
        } : undefined
      };
      
      modelInfos.push(info);
      this.modelCache.set(model.name, info);
    }
    
    return modelInfos;
  }

  /**
   * Pull a model from the registry
   */
  async pullModel(modelOrAlias: string): Promise<void> {
    const model = this.resolveModel(modelOrAlias);
    
    this.emit('model-pull-started', { model });
    
    await this.client.pullModel(model, (progress) => {
      this.emit('model-pull-progress', { model, progress });
    });
    
    await this.refreshModelInfo(model);
    this.emit('model-pull-completed', { model });
  }

  /**
   * Delete a model
   */
  async deleteModel(modelOrAlias: string, force: boolean = false): Promise<void> {
    const model = this.resolveModel(modelOrAlias);
    
    if (model === this.currentModel && !force) {
      throw new OllamaError(
        'Cannot delete current model',
        'MODEL_IN_USE',
        { model }
      );
    }
    
    await this.client.deleteModel(model);
    
    this.modelCache.delete(model);
    this.performanceMetrics.delete(model);
    this.autoLoadModels.delete(model);
    
    // Remove aliases pointing to this model
    for (const [alias, target] of this.modelAliases) {
      if (target === model) {
        this.modelAliases.delete(alias);
      }
    }
    
    this.emit('model-deleted', { model });
  }

  /**
   * Get model information
   */
  async getModelInfo(modelOrAlias: string): Promise<ModelInfo | null> {
    const model = this.resolveModel(modelOrAlias);
    
    // Check cache first
    if (this.modelCache.has(model)) {
      return this.modelCache.get(model)!;
    }
    
    // Refresh and return
    return await this.refreshModelInfo(model);
  }

  /**
   * Refresh model information
   */
  private async refreshModelInfo(model: string): Promise<ModelInfo | null> {
    try {
      const models = await this.client.listModels();
      const modelData = models.find(m => m.name === model || m.model === model);
      
      if (!modelData) {
        return null;
      }
      
      const runningModels = await this.client.listRunningModels();
      const isLoaded = runningModels.some(m => m.name === model);
      
      const metrics = this.performanceMetrics.get(model);
      
      const info: ModelInfo = {
        name: modelData.name,
        size: modelData.size,
        parameterSize: modelData.details.parameter_size,
        quantization: modelData.details.quantization_level,
        loaded: isLoaded,
        lastUsed: metrics?.lastUsed,
        performance: metrics ? {
          avgResponseTime: metrics.totalRequests > 0 
            ? metrics.totalDuration / metrics.totalRequests 
            : 0,
          totalRequests: metrics.totalRequests,
          errorRate: metrics.totalRequests > 0 
            ? metrics.errors / metrics.totalRequests 
            : 0
        } : undefined
      };
      
      this.modelCache.set(model, info);
      return info;
    } catch (error) {
      return null;
    }
  }

  /**
   * Record model usage for performance tracking
   */
  recordUsage(
    modelOrAlias: string,
    duration: number,
    success: boolean = true
  ): void {
    const model = this.resolveModel(modelOrAlias);
    const metrics = this.performanceMetrics.get(model);
    
    if (!metrics) {
      this.initializeMetrics(model);
      return this.recordUsage(model, duration, success);
    }
    
    metrics.totalRequests++;
    metrics.totalDuration += duration;
    if (!success) {
      metrics.errors++;
    }
    metrics.lastUsed = new Date();
    
    this.emit('usage-recorded', {
      model,
      duration,
      success,
      metrics: {
        avgResponseTime: metrics.totalDuration / metrics.totalRequests,
        totalRequests: metrics.totalRequests,
        errorRate: metrics.errors / metrics.totalRequests
      }
    });
  }

  /**
   * Get performance metrics for a model
   */
  getPerformanceMetrics(modelOrAlias: string): any | null {
    const model = this.resolveModel(modelOrAlias);
    const metrics = this.performanceMetrics.get(model);
    
    if (!metrics) {
      return null;
    }
    
    return {
      model,
      totalRequests: metrics.totalRequests,
      avgResponseTime: metrics.totalRequests > 0 
        ? metrics.totalDuration / metrics.totalRequests 
        : 0,
      errorRate: metrics.totalRequests > 0 
        ? metrics.errors / metrics.totalRequests 
        : 0,
      lastUsed: metrics.lastUsed
    };
  }

  /**
   * Preload models for faster switching
   */
  async preloadModels(models: string[]): Promise<void> {
    const loadPromises = models.map(async (modelOrAlias) => {
      const model = this.resolveModel(modelOrAlias);
      
      try {
        const available = await this.isModelAvailable(model);
        if (available) {
          await this.client.loadModel(model);
          this.autoLoadModels.add(model);
          this.emit('model-preloaded', { model });
        }
      } catch (error) {
        this.emit('model-preload-failed', { model, error });
      }
    });
    
    await Promise.allSettled(loadPromises);
  }

  /**
   * Get the best model for a specific task
   */
  getBestModelForTask(task: 'code' | 'chat' | 'embedding' | string): string {
    // This could be enhanced with more sophisticated logic
    const taskModels: Record<string, string> = {
      code: 'codellama:latest',
      chat: 'llama3.2:latest',
      embedding: 'all-minilm:latest'
    };
    
    const recommended = taskModels[task];
    if (recommended) {
      // Check if we have an alias for this
      for (const [alias, model] of this.modelAliases) {
        if (alias === task) {
          return model;
        }
      }
      return recommended;
    }
    
    return this.currentModel;
  }

  /**
   * Clear model cache
   */
  clearCache(): void {
    this.modelCache.clear();
    this.emit('cache-cleared');
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(modelOrAlias?: string): void {
    if (modelOrAlias) {
      const model = this.resolveModel(modelOrAlias);
      this.performanceMetrics.delete(model);
      this.initializeMetrics(model);
    } else {
      this.performanceMetrics.clear();
    }
    
    this.emit('metrics-reset', { model: modelOrAlias });
  }
}