#!/usr/bin/env node

// Test command routing functionality

const commands = [
  // Slash commands
  '/help',
  '/status',
  '/project list',
  '/project create "MosAIc v2"',
  '/task create "Implement login system"',
  '/task list',
  '/agent list',
  '/agent spawn BE-BACKEND-BENJAMIN',
  
  // Natural language
  'show me all projects',
  'create a new task called "Fix authentication bug"',
  'list all active tasks',
  'what is the current status?',
  'assign task TASK-001 to BE-BACKEND-BENJAMIN',
  
  // Plane commands
  '/plane list-issues',
  '/plane create-issue "New feature request"',
  'create plane issue for user registration flow'
];

async function testCommand(command) {
  console.log(`\n=== Testing: "${command}" ===`);
  
  try {
    const response = await fetch('http://localhost:3457/api/v1/test-command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ command })
    });
    
    const result = await response.json();
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function runTests() {
  console.log('Testing MCP Gateway Command Routing\n');
  
  // Check if gateway is running
  try {
    const health = await fetch('http://localhost:3457/health');
    if (!health.ok) {
      throw new Error('Gateway not responding');
    }
    console.log('✓ Gateway is running\n');
  } catch (error) {
    console.error('✗ Gateway is not running. Start it with:');
    console.error('  ./scripts/development/mcp/start-gateway.sh');
    process.exit(1);
  }
  
  // Test each command
  for (const command of commands) {
    await testCommand(command);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
  }
  
  console.log('\n✓ All tests completed');
}

// Run tests
runTests().catch(console.error);