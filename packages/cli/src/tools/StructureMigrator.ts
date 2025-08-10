/**
 * Structure Migrator - Framework Alignment Migration Tools
 * Migrates projects from old structure to unified MosAIc alignment
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

export interface MigrationPlan {
  projectPath: string;
  projectName: string;
  operations: MigrationOperation[];
  backupPath: string;
  preserveGitHistory: boolean;
}

export interface MigrationOperation {
  type: "MOVE" | "CREATE" | "DELETE" | "MODIFY";
  source?: string;
  target: string;
  description: string;
  gitCommand?: string;
}

export interface MigrationResult {
  success: boolean;
  operations: CompletedOperation[];
  errors: string[];
  backupCreated: string;
  executionTime: number;
}

export interface CompletedOperation {
  operation: MigrationOperation;
  success: boolean;
  error?: string;
}

export class StructureMigrator {
  /**
   * Create migration plan for project structure alignment
   */
  public async createMigrationPlan(
    projectPath: string,
  ): Promise<MigrationPlan> {
    const projectName = this.detectProjectName(projectPath);
    const operations: MigrationOperation[] = [];

    const docsPath = path.join(projectPath, "docs");
    const targetProjectPath = path.join(docsPath, projectName);

    // Check current structure
    if (!fs.existsSync(docsPath)) {
      // No docs folder - create basic structure
      operations.push({
        type: "CREATE",
        target: docsPath,
        description: "Create docs/ folder",
      });
    }

    // Check for domain folders at docs root
    const domainFolders = this.findDomainFoldersAtRoot(docsPath);

    if (domainFolders.length > 0) {
      // Create project folder
      operations.push({
        type: "CREATE",
        target: targetProjectPath,
        description: `Create project folder docs/${projectName}/`,
      });

      // Move domain folders
      for (const folder of domainFolders) {
        const sourcePath = path.join(docsPath, folder);
        const targetPath = path.join(targetProjectPath, folder);

        operations.push({
          type: "MOVE",
          source: sourcePath,
          target: targetPath,
          description: `Move ${folder}/ to docs/${projectName}/${folder}/`,
          gitCommand: `git mv "${sourcePath}" "${targetPath}"`,
        });
      }
    }

    // Create _project.yaml if missing
    const projectYamlPath = path.join(targetProjectPath, "_project.yaml");
    if (!fs.existsSync(projectYamlPath)) {
      operations.push({
        type: "CREATE",
        target: projectYamlPath,
        description: "Create _project.yaml with project metadata",
      });
    }

    // Create task-management structure if missing
    const taskMgmtPath = path.join(targetProjectPath, "task-management");
    if (!fs.existsSync(taskMgmtPath)) {
      operations.push({
        type: "CREATE",
        target: taskMgmtPath,
        description: "Create task-management/ folder structure",
      });
    }

    return {
      projectPath,
      projectName,
      operations,
      backupPath: path.join(projectPath, `.migration-backup-${Date.now()}`),
      preserveGitHistory: this.isGitRepository(projectPath),
    };
  }

  /**
   * Execute migration plan
   */
  public async executeMigration(plan: MigrationPlan): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: true,
      operations: [],
      errors: [],
      backupCreated: "",
      executionTime: 0,
    };

    try {
      // Create backup
      result.backupCreated = await this.createBackup(plan);

      // Execute operations
      for (const operation of plan.operations) {
        const completed = await this.executeOperation(operation, plan);
        result.operations.push(completed);

        if (!completed.success) {
          result.success = false;
          result.errors.push(completed.error || "Unknown error");
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`Migration failed: ${(error as Error).message}`);
    }

    result.executionTime = Date.now() - startTime;
    return result;
  }

  /**
   * Detect project name from various sources
   */
  private detectProjectName(projectPath: string): string {
    // Try package.json first
    const packageJsonPath = path.join(projectPath, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf8"),
        );
        if (packageJson.name) {
          // Clean up scoped package names
          return packageJson.name.replace(/^@[^/]+\//, "");
        }
      } catch (error) {
        // Ignore JSON parse errors
      }
    }

    // Try git remote origin
    if (this.isGitRepository(projectPath)) {
      try {
        const remote = execSync("git remote get-url origin", {
          cwd: projectPath,
          encoding: "utf8",
        }).trim();

        const match = remote.match(/\/([^\/]+?)(?:\.git)?$/);
        if (match) {
          return match[1];
        }
      } catch (error) {
        // Ignore git errors
      }
    }

    // Fall back to directory name
    return path.basename(projectPath);
  }

  /**
   * Find domain folders at docs root
   */
  private findDomainFoldersAtRoot(docsPath: string): string[] {
    if (!fs.existsSync(docsPath)) return [];

    const domainFolders = [
      "architecture",
      "api",
      "operations",
      "infrastructure",
    ];
    const contents = fs.readdirSync(docsPath, { withFileTypes: true });

    return contents
      .filter((item) => item.isDirectory() && domainFolders.includes(item.name))
      .map((item) => item.name);
  }

  /**
   * Check if directory is a git repository
   */
  private isGitRepository(projectPath: string): boolean {
    return fs.existsSync(path.join(projectPath, ".git"));
  }

  /**
   * Create backup of current structure
   */
  private async createBackup(plan: MigrationPlan): Promise<string> {
    const backupPath = plan.backupPath;

    // Create backup directory
    fs.mkdirSync(backupPath, { recursive: true });

    // Copy docs folder if it exists
    const docsPath = path.join(plan.projectPath, "docs");
    if (fs.existsSync(docsPath)) {
      const backupDocsPath = path.join(backupPath, "docs");
      await this.copyDirectory(docsPath, backupDocsPath);
    }

    // Create backup manifest
    const manifest = {
      timestamp: new Date().toISOString(),
      projectPath: plan.projectPath,
      projectName: plan.projectName,
      operations: plan.operations,
      gitRepository: plan.preserveGitHistory,
    };

    fs.writeFileSync(
      path.join(backupPath, "migration-manifest.json"),
      JSON.stringify(manifest, null, 2),
    );

    return backupPath;
  }

  /**
   * Execute single migration operation
   */
  private async executeOperation(
    operation: MigrationOperation,
    plan: MigrationPlan,
  ): Promise<CompletedOperation> {
    const completed: CompletedOperation = {
      operation,
      success: false,
    };

    try {
      switch (operation.type) {
        case "CREATE":
          await this.executeCreate(operation, plan);
          break;
        case "MOVE":
          await this.executeMove(operation, plan);
          break;
        case "DELETE":
          await this.executeDelete(operation, plan);
          break;
        case "MODIFY":
          await this.executeModify(operation, plan);
          break;
      }
      completed.success = true;
    } catch (error) {
      completed.error = (error as Error).message;
    }

    return completed;
  }

  /**
   * Execute CREATE operation
   */
  private async executeCreate(
    operation: MigrationOperation,
    plan: MigrationPlan,
  ): Promise<void> {
    const targetPath = operation.target;

    if (targetPath.endsWith("_project.yaml")) {
      // Create _project.yaml with template
      const template = this.generateProjectYamlTemplate(plan.projectName);
      fs.writeFileSync(targetPath, template);
    } else if (targetPath.includes("task-management")) {
      // Create task-management structure
      this.createTaskManagementStructure(targetPath);
    } else {
      // Create directory
      fs.mkdirSync(targetPath, { recursive: true });
    }
  }

  /**
   * Execute MOVE operation
   */
  private async executeMove(
    operation: MigrationOperation,
    plan: MigrationPlan,
  ): Promise<void> {
    if (!operation.source) {
      throw new Error("MOVE operation requires source path");
    }

    const sourcePath = operation.source;
    const targetPath = operation.target;

    // Ensure target directory exists
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    if (plan.preserveGitHistory && operation.gitCommand) {
      // Use git mv to preserve history
      execSync(operation.gitCommand, { cwd: plan.projectPath });
    } else {
      // Regular move
      fs.renameSync(sourcePath, targetPath);
    }
  }

  /**
   * Execute DELETE operation
   */
  private async executeDelete(
    operation: MigrationOperation,
    _plan: MigrationPlan,
  ): Promise<void> {
    const targetPath = operation.target;

    if (fs.existsSync(targetPath)) {
      if (fs.statSync(targetPath).isDirectory()) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(targetPath);
      }
    }
  }

  /**
   * Execute MODIFY operation
   */
  private async executeModify(
    operation: MigrationOperation,
    _plan: MigrationPlan,
  ): Promise<void> {
    // Implementation depends on specific modification needed
    // For now, just ensure file exists
    if (!fs.existsSync(operation.target)) {
      throw new Error(`File to modify does not exist: ${operation.target}`);
    }
  }

  /**
   * Copy directory recursively
   */
  private async copyDirectory(source: string, target: string): Promise<void> {
    fs.mkdirSync(target, { recursive: true });

    const items = fs.readdirSync(source, { withFileTypes: true });

    for (const item of items) {
      const sourcePath = path.join(source, item.name);
      const targetPath = path.join(target, item.name);

      if (item.isDirectory()) {
        await this.copyDirectory(sourcePath, targetPath);
      } else {
        fs.copyFileSync(sourcePath, targetPath);
      }
    }
  }

  /**
   * Generate _project.yaml template
   */
  private generateProjectYamlTemplate(projectName: string): string {
    return `# MosAIc Project Configuration
# Generated by structure migration tool

project:
  name: "${projectName}"
  type: "application"
  description: "Project description"
  
bookstack:
  shelf: "${projectName}"
  sync_enabled: true
  
structure:
  version: "1.0"
  follows_upp: true
  
metadata:
  created: "${new Date().toISOString()}"
  migrated: true
  migration_tool: "mosaic-cli"
`;
  }

  /**
   * Create task-management folder structure
   */
  private createTaskManagementStructure(basePath: string): void {
    const folders = [
      "epics/active",
      "epics/completed",
      "planning",
      "active",
      "completed",
    ];

    for (const folder of folders) {
      fs.mkdirSync(path.join(basePath, folder), { recursive: true });
    }

    // Create README
    const readmeContent = `# Task Management

This folder follows the UPP (Ultrathink Planning Protocol) methodology.

## Structure

- \`epics/\` - Epic-level planning and tracking
- \`planning/\` - Project planning documents
- \`active/\` - Currently active tasks
- \`completed/\` - Completed tasks and retrospectives

## Usage

Use the MosAIc CLI tools to manage tasks:

\`\`\`bash
mosaic task create --epic E.001 --title "New Feature"
mosaic task assign --agent BE-BACKEND-BENJAMIN
\`\`\`
`;

    fs.writeFileSync(path.join(basePath, "README.md"), readmeContent);
  }
}
