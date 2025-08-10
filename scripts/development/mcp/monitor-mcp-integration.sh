#!/bin/bash

# MCP Integration Monitoring Script
# Monitors the connection between Claude Code and the unified MCP server

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "🔍 MCP Integration Status Monitor"
echo "=================================="
echo

# Check if MCP server is running
echo "1. MCP Server Status:"
echo "   Port 3456: $(ss -tuln | grep :3456 > /dev/null && echo "✅ LISTENING" || echo "❌ NOT LISTENING")"

if ss -tuln | grep :3456 > /dev/null; then
    # Test health endpoint
    HEALTH_STATUS=$(curl -s http://localhost:3456/health 2>/dev/null | jq -r '.status' 2>/dev/null || echo "error")
    echo "   Health: $([ "$HEALTH_STATUS" = "healthy" ] && echo "✅ $HEALTH_STATUS" || echo "❌ $HEALTH_STATUS")"
    
    # Get active sessions
    SESSIONS=$(curl -s http://localhost:3456/health 2>/dev/null | jq -r '.activeSessions' 2>/dev/null || echo "unknown")
    echo "   Active Sessions: $SESSIONS"
else
    echo "   ❌ MCP server not responding on port 3456"
fi

echo

# Check configuration files
echo "2. Configuration Files:"
echo "   Project .mcp.json: $([ -f "$PROJECT_ROOT/.mcp.json" ] && echo "✅ EXISTS" || echo "❌ MISSING")"

if [ -f "$PROJECT_ROOT/.mcp.json" ]; then
    echo "   Configuration:"
    cat "$PROJECT_ROOT/.mcp.json" | jq . 2>/dev/null || echo "   ❌ Invalid JSON"
fi

# Check global configuration
echo "   Global ~/.claude.json: $([ -f "$HOME/.claude.json" ] && echo "✅ EXISTS" || echo "❌ NOT FOUND")"

echo

# Test SSE connection
echo "3. SSE Connection Test:"
timeout 3s curl -s -H "Accept: text/event-stream" -H "Cache-Control: no-cache" \
    http://localhost:3456/mcp 2>/dev/null | head -n 5 | while read line; do
    echo "   📡 $line"
done && echo "   ✅ SSE connection successful" || echo "   ❌ SSE connection failed"

echo

# Process information
echo "4. MCP Process Information:"
MCP_PROCESS=$(ps aux | grep -v grep | grep "dist/main.js serve" | head -1)
if [ -n "$MCP_PROCESS" ]; then
    echo "   ✅ Process running:"
    echo "   $MCP_PROCESS" | awk '{print "   PID: "$2", CPU: "$3"%, MEM: "$4"%"}'
else
    echo "   ❌ MCP process not found"
fi

echo

# Log file check
echo "5. Recent Log Activity:"
LOG_FILE="$PROJECT_ROOT/packages/mcp-orchestrator/orchestrator-new.log"
if [ -f "$LOG_FILE" ]; then
    echo "   📜 Last 3 log entries:"
    tail -n 3 "$LOG_FILE" | while read line; do
        echo "   $(echo "$line" | jq -r '.timestamp // empty') - $(echo "$line" | jq -r '.message // .')"
    done 2>/dev/null || tail -n 3 "$LOG_FILE" | sed 's/^/   /'
else
    echo "   ❌ Log file not found: $LOG_FILE"
fi

echo

# Connection test with session
echo "6. MCP Protocol Test:"
echo "   Testing session creation..."
SESSION_RESPONSE=$(timeout 5s curl -s http://localhost:3456/mcp 2>/dev/null | head -n 2)
if echo "$SESSION_RESPONSE" | grep -q "sessionId"; then
    SESSION_ID=$(echo "$SESSION_RESPONSE" | grep "sessionId" | sed 's/.*sessionId=\([^[:space:]]*\).*/\1/')
    echo "   ✅ Session created: $SESSION_ID"
else
    echo "   ❌ Session creation failed"
fi

echo
echo "📊 Summary:"
echo "   Server Status: $(ss -tuln | grep :3456 > /dev/null && echo "✅ Running" || echo "❌ Down")"
echo "   Configuration: $([ -f "$PROJECT_ROOT/.mcp.json" ] && echo "✅ Present" || echo "❌ Missing")"
echo "   Connection: $(timeout 3s curl -s http://localhost:3456/health > /dev/null 2>&1 && echo "✅ Working" || echo "❌ Failed")"
echo

echo "💡 Next Steps:"
echo "   1. Test tool availability in Claude Code session"
echo "   2. Attempt direct mosaic tool invocation"
echo "   3. Check Claude Code MCP connection logs"
echo "   4. Consider global configuration if project-level fails"