#!/usr/bin/env node
/**
 * BookStack Integration CLI
 * T.0001.01.02.01 - BookStack Integration Strategy Implementation
 *
 * Command-line interface for BookStack sync operations
 */

import { Command } from "commander";
import { promises as fs } from "fs";
import { createBookStackIntegration, defaultConfigs } from "./index";
import type {
  SyncConfig,
  MonitoringConfig,
  CICDConfig,
  PipelineContext,
} from "./index";

const program = new Command();

program
  .name("bookstack-sync")
  .description("BookStack documentation synchronization tool")
  .version("1.0.0");

// Sync command
program
  .command("sync")
  .description("Synchronize documentation to BookStack")
  .option(
    "-c, --config <path>",
    "Configuration file path",
    "./bookstack-sync.json",
  )
  .option("-d, --dry-run", "Perform dry run without making changes")
  .option("--docs-root <path>", "Documentation root directory")
  .option("--bookstack-url <url>", "BookStack base URL")
  .option("--token-id <id>", "BookStack API token ID")
  .option("--token-secret <secret>", "BookStack API token secret")
  .option("-v, --verbose", "Enable verbose logging")
  .action(async (options) => {
    try {
      const config = await loadConfig(options.config, options);
      const integration = createBookStackIntegration(config.sync, {
        monitoring: config.monitoring,
      });

      await integration.initialize();

      console.log("Starting BookStack synchronization...");
      const stats = await integration.sync();

      console.log("\n=== Sync Results ===");
      console.log(
        `Shelves: ${stats.shelves.created} created, ${stats.shelves.updated} updated, ${stats.shelves.skipped} skipped`,
      );
      console.log(
        `Books: ${stats.books.created} created, ${stats.books.updated} updated, ${stats.books.skipped} skipped`,
      );
      console.log(
        `Chapters: ${stats.chapters.created} created, ${stats.chapters.updated} updated, ${stats.chapters.skipped} skipped`,
      );
      console.log(
        `Pages: ${stats.pages.created} created, ${stats.pages.updated} updated, ${stats.pages.skipped} skipped`,
      );
      console.log(`Conflicts: ${stats.conflicts}`);
      console.log(`Errors: ${stats.errors}`);
      console.log(`Duration: ${stats.duration}ms`);

      integration.shutdown();

      if (stats.errors > 0) {
        process.exit(1);
      }
    } catch (error: any) {
      console.error("Sync failed:", error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Health check command
program
  .command("health")
  .description("Check system health status")
  .option(
    "-c, --config <path>",
    "Configuration file path",
    "./bookstack-sync.json",
  )
  .action(async (options) => {
    try {
      const config = await loadConfig(options.config);
      const integration = createBookStackIntegration(config.sync, {
        monitoring: config.monitoring,
      });

      await integration.initialize();

      const health = integration.getHealthStatus();
      if (health) {
        console.log("=== Health Status ===");
        console.log(
          `BookStack API: ${health.bookstackApi ? "✅ Healthy" : "❌ Unhealthy"}`,
        );
        console.log(
          `Git Repository: ${health.gitRepository ? "✅ Healthy" : "❌ Unhealthy"}`,
        );
        console.log(
          `File System: ${health.fileSystem ? "✅ Healthy" : "❌ Unhealthy"}`,
        );
        console.log(`Last Sync: ${health.lastSync || "Never"}`);
        console.log(`Uptime: ${Math.floor(health.uptime / 1000)}s`);
        console.log(`Version: ${health.version}`);

        const allHealthy =
          health.bookstackApi && health.gitRepository && health.fileSystem;
        integration.shutdown();

        if (!allHealthy) {
          process.exit(1);
        }
      } else {
        console.log("Monitoring not configured");
      }
    } catch (error: any) {
      console.error("Health check failed:", error.message);
      process.exit(1);
    }
  });

// Dashboard command
program
  .command("dashboard")
  .description("Show monitoring dashboard data")
  .option(
    "-c, --config <path>",
    "Configuration file path",
    "./bookstack-sync.json",
  )
  .option("--json", "Output as JSON")
  .action(async (options) => {
    try {
      const config = await loadConfig(options.config);
      const integration = createBookStackIntegration(config.sync, {
        monitoring: config.monitoring,
      });

      await integration.initialize();

      const dashboard = integration.getDashboardData();
      if (dashboard) {
        if (options.json) {
          console.log(JSON.stringify(dashboard, null, 2));
        } else {
          console.log("=== Dashboard ===");
          console.log(`Total Syncs: ${dashboard.summary.totalSyncs}`);
          console.log(
            `Success Rate: ${dashboard.summary.successRate.toFixed(1)}%`,
          );
          console.log(
            `Average Duration: ${dashboard.summary.avgDuration.toFixed(0)}ms`,
          );
          console.log(`Total Conflicts: ${dashboard.summary.totalConflicts}`);
          console.log(`Active Alerts: ${dashboard.activeAlerts.length}`);

          if (dashboard.activeAlerts.length > 0) {
            console.log("\n=== Active Alerts ===");
            dashboard.activeAlerts.forEach((alert) => {
              console.log(
                `[${alert.level.toUpperCase()}] ${alert.title}: ${alert.message}`,
              );
            });
          }
        }
      } else {
        console.log("Monitoring not configured");
      }

      integration.shutdown();
    } catch (error: any) {
      console.error("Dashboard failed:", error.message);
      process.exit(1);
    }
  });

// CI/CD command
program
  .command("cicd")
  .description("Execute CI/CD pipeline")
  .option(
    "-c, --config <path>",
    "Configuration file path",
    "./bookstack-sync.json",
  )
  .option(
    "--trigger <type>",
    "Trigger type (push|pull_request|release|manual)",
    "manual",
  )
  .option("--branch <name>", "Branch name", "main")
  .option("--commit <hash>", "Commit hash")
  .option("--author <name>", "Commit author")
  .option("--message <text>", "Commit message")
  .option("--environment <env>", "Deployment environment", "development")
  .option("--build-number <number>", "Build number")
  .option("--pr-id <id>", "Pull request ID")
  .action(async (options) => {
    try {
      const config = await loadConfig(options.config);

      if (!config.cicd) {
        throw new Error("CI/CD configuration not found");
      }

      const integration = createBookStackIntegration(config.sync, {
        monitoring: config.monitoring,
        cicd: config.cicd,
      });

      await integration.initialize();

      const context: PipelineContext = {
        trigger: options.trigger as any,
        branch: options.branch,
        commit: options.commit || "unknown",
        author: options.author || "unknown",
        message: options.message || "Manual execution",
        environment: options.environment,
        buildNumber: options.buildNumber,
        pullRequestId: options.prId,
      };

      console.log("Executing CI/CD pipeline...");
      console.log(`Trigger: ${context.trigger}`);
      console.log(`Branch: ${context.branch}`);
      console.log(`Environment: ${context.environment}`);

      const result = await integration.executePipeline(context);

      console.log("\n=== Pipeline Results ===");
      console.log(`Success: ${result.success ? "✅" : "❌"}`);
      console.log(`Duration: ${result.duration}ms`);
      console.log(`Deployment ID: ${result.deploymentId}`);

      if (result.errors && result.errors.length > 0) {
        console.log("Errors:");
        result.errors.forEach((error) => console.log(`  - ${error}`));
      }

      if (result.rollbackPerformed) {
        console.log("⚠️  Rollback was performed due to failure");
      }

      integration.shutdown();

      if (!result.success) {
        process.exit(1);
      }
    } catch (error: any) {
      console.error("CI/CD pipeline failed:", error.message);
      process.exit(1);
    }
  });

// Init command
program
  .command("init")
  .description("Initialize BookStack sync configuration")
  .option("--docs-root <path>", "Documentation root directory", "./docs")
  .option("--bookstack-url <url>", "BookStack base URL")
  .option("--token-id <id>", "BookStack API token ID")
  .option("--token-secret <secret>", "BookStack API token secret")
  .option("--output <path>", "Configuration file path", "./bookstack-sync.json")
  .action(async (options) => {
    try {
      const config = {
        sync: {
          docsRoot: options.docsRoot,
          bookstack: {
            baseUrl: options.bookstackUrl || "https://bookstack.example.com",
            tokenId: options.tokenId || "your-token-id",
            tokenSecret: options.tokenSecret || "your-token-secret",
            rateLimit: {
              requestsPerMinute: 60,
              burstLimit: 10,
            },
            retryConfig: {
              maxRetries: 3,
              backoffMs: 1000,
            },
          },
          dryRun: false,
          conflictResolution: "manual" as const,
          excludePatterns: [
            "node_modules",
            ".git",
            ".bookstack",
            "dist",
            "build",
          ],
        } as SyncConfig,
        monitoring: defaultConfigs.monitoring,
        cicd: defaultConfigs.cicd,
      };

      await fs.writeFile(options.output, JSON.stringify(config, null, 2));
      console.log(`Configuration file created: ${options.output}`);
      console.log(
        "\nPlease update the BookStack URL and API credentials before running sync.",
      );
    } catch (error: any) {
      console.error("Failed to create configuration:", error.message);
      process.exit(1);
    }
  });

// Validate command
program
  .command("validate")
  .description("Validate configuration and connectivity")
  .option(
    "-c, --config <path>",
    "Configuration file path",
    "./bookstack-sync.json",
  )
  .action(async (options) => {
    try {
      const config = await loadConfig(options.config);
      const integration = createBookStackIntegration(config.sync, {
        monitoring: config.monitoring,
        cicd: config.cicd,
      });

      console.log("Validating configuration...");

      // Test BookStack connectivity
      const healthCheck = await integration.bookstackClient.healthCheck();
      console.log(
        `BookStack API: ${healthCheck ? "✅ Connected" : "❌ Failed"}`,
      );

      // Validate CI/CD configuration if present
      if (config.cicd && integration.cicdIntegration) {
        const validation =
          await integration.cicdIntegration.validateConfiguration();
        console.log(
          `CI/CD Config: ${validation.valid ? "✅ Valid" : "❌ Invalid"}`,
        );
        if (!validation.valid) {
          validation.errors.forEach((error) => console.log(`  - ${error}`));
        }
      }

      // Check docs directory
      try {
        await fs.access(config.sync.docsRoot);
        console.log(`Docs Directory: ✅ Accessible (${config.sync.docsRoot})`);
      } catch {
        console.log(
          `Docs Directory: ❌ Not accessible (${config.sync.docsRoot})`,
        );
      }

      integration.shutdown();

      if (!healthCheck) {
        process.exit(1);
      }
    } catch (error: any) {
      console.error("Validation failed:", error.message);
      process.exit(1);
    }
  });

async function loadConfig(
  configPath: string,
  overrides?: any,
): Promise<{
  sync: SyncConfig;
  monitoring?: MonitoringConfig;
  cicd?: CICDConfig;
}> {
  try {
    const configContent = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(configContent);

    // Apply command-line overrides
    if (overrides) {
      if (overrides.docsRoot) config.sync.docsRoot = overrides.docsRoot;
      if (overrides.bookstackUrl)
        config.sync.bookstack.baseUrl = overrides.bookstackUrl;
      if (overrides.tokenId) config.sync.bookstack.tokenId = overrides.tokenId;
      if (overrides.tokenSecret)
        config.sync.bookstack.tokenSecret = overrides.tokenSecret;
      if (overrides.dryRun) config.sync.dryRun = true;
    }

    return config;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      throw new Error(
        `Configuration file not found: ${configPath}. Run 'bookstack-sync init' to create one.`,
      );
    }
    throw new Error(`Failed to load configuration: ${error.message}`);
  }
}

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  process.exit(1);
});

// Parse command line arguments
program.parse();
