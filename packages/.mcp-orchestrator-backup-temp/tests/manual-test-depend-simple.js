#!/usr/bin/env node

/**
 * Simple manual test for the mosaic_task_depend functionality
 * This test demonstrates the basic dependency creation between tasks
 */

const { TaskService } = require('../dist/services/TaskService');
const { Logger } = require('../dist/utils/Logger');

// Mock config for testing
const mockConfig = {
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
    task_management: { enabled: true, namespace: 'task' },
    project_coordination: { enabled: true, namespace: 'project' },
    agent_orchestration: { enabled: true, namespace: 'agent' }
  },
  storage: {
    type: 'sqlite',
    connection_string: './test-db.sqlite',
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
    max_concurrent_tools: 10,
    tool_timeout: 30000,
    rate_limiting: {
      enabled: false,
      requests_per_minute: 60
    }
  }
};

async function runTest() {
  console.log('=== Task Dependency Test ===\n');
  
  try {
    // Initialize services
    const logger = new Logger(mockConfig.logging);
    const taskService = new TaskService(mockConfig, logger);
    await taskService.initialize();
    
    console.log('✓ Services initialized\n');
    
    // Create test tasks
    console.log('Creating test tasks...');
    
    const task1 = await taskService.createTask({
      title: 'Backend API Development',
      description: 'Develop REST API endpoints',
      type: 'feature',
      priority: 'high'
    });
    console.log(`✓ Created task 1: ${task1.title} (${task1.id})`);
    
    const task2 = await taskService.createTask({
      title: 'Database Schema Design',
      description: 'Design and implement database schema',
      type: 'story',
      priority: 'critical'
    });
    console.log(`✓ Created task 2: ${task2.title} (${task2.id})`);
    
    const task3 = await taskService.createTask({
      title: 'Frontend Integration',
      description: 'Integrate frontend with API',
      type: 'story',
      priority: 'medium'
    });
    console.log(`✓ Created task 3: ${task3.title} (${task3.id})\n`);
    
    // Test 1: Create valid dependency
    console.log('Test 1: Creating dependency - Backend API blocks Frontend Integration');
    try {
      const dep1 = await taskService.addDependency(task1.id, task3.id, {
        type: 'blocks',
        createdBy: 'test-user',
        notes: 'Frontend cannot start until API is ready'
      });
      console.log(`✓ Dependency created: ${dep1.id}`);
      console.log(`  - Task ${task1.id} blocks ${task3.id}`);
      console.log(`  - Type: ${dep1.dependency_type}`);
      console.log(`  - Notes: ${dep1.notes}\n`);
    } catch (error) {
      console.error(`✗ Failed: ${error.message}\n`);
    }
    
    // Test 2: Create another dependency
    console.log('Test 2: Creating dependency - Backend API depends on Database Schema');
    try {
      const dep2 = await taskService.addDependency(task1.id, task2.id, {
        type: 'depends_on',
        notes: 'API needs database schema to be complete'
      });
      console.log(`✓ Dependency created: ${dep2.id}`);
      console.log(`  - Task ${task1.id} depends on ${task2.id}\n`);
    } catch (error) {
      console.error(`✗ Failed: ${error.message}\n`);
    }
    
    // Test 3: Circular dependency prevention
    console.log('Test 3: Testing circular dependency prevention');
    try {
      await taskService.addDependency(task2.id, task1.id, {
        type: 'blocks'
      });
      console.error('✗ Circular dependency was NOT prevented!\n');
    } catch (error) {
      console.log(`✓ Circular dependency prevented: ${error.message}\n`);
    }
    
    // Test 4: Duplicate dependency prevention
    console.log('Test 4: Testing duplicate dependency prevention');
    try {
      await taskService.addDependency(task1.id, task2.id, {
        type: 'depends_on'
      });
      console.error('✗ Duplicate dependency was NOT prevented!\n');
    } catch (error) {
      console.log(`✓ Duplicate dependency prevented: ${error.message}\n`);
    }
    
    // Test 5: Self-dependency prevention
    console.log('Test 5: Testing self-dependency prevention');
    try {
      await taskService.addDependency(task1.id, task1.id, {
        type: 'blocks'
      });
      console.error('✗ Self-dependency was NOT prevented!\n');
    } catch (error) {
      console.log(`✓ Self-dependency prevented: ${error.message}\n`);
    }
    
    // Test 6: Completed task dependency
    console.log('Test 6: Testing dependency on completed task');
    
    // Mark task2 as completed
    await taskService.updateTaskStatus(task2.id, 'completed');
    console.log(`  - Marked ${task2.title} as completed`);
    
    // Create new task
    const task4 = await taskService.createTask({
      title: 'New Feature',
      type: 'feature',
      priority: 'medium'
    });
    
    // Try with strict mode (default)
    try {
      await taskService.addDependency(task4.id, task2.id, {
        type: 'depends_on',
        strict: true
      });
      console.error('✗ Dependency on completed task was allowed in strict mode!\n');
    } catch (error) {
      console.log(`✓ Dependency on completed task prevented (strict mode): ${error.message}`);
    }
    
    // Try with strict=false
    try {
      const dep3 = await taskService.addDependency(task4.id, task2.id, {
        type: 'depends_on',
        strict: false,
        notes: 'Reference dependency for documentation'
      });
      console.log(`✓ Dependency on completed task allowed with strict=false: ${dep3.id}\n`);
    } catch (error) {
      console.error(`✗ Failed with strict=false: ${error.message}\n`);
    }
    
    console.log('=== All tests completed ===');
    
  } catch (error) {
    console.error(`Test failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
  
  // Clean up test database
  const fs = require('fs');
  if (fs.existsSync('./test-db.sqlite')) {
    fs.unlinkSync('./test-db.sqlite');
    console.log('\nTest database cleaned up');
  }
  
  process.exit(0);
}

// Run the test
runTest();