# E055 QA Remediation Brief - Agent Handoff Document

**Epic**: E.055 - MosAIc Stack Architecture Transformation  
**Priority**: 🚨 CRITICAL  
**Package**: @mosaic/core  
**Location**: `/worktrees/mosaic-worktrees/core-orchestration/packages/core`  

## Executive Summary

The @mosaic/core package has critical security vulnerabilities and zero test coverage that must be remediated before the MosAIc SDK can be released. This work is blocking the entire Epic E.055 transformation.

## Critical Issues (Fix These First!)

### 1. Command Injection (CRITICAL)
- **File**: `src/coordinators/MCPClient.ts:72`
- **Issue**: Unvalidated `spawn()` call allows arbitrary command execution
- **Fix**: Implement SecureProcessManager with path validation

### 2. Path Traversal (CRITICAL)  
- **Files**: Multiple locations in MCPClient.ts
- **Issue**: Unvalidated path.join() allows directory traversal attacks
- **Fix**: Implement SecurePathResolver with jail validation

### 3. Memory Leaks (HIGH)
- **Files**: MCPClient.ts, WorkflowEngine.ts, EventBus.ts
- **Issue**: Event listeners and timeouts not cleaned up
- **Fix**: Implement IDisposable pattern and cleanup methods

### 4. Zero Test Coverage (CRITICAL)
- **Current**: 0% coverage
- **Required**: 80% minimum
- **Fix**: Implement comprehensive test suite

## Quick Start for Agents

### Security Agent Tasks
```bash
cd /home/jwoltje/src/mosaic-sdk/worktrees/mosaic-worktrees/core-orchestration/packages/core
# Start with F.055.01 - Security Vulnerabilities
# Reference: docs/task-management/active/E055-VULNERABILITY-REFERENCE.md
```

### Implementation Agent Tasks
```bash
cd /home/jwoltje/src/mosaic-sdk/worktrees/mosaic-worktrees/core-orchestration/packages/core  
# Start with F.055.02 - Memory Leaks (after security fixes)
# Implement IDisposable pattern across all classes
```

### QA Agent Tasks
```bash
cd /home/jwoltje/src/mosaic-sdk/worktrees/mosaic-worktrees/core-orchestration/packages/core
# Start with F.055.03 - Test Coverage
# Set up Jest with TypeScript first
```

## Key Files to Review

1. **Planning Document**: `/docs/task-management/planning/E055-QA-REMEDIATION-PLAN.md`
2. **Task Tracker**: `/docs/task-management/active/E055-QA-REMEDIATION-TRACKER.md`  
3. **Vulnerability Guide**: `/docs/task-management/active/E055-VULNERABILITY-REFERENCE.md`

## Success Criteria

- ✅ All security vulnerabilities patched
- ✅ No memory leaks in 24-hour test
- ✅ 80%+ test coverage achieved
- ✅ All TODOs implemented
- ✅ Full API documentation

## Important Notes

1. **Branch**: Work on `feature/core-orchestration` branch
2. **No Breaking Changes**: Maintain backward compatibility
3. **Performance**: Benchmark before/after changes
4. **Security Review**: Required before merge

## Phase Execution Order

1. **Phase 1** (Days 1-3): Security Vulnerabilities [CRITICAL]
2. **Phase 2** (Days 4-5): Memory Leaks [HIGH]
3. **Phase 3** (Days 6-10): Test Coverage [CRITICAL]
4. **Phase 4** (Days 11-13): Code Quality [MEDIUM]

## Contact & Coordination

- **Tech Lead**: Tony
- **Epic Owner**: E.055 Transformation Team
- **Review Required**: Security specialist for all Phase 1 work
- **Daily Standups**: Update tracker after each atomic task

---

**Remember**: This is blocking the entire MosAIc SDK release. Quality and security are non-negotiable.