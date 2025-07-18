# 🛑 STOP - CRITICAL INFORMATION FOR ALL AGENTS

## You are in the MosAIc SDK Project

### IMMEDIATE REQUIRED ACTIONS:
1. Read `.mosaic/AGENT-QUICK-REFERENCE.md`
2. Read `docs/agent-management/tech-lead-tony/E055-PROGRESS.md`
3. Understand that Epic E.055 is transforming Tony SDK → MosAIc Stack

### KEY FACTS:
- **Tony Version**: 2.8.0 (with mandatory MCP)
- **MCP Port**: 3456 (isolated from other projects)
- **Current Blocker**: TypeScript errors in mosaic-mcp preventing build
- **DO NOT TOUCH**: tony/ submodule (2.7.0 work in progress)
- **DO NOT TOUCH**: mosaic/ submodule (separate project)

### BEFORE RUNNING ANY COMMANDS:
1. The MCP server has build errors that need fixing first
2. The @mosaic/core integration is already complete in the worktree
3. Check `git worktree list` to see existing work

### To Start Working:
```bash
# 1. Check current status
./scripts/dev-environment.sh status

# 2. Fix TypeScript errors in mosaic-mcp
cd mosaic-mcp
npm test  # See what's failing

# 3. The worktree has the working integration
cd worktrees/mosaic-worktrees/core-orchestration
```

## REMEMBER: You are working on Epic E.055 - MosAIc Stack Transformation