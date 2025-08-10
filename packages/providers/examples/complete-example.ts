/**
 * Complete Provider System Example
 * Demonstrates the full capability of the extracted provider system
 */

import {
  ProviderRegistry,
  OllamaFactory,
  ClaudeFactory,
  TaskRouterImpl,
  Provider,
  TaskRequest,
  getGlobalProviderRegistry,
} from '../src';

async function main() {
  console.log('🚀 MosAIc Provider System Demo');
  console.log('=====================================\n');

  // 1. Setup Provider Registry
  console.log('1. Setting up Provider Registry...');
  const registry = getGlobalProviderRegistry();
  
  // Register factories
  registry.register(new OllamaFactory());
  registry.register(new ClaudeFactory());
  
  console.log(`   Available provider types: ${registry.getAvailableTypes().join(', ')}\n`);

  // 2. Create Providers
  console.log('2. Creating Providers...');
  
  let ollamaProvider: Provider | null = null;
  let claudeProvider: Provider | null = null;

  try {
    // Create Ollama provider (local)
    ollamaProvider = await registry.createProvider({
      name: 'ollama',
      type: 'local',
      enabled: true,
      priority: 1,
      host: 'http://localhost:11434',
      timeout: 30000,
      retryAttempts: 2,
    });
    console.log('   ✅ Ollama provider created');
  } catch (error) {
    console.log('   ❌ Ollama provider failed:', (error as Error).message);
  }

  try {
    // Create Claude provider (remote) - requires API key
    const apiKey = process.env.CLAUDE_API_KEY;
    if (apiKey) {
      claudeProvider = await registry.createProvider({
        name: 'claude',
        type: 'remote',
        enabled: true,
        priority: 2,
        apiKey,
        model: 'claude-3-sonnet-20240229',
      });
      console.log('   ✅ Claude provider created');
    } else {
      console.log('   ⚠️  Claude provider skipped (no API key)');
    }
  } catch (error) {
    console.log('   ❌ Claude provider failed:', (error as Error).message);
  }

  console.log();

  // 3. Check Provider Health
  console.log('3. Checking Provider Health...');
  const health = await registry.getProvidersHealth();
  
  for (const [name, status] of Object.entries(health)) {
    const emoji = status.status === 'online' ? '🟢' : '🔴';
    console.log(`   ${emoji} ${name}: ${status.status} - ${status.message}`);
    if (status.models_available) {
      console.log(`      Models available: ${status.models_available}`);
    }
  }
  console.log();

  // 4. Setup Task Router
  console.log('4. Setting up Task Router...');
  const router = new TaskRouterImpl();
  
  if (ollamaProvider) {
    router.registerProvider(ollamaProvider);
    console.log('   ✅ Ollama provider registered with router');
  }
  
  if (claudeProvider) {
    router.registerProvider(claudeProvider);
    console.log('   ✅ Claude provider registered with router');
  }
  console.log();

  // 5. Test Different Task Types
  const testTasks: TaskRequest[] = [
    {
      type: 'code',
      content: 'Write a TypeScript function to validate email addresses using regex',
      complexity: 3,
      preferences: {
        prefer_local: true,
        fallback_enabled: true,
      },
    },
    {
      type: 'analysis',
      content: 'Analyze the pros and cons of microservices vs monolithic architecture',
      complexity: 4,
      preferences: {
        prefer_fast: false, // Quality over speed
        fallback_enabled: true,
      },
    },
    {
      type: 'documentation',
      content: 'Write API documentation for a REST endpoint that creates a user',
      complexity: 2,
      preferences: {
        prefer_local: false, // Remote for better writing
        max_response_time: 30,
      },
    },
  ];

  console.log('5. Testing Task Execution...');
  
  for (let i = 0; i < testTasks.length; i++) {
    const task = testTasks[i]!;
    console.log(`\n   Task ${i + 1}: ${task.type} (complexity: ${task.complexity})`);
    console.log(`   Content: "${task.content.substring(0, 60)}..."`);
    
    try {
      // Get routing decision
      const routing = await router.routeTask(task);
      console.log(`   🎯 Routing: ${routing.provider} → ${routing.model_name}`);
      console.log(`   📊 Confidence: ${(routing.confidence * 100).toFixed(1)}%`);
      console.log(`   🕒 Estimated time: ${routing.estimated_time}s`);
      console.log(`   💭 Reasoning: ${routing.reasoning}`);
      
      // Execute task
      console.log('   🔄 Executing...');
      const startTime = Date.now();
      const response = await router.executeTask(task, routing);
      const actualTime = Date.now() - startTime;
      
      if (response.success) {
        console.log(`   ✅ Success! (${actualTime}ms)`);
        console.log(`   📝 Response: "${response.content.substring(0, 100)}..."`);
        if (response.token_count) {
          console.log(`   🔢 Tokens: ${response.token_count}`);
        }
      } else {
        console.log(`   ❌ Failed: ${response.error}`);
      }
      
    } catch (error) {
      console.log(`   💥 Error: ${(error as Error).message}`);
    }
  }

  // 6. Show Router Statistics
  console.log('\n6. Router Statistics');
  const stats = router.getRoutingStats();
  console.log(`   Total tasks: ${stats.totalTasks}`);
  console.log(`   Success rate: ${(stats.successRate * 100).toFixed(1)}%`);
  console.log(`   Average execution time: ${stats.averageExecutionTime.toFixed(0)}ms`);
  console.log(`   Provider usage:`, stats.providerUsage);

  // 7. Provider Performance Metrics
  console.log('\n7. Provider Performance');
  for (const provider of registry.getAllProviders()) {
    const performance = router.getProviderPerformance(provider.name);
    if (performance && performance.taskCount > 0) {
      console.log(`   ${provider.name}:`);
      console.log(`     Tasks executed: ${performance.taskCount}`);
      console.log(`     Success rate: ${(performance.successRate * 100).toFixed(1)}%`);
      console.log(`     Avg response time: ${performance.averageResponseTime.toFixed(0)}ms`);
      console.log(`     Last used: ${performance.lastUsed.toLocaleTimeString()}`);
    }
  }

  // 8. Model Recommendations
  console.log('\n8. Model Recommendations');
  const taskTypes = ['code', 'analysis', 'documentation', 'general'] as const;
  
  for (const taskType of taskTypes) {
    for (const complexity of [2, 4]) {
      try {
        const recommended = await router.recommendModel(taskType, complexity);
        console.log(`   ${taskType} (complexity ${complexity}): ${recommended}`);
      } catch (error) {
        console.log(`   ${taskType} (complexity ${complexity}): No recommendation available`);
      }
    }
  }

  // 9. Cleanup
  console.log('\n9. Cleanup');
  await registry.dispose();
  console.log('   ✅ All providers disposed\n');

  console.log('🎉 Demo completed successfully!');
}

// Error handling wrapper
async function runDemo() {
  try {
    await main();
  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runDemo();
}

export { runDemo };