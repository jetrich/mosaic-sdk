---
description: Implement MCP mandatory requirement in Tony 2.8.0
allowedTools: [Read, Edit, MultiEdit, Write, Bash, TodoWrite]
---
# Implement MCP Mandatory Requirement in Tony 2.8.0

## Prerequisites
1. Read `.mosaic/TONY-2.8.0-MCP-MANDATORY.md` for the implementation plan
2. Ensure tony submodule is present
3. Create a worktree for the changes

## Tasks
1. Create feature branch in tony worktree
2. Update configuration to make MCP required
3. Remove all file-based fallbacks
4. Update error messages for missing MCP
5. Update tests to work with MCP
6. Update documentation

## Key Files to Modify
- `tony/src/config/defaults.ts` - Make MCP required
- `tony/src/core/initialization.ts` - Add MCP checks
- `tony/src/cli/index.ts` - Check MCP on startup
- Remove any `if (!mcp)` fallback logic

## Success Criteria
- Tony 2.8.0 refuses to start without MCP
- Clear error messages guide users to start MCP
- All tests pass with MCP requirement
- No file-based coordination remains