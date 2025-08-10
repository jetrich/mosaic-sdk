/**
 * @fileoverview A/B Testing framework for Ollama vs Claude API
 * @module @mosaicstack/mcp-ollama/tests
 */
import { OllamaConfig } from '../src/types/index.js';
/**
 * Test case definition
 */
interface TestCase {
    id: string;
    name: string;
    category: 'code' | 'text' | 'analysis' | 'creative';
    prompt: string;
    expectedFormat?: 'json' | 'code' | 'text';
    maxTokens?: number;
    temperature?: number;
}
/**
 * Test result for a single run
 */
interface TestResult {
    testId: string;
    provider: 'ollama' | 'claude';
    model: string;
    success: boolean;
    responseTime: number;
    tokensGenerated?: number;
    tokenPerSecond?: number;
    response?: string;
    error?: string;
    quality?: {
        lengthScore: number;
        formatCorrect: boolean;
        contentRelevance?: number;
    };
    cost?: number;
}
/**
 * A/B Test results summary
 */
interface ABTestSummary {
    timestamp: string;
    testCases: number;
    results: {
        ollama: {
            model: string;
            successRate: number;
            avgResponseTime: number;
            avgTokensPerSecond: number;
            totalCost: number;
            failures: number;
        };
        claude: {
            model: string;
            successRate: number;
            avgResponseTime: number;
            avgTokensPerSecond: number;
            totalCost: number;
            failures: number;
        };
    };
    winner: {
        speed: 'ollama' | 'claude' | 'tie';
        reliability: 'ollama' | 'claude' | 'tie';
        cost: 'ollama' | 'claude' | 'tie';
        overall: 'ollama' | 'claude' | 'tie';
    };
    recommendations: string[];
}
/**
 * Test cases for A/B testing
 */
declare const TEST_CASES: TestCase[];
/**
 * A/B Testing class
 */
export declare class ABTester {
    private ollamaTool;
    private results;
    private ollamaModel;
    private claudeModel;
    constructor(ollamaConfig?: Partial<OllamaConfig>, ollamaModel?: string);
    /**
     * Run a single test case with Ollama
     */
    private runOllamaTest;
    /**
     * Run a single test case with Claude (simulated)
     */
    private runClaudeTest;
    /**
     * Assess response quality
     */
    private assessQuality;
    /**
     * Run A/B test for all test cases
     */
    runABTest(testCases?: TestCase[]): Promise<ABTestSummary>;
    /**
     * Generate test summary
     */
    private generateSummary;
    /**
     * Determine winner for a specific metric
     */
    private determineWinner;
    /**
     * Generate recommendations based on results
     */
    private generateRecommendations;
    /**
     * Export results to file
     */
    exportResults(outputPath?: string): Promise<void>;
    /**
     * Print formatted summary
     */
    printSummary(summary: ABTestSummary): void;
    /**
     * Format winner display
     */
    private formatWinner;
}
export { TEST_CASES, TestCase, TestResult, ABTestSummary };
//# sourceMappingURL=ab-test.d.ts.map