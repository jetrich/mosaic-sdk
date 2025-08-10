import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { Transport, Session, Message, ClientType } from '../types/index.js';

export class SSETransport implements Transport {
  readonly type = 'sse' as const;
  private sessions = new Map<string, SSESession>();
  private messageHandler: ((session: Session, message: Message) => Promise<any>) | null = null;
  
  constructor(private config: {
    endpoint: string;
    timeout: number;
    opencode_compat: boolean;
  }) {}
  
  async connect(session: Session): Promise<void> {
    // SSE connection is established via HTTP endpoint
    // This method is called after the connection is made
    this.sessions.set(session.id, {
      session,
      response: null,
      connected: false
    });
  }
  
  async send(session: Session, message: Message): Promise<void> {
    const sseSession = this.sessions.get(session.id);
    if (!sseSession || !sseSession.response) {
      throw new Error(`No active SSE connection for session ${session.id}`);
    }
    
    const formatted = this.formatMessage(message, session.metadata.client);
    sseSession.response.write(formatted);
  }
  
  async close(session: Session): Promise<void> {
    const sseSession = this.sessions.get(session.id);
    if (sseSession?.response) {
      sseSession.response.end();
    }
    this.sessions.delete(session.id);
  }
  
  /**
   * Handle SSE connection request
   */
  async handleConnection(req: Request, res: Response, clientType: ClientType): Promise<string> {
    const sessionId = randomUUID();
    
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Session-Id': sessionId
    });
    
    // Send initial connection event
    const connectionEvent = this.formatConnectionEvent(sessionId, clientType);
    res.write(connectionEvent);
    
    // Store session
    const sseSession = this.sessions.get(sessionId);
    if (sseSession) {
      sseSession.response = res;
      sseSession.connected = true;
    }
    
    // Handle client disconnect
    req.on('close', () => {
      this.sessions.delete(sessionId);
    });
    
    // Send periodic pings to keep connection alive
    const pingInterval = setInterval(() => {
      if (res.writable) {
        res.write('event: ping\\ndata: {}\\n\\n');
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
    
    return sessionId;
  }
  
  /**
   * Handle POST message to session
   */
  async handleMessage(sessionId: string, req: Request, res: Response): Promise<void> {
    const sseSession = this.sessions.get(sessionId);
    if (!sseSession) {
      res.status(404).json({
        error: 'Session not found',
        sessionId
      });
      return;
    }
    
    try {
      // Parse message body
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', async () => {
        try {
          const message = JSON.parse(body);
          
          // Update session activity
          sseSession.session.lastActivity = new Date();
          
          // Process message (delegate to MCP server)
          await this.processMessage(sseSession.session, message);
          
          res.status(202).end('Accepted');
        } catch (error) {
          res.status(400).json({
            error: 'Invalid JSON',
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Message processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  private formatConnectionEvent(sessionId: string, clientType: ClientType): string {
    if (clientType === 'opencode') {
      // OpenCode expects endpoint information immediately
      return `event: endpoint\\ndata: ${this.config.endpoint}?sessionId=${sessionId}\\n\\n`;
    } else {
      // Generic connection event
      return `event: connected\\ndata: {"sessionId": "${sessionId}"}\\n\\n`;
    }
  }
  
  private formatMessage(message: Message, clientType: ClientType): string {
    if (clientType === 'opencode') {
      // OpenCode expects message ID for tracking
      const id = message.id || Date.now().toString();
      return `id: ${id}\\nevent: message\\ndata: ${JSON.stringify(message)}\\n\\n`;
    } else {
      // Standard SSE message format
      return `event: message\\ndata: ${JSON.stringify(message)}\\n\\n`;
    }
  }
  
  private async processMessage(session: Session, message: Message): Promise<void> {
    if (this.messageHandler) {
      const response = await this.messageHandler(session, message);
      
      // Send response back to client
      if (response) {
        await this.send(session, response);
      }
    } else {
      console.warn(`No message handler registered for SSE transport`);
    }
  }
  
  /**
   * Set message handler callback
   */
  setMessageHandler(handler: (session: Session, message: Message) => Promise<any>): void {
    this.messageHandler = handler;
  }
  
  /**
   * Get active session count
   */
  getActiveSessionCount(): number {
    return this.sessions.size;
  }
  
  /**
   * Clean up inactive sessions
   */
  cleanup(): void {
    const now = Date.now();
    const timeout = this.config.timeout;
    
    for (const [sessionId, sseSession] of this.sessions) {
      const idle = now - sseSession.session.lastActivity.getTime();
      if (idle > timeout) {
        if (sseSession.response) {
          sseSession.response.end();
        }
        this.sessions.delete(sessionId);
        console.log(`Cleaned up inactive SSE session: ${sessionId}`);
      }
    }
  }
}

interface SSESession {
  session: Session;
  response: Response | null;
  connected: boolean;
}