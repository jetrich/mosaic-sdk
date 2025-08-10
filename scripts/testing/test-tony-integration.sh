#!/bin/bash
# Test Tony integration with HTTP MCP server

echo "🧪 Testing Tony Integration with MCP"
echo "===================================="

# Ensure MCP is running
if ! curl -s http://localhost:3456/health >/dev/null 2>&1; then
    echo "❌ MCP server is not running on port 3456"
    echo "Run: npm run dev:start"
    exit 1
fi

echo "✅ MCP server is running"

# Test Tony connection using environment variables
export TONY_MCP_HOST=localhost
export TONY_MCP_PORT=3456
export TONY_MCP_PROTOCOL=http

# Navigate to Tony directory and run test
cd ~/.tony

echo ""
echo "🔍 Testing Tony MCP client connection..."
if [ -f "test-standalone.sh" ]; then
    ./test-standalone.sh
else
    echo "Running direct test..."
    node -e "
    const { MCPClient } = require('./dist/core/mcp/mcp-client.js');
    const { getConfigManager } = require('./dist/core/mcp/config.js');
    
    async function test() {
        try {
            console.log('Creating MCP client...');
            const configManager = getConfigManager();
            const client = new MCPClient(configManager.getMCPClientConfig());
            
            console.log('Connecting to MCP server...');
            await client.connect();
            
            console.log('✅ Successfully connected to MCP!');
            
            // Test getting project list
            console.log('\\nTesting project list...');
            const projects = await client.request('tony_project_list', {});
            console.log('Projects:', projects);
            
            await client.disconnect();
            console.log('\\n✅ Test completed successfully!');
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            process.exit(1);
        }
    }
    
    test();
    "
fi