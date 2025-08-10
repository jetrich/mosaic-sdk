/**
 * Task Router Implementation
 * Intelligent routing of tasks between multiple providers
 * Extracted and enhanced from mosaic-mcp router.ts
 */

import {
  TaskRouter,
  RoutingDecision,
  TaskAnalysis,
  ProviderPerformance,
  TaskAnalyzer,
  ModelSelector,
} from '../interfaces/TaskRouter';
import {
  Provider,
  TaskRequest,
  TaskResponse,
  RoutingPreferences,
  TaskType,
} from '../interfaces/Provider';

export class TaskRouterImpl implements TaskRouter {
  private providers: Map<string, Provider> = new Map();
  private performanceCache: Map<string, ProviderPerformance> = new Map();
  private taskAnalyzer: TaskAnalyzer = new TaskAnalyzerImpl();
  private modelSelector: ModelSelector = new ModelSelectorImpl();
  private routingStats = {
    totalTasks: 0,
    providerUsage: {} as Record<string, number>,
    totalExecutionTime: 0,
    successfulTasks: 0,
  };

  registerProvider(provider: Provider): void {
    this.providers.set(provider.name, provider);
    
    if (!this.performanceCache.has(provider.name)) {
      this.performanceCache.set(provider.name, {
        averageResponseTime: 0,
        successRate: 1.0,
        lastUsed: new Date(),
        taskCount: 0,
        errorCount: 0,
      });
    }
  }

  unregisterProvider(providerName: string): void {
    this.providers.delete(providerName);
    this.performanceCache.delete(providerName);
  }

  async routeTask(task: TaskRequest): Promise<RoutingDecision> {
    try {
      // Analyze the task
      const analysis = this.taskAnalyzer.analyzeTask(task);
      
      // Get available providers
      const availableProviders = await this.getAvailableProviders();
      
      if (availableProviders.length === 0) {
        throw new Error('No providers available');
      }

      // Select best provider and model
      const selection = await this.modelSelector.selectBestModel(
        analysis,
        availableProviders,
        task.preferences
      );

      if (!selection) {
        throw new Error('No suitable provider/model found');
      }

      const { provider, model } = selection;
      
      // Calculate routing decision
      const confidence = this.modelSelector.calculateConfidence(analysis, provider, model);
      const estimatedTime = this.modelSelector.estimateExecutionTime(analysis, provider, model);
      const reasoning = this.generateReasoning(analysis, provider, model);

      // Determine fallback
      const fallback = await this.selectFallbackProvider(provider.name, availableProviders);

      return {
        provider: provider.name,
        model_type: provider.type,
        model_name: model,
        confidence,
        reasoning,
        estimated_time: estimatedTime,
        fallback_provider: fallback?.name,
        fallback_model: fallback ? await this.getDefaultModel(fallback) : undefined,
      };

    } catch (error) {
      return this.createEmergencyFallback(task, error instanceof Error ? error.message : String(error));
    }
  }

  async executeTask(task: TaskRequest, routing?: RoutingDecision): Promise<TaskResponse> {
    const startTime = Date.now();
    let decision = routing;

    // Route the task if no routing decision provided
    if (!decision) {
      decision = await this.routeTask(task);
    }

    try {
      const provider = this.providers.get(decision.provider);
      if (!provider) {
        throw new Error(`Provider ${decision.provider} not found`);
      }

      // Execute the task
      const response = await provider.chat(
        decision.model_name,
        [{ role: 'user', content: task.content }],
        {
          project_id: task.project_id,
          task_type: task.type,
          complexity: task.complexity,
          previous_context: task.context,
        }
      );

      // Update statistics
      this.updateStats(decision.provider, Date.now() - startTime, response.success);
      this.updateProviderPerformance(decision.provider, response.execution_time, response.success);

      return response;

    } catch (error) {
      // Try fallback if available and enabled
      if (decision.fallback_provider && task.preferences?.fallback_enabled) {
        try {
          const fallbackProvider = this.providers.get(decision.fallback_provider);
          if (fallbackProvider && decision.fallback_model) {
            const fallbackResponse = await fallbackProvider.chat(
              decision.fallback_model,
              [{ role: 'user', content: task.content }],
              {
                project_id: task.project_id,
                task_type: task.type,
                complexity: task.complexity,
                previous_context: task.context,
              }
            );

            this.updateStats(decision.fallback_provider, Date.now() - startTime, fallbackResponse.success);
            this.updateProviderPerformance(decision.fallback_provider, fallbackResponse.execution_time, fallbackResponse.success);

            return fallbackResponse;
          }
        } catch (fallbackError) {
          // Fallback failed, continue with original error
        }
      }

      // Return error response
      const executionTime = Date.now() - startTime;
      this.updateStats(decision.provider, executionTime, false);
      this.updateProviderPerformance(decision.provider, executionTime, false);

      return {
        content: '',
        model_used: decision.model_name,
        execution_time: executionTime,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        provider: decision.provider,
      };
    }
  }

  async recommendModel(taskType: string, complexity: number): Promise<string> {
    const modelMap: Record<string, string[]> = {
      code: ['codellama', 'codellama:7b', 'claude-3-sonnet'],
      analysis: ['llama3.1', 'claude-3-opus', 'mistral'],
      documentation: ['llama3.1', 'claude-3-sonnet', 'gemma2'],
      general: ['llama3.1', 'claude-3-sonnet', 'mistral'],
    };

    const candidates = modelMap[taskType] || modelMap.general;
    
    // For high complexity tasks, prefer larger/better models
    if (complexity >= 4) {
      const powerfulModels = candidates.filter(model => 
        model.includes('70b') || 
        model.includes('opus') || 
        model.includes('claude-3') ||
        model === 'llama3.1'
      );
      if (powerfulModels.length > 0) {
        return powerfulModels[0]!;
      }
    }

    // Check which models are actually available
    try {
      for (const candidate of candidates) {
        for (const provider of this.providers.values()) {
          if (await provider.isModelAvailable(candidate)) {
            return candidate;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to check model availability:', error);
    }

    return candidates[0] || 'llama3.1';
  }

  getProviderPerformance(providerName: string): ProviderPerformance | null {
    return this.performanceCache.get(providerName) || null;
  }

  updateProviderPerformance(providerName: string, executionTime: number, success: boolean): void {
    const current = this.performanceCache.get(providerName);
    if (!current) return;

    const taskCount = current.taskCount + 1;
    const errorCount = success ? current.errorCount : current.errorCount + 1;
    
    // Calculate rolling average
    const averageResponseTime = (current.averageResponseTime * current.taskCount + executionTime) / taskCount;
    const successRate = (taskCount - errorCount) / taskCount;

    this.performanceCache.set(providerName, {
      averageResponseTime,
      successRate,
      lastUsed: new Date(),
      taskCount,
      errorCount,
    });
  }

  getRoutingStats() {
    return {
      totalTasks: this.routingStats.totalTasks,
      providerUsage: { ...this.routingStats.providerUsage },
      averageExecutionTime: this.routingStats.totalTasks > 0 
        ? this.routingStats.totalExecutionTime / this.routingStats.totalTasks 
        : 0,
      successRate: this.routingStats.totalTasks > 0 
        ? this.routingStats.successfulTasks / this.routingStats.totalTasks 
        : 0,
    };
  }

  private async getAvailableProviders(): Promise<Provider[]> {
    const available: Provider[] = [];
    
    for (const provider of this.providers.values()) {
      try {
        const status = await provider.getStatus();
        if (status.status === 'online') {
          available.push(provider);
        }
      } catch {
        // Provider unavailable
      }
    }
    
    return available;
  }

  private async selectFallbackProvider(primaryProvider: string, availableProviders: Provider[]): Promise<Provider | null> {
    // Select a different provider as fallback
    const fallbackCandidates = availableProviders.filter(p => p.name !== primaryProvider);
    
    if (fallbackCandidates.length === 0) {
      return null;
    }

    // Prefer remote providers as fallback for local providers and vice versa
    const primary = this.providers.get(primaryProvider);
    if (primary) {
      const preferredType = primary.type === 'local' ? 'remote' : 'local';
      const preferredFallback = fallbackCandidates.find(p => p.type === preferredType);
      if (preferredFallback) {
        return preferredFallback;
      }
    }

    return fallbackCandidates[0] || null;
  }

  private async getDefaultModel(provider: Provider): Promise<string> {
    try {
      const models = await provider.listModels();
      return models[0]?.name || 'default';
    } catch {
      return 'default';
    }
  }

  private generateReasoning(analysis: TaskAnalysis, provider: Provider, model: string): string {
    const reasons = [];
    
    if (analysis.type === 'code' && model.includes('codellama')) {
      reasons.push('CodeLlama specialized for code tasks');
    }
    
    if (analysis.timeConstrained && provider.type === 'local') {
      reasons.push('Local provider for fast response');
    }
    
    if (analysis.complexity >= 4 && (model.includes('opus') || model.includes('70b'))) {
      reasons.push('High-capability model for complex task');
    }
    
    if (provider.type === 'local') {
      reasons.push('Local execution available');
    } else {
      reasons.push('Remote provider for enhanced capabilities');
    }
    
    return reasons.join(', ');
  }

  private createEmergencyFallback(task: TaskRequest, reason: string): RoutingDecision {
    return {
      provider: 'claude',
      model_type: 'remote',
      model_name: 'claude-3-sonnet',
      confidence: 0.5,
      reasoning: `Emergency fallback: ${reason}`,
      estimated_time: 20,
    };
  }

  private updateStats(provider: string, executionTime: number, success: boolean): void {
    this.routingStats.totalTasks++;
    this.routingStats.providerUsage[provider] = (this.routingStats.providerUsage[provider] || 0) + 1;
    this.routingStats.totalExecutionTime += executionTime;
    if (success) {
      this.routingStats.successfulTasks++;
    }
  }
}

/**
 * Task Analyzer Implementation
 */
class TaskAnalyzerImpl implements TaskAnalyzer {
  analyzeTask(task: TaskRequest): TaskAnalysis {
    return {
      type: task.type,
      complexity: task.complexity,
      contentLength: task.content.length,
      hasCode: this.detectCode(task.content),
      hasNumericalData: this.detectNumericalData(task.content),
      requiresCreativity: this.detectCreativityRequirement(task.content),
      timeConstrained: task.preferences?.max_response_time ? task.preferences.max_response_time < 30 : false,
    };
  }

  detectCode(content: string): boolean {
    const codeIndicators = [
      /```[\s\S]*```/,
      /function\s+\w+\s*\(/,
      /class\s+\w+/,
      /import\s+.*from/,
      /console\.log\(/,
      /<\w+.*>/,
      /\$\w+/,
    ];
    
    return codeIndicators.some(pattern => pattern.test(content));
  }

  detectNumericalData(content: string): boolean {
    const numbers = content.match(/\d+/g);
    return numbers ? numbers.length > 5 : false;
  }

  detectCreativityRequirement(content: string): boolean {
    const creativityKeywords = [
      'creative', 'innovative', 'brainstorm', 'generate ideas',
      'artistic', 'design', 'story', 'poem', 'creative writing'
    ];
    
    const lowerContent = content.toLowerCase();
    return creativityKeywords.some(keyword => lowerContent.includes(keyword));
  }
}

/**
 * Model Selector Implementation
 */
class ModelSelectorImpl implements ModelSelector {
  async selectBestModel(
    analysis: TaskAnalysis,
    availableProviders: Provider[],
    preferences?: RoutingPreferences
  ): Promise<{ provider: Provider; model: string } | null> {
    
    // Sort providers by priority and availability
    const sortedProviders = [...availableProviders].sort((a, b) => {
      // Local preference
      if (preferences?.prefer_local) {
        if (a.type === 'local' && b.type !== 'local') return -1;
        if (b.type === 'local' && a.type !== 'local') return 1;
      }
      
      // Speed preference
      if (preferences?.prefer_fast) {
        if (a.type === 'local' && b.type !== 'local') return -1;
        if (b.type === 'local' && a.type !== 'local') return 1;
      }
      
      return 0;
    });

    for (const provider of sortedProviders) {
      try {
        const models = await provider.listModels();
        const bestModel = this.selectBestModelForProvider(analysis, models);
        
        if (bestModel) {
          return { provider, model: bestModel.name };
        }
      } catch {
        // Provider error, try next
        continue;
      }
    }

    return null;
  }

  calculateConfidence(analysis: TaskAnalysis, provider: Provider, model: string): number {
    let confidence = 0.7; // Base confidence

    // Provider type match
    if (analysis.timeConstrained && provider.type === 'local') {
      confidence += 0.1;
    }

    // Model specialization
    if (analysis.type === 'code' && model.includes('codellama')) {
      confidence += 0.2;
    }
    
    if (analysis.complexity >= 4 && (model.includes('opus') || model.includes('70b'))) {
      confidence += 0.1;
    }

    // Creative tasks prefer Claude
    if (analysis.requiresCreativity && provider.name === 'claude') {
      confidence += 0.15;
    }

    return Math.min(confidence, 1.0);
  }

  estimateExecutionTime(analysis: TaskAnalysis, provider: Provider, model: string): number {
    let baseTime = provider.type === 'local' ? 10 : 15; // Base time

    // Adjust for model size/capability
    if (model.includes('70b') || model.includes('opus')) baseTime += 20;
    else if (model.includes('13b') || model.includes('sonnet')) baseTime += 10;
    else if (model.includes('7b') || model.includes('haiku')) baseTime += 5;

    // Adjust for complexity
    baseTime += analysis.complexity * 3;

    // Adjust for content length
    baseTime += Math.floor(analysis.contentLength / 1000) * 2;

    return baseTime;
  }

  private selectBestModelForProvider(analysis: TaskAnalysis, models: any[]): any | null {
    // Code-specific tasks
    if (analysis.type === 'code' || analysis.hasCode) {
      const codeModels = models.filter(m => 
        m.name.includes('codellama') || m.name.includes('code')
      );
      if (codeModels.length > 0) return codeModels[0];
    }

    // High complexity tasks
    if (analysis.complexity >= 4) {
      const powerfulModels = models.filter(m => 
        m.name.includes('70b') || 
        m.name.includes('opus') || 
        m.name.includes('llama3.1')
      );
      if (powerfulModels.length > 0) return powerfulModels[0];
    }

    // Fast tasks
    if (analysis.timeConstrained) {
      const fastModels = models.filter(m => 
        m.name.includes('7b') || 
        m.name.includes('haiku') || 
        m.name.includes('mistral')
      );
      if (fastModels.length > 0) return fastModels[0];
    }

    // Default to first available model
    return models[0] || null;
  }
}