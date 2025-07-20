import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

export interface EventNode {
  id: string;
  type: 'agent' | 'tool' | 'message' | 'system';
  name: string;
  timestamp: Date;
  metadata?: any;
}

export interface EventEdge {
  id: string;
  source: string;
  target: string;
  type: 'message' | 'call' | 'response' | 'spawn' | 'error';
  label: string;
  timestamp: Date;
  duration?: number;
  metadata?: any;
}

export interface EventSequence {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  nodes: EventNode[];
  edges: EventEdge[];
  status: 'active' | 'completed' | 'failed';
}

export class EventFlowVisualizer extends EventEmitter {
  private sequences: Map<string, EventSequence> = new Map();
  private nodes: Map<string, EventNode> = new Map();
  private edges: EventEdge[] = [];
  private recording: boolean = false;
  private startTime: Date = new Date();

  startRecording(): void {
    this.recording = true;
    this.startTime = new Date();
    this.sequences.clear();
    this.nodes.clear();
    this.edges = [];
    this.emit('recording-started');
  }

  stopRecording(): void {
    this.recording = false;
    this.emit('recording-stopped');
  }

  // Track agent lifecycle
  trackAgentRegistration(agentId: string, name: string, role: string): void {
    if (!this.recording) return;

    const node: EventNode = {
      id: agentId,
      type: 'agent',
      name: `${name} (${role})`,
      timestamp: new Date(),
      metadata: { role, capabilities: [] }
    };

    this.nodes.set(agentId, node);
    this.emit('node-added', node);
  }

  trackAgentMessage(from: string, to: string | null, content: any): void {
    if (!this.recording) return;

    const edgeId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Handle broadcast messages
    if (!to) {
      // Create a virtual broadcast node if needed
      const broadcastId = 'broadcast-node';
      if (!this.nodes.has(broadcastId)) {
        this.nodes.set(broadcastId, {
          id: broadcastId,
          type: 'system',
          name: 'Broadcast',
          timestamp: new Date()
        });
      }
      to = broadcastId;
    }

    const edge: EventEdge = {
      id: edgeId,
      source: from,
      target: to,
      type: 'message',
      label: content.type || 'message',
      timestamp: new Date(),
      metadata: content
    };

    this.edges.push(edge);
    this.emit('edge-added', edge);
  }

  trackToolCall(agentId: string, toolName: string, args: any, result?: any): void {
    if (!this.recording) return;

    // Create tool node if needed
    const toolId = `tool-${toolName}`;
    if (!this.nodes.has(toolId)) {
      this.nodes.set(toolId, {
        id: toolId,
        type: 'tool',
        name: toolName,
        timestamp: new Date()
      });
    }

    const edgeId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const edge: EventEdge = {
      id: edgeId,
      source: agentId,
      target: toolId,
      type: 'call',
      label: `call ${toolName}`,
      timestamp: new Date(),
      metadata: { args, result }
    };

    this.edges.push(edge);
    this.emit('edge-added', edge);

    // Add response edge if result exists
    if (result) {
      const responseEdge: EventEdge = {
        id: `resp-${edgeId}`,
        source: toolId,
        target: agentId,
        type: 'response',
        label: 'response',
        timestamp: new Date(),
        metadata: { result }
      };
      this.edges.push(responseEdge);
      this.emit('edge-added', responseEdge);
    }
  }

  trackSequence(sequenceId: string, name: string): EventSequence {
    const sequence: EventSequence = {
      id: sequenceId,
      name,
      startTime: new Date(),
      nodes: [],
      edges: [],
      status: 'active'
    };

    this.sequences.set(sequenceId, sequence);
    return sequence;
  }

  completeSequence(sequenceId: string, status: 'completed' | 'failed' = 'completed'): void {
    const sequence = this.sequences.get(sequenceId);
    if (sequence) {
      sequence.endTime = new Date();
      sequence.status = status;
    }
  }

  // Visualization exports
  exportToDOT(): string {
    let dot = 'digraph EventFlow {\n';
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=box, style=rounded];\n\n';

    // Define node styles
    dot += '  // Node styles\n';
    dot += '  node [shape=box, style="rounded,filled"];\n';
    
    // Add nodes
    dot += '\n  // Nodes\n';
    for (const [id, node] of this.nodes) {
      const color = this.getNodeColor(node.type);
      const shape = this.getNodeShape(node.type);
      dot += `  "${id}" [label="${node.name}", fillcolor="${color}", shape="${shape}"];\n`;
    }

    // Add edges
    dot += '\n  // Edges\n';
    for (const edge of this.edges) {
      const style = this.getEdgeStyle(edge.type);
      const color = this.getEdgeColor(edge.type);
      dot += `  "${edge.source}" -> "${edge.target}" [label="${edge.label}", style="${style}", color="${color}"];\n`;
    }

    dot += '}\n';
    return dot;
  }

  exportToMermaid(): string {
    let mermaid = 'graph LR\n';

    // Add nodes
    for (const [id, node] of this.nodes) {
      const shape = this.getMermaidShape(node.type);
      mermaid += `  ${id}${shape[0]}${node.name}${shape[1]}\n`;
    }

    // Add edges
    for (const edge of this.edges) {
      const arrow = this.getMermaidArrow(edge.type);
      mermaid += `  ${edge.source} ${arrow}|${edge.label}| ${edge.target}\n`;
    }

    return mermaid;
  }

  exportToJSON(): string {
    const data = {
      metadata: {
        startTime: this.startTime,
        endTime: new Date(),
        duration: Date.now() - this.startTime.getTime()
      },
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
      sequences: Array.from(this.sequences.values())
    };

    return JSON.stringify(data, null, 2);
  }

  exportToHTML(title: string = 'Event Flow Visualization'): string {
    const mermaidDiagram = this.exportToMermaid();
    
    return `<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-card {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #007bff;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .stat-label {
            color: #666;
            font-size: 14px;
        }
        #diagram {
            margin: 20px 0;
            padding: 20px;
            background-color: #fafafa;
            border-radius: 5px;
            overflow-x: auto;
        }
        .timeline {
            margin-top: 30px;
        }
        .event-item {
            padding: 10px;
            margin: 5px 0;
            background-color: #f8f9fa;
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
        }
        .event-time {
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">${this.nodes.size}</div>
                <div class="stat-label">Total Nodes</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.edges.length}</div>
                <div class="stat-label">Total Edges</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.sequences.size}</div>
                <div class="stat-label">Sequences</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.getAverageMessageRate().toFixed(2)}/s</div>
                <div class="stat-label">Avg Message Rate</div>
            </div>
        </div>
        
        <h2>Event Flow Diagram</h2>
        <div id="diagram" class="mermaid">
${mermaidDiagram}
        </div>
        
        <div class="timeline">
            <h2>Recent Events</h2>
            ${this.generateTimelineHTML()}
        </div>
    </div>
    
    <script>
        mermaid.initialize({ 
            startOnLoad: true,
            theme: 'default',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true
            }
        });
    </script>
</body>
</html>`;
  }

  // Analysis methods
  getNodeStatistics(): any {
    const stats: any = {
      totalNodes: this.nodes.size,
      byType: {},
      mostActive: null,
      isolated: []
    };

    // Count by type
    for (const node of this.nodes.values()) {
      stats.byType[node.type] = (stats.byType[node.type] || 0) + 1;
    }

    // Find most active node
    const edgeCount = new Map<string, number>();
    for (const edge of this.edges) {
      edgeCount.set(edge.source, (edgeCount.get(edge.source) || 0) + 1);
      edgeCount.set(edge.target, (edgeCount.get(edge.target) || 0) + 1);
    }

    let maxEdges = 0;
    for (const [nodeId, count] of edgeCount) {
      if (count > maxEdges) {
        maxEdges = count;
        stats.mostActive = {
          id: nodeId,
          name: this.nodes.get(nodeId)?.name,
          edgeCount: count
        };
      }
    }

    // Find isolated nodes
    for (const [nodeId, node] of this.nodes) {
      if (!edgeCount.has(nodeId)) {
        stats.isolated.push({ id: nodeId, name: node.name });
      }
    }

    return stats;
  }

  getMessagePatterns(): any {
    const patterns: any = {
      messageTypes: {},
      commonPaths: [],
      broadcastCount: 0,
      averageChainLength: 0
    };

    // Count message types
    for (const edge of this.edges) {
      if (edge.type === 'message') {
        const msgType = edge.metadata?.type || 'unknown';
        patterns.messageTypes[msgType] = (patterns.messageTypes[msgType] || 0) + 1;
        
        if (edge.target === 'broadcast-node') {
          patterns.broadcastCount++;
        }
      }
    }

    // Find common communication paths
    const pathCount = new Map<string, number>();
    for (const edge of this.edges) {
      const path = `${edge.source}->${edge.target}`;
      pathCount.set(path, (pathCount.get(path) || 0) + 1);
    }

    // Sort and get top paths
    patterns.commonPaths = Array.from(pathCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));

    return patterns;
  }

  getPerformanceMetrics(): any {
    if (this.edges.length === 0) {
      return { averageLatency: 0, throughput: 0 };
    }

    const duration = Date.now() - this.startTime.getTime();
    const throughput = (this.edges.length / duration) * 1000; // messages per second

    // Calculate average latency for request-response pairs
    const latencies: number[] = [];
    const responseEdges = this.edges.filter(e => e.type === 'response');
    
    for (const response of responseEdges) {
      const request = this.edges.find(e => 
        e.type === 'call' && 
        e.source === response.target && 
        e.target === response.source
      );
      
      if (request) {
        const latency = response.timestamp.getTime() - request.timestamp.getTime();
        latencies.push(latency);
      }
    }

    const averageLatency = latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;

    return {
      averageLatency,
      throughput,
      totalDuration: duration,
      messageCount: this.edges.length
    };
  }

  // Helper methods
  private getNodeColor(type: string): string {
    const colors: Record<string, string> = {
      agent: 'lightblue',
      tool: 'lightgreen',
      message: 'lightyellow',
      system: 'lightgray'
    };
    return colors[type] || 'white';
  }

  private getNodeShape(type: string): string {
    const shapes: Record<string, string> = {
      agent: 'box',
      tool: 'ellipse',
      message: 'note',
      system: 'diamond'
    };
    return shapes[type] || 'box';
  }

  private getEdgeStyle(type: string): string {
    const styles: Record<string, string> = {
      message: 'solid',
      call: 'dashed',
      response: 'dotted',
      spawn: 'bold',
      error: 'bold'
    };
    return styles[type] || 'solid';
  }

  private getEdgeColor(type: string): string {
    const colors: Record<string, string> = {
      message: 'black',
      call: 'blue',
      response: 'green',
      spawn: 'purple',
      error: 'red'
    };
    return colors[type] || 'black';
  }

  private getMermaidShape(type: string): [string, string] {
    const shapes: Record<string, [string, string]> = {
      agent: ['[', ']'],
      tool: ['(', ')'],
      message: ['[/', '/]'],
      system: ['{', '}']
    };
    return shapes[type] || ['[', ']'];
  }

  private getMermaidArrow(type: string): string {
    const arrows: Record<string, string> = {
      message: '-->',
      call: '-.->',
      response: '-.->',
      spawn: '==>',
      error: '--x'
    };
    return arrows[type] || '-->';
  }

  private getAverageMessageRate(): number {
    const duration = (Date.now() - this.startTime.getTime()) / 1000; // in seconds
    return duration > 0 ? this.edges.length / duration : 0;
  }

  private generateTimelineHTML(): string {
    const recentEvents = this.edges.slice(-10).reverse();
    
    return recentEvents.map(edge => {
      const sourceNode = this.nodes.get(edge.source);
      const targetNode = this.nodes.get(edge.target);
      
      return `
        <div class="event-item">
            <div>
                <strong>${sourceNode?.name || edge.source}</strong> → 
                <strong>${targetNode?.name || edge.target}</strong>: 
                ${edge.label}
            </div>
            <div class="event-time">${edge.timestamp.toLocaleTimeString()}</div>
        </div>
      `;
    }).join('');
  }

  // Export functionality
  saveVisualization(outputPath: string, format: 'html' | 'dot' | 'mermaid' | 'json' = 'html'): void {
    let content: string;
    let extension: string;

    switch (format) {
      case 'dot':
        content = this.exportToDOT();
        extension = '.dot';
        break;
      case 'mermaid':
        content = this.exportToMermaid();
        extension = '.mmd';
        break;
      case 'json':
        content = this.exportToJSON();
        extension = '.json';
        break;
      case 'html':
      default:
        content = this.exportToHTML();
        extension = '.html';
    }

    const filename = path.join(outputPath, `event-flow-${Date.now()}${extension}`);
    fs.writeFileSync(filename, content);
    
    this.emit('visualization-saved', { filename, format });
  }
}