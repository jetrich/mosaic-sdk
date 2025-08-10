#!/bin/bash
# Fix OpenCode configuration - Version 2 (MCP only)

echo "🔧 Fixing OpenCode configuration (MCP only)..."

# Backup existing config
if [ -f ~/.config/opencode/config.json ]; then
    cp ~/.config/opencode/config.json ~/.config/opencode/config.json.backup.$(date +%s)
    echo "📦 Backed up existing configuration"
fi

# Create minimal MCP-only configuration
cat > ~/.config/opencode/config.json << 'EOF'
{
  "mcp": {
    "mosaic": {
      "type": "local",
      "command": ["@mosaicstack/opencode-mcp"],
      "environment": {
        "MOSAIC_CONFIG": "~/.mosaic/config.json",
        "MOSAIC_DATA_DIR": "~/.mosaic/data",
        "MOSAIC_PROJECT_ROOT": "."
      }
    }
  }
}
EOF

echo "✅ Created minimal MCP-only OpenCode configuration"

# Also create project-specific config
cat > ./opencode.json << 'EOF'
{
  "mcp": {
    "mosaic": {
      "type": "local",
      "command": ["@mosaicstack/opencode-mcp"],
      "environment": {
        "MOSAIC_CONFIG": "~/.mosaic/config.json",
        "MOSAIC_DATA_DIR": "~/.mosaic/data",
        "MOSAIC_PROJECT_ROOT": "."
      }
    }
  }
}
EOF

echo "✅ Created project OpenCode configuration"

# Test the configuration
echo "🧪 Testing configuration..."
if opencode --help > /dev/null 2>&1; then
    echo "✅ OpenCode is working"
    echo ""
    echo "🚀 Ready to use! Try:"
    echo "   opencode                       # Start with MosAIc MCP tools"
    echo ""
    echo "📋 Available MosAIc tools (once OpenCode starts):"
    echo "   • mosaic_task_create - Create UPP tasks"
    echo "   • mosaic_task_assign - Assign tasks to agents"
    echo "   • mosaic_project_switch - Switch project context"
    echo "   • mosaic_project_list - List available projects"
    echo "   • mosaic_agent_spawn - Spawn specialized agents"
    echo "   • mosaic_agent_coordinate - Coordinate multi-agent tasks"
    echo ""
    echo "💡 Note: The MosAIc tools will be available through the MCP integration"
    echo "   You can ask Claude to use these tools for task management and agent coordination"
else
    echo "⚠️  OpenCode test failed. Make sure OpenCode is installed:"
    echo "   npm install -g opencode-ai@latest"
fi

echo ""
echo "🎯 Usage Tips:"
echo "   1. Start OpenCode in your project directory: opencode"
echo "   2. Ask Claude to create tasks: 'Use mosaic_task_create to create a new task'"
echo "   3. Coordinate agents: 'Use mosaic_agent_spawn to create a backend agent'"
echo "   4. Switch projects: 'Use mosaic_project_switch to change context'"