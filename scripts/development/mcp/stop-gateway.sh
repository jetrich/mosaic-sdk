#!/bin/bash
# Stop the MCP Gateway service

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PID_FILE="${PROJECT_ROOT}/.mosaic/mcp-gateway.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "MCP Gateway is not running (no PID file found)"
    exit 0
fi

PID=$(cat "$PID_FILE")

if kill -0 "$PID" 2>/dev/null; then
    echo "Stopping MCP Gateway (PID: $PID)..."
    
    # Send SIGTERM for graceful shutdown
    kill -TERM "$PID"
    
    # Wait for process to exit
    COUNT=0
    while kill -0 "$PID" 2>/dev/null && [ $COUNT -lt 10 ]; do
        sleep 1
        COUNT=$((COUNT + 1))
    done
    
    if kill -0 "$PID" 2>/dev/null; then
        echo "Process didn't stop gracefully, forcing..."
        kill -9 "$PID"
    fi
    
    rm -f "$PID_FILE"
    echo -e "${GREEN}✓ MCP Gateway stopped${NC}"
else
    echo "MCP Gateway is not running (PID $PID not found)"
    rm -f "$PID_FILE"
fi