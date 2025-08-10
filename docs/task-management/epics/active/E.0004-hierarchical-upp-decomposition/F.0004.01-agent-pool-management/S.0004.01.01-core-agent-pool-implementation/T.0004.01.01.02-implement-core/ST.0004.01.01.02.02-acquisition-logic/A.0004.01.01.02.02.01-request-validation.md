# Atomic Task: Request Validation

**Task ID**: A.0004.01.01.02.02.01  
**Parent**: ST.0004.01.01.02.02 - Agent Acquisition Logic  
**Type**: Implementation  
**Estimate**: 2 hours

## Task Description

Implement comprehensive request validation for agent acquisition, ensuring all parameters are valid and the requesting entity has proper authorization before proceeding with agent allocation.

## Implementation Requirements

### Input Parameters
- `type`: string - Agent type identifier (e.g., 'general-purpose', 'feature-specialist')
- `options?`: AcquireOptions - Optional configuration object
  - `priority`: Priority enum (HIGH, NORMAL, LOW)
  - `timeout`: number - Maximum wait time in milliseconds
  - `metadata`: Record<string, any> - Additional context for the agent

### Validation Steps
1. **Agent Type Validation**
   - Check if agent type exists in registered agent types
   - Validate agent type is not deprecated or disabled
   - Ensure agent type supports current system version

2. **Options Validation**
   - Validate priority is a valid enum value
   - Check timeout is within acceptable range (1000ms - 300000ms)
   - Validate metadata object structure and size limits

3. **Authorization Check**
   - Verify requesting entity has permission to acquire agents
   - Check if user/system is within their agent quota
   - Validate request source and authentication token

4. **Request Logging**
   - Log acquisition request with timestamp and metadata
   - Include requesting entity, agent type, and options
   - Generate unique request ID for tracking

## Code Implementation

```typescript
// packages/mcp-orchestrator/src/services/AgentPoolManager.ts

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  requestId: string;
}

class RequestValidator {
  constructor(
    private agentRegistry: AgentTypeRegistry,
    private authManager: AuthManager,
    private logger: Logger
  ) {}

  async validateAcquisitionRequest(
    type: string, 
    options?: AcquireOptions,
    requestContext?: RequestContext
  ): Promise<ValidationResult> {
    const requestId = generateRequestId();
    const errors: string[] = [];
    
    try {
      // 1. Agent type validation
      if (!type || typeof type !== 'string') {
        errors.push('Agent type must be a non-empty string');
      } else if (!this.agentRegistry.hasType(type)) {
        errors.push(`Unknown agent type: ${type}`);
      } else if (this.agentRegistry.isDeprecated(type)) {
        errors.push(`Agent type ${type} is deprecated`);
      }
      
      // 2. Options validation
      if (options) {
        if (options.priority && !Object.values(Priority).includes(options.priority)) {
          errors.push(`Invalid priority: ${options.priority}`);
        }
        
        if (options.timeout) {
          if (typeof options.timeout !== 'number' || options.timeout < 1000 || options.timeout > 300000) {
            errors.push('Timeout must be between 1000ms and 300000ms');
          }
        }
        
        if (options.metadata) {
          const metadataSize = JSON.stringify(options.metadata).length;
          if (metadataSize > 10000) {
            errors.push('Metadata size exceeds 10KB limit');
          }
        }
      }
      
      // 3. Authorization check
      if (requestContext) {
        const authResult = await this.authManager.checkAgentAcquisitionPermission(
          requestContext.userId,
          type,
          options
        );
        
        if (!authResult.authorized) {
          errors.push(`Authorization failed: ${authResult.reason}`);
        }
      }
      
      // 4. Log request
      this.logger.info('Agent acquisition request validation', {
        requestId,
        type,
        options,
        requestContext: requestContext?.userId,
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      });
      
      return {
        isValid: errors.length === 0,
        errors,
        requestId
      };
      
    } catch (error) {
      this.logger.error('Request validation failed', { requestId, error: error.message });
      return {
        isValid: false,
        errors: ['Internal validation error'],
        requestId
      };
    }
  }
}

// Usage in AgentPoolManager.acquire method
async acquire(type: string, options?: AcquireOptions): Promise<Agent> {
  const validation = await this.requestValidator.validateAcquisitionRequest(
    type, 
    options, 
    this.getCurrentRequestContext()
  );
  
  if (!validation.isValid) {
    throw new ValidationError(
      `Agent acquisition request invalid: ${validation.errors.join(', ')}`,
      validation.requestId
    );
  }
  
  // Continue with acquisition logic...
}
```

## Validation Criteria

1. **Agent Type Validation**
   - Rejects unknown agent types with clear error message
   - Prevents acquisition of deprecated agent types
   - Validates type string is non-empty and properly formatted

2. **Options Validation**
   - Validates priority enum values correctly
   - Enforces timeout bounds (1s - 5min)
   - Limits metadata size to prevent memory issues

3. **Authorization**
   - Verifies user permissions for agent acquisition
   - Checks agent quota limits per user/system
   - Validates authentication tokens and request source

4. **Error Handling**
   - Provides specific, actionable error messages
   - Logs all validation attempts for debugging
   - Returns structured validation results

5. **Performance**
   - Validation completes in <100ms under normal load
   - Handles concurrent validation requests safely
   - Minimal memory allocation during validation

## Unit Tests Required

```typescript
describe('RequestValidator.validateAcquisitionRequest', () => {
  it('should validate valid request successfully', async () => {
    const result = await validator.validateAcquisitionRequest('general-purpose', {
      priority: Priority.NORMAL,
      timeout: 30000
    });
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.requestId).toMatch(/^req-[a-z0-9-]+$/);
  });
  
  it('should reject unknown agent type', async () => {
    const result = await validator.validateAcquisitionRequest('unknown-type');
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Unknown agent type: unknown-type');
  });
  
  it('should reject invalid timeout values', async () => {
    const result = await validator.validateAcquisitionRequest('general-purpose', {
      timeout: 500 // Below minimum
    });
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Timeout must be between 1000ms and 300000ms');
  });
  
  it('should reject oversized metadata', async () => {
    const largeMetadata = { data: 'x'.repeat(15000) };
    const result = await validator.validateAcquisitionRequest('general-purpose', {
      metadata: largeMetadata
    });
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Metadata size exceeds 10KB limit');
  });
  
  it('should handle authorization failures', async () => {
    const mockContext = { userId: 'unauthorized-user' };
    const result = await validator.validateAcquisitionRequest(
      'general-purpose', 
      undefined, 
      mockContext
    );
    
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Authorization failed'))).toBe(true);
  });
});
```

## Dependencies

- AgentTypeRegistry for agent type validation
- AuthManager for authorization checks
- Logger for request tracking and debugging
- Request ID generation utility

## Notes

- Request validation is the first line of defense against invalid agent acquisitions
- Proper error messages help developers debug integration issues quickly
- Authorization checks prevent resource abuse and maintain system security
- Comprehensive logging enables monitoring and debugging of acquisition patterns