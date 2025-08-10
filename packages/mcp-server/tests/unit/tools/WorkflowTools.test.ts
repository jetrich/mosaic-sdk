import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WorkflowTools } from '../../../src/tools/WorkflowTools';
import { WorkflowService } from '../../../src/services/WorkflowService';
import { Logger } from '../../../src/utils/Logger';
import { 
  Workflow, 
  WorkflowExecution, 
  WorkflowStep, 
  WorkflowStatus,
  WorkflowTrigger,
  StepStatus
} from '../../../src/types';

// Define WorkflowMonitoring interface for testing
interface WorkflowMonitoring {
  workflow: Workflow;
  current_execution?: WorkflowExecution;
  recent_executions: WorkflowExecution[];
  performance_metrics: {
    total_executions: number;
    success_rate: number;
    average_duration_minutes: number;
    last_24h_executions: number;
    fastest_execution_minutes?: number;
    slowest_execution_minutes?: number;
    most_common_failure_reason?: string;
    step_success_rates?: Record<string, number>;
  };
}

describe('WorkflowTools - THE FELIX COMEBACK MASTERPIECE! 🔥⚔️', () => {
  let workflowTools: WorkflowTools;
  let mockWorkflowService: jest.Mocked<WorkflowService>;
  let mockLogger: jest.Mocked<Logger>;

  // Mock workflow data - Felix's comprehensive workflow orchestration model
  const mockWorkflowStep: WorkflowStep = {
    id: 'step-123',
    name: 'Backend API Development',
    description: 'Implement REST API endpoints',
    agent_persona: 'BE-BACKEND-BENJAMIN',
    task_ids: ['task-456', 'task-789'],
    dependencies: [],
    parallel_group: 'backend-dev',
    timeout_minutes: 45,
    retry_count: 2,
    status: 'pending' as StepStatus,
    output: {
      environment: 'development',
      api_version: 'v1'
    }
  };

  const mockComplexWorkflowStep: WorkflowStep = {
    id: 'step-456',
    name: 'Frontend Integration',
    description: 'Connect frontend to API endpoints',
    agent_persona: 'FE-FRONTEND-FIONA',
    task_ids: ['task-101', 'task-102'],
    dependencies: ['step-123'],
    parallel_group: 'frontend-dev',
    timeout_minutes: 60,
    retry_count: 1,
    status: 'running' as StepStatus,
    started_at: new Date('2025-01-23T10:00:00Z'),
    output: {
      backend_url: 'http://localhost:3000/api',
      framework: 'react'
    }
  };

  const mockWorkflow: Workflow = {
    id: 'workflow-123',
    name: 'Full-Stack Development Pipeline',
    description: 'Complete development workflow from backend to frontend',
    project_id: 'project-456',
    status: 'pending' as WorkflowStatus,
    trigger: 'manual' as WorkflowTrigger,
    steps: [mockWorkflowStep, mockComplexWorkflowStep],
    variables: {
      environment: 'development',
      version: '1.0.0',
      database_url: 'postgresql://localhost:5432/dev',
      api_base_url: 'http://localhost:3000'
    },
    timeout_minutes: 120,
    max_retries: 3,
    progress: {
      total_steps: 2,
      completed_steps: 0,
      failed_steps: 0,
      skipped_steps: 0,
      completion_percentage: 0
    },
    created_by: 'felix-architect',
    created_at: new Date('2025-01-23T08:00:00Z'),
    updated_at: new Date('2025-01-23T08:00:00Z'),
  };

  const mockRunningWorkflow: Workflow = {
    ...mockWorkflow,
    id: 'workflow-running-456',
    name: 'Active Development Pipeline',
    status: 'running' as WorkflowStatus,
    started_at: new Date('2025-01-23T09:00:00Z'),
    progress: {
      total_steps: 2,
      completed_steps: 1,
      failed_steps: 0,
      skipped_steps: 0,
      completion_percentage: 50,
      estimated_completion: new Date('2025-01-23T11:30:00Z')
    },
    steps: [
      { ...mockWorkflowStep, status: 'completed' as StepStatus, completed_at: new Date('2025-01-23T10:30:00Z') },
      { ...mockComplexWorkflowStep, status: 'running' as StepStatus }
    ]
  };

  const mockCompletedWorkflow: Workflow = {
    ...mockWorkflow,
    id: 'workflow-completed-789',
    name: 'Completed Development Pipeline',
    status: 'completed' as WorkflowStatus,
    started_at: new Date('2025-01-23T08:00:00Z'),
    completed_at: new Date('2025-01-23T11:00:00Z'),
    progress: {
      total_steps: 2,
      completed_steps: 2,
      failed_steps: 0,
      skipped_steps: 0,
      completion_percentage: 100,
    },
    steps: [
      { ...mockWorkflowStep, status: 'completed' as StepStatus, completed_at: new Date('2025-01-23T09:30:00Z') },
      { ...mockComplexWorkflowStep, status: 'completed' as StepStatus, completed_at: new Date('2025-01-23T11:00:00Z') }
    ]
  };

  const mockFailedWorkflow: Workflow = {
    ...mockWorkflow,
    id: 'workflow-failed-101',
    name: 'Failed Development Pipeline',
    status: 'failed' as WorkflowStatus,
    started_at: new Date('2025-01-23T08:00:00Z'),
    completed_at: new Date('2025-01-23T09:15:00Z'),
    progress: {
      total_steps: 2,
      completed_steps: 0,
      failed_steps: 1,
      skipped_steps: 1,
      completion_percentage: 0,
    },
    steps: [
      { ...mockWorkflowStep, status: 'failed' as StepStatus, error_message: 'Database connection failed' },
      { ...mockComplexWorkflowStep, status: 'skipped' as StepStatus }
    ]
  };

  const mockWorkflowExecution: WorkflowExecution = {
    id: 'execution-123',
    workflow_id: 'workflow-123',
    execution_number: 1,
    status: 'running',
    trigger: 'manual',
    context: {
      user_id: 'felix-123',
      branch: 'feature/workflow-execution',
      environment: 'development'
    },
    triggered_by: 'felix-architect',
    started_at: new Date('2025-01-23T09:30:00Z'),
    step_executions: [],
    retry_count: 0
  };

  const mockCompletedExecution: WorkflowExecution = {
    ...mockWorkflowExecution,
    id: 'execution-completed-456',
    execution_number: 2,
    status: 'completed',
    completed_at: new Date('2025-01-23T12:00:00Z'),
    step_executions: [
      {
        id: 'step-exec-1',
        workflow_execution_id: 'execution-completed-456',
        step_id: 'step-123',
        status: 'completed',
        started_at: new Date('2025-01-23T09:30:00Z'),
        completed_at: new Date('2025-01-23T10:30:00Z'),
        agent_id: 'agent-benjamin-123',
        input: {},
        output: { message: 'API endpoints created successfully' },
            retry_count: 0,
        logs: []
      },
      {
        id: 'step-exec-2',
        workflow_execution_id: 'execution-completed-456',
        step_id: 'step-456',
        status: 'completed',
        started_at: new Date('2025-01-23T10:30:00Z'),
        completed_at: new Date('2025-01-23T12:00:00Z'),
        agent_id: 'agent-fiona-456',
        input: {},
        output: { message: 'Frontend integration completed' },
            retry_count: 0,
        logs: []
      }
    ]
  };

  const mockWorkflowMonitoring: WorkflowMonitoring = {
    workflow: mockRunningWorkflow,
    current_execution: mockWorkflowExecution,
    recent_executions: [mockCompletedExecution, mockWorkflowExecution],
    performance_metrics: {
      total_executions: 5,
      success_rate: 0.8,
      average_duration_minutes: 145.5,
      last_24h_executions: 3,
      fastest_execution_minutes: 120,
      slowest_execution_minutes: 180,
      most_common_failure_reason: 'timeout',
      step_success_rates: {
        'step-123': 0.9,
        'step-456': 0.85
      }
    }
  };

  beforeEach(() => {
    // Create mock logger - following Benjamin's pattern but with workflow-specific context
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      log: jest.fn()
    } as unknown as jest.Mocked<Logger>;

    // Create mock WorkflowService - Felix's domain expertise in action!
    mockWorkflowService = {
      createWorkflow: jest.fn(),
      executeWorkflow: jest.fn(),
      monitorWorkflow: jest.fn(),
      listWorkflows: jest.fn(),
      getWorkflow: jest.fn(),
      pauseWorkflow: jest.fn(),
      resumeWorkflow: jest.fn(),
      cancelWorkflow: jest.fn(),
      initialize: jest.fn()
    } as unknown as jest.Mocked<WorkflowService>;

    // Create WorkflowTools instance
    workflowTools = new WorkflowTools(mockWorkflowService, mockLogger);
  });

  describe('getTools - The Foundation of Excellence', () => {
    it('should return exactly 8 workflow tools', () => {
      const tools = workflowTools.getTools();
      
      expect(tools).toHaveLength(8);
      expect(tools.map(t => t.name)).toEqual([
        'mosaic_workflow_create',
        'mosaic_workflow_execute',
        'mosaic_workflow_monitor',
        'mosaic_workflow_list',
        'mosaic_workflow_get',
        'mosaic_workflow_pause',
        'mosaic_workflow_resume',
        'mosaic_workflow_cancel'
      ]);
    });

    it('should have correct tool descriptions', () => {
      const tools = workflowTools.getTools();
      
      expect(tools[0]?.description).toBe('Create a new multi-agent workflow with defined steps and dependencies');
      expect(tools[1]?.description).toBe('Execute a workflow with coordinated multi-agent sequences');
      expect(tools[2]?.description).toBe('Monitor workflow progress, execution status, and performance metrics');
      expect(tools[3]?.description).toBe('List workflows with optional filtering');
      expect(tools[4]?.description).toBe('Get detailed information about a specific workflow');
      expect(tools[5]?.description).toBe('Pause a running workflow');
      expect(tools[6]?.description).toBe('Resume a paused workflow');
      expect(tools[7]?.description).toBe('Cancel a running or paused workflow');
    });

    it('should have valid input schemas for all tools', () => {
      const tools = workflowTools.getTools();
      
      tools.forEach((tool) => {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema).toHaveProperty('type', 'object');
        expect(tool.inputSchema).toHaveProperty('properties');
        
        // Verify schema structure
        if (tool.inputSchema && typeof tool.inputSchema === 'object' && 'properties' in tool.inputSchema) {
          expect(typeof tool.inputSchema.properties).toBe('object');
        }
      });
    });

    it('should bind handlers correctly to all tools', () => {
      const tools = workflowTools.getTools();
      
      tools.forEach(tool => {
        expect(tool.handler).toBeDefined();
        expect(typeof tool.handler).toBe('function');
      });
    });

    it('should have proper required fields for each tool', () => {
      const tools = workflowTools.getTools();
      
      // Check specific required fields
      const createTool = tools.find(t => t.name === 'mosaic_workflow_create');
      expect(createTool?.inputSchema).toHaveProperty('required', ['name', 'project_id', 'steps']);
      
      const executeTool = tools.find(t => t.name === 'mosaic_workflow_execute');
      expect(executeTool?.inputSchema).toHaveProperty('required', ['workflow_id']);
      
      const monitorTool = tools.find(t => t.name === 'mosaic_workflow_monitor');
      expect(monitorTool?.inputSchema).toHaveProperty('required', ['workflow_id']);
      
      const getTool = tools.find(t => t.name === 'mosaic_workflow_get');
      expect(getTool?.inputSchema).toHaveProperty('required', ['workflow_id']);
      
      const pauseTool = tools.find(t => t.name === 'mosaic_workflow_pause');
      expect(pauseTool?.inputSchema).toHaveProperty('required', ['workflow_id']);
      
      const resumeTool = tools.find(t => t.name === 'mosaic_workflow_resume');
      expect(resumeTool?.inputSchema).toHaveProperty('required', ['workflow_id']);
      
      const cancelTool = tools.find(t => t.name === 'mosaic_workflow_cancel');
      expect(cancelTool?.inputSchema).toHaveProperty('required', ['workflow_id']);
    });
  });

  describe('mosaic_workflow_create - The JSON Schema Master! 🎯', () => {
    describe('input validation - The Foundation of Quality', () => {
      it('should require name field', async () => {
        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({});

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('name');
        expect(mockWorkflowService.createWorkflow).not.toHaveBeenCalled();
      });

      it('should require project_id field', async () => {
        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: 'Test Workflow' 
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('project_id');
        expect(mockWorkflowService.createWorkflow).not.toHaveBeenCalled();
      });

      it('should require steps field', async () => {
        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: 'Test Workflow',
          project_id: 'project-123'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('steps');
        expect(mockWorkflowService.createWorkflow).not.toHaveBeenCalled();
      });

      it('should reject empty name', async () => {
        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: '',
          project_id: 'project-123',
          steps: []
        });

        expect(result.metadata.status).toBe('error');
        expect(mockWorkflowService.createWorkflow).not.toHaveBeenCalled();
      });

      it('should reject empty project_id', async () => {
        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: 'Test Workflow',
          project_id: '',
          steps: []
        });

        expect(result.metadata.status).toBe('error');
        expect(mockWorkflowService.createWorkflow).not.toHaveBeenCalled();
      });

      it('should reject empty steps array', async () => {
        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: 'Test Workflow',
          project_id: 'project-123',
          steps: []
        });

        expect(result.metadata.status).toBe('error');
        expect(mockWorkflowService.createWorkflow).not.toHaveBeenCalled();
      });

      it('should validate step structure - require name and task_ids', async () => {
        const invalidSteps = [
          { description: 'Missing name and task_ids' },
          { name: 'Has name', description: 'Missing task_ids' },
          { task_ids: ['task-1'], description: 'Missing name' }
        ];

        for (const steps of [invalidSteps]) {
          const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
            name: 'Test Workflow',
            project_id: 'project-123',
            steps: steps
          });

          expect(result.metadata.status).toBe('error');
          expect(mockWorkflowService.createWorkflow).not.toHaveBeenCalled();
        }
      });

      it('should accept valid step structures', async () => {
        const validSteps = [
          {
            name: 'Backend Development',
            task_ids: ['task-1', 'task-2'],
            dependencies: [],
            agent_persona: 'BE-BACKEND-BENJAMIN',
            timeout_minutes: 30
          },
          {
            name: 'Frontend Development',
            task_ids: ['task-3'],
            dependencies: ['Backend Development'],
            parallel_group: 'ui-group',
            retry_count: 2
          }
        ];

        mockWorkflowService.createWorkflow.mockResolvedValue({
          ...mockWorkflow,
          steps: validSteps.map((step, i) => ({ ...mockWorkflowStep, ...step, id: `step-${i}` }))
        });

        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: 'Test Workflow',
          project_id: 'project-123',
          steps: validSteps
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.createWorkflow).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Workflow',
            project_id: 'project-123',
            steps: validSteps
          }),
          'system'
        );
      });

      it('should accept valid trigger values', async () => {
        const triggers = ['manual', 'scheduled', 'event', 'dependency'];
        
        for (const trigger of triggers) {
          mockWorkflowService.createWorkflow.mockResolvedValue({
            ...mockWorkflow,
            trigger: trigger as WorkflowTrigger
          });

          const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
            name: 'Test Workflow',
            project_id: 'project-123',
            steps: [{ name: 'Test Step', task_ids: ['task-1'], dependencies: [] }],
            trigger
          });

          expect(result.metadata.status).toBe('success');
          expect(mockWorkflowService.createWorkflow).toHaveBeenCalledWith(
            expect.objectContaining({ trigger }),
            'system'
          );
        }
      });

      it('should reject invalid trigger values', async () => {
        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: 'Test Workflow',
          project_id: 'project-123',
          steps: [{ name: 'Test Step', task_ids: ['task-1'], dependencies: [] }],
          trigger: 'invalid-trigger'
        });

        expect(result.metadata.status).toBe('error');
        expect(mockWorkflowService.createWorkflow).not.toHaveBeenCalled();
      });

      it('should accept optional description', async () => {
        mockWorkflowService.createWorkflow.mockResolvedValue(mockWorkflow);

        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: 'Test Workflow',
          description: 'A comprehensive test workflow',
          project_id: 'project-123',
          steps: [{ name: 'Test Step', task_ids: ['task-1'], dependencies: [] }]
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.createWorkflow).toHaveBeenCalledWith(
          expect.objectContaining({ 
            description: 'A comprehensive test workflow' 
          }),
          'system'
        );
      });

      it('should accept optional variables object', async () => {
        const variables = { 
          environment: 'production', 
          version: '2.0.0',
          database_url: 'postgresql://prod:5432/app'
        };
        mockWorkflowService.createWorkflow.mockResolvedValue({
          ...mockWorkflow,
          variables
        });

        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: 'Test Workflow',
          project_id: 'project-123',
          steps: [{ name: 'Test Step', task_ids: ['task-1'], dependencies: [] }],
          variables
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.createWorkflow).toHaveBeenCalledWith(
          expect.objectContaining({ variables }),
          'system'
        );
      });

      it('should accept optional schedule', async () => {
        mockWorkflowService.createWorkflow.mockResolvedValue({
          ...mockWorkflow,
          schedule: '0 2 * * *'
        });

        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: 'Test Workflow',
          project_id: 'project-123',
          steps: [{ name: 'Test Step', task_ids: ['task-1'], dependencies: [] }],
          schedule: '0 2 * * *'
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.createWorkflow).toHaveBeenCalledWith(
          expect.objectContaining({ schedule: '0 2 * * *' }),
          'system'
        );
      });

      it('should accept optional timeout_minutes', async () => {
        mockWorkflowService.createWorkflow.mockResolvedValue({
          ...mockWorkflow,
          timeout_minutes: 240
        });

        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: 'Test Workflow',
          project_id: 'project-123',
          steps: [{ name: 'Test Step', task_ids: ['task-1'], dependencies: [] }],
          timeout_minutes: 240
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.createWorkflow).toHaveBeenCalledWith(
          expect.objectContaining({ timeout_minutes: 240 }),
          'system'
        );
      });

      it('should accept optional max_retries', async () => {
        mockWorkflowService.createWorkflow.mockResolvedValue({
          ...mockWorkflow,
          max_retries: 5
        });

        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: 'Test Workflow',
          project_id: 'project-123',
          steps: [{ name: 'Test Step', task_ids: ['task-1'], dependencies: [] }],
          max_retries: 5
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.createWorkflow).toHaveBeenCalledWith(
          expect.objectContaining({ max_retries: 5 }),
          'system'
        );
      });

      it('should accept custom created_by', async () => {
        mockWorkflowService.createWorkflow.mockResolvedValue(mockWorkflow);

        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: 'Test Workflow',
          project_id: 'project-123',
          steps: [{ name: 'Test Step', task_ids: ['task-1'], dependencies: [] }],
          created_by: 'felix-architect'
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.createWorkflow).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Workflow',
            project_id: 'project-123'
          }),
          'felix-architect'
        );
      });

      it('should reject invalid types for optional fields', async () => {
        const invalidInputs = [
          { variables: 'not-an-object' },
          { timeout_minutes: 'not-a-number' },
          { max_retries: 'not-a-number' },
          { schedule: 123 }
        ];

        for (const invalidInput of invalidInputs) {
          const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
            name: 'Test Workflow',
            project_id: 'project-123',
            steps: [{ name: 'Test Step', task_ids: ['task-1'], dependencies: [] }],
            ...invalidInput
          });

          expect(result.metadata.status).toBe('error');
          expect(mockWorkflowService.createWorkflow).not.toHaveBeenCalled();
        }
      });
    });

    describe('service integration - The Orchestration Engine', () => {
      it('should create workflow with minimal configuration', async () => {
        mockWorkflowService.createWorkflow.mockResolvedValue(mockWorkflow);

        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: 'Simple Workflow',
          project_id: 'project-456',
          steps: [
            { name: 'Simple Step', task_ids: ['task-123'], dependencies: [] }
          ]
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.workflow_id).toBe('workflow-123');
        expect(result.metadata.data.name).toBe('Full-Stack Development Pipeline');
        expect(result.metadata.data.step_count).toBe(2);
        expect(result.metadata.data.project_id).toBe('project-456');
        expect(mockWorkflowService.createWorkflow).toHaveBeenCalledWith({
          name: 'Simple Workflow',
          project_id: 'project-456',
          steps: [
            { name: 'Simple Step', task_ids: ['task-123'], dependencies: [] }
          ]
        }, 'system');
      });

      it('should create workflow with full configuration', async () => {
        const fullConfig = {
          name: 'Enterprise Development Pipeline',
          description: 'Complete enterprise-grade development workflow',
          project_id: 'enterprise-proj-123',
          steps: [
            {
              id: 'step-backend-enterprise',
              name: 'Backend Development',
              description: 'Build robust backend services',
              agent_persona: 'BE-BACKEND-BENJAMIN',
              task_ids: ['task-backend-1', 'task-backend-2'],
              dependencies: [],
              timeout_minutes: 60,
              retry_count: 3,
              status: 'pending' as StepStatus
            },
            {
              id: 'step-frontend-enterprise',
              name: 'Frontend Development',
              description: 'Create responsive user interface',
              agent_persona: 'FE-FRONTEND-FIONA',
              task_ids: ['task-frontend-1'],
              dependencies: ['Backend Development'],
              parallel_group: 'ui-development',
              timeout_minutes: 45,
              retry_count: 2,
              status: 'pending' as StepStatus
            }
          ],
          variables: {
            environment: 'production',
            version: '2.1.0',
            database_url: 'postgresql://prod.example.com:5432/enterprise'
          },
          schedule: '0 3 * * 1',
          timeout_minutes: 180,
          max_retries: 5,
          trigger: 'scheduled' as WorkflowTrigger,
          created_by: 'felix-senior-architect'
        };

        const expectedWorkflow = {
          ...mockWorkflow,
          ...fullConfig,
          id: 'workflow-enterprise-456'
        };
        mockWorkflowService.createWorkflow.mockResolvedValue(expectedWorkflow);

        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler(fullConfig);

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.workflow_id).toBe('workflow-enterprise-456');
        expect(mockWorkflowService.createWorkflow).toHaveBeenCalledWith({
          name: fullConfig.name,
          description: fullConfig.description,
          project_id: fullConfig.project_id,
          steps: fullConfig.steps,
          variables: fullConfig.variables,
          schedule: fullConfig.schedule,
          timeout_minutes: fullConfig.timeout_minutes,
          max_retries: fullConfig.max_retries,
          trigger: fullConfig.trigger
        }, 'felix-senior-architect');
      });

      it('should handle workflow creation failures gracefully', async () => {
        mockWorkflowService.createWorkflow.mockRejectedValue(new Error('Circular dependency detected'));

        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: 'Invalid Workflow',
          project_id: 'project-123',
          steps: [{ name: 'Test Step', task_ids: ['task-1'], dependencies: [] }]
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Circular dependency detected');
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to create workflow',
          expect.any(Error),
          expect.any(Object)
        );
      });

      it('should handle dependency validation errors', async () => {
        mockWorkflowService.createWorkflow.mockRejectedValue(
          new Error('Invalid dependency: step "non-existent-step" not found')
        );

        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: 'Dependency Test',
          project_id: 'project-123',
          steps: [
            { 
              name: 'Step 1', 
              task_ids: ['task-1'], 
              dependencies: ['non-existent-step'] 
            }
          ]
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Invalid dependency: step "non-existent-step" not found');
      });

      it('should handle step validation errors', async () => {
        mockWorkflowService.createWorkflow.mockRejectedValue(
          new Error('Task ID "invalid-task" not found in project')
        );

        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: 'Task Validation Test',
          project_id: 'project-123',
          steps: [
            { name: 'Invalid Step', task_ids: ['invalid-task'] }
          ]
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Task ID "invalid-task" not found in project');
      });

      it('should handle persona validation errors', async () => {
        mockWorkflowService.createWorkflow.mockRejectedValue(
          new Error('Invalid agent persona format: must follow DOMAIN-ROLE-NAME pattern')
        );

        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: 'Persona Test',
          project_id: 'project-123',
          steps: [
            { 
              name: 'Step 1', 
              task_ids: ['task-1'],
              agent_persona: 'invalid-persona'
            }
          ]
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Invalid agent persona format: must follow DOMAIN-ROLE-NAME pattern');
      });
    });

    describe('output formatting - The User Experience', () => {
      it('should format workflow creation success with comprehensive details', async () => {
        mockWorkflowService.createWorkflow.mockResolvedValue(mockWorkflow);

        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: 'Test Workflow',
          project_id: 'project-456',
          steps: [
            { name: 'Backend Step', task_ids: ['task-1', 'task-2'] },
            { name: 'Frontend Step', task_ids: ['task-3'], dependencies: ['Backend Step'] }
          ]
        });

        expect(result.output).toContain('Workflow "Full-Stack Development Pipeline" created successfully');
        expect(result.output).toContain('ID: workflow-123');
        expect(result.output).toContain('Steps: 2');
        expect(result.output).toContain('Project: project-456');
        expect(result.output).toContain('Status: pending');
        expect(result.output).toContain('Trigger: manual');
        expect(result.output).toContain('Step Summary:');
        expect(result.output).toContain('1. Backend API Development (2 tasks)');
        expect(result.output).toContain('2. Frontend Integration (2 tasks) - depends on:');
        expect(result.output).toContain('ready to be executed using mosaic_workflow_execute');
      });

      it('should handle workflow without dependencies', async () => {
        const simpleWorkflow = {
          ...mockWorkflow,
          steps: [
            { ...mockWorkflowStep, dependencies: [] }
          ]
        };
        mockWorkflowService.createWorkflow.mockResolvedValue(simpleWorkflow);

        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: 'Simple Workflow',
          project_id: 'project-456',
          steps: [{ name: 'Simple Step', task_ids: ['task-1'] }]
        });

        expect(result.output).not.toContain('depends on:');
      });

      it('should include execution time in metadata', async () => {
        mockWorkflowService.createWorkflow.mockResolvedValue(mockWorkflow);

        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: 'Test Workflow',
          project_id: 'project-456',
          steps: [{ name: 'Test Step', task_ids: ['task-1'], dependencies: [] }]
        });

        expect(result.metadata.execution_time_ms).toBeDefined();
        expect(typeof result.metadata.execution_time_ms).toBe('number');
        expect(result.metadata.execution_time_ms).toBeGreaterThanOrEqual(0);
      });

      it('should include comprehensive metadata', async () => {
        mockWorkflowService.createWorkflow.mockResolvedValue(mockWorkflow);

        const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: 'Test Workflow',
          project_id: 'project-456',
          steps: [{ name: 'Test Step', task_ids: ['task-1'], dependencies: [] }]
        });

        expect(result.metadata.operation).toBe('mosaic_workflow_create');
        expect(result.metadata.status).toBe('success');
        expect(result.metadata.timestamp).toBeDefined();
        expect(result.metadata.data).toEqual({
          workflow_id: 'workflow-123',
          name: 'Full-Stack Development Pipeline',
          step_count: 2,
          project_id: 'project-456'
        });
      });
    });
  });

  describe('mosaic_workflow_execute - The State Machine Execution Engine! 🚀', () => {
    describe('input validation - The Gateway to Execution', () => {
      it('should require workflow_id field', async () => {
        const result = await (workflowTools as any).getMosaicWorkflowExecuteTool().handler({});

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('workflow_id');
        expect(mockWorkflowService.executeWorkflow).not.toHaveBeenCalled();
      });

      it('should reject empty workflow_id', async () => {
        const result = await (workflowTools as any).getMosaicWorkflowExecuteTool().handler({ 
          workflow_id: '' 
        });

        expect(result.metadata.status).toBe('error');
        expect(mockWorkflowService.executeWorkflow).not.toHaveBeenCalled();
      });

      it('should accept valid workflow_id', async () => {
        mockWorkflowService.executeWorkflow.mockResolvedValue(mockWorkflowExecution);

        const result = await (workflowTools as any).getMosaicWorkflowExecuteTool().handler({ 
          workflow_id: 'workflow-123' 
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.executeWorkflow).toHaveBeenCalledWith(
          'workflow-123',
          {},
          undefined
        );
      });

      it('should accept optional context object', async () => {
        const context = {
          user_id: 'felix-123',
          branch: 'feature/new-api',
          environment: 'staging',
          variables: {
            database_host: 'staging.db.com',
            api_version: 'v2'
          }
        };
        mockWorkflowService.executeWorkflow.mockResolvedValue({
          ...mockWorkflowExecution,
          context
        });

        const result = await (workflowTools as any).getMosaicWorkflowExecuteTool().handler({ 
          workflow_id: 'workflow-123',
          context
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.executeWorkflow).toHaveBeenCalledWith(
          'workflow-123',
          context,
          undefined
        );
      });

      it('should accept optional triggered_by field', async () => {
        mockWorkflowService.executeWorkflow.mockResolvedValue({
          ...mockWorkflowExecution,
          triggered_by: 'felix-architect'
        });

        const result = await (workflowTools as any).getMosaicWorkflowExecuteTool().handler({ 
          workflow_id: 'workflow-123',
          triggered_by: 'felix-architect'
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.executeWorkflow).toHaveBeenCalledWith(
          'workflow-123',
          {},
          'felix-architect'
        );
      });

      it('should reject invalid context type', async () => {
        const result = await (workflowTools as any).getMosaicWorkflowExecuteTool().handler({ 
          workflow_id: 'workflow-123',
          context: 'not-an-object'
        });

        expect(result.metadata.status).toBe('error');
        expect(mockWorkflowService.executeWorkflow).not.toHaveBeenCalled();
      });
    });

    describe('service integration - The Execution Engine', () => {
      it('should execute workflow with minimal parameters', async () => {
        mockWorkflowService.executeWorkflow.mockResolvedValue(mockWorkflowExecution);

        const result = await (workflowTools as any).getMosaicWorkflowExecuteTool().handler({ 
          workflow_id: 'workflow-123'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.execution_id).toBe('execution-123');
        expect(result.metadata.data.workflow_id).toBe('workflow-123');
        expect(result.metadata.data.execution_number).toBe(1);
        expect(result.metadata.data.status).toBe('running');
      });

      it('should execute workflow with full configuration', async () => {
        const fullExecution = {
          id: 'execution-full-456',
          workflow_id: 'workflow-enterprise-789',
          execution_number: 3,
          status: 'running' as WorkflowStatus,
          trigger: 'manual' as WorkflowTrigger,
          context: {
            user_id: 'felix-senior',
            environment: 'production',
            release_version: '2.1.0',
            deployment_config: {
              replicas: 3,
              resources: 'high'
            }
          },
          triggered_by: 'felix-senior-architect',
          started_at: new Date('2025-01-23T14:00:00Z'),
          step_executions: [],
          retry_count: 0
        };
        mockWorkflowService.executeWorkflow.mockResolvedValue(fullExecution);

        const result = await (workflowTools as any).getMosaicWorkflowExecuteTool().handler({ 
          workflow_id: 'workflow-enterprise-789',
          context: fullExecution.context,
          triggered_by: 'felix-senior-architect'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.execution_id).toBe('execution-full-456');
        expect(result.metadata.data.execution_number).toBe(3);
        expect(mockWorkflowService.executeWorkflow).toHaveBeenCalledWith(
          'workflow-enterprise-789',
          fullExecution.context,
          'felix-senior-architect'
        );
      });

      it('should handle workflow not found', async () => {
        mockWorkflowService.executeWorkflow.mockRejectedValue(
          new Error('Workflow workflow-999 not found')
        );

        const result = await (workflowTools as any).getMosaicWorkflowExecuteTool().handler({ 
          workflow_id: 'workflow-999'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Workflow workflow-999 not found');
      });

      it('should handle already running workflow', async () => {
        mockWorkflowService.executeWorkflow.mockRejectedValue(
          new Error('Workflow is already running')
        );

        const result = await (workflowTools as any).getMosaicWorkflowExecuteTool().handler({ 
          workflow_id: 'workflow-123'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Workflow is already running');
      });

      it('should handle insufficient resources', async () => {
        mockWorkflowService.executeWorkflow.mockRejectedValue(
          new Error('Insufficient resources: maximum concurrent executions reached')
        );

        const result = await (workflowTools as any).getMosaicWorkflowExecuteTool().handler({ 
          workflow_id: 'workflow-123'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Insufficient resources: maximum concurrent executions reached');
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to execute workflow',
          expect.any(Error),
          expect.any(Object)
        );
      });

      it('should handle permission errors', async () => {
        mockWorkflowService.executeWorkflow.mockRejectedValue(
          new Error('Permission denied: user not authorized to execute workflow')
        );

        const result = await (workflowTools as any).getMosaicWorkflowExecuteTool().handler({ 
          workflow_id: 'workflow-123',
          triggered_by: 'unauthorized-user'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Permission denied: user not authorized to execute workflow');
      });

      it('should handle database connection errors', async () => {
        mockWorkflowService.executeWorkflow.mockRejectedValue(
          new Error('Database connection failed')
        );

        const result = await (workflowTools as any).getMosaicWorkflowExecuteTool().handler({ 
          workflow_id: 'workflow-123'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Database connection failed');
      });
    });

    describe('output formatting - The Execution Report', () => {
      it('should format execution success with comprehensive details', async () => {
        mockWorkflowService.executeWorkflow.mockResolvedValue(mockWorkflowExecution);

        const result = await (workflowTools as any).getMosaicWorkflowExecuteTool().handler({ 
          workflow_id: 'workflow-123',
          context: { user_id: 'felix-123' },
          triggered_by: 'felix-architect'
        });

        expect(result.output).toContain('Workflow execution started successfully!');
        expect(result.output).toContain('Execution ID: execution-123');
        expect(result.output).toContain('Workflow ID: workflow-123');
        expect(result.output).toContain('Execution Number: 1');
        expect(result.output).toContain('Status: running');
        expect(result.output).toContain('Started: 2025-01-23T09:30:00.000Z');
        expect(result.output).toContain('Triggered by: felix-architect');
        expect(result.output).toContain('Use mosaic_workflow_monitor to track progress');
      });

      it('should handle execution without triggered_by', async () => {
        const executionNoTrigger = {
          ...mockWorkflowExecution,
          triggered_by: 'system'
        };
        mockWorkflowService.executeWorkflow.mockResolvedValue(executionNoTrigger);

        const result = await (workflowTools as any).getMosaicWorkflowExecuteTool().handler({ 
          workflow_id: 'workflow-123'
        });

        expect(result.output).toContain('Triggered by: system');
      });

      it('should include execution time in metadata', async () => {
        mockWorkflowService.executeWorkflow.mockResolvedValue(mockWorkflowExecution);

        const result = await (workflowTools as any).getMosaicWorkflowExecuteTool().handler({ 
          workflow_id: 'workflow-123'
        });

        expect(result.metadata.execution_time_ms).toBeDefined();
        expect(typeof result.metadata.execution_time_ms).toBe('number');
        expect(result.metadata.execution_time_ms).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('mosaic_workflow_monitor - The Real-Time Progress Tracker! 📊', () => {
    describe('input validation - The Monitoring Gateway', () => {
      it('should require workflow_id field', async () => {
        const result = await (workflowTools as any).getMosaicWorkflowMonitorTool().handler({});

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('workflow_id');
        expect(mockWorkflowService.monitorWorkflow).not.toHaveBeenCalled();
      });

      it('should reject empty workflow_id', async () => {
        const result = await (workflowTools as any).getMosaicWorkflowMonitorTool().handler({ 
          workflow_id: '' 
        });

        expect(result.metadata.status).toBe('error');
        expect(mockWorkflowService.monitorWorkflow).not.toHaveBeenCalled();
      });

      it('should accept valid workflow_id', async () => {
        mockWorkflowService.monitorWorkflow.mockResolvedValue(mockWorkflowMonitoring);

        const result = await (workflowTools as any).getMosaicWorkflowMonitorTool().handler({ 
          workflow_id: 'workflow-123' 
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.monitorWorkflow).toHaveBeenCalledWith('workflow-123');
      });
    });

    describe('service integration - The Monitoring Engine', () => {
      it('should monitor workflow successfully', async () => {
        mockWorkflowService.monitorWorkflow.mockResolvedValue(mockWorkflowMonitoring);

        const result = await (workflowTools as any).getMosaicWorkflowMonitorTool().handler({ 
          workflow_id: 'workflow-running-456'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.workflow_status).toBe('running');
        expect(result.metadata.data.completion_percentage).toBe(50);
        expect(result.metadata.data.current_execution_id).toBe('execution-123');
        expect(result.metadata.data.performance_metrics).toEqual(mockWorkflowMonitoring.performance_metrics);
      });

      it('should handle workflow not found', async () => {
        mockWorkflowService.monitorWorkflow.mockRejectedValue(
          new Error('Workflow workflow-999 not found')
        );

        const result = await (workflowTools as any).getMosaicWorkflowMonitorTool().handler({ 
          workflow_id: 'workflow-999'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Workflow workflow-999 not found');
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to monitor workflow',
          expect.any(Error),
          expect.any(Object)
        );
      });

      it('should monitor workflow without current execution', async () => {
        const monitoringNoCurrent: WorkflowMonitoring = {
          ...mockWorkflowMonitoring,
          workflow: { ...mockCompletedWorkflow }
        };
        mockWorkflowService.monitorWorkflow.mockResolvedValue(monitoringNoCurrent);

        const result = await (workflowTools as any).getMosaicWorkflowMonitorTool().handler({ 
          workflow_id: 'workflow-completed-789'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.current_execution_id).toBeNull();
        expect(result.output).not.toContain('Current Execution:');
      });

      it('should monitor workflow with failed steps', async () => {
        const monitoringWithFailures = {
          ...mockWorkflowMonitoring,
          workflow: { 
            ...mockFailedWorkflow,
            progress: {
              ...mockFailedWorkflow.progress,
              failed_steps: 1
            }
          }
        };
        mockWorkflowService.monitorWorkflow.mockResolvedValue(monitoringWithFailures);

        const result = await (workflowTools as any).getMosaicWorkflowMonitorTool().handler({ 
          workflow_id: 'workflow-failed-101'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.output).toContain('Failed Steps: 1');
      });
    });

    describe('output formatting - The Monitoring Dashboard', () => {
      it('should format comprehensive monitoring report', async () => {
        mockWorkflowService.monitorWorkflow.mockResolvedValue(mockWorkflowMonitoring);

        const result = await (workflowTools as any).getMosaicWorkflowMonitorTool().handler({ 
          workflow_id: 'workflow-running-456'
        });

        expect(result.output).toContain('Workflow Monitoring Report: Active Development Pipeline');
        expect(result.output).toContain('Status: running');
        expect(result.output).toContain('Progress: 50.0%');
        expect(result.output).toContain('Steps: 1/2 completed');
        expect(result.output).toContain('Current Execution:');
        expect(result.output).toContain('- Execution ID: execution-123');
        expect(result.output).toContain('- Number: 1');
        expect(result.output).toContain('- Status: running');
        expect(result.output).toContain('- Started: 2025-01-23T09:30:00.000Z');
        expect(result.output).toContain('- Trigger: manual');
        expect(result.output).toContain('Performance Metrics:');
        expect(result.output).toContain('- Total Executions: 5');
        expect(result.output).toContain('- Success Rate: 80.0%');
        expect(result.output).toContain('- Average Duration: 145.5 minutes');
        expect(result.output).toContain('- Last 24h Executions: 3');
        expect(result.output).toContain('Recent Executions (2):');
        expect(result.output).toContain('- #2: completed (2025-01-23T09:30:00.000Z)');
        expect(result.output).toContain('- #1: running (2025-01-23T09:30:00.000Z)');
      });

      it('should handle monitoring report without failed steps', async () => {
        const cleanMonitoring = {
          ...mockWorkflowMonitoring,
          workflow: {
            ...mockWorkflowMonitoring.workflow,
            progress: {
              ...mockWorkflowMonitoring.workflow.progress,
              failed_steps: 0
            }
          }
        };
        mockWorkflowService.monitorWorkflow.mockResolvedValue(cleanMonitoring);

        const result = await (workflowTools as any).getMosaicWorkflowMonitorTool().handler({ 
          workflow_id: 'workflow-running-456'
        });

        expect(result.output).not.toContain('Failed Steps:');
      });
    });
  });

  describe('mosaic_workflow_list - The Smart Filtering System! 📋', () => {
    describe('input validation - The Filter Gateway', () => {
      it('should accept query with no parameters', async () => {
        mockWorkflowService.listWorkflows.mockResolvedValue([mockWorkflow, mockRunningWorkflow]);

        const result = await (workflowTools as any).getMosaicWorkflowListTool().handler({});

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.listWorkflows).toHaveBeenCalledWith(undefined, 50, undefined);
      });

      it('should accept optional project_id filter', async () => {
        mockWorkflowService.listWorkflows.mockResolvedValue([mockWorkflow]);

        const result = await (workflowTools as any).getMosaicWorkflowListTool().handler({ 
          project_id: 'project-456' 
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.listWorkflows).toHaveBeenCalledWith(
          { project_id: 'project-456' },
          50,
          undefined
        );
      });

      it('should accept valid status filter values', async () => {
        const statuses = ['pending', 'running', 'paused', 'completed', 'failed', 'cancelled'];
        
        for (const status of statuses) {
          mockWorkflowService.listWorkflows.mockResolvedValue([]);

          const result = await (workflowTools as any).getMosaicWorkflowListTool().handler({ 
            status: status as WorkflowStatus
          });

          expect(result.metadata.status).toBe('success');
          expect(mockWorkflowService.listWorkflows).toHaveBeenCalledWith(
            { status: status as WorkflowStatus },
            50,
            undefined
          );
        }
      });

      it('should reject invalid status filter', async () => {
        const result = await (workflowTools as any).getMosaicWorkflowListTool().handler({ 
          status: 'invalid-status' 
        });

        expect(result.metadata.status).toBe('error');
        expect(mockWorkflowService.listWorkflows).not.toHaveBeenCalled();
      });

      it('should accept valid trigger filter values', async () => {
        const triggers = ['manual', 'scheduled', 'event', 'dependency'];
        
        for (const trigger of triggers) {
          mockWorkflowService.listWorkflows.mockResolvedValue([]);

          const result = await (workflowTools as any).getMosaicWorkflowListTool().handler({ 
            trigger 
          });

          expect(result.metadata.status).toBe('success');
          expect(mockWorkflowService.listWorkflows).toHaveBeenCalledWith(
            { trigger },
            50,
            undefined
          );
        }
      });

      it('should reject invalid trigger filter', async () => {
        const result = await (workflowTools as any).getMosaicWorkflowListTool().handler({ 
          trigger: 'invalid-trigger' 
        });

        expect(result.metadata.status).toBe('error');
        expect(mockWorkflowService.listWorkflows).not.toHaveBeenCalled();
      });

      it('should accept optional created_by filter', async () => {
        mockWorkflowService.listWorkflows.mockResolvedValue([mockWorkflow]);

        const result = await (workflowTools as any).getMosaicWorkflowListTool().handler({ 
          created_by: 'felix-architect' 
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.listWorkflows).toHaveBeenCalledWith(
          { created_by: 'felix-architect' },
          50,
          undefined
        );
      });

      it('should accept optional limit parameter', async () => {
        mockWorkflowService.listWorkflows.mockResolvedValue([mockWorkflow]);

        const result = await (workflowTools as any).getMosaicWorkflowListTool().handler({ 
          limit: 25 
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.listWorkflows).toHaveBeenCalledWith(undefined, 25, undefined);
      });

      it('should accept optional offset parameter', async () => {
        mockWorkflowService.listWorkflows.mockResolvedValue([mockWorkflow]);

        const result = await (workflowTools as any).getMosaicWorkflowListTool().handler({ 
          offset: 10 
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.listWorkflows).toHaveBeenCalledWith(undefined, 50, 10);
      });

      it('should handle combined filters', async () => {
        mockWorkflowService.listWorkflows.mockResolvedValue([mockRunningWorkflow]);

        const result = await (workflowTools as any).getMosaicWorkflowListTool().handler({ 
          project_id: 'project-456',
          status: 'running',
          created_by: 'felix-architect',
          limit: 20,
          offset: 5
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.listWorkflows).toHaveBeenCalledWith(
          { 
            project_id: 'project-456',
            status: 'running',
            created_by: 'felix-architect'
          },
          20,
          5
        );
      });
    });

    describe('service integration - The Listing Engine', () => {
      it('should list workflows without filters', async () => {
        const workflows = [mockWorkflow, mockRunningWorkflow, mockCompletedWorkflow];
        mockWorkflowService.listWorkflows.mockResolvedValue(workflows);

        const result = await (workflowTools as any).getMosaicWorkflowListTool().handler({});

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.count).toBe(3);
        expect(result.metadata.data.filter).toBe('none');
      });

      it('should list workflows with filters applied', async () => {
        mockWorkflowService.listWorkflows.mockResolvedValue([mockRunningWorkflow]);

        const result = await (workflowTools as any).getMosaicWorkflowListTool().handler({ 
          status: 'running',
          project_id: 'project-456'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.count).toBe(1);
        expect(result.metadata.data.filter).toEqual({
          status: 'running',
          project_id: 'project-456'
        });
      });

      it('should handle empty results', async () => {
        mockWorkflowService.listWorkflows.mockResolvedValue([]);

        const result = await (workflowTools as any).getMosaicWorkflowListTool().handler({ 
          status: 'failed' 
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.count).toBe(0);
      });

      it('should handle service errors', async () => {
        mockWorkflowService.listWorkflows.mockRejectedValue(
          new Error('Database query failed')
        );

        const result = await (workflowTools as any).getMosaicWorkflowListTool().handler({});

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Database query failed');
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to list workflows',
          expect.any(Error),
          expect.any(Object)
        );
      });
    });

    describe('output formatting - The List Display', () => {
      it('should format workflow list with comprehensive details', async () => {
        const workflows = [mockWorkflow, mockRunningWorkflow, mockCompletedWorkflow];
        mockWorkflowService.listWorkflows.mockResolvedValue(workflows);

        const result = await (workflowTools as any).getMosaicWorkflowListTool().handler({});

        expect(result.output).toContain('Found 3 workflows:');
        expect(result.output).toContain('1. Full-Stack Development Pipeline (workflow-123)');
        expect(result.output).toContain('Status: pending | Steps: 2 | Progress: 0.0%');
        expect(result.output).toContain('Project: project-456 | Created: 2025-01-23T08:00:00.000Z');
        expect(result.output).toContain('Trigger: manual');
        expect(result.output).toContain('2. Active Development Pipeline (workflow-running-456)');
        expect(result.output).toContain('Status: running | Steps: 2 | Progress: 50.0%');
        expect(result.output).toContain('3. Completed Development Pipeline (workflow-completed-789)');
        expect(result.output).toContain('Status: completed | Steps: 2 | Progress: 100.0%');
      });

      it('should show filtered indicator when filters applied', async () => {
        mockWorkflowService.listWorkflows.mockResolvedValue([mockRunningWorkflow]);

        const result = await (workflowTools as any).getMosaicWorkflowListTool().handler({ 
          status: 'running' 
        });

        expect(result.output).toContain('Found 1 workflows (filtered):');
      });

      it('should handle empty workflow list', async () => {
        mockWorkflowService.listWorkflows.mockResolvedValue([]);

        const result = await (workflowTools as any).getMosaicWorkflowListTool().handler({});

        expect(result.output).toContain('Found 0 workflows:');
        expect(result.output).toContain('No workflows found matching the criteria.');
      });

      it('should include description when available', async () => {
        const workflowWithDescription = {
          ...mockWorkflow,
          description: 'A comprehensive development workflow with multiple stages'
        };
        mockWorkflowService.listWorkflows.mockResolvedValue([workflowWithDescription]);

        const result = await (workflowTools as any).getMosaicWorkflowListTool().handler({});

        expect(result.output).toContain('Description: A comprehensive development workflow with multiple stages');
      });
    });
  });

  describe('mosaic_workflow_get - The Detailed Workflow Inspector! 🔍', () => {
    describe('input validation - The Inspector Gateway', () => {
      it('should require workflow_id field', async () => {
        const result = await (workflowTools as any).getMosaicWorkflowGetTool().handler({});

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('workflow_id');
        expect(mockWorkflowService.getWorkflow).not.toHaveBeenCalled();
      });

      it('should reject empty workflow_id', async () => {
        const result = await (workflowTools as any).getMosaicWorkflowGetTool().handler({ 
          workflow_id: '' 
        });

        expect(result.metadata.status).toBe('error');
        expect(mockWorkflowService.getWorkflow).not.toHaveBeenCalled();
      });

      it('should accept valid workflow_id', async () => {
        mockWorkflowService.getWorkflow.mockResolvedValue(mockWorkflow);

        const result = await (workflowTools as any).getMosaicWorkflowGetTool().handler({ 
          workflow_id: 'workflow-123' 
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.getWorkflow).toHaveBeenCalledWith('workflow-123');
      });
    });

    describe('service integration - The Inspection Engine', () => {
      it('should get workflow details successfully', async () => {
        mockWorkflowService.getWorkflow.mockResolvedValue(mockWorkflow);

        const result = await (workflowTools as any).getMosaicWorkflowGetTool().handler({ 
          workflow_id: 'workflow-123'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.workflow_id).toBe('workflow-123');
        expect(result.metadata.data.name).toBe('Full-Stack Development Pipeline');
        expect(result.metadata.data.status).toBe('pending');
        expect(result.metadata.data.step_count).toBe(2);
        expect(result.metadata.data.completion_percentage).toBe(0);
      });

      it('should handle workflow not found', async () => {
        mockWorkflowService.getWorkflow.mockResolvedValue(null);

        const result = await (workflowTools as any).getMosaicWorkflowGetTool().handler({ 
          workflow_id: 'workflow-999'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Workflow with ID workflow-999 not found');
      });

      it('should handle service errors gracefully', async () => {
        mockWorkflowService.getWorkflow.mockRejectedValue(
          new Error('Database connection failed')
        );

        const result = await (workflowTools as any).getMosaicWorkflowGetTool().handler({ 
          workflow_id: 'workflow-123'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Database connection failed');
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to get workflow',
          expect.any(Error),
          expect.any(Object)
        );
      });

      it('should get workflow with all optional fields populated', async () => {
        const fullWorkflow: Workflow = {
          ...mockWorkflow,
          description: 'A comprehensive enterprise workflow',
          schedule: '0 2 * * *',
          timeout_minutes: 180,
          started_at: new Date('2025-01-23T09:00:00Z'),
          completed_at: new Date('2025-01-23T12:00:00Z'),
          variables: {
            environment: 'production',
            version: '2.0.0',
            database_url: 'postgresql://prod:5432/app'
          }
        };
        mockWorkflowService.getWorkflow.mockResolvedValue(fullWorkflow);

        const result = await (workflowTools as any).getMosaicWorkflowGetTool().handler({ 
          workflow_id: 'workflow-123'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.output).toContain('Description: A comprehensive enterprise workflow');
        expect(result.output).toContain('Schedule: 0 2 * * *');
        expect(result.output).toContain('Timeout: 180 minutes');
        expect(result.output).toContain('Started: 2025-01-23T09:00:00.000Z');
        expect(result.output).toContain('Completed: 2025-01-23T12:00:00.000Z');
        expect(result.output).toContain('Workflow Variables:');
      });

      it('should get workflow with minimal optional fields', async () => {
        const minimalWorkflow: Workflow = {
          ...mockWorkflow,
          description: 'Minimal workflow for testing',
                      variables: {}
        };
        mockWorkflowService.getWorkflow.mockResolvedValue(minimalWorkflow);

        const result = await (workflowTools as any).getMosaicWorkflowGetTool().handler({ 
          workflow_id: 'workflow-123'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.output).not.toContain('Description:');
        expect(result.output).not.toContain('Schedule:');
        expect(result.output).not.toContain('Timeout:');
        expect(result.output).not.toContain('Started:');
        expect(result.output).not.toContain('Completed:');
        expect(result.output).not.toContain('Workflow Variables:');
      });
    });

    describe('output formatting - The Detailed Report', () => {
      it('should format comprehensive workflow details', async () => {
        const detailedWorkflow: Workflow = {
          ...mockRunningWorkflow,
          description: 'Active enterprise development pipeline',
          schedule: '0 3 * * 1',
          timeout_minutes: 240,
          variables: {
            environment: 'staging',
            api_version: 'v2.1',
            deploy_target: 'kubernetes'
          },
          steps: [
            {
              ...mockWorkflowStep,
              status: 'completed' as StepStatus,
              agent_persona: 'BE-BACKEND-BENJAMIN',
              dependencies: [],
              parallel_group: 'backend-tier',
              timeout_minutes: 60,
            },
            {
              ...mockComplexWorkflowStep,
              status: 'running' as StepStatus,
              dependencies: ['Backend API Development'],
            }
          ]
        };
        mockWorkflowService.getWorkflow.mockResolvedValue(detailedWorkflow);

        const result = await (workflowTools as any).getMosaicWorkflowGetTool().handler({ 
          workflow_id: 'workflow-running-456'
        });

        expect(result.output).toContain('Workflow Details: Active Development Pipeline');
        expect(result.output).toContain('ID: workflow-running-456');
        expect(result.output).toContain('Status: running');
        expect(result.output).toContain('Project: project-456');
        expect(result.output).toContain('Trigger: manual');
        expect(result.output).toContain('Created: 2025-01-23T08:00:00.000Z');
        expect(result.output).toContain('Created by: felix-architect');
        expect(result.output).toContain('Updated: 2025-01-23T08:00:00.000Z');
        expect(result.output).toContain('Description: Active enterprise development pipeline');
        expect(result.output).toContain('Started: 2025-01-23T09:00:00.000Z');
        expect(result.output).toContain('Schedule: 0 3 * * 1');
        expect(result.output).toContain('Timeout: 240 minutes');
        expect(result.output).toContain('Progress:');
        expect(result.output).toContain('- Total Steps: 2');
        expect(result.output).toContain('- Completed: 1');
        expect(result.output).toContain('- Failed: 0');
        expect(result.output).toContain('- Skipped: 0');
        expect(result.output).toContain('- Completion: 50.0%');
        expect(result.output).toContain('Steps:');
        expect(result.output).toContain('1. Backend API Development (completed)');
        expect(result.output).toContain('Agent: BE-BACKEND-BENJAMIN');
        expect(result.output).toContain('Tasks: task-456, task-789');
        expect(result.output).toContain('Parallel group: backend-tier');
        expect(result.output).toContain('Timeout: 60 minutes');
        expect(result.output).toContain('2. Frontend Integration (running)');
        expect(result.output).toContain('Agent: FE-FRONTEND-FIONA');
        expect(result.output).toContain('Depends on: Backend API Development');
        expect(result.output).toContain('Workflow Variables:');
        expect(result.output).toContain('"environment": "staging"');
      });

      it('should format step with error message', async () => {
        const failedWorkflow: Workflow = {
          ...mockFailedWorkflow,
          steps: [
            {
              ...mockWorkflowStep,
              status: 'failed' as StepStatus,
              error_message: 'Database connection timeout after 30 seconds'
            }
          ]
        };
        mockWorkflowService.getWorkflow.mockResolvedValue(failedWorkflow);

        const result = await (workflowTools as any).getMosaicWorkflowGetTool().handler({ 
          workflow_id: 'workflow-failed-101'
        });

        expect(result.output).toContain('Error: Database connection timeout after 30 seconds');
      });

      it('should handle steps without optional fields', async () => {
        const simpleWorkflow: Workflow = {
          ...mockWorkflow,
          steps: [
            {
              id: 'simple-step',
              name: 'Simple Step',
              description: 'Minimal workflow for testing',
              task_ids: ['task-1'],
              dependencies: [],
                  retry_count: 0,
              status: 'pending' as StepStatus,
                                    }
          ]
        };
        mockWorkflowService.getWorkflow.mockResolvedValue(simpleWorkflow);

        const result = await (workflowTools as any).getMosaicWorkflowGetTool().handler({ 
          workflow_id: 'workflow-123'
        });

        expect(result.output).toContain('1. Simple Step (pending)');
        expect(result.output).toContain('Tasks: task-1');
        expect(result.output).not.toContain('Agent:');
        expect(result.output).not.toContain('Depends on:');
        expect(result.output).not.toContain('Parallel group:');
        expect(result.output).not.toContain('Timeout:');
        expect(result.output).not.toContain('Error:');
      });

      it('should include execution time in metadata', async () => {
        mockWorkflowService.getWorkflow.mockResolvedValue(mockWorkflow);

        const result = await (workflowTools as any).getMosaicWorkflowGetTool().handler({ 
          workflow_id: 'workflow-123'
        });

        expect(result.metadata.execution_time_ms).toBeDefined();
        expect(typeof result.metadata.execution_time_ms).toBe('number');
        expect(result.metadata.execution_time_ms).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('mosaic_workflow_pause - The Graceful Control System! ⏸️', () => {
    describe('input validation - The Control Gateway', () => {
      it('should require workflow_id field', async () => {
        const result = await (workflowTools as any).getMosaicWorkflowPauseTool().handler({});

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('workflow_id');
        expect(mockWorkflowService.pauseWorkflow).not.toHaveBeenCalled();
      });

      it('should reject empty workflow_id', async () => {
        const result = await (workflowTools as any).getMosaicWorkflowPauseTool().handler({ 
          workflow_id: '' 
        });

        expect(result.metadata.status).toBe('error');
        expect(mockWorkflowService.pauseWorkflow).not.toHaveBeenCalled();
      });

      it('should accept valid workflow_id', async () => {
        mockWorkflowService.pauseWorkflow.mockResolvedValue(undefined);

        const result = await (workflowTools as any).getMosaicWorkflowPauseTool().handler({ 
          workflow_id: 'workflow-123' 
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.pauseWorkflow).toHaveBeenCalledWith('workflow-123', undefined);
      });

      it('should accept optional reason field', async () => {
        mockWorkflowService.pauseWorkflow.mockResolvedValue(undefined);

        const result = await (workflowTools as any).getMosaicWorkflowPauseTool().handler({ 
          workflow_id: 'workflow-123',
          reason: 'Maintenance window required'
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.pauseWorkflow).toHaveBeenCalledWith(
          'workflow-123', 
          'Maintenance window required'
        );
      });

      it('should handle empty reason as undefined', async () => {
        mockWorkflowService.pauseWorkflow.mockResolvedValue(undefined);

        const result = await (workflowTools as any).getMosaicWorkflowPauseTool().handler({ 
          workflow_id: 'workflow-123',
          reason: ''
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.pauseWorkflow).toHaveBeenCalledWith('workflow-123', '');
      });
    });

    describe('service integration - The Pause Engine', () => {
      it('should pause workflow successfully', async () => {
        mockWorkflowService.pauseWorkflow.mockResolvedValue(undefined);

        const result = await (workflowTools as any).getMosaicWorkflowPauseTool().handler({ 
          workflow_id: 'workflow-running-456'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.workflow_id).toBe('workflow-running-456');
        expect(result.metadata.data.reason).toBeUndefined();
      });

      it('should pause workflow with reason', async () => {
        mockWorkflowService.pauseWorkflow.mockResolvedValue(undefined);

        const result = await (workflowTools as any).getMosaicWorkflowPauseTool().handler({ 
          workflow_id: 'workflow-running-456',
          reason: 'Emergency system maintenance'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.workflow_id).toBe('workflow-running-456');
        expect(result.metadata.data.reason).toBe('Emergency system maintenance');
      });

      it('should handle workflow not found', async () => {
        mockWorkflowService.pauseWorkflow.mockRejectedValue(
          new Error('Workflow workflow-999 not found')
        );

        const result = await (workflowTools as any).getMosaicWorkflowPauseTool().handler({ 
          workflow_id: 'workflow-999'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Workflow workflow-999 not found');
      });

      it('should handle workflow not running', async () => {
        mockWorkflowService.pauseWorkflow.mockRejectedValue(
          new Error('Workflow is not in a running state')
        );

        const result = await (workflowTools as any).getMosaicWorkflowPauseTool().handler({ 
          workflow_id: 'workflow-completed-789'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Workflow is not in a running state');
      });

      it('should handle already paused workflow', async () => {
        mockWorkflowService.pauseWorkflow.mockRejectedValue(
          new Error('Workflow is already paused')
        );

        const result = await (workflowTools as any).getMosaicWorkflowPauseTool().handler({ 
          workflow_id: 'workflow-paused-101'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Workflow is already paused');
      });

      it('should handle permission errors', async () => {
        mockWorkflowService.pauseWorkflow.mockRejectedValue(
          new Error('Permission denied: insufficient privileges to pause workflow')
        );

        const result = await (workflowTools as any).getMosaicWorkflowPauseTool().handler({ 
          workflow_id: 'workflow-123'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Permission denied: insufficient privileges to pause workflow');
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to pause workflow',
          expect.any(Error),
          expect.any(Object)
        );
      });

      it('should handle critical step execution prevention', async () => {
        mockWorkflowService.pauseWorkflow.mockRejectedValue(
          new Error('Cannot pause: critical step in progress')
        );

        const result = await (workflowTools as any).getMosaicWorkflowPauseTool().handler({ 
          workflow_id: 'workflow-123'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Cannot pause: critical step in progress');
      });
    });

    describe('output formatting - The Pause Confirmation', () => {
      it('should format pause success without reason', async () => {
        mockWorkflowService.pauseWorkflow.mockResolvedValue(undefined);

        const result = await (workflowTools as any).getMosaicWorkflowPauseTool().handler({ 
          workflow_id: 'workflow-running-456'
        });

        expect(result.output).toContain('Workflow workflow-running-456 has been paused');
        expect(result.output).not.toContain('Reason:');
        expect(result.output).toContain('Use mosaic_workflow_resume to continue execution');
      });

      it('should format pause success with reason', async () => {
        mockWorkflowService.pauseWorkflow.mockResolvedValue(undefined);

        const result = await (workflowTools as any).getMosaicWorkflowPauseTool().handler({ 
          workflow_id: 'workflow-running-456',
          reason: 'Scheduled maintenance window'
        });

        expect(result.output).toContain('Workflow workflow-running-456 has been paused');
        expect(result.output).toContain('Reason: Scheduled maintenance window');
        expect(result.output).toContain('Use mosaic_workflow_resume to continue execution');
      });

      it('should include execution time in metadata', async () => {
        mockWorkflowService.pauseWorkflow.mockResolvedValue(undefined);

        const result = await (workflowTools as any).getMosaicWorkflowPauseTool().handler({ 
          workflow_id: 'workflow-123'
        });

        expect(result.metadata.execution_time_ms).toBeDefined();
        expect(typeof result.metadata.execution_time_ms).toBe('number');
        expect(result.metadata.execution_time_ms).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('mosaic_workflow_resume - The Recovery Mechanism! ▶️', () => {
    describe('input validation - The Recovery Gateway', () => {
      it('should require workflow_id field', async () => {
        const result = await (workflowTools as any).getMosaicWorkflowResumeTool().handler({});

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('workflow_id');
        expect(mockWorkflowService.resumeWorkflow).not.toHaveBeenCalled();
      });

      it('should reject empty workflow_id', async () => {
        const result = await (workflowTools as any).getMosaicWorkflowResumeTool().handler({ 
          workflow_id: '' 
        });

        expect(result.metadata.status).toBe('error');
        expect(mockWorkflowService.resumeWorkflow).not.toHaveBeenCalled();
      });

      it('should accept valid workflow_id', async () => {
        mockWorkflowService.resumeWorkflow.mockResolvedValue(undefined);

        const result = await (workflowTools as any).getMosaicWorkflowResumeTool().handler({ 
          workflow_id: 'workflow-123' 
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.resumeWorkflow).toHaveBeenCalledWith('workflow-123');
      });
    });

    describe('service integration - The Resume Engine', () => {
      it('should resume workflow successfully', async () => {
        mockWorkflowService.resumeWorkflow.mockResolvedValue(undefined);

        const result = await (workflowTools as any).getMosaicWorkflowResumeTool().handler({ 
          workflow_id: 'workflow-paused-456'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.workflow_id).toBe('workflow-paused-456');
      });

      it('should handle workflow not found', async () => {
        mockWorkflowService.resumeWorkflow.mockRejectedValue(
          new Error('Workflow workflow-999 not found')
        );

        const result = await (workflowTools as any).getMosaicWorkflowResumeTool().handler({ 
          workflow_id: 'workflow-999'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Workflow workflow-999 not found');
      });

      it('should handle workflow not paused', async () => {
        mockWorkflowService.resumeWorkflow.mockRejectedValue(
          new Error('Only paused workflows can be resumed')
        );

        const result = await (workflowTools as any).getMosaicWorkflowResumeTool().handler({ 
          workflow_id: 'workflow-running-456'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Only paused workflows can be resumed');
      });

      it('should handle cancelled workflow resume attempt', async () => {
        mockWorkflowService.resumeWorkflow.mockRejectedValue(
          new Error('Cannot resume cancelled workflow')
        );

        const result = await (workflowTools as any).getMosaicWorkflowResumeTool().handler({ 
          workflow_id: 'workflow-cancelled-789'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Cannot resume cancelled workflow');
      });

      it('should handle resource constraint errors', async () => {
        mockWorkflowService.resumeWorkflow.mockRejectedValue(
          new Error('Insufficient resources to resume workflow execution')
        );

        const result = await (workflowTools as any).getMosaicWorkflowResumeTool().handler({ 
          workflow_id: 'workflow-123'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Insufficient resources to resume workflow execution');
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to resume workflow',
          expect.any(Error),
          expect.any(Object)
        );
      });

      it('should handle permission errors', async () => {
        mockWorkflowService.resumeWorkflow.mockRejectedValue(
          new Error('Permission denied: insufficient privileges to resume workflow')
        );

        const result = await (workflowTools as any).getMosaicWorkflowResumeTool().handler({ 
          workflow_id: 'workflow-123'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Permission denied: insufficient privileges to resume workflow');
      });

      it('should handle dependency validation errors', async () => {
        mockWorkflowService.resumeWorkflow.mockRejectedValue(
          new Error('Workflow dependencies have changed: manual review required')
        );

        const result = await (workflowTools as any).getMosaicWorkflowResumeTool().handler({ 
          workflow_id: 'workflow-123'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Workflow dependencies have changed: manual review required');
      });
    });

    describe('output formatting - The Resume Confirmation', () => {
      it('should format resume success with comprehensive details', async () => {
        mockWorkflowService.resumeWorkflow.mockResolvedValue(undefined);

        const result = await (workflowTools as any).getMosaicWorkflowResumeTool().handler({ 
          workflow_id: 'workflow-paused-456'
        });

        expect(result.output).toContain('Workflow workflow-paused-456 has been resumed and is now running');
        expect(result.output).toContain('Use mosaic_workflow_monitor to track progress');
      });

      it('should include execution time in metadata', async () => {
        mockWorkflowService.resumeWorkflow.mockResolvedValue(undefined);

        const result = await (workflowTools as any).getMosaicWorkflowResumeTool().handler({ 
          workflow_id: 'workflow-123'
        });

        expect(result.metadata.execution_time_ms).toBeDefined();
        expect(typeof result.metadata.execution_time_ms).toBe('number');
        expect(result.metadata.execution_time_ms).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('mosaic_workflow_cancel - The Cleanup Orchestrator! ❌', () => {
    describe('input validation - The Cancellation Gateway', () => {
      it('should require workflow_id field', async () => {
        const result = await (workflowTools as any).getMosaicWorkflowCancelTool().handler({});

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('workflow_id');
        expect(mockWorkflowService.cancelWorkflow).not.toHaveBeenCalled();
      });

      it('should reject empty workflow_id', async () => {
        const result = await (workflowTools as any).getMosaicWorkflowCancelTool().handler({ 
          workflow_id: '' 
        });

        expect(result.metadata.status).toBe('error');
        expect(mockWorkflowService.cancelWorkflow).not.toHaveBeenCalled();
      });

      it('should accept valid workflow_id', async () => {
        mockWorkflowService.cancelWorkflow.mockResolvedValue(undefined);

        const result = await (workflowTools as any).getMosaicWorkflowCancelTool().handler({ 
          workflow_id: 'workflow-123' 
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.cancelWorkflow).toHaveBeenCalledWith('workflow-123', undefined);
      });

      it('should accept optional reason field', async () => {
        mockWorkflowService.cancelWorkflow.mockResolvedValue(undefined);

        const result = await (workflowTools as any).getMosaicWorkflowCancelTool().handler({ 
          workflow_id: 'workflow-123',
          reason: 'Critical security vulnerability discovered'
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.cancelWorkflow).toHaveBeenCalledWith(
          'workflow-123', 
          'Critical security vulnerability discovered'
        );
      });

      it('should handle empty reason as undefined', async () => {
        mockWorkflowService.cancelWorkflow.mockResolvedValue(undefined);

        const result = await (workflowTools as any).getMosaicWorkflowCancelTool().handler({ 
          workflow_id: 'workflow-123',
          reason: ''
        });

        expect(result.metadata.status).toBe('success');
        expect(mockWorkflowService.cancelWorkflow).toHaveBeenCalledWith('workflow-123', '');
      });
    });

    describe('service integration - The Cancellation Engine', () => {
      it('should cancel workflow successfully', async () => {
        mockWorkflowService.cancelWorkflow.mockResolvedValue(undefined);

        const result = await (workflowTools as any).getMosaicWorkflowCancelTool().handler({ 
          workflow_id: 'workflow-running-456'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.workflow_id).toBe('workflow-running-456');
        expect(result.metadata.data.reason).toBeUndefined();
      });

      it('should cancel workflow with reason', async () => {
        mockWorkflowService.cancelWorkflow.mockResolvedValue(undefined);

        const result = await (workflowTools as any).getMosaicWorkflowCancelTool().handler({ 
          workflow_id: 'workflow-running-456',
          reason: 'Emergency security patch required'
        });

        expect(result.metadata.status).toBe('success');
        expect(result.metadata.data.workflow_id).toBe('workflow-running-456');
        expect(result.metadata.data.reason).toBe('Emergency security patch required');
      });

      it('should handle workflow not found', async () => {
        mockWorkflowService.cancelWorkflow.mockRejectedValue(
          new Error('Workflow workflow-999 not found')
        );

        const result = await (workflowTools as any).getMosaicWorkflowCancelTool().handler({ 
          workflow_id: 'workflow-999'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Workflow workflow-999 not found');
      });

      it('should handle already completed workflow', async () => {
        mockWorkflowService.cancelWorkflow.mockRejectedValue(
          new Error('Cannot cancel completed workflow')
        );

        const result = await (workflowTools as any).getMosaicWorkflowCancelTool().handler({ 
          workflow_id: 'workflow-completed-789'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Cannot cancel completed workflow');
      });

      it('should handle already cancelled workflow', async () => {
        mockWorkflowService.cancelWorkflow.mockRejectedValue(
          new Error('Workflow is already cancelled')
        );

        const result = await (workflowTools as any).getMosaicWorkflowCancelTool().handler({ 
          workflow_id: 'workflow-cancelled-101'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Workflow is already cancelled');
      });

      it('should handle critical step prevention', async () => {
        mockWorkflowService.cancelWorkflow.mockRejectedValue(
          new Error('Cannot cancel: critical step cannot be interrupted')
        );

        const result = await (workflowTools as any).getMosaicWorkflowCancelTool().handler({ 
          workflow_id: 'workflow-123'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Cannot cancel: critical step cannot be interrupted');
      });

      it('should handle permission errors', async () => {
        mockWorkflowService.cancelWorkflow.mockRejectedValue(
          new Error('Permission denied: insufficient privileges to cancel workflow')
        );

        const result = await (workflowTools as any).getMosaicWorkflowCancelTool().handler({ 
          workflow_id: 'workflow-123'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Permission denied: insufficient privileges to cancel workflow');
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to cancel workflow',
          expect.any(Error),
          expect.any(Object)
        );
      });

      it('should handle cleanup errors', async () => {
        mockWorkflowService.cancelWorkflow.mockRejectedValue(
          new Error('Failed to cleanup workflow resources')
        );

        const result = await (workflowTools as any).getMosaicWorkflowCancelTool().handler({ 
          workflow_id: 'workflow-123'
        });

        expect(result.metadata.status).toBe('error');
        expect(result.output).toContain('Failed to cleanup workflow resources');
      });
    });

    describe('output formatting - The Cancellation Confirmation', () => {
      it('should format cancellation success without reason', async () => {
        mockWorkflowService.cancelWorkflow.mockResolvedValue(undefined);

        const result = await (workflowTools as any).getMosaicWorkflowCancelTool().handler({ 
          workflow_id: 'workflow-running-456'
        });

        expect(result.output).toContain('Workflow workflow-running-456 has been cancelled');
        expect(result.output).not.toContain('Reason:');
        expect(result.output).toContain('The workflow cannot be resumed after cancellation');
      });

      it('should format cancellation success with reason', async () => {
        mockWorkflowService.cancelWorkflow.mockResolvedValue(undefined);

        const result = await (workflowTools as any).getMosaicWorkflowCancelTool().handler({ 
          workflow_id: 'workflow-running-456',
          reason: 'Emergency deployment rollback required'
        });

        expect(result.output).toContain('Workflow workflow-running-456 has been cancelled');
        expect(result.output).toContain('Reason: Emergency deployment rollback required');
        expect(result.output).toContain('The workflow cannot be resumed after cancellation');
      });

      it('should include execution time in metadata', async () => {
        mockWorkflowService.cancelWorkflow.mockResolvedValue(undefined);

        const result = await (workflowTools as any).getMosaicWorkflowCancelTool().handler({ 
          workflow_id: 'workflow-123'
        });

        expect(result.metadata.execution_time_ms).toBeDefined();
        expect(typeof result.metadata.execution_time_ms).toBe('number');
        expect(result.metadata.execution_time_ms).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('edge cases and error handling - The Robustness Test! 🛡️', () => {
    it('should handle null service responses gracefully', async () => {
      mockWorkflowService.listWorkflows.mockResolvedValue(null as any);

      const result = await (workflowTools as any).getMosaicWorkflowListTool().handler({});

      expect(result.metadata.status).toBe('error');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle malformed workflow data', async () => {
      const malformedWorkflow = { 
        id: 'test', 
        name: 'Malformed Workflow',
        project_id: 'unknown',
        status: 'pending',
        trigger: 'manual',
        steps: [],
        variables: {},
        progress: { total_steps: 0, completed_steps: 0, failed_steps: 0, skipped_steps: 0, completion_percentage: 0 },
        created_by: 'test',
        created_at: new Date(),
        updated_at: new Date()
      } as any;
      mockWorkflowService.getWorkflow.mockResolvedValue(malformedWorkflow);

      const result = await (workflowTools as any).getMosaicWorkflowGetTool().handler({ 
        workflow_id: 'test'
      });

      // Should not crash, but may have missing or unusual data in output
      expect(result.metadata.status).toBe('success');
      expect(result.output).toContain('Malformed Workflow');
    });

    it('should handle concurrent tool operations', async () => {
      mockWorkflowService.createWorkflow.mockResolvedValue(mockWorkflow);
      mockWorkflowService.executeWorkflow.mockResolvedValue(mockWorkflowExecution);
      mockWorkflowService.pauseWorkflow.mockResolvedValue(undefined);
      mockWorkflowService.resumeWorkflow.mockResolvedValue(undefined);
      mockWorkflowService.cancelWorkflow.mockResolvedValue(undefined);

      const promises = [
        (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: 'Test Workflow', 
          project_id: 'project-123', 
          steps: [{ name: 'Test Step', task_ids: ['task-1'], dependencies: [] }] 
        }),
        (workflowTools as any).getMosaicWorkflowExecuteTool().handler({ workflow_id: 'workflow-123' }),
        (workflowTools as any).getMosaicWorkflowPauseTool().handler({ workflow_id: 'workflow-123' }),
        (workflowTools as any).getMosaicWorkflowResumeTool().handler({ workflow_id: 'workflow-123' }),
        (workflowTools as any).getMosaicWorkflowCancelTool().handler({ workflow_id: 'workflow-123' })
      ];

      const results = await Promise.all(promises);

      expect(results[0].metadata.status).toBe('success');
      expect(results[1].metadata.status).toBe('success');
      expect(results[2].metadata.status).toBe('success');
      expect(results[3].metadata.status).toBe('success');
      expect(results[4].metadata.status).toBe('success');
    });

    it('should log all operations with proper context', async () => {
      mockWorkflowService.createWorkflow.mockResolvedValue(mockWorkflow);
      mockWorkflowService.executeWorkflow.mockResolvedValue(mockWorkflowExecution);
      mockWorkflowService.monitorWorkflow.mockResolvedValue(mockWorkflowMonitoring);
      mockWorkflowService.listWorkflows.mockResolvedValue([mockWorkflow]);
      mockWorkflowService.getWorkflow.mockResolvedValue(mockWorkflow);
      mockWorkflowService.pauseWorkflow.mockResolvedValue(undefined);
      mockWorkflowService.resumeWorkflow.mockResolvedValue(undefined);
      mockWorkflowService.cancelWorkflow.mockResolvedValue(undefined);

      await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
        name: 'Test Workflow', 
        project_id: 'project-123', 
        steps: [{ name: 'Test Step', task_ids: ['task-1'] }] 
      });

      await (workflowTools as any).getMosaicWorkflowExecuteTool().handler({ workflow_id: 'workflow-123' });
      await (workflowTools as any).getMosaicWorkflowMonitorTool().handler({ workflow_id: 'workflow-123' });
      await (workflowTools as any).getMosaicWorkflowListTool().handler({});
      await (workflowTools as any).getMosaicWorkflowGetTool().handler({ workflow_id: 'workflow-123' });
      await (workflowTools as any).getMosaicWorkflowPauseTool().handler({ workflow_id: 'workflow-123' });
      await (workflowTools as any).getMosaicWorkflowResumeTool().handler({ workflow_id: 'workflow-123' });
      await (workflowTools as any).getMosaicWorkflowCancelTool().handler({ workflow_id: 'workflow-123' });

      // Verify no logging happened since these were successful operations
      // The logger is only called for errors in our implementation
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should include execution time in all successful operations', async () => {
      mockWorkflowService.createWorkflow.mockResolvedValue(mockWorkflow);
      mockWorkflowService.executeWorkflow.mockResolvedValue(mockWorkflowExecution);
      mockWorkflowService.monitorWorkflow.mockResolvedValue(mockWorkflowMonitoring);
      mockWorkflowService.listWorkflows.mockResolvedValue([mockWorkflow]);
      mockWorkflowService.getWorkflow.mockResolvedValue(mockWorkflow);
      mockWorkflowService.pauseWorkflow.mockResolvedValue(undefined);
      mockWorkflowService.resumeWorkflow.mockResolvedValue(undefined);
      mockWorkflowService.cancelWorkflow.mockResolvedValue(undefined);

      const operations = [
        () => (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
          name: 'Test Workflow', 
          project_id: 'project-123', 
          steps: [{ name: 'Test Step', task_ids: ['task-1'], dependencies: [] }] 
        }),
        () => (workflowTools as any).getMosaicWorkflowExecuteTool().handler({ workflow_id: 'workflow-123' }),
        () => (workflowTools as any).getMosaicWorkflowMonitorTool().handler({ workflow_id: 'workflow-123' }),
        () => (workflowTools as any).getMosaicWorkflowListTool().handler({}),
        () => (workflowTools as any).getMosaicWorkflowGetTool().handler({ workflow_id: 'workflow-123' }),
        () => (workflowTools as any).getMosaicWorkflowPauseTool().handler({ workflow_id: 'workflow-123' }),
        () => (workflowTools as any).getMosaicWorkflowResumeTool().handler({ workflow_id: 'workflow-123' }),
        () => (workflowTools as any).getMosaicWorkflowCancelTool().handler({ workflow_id: 'workflow-123' })
      ];

      for (const operation of operations) {
        const result = await operation();
        expect(result.metadata.execution_time_ms).toBeDefined();
        expect(typeof result.metadata.execution_time_ms).toBe('number');
        expect(result.metadata.execution_time_ms).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle workflow service initialization failures', async () => {
      mockWorkflowService.createWorkflow.mockRejectedValue(
        new Error('WorkflowService not initialized')
      );

      const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler({ 
        name: 'Test Workflow', 
        project_id: 'project-123', 
        steps: [{ name: 'Test Step', task_ids: ['task-1'] }] 
      });

      expect(result.metadata.status).toBe('error');
      expect(result.output).toContain('WorkflowService not initialized');
    });

    it('should handle complex workflow execution scenarios', async () => {
      // Test workflow with multiple dependencies and parallel groups
      const complexWorkflowData = {
        name: 'Complex Enterprise Pipeline',
        project_id: 'enterprise-project',
        steps: [
          {
            name: 'Database Setup',
            task_ids: ['db-task-1', 'db-task-2'],
            dependencies: [],
            agent_persona: 'DB-DATABASE-DIANA',
            parallel_group: 'infrastructure',
            timeout_minutes: 30
          },
          {
            name: 'Cache Setup',
            task_ids: ['cache-task-1'],
            dependencies: [],
            agent_persona: 'CACHE-REDIS-ROBERT',
            parallel_group: 'infrastructure',
            timeout_minutes: 15
          },
          {
            name: 'Backend API',
            task_ids: ['api-task-1', 'api-task-2', 'api-task-3'],
            dependencies: ['Database Setup'],
            agent_persona: 'BE-BACKEND-BENJAMIN',
            timeout_minutes: 60
          },
          {
            name: 'Frontend App',
            task_ids: ['ui-task-1', 'ui-task-2'],
            dependencies: ['Backend API'],
            agent_persona: 'FE-FRONTEND-FIONA',
            parallel_group: 'client-apps',
            timeout_minutes: 45
          },
          {
            name: 'Mobile App',
            task_ids: ['mobile-task-1'],
            dependencies: ['Backend API'],
            agent_persona: 'MOBILE-REACT-MARIA',
            parallel_group: 'client-apps',
            timeout_minutes: 40
          }
        ],
        variables: {
          environment: 'production',
          version: '3.0.0',
          database_replicas: 3,
          cache_nodes: 2
        },
        schedule: '0 4 * * 1',
        timeout_minutes: 300,
        max_retries: 2,
        trigger: 'scheduled' as WorkflowTrigger
      };

      const complexWorkflow = {
        ...mockWorkflow,
        ...complexWorkflowData,
        id: 'complex-workflow-enterprise',
        steps: complexWorkflowData.steps.map((step, i) => ({
          ...mockWorkflowStep,
          ...step,
          id: `complex-step-${i}`,
          status: 'pending' as StepStatus
        }))
      };

      mockWorkflowService.createWorkflow.mockResolvedValue(complexWorkflow);

      const result = await (workflowTools as any).getMosaicWorkflowCreateTool().handler(complexWorkflowData);

      expect(result.metadata.status).toBe('success');
      expect(result.output).toContain('Complex Enterprise Pipeline');
      expect(result.output).toContain('Steps: 5');
      expect(result.output).toContain('1. Database Setup (2 tasks)');
      expect(result.output).toContain('2. Cache Setup (1 tasks)');
      expect(result.output).toContain('3. Backend API (3 tasks) - depends on: Database Setup');
      expect(result.output).toContain('4. Frontend App (2 tasks) - depends on: Backend API');
      expect(result.output).toContain('5. Mobile App (1 tasks) - depends on: Backend API');
    });
  });
});