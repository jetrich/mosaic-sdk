/**
 * Plan Tech Command - Execute technology architecture and stack decisions
 * Provides technology recommendations based on release constraints and business requirements
 */

const UppTechArchitectureLocal = require('../agents/upp-tech-architecture-local');
const { DependencyManager, ModuleStatus } = require('../core/dependency-manager');
const { StateTracker } = require('../core/state-tracker');

class PlanTechCommand {
  constructor() {
    this.name = 'plan-tech';
    this.description = 'Technology stack selection and architecture pattern recommendations';
    this.agent = new UppTechArchitectureLocal();
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
      constraints,
      preferences,
      scale,
      force = false 
    } = options;
    
    if (!this.stateTracker) {
      await this.initialize(projectId);
    }

    console.log(`\n⚙️ Starting Technology Architecture Planning for Project: ${projectId}`);
    console.log('🏗️ Technology Stack & System Design');
    console.log(''.padEnd(60, '='));

    // Check dependencies - tech planning needs release constraints
    if (!force) {
      const canExecute = this.dependencyManager.canExecuteModule('tech');
      if (!canExecute.canExecute) {
        console.log(`❌ Cannot execute tech planning: ${canExecute.reason}`);
        if (canExecute.missingDependencies.length > 0) {
          console.log(`💡 Run these commands first: ${canExecute.missingDependencies.map(dep => `/plan-${dep}`).join(', ')}`);
          console.log(`\n🔍 Why release planning is needed:`);
          console.log(`   • Release scope defines feature complexity and tech requirements`);
          console.log(`   • Timeline constraints influence architecture complexity decisions`);
          console.log(`   • Budget constraints from release planning guide infrastructure choices`);
          console.log(`   • MVP boundaries ensure appropriate technology complexity`);
        }
        return {
          success: false,
          error: canExecute.reason,
          missingDependencies: canExecute.missingDependencies
        };
      }
    }

    // Mark as in progress
    this.dependencyManager.updateModuleState('tech', {
      status: ModuleStatus.IN_PROGRESS,
      startedAt: new Date(),
      errors: [],
      metadata: { projectId }
    });

    this.updateStateTracker('tech', ModuleStatus.IN_PROGRESS);

    try {
      // Get release constraints and business requirements from previous planning
      const releaseConstraints = this.stateTracker.getMetadata('releaseConstraints') || {};
      const businessConstraints = this.stateTracker.getMetadata('businessConstraints') || {};
      const strategicFramework = this.stateTracker.getMetadata('strategicFramework') || {};
      const financialConstraints = this.stateTracker.getMetadata('financialConstraints') || {};

      // Build project constraints from inputs and previous planning
      const projectConstraints = {
        constraints: constraints ? constraints.split(',') : [],
        preferences: preferences ? preferences.split(',') : [],
        scale: scale || this.inferScale(releaseConstraints, financialConstraints),
        budget: financialConstraints.budgetLevel || 'startup-level',
        timeline: releaseConstraints.timeline || '8 weeks',
        teamSize: releaseConstraints.teamSize || 'small-team',
        complexity: releaseConstraints.complexity || 'medium'
      };

      console.log(`🎯 Application Type: ${this.inferApplicationTypes(strategicFramework).join(', ')}`);
      console.log(`📊 Project Scale: ${projectConstraints.scale}`);
      console.log(`⏱️ Release Timeline: ${projectConstraints.timeline}`);
      console.log(`💰 Budget Level: ${projectConstraints.budget}`);
      console.log(`🔧 Complexity: ${projectConstraints.complexity}`);

      // Execute technology architecture planning
      const startTime = Date.now();
      const result = await this.agent.planTechArchitecture(
        releaseConstraints,
        strategicFramework,
        projectConstraints,
        { 
          projectId, 
          constraints: projectConstraints.constraints,
          preferences: projectConstraints.preferences,
          scale: projectConstraints.scale
        }
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        // Mark as completed
        this.dependencyManager.updateModuleState('tech', {
          status: ModuleStatus.COMPLETED,
          completedAt: new Date(),
          duration,
          outputs: ['tech-stack.json', 'architecture-design.json', 'infrastructure-plan.json'],
          metadata: {
            projectId,
            selectedStack: result.technologyStack.primaryStack,
            architecturePattern: result.architectureDesign.pattern,
            hostingStrategy: result.infrastructurePlan.hostingStrategy,
            complexity: result.techRequirements.complexity
          }
        });

        this.updateStateTracker('tech', ModuleStatus.COMPLETED, duration, result);

        // Display results with emphasis on architecture decisions
        this.displayTechResults(result, duration);

        // Save tech constraints for task planning
        await this.stateTracker.updateMetadata('techConstraints', result.techConstraints);
        await this.stateTracker.updateMetadata('technologyStack', result.technologyStack);
        await this.stateTracker.updateMetadata('architectureDesign', result.architectureDesign);
        await this.stateTracker.updateMetadata('infrastructurePlan', result.infrastructurePlan);

        return {
          success: true,
          result,
          duration,
          nextSteps: this.getNextSteps(result),
          keyDecisions: {
            technologyStack: this.extractKeyTechnologies(result.technologyStack),
            architecturePattern: result.architectureDesign.pattern,
            hostingStrategy: result.infrastructurePlan.hostingStrategy,
            scalingApproach: result.scalabilityPlan.approach,
            estimatedCosts: result.infrastructurePlan.estimatedCosts
          }
        };

      } else {
        // Mark as failed but provide fallback
        this.dependencyManager.updateModuleState('tech', {
          status: ModuleStatus.FAILED,
          completedAt: new Date(),
          duration,
          errors: [result.error],
          metadata: { projectId }
        });

        this.updateStateTracker('tech', ModuleStatus.FAILED, duration, null, [result.error]);

        console.log(`❌ Technology planning failed: ${result.error}`);
        
        if (result.fallback) {
          console.log(`\n📋 Using fallback technology architecture:`);
          this.displayFallbackResults(result.fallback);
          
          // Save fallback architecture
          await this.stateTracker.updateMetadata('techConstraints', result.fallback.techConstraints);
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
      this.dependencyManager.updateModuleState('tech', {
        status: ModuleStatus.FAILED,
        completedAt: new Date(),
        duration: 0,
        errors: [error.message],
        metadata: { projectId }
      });

      this.updateStateTracker('tech', ModuleStatus.FAILED, 0, null, [error.message]);

      console.error(`💥 Technology planning error: ${error.message}`);
      
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

  inferScale(releaseConstraints, financialConstraints) {
    const featureCount = releaseConstraints.currentReleaseFeatures?.length || 3;
    const budget = financialConstraints.budgetLevel || 'startup-level';
    const timeline = releaseConstraints.timeline || '8 weeks';
    
    if (budget === 'enterprise' || featureCount > 15) return 'large';
    if (budget === 'growth-stage' || featureCount > 8 || timeline.includes('month')) return 'medium';
    return 'small';
  }

  inferApplicationTypes(strategicFramework) {
    const businessType = strategicFramework.businessType || 'b2b-saas';
    
    const typeMapping = {
      'b2b-saas': ['Web Application'],
      'marketplace': ['Web Platform', 'Mobile App'],
      'consumer': ['Mobile App', 'Web App'],
      'enterprise': ['Enterprise Web App', 'Data Platform'],
      'fintech': ['Secure Web App', 'API Platform'],
      'healthcare': ['HIPAA-Compliant Web App']
    };
    
    return typeMapping[businessType] || ['Web Application'];
  }

  displayTechResults(result, duration) {
    console.log(`\n✅ Technology Architecture Completed in ${Math.round(duration / 1000)}s`);
    console.log(`⚙️ Technology Stack & Architecture Defined`);
    console.log(''.padEnd(60, '-'));

    // Technology Stack - Core Decisions
    console.log(`\n🏗️ Selected Technology Stack:`);
    const stack = result.technologyStack.primaryStack;
    if (stack.frontend) console.log(`   Frontend: ${stack.frontend.join(', ')}`);
    if (stack.backend) console.log(`   Backend: ${stack.backend.join(', ')}`);
    if (stack.database) console.log(`   Database: ${stack.database.join(', ')}`);
    if (stack.hosting) console.log(`   Hosting: ${stack.hosting.join(', ')}`);
    if (stack.monitoring) console.log(`   Monitoring: ${stack.monitoring.join(', ')}`);
    
    // Architecture Design
    console.log(`\n🏛️ System Architecture:`);
    console.log(`   Pattern: ${result.architectureDesign.pattern}`);
    console.log(`   Components: ${result.architectureDesign.components.join(', ')}`);
    console.log(`   Data Flow: ${result.architectureDesign.dataFlow}`);
    console.log(`   API Design: ${result.architectureDesign.apiDesign}`);
    console.log(`   Security: ${result.architectureDesign.securityArchitecture}`);

    // Infrastructure Planning
    console.log(`\n☁️ Infrastructure Strategy:`);
    console.log(`   Hosting: ${result.infrastructurePlan.hostingStrategy}`);
    console.log(`   Deployment: ${result.infrastructurePlan.deploymentPipeline.strategy}`);
    console.log(`   Monitoring: ${result.infrastructurePlan.monitoring.join(', ')}`);
    console.log(`   Estimated Costs: ${result.infrastructurePlan.estimatedCosts}`);
    console.log(`   Backup Strategy: ${result.infrastructurePlan.backupStrategy}`);

    // Development Workflow
    console.log(`\n⚡ Development Workflow:`);
    console.log(`   CI/CD Platform: ${result.developmentWorkflow.cicdPipeline.platform}`);
    console.log(`   Code Quality: ${result.developmentWorkflow.codeQuality.linting.join(', ')}`);
    console.log(`   Testing Strategy: ${result.developmentWorkflow.testing.unit} + ${result.developmentWorkflow.testing.e2e}`);
    console.log(`   Git Workflow: ${result.developmentWorkflow.workflow}`);

    // Scalability Plan
    console.log(`\n📈 Scalability & Performance:`);
    console.log(`   Scaling Approach: ${result.scalabilityPlan.approach}`);
    console.log(`   Caching Strategy: ${result.scalabilityPlan.caching}`);
    console.log(`   CDN Strategy: ${result.scalabilityPlan.cdnStrategy}`);
    
    // Performance Targets
    console.log(`\n🎯 Performance Targets:`);
    Object.entries(result.scalabilityPlan.performanceTargets).forEach(([metric, target]) => {
      console.log(`     • ${metric.replace('_', ' ')}: ${target}`);
    });

    // Technology Requirements Summary
    console.log(`\n📋 Requirements Summary:`);
    console.log(`   Complexity: ${result.techRequirements.complexity}`);
    console.log(`   Application Types: ${result.techRequirements.applicationTypes.join(', ')}`);
    console.log(`   Security Level: ${result.techRequirements.securityRequirements}`);
    if (result.techRequirements.compliance.length > 0) {
      console.log(`   Compliance: ${result.techRequirements.compliance.join(', ').toUpperCase()}`);
    }

    // Cost Optimizations
    if (result.technologyStack.costOptimizations) {
      console.log(`\n💰 Cost Optimizations Applied:`);
      Object.entries(result.technologyStack.costOptimizations).forEach(([category, options]) => {
        if (Array.isArray(options)) {
          console.log(`     • ${category}: ${options.join(', ')}`);
        }
      });
    }

    // Alternative Stacks
    if (result.technologyStack.alternatives.length > 0) {
      console.log(`\n🔄 Alternative Technology Options:`);
      result.technologyStack.alternatives.forEach(alt => {
        console.log(`     • ${alt.name || 'Alternative'}: ${alt.frontend?.[0] || alt.backend?.[0] || 'Custom stack'}`);
      });
    }
  }

  displayFallbackResults(fallback) {
    console.log(`\n📋 Fallback Technology Architecture:`);
    const stack = fallback.technologyStack.primaryStack;
    console.log(`   Frontend: ${stack.frontend?.join(', ') || 'React'}`);
    console.log(`   Backend: ${stack.backend?.join(', ') || 'Node.js'}`);
    console.log(`   Database: ${stack.database?.join(', ') || 'PostgreSQL'}`);
    console.log(`   Architecture: ${fallback.architectureDesign.pattern}`);
    console.log(`   Hosting: ${fallback.infrastructurePlan.hostingStrategy}`);
    console.log(`   Costs: ${fallback.infrastructurePlan.estimatedCosts}`);
  }

  extractKeyTechnologies(technologyStack) {
    const stack = technologyStack.primaryStack;
    return {
      frontend: stack.frontend?.[0] || 'React',
      backend: stack.backend?.[0] || 'Node.js', 
      database: stack.database?.[0] || 'PostgreSQL',
      hosting: stack.hosting?.[0] || 'Cloud'
    };
  }

  getNextSteps(result) {
    const nextSteps = [];
    
    // Technology architecture now complete
    nextSteps.push('⚙️ TECHNOLOGY ARCHITECTURE ESTABLISHED:');
    nextSteps.push(`   Stack: ${this.extractKeyTechnologies(result.technologyStack).frontend} + ${this.extractKeyTechnologies(result.technologyStack).backend}`);
    nextSteps.push(`   Pattern: ${result.architectureDesign.pattern}`);
    nextSteps.push(`   Hosting: ${result.infrastructurePlan.hostingStrategy}`);
    nextSteps.push(`   Costs: ${result.infrastructurePlan.estimatedCosts}`);
    nextSteps.push('');
    
    // Tasks planning is now ready
    const readyModules = this.dependencyManager.getReadyModules();
    if (readyModules.includes('tasks')) {
      nextSteps.push(`💡 Run /plan-tasks to generate technical epics constrained by release scope`);
    } else {
      nextSteps.push(`💡 Complete remaining planning modules before technical task decomposition`);
    }
    
    // Other available modules
    if (readyModules.length > 0) {
      nextSteps.push('');
      nextSteps.push('📋 Other ready modules:');
      readyModules.forEach(module => {
        if (module !== 'tasks') {
          nextSteps.push(`   Run /plan-${module}`);
        }
      });
    }
    
    nextSteps.push('');
    nextSteps.push('💡 Run /plan-status to see updated progress');
    nextSteps.push('🚀 Ready for technical task decomposition with scope constraints');

    return nextSteps;
  }

  // Command interface methods
  getCommandInfo() {
    return {
      name: this.name,
      description: this.description,
      usage: '/plan-tech --project=PROJECT_ID [--constraints=LIST] [--preferences=LIST] [--scale=LEVEL] [--force]',
      requiredParams: ['project'],
      optionalParams: ['constraints', 'preferences', 'scale', 'force'],
      examples: [
        '/plan-tech --project=sage-phr',
        '/plan-tech --project=ecommerce --scale=enterprise --constraints=hipaa,gdpr',
        '/plan-tech --project=fintech --preferences=typescript,postgres --scale=medium'
      ],
      dependencies: ['release'],
      blocks: ['tasks'], // Tech architecture provides constraints for task decomposition
      keyFeature: 'Architecture patterns and technology stack selection based on release constraints'
    };
  }
}

module.exports = PlanTechCommand;