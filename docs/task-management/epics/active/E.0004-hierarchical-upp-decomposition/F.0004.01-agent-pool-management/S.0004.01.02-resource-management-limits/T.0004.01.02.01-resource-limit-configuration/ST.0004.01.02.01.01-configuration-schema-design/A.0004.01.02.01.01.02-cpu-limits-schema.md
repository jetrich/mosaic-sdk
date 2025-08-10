# Atomic Task: CPU Limits Schema Design

**Task ID**: A.0004.01.02.01.01.02  
**Parent**: ST.0004.01.02.01.01 - Configuration Schema Design  
**Type**: Design  
**Estimate**: 2 hours

## Task Description

Design CPU usage limits configuration schema for agent pools, defining constraints and monitoring rules for CPU resource management.

## Implementation Requirements

### Schema Structure
```typescript
interface CPULimits {
  maxPoolCPUPercent: number;       // Maximum CPU usage for entire pool (0-100)
  maxAgentCPUPercent: number;      // Maximum CPU per agent (0-100)
  cpuAffinityMask?: number[];      // CPU cores to restrict agents to
  throttleThreshold: number;       // CPU usage to start throttling (0-100)
  killThreshold: number;           // CPU usage to terminate agent (0-100)
  measurementWindow: number;       // CPU measurement window (milliseconds)
  samplingInterval: number;        // How often to measure CPU (milliseconds)
  enforcementAction: 'throttle' | 'kill' | 'warn';
}
```

## Code Implementation

```typescript
// packages/mcp-orchestrator/src/config/schemas/CPULimitsSchema.ts

import Joi from 'joi';

export const CPULimitsSchema = Joi.object({
  maxPoolCPUPercent: Joi.number()
    .min(1)
    .max(100)
    .default(80)
    .description('Maximum CPU usage percentage for entire agent pool'),
    
  maxAgentCPUPercent: Joi.number()
    .min(1)
    .max(100)
    .default(25)
    .description('Maximum CPU usage percentage per agent'),
    
  cpuAffinityMask: Joi.array()
    .items(Joi.number().integer().min(0).max(63))
    .optional()
    .description('CPU core indices to restrict agents to'),
    
  throttleThreshold: Joi.number()
    .min(1)
    .max(100)
    .default(70)
    .description('CPU usage percentage to start throttling'),
    
  killThreshold: Joi.number()
    .min(1)
    .max(100)
    .default(95)
    .description('CPU usage percentage to terminate agent'),
    
  measurementWindow: Joi.number()
    .integer()
    .min(1000)
    .max(60000)
    .default(10000)
    .description('CPU measurement window in milliseconds'),
    
  samplingInterval: Joi.number()
    .integer()
    .min(100)
    .max(10000)
    .default(1000)
    .description('CPU sampling interval in milliseconds'),
    
  enforcementAction: Joi.string()
    .valid('throttle', 'kill', 'warn')
    .default('throttle')
    .description('Action to take when CPU limits are exceeded')
}).custom((value, helpers) => {
  if (value.throttleThreshold >= value.killThreshold) {
    return helpers.error('throttleThreshold must be less than killThreshold');
  }
  
  if (value.maxAgentCPUPercent * 4 > value.maxPoolCPUPercent) {
    return helpers.error('Agent CPU limits may exceed pool limits with concurrent agents');
  }
  
  return value;
});

export interface CPULimits extends Joi.extractType<typeof CPULimitsSchema> {}
```

## Validation Criteria

1. **CPU Percentage Bounds**
   - [ ] All CPU percentages are between 1-100
   - [ ] Default values are production-appropriate
   - [ ] Threshold ordering is logical (throttle < kill)

2. **CPU Affinity Support**
   - [ ] CPU core indices are valid (0-63 range)
   - [ ] Affinity mask is optional for flexibility
   - [ ] Invalid core indices are rejected

3. **Timing Configuration**
   - [ ] Measurement windows are reasonable (1-60 seconds)
   - [ ] Sampling intervals support responsive monitoring
   - [ ] Values prevent excessive system overhead

## Unit Tests Required

```typescript
describe('CPULimitsSchema', () => {
  it('should validate standard CPU limits', () => {
    const config = {
      maxPoolCPUPercent: 80,
      maxAgentCPUPercent: 20,
      throttleThreshold: 60,
      killThreshold: 90
    };
    
    const result = CPULimitsSchema.validate(config);
    expect(result.error).toBeUndefined();
  });
  
  it('should reject invalid threshold ordering', () => {
    const config = {
      throttleThreshold: 90,
      killThreshold: 80  // Lower than throttle
    };
    
    const result = CPULimitsSchema.validate(config);
    expect(result.error.message).toContain('throttleThreshold must be less than killThreshold');
  });
});
```

## Dependencies

- OS CPU monitoring APIs
- Process CPU usage measurement tools
- CPU affinity system calls (Linux/Windows)

## Notes

- CPU percentages are per-core normalized (100% = 1 full core)
- Affinity masking is platform-dependent
- Enforcement actions provide graduated response to CPU overuse