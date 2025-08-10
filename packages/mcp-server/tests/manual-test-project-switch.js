// Simple manual test for project switch functionality
// Run with: node tests/manual-test-project-switch.js

const { ProjectService } = require('../dist/services/ProjectService');
const { TaskService } = require('../dist/services/TaskService');
const { Logger } = require('../dist/utils/Logger');
const path = require('path');

async function runTest() {
  console.log('=== Manual Test: Project Switch Functionality ===\n');

  // Create simple config
  const config = {
    dataDir: path.join(__dirname, 'test-data'),
    logging: {
      level: 'info',
      console: true,
      structured: false
    }
  };

  const logger = new Logger(config.logging);
  const taskService = new TaskService(config, logger);
  const projectService = new ProjectService(config, logger);

  try {
    // Initialize services
    console.log('1. Initializing services...');
    await taskService.initialize();
    await projectService.initialize();
    projectService.setTaskService(taskService);
    console.log('✓ Services initialized\n');

    // List existing projects
    console.log('2. Listing existing projects:');
    const projects = await projectService.listProjects();
    console.log(`Found ${projects.length} projects:`);
    projects.forEach(p => console.log(`  - ${p.name} (${p.id}) - Status: ${p.status}`));
    console.log('');

    // Test switching to new project
    console.log('3. Testing switch to new project with createIfMissing:');
    const testProjectName = 'Manual Test Project ' + Date.now();
    const newProject = await projectService.switchProject(testProjectName, {
      createIfMissing: true
    });
    console.log(`✓ Switched to project: ${newProject.name} (${newProject.id})`);
    console.log(`  Status: ${newProject.status}`);
    console.log(`  Owner: ${newProject.owner}`);
    console.log(`  Current project in TaskService: ${taskService.getCurrentProject()}`);
    console.log('');

    // Create a task in the new project
    console.log('4. Creating a task in the new project:');
    const task = await taskService.createTask({
      title: 'Test task in manual test project',
      type: 'task',
      description: 'This task was created to test project context'
    });
    console.log(`✓ Created task: ${task.title}`);
    console.log(`  Task ID: ${task.id}`);
    console.log(`  Project ID: ${task.project_id}`);
    console.log(`  Matches current project: ${task.project_id === newProject.id}`);
    console.log('');

    // Get project status
    console.log('5. Getting project status:');
    const status = await projectService.getProjectStatus(newProject.id);
    console.log(`Project: ${status.project}`);
    console.log(`Status: ${status.status}`);
    console.log('Task statistics:');
    Object.entries(status.task_stats).forEach(([taskStatus, count]) => {
      console.log(`  - ${taskStatus}: ${count}`);
    });
    console.log('');

    // Test error case
    console.log('6. Testing error case - switch to non-existent project:');
    try {
      await projectService.switchProject('Non-Existent Project XYZ');
      console.log('✗ ERROR: Should have thrown an error!');
    } catch (error) {
      console.log(`✓ Got expected error: ${error.message}`);
    }
    console.log('');

    console.log('=== All tests completed successfully! ===');

  } catch (error) {
    console.error('\n✗ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
runTest().catch(console.error);