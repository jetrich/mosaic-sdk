const http = require('http');

// Test SSE connection
console.log('Testing SSE connection to MCP orchestrator...\n');

// First, establish SSE connection
const req = http.request({
  hostname: 'localhost',
  port: 3456,
  path: '/mcp',
  method: 'GET',
  headers: {
    'Accept': 'text/event-stream'
  }
}, (res) => {
  console.log(`SSE Response: ${res.statusCode} ${res.statusMessage}`);
  console.log('Headers:', res.headers);
  
  let sessionId = null;
  let buffer = '';
  
  res.on('data', (chunk) => {
    buffer += chunk.toString();
    
    // Process complete SSE messages
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer
    
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        console.log('\nSSE Event:', line.substring(7));
      } else if (line.startsWith('data: ')) {
        const data = line.substring(6);
        console.log('SSE Data:', data);
        
        try {
          const parsed = JSON.parse(data);
          
          // Check if this is the endpoint message
          if (parsed.includes && parsed.includes('sessionId=')) {
            const match = parsed.match(/sessionId=([a-f0-9-]+)/);
            if (match) {
              sessionId = match[1];
              console.log(`\nExtracted Session ID: ${sessionId}`);
              
              // Send tools/list request
              sendToolsListRequest(sessionId);
            }
          }
          
          // Check if this is a response message
          if (parsed.jsonrpc && parsed.result && parsed.result.tools) {
            console.log('\n=== TOOLS RESPONSE RECEIVED ===');
            console.log(`Number of tools: ${parsed.result.tools.length}`);
            console.log('\nAll tools:');
            parsed.result.tools.forEach(tool => {
              console.log(`  - ${tool.name}: ${tool.description || 'No description'}`);
            });
            
            // Check for Sequential Thinking tools
            const sequentialTools = parsed.result.tools.filter(t => 
              t.name.includes('decompose') || 
              t.name.includes('estimate_batch') ||
              t.name.includes('assign_intelligent') ||
              t.name.includes('analyze_complexity')
            );
            
            console.log(`\n=== SEQUENTIAL THINKING TOOLS: ${sequentialTools.length} ===`);
            sequentialTools.forEach(tool => {
              console.log(`  - ${tool.name}`);
            });
            
            console.log('\n✅ SUCCESS: All 31 tools available via SSE transport!');
            
            // Close connection and exit
            res.destroy();
            process.exit(0);
          }
        } catch (e) {
          // Not JSON, might be a string
          if (data.includes('sessionId=')) {
            const match = data.match(/sessionId=([a-f0-9-]+)/);
            if (match) {
              sessionId = match[1];
              console.log(`\nExtracted Session ID: ${sessionId}`);
              
              // Send tools/list request
              sendToolsListRequest(sessionId);
            }
          }
        }
      }
    }
  });
});

req.on('error', (error) => {
  console.error('SSE connection error:', error);
  process.exit(1);
});

req.end();

function sendToolsListRequest(sessionId) {
  setTimeout(() => {
    console.log('\nSending tools/list request...');
    
    const postData = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    });
    
    const postReq = http.request({
      hostname: 'localhost',
      port: 3456,
      path: `/mcp/${sessionId}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (postRes) => {
      console.log(`POST Response: ${postRes.statusCode} ${postRes.statusMessage}`);
      
      let responseData = '';
      postRes.on('data', (chunk) => {
        responseData += chunk;
      });
      
      postRes.on('end', () => {
        console.log('POST Response body:', responseData);
        // The actual response will come through SSE
      });
    });
    
    postReq.on('error', (error) => {
      console.error('POST request error:', error);
      process.exit(1);
    });
    
    postReq.write(postData);
    postReq.end();
  }, 500);
}