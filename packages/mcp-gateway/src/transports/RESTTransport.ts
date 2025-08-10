import { Request, Response } from 'express';
import { Transport, Session, Message } from '../types/index.js';

export class RESTTransport implements Transport {
  readonly type = 'rest' as const;
  private sessions = new Map<string, RESTSession>();
  
  constructor(private config: {
    endpoint: string;
    long_polling: boolean;
    batch_size: number;
  }) {}
  
  async connect(session: Session): Promise<void> {
    this.sessions.set(session.id, {
      session,
      messageQueue: [],
      longPollResponse: null
    });
  }
  
  async send(session: Session, message: Message): Promise<void> {
    const restSession = this.sessions.get(session.id);
    if (!restSession) {
      throw new Error(`No REST session found: ${session.id}`);
    }
    
    // Add message to queue
    restSession.messageQueue.push(message);
    
    // If client is long-polling, send immediately
    if (restSession.longPollResponse) {
      this.flushMessages(restSession);
    }
  }
  
  async close(session: Session): Promise<void> {
    const restSession = this.sessions.get(session.id);
    if (restSession?.longPollResponse) {
      restSession.longPollResponse.end();
    }
    this.sessions.delete(session.id);
  }
  
  /**
   * Handle REST API request
   */
  async handleRequest(method: string, path: string, req: Request, res: Response): Promise<void> {
    const sessionId = this.getSessionId(req);
    
    switch (method) {
      case 'POST':
        await this.handlePostRequest(path, sessionId, req, res);
        break;
        
      case 'GET':
        await this.handleGetRequest(path, sessionId, req, res);
        break;
        
      default:
        res.status(405).json({
          error: 'Method not allowed',
          allowed: ['GET', 'POST']
        });
    }
  }
  
  private async handlePostRequest(path: string, sessionId: string, req: Request, res: Response): Promise<void> {
    const session = this.sessions.get(sessionId);
    
    switch (path) {
      case '/session':
        await this.createSession(req, res);
        break;
        
      case '/execute':
        if (!session) {
          res.status(404).json({ error: 'Session not found' });
          return;
        }
        await this.executeCommand(session, req, res);
        break;
        
      case '/batch':
        if (!session) {
          res.status(404).json({ error: 'Session not found' });
          return;  
        }
        await this.executeBatch(session, req, res);
        break;
        
      default:
        res.status(404).json({ error: 'Endpoint not found' });
    }
  }
  
  private async handleGetRequest(path: string, sessionId: string, req: Request, res: Response): Promise<void> {
    const session = this.sessions.get(sessionId);
    
    switch (path) {
      case '/tools':
        await this.listTools(res);
        break;
        
      case '/messages':
        if (!session) {
          res.status(404).json({ error: 'Session not found' });
          return;
        }
        await this.getMessages(session, req, res);
        break;
        
      case '/status':
        if (!session) {
          res.status(404).json({ error: 'Session not found' });
          return;
        }
        await this.getStatus(session, res);
        break;
        
      case '/test-command':
        await this.testCommand(req, res);
        break;
        
      default:
        res.status(404).json({ error: 'Endpoint not found' });
    }
  }
  
  private async createSession(req: Request, res: Response): Promise<void> {
    const sessionId = this.generateSessionId();
    
    const session: Session = {
      id: sessionId,
      transport: 'rest',
      created: new Date(),
      lastActivity: new Date(),
      state: 'active',
      metadata: {
        client: 'unknown',
        capabilities: ['rest'],
        userAgent: req.headers['user-agent']
      }
    };
    
    await this.connect(session);
    
    res.json({
      sessionId,
      transport: 'rest',
      endpoints: {
        execute: `${this.config.endpoint}/execute?sessionId=${sessionId}`,
        batch: `${this.config.endpoint}/batch?sessionId=${sessionId}`,
        messages: `${this.config.endpoint}/messages?sessionId=${sessionId}`,
        status: `${this.config.endpoint}/status?sessionId=${sessionId}`
      }
    });
  }
  
  private async executeCommand(session: RESTSession, req: Request, res: Response): Promise<void> {
    try {
      const body = await this.parseBody(req);
      const message = this.validateMessage(body);
      
      // Update session activity
      session.session.lastActivity = new Date();
      
      // Process command (delegate to MCP server)
      const result = await this.processMessage(session.session, message);
      
      res.json({
        success: true,
        result,
        sessionId: session.session.id
      });
      
    } catch (error) {
      res.status(400).json({
        error: 'Command execution failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  private async executeBatch(session: RESTSession, req: Request, res: Response): Promise<void> {
    try {
      const body = await this.parseBody(req);
      const messages = this.validateBatch(body);
      
      if (messages.length > this.config.batch_size) {
        res.status(400).json({
          error: 'Batch size exceeded',
          maxSize: this.config.batch_size,
          provided: messages.length
        });
        return;
      }
      
      // Update session activity
      session.session.lastActivity = new Date();
      
      // Process all messages
      const results = await Promise.allSettled(
        messages.map(msg => this.processMessage(session.session, msg))
      );
      
      res.json({
        success: true,
        results: results.map((result, index) => ({
          index,
          success: result.status === 'fulfilled',
          result: result.status === 'fulfilled' ? result.value : undefined,
          error: result.status === 'rejected' ? result.reason?.message : undefined
        })),
        sessionId: session.session.id
      });
      
    } catch (error) {
      res.status(400).json({
        error: 'Batch execution failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  private async getMessages(session: RESTSession, req: Request, res: Response): Promise<void> {
    if (this.config.long_polling) {
      // Long polling implementation
      const timeout = parseInt(req.query.timeout as string) || 30000;
      
      if (session.messageQueue.length > 0) {
        // Messages available immediately
        this.flushMessages(session);
        res.json({
          messages: session.messageQueue.splice(0),
          hasMore: false
        });
      } else {
        // Wait for messages
        session.longPollResponse = res;
        
        setTimeout(() => {
          if (session.longPollResponse === res) {
            session.longPollResponse = null;
            res.json({
              messages: [],
              hasMore: false,
              timeout: true
            });
          }
        }, timeout);
      }
    } else {
      // Regular polling
      const messages = session.messageQueue.splice(0);
      res.json({
        messages,
        hasMore: false
      });
    }
  }
  
  private async getStatus(session: RESTSession, res: Response): Promise<void> {
    res.json({
      sessionId: session.session.id,
      state: session.session.state,
      created: session.session.created,
      lastActivity: session.session.lastActivity,
      queuedMessages: session.messageQueue.length,
      transport: 'rest'
    });
  }
  
  private async listTools(res: Response): Promise<void> {
    // Query actual tools from backend - requires bridge reference
    // For now, return the full list
    res.json({
      tools: [
        'mosaic_task_create',
        'mosaic_task_assign',
        'mosaic_task_status',
        'mosaic_task_depend',
        'mosaic_task_decompose',
        'mosaic_task_estimate_batch',
        'mosaic_task_assign_intelligent',
        'mosaic_task_analyze_complexity',
        'mosaic_project_create',
        'mosaic_project_update',
        'mosaic_project_list',
        'mosaic_project_switch',
        'mosaic_project_status',
        'mosaic_agent_mosaic_agent_deploy',
        'mosaic_agent_mosaic_agent_status',
        'mosaic_agent_mosaic_agent_terminate',
        'mosaic_agent_mosaic_agent_message',
        'mosaic_agent_mosaic_agent_handoff',
        'mosaic_agent_mosaic_agent_broadcast',
        'mosaic_agent_mosaic_workflow_create',
        'mosaic_agent_mosaic_workflow_execute',
        'mosaic_agent_mosaic_workflow_monitor',
        'mosaic_agent_mosaic_workflow_list',
        'mosaic_agent_mosaic_workflow_get',
        'mosaic_agent_mosaic_workflow_pause',
        'mosaic_agent_mosaic_workflow_resume',
        'mosaic_agent_mosaic_workflow_cancel',
        'mosaic_agent_mosaic_resource_monitor',
        'mosaic_agent_mosaic_agent_limits',
        'mosaic_agent_mosaic_performance_report',
        'mosaic_agent_mosaic_resource_alerts'
      ],
      transport: 'rest',
      capabilities: ['batch', 'long_polling']
    });
  }
  
  private flushMessages(session: RESTSession): void {
    if (session.longPollResponse && session.messageQueue.length > 0) {
      const messages = session.messageQueue.splice(0);
      session.longPollResponse.json({
        messages,
        hasMore: false
      });
      session.longPollResponse = null;
    }
  }
  
  private getSessionId(req: Request): string {
    return (req.query.sessionId as string) || 
           req.headers['x-session-id'] as string ||
           '';
  }
  
  private generateSessionId(): string {
    return `rest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private async parseBody(req: Request): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error('Invalid JSON'));
        }
      });
    });
  }
  
  private validateMessage(body: any): Message {
    if (!body || typeof body !== 'object') {
      throw new Error('Invalid message format');
    }
    
    if (!body.jsonrpc || body.jsonrpc !== '2.0') {
      throw new Error('Invalid JSON-RPC version');
    }
    
    return body as Message;
  }
  
  private validateBatch(body: any): Message[] {
    if (!Array.isArray(body)) {
      throw new Error('Batch must be an array');
    }
    
    return body.map(msg => this.validateMessage(msg));
  }
  
  private async processMessage(session: Session, message: Message): Promise<any> {
    // This would delegate to the actual MCP server
    console.log(`Processing REST message for session ${session.id}:`, message);
    
    // Mock response for now
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: { success: true, method: message.method }
    };
  }
  
  private async testCommand(req: Request, res: Response): Promise<void> {
    try {
      const body = await this.parseBody(req);
      const { command } = body;
      
      if (!command) {
        res.status(400).json({ error: 'Missing command' });
        return;
      }
      
      // Import CommandRouter dynamically to avoid circular dependency
      const { CommandRouter } = await import('../commands/CommandRouter.js');
      const router = new CommandRouter();
      
      const parsed = router.parseCommand(command);
      const message = router.commandToMessage(parsed);
      
      res.json({
        command,
        parsed,
        message
      });
      
    } catch (error) {
      res.status(500).json({
        error: 'Command parsing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

interface RESTSession {
  session: Session;
  messageQueue: Message[];
  longPollResponse: Response | null;
}