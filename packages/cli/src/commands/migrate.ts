/**
 * MosAIc CLI Migration Command
 * Handles XDG migration and path management
 */

import { Command } from "commander";
import { MosaicPaths } from "@mosaicstack/config";
import { spawn } from "child_process";
import { join } from "path";
import chalk from "chalk";

export function createMigrateCommand(): Command {
  const migrate = new Command("migrate");

  migrate
    .description("Migrate MosAIc configuration to XDG-compliant paths")
    .option("--dry-run", "Show what would be done without making changes")
    .option("--force", "Skip confirmation prompts")
    .option("--status", "Show current migration status")
    .action(async (options) => {
      if (options.status) {
        await showMigrationStatus();
        return;
      }

      if (options.dryRun) {
        await showDryRun();
        return;
      }

      await runMigration(options.force);
    });

  return migrate;
}

async function showMigrationStatus(): Promise<void> {
  console.log(chalk.blue("🔍 MosAIc Migration Status"));
  console.log("========================");

  const status = MosaicPaths.getMigrationStatus();
  const paths = MosaicPaths.getAllPaths();

  console.log(`Status: ${getStatusDisplay(status.status)}`);
  console.log(`Legacy Path: ${status.legacyPath}`);
  console.log(`XDG Path: ${status.xdgPath}`);
  console.log(`Is Symlink: ${status.isSymlink ? "✅" : "❌"}`);
  console.log(
    `Needs Migration: ${status.needsMigration ? "⚠️  Yes" : "✅ No"}`,
  );

  console.log("\n📁 Current Paths:");
  console.log(`  Config: ${paths.config}`);
  console.log(`  Data: ${paths.data}`);
  console.log(`  Cache: ${paths.cache}`);
  console.log(`  Logs: ${paths.logs}`);

  if (status.needsMigration) {
    console.log(chalk.yellow("\n⚠️  Migration recommended"));
    console.log("Run: mosaic migrate");
  } else if (status.isSymlink) {
    console.log(chalk.green("\n✅ Migration completed"));
    console.log("Backward compatibility active via symlink");
  } else {
    console.log(chalk.green("\n✅ Using XDG paths"));
  }
}

async function showDryRun(): Promise<void> {
  console.log(chalk.blue("🧪 Migration Dry Run"));
  console.log("====================");

  const status = MosaicPaths.getMigrationStatus();

  if (!status.needsMigration) {
    console.log(chalk.green("✅ No migration needed"));
    return;
  }

  const paths = MosaicPaths.getAllPaths();

  console.log("Would perform the following actions:");
  console.log(`  1. Create backup of ${status.legacyPath}`);
  console.log(`  2. Create XDG directories:`);
  console.log(`     • ${paths.config}`);
  console.log(`     • ${paths.data}`);
  console.log(`     • ${paths.cache}`);
  console.log(`     • ${paths.logs}`);
  console.log(`  3. Migrate files to appropriate locations`);
  console.log(`  4. Remove ${status.legacyPath}`);
  console.log(`  5. Create symlink: ${status.legacyPath} → ${paths.config}`);

  console.log(chalk.yellow("\n⚠️  This is a dry run - no changes made"));
  console.log("Run without --dry-run to perform migration");
}

async function runMigration(force: boolean): Promise<void> {
  const status = MosaicPaths.getMigrationStatus();

  if (!status.needsMigration) {
    console.log(chalk.green("✅ Migration not needed"));
    return;
  }

  if (!force) {
    console.log(
      chalk.yellow("⚠️  This will migrate your MosAIc configuration"),
    );
    console.log("   A backup will be created before any changes");
    console.log("   Existing scripts will continue working via symlink");

    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question("Continue with migration? (y/N): ", resolve);
    });

    rl.close();

    if (!answer.toLowerCase().startsWith("y")) {
      console.log("Migration cancelled");
      return;
    }
  }

  // Run the migration script
  const scriptPath = join(
    __dirname,
    "../../../../scripts/migration/migrate-to-xdg.sh",
  );

  console.log(chalk.blue("🚀 Starting migration..."));

  const child = spawn("bash", [scriptPath], {
    stdio: "inherit",
    cwd: process.cwd(),
  });

  child.on("close", (code) => {
    if (code === 0) {
      console.log(chalk.green("\n🎉 Migration completed successfully!"));
      console.log("\nNext steps:");
      console.log("  • Test your MosAIc installation");
      console.log("  • Update custom scripts to use XDG paths (optional)");
      console.log("  • The symlink will be removed in 6 months");
    } else {
      console.log(chalk.red("\n❌ Migration failed"));
      console.log("Check the migration log for details");
    }
  });

  child.on("error", (error) => {
    console.error(chalk.red("Failed to run migration script:"), error.message);
  });
}

function getStatusDisplay(status: string): string {
  switch (status) {
    case "not-needed":
      return chalk.gray("Not needed");
    case "completed":
      return chalk.green("✅ Completed");
    case "pending":
      return chalk.yellow("⚠️  Pending");
    case "failed":
      return chalk.red("❌ Failed");
    default:
      return chalk.gray("Unknown");
  }
}
