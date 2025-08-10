#!/usr/bin/env node

/**
 * MosAIc Stack Test Runner CLI
 * Executes comprehensive end-to-end tests
 */

import { TestRunner } from './testing/TestRunner.js';

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose') || args.includes('-v');
  
  console.log('🚀 MosAIc Stack NPM Package Testing');
  console.log('====================================');
  console.log(`📍 Testing with local NPM repository`);
  console.log(`🔧 Verbose mode: ${verbose ? 'ON' : 'OFF'}`);
  
  const runner = new TestRunner({ verbose });
  
  try {
    const results = await runner.runAllTests();
    
    // Exit with error code if any tests failed
    const totalFailed = results.reduce((sum: number, suite: any) => sum + suite.failed, 0);
    process.exit(totalFailed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  }
}

// Handle CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}