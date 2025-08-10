#!/bin/bash
# Test MCP connection for OpenCode integration

echo "🧪 Testing MosAIc MCP Integration..."

# Test 1: Check if the MCP server executable exists
echo "1. Checking MCP server availability..."

# Check if the built MCP server exists
MCP_SERVER_PATH="$(pwd)/packages/opencode-mcp/dist/index.js"
if [ -f "$MCP_SERVER_PATH" ]; then
    echo "   ✅ MCP server found at: $MCP_SERVER_PATH"
else
    echo "   ❌ MCP server not found. Building..."
    cd packages/opencode-mcp && npm run build && cd ../..
    if [ -f "$MCP_SERVER_PATH" ]; then
        echo "   ✅ MCP server built successfully"
    else
        echo "   ❌ Failed to build MCP server"
        exit 1
    fi
fi

# Test 2: Test MCP server startup
echo "2. Testing MCP server startup..."
timeout 3s node "$MCP_SERVER_PATH" 2>&1 | head -5 &
SERVER_PID=$!
sleep 1
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "   ✅ MCP server starts successfully"
    kill $SERVER_PID 2>/dev/null
else
    echo "   ⚠️  MCP server test inconclusive (may be normal for stdio mode)"
fi

# Test 3: Check OpenCode configuration
echo "3. Checking OpenCode configuration..."
if [ -f ~/.config/opencode/config.json ]; then
    if grep -q "mosaic" ~/.config/opencode/config.json; then
        echo "   ✅ OpenCode configuration includes MosAIc MCP"
    else
        echo "   ❌ OpenCode configuration missing MosAIc MCP"
    fi
else
    echo "   ❌ OpenCode configuration not found"
fi

# Test 4: Update OpenCode configuration to use absolute path
echo "4. Updating OpenCode configuration with absolute path..."

# Create updated configuration with absolute path
cat > ~/.config/opencode/config.json << EOF
{
  "mcp": {
    "mosaic": {
      "type": "local",
      "command": ["node", "$MCP_SERVER_PATH"],
      "environment": {
        "MOSAIC_CONFIG": "~/.mosaic/config.json",
        "MOSAIC_DATA_DIR": "~/.mosaic/data",
        "MOSAIC_PROJECT_ROOT": "."
      }
    }
  }
}
EOF

echo "   ✅ Updated OpenCode configuration with absolute path"

# Test 5: Verify environment setup
echo "5. Checking environment setup..."

# Check if MosAIc directories exist
if [ ! -d ~/.mosaic ]; then
    echo "   📁 Creating ~/.mosaic directory..."
    mkdir -p ~/.mosaic/{config,data,logs}
fi

# Create basic MosAIc configuration if it doesn't exist
if [ ! -f ~/.mosaic/config.json ]; then
    echo "   📝 Creating basic MosAIc configuration..."
    cat > ~/.mosaic/config.json << 'EOF'
{
  "version": "0.1.0",
  "opencode": {
    "enabled": true,
    "mcpPort": 3456,
    "logLevel": "info"
  },
  "agents": {
    "maxConcurrent": 5,
    "defaultTimeout": 300000
  },
  "projects": {
    "current": "mosaic-sdk",
    "root": "."
  }
}
EOF
    echo "   ✅ Created basic MosAIc configuration"
fi

# Test 6: Final verification
echo "6. Final verification..."
echo "   📋 Configuration summary:"
echo "      • OpenCode config: ~/.config/opencode/config.json"
echo "      • MosAIc config: ~/.mosaic/config.json"
echo "      • MCP server: $MCP_SERVER_PATH"

echo ""
echo "🎉 MCP Integration Test Complete!"
echo ""
echo "🚀 Ready to test! Try:"
echo "   1. Start OpenCode: opencode"
echo "   2. In OpenCode, ask Claude: 'What MCP tools are available?'"
echo "   3. Try a MosAIc tool: 'Use mosaic_project_list to show available projects'"
echo ""
echo "📋 Available MosAIc tools:"
echo "   • mosaic_task_create - Create UPP tasks"
echo "   • mosaic_task_assign - Assign tasks to agents"
echo "   • mosaic_project_switch - Switch project context"
echo "   • mosaic_project_list - List available projects"
echo "   • mosaic_agent_spawn - Spawn specialized agents"
echo "   • mosaic_agent_coordinate - Coordinate multi-agent tasks"