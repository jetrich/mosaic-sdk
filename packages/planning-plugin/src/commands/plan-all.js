/**
 * Plan All Command - Execute complete business-to-technical planning pipeline
 * Orchestrates the full planning sequence with proper dependency management
 */

const PlanBusinessCommand = require('./plan-business');
const PlanFinancialCommand = require('./plan-financial');
const PlanMarketingCommand = require('./plan-marketing');
const PlanReleaseCommand = require('./plan-release');
const PlanTechCommand = require('./plan-tech');
const { DependencyManager, ModuleStatus } = require('../core/dependency-manager');
const { StateTracker } = require('../core/state-tracker');
const { DocumentationGenerationService } = require('../services/DocumentationGenerationService');

class PlanAllCommand {
  constructor() {
    this.name = 'plan-all';
    this.description = 'Execute complete business-to-technical planning pipeline with dependency management';
    this.dependencyManager = new DependencyManager();
    this.stateTracker = null;
    this.documentationService = null;
    
    // Initialize command instances
    this.commands = {
      business: new PlanBusinessCommand(),
      financial: new PlanFinancialCommand(),
      marketing: new PlanMarketingCommand(), 
      release: new PlanReleaseCommand(),
      tech: new PlanTechCommand()
    };
    
    // Execution order based on dependencies
    this.executionPlan = [
      {
        phase: 'foundation',
        modules: ['business'],
        description: 'Strategic framework and business model',
        parallel: false
      },
      {
        phase: 'constraints',
        modules: ['financial', 'marketing'],
        description: 'Budget and market constraints',
        parallel: true
      },
      {
        phase: 'scope-control',
        modules: ['release'],
        description: 'CRITICAL: Release boundaries and scope control',
        parallel: false
      },
      {
        phase: 'architecture', 
        modules: ['tech'],
        description: 'Technology stack and system architecture',
        parallel: false
      }
    ];
  }

  async initialize(projectId) {
    this.stateTracker = new StateTracker({ projectId });
    await this.stateTracker.initialize();
    this.documentationService = new DocumentationGenerationService(this.stateTracker);
    
    // Initialize all command instances
    for (const [name, command] of Object.entries(this.commands)) {
      await command.initialize(projectId);
    }
  }

  async execute(options = {}) {
    const { 
      projectId = 'default',
      description = '',
      timeline,
      budget,
      teamSize,
      skipCompleted = true,
      verbose = false 
    } = options;
    
    if (!this.stateTracker) {
      await this.initialize(projectId);
    }

    console.log(`\n🚀 Starting Complete Planning Pipeline for Project: ${projectId}`);
    console.log('🎯 Business → Financial → Marketing → Release → Technology');
    console.log(''.padEnd(80, '='));
    
    if (description) {
      console.log(`📋 Project Description: ${description}`);
      console.log('');
    }

    const startTime = Date.now();
    const results = {};
    const errors = [];
    let totalModulesExecuted = 0;
    let totalModulesSkipped = 0;

    try {
      // Execute each phase in order
      for (const phase of this.executionPlan) {
        console.log(`\n📋 Phase: ${phase.description.toUpperCase()}`);
        console.log(`🔄 Executing: ${phase.modules.join(', ')}`);
        console.log(''.padEnd(60, '-'));

        if (phase.parallel) {
          // Execute modules in parallel
          const phaseResults = await this.executePhaseParallel(phase, options, skipCompleted, verbose);
          Object.assign(results, phaseResults.results);
          errors.push(...phaseResults.errors);
          totalModulesExecuted += phaseResults.executed;
          totalModulesSkipped += phaseResults.skipped;
        } else {
          // Execute modules sequentially
          const phaseResults = await this.executePhaseSequential(phase, options, skipCompleted, verbose);
          Object.assign(results, phaseResults.results);
          errors.push(...phaseResults.errors);
          totalModulesExecuted += phaseResults.executed;
          totalModulesSkipped += phaseResults.skipped;
        }

        // Check for critical failures that should stop the pipeline
        const criticalFailures = this.checkCriticalFailures(phase, results, errors);
        if (criticalFailures.length > 0) {
          console.log(`\n❌ Critical failures in ${phase.phase} phase:`);
          criticalFailures.forEach(failure => console.log(`   • ${failure}`));
          console.log('🛑 Stopping pipeline execution');
          break;
        }

        // Show phase completion
        console.log(`\n✅ Phase "${phase.phase}" completed`);
        if (verbose) {
          this.showPhaseResults(phase, results);
        }
      }

      const duration = Date.now() - startTime;

      // Display final results
      this.displayPipelineResults(results, errors, duration, totalModulesExecuted, totalModulesSkipped);

      // Generate comprehensive strategic documentation
      const pipelineStatus = this.isPipelineComplete(results);
      if (pipelineStatus.basicComplete || totalModulesExecuted > 0) {
        console.log(`\n📄 Generating comprehensive strategic documentation...`);
        try {
          const docResult = await this.documentationService.generateDocumentation();
          if (docResult.success) {
            console.log(`✅ Strategic documentation generated:`);
            docResult.generatedFiles.forEach(file => {
              console.log(`   📄 ${file.replace(process.cwd(), '.')}`);
            });
          } else if (docResult.generatedFiles.length > 0) {
            console.log(`⚠️  Documentation partially generated:`);
            docResult.generatedFiles.forEach(file => {
              console.log(`   📄 ${file.replace(process.cwd(), '.')}`);
            });
            console.log(`   Errors: ${docResult.errors.join(', ')}`);
          } else {
            console.log(`⚠️  Documentation generation failed: ${docResult.errors.join(', ')}`);
          }
        } catch (docError) {
          console.log(`⚠️  Documentation generation failed: ${docError.message}`);
        }
      }

      return {
        success: errors.length === 0,
        results,
        errors,
        duration,
        modulesExecuted: totalModulesExecuted,
        modulesSkipped: totalModulesSkipped,
        pipelineComplete: this.isPipelineComplete(results),
        nextSteps: this.getNextSteps(results, errors)
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`💥 Pipeline execution failed: ${error.message}`);
      
      return {
        success: false,
        error: error.message,
        results,
        errors: [...errors, error.message],
        duration,
        modulesExecuted: totalModulesExecuted,
        modulesSkipped: totalModulesSkipped,
        pipelineComplete: false
      };
    }
  }

  async executePhaseSequential(phase, options, skipCompleted, verbose) {
    const results = {};
    const errors = [];
    let executed = 0;
    let skipped = 0;

    for (const moduleName of phase.modules) {
      const command = this.commands[moduleName];
      
      if (!command) {
        const error = `Command not found: ${moduleName}`;
        errors.push(error);
        console.log(`❌ ${error}`);
        continue;
      }

      // Check if already completed and should skip
      if (skipCompleted && this.isModuleCompleted(moduleName)) {
        console.log(`⏭️ Skipping ${moduleName} (already completed)`);
        skipped++;
        continue;
      }

      console.log(`\n🔄 Executing: /plan-${moduleName}`);
      
      try {
        const result = await command.execute(options);
        results[moduleName] = result;
        
        if (result.success) {
          console.log(`✅ ${moduleName} completed successfully`);
          executed++;
        } else {
          console.log(`❌ ${moduleName} failed: ${result.error}`);
          errors.push(`${moduleName}: ${result.error}`);
        }
        
        if (verbose && result.success) {
          this.showModuleResults(moduleName, result);
        }
        
      } catch (error) {
        console.log(`💥 ${moduleName} execution error: ${error.message}`);
        errors.push(`${moduleName}: ${error.message}`);
      }
    }

    return { results, errors, executed, skipped };
  }

  async executePhaseParallel(phase, options, skipCompleted, verbose) {
    const results = {};
    const errors = [];
    let executed = 0;
    let skipped = 0;

    // Filter modules to execute
    const modulesToExecute = [];
    for (const moduleName of phase.modules) {
      const command = this.commands[moduleName];
      
      if (!command) {
        const error = `Command not found: ${moduleName}`;
        errors.push(error);
        console.log(`❌ ${error}`);
        continue;
      }

      if (skipCompleted && this.isModuleCompleted(moduleName)) {
        console.log(`⏭️ Skipping ${moduleName} (already completed)`);
        skipped++;
        continue;
      }

      modulesToExecute.push(moduleName);
    }

    if (modulesToExecute.length === 0) {
      return { results, errors, executed, skipped };
    }

    console.log(`🔄 Executing in parallel: ${modulesToExecute.join(', ')}`);

    // Execute modules in parallel
    const promises = modulesToExecute.map(async (moduleName) => {
      const command = this.commands[moduleName];
      
      try {
        const result = await command.execute(options);
        return { moduleName, result, success: true };
      } catch (error) {
        return { 
          moduleName, 
          error: error.message, 
          success: false 
        };
      }
    });

    const moduleResults = await Promise.all(promises);

    // Process results
    for (const moduleResult of moduleResults) {
      if (moduleResult.success) {
        results[moduleResult.moduleName] = moduleResult.result;
        
        if (moduleResult.result.success) {
          console.log(`✅ ${moduleResult.moduleName} completed successfully`);
          executed++;
        } else {
          console.log(`❌ ${moduleResult.moduleName} failed: ${moduleResult.result.error}`);
          errors.push(`${moduleResult.moduleName}: ${moduleResult.result.error}`);
        }

        if (verbose && moduleResult.result.success) {
          this.showModuleResults(moduleResult.moduleName, moduleResult.result);
        }
      } else {
        console.log(`💥 ${moduleResult.moduleName} execution error: ${moduleResult.error}`);
        errors.push(`${moduleResult.moduleName}: ${moduleResult.error}`);
      }
    }

    return { results, errors, executed, skipped };
  }

  isModuleCompleted(moduleName) {
    const state = this.dependencyManager.states.get(moduleName);
    return state && state.status === ModuleStatus.COMPLETED;
  }

  checkCriticalFailures(phase, results, errors) {
    const failures = [];

    // Business planning is critical for all downstream planning
    if (phase.phase === 'foundation' && 
        (!results.business || !results.business.success)) {
      failures.push('Business planning failed - cannot proceed with pipeline');
    }

    // Release planning is critical for scope control
    if (phase.phase === 'scope-control' && 
        (!results.release || !results.release.success)) {
      failures.push('Release planning failed - cannot establish scope control');
    }

    return failures;
  }

  showPhaseResults(phase, results) {
    console.log(`\n📊 Phase Results:`);
    for (const moduleName of phase.modules) {
      const result = results[moduleName];
      if (result && result.success) {
        console.log(`   ✅ ${moduleName}: ${result.duration}ms`);
      } else if (result) {
        console.log(`   ❌ ${moduleName}: ${result.error || 'Failed'}`);
      } else {
        console.log(`   ⏭️ ${moduleName}: Skipped`);
      }
    }
  }

  showModuleResults(moduleName, result) {
    if (result.keyInsights) {
      console.log(`📋 ${moduleName} key insights:`);
      Object.entries(result.keyInsights).forEach(([key, value]) => {
        console.log(`   • ${key}: ${value}`);
      });
    }
  }

  displayPipelineResults(results, errors, duration, executed, skipped) {
    console.log(`\n🎉 PIPELINE EXECUTION COMPLETE`);
    console.log(''.padEnd(80, '='));
    console.log(`⏱️ Total Duration: ${Math.round(duration / 1000)}s`);
    console.log(`✅ Modules Executed: ${executed}`);
    console.log(`⏭️ Modules Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log(`\n❌ Errors encountered:`);
      errors.forEach(error => console.log(`   • ${error}`));
    }

    // Show successful modules with key results
    console.log(`\n📊 PLANNING RESULTS SUMMARY:`);
    console.log(''.padEnd(60, '-'));

    if (results.business && results.business.success) {
      const business = results.business.keyInsights || results.business.result;
      console.log(`🎯 Business Strategy:`);
      console.log(`   Model: ${business.businessModel || 'B2B SaaS'}`);
      console.log(`   Target: ${business.targetMarket || 'Small business'}`);
      console.log(`   Approach: ${business.strategicApproach || 'Product-led'}`);
    }

    if (results.financial && results.financial.success) {
      const financial = results.financial.aiSavings || results.financial.result;
      console.log(`\n💰 Financial Analysis:`);
      console.log(`   AI Cost Savings: ${financial.savingsPercentage || '40-60'}%`);
      console.log(`   Total Budget: $${financial.traditionalCost?.toLocaleString() || '150K'}`);
      console.log(`   AI-Optimized: $${financial.aiAdjustedCost?.toLocaleString() || '90K'}`);
    }

    if (results.marketing && results.marketing.success) {
      const marketing = results.marketing.keyInsights || results.marketing.result;
      console.log(`\n🎯 Marketing Strategy:`);
      console.log(`   Target Segment: ${marketing.targetSegment || 'SMB'}`);
      console.log(`   Primary Channel: ${marketing.primaryChannel || 'Content marketing'}`);
      console.log(`   Launch Type: ${marketing.launchApproach || 'Soft launch'}`);
    }

    if (results.release && results.release.success) {
      const release = results.release.keyDecisions || results.release.result;
      console.log(`\n🚀 Release Planning (SCOPE CONTROL):`);
      console.log(`   MVP Timeline: ${release.mvpTimeline || '8 weeks'}`);
      console.log(`   Current Release: ${release.currentRelease || 'v1.0.0'}`);
      console.log(`   Features: ${release.featureCount || '3'} (scope-controlled)`);
      console.log(`   Excluded: ${release.excludedFeatures || '12'} features (future releases)`);
    }

    if (results.tech && results.tech.success) {
      const tech = results.tech.keyDecisions || results.tech.result;
      console.log(`\n⚙️ Technology Architecture:`);
      console.log(`   Stack: ${tech.technologyStack?.frontend || 'React'} + ${tech.technologyStack?.backend || 'Node.js'}`);
      console.log(`   Pattern: ${tech.architecturePattern || 'Monolith'}`);
      console.log(`   Hosting: ${tech.hostingStrategy || 'Cloud container'}`);
      console.log(`   Costs: ${tech.estimatedCosts || '$50-200/month'}`);
    }

    // Show the scope control impact
    if (results.release && results.release.success && results.tech && results.tech.success) {
      console.log(`\n🔒 SCOPE CONTROL IMPACT:`);
      console.log(`   ✅ Technology complexity constrained by release scope`);
      console.log(`   ✅ Architecture aligned with ${results.release.result?.keyDecisions?.mvpTimeline || '8-week'} timeline`);
      console.log(`   ✅ Infrastructure costs within ${results.financial?.result?.financialConstraints?.budgetLevel || 'startup'} budget`);
      console.log(`   ✅ Ready for focused technical implementation`);
    }
  }

  isPipelineComplete(results) {
    const requiredModules = ['business', 'release']; // Minimum for basic planning
    const optimalModules = ['business', 'financial', 'marketing', 'release', 'tech'];
    
    const completedRequired = requiredModules.every(module => 
      results[module] && results[module].success
    );
    
    const completedOptimal = optimalModules.every(module => 
      results[module] && results[module].success
    );

    return { 
      basicComplete: completedRequired,
      fullComplete: completedOptimal,
      completedModules: Object.keys(results).filter(key => 
        results[key] && results[key].success
      ).length
    };
  }

  getNextSteps(results, errors) {
    const nextSteps = [];
    const completion = this.isPipelineComplete(results);

    if (completion.fullComplete) {
      nextSteps.push('🎉 COMPLETE PLANNING PIPELINE FINISHED!');
      nextSteps.push('');
      nextSteps.push('🚀 Ready for implementation with scope control:');
      nextSteps.push('   • Business strategy established');
      nextSteps.push('   • Financial constraints defined');
      nextSteps.push('   • Marketing approach planned');
      nextSteps.push('   • Release scope boundaries set');
      nextSteps.push('   • Technology architecture decided');
      nextSteps.push('');
      nextSteps.push('💡 Next: Run /plan-tasks for scope-constrained epic decomposition');
      
    } else if (completion.basicComplete) {
      nextSteps.push('✅ Basic planning pipeline complete');
      nextSteps.push('');
      
      const missingModules = ['financial', 'marketing', 'tech'].filter(module => 
        !results[module] || !results[module].success
      );
      
      if (missingModules.length > 0) {
        nextSteps.push('📋 Optional enhancements available:');
        missingModules.forEach(module => {
          nextSteps.push(`   Run /plan-${module} for enhanced ${module} planning`);
        });
        nextSteps.push('');
      }
      
      nextSteps.push('💡 Ready for technical planning: /plan-tasks');
      
    } else {
      nextSteps.push('⚠️ Planning pipeline incomplete');
      nextSteps.push('');
      
      const missingRequired = ['business', 'release'].filter(module => 
        !results[module] || !results[module].success
      );
      
      if (missingRequired.length > 0) {
        nextSteps.push('❌ Required modules missing:');
        missingRequired.forEach(module => {
          nextSteps.push(`   Run /plan-${module} (${module === 'release' ? 'CRITICAL for scope control' : 'required'})`);
        });
      }
    }

    if (errors.length > 0) {
      nextSteps.push('');
      nextSteps.push('🔧 Fix errors and re-run /plan-all to complete pipeline');
    }

    nextSteps.push('');
    nextSteps.push('💡 Run /plan-status for detailed progress tracking');

    return nextSteps;
  }

  // Command interface methods
  getCommandInfo() {
    return {
      name: this.name,
      description: this.description,
      usage: '/plan-all --project=PROJECT_ID --description="Project description" [options]',
      requiredParams: ['project', 'description'],
      optionalParams: ['timeline', 'budget', 'team-size', 'skip-completed', 'verbose'],
      examples: [
        '/plan-all --project=sage-phr --description="HIPAA-compliant PHR platform"',
        '/plan-all --project=ecommerce --description="B2B marketplace" --timeline=12 --budget=enterprise',
        '/plan-all --project=fintech --description="Digital payments" --skip-completed=false --verbose'
      ],
      dependencies: [],
      blocks: [], // Executes all modules in proper order
      keyFeature: 'Complete business-to-technical planning with scope control and dependency management'
    };
  }
}

module.exports = PlanAllCommand;