# Current Feature Context

**Feature**: F.200.01 - MCP Server Plugin Architecture  
**Status**: Research Phase  
**Last Updated**: 2025-07-21  

## Active Story

### S.200.01.01: Design MosAIc MCP Server Specification

**Description**: Research and design the MCP server architecture that extends OpenCode without modifying its core.

**Current Task**: T.200.01.01.01 - Research OpenCode MCP implementation

## For RESEARCH-ANALYST-RYAN

### Your Immediate Assignment

**Task**: T.200.01.01.01 - Research OpenCode MCP implementation  
**Duration**: 4-6 hours  
**Priority**: Critical (blocks all other work)  

### Subtasks to Complete

1. **ST.200.01.01.01.01**: Analyze OpenCode MCP server code
   - Read `worktrees/opencode/packages/opencode/src/mcp/index.ts`
   - Understand the MCP client creation flow
   - Document how tools are registered
   - Note configuration options

2. **ST.200.01.01.01.02**: Document MCP protocol usage
   - How OpenCode implements MCP protocol
   - Message formats and communication patterns
   - Tool execution flow
   - Error handling mechanisms

3. **ST.200.01.01.01.03**: Identify extension points
   - Where can we add MosAIc tools?
   - How to register custom MCP servers?
   - Configuration integration points
   - Hook opportunities

4. **ST.200.01.01.01.04**: Create architecture diagram
   - Visual representation of MCP flow
   - Integration points highlighted
   - Data flow between components

### Resources

**Primary Files to Analyze**:
```
worktrees/opencode/packages/opencode/src/mcp/index.ts
worktrees/opencode/packages/opencode/src/tool/tool.ts
worktrees/opencode/packages/opencode/src/config/config.ts
worktrees/opencode/packages/opencode/src/server/server.ts
```

**Key Concepts to Understand**:
- MCP (Model Context Protocol)
- Tool registration system
- Client-server communication
- Configuration loading

### Expected Outputs

Create a research report at:
`docs/task-management/active/E.200/research/MCP-ANALYSIS.md`

Include:
1. Executive summary of findings
2. Technical architecture overview
3. Integration strategy recommendations
4. Identified risks and mitigations
5. Next steps for implementation

### Success Criteria

- [ ] All OpenCode MCP code analyzed
- [ ] Clear understanding of extension points
- [ ] Architecture diagram created
- [ ] Integration strategy defined
- [ ] No modifications needed to OpenCode core
- [ ] Research report completed

### Questions to Answer

1. How does OpenCode register MCP servers?
2. What is the tool registration process?
3. How are tool calls routed and executed?
4. What configuration options are available?
5. How can we add MosAIc-specific tools?
6. What are the security implications?
7. How does error handling work?
8. What are the performance characteristics?

### Handoff Preparation

After completing research, prepare handoff for ARCH-SYSTEMS-ALEX:
- Summary of findings
- Recommended architecture
- Implementation considerations
- Risk factors

## For Future Agents

### BE-BACKEND-BENJAMIN (Next)
You will receive:
- MCP architecture analysis
- Integration points documentation
- Implementation recommendations

Your task will be T.200.01.01.02: Define MosAIc tool interfaces

### Dependencies
- This research blocks all MCP implementation work
- Configuration integration depends on MCP design
- Web UI terminal integration needs MCP server

## Notes

- Focus on understanding, not implementation
- Document everything for future agents
- Ask questions if unclear about OpenCode
- No code changes during research phase
- Keep findings organized and clear