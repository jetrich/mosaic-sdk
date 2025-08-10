/**
 * Dependency Manager - Handles module dependencies and execution order
 * Core component of MosAIc Planning Plugin v0.1.0
 */

import { z } from 'zod';

// Module status enumeration following CLAUDE.md standards
export enum ModuleStatus {
  NOT_STARTED = 'not_started',
  PENDING = 'pending', 
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  BLOCKED = 'blocked'
}

// Module definition schema
export const ModuleDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  dependencies: z.array(z.string()).default([]),
  blocks: z.array(z.string()).default([]),
  estimatedDuration: z.number().optional(),
  priority: z.number().min(1).max(10).default(5),
  category: z.enum(['business', 'technical', 'marketing', 'financial']).default('business')
});

export type ModuleDefinition = z.infer<typeof ModuleDefinitionSchema>;

// Module state schema
export const ModuleStateSchema = z.object({
  status: z.nativeEnum(ModuleStatus),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  duration: z.number().optional(),
  outputs: z.array(z.string()).default([]),
  errors: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({})
});

export type ModuleState = z.infer<typeof ModuleStateSchema>;

// Dependency resolution result
export interface DependencyResolution {
  canExecute: boolean;
  missingDependencies: string[];
  blockedBy: string[];
  executionOrder: string[];
  reason: string;
}

/**
 * Core dependency manager for planning modules
 * Implements CLAUDE.md standards for task dependency management
 */
export class DependencyManager {
  private modules: Map<string, ModuleDefinition> = new Map();
  private states: Map<string, ModuleState> = new Map();

  constructor() {
    this.initializeDefaultModules();
  }

  /**
   * Initialize default planning modules based on user requirements
   */
  private initializeDefaultModules(): void {
    const defaultModules: ModuleDefinition[] = [
      {
        name: 'business',
        description: 'Business strategy and vision planning',
        dependencies: [],
        blocks: ['marketing', 'financial', 'release'],
        category: 'business',
        priority: 10
      },
      {
        name: 'financial',
        description: 'Revenue models and cost analysis with AI development factors',
        dependencies: ['business'],
        blocks: ['release'],
        category: 'financial',
        priority: 9
      },
      {
        name: 'marketing',
        description: 'Marketing strategy and go-to-market planning',
        dependencies: ['business'],
        blocks: [],
        category: 'marketing',
        priority: 7
      },
      {
        name: 'release',
        description: 'Release planning and semver strategy - CRITICAL SCOPE CONTROL',
        dependencies: ['business', 'financial'],
        blocks: ['tasks', 'tech'],
        category: 'business',
        priority: 8
      },
      {
        name: 'tasks',
        description: 'Technical task decomposition (Epic → Atomic)',
        dependencies: ['release'],
        blocks: [],
        category: 'technical',
        priority: 6
      },
      {
        name: 'tech',
        description: 'Technology architecture and stack decisions',
        dependencies: ['release'],
        blocks: [],
        category: 'technical',
        priority: 5
      }
    ];

    defaultModules.forEach(module => this.registerModule(module));
  }

  /**
   * Register a new planning module
   */
  registerModule(module: ModuleDefinition): void {
    const validated = ModuleDefinitionSchema.parse(module);
    this.modules.set(validated.name, validated);
    
    if (!this.states.has(validated.name)) {
      this.states.set(validated.name, {
        status: ModuleStatus.NOT_STARTED,
        outputs: [],
        errors: [],
        metadata: {}
      });
    }
  }

  /**
   * Update module state
   */
  updateModuleState(moduleName: string, state: Partial<ModuleState>): void {
    const currentState = this.states.get(moduleName);
    if (!currentState) {
      throw new Error(`Module '${moduleName}' not found`);
    }

    const updatedState = { ...currentState, ...state };
    const validated = ModuleStateSchema.parse(updatedState);
    this.states.set(moduleName, validated);
  }

  /**
   * Check if a module can be executed based on dependencies
   */
  canExecuteModule(moduleName: string): DependencyResolution {
    const module = this.modules.get(moduleName);
    if (!module) {
      return {
        canExecute: false,
        missingDependencies: [],
        blockedBy: [],
        executionOrder: [],
        reason: `Module '${moduleName}' not found`
      };
    }

    const currentState = this.states.get(moduleName);
    if (currentState?.status === ModuleStatus.COMPLETED) {
      return {
        canExecute: false,
        missingDependencies: [],
        blockedBy: [],
        executionOrder: [],
        reason: `Module '${moduleName}' already completed`
      };
    }

    const missingDependencies = module.dependencies.filter(dep => {
      const depState = this.states.get(dep);
      return !depState || depState.status !== ModuleStatus.COMPLETED;
    });

    const blockedBy = Array.from(this.states.entries())
      .filter(([name, state]) => {
        const depModule = this.modules.get(name);
        return depModule?.blocks.includes(moduleName) && 
               state.status !== ModuleStatus.COMPLETED;
      })
      .map(([name]) => name);

    const canExecute = missingDependencies.length === 0 && blockedBy.length === 0;
    
    let reason = '';
    if (!canExecute) {
      const reasons = [];
      if (missingDependencies.length > 0) {
        reasons.push(`Missing dependencies: ${missingDependencies.join(', ')}`);
      }
      if (blockedBy.length > 0) {
        reasons.push(`Blocked by: ${blockedBy.join(', ')}`);
      }
      reason = reasons.join('; ');
    } else {
      reason = 'Ready for execution';
    }

    return {
      canExecute,
      missingDependencies,
      blockedBy,
      executionOrder: this.calculateExecutionOrder(moduleName),
      reason
    };
  }

  /**
   * Calculate execution order for a module and its dependencies
   */
  calculateExecutionOrder(targetModule: string): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (moduleName: string) => {
      if (visited.has(moduleName)) return;
      visited.add(moduleName);

      const module = this.modules.get(moduleName);
      if (!module) return;

      // Visit dependencies first
      module.dependencies.forEach(dep => visit(dep));
      
      // Only add to order if not already completed
      const state = this.states.get(moduleName);
      if (!state || state.status !== ModuleStatus.COMPLETED) {
        order.push(moduleName);
      }
    };

    visit(targetModule);
    return order;
  }

  /**
   * Get all modules and their current states
   */
  getAllModulesStatus(): Record<string, { definition: ModuleDefinition; state: ModuleState }> {
    const result: Record<string, { definition: ModuleDefinition; state: ModuleState }> = {};
    
    this.modules.forEach((definition, name) => {
      const state = this.states.get(name);
      if (state) {
        result[name] = { definition, state };
      }
    });

    return result;
  }

  /**
   * Get modules that are ready to execute (all dependencies met)
   */
  getReadyModules(): string[] {
    const readyModules: string[] = [];
    
    this.modules.forEach((_, name) => {
      const resolution = this.canExecuteModule(name);
      if (resolution.canExecute) {
        readyModules.push(name);
      }
    });

    return readyModules.sort((a, b) => {
      const moduleA = this.modules.get(a);
      const moduleB = this.modules.get(b);
      return (moduleB?.priority || 0) - (moduleA?.priority || 0);
    });
  }

  /**
   * Reset module state (useful for testing and development)
   */
  resetModule(moduleName: string): void {
    if (!this.modules.has(moduleName)) {
      throw new Error(`Module '${moduleName}' not found`);
    }

    this.states.set(moduleName, {
      status: ModuleStatus.NOT_STARTED,
      outputs: [],
      errors: [],
      metadata: {}
    });
  }

  /**
   * Reset all modules
   */
  resetAllModules(): void {
    this.states.forEach((_, name) => {
      this.resetModule(name);
    });
  }
}