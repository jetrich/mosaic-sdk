# A.0001.03.01.01.01.01: Define Required Directories

**Subtask**: ST.0001.03.01.01.01 - Define Base Epic Directory Structure
**Status**: COMPLETED
**Agent**: BE-BACKEND-BENJAMIN
**Estimated Duration**: 15 minutes
**Actual Duration**: 14 minutes

## Objective

Create the definitive list of required directories that every epic must contain, with clear purpose and usage guidelines for each directory.

## Context

Based on DOC-DOCUMENTATION-DAVID's analysis of dyor-stack_v3, the epic-centric model requires specific directories to maintain organization and prevent context switching.

## Implementation Steps

1. List all required directories
2. Define purpose for each directory
3. Specify content rules for each directory
4. Document rationale for requirements
5. Create validation criteria

## Required Directories Specification

### 1. planning/

- **Purpose**: Strategic documents, gap analysis, methodologies
- **Content**: High-level planning documents, NOT UPP hierarchy files
- **Examples**: strategy.md, analysis.md, approach.md
- **Rationale**: Separates strategic thinking from tactical execution

### 2. features/

- **Purpose**: Feature-level breakdown files only
- **Content**: F.XXXX.XX-name.md files exclusively
- **Naming**: F.{EPIC_ID}.{FEATURE_NUM}-descriptive-name.md
- **Rationale**: Type segregation enables easy navigation

### 3. stories/

- **Purpose**: Story-level breakdown files only
- **Content**: S.XXXX.XX.XX-name.md files exclusively
- **Naming**: S.{EPIC_ID}.{FEATURE_NUM}.{STORY_NUM}-descriptive-name.md
- **Rationale**: Maintains UPP hierarchy organization

### 4. tasks/

- **Purpose**: Task-level breakdown files only
- **Content**: T.XXXX.XX.XX.XX-name.md files exclusively
- **Naming**: T.{EPIC_ID}.{FEATURE_NUM}.{STORY_NUM}.{TASK_NUM}-descriptive-name.md
- **Rationale**: Clear separation of work levels

### 5. subtasks/

- **Purpose**: Subtask-level breakdown files only
- **Content**: ST.XXXX.XX.XX.XX.XX-name.md files exclusively
- **Naming**: ST.{EPIC_ID}.{FEATURE_NUM}.{STORY_NUM}.{TASK_NUM}.{SUBTASK_NUM}-descriptive-name.md
- **Rationale**: Enables fine-grained task breakdown

### 6. atomics/

- **Purpose**: Atomic task files only (≤30 minutes each)
- **Content**: A.XXXX.XX.XX.XX.XX.XX-name.md files exclusively
- **Naming**: A.{EPIC_ID}.{FEATURE_NUM}.{STORY_NUM}.{TASK_NUM}.{SUBTASK_NUM}.{ATOMIC_NUM}-descriptive-name.md
- **Rationale**: Ensures all work is broken to implementable units

### 7. workspace/

- **Purpose**: Working documents, reports, outputs, non-UPP files
- **Content**: Any supporting materials that don't fit UPP hierarchy
- **Examples**: meeting-notes.md, research-findings.md, implementation-log.md
- **Rationale**: Prevents clutter in structured directories

## Validation Criteria

- [ ] All 7 directories exist in every epic
- [ ] Each directory contains only appropriate file types
- [ ] No UPP files exist outside designated directories
- [ ] Directory purposes clearly documented

## Deliverables

1. Required directories specification
2. Content rules for each directory
3. Validation checklist

## Success Criteria

- [ ] Complete list of required directories
- [ ] Clear purpose for each directory
- [ ] Content rules established
- [ ] Validation criteria defined

## Next Steps

After completion, move to A.0001.03.01.01.01.02 (optional directories)
