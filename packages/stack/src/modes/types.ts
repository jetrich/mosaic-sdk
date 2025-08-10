/**
 * Types for operation mode management
 */

export type OperationMode = 'local' | 'hybrid' | 'cloud';

export interface ModeConfig {
  mode: OperationMode;
  description: string;
  requirements: string[];
  components: string[];
  providers: ProviderMode[];
  features: ModeFeature[];
}

export interface ProviderMode {
  name: string;
  type: 'local' | 'cloud';
  required: boolean;
  fallback?: string;
}

export interface ModeFeature {
  name: string;
  enabled: boolean;
  description: string;
}

export interface ModeStatus {
  current: OperationMode;
  available: OperationMode[];
  switching: boolean;
  health: {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    checks: ModeHealthCheck[];
  };
}

export interface ModeHealthCheck {
  name: string;
  status: 'passing' | 'warning' | 'failing';
  message: string;
  required: boolean;
}