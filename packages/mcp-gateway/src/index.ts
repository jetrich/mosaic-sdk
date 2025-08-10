export { MCPGateway } from './core/MCPGateway.js';
export { SessionManager } from './core/SessionManager.js';
export { ClientDetector } from './detection/ClientDetector.js';
export { SSETransport } from './transports/SSETransport.js';
export { RESTTransport } from './transports/RESTTransport.js';
export { DEFAULT_CONFIG, createConfig } from './config/DefaultConfig.js';

export type {
  GatewayConfig,
  TransportConfig,
  Session,
  Transport,
  Message,
  ClientDetectionResult,
  TransportType,
  ClientType,
  SessionState
} from './types/index.js';