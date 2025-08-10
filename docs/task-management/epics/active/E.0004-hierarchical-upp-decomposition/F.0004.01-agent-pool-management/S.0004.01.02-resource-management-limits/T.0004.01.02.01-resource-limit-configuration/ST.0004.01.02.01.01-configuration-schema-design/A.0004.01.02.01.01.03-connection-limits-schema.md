# Atomic Task: Connection Limits Schema Design

**Task ID**: A.0004.01.02.01.01.03  
**Parent**: ST.0004.01.02.01.01 - Configuration Schema Design  
**Type**: Design  
**Estimate**: 2 hours

## Task Description

Design connection limits configuration schema for agent pool network resource management, controlling concurrent connections and preventing resource exhaustion.

## Implementation Requirements

### Schema Structure
```typescript
interface ConnectionLimits {
  maxConcurrentConnections: number;    // Total connections across all agents
  maxConnectionsPerAgent: number;      // Connections per individual agent
  maxConnectionsPerHost: number;       // Connections to single external host
  connectionTimeout: number;           // Connection establishment timeout (ms)
  idleTimeout: number;                // Idle connection timeout (ms)
  retryAttempts: number;              // Connection retry attempts
  retryDelay: number;                 // Delay between retries (ms)
  keepAliveEnabled: boolean;          // Enable connection keep-alive
  poolingEnabled: boolean;            // Enable connection pooling
  dnsCacheTimeout: number;            // DNS resolution cache timeout (ms)
}
```

## Code Implementation

```typescript
// packages/mcp-orchestrator/src/config/schemas/ConnectionLimitsSchema.ts

import Joi from 'joi';

export const ConnectionLimitsSchema = Joi.object({
  maxConcurrentConnections: Joi.number()
    .integer()
    .min(1)
    .max(10000)
    .default(100)
    .description('Maximum concurrent connections across all agents'),
    
  maxConnectionsPerAgent: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .default(20)
    .description('Maximum connections per individual agent'),
    
  maxConnectionsPerHost: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .description('Maximum connections to single external host'),
    
  connectionTimeout: Joi.number()
    .integer()
    .min(1000)
    .max(60000)
    .default(10000)
    .description('Connection establishment timeout in milliseconds'),
    
  idleTimeout: Joi.number()
    .integer()
    .min(5000)
    .max(300000)
    .default(30000)
    .description('Idle connection timeout in milliseconds'),
    
  retryAttempts: Joi.number()
    .integer()
    .min(0)
    .max(10)
    .default(3)
    .description('Number of connection retry attempts'),
    
  retryDelay: Joi.number()
    .integer()
    .min(100)
    .max(30000)
    .default(1000)
    .description('Delay between retry attempts in milliseconds'),
    
  keepAliveEnabled: Joi.boolean()
    .default(true)
    .description('Enable HTTP keep-alive for connections'),
    
  poolingEnabled: Joi.boolean()
    .default(true)
    .description('Enable connection pooling and reuse'),
    
  dnsCacheTimeout: Joi.number()
    .integer()
    .min(60000)
    .max(3600000)
    .default(300000)
    .description('DNS resolution cache timeout in milliseconds')
}).custom((value, helpers) => {
  // Validate that per-agent limits don't exceed total limits
  if (value.maxConnectionsPerAgent * 5 > value.maxConcurrentConnections) {
    return helpers.message('Per-agent connection limits may exceed total with concurrent agents');
  }
  
  // Ensure retry delay allows for reasonable retry windows
  if (value.retryAttempts * value.retryDelay > value.connectionTimeout) {
    return helpers.message('Total retry time exceeds connection timeout');
  }
  
  return value;
});

export interface ConnectionLimits extends Joi.extractType<typeof ConnectionLimitsSchema> {}

// Connection pool configuration
export interface ConnectionPoolConfig {
  enabled: boolean;
  maxIdleConnections: number;
  maxActiveConnections: number;
  connectionValidationQuery?: string;
  testOnBorrow: boolean;
  testOnReturn: boolean;
  testWhileIdle: boolean;
}

export const ConnectionPoolSchema = Joi.object({
  enabled: Joi.boolean().default(true),
  maxIdleConnections: Joi.number().integer().min(0).max(100).default(10),
  maxActiveConnections: Joi.number().integer().min(1).max(1000).default(50),
  connectionValidationQuery: Joi.string().optional(),
  testOnBorrow: Joi.boolean().default(true),
  testOnReturn: Joi.boolean().default(false),
  testWhileIdle: Joi.boolean().default(true)
});
```

## Validation Criteria

1. **Connection Limits Validation**
   - [ ] Concurrent connection limits are reasonable for system capacity
   - [ ] Per-agent limits prevent individual agents from monopolizing connections
   - [ ] Per-host limits prevent overwhelming external services
   - [ ] Cross-validation prevents impossible configurations

2. **Timeout Configuration**
   - [ ] Connection timeouts balance responsiveness with reliability
   - [ ] Idle timeouts prevent resource leaks
   - [ ] Retry configurations are sensible and bounded
   - [ ] DNS cache timeout balances performance with accuracy

3. **Pool Configuration**
   - [ ] Connection pooling settings optimize resource reuse
   - [ ] Keep-alive settings improve performance for repeated requests
   - [ ] Validation queries ensure connection health

## Unit Tests Required

```typescript
describe('ConnectionLimitsSchema', () => {
  it('should validate reasonable connection limits', () => {
    const config = {
      maxConcurrentConnections: 100,
      maxConnectionsPerAgent: 15,
      maxConnectionsPerHost: 5,
      connectionTimeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000
    };
    
    const result = ConnectionLimitsSchema.validate(config);
    expect(result.error).toBeUndefined();
    expect(result.value.keepAliveEnabled).toBe(true); // default
  });
  
  it('should warn about potential per-agent limit conflicts', () => {
    const config = {
      maxConcurrentConnections: 50,
      maxConnectionsPerAgent: 30  // 30 * 5 agents = 150 > 50 total
    };
    
    const result = ConnectionLimitsSchema.validate(config);
    expect(result.warning).toBeDefined();
  });
  
  it('should reject retry configuration exceeding timeout', () => {
    const config = {
      connectionTimeout: 5000,
      retryAttempts: 10,
      retryDelay: 1000  // 10 * 1000 = 10s > 5s timeout
    };
    
    const result = ConnectionLimitsSchema.validate(config);
    expect(result.error.message).toContain('Total retry time exceeds connection timeout');
  });
  
  it('should validate connection pool settings', () => {
    const poolConfig = {
      enabled: true,
      maxIdleConnections: 5,
      maxActiveConnections: 20,
      testOnBorrow: true
    };
    
    const result = ConnectionPoolSchema.validate(poolConfig);
    expect(result.error).toBeUndefined();
  });
});
```

## Dependencies

- HTTP client libraries (axios, node-fetch)
- DNS resolution libraries  
- Connection pooling libraries (generic-pool)
- Network monitoring utilities
- Operating system connection limits

## Notes

- Connection limits must respect OS-level file descriptor limits
- Pool configuration optimizes for MCP protocol characteristics
- DNS caching reduces latency for repeated agent communications
- Keep-alive settings improve efficiency for sequential thinking chains
- Retry logic handles transient network failures gracefully