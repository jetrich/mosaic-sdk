#!/bin/bash

# Configure mosaic-thinking MCP at user level
# This script updates ~/.claude/mcp.json to include the mosaic-thinking MCP

echo "🔧 Configuring mosaic-thinking MCP at user level..."

# User-level MCP configuration paths
CLAUDE_CONFIG_DIR="$HOME/.claude"
MCP_CONFIG_FILE="$CLAUDE_CONFIG_DIR/mcp.json"
BACKUP_FILE="$MCP_CONFIG_FILE.backup.$(date +%Y%m%d-%H%M%S)"

# Create .claude directory if it doesn't exist
mkdir -p "$CLAUDE_CONFIG_DIR"

# Backup existing config if it exists
if [ -f "$MCP_CONFIG_FILE" ]; then
    echo "📋 Backing up existing MCP config to: $BACKUP_FILE"
    cp "$MCP_CONFIG_FILE" "$BACKUP_FILE"
fi

# Check if mosaic-thinking is already configured
if [ -f "$MCP_CONFIG_FILE" ] && grep -q "mosaic-thinking" "$MCP_CONFIG_FILE"; then
    echo "✅ mosaic-thinking MCP already configured"
    cat "$MCP_CONFIG_FILE"
    exit 0
fi

# Create or update MCP configuration
echo "📝 Adding mosaic-thinking MCP to user configuration..."

# If config doesn't exist, create new one
if [ ! -f "$MCP_CONFIG_FILE" ]; then
    cat > "$MCP_CONFIG_FILE" << 'EOF'
{
  "mcpServers": {
    "mosaic-thinking": {
      "command": "node",
      "args": ["~/.config/mosaic/mcp-servers/mosaic-thinking/server.js"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
EOF
else
    # Add to existing config using jq if available, or manual editing
    if command -v jq >/dev/null 2>&1; then
        echo "Using jq to update configuration..."
        
        # Create temporary config with mosaic-thinking added
        jq '.mcpServers["mosaic-thinking"] = {
          "command": "node",
          "args": ["~/.config/mosaic/mcp-servers/mosaic-thinking/server.js"],
          "env": {
            "NODE_ENV": "development"
          }
        }' "$MCP_CONFIG_FILE" > "${MCP_CONFIG_FILE}.tmp"
        
        mv "${MCP_CONFIG_FILE}.tmp" "$MCP_CONFIG_FILE"
    else
        echo "⚠️ jq not available, manual configuration required"
        echo "Please add this to your $MCP_CONFIG_FILE:"
        echo ""
        echo '"mosaic-thinking": {'
        echo '  "command": "node",'
        echo '  "args": ["~/.config/mosaic/mcp-servers/mosaic-thinking/server.js"],'
        echo '  "env": {'
        echo '    "NODE_ENV": "development"'
        echo '  }'
        echo '}'
        echo ""
        exit 1
    fi
fi

echo ""
echo "✅ mosaic-thinking MCP configured successfully!"
echo ""
echo "📁 Configuration file: $MCP_CONFIG_FILE"
echo "📝 Configuration content:"
cat "$MCP_CONFIG_FILE"
echo ""
echo "🔄 Next steps:"
echo "1. Restart your Claude Code session"
echo "2. Reconnect to MCP (/mcp command)"
echo "3. Use think_local, think_hybrid, or think_remote tools"
echo ""
echo "🧠 Available thinking tools:"
echo "  • think_local  - Fast Ollama-only thinking"
echo "  • think_hybrid - Structured + Ollama content" 
echo "  • think_remote - Sequential-thinking + Claude"