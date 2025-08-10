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
  
  res.on('data', (chunk) => {
    const data = chunk.toString();
    console.log('\nSSE Data received:');
    console.log(data);
    
    // Extract session ID from the data
    const match = data.match(/sessionId=([a-f0-9-]+)/);
    if (match) {
      sessionId = match[1];
      console.log(`\nSession ID: ${sessionId}`);
      
      // Now send a tools/list request
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
          console.log(`\nPOST Response: ${postRes.statusCode} ${postRes.statusMessage}`);
          
          let responseData = '';
          postRes.on('data', (chunk) => {
            responseData += chunk;
          });
          
          postRes.on('end', () => {
            try {
              const response = JSON.parse(responseData);
              console.log('\nTools response received!');
              console.log(`Number of tools: ${response.result?.tools?.length || 0}`);
              
              if (response.result?.tools) {
                console.log('\nAvailable tools:');
                response.result.tools.forEach(tool => {
                  console.log(`  - ${tool.name}`);
                });
                
                // Check for Sequential Thinking tools
                const sequentialTools = response.result.tools.filter(t => 
                  t.name.includes('decompose') || 
                  t.name.includes('estimate_batch') ||
                  t.name.includes('assign_intelligent') ||
                  t.name.includes('analyze_complexity')
                );
                
                console.log(`\nSequential Thinking tools found: ${sequentialTools.length}`);
                sequentialTools.forEach(tool => {
                  console.log(`  - ${tool.name}: ${tool.description}`);
                });
              }
              
              // Close the SSE connection
              res.destroy();
              process.exit(0);
            } catch (error) {
              console.error('Error parsing response:', error);
              console.error('Raw response:', responseData);
              process.exit(1);
            }
          });
        });
        
        postReq.on('error', (error) => {
          console.error('POST request error:', error);
          process.exit(1);
        });
        
        postReq.write(postData);
        postReq.end();
      }, 1000);
    }
  });
});

req.on('error', (error) => {
  console.error('SSE connection error:', error);
  process.exit(1);
});

req.end();