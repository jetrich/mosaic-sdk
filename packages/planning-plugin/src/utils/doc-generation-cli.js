#!/usr/bin/env node

/**
 * Documentation Generation CLI Utility
 * Standalone tool for generating strategic documentation from MCP planning sessions
 */

const { StateTracker } = require('../core/state-tracker');
const { DocumentationGenerationService } = require('../services/DocumentationGenerationService');

async function generateDocumentation(options = {}) {
  const {
    projectId = 'default',
    force = false,
    verbose = false
  } = options;

  console.log(`📄 MosAIc Documentation Generator`);
  console.log(`Project ID: ${projectId}`);
  console.log(''.padEnd(50, '='));

  try {
    // Initialize StateTracker
    const stateTracker = new StateTracker({ projectId });
    await stateTracker.initialize();

    const session = stateTracker.getCurrentSession();
    if (!session) {
      console.log('❌ No planning session found. Run /plan-* commands first.');
      return;
    }

    console.log(`\n📊 Session Status:`);
    const stats = stateTracker.getSessionStats();
    console.log(`   Total Modules: ${stats.totalModules}`);
    console.log(`   Completed: ${stats.completedModules}/${stats.totalModules} (${stats.completionPercentage}%)`);
    console.log(`   In Progress: ${stats.inProgressModules}`);

    if (stats.completedModules === 0 && !force) {
      console.log('\n⚠️  No completed planning modules found.');
      console.log('💡 Complete some planning modules first, or use --force to generate with partial data');
      return;
    }

    // Initialize Documentation Service
    const docService = new DocumentationGenerationService(stateTracker);

    // Generate documentation
    console.log(`\n📄 Generating strategic documentation...`);
    const result = await docService.generateDocumentation();

    if (result.success) {
      console.log(`\n✅ Documentation generation completed!`);
      console.log(`\n📁 Generated Files:`);
      result.generatedFiles.forEach(file => {
        console.log(`   📄 ${file.replace(process.cwd(), '.')}`);
      });
    } else {
      console.log(`\n⚠️  Documentation generation completed with errors:`);
      result.errors.forEach(error => {
        console.log(`   ❌ ${error}`);
      });
      
      if (result.generatedFiles.length > 0) {
        console.log(`\n📁 Partially Generated Files:`);
        result.generatedFiles.forEach(file => {
          console.log(`   📄 ${file.replace(process.cwd(), '.')}`);
        });
      }
    }

    if (verbose && session) {
      console.log(`\n🔍 Detailed Session Information:`);
      console.log(`   Session ID: ${session.sessionId}`);
      console.log(`   Created: ${session.createdAt}`);
      console.log(`   Last Updated: ${session.lastUpdated}`);
      console.log(`   Modules:`);
      
      Object.entries(session.modules).forEach(([name, module]) => {
        console.log(`     ${name}: ${module.state.status}`);
        if (module.state.outputs && module.state.outputs.length > 0) {
          console.log(`       Outputs: ${module.state.outputs.join(', ')}`);
        }
      });
    }

  } catch (error) {
    console.error(`💥 Documentation generation failed: ${error.message}`);
    if (verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  args.forEach(arg => {
    if (arg.startsWith('--project=')) {
      options.projectId = arg.split('=')[1];
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
MosAIc Documentation Generator

Usage: node doc-generation-cli.js [options]

Options:
  --project=ID    Project ID to generate docs for (default: 'default')
  --force         Generate docs even with incomplete planning modules
  --verbose, -v   Show detailed information
  --help, -h      Show this help message

Examples:
  node doc-generation-cli.js --project=sage-phr
  node doc-generation-cli.js --project=ecommerce --verbose
  node doc-generation-cli.js --force --verbose
`);
      process.exit(0);
    }
  });

  generateDocumentation(options);
}

module.exports = { generateDocumentation };