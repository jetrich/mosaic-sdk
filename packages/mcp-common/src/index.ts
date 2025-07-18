/**
 * @fileoverview Main entry point for @mosaic/mcp-common package
 * @module @mosaic/mcp-common
 */

// Export base classes
export { MCPServiceTool } from './base/MCPServiceTool.js';

// Export authentication
export { AuthManager } from './auth/AuthManager.js';

// Export utilities
export { Logger } from './utils/Logger.js';
export { CircuitBreaker, CircuitBreakerState, type CircuitBreakerConfig, type CircuitBreakerMetrics } from './utils/CircuitBreaker.js';

// Export types
export * from './types/index.js';

// Export schemas for runtime validation
export { schemas } from './types/index.js';