# OpenCode Integration Examples

This document provides comprehensive, real-world examples of using the MosAIc MCP Orchestrator with OpenCode.

## Table of Contents

- [Basic Setup and Configuration](#basic-setup-and-configuration)
- [Task Management Workflows](#task-management-workflows)
- [Multi-Agent Development Teams](#multi-agent-development-teams)
- [Complex Workflow Orchestration](#complex-workflow-orchestration)
- [Project Management Scenarios](#project-management-scenarios)
- [Resource Management and Monitoring](#resource-management-and-monitoring)
- [Enterprise Integration Patterns](#enterprise-integration-patterns)

---

## Basic Setup and Configuration

### 1. Initial OpenCode Configuration

**File**: `~/.config/opencode/config.json`

```json
{
  "mcpServers": {
    "mosaic": {
      "command": "mosaic-mcp",
      "args": ["serve"],
      "env": {
        "MOSAIC_CONFIG": "~/.mosaic/config.json",
        "MOSAIC_LOG_LEVEL": "info"
      }
    }
  },
  "tools": {
    "allowedPrefixes": ["mosaic_"],
    "rateLimit": {
      "enabled": true,
      "requestsPerMinute": 500
    }
  }
}
```

### 2. Verify Integration

In OpenCode chat:

```
Check available MosAIc tools
```

Expected response showing 25 tools across 5 categories.

---

## Task Management Workflows

### Scenario: Building a Web Application Feature

#### Step 1: Create Epic and Feature Tasks

```
mosaic_task_create title="User Management System" type="epic" priority="high" description="Complete user registration, authentication, and profile management system" estimated_hours=80
```

```
mosaic_task_create title="User Authentication API" type="feature" parent_id="E.001" priority="high" description="JWT-based authentication with OAuth2 providers" estimated_hours=24 labels=["backend", "security"]
```

```
mosaic_task_create title="User Registration Frontend" type="feature" parent_id="E.001" priority="medium" description="React components for user registration flow" estimated_hours=16 labels=["frontend", "ui"] dependencies=["F.001"]
```

#### Step 2: Break Down into Atomic Tasks

```
mosaic_task_create title="Implement JWT token generation" type="atomic" parent_id="F.001" priority="high" estimated_hours=4 assignee="BE-BACKEND-BENJAMIN"
```

```
mosaic_task_create title="Create user registration endpoint" type="atomic" parent_id="F.001" priority="high" estimated_hours=3 assignee="BE-BACKEND-BENJAMIN"
```

```
mosaic_task_create title="Build login component" type="atomic" parent_id="F.002" priority="medium" estimated_hours=2 assignee="FE-FRONTEND-FIONA"
```

#### Step 3: Assign and Track Progress

```
mosaic_task_assign task_id="A.001" assignee="BE-BACKEND-BENJAMIN" deadline="2025-07-25T17:00:00Z" notes="Start with JWT library integration"
```

```
mosaic_task_status task_id="A.001" status="in_progress" progress_percent=25 notes="JWT library installed, working on token generation logic"
```

---

## Multi-Agent Development Teams

### Scenario: Full-Stack Development with Coordinated Agents

#### Step 1: Deploy Specialized Agent Team

```
mosaic_agent_deploy persona="BE-BACKEND-BENJAMIN" task="Implement user authentication API with JWT and OAuth2" context="Working on user management system, focus on security best practices" tools=["file_edit", "bash", "web_search"] model="claude-3-opus" priority="high"
```

```
mosaic_agent_deploy persona="FE-FRONTEND-FIONA" task="Build user registration and login components" context="React application with Material-UI, needs to integrate with authentication API" tools=["file_edit", "web_search"] priority="medium"
```

```
mosaic_agent_deploy persona="QA-QUALITY-QUINN" task="Create comprehensive test suite for authentication flow" context="Focus on security testing and edge cases" tools=["file_edit", "bash"] priority="medium"
```

#### Step 2: Coordinate Agent Communication

```
mosaic_agent_message agent_id="agent_001" message="Please expose the authentication endpoints at /api/auth/* for frontend integration" priority="high" require_acknowledgment=true
```

```
mosaic_agent_broadcast agent_ids=["agent_001", "agent_002", "agent_003"] message="Daily standup at 9 AM - please share your progress and any blockers" priority="medium"
```

#### Step 3: Handle Task Handoffs

```
mosaic_agent_handoff from_agent_id="agent_001" to_agent_id="agent_002" context="Authentication API is complete, endpoints documented in /docs/api.md, ready for frontend integration" transfer_files=true notify_team=true
```

#### Step 4: Monitor Agent Progress

```
mosaic_agent_status agent_id="agent_001" include_metrics=true include_recent_activity=true
```

---

## Complex Workflow Orchestration

### Scenario: CI/CD Pipeline with Quality Gates

#### Step 1: Create Comprehensive Development Workflow

```json
mosaic_workflow_create {
  "name": "Full Stack Feature Development",
  "description": "Complete workflow from requirements to production deployment",
  "steps": [
    {
      "name": "Requirements Analysis",
      "agent_persona": "BA-ANALYST-ALICE",
      "task_template": "Analyze requirements for: {{feature_name}}",
      "estimated_duration": 120,
      "parallel": false,
      "inputs": {
        "requirements_doc": "{{requirements_url}}"
      }
    },
    {
      "name": "Backend Implementation", 
      "agent_persona": "BE-BACKEND-BENJAMIN",
      "task_template": "Implement backend for: {{feature_name}}",
      "estimated_duration": 480,
      "parallel": false,
      "dependencies": ["Requirements Analysis"]
    },
    {
      "name": "Frontend Implementation",
      "agent_persona": "FE-FRONTEND-FIONA", 
      "task_template": "Build frontend for: {{feature_name}}",
      "estimated_duration": 360,
      "parallel": true,
      "dependencies": ["Requirements Analysis"]
    },
    {
      "name": "API Testing",
      "agent_persona": "QA-AUTOMATION-AUSTIN",
      "task_template": "Create API tests for: {{feature_name}}",
      "estimated_duration": 180,
      "parallel": true,
      "dependencies": ["Backend Implementation"]
    },
    {
      "name": "UI Testing", 
      "agent_persona": "QA-QUALITY-QUINN",
      "task_template": "Create UI tests for: {{feature_name}}",
      "estimated_duration": 120,
      "parallel": true,
      "dependencies": ["Frontend Implementation"]
    },
    {
      "name": "Integration Testing",
      "agent_persona": "QA-INTEGRATION-IAN",
      "task_template": "Run integration tests for: {{feature_name}}",
      "estimated_duration": 90,
      "parallel": false,
      "dependencies": ["API Testing", "UI Testing"]
    },
    {
      "name": "Security Review",
      "agent_persona": "SEC-SECURITY-SARAH",
      "task_template": "Security review for: {{feature_name}}",
      "estimated_duration": 180,
      "parallel": true,
      "dependencies": ["Integration Testing"]
    },
    {
      "name": "Deployment",
      "agent_persona": "DO-DEVOPS-DAVID",
      "task_template": "Deploy {{feature_name}} to production",
      "estimated_duration": 60,
      "parallel": false,
      "dependencies": ["Security Review", "Integration Testing"]
    }
  ],
  "trigger_conditions": {
    "manual": true,
    "task_completion": "F.100"
  }
}
```

#### Step 2: Execute Workflow with Parameters

```json
mosaic_workflow_execute {
  "workflow_id": "wf_001",
  "parameters": {
    "feature_name": "User Profile Management",
    "requirements_url": "https://docs.company.com/user-profiles",
    "priority": "high",
    "target_environment": "staging"
  },
  "auto_start": true,
  "notify_agents": true
}
```

#### Step 3: Monitor Workflow Progress

```
mosaic_workflow_monitor workflow_id="wf_001" include_agent_status=true include_logs=true log_limit=100
```

#### Step 4: Handle Workflow Issues

```
mosaic_workflow_pause workflow_id="wf_001" reason="Waiting for security team approval" notify_agents=true
```

```
mosaic_workflow_resume workflow_id="wf_001" reason="Security approval received, continuing deployment" notify_agents=true
```

---

## Project Management Scenarios

### Scenario: Managing Multiple Projects with Resource Allocation

#### Step 1: List and Switch Between Projects

```
mosaic_project_list filter="active" include_stats=true
```

```
mosaic_project_switch project_name="E-Commerce Platform" create_if_missing=false sync_tasks=true
```

#### Step 2: Get Comprehensive Project Status

```json
mosaic_project_status {
  "project_name": "E-Commerce Platform",
  "include_agents": true,
  "include_activity": true,
  "activity_limit": 25
}
```

Example response showing:
- 47 total tasks (20 completed, 8 in progress, 15 pending, 4 blocked)
- 3 active agents with task assignments
- Recent completions and current activities
- Project health metrics (42.6% completion rate, 87.5% on-time delivery)
- Estimated completion date

#### Step 3: Analyze Cross-Project Resource Usage

```
mosaic_resource_monitor metrics=["cpu", "memory"] include_agents=true time_range=3600
```

---

## Resource Management and Monitoring

### Scenario: Optimizing Performance and Managing Resource Constraints

#### Step 1: Monitor System Resources

```json
mosaic_resource_monitor {
  "metrics": ["cpu", "memory", "disk", "network"],
  "include_agents": true,
  "time_range": 1800,
  "format": "detailed"
}
```

#### Step 2: Set Agent Resource Limits

```json
mosaic_agent_limits {
  "agent_id": "agent_001",
  "limits": {
    "max_memory_mb": 1024,
    "max_cpu_percent": 75,
    "max_execution_time": 7200,
    "max_concurrent_tasks": 2,
    "max_file_operations": 1000
  },
  "action": "set"
}
```

#### Step 3: Generate Performance Reports

```json
mosaic_performance_report {
  "time_range": 86400,
  "include_agents": true,
  "include_workflows": true,
  "include_recommendations": true,
  "format": "executive",
  "export_format": "json"
}
```

#### Step 4: Configure Resource Alerts

```json
mosaic_resource_alerts {
  "action": "create",
  "alert_config": {
    "name": "High Memory Usage Alert",
    "alert_type": "memory_threshold",
    "threshold": 80,
    "duration": 300,
    "severity": "high",
    "enabled": true,
    "notification_channels": ["log", "console", "webhook"],
    "webhook_url": "https://alerts.company.com/webhook"
  }
}
```

---

## Enterprise Integration Patterns

### Scenario: Integration with Existing Enterprise Tools

#### Pattern 1: Jira Integration via Workflows

```json
mosaic_workflow_create {
  "name": "Jira Sync Workflow",
  "description": "Synchronize tasks with Jira tickets",
  "steps": [
    {
      "name": "Create Jira Ticket",
      "agent_persona": "INT-INTEGRATION-IRA",
      "task_template": "Create Jira ticket for: {{task_title}}",
      "estimated_duration": 15,
      "parallel": false,
      "inputs": {
        "project_key": "{{jira_project}}",
        "issue_type": "{{issue_type}}",
        "assignee": "{{jira_assignee}}"
      }
    },
    {
      "name": "Update Task Status",
      "agent_persona": "PM-PROJECT-PAUL",
      "task_template": "Update MosAIc task status from Jira: {{jira_ticket}}",
      "estimated_duration": 5,
      "parallel": false,
      "dependencies": ["Create Jira Ticket"]
    }
  ]
}
```

#### Pattern 2: Slack Notifications for Team Communication

```json
mosaic_agent_broadcast {
  "agent_ids": ["agent_001", "agent_002", "agent_003"],
  "message": "Sprint planning complete. New tasks assigned. Please check your task queues and start on high-priority items.",
  "priority": "medium"
}
```

#### Pattern 3: Git Integration via Agent Actions

```
mosaic_agent_deploy persona="DO-DEVOPS-DAVID" task="Set up automated deployment pipeline with Git hooks" context="Integration with GitHub Actions, deploy to AWS ECS on main branch merge" tools=["bash", "file_edit", "web_search"]
```

### Pattern 4: Monitoring Integration

```json
mosaic_resource_alerts {
  "action": "create",
  "alert_config": {
    "name": "Workflow Failure Alert",
    "alert_type": "workflow_timeout",
    "threshold": 3600,
    "severity": "critical",
    "enabled": true,
    "notification_channels": ["webhook", "email"],
    "webhook_url": "https://monitoring.company.com/mosaic-alerts",
    "email_recipients": ["devops@company.com", "team-lead@company.com"]
  }
}
```

---

## Advanced Use Cases

### 1. Automated Code Review Process

```json
mosaic_workflow_create {
  "name": "Automated Code Review",
  "description": "Multi-agent code review with security and quality checks",
  "steps": [
    {
      "name": "Static Analysis",
      "agent_persona": "QA-STATIC-STAN", 
      "task_template": "Run static analysis on: {{pull_request}}",
      "estimated_duration": 30,
      "parallel": false
    },
    {
      "name": "Security Scan",
      "agent_persona": "SEC-SCANNER-SOPHIE",
      "task_template": "Security scan for: {{pull_request}}",
      "estimated_duration": 45,
      "parallel": true,
      "dependencies": ["Static Analysis"]
    },
    {
      "name": "Performance Review",
      "agent_persona": "PERF-PERFORMANCE-PETER",
      "task_template": "Performance analysis for: {{pull_request}}",
      "estimated_duration": 60,
      "parallel": true,
      "dependencies": ["Static Analysis"]
    },
    {
      "name": "Code Review Summary",
      "agent_persona": "TL-LEAD-TONY",
      "task_template": "Compile review summary for: {{pull_request}}",
      "estimated_duration": 15,
      "parallel": false,
      "dependencies": ["Security Scan", "Performance Review"]
    }
  ]
}
```

### 2. Incident Response Workflow

```json
mosaic_workflow_create {
  "name": "Production Incident Response",
  "description": "Coordinated response to production incidents",
  "steps": [
    {
      "name": "Initial Assessment",
      "agent_persona": "SRE-RELIABILITY-RACHEL",
      "task_template": "Assess production incident: {{incident_id}}",
      "estimated_duration": 10,
      "parallel": false
    },
    {
      "name": "Stakeholder Notification", 
      "agent_persona": "PM-INCIDENT-IAN",
      "task_template": "Notify stakeholders of incident: {{incident_id}}",
      "estimated_duration": 5,
      "parallel": true,
      "dependencies": ["Initial Assessment"]
    },
    {
      "name": "Technical Investigation",
      "agent_persona": "BE-DEBUG-DEREK",
      "task_template": "Debug production issue: {{incident_id}}",
      "estimated_duration": 60,
      "parallel": true,
      "dependencies": ["Initial Assessment"]
    },
    {
      "name": "Immediate Mitigation",
      "agent_persona": "DO-EMERGENCY-EVA",
      "task_template": "Apply immediate fixes for: {{incident_id}}",
      "estimated_duration": 30,
      "parallel": false,
      "dependencies": ["Technical Investigation"]
    }
  ],
  "trigger_conditions": {
    "manual": true
  }
}
```

### 3. Continuous Integration Pipeline

```
# Create CI pipeline as a workflow
mosaic_workflow_create name="CI Pipeline" description="Automated testing and deployment pipeline" steps=[
  {"name": "Unit Tests", "agent_persona": "QA-UNIT-ULRICH", "estimated_duration": 180, "parallel": false},
  {"name": "Integration Tests", "agent_persona": "QA-INTEGRATION-IAN", "estimated_duration": 300, "parallel": false},
  {"name": "Build Docker Images", "agent_persona": "DO-DOCKER-DIANA", "estimated_duration": 120, "parallel": true},
  {"name": "Security Scan", "agent_persona": "SEC-CONTAINER-CARL", "estimated_duration": 90, "parallel": true},
  {"name": "Deploy to Staging", "agent_persona": "DO-DEPLOY-DEREK", "estimated_duration": 60, "parallel": false}
]
```

## Best Practices for Integration

### 1. Resource Management
- Always set appropriate resource limits for agents
- Monitor resource usage regularly
- Use performance reports to optimize workflows

### 2. Error Handling
- Implement retry logic for critical workflows
- Set up alerts for workflow failures
- Have fallback procedures for agent failures

### 3. Communication Patterns
- Use broadcast messages for team-wide updates
- Implement handoff procedures for task transitions
- Maintain audit trails for compliance

### 4. Workflow Design
- Keep workflows modular and reusable
- Use parallel execution where possible
- Implement proper dependency management

### 5. Monitoring and Observability
- Set up comprehensive monitoring
- Use structured logging
- Implement health checks for all components

---

## Troubleshooting Integration Issues

### Common Issues and Solutions

1. **Tools not appearing in OpenCode**
   - Check MCP server configuration
   - Verify OpenCode server configuration
   - Restart both services

2. **Agent deployment failures**
   - Check available personas
   - Verify resource limits
   - Review agent logs

3. **Workflow execution problems**
   - Validate workflow step dependencies
   - Check agent availability
   - Review resource constraints

4. **Performance issues**
   - Monitor system resources
   - Optimize database queries
   - Adjust agent limits

For more detailed troubleshooting, see the [main troubleshooting guide](../README.md#troubleshooting--debugging).