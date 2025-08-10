#!/usr/bin/env node

/**
 * Real-time Performance Monitor for Ollama vs Claude
 * Monitors actual usage patterns and provides live optimization recommendations
 */

const http = require('http');
const { performance } = require('perf_hooks');
const fs = require('fs').promises;

class OllamaPerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      successes: 0,
      failures: 0,
      totalResponseTime: 0,
      totalTokens: 0,
      averageResponseTime: 0,
      tokensPerSecond: 0,
      lastRequestTime: null,
      uptime: Date.now(),
      modelPerformance: new Map(),
      hourlyStats: new Map()
    };
    
    this.isMonitoring = false;
    this.monitorInterval = null;
    this.currentModel = null;
  }

  async startMonitoring() {
    console.log('🔍 Starting Ollama Performance Monitor...');
    
    // Check Ollama connection
    const connected = await this.checkOllama();
    if (!connected) {
      console.log('❌ Cannot connect to Ollama. Ensure it\'s running on localhost:11434');
      return;
    }
    
    // Get current model
    this.currentModel = await this.getCurrentModel();
    console.log(`✅ Monitoring model: ${this.currentModel || 'unknown'}`);
    
    this.isMonitoring = true;
    this.startRealTimeMonitoring();
    this.startPeriodicReporting();
    
    console.log('\n📊 Real-time monitoring started. Press Ctrl+C to stop.\n');
  }

  async checkOllama() {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 11434,
        path: '/api/version',
        method: 'GET',
        timeout: 2000
      }, (res) => resolve(res.statusCode === 200));
      
      req.on('error', () => resolve(false));
      req.on('timeout', () => resolve(false));
      req.end();
    });
  }

  async getCurrentModel() {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 11434,
        path: '/api/ps',
        method: 'GET'
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            const runningModel = result.models && result.models[0];
            resolve(runningModel ? runningModel.name : null);
          } catch {
            resolve(null);
          }
        });
      });
      
      req.on('error', () => resolve(null));
      req.end();
    });
  }

  startRealTimeMonitoring() {
    // Monitor Ollama performance every 5 seconds
    this.monitorInterval = setInterval(async () => {
      const testResult = await this.performHealthCheck();
      this.updateMetrics(testResult);
      this.displayLiveStats();
    }, 5000);
  }

  startPeriodicReporting() {
    // Generate detailed reports every minute
    setInterval(() => {
      this.generateHourlyReport();
    }, 60000);
  }

  async performHealthCheck() {
    const testPrompt = "Say 'OK' if you're working properly";
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        model: this.currentModel || 'llama3.2',
        prompt: testPrompt,
        stream: false,
        options: { num_predict: 5 }
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
        timeout: 10000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const endTime = performance.now();
          try {
            const result = JSON.parse(data);
            resolve({
              success: true,
              duration: endTime - startTime,
              tokens: result.eval_count || 0,
              model: result.model,
              response: result.response
            });
          } catch (error) {
            resolve({
              success: false,
              duration: endTime - startTime,
              error: error.message
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          duration: performance.now() - startTime,
          error: error.message
        });
      });

      req.write(postData);
      req.end();
    });
  }

  updateMetrics(result) {
    this.metrics.requests++;
    
    if (result.success) {
      this.metrics.successes++;
      this.metrics.totalResponseTime += result.duration;
      this.metrics.totalTokens += result.tokens;
      this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.successes;
      
      if (result.tokens > 0 && result.duration > 0) {
        this.metrics.tokensPerSecond = (result.tokens / result.duration) * 1000;
      }
      
      // Update model-specific metrics
      if (result.model) {
        const modelStats = this.metrics.modelPerformance.get(result.model) || {
          requests: 0,
          successes: 0,
          totalTime: 0,
          totalTokens: 0
        };
        
        modelStats.requests++;
        modelStats.successes++;
        modelStats.totalTime += result.duration;
        modelStats.totalTokens += result.tokens;
        
        this.metrics.modelPerformance.set(result.model, modelStats);
      }
    } else {
      this.metrics.failures++;
    }
    
    this.metrics.lastRequestTime = Date.now();
    
    // Update hourly stats
    const hour = new Date().getHours();
    const hourStats = this.metrics.hourlyStats.get(hour) || {
      requests: 0,
      successes: 0,
      avgResponseTime: 0,
      totalTime: 0
    };
    
    hourStats.requests++;
    if (result.success) {
      hourStats.successes++;
      hourStats.totalTime += result.duration;
      hourStats.avgResponseTime = hourStats.totalTime / hourStats.successes;
    }
    
    this.metrics.hourlyStats.set(hour, hourStats);
  }

  displayLiveStats() {
    // Clear screen and show live stats
    console.clear();
    console.log('🔍 Ollama Performance Monitor - Live Stats');
    console.log('=' .repeat(50));
    console.log(`⚡ Model: ${this.currentModel || 'Unknown'}`);
    console.log(`📊 Requests: ${this.metrics.requests} (${this.metrics.successes} successful)`);
    console.log(`🎯 Success Rate: ${((this.metrics.successes / this.metrics.requests) * 100).toFixed(1)}%`);
    console.log(`⏱️  Avg Response: ${Math.round(this.metrics.averageResponseTime)}ms`);
    console.log(`🚀 Tokens/sec: ${Math.round(this.metrics.tokensPerSecond)}`);
    console.log(`⏰ Uptime: ${Math.round((Date.now() - this.metrics.uptime) / 60000)} minutes`);
    
    if (this.metrics.failures > 0) {
      console.log(`❌ Failures: ${this.metrics.failures}`);
    }
    
    // Performance assessment
    const assessment = this.assessPerformance();
    console.log(`\n💡 Performance: ${assessment.status}`);
    console.log(`🎯 Recommendation: ${assessment.recommendation}`);
    
    // Cost comparison
    const costComparison = this.calculateCostComparison();
    console.log(`\n💰 Cost Analysis (vs Claude):`);
    console.log(`   Requests: ${this.metrics.requests}`);
    console.log(`   Estimated Claude cost: $${costComparison.estimatedClaudeCost.toFixed(6)}`);
    console.log(`   Ollama cost: $0.0000 (FREE!)`);
    console.log(`   Savings: $${costComparison.savings.toFixed(6)}`);
    
    console.log(`\n📈 Model Performance:`);
    for (const [model, stats] of this.metrics.modelPerformance.entries()) {
      const avgTime = stats.totalTime / stats.successes;
      const tokensPerSec = (stats.totalTokens / stats.totalTime) * 1000;
      console.log(`   ${model}: ${Math.round(avgTime)}ms avg, ${Math.round(tokensPerSec)}t/s`);
    }
    
    console.log(`\n🕐 Hourly Usage:`);
    const currentHour = new Date().getHours();
    for (let i = Math.max(0, currentHour - 3); i <= currentHour; i++) {
      const hourStats = this.metrics.hourlyStats.get(i);
      if (hourStats) {
        const successRate = ((hourStats.successes / hourStats.requests) * 100).toFixed(0);
        console.log(`   ${i}:00 - ${hourStats.requests} requests, ${successRate}% success, ${Math.round(hourStats.avgResponseTime)}ms avg`);
      }
    }
    
    console.log('\nPress Ctrl+C to stop monitoring and save report...');
  }

  assessPerformance() {
    const avgTime = this.metrics.averageResponseTime;
    const successRate = (this.metrics.successes / this.metrics.requests) * 100;
    const tokensPerSec = this.metrics.tokensPerSecond;
    
    if (successRate < 80) {
      return {
        status: '🔴 Poor (Low success rate)',
        recommendation: 'Check Ollama configuration and model availability'
      };
    }
    
    if (avgTime > 5000) {
      return {
        status: '🟡 Slow (>5s response time)',
        recommendation: 'Consider using a smaller/faster model or GPU acceleration'
      };
    }
    
    if (tokensPerSec > 50) {
      return {
        status: '🟢 Excellent (Fast & reliable)',
        recommendation: 'Great for production use! Consider expanding usage.'
      };
    }
    
    if (tokensPerSec > 20) {
      return {
        status: '🟢 Good (Solid performance)',
        recommendation: 'Suitable for most development tasks'
      };
    }
    
    return {
      status: '🟡 Fair (Could be optimized)',
      recommendation: 'Consider GPU acceleration or model optimization'
    };
  }

  calculateCostComparison() {
    // Estimate Claude costs (using Haiku pricing)
    const avgTokensPerRequest = this.metrics.totalTokens / this.metrics.successes || 50;
    const claudeCostPerToken = 0.00000025; // $0.25 per 1M tokens
    const estimatedClaudeCost = this.metrics.requests * avgTokensPerRequest * claudeCostPerToken;
    
    return {
      estimatedClaudeCost,
      savings: estimatedClaudeCost,
      avgTokensPerRequest
    };
  }

  async generateHourlyReport() {
    if (this.metrics.requests === 0) return;
    
    const report = {
      timestamp: new Date().toISOString(),
      monitoring_duration_minutes: Math.round((Date.now() - this.metrics.uptime) / 60000),
      performance_metrics: {
        total_requests: this.metrics.requests,
        successful_requests: this.metrics.successes,
        failed_requests: this.metrics.failures,
        success_rate_percent: ((this.metrics.successes / this.metrics.requests) * 100).toFixed(1),
        average_response_time_ms: Math.round(this.metrics.averageResponseTime),
        tokens_per_second: Math.round(this.metrics.tokensPerSecond),
        total_tokens: this.metrics.totalTokens
      },
      cost_analysis: this.calculateCostComparison(),
      model_performance: Object.fromEntries(this.metrics.modelPerformance),
      hourly_usage: Object.fromEntries(this.metrics.hourlyStats),
      assessment: this.assessPerformance()
    };
    
    // Save to file
    const filename = `ollama-performance-${Date.now()}.json`;
    await fs.writeFile(filename, JSON.stringify(report, null, 2));
  }

  async stopMonitoring() {
    console.log('\n🛑 Stopping performance monitor...');
    
    this.isMonitoring = false;
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
    
    // Generate final report
    console.log('📊 Generating final performance report...');
    const finalReport = await this.generateFinalReport();
    
    console.log('\n🎯 FINAL PERFORMANCE SUMMARY:');
    console.log(`📊 Total Requests: ${this.metrics.requests}`);
    console.log(`✅ Success Rate: ${((this.metrics.successes / this.metrics.requests) * 100).toFixed(1)}%`);
    console.log(`⚡ Avg Response: ${Math.round(this.metrics.averageResponseTime)}ms`);
    console.log(`🚀 Throughput: ${Math.round(this.metrics.tokensPerSecond)} tokens/sec`);
    
    const costComparison = this.calculateCostComparison();
    console.log(`💰 Estimated savings vs Claude: $${costComparison.savings.toFixed(6)}`);
    
    console.log(`\n📁 Detailed report saved as: ${finalReport.filename}`);
    
    console.log('\n✨ Monitoring session complete!');
    process.exit(0);
  }

  async generateFinalReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ollama-performance-report-${timestamp}.json`;
    
    const report = {
      session_info: {
        start_time: new Date(this.metrics.uptime).toISOString(),
        end_time: new Date().toISOString(),
        duration_minutes: Math.round((Date.now() - this.metrics.uptime) / 60000),
        model_monitored: this.currentModel
      },
      performance_summary: {
        total_requests: this.metrics.requests,
        successful_requests: this.metrics.successes,
        failed_requests: this.metrics.failures,
        success_rate_percent: parseFloat(((this.metrics.successes / this.metrics.requests) * 100).toFixed(1)),
        average_response_time_ms: Math.round(this.metrics.averageResponseTime),
        tokens_per_second: Math.round(this.metrics.tokensPerSecond),
        total_tokens_processed: this.metrics.totalTokens
      },
      cost_comparison: {
        ...this.calculateCostComparison(),
        estimated_monthly_savings: this.calculateCostComparison().savings * (30 * 24 * 60 / 5) // Extrapolate
      },
      performance_assessment: this.assessPerformance(),
      detailed_metrics: {
        model_performance: Object.fromEntries(this.metrics.modelPerformance),
        hourly_usage_patterns: Object.fromEntries(this.metrics.hourlyStats)
      },
      recommendations: this.generateFinalRecommendations()
    };
    
    await fs.writeFile(filename, JSON.stringify(report, null, 2));
    
    return { report, filename };
  }

  generateFinalRecommendations() {
    const recommendations = [];
    const successRate = (this.metrics.successes / this.metrics.requests) * 100;
    const avgTime = this.metrics.averageResponseTime;
    const tokensPerSec = this.metrics.tokensPerSecond;
    
    if (successRate >= 95) {
      recommendations.push('✅ Excellent reliability - safe for production deployment');
    } else if (successRate >= 80) {
      recommendations.push('⚠️ Good reliability - monitor for improvements');
    } else {
      recommendations.push('❌ Reliability issues detected - investigate configuration');
    }
    
    if (avgTime < 1000) {
      recommendations.push('🚀 Excellent response times - great user experience');
    } else if (avgTime < 3000) {
      recommendations.push('⏱️ Good response times - suitable for interactive use');
    } else {
      recommendations.push('🐌 Slow response times - consider optimization');
    }
    
    if (tokensPerSec > 50) {
      recommendations.push('💪 High throughput - excellent for bulk operations');
    } else if (tokensPerSec > 20) {
      recommendations.push('📊 Good throughput - suitable for regular use');
    } else {
      recommendations.push('📉 Low throughput - consider hardware upgrade');
    }
    
    const costSavings = this.calculateCostComparison().savings;
    if (costSavings > 0.01) {
      recommendations.push(`💰 Significant cost savings potential: $${costSavings.toFixed(4)} already saved`);
    }
    
    recommendations.push('🎯 Recommended next steps:');
    recommendations.push('   • Integrate into development workflow');
    recommendations.push('   • Set up automatic fallback to Claude for failures');
    recommendations.push('   • Monitor quality metrics in production');
    recommendations.push('   • Consider GPU acceleration for better performance');
    
    return recommendations;
  }
}

// Handle graceful shutdown
let monitor = null;

process.on('SIGINT', async () => {
  if (monitor) {
    await monitor.stopMonitoring();
  } else {
    process.exit(0);
  }
});

// Main execution
async function main() {
  monitor = new OllamaPerformanceMonitor();
  await monitor.startMonitoring();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = OllamaPerformanceMonitor;