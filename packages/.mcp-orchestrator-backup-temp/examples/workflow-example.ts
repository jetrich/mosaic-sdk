#!/usr/bin/env ts-node

/**
 * Example: Using the Workflow Orchestration System
 * 
 * This example demonstrates how to create and execute multi-agent workflows
 * using the MosAIc Orchestrator workflow tools.
 */

import { WorkflowService } from '../src/services/WorkflowService';
import { AgentService } from '../src/services/AgentService';
import { TaskService } from '../src/services/TaskService';
import { CommunicationService } from '../src/services/CommunicationService';
import { Logger } from '../src/utils/Logger';
import { MCPServerConfig } from '../src/types';

async function workflowExample() {
  // Setup configuration
  const config: MCPServerConfig = {
    server: {
      name: 'workflow-example',
      version: '1.0.0',
      description: 'Workflow orchestration example'
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
      connection_string: './example-workflow.db',
      migrations_path: './migrations',
      backup_enabled: false,
      backup_interval: '24h'
    },
    logging: {
      level: 'info',
      console: true,
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

  // Initialize services
  const logger = new Logger(config.logging);
  const agentService = new AgentService(config, logger);
  const taskService = new TaskService(config, logger);
  const communicationService = new CommunicationService(config, logger);
  const workflowService = new WorkflowService(config, logger, agentService, taskService, communicationService);

  // Initialize all services
  await workflowService.initialize();
  await agentService.initialize();
  await taskService.initialize();
  await communicationService.initialize();

  console.log('🚀 Workflow Orchestration Example Started\n');

  // Step 1: Create tasks for the workflow
  console.log('📋 Creating tasks...');
  
  const backendTask = await taskService.createTask({
    title: 'Set up backend API endpoints',
    description: 'Create REST API with authentication and database integration',
    type: 'task',
    priority: 'high',
    estimated_hours: 8,
    project_id: 'web-app-project'
  });

  const frontendTask = await taskService.createTask({
    title: 'Build user interface components',
    description: 'Create React components for user authentication and dashboard',
    type: 'task',
    priority: 'high',
    estimated_hours: 6,
    project_id: 'web-app-project'
  });

  const testingTask = await taskService.createTask({
    title: 'Write integration tests',
    description: 'Create comprehensive test suite for API and UI components',
    type: 'task',
    priority: 'medium',
    estimated_hours: 4,
    project_id: 'web-app-project'
  });

  const deploymentTask = await taskService.createTask({
    title: 'Deploy to staging environment',
    description: 'Set up CI/CD pipeline and deploy to staging for testing',
    type: 'task',
    priority: 'medium',
    estimated_hours: 3,
    project_id: 'web-app-project'
  });

  console.log(`✅ Created 4 tasks:
  - Backend API: ${backendTask.id}
  - Frontend UI: ${frontendTask.id}
  - Integration Tests: ${testingTask.id}
  - Deployment: ${deploymentTask.id}\n`);

  // Step 2: Create a workflow with dependencies
  console.log('🔄 Creating workflow with agent coordination...');

  const workflow = await workflowService.createWorkflow({
    name: 'Web Application Development Workflow',
    description: 'Complete development workflow from backend to deployment',
    project_id: 'web-app-project',
    steps: [
      {
        name: 'Backend Development',
        description: 'Set up API and database',
        agent_persona: 'BE-BACKEND-BENJAMIN',
        task_ids: [backendTask.id],
        dependencies: [], // No dependencies - can start immediately
        timeout_minutes: 60
      },
      {
        name: 'Frontend Development',
        description: 'Build user interface',
        agent_persona: 'FE-FRONTEND-FIONA',
        task_ids: [frontendTask.id],
        dependencies: [], // Can run in parallel with backend
        parallel_group: 'development',
        timeout_minutes: 45
      },
      {
        name: 'Integration Testing',
        description: 'Test the complete system',
        agent_persona: 'QA-QUALITY-QUINN',
        task_ids: [testingTask.id],
        dependencies: [], // Will be set to depend on both dev steps after creation
        timeout_minutes: 30
      },
      {
        name: 'Deployment to Staging',
        description: 'Deploy and verify in staging',
        agent_persona: 'DEVOPS-OPERATIONS-OLIVER',
        task_ids: [deploymentTask.id],
        dependencies: [], // Will be set to depend on testing step after creation
        timeout_minutes: 20
      }
    ],
    variables: {
      environment: 'staging',
      version: '1.0.0',
      database_url: 'postgresql://localhost:5432/webapp_staging'
    },
    trigger: 'manual',
    timeout_minutes: 180, // 3 hours total
    max_retries: 2
  });

  // Manually set dependencies after step IDs are generated
  const steps = workflow.steps;
  const backendStepId = steps[0]?.id;
  const frontendStepId = steps[1]?.id;
  const testingStepId = steps[2]?.id;

  if (backendStepId && frontendStepId && testingStepId) {
    // Update testing step to depend on both backend and frontend
    steps[2].dependencies = [backendStepId, frontendStepId];
    // Update deployment step to depend on testing
    steps[3].dependencies = [testingStepId];
  }

  console.log(`✅ Created workflow: ${workflow.id}
  Steps: ${workflow.steps.length}
  Status: ${workflow.status}
  Progress: ${workflow.progress.completion_percentage}%\n`);

  // Step 3: Execute the workflow
  console.log('▶️  Executing workflow...');

  const execution = await workflowService.executeWorkflow(
    workflow.id,
    {
      initiated_by: 'developer',
      sprint: 'sprint-23',
      feature_branch: 'feature/user-authentication'
    },
    'workflow-example'
  );

  console.log(`✅ Workflow execution started:
  Execution ID: ${execution.id}
  Number: ${execution.execution_number}
  Status: ${execution.status}
  Started: ${execution.started_at.toISOString()}\n`);

  // Step 4: Monitor workflow progress
  console.log('📊 Monitoring workflow progress...');

  // Wait a moment for some processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  const monitoring = await workflowService.monitorWorkflow(workflow.id);

  console.log(`📈 Workflow Status Report:
  Name: ${monitoring.workflow.name}
  Status: ${monitoring.workflow.status}
  Progress: ${monitoring.workflow.progress.completion_percentage.toFixed(1)}%
  Completed Steps: ${monitoring.workflow.progress.completed_steps}/${monitoring.workflow.progress.total_steps}
  Failed Steps: ${monitoring.workflow.progress.failed_steps}

Performance Metrics:
  Total Executions: ${monitoring.performance_metrics.total_executions}
  Success Rate: ${monitoring.performance_metrics.success_rate.toFixed(1)}%
  Average Duration: ${monitoring.performance_metrics.average_duration_minutes.toFixed(1)} minutes
  Last 24h Executions: ${monitoring.performance_metrics.last_24h_executions}`);

  if (monitoring.current_execution) {
    console.log(`
Current Execution:
  ID: ${monitoring.current_execution.id}
  Status: ${monitoring.current_execution.status}
  Started: ${monitoring.current_execution.started_at.toISOString()}`);
  }

  console.log(`\nStep Details:`);
  monitoring.workflow.steps.forEach((step, i) => {
    console.log(`  ${i + 1}. ${step.name} (${step.status})`);
    if (step.agent_persona) {
      console.log(`     Agent: ${step.agent_persona}`);
    }
    if (step.dependencies.length > 0) {
      console.log(`     Dependencies: ${step.dependencies.length} step(s)`);
    }
    if (step.parallel_group) {
      console.log(`     Parallel Group: ${step.parallel_group}`);
    }
  });

  // Step 5: Demonstrate workflow control
  console.log('\n🎛️  Demonstrating workflow control...');

  // Pause the workflow
  await workflowService.pauseWorkflow(workflow.id, 'Demonstrating pause functionality');
  console.log('⏸️  Workflow paused');

  // Resume the workflow
  await workflowService.resumeWorkflow(workflow.id);
  console.log('▶️  Workflow resumed');

  // List all workflows
  const allWorkflows = await workflowService.listWorkflows();
  console.log(`\n📋 Total workflows in system: ${allWorkflows.length}`);

  allWorkflows.forEach((wf, i) => {
    console.log(`  ${i + 1}. ${wf.name} (${wf.status}) - ${wf.progress.completion_percentage.toFixed(1)}% complete`);
  });

  console.log('\n🎉 Workflow Orchestration Example Complete!');
  console.log('\nKey Features Demonstrated:');
  console.log('✅ Multi-step workflow creation with dependencies');
  console.log('✅ Parallel execution groups for concurrent steps');
  console.log('✅ Agent assignment with personas (BE-BACKEND-BENJAMIN, FE-FRONTEND-FIONA, etc.)');
  console.log('✅ Task integration and management');
  console.log('✅ Real-time workflow monitoring and progress tracking');
  console.log('✅ Workflow control (pause/resume)');
  console.log('✅ Performance metrics and execution history');
  console.log('✅ Comprehensive error handling and validation');

  console.log('\n🛠️  Available MCP Tools:');
  console.log('• mosaic_workflow_create - Create new workflows');
  console.log('• mosaic_workflow_execute - Start workflow execution');
  console.log('• mosaic_workflow_monitor - Track progress and metrics');
  console.log('• mosaic_workflow_list - List and filter workflows');
  console.log('• mosaic_workflow_get - Get detailed workflow information');
  console.log('• mosaic_workflow_pause - Pause running workflows');
  console.log('• mosaic_workflow_resume - Resume paused workflows');
  console.log('• mosaic_workflow_cancel - Cancel workflows');
}

// Run the example
if (require.main === module) {
  workflowExample()
    .then(() => {
      console.log('\n✨ Example completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Example failed:', error.message);
      process.exit(1);
    });
}

export { workflowExample };