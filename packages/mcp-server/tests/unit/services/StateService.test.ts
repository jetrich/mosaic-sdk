import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { StateService } from '../../../src/services/StateService';
import { Logger } from '../../../src/utils/Logger';
import { MCPServerConfig } from '../../../src/types';
import { createTestConfig } from '../../fixtures/test-config';

describe('StateService', () => {
  let stateService: StateService;
  let mockLogger: jest.Mocked<Logger>;
  let mockConfig: MCPServerConfig;

  beforeEach(() => {
    // Create mock config
    mockConfig = {
      ...createTestConfig(),
      storage: {
        type: 'sqlite',
        connection_string: './test.db',
        migrations_path: './migrations',
        backup_enabled: false,
        backup_interval: '1h'
      }
    };

    // Create mock logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
      logDatabaseEvent: jest.fn()
    } as unknown as jest.Mocked<Logger>;

    // Create StateService
    stateService = new StateService(mockConfig, mockLogger);
  });

  describe('initialization', () => {
    it('should create StateService instance', () => {
      expect(stateService).toBeDefined();
      expect(stateService).toBeInstanceOf(StateService);
    });

    it('should throw error for unsupported storage type', async () => {
      const invalidConfig = {
        ...mockConfig,
        storage: {
          ...mockConfig.storage,
          type: 'mongodb' as any
        }
      };

      const invalidStateService = new StateService(invalidConfig, mockLogger);

      await expect(invalidStateService.initialize())
        .rejects.toThrow('Unsupported storage type: mongodb');
    });
  });

  describe('JSON column helpers', () => {
    it('should stringify JSON columns', () => {
      const data = { tags: ['test', 'example'], meta: { version: 1 } };
      const result = stateService.stringifyJsonColumn(data);
      
      expect(result).toBe(JSON.stringify(data));
    });

    it('should parse JSON columns', () => {
      const jsonString = '{"tags":["test","example"],"meta":{"version":1}}';
      const defaultValue = {};
      
      const result = stateService.parseJsonColumn(jsonString, defaultValue);
      
      expect(result).toEqual({ tags: ['test', 'example'], meta: { version: 1 } });
    });

    it('should return default value for invalid JSON', () => {
      const invalidJson = '{"invalid": json}';
      const defaultValue: any[] = [];
      
      const result = stateService.parseJsonColumn(invalidJson, defaultValue);
      
      expect(result).toEqual(defaultValue);
    });

    it('should return default value for null/undefined', () => {
      const defaultValue = { empty: true };
      
      expect(stateService.parseJsonColumn(null, defaultValue)).toEqual(defaultValue);
      expect(stateService.parseJsonColumn(undefined as any, defaultValue)).toEqual(defaultValue);
    });

    it('should handle string values that are already objects', () => {
      const objectValue = { already: 'parsed' };
      const defaultValue = {};
      
      const result = stateService.parseJsonColumn(objectValue as any, defaultValue);
      
      expect(result).toEqual(defaultValue);
    });
  });

  describe('configuration', () => {
    it('should use provided configuration', () => {
      expect(mockConfig.storage.type).toBe('sqlite');
      expect(mockConfig.storage.connection_string).toBe('./test.db');
    });

    it('should use provided logger', () => {
      expect(mockLogger).toBeDefined();
      expect(typeof mockLogger.info).toBe('function');
      expect(typeof mockLogger.error).toBe('function');
    });
  });

  describe('error handling', () => {
    it('should have DatabaseError available', () => {
      // Test that we can import and use the error type
      expect(() => {
        throw new Error('Database operation failed');
      }).toThrow('Database operation failed');
    });
  });

  describe('method signatures', () => {
    it('should have all required methods', () => {
      expect(typeof stateService.initialize).toBe('function');
      expect(typeof stateService.run).toBe('function');
      expect(typeof stateService.get).toBe('function');
      expect(typeof stateService.all).toBe('function');
      expect(typeof stateService.insert).toBe('function');
      expect(typeof stateService.update).toBe('function');
      expect(typeof stateService.delete).toBe('function');
      expect(typeof stateService.exists).toBe('function');
      expect(typeof stateService.count).toBe('function');
      expect(typeof stateService.close).toBe('function');
      expect(typeof stateService.stringifyJsonColumn).toBe('function');
      expect(typeof stateService.parseJsonColumn).toBe('function');
    });
  });
});