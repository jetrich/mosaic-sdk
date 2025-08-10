import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TaskService } from '../../../src/services/TaskService';
import { StateService } from '../../../src/services/StateService';
import { Logger } from '../../../src/utils/Logger';
import { MCPServerConfig, TaskType, Priority } from '../../../src/types';
import { createTestConfig } from '../../fixtures/test-config';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('TaskService', () => {
  let taskService: TaskService;
  let mockStateService: jest.Mocked<StateService>;
  let mockLogger: jest.Mocked<Logger>;
  let testDataDir: string;

  const mockConfig: MCPServerConfig = createTestConfig();

  beforeEach(async () => {
    // Create test data directory
    testDataDir = path.join(__dirname, 'test-data-' + Date.now());
    await fs.mkdir(testDataDir, { recursive: true });
    
    // Create mock logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      log: jest.fn()
    } as unknown as jest.Mocked<Logger>;

    // Create TaskService with mocked dependencies
    taskService = new TaskService(mockConfig, mockLogger);
    
    // Mock the StateService inside TaskService
    mockStateService = {
      insert: jest.fn(),
      update: jest.fn(),
      get: jest.fn(),
      all: jest.fn(),
      run: jest.fn(),
      close: jest.fn(),
      createTable: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      transaction: jest.fn(),
      delete: jest.fn(),
      stringifyJsonColumn: jest.fn((value) => JSON.stringify(value)),
      parseJsonColumn: jest.fn((value, defaultValue) => {
        try {
          return typeof value === 'string' ? JSON.parse(value) : defaultValue;
        } catch {
          return defaultValue;
        }
      })
    } as unknown as jest.Mocked<StateService>;
    
    // Replace the internal stateService with our mock
    (taskService as any).stateService = mockStateService;
    (taskService as any).initialized = true;
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('createTask', () => {
    it('should create a task with valid input', async () => {
      const taskInput = {
        title: 'Test Task',
        type: 'task' as TaskType,
        priority: 'medium' as Priority,
        description: 'Test task description'
      };

      // Mock the insert to return the generated ID
      mockStateService.insert.mockImplementation((_table, data) => {
        return Promise.resolve(data['id']);
      });

      const result = await taskService.createTask(taskInput);

      // Check that the result has the expected shape and values
      expect(result).toMatchObject({
        title: taskInput.title,
        type: taskInput.type,
        status: 'pending',
        priority: taskInput.priority,
        description: taskInput.description,
        project_id: 'default',
        created_by: 'system',
        labels: [],
        dependencies: []
      });
      
      // Check that ID and timestamps were generated
      expect(result.id).toMatch(/^T\.[a-z0-9]+\.[a-z0-9]+$/);
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);

      expect(mockStateService.insert).toHaveBeenCalledWith(
        'tasks',
        expect.objectContaining({
          title: taskInput.title,
          type: taskInput.type,
          priority: taskInput.priority,
          description: taskInput.description,
          status: 'pending'
        })
      );
    });

    it('should validate required fields', async () => {
      const invalidInput = {
        // Missing required title
        type: 'task' as TaskType
      };

      await expect(taskService.createTask(invalidInput as any))
        .rejects.toThrow();
    });

    it('should use default values for optional fields', async () => {
      const minimalInput = {
        title: 'Minimal Task',
        type: 'task' as TaskType
      };

      mockStateService.insert.mockResolvedValue('task-456');

      await taskService.createTask(minimalInput);

      expect(mockStateService.insert).toHaveBeenCalledWith(
        'tasks',
        expect.objectContaining({
          priority: 'medium',
          status: 'pending'
        })
      );
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status successfully', async () => {
      const taskId = 'task-123';
      const newStatus = 'in_progress';

      // Mock database row (before transformation)
      const dbRow = {
        id: taskId,
        title: 'Test Task',
        type: 'task',
        status: 'pending',
        priority: 'medium',
        description: 'Test description',
        project_id: 'test-project',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z',
        created_by: 'test-user',
        labels: '[]',
        dependencies: '[]',
        assignee: null,
        due_date: null,
        parent_id: null,
        estimated_hours: null,
        actual_hours: 0,
        completed_date: null
      };

      // First call to get existing task
      mockStateService.get.mockResolvedValueOnce(dbRow);
      mockStateService.update.mockResolvedValue(undefined);
      
      // Second call to get updated task
      const updatedDbRow = { ...dbRow, status: newStatus, updated_at: '2024-01-15T10:05:00.000Z' };
      mockStateService.get.mockResolvedValueOnce(updatedDbRow);

      const result = await taskService.updateTaskStatus(taskId, newStatus);

      expect(result).toMatchObject({
        id: taskId,
        status: newStatus,
        title: 'Test Task'
      });

      expect(mockStateService.update).toHaveBeenCalledWith(
        'tasks',
        taskId,
        expect.objectContaining({
          status: newStatus,
          updated_at: expect.any(String) // Should be ISO string in DB
        })
      );
    });

    it('should throw error if task not found', async () => {
      const taskId = 'nonexistent';
      
      mockStateService.get.mockResolvedValue(null);

      await expect(taskService.updateTaskStatus(taskId, 'in_progress'))
        .rejects.toThrow('Task not found');
    });

    it('should handle completed status transition', async () => {
      const taskId = 'task-123';
      const existingDbRow = {
        id: taskId,
        title: 'Completed Task',
        type: 'task',
        status: 'in_progress',
        priority: 'medium',
        description: '',
        project_id: 'test-project',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z',
        created_by: 'test-user',
        labels: '[]',
        dependencies: '[]',
        assignee: null,
        due_date: null,
        parent_id: null,
        estimated_hours: null,
        actual_hours: 0,
        completed_date: null
      };

      mockStateService.get.mockResolvedValueOnce(existingDbRow);
      mockStateService.update.mockResolvedValue(undefined);
      
      const updatedDbRow = { ...existingDbRow, status: 'completed', updated_at: '2024-01-15T10:05:00.000Z' };
      mockStateService.get.mockResolvedValueOnce(updatedDbRow);

      const result = await taskService.updateTaskStatus(taskId, 'completed');

      expect(result.status).toBe('completed');
      expect(mockStateService.update).toHaveBeenCalled();
    });
  });

  describe('getTask', () => {
    it('should retrieve a task by ID', async () => {
      const dbRow = {
        id: 'task-123',
        title: 'Test Task',
        status: 'pending',
        type: 'task',
        priority: 'medium',
        description: 'Test description',
        project_id: 'test-project',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z',
        created_by: 'test-user',
        labels: '[]',
        dependencies: '[]',
        assignee: null,
        due_date: null,
        parent_id: null,
        estimated_hours: null,
        actual_hours: 0,
        completed_date: null
      };

      mockStateService.get.mockResolvedValue(dbRow);

      const result = await taskService.getTask('task-123');

      // Result should be the transformed object with proper types
      expect(result).toMatchObject({
        id: 'task-123',
        title: 'Test Task',
        status: 'pending',
        type: 'task',
        priority: 'medium',
        description: 'Test description',
        project_id: 'test-project',
        created_by: 'test-user',
        labels: [],
        dependencies: [],
        assignee: null,
        due_date: undefined,
        parent_id: null,
        estimated_hours: null,
        actual_hours: 0,
        completed_date: undefined
      });
      
      expect(result!.created_at).toBeInstanceOf(Date);
      expect(result!.updated_at).toBeInstanceOf(Date);
      
      expect(mockStateService.get).toHaveBeenCalledWith('SELECT * FROM tasks WHERE id = ?', ['task-123']);
    });

    it('should return null for non-existent task', async () => {
      mockStateService.get.mockResolvedValue(null);

      const result = await taskService.getTask('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('listTasks', () => {
    it('should list all tasks with default filters', async () => {
      const dbRows = [
        {
          id: 'task-1',
          title: 'Task 1',
          status: 'pending',
          type: 'task',
          priority: 'medium',
          description: '',
          project_id: 'test-project',
          created_at: '2024-01-15T10:00:00.000Z',
          updated_at: '2024-01-15T10:00:00.000Z',
          created_by: 'test-user',
          labels: '[]',
          dependencies: '[]',
          assignee: null,
          due_date: null,
          parent_id: null,
          estimated_hours: null,
          actual_hours: 0,
          completed_date: null
        },
        {
          id: 'task-2',
          title: 'Task 2',
          status: 'in_progress',
          type: 'task',
          priority: 'high',
          description: '',
          project_id: 'test-project',
          created_at: '2024-01-15T10:00:00.000Z',
          updated_at: '2024-01-15T10:00:00.000Z',
          created_by: 'test-user',
          labels: '[]',
          dependencies: '[]',
          assignee: null,
          due_date: null,
          parent_id: null,
          estimated_hours: null,
          actual_hours: 0,
          completed_date: null
        }
      ];

      mockStateService.all.mockResolvedValue(dbRows);

      const result = await taskService.listTasks();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'task-1',
        title: 'Task 1',
        status: 'pending'
      });
      expect(result[1]).toMatchObject({
        id: 'task-2',
        title: 'Task 2',
        status: 'in_progress'
      });
      
      expect(mockStateService.all).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM tasks ORDER BY created_at DESC'),
        []
      );
    });

    it('should filter tasks by status', async () => {
      const dbRows = [
        {
          id: 'task-1',
          title: 'Task 1',
          status: 'pending',
          type: 'task',
          priority: 'medium',
          description: '',
          project_id: 'test-project',
          created_at: '2024-01-15T10:00:00.000Z',
          updated_at: '2024-01-15T10:00:00.000Z',
          created_by: 'test-user',
          labels: '[]',
          dependencies: '[]',
          assignee: null,
          due_date: null,
          parent_id: null,
          estimated_hours: null,
          actual_hours: 0,
          completed_date: null
        }
      ];

      mockStateService.all.mockResolvedValue(dbRows);

      const result = await taskService.listTasks({ status: 'pending' });

      expect(result).toHaveLength(1);
      expect(result[0]?.status).toBe('pending');
      expect(mockStateService.all).toHaveBeenCalledWith(
        expect.stringContaining('status = ?'),
        ['pending']
      );
    });

    it('should filter tasks by assignee', async () => {
      const dbRows = [
        {
          id: 'task-1',
          title: 'Task 1',
          status: 'pending',
          type: 'task',
          priority: 'medium',
          description: '',
          project_id: 'test-project',
          created_at: '2024-01-15T10:00:00.000Z',
          updated_at: '2024-01-15T10:00:00.000Z',
          created_by: 'test-user',
          labels: '[]',
          dependencies: '[]',
          assignee: 'user1',
          due_date: null,
          parent_id: null,
          estimated_hours: null,
          actual_hours: 0,
          completed_date: null
        }
      ];

      mockStateService.all.mockResolvedValue(dbRows);

      const result = await taskService.listTasks({ assignee: 'user1' });

      expect(result).toHaveLength(1);
      expect(result[0]?.assignee).toBe('user1');
      expect(mockStateService.all).toHaveBeenCalledWith(
        expect.stringContaining('assignee = ?'),
        ['user1']
      );
    });

    it('should filter tasks by project', async () => {
      const dbRows = [
        {
          id: 'task-1',
          title: 'Task 1',
          status: 'pending',
          type: 'task',
          priority: 'medium',
          description: '',
          project_id: 'project-1',
          created_at: '2024-01-15T10:00:00.000Z',
          updated_at: '2024-01-15T10:00:00.000Z',
          created_by: 'test-user',
          labels: '[]',
          dependencies: '[]',
          assignee: null,
          due_date: null,
          parent_id: null,
          estimated_hours: null,
          actual_hours: 0,
          completed_date: null
        }
      ];

      mockStateService.all.mockResolvedValue(dbRows);

      const result = await taskService.listTasks({ project_id: 'project-1' });

      expect(result).toHaveLength(1);
      expect(result[0]?.project_id).toBe('project-1');
      expect(mockStateService.all).toHaveBeenCalledWith(
        expect.stringContaining('project_id = ?'),
        ['project-1']
      );
    });

    it('should apply limit and offset', async () => {
      const dbRows = [
        {
          id: 'task-3',
          title: 'Task 3',
          status: 'pending',
          type: 'task',
          priority: 'medium',
          description: '',
          project_id: 'test-project',
          created_at: '2024-01-15T10:00:00.000Z',
          updated_at: '2024-01-15T10:00:00.000Z',
          created_by: 'test-user',
          labels: '[]',
          dependencies: '[]',
          assignee: null,
          due_date: null,
          parent_id: null,
          estimated_hours: null,
          actual_hours: 0,
          completed_date: null
        },
        {
          id: 'task-4',
          title: 'Task 4',
          status: 'pending',
          type: 'task',
          priority: 'medium',
          description: '',
          project_id: 'test-project',
          created_at: '2024-01-15T10:00:00.000Z',
          updated_at: '2024-01-15T10:00:00.000Z',
          created_by: 'test-user',
          labels: '[]',
          dependencies: '[]',
          assignee: null,
          due_date: null,
          parent_id: null,
          estimated_hours: null,
          actual_hours: 0,
          completed_date: null
        }
      ];

      mockStateService.all.mockResolvedValue(dbRows);

      const result = await taskService.listTasks({}, 2, 2);

      expect(result).toHaveLength(2);
      expect(mockStateService.all).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT ? OFFSET ?'),
        expect.arrayContaining([2, 2])
      );
    });
  });

  describe('deleteTask', () => {
    it('should delete a task successfully', async () => {
      const taskId = 'task-123';
      const dbRow = {
        id: taskId,
        title: 'Test Task',
        status: 'pending',
        type: 'task',
        priority: 'medium',
        description: '',
        project_id: 'test-project',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z',
        created_by: 'test-user',
        labels: '[]',
        dependencies: '[]',
        assignee: null,
        due_date: null,
        parent_id: null,
        estimated_hours: null,
        actual_hours: 0,
        completed_date: null
      };

      mockStateService.get.mockResolvedValue(dbRow);
      mockStateService.all.mockResolvedValue([]); // No dependent tasks
      mockStateService.transaction.mockImplementation(async (callback) => {
        return await callback();
      });
      mockStateService.run.mockResolvedValue(undefined);

      await taskService.deleteTask(taskId);

      expect(mockStateService.all).toHaveBeenCalledWith(
        'SELECT task_id FROM task_dependencies WHERE depends_on = ?',
        [taskId]
      );
    });

    it('should throw error if task not found', async () => {
      mockStateService.get.mockResolvedValue(null);

      await expect(taskService.deleteTask('nonexistent'))
        .rejects.toThrow('Task not found');
    });

    it('should not delete task with dependencies', async () => {
      const taskId = 'task-123';
      const dbRow = {
        id: taskId,
        title: 'Test Task',
        status: 'pending',
        type: 'task',
        priority: 'medium',
        description: '',
        project_id: 'test-project',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z',
        created_by: 'test-user',
        labels: '[]',
        dependencies: '[]',
        assignee: null,
        due_date: null,
        parent_id: null,
        estimated_hours: null,
        actual_hours: 0,
        completed_date: null
      };

      mockStateService.get.mockResolvedValue(dbRow);
      mockStateService.all.mockResolvedValue([{ task_id: 'dependent-task' }]);

      await expect(taskService.deleteTask(taskId))
        .rejects.toThrow('Cannot delete task with dependencies');
    });
  });
});