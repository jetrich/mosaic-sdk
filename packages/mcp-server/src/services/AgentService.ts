import { MCPServerConfig, Agent, AgentStatus } from '../types';
import { Logger } from '../utils/Logger';
import { StateService } from './StateService';
import { randomUUID } from 'crypto';

export class AgentService {
  private logger: Logger;
  private stateService: StateService;

  constructor(config: MCPServerConfig, logger: Logger) {
    // Config passed but not stored as it's not used in this service
    this.logger = logger;
    this.stateService = new StateService(config, logger);
  }

  async initialize(): Promise<void> {
    await this.stateService.initialize();
  }

  async listAgents(): Promise<Agent[]> {
    try {
      const rows = await this.stateService.all<any>('SELECT * FROM agents ORDER BY created_at DESC');
      return rows.map(row => this.mapRowToAgent(row));
    } catch (error) {
      this.logger.error('Failed to list agents', error);
      throw error;
    }
  }

  async getAgent(agentId: string): Promise<Agent | null> {
    try {
      const row = await this.stateService.get<any>('SELECT * FROM agents WHERE id = ?', [agentId]);
      return row ? this.mapRowToAgent(row) : null;
    } catch (error) {
      this.logger.error('Failed to get agent', error, { agentId });
      throw error;
    }
  }

  async getAgentStatus(): Promise<any> {
    try {
      const agentStats = await this.stateService.all<any>(
        'SELECT status, COUNT(*) as count FROM agents GROUP BY status'
      );

      const stats = agentStats.reduce((acc, stat) => {
        acc[stat.status] = stat.count;
        return acc;
      }, {} as Record<string, number>);

      return {
        total_agents: Object.values(stats).reduce((sum: number, count: unknown) => sum + (count as number), 0),
        by_status: stats
      };
    } catch (error) {
      this.logger.error('Failed to get agent status', error);
      throw error;
    }
  }

  private mapRowToAgent(row: any): Agent {
    return {
      id: row.id,
      persona: row.persona,
      status: row.status,
      current_task: row.current_task,
      model: row.model,
      tools: this.stateService.parseJsonColumn(row.tools, []),
      created_at: new Date(row.created_at),
      last_activity: new Date(row.last_activity),
      context: this.stateService.parseJsonColumn(row.context, {
        project_id: '',
        task_queue: [],
        conversation_history: [],
        state_data: {}
      }),
      metrics: this.stateService.parseJsonColumn(row.metrics, {
        tasks_completed: 0,
        average_completion_time: 0,
        success_rate: 0
      })
    };
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      const totalAgents = await this.stateService.count('agents');
      return {
        status: 'healthy',
        details: { total_agents: totalAgents }
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

  // Phase 3: Agent Lifecycle Management

  async deployAgent(config: {
    persona: string;
    model?: string;
    tools?: string[];
    projectId: string;
    taskId?: string;
    priority?: 'low' | 'medium' | 'high';
  }): Promise<Agent> {
    try {
      const agentId = randomUUID();
      const now = new Date().toISOString();

      const agentData = {
        id: agentId,
        persona: config.persona,
        status: 'idle' as AgentStatus,
        current_task: config.taskId || null,
        model: config.model || 'claude-3-5-sonnet',
        tools: JSON.stringify(config.tools || ['read', 'write', 'edit']),
        created_at: now,
        last_activity: now,
        context: JSON.stringify({
          project_id: config.projectId,
          task_queue: config.taskId ? [config.taskId] : [],
          conversation_history: [],
          state_data: {
            priority: config.priority || 'medium',
            deployment_config: config
          }
        }),
        metrics: JSON.stringify({
          tasks_completed: 0,
          average_completion_time: 0,
          success_rate: 0
        })
      };

      await this.stateService.run(
        `INSERT INTO agents (id, persona, status, current_task, model, tools, created_at, last_activity, context, metrics)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        Object.values(agentData)
      );

      this.logger.info('Agent deployed successfully', { agentId, persona: config.persona });

      // Return the created agent
      const agent = await this.getAgent(agentId);
      if (!agent) {
        throw new Error('Failed to retrieve deployed agent');
      }

      return agent;
    } catch (error) {
      this.logger.error('Failed to deploy agent', error, config);
      throw error;
    }
  }

  async updateAgentStatus(agentId: string, status: AgentStatus, context?: Record<string, any>): Promise<void> {
    try {
      const updateData: any = {
        status,
        last_activity: new Date().toISOString()
      };

      if (context) {
        const existingAgent = await this.getAgent(agentId);
        if (existingAgent) {
          const updatedContext = {
            ...existingAgent.context,
            ...context,
            state_data: {
              ...existingAgent.context.state_data,
              ...context['state_data']
            }
          };
          updateData.context = JSON.stringify(updatedContext);
        }
      }

      const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updateData).concat([agentId]);

      await this.stateService.run(
        `UPDATE agents SET ${setClause} WHERE id = ?`,
        values
      );

      this.logger.debug('Agent status updated', { agentId, status });
    } catch (error) {
      this.logger.error('Failed to update agent status', error, { agentId, status });
      throw error;
    }
  }

  async terminateAgent(agentId: string, reason?: string): Promise<void> {
    try {
      const agent = await this.getAgent(agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      // Update status to indicate termination
      await this.updateAgentStatus(agentId, 'completed', {
        state_data: {
          termination_reason: reason || 'Manual termination',
          terminated_at: new Date().toISOString()
        }
      });

      // Update metrics with final completion time
      const metrics = {
        ...agent.metrics,
        termination_time: new Date().toISOString(),
        termination_reason: reason || 'Manual termination'
      };

      await this.stateService.run(
        'UPDATE agents SET metrics = ? WHERE id = ?',
        [JSON.stringify(metrics), agentId]
      );

      this.logger.info('Agent terminated successfully', { agentId, reason });
    } catch (error) {
      this.logger.error('Failed to terminate agent', error, { agentId, reason });
      throw error;
    }
  }

  async getActiveAgents(): Promise<Agent[]> {
    try {
      const rows = await this.stateService.all<any>(
        'SELECT * FROM agents WHERE status IN (?, ?, ?) ORDER BY last_activity DESC',
        ['idle', 'working', 'waiting']
      );
      return rows.map(row => this.mapRowToAgent(row));
    } catch (error) {
      this.logger.error('Failed to get active agents', error);
      throw error;
    }
  }

  async getAgentsByProject(projectId: string): Promise<Agent[]> {
    try {
      const agents = await this.listAgents();
      return agents.filter(agent => agent.context.project_id === projectId);
    } catch (error) {
      this.logger.error('Failed to get agents by project', error, { projectId });
      throw error;
    }
  }

  async assignTaskToAgent(agentId: string, taskId: string): Promise<void> {
    try {
      const agent = await this.getAgent(agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      const updatedContext = {
        ...agent.context,
        task_queue: [...agent.context.task_queue, taskId]
      };

      await this.stateService.run(
        'UPDATE agents SET current_task = ?, context = ?, last_activity = ? WHERE id = ?',
        [taskId, JSON.stringify(updatedContext), new Date().toISOString(), agentId]
      );

      this.logger.info('Task assigned to agent', { agentId, taskId });
    } catch (error) {
      this.logger.error('Failed to assign task to agent', error, { agentId, taskId });
      throw error;
    }
  }
}