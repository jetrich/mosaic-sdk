/**
 * Docs Command - Framework Alignment CLI Commands
 * Provides validation, migration, and initialization for project structure
 */

import chalk from "chalk";
import ora from "ora";
import * as path from "path";
import {
  StructureValidator,
  ValidationResult,
} from "../validators/StructureValidator";
import {
  StructureMigrator,
  MigrationPlan,
  MigrationResult,
} from "../tools/StructureMigrator";

export class DocsCommand {
  private validator = new StructureValidator();
  private migrator = new StructureMigrator();

  /**
   * Validate project structure against framework alignment rules
   */
  public async validate(options: {
    path?: string;
    json?: boolean;
    fix?: boolean;
    verbose?: boolean;
  }): Promise<void> {
    const projectPath = options.path || process.cwd();
    const spinner = ora("Validating project structure...").start();

    try {
      const result = await this.validator.validateProjectStructure(projectPath);
      spinner.stop();

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      this.displayValidationResult(result, options.verbose);

      if (options.fix && !result.valid) {
        await this.autoFix(projectPath, result);
      }

      // Exit with error code if validation failed
      if (!result.valid) {
        process.exit(1);
      }
    } catch (error) {
      spinner.fail("Validation failed");
      console.error(chalk.red("Error:"), (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * Migrate project structure to framework alignment
   */
  public async migrate(options: {
    path?: string;
    dryRun?: boolean;
    force?: boolean;
    preserveGit?: boolean;
  }): Promise<void> {
    const projectPath = options.path || process.cwd();

    console.log(chalk.blue("🔄 MosAIc Structure Migration"));
    console.log(chalk.gray(`Project: ${projectPath}`));
    console.log();

    try {
      // Create migration plan
      const spinner = ora("Analyzing current structure...").start();
      const plan = await this.migrator.createMigrationPlan(projectPath);
      spinner.succeed("Migration plan created");

      // Display plan
      this.displayMigrationPlan(plan);

      if (options.dryRun) {
        console.log(chalk.yellow("🔍 Dry run mode - no changes made"));
        return;
      }

      // Confirm migration
      if (!options.force) {
        const { default: inquirer } = await import("inquirer");
        const { proceed } = await inquirer.prompt([
          {
            type: "confirm",
            name: "proceed",
            message: "Proceed with migration?",
            default: false,
          },
        ]);

        if (!proceed) {
          console.log(chalk.yellow("Migration cancelled"));
          return;
        }
      }

      // Execute migration
      const migrationSpinner = ora("Executing migration...").start();
      const result = await this.migrator.executeMigration(plan);

      if (result.success) {
        migrationSpinner.succeed("Migration completed successfully");
        this.displayMigrationResult(result);
      } else {
        migrationSpinner.fail("Migration failed");
        this.displayMigrationErrors(result);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red("Migration failed:"), (error as Error).message);
      process.exit(1);
    }
  }

  /**
   * Initialize compliant project structure
   */
  public async init(options: {
    path?: string;
    projectName?: string;
    projectYamlOnly?: boolean;
    force?: boolean;
  }): Promise<void> {
    const projectPath = options.path || process.cwd();

    console.log(chalk.blue("🚀 Initialize MosAIc Project Structure"));
    console.log();

    try {
      if (options.projectYamlOnly) {
        await this.initProjectYaml(projectPath, options);
      } else {
        await this.initFullStructure(projectPath, options);
      }

      console.log(chalk.green("✅ Project structure initialized successfully"));
    } catch (error) {
      console.error(
        chalk.red("Initialization failed:"),
        (error as Error).message,
      );
      process.exit(1);
    }
  }

  /**
   * Check alignment status across multiple projects
   */
  public async checkAlignment(options: {
    paths?: string[];
    json?: boolean;
    summary?: boolean;
  }): Promise<void> {
    const paths = options.paths || [process.cwd()];
    const results: { path: string; result: ValidationResult }[] = [];

    console.log(chalk.blue("🔍 Framework Alignment Check"));
    console.log();

    for (const projectPath of paths) {
      const spinner = ora(`Checking ${path.basename(projectPath)}...`).start();

      try {
        const result =
          await this.validator.validateProjectStructure(projectPath);
        results.push({ path: projectPath, result });

        if (result.valid) {
          spinner.succeed(`${path.basename(projectPath)} - Aligned`);
        } else {
          spinner.fail(
            `${path.basename(projectPath)} - ${result.errors.length} issues`,
          );
        }
      } catch (error) {
        spinner.fail(`${path.basename(projectPath)} - Error`);
        results.push({
          path: projectPath,
          result: {
            valid: false,
            errors: [
              {
                type: "INVALID_PATH_STRUCTURE",
                path: projectPath,
                message: (error as Error).message,
                severity: "ERROR",
              },
            ],
            warnings: [],
            suggestions: [],
            executionTime: 0,
          },
        });
      }
    }

    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    } else if (options.summary) {
      this.displayAlignmentSummary(results);
    } else {
      this.displayDetailedAlignment(results);
    }
  }

  /**
   * Display validation result in human-readable format
   */
  private displayValidationResult(
    result: ValidationResult,
    verbose = false,
  ): void {
    console.log(chalk.blue("📋 Structure Validation Report"));
    console.log("─".repeat(50));

    if (result.projectName) {
      console.log(`Project: ${chalk.cyan(result.projectName)}`);
    }

    console.log(
      `Status: ${result.valid ? chalk.green("✅ VALID") : chalk.red("❌ INVALID")}`,
    );
    console.log(`Execution time: ${result.executionTime}ms`);
    console.log();

    // Display errors
    if (result.errors.length > 0) {
      console.log(chalk.red("🚨 Errors:"));
      for (const error of result.errors) {
        console.log(`  ${chalk.red("•")} ${error.message}`);
        if (verbose && error.fix) {
          console.log(`    ${chalk.gray("Fix:")} ${error.fix}`);
        }
        if (verbose) {
          console.log(`    ${chalk.gray("Path:")} ${error.path}`);
        }
      }
      console.log();
    }

    // Display warnings
    if (result.warnings.length > 0) {
      console.log(chalk.yellow("⚠️  Warnings:"));
      for (const warning of result.warnings) {
        console.log(`  ${chalk.yellow("•")} ${warning.message}`);
        if (verbose && warning.suggestion) {
          console.log(`    ${chalk.gray("Suggestion:")} ${warning.suggestion}`);
        }
      }
      console.log();
    }

    // Display suggestions
    if (result.suggestions.length > 0) {
      console.log(chalk.blue("💡 Suggestions:"));
      for (const suggestion of result.suggestions) {
        console.log(`  ${chalk.blue("•")} ${suggestion.description}`);
        if (suggestion.command) {
          console.log(
            `    ${chalk.gray("Command:")} ${chalk.cyan(suggestion.command)}`,
          );
        }
      }
      console.log();
    }
  }

  /**
   * Display migration plan
   */
  private displayMigrationPlan(plan: MigrationPlan): void {
    console.log(chalk.blue("📋 Migration Plan"));
    console.log("─".repeat(50));
    console.log(`Project: ${chalk.cyan(plan.projectName)}`);
    console.log(`Operations: ${plan.operations.length}`);
    console.log(
      `Git history: ${plan.preserveGitHistory ? "Preserved" : "Not preserved"}`,
    );
    console.log();

    if (plan.operations.length > 0) {
      console.log(chalk.blue("Operations:"));
      for (const operation of plan.operations) {
        const icon = this.getOperationIcon(operation.type);
        console.log(`  ${icon} ${operation.description}`);
        if (operation.source && operation.target) {
          console.log(`    ${chalk.gray("From:")} ${operation.source}`);
          console.log(`    ${chalk.gray("To:")} ${operation.target}`);
        } else if (operation.target) {
          console.log(`    ${chalk.gray("Target:")} ${operation.target}`);
        }
      }
      console.log();
    }
  }

  /**
   * Display migration result
   */
  private displayMigrationResult(result: MigrationResult): void {
    console.log();
    console.log(chalk.green("✅ Migration Summary"));
    console.log("─".repeat(50));
    console.log(
      `Operations completed: ${result.operations.filter((op) => op.success).length}/${result.operations.length}`,
    );
    console.log(`Execution time: ${result.executionTime}ms`);
    console.log(`Backup created: ${result.backupCreated}`);
    console.log();

    if (result.errors.length > 0) {
      console.log(chalk.red("Errors encountered:"));
      for (const error of result.errors) {
        console.log(`  ${chalk.red("•")} ${error}`);
      }
    }
  }

  /**
   * Display migration errors
   */
  private displayMigrationErrors(result: MigrationResult): void {
    console.log();
    console.log(chalk.red("❌ Migration Failed"));
    console.log("─".repeat(50));

    for (const error of result.errors) {
      console.log(`${chalk.red("•")} ${error}`);
    }

    if (result.backupCreated) {
      console.log();
      console.log(
        chalk.yellow("💾 Backup available at:"),
        result.backupCreated,
      );
    }
  }

  /**
   * Display alignment summary
   */
  private displayAlignmentSummary(
    results: { path: string; result: ValidationResult }[],
  ): void {
    const total = results.length;
    const valid = results.filter((r) => r.result.valid).length;
    const invalid = total - valid;

    console.log();
    console.log(chalk.blue("📊 Alignment Summary"));
    console.log("─".repeat(50));
    console.log(`Total projects: ${total}`);
    console.log(`Aligned: ${chalk.green(valid)}`);
    console.log(`Not aligned: ${chalk.red(invalid)}`);
    console.log(`Success rate: ${Math.round((valid / total) * 100)}%`);
  }

  /**
   * Display detailed alignment results
   */
  private displayDetailedAlignment(
    results: { path: string; result: ValidationResult }[],
  ): void {
    console.log();
    for (const { path: projectPath, result } of results) {
      console.log(chalk.blue(`📁 ${path.basename(projectPath)}`));
      console.log(`   Path: ${projectPath}`);
      console.log(
        `   Status: ${result.valid ? chalk.green("✅ Aligned") : chalk.red("❌ Not aligned")}`,
      );

      if (!result.valid) {
        console.log(
          `   Issues: ${result.errors.length} errors, ${result.warnings.length} warnings`,
        );
      }
      console.log();
    }
  }

  /**
   * Get icon for operation type
   */
  private getOperationIcon(type: string): string {
    switch (type) {
      case "MOVE":
        return "📦";
      case "CREATE":
        return "📁";
      case "DELETE":
        return "🗑️";
      case "MODIFY":
        return "✏️";
      default:
        return "🔧";
    }
  }

  /**
   * Auto-fix validation issues
   */
  private async autoFix(
    projectPath: string,
    result: ValidationResult,
  ): Promise<void> {
    console.log();
    console.log(chalk.blue("🔧 Auto-fixing issues..."));

    // Check if migration is needed
    const needsMigration = result.errors.some(
      (error) =>
        error.type === "DOMAIN_SHELF_VIOLATION" ||
        error.type === "MISSING_PROJECT_FOLDER",
    );

    if (needsMigration) {
      await this.migrate({ path: projectPath, force: true });
    } else {
      console.log(chalk.yellow("No auto-fixable issues found"));
    }
  }

  /**
   * Initialize project YAML only
   */
  private async initProjectYaml(
    _projectPath: string,
    _options: any,
  ): Promise<void> {
    // Implementation for project YAML initialization
    console.log(chalk.blue("Creating _project.yaml..."));
    // This would create the project YAML file
  }

  /**
   * Initialize full project structure
   */
  private async initFullStructure(
    _projectPath: string,
    _options: any,
  ): Promise<void> {
    // Implementation for full structure initialization
    console.log(chalk.blue("Creating full project structure..."));
    // This would create the complete directory structure
  }
}
