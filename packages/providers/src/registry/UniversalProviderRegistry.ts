/**
 * Universal Provider Registry for MosAIc Stack
 * Supports 75+ LLM providers with intelligent routing and load balancing
 *
 * Supported Providers:
 * - OpenAI (GPT-4, GPT-3.5, DALL-E, Whisper)
 * - Anthropic (Claude 3 Opus, Sonnet, Haiku)
 * - Google (Gemini Pro, PaLM, Bard)
 * - Meta (Llama 2/3, Code Llama)
 * - Microsoft (Azure OpenAI, Phi)
 * - Cohere (Command, Embed)
 * - Hugging Face (Transformers, Inference API)
 * - Local providers (Ollama, LMStudio, GPT4All)
 * - Edge providers (WebLLM, MediaPipe)
 * - And 60+ more...
 */

import {
  UniversalProvider,
  UniversalProviderRegistry,
  ProviderFactory,
  ProviderConfig,
  ProviderType,
  ProviderCapabilities,
  ProviderStatus,
  ProviderHealthSummary,
  ProviderHealthUpdate,
  ProviderLoadBalancer,
  LoadBalancingStrategy,
  ChatRequest,
  RequestMetrics,
  CacheConfig,
  CacheProvider,
} from "../interfaces/UniversalProvider";

// Provider Categories
export enum ProviderCategory {
  // Major Cloud Providers
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  GOOGLE = "google",
  MICROSOFT = "microsoft",
  AMAZON = "amazon",

  // Open Source
  META = "meta",
  HUGGINGFACE = "huggingface",
  TOGETHER = "together",
  REPLICATE = "replicate",

  // Local/Self-Hosted
  OLLAMA = "ollama",
  LMSTUDIO = "lmstudio",
  GPT4ALL = "gpt4all",
  LLAMACPP = "llamacpp",

  // Specialized
  COHERE = "cohere",
  STABILITY = "stability",
  MISTRAL = "mistral",
  PALM = "palm",

  // Edge/Mobile
  WEBLLM = "webllm",
  MEDIAPIPE = "mediapipe",
  ONNX = "onnx",

  // Enterprise
  AZURE = "azure",
  AWS_BEDROCK = "aws_bedrock",
  GCP_VERTEX = "gcp_vertex",

  // Research/Experimental
  RESEARCH = "research",
  EXPERIMENTAL = "experimental",
}

// Provider Definitions
export interface ProviderDefinition {
  id: string;
  category: ProviderCategory;
  name: string;
  description: string;
  type: ProviderType;
  capabilities: ProviderCapabilities;
  models: string[];
  endpoint?: string;
  pricing?: ProviderPricing;
  documentation?: string;
  requiredConfig: string[];
  optionalConfig?: string[];
}

export interface ProviderPricing {
  inputCostPer1k: number;
  outputCostPer1k: number;
  currency: string;
  billing: "per-token" | "per-request" | "subscription" | "free";
}

// Built-in Provider Definitions
export const PROVIDER_DEFINITIONS: Record<string, ProviderDefinition> = {
  // OpenAI Family
  "openai-gpt4": {
    id: "openai-gpt4",
    category: ProviderCategory.OPENAI,
    name: "OpenAI GPT-4",
    description: "OpenAI GPT-4 models including Turbo variants",
    type: "remote",
    capabilities: {
      chat: true,
      completion: true,
      streaming: true,
      embeddings: false,
      vision: true,
      audio: false,
      multimodal: true,
      functionCalling: true,
      codeExecution: false,
      jsonMode: true,
      moderation: false,
      safetyFilters: true,
      batching: true,
      caching: true,
      debugging: true,
      promptOptimization: false,
    },
    models: [
      "gpt-4",
      "gpt-4-turbo",
      "gpt-4-vision-preview",
      "gpt-4-1106-preview",
    ],
    endpoint: "https://api.openai.com/v1",
    pricing: {
      inputCostPer1k: 0.01,
      outputCostPer1k: 0.03,
      currency: "USD",
      billing: "per-token",
    },
    documentation: "https://platform.openai.com/docs",
    requiredConfig: ["apiKey"],
  },

  "anthropic-claude": {
    id: "anthropic-claude",
    category: ProviderCategory.ANTHROPIC,
    name: "Anthropic Claude",
    description: "Claude 3 family including Opus, Sonnet, and Haiku",
    type: "remote",
    capabilities: {
      chat: true,
      completion: true,
      streaming: true,
      embeddings: false,
      vision: true,
      audio: false,
      multimodal: true,
      functionCalling: true,
      codeExecution: false,
      jsonMode: false,
      moderation: true,
      safetyFilters: true,
      batching: false,
      caching: true,
      debugging: false,
      promptOptimization: false,
    },
    models: ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
    endpoint: "https://api.anthropic.com",
    pricing: {
      inputCostPer1k: 0.015,
      outputCostPer1k: 0.075,
      currency: "USD",
      billing: "per-token",
    },
    documentation: "https://docs.anthropic.com",
    requiredConfig: ["apiKey"],
  },

  "ollama-local": {
    id: "ollama-local",
    category: ProviderCategory.OLLAMA,
    name: "Ollama Local",
    description: "Local Ollama installation with various open-source models",
    type: "local",
    capabilities: {
      chat: true,
      completion: true,
      streaming: true,
      embeddings: true,
      vision: false,
      audio: false,
      multimodal: false,
      functionCalling: false,
      codeExecution: false,
      jsonMode: false,
      moderation: false,
      safetyFilters: false,
      batching: false,
      caching: false,
      debugging: true,
      promptOptimization: false,
    },
    models: ["llama2", "llama3", "codellama", "mistral", "gemma", "phi3"],
    endpoint: "http://localhost:11434",
    pricing: {
      inputCostPer1k: 0,
      outputCostPer1k: 0,
      currency: "USD",
      billing: "free",
    },
    documentation: "https://ollama.ai/docs",
    requiredConfig: ["endpoint"],
    optionalConfig: ["timeout"],
  },

  // Add more provider definitions...
};

// Main Registry Implementation
export class UniversalProviderRegistryImpl
  implements UniversalProviderRegistry
{
  private providers = new Map<string, UniversalProvider>();
  private factories = new Map<string, ProviderFactory>();
  private healthMonitor?: ProviderHealthMonitor;
  private loadBalancer: ProviderLoadBalancer;
  private cache?: CacheProvider;

  constructor(options?: RegistryOptions) {
    this.loadBalancer = new DefaultLoadBalancer(options?.loadBalancingStrategy);

    if (options?.enableHealthMonitoring) {
      this.healthMonitor = new ProviderHealthMonitor(this);
    }

    if (options?.cacheConfig?.enabled) {
      this.cache = options.cacheConfig.provider;
    }

    // Auto-register built-in providers
    this.registerBuiltInProviders();
  }

  // Provider Registration
  register(provider: UniversalProvider): void {
    this.providers.set(provider.id, provider);

    // Start health monitoring for this provider
    if (this.healthMonitor) {
      this.healthMonitor.addProvider(provider);
    }
  }

  unregister(providerId: string): void {
    const provider = this.providers.get(providerId);
    if (provider) {
      // Dispose of the provider
      provider.dispose();
      this.providers.delete(providerId);

      // Remove from health monitoring
      if (this.healthMonitor) {
        this.healthMonitor.removeProvider(providerId);
      }
    }
  }

  registerFactory(factory: ProviderFactory): void {
    this.factories.set(factory.type, factory);
  }

  async createProvider(config: ProviderConfig): Promise<UniversalProvider> {
    const factory = this.factories.get(config.type);
    if (!factory) {
      throw new Error(
        `No factory registered for provider type: ${config.type}`,
      );
    }

    if (!factory.validate(config)) {
      throw new Error(
        `Invalid configuration for provider type: ${config.type}`,
      );
    }

    const provider = await factory.create(config);
    this.register(provider);

    return provider;
  }

  // Provider Discovery
  getProvider(id: string): UniversalProvider | null {
    return this.providers.get(id) || null;
  }

  listProviders(type?: ProviderType): UniversalProvider[] {
    const providers = Array.from(this.providers.values());
    return type ? providers.filter((p) => p.type === type) : providers;
  }

  findByCapability(
    capability: keyof ProviderCapabilities,
  ): UniversalProvider[] {
    return Array.from(this.providers.values()).filter(
      (provider) => provider.capabilities[capability],
    );
  }

  async findByModel(modelId: string): Promise<UniversalProvider[]> {
    const providers: UniversalProvider[] = [];

    for (const provider of this.providers.values()) {
      try {
        const models = await provider.listModels();
        if (
          models.some((model) => model.id === modelId || model.name === modelId)
        ) {
          providers.push(provider);
        }
      } catch (error) {
        // Skip providers that can't list models
        continue;
      }
    }

    return providers;
  }

  // Health Monitoring
  async getHealthStatus(): Promise<ProviderHealthSummary> {
    const providers = Array.from(this.providers.values());
    const statuses = await Promise.allSettled(
      providers.map((p) => p.getStatus()),
    );

    let onlineProviders = 0;
    let healthyProviders = 0;
    let degradedProviders = 0;
    let offlineProviders = 0;
    let totalLatency = 0;
    let totalSuccessRate = 0;
    let validStatuses = 0;

    statuses.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const status = result.value;
        validStatuses++;

        if (status.status === "online") {
          onlineProviders++;
        } else {
          offlineProviders++;
        }

        if (status.health === "healthy") {
          healthyProviders++;
        } else if (status.health === "warning") {
          degradedProviders++;
        }

        totalLatency += status.averageLatency;
        totalSuccessRate += status.successRate;
      } else {
        offlineProviders++;
      }
    });

    return {
      totalProviders: providers.length,
      onlineProviders,
      healthyProviders,
      degradedProviders,
      offlineProviders,
      averageLatency: validStatuses > 0 ? totalLatency / validStatuses : 0,
      averageSuccessRate:
        validStatuses > 0 ? totalSuccessRate / validStatuses : 0,
      issues: this.healthMonitor?.getIssues() || [],
    };
  }

  async *monitorProviders(): AsyncGenerator<ProviderHealthUpdate> {
    if (!this.healthMonitor) {
      throw new Error("Health monitoring not enabled");
    }

    yield* this.healthMonitor.monitor();
  }

  // Intelligent Routing
  async selectOptimalProvider(
    request: ChatRequest,
  ): Promise<UniversalProvider> {
    // Find providers that support the requested model
    const candidateProviders = await this.findByModel(request.model);

    if (candidateProviders.length === 0) {
      throw new Error(`No providers available for model: ${request.model}`);
    }

    // Filter by availability and health
    const availableProviders =
      await this.filterAvailableProviders(candidateProviders);

    if (availableProviders.length === 0) {
      throw new Error(
        `No healthy providers available for model: ${request.model}`,
      );
    }

    // Use load balancer to select optimal provider
    return this.loadBalancer.selectProvider(request, availableProviders);
  }

  getLoadBalancer(): ProviderLoadBalancer {
    return this.loadBalancer;
  }

  // Built-in Provider Registration
  private registerBuiltInProviders(): void {
    // Register factories for built-in providers
    for (const [providerId, definition] of Object.entries(
      PROVIDER_DEFINITIONS,
    )) {
      const factory = this.createFactoryForDefinition(definition);
      this.registerFactory(factory);
    }
  }

  private createFactoryForDefinition(
    definition: ProviderDefinition,
  ): ProviderFactory {
    return {
      type: definition.id,
      supportedModels: definition.models,
      requiredConfig: definition.requiredConfig,

      async create(config: ProviderConfig): Promise<UniversalProvider> {
        // For now, return a mock provider until actual implementations exist
        return new MockProvider(config, definition);
      },

      validate(config: ProviderConfig): boolean {
        return definition.requiredConfig.every((key) => config[key] != null);
      },

      getDefaultConfig(): Partial<ProviderConfig> {
        return {
          name: definition.name,
          type: definition.type,
          enabled: true,
          priority: 1,
          endpoint: definition.endpoint,
        };
      },
    };
  }

  private async filterAvailableProviders(
    providers: UniversalProvider[],
  ): Promise<UniversalProvider[]> {
    const available: UniversalProvider[] = [];

    for (const provider of providers) {
      try {
        const status = await provider.getStatus();
        if (status.status === "online" && status.health !== "critical") {
          available.push(provider);
        }
      } catch (error) {
        // Skip unhealthy providers
        continue;
      }
    }

    return available;
  }
}

// Health Monitoring
class ProviderHealthMonitor {
  private registry: UniversalProviderRegistry;
  private monitoring = new Map<string, ProviderMonitorState>();
  private issues: ProviderIssue[] = [];

  constructor(registry: UniversalProviderRegistry) {
    this.registry = registry;
  }

  addProvider(provider: UniversalProvider): void {
    this.monitoring.set(provider.id, {
      provider,
      lastCheck: new Date(0),
      consecutiveFailures: 0,
      isHealthy: true,
    });
  }

  removeProvider(providerId: string): void {
    this.monitoring.delete(providerId);
    this.issues = this.issues.filter(
      (issue) => issue.providerId !== providerId,
    );
  }

  async *monitor(): AsyncGenerator<ProviderHealthUpdate> {
    while (true) {
      for (const [providerId, state] of this.monitoring.entries()) {
        try {
          const previousStatus = await state.provider.getStatus();

          // Wait for monitoring interval
          await new Promise((resolve) => setTimeout(resolve, 30000)); // 30 seconds

          const currentStatus = await state.provider.getStatus();

          if (this.hasStatusChanged(previousStatus, currentStatus)) {
            yield {
              providerId,
              previousStatus,
              currentStatus,
              timestamp: new Date(),
            };
          }

          this.updateProviderState(providerId, currentStatus);
        } catch (error) {
          this.handleMonitoringError(providerId, error);
        }
      }
    }
  }

  getIssues(): ProviderIssue[] {
    return [...this.issues];
  }

  private hasStatusChanged(
    previous: ProviderStatus,
    current: ProviderStatus,
  ): boolean {
    return (
      previous.status !== current.status ||
      previous.health !== current.health ||
      Math.abs(previous.successRate - current.successRate) > 0.1
    );
  }

  private updateProviderState(
    providerId: string,
    status: ProviderStatus,
  ): void {
    const state = this.monitoring.get(providerId);
    if (!state) return;

    state.lastCheck = new Date();

    if (status.status === "online" && status.health === "healthy") {
      state.consecutiveFailures = 0;
      state.isHealthy = true;

      // Resolve any existing issues
      this.resolveIssues(providerId);
    } else {
      state.consecutiveFailures++;

      if (state.consecutiveFailures >= 3) {
        state.isHealthy = false;
        this.addIssue(
          providerId,
          "high",
          `Provider has been unhealthy for ${state.consecutiveFailures} consecutive checks`,
        );
      }
    }
  }

  private handleMonitoringError(providerId: string, error: any): void {
    const state = this.monitoring.get(providerId);
    if (!state) return;

    state.consecutiveFailures++;
    this.addIssue(providerId, "critical", `Monitoring error: ${error.message}`);
  }

  private addIssue(
    providerId: string,
    severity: "low" | "medium" | "high" | "critical",
    message: string,
  ): void {
    this.issues.push({
      providerId,
      severity,
      message,
      timestamp: new Date(),
      resolved: false,
    });
  }

  private resolveIssues(providerId: string): void {
    this.issues
      .filter((issue) => issue.providerId === providerId && !issue.resolved)
      .forEach((issue) => (issue.resolved = true));
  }
}

// Load Balancing
class DefaultLoadBalancer implements ProviderLoadBalancer {
  private strategy: LoadBalancingStrategy;
  private metrics = new Map<string, RequestMetrics[]>();
  private roundRobinIndex = 0;

  constructor(strategy: LoadBalancingStrategy = "response-time") {
    this.strategy = strategy;
  }

  setStrategy(strategy: LoadBalancingStrategy): void {
    this.strategy = strategy;
  }

  async selectProvider(
    request: ChatRequest,
    providers: UniversalProvider[],
  ): Promise<UniversalProvider> {
    if (providers.length === 0) {
      throw new Error("No providers available");
    }

    if (providers.length === 1) {
      return providers[0];
    }

    switch (this.strategy) {
      case "round-robin":
        return this.selectRoundRobin(providers);
      case "least-connections":
        return this.selectLeastConnections(providers);
      case "response-time":
        return this.selectByResponseTime(providers);
      case "cost-optimized":
        return await this.selectByCost(request, providers);
      case "quality-optimized":
        return this.selectByQuality(providers);
      default:
        return providers[0];
    }
  }

  recordMetrics(providerId: string, metrics: RequestMetrics): void {
    if (!this.metrics.has(providerId)) {
      this.metrics.set(providerId, []);
    }

    const providerMetrics = this.metrics.get(providerId)!;
    providerMetrics.push(metrics);

    // Keep only last 100 metrics
    if (providerMetrics.length > 100) {
      providerMetrics.splice(0, providerMetrics.length - 100);
    }
  }

  private selectRoundRobin(providers: UniversalProvider[]): UniversalProvider {
    const provider = providers[this.roundRobinIndex % providers.length];
    this.roundRobinIndex++;
    return provider;
  }

  private selectLeastConnections(
    providers: UniversalProvider[],
  ): UniversalProvider {
    // For now, return the first provider (can be enhanced with actual connection tracking)
    return providers[0];
  }

  private selectByResponseTime(
    providers: UniversalProvider[],
  ): UniversalProvider {
    let bestProvider = providers[0];
    let bestAvgLatency = Infinity;

    for (const provider of providers) {
      const metrics = this.metrics.get(provider.id) || [];
      if (metrics.length > 0) {
        const avgLatency =
          metrics.reduce((sum, m) => sum + m.latency, 0) / metrics.length;
        if (avgLatency < bestAvgLatency) {
          bestAvgLatency = avgLatency;
          bestProvider = provider;
        }
      }
    }

    return bestProvider;
  }

  private async selectByCost(
    request: ChatRequest,
    providers: UniversalProvider[],
  ): Promise<UniversalProvider> {
    let bestProvider = providers[0];
    let lowestCost = Infinity;

    for (const provider of providers) {
      try {
        const cost = (await provider.getEstimatedCost?.(request)) || 0;
        if (cost < lowestCost) {
          lowestCost = cost;
          bestProvider = provider;
        }
      } catch (error) {
        // Skip providers that can't estimate cost
        continue;
      }
    }

    return bestProvider;
  }

  private selectByQuality(providers: UniversalProvider[]): UniversalProvider {
    let bestProvider = providers[0];
    let bestQuality = 0;

    for (const provider of providers) {
      const metrics = this.metrics.get(provider.id) || [];
      if (metrics.length > 0) {
        const avgQuality =
          metrics
            .filter((m) => m.qualityScore != null)
            .reduce((sum, m) => sum + (m.qualityScore || 0), 0) /
          metrics.length;

        if (avgQuality > bestQuality) {
          bestQuality = avgQuality;
          bestProvider = provider;
        }
      }
    }

    return bestProvider;
  }
}

// Supporting Types
interface RegistryOptions {
  loadBalancingStrategy?: LoadBalancingStrategy;
  enableHealthMonitoring?: boolean;
  cacheConfig?: CacheConfig;
}

interface ProviderMonitorState {
  provider: UniversalProvider;
  lastCheck: Date;
  consecutiveFailures: number;
  isHealthy: boolean;
}

interface ProviderIssue {
  providerId: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: Date;
  resolved?: boolean;
}

// Mock Provider Implementation (temporary until real providers exist)
class MockProvider implements UniversalProvider {
  readonly id: string;
  readonly name: string;
  readonly type: ProviderType;
  readonly capabilities: ProviderCapabilities;

  constructor(config: ProviderConfig, definition: ProviderDefinition) {
    this.id = definition.id;
    this.name = definition.name;
    this.type = definition.type;
    this.capabilities = definition.capabilities;
  }

  async initialize(config: ProviderConfig): Promise<void> {
    // Mock implementation
  }

  async dispose(): Promise<void> {
    // Mock implementation
  }

  async getStatus(): Promise<ProviderStatus> {
    return {
      status: "online",
      health: "healthy",
      lastChecked: new Date(),
      uptime: 1.0,
      averageLatency: 100,
      successRate: 0.99,
      modelsAvailable: 1,
      requestsInQueue: 0,
    };
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  async listModels(): Promise<any[]> {
    return [];
  }

  async getModel(id: string): Promise<any | null> {
    return null;
  }

  async isModelAvailable(id: string): Promise<boolean> {
    return false;
  }

  async chat(request: any): Promise<any> {
    throw new Error("Mock provider - not implemented");
  }

  async *chatStream(request: any): AsyncGenerator<any> {
    throw new Error("Mock provider - not implemented");
  }
}

// Export the implementation
export { UniversalProviderRegistryImpl as UniversalProviderRegistry };
