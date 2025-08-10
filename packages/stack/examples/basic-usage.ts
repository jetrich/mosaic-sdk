/**
 * Basic usage example for @mosaicstack/stack
 * Demonstrates the unified interface for multi-mode architecture
 */

import { createStack } from '@mosaicstack/stack';

async function demonstrateStackUsage() {
  console.log('🚀 MosAIc Stack Integration Demo');
  console.log('================================');

  // Example 1: Local mode setup
  console.log('\n📍 Local Mode Example:');
  try {
    const localStack = await createStack({
      mode: 'local',
      verbose: true,
      port: 3456,
    });

    console.log('✅ Local stack created successfully');
    console.log(`📊 Current mode: ${localStack.getMode()}`);
    
    // Start the stack
    await localStack.start();
    console.log('✅ Local stack started');

    // Get status
    const localStatus = await localStack.status();
    console.log(`📈 Stack status: ${localStatus.status}`);
    console.log(`🔧 Components: ${localStatus.components.length}`);

    // Stop the stack
    await localStack.stop();
    console.log('🛑 Local stack stopped');

  } catch (error) {
    console.log(`❌ Local mode error: ${error.message}`);
  }

  // Example 2: Hybrid mode setup
  console.log('\n🌐 Hybrid Mode Example:');
  try {
    const hybridStack = await createStack({
      mode: 'hybrid',
      verbose: true,
      port: 3457,
      autoStart: true, // Auto-start on creation
    });

    console.log('✅ Hybrid stack created and started');
    console.log(`📊 Current mode: ${hybridStack.getMode()}`);

    // Get detailed status
    const hybridStatus = await hybridStack.status();
    console.log(`📈 Stack health: ${hybridStatus.health.overall}`);
    console.log(`🔧 Active components: ${hybridStatus.components.filter(c => c.status === 'running').length}`);
    console.log(`🌍 Available providers: ${hybridStatus.providers.filter(p => p.status === 'available').length}`);

    // Reconfigure to cloud mode
    await hybridStack.configure({ mode: 'cloud' });
    console.log('🔄 Reconfigured to cloud mode');

    await hybridStack.stop();
    console.log('🛑 Hybrid stack stopped');

  } catch (error) {
    console.log(`❌ Hybrid mode error: ${error.message}`);
  }

  // Example 3: Using the StackCLI for programmatic control
  console.log('\n🖥️  CLI Integration Example:');
  try {
    const { StackCLI } = await import('@mosaicstack/stack');
    
    const cli = new StackCLI();
    
    // Initialize with CLI options
    const stack = await cli.initialize({
      mode: 'local',
      verbose: false,
      port: 3458,
    });

    console.log('✅ CLI-managed stack initialized');
    
    // Start via CLI
    await cli.start();
    console.log('✅ Stack started via CLI');

    // Get status via CLI
    const status = await cli.status();
    console.log(`📊 CLI status check: ${status.status}`);

    // Stop via CLI
    await cli.stop();
    console.log('🛑 Stack stopped via CLI');

  } catch (error) {
    console.log(`❌ CLI integration error: ${error.message}`);
  }

  console.log('\n🎉 MosAIc Stack Integration Demo Complete!');
  console.log('\nKey Features Demonstrated:');
  console.log('• ✅ Multi-mode architecture (local/hybrid/cloud)');
  console.log('• 🔄 Runtime mode switching');
  console.log('• 📊 Health monitoring and status reporting');
  console.log('• 🌍 Provider orchestration');
  console.log('• 🖥️  CLI integration');
  console.log('• ⚡ Auto-start capabilities');
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateStackUsage().catch(console.error);
}

export { demonstrateStackUsage };