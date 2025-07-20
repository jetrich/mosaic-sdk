# Tony 2.8.0 MCP Integration - Quick Reference

## Essential Commands

### Initialize Tony with MCP
```typescript
import { tonyMCP, initializeTonyMCP } from '@tony/core';

// Quick start (recommended)
const { tony, agents, health } = await initializeTonyMCP();

// Manual initialization
await tonyMCP.initialize();
```

### Deploy Agents
```typescript
// Deploy single agent
const agent = await tonyMCP.deployAgent('implementation');

// Deploy multiple agents
const agents = await Promise.all([
  tonyMCP.deployAgent('implementation'),
  tonyMCP.deployAgent('qa'),
  tonyMCP.deployAgent('documentation')
]);
```

### Assign Tasks
```typescript
await tonyMCP.assignTask(agentId, {
  type: 'implementation',
  epic: 'E.055',
  story: 'S.055.01.01',
  description: 'Implement feature',
  priority: 'high'
});
```

### Broadcast Coordination
```typescript
await tonyMCP.broadcastCoordination({
  action: 'start',
  phase: 'implementation',
  epic: 'E.055',
  message: 'Begin phase'
});
```

### Check Status
```typescript
// Single agent status
const status = await tonyMCP.getAgentStatus(agentId);

// All agent statuses
const statuses = await tonyMCP.getAgentStatuses();

// System health
const health = await minimalMCPServer.getHealthStatus();
```

### Event Handling
```typescript
// Agent events
tonyMCP.on('agentDeployed', ({ type, registration }) => {});
tonyMCP.on('taskAssigned', ({ agentId, task }) => {});

// System events
tonyMCP.on('initialized', (registration) => {});
tonyMCP.on('healthUpdate', (health) => {});
tonyMCP.on('error', (error) => {});
tonyMCP.on('shutdown', () => {});
```

### Shutdown
```typescript
await tonyMCP.shutdown();
```

## Agent Types & Capabilities

| Agent Type | Key Capabilities |
|------------|-----------------|
| **tech-lead** | project.coordinate, agent.deploy, task.decompose, upp.planning |
| **implementation** | code.write, code.review, test.write, refactor.apply |
| **qa** | test.run, test.validate, quality.check, coverage.analyze |
| **security** | security.scan, vulnerability.check, compliance.verify |
| **documentation** | docs.write, api.document, readme.update |

## Common Patterns

### Error Handling
```typescript
try {
  await tonyMCP.initialize();
} catch (error) {
  console.error('MCP initialization failed:', error);
}
```

### Health Monitoring
```typescript
tonyMCP.on('healthUpdate', (health) => {
  if (health.status === 'unhealthy') {
    // Take corrective action
  }
});
```

### Task Flow
```typescript
// 1. Deploy agent
const agent = await tonyMCP.deployAgent('implementation');

// 2. Assign task
const result = await tonyMCP.assignTask(agent.agentId, task);

// 3. Monitor status
const status = await tonyMCP.getAgentStatus(agent.agentId);
```

## Environment Variables
```bash
TONY_MCP_DEBUG=true          # Enable debug logging
TONY_MCP_SERVER_PATH=/path   # Custom MCP server path
NODE_ENV=production          # Environment mode
```

## TypeScript Types

```typescript
import {
  MinimalMCPServer,
  AgentConfig,
  AgentRegistration,
  MCPRequest,
  MCPResponse,
  AgentStatus,
  HealthStatus,
  AgentMessage,
  AgentInfo
} from '@tony/core';
```

## Debug Commands

```typescript
// Check initialization status
console.log('Initialized:', tonyMCP.isInitialized());

// Get registration info
console.log('Registration:', tonyMCP.getRegistration());

// Get active agents
const agents = await minimalMCPServer.getActiveAgents();
console.log('Active agents:', agents);
```

## Migration Checklist

- [ ] Update to Tony 2.8.0
- [ ] Replace direct agent calls with MCP
- [ ] Add MCP initialization
- [ ] Update task assignment code
- [ ] Add event handlers
- [ ] Test agent deployment
- [ ] Update shutdown logic
- [ ] Verify health monitoring

## Common Issues

| Issue | Solution |
|-------|----------|
| "Not initialized" | Call `await tonyMCP.initialize()` first |
| "Agent not found" | Use `agentId` from registration |
| "No capable agents" | Deploy agent with required capabilities |
| "Task timeout" | Check agent status and health |

## Links

- Full Documentation: `/docs/mcp-integration/TONY-2.8.0-MCP-INTEGRATION.md`
- Migration Guide: `/docs/mcp-integration/MIGRATION-GUIDE-2.7-TO-2.8.md`
- Example Code: `/tony/examples/mcp-example.ts`
- Source Code: `/tony/core/mcp/`