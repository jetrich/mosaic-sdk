/**
 * BookStack Integration Main Entry Point
 * T.0001.01.02.01 - BookStack Integration Strategy Implementation
 *
 * Exports all components for the BookStack sync system:
 * - BookStackClient: API client with rate limiting and error handling
 * - SyncEngine: Project = Shelf mapping and sync orchestration
 * - MonitoringSystem: Real-time monitoring and alerting
 * - CICDIntegration: Automated CI/CD pipeline integration
 */

import { BookStackClient } from "./BookStackClient";
import type {
  BookStackConfig,
  BookStackEntity,
  BookStackTag,
  BookStackShelf,
  BookStackBook,
  BookStackChapter,
  BookStackPage,
  SyncMetadata,
  ConflictInfo,
} from "./BookStackClient";

import { SyncEngine } from "./SyncEngine";
import type {
  SyncConfig,
  SyncStats,
  ProjectStructure,
  BookStructure,
  ChapterStructure,
  PageStructure,
} from "./SyncEngine";

import { MonitoringSystem } from "./MonitoringSystem";
import type {
  MonitoringConfig,
  SyncMetrics,
  HealthStatus,
  Alert,
} from "./MonitoringSystem";

import { CICDIntegration } from "./CICDIntegration";
import type {
  CICDConfig,
  PipelineContext,
  DeploymentResult,
} from "./CICDIntegration";

// Re-export everything
export { BookStackClient };
export type {
  BookStackConfig,
  BookStackEntity,
  BookStackTag,
  BookStackShelf,
  BookStackBook,
  BookStackChapter,
  BookStackPage,
  SyncMetadata,
  ConflictInfo,
};

export { SyncEngine };
export type {
  SyncConfig,
  SyncStats,
  ProjectStructure,
  BookStructure,
  ChapterStructure,
  PageStructure,
};

export { MonitoringSystem };
export type { MonitoringConfig, SyncMetrics, HealthStatus, Alert };

export { CICDIntegration };
export type { CICDConfig, PipelineContext, DeploymentResult };

// Main orchestrator class
export class BookStackIntegration {
  private client: BookStackClient;
  private syncEngine: SyncEngine;
  private monitoring?: MonitoringSystem;
  private cicd?: CICDIntegration;

  constructor(
    syncConfig: SyncConfig,
    monitoringConfig?: MonitoringConfig,
    cicdConfig?: CICDConfig,
  ) {
    // Initialize core components
    this.client = new BookStackClient(syncConfig.bookstack);
    this.syncEngine = new SyncEngine(syncConfig);

    // Initialize optional components
    if (monitoringConfig) {
      this.monitoring = new MonitoringSystem(
        monitoringConfig,
        this.syncEngine,
        this.client,
      );
    }

    if (cicdConfig) {
      this.cicd = new CICDIntegration(cicdConfig, syncConfig, this.monitoring);
    }
  }

  /**
   * Initialize the integration system
   */
  async initialize(): Promise<void> {
    // Load persisted monitoring data
    if (this.monitoring) {
      await this.monitoring.loadPersistedData();
    }

    // Validate configurations
    const healthCheck = await this.client.healthCheck();
    if (!healthCheck) {
      throw new Error(
        "BookStack API health check failed during initialization",
      );
    }

    if (this.cicd) {
      const validation = await this.cicd.validateConfiguration();
      if (!validation.valid) {
        throw new Error(
          `CI/CD configuration invalid: ${validation.errors.join(", ")}`,
        );
      }
    }
  }

  /**
   * Perform a manual sync
   */
  async sync(): Promise<SyncStats> {
    return await this.syncEngine.sync();
  }

  /**
   * Execute CI/CD pipeline
   */
  async executePipeline(context: PipelineContext): Promise<DeploymentResult> {
    if (!this.cicd) {
      throw new Error("CI/CD integration not configured");
    }
    return await this.cicd.executePipeline(context);
  }

  /**
   * Get system health status
   */
  getHealthStatus(): HealthStatus | null {
    return this.monitoring?.getHealthStatus() || null;
  }

  /**
   * Get dashboard data for monitoring
   */
  getDashboardData() {
    return this.monitoring?.getDashboardData() || null;
  }

  /**
   * Shutdown the integration system
   */
  shutdown(): void {
    if (this.monitoring) {
      this.monitoring.stop();
    }
  }

  // Getters for individual components
  get bookstackClient(): BookStackClient {
    return this.client;
  }

  get syncEngineInstance(): SyncEngine {
    return this.syncEngine;
  }

  get monitoringSystem(): MonitoringSystem | undefined {
    return this.monitoring;
  }

  get cicdIntegration(): CICDIntegration | undefined {
    return this.cicd;
  }
}

// Convenience factory function
export function createBookStackIntegration(
  syncConfig: SyncConfig,
  options?: {
    monitoring?: MonitoringConfig;
    cicd?: CICDConfig;
  },
): BookStackIntegration {
  return new BookStackIntegration(
    syncConfig,
    options?.monitoring,
    options?.cicd,
  );
}

// Default configurations
export const defaultConfigs = {
  monitoring: {
    metricsPath: "./data/bookstack-metrics",
    healthCheckInterval: 60000, // 1 minute
    retentionDays: 30,
    thresholds: {
      errorRate: 10, // 10%
      syncDuration: 300000, // 5 minutes
      conflictRate: 5, // 5%
    },
  } as MonitoringConfig,

  cicd: {
    enabled: true,
    triggers: {
      onPush: true,
      onPullRequest: false,
      onRelease: true,
      branches: ["main", "master", "develop"],
    },
    deployment: {
      environment: "development" as const,
      requireApproval: false,
      rollbackOnFailure: true,
    },
    notifications: {},
  } as CICDConfig,
};
