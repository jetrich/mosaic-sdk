/**
 * Task Router Interface for intelligent routing between providers
 * Extracted from mosaic-mcp router.ts
 */

import { TaskRequest, TaskResponse, RoutingPreferences, Provider } from './Provider';

export interface RoutingDecision {
  provider: string;
  model_type: 'local' | 'remote';
  model_name: string;
  confidence: number; // 0-1 scale
  reasoning: string;
  estimated_time: number; // seconds
  fallback_provider?: string;
  fallback_model?: string;
}

export interface TaskAnalysis {
  type: string;
  complexity: number;
  contentLength: number;
  hasCode: boolean;
  hasNumericalData: boolean;
  requiresCreativity: boolean;
  timeConstrained: boolean;
}

export interface ProviderPerformance {
  averageResponseTime: number;
  successRate: number;
  lastUsed: Date;
  taskCount: number;
  errorCount: number;
}

/**
 * Task Router interface for intelligent provider/model selection
 */
export interface TaskRouter {
  /**
   * Register a provider with the router
   */
  registerProvider(provider: Provider): void;
  
  /**
   * Unregister a provider
   */
  unregisterProvider(providerName: string): void;
  
  /**
   * Analyze task and route to optimal provider/model
   */
  routeTask(task: TaskRequest): Promise<RoutingDecision>;
  
  /**
   * Execute task with selected provider and model
   */
  executeTask(task: TaskRequest, routing?: RoutingDecision): Promise<TaskResponse>;
  
  /**
   * Get model recommendation for task type
   */
  recommendModel(taskType: string, complexity: number): Promise<string>;
  
  /**
   * Get provider performance metrics
   */
  getProviderPerformance(providerName: string): ProviderPerformance | null;
  
  /**
   * Update provider performance after task execution
   */
  updateProviderPerformance(
    providerName: string, 
    executionTime: number, 
    success: boolean
  ): void;
  
  /**
   * Get routing statistics
   */
  getRoutingStats(): {
    totalTasks: number;
    providerUsage: Record<string, number>;
    averageExecutionTime: number;
    successRate: number;
  };
}

/**
 * Task analysis helper interface
 */
export interface TaskAnalyzer {
  analyzeTask(task: TaskRequest): TaskAnalysis;
  detectCode(content: string): boolean;
  detectNumericalData(content: string): boolean;
  detectCreativityRequirement(content: string): boolean;
}

/**
 * Model selection strategy interface
 */
export interface ModelSelector {
  selectBestModel(
    analysis: TaskAnalysis,
    availableProviders: Provider[],
    preferences?: RoutingPreferences
  ): Promise<{ provider: Provider; model: string } | null>;
  
  calculateConfidence(
    analysis: TaskAnalysis,
    provider: Provider,
    model: string
  ): number;
  
  estimateExecutionTime(
    analysis: TaskAnalysis,
    provider: Provider,
    model: string
  ): number;
}