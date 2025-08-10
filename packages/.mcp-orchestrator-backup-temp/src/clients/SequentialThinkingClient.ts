import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Logger } from '../utils/Logger';

export interface SequentialThinkingOptions {
  maxSteps?: number;
  temperature?: number;
  model?: string;
}

export interface SequentialThought {
  step: number;
  thought: string;
  action?: string | undefined;
  result?: string | undefined;
}

export interface SequentialThinkingResult {
  thoughts: SequentialThought[];
  finalAnswer: string;
  metadata?: {
    totalSteps: number;
    model: string;
    duration: number;
  };
}

/**
 * Client for interacting with Sequential Thinking MCP server
 */
export class SequentialThinkingClient {
  private client: Client | null = null;
  private logger: Logger;
  private isConnected = false;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Connect to Sequential Thinking MCP server
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      this.logger.info('Connecting to Sequential Thinking MCP server...');

      // Create transport
      const transport = new StdioClientTransport({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sequential-thinking']
      });

      // Create and connect client
      this.client = new Client({
        name: 'mosaic-mcp-orchestrator',
        version: '1.0.0'
      });

      await this.client.connect(transport);
      this.isConnected = true;

      this.logger.info('Connected to Sequential Thinking MCP server');

      // List available tools
      const tools = await this.client.listTools();
      this.logger.debug('Available Sequential Thinking tools:', tools);

    } catch (error) {
      this.logger.error('Failed to connect to Sequential Thinking server', error);
      throw error;
    }
  }

  /**
   * Disconnect from Sequential Thinking MCP server
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.close();
      this.isConnected = false;
      this.client = null;
      this.logger.info('Disconnected from Sequential Thinking MCP server');
    } catch (error) {
      this.logger.error('Error disconnecting from Sequential Thinking server', error);
    }
  }

  /**
   * Execute sequential thinking on a task
   */
  async think(
    task: string,
    options: SequentialThinkingOptions = {}
  ): Promise<SequentialThinkingResult> {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }

    const startTime = Date.now();

    try {
      this.logger.info('Executing sequential thinking', { task, options });

      // Call the sequential thinking tool
      const result = await this.client!.callTool({
        name: 'sequential_thinking',
        arguments: {
          task,
          max_steps: options.maxSteps || 10,
          temperature: options.temperature || 0.7,
          model: options.model || 'gpt-4'
        }
      });

      // Parse the result
      const thoughts = this.parseThoughts(result.content);
      const finalAnswer = this.extractFinalAnswer(result.content);

      const duration = Date.now() - startTime;

      return {
        thoughts,
        finalAnswer,
        metadata: {
          totalSteps: thoughts.length,
          model: options.model || 'gpt-4',
          duration
        }
      };

    } catch (error) {
      this.logger.error('Sequential thinking failed', error);
      throw error;
    }
  }

  /**
   * Parse thoughts from Sequential Thinking output
   */
  private parseThoughts(content: any): SequentialThought[] {
    const thoughts: SequentialThought[] = [];

    // Handle different content formats
    if (Array.isArray(content)) {
      // Array of thought objects
      return content.map((item, index) => ({
        step: index + 1,
        thought: item.thought || item.text || String(item),
        action: item.action,
        result: item.result
      }));
    } else if (typeof content === 'object' && content.thoughts) {
      // Object with thoughts array
      return this.parseThoughts(content.thoughts);
    } else if (typeof content === 'string') {
      // Parse string format
      const lines = content.split('\n');
      let currentStep = 0;
      let currentThought: Partial<SequentialThought> = {};

      for (const line of lines) {
        if (line.match(/^(Step|Thought)\s*\d+:/i)) {
          if (currentThought.thought) {
            thoughts.push({
              step: currentStep,
              thought: currentThought.thought,
              action: currentThought.action,
              result: currentThought.result
            });
          }
          currentStep++;
          currentThought = { thought: line.replace(/^(Step|Thought)\s*\d+:\s*/i, '') };
        } else if (line.match(/^Action:/i)) {
          currentThought.action = line.replace(/^Action:\s*/i, '');
        } else if (line.match(/^Result:/i)) {
          currentThought.result = line.replace(/^Result:\s*/i, '');
        } else if (currentThought.thought && line.trim()) {
          currentThought.thought += ' ' + line.trim();
        }
      }

      // Add last thought
      if (currentThought.thought) {
        thoughts.push({
          step: currentStep,
          thought: currentThought.thought || '',
          action: currentThought.action,
          result: currentThought.result
        });
      }
    }

    return thoughts;
  }

  /**
   * Extract final answer from Sequential Thinking output
   */
  private extractFinalAnswer(content: any): string {
    if (typeof content === 'object' && content.finalAnswer) {
      return content.finalAnswer;
    } else if (typeof content === 'object' && content.answer) {
      return content.answer;
    } else if (typeof content === 'string') {
      // Look for final answer pattern
      const finalAnswerMatch = content.match(/Final Answer:\s*(.+)/i);
      if (finalAnswerMatch && finalAnswerMatch[1]) {
        return finalAnswerMatch[1].trim();
      }
      // Return last non-empty line as fallback
      const lines = content.split('\n').filter(line => line.trim());
      return lines[lines.length - 1] || '';
    }
    return String(content);
  }

  /**
   * Check if client is connected
   */
  isClientConnected(): boolean {
    return this.isConnected;
  }
}