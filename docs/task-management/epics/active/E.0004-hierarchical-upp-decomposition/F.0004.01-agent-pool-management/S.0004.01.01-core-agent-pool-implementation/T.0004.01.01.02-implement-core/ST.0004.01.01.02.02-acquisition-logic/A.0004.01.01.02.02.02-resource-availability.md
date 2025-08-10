# Atomic Task: Resource Availability Check

**Task ID**: A.0004.01.01.02.02.02  
**Parent**: ST.0004.01.01.02.02 - Agent Acquisition Logic  
**Type**: Implementation  
**Estimate**: 3 hours

## Task Description

Implement comprehensive resource availability checking before agent acquisition, ensuring the system has sufficient capacity (memory, tokens, concurrent agents) to fulfill the request without degrading performance.

## Implementation Requirements

### Resource Types to Check
- **Concurrent Agent Limit**: Maximum number of active agents (default: 5)
- **Memory Constraints**: Available system memory for agent processes
- **Token Budget**: Remaining API token allocation for the session/day
- **System Resources**: CPU usage, disk space, network connectivity

### Resource Checking Logic
1. **Current Pool Capacity Check**
   - Count active agents vs configured maximum
   - Account for agents in acquisition/initialization state
   - Consider agent type-specific limits

2. **Memory Availability Assessment**
   - Check available system memory
   - Estimate memory requirement for requested agent type
   - Include buffer for agent operational overhead

3. **Token Budget Validation**
   - Check remaining token budget for current session
   - Estimate token requirement for agent lifecycle
   - Consider priority-based token allocation

4. **System Health Check**
   - Validate system resource utilization is within limits
   - Check external dependency availability (Sequential Thinking MCP)
   - Verify network connectivity and latency

## Code Implementation

```typescript
// packages/mcp-orchestrator/src/services/ResourceLimiter.ts

interface ResourceCheckResult {
  available: boolean;
  reason?: string;
  details: ResourceDetails;
  recommendedAction?: string;
}

interface ResourceDetails {
  activeAgents: number;
  maxAgents: number;
  availableMemoryMB: number;
  requiredMemoryMB: number;
  remainingTokens: number;
  estimatedTokenUsage: number;
  systemHealth: SystemHealthStatus;
}

class ResourceLimiter {
  constructor(
    private config: ResourceLimiterConfig,
    private systemMonitor: SystemMonitor,
    private tokenTracker: TokenTracker,
    private logger: Logger
  ) {}

  async checkAvailability(
    agentType: string,
    priority: Priority = Priority.NORMAL
  ): Promise<ResourceCheckResult> {
    const details: ResourceDetails = {
      activeAgents: 0,
      maxAgents: this.config.maxConcurrentAgents,
      availableMemoryMB: 0,
      requiredMemoryMB: 0,
      remainingTokens: 0,
      estimatedTokenUsage: 0,
      systemHealth: SystemHealthStatus.UNKNOWN
    };

    try {
      // 1. Check concurrent agent limits
      details.activeAgents = await this.getActiveAgentCount();
      if (details.activeAgents >= details.maxAgents) {
        return {
          available: false,
          reason: `Agent pool at capacity (${details.activeAgents}/${details.maxAgents})`,
          details,
          recommendedAction: 'Wait for agent to be released or increase pool size'
        };
      }

      // 2. Check memory availability
      const memoryCheck = await this.checkMemoryAvailability(agentType);
      details.availableMemoryMB = memoryCheck.availableMB;
      details.requiredMemoryMB = memoryCheck.requiredMB;
      
      if (!memoryCheck.sufficient) {
        return {
          available: false,
          reason: `Insufficient memory: need ${memoryCheck.requiredMB}MB, have ${memoryCheck.availableMB}MB`,
          details,
          recommendedAction: 'Free memory or reduce agent pool size'
        };
      }

      // 3. Check token budget
      const tokenCheck = await this.checkTokenBudget(agentType, priority);
      details.remainingTokens = tokenCheck.remaining;
      details.estimatedTokenUsage = tokenCheck.estimated;
      
      if (!tokenCheck.sufficient) {
        return {
          available: false,
          reason: `Insufficient token budget: need ~${tokenCheck.estimated}, have ${tokenCheck.remaining}`,
          details,
          recommendedAction: priority === Priority.HIGH 
            ? 'Consider reducing agent pool or increasing token budget'
            : 'Wait for token budget refresh or increase priority'
        };
      }

      // 4. Check system health
      const healthCheck = await this.checkSystemHealth();
      details.systemHealth = healthCheck.status;
      
      if (healthCheck.status === SystemHealthStatus.UNHEALTHY) {
        return {
          available: false,
          reason: `System unhealthy: ${healthCheck.issues.join(', ')}`,
          details,
          recommendedAction: 'Wait for system health to improve'
        };
      }

      // All checks passed
      this.logger.debug('Resource availability check passed', {
        agentType,
        priority,
        details
      });

      return {
        available: true,
        details
      };

    } catch (error) {
      this.logger.error('Resource availability check failed', {
        agentType,
        error: error.message
      });

      return {
        available: false,
        reason: 'Resource check failed due to internal error',
        details,
        recommendedAction: 'Retry request or check system logs'
      };
    }
  }

  private async getActiveAgentCount(): Promise<number> {
    // Count agents in ACTIVE, ACQUIRING, or INITIALIZING states
    return this.agentPool.getActiveCount();
  }

  private async checkMemoryAvailability(agentType: string): Promise<MemoryCheck> {
    const availableMB = await this.systemMonitor.getAvailableMemoryMB();
    const requiredMB = this.getAgentMemoryRequirement(agentType);
    const bufferMB = requiredMB * 0.2; // 20% buffer
    
    return {
      availableMB,
      requiredMB: requiredMB + bufferMB,
      sufficient: availableMB >= (requiredMB + bufferMB)
    };
  }

  private async checkTokenBudget(agentType: string, priority: Priority): Promise<TokenCheck> {
    const remaining = await this.tokenTracker.getRemainingTokens();
    const estimated = this.estimateAgentTokenUsage(agentType, priority);
    
    // Reserve tokens based on priority
    const reservationMultiplier = priority === Priority.HIGH ? 1.5 : 
                                 priority === Priority.NORMAL ? 1.2 : 1.0;
    const requiredWithBuffer = estimated * reservationMultiplier;
    
    return {
      remaining,
      estimated,
      sufficient: remaining >= requiredWithBuffer
    };
  }

  private async checkSystemHealth(): Promise<HealthCheck> {
    const cpuUsage = await this.systemMonitor.getCPUUsage();
    const diskUsage = await this.systemMonitor.getDiskUsage();
    const mcpConnectivity = await this.systemMonitor.checkMCPConnectivity();
    
    const issues: string[] = [];
    
    if (cpuUsage > 90) issues.push(`High CPU usage: ${cpuUsage}%`);
    if (diskUsage > 95) issues.push(`Low disk space: ${100 - diskUsage}% remaining`);
    if (!mcpConnectivity.connected) issues.push('Sequential Thinking MCP unavailable');
    
    return {
      status: issues.length === 0 ? SystemHealthStatus.HEALTHY : 
             issues.length <= 2 ? SystemHealthStatus.DEGRADED : 
             SystemHealthStatus.UNHEALTHY,
      issues
    };
  }

  private getAgentMemoryRequirement(agentType: string): number {
    const baseMemory = 128; // Base 128MB per agent
    const typeMultipliers = {
      'general-purpose': 1.0,
      'feature-specialist': 1.2,
      'story-specialist': 1.1,
      'task-specialist': 1.0,
      'atomic-specialist': 0.8
    };
    
    return baseMemory * (typeMultipliers[agentType] || 1.0);
  }

  private estimateAgentTokenUsage(agentType: string, priority: Priority): number {
    const baseTokens = 1000; // Base token estimate
    const typeMultipliers = {
      'general-purpose': 1.0,
      'feature-specialist': 1.5,
      'story-specialist': 1.2,
      'task-specialist': 1.1,
      'atomic-specialist': 0.8
    };
    
    const priorityMultipliers = {
      [Priority.HIGH]: 1.3,
      [Priority.NORMAL]: 1.0,
      [Priority.LOW]: 0.8
    };
    
    return Math.ceil(
      baseTokens * 
      (typeMultipliers[agentType] || 1.0) * 
      priorityMultipliers[priority]
    );
  }
}
```

## Validation Criteria

1. **Concurrent Limit Enforcement**
   - Never allows more agents than configured maximum
   - Accurately counts agents in all states (active, acquiring, initializing)
   - Handles race conditions in concurrent acquisition attempts

2. **Memory Management**
   - Prevents system memory exhaustion
   - Includes appropriate buffer for agent operations
   - Accounts for agent type-specific memory requirements

3. **Token Budget Management**
   - Prevents token budget overruns
   - Provides accurate usage estimates
   - Implements priority-based token reservation

4. **System Health Monitoring**
   - Detects system resource constraints
   - Validates external dependency availability
   - Provides actionable recommendations for issues

5. **Performance Requirements**
   - Resource check completes in <500ms
   - Handles high concurrency without blocking
   - Minimal performance impact on system monitoring

## Unit Tests Required

```typescript
describe('ResourceLimiter.checkAvailability', () => {
  it('should allow acquisition when resources are available', async () => {
    mockSystemState({
      activeAgents: 2,
      availableMemoryMB: 1000,
      remainingTokens: 5000,
      systemHealth: SystemHealthStatus.HEALTHY
    });

    const result = await limiter.checkAvailability('general-purpose');

    expect(result.available).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('should reject when at agent capacity', async () => {
    mockSystemState({
      activeAgents: 5, // At max capacity
      availableMemoryMB: 1000,
      remainingTokens: 5000
    });

    const result = await limiter.checkAvailability('general-purpose');

    expect(result.available).toBe(false);
    expect(result.reason).toContain('Agent pool at capacity');
    expect(result.recommendedAction).toContain('Wait for agent to be released');
  });

  it('should reject when memory is insufficient', async () => {
    mockSystemState({
      activeAgents: 2,
      availableMemoryMB: 50, // Too low
      remainingTokens: 5000
    });

    const result = await limiter.checkAvailability('general-purpose');

    expect(result.available).toBe(false);
    expect(result.reason).toContain('Insufficient memory');
  });

  it('should reject when token budget is low', async () => {
    mockSystemState({
      activeAgents: 2,
      availableMemoryMB: 1000,
      remainingTokens: 100, // Too low
      systemHealth: SystemHealthStatus.HEALTHY
    });

    const result = await limiter.checkAvailability('general-purpose');

    expect(result.available).toBe(false);
    expect(result.reason).toContain('Insufficient token budget');
  });

  it('should handle system health issues', async () => {
    mockSystemState({
      activeAgents: 2,
      availableMemoryMB: 1000,
      remainingTokens: 5000,
      systemHealth: SystemHealthStatus.UNHEALTHY
    });

    const result = await limiter.checkAvailability('general-purpose');

    expect(result.available).toBe(false);
    expect(result.reason).toContain('System unhealthy');
  });
});
```

## Dependencies

- SystemMonitor for resource monitoring
- TokenTracker for token budget management
- AgentPool for active agent counting
- Configuration for resource limits and thresholds

## Notes

- Resource checking is critical for system stability and prevents resource exhaustion
- Conservative estimates with buffers help prevent edge case failures
- Priority-based resource allocation enables important tasks to proceed when resources are constrained
- Detailed error messages and recommendations help operators resolve resource issues quickly