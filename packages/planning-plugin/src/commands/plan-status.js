/**
 * Plan Status Command - Shows completion state of all planning modules
 * Core command for dependency tracking and progress visibility
 */

const { DependencyManager } = require('../core/dependency-manager');
const { StateTracker } = require('../core/state-tracker');

class PlanStatusCommand {
  constructor() {
    this.name = 'plan-status';
    this.description = 'Show completion state of all planning modules';
    this.dependencyManager = new DependencyManager();
    this.stateTracker = null;
  }

  async initialize(projectId) {
    this.stateTracker = new StateTracker({ projectId });
    await this.stateTracker.initialize();
  }

  async execute(options = {}) {
    const { verbose = false, projectId = 'default' } = options;
    
    if (!this.stateTracker) {
      await this.initialize(projectId);
    }

    console.log(`\n📋 Planning Status for Project: ${projectId}`);
    console.log(''.padEnd(60, '='));

    // Get current session and stats
    const session = this.stateTracker.getCurrentSession();
    const stats = this.stateTracker.getSessionStats();

    if (!session) {
      console.log('❌ No planning session found. Run /plan-business to start.');
      return {
        success: false,
        error: 'No active planning session'
      };
    }

    // Display overall progress
    this.displayOverallProgress(stats);
    
    // Display module status
    this.displayModuleStatus(verbose);
    
    // Display ready modules
    this.displayReadyModules();
    
    // Display blocked modules
    this.displayBlockedModules(verbose);
    
    // Display session info
    if (verbose) {
      this.displaySessionInfo(session, stats);
    }

    return {
      success: true,
      stats,
      session: session ? {
        sessionId: session.sessionId,
        lastUpdated: session.lastUpdated,
        totalModules: stats.totalModules
      } : null
    };
  }

  displayOverallProgress(stats) {
    const progressBar = this.createProgressBar(stats.completionPercentage);
    
    console.log(`\n🎯 Overall Progress: ${stats.completionPercentage}%`);
    console.log(`${progressBar}`);
    console.log(`   ✅ Completed: ${stats.completedModules}/${stats.totalModules} modules`);
    console.log(`   🔄 In Progress: ${stats.inProgressModules}`);
    console.log(`   ⏸️  Blocked: ${stats.blockedModules}`);
    
    if (stats.totalDuration > 0) {
      console.log(`   ⏱️  Total Time: ${Math.round(stats.totalDuration / 1000)}s`);
    }
  }

  displayModuleStatus(verbose) {
    console.log(`\n📊 Module Status:`);
    
    const allModules = this.dependencyManager.getAllModulesStatus();
    const moduleOrder = ['business', 'financial', 'marketing', 'release', 'tasks', 'tech'];
    
    // Display modules in dependency order
    moduleOrder.forEach(moduleName => {
      if (allModules[moduleName]) {
        this.displaySingleModuleStatus(moduleName, allModules[moduleName], verbose);
      }
    });
    
    // Display any additional modules not in standard order
    Object.keys(allModules).forEach(moduleName => {
      if (!moduleOrder.includes(moduleName)) {
        this.displaySingleModuleStatus(moduleName, allModules[moduleName], verbose);
      }
    });
  }

  displaySingleModuleStatus(moduleName, moduleData, verbose) {
    const { definition, state } = moduleData;
    const statusIcon = this.getStatusIcon(state.status);
    const commandName = `/plan-${moduleName}`;
    
    console.log(`   ${statusIcon} ${commandName.padEnd(20)} ${this.getStatusDescription(state)}`);
    
    if (verbose && state.status === 'completed' && state.duration) {
      console.log(`      └─ Completed in ${Math.round(state.duration / 1000)}s`);
    }
    
    if (verbose && state.errors && state.errors.length > 0) {
      console.log(`      └─ ⚠️ Errors: ${state.errors.length}`);
    }
  }

  displayReadyModules() {
    const readyModules = this.dependencyManager.getReadyModules();
    
    if (readyModules.length > 0) {
      console.log(`\n🚀 Ready to Execute:`);
      readyModules.forEach(moduleName => {
        console.log(`   • /plan-${moduleName}`);
      });
      console.log(`\n💡 Run '/plan-all' to execute all ready modules`);
    }
  }

  displayBlockedModules(verbose) {
    const allModules = this.dependencyManager.getAllModulesStatus();
    const blockedModules = Object.entries(allModules).filter(([_, data]) => {
      const resolution = this.dependencyManager.canExecuteModule(_);
      return !resolution.canExecute && data.state.status !== 'completed';
    });

    if (blockedModules.length > 0) {
      console.log(`\n⏸️  Blocked Modules:`);
      blockedModules.forEach(([moduleName, moduleData]) => {
        const resolution = this.dependencyManager.canExecuteModule(moduleName);
        console.log(`   • /plan-${moduleName}`);
        
        if (verbose) {
          console.log(`     └─ ${resolution.reason}`);
        } else if (resolution.missingDependencies.length > 0) {
          console.log(`     └─ Needs: ${resolution.missingDependencies.map(dep => `/plan-${dep}`).join(', ')}`);
        }
      });
    }
  }

  displaySessionInfo(session, stats) {
    console.log(`\n🔍 Session Details:`);
    console.log(`   Session ID: ${session.sessionId}`);
    console.log(`   Created: ${session.createdAt.toLocaleString()}`);
    console.log(`   Last Updated: ${session.lastUpdated.toLocaleString()}`);
    
    if (Object.keys(session.metadata).length > 0) {
      console.log(`   Metadata: ${Object.keys(session.metadata).join(', ')}`);
    }
  }

  getStatusIcon(status) {
    const icons = {
      'completed': '✅',
      'in_progress': '🔄',
      'pending': '⏸️',
      'not_started': '⭕',
      'failed': '❌',
      'blocked': '🚫'
    };
    return icons[status] || '❓';
  }

  getStatusDescription(state) {
    const descriptions = {
      'completed': `Completed${state.completedAt ? ` (${this.getTimeAgo(state.completedAt)})` : ''}`,
      'in_progress': `In Progress${state.startedAt ? ` (${this.getTimeAgo(state.startedAt)})` : ''}`,
      'pending': 'Pending',
      'not_started': 'Not Started',
      'failed': `Failed${state.errors.length > 0 ? ` (${state.errors.length} errors)` : ''}`,
      'blocked': 'Blocked'
    };
    return descriptions[state.status] || 'Unknown';
  }

  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  createProgressBar(percentage, width = 30) {
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    
    const filledBar = '█'.repeat(filled);
    const emptyBar = '░'.repeat(empty);
    
    return `[${filledBar}${emptyBar}] ${percentage}%`;
  }

  // Command interface methods
  getCommandInfo() {
    return {
      name: this.name,
      description: this.description,
      usage: '/plan-status [--verbose] [--project=PROJECT_ID]',
      examples: [
        '/plan-status',
        '/plan-status --verbose',
        '/plan-status --project=sage-phr'
      ]
    };
  }
}

module.exports = PlanStatusCommand;