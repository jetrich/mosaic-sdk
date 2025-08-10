# E.0001 Documentation Framework Alignment Verification Checklist

**Created**: 2025-07-27  
**Purpose**: Ensure all documentation aligns with the unified Project = Shelf principle

## Core Principle Verification

### ✅ Project = Shelf Principle

- [ ] Every project gets its own shelf in BookStack
- [ ] Submodules in mono-repos are treated as independent projects
- [ ] No domain-based shelves (Architecture, API, etc.)
- [ ] Structure works for both single and multi-instance BookStack deployments

### ✅ Path Structure

- [ ] All documentation follows `docs/{ProjectName}/` pattern
- [ ] Task management in `docs/{ProjectName}/task-management/`
- [ ] Domain folders (architecture, api, operations) under project folder
- [ ] No nested documentation under source directories

## Document Status

### Planning Documents

| Document                            | Status     | Notes                                |
| ----------------------------------- | ---------- | ------------------------------------ |
| bookstack-unified-structure.md      | ✅ Aligned | Defines Project = Shelf principle    |
| bookstack-integration-strategy.md   | ✅ Updated | Fixed mapping to use project shelves |
| universal-requirements-synthesis.md | ✅ Aligned | Uses `docs/{ProjectName}/` pattern   |
| framework-design.md                 | ✅ Aligned | Shows correct structure              |

### Story/Task Documents

| Document        | Checked | Aligned | Notes        |
| --------------- | ------- | ------- | ------------ |
| S.0001.01.01    | ⏳      | -       | Needs review |
| S.0001.01.02    | ⏳      | -       | Needs review |
| S.0001.01.03    | ⏳      | -       | Needs review |
| T.0001.01.01.01 | ⏳      | -       | Needs review |
| T.0001.01.01.02 | ⏳      | -       | Needs review |

### Migration Documents

| Document           | Status | Notes                                |
| ------------------ | ------ | ------------------------------------ |
| Migration strategy | ⏳     | Needs review for path updates        |
| Rollout plan       | ⏳     | Needs review for deployment approach |

## Key Changes Made

### 1. bookstack-integration-strategy.md

- **Old**: Domain-based shelf mapping (`"docs/architecture/": "Architecture"`)
- **New**: Project-based shelf mapping (`"docs/mosaic-sdk/": "Shelf: mosaic-sdk"`)
- **Impact**: Aligns with unified structure

### 2. universal-requirements-synthesis.md

- **Status**: Already correctly uses `docs/{ProjectName}/` pattern
- **Verified**: Mono-repo handling is explicit

### 3. framework-design.md

- **Status**: Already shows correct `{project}/docs/{ProjectName}/` structure
- **Verified**: Unified structure principle documented

## Remaining Tasks

### High Priority

- [ ] Review all story documents for path consistency
- [ ] Update any migration strategies referencing old structure
- [ ] Create validation script to check for old patterns

### Medium Priority

- [ ] Update task decomposition documents
- [ ] Review atomic task documents
- [ ] Check for any hardcoded paths in scripts

### Low Priority

- [ ] Update examples in documentation
- [ ] Review comments in code for old structure references

## Validation Patterns

### ❌ Old Patterns to Remove

```
docs/architecture/
docs/api/
docs/operations/
Domain-based shelves
Nested docs under source
```

### ✅ New Patterns to Enforce

```
docs/{ProjectName}/architecture/
docs/{ProjectName}/api/
docs/{ProjectName}/operations/
docs/{ProjectName}/task-management/
Project = Shelf always
```

## Verification Commands

```bash
# Find old structure patterns
grep -r "docs/architecture/" --include="*.md"
grep -r "docs/api/" --include="*.md"
grep -r "domain-based" --include="*.md"

# Verify new structure
find docs -type d -name "task-management" | grep -E "docs/[^/]+/task-management"
```

## Sign-off

- [ ] All planning documents aligned
- [ ] All story/task documents reviewed
- [ ] Migration strategy updated
- [ ] No references to old structure remain
- [ ] Validation script created and passing

**Reviewer**: **\*\*\*\***\_**\*\*\*\***  
**Date**: **\*\*\*\***\_**\*\*\*\***
