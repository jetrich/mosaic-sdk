#!/usr/bin/env node
/**
 * Test MCP Server functionality
 * This script tests the MosAIc MCP server by sending commands via stdio
 */

const { spawn } = require('child_process');
const path = require('path');

// MCP server path
const mcpServerPath = path.join(__dirname, '../../..', 'mosaic-mcp', 'dist', 'main.js');
const dbPath = path.join(__dirname, '../../..', '.mosaic', 'data', 'mcp.db');

console.log('🧪 Testing MosAIc MCP Server');
console.log('Server:', mcpServerPath);
console.log('Database:', dbPath);
console.log('');

// Start MCP server
const mcp = spawn('node', [mcpServerPath], {
  env: {
    ...process.env,
    DATABASE_PATH: dbPath,
    NODE_ENV: 'development'
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

// Handle server output
mcp.stdout.on('data', (data) => {
  console.log('📥 Server:', data.toString().trim());
});

mcp.stderr.on('data', (data) => {
  console.error('❌ Error:', data.toString().trim());
});

mcp.on('error', (err) => {
  console.error('💥 Failed to start server:', err);
  process.exit(1);
});

mcp.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

// Send a test initialize request
setTimeout(() => {
  console.log('\n📤 Sending initialize request...');
  const initRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "0.1.0",
      capabilities: {},
      clientInfo: {
        name: "mosaic-test-client",
        version: "1.0.0"
      }
    }
  };
  
  mcp.stdin.write(JSON.stringify(initRequest) + '\n');
}, 1000);

// Send a tools list request after initialization
setTimeout(() => {
  console.log('\n📤 Sending tools/list request...');
  const toolsRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  };
  
  mcp.stdin.write(JSON.stringify(toolsRequest) + '\n');
}, 2000);

// Close after testing
setTimeout(() => {
  console.log('\n✅ Test complete, closing connection...');
  mcp.stdin.end();
}, 3000);