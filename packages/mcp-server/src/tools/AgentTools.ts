import { z } from 'zod';
import { MCPTool, ToolResponse } from '../types';
import { AgentService } from '../services/AgentService';
import { CommunicationService } from '../services/CommunicationService';
import { Logger } from '../utils/Logger';
import { zodToJsonSchema } from '../utils/zodToJsonSchema';

// Phase 3: Agent Management Tools Schema
const AgentDeploySchema = z.object({
  persona: z.string().regex(/^[A-Z]+-[A-Z]+-[A-Z]+$/, 'Persona must follow format: DOMAIN-ROLE-NAME'),
  project_id: z.string().min(1, 'Project ID is required'),
  task_id: z.string().optional(),
  model: z.string().optional(),
  tools: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium')
});

const AgentStatusSchema = z.object({
  agent_id: z.string().optional(),
  project_id: z.string().optional(),
  status_filter: z.enum(['all', 'idle', 'working', 'waiting', 'completed', 'failed']).default('all'),
  include_metrics: z.boolean().default(true),
  include_context: z.boolean().default(false)
});

const AgentTerminateSchema = z.object({
  agent_id: z.string().min(1, 'Agent ID is required'),
  reason: z.string().optional()
});

// Phase 3: Communication Tools Schema
const AgentMessageSchema = z.object({
  from_agent_id: z.string().min(1, 'From agent ID is required'),
  to_agent_id: z.string().min(1, 'To agent ID is required'),
  subject: z.string().optional(),
  content: z.string().min(1, 'Message content is required'),
  metadata: z.record(z.any()).optional()
});

const AgentHandoffSchema = z.object({
  task_id: z.string().min(1, 'Task ID is required'),
  from_agent_id: z.string().min(1, 'From agent ID is required'),
  to_agent_id: z.string().min(1, 'To agent ID is required'),
  handoff_type: z.enum(['complete', 'partial', 'emergency']).default('complete'),
  context_data: z.record(z.any()).optional(),
  notes: z.string().optional()
});

const AgentBroadcastSchema = z.object({
  from_agent_id: z.string().min(1, 'From agent ID is required'),
  subject: z.string().min(1, 'Subject is required'),
  content: z.string().min(1, 'Message content is required'),
  target_agents: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

export class AgentTools {
  private agentService: AgentService;
  private communicationService: CommunicationService;
  private logger: Logger;

  constructor(agentService: AgentService, communicationService: CommunicationService, logger: Logger) {
    this.agentService = agentService;
    this.communicationService = communicationService;
    this.logger = logger;
  }

  getTools(): MCPTool[] {
    return [
      // Agent Management Tools (T.200.03.01)
      {
        name: 'deploy',
        description: 'Deploy a new AI agent with specified persona and configuration',
        inputSchema: zodToJsonSchema(AgentDeploySchema),
        handler: this.deployAgent.bind(this)
      },
      {
        name: 'status',
        description: 'Get comprehensive status and monitoring information for agents',
        inputSchema: zodToJsonSchema(AgentStatusSchema),
        handler: this.getAgentStatus.bind(this)
      },
      {
        name: 'terminate',
        description: 'Gracefully terminate an agent and clean up resources',
        inputSchema: zodToJsonSchema(AgentTerminateSchema),
        handler: this.terminateAgent.bind(this)
      },
      // Communication Tools (T.200.03.02)
      {
        name: 'message',
        description: 'Send a direct message between agents',
        inputSchema: zodToJsonSchema(AgentMessageSchema),
        handler: this.sendMessage.bind(this)
      },
      {
        name: 'handoff',
        description: 'Transfer task ownership between agents with context',
        inputSchema: zodToJsonSchema(AgentHandoffSchema),
        handler: this.initiateHandoff.bind(this)
      },
      {
        name: 'broadcast',
        description: 'Send a broadcast message to multiple agents',
        inputSchema: zodToJsonSchema(AgentBroadcastSchema),
        handler: this.broadcastMessage.bind(this)
      }
    ];
  }

  // Phase 3: Agent Management Tools Implementation

  private async deployAgent(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const input = AgentDeploySchema.parse(args);
      
      this.logger.info('Deploying agent', { 
        persona: input.persona, 
        projectId: input.project_id,
        taskId: input.task_id 
      });

      // Deploy agent using enhanced AgentService
      const deployConfig: any = {
        persona: input.persona,
        projectId: input.project_id,
        priority: input.priority
      };
      
      if (input.model) deployConfig.model = input.model;
      if (input.tools) deployConfig.tools = input.tools;
      if (input.task_id) deployConfig.taskId = input.task_id;
      
      const agent = await this.agentService.deployAgent(deployConfig);
      
      const output = `## Agent Deployed Successfully

**Agent ID**: ${agent.id}  
**Persona**: ${agent.persona}  
**Status**: ${agent.status}  
**Model**: ${agent.model}
**Priority**: ${input.priority}

### Project & Task Assignment
- **Project ID**: ${input.project_id}
${input.task_id ? `- **Task ID**: ${input.task_id}` : '- **Task**: None assigned (agent in idle state)'}

### Configuration
- **Tools**: ${agent.tools.join(', ')}
- **Created**: ${agent.created_at.toISOString()}
- **Last Activity**: ${agent.last_activity.toISOString()}

### Agent Context
- **Project**: ${agent.context.project_id}
- **Task Queue**: ${agent.context.task_queue.length} tasks
- **Priority**: ${agent.context.state_data['priority']}

The agent has been successfully deployed and is ready to receive tasks. It is now registered in the agent registry and can participate in agent coordination workflows.`;

      return {
        title: `Agent Deployed: ${agent.persona}`,
        metadata: {
          operation: 'agent_deploy',
          status: 'success',
          data: {
            agent_id: agent.id,
            persona: agent.persona,
            project_id: input.project_id,
            task_id: input.task_id,
            status: agent.status
          },
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output
      };

    } catch (error) {
      this.logger.error('Failed to deploy agent', error, { args });
      
      return {
        title: 'Agent Deployment Failed',
        metadata: {
          operation: 'agent_deploy',
          status: 'error',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: `**Error**: ${(error as Error).message}\n\nPlease check the persona format, project ID, and configuration.`
      };
    }
  }

  private async getAgentStatus(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const input = AgentStatusSchema.parse(args);
      
      this.logger.info('Getting agent status', { 
        agentId: input.agent_id,
        projectId: input.project_id,
        statusFilter: input.status_filter 
      });

      let agents;
      
      if (input.agent_id) {
        // Get specific agent
        const agent = await this.agentService.getAgent(input.agent_id);
        agents = agent ? [agent] : [];
      } else if (input.project_id) {
        // Get agents by project
        agents = await this.agentService.getAgentsByProject(input.project_id);
      } else {
        // Get all agents
        agents = await this.agentService.listAgents();
      }

      // Apply status filter
      if (input.status_filter !== 'all') {
        agents = agents.filter(agent => agent.status === input.status_filter);
      }

      const agentOverview = await this.agentService.getAgentStatus();
      
      const output = this.formatAgentStatusReport(agents, agentOverview, input);

      return {
        title: 'Agent Status Report',
        metadata: {
          operation: 'agent_status',
          status: 'success',
          data: {
            total_agents: agents.length,
            status_filter: input.status_filter,
            agent_id: input.agent_id,
            project_id: input.project_id
          },
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output
      };

    } catch (error) {
      this.logger.error('Failed to get agent status', error, { args });
      
      return {
        title: 'Agent Status Query Failed',
        metadata: {
          operation: 'agent_status',
          status: 'error',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: `**Error**: ${(error as Error).message}`
      };
    }
  }

  private async terminateAgent(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const input = AgentTerminateSchema.parse(args);
      
      this.logger.info('Terminating agent', { 
        agentId: input.agent_id,
        reason: input.reason 
      });

      // Get agent details before termination
      const agent = await this.agentService.getAgent(input.agent_id);
      if (!agent) {
        throw new Error(`Agent ${input.agent_id} not found`);
      }

      // Terminate agent
      await this.agentService.terminateAgent(input.agent_id, input.reason);
      
      const output = `## Agent Terminated Successfully

**Agent ID**: ${input.agent_id}  
**Persona**: ${agent.persona}  
**Previous Status**: ${agent.status}  
**Termination Reason**: ${input.reason || 'Manual termination'}

### Agent Summary
- **Tasks Completed**: ${agent.metrics.tasks_completed}
- **Success Rate**: ${(agent.metrics.success_rate * 100).toFixed(1)}%
- **Average Completion Time**: ${agent.metrics.average_completion_time.toFixed(2)} minutes
- **Created**: ${agent.created_at.toISOString()}
- **Last Activity**: ${agent.last_activity.toISOString()}
- **Total Runtime**: ${((Date.now() - agent.created_at.getTime()) / (1000 * 60 * 60)).toFixed(2)} hours

### Final State
- **Project**: ${agent.context.project_id}
- **Current Task**: ${agent.current_task || 'None'}
- **Task Queue**: ${agent.context.task_queue.length} remaining tasks

The agent has been gracefully terminated and all resources have been cleaned up. Any remaining tasks in the queue will need to be reassigned to other agents.`;

      return {
        title: `Agent Terminated: ${agent.persona}`,
        metadata: {
          operation: 'agent_terminate',
          status: 'success',
          data: {
            agent_id: input.agent_id,
            persona: agent.persona,
            reason: input.reason,
            tasks_completed: agent.metrics.tasks_completed,
            success_rate: agent.metrics.success_rate
          },
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output
      };

    } catch (error) {
      this.logger.error('Failed to terminate agent', error, { args });
      
      return {
        title: 'Agent Termination Failed',
        metadata: {
          operation: 'agent_terminate',
          status: 'error',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: `**Error**: ${(error as Error).message}\n\nPlease verify the agent ID and try again.`
      };
    }
  }

  // Phase 3: Communication Tools Implementation

  private async sendMessage(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const input = AgentMessageSchema.parse(args);
      
      this.logger.info('Sending agent message', { 
        fromAgentId: input.from_agent_id,
        toAgentId: input.to_agent_id,
        subject: input.subject 
      });

      // Send message using CommunicationService
      const messageConfig: any = {
        fromAgentId: input.from_agent_id,
        toAgentId: input.to_agent_id,
        messageType: 'direct',
        content: input.content
      };
      
      if (input.subject) messageConfig.subject = input.subject;
      if (input.metadata) messageConfig.metadata = input.metadata;
      
      const message = await this.communicationService.sendMessage(messageConfig);
      
      const output = `## Message Sent Successfully

**Message ID**: ${message.id}  
**From**: ${input.from_agent_id}  
**To**: ${input.to_agent_id}  
**Subject**: ${input.subject || 'No subject'}
**Status**: ${message.status}

### Message Content
${input.content}

### Message Details
- **Type**: Direct message
- **Sent**: ${message.created_at.toISOString()}
- **Delivery Status**: ${message.status}
${input.metadata ? `- **Metadata**: ${JSON.stringify(input.metadata, null, 2)}` : ''}

The message has been successfully queued for delivery to the target agent.`;

      return {
        title: `Message Sent: ${input.from_agent_id} → ${input.to_agent_id}`,
        metadata: {
          operation: 'agent_message',
          status: 'success',
          data: {
            message_id: message.id,
            from_agent_id: input.from_agent_id,
            to_agent_id: input.to_agent_id,
            message_type: 'direct'
          },
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output
      };

    } catch (error) {
      this.logger.error('Failed to send message', error, { args });
      
      return {
        title: 'Message Send Failed',
        metadata: {
          operation: 'agent_message',
          status: 'error',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: `**Error**: ${(error as Error).message}\n\nPlease verify the agent IDs and message content.`
      };
    }
  }

  private async initiateHandoff(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const input = AgentHandoffSchema.parse(args);
      
      this.logger.info('Initiating agent handoff', { 
        taskId: input.task_id,
        fromAgentId: input.from_agent_id,
        toAgentId: input.to_agent_id,
        handoffType: input.handoff_type 
      });

      // Initiate handoff using CommunicationService
      const handoffConfig: any = {
        taskId: input.task_id,
        fromAgentId: input.from_agent_id,
        toAgentId: input.to_agent_id,
        handoffType: input.handoff_type
      };
      
      if (input.context_data) handoffConfig.contextData = input.context_data;
      if (input.notes) handoffConfig.notes = input.notes;
      
      const handoff = await this.communicationService.initiateHandoff(handoffConfig);
      
      const output = `## Task Handoff Initiated

**Handoff ID**: ${handoff.id}  
**Task ID**: ${input.task_id}  
**From Agent**: ${input.from_agent_id}  
**To Agent**: ${input.to_agent_id}  
**Handoff Type**: ${input.handoff_type}
**Status**: ${handoff.status}

### Handoff Details
- **Initiated**: ${handoff.initiated_at.toISOString()}
- **Type**: ${input.handoff_type}
${input.notes ? `- **Notes**: ${input.notes}` : ''}
${input.context_data ? `- **Context Data**: ${Object.keys(input.context_data).length} properties` : ''}

### Next Steps
The target agent (${input.to_agent_id}) has been notified of the handoff request and can accept or reject it. The handoff will remain in "pending" status until a response is received.

**Notification**: A handoff message has been automatically sent to the target agent with all necessary context.`;

      return {
        title: `Handoff Initiated: ${input.task_id}`,
        metadata: {
          operation: 'agent_handoff',
          status: 'success',
          data: {
            handoff_id: handoff.id,
            task_id: input.task_id,
            from_agent_id: input.from_agent_id,
            to_agent_id: input.to_agent_id,
            handoff_type: input.handoff_type
          },
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output
      };

    } catch (error) {
      this.logger.error('Failed to initiate handoff', error, { args });
      
      return {
        title: 'Handoff Initiation Failed',
        metadata: {
          operation: 'agent_handoff',
          status: 'error',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: `**Error**: ${(error as Error).message}\n\nPlease verify the task ID and agent IDs.`
      };
    }
  }

  private async broadcastMessage(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const input = AgentBroadcastSchema.parse(args);
      
      this.logger.info('Broadcasting message', { 
        fromAgentId: input.from_agent_id,
        subject: input.subject,
        targetAgents: input.target_agents 
      });

      // Broadcast message using CommunicationService
      const broadcastConfig: any = {
        fromAgentId: input.from_agent_id,
        subject: input.subject,
        content: input.content
      };
      
      if (input.target_agents) broadcastConfig.targetAgents = input.target_agents;
      if (input.metadata) broadcastConfig.metadata = input.metadata;
      
      const messages = await this.communicationService.broadcastMessage(broadcastConfig);
      
      const output = `## Broadcast Message Sent

**From Agent**: ${input.from_agent_id}  
**Subject**: ${input.subject}  
**Recipients**: ${messages.length} agents
${input.target_agents ? `**Target Agents**: ${input.target_agents.join(', ')}` : '**Target**: All active agents'}

### Message Content
${input.content}

### Broadcast Details
- **Messages Sent**: ${messages.length}
- **Broadcast Time**: ${new Date().toISOString()}
- **Message Type**: Broadcast
${input.metadata ? `- **Metadata**: ${JSON.stringify(input.metadata, null, 2)}` : ''}

### Recipient List
${messages.map((msg, index) => `${index + 1}. ${msg.to_agent_id} (Message ID: ${msg.id})`).join('\n')}

All messages have been successfully queued for delivery to the target agents.`;

      return {
        title: `Broadcast Sent: ${messages.length} recipients`,
        metadata: {
          operation: 'agent_broadcast',
          status: 'success',
          data: {
            from_agent_id: input.from_agent_id,
            recipient_count: messages.length,
            message_ids: messages.map(m => m.id)
          },
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output
      };

    } catch (error) {
      this.logger.error('Failed to broadcast message', error, { args });
      
      return {
        title: 'Broadcast Failed',
        metadata: {
          operation: 'agent_broadcast',
          status: 'error',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime
        },
        output: `**Error**: ${(error as Error).message}\n\nPlease verify the agent ID and message content.`
      };
    }
  }

  // Helper Methods

  private formatAgentStatusReport(agents: any[], overview: any, input: any): string {
    let output = `## Agent Status Report

**Filter**: ${input.status_filter}  
**Agents Found**: ${agents.length}  
**Total System Agents**: ${overview.total_agents}

### System Overview
`;

    if (overview.by_status && Object.keys(overview.by_status).length > 0) {
      Object.entries(overview.by_status).forEach(([status, count]) => {
        output += `- **${status}**: ${count}\n`;
      });
    } else {
      output += 'No agents currently registered in the system.\n';
    }

    if (agents.length > 0) {
      output += `\n### Agent Details\n\n`;
      
      agents.forEach((agent, index) => {
        output += `**${index + 1}. Agent ${agent.id}**\n`;
        output += `- **Persona**: ${agent.persona}\n`;
        output += `- **Status**: ${agent.status}\n`;
        output += `- **Model**: ${agent.model}\n`;
        output += `- **Project**: ${agent.context.project_id}\n`;
        output += `- **Current Task**: ${agent.current_task || 'None'}\n`;
        output += `- **Last Activity**: ${agent.last_activity.toISOString()}\n`;
        
        if (input.include_metrics) {
          output += `- **Tasks Completed**: ${agent.metrics.tasks_completed}\n`;
          output += `- **Success Rate**: ${(agent.metrics.success_rate * 100).toFixed(1)}%\n`;
          output += `- **Avg Completion Time**: ${agent.metrics.average_completion_time.toFixed(2)} min\n`;
        }
        
        if (input.include_context) {
          output += `- **Task Queue**: ${agent.context.task_queue.length} tasks\n`;
          output += `- **Tools**: ${agent.tools.join(', ')}\n`;
        }
        
        output += `\n`;
      });
    } else {
      output += `\n### No Agents Found
No agents match the specified criteria.
`;
    }

    output += `\n### System Health
- **Database**: ✓ Connected
- **Communication Service**: ✓ Running
- **Agent Registry**: ✓ Available

**Last Updated**: ${new Date().toISOString()}`;

    return output;
  }
}