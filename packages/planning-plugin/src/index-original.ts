/**
 * Planning Plugin - Unified Agent Architecture
 * Exports all unified planning agents that use MosAIc MCP infrastructure
 */

// Unified Planning Agents (MCP-enabled)
export { UnifiedPlanningAgent } from './agents/base/UnifiedPlanningAgent';
export { UppBusinessPlanner } from './agents/UppBusinessPlanner';
export { UppFinancialPlanner } from './agents/UppFinancialPlanner';
export { UppMarketingPlanner } from './agents/UppMarketingPlanner';
export { UppReleasePlanner } from './agents/UppReleasePlanner';
export { UppTechPlanner } from './agents/UppTechPlanner';

// Configuration and Domain Support
export { 
  getDomainConfig, 
  detectDomainFromDescription,
  getAllDomains,
  getDomainsByCategory 
} from './config/domains';

// Core Planning Types
export type {
  PlanningAgentConfig,
  PlanningContext,
  PlanningRequest,
  PlanningResult
} from './agents/base/UnifiedPlanningAgent';

export type {
  BusinessPlanningInput
} from './agents/UppBusinessPlanner';

export type {
  FinancialPlanningInput
} from './agents/UppFinancialPlanner';

export type {
  MarketingPlanningInput
} from './agents/UppMarketingPlanner';

export type {
  ReleasePlanningInput
} from './agents/UppReleasePlanner';

export type {
  TechnicalPlanningInput
} from './agents/UppTechPlanner';

// Utility functions for planning
export const PlanningUtils = {
  /**
   * Create a unified business planner instance
   */
  createBusinessPlanner: (config?: any) => new UppBusinessPlanner(config),
  
  /**
   * Create a unified financial planner instance
   */
  createFinancialPlanner: (config?: any) => new UppFinancialPlanner(config),
  
  /**
   * Create a unified marketing planner instance
   */
  createMarketingPlanner: (config?: any) => new UppMarketingPlanner(config),
  
  /**
   * Create a unified release planner instance
   */
  createReleasePlanner: (config?: any) => new UppReleasePlanner(config),
  
  /**
   * Create a unified technical planner instance
   */
  createTechPlanner: (config?: any) => new UppTechPlanner(config),
  
  /**
   * Get all available planning agent types
   */
  getAvailableAgents: () => [
    'upp-business-planner',
    'upp-financial-planner', 
    'upp-marketing-planner',
    'upp-release-planner',
    'upp-tech-planner'
  ],
  
  /**
   * Create agent by type name
   */
  createAgentByType: (type: string, config?: any) => {
    switch (type) {
      case 'upp-business-planner':
        return new UppBusinessPlanner(config);
      case 'upp-financial-planner':
        return new UppFinancialPlanner(config);
      case 'upp-marketing-planner':
        return new UppMarketingPlanner(config);
      case 'upp-release-planner':
        return new UppReleasePlanner(config);
      case 'upp-tech-planner':
        return new UppTechPlanner(config);
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  }
};

// Re-export from agents for backwards compatibility  
import UppBusinessPlannerDefault from './agents/UppBusinessPlanner.js';
import UppFinancialPlannerDefault from './agents/UppFinancialPlanner.js';
import UppMarketingPlannerDefault from './agents/UppMarketingPlanner.js';
import UppReleasePlannerDefault from './agents/UppReleasePlanner.js';
import UppTechPlannerDefault from './agents/UppTechPlanner.js';

export {
  UppBusinessPlannerDefault as UppBusinessPlannerDefault,
  UppFinancialPlannerDefault as UppFinancialPlannerDefault,
  UppMarketingPlannerDefault as UppMarketingPlannerDefault,
  UppReleasePlannerDefault as UppReleasePlannerDefault,
  UppTechPlannerDefault as UppTechPlannerDefault
};

// Default export for convenience
export default {
  UppBusinessPlanner,
  UppFinancialPlanner,
  UppMarketingPlanner,
  UppReleasePlanner,
  UppTechPlanner,
  PlanningUtils,
  getDomainConfig,
  detectDomainFromDescription
};