/**
 * MosAIc Stack Configuration Types
 * Type-safe configuration interfaces for all modes
 */

export type OperationMode = 'local' | 'hybrid' | 'cloud';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type RoutingStrategy = 'intelligent' | 'round-robin' | 'priority';
export type TaskType = 'code' | 'analysis' | 'documentation' | 'general';
export type Priority = 'low' | 'normal' | 'high';

/**
 * Root configuration interface
 */
export interface MosaicConfig {
  $schema?: string;
  version: string;
  mode: OperationMode;
  mcp: MCPConfig;
  providers: ProvidersConfig;
  routing: RoutingConfig;
  tony: TonyConfig;
  monitoring: MonitoringConfig;
}

/**
 * MCP Server Configuration
 */
export interface MCPConfig {
  port: number;
  autoStart: boolean;
  features: MCPFeatures;
  database?: string;
  cors?: {
    enabled: boolean;
    origins: string[];
  };
}

export interface MCPFeatures {
  tony: boolean;
  orchestration: boolean;
  streaming: boolean;
  metrics: boolean;
  health: boolean;
}

/**
 * Providers Configuration
 */
export interface ProvidersConfig {
  ollama?: OllamaConfig;
  claude?: ClaudeConfig;
  openrouter?: OpenRouterConfig;
}

export interface BaseProviderConfig {
  enabled: boolean;
  priority?: number;
  timeout?: number;
  retries?: number;
  maxConcurrency?: number;
}

export interface OllamaConfig extends BaseProviderConfig {
  location: 'local' | 'remote';
  url: string;
  models: string[] | ['auto-detect'];
  healthCheckInterval?: number;
}

export interface ClaudeConfig extends BaseProviderConfig {
  access: 'subscription' | 'api' | 'both';
  apiKey?: string;
  fallbackToApi?: boolean;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface OpenRouterConfig extends BaseProviderConfig {
  apiKey: string;
  models: string[] | ['auto'];
  baseUrl?: string;
}

/**
 * Routing Configuration
 */
export interface RoutingConfig {
  strategy: RoutingStrategy;
  preferLocal: boolean;
  costOptimization: boolean;
  performanceTracking: boolean;
  fallbackChain: string[];
  rules: RoutingRule[];
  cache?: CacheConfig;
}

export interface RoutingRule {
  taskType?: TaskType;
  complexity?: number;
  contextLength?: number;
  preferredProvider: string;
  preferredModel?: string;
  conditions?: Record<string, any>;
}

export interface CacheConfig {
  enabled: boolean;
  maxEntries: number;
  ttl: number; // milliseconds
  strategy: 'lru' | 'lfu' | 'ttl';
}

/**
 * Tony Framework Configuration
 */
export interface TonyConfig {
  enabled: boolean;
  personas: boolean;
  upp: boolean; // UltraThink Planning Protocol
  multiAgent: boolean;
  maxConcurrentAgents: number;
  workspaceDir?: string;
  personaConfig?: PersonaConfig;
}

export interface PersonaConfig {
  directory: string;
  autoLoad: boolean;
  customPersonas?: Record<string, any>;
}

/**
 * Monitoring Configuration
 */
export interface MonitoringConfig {
  metrics: boolean;
  logging: LogLevel;
  telemetry: boolean;
  exporters?: ExporterConfig[];
  retention?: RetentionConfig;
}

export interface ExporterConfig {
  type: 'prometheus' | 'jaeger' | 'console' | 'file';
  endpoint?: string;
  config?: Record<string, any>;
}

export interface RetentionConfig {
  metrics: string; // e.g., "7d", "30d"
  logs: string;
  traces: string;
}

/**
 * Environment variable resolution
 */
export interface EnvResolver {
  resolve(value: string): string;
  resolveObject<T>(obj: T): T;
}

/**
 * Configuration validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  path: string;
  message: string;
  value?: any;
}

export interface ValidationWarning {
  path: string;
  message: string;
  suggestion?: string;
}

/**
 * Configuration loader options
 */
export interface LoaderOptions {
  configPath?: string;
  envFile?: string;
  mode?: OperationMode;
  validateSchema?: boolean;
  resolveEnv?: boolean;
  applyDefaults?: boolean;
}

/**
 * Mode-specific defaults
 */
export interface ModeDefaults {
  local: Partial<MosaicConfig>;
  hybrid: Partial<MosaicConfig>;
  cloud: Partial<MosaicConfig>;
}