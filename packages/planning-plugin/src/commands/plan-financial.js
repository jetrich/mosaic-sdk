/**
 * Plan Financial Command - Execute financial planning with AI development cost factors
 * Provides budget constraints that influence release planning decisions
 */

const UppFinancialPlannerLocal = require('../agents/upp-financial-planner-local');
const { DependencyManager, ModuleStatus } = require('../core/dependency-manager');
const { StateTracker } = require('../core/state-tracker');

class PlanFinancialCommand {
  constructor() {
    this.name = 'plan-financial';
    this.description = 'Financial modeling with AI development cost factors and revenue projections';
    this.agent = new UppFinancialPlannerLocal();
    this.dependencyManager = new DependencyManager();
    this.stateTracker = null;
  }

  async initialize(projectId) {
    this.stateTracker = new StateTracker({ projectId });
    await this.stateTracker.initialize();
    await this.agent.initialize();
  }

  async execute(options = {}) {
    const { 
      projectId = 'default',
      budget,
      timeline,
      teamSize,
      force = false 
    } = options;
    
    if (!this.stateTracker) {
      await this.initialize(projectId);
    }

    console.log(`\n💰 Starting Financial Planning for Project: ${projectId}`);
    console.log('🤖 AI-Assisted Development Cost Analysis');
    console.log(''.padEnd(60, '='));

    // Check dependencies - financial planning needs business strategy
    if (!force) {
      const canExecute = this.dependencyManager.canExecuteModule('financial');
      if (!canExecute.canExecute) {
        console.log(`❌ Cannot execute financial planning: ${canExecute.reason}`);
        if (canExecute.missingDependencies.length > 0) {
          console.log(`💡 Run these commands first: ${canExecute.missingDependencies.map(dep => `/plan-${dep}`).join(', ')}`);
          console.log(`\n🔍 Why business planning is needed:`);
          console.log(`   • Strategic framework defines revenue model approach`);
          console.log(`   • Market analysis provides pricing and scaling context`);
          console.log(`   • Success metrics guide financial projection models`);
        }
        return {
          success: false,
          error: canExecute.reason,
          missingDependencies: canExecute.missingDependencies
        };
      }
    }

    // Mark as in progress
    this.dependencyManager.updateModuleState('financial', {
      status: ModuleStatus.IN_PROGRESS,
      startedAt: new Date(),
      errors: [],
      metadata: { projectId }
    });

    this.updateStateTracker('financial', ModuleStatus.IN_PROGRESS);

    try {
      // Get business strategy from previous planning
      const businessConstraints = this.stateTracker.getMetadata('businessConstraints') || {};
      const strategicFramework = this.stateTracker.getMetadata('strategicFramework') || {};
      const opportunityAnalysis = this.stateTracker.getMetadata('opportunityAnalysis') || {};

      // Build project constraints from inputs and previous planning
      const projectConstraints = {
        complexity: this.determineComplexity(businessConstraints, strategicFramework),
        domain: opportunityAnalysis.targetMarket || businessConstraints.domain || 'general',
        budget: budget || businessConstraints.budgetConstraints || 'startup-level',
        timeline: timeline || strategicFramework.timeframe || 'medium',
        teamSize: teamSize || 'small-team'
      };

      console.log(`🎯 Business Model: ${opportunityAnalysis.businessModel || 'subscription'}`);
      console.log(`📊 Market Size: ${opportunityAnalysis.marketSize || 'medium'}`);
      console.log(`🏗️ Project Complexity: ${projectConstraints.complexity}`);
      console.log(`💼 Budget Level: ${projectConstraints.budget}`);

      // Execute financial planning
      const startTime = Date.now();
      const result = await this.agent.planFinancials(
        strategicFramework,
        opportunityAnalysis,
        projectConstraints,
        { projectId, budget, timeline, teamSize }
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        // Mark as completed
        this.dependencyManager.updateModuleState('financial', {
          status: ModuleStatus.COMPLETED,
          completedAt: new Date(),
          duration,
          outputs: ['financial-projections.json', 'ai-cost-analysis.json'],
          metadata: {
            projectId,
            revenueModel: result.revenueAnalysis.modelType,
            aiSavings: result.costAnalysis.totals.savingsPercentage,
            breakEvenMonths: result.roiAnalysis.breakEvenMonths
          }
        });

        this.updateStateTracker('financial', ModuleStatus.COMPLETED, duration, result);

        // Display results with emphasis on AI cost savings
        this.displayFinancialResults(result, duration);

        // Save financial constraints for release planning
        await this.stateTracker.updateMetadata('financialConstraints', result.financialConstraints);
        await this.stateTracker.updateMetadata('financialProjections', result.financialProjections);
        await this.stateTracker.updateMetadata('aiCostAnalysis', result.costAnalysis);

        return {
          success: true,
          result,
          duration,
          nextSteps: this.getNextSteps(result),
          aiSavings: {
            totalSavings: result.costAnalysis.totals.savings,
            savingsPercentage: result.costAnalysis.totals.savingsPercentage,
            traditionalCost: result.costAnalysis.totals.traditional,
            aiAdjustedCost: result.costAnalysis.totals.aiAdjusted
          }
        };

      } else {
        // Mark as failed but provide fallback
        this.dependencyManager.updateModuleState('financial', {
          status: ModuleStatus.FAILED,
          completedAt: new Date(),
          duration,
          errors: [result.error],
          metadata: { projectId }
        });

        this.updateStateTracker('financial', ModuleStatus.FAILED, duration, null, [result.error]);

        console.log(`❌ Financial planning failed: ${result.error}`);
        
        if (result.fallback) {
          console.log(`\n📋 Using fallback financial strategy:`);
          this.displayFallbackResults(result.fallback);
          
          // Save fallback strategy
          await this.stateTracker.updateMetadata('financialConstraints', result.fallback.financialConstraints);
        }

        return {
          success: false,
          error: result.error,
          fallback: result.fallback,
          duration
        };
      }

    } catch (error) {
      // Mark as failed
      this.dependencyManager.updateModuleState('financial', {
        status: ModuleStatus.FAILED,
        completedAt: new Date(),
        duration: 0,
        errors: [error.message],
        metadata: { projectId }
      });

      this.updateStateTracker('financial', ModuleStatus.FAILED, 0, null, [error.message]);

      console.error(`💥 Financial planning error: ${error.message}`);
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  updateStateTracker(moduleName, status, duration = 0, result = null, errors = []) {
    const module = this.dependencyManager.modules.get(moduleName);
    const state = this.dependencyManager.states.get(moduleName);
    
    if (module && state) {
      this.stateTracker.updateModule(moduleName, module, {
        ...state,
        status,
        duration,
        errors,
        completedAt: status === ModuleStatus.COMPLETED ? new Date() : state.completedAt
      });
    }
  }

  determineComplexity(businessConstraints, strategicFramework) {
    // Determine complexity from business context
    if (businessConstraints.stakeholderPriorities?.includes('enterprise') || 
        strategicFramework.riskTolerance === 'low') {
      return 'enterprise';
    } else if (strategicFramework.approach === 'market-first' || 
               businessConstraints.qualityGates?.length > 4) {
      return 'complex';
    } else if (strategicFramework.approach === 'lean-startup') {
      return 'simple';
    }
    return 'medium';
  }

  displayFinancialResults(result, duration) {
    console.log(`\n✅ Financial Planning Completed in ${Math.round(duration / 1000)}s`);
    console.log(`🤖 AI Development Cost Analysis Complete`);
    console.log(''.padEnd(60, '-'));

    // AI Cost Savings - The Key Innovation
    console.log(`\n🤖 AI Development Cost Analysis:`);
    console.log(`   Traditional Development Cost: $${result.costAnalysis.totals.traditional.toLocaleString()}`);
    console.log(`   AI-Assisted Development Cost: $${result.costAnalysis.totals.aiAdjusted.toLocaleString()}`);
    console.log(`   💰 Total AI Savings: $${result.costAnalysis.totals.savings.toLocaleString()} (${result.costAnalysis.totals.savingsPercentage}%)`);
    
    console.log(`\n   AI Productivity Multipliers:`);
    Object.entries(result.costAnalysis.breakdown).forEach(([category, data]) => {
      if (data.multiplier > 1) {
        console.log(`     • ${category}: ${data.multiplier}x faster (save $${data.savings.toLocaleString()})`);
      }
    });

    // Revenue Model Analysis
    console.log(`\n📊 Revenue Model Analysis:`);
    console.log(`   Model Type: ${result.revenueAnalysis.modelType}`);
    console.log(`   Pricing Strategy: ${result.revenueAnalysis.pricingStrategy}`);
    console.log(`   Market Size: ${result.revenueAnalysis.marketSize}`);
    console.log(`   Scalability: ${result.revenueAnalysis.scalabilityFactor}`);

    // Financial Projections
    const projections = result.financialProjections.summary;
    console.log(`\n💰 12-Month Financial Projections:`);
    console.log(`   Total Revenue: $${projections.totalRevenue.toLocaleString()}`);
    console.log(`   Total Costs: $${projections.totalCosts.toLocaleString()}`);
    console.log(`   Net Profit: $${projections.netProfit.toLocaleString()}`);
    console.log(`   Average Monthly Revenue: $${projections.averageMonthlyRevenue.toLocaleString()}`);

    // ROI Analysis
    console.log(`\n📈 ROI Analysis:`);
    console.log(`   Break-even: ${result.roiAnalysis.breakEvenMonths} months`);
    console.log(`   Year 1 ROI: ${result.roiAnalysis.yearOneROI}%`);
    console.log(`   AI Cost Savings: $${result.roiAnalysis.aiSavings.toLocaleString()} (${result.roiAnalysis.aiSavingsPercentage}%)`);

    // Budget Constraints for Release Planning
    console.log(`\n🔒 Budget Constraints (will guide release planning):`);
    console.log(`   Budget Level: ${result.budgetConstraints.level}`);
    console.log(`   Total Funding Needed: $${result.budgetConstraints.totalFunding.toLocaleString()}`);
    console.log(`   Monthly Burn Rate: $${result.budgetConstraints.monthlyBurn.toLocaleString()}`);
    console.log(`   Runway: ${result.budgetConstraints.runway} months`);
    console.log(`   Development Budget: $${result.budgetConstraints.developmentBudget.toLocaleString()}`);
  }

  displayFallbackResults(fallback) {
    console.log(`\n📋 Fallback Financial Strategy:`);
    console.log(`   Revenue Model: ${fallback.revenueAnalysis.modelType}`);
    console.log(`   Budget Level: ${fallback.financialConstraints.budgetLevel}`);
    console.log(`   Funding Requirement: $${fallback.financialConstraints.fundingRequirement.toLocaleString()}`);
    console.log(`   Break-even: ${fallback.financialConstraints.breakEven} months`);
    
    if (fallback.costAnalysis) {
      console.log(`   AI Savings: ${fallback.costAnalysis.totals.savingsPercentage}%`);
    }
  }

  getNextSteps(result) {
    const nextSteps = [];
    
    // Release planning is now unblocked with financial constraints
    nextSteps.push('🚀 FINANCIAL CONSTRAINTS ESTABLISHED:');
    nextSteps.push(`   Budget Level: ${result.budgetConstraints.level}`);
    nextSteps.push(`   Development Budget: $${result.budgetConstraints.developmentBudget.toLocaleString()}`);
    nextSteps.push(`   Runway: ${result.budgetConstraints.runway} months`);
    nextSteps.push('');
    nextSteps.push(`💡 Run /plan-release to create scope boundaries within budget constraints`);
    
    // Other planning modules
    const readyModules = this.dependencyManager.getReadyModules();
    if (readyModules.length > 0) {
      nextSteps.push('');
      nextSteps.push('📋 Other ready modules:');
      readyModules.forEach(module => {
        if (module !== 'release') {
          nextSteps.push(`   Run /plan-${module}`);
        }
      });
    }
    
    nextSteps.push('');
    nextSteps.push('💡 Run /plan-status to see updated progress');

    return nextSteps;
  }

  // Command interface methods
  getCommandInfo() {
    return {
      name: this.name,
      description: this.description,
      usage: '/plan-financial --project=PROJECT_ID [--budget=LEVEL] [--timeline=MONTHS] [--team-size=NUMBER] [--force]',
      requiredParams: ['project'],
      optionalParams: ['budget', 'timeline', 'team-size', 'force'],
      examples: [
        '/plan-financial --project=sage-phr',
        '/plan-financial --project=ecommerce --budget=enterprise --timeline=12 --team-size=8',
        '/plan-financial --project=fintech --budget=startup --timeline=6'
      ],
      dependencies: ['business'],
      blocks: ['release'],
      keyFeature: 'AI-assisted development cost modeling with 40-60% cost savings'
    };
  }
}

module.exports = PlanFinancialCommand;