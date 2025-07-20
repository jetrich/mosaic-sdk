/**
 * SDK Development Tools Tests
 * Tests for development-tools configuration and setup
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DEVELOPMENT_TOOLS_PATH = join(__dirname, '../../development-tools');

describe('SDK Development Tools Configuration', () => {
  
  describe('Package Configuration', () => {
    it('should have valid package.json', () => {
      const packagePath = join(DEVELOPMENT_TOOLS_PATH, 'package.json');
      expect(existsSync(packagePath)).toBe(true);
      
      const packageContent = readFileSync(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      expect(packageJson.name).toBe('@tony/development-tools');
      expect(packageJson.version).toBeDefined();
      expect(packageJson.private).toBe(true);
    });

    it('should have SDK-appropriate dependencies', () => {
      const packagePath = join(DEVELOPMENT_TOOLS_PATH, 'package.json');
      const packageContent = readFileSync(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      // Should not have framework dependencies
      expect(packageJson.dependencies).toEqual({});
      
      // Should focus on development tooling
      expect(packageJson.description).toContain('development');
    });
  });

  describe('TypeScript Configuration', () => {
    it('should have valid tsconfig.json', () => {
      const tsconfigPath = join(DEVELOPMENT_TOOLS_PATH, 'tsconfig.json');
      expect(existsSync(tsconfigPath)).toBe(true);
      
      const tsconfigContent = readFileSync(tsconfigPath, 'utf-8');
      
      // Validate structure without parsing (TypeScript configs often have comments)
      expect(tsconfigContent).toContain('compilerOptions');
      expect(tsconfigContent).toContain('strict');
      expect(tsconfigContent).toContain('target');
      expect(tsconfigContent).toContain('module');
      expect(tsconfigContent.length).toBeGreaterThan(100);
    });
  });

  describe('Documentation', () => {
    it('should have README.md', () => {
      const readmePath = join(DEVELOPMENT_TOOLS_PATH, 'README.md');
      expect(existsSync(readmePath)).toBe(true);
      
      const readmeContent = readFileSync(readmePath, 'utf-8');
      expect(readmeContent).toContain('Development Tools');
      expect(readmeContent.length).toBeGreaterThan(100);
    });
  });

  describe('Version Configuration', () => {
    it('should have version-specific package.json', () => {
      const versionPackagePath = join(DEVELOPMENT_TOOLS_PATH, 'version-package.json');
      expect(existsSync(versionPackagePath)).toBe(true);
      
      const packageContent = readFileSync(versionPackagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      
      expect(packageJson.name).toBeDefined();
      expect(packageJson.version).toBeDefined();
    });

    it('should have version-specific TypeScript config', () => {
      const versionTsconfigPath = join(DEVELOPMENT_TOOLS_PATH, 'version-tsconfig.json');
      expect(existsSync(versionTsconfigPath)).toBe(true);
      
      const tsconfigContent = readFileSync(versionTsconfigPath, 'utf-8');
      const tsconfig = JSON.parse(tsconfigContent);
      
      expect(tsconfig.compilerOptions).toBeDefined();
    });
  });
});

describe('Development Tools Integrity', () => {
  it('should not contain framework dependencies', () => {
    const packagePath = join(DEVELOPMENT_TOOLS_PATH, 'package.json');
    const packageContent = readFileSync(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageContent);
    
    // Ensure no framework-specific dependencies
    const allDeps = {
      ...packageJson.dependencies || {},
      ...packageJson.devDependencies || {}
    };
    
    expect(Object.keys(allDeps)).not.toContain('@tony/framework');
    expect(Object.keys(allDeps)).not.toContain('tony-framework');
  });

  it('should maintain SDK separation', () => {
    const packagePath = join(DEVELOPMENT_TOOLS_PATH, 'package.json');
    const packageContent = readFileSync(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageContent);
    
    // Should be part of SDK workspace
    expect(packageJson.name).toMatch(/@tony\//);
    expect(packageJson.private).toBe(true);
  });
});