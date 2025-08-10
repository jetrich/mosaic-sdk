/**
 * UPP Decomposer - Hierarchical Task Decomposition Engine
 * 
 * Handles the core logic for decomposing high-level requirements into
 * the complete UPP hierarchy: Epic → Feature → Story → Task → Subtask → Atomic
 * 
 * Works in coordination with Tony orchestrator to provide the decomposition
 * logic while Tony handles agent spawning and coordination.
 */

import { Logger } from '../utils/Logger';
import { SequentialTaskService } from '../services/SequentialTaskServiceBridge';

export interface UPPTask {
  id: string;
  title: string;
  description: string;
  level: 'epic' | 'feature' | 'story' | 'task' | 'subtask' | 'atomic';
  parentId?: string;
  estimatedHours?: number;
  assignedAgent?: string;
  status: 'pending' | 'in_progress' | 'completed';
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    domainCategory?: number; // 0-9 for E.CXXX categories
    businessPriority?: 'high' | 'medium' | 'low';
    technicalComplexity?: 'high' | 'medium' | 'low';
    dependencies?: string[];
  };
}

export interface UPPHierarchy {
  epic: UPPTask;
  features: UPPTask[];
  stories: UPPTask[];
  tasks: UPPTask[];
  subtasks: UPPTask[];
  atomic: UPPTask[];
  dependencies: Array<{
    taskId: string;
    dependsOn: string[];
  }>;
  metadata: {
    totalTasks: number;
    totalEstimatedHours: number;
    hierarchyDepth: number;
    decompositionTime: number;
    qualityScore: number;
  };
}

export interface DecompositionContext {
  projectId: string;
  description: string;
  businessConstraints?: {
    timeline?: string;
    budget?: string;
    quality?: 'high' | 'medium' | 'low';
    scope?: 'full' | 'mvp' | 'proof-of-concept';
  };
  technicalConstraints?: {
    stack?: string[];
    architecture?: string;
    scalability?: string;
    performance?: string[];
  };
  stakeholders?: string[];
}

/**
 * UPP Decomposer - Core decomposition engine
 */
export class UPPDecomposer {
  private logger: Logger;
  private sequentialTaskService: SequentialTaskService;
  
  // UPP Configuration
  private readonly UPP_TARGETS = {
    epic: { min: 1, max: 1, optimal: 1 }, // Single epic per project
    feature: { min: 3, max: 7, optimal: 5 },
    story: { min: 3, max: 7, optimal: 5 },
    task: { min: 2, max: 5, optimal: 3 },
    subtask: { min: 3, max: 5, optimal: 4 },
    atomic: { min: 2, max: 4, optimal: 3 }
  };

  private readonly ATOMIC_TASK_MAX_HOURS = 0.5; // 30 minutes
  private readonly DOMAIN_CATEGORIES = {
    infrastructure: 0,
    core_features: 1,
    integration: 2,
    frontend: 3,
    backend: 4,
    data: 5,
    security: 6,
    devops: 7,
    documentation: 8,
    maintenance: 9
  };

  constructor(
    logger: Logger,
    sequentialTaskService: SequentialTaskService
  ) {
    this.logger = logger;
    this.sequentialTaskService = sequentialTaskService;
  }

  /**
   * Decompose a project description into complete UPP hierarchy
   */
  async decomposeProject(context: DecompositionContext): Promise<UPPHierarchy> {
    const startTime = Date.now();
    
    this.logger.info('Starting UPP project decomposition', {
      projectId: context.projectId,
      description: context.description.substring(0, 100) + '...'
    });

    try {
      // Step 1: Create Epic from project description
      const epic = await this.createEpic(context);
      
      // Step 2: Decompose Epic into Features
      const features = await this.decomposeToFeatures(epic, context);
      
      // Step 3: Decompose Features into Stories
      const stories = await this.decomposeToStories(features, context);
      
      // Step 4: Decompose Stories into Tasks
      const tasks = await this.decomposeToTasks(stories, context);
      
      // Step 5: Decompose Tasks into Subtasks
      const subtasks = await this.decomposeToSubtasks(tasks, context);
      
      // Step 6: Decompose Subtasks into Atomic Tasks
      const atomic = await this.decomposeToAtomic(subtasks, context);
      
      // Step 7: Generate dependencies
      const dependencies = await this.generateDependencies([
        ...features, ...stories, ...tasks, ...subtasks, ...atomic
      ]);

      const decompositionTime = Date.now() - startTime;
      
      // Build complete hierarchy
      const hierarchy: UPPHierarchy = {
        epic,
        features,
        stories,
        tasks,
        subtasks,
        atomic,
        dependencies,
        metadata: {
          totalTasks: 1 + features.length + stories.length + tasks.length + subtasks.length + atomic.length,
          totalEstimatedHours: this.calculateTotalHours([epic, ...features, ...stories, ...tasks, ...subtasks, ...atomic]),
          hierarchyDepth: 6,
          decompositionTime,
          qualityScore: this.calculateQualityScore(epic, features, stories, tasks, subtasks, atomic)
        }
      };

      this.logger.info('UPP decomposition completed successfully', {
        totalTasks: hierarchy.metadata.totalTasks,
        totalHours: hierarchy.metadata.totalEstimatedHours,
        duration: decompositionTime
      });

      return hierarchy;

    } catch (error: any) {
      this.logger.error('UPP decomposition failed', error);
      throw error;
    }
  }

  /**
   * Create Epic from project description
   */
  private async createEpic(context: DecompositionContext): Promise<UPPTask> {
    this.logger.info('Creating Epic from project description');

    const epicId = this.generateTaskId('epic', context.projectId, 0);
    const domainCategory = this.inferDomainCategory(context.description);
    
    // Use AI to refine epic title and description
    const refinementPrompt = `
    Refine this project into a clear Epic:
    
    Project: ${context.description}
    
    Create:
    - Epic Title: Clear business outcome (max 60 chars)
    - Epic Description: Business value and success criteria (2-3 sentences)
    - Estimated effort in hours (high-level)
    
    Format:
    Title: [epic title]
    Description: [description]
    Hours: [estimate]
    `;

    try {
      const refinement = await this.sequentialTaskService.decomposeTask(
        refinementPrompt,
        { projectId: context.projectId, level: 'epic' },
        { maxDepth: 1, includeEstimates: true }
      );

      const epic: UPPTask = {
        id: epicId,
        title: this.extractTitle(refinement) || `Epic: ${context.description.substring(0, 50)}`,
        description: this.extractDescription(refinement) || context.description,
        level: 'epic',
        estimatedHours: this.extractHours(refinement) || this.estimateProjectHours(context),
        status: 'pending',
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          domainCategory,
          businessPriority: 'high',
          technicalComplexity: this.inferTechnicalComplexity(context.description),
          dependencies: []
        }
      };

      return epic;

    } catch (error: any) {
      this.logger.warn('AI epic refinement failed, using fallback', { error: error.message });
      
      // Fallback epic creation
      return {
        id: epicId,
        title: `Epic: ${context.description.substring(0, 50)}`,
        description: context.description,
        level: 'epic',
        estimatedHours: this.estimateProjectHours(context),
        status: 'pending',
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          domainCategory,
          businessPriority: 'high',
          technicalComplexity: 'medium',
          dependencies: []
        }
      };
    }
  }

  /**
   * Decompose Epic into Features
   */
  private async decomposeToFeatures(epic: UPPTask, context: DecompositionContext): Promise<UPPTask[]> {
    this.logger.info('Decomposing Epic into Features');

    const prompt = `
    Decompose this Epic into 3-7 Features that deliver business value:
    
    Epic: ${epic.title}
    ${epic.description}
    
    Each Feature should:
    - Represent a major functional area
    - Deliver standalone business value
    - Be implementable by a small team
    - Take 2-4 weeks to complete
    
    Create exactly 5 features with:
    - Feature Title (max 60 chars)
    - Description (2-3 sentences)
    - Estimated hours
    
    Format each as:
    Feature: [title]
    Description: [description]
    Hours: [estimate]
    ---
    `;

    try {
      const decomposition = await this.sequentialTaskService.decomposeTask(
        prompt,
        { 
          projectId: context.projectId, 
          level: 'feature',
          parentId: epic.id
        },
        { 
          maxDepth: 1, 
          includeEstimates: true,
          generateDependencies: false
        }
      );

      // Parse the decomposition result into features
      const features = this.parseDecompositionResult(
        decomposition, 
        'feature', 
        epic.id, 
        context.projectId,
        this.UPP_TARGETS.feature.optimal
      );

      return features;

    } catch (error: any) {
      this.logger.warn('AI feature decomposition failed, using template', { error: error.message });
      
      // Fallback feature generation
      return this.generateFallbackFeatures(epic, context);
    }
  }

  /**
   * Decompose Features into Stories
   */
  private async decomposeToStories(features: UPPTask[], context: DecompositionContext): Promise<UPPTask[]> {
    this.logger.info(`Decomposing ${features.length} Features into Stories`);

    const allStories: UPPTask[] = [];

    for (const feature of features) {
      const prompt = `
      Decompose this Feature into 3-7 User Stories:
      
      Feature: ${feature.title}
      ${feature.description}
      
      Each Story should:
      - Start with "As a [user], I want [goal] so that [benefit]"
      - Be testable and demonstrable
      - Be completable in 3-7 days
      - Focus on user value
      
      Create exactly 5 user stories with:
      - Story Title (user story format)
      - Acceptance Criteria (3-5 bullet points)
      - Estimated hours
      
      Format each as:
      Story: [title]
      Criteria: [criteria]
      Hours: [estimate]
      ---
      `;

      try {
        const decomposition = await this.sequentialTaskService.decomposeTask(
          prompt,
          { 
            projectId: context.projectId, 
            level: 'story',
            parentId: feature.id
          },
          { maxDepth: 1, includeEstimates: true }
        );

        const stories = this.parseDecompositionResult(
          decomposition, 
          'story', 
          feature.id, 
          context.projectId,
          this.UPP_TARGETS.story.optimal
        );

        allStories.push(...stories);

      } catch (error: any) {
        this.logger.warn(`Story decomposition failed for feature ${feature.id}`, { error: error.message });
        
        // Generate fallback stories for this feature
        const fallbackStories = this.generateFallbackStories(feature, context);
        allStories.push(...fallbackStories);
      }
    }

    return allStories;
  }

  /**
   * Decompose Stories into Tasks
   */
  private async decomposeToTasks(stories: UPPTask[], context: DecompositionContext): Promise<UPPTask[]> {
    this.logger.info(`Decomposing ${stories.length} Stories into Tasks`);

    const allTasks: UPPTask[] = [];

    for (const story of stories) {
      const prompt = `
      Decompose this User Story into 2-5 Development Tasks:
      
      Story: ${story.title}
      ${story.description}
      
      Each Task should:
      - Be a concrete development activity
      - Be assignable to a single developer
      - Take 1-3 days to complete
      - Be technically focused
      
      Create exactly 3 tasks covering:
      - Backend/API development
      - Frontend/UI development  
      - Testing and validation
      
      Format each as:
      Task: [title]
      Description: [technical details]
      Hours: [estimate]
      ---
      `;

      try {
        const decomposition = await this.sequentialTaskService.decomposeTask(
          prompt,
          { 
            projectId: context.projectId, 
            level: 'task',
            parentId: story.id
          },
          { maxDepth: 1, includeEstimates: true }
        );

        const tasks = this.parseDecompositionResult(
          decomposition, 
          'task', 
          story.id, 
          context.projectId,
          this.UPP_TARGETS.task.optimal
        );

        allTasks.push(...tasks);

      } catch (error: any) {
        this.logger.warn(`Task decomposition failed for story ${story.id}`, { error: error.message });
        
        const fallbackTasks = this.generateFallbackTasks(story, context);
        allTasks.push(...fallbackTasks);
      }
    }

    return allTasks;
  }

  /**
   * Decompose Tasks into Subtasks
   */
  private async decomposeToSubtasks(tasks: UPPTask[], context: DecompositionContext): Promise<UPPTask[]> {
    this.logger.info(`Decomposing ${tasks.length} Tasks into Subtasks`);

    const allSubtasks: UPPTask[] = [];

    for (const task of tasks) {
      const prompt = `
      Decompose this Development Task into 3-5 Subtasks:
      
      Task: ${task.title}
      ${task.description}
      
      Each Subtask should:
      - Be a specific work item
      - Take 2-8 hours to complete
      - Have clear completion criteria
      - Be assignable to one person
      
      Create exactly 4 subtasks with:
      - Subtask Title (action-oriented)
      - Work Description (specific steps)
      - Estimated hours (2-8 hours)
      
      Format each as:
      Subtask: [title]
      Work: [description]
      Hours: [estimate]
      ---
      `;

      try {
        const decomposition = await this.sequentialTaskService.decomposeTask(
          prompt,
          { 
            projectId: context.projectId, 
            level: 'subtask',
            parentId: task.id
          },
          { maxDepth: 1, includeEstimates: true }
        );

        const subtasks = this.parseDecompositionResult(
          decomposition, 
          'subtask', 
          task.id, 
          context.projectId,
          this.UPP_TARGETS.subtask.optimal
        );

        allSubtasks.push(...subtasks);

      } catch (error: any) {
        this.logger.warn(`Subtask decomposition failed for task ${task.id}`, { error: error.message });
        
        const fallbackSubtasks = this.generateFallbackSubtasks(task, context);
        allSubtasks.push(...fallbackSubtasks);
      }
    }

    return allSubtasks;
  }

  /**
   * Decompose Subtasks into Atomic Tasks (≤30 minutes)
   */
  private async decomposeToAtomic(subtasks: UPPTask[], context: DecompositionContext): Promise<UPPTask[]> {
    this.logger.info(`Decomposing ${subtasks.length} Subtasks into Atomic Tasks`);

    const allAtomic: UPPTask[] = [];

    for (const subtask of subtasks) {
      const prompt = `
      Decompose this Subtask into 2-4 Atomic Tasks (≤30 minutes each):
      
      Subtask: ${subtask.title}
      ${subtask.description}
      
      Each Atomic Task should:
      - Take 15-30 minutes maximum
      - Have ONE specific action
      - Be immediately executable
      - Have clear done criteria
      
      Create exactly 3 atomic tasks with:
      - Atomic Title (single action verb)
      - Steps (specific instructions)
      - Minutes (15-30 minutes)
      
      Format each as:
      Atomic: [title]
      Steps: [instructions]
      Minutes: [estimate]
      ---
      `;

      try {
        const decomposition = await this.sequentialTaskService.decomposeTask(
          prompt,
          { 
            projectId: context.projectId, 
            level: 'atomic',
            parentId: subtask.id
          },
          { maxDepth: 1, includeEstimates: true }
        );

        const atomicTasks = this.parseDecompositionResult(
          decomposition, 
          'atomic', 
          subtask.id, 
          context.projectId,
          this.UPP_TARGETS.atomic.optimal,
          true // Convert minutes to hours
        );

        // Validate atomic task constraints
        const validatedAtomic = atomicTasks.filter(task => 
          (task.estimatedHours || 0) <= this.ATOMIC_TASK_MAX_HOURS
        );

        if (validatedAtomic.length < atomicTasks.length) {
          this.logger.warn(`Filtered ${atomicTasks.length - validatedAtomic.length} atomic tasks exceeding 30 minutes`);
        }

        allAtomic.push(...validatedAtomic);

      } catch (error: any) {
        this.logger.warn(`Atomic decomposition failed for subtask ${subtask.id}`, { error: error.message });
        
        const fallbackAtomic = this.generateFallbackAtomic(subtask, context);
        allAtomic.push(...fallbackAtomic);
      }
    }

    return allAtomic;
  }

  // Helper methods and parsing logic...

  private generateTaskId(level: string, projectId: string, index: number): string {
    const levelCode = level.charAt(0).toUpperCase();
    const domainCategory = 1; // Default to core features
    const serial = String(index + 1).padStart(3, '0');
    return `${levelCode}.${domainCategory}${serial}`;
  }

  private inferDomainCategory(description: string): number {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('api') || lowerDesc.includes('backend') || lowerDesc.includes('server')) {
      return this.DOMAIN_CATEGORIES.backend;
    } else if (lowerDesc.includes('ui') || lowerDesc.includes('frontend') || lowerDesc.includes('interface')) {
      return this.DOMAIN_CATEGORIES.frontend;
    } else if (lowerDesc.includes('database') || lowerDesc.includes('data')) {
      return this.DOMAIN_CATEGORIES.data;
    } else if (lowerDesc.includes('security') || lowerDesc.includes('auth')) {
      return this.DOMAIN_CATEGORIES.security;
    } else if (lowerDesc.includes('devops') || lowerDesc.includes('deploy')) {
      return this.DOMAIN_CATEGORIES.devops;
    }
    
    return this.DOMAIN_CATEGORIES.core_features; // Default
  }

  private inferTechnicalComplexity(description: string): 'high' | 'medium' | 'low' {
    const complexity_indicators = {
      high: ['ai', 'machine learning', 'blockchain', 'real-time', 'scalable', 'distributed'],
      medium: ['api', 'integration', 'database', 'authentication', 'payment'],
      low: ['crud', 'simple', 'basic', 'standard']
    };

    const lowerDesc = description.toLowerCase();
    
    for (const [level, indicators] of Object.entries(complexity_indicators)) {
      if (indicators.some(indicator => lowerDesc.includes(indicator))) {
        return level as 'high' | 'medium' | 'low';
      }
    }
    
    return 'medium'; // Default
  }

  private estimateProjectHours(context: DecompositionContext): number {
    // Base estimation logic
    const descriptionLength = context.description.length;
    const baseHours = Math.max(40, descriptionLength / 10); // Minimum 40 hours
    
    // Apply complexity multipliers
    let multiplier = 1;
    
    if (context.businessConstraints?.quality === 'high') multiplier *= 1.5;
    if (context.technicalConstraints?.scalability === 'high') multiplier *= 1.3;
    if (context.technicalConstraints?.performance?.length && context.technicalConstraints.performance.length > 2) multiplier *= 1.2;
    
    return Math.round(baseHours * multiplier);
  }

  private parseDecompositionResult(
    result: any, 
    level: string, 
    parentId: string, 
    projectId: string, 
    targetCount: number,
    convertMinutesToHours = false
  ): UPPTask[] {
    // Implementation for parsing AI decomposition results
    // This would extract tasks from the AI response format
    
    const tasks: UPPTask[] = [];
    
    for (let i = 0; i < targetCount; i++) {
      const task: UPPTask = {
        id: this.generateTaskId(level, projectId, i),
        title: `${level} ${i + 1}`, // Placeholder
        description: `Generated ${level} task ${i + 1}`,
        level: level as any,
        parentId,
        estimatedHours: convertMinutesToHours ? 0.5 : 4, // Default estimates
        status: 'pending',
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          domainCategory: this.inferDomainCategory(''),
          businessPriority: 'medium',
          technicalComplexity: 'medium',
          dependencies: []
        }
      };
      
      tasks.push(task);
    }
    
    return tasks;
  }

  private extractTitle(result: any): string | null {
    // Parse title from AI result
    return null;
  }

  private extractDescription(result: any): string | null {
    // Parse description from AI result
    return null;
  }

  private extractHours(result: any): number | null {
    // Parse hours from AI result
    return null;
  }

  private calculateTotalHours(tasks: UPPTask[]): number {
    return tasks.reduce((total, task) => total + (task.estimatedHours || 0), 0);
  }

  private calculateQualityScore(
    epic: UPPTask,
    features: UPPTask[],
    stories: UPPTask[],
    tasks: UPPTask[],
    subtasks: UPPTask[],
    atomic: UPPTask[]
  ): number {
    // Calculate decomposition quality score based on:
    // - Proper hierarchy ratios
    // - Estimation accuracy
    // - Task granularity
    
    let score = 100;
    
    // Check hierarchy ratios
    const featureRatio = features.length / 1; // Features per epic
    if (featureRatio < 3 || featureRatio > 7) score -= 10;
    
    const storyRatio = stories.length / features.length; // Stories per feature
    if (storyRatio < 3 || storyRatio > 7) score -= 10;
    
    // Check atomic task constraints
    const oversizedAtomic = atomic.filter(task => (task.estimatedHours || 0) > this.ATOMIC_TASK_MAX_HOURS);
    score -= (oversizedAtomic.length / atomic.length) * 20;
    
    return Math.max(0, Math.min(100, score));
  }

  private async generateDependencies(tasks: UPPTask[]): Promise<Array<{taskId: string; dependsOn: string[]}>> {
    // Generate logical dependencies between tasks
    const dependencies: Array<{taskId: string; dependsOn: string[]}> = [];
    
    // Basic dependency logic: tasks depend on their parent's siblings
    // and some cross-level dependencies
    
    return dependencies;
  }

  // Fallback generation methods for when AI fails
  private generateFallbackFeatures(epic: UPPTask, context: DecompositionContext): UPPTask[] {
    const commonFeatures = [
      'User Authentication & Authorization',
      'Core Business Logic',
      'User Interface & Experience',
      'Data Management & Storage',
      'System Integration'
    ];
    
    return commonFeatures.map((title, index) => ({
      id: this.generateTaskId('feature', context.projectId, index),
      title,
      description: `Feature focused on ${title.toLowerCase()}`,
      level: 'feature' as const,
      parentId: epic.id,
      estimatedHours: Math.round((epic.estimatedHours || 40) / commonFeatures.length),
      status: 'pending' as const,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        domainCategory: this.inferDomainCategory(title),
        businessPriority: 'medium',
        technicalComplexity: 'medium',
        dependencies: []
      }
    }));
  }

  private generateFallbackStories(feature: UPPTask, context: DecompositionContext): UPPTask[] {
    // Implementation for fallback story generation
    return [];
  }

  private generateFallbackTasks(story: UPPTask, context: DecompositionContext): UPPTask[] {
    // Implementation for fallback task generation
    return [];
  }

  private generateFallbackSubtasks(task: UPPTask, context: DecompositionContext): UPPTask[] {
    // Implementation for fallback subtask generation
    return [];
  }

  private generateFallbackAtomic(subtask: UPPTask, context: DecompositionContext): UPPTask[] {
    // Implementation for fallback atomic task generation
    return [];
  }
}