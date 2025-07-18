#!/bin/bash
# Start MCP server with isolated configuration

cd "$(dirname "$0")/../mosaic-mcp"

# Set environment variables
export PORT=3456
export DATABASE_PATH="../.mosaic/data/mcp.db"
export NODE_ENV=development
export LOG_LEVEL=debug

echo "Starting MosAIc MCP Server (Isolated)"
echo "Port: $PORT"
echo "Database: $DATABASE_PATH"
echo "Environment: $NODE_ENV"

# Start the server
exec node dist/main.js