/**
 * Plan Marketing Command - Execute go-to-market strategy and positioning analysis
 * Provides market positioning and customer acquisition strategies based on business context
 */

const UppMarketingPlannerLocal = require('../agents/upp-marketing-planner-local');
const { DependencyManager, ModuleStatus } = require('../core/dependency-manager');
const { StateTracker } = require('../core/state-tracker');

class PlanMarketingCommand {
  constructor() {
    this.name = 'plan-marketing';
    this.description = 'Go-to-market strategy, positioning, and customer acquisition planning';
    this.agent = new UppMarketingPlannerLocal();
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
      segments,
      channels,
      budget,
      force = false 
    } = options;
    
    if (!this.stateTracker) {
      await this.initialize(projectId);
    }

    console.log(`\n🎯 Starting Marketing Planning for Project: ${projectId}`);
    console.log('📊 Go-to-Market Strategy & Customer Acquisition');
    console.log(''.padEnd(60, '='));

    // Check dependencies - marketing needs business strategy
    if (!force) {
      const canExecute = this.dependencyManager.canExecuteModule('marketing');
      if (!canExecute.canExecute) {
        console.log(`❌ Cannot execute marketing planning: ${canExecute.reason}`);
        if (canExecute.missingDependencies.length > 0) {
          console.log(`💡 Run these commands first: ${canExecute.missingDependencies.map(dep => `/plan-${dep}`).join(', ')}`);
          console.log(`\n🔍 Why business planning is needed:`);
          console.log(`   • Strategic framework defines target market and value proposition`);
          console.log(`   • Market analysis provides competitive landscape context`);
          console.log(`   • Business model determines positioning and messaging approach`);
        }
        return {
          success: false,
          error: canExecute.reason,
          missingDependencies: canExecute.missingDependencies
        };
      }
    }

    // Mark as in progress
    this.dependencyManager.updateModuleState('marketing', {
      status: ModuleStatus.IN_PROGRESS,
      startedAt: new Date(),
      errors: [],
      metadata: { projectId }
    });

    this.updateStateTracker('marketing', ModuleStatus.IN_PROGRESS);

    try {
      // Get business strategy and financial constraints from previous planning
      const businessConstraints = this.stateTracker.getMetadata('businessConstraints') || {};
      const strategicFramework = this.stateTracker.getMetadata('strategicFramework') || {};
      const opportunityAnalysis = this.stateTracker.getMetadata('opportunityAnalysis') || {};
      const financialConstraints = this.stateTracker.getMetadata('financialConstraints') || {};

      // Build marketing context from inputs and previous planning
      const marketingContext = {
        targetSegments: segments ? segments.split(',') : undefined,
        preferredChannels: channels ? channels.split(',') : undefined,
        budgetOverride: budget,
        businessModel: strategicFramework.businessType || 'b2b-saas',
        marketSize: opportunityAnalysis.marketSize || 'medium',
        budgetLevel: financialConstraints.budgetLevel || 'startup-level'
      };

      console.log(`🎯 Business Model: ${marketingContext.businessModel}`);
      console.log(`📊 Target Market: ${opportunityAnalysis.targetMarket || 'general'}`);
      console.log(`💰 Marketing Budget Level: ${marketingContext.budgetLevel}`);
      console.log(`🏷️ Competition Level: ${opportunityAnalysis.competitiveLandscape || 'moderate'}`);

      // Execute marketing planning
      const startTime = Date.now();
      const result = await this.agent.planMarketing(
        strategicFramework,
        opportunityAnalysis,
        financialConstraints,
        { 
          projectId, 
          ...marketingContext,
          segments: marketingContext.targetSegments,
          channels: marketingContext.preferredChannels,
          budget: marketingContext.budgetOverride
        }
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        // Mark as completed
        this.dependencyManager.updateModuleState('marketing', {
          status: ModuleStatus.COMPLETED,
          completedAt: new Date(),
          duration,
          outputs: ['positioning-analysis.json', 'acquisition-strategy.json', 'launch-plan.json'],
          metadata: {
            projectId,
            positioningFramework: result.positioningAnalysis.framework,
            targetSegments: result.positioningAnalysis.targetSegments,
            launchType: result.launchStrategy.launchType,
            priorityChannels: result.acquisitionStrategy.priorityChannels
          }
        });

        this.updateStateTracker('marketing', ModuleStatus.COMPLETED, duration, result);

        // Display results with emphasis on go-to-market strategy
        this.displayMarketingResults(result, duration);

        // Save marketing constraints for other planning modules
        await this.stateTracker.updateMetadata('marketingConstraints', result.marketingConstraints);
        await this.stateTracker.updateMetadata('positioningAnalysis', result.positioningAnalysis);
        await this.stateTracker.updateMetadata('acquisitionStrategy', result.acquisitionStrategy);
        await this.stateTracker.updateMetadata('launchStrategy', result.launchStrategy);

        return {
          success: true,
          result,
          duration,
          nextSteps: this.getNextSteps(result),
          keyInsights: {
            targetSegment: result.positioningAnalysis.targetSegments[0],
            valueProposition: result.positioningAnalysis.valueProposition,
            launchApproach: result.launchStrategy.launchType,
            primaryChannel: result.acquisitionStrategy.priorityChannels[0],
            budgetAllocation: result.acquisitionStrategy.budgetAllocation.total
          }
        };

      } else {
        // Mark as failed but provide fallback
        this.dependencyManager.updateModuleState('marketing', {
          status: ModuleStatus.FAILED,
          completedAt: new Date(),
          duration,
          errors: [result.error],
          metadata: { projectId }
        });

        this.updateStateTracker('marketing', ModuleStatus.FAILED, duration, null, [result.error]);

        console.log(`❌ Marketing planning failed: ${result.error}`);
        
        if (result.fallback) {
          console.log(`\n📋 Using fallback marketing strategy:`);
          this.displayFallbackResults(result.fallback);
          
          // Save fallback strategy
          await this.stateTracker.updateMetadata('marketingConstraints', result.fallback.marketingConstraints);
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
      this.dependencyManager.updateModuleState('marketing', {
        status: ModuleStatus.FAILED,
        completedAt: new Date(),
        duration: 0,
        errors: [error.message],
        metadata: { projectId }
      });

      this.updateStateTracker('marketing', ModuleStatus.FAILED, 0, null, [error.message]);

      console.error(`💥 Marketing planning error: ${error.message}`);
      
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

  displayMarketingResults(result, duration) {
    console.log(`\n✅ Marketing Planning Completed in ${Math.round(duration / 1000)}s`);
    console.log(`🎯 Go-to-Market Strategy Ready`);
    console.log(''.padEnd(60, '-'));

    // Market Positioning - The Foundation
    console.log(`\n🎯 Market Positioning Analysis:`);
    console.log(`   Framework: ${result.positioningAnalysis.framework}`);
    console.log(`   Target Segment: ${result.positioningAnalysis.targetSegments.join(', ')}`);
    console.log(`   Value Proposition: ${result.positioningAnalysis.valueProposition}`);
    console.log(`   Core Messaging: ${result.positioningAnalysis.messaging.join(', ')}`);
    
    // Competitive Analysis
    console.log(`\n⚔️ Competitive Position:`);
    console.log(`   Market Position: ${result.competitiveAnalysis.competitivePosition}`);
    console.log(`   Key Differentiators: ${result.competitiveAnalysis.keyDifferentiators.join(', ')}`);
    console.log(`   Main Threats: ${result.competitiveAnalysis.threats.join(', ')}`);
    console.log(`   Market Opportunities: ${result.competitiveAnalysis.opportunities.join(', ')}`);

    // Customer Acquisition Strategy
    console.log(`\n📈 Customer Acquisition Strategy:`);
    console.log(`   Priority Channels: ${result.acquisitionStrategy.priorityChannels.join(', ')}`);
    console.log(`   Total Marketing Budget: $${result.acquisitionStrategy.budgetAllocation.total.toLocaleString()}`);
    console.log(`   Acquisition Timeline: ${result.acquisitionStrategy.timeline}`);
    console.log(`   Expected CAC: $${result.acquisitionStrategy.expectedMetrics.estimatedCAC.toLocaleString()}`);

    // Channel Budget Breakdown
    console.log(`\n💰 Channel Budget Allocation:`);
    Object.entries(result.acquisitionStrategy.budgetAllocation).forEach(([channel, budget]) => {
      if (channel !== 'total' && budget > 0) {
        console.log(`     • ${channel}: $${budget.toLocaleString()}`);
      }
    });

    // Launch Strategy
    console.log(`\n🚀 Launch Strategy:`);
    console.log(`   Launch Type: ${result.launchStrategy.launchType}`);
    console.log(`   Timeline: ${result.launchStrategy.timeline}`);
    console.log(`   Approach: ${result.launchStrategy.approach}`);
    console.log(`   Launch Phases: ${result.launchStrategy.phases.join(' → ')}`);
    console.log(`   Launch Channels: ${result.launchStrategy.channels.join(', ')}`);

    // Marketing Metrics and Success Criteria
    console.log(`\n📊 Marketing Metrics & Success Criteria:`);
    console.log(`   Primary Metrics: ${result.marketingMetrics.primaryMetrics.join(', ')}`);
    Object.entries(result.marketingMetrics.targets).forEach(([metric, target]) => {
      console.log(`     • ${metric}: ${target}`);
    });
    console.log(`   Success Timeline: ${result.marketingMetrics.timeline}`);
    console.log(`   Primary Success Criteria: ${result.marketingMetrics.successCriteria.primary}`);

    // Risk Factors
    if (result.acquisitionStrategy.riskFactors.length > 0) {
      console.log(`\n⚠️ Key Risk Factors:`);
      result.acquisitionStrategy.riskFactors.forEach(risk => {
        console.log(`     • ${risk}`);
      });
    }
  }

  displayFallbackResults(fallback) {
    console.log(`\n📋 Fallback Marketing Strategy:`);
    console.log(`   Positioning: ${fallback.positioningAnalysis.framework}`);
    console.log(`   Target: ${fallback.positioningAnalysis.targetSegments.join(', ')}`);
    console.log(`   Primary Channel: ${fallback.acquisitionStrategy.priorityChannels[0]}`);
    console.log(`   Launch Type: ${fallback.launchStrategy.launchType}`);
    console.log(`   Budget: $${fallback.acquisitionStrategy.budgetAllocation.total.toLocaleString()}`);
  }

  getNextSteps(result) {
    const nextSteps = [];
    
    // Marketing strategy now complete
    nextSteps.push('🎯 MARKETING STRATEGY ESTABLISHED:');
    nextSteps.push(`   Target Segment: ${result.positioningAnalysis.targetSegments[0]}`);
    nextSteps.push(`   Launch Type: ${result.launchStrategy.launchType}`);
    nextSteps.push(`   Primary Channel: ${result.acquisitionStrategy.priorityChannels[0]}`);
    nextSteps.push(`   Marketing Budget: $${result.acquisitionStrategy.budgetAllocation.total.toLocaleString()}`);
    nextSteps.push('');
    
    // Check if financial planning is available for release planning
    const readyModules = this.dependencyManager.getReadyModules();
    if (readyModules.includes('release')) {
      nextSteps.push(`💡 Run /plan-release to create scope boundaries with marketing context`);
    } else if (readyModules.includes('financial')) {
      nextSteps.push(`💡 Run /plan-financial to complete budget planning before release planning`);
    }
    
    // Other planning modules
    if (readyModules.length > 0) {
      nextSteps.push('');
      nextSteps.push('📋 Other ready modules:');
      readyModules.forEach(module => {
        if (!['release', 'financial'].includes(module)) {
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
      usage: '/plan-marketing --project=PROJECT_ID [--segments=LIST] [--channels=LIST] [--budget=AMOUNT] [--force]',
      requiredParams: ['project'],
      optionalParams: ['segments', 'channels', 'budget', 'force'],
      examples: [
        '/plan-marketing --project=sage-phr',
        '/plan-marketing --project=ecommerce --segments=enterprise,smb --channels=direct-sales,partners',
        '/plan-marketing --project=consumer --segments=early-adopters --channels=social-media,referrals --budget=25000'
      ],
      dependencies: ['business'],
      blocks: [], // Marketing doesn't directly block other modules but influences release planning
      keyFeature: 'Go-to-market strategy with positioning, competitive analysis, and acquisition planning'
    };
  }
}

module.exports = PlanMarketingCommand;