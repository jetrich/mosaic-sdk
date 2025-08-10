# XDG Migration: Implementation Guide

## Quick Start for Developers

This guide provides step-by-step instructions for implementing the XDG Base Directory migration in the MosAIc SDK.

## Prerequisites

1. Understand XDG Base Directory Specification
2. Review existing `packages/config/src/paths.ts` implementation
3. Read migration plan documents in `docs/migration/`

## Implementation Steps

### Step 1: Update TypeScript/JavaScript Files

#### For MCP Orchestrator
```typescript
// packages/mcp-orchestrator/src/config/ConfigLoader.ts

// Add import at the top
import { MosaicPaths } from '@mosaic/config';

// Replace hardcoded paths
// OLD:
// const defaultConfig = {
//   storage: {
//     connection_string: '~/.mosaic/data/mcp.db',
//   },
//   logging: {
//     file: '~/.mosaic/logs/mcp.log',
//   }
// };

// NEW:
const defaultConfig = {
  storage: {
    connection_string: MosaicPaths.resolveDataPath('mcp.db'),
  },
  logging: {
    file: MosaicPaths.resolveStatePath('logs/mcp.log'),
  }
};

// Update path resolution
// OLD:
// private resolvePath(inputPath: string): string {
//   return inputPath.replace('~', os.homedir());
// }

// NEW:
private resolvePath(inputPath: string): string {
  // Handle ~ for backward compatibility
  if (inputPath.startsWith('~/')) {
    return path.join(os.homedir(), inputPath.slice(2));
  }
  // Use MosaicPaths for mosaic-specific paths
  if (inputPath.includes('.mosaic') || inputPath.includes('mosaic')) {
    console.warn('Legacy path detected:', inputPath);
    // Let MosaicPaths handle the resolution
    return MosaicPaths.resolvePath(path.basename(inputPath));
  }
  return inputPath;
}
```

#### For CLI Package
```typescript
// packages/cli/src/commands/InitCommand.ts

import { MosaicPaths } from '@mosaic/config';

// Update initialization
// OLD:
// const configPath = path.join(os.homedir(), '.mosaic', 'config.json');

// NEW:
const configPath = MosaicPaths.resolvePath('config.json');

// Ensure directories exist
await MosaicPaths.ensureDirectories();
```

### Step 2: Update Shell Scripts

#### Template for Shell Script Updates
```bash
#!/bin/bash
# Updated script with XDG support

# Source XDG paths helper
source "$(dirname "$0")/xdg-paths.sh" 2>/dev/null || {
    # Fallback inline implementation
    MOSAIC_CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}/mosaic"
    MOSAIC_DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}/mosaic"
    MOSAIC_CACHE_HOME="${XDG_CACHE_HOME:-$HOME/.cache}/mosaic"
    MOSAIC_STATE_HOME="${XDG_STATE_HOME:-$HOME/.local/state}/mosaic"
    
    # Backward compatibility check
    if [ ! -d "$MOSAIC_CONFIG_HOME" ] && [ -d "$HOME/.mosaic" ]; then
        echo "Warning: Using legacy path ~/.mosaic (deprecated)" >&2
        MOSAIC_CONFIG_HOME="$HOME/.mosaic"
        MOSAIC_DATA_HOME="$HOME/.mosaic/data"
        MOSAIC_STATE_HOME="$HOME/.mosaic"
    fi
}

# Use the paths
CONFIG_FILE="$MOSAIC_CONFIG_HOME/config.json"
LOG_FILE="$MOSAIC_STATE_HOME/logs/script.log"
```

#### Create XDG Paths Helper
```bash
# scripts/utils/xdg-paths.sh
#!/bin/bash

# XDG Base Directory paths for MosAIc
export MOSAIC_CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}/mosaic"
export MOSAIC_DATA_HOME="${XDG_DATA_HOME:-$HOME/.local/share}/mosaic"
export MOSAIC_CACHE_HOME="${XDG_CACHE_HOME:-$HOME/.cache}/mosaic"
export MOSAIC_STATE_HOME="${XDG_STATE_HOME:-$HOME/.local/state}/mosaic"
export MOSAIC_LOGS_DIR="$MOSAIC_STATE_HOME/logs"

# Legacy path for compatibility
export MOSAIC_LEGACY_HOME="$HOME/.mosaic"

# Function to check migration status
mosaic_check_migration() {
    if [ -L "$MOSAIC_LEGACY_HOME" ]; then
        echo "migrated"
    elif [ -d "$MOSAIC_LEGACY_HOME" ] && [ -d "$MOSAIC_CONFIG_HOME" ]; then
        echo "partial"
    elif [ -d "$MOSAIC_LEGACY_HOME" ] && [ ! -d "$MOSAIC_CONFIG_HOME" ]; then
        echo "pending"
    else
        echo "clean"
    fi
}

# Function to get appropriate path
mosaic_get_path() {
    local path_type="$1"
    local migration_status=$(mosaic_check_migration)
    
    case "$path_type" in
        config)
            echo "$MOSAIC_CONFIG_HOME"
            ;;
        data)
            echo "$MOSAIC_DATA_HOME"
            ;;
        cache)
            echo "$MOSAIC_CACHE_HOME"
            ;;
        logs)
            echo "$MOSAIC_LOGS_DIR"
            ;;
        *)
            echo "$MOSAIC_CONFIG_HOME"
            ;;
    esac
}

# Ensure directories exist
mosaic_ensure_dirs() {
    mkdir -p "$MOSAIC_CONFIG_HOME"
    mkdir -p "$MOSAIC_DATA_HOME"
    mkdir -p "$MOSAIC_CACHE_HOME"
    mkdir -p "$MOSAIC_LOGS_DIR"
}
```

### Step 3: Update Configuration Files

#### Update Default Configurations
```json
// conf/development/mosaic-defaults.json
{
  "paths": {
    "config": "~/.config/mosaic",
    "data": "~/.local/share/mosaic",
    "cache": "~/.cache/mosaic",
    "logs": "~/.local/state/mosaic/logs"
  },
  "migration": {
    "xdg": {
      "enabled": true,
      "deprecationWarnings": true,
      "autoMigrate": false
    }
  }
}
```

### Step 4: Testing Your Changes

#### Unit Test Template
```typescript
// tests/unit/xdg-update.test.ts
import { MosaicPaths } from '@mosaic/config';
import { YourUpdatedComponent } from '../src/YourComponent';

describe('XDG Path Updates', () => {
  beforeEach(() => {
    // Reset environment
    delete process.env.XDG_CONFIG_HOME;
    jest.clearAllMocks();
  });

  test('should use XDG paths by default', () => {
    const component = new YourUpdatedComponent();
    expect(component.configPath).toContain('.config/mosaic');
  });

  test('should handle legacy paths gracefully', () => {
    // Mock legacy environment
    jest.spyOn(MosaicPaths, 'getMigrationStatus').mockReturnValue({
      status: 'pending',
      needsMigration: true,
      // ... other properties
    });

    const component = new YourUpdatedComponent();
    expect(component).toBeDefined();
    // Should still work with legacy paths
  });
});
```

#### Integration Test Script
```bash
#!/bin/bash
# tests/integration/test-xdg-component.sh

# Test with XDG paths
export XDG_CONFIG_HOME="/tmp/xdg-test/config"
export XDG_DATA_HOME="/tmp/xdg-test/data"

# Run your component
npm run build
node dist/your-component.js

# Verify files created in XDG locations
[ -f "$XDG_CONFIG_HOME/mosaic/config.json" ] || exit 1
[ -d "$XDG_DATA_HOME/mosaic" ] || exit 1

echo "XDG integration test passed!"
```

### Step 5: Documentation Updates

#### Update Component Documentation
```markdown
# Component Name

## Configuration

This component now uses XDG Base Directory compliant paths:

- Configuration: `~/.config/mosaic/`
- Data: `~/.local/share/mosaic/`
- Cache: `~/.cache/mosaic/`
- Logs: `~/.local/state/mosaic/logs/`

### Legacy Support

For backward compatibility, the component still supports `~/.mosaic` through a symbolic link. This support will be removed in version X.0.0.

### Environment Variables

You can override the default paths using XDG environment variables:

```bash
export XDG_CONFIG_HOME=/custom/config
export XDG_DATA_HOME=/custom/data
```
```

## Common Patterns

### Pattern 1: Simple Path Replacement
```typescript
// OLD
const path = `${os.homedir()}/.mosaic/file.json`;

// NEW
import { MosaicPaths } from '@mosaic/config';
const path = MosaicPaths.resolvePath('file.json');
```

### Pattern 2: Directory Creation
```typescript
// OLD
fs.mkdirSync(`${os.homedir()}/.mosaic/data`, { recursive: true });

// NEW
await MosaicPaths.ensureDirectories();
// Or for specific directory
fs.mkdirSync(MosaicPaths.dataDir, { recursive: true });
```

### Pattern 3: Path Joining
```typescript
// OLD
const logPath = path.join(os.homedir(), '.mosaic', 'logs', 'app.log');

// NEW
const logPath = MosaicPaths.resolveStatePath('logs/app.log');
```

## Checklist for Each Component

- [ ] Import MosaicPaths from @mosaic/config
- [ ] Replace all hardcoded ~/.mosaic references
- [ ] Update default configurations
- [ ] Add migration status check if needed
- [ ] Update tests to verify XDG paths
- [ ] Update documentation
- [ ] Test with both XDG and legacy environments
- [ ] Verify backward compatibility
- [ ] Check for deprecation warnings
- [ ] Performance test the changes

## Troubleshooting

### Common Issues

1. **Import Errors**
   ```
   Error: Cannot find module '@mosaic/config'
   ```
   Solution: Ensure @mosaic/config is in package.json dependencies

2. **Path Not Found**
   ```
   Error: ENOENT: no such file or directory
   ```
   Solution: Call `MosaicPaths.ensureDirectories()` during initialization

3. **Permission Denied**
   ```
   Error: EACCES: permission denied
   ```
   Solution: Check directory permissions, ensure proper ownership

## Resources

- [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html)
- [MosaicPaths API Documentation](../api/mosaic-paths.md)
- [Migration Script](../../scripts/migration/migrate-to-xdg.sh)
- [Testing Guide](./xdg-testing-plan.md)

## Next Steps

1. Start with high-priority components (MCP Orchestrator, CLI)
2. Update one component at a time
3. Run tests after each update
4. Submit PR with clear description of changes
5. Update this guide with any new patterns discovered