import { MCPServerConfig } from '../../src/types';

// Extended config for testing that includes additional fields
export interface TestMCPServerConfig extends MCPServerConfig {
  dataDir?: string;
  version?: string;
  tasks?: {
    max_concurrent: number;
    default_timeout: number;
    retry_attempts: number;
    retry_delay: number;
  };
}

export const createTestConfig = (overrides: Partial<TestMCPServerConfig> = {}): MCPServerConfig => {
  const baseConfig: MCPServerConfig = {
    server: {
      name: 'test-server',
      version: '1.0.0',
      description: 'Test server'
    },
    transport: {
      type: 'stdio',
      timeout: 30000
    },
    tools: {
      task_management: {
        enabled: true,
        namespace: 'task'
      },
      project_coordination: {
        enabled: true,
        namespace: 'project'
      },
      agent_orchestration: {
        enabled: true,
        namespace: 'agent'
      }
    },
    storage: {
      type: 'sqlite',
      connection_string: ':memory:',
      migrations_path: './migrations',
      backup_enabled: false,
      backup_interval: '1h'
    },
    logging: {
      level: 'error',
      console: false,
      structured: true
    },
    security: {
      max_concurrent_tools: 10,
      tool_timeout: 30000,
      rate_limiting: {
        enabled: false,
        requests_per_minute: 60
      }
    }
  };

  return { ...baseConfig, ...overrides };
};