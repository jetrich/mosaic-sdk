import { randomUUID } from 'crypto';
import { 
  MCPServerConfig, 
  Workflow, 
  WorkflowStep, 
  WorkflowStatus, 
  StepStatus, 
  WorkflowTrigger,
  WorkflowExecution,
  StepExecution,
  WorkflowProgress,
  ValidationError
} from '../types';
import { Logger } from '../utils/Logger';
import { StateService } from './StateService';
import { AgentService } from './AgentService';
import { TaskService } from './TaskService';
import { CommunicationService } from './CommunicationService';

interface CreateWorkflowInput {
  name: string;
  description?: string;
  project_id: string;
  steps: Omit<WorkflowStep, 'id' | 'status' | 'started_at' | 'completed_at' | 'error_message' | 'output'>[];
  variables?: Record<string, any>;
  schedule?: string;
  timeout_minutes?: number;
  max_retries?: number;
  trigger?: WorkflowTrigger;
}

interface WorkflowFilter {
  project_id?: string;
  status?: WorkflowStatus;
  trigger?: WorkflowTrigger;
  created_by?: string;
}

export class WorkflowService {
  private logger: Logger;
  private stateService: StateService;
  private agentService: AgentService;
  private taskService: TaskService;

  constructor(
    config: MCPServerConfig, 
    logger: Logger,
    agentService: AgentService,
    taskService: TaskService,
    _communicationService: CommunicationService
  ) {
    this.logger = logger;
    this.stateService = new StateService(config, logger);
    this.agentService = agentService;
    this.taskService = taskService;
  }

  async initialize(): Promise<void> {
    await this.stateService.initialize();
  }

  // Core Workflow Operations

  async createWorkflow(input: CreateWorkflowInput, createdBy: string = 'system'): Promise<Workflow> {
    try {
      this.validateCreateWorkflowInput(input);

      const workflowId = randomUUID();
      const now = new Date();

      // Prepare workflow steps with IDs and initial status
      const steps: WorkflowStep[] = input.steps.map((step, index) => ({
        ...step,
        id: `${workflowId}-step-${index + 1}`,
        status: 'pending' as StepStatus
      }));

      // Validate step dependencies
      this.validateStepDependencies(steps);

      // Calculate initial progress
      const progress = this.calculateProgress(steps);

      const workflow: any = {
        id: workflowId,
        name: input.name,
        description: input.description || '',
        project_id: input.project_id,
        status: 'pending',
        trigger: input.trigger || 'manual',
        steps,
        variables: input.variables || {},
        created_at: now,
        updated_at: now,
        created_by: createdBy,
        progress
      };

      // Add optional properties only if they exist
      if (input.schedule) {
        workflow.schedule = input.schedule;
      }
      if (input.timeout_minutes) {
        workflow.timeout_minutes = input.timeout_minutes;
      }
      if (input.max_retries) {
        workflow.max_retries = input.max_retries;
      }

      // Store workflow in database
      await this.stateService.run(
        `INSERT INTO workflows (
          id, name, description, project_id, status, trigger, steps, variables,
          schedule, timeout_minutes, max_retries, created_at, updated_at, 
          created_by, current_step, progress
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          workflow.id,
          workflow.name,
          workflow.description,
          workflow.project_id,
          workflow.status,
          workflow.trigger,
          JSON.stringify(workflow.steps),
          JSON.stringify(workflow.variables),
          workflow.schedule,
          workflow.timeout_minutes,
          workflow.max_retries,
          workflow.created_at.toISOString(),
          workflow.updated_at.toISOString(),
          workflow.created_by,
          workflow.current_step,
          JSON.stringify(workflow.progress)
        ]
      );

      this.logger.info('Workflow created successfully', { 
        workflowId, 
        name: workflow.name, 
        stepCount: steps.length,
        projectId: workflow.project_id
      });

      return workflow;
    } catch (error) {
      this.logger.error('Failed to create workflow', error, input);
      throw error;
    }
  }

  async executeWorkflow(
    workflowId: string, 
    context: Record<string, any> = {}, 
    triggeredBy?: string
  ): Promise<WorkflowExecution> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        throw new ValidationError(`Workflow not found: ${workflowId}`);
      }

      if (workflow.status === 'running') {
        throw new ValidationError('Workflow is already running');
      }

      const executionId = randomUUID();
      const now = new Date();

      // Get next execution number
      const lastExecution = await this.stateService.get<{ execution_number: number }>(
        'SELECT MAX(execution_number) as execution_number FROM workflow_executions WHERE workflow_id = ?',
        [workflowId]
      );
      const executionNumber = (lastExecution?.execution_number || 0) + 1;

      // Create workflow execution record
      const execution: WorkflowExecution = {
        id: executionId,
        workflow_id: workflowId,
        execution_number: executionNumber,
        status: 'running',
        trigger: workflow.trigger,
        triggered_by: triggeredBy || '',
        started_at: now,
        context,
        step_executions: [],
        retry_count: 0
      };

      // Store execution in database
      await this.stateService.run(
        `INSERT INTO workflow_executions (
          id, workflow_id, execution_number, status, trigger, triggered_by,
          started_at, context, retry_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          execution.id,
          execution.workflow_id,
          execution.execution_number,
          execution.status,
          execution.trigger,
          execution.triggered_by,
          execution.started_at.toISOString(),
          JSON.stringify(execution.context),
          execution.retry_count
        ]
      );

      // Update workflow status to running
      await this.updateWorkflowStatus(workflowId, 'running', now);

      this.logger.info('Workflow execution started', { 
        workflowId, 
        executionId,
        executionNumber,
        triggeredBy
      });

      // Start executing the workflow asynchronously
      this.executeWorkflowSteps(execution).catch(error => {
        this.logger.error('Workflow execution failed', error, { workflowId, executionId });
      });

      return execution;
    } catch (error) {
      this.logger.error('Failed to execute workflow', error, { workflowId, context });
      throw error;
    }
  }

  async monitorWorkflow(workflowId: string): Promise<{
    workflow: Workflow;
    current_execution?: WorkflowExecution;
    recent_executions: WorkflowExecution[];
    performance_metrics: {
      total_executions: number;
      success_rate: number;
      average_duration_minutes: number;
      last_24h_executions: number;
    };
  }> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        throw new ValidationError(`Workflow not found: ${workflowId}`);
      }

      // Get current execution if running
      const currentExecution = workflow.status === 'running' ? 
        await this.getCurrentExecution(workflowId) : undefined;

      // Get recent executions
      const recentExecutions = await this.getWorkflowExecutions(workflowId, 10);

      // Calculate performance metrics
      const allExecutions = await this.stateService.all<any>(
        'SELECT * FROM workflow_executions WHERE workflow_id = ?',
        [workflowId]
      );

      const completedExecutions = allExecutions.filter(e => 
        e.status === 'completed' || e.status === 'failed'
      );

      const successfulExecutions = completedExecutions.filter(e => e.status === 'completed');

      const durations = completedExecutions
        .filter(e => e.completed_at)
        .map(e => {
          const start = new Date(e.started_at).getTime();
          const end = new Date(e.completed_at).getTime();
          return (end - start) / (1000 * 60); // minutes
        });

      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentExecutionCount = allExecutions.filter(e => 
        new Date(e.started_at) > last24h
      ).length;

      const performanceMetrics = {
        total_executions: allExecutions.length,
        success_rate: completedExecutions.length > 0 ? 
          (successfulExecutions.length / completedExecutions.length) * 100 : 0,
        average_duration_minutes: durations.length > 0 ? 
          durations.reduce((sum, d) => sum + d, 0) / durations.length : 0,
        last_24h_executions: recentExecutionCount
      };

      this.logger.debug('Workflow monitoring data retrieved', { 
        workflowId, 
        currentStatus: workflow.status,
        recentExecutionCount: recentExecutions.length 
      });

      const result: any = {
        workflow,
        recent_executions: recentExecutions,
        performance_metrics: performanceMetrics
      };

      if (currentExecution) {
        result.current_execution = currentExecution;
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to monitor workflow', error, { workflowId });
      throw error;
    }
  }

  // Workflow Management

  async getWorkflow(workflowId: string): Promise<Workflow | null> {
    try {
      const row = await this.stateService.get<any>(
        'SELECT * FROM workflows WHERE id = ?',
        [workflowId]
      );

      return row ? this.mapRowToWorkflow(row) : null;
    } catch (error) {
      this.logger.error('Failed to get workflow', error, { workflowId });
      throw error;
    }
  }

  async listWorkflows(filter?: WorkflowFilter, limit?: number, offset?: number): Promise<Workflow[]> {
    try {
      let sql = 'SELECT * FROM workflows';
      const params: any[] = [];
      const conditions: string[] = [];

      if (filter) {
        if (filter.project_id) {
          conditions.push('project_id = ?');
          params.push(filter.project_id);
        }
        if (filter.status) {
          conditions.push('status = ?');
          params.push(filter.status);
        }
        if (filter.trigger) {
          conditions.push('trigger = ?');
          params.push(filter.trigger);
        }
        if (filter.created_by) {
          conditions.push('created_by = ?');
          params.push(filter.created_by);
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
      return rows.map(row => this.mapRowToWorkflow(row));
    } catch (error) {
      this.logger.error('Failed to list workflows', error, { filter });
      throw error;
    }
  }

  async pauseWorkflow(workflowId: string, reason?: string): Promise<void> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        throw new ValidationError(`Workflow not found: ${workflowId}`);
      }

      if (workflow.status !== 'running') {
        throw new ValidationError('Only running workflows can be paused');
      }

      await this.updateWorkflowStatus(workflowId, 'paused');

      this.logger.info('Workflow paused', { workflowId, reason });
    } catch (error) {
      this.logger.error('Failed to pause workflow', error, { workflowId, reason });
      throw error;
    }
  }

  async resumeWorkflow(workflowId: string): Promise<void> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        throw new ValidationError(`Workflow not found: ${workflowId}`);
      }

      if (workflow.status !== 'paused') {
        throw new ValidationError('Only paused workflows can be resumed');
      }

      await this.updateWorkflowStatus(workflowId, 'running');

      // Resume execution
      const currentExecution = await this.getCurrentExecution(workflowId);
      if (currentExecution) {
        this.executeWorkflowSteps(currentExecution).catch(error => {
          this.logger.error('Failed to resume workflow execution', error, { workflowId });
        });
      }

      this.logger.info('Workflow resumed', { workflowId });
    } catch (error) {
      this.logger.error('Failed to resume workflow', error, { workflowId });
      throw error;
    }
  }

  async cancelWorkflow(workflowId: string, reason?: string): Promise<void> {
    try {
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        throw new ValidationError(`Workflow not found: ${workflowId}`);
      }

      if (!['running', 'paused'].includes(workflow.status)) {
        throw new ValidationError('Only running or paused workflows can be cancelled');
      }

      // Update workflow status
      await this.updateWorkflowStatus(workflowId, 'cancelled');

      // Cancel current execution if exists
      const currentExecution = await this.getCurrentExecution(workflowId);
      if (currentExecution) {
        await this.stateService.run(
          'UPDATE workflow_executions SET status = ?, completed_at = ? WHERE id = ?',
          ['cancelled', new Date().toISOString(), currentExecution.id]
        );
      }

      this.logger.info('Workflow cancelled', { workflowId, reason });
    } catch (error) {
      this.logger.error('Failed to cancel workflow', error, { workflowId, reason });
      throw error;
    }
  }

  // Step Execution Engine

  private async executeWorkflowSteps(execution: WorkflowExecution): Promise<void> {
    try {
      const workflow = await this.getWorkflow(execution.workflow_id);
      if (!workflow) {
        throw new Error('Workflow not found during execution');
      }

      this.logger.info('Starting workflow step execution', { 
        workflowId: workflow.id, 
        executionId: execution.id,
        stepCount: workflow.steps.length
      });

      // Execute steps according to dependencies and parallel groups
      const executedSteps = new Set<string>();
      const failedSteps = new Set<string>();

      while (executedSteps.size < workflow.steps.length) {
        // Find ready steps (dependencies satisfied)
        const readySteps = workflow.steps.filter(step => 
          !executedSteps.has(step.id) && 
          !failedSteps.has(step.id) &&
          step.dependencies.every(depId => executedSteps.has(depId))
        );

        if (readySteps.length === 0) {
          // No more steps can be executed
          const remainingSteps = workflow.steps.filter(step => 
            !executedSteps.has(step.id) && !failedSteps.has(step.id)
          );
          
          if (remainingSteps.length > 0) {
            throw new Error(`Workflow execution stuck. Remaining steps cannot be executed due to failed dependencies.`);
          }
          break;
        }

        // Group steps by parallel group
        const parallelGroups = new Map<string, WorkflowStep[]>();
        const singleSteps: WorkflowStep[] = [];

        for (const step of readySteps) {
          if (step.parallel_group) {
            if (!parallelGroups.has(step.parallel_group)) {
              parallelGroups.set(step.parallel_group, []);
            }
            parallelGroups.get(step.parallel_group)!.push(step);
          } else {
            singleSteps.push(step);
          }
        }

        // Execute parallel groups
        for (const [groupName, groupSteps] of parallelGroups) {
          this.logger.info(`Executing parallel group: ${groupName}`, {
            stepCount: groupSteps.length,
            stepIds: groupSteps.map(s => s.id)
          });

          const groupPromises = groupSteps.map(step => 
            this.executeStep(execution, step)
              .then(() => executedSteps.add(step.id))
              .catch(error => {
                this.logger.error('Step execution failed', error, { stepId: step.id });
                failedSteps.add(step.id);
              })
          );

          await Promise.allSettled(groupPromises);
        }

        // Execute single steps sequentially
        for (const step of singleSteps) {
          try {
            await this.executeStep(execution, step);
            executedSteps.add(step.id);
          } catch (error) {
            this.logger.error('Step execution failed', error, { stepId: step.id });
            failedSteps.add(step.id);
          }
        }

        // Update workflow progress
        await this.updateWorkflowProgress(workflow.id, executedSteps, failedSteps);
      }

      // Complete the execution
      const finalStatus: WorkflowStatus = failedSteps.size > 0 ? 'failed' : 'completed';
      await this.completeWorkflowExecution(execution.id, finalStatus);

      this.logger.info('Workflow execution completed', { 
        workflowId: workflow.id, 
        executionId: execution.id,
        finalStatus,
        executedSteps: executedSteps.size,
        failedSteps: failedSteps.size
      });

    } catch (error) {
      await this.completeWorkflowExecution(execution.id, 'failed', (error as Error).message);
      throw error;
    }
  }

  private async executeStep(execution: WorkflowExecution, step: WorkflowStep): Promise<void> {
    const stepExecutionId = randomUUID();
    const startTime = new Date();

    try {
      this.logger.info('Executing workflow step', { 
        stepId: step.id, 
        stepName: step.name,
        agentPersona: step.agent_persona,
        taskCount: step.task_ids.length
      });

      // Create step execution record
      const stepExecution: StepExecution = {
        id: stepExecutionId,
        workflow_execution_id: execution.id,
        step_id: step.id,
        status: 'running',
        started_at: startTime,
        input: { ...execution.context },
        retry_count: 0,
        logs: []
      };

      await this.storeStepExecution(stepExecution);

      let agent_id: string | undefined;

      // Deploy agent if needed
      if (step.agent_persona) {
        const agent = await this.agentService.deployAgent({
          persona: step.agent_persona,
          projectId: execution.context['project_id'] || 'default',
          priority: 'high'
        });
        agent_id = agent.id;
        stepExecution.agent_id = agent_id;

        this.logger.debug('Agent deployed for step', { stepId: step.id, agentId: agent_id });
      }

      // Execute tasks assigned to this step
      const stepOutput: Record<string, any> = {};
      
      for (const taskId of step.task_ids) {
        if (agent_id) {
          await this.agentService.assignTaskToAgent(agent_id, taskId);
          await this.agentService.updateAgentStatus(agent_id, 'working');
        }
        
        // For now, we mark tasks as in_progress 
        // In a real implementation, agents would actually execute these
        await this.taskService.updateTaskStatus(taskId, 'in_progress');
        stepOutput[taskId] = 'started';
      }

      // Complete step execution
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      stepExecution.status = 'completed';
      stepExecution.completed_at = endTime;
      stepExecution.duration_ms = duration;
      stepExecution.output = stepOutput;

      await this.updateStepExecution(stepExecution);

      // Terminate agent if deployed
      if (agent_id) {
        await this.agentService.terminateAgent(agent_id, 'Step completed');
      }

      this.logger.info('Step executed successfully', { 
        stepId: step.id, 
        durationMs: duration,
        tasksProcessed: step.task_ids.length
      });

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Update step execution with failure
      const stepExecution: StepExecution = {
        id: stepExecutionId,
        workflow_execution_id: execution.id,
        step_id: step.id,
        status: 'failed',
        started_at: startTime,
        completed_at: endTime,
        duration_ms: duration,
        input: { ...execution.context },
        error_message: (error as Error).message,
        retry_count: 0,
        logs: [`Error: ${(error as Error).message}`]
      };

      await this.updateStepExecution(stepExecution);
      throw error;
    }
  }

  // Helper Methods

  private validateCreateWorkflowInput(input: CreateWorkflowInput): void {
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError('Workflow name is required');
    }

    if (!input.project_id) {
      throw new ValidationError('Project ID is required');
    }

    if (!input.steps || input.steps.length === 0) {
      throw new ValidationError('At least one step is required');
    }

    for (const step of input.steps) {
      if (!step.name || step.name.trim().length === 0) {
        throw new ValidationError('Step name is required');
      }
      
      if (!step.task_ids || step.task_ids.length === 0) {
        throw new ValidationError('Each step must have at least one task');
      }
    }
  }

  private validateStepDependencies(steps: WorkflowStep[]): void {
    const stepIds = new Set(steps.map(s => s.id));
    
    for (const step of steps) {
      for (const depId of step.dependencies) {
        if (!stepIds.has(depId)) {
          throw new ValidationError(`Invalid dependency: step ${depId} not found`);
        }
      }
    }

    // Check for circular dependencies
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (stepId: string): boolean => {
      if (recursionStack.has(stepId)) return true;
      if (visited.has(stepId)) return false;

      visited.add(stepId);
      recursionStack.add(stepId);

      const step = steps.find(s => s.id === stepId);
      if (step) {
        for (const depId of step.dependencies) {
          if (hasCycle(depId)) return true;
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    for (const step of steps) {
      if (hasCycle(step.id)) {
        throw new ValidationError('Circular dependency detected in workflow steps');
      }
    }
  }

  private calculateProgress(steps: WorkflowStep[]): WorkflowProgress {
    const totalSteps = steps.length;
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    const failedSteps = steps.filter(s => s.status === 'failed').length;
    const skippedSteps = steps.filter(s => s.status === 'skipped').length;

    return {
      total_steps: totalSteps,
      completed_steps: completedSteps,
      failed_steps: failedSteps,
      skipped_steps: skippedSteps,
      completion_percentage: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
    };
  }

  private async updateWorkflowStatus(
    workflowId: string, 
    status: WorkflowStatus, 
    timestamp?: Date
  ): Promise<void> {
    const now = timestamp || new Date();
    const updateData: Record<string, any> = {
      status,
      updated_at: now.toISOString()
    };

    if (status === 'running' && !timestamp) {
      updateData['started_at'] = now.toISOString();
    } else if (['completed', 'failed', 'cancelled'].includes(status)) {
      updateData['completed_at'] = now.toISOString();
    }

    const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData).concat([workflowId]);

    await this.stateService.run(
      `UPDATE workflows SET ${setClause} WHERE id = ?`,
      values
    );
  }

  private async updateWorkflowProgress(
    workflowId: string, 
    executedSteps: Set<string>, 
    failedSteps: Set<string>
  ): Promise<void> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) return;

    const updatedSteps = workflow.steps.map(step => ({
      ...step,
      status: executedSteps.has(step.id) ? 'completed' as StepStatus :
              failedSteps.has(step.id) ? 'failed' as StepStatus :
              step.status
    }));

    const progress = this.calculateProgress(updatedSteps);

    await this.stateService.run(
      'UPDATE workflows SET steps = ?, progress = ?, updated_at = ? WHERE id = ?',
      [
        JSON.stringify(updatedSteps),
        JSON.stringify(progress),
        new Date().toISOString(),
        workflowId
      ]
    );
  }

  private async getCurrentExecution(workflowId: string): Promise<WorkflowExecution | null> {
    const row = await this.stateService.get<any>(
      'SELECT * FROM workflow_executions WHERE workflow_id = ? AND status = ? ORDER BY started_at DESC LIMIT 1',
      [workflowId, 'running']
    );

    return row ? this.mapRowToExecution(row) : null;
  }

  private async getWorkflowExecutions(workflowId: string, limit = 10): Promise<WorkflowExecution[]> {
    const rows = await this.stateService.all<any>(
      'SELECT * FROM workflow_executions WHERE workflow_id = ? ORDER BY started_at DESC LIMIT ?',
      [workflowId, limit]
    );

    return rows.map(row => this.mapRowToExecution(row));
  }

  private async completeWorkflowExecution(
    executionId: string, 
    status: WorkflowStatus, 
    errorMessage?: string
  ): Promise<void> {
    const updateData: Record<string, any> = {
      status,
      completed_at: new Date().toISOString()
    };

    if (errorMessage) {
      updateData['error_message'] = errorMessage;
    }

    const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData).concat([executionId]);

    await this.stateService.run(
      `UPDATE workflow_executions SET ${setClause} WHERE id = ?`,
      values
    );

    // Also update the workflow status
    const execution = await this.stateService.get<any>(
      'SELECT workflow_id FROM workflow_executions WHERE id = ?',
      [executionId]
    );

    if (execution) {
      await this.updateWorkflowStatus(execution.workflow_id, status);
    }
  }

  private async storeStepExecution(stepExecution: StepExecution): Promise<void> {
    await this.stateService.run(
      `INSERT INTO step_executions (
        id, workflow_execution_id, step_id, status, agent_id, started_at,
        input, retry_count, logs
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        stepExecution.id,
        stepExecution.workflow_execution_id,
        stepExecution.step_id,
        stepExecution.status,
        stepExecution.agent_id,
        stepExecution.started_at?.toISOString(),
        JSON.stringify(stepExecution.input),
        stepExecution.retry_count,
        JSON.stringify(stepExecution.logs)
      ]
    );
  }

  private async updateStepExecution(stepExecution: StepExecution): Promise<void> {
    const updateData: Record<string, any> = {
      status: stepExecution.status,
      completed_at: stepExecution.completed_at?.toISOString(),
      duration_ms: stepExecution.duration_ms,
      output: JSON.stringify(stepExecution.output || {}),
      error_message: stepExecution.error_message,
      logs: JSON.stringify(stepExecution.logs)
    };

    const setClause = Object.keys(updateData).filter(key => updateData[key] !== undefined)
      .map(key => `${key} = ?`).join(', ');
    const values = Object.keys(updateData).filter(key => updateData[key] !== undefined)
      .map(key => updateData[key]).concat([stepExecution.id]);

    await this.stateService.run(
      `UPDATE step_executions SET ${setClause} WHERE id = ?`,
      values
    );
  }

  private mapRowToWorkflow(row: any): Workflow {
    const workflow: Workflow = {
      id: row.id,
      name: row.name,
      description: row.description || '',
      project_id: row.project_id,
      status: row.status,
      trigger: row.trigger,
      steps: this.stateService.parseJsonColumn(row.steps, []),
      variables: this.stateService.parseJsonColumn(row.variables, {}),
      schedule: row.schedule,
      timeout_minutes: row.timeout_minutes,
      max_retries: row.max_retries,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      created_by: row.created_by,
      current_step: row.current_step,
      progress: this.stateService.parseJsonColumn(row.progress, {
        total_steps: 0,
        completed_steps: 0,
        failed_steps: 0,
        skipped_steps: 0,
        completion_percentage: 0
      })
    };

    if (row.started_at) {
      workflow.started_at = new Date(row.started_at);
    }
    if (row.completed_at) {
      workflow.completed_at = new Date(row.completed_at);
    }

    return workflow;
  }

  private mapRowToExecution(row: any): WorkflowExecution {
    const execution: WorkflowExecution = {
      id: row.id,
      workflow_id: row.workflow_id,
      execution_number: row.execution_number,
      status: row.status,
      trigger: row.trigger,
      triggered_by: row.triggered_by || '',
      started_at: new Date(row.started_at),
      context: this.stateService.parseJsonColumn(row.context, {}),
      step_executions: [], // Would be loaded separately if needed
      error_message: row.error_message,
      retry_count: row.retry_count
    };

    if (row.completed_at) {
      execution.completed_at = new Date(row.completed_at);
    }

    return execution;
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    try {
      const totalWorkflows = await this.stateService.count('workflows');
      const runningWorkflows = await this.stateService.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM workflows WHERE status = ?',
        ['running']
      );

      return {
        status: 'healthy',
        details: {
          total_workflows: totalWorkflows,
          running_workflows: runningWorkflows?.count || 0
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