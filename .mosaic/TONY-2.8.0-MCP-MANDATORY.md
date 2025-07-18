# Tony 2.8.0 - MCP Mandatory Implementation Plan

## Overview
Tony 2.8.0 will require MCP for ALL deployments. No more file-based or standalone fallbacks.

## Key Changes Required

### 1. Remove Standalone Fallbacks
- Remove all file-based session storage
- Remove all non-MCP agent coordination
- Remove fallback modes in configuration

### 2. Update Configuration
```typescript
// tony/src/config/defaults.ts
export const DEFAULT_CONFIG = {
  mcp: {
    required: true,  // Changed from false
    port: process.env.MCP_PORT || 3456,
    errorOnMissing: true  // Fail fast if MCP not available
  }
};
```

### 3. Update Error Messages
When MCP is not available, provide clear error:
```
Error: Tony 2.8.0 requires MCP (Model Context Protocol) server.
Please ensure MCP server is running on port 3456.
Run: npm run mcp:start
```

### 4. Update Tony CLI
- Check for MCP availability on startup
- Refuse to proceed without MCP connection
- Add `--mcp-port` flag for custom ports

### 5. Integration Points
- Use @mosaic/core MCPClient for all MCP communication
- Ensure stdio transport is properly configured
- Handle MCP server lifecycle gracefully

## Implementation Steps

1. **Create feature branch**
   ```bash
   cd worktrees/tony-worktrees/mcp-mandatory
   git checkout -b feature/mcp-mandatory
   ```

2. **Update core configuration**
   - Modify config/defaults.ts
   - Update initialization checks
   - Add MCP validation

3. **Remove fallback code**
   - Search for file-based alternatives
   - Remove conditional MCP logic
   - Make MCP the only path

4. **Update tests**
   - All tests must mock or use real MCP
   - No more file-based test scenarios
   - Update integration tests

5. **Update documentation**
   - README must mention MCP requirement
   - Installation guide needs MCP setup
   - Migration guide for 2.7.0 → 2.8.0

## Testing Checklist
- [ ] Tony fails to start without MCP
- [ ] Clear error message when MCP missing
- [ ] All features work through MCP
- [ ] No file-based artifacts created
- [ ] Tests pass with MCP mocking
- [ ] Documentation updated

## Migration Path
Users upgrading from 2.7.0 to 2.8.0 must:
1. Install MCP server
2. Configure MCP connection
3. Migrate any file-based data
4. Update their deployment scripts