# Tony Framework Migration Guide: 2.7.0 to 2.8.0

## Executive Summary

Tony 2.8.0 introduces **mandatory MCP (Model Context Protocol) integration**, fundamentally changing how Tony coordinates agents and manages state. This guide provides step-by-step instructions for migrating existing Tony 2.7.0 installations to 2.8.0.

## Breaking Changes

### 1. MCP Integration is Mandatory
- **2.7.0**: Tony operates independently
- **2.8.0**: Tony requires MCP initialization before any operations

### 2. Agent Management API Changes
All agent-related operations now go through MCP:

```typescript
// OLD (2.7.0)
const tony = new TonyFramework();
tony.spawnAgent('implementation', config);
tony.coordinateAgents(agents);

// NEW (2.8.0)
import { tonyMCP } from '@tony/core';
await tonyMCP.initialize();
await tonyMCP.deployAgent('implementation');
await tonyMCP.broadcastCoordination(message);
```

### 3. State Management Integration
State management now integrates with MCP:

```typescript
// OLD (2.7.0)
const state = new HybridStateManager(config);
state.saveState(data);

// NEW (2.8.0)
// State automatically synchronized through MCP
const state = await tonyMCP.getAgentStatus(agentId);
```

### 4. Plugin System Updates
Plugins must be updated to use MCP communication:

```typescript
// OLD (2.7.0)
export class MyPlugin implements TonyPlugin {
  async execute(context) {
    // Direct execution
  }
}

// NEW (2.8.0)
export class MyPlugin implements TonyPlugin {
  async execute(context) {
    // Must use MCP for coordination
    await context.mcp.routeRequest({
      method: 'plugin.execute',
      params: { ... }
    });
  }
}
```

## Step-by-Step Migration

### Step 1: Update Dependencies

```bash
# Navigate to Tony directory
cd /path/to/tony

# Update package.json version
npm version 2.8.0

# Install dependencies
npm install

# Build the project
npm run build
```

### Step 2: Update Initialization Code

Replace all Tony initialization code:

```typescript
// OLD initialization (2.7.0)
import { TonyFramework } from '@tony/core';

const tony = new TonyFramework({
  projectPath: './project',
  maxAgents: 5
});

await tony.initialize();

// NEW initialization (2.8.0)
import { tonyMCP } from '@tony/core';

// Option 1: Quick start
import { initializeTonyMCP } from '@tony/core';
const { tony, agents, health } = await initializeTonyMCP();

// Option 2: Manual initialization
await tonyMCP.initialize();
```

### Step 3: Update Agent Deployment

Replace agent spawning code:

```typescript
// OLD agent deployment (2.7.0)
const agent = tony.spawnAgent('implementation', {
  name: 'Implementation Agent',
  capabilities: ['code.write']
});

// NEW agent deployment (2.8.0)
const registration = await tonyMCP.deployAgent('implementation');
// Access agent via registration.agentId
```

### Step 4: Update Task Assignment

Replace task assignment logic:

```typescript
// OLD task assignment (2.7.0)
agent.assignTask({
  type: 'implementation',
  description: 'Implement feature X'
});

// NEW task assignment (2.8.0)
await tonyMCP.assignTask(registration.agentId, {
  type: 'implementation',
  epic: 'E.001',
  story: 'S.001.01.01',
  description: 'Implement feature X',
  priority: 'high'
});
```

### Step 5: Update Coordination Logic

Replace coordination broadcasts:

```typescript
// OLD coordination (2.7.0)
tony.broadcast('start-phase', {
  phase: 'implementation'
});

// NEW coordination (2.8.0)
await tonyMCP.broadcastCoordination({
  action: 'start',
  phase: 'implementation',
  epic: 'E.001',
  message: 'Begin implementation phase'
});
```

### Step 6: Add Event Handlers

Add MCP event handling:

```typescript
// NEW in 2.8.0 - Event handling
tonyMCP.on('agentDeployed', ({ type, registration }) => {
  console.log(`${type} agent deployed:`, registration.agentId);
});

tonyMCP.on('taskAssigned', ({ agentId, task }) => {
  console.log(`Task assigned to ${agentId}`);
});

tonyMCP.on('healthUpdate', (health) => {
  if (health.status !== 'healthy') {
    console.warn('System health degraded:', health);
  }
});

tonyMCP.on('error', (error) => {
  console.error('MCP error:', error);
});
```

### Step 7: Update Shutdown Logic

Replace cleanup code:

```typescript
// OLD shutdown (2.7.0)
await tony.shutdown();

// NEW shutdown (2.8.0)
await tonyMCP.shutdown();
```

## Common Migration Patterns

### Pattern 1: Converting Direct Agent Calls

```typescript
// OLD (2.7.0)
const result = await agent.execute(command);

// NEW (2.8.0)
const response = await tonyMCP.assignTask(agentId, {
  type: 'execute',
  command: command
});
const result = response.result;
```

### Pattern 2: Status Checking

```typescript
// OLD (2.7.0)
const status = agent.getStatus();

// NEW (2.8.0)
const status = await tonyMCP.getAgentStatus(agentId);
```

### Pattern 3: Multi-Agent Coordination

```typescript
// OLD (2.7.0)
tony.coordinateAgents([agent1, agent2], plan);

// NEW (2.8.0)
// Deploy agents
const agents = await Promise.all([
  tonyMCP.deployAgent('implementation'),
  tonyMCP.deployAgent('qa')
]);

// Coordinate via broadcast
await tonyMCP.broadcastCoordination({
  action: 'coordinate',
  plan: plan,
  agents: agents.map(a => a.agentId)
});
```

## Configuration Changes

### Environment Variables

New environment variables in 2.8.0:

```bash
# MCP Configuration
export TONY_MCP_SERVER_URL="http://localhost:3456"
export TONY_MCP_TIMEOUT=30000
export TONY_MCP_RETRY_ATTEMPTS=3
export TONY_MCP_DEBUG=true
```

### Configuration Files

Update `tony.config.js`:

```javascript
// OLD (2.7.0)
module.exports = {
  framework: {
    version: '2.7.0',
    maxAgents: 5
  }
};

// NEW (2.8.0)
module.exports = {
  framework: {
    version: '2.8.0',
    maxAgents: 5,
    mcp: {
      enabled: true,
      serverUrl: 'http://localhost:3456',
      timeout: 30000
    }
  }
};
```

## Testing Your Migration

### 1. Basic Connectivity Test

```typescript
import { tonyMCP } from '@tony/core';

async function testMCPConnection() {
  try {
    await tonyMCP.initialize();
    console.log('✅ MCP initialization successful');
    
    const reg = tonyMCP.getRegistration();
    console.log('✅ Tony registered:', reg?.agentId);
    
    await tonyMCP.shutdown();
    console.log('✅ Clean shutdown successful');
  } catch (error) {
    console.error('❌ MCP test failed:', error);
  }
}
```

### 2. Agent Deployment Test

```typescript
async function testAgentDeployment() {
  await tonyMCP.initialize();
  
  const types = ['implementation', 'qa', 'documentation'];
  const agents = await Promise.all(
    types.map(type => tonyMCP.deployAgent(type))
  );
  
  console.log('✅ Deployed agents:', agents.length);
  
  const statuses = await tonyMCP.getAgentStatuses();
  console.log('✅ Active agents:', statuses.length);
  
  await tonyMCP.shutdown();
}
```

### 3. Full Integration Test

```typescript
async function fullIntegrationTest() {
  // Initialize
  await tonyMCP.initialize();
  
  // Deploy agent
  const agent = await tonyMCP.deployAgent('implementation');
  
  // Assign task
  const result = await tonyMCP.assignTask(agent.agentId, {
    type: 'test',
    description: 'Migration test task'
  });
  
  // Check status
  const status = await tonyMCP.getAgentStatus(agent.agentId);
  console.log('✅ Agent status:', status.state);
  
  // Cleanup
  await tonyMCP.shutdown();
}
```

## Rollback Plan

If you need to rollback to 2.7.0:

1. **Backup Current State**
   ```bash
   cp -r tony tony-2.8.0-backup
   ```

2. **Restore 2.7.0**
   ```bash
   git checkout v2.7.0
   npm install
   npm run build
   ```

3. **Restore Configuration**
   ```bash
   cp tony-2.7.0-backup/tony.config.js tony/
   ```

## Troubleshooting

### Issue: "MCP not initialized"
**Solution**: Ensure `await tonyMCP.initialize()` is called before any operations

### Issue: "Agent not found"
**Solution**: Use the `agentId` from the registration response, not the agent type

### Issue: "No agents available for method"
**Solution**: Deploy agents with required capabilities before assigning tasks

### Issue: "MCP server not found"
**Solution**: The minimal implementation runs in-memory. External server integration coming in future updates.

## Support Resources

- **Documentation**: `/docs/mcp-integration/TONY-2.8.0-MCP-INTEGRATION.md`
- **Examples**: `/tony/examples/mcp-example.ts`
- **API Reference**: Generated TypeDoc documentation
- **Issues**: Report migration issues with tag `migration-2.8.0`

## Next Steps

After successful migration:

1. Update all dependent projects to use new MCP APIs
2. Train team on new event-driven patterns
3. Plan for future MCP server integration (port 3456)
4. Update CI/CD pipelines for new initialization process
5. Monitor system health through MCP events

## Conclusion

While Tony 2.8.0 introduces significant changes with mandatory MCP integration, the migration process is straightforward. The new architecture provides better scalability, monitoring, and integration with the broader MosAIc ecosystem.