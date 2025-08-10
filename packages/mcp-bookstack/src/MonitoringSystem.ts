/**
 * BookStack Sync Monitoring and Alerting System
 * T.0001.01.02.01 - BookStack Integration Strategy Implementation
 *
 * Features:
 * - Real-time sync monitoring
 * - Performance metrics collection
 * - Alert system for failures
 * - Dashboard data aggregation
 * - Health check automation
 */

import { EventEmitter } from "events";
import { promises as fs } from "fs";
import path from "path";
import { SyncEngine, SyncStats } from "./SyncEngine";
import { BookStackClient } from "./BookStackClient";

export interface MonitoringConfig {
  metricsPath: string;
  alertWebhooks?: string[];
  healthCheckInterval: number; // milliseconds
  retentionDays: number;
  thresholds: {
    errorRate: number; // percentage
    syncDuration: number; // milliseconds
    conflictRate: number; // percentage
  };
}

export interface SyncMetrics {
  timestamp: string;
  duration: number;
  stats: SyncStats;
  success: boolean;
  errorMessage?: string;
  performance: {
    apiCalls: number;
    rateLimitHits: number;
    retries: number;
    avgResponseTime: number;
  };
}

export interface HealthStatus {
  timestamp: string;
  bookstackApi: boolean;
  gitRepository: boolean;
  fileSystem: boolean;
  lastSync: string | null;
  uptime: number;
  version: string;
}

export interface Alert {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error" | "critical";
  title: string;
  message: string;
  metrics?: Partial<SyncMetrics>;
  resolved?: boolean;
  resolvedAt?: string;
}

export class MonitoringSystem extends EventEmitter {
  private metrics: SyncMetrics[] = [];
  private alerts: Alert[] = [];
  private healthStatus: HealthStatus;
  private healthCheckTimer?: NodeJS.Timeout;
  private startTime = Date.now();

  constructor(
    private config: MonitoringConfig,
    private syncEngine: SyncEngine,
    private bookstackClient: BookStackClient,
  ) {
    super();

    this.healthStatus = {
      timestamp: new Date().toISOString(),
      bookstackApi: false,
      gitRepository: false,
      fileSystem: false,
      lastSync: null,
      uptime: 0,
      version: "1.0.0",
    };

    this.setupEventListeners();
    this.startHealthChecks();
  }

  private setupEventListeners(): void {
    // Listen to sync engine events
    this.syncEngine.on("syncStart", () => {
      this.emit("syncStarted");
    });

    this.syncEngine.on("syncComplete", (data: { stats: SyncStats }) => {
      this.recordSyncMetrics(data.stats, true);
      this.emit("syncCompleted", data.stats);
    });

    this.syncEngine.on(
      "syncError",
      (data: { error: Error; stats: SyncStats }) => {
        this.recordSyncMetrics(data.stats, false, data.error.message);
        this.createAlert("error", "Sync Failed", data.error.message, {
          stats: data.stats,
        } as any);
        this.emit("syncFailed", data);
      },
    );

    this.syncEngine.on("conflict", (conflict: any) => {
      this.createAlert(
        "warning",
        "Sync Conflict Detected",
        `Conflict in ${conflict.entity_type} ${conflict.entity_id}`,
        { stats: this.syncEngine.getStats() } as any,
      );
    });

    this.syncEngine.on("rateLimit", (info: any) => {
      this.createAlert(
        "warning",
        "Rate Limit Hit",
        `Rate limit exceeded, waiting ${info.waitTime}ms`,
      );
    });

    // Listen to BookStack client events
    this.bookstackClient.on("error", (error: any) => {
      this.createAlert(
        "error",
        "BookStack API Error",
        error.message || "Unknown API error",
      );
    });

    this.bookstackClient.on("retry", (info: any) => {
      this.createAlert(
        "info",
        "API Retry",
        `Retrying API call (attempt ${info.attempt}/${info.maxRetries})`,
      );
    });
  }

  private startHealthChecks(): void {
    this.performHealthCheck();
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  private async performHealthCheck(): Promise<void> {
    const timestamp = new Date().toISOString();

    try {
      // Check BookStack API
      const bookstackHealthy = await this.bookstackClient.healthCheck();

      // Check Git repository
      const gitHealthy = await this.checkGitRepository();

      // Check file system
      const fsHealthy = await this.checkFileSystem();

      // Update health status
      this.healthStatus = {
        timestamp,
        bookstackApi: bookstackHealthy,
        gitRepository: gitHealthy,
        fileSystem: fsHealthy,
        lastSync: this.getLastSyncTime(),
        uptime: Date.now() - this.startTime,
        version: "1.0.0",
      };

      // Check for health issues
      if (!bookstackHealthy) {
        this.createAlert(
          "critical",
          "BookStack API Down",
          "Cannot connect to BookStack API",
        );
      }

      if (!gitHealthy) {
        this.createAlert(
          "error",
          "Git Repository Issue",
          "Git repository is not accessible",
        );
      }

      if (!fsHealthy) {
        this.createAlert(
          "error",
          "File System Issue",
          "Cannot access documentation files",
        );
      }

      this.emit("healthCheck", this.healthStatus);
    } catch (error: any) {
      this.createAlert("critical", "Health Check Failed", error.message);
    }
  }

  private async checkGitRepository(): Promise<boolean> {
    try {
      const { execSync } = await import("child_process");
      execSync("git status", { cwd: process.cwd(), stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }

  private async checkFileSystem(): Promise<boolean> {
    try {
      await fs.access(
        this.config.metricsPath,
        fs.constants.R_OK | fs.constants.W_OK,
      );
      return true;
    } catch {
      return false;
    }
  }

  private getLastSyncTime(): string | null {
    if (this.metrics.length === 0) return null;
    return this.metrics[this.metrics.length - 1].timestamp;
  }

  private recordSyncMetrics(
    stats: SyncStats,
    success: boolean,
    errorMessage?: string,
  ): void {
    const clientStats = this.bookstackClient.getStats();

    const metrics: SyncMetrics = {
      timestamp: new Date().toISOString(),
      duration: stats.duration,
      stats,
      success,
      errorMessage,
      performance: {
        apiCalls: clientStats.requestCount,
        rateLimitHits: 0, // Would need to track this in client
        retries: 0, // Would need to track this in client
        avgResponseTime: 0, // Would need to track this in client
      },
    };

    this.metrics.push(metrics);
    this.analyzeMetrics(metrics);
    this.persistMetrics();
  }

  private analyzeMetrics(metrics: SyncMetrics): void {
    // Check error rate
    const recentMetrics = this.metrics.slice(-10); // Last 10 syncs
    const errorRate =
      (recentMetrics.filter((m) => !m.success).length / recentMetrics.length) *
      100;

    if (errorRate > this.config.thresholds.errorRate) {
      this.createAlert(
        "warning",
        "High Error Rate",
        `Error rate is ${errorRate.toFixed(1)}% (threshold: ${this.config.thresholds.errorRate}%)`,
      );
    }

    // Check sync duration
    if (metrics.duration > this.config.thresholds.syncDuration) {
      this.createAlert(
        "warning",
        "Slow Sync Performance",
        `Sync took ${metrics.duration}ms (threshold: ${this.config.thresholds.syncDuration}ms)`,
      );
    }

    // Check conflict rate
    const conflictRate =
      (metrics.stats.conflicts / this.getTotalOperations(metrics.stats)) * 100;
    if (conflictRate > this.config.thresholds.conflictRate) {
      this.createAlert(
        "warning",
        "High Conflict Rate",
        `Conflict rate is ${conflictRate.toFixed(1)}% (threshold: ${this.config.thresholds.conflictRate}%)`,
      );
    }
  }

  private getTotalOperations(stats: SyncStats): number {
    return (
      stats.shelves.created +
      stats.shelves.updated +
      stats.books.created +
      stats.books.updated +
      stats.chapters.created +
      stats.chapters.updated +
      stats.pages.created +
      stats.pages.updated
    );
  }

  private createAlert(
    level: Alert["level"],
    title: string,
    message: string,
    metrics?: Partial<SyncMetrics>,
  ): void {
    const alert: Alert = {
      id: this.generateAlertId(),
      timestamp: new Date().toISOString(),
      level,
      title,
      message,
      metrics,
      resolved: false,
    };

    this.alerts.push(alert);
    this.emit("alert", alert);
    this.sendWebhookAlert(alert);
    this.persistAlerts();
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private async sendWebhookAlert(alert: Alert): Promise<void> {
    if (!this.config.alertWebhooks || this.config.alertWebhooks.length === 0) {
      return;
    }

    const payload = {
      alert,
      system: "BookStack Sync Monitor",
      timestamp: alert.timestamp,
    };

    for (const webhook of this.config.alertWebhooks) {
      try {
        const response = await fetch(webhook, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          console.error(
            `Failed to send webhook alert to ${webhook}: ${response.statusText}`,
          );
        }
      } catch (error) {
        console.error(`Error sending webhook alert to ${webhook}:`, error);
      }
    }
  }

  private async persistMetrics(): Promise<void> {
    try {
      const metricsFile = path.join(
        this.config.metricsPath,
        "sync-metrics.json",
      );
      await fs.mkdir(path.dirname(metricsFile), { recursive: true });
      await fs.writeFile(metricsFile, JSON.stringify(this.metrics, null, 2));
    } catch (error) {
      console.error("Failed to persist metrics:", error);
    }
  }

  private async persistAlerts(): Promise<void> {
    try {
      const alertsFile = path.join(this.config.metricsPath, "alerts.json");
      await fs.mkdir(path.dirname(alertsFile), { recursive: true });
      await fs.writeFile(alertsFile, JSON.stringify(this.alerts, null, 2));
    } catch (error) {
      console.error("Failed to persist alerts:", error);
    }
  }

  // Public methods
  async loadPersistedData(): Promise<void> {
    try {
      // Load metrics
      const metricsFile = path.join(
        this.config.metricsPath,
        "sync-metrics.json",
      );
      try {
        const metricsData = await fs.readFile(metricsFile, "utf-8");
        this.metrics = JSON.parse(metricsData);
      } catch {
        // File doesn't exist or is invalid, start fresh
        this.metrics = [];
      }

      // Load alerts
      const alertsFile = path.join(this.config.metricsPath, "alerts.json");
      try {
        const alertsData = await fs.readFile(alertsFile, "utf-8");
        this.alerts = JSON.parse(alertsData);
      } catch {
        // File doesn't exist or is invalid, start fresh
        this.alerts = [];
      }

      // Clean up old data
      await this.cleanupOldData();
    } catch (error) {
      console.error("Failed to load persisted data:", error);
    }
  }

  private async cleanupOldData(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
    const cutoffTime = cutoffDate.toISOString();

    // Clean up old metrics
    this.metrics = this.metrics.filter((m) => m.timestamp > cutoffTime);

    // Clean up old resolved alerts
    this.alerts = this.alerts.filter(
      (a) => a.timestamp > cutoffTime || !a.resolved,
    );

    await this.persistMetrics();
    await this.persistAlerts();
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      this.persistAlerts();
      this.emit("alertResolved", alert);
      return true;
    }
    return false;
  }

  getMetrics(limit?: number): SyncMetrics[] {
    return limit ? this.metrics.slice(-limit) : [...this.metrics];
  }

  getAlerts(unresolvedOnly = false): Alert[] {
    return unresolvedOnly
      ? this.alerts.filter((a) => !a.resolved)
      : [...this.alerts];
  }

  getHealthStatus(): HealthStatus {
    return { ...this.healthStatus };
  }

  getDashboardData(): {
    health: HealthStatus;
    recentMetrics: SyncMetrics[];
    activeAlerts: Alert[];
    summary: {
      totalSyncs: number;
      successRate: number;
      avgDuration: number;
      totalConflicts: number;
    };
  } {
    const recentMetrics = this.metrics.slice(-20);
    const activeAlerts = this.alerts.filter((a) => !a.resolved);

    const totalSyncs = this.metrics.length;
    const successfulSyncs = this.metrics.filter((m) => m.success).length;
    const successRate =
      totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0;
    const avgDuration =
      totalSyncs > 0
        ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalSyncs
        : 0;
    const totalConflicts = this.metrics.reduce(
      (sum, m) => sum + m.stats.conflicts,
      0,
    );

    return {
      health: this.getHealthStatus(),
      recentMetrics,
      activeAlerts,
      summary: {
        totalSyncs,
        successRate,
        avgDuration,
        totalConflicts,
      },
    };
  }

  stop(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
  }
}
