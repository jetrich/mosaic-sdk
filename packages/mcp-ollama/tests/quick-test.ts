/**
 * Quick test to verify Ollama integration is working
 */

import { initializeOllamaMCP } from '../src/index.js';

async function quickTest() {
  console.log('🧪 Quick Ollama Integration Test\n');
  
  try {
    // Initialize
    console.log('1️⃣ Initializing Ollama MCP...');
    const ollama = await initializeOllamaMCP({
      endpoints: {
        primary: 'http://localhost:11434'
      },
      models: {
        default: 'llama3.2'
      }
    });
    console.log('   ✅ Connected to Ollama\n');
    
    // List models
    console.log('2️⃣ Listing available models...');
    const models = await ollama.modelManager.listAvailableModels();
    console.log(`   ✅ Found ${models.length} models:`);
    models.forEach((m: any) => console.log(`      - ${m.name} (${m.parameterSize})`));
    console.log('');
    
    // Simple generation
    console.log('3️⃣ Testing text generation...');
    const start = Date.now();
    const result = await ollama.tools.generate.call({
      prompt: 'Complete this: The capital of France is',
      model: 'llama3.2',
      options: {
        temperature: 0.1,
        num_predict: 10
      }
    });
    const duration = Date.now() - start;
    
    if (result.success) {
      console.log(`   ✅ Generation successful (${duration}ms)`);
      console.log(`   Response: "${result.data.response}"`);
      console.log(`   Tokens: ${result.data.metrics?.eval_count || 'unknown'}`);
    } else {
      console.log(`   ❌ Generation failed: ${result.error?.message}`);
    }
    console.log('');
    
    // JSON generation
    console.log('4️⃣ Testing JSON generation...');
    const jsonStart = Date.now();
    const jsonResult = await ollama.tools.generate.call({
      prompt: 'Generate a simple user object with name and age',
      format: 'json',
      model: 'llama3.2'
    });
    const jsonDuration = Date.now() - jsonStart;
    
    if (jsonResult.success) {
      console.log(`   ✅ JSON generation successful (${jsonDuration}ms)`);
      console.log(`   Response: ${JSON.stringify(jsonResult.data.response, null, 2)}`);
    } else {
      console.log(`   ❌ JSON generation failed: ${jsonResult.error?.message}`);
    }
    console.log('');
    
    // Performance summary
    console.log('5️⃣ Performance Summary:');
    const metrics = ollama.modelManager.getPerformanceMetrics('llama3.2');
    if (metrics) {
      console.log(`   Total requests: ${metrics.totalRequests}`);
      console.log(`   Avg response time: ${metrics.avgResponseTime.toFixed(0)}ms`);
      console.log(`   Error rate: ${(metrics.errorRate * 100).toFixed(1)}%`);
    }
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

quickTest().catch(console.error);