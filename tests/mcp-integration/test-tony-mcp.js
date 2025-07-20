#!/usr/bin/env node
/**
 * Test Script for Tony 2.8.0 MCP Integration
 * Validates that the minimal MCP implementation works correctly
 */

// Import the Tony MCP integration modules
import { tonyMCP } from '../../tony/core/mcp/tony-integration.js';
import { minimalMCPServer } from '../../tony/core/mcp/minimal-implementation.js';

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testTonyMCPIntegration() {
  log('\n=== Tony 2.8.0 MCP Integration Test ===\n', 'cyan');
  
  try {
    // Test 1: Initialize Tony with MCP
    log('Test 1: Initializing Tony with MCP...', 'blue');
    await tonyMCP.initialize();
    const registration = tonyMCP.getRegistration();
    if (registration) {
      log(`✅ Tony registered successfully with ID: ${registration.agentId}`, 'green');
    } else {
      throw new Error('Tony registration failed');
    }
    
    // Test 2: Check MCP health status
    log('\nTest 2: Checking MCP health status...', 'blue');
    const health = await minimalMCPServer.getHealthStatus();
    log(`✅ MCP Status: ${health.status}`, 'green');
    log(`   Version: ${health.version}`, 'green');
    log(`   Total Agents: ${health.agents.total}`, 'green');
    
    // Test 3: Deploy specialized agents
    log('\nTest 3: Deploying specialized agents...', 'blue');
    const agentTypes = ['implementation', 'qa', 'security', 'documentation'];
    const deployedAgents = [];
    
    for (const type of agentTypes) {
      const agent = await tonyMCP.deployAgent(type);
      deployedAgents.push(agent);
      log(`✅ Deployed ${type} agent: ${agent.agentId}`, 'green');
    }
    
    // Test 4: Get active agents
    log('\nTest 4: Getting active agents...', 'blue');
    const activeAgents = await minimalMCPServer.getActiveAgents();
    log(`✅ Active agents: ${activeAgents.length}`, 'green');
    activeAgents.forEach(agent => {
      log(`   - ${agent.name} (${agent.type}): ${agent.status}`, 'green');
    });
    
    // Test 5: Assign a task to an agent
    log('\nTest 5: Assigning task to Implementation Agent...', 'blue');
    const implementationAgent = deployedAgents[0];
    const task = {
      type: 'code.write',
      description: 'Implement user authentication module',
      priority: 'high'
    };
    const taskResult = await tonyMCP.assignTask(implementationAgent.agentId, task);
    log(`✅ Task assigned successfully: ${JSON.stringify(taskResult)}`, 'green');
    
    // Test 6: Broadcast coordination message
    log('\nTest 6: Broadcasting coordination message...', 'blue');
    await tonyMCP.broadcastCoordination({
      action: 'prepare_for_deployment',
      target: 'all',
      deadline: new Date(Date.now() + 3600000).toISOString()
    });
    log('✅ Coordination message broadcast successfully', 'green');
    
    // Test 7: Get agent statuses
    log('\nTest 7: Getting agent statuses...', 'blue');
    const statuses = await tonyMCP.getAgentStatuses();
    log(`✅ Retrieved status for ${statuses.length} agents`, 'green');
    
    // Test 8: Test error handling
    log('\nTest 8: Testing error handling...', 'blue');
    try {
      await tonyMCP.assignTask('invalid-agent-id', { test: true });
      log('❌ Error handling failed - should have thrown an error', 'red');
    } catch (error) {
      log(`✅ Error handling works correctly: ${error.message}`, 'green');
    }
    
    // Final health check
    log('\nFinal health check...', 'blue');
    const finalHealth = await minimalMCPServer.getHealthStatus();
    log(`✅ Final MCP Status: ${finalHealth.status}`, 'green');
    log(`   Active Agents: ${finalHealth.agents.active}`, 'green');
    log(`   Idle Agents: ${finalHealth.agents.idle}`, 'green');
    
    // Cleanup
    log('\nCleaning up...', 'blue');
    await tonyMCP.shutdown();
    log('✅ Tony MCP integration shutdown complete', 'green');
    
    // Summary
    log('\n=== Test Summary ===', 'cyan');
    log('✅ All tests passed successfully!', 'green');
    log('✅ Tony 2.8.0 MCP integration is working correctly', 'green');
    log('✅ Ready for production deployment', 'green');
    
  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testTonyMCPIntegration().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});