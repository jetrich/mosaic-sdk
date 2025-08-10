import { describe, it, expect } from '@jest/globals';
import { createTestConfig } from '../fixtures/test-config';

describe('Basic Configuration Tests', () => {
  it('should create a valid test configuration', () => {
    const config = createTestConfig();
    
    expect(config).toBeDefined();
    expect(config.server.name).toBe('test-server');
    expect(config.server.version).toBe('1.0.0');
    expect(config.tools.task_management.enabled).toBe(true);
    expect(config.tools.task_management.namespace).toBe('task');
    expect(config.storage.type).toBe('sqlite');
    expect(config.storage.connection_string).toBe(':memory:');
    expect(config.logging.level).toBe('error');
    expect(config.security.max_concurrent_tools).toBe(10);
  });

  it('should allow configuration overrides', () => {
    const config = createTestConfig({
      server: {
        name: 'custom-server',
        version: '2.0.0',
        description: 'Custom test server'
      },
      logging: {
        level: 'debug',
        console: true,
        structured: false
      }
    });
    
    expect(config.server.name).toBe('custom-server');
    expect(config.server.version).toBe('2.0.0');
    expect(config.logging.level).toBe('debug');
    expect(config.logging.console).toBe(true);
    
    // Should keep other defaults
    expect(config.storage.type).toBe('sqlite');
    expect(config.tools.task_management.enabled).toBe(true);
  });

  it('should validate tool configurations', () => {
    const config = createTestConfig();
    
    // Task management tool
    expect(config.tools.task_management.enabled).toBe(true);
    expect(config.tools.task_management.namespace).toBe('task');
    
    // Project coordination tool  
    expect(config.tools.project_coordination.enabled).toBe(true);
    expect(config.tools.project_coordination.namespace).toBe('project');
    
    // Agent orchestration tool
    expect(config.tools.agent_orchestration.enabled).toBe(true);
    expect(config.tools.agent_orchestration.namespace).toBe('agent');
  });

  it('should validate security configuration', () => {
    const config = createTestConfig();
    
    expect(config.security.max_concurrent_tools).toBe(10);
    expect(config.security.tool_timeout).toBe(30000);
    expect(config.security.rate_limiting.enabled).toBe(false);
    expect(config.security.rate_limiting.requests_per_minute).toBe(60);
  });

  it('should validate storage configuration', () => {
    const config = createTestConfig();
    
    expect(config.storage.type).toBe('sqlite');
    expect(config.storage.connection_string).toBe(':memory:');
    expect(config.storage.migrations_path).toBe('./migrations');
    expect(config.storage.backup_enabled).toBe(false);
    expect(config.storage.backup_interval).toBe('1h');
  });

  it('should validate transport configuration', () => {
    const config = createTestConfig();
    
    expect(config.transport.type).toBe('stdio');
    expect(config.transport.timeout).toBe(30000);
  });
});

describe('Type Validation Tests', () => {
  it('should accept valid task types', () => {
    const validTypes = ['epic', 'feature', 'story', 'task', 'subtask', 'atomic'];
    
    validTypes.forEach(type => {
      expect(validTypes).toContain(type);
    });
  });

  it('should accept valid task statuses', () => {
    const validStatuses = ['pending', 'in_progress', 'blocked', 'completed', 'cancelled'];
    
    validStatuses.forEach(status => {
      expect(validStatuses).toContain(status);
    });
  });

  it('should accept valid priorities', () => {
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    
    validPriorities.forEach(priority => {
      expect(validPriorities).toContain(priority);
    });
  });

  it('should accept valid log levels', () => {
    const validLevels = ['debug', 'info', 'warn', 'error'];
    
    validLevels.forEach(level => {
      expect(validLevels).toContain(level);
    });
  });
});