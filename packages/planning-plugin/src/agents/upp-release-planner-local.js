/**
 * UPP Release Planner Local Agent - CRITICAL SCOPE CONTROL MECHANISM
 * 
 * This agent is the KEY to preventing "build everything at once" mentality.
 * It creates semver-based release roadmaps that constrain technical planning
 * to realistic, deliverable increments.
 */

const http = require('http');
const { v4: uuidv4 } = require('uuid');

class UppReleasePlannerLocal {
  constructor() {
    this.name = 'upp-release-planner-local';
    this.description = 'Release planning and semver strategy - CRITICAL SCOPE CONTROL';
    this.capabilities = ['release-planning', 'semver-strategy', 'scope-control', 'feature-prioritization'];
    this.ollamaHost = process.env.OLLAMA_HOST || '10.1.1.42';
    this.ollamaPort = process.env.OLLAMA_PORT || '11434';
    this.connected = false;
    
    // Semver strategy patterns
    this.semverPatterns = {
      'MVP': { version: '1.0.0', scope: 'minimal-viable', timeline: 'weeks' },
      'Feature': { version: 'X.Y.0', scope: 'minor-enhancement', timeline: 'weeks' },
      'Major': { version: 'X.0.0', scope: 'breaking-changes', timeline: 'months' },
      'Patch': { version: 'X.Y.Z', scope: 'bug-fixes', timeline: 'days' }
    };
    
    // Release gates and constraints
    this.releaseGates = {
      'technical': ['core-functionality', 'basic-testing', 'deployment-ready'],
      'business': ['market-validation', 'revenue-model', 'user-feedback'],
      'quality': ['essential-features', 'basic-security', 'minimal-documentation']
    };
  }

  async initialize() {
    console.log(`[${this.name.toUpperCase()}] Initializing release planner agent...`);
    
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
      return true; // Still usable in fallback mode
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
        temperature: 0.3,
        top_p: 0.8,
        num_predict: 512 // Sufficient for release planning
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
   * Main entry point - create release roadmap with scope control
   */
  async planReleases(projectDescription, businessStrategy, financialConstraints, context = {}) {
    const startTime = Date.now();
    
    console.log(`[${this.name.toUpperCase()}] Starting release planning analysis...`);
    
    try {
      // Step 1: Analyze project scope and complexity
      const scopeAnalysis = await this.analyzeScopeAndComplexity(projectDescription, context);
      
      // Step 2: Create MVP definition and boundaries
      const mvpDefinition = await this.defineMVP(projectDescription, businessStrategy, financialConstraints, scopeAnalysis);
      
      // Step 3: Generate semver-based release roadmap
      const releaseRoadmap = await this.generateReleaseRoadmap(mvpDefinition, scopeAnalysis, context);
      
      // Step 4: Create feature prioritization matrix
      const featurePrioritization = this.createFeaturePrioritization(releaseRoadmap, businessStrategy);
      
      const duration = Date.now() - startTime;
      
      console.log(`[${this.name.toUpperCase()}] ✅ Generated ${releaseRoadmap.length} releases in ${duration}ms`);
      
      return {
        success: true,
        mvpDefinition,
        releaseRoadmap,
        featurePrioritization,
        scopeAnalysis,
        constraints: {
          currentReleaseScope: releaseRoadmap[0]?.features || [],
          excludedFeatures: this.identifyExcludedFeatures(projectDescription, releaseRoadmap),
          timeboxConstraints: this.generateTimeboxConstraints(releaseRoadmap)
        },
        metadata: {
          agent: this.name,
          duration,
          totalReleases: releaseRoadmap.length,
          processingMode: 'local-ollama',
          model: scopeAnalysis.model || 'fallback'
        }
      };
      
    } catch (error) {
      console.error(`[${this.name.toUpperCase()}] Release planning failed:`, error.message);
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackReleases(projectDescription, context)
      };
    }
  }

  /**
   * Analyze project scope and complexity for release planning
   */
  async analyzeScopeAndComplexity(projectDescription, context) {
    console.log(`[${this.name.toUpperCase()}] Analyzing project scope and complexity...`);
    
    const scopePrompt = this.createScopeAnalysisPrompt(projectDescription, context);
    
    try {
      const result = await this.generateWithOllama(scopePrompt, 'llama3.2:1b');
      
      return {
        complexity: this.assessComplexity(projectDescription, result.content),
        domain: this.identifyDomain(projectDescription),
        constraints: context.constraints || [],
        timeframe: this.estimateTimeframe(projectDescription, result.content),
        riskFactors: this.identifyRiskFactors(projectDescription, result.content),
        analysis: result.content,
        model: result.model
      };
      
    } catch (error) {
      console.error(`[${this.name.toUpperCase()}] Scope analysis failed:`, error.message);
      
      return {
        complexity: this.assessComplexity(projectDescription, ''),
        domain: this.identifyDomain(projectDescription),
        constraints: context.constraints || [],
        timeframe: 'medium',
        riskFactors: ['technical-complexity', 'scope-creep'],
        analysis: 'Fallback analysis due to Ollama unavailability',
        model: 'fallback'
      };
    }
  }

  /**
   * Create ultra-focused scope analysis prompt
   */
  createScopeAnalysisPrompt(projectDescription, context) {
    const key = projectDescription.substring(0, 300);
    
    return `Analyze project scope: ${key}

Assess:
- Complexity: simple, medium, complex, enterprise
- Core features (3-5 essential ones)
- Time estimate: weeks or months
- Main risks

Format:
Complexity: [level]
Core features: [list]  
Timeframe: [estimate]
Risks: [list]`;
  }

  /**
   * Define MVP with strict scope boundaries
   */
  async defineMVP(projectDescription, businessStrategy, financialConstraints, scopeAnalysis) {
    console.log(`[${this.name.toUpperCase()}] Defining MVP scope boundaries...`);
    
    const mvpPrompt = this.createMVPDefinitionPrompt(projectDescription, businessStrategy, scopeAnalysis);
    
    try {
      const result = await this.generateWithOllama(mvpPrompt, 'llama3.2:1b');
      return this.parseMVPDefinition(result.content, scopeAnalysis);
    } catch (error) {
      console.error(`[${this.name.toUpperCase()}] MVP definition failed:`, error.message);
      return this.generateFallbackMVP(projectDescription, scopeAnalysis);
    }
  }

  /**
   * Create focused MVP definition prompt
   */
  createMVPDefinitionPrompt(projectDescription, businessStrategy, scopeAnalysis) {
    return `Define MVP for: ${projectDescription.substring(0, 200)}

Business goal: ${businessStrategy?.primaryGoal || 'Market validation'}
Complexity: ${scopeAnalysis.complexity}

MVP must have:
- 1 core user flow
- 3-5 essential features only
- Basic security/compliance
- Deployable in 4-8 weeks

Format:
Core flow: [description]
Essential features: [list]
Success criteria: [metrics]
Timeline: [weeks]`;
  }

  /**
   * Generate semver-based release roadmap
   */
  async generateReleaseRoadmap(mvpDefinition, scopeAnalysis, context) {
    console.log(`[${this.name.toUpperCase()}] Generating semver-based release roadmap...`);
    
    const roadmapPrompt = this.createRoadmapPrompt(mvpDefinition, scopeAnalysis);
    
    try {
      const result = await this.generateWithOllama(roadmapPrompt, 'llama3.2:1b');
      return this.parseReleaseRoadmap(result.content, mvpDefinition, scopeAnalysis);
    } catch (error) {
      console.error(`[${this.name.toUpperCase()}] Roadmap generation failed:`, error.message);
      return this.generateFallbackRoadmap(mvpDefinition, scopeAnalysis);
    }
  }

  /**
   * Create roadmap generation prompt
   */
  createRoadmapPrompt(mvpDefinition, scopeAnalysis) {
    return `Create release roadmap:

MVP: ${mvpDefinition.coreFlow || 'Basic functionality'}
Complexity: ${scopeAnalysis.complexity}

Plan 4 releases:
v1.0.0 - MVP (essential only)
v1.1.0 - First enhancement
v1.2.0 - Second enhancement  
v2.0.0 - Major expansion

Format each:
Version | Features | Weeks | Goals

Example:
v1.0.0 | User login, basic dashboard | 6 | Market validation`;
  }

  /**
   * Parse MVP definition from Ollama response
   */
  parseMVPDefinition(response, scopeAnalysis) {
    const mvp = {
      version: '1.0.0',
      coreFlow: 'Basic user interaction',
      features: [],
      successCriteria: [],
      timeline: 8,
      constraints: []
    };

    const lines = response.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('core flow:')) {
        mvp.coreFlow = line.split(':')[1]?.trim() || mvp.coreFlow;
      } else if (lower.includes('essential features:') || lower.includes('features:')) {
        const features = line.split(':')[1]?.trim();
        if (features) {
          mvp.features = features.split(',').map(f => f.trim()).slice(0, 5);
        }
      } else if (lower.includes('success criteria:') || lower.includes('criteria:')) {
        const criteria = line.split(':')[1]?.trim();
        if (criteria) {
          mvp.successCriteria = criteria.split(',').map(c => c.trim());
        }
      } else if (lower.includes('timeline:') || lower.includes('weeks:')) {
        const match = line.match(/(\d+)/);
        if (match) {
          mvp.timeline = Math.min(parseInt(match[1]), 12); // Cap at 12 weeks
        }
      }
    }

    // Ensure we have minimum viable features
    if (mvp.features.length === 0) {
      mvp.features = this.generateMinimalFeatures(scopeAnalysis.domain);
    }

    return mvp;
  }

  /**
   * Parse release roadmap from response
   */
  parseReleaseRoadmap(response, mvpDefinition, scopeAnalysis) {
    const roadmap = [];
    const lines = response.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      if (line.match(/v\d+\.\d+\.\d+/)) {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 3) {
          const version = parts[0].match(/v(\d+\.\d+\.\d+)/)?.[1] || '1.0.0';
          const features = parts[1]?.split(',').map(f => f.trim()) || [];
          const weeksMatch = parts[2]?.match(/(\d+)/);
          const weeks = weeksMatch ? parseInt(weeksMatch[1]) : 4;
          
          roadmap.push({
            version,
            semver: version,
            features: features.slice(0, 6), // Limit features per release
            timeline: Math.min(weeks, 12), // Cap timeline
            goals: parts[3]?.trim() || 'Feature enhancement',
            type: version.endsWith('.0.0') ? 'major' : 'minor',
            dependencies: roadmap.map(r => r.version) // Previous releases as dependencies
          });
        }
      }
    }

    // Ensure we have at least MVP release
    if (roadmap.length === 0) {
      roadmap.push({
        version: '1.0.0',
        semver: '1.0.0',
        features: mvpDefinition.features,
        timeline: mvpDefinition.timeline,
        goals: 'MVP release',
        type: 'major',
        dependencies: []
      });
    }

    return roadmap.slice(0, 6); // Limit to 6 releases max
  }

  /**
   * Helper methods for analysis
   */
  assessComplexity(projectDescription, analysis) {
    const desc = projectDescription.toLowerCase();
    const analysisText = analysis.toLowerCase();
    
    if (desc.includes('enterprise') || desc.includes('distributed') || analysisText.includes('complex')) {
      return 'complex';
    } else if (desc.includes('api') || desc.includes('integration') || desc.length > 1000) {
      return 'medium';
    }
    return 'simple';
  }

  identifyDomain(projectDescription) {
    const desc = projectDescription.toLowerCase();
    
    if (desc.includes('health') || desc.includes('medical') || desc.includes('hipaa')) {
      return 'healthcare';
    } else if (desc.includes('finance') || desc.includes('payment')) {
      return 'fintech';
    } else if (desc.includes('commerce') || desc.includes('shop')) {
      return 'e-commerce';
    }
    return 'general';
  }

  estimateTimeframe(projectDescription, analysis) {
    const desc = projectDescription.toLowerCase();
    if (desc.includes('mvp') || desc.includes('prototype') || desc.length < 500) {
      return 'weeks';
    }
    return 'months';
  }

  identifyRiskFactors(projectDescription, analysis) {
    const risks = [];
    const desc = projectDescription.toLowerCase();
    
    if (desc.includes('compliance') || desc.includes('hipaa')) risks.push('regulatory-compliance');
    if (desc.includes('integration') || desc.includes('api')) risks.push('integration-complexity');
    if (desc.includes('scale') || desc.includes('performance')) risks.push('scalability-requirements');
    if (desc.length > 2000) risks.push('scope-creep');
    
    return risks.length > 0 ? risks : ['technical-complexity'];
  }

  generateMinimalFeatures(domain) {
    const domainFeatures = {
      'healthcare': ['Patient registration', 'Basic data entry', 'HIPAA compliance', 'Simple reporting'],
      'fintech': ['User accounts', 'Basic transactions', 'Security controls', 'Simple dashboard'],
      'e-commerce': ['Product catalog', 'Shopping cart', 'Basic checkout', 'User accounts'],
      'general': ['User management', 'Core functionality', 'Basic security', 'Simple interface']
    };
    
    return domainFeatures[domain] || domainFeatures.general;
  }

  /**
   * Create feature prioritization matrix
   */
  createFeaturePrioritization(releaseRoadmap, businessStrategy) {
    const prioritization = {
      currentRelease: releaseRoadmap[0] || {},
      futureReleases: releaseRoadmap.slice(1),
      priorityMatrix: {
        'must-have': releaseRoadmap[0]?.features || [],
        'should-have': releaseRoadmap[1]?.features || [],
        'could-have': releaseRoadmap[2]?.features || [],
        'wont-have': [] // Features explicitly excluded from current planning
      }
    };

    return prioritization;
  }

  /**
   * Identify features excluded from current release planning
   */
  identifyExcludedFeatures(projectDescription, releaseRoadmap) {
    const allPlannedFeatures = releaseRoadmap.flatMap(r => r.features);
    const potentialFeatures = this.extractPotentialFeatures(projectDescription);
    
    return potentialFeatures.filter(feature => 
      !allPlannedFeatures.some(planned => 
        planned.toLowerCase().includes(feature.toLowerCase()) ||
        feature.toLowerCase().includes(planned.toLowerCase())
      )
    );
  }

  extractPotentialFeatures(projectDescription) {
    // Simple feature extraction - could be enhanced with NLP
    const features = [];
    const words = projectDescription.toLowerCase().split(/\s+/);
    
    const featureKeywords = [
      'dashboard', 'reporting', 'analytics', 'integration', 'api', 
      'mobile', 'notification', 'search', 'export', 'import',
      'calendar', 'messaging', 'chat', 'video', 'payment',
      'billing', 'subscription', 'admin', 'management'
    ];

    featureKeywords.forEach(keyword => {
      if (words.includes(keyword)) {
        features.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
      }
    });

    return features;
  }

  /**
   * Generate timebox constraints for technical planning
   */
  generateTimeboxConstraints(releaseRoadmap) {
    const currentRelease = releaseRoadmap[0];
    if (!currentRelease) return {};

    return {
      currentReleaseDeadline: `${currentRelease.timeline} weeks`,
      epicTimeLimit: Math.floor(currentRelease.timeline * 7 * 0.8), // 80% of release timeline in days
      featureTimeLimit: Math.floor(currentRelease.timeline * 7 * 0.2), // 20% per major feature
      scopeBuffer: '20%', // 20% buffer for scope adjustments
      hardDeadline: currentRelease.timeline + 2 // 2 weeks buffer maximum
    };
  }

  /**
   * Generate fallback releases when Ollama fails
   */
  generateFallbackReleases(projectDescription, context) {
    const domain = this.identifyDomain(projectDescription);
    const complexity = this.assessComplexity(projectDescription, '');
    
    const mvp = {
      version: '1.0.0',
      coreFlow: 'Basic user workflow',
      features: this.generateMinimalFeatures(domain),
      timeline: complexity === 'simple' ? 6 : complexity === 'medium' ? 8 : 12,
      successCriteria: ['User registration', 'Core functionality', 'Basic testing']
    };

    const roadmap = [
      {
        version: '1.0.0',
        semver: '1.0.0',
        features: mvp.features.slice(0, 3),
        timeline: mvp.timeline,
        goals: 'MVP release',
        type: 'major',
        dependencies: []
      },
      {
        version: '1.1.0',
        semver: '1.1.0',
        features: ['Enhanced features', 'Improved UI', 'Better performance'],
        timeline: 4,
        goals: 'First enhancement',
        type: 'minor',
        dependencies: ['1.0.0']
      }
    ];

    return {
      success: true,
      mvpDefinition: mvp,
      releaseRoadmap: roadmap,
      featurePrioritization: this.createFeaturePrioritization(roadmap, {}),
      constraints: {
        currentReleaseScope: roadmap[0].features,
        excludedFeatures: [],
        timeboxConstraints: this.generateTimeboxConstraints(roadmap)
      },
      metadata: {
        agent: this.name,
        processingMode: 'fallback',
        model: 'fallback'
      }
    };
  }

  generateFallbackMVP(projectDescription, scopeAnalysis) {
    return {
      version: '1.0.0',
      coreFlow: 'Basic user interaction',
      features: this.generateMinimalFeatures(scopeAnalysis.domain),
      successCriteria: ['Basic functionality', 'User validation', 'Technical stability'],
      timeline: scopeAnalysis.complexity === 'simple' ? 6 : 8,
      constraints: scopeAnalysis.constraints
    };
  }

  generateFallbackRoadmap(mvpDefinition, scopeAnalysis) {
    return [
      {
        version: '1.0.0',
        semver: '1.0.0',
        features: mvpDefinition.features,
        timeline: mvpDefinition.timeline,
        goals: 'MVP validation',
        type: 'major',
        dependencies: []
      }
    ];
  }

  /**
   * Agent interface methods
   */
  async execute(task) {
    return await this.planReleases(
      task.description, 
      task.businessStrategy, 
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
      criticalFunction: 'scope-control'
    };
  }
}

module.exports = UppReleasePlannerLocal;