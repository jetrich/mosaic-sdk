import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { v4 as uuidv4 } from 'uuid';
import { MCPServerConfig, MCPTool, ToolResponse, MCPError, ToolExecutionError } from '../types';
import { Logger } from '../utils/Logger';
import { TaskTools } from '../tools/TaskTools';
import { ProjectTools } from '../tools/ProjectTools';
import { AgentTools } from '../tools/AgentTools';
import { WorkflowTools } from '../tools/WorkflowTools';
import { ResourceTools } from '../tools/ResourceTools';
import { SequentialTaskTools } from '../tools/SequentialTaskTools';
import { PlanningTools } from '../tools/PlanningTools';
import { TaskService } from '../services/TaskService';
import { SequentialTaskService } from '../services/SequentialTaskService';
import { ProjectService } from '../services/ProjectService';
import { AgentService } from '../services/AgentService';
import { CommunicationService } from '../services/CommunicationService';
import { WorkflowService } from '../services/WorkflowService';
import { ResourceService } from '../services/ResourceService';
import { StateService } from '../services/StateService';
import { MCPHTTPServer } from './http-server.js';

export class MCPServer {
  private server: Server;
  private logger: Logger;
  private config: MCPServerConfig;
  private tools: Map<string, MCPTool> = new Map();
  private httpServer?: MCPHTTPServer;
  private services: {
    task: TaskService;
    project: ProjectService;
    agent: AgentService;
    communication: CommunicationService;
    workflow: WorkflowService;
    resource: ResourceService;
    state: StateService;
  };
  private isRunning = false;
  private metrics = {
    requests: 0,
    errors: 0,
    uptime: Date.now()
  };

  constructor(config: MCPServerConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;

    // Initialize server
    this.server = new Server({
      name: config.server.name,
      version: config.server.version
    });

    // Initialize services
    const stateService = new StateService(config, logger);
    const taskService = new SequentialTaskService(config, logger); // Use SequentialTaskService for enhanced capabilities
    const projectService = new ProjectService(config, logger);
    const agentService = new AgentService(config, logger);
    const communicationService = new CommunicationService(config, logger);
    const workflowService = new WorkflowService(config, logger, agentService, taskService, communicationService);
    const resourceService = new ResourceService(config, logger, agentService);

    this.services = {
      state: stateService,
      task: taskService,
      project: projectService,
      agent: agentService,
      communication: communicationService,
      workflow: workflowService,
      resource: resourceService
    };

    this.setupServerHandlers();
    this.initializeTools();
  }

  private setupServerHandlers(): void {
    // Handle tool list requests
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.metrics.requests++;
      this.logger.logRequest('tools/list');

      const tools = Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }));

      this.logger.logResponse('tools/list', true, { count: tools.length });
      return { tools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      this.metrics.requests++;
      const { name, arguments: args } = request.params;
      const executionId = uuidv4();

      this.logger.logRequest('tools/call', { tool: name, execution_id: executionId });
      
      const startTime = Date.now();
      let success = false;
      let result: ToolResponse;

      try {
        const tool = this.tools.get(name);
        if (!tool) {
          throw new ToolExecutionError(`Tool not found: ${name}`);
        }

        // Rate limiting check
        await this.checkRateLimit(name);

        // Execute tool with timeout
        result = await this.executeWithTimeout(
          () => tool.handler(args),
          this.config.security.tool_timeout,
          `Tool execution timeout: ${name}`
        );

        success = true;
        this.logger.logToolExecution(name, executionId, Date.now() - startTime, true);

      } catch (error) {
        this.metrics.errors++;
        const duration = Date.now() - startTime;
        
        this.logger.logToolExecution(name, executionId, duration, false, {
          error: (error as Error).message
        });

        // Create error response
        result = {
          title: `Error in ${name}`,
          metadata: {
            operation: name,
            status: 'error',
            timestamp: new Date().toISOString(),
            execution_time_ms: duration
          },
          output: `Tool execution failed: ${(error as Error).message}`
        };
      }

      this.logger.logResponse('tools/call', success, { 
        tool: name, 
        execution_id: executionId,
        status: result.metadata.status
      });

      return {
        content: [
          {
            type: 'text',
            text: result.output
          }
        ],
        isError: result.metadata.status === 'error'
      };
    });

    // Handle logging
    // Note: Commenting out notification handler due to SDK compatibility issue
    // this.server.setNotificationHandler(('notifications/message' as any), async (notification) => {
    //   const { level, logger, data } = (notification as any).params;
    //   this.logger.info(`Client log [${level}]: ${data}`, { source: 'client', logger });
    // });

    // Error handling
    this.server.onerror = (error) => {
      this.logger.error('MCP Server error', error);
    };
  }

  private initializeTools(): void {
    this.logger.info('Initializing MCP tools...');

    // Initialize task management tools
    if (this.config.tools.task_management.enabled) {
      const taskTools = new TaskTools(this.services.task, this.logger);
      this.registerToolsFromCategory(taskTools, 'task_management');
      
      // Add Sequential Thinking tools if using SequentialTaskService
      if (this.services.task instanceof SequentialTaskService) {
        const sequentialTools = new SequentialTaskTools(this.services.task, this.logger);
        this.registerToolsFromCategory(sequentialTools, 'task_management');
      }
    }

    // Initialize project coordination tools
    if (this.config.tools.project_coordination.enabled) {
      const projectTools = new ProjectTools(this.services.project, this.logger);
      this.registerToolsFromCategory(projectTools, 'project_coordination');
    }

    // Initialize agent orchestration tools
    if (this.config.tools.agent_orchestration.enabled) {
      const agentTools = new AgentTools(this.services.agent, this.services.communication, this.logger);
      this.registerToolsFromCategory(agentTools, 'agent_orchestration');
      
      // Add workflow tools to agent orchestration category
      const workflowTools = new WorkflowTools(this.services.workflow, this.logger);
      this.registerToolsFromCategory(workflowTools, 'agent_orchestration');
      
      // Add resource management tools to agent orchestration category
      const resourceTools = new ResourceTools(this.services.resource, this.logger);
      this.registerToolsFromCategory(resourceTools, 'agent_orchestration');
      
      // Add planning tools to agent orchestration category
      const planningTools = new PlanningTools();
      this.registerPlanningTools(planningTools);
    }

    this.logger.info(`Initialized ${this.tools.size} MCP tools`, {
      tools: Array.from(this.tools.keys())
    });
  }

  private registerToolsFromCategory(toolsInstance: any, category: keyof MCPServerConfig['tools']): void {
    const tools = toolsInstance.getTools();
    const namespace = this.config.tools[category].namespace;

    for (const tool of tools) {
      const namespacedName = `${namespace}_${tool.name}`;
      this.tools.set(namespacedName, {
        ...tool,
        name: namespacedName
      });
      
      this.logger.debug(`Registered tool: ${namespacedName}`);
    }
  }

  private registerPlanningTools(planningTools: PlanningTools): void {
    const tools = planningTools.getTools();

    for (const tool of tools) {
      const toolName = tool.name || `planning_tool_${tools.indexOf(tool)}`;
      if (!toolName) {
        this.logger.warn('Skipping tool registration due to missing name', { tool });
        continue;
      }
      
      this.tools.set(toolName, {
        name: toolName,
        description: tool.description || '',
        inputSchema: tool.inputSchema,
        handler: tool.handler
      });
      
      this.logger.debug(`Registered planning tool: ${toolName}`);
    }
  }

  private async checkRateLimit(toolName: string): Promise<void> {
    if (!this.config.security.rate_limiting.enabled) {
      return;
    }

    // TODO: Implement proper rate limiting
    // For now, just log the request
    this.logger.debug(`Rate limit check for tool: ${toolName}`);
  }

  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    timeoutMessage: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new ToolExecutionError(timeoutMessage));
      }, timeoutMs);

      fn()
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  async start(): Promise<void> {
    try {
      this.logger.info('Starting MCP server...', {
        name: this.config.server.name,
        version: this.config.server.version,
        transport: this.config.transport.type
      });

      // Initialize services
      await this.services.state.initialize();
      await this.services.task.initialize();
      await this.services.project.initialize();
      await this.services.agent.initialize();
      await this.services.communication.initialize();
      await this.services.workflow.initialize();
      await this.services.resource.initialize();
      
      // Connect ProjectService with TaskService for project context updates
      this.services.project.setTaskService(this.services.task);
      
      // Start the server with appropriate transport
      if (this.config.transport.type === 'stdio') {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        this.logger.info('Connected via stdio transport');
      } else if (this.config.transport.type === 'http' || this.config.transport.type === 'sse') {
        // Create and start HTTP server
        this.httpServer = new MCPHTTPServer(this.server, {
          port: this.config.transport.port || 3456,
          cors: this.config.transport.cors || {
            origin: true,
            credentials: true,
            methods: ['GET', 'POST', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Accept'],
            exposedHeaders: ['X-Session-Id']
          }
        });
        await this.httpServer.start();
        this.logger.info('HTTP/SSE transport started', { 
          port: this.config.transport.port 
        });
      } else {
        throw new MCPError(
          `Unsupported transport type: ${this.config.transport.type}`,
          'UNSUPPORTED_TRANSPORT'
        );
      }

      this.isRunning = true;
      this.metrics.uptime = Date.now();

      this.logger.logServerEvent('started', {
        tools_count: this.tools.size,
        transport: this.config.transport.type
      });

    } catch (error) {
      this.logger.error('Failed to start MCP server', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      this.logger.info('Stopping MCP server...');

      this.isRunning = false;

      // Stop HTTP server if running
      if (this.httpServer) {
        await this.httpServer.stop();
      }

      // Close services
      await this.services.resource.shutdown();
      await this.services.state.close();

      // Close the MCP server
      await this.server.close();

      this.logger.logServerEvent('stopped', {
        uptime_ms: Date.now() - this.metrics.uptime,
        requests_handled: this.metrics.requests,
        errors: this.metrics.errors
      });

      // Close logger
      await this.logger.close();

    } catch (error) {
      this.logger.error('Error stopping MCP server', error);
      throw error;
    }
  }

  async getTools(): Promise<Record<string, any>> {
    const tools: Record<string, any> = {};
    
    for (const [name, tool] of this.tools) {
      tools[name] = {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      };
    }

    return tools;
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const checks: Record<string, any> = {};

    try {
      // Check if server is running
      checks['server'] = {
        status: this.isRunning ? 'healthy' : 'unhealthy',
        uptime_ms: Date.now() - this.metrics.uptime
      };

      // Check services
      checks['services'] = {
        state: await this.services.state.healthCheck(),
        task: await this.services.task.healthCheck(),
        project: await this.services.project.healthCheck(),
        agent: await this.services.agent.healthCheck(),
        communication: await this.services.communication.healthCheck(),
        resource: await this.services.resource.healthCheck()
      };

      // Check tools
      checks['tools'] = {
        count: this.tools.size,
        enabled: Array.from(this.tools.keys())
      };

      // Check metrics
      checks['metrics'] = {
        requests: this.metrics.requests,
        errors: this.metrics.errors,
        error_rate: this.metrics.requests > 0 ? this.metrics.errors / this.metrics.requests : 0
      };

      const allHealthy = Object.values(checks).every(check => 
        typeof check === 'object' && check.status !== 'unhealthy'
      );

      return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        details: checks
      };

    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
        status: 'unhealthy',
        details: {
          error: (error as Error).message,
          ...checks
        }
      };
    }
  }

  getMetrics(): Record<string, any> {
    return {
      uptime_ms: Date.now() - this.metrics.uptime,
      requests_total: this.metrics.requests,
      errors_total: this.metrics.errors,
      error_rate: this.metrics.requests > 0 ? this.metrics.errors / this.metrics.requests : 0,
      tools_registered: this.tools.size,
      services_status: {
        state: this.services.state.isInitialized(),
        task: this.services.task.isReady(),
        project: this.services.project.isReady(),
        agent: this.services.agent.isReady()
      }
    };
  }

  isReady(): boolean {
    return this.isRunning && 
           this.services.state.isInitialized() &&
           this.tools.size > 0;
  }
}