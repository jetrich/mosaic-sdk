# A.0001.01.01.03.03.01: Create Structure Migration Script

**Parent Subtask**: ST.0001.01.01.03.03 - Develop Migration Tools  
**Duration**: 30 minutes  
**Status**: READY

## Objective

Build the core migration script that converts projects from old structures to the unified Project = Shelf structure.

## Specific Tasks

1. **Implement Migration Logic** (15 min)

   ```bash
   #!/bin/bash
   # migrate-to-unified-structure.sh

   detect_current_structure() {
     # Check for domain-based structure
     # Check for nested docs
     # Return structure type
   }

   create_migration_plan() {
     # Map old paths to new paths
     # Identify files to move
     # Plan reference updates
   }

   execute_migration() {
     # Create backup
     # Move files with git mv
     # Update references
     # Validate result
   }
   ```

2. **Handle Edge Cases** (10 min)
   - Existing project folders
   - Conflicting file names
   - Broken references
   - Git history preservation

3. **Add Safety Features** (5 min)
   - Dry-run mode
   - Backup creation
   - Rollback capability
   - Progress reporting

## Migration Patterns

```yaml
migrations:
  domain_to_project:
    from: "docs/architecture/*"
    to: "docs/{PROJECT_NAME}/architecture/"

  nested_to_unified:
    from: "{PROJECT}/docs/*"
    to: "docs/{PROJECT}/"

  root_mandatory:
    from: "MANDATORY_STRUCTURE.md"
    to: "docs/{PROJECT}/task-management/MANDATORY_STRUCTURE.md"
```

## Success Criteria

- [ ] Handles all common migration scenarios
- [ ] Preserves git history
- [ ] Creates reliable backups
- [ ] Updates all references correctly
