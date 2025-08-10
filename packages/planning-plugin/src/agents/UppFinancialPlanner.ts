/**
 * UPP Financial Planner - Unified Agent
 * Financial modeling and planning using MosAIc MCP infrastructure
 * Replaces upp-financial-planner-local with unified architecture
 */

import { z } from 'zod';
import { UnifiedPlanningAgent, PlanningAgentConfig, PlanningRequest } from './base/UnifiedPlanningAgent.js';
import { AuthConfig } from '@mosaicstack/mcp-common';
import { getDomainConfig } from '../config/domains.js';

// Input schema for financial planning operations
const FinancialPlanningInputSchema = z.object({
  projectId: z.string().min(1),
  description: z.string().min(10),
  domain: z.string().optional(),
  businessModel: z.string().optional(),
  revenueStreams: z.array(z.string()).optional(),
  initialFunding: z.number().optional(),
  projectionPeriod: z.number().default(24), // months
  marketSize: z.string().optional(),
  operation: z.enum(['revenue-model', 'cash-flow', 'funding-plan', 'complete-financial']).default('complete-financial')
});

export type FinancialPlanningInput = z.infer<typeof FinancialPlanningInputSchema>;

/**
 * Unified Financial Planning Agent
 * Uses MosAIc MCP infrastructure for local/remote routing
 */
export class UppFinancialPlanner extends UnifiedPlanningAgent {
  constructor(config?: Partial<PlanningAgentConfig>, authConfig?: AuthConfig) {
    const defaultConfig: PlanningAgentConfig = {
      agentType: 'upp-financial-planner',
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

    super('upp-financial-planner', defaultConfig, defaultAuthConfig);
  }

  get name(): string {
    return 'upp_financial_planner';
  }

  get capabilities(): string[] {
    return [
      'revenue-modeling',
      'cash-flow-analysis',
      'funding-strategy',
      'financial-projections',
      'cost-structure-analysis',
      'break-even-analysis',
      'scenario-planning'
    ];
  }

  get description(): string {
    return 'Unified financial planning with revenue modeling, cash flow analysis, and funding strategies';
  }

  get inputSchema(): z.ZodObject<any, any, any, any, any> {
    return FinancialPlanningInputSchema;
  }

  /**
   * Execute financial planning with domain awareness
   */
  async planFinancials(input: FinancialPlanningInput): Promise<any> {
    const context = {
      projectId: input.projectId,
      domain: input.domain,
      businessModel: input.businessModel,
      description: input.description
    };

    await this.initialize(context);

    const request: PlanningRequest = {
      operation: input.operation,
      context,
      parameters: {
        description: input.description,
        businessModel: input.businessModel,
        revenueStreams: input.revenueStreams,
        initialFunding: input.initialFunding,
        projectionPeriod: input.projectionPeriod,
        marketSize: input.marketSize
      },
      metadata: {
        capabilities: this.capabilities
      }
    };

    return await this.executePlanning(request);
  }

  /**
   * Override local execution with financial-specific logic
   */
  protected async executeLocal(request: PlanningRequest): Promise<any> {
    this.logger.info('Executing financial planning via local Ollama MCP');

    const prompt = this.createFinancialPlanningPrompt(request);
    const mcpRequest = {
      prompt,
      model: this.getPreferredLocalModel(request.operation),
      options: {
        temperature: 0.2, // Lower temperature for financial precision
        top_p: 0.9,
        num_predict: 1000
      },
      system: this.getFinancialPlanningSystemPrompt(request.context.domain),
      context: request.context
    };

    try {
      // Call Ollama via MCP orchestrator
      const mcpResponse = await this.callMCPService('ollama', mcpRequest);
      
      // Process the MCP response
      if (mcpResponse.response) {
        return await this.processFinancialMCPResponse(mcpResponse, request, 'local');
      } else {
        // Fallback to financial planning logic
        return await this.executeFinancialPlanningLogic(request, 'local');
      }
    } catch (error) {
      this.logger.warn('MCP Ollama call failed, using fallback logic', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return await this.executeFinancialPlanningLogic(request, 'local');
    }
  }

  /**
   * Override remote execution with financial-specific logic
   */
  protected async executeRemote(request: PlanningRequest): Promise<any> {
    this.logger.info('Executing financial planning via remote Claude MCP');

    const prompt = this.createFinancialPlanningPrompt(request);
    const mcpRequest = {
      messages: [
        {
          role: 'system',
          content: this.getFinancialPlanningSystemPrompt(request.context.domain)
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2500,
      temperature: 0.2,
      context: request.context
    };

    try {
      // Call Claude via MCP orchestrator
      const mcpResponse = await this.callMCPService('claude', mcpRequest);
      
      // Process the MCP response
      if (mcpResponse.response || mcpResponse.content) {
        return await this.processFinancialMCPResponse(mcpResponse, request, 'remote');
      } else {
        return await this.executeFinancialPlanningLogic(request, 'remote');
      }
    } catch (error) {
      this.logger.warn('MCP Claude call failed, using fallback logic', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return await this.executeFinancialPlanningLogic(request, 'remote');
    }
  }

  /**
   * Process MCP response for financial planning
   */
  private async processFinancialMCPResponse(mcpResponse: any, request: PlanningRequest, mode: 'local' | 'remote'): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Extract response text
      let responseText = mcpResponse.response || mcpResponse.content?.[0]?.text || mcpResponse.raw || '';
      
      // Parse financial analysis from AI response
      const financialAnalysis = this.parseFinancialAnalysisFromResponse(responseText);
      const domainConfig = request.context.domain ? getDomainConfig(request.context.domain) : null;
      
      // Build comprehensive financial plan
      const revenueModel = this.enhanceRevenueModel(financialAnalysis, request);
      const costStructure = this.enhanceCostStructure(financialAnalysis, request);
      const cashFlowProjection = this.buildCashFlowProjection(revenueModel, costStructure, request);
      const fundingStrategy = this.buildFundingStrategy(financialAnalysis, cashFlowProjection, request);
      const financialMetrics = this.calculateFinancialMetrics(cashFlowProjection, fundingStrategy);
      
      const duration = Date.now() - startTime;

      return {
        success: true,
        aiResponse: responseText,
        financialAnalysis,
        revenueModel,
        costStructure,
        cashFlowProjection,
        fundingStrategy,
        financialMetrics,
        financialConstraints: {
          domain: request.context.domain,
          complexity: domainConfig?.complexity || 'medium',
          compliance: domainConfig?.compliance || [],
          businessModel: request.parameters.businessModel,
          projectionPeriod: request.parameters.projectionPeriod || 24
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
      this.logger.error('Failed to process financial MCP response', {
        error: error instanceof Error ? error.message : String(error),
        mode
      });
      
      return await this.executeFinancialPlanningLogic(request, mode);
    }
  }

  /**
   * Create financial planning prompt
   */
  private createFinancialPlanningPrompt(request: PlanningRequest): string {
    const basePrompt = `Create comprehensive financial projections for this business:

Project: ${request.parameters.description}
Business Model: ${request.parameters.businessModel || 'Not specified'}
Revenue Streams: ${request.parameters.revenueStreams?.join(', ') || 'Not specified'}
Initial Funding: ${request.parameters.initialFunding ? `$${request.parameters.initialFunding.toLocaleString()}` : 'Not specified'}
Projection Period: ${request.parameters.projectionPeriod || 24} months
Market Size: ${request.parameters.marketSize || 'Not specified'}

Provide detailed analysis including:
1. Revenue Model & Projections
2. Cost Structure Analysis
3. Monthly Cash Flow Projections
4. Break-even Analysis
5. Funding Requirements
6. Key Financial Metrics & KPIs
7. Scenario Analysis (Best/Worst/Expected)
8. Financial Risk Assessment

Format as structured financial analysis with specific numbers and assumptions.`;

    return this.domainConfig ? 
      this.createDomainPrompt(basePrompt, request.context) : 
      basePrompt;
  }

  /**
   * Get system prompt for financial planning
   */
  private getFinancialPlanningSystemPrompt(domain?: string): string {
    let systemPrompt = `You are an expert financial analyst and planning consultant. Provide detailed, data-driven financial projections and strategic financial recommendations.

Focus on:
- Realistic revenue projections based on business model
- Comprehensive cost structure analysis
- Cash flow forecasting with monthly detail
- Break-even analysis and unit economics
- Capital requirements and funding strategy
- Key financial metrics and KPIs
- Scenario planning and risk assessment
- Industry-specific financial benchmarks`;

    if (domain && this.domainConfig) {
      systemPrompt += `

Domain Expertise: ${this.domainConfig.name}
- Typical Business Models: ${this.domainConfig.typicalBusinessModels.join(', ')}
- Funding Patterns: ${this.inferFundingPatterns(domain)}
- Key Financial Metrics: ${this.inferKeyMetrics(domain)}
- Regulatory Costs: ${this.domainConfig.compliance.join(', ')}`;
    }

    return systemPrompt;
  }

  // Core financial planning logic methods would go here...
  // (For brevity, implementing key methods only)

  private executeFinancialPlanningLogic(request: PlanningRequest, mode: 'local' | 'remote'): Promise<any> {
    // Fallback financial planning logic
    return Promise.resolve({
      success: true,
      revenueModel: { type: 'subscription', monthlyGrowth: 20 },
      costStructure: { development: 60, marketing: 25, operations: 15 },
      fundingStrategy: { type: 'seed', amount: 500000 },
      metadata: { agent: this.serviceName, processingMode: mode, source: 'fallback' }
    });
  }

  private parseFinancialAnalysisFromResponse(text: string): any {
    // Parse financial data from AI response
    return {
      revenueProjections: this.extractFinancialSection(text, ['revenue', 'income', 'sales']),
      costAnalysis: this.extractFinancialSection(text, ['cost', 'expense', 'burn']),
      fundingNeeds: this.extractFinancialSection(text, ['funding', 'capital', 'investment'])
    };
  }

  private extractFinancialSection(text: string, keywords: string[]): string {
    // Extract financial sections from text
    const lines = text.split('\n');
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (keywords.some(keyword => lowerLine.includes(keyword))) {
        return line.trim();
      }
    }
    return 'Not specified';
  }

  private enhanceRevenueModel(analysis: any, request: PlanningRequest): any {
    return {
      type: request.parameters.businessModel || 'subscription',
      streams: request.parameters.revenueStreams || ['primary-product'],
      projections: analysis.revenueProjections,
      assumptions: 'Based on market analysis and business model'
    };
  }

  private enhanceCostStructure(analysis: any, request: PlanningRequest): any {
    return {
      development: 50,
      marketing: 30,
      operations: 20,
      details: analysis.costAnalysis
    };
  }

  private buildCashFlowProjection(revenue: any, costs: any, request: PlanningRequest): any {
    return {
      period: request.parameters.projectionPeriod || 24,
      monthlyProjections: [],
      breakEvenMonth: 18,
      peakCashNeed: request.parameters.initialFunding || 500000
    };
  }

  private buildFundingStrategy(analysis: any, cashFlow: any, request: PlanningRequest): any {
    return {
      type: 'seed',
      amount: cashFlow.peakCashNeed,
      timeline: '6-12 months',
      requirements: analysis.fundingNeeds
    };
  }

  private calculateFinancialMetrics(cashFlow: any, funding: any): any {
    return {
      burnRate: 25000,
      runway: 20,
      arr: 0,
      ltv: 5000,
      cac: 150
    };
  }

  private inferFundingPatterns(domain: string): string {
    const patterns: Record<string, string> = {
      'fintech': 'Seed: $2-5M, Series A: $10-20M',
      'healthcare': 'Seed: $3-8M, Series A: $15-30M',
      'enterprise': 'Seed: $2-4M, Series A: $8-15M',
      'consumer': 'Seed: $1-3M, Series A: $5-12M'
    };
    return patterns[domain] || 'Seed: $1-5M, Series A: $5-15M';
  }

  private inferKeyMetrics(domain: string): string {
    const metrics: Record<string, string> = {
      'fintech': 'AUM, Transaction Volume, Net Revenue',
      'healthcare': 'Patient Engagement, Clinical Outcomes, Revenue per Patient',
      'enterprise': 'ARR, Net Revenue Retention, Customer Acquisition Cost',
      'consumer': 'DAU, LTV, ARPU, Retention Rate'
    };
    return metrics[domain] || 'ARR, CAC, LTV, Churn Rate';
  }
}

export default UppFinancialPlanner;