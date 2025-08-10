import { WorkflowService } from '../src/services/WorkflowService';
import { AgentService } from '../src/services/AgentService';
import { TaskService } from '../src/services/TaskService';
import { CommunicationService } from '../src/services/CommunicationService';
import { Logger } from '../src/utils/Logger';
import { MCPServerConfig } from '../src/types';
import * as path from 'path';
import * as fs from 'fs';

describe('WorkflowService', () => {
  let workflowService: WorkflowService;
  let agentService: AgentService;
  let taskService: TaskService;
  let communicationService: CommunicationService;
  let logger: Logger;
  let config: MCPServerConfig;
  let testDbPath: string;

  beforeEach(async () => {
    // Create unique test database
    testDbPath = path.join(__dirname, 'test-data', `workflow-test-${Date.now()}.db`);
    await fs.promises.mkdir(path.dirname(testDbPath), { recursive: true });

    config = {
      server: {
        name: 'test-server',
        version: '1.0.0',
        description: 'Test server'
      },
      transport: {
        type: 'stdio',
        timeout: 30000
      },
      tools: {
        task_management: { enabled: true, namespace: 'mosaic' },
        project_coordination: { enabled: true, namespace: 'mosaic' },
        agent_orchestration: { enabled: true, namespace: 'mosaic' }
      },
      storage: {
        type: 'sqlite',
        connection_string: testDbPath,
        migrations_path: './migrations',
        backup_enabled: false,
        backup_interval: '24h'
      },
      logging: {
        level: 'error',
        console: false,
        structured: true
      },
      security: {
        max_concurrent_tools: 10,
        tool_timeout: 30000,
        rate_limiting: {
          enabled: false,
          requests_per_minute: 100
        }
      }
    };

    logger = new Logger(config.logging);
    agentService = new AgentService(config, logger);
    taskService = new TaskService(config, logger);
    communicationService = new CommunicationService(config, logger);
    workflowService = new WorkflowService(config, logger, agentService, taskService, communicationService);

    await workflowService.initialize();
    await agentService.initialize();
    await taskService.initialize();
    await communicationService.initialize();
  });

  afterEach(async () => {
    // Clean up test database
    try {
      await fs.promises.unlink(testDbPath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  });

  describe('Workflow Creation', () => {
    it('should create a workflow with steps', async () => {
      // First create some tasks to reference
      const task1 = await taskService.createTask({
        title: 'Backend setup task',
        type: 'task',
        project_id: 'test-project'
      });

      const task2 = await taskService.createTask({
        title: 'Frontend setup task',
        type: 'task',
        project_id: 'test-project'
      });

      const workflowInput = {
        name: 'Test Development Workflow',
        description: 'A test workflow for development tasks',
        project_id: 'test-project',
        steps: [
          {
            name: 'Backend Development',
            description: 'Set up backend infrastructure',
            agent_persona: 'BE-BACKEND-BENJAMIN',
            task_ids: [task1.id],
            dependencies: [],
            timeout_minutes: 30
          },
          {
            name: 'Frontend Development', 
            description: 'Build frontend interface',
            agent_persona: 'FE-FRONTEND-FIONA',
            task_ids: [task2.id],
            dependencies: [], // Will be set after step creation
            parallel_group: 'ui-development',
            timeout_minutes: 45
          }
        ],
        variables: {
          environment: 'test',
          version: '1.0.0'
        },
        trigger: 'manual' as const,
        timeout_minutes: 120,
        max_retries: 2
      };

      const workflow = await workflowService.createWorkflow(workflowInput, 'test-user');

      expect(workflow).toBeDefined();
      expect(workflow.id).toBeDefined();
      expect(workflow.name).toBe('Test Development Workflow');
      expect(workflow.project_id).toBe('test-project');
      expect(workflow.status).toBe('pending');
      expect(workflow.steps.length).toBe(2);
      expect(workflow.steps[0]?.name).toBe('Backend Development');
      expect(workflow.steps[0]?.agent_persona).toBe('BE-BACKEND-BENJAMIN');
      expect(workflow.steps[0]?.task_ids).toEqual([task1.id]);
      expect(workflow.steps[1]?.parallel_group).toBe('ui-development');
      expect(workflow.variables).toEqual({
        environment: 'test',
        version: '1.0.0'
      });
      expect(workflow.progress.total_steps).toBe(2);
      expect(workflow.progress.completed_steps).toBe(0);
    });

    it('should validate step dependencies', async () => {
      const task1 = await taskService.createTask({
        title: 'Task 1',
        type: 'task',
        project_id: 'test-project'
      });

      const workflowInput = {
        name: 'Invalid Workflow',
        project_id: 'test-project',
        steps: [
          {
            name: 'Step 1',
            task_ids: [task1.id],
            dependencies: ['non-existent-step'] // Invalid dependency
          }
        ]
      };

      await expect(workflowService.createWorkflow(workflowInput))
        .rejects.toThrow('Invalid dependency: step non-existent-step not found');
    });

    it('should detect circular dependencies', async () => {
      const task1 = await taskService.createTask({
        title: 'Task 1',
        type: 'task',
        project_id: 'test-project'
      });

      const task2 = await taskService.createTask({
        title: 'Task 2', 
        type: 'task',
        project_id: 'test-project'
      });

      // Create workflow, then manually create circular dependency in validation
      const workflowInput = {
        name: 'Circular Workflow',
        project_id: 'test-project',
        steps: [
          {
            name: 'Step 1',
            task_ids: [task1.id],
            dependencies: []
          },
          {
            name: 'Step 2',
            task_ids: [task2.id], 
            dependencies: []
          }
        ]
      };

      // Manually create circular dependency for testing
      (workflowInput.steps[0] as any).dependencies = [`${Date.now()}-step-2`];
      (workflowInput.steps[1] as any).dependencies = [`${Date.now()}-step-1`];

      await expect(workflowService.createWorkflow(workflowInput))
        .rejects.toThrow();
    });
  });

  describe('Workflow Execution', () => {
    it('should start workflow execution', async () => {
      // Create tasks and workflow
      const task1 = await taskService.createTask({
        title: 'Simple task',
        type: 'task',
        project_id: 'test-project'
      });

      const workflow = await workflowService.createWorkflow({
        name: 'Simple Workflow',
        project_id: 'test-project',
        steps: [
          {
            name: 'Simple Step',
            task_ids: [task1.id],
            dependencies: []
          }
        ]
      });

      const execution = await workflowService.executeWorkflow(
        workflow.id,
        { test_context: true },
        'test-user'
      );

      expect(execution).toBeDefined();
      expect(execution.id).toBeDefined();
      expect(execution.workflow_id).toBe(workflow.id);
      expect(execution.execution_number).toBe(1);
      expect(execution.status).toBe('running');
      expect(execution.triggered_by).toBe('test-user');
      expect(execution.context).toEqual({ test_context: true });
    });

    it('should prevent execution of already running workflow', async () => {
      const task1 = await taskService.createTask({
        title: 'Task for running workflow',
        type: 'task',
        project_id: 'test-project'
      });

      const workflow = await workflowService.createWorkflow({
        name: 'Running Workflow',
        project_id: 'test-project',
        steps: [
          {
            name: 'Step 1',
            task_ids: [task1.id],
            dependencies: []
          }
        ]
      });

      // Start first execution
      await workflowService.executeWorkflow(workflow.id);

      // Try to start second execution
      await expect(workflowService.executeWorkflow(workflow.id))
        .rejects.toThrow('Workflow is already running');
    });
  });

  describe('Workflow Monitoring', () => {
    it('should provide workflow monitoring data', async () => {
      const task1 = await taskService.createTask({
        title: 'Monitoring task',
        type: 'task',
        project_id: 'test-project'
      });

      const workflow = await workflowService.createWorkflow({
        name: 'Monitored Workflow',
        project_id: 'test-project',
        steps: [
          {
            name: 'Monitored Step',
            task_ids: [task1.id],
            dependencies: []
          }
        ]
      });

      const monitoring = await workflowService.monitorWorkflow(workflow.id);

      expect(monitoring).toBeDefined();
      expect(monitoring.workflow).toBeDefined();
      expect(monitoring.workflow.id).toBe(workflow.id);
      expect(monitoring.recent_executions).toEqual([]);
      expect(monitoring.performance_metrics).toBeDefined();
      expect(monitoring.performance_metrics.total_executions).toBe(0);
      expect(monitoring.performance_metrics.success_rate).toBe(0);
    });

    it('should show current execution when workflow is running', async () => {
      const task1 = await taskService.createTask({
        title: 'Running task',
        type: 'task',
        project_id: 'test-project'
      });

      const workflow = await workflowService.createWorkflow({
        name: 'Running Workflow',
        project_id: 'test-project',
        steps: [
          {
            name: 'Running Step',
            task_ids: [task1.id],
            dependencies: []
          }
        ]
      });

      const execution = await workflowService.executeWorkflow(workflow.id);
      const monitoring = await workflowService.monitorWorkflow(workflow.id);

      expect(monitoring.current_execution).toBeDefined();
      expect(monitoring.current_execution?.id).toBe(execution.id);
      expect(monitoring.workflow.status).toBe('running');
    });
  });

  describe('Workflow Control', () => {
    it('should pause and resume workflow', async () => {
      const task1 = await taskService.createTask({
        title: 'Pausable task',
        type: 'task',
        project_id: 'test-project'
      });

      const workflow = await workflowService.createWorkflow({
        name: 'Pausable Workflow',
        project_id: 'test-project',
        steps: [
          {
            name: 'Pausable Step',
            task_ids: [task1.id],
            dependencies: []
          }
        ]
      });

      await workflowService.executeWorkflow(workflow.id);
      
      // Pause workflow
      await workflowService.pauseWorkflow(workflow.id, 'Testing pause');
      
      const pausedWorkflow = await workflowService.getWorkflow(workflow.id);
      expect(pausedWorkflow?.status).toBe('paused');

      // Resume workflow
      await workflowService.resumeWorkflow(workflow.id);
      
      const resumedWorkflow = await workflowService.getWorkflow(workflow.id);
      expect(resumedWorkflow?.status).toBe('running');
    });

    it('should cancel workflow', async () => {
      const task1 = await taskService.createTask({
        title: 'Cancellable task',
        type: 'task',
        project_id: 'test-project'
      });

      const workflow = await workflowService.createWorkflow({
        name: 'Cancellable Workflow',
        project_id: 'test-project',
        steps: [
          {
            name: 'Cancellable Step',
            task_ids: [task1.id],
            dependencies: []
          }
        ]
      });

      await workflowService.executeWorkflow(workflow.id);
      
      // Cancel workflow
      await workflowService.cancelWorkflow(workflow.id, 'Testing cancellation');
      
      const cancelledWorkflow = await workflowService.getWorkflow(workflow.id);
      expect(cancelledWorkflow?.status).toBe('cancelled');

      // Should not be able to resume cancelled workflow
      await expect(workflowService.resumeWorkflow(workflow.id))
        .rejects.toThrow('Only paused workflows can be resumed');
    });
  });

  describe('Workflow Listing', () => {
    it('should list workflows with filtering', async () => {
      // Create multiple workflows
      const task1 = await taskService.createTask({
        title: 'Task 1', type: 'task', project_id: 'project-1'
      });
      const task2 = await taskService.createTask({
        title: 'Task 2', type: 'task', project_id: 'project-2'
      });

      await workflowService.createWorkflow({
        name: 'Project 1 Workflow',
        project_id: 'project-1',
        steps: [{ name: 'Step 1', task_ids: [task1.id], dependencies: [] }]
      });

      await workflowService.createWorkflow({
        name: 'Project 2 Workflow', 
        project_id: 'project-2',
        steps: [{ name: 'Step 1', task_ids: [task2.id], dependencies: [] }]
      });

      // List all workflows
      const allWorkflows = await workflowService.listWorkflows();
      expect(allWorkflows.length).toBe(2);

      // Filter by project
      const project1Workflows = await workflowService.listWorkflows({ project_id: 'project-1' });
      expect(project1Workflows.length).toBe(1);
      expect(project1Workflows[0]?.name).toBe('Project 1 Workflow');

      // Filter by status
      const pendingWorkflows = await workflowService.listWorkflows({ status: 'pending' });
      expect(pendingWorkflows.length).toBe(2);
    });
  });
});