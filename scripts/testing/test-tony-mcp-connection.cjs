#!/usr/bin/env node
/**
 * Test script to verify Tony can connect to MCP HTTP server
 */

const http = require('http');

// Test 1: Health Check
function testHealthCheck() {
  console.log('🔍 Testing health endpoint...');
  
  http.get('http://localhost:3456/health', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const health = JSON.parse(data);
        console.log('✅ Health check passed:', health);
      } catch (e) {
        console.error('❌ Health check failed:', e);
      }
    });
  }).on('error', (err) => {
    console.error('❌ Connection failed:', err.message);
  });
}

// Test 2: MCP Protocol Test
function testMCPProtocol() {
  console.log('\n🔍 Testing MCP endpoint...');
  
  const postData = JSON.stringify({
    jsonrpc: '2.0',
    method: 'initialize',
    params: {
      protocolVersion: '0.1.0',
      capabilities: {
        tools: {},
        prompts: {}
      },
      clientInfo: {
        name: 'tony-test-client',
        version: '1.0.0'
      }
    },
    id: 1
  });

  const options = {
    hostname: 'localhost',
    port: 3456,
    path: '/mcp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Accept': 'application/json, text/event-stream'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`📡 Status Code: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        // Parse SSE format
        const lines = data.trim().split('\n');
        let jsonData = null;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('data: ')) {
            jsonData = JSON.parse(lines[i].substring(6));
            break;
          }
        }
        
        if (jsonData) {
          console.log('✅ MCP response:', JSON.stringify(jsonData, null, 2));
        } else {
          console.log('Raw SSE response:', data);
        }
        
        // Extract session ID if present
        const sessionId = res.headers['mcp-session-id'];
        if (sessionId) {
          console.log(`🔑 Session ID: ${sessionId}`);
          testWithSession(sessionId);
        }
      } catch (e) {
        console.error('❌ MCP test failed:', e);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Connection error:', e.message);
  });

  req.write(postData);
  req.end();
}

// Test 3: Session Management
function testWithSession(sessionId) {
  console.log('\n🔍 Testing with session ID...');
  
  const postData = JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/list',
    params: {},
    id: 2
  });

  const options = {
    hostname: 'localhost',
    port: 3456,
    path: '/mcp',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Accept': 'application/json, text/event-stream',
      'mcp-session-id': sessionId
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        // Parse SSE format
        const lines = data.trim().split('\n');
        let jsonData = null;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('data: ')) {
            jsonData = JSON.parse(lines[i].substring(6));
            break;
          }
        }
        
        if (jsonData) {
          console.log('✅ Tools list:', JSON.stringify(jsonData, null, 2));
        } else {
          console.log('Raw SSE response:', data);
        }
      } catch (e) {
        console.error('❌ Session test failed:', e);
        console.log('Raw response:', data);
      }
    });
  });

  req.write(postData);
  req.end();
}

// Test 4: Check active sessions
function testSessionsEndpoint() {
  console.log('\n🔍 Checking active sessions...');
  
  http.get('http://localhost:3456/sessions', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const sessions = JSON.parse(data);
        console.log('✅ Active sessions:', sessions);
      } catch (e) {
        console.error('❌ Sessions check failed:', e);
      }
    });
  });
}

// Run tests
console.log('🧪 Testing Tony MCP HTTP Connection\n');
testHealthCheck();

setTimeout(() => {
  testMCPProtocol();
}, 1000);

setTimeout(() => {
  testSessionsEndpoint();
}, 3000);

setTimeout(() => {
  console.log('\n✅ Tests completed!');
  process.exit(0);
}, 5000);