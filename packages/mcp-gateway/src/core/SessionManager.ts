import { EventEmitter } from 'events';
import { Session, SessionState, Transport, ClientType, TransportType } from '../types/index.js';
import { randomUUID } from 'node:crypto';

export class SessionManager extends EventEmitter {
  private sessions = new Map<string, Session>();
  private transports = new Map<TransportType, Transport>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor(private config: {
    session_timeout: number;
    cleanup_interval: number;
  }) {
    super();
    this.startCleanup();
  }
  
  /**
   * Create a new session
   */
  async createSession(
    clientType: ClientType,
    transport: TransportType,
    metadata: any = {}
  ): Promise<Session> {
    const session: Session = {
      id: randomUUID(),
      transport,
      created: new Date(),
      lastActivity: new Date(),
      state: 'connecting',
      metadata: {
        client: clientType,
        capabilities: this.getClientCapabilities(clientType),
        ...metadata
      }
    };
    
    this.sessions.set(session.id, session);
    
    try {
      const transportHandler = this.transports.get(transport);
      if (!transportHandler) {
        throw new Error(`Transport not available: ${transport}`);
      }
      
      await transportHandler.connect(session);
      session.state = 'active';
      
      this.emit('sessionCreated', session);
      console.log(`Session created: ${session.id} (${clientType} via ${transport})`);
      
      return session;
    } catch (error) {
      session.state = 'closing';
      this.sessions.delete(session.id);
      throw error;
    }
  }
  
  /**
   * Get session by ID
   */
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }
  
  /**
   * Update session state
   */
  updateSession(sessionId: string, updates: Partial<Session>): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    Object.assign(session, updates);
    session.lastActivity = new Date();
    
    this.emit('sessionUpdated', session);
    return true;
  }
  
  /**
   * Mark session as active (update last activity)
   */
  touchSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    session.lastActivity = new Date();
    if (session.state === 'idle') {
      session.state = 'active';
    }
    
    return true;
  }
  
  /**
   * Close session
   */
  async closeSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    session.state = 'closing';
    
    try {
      const transport = this.transports.get(session.transport);
      if (transport) {
        await transport.close(session);
      }
    } catch (error) {
      console.error(`Error closing session ${sessionId}:`, error);
    }
    
    this.sessions.delete(sessionId);
    this.emit('sessionClosed', session);
    
    console.log(`Session closed: ${sessionId}`);
    return true;
  }
  
  /**
   * Send message to session
   */
  async sendMessage(sessionId: string, message: any): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    const transport = this.transports.get(session.transport);
    if (!transport) {
      return false;
    }
    
    try {
      await transport.send(session, message);
      this.touchSession(sessionId);
      return true;
    } catch (error) {
      console.error(`Error sending message to session ${sessionId}:`, error);
      return false;
    }
  }
  
  /**
   * Register transport handler
   */
  registerTransport(transport: Transport): void {
    this.transports.set(transport.type, transport);
    console.log(`Transport registered: ${transport.type}`);
  }
  
  /**
   * Get all active sessions
   */
  getActiveSessions(): Session[] {
    return Array.from(this.sessions.values()).filter(
      session => session.state === 'active' || session.state === 'idle'
    );
  }
  
  /**
   * Get sessions by client type
   */
  getSessionsByClient(clientType: ClientType): Session[] {
    return Array.from(this.sessions.values()).filter(
      session => session.metadata.client === clientType
    );
  }
  
  /**
   * Get sessions by transport
   */
  getSessionsByTransport(transport: TransportType): Session[] {
    return Array.from(this.sessions.values()).filter(
      session => session.transport === transport
    );
  }
  
  /**
   * Get session statistics
   */
  getStats(): {
    total: number;
    active: number;
    idle: number;
    closing: number;
    byClient: Record<ClientType, number>;
    byTransport: Record<TransportType, number>;
  } {
    const sessions = Array.from(this.sessions.values());
    const stats = {
      total: sessions.length,
      active: 0,
      idle: 0,
      closing: 0,
      byClient: {} as Record<ClientType, number>,
      byTransport: {} as Record<TransportType, number>
    };
    
    for (const session of sessions) {
      // Count by state
      if (session.state === 'active') stats.active++;
      else if (session.state === 'idle') stats.idle++;
      else if (session.state === 'closing') stats.closing++;
      
      // Count by client
      const client = session.metadata.client;
      stats.byClient[client] = (stats.byClient[client] || 0) + 1;
      
      // Count by transport
      const transport = session.transport;
      stats.byTransport[transport] = (stats.byTransport[transport] || 0) + 1;
    }
    
    return stats;
  }
  
  /**
   * Start automatic cleanup of inactive sessions
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSessions();
    }, this.config.cleanup_interval);
  }
  
  /**
   * Stop automatic cleanup
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
  
  /**
   * Clean up inactive sessions
   */
  private async cleanupInactiveSessions(): Promise<void> {
    const now = Date.now();
    const timeout = this.config.session_timeout;
    const sessionsToClose: string[] = [];
    
    for (const [sessionId, session] of this.sessions) {
      const idle = now - session.lastActivity.getTime();
      
      if (idle > timeout) {
        if (session.state === 'active') {
          // Mark as idle first
          session.state = 'idle';
          console.log(`Session marked as idle: ${sessionId}`);
        } else if (session.state === 'idle' && idle > timeout * 2) {
          // Close after being idle for 2x timeout
          sessionsToClose.push(sessionId);
        } else if (session.state === 'connecting' && idle > 60000) {
          // Close stuck connections after 1 minute
          sessionsToClose.push(sessionId);
        }
      }
    }
    
    // Close identified sessions
    for (const sessionId of sessionsToClose) {
      await this.closeSession(sessionId);
    }
    
    if (sessionsToClose.length > 0) {
      console.log(`Cleaned up ${sessionsToClose.length} inactive sessions`);
    }
  }
  
  /**
   * Get default capabilities for client type
   */
  private getClientCapabilities(clientType: ClientType): string[] {
    switch (clientType) {
      case 'claude':
        return ['stdio', 'sse'];
      case 'opencode':
        return ['sse', 'rest', 'batch'];
      default:
        return ['rest', 'sse', 'websocket'];
    }
  }
  
  /**
   * Shutdown session manager
   */
  async shutdown(): Promise<void> {
    this.stopCleanup();
    
    const sessions = Array.from(this.sessions.keys());
    console.log(`Closing ${sessions.length} active sessions...`);
    
    await Promise.all(
      sessions.map(sessionId => this.closeSession(sessionId))
    );
    
    console.log('SessionManager shutdown complete');
  }
}