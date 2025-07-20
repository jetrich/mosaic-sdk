# MosAIc Stack Integration Tests

This directory contains comprehensive integration tests for validating the MCP-Tony connection and overall MosAIc Stack functionality.

## Overview

The test suite validates:
- MCP server connectivity and protocol compliance
- Agent registration and lifecycle management
- Request routing and message passing
- Task coordination workflows
- Error handling and recovery
- Performance under load
- Complex multi-agent scenarios

## Directory Structure

```
tests/
├── integration/          # Integration test suites
│   ├── mcp-connectivity.test.ts
│   ├── agent-registration.test.ts
│   ├── request-routing.test.ts
│   ├── task-coordination.test.ts
│   └── error-handling.test.ts
├── utilities/           # Test utilities and tools
│   ├── MockMCPServer.ts
│   ├── TestAgent.ts
│   ├── PerformanceBenchmark.ts
│   ├── LoadTester.ts
│   ├── MCPDebugger.ts
│   └── EventFlowVisualizer.ts
├── scenarios/          # Test scenario scripts (auto-generated)
├── reports/           # Test reports and coverage
├── test-mcp-integration.sh
├── test-tony-coordination.sh
├── test-full-stack.sh
├── jest.config.js
└── setup.ts
```

## Quick Start

### Prerequisites

1. Ensure MCP server is running:
```bash
npm run dev:start
```

2. Install test dependencies:
```bash
npm install --save-dev jest ts-jest @types/jest jest-html-reporter
```

### Running Tests

#### Basic Integration Tests
```bash
./tests/test-mcp-integration.sh
```

Options:
- `--port PORT`: MCP server port (default: 3456)
- `--host HOST`: MCP server host (default: localhost)
- `--timeout MS`: Test timeout in milliseconds (default: 300000)
- `--no-coverage`: Disable coverage reporting

#### Tony Coordination Tests
```bash
./tests/test-tony-coordination.sh [scenario]
```

Available scenarios:
- `basic`: Basic agent registration and messaging
- `hierarchy`: Hierarchical task delegation
- `failover`: Agent failure and recovery
- `load`: High-load coordination
- `complex`: Complex multi-phase workflows

#### Full Stack Tests
```bash
./tests/test-full-stack.sh --mode full
```

Modes:
- `full`: Run all component and integration tests
- `quick`: Run only essential tests
- `performance`: Run performance benchmarks

## Test Suites

### 1. MCP Connectivity Tests

Tests basic MCP server connectivity, protocol compliance, and network resilience.

```typescript
// Example test
describe('MCP Server Connectivity Tests', () => {
  it('should establish connection to MCP server', async () => {
    // Test implementation
  });
});
```

### 2. Agent Registration Tests

Validates agent lifecycle management, role-based registration, and registry persistence.

Key test cases:
- Single and multiple agent registration
- Unique ID generation
- Role-based capabilities
- Registry maintenance
- Deregistration handling

### 3. Request Routing Tests

Tests message routing between agents, tool invocation, and load distribution.

Key test cases:
- Tool listing and execution
- Inter-agent messaging
- Broadcast messages
- Request prioritization
- Dynamic routing updates

### 4. Task Coordination Tests

Validates complex task workflows, delegation patterns, and coordination events.

Key test cases:
- Simple task assignment
- Multi-agent coordination
- Task dependencies
- Load balancing
- Error recovery

### 5. Error Handling Tests

Tests system resilience, error recovery, and fallback mechanisms.

Key test cases:
- Network errors and timeouts
- Protocol violations
- Server failures
- Agent crashes
- Bulk recovery operations

## Utilities

### MockMCPServer

A fully-featured mock MCP server for testing without the real server.

```typescript
const mockServer = new MockMCPServer(3457);
await mockServer.start();

// Configure behavior
mockServer.setResponseDelay(100);
mockServer.setFailureRate(0.1);
```

### TestAgent

Simulated agents for testing coordination patterns.

```typescript
const agent = new TestAgent({
  name: 'test-agent',
  role: 'worker',
  capabilities: ['task-execution']
});

await agent.start();
await agent.processTask(task);
```

### PerformanceBenchmark

Comprehensive performance testing utility.

```typescript
const benchmark = new PerformanceBenchmark();
const result = await benchmark.benchmark(
  async () => { /* test code */ },
  { name: 'Test', iterations: 1000 }
);
```

### LoadTester

Simulates realistic load scenarios.

```typescript
const tester = new LoadTester({
  targetHost: 'localhost',
  targetPort: 3456,
  duration: 60000,
  maxConnections: 100,
  scenario: StandardScenarios.agentCoordination
});

const results = await tester.start();
```

### MCPDebugger

Interactive debugging tool for MCP connections.

```bash
npx ts-node tests/utilities/MCPDebugger.ts --interactive
```

Commands:
- `ping`: Test connectivity
- `tools`: List available tools
- `call <tool> [args]`: Call a tool
- `metrics`: Show connection metrics
- `traces [count]`: Show message traces
- `diagnostics`: Run full diagnostics

### EventFlowVisualizer

Visualizes event flows and agent interactions.

```typescript
const visualizer = new EventFlowVisualizer();
visualizer.startRecording();

// Track events
visualizer.trackAgentRegistration(agentId, name, role);
visualizer.trackAgentMessage(from, to, content);

// Export visualization
visualizer.saveVisualization('./reports', 'html');
```

## Performance Benchmarks

Expected performance metrics:
- **Message Latency**: < 10ms average, < 50ms P95
- **Throughput**: > 1000 messages/second
- **Agent Registration**: < 100ms
- **Tool Execution**: < 200ms average
- **Connection Stability**: > 99.9% uptime

## CI/CD Integration

Add to your CI pipeline:

```yaml
# GitHub Actions example
- name: Start MCP Server
  run: npm run dev:start &
  
- name: Wait for server
  run: sleep 5
  
- name: Run Integration Tests
  run: ./tests/test-full-stack.sh --mode quick
  
- name: Upload test reports
  uses: actions/upload-artifact@v2
  with:
    name: test-reports
    path: tests/reports/
```

## Test Coverage Requirements

Minimum coverage thresholds:
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

View coverage report:
```bash
open tests/reports/coverage/index.html
```

## Debugging Failed Tests

1. **Enable verbose logging**:
   ```bash
   ./tests/test-mcp-integration.sh --verbose
   ```

2. **Use the MCP debugger**:
   ```bash
   npx ts-node tests/utilities/MCPDebugger.ts -i
   ```

3. **Check server logs**:
   ```bash
   tail -f .mosaic/logs/mcp-server.log
   ```

4. **Analyze event flows**:
   - Event visualizations are saved in `tests/reports/`
   - Open HTML files to view interactive diagrams

## Writing New Tests

1. **Create test file** in appropriate directory
2. **Import utilities** as needed
3. **Follow naming convention**: `*.test.ts`
4. **Use descriptive test names**
5. **Include setup and teardown**
6. **Test both success and failure cases**

Example:
```typescript
import { MockMCPServer } from '../utilities/MockMCPServer';

describe('New Feature Tests', () => {
  let server: MockMCPServer;
  
  beforeAll(async () => {
    server = new MockMCPServer();
    await server.start();
  });
  
  afterAll(async () => {
    await server.stop();
  });
  
  it('should handle new feature correctly', async () => {
    // Test implementation
  });
});
```

## Troubleshooting

### Common Issues

1. **Port already in use**:
   - Stop existing MCP server: `npm run dev:stop`
   - Check for zombie processes: `lsof -i :3456`

2. **Test timeouts**:
   - Increase timeout: `--timeout 600000`
   - Check for deadlocks in test code

3. **Intermittent failures**:
   - Run with retry: `jest --bail=false --runInBand`
   - Check for race conditions

4. **Coverage not generated**:
   - Ensure `--coverage` flag is set
   - Check `jest.config.js` settings

## Contributing

When adding new tests:
1. Follow existing patterns
2. Document test purpose
3. Include both positive and negative cases
4. Update this README
5. Ensure tests are deterministic
6. Add to appropriate test suite

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [MCP Protocol Spec](../docs/mcp-protocol.md)
- [Tony Framework Docs](../docs/tony-framework.md)
- [MosAIc Architecture](../docs/architecture.md)