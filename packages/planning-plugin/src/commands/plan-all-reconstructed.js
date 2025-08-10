/**
 * Plan All Command - RECONSTRUCTED with Tony Orchestration
 * 
 * This is the reconstructed version that implements autonomous agent orchestration
 * using Tony Planning Orchestrator for complete UPP hierarchy decomposition.
 * 
 * Architecture Changes:
 * - Replaces domain-specific planning with hierarchical UPP decomposition
 * - Integrates Tony orchestration layer for agent spawning and coordination
 * - Implements fully autonomous execution (no user prompts)
 * - Creates complete Epic → Atomic task hierarchy
 * - Populates database and creates task files
 */

const { Logger } = require('../utils/Logger');
const { StateTracker } = require('../core/state-tracker');
const { TonyPlanningOrchestrator } = require('../core/TonyPlanningOrchestrator');
const { SequentialTaskService } = require('../../mcp-server/src/services/SequentialTaskService');
const { MosAIcProjectReader } = require('../utils/MosAIcProjectReader');

// Legacy domain planners (for backwards compatibility and constraint gathering)
const PlanBusinessCommand = require('./plan-business');
const PlanFinancialCommand = require('./plan-financial');
const PlanMarketingCommand = require('./plan-marketing');
const PlanReleaseCommand = require('./plan-release');
const PlanTechCommand = require('./plan-tech');

class PlanAllReconstructedCommand {
  constructor() {
    this.name = 'plan-all';
    this.description = 'Execute complete UPP decomposition with autonomous Tony orchestration';
    this.logger = new Logger('PlanAllReconstructed');
    this.stateTracker = null;
    this.tonyOrchestrator = null;
    this.sequentialTaskService = null;
    this.projectReader = new MosAIcProjectReader();
    
    // Legacy planners for constraint gathering
    this.legacyPlanners = {
      business: new PlanBusinessCommand(),
      financial: new PlanFinancialCommand(),
      marketing: new PlanMarketingCommand(),
      release: new PlanReleaseCommand(),
      tech: new PlanTechCommand()
    };
  }

  async initialize(projectId) {
    this.logger.info('Initializing reconstructed plan-all with Tony orchestration');
    
    // Initialize core components
    this.stateTracker = new StateTracker({ projectId });
    await this.stateTracker.initialize();
    
    this.sequentialTaskService = new SequentialTaskService(this.logger);
    await this.sequentialTaskService.initialize();
    
    this.tonyOrchestrator = new TonyPlanningOrchestrator(
      this.logger,
      this.stateTracker,
      this.sequentialTaskService
    );

    // Initialize legacy planners for constraint gathering
    for (const [name, planner] of Object.entries(this.legacyPlanners)) {
      await planner.initialize(projectId);
    }
    
    this.logger.info('Tony orchestration system initialized');
  }

  /**
   * Main execution - Autonomous Tony orchestration
   */
  async execute(options = {}) {
    const { 
      projectId = 'mosaic-sdk',
      description = '',
      timeline,
      budget,
      teamSize,
      constraintsMode = 'hybrid', // 'legacy', 'ai', 'hybrid'
      skipConstraints = false,
      verbose = false
    } = options;
    
    if (!this.tonyOrchestrator) {
      await this.initialize(projectId);
    }

    console.log(`\n🚀 TONY PLANNING ORCHESTRATOR - Autonomous UPP Decomposition`);
    console.log(`📋 Project: ${projectId}`);
    console.log(`🎯 Mode: Fully autonomous agent coordination`);
    console.log(''.padEnd(80, '='));
    
    if (description) {
      console.log(`📋 Project Description: ${description}`);
    } else {
      // Try to get description from MosAIc project configuration
      const projectConfig = await this.projectReader.getProjectConfig();
      options.description = projectConfig.description;
      console.log(`📋 Project Description: ${projectConfig.description}`);
    }

    const startTime = Date.now();

    try {
      // Phase 1: Constraint Gathering (Optional - can be skipped for pure UPP)
      let constraints = {};
      if (!skipConstraints) {
        console.log(`\n📋 PHASE 1: CONSTRAINT GATHERING`);
        console.log('🔄 Gathering business, technical, and resource constraints...');
        console.log(''.padEnd(60, '-'));

        constraints = await this.gatherConstraints(options, constraintsMode);
        
        console.log(`✅ Constraints gathered:${this.formatConstraintsSummary(constraints)}`);
      }

      // Phase 2: Tony Orchestration - Autonomous UPP Decomposition
      console.log(`\n🎯 PHASE 2: TONY ORCHESTRATION - UPP DECOMPOSITION`);
      console.log('🤖 Tony deploying specialized agents for hierarchical decomposition...');
      console.log('🔄 Epic → Feature → Story → Task → Subtask → Atomic');
      console.log(''.padEnd(60, '-'));

      const orchestrationConfig = {
        projectId,
        description: options.description || description,
        context: {
          timeline,
          budget,
          teamSize,
          constraints: constraints.technicalConstraints || [],
          stakeholders: constraints.stakeholders || []
        },
        options: {
          maxParallelAgents: 3,
          useHybridDeployment: true,
          enableProgressMonitoring: true,
          enableErrorRecovery: true,
          createTaskFiles: true,
          populateDatabase: true
        }
      };

      // Execute Tony orchestration
      const orchestrationResult = await this.tonyOrchestrator.orchestrateUPPDecomposition(orchestrationConfig);

      const duration = Date.now() - startTime;

      // Phase 3: Results Summary
      console.log(`\n🎉 TONY ORCHESTRATION COMPLETE`);
      console.log(''.padEnd(80, '='));
      console.log(`⏱️ Total Duration: ${Math.round(duration / 1000)}s`);
      console.log(`🤖 Agents Spawned: ${orchestrationResult.metadata.agentsSpawned}`);
      console.log(`✅ Success: ${orchestrationResult.success ? 'Yes' : 'No'}`);

      if (orchestrationResult.success) {
        this.displayOrchestrationResults(orchestrationResult);
        this.displayNextSteps(orchestrationResult);
      } else {
        console.log(`\n❌ Orchestration Errors:`);
        orchestrationResult.errors.forEach(error => console.log(`   • ${error}`));
      }

      return {
        success: orchestrationResult.success,
        mode: 'tony-orchestration',
        orchestrationResult,
        constraints,
        duration,
        nextSteps: orchestrationResult.nextSteps
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error(`\n💥 TONY ORCHESTRATION FAILED: ${error.message}`);
      
      this.logger.error('Tony orchestration execution failed', error);

      return {
        success: false,
        mode: 'tony-orchestration',
        error: error.message,
        duration,
        fallbackAvailable: true,
        nextSteps: [
          'Check Tony orchestration logs for errors',
          'Verify agent deployment permissions',
          'Consider running with --skip-constraints for debugging',
          'Fall back to legacy domain planning if needed'
        ]
      };
    }
  }

  /**
   * Gather constraints using legacy planners or AI
   */
  async gatherConstraints(options, mode) {
    const constraints = {
      businessConstraints: {},
      technicalConstraints: [],
      resourceConstraints: {},
      stakeholders: [],
      qualityGates: []
    };

    try {
      if (mode === 'legacy' || mode === 'hybrid') {
        // Use legacy planners for rapid constraint gathering
        console.log(`🔄 Running business constraint analysis...`);
        const businessResult = await this.legacyPlanners.business.execute(options);
        
        if (businessResult.success) {
          constraints.businessConstraints = businessResult.businessConstraints || {};
          constraints.stakeholders = businessResult.stakeholderAlignment?.primaryStakeholders || [];
        }

        console.log(`🔄 Running release scope constraints...`);
        const releaseResult = await this.legacyPlanners.release.execute(options);
        
        if (releaseResult.success) {
          constraints.qualityGates = releaseResult.keyDecisions?.qualityGates || [];
        }

        if (mode === 'hybrid') {
          // Enhance with AI-driven constraint analysis
          console.log(`🔄 AI enhancement of constraints...`);
          await this.enhanceConstraintsWithAI(constraints, options);
        }
      } else if (mode === 'ai') {
        // Pure AI constraint analysis
        await this.gatherConstraintsWithAI(constraints, options);
      }

      return constraints;

    } catch (error) {
      this.logger.warn('Constraint gathering failed, using minimal constraints', { error: error.message });
      
      return {
        businessConstraints: { scope: 'mvp', timeline: 'medium' },
        technicalConstraints: ['maintainable', 'scalable'],
        resourceConstraints: { budget: 'startup-level', team: 'small' },
        stakeholders: ['product-owner', 'development-team'],
        qualityGates: ['user-validation', 'technical-feasibility']
      };
    }
  }

  /**
   * Display orchestration results
   */
  displayOrchestrationResults(result) {
    console.log(`\n📊 UPP HIERARCHY CREATED:`);
    console.log(''.padEnd(60, '-'));

    const hierarchy = result.hierarchy;

    if (hierarchy.epic) {
      console.log(`🎯 Epic: ${hierarchy.epic.title} (${hierarchy.epic.id})`);
      console.log(`   Estimated: ${hierarchy.epic.estimatedHours}h`);
    }

    console.log(`\n📦 Features: ${hierarchy.features.length}`);
    hierarchy.features.slice(0, 3).forEach(feature => {
      console.log(`   • ${feature.title} (${feature.id}) - ${feature.estimatedHours}h`);
    });
    if (hierarchy.features.length > 3) {
      console.log(`   ... and ${hierarchy.features.length - 3} more features`);
    }

    console.log(`\n📖 User Stories: ${hierarchy.stories.length}`);
    console.log(`🔨 Tasks: ${hierarchy.tasks.length}`);
    console.log(`⚙️ Subtasks: ${hierarchy.subtasks.length}`);
    console.log(`⚛️ Atomic Tasks: ${hierarchy.atomic.length} (ready for execution)`);

    console.log(`\n📈 SUMMARY METRICS:`);
    console.log(`   Total Tasks: ${result.metadata.totalTasks}`);
    console.log(`   Total Estimated Hours: ${result.metadata.totalEstimatedHours}`);
    console.log(`   Hierarchy Depth: ${result.metadata.hierarchyDepth} levels`);
    console.log(`   Agents Coordinated: ${result.metadata.agentsSpawned}`);

    if (result.agents && result.agents.length > 0) {
      console.log(`\n🤖 AGENT DEPLOYMENT SUMMARY:`);
      const agentsByPersona = result.agents.reduce((acc, agent) => {
        acc[agent.persona] = (acc[agent.persona] || 0) + 1;
        return acc;
      }, {});

      Object.entries(agentsByPersona).forEach(([persona, count]) => {
        console.log(`   ${persona}: ${count} deployments`);
      });

      const completedAgents = result.agents.filter(a => a.status === 'completed').length;
      const failedAgents = result.agents.filter(a => a.status === 'failed').length;
      
      console.log(`\n   ✅ Completed: ${completedAgents}`);
      if (failedAgents > 0) {
        console.log(`   ❌ Failed: ${failedAgents}`);
      }
    }
  }

  /**
   * Display next steps
   */
  displayNextSteps(result) {
    console.log(`\n🚀 NEXT STEPS:`);
    console.log(''.padEnd(40, '-'));

    if (result.nextSteps && result.nextSteps.length > 0) {
      result.nextSteps.forEach((step, index) => {
        console.log(`${index + 1}. ${step}`);
      });
    } else {
      console.log(`1. Review generated task hierarchy`);
      console.log(`2. Assign atomic tasks to implementation agents`);
      console.log(`3. Begin parallel task execution`);
      console.log(`4. Monitor progress through UPP task system`);
    }

    console.log(`\n💡 AVAILABLE COMMANDS:`);
    console.log(`   /task-status    - View task completion status`);
    console.log(`   /assign-tasks   - Assign tasks to agents`);
    console.log(`   /start-impl     - Begin implementation phase`);
    console.log(`   /plan-status    - View detailed planning status`);
  }

  /**
   * Format constraints summary
   */
  formatConstraintsSummary(constraints) {
    const items = [];
    
    if (constraints.businessConstraints?.scope) {
      items.push(`scope=${constraints.businessConstraints.scope}`);
    }
    if (constraints.resourceConstraints?.budget) {
      items.push(`budget=${constraints.resourceConstraints.budget}`);
    }
    if (constraints.technicalConstraints?.length) {
      items.push(`tech=${constraints.technicalConstraints.length} items`);
    }
    if (constraints.stakeholders?.length) {
      items.push(`stakeholders=${constraints.stakeholders.length}`);
    }

    return items.length > 0 ? `\n   ${items.join(', ')}` : ' (minimal)';
  }

  /**
   * AI-based constraint enhancement
   */
  async enhanceConstraintsWithAI(constraints, options) {
    // Implementation for AI-driven constraint enhancement
    this.logger.info('Enhancing constraints with AI analysis');
    
    // This would use the SequentialTaskService to analyze the project description
    // and generate additional constraints
  }

  async gatherConstraintsWithAI(constraints, options) {
    // Implementation for pure AI constraint gathering
    this.logger.info('Gathering constraints with AI analysis');
  }

  // Command interface methods
  getCommandInfo() {
    return {
      name: this.name,
      description: 'Execute complete UPP decomposition with autonomous Tony orchestration',
      usage: '/plan-all --project=PROJECT_ID --description=\"Project description\" [options]',
      requiredParams: ['project', 'description'],
      optionalParams: [
        'timeline', 'budget', 'team-size', 
        'constraints-mode', 'skip-constraints', 'verbose'
      ],
      examples: [
        '/plan-all --project=sage-phr --description=\"HIPAA-compliant PHR platform\"',
        '/plan-all --project=ecommerce --description=\"B2B marketplace\" --constraints-mode=hybrid',
        '/plan-all --project=fintech --description=\"Digital payments\" --skip-constraints --verbose'
      ],
      dependencies: [],
      blocks: [],
      keyFeature: 'Autonomous UPP decomposition with Tony agent orchestration (Epic → Atomic tasks)',
      architectureChange: 'MAJOR: Replaces domain planning with hierarchical task decomposition'
    };
  }

  /**
   * Fallback mode - use legacy domain planning
   */
  async executeLegacyMode(options) {
    console.log(`\n⚠️  FALLBACK: Using legacy domain planning mode`);
    console.log(`🔄 This will run the original business → tech planning pipeline`);
    
    // Import and execute the original plan-all
    const LegacyPlanAll = require('./plan-all');
    const legacyPlanner = new LegacyPlanAll();
    await legacyPlanner.initialize(options.projectId || 'default');
    return await legacyPlanner.execute(options);
  }
}

module.exports = PlanAllReconstructedCommand;