# Atomic Task: Pool Initialization

**Task ID**: A.0004.01.01.02.01.01  
**Parent**: ST.0004.01.01.02.01 - Agent Pool Manager  
**Type**: Implementation  
**Estimate**: 2 hours

## Task Description

Implement the core pool initialization logic that sets up the agent pool with configured parameters, validates configuration settings, and prepares the pool for agent management operations.

## Implementation Requirements

### Configuration Parameters
- `minPoolSize`: number - Minimum number of agents to maintain
- `maxPoolSize`: number - Maximum number of agents allowed
- `initialPoolSize`: number - Number of agents to create on startup
- `agentTypes`: AgentTypeConfig[] - Supported agent type configurations
- `warmupEnabled`: boolean - Whether to pre-warm agents on startup

### Initialization Steps
1. **Configuration Validation**
   - Validate pool size parameters (min ≤ initial ≤ max)
   - Verify agent type configurations are valid
   - Check resource limits and system capacity

2. **Resource Allocation**
   - Initialize internal data structures
   - Allocate memory pools for agent metadata
   - Set up monitoring and metrics collection

3. **Agent Pre-creation**
   - Create initial pool of agents per configuration
   - Distribute agents across configured types
   - Perform health checks on created agents

4. **Pool State Management**
   - Initialize pool state tracking
   - Set up agent lifecycle monitoring
   - Configure automatic pool adjustment policies

## Code Implementation

```typescript
// packages/mcp-orchestrator/src/services/AgentPoolManager.ts

interface PoolConfig {
  minPoolSize: number;
  maxPoolSize: number;
  initialPoolSize: number;
  agentTypes: AgentTypeConfig[];
  warmupEnabled: boolean;
  adjustmentPolicies: {
    scaleUpThreshold: number;    // CPU/memory usage to trigger scale up
    scaleDownThreshold: number;  // Usage level to trigger scale down
    adjustmentInterval: number;  // How often to check for adjustments
  };
}

interface AgentTypeConfig {
  type: string;
  minInstances: number;
  maxInstances: number;
  capabilities: string[];
  resourceRequirements: {
    cpu: number;
    memory: number;
  };
}

interface PoolState {
  totalAgents: number;
  availableAgents: number;
  busyAgents: number;
  agentsByType: Map<string, Agent[]>;
  poolHealth: 'healthy' | 'degraded' | 'critical';
  lastAdjustment: number;
}

class AgentPoolManager {
  private config: PoolConfig;
  private state: PoolState;
  private agents = new Map<string, Agent>();
  private availableAgents = new Set<string>();
  private busyAgents = new Set<string>();
  private initialized = false;

  constructor(
    private agentFactory: AgentFactory,
    private metricsCollector: MetricsCollector,
    private logger: Logger,
    config: PoolConfig
  ) {
    this.config = this.validateAndNormalizeConfig(config);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      throw new Error('Agent pool is already initialized');
    }

    this.logger.info('Initializing agent pool', {
      minSize: this.config.minPoolSize,
      maxSize: this.config.maxPoolSize,
      initialSize: this.config.initialPoolSize,
      agentTypes: this.config.agentTypes.length
    });

    try {
      // Step 1: Initialize state tracking
      this.initializePoolState();

      // Step 2: Create initial agents
      await this.createInitialAgents();

      // Step 3: Setup monitoring and adjustment
      this.setupPoolMonitoring();

      // Step 4: Perform warmup if enabled
      if (this.config.warmupEnabled) {
        await this.performAgentWarmup();
      }

      this.initialized = true;
      this.logger.info('Agent pool initialization completed', {
        totalAgents: this.state.totalAgents,
        availableAgents: this.state.availableAgents,
        poolHealth: this.state.poolHealth
      });

    } catch (error) {
      this.logger.error('Agent pool initialization failed', {
        error: error.message,
        partialState: this.state
      });
      
      // Cleanup partially initialized state
      await this.cleanup();
      throw error;
    }
  }

  private validateAndNormalizeConfig(config: PoolConfig): PoolConfig {
    // Validate pool size constraints
    if (config.minPoolSize < 0) {
      throw new Error('minPoolSize must be non-negative');
    }
    
    if (config.maxPoolSize < config.minPoolSize) {
      throw new Error('maxPoolSize must be >= minPoolSize');
    }
    
    if (config.initialPoolSize < config.minPoolSize || 
        config.initialPoolSize > config.maxPoolSize) {
      throw new Error('initialPoolSize must be between minPoolSize and maxPoolSize');
    }

    // Validate agent type configurations
    if (!config.agentTypes || config.agentTypes.length === 0) {
      throw new Error('At least one agent type must be configured');
    }

    for (const typeConfig of config.agentTypes) {
      if (!typeConfig.type || typeConfig.type.trim() === '') {
        throw new Error('Agent type name cannot be empty');
      }
      
      if (typeConfig.minInstances < 0 || typeConfig.maxInstances < typeConfig.minInstances) {
        throw new Error(`Invalid instance limits for agent type ${typeConfig.type}`);
      }
    }

    // Set defaults for optional configuration
    return {
      ...config,
      warmupEnabled: config.warmupEnabled ?? true,
      adjustmentPolicies: {
        scaleUpThreshold: 0.8,
        scaleDownThreshold: 0.3,
        adjustmentInterval: 30000,
        ...config.adjustmentPolicies
      }
    };
  }

  private initializePoolState(): void {
    this.state = {
      totalAgents: 0,
      availableAgents: 0,
      busyAgents: 0,
      agentsByType: new Map(),
      poolHealth: 'healthy',
      lastAdjustment: Date.now()
    };

    // Initialize type-specific tracking
    for (const typeConfig of this.config.agentTypes) {
      this.state.agentsByType.set(typeConfig.type, []);
    }
  }

  private async createInitialAgents(): Promise<void> {
    const agentsToCreate = this.calculateInitialAgentDistribution();
    const creationPromises: Promise<Agent>[] = [];

    for (const [agentType, count] of agentsToCreate) {
      for (let i = 0; i < count; i++) {
        creationPromises.push(this.createAgent(agentType));
      }
    }

    this.logger.info('Creating initial agent pool', {
      totalAgents: creationPromises.length,
      distribution: Object.fromEntries(agentsToCreate)
    });

    try {
      const agents = await Promise.all(creationPromises);
      
      for (const agent of agents) {
        await this.addAgentToPool(agent);
      }
      
      this.updatePoolState();
      
    } catch (error) {
      this.logger.error('Failed to create initial agents', {
        error: error.message,
        createdCount: this.agents.size
      });
      throw error;
    }
  }

  private calculateInitialAgentDistribution(): Map<string, number> {
    const distribution = new Map<string, number>();
    const totalDesired = this.config.initialPoolSize;
    
    // First, ensure minimum instances for each type
    let allocated = 0;
    for (const typeConfig of this.config.agentTypes) {
      const minRequired = Math.min(typeConfig.minInstances, totalDesired - allocated);
      distribution.set(typeConfig.type, minRequired);
      allocated += minRequired;
    }
    
    // Distribute remaining slots proportionally
    const remaining = totalDesired - allocated;
    if (remaining > 0) {
      const totalWeight = this.config.agentTypes.reduce((sum, config) => 
        sum + (config.maxInstances - config.minInstances), 0);
      
      for (const typeConfig of this.config.agentTypes) {
        const weight = (typeConfig.maxInstances - typeConfig.minInstances) / totalWeight;
        const additional = Math.floor(remaining * weight);
        const current = distribution.get(typeConfig.type) || 0;
        distribution.set(typeConfig.type, current + additional);
      }
    }
    
    return distribution;
  }

  private async createAgent(type: string): Promise<Agent> {
    const typeConfig = this.config.agentTypes.find(config => config.type === type);
    if (!typeConfig) {
      throw new Error(`Unknown agent type: ${type}`);
    }

    try {
      const agent = await this.agentFactory.createAgent(type, {
        capabilities: typeConfig.capabilities,
        resourceRequirements: typeConfig.resourceRequirements
      });

      this.logger.debug('Agent created successfully', {
        agentId: agent.id,
        type: agent.type
      });

      return agent;
      
    } catch (error) {
      this.logger.error('Failed to create agent', {
        type,
        error: error.message
      });
      throw error;
    }
  }

  private async addAgentToPool(agent: Agent): Promise<void> {
    this.agents.set(agent.id, agent);
    this.availableAgents.add(agent.id);
    
    const typeAgents = this.state.agentsByType.get(agent.type) || [];
    typeAgents.push(agent);
    this.state.agentsByType.set(agent.type, typeAgents);

    // Setup agent event listeners
    agent.on('statusChange', (status) => {
      this.handleAgentStatusChange(agent.id, status);
    });

    agent.on('error', (error) => {
      this.handleAgentError(agent.id, error);
    });
  }

  private setupPoolMonitoring(): void {
    // Periodic pool health checking and adjustment
    setInterval(() => {
      this.checkAndAdjustPool();
    }, this.config.adjustmentPolicies.adjustmentInterval);

    // Metrics collection
    setInterval(() => {
      this.collectPoolMetrics();
    }, 10000); // Every 10 seconds
  }

  private async performAgentWarmup(): Promise<void> {
    this.logger.info('Starting agent warmup process');
    
    const warmupPromises = Array.from(this.availableAgents).map(async agentId => {
      const agent = this.agents.get(agentId);
      if (agent) {
        try {
          await agent.warmup();
          this.logger.debug('Agent warmup completed', { agentId });
        } catch (error) {
          this.logger.warn('Agent warmup failed', { agentId, error: error.message });
        }
      }
    });

    await Promise.allSettled(warmupPromises);
    this.logger.info('Agent warmup process completed');
  }

  private updatePoolState(): void {
    this.state.totalAgents = this.agents.size;
    this.state.availableAgents = this.availableAgents.size;
    this.state.busyAgents = this.busyAgents.size;
    
    // Update pool health based on availability
    const availabilityRatio = this.state.availableAgents / this.state.totalAgents;
    if (availabilityRatio >= 0.7) {
      this.state.poolHealth = 'healthy';
    } else if (availabilityRatio >= 0.3) {
      this.state.poolHealth = 'degraded';
    } else {
      this.state.poolHealth = 'critical';
    }
  }

  private handleAgentStatusChange(agentId: string, status: string): void {
    // Handle agent status changes that affect availability
    if (status === 'available' && this.busyAgents.has(agentId)) {
      this.busyAgents.delete(agentId);
      this.availableAgents.add(agentId);
    } else if (status === 'busy' && this.availableAgents.has(agentId)) {
      this.availableAgents.delete(agentId);
      this.busyAgents.add(agentId);
    }
    
    this.updatePoolState();
  }

  private handleAgentError(agentId: string, error: Error): void {
    this.logger.error('Agent error reported', { agentId, error: error.message });
    
    // Consider removing unhealthy agents
    this.scheduleAgentHealthCheck(agentId);
  }

  private async checkAndAdjustPool(): Promise<void> {
    // Implementation for automatic pool size adjustment based on load
    const currentLoad = this.state.busyAgents / this.state.totalAgents;
    
    if (currentLoad > this.config.adjustmentPolicies.scaleUpThreshold) {
      await this.scaleUp();
    } else if (currentLoad < this.config.adjustmentPolicies.scaleDownThreshold) {
      await this.scaleDown();
    }
  }

  private collectPoolMetrics(): void {
    this.metricsCollector.recordPoolMetrics({
      totalAgents: this.state.totalAgents,
      availableAgents: this.state.availableAgents,
      busyAgents: this.state.busyAgents,
      poolHealth: this.state.poolHealth,
      utilizationRatio: this.state.busyAgents / this.state.totalAgents
    });
  }

  // Public methods for pool management
  isInitialized(): boolean {
    return this.initialized;
  }

  getPoolState(): Readonly<PoolState> {
    return { ...this.state };
  }

  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up agent pool');
    
    // Cleanup all agents
    const cleanupPromises = Array.from(this.agents.values()).map(agent => 
      agent.cleanup().catch(error => 
        this.logger.warn('Agent cleanup failed', { agentId: agent.id, error: error.message })
      )
    );

    await Promise.allSettled(cleanupPromises);
    
    this.agents.clear();
    this.availableAgents.clear();
    this.busyAgents.clear();
    this.initialized = false;
  }
}
```

## Validation Criteria

1. **Configuration Validation**
   - Rejects invalid pool size configurations with clear error messages
   - Validates all agent type configurations properly
   - Applies sensible defaults for optional parameters

2. **Initialization Process**
   - Creates the correct number of agents per configuration
   - Distributes agents appropriately across types
   - Handles initialization failures gracefully with cleanup

3. **State Management**
   - Maintains accurate agent counts and availability tracking
   - Updates pool health status correctly based on agent states
   - Tracks agent distribution by type accurately

4. **Resource Management**
   - Properly initializes and cleans up resources
   - Sets up monitoring and metrics collection
   - Handles agent lifecycle events appropriately

5. **Error Handling**
   - Recovers gracefully from agent creation failures
   - Provides detailed logging for debugging issues
   - Maintains pool consistency despite individual agent failures

## Unit Tests Required

```typescript
describe('AgentPoolManager.initialize', () => {
  it('should initialize pool with correct agent distribution', async () => {
    const config = createTestConfig({
      initialPoolSize: 10,
      agentTypes: [
        { type: 'general', minInstances: 2, maxInstances: 8 },
        { type: 'specialized', minInstances: 1, maxInstances: 5 }
      ]
    });

    await poolManager.initialize();
    const state = poolManager.getPoolState();

    expect(state.totalAgents).toBe(10);
    expect(state.agentsByType.get('general').length).toBeGreaterThanOrEqual(2);
    expect(state.agentsByType.get('specialized').length).toBeGreaterThanOrEqual(1);
  });

  it('should reject invalid configuration', async () => {
    const invalidConfig = createTestConfig({
      minPoolSize: 10,
      maxPoolSize: 5  // Invalid: max < min
    });

    await expect(poolManager.initialize()).rejects.toThrow('maxPoolSize must be >= minPoolSize');
  });

  it('should perform warmup when enabled', async () => {
    const config = createTestConfig({ warmupEnabled: true });
    const warmupSpy = jest.spyOn(Agent.prototype, 'warmup');

    await poolManager.initialize();

    expect(warmupSpy).toHaveBeenCalled();
  });

  it('should cleanup on initialization failure', async () => {
    agentFactory.createAgent.mockRejectedValue(new Error('Creation failed'));

    await expect(poolManager.initialize()).rejects.toThrow();
    
    // Verify cleanup occurred
    expect(poolManager.getPoolState().totalAgents).toBe(0);
  });

  it('should prevent double initialization', async () => {
    await poolManager.initialize();

    await expect(poolManager.initialize()).rejects.toThrow('Agent pool is already initialized');
  });
});
```

## Dependencies

- AgentFactory for creating new agent instances
- MetricsCollector for pool performance monitoring
- Logger for initialization process tracking
- Agent event system for status change monitoring

## Notes

- Pool initialization is a critical startup process that sets the foundation for all agent operations
- Proper error handling and cleanup prevent resource leaks during initialization failures
- Configuration validation prevents runtime errors and ensures pool operates within expected parameters
- Warmup process improves initial response times by pre-loading agent resources