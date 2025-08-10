#!/usr/bin/env node

const { MCPServer } = require('./dist/server/MCPServer');
const { Logger } = require('./dist/utils/Logger');
const config = require('./dist/config/default.config');

async function testTools() {
  const logger = new Logger({ level: 'info' });
  
  try {
    // Create server instance
    const server = new MCPServer(config.default, logger);
    
    // Get tools from the server's tools map
    const tools = server.getTools();
    
    console.log('\n=== Available MCP Tools ===\n');
    
    // Group tools by category
    const categories = {};
    for (const [name, tool] of tools) {
      const category = name.split('_')[1] || 'other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push({ name, description: tool.description });
    }
    
    // Display tools by category
    for (const [category, toolList] of Object.entries(categories)) {
      console.log(`\n${category.toUpperCase()} Tools (${toolList.length}):`);
      console.log('─'.repeat(50));
      for (const tool of toolList) {
        console.log(`• ${tool.name}`);
        console.log(`  ${tool.description}`);
      }
    }
    
    console.log(`\nTotal tools: ${tools.size}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testTools();