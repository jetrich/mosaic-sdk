# S.0001.03.04: Implement Index File Generation

**Feature**: F.0001.03 - Task Management Structure Standardization
**Status**: PLANNED
**Owner**: BE-BACKEND-BENJAMIN
**Estimated Tasks**: 4 atomic tasks

## Description

Implement automated generation and maintenance of index files that provide overview and navigation across the epic structure. This includes active epics list, work queue, and agent assignments.

## Acceptance Criteria

- [ ] ACTIVE_EPICS.txt generation automated
- [ ] WORK_QUEUE.md generation automated
- [ ] ASSIGNMENTS.json generation automated
- [ ] Index update triggers defined
- [ ] Manual override capability provided
- [ ] Index validation implemented

## Tasks

1. [T.0001.03.04.01](../tasks/T.0001.03.04.01-active-epics.md) - Implement ACTIVE_EPICS.txt generation
2. [T.0001.03.04.02](../tasks/T.0001.03.04.02-work-queue.md) - Implement WORK_QUEUE.md generation
3. [T.0001.03.04.03](../tasks/T.0001.03.04.03-assignments.md) - Implement ASSIGNMENTS.json generation
4. [T.0001.03.04.04](../tasks/T.0001.03.04.04-update-triggers.md) - Define update triggers and validation

## Technical Specifications

### ACTIVE_EPICS.txt

- **Format**: Simple newline-separated list
- **Content**: Epic directory names only
- **Example**:
  ```
  E.0001-documentation-framework
  E.0002-planning-decomposition
  E.0003-agent-coordination
  ```

### WORK_QUEUE.md

- **Format**: Markdown with priority sections
- **Content**: Prioritized atomic tasks ready for assignment
- **Sections**: Priority 1 (Immediate), Priority 2 (Short Term), Priority 3 (Medium Term)
- **Task Info**: ID, description, assigned agent, dependencies

### ASSIGNMENTS.json

- **Format**: Structured JSON
- **Content**: Agent assignments, capacity, epic leads
- **Schema**:
  ```json
  {
    "assignments": {
      "AGENT-NAME": {
        "role": "string",
        "epics": ["array"],
        "current_tasks": ["array"],
        "capacity": "available|busy|overloaded"
      }
    },
    "epic_leads": {
      "E.XXXX": "AGENT-NAME"
    },
    "last_updated": "ISO-8601"
  }
  ```

### Update Triggers

1. **Epic Status Change**: When STATUS file modified
2. **Task Assignment**: When task owner changes
3. **Manual Trigger**: Via CLI command
4. **Scheduled**: Daily at midnight
5. **Git Hook**: Pre-commit validation

### Generation Script

```bash
#!/bin/bash
# generate-indexes.sh

echo "Generating task management indexes..."

# Generate ACTIVE_EPICS.txt
find docs/task-management/epics/active -maxdepth 1 -type d -name "E.*" | \
  xargs -I {} basename {} > docs/task-management/_index/ACTIVE_EPICS.txt

# Generate WORK_QUEUE.md
./scripts/generate-work-queue.sh

# Generate ASSIGNMENTS.json
./scripts/generate-assignments.sh

echo "Index generation complete"
```

## Dependencies

- S.0001.03.01 (Epic structure)
- S.0001.03.02 (UPP templates for task parsing)

## Notes

Index files provide essential navigation without cluttering epic directories. Automation reduces maintenance burden and ensures accuracy.
