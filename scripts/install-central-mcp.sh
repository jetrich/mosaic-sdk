#!/bin/bash

#
# MosAIc MCP Central Installation Script
# 
# Installs the consolidated MCP server to ~/.config/mosaic for system-wide access
# This script will be integrated into the npm package installation process
#

set -e

echo "🚀 Installing MosAIc MCP Server (Central Installation)"
echo "======================================================"

# Configuration
MOSAIC_HOME="$HOME/.config/mosaic"
MOSAIC_BIN="$MOSAIC_HOME/bin"
MOSAIC_MCP_SERVER="$MOSAIC_HOME/mcp-server"
MOSAIC_DATA="$MOSAIC_HOME/data"
MOSAIC_LOGS="$MOSAIC_HOME/logs" 
MOSAIC_CONFIG="$MOSAIC_HOME/config"

# Create directory structure
echo "📁 Creating MosAIc directory structure..."
mkdir -p "$MOSAIC_BIN" "$MOSAIC_DATA" "$MOSAIC_LOGS" "$MOSAIC_CONFIG"

# Determine source directory (for npm package vs local development)
if [ -n "$npm_config_prefix" ]; then
    # Running from npm install
    SOURCE_DIR="$npm_config_prefix/lib/node_modules/@mosaicstack/mcp"
    echo "📦 Installing from npm package: $SOURCE_DIR"
else
    # Running from local development
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    SOURCE_DIR="$(dirname "$SCRIPT_DIR")/packages/mcp-server"
    echo "🔧 Installing from local development: $SOURCE_DIR"
fi

# Verify source exists
if [ ! -f "$SOURCE_DIR/package.json" ]; then
    echo "❌ Error: Source directory not found or invalid: $SOURCE_DIR"
    exit 1
fi

# Install MCP server files
echo "📋 Installing MCP server files..."
if [ -d "$MOSAIC_MCP_SERVER" ]; then
    echo "   Removing existing installation..."
    rm -rf "$MOSAIC_MCP_SERVER"
fi

echo "   Copying server files..."
cp -r "$SOURCE_DIR" "$MOSAIC_MCP_SERVER"

# Install planning plugin alongside MCP server
PLANNING_PLUGIN_SOURCE="$(dirname "$SOURCE_DIR")/planning-plugin"
if [ -d "$PLANNING_PLUGIN_SOURCE" ]; then
    echo "📋 Installing planning plugin..."
    cp -r "$PLANNING_PLUGIN_SOURCE" "$MOSAIC_MCP_SERVER/planning-plugin"
    echo "   Planning plugin installed at: $MOSAIC_MCP_SERVER/planning-plugin"
else
    echo "⚠️  Planning plugin not found at: $PLANNING_PLUGIN_SOURCE"
fi

# Create startup script
echo "📝 Creating startup script..."
cat > "$MOSAIC_BIN/mosaic-mcp-server" << 'EOF'
#!/usr/bin/env node

/**
 * MosAIc MCP Server - Central Installation
 * 
 * This is the centrally installed consolidated MCP server that provides
 * task management, project coordination, and agent orchestration tools
 * for all MosAIc projects system-wide.
 */

const path = require('path');

// Set up paths for central installation
const serverPath = path.join(__dirname, '..', 'mcp-server', 'dist', 'main.js');
const configPath = process.env.MOSAIC_CONFIG || path.join(process.env.HOME, '.config', 'mosaic', 'config.json');
const dataPath = process.env.MOSAIC_DATA_DIR || path.join(process.env.HOME, '.config', 'mosaic', 'data');

// Ensure environment variables are set for central installation
process.env.MOSAIC_CONFIG = configPath;
process.env.MOSAIC_DATA_DIR = dataPath;

// Default database path for central installation
if (!process.env.DATABASE_PATH) {
  process.env.DATABASE_PATH = path.join(dataPath, 'mcp.db');
}

// Default port for MCP server
if (!process.env.MCP_PORT) {
  process.env.MCP_PORT = '3456';
}

// Log startup info
console.log('Starting MosAIc MCP Server (Central Installation)');
console.log('Server Path:', serverPath);
console.log('Config Path:', configPath);
console.log('Data Path:', dataPath);
console.log('Database Path:', process.env.DATABASE_PATH);
console.log('Port:', process.env.MCP_PORT);

// Execute the main server
try {
  require(serverPath);
} catch (error) {
  console.error('Failed to start MosAIc MCP Server:', error);
  process.exit(1);
}
EOF

chmod +x "$MOSAIC_BIN/mosaic-mcp-server"

# Create default configuration if it doesn't exist
if [ ! -f "$MOSAIC_CONFIG/config.json" ]; then
    echo "⚙️  Creating default configuration..."
    cat > "$MOSAIC_CONFIG/config.json" << 'EOF'
{
  "version": "1.0.0",
  "transport": {
    "type": "stdio",
    "timeout": 30000
  },
  "database": {
    "path": "~/.config/mosaic/data/mcp.db"
  },
  "logging": {
    "level": "info",
    "structured": false,
    "console": true,
    "file": "~/.config/mosaic/logs/mcp-server.log"
  },
  "projects": {
    "defaultPath": "~/src"
  },
  "agents": {
    "maxConcurrent": 5,
    "defaultTimeout": 300000
  },
  "tools": {
    "sequentialThinking": {
      "enabled": true,
      "maxDepth": 6,
      "timeout": 60000
    }
  },
  "cache": {
    "enabled": true,
    "ttl": 3600,
    "maxSize": 1000
  }
}
EOF
fi

# Test installation
echo "🧪 Testing installation..."
if "$MOSAIC_BIN/mosaic-mcp-server" --version &>/dev/null; then
    echo "✅ Installation successful!"
else
    echo "⚠️  Installation completed with warnings (server may not respond to --version)"
fi

# Print usage information
echo ""
echo "📖 Usage Information:"
echo "   Central MCP Server: $MOSAIC_BIN/mosaic-mcp-server"
echo "   Configuration: $MOSAIC_CONFIG/config.json"
echo "   Data Directory: $MOSAIC_DATA"
echo "   Logs Directory: $MOSAIC_LOGS"
echo ""
echo "🔧 Claude Code Configuration:"
echo "   Add to ~/.claude.json mcpServers section:"
echo "   {"
echo "     \"mosaic\": {"
echo "       \"command\": \"$MOSAIC_BIN/mosaic-mcp-server\","
echo "       \"args\": [\"serve\", \"--stdio\"],"
echo "       \"env\": {"
echo "         \"MCP_PORT\": \"3456\","
echo "         \"MOSAIC_CONFIG\": \"$MOSAIC_CONFIG/config.json\""
echo "       }"
echo "     }"
echo "   }"
echo ""
echo "✅ MosAIc MCP Central Installation Complete!"