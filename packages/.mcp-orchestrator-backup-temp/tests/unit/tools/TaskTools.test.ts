import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TaskTools } from '../../../src/tools/TaskTools';
import { TaskService } from '../../../src/services/TaskService';
import { Logger } from '../../../src/utils/Logger';
import { TaskType, Priority, TaskStatus } from '../../../src/types';
import { z } from 'zod';

describe('TaskTools', () => {
  let taskTools: TaskTools;
  let mockTaskService: jest.Mocked<TaskService>;
  let mockLogger: jest.Mocked<Logger>;

  // Mock task data
  const mockTask = {
    id: 'task-123',
    title: 'Test Task',
    type: 'task' as TaskType,
    status: 'pending' as TaskStatus,
    priority: 'medium' as Priority,
    project_id: 'test-project',
    created_by: 'mcp-user',
    created_at: new Date(),
    updated_at: new Date(),
    labels: [],
    dependencies: []
  };

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      log: jest.fn()
    } as unknown as jest.Mocked<Logger>;

    // Create mock TaskService
    mockTaskService = {
      createTask: jest.fn(),
      updateTaskStatus: jest.fn(),
      assignTask: jest.fn(),
      getTask: jest.fn(),
      listTasks: jest.fn(),
      getTaskStats: jest.fn(),
      addDependency: jest.fn(),
      initialize: jest.fn()
    } as unknown as jest.Mocked<TaskService>;

    // Create TaskTools instance
    taskTools = new TaskTools(mockTaskService, mockLogger);
  });

  describe('getTools', () => {
    it('should return exactly 4 tools', () => {
      const tools = taskTools.getTools();
      
      expect(tools).toHaveLength(4);
      expect(tools.map(t => t.name)).toEqual(['create', 'assign', 'status', 'depend']);
    });

    it('should have correct tool descriptions', () => {
      const tools = taskTools.getTools();
      
      expect(tools[0]?.description).toBe('Create a new task with UPP hierarchy support');
      expect(tools[1]?.description).toBe('Assign a task to an agent or person');
      expect(tools[2]?.description).toBe('Update or query task status');
      expect(tools[3]?.description).toBe('Add a dependency between tasks to control execution order');
    });

    it('should have valid input schemas', () => {
      const tools = taskTools.getTools();
      
      tools.forEach(tool => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema).toBeInstanceOf(z.ZodObject);
      });
    });

    it('should bind handlers correctly', () => {
      const tools = taskTools.getTools();
      
      tools.forEach(tool => {
        expect(tool.handler).toBeDefined();
        expect(typeof tool.handler).toBe('function');
      });
    });
  });

  describe('createTask', () => {
    const validInput = {
      title: 'Test Task',
      type: 'task',
      priority: 'medium',
      description: 'Test task description'
    };

    describe('input validation', () => {
      it('should accept valid input with required fields', async () => {
        mockTaskService.createTask.mockResolvedValue(mockTask);

        const result = await (taskTools as any).createTask({
          title: 'Test Task',
          type: 'task'
        });

        expect(result.metadata.status).toBe('success');
        expect(mockTaskService.createTask).toHaveBeenCalled();
      });

      it('should accept all optional fields', async () => {
        const fullInput = {
          ...validInput,
          parent_id: 'parent-123',
          assignee: 'BE-BACKEND-BENJAMIN',
          estimated_hours: 5,
          due_date: '2025-01-30T00:00:00Z',
          labels: ['backend', 'testing'],
          dependencies: ['dep-1', 'dep-2']
        };

        mockTaskService.createTask.mockResolvedValue({
          ...mockTask,
          ...fullInput,
          type: 'task' as TaskType,
          priority: 'medium' as Priority,
          due_date: new Date(fullInput.due_date)
        } as any);

        const result = await (taskTools as any).createTask(fullInput);

        expect(result.metadata.status).toBe('success');
        expect(mockTaskService.createTask).toHaveBeenCalledWith(
          expect.objectContaining({
            title: fullInput.title,
            type: fullInput.type,
            priority: fullInput.priority,
            description: fullInput.description,
            parent_id: fullInput.parent_id,
            assignee: fullInput.assignee,
            estimated_hours: fullInput.estimated_hours,
            due_date: fullInput.due_date,
            labels: fullInput.labels,
            dependencies: fullInput.dependencies
          }),
          'mcp-user'
        );
      });

      it('should reject missing required title', async () => {
        const result = await (taskTools as any).createTask({
          type: 'task'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Required');
        expect(mockTaskService.createTask).not.toHaveBeenCalled();
      });

      it('should reject missing required type', async () => {
        const result = await (taskTools as any).createTask({
          title: 'Test Task'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Required');
        expect(mockTaskService.createTask).not.toHaveBeenCalled();
      });

      it('should reject invalid type value', async () => {
        const result = await (taskTools as any).createTask({
          title: 'Test Task',
          type: 'invalid-type'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Invalid enum value');
        expect(mockTaskService.createTask).not.toHaveBeenCalled();
      });

      it('should reject invalid priority value', async () => {
        const result = await (taskTools as any).createTask({
          title: 'Test Task',
          type: 'task',
          priority: 'urgent'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Invalid enum value');
        expect(mockTaskService.createTask).not.toHaveBeenCalled();
      });

      it('should reject title longer than 200 characters', async () => {
        const result = await (taskTools as any).createTask({
          title: 'a'.repeat(201),
          type: 'task'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('String must contain at most 200 character');
        expect(mockTaskService.createTask).not.toHaveBeenCalled();
      });

      it('should reject description longer than 2000 characters', async () => {
        const result = await (taskTools as any).createTask({
          title: 'Test Task',
          type: 'task',
          description: 'a'.repeat(2001)
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('String must contain at most 2000 character');
        expect(mockTaskService.createTask).not.toHaveBeenCalled();
      });

      it('should default priority to medium', async () => {
        mockTaskService.createTask.mockResolvedValue(mockTask);

        await (taskTools as any).createTask({
          title: 'Test Task',
          type: 'task'
        });

        expect(mockTaskService.createTask).toHaveBeenCalledWith(
          expect.objectContaining({
            priority: 'medium'
          }),
          'mcp-user'
        );
      });
    });

    describe('service integration', () => {
      it('should create task successfully', async () => {
        mockTaskService.createTask.mockResolvedValue(mockTask);

        const result = await (taskTools as any).createTask(validInput);

        expect(result.title).toBe(`Task Created: ${mockTask.title}`);
        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data).toEqual({
          task_id: mockTask.id,
          type: mockTask.type,
          priority: mockTask.priority
        });
        expect(result.output).toContain('Task Created Successfully');
      });

      it('should include all task fields in output', async () => {
        const fullTask = {
          ...mockTask,
          description: 'Test description',
          assignee: 'BE-BACKEND-BENJAMIN',
          estimated_hours: 5,
          due_date: new Date('2025-01-30'),
          labels: ['backend', 'testing'],
          dependencies: ['dep-1', 'dep-2']
        };

        mockTaskService.createTask.mockResolvedValue(fullTask);

        const result = await (taskTools as any).createTask(validInput);

        expect(result.output).toContain('Test description');
        expect(result.output).toContain('BE-BACKEND-BENJAMIN');
        expect(result.output).toContain('5');
        expect(result.output).toContain('2025-01-30');
        expect(result.output).toContain('backend, testing');
        expect(result.output).toContain('dep-1, dep-2');
      });

      it('should handle service errors gracefully', async () => {
        mockTaskService.createTask.mockRejectedValue(new Error('Database connection failed'));

        const result = await (taskTools as any).createTask(validInput);

        expect(result.title).toBe('Task Creation Failed');
        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Database connection failed');
        expect(mockLogger.error).toHaveBeenCalled();
      });

      it('should track execution time', async () => {
        mockTaskService.createTask.mockResolvedValue(mockTask);

        const result = await (taskTools as any).createTask(validInput);

        expect(result.metadata.execution_time_ms).toBeDefined();
        expect(typeof result.metadata.execution_time_ms).toBe('number');
        expect(result.metadata.execution_time_ms).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('assignTask', () => {
    const validInput = {
      task_id: 'task-123',
      assignee: 'BE-BACKEND-BENJAMIN'
    };

    describe('input validation', () => {
      it('should accept valid input with required fields', async () => {
        mockTaskService.assignTask.mockResolvedValue(mockTask);

        const result = await (taskTools as any).assignTask(validInput);

        expect(result.metadata.status).toBe('success');
        expect(mockTaskService.assignTask).toHaveBeenCalled();
      });

      it('should accept all optional fields', async () => {
        const fullInput = {
          ...validInput,
          assignee_type: 'agent',
          priority: 'high',
          deadline: '2025-01-30T00:00:00Z',
          notes: 'Assignment notes'
        };

        mockTaskService.assignTask.mockResolvedValue({
          ...mockTask,
          assignee: fullInput.assignee,
          priority: fullInput.priority as Priority
        } as any);

        const result = await (taskTools as any).assignTask(fullInput);

        expect(result.metadata.status).toBe('success');
        expect(mockTaskService.assignTask).toHaveBeenCalledWith(
          validInput.task_id,
          validInput.assignee,
          expect.objectContaining({
            priority: 'high',
            deadline: '2025-01-30T00:00:00Z',
            notes: 'Assignment notes',
            assigneeType: 'agent'
          })
        );
      });

      it('should reject missing task_id', async () => {
        const result = await (taskTools as any).assignTask({
          assignee: 'BE-BACKEND-BENJAMIN'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Required');
        expect(mockTaskService.assignTask).not.toHaveBeenCalled();
      });

      it('should reject missing assignee', async () => {
        const result = await (taskTools as any).assignTask({
          task_id: 'task-123'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Required');
        expect(mockTaskService.assignTask).not.toHaveBeenCalled();
      });

      it('should reject invalid assignee_type', async () => {
        const result = await (taskTools as any).assignTask({
          ...validInput,
          assignee_type: 'invalid'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Invalid enum value');
        expect(mockTaskService.assignTask).not.toHaveBeenCalled();
      });

      it('should default assignee_type to agent', async () => {
        mockTaskService.assignTask.mockResolvedValue(mockTask);

        await (taskTools as any).assignTask(validInput);

        expect(mockTaskService.assignTask).toHaveBeenCalledWith(
          validInput.task_id,
          validInput.assignee,
          expect.objectContaining({
            assigneeType: 'agent'
          })
        );
      });

      it('should validate agent name format in error message', async () => {
        mockTaskService.assignTask.mockRejectedValue(new Error('Invalid agent name format'));

        const result = await (taskTools as any).assignTask(validInput);

        expect(result.output).toContain('DOMAIN-ROLE-NAME');
        expect(result.output).toContain('BE-BACKEND-BENJAMIN');
      });
    });

    describe('service integration', () => {
      it('should assign task successfully', async () => {
        const updatedTask = {
          ...mockTask,
          assignee: validInput.assignee,
          status: 'in_progress' as TaskStatus
        };

        mockTaskService.assignTask.mockResolvedValue(updatedTask as any);

        const result = await (taskTools as any).assignTask(validInput);

        expect(result.title).toBe(`Task Assigned: ${updatedTask.title}`);
        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data).toEqual({
          task_id: updatedTask.id,
          assignee: validInput.assignee,
          assignee_type: 'agent',
          priority_override: undefined,
          deadline: undefined
        });
        expect(result.output).toContain('Task Assignment Complete');
      });

      it('should handle priority override', async () => {
        const updatedTask = {
          ...mockTask,
          assignee: validInput.assignee,
          priority: 'high' as Priority
        };

        mockTaskService.assignTask.mockResolvedValue(updatedTask as any);

        const result = await (taskTools as any).assignTask({
          ...validInput,
          priority: 'high'
        });

        expect(result.output).toContain('(overridden)');
        expect(result.metadata.data.priority_override).toBe('high');
      });

      it('should handle deadline update', async () => {
        const updatedTask = {
          ...mockTask,
          assignee: validInput.assignee,
          due_date: new Date('2025-01-30')
        };

        mockTaskService.assignTask.mockResolvedValue(updatedTask as any);

        const result = await (taskTools as any).assignTask({
          ...validInput,
          deadline: '2025-01-30T00:00:00Z'
        });

        expect(result.output).toContain('2025-01-30');
        expect(result.output).toContain('(updated)');
      });

      it('should include assignment notes in output', async () => {
        mockTaskService.assignTask.mockResolvedValue(mockTask);

        const result = await (taskTools as any).assignTask({
          ...validInput,
          notes: 'Please prioritize this task'
        });

        expect(result.output).toContain('Assignment Notes');
        expect(result.output).toContain('Please prioritize this task');
      });

      it('should provide helpful error for non-existent task', async () => {
        mockTaskService.assignTask.mockRejectedValue(new Error('Task not found'));

        const result = await (taskTools as any).assignTask(validInput);

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('verify the task ID exists');
        expect(result.output).toContain('status tool to list available tasks');
      });

      it('should provide helpful error for invalid deadline format', async () => {
        const result = await (taskTools as any).assignTask({
          ...validInput,
          deadline: 'tomorrow' // This will fail Zod validation
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Invalid datetime');
        expect(mockTaskService.assignTask).not.toHaveBeenCalled();
      });
    });
  });

  describe('taskStatus', () => {
    describe('update status mode', () => {
      const updateInput = {
        task_id: 'task-123',
        status: 'in_progress',
        notes: 'Started working on task'
      };

      it('should update task status successfully', async () => {
        const updatedTask = {
          ...mockTask,
          status: 'in_progress' as TaskStatus
        };

        mockTaskService.updateTaskStatus.mockResolvedValue(updatedTask as any);

        const result = await (taskTools as any).taskStatus(updateInput);

        expect(result.title).toBe(`Task Status Updated: ${updatedTask.title}`);
        expect(result.metadata.operation).toBe('task_status_update');
        expect(result.metadata.status).toBe('success');
        expect(result.output).toContain('Task Status Updated');
        expect(result.output).toContain('in_progress');
      });

      it('should include notes in output when provided', async () => {
        mockTaskService.updateTaskStatus.mockResolvedValue(mockTask);

        const result = await (taskTools as any).taskStatus(updateInput);

        expect(result.output).toContain('Started working on task');
      });

      it('should validate status values', async () => {
        const result = await (taskTools as any).taskStatus({
          task_id: 'task-123',
          status: 'invalid-status'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Invalid enum value');
        expect(mockTaskService.updateTaskStatus).not.toHaveBeenCalled();
      });
    });

    describe('query status mode', () => {
      it('should get task status successfully', async () => {
        mockTaskService.getTask.mockResolvedValue(mockTask);

        const result = await (taskTools as any).taskStatus({
          task_id: 'task-123'
        });

        expect(result.title).toBe(`Task Status: ${mockTask.title}`);
        expect(result.metadata.operation).toBe('task_status_query');
        expect(result.metadata.status).toBe('success');
        expect(result.output).toContain('Task Details');
        expect(mockTaskService.getTask).toHaveBeenCalledWith('task-123');
      });

      it('should handle non-existent task', async () => {
        mockTaskService.getTask.mockResolvedValue(null);

        const result = await (taskTools as any).taskStatus({
          task_id: 'non-existent'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Task not found');
      });
    });

    describe('list mode', () => {
      const mockStats = {
        total: 10,
        by_status: {
          pending: 3,
          in_progress: 2,
          blocked: 0,
          completed: 5,
          cancelled: 0
        },
        by_priority: {
          low: 2,
          medium: 5,
          high: 3,
          critical: 0
        },
        by_type: {
          epic: 1,
          feature: 2,
          story: 2,
          task: 3,
          subtask: 2,
          atomic: 0
        }
      };

      it('should list tasks with no filter', async () => {
        const tasks = [mockTask];
        mockTaskService.listTasks.mockResolvedValue(tasks);
        mockTaskService.getTaskStats.mockResolvedValue(mockStats);

        const result = await (taskTools as any).taskStatus({});

        expect(result.title).toBe('Task Status Overview');
        expect(result.metadata.operation).toBe('task_status_list');
        expect(result.metadata.status).toBe('success');
        expect(result.output).toContain('Total Tasks**: 10');
        expect(mockTaskService.listTasks).toHaveBeenCalledWith(undefined, 20);
      });

      it('should apply filters when listing', async () => {
        const filter = {
          assignee: 'BE-BACKEND-BENJAMIN',
          status: 'pending' as TaskStatus,
          priority: 'high' as Priority
        };

        mockTaskService.listTasks.mockResolvedValue([]);
        mockTaskService.getTaskStats.mockResolvedValue(mockStats);

        await (taskTools as any).taskStatus({ filter });

        expect(mockTaskService.listTasks).toHaveBeenCalledWith(filter, 20);
      });

      it('should format task list in table', async () => {
        const tasks = [
          {
            ...mockTask,
            id: 'task-1',
            title: 'Very long task title that should be truncated in the output'
          },
          {
            ...mockTask,
            id: 'task-2',
            title: 'Short title',
            assignee: 'FE-FRONTEND-FIONA'
          }
        ];

        mockTaskService.listTasks.mockResolvedValue(tasks);
        mockTaskService.getTaskStats.mockResolvedValue(mockStats);

        const result = await (taskTools as any).taskStatus({});

        expect(result.output).toContain('| ID | Title | Status | Priority | Assignee |');
        expect(result.output).toContain('task-1');
        expect(result.output).toContain('Very long task title that shou...');
        expect(result.output).toContain('Unassigned');
        expect(result.output).toContain('FE-FRONTEND-FIONA');
      });
    });
  });

  describe('addTaskDependency', () => {
    const validInput = {
      task_id: 'task-1',
      depends_on_task_id: 'task-2',
      dependency_type: 'blocks',
      strict: true
    };

    const mockDependency = {
      id: 'dep-123',
      task_id: 'task-1',
      depends_on_task_id: 'task-2',
      dependency_type: 'blocks' as 'blocks' | 'depends_on',
      strict: true,
      created_at: new Date()
    };

    describe('input validation', () => {
      it('should accept valid input with required fields', async () => {
        mockTaskService.addDependency.mockResolvedValue(mockDependency as any);
        mockTaskService.getTask.mockResolvedValue(mockTask);

        const result = await (taskTools as any).addTaskDependency({
          task_id: 'task-1',
          depends_on_task_id: 'task-2'
        });

        expect(result.metadata.status).toBe('success');
        expect(mockTaskService.addDependency).toHaveBeenCalled();
      });

      it('should accept all optional fields', async () => {
        const fullInput = {
          ...validInput,
          notes: 'This blocks the frontend work'
        };

        mockTaskService.addDependency.mockResolvedValue(mockDependency as any);
        mockTaskService.getTask.mockResolvedValue(mockTask);

        const result = await (taskTools as any).addTaskDependency(fullInput);

        expect(result.metadata.status).toBe('success');
        expect(mockTaskService.addDependency).toHaveBeenCalledWith(
          'task-1',
          'task-2',
          expect.objectContaining({
            type: 'blocks',
            strict: true,
            createdBy: 'mcp-user',
            notes: 'This blocks the frontend work'
          })
        );
      });

      it('should reject missing task_id', async () => {
        const result = await (taskTools as any).addTaskDependency({
          depends_on_task_id: 'task-2'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Required');
        expect(mockTaskService.addDependency).not.toHaveBeenCalled();
      });

      it('should reject missing depends_on_task_id', async () => {
        const result = await (taskTools as any).addTaskDependency({
          task_id: 'task-1'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Required');
        expect(mockTaskService.addDependency).not.toHaveBeenCalled();
      });

      it('should default dependency_type to blocks', async () => {
        mockTaskService.addDependency.mockResolvedValue(mockDependency as any);
        mockTaskService.getTask.mockResolvedValue(mockTask);

        await (taskTools as any).addTaskDependency({
          task_id: 'task-1',
          depends_on_task_id: 'task-2'
        });

        expect(mockTaskService.addDependency).toHaveBeenCalledWith(
          'task-1',
          'task-2',
          expect.objectContaining({
            type: 'blocks'
          })
        );
      });

      it('should default strict to true', async () => {
        mockTaskService.addDependency.mockResolvedValue(mockDependency as any);
        mockTaskService.getTask.mockResolvedValue(mockTask);

        await (taskTools as any).addTaskDependency({
          task_id: 'task-1',
          depends_on_task_id: 'task-2'
        });

        expect(mockTaskService.addDependency).toHaveBeenCalledWith(
          'task-1',
          'task-2',
          expect.objectContaining({
            strict: true
          })
        );
      });
    });

    describe('service integration', () => {
      it('should create dependency successfully', async () => {
        const task1 = { ...mockTask, id: 'task-1', title: 'Backend API' };
        const task2 = { ...mockTask, id: 'task-2', title: 'Frontend UI' };

        mockTaskService.addDependency.mockResolvedValue(mockDependency as any);
        mockTaskService.getTask
          .mockResolvedValueOnce(task1)
          .mockResolvedValueOnce(task2);

        const result = await (taskTools as any).addTaskDependency(validInput);

        expect(result.title).toContain('Dependency Created');
        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data).toEqual({
          dependency_id: mockDependency.id,
          task_id: 'task-1',
          depends_on_task_id: 'task-2',
          dependency_type: 'blocks',
          strict: true
        });
        expect(result.output).toContain('Backend API');
        expect(result.output).toContain('Frontend UI');
        expect(result.output).toContain('will block');
      });

      it('should handle depends_on type correctly', async () => {
        mockTaskService.addDependency.mockResolvedValue({
          ...mockDependency,
          dependency_type: 'depends_on' as 'blocks' | 'depends_on'
        } as any);
        mockTaskService.getTask.mockResolvedValue(mockTask);

        const result = await (taskTools as any).addTaskDependency({
          ...validInput,
          dependency_type: 'depends_on'
        });

        expect(result.output).toContain('depends on');
        expect(result.output).not.toContain('will block');
      });

      it('should handle circular dependency error', async () => {
        mockTaskService.addDependency.mockRejectedValue(new Error('Circular dependency detected'));

        const result = await (taskTools as any).addTaskDependency(validInput);

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('circular dependency was detected');
        expect(result.output).toContain('impossible execution order');
      });

      it('should handle completed task dependency error', async () => {
        mockTaskService.addDependency.mockRejectedValue(new Error('Cannot depend on completed task'));

        const result = await (taskTools as any).addTaskDependency(validInput);

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('already completed');
        expect(result.output).toContain('strict=false');
      });

      it('should handle cancelled task dependency error', async () => {
        mockTaskService.addDependency.mockRejectedValue(new Error('Cannot depend on cancelled task'));

        const result = await (taskTools as any).addTaskDependency(validInput);

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('cancelled');
        expect(result.output).toContain('cannot be used as a dependency');
      });

      it('should handle duplicate dependency error', async () => {
        mockTaskService.addDependency.mockRejectedValue(new Error('Dependency already exists'));

        const result = await (taskTools as any).addTaskDependency(validInput);

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('already exists');
      });

      it('should handle self-dependency error', async () => {
        mockTaskService.addDependency.mockRejectedValue(new Error('Task cannot depend on itself'));

        const result = await (taskTools as any).addTaskDependency({
          task_id: 'task-1',
          depends_on_task_id: 'task-1'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('cannot depend on itself');
      });
    });
  });

  describe('error handling', () => {
    it('should log errors with context', async () => {
      const error = new Error('Test error');
      mockTaskService.createTask.mockRejectedValue(error);

      await (taskTools as any).createTask({ title: 'Test', type: 'task' });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create task',
        error,
        { args: { title: 'Test', type: 'task' } }
      );
    });

    it('should include timestamp in all responses', async () => {
      mockTaskService.createTask.mockResolvedValue(mockTask);

      const result = await (taskTools as any).createTask({
        title: 'Test',
        type: 'task'
      });

      expect(result.metadata.timestamp).toBeDefined();
      expect(new Date(result.metadata.timestamp).toISOString()).toBe(result.metadata.timestamp);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined notes field correctly', async () => {
      const mockDependency = {
        id: 'dep-123',
        task_id: 'task-1',
        depends_on_task_id: 'task-2',
        dependency_type: 'blocks' as 'blocks' | 'depends_on',
        strict: true,
        created_at: new Date()
      };
      mockTaskService.addDependency.mockResolvedValue(mockDependency as any);
      mockTaskService.getTask.mockResolvedValue(mockTask);

      const result = await (taskTools as any).addTaskDependency({
        task_id: 'task-1',
        depends_on_task_id: 'task-2',
        notes: undefined
      });

      expect(result.metadata.status).toBe('success');
      expect(mockTaskService.addDependency).toHaveBeenCalledWith(
        'task-1',
        'task-2',
        expect.not.objectContaining({
          notes: expect.anything()
        })
      );
    });

    it('should handle tasks with missing titles gracefully', async () => {
      const mockDependency = {
        id: 'dep-123',
        task_id: 'task-1',
        depends_on_task_id: 'task-2',
        dependency_type: 'blocks' as 'blocks' | 'depends_on',
        strict: true,
        created_at: new Date()
      };
      mockTaskService.addDependency.mockResolvedValue(mockDependency as any);
      mockTaskService.getTask.mockResolvedValue(null);

      const result = await (taskTools as any).addTaskDependency({
        task_id: 'task-1',
        depends_on_task_id: 'task-2'
      });

      expect(result.metadata.status).toBe('success');
      expect(result.output).toContain('task-1');
      expect(result.output).toContain('task-2');
    });

    it('should handle very long task lists', async () => {
      const manyTasks = Array.from({ length: 20 }, (_, i) => ({
        ...mockTask,
        id: `task-${i}`,
        title: `Task ${i}`
      }));

      mockTaskService.listTasks.mockResolvedValue(manyTasks);
      mockTaskService.getTaskStats.mockResolvedValue({
        total: 20,
        by_status: {
          pending: 5,
          in_progress: 5,
          blocked: 2,
          completed: 6,
          cancelled: 2
        },
        by_priority: {
          low: 5,
          medium: 10,
          high: 4,
          critical: 1
        },
        by_type: {
          epic: 1,
          feature: 3,
          story: 5,
          task: 8,
          subtask: 3,
          atomic: 0
        }
      } as any);

      const result = await (taskTools as any).taskStatus({});

      // Should only show first 10 tasks
      expect(result.output.match(/task-/g)?.length).toBe(10);
    });
  });
});