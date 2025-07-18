/**
 * @fileoverview Registry for managing all MCP service tools
 * @module @mosaic/mcp-integration
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { 
  Logger, 
  MCPResult, 
  ServiceConfig, 
  AuthConfig,
  GitServiceConfig,
  CIServiceConfig,
  DocsServiceConfig,
  ProjectServiceConfig,
} from '@mosaic/mcp-common';
import { RepositoryTool } from '@mosaic/mcp-gitea-remote';
// TODO: Import other tools when implemented
// import { PipelineTool } from '@mosaic/mcp-woodpecker';
// import { DocumentationTool } from '@mosaic/mcp-bookstack';
// import { ProjectTool } from '@mosaic/mcp-plane';

/**
 * Registry for managing all MCP service tools
 */
export class MCPServiceRegistry {
  private tools: Map<string, Tool> = new Map();
  private logger = Logger.getLogger('mcp-service-registry');

  /**
   * Initialize all MCP tools based on configuration
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing MCP service registry...');

    try {
      // Load configuration from environment variables
      const config = this.loadConfiguration();

      // Initialize Gitea tools if configured
      if (config.gitea) {
        await this.initializeGiteaTools(config.gitea);
      }

      // Initialize Woodpecker tools if configured
      if (config.woodpecker) {
        await this.initializeWoodpeckerTools(config.woodpecker);
      }

      // Initialize BookStack tools if configured
      if (config.bookstack) {
        await this.initializeBookStackTools(config.bookstack);
      }

      // Initialize Plane tools if configured
      if (config.plane) {
        await this.initializePlaneTools(config.plane);
      }

      this.logger.info('MCP service registry initialized', {
        toolCount: this.tools.size,
        tools: Array.from(this.tools.keys()),
      });
    } catch (error) {
      this.logger.error('Failed to initialize MCP service registry', { error });
      throw error;
    }
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfiguration(): {
    gitea?: GitServiceConfig & { auth: AuthConfig };
    woodpecker?: CIServiceConfig & { auth: AuthConfig };
    bookstack?: DocsServiceConfig & { auth: AuthConfig };
    plane?: ProjectServiceConfig & { auth: AuthConfig };
  } {
    const config: any = {};

    // Gitea configuration
    if (process.env.GITEA_API_URL) {
      config.gitea = {
        name: 'Gitea',
        baseUrl: process.env.GITEA_BASE_URL || 'https://git.mosaicstack.dev',
        apiUrl: process.env.GITEA_API_URL || 'https://git.mosaicstack.dev/api/v1',
        timeout: parseInt(process.env.GITEA_TIMEOUT || '30000'),
        retryAttempts: parseInt(process.env.GITEA_RETRY_ATTEMPTS || '3'),
        retryDelay: parseInt(process.env.GITEA_RETRY_DELAY || '1000'),
        organization: process.env.GITEA_ORGANIZATION || 'mosaic-org',
        defaultBranch: process.env.GITEA_DEFAULT_BRANCH || 'main',
        sshKeyPath: process.env.GITEA_SSH_KEY_PATH,
        webhookSecret: process.env.GITEA_WEBHOOK_SECRET,
        auth: {
          type: (process.env.GITEA_AUTH_TYPE as any) || 'token',
          credentials: {
            token: process.env.GITEA_TOKEN,
            username: process.env.GITEA_USERNAME,
            password: process.env.GITEA_PASSWORD,
          },
          refreshable: false,
        },
      };
    }

    // Woodpecker configuration
    if (process.env.WOODPECKER_API_URL) {
      config.woodpecker = {
        name: 'Woodpecker',
        baseUrl: process.env.WOODPECKER_BASE_URL || 'https://ci.mosaicstack.dev',
        apiUrl: process.env.WOODPECKER_API_URL || 'https://ci.mosaicstack.dev/api',
        timeout: parseInt(process.env.WOODPECKER_TIMEOUT || '30000'),
        retryAttempts: parseInt(process.env.WOODPECKER_RETRY_ATTEMPTS || '3'),
        retryDelay: parseInt(process.env.WOODPECKER_RETRY_DELAY || '1000'),
        defaultPipeline: process.env.WOODPECKER_DEFAULT_PIPELINE || 'default',
        artifactRetention: parseInt(process.env.WOODPECKER_ARTIFACT_RETENTION || '30'),
        concurrentBuilds: parseInt(process.env.WOODPECKER_CONCURRENT_BUILDS || '4'),
        auth: {
          type: 'token',
          credentials: {
            token: process.env.WOODPECKER_TOKEN,
          },
          refreshable: false,
        },
      };
    }

    // BookStack configuration
    if (process.env.BOOKSTACK_API_URL) {
      config.bookstack = {
        name: 'BookStack',
        baseUrl: process.env.BOOKSTACK_BASE_URL || 'https://docs.mosaicstack.dev',
        apiUrl: process.env.BOOKSTACK_API_URL || 'https://docs.mosaicstack.dev/api',
        timeout: parseInt(process.env.BOOKSTACK_TIMEOUT || '30000'),
        retryAttempts: parseInt(process.env.BOOKSTACK_RETRY_ATTEMPTS || '3'),
        retryDelay: parseInt(process.env.BOOKSTACK_RETRY_DELAY || '1000'),
        defaultShelf: process.env.BOOKSTACK_DEFAULT_SHELF || 'MosAIc Documentation',
        autoSync: process.env.BOOKSTACK_AUTO_SYNC === 'true',
        templateId: process.env.BOOKSTACK_TEMPLATE_ID,
        auth: {
          type: 'token',
          credentials: {
            token: process.env.BOOKSTACK_TOKEN,
            tokenId: process.env.BOOKSTACK_TOKEN_ID,
          },
          refreshable: false,
        },
      };
    }

    // Plane configuration
    if (process.env.PLANE_API_URL) {
      config.plane = {
        name: 'Plane',
        baseUrl: process.env.PLANE_BASE_URL || 'https://pm.mosaicstack.dev',
        apiUrl: process.env.PLANE_API_URL || 'https://pm.mosaicstack.dev/api',
        timeout: parseInt(process.env.PLANE_TIMEOUT || '30000'),
        retryAttempts: parseInt(process.env.PLANE_RETRY_ATTEMPTS || '3'),
        retryDelay: parseInt(process.env.PLANE_RETRY_DELAY || '1000'),
        defaultWorkspace: process.env.PLANE_DEFAULT_WORKSPACE || 'mosaic-development',
        defaultTemplate: process.env.PLANE_DEFAULT_TEMPLATE || 'default',
        estimateEnabled: process.env.PLANE_ESTIMATE_ENABLED === 'true',
        auth: {
          type: 'token',
          credentials: {
            token: process.env.PLANE_TOKEN,
          },
          refreshable: false,
        },
      };
    }

    return config;
  }

  /**
   * Initialize Gitea tools
   */
  private async initializeGiteaTools(config: GitServiceConfig & { auth: AuthConfig }): Promise<void> {
    this.logger.info('Initializing Gitea tools...');

    const repositoryTool = new RepositoryTool(config, config.auth);
    this.tools.set(repositoryTool.name, repositoryTool);

    // TODO: Add other Gitea tools (OrganizationTool, WebhookTool, etc.)

    this.logger.info('Gitea tools initialized', {
      tools: ['gitea_repository'], // Add other tool names as implemented
    });
  }

  /**
   * Initialize Woodpecker tools
   */
  private async initializeWoodpeckerTools(config: CIServiceConfig & { auth: AuthConfig }): Promise<void> {
    this.logger.info('Initializing Woodpecker tools...');

    // TODO: Implement when PipelineTool is available
    // const pipelineTool = new PipelineTool(config, config.auth);
    // this.tools.set(pipelineTool.name, pipelineTool);

    this.logger.info('Woodpecker tools initialized (placeholder)');
  }

  /**
   * Initialize BookStack tools
   */
  private async initializeBookStackTools(config: DocsServiceConfig & { auth: AuthConfig }): Promise<void> {
    this.logger.info('Initializing BookStack tools...');

    // TODO: Implement when DocumentationTool is available
    // const documentationTool = new DocumentationTool(config, config.auth);
    // this.tools.set(documentationTool.name, documentationTool);

    this.logger.info('BookStack tools initialized (placeholder)');
  }

  /**
   * Initialize Plane tools
   */
  private async initializePlaneTools(config: ProjectServiceConfig & { auth: AuthConfig }): Promise<void> {
    this.logger.info('Initializing Plane tools...');

    // TODO: Implement when ProjectTool is available
    // const projectTool = new ProjectTool(config, config.auth);
    // this.tools.set(projectTool.name, projectTool);

    this.logger.info('Plane tools initialized (placeholder)');
  }

  /**
   * List all available tools
   */
  async listTools(): Promise<Tool[]> {
    return Array.from(this.tools.values());
  }

  /**
   * Execute a tool by name
   */
  async executeTool(name: string, args: any): Promise<MCPResult> {
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        success: false,
        error: {
          code: 'TOOL_NOT_FOUND',
          message: `Tool '${name}' not found`,
          details: {
            availableTools: Array.from(this.tools.keys()),
          },
        },
      };
    }

    try {
      this.logger.info('Executing tool', { tool: name });
      const result = await tool.call(args);
      
      // Ensure result follows MCPResult format
      if (typeof result === 'object' && result !== null) {
        return result as MCPResult;
      }

      // Wrap non-standard results
      return {
        success: true,
        data: result,
        metadata: {
          tool: name,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Tool execution failed', {
        tool: name,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        error: {
          code: 'TOOL_EXECUTION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          details: {
            tool: name,
            stack: error instanceof Error ? error.stack : undefined,
          },
        },
        metadata: {
          tool: name,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Get tool by name
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Check if tool exists
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get registry statistics
   */
  getStatistics(): {
    totalTools: number;
    toolsByService: Record<string, number>;
    tools: string[];
  } {
    const tools = Array.from(this.tools.keys());
    const toolsByService: Record<string, number> = {};

    tools.forEach(tool => {
      const service = tool.split('_')[0]; // Extract service prefix
      toolsByService[service] = (toolsByService[service] || 0) + 1;
    });

    return {
      totalTools: tools.length,
      toolsByService,
      tools,
    };
  }

  /**
   * Dispose of all tools and cleanup resources
   */
  async dispose(): Promise<void> {
    this.logger.info('Disposing MCP service registry...');

    const disposePromises = Array.from(this.tools.values()).map(async (tool) => {
      try {
        // Call dispose method if available
        if ('dispose' in tool && typeof tool.dispose === 'function') {
          await tool.dispose();
        }
      } catch (error) {
        this.logger.warn('Error disposing tool', {
          tool: tool.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    await Promise.all(disposePromises);
    this.tools.clear();

    this.logger.info('MCP service registry disposed');
  }
}