# UPP Nested Hierarchical Structure Standard

**Version**: 2.0  
**Created**: 2025-08-05  
**Status**: Official Standard  
**Supersedes**: Flat UPP structure (v1.0)

## Overview

This document defines the official MosAIc Stack standard for organizing UPP (Unified Planning Protocol) decomposition using a nested hierarchical directory structure. This approach provides better organization, navigation, and scalability for complex epics.

## Core Principles

### 1. True Hierarchical Nesting
Each UPP level contains all its children as subdirectories, creating a natural tree structure that mirrors the conceptual hierarchy:

```
Epic → Feature → Story → Task → Subtask → Atomic
```

### 2. Self-Contained Units
Each level is self-contained with its own README.md describing the specific scope and requirements at that level.

### 3. Consistent Naming Convention
All directories and files follow the strict naming pattern:
- **Epic**: `E.[0-9]XXX-descriptive-name`
- **Feature**: `F.EPIC.XX-descriptive-name`  
- **Story**: `S.EPIC.FEATURE.XX-descriptive-name`
- **Task**: `T.EPIC.FEATURE.STORY.XX-descriptive-name`
- **Subtask**: `ST.EPIC.FEATURE.STORY.TASK.XX-descriptive-name`
- **Atomic**: `A.EPIC.FEATURE.STORY.TASK.SUBTASK.XX-descriptive-name.md`

## Directory Structure Standard

### Epic Level Structure
```
E.[0-9]XXX-epic-name/
├── README.md                    # Epic overview, success criteria, business value
├── STATUS                       # Current epic status (PLANNING, ACTIVE, COMPLETED)
├── planning/                    # Epic-level planning documents
│   ├── technical-architecture.md
│   ├── token-usage-validation.md
│   └── implementation-strategy.md
├── workspace/                   # Epic-level working documents
│   ├── implementation-roadmap.md
│   ├── lessons-learned.md
│   └── decision-log.md
└── F.EPIC.01-feature-name/     # Features nested directly in epic
    └── [Feature structure...]
```

### Feature Level Structure
```
F.EPIC.XX-feature-name/
├── README.md                    # Feature overview, acceptance criteria
├── planning/                    # Feature-level planning (if needed)
├── workspace/                   # Feature-level working documents
└── S.EPIC.XX.01-story-name/    # Stories nested in feature
    └── [Story structure...]
```

### Story Level Structure  
```
S.EPIC.FEATURE.XX-story-name/
├── README.md                    # Story overview, user value, acceptance criteria
├── planning/                    # Story-level planning (if needed)
└── T.EPIC.FEATURE.XX.01-task-name/  # Tasks nested in story
    └── [Task structure...]
```

### Task Level Structure
```
T.EPIC.FEATURE.STORY.XX-task-name/
├── README.md                    # Task overview, technical requirements (optional)
└── ST.EPIC.FEATURE.STORY.XX.01-subtask-name/  # Subtasks nested in task
    └── [Subtask structure...]
```

### Subtask Level Structure
```
ST.EPIC.FEATURE.STORY.TASK.XX-subtask-name/
├── A.EPIC.FEATURE.STORY.TASK.XX.01-atomic-name.md  # Atomic tasks as files
├── A.EPIC.FEATURE.STORY.TASK.XX.02-atomic-name.md
└── A.EPIC.FEATURE.STORY.TASK.XX.03-atomic-name.md
```

### Atomic Task Files
Atomic tasks are markdown files containing:
- Implementation details
- Validation criteria  
- Dependencies
- Time estimates
- Code examples (if applicable)

## Complete Example Structure

```
E.0004-hierarchical-upp-decomposition/
├── README.md
├── STATUS
├── planning/
│   ├── technical-architecture.md
│   └── token-usage-validation.md
├── workspace/
│   └── implementation-roadmap.md
├── F.0004.01-agent-pool-management/
│   ├── README.md
│   ├── S.0004.01.01-core-implementation/
│   │   ├── README.md
│   │   ├── T.0004.01.01.01-design-architecture/
│   │   │   ├── ST.0004.01.01.01.01-define-interfaces/
│   │   │   │   ├── A.0004.01.01.01.01.01-agent-pool-interface.md
│   │   │   │   ├── A.0004.01.01.01.01.02-agent-interface.md
│   │   │   │   └── A.0004.01.01.01.01.03-resource-limiter-interface.md
│   │   │   └── ST.0004.01.01.01.02-design-state-machine/
│   │   │       ├── A.0004.01.01.01.02.01-state-transitions.md
│   │   │       └── A.0004.01.01.01.02.02-state-validation.md
│   │   ├── T.0004.01.01.02-implement-core/
│   │   │   └── ST.0004.01.01.02.01-agent-pool-manager/
│   │   │       ├── A.0004.01.01.02.01.01-class-structure.md
│   │   │       ├── A.0004.01.01.02.01.02-acquire-method.md
│   │   │       └── A.0004.01.01.02.01.03-release-method.md
│   │   └── T.0004.01.01.03-agent-factory/
│   ├── S.0004.01.02-resource-management/
│   └── S.0004.01.03-lifecycle-management/
├── F.0004.02-hierarchical-decomposition-engine/
│   └── S.0004.02.01-decomposer-architecture/
├── F.0004.03-token-monitoring-analytics/
├── F.0004.04-mcp-tool-integration/
└── F.0004.05-configuration-testing-framework/
```

## Naming Convention Rules

### Epic Categories (First Digit)
- **0**: Core/Foundation (0001-0999)
- **1**: Stack/Infrastructure (1001-1999)  
- **2**: Integration/Tools (2001-2999)
- **3**: UI/Frontend (3001-3999)
- **4**: Enterprise Features (4001-4999)
- **5**: UX/Design (5001-5999)
- **6**: Security/Compliance (6001-6999)
- **7**: Performance/Optimization (7001-7999)
- **8**: Documentation/Standards (8001-8999)
- **9**: Research/Experimental (9001-9999)

### Sequential Numbering
- Features: F.EPIC.01, F.EPIC.02, F.EPIC.03...
- Stories: S.EPIC.FEATURE.01, S.EPIC.FEATURE.02...
- Tasks: T.EPIC.FEATURE.STORY.01, T.EPIC.FEATURE.STORY.02...
- Subtasks: ST.EPIC.FEATURE.STORY.TASK.01, ST.EPIC.FEATURE.STORY.TASK.02...
- Atomics: A.EPIC.FEATURE.STORY.TASK.SUBTASK.01, A.EPIC.FEATURE.STORY.TASK.SUBTASK.02...

### Descriptive Names
- Use kebab-case for readability
- Keep names concise but descriptive
- Max 50 characters for directory names
- Focus on the primary purpose/outcome

## Migration from Flat Structure

### Legacy Flat Structure (Deprecated)
```
E.XXXX-epic-name/
├── features/
│   ├── F.XXXX.01-feature.md
│   └── F.XXXX.02-feature.md
├── stories/
│   ├── S.XXXX.01.01-story.md
│   └── S.XXXX.01.02-story.md
├── tasks/
└── atomics/
```

### Migration Process
1. **Create nested feature directories**
2. **Move feature content** from `features/F.XXXX.XX-name.md` to `F.XXXX.XX-name/README.md`
3. **Organize stories** under appropriate features
4. **Nest tasks** under appropriate stories
5. **Group atomics** under appropriate subtasks
6. **Update all cross-references**

## Benefits of Nested Structure

### 1. Natural Navigation
- Drill down through hierarchy naturally
- Clear parent-child relationships
- Intuitive file organization

### 2. Self-Contained Features
- Each feature is a complete unit
- Easy to understand scope boundaries
- Facilitates parallel development

### 3. Scalability
- Handles hundreds of atomic tasks cleanly
- No directory bloat at any level
- Maintains organization at scale

### 4. Tool Compatibility
- Works well with file explorers
- Integrates with IDE project views
- Supports automated tooling

### 5. UPP Methodology Alignment
- Structure mirrors conceptual hierarchy
- Enforces proper decomposition discipline
- Supports hierarchical planning approaches

## Implementation Guidelines

### README.md Content Standards

#### Epic README.md
```markdown
# Epic E.XXXX: [Title]

**Status**: [PLANNING|ACTIVE|COMPLETED]
**Priority**: [High|Medium|Low]
**Category**: [Core|Infrastructure|etc.]

## Epic Overview
[Business problem and solution approach]

## Success Criteria
[Measurable outcomes]

## Features Overview
- F.XXXX.01: [Feature name and brief description]
- F.XXXX.02: [Feature name and brief description]

## Business Value
[Cost savings, efficiency gains, strategic value]
```

#### Feature README.md
```markdown
# Feature F.XXXX.XX: [Title]

**Epic**: E.XXXX - [Epic Name]
**Status**: [PLANNING|ACTIVE|COMPLETED]
**Priority**: [High|Medium|Low]

## Feature Overview
[What this feature accomplishes]

## Acceptance Criteria
[Specific, measurable criteria]

## Story Breakdown
- S.XXXX.XX.01: [Story name and user value]
- S.XXXX.XX.02: [Story name and user value]
```

#### Story README.md
```markdown
# Story S.XXXX.XX.XX: [Title]

**Feature**: F.XXXX.XX - [Feature Name]
**User Value**: [How this benefits users]
**Priority**: [High|Medium|Low]

## Story Overview
As a [user type], I want [goal] so that [benefit].

## Acceptance Criteria
[Specific criteria for story completion]

## Task Breakdown
- T.XXXX.XX.XX.01: [Task name and technical focus]
- T.XXXX.XX.XX.02: [Task name and technical focus]
```

## Tooling Support

### Automated Structure Generation
Future tooling should support:
- Epic scaffolding with proper nested structure
- Validation of naming conventions
- Cross-reference checking
- Migration utilities for legacy structures

### IDE Integration
- Folder templates for common structures
- Navigation shortcuts
- Search and reference tools
- Validation plugins

## Compliance

All new epics MUST follow this nested structure standard. Legacy epics SHOULD be migrated when actively worked on. This standard is enforced through:

- Code review processes
- Automated validation tools (future)
- Documentation quality gates
- Agent training and guidelines

## Version History

- **v2.0** (2025-08-05): Nested hierarchical structure standard
- **v1.0** (2024): Flat structure approach (deprecated)

---

**Note**: This standard is part of the official MosAIc Stack methodology and supersedes all previous UPP organization approaches.