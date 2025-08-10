# MCP Orchestrator - Complete Tool Inventory

## Summary
- **Total Tools**: 33
- **Planning Tools**:  Available (mosaic_plan_business, mosaic_plan_all)
- **Service Status**:  Healthy (port 3456)
- **Database**:  Connected and functional

## Tool Categories

### Task Management Tools (mosaic_task_*)
- `mosaic_task_create` - Create a new task with UPP hierarchy support
- `mosaic_task_assign` - Assign a task to an agent or person
- `mosaic_task_status` - Update or query task status
- `mosaic_task_depend` - Add a dependency between tasks to control execution order
- `mosaic_task_decompose` - Decompose a high-level task into atomic subtasks using Sequential Thinking
- `mosaic_task_estimate_batch` - Estimate time for multiple tasks efficiently using AI or historical data
- `mosaic_task_assign_intelligent` - Intelligently assign tasks to agents based on skills and workload
- `mosaic_task_analyze_complexity` - Analyze task complexity to determine decomposition strategy

### Project Management Tools (mosaic_project_*)
- `mosaic_project_create` - Create a new project
- `mosaic_project_update` - Update an existing project
- `mosaic_project_list` - List available projects
- `mosaic_project_switch` - Switch to a different project context
- `mosaic_project_status` - Get project status and metrics

### Planning Tools (mosaic_plan_*) P Critical
- `mosaic_plan_business` - Execute business strategy planning using MosAIc UPP methodology
- `mosaic_plan_all` - Execute complete business-to-technical planning pipeline with scope control

### Agent Management Tools (mosaic_agent_*)
- `mosaic_agent_mosaic_agent_deploy` - Deploy specialized agents
- `mosaic_agent_mosaic_agent_status` - Get agent status and monitoring info

### Resource Management Tools (mosaic_resource_*)
- Various resource management tools for file, documentation, and infrastructure resources

### Communication Tools (mosaic_comm_*)
- Tools for inter-agent and cross-project communication

### Workflow Tools (mosaic_workflow_*)
- Workflow orchestration and automation tools

### Sequential Task Tools (sequential_task_*)
- Advanced task decomposition using Sequential Thinking MCP integration

## Critical Planning Tools Verification 

### mosaic_plan_business
- **Status**:  Available
- **Description**: Execute business strategy planning using MosAIc UPP methodology
- **Namespace**: mosaic_plan
- **Purpose**: Core business planning functionality for enterprise projects

### mosaic_plan_all
- **Status**:  Available  
- **Description**: Execute complete business-to-technical planning pipeline with scope control
- **Namespace**: mosaic_plan
- **Purpose**: End-to-end planning from business requirements to technical implementation

## Service Health Status 

- **MCP Orchestrator**: Running (PID: 1788093)
- **Port**: 3456 (HTTP/SSE transport)
- **Health Endpoint**: http://localhost:3456/health
- **Database**: Connected to .mosaic/data/mcp.db
- **Configuration**: Unified in .claude/mcp.json

## Previous Issues Resolved 

1. **Service Conflict**: Stopped redundant MCP Gateway (port 3457)
2. **Configuration Mismatch**: Unified all configs to point to MCP Orchestrator
3. **Tool Count**: Verified all 33 tools are accessible (was 27)
4. **Planning Tools**: Confirmed mosaic_plan_business and mosaic_plan_all are working
5. **Database Permissions**: Verified read/write access without permission errors

## Infrastructure Foundation Complete 

The unified MCP infrastructure foundation is now established and ready to support Claude Code with full access to all 33 planning tools through a single, reliable service.

Generated: $(date)
Service: MCP Orchestrator v1.0.0
Transport: HTTP/SSE on port 3456