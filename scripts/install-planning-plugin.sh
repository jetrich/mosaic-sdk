#!/bin/bash

#
# MosAIc Planning Plugin Installation Script
# 
# Installs the planning plugin to ~/.config/mosaic/plugins/planning-plugin
# This includes the environment configuration loader and planning agents
#

set -e

echo "🚀 Installing MosAIc Planning Plugin"
echo "===================================="

# Configuration
MOSAIC_HOME="$HOME/.config/mosaic"
PLUGIN_DIR="$MOSAIC_HOME/plugins/planning-plugin"
SOURCE_DIR="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")/packages/planning-plugin"

# Create directory structure
echo "📁 Creating plugin directory structure..."
mkdir -p "$PLUGIN_DIR"

# Verify source exists and is built
if [ ! -f "$SOURCE_DIR/package.json" ]; then
    echo "❌ Error: Planning plugin source not found: $SOURCE_DIR"
    exit 1
fi

if [ ! -d "$SOURCE_DIR/dist" ]; then
    echo "📋 Building planning plugin..."
    cd "$SOURCE_DIR"
    npm run build
    cd - > /dev/null
fi

# Install plugin files
echo "📋 Installing planning plugin files..."
if [ -d "$PLUGIN_DIR" ]; then
    echo "   Removing existing plugin installation..."
    rm -rf "$PLUGIN_DIR"
fi

echo "   Copying plugin files..."
cp -r "$SOURCE_DIR" "$PLUGIN_DIR"

# Verify critical components were installed
echo "🔍 Verifying installation..."
CRITICAL_FILES=(
    "$PLUGIN_DIR/dist/config/environment-loader.js"
    "$PLUGIN_DIR/src/agents/upp-business-planner-local.js"
    "$PLUGIN_DIR/src/config/environment-loader.ts"
)

MISSING_FILES=()
for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo "❌ Installation incomplete. Missing files:"
    for file in "${MISSING_FILES[@]}"; do
        echo "   - $file"
    done
    exit 1
fi

echo "✅ Planning Plugin Installation Complete!"
echo ""
echo "📁 Plugin Location: $PLUGIN_DIR"
echo "🔧 Environment Configuration: $PLUGIN_DIR/dist/config/environment-loader.js"
echo "🤖 Planning Agents: $PLUGIN_DIR/src/agents/"
echo ""
echo "💡 The planning plugin is now available for the MCP server to use."
echo "   Environment variables from .claude.json should now be processed correctly."