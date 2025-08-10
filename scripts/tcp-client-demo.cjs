#!/usr/bin/env node
/**
 * TCP MCP Client Demo
 * Demonstrates connecting to the distributed MCP server
 */

const net = require("net");
const readline = require("readline");

class MCPClient {
  constructor(host = "localhost", port = 3456) {
    this.host = host;
    this.port = port;
    this.socket = null;
    this.connected = false;
    this.authenticated = false;
    this.messageId = 1;
    this.pendingRequests = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.socket = net.createConnection(this.port, this.host);

      this.socket.on("connect", () => {
        console.log(`✅ Connected to MCP server at ${this.host}:${this.port}`);
        this.connected = true;
        resolve();
      });

      this.socket.on("data", (data) => {
        this.handleData(data);
      });

      this.socket.on("close", () => {
        console.log("❌ Connection closed");
        this.connected = false;
        this.authenticated = false;
      });

      this.socket.on("error", (error) => {
        console.error("Connection error:", error);
        reject(error);
      });
    });
  }

  handleData(data) {
    const messages = data.toString().trim().split("\n");

    for (const messageStr of messages) {
      if (messageStr.trim()) {
        try {
          const message = JSON.parse(messageStr);
          this.handleMessage(message);
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      }
    }
  }

  handleMessage(message) {
    if (message.type === "welcome") {
      console.log(`🎉 ${message.message}`);
      console.log(`🆔 Connection ID: ${message.connectionId}`);
      console.log(`📋 Server capabilities:`, message.serverInfo.capabilities);
      return;
    }

    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, method } = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);

      if (message.error) {
        console.error(`❌ Error for ${method}:`, message.error.message);
      } else {
        console.log(`✅ Response for ${method}:`, message.result);

        // Handle specific responses
        if (method === "auth" && message.result.authenticated) {
          this.authenticated = true;
          console.log("🔐 Authentication successful!");
        }
      }

      resolve(message);
    }
  }

  async sendRequest(method, params = {}) {
    if (!this.connected) {
      throw new Error("Not connected to server");
    }

    const id = this.messageId++;
    const request = {
      jsonrpc: "2.0",
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject, method });

      const message = JSON.stringify(request) + "\n";
      this.socket.write(message);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout for ${method}`));
        }
      }, 10000);
    });
  }

  async authenticate(userId, token) {
    return this.sendRequest("auth", { userId, token });
  }

  async switchProject(projectId) {
    return this.sendRequest("project/switch", { projectId });
  }

  async listProjects() {
    return this.sendRequest("project/list");
  }

  async listTools() {
    return this.sendRequest("tools/list");
  }

  async createTask(title, description, priority = "medium") {
    return this.sendRequest("mosaic_task_create", {
      title,
      description,
      priority,
    });
  }

  async ping() {
    return this.sendRequest("ping");
  }

  disconnect() {
    if (this.socket) {
      this.socket.end();
    }
  }
}

// Interactive demo
async function runDemo() {
  const client = new MCPClient();

  try {
    console.log("🚀 MosAIc MCP Client Demo");
    console.log("========================");

    await client.connect();

    // Wait a moment for welcome message
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log("\n📋 Demo Steps:");
    console.log("1. Authenticate");
    console.log("2. List projects");
    console.log("3. Switch project");
    console.log("4. List available tools");
    console.log("5. Create a task");
    console.log("6. Ping server");

    // Step 1: Authenticate
    console.log("\n🔐 Step 1: Authenticating...");
    await client.authenticate("demo-user", "demo-token-12345");

    // Step 2: List projects
    console.log("\n📂 Step 2: Listing projects...");
    await client.listProjects();

    // Step 3: Switch project
    console.log("\n🔄 Step 3: Switching to mosaic-sdk project...");
    await client.switchProject("mosaic-sdk");

    // Step 4: List tools
    console.log("\n🛠️  Step 4: Listing available tools...");
    await client.listTools();

    // Step 5: Create task
    console.log("\n📝 Step 5: Creating a task...");
    await client.createTask(
      "Implement distributed MCP architecture",
      "Add TCP server support for multi-tenant MCP connections",
      "high",
    );

    // Step 6: Ping
    console.log("\n🏓 Step 6: Pinging server...");
    await client.ping();

    console.log("\n🎉 Demo completed successfully!");
    console.log("\n💡 The distributed MCP server is now ready for:");
    console.log("   • Multiple concurrent connections");
    console.log("   • Multi-project support");
    console.log("   • Authentication and authorization");
    console.log("   • Remote OpenCode integration");
  } catch (error) {
    console.error("Demo failed:", error);
  } finally {
    client.disconnect();
  }
}

// Interactive mode
async function runInteractive() {
  const client = new MCPClient();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    await client.connect();

    console.log("\n🎮 Interactive Mode - Available commands:");
    console.log("  auth <userId> <token>     - Authenticate");
    console.log("  projects                  - List projects");
    console.log("  switch <projectId>        - Switch project");
    console.log("  tools                     - List tools");
    console.log("  task <title> [description] - Create task");
    console.log("  ping                      - Ping server");
    console.log("  quit                      - Exit");

    const askCommand = () => {
      rl.question("\n> ", async (input) => {
        const [command, ...args] = input.trim().split(" ");

        try {
          switch (command) {
            case "auth":
              if (args.length >= 2) {
                await client.authenticate(args[0], args[1]);
              } else {
                console.log("Usage: auth <userId> <token>");
              }
              break;

            case "projects":
              await client.listProjects();
              break;

            case "switch":
              if (args[0]) {
                await client.switchProject(args[0]);
              } else {
                console.log("Usage: switch <projectId>");
              }
              break;

            case "tools":
              await client.listTools();
              break;

            case "task":
              if (args[0]) {
                await client.createTask(args[0], args.slice(1).join(" "));
              } else {
                console.log("Usage: task <title> [description]");
              }
              break;

            case "ping":
              await client.ping();
              break;

            case "quit":
            case "exit":
              console.log("👋 Goodbye!");
              rl.close();
              return;

            default:
              console.log('Unknown command. Type "quit" to exit.');
          }
        } catch (error) {
          console.error("Command failed:", error.message);
        }

        askCommand();
      });
    };

    askCommand();
  } catch (error) {
    console.error("Failed to connect:", error);
    rl.close();
  }
}

// Main
if (require.main === module) {
  const mode = process.argv[2];

  if (mode === "interactive" || mode === "-i") {
    runInteractive();
  } else {
    runDemo();
  }
}

module.exports = MCPClient;
