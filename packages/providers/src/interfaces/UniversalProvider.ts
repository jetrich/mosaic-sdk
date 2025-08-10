/**
 * Universal Provider Interface for MosAIc Stack
 * Supports 75+ LLM providers with standardized abstraction
 * Compatible with OpenCode's models.dev approach
 */

// Core Types
export type ProviderType = "local" | "remote" | "hybrid" | "edge";
export type ModelFamily =
  | "chat"
  | "completion"
  | "embedding"
  | "vision"
  | "audio"
  | "multimodal";
export type TaskType =
  | "code"
  | "analysis"
  | "documentation"
  | "general"
  | "debug"
  | "testing"
  | "creative";

// Provider Capabilities
export interface ProviderCapabilities {
  // Core Features
  chat: boolean;
  completion: boolean;
  streaming: boolean;

  // Advanced Features
  embeddings: boolean;
  vision: boolean;
  audio: boolean;
  multimodal: boolean;
  functionCalling: boolean;
  codeExecution: boolean;
  jsonMode: boolean;

  // Moderation & Safety
  moderation: boolean;
  safetyFilters: boolean;

  // Performance Features
  batching: boolean;
  caching: boolean;

  // Developer Features
  debugging: boolean;
  promptOptimization: boolean;
}

// Model Information
export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  family: ModelFamily;
  version?: string;

  // Technical Specs
  contextLength: number;
  maxTokens: number;
  inputCostPer1k?: number;
  outputCostPer1k?: number;

  // Capabilities
  capabilities: string[];
  supportedLanguages: string[];

  // Performance
  averageLatency?: number;
  throughputTokensPerSecond?: number;

  // Availability
  isAvailable: boolean;
  region?: string;
  deployment?: "production" | "staging" | "experimental";
}

// Request & Response Types
export interface ChatMessage {
  role: "system" | "user" | "assistant" | "function" | "tool";
  content: string | MessageContent[];
  name?: string;
  function_call?: FunctionCall;
  tool_calls?: ToolCall[];
}

export interface MessageContent {
  type: "text" | "image" | "audio" | "file";
  data: string;
  metadata?: Record<string, any>;
}

export interface FunctionCall {
  name: string;
  arguments: string;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: FunctionCall;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];

  // Generation Parameters
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;

  // Advanced Options
  functions?: FunctionDefinition[];
  tools?: ToolDefinition[];
  responseFormat?: "text" | "json" | "structured";

  // Streaming & Performance
  stream?: boolean;
  timeout?: number;

  // Context & Metadata
  context?: TaskContext;
  metadata?: Record<string, any>;
}

export interface ChatResponse {
  id: string;
  model: string;
  provider: string;

  // Response Content
  content: string;
  finishReason:
    | "stop"
    | "length"
    | "function_call"
    | "tool_calls"
    | "content_filter";

  // Function/Tool Calls
  function_call?: FunctionCall;
  tool_calls?: ToolCall[];

  // Usage & Performance
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  executionTime: number;
  timestamp: Date;

  // Metadata
  metadata?: Record<string, any>;
  warnings?: string[];

  // Quality Metrics
  confidence?: number;
  safetyScore?: number;
}

export interface ChatChunk {
  id: string;
  delta: {
    role?: string;
    content?: string;
    function_call?: Partial<FunctionCall>;
    tool_calls?: Partial<ToolCall>[];
  };
  finishReason?: string;
}

// Configuration Types
export interface ProviderConfig {
  name: string;
  type: ProviderType;
  enabled: boolean;
  priority: number;

  // Authentication
  apiKey?: string;
  endpoint?: string;
  authentication?: Record<string, any>;

  // Limits & Quotas
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };

  // Retry & Timeout
  retryConfig?: {
    maxRetries: number;
    backoffMs: number;
    timeoutMs: number;
  };

  // Provider-specific config
  options?: Record<string, any>;

  // Index signature for dynamic config access
  [key: string]: any;
}
export interface TaskContext {
  projectId?: string;
  taskType?: TaskType;
  complexity?: number;
  previousContext?: string;

  // User Context
  userId?: string;
  sessionId?: string;

  // Performance Hints
  preferLocal?: boolean;
  preferFast?: boolean;
  maxResponseTime?: number;

  // Quality Requirements
  requireHighQuality?: boolean;
  allowExperimental?: boolean;
}

// Function & Tool Definitions
export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolDefinition {
  type: "function";
  function: FunctionDefinition;
}

// Provider Status
export interface ProviderStatus {
  status: "online" | "offline" | "degraded" | "maintenance";
  health: "healthy" | "warning" | "critical";

  // Availability
  lastChecked: Date;
  uptime: number;

  // Performance
  averageLatency: number;
  successRate: number;

  // Capacity
  modelsAvailable: number;
  requestsInQueue: number;

  // Issues
  issues?: string[];
  maintenanceWindow?: {
    start: Date;
    end: Date;
    description: string;
  };
}

// Universal Provider Interface
export interface UniversalProvider {
  readonly id: string;
  readonly name: string;
  readonly type: ProviderType;
  readonly capabilities: ProviderCapabilities;

  // Lifecycle Management
  initialize(config: ProviderConfig): Promise<void>;
  dispose(): Promise<void>;

  // Health & Status
  getStatus(): Promise<ProviderStatus>;
  testConnection(): Promise<boolean>;

  // Model Management
  listModels(): Promise<ModelInfo[]>;
  getModel(id: string): Promise<ModelInfo | null>;
  isModelAvailable(id: string): Promise<boolean>;

  // Core Functionality
  chat(request: ChatRequest): Promise<ChatResponse>;
  chatStream(request: ChatRequest): AsyncGenerator<ChatChunk>;

  // Optional Advanced Features
  embed?(text: string | string[], model?: string): Promise<number[][]>;
  moderate?(content: string): Promise<ModerationResult>;
  transcribe?(
    audio: Buffer,
    options?: TranscriptionOptions,
  ): Promise<TranscriptionResult>;

  // Performance & Optimization
  warmup?(models: string[]): Promise<void>;
  getEstimatedCost?(request: ChatRequest): Promise<number>;
  getEstimatedLatency?(request: ChatRequest): Promise<number>;
}

// Advanced Feature Types
export interface ModerationResult {
  flagged: boolean;
  categories: {
    hate: boolean;
    harassment: boolean;
    selfHarm: boolean;
    sexual: boolean;
    violence: boolean;
    [key: string]: boolean;
  };
  categoryScores: {
    hate: number;
    harassment: number;
    selfHarm: number;
    sexual: number;
    violence: number;
    [key: string]: number;
  };
}

export interface TranscriptionOptions {
  language?: string;
  format?: "text" | "srt" | "vtt";
  temperature?: number;
}

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  confidence?: number;
  segments?: TranscriptionSegment[];
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
}

// Provider Registry Interface
export interface UniversalProviderRegistry {
  // Registration
  register(provider: UniversalProvider): void;
  unregister(providerId: string): void;

  // Discovery
  getProvider(id: string): UniversalProvider | null;
  listProviders(type?: ProviderType): UniversalProvider[];
  findByCapability(capability: keyof ProviderCapabilities): UniversalProvider[];
  findByModel(modelId: string): Promise<UniversalProvider[]>;

  // Health Monitoring
  getHealthStatus(): Promise<ProviderHealthSummary>;
  monitorProviders(): AsyncGenerator<ProviderHealthUpdate>;

  // Intelligent Routing
  selectOptimalProvider(request: ChatRequest): Promise<UniversalProvider>;
  getLoadBalancer(): ProviderLoadBalancer;
}

// Health Monitoring Types
export interface ProviderHealthSummary {
  totalProviders: number;
  onlineProviders: number;
  healthyProviders: number;
  degradedProviders: number;
  offlineProviders: number;

  averageLatency: number;
  averageSuccessRate: number;

  issues: ProviderIssue[];
}

export interface ProviderHealthUpdate {
  providerId: string;
  previousStatus: ProviderStatus;
  currentStatus: ProviderStatus;
  timestamp: Date;
}

export interface ProviderIssue {
  providerId: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: Date;
  resolved?: boolean;
}

// Load Balancing
export interface ProviderLoadBalancer {
  setStrategy(strategy: LoadBalancingStrategy): void;
  selectProvider(
    request: ChatRequest,
    providers: UniversalProvider[],
  ): Promise<UniversalProvider>;
  recordMetrics(providerId: string, metrics: RequestMetrics): void;
}

export type LoadBalancingStrategy =
  | "round-robin"
  | "least-connections"
  | "response-time"
  | "cost-optimized"
  | "quality-optimized";

export interface RequestMetrics {
  latency: number;
  success: boolean;
  cost?: number;
  qualityScore?: number;
  timestamp: Date;
}

// Provider Factory Interface
export interface ProviderFactory<
  T extends UniversalProvider = UniversalProvider,
> {
  readonly type: string;
  readonly supportedModels: string[];
  readonly requiredConfig: string[];

  create(config: ProviderConfig): Promise<T>;
  validate(config: ProviderConfig): boolean;
  getDefaultConfig(): Partial<ProviderConfig>;
}

// Batch Processing Support
export interface BatchRequest {
  id: string;
  requests: ChatRequest[];
  options?: {
    maxConcurrency?: number;
    timeoutMs?: number;
    failFast?: boolean;
  };
}

export interface BatchResponse {
  id: string;
  responses: (ChatResponse | Error)[];
  completedAt: Date;
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageLatency: number;
    totalCost?: number;
  };
}

// Caching Support
export interface CacheProvider {
  get(key: string): Promise<ChatResponse | null>;
  set(key: string, response: ChatResponse, ttlSeconds?: number): Promise<void>;
  invalidate(pattern: string): Promise<void>;
  clear(): Promise<void>;
}

export interface CacheConfig {
  enabled: boolean;
  provider: CacheProvider;
  ttlSeconds: number;
  keyGenerator: (request: ChatRequest) => string;
  excludePatterns?: string[];
}

// Provider-Specific Implementations
export interface OpenAIProvider extends UniversalProvider {
  readonly type: "remote";

  // OpenAI-specific methods
  createFineTune?(options: OpenAIFineTuneOptions): Promise<string>;
  getFineTune?(id: string): Promise<OpenAIFineTuneStatus>;
}

export interface AnthropicProvider extends UniversalProvider {
  readonly type: "remote";

  // Anthropic-specific methods
  getConstitutionalAI?(): Promise<ConstitutionalAIConfig>;
  setHarmlessness?(level: number): Promise<void>;
}

export interface OllamaProvider extends UniversalProvider {
  readonly type: "local";

  // Ollama-specific methods
  pullModel?(model: string): Promise<void>;
  deleteModel?(model: string): Promise<void>;
  getModelFile?(model: string): Promise<string>;
}

// Supporting Types for Provider-Specific Features
export interface OpenAIFineTuneOptions {
  model: string;
  trainingFile: string;
  validationFile?: string;
  hyperparameters?: Record<string, any>;
}

export interface OpenAIFineTuneStatus {
  id: string;
  status: "pending" | "running" | "succeeded" | "failed" | "cancelled";
  model?: string;
  fineTunedModel?: string;
}

export interface ConstitutionalAIConfig {
  principles: string[];
  harmlessness: number;
  helpfulness: number;
  honesty: number;
}

// Export all interfaces for external use
export * from "./Provider";
export * from "./TaskRouter";
