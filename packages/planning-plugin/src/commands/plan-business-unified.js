/**
 * Plan Business Command - Execute business strategy planning (Unified Agent)
 * Root command that provides strategic framework for all other planning modules
 * Uses MosAIc MCP infrastructure for local/remote routing
 */

const { UppBusinessPlanner } = require('../index.ts');
const { DependencyManager, ModuleStatus } = require('../core/dependency-manager');
const { StateTracker } = require('../core/state-tracker');

class PlanBusinessUnifiedCommand {
  constructor() {
    this.name = 'plan-business';
    this.description = 'Business strategy and vision planning with MCP routing';
    this.agent = new UppBusinessPlanner();
    this.dependencyManager = new DependencyManager();
    this.stateTracker = null;
  }

  async initialize(projectId) {
    this.stateTracker = new StateTracker({ projectId });
    await this.stateTracker.initialize();
    
    // Initialize the unified agent with project context
    const context = {
      projectId,
      description: 'Business planning context'
    };
    await this.agent.initialize(context);
  }

  async execute(options = {}) {
    const { 
      projectId = 'default',
      projectDescription,
      stakeholderInput,
      marketContext,
      domain,
      businessType,
      targetMarket,
      competitiveLandscape,
      force = false 
    } = options;
    
    if (!this.stateTracker) {
      await this.initialize(projectId);
    }

    console.log(`\n🚀 Starting Unified Business Planning for Project: ${projectId}`);
    console.log(''.padEnd(60, '='));

    // Check if we can execute this module
    if (!force) {
      const canExecute = this.dependencyManager.canExecuteModule('business');
      if (!canExecute.canExecute) {
        console.log(`❌ Cannot execute business planning: ${canExecute.reason}`);
        if (canExecute.missingDependencies.length > 0) {
          console.log(`💡 Run these commands first: ${canExecute.missingDependencies.map(dep => `/plan-${dep}`).join(', ')}`);
        }
        return {
          success: false,
          error: canExecute.reason,
          missingDependencies: canExecute.missingDependencies
        };
      }
    }

    // Mark as in progress
    this.dependencyManager.updateModuleState('business', {
      status: ModuleStatus.IN_PROGRESS,
      startedAt: new Date(),
      errors: [],
      metadata: { projectId }
    });

    this.updateStateTracker('business', ModuleStatus.IN_PROGRESS);

    try {
      // Validate required inputs
      if (!projectDescription) {
        throw new Error('Project description is required for business planning');
      }

      console.log(`📋 Project: ${projectDescription.substring(0, 100)}...`);
      console.log(`🔧 Processing Mode: MCP Routing (local-first → remote fallback)`);
      if (domain) {
        console.log(`🏢 Domain: ${domain}`);
      }
      if (stakeholderInput) {
        console.log(`👥 Stakeholders: ${Object.keys(stakeholderInput).join(', ')}`);
      }
      if (marketContext) {
        console.log(`🌍 Market Context: ${marketContext.substring(0, 50)}...`);
      }

      // Execute unified business planning via MCP
      const startTime = Date.now();
      
      const planningInput = {
        projectId,
        description: projectDescription,
        domain,
        stakeholders: stakeholderInput ? Object.keys(stakeholderInput) : undefined,
        constraints: [],
        businessType,
        targetMarket,
        competitiveLandscape,
        operation: 'complete-planning'
      };

      const result = await this.agent.planBusiness(planningInput);
      const duration = Date.now() - startTime;

      if (result.success) {
        // Mark as completed
        this.dependencyManager.updateModuleState('business', {
          status: ModuleStatus.COMPLETED,
          completedAt: new Date(),
          duration,
          outputs: ['business-strategy.json'],
          metadata: {
            projectId,
            processingMode: result.metadata.processingMode,
            model: result.metadata.model,
            source: result.metadata.source,
            strategicApproach: result.data?.strategicFramework?.approach || 'product-led',
            primaryGoal: result.data?.strategicFramework?.businessType || 'growth'
          }
        });

        this.updateStateTracker('business', ModuleStatus.COMPLETED, duration, result.data);

        // Display results
        this.displayBusinessResults(result.data, duration, result.metadata);

        // Save business constraints for downstream modules
        await this.stateTracker.updateMetadata('businessConstraints', result.data.businessConstraints);
        await this.stateTracker.updateMetadata('strategicFramework', result.data.strategicFramework);

        return {
          success: true,
          result: result.data,
          metadata: result.metadata,
          duration,
          nextSteps: this.getNextSteps()
        };

      } else {
        // Mark as failed
        this.dependencyManager.updateModuleState('business', {
          status: ModuleStatus.FAILED,
          completedAt: new Date(),
          duration,
          errors: [result.error?.message || 'Business planning failed'],
          metadata: { projectId }
        });

        this.updateStateTracker('business', ModuleStatus.FAILED, duration, null, [result.error?.message || 'Unknown error']);

        console.log(`❌ Business planning failed: ${result.error?.message || 'Unknown error'}`);
        
        return {
          success: false,
          error: result.error?.message || 'Business planning failed',
          duration
        };
      }

    } catch (error) {
      const duration = Date.now() - Date.now();
      
      // Mark as failed
      this.dependencyManager.updateModuleState('business', {
        status: ModuleStatus.FAILED,
        completedAt: new Date(),
        duration: 0,
        errors: [error.message],
        metadata: { projectId }
      });

      this.updateStateTracker('business', ModuleStatus.FAILED, 0, null, [error.message]);

      console.error(`💥 Business planning error: ${error.message}`);
      
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

  displayBusinessResults(result, duration, metadata) {
    console.log(`\n✅ Business Planning Completed in ${Math.round(duration / 1000)}s`);
    console.log(`   🤖 Processing: ${metadata.processingMode} (${metadata.model})`);
    console.log(''.padEnd(60, '-'));

    // Strategic Framework
    if (result.strategicFramework) {
      console.log(`\n🎯 Strategic Framework:`);
      console.log(`   Approach: ${result.strategicFramework.approach}`);
      console.log(`   Business Type: ${result.strategicFramework.businessType}`);
      console.log(`   Timeframe: ${result.strategicFramework.timeframe}`);
      console.log(`   Risk Tolerance: ${result.strategicFramework.riskTolerance}`);
    }

    // Market Analysis
    if (result.marketAnalysis) {
      console.log(`\n📊 Market Analysis:`);
      console.log(`   Target Market: ${result.marketAnalysis.targetMarket}`);
      console.log(`   Market Size: ${result.marketAnalysis.marketSize}`);
      console.log(`   Competition: ${result.marketAnalysis.competitiveLandscape}`);
      console.log(`   Position: ${result.marketAnalysis.competitivePosition}`);
    }

    // Business Model
    if (result.businessModel) {
      console.log(`\n💼 Business Model:`);
      console.log(`   Type: ${result.businessModel.type}`);
      console.log(`   Revenue Model: ${result.businessModel.revenueModel}`);
      console.log(`   Value Proposition: ${result.businessModel.valueProposition}`);
      console.log(`   Channels: ${result.businessModel.channels.join(', ')}`);
    }

    // Success Metrics
    if (result.successMetrics) {
      console.log(`\n📈 Success Metrics:`);
      console.log(`   Primary Metrics: ${result.successMetrics.primaryMetrics?.join(', ')}`);
      console.log(`   Secondary Metrics: ${result.successMetrics.secondaryMetrics?.join(', ')}`);
      console.log(`   Timeline: ${result.successMetrics.timeline}`);
    }

    // Key Constraints
    if (result.businessConstraints) {
      console.log(`\n🔒 Business Constraints (will guide all downstream planning):`);
      console.log(`   Domain: ${result.businessConstraints.domain || 'General'}`);
      console.log(`   Complexity: ${result.businessConstraints.complexity}`);
      console.log(`   Business Type: ${result.businessConstraints.businessType}`);
      console.log(`   Target Market: ${result.businessConstraints.targetMarket}`);
      if (result.businessConstraints.compliance?.length > 0) {
        console.log(`   Compliance: ${result.businessConstraints.compliance.join(', ')}`);
      }
    }

    // AI Response (if available)
    if (result.aiResponse && metadata.source === 'mcp') {
      console.log(`\n🧠 AI Insights Preview:`);
      const preview = result.aiResponse.substring(0, 200);
      console.log(`   ${preview}${preview.length >= 200 ? '...' : ''}`);
    }
  }

  getNextSteps() {
    const readyModules = this.dependencyManager.getReadyModules();
    
    const nextSteps = [];
    if (readyModules.includes('financial')) {
      nextSteps.push('Run /plan-financial to analyze revenue models and costs');
    }
    if (readyModules.includes('marketing')) {
      nextSteps.push('Run /plan-marketing to develop go-to-market strategy');
    }
    if (readyModules.includes('tech')) {
      nextSteps.push('Run /plan-tech to define technical architecture');
    }
    if (readyModules.length > 1) {
      nextSteps.push('Run /plan-all to execute all ready modules');
    }
    nextSteps.push('Run /plan-status to see overall progress');

    return nextSteps;
  }

  // Command interface methods
  getCommandInfo() {
    return {
      name: this.name,
      description: this.description,
      usage: '/plan-business --project=PROJECT_ID --description="PROJECT_DESCRIPTION" [--domain=DOMAIN] [--business-type=TYPE] [--target-market=MARKET] [--competitive-landscape=ANALYSIS] [--stakeholders=JSON] [--force]',
      requiredParams: ['project', 'description'],
      optionalParams: ['domain', 'business-type', 'target-market', 'competitive-landscape', 'stakeholders', 'force'],
      examples: [
        '/plan-business --project=sage-phr --description="HIPAA-compliant PHR platform" --domain=healthcare',
        '/plan-business --project=ecommerce --description="B2B marketplace" --business-type=marketplace --target-market="small-business"',
        '/plan-business --project=fintech --description="Mobile payment app" --domain=fintech --stakeholders=\'{"ceo":"growth-focused","cto":"security-first"}\''
      ],
      dependencies: [],
      blocks: ['financial', 'marketing', 'release', 'tech'],
      mcpEnabled: true,
      routingStrategy: 'local-first'
    };
  }
}

module.exports = PlanBusinessUnifiedCommand;