# MosAIc MCP Server Architecture

## Overview

The MosAIc MCP Server is a unified Model Context Protocol (MCP) server that provides comprehensive tools for task management, project coordination, agent orchestration, workflow management, resource monitoring, and planning capabilities. It serves as the central hub for Claude Code and OpenCode integration.

## Directory Structure

```
packages/mcp-server/
├── src/
│   ├── main.ts                 # Entry point with CLI commands
│   ├── server/
│   │   ├── MCPServer.ts        # Core MCP server implementation
│   │   └── http-server.ts      # HTTP/SSE transport support
│   ├── tools/                  # Tool implementations
│   │   ├── TaskTools.ts        # Task management tools
│   │   ├── ProjectTools.ts     # Project coordination tools
│   │   ├── AgentTools.ts       # Agent orchestration tools
│   │   ├── WorkflowTools.ts    # Workflow management tools
│   │   ├── ResourceTools.ts    # Resource monitoring tools
│   │   ├── PlanningTools.ts    # Planning and strategy tools
│   │   └── SequentialTaskTools.ts # Advanced task decomposition
│   ├── services/               # Business logic services
│   │   ├── TaskService.ts      # Task management logic
│   │   ├── ProjectService.ts   # Project management logic
│   │   ├── AgentService.ts     # Agent lifecycle management
│   │   ├── WorkflowService.ts  # Workflow orchestration
│   │   ├── ResourceService.ts  # Resource monitoring
│   │   └── StateService.ts     # State persistence
│   ├── utils/
│   │   ├── Logger.ts           # Structured logging
│   │   └── zodToJsonSchema.ts  # Zod to JSON Schema converter
│   └── types/
│       └── index.ts            # TypeScript type definitions
├── dist/                       # Compiled JavaScript output
├── bin/
│   └── mosaic-mcp             # Executable wrapper script
├── docs/                       # Documentation
├── tests/                      # Test suites
└── package.json               # Package configuration
```

## Core Components

### 1. MCP Server (`MCPServer.ts`)

The main server class that:
- Handles MCP protocol communication
- Registers and manages tools
- Routes tool calls to appropriate handlers
- Manages server lifecycle
- Supports multiple transport types (stdio, HTTP, SSE)

### 2. Tool Categories

#### Task Management Tools (8 tools)
- `mosaic_task_create` - Create tasks with UPP hierarchy
- `mosaic_task_assign` - Assign tasks to agents/humans
- `mosaic_task_status` - Update/query task status
- `mosaic_task_depend` - Define task dependencies
- `mosaic_task_decompose` - Decompose into atomic subtasks
- `mosaic_task_estimate_batch` - Batch estimate task durations
- `mosaic_task_assign_intelligent` - Smart task assignment
- `mosaic_task_analyze_complexity` - Analyze task complexity

#### Project Coordination Tools (5 tools)
- `mosaic_project_create` - Create new projects
- `mosaic_project_update` - Update project details
- `mosaic_project_list` - List available projects
- `mosaic_project_switch` - Switch project context
- `mosaic_project_status` - Get project status

#### Agent Orchestration Tools (6 tools)
- `mosaic_agent_deploy` - Deploy AI agents
- `mosaic_agent_status` - Monitor agent status
- `mosaic_agent_terminate` - Terminate agents
- `mosaic_agent_message` - Send messages between agents
- `mosaic_agent_handoff` - Transfer tasks between agents
- `mosaic_agent_broadcast` - Broadcast to multiple agents

#### Workflow Management Tools (8 tools)
- `mosaic_agent_workflow_create` - Create multi-agent workflows
- `mosaic_agent_workflow_execute` - Execute workflows
- `mosaic_agent_workflow_monitor` - Monitor progress
- `mosaic_agent_workflow_list` - List workflows
- `mosaic_agent_workflow_get` - Get workflow details
- `mosaic_agent_workflow_pause` - Pause workflows
- `mosaic_agent_workflow_resume` - Resume workflows
- `mosaic_agent_workflow_cancel` - Cancel workflows

#### Resource Management Tools (4 tools)
- `mosaic_agent_resource_monitor` - Monitor resource usage
- `mosaic_agent_limits` - Manage resource limits
- `mosaic_agent_performance_report` - Generate performance reports
- `mosaic_agent_resource_alerts` - Manage resource alerts

#### Planning Tools (2 tools)
- `mosaic_plan_business` - Business strategy planning
- `mosaic_plan_all` - Complete planning pipeline

### 3. Services Layer

Services encapsulate business logic and database operations:
- **StateService**: Manages SQLite database and state persistence
- **TaskService**: Handles task CRUD operations and relationships
- **ProjectService**: Manages project contexts and switching
- **AgentService**: Manages agent lifecycle and registry
- **WorkflowService**: Orchestrates multi-agent workflows
- **ResourceService**: Monitors and manages system resources

## Communication Flow

```
Claude Code / OpenCode
        ↓
   MCP Protocol
        ↓
   MCPServer.ts
        ↓
   Tool Handlers
        ↓
    Services
        ↓
   SQLite DB
```

## Transport Modes

### STDIO (Default for Claude Code)
- Direct process communication via stdin/stdout
- Used when Claude Code spawns the MCP server as a child process
- Most efficient for local development

### HTTP/SSE (For distributed setups)
- HTTP POST for tool calls
- Server-Sent Events for streaming responses
- Supports CORS for web-based clients

## Database Schema

The server uses SQLite for persistence with these main tables:
- `tasks` - Task records with UPP hierarchy
- `projects` - Project definitions
- `agents` - Agent registry and status
- `workflows` - Workflow definitions
- `workflow_executions` - Workflow run history
- `task_dependencies` - Task dependency graph
- `agent_messages` - Inter-agent communication
- `metrics` - Performance metrics

## Configuration

The server reads configuration from:
1. `~/.config/mosaic/config.json` (production)
2. Environment variables
3. Command-line arguments

Key configuration sections:
- `transport` - Transport type and settings
- `database` - Database connection
- `logging` - Log levels and outputs
- `tools` - Tool-specific settings
- `security` - Rate limiting and timeouts

## Integration Points

### Claude Code Integration
Add to `~/.claude.json`:
```json
{
  "mcpServers": {
    "mosaic": {
      "command": "node",
      "args": [
        "/home/user/.config/mosaic/mcp-server/dist/main.js",
        "serve"
      ],
      "env": {
        "MOSAIC_CONFIG": "/home/user/.config/mosaic/config.json"
      }
    }
  }
}
```

### OpenCode Integration
Add to `opencode.json`:
```json
{
  "mcp": {
    "mosaic": {
      "type": "local",
      "command": ["mosaic-mcp", "serve"]
    }
  }
}
```

## Environment Variables

- `MOSAIC_CONFIG` - Path to configuration file
- `MOSAIC_DATA_DIR` - Data directory path
- `DATABASE_PATH` - SQLite database path
- `MCP_PORT` - Port for HTTP transport
- `MOSAIC_LOG_LEVEL` - Logging level
- `MOSAIC_OLLAMA_URL` - Ollama server URL for planning tools

## CLI Commands

```bash
# Start server (stdio mode)
mosaic-mcp serve

# Start with HTTP transport
mosaic-mcp serve --http --port 3456

# List available tools
mosaic-mcp tools

# Check server health
mosaic-mcp health

# Show version
mosaic-mcp version

# Validate configuration
mosaic-mcp config --validate
```

## Security Considerations

1. **Tool Validation**: All tool inputs are validated using Zod schemas
2. **Rate Limiting**: Configurable rate limits per tool
3. **Timeouts**: Tool execution timeouts to prevent hanging
4. **Sandboxing**: Tools run in isolated contexts
5. **Authentication**: Optional auth for HTTP transport
6. **Audit Logging**: All tool calls are logged

## Performance Optimization

1. **Connection Pooling**: Reuses database connections
2. **Caching**: In-memory cache for frequent queries
3. **Batch Operations**: Supports batch task operations
4. **Async Processing**: Non-blocking I/O operations
5. **Resource Limits**: Per-agent resource constraints

## Monitoring

The server provides metrics via:
- Structured logs (Winston)
- Health check endpoint
- Performance reports
- Resource usage tracking
- Tool execution metrics

## Error Handling

- Graceful error recovery
- Detailed error messages
- Fallback mechanisms
- Automatic retries for transient failures
- Circuit breakers for external services

## Extensibility

Adding new tools:
1. Create tool class in `src/tools/`
2. Implement `getTools()` method returning `MCPTool[]`
3. Register in `MCPServer.ts`
4. Add service logic if needed
5. Update documentation

## Testing

- Unit tests for individual tools
- Integration tests for service layer
- End-to-end tests for MCP protocol
- Performance benchmarks
- Load testing for concurrent operations