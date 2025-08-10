/**
 * Routing Configuration Classes
 * Unified configuration system for MosAIc planning command routing
 * Integrates with existing TaskRouter and EnvironmentConfigLoader
 */

import { TaskType, RoutingPreferences } from '../types/routing';
import { EnvironmentConfigLoader, RoutingConfiguration } from './environment-loader';

export interface PlanningRoutingDecision {
  command: string;
  processingMode: 'local' | 'remote' | 'hybrid';
  model: string;
  confidence: number;
  reasoning: string;
  fallbackModel?: string;
  estimatedTime: number;
}

export interface CommandRoutingOptions {
  command: string;
  taskType: TaskType;
  complexity: number;
  content: string;
  overrideStrategy?: 'local' | 'remote' | 'hybrid';
  projectId?: string;
}

/**
 * Unified Routing Configuration Manager
 * Coordinates between environment variables, TaskRouter, and Planning Plugin agents
 */
export class PlanningRoutingConfig {
  private envLoader: EnvironmentConfigLoader;
  private routingConfig: RoutingConfiguration;

  constructor() {
    this.envLoader = EnvironmentConfigLoader.getInstance();
    this.routingConfig = this.envLoader.loadRoutingConfiguration();
  }

  /**
   * Get routing decision for a planning command
   * Integrates TaskRouter logic with planning-specific requirements
   */
  public async getRoutingDecision(options: CommandRoutingOptions): Promise<PlanningRoutingDecision> {
    const startTime = Date.now();

    // Check for command override
    let processingMode = options.overrideStrategy;
    if (!processingMode) {
      processingMode = this.determineProcessingMode(options);
    }

    // Select model based on processing mode and task type
    const model = this.selectModel(processingMode, options.taskType);
    const fallbackModel = this.getFallbackModel(processingMode);

    // Calculate confidence based on model availability and task complexity
    const confidence = await this.calculateConfidence(processingMode, options);

    // Generate reasoning
    const reasoning = this.generateReasoning(processingMode, options, model);

    // Estimate execution time
    const estimatedTime = this.estimateExecutionTime(processingMode, options);

    return {
      command: options.command,
      processingMode,
      model,
      confidence,
      reasoning,
      fallbackModel,
      estimatedTime
    };
  }

  /**
   * Determine processing mode based on configuration and command requirements
   */
  private determineProcessingMode(options: CommandRoutingOptions): 'local' | 'remote' | 'hybrid' {
    const strategy = this.routingConfig.strategy;

    // High complexity tasks might prefer remote for better quality
    if (options.complexity >= 4 && strategy === 'local-first') {
      return 'hybrid'; // Try local first but fallback to remote
    }

    // Code tasks prefer local codellama if available
    if (options.taskType === 'code' && strategy.includes('local')) {
      return 'local';
    }

    // Map strategy to processing mode
    switch (strategy) {
      case 'local-first':
      case 'hybrid':
        return 'hybrid';
      case 'local-only':
        return 'local';
      case 'remote-first':
      case 'remote-only':
        return 'remote';
      default:
        return 'hybrid';
    }
  }

  /**
   * Select appropriate model for processing mode and task type
   */
  private selectModel(processingMode: 'local' | 'remote' | 'hybrid', taskType: TaskType): string {
    if (processingMode === 'remote') {
      return this.getRemoteModel(taskType);
    }

    // For local and hybrid, use local models
    return this.getLocalModel(taskType);
  }

  /**
   * Get local model for task type based on user preferences
   */
  private getLocalModel(taskType: TaskType): string {
    const models = this.routingConfig.models;
    
    switch (taskType) {
      case 'code':
        return models.coding; // codellama:7b
      case 'analysis':
      case 'documentation':
      case 'general':
      default:
        return models.general; // llama3.2:3b
    }
  }

  /**
   * Get remote model for task type
   */
  private getRemoteModel(taskType: TaskType): string {
    // For now, use Claude for all remote tasks
    // Could be extended to use different models per task type
    return 'claude-3-5-sonnet-20241022';
  }

  /**
   * Get fallback model based on processing mode
   */
  private getFallbackModel(processingMode: 'local' | 'remote' | 'hybrid'): string | undefined {
    if (processingMode === 'local' && this.envLoader.isFallbackEnabled()) {
      return this.routingConfig.models.fallback; // gpt-oss
    }
    
    if (processingMode === 'remote' || processingMode === 'hybrid') {
      return this.routingConfig.models.fallback;
    }

    return undefined;
  }

  /**
   * Calculate confidence based on model availability and task complexity
   */
  private async calculateConfidence(
    processingMode: 'local' | 'remote' | 'hybrid',
    options: CommandRoutingOptions
  ): Promise<number> {
    let confidence = 0.7; // Base confidence

    // Adjust for processing mode
    if (processingMode === 'local') {
      // Would check Ollama availability in a real implementation
      confidence += 0.1;
    } else if (processingMode === 'remote') {
      confidence += 0.2; // Remote APIs are generally more reliable
    }

    // Adjust for task type alignment
    if (options.taskType === 'code' && processingMode === 'local') {
      confidence += 0.1; // codellama is good for code
    }

    // Adjust for complexity
    if (options.complexity >= 4 && processingMode === 'remote') {
      confidence += 0.1; // Remote models handle complexity better
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate reasoning for routing decision
   */
  private generateReasoning(
    processingMode: 'local' | 'remote' | 'hybrid',
    options: CommandRoutingOptions,
    model: string
  ): string {
    const reasons = [];

    reasons.push(`Strategy: ${this.routingConfig.strategy}`);
    reasons.push(`Processing mode: ${processingMode}`);
    reasons.push(`Selected model: ${model}`);

    if (options.taskType === 'code' && model.includes('codellama')) {
      reasons.push('CodeLlama optimized for coding tasks');
    }

    if (options.complexity >= 4) {
      reasons.push('High complexity task');
    }

    if (processingMode === 'local') {
      reasons.push('Local processing for cost efficiency');
    } else if (processingMode === 'remote') {
      reasons.push('Remote processing for maximum quality');
    } else {
      reasons.push('Hybrid approach with fallback capability');
    }

    return reasons.join(', ');
  }

  /**
   * Estimate execution time for routing decision
   */
  private estimateExecutionTime(
    processingMode: 'local' | 'remote' | 'hybrid',
    options: CommandRoutingOptions
  ): number {
    let baseTime = 15; // Base 15 seconds

    // Adjust for processing mode
    if (processingMode === 'local') {
      baseTime += 10; // Local models can be slower
    } else if (processingMode === 'remote') {
      baseTime += 5; // Remote APIs are typically faster
    } else {
      baseTime += 15; // Hybrid allows for fallback time
    }

    // Adjust for complexity
    baseTime += options.complexity * 5;

    // Adjust for content length
    const contentLength = options.content?.length || 0;
    baseTime += Math.floor(contentLength / 1000) * 2;

    // Adjust for task type
    if (options.taskType === 'code' || options.taskType === 'analysis') {
      baseTime += 10; // These tasks typically take longer
    }

    return baseTime;
  }

  /**
   * Get routing preferences compatible with TaskRouter
   */
  public getTaskRouterPreferences(): RoutingPreferences {
    return this.envLoader.toRoutingPreferences(this.routingConfig);
  }

  /**
   * Get current routing configuration
   */
  public getRoutingConfiguration(): RoutingConfiguration {
    return this.routingConfig;
  }

  /**
   * Reload configuration from environment variables
   */
  public reloadConfiguration(): void {
    this.routingConfig = this.envLoader.loadRoutingConfiguration();
    console.log('[ROUTING_CONFIG] Configuration reloaded from environment variables');
  }

  /**
   * Check if configuration is valid
   */
  public validateConfiguration(): { valid: boolean; issues: string[] } {
    const envValidation = this.envLoader.validateEnvironment();
    const issues: string[] = [];

    if (!envValidation.valid) {
      issues.push(`Missing environment variables: ${envValidation.missing.join(', ')}`);
    }

    // Validate model configurations
    const models = this.routingConfig.models;
    if (!models.coding || !models.general || !models.fallback) {
      issues.push('Missing required model configurations');
    }

    // Validate endpoints
    const endpoints = this.routingConfig.endpoints;
    if (!endpoints.ollama || !endpoints.remote) {
      issues.push('Missing required endpoint configurations');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

export default PlanningRoutingConfig;