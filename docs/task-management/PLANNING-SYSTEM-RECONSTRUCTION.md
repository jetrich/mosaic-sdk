# Planning System Reconstruction Task

**Task ID**: T.RECON-001  
**Epic**: E.300 - MosAIc SDK Stabilization  
**Priority**: CRITICAL  
**Estimated Duration**: 2-3 sessions  
**Assigned**: Current Claude session  

## Problem Statement

The current planning system has a fundamental architectural mismatch with the intended UPP (Unified Planning Process) methodology and autonomous agent orchestration system.

### Current Behavior vs. Required Behavior

| Aspect | Current (Broken) | Required (Target) |
|--------|------------------|-------------------|
| **Execution** | User prompts between steps | Fully autonomous |
| **Decomposition** | Domain planning only | Epic → Atomic hierarchy |
| **Task Creation** | Strategic documents | Actual implementable tasks |
| **Agent System** | No agent spawning | Tony + specialized agents |
| **Workflow** | Manual progression | Agent coordination & handoffs |
| **Output** | Planning summaries | UPP task files + database |

## Root Cause Analysis

1. **Missing Tony Orchestration Layer**
   - No agent spawning system
   - No progress monitoring
   - No resource management

2. **Incomplete UPP Implementation**
   - Domain planning ≠ hierarchical decomposition
   - No connection to task hierarchy system
   - No atomic task generation

3. **Architecture Mismatch**
   - Individual commands instead of coordinated workflow
   - User-driven instead of agent-driven
   - Document generation instead of task creation

## Technical Requirements

### New Components Needed

1. **TonyPlanningOrchestrator.ts**
   - Main coordination agent
   - Spawns specialized agents via Claude agents
   - Monitors progress and handles handoffs
   - Resource management for Ollama constraints

2. **UPPDecomposer.ts**
   - Hierarchical decomposition engine
   - Epic → Feature → Story → Task → Subtask → Atomic
   - Creates actual task files in `/docs/task-management/epics/`
   - Populates database with task hierarchy

3. **Agent Deployment System**
   - Specialized agents for each UPP level
   - QA/validation agents
   - Implementation agents
   - Communication protocols

### Modified Components

1. **`/plan-all` Command Reconstruction**
   - Remove user prompts
   - Implement full UPP workflow
   - Connect to Tony orchestration
   - Generate complete task hierarchy

2. **Individual Planning Commands**
   - `/plan-tech`, `/plan-business` etc.
   - Must create complete atomic task decomposition
   - Not just strategic planning
   - Full task hierarchy generation

## Implementation Strategy

### Phase 1: Preservation (Session 1)
- [x] Document analysis in scratchpads
- [ ] Git commit current working state
- [ ] Create backup branch: `planning-system-backup`
- [ ] Tag baseline: `v1.0-planning-baseline`

### Phase 2: Architecture (Session 1-2)
- [ ] Design Tony orchestration system
- [ ] Create UPP decomposition engine
- [ ] Define agent deployment protocols
- [ ] Plan integration with existing systems

### Phase 3: Implementation (Session 2)
- [ ] Build TonyPlanningOrchestrator
- [ ] Implement UPPDecomposer
- [ ] Reconstruct `/plan-all` command
- [ ] Update individual planning commands

### Phase 4: Integration (Session 2-3)
- [ ] Connect to UPP task system
- [ ] Populate database with hierarchies
- [ ] Test agent spawning and coordination
- [ ] Validate autonomous execution

### Phase 5: Validation (Session 3)
- [ ] End-to-end planning workflow test
- [ ] Verify atomic task generation
- [ ] Confirm agent orchestration
- [ ] Performance and resource testing

## Success Criteria

**Must Have:**
- [ ] `/plan-all` creates complete Epic → Atomic hierarchy
- [ ] Tony spawns and coordinates agents autonomously
- [ ] Zero user intervention required
- [ ] Creates implementable atomic tasks (≤30 min)
- [ ] Full MosAIc project integration

**Should Have:**
- [ ] Hybrid Ollama/Claude agent deployment
- [ ] Resource-aware agent management
- [ ] Error handling and remediation
- [ ] Progress tracking and reporting

**Nice to Have:**
- [ ] Parallel agent execution where possible
- [ ] Advanced dependency management
- [ ] Performance optimization
- [ ] Extended QA validation workflows

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|---------|------------|
| Break current system | Medium | High | Git backup, incremental changes |
| Integration complexity | High | Medium | Preserve existing interfaces |
| Resource constraints | Low | Medium | Intelligent resource management |
| Timeline overrun | Medium | Low | Prioritize core functionality |

## Dependencies

**Prerequisite Systems:**
- ✅ MosAIc project integration (working)
- ✅ StateTracker and database (working)
- ✅ UPP task hierarchy structure (exists)
- ✅ Sequential thinking integration (working)

**External Dependencies:**
- Claude agents spawning capability
- Ollama server availability
- File system permissions for task creation
- Database write permissions

## Deliverables

1. **Preserved Current System**
   - Git backup with working baseline
   - Rollback capability

2. **Tony Orchestration System**
   - TonyPlanningOrchestrator.ts
   - Agent spawning and coordination
   - Resource management

3. **UPP Decomposition Engine**
   - UPPDecomposer.ts
   - Hierarchical task breakdown
   - Task file and database creation

4. **Reconstructed Planning Commands**
   - Updated `/plan-all` with autonomous execution
   - Enhanced individual planning commands
   - Full task hierarchy generation

5. **Documentation**
   - Architecture documentation
   - Usage guides
   - Troubleshooting guides

## Notes

This is a **critical architecture reconstruction** that will fundamentally change how the planning system operates. The goal is to transform from a user-driven document generation system to an autonomous agent-orchestrated task decomposition system.

The reconstruction must preserve the working domain planning capabilities while adding the missing hierarchical decomposition and agent orchestration layers.

**Estimated Completion**: End of current session or next session  
**Status**: ACTIVE - Architecture analysis complete, entering preservation phase

---

*Created: 2025-08-10*  
*Last Updated: 2025-08-10*