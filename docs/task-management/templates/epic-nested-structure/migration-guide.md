# Migration Guide: Flat to Nested Structure

**Purpose**: Convert existing flat UPP structure epics to the new nested hierarchical standard  
**Applies To**: Legacy epics using separate `features/`, `stories/`, `tasks/`, `atomics/` directories

## Overview

This guide provides step-by-step instructions for migrating epics from the legacy flat structure to the new nested hierarchical structure defined in the [UPP Nested Structure Standard](../../standards/UPP-NESTED-STRUCTURE.md).

## Before You Start

### Prerequisites
- Backup the existing epic directory
- Ensure no active development is happening on the epic
- Review the [UPP Nested Structure Standard](../../standards/UPP-NESTED-STRUCTURE.md)
- Have write access to the task-management directory

### Migration Checklist
- [ ] Epic backup created
- [ ] Current structure analyzed
- [ ] Migration plan reviewed
- [ ] Team notified of restructuring
- [ ] Cross-references documented

## Step-by-Step Migration Process

### Step 1: Analyze Current Structure

Document the existing flat structure:
```bash
# Navigate to the epic
cd docs/task-management/epics/active/E.XXXX-epic-name

# List current structure
find . -type f -name "*.md" | sort
```

Create a mapping of current files to new nested locations:
```
Current → New Location
features/F.XXXX.01-feature.md → F.XXXX.01-feature/README.md
stories/S.XXXX.01.01-story.md → F.XXXX.01-feature/S.XXXX.01.01-story/README.md
tasks/T.XXXX.01.01.01-task.md → F.XXXX.01-feature/S.XXXX.01.01-story/T.XXXX.01.01.01-task/README.md
atomics/A.XXXX.01.01.01.01.01-atomic.md → F.XXXX.01-feature/S.XXXX.01.01-story/T.XXXX.01.01.01-task/ST.XXXX.01.01.01.01-subtask/A.XXXX.01.01.01.01.01-atomic.md
```

### Step 2: Create Nested Directory Structure

For each feature, create the nested structure:
```bash
# Create feature directory
mkdir F.XXXX.01-feature-name

# Create nested subdirectories for each story in this feature
mkdir -p F.XXXX.01-feature-name/S.XXXX.01.01-story-name
mkdir -p F.XXXX.01-feature-name/S.XXXX.01.02-story-name

# Create task directories under each story
mkdir -p F.XXXX.01-feature-name/S.XXXX.01.01-story-name/T.XXXX.01.01.01-task-name
mkdir -p F.XXXX.01-feature-name/S.XXXX.01.01-story-name/T.XXXX.01.01.02-task-name

# Create subtask directories under each task
mkdir -p F.XXXX.01-feature-name/S.XXXX.01.01-story-name/T.XXXX.01.01.01-task-name/ST.XXXX.01.01.01.01-subtask-name
```

### Step 3: Migrate Feature Content

Convert feature files to nested structure:
```bash
# Move feature content to nested README.md
cp features/F.XXXX.01-feature.md F.XXXX.01-feature-name/README.md

# Update the feature README.md to include story breakdown
# (See template for proper format)
```

### Step 4: Migrate Story Content

Convert story files to nested structure:
```bash
# Move story content to nested location
cp stories/S.XXXX.01.01-story.md F.XXXX.01-feature-name/S.XXXX.01.01-story-name/README.md

# Update story README.md to include task breakdown
# (See template for proper format)
```

### Step 5: Migrate Task Content

Convert task files to nested structure:
```bash
# Move task content to nested location (if task README is needed)
cp tasks/T.XXXX.01.01.01-task.md F.XXXX.01-feature-name/S.XXXX.01.01-story-name/T.XXXX.01.01.01-task-name/README.md

# Or integrate task content into story README if task is simple
```

### Step 6: Migrate Atomic Tasks

Group atomic tasks under appropriate subtasks:
```bash
# Create subtask directory if it doesn't exist
mkdir -p F.XXXX.01-feature-name/S.XXXX.01.01-story-name/T.XXXX.01.01.01-task-name/ST.XXXX.01.01.01.01-subtask-name

# Move atomic tasks to subtask directory
cp atomics/A.XXXX.01.01.01.01.01-atomic.md F.XXXX.01-feature-name/S.XXXX.01.01-story-name/T.XXXX.01.01.01-task-name/ST.XXXX.01.01.01.01-subtask-name/
cp atomics/A.XXXX.01.01.01.01.02-atomic.md F.XXXX.01-feature-name/S.XXXX.01.01-story-name/T.XXXX.01.01.01-task-name/ST.XXXX.01.01.01.01-subtask-name/
```

### Step 7: Update Cross-References

Update all internal links and references:
```bash
# Find all markdown files with references to update
grep -r "features/" F.XXXX.* 
grep -r "stories/" F.XXXX.*
grep -r "tasks/" F.XXXX.*
grep -r "atomics/" F.XXXX.*

# Update each reference to use new nested paths
# Example: features/F.XXXX.01-feature.md → F.XXXX.01-feature/README.md
```

### Step 8: Clean Up Legacy Directories

After verifying the migration:
```bash
# Remove old flat structure directories
rm -rf features/
rm -rf stories/
rm -rf tasks/
rm -rf atomics/
rm -rf subtasks/  # if it exists
```

### Step 9: Validate Migration

Verify the new structure:
```bash
# Check that all files are in correct locations
find . -name "*.md" | sort

# Verify no broken links
grep -r "\[\[" . | grep -E "\.(md|MD):"
grep -r "\]\(" . | grep -E "\.(md|MD):"

# Test navigation through the hierarchy
ls -la F.XXXX.01-*/
ls -la F.XXXX.01-*/S.*/
ls -la F.XXXX.01-*/S.*/T.*/
```

## Example Migration

### Before (Flat Structure)
```
E.0001-documentation-framework/
├── features/
│   ├── F.0001.01-core-structure.md
│   └── F.0001.02-bookstack-hierarchy.md
├── stories/
│   ├── S.0001.01.01-universal-template.md
│   └── S.0001.01.02-project-overlays.md
├── tasks/
│   ├── T.0001.01.01.01-template-structure.md
│   └── T.0001.01.01.02-validation-system.md
└── atomics/
    ├── A.0001.01.01.01.01.01-read-structure.md
    └── A.0001.01.01.01.01.02-analyze-patterns.md
```

### After (Nested Structure)
```
E.0001-documentation-framework/
├── F.0001.01-core-structure/
│   ├── README.md                    # Content from F.0001.01-core-structure.md
│   ├── S.0001.01.01-universal-template/
│   │   ├── README.md                # Content from S.0001.01.01-universal-template.md
│   │   └── T.0001.01.01.01-template-structure/
│   │       ├── README.md            # Content from T.0001.01.01.01-template-structure.md
│   │       └── ST.0001.01.01.01.01-analyze-existing/
│   │           ├── A.0001.01.01.01.01.01-read-structure.md
│   │           └── A.0001.01.01.01.01.02-analyze-patterns.md
│   └── S.0001.01.02-project-overlays/
│       └── README.md                # Content from S.0001.01.02-project-overlays.md
└── F.0001.02-bookstack-hierarchy/
    └── README.md                    # Content from F.0001.02-bookstack-hierarchy.md
```

## Common Issues and Solutions

### Issue: Atomic Tasks Don't Fit Cleanly into Subtasks
**Solution**: Create logical subtask groupings based on related functionality or implementation phases.

### Issue: Cross-References Are Broken After Migration
**Solution**: Use find/replace to systematically update all path references. Consider using relative paths where possible.

### Issue: Some Tasks Don't Need Full Nested Structure
**Solution**: It's okay to have "thin" levels. A task directory can contain subtasks directly without complex organization.

### Issue: Multiple Features Reference Same Story/Task
**Solution**: Choose the primary feature for the story/task location. Add cross-references in other features' README files.

## Validation Checklist

After migration, verify:
- [ ] All original content is preserved
- [ ] No broken links exist
- [ ] File naming follows E.XXXX.XX.XX.XX.XX.XX pattern
- [ ] Each level has appropriate README.md files
- [ ] Directory structure is logical and navigable
- [ ] Cross-references use correct nested paths
- [ ] Old flat directories are removed
- [ ] Migration is documented in epic workspace

## Rollback Plan

If issues are discovered:
1. Stop using the migrated structure
2. Restore from backup
3. Document issues encountered
4. Revise migration approach
5. Retry migration with corrections

## Next Steps

After successful migration:
1. Update any external references to the epic structure
2. Notify team members of the new organization
3. Update any tooling or scripts that reference the old paths
4. Consider the epic as a template for future nested structures