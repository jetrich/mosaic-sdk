# Atomic Task: HierarchicalDecomposer Class Structure

**Task ID**: A.0004.02.01.01.01.01  
**Parent**: ST.0004.02.01.01.01 - Class Architecture Definition  
**Type**: Implementation  
**Estimate**: 2 hours

## Task Description

Define the core HierarchicalDecomposer class structure with proper TypeScript interfaces, dependency injection, and initialization logic that serves as the foundation for the entire hierarchical decomposition system.

## Implementation Requirements

### Class Definition
```typescript
// packages/mcp-orchestrator/src/services/HierarchicalDecomposer.ts

interface DecompositionOptions {
  maxDepth?: number;
  maxConcurrency?: number;
  tokenBudget?: number;
  useSequentialThinking?: boolean;
  priority?: Priority;
  contextScope?: ContextScope;
  agentSpecialization?: AgentSpecializationConfig;
}

interface DecompositionResult {
  decompositionId: string;
  epic: Epic;
  hierarchy: TaskHierarchy;
  metadata: {
    totalTokensUsed: number;
    processingTimeMs: number;
    agentsUsed: string[];
    efficiency: EfficiencyMetrics;
    quality: QualityMetrics;
  };
  status: DecompositionStatus;
  completedAt: Date;
}

interface DecompositionProgress {
  decompositionId: string;
  currentLevel: UPPLevel;
  completedTasks: number;
  totalTasks: number;
  activeAgents: AgentInfo[];
  estimatedTimeRemaining: number;
  tokenUsageSoFar: number;
}

class HierarchicalDecomposer {
  private readonly decompositionId: string;
  private readonly config: HierarchicalDecomposerConfig;
  private readonly logger: Logger;
  private activeDecompositions: Map<string, DecompositionState>;

  constructor(
    private readonly agentPool: AgentPoolManager,
    private readonly tokenMonitor: TokenMonitor,
    private readonly sequentialThinking: SequentialThinkingClient,
    private readonly contextManager: ContextManager,
    config: HierarchicalDecomposerConfig
  ) {
    this.config = { ...defaultConfig, ...config };
    this.logger = new Logger('HierarchicalDecomposer');
    this.activeDecompositions = new Map();
    this.decompositionId = generateDecompositionId();
  }
}
```

### Core Properties
- **decompositionId**: Unique identifier for tracking decomposition sessions
- **config**: Configuration object with defaults and overrides
- **logger**: Structured logging for debugging and monitoring
- **activeDecompositions**: Map tracking all active decomposition processes
- **agentPool**: Reference to agent pool for parallel execution
- **tokenMonitor**: Token usage tracking and budget management
- **sequentialThinking**: Sequential Thinking MCP client integration
- **contextManager**: Context scoping and inheritance management

### Constructor Logic
1. **Configuration Merging**: Combine default config with provided overrides
2. **Logger Setup**: Initialize logger with appropriate context and level
3. **State Initialization**: Initialize activeDecompositions map and ID generation
4. **Dependency Validation**: Verify all injected dependencies are properly initialized
5. **Event Handlers**: Set up event listeners for agent pool and token monitor events

## Code Implementation

```typescript
// packages/mcp-orchestrator/src/services/HierarchicalDecomposer.ts

interface HierarchicalDecomposerConfig {
  maxConcurrentDecompositions: number;
  defaultMaxDepth: number;
  defaultTokenBudget: number;
  defaultTimeout: number;
  agentSpecialization: AgentSpecializationMap;
  contextScoping: ContextScopingRules;
  progressReportingInterval: number;
  errorRetryPolicy: RetryPolicy;
}

const defaultConfig: HierarchicalDecomposerConfig = {
  maxConcurrentDecompositions: 10,
  defaultMaxDepth: 6, // Epic → Feature → Story → Task → Subtask → Atomic
  defaultTokenBudget: 5000,
  defaultTimeout: 300000, // 5 minutes
  agentSpecialization: {
    [UPPLevel.EPIC]: 'strategic-planner',
    [UPPLevel.FEATURE]: 'architecture-specialist',
    [UPPLevel.STORY]: 'experience-designer', 
    [UPPLevel.TASK]: 'implementation-planner',
    [UPPLevel.SUBTASK]: 'detail-specialist',
    [UPPLevel.ATOMIC]: 'code-specialist'
  },
  contextScoping: {
    inheritanceRatio: 0.7, // 70% context inheritance
    filteringThreshold: 0.3, // Filter out <30% relevance
    compressionRatio: 0.5 // Compress to 50% size at each level
  },
  progressReportingInterval: 5000, // 5 seconds
  errorRetryPolicy: {
    maxRetries: 3,
    backoffMultiplier: 2,
    initialDelay: 1000
  }
};

class HierarchicalDecomposer {
  constructor(
    private readonly agentPool: AgentPoolManager,
    private readonly tokenMonitor: TokenMonitor,
    private readonly sequentialThinking: SequentialThinkingClient,
    private readonly contextManager: ContextManager,
    config?: Partial<HierarchicalDecomposerConfig>
  ) {
    // Merge configuration with defaults
    this.config = { ...defaultConfig, ...config };
    
    // Initialize logger with structured context
    this.logger = new Logger('HierarchicalDecomposer', {
      maxConcurrentDecompositions: this.config.maxConcurrentDecompositions,
      version: '1.0.0'
    });
    
    // Initialize state tracking
    this.activeDecompositions = new Map<string, DecompositionState>();
    
    // Validate dependencies
    this.validateDependencies();
    
    // Set up event handlers
    this.setupEventHandlers();
    
    this.logger.info('HierarchicalDecomposer initialized', {
      config: this.config,
      agentPoolStatus: this.agentPool.getStatus()
    });
  }
  
  private validateDependencies(): void {
    if (!this.agentPool) {
      throw new Error('AgentPoolManager is required');
    }
    if (!this.tokenMonitor) {
      throw new Error('TokenMonitor is required');
    }
    if (!this.sequentialThinking) {
      throw new Error('SequentialThinkingClient is required');
    }
    if (!this.contextManager) {
      throw new Error('ContextManager is required');
    }
    
    // Verify agent pool has required specializations
    const requiredAgentTypes = Object.values(this.config.agentSpecialization);
    for (const agentType of requiredAgentTypes) {
      if (!this.agentPool.hasAgentType(agentType)) {
        throw new Error(`Required agent type not available: ${agentType}`);
      }
    }
  }
  
  private setupEventHandlers(): void {
    // Agent pool events
    this.agentPool.on('agentAcquired', (agentId: string) => {
      this.logger.debug('Agent acquired for decomposition', { agentId });
    });
    
    this.agentPool.on('agentReleased', (agentId: string) => {
      this.logger.debug('Agent released from decomposition', { agentId });
    });
    
    // Token monitor events
    this.tokenMonitor.on('budgetWarning', (usage: TokenUsage) => {
      this.logger.warn('Token budget warning', { usage });
    });
    
    this.tokenMonitor.on('budgetExceeded', (usage: TokenUsage) => {
      this.logger.error('Token budget exceeded', { usage });
      // Implement budget exceeded handling
    });
  }
  
  // Lifecycle methods to be implemented in other atomic tasks
  async initialize(): Promise<void> { /* Implementation in A.0004.02.01.01.01.05 */ }
  async shutdown(): Promise<void> { /* Implementation in A.0004.02.01.01.01.05 */ }
  getStatus(): DecomposerStatus { /* Implementation in A.0004.02.01.01.01.05 */ }
}
```

## Validation Criteria

1. **Class Structure**
   - All interfaces are properly defined with TypeScript strict mode
   - Constructor accepts all required dependencies with proper typing
   - Properties are correctly initialized and accessible

2. **Configuration Management**
   - Default configuration covers all necessary parameters
   - Configuration merging works correctly with partial overrides
   - Invalid configurations are rejected with clear error messages

3. **Dependency Injection**
   - All dependencies are properly injected and validated
   - Missing dependencies throw descriptive errors
   - Dependency health is verified during initialization

4. **State Management**
   - Active decompositions are tracked in memory-efficient map
   - State is properly initialized and cleaned up
   - Concurrent decomposition limits are enforced

5. **Event Handling**
   - Event handlers are properly registered for all dependencies
   - Events are logged with appropriate context and level
   - Error conditions trigger appropriate responses

## Unit Tests Required

```typescript
describe('HierarchicalDecomposer Class Structure', () => {
  let decomposer: HierarchicalDecomposer;
  let mockAgentPool: jest.Mocked<AgentPoolManager>;
  let mockTokenMonitor: jest.Mocked<TokenMonitor>;
  let mockSequentialThinking: jest.Mocked<SequentialThinkingClient>;
  let mockContextManager: jest.Mocked<ContextManager>;

  beforeEach(() => {
    // Setup mocks
    mockAgentPool = createMockAgentPool();
    mockTokenMonitor = createMockTokenMonitor();
    mockSequentialThinking = createMockSequentialThinking();
    mockContextManager = createMockContextManager();
  });

  it('should initialize with default configuration', () => {
    decomposer = new HierarchicalDecomposer(
      mockAgentPool,
      mockTokenMonitor,
      mockSequentialThinking,
      mockContextManager
    );

    expect(decomposer).toBeDefined();
    expect(decomposer['config'].maxConcurrentDecompositions).toBe(10);
    expect(decomposer['config'].defaultTokenBudget).toBe(5000);
  });

  it('should merge custom configuration with defaults', () => {
    decomposer = new HierarchicalDecomposer(
      mockAgentPool,
      mockTokenMonitor,
      mockSequentialThinking,
      mockContextManager,
      { maxConcurrentDecompositions: 5, defaultTokenBudget: 3000 }
    );

    expect(decomposer['config'].maxConcurrentDecompositions).toBe(5);
    expect(decomposer['config'].defaultTokenBudget).toBe(3000);
    expect(decomposer['config'].defaultMaxDepth).toBe(6); // Default preserved
  });

  it('should validate required dependencies', () => {
    expect(() => {
      new HierarchicalDecomposer(
        null as any,
        mockTokenMonitor,
        mockSequentialThinking,
        mockContextManager
      );
    }).toThrow('AgentPoolManager is required');
  });

  it('should validate agent specializations are available', () => {
    mockAgentPool.hasAgentType.mockReturnValueOnce(false);

    expect(() => {
      new HierarchicalDecomposer(
        mockAgentPool,
        mockTokenMonitor,
        mockSequentialThinking,
        mockContextManager
      );
    }).toThrow('Required agent type not available');
  });

  it('should initialize active decompositions map', () => {
    decomposer = new HierarchicalDecomposer(
      mockAgentPool,
      mockTokenMonitor,
      mockSequentialThinking,
      mockContextManager
    );

    expect(decomposer['activeDecompositions']).toBeInstanceOf(Map);
    expect(decomposer['activeDecompositions'].size).toBe(0);
  });
});
```

## Dependencies

- AgentPoolManager for parallel agent execution
- TokenMonitor for usage tracking and budget management
- SequentialThinkingClient for structured reasoning
- ContextManager for context scoping and inheritance
- Logger utility for structured logging
- Event system for inter-service communication

## Notes

- This class serves as the central orchestrator for all hierarchical decomposition operations
- Proper dependency injection enables testing and modularity
- Configuration system allows for environment-specific tuning
- Event-driven architecture enables real-time monitoring and response
- Strong typing ensures compile-time safety and developer experience