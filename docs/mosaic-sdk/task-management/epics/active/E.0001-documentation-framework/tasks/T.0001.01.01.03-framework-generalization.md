# T.0001.01.01.03: Generalize Alignment Instructions for Framework

**Parent Story**: S.0001.01.01 - Create Universal MANDATORY_STRUCTURE.md Template  
**Status**: PLANNED  
**Priority**: HIGH  
**Estimated Duration**: 4 hours

## Objective

Transform the E.0001-specific alignment instructions and verification processes into generalized framework components that enforce the Project = Shelf principle across all MosAIc Stack projects.

## Context

The alignment work done for E.0001 documentation framework has established clear patterns and principles that must be enforced universally. These need to be:

1. Extracted from epic-specific context
2. Generalized for all project types
3. Built into the framework tooling
4. Enforced through validation and automation

## Success Criteria

- [ ] Framework includes universal alignment rules
- [ ] Validation tools detect and prevent structure violations
- [ ] Migration tools handle Project = Shelf conversions
- [ ] All new projects automatically follow unified structure
- [ ] Existing projects can be migrated seamlessly

## Subtasks

### ST.0001.01.01.03.01: Extract Universal Alignment Rules

**Duration**: 1 hour  
**Description**: Extract and document the universal rules from E.0001 alignment work

**Deliverables**:

- Universal alignment rules document
- Project = Shelf principle definition
- Path structure requirements
- Anti-patterns to prevent

### ST.0001.01.01.03.02: Create Framework Validation Module

**Duration**: 2 hours  
**Description**: Build validation module that enforces alignment rules

**Deliverables**:

- Structure validator component
- Validation rule definitions
- Error/warning classifications
- Fix suggestions generator

### ST.0001.01.01.03.03: Develop Migration Tools

**Duration**: 1.5 hours  
**Description**: Create tools to migrate projects to unified structure

**Deliverables**:

- Structure migration script
- Backup and rollback functionality
- Reference update automation
- Migration report generator

### ST.0001.01.01.03.04: Integrate with Framework CLI

**Duration**: 1 hour  
**Description**: Add alignment commands to mosaic CLI

**Deliverables**:

- `mosaic docs validate` command
- `mosaic docs migrate` command
- `mosaic docs check-alignment` command
- Integration with project initialization

### ST.0001.01.01.03.05: Create Compliance Templates

**Duration**: 30 minutes  
**Description**: Build templates that enforce compliance from the start

**Deliverables**:

- Project initialization templates
- \_project.yaml template with validation
- BookStack sync configuration template
- CI/CD validation templates

## Technical Approach

### 1. Rule Engine Architecture

```typescript
interface AlignmentRules {
  projectStructure: ProjectStructureRules;
  pathPatterns: PathPatternRules;
  bookstackMapping: BookStackMappingRules;
  antiPatterns: AntiPatternRules;
}
```

### 2. Validation Pipeline

```typescript
interface ValidationPipeline {
  scan(): ProjectStructure;
  validate(rules: AlignmentRules): ValidationResult;
  suggest(violations: Violation[]): Fix[];
  apply(fixes: Fix[]): void;
}
```

### 3. Migration Strategy

```typescript
interface MigrationEngine {
  detect(): StructureType; // domain-based, mixed, unified
  plan(): MigrationPlan;
  execute(): MigrationResult;
  verify(): boolean;
}
```

## Dependencies

- Completion of universal template (S.0001.01.01)
- BookStack unified structure strategy finalized
- Framework CLI infrastructure in place

## Risks & Mitigations

| Risk                           | Impact | Mitigation                        |
| ------------------------------ | ------ | --------------------------------- |
| Breaking existing projects     | High   | Provide gradual migration path    |
| Resistance to structure change | Medium | Clear documentation of benefits   |
| Complex mono-repo scenarios    | Medium | Explicit mono-repo handling rules |

## Notes

- Must handle both greenfield and brownfield projects
- Should integrate with existing CI/CD pipelines
- Need to support gradual adoption strategy
- Consider backwards compatibility mode
