/**
 * UPP Release Planner - Unified Agent
 * Release strategy and deployment planning using MosAIc MCP infrastructure
 * Replaces upp-release-planner-local with unified architecture
 */

import { z } from 'zod';
import { UnifiedPlanningAgent, PlanningAgentConfig, PlanningRequest } from './base/UnifiedPlanningAgent.js';
import { AuthConfig } from '@mosaicstack/mcp-common';
import { getDomainConfig } from '../config/domains.js';

// Input schema for release planning operations
const ReleasePlanningInputSchema = z.object({
  projectId: z.string().min(1),
  description: z.string().min(10),
  domain: z.string().optional(),
  releaseType: z.enum(['mvp', 'feature', 'major', 'patch']).default('mvp'),
  timeline: z.number().default(12), // weeks
  platform: z.array(z.string()).default(['web']),
  userBase: z.string().optional(),
  riskTolerance: z.enum(['low', 'medium', 'high']).default('medium'),
  deploymentStrategy: z.string().optional(),
  operation: z.enum(['release-strategy', 'deployment-plan', 'rollout-plan', 'complete-release']).default('complete-release')
});

export type ReleasePlanningInput = z.infer<typeof ReleasePlanningInputSchema>;

/**
 * Unified Release Planning Agent
 * Uses MosAIc MCP infrastructure for local/remote routing
 */
export class UppReleasePlanner extends UnifiedPlanningAgent {
  constructor(config?: Partial<PlanningAgentConfig>, authConfig?: AuthConfig) {
    const defaultConfig: PlanningAgentConfig = {
      agentType: 'upp-release-planner',
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

    super('upp-release-planner', defaultConfig, defaultAuthConfig);
  }

  get name(): string {
    return 'upp_release_planner';
  }

  get capabilities(): string[] {
    return [
      'release-strategy',
      'deployment-planning',
      'rollout-strategy',
      'risk-assessment',
      'quality-gates',
      'monitoring-setup',
      'rollback-planning',
      'user-communication'
    ];
  }

  get description(): string {
    return 'Unified release planning with deployment strategy, rollout planning, and risk management';
  }

  get inputSchema(): z.ZodObject<any, any, any, any, any> {
    return ReleasePlanningInputSchema;
  }

  /**
   * Execute release planning with domain awareness
   */
  async planRelease(input: ReleasePlanningInput): Promise<any> {
    const context = {
      projectId: input.projectId,
      domain: input.domain,
      releaseType: input.releaseType,
      description: input.description
    };

    await this.initialize(context);

    const request: PlanningRequest = {
      operation: input.operation,
      context,
      parameters: {
        description: input.description,
        releaseType: input.releaseType,
        timeline: input.timeline,
        platform: input.platform,
        userBase: input.userBase,
        riskTolerance: input.riskTolerance,
        deploymentStrategy: input.deploymentStrategy
      },
      metadata: {
        capabilities: this.capabilities
      }
    };

    return await this.executePlanning(request);
  }

  /**
   * Override local execution with release-specific logic
   */
  protected async executeLocal(request: PlanningRequest): Promise<any> {
    this.logger.info('Executing release planning via local Ollama MCP');

    const prompt = this.createReleasePlanningPrompt(request);
    const mcpRequest = {
      prompt,
      model: this.getPreferredLocalModel(request.operation),
      options: {
        temperature: 0.2, // Lower temperature for technical precision
        top_p: 0.9,
        num_predict: 1000
      },
      system: this.getReleasePlanningSystemPrompt(request.context.domain),
      context: request.context
    };

    try {
      // Call Ollama via MCP orchestrator
      const mcpResponse = await this.callMCPService('ollama', mcpRequest);
      
      // Process the MCP response
      if (mcpResponse.response) {
        return await this.processReleaseMCPResponse(mcpResponse, request, 'local');
      } else {
        // Fallback to release planning logic
        return await this.executeReleasePlanningLogic(request, 'local');
      }
    } catch (error) {
      this.logger.warn('MCP Ollama call failed, using fallback logic', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return await this.executeReleasePlanningLogic(request, 'local');
    }
  }

  /**
   * Override remote execution with release-specific logic
   */
  protected async executeRemote(request: PlanningRequest): Promise<any> {
    this.logger.info('Executing release planning via remote Claude MCP');

    const prompt = this.createReleasePlanningPrompt(request);
    const mcpRequest = {
      messages: [
        {
          role: 'system',
          content: this.getReleasePlanningSystemPrompt(request.context.domain)
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
        return await this.processReleaseMCPResponse(mcpResponse, request, 'remote');
      } else {
        return await this.executeReleasePlanningLogic(request, 'remote');
      }
    } catch (error) {
      this.logger.warn('MCP Claude call failed, using fallback logic', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      return await this.executeReleasePlanningLogic(request, 'remote');
    }
  }

  /**
   * Process MCP response for release planning
   */
  private async processReleaseMCPResponse(mcpResponse: any, request: PlanningRequest, mode: 'local' | 'remote'): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Extract response text
      let responseText = mcpResponse.response || mcpResponse.content?.[0]?.text || mcpResponse.raw || '';
      
      // Parse release analysis from AI response
      const releaseAnalysis = this.parseReleaseAnalysisFromResponse(responseText);
      const domainConfig = request.context.domain ? getDomainConfig(request.context.domain) : null;
      
      // Build comprehensive release plan
      const releaseStrategy = this.buildReleaseStrategy(releaseAnalysis, request);
      const deploymentPlan = this.buildDeploymentPlan(releaseAnalysis, request);
      const rolloutStrategy = this.buildRolloutStrategy(releaseAnalysis, request);
      const qualityGates = this.defineQualityGates(releaseStrategy, request);
      const riskManagement = this.buildRiskManagement(releaseAnalysis, request);
      
      const duration = Date.now() - startTime;

      return {
        success: true,
        aiResponse: responseText,
        releaseAnalysis,
        releaseStrategy,
        deploymentPlan,
        rolloutStrategy,
        qualityGates,
        riskManagement,
        releaseConstraints: {
          domain: request.context.domain,
          complexity: domainConfig?.complexity || 'medium',
          compliance: domainConfig?.compliance || [],
          releaseType: request.parameters.releaseType,
          timeline: request.parameters.timeline || 12,
          riskTolerance: request.parameters.riskTolerance
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
      this.logger.error('Failed to process release MCP response', {
        error: error instanceof Error ? error.message : String(error),
        mode
      });
      
      return await this.executeReleasePlanningLogic(request, mode);
    }
  }

  /**
   * Create release planning prompt
   */
  private createReleasePlanningPrompt(request: PlanningRequest): string {
    const basePrompt = `Develop comprehensive release strategy for this software product:

Project: ${request.parameters.description}
Release Type: ${request.parameters.releaseType}
Timeline: ${request.parameters.timeline} weeks
Platforms: ${request.parameters.platform.join(', ')}
User Base: ${request.parameters.userBase || 'Not specified'}
Risk Tolerance: ${request.parameters.riskTolerance}
Deployment Strategy: ${request.parameters.deploymentStrategy || 'Not specified'}

Provide detailed release plan including:
1. Release Strategy & Approach
2. Deployment Plan & Infrastructure
3. Rollout Strategy & Phases
4. Quality Gates & Testing Strategy
5. Risk Assessment & Mitigation
6. Monitoring & Observability Setup
7. Rollback Plan & Contingencies
8. User Communication Plan
9. Post-Release Activities
10. Success Metrics & KPIs

Format as structured technical plan with specific timelines and checkpoints.`;

    return this.domainConfig ? 
      this.createDomainPrompt(basePrompt, request.context) : 
      basePrompt;
  }

  /**
   * Get system prompt for release planning
   */
  private getReleasePlanningSystemPrompt(domain?: string): string {
    let systemPrompt = `You are an expert DevOps engineer and release manager. Provide detailed, technically sound release strategies and deployment plans.

Focus on:
- Comprehensive deployment and rollout strategies
- Risk assessment and mitigation planning
- Quality gates and testing protocols
- Infrastructure and monitoring setup
- Rollback and contingency planning
- User communication and change management
- Post-release support and optimization
- Industry best practices and methodologies`;

    if (domain && this.domainConfig) {
      systemPrompt += `

Domain Expertise: ${this.domainConfig.name}
- Compliance Requirements: ${this.domainConfig.compliance.join(', ')}
- Typical Deployment Patterns: ${this.inferDeploymentPatterns(domain)}
- Critical Quality Gates: ${this.inferQualityGates(domain)}
- Risk Considerations: ${this.inferRiskConsiderations(domain)}`;
    }

    return systemPrompt;
  }

  // Core release planning logic methods
  
  private executeReleasePlanningLogic(request: PlanningRequest, mode: 'local' | 'remote'): Promise<any> {
    // Fallback release planning logic
    return Promise.resolve({
      success: true,
      releaseStrategy: { approach: 'blue-green', phases: 3 },
      deploymentPlan: { environment: 'cloud', automation: 'ci-cd' },
      rolloutStrategy: { pattern: 'canary', percentage: [10, 50, 100] },
      metadata: { agent: this.serviceName, processingMode: mode, source: 'fallback' }
    });
  }

  private parseReleaseAnalysisFromResponse(text: string): any {
    return {
      strategyInsights: this.extractReleaseSection(text, ['strategy', 'approach', 'methodology']),
      deploymentInsights: this.extractReleaseSection(text, ['deployment', 'infrastructure', 'environment']),
      riskInsights: this.extractReleaseSection(text, ['risk', 'mitigation', 'contingency']),
      qualityInsights: this.extractReleaseSection(text, ['quality', 'testing', 'validation'])
    };
  }

  private extractReleaseSection(text: string, keywords: string[]): string {
    const lines = text.split('\n');
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (keywords.some(keyword => lowerLine.includes(keyword))) {
        return line.trim();
      }
    }
    return 'Not specified';
  }

  private buildReleaseStrategy(analysis: any, request: PlanningRequest): any {
    return {
      releaseType: request.parameters.releaseType,
      approach: this.determineReleaseApproach(request.parameters.riskTolerance),
      timeline: request.parameters.timeline || 12,
      phases: this.definePhasesForReleaseType(request.parameters.releaseType),
      strategyInsights: analysis.strategyInsights
    };
  }

  private buildDeploymentPlan(analysis: any, request: PlanningRequest): any {
    return {
      strategy: request.parameters.deploymentStrategy || 'blue-green',
      platforms: request.parameters.platform,
      environments: ['staging', 'production'],
      automation: 'ci-cd',
      deploymentInsights: analysis.deploymentInsights
    };
  }

  private buildRolloutStrategy(analysis: any, request: PlanningRequest): any {
    const rolloutPattern = this.determineRolloutPattern(request.parameters.riskTolerance);
    return {
      pattern: rolloutPattern.type,
      phases: rolloutPattern.phases,
      criteria: rolloutPattern.criteria,
      timeline: `${request.parameters.timeline} weeks`,
      userBase: request.parameters.userBase
    };
  }

  private defineQualityGates(strategy: any, request: PlanningRequest): any {
    return {
      gates: this.getQualityGatesForReleaseType(request.parameters.releaseType),
      criteria: this.getQualityCriteria(request.context.domain),
      automation: ['unit-tests', 'integration-tests', 'e2e-tests'],
      approval: ['code-review', 'security-scan', 'performance-test']
    };
  }

  private buildRiskManagement(analysis: any, request: PlanningRequest): any {
    return {
      riskLevel: request.parameters.riskTolerance,
      riskFactors: this.identifyRiskFactors(request),
      mitigation: this.buildMitigationPlan(request.parameters.riskTolerance),
      rollbackPlan: this.buildRollbackPlan(request.parameters.releaseType),
      riskInsights: analysis.riskInsights
    };
  }

  private determineReleaseApproach(riskTolerance: string): string {
    const approaches: Record<string, string> = {
      'low': 'phased-rollout',
      'medium': 'canary-deployment',
      'high': 'blue-green-deployment'
    };
    return approaches[riskTolerance] || 'canary-deployment';
  }

  private definePhasesForReleaseType(releaseType: string): string[] {
    const phases: Record<string, string[]> = {
      'mvp': ['alpha', 'beta', 'launch'],
      'feature': ['feature-flag', 'gradual-rollout', 'full-deployment'],
      'major': ['staged-rollout', 'monitored-deployment', 'full-release'],
      'patch': ['hotfix-deployment', 'validation']
    };
    return phases[releaseType] || ['development', 'testing', 'production'];
  }

  private determineRolloutPattern(riskTolerance: string): any {
    const patterns: Record<string, any> = {
      'low': {
        type: 'gradual',
        phases: [1, 5, 15, 50, 100],
        criteria: 'strict-monitoring'
      },
      'medium': {
        type: 'canary',
        phases: [10, 50, 100],
        criteria: 'performance-based'
      },
      'high': {
        type: 'big-bang',
        phases: [100],
        criteria: 'immediate-full'
      }
    };
    return patterns[riskTolerance] || patterns['medium'];
  }

  private getQualityGatesForReleaseType(releaseType: string): string[] {
    const gates: Record<string, string[]> = {
      'mvp': ['unit-tests', 'integration-tests', 'smoke-tests'],
      'feature': ['unit-tests', 'integration-tests', 'feature-tests', 'regression-tests'],
      'major': ['comprehensive-testing', 'performance-tests', 'security-audit', 'user-acceptance'],
      'patch': ['regression-tests', 'smoke-tests', 'critical-path-validation']
    };
    return gates[releaseType] || gates['feature'];
  }

  private getQualityCriteria(domain?: string): string[] {
    const criteria: Record<string, string[]> = {
      'fintech': ['security-compliance', 'data-integrity', 'audit-logs'],
      'healthcare': ['hipaa-compliance', 'data-privacy', 'clinical-validation'],
      'enterprise': ['scalability', 'reliability', 'integration-compatibility'],
      'consumer': ['user-experience', 'performance', 'accessibility']
    };
    return criteria[domain || 'general'] || ['functionality', 'performance', 'security'];
  }

  private identifyRiskFactors(request: PlanningRequest): string[] {
    const baseRisks = ['deployment-failure', 'performance-degradation', 'data-loss'];
    
    // Add domain-specific risks
    if (request.context.domain === 'fintech') {
      baseRisks.push('regulatory-compliance', 'financial-data-breach');
    } else if (request.context.domain === 'healthcare') {
      baseRisks.push('patient-data-privacy', 'clinical-workflow-disruption');
    }
    
    return baseRisks;
  }

  private buildMitigationPlan(riskTolerance: string): any {
    return {
      preDeployment: ['comprehensive-testing', 'staging-validation'],
      during: ['real-time-monitoring', 'gradual-rollout'],
      postDeployment: ['performance-monitoring', 'error-tracking'],
      rollback: riskTolerance === 'low' ? 'automatic' : 'manual'
    };
  }

  private buildRollbackPlan(releaseType: string): any {
    return {
      trigger: ['error-threshold-exceeded', 'performance-degradation'],
      procedure: releaseType === 'patch' ? 'immediate-rollback' : 'staged-rollback',
      timeline: '< 5 minutes',
      validation: 'post-rollback-testing'
    };
  }

  private inferDeploymentPatterns(domain: string): string {
    const patterns: Record<string, string> = {
      'fintech': 'Blue-Green, Canary with strict validation',
      'healthcare': 'Staged deployment with compliance checks',
      'enterprise': 'Multi-region, multi-environment deployment',
      'consumer': 'Feature flags, A/B testing rollouts'
    };
    return patterns[domain] || 'Blue-Green, Canary deployment';
  }

  private inferQualityGates(domain: string): string {
    const gates: Record<string, string> = {
      'fintech': 'Security audit, Compliance validation, Load testing',
      'healthcare': 'HIPAA compliance, Clinical validation, Data integrity',
      'enterprise': 'Integration testing, Scalability testing, Security scan',
      'consumer': 'UX testing, Performance testing, Accessibility audit'
    };
    return gates[domain] || 'Testing, Security, Performance validation';
  }

  private inferRiskConsiderations(domain: string): string {
    const risks: Record<string, string> = {
      'fintech': 'Financial data integrity, Regulatory compliance, Fraud prevention',
      'healthcare': 'Patient safety, Data privacy, Clinical workflow continuity',
      'enterprise': 'Business continuity, Data security, Integration stability',
      'consumer': 'User experience, App store approval, Performance impact'
    };
    return risks[domain] || 'Data integrity, Performance, Security';
  }
}

export default UppReleasePlanner;