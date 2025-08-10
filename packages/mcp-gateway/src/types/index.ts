export type TransportType = 'sse' | 'websocket' | 'rest' | 'stdio';
export type ClientType = 'claude' | 'opencode' | 'unknown';
export type SessionState = 'connecting' | 'active' | 'idle' | 'closing';

export interface TransportConfig {
  sse: {
    enabled: boolean;
    endpoint: string;
    opencode_compat: boolean;
    timeout: number;
  };
  rest: {
    enabled: boolean;
    endpoint: string;
    long_polling: boolean;
    batch_size: number;
  };
  websocket: {
    enabled: boolean;
    endpoint: string;
    compression: boolean;
    heartbeat: number;
  };
}

export interface GatewayConfig {
  port: number;
  host: string;
  transports: TransportConfig;
  fallback: {
    enabled: boolean;
    chain: TransportType[];
    retry_count: number;
    retry_delay: number;
  };
  security: {
    cors: {
      origin: string | boolean;
      credentials: boolean;
    };
    rate_limit: {
      requests_per_minute: number;
    };
  };
  monitoring: {
    health_check: string;
    metrics: string;
    logging: string;
  };
  plane?: {
    apiUrl: string;
    apiKey: string;
    workspaceSlug: string;
    projectId: string;
  };
}

export interface Session {
  id: string;
  transport: TransportType;
  created: Date;
  lastActivity: Date;
  state: SessionState;
  metadata: {
    client: ClientType;
    capabilities: string[];
    userAgent?: string;
  };
}

export interface Transport {
  type: TransportType;
  connect(session: Session): Promise<void>;
  send(session: Session, message: any): Promise<void>;
  close(session: Session): Promise<void>;
}

export interface Message {
  id?: string;
  jsonrpc: string;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

export interface ClientDetectionResult {
  type: ClientType;
  confidence: number;
  transport: TransportType;
  capabilities: string[];
}