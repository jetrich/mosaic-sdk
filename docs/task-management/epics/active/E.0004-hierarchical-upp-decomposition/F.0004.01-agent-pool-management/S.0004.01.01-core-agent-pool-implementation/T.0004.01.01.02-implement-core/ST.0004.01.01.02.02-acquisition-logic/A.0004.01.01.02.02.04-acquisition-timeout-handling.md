# Atomic Task: Acquisition Timeout Handling

**Task ID**: A.0004.01.01.02.02.04  
**Parent**: ST.0004.01.01.02.02 - Agent Acquisition Logic  
**Type**: Implementation  
**Estimate**: 2.5 hours

## Task Description

Implement robust timeout handling for agent acquisition requests, including configurable timeout policies, graceful degradation, and proper cleanup of timed-out requests.

## Implementation Requirements

### Timeout Scenarios
- **Request Timeout**: Maximum time to wait for agent availability
- **Acquisition Timeout**: Maximum time for actual agent allocation
- **Queue Timeout**: Maximum time waiting in acquisition queue
- **Health Check Timeout**: Maximum time for agent readiness verification

### Timeout Policies
1. **Immediate Failure**: Fail fast when no agents available
2. **Queue with Timeout**: Wait in queue with maximum wait time
3. **Retry with Backoff**: Retry acquisition with exponential backoff
4. **Fallback Selection**: Try alternative agent types on timeout

### Cleanup Requirements
- Cancel pending acquisitions on timeout
- Release reserved resources
- Update metrics and logging
- Notify waiting clients appropriately

## Code Implementation

```typescript
// packages/mcp-orchestrator/src/services/AcquisitionTimeoutManager.ts

interface TimeoutConfig {
  requestTimeout: number;        // Max time for entire request
  acquisitionTimeout: number;    // Max time for agent allocation
  queueTimeout: number;         // Max time waiting in queue
  healthCheckTimeout: number;   // Max time for readiness check
  retryAttempts: number;        // Max retry attempts
  retryBackoffMs: number;       // Base backoff time between retries
}

interface AcquisitionRequest {
  id: string;
  type: string;
  options?: AcquireOptions;
  startTime: number;
  timeoutConfig: TimeoutConfig;
  resolve: (agent: Agent) => void;
  reject: (error: Error) => void;
  timeouts: NodeJS.Timeout[];
  retryCount: number;
}

class AcquisitionTimeoutManager {
  private activeRequests = new Map<string, AcquisitionRequest>();
  private defaultConfig: TimeoutConfig = {
    requestTimeout: 30000,       // 30 seconds
    acquisitionTimeout: 10000,   // 10 seconds
    queueTimeout: 20000,         // 20 seconds
    healthCheckTimeout: 5000,    // 5 seconds
    retryAttempts: 3,
    retryBackoffMs: 1000
  };

  constructor(
    private agentPool: AgentPool,
    private logger: Logger,
    private metricsCollector: MetricsCollector
  ) {}

  async acquireWithTimeout(
    type: string,
    options?: AcquireOptions & { timeoutConfig?: Partial<TimeoutConfig> }
  ): Promise<Agent> {
    const requestId = this.generateRequestId();
    const config = { ...this.defaultConfig, ...options?.timeoutConfig };
    
    return new Promise<Agent>((resolve, reject) => {
      const request: AcquisitionRequest = {
        id: requestId,
        type,
        options,
        startTime: Date.now(),
        timeoutConfig: config,
        resolve,
        reject,
        timeouts: [],
        retryCount: 0
      };

      this.activeRequests.set(requestId, request);
      this.startAcquisitionWithTimeout(request);
    });
  }

  private async startAcquisitionWithTimeout(request: AcquisitionRequest): Promise<void> {
    // Set overall request timeout
    const requestTimeout = setTimeout(() => {
      this.handleRequestTimeout(request);
    }, request.timeoutConfig.requestTimeout);

    request.timeouts.push(requestTimeout);

    try {
      await this.attemptAcquisition(request);
    } catch (error) {
      this.handleAcquisitionError(request, error);
    }
  }

  private async attemptAcquisition(request: AcquisitionRequest): Promise<void> {
    this.logger.debug('Starting acquisition attempt', {
      requestId: request.id,
      attempt: request.retryCount + 1,
      type: request.type
    });

    // Set acquisition timeout
    const acquisitionTimeout = setTimeout(() => {
      this.handleAcquisitionTimeout(request);
    }, request.timeoutConfig.acquisitionTimeout);

    request.timeouts.push(acquisitionTimeout);

    try {
      // Check immediate availability
      const immediateAgent = await this.tryImmediateAcquisition(request);
      if (immediateAgent) {
        this.completeAcquisition(request, immediateAgent);
        return;
      }

      // Queue for future availability
      await this.queueAcquisitionRequest(request);
      
    } catch (error) {
      this.clearTimeouts(request);
      throw error;
    }
  }

  private async tryImmediateAcquisition(request: AcquisitionRequest): Promise<Agent | null> {
    try {
      return await Promise.race([
        this.agentPool.tryAcquireImmediate(request.type, request.options),
        this.createTimeoutPromise(request.timeoutConfig.acquisitionTimeout)
      ]);
    } catch (error) {
      if (error.message === 'ACQUISITION_TIMEOUT') {
        return null; // Will proceed to queuing
      }
      throw error;
    }
  }

  private async queueAcquisitionRequest(request: AcquisitionRequest): Promise<void> {
    const queueTimeout = setTimeout(() => {
      this.handleQueueTimeout(request);
    }, request.timeoutConfig.queueTimeout);

    request.timeouts.push(queueTimeout);

    // Listen for agent availability
    const unsubscribe = this.agentPool.onAgentAvailable(request.type, async (agent: Agent) => {
      try {
        // Verify agent is still suitable
        if (await this.verifyAgentReadiness(agent, request)) {
          unsubscribe();
          this.completeAcquisition(request, agent);
        }
      } catch (error) {
        this.logger.warn('Agent readiness check failed during queued acquisition', {
          requestId: request.id,
          agentId: agent.id,
          error: error.message
        });
      }
    });

    // Store unsubscribe function for cleanup
    request.timeouts.push(unsubscribe as any);
  }

  private async verifyAgentReadiness(agent: Agent, request: AcquisitionRequest): Promise<boolean> {
    try {
      return await Promise.race([
        agent.isReady(),
        this.createTimeoutPromise(request.timeoutConfig.healthCheckTimeout, 'HEALTH_CHECK_TIMEOUT')
      ]);
    } catch (error) {
      if (error.message === 'HEALTH_CHECK_TIMEOUT') {
        this.logger.warn('Agent health check timed out', {
          requestId: request.id,
          agentId: agent.id,
          timeout: request.timeoutConfig.healthCheckTimeout
        });
        return false;
      }
      throw error;
    }
  }

  private handleRequestTimeout(request: AcquisitionRequest): void {
    this.logger.warn('Agent acquisition request timed out', {
      requestId: request.id,
      type: request.type,
      totalTime: Date.now() - request.startTime,
      timeout: request.timeoutConfig.requestTimeout
    });

    this.failAcquisition(request, new Error(
      `Agent acquisition timed out after ${request.timeoutConfig.requestTimeout}ms`
    ));
  }

  private handleAcquisitionTimeout(request: AcquisitionRequest): void {
    this.logger.debug('Acquisition timeout, attempting retry or queuing', {
      requestId: request.id,
      attempt: request.retryCount + 1
    });

    if (request.retryCount < request.timeoutConfig.retryAttempts) {
      this.retryAcquisition(request);
    } else {
      this.failAcquisition(request, new Error(
        `Agent acquisition failed after ${request.retryCount + 1} attempts`
      ));
    }
  }

  private handleQueueTimeout(request: AcquisitionRequest): void {
    this.logger.warn('Queue timeout exceeded', {
      requestId: request.id,
      queueTime: request.timeoutConfig.queueTimeout
    });

    if (request.retryCount < request.timeoutConfig.retryAttempts) {
      this.retryAcquisition(request);
    } else {
      this.failAcquisition(request, new Error(
        `No agents became available within queue timeout of ${request.timeoutConfig.queueTimeout}ms`
      ));
    }
  }

  private async retryAcquisition(request: AcquisitionRequest): Promise<void> {
    request.retryCount++;
    this.clearTimeouts(request);

    const backoffTime = request.timeoutConfig.retryBackoffMs * Math.pow(2, request.retryCount - 1);
    
    this.logger.debug('Retrying acquisition with backoff', {
      requestId: request.id,
      attempt: request.retryCount + 1,
      backoffMs: backoffTime
    });

    setTimeout(() => {
      this.attemptAcquisition(request).catch(error => {
        this.handleAcquisitionError(request, error);
      });
    }, backoffTime);
  }

  private completeAcquisition(request: AcquisitionRequest, agent: Agent): void {
    const totalTime = Date.now() - request.startTime;
    
    this.logger.info('Agent acquisition completed', {
      requestId: request.id,
      agentId: agent.id,
      totalTime,
      attempts: request.retryCount + 1
    });

    this.metricsCollector.recordAcquisitionSuccess(totalTime, request.retryCount + 1);
    this.clearTimeouts(request);
    this.activeRequests.delete(request.id);
    
    request.resolve(agent);
  }

  private failAcquisition(request: AcquisitionRequest, error: Error): void {
    const totalTime = Date.now() - request.startTime;
    
    this.logger.error('Agent acquisition failed', {
      requestId: request.id,
      error: error.message,
      totalTime,
      attempts: request.retryCount + 1
    });

    this.metricsCollector.recordAcquisitionFailure(totalTime, request.retryCount + 1, error.message);
    this.clearTimeouts(request);
    this.activeRequests.delete(request.id);
    
    request.reject(error);
  }

  private handleAcquisitionError(request: AcquisitionRequest, error: any): void {
    this.logger.error('Acquisition error occurred', {
      requestId: request.id,
      error: error.message,
      attempt: request.retryCount + 1
    });

    this.failAcquisition(request, error);
  }

  private clearTimeouts(request: AcquisitionRequest): void {
    request.timeouts.forEach(timeout => {
      if (typeof timeout === 'function') {
        timeout(); // Unsubscribe function
      } else {
        clearTimeout(timeout);
      }
    });
    request.timeouts = [];
  }

  private createTimeoutPromise(timeoutMs: number, errorMessage = 'ACQUISITION_TIMEOUT'): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });
  }

  private generateRequestId(): string {
    return `acq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup method for graceful shutdown
  cleanup(): void {
    this.logger.info('Cleaning up active acquisition requests', {
      activeCount: this.activeRequests.size
    });

    for (const request of this.activeRequests.values()) {
      this.failAcquisition(request, new Error('System shutdown'));
    }
    
    this.activeRequests.clear();
  }
}
```

## Validation Criteria

1. **Timeout Enforcement**
   - All timeout configurations are respected accurately
   - Requests fail appropriately when timeouts are exceeded
   - Cleanup occurs properly for timed-out requests

2. **Retry Logic**
   - Exponential backoff is implemented correctly
   - Retry attempts respect configured limits
   - Failed retries don't leak resources

3. **Resource Management**
   - All timeouts and listeners are properly cleaned up
   - No memory leaks from abandoned requests
   - Graceful handling of system shutdown

4. **Error Handling**
   - Appropriate error messages for different timeout scenarios
   - Proper logging for debugging timeout issues
   - Metrics collection for monitoring timeout patterns

5. **Performance**
   - Timeout handling doesn't significantly impact acquisition performance
   - Concurrent timeout management scales appropriately
   - Resource usage remains bounded under load

## Unit Tests Required

```typescript
describe('AcquisitionTimeoutManager.acquireWithTimeout', () => {
  it('should complete acquisition within timeout', async () => {
    const mockAgent = createMockAgent('test-agent');
    agentPool.tryAcquireImmediate.mockResolvedValue(mockAgent);

    const result = await timeoutManager.acquireWithTimeout('general-purpose');
    
    expect(result).toBe(mockAgent);
  });

  it('should timeout request after configured time', async () => {
    agentPool.tryAcquireImmediate.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 2000))
    );

    await expect(
      timeoutManager.acquireWithTimeout('general-purpose', {
        timeoutConfig: { requestTimeout: 1000 }
      })
    ).rejects.toThrow('Agent acquisition timed out after 1000ms');
  });

  it('should retry with exponential backoff', async () => {
    agentPool.tryAcquireImmediate
      .mockRejectedValueOnce(new Error('No agents available'))
      .mockRejectedValueOnce(new Error('No agents available'))
      .mockResolvedValue(createMockAgent('test-agent'));

    const startTime = Date.now();
    const result = await timeoutManager.acquireWithTimeout('general-purpose', {
      timeoutConfig: { retryAttempts: 3, retryBackoffMs: 100 }
    });

    const totalTime = Date.now() - startTime;
    expect(result).toBeDefined();
    expect(totalTime).toBeGreaterThan(300); // Should include backoff delays
  });

  it('should clean up resources on timeout', async () => {
    const request = timeoutManager.acquireWithTimeout('general-purpose', {
      timeoutConfig: { requestTimeout: 100 }
    });

    await expect(request).rejects.toThrow();
    
    // Verify cleanup occurred
    expect(timeoutManager.activeRequests.size).toBe(0);
  });

  it('should handle queue timeout appropriately', async () => {
    agentPool.tryAcquireImmediate.mockResolvedValue(null);
    
    const queuePromise = timeoutManager.acquireWithTimeout('specialized-type', {
      timeoutConfig: { queueTimeout: 500, retryAttempts: 0 }
    });

    await expect(queuePromise).rejects.toThrow('No agents became available within queue timeout');
  });
});
```

## Dependencies

- AgentPool for immediate acquisition and availability notifications
- Logger for timeout event tracking
- MetricsCollector for timeout performance monitoring
- Node.js timeout primitives (setTimeout, clearTimeout)

## Notes

- Timeout handling is critical for preventing resource exhaustion in high-load scenarios
- Proper cleanup prevents memory leaks from abandoned acquisition requests
- Configurable timeouts allow adaptation to different deployment environments
- Retry logic with backoff helps handle temporary resource unavailability