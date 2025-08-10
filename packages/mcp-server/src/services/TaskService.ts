import { v4 as uuidv4 } from 'uuid';
import { MCPServerConfig, Task, TaskType, TaskStatus, Priority, DatabaseError, ValidationError, TaskDependency } from '../types';
import { Logger } from '../utils/Logger';
import { StateService } from './StateService';
import { IdGenerationService, TaskLevel, IdGenerationContext } from './IdGenerationService';

interface CreateTaskInput {
  title: string;
  description?: string | undefined;
  type: TaskType;
  parent_id?: string | undefined;
  priority?: Priority;
  assignee?: string | undefined;
  estimated_hours?: number | undefined;
  due_date?: string | undefined;
  labels?: string[] | undefined;
  dependencies?: string[] | undefined;
  project_id?: string | undefined;
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assignee?: string;
  estimated_hours?: number;
  actual_hours?: number;
  due_date?: string;
  completed_date?: string;
  labels?: string[];
}

interface TaskFilter {
  assignee?: string | undefined;
  status?: TaskStatus | undefined;
  priority?: Priority | undefined;
  type?: TaskType | undefined;
  project_id?: string | undefined;
  due_before?: string | undefined;
  created_after?: string | undefined;
}

export class TaskService {
  private logger: Logger;
  protected stateService: StateService;
  private idGenerationService: IdGenerationService;
  private currentProjectId: string = 'default';

  constructor(config: MCPServerConfig, logger: Logger) {
    // Config passed but not stored as it's not used in this service
    this.logger = logger;
    this.stateService = new StateService(config, logger);
    this.idGenerationService = new IdGenerationService(this.stateService, logger);
  }

  async initialize(): Promise<void> {
    await this.stateService.initialize();
    
    // Ensure default project exists
    await this.ensureDefaultProject();
  }

  private async ensureDefaultProject(): Promise<void> {
    const exists = await this.stateService.exists('projects', 'default');
    if (!exists) {
      await this.stateService.insert('projects', {
        id: 'default',
        name: 'Default Project',
        description: 'Default project for tasks without a specific project',
        status: 'active',
        owner: 'system',
        team_members: this.stateService.stringifyJsonColumn([]),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        config: this.stateService.stringifyJsonColumn({
          default_agent_model: 'claude-3-5-sonnet',
          max_concurrent_agents: 5,
          task_auto_assignment: false,
          notification_preferences: {
            email_enabled: false,
            slack_enabled: false,
            task_updates: false,
            agent_alerts: false
          }
        }),
        stats: this.stateService.stringifyJsonColumn({
          total_tasks: 0,
          completed_tasks: 0,
          active_agents: 0,
          total_hours_spent: 0,
          completion_rate: 0
        })
      });
    }
  }

  async createTask(input: CreateTaskInput, createdBy: string = 'system'): Promise<Task> {
    try {
      this.validateCreateTaskInput(input);

      // Create context for ID generation
      const idContext: IdGenerationContext = {
        level: this.mapTaskTypeToLevel(input.type),
        parentId: input.parent_id,
        projectId: input.project_id || this.currentProjectId,
        title: input.title,
        description: input.description
      };

      const taskId = await this.generateTaskId(idContext);
      const now = new Date().toISOString();

      // Extract domain category from the generated ID  
      const parsedId = this.idGenerationService.parseId(taskId);
      const domainCategory = parsedId.domain;
      const hierarchicalId = taskId; // Use the new ID as the hierarchical display ID

      // Validate parent task if specified
      if (input.parent_id) {
        const parentExists = await this.stateService.exists('tasks', input.parent_id);
        if (!parentExists) {
          throw new ValidationError(`Parent task not found: ${input.parent_id}`);
        }
      }

      const task: Task = {
        id: taskId,
        title: input.title,
        description: input.description || '',
        type: input.type,
        status: 'pending',
        priority: input.priority || 'medium',
        parent_id: input.parent_id || undefined,
        assignee: input.assignee || undefined,
        estimated_hours: input.estimated_hours || undefined,
        actual_hours: 0,
        due_date: input.due_date ? new Date(input.due_date) : (undefined as Date | undefined),
        completed_date: undefined as Date | undefined,
        labels: input.labels || [],
        dependencies: input.dependencies || [],
        created_at: new Date(now),
        updated_at: new Date(now),
        created_by: createdBy,
        project_id: input.project_id || this.currentProjectId
      };

      // Insert task into database
      await this.stateService.insert('tasks', {
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type,
        status: task.status,
        priority: task.priority,
        parent_id: task.parent_id,
        assignee: task.assignee,
        estimated_hours: task.estimated_hours,
        actual_hours: task.actual_hours,
        due_date: task.due_date?.toISOString(),
        completed_date: task.completed_date?.toISOString(),
        labels: this.stateService.stringifyJsonColumn(task.labels),
        dependencies: this.stateService.stringifyJsonColumn(task.dependencies),
        created_at: task.created_at.toISOString(),
        updated_at: task.updated_at.toISOString(),
        created_by: task.created_by,
        project_id: task.project_id,
        domain_category: domainCategory,
        hierarchical_id: hierarchicalId
      });

      // Create dependencies if specified
      if (input.dependencies && input.dependencies.length > 0) {
        await this.createTaskDependencies(task.id, input.dependencies);
      }

      this.logger.info(`Task created: ${task.id}`, {
        title: task.title,
        type: task.type,
        priority: task.priority,
        project_id: task.project_id
      });

      return task;

    } catch (error) {
      this.logger.error('Failed to create task', error, { input });
      throw error;
    }
  }

  async updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
    try {
      const existingTask = await this.getTask(taskId);
      if (!existingTask) {
        throw new ValidationError(`Task not found: ${taskId}`);
      }

      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString()
      };

      if (input.title !== undefined) updateData['title'] = input.title;
      if (input.description !== undefined) updateData['description'] = input.description;
      if (input.status !== undefined) {
        updateData['status'] = input.status;
        if (input.status === 'completed' && !input.completed_date) {
          updateData['completed_date'] = new Date().toISOString();
        }
      }
      if (input.priority !== undefined) updateData['priority'] = input.priority;
      if (input.assignee !== undefined) updateData['assignee'] = input.assignee;
      if (input.estimated_hours !== undefined) updateData['estimated_hours'] = input.estimated_hours;
      if (input.actual_hours !== undefined) updateData['actual_hours'] = input.actual_hours;
      if (input.due_date !== undefined) updateData['due_date'] = input.due_date;
      if (input.completed_date !== undefined) updateData['completed_date'] = input.completed_date;
      if (input.labels !== undefined) updateData['labels'] = this.stateService.stringifyJsonColumn(input.labels);

      await this.stateService.update('tasks', taskId, updateData);

      const updatedTask = await this.getTask(taskId);
      if (!updatedTask) {
        throw new DatabaseError('Failed to retrieve updated task');
      }

      this.logger.info(`Task updated: ${taskId}`, {
        changes: Object.keys(updateData)
      });

      return updatedTask;

    } catch (error) {
      this.logger.error('Failed to update task', error, { taskId, input });
      throw error;
    }
  }

  async getTask(taskId: string): Promise<Task | null> {
    try {
      const row = await this.stateService.get<any>('SELECT * FROM tasks WHERE id = ?', [taskId]);
      
      if (!row) {
        return null;
      }

      return this.mapRowToTask(row);

    } catch (error) {
      this.logger.error('Failed to get task', error, { taskId });
      throw error;
    }
  }

  async listTasks(filter?: TaskFilter, limit?: number, offset?: number): Promise<Task[]> {
    try {
      let sql = 'SELECT * FROM tasks';
      const params: any[] = [];
      const conditions: string[] = [];

      if (filter) {
        if (filter.assignee) {
          conditions.push('assignee = ?');
          params.push(filter.assignee);
        }
        if (filter.status) {
          conditions.push('status = ?');
          params.push(filter.status);
        }
        if (filter.priority) {
          conditions.push('priority = ?');
          params.push(filter.priority);
        }
        if (filter.type) {
          conditions.push('type = ?');
          params.push(filter.type);
        }
        if (filter.project_id) {
          conditions.push('project_id = ?');
          params.push(filter.project_id);
        }
        if (filter.due_before) {
          conditions.push('due_date <= ?');
          params.push(filter.due_before);
        }
        if (filter.created_after) {
          conditions.push('created_at >= ?');
          params.push(filter.created_after);
        }
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY created_at DESC';

      if (limit) {
        sql += ' LIMIT ?';
        params.push(limit);
        
        if (offset) {
          sql += ' OFFSET ?';
          params.push(offset);
        }
      }

      const rows = await this.stateService.all<any>(sql, params);
      return rows.map(row => this.mapRowToTask(row));

    } catch (error) {
      this.logger.error('Failed to list tasks', error, { filter });
      throw error;
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      const task = await this.getTask(taskId);
      if (!task) {
        throw new ValidationError(`Task not found: ${taskId}`);
      }

      // Check for dependent tasks
      const dependentTasks = await this.stateService.all(
        'SELECT task_id FROM task_dependencies WHERE depends_on = ?',
        [taskId]
      );

      if (dependentTasks.length > 0) {
        throw new ValidationError(
          `Cannot delete task with dependencies: ${dependentTasks.map(t => t.task_id).join(', ')}`
        );
      }

      await this.stateService.transaction(async () => {
        // Delete task dependencies
        await this.stateService.run('DELETE FROM task_dependencies WHERE task_id = ?', [taskId]);
        
        // Delete task
        await this.stateService.delete('tasks', taskId);
      });

      this.logger.info(`Task deleted: ${taskId}`);

    } catch (error) {
      this.logger.error('Failed to delete task', error, { taskId });
      throw error;
    }
  }

  async assignTask(taskId: string, assignee: string, options?: {
    priority?: Priority;
    deadline?: string;
    notes?: string;
    assigneeType?: 'agent' | 'human' | 'team';
  }): Promise<Task> {
    try {
      // Validate task exists
      const existingTask = await this.getTask(taskId);
      if (!existingTask) {
        throw new ValidationError(`Task not found: ${taskId}`);
      }

      // Validate assignee format for agents
      if (options?.assigneeType === 'agent' || (!options?.assigneeType && assignee.includes('-'))) {
        // Validate agent name format: DOMAIN-ROLE-NAME
        const agentPattern = /^[A-Z]+-[A-Z]+-[A-Z]+$/;
        if (!agentPattern.test(assignee)) {
          throw new ValidationError(
            `Invalid agent name format. Expected: DOMAIN-ROLE-NAME (e.g., BE-BACKEND-BENJAMIN)`
          );
        }
      }

      // Prepare update data
      const updateData: UpdateTaskInput = { assignee };

      // Apply priority override if provided
      if (options?.priority) {
        updateData.priority = options.priority;
      }

      // Apply deadline if provided
      if (options?.deadline) {
        const deadlineDate = new Date(options.deadline);
        if (isNaN(deadlineDate.getTime())) {
          throw new ValidationError('Invalid deadline date format');
        }
        updateData.due_date = options.deadline;
      }

      // Update the task
      const updatedTask = await this.updateTask(taskId, updateData);

      // TODO: Implement assignment history tracking
      // For MVP, we're just logging the assignment
      if (options?.notes) {
        this.logger.info(`Task assignment notes: ${options.notes}`, {
          taskId,
          assignee,
          assigneeType: options.assigneeType || 'agent'
        });
      }

      this.logger.info(`Task assigned: ${taskId} to ${assignee}`, {
        assigneeType: options?.assigneeType || 'agent',
        priorityOverride: options?.priority,
        deadline: options?.deadline
      });

      return updatedTask;

    } catch (error) {
      this.logger.error('Failed to assign task', error as Error, { taskId, assignee, options });
      throw error;
    }
  }

  async addDependency(
    taskId: string, 
    dependsOnTaskId: string,
    options?: {
      type?: 'blocks' | 'depends_on';
      strict?: boolean;
      createdBy?: string;
      notes?: string;
    }
  ): Promise<TaskDependency> {
    try {
      // Validate both tasks exist
      const [task, dependsOnTask] = await Promise.all([
        this.getTask(taskId),
        this.getTask(dependsOnTaskId)
      ]);

      if (!task) {
        throw new ValidationError(`Task not found: ${taskId}`);
      }
      if (!dependsOnTask) {
        throw new ValidationError(`Dependency task not found: ${dependsOnTaskId}`);
      }

      // Cannot depend on itself
      if (taskId === dependsOnTaskId) {
        throw new ValidationError('Task cannot depend on itself');
      }

      // Check if dependency already exists
      const existingDependency = await this.stateService.get<any>(
        'SELECT * FROM task_dependencies WHERE task_id = ? AND depends_on = ?',
        [taskId, dependsOnTaskId]
      );

      if (existingDependency) {
        throw new ValidationError('Dependency already exists');
      }

      // Validate status constraints
      const strict = options?.strict !== false; // Default to true
      if (strict) {
        // Cannot depend on completed tasks
        if (dependsOnTask.status === 'completed') {
          throw new ValidationError('Cannot depend on completed task');
        }
        
        // Cannot depend on cancelled or archived tasks
        if (dependsOnTask.status === 'cancelled') {
          throw new ValidationError('Cannot depend on cancelled task');
        }
      }

      // Check for circular dependencies
      const hasCircularDependency = await this.checkCircularDependency(dependsOnTaskId, taskId);
      if (hasCircularDependency) {
        throw new ValidationError('Circular dependency detected');
      }

      // Create the dependency
      const dependencyId = uuidv4();
      const now = new Date().toISOString();
      const dependencyType = options?.type || 'blocks';

      await this.stateService.insert('task_dependencies', {
        id: dependencyId,
        task_id: taskId,
        depends_on: dependsOnTaskId,
        dependency_type: dependencyType,
        created_at: now,
        created_by: options?.createdBy,
        notes: options?.notes
      });

      const dependency: TaskDependency = {
        id: dependencyId,
        task_id: taskId,
        depends_on_task_id: dependsOnTaskId,
        dependency_type: dependencyType,
        created_at: new Date(now),
        ...(options?.createdBy !== undefined && { created_by: options.createdBy }),
        ...(options?.notes !== undefined && { notes: options.notes })
      };

      this.logger.info(`Task dependency created: ${taskId} ${dependencyType} ${dependsOnTaskId}`, {
        dependency_id: dependencyId,
        strict_mode: strict
      });

      return dependency;

    } catch (error) {
      this.logger.error('Failed to add task dependency', error as Error, { 
        taskId, 
        dependsOnTaskId, 
        options 
      });
      throw error;
    }
  }

  private async checkCircularDependency(fromTaskId: string, toTaskId: string): Promise<boolean> {
    // If fromTaskId depends on toTaskId (directly or indirectly), we have a circular dependency
    
    // Check direct dependency
    if (fromTaskId === toTaskId) {
      return true;
    }

    // Check indirect dependencies using recursive traversal
    const visited = new Set<string>();
    const queue = [fromTaskId];

    while (queue.length > 0) {
      const currentTaskId = queue.shift()!;
      
      if (visited.has(currentTaskId)) {
        continue;
      }
      visited.add(currentTaskId);

      // Get all tasks that the current task depends on
      const dependencies = await this.stateService.all<any>(
        'SELECT depends_on FROM task_dependencies WHERE task_id = ?',
        [currentTaskId]
      );

      for (const dep of dependencies) {
        if (dep.depends_on === toTaskId) {
          return true; // Circular dependency found
        }
        queue.push(dep.depends_on);
      }
    }

    return false;
  }

  async updateTaskStatus(taskId: string, status: TaskStatus, _notes?: string): Promise<Task> {
    const updateData: UpdateTaskInput = { status };
    
    if (status === 'completed') {
      updateData.completed_date = new Date().toISOString();
    }

    return this.updateTask(taskId, updateData);
  }

  async createTaskDependencies(taskId: string, dependsOn: string[]): Promise<void> {
    try {
      for (const dependencyId of dependsOn) {
        // Validate dependency exists
        const dependencyExists = await this.stateService.exists('tasks', dependencyId);
        if (!dependencyExists) {
          throw new ValidationError(`Dependency task not found: ${dependencyId}`);
        }

        // Create dependency record
        await this.stateService.insert('task_dependencies', {
          id: uuidv4(),
          task_id: taskId,
          depends_on: dependencyId,
          dependency_type: 'blocks',
          created_at: new Date().toISOString()
        });
      }

      this.logger.info(`Task dependencies created for ${taskId}`, {
        dependencies: dependsOn
      });

    } catch (error) {
      this.logger.error('Failed to create task dependencies', error, { taskId, dependsOn });
      throw error;
    }
  }

  async getTaskStats(projectId?: string): Promise<{
    total: number;
    by_status: Record<TaskStatus, number>;
    by_priority: Record<Priority, number>;
    by_type: Record<TaskType, number>;
  }> {
    try {
      const whereClause = projectId ? 'WHERE project_id = ?' : '';
      const params = projectId ? [projectId] : [];

      const [totalResult, statusStats, priorityStats, typeStats] = await Promise.all([
        this.stateService.get<{ count: number }>(`SELECT COUNT(*) as count FROM tasks ${whereClause}`, params),
        this.stateService.all<{ status: TaskStatus; count: number }>(`SELECT status, COUNT(*) as count FROM tasks ${whereClause} GROUP BY status`, params),
        this.stateService.all<{ priority: Priority; count: number }>(`SELECT priority, COUNT(*) as count FROM tasks ${whereClause} GROUP BY priority`, params),
        this.stateService.all<{ type: TaskType; count: number }>(`SELECT type, COUNT(*) as count FROM tasks ${whereClause} GROUP BY type`, params)
      ]);

      const by_status: Record<TaskStatus, number> = {
        pending: 0,
        in_progress: 0,
        blocked: 0,
        completed: 0,
        cancelled: 0
      };

      const by_priority: Record<Priority, number> = {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      };

      const by_type: Record<TaskType, number> = {
        epic: 0,
        feature: 0,
        story: 0,
        task: 0,
        subtask: 0,
        atomic: 0
      };

      statusStats.forEach(stat => by_status[stat.status] = stat.count);
      priorityStats.forEach(stat => by_priority[stat.priority] = stat.count);
      typeStats.forEach(stat => by_type[stat.type] = stat.count);

      return {
        total: totalResult?.count || 0,
        by_status,
        by_priority,
        by_type
      };

    } catch (error) {
      this.logger.error('Failed to get task stats', error, { projectId });
      throw error;
    }
  }

  setCurrentProject(projectId: string): void {
    this.currentProjectId = projectId;
  }

  getCurrentProject(): string {
    return this.currentProjectId;
  }

  private validateCreateTaskInput(input: CreateTaskInput): void {
    if (!input.title || input.title.trim().length === 0) {
      throw new ValidationError('Task title is required');
    }

    if (input.title.length > 200) {
      throw new ValidationError('Task title must be 200 characters or less');
    }

    if (input.description && input.description.length > 2000) {
      throw new ValidationError('Task description must be 2000 characters or less');
    }

    if (input.estimated_hours && input.estimated_hours < 0) {
      throw new ValidationError('Estimated hours must be non-negative');
    }

    if (input.due_date) {
      const dueDate = new Date(input.due_date);
      if (isNaN(dueDate.getTime())) {
        throw new ValidationError('Invalid due date format');
      }
    }
  }

  private async generateTaskId(context: IdGenerationContext): Promise<string> {
    // Generate hierarchical task ID using CLAUDE.md standards
    return await this.idGenerationService.generateId(context);
  }

  // Helper method to map TaskType to TaskLevel
  private mapTaskTypeToLevel(type: TaskType): TaskLevel {
    const mapping: Record<TaskType, TaskLevel> = {
      'epic': TaskLevel.EPIC,
      'feature': TaskLevel.FEATURE,
      'story': TaskLevel.STORY,
      'task': TaskLevel.TASK,
      'subtask': TaskLevel.SUBTASK,
      'atomic': TaskLevel.ATOMIC
    };
    
    return mapping[type];
  }

  private mapRowToTask(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description || '',
      type: row.type,
      status: row.status,
      priority: row.priority,
      parent_id: row.parent_id,
      assignee: row.assignee,
      estimated_hours: row.estimated_hours,
      actual_hours: row.actual_hours || 0,
      due_date: row.due_date ? new Date(row.due_date) : (undefined as Date | undefined),
      completed_date: row.completed_date ? new Date(row.completed_date) : (undefined as Date | undefined),
      labels: this.stateService.parseJsonColumn(row.labels, []),
      dependencies: this.stateService.parseJsonColumn(row.dependencies, []),
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      created_by: row.created_by,
      project_id: row.project_id
    };
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      // Test basic database operations
      const totalTasks = await this.stateService.count('tasks');
      
      return {
        status: 'healthy',
        details: {
          total_tasks: totalTasks,
          current_project: this.currentProjectId
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: (error as Error).message }
      };
    }
  }

  isReady(): boolean {
    return this.stateService.isInitialized();
  }
}