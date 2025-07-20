import { EventEmitter } from 'events';
import * as os from 'os';

export interface BenchmarkResult {
  name: string;
  operations: number;
  duration: number;
  opsPerSecond: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  percentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
  memoryUsage: {
    before: NodeJS.MemoryUsage;
    after: NodeJS.MemoryUsage;
    delta: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
  };
  cpuUsage: {
    user: number;
    system: number;
  };
}

export interface BenchmarkOptions {
  name: string;
  iterations?: number;
  warmupIterations?: number;
  timeout?: number;
  collectMemory?: boolean;
  collectCPU?: boolean;
}

export class PerformanceBenchmark extends EventEmitter {
  private results: BenchmarkResult[] = [];

  async benchmark(
    fn: () => Promise<void> | void,
    options: BenchmarkOptions
  ): Promise<BenchmarkResult> {
    const {
      name,
      iterations = 1000,
      warmupIterations = 100,
      timeout = 60000,
      collectMemory = true,
      collectCPU = true
    } = options;

    // Warmup phase
    this.emit('warmup-start', { name, iterations: warmupIterations });
    for (let i = 0; i < warmupIterations; i++) {
      await fn();
    }
    this.emit('warmup-complete', { name });

    // Collect initial metrics
    const memoryBefore = collectMemory ? process.memoryUsage() : null;
    const cpuBefore = collectCPU ? process.cpuUsage() : null;
    const times: number[] = [];

    // Main benchmark phase
    this.emit('benchmark-start', { name, iterations });
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Benchmark "${name}" exceeded timeout of ${timeout}ms`);
      }

      const iterationStart = process.hrtime.bigint();
      await fn();
      const iterationEnd = process.hrtime.bigint();
      
      const duration = Number(iterationEnd - iterationStart) / 1e6; // Convert to ms
      times.push(duration);

      if (i % 100 === 0) {
        this.emit('progress', { name, completed: i, total: iterations });
      }
    }

    const totalDuration = Date.now() - startTime;

    // Collect final metrics
    const memoryAfter = collectMemory ? process.memoryUsage() : null;
    const cpuAfter = collectCPU ? process.cpuUsage() : null;

    // Calculate statistics
    times.sort((a, b) => a - b);
    const result: BenchmarkResult = {
      name,
      operations: iterations,
      duration: totalDuration,
      opsPerSecond: (iterations / totalDuration) * 1000,
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: times[0],
      maxTime: times[times.length - 1],
      percentiles: {
        p50: this.percentile(times, 50),
        p90: this.percentile(times, 90),
        p95: this.percentile(times, 95),
        p99: this.percentile(times, 99)
      },
      memoryUsage: this.calculateMemoryUsage(memoryBefore, memoryAfter),
      cpuUsage: this.calculateCPUUsage(cpuBefore, cpuAfter)
    };

    this.results.push(result);
    this.emit('benchmark-complete', result);

    return result;
  }

  async benchmarkConcurrent(
    fn: () => Promise<void>,
    concurrency: number,
    options: BenchmarkOptions
  ): Promise<BenchmarkResult> {
    const concurrentFn = async () => {
      const promises = Array.from({ length: concurrency }, () => fn());
      await Promise.all(promises);
    };

    return this.benchmark(concurrentFn, {
      ...options,
      name: `${options.name} (${concurrency}x concurrent)`
    });
  }

  async benchmarkWithLoad(
    fn: () => Promise<void>,
    loadProfile: LoadProfile,
    options: BenchmarkOptions
  ): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    for (const load of loadProfile.steps) {
      const stepResult = await this.benchmarkConcurrent(fn, load.concurrency, {
        ...options,
        name: `${options.name} @ ${load.concurrency} concurrent`,
        iterations: load.iterations || options.iterations
      });

      results.push(stepResult);

      if (load.delay) {
        await new Promise(resolve => setTimeout(resolve, load.delay));
      }
    }

    return results;
  }

  compare(baseline: BenchmarkResult, comparison: BenchmarkResult): ComparisonResult {
    const speedup = baseline.averageTime / comparison.averageTime;
    const throughputIncrease = comparison.opsPerSecond / baseline.opsPerSecond;

    return {
      baseline: baseline.name,
      comparison: comparison.name,
      speedup,
      throughputIncrease,
      averageTimeReduction: ((baseline.averageTime - comparison.averageTime) / baseline.averageTime) * 100,
      memoryImpact: {
        rss: comparison.memoryUsage.delta.rss - baseline.memoryUsage.delta.rss,
        heapUsed: comparison.memoryUsage.delta.heapUsed - baseline.memoryUsage.delta.heapUsed
      },
      cpuImpact: {
        user: comparison.cpuUsage.user - baseline.cpuUsage.user,
        system: comparison.cpuUsage.system - baseline.cpuUsage.system
      }
    };
  }

  generateReport(): BenchmarkReport {
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      memory: os.totalmem(),
      nodeVersion: process.version
    };

    return {
      timestamp: new Date().toISOString(),
      systemInfo,
      results: this.results,
      summary: this.generateSummary()
    };
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private calculateMemoryUsage(before: NodeJS.MemoryUsage | null, after: NodeJS.MemoryUsage | null) {
    if (!before || !after) {
      return {
        before: before!,
        after: after!,
        delta: { rss: 0, heapTotal: 0, heapUsed: 0, external: 0 }
      };
    }

    return {
      before,
      after,
      delta: {
        rss: after.rss - before.rss,
        heapTotal: after.heapTotal - before.heapTotal,
        heapUsed: after.heapUsed - before.heapUsed,
        external: after.external - before.external
      }
    };
  }

  private calculateCPUUsage(before: NodeJS.CpuUsage | null, after: NodeJS.CpuUsage | null) {
    if (!before || !after) {
      return { user: 0, system: 0 };
    }

    return {
      user: (after.user - before.user) / 1000, // Convert to ms
      system: (after.system - before.system) / 1000
    };
  }

  private generateSummary(): BenchmarkSummary {
    if (this.results.length === 0) {
      return { totalTests: 0, fastestTest: '', slowestTest: '', averageThroughput: 0 };
    }

    const fastestTest = this.results.reduce((prev, curr) => 
      curr.averageTime < prev.averageTime ? curr : prev
    );

    const slowestTest = this.results.reduce((prev, curr) => 
      curr.averageTime > prev.averageTime ? curr : prev
    );

    const averageThroughput = this.results.reduce((sum, result) => 
      sum + result.opsPerSecond, 0
    ) / this.results.length;

    return {
      totalTests: this.results.length,
      fastestTest: fastestTest.name,
      slowestTest: slowestTest.name,
      averageThroughput
    };
  }

  clearResults(): void {
    this.results = [];
  }

  getResults(): BenchmarkResult[] {
    return [...this.results];
  }
}

// Helper types
export interface LoadProfile {
  steps: LoadStep[];
}

export interface LoadStep {
  concurrency: number;
  iterations?: number;
  delay?: number;
}

export interface ComparisonResult {
  baseline: string;
  comparison: string;
  speedup: number;
  throughputIncrease: number;
  averageTimeReduction: number;
  memoryImpact: {
    rss: number;
    heapUsed: number;
  };
  cpuImpact: {
    user: number;
    system: number;
  };
}

export interface BenchmarkReport {
  timestamp: string;
  systemInfo: {
    platform: string;
    arch: string;
    cpus: number;
    memory: number;
    nodeVersion: string;
  };
  results: BenchmarkResult[];
  summary: BenchmarkSummary;
}

export interface BenchmarkSummary {
  totalTests: number;
  fastestTest: string;
  slowestTest: string;
  averageThroughput: number;
}

// Utility functions for common benchmark scenarios
export class BenchmarkScenarios {
  static async messageLatency(client: any, messageCount: number = 1000): Promise<number[]> {
    const latencies: number[] = [];

    for (let i = 0; i < messageCount; i++) {
      const start = process.hrtime.bigint();
      
      await new Promise<void>((resolve) => {
        client.once('data', () => resolve());
        client.write(JSON.stringify({
          jsonrpc: '2.0',
          id: i,
          method: 'ping',
          params: {}
        }) + '\n');
      });

      const end = process.hrtime.bigint();
      latencies.push(Number(end - start) / 1e6); // Convert to ms
    }

    return latencies;
  }

  static async throughputTest(
    client: any,
    duration: number = 10000,
    messageSize: number = 100
  ): Promise<{ messagesPerSecond: number; bytesPerSecond: number }> {
    let messageCount = 0;
    let bytesSent = 0;
    const startTime = Date.now();

    const payload = 'x'.repeat(messageSize);

    while (Date.now() - startTime < duration) {
      const message = JSON.stringify({
        jsonrpc: '2.0',
        id: messageCount,
        method: 'echo',
        params: { data: payload }
      }) + '\n';

      await new Promise<void>((resolve) => {
        client.once('data', () => resolve());
        client.write(message);
      });

      messageCount++;
      bytesSent += message.length;
    }

    const actualDuration = (Date.now() - startTime) / 1000; // Convert to seconds

    return {
      messagesPerSecond: messageCount / actualDuration,
      bytesPerSecond: bytesSent / actualDuration
    };
  }

  static generateLoadProfile(
    startConcurrency: number,
    maxConcurrency: number,
    step: number,
    iterationsPerStep: number
  ): LoadProfile {
    const steps: LoadStep[] = [];

    for (let concurrency = startConcurrency; concurrency <= maxConcurrency; concurrency += step) {
      steps.push({
        concurrency,
        iterations: iterationsPerStep,
        delay: 1000 // 1 second between steps
      });
    }

    return { steps };
  }
}