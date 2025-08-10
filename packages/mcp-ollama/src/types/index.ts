/**
 * @fileoverview Type definitions for Ollama MCP integration
 * @module @mosaicstack/mcp-ollama/types
 */

import { z } from 'zod';

/**
 * Ollama API response types
 */
export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
  done_reason?: string;
}

export interface OllamaStreamResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaEmbeddingResponse {
  model: string;
  embeddings: number[][];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
}

/**
 * Configuration types
 */
export interface OllamaEndpointConfig {
  primary: string;
  fallback?: string;
}

export interface OllamaModelConfig {
  default: string;
  code?: string;
  specialized?: Record<string, string>;
}

export interface OllamaExecutionConfig {
  enabled: boolean;
  timeout: number;
  maxMemory: string;
  allowedLanguages: string[];
}

export interface OllamaCacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: string;
}

export interface OllamaOptions {
  temperature?: number;
  num_ctx?: number;
  num_predict?: number;
  top_k?: number;
  top_p?: number;
  repeat_penalty?: number;
  seed?: number;
  stop?: string[];
  stream?: boolean;
}

export interface OllamaConfig {
  endpoints: OllamaEndpointConfig;
  models: OllamaModelConfig;
  execution?: OllamaExecutionConfig;
  cache?: OllamaCacheConfig;
  options?: OllamaOptions;
}

/**
 * Tool input schemas
 */
export const OllamaGenerateInputSchema = z.object({
  prompt: z.string().describe('The prompt to generate a response for'),
  model: z.string().optional().describe('The model to use (optional, uses default if not specified)'),
  system: z.string().optional().describe('System prompt to set context'),
  format: z.union([
    z.literal('json'),
    z.record(z.any())
  ]).optional().describe('Response format (json or JSON schema)'),
  options: z.object({
    temperature: z.number().min(0).max(2).optional(),
    num_ctx: z.number().optional(),
    num_predict: z.number().optional(),
    top_k: z.number().optional(),
    top_p: z.number().min(0).max(1).optional(),
    repeat_penalty: z.number().optional(),
    seed: z.number().optional(),
    stop: z.array(z.string()).optional()
  }).optional().describe('Model generation options'),
  stream: z.boolean().optional().describe('Whether to stream the response')
});

export const OllamaCodeInputSchema = z.object({
  prompt: z.string().describe('Description of the code to generate'),
  language: z.enum(['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust']).describe('Programming language'),
  model: z.string().optional().describe('Specific model to use for code generation'),
  context: z.string().optional().describe('Additional context or existing code'),
  execute: z.boolean().optional().describe('Whether to execute the generated code'),
  test: z.boolean().optional().describe('Whether to generate tests for the code')
});

export const OllamaModelInputSchema = z.object({
  action: z.enum(['list', 'switch', 'pull', 'delete', 'info']).describe('Action to perform'),
  model: z.string().optional().describe('Model name for switch/pull/delete/info actions'),
  force: z.boolean().optional().describe('Force action even if model is in use')
});

export const OllamaExecuteInputSchema = z.object({
  code: z.string().describe('Code to execute'),
  language: z.enum(['python', 'javascript', 'typescript']).describe('Programming language'),
  timeout: z.number().optional().describe('Execution timeout in milliseconds'),
  stdin: z.string().optional().describe('Standard input for the program')
});

export const OllamaOptimizeInputSchema = z.object({
  code: z.string().describe('Code to optimize'),
  language: z.enum(['python', 'javascript', 'typescript', 'java', 'cpp', 'go', 'rust']).describe('Programming language'),
  goal: z.enum(['performance', 'readability', 'memory', 'security']).optional().describe('Optimization goal'),
  model: z.string().optional().describe('Model to use for optimization')
});

/**
 * Service operation types
 */
export enum OllamaOperation {
  GENERATE = 'generate',
  CODE = 'code',
  MODEL = 'model',
  EXECUTE = 'execute',
  OPTIMIZE = 'optimize',
  EMBED = 'embed'
}

/**
 * Execution result types
 */
export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  metadata?: {
    executionId?: string;
    language?: string;
    sandboxed?: boolean;
    streamed?: boolean;
    signal?: string;
    error?: boolean;
    resourceLimits?: {
      timeout: number;
      memory: number;
    };
  };
}

/**
 * Code generation types
 */
export interface CodeGenerationRequest {
  task: 'generate' | 'review' | 'refactor' | 'debug' | 'explain' | 'optimize' | 'test' | 'document';
  language?: string;
  prompt: string;
  code?: string;
  context?: {
    framework?: string;
    style?: string;
    requirements?: string[];
    examples?: string;
  };
  options?: {
    model?: string;
    temperature?: number;
    maxLength?: number;
    includeComments?: boolean;
    includeTests?: boolean;
    optimizeForSpeed?: boolean;
  };
}

export interface CodeGenerationResult {
  success: boolean;
  task: string;
  language?: string;
  code: string;
  explanation: string;
  codeBlocks: Array<{language: string; code: string}>;
  metadata: {
    model?: string;
    tokens?: number;
    duration?: number;
    promptTokens?: number;
  };
}

/**
 * Code execution types
 */
export interface CodeExecutionOptions {
  timeout?: number;
  maxMemory?: number;
  sandbox?: SandboxConfig;
}

export interface SandboxConfig {
  restrictNetwork?: boolean;
  allowedPorts?: number[];
  allowedDomains?: string[];
  allowedEnvVars?: Record<string, string>;
  maxFileSize?: number;
  readOnlyFilesystem?: boolean;
}

/**
 * Model management types
 */
export interface ModelManagementResult {
  success: boolean;
  operation: string;
  data?: any;
  error?: string;
  timestamp: string;
}

/**
 * Ollama API parameter types
 */
export interface OllamaGenerateParams {
  model: string;
  prompt: string;
  system?: string;
  template?: string;
  context?: number[];
  stream?: boolean;
  raw?: boolean;
  format?: string | Record<string, any>;
  options?: {
    temperature?: number;
    num_ctx?: number;
    num_predict?: number;
    top_k?: number;
    top_p?: number;
    repeat_penalty?: number;
    seed?: number;
    stop?: string[];
    tfs_z?: number;
    typical_p?: number;
    repeat_last_n?: number;
    penalize_newline?: boolean;
    numa?: boolean;
    num_thread?: number;
    num_gpu?: number;
    main_gpu?: number;
    low_vram?: boolean;
    vocab_only?: boolean;
    use_mmap?: boolean;
    use_mlock?: boolean;
    num_batch?: number;
  };
  keep_alive?: number | string;
}

/**
 * Cache entry types
 */
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

/**
 * Model manager types
 */
export interface ModelInfo {
  name: string;
  size: number;
  parameterSize: string;
  quantization: string;
  loaded: boolean;
  lastUsed?: Date;
  performance?: {
    avgResponseTime: number;
    totalRequests: number;
    errorRate: number;
  };
}

export interface ModelSwitchResult {
  success: boolean;
  previousModel: string;
  currentModel: string;
  loadTime?: number;
  error?: string;
}

/**
 * Error types
 */
export class OllamaError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'OllamaError';
  }
}

export class ModelNotFoundError extends OllamaError {
  constructor(model: string) {
    super(`Model ${model} not found`, 'MODEL_NOT_FOUND', { model });
  }
}

export class ExecutionError extends OllamaError {
  constructor(message: string, details?: any) {
    super(message, 'EXECUTION_ERROR', details);
  }
}

export class ConnectionError extends OllamaError {
  constructor(endpoint: string, details?: any) {
    super(`Failed to connect to Ollama at ${endpoint}`, 'CONNECTION_ERROR', { endpoint, ...details });
  }
}