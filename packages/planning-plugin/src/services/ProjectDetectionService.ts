/**
 * Project Detection Service
 * Auto-detects MosAIc projects by traversing directory tree looking for .mosaic directories
 * Similar to how Git detects repositories by finding .git directories
 */

import { promises as fs } from 'fs';
import { join, dirname, resolve } from 'path';
import { ProjectInitializationService, ProjectMetadata, ProjectLink, RemoteProject } from './ProjectInitializationService';

export interface DetectedProject {
  path: string;
  type: 'greenfield' | 'brownfield';
  metadata: ProjectMetadata | ProjectLink;
  remoteProject?: RemoteProject;
  mosaicPath: string;
  depth: number; // How many levels up from current directory
}

/**
 * Service for detecting existing MosAIc projects in directory hierarchy
 */
export class ProjectDetectionService {
  private projectInitService: ProjectInitializationService;
  private readonly MOSAIC_DIR = '.mosaic';
  private readonly MAX_TRAVERSAL_DEPTH = 10; // Prevent infinite traversal

  constructor() {
    this.projectInitService = new ProjectInitializationService();
  }

  /**
   * Detect MosAIc project starting from current working directory
   * Traverses up the directory tree looking for .mosaic directories
   */
  async detectProject(startPath?: string): Promise<DetectedProject | null> {
    const searchPath = startPath || process.cwd();
    return await this.traverseForProject(searchPath, 0);
  }

  /**
   * Detect all MosAIc projects in a directory subtree
   * Useful for listing available projects in a workspace
   */
  async detectProjectsInTree(rootPath: string, maxDepth = 3): Promise<DetectedProject[]> {
    const projects: DetectedProject[] = [];
    await this.searchDirectoryTree(rootPath, 0, maxDepth, projects);
    return projects;
  }

  /**
   * Check if current directory is inside a MosAIc project
   */
  async isInsideProject(path?: string): Promise<boolean> {
    const detected = await this.detectProject(path);
    return detected !== null;
  }

  /**
   * Get project context for current directory
   * Returns project information if inside a project, null otherwise
   */
  async getProjectContext(path?: string): Promise<{
    inProject: boolean;
    project?: DetectedProject;
    relativePath?: string; // Path relative to project root
  }> {
    const searchPath = path || process.cwd();
    const detected = await this.detectProject(searchPath);
    
    if (!detected) {
      return { inProject: false };
    }

    // Calculate relative path from project root to current directory
    const relativePath = this.getRelativePath(detected.path, searchPath);

    return {
      inProject: true,
      project: detected,
      relativePath
    };
  }

  /**
   * Find the nearest .mosaic directory by traversing up the directory tree
   */
  private async traverseForProject(currentPath: string, depth: number): Promise<DetectedProject | null> {
    // Prevent infinite traversal
    if (depth >= this.MAX_TRAVERSAL_DEPTH) {
      return null;
    }

    const absolutePath = resolve(currentPath);
    const mosaicPath = join(absolutePath, this.MOSAIC_DIR);

    // Check if .mosaic directory exists in current path
    if (await this.directoryExists(mosaicPath)) {
      const projectInfo = await this.projectInitService.getProjectInfo(absolutePath);
      
      if (projectInfo.type !== 'none') {
        return {
          path: absolutePath,
          type: projectInfo.type as 'greenfield' | 'brownfield',
          metadata: projectInfo.metadata!,
          remoteProject: projectInfo.remoteProject,
          mosaicPath,
          depth
        };
      }
    }

    // Try parent directory
    const parentPath = dirname(absolutePath);
    
    // Stop if we've reached the root or can't go further up
    if (parentPath === absolutePath) {
      return null;
    }

    return await this.traverseForProject(parentPath, depth + 1);
  }

  /**
   * Recursively search directory tree for .mosaic directories
   */
  private async searchDirectoryTree(
    currentPath: string, 
    currentDepth: number, 
    maxDepth: number, 
    projects: DetectedProject[]
  ): Promise<void> {
    if (currentDepth > maxDepth) {
      return;
    }

    const absolutePath = resolve(currentPath);
    const mosaicPath = join(absolutePath, this.MOSAIC_DIR);

    // Check if current directory has .mosaic
    if (await this.directoryExists(mosaicPath)) {
      const projectInfo = await this.projectInitService.getProjectInfo(absolutePath);
      
      if (projectInfo.type !== 'none') {
        projects.push({
          path: absolutePath,
          type: projectInfo.type as 'greenfield' | 'brownfield',
          metadata: projectInfo.metadata!,
          remoteProject: projectInfo.remoteProject,
          mosaicPath,
          depth: currentDepth
        });
        
        // Don't traverse deeper into subdirectories of a project
        return;
      }
    }

    // Traverse subdirectories
    try {
      const entries = await fs.readdir(absolutePath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
          const subdirPath = join(absolutePath, entry.name);
          await this.searchDirectoryTree(subdirPath, currentDepth + 1, maxDepth, projects);
        }
      }
    } catch (error) {
      // Skip directories we can't read (permission issues, etc.)
      console.warn(`[PROJECT_DETECTION] Cannot read directory: ${absolutePath}`, error);
    }
  }

  /**
   * Determine if a directory should be skipped during traversal
   */
  private shouldSkipDirectory(dirName: string): boolean {
    const skipPatterns = [
      'node_modules',
      '.git',
      '.svn',
      '.hg',
      'dist',
      'build',
      'target',
      '.next',
      '.nuxt',
      'coverage',
      '.nyc_output',
      '.cache',
      'tmp',
      'temp'
    ];

    return skipPatterns.includes(dirName) || dirName.startsWith('.');
  }

  /**
   * Get relative path from project root to target path
   */
  private getRelativePath(projectRoot: string, targetPath: string): string {
    const relative = resolve(targetPath).replace(resolve(projectRoot), '');
    return relative.startsWith('/') ? relative.slice(1) : relative || '.';
  }

  /**
   * Check if directory exists
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
   * Validate that detected project is properly structured
   */
  async validateDetectedProject(detected: DetectedProject): Promise<{
    valid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const validation = await this.projectInitService.validateMosaicStructure(detected.path);
    const issues: string[] = [...validation.issues];
    const recommendations: string[] = [];

    // Add missing directories to issues
    if (validation.missing.length > 0) {
      issues.push(`Missing directories: ${validation.missing.join(', ')}`);
      recommendations.push('Run `/init-mosaic` to repair project structure');
    }

    // Check for brownfield sync status
    if (detected.type === 'brownfield') {
      const linkMetadata = detected.metadata as ProjectLink;
      if (!detected.remoteProject) {
        issues.push('Brownfield project missing cached remote data');
        recommendations.push('Sync with remote project to update local cache');
      }
      
      if (!linkMetadata.sync?.last_sync) {
        recommendations.push('Consider syncing with remote project');
      }
    }

    return {
      valid: validation.valid && issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Get project display information for UI/CLI
   */
  getProjectDisplayInfo(detected: DetectedProject): {
    name: string;
    description: string;
    status: string;
    type: string;
    location: string;
  } {
    if (detected.type === 'greenfield') {
      const metadata = detected.metadata as ProjectMetadata;
      return {
        name: metadata.name,
        description: metadata.description || 'No description',
        status: metadata.status,
        type: 'Local Project',
        location: detected.path
      };
    } else {
      const linkMetadata = detected.metadata as ProjectLink;
      const remoteName = detected.remoteProject?.name || linkMetadata.remote_project.name;
      const remoteDesc = detected.remoteProject?.description || 'Linked to remote project';
      
      return {
        name: remoteName,
        description: remoteDesc,
        status: detected.remoteProject?.status || 'linked',
        type: 'Linked Project',
        location: `${detected.path} → ${linkMetadata.remote_project.mcp_server}`
      };
    }
  }

  /**
   * Check if current working directory is a project root
   */
  async isProjectRoot(path?: string): Promise<boolean> {
    const checkPath = path || process.cwd();
    const mosaicPath = join(checkPath, this.MOSAIC_DIR);
    return await this.directoryExists(mosaicPath);
  }

  /**
   * Get project root path for current directory
   */
  async getProjectRoot(path?: string): Promise<string | null> {
    const detected = await this.detectProject(path);
    return detected?.path || null;
  }
}

export default ProjectDetectionService;