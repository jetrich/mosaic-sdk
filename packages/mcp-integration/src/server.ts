#!/usr/bin/env node
/**
 * @fileoverview MosAIc MCP Integration Server
 * @module @mosaic/mcp-integration/server
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { Logger } from '@mosaic/mcp-common';
import { MCPServiceRegistry } from './MCPServiceRegistry.js';

// Load environment variables
dotenv.config();

/**
 * MosAIc MCP Integration Server
 * Provides unified access to all remote service MCP tools
 */
class MosAIcMCPServer {
  private server: Server;
  private registry: MCPServiceRegistry;
  private logger = Logger.getLogger('mcp-integration-server');

  constructor() {
    this.server = new Server(
      {
        name: 'mosaic-mcp-integration',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.registry = new MCPServiceRegistry();
    this.setupHandlers();
  }

  /**
   * Set up MCP server handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = await this.registry.listTools();
      this.logger.info('Tools requested', { count: tools.length });
      return { tools };
    });

    // Execute tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      this.logger.info('Tool execution requested', {
        tool: name,
        hasArgs: !!args,
      });

      try {
        const result = await this.registry.executeTool(name, args || {});
        
        this.logger.info('Tool execution completed', {
          tool: name,
          success: result.success,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        this.logger.error('Tool execution failed', {
          tool: name,
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: {
                  code: 'EXECUTION_ERROR',
                  message: error instanceof Error ? error.message : String(error),
                },
              }, null, 2),
            },
          ],
        };
      }
    });
  }

  /**
   * Initialize the server
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing MosAIc MCP Integration Server...');

      // Initialize service registry
      await this.registry.initialize();

      this.logger.info('MosAIc MCP Integration Server initialized successfully', {
        toolCount: (await this.registry.listTools()).length,
      });
    } catch (error) {
      this.logger.error('Failed to initialize server', { error });
      throw error;
    }
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    try {
      await this.initialize();

      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      this.logger.info('MosAIc MCP Integration Server started on stdio transport');

      // Handle graceful shutdown
      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());
    } catch (error) {
      this.logger.error('Failed to start server', { error });
      process.exit(1);
    }
  }

  /**
   * Shutdown the server gracefully
   */
  private async shutdown(): Promise<void> {
    this.logger.info('Shutting down MosAIc MCP Integration Server...');

    try {
      await this.registry.dispose();
      this.logger.info('Server shutdown completed');
    } catch (error) {
      this.logger.error('Error during shutdown', { error });
    }

    process.exit(0);
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new MosAIcMCPServer();
  server.start().catch((error) => {
    console.error('Failed to start MosAIc MCP Integration Server:', error);
    process.exit(1);
  });
}

export { MosAIcMCPServer };