# OpenCode MCP Integration Debugging

## Current Status

The MCP orchestrator is running successfully with SSE transport on port 3456, but OpenCode fails to connect with error "MCP server mosaic failed to start".

## Observations

1. **SSE Sessions**: Logs show sessions are created and immediately closed
   - Example: `SSE session created {"sessionId":"c760ea08-f5e6-43d2-9ad4-ea630ccd621f"}`
   - Followed immediately by: `SSE session closed`

2. **Configuration Tested**:
   - Type: "remote" (required by OpenCode, "sse" not supported)
   - URL: "http://localhost:3456/mcp" (with and without /mcp path)

3. **Health Check**: Server is healthy and reports 31 tools available

## Potential Issues

1. **Protocol Mismatch**: OpenCode might expect a different SSE/MCP protocol than what @modelcontextprotocol/sdk provides
2. **Authentication**: OpenCode might require specific headers or authentication
3. **Session Handshake**: The immediate session closure suggests a handshake failure

## Next Steps

1. Investigate OpenCode's exact MCP client implementation
2. Check if OpenCode requires specific SSE message formats
3. Consider implementing a custom SSE handler that matches OpenCode's expectations
4. Look for working examples of OpenCode with remote MCP servers

## Alternative Approach

If the SSE transport continues to fail, we may need to:
1. Implement a custom HTTP transport that matches OpenCode's expectations
2. Use a proxy layer to translate between OpenCode and MCP SDK formats
3. Consider using the stdio transport with a wrapper script