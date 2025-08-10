/**
 * UPP Marketing Planner - Unified Agent
 * Marketing strategy and campaign planning using MosAIc MCP infrastructure
 * Replaces upp-marketing-planner-local with unified architecture
 */

import { z } from 'zod';
import { UnifiedPlanningAgent, PlanningAgentConfig, PlanningRequest } from './base/UnifiedPlanningAgent.js';
import { AuthConfig } from '@mosaicstack/mcp-common';
import { getDomainConfig } from '../config/domains.js';

// Input schema for marketing planning operations
const MarketingPlanningInputSchema = z.object({
  projectId: z.string().min(1),
  description: z.string().min(10),
  domain: z.string().optional(),
  targetAudience: z.string().optional(),
  budget: z.number().optional(),
  timeline: z.number().default(6), // months
  channels: z.array(z.string()).optional(),
  competitiveAnalysis: z.string().optional(),
  brandPositioning: z.string().optional(),
  operation: z.enum(['brand-strategy', 'campaign-planning', 'channel-strategy', 'complete-marketing']).default('complete-marketing')
});

export type MarketingPlanningInput = z.infer<typeof MarketingPlanningInputSchema>;

/**
 * Unified Marketing Planning Agent
 * Uses MosAIc MCP infrastructure for local/remote routing
 */
export class UppMarketingPlanner extends UnifiedPlanningAgent {
  constructor(config?: Partial<PlanningAgentConfig>, authConfig?: AuthConfig) {
    const defaultConfig: PlanningAgentConfig = {
      agentType: 'upp-marketing-planner',
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

    super('upp-marketing-planner', defaultConfig, defaultAuthConfig);
  }

  get name(): string {
    return 'upp_marketing_planner';
  }

  get capabilities(): string[] {
    return [
      'brand-strategy',
      'audience-segmentation',
      'campaign-planning',
      'channel-optimization',
      'content-strategy',
      'competitive-analysis',
      'marketing-metrics',
      'growth-strategy'
    ];
  }

  get description(): string {
    return 'Unified marketing planning with brand strategy, campaign development, and growth optimization';
  }

  get inputSchema(): z.ZodObject<any, any, any, any, any> {
    return MarketingPlanningInputSchema;
  }

  /**
   * Execute marketing planning with domain awareness
   */
  async planMarketing(input: MarketingPlanningInput): Promise<any> {
    const context = {
      projectId: input.projectId,
      domain: input.domain,
      targetAudience: input.targetAudience,
      description: input.description
    };

    await this.initialize(context);

    const request: PlanningRequest = {
      operation: input.operation,
      context,
      parameters: {
        description: input.description,
        targetAudience: input.targetAudience,
        budget: input.budget,
        timeline: input.timeline,
        channels: input.channels,
        competitiveAnalysis: input.competitiveAnalysis,
        brandPositioning: input.brandPositioning
      },
      metadata: {
        capabilities: this.capabilities
      }
    };

    return await this.executePlanning(request);
  }

  /**
   * Override local execution with marketing-specific logic
   */
  protected async executeLocal(request: PlanningRequest): Promise<any> {
    this.logger.info('Executing marketing planning via local Ollama MCP');

    const prompt = this.createMarketingPlanningPrompt(request);
    const mcpRequest = {
      prompt,
      model: this.getPreferredLocalModel(request.operation),
      options: {
        temperature: 0.4, // Higher creativity for marketing
        top_p: 0.8,
        num_predict: 1000
      },
      system: this.getMarketingPlanningSystemPrompt(request.context.domain),
      context: request.context
    };

    try {
      // Call Ollama via MCP orchestrator
      const mcpResponse = await this.callMCPService('ollama', mcpRequest);
      
      // Process the MCP response
      if (mcpResponse.response) {
        return await this.processMarketingMCPResponse(mcpResponse, request, 'local');
      } else {
        // Fallback to marketing planning logic
        return await this.executeMarketingPlanningLogic(request, 'local');
      }
    } catch (error) {
      this.logger.warn('MCP Ollama call failed, using fallback logic', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return await this.executeMarketingPlanningLogic(request, 'local');
    }
  }

  /**
   * Override remote execution with marketing-specific logic
   */
  protected async executeRemote(request: PlanningRequest): Promise<any> {
    this.logger.info('Executing marketing planning via remote Claude MCP');

    const prompt = this.createMarketingPlanningPrompt(request);
    const mcpRequest = {
      messages: [
        {
          role: 'system',
          content: this.getMarketingPlanningSystemPrompt(request.context.domain)
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2500,
      temperature: 0.4,
      context: request.context
    };

    try {
      // Call Claude via MCP orchestrator
      const mcpResponse = await this.callMCPService('claude', mcpRequest);
      
      // Process the MCP response
      if (mcpResponse.response || mcpResponse.content) {
        return await this.processMarketingMCPResponse(mcpResponse, request, 'remote');
      } else {
        return await this.executeMarketingPlanningLogic(request, 'remote');
      }
    } catch (error) {
      this.logger.warn('MCP Claude call failed, using fallback logic', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return await this.executeMarketingPlanningLogic(request, 'remote');
    }
  }

  /**
   * Process MCP response for marketing planning
   */
  private async processMarketingMCPResponse(mcpResponse: any, request: PlanningRequest, mode: 'local' | 'remote'): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Extract response text
      let responseText = mcpResponse.response || mcpResponse.content?.[0]?.text || mcpResponse.raw || '';
      
      // Parse marketing analysis from AI response
      const marketingAnalysis = this.parseMarketingAnalysisFromResponse(responseText);
      const domainConfig = request.context.domain ? getDomainConfig(request.context.domain) : null;
      
      // Build comprehensive marketing plan
      const brandStrategy = this.enhanceBrandStrategy(marketingAnalysis, request);
      const audienceSegmentation = this.buildAudienceSegmentation(marketingAnalysis, request);
      const channelStrategy = this.buildChannelStrategy(marketingAnalysis, request);
      const campaignPlan = this.buildCampaignPlan(brandStrategy, audienceSegmentation, request);
      const marketingMetrics = this.defineMarketingMetrics(campaignPlan, request);
      
      const duration = Date.now() - startTime;

      return {
        success: true,
        aiResponse: responseText,
        marketingAnalysis,
        brandStrategy,
        audienceSegmentation,
        channelStrategy,
        campaignPlan,
        marketingMetrics,
        marketingConstraints: {
          domain: request.context.domain,
          complexity: domainConfig?.complexity || 'medium',
          compliance: domainConfig?.compliance || [],
          budget: request.parameters.budget,
          timeline: request.parameters.timeline || 6
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
      this.logger.error('Failed to process marketing MCP response', {
        error: error instanceof Error ? error.message : String(error),
        mode
      });
      
      return await this.executeMarketingPlanningLogic(request, mode);
    }
  }

  /**
   * Create marketing planning prompt
   */
  private createMarketingPlanningPrompt(request: PlanningRequest): string {
    const basePrompt = `Develop comprehensive marketing strategy for this business:

Project: ${request.parameters.description}
Target Audience: ${request.parameters.targetAudience || 'Not specified'}
Marketing Budget: ${request.parameters.budget ? `$${request.parameters.budget.toLocaleString()}` : 'Not specified'}
Timeline: ${request.parameters.timeline || 6} months
Preferred Channels: ${request.parameters.channels?.join(', ') || 'Not specified'}
Competition: ${request.parameters.competitiveAnalysis || 'Not specified'}
Brand Positioning: ${request.parameters.brandPositioning || 'Not specified'}

Provide comprehensive marketing strategy including:
1. Brand Strategy & Positioning
2. Target Audience Segmentation
3. Channel Strategy & Mix
4. Campaign Planning & Timeline
5. Content Strategy & Messaging
6. Marketing Budget Allocation
7. Performance Metrics & KPIs
8. Competitive Differentiation
9. Growth Strategy & Scaling

Format as structured marketing plan with specific tactics and timelines.`;

    return this.domainConfig ? 
      this.createDomainPrompt(basePrompt, request.context) : 
      basePrompt;
  }

  /**
   * Get system prompt for marketing planning
   */
  private getMarketingPlanningSystemPrompt(domain?: string): string {
    let systemPrompt = `You are an expert marketing strategist and growth consultant. Provide data-driven, actionable marketing strategies and campaign plans.

Focus on:
- Clear brand positioning and value proposition
- Detailed audience segmentation and personas
- Multi-channel marketing strategy
- Content strategy and messaging framework
- Campaign planning with specific tactics
- Budget allocation and ROI optimization
- Performance metrics and KPIs
- Growth strategy and scaling tactics`;

    if (domain && this.domainConfig) {
      systemPrompt += `

Domain Expertise: ${this.domainConfig.name}
- Typical Business Models: ${this.domainConfig.typicalBusinessModels.join(', ')}
- Marketing Channels: ${this.inferMarketingChannels(domain)}
- Key Marketing Metrics: ${this.inferMarketingMetrics(domain)}
- Regulatory Considerations: ${this.domainConfig.compliance.join(', ')}`;
    }

    return systemPrompt;
  }

  // Core marketing planning logic methods
  
  private executeMarketingPlanningLogic(request: PlanningRequest, mode: 'local' | 'remote'): Promise<any> {
    // Fallback marketing planning logic
    return Promise.resolve({
      success: true,
      brandStrategy: { positioning: 'innovative-solution', messaging: 'Transform your business' },
      channelStrategy: { primary: ['digital', 'content'], budget: 70 },
      campaignPlan: { phases: 3, duration: 6 },
      metadata: { agent: this.serviceName, processingMode: mode, source: 'fallback' }
    });
  }

  private parseMarketingAnalysisFromResponse(text: string): any {
    return {
      brandInsights: this.extractMarketingSection(text, ['brand', 'positioning', 'value prop']),
      audienceInsights: this.extractMarketingSection(text, ['audience', 'target', 'customer']),
      channelInsights: this.extractMarketingSection(text, ['channel', 'marketing', 'promotion']),
      competitiveInsights: this.extractMarketingSection(text, ['competitive', 'competitor', 'differentiation'])
    };
  }

  private extractMarketingSection(text: string, keywords: string[]): string {
    const lines = text.split('\n');
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (keywords.some(keyword => lowerLine.includes(keyword))) {
        return line.trim();
      }
    }
    return 'Not specified';
  }

  private enhanceBrandStrategy(analysis: any, request: PlanningRequest): any {
    return {
      positioning: request.parameters.brandPositioning || 'innovative-solution',
      messaging: analysis.brandInsights || 'Transform your business',
      valueProposition: 'Solve customer problems efficiently',
      brandPersonality: this.inferBrandPersonality(request.context.domain)
    };
  }

  private buildAudienceSegmentation(analysis: any, request: PlanningRequest): any {
    return {
      primarySegment: request.parameters.targetAudience || 'business-professionals',
      personas: this.createPersonas(request.context.domain),
      segmentationCriteria: analysis.audienceInsights,
      targetingStrategy: 'focused-targeting'
    };
  }

  private buildChannelStrategy(analysis: any, request: PlanningRequest): any {
    return {
      channels: request.parameters.channels || this.inferMarketingChannels(request.context.domain || 'general').split(', '),
      channelMix: { digital: 70, traditional: 20, pr: 10 },
      channelInsights: analysis.channelInsights,
      budget: request.parameters.budget || 50000
    };
  }

  private buildCampaignPlan(brand: any, audience: any, request: PlanningRequest): any {
    return {
      phases: 3,
      duration: request.parameters.timeline || 6,
      campaigns: [
        { name: 'Awareness', duration: 2, budget: 40 },
        { name: 'Consideration', duration: 2, budget: 35 },
        { name: 'Conversion', duration: 2, budget: 25 }
      ],
      timeline: `${request.parameters.timeline || 6}-month campaign`
    };
  }

  private defineMarketingMetrics(campaign: any, request: PlanningRequest): any {
    return {
      brandMetrics: ['brand-awareness', 'brand-recall', 'net-promoter-score'],
      performanceMetrics: ['cac', 'ltv', 'roas', 'conversion-rate'],
      digitalMetrics: ['ctr', 'cpm', 'engagement-rate', 'social-reach'],
      goals: {
        awareness: '25% increase',
        leads: '500 qualified leads',
        conversions: '10% conversion rate'
      }
    };
  }

  private inferMarketingChannels(domain: string): string {
    const channels: Record<string, string> = {
      'fintech': 'LinkedIn, Content Marketing, Webinars, Industry Events',
      'healthcare': 'Medical Journals, Healthcare Conferences, Referral Programs',
      'enterprise': 'LinkedIn, Direct Sales, Industry Publications, Trade Shows',
      'consumer': 'Social Media, Influencer Marketing, App Stores, PR'
    };
    return channels[domain] || 'Digital Marketing, Content Marketing, Social Media, Email';
  }

  private inferMarketingMetrics(domain: string): string {
    const metrics: Record<string, string> = {
      'fintech': 'CAC, LTV, Conversion Rate, User Acquisition',
      'healthcare': 'Patient Acquisition Cost, Provider Adoption, Clinical Outcomes',
      'enterprise': 'Lead Quality, Sales Cycle Length, Pipeline Velocity',
      'consumer': 'DAU, Retention Rate, Viral Coefficient, ARPU'
    };
    return metrics[domain] || 'CAC, LTV, ROAS, Conversion Rate';
  }

  private inferBrandPersonality(domain?: string): string[] {
    const personalities: Record<string, string[]> = {
      'fintech': ['trustworthy', 'innovative', 'secure'],
      'healthcare': ['caring', 'reliable', 'professional'],
      'enterprise': ['professional', 'efficient', 'scalable'],
      'consumer': ['friendly', 'accessible', 'engaging']
    };
    return personalities[domain || 'general'] || ['professional', 'innovative', 'reliable'];
  }

  private createPersonas(domain?: string): any[] {
    return [
      {
        name: 'Primary User',
        demographics: 'Business professional, 30-45',
        needs: 'Efficiency and results',
        channels: 'LinkedIn, Email, Industry publications'
      }
    ];
  }
}

export default UppMarketingPlanner;