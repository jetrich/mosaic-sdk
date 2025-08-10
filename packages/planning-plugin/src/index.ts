/**
 * Planning Plugin - MosAIc UPP & Tony Orchestration System
 * Enhanced with autonomous agent coordination and hierarchical task decomposition
 */

// Export legacy core components (backwards compatibility)
export { DependencyManager } from './core/dependency-manager';
export { StateTracker } from './core/state-tracker';
export { DocumentationGenerationService } from './services/DocumentationGenerationService';

// Export Tony Orchestration System (NEW)
export { TonyPlanningOrchestrator } from './core/TonyPlanningOrchestrator';
export { UPPDecomposer } from './core/UPPDecomposer';
export { AgentDeploymentManager } from './core/AgentDeploymentManager';
export { ResourceManager } from './core/ResourceManager';
export { TaskHierarchyManager } from './core/TaskHierarchyManager';

// Export logging utility
export { Logger } from './utils/Logger';

// Export UPP and orchestration types
export type {
  UPPTask,
  UPPHierarchy,
  DecompositionContext
} from './core/UPPDecomposer';

export type {
  TonyOrchestratorConfig,
  OrchestrationResult,
  AgentSpawnResult
} from './core/TonyPlanningOrchestrator';

export type {
  ResourceLimits,
  ResourceUsage,
  HybridDeploymentStrategy
} from './core/ResourceManager';

// Legacy interfaces for backwards compatibility
export interface MinimalPlanningConfig {
  name: string;
  type: string;
}

export interface PlanningResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Enhanced planning utilities with Tony orchestration
export const PlanningUtils = {
  /**
   * Get version information
   */
  getVersion: () => "0.2.0-tony", // Updated version for Tony integration
  
  /**
   * Check if planning tools are available
   */
  isAvailable: () => true,
  
  /**
   * Check if Tony orchestration is enabled
   */
  isTonyOrchestrationEnabled: () => true,
  
  /**
   * Get supported UPP hierarchy levels
   */
  getUPPLevels: () => ['epic', 'feature', 'story', 'task', 'subtask', 'atomic'],
  
  /**
   * Get available agent personas for deployment
   */
  getAvailablePersonas: () => [
    'TL-LEAD-TONY',
    'PM-PROJECT-PAUL', 
    'BA-BUSINESS-BELLA',
    'FS-FULLSTACK-FELIX',
    'BE-BACKEND-BENJAMIN',
    'FE-FRONTEND-FIONA',
    'QA-QUALITY-QUINN'
  ]
};

// Import for default export
import { TonyPlanningOrchestrator } from './core/TonyPlanningOrchestrator';
import { UPPDecomposer } from './core/UPPDecomposer';

export default {
  PlanningUtils,
  // Export main orchestrator class for easy access
  TonyPlanningOrchestrator,
  UPPDecomposer,
};