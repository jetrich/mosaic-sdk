# OpenCode Integration with MosAIc SDK

This document provides comprehensive guidance for integrating OpenCode with the MosAIc SDK, enabling enterprise-grade AI development workflows with specialized agent coordination.

## Overview

The OpenCode MosAIc integration provides:

- **MCP Server**: Model Context Protocol server for seamless tool integration
- **Token Management**: Automatic extraction and secure storage of API tokens
- **Agent Coordination**: Multi-agent task management with UPP methodology
- **UI Components**: Professional terminal interface with real-time updates
- **Configuration Templates**: Pre-configured setups for different workflows

## Quick Start

### Prerequisites

1. **OpenCode CLI**: Install the latest version

   ```bash
   npm install -g opencode-ai@latest
   ```

2. **Bun Runtime**: Required by OpenCode

   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

3. **API Keys**: Anthropic/Claude API key for AI functionality

### Installation

1. **Install MosAIc OpenCode MCP Package**:

   ```bash
   npm install @mosaicstack/opencode-mcp
   ```

2. **Run Setup Script**:

   ```bash
   ./templates/opencode/setup-script.sh
   ```

3. **Configure API Keys**:
   ```bash
   export ANTHROPIC_API_KEY="your-api-key-here"
   # or use the token manager
   npx opencode-mcp-tokens setup
   ```

## Configuration

### OpenCode Configuration

The integration uses two configuration files:

#### Global Configuration (`~/.config/opencode/config.json`)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "mosaic": {
      "type": "local",
      "command": ["@mosaicstack/opencode-mcp"],
      "environment": {
        "MOSAIC_CONFIG": "~/.mosaic/config.json",
        "MOSAIC_DATA_DIR": "~/.mosaic/data"
      }
    }
  }
}
```

#### Project Configuration (`opencode.json`)

```json
{
  "modes": {
    "mosaic-plan": {
      "prompt": "You are using MosAIc planning mode with enterprise task management tools.",
      "tools": {
        "mosaic_task_create": true,
        "mosaic_task_assign": true,
        "mosaic_project_switch": true
      }
    },
    "mosaic-execute": {
      "prompt": "You are using MosAIc execution mode with full development capabilities.",
      "tools": {
        "mosaic_agent_spawn": true,
        "mosaic_agent_coordinate": true
      }
    }
  }
}
```

### MosAIc Configuration

The MosAIc configuration is stored in `~/.mosaic/config.json`:

```json
{
  "version": "0.1.0",
  "opencode": {
    "enabled": true,
    "mcpPort": 3456,
    "logLevel": "info"
  },
  "agents": {
    "maxConcurrent": 5,
    "defaultTimeout": 300000
  },
  "tokens": {
    "claude": "your-api-key",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Usage

### Operating Modes

#### Planning Mode (`mosaic-plan`)

Focus on task decomposition and agent assignment:

```bash
opencode --mode mosaic-plan
```

**Available Tools**:

- `mosaic_task_create` - Create UPP hierarchy tasks
- `mosaic_task_assign` - Assign tasks to agents
- `mosaic_project_switch` - Switch project context
- `mosaic_project_list` - List available projects

#### Execution Mode (`mosaic-execute`)

Full development capabilities with agent coordination:

```bash
opencode --mode mosaic-execute
```

**Available Tools**:

- All planning tools plus:
- `mosaic_agent_spawn` - Spawn specialized agents
- `mosaic_agent_coordinate` - Coordinate multi-agent tasks
- Standard development tools (bash, edit, write, etc.)

### MCP Tools Reference

#### Task Management

**`mosaic_task_create`**

```json
{
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication system",
  "priority": "high",
  "assignee": "BE-BACKEND-BENJAMIN",
  "projectId": "mosaic-sdk"
}
```

**`mosaic_task_assign`**

```json
{
  "taskId": "T.H.1234567890.ABC123",
  "agentId": "agent-1234567890-abcdef123",
  "agentType": "BE-BACKEND-BENJAMIN"
}
```

#### Project Management

**`mosaic_project_switch`**

```json
{
  "projectId": "mosaic-sdk"
}
```

**`mosaic_project_list`**

```json
{}
```

#### Agent Coordination

**`mosaic_agent_spawn`**

```json
{
  "agentType": "BE-BACKEND-BENJAMIN",
  "projectId": "mosaic-sdk",
  "config": {
    "specialization": "API development",
    "tools": ["typescript", "node", "express"]
  }
}
```

**`mosaic_agent_coordinate`**

```json
{
  "agents": [
    {
      "agentType": "BE-BACKEND-BENJAMIN",
      "taskId": "T.H.1234567890.ABC123"
    },
    {
      "agentType": "FE-FRONTEND-FIONA",
      "taskId": "T.H.1234567890.DEF456"
    }
  ],
  "strategy": "parallel"
}
```

## Token Management

### Automatic Token Extraction

The system automatically extracts API tokens from:

1. **Environment Variables**:
   - `ANTHROPIC_API_KEY`
   - `CLAUDE_API_KEY`
   - `OPENAI_API_KEY`

2. **Configuration Files**:
   - `~/.config/claude/config.json`
   - `~/.config/opencode/config.json`
   - `~/.mosaic/config.json`

### Token Management CLI

```bash
# Extract tokens from all sources
npx opencode-mcp-tokens extract

# Validate token formats
npx opencode-mcp-tokens validate --verbose

# Setup OpenCode integration
npx opencode-mcp-tokens setup

# Store tokens securely
npx opencode-mcp-tokens secure

# Show current configuration (masked)
npx opencode-mcp-tokens show
```

## Agent Types

The system supports specialized agent personas:

### Development Agents

- **BE-BACKEND-BENJAMIN**: Backend development, APIs, databases
- **FE-FRONTEND-FIONA**: Frontend development, UI/UX, React/TypeScript
- **FS-FULLSTACK-FELIX**: Full-stack development, integration
- **ML-LEARNING-MARCUS**: Machine learning, AI models, data processing

### Quality Assurance

- **QA-QUALITY-QUINN**: Testing, quality assurance, bug identification
- **TEST-AUTOMATION-TARA**: Automated testing, CI/CD integration
- **PERF-PERFORMANCE-PETER**: Performance optimization, benchmarking

### Security & Operations

- **SEC-SECURITY-SARAH**: Security analysis, vulnerability assessment
- **DEVOPS-OPERATIONS-OLIVER**: DevOps, deployment, infrastructure
- **SRE-RELIABILITY-RACHEL**: Site reliability, monitoring, incident response

### Documentation & Management

- **DOC-DOCUMENTATION-DAVID**: Technical writing, API documentation
- **PM-PROJECT-PAUL**: Project management, planning, coordination
- **TL-LEAD-TONY**: Technical leadership, architecture decisions

## Coordination Strategies

### Parallel Execution

Multiple agents work simultaneously on independent tasks:

```json
{
  "strategy": "parallel",
  "agents": ["BE-BACKEND-BENJAMIN", "FE-FRONTEND-FIONA"],
  "tasks": ["api-development", "ui-implementation"]
}
```

### Sequential Execution

Agents work in a defined order with dependencies:

```json
{
  "strategy": "sequential",
  "agents": ["BE-BACKEND-BENJAMIN", "TEST-AUTOMATION-TARA"],
  "tasks": ["implement-feature", "write-tests"]
}
```

### Event-Driven Coordination

Agents respond to events and triggers:

```json
{
  "strategy": "event-driven",
  "agents": ["QA-QUALITY-QUINN", "SEC-SECURITY-SARAH"],
  "triggers": ["code-change", "deployment"]
}
```

## UI Components

### Task Status Display

```typescript
interface TaskStatus {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  priority: "high" | "medium" | "low";
  progress: number; // 0-100
  assignee?: string;
}
```

### Agent Status Monitoring

```typescript
interface AgentStatus {
  id: string;
  type: string;
  status: "idle" | "active" | "busy" | "error";
  currentTask?: string;
  performance: {
    tasksCompleted: number;
    averageTime: number;
    successRate: number;
  };
}
```

### Real-Time Updates

The UI supports real-time updates via WebSocket connections:

```typescript
interface UIEvent {
  type: "task_update" | "agent_update" | "notification";
  timestamp: Date;
  data: any;
}
```

## Themes

### Available Themes

- **mosaic**: Default dark theme with blue accents
- **light**: Light theme for bright environments
- **dark**: Standard dark theme
- **high-contrast**: High contrast for accessibility

### Theme Configuration

```json
{
  "ui": {
    "theme": "mosaic",
    "showAgentStatus": true,
    "showTaskProgress": true,
    "enableRealTimeUpdates": true
  }
}
```

## Testing

### Running Tests

```bash
cd packages/opencode-mcp
npm test
```

### Test Coverage

```bash
npm run test:coverage
```

### Integration Tests

```bash
npm run test:integration
```

## Troubleshooting

### Common Issues

#### MCP Server Not Starting

1. Check if OpenCode is installed: `opencode --version`
2. Verify configuration: `cat ~/.config/opencode/config.json`
3. Check logs: `tail -f ~/.mosaic/logs/opencode.log`

#### Token Authentication Errors

1. Validate tokens: `npx opencode-mcp-tokens validate`
2. Check environment variables: `echo $ANTHROPIC_API_KEY`
3. Re-run setup: `npx opencode-mcp-tokens setup`

#### Agent Coordination Issues

1. Check agent status in UI
2. Review task assignments
3. Verify coordination strategy

### Debug Mode

Enable debug logging:

```bash
export MOSAIC_LOG_LEVEL=debug
opencode --mode mosaic-execute
```

### Log Files

- OpenCode logs: `~/.mosaic/logs/opencode.log`
- MCP server logs: `~/.mosaic/logs/mcp.log`
- Agent coordination: `~/.mosaic/logs/agents.log`

## Advanced Configuration

### Custom Agent Types

Define custom agent personas in `~/.mosaic/agents/`:

```json
{
  "type": "CUSTOM-AGENT-NAME",
  "capabilities": ["typescript", "react", "testing"],
  "tools": ["bash", "edit", "write"],
  "model": "claude-3-sonnet",
  "timeout": 300000
}
```

### Webhook Integration

Configure webhooks for external system integration:

```json
{
  "webhooks": {
    "taskComplete": "https://api.example.com/webhook/task-complete",
    "agentError": "https://api.example.com/webhook/agent-error"
  }
}
```

### Performance Tuning

Optimize for your environment:

```json
{
  "performance": {
    "maxConcurrentAgents": 10,
    "taskTimeout": 600000,
    "retryAttempts": 3,
    "cacheEnabled": true
  }
}
```

## API Reference

### MCP Server API

The OpenCode MCP server exposes these endpoints:

- `POST /mcp` - MCP JSON-RPC requests
- `GET /mcp` - Server-Sent Events stream
- `GET /health` - Health check
- `GET /metrics` - Performance metrics

### Token Extractor API

```typescript
class TokenExtractor {
  extractTokens(): TokenConfig;
  validateToken(token: string, provider: string): boolean;
  getToken(provider: string): string | null;
  setupOpenCodeIntegration(): void;
}
```

### Theme Manager API

```typescript
class ThemeManager {
  setTheme(themeName: string): void;
  getCurrentTheme(): UITheme;
  getAvailableThemes(): string[];
  addThemeChangeListener(listener: Function): Function;
}
```

## Contributing

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build packages: `npm run build:all`
4. Run tests: `npm test`

### Adding New Tools

1. Define tool schema in `src/index.ts`
2. Implement handler method
3. Add tests in `src/__tests__/`
4. Update documentation

### Creating Custom Themes

1. Define theme in `src/ui/themes.ts`
2. Add CSS variables
3. Test with different UI components
4. Submit pull request

## Support

- **Documentation**: See `docs/opencode/` for detailed guides
- **Issues**: Report bugs at [GitHub Issues](https://github.com/mosaicstack/mosaic-sdk/issues)
- **Discussions**: Join the community at [GitHub Discussions](https://github.com/mosaicstack/mosaic-sdk/discussions)
- **Email**: Contact support at support@mosaicstack.com

## License

This project is licensed under the MIT License. See the [LICENSE](../../LICENSE) file for details.
