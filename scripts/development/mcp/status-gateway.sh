#!/bin/bash
# Check status of MCP Gateway service

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

PID_FILE="${PROJECT_ROOT}/.mosaic/mcp-gateway.pid"
LOG_FILE="${PROJECT_ROOT}/.mosaic/logs/mcp-gateway.log"
GATEWAY_PORT="${MCP_GATEWAY_PORT:-3457}"

echo "MCP Gateway Status"
echo "=================="

# Check PID file
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo -e "Status: ${GREEN}Running${NC}"
        echo "PID: $PID"
        
        # Get process info
        PS_INFO=$(ps -p "$PID" -o comm=,etime=,rss= | tail -1)
        if [ -n "$PS_INFO" ]; then
            COMM=$(echo "$PS_INFO" | awk '{print $1}')
            ETIME=$(echo "$PS_INFO" | awk '{print $2}')
            RSS_KB=$(echo "$PS_INFO" | awk '{print $3}')
            RSS_MB=$((RSS_KB / 1024))
            
            echo "Uptime: $ETIME"
            echo "Memory: ${RSS_MB}MB"
        fi
    else
        echo -e "Status: ${RED}Not Running${NC} (stale PID file)"
        rm -f "$PID_FILE"
    fi
else
    echo -e "Status: ${RED}Not Running${NC}"
fi

# Check health endpoint
echo ""
echo "Health Check:"
if curl -s -f "http://localhost:$GATEWAY_PORT/health" > /dev/null 2>&1; then
    HEALTH=$(curl -s "http://localhost:$GATEWAY_PORT/health")
    echo -e "${GREEN}✓ Health endpoint responding${NC}"
    
    # Parse JSON response
    if command -v jq > /dev/null 2>&1; then
        echo "  Service: $(echo "$HEALTH" | jq -r .service)"
        echo "  Version: $(echo "$HEALTH" | jq -r .version)"
        echo "  Sessions:"
        echo "    Total: $(echo "$HEALTH" | jq -r .sessions.total)"
        echo "    Active: $(echo "$HEALTH" | jq -r .sessions.active)"
        echo "  Backends:"
        
        # Get backend status from metrics
        if curl -s -f "http://localhost:$GATEWAY_PORT/metrics" > /dev/null 2>&1; then
            METRICS=$(curl -s "http://localhost:$GATEWAY_PORT/metrics")
            echo "$METRICS" | grep "mcp_gateway_backend_connected" | while read -r line; do
                if [[ $line =~ backend=\"([^\"]+)\".*\ ([0-9]+)$ ]]; then
                    BACKEND="${BASH_REMATCH[1]}"
                    CONNECTED="${BASH_REMATCH[2]}"
                    if [ "$CONNECTED" = "1" ]; then
                        echo -e "    - $BACKEND: ${GREEN}connected${NC}"
                    else
                        echo -e "    - $BACKEND: ${RED}disconnected${NC}"
                    fi
                fi
            done
        fi
    else
        echo "$HEALTH"
    fi
else
    echo -e "${RED}✗ Health endpoint not responding${NC}"
fi

# Check log file
echo ""
echo "Logs:"
if [ -f "$LOG_FILE" ]; then
    echo "  File: $LOG_FILE"
    echo "  Size: $(du -h "$LOG_FILE" | cut -f1)"
    echo "  Last 5 lines:"
    tail -5 "$LOG_FILE" | sed 's/^/    /'
else
    echo "  No log file found"
fi

echo ""
echo "Commands:"
echo "  Start:   $SCRIPT_DIR/start-gateway.sh"
echo "  Stop:    $SCRIPT_DIR/stop-gateway.sh"
echo "  Restart: $SCRIPT_DIR/restart-gateway.sh"
echo "  Logs:    tail -f $LOG_FILE"