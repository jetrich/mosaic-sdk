#!/usr/bin/env node

const { SequentialTaskService } = require('./dist/services/SequentialTaskService');
const { ConfigLoader } = require('./dist/config/ConfigLoader');
const { Logger } = require('./dist/utils/Logger');

async function testSequentialThinking() {
  console.log('\n=== Testing Sequential Thinking Integration ===\n');
  
  try {
    // Load config and create logger
    const config = await ConfigLoader.load('~/.mosaic/config.json');
    const logger = Logger.create({ level: 'info', console: true });
    
    // Create service instance
    const taskService = new SequentialTaskService(config, logger);
    
    // Test 1: Task Decomposition
    console.log('1. Testing Task Decomposition...');
    console.log('─'.repeat(50));
    
    const decomposition = await taskService.decomposeTask(
      'Build a real-time chat application with user authentication',
      {
        domain: 'web-development',
        constraints: ['websocket', 'jwt-auth', 'react-frontend']
      },
      {
        maxDepth: 5,
        includeEstimates: true,
        autoAssign: false
      }
    );
    
    console.log('Decomposition Result:');
    console.log(`- Epic ID: ${decomposition.epicId}`);
    console.log(`- Total Tasks: ${decomposition.totalTasks}`);
    console.log(`- Hierarchy Levels: ${decomposition.hierarchyLevels}`);
    console.log(`- Estimated Hours: ${decomposition.estimatedHours}`);
    console.log('\nTask Breakdown:');
    decomposition.tasks.slice(0, 5).forEach(task => {
      console.log(`  ${task.level}: ${task.title} (${task.estimatedHours}h)`);
    });
    
    // Test 2: Batch Estimation
    console.log('\n\n2. Testing Batch Estimation...');
    console.log('─'.repeat(50));
    
    const taskIds = decomposition.tasks.slice(0, 3).map(t => t.id);
    const estimates = await taskService.batchEstimateTasks(
      taskIds,
      'ai',
      'high'
    );
    
    console.log('Estimation Results:');
    estimates.forEach(est => {
      console.log(`- Task ${est.taskId}: ${est.estimatedHours}h (confidence: ${est.confidence})`);
    });
    
    // Test 3: Complexity Analysis
    console.log('\n\n3. Testing Complexity Analysis...');
    console.log('─'.repeat(50));
    
    const complexity = await taskService.analyzeTaskComplexity(
      'Implement distributed microservices architecture with event sourcing',
      ['technical', 'domain', 'integration', 'scale']
    );
    
    console.log('Complexity Analysis:');
    console.log(`- Overall Score: ${complexity.overallScore}/10`);
    console.log(`- Risk Level: ${complexity.riskLevel}`);
    console.log('- Factor Scores:');
    Object.entries(complexity.factors).forEach(([factor, score]) => {
      console.log(`  ${factor}: ${score}/10`);
    });
    console.log('- Recommendations:');
    complexity.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });
    
    // Test 4: Intelligent Assignment
    console.log('\n\n4. Testing Intelligent Task Assignment...');
    console.log('─'.repeat(50));
    
    const assignments = await taskService.intelligentAssignTasks(
      taskIds,
      'skill_based',
      {
        requiredSkills: ['react', 'nodejs', 'websocket'],
        maxTasksPerAgent: 2
      }
    );
    
    console.log('Assignment Results:');
    assignments.forEach(assignment => {
      console.log(`- Task ${assignment.taskId} → Agent ${assignment.agentId}`);
      console.log(`  Reason: ${assignment.reason}`);
      console.log(`  Match Score: ${assignment.matchScore}/100`);
    });
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run tests
testSequentialThinking().catch(console.error);