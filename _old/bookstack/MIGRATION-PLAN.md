# Documentation Reorganization Plan

## Overview
We need to reorganize 78+ documentation files into the proper BookStack 4-level hierarchy.

## Current Issues
- 142 structure violations
- Files scattered across random locations
- No consistent hierarchy
- Missing frontmatter in many files

## Proposed Organization

### 1. Engineering Documentation (Shelf)
```
docs/engineering/
├── dev-guide/           # Development Guide (Book)
│   ├── getting-started/    # Getting Started (Chapter)
│   │   ├── 01-prerequisites.md ✓
│   │   ├── 02-environment-setup.md ✓
│   │   └── 03-quick-start.md (from development/quick-start.md)
│   ├── best-practices/     # Best Practices (Chapter)
│   │   ├── 01-coding-standards.md ✓
│   │   ├── 02-git-workflow.md (from development/git-workflow.md)
│   │   └── 03-branch-protection.md (from development/branch-protection-rules.md)
│   └── debugging/          # Debugging (Chapter)
│       └── 01-troubleshooting-guide.md (new)
│
├── api-guide/           # API Reference (Book)
│   ├── rest-api/           # REST APIs (Chapter)
│   │   └── 01-api-overview.md (from api/README.md)
│   ├── graphql/            # GraphQL (Chapter)
│   │   └── 01-graphql-guide.md (new)
│   └── webhooks/           # Webhooks (Chapter)
│       └── 01-webhook-reference.md (new)
│
├── git-guide/           # Git Workflows (Book)
│   ├── workflows/          # Workflows (Chapter)
│   │   ├── 01-branching-strategy.md ✓
│   │   └── 02-git-workflow.md (from development/git-workflow.md)
│   ├── standards/          # Standards (Chapter)
│   │   └── 01-commit-messages.md (new)
│   └── automation/         # Automation (Chapter)
│       ├── 01-gitea-setup.md (from services/gitea/README.md)
│       └── 02-gitea-push-guide.md (from development/gitea-push-guide.md)
│
└── ci-cd-guide/         # CI/CD Guide (Book)
    ├── setup/              # Setup (Chapter)
    │   ├── 01-pipeline-setup.md (from cicd-pipeline-implementation.md)
    │   └── 02-woodpecker-config.md (new)
    ├── pipelines/          # Pipelines (Chapter)
    │   ├── 01-pipeline-templates.md (from ci-cd/PIPELINE-TEMPLATES.md)
    │   └── 02-pipeline-workflows.md (from ci-cd/CI-CD-WORKFLOWS.md)
    └── troubleshooting/    # Troubleshooting (Chapter)
        ├── 01-ci-cd-troubleshooting.md (from ci-cd/CI-CD-TROUBLESHOOTING.md)
        └── 02-best-practices.md (from ci-cd/CI-CD-BEST-PRACTICES.md)
```

### 2. Stack Documentation (Shelf)
```
docs/stack/
├── setup/               # Setup & Installation (Book)
│   ├── prerequisites/      # Prerequisites (Chapter)
│   │   └── 01-system-requirements.md (new)
│   ├── installation/       # Installation (Chapter)
│   │   ├── 01-complete-guide.md (from deployment/complete-deployment-guide.md)
│   │   ├── 02-portainer-setup.md (from deployment/portainer-deployment-guide.md)
│   │   └── 03-nginx-setup.md (from deployment/nginx-proxy-manager-setup.md)
│   └── post-install/       # Post Installation (Chapter)
│       └── 01-verification.md (new)
│
├── config/              # Configuration Guide (Book)
│   ├── environment/        # Environment (Chapter)
│   │   └── 01-environment-variables.md ✓
│   ├── services/           # Services (Chapter)
│   │   └── 01-service-config.md (new)
│   └── security/           # Security (Chapter)
│       └── 01-security-config.md (from architecture/security-architecture.md)
│
├── services/            # Service Documentation (Book)
│   ├── core-services/      # Core Services (Chapter)
│   │   ├── 01-gitea.md ✓
│   │   ├── 02-postgres.md (new)
│   │   └── 03-redis.md (new)
│   ├── support-services/   # Support Services (Chapter)
│   │   └── 01-bookstack.md (new)
│   └── monitoring/         # Monitoring (Chapter)
│       └── 01-prometheus.md (new)
│
├── architecture/        # Architecture (Book)
│   ├── overview/           # Overview (Chapter)
│   │   ├── 01-system-architecture.md (from architecture.md)
│   │   └── 02-mosaic-overview.md (from overview.md)
│   ├── components/         # Components (Chapter)
│   │   ├── 01-service-dependencies.md (from architecture/service-dependencies.md)
│   │   └── 02-component-milestones.md (from component-milestones.md)
│   └── integration/        # Integration (Chapter)
│       ├── 01-data-flow.md (from architecture/data-flow.md)
│       └── 02-network-topology.md (from architecture/network-topology.md)
│
└── troubleshooting/     # Troubleshooting Guide (Book)
    ├── common-issues/      # Common Issues (Chapter)
    │   ├── 01-service-startup.md ✓
    │   └── 02-common-problems.md (from troubleshooting/common-issues.md)
    ├── debugging/          # Debugging (Chapter)
    │   └── 01-debug-guide.md (new)
    └── recovery/           # Recovery (Chapter)
        └── 01-disaster-recovery.md (from operations/disaster-recovery-plan.md)
```

### 3. Operations Documentation (Shelf)
```
docs/operations/
├── backup/              # Backup Procedures (Book)
│   ├── strategies/         # Strategies (Chapter)
│   │   └── 01-backup-overview.md ✓
│   ├── implementation/     # Implementation (Chapter)
│   │   └── 01-backup-operations.md (from operations/backup-restore-operations.md)
│   └── testing/            # Testing (Chapter)
│       └── 01-backup-testing.md (new)
│
├── restore/             # Restore Procedures (Book)
│   ├── planning/           # Planning (Chapter)
│   │   └── 01-restore-planning.md (new)
│   ├── execution/          # Execution (Chapter)
│   │   └── 01-restore-execution.md (new)
│   └── verification/       # Verification (Chapter)
│       └── 01-restore-verification.md (new)
│
├── monitoring/          # Monitoring & Alerts (Book)
│   ├── setup/              # Setup (Chapter)
│   │   └── 01-monitoring-setup.md (new)
│   ├── dashboards/         # Dashboards (Chapter)
│   │   └── 01-grafana-dashboards.md (new)
│   └── alerts/             # Alerts (Chapter)
│       └── 01-alert-configuration.md (new)
│
└── runbooks/            # Operational Runbooks (Book)
    ├── routine/            # Routine (Chapter)
    │   ├── 01-service-startup.md (from operations/service-startup-procedures.md)
    │   └── 02-service-shutdown.md (from operations/service-shutdown-procedures.md)
    ├── emergency/          # Emergency (Chapter)
    │   └── 01-incident-response.md (from operations/incident-response-procedures.md)
    └── maintenance/        # Maintenance (Chapter)
        └── 01-maintenance-procedures.md (new)
```

### 4. Project Documentation (Shelf)
```
docs/projects/
├── planning/            # Project Planning (Book)
│   ├── methodology/        # Methodology (Chapter)
│   │   └── 01-project-overview.md ✓
│   ├── templates/          # Templates (Chapter)
│   │   └── 01-planning-templates.md (new)
│   └── tracking/           # Tracking (Chapter)
│       └── 01-progress-tracking.md (new)
│
├── architecture/        # Architecture Decisions (Book)
│   ├── overview/           # Overview (Chapter)
│   │   └── 01-architecture-decisions.md (new)
│   ├── components/         # Components (Chapter)
│   │   └── 01-component-design.md (new)
│   └── integration/        # Integration (Chapter)
│       └── 01-integration-patterns.md (new)
│
└── epics/               # Epic Documentation (Book)
    ├── active/             # Active (Chapter)
    │   ├── 01-E055-progress.md (from agent-management/tech-lead-tony/E055-PROGRESS.md)
    │   ├── 02-E055-assignments.md (from agent-management/tech-lead-tony/E055-AGENT-ASSIGNMENTS.md)
    │   └── 03-E057-mcp-integration.md (from task-management/active/E.057-MCP-INTEGRATION-PROGRESS.md)
    ├── completed/          # Completed (Chapter)
    │   └── 01-completed-epics.md (new)
    └── planned/            # Planned (Chapter)
        └── 01-roadmap.md (from version-roadmap.md)
```

## Migration Steps

### Step 1: Backup Current Structure
```bash
# Create backup
tar -czf docs-backup-$(date +%Y%m%d-%H%M%S).tar.gz docs/
```

### Step 2: Create Directory Structure
```bash
# Already done with --create-dirs
```

### Step 3: Execute Migration (Manual Review Recommended)
Instead of automated migration, I recommend:

1. **Manual Migration by Category**
   - Move CI/CD docs → engineering/ci-cd-guide/
   - Move deployment docs → stack/setup/
   - Move architecture docs → stack/architecture/
   - Move operations docs → operations/ (correct shelf)
   - Move agent/task management → projects/epics/

2. **Add Frontmatter to All Files**
   Each file needs:
   ```yaml
   ---
   title: "Page Title"
   order: 01
   category: "chapter-name"
   tags: ["tag1", "tag2"]
   last_updated: "2025-01-19"
   author: "migration"
   version: "1.0"
   status: "published"
   ---
   ```

3. **Update File Names**
   - Add numeric prefix: 01-, 02-, 03-, etc.
   - Convert to lowercase with hyphens
   - Remove special characters

### Step 4: Handle Special Cases

#### MCP Integration Docs
Move to: `stack/integration/mcp/`
- All files from `mcp-integration/`
- All E.057 task files

#### Orchestration Docs  
Split between:
- Technical → `stack/architecture/orchestration/`
- Planning → `projects/architecture/orchestration/`

#### Migration Docs
Move to: `projects/migrations/mosaic-transition/`
- tony-sdk-to-mosaic-sdk.md
- package-namespace-changes.md

### Step 5: Validation
```bash
# Validate structure
python3 scripts/validate-bookstack-structure.py docs/

# Check for missing frontmatter
find docs -name "*.md" -type f | while read file; do
    if ! grep -q "^title:" "$file"; then
        echo "Missing frontmatter: $file"
    fi
done
```

### Step 6: Update References
- Update all internal links
- Update README files
- Update CI/CD pipelines
- Update any hardcoded paths

## Recommended Approach

Given the complexity, I recommend:

1. **Start Fresh** - Move docs one category at a time
2. **Add Frontmatter** - As you move each file
3. **Validate Often** - Run validation after each category
4. **Test Sync** - Try BookStack sync with a few files first
5. **Document Changes** - Keep a log of what moved where

## Timeline Estimate
- Backup: 5 minutes
- Manual migration: 2-3 hours
- Frontmatter addition: 1-2 hours  
- Validation & testing: 1 hour
- Total: ~5 hours

This manual approach ensures:
- Proper categorization
- Correct frontmatter
- No broken links
- Clean structure for BookStack