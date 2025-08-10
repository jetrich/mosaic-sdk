import express, { Application } from 'express';
import cors from 'cors';
import { Server as HttpServer } from 'http';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { Server as MCPServer } from '@modelcontextprotocol/sdk/server/index.js';
import { Logger } from '../utils/Logger';

interface TransportSession {
  transport: SSEServerTransport;
  createdAt: Date;
  lastActivity: Date;
}

export class MCPHTTPServer {
  private app: Application;
  private httpServer: HttpServer | null = null;
  private sessions = new Map<string, TransportSession>();
  private logger: Logger;

  constructor(
    private mcpServer: MCPServer,
    private config: {
      port: number;
      cors?: cors.CorsOptions;
    }
  ) {
    this.app = express();
    this.logger = Logger.create({ level: 'info', console: true, structured: false });
    this.setupMiddleware();
    this.setupRoutes();
    this.startSessionCleanup();
  }

  private setupMiddleware(): void {
    // CORS configuration
    const corsOptions: cors.CorsOptions = this.config.cors || {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Accept'],
      exposedHeaders: ['X-Session-Id']
    };
    
    this.app.use(cors(corsOptions));
    
    // Only use JSON parsing for non-SSE message endpoints
    this.app.use((req, res, next) => {
      if (req.path === '/mcp' && req.method === 'POST') {
        // Skip JSON parsing for SSE message endpoints - let transport handle it
        next();
      } else {
        express.json({ limit: '10mb' })(req, res, next);
      }
    });
    
    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.logger.debug(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.json({
        status: 'healthy',
        service: 'mcp-orchestrator',
        version: '1.0.0',
        transport: 'http/sse',
        activeSessions: this.sessions.size,
        timestamp: new Date().toISOString()
      });
    });

    // SSE connection endpoint
    this.app.get('/mcp', async (req, res) => {
      try {
        // Log incoming request headers for debugging
        this.logger.info('SSE connection request', {
          headers: req.headers,
          url: req.url,
          method: req.method
        });
        
        // Be more lenient with Accept header - OpenCode might not send text/event-stream

        // Create SSE transport - first parameter is the base POST endpoint 
        // The transport will append ?sessionId=xyz automatically
        const transport = new SSEServerTransport('/mcp', res);
        
        // Store session before connecting (connect will call start automatically)
        const sessionId = transport.sessionId;
        this.sessions.set(sessionId, {
          transport,
          createdAt: new Date(),
          lastActivity: new Date()
        });
        
        this.logger.info('SSE session created', { sessionId });
        
        // Connect to MCP server (this will call start() automatically)
        try {
          await this.mcpServer.connect(transport);
          this.logger.info('MCP server connected successfully', { sessionId });
        } catch (connectError) {
          this.logger.error('Failed to connect MCP server', { 
            sessionId,
            error: connectError instanceof Error ? connectError.message : 'Unknown error',
            stack: connectError instanceof Error ? connectError.stack : undefined
          });
          throw connectError;
        }

        // Handle client disconnect
        req.on('close', () => {
          this.sessions.delete(sessionId);
          this.logger.info('SSE session closed', { sessionId });
        });

      } catch (error) {
        this.logger.error('Failed to establish SSE connection', error);
        res.status(500).json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Message handling endpoint - sessionId comes as query parameter
    this.app.post('/mcp', async (req, res) => {
      try {
        const sessionId = req.query['sessionId'] as string;
        if (!sessionId) {
          res.status(400).json({
            error: 'Missing sessionId',
            message: 'sessionId query parameter is required'
          });
          return;
        }
        
        const session = this.sessions.get(sessionId);

        if (!session) {
          res.status(404).json({
            error: 'Session not found',
            message: `No active session with ID: ${sessionId}`
          });
          return;
        }

        // Update last activity
        session.lastActivity = new Date();

        // Handle the message through the transport
        await session.transport.handlePostMessage(req, res);

      } catch (error) {
        this.logger.error('Failed to handle message', error);
        res.status(500).json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // List available tools (for debugging)
    this.app.get('/tools', async (_req, res) => {
      try {
        // This endpoint helps verify all 31 tools are available
        res.json({
          message: 'Use GET /mcp to establish connection, then use tools/list method',
          endpoint: '/mcp',
          sessionEndpoint: '/mcp/:sessionId'
        });
      } catch (error) {
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // 404 handler
    this.app.use((_req, res) => {
      res.status(404).json({
        error: 'Not found',
        availableEndpoints: [
          'GET /health',
          'GET /mcp',
          'POST /mcp?sessionId=<uuid>',
          'GET /tools'
        ]
      });
    });
  }

  private startSessionCleanup(): void {
    // Clean up inactive sessions every 5 minutes
    setInterval(() => {
      const now = new Date();
      const timeout = 30 * 60 * 1000; // 30 minutes

      for (const [sessionId, session] of this.sessions) {
        const inactiveTime = now.getTime() - session.lastActivity.getTime();
        if (inactiveTime > timeout) {
          this.sessions.delete(sessionId);
          this.logger.info('Session cleaned up due to inactivity', { sessionId });
        }
      }
    }, 5 * 60 * 1000);
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer = this.app.listen(this.config.port, () => {
        this.logger.info(`MCP Orchestrator HTTP server listening on port ${this.config.port}`);
        this.logger.info('Available endpoints:');
        this.logger.info('  GET  /health         - Health check');
        this.logger.info('  GET  /mcp           - SSE connection');
        this.logger.info('  POST /mcp/:sessionId - Send messages');
        this.logger.info('  GET  /tools         - Tool information');
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    // Close all sessions
    for (const [sessionId, session] of this.sessions) {
      try {
        await session.transport.close();
      } catch (error) {
        this.logger.error(`Error closing session ${sessionId}`, error);
      }
    }
    this.sessions.clear();

    // Close HTTP server
    return new Promise((resolve) => {
      if (this.httpServer) {
        this.httpServer.close(() => {
          this.logger.info('HTTP server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}