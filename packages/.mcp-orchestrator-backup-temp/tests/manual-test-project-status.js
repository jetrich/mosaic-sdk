#!/usr/bin/env node

const { ProjectService } = require('../dist/services/ProjectService');
const { TaskService } = require('../dist/services/TaskService');
const { Logger } = require('../dist/utils/Logger');
const { MCPServerConfig } = require('../dist/types');

// Configuration
const config = {
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
    task_management: {
      enabled: true,
      namespace: 'mosaic_task'
    },
    project_coordination: {
      enabled: true,
      namespace: 'mosaic_project'
    },
    agent_orchestration: {
      enabled: true,
      namespace: 'mosaic_agent'
    }
  },
  storage: {
    type: 'sqlite',
    connection_string: ':memory:',
    migrations_path: './migrations',
    backup_enabled: false,
    backup_interval: '1h'
  },
  logging: {
    level: 'info',
    console: true,
    structured: false
  },
  security: {
    max_concurrent_tools: 5,
    tool_timeout: 300000,
    rate_limiting: {
      enabled: false,
      requests_per_minute: 100
    }
  }
};

async function testProjectStatus() {
  console.log('=== Testing Enhanced Project Status ===\n');

  // Initialize services
  const logger = new Logger(config.logging);
  const projectService = new ProjectService(config, logger);
  const taskService = new TaskService(config, logger);
  
  // Set up service connections
  projectService.setTaskService(taskService);
  
  await projectService.initialize();
  await taskService.initialize();

  try {
    // Create a test project
    console.log('1. Creating test project...');
    const project = await projectService.createProject({
      name: 'MosAIc SDK Development',
      description: 'Main development project for MosAIc SDK',
      status: 'active',
      owner: 'system',
      team_members: ['BE-BACKEND-BENJAMIN', 'FS-FULLSTACK-FELIX', 'QA-QUALITY-QUINN']
    });
    console.log(`✓ Project created: ${project.name} (${project.id})`);

    // Set current project context
    taskService.setCurrentProject(project.id);

    // Create various tasks to populate the project
    console.log('\n2. Creating test tasks...');
    
    // Create some completed tasks
    for (let i = 1; i <= 5; i++) {
      const task = await taskService.createTask({
        title: `Completed Feature ${i}`,
        type: 'feature',
        priority: 'medium',
        description: `Feature ${i} implementation`,
        assignee: i % 2 === 0 ? 'BE-BACKEND-BENJAMIN' : 'FS-FULLSTACK-FELIX',
        estimated_hours: 8
      });
      await taskService.updateTask(task.id, {
        status: 'completed',
        actual_hours: 7,
        completed_date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Create in-progress tasks
    for (let i = 1; i <= 3; i++) {
      await taskService.createTask({
        title: `Active Task ${i}`,
        type: 'task',
        priority: i === 1 ? 'critical' : 'high',
        description: `Currently working on task ${i}`,
        assignee: ['BE-BACKEND-BENJAMIN', 'FS-FULLSTACK-FELIX', 'QA-QUALITY-QUINN'][i - 1],
        estimated_hours: 4,
        status: 'in_progress'
      });
    }

    // Create pending tasks with due dates
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + i - 3); // Some overdue, some due soon
      
      await taskService.createTask({
        title: `Pending Task ${i}`,
        type: 'subtask',
        priority: i <= 2 ? 'high' : 'medium',
        description: `Task scheduled for completion`,
        due_date: dueDate.toISOString(),
        estimated_hours: 2
      });
    }

    // Create blocked tasks
    for (let i = 1; i <= 2; i++) {
      await taskService.createTask({
        title: `Blocked Task ${i}`,
        type: 'task',
        priority: 'critical',
        description: `Task blocked by external dependency`,
        status: 'blocked',
        assignee: 'QA-QUALITY-QUINN'
      });
    }

    console.log('✓ Created 17 test tasks with various statuses');

    // Get comprehensive project status
    console.log('\n3. Fetching comprehensive project status...\n');
    const statusReport = await projectService.getProjectStatus(project.id);

    // Display the status report
    console.log('=' + '='.repeat(60));
    console.log(`Project Status: ${statusReport.project.name}`);
    console.log('=' + '='.repeat(60));
    
    console.log(`\nStatus: ${statusReport.project.status} | Owner: ${statusReport.project.owner}`);
    console.log(`Created: ${statusReport.project.created_at.toISOString().split('T')[0]}`);
    console.log(`Updated: ${statusReport.project.updated_at.toISOString().split('T')[0]}`);

    console.log('\n📊 Task Statistics');
    console.log('-'.repeat(40));
    console.log(`Total Tasks: ${statusReport.task_statistics.total}`);
    
    console.log('\nBy Status:');
    Object.entries(statusReport.task_statistics.by_status).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });
    
    console.log('\nBy Type:');
    Object.entries(statusReport.task_statistics.by_type).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });
    
    console.log('\nBy Priority:');
    Object.entries(statusReport.task_statistics.by_priority).forEach(([priority, count]) => {
      console.log(`  - ${priority}: ${count}`);
    });
    
    console.log('\nTimeline:');
    console.log(`  - Overdue: ${statusReport.task_statistics.overdue}`);
    console.log(`  - Due Today: ${statusReport.task_statistics.due_today}`);
    console.log(`  - Due This Week: ${statusReport.task_statistics.due_this_week}`);

    console.log('\n👥 Agent Activity');
    console.log('-'.repeat(40));
    console.log(`Active Agents: ${statusReport.agent_activity.active_agents.length}`);
    if (statusReport.agent_activity.active_agents.length > 0) {
      console.log('\nActive Agent List:');
      statusReport.agent_activity.active_agents.forEach(agent => {
        console.log(`  - ${agent}`);
      });
    }
    
    console.log('\nTasks by Agent:');
    Object.entries(statusReport.agent_activity.tasks_by_agent).forEach(([agent, count]) => {
      console.log(`  - ${agent}: ${count} tasks`);
    });
    
    if (statusReport.agent_activity.recent_completions.length > 0) {
      console.log('\nRecent Completions:');
      statusReport.agent_activity.recent_completions.forEach(completion => {
        console.log(`  - "${completion.task_title}" by ${completion.completed_by}`);
      });
    }

    console.log('\n🏥 Project Health');
    console.log('-'.repeat(40));
    console.log(`Completion Rate: ${statusReport.project_health.completion_rate}%`);
    console.log(`On-Time Rate: ${statusReport.project_health.on_time_rate}%`);
    console.log(`Blocked Tasks: ${statusReport.project_health.blocked_tasks}`);
    console.log(`Estimated Completion: ${
      statusReport.project_health.estimated_completion 
        ? statusReport.project_health.estimated_completion.toISOString().split('T')[0]
        : 'Unable to estimate'
    }`);

    if (statusReport.recent_activity.length > 0) {
      console.log('\n📋 Recent Activity');
      console.log('-'.repeat(40));
      statusReport.recent_activity.slice(0, 5).forEach(activity => {
        const timestamp = activity.timestamp.toISOString().replace('T', ' ').split('.')[0];
        console.log(`  - [${activity.type}] ${activity.description} (${timestamp})`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✓ Project status test completed successfully!');

  } catch (error) {
    console.error('Error during test:', error);
    process.exit(1);
  }
}

// Run the test
testProjectStatus().catch(console.error);