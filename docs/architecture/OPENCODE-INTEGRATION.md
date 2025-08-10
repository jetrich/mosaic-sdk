# OpenCode TUI Integration Architecture

**Document Version**: 1.0  
**Last Updated**: 2025-07-21  
**Status**: Planning  
**Epic**: E.200  

## Executive Summary

This document outlines the architecture for integrating OpenCode's terminal UI with MosAIc Stack. The integration follows a plugin-based approach using MCP (Model Context Protocol) servers, ensuring OpenCode remains unmodified while MosAIc adds enterprise features through configuration and external services.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface Layer                       │
├─────────────────────┬───────────────────────┬───────────────────┤
│   Terminal (CLI)    │    Web UI (Browser)   │   IDE Integration │
│                     │                       │                   │
│  ┌───────────────┐  │  ┌─────────────────┐ │  ┌─────────────┐ │
│  │   OpenCode    │  │  │  Tabbed Interface│ │  │   VS Code   │ │
│  │     TUI       │  │  │  - Agent Chat    │ │  │  Extension  │ │
│  │               │  │  │  - Task Monitor  │ │  │   (Future)  │ │
│  └───────┬───────┘  │  └────────┬────────┘ │  └─────────────┘ │
│          │          │           │           │                   │
├──────────┴──────────┴───────────┴───────────┴───────────────────┤
│                      Integration Layer                            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              MosAIc Shell Wrapper (mosaic)               │    │
│  │  - Additional commands (project, stack, status)          │    │
│  │  - Delegates to OpenCode for TUI operations            │    │
│  └─────────────┬───────────────────────────────────────────┘    │
│                │                                                  │
│  ┌─────────────▼───────────────┐  ┌─────────────────────────┐  │
│  │   @mosaicstack/opencode     │  │  @mosaicstack/web-ui    │  │
│  │        -adapter             │  │   - Terminal emulator    │  │
│  │   - Configuration mgmt      │  │   - Task visualization   │  │
│  │   - Mode definitions        │  │   - WebSocket client     │  │
│  └─────────────┬───────────────┘  └────────────┬────────────┘  │
│                │                                │                 │
├────────────────┴────────────────────────────────┴────────────────┤
│                         MCP Server Layer                          │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │           @mosaicstack/mcp-orchestrator                    │  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │   Task      │  │   Project   │  │    Agent    │      │  │
│  │  │   Tools     │  │   Tools     │  │    Tools    │      │  │
│  │  │             │  │             │  │             │      │  │
│  │  │ - create    │  │ - list      │  │ - spawn     │      │  │
│  │  │ - assign    │  │ - switch    │  │ - coordinate│      │  │
│  │  │ - depend    │  │ - status    │  │ - monitor   │      │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  │                                                            │  │
│  └──────────────────────┬────────────────────────────────────┘  │
│                         │                                         │
│                         │ MCP Protocol                            │
│                         │                                         │
│  ┌──────────────────────▼────────────────────────────────────┐  │
│  │                    OpenCode Core                           │  │
│  │              (Unmodified - External)                       │  │
│  │                                                            │  │
│  │  - MCP Client Infrastructure                               │  │
│  │  - Tool Registration & Execution                           │  │
│  │  - Configuration Loading (opencode.json)                   │  │
│  │  - Provider Management                                     │  │
│  │  - Session Management                                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│                        Data Layer                                 │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Task Store    │  │  Session Store  │  │   Agent Store   │  │
│  │   (SQLite)      │  │   (SQLite)      │  │   (SQLite)      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. MosAIc MCP Orchestrator

**Package**: `@mosaicstack/mcp-orchestrator`  
**Purpose**: Extends OpenCode with MosAIc-specific functionality  

#### Key Features
- Enterprise task management tools
- Multi-project coordination
- Agent orchestration capabilities
- Persistent storage layer

#### MCP Tools Provided
```typescript
interface MosaicMCPTools {
  // Task Management
  "mosaic_task_create": (params: TaskCreateParams) => Task;
  "mosaic_task_assign": (params: TaskAssignParams) => void;
  "mosaic_task_depend": (params: DependencyParams) => void;
  "mosaic_task_status": (params: StatusParams) => TaskStatus;
  
  // Project Management
  "mosaic_project_list": () => Project[];
  "mosaic_project_switch": (projectId: string) => void;
  "mosaic_project_status": (projectId: string) => ProjectStatus;
  
  // Agent Orchestration
  "mosaic_agent_spawn": (params: AgentParams) => AgentSession;
  "mosaic_agent_coordinate": (params: CoordinationParams) => void;
  "mosaic_agent_monitor": () => AgentStatus[];
}
```

### 2. OpenCode Adapter

**Package**: `@mosaicstack/opencode-adapter`  
**Purpose**: Configuration and integration management  

#### Responsibilities
- Generate OpenCode configuration
- Define custom modes
- Manage tool availability
- Handle authentication

#### Configuration Generation
```json
{
  "mcp": {
    "mosaic": {
      "type": "local",
      "command": ["mosaic-mcp", "serve"],
      "environment": {
        "MOSAIC_DATA_DIR": "~/.mosaic/data"
      }
    }
  },
  "mode": {
    "mosaic-plan": {
      "prompt": "You are using MosAIc planning mode...",
      "tools": {
        "mosaic_task_create": true,
        "mosaic_task_assign": true
      }
    }
  }
}
```

### 3. Web UI Components

**Package**: `@mosaicstack/web-ui`  
**Purpose**: Browser-based monitoring interface  

#### Components
- Tab system for view switching
- Terminal emulator (xterm.js)
- Task visualization (tree/kanban)
- Real-time updates via WebSocket

### 4. Shell Wrapper

**Binary**: `mosaic`  
**Purpose**: Unified CLI entry point  

#### Command Structure
```bash
mosaic [command] [options]

# MosAIc-specific commands
mosaic project list
mosaic stack deploy
mosaic status

# OpenCode delegation
mosaic tui [--mode mode-name]
mosaic auth login
```

## Integration Points

### 1. MCP Protocol Integration

OpenCode's MCP implementation provides these extension points:

```typescript
// OpenCode MCP client creation
const client = await experimental_createMCPClient({
  name: "mosaic",
  transport: new Experimental_StdioMCPTransport({
    command: "mosaic-mcp",
    args: ["serve"],
  })
});
```

### 2. Configuration Integration

OpenCode loads configuration from:
1. Global: `~/.config/opencode/config.json`
2. Project: `./opencode.json`

MosAIc injects its configuration through these files.

### 3. Hook Integration

OpenCode's experimental hooks:
```json
{
  "experimental": {
    "hook": {
      "session_completed": [{
        "command": ["mosaic-cli", "task", "complete"]
      }],
      "file_edited": {
        "*.ts": [{
          "command": ["mosaic-cli", "track", "edit"]
        }]
      }
    }
  }
}
```

## Data Flow

### 1. Task Creation Flow
```
User Input (TUI) 
    → OpenCode Tool Execution
    → MCP Protocol Message
    → MosAIc MCP Server
    → Task Persistence (SQLite)
    → WebSocket Broadcast
    → Web UI Update
```

### 2. Agent Coordination Flow
```
Task Assignment
    → MosAIc MCP Server
    → Agent Spawn Request
    → New OpenCode Session
    → Context Injection
    → Task Execution
    → Status Updates
```

## Security Considerations

### 1. Authentication
- OpenCode handles provider authentication
- MosAIc adds enterprise SSO layer
- Token management in secure storage

### 2. Authorization
- Role-based access control
- Project-level permissions
- Tool availability per user role

### 3. Data Protection
- Encrypted storage for sensitive data
- Secure WebSocket connections
- Audit logging for compliance

## Performance Considerations

### 1. Latency Targets
- MCP tool execution: <50ms
- WebSocket updates: <100ms
- UI responsiveness: <16ms (60fps)

### 2. Optimization Strategies
- Local socket communication
- Efficient data serialization
- Caching for repeated operations
- Connection pooling

### 3. Scalability
- Horizontal scaling for MCP servers
- Database sharding for large deployments
- CDN for web assets

## Deployment Architecture

### Development Environment
```
Local Machine
├── OpenCode (Bun process)
├── MosAIc MCP Server (Node.js)
├── Web UI Dev Server (Vite)
└── SQLite Databases
```

### Production Environment
```
Container/VM
├── OpenCode Container
├── MCP Server Container
├── Web UI Static Files (Nginx)
├── PostgreSQL Database
└── Redis Cache
```

## Migration Strategy

### Phase 1: Core Integration
1. MCP server implementation
2. Basic tool set
3. Configuration templates

### Phase 2: Enhanced Features
1. Web UI implementation
2. Task synchronization
3. Multi-project support

### Phase 3: Enterprise Features
1. SSO integration
2. Audit logging
3. Advanced analytics

## Monitoring & Observability

### Metrics
- Tool execution times
- Error rates by tool
- Active sessions
- Task completion rates

### Logging
- Structured logging (JSON)
- Log aggregation (ELK stack)
- Error tracking (Sentry)

### Health Checks
- MCP server availability
- Database connectivity
- WebSocket connections
- OpenCode process status

## Disaster Recovery

### Backup Strategy
- Hourly task database backups
- Configuration versioning
- Session state snapshots

### Recovery Procedures
1. Service restart protocols
2. Data restoration process
3. Session recovery
4. User notification

## Future Enhancements

### Planned Features
1. IDE integrations (VS Code, JetBrains)
2. Mobile monitoring app
3. AI-powered task suggestions
4. Advanced analytics dashboard

### Extension Points
- Plugin system for custom tools
- Webhook integrations
- Custom UI components
- Third-party MCP servers

## Conclusion

This architecture provides a robust, scalable integration between OpenCode and MosAIc Stack while maintaining clean separation of concerns. The plugin-based approach ensures we can leverage OpenCode's capabilities while adding enterprise features without modifying its core.