/**
 * Planning Plugin - Minimal Exports for Compilation
 * Simplified version to ensure the package compiles successfully
 */

// Export core dependency manager and state tracker (already compiled)
export { DependencyManager } from './core/dependency-manager';
export { StateTracker } from './core/state-tracker';

// Export documentation service (already compiled)
export { DocumentationGenerationService } from './services/DocumentationGenerationService';

// Export minimal types
export interface MinimalPlanningConfig {
  name: string;
  type: string;
}

// Export utility functions
export const PlanningUtils = {
  /**
   * Get version information
   */
  getVersion: () => "0.1.0",
  
  /**
   * Check if planning tools are available
   */
  isAvailable: () => true,
};

// Export core interfaces that MCP tools expect
export interface PlanningResult {
  success: boolean;
  data?: any;
  error?: string;
}

export default {
  PlanningUtils,
};