/**
 * Types for provider orchestration
 */

export interface ProviderConfig {
  name: string;
  type: 'local' | 'cloud';
  enabled: boolean;
  priority: number;
  timeout?: number;
  config: Record<string, unknown>;
  fallback?: string;
}

export interface ProviderStatus {
  name: string;
  type: 'local' | 'cloud';
  status: 'available' | 'unavailable' | 'error';
  health: 'healthy' | 'unhealthy' | 'unknown';
  latency?: number;
  models?: string[];
  lastCheck?: string;
  error?: string;
}

export interface ProviderOrchestrationResult {
  providers: ProviderStatus[];
  health: {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    checks: ProviderHealthCheck[];
  };
}

export interface ProviderHealthCheck {
  name: string;
  status: 'passing' | 'warning' | 'failing';
  message: string;
  duration?: number;
}