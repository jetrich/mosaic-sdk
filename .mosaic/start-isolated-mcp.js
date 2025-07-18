#!/usr/bin/env node
// Simple MCP server starter for isolated environment

const { spawn } = require('child_process');
const path = require('path');

// Set environment variables
process.env.PORT = process.env.PORT || '3456';
process.env.DATABASE_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'data', 'mcp.db');
process.env.NODE_ENV = 'development';

console.log('Starting MosAIc MCP Server (Isolated)');
console.log('Port:', process.env.PORT);
console.log('Database:', process.env.DATABASE_PATH);

// Change to mosaic-mcp directory
process.chdir(path.join(__dirname, '..', 'mosaic-mcp'));

// Start the server
const server = spawn('node', ['dist/main.js'], {
    stdio: 'inherit',
    env: process.env
});

server.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

server.on('close', (code) => {
    console.log('Server exited with code:', code);
    process.exit(code);
});