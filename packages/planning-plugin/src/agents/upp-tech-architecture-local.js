/**
 * UPP Tech Architecture Local Agent - Technology Stack and Architecture Decisions
 * 
 * Provides technology stack recommendations, architecture patterns, and
 * infrastructure decisions based on business requirements and release constraints.
 */

const http = require('http');

class UppTechArchitectureLocal {
  constructor() {
    this.name = 'upp-tech-architecture-local';
    this.description = 'Technology stack selection and architecture pattern recommendations';
    this.capabilities = ['tech-stack-analysis', 'architecture-patterns', 'infrastructure-planning', 'scalability-design'];
    this.ollamaHost = process.env.OLLAMA_HOST || '10.1.1.42';
    this.ollamaPort = process.env.OLLAMA_PORT || '11434';
    this.connected = false;
    
    // Technology stacks by domain and complexity
    this.technologyStacks = {
      'web-application': {
        'simple': {
          frontend: ['React', 'Next.js', 'Tailwind CSS'],
          backend: ['Node.js', 'Express', 'SQLite'],
          hosting: ['Vercel', 'Netlify', 'Railway'],
          database: ['SQLite', 'PostgreSQL']
        },
        'medium': {
          frontend: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
          backend: ['Node.js', 'Express/Fastify', 'PostgreSQL'],
          hosting: ['AWS', 'Vercel', 'Railway', 'Fly.io'],
          database: ['PostgreSQL', 'Redis'],
          monitoring: ['Sentry', 'Upstash']
        },
        'complex': {
          frontend: ['React', 'Next.js', 'TypeScript', 'Material-UI/Chakra'],
          backend: ['Node.js', 'NestJS/Fastify', 'PostgreSQL', 'Redis'],
          hosting: ['AWS', 'Docker', 'Kubernetes'],
          database: ['PostgreSQL', 'Redis', 'Elasticsearch'],
          monitoring: ['DataDog', 'Sentry', 'Grafana']
        },
        'enterprise': {
          frontend: ['React', 'Next.js', 'TypeScript', 'Enterprise UI'],
          backend: ['Node.js', 'NestJS', 'Microservices'],
          hosting: ['AWS/Azure/GCP', 'Kubernetes', 'Docker'],
          database: ['PostgreSQL', 'Redis', 'Elasticsearch', 'Data Lake'],
          monitoring: ['DataDog', 'New Relic', 'ELK Stack']
        }
      },
      'mobile-application': {
        'simple': {
          framework: ['React Native', 'Expo'],
          backend: ['Firebase', 'Supabase'],
          hosting: ['Firebase', 'AWS Amplify']
        },
        'medium': {
          framework: ['React Native', 'Flutter'],
          backend: ['Node.js', 'Express', 'PostgreSQL'],
          hosting: ['AWS', 'Google Cloud'],
          apis: ['GraphQL', 'REST']
        },
        'complex': {
          framework: ['React Native', 'Flutter', 'Native'],
          backend: ['Microservices', 'API Gateway'],
          hosting: ['Multi-cloud', 'CDN'],
          apis: ['GraphQL', 'gRPC', 'WebSocket']
        }
      },
      'data-platform': {
        'medium': {
          ingestion: ['Apache Kafka', 'AWS Kinesis'],
          processing: ['Apache Spark', 'Airflow'],
          storage: ['PostgreSQL', 'S3', 'BigQuery'],
          analytics: ['dbt', 'Metabase', 'Superset']
        },
        'complex': {
          ingestion: ['Apache Kafka', 'Pulsar'],
          processing: ['Apache Spark', 'Flink', 'Airflow'],
          storage: ['Data Lake', 'Warehouse', 'Vector DB'],
          analytics: ['dbt', 'Looker', 'Tableau']
        }
      }
    };
    
    // Architecture patterns by scale and complexity
    this.architecturePatterns = {
      'monolith': {
        complexity: 'simple',
        scale: 'small',
        benefits: ['Simple deployment', 'Easy debugging', 'Fast development'],
        drawbacks: ['Limited scalability', 'Technology lock-in'],
        useCases: ['MVPs', 'Small teams', 'Rapid prototyping']
      },
      'modular-monolith': {
        complexity: 'medium',
        scale: 'medium',
        benefits: ['Organized codebase', 'Independent modules', 'Single deployment'],
        drawbacks: ['Shared database', 'Moderate complexity'],
        useCases: ['Growing applications', 'Medium teams', 'Clear boundaries']
      },
      'microservices': {
        complexity: 'complex',
        scale: 'large',
        benefits: ['Independent scaling', 'Technology diversity', 'Team autonomy'],
        drawbacks: ['Distributed complexity', 'Network overhead'],
        useCases: ['Large scale', 'Multiple teams', 'Different domains']
      },
      'serverless': {
        complexity: 'medium',
        scale: 'variable',
        benefits: ['No server management', 'Pay per use', 'Auto scaling'],
        drawbacks: ['Vendor lock-in', 'Cold starts', 'Limited runtime'],
        useCases: ['Event-driven', 'Variable load', 'Cost optimization']
      }
    };
    
    // Compliance requirements and their tech implications
    this.complianceRequirements = {
      'hipaa': {
        encryption: 'required',
        auditLogging: 'comprehensive',
        dataResidency: 'US-only',
        technologies: ['AWS HIPAA', 'Google Cloud Healthcare', 'Azure Healthcare'],
        restrictions: ['No client-side PHI storage', 'Encrypted databases']
      },
      'gdpr': {
        encryption: 'required',
        auditLogging: 'comprehensive',
        dataResidency: 'EU-preference',
        technologies: ['GDPR-compliant hosting', 'Right to deletion'],
        restrictions: ['Data portability', 'Consent management']
      },
      'sox': {
        encryption: 'required',
        auditLogging: 'financial-grade',
        dataResidency: 'flexible',
        technologies: ['Enterprise security', 'Change management'],
        restrictions: ['Immutable audit trails', 'Separation of duties']
      }
    };
    
    // Cost optimization strategies by budget level
    this.costOptimizations = {
      'startup-level': {
        hosting: ['Vercel', 'Railway', 'Fly.io', 'Supabase'],
        database: ['PostgreSQL on Railway', 'Supabase', 'PlanetScale'],
        monitoring: ['Free tiers', 'Basic logging'],
        cdn: ['Cloudflare free', 'Vercel Edge']
      },
      'funded-startup': {
        hosting: ['AWS t3.micro', 'Google Cloud', 'Docker'],
        database: ['Managed PostgreSQL', 'Redis Cloud'],
        monitoring: ['Sentry', 'Basic APM'],
        cdn: ['Cloudflare Pro', 'AWS CloudFront']
      },
      'growth-stage': {
        hosting: ['AWS/GCP multi-zone', 'Container orchestration'],
        database: ['HA PostgreSQL', 'Multi-region Redis'],
        monitoring: ['Full APM', 'DataDog/New Relic'],
        cdn: ['Global CDN', 'Edge computing']
      },
      'enterprise': {
        hosting: ['Multi-cloud', 'Kubernetes', 'High availability'],
        database: ['Enterprise database', 'Data replication'],
        monitoring: ['Enterprise APM', 'Full observability'],
        cdn: ['Enterprise CDN', 'Edge optimization']
      }
    };
  }

  async initialize() {
    console.log(`[${this.name.toUpperCase()}] Initializing tech architecture agent...`);
    
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
        temperature: 0.2, // Lower temperature for technical accuracy
        top_p: 0.8,
        num_predict: 500
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

      req.setTimeout(22000, () => {
        req.destroy();
        reject(new Error('Request timeout (22s)'));
      });

      req.write(requestData);
      req.end();
    });
  }

  /**
   * Main entry point - create comprehensive technology architecture
   */
  async planTechArchitecture(releaseConstraints, businessRequirements, projectConstraints, context = {}) {
    const startTime = Date.now();
    
    console.log(`[${this.name.toUpperCase()}] Starting technology architecture planning...`);
    
    try {
      // Step 1: Analyze technology requirements and constraints
      const techRequirements = await this.analyzeTechRequirements(releaseConstraints, businessRequirements, projectConstraints);
      
      // Step 2: Select optimal technology stack
      const technologyStack = await this.selectTechnologyStack(techRequirements, projectConstraints);
      
      // Step 3: Design architecture pattern and system design
      const architectureDesign = await this.designSystemArchitecture(techRequirements, technologyStack, releaseConstraints);
      
      // Step 4: Plan infrastructure and deployment strategy
      const infrastructurePlan = this.planInfrastructure(architectureDesign, projectConstraints, releaseConstraints);
      
      // Step 5: Create development workflow and toolchain recommendations
      const developmentWorkflow = this.designDevelopmentWorkflow(technologyStack, projectConstraints);
      
      // Step 6: Analyze scalability and performance considerations
      const scalabilityPlan = this.analyzeScalabilityRequirements(architectureDesign, releaseConstraints);
      
      const duration = Date.now() - startTime;
      
      console.log(`[${this.name.toUpperCase()}] ✅ Generated technology architecture in ${duration}ms`);
      
      return {
        success: true,
        techRequirements,
        technologyStack,
        architectureDesign,
        infrastructurePlan,
        developmentWorkflow,
        scalabilityPlan,
        techConstraints: {
          selectedStack: technologyStack.primaryStack,
          architecturePattern: architectureDesign.pattern,
          hostingStrategy: infrastructurePlan.hostingStrategy,
          scalabilityApproach: scalabilityPlan.approach,
          complianceRequirements: techRequirements.compliance
        },
        metadata: {
          agent: this.name,
          duration,
          processingMode: 'local-ollama',
          model: techRequirements.model || 'fallback',
          complexity: techRequirements.complexity
        }
      };
      
    } catch (error) {
      console.error(`[${this.name.toUpperCase()}] Technology planning failed:`, error.message);
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackTechPlan(businessRequirements, context)
      };
    }
  }

  /**
   * Analyze technology requirements from business and release constraints
   */
  async analyzeTechRequirements(releaseConstraints, businessRequirements, projectConstraints) {
    console.log(`[${this.name.toUpperCase()}] Analyzing technology requirements...`);
    
    const complexity = this.determineComplexity(releaseConstraints, businessRequirements);
    const applicationTypes = this.identifyApplicationTypes(businessRequirements);
    const compliance = this.identifyComplianceRequirements(businessRequirements);
    
    const requirementsPrompt = this.createRequirementsPrompt(
      releaseConstraints, businessRequirements, complexity, applicationTypes, compliance
    );
    
    try {
      const result = await this.generateWithOllama(requirementsPrompt, 'llama3.2:1b');
      
      return {
        complexity: complexity,
        applicationTypes: applicationTypes,
        compliance: compliance,
        scalabilityNeeds: this.extractScalabilityNeeds(result.content),
        performanceRequirements: this.extractPerformanceRequirements(result.content),
        integrationNeeds: this.extractIntegrationRequirements(result.content),
        securityRequirements: this.extractSecurityRequirements(result.content, compliance),
        analysis: result.content,
        model: result.model
      };
      
    } catch (error) {
      console.error(`[${this.name.toUpperCase()}] Requirements analysis failed:`, error.message);
      
      return {
        complexity: complexity,
        applicationTypes: applicationTypes,
        compliance: compliance,
        scalabilityNeeds: 'medium',
        performanceRequirements: 'standard',
        integrationNeeds: ['basic-apis'],
        securityRequirements: compliance.length > 0 ? 'high' : 'medium',
        analysis: 'Fallback requirements analysis',
        model: 'fallback'
      };
    }
  }

  /**
   * Create technology requirements analysis prompt
   */
  createRequirementsPrompt(releaseConstraints, businessRequirements, complexity, applicationTypes, compliance) {
    const features = releaseConstraints.currentReleaseFeatures || ['core-functionality'];
    const timeline = releaseConstraints.timeline || '8 weeks';
    const budget = releaseConstraints.budget || 'startup-level';
    
    return `Analyze technology requirements:

Release context:
- Timeline: ${timeline}  
- Features: ${features.join(', ')}
- Complexity: ${complexity}
- Budget: ${budget}

Application types:
${applicationTypes.join(', ')}

Compliance needs:
${compliance.length > 0 ? compliance.join(', ') : 'none'}

Determine:
Scale: [small/medium/large]
Performance: [basic/standard/high]
Security: [medium/high/enterprise]
Integration: [simple/moderate/complex]

Format:
Scale: [level]
Performance: [needs]
Security: [level]
Integration: [complexity]
Rationale: [brief reason]`;
  }

  /**
   * Select optimal technology stack based on requirements
   */
  async selectTechnologyStack(techRequirements, projectConstraints) {
    console.log(`[${this.name.toUpperCase()}] Selecting technology stack...`);
    
    const applicationTypes = techRequirements.applicationTypes;
    const complexity = techRequirements.complexity;
    const budget = projectConstraints.budget || 'startup-level';
    
    // Start with primary application type
    const primaryAppType = applicationTypes[0] || 'web-application';
    const baseStack = this.technologyStacks[primaryAppType]?.[complexity] || 
                     this.technologyStacks['web-application']['simple'];
    
    const stackPrompt = this.createStackSelectionPrompt(techRequirements, baseStack, budget);
    
    try {
      const result = await this.generateWithOllama(stackPrompt, 'llama3.2:1b');
      
      return {
        primaryStack: this.optimizeStackForConstraints(baseStack, techRequirements, projectConstraints),
        alternatives: this.generateStackAlternatives(baseStack, complexity),
        reasoning: result.content,
        costOptimizations: this.costOptimizations[budget] || this.costOptimizations['startup-level'],
        complianceAdjustments: this.applyComplianceToStack(baseStack, techRequirements.compliance),
        model: result.model
      };
      
    } catch (error) {
      console.error(`[${this.name.toUpperCase()}] Stack selection failed:`, error.message);
      
      return {
        primaryStack: baseStack,
        alternatives: [baseStack],
        reasoning: 'Fallback stack selection based on complexity',
        costOptimizations: this.costOptimizations[budget],
        complianceAdjustments: {},
        model: 'fallback'
      };
    }
  }

  /**
   * Create stack selection prompt
   */
  createStackSelectionPrompt(techRequirements, baseStack, budget) {
    const compliance = techRequirements.compliance.join(', ') || 'none';
    const scale = techRequirements.scalabilityNeeds || 'medium';
    
    return `Select technology stack:

Requirements:
- Scale needs: ${scale}
- Security: ${techRequirements.securityRequirements}
- Compliance: ${compliance}
- Budget: ${budget}

Base stack options:
Frontend: ${baseStack.frontend?.join(', ') || 'React'}
Backend: ${baseStack.backend?.join(', ') || 'Node.js'}
Database: ${baseStack.database?.join(', ') || 'PostgreSQL'}
Hosting: ${baseStack.hosting?.join(', ') || 'Cloud'}

Recommend:
Frontend: [best choice]
Backend: [best choice]
Database: [best choice]
Hosting: [best choice]

Format:
Frontend: [choice]
Backend: [choice]
Database: [choice]
Hosting: [choice]
Reason: [justification]`;
  }

  /**
   * Design system architecture pattern
   */
  async designSystemArchitecture(techRequirements, technologyStack, releaseConstraints) {
    console.log(`[${this.name.toUpperCase()}] Designing system architecture...`);
    
    const complexity = techRequirements.complexity;
    const scale = techRequirements.scalabilityNeeds;
    
    // Select architecture pattern based on complexity and scale
    const suggestedPattern = this.selectArchitecturePattern(complexity, scale);
    
    const architecturePrompt = this.createArchitecturePrompt(techRequirements, suggestedPattern, releaseConstraints);
    
    try {
      const result = await this.generateWithOllama(architecturePrompt, 'llama3.2:1b');
      
      return {
        pattern: suggestedPattern,
        components: this.defineSystemComponents(suggestedPattern, techRequirements),
        dataFlow: this.designDataFlow(suggestedPattern, techRequirements),
        apiDesign: this.designAPIArchitecture(suggestedPattern, techRequirements),
        securityArchitecture: this.designSecurityArchitecture(techRequirements),
        reasoning: result.content,
        model: result.model
      };
      
    } catch (error) {
      console.error(`[${this.name.toUpperCase()}] Architecture design failed:`, error.message);
      
      return {
        pattern: suggestedPattern,
        components: this.defineSystemComponents(suggestedPattern, techRequirements),
        dataFlow: 'request-response',
        apiDesign: 'REST APIs',
        securityArchitecture: 'authentication + authorization',
        reasoning: 'Fallback architecture design',
        model: 'fallback'
      };
    }
  }

  /**
   * Create architecture design prompt
   */
  createArchitecturePrompt(techRequirements, pattern, releaseConstraints) {
    const features = releaseConstraints.currentReleaseFeatures || ['core'];
    const integrationNeeds = techRequirements.integrationNeeds.join(', ');
    
    return `Design system architecture:

Pattern: ${pattern}
Features: ${features.join(', ')}
Integration needs: ${integrationNeeds}
Security level: ${techRequirements.securityRequirements}

Architecture aspects:
- Component structure
- Data flow patterns  
- API design approach
- Security implementation

Recommend:
Components: [main components]
Data: [flow pattern]
APIs: [design approach]
Security: [implementation]

Format:
Components: [list]
Data: [pattern]
APIs: [approach]
Security: [strategy]
Rationale: [brief reason]`;
  }

  /**
   * Plan infrastructure and deployment strategy
   */
  planInfrastructure(architectureDesign, projectConstraints, releaseConstraints) {
    console.log(`[${this.name.toUpperCase()}] Planning infrastructure...`);
    
    const budget = projectConstraints.budget || 'startup-level';
    const timeline = releaseConstraints.timeline || '8 weeks';
    const pattern = architectureDesign.pattern;
    
    return {
      hostingStrategy: this.selectHostingStrategy(pattern, budget),
      deploymentPipeline: this.designDeploymentPipeline(pattern, timeline),
      monitoring: this.selectMonitoringStack(budget, architectureDesign.pattern),
      backupStrategy: this.designBackupStrategy(pattern, budget),
      scalingStrategy: this.designScalingStrategy(pattern, budget),
      estimatedCosts: this.estimateInfrastructureCosts(pattern, budget),
      securityMeasures: this.planSecurityMeasures(architectureDesign.securityArchitecture, budget)
    };
  }

  /**
   * Design development workflow and toolchain
   */
  designDevelopmentWorkflow(technologyStack, projectConstraints) {
    console.log(`[${this.name.toUpperCase()}] Designing development workflow...`);
    
    const budget = projectConstraints.budget || 'startup-level';
    const teamSize = projectConstraints.teamSize || 'small-team';
    
    return {
      developmentTools: this.selectDevelopmentTools(technologyStack, budget),
      cicdPipeline: this.designCICDPipeline(technologyStack, budget),
      codeQuality: this.setupCodeQuality(technologyStack, teamSize),
      testing: this.designTestingStrategy(technologyStack, budget),
      documentation: this.planDocumentationStrategy(teamSize),
      workflow: this.defineGitWorkflow(teamSize)
    };
  }

  /**
   * Analyze scalability requirements and design scaling strategy
   */
  analyzeScalabilityRequirements(architectureDesign, releaseConstraints) {
    console.log(`[${this.name.toUpperCase()}] Analyzing scalability requirements...`);
    
    const pattern = architectureDesign.pattern;
    const timeline = releaseConstraints.timeline || '8 weeks';
    
    return {
      approach: this.selectScalabilityApproach(pattern),
      horizontalScaling: this.planHorizontalScaling(pattern),
      verticalScaling: this.planVerticalScaling(pattern),
      databaseScaling: this.planDatabaseScaling(pattern),
      caching: this.planCachingStrategy(pattern),
      cdnStrategy: this.planCDNStrategy(pattern),
      performanceTargets: this.definePerformanceTargets(pattern, timeline)
    };
  }

  /**
   * Helper methods for technology analysis
   */
  determineComplexity(releaseConstraints, businessRequirements) {
    const featureCount = releaseConstraints.currentReleaseFeatures?.length || 3;
    const businessType = businessRequirements.businessType || 'b2b-saas';
    const compliance = this.identifyComplianceRequirements(businessRequirements);
    
    if (featureCount > 10 || compliance.length > 1 || businessType === 'enterprise') return 'complex';
    if (featureCount > 5 || compliance.length > 0 || businessType === 'marketplace') return 'medium';
    return 'simple';
  }

  identifyApplicationTypes(businessRequirements) {
    const businessType = businessRequirements.businessType || 'b2b-saas';
    
    const typeMapping = {
      'b2b-saas': ['web-application'],
      'marketplace': ['web-application', 'mobile-application'],
      'consumer': ['mobile-application', 'web-application'],
      'enterprise': ['web-application', 'data-platform'],
      'fintech': ['web-application', 'data-platform'],
      'healthcare': ['web-application']
    };
    
    return typeMapping[businessType] || ['web-application'];
  }

  identifyComplianceRequirements(businessRequirements) {
    const domain = businessRequirements.domain || '';
    const compliance = [];
    
    if (domain.includes('healthcare') || domain.includes('hipaa')) compliance.push('hipaa');
    if (domain.includes('finance') || domain.includes('fintech')) compliance.push('sox');
    if (businessRequirements.globalMarket || domain.includes('gdpr')) compliance.push('gdpr');
    
    return compliance;
  }

  extractScalabilityNeeds(analysis) {
    if (analysis.toLowerCase().includes('large') || analysis.toLowerCase().includes('enterprise')) return 'high';
    if (analysis.toLowerCase().includes('medium') || analysis.toLowerCase().includes('growth')) return 'medium';
    return 'low';
  }

  extractPerformanceRequirements(analysis) {
    if (analysis.toLowerCase().includes('high performance') || analysis.toLowerCase().includes('real-time')) return 'high';
    if (analysis.toLowerCase().includes('standard') || analysis.toLowerCase().includes('typical')) return 'standard';
    return 'basic';
  }

  extractIntegrationRequirements(analysis) {
    const integrations = [];
    if (analysis.toLowerCase().includes('api')) integrations.push('rest-apis');
    if (analysis.toLowerCase().includes('graphql')) integrations.push('graphql');
    if (analysis.toLowerCase().includes('webhook')) integrations.push('webhooks');
    if (analysis.toLowerCase().includes('third-party')) integrations.push('third-party-services');
    return integrations.length > 0 ? integrations : ['basic-apis'];
  }

  extractSecurityRequirements(analysis, compliance) {
    if (compliance.length > 0) return 'high';
    if (analysis.toLowerCase().includes('high security') || analysis.toLowerCase().includes('enterprise')) return 'high';
    if (analysis.toLowerCase().includes('medium')) return 'medium';
    return 'standard';
  }

  optimizeStackForConstraints(baseStack, techRequirements, projectConstraints) {
    const budget = projectConstraints.budget || 'startup-level';
    const optimizations = this.costOptimizations[budget];
    
    const optimizedStack = { ...baseStack };
    
    // Apply budget optimizations
    if (optimizations) {
      if (optimizations.hosting) optimizedStack.hosting = optimizations.hosting;
      if (optimizations.database) optimizedStack.database = optimizations.database;
      if (optimizations.monitoring) optimizedStack.monitoring = optimizations.monitoring;
    }
    
    // Apply compliance adjustments
    const compliance = techRequirements.compliance;
    if (compliance.length > 0) {
      compliance.forEach(req => {
        const complianceReq = this.complianceRequirements[req];
        if (complianceReq && complianceReq.technologies) {
          optimizedStack.compliance = complianceReq.technologies;
        }
      });
    }
    
    return optimizedStack;
  }

  generateStackAlternatives(baseStack, complexity) {
    // Generate 2-3 alternative stacks
    const alternatives = [];
    
    if (complexity === 'simple') {
      alternatives.push({
        name: 'Full-stack Framework',
        frontend: ['Next.js', 'Tailwind CSS'],
        backend: ['Next.js API Routes'],
        database: ['PlanetScale MySQL'],
        hosting: ['Vercel']
      });
    }
    
    alternatives.push({
      name: 'Modern Stack',
      frontend: baseStack.frontend,
      backend: ['TypeScript', 'Fastify'],
      database: ['PostgreSQL', 'Prisma ORM'],
      hosting: ['Railway', 'Fly.io']
    });
    
    return alternatives;
  }

  applyComplianceToStack(stack, compliance) {
    const adjustments = {};
    
    compliance.forEach(req => {
      const complianceReq = this.complianceRequirements[req];
      if (complianceReq) {
        adjustments[req] = {
          encryption: complianceReq.encryption,
          auditLogging: complianceReq.auditLogging,
          dataResidency: complianceReq.dataResidency,
          restrictions: complianceReq.restrictions
        };
      }
    });
    
    return adjustments;
  }

  selectArchitecturePattern(complexity, scale) {
    if (complexity === 'simple' || scale === 'small') return 'monolith';
    if (complexity === 'medium' || scale === 'medium') return 'modular-monolith';
    if (complexity === 'complex' || scale === 'large') return 'microservices';
    return 'monolith';
  }

  defineSystemComponents(pattern, techRequirements) {
    const baseComponents = ['frontend', 'backend', 'database', 'authentication'];
    
    if (pattern === 'microservices') {
      baseComponents.push('api-gateway', 'service-discovery', 'message-queue');
    }
    
    if (techRequirements.compliance.length > 0) {
      baseComponents.push('audit-service', 'encryption-service');
    }
    
    return baseComponents;
  }

  designDataFlow(pattern, techRequirements) {
    if (pattern === 'microservices') return 'event-driven + REST APIs';
    if (techRequirements.integrationNeeds.includes('graphql')) return 'GraphQL + REST';
    return 'REST APIs + Database';
  }

  designAPIArchitecture(pattern, techRequirements) {
    if (techRequirements.integrationNeeds.includes('graphql')) return 'GraphQL with REST fallback';
    if (pattern === 'microservices') return 'REST APIs with API Gateway';
    return 'REST APIs';
  }

  designSecurityArchitecture(techRequirements) {
    const security = ['JWT authentication', 'Role-based authorization'];
    
    if (techRequirements.securityRequirements === 'high') {
      security.push('End-to-end encryption', 'Comprehensive audit logging');
    }
    
    if (techRequirements.compliance.includes('hipaa')) {
      security.push('HIPAA-compliant data handling', 'Encrypted data at rest');
    }
    
    return security.join(', ');
  }

  selectHostingStrategy(pattern, budget) {
    const strategies = {
      'monolith': {
        'startup-level': 'Single container on Railway/Fly.io',
        'funded-startup': 'Container on AWS/GCP',
        'growth-stage': 'Load-balanced containers',
        'enterprise': 'Multi-region deployment'
      },
      'microservices': {
        'startup-level': 'Docker Compose on single host',
        'funded-startup': 'Kubernetes on managed service',
        'growth-stage': 'Auto-scaling Kubernetes',
        'enterprise': 'Multi-cluster Kubernetes'
      }
    };
    
    return strategies[pattern]?.[budget] || 'Basic cloud hosting';
  }

  designDeploymentPipeline(pattern, timeline) {
    const isRapid = timeline.includes('week') && parseInt(timeline) <= 8;
    
    if (isRapid) {
      return {
        strategy: 'Simple CI/CD',
        stages: ['build', 'test', 'deploy'],
        tools: ['GitHub Actions', 'Simple deployment']
      };
    }
    
    return {
      strategy: 'Multi-stage pipeline',
      stages: ['build', 'test', 'security-scan', 'staging', 'production'],
      tools: ['GitHub Actions/GitLab CI', 'Multiple environments']
    };
  }

  selectMonitoringStack(budget, pattern) {
    const stacks = {
      'startup-level': ['Basic logging', 'Uptime monitoring', 'Error tracking (Sentry)'],
      'funded-startup': ['APM (basic)', 'Metrics collection', 'Alerts'],
      'growth-stage': ['Full APM', 'Custom dashboards', 'Performance monitoring'],
      'enterprise': ['Enterprise APM', 'Distributed tracing', 'Full observability']
    };
    
    return stacks[budget] || stacks['startup-level'];
  }

  designBackupStrategy(pattern, budget) {
    if (budget === 'startup-level') return 'Daily database backups';
    if (budget === 'funded-startup') return 'Automated backups + point-in-time recovery';
    if (budget === 'growth-stage') return 'Multi-region backups + disaster recovery';
    return 'Enterprise backup with geo-redundancy';
  }

  designScalingStrategy(pattern, budget) {
    if (pattern === 'monolith') return 'Vertical scaling + load balancing';
    if (pattern === 'modular-monolith') return 'Horizontal scaling + database optimization';
    return 'Auto-scaling microservices + distributed caching';
  }

  estimateInfrastructureCosts(pattern, budget) {
    const estimates = {
      'startup-level': '$50-200/month',
      'funded-startup': '$200-800/month',
      'growth-stage': '$800-3000/month',
      'enterprise': '$3000+/month'
    };
    
    return estimates[budget] || estimates['startup-level'];
  }

  planSecurityMeasures(securityArchitecture, budget) {
    const measures = ['SSL/TLS encryption', 'Secure authentication'];
    
    if (budget !== 'startup-level') {
      measures.push('Web Application Firewall', 'DDoS protection');
    }
    
    if (budget === 'enterprise') {
      measures.push('Security monitoring', 'Penetration testing');
    }
    
    return measures;
  }

  selectDevelopmentTools(technologyStack, budget) {
    const tools = {
      ide: ['VS Code', 'WebStorm (if budget allows)'],
      version_control: ['Git + GitHub/GitLab'],
      package_management: ['npm/yarn', 'Docker'],
      debugging: ['Built-in debuggers', 'Browser dev tools']
    };
    
    if (budget !== 'startup-level') {
      tools.monitoring = ['Development APM', 'Performance profiling'];
    }
    
    return tools;
  }

  designCICDPipeline(technologyStack, budget) {
    const pipeline = {
      platform: 'GitHub Actions',
      stages: ['lint', 'test', 'build', 'deploy'],
      environments: budget === 'startup-level' ? ['production'] : ['staging', 'production'],
      deployment: budget === 'startup-level' ? 'Direct deploy' : 'Blue-green deployment'
    };
    
    return pipeline;
  }

  setupCodeQuality(technologyStack, teamSize) {
    const quality = {
      linting: ['ESLint', 'Prettier'],
      testing: ['Jest', 'Testing Library'],
      coverage: teamSize === 'large-team' ? '85%' : '70%'
    };
    
    if (teamSize !== 'solo') {
      quality.codeReview = 'Pull request reviews';
      quality.standards = 'Coding standards document';
    }
    
    return quality;
  }

  designTestingStrategy(technologyStack, budget) {
    const strategy = {
      unit: 'Jest + Testing Library',
      integration: 'API testing with Supertest',
      e2e: budget === 'startup-level' ? 'Manual testing' : 'Playwright/Cypress'
    };
    
    if (budget !== 'startup-level') {
      strategy.performance = 'Load testing';
    }
    
    return strategy;
  }

  planDocumentationStrategy(teamSize) {
    if (teamSize === 'solo') return 'Basic README + inline comments';
    if (teamSize === 'small-team') return 'README + API docs + architecture docs';
    return 'Comprehensive documentation + API reference + onboarding guide';
  }

  defineGitWorkflow(teamSize) {
    if (teamSize === 'solo') return 'Simple main branch workflow';
    if (teamSize === 'small-team') return 'Feature branch workflow';
    return 'Git Flow with feature branches and release branches';
  }

  selectScalabilityApproach(pattern) {
    if (pattern === 'monolith') return 'Vertical scaling with load balancing';
    if (pattern === 'modular-monolith') return 'Horizontal scaling with service separation';
    return 'Independent service scaling with container orchestration';
  }

  planHorizontalScaling(pattern) {
    if (pattern === 'microservices') return 'Auto-scaling per service';
    return 'Load balancer + multiple application instances';
  }

  planVerticalScaling(pattern) {
    return 'CPU and memory scaling based on metrics';
  }

  planDatabaseScaling(pattern) {
    if (pattern === 'microservices') return 'Database per service + read replicas';
    return 'Read replicas + connection pooling + query optimization';
  }

  planCachingStrategy(pattern) {
    if (pattern === 'simple') return 'In-memory caching + CDN';
    return 'Redis caching + CDN + database query caching';
  }

  planCDNStrategy(pattern) {
    return 'Global CDN for static assets + edge caching for dynamic content';
  }

  definePerformanceTargets(pattern, timeline) {
    const isRapid = timeline.includes('week') && parseInt(timeline) <= 8;
    
    if (isRapid) {
      return {
        response_time: '<2s',
        availability: '99.0%',
        concurrent_users: '100+',
        load_time: '<5s'
      };
    }
    
    return {
      response_time: '<500ms',
      availability: '99.9%',
      concurrent_users: '1000+',
      load_time: '<3s'
    };
  }

  /**
   * Generate fallback technology plan when Ollama fails
   */
  generateFallbackTechPlan(businessRequirements, context) {
    const businessType = businessRequirements.businessType || 'b2b-saas';
    const complexity = 'medium';
    
    const stack = this.technologyStacks['web-application'][complexity];
    
    return {
      success: true,
      techRequirements: {
        complexity: complexity,
        applicationTypes: ['web-application'],
        compliance: [],
        scalabilityNeeds: 'medium',
        performanceRequirements: 'standard',
        integrationNeeds: ['rest-apis'],
        securityRequirements: 'medium'
      },
      technologyStack: {
        primaryStack: stack,
        alternatives: [stack],
        reasoning: 'Fallback stack selection',
        costOptimizations: this.costOptimizations['startup-level'],
        complianceAdjustments: {}
      },
      architectureDesign: {
        pattern: 'modular-monolith',
        components: ['frontend', 'backend', 'database', 'authentication'],
        dataFlow: 'REST APIs + Database',
        apiDesign: 'REST APIs',
        securityArchitecture: 'JWT authentication + authorization'
      },
      infrastructurePlan: {
        hostingStrategy: 'Container on cloud platform',
        deploymentPipeline: {
          strategy: 'Simple CI/CD',
          stages: ['build', 'test', 'deploy'],
          tools: ['GitHub Actions']
        },
        monitoring: ['Basic logging', 'Error tracking'],
        estimatedCosts: '$50-200/month'
      },
      techConstraints: {
        selectedStack: stack,
        architecturePattern: 'modular-monolith',
        hostingStrategy: 'cloud-container',
        scalabilityApproach: 'horizontal-scaling',
        complianceRequirements: []
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
    return await this.planTechArchitecture(
      task.releaseConstraints,
      task.businessRequirements,
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
      technologyStacks: Object.keys(this.technologyStacks).length,
      architecturePatterns: Object.keys(this.architecturePatterns).length
    };
  }
}

module.exports = UppTechArchitectureLocal;