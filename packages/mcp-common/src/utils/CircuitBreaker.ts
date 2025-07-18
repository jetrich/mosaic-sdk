/**
 * @fileoverview Circuit breaker implementation for MCP service tools
 * @module @mosaic/mcp-common/utils
 */

import { Logger } from './Logger.js';
import winston from 'winston';

export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open',
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  expectedErrorCodes?: string[];
}

export interface CircuitBreakerMetrics {
  totalRequests: number;
  failedRequests: number;
  successfulRequests: number;
  timeouts: number;
  lastFailureTime: Date | null;
  lastSuccessTime: Date | null;
  state: CircuitBreakerState;
  failureRate: number;
}

/**
 * Circuit breaker implementation to protect against cascading failures
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private lastFailureTime: Date | null = null;
  private lastSuccessTime: Date | null = null;
  private metrics: CircuitBreakerMetrics;
  private logger: winston.Logger;

  constructor(private config: CircuitBreakerConfig) {
    this.logger = Logger.getLogger('circuit-breaker');
    this.metrics = {
      totalRequests: 0,
      failedRequests: 0,
      successfulRequests: 0,
      timeouts: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      state: this.state,
      failureRate: 0,
    };

    this.logger.info('Circuit breaker initialized', {
      failureThreshold: config.failureThreshold,
      recoveryTimeout: config.recoveryTimeout,
      monitoringPeriod: config.monitoringPeriod,
    });
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.metrics.totalRequests++;

    // Check if circuit is open
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptRecovery()) {
        this.state = CircuitBreakerState.HALF_OPEN;
        this.logger.info('Circuit breaker transitioning to half-open state');
      } else {
        throw new Error('Circuit breaker is open - request blocked');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.metrics.successfulRequests++;
    this.lastSuccessTime = new Date();
    this.metrics.lastSuccessTime = this.lastSuccessTime;

    if (this.state === CircuitBreakerState.HALF_OPEN) {
      // Reset to closed state after successful operation in half-open
      this.state = CircuitBreakerState.CLOSED;
      this.failureCount = 0;
      this.logger.info('Circuit breaker reset to closed state after successful recovery');
    }

    this.updateMetrics();
  }

  /**
   * Handle failed operation
   */
  private onFailure(error: any): void {
    this.metrics.failedRequests++;
    this.failureCount++;
    this.lastFailureTime = new Date();
    this.metrics.lastFailureTime = this.lastFailureTime;

    // Check if error should trip the circuit breaker
    if (this.shouldTripCircuit(error)) {
      this.logger.warn('Circuit breaker failure recorded', {
        failureCount: this.failureCount,
        threshold: this.config.failureThreshold,
        error: error instanceof Error ? error.message : String(error),
      });

      if (this.failureCount >= this.config.failureThreshold) {
        this.tripCircuit();
      }
    }

    this.updateMetrics();
  }

  /**
   * Trip the circuit breaker to open state
   */
  private tripCircuit(): void {
    this.state = CircuitBreakerState.OPEN;
    this.logger.error('Circuit breaker tripped to open state', {
      failureCount: this.failureCount,
      threshold: this.config.failureThreshold,
      recoveryTimeout: this.config.recoveryTimeout,
    });
  }

  /**
   * Check if we should attempt recovery (transition from open to half-open)
   */
  private shouldAttemptRecovery(): boolean {
    if (!this.lastFailureTime) {
      return false;
    }

    const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceLastFailure >= this.config.recoveryTimeout;
  }

  /**
   * Check if error should trip the circuit breaker
   */
  private shouldTripCircuit(error: any): boolean {
    // Don't trip for expected error codes
    if (this.config.expectedErrorCodes) {
      const errorCode = this.extractErrorCode(error);
      if (errorCode && this.config.expectedErrorCodes.includes(errorCode)) {
        return false;
      }
    }

    // Don't trip for client errors (4xx) - these are not service failures
    if (error?.status && error.status >= 400 && error.status < 500) {
      return false;
    }

    return true;
  }

  /**
   * Extract error code from error object
   */
  private extractErrorCode(error: any): string | null {
    if (error?.code) return error.code;
    if (error?.status) return error.status.toString();
    if (error?.response?.status) return error.response.status.toString();
    return null;
  }

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    this.metrics.state = this.state;
    this.metrics.failureRate =
      this.metrics.totalRequests > 0
        ? this.metrics.failedRequests / this.metrics.totalRequests
        : 0;
  }

  /**
   * Get current state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Get current metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return { ...this.metrics };
  }

  /**
   * Check if circuit breaker is healthy
   */
  isHealthy(): boolean {
    return this.state === CircuitBreakerState.CLOSED;
  }

  /**
   * Check if requests are being blocked
   */
  isBlocking(): boolean {
    return this.state === CircuitBreakerState.OPEN;
  }

  /**
   * Force reset the circuit breaker
   */
  reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.logger.info('Circuit breaker manually reset');
    this.updateMetrics();
  }

  /**
   * Force trip the circuit breaker
   */
  forceTrip(): void {
    this.state = CircuitBreakerState.OPEN;
    this.lastFailureTime = new Date();
    this.logger.warn('Circuit breaker manually tripped');
    this.updateMetrics();
  }

  /**
   * Get health status for monitoring
   */
  getHealthStatus(): {
    healthy: boolean;
    state: CircuitBreakerState;
    failureRate: number;
    consecutiveFailures: number;
    timeSinceLastFailure: number | null;
    timeSinceLastSuccess: number | null;
  } {
    const now = Date.now();

    return {
      healthy: this.isHealthy(),
      state: this.state,
      failureRate: this.metrics.failureRate,
      consecutiveFailures: this.failureCount,
      timeSinceLastFailure: this.lastFailureTime
        ? now - this.lastFailureTime.getTime()
        : null,
      timeSinceLastSuccess: this.lastSuccessTime
        ? now - this.lastSuccessTime.getTime()
        : null,
    };
  }

  /**
   * Start monitoring and periodic cleanup
   */
  startMonitoring(): void {
    setInterval(() => {
      this.cleanupOldMetrics();
      this.logMetrics();
    }, this.config.monitoringPeriod);
  }

  /**
   * Cleanup old metrics (reset counters periodically)
   */
  private cleanupOldMetrics(): void {
    const now = Date.now();
    const cleanupThreshold = this.config.monitoringPeriod * 2;

    // Reset metrics if last activity was too long ago
    if (
      this.lastFailureTime &&
      now - this.lastFailureTime.getTime() > cleanupThreshold &&
      this.lastSuccessTime &&
      now - this.lastSuccessTime.getTime() > cleanupThreshold
    ) {
      this.metrics.totalRequests = 0;
      this.metrics.failedRequests = 0;
      this.metrics.successfulRequests = 0;
      this.updateMetrics();
    }
  }

  /**
   * Log current metrics
   */
  private logMetrics(): void {
    if (this.metrics.totalRequests === 0) {
      return; // No activity to log
    }

    this.logger.debug('Circuit breaker metrics', {
      state: this.state,
      totalRequests: this.metrics.totalRequests,
      failureRate: this.metrics.failureRate,
      consecutiveFailures: this.failureCount,
    });
  }
}