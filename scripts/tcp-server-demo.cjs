#!/usr/bin/env node
/**
 * TCP MCP Server Demo
 * Demonstrates the distributed MCP architecture
 */

const net = require("net");
const { EventEmitter } = require("events");

class SimpleTCPMCPServer extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      port: 3456,
      host: "0.0.0.0",
      maxConnections: 100,
      ...config,
    };
    this.connections = new Map();
    this.server = net.createServer();
    this.setupServer();
  }

  setupServer() {
    this.server.on("connection", (socket) => {
      this.handleConnection(socket);
    });

    this.server.on("error", (error) => {
      console.error("Server error:", error);
    });
  }

  handleConnection(socket) {
    const connectionId = this.generateId();
    const connection = {
      id: connectionId,
      socket,
      authenticated: false,
      projectId: null,
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    this.connections.set(connectionId, connection);
    console.log(
      `✅ New connection: ${connectionId} from ${socket.remoteAddress}:${socket.remotePort}`,
    );
    console.log(`📊 Active connections: ${this.connections.size}`);

    // Send welcome message
    this.sendMessage(socket, {
      type: "welcome",
      message: "Connected to MosAIc Distributed MCP Server",
      connectionId,
      serverInfo: {
        name: "mosaic-mcp-server",
        version: "1.0.0",
        capabilities: ["multi-project", "multi-tenant", "authentication"],
      },
    });

    socket.on("data", (data) => {
      this.handleData(connection, data);
    });

    socket.on("close", () => {
      this.connections.delete(connectionId);
      console.log(`❌ Connection closed: ${connectionId}`);
      console.log(`📊 Active connections: ${this.connections.size}`);
    });

    socket.on("error", (error) => {
      console.error(`Socket error for ${connectionId}:`, error);
      this.connections.delete(connectionId);
    });
  }

  handleData(connection, data) {
    try {
      connection.lastActivity = new Date();
      const messages = data.toString().trim().split("\n");

      for (const messageStr of messages) {
        if (messageStr.trim()) {
          const message = JSON.parse(messageStr);
          this.processMessage(connection, message);
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
      this.sendError(connection.socket, "PARSE_ERROR", "Invalid JSON message");
    }
  }

  processMessage(connection, message) {
    console.log(
      `📨 Message from ${connection.id}:`,
      message.method || message.type,
    );

    switch (message.method || message.type) {
      case "auth":
        this.handleAuth(connection, message);
        break;
      case "project/switch":
        this.handleProjectSwitch(connection, message);
        break;
      case "project/list":
        this.handleProjectList(connection, message);
        break;
      case "tools/list":
        this.handleToolsList(connection, message);
        break;
      case "mosaic_task_create":
        this.handleTaskCreate(connection, message);
        break;
      case "ping":
        this.sendMessage(connection.socket, {
          jsonrpc: "2.0",
          id: message.id,
          result: { pong: true, timestamp: new Date().toISOString() },
        });
        break;
      default:
        this.sendError(
          connection.socket,
          "METHOD_NOT_FOUND",
          `Unknown method: ${message.method}`,
        );
    }
  }

  handleAuth(connection, message) {
    const { token, userId } = message.params || {};

    // Simple auth validation (in production, use proper JWT/token validation)
    if (token && token.length > 10 && userId) {
      connection.authenticated = true;
      connection.userId = userId;

      this.sendMessage(connection.socket, {
        jsonrpc: "2.0",
        id: message.id,
        result: {
          authenticated: true,
          userId,
          connectionId: connection.id,
          serverCapabilities: [
            "multi-project",
            "task-management",
            "agent-coordination",
          ],
        },
      });

      console.log(`🔐 Authentication successful: ${userId} (${connection.id})`);
    } else {
      this.sendError(connection.socket, "AUTH_FAILED", "Invalid credentials");
    }
  }

  handleProjectSwitch(connection, message) {
    if (!connection.authenticated) {
      this.sendError(
        connection.socket,
        "UNAUTHORIZED",
        "Authentication required",
      );
      return;
    }

    const { projectId } = message.params || {};
    if (projectId) {
      connection.projectId = projectId;

      this.sendMessage(connection.socket, {
        jsonrpc: "2.0",
        id: message.id,
        result: {
          projectId,
          switched: true,
          timestamp: new Date().toISOString(),
        },
      });

      console.log(`🔄 Project switched: ${connection.userId} -> ${projectId}`);
    } else {
      this.sendError(
        connection.socket,
        "INVALID_PARAMS",
        "Project ID required",
      );
    }
  }

  handleProjectList(connection, message) {
    if (!connection.authenticated) {
      this.sendError(
        connection.socket,
        "UNAUTHORIZED",
        "Authentication required",
      );
      return;
    }

    // Mock project list
    const projects = [
      { id: "mosaic-sdk", name: "MosAIc SDK", path: "/home/user/mosaic-sdk" },
      { id: "my-app", name: "My Application", path: "/home/user/my-app" },
      {
        id: "client-project",
        name: "Client Project",
        path: "/home/user/client-project",
      },
    ];

    this.sendMessage(connection.socket, {
      jsonrpc: "2.0",
      id: message.id,
      result: { projects },
    });
  }

  handleToolsList(connection, message) {
    const tools = [
      {
        name: "mosaic_task_create",
        description: "Create a new task with UPP hierarchy support",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Task title" },
            description: { type: "string", description: "Task description" },
            priority: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["title"],
        },
      },
      {
        name: "mosaic_project_switch",
        description: "Switch to a different project context",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "Project ID to switch to",
            },
          },
          required: ["projectId"],
        },
      },
    ];

    this.sendMessage(connection.socket, {
      jsonrpc: "2.0",
      id: message.id,
      result: { tools },
    });
  }

  handleTaskCreate(connection, message) {
    if (!connection.authenticated) {
      this.sendError(
        connection.socket,
        "UNAUTHORIZED",
        "Authentication required",
      );
      return;
    }

    const { title, description, priority = "medium" } = message.params || {};

    if (!title) {
      this.sendError(
        connection.socket,
        "INVALID_PARAMS",
        "Task title required",
      );
      return;
    }

    const taskId = this.generateId();
    const task = {
      id: taskId,
      title,
      description,
      priority,
      projectId: connection.projectId,
      createdBy: connection.userId,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    this.sendMessage(connection.socket, {
      jsonrpc: "2.0",
      id: message.id,
      result: {
        task,
        message: "Task created successfully",
      },
    });

    console.log(
      `📝 Task created: ${title} (${taskId}) by ${connection.userId}`,
    );
  }

  sendMessage(socket, message) {
    const messageStr = JSON.stringify(message) + "\n";
    socket.write(messageStr);
  }

  sendError(socket, code, message) {
    const error = {
      jsonrpc: "2.0",
      id: null,
      error: { code, message },
    };
    this.sendMessage(socket, error);
  }

  generateId() {
    return Math.random().toString(36).substring(2, 15);
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server.listen(this.config.port, this.config.host, () => {
        console.log(`🚀 MosAIc Distributed MCP Server started`);
        console.log(`📡 Listening on ${this.config.host}:${this.config.port}`);
        console.log(`🔧 Max connections: ${this.config.maxConnections}`);
        console.log(
          `📋 Available methods: auth, project/switch, project/list, tools/list, mosaic_task_create`,
        );
        console.log("");
        console.log("🧪 Test with:");
        console.log(`   telnet ${this.config.host} ${this.config.port}`);
        console.log("   Or use the test client script");
        resolve();
      });

      this.server.on("error", reject);
    });
  }

  async stop() {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log("🛑 MCP Server stopped");
        resolve();
      });
    });
  }

  getStats() {
    const connections = Array.from(this.connections.values());
    return {
      totalConnections: this.connections.size,
      authenticatedConnections: connections.filter((c) => c.authenticated)
        .length,
      projectConnections: connections.filter((c) => c.projectId).length,
      uptime: process.uptime(),
    };
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new SimpleTCPMCPServer({
    port: process.env.MCP_PORT || 3456,
    host: process.env.MCP_HOST || "0.0.0.0",
  });

  server.start().catch(console.error);

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down server...");
    await server.stop();
    process.exit(0);
  });

  // Show stats every 30 seconds
  setInterval(() => {
    const stats = server.getStats();
    if (stats.totalConnections > 0) {
      console.log(
        `📊 Stats: ${stats.totalConnections} total, ${stats.authenticatedConnections} auth, ${stats.projectConnections} with projects`,
      );
    }
  }, 30000);
}

module.exports = SimpleTCPMCPServer;
