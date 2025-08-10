#!/bin/bash

# Install MCP Ollama packages to user config (simulated production installation)
# This simulates what would happen when the package is officially released

echo "🚀 Installing MCP Ollama packages to user config..."
echo "=================================================="

USER_CONFIG_DIR="$HOME/.config/mosaic/packages/mcp-ollama/src"
SOURCE_DIR="./packages/mcp-ollama/src"

# Create directory structure
echo "📁 Creating package directory structure..."
mkdir -p "$USER_CONFIG_DIR"/{schemas,utils,qa}

# Copy package files
echo "📋 Installing structured output system..."
cp "$SOURCE_DIR/schemas/structured-output.js" "$USER_CONFIG_DIR/schemas/"

echo "💾 Installing atomic file operations..."
cp "$SOURCE_DIR/utils/atomic-file-ops.js" "$USER_CONFIG_DIR/utils/"

echo "🏆 Installing QA validation pipeline..."
cp "$SOURCE_DIR/qa/validation-pipeline.js" "$USER_CONFIG_DIR/qa/"

# Verify installation
echo ""
echo "🔍 Verifying installation..."
if [ -f "$USER_CONFIG_DIR/schemas/structured-output.js" ] && \
   [ -f "$USER_CONFIG_DIR/utils/atomic-file-ops.js" ] && \
   [ -f "$USER_CONFIG_DIR/qa/validation-pipeline.js" ]; then
    echo "✅ All packages installed successfully!"
    echo ""
    echo "📁 Package structure:"
    echo "   ~/.config/mosaic/packages/mcp-ollama/src/"
    echo "   ├── schemas/structured-output.js"
    echo "   ├── utils/atomic-file-ops.js"
    echo "   └── qa/validation-pipeline.js"
    echo ""
    echo "🎯 MCP server will now work in fresh sessions"
    echo "🔧 Structured generation with truncation fix is ready"
    echo ""
    echo "💡 To test: use the 'generate_structured' tool in your MCP client"
else
    echo "❌ Installation failed - some files missing"
    exit 1
fi

echo "✨ Installation complete!"