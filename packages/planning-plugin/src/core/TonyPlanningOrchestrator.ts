/**
 * Tony Planning Orchestrator - Main Coordination Agent
 * 
 * Orchestrates the complete UPP (Unified Planning Process) decomposition workflow
 * from Epic level down to Atomic tasks through specialized agent spawning and coordination.
 * 
 * Architecture:
 * - Spawns specialized Claude agents for each UPP hierarchy level
 * - Manages agent lifecycle and resource allocation
 * - Coordinates handoffs between decomposition phases
 * - Monitors progress and handles error recovery
 * - Populates task hierarchy in database and file system
 */

import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import { StateTracker } from './state-tracker';
import { UPPDecomposer } from './UPPDecomposer';
// Import the service bridge for proper integration
import { SequentialTaskService, SequentialTaskServiceBridge } from '../services/SequentialTaskServiceBridge';
import { AgentDeploymentManager } from './AgentDeploymentManager';
import { ResourceManager } from './ResourceManager';
import { TaskHierarchyManager } from './TaskHierarchyManager';

export interface TonyOrchestratorConfig {
  projectId: string;
  description: string;
  context: {
    timeline?: string;
    budget?: string;
    teamSize?: number;
    constraints?: string[];
    stakeholders?: string[];
  };
  options: {
    maxParallelAgents?: number;
    useHybridDeployment?: boolean; // Ollama + Claude
    enableProgressMonitoring?: boolean;
    enableErrorRecovery?: boolean;
    createTaskFiles?: boolean;
    populateDatabase?: boolean;
  };
}

export interface UPPHierarchyLevel {
  name: 'epic' | 'feature' | 'story' | 'task' | 'subtask' | 'atomic';
  agentPersona: string;
  parentLevel?: string;
  decompositionTarget: number; // Expected number of child items
  estimationRequired: boolean;
  validationRequired: boolean;
}

export interface AgentSpawnResult {
  agentId: string;
  persona: string;
  status: 'spawned' | 'running' | 'completed' | 'failed' | 'timeout';
  result?: any;
  error?: string;
  duration?: number;
}

export interface OrchestrationResult {
  success: boolean;
  hierarchy: {
    epic: any;
    features: any[];
    stories: any[];
    tasks: any[];
    subtasks: any[];
    atomic: any[];
  };
  metadata: {
    totalTasks: number;
    totalEstimatedHours: number;
    hierarchyDepth: number;
    agentsSpawned: number;
    completionTime: number;
  };
  agents: AgentSpawnResult[];
  errors: string[];
  nextSteps: string[];
}

/**
 * Tony Planning Orchestrator - The main coordination agent
 */
export class TonyPlanningOrchestrator extends EventEmitter {
  private logger: Logger;
  private stateTracker: StateTracker;
  private uppDecomposer: UPPDecomposer;
  private agentManager: AgentDeploymentManager;
  private resourceManager: ResourceManager;
  private hierarchyManager: TaskHierarchyManager;
  private sequentialTaskService: SequentialTaskService;

  private config!: TonyOrchestratorConfig;
  private currentPhase: string = 'idle';
  private spawnedAgents: Map<string, AgentSpawnResult> = new Map();
  private progressTracker: Map<string, number> = new Map();

  // UPP Hierarchy Definition
  private readonly UPP_HIERARCHY: UPPHierarchyLevel[] = [
    {
      name: 'epic',
      agentPersona: 'TL-LEAD-TONY',
      decompositionTarget: 3,
      estimationRequired: true,
      validationRequired: true
    },
    {
      name: 'feature',
      agentPersona: 'PM-PROJECT-PAUL',
      parentLevel: 'epic',
      decompositionTarget: 5,
      estimationRequired: true,
      validationRequired: true
    },
    {
      name: 'story',
      agentPersona: 'BA-BUSINESS-BELLA',
      parentLevel: 'feature',
      decompositionTarget: 4,
      estimationRequired: true,
      validationRequired: false
    },
    {
      name: 'task',
      agentPersona: 'FS-FULLSTACK-FELIX',
      parentLevel: 'story',
      decompositionTarget: 3,
      estimationRequired: true,
      validationRequired: false
    },
    {
      name: 'subtask',
      agentPersona: 'FS-FULLSTACK-FELIX',
      parentLevel: 'task',
      decompositionTarget: 4,
      estimationRequired: true,
      validationRequired: false
    },
    {
      name: 'atomic',
      agentPersona: 'BE-BACKEND-BENJAMIN', // Rotates between dev personas
      parentLevel: 'subtask',
      decompositionTarget: 1,
      estimationRequired: true,
      validationRequired: true
    }
  ];

  constructor(
    logger: Logger,
    stateTracker: StateTracker,
    sequentialTaskService?: SequentialTaskService
  ) {
    super();
    this.logger = logger;
    this.stateTracker = stateTracker;
    this.sequentialTaskService = sequentialTaskService || new SequentialTaskServiceBridge(logger);
    
    // Initialize core components
    this.uppDecomposer = new UPPDecomposer(logger, this.sequentialTaskService);
    this.agentManager = new AgentDeploymentManager(logger);
    this.resourceManager = new ResourceManager(logger);
    this.hierarchyManager = new TaskHierarchyManager(logger, stateTracker);
  }

  /**
   * Main orchestration entry point - execute complete UPP decomposition
   */
  async orchestrateUPPDecomposition(config: TonyOrchestratorConfig): Promise<OrchestrationResult> {
    const startTime = Date.now();
    this.config = config;
    this.currentPhase = 'initializing';

    this.logger.info('Tony Planning Orchestrator starting UPP decomposition', {
      projectId: config.projectId,
      description: config.description.substring(0, 100) + '...'
    });

    this.emit('orchestration_started', { config, timestamp: new Date() });

    try {
      // Phase 1: Initialize orchestration context
      await this.initializeOrchestrationContext();
      
      // Phase 2: Execute hierarchical decomposition
      const hierarchy = await this.executeHierarchicalDecomposition();
      
      // Phase 3: Validate and finalize
      const validation = await this.validateAndFinalizeHierarchy(hierarchy);
      
      // Phase 4: Create task files and populate database
      if (config.options.createTaskFiles) {
        await this.createTaskHierarchyFiles(hierarchy);
      }
      
      if (config.options.populateDatabase) {
        await this.populateTaskDatabase(hierarchy);
      }

      const completionTime = Date.now() - startTime;
      
      const result: OrchestrationResult = {
        success: true,
        hierarchy: hierarchy,
        metadata: {
          totalTasks: this.calculateTotalTasks(hierarchy),
          totalEstimatedHours: this.calculateTotalHours(hierarchy),
          hierarchyDepth: 6, // Epic → Atomic
          agentsSpawned: this.spawnedAgents.size,
          completionTime
        },
        agents: Array.from(this.spawnedAgents.values()),
        errors: [],
        nextSteps: this.generateNextSteps(hierarchy)
      };

      this.logger.info('Tony orchestration completed successfully', {
        duration: completionTime,
        totalTasks: result.metadata.totalTasks,
        agentsSpawned: result.metadata.agentsSpawned
      });

      this.emit('orchestration_completed', { result, timestamp: new Date() });
      
      return result;

    } catch (error: any) {
      const completionTime = Date.now() - startTime;
      
      this.logger.error('Tony orchestration failed', error);
      
      const errorResult: OrchestrationResult = {
        success: false,
        hierarchy: {
          epic: null,
          features: [],
          stories: [],
          tasks: [],
          subtasks: [],
          atomic: []
        },
        metadata: {
          totalTasks: 0,
          totalEstimatedHours: 0,
          hierarchyDepth: 0,
          agentsSpawned: this.spawnedAgents.size,
          completionTime
        },
        agents: Array.from(this.spawnedAgents.values()),
        errors: [error.message],
        nextSteps: ['Fix orchestration errors and retry']
      };

      this.emit('orchestration_failed', { error, result: errorResult, timestamp: new Date() });
      
      return errorResult;
    } finally {
      this.currentPhase = 'idle';
      await this.cleanup();
    }
  }

  /**
   * Initialize orchestration context and resources
   */
  private async initializeOrchestrationContext(): Promise<void> {
    this.currentPhase = 'context_initialization';
    
    this.logger.info('Initializing orchestration context');

    // Initialize resource manager with constraints
    await this.resourceManager.initialize({
      maxConcurrentAgents: this.config.options.maxParallelAgents || 3,
      hybridDeployment: this.config.options.useHybridDeployment || true,
      memoryLimit: '4GB',
      timeoutMs: 300000 // 5 minutes per agent
    });

    // Initialize hierarchy manager
    await this.hierarchyManager.initialize({
      projectId: this.config.projectId,
      baseDirectory: `./docs/task-management/epics/active`
    });

    // Set up progress tracking
    this.UPP_HIERARCHY.forEach(level => {
      this.progressTracker.set(level.name, 0);
    });

    this.emit('context_initialized', { timestamp: new Date() });
  }

  /**
   * Execute the hierarchical decomposition through agent spawning
   */
  private async executeHierarchicalDecomposition(): Promise<any> {
    this.currentPhase = 'hierarchical_decomposition';
    
    this.logger.info('Starting hierarchical decomposition');
    
    const hierarchy = {
      epic: null,
      features: [],
      stories: [],
      tasks: [],
      subtasks: [],
      atomic: []
    };

    // Execute each level sequentially with proper handoffs
    for (const level of this.UPP_HIERARCHY) {
      this.logger.info(`Processing UPP level: ${level.name}`, {
        persona: level.agentPersona,
        target: level.decompositionTarget
      });

      const levelResult = await this.processUPPLevel(level, hierarchy);
      
      // Store results in hierarchy
      if (level.name === 'epic') {
        hierarchy.epic = levelResult;
      } else {
        (hierarchy as any)[level.name] = levelResult;
      }

      // Update progress
      this.progressTracker.set(level.name, 100);
      
      this.emit('level_completed', { 
        level: level.name, 
        result: levelResult, 
        timestamp: new Date() 
      });

      // Resource management - allow cleanup between levels
      await this.resourceManager.garbageCollect();
    }

    this.emit('decomposition_completed', { hierarchy, timestamp: new Date() });
    
    return hierarchy;
  }

  /**
   * Process a single UPP hierarchy level through agent spawning
   */
  private async processUPPLevel(level: UPPHierarchyLevel, currentHierarchy: any): Promise<any> {
    // Determine parent context for decomposition
    const parentContext = this.buildParentContext(level, currentHierarchy);
    
    // Spawn specialized agent for this level
    const agent = await this.spawnDecompositionAgent(level, parentContext);
    
    // Execute decomposition with the agent
    const decompositionResult = await this.executeAgentDecomposition(agent, level, parentContext);
    
    // Validate results if required
    if (level.validationRequired) {
      await this.validateLevelResults(level, decompositionResult);
    }

    // Generate estimates if required
    if (level.estimationRequired) {
      await this.generateLevelEstimates(level, decompositionResult);
    }

    return decompositionResult;
  }

  /**
   * Spawn a specialized agent for decomposition
   */
  private async spawnDecompositionAgent(level: UPPHierarchyLevel, context: any): Promise<AgentSpawnResult> {
    const agentId = `upp-${level.name}-${Date.now()}`;
    
    this.logger.info(`Spawning ${level.name} decomposition agent`, {
      agentId,
      persona: level.agentPersona
    });

    // Check resource availability
    await this.resourceManager.requestResources({
      agentCount: 1,
      memoryMB: 512,
      timeoutMs: 180000
    });

    try {
      // Use AgentDeploymentManager to spawn the agent
      const spawnResult = await this.agentManager.deployAgent({
        persona: level.agentPersona,
        taskType: `upp-decompose-${level.name}`,
        instructions: this.buildAgentInstructions(level, context),
        resourceLimits: {
          maxMemoryMB: 512,
          maxTimeoutMs: 180000
        },
        tools: this.getAgentTools(level)
      });

      const agent: AgentSpawnResult = {
        agentId,
        persona: level.agentPersona,
        status: 'spawned',
        result: spawnResult
      };

      this.spawnedAgents.set(agentId, agent);
      
      this.emit('agent_spawned', { agent, level: level.name, timestamp: new Date() });
      
      return agent;

    } catch (error: any) {
      const failedAgent: AgentSpawnResult = {
        agentId,
        persona: level.agentPersona,
        status: 'failed',
        error: error.message
      };

      this.spawnedAgents.set(agentId, failedAgent);
      
      throw new Error(`Failed to spawn ${level.name} agent: ${error.message}`);
    }
  }

  /**
   * Execute decomposition with the spawned agent
   */
  private async executeAgentDecomposition(
    agent: AgentSpawnResult, 
    level: UPPHierarchyLevel, 
    context: any
  ): Promise<any> {
    const startTime = Date.now();
    
    this.logger.info(`Executing decomposition with ${level.name} agent`, {
      agentId: agent.agentId
    });

    try {
      // Update agent status
      agent.status = 'running';
      this.spawnedAgents.set(agent.agentId, agent);

      // Build decomposition prompt for the agent
      const decompositionPrompt = this.buildDecompositionPrompt(level, context);
      
      // Execute through Sequential Task Service
      const result = await this.sequentialTaskService.decomposeTask(
        decompositionPrompt,
        {
          projectId: this.config.projectId,
          level: level.name,
          parentContext: context,
          agentPersona: level.agentPersona
        },
        {
          maxDepth: 1, // Single level decomposition
          includeEstimates: level.estimationRequired,
          autoAssign: false,
          generateDependencies: true
        }
      );

      const duration = Date.now() - startTime;

      // Update agent with success
      agent.status = 'completed';
      agent.result = result;
      agent.duration = duration;
      this.spawnedAgents.set(agent.agentId, agent);

      this.logger.info(`${level.name} decomposition completed`, {
        agentId: agent.agentId,
        duration,
        itemsGenerated: result.tasks?.length || 0
      });

      this.emit('agent_completed', { 
        agent, 
        level: level.name, 
        result, 
        timestamp: new Date() 
      });

      return result;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // Update agent with failure
      agent.status = 'failed';
      agent.error = error.message;
      agent.duration = duration;
      this.spawnedAgents.set(agent.agentId, agent);

      this.logger.error(`${level.name} decomposition failed`, {
        agentId: agent.agentId,
        error: error.message,
        duration
      });

      throw error;
    }
  }

  /**
   * Validate and finalize the complete hierarchy
   */
  private async validateAndFinalizeHierarchy(hierarchy: any): Promise<any> {
    this.currentPhase = 'validation_and_finalization';
    
    this.logger.info('Validating and finalizing hierarchy');

    // Spawn QA validation agent
    const qaAgent = await this.spawnValidationAgent(hierarchy);
    
    // Execute validation
    const validationResult = await this.executeValidation(qaAgent, hierarchy);
    
    // Apply any corrections needed
    if (validationResult.corrections && validationResult.corrections.length > 0) {
      hierarchy = await this.applyCorrections(hierarchy, validationResult.corrections);
    }

    this.emit('hierarchy_validated', { 
      hierarchy, 
      validation: validationResult, 
      timestamp: new Date() 
    });

    return hierarchy;
  }

  /**
   * Helper method to build parent context for decomposition
   */
  private buildParentContext(level: UPPHierarchyLevel, hierarchy: any): any {
    if (!level.parentLevel) {
      // Epic level - use project description as context
      return {
        type: 'project',
        description: this.config.description,
        context: this.config.context
      };
    }

    // Get parent level results
    const parent = hierarchy[level.parentLevel as keyof typeof hierarchy];
    
    return {
      type: level.parentLevel,
      parent: parent,
      context: this.config.context
    };
  }

  /**
   * Build agent instructions for specific UPP level
   */
  private buildAgentInstructions(level: UPPHierarchyLevel, context: any): string {
    const baseInstructions = `You are a specialized ${level.agentPersona} agent responsible for ${level.name} level decomposition in the UPP methodology.`;
    
    const levelSpecific = {
      epic: 'Break down the project into 3-5 major features that deliver business value.',
      feature: 'Decompose this feature into 3-7 user stories that represent user-facing functionality.',
      story: 'Break down this story into 2-5 development tasks that can be implemented.',
      task: 'Decompose this task into 3-5 subtasks representing specific work items.',
      subtask: 'Break down this subtask into 2-4 atomic tasks (≤30 minutes each).',
      atomic: 'This is already atomic - validate it meets the ≤30 minute criteria.'
    };

    return `${baseInstructions}\n\n${levelSpecific[level.name]}\n\nContext: ${JSON.stringify(context, null, 2)}`;
  }

  /**
   * Get agent tools for specific level
   */
  private getAgentTools(level: UPPHierarchyLevel): string[] {
    const baseTools = ['sequential_thinking', 'task_decompose'];
    
    if (level.estimationRequired) {
      baseTools.push('task_estimate_batch');
    }
    
    if (level.validationRequired) {
      baseTools.push('task_validate');
    }

    return baseTools;
  }

  /**
   * Build decomposition prompt for agent
   */
  private buildDecompositionPrompt(level: UPPHierarchyLevel, context: any): string {
    if (level.name === 'epic') {
      return `Decompose this project into major features: ${this.config.description}`;
    }
    
    return `Decompose this ${level.parentLevel} into ${level.name} level items: ${JSON.stringify(context.parent)}`;
  }

  /**
   * Cleanup resources after orchestration
   */
  private async cleanup(): Promise<void> {
    this.logger.info('Cleaning up orchestration resources');
    
    // Release all agent resources
    await this.agentManager.cleanup();
    
    // Release resource manager
    await this.resourceManager.cleanup();
    
    // Clear tracking data
    this.spawnedAgents.clear();
    this.progressTracker.clear();
  }

  // Additional helper methods for validation, estimation, file creation, etc.
  private async validateLevelResults(level: UPPHierarchyLevel, result: any): Promise<void> {
    // Implementation for validation
  }

  private async generateLevelEstimates(level: UPPHierarchyLevel, result: any): Promise<void> {
    // Implementation for estimation
  }

  private async spawnValidationAgent(hierarchy: any): Promise<AgentSpawnResult> {
    // Implementation for QA agent spawning
    return {} as AgentSpawnResult;
  }

  private async executeValidation(agent: AgentSpawnResult, hierarchy: any): Promise<any> {
    // Implementation for validation execution
    return {};
  }

  private async applyCorrections(hierarchy: any, corrections: any[]): Promise<any> {
    // Implementation for applying corrections
    return hierarchy;
  }

  private async createTaskHierarchyFiles(hierarchy: any): Promise<void> {
    // Implementation for creating task files
  }

  private async populateTaskDatabase(hierarchy: any): Promise<void> {
    // Implementation for database population
  }

  private calculateTotalTasks(hierarchy: any): number {
    return (hierarchy.atomic?.length || 0) + 
           (hierarchy.subtasks?.length || 0) + 
           (hierarchy.tasks?.length || 0) + 
           (hierarchy.stories?.length || 0) + 
           (hierarchy.features?.length || 0) + 
           (hierarchy.epic ? 1 : 0);
  }

  private calculateTotalHours(hierarchy: any): number {
    // Implementation for hour calculation
    return 0;
  }

  private generateNextSteps(hierarchy: any): string[] {
    return [
      'UPP hierarchy decomposition complete',
      'Ready for agent assignment and implementation',
      'Run task assignment workflow',
      'Begin parallel implementation with atomic tasks'
    ];
  }
}