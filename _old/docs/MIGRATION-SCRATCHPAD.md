# Documentation Migration Scratchpad

## Migration Status Tracking
**Started**: 2025-01-19 15:30 UTC
**Total Files**: 81 remaining in docs/_old
**Processed**: 0
**Errors**: 0

## Processing Rules
1. Parse file content and frontmatter
2. Determine best destination based on:
   - Original path
   - Content analysis
   - Keywords
3. Check if destination is stub or has content
4. Merge appropriately
5. Move original to _moved
6. Update this scratchpad

## Category Mappings

### Engineering Documentation
- `ci-cd/*` → `engineering/cicd-handbook/`
- `development/*` → `engineering/getting-started/`
- `api/*` → `engineering/api-documentation/`
- Git-related → `engineering/getting-started/development-workflow/`

### Platform Documentation  
- `deployment/*` → `platform/installation/deployment/`
- `services/*` → `platform/services/`
- `operations/*` → `platform/operations/`
- `stack/*` → `platform/services/` or `platform/installation/`

### Project Documentation
- `agent-management/*` → `projects/project-management/active-epics/`
- `task-management/*` → `projects/project-management/active-epics/`
- `architecture/*` → `projects/architecture/`
- `migration/*` → `projects/migrations/`
- `mosaic-stack/*` → `projects/architecture/system-architecture/`

### Learning Documentation
- `troubleshooting/*` → `learning/troubleshooting/`
- Best practices → `learning/best-practices/`
- References → `learning/reference/`

## Files to Process
[Will be updated as we process]

## Processing Log
[timestamp] [file] → [destination] [status][2025-07-19 15:24:59] [architecture.md] → [projects/architecture/system-architecture/01-overview.md] [SUCCESS]
[2025-07-19 15:24:59] [component-milestones.md] → [projects/project-management/planning-methodology/01-project-planning.md] [SUCCESS]
[2025-07-19 15:24:59] [documentation-index.md] → [learning/reference/configuration/01-environment-variables.md] [SUCCESS]
[2025-07-19 15:24:59] [cicd-pipeline-implementation.md] → [engineering/cicd-handbook/pipeline-setup/02-pipeline-basics.md] [SUCCESS]
[2025-07-19 15:24:59] [overview.md] → [SKIPPED] [NO_DESTINATION]
[2025-07-19 15:26:30] [overview.md] → [SKIPPED] [NO_DESTINATION]
[2025-07-19 15:26:30] [EPIC-E.055-BREAKDOWN.md] → [projects/project-management/active-epics/01-epic-e055-mosaic-stack.md] [SUCCESS]
[2025-07-19 15:26:30] [version-roadmap.md] → [projects/project-management/planning-methodology/01-project-planning.md] [SUCCESS]
[2025-07-19 15:26:30] [README.md] → [SKIPPED] [NO_DESTINATION]
[2025-07-19 15:26:30] [migration/tony-sdk-to-mosaic-sdk.md] → [projects/migrations/tony-to-mosaic/01-migration-overview.md] [SUCCESS]
[2025-07-19 15:26:30] [migration/package-namespace-changes.md] → [projects/migrations/tony-to-mosaic/02-namespace-changes.md] [SUCCESS]
[2025-07-19 15:26:30] [_moved/architecture.md] → [projects/architecture/system-architecture/01-overview.md] [SUCCESS]
[2025-07-19 15:26:30] [_moved/component-milestones.md] → [projects/project-management/planning-methodology/01-project-planning.md] [SUCCESS]
[2025-07-19 15:26:30] [_moved/documentation-index.md] → [learning/reference/configuration/01-environment-variables.md] [SUCCESS]
[2025-07-19 15:26:30] [_moved/cicd-pipeline-implementation.md] → [engineering/cicd-handbook/pipeline-setup/02-pipeline-basics.md] [SUCCESS]
[2025-07-19 15:26:30] [_moved/cicd/CI-CD-TROUBLESHOOTING.md] → [engineering/cicd-handbook/best-practices/03-troubleshooting.md] [SUCCESS]
[2025-07-19 15:26:30] [_moved/cicd/CI-CD-WORKFLOWS.md] → [engineering/cicd-handbook/advanced-pipelines/02-conditional-workflows.md] [SUCCESS]
[2025-07-19 15:26:30] [_moved/cicd/CI-CD-BEST-PRACTICES.md] → [engineering/cicd-handbook/best-practices/01-cicd-patterns.md] [SUCCESS]
[2025-07-19 15:26:30] [_moved/cicd/PIPELINE-TEMPLATES.md] → [engineering/cicd-handbook/pipeline-setup/03-pipeline-templates.md] [SUCCESS]
[2025-07-19 15:26:30] [operations/backup-restore-operations.md] → [platform/operations/backup-recovery/02-backup-procedures.md] [SUCCESS]
[2025-07-19 15:26:30] [operations/service-startup-procedures.md] → [platform/operations/routine-operations/01-startup-procedures.md] [SUCCESS]
[2025-07-19 15:26:30] [operations/incident-response-procedures.md] → [platform/operations/incident-response/01-incident-handling.md] [SUCCESS]
[2025-07-19 15:26:30] [operations/disaster-recovery-plan.md] → [platform/operations/backup-recovery/04-disaster-recovery.md] [SUCCESS]
[2025-07-19 15:26:30] [operations/handbook.md] → [platform/operations/routine-operations/02-service-management.md] [SUCCESS]
[2025-07-19 15:26:30] [operations/service-shutdown-procedures.md] → [platform/operations/routine-operations/02-shutdown-procedures.md] [SUCCESS]
[2025-07-19 15:45:35] [overview.md] → [SKIPPED] [NO_DESTINATION]
[2025-07-19 15:45:35] [README.md] → [SKIPPED] [NO_DESTINATION]
[2025-07-19 15:45:35] [operations/backup/01-backup-overview.md] → [platform/operations/backup-recovery/01-backup-strategy.md] [SUCCESS]
[2025-07-19 15:45:35] [git/private-repo-setup.md] → [SKIPPED] [NO_DESTINATION]
[2025-07-19 15:45:35] [mcp-integration/TONY-2.8.0-MCP-INTEGRATION.md] → [engineering/api-documentation/mcp-protocol/02-mcp-integration.md] [SUCCESS]
[2025-07-19 15:45:35] [mcp-integration/MIGRATION-GUIDE-2.7-TO-2.8.md] → [engineering/api-documentation/mcp-protocol/02-mcp-integration.md] [SUCCESS]
[2025-07-19 15:45:35] [mcp-integration/REMAINING-WORK-SPEC.md] → [engineering/api-documentation/mcp-protocol/02-mcp-integration.md] [SUCCESS]
[2025-07-19 15:45:35] [mcp-integration/IMPLEMENTATION-SUMMARY.md] → [engineering/api-documentation/mcp-protocol/02-mcp-integration.md] [SUCCESS]
[2025-07-19 15:45:35] [mcp-integration/QUICK-REFERENCE.md] → [engineering/api-documentation/mcp-protocol/02-mcp-integration.md] [SUCCESS]
[2025-07-19 15:45:35] [task-management/planning/E055-QA-REMEDIATION-PLAN.md] → [projects/project-management/active-epics/01-epic-e055-mosaic-stack.md] [SUCCESS]
[2025-07-19 15:45:35] [task-management/planning/E.057-MCP-INTEGRATION-STRATEGY.md] → [engineering/api-documentation/mcp-protocol/02-mcp-integration.md] [SUCCESS]
[2025-07-19 15:45:35] [task-management/active/E055-QA-REMEDIATION-BRIEF.md] → [projects/project-management/active-epics/01-epic-e055-mosaic-stack.md] [SUCCESS]
[2025-07-19 15:45:35] [task-management/active/E.057-MCP-INTEGRATION-PROGRESS.md] → [engineering/api-documentation/mcp-protocol/02-mcp-integration.md] [SUCCESS]
[2025-07-19 15:45:35] [task-management/active/E055-QA-REMEDIATION-TRACKER.md] → [projects/project-management/active-epics/01-epic-e055-mosaic-stack.md] [SUCCESS]
[2025-07-19 15:45:35] [task-management/active/E055-VULNERABILITY-REFERENCE.md] → [projects/project-management/active-epics/01-epic-e055-mosaic-stack.md] [SUCCESS]
[2025-07-19 15:45:35] [deployment/nginx-proxy-manager-setup.md] → [platform/installation/deployment/04-nginx-setup.md] [SUCCESS]
[2025-07-19 15:45:35] [deployment/portainer-deployment-guide.md] → [platform/installation/deployment/03-portainer-setup.md] [SUCCESS]
[2025-07-19 15:45:35] [deployment/complete-deployment-guide.md] → [platform/installation/deployment/01-complete-guide.md] [SUCCESS]
[2025-07-19 15:45:35] [api/README.md] → [engineering/api-documentation/rest-apis/01-api-overview.md] [SUCCESS]
[2025-07-19 15:45:35] [projects/planning/01-project-overview.md] → [projects/project-management/planning-methodology/01-project-planning.md] [SUCCESS]
[2025-07-19 15:45:35] [development/gitea-push-guide.md] → [engineering/getting-started/development-workflow/01-git-workflow.md] [SUCCESS]
[2025-07-19 15:45:35] [development/quick-start.md] → [engineering/getting-started/quick-start/01-first-project.md] [SUCCESS]
[2025-07-19 15:45:35] [development/worktrees-guide.md] → [engineering/getting-started/development-workflow/01-git-workflow.md] [SUCCESS]
[2025-07-19 15:45:35] [development/git-workflow.md] → [engineering/getting-started/development-workflow/01-git-workflow.md] [SUCCESS]
[2025-07-19 15:45:35] [development/branch-protection-rules.md] → [engineering/getting-started/development-workflow/02-branch-protection.md] [SUCCESS]
[2025-07-19 15:45:35] [development/isolated-environment.md] → [engineering/getting-started/quick-start/03-isolated-environment.md] [SUCCESS]
[2025-07-19 15:45:35] [agent-management/tech-lead-tony/E055-QA-REMEDIATION-PLAN.md] → [projects/project-management/active-epics/01-epic-e055-mosaic-stack.md] [SUCCESS]
[2025-07-19 15:45:35] [agent-management/tech-lead-tony/E055-CORE-DECOMPOSITION.md] → [projects/project-management/active-epics/01-epic-e055-mosaic-stack.md] [SUCCESS]
[2025-07-19 15:45:35] [agent-management/tech-lead-tony/E055-QA-REMEDIATION-TRACKER.md] → [projects/project-management/active-epics/01-epic-e055-mosaic-stack.md] [SUCCESS]
[2025-07-19 15:45:35] [agent-management/tech-lead-tony/E055-PROGRESS.md] → [projects/project-management/active-epics/01-epic-e055-mosaic-stack.md] [SUCCESS]
[2025-07-19 15:45:44] [overview.md] → [SKIPPED] [NO_DESTINATION]
[2025-07-19 15:45:44] [README.md] → [SKIPPED] [NO_DESTINATION]
[2025-07-19 15:45:44] [git/private-repo-setup.md] → [SKIPPED] [NO_DESTINATION]
[2025-07-19 15:45:44] [agent-management/tech-lead-tony/QA-REPORT-E055-CORE.md] → [projects/project-management/active-epics/01-epic-e055-mosaic-stack.md] [SUCCESS]
[2025-07-19 15:45:44] [agent-management/tech-lead-tony/E055-AGENT-ASSIGNMENTS.md] → [projects/project-management/active-epics/01-epic-e055-mosaic-stack.md] [SUCCESS]
[2025-07-19 15:45:44] [orchestration/INTELLIGENT-ROUTING-SYSTEM.md] → [projects/architecture/integration-patterns/02-api-gateway.md] [SUCCESS]
[2025-07-19 15:45:44] [orchestration/ARCHITECTURE-DIAGRAMS.md] → [projects/architecture/system-architecture/01-overview.md] [SUCCESS]
[2025-07-19 15:45:44] [orchestration/BENEFITS-AND-USE-CASES.md] → [projects/architecture/integration-patterns/03-event-driven.md] [SUCCESS]
[2025-07-19 15:45:44] [orchestration/SERVICE-PROVIDER-SPECIFICATIONS.md] → [projects/architecture/integration-patterns/03-event-driven.md] [SUCCESS]
[2025-07-19 15:45:44] [orchestration/EXECUTIVE-SUMMARY.md] → [projects/architecture/integration-patterns/03-event-driven.md] [SUCCESS]
[2025-07-19 15:45:44] [orchestration/PLUGIN-SYSTEM-DESIGN.md] → [projects/architecture/integration-patterns/01-service-mesh.md] [SUCCESS]
[2025-07-19 15:45:44] [orchestration/IMPLEMENTATION-PHASES.md] → [projects/architecture/integration-patterns/03-event-driven.md] [SUCCESS]
[2025-07-19 15:45:44] [orchestration/ORCHESTRATION-ARCHITECTURE-EVOLUTION.md] → [projects/architecture/system-architecture/01-overview.md] [SUCCESS]
[2025-07-19 15:45:44] [orchestration/README.md] → [projects/architecture/integration-patterns/03-event-driven.md] [SUCCESS]
[2025-07-19 15:45:44] [services/gitea/README.md] → [platform/services/core-services/01-gitea.md] [SUCCESS]
[2025-07-19 15:45:44] [stack/services/01-gitea.md] → [platform/services/core-services/01-gitea.md] [SUCCESS]
[2025-07-19 15:45:44] [stack/config/01-environment-variables.md] → [platform/installation/configuration/01-environment-variables.md] [SUCCESS]
[2025-07-19 15:45:44] [stack/troubleshooting/common-issues/01-service-startup.md] → [learning/troubleshooting/common-issues/01-service-startup.md] [SUCCESS]
[2025-07-19 15:45:44] [engineering/git-guide/workflows/01-branching-strategy.md] → [SKIPPED] [NO_DESTINATION]
[2025-07-19 15:45:44] [engineering/dev-guide/getting-started/02-environment-setup.md] → [engineering/getting-started/quick-start/01-first-project.md] [SUCCESS]
[2025-07-19 15:45:44] [engineering/dev-guide/getting-started/01-prerequisites.md] → [engineering/getting-started/quick-start/01-first-project.md] [SUCCESS]
[2025-07-19 15:45:44] [engineering/dev-guide/best-practices/01-coding-standards.md] → [engineering/getting-started/prerequisites/01-system-requirements.md] [SUCCESS]
[2025-07-19 15:45:44] [mosaic-stack/architecture.md] → [platform/services/core-services/01-gitea.md] [SUCCESS]
[2025-07-19 15:45:44] [mosaic-stack/component-milestones.md] → [platform/services/core-services/01-gitea.md] [SUCCESS]
[2025-07-19 15:45:44] [mosaic-stack/overview.md] → [platform/services/core-services/01-gitea.md] [SUCCESS]
[2025-07-19 15:45:44] [mosaic-stack/EPIC-E.055-BREAKDOWN.md] → [platform/services/core-services/01-gitea.md] [SUCCESS]
[2025-07-19 15:45:44] [mosaic-stack/version-roadmap.md] → [platform/services/core-services/01-gitea.md] [SUCCESS]
[2025-07-19 15:45:44] [bookstack/ENFORCEMENT-SUMMARY.md] → [platform/services/core-services/01-gitea.md] [SUCCESS]
[2025-07-19 15:45:44] [bookstack/MIGRATION-PLAN.md] → [platform/services/core-services/01-gitea.md] [SUCCESS]
[2025-07-19 15:45:44] [bookstack/SYNC-IMPLEMENTATION.md] → [platform/services/core-services/01-gitea.md] [SUCCESS]
[2025-07-19 15:45:44] [bookstack/templates/runbook-template.md] → [platform/services/core-services/01-gitea.md] [SUCCESS]
[2025-07-19 15:45:44] [bookstack/templates/api-template.md] → [engineering/api-documentation/rest-apis/01-api-overview.md] [SUCCESS]
[2025-07-19 15:45:44] [bookstack/templates/page-template.md] → [platform/services/core-services/01-gitea.md] [SUCCESS]
[2025-07-19 15:45:44] [bookstack/templates/README.md] → [platform/services/core-services/01-gitea.md] [SUCCESS]
[2025-07-19 15:45:44] [architecture/service-dependencies.md] → [projects/architecture/system-architecture/02-component-design.md] [SUCCESS]
[2025-07-19 15:45:44] [architecture/data-flow.md] → [projects/architecture/system-architecture/03-data-flow.md] [SUCCESS]
[2025-07-19 15:45:44] [architecture/overview.md] → [projects/architecture/system-architecture/01-overview.md] [SUCCESS]
[2025-07-19 15:45:44] [architecture/network-topology.md] → [projects/architecture/system-architecture/04-network-topology.md] [SUCCESS]
[2025-07-19 15:45:44] [architecture/security-architecture.md] → [projects/architecture/security-architecture/01-security-model.md] [SUCCESS]
[2025-07-19 15:45:44] [troubleshooting/common-issues.md] → [learning/troubleshooting/common-issues/01-service-startup.md] [SUCCESS]
