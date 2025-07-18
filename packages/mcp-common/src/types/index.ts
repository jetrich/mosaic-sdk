/**
 * @fileoverview Core type definitions for MosAIc MCP service integrations
 * @module @mosaic/mcp-common/types
 */

import { z } from 'zod';

// Base service configuration schema
export const ServiceConfigSchema = z.object({
  name: z.string(),
  baseUrl: z.string().url(),
  apiUrl: z.string().url(),
  timeout: z.number().default(30000),
  retryAttempts: z.number().default(3),
  retryDelay: z.number().default(1000),
});

export type ServiceConfig = z.infer<typeof ServiceConfigSchema>;

// Authentication configuration
export const AuthConfigSchema = z.object({
  type: z.enum(['token', 'oauth', 'ssh-key', 'basic']),
  credentials: z.record(z.string(), z.any()),
  refreshable: z.boolean().default(false),
  expiresAt: z.date().optional(),
});

export type AuthConfig = z.infer<typeof AuthConfigSchema>;

// MCP tool result types
export const MCPResultSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type MCPResult<T = any> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: Record<string, any>;
};

// Service operation types
export enum ServiceOperation {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  SEARCH = 'search',
  SYNC = 'sync',
  TRIGGER = 'trigger',
}

// Repository-related types
export const RepositorySchema = z.object({
  id: z.string(),
  name: z.string(),
  fullName: z.string(),
  description: z.string().optional(),
  private: z.boolean().default(false),
  defaultBranch: z.string().default('main'),
  cloneUrl: z.string().url(),
  sshUrl: z.string(),
  webUrl: z.string().url(),
  organization: z.string().optional(),
  topics: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Repository = z.infer<typeof RepositorySchema>;

// Organization types
export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  location: z.string().optional(),
  email: z.string().email().optional(),
  visibility: z.enum(['public', 'private']).default('private'),
  memberCount: z.number().default(0),
  repoCount: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Organization = z.infer<typeof OrganizationSchema>;

// CI/CD Pipeline types
export const PipelineSchema = z.object({
  id: z.string(),
  name: z.string(),
  repository: z.string(),
  branch: z.string(),
  status: z.enum(['pending', 'running', 'success', 'failure', 'cancelled']),
  trigger: z.enum(['push', 'pull_request', 'manual', 'schedule']),
  steps: z.array(z.object({
    name: z.string(),
    status: z.enum(['pending', 'running', 'success', 'failure', 'skipped']),
    duration: z.number().optional(),
    logs: z.string().optional(),
  })),
  startedAt: z.date().optional(),
  finishedAt: z.date().optional(),
  duration: z.number().optional(),
});

export type Pipeline = z.infer<typeof PipelineSchema>;

// Documentation types
export const DocumentationPageSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  bookId: z.string(),
  chapterId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  template: z.boolean().default(false),
  draft: z.boolean().default(false),
  priority: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DocumentationPage = z.infer<typeof DocumentationPageSchema>;

// Project Management types
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  identifier: z.string(),
  workspace: z.string(),
  network: z.enum(['public', 'private']).default('private'),
  icon: z.string().optional(),
  emoji: z.string().optional(),
  moduleConfig: z.record(z.string(), z.boolean()).default({}),
  estimateConfig: z.object({
    enabled: z.boolean().default(false),
    type: z.enum(['points', 'hours', 'days']).default('points'),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const IssueSchema = z.object({
  id: z.string(),
  sequenceId: z.number(),
  name: z.string(),
  description: z.string().optional(),
  projectId: z.string(),
  stateId: z.string(),
  priority: z.enum(['urgent', 'high', 'medium', 'low', 'none']).default('none'),
  assigneeId: z.string().optional(),
  createdBy: z.string(),
  labels: z.array(z.string()).default([]),
  estimate: z.number().optional(),
  parentId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().optional(),
});

export type Issue = z.infer<typeof IssueSchema>;

// Webhook types
export const WebhookEventSchema = z.object({
  id: z.string(),
  event: z.string(),
  service: z.string(),
  payload: z.any(),
  timestamp: z.date(),
  processed: z.boolean().default(false),
  retryCount: z.number().default(0),
});

export type WebhookEvent = z.infer<typeof WebhookEventSchema>;

// Error types
export class MCPServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public service: string,
    public operation: ServiceOperation,
    public details?: any
  ) {
    super(message);
    this.name = 'MCPServiceError';
  }
}

export class AuthenticationError extends MCPServiceError {
  constructor(service: string, details?: any) {
    super('AUTH_FAILED', 'Authentication failed', service, ServiceOperation.READ, details);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends MCPServiceError {
  constructor(service: string, retryAfter?: number) {
    super('RATE_LIMIT', 'Rate limit exceeded', service, ServiceOperation.READ, { retryAfter });
    this.name = 'RateLimitError';
  }
}

export class ServiceUnavailableError extends MCPServiceError {
  constructor(service: string, details?: any) {
    super('SERVICE_UNAVAILABLE', 'Service is unavailable', service, ServiceOperation.READ, details);
    this.name = 'ServiceUnavailableError';
  }
}

// Utility types
export type Paginated<T> = {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export type AsyncResult<T> = Promise<MCPResult<T>>;

export type ServiceEventHandler<T = any> = (event: WebhookEvent & { payload: T }) => Promise<void>;

// Configuration for specific services
export interface GitServiceConfig extends ServiceConfig {
  organization: string;
  defaultBranch: string;
  sshKeyPath?: string;
  webhookSecret?: string;
}

export interface CIServiceConfig extends ServiceConfig {
  defaultPipeline: string;
  artifactRetention: number;
  concurrentBuilds: number;
}

export interface DocsServiceConfig extends ServiceConfig {
  defaultShelf: string;
  autoSync: boolean;
  templateId?: string;
}

export interface ProjectServiceConfig extends ServiceConfig {
  defaultWorkspace: string;
  defaultTemplate: string;
  estimateEnabled: boolean;
}

// Export all schemas for runtime validation
export const schemas = {
  ServiceConfigSchema,
  AuthConfigSchema,
  MCPResultSchema,
  RepositorySchema,
  OrganizationSchema,
  PipelineSchema,
  DocumentationPageSchema,
  ProjectSchema,
  IssueSchema,
  WebhookEventSchema,
} as const;

export default schemas;