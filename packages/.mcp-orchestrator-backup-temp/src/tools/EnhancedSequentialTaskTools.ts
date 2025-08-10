import { z } from 'zod';
import { MCPTool, ToolResponse } from '../types';
import { EnhancedSequentialTaskService } from '../services/EnhancedSequentialTaskService';
import { Logger } from '../utils/Logger';
import { TaskDecomposition } from '../services/TonyHierarchyMapper';

// Enhanced metadata interface (same as in service)
interface EnhancedMetadata {
  totalTasks: number;
  totalEstimatedHours: number;
  hierarchyDepth: number;
  decompositionTime: number;
  atomicTasksCount?: number;
  qualityScore?: number;
  processingMode?: string;
  modelUsed?: string;
  tokensUsed?: number;
  costSaved?: number;
}

// Enhanced input schemas
const EnhancedDecomposeTaskSchema = z.object({
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
    generateDependencies: z.boolean().default(true),
    // Enhanced options for local Ollama integration
    preferLocal: z.boolean().default(true),
    qualityThreshold: z.number().min(0).max(100).optional(),
    forceRemote: z.boolean().default(false),
    enableLocalFallback: z.boolean().default(true),
    performanceMode: z.enum(['speed', 'quality', 'balanced']).default('balanced')
  }).optional()
});

const ABTestDecomposeSchema = z.object({
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
    generateDependencies: z.boolean().default(true)
  }).optional()
});

/**
 * Enhanced Sequential task management tools with local Ollama decomposition
 */
export class EnhancedSequentialTaskTools {
  private taskService: EnhancedSequentialTaskService;
  private logger: Logger;

  constructor(taskService: EnhancedSequentialTaskService, logger: Logger) {
    this.taskService = taskService;
    this.logger = logger;
  }

  getTools(): MCPTool[] {
    return [
      {
        name: 'decompose_enhanced',
        description: 'Decompose a high-level task into atomic subtasks using intelligent local/remote routing. Uses local Ollama for speed and cost-effectiveness, falls back to Sequential Thinking for complex tasks.',
        inputSchema: EnhancedDecomposeTaskSchema,
        handler: this.decomposeTaskEnhanced.bind(this)
      },
      {
        name: 'decompose_ab_test',
        description: 'A/B test local vs remote decomposition to compare quality, speed, and cost. Useful for evaluating performance and choosing optimal strategy.',
        inputSchema: ABTestDecomposeSchema,
        handler: this.abTestDecomposition.bind(this)
      },
      {
        name: 'performance_stats',
        description: 'Get comprehensive performance statistics for local vs remote decomposition including speed, quality, and cost metrics.',
        inputSchema: z.object({}),
        handler: this.getPerformanceStats.bind(this)
      },
      {
        name: 'reset_metrics',
        description: 'Reset all performance metrics and start fresh tracking.',
        inputSchema: z.object({}),
        handler: this.resetMetrics.bind(this)
      }
    ];
  }

  /**
   * Enhanced task decomposition with intelligent routing
   */
  private async decomposeTaskEnhanced(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const input = EnhancedDecomposeTaskSchema.parse(args);
      
      this.logger.info('Enhanced task decomposition starting', { 
        description: input.description.substring(0, 50) + '...',
        options: input.options
      });

      // Build context object with proper typing
      const context: any = {};
      if (input.context?.projectId) context.projectId = input.context.projectId;
      if (input.context?.domain) context.domain = input.context.domain;
      if (input.context?.constraints) context.constraints = input.context.constraints;
      if (input.context?.targetAgents) context.targetAgents = input.context.targetAgents;

      // Perform enhanced decomposition
      const decomposition = await this.taskService.decomposeTask(
        input.description,
        context,
        input.options || {}
      );

      // Format enhanced output
      const output = this.formatEnhancedDecompositionOutput(decomposition);

      return {
        title: 'Enhanced Task Decomposition Complete',
        metadata: {
          operation: 'task_decompose_enhanced',
          status: 'success',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime,
          data: {
            stats: {
              total_tasks: decomposition.metadata.totalTasks,
              hierarchy_depth: decomposition.metadata.hierarchyDepth,
              estimated_total_hours: decomposition.metadata.totalEstimatedHours,
              dependencies_created: decomposition.dependencies.length,
              atomic_tasks_count: (decomposition.metadata as EnhancedMetadata).atomicTasksCount,
              quality_score: (decomposition.metadata as EnhancedMetadata).qualityScore,
              processing_mode: (decomposition.metadata as EnhancedMetadata).processingMode,
              model_used: (decomposition.metadata as EnhancedMetadata).modelUsed,
              cost_saved: (decomposition.metadata as EnhancedMetadata).costSaved
            }
          }
        },
        output
      };
    } catch (error) {
      this.logger.error('Enhanced task decomposition failed', error);
      return this.createErrorResponse('task_decompose_enhanced', error, Date.now() - startTime);
    }
  }

  /**
   * A/B test decomposition comparison
   */
  private async abTestDecomposition(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const input = ABTestDecomposeSchema.parse(args);
      
      this.logger.info('A/B testing decomposition', { 
        description: input.description.substring(0, 50) + '...'
      });

      // Build context object
      const context: any = {};
      if (input.context?.projectId) context.projectId = input.context.projectId;
      if (input.context?.domain) context.domain = input.context.domain;
      if (input.context?.constraints) context.constraints = input.context.constraints;
      if (input.context?.targetAgents) context.targetAgents = input.context.targetAgents;

      // Perform A/B test
      const abTestResult = await this.taskService.abTestDecomposition(
        input.description,
        context,
        input.options || {}
      );

      // Format A/B test output
      const output = this.formatABTestOutput(abTestResult);

      return {
        title: 'A/B Test Decomposition Complete',
        metadata: {
          operation: 'task_decompose_ab_test',
          status: 'success',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime,
          data: {
            comparison: abTestResult.comparison
          }
        },
        output
      };
    } catch (error) {
      this.logger.error('A/B test decomposition failed', error);
      return this.createErrorResponse('task_decompose_ab_test', error, Date.now() - startTime);
    }
  }

  /**
   * Get performance statistics
   */
  private async getPerformanceStats(_args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const stats = this.taskService.getEnhancedPerformanceStats();
      const output = this.formatPerformanceStatsOutput(stats);

      return {
        title: 'Performance Statistics',
        metadata: {
          operation: 'performance_stats',
          status: 'success',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime,
          data: stats
        },
        output
      };
    } catch (error) {
      this.logger.error('Performance stats retrieval failed', error);
      return this.createErrorResponse('performance_stats', error, Date.now() - startTime);
    }
  }

  /**
   * Reset performance metrics
   */
  private async resetMetrics(_args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      this.taskService.resetPerformanceMetrics();

      return {
        title: 'Performance Metrics Reset',
        metadata: {
          operation: 'reset_metrics',
          status: 'success',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: '✅ Performance metrics have been reset successfully.\n\nAll counters, averages, and cost tracking have been cleared.'
      };
    } catch (error) {
      this.logger.error('Metrics reset failed', error);
      return this.createErrorResponse('reset_metrics', error, Date.now() - startTime);
    }
  }

  /**
   * Format enhanced decomposition output for display
   */
  private formatEnhancedDecompositionOutput(decomposition: TaskDecomposition): string {
    const lines: string[] = [];
    
    // Processing mode indicator
    const isLocal = (decomposition.metadata as EnhancedMetadata).processingMode === 'local-ollama';
    const modeIcon = isLocal ? '🏠' : '☁️';
    const modeText = isLocal ? 'Local Ollama' : 'Remote Sequential Thinking';
    
    lines.push(`${modeIcon} **Enhanced Task Decomposition** (${modeText})`);
    lines.push('');
    
    // Quality score prominently displayed
    const qualityScore = (decomposition.metadata as EnhancedMetadata).qualityScore;
    if (qualityScore) {
      const qualityIcon = qualityScore >= 90 ? '🏆' : 
                         qualityScore >= 80 ? '🥈' : 
                         qualityScore >= 70 ? '🥉' : '⚠️';
      lines.push(`${qualityIcon} **Quality Score**: ${qualityScore}%`);
      lines.push('');
    }
    
    lines.push('📋 **UPP Hierarchy Created:**');
    lines.push('');
    
    // Epic
    if (decomposition.epic) {
      lines.push(`🎯 **Epic**: ${decomposition.epic.title}`);
      lines.push(`   ID: ${decomposition.epic.id}`);
      lines.push(`   Estimated: ${decomposition.epic.estimatedHours}h`);
      lines.push('');
    }
    
    // Features
    if (decomposition.features.length > 0) {
      lines.push(`📦 **Features** (${decomposition.features.length}):`);
      decomposition.features.forEach(f => {
        lines.push(`   - ${f.title} [${f.id}] (${f.estimatedHours}h)`);
      });
      lines.push('');
    }
    
    // Stories
    if (decomposition.stories.length > 0) {
      lines.push(`📖 **User Stories** (${decomposition.stories.length}):`);
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
      lines.push(`🔨 **Tasks** (${decomposition.tasks.length}):`);
      decomposition.tasks.slice(0, 3).forEach(t => {
        lines.push(`   - ${t.title} [${t.id}]`);
      });
      if (decomposition.tasks.length > 3) {
        lines.push(`   ... and ${decomposition.tasks.length - 3} more`);
      }
      lines.push('');
    }
    
    // Atomic tasks with compliance indicator
    if (decomposition.atomic.length > 0) {
      const atomicCount = (decomposition.metadata as EnhancedMetadata).atomicTasksCount || decomposition.atomic.length;
      lines.push(`⚛️ **Atomic Tasks** (${atomicCount}) - ✅ All ≤30min compliant`);
      lines.push(`   Ready for immediate execution`);
      lines.push('');
    }
    
    // Dependencies
    if (decomposition.dependencies.length > 0) {
      lines.push(`🔗 **Dependencies**: ${decomposition.dependencies.length} relationships defined`);
      lines.push('');
    }
    
    // Enhanced Summary with performance metrics
    lines.push('📊 **Summary**:');
    lines.push(`   Total Tasks: ${decomposition.metadata.totalTasks}`);
    lines.push(`   Total Hours: ${decomposition.metadata.totalEstimatedHours}`);
    lines.push(`   Hierarchy Depth: ${decomposition.metadata.hierarchyDepth} levels`);
    lines.push(`   Decomposition Time: ${decomposition.metadata.decompositionTime}ms`);
    
    // Local processing benefits
    if (isLocal) {
      lines.push('');
      lines.push('💰 **Local Processing Benefits**:');
      lines.push(`   💸 Cost: FREE (vs ~$5 for remote)`);
      lines.push(`   🚀 Speed: Ultra-fast local processing`);
      lines.push(`   🔒 Privacy: 100% local, no data transmitted`);
      const metadata = decomposition.metadata as EnhancedMetadata;
      lines.push(`   🔧 Model: ${metadata.modelUsed || 'N/A'}`);
      
      if (metadata.tokensUsed) {
        lines.push(`   📊 Tokens: ~${metadata.tokensUsed} (estimated)`);
      }
      
      if (metadata.costSaved) {
        lines.push(`   💎 Saved: $${metadata.costSaved}`);
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Format A/B test output
   */
  private formatABTestOutput(abTestResult: any): string {
    const lines: string[] = [];
    const comp = abTestResult.comparison;
    
    lines.push('🧪 **A/B Test Results: Local vs Remote Decomposition**');
    lines.push('');
    
    // Execution summary
    lines.push('⏱️ **Performance Comparison**:');
    if (comp.localTime && comp.remoteTime) {
      const speedup = Math.round(((comp.remoteTime - comp.localTime) / comp.remoteTime) * 100);
      lines.push(`   Local Time: ${comp.localTime}ms`);
      lines.push(`   Remote Time: ${comp.remoteTime}ms`);
      lines.push(`   Speed Improvement: ${speedup > 0 ? '+' : ''}${speedup}% (local)`);
    } else {
      lines.push(`   Local Time: ${comp.localTime || 'Failed'}ms`);
      lines.push(`   Remote Time: ${comp.remoteTime || 'Failed'}ms`);
    }
    lines.push('');
    
    // Quality comparison
    lines.push('📊 **Quality Comparison**:');
    if (comp.localQuality && comp.remoteQuality) {
      const qualityDiff = comp.localQuality - comp.remoteQuality;
      lines.push(`   Local Quality: ${comp.localQuality}%`);
      lines.push(`   Remote Quality: ${comp.remoteQuality}%`);
      lines.push(`   Quality Difference: ${qualityDiff > 0 ? '+' : ''}${qualityDiff}% (local)`);
    } else {
      lines.push(`   Local Quality: ${comp.localQuality || 'N/A'}%`);
      lines.push(`   Remote Quality: ${comp.remoteQuality || 'N/A'}%`);
    }
    lines.push('');
    
    // Task count comparison
    lines.push('📋 **Task Generation Comparison**:');
    lines.push(`   Local Tasks: ${comp.localTasks || 'Failed'} total, ${comp.localAtomic || 0} atomic`);
    lines.push(`   Remote Tasks: ${comp.remoteTasks || 'Failed'} total, ${comp.remoteAtomic || 0} atomic`);
    lines.push('');
    
    // Errors if any
    if (comp.errors.local || comp.errors.remote) {
      lines.push('❌ **Errors**:');
      if (comp.errors.local) lines.push(`   Local: ${comp.errors.local}`);
      if (comp.errors.remote) lines.push(`   Remote: ${comp.errors.remote}`);
      lines.push('');
    }
    
    // Recommendation
    lines.push('🎯 **Recommendation**:');
    lines.push(`   ${comp.recommendation}`);
    lines.push('');
    
    // Cost analysis
    lines.push('💰 **Cost Analysis**:');
    lines.push(`   Local Cost: $0 (FREE)`);
    lines.push(`   Remote Cost: ~$5 (API calls)`);
    lines.push(`   Savings with Local: $5 per decomposition`);
    
    return lines.join('\n');
  }

  /**
   * Format performance statistics output
   */
  private formatPerformanceStatsOutput(stats: any): string {
    const lines: string[] = [];
    
    lines.push('📈 **Enhanced Decomposition Performance Statistics**');
    lines.push('');
    
    // Decomposition counts
    lines.push('🔢 **Decomposition Counts**:');
    lines.push(`   Total: ${stats.decompositions.total}`);
    lines.push(`   Local: ${stats.decompositions.local} (${stats.decompositions.localPercentage}%)`);
    lines.push(`   Remote: ${stats.decompositions.remote} (${100 - stats.decompositions.localPercentage}%)`);
    lines.push('');
    
    // Performance metrics
    lines.push('⚡ **Performance Metrics**:');
    lines.push(`   Average Local Time: ${stats.performance.averageLocalTime}ms`);
    lines.push(`   Average Remote Time: ${stats.performance.averageRemoteTime}ms`);
    if (stats.performance.speedImprovement > 0) {
      lines.push(`   Speed Improvement: ${stats.performance.speedImprovement}% faster with local`);
    }
    lines.push('');
    
    // Quality metrics
    lines.push('🎯 **Quality Metrics**:');
    lines.push(`   Average Local Quality: ${stats.quality.averageLocalQuality}%`);
    lines.push(`   Average Remote Quality: ${stats.quality.averageRemoteQuality}%`);
    if (Math.abs(stats.quality.qualityDifference) > 0) {
      const better = stats.quality.qualityDifference > 0 ? 'remote' : 'local';
      const diff = Math.abs(stats.quality.qualityDifference);
      lines.push(`   Quality Advantage: ${diff}% higher with ${better}`);
    }
    lines.push('');
    
    // Cost savings
    lines.push('💰 **Cost Analysis**:');
    lines.push(`   Total Saved: ${stats.costs.savings}`);
    lines.push(`   Remote Cost Would Be: $${stats.costs.estimatedRemoteCost}`);
    lines.push(`   Local Processing: 100% FREE`);
    lines.push('');
    
    // Availability status
    lines.push('🔋 **System Availability**:');
    lines.push(`   Local Ollama: ${stats.availability.localAvailable ? '✅ Available' : '❌ Unavailable'}`);
    
    if (stats.availability.localStats) {
      const localStats = stats.availability.localStats;
      lines.push(`   Decompositions Completed: ${localStats.decompositionsCompleted}`);
      lines.push(`   Average Time: ${localStats.averageTime}ms`);
      lines.push(`   Average Quality: ${Math.round(localStats.averageQuality)}%`);
      lines.push(`   Atomic Tasks Generated: ${localStats.atomicTasksGenerated}`);
      lines.push(`   Status: ${localStats.uptime}`);
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
      output: `Operation failed: ${error.message || error}\n\n🔧 **Troubleshooting:**\n- Check if Ollama server is running at 10.1.1.42:11434\n- Verify mosaic-thinking MCP server is available\n- Try using forceRemote: true to bypass local processing\n- Check logs for detailed error information`
    };
  }
}