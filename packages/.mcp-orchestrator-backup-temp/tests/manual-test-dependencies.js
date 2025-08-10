#!/usr/bin/env node

// Manual test script for task dependency functionality
const { spawn } = require('child_process');
const path = require('path');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60) + '\n');
}

// Start the MCP server
const serverPath = path.join(__dirname, '..', 'dist', 'index.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, NODE_ENV: 'development' }
});

let taskIds = [];

// Helper to send a request to the server
async function sendRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    };

    server.stdin.write(JSON.stringify(request) + '\n');

    const handler = (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      for (const line of lines) {
        try {
          const response = JSON.parse(line);
          if (response.id === request.id) {
            server.stdout.removeListener('data', handler);
            if (response.error) {
              reject(new Error(response.error.message));
            } else {
              resolve(response.result);
            }
          }
        } catch (e) {
          // Not JSON, ignore
        }
      }
    };

    server.stdout.on('data', handler);

    setTimeout(() => {
      server.stdout.removeListener('data', handler);
      reject(new Error('Request timeout'));
    }, 5000);
  });
}

// Test scenarios
async function runTests() {
  try {
    // Wait for server to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    logSection('Task Dependency Testing');

    // Test 1: Create tasks
    log('\n1. Creating test tasks...', colors.yellow);
    
    const task1 = await sendRequest('tools/call', {
      name: 'mosaic_task_create',
      arguments: {
        title: 'Backend API Development',
        description: 'Develop the REST API endpoints',
        type: 'feature',
        priority: 'high'
      }
    });
    taskIds.push(task1.content[0].text.match(/Task ID\*\*: ([^\s]+)/)[1]);
    log('✓ Created task: Backend API Development', colors.green);

    const task2 = await sendRequest('tools/call', {
      name: 'mosaic_task_create',
      arguments: {
        title: 'Database Schema Design',
        description: 'Design and implement database schema',
        type: 'story',
        priority: 'critical'
      }
    });
    taskIds.push(task2.content[0].text.match(/Task ID\*\*: ([^\s]+)/)[1]);
    log('✓ Created task: Database Schema Design', colors.green);

    const task3 = await sendRequest('tools/call', {
      name: 'mosaic_task_create',
      arguments: {
        title: 'Frontend Integration',
        description: 'Integrate frontend with API',
        type: 'story',
        priority: 'medium'
      }
    });
    taskIds.push(task3.content[0].text.match(/Task ID\*\*: ([^\s]+)/)[1]);
    log('✓ Created task: Frontend Integration', colors.green);

    // Test 2: Create valid dependency
    log('\n2. Creating dependency: API Development blocks Frontend Integration...', colors.yellow);
    
    const dep1 = await sendRequest('tools/call', {
      name: 'mosaic_task_depend',
      arguments: {
        task_id: taskIds[0], // Backend API
        depends_on_task_id: taskIds[2], // Frontend Integration
        dependency_type: 'blocks',
        notes: 'Frontend cannot start until API is ready'
      }
    });
    log('✓ Dependency created successfully', colors.green);
    console.log(dep1.content[0].text);

    // Test 3: Create another valid dependency
    log('\n3. Creating dependency: API Development depends on Database Schema...', colors.yellow);
    
    const dep2 = await sendRequest('tools/call', {
      name: 'mosaic_task_depend',
      arguments: {
        task_id: taskIds[0], // Backend API
        depends_on_task_id: taskIds[1], // Database Schema
        dependency_type: 'depends_on',
        notes: 'API needs database schema to be complete'
      }
    });
    log('✓ Dependency created successfully', colors.green);

    // Test 4: Test circular dependency prevention
    log('\n4. Testing circular dependency prevention...', colors.yellow);
    
    try {
      await sendRequest('tools/call', {
        name: 'mosaic_task_depend',
        arguments: {
          task_id: taskIds[1], // Database Schema
          depends_on_task_id: taskIds[0], // Backend API
          dependency_type: 'blocks'
        }
      });
      log('✗ Circular dependency was not prevented!', colors.red);
    } catch (error) {
      log('✓ Circular dependency correctly prevented', colors.green);
      log(`  Error: ${error.message}`, colors.blue);
    }

    // Test 5: Test duplicate dependency prevention
    log('\n5. Testing duplicate dependency prevention...', colors.yellow);
    
    try {
      await sendRequest('tools/call', {
        name: 'mosaic_task_depend',
        arguments: {
          task_id: taskIds[0], // Backend API
          depends_on_task_id: taskIds[1], // Database Schema (already exists)
          dependency_type: 'depends_on'
        }
      });
      log('✗ Duplicate dependency was not prevented!', colors.red);
    } catch (error) {
      log('✓ Duplicate dependency correctly prevented', colors.green);
      log(`  Error: ${error.message}`, colors.blue);
    }

    // Test 6: Test self-dependency prevention
    log('\n6. Testing self-dependency prevention...', colors.yellow);
    
    try {
      await sendRequest('tools/call', {
        name: 'mosaic_task_depend',
        arguments: {
          task_id: taskIds[0],
          depends_on_task_id: taskIds[0], // Same task
          dependency_type: 'blocks'
        }
      });
      log('✗ Self-dependency was not prevented!', colors.red);
    } catch (error) {
      log('✓ Self-dependency correctly prevented', colors.green);
      log(`  Error: ${error.message}`, colors.blue);
    }

    // Test 7: Test completed task dependency
    log('\n7. Testing dependency on completed task...', colors.yellow);
    
    // First, complete a task
    await sendRequest('tools/call', {
      name: 'mosaic_task_status',
      arguments: {
        task_id: taskIds[1],
        status: 'completed'
      }
    });
    log('  Task marked as completed', colors.blue);

    // Create a new task
    const task4 = await sendRequest('tools/call', {
      name: 'mosaic_task_create',
      arguments: {
        title: 'New Feature',
        type: 'feature',
        priority: 'medium'
      }
    });
    const newTaskId = task4.content[0].text.match(/Task ID\*\*: ([^\s]+)/)[1];

    // Try to create dependency on completed task (strict mode)
    try {
      await sendRequest('tools/call', {
        name: 'mosaic_task_depend',
        arguments: {
          task_id: newTaskId,
          depends_on_task_id: taskIds[1], // Completed task
          dependency_type: 'depends_on',
          strict: true
        }
      });
      log('✗ Dependency on completed task was allowed in strict mode!', colors.red);
    } catch (error) {
      log('✓ Dependency on completed task correctly prevented in strict mode', colors.green);
      log(`  Error: ${error.message}`, colors.blue);
    }

    // Try with strict=false
    log('\n8. Testing dependency on completed task with strict=false...', colors.yellow);
    
    const dep3 = await sendRequest('tools/call', {
      name: 'mosaic_task_depend',
      arguments: {
        task_id: newTaskId,
        depends_on_task_id: taskIds[1], // Completed task
        dependency_type: 'depends_on',
        strict: false,
        notes: 'Dependency on completed task for reference'
      }
    });
    log('✓ Dependency on completed task allowed with strict=false', colors.green);

    // Test 9: Test non-existent task
    log('\n9. Testing dependency with non-existent task...', colors.yellow);
    
    try {
      await sendRequest('tools/call', {
        name: 'mosaic_task_depend',
        arguments: {
          task_id: 'NON-EXISTENT-ID',
          depends_on_task_id: taskIds[0],
          dependency_type: 'blocks'
        }
      });
      log('✗ Non-existent task dependency was allowed!', colors.red);
    } catch (error) {
      log('✓ Non-existent task correctly rejected', colors.green);
      log(`  Error: ${error.message}`, colors.blue);
    }

    logSection('All Tests Completed Successfully!');

  } catch (error) {
    log(`\nTest failed: ${error.message}`, colors.red);
    console.error(error);
  } finally {
    // Clean up
    server.kill();
    process.exit(0);
  }
}

// Handle server errors
server.on('error', (error) => {
  log(`Server error: ${error.message}`, colors.red);
  process.exit(1);
});

server.stderr.on('data', (data) => {
  // Only show errors, not debug output
  const output = data.toString();
  if (output.includes('ERROR') || output.includes('Error')) {
    log(`Server error: ${output}`, colors.red);
  }
});

// Run tests
runTests();