import { z } from 'zod';
import { MCPTool, ToolResponse } from '../types';
import { SequentialTaskService } from '../services/SequentialTaskService';
import { Logger } from '../utils/Logger';
import { TaskDecomposition } from '../services/TonyHierarchyMapper';
import { zodToJsonSchema } from '../utils/zodToJsonSchema';

// Input schemas
const DecomposeTaskSchema = z.object({
  description: z.string().min(10).max(1000),
  context: z.object({
    projectId: z.string().optional(),
    domain: z.string().optional(),
    constraints: z.array(z.string()).optional(),
    targetAgents: z.array(z.string()).optional()
  }).optional(),
  options: z.object({
    maxDepth: z.number().min(1).max(6).default(6),
    includeEstimates: z.boolean().default(true),
    autoAssign: z.boolean().default(false),
    generateDependencies: z.boolean().default(true)
  }).optional()
});

const BatchEstimateSchema = z.object({
  taskIds: z.array(z.string()).min(1).max(100),
  estimationMethod: z.enum(['ai', 'historical', 'manual']).default('ai'),
  confidence: z.enum(['low', 'medium', 'high']).default('medium'),
  overrides: z.record(z.string(), z.number()).optional()
});

const IntelligentAssignSchema = z.object({
  taskIds: z.array(z.string()).min(1).max(50),
  strategy: z.enum(['skill_match', 'load_balance', 'priority', 'hybrid']).default('hybrid'),
  constraints: z.object({
    maxTasksPerAgent: z.number().optional(),
    requiredSkills: z.array(z.string()).optional(),
    preferredAgents: z.array(z.string()).optional(),
    excludeAgents: z.array(z.string()).optional()
  }).optional()
});

const AnalyzeComplexitySchema = z.object({
  description: z.string().min(10).max(1000),
  factors: z.array(z.enum(['technical', 'domain', 'integration', 'scale'])).optional()
});

/**
 * Sequential task management tools for atomic decomposition
 */
export class SequentialTaskTools {
  private taskService: SequentialTaskService;
  private logger: Logger;

  constructor(taskService: SequentialTaskService, logger: Logger) {
    this.taskService = taskService;
    this.logger = logger;
  }

  getTools(): MCPTool[] {
    return [
      {
        name: 'decompose',
        description: 'Decompose a high-level task into atomic subtasks using Sequential Thinking',
        inputSchema: zodToJsonSchema(DecomposeTaskSchema),
        handler: this.decomposeTask.bind(this)
      },
      {
        name: 'estimate_batch',
        description: 'Estimate time for multiple tasks efficiently using AI or historical data',
        inputSchema: zodToJsonSchema(BatchEstimateSchema),
        handler: this.batchEstimate.bind(this)
      },
      {
        name: 'assign_intelligent',
        description: 'Intelligently assign tasks to agents based on skills and workload',
        inputSchema: zodToJsonSchema(IntelligentAssignSchema),
        handler: this.intelligentAssign.bind(this)
      },
      {
        name: 'analyze_complexity',
        description: 'Analyze task complexity to determine decomposition strategy',
        inputSchema: zodToJsonSchema(AnalyzeComplexitySchema),
        handler: this.analyzeComplexity.bind(this)
      }
    ];
  }

  /**
   * Decompose a high-level task into atomic subtasks
   */
  private async decomposeTask(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const input = DecomposeTaskSchema.parse(args);
      
      this.logger.info('Decomposing task', { 
        description: input.description.substring(0, 50) + '...',
        options: input.options
      });

      // Build context object with proper typing
      const context: any = {};
      if (input.context?.projectId) context.projectId = input.context.projectId;
      if (input.context?.domain) context.domain = input.context.domain;
      if (input.context?.constraints) context.constraints = input.context.constraints;
      if (input.context?.targetAgents) context.targetAgents = input.context.targetAgents;

      // Perform decomposition
      const decomposition = await this.taskService.decomposeTask(
        input.description,
        context,
        input.options || {}
      );

      // Format output
      const output = this.formatDecompositionOutput(decomposition);

      return {
        title: 'Task Decomposition Complete',
        metadata: {
          operation: 'task_decompose',
          status: 'success',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime,
          data: {
            stats: {
              total_tasks: decomposition.metadata.totalTasks,
              hierarchy_depth: decomposition.metadata.hierarchyDepth,
              estimated_total_hours: decomposition.metadata.totalEstimatedHours,
              dependencies_created: decomposition.dependencies.length
            }
          }
        },
        output
      };
    } catch (error) {
      this.logger.error('Task decomposition failed', error);
      return this.createErrorResponse('task_decompose', error, Date.now() - startTime);
    }
  }

  /**
   * Batch estimate task durations
   */
  private async batchEstimate(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const input = BatchEstimateSchema.parse(args);
      
      this.logger.info('Batch estimating tasks', { 
        count: input.taskIds.length,
        method: input.estimationMethod
      });

      // Perform batch estimation
      const estimates = await this.taskService.batchEstimateTasks(
        input.taskIds,
        input.estimationMethod,
        input.confidence,
        input.overrides
      );

      // Format output
      const output = this.formatEstimationOutput(estimates);

      return {
        title: 'Batch Estimation Complete',
        metadata: {
          operation: 'task_estimate_batch',
          status: 'success',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime,
          data: {
            stats: {
              tasks_estimated: estimates.length,
              total_hours: estimates.reduce((sum: number, e: any) => sum + e.estimatedHours, 0),
              confidence: input.confidence,
              method: input.estimationMethod
            }
          }
        },
        output
      };
    } catch (error) {
      this.logger.error('Batch estimation failed', error);
      return this.createErrorResponse('task_estimate_batch', error, Date.now() - startTime);
    }
  }

  /**
   * Intelligently assign tasks to agents
   */
  private async intelligentAssign(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const input = IntelligentAssignSchema.parse(args);
      
      this.logger.info('Intelligent task assignment', { 
        count: input.taskIds.length,
        strategy: input.strategy
      });

      // Build constraints object with proper typing
      const constraints: any = {};
      if (input.constraints?.maxTasksPerAgent) constraints.maxTasksPerAgent = input.constraints.maxTasksPerAgent;
      if (input.constraints?.requiredSkills) constraints.requiredSkills = input.constraints.requiredSkills;
      if (input.constraints?.preferredAgents) constraints.preferredAgents = input.constraints.preferredAgents;
      if (input.constraints?.excludeAgents) constraints.excludeAgents = input.constraints.excludeAgents;

      // Perform intelligent assignment
      const assignments = await this.taskService.intelligentAssignTasks(
        input.taskIds,
        input.strategy,
        constraints
      );

      // Format output
      const output = this.formatAssignmentOutput(assignments);

      return {
        title: 'Intelligent Assignment Complete',
        metadata: {
          operation: 'task_assign_intelligent',
          status: 'success',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime,
          data: {
            stats: {
              tasks_assigned: assignments.length,
              unique_agents: new Set(assignments.map((a: any) => a.agentId)).size,
              strategy: input.strategy,
              constraints_applied: Object.keys(input.constraints || {}).length
            }
          }
        },
        output
      };
    } catch (error) {
      this.logger.error('Intelligent assignment failed', error);
      return this.createErrorResponse('task_assign_intelligent', error, Date.now() - startTime);
    }
  }

  /**
   * Analyze task complexity
   */
  private async analyzeComplexity(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const input = AnalyzeComplexitySchema.parse(args);
      
      this.logger.info('Analyzing task complexity', { 
        description: input.description.substring(0, 50) + '...'
      });

      // Analyze complexity
      const analysis = await this.taskService.analyzeTaskComplexity(
        input.description,
        input.factors || ['technical', 'domain', 'integration', 'scale']
      );

      // Format output
      const output = this.formatComplexityOutput(analysis);

      return {
        title: 'Complexity Analysis Complete',
        metadata: {
          operation: 'task_analyze_complexity',
          status: 'success',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime,
          data: {
            complexity_score: analysis.overallScore
          }
        },
        output
      };
    } catch (error) {
      this.logger.error('Complexity analysis failed', error);
      return this.createErrorResponse('task_analyze_complexity', error, Date.now() - startTime);
    }
  }

  /**
   * Format decomposition output for display
   */
  private formatDecompositionOutput(decomposition: TaskDecomposition): string {
    const lines: string[] = [];
    
    lines.push('📋 Task Hierarchy Created:');
    lines.push('');
    
    // Epic
    if (decomposition.epic) {
      lines.push(`🎯 Epic: ${decomposition.epic.title}`);
      lines.push(`   ID: ${decomposition.epic.id}`);
      lines.push(`   Estimated: ${decomposition.epic.estimatedHours}h`);
      lines.push('');
    }
    
    // Features
    if (decomposition.features.length > 0) {
      lines.push(`📦 Features (${decomposition.features.length}):`);
      decomposition.features.forEach(f => {
        lines.push(`   - ${f.title} [${f.id}] (${f.estimatedHours}h)`);
      });
      lines.push('');
    }
    
    // Stories
    if (decomposition.stories.length > 0) {
      lines.push(`📖 User Stories (${decomposition.stories.length}):`);
      decomposition.stories.slice(0, 5).forEach(s => {
        lines.push(`   - ${s.title} [${s.id}]`);
      });
      if (decomposition.stories.length > 5) {
        lines.push(`   ... and ${decomposition.stories.length - 5} more`);
      }
      lines.push('');
    }
    
    // Tasks
    if (decomposition.tasks.length > 0) {
      lines.push(`🔨 Tasks (${decomposition.tasks.length}):`);
      decomposition.tasks.slice(0, 3).forEach(t => {
        lines.push(`   - ${t.title} [${t.id}]`);
      });
      if (decomposition.tasks.length > 3) {
        lines.push(`   ... and ${decomposition.tasks.length - 3} more`);
      }
      lines.push('');
    }
    
    // Atomic tasks
    if (decomposition.atomic.length > 0) {
      lines.push(`⚛️ Atomic Tasks (${decomposition.atomic.length}):`);
      lines.push(`   Ready for immediate execution`);
      lines.push('');
    }
    
    // Dependencies
    if (decomposition.dependencies.length > 0) {
      lines.push(`🔗 Dependencies: ${decomposition.dependencies.length} relationships defined`);
      lines.push('');
    }
    
    // Summary
    lines.push('📊 Summary:');
    lines.push(`   Total Tasks: ${decomposition.metadata.totalTasks}`);
    lines.push(`   Total Hours: ${decomposition.metadata.totalEstimatedHours}`);
    lines.push(`   Hierarchy Depth: ${decomposition.metadata.hierarchyDepth} levels`);
    lines.push(`   Decomposition Time: ${decomposition.metadata.decompositionTime}ms`);
    
    return lines.join('\n');
  }

  /**
   * Format estimation output
   */
  private formatEstimationOutput(estimates: any[]): string {
    const lines: string[] = [];
    
    lines.push('⏱️ Task Estimates:');
    lines.push('');
    
    estimates.slice(0, 10).forEach(est => {
      lines.push(`- ${est.taskId}: ${est.estimatedHours}h (${est.confidence} confidence)`);
    });
    
    if (estimates.length > 10) {
      lines.push(`... and ${estimates.length - 10} more`);
    }
    
    lines.push('');
    lines.push(`Total: ${estimates.reduce((sum, e) => sum + e.estimatedHours, 0)}h`);
    
    return lines.join('\n');
  }

  /**
   * Format assignment output
   */
  private formatAssignmentOutput(assignments: any[]): string {
    const lines: string[] = [];
    
    lines.push('👥 Task Assignments:');
    lines.push('');
    
    // Group by agent
    const byAgent = assignments.reduce((acc, assign) => {
      if (!acc[assign.agentId]) acc[assign.agentId] = [];
      acc[assign.agentId].push(assign);
      return acc;
    }, {} as Record<string, any[]>);
    
    Object.entries(byAgent).forEach(([agentId, tasks]) => {
      const taskList = tasks as any[];
      lines.push(`${agentId}: ${taskList.length} tasks`);
      taskList.slice(0, 3).forEach((t: any) => {
        lines.push(`   - ${t.taskId} (${t.reason})`);
      });
      if (taskList.length > 3) {
        lines.push(`   ... and ${taskList.length - 3} more`);
      }
    });
    
    return lines.join('\n');
  }

  /**
   * Format complexity analysis output
   */
  private formatComplexityOutput(analysis: any): string {
    const lines: string[] = [];
    
    lines.push('🔍 Complexity Analysis:');
    lines.push('');
    lines.push(`Overall Score: ${analysis.overallScore}/10`);
    lines.push(`Recommendation: ${analysis.recommendation}`);
    lines.push('');
    lines.push('Factors:');
    
    Object.entries(analysis.factors).forEach(([factor, score]) => {
      lines.push(`- ${factor}: ${score}/10`);
    });
    
    if (analysis.suggestedApproach) {
      lines.push('');
      lines.push(`Suggested Approach: ${analysis.suggestedApproach}`);
    }
    
    return lines.join('\n');
  }

  /**
   * Create error response
   */
  private createErrorResponse(operation: string, error: any, duration: number): ToolResponse {
    return {
      title: `Error in ${operation}`,
      metadata: {
        operation,
        status: 'error',
        timestamp: new Date().toISOString(),
        execution_time_ms: duration
      },
      output: `Operation failed: ${error.message || error}`
    };
  }
}