# S.0001.03.02: Create UPP Hierarchy Templates

**Feature**: F.0001.03 - Task Management Structure Standardization
**Status**: PLANNED
**Owner**: BE-BACKEND-BENJAMIN
**Estimated Tasks**: 6 atomic tasks

## Description

Create standardized templates for all UPP hierarchy levels (Epic, Feature, Story, Task, Subtask, Atomic) that ensure consistency across all projects while incorporating best practices from existing implementations.

## Acceptance Criteria

- [ ] Epic README template created
- [ ] Feature template created
- [ ] Story template created
- [ ] Task template created
- [ ] Subtask template created
- [ ] Atomic task template created
- [ ] All templates include required metadata
- [ ] Templates support variable substitution

## Tasks

1. [T.0001.03.02.01](../tasks/T.0001.03.02.01-epic-template.md) - Create Epic README template
2. [T.0001.03.02.02](../tasks/T.0001.03.02.02-feature-template.md) - Create Feature template
3. [T.0001.03.02.03](../tasks/T.0001.03.02.03-story-template.md) - Create Story template
4. [T.0001.03.02.04](../tasks/T.0001.03.02.04-task-template.md) - Create Task template
5. [T.0001.03.02.05](../tasks/T.0001.03.02.05-subtask-template.md) - Create Subtask template
6. [T.0001.03.02.06](../tasks/T.0001.03.02.06-atomic-template.md) - Create Atomic task template

## Technical Specifications

### Template Requirements

Each template must include:

- **Header**: ID, parent relationship, status, owner
- **Description**: Clear objective and scope
- **Acceptance Criteria**: Measurable completion criteria
- **Dependencies**: Prerequisites and blockers
- **Technical Notes**: Implementation details
- **Time Tracking**: Estimates and actuals

### Variable Substitution

Templates will support variables for:

- `{{EPIC_ID}}` - Epic identifier
- `{{PROJECT_NAME}}` - Project name
- `{{AGENT_NAME}}` - Assigned agent
- `{{DATE}}` - Current date
- `{{PARENT_ID}}` - Parent item ID

### Template Hierarchy

```
Epic (E.XXXX)
├── Features (F.XXXX.XX)
│   ├── Stories (S.XXXX.XX.XX)
│   │   ├── Tasks (T.XXXX.XX.XX.XX)
│   │   │   ├── Subtasks (ST.XXXX.XX.XX.XX.XX)
│   │   │   │   └── Atomics (A.XXXX.XX.XX.XX.XX.XX)
```

## Dependencies

- S.0001.03.01 (Epic structure definition)
- DOC-DOCUMENTATION-DAVID's template analysis

## Notes

Templates must balance comprehensiveness with usability. Include examples and clear guidance while avoiding overwhelming detail that discourages use.
