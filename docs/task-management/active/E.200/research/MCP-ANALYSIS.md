# MCP Implementation Analysis - OpenCode

**Task**: T.200.01.01.01  
**Analyst**: Research analysis using ultrathink methodology  
**Date**: 2025-07-21  
**Status**: Complete  

## Executive Summary

OpenCode implements MCP (Model Context Protocol) through a clean, extensible architecture that supports both local and remote MCP servers. The implementation uses the `experimental_createMCPClient` from the "ai" package with two transport types: stdio for local servers and SSE for remote servers. 

**Key Finding**: MosAIc can integrate seamlessly via a local MCP server without any OpenCode modifications.

**Integration Strategy**: Create `@mosaicstack/mcp-orchestrator` as a local MCP server that OpenCode connects to via stdio transport.

## Detailed Analysis (Ultrathink Methodology)

### Phase 1: Core MCP Implementation

#### 1.1 MCP Client Creation
**Location**: `src/mcp/index.ts:35-83`

OpenCode uses `experimental_createMCPClient` with two transport types:

1. **Remote MCP Servers** (SSE Transport):
```typescript
const client = await experimental_createMCPClient({
  name: key,
  transport: {
    type: "sse",
    url: mcp.url,
    headers: mcp.headers,
  },
})
```

2. **Local MCP Servers** (Stdio Transport):
```typescript
const client = await experimental_createMCPClient({
  name: key,
  transport: new Experimental_StdioMCPTransport({
    stderr: "ignore",
    command: cmd,
    args,
    env: { ...process.env, ...mcp.environment },
  }),
})
```

#### 1.2 Configuration Structure
**Location**: `src/config/config.ts:40-68`

MCP servers are configured via the `mcp` field in OpenCode configuration:

```typescript
// Local MCP Server Configuration
{
  "mcp": {
    "mosaic": {
      "type": "local",
      "command": ["mosaic-mcp", "serve"],
      "environment": {
        "MOSAIC_DATA_DIR": "~/.mosaic/data"
      },
      "enabled": true
    }
  }
}
```

**Configuration Loading Hierarchy**:
1. Global config: `~/.config/opencode/config.json`
2. Project configs: `opencode.json` or `opencode.jsonc` (searched upward)
3. Deep merge with project configs overriding global

#### 1.3 Tool Integration
**Location**: `src/mcp/index.ts:102-110`, `src/session/index.ts:696-709`

**Tool Namespace Strategy**: MCP tools are namespaced as `{clientName}_{toolName}`

```typescript
// Tools aggregation from all MCP clients
export async function tools() {
  const result: Record<string, Tool> = {}
  for (const [clientName, client] of Object.entries(await clients())) {
    for (const [toolName, tool] of Object.entries(await client.tools())) {
      result[clientName + "_" + toolName] = tool
    }
  }
  return result
}
```

**Mode-Based Tool Filtering**: Tools can be enabled/disabled per mode:
```typescript
// In session initialization
for (const [key, item] of Object.entries(await MCP.tools())) {
  if (mode.tools[key] === false) continue // Skip disabled tools
  // Register tool for session
}
```

### Phase 2: Integration Points

#### 2.1 Extension Mechanisms

**MCP Server Registration**: 
- Zero OpenCode modifications required
- Configuration-driven server addition
- Automatic tool discovery and registration
- Session-level tool availability control

**Tool Definition Standard**:
```typescript
interface Tool.Info {
  id: string
  description: string
  parameters: StandardSchemaV1
  execute(args, ctx): Promise<{
    title: string
    metadata: any
    output: string
  }>
}
```

#### 2.2 Configuration Extension Points

**Custom Modes**: Define MosAIc-specific interaction modes
```json
{
  "mode": {
    "mosaic-plan": {
      "prompt": "You are in MosAIc planning mode...",
      "tools": {
        "mosaic_task_create": true,
        "mosaic_task_assign": true,
        "todowrite": false  // Disable OpenCode's todos
      }
    }
  }
}
```

**Experimental Hooks**: Integration with OpenCode events
```json
{
  "experimental": {
    "hook": {
      "session_completed": [{
        "command": ["mosaic-cli", "task", "complete"]
      }],
      "file_edited": {
        "*.ts": [{ "command": ["mosaic-cli", "track", "edit"] }]
      }
    }
  }
}
```

#### 2.3 Error Handling & Resilience

**Graceful Failure**: MCP server failures don't break OpenCode
- Failed clients are logged but not fatal
- Error events published to OpenCode's event bus
- Individual tool failures handled per-tool

**Connection Management**:
- Automatic client cleanup on shutdown
- State management through OpenCode's app state system
- Logging for debugging and monitoring

### Phase 3: MosAIc Integration Strategy

#### 3.1 Recommended Architecture

**Primary Integration**: Local MCP Server
- **Package**: `@mosaicstack/mcp-orchestrator`
- **Transport**: Stdio (most performant)
- **Command**: `["mosaic-mcp", "serve"]`
- **Tools**: Namespace all tools with `mosaic_` prefix

**Tool Categories**:
1. **Task Management**: `mosaic_task_create`, `mosaic_task_assign`, `mosaic_task_depend`
2. **Project Coordination**: `mosaic_project_list`, `mosaic_project_switch`, `mosaic_project_status`
3. **Agent Orchestration**: `mosaic_agent_spawn`, `mosaic_agent_coordinate`, `mosaic_agent_monitor`

#### 3.2 Implementation Roadmap

**Phase 1: MCP Server Foundation**
1. Create `@mosaicstack/mcp-orchestrator` package
2. Implement basic MCP protocol compliance
3. Create tool registration system
4. Add logging and error handling

**Phase 2: Core Tools**
1. Implement task management tools
2. Add project coordination tools  
3. Create agent orchestration tools
4. Add comprehensive testing

**Phase 3: Configuration Integration**
1. Create configuration templates
2. Add mode definitions for MosAIc workflows
3. Implement hook integrations
4. Add deployment automation

#### 3.3 Risk Assessment

**Low Risk**:
- ✅ No OpenCode modifications required
- ✅ Well-defined MCP protocol
- ✅ Proven extension mechanism
- ✅ Graceful failure handling

**Medium Risk**:
- ⚠️ Dependency on experimental MCP API
- ⚠️ Tool naming conflicts (mitigated by namespacing)
- ⚠️ Configuration complexity

**Mitigation Strategies**:
- Lock to specific OpenCode version initially
- Use `mosaic_` prefix for all tools
- Provide configuration validation
- Create setup automation

### Technical Specifications

#### 3.4 MCP Server Implementation Requirements

**Package Structure**:
```
packages/mcp-orchestrator/
├── src/
│   ├── server.ts           # MCP server implementation
│   ├── tools/
│   │   ├── task.ts         # Task management tools
│   │   ├── project.ts      # Project coordination tools
│   │   └── agent.ts        # Agent orchestration tools
│   ├── types.ts            # TypeScript definitions
│   └── index.ts            # Entry point
├── bin/
│   └── mosaic-mcp          # CLI executable
├── package.json
└── tsconfig.json
```

**Dependencies**:
- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `zod` - Schema validation
- `@mosaicstack/core` - MosAIc core functionality

#### 3.5 Configuration Template

**OpenCode Configuration** (`opencode.json`):
```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "mosaic": {
      "type": "local",
      "command": ["mosaic-mcp", "serve"],
      "environment": {
        "MOSAIC_CONFIG": "~/.mosaic/config.json",
        "MOSAIC_DATA_DIR": "~/.mosaic/data"
      }
    }
  },
  "mode": {
    "mosaic-plan": {
      "prompt": "You are using MosAIc planning mode with access to enterprise task management tools.",
      "tools": {
        "mosaic_task_create": true,
        "mosaic_task_assign": true,
        "mosaic_task_depend": true,
        "mosaic_project_list": true,
        "todowrite": false,
        "todoread": false
      }
    },
    "mosaic-execute": {
      "prompt": "You are using MosAIc execution mode with full development capabilities.",
      "tools": {
        "write": true,
        "edit": true,
        "bash": true,
        "mosaic_agent_spawn": true,
        "mosaic_agent_coordinate": true
      }
    }
  }
}
```

## Next Steps

1. **Immediate**: Create `@mosaicstack/mcp-orchestrator` package structure
2. **Week 1**: Implement basic MCP server with 3-5 core tools
3. **Week 2**: Add configuration generation and OpenCode integration
4. **Week 3**: Implement remaining tools and testing
5. **Week 4**: Documentation and deployment automation

## Conclusion

OpenCode's MCP implementation provides an ideal integration point for MosAIc. The architecture is clean, well-documented, and designed for extensibility. Our recommended approach requires zero OpenCode modifications and provides a robust foundation for enterprise features.

**Success Probability**: High (90%+)  
**Technical Risk**: Low  
**Implementation Effort**: 2-3 weeks for MVP