// Main exports for @mosaicstack/mcp-orchestrator

// Core server
export { MCPServer } from './server/MCPServer';

// Services
export { StateService } from './services/StateService';
export { TaskService } from './services/TaskService';
export { ProjectService } from './services/ProjectService';
export { AgentService } from './services/AgentService';
export { ResourceService } from './services/ResourceService';

// Tools
export { TaskTools } from './tools/TaskTools';
export { ProjectTools } from './tools/ProjectTools';
export { AgentTools } from './tools/AgentTools';
export { ResourceTools } from './tools/ResourceTools';

// Configuration
export { ConfigLoader } from './config/ConfigLoader';

// Utilities
export { Logger } from './utils/Logger';

// Types
export * from './types';

// Default configuration
export const defaultConfig = {
  server: {
    name: 'mosaic-mcp-orchestrator',
    version: '1.0.0',
    description: 'MosAIc Stack MCP orchestrator for OpenCode integration'
  },
  transport: {
    type: 'stdio' as const,
    timeout: 30000
  },
  tools: {
    task_management: {
      enabled: true,
      namespace: 'mosaic_task',
      rate_limit: 60
    },
    project_coordination: {
      enabled: true,
      namespace: 'mosaic_project',
      rate_limit: 30
    },
    agent_orchestration: {
      enabled: true,
      namespace: 'mosaic_agent',
      rate_limit: 10
    }
  },
  storage: {
    type: 'sqlite' as const,
    connection_string: '~/.mosaic/data/mcp.db',
    migrations_path: './migrations',
    backup_enabled: true,
    backup_interval: '1h'
  },
  logging: {
    level: 'info' as const,
    file: '~/.mosaic/logs/mcp.log',
    console: false,
    structured: true
  },
  security: {
    max_concurrent_tools: 5,
    tool_timeout: 300000,
    rate_limiting: {
      enabled: true,
      requests_per_minute: 100
    }
  }
};