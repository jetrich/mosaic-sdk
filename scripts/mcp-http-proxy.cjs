#!/usr/bin/env node

/**
 * MCP HTTP Proxy for OpenCode
 * Bridges HTTP requests to stdio MCP orchestrator
 */

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3457;

// Middleware
app.use(cors());
app.use(express.json());

// Active MCP processes
const mcpProcesses = new Map();

// Start MCP orchestrator process
function startMCPProcess() {
  const mcpProcess = spawn('node', [
    '/home/jwoltje/src/mosaic-sdk/packages/mcp-orchestrator/dist/main.js',
    'serve',
    '--stdio'
  ], {
    env: {
      ...process.env,
      MOSAIC_CONFIG: '/home/jwoltje/.config/mosaic/config.json',
      MOSAIC_DATA_DIR: '/home/jwoltje/.config/mosaic/data',
      NODE_ENV: 'development'
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let buffer = '';
  let initializeResponse = null;

  mcpProcess.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    lines.forEach(line => {
      if (line.trim() && !line.startsWith('{')) return; // Skip non-JSON
      try {
        const msg = JSON.parse(line);
        if (msg.id === 'init' && msg.result) {
          initializeResponse = msg;
        }
      } catch (e) {
        // Ignore non-JSON lines
      }
    });
  });

  mcpProcess.stderr.on('data', (data) => {
    console.error('MCP stderr:', data.toString());
  });

  // Initialize the MCP server
  const initRequest = {
    jsonrpc: '2.0',
    id: 'init',
    method: 'initialize',
    params: {
      protocolVersion: '0.1.0',
      capabilities: {
        tools: {}
      }
    }
  };

  mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n');

  return {
    process: mcpProcess,
    initialized: new Promise((resolve) => {
      const checkInit = setInterval(() => {
        if (initializeResponse) {
          clearInterval(checkInit);
          resolve(initializeResponse);
        }
      }, 100);
    })
  };
}

// Initialize a shared MCP process
const sharedMCP = startMCPProcess();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mcp: {
      connected: sharedMCP.process && !sharedMCP.process.killed
    }
  });
});

// Main MCP endpoint
app.post('/mcp', async (req, res) => {
  try {
    await sharedMCP.initialized;
    
    const request = {
      jsonrpc: '2.0',
      id: uuidv4(),
      method: req.body.method,
      params: req.body.params || {}
    };

    let responseReceived = false;
    let responseBuffer = '';

    const handleResponse = (data) => {
      responseBuffer += data.toString();
      const lines = responseBuffer.split('\n');
      responseBuffer = lines.pop() || '';
      
      lines.forEach(line => {
        if (line.trim() && !line.startsWith('{')) return;
        try {
          const msg = JSON.parse(line);
          if (msg.id === request.id) {
            responseReceived = true;
            res.json(msg);
          }
        } catch (e) {
          // Ignore
        }
      });
    };

    sharedMCP.process.stdout.on('data', handleResponse);
    
    // Send request
    sharedMCP.process.stdin.write(JSON.stringify(request) + '\n');

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!responseReceived) {
        sharedMCP.process.stdout.removeListener('data', handleResponse);
        res.status(504).json({
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32000,
            message: 'Request timeout'
          }
        });
      }
    }, 30000);

  } catch (error) {
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal error',
        data: error.message
      }
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`MCP HTTP Proxy listening on port ${PORT}`);
  console.log(`Proxying to: packages/mcp-orchestrator`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  if (sharedMCP.process) {
    sharedMCP.process.kill();
  }
  process.exit(0);
});