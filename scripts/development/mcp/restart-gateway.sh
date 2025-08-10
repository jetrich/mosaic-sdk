#!/bin/bash
# Restart the MCP Gateway service

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Restarting MCP Gateway..."

# Stop if running
"$SCRIPT_DIR/stop-gateway.sh"

# Wait a moment
sleep 1

# Start again
"$SCRIPT_DIR/start-gateway.sh" "$@"