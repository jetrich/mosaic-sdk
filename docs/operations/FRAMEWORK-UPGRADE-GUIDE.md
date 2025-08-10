# MosAIc Framework Upgrade Guide

## Overview

This guide provides step-by-step instructions for upgrading the MosAIc SDK framework components while maintaining the ability to revert if issues arise.

## Current State Analysis

### Component Versions
- **MosAIc SDK**: v0.1.0
- **Tony Framework**: v2.8.0 (submodule at v2.7.0-1-gb47fc49)
- **MosAIc Platform**: v1.0.0 (submodule at heads/main)
- **MosAIc MCP**: v0.0.1-beta.1 (submodule at v0.0.1-beta.1-4-g1f7e168)

### Version Compatibility Issues
1. **Tony Framework**: Running v2.7.0 commit but SDK expects v2.8.0
2. **MosAIc MCP**: Package name mismatch (@tony-framework/mcp vs @mosaic/mcp)
3. **Submodule Sync**: Multiple submodules have uncommitted changes

## Pre-Upgrade Checklist

### 1. Create Full Backup
```bash
# Run the comprehensive backup script
./scripts/operations/backup/backup-framework.sh
```

This creates a timestamped backup including:
- Git state and submodule commits
- Configuration files
- Databases and state
- Automatic restore script

### 2. Document Current State
```bash
# Save current working state
git stash save "Pre-upgrade working changes"

# Document submodule status
git submodule status > pre-upgrade-submodules.txt
```

## Upgrade Procedure

### Phase 1: Update Submodules

#### 1.1 Update Tony Framework to v2.8.0
```bash
cd tony
git fetch origin
git checkout v2.8.0
cd ..
```

#### 1.2 Update MosAIc Platform
```bash
cd mosaic
git fetch origin
git checkout main
git pull origin main
cd ..
```

#### 1.3 Update MosAIc MCP
```bash
cd mosaic-mcp
git fetch origin
git checkout main
git pull origin main
cd ..
```

### Phase 2: Resolve Package Conflicts

#### 2.1 Update MCP Package Name
The MosAIc MCP package needs to be updated from `@tony-framework/mcp` to `@mosaic/mcp`:

```bash
cd mosaic-mcp
# Update package.json name field
# Change from: "@tony-framework/mcp"
# To: "@mosaic/mcp"
```

#### 2.2 Update Version Matrix
Ensure `.mosaic/version-matrix.json` reflects current versions.

### Phase 3: Reinstall Dependencies

```bash
# Clean install all dependencies
npm run clean
npm run setup
```

### Phase 4: Run Validation Tests

```bash
# Verify structure
npm run verify

# Run all tests
npm test

# Start MCP server for testing
npm run dev:start
npm run dev:status
```

## Testing Framework

### Core Functionality Tests

1. **MCP Server Test**
   ```bash
   npm run dev:start
   # Verify server starts on port 3456
   npm run dev:status
   ```

2. **Tony Framework Integration**
   ```bash
   cd tony
   ./install.sh --verify
   ```

3. **Cross-Component Communication**
   ```bash
   # Test agent deployment with MCP
   ./scripts/spawn-agent.sh --persona BE-BACKEND-BENJAMIN
   ```

### Integration Test Suite

Create test file: `tests/framework-validation.js`
```javascript
// Framework validation tests
const assert = require('assert');

// Test 1: Verify all components loaded
// Test 2: Verify MCP communication
// Test 3: Verify Tony agent deployment
// Test 4: Verify version compatibility
```

## Rollback Procedure

If issues are encountered during upgrade:

### Immediate Rollback
```bash
# Find your backup
ls -la backups/

# Run the restore script
./backups/framework_backup_[TIMESTAMP]/restore.sh
```

### Manual Rollback Steps
1. Reset submodules to previous commits
2. Restore package files from backup
3. Reinstall dependencies
4. Restart services

## Post-Upgrade Verification

### Health Checks
```bash
# Verify all services
npm run dev:status

# Check component versions
node -e "console.log(require('./package.json').version)"
cd tony && cat VERSION
cd ../mosaic && cat VERSION
```

### Final Testing
1. Deploy a test agent
2. Run a simple task through MCP
3. Verify logs are clean
4. Check database integrity

## Troubleshooting

### Common Issues

1. **MCP Server Won't Start**
   - Check port 3456 availability
   - Verify database permissions
   - Check logs in `logs/`

2. **Submodule Conflicts**
   - Use `git submodule update --force`
   - Reset to specific commits from backup

3. **Dependency Issues**
   - Clear npm cache: `npm cache clean --force`
   - Remove node_modules and reinstall

## Support

For additional help:
- Check logs in `logs/` directory
- Review backup manifest in backup directory
- Consult version-matrix.json for compatibility

---

Last Updated: $(date)
Guide Version: 1.0.0