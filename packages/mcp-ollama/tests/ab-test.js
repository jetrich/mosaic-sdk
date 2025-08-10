"use strict";
/**
 * @fileoverview A/B Testing framework for Ollama vs Claude API
 * @module @mosaicstack/mcp-ollama/tests
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_CASES = exports.ABTester = void 0;
const perf_hooks_1 = require("perf_hooks");
const OllamaGenerateTool_js_1 = require("../src/tools/OllamaGenerateTool.js");
const fs_1 = __importDefault(require("fs"));
/**
 * Test cases for A/B testing
 */
const TEST_CASES = [
    // Code generation tests
    {
        id: 'code-1',
        name: 'Simple function generation',
        category: 'code',
        prompt: 'Write a Python function to calculate the factorial of a number',
        expectedFormat: 'code',
        temperature: 0.2
    },
    {
        id: 'code-2',
        name: 'Algorithm implementation',
        category: 'code',
        prompt: 'Implement a binary search algorithm in JavaScript',
        expectedFormat: 'code',
        temperature: 0.2
    },
    {
        id: 'code-3',
        name: 'Data structure',
        category: 'code',
        prompt: 'Create a linked list class in TypeScript with add, remove, and find methods',
        expectedFormat: 'code',
        temperature: 0.2
    },
    // Text generation tests
    {
        id: 'text-1',
        name: 'Summary generation',
        category: 'text',
        prompt: 'Summarize the key benefits of using microservices architecture in 3 bullet points',
        expectedFormat: 'text',
        maxTokens: 200
    },
    {
        id: 'text-2',
        name: 'Documentation',
        category: 'text',
        prompt: 'Write a README section explaining how to install and use a Node.js package',
        expectedFormat: 'text'
    },
    // Analysis tests
    {
        id: 'analysis-1',
        name: 'Code review',
        category: 'analysis',
        prompt: `Review this code and identify potential issues:
    function processData(data) {
      for (let i = 0; i <= data.length; i++) {
        console.log(data[i].name);
      }
    }`,
        expectedFormat: 'text',
        temperature: 0.3
    },
    {
        id: 'analysis-2',
        name: 'Performance analysis',
        category: 'analysis',
        prompt: 'List 5 ways to optimize database query performance',
        expectedFormat: 'text'
    },
    // Creative tests
    {
        id: 'creative-1',
        name: 'Variable naming',
        category: 'creative',
        prompt: 'Suggest 5 good variable names for a user authentication token',
        expectedFormat: 'text',
        temperature: 0.8
    },
    // JSON generation tests
    {
        id: 'json-1',
        name: 'Structured data generation',
        category: 'text',
        prompt: 'Generate a JSON object representing a user profile with name, email, age, and skills array',
        expectedFormat: 'json'
    },
    {
        id: 'json-2',
        name: 'API response',
        category: 'code',
        prompt: 'Create a JSON API error response with status code, message, and timestamp',
        expectedFormat: 'json'
    }
];
exports.TEST_CASES = TEST_CASES;
/**
 * A/B Testing class
 */
class ABTester {
    ollamaTool;
    results = [];
    ollamaModel;
    claudeModel = 'claude-3-haiku';
    constructor(ollamaConfig, ollamaModel = 'llama3.2') {
        this.ollamaTool = new OllamaGenerateTool_js_1.OllamaGenerateTool(ollamaConfig);
        this.ollamaModel = ollamaModel;
    }
    /**
     * Run a single test case with Ollama
     */
    async runOllamaTest(testCase) {
        const startTime = perf_hooks_1.performance.now();
        const result = {
            testId: testCase.id,
            provider: 'ollama',
            model: this.ollamaModel,
            success: false,
            responseTime: 0
        };
        try {
            const response = await this.ollamaTool.call({
                prompt: testCase.prompt,
                model: this.ollamaModel,
                format: testCase.expectedFormat === 'json' ? 'json' : undefined,
                options: {
                    temperature: testCase.temperature,
                    num_predict: testCase.maxTokens
                }
            });
            const endTime = perf_hooks_1.performance.now();
            result.responseTime = endTime - startTime;
            if (response.success) {
                result.success = true;
                result.response = typeof response.data.response === 'string'
                    ? response.data.response
                    : JSON.stringify(response.data.response);
                result.tokensGenerated = response.data.metrics?.eval_count;
                if (result.tokensGenerated && result.responseTime > 0) {
                    result.tokenPerSecond = (result.tokensGenerated / result.responseTime) * 1000;
                }
                // Calculate quality metrics
                result.quality = this.assessQuality(result.response, testCase);
                // Ollama is free when running locally
                result.cost = 0;
            }
            else {
                result.error = response.error?.message || 'Unknown error';
            }
        }
        catch (error) {
            result.error = error instanceof Error ? error.message : String(error);
        }
        return result;
    }
    /**
     * Run a single test case with Claude (simulated)
     */
    async runClaudeTest(testCase) {
        // This is a simulation - in production, you'd call the actual Claude API
        const startTime = perf_hooks_1.performance.now();
        // Simulate API delay (100-500ms)
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
        const endTime = perf_hooks_1.performance.now();
        const result = {
            testId: testCase.id,
            provider: 'claude',
            model: this.claudeModel,
            success: true,
            responseTime: endTime - startTime,
            response: `[Simulated Claude response for: ${testCase.name}]`,
            tokensGenerated: Math.floor(50 + Math.random() * 200),
            cost: 0 // Would calculate based on actual token usage
        };
        result.tokenPerSecond = (result.tokensGenerated / result.responseTime) * 1000;
        result.quality = this.assessQuality(result.response, testCase);
        // Simulate Claude API costs (Haiku pricing)
        result.cost = (result.tokensGenerated / 1000) * 0.00025; // $0.25 per 1M tokens
        return result;
    }
    /**
     * Assess response quality
     */
    assessQuality(response, testCase) {
        const quality = {
            lengthScore: 0,
            formatCorrect: true,
            contentRelevance: 0
        };
        // Length score (0-1, where 1 is optimal length)
        const responseLength = response.length;
        const optimalLength = testCase.maxTokens ? testCase.maxTokens * 4 : 500; // Approximate chars
        quality.lengthScore = Math.min(responseLength / optimalLength, 1);
        // Format validation
        if (testCase.expectedFormat === 'json') {
            try {
                JSON.parse(response);
                quality.formatCorrect = true;
            }
            catch {
                quality.formatCorrect = false;
            }
        }
        else if (testCase.expectedFormat === 'code') {
            // Check for code indicators
            quality.formatCorrect = response.includes('function') ||
                response.includes('def') ||
                response.includes('class') ||
                response.includes('const') ||
                response.includes('=>');
        }
        // Content relevance (basic keyword matching)
        const promptKeywords = testCase.prompt.toLowerCase().split(/\s+/);
        const responseKeywords = response.toLowerCase().split(/\s+/);
        const matchingKeywords = promptKeywords.filter(keyword => responseKeywords.includes(keyword));
        quality.contentRelevance = matchingKeywords.length / promptKeywords.length;
        return quality;
    }
    /**
     * Run A/B test for all test cases
     */
    async runABTest(testCases = TEST_CASES) {
        console.log(`\n🧪 Starting A/B Test: Ollama (${this.ollamaModel}) vs Claude (${this.claudeModel})`);
        console.log(`📊 Running ${testCases.length} test cases...\n`);
        this.results = [];
        // Test connection to Ollama first
        const connected = await this.ollamaTool.testConnection();
        if (!connected) {
            throw new Error('Cannot connect to Ollama. Please ensure Ollama is running.');
        }
        for (const testCase of testCases) {
            console.log(`Running test: ${testCase.name}`);
            // Run both tests in parallel for fairness
            const [ollamaResult, claudeResult] = await Promise.all([
                this.runOllamaTest(testCase),
                this.runClaudeTest(testCase)
            ]);
            this.results.push(ollamaResult, claudeResult);
            // Print immediate results
            console.log(`  ✓ Ollama: ${ollamaResult.responseTime.toFixed(0)}ms${ollamaResult.success ? '' : ' (failed)'}`);
            console.log(`  ✓ Claude: ${claudeResult.responseTime.toFixed(0)}ms${claudeResult.success ? '' : ' (failed)'}`);
        }
        return this.generateSummary(testCases.length);
    }
    /**
     * Generate test summary
     */
    generateSummary(testCount) {
        const ollamaResults = this.results.filter(r => r.provider === 'ollama');
        const claudeResults = this.results.filter(r => r.provider === 'claude');
        const ollamaSuccesses = ollamaResults.filter(r => r.success);
        const claudeSuccesses = claudeResults.filter(r => r.success);
        const summary = {
            timestamp: new Date().toISOString(),
            testCases: testCount,
            results: {
                ollama: {
                    model: this.ollamaModel,
                    successRate: (ollamaSuccesses.length / ollamaResults.length) * 100,
                    avgResponseTime: ollamaSuccesses.reduce((sum, r) => sum + r.responseTime, 0) / ollamaSuccesses.length,
                    avgTokensPerSecond: ollamaSuccesses.reduce((sum, r) => sum + (r.tokenPerSecond || 0), 0) / ollamaSuccesses.length,
                    totalCost: ollamaResults.reduce((sum, r) => sum + (r.cost || 0), 0),
                    failures: ollamaResults.length - ollamaSuccesses.length
                },
                claude: {
                    model: this.claudeModel,
                    successRate: (claudeSuccesses.length / claudeResults.length) * 100,
                    avgResponseTime: claudeSuccesses.reduce((sum, r) => sum + r.responseTime, 0) / claudeSuccesses.length,
                    avgTokensPerSecond: claudeSuccesses.reduce((sum, r) => sum + (r.tokenPerSecond || 0), 0) / claudeSuccesses.length,
                    totalCost: claudeResults.reduce((sum, r) => sum + (r.cost || 0), 0),
                    failures: claudeResults.length - claudeSuccesses.length
                }
            },
            winner: {
                speed: this.determineWinner('speed', summary.results),
                reliability: this.determineWinner('reliability', summary.results),
                cost: this.determineWinner('cost', summary.results),
                overall: 'tie' // Will be calculated
            },
            recommendations: []
        };
        // Determine overall winner
        const wins = {
            ollama: 0,
            claude: 0
        };
        if (summary.winner.speed === 'ollama')
            wins.ollama++;
        if (summary.winner.speed === 'claude')
            wins.claude++;
        if (summary.winner.reliability === 'ollama')
            wins.ollama++;
        if (summary.winner.reliability === 'claude')
            wins.claude++;
        if (summary.winner.cost === 'ollama')
            wins.ollama++;
        if (summary.winner.cost === 'claude')
            wins.claude++;
        summary.winner.overall = wins.ollama > wins.claude ? 'ollama' :
            wins.claude > wins.ollama ? 'claude' : 'tie';
        // Generate recommendations
        summary.recommendations = this.generateRecommendations(summary);
        return summary;
    }
    /**
     * Determine winner for a specific metric
     */
    determineWinner(metric, results) {
        switch (metric) {
            case 'speed':
                const speedDiff = Math.abs(results.ollama.avgResponseTime - results.claude.avgResponseTime);
                if (speedDiff < 50)
                    return 'tie'; // Within 50ms is considered a tie
                return results.ollama.avgResponseTime < results.claude.avgResponseTime ? 'ollama' : 'claude';
            case 'reliability':
                const reliabilityDiff = Math.abs(results.ollama.successRate - results.claude.successRate);
                if (reliabilityDiff < 5)
                    return 'tie'; // Within 5% is considered a tie
                return results.ollama.successRate > results.claude.successRate ? 'ollama' : 'claude';
            case 'cost':
                return results.ollama.totalCost < results.claude.totalCost ? 'ollama' : 'claude';
            default:
                return 'tie';
        }
    }
    /**
     * Generate recommendations based on results
     */
    generateRecommendations(summary) {
        const recommendations = [];
        const { ollama, claude } = summary.results;
        // Speed recommendations
        if (ollama.avgResponseTime < claude.avgResponseTime * 0.5) {
            recommendations.push('✅ Use Ollama for time-critical operations (2x+ faster)');
        }
        else if (claude.avgResponseTime < ollama.avgResponseTime * 0.5) {
            recommendations.push('⚠️ Claude is significantly faster - check Ollama configuration');
        }
        // Reliability recommendations
        if (ollama.successRate === 100) {
            recommendations.push('✅ Ollama shows excellent reliability for these test cases');
        }
        else if (ollama.successRate < 80) {
            recommendations.push('⚠️ Ollama reliability issues detected - consider fallback to Claude');
        }
        // Cost recommendations
        if (ollama.totalCost === 0) {
            recommendations.push('✅ Ollama provides zero-cost local inference');
        }
        // Token throughput
        if (ollama.avgTokensPerSecond > 50) {
            recommendations.push(`✅ Ollama achieving ${ollama.avgTokensPerSecond.toFixed(0)} tokens/second`);
        }
        else if (ollama.avgTokensPerSecond < 10) {
            recommendations.push('⚠️ Low token throughput - consider GPU acceleration');
        }
        // Model-specific recommendations
        if (this.ollamaModel.includes('codellama')) {
            recommendations.push('💡 Using specialized code model - ideal for development tasks');
        }
        // Category-specific analysis
        const codeTests = this.results.filter(r => r.provider === 'ollama' &&
            TEST_CASES.find(tc => tc.id === r.testId)?.category === 'code');
        if (codeTests.length > 0) {
            const codeSuccessRate = (codeTests.filter(r => r.success).length / codeTests.length) * 100;
            if (codeSuccessRate === 100) {
                recommendations.push('✅ Perfect performance on code generation tasks');
            }
        }
        return recommendations;
    }
    /**
     * Export results to file
     */
    async exportResults(outputPath) {
        const summary = this.generateSummary(this.results.length / 2);
        const fullReport = {
            summary,
            detailedResults: this.results,
            testCases: TEST_CASES
        };
        const fileName = outputPath || `ab-test-results-${Date.now()}.json`;
        await fs_1.default.promises.writeFile(fileName, JSON.stringify(fullReport, null, 2));
        console.log(`\n📁 Results exported to: ${fileName}`);
    }
    /**
     * Print formatted summary
     */
    printSummary(summary) {
        console.log('\n' + '='.repeat(60));
        console.log('                    A/B TEST RESULTS');
        console.log('='.repeat(60));
        console.log('\n📊 PERFORMANCE METRICS:');
        console.log('------------------------');
        const { ollama, claude } = summary.results;
        console.log(`\n🦙 Ollama (${ollama.model}):`);
        console.log(`   Success Rate: ${ollama.successRate.toFixed(1)}%`);
        console.log(`   Avg Response: ${ollama.avgResponseTime.toFixed(0)}ms`);
        console.log(`   Throughput:   ${ollama.avgTokensPerSecond.toFixed(0)} tokens/sec`);
        console.log(`   Total Cost:   $${ollama.totalCost.toFixed(4)}`);
        console.log(`   Failures:     ${ollama.failures}`);
        console.log(`\n🤖 Claude (${claude.model}):`);
        console.log(`   Success Rate: ${claude.successRate.toFixed(1)}%`);
        console.log(`   Avg Response: ${claude.avgResponseTime.toFixed(0)}ms`);
        console.log(`   Throughput:   ${claude.avgTokensPerSecond.toFixed(0)} tokens/sec`);
        console.log(`   Total Cost:   $${claude.totalCost.toFixed(4)}`);
        console.log(`   Failures:     ${claude.failures}`);
        console.log('\n🏆 WINNERS:');
        console.log('------------');
        console.log(`   Speed:        ${this.formatWinner(summary.winner.speed)}`);
        console.log(`   Reliability:  ${this.formatWinner(summary.winner.reliability)}`);
        console.log(`   Cost:         ${this.formatWinner(summary.winner.cost)}`);
        console.log(`   OVERALL:      ${this.formatWinner(summary.winner.overall).toUpperCase()}`);
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('-------------------');
        summary.recommendations.forEach(rec => {
            console.log(`   ${rec}`);
        });
        console.log('\n' + '='.repeat(60));
    }
    /**
     * Format winner display
     */
    formatWinner(winner) {
        const icons = {
            ollama: '🦙 Ollama',
            claude: '🤖 Claude',
            tie: '🤝 Tie'
        };
        return icons[winner] || winner;
    }
}
exports.ABTester = ABTester;
/**
 * Run A/B test from command line
 */
async function main() {
    const tester = new ABTester({
        endpoints: {
            primary: 'http://localhost:11434'
        },
        models: {
            default: 'llama3.2'
        }
    }, process.argv[2] || 'llama3.2' // Allow model override from CLI
    );
    try {
        const summary = await tester.runABTest();
        tester.printSummary(summary);
        await tester.exportResults();
    }
    catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}
// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}
//# sourceMappingURL=ab-test.js.map