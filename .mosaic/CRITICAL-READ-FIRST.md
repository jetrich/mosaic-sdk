# 🛑 STOP - CRITICAL INFORMATION FOR ALL AGENTS

## You are in the MosAIc SDK Project

### IMMEDIATE REQUIRED ACTIONS:
1. Read `.mosaic/AGENT-QUICK-REFERENCE.md`
2. Read `docs/agent-management/tech-lead-tony/E055-PROGRESS.md`
3. Understand that Epic E.055 is transforming Tony SDK → MosAIc Stack

### KEY FACTS:
- **Tony Version**: 2.8.0 (with mandatory MCP)
- **MCP Port**: 3456 (isolated from other projects)
- **Status**: MCP server is now WORKING ✅
- **Tony 2.7.0**: COMPLETED & TAGGED ✅
- **DO NOT TOUCH**: mosaic/ submodule (separate project)
- **READY TO PROCEED**: Add tony submodule for 2.8.0 work

### CURRENT STATE:
1. MCP server is running successfully on port 3456 ✅
2. The @mosaic/core integration is complete in the worktree ✅
3. Tony 2.7.0 is complete - ready for 2.8.0 work ✅

### To Start Tony 2.8.0 Work:
```bash
# 1. Add tony submodule (if not already added)
git submodule add https://github.com/jetrich/tony.git tony
git submodule update --init --recursive

# 2. Create worktree for Tony 2.8.0
./scripts/worktree-helper.sh create tony feature/mcp-mandatory mcp-mandatory

# 3. Check MCP server status
./scripts/dev-environment.sh status
```

## REMEMBER: You are working on Epic E.055 - MosAIc Stack Transformation