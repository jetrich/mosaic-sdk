/**
 * MosAIc XDG-Compliant Path Resolution System
 * Provides intelligent path resolution with backward compatibility
 */

import { homedir } from "os";
import { join, resolve } from "path";
import { existsSync, lstatSync } from "fs";

export interface MigrationStatus {
  status: "not-needed" | "completed" | "pending" | "failed";
  legacyPath: string;
  xdgPath: string;
  isSymlink: boolean;
  needsMigration: boolean;
}

export class MosaicPaths {
  private static readonly XDG_CONFIG_HOME =
    process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  private static readonly XDG_DATA_HOME =
    process.env.XDG_DATA_HOME || join(homedir(), ".local", "share");
  private static readonly XDG_CACHE_HOME =
    process.env.XDG_CACHE_HOME || join(homedir(), ".cache");
  private static readonly XDG_STATE_HOME =
    process.env.XDG_STATE_HOME || join(homedir(), ".local", "state");

  private static readonly LEGACY_HOME = join(homedir(), ".mosaic");
  private static readonly NEW_CONFIG_DIR = join(this.XDG_CONFIG_HOME, "mosaic");

  private static _migrationStatus: MigrationStatus | null = null;
  private static _symlinkWarningShown = false;

  /**
   * Get the primary configuration directory
   * Always returns XDG path, but checks for legacy symlink
   */
  static get configDir(): string {
    this.checkMigrationStatus();
    return this.NEW_CONFIG_DIR;
  }

  static get dataDir(): string {
    return join(this.XDG_DATA_HOME, "mosaic");
  }

  static get cacheDir(): string {
    return join(this.XDG_CACHE_HOME, "mosaic");
  }

  static get stateDir(): string {
    return join(this.XDG_STATE_HOME, "mosaic");
  }

  static get logsDir(): string {
    return join(this.stateDir, "logs");
  }

  /**
   * Get legacy path (for backward compatibility)
   */
  static get legacyDir(): string {
    return this.LEGACY_HOME;
  }

  /**
   * Resolve a path, handling both XDG and legacy locations
   */
  static resolvePath(relativePath: string): string {
    const xdgPath = join(this.configDir, relativePath);

    // Always prefer XDG path if it exists
    if (existsSync(xdgPath)) {
      return xdgPath;
    }

    // Check legacy path (through symlink)
    const legacyPath = join(this.LEGACY_HOME, relativePath);
    if (existsSync(legacyPath)) {
      this.showSymlinkWarning();
      return legacyPath;
    }

    // Return XDG path as default (for new files)
    return xdgPath;
  }

  /**
   * Resolve data path (for databases, backups, etc.)
   */
  static resolveDataPath(relativePath: string): string {
    return join(this.dataDir, relativePath);
  }

  /**
   * Resolve cache path (for temporary files)
   */
  static resolveCachePath(relativePath: string): string {
    return join(this.cacheDir, relativePath);
  }

  /**
   * Resolve state path (for logs, runtime state)
   */
  static resolveStatePath(relativePath: string): string {
    return join(this.stateDir, relativePath);
  }

  /**
   * Check migration status and warn if needed
   */
  private static checkMigrationStatus(): void {
    if (this._migrationStatus !== null) return;

    const legacyExists = existsSync(this.LEGACY_HOME);
    const xdgExists = existsSync(this.NEW_CONFIG_DIR);

    let status: MigrationStatus["status"];
    let isSymlink = false;

    if (!legacyExists && !xdgExists) {
      status = "not-needed";
    } else if (legacyExists && xdgExists) {
      // Check if legacy is a symlink
      try {
        const stats = lstatSync(this.LEGACY_HOME);
        if (stats.isSymbolicLink()) {
          isSymlink = true;
          const target = resolve(this.LEGACY_HOME);
          if (target === resolve(this.NEW_CONFIG_DIR)) {
            status = "completed";
          } else {
            status = "failed";
          }
        } else {
          status = "pending";
        }
      } catch {
        status = "failed";
      }
    } else if (legacyExists && !xdgExists) {
      status = "pending";
    } else {
      status = "completed";
    }

    this._migrationStatus = {
      status,
      legacyPath: this.LEGACY_HOME,
      xdgPath: this.NEW_CONFIG_DIR,
      isSymlink,
      needsMigration: status === "pending",
    };
  }

  /**
   * Show deprecation warning for symlink usage
   */
  private static showSymlinkWarning(): void {
    if (
      this._symlinkWarningShown ||
      process.env.MOSAIC_SUPPRESS_SYMLINK_WARNING === "1"
    ) {
      return;
    }

    console.warn(`
⚠️  DEPRECATION WARNING: Using legacy path ~/.mosaic
   
   MosAIc has moved to XDG-compliant paths:
   • Config: ~/.config/mosaic
   • Data: ~/.local/share/mosaic
   • Cache: ~/.cache/mosaic
   • Logs: ~/.local/state/mosaic/logs
   
   The symlink ~/.mosaic will be removed in 6 months.
   Please update your scripts to use the new paths.
   
   Migration guide: https://docs.mosaic.dev/xdg-migration
   Disable this warning: export MOSAIC_SUPPRESS_SYMLINK_WARNING=1
`);

    this._symlinkWarningShown = true;
  }

  /**
   * Get migration status
   */
  static getMigrationStatus(): MigrationStatus {
    this.checkMigrationStatus();
    return this._migrationStatus!;
  }

  /**
   * Check if migration is needed
   */
  static needsMigration(): boolean {
    this.checkMigrationStatus();
    return this._migrationStatus!.needsMigration;
  }

  /**
   * Get all XDG paths
   */
  static getAllPaths(): {
    config: string;
    data: string;
    cache: string;
    state: string;
    logs: string;
    legacy: string;
  } {
    return {
      config: this.configDir,
      data: this.dataDir,
      cache: this.cacheDir,
      state: this.stateDir,
      logs: this.logsDir,
      legacy: this.legacyDir,
    };
  }

  /**
   * Create all necessary directories
   */
  static async ensureDirectories(): Promise<void> {
    const fs = await import("fs/promises");

    const dirs = [
      this.configDir,
      this.dataDir,
      this.cacheDir,
      this.stateDir,
      this.logsDir,
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory might already exist, ignore error
      }
    }
  }

  /**
   * Get environment-specific overrides
   */
  static getEnvironmentPaths(): {
    XDG_CONFIG_HOME: string;
    XDG_DATA_HOME: string;
    XDG_CACHE_HOME: string;
    XDG_STATE_HOME: string;
  } {
    return {
      XDG_CONFIG_HOME: this.XDG_CONFIG_HOME,
      XDG_DATA_HOME: this.XDG_DATA_HOME,
      XDG_CACHE_HOME: this.XDG_CACHE_HOME,
      XDG_STATE_HOME: this.XDG_STATE_HOME,
    };
  }
}
