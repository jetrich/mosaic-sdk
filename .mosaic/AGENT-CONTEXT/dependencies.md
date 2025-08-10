# Dependencies - E.200 OpenCode Integration

**Last Updated**: 2025-07-21  
**Critical Path**: F.200.01 → All Other Features  

## Feature Dependencies

### Critical Path Flow
```
F.200.01 (MCP Server) ─┬→ F.200.02 (Configuration)
                       ├→ F.200.03 (Web UI)
                       └→ F.200.04 (Task Sync)

F.200.05 (Style) ────────→ Independent (Can start anytime)
```

### F.200.01: MCP Server Plugin Architecture
**Status**: 🔴 Critical Path  
**Blocks**: All integration features  
**Dependencies**: None  
**Why Critical**: Defines how MosAIc extends OpenCode  

### F.200.02: Configuration Integration  
**Status**: 🟡 Blocked  
**Blocks**: Nothing  
**Dependencies**: F.200.01 (MCP design)  
**Why**: Needs to know what tools/modes to configure  

### F.200.03: Web UI Tabbed Interface
**Status**: 🟡 Partially Blocked  
**Blocks**: User-facing features  
**Dependencies**: 
- F.200.01 (for terminal integration)
- mosaic-site components (available)
**Why**: Terminal needs MCP server connection  

### F.200.04: Task Synchronization
**Status**: 🔴 Fully Blocked  
**Blocks**: Multi-session features  
**Dependencies**: 
- F.200.01 (MCP server)
- F.200.03 (UI to display)
**Why**: Needs both server and UI  

### F.200.05: Style Consistency Framework
**Status**: 🟢 Independent  
**Blocks**: Visual consistency  
**Dependencies**: mosaic-site (available)  
**Why**: Can extract tokens anytime  

## Task-Level Dependencies

### Immediate Blockers
```
T.200.01.01.01 (Research) blocks:
  → T.200.01.01.02 (Define Interfaces)
  → T.200.01.01.03 (API Specification)
  → T.200.01.01.04 (Integration Points)
  → T.200.01.02.01 (Package Setup)
```

### Parallel Work Possible
```
Can proceed independently:
- T.200.05.01.01 (Token Extraction)
- Documentation Updates
- Environment Setup
- Template Creation
```

## External Dependencies

### Required but Available
- ✅ OpenCode source code (in worktrees/)
- ✅ mosaic-site components
- ✅ TypeScript/Node.js environment

### Required but Missing
- ❌ Bun runtime (needs installation)
- ❌ Development MCP server setup
- ❌ Test environment configuration

### Installation Commands
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Verify OpenCode runs
cd worktrees/opencode
bun install
bun run packages/opencode/src/index.ts
```

## Internal Dependencies

### Package Dependencies
```
@mosaicstack/mcp-orchestrator depends on:
  - @mosaicstack/core (available)
  - @mosaicstack/providers (available)
  - OpenCode MCP types (to be extracted)

@mosaicstack/opencode-adapter depends on:
  - @mosaicstack/mcp-orchestrator
  - xterm.js (npm package)
  - node-pty (npm package)
```

### Documentation Dependencies
- OPENCODE-SETUP-GUIDE.md depends on:
  - MCP server implementation
  - Configuration decisions
  - Deployment strategy

## Risk Mitigation

### High Risk Dependencies
1. **OpenCode API Stability**
   - Mitigation: Lock to specific version
   - Fallback: Maintain compatibility layer

2. **Bun/Node Compatibility**
   - Mitigation: Run in subprocess
   - Fallback: Container isolation

3. **MCP Protocol Changes**
   - Mitigation: Abstract protocol layer
   - Fallback: Version-specific adapters

### Medium Risk Dependencies
1. **WebSocket Performance**
   - Mitigation: Local socket only
   - Fallback: Direct process communication

2. **Style Consistency**
   - Mitigation: Shared token system
   - Fallback: Manual sync

## Dependency Resolution Order

### Week 1 Priority
1. ✅ Complete MCP research (unblocks everything)
2. ✅ Install Bun runtime
3. ✅ Extract style tokens (independent)
4. ✅ Update documentation (independent)

### Week 2 Priority
1. Define MCP interfaces (depends on research)
2. Create package structure
3. Begin Web UI (partial start possible)
4. Configuration templates

### Week 3+ Priority
1. Complete MCP implementation
2. Integrate Web UI with terminal
3. Implement task synchronization
4. End-to-end testing

## Monitoring Dependencies

### Daily Checks
- Is MCP research complete?
- Are blocked tasks unblocked?
- Any new dependencies discovered?
- External dependency availability?

### Escalation Triggers
- Research taking >1 day
- External dependency unavailable
- API incompatibility discovered
- Performance issues identified

## Agent Instructions

### Before Starting Any Task
1. Check all dependencies are met
2. Verify external tools available
3. Confirm previous tasks complete
4. Read handoff documentation

### If Blocked
1. Document the blocker clearly
2. Estimate resolution time
3. Find alternative work if possible
4. Escalate if >4 hours blocked

### When Completing Tasks
1. Update dependency status
2. Notify dependent agents
3. Document any new dependencies
4. Update this file if needed

---

**Remember**: F.200.01 (MCP Server) is the critical path. All efforts should prioritize unblocking this feature first.