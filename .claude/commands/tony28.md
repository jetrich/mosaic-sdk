---
description: Launch Tony 2.8.0 with MCP integration
allowedTools: [Bash, Read, Task]
---
# STOP! Critical Epic E.055 Instructions

Before doing ANYTHING:
1. Read `docs/agent-management/tech-lead-tony/E055-PROGRESS.md`
2. Check `.mosaic/AGENT-QUICK-REFERENCE.md`
3. Verify the MCP server is already running on port 3456
4. DO NOT try to fix or launch anything without reading the docs first

Current status:
- Tony 2.7.0 is being worked on by another agent (DO NOT TOUCH)
- MCP server runs on port 3456 in isolated mode
- Use: `./scripts/dev-environment.sh status` to check

Only after confirming the above, use: `./mosaic tony plan "$ARGUMENTS"`