# Tony 2.8.0 MCP Integration Documentation

## Overview

Tony Framework 2.8.0 introduces mandatory Model Context Protocol (MCP) integration, transforming Tony from a standalone coordination tool into a fully integrated component of the MosAIc ecosystem. This integration enables seamless communication between Tony and other AI agents through a standardized protocol.

## Key Features

### 1. Minimal MCP Implementation
- **Purpose**: Unblock Tony 2.8.0 development while full orchestration architecture (Issue #81) is in progress
- **Design**: Simple in-memory implementation with essential functionality
- **Location**: `tony/core/mcp/`

### 2. Core Components

#### Interfaces (`minimal-interface.ts`)
- `MinimalMCPServer`: Core server interface
- `AgentConfig`: Agent configuration structure
- `AgentRegistration`: Registration response
- `MCPRequest/MCPResponse`: Communication protocol
- `AgentStatus/HealthStatus`: Monitoring interfaces

#### Implementation (`minimal-implementation.ts`)
- `MinimalMCPServerImpl`: In-memory MCP server
- Agent registry management
- Request routing logic
- Health monitoring
- Token generation

#### Tony Integration (`tony-integration.ts`)
- `TonyMCPIntegration`: Tony-specific MCP client
- Agent deployment automation
- Task assignment via MCP
- Coordination broadcasting
- Event-driven architecture

## Installation & Setup

### 1. Update to Tony 2.8.0
```bash
cd /home/jwoltje/src/mosaic-sdk/tony
npm install
npm run build
```

### 2. Initialize MCP Integration
```typescript
import { initializeTonyMCP } from '@tony/core';

// Quick start
const { tony, agents, health } = await initializeTonyMCP();
```

### 3. Manual Integration
```typescript
import { tonyMCP } from '@tony/core';

// Initialize Tony
await tonyMCP.initialize();

// Deploy agents
const implAgent = await tonyMCP.deployAgent('implementation');
const qaAgent = await tonyMCP.deployAgent('qa');
const docAgent = await tonyMCP.deployAgent('documentation');
```

## Usage Examples

### Basic Agent Deployment
```typescript
// Deploy a specialized agent
const agent = await tonyMCP.deployAgent('implementation');
console.log('Agent deployed:', agent.agentId);
```

### Task Assignment
```typescript
// Assign a task to an agent
const task = {
  type: 'implementation',
  epic: 'E.055',
  story: 'S.055.01.01',
  description: 'Implement feature X',
  priority: 'high'
};

const result = await tonyMCP.assignTask(agentId, task);
```

### Coordination Broadcasting
```typescript
// Broadcast to all agents
await tonyMCP.broadcastCoordination({
  action: 'start',
  phase: 'implementation',
  epic: 'E.055',
  message: 'Begin implementation phase'
});
```

### Status Monitoring
```typescript
// Get all agent statuses
const statuses = await tonyMCP.getAgentStatuses();
statuses.forEach(status => {
  console.log(`${status.name}: ${status.state}`);
});
```

### Event Handling
```typescript
// Listen to MCP events
tonyMCP.on('agentDeployed', ({ type, registration }) => {
  console.log(`${type} agent deployed:`, registration.agentId);
});

tonyMCP.on('taskAssigned', ({ agentId, task }) => {
  console.log(`Task assigned to ${agentId}`);
});

tonyMCP.on('healthUpdate', (health) => {
  console.log('System health:', health.status);
});
```

## Integration with MosAIc Stack

### Connection to MCP Server (Port 3456)
The minimal implementation currently runs in-memory, but is designed to integrate with the MosAIc MCP server:

```typescript
// Future integration point
const mcpConfig = {
  serverUrl: 'http://localhost:3456',
  timeout: 30000,
  retryAttempts: 3
};
```

### Agent Types Supported
1. **Tech Lead** (Tony itself)
   - Capabilities: project.coordinate, agent.deploy, task.decompose, context.manage, upp.planning
   
2. **Implementation Agent**
   - Capabilities: code.write, code.review, test.write, refactor.apply
   
3. **QA Agent**
   - Capabilities: test.run, test.validate, quality.check, coverage.analyze
   
4. **Security Agent**
   - Capabilities: security.scan, vulnerability.check, compliance.verify
   
5. **Documentation Agent**
   - Capabilities: docs.write, api.document, readme.update

## Migration Guide from Tony 2.7.0 to 2.8.0

### Breaking Changes
1. **MCP is Now Mandatory**
   - Tony must be initialized with MCP before use
   - All agent coordination goes through MCP
   
2. **New Initialization Process**
   ```typescript
   // Old (2.7.0)
   const tony = new TonyFramework();
   
   // New (2.8.0)
   import { tonyMCP } from '@tony/core';
   await tonyMCP.initialize();
   ```

3. **Agent Deployment Changes**
   ```typescript
   // Old (2.7.0)
   tony.spawnAgent('implementation');
   
   // New (2.8.0)
   await tonyMCP.deployAgent('implementation');
   ```

### New Features
1. **Event-Driven Architecture**: Subscribe to MCP events
2. **Health Monitoring**: Automatic health checks every 30 seconds
3. **Centralized Routing**: All requests go through MCP
4. **Token-Based Security**: Each agent gets a unique token

### Compatibility Notes
- The minimal implementation is forward-compatible with full MCP
- Existing Tony plugins will need updates to use MCP
- State management now integrates with MCP state layer

## Architecture Decisions

### Why Minimal Implementation?
1. **Unblock Development**: Allows Tony 2.8.0 to proceed while full orchestration is built
2. **Simple Integration**: Easy to understand and implement
3. **Forward Compatible**: Designed to work with future full MCP server
4. **In-Memory**: No external dependencies for initial development

### Design Principles
1. **Simplicity**: Minimal code for maximum functionality
2. **Type Safety**: Full TypeScript with strict typing
3. **Event-Driven**: Uses EventEmitter for extensibility
4. **Singleton Pattern**: Single instance for coordination
5. **Error Handling**: Comprehensive error management

## Future Enhancements

### Phase 1: Current (Minimal Implementation)
- ✅ Basic agent registration
- ✅ Simple request routing
- ✅ In-memory state
- ✅ Health monitoring
- ✅ Event system

### Phase 2: MCP Server Integration
- [ ] Connect to external MCP server (port 3456)
- [ ] Persistent state management
- [ ] Advanced routing algorithms
- [ ] Authentication & authorization
- [ ] Message queuing

### Phase 3: Full Orchestration
- [ ] Multi-project coordination
- [ ] Advanced scheduling
- [ ] Resource optimization
- [ ] Distributed agents
- [ ] Cloud deployment

## Troubleshooting

### Common Issues

1. **MCP Not Initialized**
   ```
   Error: Tony MCP integration not initialized
   ```
   Solution: Call `await tonyMCP.initialize()` before any operations

2. **Agent Not Found**
   ```
   Error: Agent {id} not found
   ```
   Solution: Ensure agent is deployed and active

3. **Task Assignment Failed**
   ```
   Error: No agents available for method: {method}
   ```
   Solution: Deploy an agent with required capabilities

### Debug Mode
```typescript
// Enable debug logging
process.env.TONY_MCP_DEBUG = 'true';
```

## API Reference

### TonyMCPIntegration Methods

#### initialize()
Initialize Tony with MCP server
```typescript
await tonyMCP.initialize();
```

#### deployAgent(type)
Deploy a specialized agent
```typescript
const agent = await tonyMCP.deployAgent('implementation');
```

#### assignTask(agentId, task)
Assign a task to an agent
```typescript
const result = await tonyMCP.assignTask(agentId, task);
```

#### broadcastCoordination(message)
Broadcast message to all agents
```typescript
await tonyMCP.broadcastCoordination({ action: 'start' });
```

#### getAgentStatuses()
Get status of all active agents
```typescript
const statuses = await tonyMCP.getAgentStatuses();
```

#### shutdown()
Gracefully shutdown MCP integration
```typescript
await tonyMCP.shutdown();
```

## Conclusion

Tony 2.8.0's MCP integration marks a significant evolution in the framework, transforming it from a standalone tool to an integrated component of the larger MosAIc ecosystem. The minimal implementation provides immediate functionality while maintaining compatibility with future enhancements.