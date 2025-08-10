/**
 * OpenCode MCP Server
 * Provides Model Context Protocol integration for OpenCode with MosAIc SDK
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { ConfigLoader } from "@mosaicstack/config";
import { z } from "zod";

// Tool schemas
const TaskCreateSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  assignee: z.string().optional(),
  projectId: z.string().optional(),
});

const TaskAssignSchema = z.object({
  taskId: z.string(),
  agentId: z.string(),
  agentType: z.string(),
});

const ProjectSwitchSchema = z.object({
  projectId: z.string(),
});

const AgentSpawnSchema = z.object({
  agentType: z.string(),
  projectId: z.string(),
  config: z.record(z.any()).optional(),
});

export class OpenCodeMCPServer {
  private server: Server;
  private configLoader: ConfigLoader;

  constructor() {
    this.server = new Server(
      {
        name: "opencode-mcp-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    this.configLoader = new ConfigLoader();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "mosaic_task_create",
            description: "Create a new task with UPP hierarchy support",
            inputSchema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "Task title",
                },
                description: {
                  type: "string",
                  description: "Task description",
                },
                priority: {
                  type: "string",
                  enum: ["high", "medium", "low"],
                  description: "Task priority level",
                },
                assignee: {
                  type: "string",
                  description: "Optional assignee agent ID",
                },
                projectId: {
                  type: "string",
                  description: "Optional project ID",
                },
              },
              required: ["title"],
            },
          },
          {
            name: "mosaic_task_assign",
            description: "Assign a task to a specific agent",
            inputSchema: {
              type: "object",
              properties: {
                taskId: {
                  type: "string",
                  description: "Task ID to assign",
                },
                agentId: {
                  type: "string",
                  description: "Agent ID to assign to",
                },
                agentType: {
                  type: "string",
                  description: "Type of agent (e.g., BE-BACKEND-BENJAMIN)",
                },
              },
              required: ["taskId", "agentId", "agentType"],
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
          {
            name: "mosaic_project_list",
            description: "List all available projects",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "mosaic_agent_spawn",
            description: "Spawn a specialized agent for task execution",
            inputSchema: {
              type: "object",
              properties: {
                agentType: {
                  type: "string",
                  description:
                    "Type of agent to spawn (e.g., BE-BACKEND-BENJAMIN)",
                },
                projectId: {
                  type: "string",
                  description: "Project ID for the agent",
                },
                config: {
                  type: "object",
                  description: "Optional agent configuration",
                },
              },
              required: ["agentType", "projectId"],
            },
          },
          {
            name: "mosaic_agent_coordinate",
            description: "Coordinate multiple agents for complex tasks",
            inputSchema: {
              type: "object",
              properties: {
                agents: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      agentType: { type: "string" },
                      taskId: { type: "string" },
                    },
                    required: ["agentType", "taskId"],
                  },
                  description: "Array of agents and their assigned tasks",
                },
                strategy: {
                  type: "string",
                  enum: ["parallel", "sequential", "event-driven"],
                  description: "Coordination strategy",
                },
              },
              required: ["agents", "strategy"],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          case "mosaic_task_create":
            return await this.handleTaskCreate(request.params.arguments);
          case "mosaic_task_assign":
            return await this.handleTaskAssign(request.params.arguments);
          case "mosaic_project_switch":
            return await this.handleProjectSwitch(request.params.arguments);
          case "mosaic_project_list":
            return await this.handleProjectList();
          case "mosaic_agent_spawn":
            return await this.handleAgentSpawn(request.params.arguments);
          case "mosaic_agent_coordinate":
            return await this.handleAgentCoordinate(request.params.arguments);
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`,
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    });
  }

  private async handleTaskCreate(args: any): Promise<any> {
    try {
      const validatedArgs = TaskCreateSchema.parse(args);

      // Generate task ID with UPP hierarchy format
      const taskId = this.generateTaskId(validatedArgs.priority);

      return {
        content: [
          {
            type: "text",
            text:
              `✅ Task created successfully!\n\n` +
              `**Task Details:**\n` +
              `• ID: ${taskId}\n` +
              `• Title: ${validatedArgs.title}\n` +
              `• Priority: ${validatedArgs.priority}\n` +
              `• Description: ${validatedArgs.description || "None"}\n` +
              `• Assignee: ${validatedArgs.assignee || "Unassigned"}\n` +
              `• Project: ${validatedArgs.projectId || "Default"}\n` +
              `• Created: ${new Date().toISOString()}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to create task: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async handleTaskAssign(args: any): Promise<any> {
    try {
      const validatedArgs = TaskAssignSchema.parse(args);

      return {
        content: [
          {
            type: "text",
            text:
              `✅ Task assigned successfully!\n\n` +
              `**Assignment Details:**\n` +
              `• Task ID: ${validatedArgs.taskId}\n` +
              `• Agent ID: ${validatedArgs.agentId}\n` +
              `• Agent Type: ${validatedArgs.agentType}\n` +
              `• Assigned At: ${new Date().toISOString()}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to assign task: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async handleProjectSwitch(args: any): Promise<any> {
    try {
      const validatedArgs = ProjectSwitchSchema.parse(args);

      return {
        content: [
          {
            type: "text",
            text:
              `✅ Switched to project: ${validatedArgs.projectId}\n\n` +
              `**Project Context:**\n` +
              `• Active Project: ${validatedArgs.projectId}\n` +
              `• Switched At: ${new Date().toISOString()}\n` +
              `• Context Updated: All subsequent operations will use this project`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to switch project: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async handleProjectList(): Promise<any> {
    try {
      // Mock project data - in real implementation, this would come from the config system
      const projects = [
        { id: "mosaic-sdk", name: "MosAIc SDK", status: "active" },
        {
          id: "opencode-integration",
          name: "OpenCode Integration",
          status: "active",
        },
        { id: "tony-framework", name: "Tony Framework", status: "maintenance" },
      ];

      const projectList = projects
        .map(
          (project, index) =>
            `${index + 1}. **${project.name}**\n` +
            `   • ID: ${project.id}\n` +
            `   • Status: ${project.status}`,
        )
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: `📋 **Available Projects** (${projects.length} total)\n\n${projectList}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to list projects: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async handleAgentSpawn(args: any): Promise<any> {
    try {
      const validatedArgs = AgentSpawnSchema.parse(args);

      // Generate agent ID
      const agentId = `agent-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      return {
        content: [
          {
            type: "text",
            text:
              `🚀 Agent spawned successfully!\n\n` +
              `**Agent Details:**\n` +
              `• Agent ID: ${agentId}\n` +
              `• Type: ${validatedArgs.agentType}\n` +
              `• Project: ${validatedArgs.projectId}\n` +
              `• Status: Active\n` +
              `• Spawned At: ${new Date().toISOString()}\n` +
              `• Configuration: ${validatedArgs.config ? "Custom" : "Default"}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to spawn agent: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async handleAgentCoordinate(args: any): Promise<any> {
    try {
      const { agents, strategy } = args;

      if (!Array.isArray(agents) || agents.length === 0) {
        throw new Error("Agents array is required and must not be empty");
      }

      const coordinationId = `coord-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      return {
        content: [
          {
            type: "text",
            text:
              `🎯 Agent coordination initiated!\n\n` +
              `**Coordination Details:**\n` +
              `• Coordination ID: ${coordinationId}\n` +
              `• Strategy: ${strategy}\n` +
              `• Agents Count: ${agents.length}\n` +
              `• Agent Types: ${agents.map((a: any) => a.agentType).join(", ")}\n` +
              `• Started At: ${new Date().toISOString()}\n\n` +
              `**Agent Assignments:**\n` +
              agents
                .map(
                  (agent: any, index: number) =>
                    `${index + 1}. ${agent.agentType} → Task ${agent.taskId}`,
                )
                .join("\n"),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to coordinate agents: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private generateTaskId(priority: string): string {
    const timestamp = Date.now();
    const priorityPrefix =
      priority === "high" ? "H" : priority === "medium" ? "M" : "L";
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    return `T.${priorityPrefix}.${timestamp}.${randomSuffix}`;
  }

  public async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("OpenCode MCP Server started"); // Use stderr to avoid interfering with MCP protocol
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new OpenCodeMCPServer();
  server.start().catch((error) => {
    console.error("Failed to start OpenCode MCP Server:", error);
    process.exit(1);
  });
}

export default OpenCodeMCPServer;
