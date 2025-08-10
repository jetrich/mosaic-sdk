# Documentation Framework Design Specification

## Overview

This document outlines the design for the universal documentation framework that will standardize documentation across all MosAIc projects.

## Design Principles

1. **Single Source of Truth**: One authoritative structure definition
2. **Inheritance Model**: Projects inherit from universal template
3. **Customization Layers**: Project-specific additions without breaking base
4. **Automation First**: Minimize manual maintenance
5. **Standards Enforcement**: Built-in validation and correction

## Architecture

### Component Hierarchy

```
~/.config/mosaic/templates/documentation/
├── MANDATORY_STRUCTURE.md          # Universal template
├── project-types/                  # Type-specific overlays
├── templates/                      # Document templates
└── scripts/                        # Management scripts

↓ Inherits

{project}/docs/{ProjectName}/
├── task-management/               # Standard UPP structure
├── architecture/                  # Domain documentation
├── api/                          # Domain documentation
├── operations/                   # Domain documentation
└── _project.yaml                 # Project metadata
```

### Unified Structure Principle

**Project = Shelf** (Always)

- Every project gets its own documentation folder
- Submodules in mono-repos are independent projects
- Structure works for both single and multi-instance BookStack deployments
- No restructuring needed when changing deployment strategy

### Generation Pipeline

1. **Project Initialization**
   - Read PRD.md or interactive input
   - Select project type
   - Apply universal template
   - Add type-specific overlays
   - Generate project structure

2. **Structure Validation**
   - Check directory structure
   - Validate file locations
   - Identify violations
   - Suggest corrections

3. **Migration Process**
   - Backup existing structure
   - Map old to new locations
   - Move files preserving history
   - Update references
   - Validate result

## Technical Implementation

### File Generation

```typescript
interface StructureGenerator {
  loadTemplate(): UniversalTemplate;
  applyOverlay(projectType: string): ProjectTemplate;
  generateStructure(config: ProjectConfig): FileSystem;
  writeFiles(fs: FileSystem): void;
}
```

### Validation Engine

```typescript
interface StructureValidator {
  scanProject(path: string): ProjectStructure;
  validateAgainstTemplate(structure: ProjectStructure): ValidationResult;
  suggestFixes(violations: Violation[]): Fix[];
  applyFixes(fixes: Fix[]): void;
}
```

### Migration Tool

```typescript
interface StructureMigrator {
  analyzeExisting(path: string): ExistingStructure;
  createMigrationPlan(from: ExistingStructure, to: Template): MigrationPlan;
  backup(path: string): BackupHandle;
  executeMigration(plan: MigrationPlan): MigrationResult;
  rollback(backup: BackupHandle): void;
}
```

## Integration Points

### With mosaic CLI

```bash
mosaic init                    # Uses framework
mosaic docs validate          # Validates structure
mosaic docs migrate          # Migrates structure
mosaic docs add-shelf        # Adds BookStack shelf
```

### With MCP Tools

```yaml
tools:
  - mosaic_docs_validate # Validate structure
  - mosaic_docs_create # Create documentation
  - mosaic_docs_migrate # Migrate existing docs
  - mosaic_docs_sync # Sync with BookStack
```

### With Agent Workflows

- Agents read MANDATORY_STRUCTURE.md on session start
- Validation runs before documentation changes
- Warnings issued for violations
- Auto-correction available

## Standards Definition

### Required Elements

1. **Task Management**
   - Must use epic-centric structure
   - Must follow UPP hierarchy
   - Must use standard templates

2. **Domain Documentation**
   - Must follow BookStack 4-levels
   - Must include metadata files
   - Must use standard naming

3. **Agent Tracking**
   - Must use session scripts
   - Must follow naming convention
   - Must archive after 7 days

### Enforcement Levels

1. **Error**: Blocks operation
   - Missing required directories
   - Invalid epic structure
   - Duplicate MANDATORY files

2. **Warning**: Allows continuation
   - Non-standard naming
   - Missing metadata
   - Incomplete templates

3. **Info**: Suggestions only
   - Optimization opportunities
   - Best practices
   - Style improvements

## Migration Strategy

### Phase 1: Analysis

- Scan existing structure
- Identify all documentation
- Map to new locations
- Calculate effort

### Phase 2: Preparation

- Create full backup
- Generate migration plan
- Get user confirmation
- Prepare rollback

### Phase 3: Execution

- Create new directories
- Move files in order
- Update references
- Preserve git history

### Phase 4: Validation

- Verify all files moved
- Check references work
- Validate structure
- Clean up old directories

## Success Metrics

1. **Adoption Rate**: % of projects using new structure
2. **Compliance Score**: Average validation score
3. **Migration Success**: % successful migrations
4. **Agent Compliance**: % of sessions without violations
5. **Maintenance Burden**: Hours saved per month
