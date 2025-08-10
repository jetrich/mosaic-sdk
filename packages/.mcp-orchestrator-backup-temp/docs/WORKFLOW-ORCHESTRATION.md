# Workflow Orchestration System

The MosAIc Orchestrator includes a comprehensive workflow orchestration system that enables coordinated multi-agent execution with sophisticated dependency management, parallel processing, and real-time monitoring.

## Overview

The workflow orchestration system provides:

- **Multi-step workflow definitions** with complex dependencies
- **Agent assignment and coordination** using predefined personas
- **Parallel execution groups** for concurrent operations
- **Real-time monitoring and progress tracking**
- **Workflow control** (pause, resume, cancel)
- **Performance metrics and execution history**
- **Error handling and retry mechanisms**

## Core Components

### WorkflowService

The `WorkflowService` is the central orchestration engine that manages workflow lifecycle, execution, and monitoring.

**Key Features:**
- JSON-based workflow specifications
- Dependency validation and circular dependency detection
- State machine execution engine
- Integration with AgentService, TaskService, and CommunicationService

### WorkflowTools

The `WorkflowTools` class exposes workflow functionality through MCP tools:

- `mosaic_workflow_create` - Define new workflows
- `mosaic_workflow_execute` - Start workflow execution
- `mosaic_workflow_monitor` - Track progress and metrics
- `mosaic_workflow_list` - List and filter workflows
- `mosaic_workflow_get` - Get detailed workflow information
- `mosaic_workflow_pause` - Pause running workflows
- `mosaic_workflow_resume` - Resume paused workflows
- `mosaic_workflow_cancel` - Cancel workflows

## Workflow Structure

### Workflow Definition

```json
{
  "name": "Development Workflow",
  "description": "Complete development pipeline",
  "project_id": "web-app-project",
  "steps": [
    {
      "name": "Backend Development",
      "agent_persona": "BE-BACKEND-BENJAMIN",
      "task_ids": ["task-1"],
      "dependencies": [],
      "timeout_minutes": 60
    },
    {
      "name": "Frontend Development", 
      "agent_persona": "FE-FRONTEND-FIONA",
      "task_ids": ["task-2"],
      "dependencies": [],
      "parallel_group": "development",
      "timeout_minutes": 45
    },
    {
      "name": "Integration Testing",
      "agent_persona": "QA-QUALITY-QUINN", 
      "task_ids": ["task-3"],
      "dependencies": ["step-1", "step-2"],
      "timeout_minutes": 30
    }
  ],
  "variables": {
    "environment": "staging",
    "version": "1.0.0"
  },
  "trigger": "manual",
  "timeout_minutes": 180,
  "max_retries": 2
}
```

### Step Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Human-readable step name |
| `description` | string | Optional step description |
| `agent_persona` | string | Agent persona to execute this step (e.g., BE-BACKEND-BENJAMIN) |
| `task_ids` | string[] | Task IDs to be executed in this step |
| `dependencies` | string[] | Step IDs this step depends on |
| `parallel_group` | string | Optional group name for parallel execution |
| `timeout_minutes` | number | Optional timeout for this step |
| `retry_count` | number | Number of retries allowed |

## Execution Engine

### Dependency Resolution

The execution engine automatically resolves step dependencies:

1. **Validation**: Checks all dependencies exist and detects circular dependencies
2. **Ordering**: Determines execution order based on dependency graph
3. **Parallel Groups**: Identifies steps that can run concurrently
4. **Sequential Execution**: Executes steps in dependency order

### Agent Coordination

For each step with an assigned agent:

1. **Agent Deployment**: Deploys agent with specified persona
2. **Task Assignment**: Assigns tasks to the deployed agent
3. **Execution Monitoring**: Tracks agent progress and status
4. **Cleanup**: Terminates agent upon step completion

### Error Handling

The system includes comprehensive error handling:

- **Step Failures**: Failed steps don't block independent steps
- **Retry Logic**: Configurable retry attempts for failed steps
- **Timeout Management**: Automatic timeout handling for long-running steps
- **Graceful Degradation**: System continues executing viable steps

## Parallel Execution

### Parallel Groups

Steps with the same `parallel_group` value execute concurrently:

```json
{
  "steps": [
    {
      "name": "Frontend Development",
      "parallel_group": "development",
      "dependencies": []
    },
    {
      "name": "Backend Development", 
      "parallel_group": "development",
      "dependencies": []
    },
    {
      "name": "Integration Testing",
      "dependencies": ["frontend-step-id", "backend-step-id"]
    }
  ]
}
```

### Dependency Management

Dependencies ensure proper execution order:

- Steps only execute when all dependencies are completed
- Failed dependencies prevent dependent steps from executing
- Independent parallel branches continue execution

## Real-time Monitoring

### Progress Tracking

The system tracks comprehensive progress metrics:

```typescript
interface WorkflowProgress {
  total_steps: number;
  completed_steps: number;
  failed_steps: number;
  skipped_steps: number;
  completion_percentage: number;
  current_parallel_group?: string;
  estimated_completion?: Date;
}
```

### Performance Metrics

Performance metrics provide insights into workflow efficiency:

```typescript
interface PerformanceMetrics {
  total_executions: number;
  success_rate: number; // percentage
  average_duration_minutes: number;
  last_24h_executions: number;
}
```

### Execution History

Complete execution history with:
- Execution timestamps
- Step-level performance data
- Error messages and retry counts
- Agent assignments and handoffs

## Workflow Control

### Lifecycle Operations

- **Create**: Define new workflows with validation
- **Execute**: Start workflow execution with context
- **Pause**: Temporarily halt execution (resumable)
- **Resume**: Continue paused execution
- **Cancel**: Permanently stop execution (non-resumable)

### Status Management

Workflow statuses:
- `pending` - Created but not started
- `running` - Currently executing
- `paused` - Temporarily halted
- `completed` - Successfully finished
- `failed` - Execution failed
- `cancelled` - Manually cancelled

## Agent Integration

### Persona System

The workflow system integrates with the agent persona system:

- **Predefined Personas**: Use standardized agent personas (BE-BACKEND-BENJAMIN, FE-FRONTEND-FIONA, etc.)
- **Automatic Deployment**: Agents are deployed when needed and terminated when done
- **Context Transfer**: Workflow context is passed to agents for informed execution

### Communication

Agents coordinate through the communication system:
- **Handoff Messages**: Automatic notifications for step transitions
- **Status Updates**: Real-time status communication between agents
- **Error Reporting**: Centralized error collection and reporting

## Database Schema

### Core Tables

**workflows**
- Stores workflow definitions and metadata
- Tracks overall workflow status and progress
- Contains JSON-serialized steps and variables

**workflow_executions** 
- Records each workflow execution instance
- Tracks execution context and performance
- Links to step executions for detailed tracking

**step_executions**
- Individual step execution records
- Agent assignments and performance metrics
- Input/output data and error information

## Usage Examples

### Basic Workflow Creation

```bash
# Create a simple workflow
mosaic_workflow_create \
  --name "Development Pipeline" \
  --project_id "web-app" \
  --steps '[
    {
      "name": "Code Review",
      "agent_persona": "BE-BACKEND-BENJAMIN",
      "task_ids": ["review-task-1"],
      "dependencies": []
    }
  ]'
```

### Complex Multi-Agent Workflow

```bash
# Create complex workflow with dependencies
mosaic_workflow_create \
  --name "Full Development Cycle" \
  --project_id "enterprise-app" \
  --steps '[
    {
      "name": "Backend API",
      "agent_persona": "BE-BACKEND-BENJAMIN", 
      "task_ids": ["api-task-1", "api-task-2"],
      "dependencies": [],
      "timeout_minutes": 120
    },
    {
      "name": "Frontend UI",
      "agent_persona": "FE-FRONTEND-FIONA",
      "task_ids": ["ui-task-1"],
      "dependencies": [],
      "parallel_group": "development"
    },
    {
      "name": "Quality Assurance",
      "agent_persona": "QA-QUALITY-QUINN",
      "task_ids": ["test-task-1"],
      "dependencies": ["backend-step-id", "frontend-step-id"]
    },
    {
      "name": "Deployment",
      "agent_persona": "DEVOPS-OPERATIONS-OLIVER",
      "task_ids": ["deploy-task-1"],
      "dependencies": ["qa-step-id"]
    }
  ]' \
  --variables '{"env": "prod", "version": "2.1.0"}' \
  --timeout_minutes 300
```

### Execution and Monitoring

```bash
# Execute workflow
mosaic_workflow_execute \
  --workflow_id "workflow-123" \
  --context '{"branch": "feature/new-ui"}' \
  --triggered_by "developer"

# Monitor progress
mosaic_workflow_monitor --workflow_id "workflow-123"

# Control workflow
mosaic_workflow_pause --workflow_id "workflow-123" --reason "Emergency maintenance"
mosaic_workflow_resume --workflow_id "workflow-123"
```

## Best Practices

### Workflow Design

1. **Keep Steps Atomic**: Each step should have a single, clear responsibility
2. **Minimize Dependencies**: Reduce coupling between steps where possible
3. **Use Parallel Groups**: Leverage parallelism for independent operations
4. **Set Appropriate Timeouts**: Balance execution time with reliability
5. **Plan for Failures**: Design workflows that can handle step failures gracefully

### Agent Assignment

1. **Match Personas to Tasks**: Assign appropriate agent personas based on task requirements
2. **Balance Load**: Distribute work across different agent types
3. **Consider Expertise**: Use specialized agents for domain-specific tasks
4. **Plan Handoffs**: Design clear transition points between agents

### Performance Optimization

1. **Monitor Metrics**: Regularly review performance metrics
2. **Optimize Dependencies**: Minimize unnecessary step dependencies
3. **Tune Timeouts**: Adjust timeouts based on actual execution times
4. **Use Parallel Execution**: Identify opportunities for concurrent execution

### Error Handling

1. **Plan for Retries**: Set appropriate retry counts for transient failures
2. **Design Fallbacks**: Create alternative paths for critical failures
3. **Monitor Health**: Track workflow health and success rates
4. **Log Comprehensively**: Ensure detailed logging for debugging

## Integration Points

### Task Management
- Workflows execute tasks through the TaskService
- Task status updates reflect workflow progress
- Task dependencies align with workflow step dependencies

### Agent Orchestration
- Automatic agent deployment and lifecycle management
- Persona-based agent selection and configuration
- Seamless integration with agent communication system

### Project Coordination
- Workflows operate within project contexts
- Project-level metrics aggregate workflow performance
- Resource allocation considers workflow requirements

## Future Enhancements

### Planned Features

1. **Conditional Steps**: Steps that execute based on runtime conditions
2. **Loop Constructs**: Iterative step execution with break conditions
3. **Sub-workflows**: Nested workflow execution for complex scenarios
4. **Event Triggers**: Workflow execution based on external events
5. **Resource Constraints**: CPU/memory limits for workflow execution
6. **Approval Gates**: Manual approval points in automated workflows

### Advanced Orchestration

1. **Multi-tenant Isolation**: Workflow isolation in multi-tenant environments
2. **Priority Queuing**: Priority-based workflow scheduling
3. **Resource Pooling**: Shared resource management across workflows
4. **Cross-project Workflows**: Workflows spanning multiple projects
5. **Workflow Templates**: Reusable workflow definitions with parameters

---

The Workflow Orchestration System provides a powerful foundation for coordinating complex multi-agent tasks with sophisticated dependency management, real-time monitoring, and comprehensive error handling. It integrates seamlessly with the broader MosAIc ecosystem to deliver enterprise-grade automation capabilities.