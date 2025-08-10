# E.200 OpenCode Integration - Orchestration Commands

**Orchestrator**: TL-LEAD-TONY  
**Mission Start**: 2025-07-21  
**Status**: Active Deployment  

## 🚀 Agent Deployment Sequence

### Phase 1: Research & Analysis (Immediate)

#### 1. Deploy RESEARCH-ANALYST-RYAN
**Mission**: Analyze OpenCode MCP implementation  
**Task**: T.200.01.01.01  
**Command**:
```bash
claude --project . \
  --prompt "You are RESEARCH-ANALYST-RYAN analyzing OpenCode MCP implementation for task T.200.01.01.01. Read the context at .mosaic/AGENT-CONTEXT/current-feature.md for your specific assignment. Focus on understanding the MCP server architecture in worktrees/opencode/packages/opencode/src/mcp/. Create your analysis report at docs/task-management/active/E.200/research/MCP-ANALYSIS.md" \
  --model opus \
  --allowedTools="Read,Glob,Grep,WebSearch,WebFetch,Task"
```

#### 2. Deploy DOC-TECHNICAL-DIANA  
**Mission**: Update critical documentation  
**Tasks**: README.md and CLAUDE.md updates  
**Command**:
```bash
claude --project . \
  --prompt "You are DOC-TECHNICAL-DIANA updating documentation for E.200 OpenCode integration. Read docs/task-management/planning/E.200-OPENCODE-TUI/DOCUMENTATION-UPDATES.md for your assignments. Start with updating README.md and CLAUDE.md as specified. Follow the examples provided in the documentation updates file." \
  --model sonnet \
  --allowedTools="Read,Write,Edit,MultiEdit,Glob,Grep"
```

#### 3. Deploy FE-FRONTEND-FIONA
**Mission**: Extract design tokens from mosaic-site  
**Task**: T.200.05.01.01  
**Command**:
```bash
claude --project . \
  --prompt "You are FE-FRONTEND-FIONA extracting design tokens for task T.200.05.01.01. Extract the design tokens from mosaic-site/src/app/globals.css and the component specifications. Create a shareable token package that can be used by both mosaic-site and the monitoring UI. Output to packages/shared-tokens/" \
  --model sonnet \
  --allowedTools="Read,Write,Edit,MultiEdit,Bash,LS,Glob,Grep"
```

### Phase 2: Architecture & Design (After Research)

#### 4. Deploy ARCH-SYSTEMS-ALEX
**Mission**: Design MCP server architecture based on research  
**Task**: T.200.01.01.03  
**Command**:
```bash
claude --project . \
  --prompt "You are ARCH-SYSTEMS-ALEX designing the MosAIc MCP server architecture. Read the MCP analysis from docs/task-management/active/E.200/research/MCP-ANALYSIS.md and create the API specification. Consider the integration points and design a clean plugin architecture. Output to docs/task-management/active/E.200/design/MCP-API-SPEC.md" \
  --model opus \
  --allowedTools="Read,Glob,Grep,WebSearch,WebFetch,Task"
```

### Phase 3: Implementation (After Design)

#### 5. Deploy BE-BACKEND-BENJAMIN
**Mission**: Implement MCP server foundation  
**Task**: T.200.01.02.01  
**Command**:
```bash
claude --project . \
  --prompt "You are BE-BACKEND-BENJAMIN implementing the MosAIc MCP server. Read the API specification and create the @mosaicstack/mcp-orchestrator package. Set up the package structure, implement the MCP server foundation, and create the tool registration system. Follow the architecture defined in docs/architecture/OPENCODE-INTEGRATION.md" \
  --model sonnet \
  --allowedTools="Read,Write,Edit,MultiEdit,Bash,LS,Glob,Grep"
```

## 📋 Coordination Protocol

### Daily Sync Schedule
- **09:00**: Morning standup - Review overnight progress
- **13:00**: Midday check - Identify blockers
- **17:00**: Evening wrap - Handoff preparation

### Handoff Process
1. Completing agent updates handoff document
2. Updates task status in tracking files
3. Notifies next agent via context files
4. Tony validates handoff completion

### Progress Monitoring
```bash
# Check integration status
cat .mosaic/INTEGRATION-STATUS.md

# View current tasks
cat .mosaic/AGENT-CONTEXT/current-tasks.md

# Check dependencies
cat .mosaic/AGENT-CONTEXT/dependencies.md
```

## 🔄 Agent Communication Channels

### Context Updates
All agents must:
1. Read context files before starting
2. Update progress in INTEGRATION-STATUS.md
3. Create output in specified locations
4. Document decisions in handoff files

### Escalation Path
```
Task Issue → Feature Lead → Tony → Project Management
Technical → Alex → Architecture Board
Blocking → Immediate escalation to Tony
```

## 📊 Success Metrics Tracking

### Daily Metrics
- Tasks completed vs planned
- Blockers identified and resolved
- Code quality scores
- Test coverage percentage

### Quality Gates
- [ ] MCP research comprehensive
- [ ] Documentation updates complete
- [ ] Design tokens extracted
- [ ] API specification approved
- [ ] No modifications to OpenCode core

## 🚨 Critical Path Monitoring

**F.200.01 MCP Server** is the critical path:
- All other features blocked until complete
- Priority on unblocking research
- Parallel work on documentation and tokens

## 💬 Agent Coordination Examples

### Research to Architecture Handoff
```markdown
# Handoff: Ryan → Alex
## From: RESEARCH-ANALYST-RYAN
## To: ARCH-SYSTEMS-ALEX
## Task: MCP Architecture Design

### Completed Research
- OpenCode uses experimental_createMCPClient
- Tools registered via transport layer
- Configuration loaded from JSON files
- Extension points identified at [locations]

### Key Findings
- MCP servers can be local or remote
- Tool registration is dynamic
- Protocol is message-based
- Error handling is robust

### Recommendations
- Use local MCP server for performance
- Implement tool namespace (mosaic_*)
- Version lock MCP protocol
- Abstract communication layer
```

### Common Commands

#### Status Check
```bash
# Get current epic status
cat .mosaic/ACTIVE-EPIC.md

# Check agent assignments
cat docs/task-management/planning/E.200-OPENCODE-TUI/AGENT-ASSIGNMENTS.md

# View task breakdown
cat docs/task-management/planning/E.200-OPENCODE-TUI/FEATURE-BREAKDOWN.md
```

#### Task Updates
```bash
# Update task status (example for agents)
echo "Task T.200.01.01.01 completed - see MCP-ANALYSIS.md" >> .mosaic/INTEGRATION-STATUS.md
```

## 🎯 Mission Objectives

### Week 1 Goals
1. ✅ Complete MCP research (Ryan)
2. ✅ Update critical docs (Diana)
3. ✅ Extract design tokens (Fiona)
4. ⏳ Design MCP architecture (Alex)
5. ⏳ Begin implementation (Benjamin)

### Success Criteria
- Zero modifications to OpenCode
- Plugin architecture documented
- All agents have clear context
- Handoffs executed smoothly
- Progress tracked daily

## 📝 Notes for Agents

1. **Always start by reading your context files**
2. **Update progress immediately after task completion**
3. **Document all decisions and findings**
4. **Escalate blockers within 2 hours**
5. **Prepare thorough handoff documentation**

---

**Remember**: This is a coordinated mission. Success depends on clear communication, timely handoffs, and maintaining the critical path focus on F.200.01 MCP Server implementation.