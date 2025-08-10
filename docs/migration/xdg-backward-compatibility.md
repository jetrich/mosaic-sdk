# XDG Migration: Backward Compatibility Plan

## Overview

This document outlines the backward compatibility strategy for the MosAIc XDG migration, ensuring zero disruption for existing users while encouraging adoption of the new standard.

## Compatibility Layers

### 1. Symlink Strategy (Primary)

**Implementation**:
```bash
~/.mosaic -> ~/.config/mosaic  # Symbolic link maintained for 6 months
```

**Benefits**:
- Existing scripts continue working without modification
- No immediate action required from users
- Transparent to most operations

**Limitations**:
- Only works for config directory
- Data/cache/state directories need separate handling

### 2. Path Resolution Intelligence

**MosaicPaths Class Behavior**:
```typescript
// Automatic fallback logic
1. Check XDG location first (preferred)
2. Check legacy location via symlink
3. Use XDG location for new files
4. Show deprecation warning when legacy path used
```

**Features**:
- Smart detection of migration status
- Automatic path resolution
- Configurable warning suppression
- Performance optimized with caching

### 3. Environment Variable Support

**User Control**:
```bash
# Suppress deprecation warnings
export MOSAIC_SUPPRESS_SYMLINK_WARNING=1

# Force legacy mode (emergency use only)
export MOSAIC_FORCE_LEGACY_PATHS=1

# Custom path overrides
export MOSAIC_CONFIG_DIR="$HOME/custom/mosaic/config"
export MOSAIC_DATA_DIR="$HOME/custom/mosaic/data"
```

## Deprecation Timeline

### Month 1-2: Silent Compatibility
- Symlink created automatically
- No warnings shown
- Full compatibility maintained
- Metrics collected on legacy usage

### Month 3-4: Soft Warnings
- Deprecation warnings in logs only
- Documentation updated
- Migration guides promoted
- Support for migration questions

### Month 5: Active Warnings
- Console warnings for legacy paths
- Migration prompts in CLI
- Countdown timer in warnings
- Increased documentation visibility

### Month 6: Final Warning
- Daily warnings for legacy users
- Automatic migration offers
- Support team notifications
- Final migration push

### Month 7+: Legacy Removal
- Symlink removed
- Legacy paths no longer supported
- Error messages with migration instructions
- Support for emergency recovery only

## Code Compatibility Patterns

### Pattern 1: Direct Path Updates
```typescript
// OLD - Direct path usage
const configPath = path.join(os.homedir(), '.mosaic', 'config.json');

// NEW - Using MosaicPaths
import { MosaicPaths } from '@mosaic/config';
const configPath = MosaicPaths.resolvePath('config.json');
```

### Pattern 2: Shell Script Updates
```bash
# OLD - Hardcoded paths
MOSAIC_HOME="$HOME/.mosaic"
CONFIG_FILE="$MOSAIC_HOME/config.json"

# NEW - XDG-aware with fallback
MOSAIC_CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}/mosaic"
# Fallback for compatibility
if [ ! -d "$MOSAIC_CONFIG_HOME" ] && [ -d "$HOME/.mosaic" ]; then
    MOSAIC_CONFIG_HOME="$HOME/.mosaic"
fi
CONFIG_FILE="$MOSAIC_CONFIG_HOME/config.json"
```

### Pattern 3: Configuration Updates
```json
// OLD - config.json
{
  "paths": {
    "data": "~/.mosaic/data",
    "logs": "~/.mosaic/logs",
    "cache": "~/.mosaic/cache"
  }
}

// NEW - config.json with XDG paths
{
  "paths": {
    "data": "~/.local/share/mosaic",
    "logs": "~/.local/state/mosaic/logs",
    "cache": "~/.cache/mosaic"
  }
}
```

## Migration Helpers

### 1. Automatic Migration on First Run
```typescript
// In application startup
if (MosaicPaths.needsMigration()) {
  const migrator = new MosaicMigrator();
  await migrator.offerMigration(); // Interactive prompt
  // or
  await migrator.autoMigrate();    // Silent migration
}
```

### 2. CLI Migration Command
```bash
# Manual migration
mosaic migrate --to-xdg

# Check migration status
mosaic migrate --status

# Rollback if needed
mosaic migrate --rollback
```

### 3. Migration Status API
```typescript
// For tools and scripts
const status = MosaicPaths.getMigrationStatus();
console.log(status);
// {
//   status: 'pending' | 'completed' | 'not-needed',
//   legacyPath: '/home/user/.mosaic',
//   xdgPath: '/home/user/.config/mosaic',
//   isSymlink: boolean,
//   needsMigration: boolean
// }
```

## Special Cases

### 1. Docker Containers
```dockerfile
# Maintain compatibility in containers
RUN mkdir -p /root/.config && \
    ln -s /root/.config/mosaic /root/.mosaic
```

### 2. CI/CD Environments
```yaml
# GitHub Actions example
- name: Setup MosAIc
  run: |
    # Use XDG paths in CI
    export XDG_CONFIG_HOME=$HOME/.config
    export XDG_DATA_HOME=$HOME/.local/share
    export XDG_CACHE_HOME=$HOME/.cache
    mosaic setup
```

### 3. Shared Systems
```bash
# For multi-user systems
# System-wide compatibility link
sudo ln -s /etc/xdg/mosaic /etc/mosaic

# User-specific overrides
export MOSAIC_SYSTEM_CONFIG=/etc/xdg/mosaic
```

## Error Handling

### Common Compatibility Issues

1. **Symlink Creation Failure**
   - Fallback to legacy paths
   - Warning in logs
   - Continue operation

2. **Permission Issues**
   - Detect read-only filesystems
   - Use alternative locations
   - Clear error messages

3. **Path Conflicts**
   - Both legacy and XDG exist
   - Prefer XDG if newer
   - Offer merge option

## Testing Compatibility

### Test Scenarios
1. Fresh installation (XDG only)
2. Existing installation (legacy only)
3. Partial migration (both exist)
4. Symlink present
5. Symlink broken
6. Read-only filesystem
7. Custom path overrides
8. Docker/container environment

### Compatibility Test Suite
```bash
# Run compatibility tests
npm run test:compatibility

# Test specific scenarios
npm run test:compatibility -- --scenario=legacy-only
npm run test:compatibility -- --scenario=symlink-broken
```

## User Communication

### In-App Messages
```typescript
// Deprecation warning example
console.warn(`
⚠️  DEPRECATION WARNING: Using legacy path ~/.mosaic

MosAIc has moved to XDG-compliant paths:
• Config: ~/.config/mosaic
• Data: ~/.local/share/mosaic

The legacy path will stop working in ${remainingDays} days.
Run 'mosaic migrate' to update now.

To suppress this warning: export MOSAIC_SUPPRESS_SYMLINK_WARNING=1
`);
```

### Documentation Updates
- Migration guide prominent in docs
- FAQ section for common issues
- Video tutorial for migration
- Support contact information

## Success Metrics

### Compatibility Goals
- **Zero Breaking Changes**: No user workflows broken
- **Migration Rate**: 80% migrated within 6 months
- **Support Tickets**: < 1% of users need help
- **Performance**: No degradation with compatibility layer
- **User Satisfaction**: > 90% positive feedback

### Monitoring
- Track legacy path usage
- Monitor migration success rate
- Collect error reports
- User feedback surveys
- Performance metrics

## Emergency Procedures

### Rollback Instructions
1. Stop all MosAIc services
2. Remove symlink
3. Copy XDG content back to legacy
4. Update configuration
5. Restart services

### Support Escalation
1. Level 1: Documentation and FAQ
2. Level 2: Community support
3. Level 3: Direct developer support
4. Emergency: Hotfix deployment

This backward compatibility plan ensures a smooth transition while maintaining full functionality for all users throughout the migration period.