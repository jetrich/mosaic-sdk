/**
 * Sequential Task Service Bridge
 * 
 * Bridges the Tony orchestration system to the MCP server's SequentialTaskService
 * when available, or provides fallback functionality for standalone operation.
 */

import { Logger } from '../utils/Logger';

export interface SequentialTaskService {
  decomposeTask(prompt: string, context: any, options: any): Promise<any>;
  batchEstimateTasks?(taskIds: string[], method: string, confidence: string, overrides?: any): Promise<any>;
  intelligentAssignTasks?(taskIds: string[], strategy: string, constraints: any): Promise<any>;
  analyzeTaskComplexity?(description: string, factors: string[]): Promise<any>;
}

/**
 * Bridge to MCP server's SequentialTaskService or fallback implementation
 */
export class SequentialTaskServiceBridge implements SequentialTaskService {
  private logger: Logger;
  private mcpService: any = null;

  constructor(logger: Logger) {
    this.logger = logger;
    this.tryInitializeMCPService();
  }

  /**
   * Try to connect to MCP server's SequentialTaskService
   */
  private tryInitializeMCPService(): void {
    try {
      // Try to import the actual MCP service
      const { SequentialTaskService: MCPSequentialTaskService } = require('../../mcp-server/src/services/SequentialTaskService');
      
      // Create a mock config for the service
      const mockConfig = {
        port: 3456,
        host: 'localhost',
        maxConnections: 10,
        enableLogging: true
      };

      this.mcpService = new MCPSequentialTaskService(mockConfig, this.logger);
      this.logger.info('Connected to MCP SequentialTaskService');
    } catch (error: any) {
      this.logger.warn('MCP SequentialTaskService not available, using fallback', { 
        error: error.message 
      });
    }
  }

  /**
   * Decompose a task using Sequential Thinking or fallback logic
   */
  async decomposeTask(prompt: string, context: any, options: any): Promise<any> {
    this.logger.info('Decomposing task', { 
      promptLength: prompt.length,
      context: context.level || 'unknown',
      options
    });

    if (this.mcpService) {
      try {
        return await this.mcpService.decomposeTask(prompt, context, options);
      } catch (error: any) {
        this.logger.warn('MCP service decomposition failed, using fallback', { 
          error: error.message 
        });
      }
    }

    // Fallback decomposition logic
    return this.fallbackDecomposeTask(prompt, context, options);
  }

  /**
   * Batch estimate task durations
   */
  async batchEstimateTasks(
    taskIds: string[], 
    method: string, 
    confidence: string, 
    overrides?: any
  ): Promise<any> {
    if (this.mcpService && this.mcpService.batchEstimateTasks) {
      try {
        return await this.mcpService.batchEstimateTasks(taskIds, method, confidence, overrides);
      } catch (error: any) {
        this.logger.warn('MCP batch estimation failed, using fallback', { 
          error: error.message 
        });
      }
    }

    return this.fallbackBatchEstimate(taskIds, method, confidence, overrides);
  }

  /**
   * Intelligently assign tasks to agents
   */
  async intelligentAssignTasks(
    taskIds: string[], 
    strategy: string, 
    constraints: any
  ): Promise<any> {
    if (this.mcpService && this.mcpService.intelligentAssignTasks) {
      try {
        return await this.mcpService.intelligentAssignTasks(taskIds, strategy, constraints);
      } catch (error: any) {
        this.logger.warn('MCP intelligent assignment failed, using fallback', { 
          error: error.message 
        });
      }
    }

    return this.fallbackIntelligentAssign(taskIds, strategy, constraints);
  }

  /**
   * Analyze task complexity
   */
  async analyzeTaskComplexity(description: string, factors: string[]): Promise<any> {
    if (this.mcpService && this.mcpService.analyzeTaskComplexity) {
      try {
        return await this.mcpService.analyzeTaskComplexity(description, factors);
      } catch (error: any) {
        this.logger.warn('MCP complexity analysis failed, using fallback', { 
          error: error.message 
        });
      }
    }

    return this.fallbackComplexityAnalysis(description, factors);
  }

  /**
   * Fallback task decomposition using structured patterns
   */
  private async fallbackDecomposeTask(prompt: string, context: any, options: any): Promise<any> {
    const level = context.level || 'unknown';
    
    this.logger.info('Using fallback decomposition', { level, promptLength: prompt.length });

    // Simulate a decomposition result based on the level
    const result = {
      tasks: this.generateFallbackTasks(level, prompt),
      metadata: {
        method: 'fallback',
        level,
        timestamp: new Date().toISOString(),
        totalTasks: this.getTargetTaskCount(level)
      }
    };

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return result;
  }

  /**
   * Generate fallback tasks based on level and context
   */
  private generateFallbackTasks(level: string, prompt: string): any[] {
    const targetCount = this.getTargetTaskCount(level);
    const tasks = [];

    for (let i = 0; i < targetCount; i++) {
      const taskId = this.generateTaskId(level, i);
      const task = {
        id: taskId,
        title: `${level.charAt(0).toUpperCase() + level.slice(1)} ${i + 1}`,
        description: `Generated ${level} based on: ${prompt.substring(0, 100)}...`,
        level,
        estimatedHours: this.estimateHours(level),
        status: 'pending',
        metadata: {
          createdAt: new Date(),
          method: 'fallback',
          confidence: 'medium'
        }
      };
      tasks.push(task);
    }

    return tasks;
  }

  /**
   * Get target task count for each level
   */
  private getTargetTaskCount(level: string): number {
    const targets = {
      epic: 1,
      feature: 5,
      story: 5,
      task: 3,
      subtask: 4,
      atomic: 3
    };
    return targets[level as keyof typeof targets] || 3;
  }

  /**
   * Generate task ID based on level
   */
  private generateTaskId(level: string, index: number): string {
    const levelCodes = {
      epic: 'E',
      feature: 'F', 
      story: 'S',
      task: 'T',
      subtask: 'ST',
      atomic: 'A'
    };
    
    const code = levelCodes[level as keyof typeof levelCodes] || 'T';
    const serial = String(index + 1).padStart(3, '0');
    const domain = 1; // Default to core features
    
    return `${code}.${domain}${serial}`;
  }

  /**
   * Estimate hours based on level
   */
  private estimateHours(level: string): number {
    const estimates = {
      epic: 120,     // 3 months
      feature: 24,   // 3 weeks
      story: 8,      // 1 week
      task: 4,       // 4 hours
      subtask: 2,    // 2 hours
      atomic: 0.5    // 30 minutes
    };
    return estimates[level as keyof typeof estimates] || 4;
  }

  /**
   * Fallback batch estimation
   */
  private async fallbackBatchEstimate(
    taskIds: string[], 
    method: string, 
    confidence: string, 
    overrides?: any
  ): Promise<any> {
    return taskIds.map(taskId => ({
      taskId,
      estimatedHours: this.estimateFromTaskId(taskId),
      confidence,
      method: 'fallback'
    }));
  }

  /**
   * Fallback intelligent assignment
   */
  private async fallbackIntelligentAssign(
    taskIds: string[], 
    strategy: string, 
    constraints: any
  ): Promise<any> {
    const personas = [
      'BE-BACKEND-BENJAMIN',
      'FE-FRONTEND-FIONA', 
      'FS-FULLSTACK-FELIX',
      'QA-QUALITY-QUINN'
    ];

    return taskIds.map((taskId, index) => ({
      taskId,
      agentId: personas[index % personas.length],
      reason: 'Round-robin assignment (fallback)',
      score: 0.7
    }));
  }

  /**
   * Fallback complexity analysis
   */
  private async fallbackComplexityAnalysis(description: string, factors: string[]): Promise<any> {
    // Simple heuristic-based complexity analysis
    const complexity = this.calculateComplexityScore(description);
    
    return {
      overallScore: complexity,
      factors: factors.reduce((acc, factor) => ({
        ...acc,
        [factor]: complexity + (Math.random() - 0.5) * 2
      }), {}),
      recommendation: complexity > 7 ? 'High complexity - consider breaking down further' : 
                     complexity > 4 ? 'Medium complexity - manageable with proper planning' :
                     'Low complexity - straightforward implementation'
    };
  }

  /**
   * Calculate complexity score from description
   */
  private calculateComplexityScore(description: string): number {
    const complexityKeywords = {
      high: ['ai', 'machine learning', 'blockchain', 'real-time', 'distributed', 'microservices'],
      medium: ['api', 'database', 'integration', 'authentication', 'payment', 'scalable'],
      low: ['crud', 'simple', 'basic', 'standard', 'form', 'display']
    };

    const lowerDesc = description.toLowerCase();
    let score = 5; // Base score

    complexityKeywords.high.forEach(keyword => {
      if (lowerDesc.includes(keyword)) score += 2;
    });

    complexityKeywords.medium.forEach(keyword => {
      if (lowerDesc.includes(keyword)) score += 1;
    });

    complexityKeywords.low.forEach(keyword => {
      if (lowerDesc.includes(keyword)) score -= 1;
    });

    return Math.max(1, Math.min(10, score));
  }

  /**
   * Estimate hours from task ID pattern
   */
  private estimateFromTaskId(taskId: string): number {
    if (taskId.startsWith('E.')) return 120;    // Epic
    if (taskId.startsWith('F.')) return 24;     // Feature
    if (taskId.startsWith('S.')) return 8;      // Story
    if (taskId.startsWith('T.')) return 4;      // Task
    if (taskId.startsWith('ST.')) return 2;     // Subtask
    if (taskId.startsWith('A.')) return 0.5;    // Atomic
    return 4; // Default
  }
}