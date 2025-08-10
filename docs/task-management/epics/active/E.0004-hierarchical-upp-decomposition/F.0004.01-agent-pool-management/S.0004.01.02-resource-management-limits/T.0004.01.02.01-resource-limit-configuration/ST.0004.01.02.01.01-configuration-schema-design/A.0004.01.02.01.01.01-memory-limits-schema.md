# Atomic Task: Memory Limits Schema Design

**Task ID**: A.0004.01.02.01.01.01  
**Parent**: ST.0004.01.02.01.01 - Configuration Schema Design  
**Type**: Design  
**Estimate**: 2 hours

## Task Description

Design and implement the memory limits configuration schema for agent pool resource management, defining structure and validation rules for memory constraints.

## Implementation Requirements

### Schema Structure
```typescript
interface MemoryLimits {
  maxPoolMemory: number;           // Maximum total memory for entire pool (bytes)
  maxAgentMemory: number;          // Maximum memory per agent (bytes)
  warningThreshold: number;        // Memory usage percentage for warnings (0-1)
  criticalThreshold: number;       // Memory usage percentage for critical alerts (0-1)
  cleanupThreshold: number;        // Memory usage percentage to trigger cleanup (0-1)
  measurementInterval: number;     // Memory measurement interval (milliseconds)
  enforcementMode: 'strict' | 'advisory';  // How to handle limit violations
}
```

### Validation Rules
- maxPoolMemory: Must be positive, minimum 100MB
- maxAgentMemory: Must be positive, cannot exceed maxPoolMemory
- Thresholds: Must be between 0 and 1, warning < critical < cleanup
- measurementInterval: Between 1000ms and 60000ms
- enforcementMode: Valid enum value only

## Code Implementation

```typescript
// packages/mcp-orchestrator/src/config/schemas/MemoryLimitsSchema.ts

import Joi from 'joi';

export const MemoryLimitsSchema = Joi.object({
  maxPoolMemory: Joi.number()
    .integer()
    .min(100 * 1024 * 1024) // 100MB minimum
    .max(16 * 1024 * 1024 * 1024) // 16GB maximum
    .required()
    .description('Maximum total memory for entire agent pool in bytes'),
    
  maxAgentMemory: Joi.number()
    .integer()
    .min(10 * 1024 * 1024) // 10MB minimum per agent
    .required()
    .description('Maximum memory per individual agent in bytes'),
    
  warningThreshold: Joi.number()
    .min(0.1)
    .max(1.0)
    .default(0.7)
    .description('Memory usage percentage for warnings (0-1)'),
    
  criticalThreshold: Joi.number()
    .min(0.1)
    .max(1.0)
    .default(0.85)
    .description('Memory usage percentage for critical alerts (0-1)'),
    
  cleanupThreshold: Joi.number()
    .min(0.1)
    .max(1.0)
    .default(0.9)
    .description('Memory usage percentage to trigger cleanup (0-1)'),
    
  measurementInterval: Joi.number()
    .integer()
    .min(1000)
    .max(60000)
    .default(5000)
    .description('Memory measurement interval in milliseconds'),
    
  enforcementMode: Joi.string()
    .valid('strict', 'advisory')
    .default('strict')
    .description('How to handle memory limit violations')
}).custom((value, helpers) => {
  // Cross-field validation
  if (value.maxAgentMemory > value.maxPoolMemory) {
    return helpers.error('maxAgentMemory cannot exceed maxPoolMemory');
  }
  
  if (value.warningThreshold >= value.criticalThreshold) {
    return helpers.error('warningThreshold must be less than criticalThreshold');
  }
  
  if (value.criticalThreshold >= value.cleanupThreshold) {
    return helpers.error('criticalThreshold must be less than cleanupThreshold');
  }
  
  return value;
});

export interface MemoryLimits extends Joi.extractType<typeof MemoryLimitsSchema> {}
```

## Validation Criteria

1. **Schema Structure**
   - [ ] All required memory limit fields are defined
   - [ ] Field types and constraints are properly specified
   - [ ] Cross-field validation rules are implemented
   - [ ] Default values are reasonable for production use

2. **Validation Logic**
   - [ ] Memory values have appropriate minimum/maximum bounds
   - [ ] Threshold values maintain proper ordering (warning < critical < cleanup)
   - [ ] Measurement interval is within acceptable range
   - [ ] Enforcement mode accepts only valid enum values

3. **Integration**
   - [ ] Schema integrates with Joi validation framework
   - [ ] TypeScript interfaces are properly exported
   - [ ] Schema can be imported by configuration loader
   - [ ] Error messages are clear and actionable

## Unit Tests Required

```typescript
describe('MemoryLimitsSchema', () => {
  it('should validate valid memory limits configuration', () => {
    const validConfig = {
      maxPoolMemory: 1024 * 1024 * 1024, // 1GB
      maxAgentMemory: 256 * 1024 * 1024, // 256MB
      warningThreshold: 0.7,
      criticalThreshold: 0.85,
      cleanupThreshold: 0.9,
      measurementInterval: 5000,
      enforcementMode: 'strict'
    };
    
    const result = MemoryLimitsSchema.validate(validConfig);
    expect(result.error).toBeUndefined();
    expect(result.value).toEqual(validConfig);
  });
  
  it('should reject maxAgentMemory greater than maxPoolMemory', () => {
    const invalidConfig = {
      maxPoolMemory: 512 * 1024 * 1024, // 512MB
      maxAgentMemory: 1024 * 1024 * 1024, // 1GB - exceeds pool limit
    };
    
    const result = MemoryLimitsSchema.validate(invalidConfig);
    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('maxAgentMemory cannot exceed maxPoolMemory');
  });
  
  it('should reject invalid threshold ordering', () => {
    const invalidConfig = {
      maxPoolMemory: 1024 * 1024 * 1024,
      maxAgentMemory: 256 * 1024 * 1024,
      warningThreshold: 0.9,
      criticalThreshold: 0.8, // Less than warning
      cleanupThreshold: 0.95
    };
    
    const result = MemoryLimitsSchema.validate(invalidConfig);
    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('warningThreshold must be less than criticalThreshold');
  });
  
  it('should apply default values when not specified', () => {
    const minimalConfig = {
      maxPoolMemory: 1024 * 1024 * 1024,
      maxAgentMemory: 256 * 1024 * 1024
    };
    
    const result = MemoryLimitsSchema.validate(minimalConfig);
    expect(result.error).toBeUndefined();
    expect(result.value.warningThreshold).toBe(0.7);
    expect(result.value.enforcementMode).toBe('strict');
  });
});
```

## Dependencies

- Joi validation library for schema definition
- TypeScript for type safety and interfaces
- Node.js process memory APIs for validation bounds
- Configuration management system integration

## Notes

- Memory values are specified in bytes for precision
- Thresholds use decimal percentages (0-1) for clarity
- Schema supports both strict and advisory enforcement modes
- Cross-field validation ensures logical consistency
- Default values are production-ready and conservative