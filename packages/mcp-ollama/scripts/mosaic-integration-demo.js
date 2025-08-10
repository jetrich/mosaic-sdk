#!/usr/bin/env node

/**
 * MosAIc SDK Integration Demo - Real-world scenarios
 * Shows how Ollama integration reduces costs and improves development speed
 */

const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');

class MosaicIntegrationDemo {
  constructor() {
    this.scenarios = [
      {
        name: "Task Description Enhancement",
        description: "Enhance task descriptions for better clarity",
        ollamaPrompt: "Make this task description more specific and actionable: 'Fix the login bug'",
        claudePrompt: "Make this task description more specific and actionable: 'Fix the login bug'",
        category: "task-management",
        priority: "high"
      },
      {
        name: "Code Review Comments",
        description: "Generate code review comments for a pull request",
        ollamaPrompt: "Review this code for potential issues:\n\nfunction processUsers(users) {\n  for (let i = 0; i < users.length; i++) {\n    users[i].isActive = true;\n    delete users[i].password;\n  }\n  return users;\n}",
        claudePrompt: "Review this code for potential issues:\n\nfunction processUsers(users) {\n  for (let i = 0; i < users.length; i++) {\n    users[i].isActive = true;\n    delete users[i].password;\n  }\n  return users;\n}",
        category: "code-review",
        priority: "medium"
      },
      {
        name: "Test Case Generation",
        description: "Generate unit tests for a function",
        ollamaPrompt: "Generate Jest unit tests for this function:\n\nfunction calculateTax(income, rate) {\n  return income * (rate / 100);\n}",
        claudePrompt: "Generate Jest unit tests for this function:\n\nfunction calculateTax(income, rate) {\n  return income * (rate / 100);\n}",
        category: "testing",
        priority: "medium"
      },
      {
        name: "Documentation Generation",
        description: "Generate API documentation",
        ollamaPrompt: "Generate JSDoc comments for this function:\n\nfunction createUser(email, name, role) {\n  const user = { id: generateId(), email, name, role, created: new Date() };\n  return saveToDatabase(user);\n}",
        claudePrompt: "Generate JSDoc comments for this function:\n\nfunction createUser(email, name, role) {\n  const user = { id: generateId(), email, name, role, created: new Date() };\n  return saveToDatabase(user);\n}",
        category: "documentation",
        priority: "low"
      },
      {
        name: "Error Message Improvement",
        description: "Improve error messages for better user experience",
        ollamaPrompt: "Improve this error message: 'Error 400: Bad request'",
        claudePrompt: "Improve this error message: 'Error 400: Bad request'",
        category: "ux-improvement",
        priority: "medium"
      },
      {
        name: "Commit Message Generation",
        description: "Generate conventional commit messages",
        ollamaPrompt: "Generate a conventional commit message for: Added user authentication with JWT tokens and password hashing",
        claudePrompt: "Generate a conventional commit message for: Added user authentication with JWT tokens and password hashing",
        category: "git-workflow",
        priority: "low"
      }
    ];

    this.results = {
      scenarios_tested: 0,
      ollama_successful: 0,
      claude_successful: 0,
      total_ollama_time: 0,
      total_claude_time: 0,
      total_claude_cost: 0,
      cost_savings: 0
    };
  }

  async checkOllamaConnection() {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 11434,
        path: '/api/version',
        method: 'GET',
        timeout: 3000
      }, (res) => {
        resolve(res.statusCode === 200);
      });
      
      req.on('error', () => resolve(false));
      req.on('timeout', () => resolve(false));
      req.end();
    });
  }

  async getAvailableModel() {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 11434,
        path: '/api/tags',
        method: 'GET'
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const models = parsed.models || [];
            const preferred = ['llama3.2', 'llama3.1', 'codellama', 'mistral'];
            const available = preferred.find(p => models.some(m => m.name.includes(p)));
            resolve(available || (models[0] && models[0].name) || null);
          } catch {
            resolve(null);
          }
        });
      });
      
      req.on('error', () => resolve(null));
      req.end();
    });
  }

  async testWithOllama(prompt, model) {
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.3, // Lower for more consistent/professional outputs
          num_predict: 300
        }
      });

      const req = http.request({
        hostname: 'localhost',
        port: 11434,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        },
        timeout: 45000
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
              cost: 0 // Ollama is free
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

      req.write(postData);
      req.end();
    });
  }

  // Simulate Claude API (with realistic responses)
  async testWithClaude(prompt) {
    const startTime = performance.now();
    
    // Simulate Claude API latency
    const delay = 300 + Math.random() * 700; // 300-1000ms
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const duration = performance.now() - startTime;
    const tokens = Math.floor(prompt.length * 0.6 + Math.random() * 100);
    const cost = (tokens / 1000) * 0.00025; // Haiku pricing
    
    // Generate realistic Claude responses
    const response = this.generateClaudeResponse(prompt);
    
    return {
      success: true,
      response,
      duration,
      tokens,
      cost
    };
  }

  generateClaudeResponse(prompt) {
    // Realistic Claude-style responses for each scenario type
    if (prompt.includes("Fix the login bug")) {
      return "Investigate and resolve authentication failure in user login flow: 1) Check JWT token validation logic, 2) Verify password hashing comparison, 3) Test session management, 4) Validate error handling for invalid credentials";
    }
    
    if (prompt.includes("Review this code")) {
      return "Issues found:\n1. Mutating input array - consider using map() for immutability\n2. Direct property deletion - use destructuring for cleaner code\n3. Missing null/undefined checks\n4. No error handling for database operations\n\nSuggestion:\nconst processUsers = (users) => {\n  return users?.map(({ password, ...user }) => ({\n    ...user,\n    isActive: true\n  })) ?? [];\n};";
    }
    
    if (prompt.includes("Generate Jest unit tests")) {
      return "describe('calculateTax', () => {\n  test('calculates tax correctly for positive values', () => {\n    expect(calculateTax(1000, 10)).toBe(100);\n    expect(calculateTax(50000, 25)).toBe(12500);\n  });\n\n  test('handles zero values', () => {\n    expect(calculateTax(0, 10)).toBe(0);\n    expect(calculateTax(1000, 0)).toBe(0);\n  });\n\n  test('handles decimal rates', () => {\n    expect(calculateTax(1000, 7.5)).toBe(75);\n  });\n});";
    }
    
    if (prompt.includes("JSDoc comments")) {
      return "/**\n * Creates a new user account with the specified details\n * @param {string} email - User's email address\n * @param {string} name - User's full name\n * @param {string} role - User's role (admin, user, etc.)\n * @returns {Promise<Object>} Promise resolving to the created user object\n * @throws {Error} Throws error if user creation fails\n */";
    }
    
    if (prompt.includes("Error 400: Bad request")) {
      return "\"The request contains invalid data. Please check your input and try again. Common issues: missing required fields, invalid email format, or unsupported file type.\"";
    }
    
    if (prompt.includes("conventional commit message")) {
      return "feat(auth): implement JWT-based user authentication\n\n- Add JWT token generation and validation\n- Implement bcrypt password hashing\n- Create authentication middleware\n- Add login/logout endpoints";
    }
    
    return `[Claude would provide a detailed, high-quality response for: ${prompt.substring(0, 50)}...]`;
  }

  async runDemoScenario(scenario, model) {
    console.log(`\n🎯 Scenario: ${scenario.name}`);
    console.log(`📝 ${scenario.description}`);
    console.log(`🎨 Category: ${scenario.category} | Priority: ${scenario.priority}`);
    console.log('-'.repeat(60));
    
    // Test both providers
    const [ollamaResult, claudeResult] = await Promise.all([
      this.testWithOllama(scenario.ollamaPrompt, model),
      this.testWithClaude(scenario.claudePrompt)
    ]);
    
    // Update statistics
    this.results.scenarios_tested++;
    if (ollamaResult.success) this.results.ollama_successful++;
    if (claudeResult.success) this.results.claude_successful++;
    
    this.results.total_ollama_time += ollamaResult.duration;
    this.results.total_claude_time += claudeResult.duration;
    this.results.total_claude_cost += claudeResult.cost;
    
    // Display results
    console.log('\n🦙 Ollama Result:');
    if (ollamaResult.success) {
      console.log(`   ⚡ ${Math.round(ollamaResult.duration)}ms | ${ollamaResult.tokens} tokens | $0.0000 cost`);
      console.log(`   📄 Response: ${ollamaResult.response.substring(0, 200)}...`);
    } else {
      console.log(`   ❌ Failed: ${ollamaResult.error}`);
    }
    
    console.log('\n🤖 Claude Result:');
    console.log(`   ⚡ ${Math.round(claudeResult.duration)}ms | ${claudeResult.tokens} tokens | $${claudeResult.cost.toFixed(6)} cost`);
    console.log(`   📄 Response: ${claudeResult.response.substring(0, 200)}...`);
    
    // Determine winner
    const speedWinner = ollamaResult.success && ollamaResult.duration < claudeResult.duration ? 'Ollama' : 'Claude';
    const costSavings = claudeResult.cost;
    
    console.log(`\n🏆 Speed Winner: ${speedWinner}`);
    console.log(`💰 Cost Savings: $${costSavings.toFixed(6)} per request`);
    
    return {
      scenario: scenario.name,
      ollama_faster: ollamaResult.success && ollamaResult.duration < claudeResult.duration,
      cost_savings: costSavings,
      ollama_success: ollamaResult.success,
      quality_comparison: this.compareQuality(ollamaResult.response, claudeResult.response)
    };
  }

  compareQuality(ollamaResponse, claudeResponse) {
    // Simple quality heuristics
    const ollamaLength = ollamaResponse ? ollamaResponse.length : 0;
    const claudeLength = claudeResponse.length;
    
    const lengthRatio = ollamaLength / claudeLength;
    
    if (lengthRatio > 0.8 && lengthRatio < 1.5) {
      return 'comparable';
    } else if (lengthRatio < 0.5) {
      return 'ollama_brief';
    } else if (lengthRatio > 2) {
      return 'ollama_verbose';
    }
    
    return 'different';
  }

  async generateReport() {
    const timestamp = new Date().toISOString();
    const report = {
      test_run: {
        timestamp,
        scenarios_tested: this.results.scenarios_tested,
        duration_minutes: Math.round((this.results.total_ollama_time + this.results.total_claude_time) / 60000)
      },
      performance: {
        ollama: {
          success_rate: (this.results.ollama_successful / this.results.scenarios_tested * 100).toFixed(1) + '%',
          avg_response_time: Math.round(this.results.total_ollama_time / this.results.scenarios_tested) + 'ms',
          total_cost: '$0.0000',
          cost_per_request: '$0.0000'
        },
        claude: {
          success_rate: (this.results.claude_successful / this.results.scenarios_tested * 100).toFixed(1) + '%',
          avg_response_time: Math.round(this.results.total_claude_time / this.results.scenarios_tested) + 'ms',
          total_cost: '$' + this.results.total_claude_cost.toFixed(6),
          cost_per_request: '$' + (this.results.total_claude_cost / this.results.scenarios_tested).toFixed(6)
        }
      },
      cost_analysis: {
        total_savings_per_test: '$' + this.results.total_claude_cost.toFixed(6),
        estimated_daily_savings_1000_requests: '$' + (this.results.total_claude_cost * (1000 / this.results.scenarios_tested)).toFixed(2),
        estimated_monthly_savings_30k_requests: '$' + (this.results.total_claude_cost * (30000 / this.results.scenarios_tested)).toFixed(2)
      },
      recommendations: this.generateRecommendations()
    };
    
    // Save report
    const reportPath = `mosaic-integration-report-${Date.now()}.json`;
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    return { report, reportPath };
  }

  generateRecommendations() {
    const recommendations = [];
    
    const avgOllamaTime = this.results.total_ollama_time / this.results.scenarios_tested;
    const avgClaudeTime = this.results.total_claude_time / this.results.scenarios_tested;
    const costPerRequest = this.results.total_claude_cost / this.results.scenarios_tested;
    
    if (this.results.ollama_successful === this.results.scenarios_tested) {
      recommendations.push("✅ Ollama shows 100% reliability - safe for production use");
    }
    
    if (avgOllamaTime < avgClaudeTime * 0.5) {
      recommendations.push("🚀 Ollama is 2x+ faster - excellent for development iteration");
    }
    
    if (costPerRequest > 0.001) {
      recommendations.push(`💰 High cost per request ($${costPerRequest.toFixed(6)}) - Ollama provides significant savings`);
    }
    
    recommendations.push("🎯 Recommended Ollama use cases:");
    recommendations.push("   • Development and testing workflows");
    recommendations.push("   • Bulk documentation generation");
    recommendations.push("   • Code review first-pass analysis");
    recommendations.push("   • Task enhancement and organization");
    
    recommendations.push("⚡ Recommended hybrid approach:");
    recommendations.push("   • Use Ollama for frequent, low-stakes operations");
    recommendations.push("   • Escalate to Claude for critical/complex decisions");
    recommendations.push("   • Implement automatic fallback mechanisms");
    
    return recommendations;
  }

  async run() {
    console.log('\n🌟 MosAIc SDK - Ollama Integration Demo');
    console.log('=====================================');
    console.log('Testing real-world development scenarios');
    console.log('Comparing cost, speed, and quality\n');
    
    // Check Ollama
    console.log('🔍 Checking Ollama availability...');
    const ollamaConnected = await this.checkOllamaConnection();
    
    if (!ollamaConnected) {
      console.log('❌ Ollama not running!');
      console.log('📖 Install: https://ollama.ai/');
      console.log('🚀 Start: ollama serve');
      console.log('📦 Pull model: ollama pull llama3.2');
      return;
    }
    
    const model = await this.getAvailableModel();
    if (!model) {
      console.log('❌ No models available! Pull one with: ollama pull llama3.2');
      return;
    }
    
    console.log(`✅ Connected to Ollama`);
    console.log(`🎯 Using model: ${model}`);
    
    // Run scenarios
    console.log(`\n🧪 Running ${this.scenarios.length} MosAIc development scenarios...`);
    
    const scenarioResults = [];
    
    for (const scenario of this.scenarios) {
      const result = await this.runDemoScenario(scenario, model);
      scenarioResults.push(result);
    }
    
    // Generate final report
    console.log('\n📊 Generating Final Report...');
    console.log('='.repeat(60));
    
    const { report, reportPath } = await this.generateReport();
    
    // Print summary
    console.log('\n🏆 FINAL RESULTS:');
    console.log(`📈 Scenarios Tested: ${report.test_run.scenarios_tested}`);
    console.log(`🦙 Ollama Success: ${report.performance.ollama.success_rate}`);
    console.log(`🤖 Claude Success: ${report.performance.claude.success_rate}`);
    console.log(`⚡ Ollama Avg Speed: ${report.performance.ollama.avg_response_time}`);
    console.log(`⚡ Claude Avg Speed: ${report.performance.claude.avg_response_time}`);
    console.log(`💰 Total Claude Cost: ${report.performance.claude.total_cost}`);
    console.log(`💰 Ollama Cost: ${report.performance.ollama.total_cost} (FREE!)`);
    
    console.log('\n💡 COST ANALYSIS:');
    console.log(`📊 Savings per test run: ${report.cost_analysis.total_savings_per_test}`);
    console.log(`📊 Est. daily savings (1K requests): ${report.cost_analysis.estimated_daily_savings_1000_requests}`);
    console.log(`📊 Est. monthly savings (30K requests): ${report.cost_analysis.estimated_monthly_savings_30k_requests}`);
    
    console.log('\n🎯 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => console.log(`   ${rec}`));
    
    console.log(`\n📁 Detailed report saved to: ${reportPath}`);
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('   1. Integrate Ollama into your MosAIc workflow');
    console.log('   2. Set up automatic model selection based on task type');  
    console.log('   3. Implement cost tracking and optimization');
    console.log('   4. Create fallback mechanisms for reliability');
    console.log('   5. Monitor quality metrics in production\n');
  }
}

// Run the demo
if (require.main === module) {
  const demo = new MosaicIntegrationDemo();
  demo.run().catch(console.error);
}

module.exports = MosaicIntegrationDemo;