# Required Directories Specification

**Author**: BE-BACKEND-BENJAMIN  
**Date**: 2025-01-27  
**Duration**: 14 minutes  
**Atomic Task**: A.0001.03.01.01.01.01  
**Based on**: dyor-stack_v3 and afterlife analyses

## Universal Required Directories

Based on analysis of proven patterns from dyor-stack_v3 and afterlife, every epic MUST contain these directories:

### 1. planning/

- **Purpose**: Strategic documents, gap analysis, methodologies, approaches
- **Content Rules**:
  - High-level planning documents ONLY
  - NO UPP hierarchy files (F/S/T/ST/A)
  - Strategic thinking, not tactical execution
- **Examples**:
  - `strategy.md` - Overall approach
  - `analysis.md` - Gap analysis, requirements
  - `methodology.md` - Implementation approach
  - `research.md` - Background research
- **Rationale**: Separates strategic thinking from tactical execution, prevents confusion

### 2. features/

- **Purpose**: Feature-level breakdown files exclusively
- **Content Rules**:
  - F.XXXX.XX-name.md files ONLY
  - No other file types permitted
  - Must follow UPP numbering convention
- **Naming Pattern**: `F.{EPIC_ID}.{FEATURE_NUM}-descriptive-name.md`
- **Example**: `F.0001.01-core-structure-templates.md`
- **Rationale**: Type segregation enables easy navigation and prevents mixing of hierarchy levels

### 3. stories/

- **Purpose**: Story-level breakdown files exclusively
- **Content Rules**:
  - S.XXXX.XX.XX-name.md files ONLY
  - Must trace to parent feature
  - Follow UPP numbering convention
- **Naming Pattern**: `S.{EPIC_ID}.{FEATURE_NUM}.{STORY_NUM}-descriptive-name.md`
- **Example**: `S.0001.01.01-universal-template.md`
- **Rationale**: Maintains clear UPP hierarchy organization and traceability

### 4. tasks/

- **Purpose**: Task-level breakdown files exclusively
- **Content Rules**:
  - T.XXXX.XX.XX.XX-name.md files ONLY
  - Must trace to parent story
  - Estimated duration ≤2 hours
- **Naming Pattern**: `T.{EPIC_ID}.{FEATURE_NUM}.{STORY_NUM}.{TASK_NUM}-descriptive-name.md`
- **Example**: `T.0001.01.01.01-template-structure.md`
- **Rationale**: Clear separation of work levels, manageable task sizing

### 5. subtasks/

- **Purpose**: Subtask-level breakdown files exclusively
- **Content Rules**:
  - ST.XXXX.XX.XX.XX.XX-name.md files ONLY
  - Must trace to parent task
  - Estimated duration ≤1 hour
- **Naming Pattern**: `ST.{EPIC_ID}.{FEATURE_NUM}.{STORY_NUM}.{TASK_NUM}.{SUBTASK_NUM}-descriptive-name.md`
- **Example**: `ST.0001.01.01.01.01-analyze-existing.md`
- **Rationale**: Enables fine-grained task breakdown while maintaining hierarchy

### 6. atomics/

- **Purpose**: Atomic task files exclusively (≤30 minutes each)
- **Content Rules**:
  - A.XXXX.XX.XX.XX.XX.XX-name.md files ONLY
  - Must trace to parent subtask
  - MANDATORY duration limit: ≤30 minutes
- **Naming Pattern**: `A.{EPIC_ID}.{FEATURE_NUM}.{STORY_NUM}.{TASK_NUM}.{SUBTASK_NUM}.{ATOMIC_NUM}-descriptive-name.md`
- **Example**: `A.0001.01.01.01.01.01-read-dyor-structure.md`
- **Rationale**: Ensures all work is broken to implementable units, prevents scope creep

### 7. workspace/

- **Purpose**: Working documents, reports, outputs, non-UPP files
- **Content Rules**:
  - Any supporting materials that don't fit UPP hierarchy
  - Work-in-progress documents
  - Analysis outputs, reports, meeting notes
  - NO UPP hierarchy files
- **Examples**:
  - `meeting-notes.md`
  - `research-findings.md`
  - `implementation-log.md`
  - `analysis-results/`
- **Rationale**: Prevents clutter in structured directories, provides space for working materials

## Required Files (Epic Root)

### README.md

- **Purpose**: Epic overview, status, and navigation
- **Content**: Must follow epic template
- **Location**: Epic root directory only
- **Template**: Standardized epic README template

### STATUS

- **Purpose**: Simple, parseable status tracking
- **Content**: Single word status (ACTIVE/COMPLETED/BLOCKED)
- **Location**: Epic root directory only
- **Format**: Plain text, one line

## Validation Rules

### Directory Existence

- [ ] All 7 required directories exist
- [ ] No additional directories in epic root (except optional ones)
- [ ] Directory names exactly match specification

### Content Validation

- [ ] Each directory contains only appropriate file types
- [ ] No UPP files exist outside designated directories
- [ ] No loose files in epic root except README.md and STATUS
- [ ] All UPP files follow naming conventions

### Hierarchy Validation

- [ ] UPP numbering maintains parent-child relationships
- [ ] No orphaned UPP files (missing parents)
- [ ] No duplicate UPP numbers within same level

### Time Validation

- [ ] All atomic tasks ≤30 minutes
- [ ] All subtasks ≤1 hour
- [ ] All tasks ≤2 hours

## Enforcement Mechanisms

### Automated Validation

```bash
#!/bin/bash
# validate-epic-structure.sh
EPIC_DIR=$1

# Check required directories
REQUIRED_DIRS=("planning" "features" "stories" "tasks" "subtasks" "atomics" "workspace")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$EPIC_DIR/$dir" ]; then
        echo "ERROR: Missing required directory: $dir"
        exit 1
    fi
done

# Check required files
if [ ! -f "$EPIC_DIR/README.md" ]; then
    echo "ERROR: Missing README.md"
    exit 1
fi

if [ ! -f "$EPIC_DIR/STATUS" ]; then
    echo "ERROR: Missing STATUS file"
    exit 1
fi

echo "Epic structure validation passed"
```

### Git Hooks

- Pre-commit validation of epic structure
- Automated checks on UPP file placement
- Status consistency validation

### CLI Integration

```bash
mosaic epic validate E.0001
mosaic epic create E.0002 --template=web-app
mosaic docs validate
```

## Benefits of This Structure

### 1. Context Preservation

All epic-related files in one location eliminates context switching and provides complete epic context.

### 2. Type Segregation

Each UPP level in separate directories enables easy navigation and prevents confusion.

### 3. Clear Traceability

UPP numbering maintains clear parent-child relationships across all levels.

### 4. Workspace Separation

Clear distinction between structured UPP files and working materials.

### 5. Scalability

Structure works for epics with 1 feature or 100 features without modification.

### 6. Tool-Friendly

Consistent structure enables automation, validation, and tooling.

## Implementation Notes

This specification incorporates the best practices from both dyor-stack_v3 (comprehensive organization) and afterlife (cleaner paths, domain separation). The structure is rigid enough for consistency but flexible enough for project-specific needs through the workspace directory and optional directories.
