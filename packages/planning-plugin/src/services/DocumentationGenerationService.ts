/**
 * Documentation Generation Service
 * Converts MCP planning session data into strategic markdown documents
 * 
 * Core component of MosAIc Planning Plugin v0.1.0
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { StateTracker, PlanningSession } from '../core/state-tracker';
import { ProjectDetectionService } from './ProjectDetectionService';
import { ModuleStatus } from '../core/dependency-manager';

export interface DocumentGenerationConfig {
  outputDir?: string;
  projectId?: string;
  templateDir?: string;
}

export interface DocumentTemplate {
  name: string;
  filename: string;
  template: string;
  requiredModules: string[];
}

/**
 * Service for generating strategic documentation from planning session data
 */
export class DocumentationGenerationService {
  private stateTracker: StateTracker;
  private projectDetection: ProjectDetectionService;
  private config: DocumentGenerationConfig;

  constructor(stateTracker: StateTracker, config: DocumentGenerationConfig = {}) {
    this.stateTracker = stateTracker;
    this.projectDetection = new ProjectDetectionService();
    this.config = config;
  }

  /**
   * Generate all available documentation based on completed planning modules
   */
  async generateDocumentation(): Promise<{
    success: boolean;
    generatedFiles: string[];
    errors: string[];
  }> {
    const session = this.stateTracker.getCurrentSession();
    if (!session) {
      return {
        success: false,
        generatedFiles: [],
        errors: ['No active planning session found']
      };
    }

    const outputDir = await this.getOutputDirectory(session);
    const generatedFiles: string[] = [];
    const errors: string[] = [];

    try {
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      // Generate executive summary if business planning is complete
      if (this.isModuleCompleted(session, 'business')) {
        try {
          const file = await this.generateExecutiveSummary(session, outputDir);
          generatedFiles.push(file);
        } catch (error) {
          errors.push(`Executive Summary: ${error}`);
        }
      }

      // Generate business strategy document
      if (this.isModuleCompleted(session, 'business')) {
        try {
          const file = await this.generateBusinessStrategy(session, outputDir);
          generatedFiles.push(file);
        } catch (error) {
          errors.push(`Business Strategy: ${error}`);
        }
      }

      // Generate financial projections if financial planning is complete
      if (this.isModuleCompleted(session, 'financial')) {
        try {
          const file = await this.generateFinancialProjections(session, outputDir);
          generatedFiles.push(file);
        } catch (error) {
          errors.push(`Financial Projections: ${error}`);
        }
      }

      // Generate technical architecture if tech planning is complete
      if (this.isModuleCompleted(session, 'tech')) {
        try {
          const file = await this.generateTechnicalArchitecture(session, outputDir);
          generatedFiles.push(file);
        } catch (error) {
          errors.push(`Technical Architecture: ${error}`);
        }
      }

      // Generate market research if marketing planning is complete
      if (this.isModuleCompleted(session, 'marketing')) {
        try {
          const file = await this.generateMarketResearch(session, outputDir);
          generatedFiles.push(file);
        } catch (error) {
          errors.push(`Market Research: ${error}`);
        }
      }

      // Generate release roadmap if release planning is complete
      if (this.isModuleCompleted(session, 'release')) {
        try {
          const file = await this.generateReleaseRoadmap(session, outputDir);
          generatedFiles.push(file);
        } catch (error) {
          errors.push(`Release Roadmap: ${error}`);
        }
      }

      return {
        success: errors.length === 0,
        generatedFiles,
        errors
      };

    } catch (error) {
      return {
        success: false,
        generatedFiles,
        errors: [`Failed to generate documentation: ${error}`]
      };
    }
  }

  /**
   * Generate executive summary document
   */
  private async generateExecutiveSummary(session: PlanningSession, outputDir: string): Promise<string> {
    const businessModule = this.stateTracker.getModuleState('business');
    const sessionStats = this.stateTracker.getSessionStats();
    
    const content = this.createExecutiveSummaryTemplate({
      projectId: session.projectId,
      sessionId: session.sessionId,
      createdAt: session.createdAt,
      lastUpdated: session.lastUpdated,
      businessResults: businessModule?.state.outputs || [],
      completionPercentage: sessionStats.completionPercentage,
      totalModules: sessionStats.totalModules,
      completedModules: sessionStats.completedModules
    });

    const filename = join(outputDir, 'EXECUTIVE-SUMMARY.md');
    await fs.writeFile(filename, content, 'utf-8');
    return filename;
  }

  /**
   * Generate business strategy document
   */
  private async generateBusinessStrategy(session: PlanningSession, outputDir: string): Promise<string> {
    const businessModule = this.stateTracker.getModuleState('business');
    
    const content = this.createBusinessStrategyTemplate({
      projectId: session.projectId,
      businessResults: businessModule?.state.outputs || [],
      metadata: businessModule?.state.metadata || {},
      createdAt: session.createdAt
    });

    const filename = join(outputDir, 'BUSINESS-STRATEGY.md');
    await fs.writeFile(filename, content, 'utf-8');
    return filename;
  }

  /**
   * Generate financial projections document
   */
  private async generateFinancialProjections(session: PlanningSession, outputDir: string): Promise<string> {
    const financialModule = this.stateTracker.getModuleState('financial');
    
    const content = this.createFinancialProjectionsTemplate({
      projectId: session.projectId,
      financialResults: financialModule?.state.outputs || [],
      metadata: financialModule?.state.metadata || {},
      createdAt: session.createdAt
    });

    const filename = join(outputDir, 'FINANCIAL-PROJECTIONS.md');
    await fs.writeFile(filename, content, 'utf-8');
    return filename;
  }

  /**
   * Generate technical architecture document
   */
  private async generateTechnicalArchitecture(session: PlanningSession, outputDir: string): Promise<string> {
    const techModule = this.stateTracker.getModuleState('tech');
    
    const content = this.createTechnicalArchitectureTemplate({
      projectId: session.projectId,
      techResults: techModule?.state.outputs || [],
      metadata: techModule?.state.metadata || {},
      createdAt: session.createdAt
    });

    const filename = join(outputDir, 'TECHNICAL-ARCHITECTURE.md');
    await fs.writeFile(filename, content, 'utf-8');
    return filename;
  }

  /**
   * Generate market research document
   */
  private async generateMarketResearch(session: PlanningSession, outputDir: string): Promise<string> {
    const marketingModule = this.stateTracker.getModuleState('marketing');
    
    const content = this.createMarketResearchTemplate({
      projectId: session.projectId,
      marketingResults: marketingModule?.state.outputs || [],
      metadata: marketingModule?.state.metadata || {},
      createdAt: session.createdAt
    });

    const filename = join(outputDir, 'MARKET-RESEARCH.md');
    await fs.writeFile(filename, content, 'utf-8');
    return filename;
  }

  /**
   * Generate release roadmap document
   */
  private async generateReleaseRoadmap(session: PlanningSession, outputDir: string): Promise<string> {
    const releaseModule = this.stateTracker.getModuleState('release');
    
    const content = this.createReleaseRoadmapTemplate({
      projectId: session.projectId,
      releaseResults: releaseModule?.state.outputs || [],
      metadata: releaseModule?.state.metadata || {},
      createdAt: session.createdAt
    });

    const filename = join(outputDir, 'RELEASE-ROADMAP.md');
    await fs.writeFile(filename, content, 'utf-8');
    return filename;
  }

  /**
   * Determine output directory for documentation
   */
  private async getOutputDirectory(session: PlanningSession): Promise<string> {
    if (this.config.outputDir) {
      return this.config.outputDir;
    }

    try {
      // Try to detect project root and use docs directory
      const projectRoot = await this.projectDetection.getProjectRoot();
      if (projectRoot) {
        // Determine domain from project context
        const domain = await this.detectProjectDomain(session);
        return join(projectRoot, 'docs', 'task-management', 'business-plan', domain, 'planning');
      }
    } catch (error) {
      console.warn('[DOC_GEN] Project detection failed, using fallback directory');
    }

    // Fallback to current directory
    const domain = this.extractDomainFromProjectId(session.projectId);
    return join(process.cwd(), 'docs', 'task-management', 'business-plan', domain, 'planning');
  }

  /**
   * Detect project domain from session data or project context
   */
  private async detectProjectDomain(session: PlanningSession): Promise<string> {
    // Try to get domain from business module metadata
    const businessModule = this.stateTracker.getModuleState('business');
    if (businessModule?.state.metadata?.domain) {
      return businessModule.state.metadata.domain;
    }

    // Try to detect from project context
    try {
      const projectInfo = await this.projectDetection.getProjectContext();
      if (projectInfo?.project?.metadata && 'domain' in projectInfo.project.metadata) {
        return (projectInfo.project.metadata as any).domain;
      }
    } catch (error) {
      // Ignore detection errors
    }

    // Extract from project ID or use default
    return this.extractDomainFromProjectId(session.projectId);
  }

  /**
   * Extract domain from project ID (e.g., "sage-phr" -> "healthcare")
   */
  private extractDomainFromProjectId(projectId: string): string {
    const domainMappings: Record<string, string> = {
      'phr': 'healthcare',
      'health': 'healthcare',
      'medical': 'healthcare',
      'fintech': 'fintech',
      'payment': 'fintech',
      'finance': 'fintech',
      'ecommerce': 'ecommerce',
      'marketplace': 'ecommerce',
      'retail': 'ecommerce',
      'saas': 'saas',
      'enterprise': 'enterprise'
    };

    const lowerProjectId = projectId.toLowerCase();
    for (const [keyword, domain] of Object.entries(domainMappings)) {
      if (lowerProjectId.includes(keyword)) {
        return domain;
      }
    }

    return 'enterprise'; // default domain
  }

  /**
   * Check if a planning module is completed
   */
  private isModuleCompleted(session: PlanningSession, moduleName: string): boolean {
    const module = session.modules[moduleName];
    return module && module.state.status === ModuleStatus.COMPLETED;
  }

  // Template creation methods

  private createExecutiveSummaryTemplate(data: any): string {
    return `# Executive Summary - ${data.projectId}

**Generated**: ${new Date().toISOString()}
**Session ID**: ${data.sessionId}
**Last Updated**: ${data.lastUpdated}

## Project Overview

This executive summary provides a high-level overview of the strategic planning results for project **${data.projectId}**.

## Planning Progress

- **Total Modules**: ${data.totalModules}
- **Completed Modules**: ${data.completedModules}
- **Completion**: ${data.completionPercentage}%

## Key Strategic Insights

${data.businessResults.map((result: string, index: number) => `${index + 1}. ${result}`).join('\n')}

## Next Steps

Based on the completed planning modules, the following strategic actions are recommended:

1. Review and validate strategic assumptions
2. Proceed with detailed implementation planning
3. Establish success metrics and KPIs
4. Begin stakeholder alignment activities

---
*Generated by MosAIc Planning Plugin v0.1.0*
`;
  }

  private createBusinessStrategyTemplate(data: any): string {
    return `# Business Strategy - ${data.projectId}

**Generated**: ${new Date().toISOString()}
**Planning Completed**: ${data.createdAt}

## Strategic Framework

This document outlines the business strategy and strategic framework for **${data.projectId}**.

## Business Analysis Results

${data.businessResults.map((result: string, index: number) => `### ${index + 1}. Strategic Finding\n${result}\n`).join('\n')}

## Strategic Metadata

${Object.entries(data.metadata).map(([key, value]) => `- **${key}**: ${JSON.stringify(value)}`).join('\n')}

## Implementation Considerations

Based on the business planning analysis, key implementation considerations include:

1. Stakeholder alignment and buy-in
2. Resource allocation and timeline planning
3. Risk mitigation strategies
4. Success metrics and measurement framework

---
*Generated by MosAIc Planning Plugin v0.1.0*
`;
  }

  private createFinancialProjectionsTemplate(data: any): string {
    return `# Financial Projections - ${data.projectId}

**Generated**: ${new Date().toISOString()}
**Planning Completed**: ${data.createdAt}

## Financial Analysis

This document provides financial projections and analysis for **${data.projectId}**.

## Financial Planning Results

${data.financialResults.map((result: string, index: number) => `### ${index + 1}. Financial Analysis\n${result}\n`).join('\n')}

## Financial Metadata

${Object.entries(data.metadata).map(([key, value]) => `- **${key}**: ${JSON.stringify(value)}`).join('\n')}

## Investment Requirements

Based on the financial planning analysis:

1. Initial capital requirements
2. Operating expense projections
3. Revenue projections and timeline
4. Break-even analysis
5. ROI projections

---
*Generated by MosAIc Planning Plugin v0.1.0*
`;
  }

  private createTechnicalArchitectureTemplate(data: any): string {
    return `# Technical Architecture - ${data.projectId}

**Generated**: ${new Date().toISOString()}
**Planning Completed**: ${data.createdAt}

## Technology Strategy

This document outlines the technical architecture and technology decisions for **${data.projectId}**.

## Technical Planning Results

${data.techResults.map((result: string, index: number) => `### ${index + 1}. Technical Decision\n${result}\n`).join('\n')}

## Technical Metadata

${Object.entries(data.metadata).map(([key, value]) => `- **${key}**: ${JSON.stringify(value)}`).join('\n')}

## Architecture Decisions

Key technical architecture decisions include:

1. Technology stack selection
2. Scalability considerations
3. Security architecture
4. Integration requirements
5. Development methodology

---
*Generated by MosAIc Planning Plugin v0.1.0*
`;
  }

  private createMarketResearchTemplate(data: any): string {
    return `# Market Research - ${data.projectId}

**Generated**: ${new Date().toISOString()}
**Planning Completed**: ${data.createdAt}

## Market Analysis

This document provides market research and competitive analysis for **${data.projectId}**.

## Marketing Planning Results

${data.marketingResults.map((result: string, index: number) => `### ${index + 1}. Market Insight\n${result}\n`).join('\n')}

## Marketing Metadata

${Object.entries(data.metadata).map(([key, value]) => `- **${key}**: ${JSON.stringify(value)}`).join('\n')}

## Market Strategy

Key market strategy elements include:

1. Target market analysis
2. Competitive landscape
3. Go-to-market strategy
4. Marketing channels and tactics
5. Customer acquisition strategy

---
*Generated by MosAIc Planning Plugin v0.1.0*
`;
  }

  private createReleaseRoadmapTemplate(data: any): string {
    return `# Release Roadmap - ${data.projectId}

**Generated**: ${new Date().toISOString()}
**Planning Completed**: ${data.createdAt}

## Release Strategy

This document outlines the release roadmap and delivery strategy for **${data.projectId}**.

## Release Planning Results

${data.releaseResults.map((result: string, index: number) => `### ${index + 1}. Release Planning\n${result}\n`).join('\n')}

## Release Metadata

${Object.entries(data.metadata).map(([key, value]) => `- **${key}**: ${JSON.stringify(value)}`).join('\n')}

## Release Timeline

Key release planning elements include:

1. Release scope and features
2. Development timeline
3. Milestone definitions
4. Quality gates and criteria
5. Deployment strategy

---
*Generated by MosAIc Planning Plugin v0.1.0*
`;
  }
}

// CommonJS export for JavaScript compatibility
module.exports = { DocumentationGenerationService };