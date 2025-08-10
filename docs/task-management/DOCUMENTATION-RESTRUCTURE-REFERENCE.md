# Documentation Restructure Reference Guide

## Purpose

This document serves as the authoritative reference for the MosAIc documentation restructure initiative. It defines the new standards, migration procedures, and implementation guidelines.

## Core Principles

### 1. Epic-Centric Organization

All task management follows the epic-centric model where each epic is self-contained with its complete UPP hierarchy.

### 2. BookStack Compatibility

All non-task documentation follows BookStack's 4-level hierarchy: Shelf → Book → Chapter → Page

### 3. Component Isolation

Projects are isolated by default to prevent context pollution. MCP handles cross-project coordination.

### 4. Standards Enforcement

Warning mode by default for agent behavior to catch violations early without blocking progress.

## New Directory Structure

### Task Management Structure

```
docs/task-management/
├── epics/
│   ├── active/
│   │   └── E.XXXX-epic-name/
│   │       ├── README.md          # Epic overview
│   │       ├── STATUS             # ACTIVE|COMPLETED|BLOCKED
│   │       ├── planning/          # Strategic documents
│   │       ├── features/          # F.XXXX.XX files
│   │       ├── stories/           # S.XXXX.XX.XX files
│   │       ├── tasks/             # T.XXXX.XX.XX.XX files
│   │       ├── subtasks/          # ST.XXXX.XX.XX.XX.XX files
│   │       ├── atomics/           # A.XXXX.XX.XX.XX.XX.XX files
│   │       └── workspace/         # Working documents
│   └── completed/
├── _index/
│   ├── ACTIVE_EPICS.txt
│   ├── WORK_QUEUE.md
│   └── ASSIGNMENTS.json
├── agent-tracking/
│   ├── sessions/
│   ├── agents/
│   └── reports/
└── MANDATORY_STRUCTURE.md         # Auto-generated
```

### BookStack Documentation Structure

```
docs/{domain}/
├── _shelf.yaml                    # Shelf metadata
├── {book}/
│   ├── _book.yaml                # Book metadata
│   ├── {chapter}/
│   │   ├── _chapter.yaml         # Chapter metadata
│   │   └── {page}.md             # Content pages
│   └── README.md
└── README.md
```

## Epic Categories (E.CXXX)

- E.0XXX: Infrastructure & Setup
- E.1XXX: Core Features
- E.2XXX: Integration & APIs
- E.3XXX: Frontend & UI
- E.4XXX: Backend Services
- E.5XXX: Data & Analytics
- E.6XXX: Security & Compliance
- E.7XXX: DevOps & Deployment
- E.8XXX: Documentation & Training
- E.9XXX: Maintenance & Support

## Implementation Phases

### Phase 1: Structure Creation (E.0001)

1. Create new directory structures
2. Generate MANDATORY_STRUCTURE.md templates
3. Create migration scripts
4. Document standards

### Phase 2: Tooling (E.0002)

1. Implement mosaic CLI commands
2. Create planning tools
3. Build validation scripts
4. Develop PRD integration

### Phase 3: Agent Integration (E.0003)

1. Define MCP tools
2. Implement agent session management
3. Create performance tracking
4. Build enforcement mechanisms

### Phase 4: Web UI (E.3001)

1. Design configuration interface
2. Build project dashboards
3. Create visual editors
4. Implement real-time monitoring

## Migration Strategy

### For Existing Projects

1. Run `mosaic docs migrate` to analyze current structure
2. Review migration plan
3. Execute migration with backup
4. Validate new structure
5. Update agent instructions

### For New Projects

1. Run `mosaic init` with PRD
2. Select project type
3. Configure options
4. Generate structure automatically

## Agent Handoff Protocol

### Information to Preserve

1. Epic objectives and context
2. Current task status
3. Dependencies and blockers
4. Technical decisions made
5. Next steps identified

### Handoff Document Format

```markdown
# Agent Handoff: [FROM] → [TO]

## Context

[Epic/Task context]

## Work Completed

[What was accomplished]

## Current State

[Where things stand]

## Next Steps

[What needs to be done]

## Important Notes

[Decisions, blockers, considerations]
```

## Validation Checklist

- [ ] All epics follow E.CXXX numbering
- [ ] Each epic has required structure
- [ ] BookStack hierarchy is maintained
- [ ] Agent sessions use external scripts
- [ ] Documentation follows 4-level structure
- [ ] Templates are component-appropriate
- [ ] Version follows SemVer
- [ ] Standards are enforced

## Success Criteria

1. Zero duplicate MANDATORY_STRUCTURE.md files
2. All projects follow same base structure
3. Automated initialization works
4. Agents comply with standards
5. Documentation is findable and organized
