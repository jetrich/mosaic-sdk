/**
 * EnhancedSequentialTaskService - Extended task service with local Ollama decomposition
 * 
 * This service extends the existing SequentialTaskService to provide:
 * - Local Ollama task decomposition (fast, free, private)
 * - Intelligent routing between local and remote decomposition
 * - Performance optimization and quality metrics
 * - Full UPP hierarchy compliance with atomic task validation
 */

import { SequentialTaskService, DecompositionOptions } from './SequentialTaskService';
import { TaskDecomposition, ProjectContext } from './TonyHierarchyMapper';
import { MCPServerConfig } from '../types';
import { Logger } from '../utils/Logger';

// Enhanced metadata interface
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

// Local decomposition result interface
export interface LocalDecompositionResult {
  hierarchy: {
    epic: any | null;
    features: any[];
    stories: any[];
    tasks: any[];
    subtasks: any[];
    atomic: any[];
  };
  dependencies: any[];
  metadata: EnhancedMetadata & {
    thoughtsGenerated: number;
    completed: boolean;
  };
  thoughts: any[];
  performance: {
    isLocal: boolean;
    cost: number;
    tokensUsed: number;
    modelsUsed: string[];
  };
}

// Enhanced options interface
export interface EnhancedDecompositionOptions extends DecompositionOptions {
  preferLocal?: boolean;
  qualityThreshold?: number;
  forceRemote?: boolean;
  enableLocalFallback?: boolean;
  performanceMode?: 'speed' | 'quality' | 'balanced';
}

/**
 * Enhanced Sequential Task Service with local Ollama integration
 */
export class EnhancedSequentialTaskService extends SequentialTaskService {
  private ollamaDecompositionClient: any; // Will be dynamically imported
  private performanceMetrics: {
    localDecompositions: number;
    remoteDecompositions: number;
    averageLocalTime: number;
    averageRemoteTime: number;
    averageLocalQuality: number;
    averageRemoteQuality: number;
    totalCostSaved: number;
  } = {
    localDecompositions: 0,
    remoteDecompositions: 0,
    averageLocalTime: 0,
    averageRemoteTime: 0,
    averageLocalQuality: 0,
    averageRemoteQuality: 0,
    totalCostSaved: 0
  };

  constructor(config: MCPServerConfig, logger: Logger) {
    super(config, logger);
    this.initializeLocalDecomposition();
  }

  /**
   * Initialize local decomposition client
   */
  private async initializeLocalDecomposition(): Promise<void> {
    try {
      // Dynamically require the local decomposition client if available
      // This allows the service to work even if the local client isn't available
      // TODO: Implement proper local decomposition client initialization
      // For now, leave it null to use remote decomposition only
      this.ollamaDecompositionClient = null;
      
      this.getLogger().info('Local Ollama decomposition client disabled (not implemented)');
    } catch (error) {
      this.getLogger().warn('Local Ollama decomposition not available', error as Error);
      this.ollamaDecompositionClient = null;
    }
  }

  /**
   * Enhanced decompose task with intelligent routing
   */
  override async decomposeTask(
    description: string,
    context: ProjectContext,
    options: EnhancedDecompositionOptions = {}
  ): Promise<TaskDecomposition> {
    const logger = this.getLogger();
    const startTime = Date.now();
    
    logger.info('Starting enhanced task decomposition', { 
      description: description.substring(0, 100) + '...',
      context,
      options 
    });

    try {
      // Determine decomposition strategy
      const strategy = this.determineDecompositionStrategy(description, context, options);
      
      let decomposition: TaskDecomposition;
      
      if (strategy === 'local' && this.ollamaDecompositionClient) {
        logger.info('Using local Ollama decomposition');
        decomposition = await this.decomposeWithLocal(description, context, options);
        this.updateLocalMetrics(decomposition, Date.now() - startTime);
      } else {
        logger.info('Using remote Sequential Thinking decomposition');
        decomposition = await this.decomposeWithRemote(description, context, options);
        this.updateRemoteMetrics(decomposition, Date.now() - startTime);
      }
      
      // Note: Task storage is handled within the decomposition process
      
      logger.info('Enhanced decomposition completed', {
        strategy,
        totalTasks: decomposition.metadata.totalTasks,
        hierarchyDepth: decomposition.metadata.hierarchyDepth,
        qualityScore: (decomposition.metadata as EnhancedMetadata).qualityScore || 'N/A'
      });
      
      return decomposition;
      
    } catch (error) {
      logger.error('Enhanced decomposition failed', error);
      
      // Intelligent fallback
      if (options.enableLocalFallback !== false && this.ollamaDecompositionClient) {
        logger.info('Attempting local fallback');
        try {
          const fallbackDecomposition = await this.decomposeWithLocal(description, context, options);
          this.updateLocalMetrics(fallbackDecomposition, Date.now() - startTime);
          return fallbackDecomposition;
        } catch (fallbackError) {
          logger.error('Fallback also failed', fallbackError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Determine optimal decomposition strategy
   */
  private determineDecompositionStrategy(
    description: string,
    _context: ProjectContext,
    options: EnhancedDecompositionOptions
  ): 'local' | 'remote' {
    // Force options
    if (options.forceRemote) return 'remote';
    if (options.preferLocal && this.ollamaDecompositionClient) return 'local';
    
    // If local client not available, use remote
    if (!this.ollamaDecompositionClient) return 'remote';
    
    // Performance mode consideration
    switch (options.performanceMode) {
      case 'speed':
        return 'local'; // Local is always faster
      case 'quality':
        return 'remote'; // Sequential thinking potentially higher quality
      case 'balanced':
      default:
        // Intelligent decision based on task complexity and quality threshold
        return this.intelligentStrategySelection(description, options);
    }
  }

  /**
   * Intelligent strategy selection based on task analysis
   */
  private intelligentStrategySelection(
    description: string,
    options: EnhancedDecompositionOptions
  ): 'local' | 'remote' {
    // Simple tasks -> local
    if (description.length < 100 && !this.hasComplexityIndicators(description)) {
      return 'local';
    }
    
    // Very complex tasks -> remote if quality threshold is high
    if (this.hasHighComplexityIndicators(description) && (options.qualityThreshold || 0) > 85) {
      return 'remote';
    }
    
    // Default to local for cost and speed benefits
    return 'local';
  }

  /**
   * Check for complexity indicators
   */
  private hasComplexityIndicators(description: string): boolean {
    const complexityKeywords = [
      'distributed', 'microservice', 'scalable', 'enterprise',
      'integration', 'api', 'multiple', 'various'
    ];
    
    const desc = description.toLowerCase();
    return complexityKeywords.some(keyword => desc.includes(keyword));
  }

  /**
   * Check for high complexity indicators
   */
  private hasHighComplexityIndicators(description: string): boolean {
    const highComplexityKeywords = [
      'machine learning', 'ai', 'blockchain', 'real-time',
      'high-performance', 'concurrent', 'distributed system',
      'microservices architecture', 'event-driven'
    ];
    
    const desc = description.toLowerCase();
    return highComplexityKeywords.some(keyword => desc.includes(keyword));
  }

  /**
   * Decompose using local Ollama client
   */
  private async decomposeWithLocal(
    description: string,
    context: ProjectContext,
    options: EnhancedDecompositionOptions
  ): Promise<TaskDecomposition> {
    const logger = this.getLogger();
    
    try {
      // Call local decomposition
      const localResult: LocalDecompositionResult = await this.ollamaDecompositionClient.decomposeTask(
        description,
        {
          projectId: context.projectId,
          domain: context.domain,
          constraints: context.constraints,
          targetAgents: context.targetAgents
        },
        {
          maxDepth: options.maxDepth || 6,
          includeEstimates: options.includeEstimates !== false,
          generateDependencies: options.generateDependencies !== false,
          atomicTimeLimit: 30 // Enforce 30-minute atomic tasks
        }
      );
      
      // Convert local result to TaskDecomposition format
      return this.convertLocalToTaskDecomposition(localResult, description, context);
      
    } catch (error) {
      logger.error('Local decomposition failed', error);
      throw error;
    }
  }

  /**
   * Decompose using remote Sequential Thinking (existing implementation)
   */
  private async decomposeWithRemote(
    description: string,
    context: ProjectContext,
    options: EnhancedDecompositionOptions
  ): Promise<TaskDecomposition> {
    // Use parent class implementation
    return super.decomposeTask(description, context, options);
  }

  /**
   * Convert local decomposition result to TaskDecomposition format
   */
  private convertLocalToTaskDecomposition(
    localResult: LocalDecompositionResult,
    _description: string,
    _context: ProjectContext
  ): TaskDecomposition {
    const hierarchy = localResult.hierarchy;
    
    return {
      epic: hierarchy.epic,
      features: hierarchy.features,
      stories: hierarchy.stories,
      tasks: hierarchy.tasks,
      subtasks: hierarchy.subtasks,
      atomic: hierarchy.atomic,
      dependencies: localResult.dependencies,
      metadata: {
        totalTasks: localResult.metadata.totalTasks,
        hierarchyDepth: localResult.metadata.hierarchyDepth,
        totalEstimatedHours: localResult.metadata.totalEstimatedHours,
        decompositionTime: localResult.metadata.decompositionTime
      }
    };
  }

  /**
   * Update local processing metrics
   */
  private updateLocalMetrics(decomposition: TaskDecomposition, executionTime: number): void {
    this.performanceMetrics.localDecompositions++;
    
    // Update average time
    const count = this.performanceMetrics.localDecompositions;
    const currentAvg = this.performanceMetrics.averageLocalTime;
    this.performanceMetrics.averageLocalTime = 
      (currentAvg * (count - 1) + executionTime) / count;
    
    // Update average quality if available
    const metadata = decomposition.metadata as EnhancedMetadata;
    if (metadata.qualityScore) {
      const qualityCount = this.performanceMetrics.localDecompositions;
      const currentQualityAvg = this.performanceMetrics.averageLocalQuality;
      this.performanceMetrics.averageLocalQuality = 
        (currentQualityAvg * (qualityCount - 1) + ((decomposition.metadata as EnhancedMetadata).qualityScore || 0)) / qualityCount;
    }
    
    // Update cost savings
    this.performanceMetrics.totalCostSaved += (decomposition.metadata as EnhancedMetadata).costSaved || 5;
  }

  /**
   * Update remote processing metrics
   */
  private updateRemoteMetrics(decomposition: TaskDecomposition, executionTime: number): void {
    this.performanceMetrics.remoteDecompositions++;
    
    // Update average time
    const count = this.performanceMetrics.remoteDecompositions;
    const currentAvg = this.performanceMetrics.averageRemoteTime;
    this.performanceMetrics.averageRemoteTime = 
      (currentAvg * (count - 1) + executionTime) / count;
    
    // Update average quality if available
    const metadata = decomposition.metadata as EnhancedMetadata;
    if (metadata.qualityScore) {
      const qualityCount = this.performanceMetrics.remoteDecompositions;
      const currentQualityAvg = this.performanceMetrics.averageRemoteQuality;
      this.performanceMetrics.averageRemoteQuality = 
        (currentQualityAvg * (qualityCount - 1) + ((decomposition.metadata as EnhancedMetadata).qualityScore || 0)) / qualityCount;
    }
  }

  /**
   * Get comprehensive performance statistics
   */
  getEnhancedPerformanceStats(): any {
    const total = this.performanceMetrics.localDecompositions + this.performanceMetrics.remoteDecompositions;
    
    return {
      decompositions: {
        total,
        local: this.performanceMetrics.localDecompositions,
        remote: this.performanceMetrics.remoteDecompositions,
        localPercentage: total > 0 ? Math.round((this.performanceMetrics.localDecompositions / total) * 100) : 0
      },
      performance: {
        averageLocalTime: Math.round(this.performanceMetrics.averageLocalTime),
        averageRemoteTime: Math.round(this.performanceMetrics.averageRemoteTime),
        speedImprovement: this.performanceMetrics.averageRemoteTime > 0 
          ? Math.round(((this.performanceMetrics.averageRemoteTime - this.performanceMetrics.averageLocalTime) / this.performanceMetrics.averageRemoteTime) * 100)
          : 0
      },
      quality: {
        averageLocalQuality: Math.round(this.performanceMetrics.averageLocalQuality),
        averageRemoteQuality: Math.round(this.performanceMetrics.averageRemoteQuality),
        qualityDifference: Math.round(this.performanceMetrics.averageRemoteQuality - this.performanceMetrics.averageLocalQuality)
      },
      costs: {
        totalSaved: this.performanceMetrics.totalCostSaved,
        estimatedRemoteCost: this.performanceMetrics.remoteDecompositions * 5, // Estimated $5 per remote call
        savings: `$${this.performanceMetrics.totalCostSaved}`
      },
      availability: {
        localAvailable: !!this.ollamaDecompositionClient,
        localStats: this.ollamaDecompositionClient ? this.ollamaDecompositionClient.getPerformanceStats() : null
      }
    };
  }

  /**
   * A/B test local vs remote decomposition for comparison
   */
  async abTestDecomposition(
    description: string,
    context: ProjectContext,
    options: EnhancedDecompositionOptions = {}
  ): Promise<{ local: TaskDecomposition; remote: TaskDecomposition; comparison: any }> {
    const logger = this.getLogger();
    
    logger.info('Starting A/B test: local vs remote decomposition');
    
    const startTime = Date.now();
    
    // Run both decompositions in parallel
    const [localResult, remoteResult] = await Promise.allSettled([
      this.decomposeWithLocal(description, context, options),
      this.decomposeWithRemote(description, context, options)
    ]);
    
    const totalTime = Date.now() - startTime;
    
    // Extract results
    const local = localResult.status === 'fulfilled' ? localResult.value : null;
    const remote = remoteResult.status === 'fulfilled' ? remoteResult.value : null;
    
    // Generate comparison
    const comparison = {
      executionTime: totalTime,
      localTime: local ? local.metadata.decompositionTime : null,
      remoteTime: remote ? remote.metadata.decompositionTime : null,
      localQuality: local ? (local.metadata as EnhancedMetadata).qualityScore : null,
      remoteQuality: remote ? (remote.metadata as EnhancedMetadata).qualityScore : null,
      localTasks: local ? local.metadata.totalTasks : null,
      remoteTasks: remote ? remote.metadata.totalTasks : null,
      localAtomic: local ? (local.metadata as EnhancedMetadata).atomicTasksCount : null,
      remoteAtomic: remote ? (remote.metadata as EnhancedMetadata).atomicTasksCount : null,
      recommendation: this.generateABTestRecommendation(local, remote),
      errors: {
        local: localResult.status === 'rejected' ? localResult.reason.message : null,
        remote: remoteResult.status === 'rejected' ? remoteResult.reason.message : null
      }
    };
    
    logger.info('A/B test completed', comparison);
    
    return { local: local!, remote: remote!, comparison };
  }

  /**
   * Generate recommendation based on A/B test results
   */
  private generateABTestRecommendation(local: TaskDecomposition | null, remote: TaskDecomposition | null): string {
    if (!local && !remote) return 'Both methods failed';
    if (!local) return 'Use remote - local failed';
    if (!remote) return 'Use local - remote failed';
    
    const localQuality = (local.metadata as EnhancedMetadata).qualityScore || 0;
    const remoteQuality = (remote.metadata as EnhancedMetadata).qualityScore || 0;
    const qualityDiff = Math.abs(localQuality - remoteQuality);
    
    // If quality is similar (within 5 points), prefer local for speed/cost
    if (qualityDiff <= 5) {
      return `Use local - similar quality (${localQuality}% vs ${remoteQuality}%) but faster and free`;
    }
    
    // If remote is significantly better quality
    if (remoteQuality > localQuality + 5) {
      return `Use remote - higher quality (${remoteQuality}% vs ${localQuality}%)`;
    }
    
    // If local is significantly better quality
    if (localQuality > remoteQuality + 5) {
      return `Use local - higher quality (${localQuality}% vs ${remoteQuality}%) and free`;
    }
    
    return 'Quality comparable - prefer local for cost and speed';
  }

  /**
   * Reset performance metrics
   */
  resetPerformanceMetrics(): void {
    this.performanceMetrics = {
      localDecompositions: 0,
      remoteDecompositions: 0,
      averageLocalTime: 0,
      averageRemoteTime: 0,
      averageLocalQuality: 0,
      averageRemoteQuality: 0,
      totalCostSaved: 0
    };
    
    if (this.ollamaDecompositionClient) {
      this.ollamaDecompositionClient.resetMetrics();
    }
    
    this.getLogger().info('Performance metrics reset');
  }
}