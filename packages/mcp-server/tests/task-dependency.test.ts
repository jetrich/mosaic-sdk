import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { TaskService } from '../src/services/TaskService';
import { Logger } from '../src/utils/Logger';
import { MCPServerConfig, TaskType, Priority } from '../src/types';

// Mock config
const mockConfig: MCPServerConfig = {
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
    task_management: { enabled: true, namespace: 'task' },
    project_coordination: { enabled: true, namespace: 'project' },
    agent_orchestration: { enabled: true, namespace: 'agent' }
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

describe('TaskService - Task Dependencies', () => {
  let taskService: TaskService;
  let logger: Logger;
  
  beforeEach(async () => {
    logger = new Logger(mockConfig.logging);
    taskService = new TaskService(mockConfig, logger);
    await taskService.initialize();
  });

  afterEach(async () => {
    // Clean up
  });

  describe('addDependency', () => {
    it('should successfully create a dependency between two tasks', async () => {
      // Create two tasks
      const task1 = await taskService.createTask({
        title: 'Task 1',
        type: 'task' as TaskType,
        priority: 'medium' as Priority
      });

      const task2 = await taskService.createTask({
        title: 'Task 2',
        type: 'task' as TaskType,
        priority: 'medium' as Priority
      });

      // Add dependency
      const dependency = await taskService.addDependency(task1.id, task2.id, {
        type: 'blocks',
        createdBy: 'test-user',
        notes: 'Test dependency'
      });

      expect(dependency).toBeDefined();
      expect(dependency.task_id).toBe(task1.id);
      expect(dependency.depends_on_task_id).toBe(task2.id);
      expect(dependency.dependency_type).toBe('blocks');
      expect(dependency.created_by).toBe('test-user');
      expect(dependency.notes).toBe('Test dependency');
    });

    it('should prevent circular dependencies', async () => {
      // Create three tasks
      const task1 = await taskService.createTask({
        title: 'Task 1',
        type: 'task' as TaskType
      });

      const task2 = await taskService.createTask({
        title: 'Task 2',
        type: 'task' as TaskType
      });

      const task3 = await taskService.createTask({
        title: 'Task 3',
        type: 'task' as TaskType
      });

      // Create dependency chain: task1 -> task2 -> task3
      await taskService.addDependency(task1.id, task2.id);
      await taskService.addDependency(task2.id, task3.id);

      // Try to create circular dependency: task3 -> task1
      await expect(
        taskService.addDependency(task3.id, task1.id)
      ).rejects.toThrow('Circular dependency detected');
    });

    it('should prevent self-dependencies', async () => {
      const task = await taskService.createTask({
        title: 'Task',
        type: 'task' as TaskType
      });

      await expect(
        taskService.addDependency(task.id, task.id)
      ).rejects.toThrow('Task cannot depend on itself');
    });

    it('should prevent duplicate dependencies', async () => {
      const task1 = await taskService.createTask({
        title: 'Task 1',
        type: 'task' as TaskType
      });

      const task2 = await taskService.createTask({
        title: 'Task 2',
        type: 'task' as TaskType
      });

      // Create first dependency
      await taskService.addDependency(task1.id, task2.id);

      // Try to create duplicate
      await expect(
        taskService.addDependency(task1.id, task2.id)
      ).rejects.toThrow('Dependency already exists');
    });

    it('should validate task existence', async () => {
      const task = await taskService.createTask({
        title: 'Task',
        type: 'task' as TaskType
      });

      // Non-existent task as source
      await expect(
        taskService.addDependency('non-existent', task.id)
      ).rejects.toThrow('Task not found: non-existent');

      // Non-existent task as dependency
      await expect(
        taskService.addDependency(task.id, 'non-existent')
      ).rejects.toThrow('Dependency task not found: non-existent');
    });

    it('should prevent dependencies on completed tasks by default', async () => {
      const task1 = await taskService.createTask({
        title: 'Task 1',
        type: 'task' as TaskType
      });

      const task2 = await taskService.createTask({
        title: 'Task 2',
        type: 'task' as TaskType
      });

      // Complete task2
      await taskService.updateTaskStatus(task2.id, 'completed');

      // Try to create dependency on completed task
      await expect(
        taskService.addDependency(task1.id, task2.id)
      ).rejects.toThrow('Cannot depend on completed task');
    });

    it('should allow dependencies on completed tasks with strict=false', async () => {
      const task1 = await taskService.createTask({
        title: 'Task 1',
        type: 'task' as TaskType
      });

      const task2 = await taskService.createTask({
        title: 'Task 2',
        type: 'task' as TaskType
      });

      // Complete task2
      await taskService.updateTaskStatus(task2.id, 'completed');

      // Create dependency with strict=false
      const dependency = await taskService.addDependency(task1.id, task2.id, {
        strict: false
      });

      expect(dependency).toBeDefined();
      expect(dependency.task_id).toBe(task1.id);
      expect(dependency.depends_on_task_id).toBe(task2.id);
    });

    it('should prevent dependencies on cancelled tasks', async () => {
      const task1 = await taskService.createTask({
        title: 'Task 1',
        type: 'task' as TaskType
      });

      const task2 = await taskService.createTask({
        title: 'Task 2',
        type: 'task' as TaskType
      });

      // Cancel task2
      await taskService.updateTaskStatus(task2.id, 'cancelled');

      // Try to create dependency on cancelled task
      await expect(
        taskService.addDependency(task1.id, task2.id)
      ).rejects.toThrow('Cannot depend on cancelled task');
    });

    it('should support different dependency types', async () => {
      const task1 = await taskService.createTask({
        title: 'Task 1',
        type: 'task' as TaskType
      });

      const task2 = await taskService.createTask({
        title: 'Task 2',
        type: 'task' as TaskType
      });

      const task3 = await taskService.createTask({
        title: 'Task 3',
        type: 'task' as TaskType
      });

      // Create 'blocks' dependency
      const blocksDep = await taskService.addDependency(task1.id, task2.id, {
        type: 'blocks'
      });
      expect(blocksDep.dependency_type).toBe('blocks');

      // Create 'depends_on' dependency
      const dependsOnDep = await taskService.addDependency(task1.id, task3.id, {
        type: 'depends_on'
      });
      expect(dependsOnDep.dependency_type).toBe('depends_on');
    });

    it('should detect complex circular dependencies', async () => {
      // Create a more complex dependency graph
      const tasks = await Promise.all([
        taskService.createTask({ title: 'Task A', type: 'task' as TaskType }),
        taskService.createTask({ title: 'Task B', type: 'task' as TaskType }),
        taskService.createTask({ title: 'Task C', type: 'task' as TaskType }),
        taskService.createTask({ title: 'Task D', type: 'task' as TaskType }),
        taskService.createTask({ title: 'Task E', type: 'task' as TaskType })
      ]);

      // Create dependencies: A -> B -> C -> D -> E
      await taskService.addDependency(tasks[0].id, tasks[1].id);
      await taskService.addDependency(tasks[1].id, tasks[2].id);
      await taskService.addDependency(tasks[2].id, tasks[3].id);
      await taskService.addDependency(tasks[3].id, tasks[4].id);

      // Try to create circular dependency: E -> B (which would create B -> C -> D -> E -> B)
      await expect(
        taskService.addDependency(tasks[4].id, tasks[1].id)
      ).rejects.toThrow('Circular dependency detected');
    });
  });
});