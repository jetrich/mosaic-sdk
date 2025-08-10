# A.0001.01.01.03.02.01: Build Structure Validator Component

**Parent Subtask**: ST.0001.01.01.03.02 - Create Framework Validation Module  
**Duration**: 30 minutes  
**Status**: READY

## Objective

Implement the core structure validator that checks projects against universal alignment rules.

## Specific Tasks

1. **Create Validator Class** (10 min)

   ```typescript
   class StructureValidator {
     validateProjectStructure(path: string): ValidationResult;
     checkPathPatterns(structure: ProjectStructure): Violation[];
     detectAntiPatterns(files: FileList): AntiPattern[];
   }
   ```

2. **Define Validation Rules** (10 min)
   - Project folder exists under docs/
   - No domain-based top-level folders
   - Task-management follows UPP structure
   - \_project.yaml exists and valid

3. **Implement Error Reporting** (10 min)
   - Severity levels (ERROR, WARNING, INFO)
   - Clear error messages
   - Suggested fixes
   - File locations

## Code Structure

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: Suggestion[];
}

interface ValidationError {
  type: "MISSING_PROJECT_FOLDER" | "DOMAIN_SHELF" | "INVALID_PATH";
  path: string;
  message: string;
  fix?: string;
}
```

## Success Criteria

- [ ] Detects all anti-patterns
- [ ] Provides actionable error messages
- [ ] Suggests specific fixes
- [ ] Fast execution (<1s for typical project)
