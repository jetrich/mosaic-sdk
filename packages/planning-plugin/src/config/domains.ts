/**
 * Standardized Domain Configuration for MosAIc Planning Plugin
 * Defines all permitted domains and their characteristics for business planning
 */

export interface DomainConfig {
  id: string;
  name: string;
  category: number; // 0-9 for CLAUDE.md E.CXXX compliance
  description: string;
  compliance: string[];
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
  typicalBusinessModels: string[];
  commonTechStack: {
    frontend: string[];
    backend: string[];
    database: string[];
    hosting: string[];
  };
  regulatoryRequirements?: string[];
  marketCharacteristics?: {
    competitionLevel: 'low' | 'moderate' | 'high';
    averageTimeToMarket: string;
    typicalFunding: string;
  };
}

/**
 * Complete enumeration of permitted domains
 * Each domain maps to Epic Category (E.CXXX) for CLAUDE.md compliance
 */
export const PERMITTED_DOMAINS: Record<string, DomainConfig> = {
  // Healthcare & Medical (Category 6 - Security & Compliance)
  'healthcare': {
    id: 'healthcare',
    name: 'Healthcare & Medical Technology',
    category: 6,
    description: 'Healthcare platforms, medical devices, telemedicine, and health records',
    compliance: ['hipaa', 'fda', 'hitech'],
    complexity: 'enterprise',
    typicalBusinessModels: ['b2b-saas', 'enterprise'],
    commonTechStack: {
      frontend: ['React', 'Angular', 'Vue.js'],
      backend: ['Node.js', 'Python', 'Java', '.NET'],
      database: ['PostgreSQL', 'SQL Server', 'Oracle'],
      hosting: ['AWS HIPAA', 'Azure Healthcare', 'Google Cloud Healthcare']
    },
    regulatoryRequirements: ['HIPAA compliance', 'FDA approval', 'Clinical validation'],
    marketCharacteristics: {
      competitionLevel: 'moderate',
      averageTimeToMarket: '12-24 months',
      typicalFunding: 'Series A-B'
    }
  },

  // Financial Technology (Category 6 - Security & Compliance)
  'fintech': {
    id: 'fintech',
    name: 'Financial Technology',
    category: 6, 
    description: 'Payment processing, banking, lending, insurance, and investment platforms',
    compliance: ['sox', 'pci-dss', 'gdpr', 'kyc', 'aml'],
    complexity: 'enterprise',
    typicalBusinessModels: ['b2b-saas', 'marketplace', 'enterprise'],
    commonTechStack: {
      frontend: ['React', 'Next.js', 'TypeScript'],
      backend: ['Node.js', 'Java', 'Go', 'Python'],
      database: ['PostgreSQL', 'MongoDB', 'Redis'],
      hosting: ['AWS', 'GCP', 'Azure', 'Private Cloud']
    },
    regulatoryRequirements: ['SOX compliance', 'PCI DSS', 'Banking regulations'],
    marketCharacteristics: {
      competitionLevel: 'high',
      averageTimeToMarket: '6-18 months',
      typicalFunding: 'Series A-C'
    }
  },

  // Software as a Service (Category 1 - Core Features) 
  'saas': {
    id: 'saas',
    name: 'Software as a Service',
    category: 1,
    description: 'B2B and B2C software platforms, productivity tools, and business applications',
    compliance: ['gdpr'],
    complexity: 'medium',
    typicalBusinessModels: ['b2b-saas', 'b2c-saas'],
    commonTechStack: {
      frontend: ['React', 'Vue.js', 'Next.js'],
      backend: ['Node.js', 'Python', 'Ruby'],
      database: ['PostgreSQL', 'MySQL', 'MongoDB'],
      hosting: ['Vercel', 'AWS', 'Digital Ocean', 'Railway']
    },
    marketCharacteristics: {
      competitionLevel: 'moderate',
      averageTimeToMarket: '3-12 months',
      typicalFunding: 'Seed to Series A'
    }
  },

  // E-commerce & Marketplace (Category 1 - Core Features)
  'ecommerce': {
    id: 'ecommerce',
    name: 'E-commerce & Marketplace',
    category: 1,
    description: 'Online retail, marketplaces, B2B commerce, and trade platforms',
    compliance: ['gdpr', 'pci-dss'],
    complexity: 'medium',
    typicalBusinessModels: ['marketplace', 'b2c-ecommerce', 'b2b-commerce'],
    commonTechStack: {
      frontend: ['Next.js', 'React', 'Vue.js'],
      backend: ['Node.js', 'PHP', 'Python'],
      database: ['PostgreSQL', 'MySQL', 'Redis'],
      hosting: ['Shopify', 'AWS', 'Vercel', 'WooCommerce']
    },
    marketCharacteristics: {
      competitionLevel: 'high',
      averageTimeToMarket: '2-8 months',
      typicalFunding: 'Bootstrap to Series A'
    }
  },

  // Enterprise Software (Category 4 - Backend Services)
  'enterprise': {
    id: 'enterprise',
    name: 'Enterprise Software',
    category: 4,
    description: 'Large-scale business software, ERP, CRM, and enterprise platforms',
    compliance: ['sox', 'gdpr', 'iso27001'],
    complexity: 'enterprise',
    typicalBusinessModels: ['enterprise', 'b2b-saas'],
    commonTechStack: {
      frontend: ['Angular', 'React', 'Vue.js'],
      backend: ['Java', '.NET', 'Node.js', 'Python'],
      database: ['Oracle', 'SQL Server', 'PostgreSQL'],
      hosting: ['AWS', 'Azure', 'Private Cloud', 'On-premise']
    },
    regulatoryRequirements: ['SOX compliance', 'Data governance', 'Security audits'],
    marketCharacteristics: {
      competitionLevel: 'moderate',
      averageTimeToMarket: '12-36 months',
      typicalFunding: 'Series B+'
    }
  },

  // Consumer Mobile Apps (Category 3 - Frontend & UI)
  'consumer': {
    id: 'consumer',
    name: 'Consumer Applications',
    category: 3,
    description: 'Mobile apps, social platforms, gaming, and consumer-focused applications',
    compliance: ['gdpr', 'coppa'],
    complexity: 'medium',
    typicalBusinessModels: ['consumer', 'freemium', 'subscription'],
    commonTechStack: {
      frontend: ['React Native', 'Flutter', 'Swift', 'Kotlin'],
      backend: ['Node.js', 'Python', 'Firebase'],
      database: ['Firebase', 'MongoDB', 'PostgreSQL'],
      hosting: ['Firebase', 'AWS Amplify', 'Vercel']
    },
    marketCharacteristics: {
      competitionLevel: 'high',
      averageTimeToMarket: '3-9 months',
      typicalFunding: 'Seed to Series A'
    }
  },

  // Education Technology (Category 1 - Core Features)
  'edtech': {
    id: 'edtech',
    name: 'Education Technology',
    category: 1,
    description: 'Learning platforms, educational tools, and academic software',
    compliance: ['ferpa', 'gdpr', 'coppa'],
    complexity: 'medium',
    typicalBusinessModels: ['b2b-saas', 'b2c-saas', 'freemium'],
    commonTechStack: {
      frontend: ['React', 'Vue.js', 'Next.js'],
      backend: ['Node.js', 'Python', 'Ruby'],
      database: ['PostgreSQL', 'MongoDB'],
      hosting: ['AWS', 'Google Cloud', 'Vercel']
    },
    regulatoryRequirements: ['FERPA compliance', 'Student data protection'],
    marketCharacteristics: {
      competitionLevel: 'moderate',
      averageTimeToMarket: '4-12 months',
      typicalFunding: 'Seed to Series A'
    }
  },

  // Media & Entertainment (Category 1 - Core Features)
  'media': {
    id: 'media',
    name: 'Media & Entertainment',
    category: 1,
    description: 'Content platforms, streaming, publishing, and creative tools',
    compliance: ['gdpr', 'dmca'],
    complexity: 'medium',
    typicalBusinessModels: ['subscription', 'advertising', 'marketplace'],
    commonTechStack: {
      frontend: ['React', 'Next.js', 'Vue.js'],
      backend: ['Node.js', 'Python', 'Go'],
      database: ['PostgreSQL', 'MongoDB', 'Redis'],
      hosting: ['AWS', 'Cloudflare', 'CDN providers']
    },
    marketCharacteristics: {
      competitionLevel: 'high',
      averageTimeToMarket: '3-12 months',
      typicalFunding: 'Seed to Series B'
    }
  },

  // Manufacturing & IoT (Category 5 - Data & Analytics)
  'manufacturing': {
    id: 'manufacturing',
    name: 'Manufacturing & IoT',
    category: 5,
    description: 'Industrial IoT, manufacturing software, and supply chain platforms',
    compliance: ['iso27001'],
    complexity: 'complex',
    typicalBusinessModels: ['b2b-saas', 'enterprise'],
    commonTechStack: {
      frontend: ['React', 'Angular', 'Vue.js'],
      backend: ['Node.js', 'Python', 'Java', '.NET'],
      database: ['PostgreSQL', 'InfluxDB', 'MongoDB'],
      hosting: ['AWS IoT', 'Azure IoT', 'Private Cloud']
    },
    regulatoryRequirements: ['Industry 4.0 standards', 'Safety compliance'],
    marketCharacteristics: {
      competitionLevel: 'low',
      averageTimeToMarket: '6-18 months',
      typicalFunding: 'Series A-B'
    }
  },

  // Real Estate & PropTech (Category 1 - Core Features)
  'proptech': {
    id: 'proptech',
    name: 'Property & Real Estate Technology',
    category: 1,
    description: 'Real estate platforms, property management, and construction tech',
    compliance: ['gdpr'],
    complexity: 'medium',
    typicalBusinessModels: ['marketplace', 'b2b-saas', 'transaction-fee'],
    commonTechStack: {
      frontend: ['React', 'Next.js', 'Vue.js'],
      backend: ['Node.js', 'Python', 'Ruby'],
      database: ['PostgreSQL', 'MongoDB'],
      hosting: ['AWS', 'Google Cloud', 'Vercel']
    },
    marketCharacteristics: {
      competitionLevel: 'moderate',
      averageTimeToMarket: '4-12 months',
      typicalFunding: 'Seed to Series A'
    }
  },

  // Logistics & Supply Chain (Category 5 - Data & Analytics)
  'logistics': {
    id: 'logistics',
    name: 'Logistics & Supply Chain',
    category: 5,
    description: 'Transportation, warehousing, delivery, and supply chain optimization',
    compliance: ['gdpr'],
    complexity: 'complex',
    typicalBusinessModels: ['b2b-saas', 'marketplace', 'transaction-fee'],
    commonTechStack: {
      frontend: ['React', 'Angular', 'Vue.js'],
      backend: ['Node.js', 'Java', 'Python'],
      database: ['PostgreSQL', 'MongoDB', 'Redis'],
      hosting: ['AWS', 'Google Cloud', 'Azure']
    },
    marketCharacteristics: {
      competitionLevel: 'moderate',
      averageTimeToMarket: '6-15 months',
      typicalFunding: 'Series A-B'
    }
  }
};

/**
 * Get domain configuration by ID
 */
export function getDomainConfig(domainId: string): DomainConfig | undefined {
  return PERMITTED_DOMAINS[domainId];
}

/**
 * Get domains by category (for CLAUDE.md E.CXXX compliance)
 */
export function getDomainsByCategory(category: number): DomainConfig[] {
  return Object.values(PERMITTED_DOMAINS).filter(domain => domain.category === category);
}

/**
 * Get domains by complexity level
 */
export function getDomainsByComplexity(complexity: DomainConfig['complexity']): DomainConfig[] {
  return Object.values(PERMITTED_DOMAINS).filter(domain => domain.complexity === complexity);
}

/**
 * Get domains requiring specific compliance
 */
export function getDomainsByCompliance(complianceType: string): DomainConfig[] {
  return Object.values(PERMITTED_DOMAINS).filter(domain => 
    domain.compliance.includes(complianceType)
  );
}

/**
 * Validate if a domain is permitted
 */
export function isPermittedDomain(domainId: string): boolean {
  return domainId in PERMITTED_DOMAINS;
}

/**
 * Get epic category for domain (CLAUDE.md compliance)
 */
export function getEpicCategoryForDomain(domainId: string): number {
  const domain = getDomainConfig(domainId);
  return domain?.category || 1; // Default to Core Features
}

/**
 * Auto-detect domain from project description
 */
export function detectDomainFromDescription(description: string): string | null {
  const keywords = {
    'healthcare': ['health', 'medical', 'hipaa', 'patient', 'clinic', 'hospital', 'telemedicine'],
    'fintech': ['payment', 'bank', 'financial', 'money', 'lending', 'investment', 'trading'],
    'ecommerce': ['shop', 'store', 'marketplace', 'retail', 'commerce', 'product', 'cart'],
    'enterprise': ['enterprise', 'crm', 'erp', 'business', 'corporate', 'organization'],
    'consumer': ['mobile app', 'social', 'game', 'consumer', 'user', 'community'],
    'edtech': ['education', 'learning', 'school', 'student', 'course', 'training'],
    'media': ['media', 'content', 'streaming', 'video', 'audio', 'publishing'],
    'manufacturing': ['manufacturing', 'iot', 'industrial', 'factory', 'production'],
    'proptech': ['real estate', 'property', 'housing', 'rental', 'construction'],
    'logistics': ['logistics', 'shipping', 'delivery', 'transport', 'warehouse', 'supply chain']
  };

  const lowercaseDesc = description.toLowerCase();
  
  for (const [domain, domainKeywords] of Object.entries(keywords)) {
    if (domainKeywords.some(keyword => lowercaseDesc.includes(keyword))) {
      return domain;
    }
  }
  
  return 'saas'; // Default fallback
}

export default PERMITTED_DOMAINS;