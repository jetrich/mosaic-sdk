import { ProjectService } from '../src/services/ProjectService';
import { TaskService } from '../src/services/TaskService';
import { Logger } from '../src/utils/Logger';
import { MCPServerConfig } from '../src/types';

async function testProjectSwitch() {
  // Create test config
  const config: MCPServerConfig = {
    version: '1.0.0',
    server: {
      name: 'test-server',
      version: '1.0.0',
      description: 'Test server'
    },
    transport: {
      type: 'stdio'
    },
    dataDir: './test-data',
    logging: {
      level: 'debug',
      transports: ['file'],
      file_path: './test.log',
      max_file_size: '10MB',
      max_files: 5,
      format: 'json'
    },
    security: {
      rate_limiting: { enabled: false, max_requests: 100, window_ms: 60000 },
      api_key_auth: { enabled: false, keys: [] },
      allowed_origins: ['*']
    },
    tasks: {
      max_concurrent: 10,
      default_timeout: 300000,
      retry_attempts: 3,
      retry_delay: 1000
    },
    tools: {
      enabled: ['project', 'task', 'agent'],
      timeout: 30000,
      custom_tools_path: null
    }
  };

  const logger = new Logger(config);
  const taskService = new TaskService(config, logger);
  const projectService = new ProjectService(config, logger);

  try {
    // Initialize services
    await taskService.initialize();
    await projectService.initialize();
    projectService.setTaskService(taskService);

    console.log('=== Testing Project Switch Functionality ===\n');

    // Test 1: List existing projects
    console.log('1. Listing existing projects:');
    const projects = await projectService.listProjects();
    console.log(`Found ${projects.length} projects:`);
    projects.forEach(p => console.log(`  - ${p.name} (${p.id}) - Status: ${p.status}`));

    // Test 2: Switch to a new project (create if missing)
    console.log('\n2. Switching to new project "Test Project":');
    const newProject = await projectService.switchProject('Test Project', {
      createIfMissing: true
    });
    console.log(`Switched to project: ${newProject.name} (${newProject.id})`);
    console.log(`Current project in TaskService: ${taskService.getCurrentProject()}`);

    // Test 3: Try to switch to existing project
    console.log('\n3. Switching to existing project "Test Project" again:');
    const existingProject = await projectService.switchProject('Test Project');
    console.log(`Switched to project: ${existingProject.name} (${existingProject.id})`);
    console.log(`Project already existed: ${existingProject.id === newProject.id}`);

    // Test 4: Try to switch to non-existent project without create flag
    console.log('\n4. Testing error case - switching to non-existent project:');
    try {
      await projectService.switchProject('Non-Existent Project');
    } catch (error) {
      console.log(`Expected error: ${error.message}`);
    }

    // Test 5: Create a task in the current project context
    console.log('\n5. Creating a task in current project context:');
    const task = await taskService.createTask({
      title: 'Test task in new project',
      type: 'task'
    });
    console.log(`Created task: ${task.title} in project: ${task.project_id}`);
    console.log(`Task project matches current: ${task.project_id === taskService.getCurrentProject()}`);

    // Test 6: Get project status
    console.log('\n6. Getting project status:');
    const status = await projectService.getProjectStatus(newProject.id);
    console.log(`Project: ${status.project}`);
    console.log(`Status: ${status.status}`);
    console.log('Task stats:', status.task_stats);

    console.log('\n=== All tests completed successfully! ===');

  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testProjectSwitch().catch(console.error);