# Framework Generalization Plan

**Epic**: E.0001 - Universal Documentation Framework  
**Created**: 2025-07-27  
**Purpose**: Generalize E.0001 alignment work into universal framework components

## Overview

The alignment work completed for E.0001 has established critical patterns that must be enforced across all MosAIc Stack projects. This plan outlines how to extract, generalize, and implement these patterns as core framework features.

## Key Principles to Enforce

### 1. Project = Shelf (Universal Rule)

- Every project gets its own BookStack shelf
- Submodules are independent projects
- No domain-based shelves allowed
- Structure remains constant across deployment strategies

### 2. Unified Path Structure

```
docs/{ProjectName}/
├── task-management/     # UPP methodology
├── architecture/        # Domain docs
├── api/                # Domain docs
├── operations/         # Domain docs
└── _project.yaml       # Project metadata
```

### 3. Anti-patterns to Prevent

- ❌ `docs/architecture/` (domain at root)
- ❌ `project/docs/` (nested documentation)
- ❌ Multiple MANDATORY_STRUCTURE.md files
- ❌ Mixed structure approaches

## Implementation Components

### 1. Framework Rules Engine

**Location**: `~/.config/mosaic/framework/alignment-rules.yaml`

```yaml
rules:
  project_structure:
    enforce: true
    pattern: "docs/{ProjectName}/"

  bookstack_mapping:
    principle: "project_equals_shelf"
    allow_domain_shelves: false

  anti_patterns:
    - pattern: "docs/(architecture|api|operations)/"
      severity: ERROR
      message: "Domain folders must be under project folder"
```

### 2. Validation Module

**Location**: `packages/framework/src/validators/structure-validator.ts`

- Scans project structure
- Detects violations
- Suggests fixes
- Integrates with CI/CD

### 3. Migration Tools

**Location**: `packages/framework/src/tools/structure-migrator.ts`

- Detects old structures
- Creates migration plans
- Preserves git history
- Handles mono-repos

### 4. CLI Integration

**Commands**:

- `mosaic docs validate` - Check structure compliance
- `mosaic docs migrate` - Migrate to unified structure
- `mosaic docs init` - Initialize compliant structure

### 5. Templates

**Location**: `~/.config/mosaic/templates/documentation/`

- `_project.yaml.template`
- `MANDATORY_STRUCTURE.md.template`
- BookStack sync configurations

## Rollout Strategy

### Phase 1: Framework Integration (Week 1)

1. Implement validation module
2. Create migration tools
3. Add CLI commands
4. Update templates

### Phase 2: Documentation (Week 2)

1. Update framework documentation
2. Create migration guides
3. Document best practices
4. Add troubleshooting guides

### Phase 3: Enforcement (Week 3)

1. Enable validation in CI/CD
2. Add pre-commit hooks
3. Create monitoring dashboards
4. Set up alerts

### Phase 4: Migration Support (Week 4)

1. Assist project migrations
2. Handle edge cases
3. Refine tools based on feedback
4. Create case studies

## Success Metrics

1. **Adoption Rate**: 100% of new projects use unified structure
2. **Migration Success**: 95%+ successful automated migrations
3. **Validation Coverage**: All projects pass validation
4. **Developer Satisfaction**: Positive feedback on clarity

## Risk Mitigation

| Risk                 | Mitigation                          |
| -------------------- | ----------------------------------- |
| Resistance to change | Clear documentation of benefits     |
| Complex migrations   | Gradual migration path with backups |
| Breaking changes     | Backwards compatibility mode        |
| Tool complexity      | Simple, clear commands              |

## Integration with Existing Tools

### MCP Tools

```yaml
tools:
  - mosaic_structure_validate
  - mosaic_structure_migrate
  - mosaic_structure_init
```

### Agent Workflows

- Agents read alignment rules on startup
- Validation before documentation changes
- Automatic fix suggestions

### BookStack Sync

- Automatic shelf creation
- Proper hierarchy mapping
- Conflict resolution

## Next Steps

1. Review and approve this plan
2. Begin implementation of T.0001.01.01.03
3. Create framework integration PR
4. Update all project templates
5. Begin rollout to existing projects

## References

- [Alignment Verification Checklist](./alignment-verification-checklist.md)
- [BookStack Unified Structure](../planning/bookstack-unified-structure.md)
- [Universal Requirements Synthesis](./universal-requirements-synthesis.md)
