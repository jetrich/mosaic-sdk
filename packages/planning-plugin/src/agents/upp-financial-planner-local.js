/**
 * UPP Financial Planner Local Agent - AI-Assisted Financial Modeling
 * 
 * Provides revenue models, cost analysis with AI development multipliers,
 * and budget constraints that influence release planning decisions.
 */

const http = require('http');

class UppFinancialPlannerLocal {
  constructor() {
    this.name = 'upp-financial-planner-local';
    this.description = 'Financial modeling with AI development cost factors and revenue projections';
    this.capabilities = ['revenue-modeling', 'cost-analysis', 'ai-development-factors', 'budget-planning'];
    this.ollamaHost = process.env.OLLAMA_HOST || '10.1.1.42';
    this.ollamaPort = process.env.OLLAMA_PORT || '11434';
    this.connected = false;
    
    // AI development cost multipliers (productivity gains)
    this.aiDevelopmentFactors = {
      'code-generation': { multiplier: 2.5, description: 'AI-assisted code generation' },
      'documentation': { multiplier: 3.0, description: 'Automated documentation generation' },
      'testing': { multiplier: 2.0, description: 'AI-generated test cases' },
      'debugging': { multiplier: 1.8, description: 'AI-assisted debugging and troubleshooting' },
      'architecture': { multiplier: 1.5, description: 'AI-guided architecture decisions' },
      'integration': { multiplier: 1.3, description: 'Reduced integration complexity' }
    };
    
    // Revenue model templates
    this.revenueModels = {
      'saas': {
        structure: 'subscription',
        metrics: ['MRR', 'churn-rate', 'ARPU', 'CAC', 'LTV'],
        typicalPricing: [10, 25, 50, 100, 250], // per user/month
        scalingFactors: { low: 1.2, medium: 2.5, high: 5.0 }
      },
      'marketplace': {
        structure: 'transaction-fee',
        metrics: ['transaction-volume', 'take-rate', 'active-users', 'GMV'],
        typicalTakeRate: [2.5, 5.0, 7.5, 10.0], // percentage
        scalingFactors: { low: 1.5, medium: 3.0, high: 8.0 }
      },
      'enterprise': {
        structure: 'license-plus-services',
        metrics: ['contract-value', 'implementation-revenue', 'support-revenue'],
        typicalContracts: [50000, 100000, 250000, 500000], // annual
        scalingFactors: { low: 1.1, medium: 1.5, high: 2.0 }
      },
      'consumer': {
        structure: 'freemium-or-onetime',
        metrics: ['conversion-rate', 'ARPU', 'retention', 'viral-coefficient'],
        typicalPricing: [0.99, 4.99, 9.99, 19.99], // one-time or monthly
        scalingFactors: { low: 1.5, medium: 4.0, high: 10.0 }
      }
    };
  }

  async initialize() {
    console.log(`[${this.name.toUpperCase()}] Initializing financial planner agent...`);
    
    try {
      const testResult = await this.testOllamaConnection();
      this.connected = testResult;
      
      if (this.connected) {
        console.log(`[${this.name.toUpperCase()}] ✅ Ollama connected at ${this.ollamaHost}:${this.ollamaPort}`);
      } else {
        console.log(`[${this.name.toUpperCase()}] ⚠️ Ollama not available - will use fallback mode`);
      }
      
      return true;
    } catch (error) {
      console.error(`[${this.name.toUpperCase()}] ❌ Failed to initialize:`, error.message);
      this.connected = false;
      return true;
    }
  }

  async testOllamaConnection() {
    return new Promise((resolve) => {
      const req = http.get(`http://${this.ollamaHost}:${this.ollamaPort}/api/tags`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const result = JSON.parse(data);
              console.log(`[${this.name.toUpperCase()}] Found ${result.models?.length || 0} Ollama models`);
              resolve(true);
            } catch (e) {
              resolve(false);
            }
          } else {
            resolve(false);
          }
        });
      });
      
      req.on('error', () => resolve(false));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  async generateWithOllama(prompt, model = 'llama3.2:1b') {
    if (!this.connected) {
      throw new Error('Ollama not available');
    }

    const requestData = JSON.stringify({
      model: model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.2, // Lower temperature for financial accuracy
        top_p: 0.8,
        num_predict: 400
      }
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.ollamaHost,
        port: this.ollamaPort,
        path: '/api/generate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestData, 'utf8')
        }
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        
        res.on('data', chunk => {
          responseData += chunk.toString('utf8');
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(responseData.trim());
            if (!result || !result.response) {
              reject(new Error('No response content in Ollama result'));
              return;
            }
            
            resolve({
              content: result.response.trim(),
              model: model
            });
          } catch (error) {
            reject(new Error(`JSON parse failed: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`HTTP request error: ${error.message}`));
      });

      req.setTimeout(18000, () => {
        req.destroy();
        reject(new Error('Request timeout (18s)'));
      });

      req.write(requestData);
      req.end();
    });
  }

  /**
   * Main entry point - create comprehensive financial plan
   */
  async planFinancials(businessStrategy, marketAnalysis, projectConstraints, context = {}) {
    const startTime = Date.now();
    
    console.log(`[${this.name.toUpperCase()}] Starting financial planning analysis...`);
    
    try {
      // Step 1: Analyze revenue model and pricing strategy
      const revenueAnalysis = await this.analyzeRevenueModel(businessStrategy, marketAnalysis);
      
      // Step 2: Calculate AI-adjusted development costs
      const costAnalysis = this.calculateAIDevelopmentCosts(projectConstraints, revenueAnalysis);
      
      // Step 3: Generate financial projections and scenarios
      const financialProjections = await this.generateFinancialProjections(revenueAnalysis, costAnalysis, context);
      
      // Step 4: Determine budget constraints for release planning
      const budgetConstraints = this.determineBudgetConstraints(financialProjections, projectConstraints);
      
      // Step 5: Calculate ROI and break-even analysis
      const roiAnalysis = this.calculateROIAnalysis(financialProjections, costAnalysis);
      
      const duration = Date.now() - startTime;
      
      console.log(`[${this.name.toUpperCase()}] ✅ Generated financial plan in ${duration}ms`);
      
      return {
        success: true,
        revenueAnalysis,
        costAnalysis,
        financialProjections,
        budgetConstraints,
        roiAnalysis,
        financialConstraints: {
          budgetLevel: budgetConstraints.level,
          fundingRequirement: budgetConstraints.totalFunding,
          burnRate: budgetConstraints.monthlyBurn,
          runway: budgetConstraints.runway,
          breakEven: roiAnalysis.breakEvenMonths,
          costMultipliers: costAnalysis.aiMultipliers
        },
        metadata: {
          agent: this.name,
          duration,
          processingMode: 'local-ollama',
          model: revenueAnalysis.model || 'fallback',
          revenueModel: revenueAnalysis.modelType
        }
      };
      
    } catch (error) {
      console.error(`[${this.name.toUpperCase()}] Financial planning failed:`, error.message);
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackFinancials(businessStrategy, context)
      };
    }
  }

  /**
   * Analyze revenue model and pricing strategy
   */
  async analyzeRevenueModel(businessStrategy, marketAnalysis) {
    console.log(`[${this.name.toUpperCase()}] Analyzing revenue model and pricing...`);
    
    const revenuePrompt = this.createRevenueAnalysisPrompt(businessStrategy, marketAnalysis);
    
    try {
      const result = await this.generateWithOllama(revenuePrompt, 'llama3.2:1b');
      
      return {
        modelType: this.identifyRevenueModel(businessStrategy.businessType, result.content),
        pricingStrategy: this.extractPricingStrategy(result.content),
        marketSize: marketAnalysis.marketSize || 'medium',
        competitivePosition: this.assessCompetitivePosition(marketAnalysis, result.content),
        scalabilityFactor: this.assessScalability(businessStrategy, result.content),
        analysis: result.content,
        model: result.model
      };
      
    } catch (error) {
      console.error(`[${this.name.toUpperCase()}] Revenue analysis failed:`, error.message);
      
      return {
        modelType: this.identifyRevenueModel(businessStrategy.businessType, ''),
        pricingStrategy: 'market-competitive',
        marketSize: marketAnalysis.marketSize || 'medium',
        competitivePosition: 'moderate',
        scalabilityFactor: 'medium',
        analysis: 'Fallback analysis due to Ollama unavailability',
        model: 'fallback'
      };
    }
  }

  /**
   * Create revenue analysis prompt
   */
  createRevenueAnalysisPrompt(businessStrategy, marketAnalysis) {
    const business = businessStrategy.businessType || 'saas';
    const market = marketAnalysis.marketSize || 'medium';
    
    return `Analyze revenue model for ${business} business:

Market size: ${market}
Target: ${marketAnalysis.targetMarket || 'small-business'}
Competition: ${marketAnalysis.competitiveLandscape || 'moderate'}

Revenue models:
- SaaS: subscription, MRR growth
- Marketplace: transaction fees, GMV
- Enterprise: licenses + services  
- Consumer: freemium, one-time

Recommend:
Model: [saas/marketplace/enterprise/consumer]
Pricing: [low/medium/high/premium]
Scale: [low/medium/high]

Format:
Model: [type]
Pricing: [strategy]  
Scale: [potential]
Rationale: [reason]`;
  }

  /**
   * Calculate AI-adjusted development costs
   */
  calculateAIDevelopmentCosts(projectConstraints, revenueAnalysis) {
    console.log(`[${this.name.toUpperCase()}] Calculating AI-adjusted development costs...`);
    
    // Base cost estimates (traditional development)
    const baseCosts = this.calculateBaseDevelopmentCosts(projectConstraints);
    
    // Apply AI productivity multipliers
    const aiAdjustedCosts = {};
    Object.keys(baseCosts).forEach(category => {
      const factor = this.aiDevelopmentFactors[category];
      if (factor) {
        aiAdjustedCosts[category] = {
          traditional: baseCosts[category],
          aiAdjusted: Math.round(baseCosts[category] / factor.multiplier),
          savings: Math.round(baseCosts[category] - (baseCosts[category] / factor.multiplier)),
          multiplier: factor.multiplier,
          description: factor.description
        };
      } else {
        aiAdjustedCosts[category] = {
          traditional: baseCosts[category],
          aiAdjusted: baseCosts[category],
          savings: 0,
          multiplier: 1.0,
          description: 'No AI assistance available'
        };
      }
    });
    
    // Calculate totals
    const totalTraditional = Object.values(aiAdjustedCosts).reduce((sum, cost) => sum + cost.traditional, 0);
    const totalAiAdjusted = Object.values(aiAdjustedCosts).reduce((sum, cost) => sum + cost.aiAdjusted, 0);
    const totalSavings = totalTraditional - totalAiAdjusted;
    
    return {
      breakdown: aiAdjustedCosts,
      totals: {
        traditional: totalTraditional,
        aiAdjusted: totalAiAdjusted,
        savings: totalSavings,
        savingsPercentage: Math.round((totalSavings / totalTraditional) * 100)
      },
      aiMultipliers: this.aiDevelopmentFactors,
      assumptions: this.getCostAssumptions(projectConstraints)
    };
  }

  /**
   * Calculate base development costs (pre-AI adjustment)
   */
  calculateBaseDevelopmentCosts(constraints) {
    const complexity = constraints.complexity || 'medium';
    const domain = constraints.domain || 'general';
    
    // Base cost multipliers by complexity
    const complexityMultipliers = {
      'simple': 0.7,
      'medium': 1.0,
      'complex': 1.5,
      'enterprise': 2.0
    };
    
    const multiplier = complexityMultipliers[complexity] || 1.0;
    
    // Domain-specific cost adjustments
    const domainMultipliers = {
      'healthcare': 1.3, // HIPAA compliance overhead
      'fintech': 1.4,    // Financial regulations
      'enterprise': 1.2, // Enterprise requirements
      'general': 1.0
    };
    
    const domainMultiplier = domainMultipliers[domain] || 1.0;
    
    // Base estimates in hours
    const baseHours = {
      'code-generation': 200,
      'documentation': 80,
      'testing': 120,
      'debugging': 60,
      'architecture': 40,
      'integration': 80
    };
    
    // Apply multipliers and convert to costs (assuming $100/hour)
    const costs = {};
    Object.keys(baseHours).forEach(category => {
      const hours = baseHours[category] * multiplier * domainMultiplier;
      costs[category] = Math.round(hours * 100); // $100/hour
    });
    
    return costs;
  }

  /**
   * Generate financial projections
   */
  async generateFinancialProjections(revenueAnalysis, costAnalysis, context) {
    console.log(`[${this.name.toUpperCase()}] Generating financial projections...`);
    
    const model = this.revenueModels[revenueAnalysis.modelType];
    const developmentCost = costAnalysis.totals.aiAdjusted;
    
    // Generate 12-month projections
    const projections = [];
    for (let month = 1; month <= 12; month++) {
      const projection = this.calculateMonthlyProjection(month, model, revenueAnalysis, developmentCost);
      projections.push(projection);
    }
    
    return {
      monthly: projections,
      summary: this.calculateProjectionSummary(projections),
      assumptions: this.getProjectionAssumptions(revenueAnalysis, model),
      scenarios: this.generateScenarios(projections, revenueAnalysis)
    };
  }

  /**
   * Calculate monthly financial projection
   */
  calculateMonthlyProjection(month, model, revenueAnalysis, developmentCost) {
    const scalingFactor = model.scalingFactors[revenueAnalysis.scalabilityFactor] || 1.0;
    
    let revenue = 0;
    if (revenueAnalysis.modelType === 'saas') {
      // SaaS growth model: start low, compound growth
      const baseUsers = month <= 3 ? month * 10 : 30 + ((month - 3) * 20 * scalingFactor);
      const avgRevenue = model.typicalPricing[1]; // Use mid-tier pricing
      revenue = Math.round(baseUsers * avgRevenue);
    } else if (revenueAnalysis.modelType === 'marketplace') {
      // Marketplace: transaction volume growth
      const baseVolume = month <= 3 ? month * 5000 : 15000 + ((month - 3) * 10000 * scalingFactor);
      const takeRate = model.typicalTakeRate[1] / 100; // Convert percentage
      revenue = Math.round(baseVolume * takeRate);
    } else if (revenueAnalysis.modelType === 'enterprise') {
      // Enterprise: contract-based, slower but larger
      const contracts = month <= 6 ? 0 : Math.floor((month - 6) / 3) + 1;
      const avgContract = model.typicalContracts[1] / 12; // Monthly portion
      revenue = Math.round(contracts * avgContract);
    } else {
      // Consumer: user growth with conversion
      const users = month * 1000 * scalingFactor;
      const conversionRate = 0.02; // 2% conversion
      const avgRevenue = model.typicalPricing[2];
      revenue = Math.round(users * conversionRate * avgRevenue);
    }
    
    // Calculate costs (development amortized over 12 months + operational)
    const developmentMonthly = Math.round(developmentCost / 12);
    const operationalCosts = Math.round(revenue * 0.3); // 30% of revenue
    const totalCosts = developmentMonthly + operationalCosts;
    
    return {
      month,
      revenue,
      costs: {
        development: developmentMonthly,
        operational: operationalCosts,
        total: totalCosts
      },
      profit: revenue - totalCosts,
      cumulativeProfit: 0 // Will be calculated in summary
    };
  }

  /**
   * Determine budget constraints for release planning
   */
  determineBudgetConstraints(projections, projectConstraints) {
    const totalDevelopmentCost = projections.monthly.reduce((sum, p) => sum + p.costs.development, 0);
    const avgMonthlyBurn = projections.monthly.slice(0, 6).reduce((sum, p) => sum + p.costs.total, 0) / 6;
    
    // Determine budget level
    let budgetLevel = 'startup-level';
    if (totalDevelopmentCost > 500000) budgetLevel = 'enterprise';
    else if (totalDevelopmentCost > 200000) budgetLevel = 'growth-stage';
    else if (totalDevelopmentCost > 100000) budgetLevel = 'funded-startup';
    
    return {
      level: budgetLevel,
      totalFunding: Math.round(totalDevelopmentCost * 1.5), // 50% buffer
      monthlyBurn: avgMonthlyBurn,
      runway: Math.round((totalDevelopmentCost * 1.5) / avgMonthlyBurn),
      developmentBudget: totalDevelopmentCost,
      operationalBuffer: Math.round(totalDevelopmentCost * 0.5)
    };
  }

  /**
   * Calculate ROI analysis
   */
  calculateROIAnalysis(projections, costAnalysis) {
    const monthlyData = projections.monthly;
    let cumulativeProfit = 0;
    let breakEvenMonth = null;
    
    // Calculate cumulative profit and break-even
    monthlyData.forEach(month => {
      cumulativeProfit += month.profit;
      month.cumulativeProfit = cumulativeProfit;
      
      if (breakEvenMonth === null && cumulativeProfit > 0) {
        breakEvenMonth = month.month;
      }
    });
    
    const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
    const totalCosts = monthlyData.reduce((sum, m) => sum + m.costs.total, 0);
    const roi = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalCosts) * 100 : -100;
    
    return {
      breakEvenMonths: breakEvenMonth || 12,
      yearOneROI: Math.round(roi),
      totalRevenue: totalRevenue,
      totalCosts: totalCosts,
      netProfit: totalRevenue - totalCosts,
      aiSavings: costAnalysis.totals.savings,
      aiSavingsPercentage: costAnalysis.totals.savingsPercentage
    };
  }

  /**
   * Helper methods
   */
  identifyRevenueModel(businessType, analysis) {
    const modelKeywords = {
      'saas': ['subscription', 'saas', 'recurring', 'monthly'],
      'marketplace': ['marketplace', 'transaction', 'commission', 'fee'],
      'enterprise': ['enterprise', 'license', 'contract', 'b2b'],
      'consumer': ['consumer', 'b2c', 'freemium', 'onetime']
    };
    
    if (businessType && this.revenueModels[businessType]) {
      return businessType;
    }
    
    for (const [model, keywords] of Object.entries(modelKeywords)) {
      if (keywords.some(keyword => analysis.toLowerCase().includes(keyword))) {
        return model;
      }
    }
    
    return 'saas'; // Default
  }

  extractPricingStrategy(analysis) {
    const strategies = ['premium', 'high', 'medium', 'low'];
    for (const strategy of strategies) {
      if (analysis.toLowerCase().includes(strategy)) {
        return strategy;
      }
    }
    return 'medium';
  }

  assessCompetitivePosition(marketAnalysis, analysis) {
    const competition = marketAnalysis.competitiveLandscape || '';
    if (competition.includes('low') || analysis.includes('differentiated')) return 'strong';
    if (competition.includes('high') || analysis.includes('competitive')) return 'challenging';
    return 'moderate';
  }

  assessScalability(businessStrategy, analysis) {
    const approach = businessStrategy.approach || '';
    if (approach.includes('market-first') || analysis.includes('high scale')) return 'high';
    if (approach.includes('product-led') || analysis.includes('medium scale')) return 'medium';
    return 'low';
  }

  calculateProjectionSummary(projections) {
    const totalRevenue = projections.reduce((sum, p) => sum + p.revenue, 0);
    const totalCosts = projections.reduce((sum, p) => sum + p.costs.total, 0);
    const finalCumulativeProfit = projections[projections.length - 1].cumulativeProfit;
    
    return {
      totalRevenue,
      totalCosts,
      netProfit: totalRevenue - totalCosts,
      finalCumulativeProfit,
      averageMonthlyRevenue: Math.round(totalRevenue / 12),
      averageMonthlyCosts: Math.round(totalCosts / 12)
    };
  }

  getProjectionAssumptions(revenueAnalysis, model) {
    return {
      revenueModel: revenueAnalysis.modelType,
      growthRate: `${model.scalingFactors[revenueAnalysis.scalabilityFactor]}x scaling factor`,
      marketSize: revenueAnalysis.marketSize,
      competitivePosition: revenueAnalysis.competitivePosition,
      developmentTimeline: '12 months',
      operationalCostRatio: '30% of revenue'
    };
  }

  generateScenarios(baseProjections, revenueAnalysis) {
    return {
      conservative: this.adjustProjections(baseProjections, 0.7),
      optimistic: this.adjustProjections(baseProjections, 1.3),
      pessimistic: this.adjustProjections(baseProjections, 0.5)
    };
  }

  adjustProjections(projections, multiplier) {
    return projections.map(p => ({
      ...p,
      revenue: Math.round(p.revenue * multiplier),
      profit: Math.round((p.revenue * multiplier) - p.costs.total)
    }));
  }

  getCostAssumptions(constraints) {
    return {
      hourlyRate: '$100/hour (blended rate)',
      complexity: constraints.complexity || 'medium',
      domain: constraints.domain || 'general',
      teamSize: '3-5 developers',
      aiProductivityGains: '40-60% average cost reduction'
    };
  }

  /**
   * Generate fallback financials when Ollama fails
   */
  generateFallbackFinancials(businessStrategy, context) {
    const businessType = businessStrategy.businessType || 'saas';
    const model = this.revenueModels[businessType];
    
    const fallbackCosts = this.calculateBaseDevelopmentCosts({
      complexity: 'medium',
      domain: businessStrategy.domain || 'general'
    });
    
    const aiAdjustedCosts = this.calculateAIDevelopmentCosts(
      { complexity: 'medium' },
      { modelType: businessType }
    );
    
    return {
      success: true,
      revenueAnalysis: {
        modelType: businessType,
        pricingStrategy: 'medium',
        marketSize: 'medium',
        competitivePosition: 'moderate',
        scalabilityFactor: 'medium'
      },
      costAnalysis: aiAdjustedCosts,
      financialConstraints: {
        budgetLevel: 'startup-level',
        fundingRequirement: aiAdjustedCosts.totals.aiAdjusted * 1.5,
        burnRate: Math.round(aiAdjustedCosts.totals.aiAdjusted / 12),
        runway: 12,
        breakEven: 8,
        costMultipliers: this.aiDevelopmentFactors
      },
      metadata: {
        agent: this.name,
        processingMode: 'fallback',
        model: 'fallback'
      }
    };
  }

  /**
   * Agent interface methods
   */
  async execute(task) {
    return await this.planFinancials(
      task.businessStrategy,
      task.marketAnalysis,
      task.projectConstraints,
      task.context || {}
    );
  }

  getCapabilities() {
    return this.capabilities;
  }

  getStatus() {
    return {
      name: this.name,
      status: 'ready',
      capabilities: this.capabilities,
      ollamaConnected: this.connected,
      aiFactorsEnabled: Object.keys(this.aiDevelopmentFactors).length
    };
  }
}

module.exports = UppFinancialPlannerLocal;