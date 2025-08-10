import { z } from 'zod';
import { MCPTool, ToolResponse, ProjectStatusReport } from '../types';
import { ProjectService } from '../services/ProjectService';
import { Logger } from '../utils/Logger';
import { zodToJsonSchema } from '../utils/zodToJsonSchema';

const ProjectCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  status: z.enum(['active', 'on_hold', 'completed', 'archived']).default('active'),
  owner: z.string().optional(),
  team_members: z.array(z.string()).optional()
});

const ProjectListSchema = z.object({
  filter: z.enum(['all', 'active', 'completed', 'archived']).default('active'),
  include_stats: z.boolean().default(false)
});

const ProjectSwitchSchema = z.object({
  project_name: z.string().min(1),
  project_id: z.string().optional(),
  create_if_missing: z.boolean().default(false),
  sync_tasks: z.boolean().default(true)
});

const ProjectStatusSchema = z.object({
  project_name: z.string().optional(),
  project_id: z.string().optional(),
  include_agents: z.boolean().default(true),
  include_activity: z.boolean().default(true),
  activity_limit: z.number().default(10)
});

const ProjectUpdateSchema = z.object({
  project_id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'on_hold', 'completed', 'archived']).optional(),
  owner: z.string().optional(),
  team_members: z.array(z.string()).optional()
});

export class ProjectTools {
  private projectService: ProjectService;
  private logger: Logger;

  constructor(projectService: ProjectService, logger: Logger) {
    this.projectService = projectService;
    this.logger = logger;
  }

  getTools(): MCPTool[] {
    return [
      {
        name: 'create',
        description: 'Create a new project',
        inputSchema: zodToJsonSchema(ProjectCreateSchema),
        handler: this.createProject.bind(this)
      },
      {
        name: 'update',
        description: 'Update an existing project',
        inputSchema: zodToJsonSchema(ProjectUpdateSchema),
        handler: this.updateProject.bind(this)
      },
      {
        name: 'list',
        description: 'List available projects',
        inputSchema: zodToJsonSchema(ProjectListSchema),
        handler: this.listProjects.bind(this)
      },
      {
        name: 'switch',
        description: 'Switch to a different project context',
        inputSchema: zodToJsonSchema(ProjectSwitchSchema),
        handler: this.switchProject.bind(this)
      },
      {
        name: 'status',
        description: 'Get comprehensive project status',
        inputSchema: zodToJsonSchema(ProjectStatusSchema),
        handler: this.getProjectStatus.bind(this)
      }
    ];
  }

  private async createProject(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const input = ProjectCreateSchema.parse(args);
      
      this.logger.info('Creating project', { name: input.name });

      const projectData: Parameters<typeof this.projectService.createProject>[0] = {
        name: input.name,
        status: input.status,
        owner: input.owner || 'mcp-user',
        team_members: input.team_members || []
      };
      
      if (input.description !== undefined) {
        projectData.description = input.description;
      }

      const project = await this.projectService.createProject(projectData);

      const output = `## Project Created Successfully

**Name**: ${project.name}  
**ID**: ${project.id}  
**Status**: ${project.status}  
**Owner**: ${project.owner}  
${project.description ? `**Description**: ${project.description}  ` : ''}
${project.team_members && project.team_members.length > 0 ? `**Team Members**: ${project.team_members.join(', ')}  ` : ''}

The project has been created successfully. You can now switch to this project using the switch command.`;

      return {
        title: `Created Project: ${project.name}`,
        metadata: {
          operation: 'project_create',
          status: 'success',
          data: {
            project_id: project.id,
            project_name: project.name,
            project_status: project.status
          },
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output
      };

    } catch (error) {
      this.logger.error('Failed to create project', error, { args });
      
      return {
        title: 'Project Creation Failed',
        metadata: {
          operation: 'project_create',
          status: 'error',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: `**Error**: ${(error as Error).message}`
      };
    }
  }

  private async updateProject(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const input = ProjectUpdateSchema.parse(args);
      
      this.logger.info('Updating project', { project_id: input.project_id });

      // Prepare updates object
      const updates: any = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;
      if (input.status !== undefined) updates.status = input.status;
      if (input.owner !== undefined) updates.owner = input.owner;
      if (input.team_members !== undefined) updates.team_members = input.team_members;

      const project = await this.projectService.updateProject(input.project_id, updates);

      const updatedFields = Object.keys(updates);
      const output = `## Project Updated Successfully

**Name**: ${project.name}  
**ID**: ${project.id}  
**Status**: ${project.status}  
**Owner**: ${project.owner}  
${project.description ? `**Description**: ${project.description}  ` : ''}
${project.team_members && project.team_members.length > 0 ? `**Team Members**: ${project.team_members.join(', ')}  ` : ''}

### Updated Fields
${updatedFields.map(field => `- **${field}**: ${JSON.stringify(updates[field])}`).join('\n')}

The project has been updated successfully.`;

      return {
        title: `Updated Project: ${project.name}`,
        metadata: {
          operation: 'project_update',
          status: 'success',
          data: {
            project_id: project.id,
            project_name: project.name,
            updated_fields: updatedFields
          },
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output
      };

    } catch (error) {
      this.logger.error('Failed to update project', error, { args });
      
      return {
        title: 'Project Update Failed',
        metadata: {
          operation: 'project_update',
          status: 'error',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: `**Error**: ${(error as Error).message}`
      };
    }
  }

  private async listProjects(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const input = ProjectListSchema.parse(args);
      
      this.logger.info('Listing projects', { filter: input.filter });

      const projects = await this.projectService.listProjects();
      
      // Filter projects based on status
      const filteredProjects = input.filter === 'all' ? projects : 
        projects.filter(p => p.status === input.filter);

      const output = this.formatProjectList(filteredProjects, input.include_stats);

      return {
        title: 'Project List',
        metadata: {
          operation: 'project_list',
          status: 'success',
          data: {
            project_count: filteredProjects.length,
            filter: input.filter
          },
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output
      };

    } catch (error) {
      this.logger.error('Failed to list projects', error, { args });
      
      return {
        title: 'Project List Failed',
        metadata: {
          operation: 'project_list',
          status: 'error',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: `**Error**: ${(error as Error).message}`
      };
    }
  }

  private async switchProject(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const input = ProjectSwitchSchema.parse(args);
      
      this.logger.info('Switching project', { project_name: input.project_name });

      // Call the actual service method
      const options: { projectId?: string; createIfMissing?: boolean } = {};
      if (input.project_id) options.projectId = input.project_id;
      if (input.create_if_missing) options.createIfMissing = input.create_if_missing;
      
      const project = await this.projectService.switchProject(input.project_name, options);

      // Get task stats for the project
      const stats = await this.projectService.getProjectStatus(project.id);
      
      const output = `## Project Context Switched

**Project**: ${project.name}  
**Project ID**: ${project.id}  
**Status**: ${project.status}  
**Owner**: ${project.owner}  

The project context has been switched. All subsequent task operations will be performed in the context of this project.

### Task Statistics
${Object.entries(stats.task_statistics.by_status).map(([status, count]) => 
  `- **${status}**: ${count}`
).join('\n') || 'No tasks in this project yet.'}

${input.sync_tasks ? '✓ Task synchronization enabled' : '⚠️ Task synchronization disabled'}  
${input.create_if_missing && project.created_at.toISOString().startsWith(new Date().toISOString().substring(0, 10)) 
  ? '✓ New project created' 
  : '✓ Switched to existing project'}`;

      return {
        title: `Switched to Project: ${project.name}`,
        metadata: {
          operation: 'project_switch',
          status: 'success',
          data: {
            project_name: project.name,
            project_id: project.id,
            project_status: project.status,
            created_new: input.create_if_missing && 
              project.created_at.toISOString().startsWith(new Date().toISOString().substring(0, 10))
          },
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output
      };

    } catch (error) {
      this.logger.error('Failed to switch project', error, { args });
      
      return {
        title: 'Project Switch Failed',
        metadata: {
          operation: 'project_switch',
          status: 'error',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: `**Error**: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async getProjectStatus(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const input = ProjectStatusSchema.parse(args);
      
      // Determine project ID
      let projectId: string;
      
      if (input.project_id) {
        projectId = input.project_id;
      } else if (input.project_name) {
        // Look up project by name
        const project = await this.projectService.findProjectByName(input.project_name);
        if (!project) {
          throw new Error(`Project not found: ${input.project_name}`);
        }
        projectId = project.id;
      } else {
        // Use current project context or default
        // For now, we'll throw an error
        throw new Error('Either project_name or project_id must be provided');
      }
      
      this.logger.info('Getting project status', { 
        project_id: projectId, 
        project_name: input.project_name 
      });

      const statusReport = await this.projectService.getProjectStatus(projectId);
      
      const output = this.formatProjectStatus(statusReport, input);

      return {
        title: `Project Status: ${statusReport.project.name}`,
        metadata: {
          operation: 'project_status',
          status: 'success',
          data: {
            project_id: statusReport.project.id,
            project_name: statusReport.project.name,
            project_status: statusReport.project.status,
            total_tasks: statusReport.task_statistics.total,
            completion_rate: statusReport.project_health.completion_rate
          },
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output
      };

    } catch (error) {
      this.logger.error('Failed to get project status', error, { args });
      
      return {
        title: 'Project Status Failed',
        metadata: {
          operation: 'project_status',
          status: 'error',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: `**Error**: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private formatProjectList(projects: any[], includeStats: boolean): string {
    let output = `## Available Projects

**Total Projects**: ${projects.length}

`;

    if (projects.length === 0) {
      output += 'No projects found matching the filter criteria.';
      return output;
    }

    output += '| Name | Status | Owner | Created |\n';
    output += '|------|--------|-------|----------|\n';

    projects.forEach(project => {
      const createdDate = project.created_at.toISOString().split('T')[0];
      output += `| ${project.name} | ${project.status} | ${project.owner} | ${createdDate} |\n`;
    });

    if (includeStats) {
      output += '\n### Project Statistics\n';
      projects.forEach(project => {
        output += `\n**${project.name}**:\n`;
        if (project.stats) {
          output += `- Total Tasks: ${project.stats.total_tasks || 0}\n`;
          output += `- Completed Tasks: ${project.stats.completed_tasks || 0}\n`;
          output += `- Active Agents: ${project.stats.active_agents || 0}\n`;
          output += `- Completion Rate: ${(project.stats.completion_rate || 0) * 100}%\n`;
        }
      });
    }

    return output;
  }

  private formatProjectStatus(report: ProjectStatusReport, input: any): string {
    const { project, task_statistics, agent_activity, project_health, recent_activity } = report;
    
    let output = `## Project Status: ${project.name}

**Status**: ${project.status} | **Owner**: ${project.owner}  
**Created**: ${project.created_at.toISOString().split('T')[0]} | **Updated**: ${project.updated_at.toISOString().split('T')[0]}

### 📊 Task Statistics

**Total Tasks**: ${task_statistics.total}

#### By Status:
${this.formatTaskCounts(task_statistics.by_status, [
  { key: 'pending', emoji: '⏳' },
  { key: 'in_progress', emoji: '🚀' },
  { key: 'completed', emoji: '✅' },
  { key: 'blocked', emoji: '🚫' },
  { key: 'cancelled', emoji: '❌' }
])}

#### By Priority:
${this.formatTaskCounts(task_statistics.by_priority, [
  { key: 'critical', emoji: '🔴' },
  { key: 'high', emoji: '🟠' },
  { key: 'medium', emoji: '🟡' },
  { key: 'low', emoji: '🟢' }
])}

#### Timeline:
- **Overdue**: ${task_statistics.overdue} ${task_statistics.overdue > 0 ? '⚠️' : ''}
- **Due Today**: ${task_statistics.due_today}
- **Due This Week**: ${task_statistics.due_this_week}
`;

    if (input.include_agents && agent_activity.active_agents.length > 0) {
      output += `
### 👥 Agent Activity

**Active Agents**: ${agent_activity.active_agents.length}
`;
      
      // Sort agents by task count
      const sortedAgents = Object.entries(agent_activity.tasks_by_agent)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10); // Top 10 agents
      
      if (sortedAgents.length > 0) {
        output += '\n#### Tasks by Agent:\n';
        sortedAgents.forEach(([agent, count]) => {
          output += `- **${agent}**: ${count} tasks\n`;
        });
      }

      if (agent_activity.recent_completions.length > 0) {
        output += '\n#### Recent Completions:\n';
        agent_activity.recent_completions.slice(0, 5).forEach(completion => {
          const date = completion.completed_at.toISOString().split('T')[0];
          output += `- "${completion.task_title}" by ${completion.completed_by} (${date})\n`;
        });
      }
    }

    output += `
### 🏥 Project Health

- **Completion Rate**: ${project_health.completion_rate}% ${this.getHealthEmoji(project_health.completion_rate)}
- **On-Time Rate**: ${project_health.on_time_rate}% ${this.getHealthEmoji(project_health.on_time_rate)}
- **Blocked Tasks**: ${project_health.blocked_tasks} ${project_health.blocked_tasks > 5 ? '⚠️' : ''}
${project_health.estimated_completion 
  ? `- **Estimated Completion**: ${project_health.estimated_completion.toISOString().split('T')[0]}`
  : '- **Estimated Completion**: Unable to estimate'}
`;

    if (input.include_activity && recent_activity.length > 0) {
      output += `
### 📋 Recent Activity
`;
      recent_activity.slice(0, input.activity_limit).forEach(activity => {
        const timestamp = activity.timestamp.toISOString().replace('T', ' ').split('.')[0];
        const icon = this.getActivityIcon(activity.type);
        output += `- ${icon} ${activity.description} (${timestamp})\n`;
      });
    }

    output += `
---
**Last Updated**: ${new Date().toISOString()}`;

    return output;
  }

  private formatTaskCounts(counts: Record<string, number>, order: Array<{key: string, emoji: string}>): string {
    return order
      .filter(item => counts[item.key] !== undefined)
      .map(item => `- ${item.emoji} **${item.key}**: ${counts[item.key] || 0}`)
      .join('\n');
  }

  private getHealthEmoji(percentage: number): string {
    if (percentage >= 90) return '🟢';
    if (percentage >= 70) return '🟡';
    if (percentage >= 50) return '🟠';
    return '🔴';
  }

  private getActivityIcon(type: string): string {
    switch (type) {
      case 'task_created': return '➕';
      case 'task_completed': return '✅';
      case 'task_updated': return '📝';
      case 'agent_assigned': return '👤';
      default: return '•';
    }
  }
}