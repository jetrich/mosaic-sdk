# F.0001.05: Agent Compliance and Enforcement

**Epic**: E.0001 - Documentation Framework Implementation
**Status**: PLANNED
**Owner**: TL-LEAD-TONY
**Estimated Effort**: 20 atomic tasks (~10 hours)

## Description

Implement agent compliance mechanisms to ensure all AI agents follow the new documentation structure. This includes instruction templates, monitoring, warning systems, and training materials.

## Acceptance Criteria

- [ ] Agent instruction templates updated for all personas
- [ ] Compliance monitoring system tracks violations
- [ ] Warning mode enforcement active by default
- [ ] Training materials created for agent operators
- [ ] AGENTS.md and CLAUDE.md auto-updated
- [ ] Violation reports generated

## Stories

1. [S.0001.05.01](../stories/S.0001.05.01-instruction-templates.md) - Create agent instruction templates
2. [S.0001.05.02](../stories/S.0001.05.02-compliance-monitoring.md) - Build compliance monitoring
3. [S.0001.05.03](../stories/S.0001.05.03-warning-system.md) - Implement warning system
4. [S.0001.05.04](../stories/S.0001.05.04-training-materials.md) - Create training materials
5. [S.0001.05.05](../stories/S.0001.05.05-auto-updates.md) - Implement AGENTS.md/CLAUDE.md updates

## Dependencies

- F.0001.01 (Core structure templates) - Need structure to enforce
- F.0001.03 (Task management standardization) - Need standards

## Technical Notes

### Agent Modes

```yaml
modes:
  training:
    enforcement: none
    feedback: suggestions

  warning:  # DEFAULT
    enforcement: soft
    feedback: warnings
    violations_allowed: true

  strict:
    enforcement: hard
    feedback: errors
    violations_allowed: false

  progressive:
    stages:
      - days: 0-7, mode: training
      - days: 8-30, mode: warning
      - days: 31+, mode: strict
```

### Compliance Checks

1. **Pre-operation**: Check intended action
2. **Real-time**: Monitor file operations
3. **Post-operation**: Validate results
4. **Session-end**: Generate report

### Warning Examples

```
⚠️ Warning: Creating task file outside epic structure
   Attempted: docs/task-management/T.0001.01.01.01.md
   Expected: docs/task-management/epics/active/E.0001/tasks/T.0001.01.01.01.md

⚠️ Warning: Duplicate MANDATORY_STRUCTURE.md detected
   Found: ./MANDATORY_STRUCTURE.md
   Keep: docs/task-management/MANDATORY_STRUCTURE.md
```

## Component Assignment

- **Primary**: mosaic-tony (agent framework owner)
- **Secondary**: mosaic-mcp (compliance tools)
- **Supporting**: mosaic-sdk (integration)
