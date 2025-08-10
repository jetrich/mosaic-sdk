/**
 * MosAIc Project Configuration Reader
 * Reads project context from .mosaic directory structure
 */

const fs = require('fs').promises;
const path = require('path');

class MosAIcProjectReader {
  constructor() {
    this.projectRoot = this.findProjectRoot();
    this.mosaicDir = this.projectRoot ? path.join(this.projectRoot, '.mosaic') : null;
  }

  /**
   * Find the project root by looking for .mosaic directory
   */
  findProjectRoot(startDir = process.cwd()) {
    let currentDir = startDir;
    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
      const mosaicPath = path.join(currentDir, '.mosaic');
      try {
        if (require('fs').existsSync(mosaicPath)) {
          return currentDir;
        }
      } catch (error) {
        // Continue searching
      }
      currentDir = path.dirname(currentDir);
    }

    return null;
  }

  /**
   * Get the project configuration from MosAIc context
   */
  async getProjectConfig() {
    if (!this.mosaicDir) {
      return this.getDefaultConfig();
    }

    try {
      // Read stack configuration
      const stackConfig = await this.readStackConfig();
      const activeEpic = await this.readActiveEpic();
      
      return {
        projectId: 'mosaic-sdk',
        projectName: stackConfig?.stack?.name || 'MosAIc SDK',
        description: stackConfig?.stack?.description || 'Enterprise AI Development Platform',
        version: stackConfig?.stack?.version || '0.1.0',
        activeEpic: activeEpic?.epicId || 'E.300',
        epicTitle: activeEpic?.title || 'SDK Stabilization and Release Preparation',
        projectRoot: this.projectRoot,
        mosaicDir: this.mosaicDir,
        // Planning-specific configuration
        planning: {
          dataDir: path.join(this.mosaicDir, 'data', 'planning'),
          outputDir: path.join(this.projectRoot, 'docs', 'planning'),
          sessionPrefix: 'mosaic-sdk',
          useProjectContext: true
        },
        // Business context from stack config
        context: {
          type: 'enterprise-platform',
          domain: 'ai-development',
          stack: stackConfig?.components || {},
          deployment: stackConfig?.deployment || {}
        }
      };
    } catch (error) {
      console.warn('Failed to read MosAIc project config:', error.message);
      return this.getDefaultConfig();
    }
  }

  /**
   * Read stack configuration
   */
  async readStackConfig() {
    if (!this.mosaicDir) return null;
    
    const stackConfigPath = path.join(this.mosaicDir, 'stack.config.json');
    try {
      const data = await fs.readFile(stackConfigPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Read active epic information
   */
  async readActiveEpic() {
    if (!this.mosaicDir) return null;
    
    const epicPath = path.join(this.mosaicDir, 'ACTIVE-EPIC.md');
    try {
      const data = await fs.readFile(epicPath, 'utf8');
      // Parse epic ID and title from markdown
      const epicMatch = data.match(/# Active Epic: ([A-Z]\.\d+) - (.+)/);
      if (epicMatch) {
        return {
          epicId: epicMatch[1],
          title: epicMatch[2]
        };
      }
    } catch (error) {
      // Fall back to default
    }
    
    return null;
  }

  /**
   * Default configuration when .mosaic directory not found
   */
  getDefaultConfig() {
    return {
      projectId: 'default',
      projectName: 'Default Project',
      description: 'Default project configuration',
      version: '1.0.0',
      activeEpic: 'E.001',
      epicTitle: 'Default Epic',
      projectRoot: process.cwd(),
      mosaicDir: null,
      planning: {
        dataDir: path.join(process.cwd(), '.mosaic', 'data', 'planning'),
        outputDir: path.join(process.cwd(), 'docs', 'planning'),
        sessionPrefix: 'default',
        useProjectContext: false
      },
      context: {
        type: 'generic',
        domain: 'software',
        stack: {},
        deployment: {}
      }
    };
  }

  /**
   * Get project-specific business context for planning
   */
  async getBusinessContext() {
    const config = await this.getProjectConfig();
    
    return {
      projectName: config.projectName,
      projectDescription: config.description,
      currentEpic: config.activeEpic,
      epicTitle: config.epicTitle,
      // Context for AI planning agents
      businessContext: {
        industry: 'Enterprise Software',
        marketSegment: 'AI Development Platform',
        targetCustomers: 'Enterprise Development Teams',
        competitiveAdvantage: 'Integrated AI-driven development workflow',
        keyTechnologies: Object.keys(config.context.stack || {}),
        deploymentStrategy: config.context.deployment?.environments || {}
      },
      // Constraints from project context
      constraints: {
        timeline: 'Aggressive but achievable',
        budget: 'Enterprise-scale investment',
        team: 'Distributed specialized agents',
        technology: 'Modern TypeScript/Node.js stack',
        compliance: 'Enterprise security standards'
      }
    };
  }

  /**
   * Check if we're in a MosAIc project
   */
  isMosAIcProject() {
    return this.mosaicDir !== null;
  }
}

module.exports = { MosAIcProjectReader };