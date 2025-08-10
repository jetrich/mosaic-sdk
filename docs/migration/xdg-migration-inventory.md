# XDG Migration Inventory

## Files Requiring Updates

### Priority 1: Core Components

#### MCP Orchestrator Package
- [ ] `packages/mcp-orchestrator/src/config/ConfigLoader.ts`
  - Lines 86, 93, 175, 179 reference `~/.mosaic`
  - Update to use `MosaicPaths` from config package
- [ ] `packages/mcp-orchestrator/src/index.ts`
  - Update path references
- [ ] `packages/mcp-orchestrator/src/main.ts`
  - Update configuration loading

#### CLI Package
- [ ] `packages/cli/src/commands/InitCommand.ts`
  - Update project initialization paths
- [ ] `packages/cli/src/templates/ProjectTemplate.ts`
  - Update template paths
- [ ] `packages/cli/src/commands/StartCommand.ts`
  - Update runtime paths
- [ ] `packages/cli/src/utils/TelemetryService.ts`
  - Update telemetry data paths

#### Config Package
- [x] `packages/config/src/paths.ts` - Already XDG-compliant ✅

### Priority 2: Shell Scripts

#### Project Root Scripts
- [ ] `.mosaic/dev-session.sh`
- [ ] `.mosaic/start-mcp.sh`
- [ ] `.mosaic/scripts/check-status.sh`
- [ ] `.mosaic/scripts/switch-tony-version.sh`

#### Development Scripts
- [ ] `scripts/development/deployment/deploy-to-project.sh`
- [ ] `scripts/development/project-management/dev-environment.sh`
- [ ] `scripts/development/project-management/prepare-mosaic.sh`
- [ ] `scripts/prepare-mosaic.sh`

#### Migration Scripts
- [x] `scripts/migration/migrate-to-xdg.sh` - Migration implementation ✅
- [ ] `scripts/migration/test-migration.sh`

#### Operations Scripts
- [ ] `scripts/operations/backup/backup-framework.sh`

#### OpenCode Scripts
- [ ] `scripts/opencode/fix-opencode-config.sh`
- [ ] `scripts/opencode/fix-opencode-config-v2.sh`
- [ ] `scripts/opencode/test-mcp-connection.sh`

### Priority 3: Integration Components

#### MCP Integration
- [ ] `packages/mcp-integration/src/MCPServiceRegistry.ts`

#### OpenCode MCP
- [ ] `packages/opencode-mcp/src/token-extractor.ts`
- [ ] `packages/opencode-mcp/src/cli.ts`
- [ ] `packages/opencode-mcp/src/ui/themes.ts`

#### Stack Package
- [ ] `packages/stack/src/utils/StackUtils.ts`

### Priority 4: Tony Framework
- [ ] `mosaic-tony/scripts/operations/agents/spawn-agent.sh`
- [ ] `mosaic-tony/scripts/operations/agents/persona-loader.sh`
- [ ] `mosaic-tony/scripts/operations/agents/test-persona-system.sh`
- [ ] `mosaic-tony/core/cli/mcp-commands.ts`

### Priority 5: Templates and Tests
- [ ] `templates/opencode/setup-script.sh`
- [ ] `tests/integration/service-communication-test.sh`
- [ ] `.claude/hooks/pre-tool-check.sh`

## Migration Strategy

### Phase 1: Core Infrastructure (Week 1)
1. Update MCP Orchestrator to use MosaicPaths
2. Update CLI package
3. Test core functionality

### Phase 2: Scripts and Tools (Week 2)
1. Update all shell scripts
2. Update integration components
3. Test script functionality

### Phase 3: Framework Integration (Week 3)
1. Update Tony framework components
2. Update templates
3. Integration testing

### Phase 4: Validation and Rollout (Week 4)
1. Run comprehensive tests
2. Execute migration in staging
3. Monitor and fix issues
4. Production rollout

## Testing Checklist

- [ ] Unit tests for path resolution
- [ ] Integration tests for all components
- [ ] Migration script testing
- [ ] Rollback testing
- [ ] Performance testing
- [ ] User acceptance testing

## Success Criteria

1. All components use XDG paths
2. Backward compatibility maintained via symlink
3. Zero disruption to existing users
4. Clear migration path documented
5. All tests passing
6. Performance unchanged or improved