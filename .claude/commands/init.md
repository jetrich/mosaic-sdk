---
description: Initialize MosAIc SDK session with proper context
allowedTools: [Read]
---
# MosAIc SDK Session Initialization

## MANDATORY READS:
1. Read `CLAUDE.md` - Contains Epic E.055 critical instructions
2. Read `docs/agent-management/tech-lead-tony/E055-PROGRESS.md` - Current status
3. Read `.mosaic/AGENT-QUICK-REFERENCE.md` - Quick reference

## KEY POINTS:
- This is MosAIc SDK (NOT tony-sdk)
- Epic E.055 is transforming Tony SDK → MosAIc Stack
- Tony 2.7.0 work is BLOCKED (another agent working)
- Tony 2.8.0 requires MCP (port 3456)
- DO NOT modify tony/ submodule
- DO NOT modify mosaic/ submodule (it's a different project)

## CURRENT STATE:
- @mosaic/core: Implemented with MCP integration ✅
- mosaic-mcp: Needs enhancement with orchestration tools
- mosaic-dev: Needs namespace update to @mosaic/dev
- Isolated MCP server runs on port 3456

Read all the documents above and summarize what you understand about the current state.