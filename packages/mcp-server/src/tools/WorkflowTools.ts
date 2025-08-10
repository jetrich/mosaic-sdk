import { MCPTool, ToolResponse } from '../types';
import { WorkflowService } from '../services/WorkflowService';
import { Logger } from '../utils/Logger';

export class WorkflowTools {
  private workflowService: WorkflowService;
  private logger: Logger;

  constructor(workflowService: WorkflowService, logger: Logger) {
    this.workflowService = workflowService;
    this.logger = logger;
  }

  getTools(): MCPTool[] {
    return [
      this.getMosaicWorkflowCreateTool(),
      this.getMosaicWorkflowExecuteTool(),
      this.getMosaicWorkflowMonitorTool(),
      this.getMosaicWorkflowListTool(),
      this.getMosaicWorkflowGetTool(),
      this.getMosaicWorkflowPauseTool(),
      this.getMosaicWorkflowResumeTool(),
      this.getMosaicWorkflowCancelTool()
    ];
  }

  private getMosaicWorkflowCreateTool(): MCPTool {
    return {
      name: 'workflow_create',
      description: 'Create a new multi-agent workflow with defined steps and dependencies',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the workflow'
          },
          description: {
            type: 'string',
            description: 'Optional description of the workflow'
          },
          project_id: {
            type: 'string',
            description: 'Project ID this workflow belongs to'
          },
          steps: {
            type: 'array',
            description: 'Array of workflow steps',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Step name' },
                description: { type: 'string', description: 'Step description' },
                agent_persona: { 
                  type: 'string', 
                  description: 'Agent persona to execute this step (e.g., BE-BACKEND-BENJAMIN)' 
                },
                task_ids: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Task IDs to be executed in this step'
                },
                dependencies: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Step IDs this step depends on (must complete first)'
                },
                parallel_group: {
                  type: 'string',
                  description: 'Optional group name for parallel execution with other steps'
                },
                timeout_minutes: {
                  type: 'number',
                  description: 'Optional timeout for this step in minutes'
                },
                retry_count: {
                  type: 'number',
                  description: 'Number of retries allowed for this step'
                }
              },
              required: ['name', 'task_ids']
            }
          },
          variables: {
            type: 'object',
            description: 'Optional workflow-level variables'
          },
          schedule: {
            type: 'string',
            description: 'Optional cron expression for scheduled execution'
          },
          timeout_minutes: {
            type: 'number',
            description: 'Optional workflow timeout in minutes'
          },
          max_retries: {
            type: 'number',
            description: 'Maximum number of workflow retries (default: 3)'
          },
          trigger: {
            type: 'string',
            enum: ['manual', 'scheduled', 'event', 'dependency'],
            description: 'Workflow trigger type (default: manual)'
          }
        },
        required: ['name', 'project_id', 'steps']
      },
      handler: async (args: any): Promise<ToolResponse> => {
        const startTime = Date.now();
        
        try {
          const workflow = await this.workflowService.createWorkflow(args, args.created_by || 'system');
          
          return {
            title: 'Workflow Created Successfully',
            metadata: {
              operation: 'mosaic_workflow_create',
              status: 'success',
              data: {
                workflow_id: workflow.id,
                name: workflow.name,
                step_count: workflow.steps.length,
                project_id: workflow.project_id
              },
              timestamp: new Date().toISOString(),
              execution_time_ms: Date.now() - startTime
            },
            output: `Workflow "${workflow.name}" created successfully with ID: ${workflow.id}
            
Steps: ${workflow.steps.length}
Project: ${workflow.project_id}
Status: ${workflow.status}
Trigger: ${workflow.trigger}

Step Summary:
${workflow.steps.map((step, i) => 
  `${i + 1}. ${step.name} (${step.task_ids.length} tasks)${step.dependencies.length > 0 ? ` - depends on: ${step.dependencies.join(', ')}` : ''}`
).join('\n')}

The workflow is ready to be executed using mosaic_workflow_execute.`
          };
        } catch (error) {
          this.logger.error('Failed to create workflow', error, args);
          return {
            title: 'Workflow Creation Failed',
            metadata: {
              operation: 'mosaic_workflow_create',
              status: 'error',
              timestamp: new Date().toISOString(),
              execution_time_ms: Date.now() - startTime
            },
            output: `Error creating workflow: ${(error as Error).message}`
          };
        }
      }
    };
  }

  private getMosaicWorkflowExecuteTool(): MCPTool {
    return {
      name: 'workflow_execute',
      description: 'Execute a workflow with coordinated multi-agent sequences',
      inputSchema: {
        type: 'object',
        properties: {
          workflow_id: {
            type: 'string',
            description: 'ID of the workflow to execute'
          },
          context: {
            type: 'object',
            description: 'Optional execution context variables'
          },
          triggered_by: {
            type: 'string',
            description: 'Who/what triggered this execution'
          }
        },
        required: ['workflow_id']
      },
      handler: async (args: any): Promise<ToolResponse> => {
        const startTime = Date.now();
        
        try {
          const execution = await this.workflowService.executeWorkflow(
            args.workflow_id, 
            args.context || {},
            args.triggered_by
          );
          
          return {
            title: 'Workflow Execution Started',
            metadata: {
              operation: 'mosaic_workflow_execute',
              status: 'success',
              data: {
                execution_id: execution.id,
                workflow_id: execution.workflow_id,
                execution_number: execution.execution_number,
                status: execution.status
              },
              timestamp: new Date().toISOString(),
              execution_time_ms: Date.now() - startTime
            },
            output: `Workflow execution started successfully!

Execution ID: ${execution.id}
Workflow ID: ${execution.workflow_id}
Execution Number: ${execution.execution_number}
Status: ${execution.status}
Started: ${execution.started_at.toISOString()}
Triggered by: ${execution.triggered_by || 'system'}

The workflow is now running. Use mosaic_workflow_monitor to track progress.`
          };
        } catch (error) {
          this.logger.error('Failed to execute workflow', error, args);
          return {
            title: 'Workflow Execution Failed',
            metadata: {
              operation: 'mosaic_workflow_execute',
              status: 'error',
              timestamp: new Date().toISOString(),
              execution_time_ms: Date.now() - startTime
            },
            output: `Error executing workflow: ${(error as Error).message}`
          };
        }
      }
    };
  }

  private getMosaicWorkflowMonitorTool(): MCPTool {
    return {
      name: 'workflow_monitor',
      description: 'Monitor workflow progress, execution status, and performance metrics',
      inputSchema: {
        type: 'object',
        properties: {
          workflow_id: {
            type: 'string',
            description: 'ID of the workflow to monitor'
          }
        },
        required: ['workflow_id']
      },
      handler: async (args: any): Promise<ToolResponse> => {
        const startTime = Date.now();
        
        try {
          const monitoring = await this.workflowService.monitorWorkflow(args.workflow_id);
          
          const { workflow, current_execution, recent_executions, performance_metrics } = monitoring;
          
          let output = `Workflow Monitoring Report: ${workflow.name}
          
Status: ${workflow.status}
Progress: ${workflow.progress.completion_percentage.toFixed(1)}%
Steps: ${workflow.progress.completed_steps}/${workflow.progress.total_steps} completed`;

          if (workflow.progress.failed_steps > 0) {
            output += `\nFailed Steps: ${workflow.progress.failed_steps}`;
          }

          if (current_execution) {
            output += `

Current Execution:
- Execution ID: ${current_execution.id}
- Number: ${current_execution.execution_number}
- Status: ${current_execution.status}
- Started: ${current_execution.started_at.toISOString()}
- Trigger: ${current_execution.trigger}`;
          }

          output += `

Performance Metrics:
- Total Executions: ${performance_metrics.total_executions}
- Success Rate: ${performance_metrics.success_rate.toFixed(1)}%
- Average Duration: ${performance_metrics.average_duration_minutes.toFixed(1)} minutes
- Last 24h Executions: ${performance_metrics.last_24h_executions}

Recent Executions (${recent_executions.length}):
${recent_executions.map(exec => 
  `- #${exec.execution_number}: ${exec.status} (${exec.started_at.toISOString()})${exec.completed_at ? ` - ${exec.completed_at.toISOString()}` : ''}`
).join('\n')}`;

          return {
            title: 'Workflow Monitoring Data',
            metadata: {
              operation: 'mosaic_workflow_monitor',
              status: 'success',
              data: {
                workflow_status: workflow.status,
                completion_percentage: workflow.progress.completion_percentage,
                current_execution_id: current_execution?.id,
                performance_metrics
              },
              timestamp: new Date().toISOString(),
              execution_time_ms: Date.now() - startTime
            },
            output
          };
        } catch (error) {
          this.logger.error('Failed to monitor workflow', error, args);
          return {
            title: 'Workflow Monitoring Failed',
            metadata: {
              operation: 'mosaic_workflow_monitor',
              status: 'error',
              timestamp: new Date().toISOString(),
              execution_time_ms: Date.now() - startTime
            },
            output: `Error monitoring workflow: ${(error as Error).message}`
          };
        }
      }
    };
  }

  private getMosaicWorkflowListTool(): MCPTool {
    return {
      name: 'workflow_list',
      description: 'List workflows with optional filtering',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: {
            type: 'string',
            description: 'Filter by project ID'
          },
          status: {
            type: 'string',
            enum: ['pending', 'running', 'paused', 'completed', 'failed', 'cancelled'],
            description: 'Filter by workflow status'
          },
          trigger: {
            type: 'string',
            enum: ['manual', 'scheduled', 'event', 'dependency'],
            description: 'Filter by trigger type'
          },
          created_by: {
            type: 'string',
            description: 'Filter by creator'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of workflows to return (default: 50)'
          },
          offset: {
            type: 'number',
            description: 'Number of workflows to skip for pagination'
          }
        }
      },
      handler: async (args: any): Promise<ToolResponse> => {
        const startTime = Date.now();
        
        try {
          const { limit, offset, ...filter } = args;
          const workflows = await this.workflowService.listWorkflows(
            Object.keys(filter).length > 0 ? filter : undefined,
            limit || 50,
            offset
          );
          
          let output = `Found ${workflows.length} workflows`;
          
          if (Object.keys(filter).length > 0) {
            output += ` (filtered)`;
          }
          
          output += `:\n\n`;
          
          if (workflows.length === 0) {
            output += 'No workflows found matching the criteria.';
          } else {
            output += workflows.map((workflow, i) => 
              `${i + 1}. ${workflow.name} (${workflow.id})
   Status: ${workflow.status} | Steps: ${workflow.steps.length} | Progress: ${workflow.progress.completion_percentage.toFixed(1)}%
   Project: ${workflow.project_id} | Created: ${workflow.created_at.toISOString()}
   Trigger: ${workflow.trigger}${workflow.description ? `\n   Description: ${workflow.description}` : ''}`
            ).join('\n\n');
          }
          
          return {
            title: 'Workflow List',
            metadata: {
              operation: 'mosaic_workflow_list',
              status: 'success',
              data: {
                count: workflows.length,
                filter: Object.keys(filter).length > 0 ? filter : 'none'
              },
              timestamp: new Date().toISOString(),
              execution_time_ms: Date.now() - startTime
            },
            output
          };
        } catch (error) {
          this.logger.error('Failed to list workflows', error, args);
          return {
            title: 'Workflow List Failed',
            metadata: {
              operation: 'mosaic_workflow_list',
              status: 'error',
              timestamp: new Date().toISOString(),
              execution_time_ms: Date.now() - startTime
            },
            output: `Error listing workflows: ${(error as Error).message}`
          };
        }
      }
    };
  }

  private getMosaicWorkflowGetTool(): MCPTool {
    return {
      name: 'workflow_get',
      description: 'Get detailed information about a specific workflow',
      inputSchema: {
        type: 'object',
        properties: {
          workflow_id: {
            type: 'string',
            description: 'ID of the workflow to retrieve'
          }
        },
        required: ['workflow_id']
      },
      handler: async (args: any): Promise<ToolResponse> => {
        const startTime = Date.now();
        
        try {
          const workflow = await this.workflowService.getWorkflow(args.workflow_id);
          
          if (!workflow) {
            return {
              title: 'Workflow Not Found',
              metadata: {
                operation: 'mosaic_workflow_get',
                status: 'error',
                timestamp: new Date().toISOString(),
                execution_time_ms: Date.now() - startTime
              },
              output: `Workflow with ID ${args.workflow_id} not found.`
            };
          }
          
          let output = `Workflow Details: ${workflow.name}

ID: ${workflow.id}
Status: ${workflow.status}
Project: ${workflow.project_id}
Trigger: ${workflow.trigger}
Created: ${workflow.created_at.toISOString()}
Created by: ${workflow.created_by}
Updated: ${workflow.updated_at.toISOString()}`;

          if (workflow.description) {
            output += `\nDescription: ${workflow.description}`;
          }

          if (workflow.started_at) {
            output += `\nStarted: ${workflow.started_at.toISOString()}`;
          }

          if (workflow.completed_at) {
            output += `\nCompleted: ${workflow.completed_at.toISOString()}`;
          }

          if (workflow.schedule) {
            output += `\nSchedule: ${workflow.schedule}`;
          }

          if (workflow.timeout_minutes) {
            output += `\nTimeout: ${workflow.timeout_minutes} minutes`;
          }

          output += `

Progress:
- Total Steps: ${workflow.progress.total_steps}
- Completed: ${workflow.progress.completed_steps}
- Failed: ${workflow.progress.failed_steps}
- Skipped: ${workflow.progress.skipped_steps}
- Completion: ${workflow.progress.completion_percentage.toFixed(1)}%

Steps:
${workflow.steps.map((step, i) => {
  let stepInfo = `${i + 1}. ${step.name} (${step.status})`;
  if (step.agent_persona) stepInfo += `\n   Agent: ${step.agent_persona}`;
  if (step.task_ids.length > 0) stepInfo += `\n   Tasks: ${step.task_ids.join(', ')}`;
  if (step.dependencies.length > 0) stepInfo += `\n   Depends on: ${step.dependencies.join(', ')}`;
  if (step.parallel_group) stepInfo += `\n   Parallel group: ${step.parallel_group}`;
  if (step.timeout_minutes) stepInfo += `\n   Timeout: ${step.timeout_minutes} minutes`;
  if (step.error_message) stepInfo += `\n   Error: ${step.error_message}`;
  return stepInfo;
}).join('\n\n')}`;

          if (Object.keys(workflow.variables).length > 0) {
            output += `\n\nWorkflow Variables:\n${JSON.stringify(workflow.variables, null, 2)}`;
          }
          
          return {
            title: 'Workflow Details',
            metadata: {
              operation: 'mosaic_workflow_get',
              status: 'success',
              data: {
                workflow_id: workflow.id,
                name: workflow.name,
                status: workflow.status,
                step_count: workflow.steps.length,
                completion_percentage: workflow.progress.completion_percentage
              },
              timestamp: new Date().toISOString(),
              execution_time_ms: Date.now() - startTime
            },
            output
          };
        } catch (error) {
          this.logger.error('Failed to get workflow', error, args);
          return {
            title: 'Get Workflow Failed',
            metadata: {
              operation: 'mosaic_workflow_get',
              status: 'error',
              timestamp: new Date().toISOString(),
              execution_time_ms: Date.now() - startTime
            },
            output: `Error getting workflow: ${(error as Error).message}`
          };
        }
      }
    };
  }

  private getMosaicWorkflowPauseTool(): MCPTool {
    return {
      name: 'workflow_pause',
      description: 'Pause a running workflow',
      inputSchema: {
        type: 'object',
        properties: {
          workflow_id: {
            type: 'string',
            description: 'ID of the workflow to pause'
          },
          reason: {
            type: 'string',
            description: 'Optional reason for pausing'
          }
        },
        required: ['workflow_id']
      },
      handler: async (args: any): Promise<ToolResponse> => {
        const startTime = Date.now();
        
        try {
          await this.workflowService.pauseWorkflow(args.workflow_id, args.reason);
          
          return {
            title: 'Workflow Paused',
            metadata: {
              operation: 'mosaic_workflow_pause',
              status: 'success',
              data: {
                workflow_id: args.workflow_id,
                reason: args.reason
              },
              timestamp: new Date().toISOString(),
              execution_time_ms: Date.now() - startTime
            },
            output: `Workflow ${args.workflow_id} has been paused.${args.reason ? `\nReason: ${args.reason}` : ''}\n\nUse mosaic_workflow_resume to continue execution.`
          };
        } catch (error) {
          this.logger.error('Failed to pause workflow', error, args);
          return {
            title: 'Workflow Pause Failed',
            metadata: {
              operation: 'mosaic_workflow_pause',
              status: 'error',
              timestamp: new Date().toISOString(),
              execution_time_ms: Date.now() - startTime
            },
            output: `Error pausing workflow: ${(error as Error).message}`
          };
        }
      }
    };
  }

  private getMosaicWorkflowResumeTool(): MCPTool {
    return {
      name: 'workflow_resume',
      description: 'Resume a paused workflow',
      inputSchema: {
        type: 'object',
        properties: {
          workflow_id: {
            type: 'string',
            description: 'ID of the workflow to resume'
          }
        },
        required: ['workflow_id']
      },
      handler: async (args: any): Promise<ToolResponse> => {
        const startTime = Date.now();
        
        try {
          await this.workflowService.resumeWorkflow(args.workflow_id);
          
          return {
            title: 'Workflow Resumed',
            metadata: {
              operation: 'mosaic_workflow_resume',
              status: 'success',
              data: {
                workflow_id: args.workflow_id
              },
              timestamp: new Date().toISOString(),
              execution_time_ms: Date.now() - startTime
            },
            output: `Workflow ${args.workflow_id} has been resumed and is now running.\n\nUse mosaic_workflow_monitor to track progress.`
          };
        } catch (error) {
          this.logger.error('Failed to resume workflow', error, args);
          return {
            title: 'Workflow Resume Failed',
            metadata: {
              operation: 'mosaic_workflow_resume',
              status: 'error',
              timestamp: new Date().toISOString(),
              execution_time_ms: Date.now() - startTime
            },
            output: `Error resuming workflow: ${(error as Error).message}`
          };
        }
      }
    };
  }

  private getMosaicWorkflowCancelTool(): MCPTool {
    return {
      name: 'workflow_cancel',
      description: 'Cancel a running or paused workflow',
      inputSchema: {
        type: 'object',
        properties: {
          workflow_id: {
            type: 'string',
            description: 'ID of the workflow to cancel'
          },
          reason: {
            type: 'string',
            description: 'Optional reason for cancellation'
          }
        },
        required: ['workflow_id']
      },
      handler: async (args: any): Promise<ToolResponse> => {
        const startTime = Date.now();
        
        try {
          await this.workflowService.cancelWorkflow(args.workflow_id, args.reason);
          
          return {
            title: 'Workflow Cancelled',
            metadata: {
              operation: 'mosaic_workflow_cancel',
              status: 'success',
              data: {
                workflow_id: args.workflow_id,
                reason: args.reason
              },
              timestamp: new Date().toISOString(),
              execution_time_ms: Date.now() - startTime
            },
            output: `Workflow ${args.workflow_id} has been cancelled.${args.reason ? `\nReason: ${args.reason}` : ''}\n\nThe workflow cannot be resumed after cancellation.`
          };
        } catch (error) {
          this.logger.error('Failed to cancel workflow', error, args);
          return {
            title: 'Workflow Cancel Failed',
            metadata: {
              operation: 'mosaic_workflow_cancel',
              status: 'error',
              timestamp: new Date().toISOString(),
              execution_time_ms: Date.now() - startTime
            },
            output: `Error cancelling workflow: ${(error as Error).message}`
          };
        }
      }
    };
  }
}