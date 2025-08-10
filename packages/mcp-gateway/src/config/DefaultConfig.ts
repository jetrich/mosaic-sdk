import { GatewayConfig } from '../types/index.js';

export const DEFAULT_CONFIG: GatewayConfig = {
  port: 3456,
  host: '0.0.0.0',
  
  transports: {
    sse: {
      enabled: true,
      endpoint: '/mcp',
      opencode_compat: true,
      timeout: 1800000 // 30 minutes
    },
    rest: {
      enabled: true,
      endpoint: '/api/v1',
      long_polling: true,
      batch_size: 10
    },
    websocket: {
      enabled: false, // Not implemented yet
      endpoint: '/ws',
      compression: true,
      heartbeat: 30000
    }
  },
  
  fallback: {
    enabled: true,
    chain: ['sse', 'rest'],
    retry_count: 3,
    retry_delay: 1000
  },
  
  security: {
    cors: {
      origin: true,
      credentials: true
    },
    rate_limit: {
      requests_per_minute: 100
    }
  },
  
  monitoring: {
    health_check: '/health',
    metrics: '/metrics',
    logging: 'info'
  }
};

export function createConfig(overrides: Partial<GatewayConfig> = {}): GatewayConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    transports: {
      ...DEFAULT_CONFIG.transports,
      ...overrides.transports
    },
    fallback: {
      ...DEFAULT_CONFIG.fallback,
      ...overrides.fallback
    },
    security: {
      ...DEFAULT_CONFIG.security,
      ...overrides.security
    },
    monitoring: {
      ...DEFAULT_CONFIG.monitoring,
      ...overrides.monitoring
    }
  };
}