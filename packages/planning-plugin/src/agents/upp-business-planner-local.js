/**
 * UPP Business Planner Local Agent - Top-Level Strategic Planning
 * 
 * Root agent that defines business strategy, priorities, and constraints
 * that flow down to all other planning agents. This is the foundation
 * of the entire planning hierarchy.
 */

const http = require('http');

class UppBusinessPlannerLocal {
  constructor() {
    this.name = 'upp-business-planner-local';
    this.description = 'Top-level business strategy and vision planning';
    this.capabilities = ['strategic-planning', 'business-analysis', 'stakeholder-alignment', 'success-metrics'];
    
    // Parse MOSAIC_OLLAMA_URL or fall back to individual env vars
    this.parseOllamaConfig();
    this.connected = false;
    
    // Business strategy frameworks
    this.strategyFrameworks = {
      'lean-startup': { focus: 'rapid-validation', metrics: 'customer-feedback', timeline: 'short' },
      'market-first': { focus: 'market-penetration', metrics: 'market-share', timeline: 'medium' },
      'product-led': { focus: 'product-excellence', metrics: 'user-engagement', timeline: 'long' },
      'revenue-first': { focus: 'monetization', metrics: 'revenue-growth', timeline: 'medium' }
    };
    
    // Success metrics by business type
    this.successMetrics = {
      'saas': ['MRR', 'churn-rate', 'customer-acquisition-cost', 'lifetime-value'],
      'marketplace': ['transaction-volume', 'active-users', 'take-rate', 'retention'],
      'enterprise': ['contract-value', 'implementation-time', 'user-adoption', 'expansion-revenue'],
      'consumer': ['daily-active-users', 'engagement-rate', 'viral-coefficient', 'retention']
    };
  }

  parseOllamaConfig() {
    // Priority 1: Use MOSAIC_OLLAMA_URL from MCP environment
    const mosaicOllamaUrl = process.env.MOSAIC_OLLAMA_URL;
    if (mosaicOllamaUrl) {
      try {
        const url = new URL(mosaicOllamaUrl);
        this.ollamaHost = url.hostname;
        this.ollamaPort = url.port || '11434';
        console.log(`[${this.name.toUpperCase()}] Using MOSAIC_OLLAMA_URL: ${mosaicOllamaUrl}`);
        return;
      } catch (e) {
        console.warn(`[${this.name.toUpperCase()}] Invalid MOSAIC_OLLAMA_URL: ${mosaicOllamaUrl}, falling back...`);
      }
    }

    // Priority 2: Use individual environment variables
    this.ollamaHost = process.env.OLLAMA_HOST || 'localhost';
    this.ollamaPort = process.env.OLLAMA_PORT || '11434';
    
    console.log(`[${this.name.toUpperCase()}] Using Ollama configuration: ${this.ollamaHost}:${this.ollamaPort}`);
  }

  async initialize() {
    console.log(`[${this.name.toUpperCase()}] Initializing business planner agent...`);
    
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
        temperature: 0.4, // Slightly higher for strategic thinking
        top_p: 0.85,
        num_predict: 512
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

      req.setTimeout(20000, () => {
        req.destroy();
        reject(new Error('Request timeout (20s)'));
      });

      req.write(requestData);
      req.end();
    });
  }

  /**
   * Main entry point - create comprehensive business strategy
   */
  async planBusinessStrategy(projectDescription, stakeholderInput, marketContext, context = {}) {
    const startTime = Date.now();
    
    console.log(`[${this.name.toUpperCase()}] Starting business strategy analysis...`);
    
    try {
      // Step 1: Analyze business opportunity and market fit
      const opportunityAnalysis = await this.analyzeBusinessOpportunity(projectDescription, marketContext);
      
      // Step 2: Define strategic framework and approach
      const strategicFramework = await this.defineStrategicFramework(projectDescription, opportunityAnalysis, stakeholderInput);
      
      // Step 3: Establish success metrics and KPIs
      const successMetrics = this.establishSuccessMetrics(strategicFramework, opportunityAnalysis);
      
      // Step 4: Identify constraints and risk factors
      const constraintsAndRisks = this.identifyConstraintsAndRisks(projectDescription, context, opportunityAnalysis);
      
      // Step 5: Create stakeholder alignment framework
      const stakeholderAlignment = this.createStakeholderAlignment(strategicFramework, stakeholderInput);
      
      const duration = Date.now() - startTime;
      
      console.log(`[${this.name.toUpperCase()}] ✅ Generated business strategy in ${duration}ms`);
      
      return {
        success: true,
        strategicFramework,
        opportunityAnalysis,
        successMetrics,
        constraintsAndRisks,
        stakeholderAlignment,
        businessConstraints: {
          primaryGoal: strategicFramework.primaryGoal,
          timeframe: strategicFramework.timeframe,
          budgetConstraints: constraintsAndRisks.budget,
          qualityGates: successMetrics.qualityGates,
          stakeholderPriorities: stakeholderAlignment.priorities
        },
        metadata: {
          agent: this.name,
          duration,
          processingMode: 'local-ollama',
          model: opportunityAnalysis.model || 'fallback',
          strategicApproach: strategicFramework.approach
        }
      };
      
    } catch (error) {
      console.error(`[${this.name.toUpperCase()}] Business planning failed:`, error.message);
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackStrategy(projectDescription, context)
      };
    }
  }

  /**
   * Analyze business opportunity and market potential
   */
  async analyzeBusinessOpportunity(projectDescription, marketContext) {
    console.log(`[${this.name.toUpperCase()}] Analyzing business opportunity...`);
    
    const opportunityPrompt = this.createOpportunityAnalysisPrompt(projectDescription, marketContext);
    
    try {
      const result = await this.generateWithOllama(opportunityPrompt, 'llama3.2:1b');
      
      return {
        marketSize: this.assessMarketSize(projectDescription, result.content),
        competitiveLandscape: this.analyzeCompetition(projectDescription, result.content),
        valueProposition: this.extractValueProposition(result.content),
        targetMarket: this.identifyTargetMarket(projectDescription, result.content),
        businessModel: this.identifyBusinessModel(projectDescription, result.content),
        analysis: result.content,
        model: result.model
      };
      
    } catch (error) {
      console.error(`[${this.name.toUpperCase()}] Opportunity analysis failed:`, error.message);
      
      return {
        marketSize: this.assessMarketSize(projectDescription, ''),
        competitiveLandscape: 'moderate-competition',
        valueProposition: 'Improved efficiency and user experience',
        targetMarket: this.identifyTargetMarket(projectDescription, ''),
        businessModel: this.identifyBusinessModel(projectDescription, ''),
        analysis: 'Fallback analysis due to Ollama unavailability',
        model: 'fallback'
      };
    }
  }

  /**
   * Create focused opportunity analysis prompt
   */
  createOpportunityAnalysisPrompt(projectDescription, marketContext) {
    const key = projectDescription.substring(0, 300);
    const context = marketContext ? marketContext.substring(0, 200) : 'General market';
    
    return `Analyze business opportunity: ${key}

Market context: ${context}

Assess:
- Target audience (who needs this?)
- Market size (large, medium, small)
- Competition level (low, medium, high)  
- Value proposition (main benefit)
- Business model (how to make money)

Format:
Target: [audience]
Market: [size]
Competition: [level]
Value: [main benefit]
Model: [revenue approach]`;
  }

  /**
   * Define strategic framework and approach
   */
  async defineStrategicFramework(projectDescription, opportunityAnalysis, stakeholderInput) {
    console.log(`[${this.name.toUpperCase()}] Defining strategic framework...`);
    
    const strategyPrompt = this.createStrategyFrameworkPrompt(projectDescription, opportunityAnalysis, stakeholderInput);
    
    try {
      const result = await this.generateWithOllama(strategyPrompt, 'llama3.2:1b');
      return this.parseStrategicFramework(result.content, opportunityAnalysis);
    } catch (error) {
      console.error(`[${this.name.toUpperCase()}] Strategy framework failed:`, error.message);
      return this.generateFallbackFramework(opportunityAnalysis);
    }
  }

  /**
   * Create strategy framework prompt
   */
  createStrategyFrameworkPrompt(projectDescription, opportunityAnalysis, stakeholderInput) {
    return `Define strategy for: ${projectDescription.substring(0, 200)}

Market: ${opportunityAnalysis.marketSize}
Competition: ${opportunityAnalysis.competitiveLandscape}
Business model: ${opportunityAnalysis.businessModel}

Strategy options:
- Lean startup (fast validation)
- Market first (capture share)
- Product led (best experience)
- Revenue first (quick monetization)

Choose approach and define:
Primary goal: [objective]
Timeline: [months/years]
Success measure: [key metric]
Risk tolerance: [low/medium/high]

Format:
Approach: [strategy]
Goal: [primary objective]
Timeline: [timeframe]
Success: [main metric]
Risk: [tolerance level]`;
  }

  /**
   * Parse strategic framework from response
   */
  parseStrategicFramework(response, opportunityAnalysis) {
    const framework = {
      approach: 'lean-startup',
      primaryGoal: 'Market validation',
      timeframe: 'medium',
      successMeasure: 'customer-feedback',
      riskTolerance: 'medium',
      businessType: opportunityAnalysis.businessModel
    };

    const lines = response.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('approach:')) {
        const approach = line.split(':')[1]?.trim();
        if (approach && this.strategyFrameworks[approach.replace(/\s+/g, '-')]) {
          framework.approach = approach.replace(/\s+/g, '-');
        }
      } else if (lower.includes('goal:')) {
        framework.primaryGoal = line.split(':')[1]?.trim() || framework.primaryGoal;
      } else if (lower.includes('timeline:')) {
        framework.timeframe = line.split(':')[1]?.trim() || framework.timeframe;
      } else if (lower.includes('success:')) {
        framework.successMeasure = line.split(':')[1]?.trim() || framework.successMeasure;
      } else if (lower.includes('risk:')) {
        framework.riskTolerance = line.split(':')[1]?.trim() || framework.riskTolerance;
      }
    }

    return framework;
  }

  /**
   * Establish success metrics and KPIs
   */
  establishSuccessMetrics(strategicFramework, opportunityAnalysis) {
    const businessType = this.mapBusinessType(opportunityAnalysis.businessModel);
    const baseMetrics = this.successMetrics[businessType] || this.successMetrics.saas;
    
    return {
      primaryKPI: baseMetrics[0],
      secondaryKPIs: baseMetrics.slice(1, 3),
      qualityGates: [
        'user-validation',
        'technical-feasibility', 
        'market-response',
        'revenue-potential'
      ],
      measurementFrequency: 'weekly',
      successThresholds: this.defineSuccessThresholds(strategicFramework, businessType)
    };
  }

  /**
   * Identify business constraints and risks
   */
  identifyConstraintsAndRisks(projectDescription, context, opportunityAnalysis) {
    const constraints = {
      budget: context.budget || 'startup-level',
      timeline: context.timeline || 'moderate',
      resources: context.resources || 'small-team',
      compliance: this.identifyComplianceNeeds(projectDescription),
      technical: this.identifyTechnicalConstraints(projectDescription)
    };

    const risks = {
      market: opportunityAnalysis.competitiveLandscape === 'high-competition' ? 'high' : 'medium',
      technical: constraints.technical.length > 2 ? 'high' : 'medium',
      financial: constraints.budget === 'limited' ? 'high' : 'medium',
      execution: constraints.resources === 'small-team' ? 'medium' : 'low'
    };

    return { constraints, risks };
  }

  /**
   * Create stakeholder alignment framework
   */
  createStakeholderAlignment(strategicFramework, stakeholderInput) {
    return {
      primaryStakeholders: stakeholderInput?.stakeholders || ['product-owner', 'development-team'],
      priorities: {
        'product-owner': [strategicFramework.primaryGoal, 'user-satisfaction', 'market-fit'],
        'development-team': ['technical-excellence', 'maintainability', 'delivery-timeline'],
        'business': ['revenue-growth', 'market-share', 'cost-efficiency']
      },
      decisionFramework: 'consensus-with-product-owner-veto',
      communicationPlan: 'weekly-updates'
    };
  }

  /**
   * Helper methods
   */
  assessMarketSize(projectDescription, analysis) {
    const desc = projectDescription.toLowerCase();
    if (desc.includes('enterprise') || desc.includes('global') || analysis.includes('large')) {
      return 'large';
    } else if (desc.includes('niche') || desc.includes('specialized')) {
      return 'small';
    }
    return 'medium';
  }

  analyzeCompetition(projectDescription, analysis) {
    if (analysis.includes('high') || analysis.includes('many competitors')) {
      return 'high-competition';
    } else if (analysis.includes('low') || analysis.includes('few competitors')) {
      return 'low-competition';
    }
    return 'moderate-competition';
  }

  extractValueProposition(analysis) {
    const propositions = [
      'Improved efficiency and automation',
      'Better user experience',
      'Cost reduction and optimization', 
      'Enhanced security and compliance',
      'Increased productivity and collaboration'
    ];
    
    return propositions[Math.floor(Math.random() * propositions.length)];
  }

  identifyTargetMarket(projectDescription, analysis) {
    const desc = projectDescription.toLowerCase();
    
    if (desc.includes('enterprise') || desc.includes('business')) {
      return 'enterprise-b2b';
    } else if (desc.includes('small business') || desc.includes('startup')) {
      return 'small-business';
    } else if (desc.includes('consumer') || desc.includes('user')) {
      return 'consumer-b2c';
    }
    return 'small-to-medium-business';
  }

  identifyBusinessModel(projectDescription, analysis) {
    const desc = projectDescription.toLowerCase();
    
    if (desc.includes('subscription') || desc.includes('saas')) {
      return 'subscription';
    } else if (desc.includes('marketplace') || desc.includes('commission')) {
      return 'marketplace';
    } else if (desc.includes('license') || desc.includes('enterprise')) {
      return 'licensing';
    }
    return 'subscription';
  }

  mapBusinessType(businessModel) {
    const mapping = {
      'subscription': 'saas',
      'marketplace': 'marketplace', 
      'licensing': 'enterprise',
      'one-time': 'consumer'
    };
    return mapping[businessModel] || 'saas';
  }

  defineSuccessThresholds(strategicFramework, businessType) {
    const thresholds = {
      'saas': { users: 1000, revenue: 10000, retention: 80 },
      'marketplace': { transactions: 500, volume: 50000, active_users: 2000 },
      'enterprise': { contracts: 10, avg_value: 100000, implementation: 90 },
      'consumer': { dau: 10000, engagement: 60, viral: 1.2 }
    };
    
    return thresholds[businessType] || thresholds.saas;
  }

  identifyComplianceNeeds(projectDescription) {
    const needs = [];
    const desc = projectDescription.toLowerCase();
    
    if (desc.includes('health') || desc.includes('medical') || desc.includes('hipaa')) {
      needs.push('HIPAA');
    }
    if (desc.includes('financial') || desc.includes('payment') || desc.includes('banking')) {
      needs.push('PCI-DSS');
    }
    if (desc.includes('europe') || desc.includes('gdpr')) {
      needs.push('GDPR');
    }
    if (desc.includes('data') || desc.includes('privacy')) {
      needs.push('Privacy-Laws');
    }
    
    return needs;
  }

  identifyTechnicalConstraints(projectDescription) {
    const constraints = [];
    const desc = projectDescription.toLowerCase();
    
    if (desc.includes('real-time') || desc.includes('live')) {
      constraints.push('real-time-performance');
    }
    if (desc.includes('scale') || desc.includes('millions')) {
      constraints.push('high-scalability');
    }
    if (desc.includes('integration') || desc.includes('api')) {
      constraints.push('system-integration');
    }
    if (desc.includes('mobile') || desc.includes('app')) {
      constraints.push('cross-platform');
    }
    
    return constraints;
  }

  /**
   * Generate fallback strategy when Ollama fails
   */
  generateFallbackStrategy(projectDescription, context) {
    const domain = this.identifyTargetMarket(projectDescription, '');
    const businessModel = this.identifyBusinessModel(projectDescription, '');
    
    return {
      success: true,
      strategicFramework: {
        approach: 'lean-startup',
        primaryGoal: 'Market validation and user feedback',
        timeframe: 'medium',
        successMeasure: 'customer-satisfaction',
        riskTolerance: 'medium',
        businessType: businessModel
      },
      opportunityAnalysis: {
        marketSize: 'medium',
        competitiveLandscape: 'moderate-competition',
        valueProposition: 'Improved efficiency and user experience',
        targetMarket: domain,
        businessModel: businessModel
      },
      successMetrics: this.establishSuccessMetrics({ businessType: businessModel }, { businessModel }),
      constraintsAndRisks: this.identifyConstraintsAndRisks(projectDescription, context, { businessModel }),
      businessConstraints: {
        primaryGoal: 'Market validation and user feedback',
        timeframe: 'medium',
        budgetConstraints: context.budget || 'startup-level',
        qualityGates: ['user-validation', 'technical-feasibility'],
        stakeholderPriorities: ['user-satisfaction', 'technical-excellence']
      },
      metadata: {
        agent: this.name,
        processingMode: 'fallback',
        model: 'fallback'
      }
    };
  }

  generateFallbackFramework(opportunityAnalysis) {
    return {
      approach: 'lean-startup',
      primaryGoal: 'Market validation',
      timeframe: 'medium',
      successMeasure: 'customer-feedback',
      riskTolerance: 'medium',
      businessType: opportunityAnalysis.businessModel
    };
  }

  /**
   * Agent interface methods
   */
  async execute(task) {
    return await this.planBusinessStrategy(
      task.description,
      task.stakeholderInput,
      task.marketContext, 
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
      role: 'root-strategic-planner'
    };
  }
}

module.exports = UppBusinessPlannerLocal;