# Universal MANDATORY_STRUCTURE Requirements Synthesis

**Analyst**: DOC-DOCUMENTATION-DAVID  
**Date**: 2025-01-27  
**Duration**: 23 minutes  
**Atomic Task**: A.0001.01.01.01.01.04  
**Based on**: Analysis trilogy (dyor-stack_v3, afterlife, sage_react)

## Executive Summary

Analysis of three production MANDATORY_STRUCTURE.md files reveals clear convergence on epic-centric organization with domain-specific adaptations. The universal template must prevent duplicate files while supporting project-type customization.

## Universal Patterns (100% Adoption)

### 1. Epic-Centric Organization

**Pattern**: All projects use self-contained epic directories

```
epics/
├── active/E.XXX-name/
└── completed/E.XXX-name/
```

**Rationale**: Eliminates context switching, provides complete epic context
**Requirement**: MANDATORY in universal template

### 2. UPP Hierarchy (6 Levels)

**Pattern**: E → F → S → T → ST → A decomposition
**Numbering**: A.XXX.XX.XX.XX.XX.XX format maintained across all projects
**Requirement**: MANDATORY structure with type segregation

### 3. Strong Enforcement Language

**Pattern**: "NEVER", "ALWAYS", "MUST" - no ambiguity
**Examples**:

- "NEVER create task files outside epic structure"
- "ALWAYS include README.md and STATUS"
  **Requirement**: Maintain authoritative tone

### 4. External Session Management

**Pattern**: `scripts/create-agent-session.sh` approach
**Rationale**: Agents lack reliable date/time access
**Requirement**: MANDATORY external script requirement

### 5. Workspace Separation

**Pattern**: Clear distinction between planning/, UPP directories, workspace/
**Rationale**: Prevents confusion between strategic and tactical documents
**Requirement**: MANDATORY separation rules

## Path Standardization Decision

### Analysis Results

| Project       | Path                        | Verdict          |
| ------------- | --------------------------- | ---------------- |
| dyor-stack_v3 | `docs/dev/task-management/` | Project-specific |
| afterlife     | `docs/task-management/`     | ✅ Universal     |
| sage_react    | `docs/task-management/`     | ✅ Universal     |

**Updated Decision**: Use `docs/{ProjectName}/task-management/` as universal standard
**Rationale**:

- Supports unified Project = Shelf approach
- Handles mono-repos explicitly (each submodule gets own folder)
- No restructuring needed for BookStack deployment changes
- Clear project boundaries

## Domain Adaptation Framework

### Base Structure (All Projects)

```
docs/{ProjectName}/
├── task-management/
│   ├── epics/
│   │   ├── active/E.XXX-name/
│   │   │   ├── README.md
│   │   │   ├── STATUS
│   │   │   ├── planning/
│   │   │   ├── features/
│   │   │   ├── stories/
│   │   │   ├── tasks/
│   │   │   ├── subtasks/
│   │   │   ├── atomics/
│   │   │   └── workspace/
│   │   └── completed/
│   └── agent-tracking/
├── architecture/                  # BookStack domain
├── api/                          # BookStack domain
├── operations/                   # BookStack domain
└── _project.yaml                 # Project metadata
```

### Mono-repo Handling

- Parent repo gets own project folder (e.g., `docs/mosaic-sdk/`)
- Each submodule gets own project folder (e.g., `docs/mosaic/`, `docs/mosaic-mcp/`)
- Clear separation between integration and component documentation

### Domain Overlays

#### Blockchain Projects (afterlife pattern)

**Additional Requirements**:

- Security reviews for blockchain interactions
- Gas optimization considerations
- Multi-chain support documentation
- Smart contract audit trails

**Epic Template Additions**:

```markdown
## Blockchain Considerations

- **Chains**: [Ethereum, Polygon, etc.]
- **Gas Optimization**: [Required/Not Required]
- **Security Audit**: [Required/Not Required]
- **Smart Contracts**: [List affected contracts]
```

**Atomic Template Additions**:

```markdown
## Blockchain Impact

- [ ] Smart contract changes
- [ ] Gas optimization needed
- [ ] Security review required
- [ ] Multi-chain considerations
```

#### Healthcare Projects (sage_react pattern)

**Additional Requirements**:

- HIPAA compliance considerations
- Healthcare security reviews
- Audit trail maintenance
- Patient data protection

**Epic Template Additions**:

```markdown
## Healthcare Compliance

- **HIPAA**: [Applicable/Not Applicable]
- **Patient Data**: [Involved/Not Involved]
- **Security Review**: [Required/Not Required]
- **Audit Trail**: [Required/Not Required]
```

**Atomic Template Additions**:

```markdown
## Compliance Check

- [ ] HIPAA considerations reviewed
- [ ] Security implications assessed
- [ ] Documentation updated
```

#### Generic Projects

**Base Structure Only**: No domain-specific additions
**Agent Naming**: Generic personas (BE-BACKEND-BENJAMIN, etc.)

## Critical Issue: Duplicate Prevention

### The Problem (sage_react evidence)

- **Root File**: `/sage_react/MANDATORY_STRUCTURE.md` (outdated)
- **Correct File**: `/sage_react/docs/task-management/MANDATORY_STRUCTURE.md` (current)
- **Impact**: Agent confusion, outdated guidance, structure drift

### Prevention Strategy

#### 1. Single Source of Truth Enforcement

```yaml
rules:
  mandatory_structure_location: "docs/{ProjectName}/task-management/MANDATORY_STRUCTURE.md"
  prohibited_locations:
    - "MANDATORY_STRUCTURE.md" # Project root
    - "docs/MANDATORY_STRUCTURE.md"
    - "docs/task-management/MANDATORY_STRUCTURE.md" # Old location
    - "*/MANDATORY_STRUCTURE.md" # Any other location

  # For mono-repos
  mono_repo_rules:
    - "Each submodule gets own MANDATORY_STRUCTURE.md"
    - "Parent repo gets own MANDATORY_STRUCTURE.md"
    - "No sharing between projects"
```

#### 2. Automated Duplicate Detection

```bash
#!/bin/bash
# detect-duplicates.sh
CORRECT_PATH="docs/task-management/MANDATORY_STRUCTURE.md"
DUPLICATES=$(find . -name "MANDATORY_STRUCTURE.md" -not -path "./$CORRECT_PATH")

if [ -n "$DUPLICATES" ]; then
    echo "❌ DUPLICATE MANDATORY_STRUCTURE.md files found:"
    echo "$DUPLICATES"
    echo "✅ Correct location: $CORRECT_PATH"
    exit 1
fi
```

#### 3. Framework Generation Rules

- Template generator ONLY creates file in correct location
- Validation tools check for duplicates before any operation
- Migration tools remove duplicates with user confirmation

#### 4. Git Hook Integration

```bash
# pre-commit hook
if git diff --cached --name-only | grep -E "MANDATORY_STRUCTURE\.md$" | grep -v "docs/task-management/"; then
    echo "❌ MANDATORY_STRUCTURE.md must only exist in docs/task-management/"
    exit 1
fi
```

## Agent Naming Strategy

### Flexible Naming System

**Base Personas**: Generic roles (BE-BACKEND-BENJAMIN, FE-FRONTEND-FIONA)
**Project Overlays**: Domain-specific prefixes

#### Implementation

```yaml
agent_naming:
  mode: flexible # generic | project-specific | flexible

  generic:
    - BE-BACKEND-BENJAMIN
    - FE-FRONTEND-FIONA
    - DOC-DOCUMENTATION-DAVID

  project_overlays:
    blockchain:
      - BLOCKCHAIN-DEVELOPER
      - SECURITY-AUDITOR
    healthcare:
      - HEALTHCARE-COMPLIANCE
      - HIPAA-SPECIALIST
```

## Index System Integration

### Combine Best Practices

**From dyor-stack_v3**: Comprehensive indexing
**From afterlife/sage_react**: Simplified structure

#### Recommended Index Files

```
docs/task-management/_index/
├── ACTIVE_EPICS.txt        # Simple list (dyor-stack_v3)
├── WORK_QUEUE.md          # Prioritized tasks (dyor-stack_v3)
└── ASSIGNMENTS.json       # Agent assignments (dyor-stack_v3)
```

## Template Generation Requirements

### 1. Variable Substitution System

```yaml
variables:
  project:
    - "{{PROJECT_NAME}}"
    - "{{PROJECT_TYPE}}"
    - "{{AGENT_PREFIX}}"

  domain_specific:
    - "{{COMPLIANCE_REQUIREMENTS}}"
    - "{{DOMAIN_SECTIONS}}"
    - "{{AGENT_SPECIALIZATIONS}}"
```

### 2. Modular Template Architecture

```
templates/
├── base-mandatory-structure.md      # Universal base
├── overlays/
│   ├── blockchain-overlay.yaml      # Blockchain additions
│   ├── healthcare-overlay.yaml      # Healthcare additions
│   └── generic-overlay.yaml         # No additions
└── generated/
    └── PROJECT-mandatory-structure.md  # Final output
```

### 3. Generation Process

1. Load base template
2. Apply project-type overlay
3. Substitute variables
4. Validate structure
5. Generate final file in correct location ONLY

## Anti-Patterns to Avoid

### 1. Multiple MANDATORY_STRUCTURE.md Files

**Problem**: Confusion, outdated guidance
**Prevention**: Automated detection, single source of truth

### 2. Project-Specific Paths

**Problem**: Reduces universality
**Prevention**: Standardize on `docs/task-management/`

### 3. Mixed Content in Directories

**Problem**: UPP files in planning/, planning docs in UPP directories
**Prevention**: Strong separation rules, validation

### 4. Manual Index Maintenance

**Problem**: Outdated indexes, maintenance burden
**Prevention**: Automated index generation

### 5. Weak Enforcement Language

**Problem**: Ambiguous requirements, non-compliance
**Prevention**: Strong "NEVER/ALWAYS/MUST" language

## Implementation Priority

### Phase 1: Universal Base

1. Create base template with universal patterns
2. Implement duplicate prevention
3. Establish path standardization

### Phase 2: Domain Adaptation

1. Create overlay system
2. Implement variable substitution
3. Add domain-specific templates

### Phase 3: Automation

1. Build generation tools
2. Create validation scripts
3. Integrate with CLI

## Success Metrics

### Adoption Metrics

- 100% projects use correct path structure
- 0% duplicate MANDATORY_STRUCTURE.md files
- 95%+ agent compliance with structure

### Quality Metrics

- Clear epic-centric organization
- Proper UPP hierarchy maintenance
- Effective workspace separation

### Efficiency Metrics

- Reduced documentation maintenance time
- Faster agent onboarding
- Fewer structure violations

This synthesis provides the definitive requirements for creating the universal MANDATORY_STRUCTURE.md template that solves the duplicate file problem while supporting domain-specific needs.
