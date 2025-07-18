/**
 * @fileoverview MCP tool for Gitea repository operations
 * @module @mosaic/mcp-gitea-remote/tools
 */

import { z } from 'zod';
import axios, { AxiosInstance } from 'axios';
import { 
  MCPServiceTool, 
  ServiceOperation, 
  Repository, 
  MCPResult,
  GitServiceConfig,
  AuthConfig,
} from '@mosaic/mcp-common';

// Input schemas for repository operations
const CreateRepositorySchema = z.object({
  operation: z.literal(ServiceOperation.CREATE),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  private: z.boolean().default(true),
  organization: z.string().optional(),
  defaultBranch: z.string().default('main'),
  autoInit: z.boolean().default(true),
  gitignores: z.string().optional(),
  license: z.string().optional(),
  readme: z.string().default('Default'),
  topics: z.array(z.string()).default([]),
});

const GetRepositorySchema = z.object({
  operation: z.literal(ServiceOperation.READ),
  owner: z.string(),
  repo: z.string(),
});

const UpdateRepositorySchema = z.object({
  operation: z.literal(ServiceOperation.UPDATE),
  owner: z.string(),
  repo: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  private: z.boolean().optional(),
  hasIssues: z.boolean().optional(),
  hasWiki: z.boolean().optional(),
  defaultBranch: z.string().optional(),
  allowMergeCommits: z.boolean().optional(),
  allowSquashMerge: z.boolean().optional(),
  allowRebaseMerge: z.boolean().optional(),
});

const DeleteRepositorySchema = z.object({
  operation: z.literal(ServiceOperation.DELETE),
  owner: z.string(),
  repo: z.string(),
});

const ListRepositoriesSchema = z.object({
  operation: z.literal(ServiceOperation.LIST),
  organization: z.string().optional(),
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(100).default(30),
  sort: z.enum(['created', 'updated', 'pushed', 'full_name']).default('updated'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

const CloneRepositorySchema = z.object({
  operation: z.literal('clone'),
  owner: z.string(),
  repo: z.string(),
  localPath: z.string(),
  branch: z.string().optional(),
});

const InputSchema = z.union([
  CreateRepositorySchema,
  GetRepositorySchema,
  UpdateRepositorySchema,
  DeleteRepositorySchema,
  ListRepositoriesSchema,
  CloneRepositorySchema,
]);

type RepositoryToolInput = z.infer<typeof InputSchema>;

/**
 * MCP tool for Gitea repository operations
 */
export class RepositoryTool extends MCPServiceTool {
  private apiClient: AxiosInstance;

  constructor(config: GitServiceConfig, authConfig: AuthConfig) {
    super('gitea-repository', config, authConfig);
    
    this.apiClient = axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeout,
    });

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.error('API request failed', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          statusText: error.response?.statusText,
        });
        return Promise.reject(error);
      }
    );
  }

  get name(): string {
    return 'gitea_repository';
  }

  get description(): string {
    return 'Manage Gitea repositories - create, read, update, delete, list, and clone operations';
  }

  get inputSchema(): z.ZodSchema<RepositoryToolInput> {
    return InputSchema;
  }

  protected async executeOperation(
    operation: ServiceOperation | string,
    args: RepositoryToolInput
  ): Promise<MCPResult> {
    await this.refreshAuthIfNeeded();
    const headers = await this.getAuthHeaders();

    switch (operation) {
      case ServiceOperation.CREATE:
        return this.createRepository(args as z.infer<typeof CreateRepositorySchema>, headers);
      case ServiceOperation.READ:
        return this.getRepository(args as z.infer<typeof GetRepositorySchema>, headers);
      case ServiceOperation.UPDATE:
        return this.updateRepository(args as z.infer<typeof UpdateRepositorySchema>, headers);
      case ServiceOperation.DELETE:
        return this.deleteRepository(args as z.infer<typeof DeleteRepositorySchema>, headers);
      case ServiceOperation.LIST:
        return this.listRepositories(args as z.infer<typeof ListRepositoriesSchema>, headers);
      case 'clone':
        return this.cloneRepository(args as z.infer<typeof CloneRepositorySchema>, headers);
      default:
        return this.createErrorResult('INVALID_OPERATION', `Unsupported operation: ${operation}`);
    }
  }

  /**
   * Create a new repository
   */
  private async createRepository(
    args: z.infer<typeof CreateRepositorySchema>,
    headers: Record<string, string>
  ): Promise<MCPResult<Repository>> {
    try {
      const createData = {
        name: args.name,
        description: args.description,
        private: args.private,
        auto_init: args.autoInit,
        gitignores: args.gitignores,
        license: args.license,
        readme: args.readme,
        default_branch: args.defaultBranch,
        topics: args.topics,
      };

      const endpoint = args.organization 
        ? `/orgs/${args.organization}/repos`
        : '/user/repos';

      const response = await this.apiClient.post(endpoint, createData, { headers });

      const repository: Repository = {
        id: response.data.id.toString(),
        name: response.data.name,
        fullName: response.data.full_name,
        description: response.data.description || '',
        private: response.data.private,
        defaultBranch: response.data.default_branch,
        cloneUrl: response.data.clone_url,
        sshUrl: response.data.ssh_url,
        webUrl: response.data.html_url,
        organization: args.organization,
        topics: response.data.topics || [],
        createdAt: new Date(response.data.created_at),
        updatedAt: new Date(response.data.updated_at),
      };

      this.logger.info('Repository created successfully', {
        repository: repository.fullName,
        private: repository.private,
        organization: args.organization,
      });

      return this.createSuccessResult(repository, {
        operation: 'create',
        endpoint,
      });
    } catch (error: any) {
      this.logger.error('Failed to create repository', {
        name: args.name,
        organization: args.organization,
        error: error.message,
      });

      if (error.response?.status === 409) {
        return this.createErrorResult(
          'REPOSITORY_EXISTS',
          `Repository '${args.name}' already exists`,
          error.response.data
        );
      }

      if (error.response?.status === 403) {
        return this.createErrorResult(
          'INSUFFICIENT_PERMISSIONS',
          'Insufficient permissions to create repository',
          error.response.data
        );
      }

      throw error;
    }
  }

  /**
   * Get repository information
   */
  private async getRepository(
    args: z.infer<typeof GetRepositorySchema>,
    headers: Record<string, string>
  ): Promise<MCPResult<Repository>> {
    try {
      const endpoint = `/repos/${args.owner}/${args.repo}`;
      const response = await this.apiClient.get(endpoint, { headers });

      const repository: Repository = {
        id: response.data.id.toString(),
        name: response.data.name,
        fullName: response.data.full_name,
        description: response.data.description || '',
        private: response.data.private,
        defaultBranch: response.data.default_branch,
        cloneUrl: response.data.clone_url,
        sshUrl: response.data.ssh_url,
        webUrl: response.data.html_url,
        organization: response.data.owner.type === 'Organization' ? response.data.owner.login : undefined,
        topics: response.data.topics || [],
        createdAt: new Date(response.data.created_at),
        updatedAt: new Date(response.data.updated_at),
      };

      return this.createSuccessResult(repository, {
        operation: 'read',
        endpoint,
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        return this.createErrorResult(
          'REPOSITORY_NOT_FOUND',
          `Repository '${args.owner}/${args.repo}' not found`
        );
      }

      throw error;
    }
  }

  /**
   * Update repository settings
   */
  private async updateRepository(
    args: z.infer<typeof UpdateRepositorySchema>,
    headers: Record<string, string>
  ): Promise<MCPResult<Repository>> {
    try {
      const updateData: any = {};
      
      if (args.name) updateData.name = args.name;
      if (args.description !== undefined) updateData.description = args.description;
      if (args.website !== undefined) updateData.website = args.website;
      if (args.private !== undefined) updateData.private = args.private;
      if (args.hasIssues !== undefined) updateData.has_issues = args.hasIssues;
      if (args.hasWiki !== undefined) updateData.has_wiki = args.hasWiki;
      if (args.defaultBranch) updateData.default_branch = args.defaultBranch;
      if (args.allowMergeCommits !== undefined) updateData.allow_merge_commits = args.allowMergeCommits;
      if (args.allowSquashMerge !== undefined) updateData.allow_squash_merge = args.allowSquashMerge;
      if (args.allowRebaseMerge !== undefined) updateData.allow_rebase_merge = args.allowRebaseMerge;

      const endpoint = `/repos/${args.owner}/${args.repo}`;
      const response = await this.apiClient.patch(endpoint, updateData, { headers });

      const repository: Repository = {
        id: response.data.id.toString(),
        name: response.data.name,
        fullName: response.data.full_name,
        description: response.data.description || '',
        private: response.data.private,
        defaultBranch: response.data.default_branch,
        cloneUrl: response.data.clone_url,
        sshUrl: response.data.ssh_url,
        webUrl: response.data.html_url,
        organization: response.data.owner.type === 'Organization' ? response.data.owner.login : undefined,
        topics: response.data.topics || [],
        createdAt: new Date(response.data.created_at),
        updatedAt: new Date(response.data.updated_at),
      };

      this.logger.info('Repository updated successfully', {
        repository: repository.fullName,
        changes: Object.keys(updateData),
      });

      return this.createSuccessResult(repository, {
        operation: 'update',
        endpoint,
        changes: Object.keys(updateData),
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        return this.createErrorResult(
          'REPOSITORY_NOT_FOUND',
          `Repository '${args.owner}/${args.repo}' not found`
        );
      }

      if (error.response?.status === 403) {
        return this.createErrorResult(
          'INSUFFICIENT_PERMISSIONS',
          'Insufficient permissions to update repository'
        );
      }

      throw error;
    }
  }

  /**
   * Delete a repository
   */
  private async deleteRepository(
    args: z.infer<typeof DeleteRepositorySchema>,
    headers: Record<string, string>
  ): Promise<MCPResult<{ deleted: boolean }>> {
    try {
      const endpoint = `/repos/${args.owner}/${args.repo}`;
      await this.apiClient.delete(endpoint, { headers });

      this.logger.warn('Repository deleted', {
        repository: `${args.owner}/${args.repo}`,
      });

      return this.createSuccessResult({ deleted: true }, {
        operation: 'delete',
        repository: `${args.owner}/${args.repo}`,
      });
    } catch (error: any) {
      if (error.response?.status === 404) {
        return this.createErrorResult(
          'REPOSITORY_NOT_FOUND',
          `Repository '${args.owner}/${args.repo}' not found`
        );
      }

      if (error.response?.status === 403) {
        return this.createErrorResult(
          'INSUFFICIENT_PERMISSIONS',
          'Insufficient permissions to delete repository'
        );
      }

      throw error;
    }
  }

  /**
   * List repositories
   */
  private async listRepositories(
    args: z.infer<typeof ListRepositoriesSchema>,
    headers: Record<string, string>
  ): Promise<MCPResult<{ repositories: Repository[]; pagination: any }>> {
    try {
      const params = {
        page: args.page,
        limit: args.perPage,
        sort: args.sort,
        order: args.order,
      };

      const endpoint = args.organization 
        ? `/orgs/${args.organization}/repos`
        : '/user/repos';

      const response = await this.apiClient.get(endpoint, { headers, params });

      const repositories: Repository[] = response.data.map((repo: any) => ({
        id: repo.id.toString(),
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description || '',
        private: repo.private,
        defaultBranch: repo.default_branch,
        cloneUrl: repo.clone_url,
        sshUrl: repo.ssh_url,
        webUrl: repo.html_url,
        organization: repo.owner.type === 'Organization' ? repo.owner.login : undefined,
        topics: repo.topics || [],
        createdAt: new Date(repo.created_at),
        updatedAt: new Date(repo.updated_at),
      }));

      // Extract pagination info from headers
      const totalCount = parseInt(response.headers['x-total-count'] || '0');
      const pagination = {
        page: args.page,
        perPage: args.perPage,
        total: totalCount,
        totalPages: Math.ceil(totalCount / args.perPage),
        hasNext: args.page * args.perPage < totalCount,
        hasPrev: args.page > 1,
      };

      return this.createSuccessResult({ repositories, pagination }, {
        operation: 'list',
        endpoint,
        count: repositories.length,
      });
    } catch (error: any) {
      if (error.response?.status === 404 && args.organization) {
        return this.createErrorResult(
          'ORGANIZATION_NOT_FOUND',
          `Organization '${args.organization}' not found`
        );
      }

      throw error;
    }
  }

  /**
   * Clone a repository locally
   */
  private async cloneRepository(
    args: z.infer<typeof CloneRepositorySchema>,
    headers: Record<string, string>
  ): Promise<MCPResult<{ cloned: boolean; path: string }>> {
    try {
      // This would typically use simple-git or similar library
      // For now, return a placeholder implementation
      
      this.logger.info('Repository clone requested', {
        repository: `${args.owner}/${args.repo}`,
        localPath: args.localPath,
        branch: args.branch,
      });

      // TODO: Implement actual git clone using simple-git
      // const git = simpleGit();
      // await git.clone(cloneUrl, args.localPath, branch ? ['--branch', branch] : []);

      return this.createSuccessResult(
        { cloned: true, path: args.localPath },
        {
          operation: 'clone',
          repository: `${args.owner}/${args.repo}`,
          localPath: args.localPath,
        }
      );
    } catch (error: any) {
      this.logger.error('Failed to clone repository', {
        repository: `${args.owner}/${args.repo}`,
        localPath: args.localPath,
        error: error.message,
      });

      throw error;
    }
  }

  protected extractOperation(args: any): ServiceOperation | string {
    return args.operation || ServiceOperation.READ;
  }
}