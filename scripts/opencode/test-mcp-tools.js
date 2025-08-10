#!/usr/bin/env node
/**
 * Test MCP tools directly (for debugging)
 */

const { spawn } = require("child_process");
const path = require("path");

console.log("🧪 Testing MosAIc MCP Tools...\n");

const mcpServerPath = path.join(
  __dirname,
  "../../packages/opencode-mcp/dist/index.js",
);

// Test MCP server with a simple JSON-RPC request
const mcpServer = spawn("node", [mcpServerPath], {
  stdio: ["pipe", "pipe", "pipe"],
});

let output = "";
let errorOutput = "";

mcpServer.stdout.on("data", (data) => {
  output += data.toString();
});

mcpServer.stderr.on("data", (data) => {
  errorOutput += data.toString();
});

// Send a list tools request
const listToolsRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/list",
  params: {},
};

mcpServer.stdin.write(JSON.stringify(listToolsRequest) + "\n");

// Wait for response
setTimeout(() => {
  mcpServer.kill();

  console.log("📤 Sent request:", JSON.stringify(listToolsRequest, null, 2));
  console.log("\n📥 Server output:", output || "None");
  console.log("\n🔍 Server errors:", errorOutput || "None");

  if (errorOutput.includes("OpenCode MCP Server started")) {
    console.log("\n✅ MCP server started successfully");
  }

  if (output.includes("mosaic_")) {
    console.log("✅ MosAIc tools detected in response");
  } else {
    console.log("⚠️  No MosAIc tools detected in response");
  }

  console.log("\n🎯 Next steps:");
  console.log("   1. Start OpenCode: opencode");
  console.log('   2. Ask Claude: "What MCP tools are available?"');
  console.log('   3. Try: "Use mosaic_project_list to show projects"');
}, 2000);

mcpServer.on("error", (error) => {
  console.error("❌ Failed to start MCP server:", error.message);
});
