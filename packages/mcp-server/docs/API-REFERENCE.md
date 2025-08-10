# MosAIc MCP Orchestrator - Complete API Reference

## Overview

This document provides comprehensive API reference documentation for all 25 MCP tools across 5 categories in the MosAIc MCP Orchestrator.

## Tool Categories

- [Task Management (4 tools)](#task-management-api)
- [Project Coordination (3 tools)](#project-coordination-api)
- [Agent Orchestration (6 tools)](#agent-orchestration-api)
- [Workflow Management (8 tools)](#workflow-management-api)
- [Resource Management (4 tools)](#resource-management-api)

---

## Task Management API

### `mosaic_task_create`

**Description**: Create tasks with full UPP (Ultrathink Planning Protocol) hierarchy support

**Input Schema**:
```typescript
interface CreateTaskInput {
  title: string;                    // Required: Task title (1-200 chars)
  description?: string;             // Optional: Detailed description (max 2000 chars)
  type: 'epic' | 'feature' | 'story' | 'task' | 'subtask' | 'atomic';
  parent_id?: string;               // Optional: Parent task ID for hierarchy
  priority?: 'low' | 'medium' | 'high' | 'critical';  // Default: medium
  assignee?: string;                // Optional: Initial assignee
  estimated_hours?: number;         // Optional: Effort estimation (>= 0)
  due_date?: string;                // Optional: ISO 8601 datetime
  labels?: string[];                // Optional: Categorization tags
  dependencies?: string[];          // Optional: Blocking task IDs
}
```

**Example Usage**:
```json
{
  "tool": "mosaic_task_create",
  "arguments": {
    "title": "Implement user authentication system",
    "description": "Build complete OAuth2 authentication with JWT tokens",
    "type": "feature",
    "priority": "high",
    "estimated_hours": 16,
    "due_date": "2025-07-30T17:00:00Z",
    "labels": ["security", "backend"],
    "dependencies": ["F.101"]
  }
}
```

**Response Format**:
```typescript
interface CreateTaskResponse {
  title: string;                    // "Task Created: {task_title}"
  metadata: {
    operation: "task_create";
    status: "success" | "error";
    data: {
      task_id: string;
      type: string;
      priority: string;
    };
    timestamp: string;              // ISO 8601
    execution_time_ms: number;
  };
  output: string;                   // Formatted task details
}
```

### `mosaic_task_assign`

**Description**: Assign tasks to agents, humans, or teams with advanced options

**Input Schema**:
```typescript
interface AssignTaskInput {
  task_id: string;                  // Required: Target task ID
  assignee: string;                 // Required: Assignee identifier
  assignee_type?: 'agent' | 'human' | 'team';  // Default: agent
  priority?: 'low' | 'medium' | 'high' | 'critical';  // Optional: Update priority
  deadline?: string;                // Optional: Assignment deadline (ISO 8601)
  notes?: string;                   // Optional: Assignment instructions (max 1000 chars)
}
```

**Example Usage**:
```json
{
  "tool": "mosaic_task_assign",
  "arguments": {
    "task_id": "F.123",
    "assignee": "BE-BACKEND-BENJAMIN",
    "assignee_type": "agent",
    "priority": "high",
    "deadline": "2025-07-28T17:00:00Z",
    "notes": "Focus on OAuth2 implementation first"
  }
}
```

### `mosaic_task_status`

**Description**: Update task status or query tasks with advanced filtering

**Input Schema**:
```typescript
interface TaskStatusInput {
  task_id?: string;                 // Optional: Specific task to update
  status?: 'pending' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
  progress_percent?: number;        // Optional: Progress percentage (0-100)
  notes?: string;                   // Optional: Status update notes (max 1000 chars)
  filter?: {                        // Optional: Query filter
    assignee?: string;
    status?: 'pending' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    due_before?: string;            // ISO 8601 datetime
  };
}
```

**Example Usage**:
```json
{
  "tool": "mosaic_task_status",
  "arguments": {
    "task_id": "F.123",
    "status": "in_progress",
    "progress_percent": 35,
    "notes": "OAuth2 provider integration completed"
  }
}
```

### `mosaic_task_depend`

**Description**: Create and manage complex task dependencies

**Input Schema**:
```typescript
interface TaskDependencyInput {
  task_id: string;                  // Required: Dependent task ID
  depends_on_task_id: string;       // Required: Blocking task ID
  dependency_type?: 'blocks' | 'depends_on';  // Default: blocks
  strict?: boolean;                 // Default: true (hard dependency)
  notes?: string;                   // Optional: Dependency explanation (max 500 chars)
}
```

---

## Project Coordination API

### `mosaic_project_list`

**Description**: List projects with comprehensive filtering and statistics

**Input Schema**:
```typescript
interface ProjectListInput {
  filter?: 'all' | 'active' | 'completed' | 'archived';  // Default: active
  include_stats?: boolean;          // Default: false (performance optimization)
}
```

**Example Usage**:
```json
{
  "tool": "mosaic_project_list",
  "arguments": {
    "filter": "active",
    "include_stats": true
  }
}
```

**Response Format**:
```typescript
interface ProjectListResponse {
  title: "Project List";
  metadata: {
    operation: "project_list";
    status: "success";
    data: {
      project_count: number;
      filter: string;
    };
    timestamp: string;
    execution_time_ms: number;
  };
  output: string;                   // Formatted project list with optional stats
}
```

### `mosaic_project_switch`

**Description**: Switch project context with task synchronization

**Input Schema**:
```typescript
interface ProjectSwitchInput {
  project_name: string;             // Required: Target project name
  project_id?: string;              // Optional: Specific project ID
  create_if_missing?: boolean;      // Default: false
  sync_tasks?: boolean;             // Default: true (sync task contexts)
}
```

### `mosaic_project_status`

**Description**: Generate comprehensive project health and activity reports

**Input Schema**:
```typescript
interface ProjectStatusInput {
  project_name?: string;            // Optional: Project name
  project_id?: string;              // Optional: Project ID (name OR id required)
  include_agents?: boolean;         // Default: true (agent activity)
  include_activity?: boolean;       // Default: true (recent activity log)
  activity_limit?: number;          // Default: 10 (activity entries)
}
```

**Response Components**:
- Project Information (ID, name, status, owner, timestamps)
- Task Statistics (counts by status, type, priority, timeline)
- Agent Activity (active agents, task assignments, recent completions)
- Project Health Metrics (completion rate, on-time delivery, blocked tasks)
- Recent Activity Log (chronological activity feed)

---

## Agent Orchestration API

### `mosaic_agent_deploy`

**Description**: Deploy specialized AI agents with persona-based configuration

**Input Schema**:
```typescript
interface AgentDeployInput {
  persona: string;                  // Required: DOMAIN-ROLE-NAME format (e.g., BE-BACKEND-BENJAMIN)
  task: string;                     // Required: Task description (10-500 chars)
  context?: string;                 // Optional: Additional context and instructions
  tools?: string[];                 // Optional: Allowed tools (defaults from persona)
  model?: string;                   // Optional: AI model override
  timeout?: number;                 // Optional: Task timeout seconds (60-3600)
  priority?: 'low' | 'medium' | 'high';  // Default: medium
}
```

**Available Personas**:
- **Backend**: BE-BACKEND-BENJAMIN, BE-API-ALEX, BE-DATABASE-DIANA
- **Frontend**: FE-FRONTEND-FIONA, FE-UI-ULRICH, FE-MOBILE-MAYA  
- **Full Stack**: FS-FULLSTACK-FELIX, FS-ARCHITECT-ANNA
- **Quality Assurance**: QA-QUALITY-QUINN, QA-AUTOMATION-AUSTIN
- **DevOps**: DO-DEVOPS-DAVID, DO-INFRASTRUCTURE-IAN
- **Security**: SEC-SECURITY-SARAH, SEC-AUDIT-AARON
- **Data**: DATA-ANALYST-DEREK, DATA-SCIENTIST-STELLA

### `mosaic_agent_status`

**Description**: Monitor agent health, progress, and performance metrics

**Input Schema**:
```typescript
interface AgentStatusInput {
  agent_id: string;                 // Required: Target agent ID
  include_metrics?: boolean;        // Default: true (performance data)
  include_recent_activity?: boolean; // Default: true (activity log)
}
```

### `mosaic_agent_message`

**Description**: Send targeted messages to agents for coordination

**Input Schema**:
```typescript
interface AgentMessageInput {
  agent_id: string;                 // Required: Target agent ID
  message: string;                  // Required: Message content
  priority?: 'low' | 'medium' | 'high' | 'critical';  // Default: medium
  require_acknowledgment?: boolean; // Default: false
  timeout?: number;                 // Optional: Response timeout
}
```

### `mosaic_agent_handoff`

**Description**: Transfer tasks and context between agents

**Input Schema**:
```typescript
interface AgentHandoffInput {
  from_agent_id: string;            // Required: Source agent ID
  to_agent_id: string;              // Required: Target agent ID
  task_id?: string;                 // Optional: Specific task to transfer
  context?: string;                 // Optional: Handoff context/notes
  transfer_files?: boolean;         // Default: false
  notify_team?: boolean;            // Default: true
}
```

### `mosaic_agent_broadcast`

**Description**: Send messages to multiple agents simultaneously

**Input Schema**:
```typescript
interface AgentBroadcastInput {
  agent_ids: string[];              // Required: Target agent IDs
  message: string;                  // Required: Broadcast message
  priority?: 'low' | 'medium' | 'high' | 'critical';  // Default: medium
  require_acknowledgment?: boolean; // Default: false
  timeout?: number;                 // Optional: Response timeout
}
```

### `mosaic_agent_terminate`

**Description**: Safely terminate agents with proper cleanup

**Input Schema**:
```typescript
interface AgentTerminateInput {
  agent_id: string;                 // Required: Target agent ID
  reason?: string;                  // Optional: Termination reason
  save_state?: boolean;             // Default: true
  notify_team?: boolean;            // Default: false
  force?: boolean;                  // Default: false (graceful shutdown)
}
```

---

## Workflow Management API

### `mosaic_workflow_create`

**Description**: Create sophisticated multi-agent workflows with parallel execution

**Input Schema**:
```typescript
interface WorkflowCreateInput {
  name: string;                     // Required: Workflow identifier
  description: string;              // Required: Workflow description
  steps: WorkflowStep[];            // Required: Workflow steps
  trigger_conditions?: {            // Optional: Execution triggers
    manual?: boolean;
    task_completion?: string;
    schedule?: string;              // Cron expression
  };
}

interface WorkflowStep {
  name: string;
  agent_persona: string;            // DOMAIN-ROLE-NAME format
  task_template: string;
  estimated_duration: number;       // Minutes
  parallel: boolean;                // Can run concurrently
  dependencies?: string[];          // Step dependencies
  inputs?: Record<string, any>;     // Step-specific inputs
}
```

### `mosaic_workflow_execute`

**Description**: Execute workflows with parameter injection and monitoring

**Input Schema**:
```typescript
interface WorkflowExecuteInput {
  workflow_id: string;              // Required: Workflow to execute
  parameters?: Record<string, any>; // Optional: Runtime parameters
  auto_start?: boolean;             // Default: true
  notify_agents?: boolean;          // Default: true
}
```

### `mosaic_workflow_get`

**Description**: Retrieve detailed workflow information and status

**Input Schema**:
```typescript
interface WorkflowGetInput {
  workflow_id: string;              // Required: Workflow to retrieve
  include_steps?: boolean;          // Default: true
  include_history?: boolean;        // Default: true
  include_agents?: boolean;         // Default: true
}
```

### `mosaic_workflow_list`

**Description**: List workflows with filtering and pagination

**Input Schema**:
```typescript
interface WorkflowListInput {
  filter?: 'all' | 'active' | 'completed' | 'failed' | 'paused';
  limit?: number;                   // Default: 20
  offset?: number;                  // Default: 0
  sort_by?: 'created_at' | 'updated_at' | 'name';
  sort_order?: 'asc' | 'desc';
}
```

### `mosaic_workflow_monitor`

**Description**: Real-time monitoring of workflow execution

**Input Schema**:
```typescript
interface WorkflowMonitorInput {
  workflow_id: string;              // Required: Workflow to monitor
  include_agent_status?: boolean;   // Default: true
  include_logs?: boolean;           // Default: true
  log_limit?: number;               // Default: 50
}
```

### `mosaic_workflow_pause`

**Description**: Pause running workflows at safe points

**Input Schema**:
```typescript
interface WorkflowPauseInput {
  workflow_id: string;              // Required: Workflow to pause
  reason?: string;                  // Optional: Pause reason
  notify_agents?: boolean;          // Default: true
  save_state?: boolean;             // Default: true
}
```

### `mosaic_workflow_resume`

**Description**: Resume paused workflows from checkpoint

**Input Schema**:
```typescript
interface WorkflowResumeInput {
  workflow_id: string;              // Required: Workflow to resume
  reason?: string;                  // Optional: Resume reason
  notify_agents?: boolean;          // Default: true
  validate_state?: boolean;         // Default: true
}
```

### `mosaic_workflow_cancel`

**Description**: Cancel workflows with cleanup and notification

**Input Schema**:
```typescript
interface WorkflowCancelInput {
  workflow_id: string;              // Required: Workflow to cancel
  reason?: string;                  // Optional: Cancellation reason
  cleanup_agents?: boolean;         // Default: true
  notify_team?: boolean;            // Default: true
  force?: boolean;                  // Default: false
}
```

---

## Resource Management API

### `mosaic_resource_monitor`

**Description**: Monitor system resources and agent resource consumption

**Input Schema**:
```typescript
interface ResourceMonitorInput {
  metrics?: ('cpu' | 'memory' | 'disk' | 'network')[];  // Default: all
  include_agents?: boolean;         // Default: true
  time_range?: number;              // Seconds of historical data (default: 300)
  format?: 'summary' | 'detailed' | 'json';  // Default: summary
}
```

**Response Data**:
- System metrics (CPU, memory, disk, network utilization)
- Agent resource consumption (per-agent breakdown)
- Resource trends and patterns
- Performance recommendations
- Alert thresholds and violations

### `mosaic_agent_limits`

**Description**: Manage agent resource constraints and policies

**Input Schema**:
```typescript
interface AgentLimitsInput {
  agent_id?: string;                // Optional: Specific agent (or global)
  limits?: {
    max_memory_mb?: number;         // Memory limit in MB
    max_cpu_percent?: number;       // CPU usage limit (0-100)
    max_execution_time?: number;    // Max runtime in seconds
    max_concurrent_tasks?: number;  // Task concurrency limit
    max_file_operations?: number;   // File operation limit
  };
  action?: 'get' | 'set' | 'reset'; // Default: get
}
```

### `mosaic_performance_report`

**Description**: Generate comprehensive performance analytics and insights

**Input Schema**:
```typescript
interface PerformanceReportInput {
  time_range?: number;              // Analysis period in seconds
  include_agents?: boolean;         // Include agent performance data
  include_workflows?: boolean;      // Include workflow performance
  include_recommendations?: boolean; // Include optimization suggestions
  format?: 'summary' | 'detailed' | 'executive';
  export_format?: 'text' | 'json' | 'csv';
}
```

**Report Sections**:
- Executive Summary
- System Performance Metrics
- Agent Performance Analysis
- Workflow Efficiency Reports
- Resource Utilization Trends
- Bottleneck Identification
- Optimization Recommendations
- Capacity Planning Insights

### `mosaic_resource_alerts`

**Description**: Configure and manage resource monitoring alerts

**Input Schema**:
```typescript
interface ResourceAlertsInput {
  action?: 'list' | 'create' | 'update' | 'delete';  // Default: list
  alert_id?: string;                // Required for update/delete
  alert_config?: {
    name: string;
    alert_type: 'cpu_threshold' | 'memory_threshold' | 'disk_threshold' | 
                'agent_failure' | 'workflow_timeout' | 'custom';
    threshold?: number;             // Threshold value (context dependent)
    duration?: number;              // Seconds before triggering
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    notification_channels: ('log' | 'console' | 'webhook' | 'email')[];
    webhook_url?: string;           // For webhook notifications
    email_recipients?: string[];    // For email notifications
  };
}
```

---

## Error Handling

All tools return consistent error responses when validation fails or execution errors occur:

```typescript
interface ErrorResponse {
  title: string;                    // Human-readable error title
  metadata: {
    operation: string;              // Tool name that failed
    status: "error";
    timestamp: string;              // ISO 8601 timestamp
    execution_time_ms: number;      // Time spent before failure
    error_code?: string;            // Machine-readable error code
  };
  output: string;                   // Detailed error message and resolution steps
}
```

### Common Error Codes

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `VALIDATION_FAILED` | Input validation error | Check parameter format and constraints |
| `RESOURCE_NOT_FOUND` | Referenced resource doesn't exist | Verify IDs and resource availability |
| `PERMISSION_DENIED` | Insufficient permissions | Check agent permissions and role assignments |
| `RESOURCE_EXHAUSTED` | System resource limits exceeded | Review resource limits and usage |
| `TIMEOUT_EXCEEDED` | Operation timed out | Increase timeout or check system performance |
| `DEPENDENCY_FAILED` | Dependent operation failed | Check task dependencies and prerequisites |
| `INVALID_STATE` | Resource in invalid state for operation | Check resource status before operation |

## Rate Limiting

All tools are subject to rate limiting based on category:

- **Task Management**: 100 requests/minute
- **Project Coordination**: 50 requests/minute  
- **Agent Orchestration**: 200 requests/minute
- **Workflow Management**: 75 requests/minute
- **Resource Management**: 30 requests/minute

Rate limits can be configured in the server configuration file.

## Authentication & Authorization

Currently, all tools operate under the context of the MCP connection. Future versions will support:
- Role-based access control (RBAC)
- Per-tool permissions
- API key authentication
- OAuth 2.0 integration

## Versioning

The API follows semantic versioning. Breaking changes will increment the major version number and provide migration guides.

Current API Version: **1.0.0**