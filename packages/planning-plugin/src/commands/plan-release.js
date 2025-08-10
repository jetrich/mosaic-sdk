/**
 * Plan Release Command - Execute release planning and semver strategy
 * CRITICAL SCOPE CONTROL COMMAND - This is the key to preventing scope creep
 */

const UppReleasePlannerLocal = require('../agents/upp-release-planner-local');
const { DependencyManager, ModuleStatus } = require('../core/dependency-manager');
const { StateTracker } = require('../core/state-tracker');

class PlanReleaseCommand {
  constructor() {
    this.name = 'plan-release';
    this.description = 'Release planning and semver strategy - CRITICAL SCOPE CONTROL';
    this.agent = new UppReleasePlannerLocal();
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
      projectDescription,
      force = false 
    } = options;
    
    if (!this.stateTracker) {
      await this.initialize(projectId);
    }

    console.log(`\n🎯 Starting Release Planning for Project: ${projectId}`);
    console.log(`⭐ CRITICAL SCOPE CONTROL MECHANISM`);
    console.log(''.padEnd(60, '='));

    // Check dependencies - release planning needs business and financial input
    if (!force) {
      const canExecute = this.dependencyManager.canExecuteModule('release');
      if (!canExecute.canExecute) {
        console.log(`❌ Cannot execute release planning: ${canExecute.reason}`);
        if (canExecute.missingDependencies.length > 0) {
          console.log(`💡 Run these commands first: ${canExecute.missingDependencies.map(dep => `/plan-${dep}`).join(', ')}`);
          console.log(`\n🔍 Why dependencies matter:`);
          console.log(`   • Business strategy provides strategic constraints`);
          console.log(`   • Financial planning provides budget and timeline constraints`);
          console.log(`   • Release planning then creates scope boundaries for technical work`);
        }
        return {
          success: false,
          error: canExecute.reason,
          missingDependencies: canExecute.missingDependencies
        };
      }
    }

    // Mark as in progress
    this.dependencyManager.updateModuleState('release', {
      status: ModuleStatus.IN_PROGRESS,
      startedAt: new Date(),
      errors: [],
      metadata: { projectId }
    });

    this.updateStateTracker('release', ModuleStatus.IN_PROGRESS);

    try {
      // Validate required inputs
      if (!projectDescription) {
        throw new Error('Project description is required for release planning');
      }

      // Get business constraints from previous planning
      const businessConstraints = this.stateTracker.getMetadata('businessConstraints') || {};
      const strategicFramework = this.stateTracker.getMetadata('strategicFramework') || {};
      const financialConstraints = this.stateTracker.getMetadata('financialConstraints') || {};

      console.log(`📋 Project: ${projectDescription.substring(0, 100)}...`);
      console.log(`🎯 Business Goal: ${businessConstraints.primaryGoal || 'Market validation'}`);
      console.log(`💰 Budget Level: ${financialConstraints.budgetLevel || businessConstraints.budgetConstraints || 'startup-level'}`);
      console.log(`⏱️  Timeline: ${strategicFramework.timeframe || 'medium'}`);

      // Execute release planning
      const startTime = Date.now();
      const result = await this.agent.planReleases(
        projectDescription,
        strategicFramework,
        financialConstraints,
        { projectId, businessConstraints }
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        // Mark as completed
        this.dependencyManager.updateModuleState('release', {
          status: ModuleStatus.COMPLETED,
          completedAt: new Date(),
          duration,
          outputs: ['release-roadmap.json', 'scope-constraints.json'],
          metadata: {
            projectId,
            totalReleases: result.releaseRoadmap.length,
            mvpTimeline: result.mvpDefinition.timeline,
            currentReleaseFeatures: result.constraints.currentReleaseScope.length
          }
        });

        this.updateStateTracker('release', ModuleStatus.COMPLETED, duration, result);

        // Display results with emphasis on scope control
        this.displayReleaseResults(result, duration);

        // Save release constraints for downstream technical planning
        await this.stateTracker.updateMetadata('releaseConstraints', result.constraints);
        await this.stateTracker.updateMetadata('releaseRoadmap', result.releaseRoadmap);
        await this.stateTracker.updateMetadata('mvpDefinition', result.mvpDefinition);
        await this.stateTracker.updateMetadata('featurePrioritization', result.featurePrioritization);

        return {
          success: true,
          result,
          duration,
          nextSteps: this.getNextSteps(result),
          scopeControl: {
            currentReleaseScope: result.constraints.currentReleaseScope,
            excludedFeatures: result.constraints.excludedFeatures,
            timeboxConstraints: result.constraints.timeboxConstraints
          }
        };

      } else {
        // Mark as failed but provide fallback
        this.dependencyManager.updateModuleState('release', {
          status: ModuleStatus.FAILED,
          completedAt: new Date(),
          duration,
          errors: [result.error],
          metadata: { projectId }
        });

        this.updateStateTracker('release', ModuleStatus.FAILED, duration, null, [result.error]);

        console.log(`❌ Release planning failed: ${result.error}`);
        
        if (result.fallback) {
          console.log(`\n📋 Using fallback release strategy:`);
          this.displayFallbackResults(result.fallback);
          
          // Save fallback strategy
          await this.stateTracker.updateMetadata('releaseConstraints', result.fallback.constraints);
          await this.stateTracker.updateMetadata('releaseRoadmap', result.fallback.releaseRoadmap);
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
      this.dependencyManager.updateModuleState('release', {
        status: ModuleStatus.FAILED,
        completedAt: new Date(),
        duration: 0,
        errors: [error.message],
        metadata: { projectId }
      });

      this.updateStateTracker('release', ModuleStatus.FAILED, 0, null, [error.message]);

      console.error(`💥 Release planning error: ${error.message}`);
      
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

  displayReleaseResults(result, duration) {
    console.log(`\n✅ Release Planning Completed in ${Math.round(duration / 1000)}s`);
    console.log(`⭐ SCOPE CONTROL MECHANISM ACTIVE`);
    console.log(''.padEnd(60, '-'));

    // MVP Definition - The Core Scope Boundary
    console.log(`\n🎯 MVP Definition (v${result.mvpDefinition.version}):`);
    console.log(`   Core Flow: ${result.mvpDefinition.coreFlow}`);
    console.log(`   Timeline: ${result.mvpDefinition.timeline} weeks`);
    console.log(`   Essential Features (${result.mvpDefinition.features.length}):`);
    result.mvpDefinition.features.forEach(feature => {
      console.log(`     • ${feature}`);
    });

    // Release Roadmap
    console.log(`\n📅 Release Roadmap (${result.releaseRoadmap.length} releases planned):`);
    result.releaseRoadmap.forEach((release, index) => {
      const isCurrent = index === 0;
      const prefix = isCurrent ? '🚀' : '📋';
      const suffix = isCurrent ? ' (CURRENT SCOPE)' : '';
      
      console.log(`   ${prefix} v${release.version} - ${release.goals}${suffix}`);
      console.log(`      Timeline: ${release.timeline} weeks`);
      console.log(`      Features: ${release.features.join(', ')}`);
      
      if (isCurrent) {
        console.log(`      ⚠️  TECHNICAL PLANNING WILL BE LIMITED TO THESE FEATURES ONLY`);
      }
    });

    // Critical Scope Control Information
    console.log(`\n🔒 SCOPE CONTROL CONSTRAINTS:`);
    console.log(`   Current Release Scope: ${result.constraints.currentReleaseScope.length} features`);
    result.constraints.currentReleaseScope.forEach(feature => {
      console.log(`     ✅ ${feature}`);
    });

    if (result.constraints.excludedFeatures.length > 0) {
      console.log(`\n   Excluded from Current Release: ${result.constraints.excludedFeatures.length} features`);
      result.constraints.excludedFeatures.slice(0, 5).forEach(feature => {
        console.log(`     ❌ ${feature} (deferred to future release)`);
      });
      
      if (result.constraints.excludedFeatures.length > 5) {
        console.log(`     ... and ${result.constraints.excludedFeatures.length - 5} more`);
      }
    }

    // Timebox Constraints
    console.log(`\n⏰ Timebox Constraints for Technical Planning:`);
    const timebox = result.constraints.timeboxConstraints;
    console.log(`   Current Release Deadline: ${timebox.currentReleaseDeadline}`);
    console.log(`   Epic Time Limit: ${timebox.epicTimeLimit} days`);
    console.log(`   Feature Time Limit: ${timebox.featureTimeLimit} days`);
    console.log(`   Hard Deadline: ${timebox.hardDeadline} weeks maximum`);

    // Priority Matrix
    console.log(`\n📊 Feature Prioritization Matrix:`);
    console.log(`   Must Have: ${result.featurePrioritization.priorityMatrix['must-have'].length} features`);
    console.log(`   Should Have: ${result.featurePrioritization.priorityMatrix['should-have'].length} features`);
    console.log(`   Could Have: ${result.featurePrioritization.priorityMatrix['could-have'].length} features`);
    console.log(`   Won't Have (this release): ${result.featurePrioritization.priorityMatrix['wont-have'].length} features`);
  }

  displayFallbackResults(fallback) {
    console.log(`\n📋 Fallback Release Strategy:`);
    console.log(`   MVP: v${fallback.mvpDefinition.version} - ${fallback.mvpDefinition.timeline} weeks`);
    console.log(`   Scope: ${fallback.constraints.currentReleaseScope.join(', ')}`);
    
    fallback.releaseRoadmap.forEach(release => {
      console.log(`   • v${release.version}: ${release.goals} (${release.timeline} weeks)`);
    });
  }

  getNextSteps(result) {
    const nextSteps = [];
    
    // Technical planning is now unblocked and constrained
    nextSteps.push('🚀 SCOPE-CONTROLLED TECHNICAL PLANNING NOW AVAILABLE:');
    nextSteps.push(`   Run /plan-tasks to decompose ONLY current release features (v${result.releaseRoadmap[0].version})`);
    nextSteps.push(`   Run /plan-tech to select technology stack for current scope`);
    
    // Other planning modules
    const readyModules = this.dependencyManager.getReadyModules();
    if (readyModules.length > 0) {
      nextSteps.push('');
      nextSteps.push('📋 Other ready modules:');
      readyModules.forEach(module => {
        if (!['tasks', 'tech'].includes(module)) {
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
      usage: '/plan-release --project=PROJECT_ID --description="PROJECT_DESCRIPTION" [--force]',
      requiredParams: ['project', 'description'],
      optionalParams: ['force'],
      examples: [
        '/plan-release --project=sage-phr --description="HIPAA-compliant PHR platform"',
        '/plan-release --project=ecommerce --description="B2B marketplace platform"'
      ],
      dependencies: ['business', 'financial'],
      blocks: ['tasks', 'tech'],
      criticalNote: 'This command provides SCOPE CONTROL - it constrains technical planning to realistic release boundaries'
    };
  }
}

module.exports = PlanReleaseCommand;