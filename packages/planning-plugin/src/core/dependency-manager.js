/**
 * Dependency Manager - JavaScript version for planning commands
 * Simplified version to enable MCP planning tools
 */

// Module status enumeration
const ModuleStatus = {
  NOT_STARTED: 'not_started',
  PENDING: 'pending', 
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  BLOCKED: 'blocked'
};

/**
 * Core dependency manager for planning modules
 */
class DependencyManager {
  constructor() {
    this.modules = new Map();
    this.states = new Map();
    this.initializeDefaultModules();
  }

  /**
   * Initialize default planning modules
   */
  initializeDefaultModules() {
    const defaultModules = [
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
  registerModule(module) {
    this.modules.set(module.name, module);
    
    if (!this.states.has(module.name)) {
      this.states.set(module.name, {
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
  updateModuleState(moduleName, state) {
    const currentState = this.states.get(moduleName);
    if (!currentState) {
      throw new Error(`Module '${moduleName}' not found`);
    }

    const updatedState = { ...currentState, ...state };
    this.states.set(moduleName, updatedState);
  }

  /**
   * Check if a module can be executed based on dependencies
   */
  canExecuteModule(moduleName) {
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
  calculateExecutionOrder(targetModule) {
    const visited = new Set();
    const order = [];

    const visit = (moduleName) => {
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
   * Get modules that are ready to execute
   */
  getReadyModules() {
    const readyModules = [];
    
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
   * Reset module state
   */
  resetModule(moduleName) {
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
}

module.exports = {
  DependencyManager,
  ModuleStatus
};