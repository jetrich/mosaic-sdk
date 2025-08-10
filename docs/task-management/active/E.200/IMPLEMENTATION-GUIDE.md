# E.200 OpenCode Integration - Implementation Guide

**Epic**: E.200  
**Status**: Active Implementation  
**Updated**: 2025-07-21  

## Current Phase: Research & Analysis

### Active Work Streams

#### 1. MCP Architecture Research (Priority: Critical)
**Task**: T.200.01.01.01  
**Objective**: Understand OpenCode's MCP implementation  
**Location**: `worktrees/opencode/packages/opencode/src/mcp/`  

Key files to analyze:
- `index.ts` - MCP client creation and management
- Tool registration flow
- Configuration loading
- Error handling

**Output**: `docs/task-management/active/E.200/research/MCP-ANALYSIS.md`

#### 2. Documentation Updates (Priority: High)
**Objective**: Update project documentation for OpenCode integration  

Files to update:
- `README.md` - Add OpenCode integration section
- `CLAUDE.md` - Add TUI commands and workflow
- Create `docs/sdk/operations/OPENCODE-SETUP-GUIDE.md`

Reference: `docs/task-management/planning/E.200-OPENCODE-TUI/DOCUMENTATION-UPDATES.md`

#### 3. Design Token Extraction (Priority: Medium)
**Task**: T.200.05.01.01  
**Objective**: Extract reusable design tokens from mosaic-site  

Source files:
- `mosaic-site/src/app/globals.css`
- `mosaic-docs/submodules/mosaic-site/COMPONENT_SPECIFICATION.md`

**Output**: `packages/shared-tokens/`

## Technical Implementation Plan

### Phase 1: Foundation (Current)
1. Complete MCP research
2. Document integration points
3. Update critical documentation
4. Extract design system tokens

### Phase 2: Architecture Design
1. Design MCP server specification
2. Define tool interfaces
3. Create API documentation
4. Plan package structure

### Phase 3: Core Implementation
1. Create `@mosaicstack/mcp-orchestrator` package
2. Implement MCP server
3. Create MosAIc-specific tools
4. Set up configuration integration

### Phase 4: UI Integration
1. Implement tabbed interface
2. Integrate xterm.js terminal
3. Create task monitoring views
4. Implement WebSocket communication

## Package Structure

```
packages/
├── mcp-orchestrator/
│   ├── src/
│   │   ├── server.ts         # MCP server implementation
│   │   ├── tools/            # MosAIc-specific tools
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── opencode-adapter/
│   ├── src/
│   │   ├── config.ts         # Configuration generator
│   │   ├── modes.ts          # Custom mode definitions
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
└── shared-tokens/
    ├── src/
    │   ├── colors.ts         # Color tokens
    │   ├── typography.ts     # Typography tokens
    │   └── index.ts
    ├── package.json
    └── README.md
```

## Configuration Integration

### OpenCode Configuration
```json
{
  "mcp": {
    "mosaic": {
      "type": "local",
      "command": ["mosaic-mcp", "serve"],
      "environment": {
        "MOSAIC_DATA_DIR": "~/.mosaic/data",
        "MOSAIC_PORT": "3456"
      }
    }
  },
  "mode": {
    "mosaic-plan": {
      "prompt": "You are in MosAIc planning mode with access to task management tools.",
      "tools": {
        "mosaic_task_create": true,
        "mosaic_task_assign": true,
        "mosaic_task_depend": true,
        "todowrite": false
      }
    },
    "mosaic-execute": {
      "prompt": "You are in MosAIc execution mode with full development tools.",
      "tools": {
        "write": true,
        "edit": true,
        "mosaic_agent_spawn": true
      }
    }
  }
}
```

## Implementation Guidelines

### MCP Server Development
1. Use TypeScript with strict mode
2. Follow OpenCode's MCP protocol exactly
3. Implement proper error handling
4. Add comprehensive logging
5. Include health checks

### Tool Development
Each MosAIc tool should:
- Have clear, single responsibility
- Include parameter validation
- Return consistent response format
- Handle errors gracefully
- Include usage examples

### Testing Strategy
- Unit tests for all tools
- Integration tests with OpenCode
- Performance benchmarks
- Error scenario testing
- End-to-end workflow tests

## Progress Tracking

### Completed
- ✅ Epic documentation structure
- ✅ UPP task decomposition
- ✅ Technical architecture design
- ✅ Implementation planning

### In Progress
- 🔄 MCP implementation research
- 🔄 Documentation updates
- 🔄 Design token extraction

### Upcoming
- ⏳ MCP server implementation
- ⏳ Configuration integration
- ⏳ Web UI development
- ⏳ Testing framework

## Success Criteria

1. **No OpenCode Modifications**: Plugin-only approach
2. **Performance**: <100ms additional latency
3. **Compatibility**: Works with OpenCode updates
4. **Documentation**: Complete setup guides
5. **Testing**: >95% code coverage

## Resources

### Documentation
- Epic Plan: `docs/task-management/planning/E.200-OPENCODE-TUI/EPIC-PLAN.md`
- Architecture: `docs/architecture/OPENCODE-INTEGRATION.md`
- Task Breakdown: `docs/task-management/planning/E.200-OPENCODE-TUI/FEATURE-BREAKDOWN.md`

### Code References
- OpenCode Source: `worktrees/opencode/`
- MosAIc Packages: `packages/`
- Integration Tests: `tests/integration/opencode/`

## Next Steps

1. Complete MCP research analysis
2. Review findings and plan architecture
3. Begin package implementation
4. Set up development environment
5. Create integration tests