import { Session, Message } from '../types/index.js';
import { HTTPBridge } from '../bridge/HTTPBridge.js';
import { CommandRouter, CommandType } from '../commands/CommandRouter.js';
import { PlaneIntegration } from '../commands/PlaneIntegration.js';

export class MessageRouter {
  private commandRouter: CommandRouter;
  private planeIntegration?: PlaneIntegration;
  
  constructor(private httpBridge: HTTPBridge) {
    this.commandRouter = new CommandRouter();
  }
  
  /**
   * Route incoming message to appropriate handler
   */
  async handleMessage(session: Session, message: Message): Promise<any> {
    console.log(`Routing message from session ${session.id}:`, message.method);
    
    try {
      // Check if it's a command in completion request
      if (message.method === 'completion/complete' && message.params?.prompt) {
        const prompt = message.params.prompt;
        if (this.looksLikeCommand(prompt)) {
          return await this.handleCommand(session, message, prompt);
        }
      }
      
      switch (message.method) {
        case 'initialize':
          return await this.handleInitialize(session, message);
          
        case 'tools/list':
          return await this.handleToolsList(session, message);
          
        case 'tools/call':
          return await this.handleToolCall(session, message);
          
        case 'completion/complete':
          return await this.handleCompletion(session, message);
          
        case 'mosaic/help':
          return await this.handleHelp(session, message);
          
        case 'mosaic/status':
          return await this.handleStatus(session, message);
          
        default:
          // Forward unknown methods to backend
          return await this.forwardToBackend(session, message);
      }
    } catch (error) {
      console.error(`Error handling message:`, error);
      
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
  
  private looksLikeCommand(prompt: string): boolean {
    // Check for slash commands or known command patterns
    return prompt.startsWith('/') || 
           prompt.toLowerCase().includes('create project') ||
           prompt.toLowerCase().includes('list tasks') ||
           prompt.toLowerCase().includes('status') ||
           prompt.toLowerCase().includes('help');
  }
  
  private async handleCommand(session: Session, message: Message, prompt: string): Promise<any> {
    const command = this.commandRouter.parseCommand(prompt);
    console.log(`Parsed command:`, command);
    
    // Convert command to appropriate MCP message
    const mcpMessage = this.commandRouter.commandToMessage(command, message.id?.toString());
    
    // Handle special command types
    if (command.type === CommandType.HELP) {
      return await this.handleHelp(session, message);
    }
    
    if (command.type === CommandType.STATUS) {
      return await this.handleStatus(session, message);
    }
    
    if (command.type === CommandType.PLANE) {
      return await this.handlePlaneCommand(session, message, command);
    }
    
    // Route to appropriate handler
    return await this.handleMessage(session, mcpMessage);
  }
  
  private async handleInitialize(session: Session, message: Message): Promise<any> {
    // Get server info from backend
    const backendInfo = await this.httpBridge.sendMessage('orchestrator', {
      ...message,
      method: 'initialize'
    });
    
    // Merge with gateway info
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          completion: {},
          ...backendInfo?.result?.capabilities
        },
        serverInfo: {
          name: 'mcp-gateway',
          version: '0.0.2',
          backend: backendInfo?.result?.serverInfo
        }
      }
    };
  }
  
  private async handleToolsList(session: Session, message: Message): Promise<any> {
    const tools = await this.httpBridge.getTools();
    
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema || {
            type: 'object',
            properties: {},
            required: []
          }
        }))
      }
    };
  }
  
  private async handleToolCall(session: Session, message: Message): Promise<any> {
    const { name, arguments: args } = message.params || {};
    
    if (!name) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32602,
          message: 'Invalid params: missing tool name'
        }
      };
    }
    
    try {
      // Execute tool via bridge
      const result = await this.httpBridge.executeTool(name, args);
      
      return {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        }
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32000,
          message: `Tool execution failed: ${error}`
        }
      };
    }
  }
  
  private async handleCompletion(session: Session, message: Message): Promise<any> {
    // Forward completion requests to backend
    return await this.forwardToBackend(session, message);
  }
  
  private async forwardToBackend(session: Session, message: Message): Promise<any> {
    try {
      const response = await this.httpBridge.sendMessage('orchestrator', message);
      
      // If backend returned accepted, wait for async response
      if (response?.accepted) {
        // For SSE, the response will come through the event stream
        return null; // Don't send sync response
      }
      
      return response;
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32603,
          message: `Backend error: ${error}`
        }
      };
    }
  }
  
  private async handleHelp(session: Session, message: Message): Promise<any> {
    const helpText = this.commandRouter.getHelp();
    
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: {
        content: [
          {
            type: 'text',
            text: helpText
          }
        ]
      }
    };
  }
  
  private async handleStatus(session: Session, message: Message): Promise<any> {
    try {
      // Get current project status
      const projectStatus = await this.httpBridge.sendMessage('orchestrator', {
        jsonrpc: '2.0',
        id: Date.now().toString(),
        method: 'tools/call',
        params: {
          name: 'mosaic_project_status',
          arguments: {}
        }
      });
      
      // Get task statistics
      const taskList = await this.httpBridge.sendMessage('orchestrator', {
        jsonrpc: '2.0',
        id: Date.now().toString(),
        method: 'tools/call',
        params: {
          name: 'mosaic_task_list',
          arguments: { status: 'all' }
        }
      });
      
      // Format status response
      let statusText = '# MosAIc Status Report\n\n';
      
      if (projectStatus?.result) {
        statusText += `## Current Project\n${JSON.stringify(projectStatus.result, null, 2)}\n\n`;
      }
      
      if (taskList?.result) {
        statusText += `## Task Summary\n${JSON.stringify(taskList.result, null, 2)}\n`;
      }
      
      return {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          content: [
            {
              type: 'text',
              text: statusText
            }
          ]
        }
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          content: [
            {
              type: 'text',
              text: `Status check failed: ${error}`
            }
          ]
        }
      };
    }
  }
  
  private async handlePlaneCommand(session: Session, message: Message, command: any): Promise<any> {
    if (!this.planeIntegration) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32601,
          message: 'Plane integration not configured'
        }
      };
    }
    
    try {
      switch (command.action) {
        case 'create-issue':
          const issue = await this.planeIntegration.createIssue({
            name: command.args[0] || 'New Issue',
            description: command.args.slice(1).join(' ')
          });
          
          return {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: `Created Plane issue: ${issue.name} (${issue.id})`
                }
              ]
            }
          };
          
        case 'list-issues':
          const issues = await this.planeIntegration.listIssues({ limit: 10 });
          
          const issueList = issues.map(i => 
            `- ${i.name} (${i.state}) - ${i.id}`
          ).join('\n');
          
          return {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: `Plane Issues:\n${issueList}`
                }
              ]
            }
          };
          
        default:
          return {
            jsonrpc: '2.0',
            id: message.id,
            error: {
              code: -32602,
              message: `Unknown Plane action: ${command.action}`
            }
          };
      }
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32603,
          message: `Plane operation failed: ${error}`
        }
      };
    }
  }
  
  /**
   * Configure Plane integration
   */
  setPlaneIntegration(config: any): void {
    this.planeIntegration = new PlaneIntegration(config);
  }
}