# ST.0001.03.01.01.01: Define Base Epic Directory Structure

**Task**: T.0001.03.01.01 - Create Directory Structure Specification
**Status**: PLANNED
**Owner**: BE-BACKEND-BENJAMIN
**Estimated Atomics**: 2

## Objective

Define the exact directory structure that every epic must follow, specifying required directories, optional directories, and organizational principles.

## Atomic Tasks

1. [A.0001.03.01.01.01.01](../atomics/A.0001.03.01.01.01.01-required-dirs.md) - Define required directories
2. [A.0001.03.01.01.01.02](../atomics/A.0001.03.01.01.01.02-optional-dirs.md) - Define optional directories

## Specification Requirements

### Required Directories (MUST exist)

```
E.XXXX-epic-name/
├── planning/          # Strategic documents, analysis, methodologies
├── features/          # F.XXXX.XX-name.md files only
├── stories/           # S.XXXX.XX.XX-name.md files only
├── tasks/             # T.XXXX.XX.XX.XX-name.md files only
├── subtasks/          # ST.XXXX.XX.XX.XX.XX-name.md files only
├── atomics/           # A.XXXX.XX.XX.XX.XX.XX-name.md files only
└── workspace/         # Working documents, reports, outputs
```

### Required Files (MUST exist)

- `README.md` - Epic overview following template
- `STATUS` - Simple status file (ACTIVE/COMPLETED/BLOCKED)

### Optional Directories (MAY exist)

- `artifacts/` - Final deliverables (typically in completed epics)
- `research/` - Research materials specific to epic
- `prototypes/` - Prototype code or designs

### Prohibited Items

- No loose files in epic root (except README.md and STATUS)
- No UPP files outside their designated directories
- No mixing of UPP levels in same directory

## Success Criteria

- [ ] Required directory list finalized
- [ ] Optional directory list defined
- [ ] Prohibition rules established
- [ ] Structure rationale documented

## Notes

This structure is based on proven patterns from dyor-stack_v3 that eliminate context switching and provide clear organization.
