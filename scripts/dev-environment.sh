#!/bin/bash
# dev-environment.sh - Set up isolated MosAIc development environment

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}=== MosAIc SDK Isolated Development Environment ===${NC}"
echo

# Function to check if MCP server is running
check_mcp_running() {
    if lsof -i:3456 >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to start MCP server
start_mcp_server() {
    echo -e "${YELLOW}Starting isolated MCP server...${NC}"
    
    # Create necessary directories
    mkdir -p "$ROOT_DIR/.mosaic/data"
    mkdir -p "$ROOT_DIR/.mosaic/logs"
    mkdir -p "$ROOT_DIR/.mosaic/cache"
    
    # Check if database exists, create if not
    if [ ! -f "$ROOT_DIR/.mosaic/data/mcp.db" ]; then
        echo -e "${YELLOW}Initializing MCP database...${NC}"
        (cd "$ROOT_DIR/mosaic-mcp" && npm run migrate)
    fi
    
    # Start MCP server in background
    cd "$ROOT_DIR/mosaic-mcp"
    nohup npm run dev > "$ROOT_DIR/.mosaic/logs/mcp-server.log" 2>&1 &
    MCP_PID=$!
    
    echo -e "${GREEN}✓ MCP server started (PID: $MCP_PID)${NC}"
    echo $MCP_PID > "$ROOT_DIR/.mosaic/mcp.pid"
    
    # Wait for server to be ready
    echo -e "${YELLOW}Waiting for MCP server to be ready...${NC}"
    sleep 3
    
    if check_mcp_running; then
        echo -e "${GREEN}✓ MCP server is ready at http://localhost:3456${NC}"
    else
        echo -e "${RED}✗ MCP server failed to start${NC}"
        return 1
    fi
}

# Function to stop MCP server
stop_mcp_server() {
    if [ -f "$ROOT_DIR/.mosaic/mcp.pid" ]; then
        PID=$(cat "$ROOT_DIR/.mosaic/mcp.pid")
        if kill -0 $PID 2>/dev/null; then
            echo -e "${YELLOW}Stopping MCP server (PID: $PID)...${NC}"
            kill $PID
            rm "$ROOT_DIR/.mosaic/mcp.pid"
            echo -e "${GREEN}✓ MCP server stopped${NC}"
        fi
    fi
}

# Function to setup environment
setup_environment() {
    # Export environment variables for this session
    export $(cat "$ROOT_DIR/.env.development" | grep -v '^#' | xargs)
    
    # Create local Claude configuration
    mkdir -p "$ROOT_DIR/.mosaic/claude"
    cat > "$ROOT_DIR/.mosaic/claude/config.json" << EOF
{
  "mcp": {
    "enabled": true,
    "url": "http://localhost:3456",
    "required": true
  },
  "workspace": "$ROOT_DIR",
  "isolated": true
}
EOF
    
    echo -e "${GREEN}✓ Environment configured${NC}"
}

# Function to create development session
create_dev_session() {
    cat > "$ROOT_DIR/.mosaic/dev-session.sh" << 'EOF'
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
EOF
    
    chmod +x "$ROOT_DIR/.mosaic/dev-session.sh"
    echo -e "${GREEN}✓ Development session script created${NC}"
}

# Main menu
case "${1:-help}" in
    start)
        setup_environment
        if check_mcp_running; then
            echo -e "${YELLOW}MCP server is already running${NC}"
        else
            start_mcp_server
        fi
        create_dev_session
        echo
        echo -e "${BLUE}To activate the isolated environment:${NC}"
        echo -e "${GREEN}source .mosaic/dev-session.sh${NC}"
        ;;
    
    stop)
        stop_mcp_server
        ;;
    
    restart)
        stop_mcp_server
        sleep 2
        setup_environment
        start_mcp_server
        ;;
    
    status)
        if check_mcp_running; then
            echo -e "${GREEN}✓ MCP server is running${NC}"
            if [ -f "$ROOT_DIR/.mosaic/mcp.pid" ]; then
                echo -e "  PID: $(cat "$ROOT_DIR/.mosaic/mcp.pid")"
            fi
        else
            echo -e "${RED}✗ MCP server is not running${NC}"
        fi
        ;;
    
    logs)
        if [ -f "$ROOT_DIR/.mosaic/logs/mcp-server.log" ]; then
            tail -f "$ROOT_DIR/.mosaic/logs/mcp-server.log"
        else
            echo -e "${RED}No log file found${NC}"
        fi
        ;;
    
    help|--help|-h)
        echo "Usage: $0 <command>"
        echo
        echo "Commands:"
        echo "  start    Start the isolated MCP server and setup environment"
        echo "  stop     Stop the MCP server"
        echo "  restart  Restart the MCP server"
        echo "  status   Check if MCP server is running"
        echo "  logs     Follow MCP server logs"
        echo
        echo "This creates an isolated MosAIc development environment that"
        echo "doesn't affect your other Tony projects."
        ;;
    
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac