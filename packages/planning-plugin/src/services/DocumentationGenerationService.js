/**
 * Documentation Generation Service - JavaScript version for MCP integration
 * Simplified version for planning commands to generate strategic documentation
 */

const fs = require('fs').promises;
const path = require('path');

class DocumentationGenerationService {
  constructor(stateTracker = null) {
    this.stateTracker = stateTracker;
    this.docsDir = path.join(process.cwd(), 'docs');
  }

  /**
   * Generate documentation for a planning session
   */
  async generateDocumentation(sessionData, options = {}) {
    try {
      // Ensure docs directory exists
      await fs.mkdir(this.docsDir, { recursive: true });

      const results = [];

      // Generate executive summary
      if (sessionData.type === 'business' || sessionData.type === 'all') {
        const summaryResult = await this.generateExecutiveSummary(sessionData, options);
        results.push(summaryResult);
      }

      // Generate business strategy document
      if (sessionData.businessStrategy) {
        const businessResult = await this.generateBusinessStrategy(sessionData, options);
        results.push(businessResult);
      }

      // Generate research documentation
      const researchResult = await this.generateResearchDocumentation(sessionData, options);
      results.push(researchResult);

      return {
        success: true,
        results,
        documentsGenerated: results.length,
        docsDir: this.docsDir
      };

    } catch (error) {
      console.error('Documentation generation failed:', error);
      return {
        success: false,
        error: error.message,
        results: []
      };
    }
  }

  /**
   * Generate executive summary document
   */
  async generateExecutiveSummary(sessionData, options) {
    const content = this.buildExecutiveSummary(sessionData, options);
    const filename = `EXECUTIVE-SUMMARY-${sessionData.projectId || 'default'}.md`;
    const filePath = path.join(this.docsDir, filename);

    await fs.writeFile(filePath, content);

    return {
      type: 'executive-summary',
      filename,
      path: filePath,
      size: content.length
    };
  }

  /**
   * Generate business strategy document
   */
  async generateBusinessStrategy(sessionData, options) {
    const content = this.buildBusinessStrategy(sessionData, options);
    const filename = `BUSINESS-STRATEGY-${sessionData.projectId || 'default'}.md`;
    const filePath = path.join(this.docsDir, filename);

    await fs.writeFile(filePath, content);

    return {
      type: 'business-strategy',
      filename,
      path: filePath,
      size: content.length
    };
  }

  /**
   * Generate research documentation
   */
  async generateResearchDocumentation(sessionData, options) {
    const content = this.buildResearchDocumentation(sessionData, options);
    const filename = `RESEARCH-DOCUMENTATION-${sessionData.projectId || 'default'}.md`;
    const filePath = path.join(this.docsDir, filename);

    await fs.writeFile(filePath, content);

    return {
      type: 'research-documentation',
      filename,
      path: filePath,
      size: content.length
    };
  }

  /**
   * Build executive summary content
   */
  buildExecutiveSummary(sessionData, options) {
    const timestamp = new Date().toISOString();
    const projectId = sessionData.projectId || 'Unknown Project';
    
    return `# Executive Summary - ${projectId}

*Generated on ${timestamp} by MosAIc Planning System*

## Project Overview

**Project ID:** ${projectId}
**Planning Session:** ${sessionData.sessionId || 'N/A'}
**Description:** ${sessionData.description || 'No description provided'}

## Strategic Foundation

${sessionData.businessStrategy ? `
### Business Strategy
${this.formatStrategySection(sessionData.businessStrategy)}
` : '### Business Strategy\n*Planning in progress...*'}

${sessionData.marketAnalysis ? `
### Market Analysis
${this.formatStrategySection(sessionData.marketAnalysis)}
` : '### Market Analysis\n*Analysis pending...*'}

## Key Deliverables

${this.formatDeliverables(sessionData)}

## Next Steps

${this.formatNextSteps(sessionData)}

---
*This document was generated automatically by the MosAIc Planning Plugin v0.1.0*
*Strategic documentation for stakeholder review and decision-making*
`;
  }

  /**
   * Build business strategy content
   */
  buildBusinessStrategy(sessionData, options) {
    const timestamp = new Date().toISOString();
    const projectId = sessionData.projectId || 'Unknown Project';
    
    return `# Business Strategy Document - ${projectId}

*Generated on ${timestamp} by MosAIc Planning System*

## Strategic Vision

${sessionData.businessStrategy?.vision || 'Vision statement pending...'}

## Value Proposition

${sessionData.businessStrategy?.valueProposition || 'Value proposition under development...'}

## Market Positioning

${sessionData.businessStrategy?.marketPosition || 'Market positioning analysis in progress...'}

## Revenue Model

${sessionData.businessStrategy?.revenueModel || 'Revenue model to be defined...'}

## Competitive Advantage

${sessionData.businessStrategy?.competitiveAdvantage || 'Competitive analysis pending...'}

## Implementation Roadmap

${sessionData.businessStrategy?.roadmap || 'Implementation roadmap being developed...'}

---
*This strategic document provides the foundational business direction for ${projectId}*
*Regularly review and update based on market feedback and business evolution*
`;
  }

  /**
   * Build research documentation content
   */
  buildResearchDocumentation(sessionData, options) {
    const timestamp = new Date().toISOString();
    const projectId = sessionData.projectId || 'Unknown Project';
    
    return `# Research Documentation - ${projectId}

*Generated on ${timestamp} by MosAIc Planning System*

## Research Methodology

This document contains research findings and analysis conducted during the planning phase of ${projectId}.

## Market Research

${sessionData.marketResearch || 'Market research data will be populated as analysis progresses...'}

## Technical Research

${sessionData.technicalResearch || 'Technical research findings will be documented as architecture decisions are made...'}

## Competitive Analysis

${sessionData.competitiveAnalysis || 'Competitive landscape analysis in development...'}

## User Research

${sessionData.userResearch || 'User research data and insights pending...'}

## Risk Assessment

${sessionData.riskAssessment || 'Risk analysis and mitigation strategies under review...'}

## Research Conclusions

${sessionData.researchConclusions || 'Research conclusions will be documented as findings are analyzed...'}

---
*Research documentation serves as the analytical foundation for strategic decision-making*
*Update regularly as new research data becomes available*
`;
  }

  /**
   * Format strategy section
   */
  formatStrategySection(strategy) {
    if (typeof strategy === 'string') {
      return strategy;
    }
    
    if (typeof strategy === 'object') {
      return Object.entries(strategy)
        .map(([key, value]) => `**${key}:** ${value}`)
        .join('\n\n');
    }
    
    return 'Strategy details being developed...';
  }

  /**
   * Format deliverables
   */
  formatDeliverables(sessionData) {
    if (sessionData.deliverables && Array.isArray(sessionData.deliverables)) {
      return sessionData.deliverables
        .map(deliverable => `- ${deliverable}`)
        .join('\n');
    }
    
    return `- Strategic business plan
- Market analysis report  
- Technical architecture blueprint
- Implementation roadmap
- Risk assessment documentation`;
  }

  /**
   * Format next steps
   */
  formatNextSteps(sessionData) {
    if (sessionData.nextSteps && Array.isArray(sessionData.nextSteps)) {
      return sessionData.nextSteps
        .map(step => `1. ${step}`)
        .join('\n');
    }
    
    return `1. Review and validate strategic documentation
2. Conduct stakeholder alignment sessions  
3. Finalize technical architecture decisions
4. Proceed with implementation planning
5. Establish monitoring and success metrics`;
  }
}

module.exports = {
  DocumentationGenerationService
};