# Atomic Task: Schema Validation Rules Implementation

**Task ID**: A.0004.01.02.01.01.04  
**Parent**: ST.0004.01.02.01.01 - Configuration Schema Design  
**Type**: Implementation  
**Estimate**: 3 hours

## Task Description

Implement comprehensive validation rules that enforce consistency across memory, CPU, and connection limit schemas, with cross-schema validation and runtime constraint checking.

## Implementation Requirements

### Cross-Schema Validation Rules
```typescript
interface ResourceLimitsValidationRules {
  // Memory vs CPU consistency
  memoryToCPURatio: {
    minRatio: number;  // Minimum MB per CPU percent
    maxRatio: number;  // Maximum MB per CPU percent
  };
  
  // Connection vs Memory consistency  
  connectionsToMemoryRatio: {
    minMemoryPerConnection: number;  // MB per connection
    maxMemoryPerConnection: number;  // MB per connection
  };
  
  // Agent count calculations
  agentLimits: {
    maxConcurrentAgents: number;
    reservedSystemMemory: number;
    reservedSystemCPU: number;
  };
}
```

## Code Implementation

```typescript
// packages/mcp-orchestrator/src/config/validation/ResourceLimitsValidator.ts

import { MemoryLimits } from '../schemas/MemoryLimitsSchema';
import { CPULimits } from '../schemas/CPULimitsSchema';
import { ConnectionLimits } from '../schemas/ConnectionLimitsSchema';
import { Logger } from '../../utils/Logger';

export interface CrossSchemaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  calculatedLimits: {
    maxRecommendedAgents: number;
    memoryPerAgent: number;
    cpuPerAgent: number;
    connectionsPerAgent: number;
  };
}

export class ResourceLimitsValidator {
  private logger: Logger;
  
  constructor(logger: Logger) {
    this.logger = logger;
  }
  
  validateCrossSchemaConsistency(
    memoryLimits: MemoryLimits,
    cpuLimits: CPULimits,
    connectionLimits: ConnectionLimits
  ): CrossSchemaValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Calculate theoretical maximum agents based on each resource
    const maxAgentsByMemory = Math.floor(memoryLimits.maxPoolMemory / memoryLimits.maxAgentMemory);
    const maxAgentsByCPU = Math.floor(cpuLimits.maxPoolCPUPercent / cpuLimits.maxAgentCPUPercent);
    const maxAgentsByConnections = Math.floor(connectionLimits.maxConcurrentConnections / connectionLimits.maxConnectionsPerAgent);
    
    // Find the most restrictive limit
    const maxRecommendedAgents = Math.min(maxAgentsByMemory, maxAgentsByCPU, maxAgentsByConnections);
    
    // Cross-validation rules
    this.validateMemoryToCPURatio(memoryLimits, cpuLimits, errors, warnings);
    this.validateConnectionToMemoryRatio(connectionLimits, memoryLimits, errors, warnings);
    this.validateAgentResourceDistribution(maxRecommendedAgents, memoryLimits, cpuLimits, connectionLimits, errors, warnings);
    this.validateThresholdConsistency(memoryLimits, cpuLimits, errors, warnings);
    
    const result: CrossSchemaValidationResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      calculatedLimits: {
        maxRecommendedAgents,
        memoryPerAgent: memoryLimits.maxAgentMemory,
        cpuPerAgent: cpuLimits.maxAgentCPUPercent,
        connectionsPerAgent: connectionLimits.maxConnectionsPerAgent
      }
    };
    
    this.logger.info('Resource limits cross-validation completed', {
      isValid: result.isValid,
      maxRecommendedAgents,
      errorCount: errors.length,
      warningCount: warnings.length
    });
    
    return result;
  }
  
  private validateMemoryToCPURatio(
    memoryLimits: MemoryLimits,
    cpuLimits: CPULimits,
    errors: string[],
    warnings: string[]
  ): void {
    const memoryMB = memoryLimits.maxAgentMemory / (1024 * 1024);
    const cpuPercent = cpuLimits.maxAgentCPUPercent;
    const memoryToCPURatio = memoryMB / cpuPercent;
    
    // Typical ratios: 4-16 MB per CPU percent for balanced workloads
    if (memoryToCPURatio < 2) {
      warnings.push(`Low memory-to-CPU ratio (${memoryToCPURatio.toFixed(1)} MB per CPU%). May cause memory pressure.`);
    } else if (memoryToCPURatio > 32) {
      warnings.push(`High memory-to-CPU ratio (${memoryToCPURatio.toFixed(1)} MB per CPU%). Consider increasing CPU limits.`);
    }
  }
  
  private validateConnectionToMemoryRatio(
    connectionLimits: ConnectionLimits,
    memoryLimits: MemoryLimits,
    errors: string[],
    warnings: string[]
  ): void {
    const memoryMB = memoryLimits.maxAgentMemory / (1024 * 1024);
    const connections = connectionLimits.maxConnectionsPerAgent;
    const memoryPerConnection = memoryMB / connections;
    
    // Minimum 1MB per connection for HTTP overhead and buffers
    if (memoryPerConnection < 1) {
      errors.push(`Insufficient memory per connection (${memoryPerConnection.toFixed(1)} MB). Minimum 1MB required.`);
    } else if (memoryPerConnection < 2) {
      warnings.push(`Low memory per connection (${memoryPerConnection.toFixed(1)} MB). May impact performance.`);
    }
  }
  
  private validateAgentResourceDistribution(
    maxAgents: number,
    memoryLimits: MemoryLimits,
    cpuLimits: CPULimits,
    connectionLimits: ConnectionLimits,
    errors: string[],
    warnings: string[]
  ): void {
    if (maxAgents < 1) {
      errors.push('Resource limits are too restrictive - cannot support even one agent.');
      return;
    }
    
    if (maxAgents < 3) {
      warnings.push(`Resource limits only support ${maxAgents} concurrent agents. Consider increasing limits for better parallelization.`);
    }
    
    // Check if limits are unbalanced (one resource much more restrictive than others)
    const memoryCapacity = Math.floor(memoryLimits.maxPoolMemory / memoryLimits.maxAgentMemory);
    const cpuCapacity = Math.floor(cpuLimits.maxPoolCPUPercent / cpuLimits.maxAgentCPUPercent);
    const connectionCapacity = Math.floor(connectionLimits.maxConcurrentConnections / connectionLimits.maxConnectionsPerAgent);
    
    const maxCapacity = Math.max(memoryCapacity, cpuCapacity, connectionCapacity);
    const minCapacity = Math.min(memoryCapacity, cpuCapacity, connectionCapacity);
    
    if (maxCapacity > minCapacity * 2) {
      const bottleneck = memoryCapacity === minCapacity ? 'memory' : 
                        cpuCapacity === minCapacity ? 'CPU' : 'connections';
      warnings.push(`Resource distribution is unbalanced. ${bottleneck} is the primary bottleneck.`);
    }
  }
  
  private validateThresholdConsistency(
    memoryLimits: MemoryLimits,
    cpuLimits: CPULimits,
    errors: string[],
    warnings: string[]
  ): void {
    // Memory cleanup should trigger before CPU throttling if memory is the constraint
    const memoryCleanupPoint = memoryLimits.cleanupThreshold;
    const cpuThrottlePoint = cpuLimits.throttleThreshold / 100; // Convert to 0-1 range
    
    if (memoryCleanupPoint > cpuThrottlePoint + 0.1) {
      warnings.push('Memory cleanup threshold is much higher than CPU throttle threshold. Consider aligning thresholds.');
    }
  }
  
  validateRuntimeConstraints(currentUsage: {
    memoryUsed: number;
    cpuUsed: number;
    connectionsUsed: number;
    activeAgents: number;
  }, limits: {
    memory: MemoryLimits;
    cpu: CPULimits;
    connections: ConnectionLimits;
  }): { canAddAgent: boolean; reason?: string } {
    
    // Check if we can add one more agent within limits
    const projectedMemory = currentUsage.memoryUsed + limits.memory.maxAgentMemory;
    const projectedCPU = currentUsage.cpuUsed + limits.cpu.maxAgentCPUPercent;
    const projectedConnections = currentUsage.connectionsUsed + limits.connections.maxConnectionsPerAgent;
    
    if (projectedMemory > limits.memory.maxPoolMemory) {
      return { canAddAgent: false, reason: 'Would exceed memory pool limit' };
    }
    
    if (projectedCPU > limits.cpu.maxPoolCPUPercent) {
      return { canAddAgent: false, reason: 'Would exceed CPU pool limit' };
    }
    
    if (projectedConnections > limits.connections.maxConcurrentConnections) {
      return { canAddAgent: false, reason: 'Would exceed connection pool limit' };
    }
    
    return { canAddAgent: true };
  }
}
```

## Validation Criteria

1. **Cross-Schema Consistency**
   - [ ] Memory-to-CPU ratios are within reasonable bounds (2-32 MB per CPU%)
   - [ ] Connection-to-memory ratios ensure adequate buffering (>1MB per connection)
   - [ ] Agent capacity calculations consider all resource constraints
   - [ ] Threshold alignment prevents conflicting resource management actions

2. **Runtime Validation**
   - [ ] Current usage checks prevent resource exhaustion
   - [ ] Projected usage calculations account for new agent overhead
   - [ ] Clear error messages identify specific constraint violations
   - [ ] Performance impact of validation is minimal (<10ms)

3. **Error Reporting**
   - [ ] Validation errors are specific and actionable
   - [ ] Warnings highlight potential performance issues
   - [ ] Calculated limits help with capacity planning
   - [ ] Logging provides debugging information

## Unit Tests Required

```typescript
describe('ResourceLimitsValidator', () => {
  let validator: ResourceLimitsValidator;
  
  beforeEach(() => {
    validator = new ResourceLimitsValidator(new Logger());
  });
  
  it('should validate balanced resource configuration', () => {
    const memory = { maxPoolMemory: 1024 * 1024 * 1024, maxAgentMemory: 256 * 1024 * 1024, /* ... */ };
    const cpu = { maxPoolCPUPercent: 80, maxAgentCPUPercent: 20, /* ... */ };
    const connections = { maxConcurrentConnections: 100, maxConnectionsPerAgent: 25, /* ... */ };
    
    const result = validator.validateCrossSchemaConsistency(memory, cpu, connections);
    
    expect(result.isValid).toBe(true);
    expect(result.calculatedLimits.maxRecommendedAgents).toBe(4);
  });
  
  it('should detect insufficient memory per connection', () => {
    const memory = { maxAgentMemory: 10 * 1024 * 1024 }; // 10MB
    const connections = { maxConnectionsPerAgent: 50 }; // 0.2MB per connection
    
    const result = validator.validateCrossSchemaConsistency(memory, cpu, connections);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Insufficient memory per connection'))).toBe(true);
  });
  
  it('should validate runtime constraints for new agents', () => {
    const currentUsage = { memoryUsed: 800 * 1024 * 1024, cpuUsed: 60, connectionsUsed: 80, activeAgents: 3 };
    const limits = { /* ... */ };
    
    const result = validator.validateRuntimeConstraints(currentUsage, limits);
    
    expect(result.canAddAgent).toBe(false);
    expect(result.reason).toContain('exceed');
  });
});
```

## Dependencies

- Memory, CPU, and Connection schema definitions
- System resource monitoring APIs
- Logging infrastructure
- Mathematical validation utilities

## Notes

- Validation rules are based on empirical performance testing
- Cross-schema validation prevents resource conflicts
- Runtime validation ensures system stability
- Calculated limits assist with capacity planning and optimization
- Threshold alignment prevents competing resource management actions