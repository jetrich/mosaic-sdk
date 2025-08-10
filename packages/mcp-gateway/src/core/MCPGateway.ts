import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { Server as HttpServer } from 'http';
import { GatewayConfig, TransportType } from '../types/index.js';
import { ClientDetector } from '../detection/ClientDetector.js';
import { SessionManager } from './SessionManager.js';
import { SSETransport } from '../transports/SSETransport.js';
import { RESTTransport } from '../transports/RESTTransport.js';
import { HTTPBridge } from '../bridge/HTTPBridge.js';
import { MessageRouter } from './MessageRouter.js';

export class MCPGateway {
  private app: Application;
  private httpServer: HttpServer | null = null;
  private sessionManager: SessionManager;
  private sseTransport: SSETransport;
  private restTransport: RESTTransport;
  private httpBridge: HTTPBridge;
  private messageRouter: MessageRouter;
  
  constructor(private config: GatewayConfig) {
    this.app = express();
    this.sessionManager = new SessionManager({
      session_timeout: 1800000, // 30 minutes
      cleanup_interval: 60000    // 1 minute
    });
    
    this.sseTransport = new SSETransport({
      endpoint: config.transports.sse.endpoint,
      timeout: config.transports.sse.timeout,
      opencode_compat: config.transports.sse.opencode_compat
    });
    
    this.restTransport = new RESTTransport({
      endpoint: config.transports.rest.endpoint,
      long_polling: config.transports.rest.long_polling,
      batch_size: config.transports.rest.batch_size
    });
    
    // Configure HTTP bridge to MCP Orchestrator
    this.httpBridge = new HTTPBridge({
      backends: [{
        name: 'orchestrator',
        url: 'http://localhost:3456/mcp',
        timeout: 30000
      }]
    });
    
    // Create message router
    this.messageRouter = new MessageRouter(this.httpBridge);
    
    // Configure Plane integration if available
    if (config.plane) {
      this.messageRouter.setPlaneIntegration(config.plane);
    }
    
    // Set up message handlers
    this.sseTransport.setMessageHandler(this.messageRouter.handleMessage.bind(this.messageRouter));
    
    this.setupTransports();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }
  
  private setupTransports(): void {
    this.sessionManager.registerTransport(this.sseTransport);
    this.sessionManager.registerTransport(this.restTransport);
  }
  
  private setupMiddleware(): void {
    // CORS configuration
    this.app.use(cors({
      origin: this.config.security.cors.origin,
      credentials: this.config.security.cors.credentials,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Accept', 'X-Session-Id'],
      exposedHeaders: ['X-Session-Id']
    }));
    
    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
      });
      next();
    });
    
    // Client detection middleware
    this.app.use((req, res, next) => {
      req.clientDetection = ClientDetector.detect(req);
      next();
    });
  }
  
  private setupRoutes(): void {
    // Health check
    this.app.get(this.config.monitoring.health_check, this.handleHealthCheck.bind(this));
    
    // Metrics endpoint
    this.app.get(this.config.monitoring.metrics, this.handleMetrics.bind(this));
    
    // SSE Transport Routes
    if (this.config.transports.sse.enabled) {
      this.app.get(this.config.transports.sse.endpoint, this.handleSSEConnection.bind(this));
      this.app.post(this.config.transports.sse.endpoint, this.handleSSEMessage.bind(this));
    }
    
    // REST Transport Routes
    if (this.config.transports.rest.enabled) {
      this.app.use(this.config.transports.rest.endpoint, this.handleRESTRequest.bind(this));
    }
    
    // Universal MCP endpoint with auto-detection
    this.app.get('/mcp', this.handleUniversalConnection.bind(this));
    this.app.post('/mcp', this.handleUniversalMessage.bind(this));
    
    // 404 handler
    this.app.use('*', this.handle404.bind(this));
  }
  
  private setupErrorHandling(): void {
    this.app.use((error: any, req: Request, res: Response, next: any) => {
      console.error('Gateway error:', error);
      
      if (res.headersSent) {
        return next(error);
      }
      
      res.status(500).json({
        error: 'Internal server error',
        message: error.message || 'Unknown error',
        gateway: 'mcp-gateway'
      });
    });
  }
  
  private async handleHealthCheck(req: Request, res: Response): Promise<void> {
    const stats = this.sessionManager.getStats();
    
    res.json({
      status: 'healthy',
      service: 'mcp-gateway',
      version: '0.0.2',
      timestamp: new Date().toISOString(),
      sessions: stats,
      transports: {
        sse: this.config.transports.sse.enabled,
        rest: this.config.transports.rest.enabled,
        websocket: this.config.transports.websocket.enabled
      }
    });
  }
  
  private async handleMetrics(req: Request, res: Response): Promise<void> {
    const stats = this.sessionManager.getStats();
    
    // Prometheus-style metrics
    const metrics = [
      `# HELP mcp_gateway_sessions_total Total number of sessions`,
      `# TYPE mcp_gateway_sessions_total gauge`,
      `mcp_gateway_sessions_total ${stats.total}`,
      ``,
      `# HELP mcp_gateway_sessions_active Active sessions`,
      `# TYPE mcp_gateway_sessions_active gauge`,
      `mcp_gateway_sessions_active ${stats.active}`,
      ``,
      `# HELP mcp_gateway_sessions_by_client Sessions by client type`,
      `# TYPE mcp_gateway_sessions_by_client gauge`
    ];
    
    for (const [client, count] of Object.entries(stats.byClient)) {
      metrics.push(`mcp_gateway_sessions_by_client{client="${client}"} ${count}`);
    }
    
    metrics.push('');
    metrics.push('# HELP mcp_gateway_sessions_by_transport Sessions by transport');
    metrics.push('# TYPE mcp_gateway_sessions_by_transport gauge');
    
    for (const [transport, count] of Object.entries(stats.byTransport)) {
      metrics.push(`mcp_gateway_sessions_by_transport{transport="${transport}"} ${count}`);
    }
    
    res.set('Content-Type', 'text/plain');
    res.send(metrics.join('\\n'));
  }
  
  private async handleSSEConnection(req: Request, res: Response): Promise<void> {
    try {
      const detection = req.clientDetection;
      const session = await this.sessionManager.createSession(
        detection.type,
        'sse',
        { userAgent: req.headers['user-agent'] }
      );
      
      const sessionId = await this.sseTransport.handleConnection(req, res, detection.type);
      console.log(`SSE connection established: ${sessionId} (${detection.type})`);
      
    } catch (error) {
      console.error('SSE connection failed:', error);
      res.status(500).json({
        error: 'Connection failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  private async handleSSEMessage(req: Request, res: Response): Promise<void> {
    const sessionId = req.query.sessionId as string;
    
    if (!sessionId) {
      res.status(400).json({
        error: 'Missing sessionId',
        message: 'sessionId query parameter is required'
      });
      return;
    }
    
    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      res.status(404).json({
        error: 'Session not found',
        sessionId
      });
      return;
    }
    
    try {
      await this.sseTransport.handleMessage(sessionId, req, res);
      this.sessionManager.touchSession(sessionId);
    } catch (error) {
      console.error('SSE message handling failed:', error);
      res.status(500).json({
        error: 'Message processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  private async handleRESTRequest(req: Request, res: Response): Promise<void> {
    const path = req.path.replace(this.config.transports.rest.endpoint, '');
    
    try {
      await this.restTransport.handleRequest(req.method, path, req, res);
    } catch (error) {
      console.error('REST request failed:', error);
      res.status(500).json({
        error: 'Request failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  private async handleUniversalConnection(req: Request, res: Response): Promise<void> {
    const detection = req.clientDetection;
    const fallbackChain = ClientDetector.getFallbackChain(detection);
    
    console.log(`Universal connection attempt: ${detection.type} requesting ${detection.transport}`);
    console.log(`Fallback chain: ${fallbackChain.join(' -> ')}`);
    
    // Try preferred transport first
    if (this.isTransportEnabled(detection.transport)) {
      try {
        await this.connectViaTransport(detection.transport, req, res);
        return;
      } catch (error) {
        console.warn(`Primary transport ${detection.transport} failed:`, error);
      }
    }
    
    // Try fallback chain
    for (const transport of fallbackChain) {
      if (transport === detection.transport) continue; // Already tried
      
      if (this.isTransportEnabled(transport)) {
        try {
          await this.connectViaTransport(transport, req, res);
          console.log(`Fallback successful: ${transport}`);
          return;
        } catch (error) {
          console.warn(`Fallback transport ${transport} failed:`, error);
        }
      }
    }
    
    // All transports failed
    res.status(503).json({
      error: 'No transport available',
      attempted: [detection.transport, ...fallbackChain],
      client: detection.type
    });
  }
  
  private async handleUniversalMessage(req: Request, res: Response): Promise<void> {
    const sessionId = (req.query.sessionId as string) || req.headers['x-session-id'] as string;
    
    if (!sessionId) {
      res.status(400).json({
        error: 'Missing sessionId',
        message: 'Provide sessionId as query parameter or X-Session-Id header'
      });
      return;
    }
    
    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      res.status(404).json({
        error: 'Session not found',
        sessionId
      });
      return;
    }
    
    // Route to appropriate transport handler
    switch (session.transport) {
      case 'sse':
        await this.handleSSEMessage(req, res);
        break;
      case 'rest':
        await this.handleRESTRequest(req, res);
        break;
      default:
        res.status(400).json({
          error: 'Unsupported transport',
          transport: session.transport
        });
    }
  }
  
  private async connectViaTransport(transport: TransportType, req: Request, res: Response): Promise<void> {
    switch (transport) {
      case 'sse':
        await this.handleSSEConnection(req, res);
        break;
      case 'rest':
        // REST doesn't establish persistent connections
        res.json({
          transport: 'rest',
          endpoints: {
            session: `${this.config.transports.rest.endpoint}/session`,
            execute: `${this.config.transports.rest.endpoint}/execute`,
            tools: `${this.config.transports.rest.endpoint}/tools`
          }
        });
        break;
      default:
        throw new Error(`Transport not implemented: ${transport}`);
    }
  }
  
  private isTransportEnabled(transport: TransportType): boolean {
    switch (transport) {
      case 'sse':
        return this.config.transports.sse.enabled;
      case 'rest':
        return this.config.transports.rest.enabled;
      case 'websocket':
        return this.config.transports.websocket.enabled;
      default:
        return false;
    }
  }
  
  private handle404(req: Request, res: Response): void {
    res.status(404).json({
      error: 'Not found',
      path: req.path,
      availableEndpoints: [
        'GET /health',
        'GET /metrics',
        'GET /mcp (universal)',
        'POST /mcp (universal)',
        ...(this.config.transports.sse.enabled ? [
          `GET ${this.config.transports.sse.endpoint}`,
          `POST ${this.config.transports.sse.endpoint}`
        ] : []),
        ...(this.config.transports.rest.enabled ? [
          `${this.config.transports.rest.endpoint}/*`
        ] : [])
      ]
    });
  }
  
  async start(): Promise<void> {
    // Connect to backend MCP servers
    try {
      await this.httpBridge.connect();
    } catch (error) {
      console.error('Failed to connect to MCP backends:', error);
      // Continue anyway - backends might come online later
    }
    
    return new Promise((resolve) => {
      this.httpServer = this.app.listen(this.config.port, this.config.host, () => {
        console.log(`MCP Gateway listening on ${this.config.host}:${this.config.port}`);
        console.log('Available transports:');
        if (this.config.transports.sse.enabled) {
          console.log(`  - SSE: ${this.config.transports.sse.endpoint}`);
        }
        if (this.config.transports.rest.enabled) {
          console.log(`  - REST: ${this.config.transports.rest.endpoint}`);
        }
        if (this.config.transports.websocket.enabled) {
          console.log(`  - WebSocket: ${this.config.transports.websocket.endpoint}`);
        }
        console.log(`  - Universal: /mcp (auto-detect)`);
        
        // Show backend status
        const backendStatus = this.httpBridge.getStatus();
        console.log('Backend connections:');
        backendStatus.forEach(status => {
          console.log(`  - ${status.name}: ${status.connected ? 'connected' : 'disconnected'}`);
        });
        
        resolve();
      });
    });
  }
  
  async stop(): Promise<void> {
    console.log('Shutting down MCP Gateway...');
    
    await this.sessionManager.shutdown();
    await this.httpBridge.disconnect();
    
    return new Promise((resolve) => {
      if (this.httpServer) {
        this.httpServer.close(() => {
          console.log('MCP Gateway stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      clientDetection: any;
    }
  }
}