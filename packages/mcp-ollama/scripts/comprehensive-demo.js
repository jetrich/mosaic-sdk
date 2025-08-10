#!/usr/bin/env node

/**
 * Comprehensive Demo of Ollama MCP Integration
 * Demonstrates all capabilities built for local AI-powered development
 * Includes optimized configurations from A/B testing results
 */

const { performance } = require('perf_hooks');
const http = require('http');

class ComprehensiveOllamaDemo {
  constructor() {
    this.ollamaHost = process.env.OLLAMA_HOST || '10.1.1.42';
    this.ollamaPort = process.env.OLLAMA_PORT || 11434;
    this.model = process.env.OLLAMA_MODEL || 'gpt-oss';
    
    // Use optimized configurations from A/B testing
    this.configs = {
      ultraFast: {
        name: "Ultra Fast",
        description: "~2.5s response time, optimized for quick interactions",
        options: {
          temperature: 0.1,
          num_predict: 50,
          top_k: 10,
          top_p: 0.7,
          num_ctx: 1024,
          repeat_penalty: 1.0
        },
        useCases: ['quick-answer', 'simple-code', 'yes-no', 'brief-explanation']
      },
      development: {
        name: "Development Mode",
        description: "~3.8s response time, balanced for coding tasks",
        options: {
          temperature: 0.2,
          num_predict: 80,
          top_k: 15,
          top_p: 0.75,
          num_ctx: 1536,
          repeat_penalty: 1.05
        },
        useCases: ['code-review', 'bug-analysis', 'dev-assistance', 'debugging']
      },
      comprehensive: {
        name: "Comprehensive Mode",
        description: "~4.5s response time, detailed responses",
        options: {
          temperature: 0.2,
          num_predict: 150,
          top_k: 20,
          top_p: 0.8,
          num_ctx: 2048,
          repeat_penalty: 1.05
        },
        useCases: ['documentation', 'code-explanation', 'complex-analysis', 'refactoring']
      }
    };
    
    this.demoScenarios = [
      {
        category: "Code Generation",
        scenarios: [
          {
            name: "Simple Function Generation",
            config: "ultraFast",
            prompt: "Write a Python function that reverses a string",
            expectedFeatures: ['function definition', 'string reversal', 'return statement']
          },
          {
            name: "Advanced Algorithm",
            config: "development",
            prompt: "Create a Python function that implements binary search with detailed comments",
            expectedFeatures: ['binary search logic', 'comments', 'edge cases']
          },
          {
            name: "Complex Data Structure",
            config: "comprehensive",
            prompt: "Implement a Red-Black tree in Python with insertion, deletion, and search methods",
            expectedFeatures: ['class definition', 'multiple methods', 'tree operations']
          }
        ]
      },
      {
        category: "Code Review & Analysis",
        scenarios: [
          {
            name: "Quick Bug Spot",
            config: "ultraFast",
            prompt: "What's wrong with this code: def calc(x): return x/0",
            expectedFeatures: ['bug identification', 'division by zero', 'fix suggestion']
          },
          {
            name: "Security Review",
            config: "development",
            prompt: "Review this code for security issues: user_input = input(); exec(user_input)",
            expectedFeatures: ['security vulnerability', 'exec danger', 'mitigation advice']
          },
          {
            name: "Performance Analysis",
            config: "comprehensive",
            prompt: "Analyze this code for performance issues: for i in range(len(arr)): for j in range(len(arr)): if arr[i] == arr[j] and i != j: print('duplicate')",
            expectedFeatures: ['O(n²) complexity', 'optimization suggestions', 'better algorithm']
          }
        ]
      },
      {
        category: "Development Assistance",
        scenarios: [
          {
            name: "Quick Help",
            config: "ultraFast",
            prompt: "How do I check if a file exists in Python?",
            expectedFeatures: ['os.path.exists', 'pathlib', 'import statement']
          },
          {
            name: "Debugging Help",
            config: "development",
            prompt: "I'm getting 'list index out of range' error in my loop. How do I fix it?",
            expectedFeatures: ['bounds checking', 'len() function', 'prevention tips']
          },
          {
            name: "Best Practices Guide",
            config: "comprehensive",
            prompt: "What are the best practices for error handling in Python API development?",
            expectedFeatures: ['try-catch blocks', 'specific exceptions', 'logging', 'HTTP status codes']
          }
        ]
      },
      {
        category: "Documentation & Explanation",
        scenarios: [
          {
            name: "Quick Explanation",
            config: "ultraFast",
            prompt: "Explain what 'git pull' does in one sentence",
            expectedFeatures: ['fetch and merge', 'remote changes', 'local branch']
          },
          {
            name: "Concept Explanation",
            config: "development",
            prompt: "Explain how Python decorators work with a simple example",
            expectedFeatures: ['function wrapper', 'example code', '@decorator syntax']
          },
          {
            name: "Comprehensive Documentation",
            config: "comprehensive",
            prompt: "Write comprehensive documentation for a REST API endpoint that creates a user account",
            expectedFeatures: ['endpoint description', 'parameters', 'examples', 'error responses']
          }
        ]
      },
      {
        category: "Task Management Integration",
        scenarios: [
          {
            name: "Task Description Enhancement",
            config: "development",
            prompt: "Enhance this task: 'Fix the login bug' - make it more specific and actionable",
            expectedFeatures: ['specific steps', 'acceptance criteria', 'technical details']
          },
          {
            name: "Commit Message Generation",
            config: "ultraFast",
            prompt: "Generate a commit message for: Added error handling to user registration endpoint and fixed password validation",
            expectedFeatures: ['conventional format', 'concise description', 'imperative mood']
          },
          {
            name: "Test Case Generation",
            config: "comprehensive",
            prompt: "Generate test cases for a password validation function that requires 8+ chars, uppercase, lowercase, and special character",
            expectedFeatures: ['edge cases', 'positive tests', 'negative tests', 'boundary conditions']
          }
        ]
      }
    ];
    
    this.results = {
      totalScenarios: 0,
      successfulScenarios: 0,
      totalTime: 0,
      configPerformance: new Map(),
      categoryResults: new Map()
    };
  }

  async runDemo() {
    console.log('🚀 Comprehensive Ollama MCP Integration Demo');
    console.log('=' .repeat(60));
    console.log(`🎯 Target: ${this.ollamaHost}:${this.ollamaPort}`);
    console.log(`🤖 Model: ${this.model}`);
    console.log(`📊 Total Scenarios: ${this.getTotalScenarios()}`);
    console.log('');

    // Verify connection
    if (!await this.verifyConnection()) {
      console.log('❌ Cannot connect to Ollama. Please ensure it\'s running and accessible.');
      return;
    }

    console.log('✅ Connection verified. Starting comprehensive demo...\n');

    // Run all scenarios
    for (const category of this.demoScenarios) {
      await this.runCategory(category);
    }

    // Display final results
    this.displayFinalResults();
    this.generateRecommendations();
  }

  async verifyConnection() {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: this.ollamaHost,
        port: this.ollamaPort,
        path: '/api/version',
        method: 'GET',
        timeout: 5000
      }, (res) => resolve(res.statusCode === 200));
      
      req.on('error', () => resolve(false));
      req.on('timeout', () => resolve(false));
      req.end();
    });
  }

  async runCategory(category) {
    console.log(`\n📋 ${category.category}`);
    console.log('-' .repeat(40));
    
    const categoryResults = {
      total: category.scenarios.length,
      successful: 0,
      totalTime: 0,
      scenarios: []
    };

    for (const [index, scenario] of category.scenarios.entries()) {
      console.log(`\n[${index + 1}/${category.scenarios.length}] ${scenario.name}`);
      console.log(`⚙️ Config: ${scenario.config} (${this.configs[scenario.config].name})`);
      console.log(`❓ ${scenario.prompt}`);
      
      const result = await this.runScenario(scenario);
      categoryResults.scenarios.push(result);
      
      if (result.success) {
        categoryResults.successful++;
        console.log(`✅ Success: ${Math.round(result.duration)}ms`);
        console.log(`📝 Response: "${result.response.substring(0, 100)}..."`);
        
        // Check for expected features
        const foundFeatures = this.checkExpectedFeatures(result.response, scenario.expectedFeatures);
        if (foundFeatures.length > 0) {
          console.log(`🎯 Features found: ${foundFeatures.join(', ')}`);
        }
      } else {
        console.log(`❌ Failed: ${result.error}`);
      }
      
      categoryResults.totalTime += result.duration;
      
      // Update config performance stats
      this.updateConfigStats(scenario.config, result);
    }
    
    this.results.categoryResults.set(category.category, categoryResults);
    console.log(`\n📊 ${category.category} Summary:`);
    console.log(`   Success: ${categoryResults.successful}/${categoryResults.total}`);
    console.log(`   Avg Time: ${Math.round(categoryResults.totalTime / categoryResults.total)}ms`);
  }

  async runScenario(scenario) {
    const config = this.configs[scenario.config];
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        model: this.model,
        prompt: scenario.prompt,
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
        timeout: 15000
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
              config: scenario.config
            });
          } catch (error) {
            resolve({
              success: false,
              error: error.message,
              duration,
              config: scenario.config
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
          duration: performance.now() - startTime,
          config: scenario.config
        });
      });

      req.on('timeout', () => {
        resolve({
          success: false,
          error: 'Request timeout',
          duration: performance.now() - startTime,
          config: scenario.config
        });
      });

      req.write(postData);
      req.end();
    });
  }

  checkExpectedFeatures(response, expectedFeatures) {
    const lowerResponse = response.toLowerCase();
    return expectedFeatures.filter(feature => {
      const lowerFeature = feature.toLowerCase();
      return lowerResponse.includes(lowerFeature) || 
             lowerFeature.split(' ').some(word => lowerResponse.includes(word));
    });
  }

  updateConfigStats(configName, result) {
    const stats = this.results.configPerformance.get(configName) || {
      requests: 0,
      successes: 0,
      totalTime: 0,
      avgTime: 0
    };
    
    stats.requests++;
    stats.totalTime += result.duration;
    stats.avgTime = stats.totalTime / stats.requests;
    
    if (result.success) {
      stats.successes++;
    }
    
    this.results.configPerformance.set(configName, stats);
    this.results.totalScenarios++;
    this.results.totalTime += result.duration;
    
    if (result.success) {
      this.results.successfulScenarios++;
    }
  }

  displayFinalResults() {
    console.log('\n\n🏁 COMPREHENSIVE DEMO RESULTS');
    console.log('=' .repeat(60));
    
    // Overall performance
    const successRate = (this.results.successfulScenarios / this.results.totalScenarios) * 100;
    const avgTime = this.results.totalTime / this.results.totalScenarios;
    
    console.log(`\n📊 Overall Performance:`);
    console.log(`   Total Scenarios: ${this.results.totalScenarios}`);
    console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`   Average Response Time: ${Math.round(avgTime)}ms`);
    console.log(`   Total Demo Time: ${Math.round(this.results.totalTime / 1000)}s`);
    
    // Configuration performance
    console.log(`\n⚙️ Configuration Performance:`);
    for (const [configName, stats] of this.results.configPerformance.entries()) {
      const config = this.configs[configName];
      const successRate = (stats.successes / stats.requests) * 100;
      
      console.log(`   ${config.name}:`);
      console.log(`     Avg Time: ${Math.round(stats.avgTime)}ms`);
      console.log(`     Success Rate: ${successRate.toFixed(0)}%`);
      console.log(`     Use Cases: ${config.useCases.join(', ')}`);
    }
    
    // Category breakdown
    console.log(`\n📋 Category Breakdown:`);
    for (const [categoryName, categoryResult] of this.results.categoryResults.entries()) {
      const successRate = (categoryResult.successful / categoryResult.total) * 100;
      const avgTime = categoryResult.totalTime / categoryResult.total;
      
      console.log(`   ${categoryName}:`);
      console.log(`     Success: ${categoryResult.successful}/${categoryResult.total} (${successRate.toFixed(0)}%)`);
      console.log(`     Avg Time: ${Math.round(avgTime)}ms`);
    }
  }

  generateRecommendations() {
    console.log('\n\n💡 RECOMMENDATIONS & INSIGHTS');
    console.log('=' .repeat(60));
    
    // Performance analysis
    const fastestConfig = Array.from(this.results.configPerformance.entries())
      .sort((a, b) => a[1].avgTime - b[1].avgTime)[0];
    
    const mostReliableConfig = Array.from(this.results.configPerformance.entries())
      .sort((a, b) => (b[1].successes/b[1].requests) - (a[1].successes/a[1].requests))[0];
    
    console.log(`\n🚀 Performance Insights:`);
    console.log(`   Fastest Config: ${this.configs[fastestConfig[0]].name} (${Math.round(fastestConfig[1].avgTime)}ms avg)`);
    console.log(`   Most Reliable: ${this.configs[mostReliableConfig[0]].name} (${((mostReliableConfig[1].successes/mostReliableConfig[1].requests)*100).toFixed(0)}% success)`);
    
    // Use case recommendations
    console.log(`\n🎯 Recommended Usage Patterns:`);
    console.log(`   Interactive Development: Use Ultra Fast config for quick responses`);
    console.log(`   Code Review & Analysis: Use Development Mode for balanced quality/speed`);
    console.log(`   Documentation & Complex Tasks: Use Comprehensive Mode for detailed output`);
    
    // Integration recommendations
    console.log(`\n🔧 Integration Recommendations:`);
    console.log(`   1. Implement smart routing based on task type and urgency`);
    console.log(`   2. Use Ultra Fast for time-critical operations (<3s requirement)`);
    console.log(`   3. Cache frequently requested code patterns`);
    console.log(`   4. Implement fallback to Claude API for critical failures`);
    console.log(`   5. Monitor response times and adjust configurations dynamically`);
    
    // Cost analysis
    const totalRequests = this.results.totalScenarios;
    const estimatedClaudeCost = totalRequests * 0.000025; // Rough estimate
    
    console.log(`\n💰 Cost Comparison:`);
    console.log(`   Demo Requests: ${totalRequests}`);
    console.log(`   Ollama Cost: $0.0000 (FREE!)`);
    console.log(`   Estimated Claude Cost: $${estimatedClaudeCost.toFixed(6)}`);
    console.log(`   Savings: 100%`);
    
    // Production readiness
    const overallSuccessRate = (this.results.successfulScenarios / this.results.totalScenarios) * 100;
    const avgResponseTime = this.results.totalTime / this.results.totalScenarios;
    
    console.log(`\n📋 Production Readiness Assessment:`);
    
    if (overallSuccessRate >= 90 && avgResponseTime < 5000) {
      console.log(`   🟢 READY: High success rate (${overallSuccessRate.toFixed(0)}%) and good performance`);
      console.log(`   Recommended: Deploy with confidence for development tasks`);
    } else if (overallSuccessRate >= 75 && avgResponseTime < 10000) {
      console.log(`   🟡 CAUTION: Good but monitor closely in production`);
      console.log(`   Recommended: Deploy with fallback mechanisms`);
    } else {
      console.log(`   🔴 NOT READY: Needs optimization before production deployment`);
      console.log(`   Recommended: Investigate performance issues or model selection`);
    }
    
    console.log(`\n🎉 Demo Complete! Ollama MCP integration shows strong potential for:`);
    console.log(`   ✓ Local development assistance`);
    console.log(`   ✓ Cost-effective AI integration`);
    console.log(`   ✓ Fast iteration and prototyping`);
    console.log(`   ✓ Privacy-preserving code generation`);
    console.log(`\n💾 Use these insights to optimize your MCP integration!`);
  }

  getTotalScenarios() {
    return this.demoScenarios.reduce((total, category) => total + category.scenarios.length, 0);
  }
}

// Run the comprehensive demo
async function main() {
  const demo = new ComprehensiveOllamaDemo();
  await demo.runDemo();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ComprehensiveOllamaDemo;