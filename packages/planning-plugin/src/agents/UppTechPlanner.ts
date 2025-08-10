/**
 * UPP Technical Planner - Unified Agent
 * Technical architecture and implementation planning using MosAIc MCP infrastructure
 * Replaces upp-tech-planner-local with unified architecture
 */

import { z } from 'zod';
import { UnifiedPlanningAgent, PlanningAgentConfig, PlanningRequest } from './base/UnifiedPlanningAgent.js';
import { AuthConfig } from '@mosaicstack/mcp-common';
import { getDomainConfig } from '../config/domains.js';

// Input schema for technical planning operations
const TechnicalPlanningInputSchema = z.object({
  projectId: z.string().min(1),
  description: z.string().min(10),
  domain: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  scalabilityRequirements: z.string().optional(),
  performanceRequirements: z.string().optional(),
  securityRequirements: z.string().optional(),
  integrations: z.array(z.string()).optional(),
  teamSize: z.number().optional(),
  timeline: z.number().default(16), // weeks
  operation: z.enum(['architecture', 'tech-stack', 'implementation', 'complete-technical']).default('complete-technical')
});

export type TechnicalPlanningInput = z.infer<typeof TechnicalPlanningInputSchema>;

/**
 * Unified Technical Planning Agent
 * Uses MosAIc MCP infrastructure for local/remote routing
 */
export class UppTechPlanner extends UnifiedPlanningAgent {
  constructor(config?: Partial<PlanningAgentConfig>, authConfig?: AuthConfig) {
    const defaultConfig: PlanningAgentConfig = {
      agentType: 'upp-tech-planner',
      baseUrl: process.env.MCP_ORCHESTRATOR_URL || 'http://localhost:3456',
      timeout: 45000, // Longer timeout for complex technical analysis
      retryAttempts: 2,
      retryDelay: 1000,
      processingStrategy: 'local-first', // Prefer local for cost efficiency
      mcpRouting: {
        preferLocal: true,
        fallbackChain: ['ollama', 'claude', 'openrouter'],
        timeout: 40000
      },
      domainConfigs: {},
      modelPreferences: {
        code: ['llama3.2:3b', 'codellama:7b', 'llama3.2:1b'],
        analysis: ['llama3.2:3b', 'llama3.2:1b'],
        planning: ['llama3.2:3b', 'llama3.2:1b'],
        general: ['llama3.2:1b']
      },
      ...config
    };

    const defaultAuthConfig: AuthConfig = {
      type: 'none', // MCP handles auth
      ...authConfig
    };

    super('upp-tech-planner', defaultConfig, defaultAuthConfig);
  }

  get name(): string {
    return 'upp_tech_planner';
  }

  get capabilities(): string[] {
    return [
      'architecture-design',
      'tech-stack-selection',
      'scalability-planning',
      'performance-optimization',
      'security-design',
      'integration-planning',
      'infrastructure-design',
      'development-methodology'
    ];
  }

  get description(): string {
    return 'Unified technical planning with architecture design, tech stack selection, and implementation strategy';
  }

  get inputSchema(): z.ZodObject<any, any, any, any, any> {
    return TechnicalPlanningInputSchema;
  }

  /**
   * Execute technical planning with domain awareness
   */
  async planTechnical(input: TechnicalPlanningInput): Promise<any> {
    const context = {
      projectId: input.projectId,
      domain: input.domain,
      techStack: input.techStack,
      description: input.description
    };

    await this.initialize(context);

    const request: PlanningRequest = {
      operation: input.operation,
      context,
      parameters: {
        description: input.description,
        techStack: input.techStack,
        scalabilityRequirements: input.scalabilityRequirements,
        performanceRequirements: input.performanceRequirements,
        securityRequirements: input.securityRequirements,
        integrations: input.integrations,
        teamSize: input.teamSize,
        timeline: input.timeline
      },
      metadata: {
        capabilities: this.capabilities
      }
    };

    return await this.executePlanning(request);
  }

  /**
   * Override local execution with technical-specific logic
   */
  protected async executeLocal(request: PlanningRequest): Promise<any> {
    this.logger.info('Executing technical planning via local Ollama MCP');

    const prompt = this.createTechnicalPlanningPrompt(request);
    const mcpRequest = {
      prompt,
      model: this.getPreferredLocalModel(request.operation),
      options: {
        temperature: 0.1, // Very low temperature for technical precision
        top_p: 0.95,
        num_predict: 1200
      },
      system: this.getTechnicalPlanningSystemPrompt(request.context.domain),
      context: request.context
    };

    try {
      // Call Ollama via MCP orchestrator
      const mcpResponse = await this.callMCPService('ollama', mcpRequest);
      
      // Process the MCP response
      if (mcpResponse.response) {
        return await this.processTechnicalMCPResponse(mcpResponse, request, 'local');
      } else {
        // Fallback to technical planning logic
        return await this.executeTechnicalPlanningLogic(request, 'local');
      }
    } catch (error) {
      this.logger.warn('MCP Ollama call failed, using fallback logic', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return await this.executeTechnicalPlanningLogic(request, 'local');
    }
  }

  /**
   * Override remote execution with technical-specific logic
   */
  protected async executeRemote(request: PlanningRequest): Promise<any> {
    this.logger.info('Executing technical planning via remote Claude MCP');

    const prompt = this.createTechnicalPlanningPrompt(request);
    const mcpRequest = {
      messages: [
        {
          role: 'system',
          content: this.getTechnicalPlanningSystemPrompt(request.context.domain)
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      temperature: 0.1,
      context: request.context
    };

    try {
      // Call Claude via MCP orchestrator
      const mcpResponse = await this.callMCPService('claude', mcpRequest);
      
      // Process the MCP response
      if (mcpResponse.response || mcpResponse.content) {
        return await this.processTechnicalMCPResponse(mcpResponse, request, 'remote');
      } else {
        return await this.executeTechnicalPlanningLogic(request, 'remote');
      }
    } catch (error) {
      this.logger.warn('MCP Claude call failed, using fallback logic', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return await this.executeTechnicalPlanningLogic(request, 'remote');
    }
  }

  /**
   * Process MCP response for technical planning
   */
  private async processTechnicalMCPResponse(mcpResponse: any, request: PlanningRequest, mode: 'local' | 'remote'): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Extract response text
      let responseText = mcpResponse.response || mcpResponse.content?.[0]?.text || mcpResponse.raw || '';
      
      // Parse technical analysis from AI response
      const technicalAnalysis = this.parseTechnicalAnalysisFromResponse(responseText);
      const domainConfig = request.context.domain ? getDomainConfig(request.context.domain) : null;
      
      // Build comprehensive technical plan
      const architecture = this.buildArchitectureDesign(technicalAnalysis, request);
      const techStack = this.buildTechStackRecommendation(technicalAnalysis, request);
      const scalabilityPlan = this.buildScalabilityPlan(technicalAnalysis, request);
      const securityPlan = this.buildSecurityPlan(technicalAnalysis, request);
      const implementationPlan = this.buildImplementationPlan(architecture, request);
      
      const duration = Date.now() - startTime;

      return {
        success: true,
        aiResponse: responseText,
        technicalAnalysis,
        architecture,
        techStack,
        scalabilityPlan,
        securityPlan,
        implementationPlan,
        technicalConstraints: {
          domain: request.context.domain,
          complexity: domainConfig?.complexity || 'medium',
          compliance: domainConfig?.compliance || [],
          teamSize: request.parameters.teamSize,
          timeline: request.parameters.timeline || 16
        },
        metadata: {
          agent: this.serviceName,
          processingMode: mode,
          duration,
          domain: request.context.domain,
          model: mcpResponse.model || (mode === 'local' ? 'llama3.2:3b' : 'claude-3-5-sonnet'),
          source: 'mcp',
          mcpMetrics: mcpResponse.metrics
        }
      };

    } catch (error) {
      this.logger.error('Failed to process technical MCP response', {
        error: error instanceof Error ? error.message : String(error),
        mode
      });
      
      return await this.executeTechnicalPlanningLogic(request, mode);
    }
  }

  /**
   * Create technical planning prompt
   */
  private createTechnicalPlanningPrompt(request: PlanningRequest): string {
    const basePrompt = `Design comprehensive technical architecture for this software system:

Project: ${request.parameters.description}
Proposed Tech Stack: ${request.parameters.techStack?.join(', ') || 'Not specified'}
Scalability Requirements: ${request.parameters.scalabilityRequirements || 'Standard scalability'}
Performance Requirements: ${request.parameters.performanceRequirements || 'Standard performance'}
Security Requirements: ${request.parameters.securityRequirements || 'Standard security'}
Required Integrations: ${request.parameters.integrations?.join(', ') || 'None specified'}
Team Size: ${request.parameters.teamSize || 'Not specified'} developers
Timeline: ${request.parameters.timeline} weeks

Provide detailed technical design including:
1. System Architecture & Design Patterns
2. Technology Stack Recommendations & Justification
3. Database Design & Data Architecture
4. API Design & Integration Strategy
5. Scalability & Performance Strategy
6. Security Architecture & Implementation
7. Infrastructure & Deployment Strategy
8. Development Methodology & Best Practices
9. Quality Assurance & Testing Strategy
10. Monitoring & Observability Setup

Format as comprehensive technical specification with architectural diagrams concepts and implementation details.`;

    return this.domainConfig ? 
      this.createDomainPrompt(basePrompt, request.context) : 
      basePrompt;
  }

  /**
   * Get system prompt for technical planning
   */
  private getTechnicalPlanningSystemPrompt(domain?: string): string {
    let systemPrompt = `You are an expert software architect and technical lead. Provide detailed, technically sound architectural designs and implementation strategies.

Focus on:
- Scalable and maintainable system architecture
- Technology stack selection with clear justifications
- Database design and data architecture
- API design and integration patterns
- Security architecture and best practices
- Performance optimization strategies
- Infrastructure and deployment considerations
- Development methodologies and team workflows`;

    if (domain && this.domainConfig) {
      systemPrompt += `

Domain Expertise: ${this.domainConfig.name}
- Compliance Requirements: ${this.domainConfig.compliance.join(', ')}
- Typical Tech Stacks: ${this.inferTechStacks(domain)}
- Performance Considerations: ${this.inferPerformanceRequirements(domain)}
- Security Requirements: ${this.inferSecurityRequirements(domain)}`;
    }

    return systemPrompt;
  }

  // Core technical planning logic methods
  
  private executeTechnicalPlanningLogic(request: PlanningRequest, mode: 'local' | 'remote'): Promise<any> {
    // Fallback technical planning logic
    return Promise.resolve({
      success: true,
      architecture: { pattern: 'microservices', style: 'event-driven' },
      techStack: { 
        frontend: 'React/TypeScript', 
        backend: 'Node.js/Express', 
        database: 'PostgreSQL',
        cloud: 'AWS'
      },
      scalabilityPlan: { approach: 'horizontal-scaling', target: '10k-users' },
      metadata: { agent: this.serviceName, processingMode: mode, source: 'fallback' }
    });
  }

  private parseTechnicalAnalysisFromResponse(text: string): any {
    return {
      architectureInsights: this.extractTechnicalSection(text, ['architecture', 'design pattern', 'system design']),
      techStackInsights: this.extractTechnicalSection(text, ['technology', 'tech stack', 'framework']),
      scalabilityInsights: this.extractTechnicalSection(text, ['scalability', 'performance', 'load']),
      securityInsights: this.extractTechnicalSection(text, ['security', 'authentication', 'authorization'])
    };
  }

  private extractTechnicalSection(text: string, keywords: string[]): string {
    const lines = text.split('\n');
    let sectionContent = '';
    let inSection = false;
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (keywords.some(keyword => lowerLine.includes(keyword))) {
        inSection = true;
        sectionContent = line;
        continue;
      }
      
      if (inSection) {
        if (line.trim().match(/^\d+\./) || line.trim().match(/^[A-Z][^:]*:$/)) {
          break;
        }
        sectionContent += '\n' + line;
      }
    }
    
    return sectionContent.trim() || 'Not specified';
  }

  private buildArchitectureDesign(analysis: any, request: PlanningRequest): any {
    return {
      pattern: this.selectArchitecturePattern(request),
      style: this.selectArchitectureStyle(request),
      components: this.defineSystemComponents(request),
      dataFlow: 'event-driven-architecture',
      architectureInsights: analysis.architectureInsights
    };
  }

  private buildTechStackRecommendation(analysis: any, request: PlanningRequest): any {
    const domainStack = this.inferTechStacks(request.context.domain || 'general');
    const recommendedStack = request.parameters.techStack || this.parseStackFromDomain(domainStack);
    
    return {
      frontend: this.selectFrontendTech(recommendedStack, request),
      backend: this.selectBackendTech(recommendedStack, request),
      database: this.selectDatabaseTech(request),
      infrastructure: this.selectInfrastructureTech(request),
      devOps: ['Docker', 'CI/CD', 'Monitoring'],
      justification: analysis.techStackInsights,
      alternatives: this.provideTechAlternatives(recommendedStack)
    };
  }

  private buildScalabilityPlan(analysis: any, request: PlanningRequest): any {
    return {
      approach: this.selectScalabilityApproach(request.parameters.scalabilityRequirements),
      techniques: ['horizontal-scaling', 'caching', 'load-balancing'],
      bottlenecks: this.identifyPotentialBottlenecks(request),
      metrics: ['response-time', 'throughput', 'concurrent-users'],
      scalabilityInsights: analysis.scalabilityInsights
    };
  }

  private buildSecurityPlan(analysis: any, request: PlanningRequest): any {
    const domainSecurity = this.inferSecurityRequirements(request.context.domain || 'general');
    
    return {
      framework: 'zero-trust-architecture',
      authentication: 'oauth2-oidc',
      authorization: 'rbac',
      dataProtection: 'encryption-at-rest-and-transit',
      compliance: this.domainConfig?.compliance || [],
      threats: this.identifySecurityThreats(request),
      securityInsights: analysis.securityInsights,
      requirements: domainSecurity
    };
  }

  private buildImplementationPlan(architecture: any, request: PlanningRequest): any {
    return {
      methodology: this.selectDevelopmentMethodology(request.parameters.teamSize),
      phases: this.defineImplementationPhases(request.parameters.timeline),
      milestones: this.defineTechnicalMilestones(architecture),
      teamStructure: this.recommendTeamStructure(request.parameters.teamSize),
      timeline: `${request.parameters.timeline} weeks`
    };
  }

  private selectArchitecturePattern(request: PlanningRequest): string {
    if (request.parameters.scalabilityRequirements?.includes('high') || 
        request.parameters.teamSize && request.parameters.teamSize > 10) {
      return 'microservices';
    }
    if (request.parameters.teamSize && request.parameters.teamSize <= 3) {
      return 'monolith';
    }
    return 'modular-monolith';
  }

  private selectArchitectureStyle(request: PlanningRequest): string {
    if (request.parameters.performanceRequirements?.includes('real-time')) {
      return 'event-driven';
    }
    return 'layered-architecture';
  }

  private defineSystemComponents(request: PlanningRequest): string[] {
    return [
      'api-gateway',
      'authentication-service',
      'business-logic-service',
      'data-access-layer',
      'notification-service',
      'monitoring-service'
    ];
  }

  private selectFrontendTech(stack: any, request: PlanningRequest): string {
    if (Array.isArray(stack) && stack.some(tech => tech.includes('React'))) return 'React/TypeScript';
    if (Array.isArray(stack) && stack.some(tech => tech.includes('Vue'))) return 'Vue.js/TypeScript';
    return 'React/TypeScript'; // Default
  }

  private selectBackendTech(stack: any, request: PlanningRequest): string {
    if (Array.isArray(stack) && stack.some(tech => tech.includes('Node'))) return 'Node.js/Express';
    if (Array.isArray(stack) && stack.some(tech => tech.includes('Python'))) return 'Python/FastAPI';
    return 'Node.js/Express'; // Default
  }

  private selectDatabaseTech(request: PlanningRequest): string {
    if (request.parameters.scalabilityRequirements?.includes('high')) {
      return 'PostgreSQL + Redis';
    }
    if (request.context.domain === 'fintech') {
      return 'PostgreSQL'; // ACID compliance
    }
    return 'PostgreSQL';
  }

  private selectInfrastructureTech(request: PlanningRequest): string {
    if (request.parameters.scalabilityRequirements?.includes('global')) {
      return 'AWS/Multi-region';
    }
    return 'AWS/Docker/Kubernetes';
  }

  private parseStackFromDomain(domainStack: string): string[] {
    return domainStack.split(', ').map(tech => tech.trim());
  }

  private provideTechAlternatives(stack: any): Record<string, string[]> {
    return {
      frontend: ['React', 'Vue.js', 'Angular', 'Svelte'],
      backend: ['Node.js', 'Python', 'Java', 'Go'],
      database: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis'],
      cloud: ['AWS', 'Azure', 'Google Cloud', 'Vercel']
    };
  }

  private selectScalabilityApproach(requirements?: string): string {
    if (requirements?.includes('massive')) return 'microservices-mesh';
    if (requirements?.includes('high')) return 'horizontal-scaling';
    return 'vertical-then-horizontal';
  }

  private identifyPotentialBottlenecks(request: PlanningRequest): string[] {
    return [
      'database-connections',
      'api-rate-limits',
      'memory-usage',
      'network-bandwidth'
    ];
  }

  private identifySecurityThreats(request: PlanningRequest): string[] {
    const baseThreats = ['sql-injection', 'xss', 'csrf', 'data-breach'];
    
    if (request.context.domain === 'fintech') {
      baseThreats.push('financial-fraud', 'pci-compliance');
    } else if (request.context.domain === 'healthcare') {
      baseThreats.push('phi-exposure', 'hipaa-violation');
    }
    
    return baseThreats;
  }

  private selectDevelopmentMethodology(teamSize?: number): string {
    if (!teamSize || teamSize <= 3) return 'kanban';
    if (teamSize <= 8) return 'scrum';
    return 'scaled-agile';
  }

  private defineImplementationPhases(timeline: number): string[] {
    if (timeline <= 8) {
      return ['mvp-development', 'testing-deployment'];
    }
    if (timeline <= 16) {
      return ['foundation', 'core-features', 'testing', 'deployment'];
    }
    return ['architecture', 'foundation', 'core-features', 'advanced-features', 'optimization', 'deployment'];
  }

  private defineTechnicalMilestones(architecture: any): string[] {
    return [
      'architecture-approval',
      'development-environment-setup',
      'core-services-implementation',
      'integration-testing-complete',
      'performance-benchmarks-met',
      'security-audit-passed',
      'production-deployment'
    ];
  }

  private recommendTeamStructure(teamSize?: number): any {
    if (!teamSize || teamSize <= 3) {
      return { structure: 'full-stack-team', roles: ['full-stack-developer', 'devops'] };
    }
    if (teamSize <= 8) {
      return { 
        structure: 'cross-functional-team', 
        roles: ['frontend-dev', 'backend-dev', 'devops', 'qa', 'tech-lead'] 
      };
    }
    return { 
      structure: 'multiple-teams', 
      roles: ['frontend-team', 'backend-team', 'devops-team', 'qa-team', 'architects'] 
    };
  }

  private inferTechStacks(domain: string): string {
    const stacks: Record<string, string> = {
      'fintech': 'React/TypeScript, Node.js/Python, PostgreSQL, AWS, Docker',
      'healthcare': 'React/TypeScript, Java/Spring, PostgreSQL, AWS HIPAA, Kubernetes',
      'enterprise': 'React/Angular, Java/.NET, SQL Server/Oracle, Azure/AWS, Microservices',
      'consumer': 'React Native/Flutter, Node.js/Python, MongoDB/PostgreSQL, Vercel/Netlify'
    };
    return stacks[domain] || 'React/TypeScript, Node.js/Express, PostgreSQL, AWS, Docker';
  }

  private inferPerformanceRequirements(domain: string): string {
    const requirements: Record<string, string> = {
      'fintech': 'Sub-second response, 99.9% uptime, real-time processing',
      'healthcare': 'HIPAA compliant, secure data processing, audit trails',
      'enterprise': 'High concurrent users, integration scalability, reliability',
      'consumer': 'Fast load times, mobile optimization, global CDN'
    };
    return requirements[domain] || 'Standard web performance, scalable architecture';
  }

  private inferSecurityRequirements(domain: string): string {
    const requirements: Record<string, string> = {
      'fintech': 'PCI-DSS, SOX compliance, fraud detection, encryption',
      'healthcare': 'HIPAA, HITECH, data encryption, audit logging',
      'enterprise': 'SSO, RBAC, data governance, security monitoring',
      'consumer': 'OAuth, data privacy, secure communications'
    };
    return requirements[domain] || 'Standard web security, authentication, authorization';
  }
}

export default UppTechPlanner;