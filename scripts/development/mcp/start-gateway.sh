#!/bin/bash
# Start the MCP Gateway service

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default configuration
GATEWAY_PORT="${MCP_GATEWAY_PORT:-3457}"
ORCHESTRATOR_URL="${MCP_ORCHESTRATOR_URL:-http://localhost:3456/mcp}"
LOG_FILE="${PROJECT_ROOT}/.mosaic/logs/mcp-gateway.log"
PID_FILE="${PROJECT_ROOT}/.mosaic/mcp-gateway.pid"

# Ensure directories exist
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$(dirname "$PID_FILE")"

# Check if gateway is already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo -e "${GREEN}MCP Gateway is already running (PID: $PID)${NC}"
        exit 0
    else
        echo "Removing stale PID file"
        rm -f "$PID_FILE"
    fi
fi

# Check if orchestrator is running
if ! curl -s -f "http://localhost:3456/health" > /dev/null 2>&1; then
    echo -e "${RED}Warning: MCP Orchestrator is not running on port 3456${NC}"
    echo "The gateway will start but backend connections may fail"
    echo "Run './scripts/development/mcp/start-orchestrator.sh' to start the orchestrator"
fi

echo "Starting MCP Gateway..."

# Navigate to gateway package
cd "$PROJECT_ROOT/packages/mcp-gateway" || exit 1

# Build if needed
if [ ! -d "dist" ] || [ "$1" == "--build" ]; then
    echo "Building MCP Gateway..."
    npm run build || exit 1
fi

# Start the gateway
nohup node dist/cli.js serve \
    --port "$GATEWAY_PORT" \
    --host 0.0.0.0 \
    > "$LOG_FILE" 2>&1 &

PID=$!
echo $PID > "$PID_FILE"

# Wait for startup
sleep 3

# Check if running
if kill -0 "$PID" 2>/dev/null; then
    # Check health endpoint
    if curl -s -f "http://localhost:$GATEWAY_PORT/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ MCP Gateway started successfully${NC}"
        echo "  PID: $PID"
        echo "  Port: $GATEWAY_PORT"
        echo "  Log: $LOG_FILE"
        echo ""
        echo "Available endpoints:"
        echo "  - Health: http://localhost:$GATEWAY_PORT/health"
        echo "  - SSE: http://localhost:$GATEWAY_PORT/mcp"
        echo "  - REST: http://localhost:$GATEWAY_PORT/api/v1"
        echo ""
        echo "To stop: $SCRIPT_DIR/stop-gateway.sh"
        echo "To view logs: tail -f $LOG_FILE"
    else
        echo -e "${RED}✗ Gateway started but health check failed${NC}"
        echo "Check logs: tail -f $LOG_FILE"
        exit 1
    fi
else
    echo -e "${RED}✗ Failed to start MCP Gateway${NC}"
    echo "Check logs: tail -f $LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
fi