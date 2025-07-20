# Universal Tech Lead Tony Commands

## Atomic Task Coordination Commands

### Primary Deployment Commands

#### `/atomic-deploy <task-description>`
Deploy specialized agent for single atomic task
- **Usage**: `/atomic-deploy "Fix JWT secret validation in auth service"`
- **Requirements**: Task must be atomic (5-10 minutes scope)
- **Output**: Agent deployment with focused tool authorization

#### `/task-decompose <complex-request>`
Break down complex request into atomic tasks
- **Usage**: `/task-decompose "Implement user management system"`
- **Output**: Ordered list of atomic tasks with dependencies
- **Follow-up**: Individual `/atomic-deploy` for each task

#### `/atomic-status`
Show status of all deployed atomic task agents
- **Output**: Agent ID, task description, status, elapsed time
- **Alerts**: Command fatigue warnings for agents exceeding limits

### Quality Assurance Commands

#### `/atomic-validate <agent-id>`
Validate atomic task completion
- **Checks**: Success criteria met, no scope creep, clean completion
- **Output**: Pass/fail with specific validation results

#### `/session-health`
Monitor atomic task session health
- **Metrics**: Tool invocation counts, context usage, success rates
- **Alerts**: Command fatigue warnings, efficiency recommendations

### Emergency Commands

#### `/atomic-escalate <agent-id> <reason>`
Escalate failed or stuck atomic task
- **Triggers**: Task expansion, complexity growth, failure cascades
- **Actions**: Task reassessment, re-decomposition, specialist deployment

#### `/atomic-abort <agent-id>`
Abort atomic task agent safely
- **Preserves**: Progress state, context for handoff
- **Cleanup**: Release resources, update task queue

### Coordination Commands

#### `/atomic-sequence <task-list>`
Sequence multiple atomic tasks with dependencies
- **Input**: JSON task list with dependency mapping
- **Output**: Ordered execution plan with parallel opportunities

#### `/atomic-parallel <task-list>`
Deploy multiple independent atomic tasks concurrently
- **Limit**: Maximum 5 concurrent agents (performance standard)
- **Monitoring**: Real-time status dashboard

### Reporting Commands

#### `/atomic-report`
Generate atomic task architecture performance report
- **Metrics**: Success rates, average completion times, efficiency gains
- **Insights**: Optimization recommendations, pattern analysis

#### `/atomic-audit <date-range>`
Audit atomic task deployments for period
- **Output**: Task breakdown analysis, agent utilization, quality metrics
- **Compliance**: Healthcare/security audit trail requirements

## Integration Patterns

### Claude Code Integration
```bash
# Atomic task with specific tool authorization
/atomic-deploy "Update package.json dependencies" --allowedTools="Edit,Bash,Read"

# Research task with search tools
/atomic-deploy "Find authentication vulnerabilities" --allowedTools="Grep,Glob,Read"

# Implementation task with comprehensive tools
/atomic-deploy "Fix CORS configuration" --allowedTools="Edit,Read,Bash,MultiEdit"
```

### Healthcare Compliance Integration
```bash
# HIPAA-compliant atomic tasks
/atomic-deploy "Rotate PHI encryption keys" --compliance="HIPAA" --audit="required"

# Emergency access atomic task
/atomic-deploy "Enable emergency patient access" --priority="critical" --emergency="true"
```

### Multi-Agent Orchestration
```bash
# Parallel atomic deployment
/atomic-parallel [
  "Run security scan on auth module",
  "Update API documentation", 
  "Fix TypeScript errors in components"
]

# Sequential atomic deployment
/atomic-sequence [
  {"task": "Backup database", "deps": []},
  {"task": "Run migrations", "deps": ["Backup database"]},
  {"task": "Update schema docs", "deps": ["Run migrations"]}
]
```

## Command Aliases

### Quick Deployment
- `/atom` → `/atomic-deploy`
- `/decomp` → `/task-decompose`
- `/status` → `/atomic-status`
- `/health` → `/session-health`

### Emergency Shortcuts
- `/abort` → `/atomic-abort`
- `/escalate` → `/atomic-escalate`
- `/emergency` → `/atomic-deploy --priority="critical"`

## Best Practices

### Task Definition Guidelines
1. **Verb + Object + Context**: "Fix JWT validation in auth.service.ts"
2. **Success Criteria**: Include clear completion definition
3. **Scope Boundaries**: Explicitly state what is NOT included
4. **Time Estimate**: Indicate expected duration (must be ≤10 minutes)

### Agent Management
1. **Monitor Actively**: Check `/atomic-status` every 2-3 minutes
2. **Prevent Fatigue**: Abort agents approaching 10 tool invocations
3. **Clean Handoffs**: Use `/atomic-validate` before proceeding
4. **Document Results**: Record atomic task outcomes for future reference

**Version**: 1.0.0
**Compatibility**: Universal (all project types)
**Last Updated**: 2025-06-28