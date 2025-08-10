/**
 * /init-mosaic MCP Tool
 * Interactive project initialization tool for both greenfield and brownfield projects
 * Handles the complete project setup workflow with user prompts
 */

import { MCPServiceTool } from '@mosaicstack/mcp-common';
import { z } from 'zod';
import {
  ServiceConfig,
  AuthConfig,
  ServiceOperation,
  AsyncResult
} from '@mosaicstack/mcp-common';
import { ProjectInitializationService, RemoteProject } from '../services/ProjectInitializationService';
import { ProjectDetectionService } from '../services/ProjectDetectionService';
import { basename } from 'path';

// Input schema for the init-mosaic tool
const InitMosaicSchema = z.object({
  path: z.string().optional().describe('Project path (defaults to current directory)'),
  project_type: z.enum(['greenfield', 'brownfield']).optional().describe('Project type for non-interactive mode'),
  project_name: z.string().optional().describe('Project name for greenfield projects'),
  project_description: z.string().optional().describe('Project description'),
  remote_project_id: z.string().optional().describe('Remote project ID for brownfield projects'),
  interactive: z.boolean().default(true).describe('Enable interactive mode (default: true)')
});

type InitMosaicInput = z.infer<typeof InitMosaicSchema>;

interface ProjectChoice {
  type: 'greenfield' | 'brownfield';
  name?: string;
  description?: string;
  remoteProject?: RemoteProject;
}

/**
 * MCP Tool for /init-mosaic command
 */
export class InitMosaicTool extends MCPServiceTool {
  private projectInitService: ProjectInitializationService;
  private detectionService: ProjectDetectionService;

  get name(): string {
    return 'init_mosaic';
  }

  constructor(config: ServiceConfig, authConfig: AuthConfig) {
    super('init_mosaic', config, authConfig);
    this.projectInitService = new ProjectInitializationService();
    this.detectionService = new ProjectDetectionService();
  }

  get capabilities(): string[] {
    return [
      'project_initialization',
      'directory_structure_creation',
      'interactive_user_prompts',
      'project_type_detection',
      'remote_project_linking'
    ];
  }

  get description(): string {
    return 'Initialize MosAIc project with .mosaic directory structure. Supports both greenfield (new) and brownfield (link to existing) projects.';
  }

  get inputSchema(): z.ZodObject<any, any, any, any, any> {
    return InitMosaicSchema as any;
  }

  protected async executeOperation(
    operation: ServiceOperation,
    args: InitMosaicInput
  ): AsyncResult<any> {
    try {
      const projectPath = args.path || process.cwd();
      const interactive = args.interactive ?? true;

      // Check if project already exists
      const existingProject = await this.detectionService.detectProject(projectPath);
      if (existingProject) {
        return this.createErrorResult(
          'PROJECT_ALREADY_EXISTS',
          `Project already initialized at: ${existingProject.path}`,
          {
            existing_project: this.detectionService.getProjectDisplayInfo(existingProject),
            path: existingProject.path
          }
        );
      }

      let choice: ProjectChoice;

      if (interactive) {
        // Interactive mode - present choices to user
        choice = await this.interactiveProjectSetup(projectPath, args);
      } else {
        // Non-interactive mode - use provided parameters
        choice = await this.nonInteractiveProjectSetup(args);
      }

      // Execute the chosen project initialization
      const result = await this.executeProjectInitialization(projectPath, choice);

      if (result.success) {
        const projectInfo = await this.detectionService.detectProject(projectPath);
        const displayInfo = projectInfo ? this.detectionService.getProjectDisplayInfo(projectInfo) : null;

        return this.createSuccessResult(
          {
            message: 'Project initialized successfully!',
            project_id: result.projectId,
            project_path: projectPath,
            project_type: choice.type,
            project_info: displayInfo
          },
          {
            operation: 'init_mosaic',
            duration: 0, // Will be filled by parent class
            project_path: projectPath,
            project_type: choice.type
          }
        );
      } else {
        return this.createErrorResult(
          'PROJECT_INITIALIZATION_FAILED',
          result.error || 'Unknown initialization error',
          { project_path: projectPath }
        );
      }

    } catch (error) {
      this.logger.error('Init mosaic operation failed', {
        error: error instanceof Error ? error.message : String(error),
        args: this.sanitizeArgs(args)
      });

      return this.createErrorResult(
        'INIT_MOSAIC_ERROR',
        error instanceof Error ? error.message : String(error),
        { args }
      );
    }
  }

  /**
   * Interactive project setup with user prompts
   */
  private async interactiveProjectSetup(projectPath: string, args: InitMosaicInput): Promise<ProjectChoice> {
    const projectName = basename(projectPath);
    
    // Present the initial choice
    const choicePrompt = this.createChoicePrompt(projectPath, projectName);
    
    // For now, we'll use provided project_type or default to greenfield
    // In a full implementation, this would involve actual user interaction
    const projectType = args.project_type || 'greenfield';

    if (projectType === 'greenfield') {
      return {
        type: 'greenfield',
        name: args.project_name || projectName,
        description: args.project_description
      };
    } else {
      // For brownfield, we'd normally query available projects
      // For now, create a mock remote project
      const mockRemoteProject: RemoteProject = {
        id: args.remote_project_id || 'mock-remote-project-id',
        name: args.project_name || `${projectName} Remote`,
        description: args.project_description || 'Linked remote project',
        mcp_server: 'localhost:3456',
        created: new Date(),
        updated: new Date(),
        owners: [],
        tags: [],
        status: 'active'
      };

      return {
        type: 'brownfield',
        remoteProject: mockRemoteProject
      };
    }
  }

  /**
   * Non-interactive project setup using provided parameters
   */
  private async nonInteractiveProjectSetup(args: InitMosaicInput): Promise<ProjectChoice> {
    if (!args.project_type) {
      throw new Error('project_type is required in non-interactive mode');
    }

    if (args.project_type === 'greenfield') {
      return {
        type: 'greenfield',
        name: args.project_name,
        description: args.project_description
      };
    } else {
      if (!args.remote_project_id) {
        throw new Error('remote_project_id is required for brownfield projects');
      }

      // In a full implementation, this would fetch the actual remote project
      const mockRemoteProject: RemoteProject = {
        id: args.remote_project_id,
        name: args.project_name || 'Remote Project',
        description: args.project_description || 'Linked remote project',
        mcp_server: 'localhost:3456',
        created: new Date(),
        updated: new Date(),
        owners: [],
        tags: [],
        status: 'active'
      };

      return {
        type: 'brownfield',
        remoteProject: mockRemoteProject
      };
    }
  }

  /**
   * Execute the actual project initialization
   */
  private async executeProjectInitialization(
    projectPath: string, 
    choice: ProjectChoice
  ): Promise<{ success: boolean; projectId: string; error?: string }> {
    if (choice.type === 'greenfield') {
      return await this.projectInitService.initializeGreenfieldProject({
        projectPath,
        name: choice.name,
        description: choice.description,
        owners: [], // TODO: Get from auth context
        tags: []
      });
    } else {
      if (!choice.remoteProject) {
        return {
          success: false,
          projectId: '',
          error: 'Remote project information missing for brownfield initialization'
        };
      }

      return await this.projectInitService.linkBrownfieldProject({
        projectPath,
        remoteProject: choice.remoteProject,
        syncStrategy: 'bidirectional'
      });
    }
  }

  /**
   * Create the choice prompt message for interactive mode
   */
  private createChoicePrompt(projectPath: string, projectName: string): string {
    return `
🚀 MosAIc Project Initialization

Current directory: ${projectPath}
Detected project name: ${projectName}

Choose project type:
1) 📁 Greenfield - Create a new MosAIc project
2) 🔗 Brownfield - Link to an existing MosAIc project

For greenfield projects, a new .mosaic directory will be created with:
- Project metadata and configuration
- Planning session storage
- Task decomposition tracking
- Local project state

For brownfield projects, you'll be connected to an existing project with:
- Synchronized project metadata
- Access to existing planning sessions
- Shared task decomposition data
- Bidirectional sync capabilities

Choose your option [1 for greenfield, 2 for brownfield]:
`;
  }

  /**
   * Simulate getting available remote projects
   * In a full implementation, this would query the MCP server
   */
  private async getAvailableRemoteProjects(): Promise<RemoteProject[]> {
    // Mock data for now - in real implementation, query MCP server
    return [
      {
        id: 'sage-phr-remote-uuid',
        name: 'Sage PHR Business Planning',
        description: 'HIPAA-compliant personal health record platform',
        mcp_server: 'localhost:3456',
        created: new Date('2025-08-10T10:00:00Z'),
        updated: new Date('2025-08-10T12:00:00Z'),
        owners: ['jason@woltje.com'],
        tags: ['healthcare', 'hipaa', 'phr'],
        status: 'active'
      },
      {
        id: 'mosaic-sdk-uuid',
        name: 'MosAIc SDK Development',
        description: 'Enterprise AI development platform',
        mcp_server: 'localhost:3456',
        created: new Date('2025-08-01T00:00:00Z'),
        updated: new Date('2025-08-10T11:30:00Z'),
        owners: ['jason@woltje.com'],
        tags: ['sdk', 'ai', 'enterprise'],
        status: 'active'
      }
    ];
  }

  /**
   * Format remote projects for display
   */
  private formatRemoteProjectList(projects: RemoteProject[]): string {
    const projectList = projects
      .map((project, index) => {
        const dateStr = project.updated.toISOString().split('T')[0];
        return `${index + 1}) ${project.name} (ID: ${project.id.substring(0, 8)}...)
   Description: ${project.description || 'No description'}
   Last updated: ${dateStr}
   Status: ${project.status}`;
      })
      .join('\n\n');

    return `
Available remote projects:

${projectList}

Select project to link [1-${projects.length}]:
`;
  }
}

export default InitMosaicTool;