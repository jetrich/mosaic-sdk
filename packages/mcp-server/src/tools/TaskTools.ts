import { z } from 'zod';
import { MCPTool, ToolResponse, ValidationError, Priority } from '../types';
import { TaskService } from '../services/TaskService';
import { Logger } from '../utils/Logger';
import { zodToJsonSchema } from '../utils/zodToJsonSchema';

// Input schemas
const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['epic', 'feature', 'story', 'task', 'subtask', 'atomic']),
  parent_id: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  assignee: z.string().optional(),
  estimated_hours: z.number().min(0).optional(),
  due_date: z.string().datetime().optional(),
  labels: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional()
});

const AssignTaskSchema = z.object({
  task_id: z.string().min(1),
  assignee: z.string().min(1),
  assignee_type: z.enum(['agent', 'human', 'team']).default('agent'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  deadline: z.string().datetime().optional(),
  notes: z.string().max(1000).optional()
});

const TaskStatusSchema = z.object({
  task_id: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'blocked', 'completed', 'cancelled']).optional(),
  progress_percent: z.number().min(0).max(100).optional(),
  notes: z.string().max(1000).optional(),
  filter: z.object({
    assignee: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'blocked', 'completed', 'cancelled']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    due_before: z.string().datetime().optional()
  }).optional()
});

const TaskDependencySchema = z.object({
  task_id: z.string().min(1),
  depends_on_task_id: z.string().min(1),
  dependency_type: z.enum(['blocks', 'depends_on']).default('blocks'),
  strict: z.boolean().default(true),
  notes: z.string().max(500).optional()
});

export class TaskTools {
  private taskService: TaskService;
  private logger: Logger;

  constructor(taskService: TaskService, logger: Logger) {
    this.taskService = taskService;
    this.logger = logger;
  }

  getTools(): MCPTool[] {
    return [
      {
        name: 'create',
        description: 'Create a new task with UPP hierarchy support',
        inputSchema: zodToJsonSchema(CreateTaskSchema),
        handler: this.createTask.bind(this)
      },
      {
        name: 'assign',
        description: 'Assign a task to an agent or person',
        inputSchema: zodToJsonSchema(AssignTaskSchema),
        handler: this.assignTask.bind(this)
      },
      {
        name: 'status',
        description: 'Update or query task status',
        inputSchema: zodToJsonSchema(TaskStatusSchema),
        handler: this.taskStatus.bind(this)
      },
      {
        name: 'depend',
        description: 'Add a dependency between tasks to control execution order',
        inputSchema: zodToJsonSchema(TaskDependencySchema),
        handler: this.addTaskDependency.bind(this)
      }
    ];
  }

  private async createTask(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      // Validate input
      const input = CreateTaskSchema.parse(args);
      
      this.logger.info('Creating task', { title: input.title, type: input.type });

      // Create the task
      const task = await this.taskService.createTask(input, 'mcp-user');

      const output = this.formatTaskCreationOutput(task);

      return {
        title: `Task Created: ${task.title}`,
        metadata: {
          operation: 'task_create',
          status: 'success',
          data: {
            task_id: task.id,
            type: task.type,
            priority: task.priority
          },
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output
      };

    } catch (error) {
      this.logger.error('Failed to create task', error, { args });
      
      return {
        title: 'Task Creation Failed',
        metadata: {
          operation: 'task_create',
          status: 'error',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: `**Error**: ${(error as Error).message}\n\nPlease check your input and try again.`
      };
    }
  }

  private async assignTask(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const input = AssignTaskSchema.parse(args);
      
      this.logger.info('Assigning task', { task_id: input.task_id, assignee: input.assignee });

      // Call the enhanced assignTask method with all options
      const options: {
        priority?: Priority;
        deadline?: string;
        notes?: string;
        assigneeType?: 'agent' | 'human' | 'team';
      } = {};
      
      if (input.priority !== undefined) options.priority = input.priority;
      if (input.deadline !== undefined) options.deadline = input.deadline;
      if (input.notes !== undefined) options.notes = input.notes;
      if (input.assignee_type !== undefined) options.assigneeType = input.assignee_type;
      
      const updatedTask = await this.taskService.assignTask(
        input.task_id, 
        input.assignee,
        options
      );

      // Format the output with all relevant information
      const output = `## Task Assignment Complete

**Task**: ${updatedTask.title} (${updatedTask.id})  
**Assigned to**: ${input.assignee} (${input.assignee_type})  
**Priority**: ${updatedTask.priority}${input.priority ? ' (overridden)' : ''}  
**Status**: ${updatedTask.status}
${updatedTask.due_date ? `**Deadline**: ${updatedTask.due_date.toISOString().split('T')[0]}${input.deadline ? ' (updated)' : ''}` : ''}

${input.notes ? `### Assignment Notes\n${input.notes}` : ''}

The task has been successfully assigned and is ready for work.`;

      return {
        title: `Task Assigned: ${updatedTask.title}`,
        metadata: {
          operation: 'task_assign',
          status: 'success',
          data: {
            task_id: updatedTask.id,
            assignee: input.assignee,
            assignee_type: input.assignee_type,
            priority_override: input.priority,
            deadline: input.deadline
          },
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output
      };

    } catch (error) {
      this.logger.error('Failed to assign task', error, { args });
      
      // Provide helpful error messages based on the error type
      const errorObj = error as Error;
      let errorMessage = errorObj.message || 'Unknown error occurred';
      
      if (errorMessage.includes('Invalid agent name format')) {
        errorMessage += '\n\nAgent names must follow the pattern: DOMAIN-ROLE-NAME (e.g., BE-BACKEND-BENJAMIN)';
      } else if (errorMessage.includes('Task not found')) {
        errorMessage += '\n\nPlease verify the task ID exists. You can use the status tool to list available tasks.';
      } else if (errorMessage.includes('Invalid deadline date format')) {
        errorMessage += '\n\nDeadline must be in ISO 8601 format (e.g., 2025-01-30T00:00:00Z)';
      }
      
      return {
        title: 'Task Assignment Failed',
        metadata: {
          operation: 'task_assign',
          status: 'error',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: `**Error**: ${errorMessage}`
      };
    }
  }

  private async taskStatus(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const input = TaskStatusSchema.parse(args);

      // If task_id is provided, update/get specific task
      if (input.task_id) {
        if (input.status) {
          // Update task status
          const updatedTask = await this.taskService.updateTaskStatus(input.task_id, input.status, input.notes);
          
          const output = `## Task Status Updated

**Task**: ${updatedTask.title} (${updatedTask.id})  
**Status**: ${updatedTask.status}  
**Priority**: ${updatedTask.priority}  
**Last Updated**: ${updatedTask.updated_at.toISOString()}

${input.notes ? `**Notes**: ${input.notes}` : ''}

The task status has been successfully updated.`;

          return {
            title: `Task Status Updated: ${updatedTask.title}`,
            metadata: {
              operation: 'task_status_update',
              status: 'success',
              data: {
                task_id: updatedTask.id,
                new_status: updatedTask.status
              },
              timestamp: new Date().toISOString(),
              execution_time_ms: Date.now() - startTime
            },
            output
          };
        } else {
          // Get task status
          const task = await this.taskService.getTask(input.task_id);
          if (!task) {
            throw new ValidationError(`Task not found: ${input.task_id}`);
          }

          const output = this.formatTaskDetails(task);

          return {
            title: `Task Status: ${task.title}`,
            metadata: {
              operation: 'task_status_query',
              status: 'success',
              data: {
                task_id: task.id,
                current_status: task.status
              },
              timestamp: new Date().toISOString(),
              execution_time_ms: Date.now() - startTime
            },
            output
          };
        }
      } else {
        // List tasks with filter
        const tasks = await this.taskService.listTasks(input.filter, 20);
        const stats = await this.taskService.getTaskStats();

        const output = this.formatTaskList(tasks, stats);

        return {
          title: 'Task Status Overview',
          metadata: {
            operation: 'task_status_list',
            status: 'success',
            data: {
              task_count: tasks.length,
              total_tasks: stats.total
            },
            timestamp: new Date().toISOString(),
            execution_time_ms: Date.now() - startTime
          },
          output
        };
      }

    } catch (error) {
      this.logger.error('Failed to process task status', error, { args });
      
      return {
        title: 'Task Status Operation Failed',
        metadata: {
          operation: 'task_status',
          status: 'error',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: `**Error**: ${(error as Error).message}\n\nPlease check your input and try again.`
      };
    }
  }

  private async addTaskDependency(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const input = TaskDependencySchema.parse(args);
      
      this.logger.info('Adding task dependency', { 
        task_id: input.task_id, 
        depends_on_task_id: input.depends_on_task_id,
        dependency_type: input.dependency_type 
      });

      // Call the new addDependency method
      const dependency = await this.taskService.addDependency(
        input.task_id, 
        input.depends_on_task_id,
        {
          type: input.dependency_type,
          strict: input.strict,
          createdBy: 'mcp-user',
          ...(input.notes !== undefined && { notes: input.notes })
        }
      );

      // Get task details for better output
      const [task, dependsOnTask] = await Promise.all([
        this.taskService.getTask(input.task_id),
        this.taskService.getTask(input.depends_on_task_id)
      ]);

      const output = `## Task Dependency Created

**Task**: ${task?.title || input.task_id} (${input.task_id})  
**${input.dependency_type === 'blocks' ? 'Blocks' : 'Depends on'}**: ${dependsOnTask?.title || input.depends_on_task_id} (${input.depends_on_task_id})  
**Dependency Type**: ${input.dependency_type}  
**Strict Mode**: ${input.strict ? 'Enabled' : 'Disabled'}  
${input.notes ? `**Notes**: ${input.notes}` : ''}

The dependency has been successfully created. ${
  input.dependency_type === 'blocks' 
    ? `Task "${task?.title}" will block "${dependsOnTask?.title}" until completed.`
    : `Task "${task?.title}" now depends on "${dependsOnTask?.title}".`
}`;

      return {
        title: `Dependency Created: ${task?.title || input.task_id} ${input.dependency_type} ${dependsOnTask?.title || input.depends_on_task_id}`,
        metadata: {
          operation: 'task_dependency_add',
          status: 'success',
          data: {
            dependency_id: dependency.id,
            task_id: input.task_id,
            depends_on_task_id: input.depends_on_task_id,
            dependency_type: input.dependency_type,
            strict: input.strict
          },
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output
      };

    } catch (error) {
      this.logger.error('Failed to add task dependency', error as Error, { args });
      
      // Provide helpful error messages based on the error type
      const errorObj = error as Error;
      let errorMessage = errorObj.message || 'Unknown error occurred';
      let helpText = '';
      
      if (errorMessage.includes('Task not found')) {
        helpText = '\n\nPlease verify both task IDs exist. You can use the status tool to list available tasks.';
      } else if (errorMessage.includes('Circular dependency detected')) {
        helpText = '\n\nA circular dependency was detected. This would create an impossible execution order where tasks depend on each other in a cycle.';
      } else if (errorMessage.includes('Cannot depend on completed task')) {
        helpText = '\n\nThe target task is already completed. Set strict=false to allow dependencies on completed tasks.';
      } else if (errorMessage.includes('Cannot depend on cancelled task')) {
        helpText = '\n\nThe target task has been cancelled and cannot be used as a dependency.';
      } else if (errorMessage.includes('Dependency already exists')) {
        helpText = '\n\nThis dependency relationship already exists between these two tasks.';
      } else if (errorMessage.includes('Task cannot depend on itself')) {
        helpText = '\n\nA task cannot depend on itself. Please specify a different task ID.';
      }
      
      return {
        title: 'Task Dependency Creation Failed',
        metadata: {
          operation: 'task_dependency_add',
          status: 'error',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: `**Error**: ${errorMessage}${helpText}`
      };
    }
  }

  private formatTaskCreationOutput(task: any): string {
    return `## Task Created Successfully

**Task ID**: ${task.id}  
**Title**: ${task.title}  
**Type**: ${task.type}  
**Priority**: ${task.priority}  
**Status**: ${task.status}  
**Project**: ${task.project_id}

${task.description ? `**Description**: ${task.description}` : ''}
${task.assignee ? `**Assigned to**: ${task.assignee}` : ''}
${task.estimated_hours ? `**Estimated Hours**: ${task.estimated_hours}` : ''}
${task.due_date ? `**Due Date**: ${task.due_date.toISOString().split('T')[0]}` : ''}
${task.labels.length > 0 ? `**Labels**: ${task.labels.join(', ')}` : ''}
${task.dependencies.length > 0 ? `**Dependencies**: ${task.dependencies.join(', ')}` : ''}

**Created**: ${task.created_at.toISOString()}  
**Created By**: ${task.created_by}

The task has been successfully created and is ready for assignment or further planning.`;
  }

  private formatTaskDetails(task: any): string {
    return `## Task Details

**Task ID**: ${task.id}  
**Title**: ${task.title}  
**Type**: ${task.type}  
**Status**: ${task.status}  
**Priority**: ${task.priority}  
**Project**: ${task.project_id}

${task.description ? `**Description**: ${task.description}` : ''}
${task.assignee ? `**Assigned to**: ${task.assignee}` : ''}
${task.estimated_hours ? `**Estimated Hours**: ${task.estimated_hours}` : ''}
${task.actual_hours ? `**Actual Hours**: ${task.actual_hours}` : ''}
${task.due_date ? `**Due Date**: ${task.due_date.toISOString().split('T')[0]}` : ''}
${task.completed_date ? `**Completed**: ${task.completed_date.toISOString().split('T')[0]}` : ''}
${task.labels.length > 0 ? `**Labels**: ${task.labels.join(', ')}` : ''}
${task.dependencies.length > 0 ? `**Dependencies**: ${task.dependencies.join(', ')}` : ''}

**Created**: ${task.created_at.toISOString()}  
**Last Updated**: ${task.updated_at.toISOString()}  
**Created By**: ${task.created_by}`;
  }

  private formatTaskList(tasks: any[], stats: any): string {
    let output = `## Task Status Overview

**Total Tasks**: ${stats.total}

### Status Breakdown
`;

    Object.entries(stats.by_status).forEach(([status, count]) => {
      output += `- **${status}**: ${count}\n`;
    });

    output += `\n### Priority Breakdown
`;

    Object.entries(stats.by_priority).forEach(([priority, count]) => {
      output += `- **${priority}**: ${count}\n`;
    });

    if (tasks.length > 0) {
      output += `\n### Recent Tasks (${tasks.length} shown)

| ID | Title | Status | Priority | Assignee |
|---|---|---|---|---|
`;

      tasks.slice(0, 10).forEach(task => {
        output += `| ${task.id} | ${task.title.substring(0, 30)}${task.title.length > 30 ? '...' : ''} | ${task.status} | ${task.priority} | ${task.assignee || 'Unassigned'} |\n`;
      });
    }

    return output;
  }
}