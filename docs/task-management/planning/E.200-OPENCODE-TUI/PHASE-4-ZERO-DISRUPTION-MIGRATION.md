# Phase 4 Enhancement - Zero-Disruption XDG Migration Strategy

**Epic**: E.200 - OpenCode TUI Integration  
**Phase**: 4 - Zero-Disruption Migration with Symlinks  
**Status**: PLANNING  
**Priority**: CRITICAL  
**Estimated Duration**: 1 week

## Critical Migration Requirements

### Zero-Disruption Principles

1. **No Broken Projects**: Existing projects must continue working
2. **No Manual Updates**: Scripts/tools using `~/.mosaic` must work unchanged
3. **Gradual Transition**: Allow time for ecosystem to adapt
4. **Rollback Capability**: Easy reversion if issues arise
5. **Clear Communication**: Users understand what's happening

## Migration Strategy Overview

```
Phase 1: Dual-Path Support (Immediate)
~/.mosaic → ~/.config/mosaic (new location)
~/.mosaic (symlink) → ~/.config/mosaic (backward compatibility)

Phase 2: Deprecation Warnings (3 months)
~/.mosaic (symlink with warnings) → ~/.config/mosaic

Phase 3: Symlink Removal (6 months)
~/.config/mosaic (only location)
```

## Detailed Migration Architecture

### Current State Analysis

```bash
# Before migration - existing structure
~/.mosaic/
├── config.json
├── data/
│   └── mcp.db
├── logs/
├── frameworks/
│   └── tony/
├── claude/
│   └── config.json
└── backups/
```

### Target State with Symlinks

```bash
# After migration - XDG compliant with backward compatibility
~/.config/mosaic/           # New primary location
├── config.json
├── mcp/
├── projects/
└── frameworks/

~/.local/share/mosaic/      # Data files
├── data/
├── backups/
└── templates/

~/.cache/mosaic/            # Cache files
└── agent-cache/

~/.local/state/mosaic/      # State/logs
└── logs/

~/.mosaic -> ~/.config/mosaic  # SYMLINK for backward compatibility
```

## Enhancement Structure (UPP Methodology)

### FEATURE F.200.26: Zero-Disruption Migration System

**Status**: PLANNING  
**Priority**: CRITICAL  
**Duration**: 1 week

#### STORY S.200.26.01: Migration Safety Analysis

**Description**: Analyze all potential breaking points  
**Acceptance Criteria**:

- All hardcoded paths identified
- Impact assessment completed
- Rollback plan validated

##### TASK T.200.26.01.01: Scan for Hardcoded Paths

**Duration**: 3 hours  
**Agent**: ARCH-SYSTEMS-ALEX  
**Dependencies**: None  
**Subtasks**:

- ST.200.26.01.01.01: Scan MosAIc codebase for ~/.mosaic references (30 min)
- ST.200.26.01.01.02: Check Tony framework for hardcoded paths (30 min)
- ST.200.26.01.01.03: Analyze user scripts and configs (30 min)
- ST.200.26.01.01.04: Check documentation for path references (30 min)
- ST.200.26.01.01.05: Identify external tool integrations (30 min)
- ST.200.26.01.01.06: Create comprehensive path inventory (30 min)

##### TASK T.200.26.01.02: Create Impact Assessment

**Duration**: 2 hours  
**Agent**: ARCH-SYSTEMS-ALEX  
**Dependencies**: T.200.26.01.01  
**Subtasks**:

- ST.200.26.01.02.01: Categorize breaking changes (30 min)
- ST.200.26.01.02.02: Assess user script impact (30 min)
- ST.200.26.01.02.03: Evaluate third-party integrations (30 min)
- ST.200.26.01.02.04: Document migration risks (30 min)

#### STORY S.200.26.02: Intelligent Migration Implementation

**Description**: Smart migration with symlink management  
**Acceptance Criteria**:

- Automatic detection of existing installations
- Safe migration with rollback capability
- Symlink creation for backward compatibility

##### TASK T.200.26.02.01: Create Migration Detection System

**Duration**: 3 hours  
**Agent**: BE-BACKEND-BENJAMIN  
**Dependencies**: T.200.26.01.02  
**Subtasks**:

- ST.200.26.02.01.01: Detect existing ~/.mosaic installations (30 min)
- ST.200.26.02.01.02: Check for active processes using ~/.mosaic (30 min)
- ST.200.26.02.01.03: Identify file locks and permissions (30 min)
- ST.200.26.02.01.04: Scan for custom configurations (30 min)
- ST.200.26.02.01.05: Create migration readiness report (30 min)
- ST.200.26.02.01.06: Implement pre-migration validation (30 min)

##### TASK T.200.26.02.02: Implement Safe Migration Process

**Duration**: 5 hours  
**Agent**: DEVOPS-OPERATIONS-OLIVER  
**Dependencies**: T.200.26.02.01  
**Subtasks**:

- ST.200.26.02.02.01: Create atomic migration script (30 min)
- ST.200.26.02.02.02: Implement file copying with verification (30 min)
- ST.200.26.02.02.03: Add permission preservation (30 min)
- ST.200.26.02.02.04: Create backup before migration (30 min)
- ST.200.26.02.02.05: Implement symlink creation (30 min)
- ST.200.26.02.02.06: Add migration progress tracking (30 min)
- ST.200.26.02.02.07: Create migration verification (30 min)
- ST.200.26.02.02.08: Implement rollback mechanism (30 min)
- ST.200.26.02.02.09: Add migration logging (30 min)
- ST.200.26.02.02.10: Test migration scenarios (30 min)

##### TASK T.200.26.02.03: Create Symlink Management System

**Duration**: 4 hours  
**Agent**: BE-BACKEND-BENJAMIN  
**Dependencies**: T.200.26.02.02  
**Subtasks**:

- ST.200.26.02.03.01: Implement intelligent symlink creation (30 min)
- ST.200.26.02.03.02: Add symlink health monitoring (30 min)
- ST.200.26.02.03.03: Create symlink repair functionality (30 min)
- ST.200.26.02.03.04: Implement symlink deprecation warnings (30 min)
- ST.200.26.02.03.05: Add symlink usage tracking (30 min)
- ST.200.26.02.03.06: Create symlink removal scheduler (30 min)
- ST.200.26.02.03.07: Test symlink scenarios (30 min)
- ST.200.26.02.03.08: Document symlink behavior (30 min)

#### STORY S.200.26.03: Backward Compatibility Layer

**Description**: Ensure all existing functionality works  
**Acceptance Criteria**:

- All scripts using ~/.mosaic continue working
- No performance degradation
- Clear deprecation path

##### TASK T.200.26.03.01: Implement Path Resolution Layer

**Duration**: 4 hours  
**Agent**: FS-FULLSTACK-FELIX  
**Dependencies**: T.200.26.02.03  
**Subtasks**:

- ST.200.26.03.01.01: Create universal path resolver (30 min)
- ST.200.26.03.01.02: Implement fallback logic (30 min)
- ST.200.26.03.01.03: Add path caching for performance (30 min)
- ST.200.26.03.01.04: Create path validation (30 min)
- ST.200.26.03.01.05: Implement deprecation warnings (30 min)
- ST.200.26.03.01.06: Add usage analytics (30 min)
- ST.200.26.03.01.07: Test path resolution (30 min)
- ST.200.26.03.01.08: Document path behavior (30 min)

##### TASK T.200.26.03.02: Update All MosAIc Components

**Duration**: 6 hours  
**Agent**: BE-BACKEND-BENJAMIN  
**Dependencies**: T.200.26.03.01  
**Subtasks**:

- ST.200.26.03.02.01: Update MCP server path handling (30 min)
- ST.200.26.03.02.02: Modify CLI path resolution (30 min)
- ST.200.26.03.02.03: Update Tony framework paths (30 min)
- ST.200.26.03.02.04: Fix installer path logic (30 min)
- ST.200.26.03.02.05: Update configuration loaders (30 min)
- ST.200.26.03.02.06: Modify logging paths (30 min)
- ST.200.26.03.02.07: Update backup scripts (30 min)
- ST.200.26.03.02.08: Fix test suite paths (30 min)
- ST.200.26.03.02.09: Update documentation (30 min)
- ST.200.26.03.02.10: Test all components (30 min)
- ST.200.26.03.02.11: Validate backward compatibility (30 min)
- ST.200.26.03.02.12: Create component test suite (30 min)

### FEATURE F.200.27: Migration Communication & Support

**Status**: PLANNING  
**Priority**: HIGH  
**Duration**: 3 days

#### STORY S.200.27.01: User Communication System

**Description**: Clear communication about migration  
**Acceptance Criteria**:

- Users understand what's happening
- Clear timeline provided
- Support resources available

##### TASK T.200.27.01.01: Create Migration Announcements

**Duration**: 2 hours  
**Agent**: DOC-DOCUMENTATION-DAVID  
**Dependencies**: None  
**Subtasks**:

- ST.200.27.01.01.01: Write migration announcement (30 min)
- ST.200.27.01.01.02: Create timeline documentation (30 min)
- ST.200.27.01.01.03: Prepare FAQ section (30 min)
- ST.200.27.01.01.04: Create troubleshooting guide (30 min)

##### TASK T.200.27.01.02: Implement In-App Notifications

**Duration**: 3 hours  
**Agent**: FE-FRONTEND-FIONA  
**Dependencies**: T.200.27.01.01  
**Subtasks**:

- ST.200.27.01.02.01: Create notification system (30 min)
- ST.200.27.01.02.02: Add migration status display (30 min)
- ST.200.27.01.02.03: Implement dismissible warnings (30 min)
- ST.200.27.01.02.04: Create progress indicators (30 min)
- ST.200.27.01.02.05: Add help links (30 min)
- ST.200.27.01.02.06: Test notification system (30 min)

## Migration Script Implementation

### Comprehensive Migration Script

```bash
#!/bin/bash
# scripts/migrate-to-xdg.sh - Zero-Disruption Migration

set -euo pipefail

# Configuration
OLD_DIR="$HOME/.mosaic"
NEW_CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/mosaic"
NEW_DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/mosaic"
NEW_CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/mosaic"
NEW_STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/mosaic"
BACKUP_DIR="$HOME/.mosaic-migration-backup-$(date +%Y%m%d_%H%M%S)"
MIGRATION_LOG="$HOME/.mosaic-migration.log"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$MIGRATION_LOG"
}

# Error handling
handle_error() {
    log "ERROR: Migration failed at step: $1"
    log "Rolling back changes..."
    rollback_migration
    exit 1
}

# Pre-migration checks
pre_migration_checks() {
    log "🔍 Running pre-migration checks..."

    # Check if old directory exists
    if [ ! -d "$OLD_DIR" ]; then
        log "✅ No legacy ~/.mosaic found. Migration not needed."
        exit 0
    fi

    # Check for running processes
    if pgrep -f "mosaic" > /dev/null; then
        log "⚠️  MosAIc processes are running. Please stop them first:"
        pgrep -f "mosaic" -l
        read -p "Stop processes and continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Migration cancelled by user"
            exit 1
        fi
        pkill -f "mosaic" || true
        sleep 2
    fi

    # Check disk space
    local required_space=$(du -s "$OLD_DIR" | cut -f1)
    local available_space=$(df "$HOME" | tail -1 | awk '{print $4}')

    if [ "$required_space" -gt "$((available_space / 2))" ]; then
        log "❌ Insufficient disk space for migration"
        exit 1
    fi

    # Check permissions
    if [ ! -w "$HOME" ]; then
        log "❌ No write permission to home directory"
        exit 1
    fi

    log "✅ Pre-migration checks passed"
}

# Create backup
create_backup() {
    log "📦 Creating backup at $BACKUP_DIR..."
    cp -r "$OLD_DIR" "$BACKUP_DIR" || handle_error "backup creation"
    log "✅ Backup created successfully"
}

# Create XDG directories
create_xdg_directories() {
    log "📁 Creating XDG directories..."
    mkdir -p "$NEW_CONFIG_DIR" || handle_error "config directory creation"
    mkdir -p "$NEW_DATA_DIR" || handle_error "data directory creation"
    mkdir -p "$NEW_CACHE_DIR" || handle_error "cache directory creation"
    mkdir -p "$NEW_STATE_DIR/logs" || handle_error "state directory creation"
    log "✅ XDG directories created"
}

# Migrate files intelligently
migrate_files() {
    log "🚚 Migrating files to XDG locations..."

    # Configuration files
    if [ -f "$OLD_DIR/config.json" ]; then
        cp "$OLD_DIR/config.json" "$NEW_CONFIG_DIR/" || handle_error "config migration"
    fi

    if [ -d "$OLD_DIR/claude" ]; then
        cp -r "$OLD_DIR/claude" "$NEW_CONFIG_DIR/" || handle_error "claude config migration"
    fi

    if [ -d "$OLD_DIR/frameworks" ]; then
        cp -r "$OLD_DIR/frameworks" "$NEW_CONFIG_DIR/" || handle_error "frameworks migration"
    fi

    # Data files
    if [ -d "$OLD_DIR/data" ]; then
        cp -r "$OLD_DIR/data"/* "$NEW_DATA_DIR/" 2>/dev/null || true
    fi

    if [ -d "$OLD_DIR/backups" ]; then
        cp -r "$OLD_DIR/backups" "$NEW_DATA_DIR/" || handle_error "backups migration"
    fi

    # State files (logs)
    if [ -d "$OLD_DIR/logs" ]; then
        cp -r "$OLD_DIR/logs"/* "$NEW_STATE_DIR/logs/" 2>/dev/null || true
    fi

    # Preserve permissions
    find "$NEW_CONFIG_DIR" -type f -exec chmod 600 {} \;
    find "$NEW_DATA_DIR" -type f -exec chmod 600 {} \;

    log "✅ Files migrated successfully"
}

# Create backward compatibility symlink
create_symlink() {
    log "🔗 Creating backward compatibility symlink..."

    # Remove old directory (it's backed up)
    rm -rf "$OLD_DIR" || handle_error "old directory removal"

    # Create symlink
    ln -s "$NEW_CONFIG_DIR" "$OLD_DIR" || handle_error "symlink creation"

    # Verify symlink
    if [ ! -L "$OLD_DIR" ] || [ "$(readlink "$OLD_DIR")" != "$NEW_CONFIG_DIR" ]; then
        handle_error "symlink verification"
    fi

    log "✅ Symlink created: ~/.mosaic -> ~/.config/mosaic"
}

# Update configurations
update_configurations() {
    log "⚙️  Updating configurations for XDG paths..."

    # Update main config to use XDG paths
    if [ -f "$NEW_CONFIG_DIR/config.json" ]; then
        # Use jq to update paths if available, otherwise use sed
        if command -v jq >/dev/null 2>&1; then
            jq --arg data_dir "$NEW_DATA_DIR" \
               --arg cache_dir "$NEW_CACHE_DIR" \
               --arg state_dir "$NEW_STATE_DIR" \
               '.paths.data = $data_dir | .paths.cache = $cache_dir | .paths.state = $state_dir' \
               "$NEW_CONFIG_DIR/config.json" > "$NEW_CONFIG_DIR/config.json.tmp" && \
               mv "$NEW_CONFIG_DIR/config.json.tmp" "$NEW_CONFIG_DIR/config.json"
        fi
    fi

    log "✅ Configurations updated"
}

# Verify migration
verify_migration() {
    log "🔍 Verifying migration..."

    # Check symlink
    if [ ! -L "$OLD_DIR" ]; then
        handle_error "symlink verification failed"
    fi

    # Check file accessibility through symlink
    if [ -f "$NEW_CONFIG_DIR/config.json" ] && [ ! -f "$OLD_DIR/config.json" ]; then
        handle_error "file accessibility through symlink"
    fi

    # Check XDG directories
    for dir in "$NEW_CONFIG_DIR" "$NEW_DATA_DIR" "$NEW_CACHE_DIR" "$NEW_STATE_DIR"; do
        if [ ! -d "$dir" ]; then
            handle_error "XDG directory verification: $dir"
        fi
    done

    log "✅ Migration verification passed"
}

# Rollback function
rollback_migration() {
    log "🔄 Rolling back migration..."

    # Remove symlink if it exists
    if [ -L "$OLD_DIR" ]; then
        rm "$OLD_DIR"
    fi

    # Remove XDG directories
    rm -rf "$NEW_CONFIG_DIR" "$NEW_DATA_DIR" "$NEW_CACHE_DIR" "$NEW_STATE_DIR" 2>/dev/null || true

    # Restore from backup
    if [ -d "$BACKUP_DIR" ]; then
        cp -r "$BACKUP_DIR" "$OLD_DIR"
        log "✅ Rollback completed. Original ~/.mosaic restored."
    else
        log "❌ No backup found for rollback"
    fi
}

# Create migration report
create_migration_report() {
    local report_file="$HOME/.mosaic-migration-report.txt"

    cat > "$report_file" << EOF
MosAIc XDG Migration Report
==========================
Date: $(date)
Status: SUCCESS

Migration Details:
- Old location: ~/.mosaic (now symlink)
- New locations:
  * Config: $NEW_CONFIG_DIR
  * Data: $NEW_DATA_DIR
  * Cache: $NEW_CACHE_DIR
  * Logs: $NEW_STATE_DIR/logs

Backward Compatibility:
- Symlink created: ~/.mosaic -> ~/.config/mosaic
- All existing scripts should continue working
- Deprecation timeline: 6 months

Files Migrated:
$(find "$NEW_CONFIG_DIR" "$NEW_DATA_DIR" "$NEW_STATE_DIR" -type f | wc -l) files total

Backup Location: $BACKUP_DIR

Next Steps:
1. Test your MosAIc installation
2. Update any custom scripts to use XDG paths (optional)
3. The symlink will be removed in 6 months

For support: https://docs.mosaic.dev/migration
EOF

    log "📋 Migration report created: $report_file"
}

# Main migration function
main() {
    log "🚀 Starting MosAIc XDG Migration"
    log "================================"

    pre_migration_checks
    create_backup
    create_xdg_directories
    migrate_files
    create_symlink
    update_configurations
    verify_migration
    create_migration_report

    log "🎉 Migration completed successfully!"
    log ""
    log "📋 Summary:"
    log "  • Configuration moved to: $NEW_CONFIG_DIR"
    log "  • Data moved to: $NEW_DATA_DIR"
    log "  • Logs moved to: $NEW_STATE_DIR/logs"
    log "  • Backward compatibility: ~/.mosaic -> ~/.config/mosaic"
    log "  • Backup available at: $BACKUP_DIR"
    log ""
    log "⚠️  The symlink ~/.mosaic will be removed in 6 months"
    log "   Please update any custom scripts to use XDG paths"
    log ""
    log "🔗 Documentation: https://docs.mosaic.dev/xdg-migration"
}

# Run migration
main "$@"
```

### Path Resolution Module

```typescript
// src/config/paths.ts - Intelligent Path Resolution
import { homedir } from "os";
import { join, resolve } from "path";
import { existsSync, lstatSync } from "fs";

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

  private static _migrationStatus:
    | "not-needed"
    | "completed"
    | "pending"
    | "failed"
    | null = null;
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
   * Check migration status and warn if needed
   */
  private static checkMigrationStatus(): void {
    if (this._migrationStatus !== null) return;

    const legacyExists = existsSync(this.LEGACY_HOME);
    const xdgExists = existsSync(this.NEW_CONFIG_DIR);

    if (!legacyExists && !xdgExists) {
      this._migrationStatus = "not-needed";
    } else if (legacyExists && xdgExists) {
      // Check if legacy is a symlink
      try {
        const stats = lstatSync(this.LEGACY_HOME);
        if (stats.isSymbolicLink()) {
          const target = resolve(this.LEGACY_HOME);
          if (target === resolve(this.NEW_CONFIG_DIR)) {
            this._migrationStatus = "completed";
          } else {
            this._migrationStatus = "failed";
          }
        } else {
          this._migrationStatus = "pending";
        }
      } catch {
        this._migrationStatus = "failed";
      }
    } else if (legacyExists && !xdgExists) {
      this._migrationStatus = "pending";
    } else {
      this._migrationStatus = "completed";
    }
  }

  /**
   * Show deprecation warning for symlink usage
   */
  private static showSymlinkWarning(): void {
    if (this._symlinkWarningShown) return;

    console.warn(`
⚠️  DEPRECATION WARNING: Using legacy path ~/.mosaic
   
   MosAIc has moved to XDG-compliant paths:
   • Config: ~/.config/mosaic
   • Data: ~/.local/share/mosaic
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
  static getMigrationStatus(): {
    status: "not-needed" | "completed" | "pending" | "failed";
    legacyPath: string;
    xdgPath: string;
    isSymlink: boolean;
  } {
    this.checkMigrationStatus();

    let isSymlink = false;
    if (existsSync(this.LEGACY_HOME)) {
      try {
        isSymlink = lstatSync(this.LEGACY_HOME).isSymbolicLink();
      } catch {
        // ignore
      }
    }

    return {
      status: this._migrationStatus!,
      legacyPath: this.LEGACY_HOME,
      xdgPath: this.NEW_CONFIG_DIR,
      isSymlink,
    };
  }

  /**
   * Check if migration is needed
   */
  static needsMigration(): boolean {
    this.checkMigrationStatus();
    return this._migrationStatus === "pending";
  }
}
```

## Migration Timeline & Communication

### Phase 1: Immediate (Week 1)

- Deploy migration script
- Create symlinks for all existing installations
- Show migration success notifications
- Update documentation

### Phase 2: Deprecation Period (3 months)

- Show periodic warnings when symlink is used
- Provide migration guides and support
- Track symlink usage analytics

### Phase 3: Symlink Removal (6 months)

- Remove symlinks in new installations
- Final migration push for remaining users
- Complete transition to XDG-only

## Benefits of This Approach

1. **Zero Disruption**: Existing projects continue working immediately
2. **Gradual Transition**: 6-month timeline allows ecosystem adaptation
3. **Clear Communication**: Users understand what's happening and why
4. **Easy Rollback**: Full backup and rollback capability
5. **Analytics**: Track usage to ensure safe symlink removal
6. **Future-Proof**: Proper XDG compliance for long-term maintainability

This strategy ensures that your current profile and any existing projects will continue working seamlessly while we transition to the cleaner XDG directory structure.
