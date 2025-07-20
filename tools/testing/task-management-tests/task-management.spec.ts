/**
 * SDK Task Management Tests
 * Tests for task management system functionality
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';

const TASK_MANAGEMENT_PATH = join(__dirname, '../../task-management');

describe('Task Management Structure', () => {
  
  describe('Core Configuration', () => {
    it('should have main configuration file', () => {
      const configPath = join(TASK_MANAGEMENT_PATH, 'athms-config.json');
      expect(existsSync(configPath)).toBe(true);
      
      const content = readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);
      
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });
  });

  describe('Directory Organization', () => {
    it('should have all required subdirectories', () => {
      const requiredDirs = [
        'cicd',
        'integration', 
        'planning',
        'reports',
        'state',
        'sync',
        'templates'
      ];
      
      requiredDirs.forEach(dir => {
        const dirPath = join(TASK_MANAGEMENT_PATH, dir);
        expect(existsSync(dirPath)).toBe(true);
        expect(statSync(dirPath).isDirectory()).toBe(true);
      });
    });
  });

  describe('CI/CD Integration', () => {
    it('should have evidence validator', () => {
      const scriptPath = join(TASK_MANAGEMENT_PATH, 'cicd', 'evidence-validator.sh');
      expect(existsSync(scriptPath)).toBe(true);
      
      const content = readFileSync(scriptPath, 'utf-8');
      expect(content).toContain('#!/bin/bash');
      expect(content).toContain('evidence');
    });

    it('should have webhook handler', () => {
      const webhookPath = join(TASK_MANAGEMENT_PATH, 'cicd', 'webhooks', 'webhook-handler.sh');
      expect(existsSync(webhookPath)).toBe(true);
      
      const content = readFileSync(webhookPath, 'utf-8');
      expect(content).toContain('#!/bin/bash');
      expect(content).toContain('webhook');
    });
  });

  describe('Agent Integration', () => {
    it('should have agent registry', () => {
      const registryPath = join(TASK_MANAGEMENT_PATH, 'integration', 'agent-registry.json');
      expect(existsSync(registryPath)).toBe(true);
      
      const content = readFileSync(registryPath, 'utf-8');
      const registry = JSON.parse(content);
      
      expect(registry).toBeDefined();
      expect(typeof registry).toBe('object');
    });

    it('should have agent progress tracking', () => {
      const progressPath = join(TASK_MANAGEMENT_PATH, 'integration', 'agent-progress.sh');
      expect(existsSync(progressPath)).toBe(true);
      
      const content = readFileSync(progressPath, 'utf-8');
      expect(content).toContain('#!/bin/bash');
      expect(content).toContain('progress');
    });

    it('should have task assignment capability', () => {
      const assignmentPath = join(TASK_MANAGEMENT_PATH, 'integration', 'task-assignment.sh');
      expect(existsSync(assignmentPath)).toBe(true);
      
      const content = readFileSync(assignmentPath, 'utf-8');
      expect(content).toContain('#!/bin/bash');
      expect(content).toContain('assignment');
    });
  });
});

describe('Planning System', () => {
  
  describe('Planning State', () => {
    it('should have planning state file', () => {
      const statePath = join(TASK_MANAGEMENT_PATH, 'planning', 'planning-state.json');
      expect(existsSync(statePath)).toBe(true);
      
      const content = readFileSync(statePath, 'utf-8');
      const state = JSON.parse(content);
      
      expect(state).toBeDefined();
      expect(typeof state).toBe('object');
    });
  });

  describe('Phase Planning', () => {
    it('should have phase 1 abstraction planning', () => {
      const phase1Dir = join(TASK_MANAGEMENT_PATH, 'planning', 'phase-1-abstraction');
      expect(existsSync(phase1Dir)).toBe(true);
      expect(statSync(phase1Dir).isDirectory()).toBe(true);
    });

    it('should have phase 2 decomposition planning', () => {
      const phase2Dir = join(TASK_MANAGEMENT_PATH, 'planning', 'phase-2-decomposition');
      expect(existsSync(phase2Dir)).toBe(true);
      expect(statSync(phase2Dir).isDirectory()).toBe(true);
      
      // Should have multiple decomposition trees
      const expectedTrees = Array.from({length: 10}, (_, i) => `tree-${i + 1}.000-decomposition.md`);
      expectedTrees.forEach(tree => {
        const treePath = join(phase2Dir, tree);
        expect(existsSync(treePath)).toBe(true);
      });
    });

    it('should have phase 3 second pass planning', () => {
      const phase3Dir = join(TASK_MANAGEMENT_PATH, 'planning', 'phase-3-second-pass');
      expect(existsSync(phase3Dir)).toBe(true);
      expect(statSync(phase3Dir).isDirectory()).toBe(true);
    });
  });

  describe('Ultrathink Documentation', () => {
    it('should have ultrathink planning documents', () => {
      const ultrathinkDocs = [
        'AUTOMATED-FAILURE-RECOVERY-ULTRATHINK.md',
        'MODERNIZATION-2025-07-ULTRATHINK.md'
      ];
      
      ultrathinkDocs.forEach(doc => {
        const docPath = join(TASK_MANAGEMENT_PATH, 'planning', doc);
        expect(existsSync(docPath)).toBe(true);
        
        const content = readFileSync(docPath, 'utf-8');
        // Check for Ultrathink in any case
        const hasUltrathink = content.toLowerCase().includes('ultrathink');
        expect(hasUltrathink).toBe(true);
        expect(content.length).toBeGreaterThan(100);
      });
    });
  });
});

describe('State Management', () => {
  
  describe('Global State', () => {
    it('should have global state file', () => {
      const statePath = join(TASK_MANAGEMENT_PATH, 'state', 'global-state.json');
      expect(existsSync(statePath)).toBe(true);
      
      const content = readFileSync(statePath, 'utf-8');
      const state = JSON.parse(content);
      
      expect(state).toBeDefined();
      expect(typeof state).toBe('object');
    });

    it('should have state synchronization script', () => {
      const syncPath = join(TASK_MANAGEMENT_PATH, 'state', 'state-sync.sh');
      expect(existsSync(syncPath)).toBe(true);
      
      const content = readFileSync(syncPath, 'utf-8');
      expect(content).toContain('#!/bin/bash');
      expect(content).toContain('sync');
    });
  });

  describe('Federation System', () => {
    it('should have federation configuration', () => {
      const federationPath = join(TASK_MANAGEMENT_PATH, 'sync', 'federation', 'global-federation.json');
      expect(existsSync(federationPath)).toBe(true);
      
      const content = readFileSync(federationPath, 'utf-8');
      const federation = JSON.parse(content);
      
      expect(federation).toBeDefined();
      expect(typeof federation).toBe('object');
    });

    it('should have federation monitoring', () => {
      const monitorPath = join(TASK_MANAGEMENT_PATH, 'sync', 'monitoring', 'federation-monitor.sh');
      expect(existsSync(monitorPath)).toBe(true);
      
      const content = readFileSync(monitorPath, 'utf-8');
      expect(content).toContain('#!/bin/bash');
      expect(content).toContain('monitor');
    });
  });
});

describe('Templates and Reports', () => {
  
  describe('Task Templates', () => {
    it('should have template files', () => {
      const templates = [
        'dependencies.json',
        'status.json',
        'task.json'
      ];
      
      templates.forEach(template => {
        const templatePath = join(TASK_MANAGEMENT_PATH, 'templates', template);
        expect(existsSync(templatePath)).toBe(true);
        
        const content = readFileSync(templatePath, 'utf-8');
        const json = JSON.parse(content);
        
        expect(json).toBeDefined();
        expect(typeof json).toBe('object');
      });
    });
  });

  describe('Reporting System', () => {
    it('should have dependency audit report', () => {
      const reportPath = join(TASK_MANAGEMENT_PATH, 'reports', 'DEPENDENCY-AUDIT-REPORT-2025-07.md');
      expect(existsSync(reportPath)).toBe(true);
      
      const content = readFileSync(reportPath, 'utf-8');
      expect(content).toContain('dependency');
      expect(content).toContain('audit');
      expect(content.length).toBeGreaterThan(100);
    });

    it('should have integration test report', () => {
      const reportPath = join(TASK_MANAGEMENT_PATH, 'reports', 'INTEGRATION-TEST-REPORT-15.001.md');
      expect(existsSync(reportPath)).toBe(true);
      
      const content = readFileSync(reportPath, 'utf-8');
      expect(content).toContain('integration');
      expect(content).toContain('test');
      expect(content.length).toBeGreaterThan(100);
    });
  });
});

describe('Task Management Safety', () => {
  
  describe('Script Security', () => {
    it('should use safe bash practices in scripts', () => {
      const scripts = [
        'cicd/evidence-validator.sh',
        'cicd/webhooks/webhook-handler.sh',
        'integration/agent-progress.sh',
        'integration/task-assignment.sh',
        'state/state-sync.sh',
        'sync/monitoring/federation-monitor.sh',
        'sync/project-sync.sh'
      ];
      
      scripts.forEach(script => {
        const scriptPath = join(TASK_MANAGEMENT_PATH, script);
        if (existsSync(scriptPath)) {
          const content = readFileSync(scriptPath, 'utf-8');
          
          // Should use set -e for error handling
          expect(content).toContain('set -e');
          
          // Should not contain dangerous patterns
          expect(content).not.toContain('rm -rf /');
          expect(content).not.toContain('rm -rf ~');
        }
      });
    });
  });

  describe('JSON Validation', () => {
    it('should have valid JSON files', () => {
      const jsonFiles = [
        'athms-config.json',
        'integration/agent-registry.json',
        'planning/planning-state.json',
        'state/global-state.json',
        'sync/federation/global-federation.json',
        'templates/dependencies.json',
        'templates/status.json',
        'templates/task.json'
      ];
      
      jsonFiles.forEach(file => {
        const filePath = join(TASK_MANAGEMENT_PATH, file);
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8');
          expect(() => JSON.parse(content)).not.toThrow();
        }
      });
    });
  });
});