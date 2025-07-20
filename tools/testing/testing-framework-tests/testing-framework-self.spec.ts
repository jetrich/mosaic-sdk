/**
 * Testing Framework Self-Tests
 * Tests for the testing framework infrastructure itself
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const TESTING_FRAMEWORK_PATH = join(__dirname, '..');

describe('Testing Framework Configuration', () => {
  
  describe('Vitest Configuration', () => {
    it('should have valid vitest.config.ts', () => {
      const configPath = join(TESTING_FRAMEWORK_PATH, 'vitest.config.ts');
      expect(existsSync(configPath)).toBe(true);
      
      const content = readFileSync(configPath, 'utf-8');
      expect(content).toContain('defineConfig');
      expect(content).toContain('vitest/config');
      expect(content).toContain('node');
    });

    it('should have SDK-focused aliases', () => {
      const configPath = join(TESTING_FRAMEWORK_PATH, 'vitest.config.ts');
      const content = readFileSync(configPath, 'utf-8');
      
      // Should have SDK aliases, not framework aliases
      expect(content).toContain('@sdk');
      expect(content).toContain('@tests');
      expect(content).toContain('@fixtures');
      
      // Should not have framework aliases
      expect(content).not.toContain('@framework');
      expect(content).not.toContain('@tony-framework');
    });

    it('should have appropriate test patterns', () => {
      const configPath = join(TESTING_FRAMEWORK_PATH, 'vitest.config.ts');
      const content = readFileSync(configPath, 'utf-8');
      
      expect(content).toContain('**/*.test.ts');
      expect(content).toContain('**/*.spec.ts');
    });

    it('should have coverage configuration', () => {
      const configPath = join(TESTING_FRAMEWORK_PATH, 'vitest.config.ts');
      const content = readFileSync(configPath, 'utf-8');
      
      expect(content).toContain('coverage');
      expect(content).toContain('thresholds');
    });
  });

  describe('Package Configuration', () => {
    it('should have valid package.json', () => {
      const packagePath = join(TESTING_FRAMEWORK_PATH, 'package.json');
      expect(existsSync(packagePath)).toBe(true);
      
      const packageContent = readFileSync(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      expect(packageJson.name).toBe('@tony/testing-framework');
      expect(packageJson.private).toBe(true);
      expect(packageJson.description).toContain('testing');
    });

    it('should have comprehensive test scripts', () => {
      const packagePath = join(TESTING_FRAMEWORK_PATH, 'package.json');
      const packageContent = readFileSync(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      const scripts = packageJson.scripts;
      expect(scripts.test).toBeDefined();
      expect(scripts['test:unit']).toBeDefined();
      expect(scripts['test:integration']).toBeDefined();
      expect(scripts.coverage).toBeDefined();
    });

    it('should have appropriate devDependencies', () => {
      const packagePath = join(TESTING_FRAMEWORK_PATH, 'package.json');
      const packageContent = readFileSync(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      const devDeps = packageJson.devDependencies;
      expect(devDeps.vitest).toBeDefined();
      expect(devDeps.typescript).toBeDefined();
      expect(devDeps['@vitest/coverage-v8']).toBeDefined();
    });

    it('should not have framework dependencies', () => {
      const packagePath = join(TESTING_FRAMEWORK_PATH, 'package.json');
      const packageContent = readFileSync(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      expect(packageJson.dependencies).toEqual({});
    });
  });

  describe('Test Setup', () => {
    it('should have test setup file', () => {
      const setupPath = join(TESTING_FRAMEWORK_PATH, 'tests', 'test-setup.ts');
      expect(existsSync(setupPath)).toBe(true);
      
      const content = readFileSync(setupPath, 'utf-8');
      expect(content).toContain('vitest');
    });
  });
});

describe('Testing Framework Functionality', () => {
  
  describe('Basic Test Infrastructure', () => {
    it('should support describe blocks', () => {
      expect(describe).toBeDefined();
      expect(typeof describe).toBe('function');
    });

    it('should support it blocks', () => {
      expect(it).toBeDefined();
      expect(typeof it).toBe('function');
    });

    it('should support expect assertions', () => {
      expect(expect).toBeDefined();
      expect(typeof expect).toBe('function');
    });

    it('should support beforeEach and afterEach', () => {
      expect(beforeEach).toBeDefined();
      expect(afterEach).toBeDefined();
      expect(typeof beforeEach).toBe('function');
      expect(typeof afterEach).toBe('function');
    });
  });

  describe('Assertion Capabilities', () => {
    it('should support basic assertions', () => {
      expect(true).toBe(true);
      expect(false).toBe(false);
      expect(1).toEqual(1);
      expect('test').toContain('est');
    });

    it('should support object assertions', () => {
      const obj = { name: 'test', value: 42 };
      expect(obj).toHaveProperty('name');
      expect(obj.name).toBe('test');
      expect(obj).toMatchObject({ name: 'test' });
    });

    it('should support array assertions', () => {
      const arr = [1, 2, 3];
      expect(arr).toHaveLength(3);
      expect(arr).toContain(2);
      expect(arr[0]).toBe(1);
    });

    it('should support type assertions', () => {
      expect('string').toBeTypeOf('string');
      expect(123).toBeTypeOf('number');
      expect(true).toBeTypeOf('boolean');
      expect(undefined).toBeUndefined();
      expect(null).toBeNull();
    });
  });

  describe('Mock Support', () => {
    it('should support basic mocking', () => {
      const mockFn = vi.fn();
      mockFn('test');
      
      expect(mockFn).toHaveBeenCalled();
      expect(mockFn).toHaveBeenCalledWith('test');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should support mock return values', () => {
      const mockFn = vi.fn().mockReturnValue('mocked');
      const result = mockFn();
      
      expect(result).toBe('mocked');
      expect(mockFn).toHaveBeenCalled();
    });
  });
});

describe('Testing Framework Quality', () => {
  
  describe('Code Coverage', () => {
    it('should be configured for appropriate coverage thresholds', () => {
      const packagePath = join(TESTING_FRAMEWORK_PATH, 'package.json');
      const packageContent = readFileSync(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      const config = packageJson.config;
      if (config && config['coverage-threshold']) {
        const thresholds = config['coverage-threshold'].global;
        expect(thresholds.branches).toBeGreaterThanOrEqual(80);
        expect(thresholds.functions).toBeGreaterThanOrEqual(80);
        expect(thresholds.lines).toBeGreaterThanOrEqual(80);
        expect(thresholds.statements).toBeGreaterThanOrEqual(80);
      }
    });
  });

  describe('Performance Standards', () => {
    it('should be configured with reasonable test timeouts', () => {
      const packagePath = join(TESTING_FRAMEWORK_PATH, 'package.json');
      const packageContent = readFileSync(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      const config = packageJson.config;
      if (config && config['test-timeout']) {
        expect(config['test-timeout']).toBeGreaterThan(1000);
        expect(config['test-timeout']).toBeLessThan(60000);
      }
    });
  });
});

// Global test for vi object (Vitest)
declare global {
  const vi: any;
}