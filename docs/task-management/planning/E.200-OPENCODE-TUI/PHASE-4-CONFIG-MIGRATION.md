# Phase 4 Enhancement - Configuration Directory Migration

**Epic**: E.200 - OpenCode TUI Integration  
**Phase**: 4 - Configuration Standards Compliance  
**Status**: PLANNING  
**Priority**: HIGH  
**Estimated Duration**: 1 week

## Overview

Migrate MosAIc configuration from `~/.mosaic` to `~/.config/mosaic` to follow XDG Base Directory specification and modern best practices. This aligns with tools like OpenCode (`~/.config/opencode`), Claude (`~/.config/claude`), and other modern CLI applications.

## Directory Structure Migration

### Current Structure (Deprecated)

```
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

### New Structure (XDG Compliant)

```
~/.config/mosaic/
├── config.json                 # Main configuration
├── mcp/
│   ├── server.json            # MCP server config
│   └── client.json            # MCP client config
├── projects/                   # Project-specific configs
│   ├── default.json
│   └── {project-name}.json
└── frameworks/
    └── tony/                   # Tony framework config

~/.local/share/mosaic/          # Data files (XDG_DATA_HOME)
├── data/
│   ├── mcp.db                 # Database
│   └── projects.db            # Project registry
├── backups/
└── templates/

~/.cache/mosaic/                # Cache files (XDG_CACHE_HOME)
├── agent-cache/
├── tool-cache/
└── project-cache/

~/.local/state/mosaic/          # State files (XDG_STATE_HOME)
└── logs/                       # Log files
    ├── mcp-server.log
    └── agent-tasks/
```

## Enhancement Structure (UPP Methodology)

### FEATURE F.200.20: XDG Configuration Migration

**Status**: PLANNING  
**Priority**: HIGH  
**Duration**: 1 week

#### STORY S.200.20.01: Migration Planning

**Description**: Plan and prepare for configuration migration  
**Acceptance Criteria**:

- Zero data loss during migration
- Backward compatibility during transition
- Clear user communication

##### TASK T.200.20.01.01: Create Migration Strategy

**Duration**: 2 hours  
**Agent**: ARCH-SYSTEMS-ALEX  
**Dependencies**: None  
**Subtasks**:

- ST.200.20.01.01.01: Document current file locations (30 min)
- ST.200.20.01.01.02: Map to XDG directories (30 min)
- ST.200.20.01.01.03: Design migration phases (30 min)
- ST.200.20.01.01.04: Create rollback plan (30 min)

##### TASK T.200.20.01.02: Implement Migration Detection

**Duration**: 3 hours  
**Agent**: BE-BACKEND-BENJAMIN  
**Dependencies**: T.200.20.01.01  
**Subtasks**:

- ST.200.20.01.02.01: Create directory scanner (30 min)
- ST.200.20.01.02.02: Implement version detection (30 min)
- ST.200.20.01.02.03: Add migration status tracking (30 min)
- ST.200.20.01.02.04: Create pre-migration backup (30 min)
- ST.200.20.01.02.05: Implement validation checks (30 min)
- ST.200.20.01.02.06: Test detection logic (30 min)

#### STORY S.200.20.02: Migration Implementation

**Description**: Execute the configuration migration  
**Acceptance Criteria**:

- Automatic migration on first run
- Progress indication
- Error recovery

##### TASK T.200.20.02.01: Create Migration Tool

**Duration**: 4 hours  
**Agent**: DEVOPS-OPERATIONS-OLIVER  
**Dependencies**: T.200.20.01.02  
**Subtasks**:

- ST.200.20.02.01.01: Create migration script (30 min)
- ST.200.20.02.01.02: Implement file copying logic (30 min)
- ST.200.20.02.01.03: Add permission preservation (30 min)
- ST.200.20.02.01.04: Create symlink support (30 min)
- ST.200.20.02.01.05: Implement progress reporting (30 min)
- ST.200.20.02.01.06: Add dry-run mode (30 min)
- ST.200.20.02.01.07: Create migration logs (30 min)
- ST.200.20.02.01.08: Test migration scenarios (30 min)

##### TASK T.200.20.02.02: Update Path Resolution

**Duration**: 5 hours  
**Agent**: BE-BACKEND-BENJAMIN  
**Dependencies**: T.200.20.02.01  
**Subtasks**:

- ST.200.20.02.02.01: Update config loader paths (30 min)
- ST.200.20.02.02.02: Modify data directory paths (30 min)
- ST.200.20.02.02.03: Update log file locations (30 min)
- ST.200.20.02.02.04: Fix cache directory paths (30 min)
- ST.200.20.02.02.05: Update framework paths (30 min)
- ST.200.20.02.02.06: Add XDG environment support (30 min)
- ST.200.20.02.02.07: Implement path fallbacks (30 min)
- ST.200.20.02.02.08: Update all hardcoded paths (30 min)
- ST.200.20.02.02.09: Test path resolution (30 min)
- ST.200.20.02.02.10: Update documentation (30 min)

#### STORY S.200.20.03: Backward Compatibility

**Description**: Ensure smooth transition period  
**Acceptance Criteria**:

- Old paths work during transition
- Clear deprecation warnings
- Configurable transition period

##### TASK T.200.20.03.01: Implement Compatibility Layer

**Duration**: 3 hours  
**Agent**: FS-FULLSTACK-FELIX  
**Dependencies**: T.200.20.02.02  
**Subtasks**:

- ST.200.20.03.01.01: Create path compatibility checker (30 min)
- ST.200.20.03.01.02: Implement fallback logic (30 min)
- ST.200.20.03.01.03: Add deprecation warnings (30 min)
- ST.200.20.03.01.04: Create migration prompts (30 min)
- ST.200.20.03.01.05: Implement grace period (30 min)
- ST.200.20.03.01.06: Test compatibility scenarios (30 min)

##### TASK T.200.20.03.02: Create User Communication

**Duration**: 2 hours  
**Agent**: DOC-DOCUMENTATION-DAVID  
**Dependencies**: T.200.20.03.01  
**Subtasks**:

- ST.200.20.03.02.01: Write migration announcement (30 min)
- ST.200.20.03.02.02: Create migration guide (30 min)
- ST.200.20.03.02.03: Document new paths (30 min)
- ST.200.20.03.02.04: Add FAQ section (30 min)

### FEATURE F.200.21: Integration Updates

**Status**: PLANNING  
**Priority**: HIGH  
**Duration**: 3 days

#### STORY S.200.21.01: Update All Components

**Description**: Update all components to use new paths  
**Acceptance Criteria**:

- All components use XDG paths
- No hardcoded ~/.mosaic references
- Environment variable support

##### TASK T.200.21.01.01: Update MCP Server

**Duration**: 3 hours  
**Agent**: BE-BACKEND-BENJAMIN  
**Dependencies**: F.200.20 completion  
**Subtasks**:

- ST.200.21.01.01.01: Update server config paths (30 min)
- ST.200.21.01.01.02: Modify database locations (30 min)
- ST.200.21.01.01.03: Update log file paths (30 min)
- ST.200.21.01.01.04: Fix state management paths (30 min)
- ST.200.21.01.01.05: Test server with new paths (30 min)
- ST.200.21.01.01.06: Update server documentation (30 min)

##### TASK T.200.21.01.02: Update Client Libraries

**Duration**: 3 hours  
**Agent**: FE-FRONTEND-FIONA  
**Dependencies**: T.200.21.01.01  
**Subtasks**:

- ST.200.21.01.02.01: Update OpenCode integration (30 min)
- ST.200.21.01.02.02: Modify client config paths (30 min)
- ST.200.21.01.02.03: Update cache locations (30 min)
- ST.200.21.01.02.04: Fix credential storage (30 min)
- ST.200.21.01.02.05: Test client connections (30 min)
- ST.200.21.01.02.06: Update client docs (30 min)

##### TASK T.200.21.01.03: Update Scripts and Tools

**Duration**: 4 hours  
**Agent**: DEVOPS-OPERATIONS-OLIVER  
**Dependencies**: T.200.21.01.02  
**Subtasks**:

- ST.200.21.01.03.01: Update setup scripts (30 min)
- ST.200.21.01.03.02: Modify deployment scripts (30 min)
- ST.200.21.01.03.03: Fix backup scripts (30 min)
- ST.200.21.01.03.04: Update test scripts (30 min)
- ST.200.21.01.03.05: Modify CI/CD pipelines (30 min)
- ST.200.21.01.03.06: Update Docker configs (30 min)
- ST.200.21.01.03.07: Fix utility scripts (30 min)
- ST.200.21.01.03.08: Test all scripts (30 min)

#### STORY S.200.21.02: Update Documentation

**Description**: Update all documentation for new paths  
**Acceptance Criteria**:

- All docs use new paths
- Migration guide prominent
- Examples updated

##### TASK T.200.21.02.01: Update User Documentation

**Duration**: 3 hours  
**Agent**: DOC-DOCUMENTATION-DAVID  
**Dependencies**: F.200.21 completion  
**Subtasks**:

- ST.200.21.02.01.01: Update installation guide (30 min)
- ST.200.21.02.01.02: Modify configuration docs (30 min)
- ST.200.21.02.01.03: Update troubleshooting (30 min)
- ST.200.21.02.01.04: Fix code examples (30 min)
- ST.200.21.02.01.05: Update API docs (30 min)
- ST.200.21.02.01.06: Review all docs (30 min)

### FEATURE F.200.22: Testing and Validation

**Status**: PLANNING  
**Priority**: HIGH  
**Duration**: 2 days

#### STORY S.200.22.01: Migration Testing

**Description**: Comprehensive testing of migration  
**Acceptance Criteria**:

- All migration scenarios tested
- No data loss verified
- Performance validated

##### TASK T.200.22.01.01: Create Migration Test Suite

**Duration**: 4 hours  
**Agent**: TEST-AUTOMATION-TARA  
**Dependencies**: F.200.20 completion  
**Subtasks**:

- ST.200.22.01.01.01: Create test scenarios (30 min)
- ST.200.22.01.01.02: Test fresh installations (30 min)
- ST.200.22.01.01.03: Test existing installations (30 min)
- ST.200.22.01.01.04: Test partial migrations (30 min)
- ST.200.22.01.01.05: Test rollback scenarios (30 min)
- ST.200.22.01.01.06: Test permission handling (30 min)
- ST.200.22.01.01.07: Test error recovery (30 min)
- ST.200.22.01.01.08: Document test results (30 min)

##### TASK T.200.22.01.02: User Acceptance Testing

**Duration**: 2 hours  
**Agent**: QA-QUALITY-QUINN  
**Dependencies**: T.200.22.01.01  
**Subtasks**:

- ST.200.22.01.02.01: Create UAT plan (30 min)
- ST.200.22.01.02.02: Test with beta users (30 min)
- ST.200.22.01.02.03: Gather feedback (30 min)
- ST.200.22.01.02.04: Document issues (30 min)

## Implementation Code Examples

### Path Resolution Module

```typescript
// src/config/paths.ts
import { homedir } from "os";
import { join } from "path";

export class MosaicPaths {
  private static readonly XDG_CONFIG_HOME =
    process.env.XDG_CONFIG_HOME || join(homedir(), ".config");
  private static readonly XDG_DATA_HOME =
    process.env.XDG_DATA_HOME || join(homedir(), ".local", "share");
  private static readonly XDG_CACHE_HOME =
    process.env.XDG_CACHE_HOME || join(homedir(), ".cache");
  private static readonly XDG_STATE_HOME =
    process.env.XDG_STATE_HOME || join(homedir(), ".local", "state");

  // Legacy path for backward compatibility
  private static readonly LEGACY_HOME = join(homedir(), ".mosaic");

  static get configDir(): string {
    return join(this.XDG_CONFIG_HOME, "mosaic");
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

  // Backward compatibility check
  static async checkLegacyPaths(): Promise<boolean> {
    return fs.existsSync(this.LEGACY_HOME);
  }
}
```

### Migration Script

```bash
#!/bin/bash
# scripts/migrate-config.sh

echo "🔄 MosAIc Configuration Migration"
echo "================================"

# Define paths
OLD_DIR="$HOME/.mosaic"
NEW_CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/mosaic"
NEW_DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/mosaic"
NEW_CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/mosaic"
NEW_STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/mosaic"

# Check if migration needed
if [ ! -d "$OLD_DIR" ]; then
  echo "✅ No legacy configuration found. Using XDG paths."
  exit 0
fi

# Create backup
echo "📦 Creating backup..."
cp -r "$OLD_DIR" "$OLD_DIR.backup.$(date +%Y%m%d_%H%M%S)"

# Create new directories
echo "📁 Creating XDG directories..."
mkdir -p "$NEW_CONFIG_DIR" "$NEW_DATA_DIR" "$NEW_CACHE_DIR" "$NEW_STATE_DIR/logs"

# Migrate files
echo "🚚 Migrating configuration files..."
[ -f "$OLD_DIR/config.json" ] && cp "$OLD_DIR/config.json" "$NEW_CONFIG_DIR/"
[ -d "$OLD_DIR/claude" ] && cp -r "$OLD_DIR/claude" "$NEW_CONFIG_DIR/"
[ -d "$OLD_DIR/frameworks" ] && cp -r "$OLD_DIR/frameworks" "$NEW_CONFIG_DIR/"

echo "🚚 Migrating data files..."
[ -d "$OLD_DIR/data" ] && cp -r "$OLD_DIR/data" "$NEW_DATA_DIR/"
[ -d "$OLD_DIR/backups" ] && cp -r "$OLD_DIR/backups" "$NEW_DATA_DIR/"

echo "🚚 Migrating logs..."
[ -d "$OLD_DIR/logs" ] && cp -r "$OLD_DIR/logs" "$NEW_STATE_DIR/"

echo "✅ Migration complete!"
echo ""
echo "📋 New locations:"
echo "  Config: $NEW_CONFIG_DIR"
echo "  Data:   $NEW_DATA_DIR"
echo "  Cache:  $NEW_CACHE_DIR"
echo "  Logs:   $NEW_STATE_DIR/logs"
echo ""
echo "⚠️  Old directory preserved at: $OLD_DIR"
echo "   Remove with: rm -rf $OLD_DIR"
```

## Benefits of XDG Compliance

1. **Clean Home Directory**: No more hidden directories cluttering `~`
2. **Standard Locations**: Users know where to find configs
3. **Backup Friendly**: Easy to backup all configs from `~/.config`
4. **Environment Control**: XDG environment variables for customization
5. **Tool Consistency**: Aligns with modern CLI tools
6. **Better Organization**: Separation of config, data, cache, and state

## Migration Timeline

### Week 1: Implementation

- Days 1-2: Core migration implementation
- Days 3-4: Component updates
- Day 5: Testing and validation

### Week 2: Rollout

- Soft launch with backward compatibility
- Monitor for issues
- Gather user feedback

### Week 3: Completion

- Remove legacy path support
- Final documentation updates
- Close migration epic

## Summary

This migration brings MosAIc in line with modern configuration standards, making it more professional and user-friendly. The XDG Base Directory specification is widely adopted and provides clear benefits for both users and developers.
