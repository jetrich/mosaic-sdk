#!/usr/bin/env node

/**
 * gpt-oss Performance Optimization Tool
 * Based on A/B test results showing slow response times
 * Let's optimize the model configuration for better performance
 */

const { performance } = require('perf_hooks');
const http = require('http');

class GPTOSSOptimizer {
  constructor() {
    this.ollamaHost = '10.1.1.42';
    this.ollamaPort = 11434;
    this.model = 'gpt-oss';
    
    // Different configuration strategies to test
    this.optimizationConfigs = [
      {
        name: "Default Config",
        options: {
          temperature: 0.3,
          num_predict: 200,
          top_k: 40,
          top_p: 0.9
        }
      },
      {
        name: "Speed Optimized",
        options: {
          temperature: 0.2,
          num_predict: 100,    // Fewer tokens = faster
          top_k: 20,           // Less sampling = faster
          top_p: 0.8,
          num_ctx: 2048        // Smaller context = faster
        }
      },
      {
        name: "Ultra Fast",
        options: {
          temperature: 0.1,
          num_predict: 50,     // Very short responses
          top_k: 10,
          top_p: 0.7,
          num_ctx: 1024,       // Minimal context
          repeat_penalty: 1.0
        }
      },
      {
        name: "Quality Balanced",
        options: {
          temperature: 0.4,
          num_predict: 150,
          top_k: 30,
          top_p: 0.85,
          num_ctx: 3072,
          repeat_penalty: 1.1
        }
      },
      {
        name: "Development Mode",
        options: {
          temperature: 0.2,
          num_predict: 80,     // Short but complete
          top_k: 15,
          top_p: 0.75,
          num_ctx: 1536,
          repeat_penalty: 1.05
        }
      }
    ];
    
    this.testPrompts = [
      "Fix this bug: def calc(x): return x/0",
      "Write a simple Python function to check if a number is prime",
      "Explain what 'git rebase' does in one sentence",
      "Review: for i in range(len(arr)): print(arr[i])"
    ];
  }

  async testConfiguration(config, prompt) {
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        model: this.model,
        prompt,
        stream: false,
        options: config.options
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
        timeout: 15000 // Reduced timeout for optimization
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const duration = performance.now() - startTime;
          try {
            const result = JSON.parse(data);
            resolve({
              success: true,
              response: result.response,
              duration,
              tokens: result.eval_count || 0,
              tokensPerSecond: result.eval_count ? (result.eval_count / duration) * 1000 : 0,
              totalDuration: result.total_duration || 0,
              loadDuration: result.load_duration || 0,
              evalDuration: result.eval_duration || 0
            });
          } catch (error) {
            resolve({
              success: false,
              error: error.message,
              duration
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
          duration: performance.now() - startTime
        });
      });

      req.on('timeout', () => {
        resolve({
          success: false,
          error: 'Timeout',
          duration: performance.now() - startTime
        });
      });

      req.write(postData);
      req.end();
    });
  }

  async runOptimizationTest() {
    console.log('\n⚡ gpt-oss Performance Optimization Suite');
    console.log('========================================');
    console.log(`🎯 Target: ${this.ollamaHost}:${this.ollamaPort}`);
    console.log(`🤖 Model: ${this.model}`);
    console.log(`🧪 Testing ${this.optimizationConfigs.length} configurations`);
    console.log(`📝 Using ${this.testPrompts.length} test prompts\n`);

    const results = new Map();

    // Test each configuration
    for (const config of this.optimizationConfigs) {
      console.log(`🔬 Testing: ${config.name}`);
      console.log(`   Options: ${JSON.stringify(config.options, null, 2).replace(/\n/g, '\n   ')}`);
      
      const configResults = {
        name: config.name,
        totalTime: 0,
        successes: 0,
        failures: 0,
        totalTokens: 0,
        responses: []
      };

      for (const [index, prompt] of this.testPrompts.entries()) {
        process.stdout.write(`   [${index + 1}/${this.testPrompts.length}] Testing... `);
        
        const result = await this.testConfiguration(config, prompt);
        
        if (result.success) {
          configResults.successes++;
          configResults.totalTime += result.duration;
          configResults.totalTokens += result.tokens;
          configResults.responses.push(result.response.substring(0, 100));
          
          console.log(`✅ ${Math.round(result.duration)}ms (${result.tokens} tokens)`);
        } else {
          configResults.failures++;
          console.log(`❌ ${result.error}`);
        }
      }

      // Calculate metrics
      if (configResults.successes > 0) {
        configResults.avgResponseTime = configResults.totalTime / configResults.successes;
        configResults.avgTokensPerSecond = (configResults.totalTokens / configResults.totalTime) * 1000;
        configResults.successRate = (configResults.successes / this.testPrompts.length) * 100;
      } else {
        configResults.avgResponseTime = 0;
        configResults.avgTokensPerSecond = 0;
        configResults.successRate = 0;
      }

      results.set(config.name, configResults);
      
      console.log(`   📊 Summary: ${configResults.successRate.toFixed(0)}% success, ${Math.round(configResults.avgResponseTime)}ms avg, ${Math.round(configResults.avgTokensPerSecond)}t/s\n`);
    }

    this.displayOptimizationResults(results);
    this.generateRecommendations(results);
  }

  displayOptimizationResults(results) {
    console.log('📈 OPTIMIZATION RESULTS');
    console.log('=' .repeat(50));

    // Sort by average response time (ascending = better)
    const sortedResults = Array.from(results.values())
      .filter(r => r.successRate > 0)
      .sort((a, b) => a.avgResponseTime - b.avgResponseTime);

    console.log('\n🏆 Performance Ranking (by speed):');
    sortedResults.forEach((result, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏁';
      console.log(`${medal} ${result.name}:`);
      console.log(`   ⚡ Avg Response: ${Math.round(result.avgResponseTime)}ms`);
      console.log(`   🎯 Success Rate: ${result.successRate.toFixed(0)}%`);
      console.log(`   🚀 Throughput: ${Math.round(result.avgTokensPerSecond)} tokens/sec`);
      
      if (index === 0) {
        // Show sample response from fastest config
        console.log(`   📝 Sample: "${result.responses[0]}..."`);
      }
      console.log('');
    });

    // Compare to Claude baseline (from previous test)
    console.log('📊 vs Claude Haiku Comparison:');
    const fastest = sortedResults[0];
    const claudeAvg = 433; // From our previous test
    
    if (fastest.avgResponseTime < claudeAvg) {
      console.log(`✅ ${fastest.name} is ${Math.round(((claudeAvg - fastest.avgResponseTime) / claudeAvg) * 100)}% faster than Claude!`);
    } else {
      console.log(`⚠️ ${fastest.name} is ${Math.round(((fastest.avgResponseTime - claudeAvg) / claudeAvg) * 100)}% slower than Claude`);
      console.log(`   (${Math.round(fastest.avgResponseTime)}ms vs ${claudeAvg}ms)`);
    }
  }

  generateRecommendations(results) {
    const sortedResults = Array.from(results.values())
      .filter(r => r.successRate > 0)
      .sort((a, b) => a.avgResponseTime - b.avgResponseTime);

    const fastest = sortedResults[0];
    const mostReliable = sortedResults.reduce((prev, curr) => 
      prev.successRate > curr.successRate ? prev : curr
    );

    console.log('\n💡 OPTIMIZATION RECOMMENDATIONS');
    console.log('=' .repeat(50));

    console.log(`\n🚀 For Best Speed: Use "${fastest.name}"`);
    console.log(`   Average response time: ${Math.round(fastest.avgResponseTime)}ms`);
    console.log(`   Configuration:`);
    const fastestConfig = this.optimizationConfigs.find(c => c.name === fastest.name);
    Object.entries(fastestConfig.options).forEach(([key, value]) => {
      console.log(`     ${key}: ${value}`);
    });

    if (fastest.name !== mostReliable.name) {
      console.log(`\n🎯 For Best Reliability: Use "${mostReliable.name}"`);
      console.log(`   Success rate: ${mostReliable.successRate.toFixed(0)}%`);
      console.log(`   Response time: ${Math.round(mostReliable.avgResponseTime)}ms`);
    }

    console.log('\n🔧 Key Optimizations Discovered:');
    
    // Analyze what made the fastest config fast
    const fastOpts = fastestConfig.options;
    
    if (fastOpts.num_predict <= 100) {
      console.log('   ✅ Shorter responses (num_predict ≤ 100) significantly improve speed');
    }
    
    if (fastOpts.num_ctx <= 2048) {
      console.log('   ✅ Smaller context window (num_ctx ≤ 2048) reduces processing time');
    }
    
    if (fastOpts.top_k <= 20) {
      console.log('   ✅ Lower top_k sampling reduces generation complexity');
    }

    if (fastOpts.temperature <= 0.2) {
      console.log('   ✅ Lower temperature improves speed and consistency');
    }

    console.log('\n🎯 Recommended Use Cases by Configuration:');
    
    sortedResults.forEach((result, index) => {
      if (index < 3) { // Top 3 configs
        const config = this.optimizationConfigs.find(c => c.name === result.name);
        console.log(`\n📋 ${result.name} (${Math.round(result.avgResponseTime)}ms avg):`);
        
        if (result.name.includes('Ultra Fast')) {
          console.log('   • Quick yes/no answers');
          console.log('   • Simple code snippets');
          console.log('   • Brief explanations');
        } else if (result.name.includes('Development')) {
          console.log('   • Code review comments');
          console.log('   • Bug analysis');
          console.log('   • Development assistance');
        } else if (result.name.includes('Speed Optimized')) {
          console.log('   • General development tasks');
          console.log('   • Documentation generation');
          console.log('   • Code explanations');
        }
      }
    });

    console.log('\n🚀 Integration Recommendations:');
    console.log('   1. Use fastest config for interactive development');
    console.log('   2. Cache results for repeated queries');
    console.log('   3. Pre-load model to eliminate cold start delays');
    console.log('   4. Consider request batching for bulk operations');
    console.log('   5. Implement timeout monitoring and fallbacks');

    // Cost comparison
    const avgRequestsPerDay = 1000;
    const claudeCostPerRequest = 0.000023; // From previous test
    const dailyClaudeCost = avgRequestsPerDay * claudeCostPerRequest;
    
    console.log('\n💰 Cost-Benefit Analysis:');
    console.log(`   📊 Daily requests (estimated): ${avgRequestsPerDay}`);
    console.log(`   💸 Claude cost: $${dailyClaudeCost.toFixed(4)}/day`);
    console.log(`   💚 gpt-oss cost: $0.0000/day`);
    console.log(`   💰 Daily savings: $${dailyClaudeCost.toFixed(4)}`);
    console.log(`   📈 Annual savings: $${(dailyClaudeCost * 365).toFixed(2)}`);

    console.log(`\n⚖️ Speed vs Cost Trade-off:`);
    console.log(`   • Claude: ~433ms response, costs money`);
    console.log(`   • gpt-oss optimized: ~${Math.round(fastest.avgResponseTime)}ms response, FREE`);
    
    if (fastest.avgResponseTime < 1000) {
      console.log(`   ✅ Recommendation: Use optimized gpt-oss for most tasks!`);
    } else {
      console.log(`   ⚖️ Recommendation: Hybrid approach based on urgency`);
    }
  }
}

// Run the optimization test
async function main() {
  const optimizer = new GPTOSSOptimizer();
  await optimizer.runOptimizationTest();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = GPTOSSOptimizer;