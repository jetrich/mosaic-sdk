# F.0001.03: Task Management Structure Standardization

**Epic**: E.0001 - Documentation Framework Implementation
**Status**: PLANNED
**Owner**: BE-BACKEND-BENJAMIN
**Estimated Effort**: 20 atomic tasks (~10 hours)

## Description

Standardize the task management structure across all projects using the epic-centric model with UPP hierarchy. This includes directory structures, templates, and automated index maintenance.

## Acceptance Criteria

- [ ] Epic-centric directory structure enforced
- [ ] UPP hierarchy templates created for all levels
- [ ] Agent session management integrated
- [ ] Automated index files maintained
- [ ] Status tracking implemented
- [ ] Archive process automated

## Stories

1. [S.0001.03.01](../stories/S.0001.03.01-epic-structure.md) - Define epic-centric directory structure
2. [S.0001.03.02](../stories/S.0001.03.02-upp-templates.md) - Create UPP hierarchy templates
3. [S.0001.03.03](../stories/S.0001.03.03-agent-sessions.md) - Build agent session management
4. [S.0001.03.04](../stories/S.0001.03.04-index-generation.md) - Implement index file generation
5. [S.0001.03.05](../stories/S.0001.03.05-status-tracking.md) - Add status tracking system

## Dependencies

- F.0001.01 (Core structure templates) - Need template system

## Technical Notes

### Directory Structure

```
epics/
├── active/
│   └── E.XXXX-name/
│       ├── README.md
│       ├── STATUS
│       ├── planning/
│       ├── features/
│       ├── stories/
│       ├── tasks/
│       ├── subtasks/
│       ├── atomics/
│       └── workspace/
└── completed/
```

### Index Files

- `ACTIVE_EPICS.txt` - Simple list of active epic IDs
- `WORK_QUEUE.md` - Prioritized task list
- `ASSIGNMENTS.json` - Agent-to-task mappings

### Agent Session Script

```bash
#!/bin/bash
# create-agent-session.sh
SESSION_ID=$(uuidgen | cut -c1-8)
DATE=$(date +%Y-%m-%d)
AGENT_NAME=$1
FILENAME="${DATE}-${SESSION_ID}-${AGENT_NAME}.md"
```

## Component Assignment

- **Primary**: mosaic-tony (UPP methodology owner)
- **Secondary**: mosaic-sdk (implementation)
- **Supporting**: mosaic-mcp (session tracking tools)
