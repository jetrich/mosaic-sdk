/**
 * State Tracker - JavaScript version for planning commands
 * Simplified persistent state management with MosAIc integration
 */

const fs = require('fs').promises;
const path = require('path');
const { MosAIcProjectReader } = require('../utils/MosAIcProjectReader');

/**
 * State tracker for planning sessions
 */
class StateTracker {
  constructor(config = {}) {
    this.projectReader = new MosAIcProjectReader();
    this.config = {
      dataDir: config.dataDir || '~/.mosaic/data/planning',
      projectId: config.projectId || 'default',
      autoSave: config.autoSave !== false,
      saveInterval: config.saveInterval || 30000
    };
    
    this.session = null;
    this.saveTimer = null;
    this.initialized = false;
  }

  /**
   * Initialize the state tracker with MosAIc project context
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Use MosAIc project configuration if available
      if (this.config.projectId === 'default' && this.projectReader.isMosAIcProject()) {
        const projectConfig = await this.projectReader.getProjectConfig();
        this.config.projectId = projectConfig.projectId;
        this.config.dataDir = projectConfig.planning.dataDir;
        console.log(`📁 Using MosAIc project context: ${projectConfig.projectName}`);
      }

      // Create data directory if it doesn't exist
      const dataDir = this.expandPath(this.config.dataDir);
      await fs.mkdir(dataDir, { recursive: true });

      // Load existing session or create new one
      await this.loadSession();
      
      if (this.config.autoSave) {
        this.startAutoSave();
      }

      this.initialized = true;
    } catch (error) {
      console.warn('StateTracker initialization failed:', error.message);
      // Create minimal session for graceful degradation
      this.session = this.createDefaultSession();
      this.initialized = true;
    }
  }

  /**
   * Create default session structure
   */
  createDefaultSession() {
    return {
      projectId: this.config.projectId,
      sessionId: Date.now().toString(),
      createdAt: new Date(),
      lastUpdated: new Date(),
      modules: {},
      metadata: {}
    };
  }

  /**
   * Load session from storage
   */
  async loadSession() {
    const sessionPath = this.getSessionPath();
    
    try {
      const data = await fs.readFile(sessionPath, 'utf8');
      this.session = JSON.parse(data);
      
      // Convert date strings back to Date objects
      this.session.createdAt = new Date(this.session.createdAt);
      this.session.lastUpdated = new Date(this.session.lastUpdated);
    } catch (error) {
      // Create new session if file doesn't exist
      this.session = this.createDefaultSession();
    }
  }

  /**
   * Save session to storage
   */
  async saveSession() {
    if (!this.session) return;

    try {
      this.session.lastUpdated = new Date();
      const sessionPath = this.getSessionPath();
      await fs.writeFile(sessionPath, JSON.stringify(this.session, null, 2));
    } catch (error) {
      console.warn('Failed to save session:', error.message);
    }
  }

  /**
   * Update module state
   */
  updateModule(moduleName, moduleDefinition, moduleState) {
    if (!this.session) {
      this.session = this.createDefaultSession();
    }

    this.session.modules[moduleName] = {
      definition: moduleDefinition,
      state: {
        ...moduleState,
        startedAt: moduleState.startedAt ? new Date(moduleState.startedAt) : undefined,
        completedAt: moduleState.completedAt ? new Date(moduleState.completedAt) : undefined
      }
    };

    if (this.config.autoSave) {
      this.scheduleAutoSave();
    }
  }

  /**
   * Get module state
   */
  getModuleState(moduleName) {
    return this.session?.modules[moduleName] || null;
  }

  /**
   * Get all modules
   */
  getAllModules() {
    return this.session?.modules || {};
  }

  /**
   * Add session metadata
   */
  addMetadata(key, value) {
    if (!this.session) {
      this.session = this.createDefaultSession();
    }
    
    this.session.metadata[key] = value;
  }

  /**
   * Update session metadata (async version for planning commands)
   */
  async updateMetadata(key, value) {
    this.addMetadata(key, value);
    if (this.config.autoSave) {
      this.scheduleAutoSave();
    }
  }

  /**
   * Get session metadata
   */
  getMetadata(key) {
    return this.session?.metadata[key];
  }

  /**
   * Get current session (for planning commands)
   */
  getCurrentSession() {
    return this.session;
  }

  /**
   * Get session statistics (for planning commands)
   */
  getSessionStats() {
    if (!this.session) {
      return {
        totalModules: 0,
        completedModules: 0,
        sessionDuration: 0,
        createdAt: null,
        lastUpdated: null
      };
    }

    const modules = Object.values(this.session.modules || {});
    const totalModules = modules.length;
    const completedModules = modules.filter(module => 
      module.state?.status === 'completed'
    ).length;

    const createdAt = new Date(this.session.createdAt);
    const lastUpdated = new Date(this.session.lastUpdated);
    const sessionDuration = lastUpdated - createdAt;

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
   * Get session path
   */
  getSessionPath() {
    const dataDir = this.expandPath(this.config.dataDir);
    return path.join(dataDir, `${this.config.projectId}-session.json`);
  }

  /**
   * Expand tilde paths
   */
  expandPath(filePath) {
    if (filePath.startsWith('~')) {
      return path.join(process.env.HOME || process.env.USERPROFILE || '', filePath.slice(1));
    }
    return filePath;
  }

  /**
   * Start auto-save timer
   */
  startAutoSave() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
    }
    
    this.saveTimer = setInterval(() => {
      this.saveSession().catch(err => 
        console.warn('Auto-save failed:', err.message)
      );
    }, this.config.saveInterval);
  }

  /**
   * Schedule auto-save (debounced)
   */
  scheduleAutoSave() {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    
    this.autoSaveTimeout = setTimeout(() => {
      this.saveSession().catch(err => 
        console.warn('Scheduled save failed:', err.message)
      );
    }, 1000); // 1 second delay
  }

  /**
   * Stop auto-save and cleanup
   */
  async cleanup() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
    
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
      this.autoSaveTimeout = null;
    }

    // Final save
    await this.saveSession();
  }
}

module.exports = {
  StateTracker
};