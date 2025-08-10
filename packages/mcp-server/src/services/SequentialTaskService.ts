import { TaskService } from './TaskService';
import { TonyHierarchyMapper, TaskDecomposition, SequentialThought, ProjectContext } from './TonyHierarchyMapper';
import { MCPServerConfig } from '../types';
import { Logger } from '../utils/Logger';
import { SequentialThinkingClient } from '../clients/SequentialThinkingClient';

// Estimation result
export interface TaskEstimate {
  taskId: string;
  estimatedHours: number;
  confidence: 'low' | 'medium' | 'high';
  method: string;
  factors?: Record<string, number>;
}

// Assignment result
export interface TaskAssignment {
  taskId: string;
  agentId: string;
  reason: string;
  score: number;
  alternativeAgents?: string[];
}

// Complexity analysis result
export interface ComplexityAnalysis {
  overallScore: number;
  factors: Record<string, number>;
  recommendation: string;
  suggestedApproach?: string;
  estimatedEffort?: string;
}

// Decomposition options
export interface DecompositionOptions {
  maxDepth?: number;
  includeEstimates?: boolean;
  autoAssign?: boolean;
  generateDependencies?: boolean;
}

/**
 * Extended TaskService with Sequential Thinking capabilities
 */
export class SequentialTaskService extends TaskService {
  private hierarchyMapper: TonyHierarchyMapper;
  private sequentialClient: SequentialThinkingClient;

  constructor(config: MCPServerConfig, logger: Logger) {
    super(config, logger);
    this.hierarchyMapper = new TonyHierarchyMapper(logger, this.stateService);
    this.sequentialClient = new SequentialThinkingClient(logger);
  }

  /**
   * Decompose a high-level task using Sequential Thinking
   */
  async decomposeTask(
    description: string,
    context: ProjectContext,
    options: DecompositionOptions = {}
  ): Promise<TaskDecomposition> {
    const logger = this.getLogger();
    
    try {
      logger.info('Starting task decomposition', { description, context, options });

      // Call Sequential Thinking MCP (mocked for now)
      const thoughts = await this.callSequentialThinking(description, options);
      
      // Map to Tony hierarchy
      const decomposition = await this.hierarchyMapper.mapSequentialToHierarchy(
        thoughts,
        context
      );
      
      // Store tasks in database if requested
      if (options.autoAssign !== false) {
        await this.storeDecomposition(decomposition);
      }
      
      logger.info('Task decomposition completed', {
        totalTasks: decomposition.metadata.totalTasks,
        hierarchyDepth: decomposition.metadata.hierarchyDepth
      });
      
      return decomposition;
    } catch (error) {
      logger.error('Task decomposition failed', error);
      throw error;
    }
  }

  /**
   * Batch estimate task durations
   */
  async batchEstimateTasks(
    taskIds: string[],
    method: 'ai' | 'historical' | 'manual',
    confidence: 'low' | 'medium' | 'high',
    overrides?: Record<string, number>
  ): Promise<TaskEstimate[]> {
    const logger = this.getLogger();
    
    try {
      logger.info('Batch estimating tasks', { count: taskIds.length, method });

      const estimates: TaskEstimate[] = [];
      
      for (const taskId of taskIds) {
        const task = await this.getTask(taskId);
        if (!task) continue;
        
        let estimatedHours = task.estimated_hours || 0;
        
        // Apply override if provided
        if (overrides && overrides[taskId]) {
          estimatedHours = overrides[taskId];
        } else if (method === 'ai') {
          // AI estimation based on task description and type
          estimatedHours = await this.estimateWithAI(task);
        } else if (method === 'historical') {
          // Historical estimation based on similar tasks
          estimatedHours = await this.estimateFromHistory(task);
        }
        
        estimates.push({
          taskId,
          estimatedHours,
          confidence,
          method,
          factors: {
            complexity: this.calculateComplexity(task),
            dependencies: task.dependencies?.length || 0
          }
        });
      }
      
      return estimates;
    } catch (error) {
      logger.error('Batch estimation failed', error);
      throw error;
    }
  }

  /**
   * Intelligently assign tasks to agents
   */
  async intelligentAssignTasks(
    taskIds: string[],
    strategy: 'skill_match' | 'load_balance' | 'priority' | 'hybrid',
    constraints: {
      maxTasksPerAgent?: number;
      requiredSkills?: string[];
      preferredAgents?: string[];
      excludeAgents?: string[];
    }
  ): Promise<TaskAssignment[]> {
    const logger = this.getLogger();
    
    try {
      logger.info('Intelligent task assignment', { count: taskIds.length, strategy });

      const assignments: TaskAssignment[] = [];
      
      // Get available agents (mocked for now)
      const agents = await this.getAvailableAgents(constraints);
      
      for (const taskId of taskIds) {
        const task = await this.getTask(taskId);
        if (!task) continue;
        
        // Score each agent for this task
        const scores = await this.scoreAgentsForTask(task, agents, strategy);
        
        // Select best agent
        const bestAgent = scores[0];
        
        assignments.push({
          taskId,
          agentId: bestAgent.agentId,
          reason: bestAgent.reason,
          score: bestAgent.score,
          alternativeAgents: scores.slice(1, 4).map(s => s.agentId)
        });
        
        // Update task assignment
        await this.updateTask(taskId, { assignee: bestAgent.agentId });
      }
      
      return assignments;
    } catch (error) {
      logger.error('Intelligent assignment failed', error);
      throw error;
    }
  }

  /**
   * Analyze task complexity
   */
  async analyzeTaskComplexity(
    description: string,
    factors: ('technical' | 'domain' | 'integration' | 'scale')[]
  ): Promise<ComplexityAnalysis> {
    const logger = this.getLogger();
    
    try {
      logger.info('Analyzing task complexity', { description });

      const analysis: ComplexityAnalysis = {
        overallScore: 0,
        factors: {},
        recommendation: '',
        suggestedApproach: ''
      };
      
      // Analyze each factor
      for (const factor of factors) {
        analysis.factors[factor] = await this.analyzeFactor(description, factor);
      }
      
      // Calculate overall score
      const scores = Object.values(analysis.factors);
      analysis.overallScore = Math.round(
        scores.reduce((sum, score) => sum + score, 0) / scores.length
      );
      
      // Generate recommendation
      if (analysis.overallScore >= 8) {
        analysis.recommendation = 'High complexity - requires senior developer and careful planning';
        analysis.suggestedApproach = 'Break into multiple epics with extensive testing';
        analysis.estimatedEffort = '4-6 weeks';
      } else if (analysis.overallScore >= 5) {
        analysis.recommendation = 'Medium complexity - standard development approach';
        analysis.suggestedApproach = 'Single epic with multiple features';
        analysis.estimatedEffort = '1-2 weeks';
      } else {
        analysis.recommendation = 'Low complexity - straightforward implementation';
        analysis.suggestedApproach = 'Single feature with few stories';
        analysis.estimatedEffort = '2-5 days';
      }
      
      return analysis;
    } catch (error) {
      logger.error('Complexity analysis failed', error);
      throw error;
    }
  }

  /**
   * Call Sequential Thinking MCP
   */
  private async callSequentialThinking(
    description: string,
    options: DecompositionOptions
  ): Promise<SequentialThought[]> {
    const logger = this.getLogger();
    
    try {
      // Connect to Sequential Thinking server if not connected
      if (!this.sequentialClient.isClientConnected()) {
        await this.sequentialClient.connect();
      }
      
      // Create task decomposition prompt
      const prompt = this.buildDecompositionPrompt(description, options);
      
      // Call Sequential Thinking
      const result = await this.sequentialClient.think(prompt, {
        maxSteps: options.maxDepth ? options.maxDepth * 3 : 15,
        temperature: 0.7,
        model: 'gpt-4'
      });
      
      // Convert Sequential Thinking output to our format
      return this.convertToSequentialThoughts(result);
      
    } catch (error) {
      logger.warn('Sequential Thinking failed, falling back to mock', error as Error);
      
      // Fallback to mock implementation
      return this.getMockThoughts(description);
    }
  }
  
  /**
   * Build decomposition prompt for Sequential Thinking
   */
  private buildDecompositionPrompt(description: string, options: DecompositionOptions): string {
    let prompt = `Decompose the following task into a hierarchical structure using the UPP methodology (Epic → Feature → Story → Task → SubTask → Atomic):\n\n`;
    prompt += `Task: ${description}\n\n`;
    prompt += `Requirements:\n`;
    prompt += `- Follow the 6-level UPP hierarchy strictly\n`;
    prompt += `- Each atomic task should be completable in 30 minutes or less\n`;
    prompt += `- Include clear descriptions for each level\n`;
    
    if (options.includeEstimates) {
      prompt += `- Provide time estimates for tasks (in hours)\n`;
    }
    
    if (options.generateDependencies) {
      prompt += `- Identify dependencies between tasks\n`;
    }
    
    if (options.maxDepth) {
      prompt += `- Limit decomposition depth to ${options.maxDepth} levels\n`;
    }
    
    prompt += `\nOutput the decomposition in a structured format with clear hierarchy levels.`;
    
    return prompt;
  }
  
  /**
   * Convert Sequential Thinking result to our format
   */
  private convertToSequentialThoughts(result: any): SequentialThought[] {
    // Parse the Sequential Thinking output and convert to our format
    // This is a simplified conversion - real implementation would be more sophisticated
    
    const thoughts: SequentialThought[] = [];
    
    if (result.thoughts && Array.isArray(result.thoughts)) {
      for (const thought of result.thoughts) {
        // Extract task structure from thought
        const parsed = this.parseThoughtContent(thought.thought || thought);
        if (parsed) {
          thoughts.push(parsed);
        }
      }
    }
    
    // If no valid thoughts parsed, create from final answer
    if (thoughts.length === 0 && result.finalAnswer) {
      const parsed = this.parseThoughtContent(result.finalAnswer);
      if (parsed) {
        thoughts.push(parsed);
      }
    }
    
    return thoughts;
  }
  
  /**
   * Parse thought content into structured format
   */
  private parseThoughtContent(content: string): SequentialThought | null {
    // This is a simplified parser - real implementation would be more sophisticated
    // For now, return a basic structure
    
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return null;
    
    // Look for hierarchy indicators
    const epicMatch = lines.find(line => line.toLowerCase().includes('epic'));
    if (epicMatch) {
      return {
        content: epicMatch.replace(/^.*epic[:\s]*/i, '').trim(),
        type: 'epic',
        subtasks: []
      };
    }
    
    // Default to task level
    return {
      content: lines[0] || 'Unnamed task',
      type: 'task'
    };
  }
  
  /**
   * Get mock thoughts for fallback
   */
  private getMockThoughts(description: string): SequentialThought[] {
    return [
      {
        content: `${description} - Main System`,
        type: 'epic',
        subtasks: [
          {
            content: 'Core Implementation',
            type: 'feature',
            subtasks: [
              {
                content: 'As a developer, I want to implement the main functionality',
                type: 'story',
                subtasks: [
                  {
                    content: 'Set up project structure',
                    type: 'task',
                    estimatedHours: 2
                  },
                  {
                    content: 'Implement core logic',
                    type: 'task',
                    estimatedHours: 4
                  },
                  {
                    content: 'Add unit tests',
                    type: 'task',
                    estimatedHours: 3
                  }
                ]
              }
            ]
          }
        ]
      }
    ];
  }

  /**
   * Store decomposition in database
   */
  private async storeDecomposition(decomposition: TaskDecomposition): Promise<void> {
    // Store all tasks
    const allTasks = [
      decomposition.epic,
      ...decomposition.features,
      ...decomposition.stories,
      ...decomposition.tasks,
      ...decomposition.subtasks,
      ...decomposition.atomic
    ].filter(Boolean);
    
    for (const task of allTasks) {
      if (task) {
        await this.createTask({
          title: task.title,
          description: task.description,
          type: task.type as any,
          parent_id: task.parentId || undefined,
          priority: task.priority,
          estimated_hours: task.estimatedHours,
          labels: task.labels
        }, 'system');
      }
    }
    
    // Store dependencies
    for (const dep of decomposition.dependencies) {
      const depOptions: any = {
        type: dep.type,
        strict: dep.strict
      };
      if (dep.notes) {
        depOptions.notes = dep.notes;
      }
      await this.addDependency(
        dep.toTaskId,
        dep.fromTaskId,
        depOptions
      );
    }
  }

  /**
   * AI-based estimation (mocked)
   */
  private async estimateWithAI(task: any): Promise<number> {
    // Mock AI estimation based on task type and description length
    const baseHours: Record<string, number> = {
      epic: 160,
      feature: 40,
      story: 16,
      task: 8,
      subtask: 4,
      atomic: 2
    };
    
    const complexity = this.calculateComplexity(task);
    const base = baseHours[task.type] || 8;
    return base * (1 + complexity / 10);
  }

  /**
   * Historical estimation (mocked)
   */
  private async estimateFromHistory(task: any): Promise<number> {
    // Mock historical estimation
    return task.estimated_hours || 8;
  }

  /**
   * Calculate task complexity
   */
  private calculateComplexity(task: any): number {
    let complexity = 5; // Base complexity
    
    // Adjust based on description length
    if (task.description && task.description.length > 200) complexity += 1;
    if (task.description && task.description.length > 500) complexity += 1;
    
    // Adjust based on dependencies
    if (task.dependencies && task.dependencies.length > 2) complexity += 1;
    if (task.dependencies && task.dependencies.length > 5) complexity += 1;
    
    // Adjust based on labels
    if (task.labels?.includes('security')) complexity += 2;
    if (task.labels?.includes('performance')) complexity += 1;
    
    return Math.min(complexity, 10);
  }

  /**
   * Get available agents (mocked)
   */
  private async getAvailableAgents(constraints: any): Promise<any[]> {
    // Mock agent list
    const agents = [
      { id: 'BE-BACKEND-BENJAMIN', skills: ['backend', 'api', 'database'], load: 3 },
      { id: 'FE-FRONTEND-FIONA', skills: ['frontend', 'ui', 'react'], load: 2 },
      { id: 'FS-FULLSTACK-FELIX', skills: ['fullstack', 'api', 'ui'], load: 4 }
    ];
    
    // Apply constraints
    return agents.filter(agent => {
      if (constraints.excludeAgents?.includes(agent.id)) return false;
      if (constraints.maxTasksPerAgent && agent.load >= constraints.maxTasksPerAgent) return false;
      return true;
    });
  }

  /**
   * Score agents for task (mocked)
   */
  private async scoreAgentsForTask(task: any, agents: any[], strategy: string): Promise<any[]> {
    const scores = agents.map(agent => {
      let score = 50; // Base score
      
      // Skill match
      if (task.labels) {
        const matchingSkills = task.labels.filter((label: string) => 
          agent.skills.includes(label)
        ).length;
        score += matchingSkills * 20;
      }
      
      // Load balance
      if (strategy === 'load_balance' || strategy === 'hybrid') {
        score -= agent.load * 10;
      }
      
      // Priority
      if (strategy === 'priority' && task.priority === 'high') {
        score += 20;
      }
      
      return {
        agentId: agent.id,
        score,
        reason: `Best match based on ${strategy} strategy`
      };
    });
    
    // Sort by score descending
    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * Analyze specific complexity factor
   */
  private async analyzeFactor(description: string, factor: string): Promise<number> {
    const desc = description.toLowerCase();
    let score = 5; // Base score
    
    switch (factor) {
      case 'technical':
        if (desc.includes('distributed') || desc.includes('microservice')) score += 3;
        if (desc.includes('real-time') || desc.includes('websocket')) score += 2;
        if (desc.includes('machine learning') || desc.includes('ai')) score += 3;
        break;
        
      case 'domain':
        if (desc.includes('payment') || desc.includes('financial')) score += 3;
        if (desc.includes('healthcare') || desc.includes('medical')) score += 3;
        if (desc.includes('security') || desc.includes('encryption')) score += 2;
        break;
        
      case 'integration':
        if (desc.includes('third-party') || desc.includes('external')) score += 2;
        if (desc.includes('api') || desc.includes('integration')) score += 1;
        if (desc.includes('multiple') || desc.includes('various')) score += 1;
        break;
        
      case 'scale':
        if (desc.includes('millions') || desc.includes('large-scale')) score += 3;
        if (desc.includes('global') || desc.includes('worldwide')) score += 2;
        if (desc.includes('high-traffic') || desc.includes('concurrent')) score += 2;
        break;
    }
    
    return Math.min(score, 10);
  }

  /**
   * Get logger (protected method from parent)
   */
  protected getLogger(): Logger {
    return (this as any).logger;
  }
}