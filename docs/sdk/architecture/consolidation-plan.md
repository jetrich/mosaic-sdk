# Documentation Consolidation Plan

## Summary
Total files to consolidate: 85

## Consolidation Strategy

### Deployment (25 files)
**Target**: `platform/installation/deployment`
**Description**: Installation and deployment guides

**Files to consolidate**:
- `README.md`
- `bookstack/ENFORCEMENT-SUMMARY.md`
- `bookstack/MIGRATION-PLAN.md`
- `bookstack/templates/runbook-template.md`
- `component-milestones.md`
- `deployment/complete-deployment-guide.md`
- `deployment/nginx-proxy-manager-setup.md`
- `deployment/portainer-deployment-guide.md`
- `documentation-index.md`
- `engineering/dev-guide/best-practices/01-coding-standards.md`
- `engineering/dev-guide/getting-started/01-prerequisites.md`
- `engineering/dev-guide/getting-started/02-environment-setup.md`
- `mosaic-stack/component-milestones.md`
- `mosaic-stack/overview.md`
- `mosaic-stack/version-roadmap.md`
- `orchestration/ARCHITECTURE-DIAGRAMS.md`
- `orchestration/BENEFITS-AND-USE-CASES.md`
- `orchestration/IMPLEMENTATION-PHASES.md`
- `orchestration/ORCHESTRATION-ARCHITECTURE-EVOLUTION.md`
- `orchestration/PLUGIN-SYSTEM-DESIGN.md`
- `orchestration/SERVICE-PROVIDER-SPECIFICATIONS.md`
- `overview.md`
- `projects/planning/01-project-overview.md`
- `stack/config/01-environment-variables.md`
- `version-roadmap.md`

**Consolidation approach**:
- Merge all deployment guides into comprehensive installation guide
- Create separate pages for Docker, Portainer, and NPM setup
- Extract prerequisites into planning chapter

### Cicd (9 files)
**Target**: `engineering/cicd-handbook`
**Description**: CI/CD pipelines and workflows

**Files to consolidate**:
- `bookstack/SYNC-IMPLEMENTATION.md`
- `bookstack/templates/README.md`
- `ci-cd/CI-CD-BEST-PRACTICES.md`
- `ci-cd/CI-CD-TROUBLESHOOTING.md`
- `ci-cd/CI-CD-WORKFLOWS.md`
- `ci-cd/PIPELINE-TEMPLATES.md`
- `cicd-pipeline-implementation.md`
- `orchestration/EXECUTIVE-SUMMARY.md`
- `orchestration/README.md`

**Consolidation approach**:
- Organize by complexity: basic → advanced → best practices
- Extract pipeline templates into reusable examples
- Create troubleshooting section from CI/CD issues

### Operations (7 files)
**Target**: `platform/operations`
**Description**: Operational procedures and runbooks

**Files to consolidate**:
- `operations/backup-restore-operations.md`
- `operations/backup/01-backup-overview.md`
- `operations/disaster-recovery-plan.md`
- `operations/handbook.md`
- `operations/incident-response-procedures.md`
- `operations/service-shutdown-procedures.md`
- `operations/service-startup-procedures.md`

**Consolidation approach**:
- Group by frequency: routine → backup/restore → incident
- Create runbook format for consistency
- Extract disaster recovery into separate comprehensive guide

### Architecture (8 files)
**Target**: `projects/architecture`
**Description**: Architecture and design documents

**Files to consolidate**:
- `architecture.md`
- `architecture/data-flow.md`
- `architecture/network-topology.md`
- `architecture/overview.md`
- `architecture/security-architecture.md`
- `architecture/service-dependencies.md`
- `mosaic-stack/architecture.md`
- `orchestration/INTELLIGENT-ROUTING-SYSTEM.md`

**Consolidation approach**:

### Api (2 files)
**Target**: `engineering/api-documentation`
**Description**: API documentation

**Files to consolidate**:
- `api/README.md`
- `bookstack/templates/api-template.md`

**Consolidation approach**:

### Development (11 files)
**Target**: `engineering/getting-started`
**Description**: Development guides and workflows

**Files to consolidate**:
- `bookstack/templates/page-template.md`
- `development/branch-protection-rules.md`
- `development/git-workflow.md`
- `development/gitea-push-guide.md`
- `development/isolated-environment.md`
- `development/quick-start.md`
- `development/worktrees-guide.md`
- `engineering/git-guide/workflows/01-branching-strategy.md`
- `git/private-repo-setup.md`
- `services/gitea/README.md`
- `stack/services/01-gitea.md`

**Consolidation approach**:

### Epics (12 files)
**Target**: `projects/project-management/active-epics`
**Description**: Epic and task tracking

**Files to consolidate**:
- `EPIC-E.055-BREAKDOWN.md`
- `agent-management/tech-lead-tony/E055-AGENT-ASSIGNMENTS.md`
- `agent-management/tech-lead-tony/E055-CORE-DECOMPOSITION.md`
- `agent-management/tech-lead-tony/E055-PROGRESS.md`
- `agent-management/tech-lead-tony/E055-QA-REMEDIATION-PLAN.md`
- `agent-management/tech-lead-tony/E055-QA-REMEDIATION-TRACKER.md`
- `agent-management/tech-lead-tony/QA-REPORT-E055-CORE.md`
- `mosaic-stack/EPIC-E.055-BREAKDOWN.md`
- `task-management/active/E055-QA-REMEDIATION-BRIEF.md`
- `task-management/active/E055-QA-REMEDIATION-TRACKER.md`
- `task-management/active/E055-VULNERABILITY-REFERENCE.md`
- `task-management/planning/E055-QA-REMEDIATION-PLAN.md`

**Consolidation approach**:
- One page per epic with current status
- Extract completed work to archive
- Create summary dashboard page

### Migration (2 files)
**Target**: `projects/migrations`
**Description**: Migration guides

**Files to consolidate**:
- `migration/package-namespace-changes.md`
- `migration/tony-sdk-to-mosaic-sdk.md`

**Consolidation approach**:

### Mcp (7 files)
**Target**: `engineering/api-documentation/mcp-protocol`
**Description**: MCP integration documentation

**Files to consolidate**:
- `mcp-integration/IMPLEMENTATION-SUMMARY.md`
- `mcp-integration/MIGRATION-GUIDE-2.7-TO-2.8.md`
- `mcp-integration/QUICK-REFERENCE.md`
- `mcp-integration/REMAINING-WORK-SPEC.md`
- `mcp-integration/TONY-2.8.0-MCP-INTEGRATION.md`
- `task-management/active/E.057-MCP-INTEGRATION-PROGRESS.md`
- `task-management/planning/E.057-MCP-INTEGRATION-STRATEGY.md`

**Consolidation approach**:
- Create comprehensive MCP integration guide
- Extract quick reference as separate page
- Document migration path from non-MCP to MCP

### Troubleshooting (2 files)
**Target**: `learning/troubleshooting`
**Description**: Troubleshooting guides

**Files to consolidate**:
- `stack/troubleshooting/common-issues/01-service-startup.md`
- `troubleshooting/common-issues.md`

**Consolidation approach**:
