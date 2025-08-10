import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AgentTools } from '../../../src/tools/AgentTools';
import { AgentService } from '../../../src/services/AgentService';
import { CommunicationService } from '../../../src/services/CommunicationService';
import { Logger } from '../../../src/utils/Logger';
import { Agent, AgentStatus, AgentMessage, AgentHandoff, MessageStatus, HandoffStatus } from '../../../src/types';
import { z } from 'zod';

describe('AgentTools - Going for 100% Coverage! 🚀', () => {
  let agentTools: AgentTools;
  let mockAgentService: jest.Mocked<AgentService>;
  let mockCommunicationService: jest.Mocked<CommunicationService>;
  let mockLogger: jest.Mocked<Logger>;

  // Mock agent data - Benjamin's comprehensive agent model
  const mockAgent: Agent = {
    id: 'agent-123',
    persona: 'BE-BACKEND-BENJAMIN',
    status: 'idle' as AgentStatus,
    model: 'claude-3-sonnet',
    tools: ['bash', 'edit', 'create'],
    context: {
      project_id: 'project-123',
      task_queue: [],
      conversation_history: [],
      state_data: {
        priority: 'medium',
        specialization: 'backend',
        deployment_config: {
          max_concurrent_tasks: 3,
          timeout_minutes: 30
        }
      }
    },
    metrics: {
      tasks_completed: 15,
      success_rate: 0.9333,
      average_completion_time: 12.5
    },
    created_at: new Date('2025-01-20T08:00:00Z'),
    last_activity: new Date('2025-01-23T11:30:00Z')
  };

  const mockWorkingAgent: Agent = {
    ...mockAgent,
    id: 'agent-456',
    persona: 'FE-FRONTEND-FIONA',
    status: 'working' as AgentStatus,
    current_task: 'task-789',
    context: {
      ...mockAgent.context,
      project_id: 'project-456',
      task_queue: ['task-790', 'task-791']
    },
    metrics: {
      tasks_completed: 8,
      success_rate: 0.875,
      average_completion_time: 18.2
    }
  };

  const mockFailedAgent: Agent = {
    ...mockAgent,
    id: 'agent-789',
    persona: 'QA-QUALITY-QUINN',
    status: 'failed' as AgentStatus,
    current_task: 'task-999',
    metrics: {
      tasks_completed: 3,
      success_rate: 0.6,
      average_completion_time: 25.0
    }
  };

  const mockAgentOverview = {
    total_agents: 10,
    by_status: {
      'idle': 5,
      'working': 3,
      'waiting': 1,
      'failed': 1
    },
    by_project: {
      'project-123': 4,
      'project-456': 3,
      'project-789': 3
    },
    system_health: 'good'
  };

  const mockMessage: AgentMessage = {
    id: 'msg-123',
    from_agent_id: 'agent-123',
    to_agent_id: 'agent-456',
    message_type: 'direct',
    subject: 'Task Coordination',
    content: 'Ready to collaborate on the API endpoints',
    metadata: { priority: 'high', category: 'coordination' },
    status: 'sent' as MessageStatus,
    created_at: new Date('2025-01-23T12:00:00Z')
  };

  const mockHandoff: AgentHandoff = {
    id: 'handoff-123',
    task_id: 'task-789',
    from_agent_id: 'agent-123',
    to_agent_id: 'agent-456',
    handoff_type: 'complete',
    status: 'pending' as HandoffStatus,
    context_data: {
      current_progress: 75,
      next_steps: ['review code', 'run tests'],
      dependencies: ['database-setup']
    },
    notes: 'Backend implementation complete, ready for frontend integration',
    initiated_at: new Date('2025-01-23T12:15:00Z')
  };

  const mockBroadcastMessages: AgentMessage[] = [
    { ...mockMessage, id: 'msg-1', to_agent_id: 'agent-456' },
    { ...mockMessage, id: 'msg-2', to_agent_id: 'agent-789' },
    { ...mockMessage, id: 'msg-3', to_agent_id: 'agent-101' }
  ];

  beforeEach(() => {
    // Create mock logger - same pattern as Felix but with agent-specific context
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      log: jest.fn()
    } as unknown as jest.Mocked<Logger>;

    // Create mock AgentService - Benjamin's domain expertise
    mockAgentService = {
      deployAgent: jest.fn(),
      getAgent: jest.fn(),
      listAgents: jest.fn(),
      getAgentsByProject: jest.fn(),
      getAgentStatus: jest.fn(),
      terminateAgent: jest.fn(),
      initialize: jest.fn()
    } as unknown as jest.Mocked<AgentService>;

    // Create mock CommunicationService - my inter-agent communication system
    mockCommunicationService = {
      sendMessage: jest.fn(),
      initiateHandoff: jest.fn(),
      broadcastMessage: jest.fn(),
      initialize: jest.fn()
    } as unknown as jest.Mocked<CommunicationService>;

    // Create AgentTools instance
    agentTools = new AgentTools(mockAgentService, mockCommunicationService, mockLogger);
  });

  describe('getTools', () => {
    it('should return exactly 6 agent tools', () => {
      const tools = agentTools.getTools();
      
      expect(tools).toHaveLength(6);
      expect(tools.map(t => t.name)).toEqual([
        'mosaic_agent_deploy',
        'mosaic_agent_status', 
        'mosaic_agent_terminate',
        'mosaic_agent_message',
        'mosaic_agent_handoff',
        'mosaic_agent_broadcast'
      ]);
    });

    it('should have correct tool descriptions', () => {
      const tools = agentTools.getTools();
      
      expect(tools[0]?.description).toBe('Deploy a new AI agent with specified persona and configuration');
      expect(tools[1]?.description).toBe('Get comprehensive status and monitoring information for agents');
      expect(tools[2]?.description).toBe('Gracefully terminate an agent and clean up resources');
      expect(tools[3]?.description).toBe('Send a direct message between agents');
      expect(tools[4]?.description).toBe('Transfer task ownership between agents with context');
      expect(tools[5]?.description).toBe('Send a broadcast message to multiple agents');
    });

    it('should have valid input schemas for all tools', () => {
      const tools = agentTools.getTools();
      
      tools.forEach(tool => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema).toBeInstanceOf(z.ZodObject);
      });
    });

    it('should bind handlers correctly to all tools', () => {
      const tools = agentTools.getTools();
      
      tools.forEach(tool => {
        expect(tool.handler).toBeDefined();
        expect(typeof tool.handler).toBe('function');
      });
    });
  });

  describe('mosaic_agent_deploy - The Complex One!', () => {
    describe('input validation', () => {
      it('should require persona field', async () => {
        const result = await (agentTools as any).deployAgent({});

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Required');
        expect(mockAgentService.deployAgent).not.toHaveBeenCalled();
      });

      it('should enforce DOMAIN-ROLE-NAME persona format', async () => {
        const invalidPersonas = [
          'invalid-format',
          'BE-BACKEND',
          'BE-BACKEND-BENJAMIN-EXTRA',
          'be-backend-benjamin',
          'BE_BACKEND_BENJAMIN',
          'BE BACKEND BENJAMIN',
          '123-456-789'
        ];

        for (const persona of invalidPersonas) {
          const result = await (agentTools as any).deployAgent({ 
            persona,
            project_id: 'project-123'
          });

          expect(result.metadata.status).toBe('error');
          expect(result.output).toContain('Persona must follow format: DOMAIN-ROLE-NAME');
          expect(mockAgentService.deployAgent).not.toHaveBeenCalled();
        }
      });

      it('should accept valid DOMAIN-ROLE-NAME persona formats', async () => {
        const validPersonas = [
          'BE-BACKEND-BENJAMIN',
          'FE-FRONTEND-FIONA', 
          'QA-QUALITY-QUINN',
          'DEVOPS-OPERATIONS-OLIVER',
          'SEC-SECURITY-SARAH'
        ];

        for (const persona of validPersonas) {
          mockAgentService.deployAgent.mockResolvedValue({ ...mockAgent, persona });

          const result = await (agentTools as any).deployAgent({ 
            persona,
            project_id: 'project-123'
          });

          expect(result.metadata.status).toBe('success');
          expect(mockAgentService.deployAgent).toHaveBeenCalledWith(
            expect.objectContaining({ persona })
          );
        }
      });

      it('should require project_id field', async () => {
        const result = await (agentTools as any).deployAgent({ 
          persona: 'BE-BACKEND-BENJAMIN'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Required');
        expect(mockAgentService.deployAgent).not.toHaveBeenCalled();
      });

      it('should reject empty project_id', async () => {
        const result = await (agentTools as any).deployAgent({ 
          persona: 'BE-BACKEND-BENJAMIN',
          project_id: ''
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Project ID is required');
        expect(mockAgentService.deployAgent).not.toHaveBeenCalled();
      });

      it('should accept optional task_id', async () => {
        mockAgentService.deployAgent.mockResolvedValue(mockAgent);

        const result = await (agentTools as any).deployAgent({ 
          persona: 'BE-BACKEND-BENJAMIN',
          project_id: 'project-123',
          task_id: 'task-456'
        });

        expect(result.metadata.status).toBe('success');
        expect(mockAgentService.deployAgent).toHaveBeenCalledWith(
          expect.objectContaining({ taskId: 'task-456' })
        );
      });

      it('should accept optional model specification', async () => {
        mockAgentService.deployAgent.mockResolvedValue({ ...mockAgent, model: 'claude-3-opus' });

        const result = await (agentTools as any).deployAgent({ 
          persona: 'BE-BACKEND-BENJAMIN',
          project_id: 'project-123',
          model: 'claude-3-opus'
        });

        expect(result.metadata.status).toBe('success');
        expect(mockAgentService.deployAgent).toHaveBeenCalledWith(
          expect.objectContaining({ model: 'claude-3-opus' })
        );
      });

      it('should accept optional tools array', async () => {
        const tools = ['bash', 'edit', 'read', 'write'];
        mockAgentService.deployAgent.mockResolvedValue({ ...mockAgent, tools });

        const result = await (agentTools as any).deployAgent({ 
          persona: 'BE-BACKEND-BENJAMIN',
          project_id: 'project-123',
          tools
        });

        expect(result.metadata.status).toBe('success');
        expect(mockAgentService.deployAgent).toHaveBeenCalledWith(
          expect.objectContaining({ tools })
        );
      });

      it('should accept valid priority values', async () => {
        const priorities = ['low', 'medium', 'high'];
        
        for (const priority of priorities) {
          mockAgentService.deployAgent.mockResolvedValue(mockAgent);

          const result = await (agentTools as any).deployAgent({ 
            persona: 'BE-BACKEND-BENJAMIN',
            project_id: 'project-123',
            priority
          });

          expect(result.metadata.status).toBe('success');
          expect(mockAgentService.deployAgent).toHaveBeenCalledWith(
            expect.objectContaining({ priority })
          );
        }
      });

      it('should default priority to medium', async () => {
        mockAgentService.deployAgent.mockResolvedValue(mockAgent);

        const result = await (agentTools as any).deployAgent({ 
          persona: 'BE-BACKEND-BENJAMIN',
          project_id: 'project-123'
        });

        expect(result.metadata.status).toBe('success');
        expect(mockAgentService.deployAgent).toHaveBeenCalledWith(
          expect.objectContaining({ priority: 'medium' })
        );
      });

      it('should reject invalid priority values', async () => {
        const result = await (agentTools as any).deployAgent({ 
          persona: 'BE-BACKEND-BENJAMIN',
          project_id: 'project-123',
          priority: 'urgent'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Invalid enum value');
        expect(mockAgentService.deployAgent).not.toHaveBeenCalled();
      });

      it('should reject invalid tools type', async () => {
        const result = await (agentTools as any).deployAgent({ 
          persona: 'BE-BACKEND-BENJAMIN',
          project_id: 'project-123',
          tools: 'not-an-array'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Expected array');
        expect(mockAgentService.deployAgent).not.toHaveBeenCalled();
      });
    });

    describe('service integration', () => {
      it('should deploy agent with minimal configuration', async () => {
        mockAgentService.deployAgent.mockResolvedValue(mockAgent);

        const result = await (agentTools as any).deployAgent({ 
          persona: 'BE-BACKEND-BENJAMIN',
          project_id: 'project-123'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.agent_id).toBe('agent-123');
        expect(result.metadata.data.persona).toBe('BE-BACKEND-BENJAMIN');
        expect(result.metadata.data.project_id).toBe('project-123');
        expect(mockAgentService.deployAgent).toHaveBeenCalledWith({
          persona: 'BE-BACKEND-BENJAMIN',
          projectId: 'project-123',
          priority: 'medium'
        });
      });

      it('should deploy agent with full configuration', async () => {
        const fullConfig = {
          persona: 'BE-BACKEND-BENJAMIN',
          project_id: 'project-123',
          task_id: 'task-456',
          model: 'claude-3-opus',
          tools: ['bash', 'edit', 'read'],
          priority: 'high'
        };
        mockAgentService.deployAgent.mockResolvedValue({ 
          ...mockAgent, 
          model: 'claude-3-opus',
          tools: ['bash', 'edit', 'read']
        });

        const result = await (agentTools as any).deployAgent(fullConfig);

        expect(result.metadata.status).toBe('success');
        expect(mockAgentService.deployAgent).toHaveBeenCalledWith({
          persona: 'BE-BACKEND-BENJAMIN',
          projectId: 'project-123',
          priority: 'high',
          model: 'claude-3-opus',
          tools: ['bash', 'edit', 'read'],
          taskId: 'task-456'
        });
      });

      it('should handle deployment failures gracefully', async () => {
        mockAgentService.deployAgent.mockRejectedValue(new Error('Persona validation failed'));

        const result = await (agentTools as any).deployAgent({ 
          persona: 'BE-BACKEND-BENJAMIN',
          project_id: 'project-123'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Persona validation failed');
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to deploy agent',
          expect.any(Error),
          expect.any(Object)
        );
      });

      it('should handle resource limit errors', async () => {
        mockAgentService.deployAgent.mockRejectedValue(new Error('Maximum concurrent agents reached'));

        const result = await (agentTools as any).deployAgent({ 
          persona: 'BE-BACKEND-BENJAMIN',
          project_id: 'project-123'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Maximum concurrent agents reached');
      });
    });

    describe('output formatting', () => {
      it('should format deployment success with all details', async () => {
        mockAgentService.deployAgent.mockResolvedValue(mockAgent);

        const result = await (agentTools as any).deployAgent({ 
          persona: 'BE-BACKEND-BENJAMIN',
          project_id: 'project-123',
          task_id: 'task-456'
        });

        expect(result.output).toContain('Agent Deployed Successfully');
        expect(result.output).toContain('**Agent ID**: agent-123');
        expect(result.output).toContain('**Persona**: BE-BACKEND-BENJAMIN');
        expect(result.output).toContain('**Status**: idle');
        expect(result.output).toContain('**Model**: claude-3-sonnet');
        expect(result.output).toContain('**Project ID**: project-123');
        expect(result.output).toContain('**Task ID**: task-456');
        expect(result.output).toContain('**Tools**: bash, edit, create');
      });

      it('should handle agent without task assignment', async () => {
        mockAgentService.deployAgent.mockResolvedValue(mockAgent);

        const result = await (agentTools as any).deployAgent({ 
          persona: 'BE-BACKEND-BENJAMIN',
          project_id: 'project-123'
        });

        expect(result.output).toContain('**Task**: None assigned (agent in idle state)');
      });

      it('should include execution time in metadata', async () => {
        mockAgentService.deployAgent.mockResolvedValue(mockAgent);

        const result = await (agentTools as any).deployAgent({ 
          persona: 'BE-BACKEND-BENJAMIN',
          project_id: 'project-123'
        });

        expect(result.metadata.execution_time_ms).toBeDefined();
        expect(typeof result.metadata.execution_time_ms).toBe('number');
        expect(result.metadata.execution_time_ms).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('mosaic_agent_status - Monitoring System', () => {
    describe('input validation', () => {
      it('should accept query with no parameters', async () => {
        mockAgentService.listAgents.mockResolvedValue([mockAgent]);
        mockAgentService.getAgentStatus.mockResolvedValue(mockAgentOverview);

        const result = await (agentTools as any).getAgentStatus({});

        expect(result.metadata.status).toBe('success');
        expect(mockAgentService.listAgents).toHaveBeenCalled();
      });

      it('should accept optional agent_id', async () => {
        mockAgentService.getAgent.mockResolvedValue(mockAgent);
        mockAgentService.getAgentStatus.mockResolvedValue(mockAgentOverview);

        const result = await (agentTools as any).getAgentStatus({ agent_id: 'agent-123' });

        expect(result.metadata.status).toBe('success');
        expect(mockAgentService.getAgent).toHaveBeenCalledWith('agent-123');
      });

      it('should accept optional project_id', async () => {
        mockAgentService.getAgentsByProject.mockResolvedValue([mockAgent]);
        mockAgentService.getAgentStatus.mockResolvedValue(mockAgentOverview);

        const result = await (agentTools as any).getAgentStatus({ project_id: 'project-123' });

        expect(result.metadata.status).toBe('success');
        expect(mockAgentService.getAgentsByProject).toHaveBeenCalledWith('project-123');
      });

      it('should accept valid status filter values', async () => {
        const filters = ['all', 'idle', 'working', 'waiting', 'completed', 'failed'];
        
        for (const filter of filters) {
          mockAgentService.listAgents.mockResolvedValue([mockAgent]);
          mockAgentService.getAgentStatus.mockResolvedValue(mockAgentOverview);

          const result = await (agentTools as any).getAgentStatus({ status_filter: filter });

          expect(result.metadata.status).toBe('success');
          expect(result.metadata.data.status_filter).toBe(filter);
        }
      });

      it('should reject invalid status filter', async () => {
        const result = await (agentTools as any).getAgentStatus({ status_filter: 'invalid' });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Invalid enum value');
        expect(mockAgentService.listAgents).not.toHaveBeenCalled();
      });

      it('should accept include_metrics boolean', async () => {
        mockAgentService.listAgents.mockResolvedValue([mockAgent]);
        mockAgentService.getAgentStatus.mockResolvedValue(mockAgentOverview);

        const result = await (agentTools as any).getAgentStatus({ include_metrics: false });

        expect(result.metadata.status).toBe('success');
        expect(result.output).not.toContain('Tasks Completed');
      });

      it('should accept include_context boolean', async () => {
        mockAgentService.listAgents.mockResolvedValue([mockAgent]);
        mockAgentService.getAgentStatus.mockResolvedValue(mockAgentOverview);

        const result = await (agentTools as any).getAgentStatus({ include_context: true });

        expect(result.metadata.status).toBe('success');
        expect(result.output).toContain('Task Queue');
      });

      it('should default include_metrics to true', async () => {
        mockAgentService.listAgents.mockResolvedValue([mockAgent]);
        mockAgentService.getAgentStatus.mockResolvedValue(mockAgentOverview);

        const result = await (agentTools as any).getAgentStatus({});

        expect(result.output).toContain('Tasks Completed');
      });

      it('should default include_context to false', async () => {
        mockAgentService.listAgents.mockResolvedValue([mockAgent]);
        mockAgentService.getAgentStatus.mockResolvedValue(mockAgentOverview);

        const result = await (agentTools as any).getAgentStatus({});

        expect(result.output).not.toContain('Task Queue');
      });
    });

    describe('service integration', () => {
      it('should get status for specific agent', async () => {
        mockAgentService.getAgent.mockResolvedValue(mockAgent);
        mockAgentService.getAgentStatus.mockResolvedValue(mockAgentOverview);

        const result = await (agentTools as any).getAgentStatus({ agent_id: 'agent-123' });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.total_agents).toBe(1);
        expect(result.metadata.data.agent_id).toBe('agent-123');
      });

      it('should handle agent not found', async () => {
        mockAgentService.getAgent.mockResolvedValue(null);
        mockAgentService.getAgentStatus.mockResolvedValue(mockAgentOverview);

        const result = await (agentTools as any).getAgentStatus({ agent_id: 'agent-999' });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.total_agents).toBe(0);
      });

      it('should get agents by project', async () => {
        mockAgentService.getAgentsByProject.mockResolvedValue([mockAgent, mockWorkingAgent]);
        mockAgentService.getAgentStatus.mockResolvedValue(mockAgentOverview);

        const result = await (agentTools as any).getAgentStatus({ project_id: 'project-123' });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.total_agents).toBe(2);
        expect(result.metadata.data.project_id).toBe('project-123');
      });

      it('should filter agents by status', async () => {
        mockAgentService.listAgents.mockResolvedValue([mockAgent, mockWorkingAgent, mockFailedAgent]);
        mockAgentService.getAgentStatus.mockResolvedValue(mockAgentOverview);

        const result = await (agentTools as any).getAgentStatus({ status_filter: 'working' });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.total_agents).toBe(1);
        expect(result.output).toContain('FE-FRONTEND-FIONA');
        expect(result.output).not.toContain('BE-BACKEND-BENJAMIN');
      });

      it('should include all agents when filter is all', async () => {
        mockAgentService.listAgents.mockResolvedValue([mockAgent, mockWorkingAgent, mockFailedAgent]);
        mockAgentService.getAgentStatus.mockResolvedValue(mockAgentOverview);

        const result = await (agentTools as any).getAgentStatus({ status_filter: 'all' });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.total_agents).toBe(3);
        expect(result.output).toContain('BE-BACKEND-BENJAMIN');
        expect(result.output).toContain('FE-FRONTEND-FIONA');
        expect(result.output).toContain('QA-QUALITY-QUINN');
      });

      it('should handle service errors gracefully', async () => {
        mockAgentService.listAgents.mockRejectedValue(new Error('Database connection failed'));

        const result = await (agentTools as any).getAgentStatus({});

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Database connection failed');
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to get agent status',
          expect.any(Error),
          expect.any(Object)
        );
      });
    });

    describe('output formatting', () => {
      it('should format comprehensive status report', async () => {
        mockAgentService.listAgents.mockResolvedValue([mockAgent, mockWorkingAgent]);
        mockAgentService.getAgentStatus.mockResolvedValue(mockAgentOverview);

        const result = await (agentTools as any).getAgentStatus({ include_metrics: true });

        expect(result.output).toContain('Agent Status Report');
        expect(result.output).toContain('**Filter**: all');
        expect(result.output).toContain('**Agents Found**: 2');
        expect(result.output).toContain('**Total System Agents**: 10');
        expect(result.output).toContain('System Overview');
        expect(result.output).toContain('- **idle**: 5');
        expect(result.output).toContain('- **working**: 3');
      });

      it('should include metrics when requested', async () => {
        mockAgentService.listAgents.mockResolvedValue([mockAgent]);
        mockAgentService.getAgentStatus.mockResolvedValue(mockAgentOverview);

        const result = await (agentTools as any).getAgentStatus({ include_metrics: true });

        expect(result.output).toContain('**Tasks Completed**: 15');
        expect(result.output).toContain('**Success Rate**: 93.3%');
        expect(result.output).toContain('**Avg Completion Time**: 12.50 min');
      });

      it('should include context when requested', async () => {
        mockAgentService.listAgents.mockResolvedValue([mockWorkingAgent]);
        mockAgentService.getAgentStatus.mockResolvedValue(mockAgentOverview);

        const result = await (agentTools as any).getAgentStatus({ include_context: true });

        expect(result.output).toContain('**Task Queue**: 2 tasks');
        expect(result.output).toContain('**Tools**: bash, edit, create');
      });

      it('should handle empty agent list', async () => {
        mockAgentService.listAgents.mockResolvedValue([]);
        mockAgentService.getAgentStatus.mockResolvedValue({ 
          total_agents: 0, 
          by_status: {},
          by_project: {},
          system_health: 'good'
        });

        const result = await (agentTools as any).getAgentStatus({});

        expect(result.output).toContain('No agents currently registered in the system');
        expect(result.output).toContain('No Agents Found');
      });
    });
  });

  describe('mosaic_agent_terminate - Graceful Shutdown', () => {
    describe('input validation', () => {
      it('should require agent_id field', async () => {
        const result = await (agentTools as any).terminateAgent({});

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Required');
        expect(mockAgentService.terminateAgent).not.toHaveBeenCalled();
      });

      it('should reject empty agent_id', async () => {
        const result = await (agentTools as any).terminateAgent({ agent_id: '' });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Agent ID is required');
        expect(mockAgentService.terminateAgent).not.toHaveBeenCalled();
      });

      it('should accept valid agent_id', async () => {
        mockAgentService.getAgent.mockResolvedValue(mockAgent);
        mockAgentService.terminateAgent.mockResolvedValue(undefined);

        const result = await (agentTools as any).terminateAgent({ agent_id: 'agent-123' });

        expect(result.metadata.status).toBe('success');
        expect(mockAgentService.terminateAgent).toHaveBeenCalledWith('agent-123', undefined);
      });

      it('should accept optional reason', async () => {
        mockAgentService.getAgent.mockResolvedValue(mockAgent);
        mockAgentService.terminateAgent.mockResolvedValue(undefined);

        const result = await (agentTools as any).terminateAgent({ 
          agent_id: 'agent-123',
          reason: 'Task completed successfully'
        });

        expect(result.metadata.status).toBe('success');
        expect(mockAgentService.terminateAgent).toHaveBeenCalledWith('agent-123', 'Task completed successfully');
      });
    });

    describe('service integration', () => {
      it('should terminate agent successfully', async () => {
        mockAgentService.getAgent.mockResolvedValue(mockAgent);
        mockAgentService.terminateAgent.mockResolvedValue(undefined);

        const result = await (agentTools as any).terminateAgent({ 
          agent_id: 'agent-123',
          reason: 'Manual termination'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.agent_id).toBe('agent-123');
        expect(result.metadata.data.persona).toBe('BE-BACKEND-BENJAMIN');
        expect(result.metadata.data.reason).toBe('Manual termination');
        expect(result.metadata.data.tasks_completed).toBe(15);
        expect(result.metadata.data.success_rate).toBe(0.9333);
      });

      it('should handle agent not found', async () => {
        mockAgentService.getAgent.mockResolvedValue(null);

        const result = await (agentTools as any).terminateAgent({ agent_id: 'agent-999' });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Agent agent-999 not found');
        expect(mockAgentService.terminateAgent).not.toHaveBeenCalled();
      });

      it('should handle termination failures', async () => {
        mockAgentService.getAgent.mockResolvedValue(mockAgent);
        mockAgentService.terminateAgent.mockRejectedValue(new Error('Agent is currently processing critical task'));

        const result = await (agentTools as any).terminateAgent({ agent_id: 'agent-123' });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Agent is currently processing critical task');
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to terminate agent',
          expect.any(Error),
          expect.any(Object)
        );
      });
    });

    describe('output formatting', () => {
      it('should format termination success with comprehensive details', async () => {
        const agentWithTask = { 
          ...mockAgent, 
          current_task: 'task-789',
          context: {
            ...mockAgent.context,
            task_queue: ['task-790', 'task-791']
          }
        };
        mockAgentService.getAgent.mockResolvedValue(agentWithTask);
        mockAgentService.terminateAgent.mockResolvedValue(undefined);

        const result = await (agentTools as any).terminateAgent({ 
          agent_id: 'agent-123',
          reason: 'Project completed'
        });

        expect(result.output).toContain('Agent Terminated Successfully');
        expect(result.output).toContain('**Agent ID**: agent-123');
        expect(result.output).toContain('**Persona**: BE-BACKEND-BENJAMIN');
        expect(result.output).toContain('**Previous Status**: idle');
        expect(result.output).toContain('**Termination Reason**: Project completed');
        expect(result.output).toContain('**Tasks Completed**: 15');
        expect(result.output).toContain('**Success Rate**: 93.3%');
        expect(result.output).toContain('**Average Completion Time**: 12.50 minutes');
        expect(result.output).toContain('**Current Task**: task-789');
        expect(result.output).toContain('**Task Queue**: 2 remaining tasks');
      });

      it('should handle agent with no current task', async () => {
        mockAgentService.getAgent.mockResolvedValue(mockAgent);
        mockAgentService.terminateAgent.mockResolvedValue(undefined);

        const result = await (agentTools as any).terminateAgent({ agent_id: 'agent-123' });

        expect(result.output).toContain('**Current Task**: None');
        expect(result.output).toContain('**Termination Reason**: Manual termination');
      });

      it('should calculate total runtime correctly', async () => {
        const fixedTime = Date.now();
        jest.spyOn(Date, 'now').mockReturnValue(fixedTime);
        
        const testAgent = {
          ...mockAgent,
          created_at: new Date(fixedTime - (2 * 60 * 60 * 1000)) // 2 hours ago
        };
        mockAgentService.getAgent.mockResolvedValue(testAgent);
        mockAgentService.terminateAgent.mockResolvedValue(undefined);

        const result = await (agentTools as any).terminateAgent({ agent_id: 'agent-123' });

        expect(result.output).toContain('**Total Runtime**: 2.00 hours');
        
        jest.restoreAllMocks();
      });
    });
  });

  describe('mosaic_agent_message - Direct Communication', () => {
    describe('input validation', () => {
      it('should require from_agent_id field', async () => {
        const result = await (agentTools as any).sendMessage({});

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Required');
        expect(mockCommunicationService.sendMessage).not.toHaveBeenCalled();
      });

      it('should require to_agent_id field', async () => {
        const result = await (agentTools as any).sendMessage({ from_agent_id: 'agent-123' });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Required');
        expect(mockCommunicationService.sendMessage).not.toHaveBeenCalled();
      });

      it('should require content field', async () => {
        const result = await (agentTools as any).sendMessage({ 
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Required');
        expect(mockCommunicationService.sendMessage).not.toHaveBeenCalled();
      });

      it('should reject empty from_agent_id', async () => {
        const result = await (agentTools as any).sendMessage({ 
          from_agent_id: '',
          to_agent_id: 'agent-456',
          content: 'Hello'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('From agent ID is required');
        expect(mockCommunicationService.sendMessage).not.toHaveBeenCalled();
      });

      it('should reject empty to_agent_id', async () => {
        const result = await (agentTools as any).sendMessage({ 
          from_agent_id: 'agent-123',
          to_agent_id: '',
          content: 'Hello'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('To agent ID is required');
        expect(mockCommunicationService.sendMessage).not.toHaveBeenCalled();
      });

      it('should reject empty content', async () => {
        const result = await (agentTools as any).sendMessage({ 
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456',
          content: ''
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Message content is required');
        expect(mockCommunicationService.sendMessage).not.toHaveBeenCalled();
      });

      it('should accept optional subject', async () => {
        mockCommunicationService.sendMessage.mockResolvedValue(mockMessage);

        const result = await (agentTools as any).sendMessage({ 
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456',
          content: 'Hello',
          subject: 'Coordination Meeting'
        });

        expect(result.metadata.status).toBe('success');
        expect(mockCommunicationService.sendMessage).toHaveBeenCalledWith(
          expect.objectContaining({ subject: 'Coordination Meeting' })
        );
      });

      it('should accept optional metadata', async () => {
        const metadata = { priority: 'high', category: 'urgent' };
        mockCommunicationService.sendMessage.mockResolvedValue(mockMessage);

        const result = await (agentTools as any).sendMessage({ 
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456',
          content: 'Hello',
          metadata
        });

        expect(result.metadata.status).toBe('success');
        expect(mockCommunicationService.sendMessage).toHaveBeenCalledWith(
          expect.objectContaining({ metadata })
        );
      });
    });

    describe('service integration', () => {
      it('should send message with minimal configuration', async () => {
        mockCommunicationService.sendMessage.mockResolvedValue(mockMessage);

        const result = await (agentTools as any).sendMessage({ 
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456',
          content: 'Ready to start collaboration'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.message_id).toBe('msg-123');
        expect(result.metadata.data.from_agent_id).toBe('agent-123');
        expect(result.metadata.data.to_agent_id).toBe('agent-456');
        expect(result.metadata.data.message_type).toBe('direct');
        expect(mockCommunicationService.sendMessage).toHaveBeenCalledWith({
          fromAgentId: 'agent-123',
          toAgentId: 'agent-456',
          messageType: 'direct',
          content: 'Ready to start collaboration'
        });
      });

      it('should send message with full configuration', async () => {
        const fullMessage = {
          ...mockMessage,
          subject: 'Task Coordination',
          metadata: { priority: 'high', category: 'coordination' }
        };
        mockCommunicationService.sendMessage.mockResolvedValue(fullMessage);

        const result = await (agentTools as any).sendMessage({ 
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456',
          subject: 'Task Coordination',
          content: 'Ready to start collaboration',
          metadata: { priority: 'high', category: 'coordination' }
        });

        expect(result.metadata.status).toBe('success');
        expect(mockCommunicationService.sendMessage).toHaveBeenCalledWith({
          fromAgentId: 'agent-123',
          toAgentId: 'agent-456',
          messageType: 'direct',
          content: 'Ready to start collaboration',
          subject: 'Task Coordination',
          metadata: { priority: 'high', category: 'coordination' }
        });
      });

      it('should handle messaging failures', async () => {
        mockCommunicationService.sendMessage.mockRejectedValue(new Error('Agent not available'));

        const result = await (agentTools as any).sendMessage({ 
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-999',
          content: 'Hello'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Agent not available');
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to send message',
          expect.any(Error),
          expect.any(Object)
        );
      });
    });

    describe('output formatting', () => {
      it('should format message success with full details', async () => {
        mockCommunicationService.sendMessage.mockResolvedValue(mockMessage);

        const result = await (agentTools as any).sendMessage({ 
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456',
          subject: 'Task Coordination',
          content: 'Ready to collaborate on the API endpoints',
          metadata: { priority: 'high', category: 'coordination' }
        });

        expect(result.output).toContain('Message Sent Successfully');
        expect(result.output).toContain('**Message ID**: msg-123');
        expect(result.output).toContain('**From**: agent-123');
        expect(result.output).toContain('**To**: agent-456');
        expect(result.output).toContain('**Subject**: Task Coordination');
        expect(result.output).toContain('**Status**: sent');
        expect(result.output).toContain('Ready to collaborate on the API endpoints');
        expect(result.output).toContain('**Type**: Direct message');
        expect(result.output).toContain('**Metadata**:');
      });

      it('should handle message without subject', async () => {
        const messageNoSubject = {
          id: 'msg-no-subject',
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456',
          message_type: 'direct' as const,
          content: 'Hello without subject',
          metadata: {},
          status: 'sent' as MessageStatus,
          created_at: new Date('2025-01-23T12:00:00Z')
        };
        mockCommunicationService.sendMessage.mockResolvedValue(messageNoSubject);

        const result = await (agentTools as any).sendMessage({ 
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456',
          content: 'Hello'
        });

        expect(result.output).toContain('**Subject**: No subject');
      });

      it('should handle message without metadata', async () => {
        const messageNoMetadata = { ...mockMessage, metadata: {} };
        mockCommunicationService.sendMessage.mockResolvedValue(messageNoMetadata);

        const result = await (agentTools as any).sendMessage({ 
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456',
          content: 'Hello'
        });

        expect(result.output).not.toContain('**Metadata**:');
      });
    });
  });

  describe('mosaic_agent_handoff - The Crown Jewel!', () => {
    describe('input validation', () => {
      it('should require task_id field', async () => {
        const result = await (agentTools as any).initiateHandoff({});

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Required');
        expect(mockCommunicationService.initiateHandoff).not.toHaveBeenCalled();
      });

      it('should require from_agent_id field', async () => {
        const result = await (agentTools as any).initiateHandoff({ task_id: 'task-123' });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Required');
        expect(mockCommunicationService.initiateHandoff).not.toHaveBeenCalled();
      });

      it('should require to_agent_id field', async () => {
        const result = await (agentTools as any).initiateHandoff({ 
          task_id: 'task-123',
          from_agent_id: 'agent-123'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Required');
        expect(mockCommunicationService.initiateHandoff).not.toHaveBeenCalled();
      });

      it('should reject empty task_id', async () => {
        const result = await (agentTools as any).initiateHandoff({ 
          task_id: '',
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Task ID is required');
        expect(mockCommunicationService.initiateHandoff).not.toHaveBeenCalled();
      });

      it('should reject empty from_agent_id', async () => {
        const result = await (agentTools as any).initiateHandoff({ 
          task_id: 'task-123',
          from_agent_id: '',
          to_agent_id: 'agent-456'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('From agent ID is required');
        expect(mockCommunicationService.initiateHandoff).not.toHaveBeenCalled();
      });

      it('should reject empty to_agent_id', async () => {
        const result = await (agentTools as any).initiateHandoff({ 
          task_id: 'task-123',
          from_agent_id: 'agent-123',
          to_agent_id: ''
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('To agent ID is required');
        expect(mockCommunicationService.initiateHandoff).not.toHaveBeenCalled();
      });

      it('should accept valid handoff_type values', async () => {
        const handoffTypes = ['complete', 'partial', 'emergency'];
        
        for (const handoffType of handoffTypes) {
          mockCommunicationService.initiateHandoff.mockResolvedValue({ 
            ...mockHandoff, 
            handoff_type: handoffType as any 
          });

          const result = await (agentTools as any).initiateHandoff({ 
            task_id: 'task-123',
            from_agent_id: 'agent-123',
            to_agent_id: 'agent-456',
            handoff_type: handoffType
          });

          expect(result.metadata.status).toBe('success');
          expect(mockCommunicationService.initiateHandoff).toHaveBeenCalledWith(
            expect.objectContaining({ handoffType })
          );
        }
      });

      it('should default handoff_type to complete', async () => {
        mockCommunicationService.initiateHandoff.mockResolvedValue(mockHandoff);

        const result = await (agentTools as any).initiateHandoff({ 
          task_id: 'task-123',
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456'
        });

        expect(result.metadata.status).toBe('success');
        expect(mockCommunicationService.initiateHandoff).toHaveBeenCalledWith(
          expect.objectContaining({ handoffType: 'complete' })
        );
      });

      it('should reject invalid handoff_type', async () => {
        const result = await (agentTools as any).initiateHandoff({ 
          task_id: 'task-123',
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456',
          handoff_type: 'invalid'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Invalid enum value');
        expect(mockCommunicationService.initiateHandoff).not.toHaveBeenCalled();
      });

      it('should accept optional context_data', async () => {
        const contextData = { 
          progress: 75, 
          files_modified: ['api.ts', 'service.ts'],
          next_steps: ['testing', 'deployment']
        };
        mockCommunicationService.initiateHandoff.mockResolvedValue(mockHandoff);

        const result = await (agentTools as any).initiateHandoff({ 
          task_id: 'task-123',
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456',
          context_data: contextData
        });

        expect(result.metadata.status).toBe('success');
        expect(mockCommunicationService.initiateHandoff).toHaveBeenCalledWith(
          expect.objectContaining({ contextData })
        );
      });

      it('should accept optional notes', async () => {
        mockCommunicationService.initiateHandoff.mockResolvedValue(mockHandoff);

        const result = await (agentTools as any).initiateHandoff({ 
          task_id: 'task-123',
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456',
          notes: 'Database schema has been optimized, ready for frontend integration'
        });

        expect(result.metadata.status).toBe('success');
        expect(mockCommunicationService.initiateHandoff).toHaveBeenCalledWith(
          expect.objectContaining({ 
            notes: 'Database schema has been optimized, ready for frontend integration' 
          })
        );
      });
    });

    describe('service integration', () => {
      it('should initiate complete handoff successfully', async () => {
        mockCommunicationService.initiateHandoff.mockResolvedValue(mockHandoff);

        const result = await (agentTools as any).initiateHandoff({ 
          task_id: 'task-789',
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456',
          handoff_type: 'complete'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.handoff_id).toBe('handoff-123');
        expect(result.metadata.data.task_id).toBe('task-789');
        expect(result.metadata.data.from_agent_id).toBe('agent-123');
        expect(result.metadata.data.to_agent_id).toBe('agent-456');
        expect(result.metadata.data.handoff_type).toBe('complete');
        expect(mockCommunicationService.initiateHandoff).toHaveBeenCalledWith({
          taskId: 'task-789',
          fromAgentId: 'agent-123',
          toAgentId: 'agent-456',
          handoffType: 'complete'
        });
      });

      it('should initiate partial handoff with context', async () => {
        const partialHandoff = { 
          ...mockHandoff, 
          handoff_type: 'partial' as any,
          context_data: {
            completed_components: ['authentication', 'database'],
            remaining_components: ['ui', 'testing'],
            shared_resources: ['config.json', 'types.ts']
          }
        };
        mockCommunicationService.initiateHandoff.mockResolvedValue(partialHandoff);

        const result = await (agentTools as any).initiateHandoff({ 
          task_id: 'task-789',
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456',
          handoff_type: 'partial',
          context_data: partialHandoff.context_data,
          notes: 'Backend components ready, UI work needed'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.handoff_type).toBe('partial');
        expect(mockCommunicationService.initiateHandoff).toHaveBeenCalledWith(
          expect.objectContaining({
            handoffType: 'partial',
            contextData: partialHandoff.context_data,
            notes: 'Backend components ready, UI work needed'
          })
        );
      });

      it('should initiate emergency handoff', async () => {
        const emergencyHandoff = { 
          ...mockHandoff, 
          handoff_type: 'emergency' as any,
          notes: 'Critical bug found, immediate handoff required'
        };
        mockCommunicationService.initiateHandoff.mockResolvedValue(emergencyHandoff);

        const result = await (agentTools as any).initiateHandoff({ 
          task_id: 'task-789',
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456',
          handoff_type: 'emergency',
          notes: 'Critical bug found, immediate handoff required'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.handoff_type).toBe('emergency');
      });

      it('should handle handoff failures gracefully', async () => {
        mockCommunicationService.initiateHandoff.mockRejectedValue(
          new Error('Target agent is not available')
        );

        const result = await (agentTools as any).initiateHandoff({ 
          task_id: 'task-789',
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-999'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Target agent is not available');
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to initiate handoff',
          expect.any(Error),
          expect.any(Object)
        );
      });

      it('should handle task ownership conflicts', async () => {
        mockCommunicationService.initiateHandoff.mockRejectedValue(
          new Error('Task is already assigned to another agent')
        );

        const result = await (agentTools as any).initiateHandoff({ 
          task_id: 'task-789',
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Task is already assigned to another agent');
      });
    });

    describe('output formatting', () => {
      it('should format handoff initiation with full details', async () => {
        mockCommunicationService.initiateHandoff.mockResolvedValue(mockHandoff);

        const result = await (agentTools as any).initiateHandoff({ 
          task_id: 'task-789',
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456',
          handoff_type: 'complete',
          context_data: { progress: 100, status: 'ready' },
          notes: 'Backend implementation complete'
        });

        expect(result.output).toContain('Task Handoff Initiated');
        expect(result.output).toContain('**Handoff ID**: handoff-123');
        expect(result.output).toContain('**Task ID**: task-789');
        expect(result.output).toContain('**From Agent**: agent-123');
        expect(result.output).toContain('**To Agent**: agent-456');
        expect(result.output).toContain('**Handoff Type**: complete');
        expect(result.output).toContain('**Status**: pending');
        expect(result.output).toContain('**Type**: complete');
        expect(result.output).toContain('**Notes**: Backend implementation complete');
        expect(result.output).toContain('**Context Data**: 2 properties');
        expect(result.output).toContain('Next Steps');
        expect(result.output).toContain('target agent (agent-456) has been notified');
      });

      it('should handle handoff without notes', async () => {
        const handoffNoNotes = {
          id: 'handoff-no-notes',
          task_id: 'task-789',
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456',
          handoff_type: 'complete' as const,
          status: 'pending' as HandoffStatus,
          context_data: { progress: 50 },
          initiated_at: new Date('2025-01-23T12:15:00Z')
        };
        mockCommunicationService.initiateHandoff.mockResolvedValue(handoffNoNotes);

        const result = await (agentTools as any).initiateHandoff({ 
          task_id: 'task-789',
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456'
        });

        expect(result.output).not.toContain('**Notes**:');
      });

      it('should handle handoff without context data', async () => {
        const handoffNoContext = { ...mockHandoff, context_data: {} };
        mockCommunicationService.initiateHandoff.mockResolvedValue(handoffNoContext);

        const result = await (agentTools as any).initiateHandoff({ 
          task_id: 'task-789',
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456'
        });

        expect(result.output).not.toContain('**Context Data**:');
      });

      it('should include proper notification message', async () => {
        mockCommunicationService.initiateHandoff.mockResolvedValue(mockHandoff);

        const result = await (agentTools as any).initiateHandoff({ 
          task_id: 'task-789',
          from_agent_id: 'agent-123',
          to_agent_id: 'agent-456'
        });

        expect(result.output).toContain('**Notification**: A handoff message has been automatically sent to the target agent with all necessary context');
      });
    });
  });

  describe('mosaic_agent_broadcast - System-wide Communication', () => {

    describe('input validation', () => {
      it('should require from_agent_id field', async () => {
        const result = await (agentTools as any).broadcastMessage({});

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Required');
        expect(mockCommunicationService.broadcastMessage).not.toHaveBeenCalled();
      });

      it('should require subject field', async () => {
        const result = await (agentTools as any).broadcastMessage({ from_agent_id: 'agent-123' });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Required');
        expect(mockCommunicationService.broadcastMessage).not.toHaveBeenCalled();
      });

      it('should require content field', async () => {
        const result = await (agentTools as any).broadcastMessage({ 
          from_agent_id: 'agent-123',
          subject: 'System Update'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Required');
        expect(mockCommunicationService.broadcastMessage).not.toHaveBeenCalled();
      });

      it('should reject empty from_agent_id', async () => {
        const result = await (agentTools as any).broadcastMessage({ 
          from_agent_id: '',
          subject: 'Update',
          content: 'Hello all'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('From agent ID is required');
        expect(mockCommunicationService.broadcastMessage).not.toHaveBeenCalled();
      });

      it('should reject empty subject', async () => {
        const result = await (agentTools as any).broadcastMessage({ 
          from_agent_id: 'agent-123',
          subject: '',
          content: 'Hello all'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Subject is required');
        expect(mockCommunicationService.broadcastMessage).not.toHaveBeenCalled();
      });

      it('should reject empty content', async () => {
        const result = await (agentTools as any).broadcastMessage({ 
          from_agent_id: 'agent-123',
          subject: 'Update',
          content: ''
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Message content is required');
        expect(mockCommunicationService.broadcastMessage).not.toHaveBeenCalled();
      });

      it('should accept optional target_agents array', async () => {
        mockCommunicationService.broadcastMessage.mockResolvedValue(mockBroadcastMessages.slice(0, 2));

        const result = await (agentTools as any).broadcastMessage({ 
          from_agent_id: 'agent-123',
          subject: 'Team Update',
          content: 'Status update for the team',
          target_agents: ['agent-456', 'agent-789']
        });

        expect(result.metadata.status).toBe('success');
        expect(mockCommunicationService.broadcastMessage).toHaveBeenCalledWith(
          expect.objectContaining({ 
            targetAgents: ['agent-456', 'agent-789']
          })
        );
      });

      it('should accept optional metadata', async () => {
        const metadata = { priority: 'high', category: 'system' };
        mockCommunicationService.broadcastMessage.mockResolvedValue(mockBroadcastMessages);

        const result = await (agentTools as any).broadcastMessage({ 
          from_agent_id: 'agent-123',
          subject: 'System Alert',
          content: 'System maintenance scheduled',
          metadata
        });

        expect(result.metadata.status).toBe('success');
        expect(mockCommunicationService.broadcastMessage).toHaveBeenCalledWith(
          expect.objectContaining({ metadata })
        );
      });

      it('should reject invalid target_agents type', async () => {
        const result = await (agentTools as any).broadcastMessage({ 
          from_agent_id: 'agent-123',
          subject: 'Update',
          content: 'Hello',
          target_agents: 'not-an-array'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Expected array');
        expect(mockCommunicationService.broadcastMessage).not.toHaveBeenCalled();
      });
    });

    describe('service integration', () => {
      it('should broadcast to all agents when no targets specified', async () => {
        mockCommunicationService.broadcastMessage.mockResolvedValue(mockBroadcastMessages);

        const result = await (agentTools as any).broadcastMessage({ 
          from_agent_id: 'agent-123',
          subject: 'System Announcement',
          content: 'System will undergo maintenance tonight'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.from_agent_id).toBe('agent-123');
        expect(result.metadata.data.recipient_count).toBe(3);
        expect(result.metadata.data.message_ids).toEqual(['msg-1', 'msg-2', 'msg-3']);
        expect(mockCommunicationService.broadcastMessage).toHaveBeenCalledWith({
          fromAgentId: 'agent-123',
          subject: 'System Announcement',
          content: 'System will undergo maintenance tonight'
        });
      });

      it('should broadcast to specific target agents', async () => {
        mockCommunicationService.broadcastMessage.mockResolvedValue(mockBroadcastMessages.slice(0, 2));

        const result = await (agentTools as any).broadcastMessage({ 
          from_agent_id: 'agent-123',
          subject: 'Team Coordination',
          content: 'Please sync up on the current tasks',
          target_agents: ['agent-456', 'agent-789']
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.recipient_count).toBe(2);
        expect(mockCommunicationService.broadcastMessage).toHaveBeenCalledWith({
          fromAgentId: 'agent-123',
          subject: 'Team Coordination',
          content: 'Please sync up on the current tasks',
          targetAgents: ['agent-456', 'agent-789']
        });
      });

      it('should include metadata in broadcast', async () => {
        const metadata = { 
          priority: 'critical', 
          category: 'security',
          expires: '2025-01-24T00:00:00Z'
        };
        mockCommunicationService.broadcastMessage.mockResolvedValue(mockBroadcastMessages);

        const result = await (agentTools as any).broadcastMessage({ 
          from_agent_id: 'agent-123',
          subject: 'Security Alert',
          content: 'Please update your authentication tokens',
          metadata
        });

        expect(result.metadata.status).toBe('success');
        expect(mockCommunicationService.broadcastMessage).toHaveBeenCalledWith(
          expect.objectContaining({ metadata })
        );
      });

      it('should handle broadcast failures gracefully', async () => {
        mockCommunicationService.broadcastMessage.mockRejectedValue(
          new Error('Communication service temporarily unavailable')
        );

        const result = await (agentTools as any).broadcastMessage({ 
          from_agent_id: 'agent-123',
          subject: 'Update',
          content: 'Test message'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Communication service temporarily unavailable');
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to broadcast message',
          expect.any(Error),
          expect.any(Object)
        );
      });

      it('should handle empty recipient list', async () => {
        mockCommunicationService.broadcastMessage.mockResolvedValue([]);

        const result = await (agentTools as any).broadcastMessage({ 
          from_agent_id: 'agent-123',
          subject: 'Update',
          content: 'Test message'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.recipient_count).toBe(0);
      });
    });

    describe('output formatting', () => {
      it('should format broadcast success with comprehensive details', async () => {
        mockCommunicationService.broadcastMessage.mockResolvedValue(mockBroadcastMessages);

        const result = await (agentTools as any).broadcastMessage({ 
          from_agent_id: 'agent-123',
          subject: 'System Maintenance Alert',
          content: 'System will be down for maintenance from 2:00 AM to 4:00 AM',
          target_agents: ['agent-456', 'agent-789', 'agent-101'],
          metadata: { priority: 'high', category: 'system' }
        });

        expect(result.output).toContain('Broadcast Message Sent');
        expect(result.output).toContain('**From Agent**: agent-123');
        expect(result.output).toContain('**Subject**: System Maintenance Alert');
        expect(result.output).toContain('**Recipients**: 3 agents');
        expect(result.output).toContain('**Target Agents**: agent-456, agent-789, agent-101');
        expect(result.output).toContain('System will be down for maintenance from 2:00 AM to 4:00 AM');
        expect(result.output).toContain('**Messages Sent**: 3');
        expect(result.output).toContain('**Message Type**: Broadcast');
        expect(result.output).toContain('**Metadata**:');
        expect(result.output).toContain('Recipient List');
        expect(result.output).toContain('1. agent-456 (Message ID: msg-1)');
        expect(result.output).toContain('2. agent-789 (Message ID: msg-2)');
        expect(result.output).toContain('3. agent-101 (Message ID: msg-3)');
      });

      it('should show all active agents when no targets specified', async () => {
        mockCommunicationService.broadcastMessage.mockResolvedValue(mockBroadcastMessages);

        const result = await (agentTools as any).broadcastMessage({ 
          from_agent_id: 'agent-123',
          subject: 'System Update',
          content: 'New features available'
        });

        expect(result.output).toContain('**Target**: All active agents');
        expect(result.output).not.toContain('**Target Agents**:');
      });

      it('should handle broadcast without metadata', async () => {
        mockCommunicationService.broadcastMessage.mockResolvedValue(mockBroadcastMessages);

        const result = await (agentTools as any).broadcastMessage({ 
          from_agent_id: 'agent-123',
          subject: 'Update',
          content: 'Test message'
        });

        expect(result.output).not.toContain('**Metadata**:');
      });

      it('should include proper success confirmation', async () => {
        mockCommunicationService.broadcastMessage.mockResolvedValue(mockBroadcastMessages);

        const result = await (agentTools as any).broadcastMessage({ 
          from_agent_id: 'agent-123',
          subject: 'Update',
          content: 'Test message'
        });

        expect(result.output).toContain('All messages have been successfully queued for delivery to the target agents');
      });
    });
  });

  describe('helper methods', () => {
    describe('formatAgentStatusReport', () => {
      it('should format comprehensive status report with multiple agents', () => {
        const agents = [mockAgent, mockWorkingAgent, mockFailedAgent];
        const input = { 
          status_filter: 'all', 
          include_metrics: true, 
          include_context: true 
        };

        const result = (agentTools as any).formatAgentStatusReport(agents, mockAgentOverview, input);

        expect(result).toContain('Agent Status Report');
        expect(result).toContain('**Filter**: all');
        expect(result).toContain('**Agents Found**: 3');
        expect(result).toContain('**Total System Agents**: 10');
        expect(result).toContain('System Overview');
        expect(result).toContain('- **idle**: 5');
        expect(result).toContain('- **working**: 3');
        expect(result).toContain('Agent Details');
        expect(result).toContain('**1. Agent agent-123**');
        expect(result).toContain('**2. Agent agent-456**');
        expect(result).toContain('**3. Agent agent-789**');
      });

      it('should handle empty agent list gracefully', () => {
        const emptyOverview = {
          total_agents: 0,
          by_status: {},
          by_project: {},
          system_health: 'good'
        };
        const input = { status_filter: 'idle', include_metrics: false, include_context: false };

        const result = (agentTools as any).formatAgentStatusReport([], emptyOverview, input);

        expect(result).toContain('No agents currently registered in the system');
        expect(result).toContain('No Agents Found');
        expect(result).toContain('No agents match the specified criteria');
      });

      it('should exclude metrics when include_metrics is false', () => {
        const input = { 
          status_filter: 'all', 
          include_metrics: false, 
          include_context: false 
        };

        const result = (agentTools as any).formatAgentStatusReport([mockAgent], mockAgentOverview, input);

        expect(result).not.toContain('Tasks Completed');
        expect(result).not.toContain('Success Rate');
        expect(result).not.toContain('Avg Completion Time');
      });

      it('should exclude context when include_context is false', () => {
        const input = { 
          status_filter: 'all', 
          include_metrics: true, 
          include_context: false 
        };

        const result = (agentTools as any).formatAgentStatusReport([mockAgent], mockAgentOverview, input);

        expect(result).not.toContain('Task Queue');
        expect(result).not.toContain('Tools');
      });

      it('should include system health information', () => {
        const input = { status_filter: 'all', include_metrics: false, include_context: false };

        const result = (agentTools as any).formatAgentStatusReport([mockAgent], mockAgentOverview, input);

        expect(result).toContain('System Health');
        expect(result).toContain('**Database**: ✓ Connected');
        expect(result).toContain('**Communication Service**: ✓ Running');
        expect(result).toContain('**Agent Registry**: ✓ Available');
        expect(result).toContain('**Last Updated**:');
      });
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle null service responses gracefully', async () => {
      mockAgentService.listAgents.mockResolvedValue(null as any);

      const result = await (agentTools as any).getAgentStatus({});

      expect(result.metadata.status).toBe('error');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle malformed agent data', async () => {
      const malformedAgent = { 
        id: 'test', 
        persona: 'INVALID',
        status: 'idle',
        model: 'unknown',
        tools: [],
        context: { project_id: 'unknown', task_queue: [], conversation_history: [], state_data: {} },
        metrics: { tasks_completed: 0, success_rate: 0, average_completion_time: 0 },
        created_at: new Date(),
        last_activity: new Date()
      } as any;
      mockAgentService.listAgents.mockResolvedValue([malformedAgent]);
      mockAgentService.getAgentStatus.mockResolvedValue(mockAgentOverview);

      const result = await (agentTools as any).getAgentStatus({});

      // Should not crash, but may have missing or unusual data in output
      expect(result.metadata.status).toBe('success');
      expect(result.output).toContain('INVALID'); // Should include the malformed persona
    });

    it('should handle concurrent tool operations', async () => {
      mockAgentService.deployAgent.mockResolvedValue(mockAgent);
      mockAgentService.getAgent.mockResolvedValue(mockAgent);
      mockAgentService.terminateAgent.mockResolvedValue(undefined);
      mockCommunicationService.sendMessage.mockResolvedValue(mockMessage);

      const promises = [
        (agentTools as any).deployAgent({ persona: 'BE-BACKEND-BENJAMIN', project_id: 'project-123' }),
        (agentTools as any).terminateAgent({ agent_id: 'agent-123' }),
        (agentTools as any).sendMessage({ 
          from_agent_id: 'agent-123', 
          to_agent_id: 'agent-456', 
          content: 'Hello' 
        })
      ];

      const results = await Promise.all(promises);

      expect(results[0].metadata.status).toBe('success');
      expect(results[1].metadata.status).toBe('success');
      expect(results[2].metadata.status).toBe('success');
    });

    it('should log all operations with proper context', async () => {
      mockAgentService.deployAgent.mockResolvedValue(mockAgent);
      mockAgentService.getAgent.mockResolvedValue(mockAgent);
      mockAgentService.terminateAgent.mockResolvedValue(undefined);
      mockAgentService.listAgents.mockResolvedValue([mockAgent]);
      mockAgentService.getAgentStatus.mockResolvedValue(mockAgentOverview);
      mockCommunicationService.sendMessage.mockResolvedValue(mockMessage);
      mockCommunicationService.initiateHandoff.mockResolvedValue(mockHandoff);
      mockCommunicationService.broadcastMessage.mockResolvedValue(mockBroadcastMessages);

      await (agentTools as any).deployAgent({ persona: 'BE-BACKEND-BENJAMIN', project_id: 'project-123' });
      expect(mockLogger.info).toHaveBeenCalledWith('Deploying agent', expect.any(Object));

      await (agentTools as any).getAgentStatus({});
      expect(mockLogger.info).toHaveBeenCalledWith('Getting agent status', expect.any(Object));

      await (agentTools as any).terminateAgent({ agent_id: 'agent-123' });
      expect(mockLogger.info).toHaveBeenCalledWith('Terminating agent', expect.any(Object));

      await (agentTools as any).sendMessage({ 
        from_agent_id: 'agent-123', 
        to_agent_id: 'agent-456', 
        content: 'Hello' 
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Sending agent message', expect.any(Object));

      await (agentTools as any).initiateHandoff({ 
        task_id: 'task-123', 
        from_agent_id: 'agent-123', 
        to_agent_id: 'agent-456' 
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Initiating agent handoff', expect.any(Object));

      await (agentTools as any).broadcastMessage({ 
        from_agent_id: 'agent-123', 
        subject: 'Test', 
        content: 'Hello all' 
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Broadcasting message', expect.any(Object));
    });

    it('should include execution time in all successful operations', async () => {
      mockAgentService.deployAgent.mockResolvedValue(mockAgent);
      mockAgentService.getAgent.mockResolvedValue(mockAgent);
      mockAgentService.terminateAgent.mockResolvedValue(undefined);
      mockAgentService.listAgents.mockResolvedValue([mockAgent]);
      mockAgentService.getAgentStatus.mockResolvedValue(mockAgentOverview);
      mockCommunicationService.sendMessage.mockResolvedValue(mockMessage);
      mockCommunicationService.initiateHandoff.mockResolvedValue(mockHandoff);
      mockCommunicationService.broadcastMessage.mockResolvedValue(mockBroadcastMessages);

      const operations = [
        () => (agentTools as any).deployAgent({ persona: 'BE-BACKEND-BENJAMIN', project_id: 'project-123' }),
        () => (agentTools as any).getAgentStatus({}),
        () => (agentTools as any).terminateAgent({ agent_id: 'agent-123' }),
        () => (agentTools as any).sendMessage({ from_agent_id: 'agent-123', to_agent_id: 'agent-456', content: 'Hello' }),
        () => (agentTools as any).initiateHandoff({ task_id: 'task-123', from_agent_id: 'agent-123', to_agent_id: 'agent-456' }),
        () => (agentTools as any).broadcastMessage({ from_agent_id: 'agent-123', subject: 'Test', content: 'Hello all' })
      ];

      for (const operation of operations) {
        const result = await operation();
        expect(result.metadata.execution_time_ms).toBeDefined();
        expect(typeof result.metadata.execution_time_ms).toBe('number');
        expect(result.metadata.execution_time_ms).toBeGreaterThanOrEqual(0);
      }
    });
  });
});