# 📚 MANDATORY DOCUMENTATION STRUCTURE RULES

## ⚠️ CRITICAL: ALL AGENTS MUST FOLLOW THESE RULES

This document defines the **MANDATORY** documentation structure for the MosAIc SDK project. Failure to follow these rules will result in documentation rejection and CI/CD pipeline failures.

## 🎯 Documentation Hierarchy

ALL documentation MUST follow this 4-level hierarchy:
```
Shelf → Book → Chapter → Page
```

## 📁 File System Structure

Documentation MUST be organized as follows:

```
docs/
├── {shelf-slug}/
│   ├── {book-slug}/
│   │   ├── {chapter-slug}/
│   │   │   ├── 01-{page-slug}.md
│   │   │   ├── 02-{page-slug}.md
│   │   │   └── ...
│   │   └── ...
│   └── ...
└── bookstack/
    └── bookstack-structure.yaml  # DO NOT MODIFY WITHOUT APPROVAL
```

## 📋 Current Documentation Structure

### Shelf: Engineering Documentation
Path: `docs/engineering/`

**Books:**
- `dev-guide/` - Development Guide
  - Chapters: `getting-started/`, `best-practices/`, `debugging/`
- `api-guide/` - API Reference  
  - Chapters: `rest-api/`, `graphql/`, `webhooks/`
- `git-guide/` - Git Workflows
  - Chapters: `workflows/`, `standards/`, `automation/`

### Shelf: Stack Documentation  
Path: `docs/stack/`

**Books:**
- `setup/` - Setup & Installation
  - Chapters: `prerequisites/`, `installation/`, `post-install/`
- `config/` - Configuration Guide
  - Chapters: `environment/`, `services/`, `security/`
- `services/` - Service Documentation
  - Chapters: `core-services/`, `support-services/`, `monitoring/`
- `troubleshooting/` - Troubleshooting Guide
  - Chapters: `common-issues/`, `debugging/`, `recovery/`

### Shelf: Operations Documentation
Path: `docs/operations/`

**Books:**
- `backup/` - Backup Procedures  
  - Chapters: `strategies/`, `implementation/`, `testing/`
- `restore/` - Restore Procedures
  - Chapters: `planning/`, `execution/`, `verification/`
- `monitoring/` - Monitoring & Alerts
  - Chapters: `setup/`, `dashboards/`, `alerts/`
- `runbooks/` - Operational Runbooks
  - Chapters: `routine/`, `emergency/`, `maintenance/`

### Shelf: Project Documentation
Path: `docs/projects/`

**Books:**
- `planning/` - Project Planning
  - Chapters: `methodology/`, `templates/`, `tracking/`
- `architecture/` - Architecture Decisions
  - Chapters: `overview/`, `components/`, `integration/`
- `epics/` - Epic Documentation
  - Chapters: `active/`, `completed/`, `planned/`

## ✅ Page Creation Rules

### 1. File Naming
```bash
# CORRECT ✅
docs/stack/services/core-services/01-gitea.md
docs/stack/services/core-services/02-postgres.md

# WRONG ❌
docs/gitea-setup.md
docs/services/gitea.md
docs/stack/gitea-service.md
```

### 2. Frontmatter Requirements
EVERY markdown file MUST include:

```yaml
---
title: "Page Title"          # REQUIRED
order: 01                    # REQUIRED (numeric)
category: "chapter-slug"     # REQUIRED (matches folder)
tags: ["tag1", "tag2"]       # REQUIRED (minimum 1)
last_updated: "YYYY-MM-DD"   # REQUIRED
author: "agent-name"         # REQUIRED
version: "1.0"              # REQUIRED
status: "draft|published"    # REQUIRED
---
```

### 3. Content Structure
```markdown
# {title}

Brief introduction paragraph.

## Overview
Detailed overview section.

## Main Content
Structured content with proper headings.

## Examples
Code examples and demonstrations.

## Next Steps
Links to related documentation.
```

## 🚫 What NOT to Do

### ❌ DO NOT create files in random locations:
```bash
# ALL OF THESE ARE WRONG:
docs/random-guide.md
docs/new-folder/something.md
docs/misc/notes.md
deployment/docs/guide.md
```

### ❌ DO NOT skip hierarchy levels:
```bash
# WRONG - Missing chapter level:
docs/stack/services/01-gitea.md

# CORRECT:
docs/stack/services/core-services/01-gitea.md
```

### ❌ DO NOT use inconsistent naming:
```bash
# WRONG:
GitEa-Setup.md
gitea setup.md
GITEA_SETUP.MD

# CORRECT:
01-gitea-setup.md
```

## 🔧 How to Add New Documentation

### Step 1: Check if location exists
```bash
# Find the right location in bookstack-structure.yaml
cat docs/bookstack/bookstack-structure.yaml
```

### Step 2: Create in correct location
```bash
# Example: Adding a new Redis setup guide
mkdir -p docs/stack/services/core-services/
echo "---
title: \"Redis Service\"
order: 03
category: \"core-services\"
tags: [\"redis\", \"cache\", \"services\"]
last_updated: \"$(date +%Y-%m-%d)\"
author: \"$USER\"
version: \"1.0\"
status: \"draft\"
---

# Redis Service

Content here..." > docs/stack/services/core-services/03-redis.md
```

### Step 3: Validate structure
```bash
python scripts/validate-bookstack-structure.py docs/
```

## 🚨 Enforcement

### Pre-commit Hook
A pre-commit hook validates all documentation:
```bash
# .git/hooks/pre-commit
#!/bin/bash
python scripts/validate-bookstack-structure.py docs/ || exit 1
```

### CI/CD Pipeline
The Woodpecker pipeline will:
1. Validate structure on every PR
2. Block merge if validation fails
3. Only sync valid documentation to BookStack

### Agent Checklist
Before creating ANY documentation:
- [ ] Check `bookstack-structure.yaml` for correct location
- [ ] Use the 4-level hierarchy (shelf/book/chapter/page)
- [ ] Include all required frontmatter fields
- [ ] Follow naming conventions (lowercase, hyphens, numbered)
- [ ] Run validation script before committing

## 📝 Quick Reference

### Find where to put a document:
```bash
# Search for related terms
grep -r "keyword" docs/bookstack/bookstack-structure.yaml

# List all valid paths
python scripts/list-valid-doc-paths.py
```

### Validate before commit:
```bash
# Validate single file
python scripts/validate-bookstack-structure.py docs/path/to/file.md

# Validate all docs
python scripts/validate-bookstack-structure.py docs/
```

## 🆘 Need Help?

If you need to create documentation that doesn't fit the structure:
1. DO NOT create it in a random location
2. Request structure update in `#mosaic-dev` channel
3. Wait for `bookstack-structure.yaml` to be updated
4. Then create your documentation

## ⚡ Summary

**REMEMBER**: 
- 4 levels: Shelf → Book → Chapter → Page
- Check structure BEFORE creating
- Include ALL frontmatter fields
- Validate BEFORE committing
- NO EXCEPTIONS

This structure ensures our BookStack remains organized and navigable. Chaos will not be tolerated!