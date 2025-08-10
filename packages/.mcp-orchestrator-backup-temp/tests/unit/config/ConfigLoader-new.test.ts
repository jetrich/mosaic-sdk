import { describe, it, expect } from '@jest/globals';
import { ConfigLoader } from '../../../src/config/ConfigLoader';

describe('ConfigLoader', () => {
  describe('mergeWithDefaults', () => {
    it('should merge partial config with defaults', () => {
      const partialConfig = {
        server: {
          name: 'custom-server',
          version: '2.0.0',
          description: 'Custom server'
        },
        transport: {
          type: 'stdio' as const,
          timeout: 5000
        },
        storage: {
          type: 'sqlite' as const,
          connection_string: './custom/path.db',
          migrations_path: './migrations',
          backup_enabled: false,
          backup_interval: '2h'
        },
        logging: {
          level: 'debug' as const,
          console: true,
          structured: false
        }
      };

      const merged = ConfigLoader.mergeWithDefaults(partialConfig);

      // Custom values should be preserved
      expect(merged.server.name).toBe('custom-server');
      expect(merged.server.version).toBe('2.0.0');
      expect(merged.logging.level).toBe('debug');
      expect(merged.storage.connection_string).toBe('./custom/path.db');
      expect(merged.transport.timeout).toBe(5000);

      // Defaults should be applied for missing fields
      expect(merged.security.rate_limiting.enabled).toBe(true);
      expect(merged.tools.task_management.namespace).toBe('mosaic_task');
    });

    it('should handle empty config', () => {
      const merged = ConfigLoader.mergeWithDefaults({});

      // All defaults should be applied
      expect(merged.server.name).toBe('mosaic-mcp-orchestrator');
      expect(merged.transport.type).toBe('stdio');
      expect(merged.transport.timeout).toBe(30000);
      expect(merged.logging.level).toBe('info');
      expect(merged.security.max_concurrent_tools).toBe(5);
    });

    it('should deep merge nested objects', () => {
      const partialConfig = {
        security: {
          max_concurrent_tools: 10,
          tool_timeout: 300000,
          rate_limiting: {
            enabled: true,
            requests_per_minute: 200
          }
        }
      };

      const merged = ConfigLoader.mergeWithDefaults(partialConfig);

      // Nested value should be overridden
      expect(merged.security.rate_limiting.requests_per_minute).toBe(200);
      expect(merged.security.rate_limiting.enabled).toBe(true);
      // Values provided in config should be used
      expect(merged.security.max_concurrent_tools).toBe(10);
      expect(merged.security.tool_timeout).toBe(300000);
    });
  });

  describe('getDefault', () => {
    it('should return default configuration', () => {
      const defaults = ConfigLoader.getDefault();

      expect(defaults.server.name).toBe('mosaic-mcp-orchestrator');
      expect(defaults.transport.type).toBe('stdio');
      expect(defaults.logging.level).toBe('info');
    });

    it('should return a copy of defaults', () => {
      const defaults1 = ConfigLoader.getDefault();
      const defaults2 = ConfigLoader.getDefault();

      // Should be different objects
      expect(defaults1).not.toBe(defaults2);
      
      // But have same values
      expect(defaults1).toEqual(defaults2);
    });
  });

  describe('validate', () => {
    it('should validate valid configuration', () => {
      const validConfig = ConfigLoader.getDefault();
      
      // Should not throw
      expect(() => ConfigLoader.validate(validConfig)).not.toThrow();
    });

    it('should throw on invalid configuration', () => {
      const invalidConfig = {
        server: {
          name: 'test',
          // missing required fields
        }
      };

      expect(() => ConfigLoader.validate(invalidConfig)).toThrow('Invalid configuration format');
    });

    it('should validate enum values', () => {
      const config = ConfigLoader.getDefault();
      // @ts-expect-error - testing invalid value
      config.transport.type = 'invalid';

      expect(() => ConfigLoader.validate(config)).toThrow();
    });
  });
});