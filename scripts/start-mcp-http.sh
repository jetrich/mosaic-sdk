#!/bin/bash
# Start MCP Orchestrator in HTTP mode for OpenCode

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SDK_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ORCHESTRATOR_DIR="$SDK_ROOT/packages/mcp-orchestrator"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Starting MosAIc MCP Orchestrator in HTTP mode...${NC}"

# Check if already running
if lsof -ti:3456 > /dev/null 2>&1; then
    echo -e "${YELLOW}Port 3456 is already in use. Stopping existing process...${NC}"
    kill $(lsof -ti:3456) 2>/dev/null
    sleep 2
fi

# Start the server
cd "$ORCHESTRATOR_DIR"
echo -e "${GREEN}Starting HTTP server on port 3456...${NC}"
echo -e "${YELLOW}Server will run in foreground. Press Ctrl+C to stop.${NC}"
echo ""

node dist/main.js serve --http --port 3456