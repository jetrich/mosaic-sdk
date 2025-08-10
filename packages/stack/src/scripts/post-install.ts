#!/usr/bin/env node

/**
 * Post-Install Script for @mosaicstack/stack
 * 
 * Performs initial setup and validation after package installation
 */

import chalk from 'chalk';

// Standalone constants to avoid circular imports
const COMPONENTS = {
  'mcp-common': '@mosaicstack/mcp-common',
  'mcp-bookstack': '@mosaicstack/mcp-bookstack', 
  'mcp-gitea-remote': '@mosaicstack/mcp-gitea-remote',
  'mcp-integration': '@mosaicstack/mcp-integration',
  'mcp-plane': '@mosaicstack/mcp-plane',
  'mcp-woodpecker': '@mosaicstack/mcp-woodpecker'
} as const;

// Standalone utility functions
function getSystemInfo(): Record<string, string> {
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    cwd: process.cwd(),
    user: process.env.USER || process.env.USERNAME || 'unknown'
  };
}

async function isPackageInstalled(packageName: string): Promise<boolean> {
  try {
    require.resolve(packageName);
    return true;
  } catch {
    return false;
  }
}

async function postInstall(): Promise<void> {
  console.log(chalk.cyan('🚀 MosAIc Stack Post-Install Setup'));
  console.log(chalk.gray('Initializing enterprise AI development platform...'));
  console.log();

  try {
    // Validate environment
    console.log(chalk.blue('📋 Validating environment...'));
    const systemInfo = getSystemInfo();
    console.log(chalk.gray(`  Platform: ${systemInfo.platform}`));
    console.log(chalk.gray(`  Node.js: ${systemInfo.nodeVersion}`));
    console.log(chalk.gray(`  Architecture: ${systemInfo.arch}`));
    console.log();

    // Check component availability
    console.log(chalk.blue('🔍 Checking MosAIc components...'));
    let componentsInstalled = 0;
    const totalComponents = Object.keys(COMPONENTS).length;

    for (const [name, packageName] of Object.entries(COMPONENTS)) {
      const isInstalled = await isPackageInstalled(packageName);
      if (isInstalled) {
        console.log(chalk.green(`  ✓ ${name}: ${packageName}`));
        componentsInstalled++;
      } else {
        console.log(chalk.yellow(`  ⚠ ${name}: ${packageName} (optional)`));
      }
    }

    console.log();
    console.log(chalk.cyan(`📊 Components available: ${componentsInstalled}/${totalComponents}`));
    console.log();

    // Installation success message
    console.log(chalk.green('✅ MosAIc Stack installation completed successfully!'));
    console.log();
    console.log(chalk.cyan('🎯 Quick Start Guide:'));
    console.log(chalk.white('  1. Initialize project:'));
    console.log(chalk.gray('     npx mosaicstack stack --init'));
    console.log();
    console.log(chalk.white('  2. Start development:'));
    console.log(chalk.gray('     npx mosaicstack dev --start'));
    console.log();
    console.log(chalk.white('  3. Run tests:'));
    console.log(chalk.gray('     npx mosaicstack test --all'));
    console.log();
    
    // Additional information
    console.log(chalk.cyan('📚 Documentation: https://mosaicstack.dev'));
    console.log(chalk.cyan('🐛 Issues: https://github.com/jetrich/mosaic-sdk/issues'));
    console.log(chalk.cyan('💬 Discussions: https://github.com/jetrich/mosaic-sdk/discussions'));
    console.log();

    // Warning about missing components
    if (componentsInstalled < totalComponents) {
      console.log(chalk.yellow('⚠️  Note: Some optional components are not installed.'));
      console.log(chalk.yellow('   Install individual components as needed:'));
      
      for (const [name, packageName] of Object.entries(COMPONENTS)) {
        const isInstalled = await isPackageInstalled(packageName);
        if (!isInstalled) {
          console.log(chalk.gray(`   npm install ${packageName}`));
        }
      }
      console.log();
    }

  } catch (error) {
    console.error(chalk.red('❌ Post-install setup failed:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    console.log();
    console.log(chalk.yellow('You can still use MosAIc Stack, but some features may not work.'));
    console.log(chalk.yellow('Please check the documentation for manual setup instructions.'));
    process.exit(0); // Don't fail the installation
  }
}

// Only run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  postInstall();
}

export { postInstall };