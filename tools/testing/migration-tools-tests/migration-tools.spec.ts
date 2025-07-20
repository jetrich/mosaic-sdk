/**
 * SDK Migration Tools Tests
 * Tests for migration tools functionality and integrity
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';

const MIGRATION_TOOLS_PATH = join(__dirname, '../../migration-tools');

describe('Migration Tools Structure', () => {
  
  describe('Directory Organization', () => {
    it('should have all required subdirectories', () => {
      const requiredDirs = ['cleanup', 'conversion', 'diagnostic', 'packaging', 'upgrade'];
      
      requiredDirs.forEach(dir => {
        const dirPath = join(MIGRATION_TOOLS_PATH, dir);
        expect(existsSync(dirPath)).toBe(true);
        expect(statSync(dirPath).isDirectory()).toBe(true);
      });
    });
  });

  describe('Cleanup Tools', () => {
    it('should have uninstall script', () => {
      const scriptPath = join(MIGRATION_TOOLS_PATH, 'cleanup', 'tony-uninstall.sh');
      expect(existsSync(scriptPath)).toBe(true);
      
      const content = readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('#!/bin/bash');
      expect(content).toContain('uninstall');
    });
  });

  describe('Conversion Tools', () => {
    it('should have restructure script', () => {
      const scriptPath = join(MIGRATION_TOOLS_PATH, 'conversion', 'tony-restructure.sh');
      expect(existsSync(scriptPath)).toBe(true);
      
      const content = readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('#!/bin/bash');
      expect(content).toContain('restructure');
    });
  });

  describe('Diagnostic Tools', () => {
    it('should have diagnostic script', () => {
      const scriptPath = join(MIGRATION_TOOLS_PATH, 'diagnostic', 'tony-diagnose.sh');
      expect(existsSync(scriptPath)).toBe(true);
      
      const content = readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('#!/bin/bash');
      expect(content).toContain('Diagnostic');
    });
  });

  describe('Packaging Tools', () => {
    it('should have distribution creation script', () => {
      const scriptPath = join(MIGRATION_TOOLS_PATH, 'packaging', 'create-distribution.sh');
      expect(existsSync(scriptPath)).toBe(true);
      
      const content = readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('#!/bin/bash');
      expect(content).toContain('distribution');
    });
  });

  describe('Upgrade Tools', () => {
    it('should have upgrade scripts', () => {
      const upgradeScripts = [
        'tony-upgrade.sh',
        'tony-upgrade-v25.sh', 
        'tony-force-upgrade.sh'
      ];
      
      upgradeScripts.forEach(script => {
        const scriptPath = join(MIGRATION_TOOLS_PATH, 'upgrade', script);
        expect(existsSync(scriptPath)).toBe(true);
        
        const content = readFileSync(scriptPath, 'utf-8');
        expect(content).toContain('#!/bin/bash');
        expect(content).toContain('upgrade');
      });
    });

    it('should have main upgrade script with proper functionality', () => {
      const scriptPath = join(MIGRATION_TOOLS_PATH, 'upgrade', 'tony-upgrade.sh');
      const content = readFileSync(scriptPath, 'utf-8');
      
      // Check for key upgrade functionality
      expect(content).toContain('version');
      expect(content).toContain('backup');
      expect(content).toContain('github');
      expect(content).toContain('--check');
      expect(content).toContain('--help');
    });
  });
});

describe('Migration Tools Safety', () => {
  
  describe('Script Security', () => {
    it('should use safe bash practices', () => {
      const allScripts = [
        'cleanup/tony-uninstall.sh',
        'conversion/tony-restructure.sh',
        'diagnostic/tony-diagnose.sh',
        'packaging/create-distribution.sh',
        'upgrade/tony-upgrade.sh',
        'upgrade/tony-upgrade-v25.sh',
        'upgrade/tony-force-upgrade.sh'
      ];
      
      allScripts.forEach(script => {
        const scriptPath = join(MIGRATION_TOOLS_PATH, script);
        if (existsSync(scriptPath)) {
          const content = readFileSync(scriptPath, 'utf-8');
          
          // Should use set -e for error handling
          expect(content).toContain('set -e');
          
          // Should not contain dangerous patterns
          expect(content).not.toContain('rm -rf /');
          expect(content).not.toContain('rm -rf ~');
          expect(content).not.toContain('rm -rf $HOME');
        }
      });
    });
  });

  describe('Backup Safety', () => {
    it('should include backup mechanisms in destructive operations', () => {
      const destructiveScripts = [
        'cleanup/tony-uninstall.sh',
        'upgrade/tony-upgrade.sh',
        'upgrade/tony-force-upgrade.sh'
      ];
      
      destructiveScripts.forEach(script => {
        const scriptPath = join(MIGRATION_TOOLS_PATH, script);
        if (existsSync(scriptPath)) {
          const content = readFileSync(scriptPath, 'utf-8');
          
          // Should mention backup or safety
          expect(
            content.includes('backup') || 
            content.includes('Backup') ||
            content.includes('confirm') ||
            content.includes('--yes')
          ).toBe(true);
        }
      });
    });
  });
});

describe('Migration Tools Functionality', () => {
  
  describe('Version Management', () => {
    it('should handle version detection properly', () => {
      const upgradeScript = join(MIGRATION_TOOLS_PATH, 'upgrade', 'tony-upgrade.sh');
      if (existsSync(upgradeScript)) {
        const content = readFileSync(upgradeScript, 'utf-8');
        
        // Should have version comparison logic
        expect(content).toContain('version');
        expect(content).toContain('VERSION');
        
        // Should handle version sources
        expect(content).toContain('github') || expect(content).toContain('GitHub');
      }
    });
  });

  describe('User Experience', () => {
    it('should provide help and usage information', () => {
      const mainScripts = [
        'upgrade/tony-upgrade.sh',
        'diagnostic/tony-diagnose.sh',
        'cleanup/tony-uninstall.sh'
      ];
      
      mainScripts.forEach(script => {
        const scriptPath = join(MIGRATION_TOOLS_PATH, script);
        if (existsSync(scriptPath)) {
          const content = readFileSync(scriptPath, 'utf-8');
          
          // Should provide help or have descriptive functionality
          expect(
            content.includes('--help') || 
            content.includes('usage') || 
            content.includes('Usage') ||
            content.includes('show_usage') ||
            content.includes('help') ||
            content.includes('Help') ||
            content.includes('options') ||
            content.includes('Options')
          ).toBe(true);
        }
      });
    });
  });
});