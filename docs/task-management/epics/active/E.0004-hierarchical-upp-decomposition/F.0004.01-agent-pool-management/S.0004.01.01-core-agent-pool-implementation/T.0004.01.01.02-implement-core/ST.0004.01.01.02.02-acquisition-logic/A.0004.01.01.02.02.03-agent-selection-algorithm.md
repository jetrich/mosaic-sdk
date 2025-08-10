# Atomic Task: Agent Selection Algorithm

**Task ID**: A.0004.01.01.02.02.03  
**Parent**: ST.0004.01.01.02.02 - Agent Acquisition Logic  
**Type**: Implementation  
**Estimate**: 3 hours

## Task Description

Implement intelligent agent selection algorithm that chooses the most appropriate agent from the available pool based on type, capabilities, current load, and optimization criteria.

## Implementation Requirements

### Input Parameters
- `type`: string - Requested agent type identifier
- `options?`: AcquireOptions - Optional configuration for selection
  - `priority`: Priority enum (HIGH, NORMAL, LOW)
  - `capabilities`: string[] - Required agent capabilities
  - `loadBalancing`: 'round-robin' | 'least-loaded' | 'random'
- `availableAgents`: Agent[] - Pool of available agents

### Selection Criteria
1. **Type Matching**
   - Filter agents by exact type match
   - Consider compatible types if exact match unavailable
   - Prioritize specialized agents over general-purpose

2. **Capability Assessment**
   - Verify agent supports all required capabilities
   - Score agents based on capability match percentage
   - Consider agent-specific performance metrics

3. **Load Balancing**
   - Evaluate current agent workload and capacity
   - Apply configured load balancing strategy
   - Consider agent health and response time metrics

4. **Optimization Scoring**
   - Calculate composite score based on multiple factors
   - Apply priority weighting to selection criteria
   - Select highest-scoring available agent

## Code Implementation

```typescript
// packages/mcp-orchestrator/src/services/AgentSelectionEngine.ts

interface SelectionCriteria {
  typeWeight: number;
  capabilityWeight: number;
  loadWeight: number;
  healthWeight: number;
}

interface AgentScore {
  agent: Agent;
  totalScore: number;
  breakdown: {
    typeMatch: number;
    capabilityMatch: number;
    loadScore: number;
    healthScore: number;
  };
}

class AgentSelectionEngine {
  private defaultCriteria: SelectionCriteria = {
    typeWeight: 0.4,
    capabilityWeight: 0.3,
    loadWeight: 0.2,
    healthWeight: 0.1
  };

  constructor(
    private metricsCollector: AgentMetricsCollector,
    private logger: Logger
  ) {}

  async selectOptimalAgent(
    type: string,
    availableAgents: Agent[],
    options?: AcquireOptions
  ): Promise<Agent | null> {
    if (availableAgents.length === 0) {
      this.logger.warn('No available agents for selection', { type });
      return null;
    }

    const scoredAgents = await this.scoreAgents(type, availableAgents, options);
    const selectedAgent = this.applySelectionStrategy(scoredAgents, options);

    this.logger.info('Agent selection completed', {
      type,
      availableCount: availableAgents.length,
      selectedAgent: selectedAgent?.id,
      selectionStrategy: options?.loadBalancing || 'optimal-score'
    });

    return selectedAgent;
  }

  private async scoreAgents(
    type: string,
    agents: Agent[],
    options?: AcquireOptions
  ): Promise<AgentScore[]> {
    const scoredAgents: AgentScore[] = [];

    for (const agent of agents) {
      const typeScore = this.calculateTypeScore(agent, type);
      const capabilityScore = await this.calculateCapabilityScore(agent, options?.capabilities);
      const loadScore = await this.calculateLoadScore(agent);
      const healthScore = await this.calculateHealthScore(agent);

      const totalScore = 
        (typeScore * this.defaultCriteria.typeWeight) +
        (capabilityScore * this.defaultCriteria.capabilityWeight) +
        (loadScore * this.defaultCriteria.loadWeight) +
        (healthScore * this.defaultCriteria.healthWeight);

      scoredAgents.push({
        agent,
        totalScore,
        breakdown: {
          typeMatch: typeScore,
          capabilityMatch: capabilityScore,
          loadScore,
          healthScore
        }
      });
    }

    return scoredAgents.sort((a, b) => b.totalScore - a.totalScore);
  }

  private calculateTypeScore(agent: Agent, requestedType: string): number {
    if (agent.type === requestedType) {
      return 1.0; // Perfect match
    }
    
    if (agent.compatibleTypes?.includes(requestedType)) {
      return 0.8; // Compatible type
    }
    
    if (agent.type === 'general-purpose') {
      return 0.6; // General purpose fallback
    }
    
    return 0.0; // No match
  }

  private async calculateCapabilityScore(
    agent: Agent, 
    requiredCapabilities?: string[]
  ): Promise<number> {
    if (!requiredCapabilities || requiredCapabilities.length === 0) {
      return 1.0; // No specific requirements
    }

    const agentCapabilities = await agent.getCapabilities();
    const matchingCapabilities = requiredCapabilities.filter(cap => 
      agentCapabilities.includes(cap)
    );

    return matchingCapabilities.length / requiredCapabilities.length;
  }

  private async calculateLoadScore(agent: Agent): Promise<number> {
    const metrics = await this.metricsCollector.getAgentMetrics(agent.id);
    const currentLoad = metrics.currentTasks / metrics.maxConcurrentTasks;
    
    // Invert load score (lower load = higher score)
    return Math.max(0, 1 - currentLoad);
  }

  private async calculateHealthScore(agent: Agent): Promise<number> {
    const healthStatus = await agent.getHealthStatus();
    
    switch (healthStatus.status) {
      case 'healthy': return 1.0;
      case 'degraded': return 0.7;
      case 'warning': return 0.5;
      case 'critical': return 0.2;
      case 'offline': return 0.0;
      default: return 0.5;
    }
  }

  private applySelectionStrategy(
    scoredAgents: AgentScore[],
    options?: AcquireOptions
  ): Agent | null {
    if (scoredAgents.length === 0) return null;

    const strategy = options?.loadBalancing || 'optimal-score';

    switch (strategy) {
      case 'round-robin':
        return this.selectRoundRobin(scoredAgents);
      case 'least-loaded':
        return this.selectLeastLoaded(scoredAgents);
      case 'random':
        return this.selectRandom(scoredAgents);
      case 'optimal-score':
      default:
        return scoredAgents[0].agent; // Highest scored agent
    }
  }

  private selectRoundRobin(scoredAgents: AgentScore[]): Agent {
    // Implement round-robin selection among top-scored agents
    const topScoreThreshold = scoredAgents[0].totalScore * 0.9;
    const eligibleAgents = scoredAgents.filter(s => s.totalScore >= topScoreThreshold);
    
    const roundRobinIndex = this.getRoundRobinIndex(eligibleAgents.length);
    return eligibleAgents[roundRobinIndex].agent;
  }

  private selectLeastLoaded(scoredAgents: AgentScore[]): Agent {
    return scoredAgents.sort((a, b) => b.breakdown.loadScore - a.breakdown.loadScore)[0].agent;
  }

  private selectRandom(scoredAgents: AgentScore[]): Agent {
    const randomIndex = Math.floor(Math.random() * scoredAgents.length);
    return scoredAgents[randomIndex].agent;
  }

  private getRoundRobinIndex(agentCount: number): number {
    // Simple round-robin implementation - in production would use persistent counter
    return Date.now() % agentCount;
  }
}
```

## Validation Criteria

1. **Type Matching Accuracy**
   - Correctly identifies exact type matches with score 1.0
   - Recognizes compatible types with appropriate scoring
   - Falls back to general-purpose agents when needed

2. **Capability Assessment**
   - Accurately calculates capability match percentage
   - Handles missing or undefined capability requirements
   - Properly validates agent capability claims

3. **Load Balancing**
   - Implements all selection strategies correctly
   - Distributes load appropriately across agents
   - Considers agent capacity and current utilization

4. **Selection Optimization**
   - Composite scoring produces logical agent rankings
   - Strategy application works as configured
   - Performance remains acceptable under load

5. **Edge Case Handling**
   - Gracefully handles empty agent pools
   - Manages agents with incomplete metrics
   - Provides fallback selections when optimal choice unavailable

## Unit Tests Required

```typescript
describe('AgentSelectionEngine.selectOptimalAgent', () => {
  it('should select agent with exact type match', async () => {
    const agents = [
      createMockAgent('agent1', 'feature-specialist'),
      createMockAgent('agent2', 'general-purpose')
    ];
    
    const selected = await engine.selectOptimalAgent('feature-specialist', agents);
    
    expect(selected.id).toBe('agent1');
    expect(selected.type).toBe('feature-specialist');
  });

  it('should consider capability requirements in selection', async () => {
    const agents = [
      createMockAgent('agent1', 'general-purpose', ['database', 'api']),
      createMockAgent('agent2', 'general-purpose', ['frontend', 'ui'])
    ];
    
    const selected = await engine.selectOptimalAgent('general-purpose', agents, {
      capabilities: ['database', 'api']
    });
    
    expect(selected.id).toBe('agent1');
  });

  it('should apply least-loaded strategy correctly', async () => {
    const agents = [
      createMockAgentWithLoad('agent1', 'general-purpose', 0.8),
      createMockAgentWithLoad('agent2', 'general-purpose', 0.3)
    ];
    
    const selected = await engine.selectOptimalAgent('general-purpose', agents, {
      loadBalancing: 'least-loaded'
    });
    
    expect(selected.id).toBe('agent2');
  });

  it('should handle empty agent pool gracefully', async () => {
    const selected = await engine.selectOptimalAgent('any-type', []);
    
    expect(selected).toBeNull();
  });

  it('should score agents correctly based on multiple criteria', async () => {
    const agent = createMockAgent('test-agent', 'feature-specialist');
    const scores = await engine.scoreAgents('feature-specialist', [agent]);
    
    expect(scores[0].breakdown.typeMatch).toBe(1.0);
    expect(scores[0].totalScore).toBeLessThanOrEqual(1.0);
    expect(scores[0].totalScore).toBeGreaterThan(0.0);
  });
});
```

## Dependencies

- AgentMetricsCollector for load and performance metrics
- Agent health status monitoring system
- Logger for selection decision tracking
- Agent capability query interface

## Notes

- Selection algorithm balances multiple competing criteria for optimal agent assignment
- Configurable weights allow tuning selection behavior for different use cases
- Strategy pattern enables different load balancing approaches
- Comprehensive scoring provides transparency in selection decisions