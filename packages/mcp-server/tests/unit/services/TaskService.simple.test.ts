import { describe, it, expect } from '@jest/globals';
import { TaskService } from '../../../src/services/TaskService';
import { Logger } from '../../../src/utils/Logger';
import { createTestConfig } from '../../fixtures/test-config';

describe('TaskService - Basic Structure', () => {
  it('should create a TaskService instance', () => {
    const config = createTestConfig();
    const logger = new Logger(config.logging);
    
    const taskService = new TaskService(config, logger);
    
    expect(taskService).toBeDefined();
    expect(taskService).toBeInstanceOf(TaskService);
  });

  it('should have required methods', () => {
    const config = createTestConfig();
    const logger = new Logger(config.logging);
    const taskService = new TaskService(config, logger);
    
    // Check that the service has the expected methods
    expect(typeof taskService.initialize).toBe('function');
    expect(typeof taskService.createTask).toBe('function');
    expect(typeof taskService.updateTask).toBe('function');
    expect(typeof taskService.getTask).toBe('function');
    expect(typeof taskService.listTasks).toBe('function');
    expect(typeof taskService.deleteTask).toBe('function');
    expect(typeof taskService.assignTask).toBe('function');
    expect(typeof taskService.addDependency).toBe('function');
    expect(typeof taskService.updateTaskStatus).toBe('function');
    expect(typeof taskService.createTaskDependencies).toBe('function');
    expect(typeof taskService.getTaskStats).toBe('function');
    expect(typeof taskService.healthCheck).toBe('function');
  });

  it('should have current project management methods', () => {
    const config = createTestConfig();
    const logger = new Logger(config.logging);
    const taskService = new TaskService(config, logger);
    
    // Check project-related methods
    expect(typeof taskService.setCurrentProject).toBe('function');
    expect(typeof taskService.getCurrentProject).toBe('function');
  });

  it('should initialize with default project', async () => {
    const config = createTestConfig();
    const logger = new Logger(config.logging);
    const taskService = new TaskService(config, logger);
    
    // Should start with a default project
    const currentProject = taskService.getCurrentProject();
    expect(currentProject).toBeDefined();
    expect(typeof currentProject).toBe('string');
  });
});