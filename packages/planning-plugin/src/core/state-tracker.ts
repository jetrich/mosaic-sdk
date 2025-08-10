/**
 * State Tracker - Persistent state management for planning modules
 * Core component of MosAIc Planning Plugin v0.1.0
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { ModuleStatus, ModuleState, ModuleDefinition } from './dependency-manager';
import { ProjectDetectionService } from '../services/ProjectDetectionService';

// Planning session schema
export const PlanningSessionSchema = z.object({
  projectId: z.string(),
  sessionId: z.string(),
  createdAt: z.date(),
  lastUpdated: z.date(),
  modules: z.record(z.object({
    definition: z.object({
      name: z.string(),
      description: z.string(),
      dependencies: z.array(z.string()),
      blocks: z.array(z.string()),
      estimatedDuration: z.number().optional(),
      priority: z.number(),
      category: z.enum(['business', 'technical', 'marketing', 'financial'])
    }),
    state: z.object({
      status: z.nativeEnum(ModuleStatus),
      startedAt: z.date().optional(),
      completedAt: z.date().optional(),
      duration: z.number().optional(),
      outputs: z.array(z.string()),
      errors: z.array(z.string()),
      metadata: z.record(z.any())
    })
  })),
  metadata: z.record(z.any()).default({})
});

export type PlanningSession = z.infer<typeof PlanningSessionSchema>;

// State tracker configuration
export interface StateTrackerConfig {
  dataDir: string;
  projectId: string;
  autoSave: boolean;
  saveInterval: number; // milliseconds
}

/**
 * Persistent state tracking for planning sessions
 * Ensures data integrity and prevents loss during handoffs
 */
export class StateTracker {
  private config: StateTrackerConfig;
  private session: PlanningSession | null = null;
  private saveTimer: NodeJS.Timeout | null = null;
  private isDirty: boolean = false;
  private detectionService: ProjectDetectionService;

  constructor(config: Partial<StateTrackerConfig> = {}) {
    this.detectionService = new ProjectDetectionService();
    this.config = this.buildInitialConfig(config);
  }

  /**
   * Build initial configuration (sync version for constructor)
   */
  private buildInitialConfig(config: Partial<StateTrackerConfig>): StateTrackerConfig {
    // Use provided config or defaults - async project detection happens in initialize()
    const dataDir = config.dataDir || join(process.cwd(), '.mosaic', 'data', 'planning');
    const projectId = config.projectId || 'default';

    return {
      dataDir,
      projectId,
      autoSave: config.autoSave !== false,
      saveInterval: config.saveInterval || 30000 // 30 seconds
    };
  }

  /**
   * Build configuration with project auto-detection (async version)
   */
  private async buildConfigAsync(config: Partial<StateTrackerConfig>): Promise<StateTrackerConfig> {
    // Default configuration
    let dataDir = config.dataDir;
    let projectId = config.projectId || 'default';

    // If no explicit dataDir provided, try to detect project and use .mosaic
    if (!dataDir) {
      try {
        // Try to find .mosaic directory in current project
        const projectRoot = await this.detectionService.getProjectRoot();
        if (projectRoot) {
          dataDir = join(projectRoot, '.mosaic', 'data', 'planning');
          
          // Try to get project ID from detected project
          const projectInfo = await this.detectionService.getProjectContext();
          if (projectInfo && projectInfo.project) {
            const project = projectInfo.project;
            if (project.type === 'greenfield') {
              projectId = (project.metadata as any).id;
            } else if (project.type === 'brownfield') {
              projectId = (project.metadata as any).remote_project.id;
            }
          }
        } else {
          // Fallback to current directory .mosaic
          dataDir = join(process.cwd(), '.mosaic', 'data', 'planning');
        }
      } catch (error) {
        // Fallback to current directory .mosaic if detection fails
        console.warn('[STATE_TRACKER] Project detection failed, using default path:', error);
        dataDir = join(process.cwd(), '.mosaic', 'data', 'planning');
      }
    }

    return {
      dataDir,
      projectId,
      autoSave: config.autoSave !== false,
      saveInterval: config.saveInterval || 30000 // 30 seconds
    };
  }

  /**
   * Initialize or load planning session
   */
  async initialize(config?: Partial<StateTrackerConfig>): Promise<void> {
    // If config provided or initial config needs project detection, rebuild config
    if (config || this.config.projectId === 'default') {
      this.config = await this.buildConfigAsync(config || {});
      console.log(`[STATE_TRACKER] Using project data directory: ${this.config.dataDir}`);
      console.log(`[STATE_TRACKER] Using project ID: ${this.config.projectId}`);
    }

    await this.ensureDataDirectory();
    await this.loadSession();
    
    if (this.config.autoSave) {
      this.startAutoSave();
    }
  }

  /**
   * Create new planning session
   */
  async createSession(sessionId?: string): Promise<PlanningSession> {
    const session: PlanningSession = {
      projectId: this.config.projectId,
      sessionId: sessionId || this.generateSessionId(),
      createdAt: new Date(),
      lastUpdated: new Date(),
      modules: {},
      metadata: {}
    };

    this.session = session;
    this.isDirty = true;
    await this.saveSession();
    
    return session;
  }

  /**
   * Load existing session or create new one
   */
  async loadSession(): Promise<PlanningSession> {
    const sessionPath = this.getSessionPath();
    
    try {
      const data = await fs.readFile(sessionPath, 'utf-8');
      const parsed = JSON.parse(data, this.dateReviver);
      this.session = PlanningSessionSchema.parse(parsed);
      console.log(`[STATE_TRACKER] Loaded session: ${this.session.sessionId}`);
      return this.session;
    } catch (error) {
      console.log(`[STATE_TRACKER] Creating new session for project: ${this.config.projectId}`);
      return await this.createSession();
    }
  }

  /**
   * Save current session to disk
   */
  async saveSession(): Promise<void> {
    if (!this.session) return;

    this.session.lastUpdated = new Date();
    const sessionPath = this.getSessionPath();
    
    try {
      const data = JSON.stringify(this.session, this.dateReplacer, 2);
      await fs.writeFile(sessionPath, data, 'utf-8');
      this.isDirty = false;
      console.log(`[STATE_TRACKER] Session saved: ${this.session.sessionId}`);
    } catch (error) {
      console.error(`[STATE_TRACKER] Failed to save session:`, error);
      throw error;
    }
  }

  /**
   * Update module state and mark for saving
   */
  updateModule(
    moduleName: string, 
    definition: ModuleDefinition, 
    state: ModuleState
  ): void {
    if (!this.session) {
      throw new Error('No active session - call initialize() first');
    }

    this.session.modules[moduleName] = {
      definition: {
        name: definition.name,
        description: definition.description,
        dependencies: definition.dependencies,
        blocks: definition.blocks,
        estimatedDuration: definition.estimatedDuration,
        priority: definition.priority,
        category: definition.category
      },
      state: {
        status: state.status,
        startedAt: state.startedAt,
        completedAt: state.completedAt,
        duration: state.duration,
        outputs: state.outputs,
        errors: state.errors,
        metadata: state.metadata
      }
    };

    this.session.lastUpdated = new Date();
    this.isDirty = true;
  }

  /**
   * Get current session data
   */
  getCurrentSession(): PlanningSession | null {
    return this.session;
  }

  /**
   * Get module state from session
   */
  getModuleState(moduleName: string): { definition: ModuleDefinition; state: ModuleState } | null {
    if (!this.session || !this.session.modules[moduleName]) {
      return null;
    }

    const moduleData = this.session.modules[moduleName];
    return {
      definition: moduleData.definition as ModuleDefinition,
      state: moduleData.state as ModuleState
    };
  }

  /**
   * List all modules in current session
   */
  listModules(): string[] {
    if (!this.session) return [];
    return Object.keys(this.session.modules);
  }

  /**
   * Update session metadata (async version for planning commands)
   */
  async updateMetadata(key: string, value: any): Promise<void> {
    if (!this.session) {
      throw new Error('No active session - call initialize() first');
    }

    this.session.metadata[key] = value;
    this.session.lastUpdated = new Date();
    this.isDirty = true;
    
    // Auto-save if enabled
    if (this.autoSave) {
      this.scheduleSave();
    }
  }

  /**
   * Get session metadata
   */
  getMetadata(key?: string): any {
    if (!this.session) return null;
    return key ? this.session.metadata[key] : this.session.metadata;
  }

  /**
   * Get current session (for planning commands)
   */
  getCurrentSession(): PlanningSession | null {
    return this.session;
  }

  /**
   * Get session statistics (for planning commands)
   */
  getSessionStats(): {
    totalModules: number;
    completedModules: number;
    sessionDuration: number;
    createdAt: Date | null;
    lastUpdated: Date | null;
    completionRate: number;
  } {
    if (!this.session) {
      return {
        totalModules: 0,
        completedModules: 0,
        sessionDuration: 0,
        createdAt: null,
        lastUpdated: null,
        completionRate: 0
      };
    }

    const modules = Object.values(this.session.modules || {});
    const totalModules = modules.length;
    const completedModules = modules.filter(module => 
      module.state?.status === 'completed'
    ).length;

    const sessionDuration = this.session.lastUpdated.getTime() - this.session.createdAt.getTime();

    return {
      totalModules,
      completedModules,
      sessionDuration,
      createdAt: this.session.createdAt,
      lastUpdated: this.session.lastUpdated,
      completionRate: totalModules > 0 ? (completedModules / totalModules) * 100 : 0
    };
  }

  /**
   * Force immediate save
   */
  async forceSave(): Promise<void> {
    if (this.isDirty) {
      await this.saveSession();
    }
  }

  /**
   * Cleanup and stop auto-save
   */
  async cleanup(): Promise<void> {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }

    if (this.isDirty) {
      await this.saveSession();
    }
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    totalModules: number;
    completedModules: number;
    inProgressModules: number;
    blockedModules: number;
    completionPercentage: number;
    totalDuration: number;
  } {
    if (!this.session) {
      return {
        totalModules: 0,
        completedModules: 0,
        inProgressModules: 0,
        blockedModules: 0,
        completionPercentage: 0,
        totalDuration: 0
      };
    }

    const modules = Object.values(this.session.modules);
    const totalModules = modules.length;
    const completedModules = modules.filter(m => m.state.status === ModuleStatus.COMPLETED).length;
    const inProgressModules = modules.filter(m => m.state.status === ModuleStatus.IN_PROGRESS).length;
    const blockedModules = modules.filter(m => m.state.status === ModuleStatus.BLOCKED).length;
    const totalDuration = modules.reduce((sum, m) => sum + (m.state.duration || 0), 0);

    return {
      totalModules,
      completedModules,
      inProgressModules,
      blockedModules,
      completionPercentage: totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
      totalDuration
    };
  }

  // Private methods

  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.dataDir, { recursive: true });
    } catch (error) {
      console.error(`[STATE_TRACKER] Failed to create data directory:`, error);
      throw error;
    }
  }

  private getSessionPath(): string {
    return join(this.config.dataDir, `${this.config.projectId}.json`);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startAutoSave(): void {
    this.saveTimer = setInterval(async () => {
      if (this.isDirty) {
        await this.saveSession();
      }
    }, this.config.saveInterval);
  }

  private dateReplacer(key: string, value: any): any {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  }

  private dateReviver(key: string, value: any): any {
    if (value && typeof value === 'object' && value.__type === 'Date') {
      return new Date(value.value);
    }
    return value;
  }
}