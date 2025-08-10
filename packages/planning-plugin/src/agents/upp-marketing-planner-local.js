/**
 * UPP Marketing Planner Local Agent - Go-to-Market Strategy and Positioning
 * 
 * Provides market positioning, competitive analysis, launch strategy, and
 * customer acquisition planning that integrates with business and financial constraints.
 */

const http = require('http');

class UppMarketingPlannerLocal {
  constructor() {
    this.name = 'upp-marketing-planner-local';
    this.description = 'Go-to-market strategy, positioning, and customer acquisition planning';
    this.capabilities = ['market-positioning', 'competitive-analysis', 'launch-strategy', 'customer-acquisition'];
    this.ollamaHost = process.env.OLLAMA_HOST || '10.1.1.42';
    this.ollamaPort = process.env.OLLAMA_PORT || '11434';
    this.connected = false;
    
    // Market positioning frameworks
    this.positioningFrameworks = {
      'b2b-saas': {
        segments: ['enterprise', 'mid-market', 'smb'],
        channels: ['direct-sales', 'partner-channel', 'self-service'],
        messaging: ['productivity', 'cost-savings', 'compliance', 'innovation'],
        metrics: ['CAC', 'LTV', 'churn', 'expansion-revenue']
      },
      'marketplace': {
        segments: ['suppliers', 'buyers', 'facilitators'],
        channels: ['organic-growth', 'paid-acquisition', 'partnerships'],
        messaging: ['network-effects', 'convenience', 'trust', 'value'],
        metrics: ['GMV', 'take-rate', 'liquidity', 'retention']
      },
      'consumer': {
        segments: ['early-adopters', 'mainstream', 'late-majority'],
        channels: ['social-media', 'app-stores', 'referrals', 'content'],
        messaging: ['convenience', 'experience', 'status', 'value'],
        metrics: ['DAU', 'retention', 'viral-coefficient', 'ARPU']
      },
      'enterprise': {
        segments: ['fortune-500', 'mid-enterprise', 'government'],
        channels: ['direct-sales', 'system-integrators', 'consultants'],
        messaging: ['roi', 'risk-mitigation', 'scalability', 'integration'],
        metrics: ['deal-size', 'sales-cycle', 'win-rate', 'renewal-rate']
      }
    };
    
    // Competitive analysis templates
    this.competitiveFactors = {
      'features': { weight: 0.25, description: 'Feature completeness and differentiation' },
      'pricing': { weight: 0.20, description: 'Pricing strategy and value proposition' },
      'market-share': { weight: 0.15, description: 'Current market position and momentum' },
      'user-experience': { weight: 0.20, description: 'Product usability and customer satisfaction' },
      'technology': { weight: 0.10, description: 'Technical architecture and innovation' },
      'brand': { weight: 0.10, description: 'Brand recognition and market perception' }
    };
    
    // Launch strategy templates by market type
    this.launchStrategies = {
      'stealth': { timeline: '2-4 weeks', approach: 'limited-beta', visibility: 'low' },
      'soft-launch': { timeline: '4-8 weeks', approach: 'gradual-rollout', visibility: 'medium' },
      'big-bang': { timeline: '8-12 weeks', approach: 'full-market', visibility: 'high' },
      'regional': { timeline: '6-10 weeks', approach: 'geographic-phased', visibility: 'medium' }
    };
  }

  async initialize() {
    console.log(`[${this.name.toUpperCase()}] Initializing marketing planner agent...`);
    
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
        temperature: 0.3, // Slightly higher for creative marketing content
        top_p: 0.8,
        num_predict: 450
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
   * Main entry point - create comprehensive marketing strategy
   */
  async planMarketing(businessStrategy, marketAnalysis, financialConstraints, context = {}) {
    const startTime = Date.now();
    
    console.log(`[${this.name.toUpperCase()}] Starting marketing strategy planning...`);
    
    try {
      // Step 1: Analyze market positioning and competitive landscape
      const positioningAnalysis = await this.analyzeMarketPositioning(businessStrategy, marketAnalysis);
      
      // Step 2: Develop competitive analysis and differentiation strategy
      const competitiveAnalysis = await this.analyzeCompetitivePosition(businessStrategy, marketAnalysis, positioningAnalysis);
      
      // Step 3: Create customer acquisition strategy within budget constraints
      const acquisitionStrategy = this.createAcquisitionStrategy(positioningAnalysis, financialConstraints);
      
      // Step 4: Plan launch strategy based on market and budget
      const launchStrategy = await this.planLaunchStrategy(businessStrategy, positioningAnalysis, acquisitionStrategy, context);
      
      // Step 5: Generate marketing metrics and success criteria
      const marketingMetrics = this.defineMarketingMetrics(positioningAnalysis, acquisitionStrategy);
      
      const duration = Date.now() - startTime;
      
      console.log(`[${this.name.toUpperCase()}] ✅ Generated marketing strategy in ${duration}ms`);
      
      return {
        success: true,
        positioningAnalysis,
        competitiveAnalysis,
        acquisitionStrategy,
        launchStrategy,
        marketingMetrics,
        marketingConstraints: {
          budgetAllocation: acquisitionStrategy.budgetAllocation,
          channels: acquisitionStrategy.priorityChannels,
          timeline: launchStrategy.timeline,
          targetMetrics: marketingMetrics.targets
        },
        metadata: {
          agent: this.name,
          duration,
          processingMode: 'local-ollama',
          model: positioningAnalysis.model || 'fallback',
          positioningFramework: positioningAnalysis.framework
        }
      };
      
    } catch (error) {
      console.error(`[${this.name.toUpperCase()}] Marketing planning failed:`, error.message);
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackMarketing(businessStrategy, context)
      };
    }
  }

  /**
   * Analyze market positioning and target segments
   */
  async analyzeMarketPositioning(businessStrategy, marketAnalysis) {
    console.log(`[${this.name.toUpperCase()}] Analyzing market positioning...`);
    
    const businessType = businessStrategy.businessType || 'b2b-saas';
    const framework = this.positioningFrameworks[businessType] || this.positioningFrameworks['b2b-saas'];
    
    const positioningPrompt = this.createPositioningPrompt(businessStrategy, marketAnalysis, framework);
    
    try {
      const result = await this.generateWithOllama(positioningPrompt, 'llama3.2:1b');
      
      return {
        framework: businessType,
        targetSegments: this.extractTargetSegments(result.content, framework),
        valueProposition: this.extractValueProposition(result.content),
        messaging: this.extractMessaging(result.content, framework),
        channels: this.extractChannels(result.content, framework),
        analysis: result.content,
        model: result.model
      };
      
    } catch (error) {
      console.error(`[${this.name.toUpperCase()}] Positioning analysis failed:`, error.message);
      
      return {
        framework: businessType,
        targetSegments: [framework.segments[0]],
        valueProposition: 'Solve customer problems efficiently',
        messaging: [framework.messaging[0]],
        channels: [framework.channels[0]],
        analysis: 'Fallback positioning due to Ollama unavailability',
        model: 'fallback'
      };
    }
  }

  /**
   * Create positioning analysis prompt
   */
  createPositioningPrompt(businessStrategy, marketAnalysis, framework) {
    const business = businessStrategy.businessType || 'b2b-saas';
    const target = marketAnalysis.targetMarket || 'small-business';
    
    return `Analyze market positioning for ${business} targeting ${target}:

Business context:
- Type: ${business}
- Market: ${target}
- Competition: ${marketAnalysis.competitiveLandscape || 'moderate'}
- Approach: ${businessStrategy.approach || 'product-led'}

Framework options:
Segments: ${framework.segments.join(', ')}
Channels: ${framework.channels.join(', ')}
Messages: ${framework.messaging.join(', ')}

Recommend:
Target: [primary segment]
Value: [unique value proposition]
Message: [core messaging theme]
Channel: [best acquisition channel]

Format:
Target: [segment]
Value: [proposition]
Message: [theme]
Channel: [channel]
Rationale: [brief reason]`;
  }

  /**
   * Analyze competitive position and differentiation
   */
  async analyzeCompetitivePosition(businessStrategy, marketAnalysis, positioning) {
    console.log(`[${this.name.toUpperCase()}] Analyzing competitive position...`);
    
    const competitivePrompt = this.createCompetitivePrompt(businessStrategy, marketAnalysis, positioning);
    
    try {
      const result = await this.generateWithOllama(competitivePrompt, 'llama3.2:1b');
      
      return {
        competitivePosition: this.assessCompetitiveStrength(result.content),
        keyDifferentiators: this.extractDifferentiators(result.content),
        competitorComparison: this.createCompetitorMatrix(result.content),
        threats: this.identifyThreats(result.content),
        opportunities: this.identifyOpportunities(result.content),
        analysis: result.content,
        model: result.model
      };
      
    } catch (error) {
      console.error(`[${this.name.toUpperCase()}] Competitive analysis failed:`, error.message);
      
      return {
        competitivePosition: 'moderate',
        keyDifferentiators: ['unique-features', 'better-ux'],
        competitorComparison: { direct: 2, indirect: 3 },
        threats: ['established-players'],
        opportunities: ['market-gaps'],
        analysis: 'Fallback competitive analysis',
        model: 'fallback'
      };
    }
  }

  /**
   * Create competitive analysis prompt
   */
  createCompetitivePrompt(businessStrategy, marketAnalysis, positioning) {
    const business = businessStrategy.businessType || 'b2b-saas';
    const competition = marketAnalysis.competitiveLandscape || 'moderate';
    
    return `Analyze competitive position for ${business}:

Market context:
- Competition level: ${competition}
- Target segment: ${positioning.targetSegments?.[0] || 'general'}
- Our approach: ${businessStrategy.approach || 'product-led'}

Analysis areas:
1. Competitive strength: weak/moderate/strong
2. Key differentiators: what sets us apart
3. Main threats: competitive risks  
4. Market opportunities: gaps to exploit

Format:
Strength: [weak/moderate/strong]
Differentiators: [2-3 key advantages]
Threats: [main competitive risks]
Opportunities: [market gaps]
Strategy: [competitive approach]`;
  }

  /**
   * Create customer acquisition strategy within budget constraints
   */
  createAcquisitionStrategy(positioning, financialConstraints) {
    console.log(`[${this.name.toUpperCase()}] Creating customer acquisition strategy...`);
    
    const budgetLevel = financialConstraints.budgetLevel || 'startup-level';
    const channels = positioning.channels || ['organic-growth'];
    
    // Budget allocation based on financial constraints
    const budgetAllocations = this.calculateChannelBudgets(budgetLevel, channels);
    
    // Priority channels based on budget and positioning
    const priorityChannels = this.prioritizeChannels(channels, budgetLevel);
    
    return {
      budgetAllocation: budgetAllocations,
      priorityChannels: priorityChannels,
      acquisitionTactics: this.defineTacticsByChannel(priorityChannels, budgetLevel),
      timeline: this.createAcquisitionTimeline(priorityChannels, budgetLevel),
      expectedMetrics: this.projectAcquisitionMetrics(priorityChannels, budgetAllocations),
      riskFactors: this.identifyAcquisitionRisks(priorityChannels, budgetLevel)
    };
  }

  /**
   * Plan launch strategy based on market and budget context
   */
  async planLaunchStrategy(businessStrategy, positioning, acquisitionStrategy, context) {
    console.log(`[${this.name.toUpperCase()}] Planning launch strategy...`);
    
    const launchPrompt = this.createLaunchPrompt(businessStrategy, positioning, acquisitionStrategy);
    
    try {
      const result = await this.generateWithOllama(launchPrompt, 'llama3.2:1b');
      
      const launchType = this.determineLaunchType(result.content, acquisitionStrategy);
      const strategy = this.launchStrategies[launchType];
      
      return {
        launchType: launchType,
        timeline: strategy.timeline,
        approach: strategy.approach,
        phases: this.createLaunchPhases(launchType, positioning, acquisitionStrategy),
        channels: this.selectLaunchChannels(launchType, positioning.channels),
        messaging: this.createLaunchMessaging(positioning.messaging, positioning.valueProposition),
        successMetrics: this.defineLaunchMetrics(launchType, positioning),
        analysis: result.content,
        model: result.model
      };
      
    } catch (error) {
      console.error(`[${this.name.toUpperCase()}] Launch planning failed:`, error.message);
      
      return {
        launchType: 'soft-launch',
        timeline: '4-8 weeks',
        approach: 'gradual-rollout',
        phases: ['beta', 'limited-release', 'full-launch'],
        channels: positioning.channels || ['organic-growth'],
        messaging: positioning.messaging || ['value-focused'],
        successMetrics: { users: 100, engagement: '20%' },
        analysis: 'Fallback launch strategy',
        model: 'fallback'
      };
    }
  }

  /**
   * Create launch strategy prompt
   */
  createLaunchPrompt(businessStrategy, positioning, acquisitionStrategy) {
    const budget = acquisitionStrategy.budgetAllocation.total || 10000;
    const channels = acquisitionStrategy.priorityChannels.join(', ');
    
    return `Plan launch strategy:

Context:
- Budget: $${budget}
- Channels: ${channels}
- Target: ${positioning.targetSegments?.[0] || 'general'}
- Competition: ${positioning.analysis?.includes('high') ? 'high' : 'moderate'}

Launch types:
- Stealth: quiet beta, minimal visibility
- Soft: gradual rollout, medium visibility  
- Big-bang: full market, high visibility
- Regional: geographic phases

Recommend:
Type: [stealth/soft/big-bang/regional]
Timeline: [weeks]
Approach: [strategy]
Risk: [main launch risk]

Format:
Type: [launch type]
Timeline: [duration]  
Approach: [method]
Risk: [key risk]
Rationale: [reason for choice]`;
  }

  /**
   * Define marketing metrics and success criteria
   */
  defineMarketingMetrics(positioning, acquisitionStrategy) {
    const framework = this.positioningFrameworks[positioning.framework] || this.positioningFrameworks['b2b-saas'];
    const budget = acquisitionStrategy.budgetAllocation.total || 10000;
    
    return {
      primaryMetrics: framework.metrics.slice(0, 3),
      targets: this.calculateMetricTargets(framework.metrics, budget),
      timeline: '90 days',
      reportingFrequency: 'weekly',
      successCriteria: this.defineSuccessCriteria(framework.metrics, budget),
      warningSignals: this.defineWarningSignals(framework.metrics)
    };
  }

  /**
   * Helper methods for marketing analysis
   */
  extractTargetSegments(analysis, framework) {
    for (const segment of framework.segments) {
      if (analysis.toLowerCase().includes(segment.toLowerCase())) {
        return [segment];
      }
    }
    return [framework.segments[0]];
  }

  extractValueProposition(analysis) {
    const valueKeywords = ['value:', 'proposition:', 'benefit:', 'advantage:'];
    for (const keyword of valueKeywords) {
      if (analysis.toLowerCase().includes(keyword)) {
        const lines = analysis.split('\n');
        for (const line of lines) {
          if (line.toLowerCase().includes(keyword)) {
            return line.split(':')[1]?.trim() || 'Unique value proposition';
          }
        }
      }
    }
    return 'Solve customer problems efficiently';
  }

  extractMessaging(analysis, framework) {
    const foundMessages = [];
    for (const message of framework.messaging) {
      if (analysis.toLowerCase().includes(message)) {
        foundMessages.push(message);
      }
    }
    return foundMessages.length > 0 ? foundMessages : [framework.messaging[0]];
  }

  extractChannels(analysis, framework) {
    const foundChannels = [];
    for (const channel of framework.channels) {
      if (analysis.toLowerCase().includes(channel)) {
        foundChannels.push(channel);
      }
    }
    return foundChannels.length > 0 ? foundChannels : [framework.channels[0]];
  }

  assessCompetitiveStrength(analysis) {
    if (analysis.toLowerCase().includes('strong') || analysis.toLowerCase().includes('leader')) return 'strong';
    if (analysis.toLowerCase().includes('weak') || analysis.toLowerCase().includes('challenger')) return 'weak';
    return 'moderate';
  }

  extractDifferentiators(analysis) {
    const differentiators = [];
    const keywords = ['unique', 'different', 'advantage', 'better', 'superior'];
    
    const lines = analysis.split('\n');
    for (const line of lines) {
      if (keywords.some(keyword => line.toLowerCase().includes(keyword))) {
        if (line.includes(':')) {
          const diff = line.split(':')[1]?.trim();
          if (diff && diff.length < 50) {
            differentiators.push(diff);
          }
        }
      }
    }
    
    return differentiators.length > 0 ? differentiators : ['unique-features', 'better-ux'];
  }

  createCompetitorMatrix(analysis) {
    return {
      direct: 2, // Assume 2 direct competitors
      indirect: 3, // Assume 3 indirect competitors
      competitive_intensity: this.assessCompetitiveStrength(analysis)
    };
  }

  identifyThreats(analysis) {
    const threats = [];
    if (analysis.toLowerCase().includes('established')) threats.push('established-players');
    if (analysis.toLowerCase().includes('price')) threats.push('price-competition');
    if (analysis.toLowerCase().includes('feature')) threats.push('feature-parity');
    return threats.length > 0 ? threats : ['established-players'];
  }

  identifyOpportunities(analysis) {
    const opportunities = [];
    if (analysis.toLowerCase().includes('gap')) opportunities.push('market-gaps');
    if (analysis.toLowerCase().includes('underserved')) opportunities.push('underserved-segments');
    if (analysis.toLowerCase().includes('emerging')) opportunities.push('emerging-needs');
    return opportunities.length > 0 ? opportunities : ['market-gaps'];
  }

  calculateChannelBudgets(budgetLevel, channels) {
    const baseBudgets = {
      'startup-level': 5000,
      'funded-startup': 15000,
      'growth-stage': 40000,
      'enterprise': 100000
    };
    
    const totalBudget = baseBudgets[budgetLevel] || 5000;
    const channelCount = channels.length;
    const budgetPerChannel = Math.round(totalBudget / channelCount);
    
    const allocation = { total: totalBudget };
    channels.forEach(channel => {
      allocation[channel] = budgetPerChannel;
    });
    
    return allocation;
  }

  prioritizeChannels(channels, budgetLevel) {
    // Priority based on budget constraints
    const priorities = {
      'startup-level': ['organic-growth', 'content', 'referrals'],
      'funded-startup': ['organic-growth', 'paid-acquisition', 'partnerships'],
      'growth-stage': ['paid-acquisition', 'partnerships', 'direct-sales'],
      'enterprise': ['direct-sales', 'partnerships', 'paid-acquisition']
    };
    
    const priority = priorities[budgetLevel] || priorities['startup-level'];
    return channels.filter(channel => priority.includes(channel) || channels.length <= 2);
  }

  defineTacticsByChannel(channels, budgetLevel) {
    const tactics = {};
    
    channels.forEach(channel => {
      switch(channel) {
        case 'organic-growth':
          tactics[channel] = ['content-marketing', 'seo', 'community-building'];
          break;
        case 'paid-acquisition':
          tactics[channel] = ['google-ads', 'social-ads', 'retargeting'];
          break;
        case 'partnerships':
          tactics[channel] = ['integration-partners', 'referral-programs', 'co-marketing'];
          break;
        case 'direct-sales':
          tactics[channel] = ['outbound-sales', 'demos', 'trade-shows'];
          break;
        default:
          tactics[channel] = ['general-marketing'];
      }
    });
    
    return tactics;
  }

  createAcquisitionTimeline(channels, budgetLevel) {
    const timelines = {
      'startup-level': '3-6 months',
      'funded-startup': '6-12 months',
      'growth-stage': '12-18 months',
      'enterprise': '18-24 months'
    };
    
    return timelines[budgetLevel] || '6-12 months';
  }

  projectAcquisitionMetrics(channels, budgetAllocations) {
    const totalBudget = budgetAllocations.total;
    
    return {
      estimatedCAC: Math.round(totalBudget * 0.3), // Assume 30% of budget per customer
      expectedCustomers: Math.round(totalBudget / (totalBudget * 0.3)),
      timeToROI: '6-12 months',
      channelMix: channels.map(channel => ({ channel, weight: `${Math.round(100/channels.length)}%` }))
    };
  }

  identifyAcquisitionRisks(channels, budgetLevel) {
    const risks = [];
    
    if (budgetLevel === 'startup-level') risks.push('limited-budget');
    if (channels.includes('paid-acquisition')) risks.push('ad-spend-efficiency');
    if (channels.length === 1) risks.push('single-channel-dependency');
    
    return risks.length > 0 ? risks : ['general-market-risk'];
  }

  determineLaunchType(analysis, acquisitionStrategy) {
    const budget = acquisitionStrategy.budgetAllocation.total;
    
    if (budget < 10000 || analysis.toLowerCase().includes('stealth')) return 'stealth';
    if (budget > 50000 || analysis.toLowerCase().includes('big-bang')) return 'big-bang';
    if (analysis.toLowerCase().includes('regional')) return 'regional';
    return 'soft-launch';
  }

  createLaunchPhases(launchType, positioning, acquisitionStrategy) {
    const phaseMap = {
      'stealth': ['private-beta', 'limited-release'],
      'soft-launch': ['beta', 'limited-release', 'gradual-rollout'],
      'big-bang': ['announcement', 'full-launch', 'scale-up'],
      'regional': ['region-1', 'region-2', 'national']
    };
    
    return phaseMap[launchType] || phaseMap['soft-launch'];
  }

  selectLaunchChannels(launchType, availableChannels) {
    const channelMap = {
      'stealth': 1, // Minimal channels
      'soft-launch': 2, // Limited channels
      'big-bang': availableChannels.length, // All channels
      'regional': Math.min(2, availableChannels.length) // Regional subset
    };
    
    const maxChannels = channelMap[launchType] || 2;
    return availableChannels.slice(0, maxChannels);
  }

  createLaunchMessaging(positioning, valueProposition) {
    return {
      primary: valueProposition,
      supporting: positioning || ['innovation', 'reliability'],
      callToAction: 'Experience the difference',
      targetAudience: 'Early adopters and innovation-focused customers'
    };
  }

  defineLaunchMetrics(launchType, positioning) {
    const metricMap = {
      'stealth': { users: 50, feedback: 'qualitative' },
      'soft-launch': { users: 200, retention: '30%' },
      'big-bang': { users: 1000, awareness: '5%' },
      'regional': { users: 500, market_penetration: '2%' }
    };
    
    return metricMap[launchType] || metricMap['soft-launch'];
  }

  calculateMetricTargets(metrics, budget) {
    const targets = {};
    
    metrics.forEach(metric => {
      switch(metric) {
        case 'CAC':
          targets[metric] = `$${Math.round(budget * 0.3)}`;
          break;
        case 'LTV':
          targets[metric] = `$${Math.round(budget * 2)}`;
          break;
        case 'churn':
          targets[metric] = '5% monthly';
          break;
        case 'DAU':
          targets[metric] = Math.round(budget / 100);
          break;
        default:
          targets[metric] = 'TBD';
      }
    });
    
    return targets;
  }

  defineSuccessCriteria(metrics, budget) {
    return {
      primary: `Achieve positive unit economics within 90 days`,
      secondary: `Build sustainable acquisition channel with <$${Math.round(budget * 0.2)} CAC`,
      tertiary: `Establish market position and brand recognition`
    };
  }

  defineWarningSignals(metrics) {
    return {
      'high-cac': 'CAC exceeds LTV by 50%+',
      'low-retention': 'Monthly churn above 10%',
      'channel-failure': 'Primary channel underperforming by 50%+'
    };
  }

  /**
   * Generate fallback marketing strategy when Ollama fails
   */
  generateFallbackMarketing(businessStrategy, context) {
    const businessType = businessStrategy.businessType || 'b2b-saas';
    const framework = this.positioningFrameworks[businessType];
    
    return {
      success: true,
      positioningAnalysis: {
        framework: businessType,
        targetSegments: [framework.segments[0]],
        valueProposition: 'Solve customer problems efficiently',
        messaging: [framework.messaging[0]],
        channels: [framework.channels[0]]
      },
      competitiveAnalysis: {
        competitivePosition: 'moderate',
        keyDifferentiators: ['unique-features'],
        threats: ['established-players'],
        opportunities: ['market-gaps']
      },
      acquisitionStrategy: {
        budgetAllocation: { total: 10000, [framework.channels[0]]: 10000 },
        priorityChannels: [framework.channels[0]],
        timeline: '6-12 months'
      },
      launchStrategy: {
        launchType: 'soft-launch',
        timeline: '4-8 weeks',
        approach: 'gradual-rollout',
        phases: ['beta', 'limited-release', 'full-launch']
      },
      marketingConstraints: {
        budgetAllocation: { total: 10000 },
        channels: [framework.channels[0]],
        timeline: '4-8 weeks',
        targetMetrics: { CAC: '$3000', retention: '30%' }
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
    return await this.planMarketing(
      task.businessStrategy,
      task.marketAnalysis,
      task.financialConstraints,
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
      positioningFrameworks: Object.keys(this.positioningFrameworks).length
    };
  }
}

module.exports = UppMarketingPlannerLocal;