/**
 * UPP Epic Planner Local Agent - Proof of Concept
 * 
 * Focused agent that specializes in epic-level planning using local Ollama models.
 * This agent handles ONLY epic-level decomposition (E.CXXX categorization).
 */

const http = require('http');

class UppEpicPlannerLocal {
  constructor() {
    this.name = 'upp-epic-planner-local';
    this.description = 'Specialized agent for epic-level planning using local Ollama models';
    this.capabilities = ['epic-planning', 'domain-categorization', 'healthcare-specialization'];
    this.ollamaHost = process.env.OLLAMA_HOST || '10.1.1.42';
    this.ollamaPort = process.env.OLLAMA_PORT || '11434';
    this.connected = false;
    
    // Epic category definitions from CLAUDE.md (EXACT standards)
    this.epicCategories = {
      '0': 'Infrastructure & Setup',
      '1': 'Core Features', 
      '2': 'Integration & APIs',
      '3': 'Frontend & UI',
      '4': 'Backend Services',
      '5': 'Data & Analytics',
      '6': 'Security & Compliance',
      '7': 'DevOps & Deployment',
      '8': 'Documentation & Training',
      '9': 'Maintenance & Support'
    };
    
    // Generic domain-to-epic mapping patterns
    this.domainEpicPatterns = {
      'healthcare': {
        'compliance': '6', 'security': '6', 'data-protection': '6',
        'integration': '2', 'api': '2', 'ehr': '2', 'fhir': '2',
        'portal': '3', 'dashboard': '3', 'ui': '3',
        'records': '1', 'management': '1', 'tracking': '1'
      },
      'fintech': {
        'compliance': '6', 'security': '6', 'encryption': '6',
        'payment': '2', 'banking': '2', 'api': '2',
        'dashboard': '3', 'ui': '3', 'interface': '3',
        'transaction': '1', 'account': '1', 'billing': '1'
      },
      'general': {
        'security': '6', 'compliance': '6',
        'integration': '2', 'api': '2',
        'ui': '3', 'interface': '3',
        'feature': '1', 'core': '1'
      }
    };
  }

  async initialize() {
    console.log(`[${this.name.toUpperCase()}] Initializing epic planner agent...`);
    
    try {
      const testResult = await this.testOllamaConnection();
      this.connected = testResult;
      
      if (this.connected) {
        console.log(`[${this.name.toUpperCase()}] ✅ Ollama connected at ${this.ollamaHost}:${this.ollamaPort}`);
      } else {
        console.log(`[${this.name.toUpperCase()}] ⚠️ Ollama not available - will use fallback mode`);
      }
      
      return true; // Always return true - fallback mode works
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

  async generateWithOllama(prompt, model = 'llama3.2:3b') {
    if (!this.connected) {
      throw new Error('Ollama not available');
    }

    const requestData = JSON.stringify({
      model: model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.3,  // Lower temperature for more focused output
        top_p: 0.8,        // More focused sampling
        num_predict: 256   // Much shorter max output for speed
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
            const cleanData = responseData.trim();
            if (!cleanData) {
              reject(new Error('Empty response from Ollama'));
              return;
            }
            
            const result = JSON.parse(cleanData);
            
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

      req.setTimeout(15000, () => {
        req.destroy();
        reject(new Error('Request timeout (15s)'));
      });

      req.write(requestData);
      req.end();
    });
  }

  /**
   * Main entry point - analyze project and generate epic-level structure
   */
  async planEpics(projectDescription, context = {}) {
    const startTime = Date.now();
    
    console.log(`[${this.name.toUpperCase()}] Starting epic planning analysis...`);
    
    try {
      // Step 1: Analyze project domain and complexity
      const domainAnalysis = await this.analyzeDomain(projectDescription, context);
      
      // Step 2: Generate epic categories based on project requirements
      const epics = await this.generateEpics(projectDescription, domainAnalysis, context);
      
      // Step 3: Validate and structure epic output
      const structuredEpics = this.structureEpicOutput(epics, domainAnalysis);
      
      const duration = Date.now() - startTime;
      
      console.log(`[${this.name.toUpperCase()}] ✅ Generated ${structuredEpics.length} epics in ${duration}ms`);
      
      return {
        success: true,
        epics: structuredEpics,
        domainAnalysis,
        metadata: {
          agent: this.name,
          duration,
          totalEpics: structuredEpics.length,
          processingMode: 'local-ollama',
          model: domainAnalysis.model
        }
      };
      
    } catch (error) {
      console.error(`[${this.name.toUpperCase()}] Epic planning failed:`, error.message);
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackEpics(projectDescription, context)
      };
    }
  }

  /**
   * Analyze project domain and determine specialization needs
   */
  async analyzeDomain(projectDescription, context) {
    console.log(`[${this.name.toUpperCase()}] Analyzing project domain...`);
    
    const domainPrompt = this.createDomainAnalysisPrompt(projectDescription, context);
    
    try {
      const result = await this.generateWithOllama(domainPrompt, 'llama3.2:3b');
      
      // Extract domain insights from result
      const domainType = this.detectDomainType(projectDescription, result.content);
      const complexity = this.assessComplexity(projectDescription, result.content);
      const specializations = this.identifySpecializations(projectDescription, result.content);
      
      return {
        type: domainType,
        complexity,
        specializations,
        analysis: result.content,
        model: result.model
      };
      
    } catch (error) {
      console.error(`[${this.name.toUpperCase()}] Domain analysis failed:`, error.message);
      
      // Fallback domain analysis
      return {
        type: this.detectDomainTypeFallback(projectDescription),
        complexity: 'medium',
        specializations: this.identifySpecializationsFallback(projectDescription),
        analysis: 'Fallback analysis due to Ollama unavailability',
        model: 'fallback'
      };
    }
  }

  /**
   * Generate epics based on domain analysis
   */
  async generateEpics(projectDescription, domainAnalysis, context) {
    console.log(`[${this.name.toUpperCase()}] Generating epics for ${domainAnalysis.type} domain...`);
    
    const epicsPrompt = this.createEpicGenerationPrompt(projectDescription, domainAnalysis, context);
    
    try {
      // Use fastest model for epic generation - prioritize speed over sophistication
      const model = 'llama3.2:1b'; // Fastest available model
      const result = await this.generateWithOllama(epicsPrompt, model);
      
      // Parse epic structure from result
      return this.parseEpicsFromResponse(result.content, domainAnalysis);
      
    } catch (error) {
      console.error(`[${this.name.toUpperCase()}] Epic generation failed:`, error.message);
      throw new Error(`Epic generation failed: ${error.message}`);
    }
  }

  /**
   * Create focused domain analysis prompt
   */
  createDomainAnalysisPrompt(projectDescription, context) {
    // Ultra-short prompt for fast local processing
    const key = projectDescription.substring(0, 200) + '...';
    
    return `Analyze: ${key}

Domain type:
- healthcare (medical, HIPAA, PHI)
- fintech (payments, banking) 
- e-commerce (shopping, retail)
- saas (platform, business)

Complexity: simple, medium, complex

Answer format:
Domain: [type]
Complexity: [level]
Specializations: [list]`;
  }

  /**
   * Create focused epic generation prompt optimized for local models
   */
  createEpicGenerationPrompt(projectDescription, domainAnalysis, context) {
    // Ultra-simplified prompt for local model efficiency
    const keyRequirements = this.extractKeyRequirements(projectDescription);
    const domainPatterns = this.domainEpicPatterns[domainAnalysis.type] || this.domainEpicPatterns.general;
    
    // Generate domain-specific examples based on patterns
    const examples = this.generateDomainExamples(domainAnalysis.type);
    
    return `Create 5 epics for ${domainAnalysis.type} project:

Key needs: ${keyRequirements.slice(0, 3).join(', ')}

Epic format (CLAUDE.md standard):
E.CXXX where C = category (0-9)
- E.0XXX = Infrastructure & Setup
- E.1XXX = Core Features  
- E.2XXX = Integration & APIs
- E.3XXX = Frontend & UI
- E.4XXX = Backend Services
- E.6XXX = Security & Compliance

${examples}

Generate your 5 epics:`;
  }

  /**
   * Generate domain-specific examples for prompts
   */
  generateDomainExamples(domainType) {
    const examples = {
      healthcare: `Example:
E.0001 | Infrastructure Setup | 40
E.1001 | Patient Record System | 80
E.2001 | FHIR Integration | 60
E.3001 | Patient Portal | 70
E.6001 | HIPAA Compliance | 50`,
      
      fintech: `Example:
E.0001 | Infrastructure Setup | 40
E.1001 | Account Management | 80
E.2001 | Payment Integration | 60
E.3001 | User Dashboard | 70
E.6001 | Security Compliance | 50`,
      
      general: `Example:
E.0001 | Infrastructure Setup | 40
E.1001 | Core Features | 60
E.2001 | API Integration | 50
E.3001 | User Interface | 70
E.6001 | Security | 30`
    };
    
    return examples[domainType] || examples.general;
  }

  /**
   * Extract key requirements from project description for focused processing
   */
  extractKeyRequirements(projectDescription) {
    const requirements = [];
    const text = projectDescription.toLowerCase();
    
    // Look for key functional areas
    if (text.includes('user') || text.includes('account')) requirements.push('User Management');
    if (text.includes('data') || text.includes('record')) requirements.push('Data Management');
    if (text.includes('api') || text.includes('integration')) requirements.push('API Integration');
    if (text.includes('ui') || text.includes('interface')) requirements.push('User Interface');
    if (text.includes('security') || text.includes('compliance')) requirements.push('Security & Compliance');
    if (text.includes('mobile') || text.includes('app')) requirements.push('Mobile Support');
    if (text.includes('payment') || text.includes('billing')) requirements.push('Billing System');
    
    return requirements.length > 0 ? requirements : ['Core Platform', 'User Interface', 'Data Management'];
  }

  /**
   * Parse epics from Ollama response
   */
  parseEpicsFromResponse(response, domainAnalysis) {
    const epics = [];
    const lines = response.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      // Look for epic format: "E.XXXX | Title | Hours"
      if (line.includes('|') && line.match(/E\.\d{4}/)) {
        const parts = line.split('|').map(part => part.trim());
        if (parts.length >= 3) {
          const epicId = this.extractEpicId(parts[0]);
          const title = parts[1];
          const hours = this.extractHours(parts[2]);
          const category = this.validateCategory(epicId);
          
          if (epicId && title) {
            epics.push({
              id: epicId,
              title,
              description: `${category} for ${domainAnalysis.type} project: ${title}`,
              estimatedHours: hours,
              category,
              level: 1, // Epic level
              domain: domainAnalysis.type
            });
          }
        }
      }
    }
    
    // If parsing failed, create fallback epics
    if (epics.length === 0) {
      console.log(`[${this.name.toUpperCase()}] ⚠️ No valid epics parsed, using fallback`);
      return this.generateFallbackEpicsFromDomain(domainAnalysis);
    }
    
    return epics;
  }

  /**
   * Structure epic output for downstream processing
   */
  structureEpicOutput(epics, domainAnalysis) {
    return epics.map(epic => ({
      ...epic,
      metadata: {
        agent: this.name,
        processingMode: 'local-ollama',
        domain: domainAnalysis.type,
        complexity: domainAnalysis.complexity,
        readyForFeatureDecomposition: true
      }
    }));
  }

  /**
   * Helper methods for domain detection and epic structuring
   */
  detectDomainType(projectDescription, analysis) {
    const description = projectDescription.toLowerCase();
    
    if (description.includes('health') || description.includes('medical') || description.includes('hipaa')) {
      return 'healthcare';
    } else if (description.includes('finance') || description.includes('payment') || description.includes('banking')) {
      return 'fintech';
    } else if (description.includes('commerce') || description.includes('shop') || description.includes('retail')) {
      return 'e-commerce';
    } else if (description.includes('saas') || description.includes('platform')) {
      return 'saas-platform';
    }
    
    return 'general-software';
  }

  detectDomainTypeFallback(projectDescription) {
    return this.detectDomainType(projectDescription, '');
  }

  assessComplexity(projectDescription, analysis) {
    const description = projectDescription.toLowerCase();
    const complexityIndicators = {
      simple: ['basic', 'simple', 'minimal', 'prototype'],
      medium: ['standard', 'typical', 'medium', 'moderate'],
      complex: ['enterprise', 'scale', 'complex', 'advanced', 'comprehensive'],
      expert: ['expert', 'research', 'ai', 'machine learning', 'distributed']
    };
    
    for (const [level, indicators] of Object.entries(complexityIndicators)) {
      if (indicators.some(indicator => description.includes(indicator))) {
        return level;
      }
    }
    
    // Default based on project size
    if (projectDescription.length > 2000) return 'complex';
    if (projectDescription.length > 1000) return 'medium';
    return 'simple';
  }

  identifySpecializations(projectDescription, analysis) {
    const specializations = [];
    const description = projectDescription.toLowerCase();
    
    if (description.includes('hipaa') || description.includes('compliance')) {
      specializations.push('compliance');
    }
    if (description.includes('security') || description.includes('encryption')) {
      specializations.push('security');
    }
    if (description.includes('api') || description.includes('integration')) {
      specializations.push('integrations');
    }
    if (description.includes('mobile') || description.includes('pwa')) {
      specializations.push('mobile');
    }
    if (description.includes('ai') || description.includes('ml')) {
      specializations.push('ai-ml');
    }
    
    return specializations.length > 0 ? specializations : ['general'];
  }

  identifySpecializationsFallback(projectDescription) {
    return this.identifySpecializations(projectDescription, '');
  }

  extractEpicId(text) {
    const match = text.match(/E\.(\d{4})/);
    if (match) {
      return match[0]; // Return E.XXXX format
    }
    return null;
  }

  extractHours(text) {
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1]) : 40; // Default epic estimate
  }

  validateCategory(epicId) {
    if (!epicId) return 'Maintenance & Support';
    const categoryNum = epicId.charAt(2); // E.CXXX - get the C
    return this.epicCategories[categoryNum] || 'Maintenance & Support';
  }

  generateFallbackEpicsFromDomain(domainAnalysis) {
    const baseEpics = [
      { id: 'E.0001', title: 'Infrastructure Setup', category: 'Infrastructure & Setup', hours: 40 },
      { id: 'E.1001', title: 'Core Features', category: 'Core Features', hours: 80 },
      { id: 'E.3001', title: 'User Interface', category: 'Frontend & UI', hours: 60 },
      { id: 'E.4001', title: 'Backend Services', category: 'Backend Services', hours: 70 }
    ];
    
    // Add domain-specific epics
    if (domainAnalysis.type === 'healthcare') {
      baseEpics.push(
        { id: 'E.6001', title: 'HIPAA Compliance', category: 'Security & Compliance', hours: 50 },
        { id: 'E.2001', title: 'Healthcare Integrations', category: 'Integration & APIs', hours: 60 }
      );
    }
    
    return baseEpics.map(epic => ({
      ...epic,
      description: `${epic.category} for ${domainAnalysis.type} project`,
      level: 1,
      domain: domainAnalysis.type,
      estimatedHours: epic.hours
    }));
  }

  generateFallbackEpics(projectDescription, context) {
    return this.generateFallbackEpicsFromDomain({
      type: this.detectDomainTypeFallback(projectDescription),
      complexity: 'medium',
      specializations: ['general']
    });
  }

  /**
   * Agent interface methods
   */
  async execute(task) {
    return await this.planEpics(task.description, task.context || {});
  }

  getCapabilities() {
    return this.capabilities;
  }

  getStatus() {
    return {
      name: this.name,
      status: 'ready',
      capabilities: this.capabilities,
      ollamaConnected: this.connected
    };
  }
}

module.exports = UppEpicPlannerLocal;