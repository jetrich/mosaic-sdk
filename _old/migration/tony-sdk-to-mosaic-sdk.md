# Migration Guide: Tony SDK to MosAIc SDK

## Overview

This guide provides step-by-step instructions for migrating from the Tony SDK to the MosAIc SDK. The transformation introduces mandatory MCP requirements and rebrands the ecosystem under the MosAIc Stack.

## Migration Timeline

- **Tony 2.7.0**: Last version with standalone mode
- **Tony 2.8.0**: MCP requirement mandatory
- **MosAIc Stack**: New branding and architecture

## Pre-Migration Checklist

Before starting the migration:

- [ ] Ensure you're on Tony 2.7.0 (latest standalone version)
- [ ] Backup your current projects and configurations
- [ ] Review breaking changes in Tony 2.8.0
- [ ] Plan for MCP server deployment
- [ ] Allocate time for testing (2-4 hours typical)

## Migration Steps

### Step 1: Install Migration Tools

```bash
# Install the MosAIc migration CLI
npm install -g @mosaic/migrate

# Verify installation
mosaic-migrate --version
```

### Step 2: Analyze Current Setup

```bash
# Run migration analyzer
mosaic-migrate analyze

# This will report:
# - Current Tony version
# - Standalone mode usage
# - Configuration compatibility
# - Required changes
```

### Step 3: Backup Existing Configuration

```bash
# Create backup
mosaic-migrate backup --output ./migration-backup

# This backs up:
# - Tony configuration files
# - Project settings
# - Agent contexts
# - Custom scripts
```

### Step 4: Install MosAIc Stack

```bash
# Install MosAIc CLI
npm install -g @mosaic/cli

# Initialize MosAIc Stack
mosaic init

# This installs:
# - @tony/core (2.8.0)
# - @mosaic/mcp (0.1.0)
# - @mosaic/core (0.1.0)
# - @mosaic/dev (0.1.0)
```

### Step 5: Configure MCP Server

Create `mosaic-mcp.config.json`:

```json
{
  "server": {
    "port": 3000,
    "host": "localhost"
  },
  "database": {
    "type": "sqlite",
    "path": "./data/mosaic-mcp.db"
  },
  "security": {
    "encryption": true,
    "authRequired": false
  }
}
```

### Step 6: Update Tony Configuration

Transform your Tony configuration:

**Before (2.7.0)**:
```json
{
  "tony": {
    "version": "2.7.0",
    "mode": "standalone",
    "stateManagement": "file"
  }
}
```

**After (2.8.0)**:
```json
{
  "tony": {
    "version": "2.8.0",
    "mcp": {
      "required": true,
      "server": "http://localhost:3000",
      "reconnect": true
    }
  }
}
```

### Step 7: Migrate Projects

```bash
# Migrate all projects
mosaic-migrate projects --all

# Or migrate specific project
mosaic-migrate projects --path ./my-project
```

### Step 8: Update Package Dependencies

Update your `package.json`:

**Before**:
```json
{
  "dependencies": {
    "@tony-framework/mcp": "^0.0.1-beta.1",
    "@tony-ai/sdk": "^1.0.0"
  }
}
```

**After**:
```json
{
  "dependencies": {
    "@tony/core": "^2.8.0",
    "@mosaic/mcp": "^0.1.0",
    "@mosaic/core": "^0.1.0",
    "@mosaic/dev": "^0.1.0"
  }
}
```

### Step 9: Update Import Statements

Update your code imports:

**Before**:
```typescript
import { TonyFramework } from '@tony-framework/core';
import { MCPServer } from '@tony-framework/mcp';
```

**After**:
```typescript
import { TonyFramework } from '@tony/core';
import { createMCPServer } from '@mosaic/mcp';
```

### Step 10: Start MCP Server

```bash
# Start MCP server
mosaic mcp start

# Verify it's running
mosaic mcp status
```

### Step 11: Test Migration

```bash
# Run validation tests
mosaic-migrate validate

# Test Tony with MCP
tony --version  # Should show 2.8.0
tony test-connection  # Should connect to MCP
```

### Step 12: Migrate Agent Contexts

```bash
# Migrate agent contexts to MCP
mosaic-migrate agents

# This converts:
# - File-based contexts → MCP storage
# - Local state → Distributed state
# - Agent configurations → MCP registry
```

## Common Migration Issues

### Issue: MCP Connection Failed

```bash
Error: Cannot connect to MCP server at http://localhost:3000
```

**Solution**:
1. Ensure MCP server is running: `mosaic mcp status`
2. Check firewall settings
3. Verify configuration matches

### Issue: State Migration Errors

```bash
Error: Failed to migrate state from file to MCP
```

**Solution**:
1. Check file permissions
2. Ensure MCP has write access
3. Run with debug: `mosaic-migrate --debug`

### Issue: Package Conflicts

```bash
Error: Cannot resolve @tony-framework/mcp
```

**Solution**:
1. Clear npm cache: `npm cache clean --force`
2. Remove node_modules: `rm -rf node_modules`
3. Fresh install: `npm install`

## Breaking Changes

### Removed Features
- Standalone mode (no MCP fallback)
- File-based state management
- Local-only agent coordination
- Offline task execution

### Changed Behaviors
- All operations require MCP connection
- State persistence through MCP only
- Agent coordination centralized
- Configuration schema updated

### New Requirements
- MCP server must be running
- Network connectivity required
- Increased memory usage (~200MB)
- Database storage for state

## Rollback Procedure

If you need to rollback to Tony 2.7.0:

```bash
# Restore backup
mosaic-migrate restore --from ./migration-backup

# Downgrade packages
npm install @tony-framework/core@2.7.0

# Remove MCP requirement
# Edit configuration to remove MCP settings

# Restart with standalone mode
tony --version  # Should show 2.7.0
```

## Post-Migration Steps

### 1. Update CI/CD Pipelines

Update your GitHub Actions or other CI/CD:

```yaml
# Add MCP server to CI
- name: Start MCP Server
  run: |
    mosaic mcp start --background
    mosaic mcp wait-ready
```

### 2. Update Documentation

- Update README with MosAIc Stack references
- Document MCP server requirements
- Update installation instructions
- Add troubleshooting guides

### 3. Train Your Team

- Schedule MosAIc Stack training
- Review new features and capabilities
- Practice emergency procedures
- Document team workflows

### 4. Monitor Performance

```bash
# Monitor MCP performance
mosaic mcp monitor

# Check agent coordination
mosaic agents status

# View metrics dashboard
mosaic dashboard
```

## Getting Help

### Resources
- [MosAIc Stack Documentation](https://docs.mosaicstack.dev)
- [Migration Support Forum](https://github.com/jetrich/mosaic-sdk/discussions)
- [Video Tutorials](https://mosaicstack.dev/tutorials)

### Support Channels
- GitHub Issues: Technical problems
- Discord: Community support
- Email: enterprise@mosaicstack.dev

## Next Steps

After successful migration:

1. Explore MosAIc Core features
2. Set up team collaboration
3. Configure enterprise features
4. Optimize performance
5. Plan for future upgrades

## Conclusion

The migration from Tony SDK to MosAIc SDK represents a significant architectural improvement. While the process requires careful planning, the benefits of centralized coordination, enterprise features, and improved scalability make it worthwhile. Take your time, test thoroughly, and don't hesitate to seek help from the community.