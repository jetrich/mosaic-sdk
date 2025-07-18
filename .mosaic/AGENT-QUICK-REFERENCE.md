# Epic E.055 Quick Reference

## Current Status (2025-07-18)
- Tony 2.7.0: IN PROGRESS (do not touch)
- @mosaic/core: IMPLEMENTED (needs integration)
- mosaic-mcp: READY FOR ENHANCEMENT
- mosaic-dev: NEEDS NAMESPACE UPDATE

## Key Commands
```bash
# Check worktrees
./scripts/worktree-helper.sh list

# Work on @mosaic/core
cd worktrees/mosaic-worktrees/core-orchestration
git pull origin feature/core-orchestration

# Test isolated MCP
./scripts/test-mcp.js

# Check MCP server status
./scripts/dev-environment.sh status
```

## Next Priority Tasks
1. Integrate @mosaic/core with mosaic-mcp
2. Add orchestration tools to mosaic-mcp
3. Update mosaic-dev package namespace
4. Test the integrated workflow

## Active Worktree Locations
- **@mosaic/core**: `worktrees/mosaic-worktrees/core-orchestration/packages/core/`
- **Branch**: `feature/core-orchestration`
- **Status**: Basic implementation complete, pushed to GitHub

## Common Git Commands
```bash
# Update submodules
git submodule update --init --recursive

# Check worktree status
git worktree list

# Switch to worktree
cd worktrees/mosaic-worktrees/core-orchestration
```

## MCP Integration Points
- MCP Server: `mosaic-mcp/src/main.ts`
- MCP Client: `worktrees/mosaic-worktrees/core-orchestration/packages/core/src/coordinators/MCPClient.ts`
- Database: `.mosaic/data/mcp.db`

## DO NOT TOUCH
- ❌ tony/ submodule
- ❌ mosaic/ submodule (it's the platform, not our package)
- ❌ Any Tony 2.8.0 work until 2.7.0 is complete