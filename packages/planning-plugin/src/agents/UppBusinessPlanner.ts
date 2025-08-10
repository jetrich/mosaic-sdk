/**
 * UPP Business Planner - Unified Agent
 * Strategic business planning using MosAIc MCP infrastructure
 * Replaces upp-business-planner-local with unified architecture
 */

import { z } from 'zod';
import { UnifiedPlanningAgent, PlanningAgentConfig, PlanningRequest } from './base/UnifiedPlanningAgent.js';
import { AuthConfig } from '@mosaicstack/mcp-common';
import { getDomainConfig } from '../config/domains.js';

// Input schema for business planning operations
const BusinessPlanningInputSchema = z.object({
  projectId: z.string().min(1),
  description: z.string().min(10),
  domain: z.string().optional(),
  stakeholders: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
  businessType: z.string().optional(),
  targetMarket: z.string().optional(),
  competitiveLandscape: z.string().optional(),
  operation: z.enum(['strategic-analysis', 'business-model', 'market-analysis', 'complete-planning']).default('complete-planning')
});

export type BusinessPlanningInput = z.infer<typeof BusinessPlanningInputSchema>;

/**
 * Unified Business Planning Agent
 * Uses MosAIc MCP infrastructure for local/remote routing
 */
export class UppBusinessPlanner extends UnifiedPlanningAgent {
  constructor(config?: Partial<PlanningAgentConfig>, authConfig?: AuthConfig) {
    const defaultConfig: PlanningAgentConfig = {
      agentType: 'upp-business-planner',
      baseUrl: process.env.MCP_ORCHESTRATOR_URL || 'http://localhost:3456',
      timeout: 30000,
      retryAttempts: 2,
      retryDelay: 1000,
      processingStrategy: 'local-first', // Prefer local for cost efficiency
      mcpRouting: {
        preferLocal: true,
        fallbackChain: ['ollama', 'claude', 'openrouter'],
        timeout: 25000
      },
      domainConfigs: {},
      modelPreferences: {
        code: ['llama3.2:3b', 'llama3.2:1b'],
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

    super('upp-business-planner', defaultConfig, defaultAuthConfig);
  }

  get name(): string {
    return 'upp_business_planner';
  }

  get capabilities(): string[] {
    return [
      'strategic-analysis',
      'business-model-development', 
      'market-analysis',
      'competitive-assessment',
      'stakeholder-analysis',
      'success-metrics-definition'
    ];
  }

  get description(): string {
    return 'Unified business strategy planning with domain-aware analysis and MCP routing';
  }

  get inputSchema(): z.ZodObject<any, any, any, any, any> {
    return BusinessPlanningInputSchema;
  }

  /**
   * Execute business planning with domain awareness
   */
  async planBusiness(input: BusinessPlanningInput): Promise<any> {
    const context = {
      projectId: input.projectId,
      domain: input.domain,
      businessType: input.businessType,
      description: input.description
    };

    await this.initialize(context);

    const request: PlanningRequest = {
      operation: input.operation,
      context,
      parameters: {
        description: input.description,
        stakeholders: input.stakeholders,
        constraints: input.constraints,
        businessType: input.businessType,
        targetMarket: input.targetMarket,
        competitiveLandscape: input.competitiveLandscape
      },
      metadata: {
        capabilities: this.capabilities
      }
    };

    return await this.executePlanning(request);
  }

  /**
   * Override local execution with business-specific logic
   */
  protected async executeLocal(request: PlanningRequest): Promise<any> {
    this.logger.info('Executing business planning via local Ollama MCP');

    const prompt = this.createBusinessPlanningPrompt(request);
    const mcpRequest = {
      prompt,
      model: this.getPreferredLocalModel(request.operation),
      options: {
        temperature: 0.3,
        top_p: 0.8,
        num_predict: 800
      },
      system: this.getBusinessPlanningSystemPrompt(request.context.domain),
      context: request.context
    };

    try {
      // Call Ollama via MCP orchestrator
      const mcpResponse = await this.callMCPService('ollama', mcpRequest);
      
      // Process the MCP response
      if (mcpResponse.response) {
        return await this.processMCPResponse(mcpResponse, request, 'local');
      } else {
        // Fallback to business planning logic if MCP response is unexpected
        return await this.executeBusinessPlanningLogic(request, 'local');
      }
    } catch (error) {
      this.logger.warn('MCP Ollama call failed, using fallback logic', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Fallback to internal business planning logic
      return await this.executeBusinessPlanningLogic(request, 'local');
    }
  }

  /**
   * Override remote execution with business-specific logic  
   */
  protected async executeRemote(request: PlanningRequest): Promise<any> {
    this.logger.info('Executing business planning via remote Claude MCP');

    const prompt = this.createBusinessPlanningPrompt(request);
    const mcpRequest = {
      messages: [
        {
          role: 'system',
          content: this.getBusinessPlanningSystemPrompt(request.context.domain)
        },
        {
          role: 'user', 
          content: prompt
        }
      ],
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.3,
      context: request.context
    };

    try {
      // Call Claude via MCP orchestrator
      const mcpResponse = await this.callMCPService('claude', mcpRequest);
      
      // Process the MCP response
      if (mcpResponse.response || mcpResponse.content) {
        return await this.processMCPResponse(mcpResponse, request, 'remote');
      } else {
        // Fallback to business planning logic if MCP response is unexpected
        return await this.executeBusinessPlanningLogic(request, 'remote');
      }
    } catch (error) {
      this.logger.warn('MCP Claude call failed, using fallback logic', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Fallback to internal business planning logic
      return await this.executeBusinessPlanningLogic(request, 'remote');
    }
  }

  /**
   * Process MCP response and extract business planning insights
   */
  private async processMCPResponse(mcpResponse: any, request: PlanningRequest, mode: 'local' | 'remote'): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Extract the actual response text
      let responseText = mcpResponse.response || mcpResponse.content?.[0]?.text || mcpResponse.raw || '';
      
      // Try to parse structured business analysis from AI response
      const businessAnalysis = this.parseBusinessAnalysisFromResponse(responseText);
      const domainConfig = request.context.domain ? getDomainConfig(request.context.domain) : null;
      
      // Enhance with domain-specific constraints and fallback data
      const strategicFramework = this.enhanceStrategicFramework(businessAnalysis, request);
      const marketAnalysis = this.enhanceMarketAnalysis(businessAnalysis, request);
      const businessModel = this.enhanceBusinessModel(businessAnalysis, strategicFramework, marketAnalysis);
      const successMetrics = this.defineSuccessMetrics(businessModel, strategicFramework);
      
      const duration = Date.now() - startTime;

      return {
        success: true,
        aiResponse: responseText,
        businessAnalysis,
        strategicFramework,
        marketAnalysis,
        businessModel,
        successMetrics,
        businessConstraints: {
          domain: request.context.domain,
          complexity: domainConfig?.complexity || 'medium',
          compliance: domainConfig?.compliance || [],
          businessType: businessModel.type,
          targetMarket: marketAnalysis.targetMarket,
          competitivePosition: marketAnalysis.competitivePosition
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
      this.logger.error('Failed to process MCP response', {
        error: error instanceof Error ? error.message : String(error),
        mode
      });
      
      // Fallback to internal business planning logic
      return await this.executeBusinessPlanningLogic(request, mode);
    }
  }

  /**
   * Parse business analysis from AI response text
   */
  private parseBusinessAnalysisFromResponse(responseText: string): any {
    try {
      // Try to parse as JSON first (if AI returned structured data)
      const parsed = JSON.parse(responseText);
      if (parsed.businessModel || parsed.marketAnalysis || parsed.strategy) {
        return parsed;
      }
    } catch {
      // Not JSON, parse as text
    }

    // Extract key information from text response
    const businessAnalysis = {
      projectDescription: this.extractSection(responseText, ['business model', 'project', 'concept']),
      businessType: this.inferBusinessTypeFromText(responseText),
      complexity: this.inferComplexityFromText(responseText),
      targetMarket: this.extractSection(responseText, ['target market', 'market', 'audience']),
      competitiveAnalysis: this.extractSection(responseText, ['competitive', 'competition', 'competitors']),
      riskAssessment: this.extractSection(responseText, ['risk', 'challenges', 'threats']),
      strategicApproach: this.extractSection(responseText, ['strategy', 'approach', 'plan'])
    };

    return businessAnalysis;
  }

  /**
   * Extract section from AI response text
   */
  private extractSection(text: string, keywords: string[]): string {
    const lines = text.split('\n');
    let sectionContent = '';
    let inSection = false;
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      // Check if we're entering a relevant section
      if (keywords.some(keyword => lowerLine.includes(keyword))) {
        inSection = true;
        sectionContent = line;
        continue;
      }
      
      // If we're in a section, collect content until we hit another section
      if (inSection) {
        if (line.trim().match(/^\d+\./) || line.trim().match(/^[A-Z][^:]*:$/)) {
          // New section detected
          break;
        }
        sectionContent += '\n' + line;
      }
    }
    
    return sectionContent.trim() || 'Not specified';
  }

  /**
   * Enhance strategic framework with AI insights
   */
  private enhanceStrategicFramework(aiAnalysis: any, request: PlanningRequest): any {
    const baseFramework = {
      businessType: aiAnalysis.businessType || this.inferBusinessType(request.parameters.description),
      approach: aiAnalysis.strategicApproach || this.determineStrategicApproach(aiAnalysis),
      timeframe: this.estimateTimeframe(aiAnalysis.complexity || 'medium'),
      riskTolerance: this.assessRiskTolerance(aiAnalysis),
      scalabilityGoals: this.defineScalabilityGoals(aiAnalysis)
    };
    
    return baseFramework;
  }

  /**
   * Enhance market analysis with AI insights
   */
  private enhanceMarketAnalysis(aiAnalysis: any, request: PlanningRequest): any {
    return {
      targetMarket: aiAnalysis.targetMarket || request.parameters.targetMarket || 'small-business',
      marketSize: this.estimateMarketSize(aiAnalysis.businessType || 'b2b-saas'),
      competitiveLandscape: aiAnalysis.competitiveAnalysis || request.parameters.competitiveLandscape || 'moderate',
      competitivePosition: this.assessInitialPosition(aiAnalysis),
      marketEntry: this.recommendMarketEntry(aiAnalysis),
      opportunityScore: this.calculateOpportunityScore(aiAnalysis)
    };
  }

  /**
   * Enhance business model with AI insights
   */
  private enhanceBusinessModel(aiAnalysis: any, strategicFramework: any, marketAnalysis: any): any {
    return {
      type: strategicFramework.businessType,
      revenueModel: this.determineRevenueModel(strategicFramework.businessType),
      customerSegments: [marketAnalysis.targetMarket],
      valueProposition: aiAnalysis.valueProposition || this.createValueProposition(strategicFramework, marketAnalysis),
      channels: this.recommendChannels(strategicFramework.businessType),
      keyResources: this.identifyKeyResources(strategicFramework),
      costStructure: this.analyzeCostStructure(strategicFramework)
    };
  }

  /**
   * Core business planning logic (implementation)
   */
  private async executeBusinessPlanningLogic(request: PlanningRequest, mode: 'local' | 'remote'): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Get domain configuration for constraints
      const domainConfig = request.context.domain ? getDomainConfig(request.context.domain) : null;
      
      // Analyze project description and parameters
      const businessAnalysis = await this.analyzeBusinessContext(request, domainConfig);
      const strategicFramework = await this.developStrategicFramework(businessAnalysis, request);
      const marketAnalysis = await this.analyzeMarketOpportunity(strategicFramework, request);
      const businessModel = await this.defineBusinessModel(strategicFramework, marketAnalysis);
      const successMetrics = await this.defineSuccessMetrics(businessModel, strategicFramework);

      const duration = Date.now() - startTime;

      return {
        success: true,
        businessAnalysis,
        strategicFramework, 
        marketAnalysis,
        businessModel,
        successMetrics,
        businessConstraints: {
          domain: request.context.domain,
          complexity: domainConfig?.complexity || 'medium',
          compliance: domainConfig?.compliance || [],
          businessType: businessModel.type,
          targetMarket: marketAnalysis.primarySegment,
          competitivePosition: marketAnalysis.competitivePosition
        },
        metadata: {
          agent: this.serviceName,
          processingMode: mode,
          duration,
          domain: request.context.domain,
          model: mode === 'local' ? 'llama3.2:3b' : 'claude-3-5-sonnet'
        }
      };

    } catch (error) {
      // Return fallback business strategy
      return this.generateFallbackBusinessStrategy(request);
    }
  }

  /**
   * Create business planning prompt
   */
  private createBusinessPlanningPrompt(request: PlanningRequest): string {
    const basePrompt = `Analyze this business concept and create a strategic framework:

Project: ${request.parameters.description}
Target Market: ${request.parameters.targetMarket || 'General business market'}
Business Type: ${request.parameters.businessType || 'B2B SaaS'}
Competition: ${request.parameters.competitiveLandscape || 'Moderate competition'}

Analyze and provide:
1. Business Model Analysis
2. Target Market Assessment  
3. Competitive Position
4. Strategic Approach
5. Success Metrics
6. Risk Assessment

Format as structured analysis with clear sections.`;

    return this.domainConfig ? 
      this.createDomainPrompt(basePrompt, request.context) : 
      basePrompt;
  }

  /**
   * Get system prompt for business planning
   */
  private getBusinessPlanningSystemPrompt(domain?: string): string {
    let systemPrompt = `You are an expert business strategist and planning consultant. Provide structured, actionable business analysis and strategic recommendations.

Focus on:
- Clear business model definition
- Market opportunity assessment
- Competitive positioning
- Strategic approach recommendations  
- Measurable success metrics
- Risk identification and mitigation`;

    if (domain && this.domainConfig) {
      systemPrompt += `

Domain Expertise: ${this.domainConfig.name}
- Compliance Requirements: ${this.domainConfig.compliance.join(', ')}
- Typical Business Models: ${this.domainConfig.typicalBusinessModels.join(', ')}
- Market Characteristics: ${this.domainConfig.marketCharacteristics?.competitionLevel || 'moderate'} competition
- Regulatory Context: ${this.domainConfig.regulatoryRequirements?.join(', ') || 'Standard business regulations'}`;
    }

    return systemPrompt;
  }

  /**
   * Analyze business context and requirements
   */
  private async analyzeBusinessContext(request: PlanningRequest, domainConfig: any): Promise<any> {
    return {
      projectDescription: request.parameters.description,
      domain: request.context.domain,
      complexity: domainConfig?.complexity || this.inferComplexity(request.parameters.description),
      stakeholders: request.parameters.stakeholders || ['founders', 'customers', 'investors'],
      constraints: request.parameters.constraints || [],
      businessType: request.parameters.businessType || this.inferBusinessType(request.parameters.description)
    };
  }

  /**
   * Develop strategic framework
   */
  private async developStrategicFramework(businessAnalysis: any, request: PlanningRequest): Promise<any> {
    return {
      businessType: businessAnalysis.businessType,
      approach: this.determineStrategicApproach(businessAnalysis),
      timeframe: this.estimateTimeframe(businessAnalysis.complexity),
      riskTolerance: this.assessRiskTolerance(businessAnalysis),
      scalabilityGoals: this.defineScalabilityGoals(businessAnalysis)
    };
  }

  /**
   * Analyze market opportunity
   */
  private async analyzeMarketOpportunity(strategicFramework: any, request: PlanningRequest): Promise<any> {
    return {
      targetMarket: request.parameters.targetMarket || 'small-business',
      marketSize: this.estimateMarketSize(strategicFramework.businessType),
      competitiveLandscape: request.parameters.competitiveLandscape || 'moderate',
      competitivePosition: this.assessInitialPosition(strategicFramework),
      marketEntry: this.recommendMarketEntry(strategicFramework),
      opportunityScore: this.calculateOpportunityScore(strategicFramework)
    };
  }

  /**
   * Define business model
   */
  private async defineBusinessModel(strategicFramework: any, marketAnalysis: any): Promise<any> {
    return {
      type: strategicFramework.businessType,
      revenueModel: this.determineRevenueModel(strategicFramework.businessType),
      customerSegments: [marketAnalysis.targetMarket],
      valueProposition: this.createValueProposition(strategicFramework, marketAnalysis),
      channels: this.recommendChannels(strategicFramework.businessType),
      keyResources: this.identifyKeyResources(strategicFramework),
      costStructure: this.analyzeCostStructure(strategicFramework)
    };
  }

  /**
   * Define success metrics
   */
  private async defineSuccessMetrics(businessModel: any, strategicFramework: any): Promise<any> {
    const baseMetrics = this.getBaseMetricsByBusinessType(businessModel.type);
    
    return {
      primaryMetrics: baseMetrics.primary,
      secondaryMetrics: baseMetrics.secondary,
      targets: this.setInitialTargets(baseMetrics, strategicFramework.timeframe),
      timeline: strategicFramework.timeframe,
      milestones: this.defineMilestones(strategicFramework)
    };
  }

  /**
   * Generate fallback business strategy when AI fails
   */
  private generateFallbackBusinessStrategy(request: PlanningRequest): any {
    const businessType = request.parameters.businessType || 'b2b-saas';
    
    return {
      success: true,
      businessAnalysis: {
        projectDescription: request.parameters.description,
        domain: request.context.domain,
        complexity: 'medium',
        businessType: businessType
      },
      strategicFramework: {
        businessType: businessType,
        approach: 'product-led',
        timeframe: 'medium-term',
        riskTolerance: 'moderate'
      },
      marketAnalysis: {
        targetMarket: 'small-business',
        marketSize: 'medium',
        competitiveLandscape: 'moderate',
        competitivePosition: 'challenger'
      },
      businessModel: {
        type: businessType,
        revenueModel: 'subscription',
        customerSegments: ['small-business'],
        valueProposition: 'Solve customer problems efficiently'
      },
      businessConstraints: {
        domain: request.context.domain,
        complexity: 'medium',
        businessType: businessType,
        targetMarket: 'small-business'
      },
      metadata: {
        agent: this.serviceName,
        processingMode: 'fallback',
        model: 'fallback'
      }
    };
  }

  // Helper methods for business analysis
  private inferComplexity(description: string): string {
    if (description.includes('enterprise') || description.includes('compliance')) return 'complex';
    if (description.includes('simple') || description.includes('basic')) return 'simple';
    return 'medium';
  }

  private inferBusinessType(description: string): string {
    if (description.includes('marketplace')) return 'marketplace';
    if (description.includes('enterprise')) return 'enterprise';
    if (description.includes('consumer') || description.includes('mobile app')) return 'consumer';
    return 'b2b-saas';
  }

  private determineStrategicApproach(analysis: any): string {
    if (analysis.businessType === 'marketplace') return 'market-first';
    if (analysis.businessType === 'consumer') return 'user-experience-led';
    if (analysis.complexity === 'simple') return 'lean-startup';
    return 'product-led';
  }

  private estimateTimeframe(complexity: string): string {
    switch (complexity) {
      case 'simple': return 'short-term';
      case 'complex': return 'long-term';
      default: return 'medium-term';
    }
  }

  private assessRiskTolerance(analysis: any): string {
    if (analysis.domain === 'fintech' || analysis.domain === 'healthcare') return 'low';
    if (analysis.businessType === 'consumer') return 'high';
    return 'moderate';
  }

  private defineScalabilityGoals(analysis: any): string {
    if (analysis.businessType === 'marketplace') return 'network-effects';
    if (analysis.businessType === 'b2b-saas') return 'subscription-growth';
    return 'user-base-expansion';
  }

  private estimateMarketSize(businessType: string): string {
    const marketSizes = {
      'b2b-saas': 'large',
      'marketplace': 'medium',
      'enterprise': 'medium',
      'consumer': 'large'
    };
    return marketSizes[businessType as keyof typeof marketSizes] || 'medium';
  }

  private assessInitialPosition(framework: any): string {
    if (framework.approach === 'market-first') return 'market-creator';
    if (framework.riskTolerance === 'low') return 'fast-follower';
    return 'challenger';
  }

  private recommendMarketEntry(framework: any): string {
    if (framework.businessType === 'marketplace') return 'two-sided-growth';
    if (framework.approach === 'lean-startup') return 'mvp-validation';
    return 'direct-market-entry';
  }

  private calculateOpportunityScore(framework: any): number {
    // Simple scoring algorithm (0-100)
    let score = 50;
    if (framework.businessType === 'b2b-saas') score += 20;
    if (framework.approach === 'product-led') score += 15;
    if (framework.riskTolerance === 'moderate') score += 10;
    return Math.min(100, score);
  }

  private determineRevenueModel(businessType: string): string {
    const revenueModels = {
      'b2b-saas': 'subscription',
      'marketplace': 'transaction-fee',
      'enterprise': 'license-plus-services',
      'consumer': 'freemium'
    };
    return revenueModels[businessType as keyof typeof revenueModels] || 'subscription';
  }

  private createValueProposition(framework: any, market: any): string {
    return `Solve ${market.targetMarket} problems with ${framework.businessType} solution`;
  }

  private recommendChannels(businessType: string): string[] {
    const channelMap = {
      'b2b-saas': ['direct-sales', 'content-marketing', 'partnerships'],
      'marketplace': ['organic-growth', 'paid-acquisition', 'partnerships'],
      'enterprise': ['direct-sales', 'channel-partners', 'consultants'],
      'consumer': ['app-stores', 'social-media', 'referrals']
    };
    return channelMap[businessType as keyof typeof channelMap] || ['direct-sales', 'digital-marketing'];
  }

  private identifyKeyResources(framework: any): string[] {
    return ['development-team', 'technology-platform', 'customer-relationships'];
  }

  private analyzeCostStructure(framework: any): any {
    return {
      development: 'high',
      marketing: 'medium',
      operations: 'low',
      distribution: framework.businessType === 'marketplace' ? 'high' : 'medium'
    };
  }

  private getBaseMetricsByBusinessType(businessType: string): any {
    const metricMap = {
      'b2b-saas': {
        primary: ['MRR', 'churn-rate', 'CAC'],
        secondary: ['LTV', 'expansion-revenue', 'product-adoption']
      },
      'marketplace': {
        primary: ['GMV', 'take-rate', 'active-users'],
        secondary: ['liquidity', 'retention', 'network-effects']
      },
      'enterprise': {
        primary: ['contract-value', 'win-rate', 'implementation-success'],
        secondary: ['upsell-rate', 'customer-satisfaction', 'renewal-rate']
      },
      'consumer': {
        primary: ['DAU', 'retention', 'viral-coefficient'],
        secondary: ['conversion-rate', 'ARPU', 'engagement-score']
      }
    };
    return metricMap[businessType as keyof typeof metricMap] || metricMap['b2b-saas'];
  }

  private setInitialTargets(metrics: any, timeframe: string): any {
    // Set conservative initial targets based on timeframe
    const multiplier = timeframe === 'short-term' ? 0.8 : timeframe === 'long-term' ? 1.2 : 1.0;
    
    return {
      [metrics.primary[0]]: Math.round(1000 * multiplier),
      [metrics.primary[1]]: `${Math.round(5 * multiplier)}%`,
      [metrics.primary[2]]: Math.round(100 * multiplier)
    };
  }

  private defineMilestones(framework: any): string[] {
    return [
      'Product-market fit validation',
      'First paying customers', 
      'Sustainable growth metrics',
      'Market expansion readiness'
    ];
  }

  // Additional helper methods for AI response processing

  /**
   * Infer business type from AI response text
   */
  private inferBusinessTypeFromText(text: string): string {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('marketplace') || lowerText.includes('platform connecting')) return 'marketplace';
    if (lowerText.includes('enterprise') || lowerText.includes('large organization')) return 'enterprise';
    if (lowerText.includes('consumer') || lowerText.includes('mobile app') || lowerText.includes('b2c')) return 'consumer';
    if (lowerText.includes('saas') || lowerText.includes('software as a service') || lowerText.includes('b2b')) return 'b2b-saas';
    return 'b2b-saas'; // default
  }

  /**
   * Infer complexity from AI response text
   */
  private inferComplexityFromText(text: string): string {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('complex') || lowerText.includes('enterprise') || lowerText.includes('compliance')) return 'complex';
    if (lowerText.includes('simple') || lowerText.includes('basic') || lowerText.includes('mvp')) return 'simple';
    return 'medium'; // default
  }
}

export default UppBusinessPlanner;