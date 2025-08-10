/**
 * @fileoverview Basic usage example for Ollama MCP integration
 */

import { initializeOllamaMCP } from '../src/index.js';

async function main() {
  console.log('Initializing Ollama MCP...');
  
  try {
    // Initialize with custom configuration
    const ollama = await initializeOllamaMCP({
      endpoints: {
        primary: 'http://localhost:11434',
        fallback: undefined
      },
      models: {
        default: 'llama3.2',
        code: 'codellama:latest'
      },
      options: {
        temperature: 0.7,
        num_ctx: 4096
      }
    });
    
    console.log('✓ Connected to Ollama');
    
    // Example 1: Basic text generation
    console.log('\n1. Basic text generation:');
    const result1 = await ollama.tools.generate.call({
      prompt: 'Write a haiku about artificial intelligence',
      model: 'llama3.2'
    });
    
    if (result1.success) {
      console.log('Response:', result1.data.response);
      console.log('Model:', result1.data.model);
      console.log('Tokens:', result1.data.metrics?.eval_count);
    }
    
    // Example 2: JSON generation with schema
    console.log('\n2. Structured JSON generation:');
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        skills: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['name', 'age', 'skills']
    };
    
    const result2 = await ollama.tools.generate.call({
      prompt: 'Generate a profile for a software developer',
      format: schema,
      model: 'llama3.2'
    });
    
    if (result2.success) {
      console.log('Structured response:', JSON.stringify(result2.data.response, null, 2));
    }
    
    // Example 3: Code generation
    console.log('\n3. Code generation:');
    const codeResult = await ollama.tools.generate.generateCode(
      'function to calculate fibonacci numbers',
      'python'
    );
    
    if (codeResult.success) {
      console.log('Generated code:');
      console.log(codeResult.data);
    }
    
    // Example 4: Model information
    console.log('\n4. Model information:');
    const models = await ollama.modelManager.listAvailableModels();
    console.log('Available models:');
    models.forEach((model: any) => {
      console.log(`  - ${model.name} (${model.parameterSize}, ${model.quantization})`);
      if (model.loaded) {
        console.log('    [LOADED]');
      }
    });
    
    // Example 5: Model switching
    console.log('\n5. Model switching:');
    const switchResult = await ollama.modelManager.switchModel('codellama:latest');
    if (switchResult.success) {
      console.log(`Switched from ${switchResult.previousModel} to ${switchResult.currentModel}`);
      console.log(`Load time: ${switchResult.loadTime}ms`);
    }
    
    // Example 6: Performance metrics
    console.log('\n6. Performance metrics:');
    const metrics = ollama.modelManager.getPerformanceMetrics('llama3.2');
    if (metrics) {
      console.log('Model performance:');
      console.log(`  Total requests: ${metrics.totalRequests}`);
      console.log(`  Avg response time: ${metrics.avgResponseTime.toFixed(2)}ms`);
      console.log(`  Error rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the example
main().catch(console.error);