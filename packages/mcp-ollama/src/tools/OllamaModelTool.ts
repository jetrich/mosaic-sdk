import { z } from 'zod';
import { OllamaTool } from './OllamaTool.js';
import { ModelInfo, ModelManagementResult } from '../types/index.js';

/**
 * Tool for managing Ollama models - list, pull, delete, and get model information
 * Provides comprehensive model lifecycle management capabilities
 */
export class OllamaModelTool extends OllamaTool {
  readonly name = 'ollama_model_manage';
  readonly toolName = 'ollama_model_manage';
  readonly description = 'Manage Ollama models: list, pull, delete, and get detailed model information';

  // Schema for model management operations
  readonly inputSchema = z.object({
    operation: z.enum([
      'list',           // List all available models
      'pull',           // Download/pull a model
      'delete',         // Delete a model
      'info',           // Get detailed model information
      'running',        // List currently running models
      'preload',        // Preload a model into memory
      'unload',         // Unload a model from memory
      'search',         // Search for models in registry
      'update',         // Update a model to latest version
      'copy',           // Copy/duplicate a model
      'stats'           // Get model usage statistics
    ]).describe('Model management operation to perform'),
    
    model: z.string().optional().describe('Model name for operations that target a specific model'),
    
    options: z.object({
      // Pull options
      insecure: z.boolean().optional().describe('Allow insecure connections when pulling'),
      stream: z.boolean().optional().describe('Stream pull progress'),
      
      // Search options
      query: z.string().optional().describe('Search query for finding models'),
      limit: z.number().optional().describe('Maximum number of results to return'),
      
      // Copy options
      destination: z.string().optional().describe('Destination model name for copy operation'),
      
      // Preload options
      keepAlive: z.string().optional().describe('How long to keep model loaded (e.g., "5m", "1h")'),
      
      // General options
      verbose: z.boolean().optional().describe('Include detailed information'),
      format: z.enum(['json', 'table', 'summary']).optional().describe('Output format')
    }).optional().describe('Operation-specific options')
  });

  protected async executeOperation(params: any): Promise<ModelManagementResult> {
    const request = this.inputSchema.parse(params);
    
    try {
      let result: ModelManagementResult;
      
      switch (request.operation) {
        case 'list':
          result = await this.listModels(request.options);
          break;
        case 'pull':
          result = await this.pullModel(request.model!, request.options);
          break;
        case 'delete':
          result = await this.deleteModel(request.model!, request.options);
          break;
        case 'info':
          result = await this.getModelInfo(request.model!, request.options);
          break;
        case 'running':
          result = await this.getRunningModels(request.options);
          break;
        case 'preload':
          result = await this.preloadModel(request.model!, request.options);
          break;
        case 'unload':
          result = await this.unloadModel(request.model!, request.options);
          break;
        case 'search':
          result = await this.searchModels(request.options?.query || '', request.options);
          break;
        case 'update':
          result = await this.updateModel(request.model!, request.options);
          break;
        case 'copy':
          result = await this.copyModel(request.model!, request.options?.destination!, request.options);
          break;
        case 'stats':
          result = await this.getModelStats(request.model, request.options);
          break;
        default:
          throw new Error(`Unsupported operation: ${request.operation}`);
      }
      
      this.logger.info('Model management operation completed', {
        operation: request.operation,
        model: request.model,
        success: result.success
      });
      
      return result;
      
    } catch (error) {
      this.logger.error('Model management operation failed', {
        operation: request.operation,
        model: request.model,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return {
        success: false,
        operation: request.operation,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * List all available models
   */
  private async listModels(options?: any): Promise<ModelManagementResult> {
    const response = await this.executeWithRetry(async () => {
      return await this.client.listModels();
    });

    if (!response.success) {
      throw new Error(`Failed to list models: ${response.error}`);
    }

    const models = response.data!.models || [];
    
    // Enhance with additional information if verbose
    let enhancedModels = models;
    if (options?.verbose) {
      enhancedModels = await Promise.all(
        models.map(async (model: ModelInfo) => {
          try {
            const infoResponse = await this.client.showModel(model.name);
            return {
              ...model,
              details: infoResponse.success ? infoResponse.data : null
            };
          } catch {
            return model;
          }
        })
      );
    }

    return {
      success: true,
      operation: 'list',
      data: {
        models: enhancedModels,
        count: enhancedModels.length,
        totalSize: enhancedModels.reduce((sum: number, model: any) => sum + (model.size || 0), 0)
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Pull/download a model
   */
  private async pullModel(modelName: string, options?: any): Promise<ModelManagementResult> {
    if (!modelName) {
      throw new Error('Model name is required for pull operation');
    }

    const pullOptions = {
      insecure: options?.insecure || false,
      stream: options?.stream || false
    };

    const response = await this.executeWithRetry(async () => {
      return await this.client.pullModel(modelName, pullOptions);
    });

    if (!response.success) {
      throw new Error(`Failed to pull model ${modelName}: ${response.error}`);
    }

    return {
      success: true,
      operation: 'pull',
      data: {
        model: modelName,
        status: 'completed',
        details: response.data
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Delete a model
   */
  private async deleteModel(modelName: string, options?: any): Promise<ModelManagementResult> {
    if (!modelName) {
      throw new Error('Model name is required for delete operation');
    }

    const response = await this.executeWithRetry(async () => {
      return await this.client.deleteModel(modelName);
    });

    if (!response.success) {
      throw new Error(`Failed to delete model ${modelName}: ${response.error}`);
    }

    return {
      success: true,
      operation: 'delete',
      data: {
        model: modelName,
        status: 'deleted'
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get detailed model information
   */
  private async getModelInfo(modelName: string, options?: any): Promise<ModelManagementResult> {
    if (!modelName) {
      throw new Error('Model name is required for info operation');
    }

    const response = await this.executeWithRetry(async () => {
      return await this.client.showModel(modelName);
    });

    if (!response.success) {
      throw new Error(`Failed to get model info for ${modelName}: ${response.error}`);
    }

    return {
      success: true,
      operation: 'info',
      data: {
        model: modelName,
        details: response.data
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get currently running models
   */
  private async getRunningModels(options?: any): Promise<ModelManagementResult> {
    const response = await this.executeWithRetry(async () => {
      return await this.client.getRunningModels();
    });

    if (!response.success) {
      throw new Error(`Failed to get running models: ${response.error}`);
    }

    const runningModels = response.data?.models || [];

    return {
      success: true,
      operation: 'running',
      data: {
        models: runningModels,
        count: runningModels.length
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Preload a model into memory
   */
  private async preloadModel(modelName: string, options?: any): Promise<ModelManagementResult> {
    if (!modelName) {
      throw new Error('Model name is required for preload operation');
    }

    // Preload by making a minimal generation request
    const response = await this.executeWithRetry(async () => {
      return await this.client.generate({
        model: modelName,
        prompt: 'test',
        stream: false,
        options: {
          num_predict: 1,
          temperature: 0
        },
        keep_alive: options?.keepAlive || '5m'
      });
    });

    if (!response.success) {
      throw new Error(`Failed to preload model ${modelName}: ${response.error}`);
    }

    return {
      success: true,
      operation: 'preload',
      data: {
        model: modelName,
        status: 'loaded',
        keepAlive: options?.keepAlive || '5m'
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Unload a model from memory
   */
  private async unloadModel(modelName: string, options?: any): Promise<ModelManagementResult> {
    if (!modelName) {
      throw new Error('Model name is required for unload operation');
    }

    // Unload by setting keep_alive to 0
    const response = await this.executeWithRetry(async () => {
      return await this.client.generate({
        model: modelName,
        prompt: '',
        stream: false,
        keep_alive: 0
      });
    });

    // Note: This might fail if model isn't loaded, which is OK
    return {
      success: true,
      operation: 'unload',
      data: {
        model: modelName,
        status: 'unloaded'
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Search for models (simplified implementation)
   */
  private async searchModels(query: string, options?: any): Promise<ModelManagementResult> {
    if (!query) {
      throw new Error('Search query is required');
    }

    // Get all models first
    const listResponse = await this.listModels();
    if (!listResponse.success) {
      throw new Error('Failed to search models');
    }

    const allModels = listResponse.data?.models || [];
    
    // Filter models based on query
    const filteredModels = allModels.filter((model: ModelInfo) => 
      model.name.toLowerCase().includes(query.toLowerCase()) ||
      (model.digest && model.digest.toLowerCase().includes(query.toLowerCase()))
    );

    // Apply limit
    const limit = options?.limit || 50;
    const results = filteredModels.slice(0, limit);

    return {
      success: true,
      operation: 'search',
      data: {
        query,
        models: results,
        count: results.length,
        totalMatches: filteredModels.length
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Update a model to latest version
   */
  private async updateModel(modelName: string, options?: any): Promise<ModelManagementResult> {
    if (!modelName) {
      throw new Error('Model name is required for update operation');
    }

    // Update is essentially re-pulling the model
    return await this.pullModel(modelName, options);
  }

  /**
   * Copy/duplicate a model
   */
  private async copyModel(sourceName: string, destinationName: string, options?: any): Promise<ModelManagementResult> {
    if (!sourceName || !destinationName) {
      throw new Error('Both source and destination model names are required for copy operation');
    }

    const response = await this.executeWithRetry(async () => {
      return await this.client.copyModel(sourceName, destinationName);
    });

    if (!response.success) {
      throw new Error(`Failed to copy model from ${sourceName} to ${destinationName}: ${response.error}`);
    }

    return {
      success: true,
      operation: 'copy',
      data: {
        source: sourceName,
        destination: destinationName,
        status: 'copied'
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get model usage statistics
   */
  private async getModelStats(modelName?: string, options?: any): Promise<ModelManagementResult> {
    try {
      // Get running models for current usage
      const runningResponse = await this.getRunningModels();
      const runningModels = runningResponse.data?.models || [];
      
      // Get all models for overview
      const listResponse = await this.listModels();
      const allModels = listResponse.data?.models || [];

      let stats: any = {
        totalModels: allModels.length,
        runningModels: runningModels.length,
        totalSize: allModels.reduce((sum: number, model: any) => sum + (model.size || 0), 0),
        availableModels: allModels.map((model: any) => ({
          name: model.name,
          size: model.size,
          modified: model.modified_at,
          running: runningModels.some((rm: any) => rm.name === model.name)
        }))
      };

      // If specific model requested, get detailed info
      if (modelName) {
        const modelInfoResponse = await this.getModelInfo(modelName);
        if (modelInfoResponse.success) {
          stats.modelDetails = modelInfoResponse.data;
        }
      }

      return {
        success: true,
        operation: 'stats',
        data: stats,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      throw new Error(`Failed to get model statistics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Format model information for display
   */
  formatModelInfo(models: ModelInfo[], format: string = 'json'): string {
    switch (format) {
      case 'table':
        return this.formatAsTable(models);
      case 'summary':
        return this.formatAsSummary(models);
      default:
        return JSON.stringify(models, null, 2);
    }
  }

  private formatAsTable(models: ModelInfo[]): string {
    if (models.length === 0) return 'No models available';
    
    const headers = ['Name', 'Size', 'Modified'];
    const rows = models.map(model => [
      model.name,
      this.formatSize(model.size || 0),
      model.modified_at ? new Date(model.modified_at).toLocaleDateString() : 'Unknown'
    ]);

    // Simple table formatting
    const maxLengths = headers.map((header, i) => 
      Math.max(header.length, ...rows.map(row => row[i].length))
    );

    const formatRow = (row: string[]) => 
      row.map((cell, i) => cell.padEnd(maxLengths[i])).join(' | ');

    return [
      formatRow(headers),
      maxLengths.map(len => '-'.repeat(len)).join('-|-'),
      ...rows.map(formatRow)
    ].join('\n');
  }

  private formatAsSummary(models: ModelInfo[]): string {
    if (models.length === 0) return 'No models available';
    
    const totalSize = models.reduce((sum, model) => sum + (model.size || 0), 0);
    
    return [
      `Total models: ${models.length}`,
      `Total size: ${this.formatSize(totalSize)}`,
      '',
      'Models:',
      ...models.map(model => `  • ${model.name} (${this.formatSize(model.size || 0)})`)
    ].join('\n');
  }

  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
  }
}