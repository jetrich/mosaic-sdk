/**
 * Plan Business Command - Execute business strategy planning
 * Root command that provides strategic framework for all other planning modules
 */

const UppBusinessPlannerLocal = require('../agents/upp-business-planner-local');
const { DependencyManager, ModuleStatus } = require('../core/dependency-manager');
const { StateTracker } = require('../core/state-tracker');
const { DocumentationGenerationService } = require('../services/DocumentationGenerationService');
const { MosAIcProjectReader } = require('../utils/MosAIcProjectReader');

class PlanBusinessCommand {
  constructor() {
    this.name = 'plan-business';
    this.description = 'Business strategy and vision planning';
    this.agent = new UppBusinessPlannerLocal();
    this.dependencyManager = new DependencyManager();
    this.stateTracker = null;
    this.documentationService = null;
    this.projectReader = new MosAIcProjectReader();
  }

  async initialize(projectId) {
    this.stateTracker = new StateTracker({ projectId });
    await this.stateTracker.initialize();
    this.documentationService = new DocumentationGenerationService(this.stateTracker);
    await this.agent.initialize();
  }

  async execute(options = {}) {
    // Get MosAIc project context
    const projectConfig = await this.projectReader.getProjectConfig();
    const businessContext = await this.projectReader.getBusinessContext();
    
    const { 
      projectId = projectConfig.projectId,
      projectDescription = businessContext.projectDescription,
      stakeholderInput,
      marketContext,
      force = false 
    } = options;
    
    if (!this.stateTracker) {
      await this.initialize(projectId);
    }

    console.log(`\n🚀 Starting Business Planning for Project: ${businessContext.projectName}`);
    console.log(`📋 Project ID: ${projectId}`);
    if (businessContext.currentEpic) {
      console.log(`🎯 Current Epic: ${businessContext.currentEpic} - ${businessContext.epicTitle}`);
    }
    if (this.projectReader.isMosAIcProject()) {
      console.log(`✨ MosAIc Project: Using project context from .mosaic directory`);
    }
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
      if (stakeholderInput) {
        console.log(`👥 Stakeholders: ${Object.keys(stakeholderInput).join(', ')}`);
      }
      if (marketContext) {
        console.log(`🌍 Market Context: ${marketContext.substring(0, 50)}...`);
      }

      // Execute business planning with MosAIc context
      const startTime = Date.now();
      const planningContext = {
        projectId,
        projectName: businessContext.projectName,
        currentEpic: businessContext.currentEpic,
        epicTitle: businessContext.epicTitle,
        businessContext: businessContext.businessContext,
        constraints: businessContext.constraints,
        isMosAIcProject: this.projectReader.isMosAIcProject()
      };
      
      const result = await this.agent.planBusinessStrategy(
        projectDescription,
        stakeholderInput,
        marketContext,
        planningContext
      );

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
            strategicApproach: result.strategicFramework.approach,
            primaryGoal: result.strategicFramework.primaryGoal
          }
        });

        this.updateStateTracker('business', ModuleStatus.COMPLETED, duration, result);

        // Display results
        this.displayBusinessResults(result, duration);

        // Save business constraints for downstream modules
        await this.stateTracker.updateMetadata('businessConstraints', result.businessConstraints);
        await this.stateTracker.updateMetadata('strategicFramework', result.strategicFramework);

        // Generate strategic documentation
        console.log(`\n📄 Generating strategic documentation...`);
        try {
          const docResult = await this.documentationService.generateDocumentation();
          if (docResult.success) {
            console.log(`✅ Documentation generated:`);
            docResult.generatedFiles.forEach(file => {
              console.log(`   📄 ${file.replace(process.cwd(), '.')}`);
            });
          } else {
            console.log(`⚠️  Documentation generation completed with errors:`);
            docResult.errors.forEach(error => {
              console.log(`   ❌ ${error}`);
            });
          }
        } catch (docError) {
          console.log(`⚠️  Documentation generation failed: ${docError.message}`);
        }

        return {
          success: true,
          result,
          duration,
          nextSteps: this.getNextSteps()
        };

      } else {
        // Mark as failed
        this.dependencyManager.updateModuleState('business', {
          status: ModuleStatus.FAILED,
          completedAt: new Date(),
          duration,
          errors: [result.error],
          metadata: { projectId }
        });

        this.updateStateTracker('business', ModuleStatus.FAILED, duration, null, [result.error]);

        console.log(`❌ Business planning failed: ${result.error}`);
        
        if (result.fallback) {
          console.log(`\n📋 Using fallback business strategy:`);
          console.log(`   Strategic Approach: ${result.fallback.strategicFramework.approach}`);
          console.log(`   Primary Goal: ${result.fallback.strategicFramework.primaryGoal}`);
          
          // Save fallback strategy
          await this.stateTracker.updateMetadata('businessConstraints', result.fallback.businessConstraints);
        }

        return {
          success: false,
          error: result.error,
          fallback: result.fallback,
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

  displayBusinessResults(result, duration) {
    console.log(`\n✅ Business Planning Completed in ${Math.round(duration / 1000)}s`);
    console.log(''.padEnd(60, '-'));

    // Strategic Framework
    console.log(`\n🎯 Strategic Framework:`);
    console.log(`   Approach: ${result.strategicFramework.approach}`);
    console.log(`   Primary Goal: ${result.strategicFramework.primaryGoal}`);
    console.log(`   Timeframe: ${result.strategicFramework.timeframe}`);
    console.log(`   Risk Tolerance: ${result.strategicFramework.riskTolerance}`);

    // Market Analysis
    console.log(`\n📊 Market Analysis:`);
    console.log(`   Target Market: ${result.opportunityAnalysis.targetMarket}`);
    console.log(`   Market Size: ${result.opportunityAnalysis.marketSize}`);
    console.log(`   Competition: ${result.opportunityAnalysis.competitiveLandscape}`);
    console.log(`   Business Model: ${result.opportunityAnalysis.businessModel}`);

    // Success Metrics
    console.log(`\n📈 Success Metrics:`);
    console.log(`   Primary KPI: ${result.successMetrics.primaryKPI}`);
    console.log(`   Secondary KPIs: ${result.successMetrics.secondaryKPIs.join(', ')}`);

    // Key Constraints
    console.log(`\n🔒 Business Constraints (will guide all downstream planning):`);
    console.log(`   Primary Goal: ${result.businessConstraints.primaryGoal}`);
    console.log(`   Timeframe: ${result.businessConstraints.timeframe}`);
    console.log(`   Budget Level: ${result.businessConstraints.budgetConstraints}`);
    console.log(`   Quality Gates: ${result.businessConstraints.qualityGates.join(', ')}`);
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
      usage: '/plan-business --project=PROJECT_ID --description="PROJECT_DESCRIPTION" [--stakeholders=JSON] [--market=CONTEXT] [--force]',
      requiredParams: ['project', 'description'],
      optionalParams: ['stakeholders', 'market', 'force'],
      examples: [
        '/plan-business --project=sage-phr --description="HIPAA-compliant PHR platform"',
        '/plan-business --project=ecommerce --description="B2B marketplace" --market="Growing demand for digital B2B solutions"',
        '/plan-business --project=fintech --description="Mobile payment app" --stakeholders=\'{"ceo":"growth-focused","cto":"security-first"}\''
      ],
      dependencies: [],
      blocks: ['financial', 'marketing', 'release']
    };
  }
}

module.exports = PlanBusinessCommand;