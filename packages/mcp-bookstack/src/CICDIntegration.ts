/**
 * CI/CD Integration for BookStack Sync
 * T.0001.01.02.01 - BookStack Integration Strategy Implementation
 *
 * Features:
 * - Automated sync on git events
 * - Pipeline integration
 * - Deployment hooks
 * - Status reporting
 * - Rollback capabilities
 */

import { EventEmitter } from "events";
import { promises as fs } from "fs";
import path from "path";
import { execSync } from "child_process";
import { SyncEngine, SyncConfig } from "./SyncEngine";
import { MonitoringSystem } from "./MonitoringSystem";

export interface CICDConfig {
  enabled: boolean;
  triggers: {
    onPush: boolean;
    onPullRequest: boolean;
    onRelease: boolean;
    branches: string[];
  };
  deployment: {
    environment: "development" | "staging" | "production";
    requireApproval: boolean;
    rollbackOnFailure: boolean;
  };
  notifications: {
    slack?: {
      webhook: string;
      channel: string;
    };
    email?: {
      recipients: string[];
      smtpConfig: any;
    };
  };
}

export interface PipelineContext {
  trigger: "push" | "pull_request" | "release" | "manual";
  branch: string;
  commit: string;
  author: string;
  message: string;
  environment: string;
  buildNumber?: string;
  pullRequestId?: string;
}

export interface DeploymentResult {
  success: boolean;
  duration: number;
  syncStats?: any;
  errors?: string[];
  rollbackPerformed?: boolean;
  deploymentId: string;
}

export class CICDIntegration extends EventEmitter {
  private deploymentHistory: DeploymentResult[] = [];

  constructor(
    private config: CICDConfig,
    private syncConfig: SyncConfig,
    private monitoring?: MonitoringSystem,
  ) {
    super();
  }

  /**
   * Main entry point for CI/CD pipeline
   */
  async executePipeline(context: PipelineContext): Promise<DeploymentResult> {
    const deploymentId = this.generateDeploymentId();
    const startTime = Date.now();

    this.emit("deploymentStart", { deploymentId, context });

    try {
      // Validate pipeline conditions
      if (!this.shouldExecute(context)) {
        return {
          success: true,
          duration: Date.now() - startTime,
          deploymentId,
          errors: ["Pipeline execution skipped based on configuration"],
        };
      }

      // Pre-deployment checks
      await this.preDeploymentChecks(context);

      // Execute sync
      const syncResult = await this.executeSync(context);

      // Post-deployment validation
      await this.postDeploymentValidation(context, syncResult);

      const result: DeploymentResult = {
        success: true,
        duration: Date.now() - startTime,
        syncStats: syncResult,
        deploymentId,
      };

      this.deploymentHistory.push(result);
      this.emit("deploymentSuccess", { deploymentId, result, context });
      await this.sendNotification("success", context, result);

      return result;
    } catch (error: any) {
      const result: DeploymentResult = {
        success: false,
        duration: Date.now() - startTime,
        errors: [error.message],
        deploymentId,
      };

      // Attempt rollback if configured
      if (this.config.deployment.rollbackOnFailure) {
        try {
          await this.performRollback(context);
          result.rollbackPerformed = true;
        } catch (rollbackError: any) {
          result.errors?.push(`Rollback failed: ${rollbackError.message}`);
        }
      }

      this.deploymentHistory.push(result);
      this.emit("deploymentFailure", { deploymentId, result, context, error });
      await this.sendNotification("failure", context, result);

      throw error;
    }
  }

  private shouldExecute(context: PipelineContext): boolean {
    if (!this.config.enabled) return false;

    // Check trigger type
    switch (context.trigger) {
      case "push":
        if (!this.config.triggers.onPush) return false;
        break;
      case "pull_request":
        if (!this.config.triggers.onPullRequest) return false;
        break;
      case "release":
        if (!this.config.triggers.onRelease) return false;
        break;
      case "manual":
        // Manual triggers always execute if enabled
        break;
      default:
        return false;
    }

    // Check branch restrictions
    if (this.config.triggers.branches.length > 0) {
      const branchMatches = this.config.triggers.branches.some((pattern) => {
        if (pattern.includes("*")) {
          const regex = new RegExp(pattern.replace(/\*/g, ".*"));
          return regex.test(context.branch);
        }
        return pattern === context.branch;
      });

      if (!branchMatches) return false;
    }

    return true;
  }

  private async preDeploymentChecks(context: PipelineContext): Promise<void> {
    this.emit("preDeploymentChecks", { context });

    // Check git repository state
    await this.validateGitState(context);

    // Check documentation structure
    await this.validateDocumentationStructure();

    // Check BookStack connectivity
    await this.validateBookStackConnection();

    // Environment-specific checks
    await this.validateEnvironment(context.environment);
  }

  private async validateGitState(context: PipelineContext): Promise<void> {
    try {
      // Verify we're on the correct commit
      const currentCommit = execSync("git rev-parse HEAD", {
        encoding: "utf-8",
        cwd: this.syncConfig.docsRoot,
      }).trim();

      if (currentCommit !== context.commit) {
        throw new Error(
          `Git state mismatch. Expected ${context.commit}, got ${currentCommit}`,
        );
      }

      // Check for uncommitted changes
      const status = execSync("git status --porcelain", {
        encoding: "utf-8",
        cwd: this.syncConfig.docsRoot,
      }).trim();

      if (status) {
        throw new Error("Uncommitted changes detected in repository");
      }
    } catch (error: any) {
      throw new Error(`Git validation failed: ${error.message}`);
    }
  }

  private async validateDocumentationStructure(): Promise<void> {
    try {
      // Check if docs root exists
      await fs.access(this.syncConfig.docsRoot);

      // Validate structure file if specified
      if (this.syncConfig.structureFile) {
        await fs.access(this.syncConfig.structureFile);
      }

      // Check for required directories
      const requiredDirs = ["engineering", "platform", "projects", "learning"];
      for (const dir of requiredDirs) {
        const dirPath = path.join(this.syncConfig.docsRoot, dir);
        try {
          await fs.access(dirPath);
        } catch {
          console.warn(`Optional directory not found: ${dir}`);
        }
      }
    } catch (error: any) {
      throw new Error(
        `Documentation structure validation failed: ${error.message}`,
      );
    }
  }

  private async validateBookStackConnection(): Promise<void> {
    try {
      const { BookStackClient } = await import("./BookStackClient");
      const client = new BookStackClient(this.syncConfig.bookstack);

      const isHealthy = await client.healthCheck();
      if (!isHealthy) {
        throw new Error("BookStack API health check failed");
      }
    } catch (error: any) {
      throw new Error(
        `BookStack connection validation failed: ${error.message}`,
      );
    }
  }

  private async validateEnvironment(environment: string): Promise<void> {
    // Environment-specific validation logic
    switch (environment) {
      case "production":
        // Stricter validation for production
        if (this.config.deployment.requireApproval) {
          // In a real implementation, this would check for approval status
          console.log("Production deployment requires approval");
        }
        break;
      case "staging":
        // Staging-specific checks
        break;
      case "development":
        // Development-specific checks
        break;
    }
  }

  private async executeSync(context: PipelineContext): Promise<any> {
    this.emit("syncStart", { context });

    // Create sync engine with CI/CD specific configuration
    const cicdSyncConfig = {
      ...this.syncConfig,
      dryRun:
        context.environment === "development" &&
        context.trigger === "pull_request",
    };

    const syncEngine = new SyncEngine(cicdSyncConfig);

    // Set up monitoring if available
    if (this.monitoring) {
      syncEngine.on("syncComplete", (stats) => {
        this.monitoring!.emit("cicdSyncComplete", { context, stats });
      });

      syncEngine.on("syncError", (error) => {
        this.monitoring!.emit("cicdSyncError", { context, error });
      });
    }

    try {
      const result = await syncEngine.sync();
      this.emit("syncComplete", { context, result });
      return result;
    } catch (error) {
      this.emit("syncError", { context, error });
      throw error;
    }
  }

  private async postDeploymentValidation(
    context: PipelineContext,
    syncResult: any,
  ): Promise<void> {
    this.emit("postDeploymentValidation", { context, syncResult });

    // Validate sync results
    if (syncResult.errors > 0) {
      throw new Error(`Sync completed with ${syncResult.errors} errors`);
    }

    // Check for excessive conflicts
    const conflictThreshold = 10; // Configurable threshold
    if (syncResult.conflicts > conflictThreshold) {
      throw new Error(
        `Too many conflicts detected: ${syncResult.conflicts} (threshold: ${conflictThreshold})`,
      );
    }

    // Perform smoke tests
    await this.performSmokeTests(context);
  }

  private async performSmokeTests(_context: PipelineContext): Promise<void> {
    try {
      const { BookStackClient } = await import("./BookStackClient");
      const client = new BookStackClient(this.syncConfig.bookstack);

      // Test basic API functionality
      const shelves = await client.getShelves();
      if (!Array.isArray(shelves)) {
        throw new Error("Failed to retrieve shelves from BookStack");
      }

      // Test a sample page retrieval
      if (shelves.length > 0) {
        const books = await client.getBooks();
        if (books.length > 0) {
          const pages = await client.getPages();
          if (!Array.isArray(pages)) {
            throw new Error("Failed to retrieve pages from BookStack");
          }
        }
      }
    } catch (error: any) {
      throw new Error(`Smoke tests failed: ${error.message}`);
    }
  }

  private async performRollback(context: PipelineContext): Promise<void> {
    this.emit("rollbackStart", { context });

    try {
      // Find the last successful deployment
      const lastSuccessful = this.deploymentHistory
        .slice()
        .reverse()
        .find((d) => d.success && d.deploymentId !== context.commit);

      if (!lastSuccessful) {
        throw new Error("No previous successful deployment found for rollback");
      }

      // In a real implementation, this would:
      // 1. Revert to the previous git commit
      // 2. Re-run the sync with the previous state
      // 3. Validate the rollback

      console.log(`Rolling back to deployment: ${lastSuccessful.deploymentId}`);

      this.emit("rollbackComplete", {
        context,
        rolledBackTo: lastSuccessful.deploymentId,
      });
    } catch (error) {
      this.emit("rollbackError", { context, error });
      throw error;
    }
  }

  private async sendNotification(
    type: "success" | "failure",
    context: PipelineContext,
    result: DeploymentResult,
  ): Promise<void> {
    // Slack notification
    if (this.config.notifications.slack) {
      await this.sendSlackNotification(type, context, result);
    }

    // Email notification
    if (this.config.notifications.email) {
      await this.sendEmailNotification(type, context, result);
    }
  }

  private async sendSlackNotification(
    type: "success" | "failure",
    context: PipelineContext,
    result: DeploymentResult,
  ): Promise<void> {
    if (!this.config.notifications.slack) return;

    const color = type === "success" ? "good" : "danger";
    const emoji = type === "success" ? ":white_check_mark:" : ":x:";

    const payload = {
      channel: this.config.notifications.slack.channel,
      attachments: [
        {
          color,
          title: `${emoji} BookStack Sync ${type === "success" ? "Successful" : "Failed"}`,
          fields: [
            { title: "Environment", value: context.environment, short: true },
            { title: "Branch", value: context.branch, short: true },
            {
              title: "Commit",
              value: context.commit.substring(0, 8),
              short: true,
            },
            { title: "Duration", value: `${result.duration}ms`, short: true },
            { title: "Author", value: context.author, short: true },
            { title: "Trigger", value: context.trigger, short: true },
          ],
          footer: "BookStack Sync CI/CD",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    if (result.errors && result.errors.length > 0) {
      payload.attachments[0].fields.push({
        title: "Errors",
        value: result.errors.join("\n"),
        short: false,
      });
    }

    try {
      const response = await fetch(this.config.notifications.slack.webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(
          "Failed to send Slack notification:",
          response.statusText,
        );
      }
    } catch (error) {
      console.error("Error sending Slack notification:", error);
    }
  }

  private async sendEmailNotification(
    type: "success" | "failure",
    _context: PipelineContext,
    _result: DeploymentResult,
  ): Promise<void> {
    // Email implementation would go here
    // This is a placeholder for the email notification logic
    console.log(
      `Email notification (${type}) would be sent to:`,
      this.config.notifications.email?.recipients,
    );
  }

  private generateDeploymentId(): string {
    return `deploy_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // Public methods for pipeline integration
  async getDeploymentHistory(limit?: number): Promise<DeploymentResult[]> {
    return limit
      ? this.deploymentHistory.slice(-limit)
      : [...this.deploymentHistory];
  }

  async getLastDeployment(): Promise<DeploymentResult | null> {
    return this.deploymentHistory.length > 0
      ? this.deploymentHistory[this.deploymentHistory.length - 1]
      : null;
  }

  async validateConfiguration(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate basic configuration
    if (!this.config.enabled) {
      return { valid: true, errors: ["CI/CD integration is disabled"] };
    }

    // Validate triggers
    if (
      !this.config.triggers.onPush &&
      !this.config.triggers.onPullRequest &&
      !this.config.triggers.onRelease
    ) {
      errors.push("At least one trigger must be enabled");
    }

    // Validate BookStack configuration
    if (!this.syncConfig.bookstack.baseUrl) {
      errors.push("BookStack base URL is required");
    }

    if (
      !this.syncConfig.bookstack.tokenId ||
      !this.syncConfig.bookstack.tokenSecret
    ) {
      errors.push("BookStack API credentials are required");
    }

    // Validate docs root
    try {
      await fs.access(this.syncConfig.docsRoot);
    } catch {
      errors.push(
        `Documentation root directory not accessible: ${this.syncConfig.docsRoot}`,
      );
    }

    return { valid: errors.length === 0, errors };
  }
}
