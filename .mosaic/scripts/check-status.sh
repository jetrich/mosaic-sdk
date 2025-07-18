#!/bin/bash
echo "=== MosAIc Stack Status ==="
echo "MCP Server: $(pgrep -f "mosaic-mcp" > /dev/null && echo "Running" || echo "Stopped")"
echo "Port 3456: $(lsof -i :3456 > /dev/null 2>&1 && echo "In use" || echo "Free")"
echo "Database: $([ -f .mosaic/data/mcp.db ] && echo "Exists" || echo "Missing")"
echo "Tony Version: ${TONY_VERSION:-2.5.0}"