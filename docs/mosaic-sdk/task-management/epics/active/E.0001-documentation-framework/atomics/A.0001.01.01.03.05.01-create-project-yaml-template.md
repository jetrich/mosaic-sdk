# A.0001.01.01.03.05.01: Create \_project.yaml Template

**Parent Subtask**: ST.0001.01.01.03.05 - Create Compliance Templates  
**Duration**: 15 minutes  
**Status**: READY

## Objective

Create the standard \_project.yaml template that enforces Project = Shelf compliance from project initialization.

## Specific Tasks

1. **Define Template Structure** (5 min)

   ```yaml
   # _project.yaml template
   project:
     name: "{{PROJECT_NAME}}"
     type: "{{PROJECT_TYPE}}" # standalone | submodule | mono-repo
     shelf_name: "{{SHELF_NAME}}" # Must match project name
     description: "{{DESCRIPTION}}"

   # For mono-repos only
   submodules:
     - name: "{{SUBMODULE_NAME}}"
       path: "{{SUBMODULE_PATH}}"

   # BookStack domains
   domains:
     - name: architecture
       books: []
     - name: api
       books: []
     - name: operations
       books: []

   # Validation rules
   validation:
     enforce_project_shelf: true
     allow_domain_shelves: false
     require_task_management: true
   ```

2. **Add Validation Schema** (5 min)
   - Required fields validation
   - Type checking
   - Naming conventions
   - Path validation

3. **Create Generator Function** (5 min)
   ```typescript
   function generateProjectYaml(config: ProjectConfig): string {
     validateConfig(config);
     return renderTemplate("_project.yaml.template", config);
   }
   ```

## Template Variations

```yaml
# Standalone project
project:
  name: "my-app"
  type: "standalone"
  shelf_name: "my-app"

# Submodule in mono-repo
project:
  name: "mosaic-mcp"
  type: "submodule"
  parent: "mosaic-sdk"
  shelf_name: "mosaic-mcp"

# Mono-repo parent
project:
  name: "mosaic-sdk"
  type: "mono-repo"
  shelf_name: "mosaic-sdk"
  submodules:
    - mosaic
    - mosaic-mcp
    - mosaic-tony
```

## Success Criteria

- [ ] Template covers all project types
- [ ] Enforces naming consistency
- [ ] Validates against schema
- [ ] Prevents anti-patterns
