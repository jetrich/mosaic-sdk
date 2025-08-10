/**
 * Base Provider Interface for @mosaicstack/stack multi-mode architecture
 * Provides abstraction for AI model providers (Ollama, Claude, etc.)
 */

export type TaskType = 'code' | 'analysis' | 'documentation' | 'general' | 'debug' | 'testing';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface TaskContext {
  project_id?: string;
  task_type?: TaskType;
  complexity?: number;
  previous_context?: string;
}

export interface ProviderConfig {
  name: string;
  type: 'local' | 'remote';
  enabled: boolean;
  priority: number;
  [key: string]: any; // Provider-specific config
}

export interface ModelInfo {
  name: string;
  size?: number;
  family?: string;
  capabilities: string[];
  performance_score?: number;
}

export interface TaskRequest {
  type: TaskType;
  content: string;
  complexity: number; // 1-5 scale
  project_id?: string;
  context?: string;
  preferences?: RoutingPreferences;
}

export interface RoutingPreferences {
  prefer_local?: boolean;
  prefer_fast?: boolean;
  max_response_time?: number; // seconds
  fallback_enabled?: boolean;
}

export interface TaskResponse {
  content: string;
  model_used: string;
  execution_time: number;
  token_count?: number;
  success: boolean;
  error?: string;
  provider: string;
}

export interface ProviderStatus {
  status: 'online' | 'offline' | 'error';
  message?: string;
  last_checked: Date;
  models_available?: number;
  capabilities?: string[];
}

/**
 * Base Provider interface that all AI providers must implement
 */
export interface Provider {
  readonly name: string;
  readonly type: 'local' | 'remote';
  
  /**
   * Initialize the provider with configuration
   */
  initialize(config: ProviderConfig): Promise<void>;
  
  /**
   * Get current provider status and health
   */
  getStatus(): Promise<ProviderStatus>;
  
  /**
   * List available models from this provider
   */
  listModels(): Promise<ModelInfo[]>;
  
  /**
   * Check if a specific model is available
   */
  isModelAvailable(modelName: string): Promise<boolean>;
  
  /**
   * Execute a chat/completion request
   */
  chat(
    model: string,
    messages: ChatMessage[],
    context?: TaskContext,
    options?: Record<string, any>
  ): Promise<TaskResponse>;
  
  /**
   * Execute a streaming chat request (optional)
   */
  chatStream?(
    model: string,
    messages: ChatMessage[],
    context?: TaskContext,
    options?: Record<string, any>
  ): AsyncGenerator<Partial<TaskResponse>>;
  
  /**
   * Get provider capabilities
   */
  getCapabilities(): string[];
  
  /**
   * Test provider connectivity
   */
  testConnection(): Promise<boolean>;
  
  /**
   * Clean up resources
   */
  dispose(): Promise<void>;
}

/**
 * Provider factory interface for creating provider instances
 */
export interface ProviderFactory {
  create(config: ProviderConfig): Promise<Provider>;
  getType(): string;
  getSupportedModels(): string[];
}

/**
 * Provider registry interface for managing multiple providers
 */
export interface ProviderRegistry {
  register(factory: ProviderFactory): void;
  unregister(type: string): void;
  createProvider(config: ProviderConfig): Promise<Provider>;
  getAvailableTypes(): string[];
}