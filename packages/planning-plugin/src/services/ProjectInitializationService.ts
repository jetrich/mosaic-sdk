/**
 * Project Initialization Service
 * Handles creation of .mosaic directories for both greenfield and brownfield projects
 * Supports the /init-mosaic command functionality
 */

import { promises as fs } from 'fs';
import { join, basename } from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface ProjectMetadata {
  type: 'greenfield' | 'brownfield';
  id: string;
  name: string;
  description?: string;
  created: Date;
  updated: Date;
  local: boolean;
  remote_sync?: boolean;
  mosaic: {
    version: string;
    initialized_by: string;
  };
  owners?: string[];
  tags?: string[];
  status: 'active' | 'on_hold' | 'completed' | 'archived';
}

export interface RemoteProject {
  id: string;
  name: string;
  description?: string;
  mcp_server: string;
  created: Date;
  updated: Date;
  owners?: string[];
  tags?: string[];
  status: string;
}

export interface ProjectLink {
  type: 'brownfield';
  local_id: string;
  remote_project: {
    id: string;
    name: string;
    mcp_server: string;
  };
  sync: {
    enabled: boolean;
    last_sync?: Date;
    strategy: 'bidirectional' | 'pull_only' | 'push_only';
  };
  created: Date;
  updated: Date;
}

export interface ProjectConfig {
  routing?: {
    inherit_global: boolean;
    overrides?: Record<string, string>;
    preferences?: Record<string, string>;
  };
  agents?: {
    preferred: string[];
    assignments?: Record<string, string>;
  };
  planning?: {
    default_complexity: number;
    auto_decompose: boolean;
    state_persistence: boolean;
  };
}

/**
 * Service for initializing MosAIc projects with .mosaic directory structure
 */
export class ProjectInitializationService {
  private readonly MOSAIC_VERSION = '0.1.0';
  private readonly MOSAIC_DIR = '.mosaic';

  /**
   * Initialize a new greenfield project
   */
  async initializeGreenfieldProject(options: {
    projectPath: string;
    name?: string;
    description?: string;
    owners?: string[];
    tags?: string[];
  }): Promise<{ success: boolean; projectId: string; error?: string }> {
    try {
      const { projectPath, name, description, owners = [], tags = [] } = options;

      // Check if .mosaic already exists
      const mosaicPath = join(projectPath, this.MOSAIC_DIR);
      if (await this.directoryExists(mosaicPath)) {
        return {
          success: false,
          projectId: '',
          error: 'Project already initialized (found .mosaic directory)'
        };
      }

      // Generate project metadata
      const projectId = `mosaic-${uuidv4()}`;
      const projectName = name || basename(projectPath);
      
      const metadata: ProjectMetadata = {
        type: 'greenfield',
        id: projectId,
        name: projectName,
        description,
        created: new Date(),
        updated: new Date(),
        local: true,
        remote_sync: false,
        mosaic: {
          version: this.MOSAIC_VERSION,
          initialized_by: '/init-mosaic'
        },
        owners,
        tags,
        status: 'active'
      };

      // Create .mosaic directory structure
      await this.createMosaicStructure(projectPath);

      // Write project metadata
      await this.writeProjectMetadata(projectPath, metadata);

      // Create default configuration
      await this.createDefaultConfiguration(projectPath);

      console.log(`[PROJECT_INIT] Greenfield project initialized: ${projectName} (${projectId})`);
      
      return {
        success: true,
        projectId
      };

    } catch (error) {
      return {
        success: false,
        projectId: '',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Link to an existing brownfield project
   */
  async linkBrownfieldProject(options: {
    projectPath: string;
    remoteProject: RemoteProject;
    syncStrategy?: 'bidirectional' | 'pull_only' | 'push_only';
  }): Promise<{ success: boolean; projectId: string; error?: string }> {
    try {
      const { projectPath, remoteProject, syncStrategy = 'bidirectional' } = options;

      // Check if .mosaic already exists
      const mosaicPath = join(projectPath, this.MOSAIC_DIR);
      if (await this.directoryExists(mosaicPath)) {
        return {
          success: false,
          projectId: '',
          error: 'Project already initialized (found .mosaic directory)'
        };
      }

      // Generate local project ID
      const localProjectId = `mosaic-local-${uuidv4()}`;

      // Create project link metadata
      const linkMetadata: ProjectLink = {
        type: 'brownfield',
        local_id: localProjectId,
        remote_project: {
          id: remoteProject.id,
          name: remoteProject.name,
          mcp_server: remoteProject.mcp_server
        },
        sync: {
          enabled: true,
          strategy: syncStrategy
        },
        created: new Date(),
        updated: new Date()
      };

      // Create .mosaic directory structure
      await this.createMosaicStructure(projectPath);

      // Write project link metadata
      await this.writeProjectLink(projectPath, linkMetadata);

      // Download and cache remote project metadata
      await this.cacheRemoteProjectMetadata(projectPath, remoteProject);

      // Create default configuration
      await this.createDefaultConfiguration(projectPath);

      console.log(`[PROJECT_INIT] Brownfield project linked: ${remoteProject.name} (${remoteProject.id})`);
      
      return {
        success: true,
        projectId: localProjectId
      };

    } catch (error) {
      return {
        success: false,
        projectId: '',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Create the standard .mosaic directory structure
   */
  private async createMosaicStructure(projectPath: string): Promise<void> {
    const mosaicPath = join(projectPath, this.MOSAIC_DIR);
    
    // Create main directories
    const directories = [
      mosaicPath,
      join(mosaicPath, 'config'),
      join(mosaicPath, 'data'),
      join(mosaicPath, 'data', 'planning'),
      join(mosaicPath, 'data', 'tasks'),
      join(mosaicPath, 'data', 'sessions'),
      join(mosaicPath, 'data', 'sync'),
      join(mosaicPath, 'cache')
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }

    // Create .mosaicignore file
    const mosaicIgnore = [
      '# MosAIc ignore patterns',
      '# Temporary files',
      '.mosaic/cache/*',
      '.mosaic/data/sync/*',
      '',
      '# OS generated files',
      '.DS_Store',
      'Thumbs.db',
      '',
      '# IDE files', 
      '.vscode/',
      '.idea/',
      '*.swp',
      '*.swo',
      '',
      '# Logs',
      '*.log',
      'logs/',
      '',
      '# Dependencies',
      'node_modules/',
      '.env',
      '.env.local'
    ].join('\n');

    await fs.writeFile(join(mosaicPath, '.mosaicignore'), mosaicIgnore, 'utf-8');
  }

  /**
   * Write project metadata to project.json
   */
  private async writeProjectMetadata(projectPath: string, metadata: ProjectMetadata): Promise<void> {
    const mosaicPath = join(projectPath, this.MOSAIC_DIR);
    const metadataPath = join(mosaicPath, 'project.json');
    
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  }

  /**
   * Write project link metadata to link.json
   */
  private async writeProjectLink(projectPath: string, linkMetadata: ProjectLink): Promise<void> {
    const mosaicPath = join(projectPath, this.MOSAIC_DIR);
    const linkPath = join(mosaicPath, 'link.json');
    
    await fs.writeFile(linkPath, JSON.stringify(linkMetadata, null, 2), 'utf-8');
  }

  /**
   * Cache remote project metadata locally
   */
  private async cacheRemoteProjectMetadata(projectPath: string, remoteProject: RemoteProject): Promise<void> {
    const mosaicPath = join(projectPath, this.MOSAIC_DIR);
    const cachePath = join(mosaicPath, 'cache', 'remote-project.json');
    
    await fs.writeFile(cachePath, JSON.stringify(remoteProject, null, 2), 'utf-8');
  }

  /**
   * Create default project configuration
   */
  private async createDefaultConfiguration(projectPath: string): Promise<void> {
    const mosaicPath = join(projectPath, this.MOSAIC_DIR);
    const configPath = join(mosaicPath, 'config');

    // Default routing configuration
    const routingConfig: ProjectConfig['routing'] = {
      inherit_global: true,
      overrides: {},
      preferences: {}
    };

    // Default agent configuration  
    const agentsConfig: ProjectConfig['agents'] = {
      preferred: [],
      assignments: {}
    };

    // Default planning configuration
    const planningConfig: ProjectConfig['planning'] = {
      default_complexity: 3,
      auto_decompose: true,
      state_persistence: true
    };

    // Write configuration files
    await Promise.all([
      fs.writeFile(
        join(configPath, 'routing.json'),
        JSON.stringify({ routing: routingConfig }, null, 2),
        'utf-8'
      ),
      fs.writeFile(
        join(configPath, 'agents.json'),
        JSON.stringify({ agents: agentsConfig }, null, 2),
        'utf-8'
      ),
      fs.writeFile(
        join(configPath, 'planning.json'),
        JSON.stringify({ planning: planningConfig }, null, 2),
        'utf-8'
      )
    ]);
  }

  /**
   * Check if a directory exists
   */
  private async directoryExists(path: string): Promise<boolean> {
    try {
      const stats = await fs.stat(path);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Get project information from existing .mosaic directory
   */
  async getProjectInfo(projectPath: string): Promise<{
    type: 'greenfield' | 'brownfield' | 'none';
    metadata?: ProjectMetadata | ProjectLink;
    remoteProject?: RemoteProject;
  }> {
    const mosaicPath = join(projectPath, this.MOSAIC_DIR);
    
    if (!(await this.directoryExists(mosaicPath))) {
      return { type: 'none' };
    }

    // Check for greenfield project
    const projectJsonPath = join(mosaicPath, 'project.json');
    try {
      const projectData = await fs.readFile(projectJsonPath, 'utf-8');
      const metadata = JSON.parse(projectData) as ProjectMetadata;
      return { type: 'greenfield', metadata };
    } catch {
      // Not a greenfield project, check for brownfield
    }

    // Check for brownfield project
    const linkJsonPath = join(mosaicPath, 'link.json');
    try {
      const linkData = await fs.readFile(linkJsonPath, 'utf-8');
      const linkMetadata = JSON.parse(linkData) as ProjectLink;
      
      // Try to load cached remote project data
      const remoteCachePath = join(mosaicPath, 'cache', 'remote-project.json');
      let remoteProject: RemoteProject | undefined;
      try {
        const remoteData = await fs.readFile(remoteCachePath, 'utf-8');
        remoteProject = JSON.parse(remoteData) as RemoteProject;
      } catch {
        // Remote project cache not available
      }
      
      return { 
        type: 'brownfield', 
        metadata: linkMetadata,
        remoteProject 
      };
    } catch {
      // Not a valid brownfield project either
    }

    return { type: 'none' };
  }

  /**
   * Validate .mosaic directory structure
   */
  async validateMosaicStructure(projectPath: string): Promise<{
    valid: boolean;
    missing: string[];
    issues: string[];
  }> {
    const mosaicPath = join(projectPath, this.MOSAIC_DIR);
    const missing: string[] = [];
    const issues: string[] = [];

    // Required directories
    const requiredDirs = [
      'config',
      'data',
      'data/planning',
      'data/tasks',
      'data/sessions',
      'cache'
    ];

    for (const dir of requiredDirs) {
      const dirPath = join(mosaicPath, dir);
      if (!(await this.directoryExists(dirPath))) {
        missing.push(dir);
      }
    }

    // Required files (at least one should exist)
    const projectJsonExists = await this.fileExists(join(mosaicPath, 'project.json'));
    const linkJsonExists = await this.fileExists(join(mosaicPath, 'link.json'));
    
    if (!projectJsonExists && !linkJsonExists) {
      issues.push('Neither project.json nor link.json found - invalid project type');
    }

    return {
      valid: missing.length === 0 && issues.length === 0,
      missing,
      issues
    };
  }

  /**
   * Check if a file exists
   */
  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.stat(path);
      return true;
    } catch {
      return false;
    }
  }
}

export default ProjectInitializationService;