import { Request } from 'express';
import { ClientDetectionResult, ClientType, TransportType } from '../types/index.js';

export class ClientDetector {
  /**
   * Detect client type and preferred transport from request headers
   */
  static detect(req: Request): ClientDetectionResult {
    const userAgent = req.headers['user-agent'] || '';
    const accept = req.headers['accept'] || '';
    const upgrade = req.headers['upgrade'];
    
    // OpenCode detection (uses Bun runtime)
    if (userAgent.includes('Bun/')) {
      return {
        type: 'opencode',
        confidence: 0.95,
        transport: accept.includes('text/event-stream') ? 'sse' : 'rest',
        capabilities: ['sse', 'rest', 'batch']
      };
    }
    
    // Claude detection (typically no user-agent or contains Claude)
    if (userAgent.includes('Claude') || !userAgent.trim()) {
      return {
        type: 'claude',
        confidence: 0.90,
        transport: 'stdio', // Claude prefers stdio
        capabilities: ['stdio', 'sse']
      };
    }
    
    // Browser-based clients
    if (userAgent.includes('Mozilla/') || userAgent.includes('Chrome/')) {
      const transport: TransportType = upgrade === 'websocket' ? 'websocket' : 
                                     accept.includes('text/event-stream') ? 'sse' : 'rest';
      
      return {
        type: 'unknown',
        confidence: 0.7,
        transport,
        capabilities: ['websocket', 'sse', 'rest']
      };
    }
    
    // Feature-based detection
    let transport: TransportType = 'rest'; // Default
    const capabilities: string[] = ['rest'];
    
    if (accept.includes('text/event-stream')) {
      transport = 'sse';
      capabilities.unshift('sse');
    }
    
    if (upgrade === 'websocket') {
      transport = 'websocket';
      capabilities.unshift('websocket');
    }
    
    return {
      type: 'unknown',
      confidence: 0.5,
      transport,
      capabilities
    };
  }
  
  /**
   * Get fallback transport chain based on client capabilities
   */
  static getFallbackChain(detection: ClientDetectionResult): TransportType[] {
    const { type, capabilities } = detection;
    
    switch (type) {
      case 'opencode':
        return ['sse', 'rest'];
        
      case 'claude':
        return ['stdio', 'sse', 'rest'];
        
      default:
        // Order by preference and availability
        const chain: TransportType[] = [];
        
        if (capabilities.includes('websocket')) chain.push('websocket');
        if (capabilities.includes('sse')) chain.push('sse');
        if (capabilities.includes('rest')) chain.push('rest');
        
        return chain.length > 0 ? chain : ['rest'];
    }
  }
  
  /**
   * Check if client supports specific transport
   */
  static supportsTransport(detection: ClientDetectionResult, transport: TransportType): boolean {
    return detection.capabilities.includes(transport);
  }
}