import { Message } from '../types/index.js';

export interface Command {
  type: CommandType;
  action: string;
  args: string[];
  raw: string;
}

export enum CommandType {
  PROJECT = 'project',
  TASK = 'task',
  AGENT = 'agent',
  STATUS = 'status',
  HELP = 'help',
  COST = 'cost',
  PLANE = 'plane',
  UNKNOWN = 'unknown'
}

export class CommandRouter {
  private commandHandlers = new Map<CommandType, CommandHandler>();
  
  constructor() {
    this.registerDefaultHandlers();
  }
  
  /**
   * Parse natural language or command syntax into structured command
   */
  parseCommand(input: string): Command {
    const trimmed = input.trim();
    
    // Check if it's a slash command
    if (trimmed.startsWith('/')) {
      return this.parseSlashCommand(trimmed);
    }
    
    // Otherwise, parse natural language
    return this.parseNaturalLanguage(trimmed);
  }
  
  private parseSlashCommand(input: string): Command {
    const parts = input.slice(1).split(/\s+/);
    const [command, action, ...args] = parts;
    
    const type = this.getCommandType(command);
    
    return {
      type,
      action: action || 'help',
      args,
      raw: input
    };
  }
  
  private parseNaturalLanguage(input: string): Command {
    const lower = input.toLowerCase();
    
    // Project commands
    if (lower.includes('list projects') || lower.includes('show projects')) {
      return { type: CommandType.PROJECT, action: 'list', args: [], raw: input };
    }
    if (lower.includes('create project')) {
      const name = this.extractQuoted(input) || this.extractAfter(input, 'project');
      return { type: CommandType.PROJECT, action: 'create', args: name ? [name] : [], raw: input };
    }
    if (lower.includes('switch to project') || lower.includes('use project')) {
      const name = this.extractQuoted(input) || this.extractAfter(input, 'project');
      return { type: CommandType.PROJECT, action: 'switch', args: name ? [name] : [], raw: input };
    }
    
    // Task commands
    if (lower.includes('create task') || lower.includes('add task')) {
      const title = this.extractQuoted(input) || this.extractAfter(input, 'task');
      return { type: CommandType.TASK, action: 'create', args: title ? [title] : [], raw: input };
    }
    if (lower.includes('list tasks') || lower.includes('show tasks')) {
      return { type: CommandType.TASK, action: 'list', args: [], raw: input };
    }
    if (lower.includes('assign') && lower.includes('task')) {
      const parts = this.extractAssignment(input);
      return { type: CommandType.TASK, action: 'assign', args: parts, raw: input };
    }
    
    // Agent commands
    if (lower.includes('list agents') || lower.includes('show agents')) {
      return { type: CommandType.AGENT, action: 'list', args: [], raw: input };
    }
    if (lower.includes('spawn agent') || lower.includes('deploy agent')) {
      const persona = this.extractPersona(input);
      return { type: CommandType.AGENT, action: 'spawn', args: persona ? [persona] : [], raw: input };
    }
    
    // Plane commands
    if (lower.includes('plane') && (lower.includes('issue') || lower.includes('task'))) {
      if (lower.includes('create')) {
        const title = this.extractQuoted(input);
        return { type: CommandType.PLANE, action: 'create-issue', args: title ? [title] : [], raw: input };
      }
      if (lower.includes('list') || lower.includes('show')) {
        return { type: CommandType.PLANE, action: 'list-issues', args: [], raw: input };
      }
    }
    
    // Status command
    if (lower.includes('status') || lower.includes('progress')) {
      return { type: CommandType.STATUS, action: 'show', args: [], raw: input };
    }
    
    // Help command
    if (lower.includes('help') || input === '?') {
      return { type: CommandType.HELP, action: 'show', args: [], raw: input };
    }
    
    // Cost tracking
    if (lower.includes('cost') || lower.includes('token') || lower.includes('usage')) {
      return { type: CommandType.COST, action: 'show', args: [], raw: input };
    }
    
    // Default to unknown
    return { type: CommandType.UNKNOWN, action: 'process', args: [input], raw: input };
  }
  
  private getCommandType(command: string): CommandType {
    switch (command.toLowerCase()) {
      case 'project':
      case 'projects':
        return CommandType.PROJECT;
      case 'task':
      case 'tasks':
        return CommandType.TASK;
      case 'agent':
      case 'agents':
        return CommandType.AGENT;
      case 'status':
        return CommandType.STATUS;
      case 'help':
      case '?':
        return CommandType.HELP;
      case 'cost':
      case 'usage':
        return CommandType.COST;
      case 'plane':
        return CommandType.PLANE;
      default:
        return CommandType.UNKNOWN;
    }
  }
  
  private extractQuoted(input: string): string | null {
    const match = input.match(/"([^"]+)"|'([^']+)'/);
    return match ? (match[1] || match[2]) : null;
  }
  
  private extractAfter(input: string, keyword: string): string | null {
    const regex = new RegExp(`${keyword}\\s+([\\w\\s-]+)`, 'i');
    const match = input.match(regex);
    return match ? match[1].trim() : null;
  }
  
  private extractAssignment(input: string): string[] {
    const taskMatch = input.match(/task\s+(\w+)/i);
    const agentMatch = input.match(/to\s+([\w-]+)/i);
    
    const parts: string[] = [];
    if (taskMatch) parts.push(taskMatch[1]);
    if (agentMatch) parts.push(agentMatch[1]);
    
    return parts;
  }
  
  private extractPersona(input: string): string | null {
    // Look for persona patterns like BE-BACKEND-BENJAMIN
    const match = input.match(/\b([A-Z]{2,}-[A-Z]+-[A-Z]+)\b/);
    return match ? match[1] : null;
  }
  
  /**
   * Convert command to MCP message
   */
  commandToMessage(command: Command, id?: string): Message {
    const handler = this.commandHandlers.get(command.type);
    
    if (handler) {
      return handler.toMessage(command, id);
    }
    
    // Default message for unknown commands
    return {
      jsonrpc: '2.0',
      id: id || Date.now().toString(),
      method: 'completion/complete',
      params: {
        prompt: command.raw,
        max_tokens: 1000
      }
    };
  }
  
  /**
   * Register command handler
   */
  registerHandler(type: CommandType, handler: CommandHandler): void {
    this.commandHandlers.set(type, handler);
  }
  
  private registerDefaultHandlers(): void {
    // Project handler
    this.registerHandler(CommandType.PROJECT, {
      toMessage: (cmd, id) => ({
        jsonrpc: '2.0',
        id: id || Date.now().toString(),
        method: 'tools/call',
        params: {
          name: `mosaic_project_${cmd.action}`,
          arguments: this.buildProjectArgs(cmd)
        }
      })
    });
    
    // Task handler
    this.registerHandler(CommandType.TASK, {
      toMessage: (cmd, id) => ({
        jsonrpc: '2.0',
        id: id || Date.now().toString(),
        method: 'tools/call',
        params: {
          name: `mosaic_task_${cmd.action}`,
          arguments: this.buildTaskArgs(cmd)
        }
      })
    });
    
    // Agent handler
    this.registerHandler(CommandType.AGENT, {
      toMessage: (cmd, id) => ({
        jsonrpc: '2.0',
        id: id || Date.now().toString(),
        method: 'tools/call',
        params: {
          name: `mosaic_agent_${cmd.action}`,
          arguments: this.buildAgentArgs(cmd)
        }
      })
    });
    
    // Help handler
    this.registerHandler(CommandType.HELP, {
      toMessage: (cmd, id) => ({
        jsonrpc: '2.0',
        id: id || Date.now().toString(),
        method: 'mosaic/help',
        params: {}
      })
    });
    
    // Status handler
    this.registerHandler(CommandType.STATUS, {
      toMessage: (cmd, id) => ({
        jsonrpc: '2.0',
        id: id || Date.now().toString(),
        method: 'mosaic/status',
        params: {}
      })
    });
  }
  
  private buildProjectArgs(cmd: Command): any {
    switch (cmd.action) {
      case 'create':
        return { name: cmd.args[0], description: cmd.args.slice(1).join(' ') };
      case 'switch':
        return { name: cmd.args[0] };
      case 'list':
        return {};
      default:
        return { args: cmd.args };
    }
  }
  
  private buildTaskArgs(cmd: Command): any {
    switch (cmd.action) {
      case 'create':
        return { 
          title: cmd.args[0], 
          description: cmd.args.slice(1).join(' '),
          type: 'task'
        };
      case 'assign':
        return { 
          taskId: cmd.args[0], 
          agentId: cmd.args[1] 
        };
      case 'list':
        return { status: cmd.args[0] || 'all' };
      default:
        return { args: cmd.args };
    }
  }
  
  private buildAgentArgs(cmd: Command): any {
    switch (cmd.action) {
      case 'spawn':
        return { persona: cmd.args[0] };
      case 'list':
        return { status: 'active' };
      default:
        return { args: cmd.args };
    }
  }
  
  /**
   * Get help text for commands
   */
  getHelp(): string {
    return `
# MosAIc Command Reference

## Project Commands
- /project list - List all projects
- /project create "name" - Create new project
- /project switch "name" - Switch active project
- "list projects" - Natural language equivalent

## Task Commands  
- /task create "title" - Create new task
- /task list [status] - List tasks (all, pending, active, completed)
- /task assign <id> <agent> - Assign task to agent
- "create task called login system" - Natural language

## Agent Commands
- /agent list - List available agents
- /agent spawn <persona> - Deploy agent with persona
- "spawn agent BE-BACKEND-BENJAMIN" - Natural language

## Plane Integration
- /plane create-issue "title" - Create Plane issue
- /plane list-issues - List Plane issues
- "create plane issue for bug fix" - Natural language

## Other Commands
- /status - Show current project status
- /cost - Show token usage and costs
- /help - Show this help message

## Examples
1. Create and assign task:
   /task create "Implement user authentication"
   /task assign TASK-001 BE-BACKEND-BENJAMIN

2. Natural language:
   "Create a new project called MosAIc v2"
   "Show me all active tasks"
   "What's the current status?"
`;
  }
}

interface CommandHandler {
  toMessage(command: Command, id?: string): Message;
}