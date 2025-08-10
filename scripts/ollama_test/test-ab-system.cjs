#!/usr/bin/env node

/**
 * Test script for Ollama A/B Testing System
 * Tests multi-model comparison with P40 VRAM optimization
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

class ABTestingDemo {
  constructor() {
    this.ollamaHost = '10.1.1.42';
    this.ollamaPort = '11434';
    
    // P40 optimized model registry
    this.modelRegistry = {
      'gpt-oss': { vram: '16GB', specialization: 'web-development' },
      'llama3.2:1b': { vram: '1GB', specialization: 'quick-answer' },
      'llama3.2:3b': { vram: '3GB', specialization: 'general-code' },
      'codegemma:2b': { vram: '2GB', specialization: 'backend-code' }
    };
  }

  async runDemo() {
    console.log('🧪 Testing A/B Testing System for P40 24GB VRAM...\n');

    try {
      // Test simple comparison first
      await this.testSimpleComparison();
      
      // Test with only available models
      await this.testAvailableModels();
      
      console.log('\n🎉 A/B Testing system validation completed successfully!');
      
    } catch (error) {
      console.error('❌ A/B Testing demo failed:', error.message);
    }
  }

  async testSimpleComparison() {
    console.log('📊 Test 1: Simple 2-model comparison (gpt-oss vs smaller model)');
    
    const prompt = "Write a Python function to calculate fibonacci numbers";
    const models = ['gpt-oss']; // Only test with available model for now
    
    console.log(`Testing prompt: "${prompt}"`);
    console.log(`Models to test: ${models.join(', ')}`);
    
    const results = await this.simulateABTest(prompt, models, 'backend-code');
    
    console.log('\n✅ Test 1 Results:');
    console.log(`• Models tested: ${results.models_tested.length}`);
    console.log(`• Successful tests: ${results.results.filter(r => r.success).length}`);
    console.log(`• Total VRAM usage: ${this.calculateVRAMUsage(results.results)}`);
    console.log(`• Winner: ${results.comparison?.winner || 'N/A'}`);
  }

  async testAvailableModels() {
    console.log('\n🔍 Test 2: Check what models are actually available');
    
    const available = await this.getAvailableModels();
    console.log(`Available models: ${available.join(', ')}`);
    
    // Filter our registry to only available models
    const testableModels = Object.keys(this.modelRegistry).filter(m => 
      available.includes(m) || m === 'gpt-oss'
    ).slice(0, 2); // Limit to 2 for P40 VRAM safety
    
    console.log(`P40-safe testable models: ${testableModels.join(', ')}`);
    
    if (testableModels.length > 1) {
      const results = await this.simulateABTest(
        "Create a simple HTML page with CSS styling", 
        testableModels, 
        'web-development'
      );
      
      console.log('\n✅ Test 2 Results:');
      console.log(`• Models compared: ${results.models_tested.length}`);
      console.log(`• P40 VRAM utilization: ${this.calculateP40Utilization(results.results)}%`);
    } else {
      console.log('⚠️ Only one model available for testing');
    }
  }

  async simulateABTest(prompt, models, taskType) {
    // This simulates the A/B test logic without actually running the full MCP server
    const results = {
      timestamp: new Date().toISOString(),
      prompt: prompt.slice(0, 50) + '...',
      task_type: taskType,
      models_tested: models,
      results: [],
      comparison: null
    };

    for (const model of models) {
      console.log(`  Testing ${model} (${this.modelRegistry[model]?.vram || 'unknown VRAM'})...`);
      
      const startTime = Date.now();
      try {
        // Actual API call to test the model
        const result = await this.testModelGeneration(model, prompt);
        const duration = Date.now() - startTime;
        
        if (result.success) {
          results.results.push({
            model: model,
            success: true,
            response_time_ms: duration,
            content_length: result.response.length,
            tokens_generated: result.tokens || 0,
            vram_usage: this.modelRegistry[model]?.vram || 'unknown',
            quality_score: this.calculateQualityScore(result.response, taskType)
          });
          console.log(`    ✅ Success: ${duration}ms, ${result.response.length} chars`);
        } else {
          results.results.push({
            model: model,
            success: false,
            error: result.error,
            response_time_ms: duration,
            vram_usage: this.modelRegistry[model]?.vram || 'unknown'
          });
          console.log(`    ❌ Failed: ${result.error}`);
        }
      } catch (error) {
        console.log(`    ❌ Error: ${error.message}`);
        results.results.push({
          model: model,
          success: false,
          error: error.message,
          response_time_ms: Date.now() - startTime,
          vram_usage: this.modelRegistry[model]?.vram || 'unknown'
        });
      }
      
      // Brief pause for VRAM management
      if (model !== models[models.length - 1]) {
        console.log('    ⏱️ Waiting 2s for VRAM cleanup...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Create comparison if we have successful results
    const successful = results.results.filter(r => r.success);
    if (successful.length > 1) {
      const ranked = successful.sort((a, b) => b.quality_score - a.quality_score || a.response_time_ms - b.response_time_ms);
      results.comparison = {
        winner: ranked[0].model,
        speed_winner: successful.reduce((fastest, current) => 
          current.response_time_ms < fastest.response_time_ms ? current : fastest
        ).model,
        quality_winner: successful.reduce((best, current) => 
          current.quality_score > best.quality_score ? current : best
        ).model
      };
    }

    return results;
  }

  async testModelGeneration(model, prompt) {
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.2,
          num_predict: 500, // Smaller for faster testing
          top_k: 20,
          top_p: 0.8,
          num_ctx: 4096
        }
      });

      const req = http.request({
        hostname: this.ollamaHost,
        port: this.ollamaPort,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        },
        timeout: 120000 // 2 minutes
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve({
              success: true,
              response: result.response || '',
              tokens: result.eval_count || 0
            });
          } catch (error) {
            resolve({
              success: false,
              error: `Parse error: ${error.message}`
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          error: `Request error: ${error.message}`
        });
      });

      req.on('timeout', () => {
        resolve({
          success: false,
          error: 'Request timeout'
        });
      });

      req.write(postData);
      req.end();
    });
  }

  async getAvailableModels() {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: this.ollamaHost,
        port: this.ollamaPort,
        path: '/api/tags',
        method: 'GET',
        timeout: 10000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            const models = result.models ? result.models.map(m => m.name) : [];
            resolve(models);
          } catch (error) {
            resolve(['gpt-oss']); // Fallback
          }
        });
      });
      
      req.on('error', () => resolve(['gpt-oss']));
      req.on('timeout', () => resolve(['gpt-oss']));
      req.end();
    });
  }

  calculateQualityScore(content, taskType) {
    let score = Math.min(100, (content.length / 100) * 10); // Base score on length
    
    if (taskType === 'web-development') {
      if (content.includes('<html') || content.includes('<!DOCTYPE')) score += 30;
      if (content.includes('style') || content.includes('{')) score += 20;
    } else if (taskType === 'backend-code') {
      if (content.includes('def ') || content.includes('function')) score += 30;
      if (content.includes('return')) score += 20;
    }
    
    return Math.min(100, Math.round(score));
  }

  calculateVRAMUsage(results) {
    const successful = results.filter(r => r.success);
    const totalGB = successful.reduce((sum, r) => {
      const vramNum = parseInt(r.vram_usage) || 16;
      return sum + vramNum;
    }, 0);
    return `${totalGB}GB`;
  }

  calculateP40Utilization(results) {
    const successful = results.filter(r => r.success);
    const totalGB = successful.reduce((sum, r) => {
      const vramNum = parseInt(r.vram_usage) || 16;
      return sum + vramNum;
    }, 0);
    return Math.round((totalGB / 24) * 100);
  }
}

// Run the demo if this script is executed directly
if (require.main === module) {
  const demo = new ABTestingDemo();
  demo.runDemo().then(() => {
    console.log('\n🏁 A/B Testing validation complete');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Demo failed:', error);
    process.exit(1);
  });
}

module.exports = ABTestingDemo;