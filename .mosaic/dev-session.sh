#!/bin/bash
# Source this file to use MosAIc in this directory only

# Set MosAIc-specific environment
export CLAUDE_CONFIG_DIR="$(pwd)/.mosaic/claude"
export TONY_WORKSPACE="$(pwd)"
export MCP_REQUIRED=true
export MCP_URL="http://localhost:3456"

# Create an alias for isolated Claude/Tony usage
alias mosaic-claude='CLAUDE_CONFIG_DIR="$(pwd)/.mosaic/claude" claude'
alias mosaic-tony='TONY_WORKSPACE="$(pwd)" CLAUDE_CONFIG_DIR="$(pwd)/.mosaic/claude" tony'

echo "MosAIc development environment activated!"
echo "Use 'mosaic-claude' or 'mosaic-tony' for isolated usage"
echo "Regular 'claude' and 'tony' commands remain unaffected"
