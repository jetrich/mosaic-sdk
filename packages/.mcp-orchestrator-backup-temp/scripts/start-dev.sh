#!/bin/bash
# Development startup script for MosAIc MCP Orchestrator with Sequential Thinking

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SDK_ROOT="$(cd "$PROJECT_ROOT/../.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting MosAIc MCP Orchestrator Development Environment${NC}"

# Check if build exists
if [ ! -d "$PROJECT_ROOT/dist" ]; then
    echo -e "${YELLOW}Building mcp-orchestrator...${NC}"
    cd "$PROJECT_ROOT"
    npm run build
fi

# Ensure config directory exists
mkdir -p ~/.config/mosaic/data

# Check for Sequential Thinking server
if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx not found. Please install Node.js${NC}"
    exit 1
fi

# Start mode selection
MODE=${1:-stdio}

case $MODE in
    stdio)
        echo -e "${GREEN}Starting in STDIO mode (for Claude Code)${NC}"
        cd "$PROJECT_ROOT"
        node dist/main.js serve --stdio
        ;;
    http)
        echo -e "${GREEN}Starting in HTTP mode on port 3456${NC}"
        cd "$PROJECT_ROOT"
        node dist/main.js serve --http --port 3456
        ;;
    dual)
        echo -e "${GREEN}Starting both STDIO and HTTP modes${NC}"
        # Start HTTP server in background
        cd "$PROJECT_ROOT"
        node dist/main.js serve --http --port 3456 &
        HTTP_PID=$!
        echo "HTTP server started with PID: $HTTP_PID"
        
        # Start STDIO server in foreground
        node dist/main.js serve --stdio
        
        # Cleanup on exit
        trap "kill $HTTP_PID 2>/dev/null" EXIT
        ;;
    *)
        echo -e "${RED}Unknown mode: $MODE${NC}"
        echo "Usage: $0 [stdio|http|dual]"
        exit 1
        ;;
esac