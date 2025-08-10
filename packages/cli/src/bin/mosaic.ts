#!/usr/bin/env node

/**
 * MosAIc Stack CLI Entry Point
 * Unified command-line interface for multi-mode architecture
 */

import { Command } from "commander";
import chalk from "chalk";
import figlet from "figlet";
import updateNotifier from "update-notifier";

import { InitCommand } from "../commands/InitCommand";
import { StartCommand } from "../commands/StartCommand";
import { StatusCommand } from "../commands/StatusCommand";
import { ConfigCommand } from "../commands/ConfigCommand";
import { ProvidersCommand } from "../commands/ProvidersCommand";
import { TestCommand } from "../commands/TestCommand";
import { TelemetryCommand } from "../commands/TelemetryCommand";
import { DocsCommand } from "../commands/DocsCommand";
import { TelemetryService } from "../utils/TelemetryService";

// Package info for update notifications
const pkg = require("../../package.json");

async function main() {
  // Check for updates
  updateNotifier({ pkg }).notify();

  // Initialize telemetry service
  const telemetryService = new TelemetryService();

  // Create main command
  const program = new Command();

  // Configure program
  program
    .name("mosaic")
    .description("MosAIc Stack - Enterprise AI Development Platform")
    .version(pkg.version)
    .option("-v, --verbose", "Enable verbose output")
    .option("--no-banner", "Disable startup banner")
    .hook("preAction", async (thisCommand) => {
      const opts = thisCommand.opts();

      // Show banner unless disabled
      if (opts.banner !== false && !process.env.MOSAIC_NO_BANNER) {
        await showBanner();
      }
    });

  // Initialize command - SIBKISS 3-step setup
  program
    .command("init")
    .description("Initialize MosAIc Stack configuration (SIBKISS 3-step setup)")
    .option(
      "-m, --mode <mode>",
      "Operation mode: local, hybrid, cloud",
      "hybrid",
    )
    .option("-f, --force", "Overwrite existing configuration")
    .option("--no-interactive", "Skip interactive prompts")
    .action(async (options) => {
      try {
        await new InitCommand(telemetryService).execute(options);
      } catch (error) {
        await telemetryService.trackError(
          pkg.version,
          (error as Error).message,
        );
        throw error;
      }
    });

  // Start command - Launch MosAIc Stack
  program
    .command("start")
    .alias("s")
    .description("Start MosAIc Stack services")
    .option("-c, --config <path>", "Configuration file path")
    .option("-p, --port <port>", "MCP server port", "3456")
    .option("-d, --daemon", "Run as daemon")
    .option("--dev", "Development mode")
    .action(async (options) => {
      try {
        await new StartCommand(telemetryService).execute(options);
      } catch (error) {
        await telemetryService.trackError(
          pkg.version,
          (error as Error).message,
        );
        throw error;
      }
    });

  // Status command - Check system status
  program
    .command("status")
    .description("Check MosAIc Stack status")
    .option("-j, --json", "Output as JSON")
    .option("--health", "Include health checks")
    .action(async (options) => {
      await new StatusCommand().execute(options);
    });

  // Config command - Configuration management
  const configCommand = program
    .command("config")
    .description("Configuration management");

  configCommand
    .command("show")
    .description("Show current configuration")
    .option("-j, --json", "Output as JSON")
    .action(async (options) => {
      await new ConfigCommand().show(options);
    });

  configCommand
    .command("validate")
    .description("Validate configuration")
    .option("-c, --config <path>", "Configuration file path")
    .action(async (options) => {
      await new ConfigCommand().validate(options);
    });

  configCommand
    .command("template <mode>")
    .description("Generate configuration template")
    .option("-o, --output <path>", "Output file path")
    .option("-f, --format <format>", "Output format: json, yaml", "yaml")
    .action(async (mode, options) => {
      await new ConfigCommand().template(mode, options);
    });

  // Providers command - Provider management
  const providersCommand = program
    .command("providers")
    .alias("p")
    .description("Provider management");

  providersCommand
    .command("list")
    .description("List available providers")
    .option("-j, --json", "Output as JSON")
    .action(async (options) => {
      await new ProvidersCommand().list(options);
    });

  providersCommand
    .command("health")
    .description("Check provider health")
    .option("-j, --json", "Output as JSON")
    .action(async (options) => {
      await new ProvidersCommand().health(options);
    });

  providersCommand
    .command("test <provider>")
    .description("Test specific provider")
    .option("-m, --model <model>", "Model to test")
    .action(async (provider, options) => {
      await new ProvidersCommand().test(provider, options);
    });

  // Test command - System testing
  program
    .command("test")
    .description("Run system tests")
    .option("-c, --config <path>", "Configuration file path")
    .option("--providers", "Test providers only")
    .option("--integration", "Run integration tests")
    .action(async (options) => {
      await new TestCommand().execute(options);
    });

  // Stop command - Stop services
  program
    .command("stop")
    .description("Stop MosAIc Stack services")
    .option("--force", "Force stop")
    .action(async (options) => {
      await new StartCommand().stop(options);
    });

  // Dev commands - Development utilities
  const devCommand = program
    .command("dev")
    .description("Development utilities");

  devCommand
    .command("logs")
    .description("Show development logs")
    .option("-f, --follow", "Follow log output")
    .option("-n, --lines <lines>", "Number of lines to show", "50")
    .action(async (options) => {
      await new StartCommand().logs(options);
    });

  devCommand
    .command("reset")
    .description("Reset development environment")
    .option("--hard", "Hard reset (remove all data)")
    .action(async (options) => {
      await new StartCommand().reset(options);
    });

  // Telemetry command - Manage telemetry preferences
  program
    .command("telemetry")
    .description("Manage telemetry preferences")
    .option("--enable", "Enable telemetry")
    .option("--disable", "Disable telemetry")
    .option("--status", "Show telemetry status")
    .option("--info", "Show privacy information")
    .action(async (options) => {
      await new TelemetryCommand().execute(options);
    });

  // Docs command - Framework alignment and structure management
  const docsCommand = program
    .command("docs")
    .description("Documentation structure management and framework alignment");

  docsCommand
    .command("validate")
    .description("Validate project structure against framework alignment rules")
    .option("-p, --path <path>", "Project path to validate", process.cwd())
    .option("-j, --json", "Output as JSON")
    .option("--fix", "Auto-fix issues where possible")
    .option("-v, --verbose", "Verbose output")
    .action(async (options) => {
      await new DocsCommand().validate(options);
    });

  docsCommand
    .command("migrate")
    .description("Migrate project structure to framework alignment")
    .option("-p, --path <path>", "Project path to migrate", process.cwd())
    .option("--dry-run", "Show migration plan without executing")
    .option("--force", "Skip confirmation prompts")
    .option("--preserve-git", "Preserve git history during migration", true)
    .action(async (options) => {
      await new DocsCommand().migrate(options);
    });

  docsCommand
    .command("init")
    .description("Initialize compliant project structure")
    .option("-p, --path <path>", "Project path to initialize", process.cwd())
    .option("-n, --project-name <name>", "Project name")
    .option("--project-yaml-only", "Create only _project.yaml file")
    .option("--force", "Overwrite existing files")
    .action(async (options) => {
      await new DocsCommand().init(options);
    });

  docsCommand
    .command("check-alignment")
    .description("Check framework alignment across multiple projects")
    .option("--paths <paths...>", "Project paths to check")
    .option("-j, --json", "Output as JSON")
    .option("--summary", "Show summary only")
    .action(async (options) => {
      await new DocsCommand().checkAlignment(options);
    });

  // Info command - System information
  program
    .command("info")
    .description("Show system information")
    .option("-j, --json", "Output as JSON")
    .action(async (options) => {
      const info = {
        version: pkg.version,
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd(),
        env: {
          HOME: process.env.HOME,
          PATH: process.env.PATH?.split(":").length || 0,
          NODE_ENV: process.env.NODE_ENV || "undefined",
        },
      };

      if (options.json) {
        console.log(JSON.stringify(info, null, 2));
      } else {
        console.log(chalk.blue("📊 MosAIc Stack Information"));
        console.log("─".repeat(40));
        console.log(`Version: ${chalk.green(info.version)}`);
        console.log(`Node.js: ${chalk.green(info.node)}`);
        console.log(`Platform: ${chalk.green(info.platform)} ${info.arch}`);
        console.log(`Working Directory: ${chalk.yellow(info.cwd)}`);
        console.log(`Environment: ${chalk.yellow(info.env.NODE_ENV)}`);
      }
    });

  // Default command
  program.command("*", { hidden: true }).action((cmd) => {
    console.log(chalk.red(`Unknown command: ${cmd}`));
    console.log(chalk.yellow('Run "mosaic --help" for usage information'));
    process.exit(1);
  });

  // Parse command line arguments
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error(chalk.red("Error:"), (error as Error).message);
    process.exit(1);
  }
}

/**
 * Show startup banner
 */
async function showBanner() {
  try {
    const banner = figlet.textSync("MosAIc Stack", {
      font: "Small",
      horizontalLayout: "default",
      verticalLayout: "default",
    });

    console.log(chalk.cyan(banner));
    console.log(
      chalk.gray(`v${pkg.version} - Enterprise AI Development Platform`),
    );
    console.log();
  } catch (error) {
    // Fallback if figlet fails
    console.log(chalk.cyan.bold("🚀 MosAIc Stack"));
    console.log(
      chalk.gray(`v${pkg.version} - Enterprise AI Development Platform`),
    );
    console.log();
  }
}

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  console.error(chalk.red("Uncaught Exception:"), error.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error(chalk.red("Unhandled Rejection:"), reason);
  process.exit(1);
});

// Run main function
if (require.main === module) {
  main().catch((error) => {
    console.error(chalk.red("Fatal Error:"), error.message);
    process.exit(1);
  });
}
