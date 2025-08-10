/**
 * Unified Planning Agent Base Class
 * Integrates with MosAIc MCP infrastructure and global routing configuration
 * Replaces the separate -local agents with unified agent architecture
 */

import { MCPServiceTool } from '@mosaicstack/mcp-common';
import { z } from 'zod';
import {
  ServiceConfig,
  AuthConfig,
  MCPResult,
  ServiceOperation,
  AsyncResult
} from '@mosaicstack/mcp-common';
import { DomainConfig, getDomainConfig, detectDomainFromDescription } from '../../config/domains';
import { EnvironmentConfigLoader } from '../../config/environment-loader';
import { PlanningRoutingConfig, CommandRoutingOptions } from '../../config/routing-config';
import { TaskType } from '../../types/routing';
import { ProjectDetectionService } from '../../services/ProjectDetectionService';

export interface PlanningAgentConfig extends ServiceConfig {
  /** Agent type identifier */
  agentType: string;
  /** Preferred processing mode */
  processingStrategy: 'local-first' | 'remote-first' | 'local-only' | 'remote-only';
  /** Global MCP routing preferences */
  mcpRouting: {
    preferLocal: boolean;
    fallbackChain: string[];
    timeout: number;
  };
  /** Domain-specific configurations */
  domainConfigs: Record<string, any>;
  /** Model selection preferences */
  modelPreferences: {
    code: string[];
    analysis: string[];
    planning: string[];
    general: string[];
  };
}

export interface PlanningContext {
  projectId: string;
  domain?: string;
  businessType?: string;
  description?: string;
  constraints?: string[];
  preferences?: string[];
  // Project auto-detection fields
  projectName?: string;
  projectDescription?: string;
  projectType?: 'greenfield' | 'brownfield';
  projectPath?: string;
  [key: string]: any;
}

export interface PlanningRequest {
  operation: string;
  context: PlanningContext;
  parameters: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface PlanningResult {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    agent: string;
    processingMode: 'local' | 'remote' | 'hybrid';
    model?: string;
    duration: number;
    domain?: string;
    [key: string]: any;
  };
}

/**
 * Base class for all unified planning agents
 * Integrates with MosAIc MCP infrastructure for routing and execution
 */
export abstract class UnifiedPlanningAgent extends MCPServiceTool {
  protected planningConfig: PlanningAgentConfig;
  protected domainConfig?: DomainConfig;
  protected routingConfig: PlanningRoutingConfig;
  protected envLoader: EnvironmentConfigLoader;
  protected projectDetection: ProjectDetectionService;

  constructor(
    agentType: string,
    config: PlanningAgentConfig,
    authConfig: AuthConfig
  ) {
    super(agentType, config, authConfig);
    this.planningConfig = config;
    this.envLoader = EnvironmentConfigLoader.getInstance();
    this.routingConfig = new PlanningRoutingConfig();
    this.projectDetection = new ProjectDetectionService();
  }

  // Abstract properties that concrete agents must implement
  abstract get capabilities(): string[];
  abstract get description(): string;
  abstract get inputSchema(): z.ZodObject<any, any, any, any, any>;

  /**
   * Initialize the planning agent with domain detection and MCP setup
   */
  async initialize(context?: PlanningContext): Promise<void> {
    this.logger.info(`Initializing ${this.serviceName} planning agent`);

    // Auto-detect MosAIc project context
    await this.initializeProjectContext(context);

    // Auto-detect domain if not provided
    if (context?.description && !context.domain) {
      context.domain = detectDomainFromDescription(context.description);
      this.logger.info(`Auto-detected domain: ${context.domain}`);
    }

    // Load domain-specific configuration
    if (context?.domain) {
      this.domainConfig = getDomainConfig(context.domain);
      if (this.domainConfig) {
        this.logger.info(`Loaded domain config: ${this.domainConfig.name}`);
      }
    }

    // Initialize MCP connections based on global routing
    await this.initializeMCPConnections();
  }

  /**
   * Initialize project context by detecting .mosaic directory
   */
  private async initializeProjectContext(context?: PlanningContext): Promise<void> {
    try {
      const projectContext = await this.projectDetection.getProjectContext();
      
      if (projectContext.inProject && projectContext.project) {
        const project = projectContext.project;
        const displayInfo = this.projectDetection.getProjectDisplayInfo(project);
        
        this.logger.info(`Detected MosAIc project: ${displayInfo.name}`, {
          type: project.type,
          path: project.path,
          relativePath: projectContext.relativePath
        });

        // Update planning context with project information
        if (context) {
          // Use project ID if not already set
          if (!context.projectId) {
            if (project.type === 'greenfield') {
              context.projectId = (project.metadata as any).id;
            } else if (project.type === 'brownfield') {
              context.projectId = (project.metadata as any).remote_project.id;
            }
          }

          // Add project metadata to context
          context.projectName = displayInfo.name;
          context.projectDescription = displayInfo.description;
          context.projectType = project.type;
          context.projectPath = project.path;
        }

        // Validate project structure
        const validation = await this.projectDetection.validateDetectedProject(project);
        if (!validation.valid) {
          this.logger.warn('Project structure validation failed', {
            issues: validation.issues,
            recommendations: validation.recommendations
          });
        }
      } else {
        this.logger.info('No MosAIc project detected in current directory tree');
        this.logger.info('Consider running /init-mosaic to initialize project structure');
      }
    } catch (error) {
      this.logger.warn('Project detection failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Main execution method for planning operations
   * Enhanced with intelligent routing based on environment configuration
   */
  async executePlanning(request: PlanningRequest): Promise<PlanningResult> {
    const startTime = Date.now();
    
    try {
      // Validate the request
      const validatedRequest = await this.validatePlanningRequest(request);
      
      // Get intelligent routing decision
      const routingOptions: CommandRoutingOptions = {
        command: request.operation,
        taskType: this.mapOperationToTaskType(request.operation),
        complexity: this.assessComplexity(validatedRequest),
        content: JSON.stringify(validatedRequest.parameters),
        overrideStrategy: validatedRequest.metadata?.processingStrategy,
        projectId: validatedRequest.context.projectId
      };

      const routingDecision = await this.routingConfig.getRoutingDecision(routingOptions);
      
      this.logger.info(`Routing decision for ${request.operation}:`, {
        processingMode: routingDecision.processingMode,
        model: routingDecision.model,
        confidence: routingDecision.confidence,
        reasoning: routingDecision.reasoning
      });

      // Execute based on routing decision
      let result: any;
      switch (routingDecision.processingMode) {
        case 'local':
          result = await this.executeLocal(validatedRequest, routingDecision.model);
          break;
        case 'remote':
          result = await this.executeRemote(validatedRequest, routingDecision.model);
          break;
        case 'hybrid':
          result = await this.executeHybrid(validatedRequest, routingDecision.model, routingDecision.fallbackModel);
          break;
        default:
          throw new Error(`Unknown processing mode: ${routingDecision.processingMode}`);
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: result,
        metadata: {
          agent: this.serviceName,
          processingMode: routingDecision.processingMode,
          model: routingDecision.model,
          duration,
          domain: request.context.domain,
          confidence: routingDecision.confidence,
          reasoning: routingDecision.reasoning,
          estimatedTime: routingDecision.estimatedTime,
          actualTime: duration
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Planning execution failed`, {
        error: error instanceof Error ? error.message : String(error),
        request: this.sanitizeArgs(request),
        duration
      });

      return {
        success: false,
        error: {
          code: 'PLANNING_EXECUTION_FAILED',
          message: error instanceof Error ? error.message : String(error)
        },
        metadata: {
          agent: this.serviceName,
          processingMode: 'error',
          duration,
          domain: request.context.domain
        }
      };
    }
  }

  /**
   * Execute using local Ollama via MCP
   */
  protected async executeLocal(request: PlanningRequest, model?: string): Promise<any> {
    this.logger.info(`Executing local planning via MCP using model: ${model}`);
    
    // Use MCP Ollama service with specified model
    const mcpRequest = this.buildMCPRequest(request, 'local', model);
    return await this.callMCPService('ollama', mcpRequest);
  }

  /**
   * Execute using remote API via MCP
   */
  protected async executeRemote(request: PlanningRequest, model?: string): Promise<any> {
    this.logger.info(`Executing remote planning via MCP using model: ${model}`);
    
    // Use MCP remote service (Anthropic, OpenRouter, etc.)
    const mcpRequest = this.buildMCPRequest(request, 'remote', model);
    return await this.callMCPService('claude', mcpRequest);
  }

  /**
   * Execute using hybrid approach
   */
  protected async executeHybrid(request: PlanningRequest, primaryModel?: string, fallbackModel?: string): Promise<any> {
    this.logger.info(`Executing hybrid planning via MCP, primary: ${primaryModel}, fallback: ${fallbackModel}`);
    
    try {
      // Try local first for cost efficiency
      return await this.executeLocal(request, primaryModel);
    } catch (error) {
      this.logger.warn('Local execution failed, falling back to remote', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Fallback to remote with fallback model
      return await this.executeRemote(request, fallbackModel);
    }
  }

  /**
   * Determine processing strategy based on request and global config
   */
  protected determineProcessingStrategy(request: PlanningRequest): 'local' | 'remote' | 'hybrid' {
    // Check explicit strategy in request
    if (request.metadata?.processingStrategy) {
      return request.metadata.processingStrategy;
    }

    // Use agent configuration
    switch (this.planningConfig.processingStrategy) {
      case 'local-first':
        return 'hybrid'; // Try local first, fallback to remote
      case 'remote-first':
        return 'remote';
      case 'local-only':
        return 'local';
      case 'remote-only':
        return 'remote';
      default:
        return 'hybrid';
    }
  }

  /**
   * Build MCP request from planning request
   */
  protected buildMCPRequest(request: PlanningRequest, mode: 'local' | 'remote', model?: string): any {
    const baseRequest = {
      operation: request.operation,
      context: request.context,
      parameters: request.parameters,
      metadata: {
        ...request.metadata,
        agent: this.serviceName,
        domain: request.context.domain,
        processingMode: mode
      }
    };

    // Use provided model or fallback to preference-based selection
    const selectedModel = model || (mode === 'local' ? 
      this.getPreferredLocalModel(request.operation) : 
      this.getPreferredRemoteModel(request.operation)
    );

    if (mode === 'local') {
      return {
        ...baseRequest,
        model: selectedModel,
        options: {
          temperature: this.getTemperatureForOperation(request.operation),
          top_p: 0.8,
          num_predict: this.getTokenLimitForOperation(request.operation)
        }
      };
    } else {
      return {
        ...baseRequest,
        model: selectedModel,
        max_tokens: this.getTokenLimitForOperation(request.operation),
        temperature: this.getTemperatureForOperation(request.operation)
      };
    }
  }

  /**
   * Call MCP service with automatic routing through MCP orchestrator
   */
  protected async callMCPService(serviceName: string, request: any): Promise<any> {
    try {
      // Map service names to MCP tool names
      const toolMapping: Record<string, string> = {
        'ollama': 'ollama_generate',
        'claude': 'claude_generate', 
        'openrouter': 'openrouter_generate'
      };

      const toolName = toolMapping[serviceName];
      if (!toolName) {
        throw new Error(`Unknown service: ${serviceName}`);
      }

      // Call the MCP orchestrator via HTTP
      const mcpUrl = this.planningConfig.baseUrl || 'http://localhost:3456';
      const response = await fetch(`${mcpUrl}/mcp/tools/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': `${this.serviceName}/1.0.0`,
        },
        body: JSON.stringify({
          tool: toolName,
          arguments: request,
          metadata: {
            agent: this.serviceName,
            domain: request.context?.domain,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`MCP service call failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.isError) {
        throw new Error(`MCP service error: ${result.content?.[0]?.text || 'Unknown error'}`);
      }

      // Parse the response content
      const content = result.content?.[0]?.text;
      if (content) {
        try {
          return JSON.parse(content);
        } catch {
          return { response: content, raw: true };
        }
      }

      return result;

    } catch (error) {
      this.logger.error(`MCP service call failed for ${serviceName}`, {
        error: error instanceof Error ? error.message : String(error),
        serviceName,
        request: this.sanitizeArgs(request)
      });
      throw error;
    }
  }

  /**
   * Get preferred model for local execution
   * Now uses environment configuration for user-specified models
   */
  protected getPreferredLocalModel(operation: string): string {
    const taskType = this.mapOperationToTaskType(operation);
    return this.envLoader.getModelForTaskType(taskType);
  }

  /**
   * Get preferred model for remote execution
   */
  protected getPreferredRemoteModel(operation: string): string {
    // Default to Claude for remote execution
    return 'claude-3-5-sonnet-20241022';
  }

  /**
   * Get temperature setting for operation
   */
  protected getTemperatureForOperation(operation: string): number {
    if (operation.includes('code') || operation.includes('technical')) {
      return 0.2; // Lower temperature for technical precision
    }
    if (operation.includes('creative') || operation.includes('marketing')) {
      return 0.7; // Higher temperature for creativity
    }
    return 0.3; // Default balanced temperature
  }

  /**
   * Get token limit for operation
   */
  protected getTokenLimitForOperation(operation: string): number {
    if (operation.includes('complex') || operation.includes('detailed')) {
      return 1000;
    }
    if (operation.includes('summary') || operation.includes('simple')) {
      return 300;
    }
    return 500; // Default
  }

  /**
   * Initialize MCP connections based on configuration
   */
  protected async initializeMCPConnections(): Promise<void> {
    // Implementation will connect to MCP services
    this.logger.info('MCP connections initialized');
  }

  /**
   * Validate planning request
   */
  protected async validatePlanningRequest(request: PlanningRequest): Promise<PlanningRequest> {
    // Validate context
    if (!request.context.projectId) {
      throw new Error('Project ID is required in planning context');
    }

    // Validate domain if specified
    if (request.context.domain && !getDomainConfig(request.context.domain)) {
      throw new Error(`Invalid domain: ${request.context.domain}`);
    }

    return request;
  }

  /**
   * Apply domain-specific processing modifications
   */
  protected applyDomainConstraints(request: PlanningRequest): PlanningRequest {
    if (!this.domainConfig) {
      return request;
    }

    // Apply compliance requirements
    if (this.domainConfig.compliance.length > 0) {
      request.parameters.complianceRequirements = this.domainConfig.compliance;
    }

    // Apply complexity constraints
    request.parameters.complexity = this.domainConfig.complexity;

    // Apply typical business models
    request.parameters.typicalBusinessModels = this.domainConfig.typicalBusinessModels;

    return request;
  }

  /**
   * Create domain-aware prompts
   */
  protected createDomainPrompt(basePrompt: string, context: PlanningContext): string {
    if (!this.domainConfig) {
      return basePrompt;
    }

    const domainContext = `
Domain: ${this.domainConfig.name} (${this.domainConfig.description})
Complexity: ${this.domainConfig.complexity}
Compliance: ${this.domainConfig.compliance.join(', ')}
Typical Models: ${this.domainConfig.typicalBusinessModels.join(', ')}

${basePrompt}
`;

    return domainContext;
  }

  /**
   * Map planning operation to TaskType for router compatibility
   */
  protected mapOperationToTaskType(operation: string): TaskType {
    if (operation.includes('code') || operation.includes('tech') || operation.includes('technical')) {
      return 'code';
    }
    if (operation.includes('analysis') || operation.includes('analyze')) {
      return 'analysis';
    }
    if (operation.includes('documentation') || operation.includes('document')) {
      return 'documentation';
    }
    return 'general';
  }

  /**
   * Assess complexity of planning request for routing decisions
   */
  protected assessComplexity(request: PlanningRequest): number {
    let complexity = 2; // Base complexity

    // Analyze content size
    const contentSize = JSON.stringify(request.parameters).length;
    if (contentSize > 2000) complexity += 1;
    if (contentSize > 5000) complexity += 1;

    // Analyze operation type
    if (request.operation.includes('complex') || request.operation.includes('detailed')) {
      complexity += 2;
    }
    if (request.operation.includes('comprehensive') || request.operation.includes('full')) {
      complexity += 1;
    }

    // Domain complexity
    if (request.context.domain) {
      const domainConfig = getDomainConfig(request.context.domain);
      if (domainConfig && domainConfig.complexity === 'high') {
        complexity += 1;
      }
    }

    // Constraint complexity
    if (request.context.constraints && request.context.constraints.length > 3) {
      complexity += 1;
    }

    return Math.min(complexity, 5); // Cap at 5
  }

  // Implement the abstract executeOperation method from MCPServiceTool
  protected async executeOperation(
    operation: ServiceOperation,
    args: any
  ): AsyncResult<any> {
    // Convert MCP operation to planning request
    const planningRequest: PlanningRequest = {
      operation: operation.toString(),
      context: args.context || { projectId: args.projectId || 'default' },
      parameters: args.parameters || args,
      metadata: args.metadata || {}
    };

    const result = await this.executePlanning(planningRequest);
    
    if (result.success) {
      return this.createSuccessResult(result.data, result.metadata);
    } else {
      return this.createErrorResult(
        result.error?.code || 'PLANNING_ERROR',
        result.error?.message || 'Planning operation failed',
        result.error?.details
      );
    }
  }
}

export default UnifiedPlanningAgent;