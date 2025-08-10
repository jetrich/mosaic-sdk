import { MCPServerConfig, Project, ProjectStatus, ProjectStatusReport, ValidationError, TaskStatus, TaskType, Priority } from '../types';
import { Logger } from '../utils/Logger';
import { StateService } from './StateService';
import { TaskService } from './TaskService';
import { IdGenerationService, DomainCategory, TaskLevel, IdGenerationContext } from './IdGenerationService';
import { v4 as uuidv4 } from 'uuid';

export class ProjectService {
  private logger: Logger;
  private stateService: StateService;
  private idGenerationService: IdGenerationService;
  private taskService?: TaskService;

  constructor(config: MCPServerConfig, logger: Logger) {
    // Config passed but not stored as it's not used in this service
    this.logger = logger;
    this.stateService = new StateService(config, logger);
    this.idGenerationService = new IdGenerationService(this.stateService, logger);
  }

  setTaskService(taskService: TaskService): void {
    this.taskService = taskService;
  }

  async initialize(): Promise<void> {
    await this.stateService.initialize();
  }

  async listProjects(): Promise<Project[]> {
    try {
      const rows = await this.stateService.all<any>('SELECT * FROM projects ORDER BY created_at DESC');
      return rows.map(row => this.mapRowToProject(row));
    } catch (error) {
      this.logger.error('Failed to list projects', error);
      throw error;
    }
  }

  async getProject(projectId: string): Promise<Project | null> {
    try {
      const row = await this.stateService.get<any>('SELECT * FROM projects WHERE id = ?', [projectId]);
      return row ? this.mapRowToProject(row) : null;
    } catch (error) {
      this.logger.error('Failed to get project', error, { projectId });
      throw error;
    }
  }

  async getProjectStatus(projectId: string): Promise<ProjectStatusReport> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      // Run all queries in parallel for better performance
      const [
        tasksByStatus,
        tasksByType,
        tasksByPriority,
        overdueTasks,
        dueTodayTasks,
        dueThisWeekTasks,
        activeAgents,
        tasksByAgent,
        recentCompletions,
        blockedTasksCount,
        completedTasksCount,
        totalTasksCount,
        recentActivity,
        onTimeCompletions,
        totalCompletions
      ] = await Promise.all([
        // Task statistics queries
        this.stateService.all<any>(
          'SELECT status, COUNT(*) as count FROM tasks WHERE project_id = ? GROUP BY status',
          [projectId]
        ),
        this.stateService.all<any>(
          'SELECT type, COUNT(*) as count FROM tasks WHERE project_id = ? GROUP BY type',
          [projectId]
        ),
        this.stateService.all<any>(
          'SELECT priority, COUNT(*) as count FROM tasks WHERE project_id = ? GROUP BY priority',
          [projectId]
        ),
        
        // Due date queries
        this.stateService.get<any>(
          `SELECT COUNT(*) as count FROM tasks 
           WHERE project_id = ? AND status NOT IN ('completed', 'cancelled') 
           AND due_date < datetime('now')`,
          [projectId]
        ),
        this.stateService.get<any>(
          `SELECT COUNT(*) as count FROM tasks 
           WHERE project_id = ? AND status NOT IN ('completed', 'cancelled') 
           AND date(due_date) = date('now')`,
          [projectId]
        ),
        this.stateService.get<any>(
          `SELECT COUNT(*) as count FROM tasks 
           WHERE project_id = ? AND status NOT IN ('completed', 'cancelled') 
           AND date(due_date) BETWEEN date('now') AND date('now', '+7 days')`,
          [projectId]
        ),
        
        // Agent activity queries
        this.stateService.all<any>(
          `SELECT DISTINCT assignee FROM tasks 
           WHERE project_id = ? AND status = 'in_progress' AND assignee IS NOT NULL`,
          [projectId]
        ),
        this.stateService.all<any>(
          `SELECT assignee, COUNT(*) as count FROM tasks 
           WHERE project_id = ? AND assignee IS NOT NULL 
           GROUP BY assignee`,
          [projectId]
        ),
        this.stateService.all<any>(
          `SELECT id, title, assignee, completed_date FROM tasks 
           WHERE project_id = ? AND status = 'completed' 
           ORDER BY completed_date DESC LIMIT 10`,
          [projectId]
        ),
        
        // Health metrics queries
        this.stateService.get<any>(
          'SELECT COUNT(*) as count FROM tasks WHERE project_id = ? AND status = "blocked"',
          [projectId]
        ),
        this.stateService.get<any>(
          'SELECT COUNT(*) as count FROM tasks WHERE project_id = ? AND status = "completed"',
          [projectId]
        ),
        this.stateService.get<any>(
          'SELECT COUNT(*) as count FROM tasks WHERE project_id = ?',
          [projectId]
        ),
        
        // Recent activity (simulated - in a real implementation, we'd have an activity log table)
        this.generateRecentActivity(projectId),
        
        // On-time completion metrics
        this.stateService.get<any>(
          `SELECT COUNT(*) as count FROM tasks 
           WHERE project_id = ? AND status = 'completed' 
           AND completed_date <= due_date`,
          [projectId]
        ),
        this.stateService.get<any>(
          `SELECT COUNT(*) as count FROM tasks 
           WHERE project_id = ? AND status = 'completed'`,
          [projectId]
        )
      ]);

      // Process the results
      const statusCounts = this.processGroupedResults(tasksByStatus, 'status');
      const typeCounts = this.processGroupedResults(tasksByType, 'type');
      const priorityCounts = this.processGroupedResults(tasksByPriority, 'priority');
      
      const totalTasks = totalTasksCount?.count || 0;
      const completedTasks = completedTasksCount?.count || 0;
      const blockedTasks = blockedTasksCount?.count || 0;
      
      // Calculate health metrics
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      const onTimeRate = totalCompletions?.count > 0 
        ? ((onTimeCompletions?.count || 0) / totalCompletions.count) * 100 
        : 0;
      
      // Estimate completion date (simplified - assumes linear progress)
      const estimatedCompletion = this.estimateCompletionDate(
        totalTasks, 
        completedTasks, 
        project.created_at
      );

      // Build the comprehensive status report
      const report: ProjectStatusReport = {
        project: {
          id: project.id,
          name: project.name,
          status: project.status,
          owner: project.owner,
          created_at: project.created_at,
          updated_at: project.updated_at
        },
        task_statistics: {
          total: totalTasks,
          by_status: statusCounts as Record<TaskStatus, number>,
          by_type: typeCounts as Record<TaskType, number>,
          by_priority: priorityCounts as Record<Priority, number>,
          overdue: overdueTasks?.count || 0,
          due_today: dueTodayTasks?.count || 0,
          due_this_week: dueThisWeekTasks?.count || 0
        },
        agent_activity: {
          active_agents: activeAgents.map(row => row.assignee),
          tasks_by_agent: tasksByAgent.reduce((acc, row) => {
            acc[row.assignee] = row.count;
            return acc;
          }, {} as Record<string, number>),
          recent_completions: recentCompletions.map(task => ({
            task_id: task.id,
            task_title: task.title,
            completed_by: task.assignee || 'unassigned',
            completed_at: new Date(task.completed_date)
          }))
        },
        project_health: {
          completion_rate: Math.round(completionRate * 10) / 10,
          on_time_rate: Math.round(onTimeRate * 10) / 10,
          blocked_tasks: blockedTasks,
          critical_path_length: 0, // TODO: Implement critical path calculation
          estimated_completion: estimatedCompletion
        },
        recent_activity: recentActivity
      };

      return report;
    } catch (error) {
      this.logger.error('Failed to get project status', error, { projectId });
      throw error;
    }
  }

  private processGroupedResults(results: any[], key: string): Record<string, number> {
    return results.reduce((acc, row) => {
      acc[row[key]] = row.count;
      return acc;
    }, {});
  }

  private estimateCompletionDate(
    totalTasks: number, 
    completedTasks: number, 
    startDate: Date
  ): Date | null {
    if (totalTasks === 0 || completedTasks === 0) {
      return null;
    }

    if (completedTasks >= totalTasks) {
      return new Date();
    }

    const remainingTasks = totalTasks - completedTasks;
    const elapsedDays = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (elapsedDays === 0) {
      return null; // Can't estimate on first day
    }

    const tasksPerDay = completedTasks / elapsedDays;
    const daysToComplete = Math.ceil(remainingTasks / tasksPerDay);
    
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + daysToComplete);
    
    return estimatedDate;
  }

  private async generateRecentActivity(projectId: string): Promise<any[]> {
    // In a real implementation, this would query an activity log table
    // For now, we'll generate some sample activity based on recent tasks
    try {
      const recentTasks = await this.stateService.all<any>(
        `SELECT id, title, status, created_at, updated_at, assignee, created_by 
         FROM tasks 
         WHERE project_id = ? 
         ORDER BY updated_at DESC 
         LIMIT 20`,
        [projectId]
      );

      return recentTasks.map(task => {
        const isNew = task.created_at === task.updated_at;
        const type = isNew ? 'task_created' : 
                    task.status === 'completed' ? 'task_completed' : 
                    task.assignee ? 'agent_assigned' : 'task_updated';
        
        return {
          timestamp: new Date(task.updated_at),
          type,
          description: isNew ? `Task "${task.title}" created` :
                      task.status === 'completed' ? `Task "${task.title}" completed` :
                      task.assignee ? `Task "${task.title}" assigned to ${task.assignee}` :
                      `Task "${task.title}" updated`,
          actor: task.assignee || task.created_by || 'system'
        };
      });
    } catch (error) {
      this.logger.error('Failed to generate recent activity', error);
      return [];
    }
  }

  async findProjectByName(projectName: string): Promise<Project | null> {
    try {
      const row = await this.stateService.get<any>(
        'SELECT * FROM projects WHERE name = ?', 
        [projectName]
      );
      return row ? this.mapRowToProject(row) : null;
    } catch (error) {
      this.logger.error('Failed to find project by name', error, { projectName });
      throw error;
    }
  }

  async createProject(projectData: {
    name: string;
    description?: string;
    status?: ProjectStatus;
    owner?: string;
    team_members?: string[];
    domainOverride?: DomainCategory;
  }): Promise<Project> {
    try {
      // Validate project name is unique
      const existing = await this.findProjectByName(projectData.name);
      if (existing) {
        throw new ValidationError(`Project with name '${projectData.name}' already exists`);
      }

      const projectId = uuidv4();
      const now = new Date().toISOString();

      // Detect domain category and generate epic ID
      const domainContext: IdGenerationContext = {
        level: TaskLevel.EPIC,
        projectId,
        title: projectData.name,
        description: projectData.description,
        domainOverride: projectData.domainOverride
      };

      const epicId = await this.idGenerationService.generateId(domainContext);
      const parsedEpicId = this.idGenerationService.parseId(epicId);
      const domainCategory = parsedEpicId.domain;

      const project = {
        id: projectId,
        name: projectData.name,
        description: projectData.description || '',
        status: projectData.status || 'active',
        owner: projectData.owner || 'system',
        team_members: this.stateService.stringifyJsonColumn(projectData.team_members || []),
        created_at: now,
        updated_at: now,
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
        }),
        domain_category: domainCategory,
        epic_id: epicId
      };

      await this.stateService.insert('projects', project);

      this.logger.info('Project created', { 
        projectId, 
        projectName: projectData.name,
        domainCategory,
        domainName: this.idGenerationService.getDomainName(domainCategory),
        epicId
      });

      const createdProject = await this.getProject(projectId);
      if (!createdProject) {
        throw new Error('Failed to retrieve created project');
      }

      return createdProject;
    } catch (error) {
      this.logger.error('Failed to create project', error, { projectData });
      throw error;
    }
  }

  async switchProject(projectName: string, options?: {
    projectId?: string;
    createIfMissing?: boolean;
  }): Promise<Project> {
    try {
      let project: Project | null = null;

      // If projectId is provided, try to find by ID first
      if (options?.projectId) {
        project = await this.getProject(options.projectId);
        if (project && project.name !== projectName) {
          throw new ValidationError(
            `Project ID '${options.projectId}' exists but has name '${project.name}', not '${projectName}'`
          );
        }
      }

      // If not found by ID, try to find by name
      if (!project) {
        project = await this.findProjectByName(projectName);
      }

      // Create project if it doesn't exist and createIfMissing is true
      if (!project && options?.createIfMissing) {
        this.logger.info('Creating new project', { projectName });
        project = await this.createProject({
          name: projectName,
          status: 'active'
        });
      }

      // If still no project, throw error
      if (!project) {
        throw new ValidationError(`Project not found: ${projectName}`);
      }

      // Validate project status - only allow switching to active or on_hold projects
      if (project.status !== 'active' && project.status !== 'on_hold') {
        throw new ValidationError(
          `Cannot switch to project '${projectName}' with status '${project.status}'. ` +
          `Only 'active' or 'on_hold' projects can be selected.`
        );
      }

      // Update current project context in TaskService
      if (this.taskService) {
        this.taskService.setCurrentProject(project.id);
        this.logger.info('Project context updated in TaskService', {
          projectId: project.id,
          projectName: project.name
        });
      } else {
        this.logger.warn('TaskService not available for project context update');
      }

      this.logger.info('Project switched successfully', {
        projectId: project.id,
        projectName: project.name,
        status: project.status
      });

      return project;
    } catch (error) {
      this.logger.error('Failed to switch project', error, { 
        projectName, 
        options 
      });
      throw error;
    }
  }

  async updateProject(projectId: string, updates: {
    name?: string;
    description?: string;
    status?: ProjectStatus;
    owner?: string;
    team_members?: string[];
    config?: Record<string, any>;
  }): Promise<Project> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        throw new ValidationError(`Project not found: ${projectId}`);
      }

      // If updating name, check for uniqueness
      if (updates.name && updates.name !== project.name) {
        const existing = await this.findProjectByName(updates.name);
        if (existing) {
          throw new ValidationError(`Project with name '${updates.name}' already exists`);
        }
      }

      // Build update query
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (updates.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(updates.name);
      }
      if (updates.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(updates.description);
      }
      if (updates.status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(updates.status);
      }
      if (updates.owner !== undefined) {
        updateFields.push('owner = ?');
        updateValues.push(updates.owner);
      }
      if (updates.team_members !== undefined) {
        updateFields.push('team_members = ?');
        updateValues.push(JSON.stringify(updates.team_members));
      }
      if (updates.config !== undefined) {
        updateFields.push('config = ?');
        updateValues.push(JSON.stringify(updates.config));
      }

      // Always update updated_at
      updateFields.push('updated_at = CURRENT_TIMESTAMP');

      // Add project ID to values
      updateValues.push(projectId);

      const query = `UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?`;
      await this.stateService.run(query, updateValues);

      this.logger.info('Project updated', { 
        projectId, 
        updates: Object.keys(updates) 
      });

      const updatedProject = await this.getProject(projectId);
      if (!updatedProject) {
        throw new Error('Failed to retrieve updated project');
      }

      return updatedProject;
    } catch (error) {
      this.logger.error('Failed to update project', error, { projectId, updates });
      throw error;
    }
  }

  private mapRowToProject(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      status: row.status,
      owner: row.owner,
      team_members: this.stateService.parseJsonColumn(row.team_members, []),
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      config: this.stateService.parseJsonColumn(row.config, {
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
      stats: this.stateService.parseJsonColumn(row.stats, {
        total_tasks: 0,
        completed_tasks: 0,
        active_agents: 0,
        total_hours_spent: 0,
        completion_rate: 0
      })
    };
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      const totalProjects = await this.stateService.count('projects');
      return {
        status: 'healthy',
        details: { total_projects: totalProjects }
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