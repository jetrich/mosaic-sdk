import { MCPServerConfig, AgentMessage, AgentHandoff, MessageType, MessageStatus, HandoffType, HandoffStatus } from '../types';
import { Logger } from '../utils/Logger';
import { StateService } from './StateService';
import { randomUUID } from 'crypto';

export class CommunicationService {
  private logger: Logger;
  private stateService: StateService;

  constructor(config: MCPServerConfig, logger: Logger) {
    this.logger = logger;
    this.stateService = new StateService(config, logger);
  }

  async initialize(): Promise<void> {
    await this.stateService.initialize();
  }

  // Agent Messaging

  async sendMessage(config: {
    fromAgentId: string;
    toAgentId?: string; // undefined for broadcast
    messageType: MessageType;
    subject?: string;
    content: string;
    metadata?: Record<string, any>;
  }): Promise<AgentMessage> {
    try {
      const messageId = randomUUID();
      const now = new Date().toISOString();

      const messageData = {
        id: messageId,
        from_agent_id: config.fromAgentId,
        to_agent_id: config.toAgentId || null,
        message_type: config.messageType,
        subject: config.subject || null,
        content: config.content,
        metadata: JSON.stringify(config.metadata || {}),
        status: 'sent' as MessageStatus,
        created_at: now,
        delivered_at: null,
        read_at: null
      };

      await this.stateService.run(
        `INSERT INTO agent_messages (id, from_agent_id, to_agent_id, message_type, subject, content, metadata, status, created_at, delivered_at, read_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        Object.values(messageData)
      );

      this.logger.info('Message sent', { 
        messageId, 
        fromAgentId: config.fromAgentId, 
        toAgentId: config.toAgentId,
        messageType: config.messageType 
      });

      return this.mapRowToMessage(messageData);
    } catch (error) {
      this.logger.error('Failed to send message', error, config);
      throw error;
    }
  }

  async getMessages(agentId: string, options?: {
    messageType?: MessageType;
    status?: MessageStatus;
    limit?: number;
    includeRead?: boolean;
  }): Promise<AgentMessage[]> {
    try {
      let whereClause = 'WHERE (to_agent_id = ? OR from_agent_id = ?)';
      const params = [agentId, agentId];

      if (options?.messageType) {
        whereClause += ' AND message_type = ?';
        params.push(options.messageType);
      }

      if (options?.status) {
        whereClause += ' AND status = ?';
        params.push(options.status);
      }

      if (options?.includeRead === false) {
        whereClause += ' AND status != ?';
        params.push('read');
      }

      const limitClause = options?.limit ? `LIMIT ${options.limit}` : '';
      
      const sql = `
        SELECT * FROM agent_messages 
        ${whereClause} 
        ORDER BY created_at DESC 
        ${limitClause}
      `;

      const rows = await this.stateService.all<any>(sql, params);
      return rows.map(row => this.mapRowToMessage(row));
    } catch (error) {
      this.logger.error('Failed to get messages', error, { agentId, options });
      throw error;
    }
  }

  async markMessageAsRead(messageId: string, agentId: string): Promise<void> {
    try {
      const now = new Date().toISOString();

      await this.stateService.run(
        'UPDATE agent_messages SET status = ?, read_at = ? WHERE id = ? AND to_agent_id = ?',
        ['read', now, messageId, agentId]
      );

      this.logger.debug('Message marked as read', { messageId, agentId });
    } catch (error) {
      this.logger.error('Failed to mark message as read', error, { messageId, agentId });
      throw error;
    }
  }

  async broadcastMessage(config: {
    fromAgentId: string;
    subject: string;
    content: string;
    targetAgents?: string[]; // if not provided, broadcasts to all active agents
    metadata?: Record<string, any>;
  }): Promise<AgentMessage[]> {
    try {
      let targetAgents = config.targetAgents;

      // If no target agents specified, get all active agents
      if (!targetAgents) {
        const activeAgents = await this.stateService.all<any>(
          'SELECT id FROM agents WHERE status IN (?, ?, ?) AND id != ?',
          ['idle', 'working', 'waiting', config.fromAgentId]
        );
        targetAgents = activeAgents.map(agent => agent.id);
      }

      const messages: AgentMessage[] = [];

      // Send individual messages to each target agent
      for (const targetAgentId of targetAgents) {
        const message = await this.sendMessage({
          fromAgentId: config.fromAgentId,
          toAgentId: targetAgentId,
          messageType: 'broadcast',
          subject: config.subject,
          content: config.content,
          metadata: config.metadata || {}
        });
        messages.push(message);
      }

      this.logger.info('Broadcast message sent', { 
        fromAgentId: config.fromAgentId, 
        targetCount: targetAgents.length 
      });

      return messages;
    } catch (error) {
      this.logger.error('Failed to broadcast message', error, config);
      throw error;
    }
  }

  // Agent Handoffs

  async initiateHandoff(config: {
    taskId: string;
    fromAgentId: string;
    toAgentId: string;
    handoffType: HandoffType;
    contextData?: Record<string, any>;
    notes?: string;
  }): Promise<AgentHandoff> {
    try {
      const handoffId = randomUUID();
      const now = new Date().toISOString();

      const handoffData = {
        id: handoffId,
        task_id: config.taskId,
        from_agent_id: config.fromAgentId,
        to_agent_id: config.toAgentId,
        handoff_type: config.handoffType,
        context_data: JSON.stringify(config.contextData || {}),
        status: 'pending' as HandoffStatus,
        initiated_at: now,
        completed_at: null,
        notes: config.notes || null
      };

      await this.stateService.run(
        `INSERT INTO agent_handoffs (id, task_id, from_agent_id, to_agent_id, handoff_type, context_data, status, initiated_at, completed_at, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        Object.values(handoffData)
      );

      // Send handoff notification message
      await this.sendMessage({
        fromAgentId: config.fromAgentId,
        toAgentId: config.toAgentId,
        messageType: 'handoff',
        subject: `Task Handoff: ${config.handoffType}`,
        content: `You have received a ${config.handoffType} handoff for task ${config.taskId}. ${config.notes || ''}`,
        metadata: { handoff_id: handoffId, task_id: config.taskId }
      });

      this.logger.info('Handoff initiated', { 
        handoffId, 
        taskId: config.taskId,
        fromAgentId: config.fromAgentId,
        toAgentId: config.toAgentId,
        handoffType: config.handoffType
      });

      return this.mapRowToHandoff(handoffData);
    } catch (error) {
      this.logger.error('Failed to initiate handoff', error, config);
      throw error;
    }
  }

  async respondToHandoff(handoffId: string, agentId: string, response: 'accepted' | 'rejected', notes?: string): Promise<void> {
    try {
      const status = response === 'accepted' ? 'accepted' : 'rejected';
      const completedAt = response === 'accepted' ? new Date().toISOString() : null;

      await this.stateService.run(
        'UPDATE agent_handoffs SET status = ?, completed_at = ?, notes = ? WHERE id = ? AND to_agent_id = ?',
        [status, completedAt, notes || '', handoffId, agentId]
      );

      this.logger.info('Handoff response recorded', { handoffId, agentId, response });
    } catch (error) {
      this.logger.error('Failed to respond to handoff', error, { handoffId, agentId, response });
      throw error;
    }
  }

  async getPendingHandoffs(agentId: string): Promise<AgentHandoff[]> {
    try {
      const rows = await this.stateService.all<any>(
        'SELECT * FROM agent_handoffs WHERE to_agent_id = ? AND status = ? ORDER BY initiated_at DESC',
        [agentId, 'pending']
      );
      return rows.map(row => this.mapRowToHandoff(row));
    } catch (error) {
      this.logger.error('Failed to get pending handoffs', error, { agentId });
      throw error;
    }
  }

  async getHandoffHistory(taskId?: string, agentId?: string): Promise<AgentHandoff[]> {
    try {
      let whereClause = '';
      const params: any[] = [];

      if (taskId && agentId) {
        whereClause = 'WHERE task_id = ? AND (from_agent_id = ? OR to_agent_id = ?)';
        params.push(taskId, agentId, agentId);
      } else if (taskId) {
        whereClause = 'WHERE task_id = ?';
        params.push(taskId);
      } else if (agentId) {
        whereClause = 'WHERE from_agent_id = ? OR to_agent_id = ?';
        params.push(agentId, agentId);
      }

      const sql = `
        SELECT * FROM agent_handoffs 
        ${whereClause} 
        ORDER BY initiated_at DESC
      `;

      const rows = await this.stateService.all<any>(sql, params);
      return rows.map(row => this.mapRowToHandoff(row));
    } catch (error) {
      this.logger.error('Failed to get handoff history', error, { taskId, agentId });
      throw error;
    }
  }

  // Helper methods

  private mapRowToMessage(row: any): AgentMessage {
    const message: AgentMessage = {
      id: row.id,
      from_agent_id: row.from_agent_id,
      to_agent_id: row.to_agent_id,
      message_type: row.message_type,
      subject: row.subject,
      content: row.content,
      metadata: this.stateService.parseJsonColumn(row.metadata, {}),
      status: row.status,
      created_at: new Date(row.created_at)
    };
    
    if (row.delivered_at) {
      message.delivered_at = new Date(row.delivered_at);
    }
    if (row.read_at) {
      message.read_at = new Date(row.read_at);
    }
    
    return message;
  }

  private mapRowToHandoff(row: any): AgentHandoff {
    const handoff: AgentHandoff = {
      id: row.id,
      task_id: row.task_id,
      from_agent_id: row.from_agent_id,
      to_agent_id: row.to_agent_id,
      handoff_type: row.handoff_type,
      context_data: this.stateService.parseJsonColumn(row.context_data, {}),
      status: row.status,
      initiated_at: new Date(row.initiated_at),
      notes: row.notes
    };
    
    if (row.completed_at) {
      handoff.completed_at = new Date(row.completed_at);
    }
    
    return handoff;
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      const messageCount = await this.stateService.count('agent_messages');
      const handoffCount = await this.stateService.count('agent_handoffs');
      return {
        status: 'healthy',
        details: { 
          total_messages: messageCount,
          total_handoffs: handoffCount
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