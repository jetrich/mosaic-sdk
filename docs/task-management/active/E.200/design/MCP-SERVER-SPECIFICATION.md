# MCP Server Specification - @mosaicstack/mcp-orchestrator

**Task**: T.200.01.03.01  
**Version**: 1.0.0  
**Date**: 2025-07-21  
**Status**: Complete  

## Overview

This document specifies the technical architecture and implementation requirements for the `@mosaicstack/mcp-orchestrator` package - a Model Context Protocol (MCP) server that enables OpenCode integration with MosAIc Stack enterprise features.

## Executive Summary

The MCP orchestrator provides enterprise task management, project coordination, and agent orchestration tools to OpenCode through a standard MCP interface. All tools use the `mosaic_` namespace to avoid conflicts with existing OpenCode tools.

## Architecture

### System Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│                     │    │                     │    │                     │
│     OpenCode        │    │  MCP Orchestrator   │    │   MosAIc Stack      │
│                     │    │                     │    │                     │
│  ┌───────────────┐  │    │  ┌───────────────┐  │    │  ┌───────────────┐  │
│  │ MCP Client    │◄─┼────┼─►│ MCP Server    │  │    │  │ Task Manager  │  │
│  │ (ai package)  │  │    │  │ (stdio/sse)   │  │    │  │               │  │
│  └───────────────┘  │    │  └───────────────┘  │    │  └───────────────┘  │
│                     │    │           │         │    │           │         │
│  ┌───────────────┐  │    │  ┌───────────────┐  │    │  ┌───────────────┐  │
│  │ Tool Registry │  │    │  │ Tool Registry │  │    │  │ Agent System  │  │
│  │               │  │    │  │               │  │    │  │               │  │
│  └───────────────┘  │    │  └───────────────┘  │    │  └───────────────┘  │
│                     │    │           │         │    │           │         │
│  ┌───────────────┐  │    │  ┌───────────────┐  │    │  ┌───────────────┐  │
│  │ Session Mgmt  │  │    │  │ State Manager │  │    │  │ Project Mgmt  │  │
│  │               │  │    │  │               │  │    │  │               │  │
│  └───────────────┘  │    │  └───────────────┘  │    │  └───────────────┘  │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

### Component Architecture

```
@mosaicstack/mcp-orchestrator/
├── src/
│   ├── server/                 # MCP server implementation
│   │   ├── MCPServer.ts        # Main server class
│   │   ├── Transport.ts        # Stdio/SSE transport handlers
│   │   └── Protocol.ts         # MCP protocol implementation
│   ├── tools/                  # Tool implementations
│   │   ├── TaskTools.ts        # Task management tools
│   │   ├── ProjectTools.ts     # Project coordination tools
│   │   ├── AgentTools.ts       # Agent orchestration tools
│   │   └── BaseTools.ts        # Tool base classes
│   ├── services/               # Business logic services
│   │   ├── TaskService.ts      # Task management service
│   │   ├── ProjectService.ts   # Project coordination service
│   │   ├── AgentService.ts     # Agent orchestration service
│   │   └── StateService.ts     # State management service
│   ├── types/                  # TypeScript definitions
│   │   ├── MCP.ts             # MCP protocol types
│   │   ├── Tools.ts           # Tool interface definitions
│   │   └── Domain.ts          # Domain model types
│   ├── config/                 # Configuration management
│   │   ├── Config.ts          # Configuration loader
│   │   └── Schema.ts          # Configuration schema
│   └── utils/                  # Utility functions
│       ├── Logger.ts          # Logging utilities
│       ├── Validation.ts      # Input validation
│       └── Helpers.ts         # Common helpers
├── bin/
│   └── mosaic-mcp             # CLI executable
├── tests/                     # Test suites
├── docs/                      # Documentation
└── examples/                  # Usage examples
```

## Technical Specifications

### Dependencies

**Core Dependencies**:
```json
{
  "@modelcontextprotocol/sdk": "^0.4.0",
  "zod": "^3.22.0",
  "winston": "^3.11.0",
  "sqlite3": "^5.1.6"
}
```

**Development Dependencies**:
```json
{
  "@types/node": "^20.0.0",
  "typescript": "^5.0.0",
  "jest": "^29.0.0",
  "eslint": "^8.0.0",
  "prettier": "^3.0.0"
}
```

### MCP Protocol Implementation

**Server Capabilities**:
```typescript
interface ServerCapabilities {
  tools: {
    listChanged: true
  }
  logging: {
    level: "debug" | "info" | "warn" | "error"
  }
  experimental: {
    hooks: true
  }
}
```

**Transport Support**:
- **Stdio**: Primary transport for local OpenCode integration
- **SSE**: Optional remote transport for web integrations
- **WebSocket**: Future support for real-time collaboration

## Tool Specifications

### Tool Categories

#### 1. Task Management Tools (`mosaic_task_*`)

**mosaic_task_create**
```typescript
{
  name: "mosaic_task_create",
  description: "Create a new task with UPP hierarchy support",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string", minLength: 1, maxLength: 200 },
      description: { type: "string", maxLength: 2000 },
      type: { 
        type: "string", 
        enum: ["epic", "feature", "story", "task", "subtask", "atomic"] 
      },
      parent_id: { type: "string", optional: true },
      priority: { 
        type: "string", 
        enum: ["low", "medium", "high", "critical"],
        default: "medium"
      },
      assignee: { type: "string", optional: true },
      estimated_hours: { type: "number", minimum: 0, optional: true },
      due_date: { type: "string", format: "date-time", optional: true },
      labels: { type: "array", items: { type: "string" }, optional: true },
      dependencies: { type: "array", items: { type: "string" }, optional: true }
    },
    required: ["title", "type"]
  }
}
```

**mosaic_task_assign**
```typescript
{
  name: "mosaic_task_assign",
  description: "Assign a task to an agent or person",
  inputSchema: {
    type: "object",
    properties: {
      task_id: { type: "string", minLength: 1 },
      assignee: { type: "string", minLength: 1 },
      assignee_type: { 
        type: "string", 
        enum: ["agent", "human", "team"],
        default: "agent"
      },
      priority: { 
        type: "string", 
        enum: ["low", "medium", "high", "critical"],
        optional: true
      },
      deadline: { type: "string", format: "date-time", optional: true },
      notes: { type: "string", maxLength: 1000, optional: true }
    },
    required: ["task_id", "assignee"]
  }
}
```

**mosaic_task_status**
```typescript
{
  name: "mosaic_task_status",
  description: "Update or query task status",
  inputSchema: {
    type: "object",
    properties: {
      task_id: { type: "string", optional: true },
      status: { 
        type: "string", 
        enum: ["pending", "in_progress", "blocked", "completed", "cancelled"],
        optional: true
      },
      progress_percent: { type: "number", minimum: 0, maximum: 100, optional: true },
      notes: { type: "string", maxLength: 1000, optional: true },
      filter: {
        type: "object",
        properties: {
          assignee: { type: "string", optional: true },
          status: { type: "string", optional: true },
          priority: { type: "string", optional: true },
          due_before: { type: "string", format: "date-time", optional: true }
        },
        optional: true
      }
    }
  }
}
```

**mosaic_task_depend**
```typescript
{
  name: "mosaic_task_depend",
  description: "Manage task dependencies",
  inputSchema: {
    type: "object",
    properties: {
      task_id: { type: "string", minLength: 1 },
      depends_on: { type: "array", items: { type: "string" } },
      dependency_type: { 
        type: "string", 
        enum: ["blocks", "requires", "relates_to"],
        default: "blocks"
      },
      action: { 
        type: "string", 
        enum: ["add", "remove", "list"],
        default: "add"
      }
    },
    required: ["task_id"]
  }
}
```

#### 2. Project Coordination Tools (`mosaic_project_*`)

**mosaic_project_list**
```typescript
{
  name: "mosaic_project_list",
  description: "List available projects",
  inputSchema: {
    type: "object",
    properties: {
      filter: { 
        type: "string", 
        enum: ["all", "active", "completed", "archived"],
        default: "active"
      },
      include_stats: { type: "boolean", default: false }
    }
  }
}
```

**mosaic_project_switch**
```typescript
{
  name: "mosaic_project_switch",
  description: "Switch to a different project context",
  inputSchema: {
    type: "object",
    properties: {
      project_name: { type: "string", minLength: 1 },
      project_id: { type: "string", optional: true },
      create_if_missing: { type: "boolean", default: false },
      sync_tasks: { type: "boolean", default: true }
    },
    required: ["project_name"]
  }
}
```

**mosaic_project_status**
```typescript
{
  name: "mosaic_project_status",
  description: "Get comprehensive project status",
  inputSchema: {
    type: "object",
    properties: {
      project_id: { type: "string", optional: true },
      include_tasks: { type: "boolean", default: true },
      include_agents: { type: "boolean", default: true },
      include_metrics: { type: "boolean", default: false },
      time_range: { 
        type: "string", 
        enum: ["day", "week", "month", "quarter"],
        default: "week"
      }
    }
  }
}
```

#### 3. Agent Orchestration Tools (`mosaic_agent_*`)

**mosaic_agent_spawn**
```typescript
{
  name: "mosaic_agent_spawn",
  description: "Spawn a specialized AI agent",
  inputSchema: {
    type: "object",
    properties: {
      persona: { 
        type: "string",
        pattern: "^[A-Z]+-[A-Z]+-[A-Z]+$",
        description: "Agent persona (e.g., BE-BACKEND-BENJAMIN)"
      },
      task: { type: "string", minLength: 10, maxLength: 500 },
      context: { type: "string", maxLength: 2000, optional: true },
      tools: { type: "array", items: { type: "string" }, optional: true },
      model: { type: "string", optional: true },
      timeout: { type: "number", minimum: 60, maximum: 3600, default: 1800 },
      priority: { 
        type: "string", 
        enum: ["low", "medium", "high"],
        default: "medium"
      },
      handoff_to: { type: "string", optional: true }
    },
    required: ["persona", "task"]
  }
}
```

**mosaic_agent_coordinate**
```typescript
{
  name: "mosaic_agent_coordinate",
  description: "Coordinate multiple agents for complex tasks",
  inputSchema: {
    type: "object",
    properties: {
      coordination_type: { 
        type: "string", 
        enum: ["sequence", "parallel", "pipeline"],
        default: "sequence"
      },
      agents: {
        type: "array",
        items: {
          type: "object",
          properties: {
            persona: { type: "string" },
            task: { type: "string" },
            depends_on: { type: "array", items: { type: "string" }, optional: true }
          },
          required: ["persona", "task"]
        },
        minItems: 2,
        maxItems: 5
      },
      timeout: { type: "number", minimum: 300, maximum: 7200, default: 3600 },
      failure_strategy: { 
        type: "string", 
        enum: ["abort", "continue", "retry"],
        default: "retry"
      }
    },
    required: ["agents"]
  }
}
```

**mosaic_agent_monitor**
```typescript
{
  name: "mosaic_agent_monitor",
  description: "Monitor agent progress and health",
  inputSchema: {
    type: "object",
    properties: {
      agent_id: { type: "string", optional: true },
      include_logs: { type: "boolean", default: false },
      include_metrics: { type: "boolean", default: true },
      status_filter: { 
        type: "string", 
        enum: ["all", "active", "completed", "failed"],
        default: "active"
      },
      time_range: { 
        type: "string", 
        enum: ["1h", "4h", "24h", "week"],
        default: "4h"
      }
    }
  }
}
```

### Tool Response Format

All tools return responses in the following format:

```typescript
interface ToolResponse {
  title: string;           // Human-readable operation title
  metadata: {             // Structured metadata for programmatic use
    operation: string;    // Operation performed
    status: "success" | "error" | "warning";
    data?: any;          // Operation-specific data
    timestamp: string;   // ISO 8601 timestamp
    execution_time_ms: number;
  };
  output: string;         // Markdown-formatted output for display
}
```

## Data Models

### Task Model
```typescript
interface Task {
  id: string;                    // Unique identifier (T.XXX.XX.XX.XX)
  title: string;                 // Task title
  description?: string;          // Detailed description
  type: TaskType;               // Task type in UPP hierarchy
  status: TaskStatus;           // Current status
  priority: Priority;           // Task priority
  parent_id?: string;           // Parent task ID
  assignee?: string;            // Assigned agent/person
  estimated_hours?: number;     // Estimated effort
  actual_hours?: number;        // Actual effort spent
  due_date?: Date;             // Due date
  completed_date?: Date;       // Completion date
  labels: string[];            // Task labels/tags
  dependencies: string[];      // Task dependencies
  created_at: Date;           // Creation timestamp
  updated_at: Date;           // Last update timestamp
  created_by: string;         // Creator
  project_id: string;         // Associated project
}

type TaskType = "epic" | "feature" | "story" | "task" | "subtask" | "atomic";
type TaskStatus = "pending" | "in_progress" | "blocked" | "completed" | "cancelled";
type Priority = "low" | "medium" | "high" | "critical";
```

### Project Model
```typescript
interface Project {
  id: string;                   // Unique identifier
  name: string;                 // Project name
  description?: string;         // Project description
  status: ProjectStatus;        // Current status
  owner: string;               // Project owner
  team_members: string[];      // Team member IDs
  created_at: Date;           // Creation timestamp
  updated_at: Date;           // Last update timestamp
  config: ProjectConfig;       // Project-specific configuration
  stats: ProjectStats;         // Project statistics
}

type ProjectStatus = "active" | "completed" | "archived" | "on_hold";

interface ProjectConfig {
  default_agent_model: string;
  max_concurrent_agents: number;
  task_auto_assignment: boolean;
  notification_preferences: NotificationConfig;
}

interface ProjectStats {
  total_tasks: number;
  completed_tasks: number;
  active_agents: number;
  total_hours_spent: number;
  completion_rate: number;
}
```

### Agent Model
```typescript
interface Agent {
  id: string;                   // Unique identifier
  persona: string;             // Agent persona (e.g., BE-BACKEND-BENJAMIN)
  status: AgentStatus;         // Current status
  current_task?: string;       // Current task ID
  model: string;              // AI model being used
  tools: string[];            // Available tools
  created_at: Date;           // Spawn timestamp
  last_activity: Date;        // Last activity timestamp
  context: AgentContext;      // Agent context
  metrics: AgentMetrics;      // Performance metrics
}

type AgentStatus = "idle" | "working" | "waiting" | "completed" | "failed";

interface AgentContext {
  project_id: string;
  task_queue: string[];
  conversation_history: Message[];
  state_data: Record<string, any>;
}

interface AgentMetrics {
  tasks_completed: number;
  average_completion_time: number;
  success_rate: number;
  last_error?: string;
}
```

## Configuration Schema

### Server Configuration
```typescript
interface MCPServerConfig {
  server: {
    name: string;              // Server identifier
    version: string;           // Server version
    description?: string;      // Server description
  };
  transport: {
    type: "stdio" | "sse" | "websocket";
    port?: number;            // For SSE/WebSocket
    host?: string;           // For SSE/WebSocket
    timeout: number;         // Connection timeout (ms)
  };
  tools: {
    task_management: ToolConfig;
    project_coordination: ToolConfig;
    agent_orchestration: ToolConfig;
  };
  storage: {
    type: "sqlite" | "postgresql";
    connection_string: string;
    migrations_path: string;
    backup_enabled: boolean;
    backup_interval: string;
  };
  logging: {
    level: "debug" | "info" | "warn" | "error";
    file?: string;
    console: boolean;
    structured: boolean;
  };
  security: {
    max_concurrent_tools: number;
    tool_timeout: number;
    rate_limiting: {
      enabled: boolean;
      requests_per_minute: number;
    };
  };
}

interface ToolConfig {
  enabled: boolean;
  namespace: string;
  rate_limit?: number;
  permissions?: string[];
}
```

### Example Configuration
```json
{
  "server": {
    "name": "mosaic-mcp-orchestrator",
    "version": "1.0.0",
    "description": "MosAIc Stack MCP orchestrator for OpenCode integration"
  },
  "transport": {
    "type": "stdio",
    "timeout": 30000
  },
  "tools": {
    "task_management": {
      "enabled": true,
      "namespace": "mosaic_task",
      "rate_limit": 60
    },
    "project_coordination": {
      "enabled": true,
      "namespace": "mosaic_project",
      "rate_limit": 30
    },
    "agent_orchestration": {
      "enabled": true,
      "namespace": "mosaic_agent",
      "rate_limit": 10
    }
  },
  "storage": {
    "type": "sqlite",
    "connection_string": "~/.mosaic/data/mcp.db",
    "migrations_path": "./migrations",
    "backup_enabled": true,
    "backup_interval": "1h"
  },
  "logging": {
    "level": "info",
    "file": "~/.mosaic/logs/mcp.log",
    "console": false,
    "structured": true
  },
  "security": {
    "max_concurrent_tools": 5,
    "tool_timeout": 300000,
    "rate_limiting": {
      "enabled": true,
      "requests_per_minute": 100
    }
  }
}
```

## Implementation Plan

### Phase 1: Foundation (Week 1) ✅ COMPLETED

**Deliverables**:
- [x] Basic MCP server implementation with stdio transport
- [x] Tool registry and base tool classes
- [x] Configuration system with validation
- [x] SQLite storage backend
- [x] Basic logging and error handling

**MVP Tools**:
- [x] `mosaic_task_create`
- [x] `mosaic_task_status`
- [x] `mosaic_project_list`

**Testing**:
- [ ] Unit tests for core components
- [ ] Integration tests with mock OpenCode client
- [ ] Configuration validation tests

**Completion Date**: 2025-07-21  
**Implementation Status**: Foundation complete with full MCP server, all core services, and MVP tools implemented. Package structure created with proper TypeScript configuration, CLI interface, and comprehensive documentation.

### Phase 2: Core Tools (Week 2)

**Deliverables**:
- [ ] Complete task management tools
- [ ] Project coordination tools
- [ ] Data persistence and migration system
- [ ] Enhanced error handling and validation

**Additional Tools**:
- [ ] `mosaic_task_assign`
- [ ] `mosaic_task_depend`
- [ ] `mosaic_project_switch`
- [ ] `mosaic_project_status`

**Testing**:
- [ ] Tool functionality tests
- [ ] Data persistence tests
- [ ] Error scenario testing

### Phase 3: Agent Orchestration (Week 3)

**Deliverables**:
- [ ] Agent orchestration tools
- [ ] Integration with MosAIc agent system
- [ ] Advanced coordination algorithms
- [ ] Performance monitoring

**Agent Tools**:
- [ ] `mosaic_agent_spawn`
- [ ] `mosaic_agent_coordinate`
- [ ] `mosaic_agent_monitor`

**Testing**:
- [ ] Agent lifecycle tests
- [ ] Coordination scenario tests
- [ ] Performance benchmarks

### Phase 4: Polish & Documentation (Week 4)

**Deliverables**:
- [ ] Complete documentation
- [ ] CLI interface improvements
- [ ] Performance optimizations
- [ ] Security hardening

**Documentation**:
- [ ] API reference documentation
- [ ] Integration examples
- [ ] Troubleshooting guide
- [ ] Performance tuning guide

**Testing**:
- [ ] End-to-end integration tests
- [ ] Load testing
- [ ] Security testing
- [ ] Documentation validation

## Quality Standards

### Code Quality
- **TypeScript**: Strict mode enabled
- **Test Coverage**: Minimum 80%
- **Linting**: ESLint with strict rules
- **Formatting**: Prettier for consistent style

### Performance Requirements
- **Tool Response Time**: < 1 second for 95% of requests
- **Memory Usage**: < 100MB under normal load
- **Concurrent Tools**: Support up to 10 concurrent tool executions
- **Startup Time**: < 3 seconds cold start

### Security Requirements
- **Input Validation**: All inputs validated with Zod schemas
- **Rate Limiting**: Configurable rate limits per tool
- **Error Handling**: No sensitive data in error messages
- **Logging**: Secure logging without credential exposure

### Reliability Requirements
- **Uptime**: 99.9% availability during active sessions
- **Error Recovery**: Graceful handling of all error conditions
- **Data Integrity**: ACID compliance for all data operations
- **Backup**: Automated backup and recovery procedures

## Monitoring and Observability

### Metrics Collection
```typescript
interface MCPMetrics {
  // Performance metrics
  tool_execution_time: Map<string, number[]>;
  tool_execution_count: Map<string, number>;
  tool_error_rate: Map<string, number>;
  
  // Resource metrics
  memory_usage: number;
  cpu_usage: number;
  storage_usage: number;
  
  // Business metrics
  active_tasks: number;
  active_agents: number;
  completion_rate: number;
}
```

### Health Checks
- **Database connectivity**: SQLite/PostgreSQL connection status
- **Memory usage**: Current memory consumption
- **Tool availability**: All tools responsive
- **Configuration validity**: Configuration file validation

### Logging Strategy
```typescript
interface LogEntry {
  timestamp: string;         // ISO 8601 timestamp
  level: LogLevel;          // Log level
  message: string;          // Human-readable message
  tool?: string;           // Tool name if applicable
  execution_id?: string;   // Unique execution ID
  duration_ms?: number;    // Execution duration
  metadata: Record<string, any>; // Structured metadata
}
```

## Security Considerations

### Input Validation
- All tool inputs validated with Zod schemas
- Maximum string lengths enforced
- SQL injection prevention through parameterized queries
- Path traversal prevention for file operations

### Access Control
- Tool-level permissions (future enhancement)
- Rate limiting per tool category
- Resource usage limits (memory, CPU, storage)
- Audit logging for all operations

### Data Protection
- Sensitive data encryption at rest
- Secure configuration file handling
- No credentials in logs or error messages
- GDPR compliance for user data

## Future Enhancements

### Version 1.1 (Q2 2025)
- [ ] SSE transport for remote access
- [ ] Web dashboard for monitoring
- [ ] Advanced agent coordination algorithms
- [ ] Performance analytics dashboard

### Version 1.2 (Q3 2025)
- [ ] WebSocket transport for real-time updates
- [ ] Multi-tenant support
- [ ] Advanced security features
- [ ] Plugin system for custom tools

### Version 2.0 (Q4 2025)
- [ ] Distributed deployment support
- [ ] Advanced AI model integration
- [ ] Enterprise authentication integration
- [ ] Advanced workflow automation

## Success Criteria

### Technical Success
- [ ] All tools implemented and tested
- [ ] Performance requirements met
- [ ] Security standards achieved
- [ ] Documentation complete and accurate

### Integration Success
- [ ] Seamless OpenCode integration
- [ ] Zero modification requirement for OpenCode
- [ ] Stable and reliable operation
- [ ] Positive user feedback

### Business Success
- [ ] Reduced development time with agent coordination
- [ ] Improved project visibility and tracking
- [ ] Enhanced developer productivity
- [ ] Successful enterprise adoption

---

**Next Phase**: Implementation of the `@mosaicstack/mcp-orchestrator` package following this specification.