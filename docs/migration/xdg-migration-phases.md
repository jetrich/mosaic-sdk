# XDG Migration Phases and Rollback Strategy

## Overview

This document outlines the phased approach for migrating MosAIc from `~/.mosaic` to XDG Base Directory compliant paths.

## Migration Phases

### Phase 0: Pre-Migration Preparation (Current)
**Duration**: 1 week
**Status**: In Progress

**Objectives**:
- Complete inventory of all affected files
- Design migration strategy
- Create rollback procedures
- Set up testing infrastructure

**Deliverables**:
- [x] Migration inventory document
- [x] Existing migration script analysis
- [ ] Test environment setup
- [ ] Rollback procedure documentation

### Phase 1: Core Infrastructure Update
**Duration**: 1 week
**Risk Level**: High

**Components**:
1. **MCP Orchestrator** (Critical Path)
   - Import MosaicPaths from config package
   - Replace hardcoded paths with dynamic resolution
   - Update default configurations
   - Add migration detection on startup

2. **CLI Package** (Critical Path)
   - Update initialization commands
   - Modify project templates
   - Add migration prompts for users

3. **Config Package** (Already Complete)
   - MosaicPaths class ready for use

**Rollback Trigger Points**:
- MCP server fails to start
- CLI commands fail to execute
- Path resolution errors exceed 1%

### Phase 2: Script Migration
**Duration**: 1 week
**Risk Level**: Medium

**Components**:
1. **Development Scripts**
   - Update path references
   - Add XDG environment variable support
   - Maintain backward compatibility checks

2. **Operation Scripts**
   - Backup scripts
   - Deployment scripts
   - Status check scripts

**Rollback Trigger Points**:
- Script execution failures > 5%
- User-reported issues > 10

### Phase 3: Integration Components
**Duration**: 1 week
**Risk Level**: Medium

**Components**:
1. **Tony Framework Integration**
2. **OpenCode MCP Integration**
3. **Stack Utilities**

**Rollback Trigger Points**:
- Integration test failures
- Performance degradation > 10%

### Phase 4: User Migration
**Duration**: 2 weeks
**Risk Level**: Low

**Activities**:
1. **Soft Launch**
   - Enable for new installations only
   - Monitor for issues
   - Collect feedback

2. **Gradual Rollout**
   - 10% of existing users (Week 1)
   - 50% of existing users (Week 2)
   - 100% of users (Week 3)

3. **Migration Assistance**
   - Automated migration on first run
   - Clear documentation
   - Support channels

## Rollback Strategy

### Immediate Rollback (< 1 hour)
**Trigger**: Critical failure in production

**Steps**:
1. Stop all MosAIc services
2. Revert code changes via git
3. Restart services with old configuration
4. Notify users of temporary reversion

### Staged Rollback (< 24 hours)
**Trigger**: Multiple non-critical issues

**Steps**:
1. Pause new migrations
2. Keep existing migrations intact
3. Fix identified issues
4. Resume migration after fixes

### Full Rollback (< 48 hours)
**Trigger**: Fundamental design issues

**Steps**:
1. Execute rollback script for all users
2. Restore from backups
3. Remove symlinks
4. Revert all code changes
5. Post-mortem analysis

## Rollback Script

```bash
#!/bin/bash
# Emergency rollback script

# 1. Check current state
if [ -L "$HOME/.mosaic" ]; then
    echo "Detected migrated state, proceeding with rollback..."
else
    echo "System not migrated, nothing to rollback"
    exit 0
fi

# 2. Stop services
systemctl --user stop mosaic-mcp || true
pkill -f mosaic || true

# 3. Remove symlink
rm -f "$HOME/.mosaic"

# 4. Restore from XDG to legacy
if [ -d "$HOME/.config/mosaic" ]; then
    cp -r "$HOME/.config/mosaic" "$HOME/.mosaic"
fi

# 5. Merge data directories
if [ -d "$HOME/.local/share/mosaic" ]; then
    mkdir -p "$HOME/.mosaic/data"
    cp -r "$HOME/.local/share/mosaic/"* "$HOME/.mosaic/data/" 2>/dev/null || true
fi

# 6. Restore logs
if [ -d "$HOME/.local/state/mosaic/logs" ]; then
    mkdir -p "$HOME/.mosaic/logs"
    cp -r "$HOME/.local/state/mosaic/logs/"* "$HOME/.mosaic/logs/" 2>/dev/null || true
fi

# 7. Clean up XDG directories (optional)
read -p "Remove XDG directories? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$HOME/.config/mosaic"
    rm -rf "$HOME/.local/share/mosaic"
    rm -rf "$HOME/.cache/mosaic"
    rm -rf "$HOME/.local/state/mosaic"
fi

echo "Rollback complete!"
```

## Success Metrics

### Phase Success Criteria
- **Phase 1**: Core components functional with XDG paths
- **Phase 2**: All scripts execute without errors
- **Phase 3**: Integration tests pass 100%
- **Phase 4**: < 1% user issues reported

### Overall Success Criteria
1. **Zero Data Loss**: No user data lost during migration
2. **Minimal Disruption**: < 5 minutes downtime per user
3. **Performance**: No degradation in performance
4. **Adoption**: 95% successful migrations within 30 days
5. **Support**: < 50 support tickets related to migration

## Risk Mitigation

### High-Risk Mitigations
1. **Automated Backups**: Before any migration
2. **Canary Deployments**: Test with internal users first
3. **Feature Flags**: Enable/disable migration per user
4. **Monitoring**: Real-time migration success tracking

### Medium-Risk Mitigations
1. **Gradual Rollout**: Phased deployment
2. **Clear Communication**: User notifications
3. **Documentation**: Comprehensive guides
4. **Support Preparation**: Team training

### Low-Risk Mitigations
1. **Symlink Maintenance**: 6-month deprecation period
2. **Warning Messages**: Clear deprecation notices
3. **Migration Tools**: Automated assistance

## Timeline

```
Week 1: Phase 0 - Preparation
Week 2: Phase 1 - Core Infrastructure
Week 3: Phase 2 - Scripts
Week 4: Phase 3 - Integration
Week 5-6: Phase 4 - User Migration
Week 7: Monitoring and Optimization
Week 8: Final Review and Documentation
```

## Communication Plan

### Internal Communication
- Daily standup updates during migration
- Slack channel for migration issues
- Weekly progress reports

### External Communication
- Blog post announcing XDG compliance
- Documentation updates
- User email notifications
- Support documentation

## Post-Migration

### 6-Month Plan
1. Month 1-3: Monitor and support
2. Month 4-5: Deprecation warnings increase
3. Month 6: Remove symlink support
4. Month 7+: Full XDG compliance only

### Long-term Benefits
- Standards compliance
- Better organization
- Easier backup strategies
- Improved security model
- Cross-platform consistency