/**
 * ID Generation Service - CLAUDE.md Standards Compliant
 * Generates human-readable hierarchical identifiers following UPP methodology
 * Format: {E,F,S,T,ST,A}.{C}XXX.XX... where C=domain, XXX=zero-padded numbers
 */

import { Logger } from '../utils/Logger';
import { StateService } from './StateService';

export enum TaskLevel {
  EPIC = 'epic',
  FEATURE = 'feature', 
  STORY = 'story',
  TASK = 'task',
  SUBTASK = 'subtask',
  ATOMIC = 'atomic'
}

export enum DomainCategory {
  INFRASTRUCTURE = 0,    // E.0XXX - Infrastructure & Setup
  CORE_FEATURES = 1,     // E.1XXX - Core Features  
  INTEGRATION = 2,       // E.2XXX - Integration & APIs
  FRONTEND = 3,          // E.3XXX - Frontend & UI
  BACKEND = 4,           // E.4XXX - Backend Services
  DATA_ANALYTICS = 5,    // E.5XXX - Data & Analytics
  SECURITY = 6,          // E.6XXX - Security & Compliance
  DEVOPS = 7,           // E.7XXX - DevOps & Deployment
  DOCUMENTATION = 8,     // E.8XXX - Documentation & Training
  MAINTENANCE = 9        // E.9XXX - Maintenance & Support
}

export interface IdGenerationContext {
  level: TaskLevel;
  parentId?: string;
  projectId?: string;
  title?: string;
  description?: string;
  domainOverride?: DomainCategory;
}

export interface ParsedId {
  prefix: string;           // E, F, S, T, ST, A
  domain: DomainCategory;   // 0-9
  epicNumber: number;       // XXX (001, 002, etc.)
  featureNumber?: number;   // XX (01, 02, etc.)
  storyNumber?: number;     // XX
  taskNumber?: number;      // XX  
  subtaskNumber?: number;   // XX
  atomicNumber?: number;    // XX
  fullId: string;          // Complete ID string
}

/**
 * Service for generating CLAUDE.md compliant hierarchical task identifiers
 */
export class IdGenerationService {
  private logger: Logger;
  private stateService: StateService;

  // Domain detection keywords
  private readonly DOMAIN_KEYWORDS: Record<DomainCategory, string[]> = {
    [DomainCategory.INFRASTRUCTURE]: [
      'infrastructure', 'setup', 'config', 'deploy', 'environment', 'init', 'installation',
      'provisioning', 'server', 'hosting', 'cloud', 'aws', 'docker', 'kubernetes'
    ],
    [DomainCategory.CORE_FEATURES]: [
      'feature', 'functionality', 'core', 'main', 'primary', 'business', 'workflow',
      'process', 'logic', 'algorithm', 'calculation', 'engine'
    ],
    [DomainCategory.INTEGRATION]: [
      'api', 'integration', 'webhook', 'external', 'third-party', 'connector', 'sync',
      'import', 'export', 'bridge', 'gateway', 'microservice', 'rest', 'graphql'
    ],
    [DomainCategory.FRONTEND]: [
      'ui', 'frontend', 'interface', 'dashboard', 'screen', 'page', 'component',
      'react', 'vue', 'angular', 'css', 'html', 'responsive', 'mobile'
    ],
    [DomainCategory.BACKEND]: [
      'backend', 'service', 'server', 'database', 'api', 'endpoint', 'middleware',
      'controller', 'model', 'repository', 'queue', 'worker', 'job'
    ],
    [DomainCategory.DATA_ANALYTICS]: [
      'data', 'analytics', 'reporting', 'metrics', 'dashboard', 'chart', 'graph',
      'statistics', 'analysis', 'insight', 'kpi', 'business intelligence', 'etl'
    ],
    [DomainCategory.SECURITY]: [
      'security', 'auth', 'authentication', 'authorization', 'compliance', 'audit',
      'encryption', 'ssl', 'tls', 'firewall', 'permission', 'role', 'access'
    ],
    [DomainCategory.DEVOPS]: [
      'devops', 'deployment', 'pipeline', 'ci', 'cd', 'build', 'test', 'automation',
      'jenkins', 'github actions', 'gitlab', 'monitoring', 'logging', 'observability'
    ],
    [DomainCategory.DOCUMENTATION]: [
      'documentation', 'docs', 'training', 'tutorial', 'guide', 'manual', 'help',
      'wiki', 'readme', 'specification', 'requirements', 'user guide'
    ],
    [DomainCategory.MAINTENANCE]: [
      'maintenance', 'support', 'bug', 'fix', 'refactor', 'cleanup', 'optimization',
      'performance', 'upgrade', 'patch', 'hotfix', 'issue', 'troubleshooting'
    ]
  };


  constructor(stateService: StateService, logger: Logger) {
    this.stateService = stateService;
    this.logger = logger;
  }

  /**
   * Generate a new hierarchical ID based on context
   */
  async generateId(context: IdGenerationContext): Promise<string> {
    try {
      // Determine domain category
      const domain = context.domainOverride || await this.detectDomain(context);

      // Parse parent ID if provided
      const parentParsed = context.parentId ? this.parseId(context.parentId) : null;

      // Generate ID based on level and parent
      const id = await this.generateHierarchicalId(context.level, domain, parentParsed);

      this.logger.debug('Generated hierarchical ID', {
        level: context.level,
        domain,
        parentId: context.parentId,
        generatedId: id
      });

      return id;
    } catch (error) {
      this.logger.error('Failed to generate ID', { error, context });
      throw error;
    }
  }

  /**
   * Parse an existing ID into its components
   */
  parseId(id: string): ParsedId {
    const parts = id.split('.');
    if (parts.length < 2) {
      throw new Error(`Invalid ID format: ${id}`);
    }

    const prefix = parts[0];
    const domainAndNumber = parts[1];
    
    // Extract domain (first digit) and epic number (remaining digits)
    if (!prefix || !domainAndNumber) {
      throw new Error(`Invalid ID format: ${id}`);
    }
    const domain = parseInt(domainAndNumber.charAt(0)) as DomainCategory;
    const epicNumber = parseInt(domainAndNumber.substring(1));

    const parsed: ParsedId = {
      prefix,
      domain,
      epicNumber,
      fullId: id
    };

    // Parse additional hierarchy levels if present
    if (parts.length > 2 && parts[2]) parsed.featureNumber = parseInt(parts[2]);
    if (parts.length > 3 && parts[3]) parsed.storyNumber = parseInt(parts[3]);
    if (parts.length > 4 && parts[4]) parsed.taskNumber = parseInt(parts[4]);
    if (parts.length > 5 && parts[5]) parsed.subtaskNumber = parseInt(parts[5]);
    if (parts.length > 6 && parts[6]) parsed.atomicNumber = parseInt(parts[6]);

    return parsed;
  }

  /**
   * Detect domain category from title and description
   */
  private async detectDomain(context: IdGenerationContext): Promise<DomainCategory> {
    const text = `${context.title || ''} ${context.description || ''}`.toLowerCase();

    // Find domain with highest keyword match count
    let bestDomain = DomainCategory.MAINTENANCE; // Default fallback
    let bestScore = 0;

    for (const [domain, keywords] of Object.entries(this.DOMAIN_KEYWORDS)) {
      const domainCategory = parseInt(domain) as DomainCategory;
      const score = keywords.reduce((count, keyword) => {
        return count + (text.includes(keyword.toLowerCase()) ? 1 : 0);
      }, 0);

      if (score > bestScore) {
        bestScore = score;
        bestDomain = domainCategory;
      }
    }

    this.logger.debug('Domain detection result', {
      text: text.substring(0, 100),
      detectedDomain: bestDomain,
      score: bestScore
    });

    return bestDomain;
  }

  /**
   * Generate hierarchical ID based on level, domain, and parent
   */
  private async generateHierarchicalId(
    level: TaskLevel,
    domain: DomainCategory,
    parent: ParsedId | null
  ): Promise<string> {
    switch (level) {
      case TaskLevel.EPIC:
        return await this.generateEpicId(domain);
      
      case TaskLevel.FEATURE:
        if (!parent || parent.prefix !== 'E') {
          throw new Error('Features must have an Epic parent');
        }
        return await this.generateFeatureId(parent);
      
      case TaskLevel.STORY:
        if (!parent || parent.prefix !== 'F') {
          throw new Error('Stories must have a Feature parent');
        }
        return await this.generateStoryId(parent);
      
      case TaskLevel.TASK:
        if (!parent || parent.prefix !== 'S') {
          throw new Error('Tasks must have a Story parent');
        }
        return await this.generateTaskId(parent);
      
      case TaskLevel.SUBTASK:
        if (!parent || parent.prefix !== 'T') {
          throw new Error('Subtasks must have a Task parent');
        }
        return await this.generateSubtaskId(parent);
      
      case TaskLevel.ATOMIC:
        if (!parent || parent.prefix !== 'ST') {
          throw new Error('Atomic tasks must have a Subtask parent');
        }
        return await this.generateAtomicId(parent);
      
      default:
        throw new Error(`Unsupported task level: ${level}`);
    }
  }

  /**
   * Generate Epic ID: E.0001, E.1001, etc.
   */
  private async generateEpicId(domain: DomainCategory): Promise<string> {
    // Get next epic number for this domain
    const epicNumber = await this.getNextEpicNumber(domain);
    return `E.${domain}${epicNumber.toString().padStart(3, '0')}`;
  }

  /**
   * Generate Feature ID: F.0001.01, F.0001.02, etc.
   */
  private async generateFeatureId(parent: ParsedId): Promise<string> {
    const featureNumber = await this.getNextChildNumber(parent.fullId, 'F');
    return `F.${parent.domain}${parent.epicNumber.toString().padStart(3, '0')}.${featureNumber.toString().padStart(2, '0')}`;
  }

  /**
   * Generate Story ID: S.0001.01.01, etc.
   */
  private async generateStoryId(parent: ParsedId): Promise<string> {
    const storyNumber = await this.getNextChildNumber(parent.fullId, 'S');
    return `S.${parent.domain}${parent.epicNumber.toString().padStart(3, '0')}.${parent.featureNumber!.toString().padStart(2, '0')}.${storyNumber.toString().padStart(2, '0')}`;
  }

  /**
   * Generate Task ID: T.0001.01.01.01, etc.
   */
  private async generateTaskId(parent: ParsedId): Promise<string> {
    const taskNumber = await this.getNextChildNumber(parent.fullId, 'T');
    return `T.${parent.domain}${parent.epicNumber.toString().padStart(3, '0')}.${parent.featureNumber!.toString().padStart(2, '0')}.${parent.storyNumber!.toString().padStart(2, '0')}.${taskNumber.toString().padStart(2, '0')}`;
  }

  /**
   * Generate Subtask ID: ST.0001.01.01.01.01, etc.
   */
  private async generateSubtaskId(parent: ParsedId): Promise<string> {
    const subtaskNumber = await this.getNextChildNumber(parent.fullId, 'ST');
    return `ST.${parent.domain}${parent.epicNumber.toString().padStart(3, '0')}.${parent.featureNumber!.toString().padStart(2, '0')}.${parent.storyNumber!.toString().padStart(2, '0')}.${parent.taskNumber!.toString().padStart(2, '0')}.${subtaskNumber.toString().padStart(2, '0')}`;
  }

  /**
   * Generate Atomic ID: A.0001.01.01.01.01.01, etc.
   */
  private async generateAtomicId(parent: ParsedId): Promise<string> {
    const atomicNumber = await this.getNextChildNumber(parent.fullId, 'A');
    return `A.${parent.domain}${parent.epicNumber.toString().padStart(3, '0')}.${parent.featureNumber!.toString().padStart(2, '0')}.${parent.storyNumber!.toString().padStart(2, '0')}.${parent.taskNumber!.toString().padStart(2, '0')}.${parent.subtaskNumber!.toString().padStart(2, '0')}.${atomicNumber.toString().padStart(2, '0')}`;
  }

  /**
   * Get next epic number for a domain (001, 002, etc.)
   */
  private async getNextEpicNumber(domain: DomainCategory): Promise<number> {
    const pattern = `E.${domain}%`;
    const result = await this.stateService.get<{max_number: number}>(`
      SELECT MAX(CAST(SUBSTR(id, 4) AS INTEGER)) as max_number 
      FROM tasks 
      WHERE id LIKE ? AND id GLOB 'E.${domain}[0-9][0-9][0-9]'
    `, [pattern]);
    
    return (result?.max_number || 0) + 1;
  }

  /**
   * Get next child number for a parent ID
   */
  private async getNextChildNumber(parentId: string, _childPrefix: string): Promise<number> {
    const result = await this.stateService.get<{count: number}>(`
      SELECT COUNT(*) as count 
      FROM tasks 
      WHERE parent_id = ?
    `, [parentId]);
    
    return (result?.count || 0) + 1;
  }

  /**
   * Get domain name for display purposes
   */
  getDomainName(domain: DomainCategory): string {
    const names: Record<DomainCategory, string> = {
      [DomainCategory.INFRASTRUCTURE]: 'Infrastructure & Setup',
      [DomainCategory.CORE_FEATURES]: 'Core Features',
      [DomainCategory.INTEGRATION]: 'Integration & APIs',
      [DomainCategory.FRONTEND]: 'Frontend & UI', 
      [DomainCategory.BACKEND]: 'Backend Services',
      [DomainCategory.DATA_ANALYTICS]: 'Data & Analytics',
      [DomainCategory.SECURITY]: 'Security & Compliance',
      [DomainCategory.DEVOPS]: 'DevOps & Deployment',
      [DomainCategory.DOCUMENTATION]: 'Documentation & Training',
      [DomainCategory.MAINTENANCE]: 'Maintenance & Support'
    };
    
    return names[domain];
  }

  /**
   * Validate an ID format
   */
  isValidId(id: string): boolean {
    try {
      this.parseId(id);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get hierarchy level from ID
   */
  getIdLevel(id: string): TaskLevel | null {
    const prefix = id.split('.')[0];
    if (!prefix) return null;
    
    const levelMap: Record<string, TaskLevel> = {
      'E': TaskLevel.EPIC,
      'F': TaskLevel.FEATURE,
      'S': TaskLevel.STORY,
      'T': TaskLevel.TASK,
      'ST': TaskLevel.SUBTASK,
      'A': TaskLevel.ATOMIC
    };
    
    return levelMap[prefix] || null;
  }
}