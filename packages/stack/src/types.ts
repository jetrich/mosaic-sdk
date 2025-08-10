/**
 * Core types for MosAIc Stack orchestration
 */

export interface StackOptions {
  mode: 'local' | 'hybrid' | 'cloud';
  configPath?: string;
  verbose?: boolean;
  timeout?: number;
  autoStart?: boolean;
  port?: number;
}

export interface StackInstance {
  start(): Promise<void>;
  stop(): Promise<void>;
  restart(): Promise<void>;
  status(): Promise<StackStatus>;
  configure(options: Partial<StackOptions>): Promise<void>;
  getMode(): 'local' | 'hybrid' | 'cloud';
  getConfig(): StackConfig;
}

export interface StackStatus {
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
  mode: 'local' | 'hybrid' | 'cloud';
  version: string;
  uptime?: number;
  components: ComponentStatus[];
  providers: ProviderStatus[];
  health: HealthStatus;
}

export interface ComponentStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  version?: string;
  health?: 'healthy' | 'unhealthy' | 'unknown';
  port?: number;
  pid?: number;
}

export interface ProviderStatus {
  name: string;
  type: 'local' | 'cloud';
  status: 'available' | 'unavailable' | 'error';
  health?: 'healthy' | 'unhealthy' | 'unknown';
  latency?: number;
  models?: string[];
}

export interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  lastCheck: string;
}

export interface HealthCheck {
  name: string;
  status: 'passing' | 'warning' | 'failing';
  message?: string;
  duration?: number;
}

export interface StackConfig {
  mode: 'local' | 'hybrid' | 'cloud';
  port: number;
  timeout: number;
  components: ComponentConfig[];
  providers: ProviderConfig[];
  logging: LoggingConfig;
  telemetry: TelemetryConfig;
}

export interface ComponentConfig {
  name: string;
  enabled: boolean;
  port?: number;
  config?: Record<string, unknown>;
}

export interface ProviderConfig {
  name: string;
  type: 'local' | 'cloud';
  enabled: boolean;
  priority: number;
  config: Record<string, unknown>;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  file?: string;
  console: boolean;
  format: 'json' | 'text';
}

export interface TelemetryConfig {
  enabled: boolean;
  endpoint?: string;
  timeout: number;
}