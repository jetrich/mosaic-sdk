# Ollama A/B Testing Suite

Comprehensive testing tools to evaluate Ollama vs Claude API performance for immediate cost and speed optimization.

## 🚀 Quick Start

### Prerequisites
```bash
# 1. Install and start Ollama
curl -fsSL https://ollama.ai/install.sh | sh
ollama serve

# 2. Pull a model (recommended)
ollama pull llama3.2
# OR: ollama pull codellama:latest
# OR: ollama pull mistral
```

### Run Tests Immediately

#### 1. Quick Performance Test
```bash
# Run immediate A/B comparison
node scripts/immediate-test.js

# Expected output:
# ✅ Ollama vs Claude speed/cost comparison
# 📊 Real performance metrics
# 💰 Cost savings analysis
```

#### 2. MosAIc Integration Demo
```bash
# Test real-world development scenarios
node scripts/mosaic-integration-demo.js

# Tests scenarios like:
# • Task description enhancement
# • Code review comments  
# • Test case generation
# • Documentation creation
# • Error message improvement
```

#### 3. Real-time Performance Monitor
```bash
# Monitor Ollama performance live
node scripts/performance-monitor.js

# Shows:
# • Live response times
# • Success rates
# • Tokens per second
# • Cost comparisons
# • Performance recommendations
```

#### 4. Comprehensive TypeScript A/B Test
```bash
# Full test suite (requires TypeScript compilation)
npx tsc && node dist/tests/ab-test.js
```

## 📊 Test Results Overview

### Immediate Benefits You'll See:

**Speed Comparison:**
- Ollama: ~500-2000ms response times (local)
- Claude API: ~300-1000ms (network dependent)
- Winner: Varies by model and hardware

**Cost Analysis:**
- Ollama: $0.0000 per request (FREE!)
- Claude Haiku: ~$0.00025 per 1K tokens
- **Savings: 100% cost reduction for bulk operations**

**Quality Assessment:**
- Code generation: Comparable for simple tasks
- Documentation: Good for standard formats
- Analysis: Claude often more nuanced
- **Recommendation: Hybrid approach**

## 🎯 Real-World Test Scenarios

### Development Workflow Tests
1. **Code Generation**
   - Simple functions ✅
   - Algorithm implementations ✅
   - Data structures ✅

2. **Code Review**
   - Bug detection ✅
   - Performance suggestions ✅
   - Best practices ✅

3. **Documentation**
   - API docs ✅
   - README sections ✅
   - Code comments ✅

4. **Task Management**
   - Task description enhancement ✅
   - Commit message generation ✅
   - Error message improvement ✅

## 📈 Performance Benchmarks

### Typical Results (llama3.2 on modern hardware):
```
🦙 Ollama Performance:
   Success Rate: 95-100%
   Avg Response: 800-1500ms
   Throughput: 20-50 tokens/sec
   Cost: $0.0000

🤖 Claude Haiku Performance:
   Success Rate: 99%
   Avg Response: 400-800ms  
   Throughput: 40-80 tokens/sec
   Cost: $0.00025/1K tokens
```

### Cost Savings Examples:
- **1,000 requests/day: ~$2.50 → $0.00 (100% savings)**
- **10,000 requests/month: ~$25.00 → $0.00**
- **100,000 requests/year: ~$300.00 → $0.00**

## 🔧 Optimization Tips

### For Best Ollama Performance:
1. **Hardware:** Use GPU acceleration if available
2. **Models:** Choose right-sized models for your tasks
   - `llama3.2`: Great general purpose
   - `codellama`: Best for code tasks
   - `mistral`: Fast and lightweight
3. **Configuration:** Tune temperature/context length
4. **Caching:** Keep models loaded in memory

### Hybrid Strategy Recommendations:
```javascript
// Example routing logic
function chooseProvider(task) {
  if (task.category === 'code' && task.complexity === 'simple') {
    return 'ollama';
  }
  if (task.priority === 'critical' || task.complexity === 'high') {
    return 'claude';
  }
  if (task.volume === 'bulk') {
    return 'ollama';
  }
  return 'claude'; // Default to quality
}
```

## 🛠️ Customizing Tests

### Add Your Own Scenarios:
```javascript
// In mosaic-integration-demo.js
const customScenarios = [
  {
    name: "Your Custom Test",
    description: "Test specific to your workflow",
    ollamaPrompt: "Your test prompt...",
    claudePrompt: "Your test prompt...",
    category: "custom",
    priority: "medium"
  }
];
```

### Monitor Specific Models:
```bash
# Test with specific model
ollama pull codellama:13b
node scripts/immediate-test.js codellama:13b
```

## 📊 Reading Results

### Key Metrics to Watch:
- **Response Time:** Lower is better for UX
- **Success Rate:** Should be >95% for production
- **Tokens/sec:** Higher = better throughput
- **Cost/request:** Ollama always wins here
- **Quality:** Subjective, test with real tasks

### Red Flags:
- Success rate <80%
- Response times >5 seconds
- High error rates
- Poor quality outputs

## 🚨 Troubleshooting

### Ollama Not Working?
```bash
# Check if running
curl http://localhost:11434/api/version

# Start Ollama
ollama serve

# Check models
ollama list

# Pull a model if none available
ollama pull llama3.2
```

### Poor Performance?
1. Check system resources (CPU/RAM usage)
2. Try smaller model (e.g., `llama3.2` vs `llama3.2:70b`)
3. Reduce `num_ctx` parameter
4. Enable GPU acceleration if available

### Tests Failing?
1. Ensure Ollama is running: `ollama serve`
2. Check model availability: `ollama list`
3. Verify network connectivity
4. Check Node.js version (requires v18+)

## 📋 Next Steps

### After Running Tests:
1. **Analyze Results:** Look for patterns in speed/quality
2. **Plan Integration:** Identify best use cases for Ollama
3. **Set Up Routing:** Implement hybrid Claude/Ollama system
4. **Monitor Production:** Track real-world performance
5. **Optimize Costs:** Calculate actual savings

### Integration Options:
- Use Ollama for development/testing
- Route by task complexity
- Implement automatic fallbacks
- Monitor and optimize continuously

---

## 🎉 Start Testing Now!

```bash
# Quick 2-minute test
node scripts/immediate-test.js

# Full integration analysis  
node scripts/mosaic-integration-demo.js

# Live performance monitoring
node scripts/performance-monitor.js
```

**Expected outcome:** Clear data showing where Ollama can save costs and improve development speed while maintaining acceptable quality.