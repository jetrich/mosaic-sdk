# MCP Architecture Analysis Report

**Date**: 2025-08-10  
**Agent**: MCP Architecture Specialist  
**Location**: `/home/jwoltje/src/mosaic-sdk`

## Executive Summary

The current MCP infrastructure has multiple services running simultaneously, causing tool discovery conflicts and preventing Claude Code from accessing the full 33-tool MosAIc planning suite. Claude Code is connecting to an MCP Gateway instead of directly to the MosAIc Orchestrator, limiting access to only 27 tools instead of the full planning infrastructure.

## Current Infrastructure Analysis

### Running MCP Services

1. **MCP Gateway** (Port 3457)
   - Process: `node dist/cli.js serve --port 3457 --host 0.0.0.0` (PID: 3233280)
   - Service: Universal MCP transport gateway
   - Version: 0.0.2
   - Status: Healthy but limited tool set
   - Tools: Limited subset, no planning tools

2. **MosAIc Orchestrator** (Port 3456)
   - Process: Started via `node dist/main.js serve --http --port 3456`
   - Service: Full MCP orchestrator with planning tools
   - Version: 1.0.0
   - Tools: 33 tools including full planning suite
   - Database: SQLite at `/home/jwoltje/.config/mosaic/data/mcp.db`

3. **Sequential Thinking MCP**
   - Configuration: Present in `.mosaic/claude/sequential-thinking-config.json`
   - Status: Taking priority over MosAIc tools
   - Issue: Configured as primary MCP server

### Claude Code Configuration

**Current Configuration** (`.claude/mcp.json`):
```json
{
  "mcpServers": {
    "mosaic-orchestrator": {
      "command": "node",
      "args": ["/home/jwoltje/src/mosaic-sdk/packages/mcp-orchestrator/dist/main.js"],
      "env": {
        "NODE_ENV": "development",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

**Conflicting Configuration** (`.mosaic/claude/sequential-thinking-config.json`):
```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "mosaic": {
      "command": "mosaic-mcp",
      "args": ["serve"]
    }
  }
}
```

## Root Cause Analysis

### 1. Configuration Conflicts

**Problem**: Multiple MCP configurations are conflicting:
- Claude Code uses `.claude/mcp.json` 
- Sequential thinking uses `.mosaic/claude/sequential-thinking-config.json`
- Different transport protocols (stdio vs HTTP)

**Impact**: Claude Code defaults to sequential-thinking instead of MosAIc planning tools

### 2. Service Architecture Issues

**Problem**: Services running on different ports without proper coordination:
- Gateway on 3457 (limited tools)
- Orchestrator on 3456 (full tools)
- No unified entry point

**Impact**: Tool discovery fragmentation and connection confusion

### 3. Database Permission Issues

**Problem**: Multiple StateService initializations causing database contention:
```
Initializing StateService... (4x repeated)
Running database migrations... (4x repeated)
```

**Impact**: Resource contention and potential corruption

### 4. Transport Protocol Mismatch

**Problem**: Mixed transport protocols:
- Gateway: HTTP/SSE transport
- Orchestrator: HTTP/SSE transport
- Claude Code: Expects stdio by default

**Impact**: Connection failures and tool discovery issues

## Available Tool Analysis

### MosAIc Orchestrator Tools (33 total)

**Task Management** (8 tools):
- `mosaic_task_create`
- `mosaic_task_assign` 
- `mosaic_task_status`
- `mosaic_task_depend`
- `mosaic_task_decompose`
- `mosaic_task_estimate_batch`
- `mosaic_task_assign_intelligent`
- `mosaic_task_analyze_complexity`

**Project Management** (5 tools):
- `mosaic_project_create`
- `mosaic_project_update`
- `mosaic_project_list`
- `mosaic_project_switch`
- `mosaic_project_status`

**Agent Orchestration** (18 tools):
- `mosaic_agent_mosaic_agent_deploy`
- `mosaic_agent_mosaic_agent_status`
- `mosaic_agent_mosaic_agent_terminate`
- `mosaic_agent_mosaic_agent_message`
- `mosaic_agent_mosaic_agent_handoff`
- `mosaic_agent_mosaic_agent_broadcast`
- `mosaic_agent_mosaic_workflow_create`
- `mosaic_agent_mosaic_workflow_execute`
- `mosaic_agent_mosaic_workflow_monitor`
- `mosaic_agent_mosaic_workflow_list`
- `mosaic_agent_mosaic_workflow_get`
- `mosaic_agent_mosaic_workflow_pause`
- `mosaic_agent_mosaic_workflow_resume`
- `mosaic_agent_mosaic_workflow_cancel`
- `mosaic_agent_mosaic_resource_monitor`
- `mosaic_agent_mosaic_agent_limits`
- `mosaic_agent_mosaic_performance_report`
- `mosaic_agent_mosaic_resource_alerts`

**Planning Tools** (2 tools):
- `mosaic_plan_business`
- `mosaic_plan_all`

## Proper Architecture Design

### 1. Unified MCP Entry Point

**Design**: Single authoritative MCP server with proper tool routing

```
Claude Code → Single MCP Server → Tool Router → {Task Tools, Project Tools, Agent Tools, Planning Tools}
```

**Benefits**:
- Eliminates configuration conflicts
- Provides consistent tool discovery
- Enables proper tool prioritization
- Simplifies maintenance

### 2. Hierarchical Tool Organization

**Structure**:
```
MosAIc MCP Server
├── Core Planning Tools (Priority 1)
│   ├── mosaic_plan_business
│   ├── mosaic_plan_all
│   └── mosaic_task_decompose
├── Task Management Tools (Priority 2)
│   ├── mosaic_task_create
│   ├── mosaic_task_assign
│   └── ...
├── Project Management Tools (Priority 3)
│   └── ...
└── Advanced Agent Tools (Priority 4)
    └── ...
```

### 3. Configuration Consolidation

**Single Configuration File**: `.claude/mcp.json`
```json
{
  "mcpServers": {
    "mosaic": {
      "command": "mosaic-mcp-unified",
      "args": ["serve", "--mode=planning"],
      "env": {
        "MOSAIC_CONFIG": "~/.config/mosaic/config.json",
        "MOSAIC_MODE": "claude-code-integration",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### 4. Database Architecture

**Design**: Single database instance with connection pooling
- Location: `~/.config/mosaic/data/claude-mcp.db`
- Connection pooling to handle concurrent access
- Proper migration management
- Backup strategy

### 5. Transport Protocol Standardization

**Recommendation**: HTTP/SSE for Claude Code integration
- Consistent with Claude Code's expectations
- Better debugging and monitoring
- Supports real-time updates
- Easier integration testing

## Implementation Roadmap

### Phase 1: Infrastructure Consolidation (2 days)
1. **Stop Conflicting Services**
   - Terminate gateway on 3457
   - Stop multiple orchestrator instances
   - Clean up PID files

2. **Database Cleanup**
   - Create new isolated database
   - Run single migration set
   - Implement connection pooling

3. **Configuration Unification**
   - Remove sequential-thinking config conflicts
   - Create single authoritative `.claude/mcp.json`
   - Backup existing configurations

### Phase 2: Unified MCP Server (3 days)
1. **Create MCP Unified Server**
   - New entry point: `mosaic-mcp-unified`
   - Tool prioritization system
   - Mode-based tool filtering
   - Health monitoring

2. **Tool Registration System**
   - Dynamic tool discovery
   - Priority-based routing
   - Tool capability metadata
   - Performance monitoring

3. **Transport Implementation**
   - HTTP/SSE primary transport
   - Stdio fallback support
   - Session management
   - Error handling

### Phase 3: Claude Code Integration (2 days)
1. **Configuration Testing**
   - Validate tool discovery (33 tools)
   - Test priority ordering
   - Verify planning tool access
   - Performance validation

2. **Integration Testing**
   - End-to-end tool execution
   - Database operations
   - Multi-session support
   - Error recovery

3. **Documentation and Monitoring**
   - Integration guide
   - Troubleshooting documentation
   - Health monitoring dashboard
   - Performance metrics

### Phase 4: Production Readiness (1 day)
1. **Service Management**
   - Systemd service files
   - Auto-restart capabilities
   - Log rotation
   - Health checks

2. **Security Hardening**
   - Database permissions
   - Network access controls
   - API key management
   - Audit logging

## Success Metrics

### Primary Metrics
- ✅ Claude Code discovers all 33 tools
- ✅ Planning tools are prioritized and accessible
- ✅ Single configuration file manages all MCP settings
- ✅ Database operations are stable and performant
- ✅ Zero configuration conflicts

### Performance Metrics
- Tool discovery time: < 2 seconds
- Database query response: < 100ms average
- Memory usage: < 200MB baseline
- CPU utilization: < 5% idle
- Connection establishment: < 1 second

### Reliability Metrics
- 99.9% uptime target
- Zero data corruption incidents
- < 1% tool execution failures
- Recovery time: < 30 seconds
- Health check success: > 99%

## Immediate Next Steps

1. **Execute Phase 1** - Infrastructure Consolidation
2. **Assign Implementation Team**:
   - Backend Specialist: MCP server consolidation
   - Database Specialist: Database architecture cleanup
   - Integration Specialist: Claude Code connectivity
   - QA Specialist: End-to-end validation

3. **Create Implementation Tasks**:
   - Each phase broken into atomic tasks (≤30 minutes)
   - Clear acceptance criteria
   - Dependencies mapped
   - Resource allocation

## Risk Mitigation

### High-Risk Items
1. **Data Loss**: Backup all databases before migration
2. **Service Downtime**: Implement blue-green deployment
3. **Configuration Corruption**: Version control all configs
4. **Tool Compatibility**: Maintain backward compatibility layer

### Contingency Plans
- Rollback procedures for each phase
- Configuration restore mechanisms
- Database recovery procedures
- Emergency service restart protocols

## Conclusion

The current MCP infrastructure requires consolidation and proper architecture to enable Claude Code's full access to MosAIc's 33-tool planning suite. The recommended unified architecture will eliminate conflicts, improve performance, and provide a solid foundation for the MosAIc SDK's AI-driven development capabilities.

**Priority**: High  
**Timeline**: 1 week  
**Complexity**: Medium  
**Impact**: High - Enables full MosAIc planning capabilities in Claude Code

---

**Next Action**: Proceed with Phase 1 implementation and assign specialized agents for each component.