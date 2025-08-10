# A.0001.01.01.03.01.01: Document Universal Alignment Rules

**Parent Subtask**: ST.0001.01.01.03.01 - Extract Universal Alignment Rules  
**Duration**: 30 minutes  
**Status**: READY

## Objective

Create a comprehensive document that defines the universal alignment rules extracted from the E.0001 work, making them applicable to all MosAIc Stack projects.

## Specific Tasks

1. **Create ALIGNMENT-RULES.md** (10 min)
   - Define Project = Shelf principle
   - Document path structure requirements
   - Specify mono-repo handling rules
   - List prohibited patterns

2. **Extract Key Principles** (10 min)
   - Single vs multi-instance BookStack compatibility
   - No restructuring needed principle
   - Clear project boundaries
   - Submodule independence

3. **Document Anti-patterns** (10 min)
   - Domain-based shelves (❌)
   - Nested documentation (❌)
   - Mixed structures (❌)
   - Duplicate MANDATORY files (❌)

## Deliverables

```markdown
# Universal Documentation Alignment Rules

## Core Principle: Project = Shelf

### Rule 1: One Project, One Shelf

Every project (including submodules) MUST have its own shelf in BookStack.

### Rule 2: Unified Path Structure

All documentation MUST follow: `docs/{ProjectName}/`

### Rule 3: No Domain Shelves

NEVER create shelves named "Architecture", "API", etc.

### Rule 4: Mono-repo Independence

Each submodule is an independent project with own docs.

## Required Structure

docs/{ProjectName}/
├── task-management/
├── architecture/
├── api/
├── operations/
└── \_project.yaml

## Anti-patterns

❌ docs/architecture/
❌ project/docs/
❌ Domain-based shelves
❌ Nested documentation
```

## Success Criteria

- [ ] Rules are clear and unambiguous
- [ ] Examples provided for each rule
- [ ] Anti-patterns explicitly listed
- [ ] Mono-repo scenarios covered
