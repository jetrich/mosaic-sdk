#!/bin/bash
# Quick fix for OpenCode configuration issues

echo "🔧 Fixing OpenCode configuration..."

# Backup existing config
if [ -f ~/.config/opencode/config.json ]; then
    cp ~/.config/opencode/config.json ~/.config/opencode/config.json.backup.$(date +%s)
    echo "📦 Backed up existing configuration"
fi

# Create minimal working configuration
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
  },
  "modes": {
    "mosaic-plan": {
      "prompt": "You are using MosAIc planning mode with enterprise task management tools. Focus on UPP task decomposition and agent assignment.",
      "tools": {
        "mosaic_task_create": true,
        "mosaic_task_assign": true,
        "mosaic_project_switch": true,
        "mosaic_project_list": true,
        "todowrite": false,
        "bash": false,
        "edit": false,
        "write": false
      }
    },
    "mosaic-execute": {
      "prompt": "You are using MosAIc execution mode with full development capabilities. You can spawn agents, coordinate tasks, and perform development operations.",
      "tools": {
        "mosaic_task_create": true,
        "mosaic_task_assign": true,
        "mosaic_project_switch": true,
        "mosaic_project_list": true,
        "mosaic_agent_spawn": true,
        "mosaic_agent_coordinate": true,
        "todowrite": true,
        "bash": true,
        "edit": true,
        "write": true,
        "read": true,
        "glob": true,
        "grep": true
      }
    }
  }
}
EOF

echo "✅ Created minimal OpenCode configuration"

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
  },
  "modes": {
    "mosaic-plan": {
      "prompt": "You are using MosAIc planning mode with enterprise task management tools. Focus on UPP task decomposition and agent assignment.",
      "tools": {
        "mosaic_task_create": true,
        "mosaic_task_assign": true,
        "mosaic_project_switch": true,
        "mosaic_project_list": true,
        "todowrite": false,
        "bash": false,
        "edit": false,
        "write": false
      }
    },
    "mosaic-execute": {
      "prompt": "You are using MosAIc execution mode with full development capabilities. You can spawn agents, coordinate tasks, and perform development operations.",
      "tools": {
        "mosaic_task_create": true,
        "mosaic_task_assign": true,
        "mosaic_project_switch": true,
        "mosaic_project_list": true,
        "mosaic_agent_spawn": true,
        "mosaic_agent_coordinate": true,
        "todowrite": true,
        "bash": true,
        "edit": true,
        "write": true,
        "read": true,
        "glob": true,
        "grep": true
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
    echo "   opencode --mode mosaic-plan    # For planning mode"
    echo "   opencode --mode mosaic-execute # For execution mode"
    echo "   opencode                       # Default mode"
else
    echo "⚠️  OpenCode test failed. Make sure OpenCode is installed:"
    echo "   npm install -g opencode-ai@latest"
fi

echo ""
echo "📋 Available MosAIc tools:"
echo "   • mosaic_task_create - Create UPP tasks"
echo "   • mosaic_task_assign - Assign tasks to agents"
echo "   • mosaic_project_switch - Switch project context"
echo "   • mosaic_agent_spawn - Spawn specialized agents"
echo "   • mosaic_agent_coordinate - Coordinate multi-agent tasks"