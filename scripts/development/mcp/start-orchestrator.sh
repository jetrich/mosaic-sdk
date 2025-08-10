#!/bin/bash
# Start MosAIc MCP Orchestrator with Sequential Thinking support
# Works for both Claude Code and OpenCode

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SDK_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
ORCHESTRATOR_DIR="$SDK_ROOT/packages/mcp-orchestrator"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        MosAIc MCP Orchestrator with Sequential Thinking    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo

# Check dependencies
echo -e "${YELLOW}Checking dependencies...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

# Check if Sequential Thinking is installed
if ! npm list @modelcontextprotocol/server-sequential-thinking &> /dev/null; then
    echo -e "${YELLOW}Installing Sequential Thinking MCP server...${NC}"
    npm install -g @modelcontextprotocol/server-sequential-thinking
fi

# Build orchestrator if needed
if [ ! -d "$ORCHESTRATOR_DIR/dist" ]; then
    echo -e "${YELLOW}Building MCP orchestrator...${NC}"
    cd "$ORCHESTRATOR_DIR"
    npm install
    npm run build
fi

# Ensure config directory exists
mkdir -p ~/.config/mosaic/data

# Select mode
MODE=${1:-auto}

case $MODE in
    auto)
        # Auto-detect based on environment
        if [ -n "$CLAUDE_CODE" ] || [ -n "$MCP_STDIO" ]; then
            MODE=stdio
        elif [ -n "$OPENCODE" ] || [ -n "$MCP_HTTP" ]; then
            MODE=http
        else
            # Default to stdio for Claude Code
            MODE=stdio
        fi
        echo -e "${GREEN}Auto-detected mode: $MODE${NC}"
        ;;
esac

# Start server
cd "$ORCHESTRATOR_DIR"

case $MODE in
    stdio)
        echo -e "${GREEN}Starting in STDIO mode (Claude Code)${NC}"
        echo -e "${YELLOW}Configuration:${NC}"
        echo "  - Transport: stdio"
        echo "  - Sequential Thinking: enabled"
        echo "  - Tools: 25 + 4 Sequential Thinking tools"
        echo
        exec node dist/main.js serve --stdio
        ;;
    http)
        echo -e "${GREEN}Starting in HTTP mode (OpenCode/standalone)${NC}"
        echo -e "${YELLOW}Configuration:${NC}"
        echo "  - Transport: HTTP"
        echo "  - Port: 3456"
        echo "  - Sequential Thinking: enabled"
        echo "  - Tools: 25 + 4 Sequential Thinking tools"
        echo
        exec node dist/main.js serve --http --port 3456
        ;;
    test)
        echo -e "${GREEN}Running in test mode${NC}"
        # Test Sequential Thinking connection
        echo -e "${YELLOW}Testing Sequential Thinking connection...${NC}"
        npx -y @modelcontextprotocol/server-sequential-thinking --version
        
        # Test orchestrator
        echo -e "${YELLOW}Testing orchestrator health...${NC}"
        node dist/main.js health
        
        echo -e "${GREEN}All tests passed!${NC}"
        ;;
    *)
        echo -e "${RED}Unknown mode: $MODE${NC}"
        echo "Usage: $0 [auto|stdio|http|test]"
        echo "  auto  - Auto-detect based on environment (default)"
        echo "  stdio - STDIO mode for Claude Code"
        echo "  http  - HTTP mode for OpenCode/standalone"
        echo "  test  - Run connection tests"
        exit 1
        ;;
esac