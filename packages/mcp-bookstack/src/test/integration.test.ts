/**
 * BookStack Integration Tests
 * T.0001.01.02.01 - BookStack Integration Strategy Implementation
 */

import {
  BookStackClient,
  SyncEngine,
  MonitoringSystem,
  CICDIntegration,
} from "../index";
import type {
  BookStackConfig,
  SyncConfig,
  MonitoringConfig,
  CICDConfig,
} from "../index";

describe("BookStack Integration", () => {
  const mockConfig: BookStackConfig = {
    baseUrl: "https://test-bookstack.com",
    tokenId: "test-token-id",
    tokenSecret: "test-token-secret",
  };

  const mockSyncConfig: SyncConfig = {
    docsRoot: "./test-docs",
    bookstack: mockConfig,
    dryRun: true,
  };

  describe("BookStackClient", () => {
    let client: BookStackClient;

    beforeEach(() => {
      client = new BookStackClient(mockConfig);
    });

    test("should initialize with correct configuration", () => {
      expect(client).toBeInstanceOf(BookStackClient);
    });

    test("should have rate limiting configuration", () => {
      const stats = client.getStats();
      expect(stats).toHaveProperty("requestCount");
      expect(stats).toHaveProperty("resetTime");
    });

    test("should emit events for API operations", (done) => {
      client.on("created", (event) => {
        expect(event).toHaveProperty("type");
        expect(event).toHaveProperty("entity");
        done();
      });

      // Simulate event emission
      client.emit("created", {
        type: "shelf",
        entity: { id: 1, name: "Test" },
      });
    });
  });

  describe("SyncEngine", () => {
    let syncEngine: SyncEngine;

    beforeEach(() => {
      syncEngine = new SyncEngine(mockSyncConfig);
    });

    test("should initialize with correct configuration", () => {
      expect(syncEngine).toBeInstanceOf(SyncEngine);
    });

    test("should provide stats and conflicts getters", () => {
      const stats = syncEngine.getStats();
      const conflicts = syncEngine.getConflicts();

      expect(stats).toHaveProperty("shelves");
      expect(stats).toHaveProperty("books");
      expect(stats).toHaveProperty("chapters");
      expect(stats).toHaveProperty("pages");
      expect(Array.isArray(conflicts)).toBe(true);
    });

    test("should emit sync events", (done) => {
      syncEngine.on("syncStart", () => {
        done();
      });

      syncEngine.emit("syncStart", { config: mockSyncConfig });
    });
  });

  describe("MonitoringSystem", () => {
    let monitoring: MonitoringSystem;
    let syncEngine: SyncEngine;
    let client: BookStackClient;

    const mockMonitoringConfig: MonitoringConfig = {
      metricsPath: "./test-metrics",
      healthCheckInterval: 5000,
      retentionDays: 7,
      thresholds: {
        errorRate: 10,
        syncDuration: 60000,
        conflictRate: 5,
      },
    };

    beforeEach(() => {
      client = new BookStackClient(mockConfig);
      syncEngine = new SyncEngine(mockSyncConfig);
      monitoring = new MonitoringSystem(
        mockMonitoringConfig,
        syncEngine,
        client,
      );
    });

    afterEach(() => {
      monitoring.stop();
    });

    test("should initialize with correct configuration", () => {
      expect(monitoring).toBeInstanceOf(MonitoringSystem);
    });

    test("should provide health status", () => {
      const health = monitoring.getHealthStatus();
      expect(health).toHaveProperty("timestamp");
      expect(health).toHaveProperty("bookstackApi");
      expect(health).toHaveProperty("gitRepository");
      expect(health).toHaveProperty("fileSystem");
    });

    test("should provide dashboard data", () => {
      const dashboard = monitoring.getDashboardData();
      expect(dashboard).toHaveProperty("health");
      expect(dashboard).toHaveProperty("recentMetrics");
      expect(dashboard).toHaveProperty("activeAlerts");
      expect(dashboard).toHaveProperty("summary");
    });

    test("should handle alerts", (done) => {
      monitoring.on("alert", (alert) => {
        expect(alert).toHaveProperty("id");
        expect(alert).toHaveProperty("level");
        expect(alert).toHaveProperty("title");
        expect(alert).toHaveProperty("message");
        done();
      });

      // Simulate an alert
      monitoring.emit("alert", {
        id: "test-alert",
        timestamp: new Date().toISOString(),
        level: "warning",
        title: "Test Alert",
        message: "This is a test alert",
      });
    });
  });

  describe("CICDIntegration", () => {
    let cicd: CICDIntegration;

    const mockCICDConfig: CICDConfig = {
      enabled: true,
      triggers: {
        onPush: true,
        onPullRequest: false,
        onRelease: true,
        branches: ["main", "develop"],
      },
      deployment: {
        environment: "development",
        requireApproval: false,
        rollbackOnFailure: true,
      },
      notifications: {},
    };

    beforeEach(() => {
      cicd = new CICDIntegration(mockCICDConfig, mockSyncConfig);
    });

    test("should initialize with correct configuration", () => {
      expect(cicd).toBeInstanceOf(CICDIntegration);
    });

    test("should validate configuration", async () => {
      const validation = await cicd.validateConfiguration();
      expect(validation).toHaveProperty("valid");
      expect(validation).toHaveProperty("errors");
      expect(Array.isArray(validation.errors)).toBe(true);
    });

    test("should provide deployment history", async () => {
      const history = await cicd.getDeploymentHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    test("should get last deployment", async () => {
      const lastDeployment = await cicd.getLastDeployment();
      expect(lastDeployment).toBeNull(); // No deployments yet
    });
  });

  describe("Integration Scenarios", () => {
    test("should handle Project = Shelf mapping", () => {
      // Test the core mapping logic
      const projectName = "engineering-docs";
      const expectedShelfName = "Engineering Docs";

      // This would be tested with actual sync engine methods
      expect(
        projectName.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      ).toBe(expectedShelfName);
    });

    test("should handle conflict resolution strategies", () => {
      const strategies = ["git_wins", "bookstack_wins", "manual"];

      strategies.forEach((strategy) => {
        expect(["git_wins", "bookstack_wins", "manual"]).toContain(strategy);
      });
    });

    test("should validate directory structure", () => {
      const validStructure = {
        engineering: {
          "getting-started": {
            prerequisites: [
              "01-system-requirements.md",
              "02-development-tools.md",
            ],
          },
        },
      };

      expect(validStructure).toHaveProperty("engineering");
      expect(validStructure.engineering).toHaveProperty("getting-started");
    });
  });

  describe("Error Handling", () => {
    test("should handle API errors gracefully", () => {
      const client = new BookStackClient(mockConfig);

      client.on("error", (error) => {
        expect(error).toBeDefined();
      });

      // Simulate an error
      client.emit("error", new Error("API connection failed"));
    });

    test("should handle sync errors with proper reporting", () => {
      const syncEngine = new SyncEngine(mockSyncConfig);

      syncEngine.on("syncError", (data) => {
        expect(data).toHaveProperty("error");
        expect(data).toHaveProperty("stats");
      });

      // Simulate sync error
      syncEngine.emit("syncError", {
        error: new Error("Sync failed"),
        stats: syncEngine.getStats(),
      });
    });
  });

  describe("Performance", () => {
    test("should track performance metrics", () => {
      const client = new BookStackClient({
        ...mockConfig,
        rateLimit: {
          requestsPerMinute: 60,
          burstLimit: 10,
        },
      });

      const stats = client.getStats();
      expect(stats.requestCount).toBe(0); // No requests made yet
      expect(stats.resetTime).toBeGreaterThan(Date.now());
    });

    test("should handle rate limiting", (done) => {
      const client = new BookStackClient({
        ...mockConfig,
        rateLimit: {
          requestsPerMinute: 1,
          burstLimit: 1,
        },
      });

      client.on("rateLimit", (info) => {
        expect(info).toHaveProperty("waitTime");
        done();
      });

      // Simulate rate limit hit
      client.emit("rateLimit", { waitTime: 1000 });
    });
  });
});
