import { Logger } from '../utils/Logger';
import { IdGenerationService, TaskLevel, IdGenerationContext } from './IdGenerationService';
import { StateService } from './StateService';

// Sequential Thinking output structure
export interface SequentialThought {
  content: string;
  type?: string;
  subtasks?: SequentialThought[];
  dependencies?: string[];
  estimatedHours?: number;
  metadata?: Record<string, any>;
}

// Task structure
export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskLevel;
  parentId: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours: number;
  actualHours?: number;
  assignee?: string;
  labels?: string[];
  dependencies?: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

// Task dependency
export interface TaskDependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: 'blocks' | 'depends_on';
  strict: boolean;
  notes?: string;
}

// Complete task decomposition
export interface TaskDecomposition {
  epic: Task | null;
  features: Task[];
  stories: Task[];
  tasks: Task[];
  subtasks: Task[];
  atomic: Task[];
  dependencies: TaskDependency[];
  metadata: {
    totalTasks: number;
    totalEstimatedHours: number;
    hierarchyDepth: number;
    decompositionTime: number;
  };
}

// Project context for decomposition
export interface ProjectContext {
  projectId?: string;
  domain?: string;
  constraints?: string[];
  targetAgents?: string[];
  existingTasks?: Task[];
}

/**
 * Maps Sequential Thinking output to Tony Framework's UPP hierarchy
 */
export class TonyHierarchyMapper {
  private logger: Logger;
  private idGenerationService: IdGenerationService;
  private taskMap = new Map<string, Task>();
  private thoughtToTaskMap = new Map<SequentialThought, Task>();
  
  // Keywords for level detection
  private levelKeywords = {
    epic: ['system', 'platform', 'application', 'project', 'solution'],
    feature: ['feature', 'capability', 'module', 'component', 'service'],
    story: ['as a', 'user story', 'i want', 'so that', 'scenario'],
    task: ['implement', 'create', 'build', 'develop', 'design', 'setup'],
    subtask: ['sub', 'part', 'step', 'phase', 'section'],
    atomic: ['function', 'method', 'endpoint', 'query', 'test', 'fix']
  };

  constructor(logger: Logger, stateService: StateService) {
    this.logger = logger;
    this.idGenerationService = new IdGenerationService(stateService, logger);
  }

  /**
   * Convert Sequential Thinking output to Tony hierarchy
   */
  async mapSequentialToHierarchy(
    thoughts: SequentialThought[],
    context: ProjectContext = {}
  ): Promise<TaskDecomposition> {
    const startTime = Date.now();
    
    this.logger.info('Starting Sequential Thinking to Tony hierarchy mapping', {
      thoughtCount: thoughts.length,
      context
    });

    // Reset state
    this.taskMap.clear();
    this.thoughtToTaskMap.clear();

    const decomposition: TaskDecomposition = {
      epic: null,
      features: [],
      stories: [],
      tasks: [],
      subtasks: [],
      atomic: [],
      dependencies: [],
      metadata: {
        totalTasks: 0,
        totalEstimatedHours: 0,
        hierarchyDepth: 0,
        decompositionTime: 0
      }
    };

    try {
      // Process thoughts recursively
      for (const thought of thoughts) {
        await this.processThought(thought, decomposition, null, 0);
      }

      // Process dependencies after all tasks are created
      this.processDependencies(decomposition);

      // Calculate metadata
      this.calculateMetadata(decomposition, startTime);

      // Validate hierarchy
      this.validateHierarchy(decomposition);

      this.logger.info('Hierarchy mapping completed', decomposition.metadata);

      return decomposition;
    } catch (error) {
      this.logger.error('Failed to map hierarchy', error);
      throw error;
    }
  }

  /**
   * Process a thought and its subtasks recursively
   */
  private async processThought(
    thought: SequentialThought,
    decomposition: TaskDecomposition,
    parentId: string | null,
    depth: number
  ): Promise<Task> {
    // Determine task level based on content and hierarchy position
    const level = this.determineTaskLevel(thought, parentId, depth);
    
    // Create task from thought
    const task = await this.createTaskFromThought(thought, level, parentId);
    
    // Store task in appropriate array
    this.addTaskToDecomposition(task, decomposition);
    
    // Map thought to task for dependency processing
    this.thoughtToTaskMap.set(thought, task);
    
    // Process subtasks recursively
    if (thought.subtasks && thought.subtasks.length > 0) {
      for (const subtask of thought.subtasks) {
        await this.processThought(subtask, decomposition, task.id, depth + 1);
      }
    }

    return task;
  }

  /**
   * Determine task level using heuristics
   */
  private determineTaskLevel(
    thought: SequentialThought,
    parentId: string | null,
    depth: number
  ): TaskLevel {
    const content = thought.content.toLowerCase();
    
    // If explicitly typed, use that
    if (thought.type && Object.values(TaskLevel).includes(thought.type as TaskLevel)) {
      return thought.type as TaskLevel;
    }
    
    // Root level is typically epic
    if (!parentId && depth === 0) {
      return TaskLevel.EPIC;
    }
    
    // Check keywords for each level
    for (const [level, keywords] of Object.entries(this.levelKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return level as TaskLevel;
      }
    }
    
    // Use depth-based heuristic as fallback
    const depthToLevel: Record<number, TaskLevel> = {
      0: TaskLevel.EPIC,
      1: TaskLevel.FEATURE,
      2: TaskLevel.STORY,
      3: TaskLevel.TASK,
      4: TaskLevel.SUBTASK,
      5: TaskLevel.ATOMIC
    };
    
    return depthToLevel[Math.min(depth, 5)] || TaskLevel.ATOMIC;
  }

  /**
   * Create a Task from a SequentialThought
   */
  private async createTaskFromThought(
    thought: SequentialThought,
    level: TaskLevel,
    parentId: string | null,
    projectId: string = 'default'
  ): Promise<Task> {
    // Create context for ID generation
    const idContext: IdGenerationContext = {
      level,
      parentId: parentId || undefined,
      projectId,
      title: this.extractTitle(thought.content),
      description: thought.content
    };

    const taskId = await this.generateTaskId(idContext);
    
    const task: Task = {
      id: taskId,
      title: this.extractTitle(thought.content),
      description: thought.content,
      type: level,
      parentId: parentId,
      status: 'pending',
      priority: this.determinePriority(thought, level),
      estimatedHours: thought.estimatedHours || this.estimateHours(level),
      labels: this.extractLabels(thought),
      dependencies: [], // Will be populated later
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: thought.metadata || {}
    };

    this.taskMap.set(taskId, task);
    return task;
  }

  /**
   * Generate hierarchical task ID using CLAUDE.md standards
   */
  private async generateTaskId(context: IdGenerationContext): Promise<string> {
    return await this.idGenerationService.generateId(context);
  }

  /**
   * Extract a concise title from content
   */
  private extractTitle(content: string): string {
    // Remove common prefixes
    let title = content
      .replace(/^(implement|create|build|develop|design|setup|add|update|fix)\s+/i, '')
      .trim();
    
    // Get first sentence or line
    const firstSentence = title.split(/[.\n]/)[0]?.trim() || title;
    
    // Limit length
    if (firstSentence.length > 80) {
      return firstSentence.substring(0, 77) + '...';
    }
    
    return firstSentence;
  }

  /**
   * Determine priority based on content and level
   */
  private determinePriority(thought: SequentialThought, level: TaskLevel): Task['priority'] {
    const content = thought.content.toLowerCase();
    
    // Check for priority keywords
    if (content.includes('critical') || content.includes('urgent') || content.includes('asap')) {
      return 'critical';
    }
    if (content.includes('important') || content.includes('high priority')) {
      return 'high';
    }
    if (content.includes('low priority') || content.includes('nice to have')) {
      return 'low';
    }
    
    // Default priority by level
    const levelPriorities: Record<TaskLevel, Task['priority']> = {
      [TaskLevel.EPIC]: 'high',
      [TaskLevel.FEATURE]: 'high',
      [TaskLevel.STORY]: 'medium',
      [TaskLevel.TASK]: 'medium',
      [TaskLevel.SUBTASK]: 'medium',
      [TaskLevel.ATOMIC]: 'low'
    };
    
    const priority = levelPriorities[level];
    return priority !== undefined ? priority : 'medium';
  }

  /**
   * Estimate hours based on task level
   */
  private estimateHours(level: TaskLevel): number {
    const estimates: Record<TaskLevel, number> = {
      [TaskLevel.EPIC]: 160,    // 4 weeks
      [TaskLevel.FEATURE]: 40,   // 1 week
      [TaskLevel.STORY]: 16,     // 2 days
      [TaskLevel.TASK]: 8,       // 1 day
      [TaskLevel.SUBTASK]: 4,    // Half day
      [TaskLevel.ATOMIC]: 2      // 2 hours
    };
    
    return estimates[level];
  }

  /**
   * Extract labels from thought content
   */
  private extractLabels(thought: SequentialThought): string[] {
    const labels: string[] = [];
    const content = thought.content.toLowerCase();
    
    // Technology labels
    const techKeywords = ['api', 'database', 'frontend', 'backend', 'ui', 'ux', 'security', 'performance'];
    techKeywords.forEach(tech => {
      if (content.includes(tech)) {
        labels.push(tech);
      }
    });
    
    // Add custom labels from metadata
    if (thought.metadata && thought.metadata['labels']) {
      const metadataLabels = thought.metadata['labels'];
      if (Array.isArray(metadataLabels)) {
        labels.push(...metadataLabels);
      }
    }
    
    return [...new Set(labels)]; // Remove duplicates
  }

  /**
   * Add task to appropriate array in decomposition
   */
  private addTaskToDecomposition(task: Task, decomposition: TaskDecomposition): void {
    switch (task.type) {
      case TaskLevel.EPIC:
        if (!decomposition.epic) {
          decomposition.epic = task;
        } else {
          // Multiple epics - convert to features
          task.type = TaskLevel.FEATURE;
          decomposition.features.push(task);
        }
        break;
      case TaskLevel.FEATURE:
        decomposition.features.push(task);
        break;
      case TaskLevel.STORY:
        decomposition.stories.push(task);
        break;
      case TaskLevel.TASK:
        decomposition.tasks.push(task);
        break;
      case TaskLevel.SUBTASK:
        decomposition.subtasks.push(task);
        break;
      case TaskLevel.ATOMIC:
        decomposition.atomic.push(task);
        break;
    }
  }

  /**
   * Process dependencies between tasks
   */
  private processDependencies(decomposition: TaskDecomposition): void {
    let dependencyIdCounter = 0;
    
    // Process explicit dependencies from thoughts
    this.thoughtToTaskMap.forEach((task, thought) => {
      if (thought.dependencies && thought.dependencies.length > 0) {
        thought.dependencies.forEach(depContent => {
          // Find matching task by content
          const depTask = this.findTaskByContent(depContent, decomposition);
          if (depTask && depTask.id !== task.id) {
            const dependency: TaskDependency = {
              id: `D-${++dependencyIdCounter}`,
              fromTaskId: depTask.id,
              toTaskId: task.id,
              type: 'blocks',
              strict: true
            };
            decomposition.dependencies.push(dependency);
            task.dependencies?.push(depTask.id);
          }
        });
      }
    });
    
    // Add implicit dependencies (parent must complete before children)
    this.addImplicitDependencies(decomposition, dependencyIdCounter);
  }

  /**
   * Find task by content similarity
   */
  private findTaskByContent(content: string, decomposition: TaskDecomposition): Task | null {
    const allTasks = [
      decomposition.epic,
      ...decomposition.features,
      ...decomposition.stories,
      ...decomposition.tasks,
      ...decomposition.subtasks,
      ...decomposition.atomic
    ].filter(Boolean) as Task[];
    
    const contentLower = content.toLowerCase();
    return allTasks.find(task => 
      task.description.toLowerCase().includes(contentLower) ||
      task.title.toLowerCase().includes(contentLower)
    ) || null;
  }

  /**
   * Add implicit parent-child dependencies
   */
  private addImplicitDependencies(decomposition: TaskDecomposition, startId: number): void {
    let dependencyIdCounter = startId;
    
    // Stories depend on their parent features
    decomposition.stories.forEach(story => {
      if (story.parentId) {
        const parent = this.taskMap.get(story.parentId);
        if (parent && parent.type === TaskLevel.FEATURE) {
          decomposition.dependencies.push({
            id: `D-${++dependencyIdCounter}`,
            fromTaskId: parent.id,
            toTaskId: story.id,
            type: 'blocks',
            strict: false,
            notes: 'Implicit parent-child dependency'
          });
        }
      }
    });
  }

  /**
   * Calculate decomposition metadata
   */
  private calculateMetadata(decomposition: TaskDecomposition, startTime: number): void {
    const allTasks = [
      decomposition.epic,
      ...decomposition.features,
      ...decomposition.stories,
      ...decomposition.tasks,
      ...decomposition.subtasks,
      ...decomposition.atomic
    ].filter(Boolean) as Task[];
    
    decomposition.metadata = {
      totalTasks: allTasks.length,
      totalEstimatedHours: decomposition.atomic.reduce((sum, task) => sum + task.estimatedHours, 0),
      hierarchyDepth: this.calculateMaxDepth(decomposition),
      decompositionTime: Date.now() - startTime
    };
  }

  /**
   * Calculate maximum hierarchy depth
   */
  private calculateMaxDepth(decomposition: TaskDecomposition): number {
    let maxDepth = 0;
    
    const calculateDepth = (taskId: string, currentDepth: number): void => {
      maxDepth = Math.max(maxDepth, currentDepth);
      
      // Find children
      const allTasks = [
        ...decomposition.features,
        ...decomposition.stories,
        ...decomposition.tasks,
        ...decomposition.subtasks,
        ...decomposition.atomic
      ];
      
      allTasks
        .filter(task => task.parentId === taskId)
        .forEach(child => calculateDepth(child.id, currentDepth + 1));
    };
    
    if (decomposition.epic) {
      calculateDepth(decomposition.epic.id, 1);
    }
    
    return maxDepth;
  }

  /**
   * Validate the hierarchy structure
   */
  private validateHierarchy(decomposition: TaskDecomposition): void {
    // Ensure we have at least one epic
    if (!decomposition.epic && decomposition.features.length === 0) {
      throw new Error('No epic or features found in decomposition');
    }
    
    // Ensure all tasks have valid parents (except epic)
    const allTasks = [
      ...decomposition.features,
      ...decomposition.stories,
      ...decomposition.tasks,
      ...decomposition.subtasks,
      ...decomposition.atomic
    ];
    
    allTasks.forEach(task => {
      if (task.parentId && !this.taskMap.has(task.parentId)) {
        this.logger.warn(`Task ${task.id} has invalid parent ${task.parentId}`);
      }
    });
    
    // Warn if hierarchy is too deep
    if (decomposition.metadata.hierarchyDepth > 6) {
      this.logger.warn(`Hierarchy depth ${decomposition.metadata.hierarchyDepth} exceeds recommended maximum of 6`);
    }
  }
}