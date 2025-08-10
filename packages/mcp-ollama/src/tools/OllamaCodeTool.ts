import { z } from 'zod';
import { OllamaTool } from './OllamaTool.js';
import { 
  OllamaGenerateParams, 
  CodeGenerationRequest, 
  CodeGenerationResult
} from '../types/index.js';

/**
 * Specialized tool for code generation and code-related tasks using Ollama
 * Optimized for programming tasks with context-aware responses
 */
export class OllamaCodeTool extends OllamaTool {
  readonly name = 'ollama_code_generate';
  readonly toolName = 'ollama_code_generate';
  readonly description = 'Generate, review, or analyze code using Ollama models optimized for programming tasks';

  // Schema for code generation requests
  readonly inputSchema = z.object({
    task: z.enum([
      'generate',      // Generate new code
      'review',        // Review existing code
      'refactor',      // Refactor/improve code
      'debug',         // Debug and fix code
      'explain',       // Explain how code works
      'optimize',      // Optimize code performance
      'test',          // Generate test cases
      'document'       // Generate documentation
    ]).describe('Type of code-related task to perform'),
    
    language: z.string().optional().describe('Programming language (e.g., python, javascript, typescript, rust)'),
    
    prompt: z.string().describe('Detailed description of what you want to accomplish'),
    
    code: z.string().optional().describe('Existing code to work with (for review, refactor, debug, etc.)'),
    
    context: z.object({
      framework: z.string().optional().describe('Framework or library context (e.g., React, Express, FastAPI)'),
      style: z.string().optional().describe('Code style preferences (e.g., functional, OOP, minimal)'),
      requirements: z.array(z.string()).optional().describe('Specific requirements or constraints'),
      examples: z.string().optional().describe('Example code or patterns to follow')
    }).optional().describe('Additional context to guide code generation'),
    
    options: z.object({
      model: z.string().optional().describe('Specific model to use (defaults to best code model)'),
      temperature: z.number().min(0).max(1).optional().describe('Creativity level (0-1, default varies by task)'),
      maxLength: z.number().optional().describe('Maximum response length in tokens'),
      includeComments: z.boolean().optional().describe('Include explanatory comments in generated code'),
      includeTests: z.boolean().optional().describe('Include example usage or tests'),
      optimizeForSpeed: z.boolean().optional().describe('Optimize for faster response times')
    }).optional().describe('Generation options')
  });

  // Task-specific model and parameter configurations
  private readonly taskConfigs = {
    generate: {
      defaultModel: 'gpt-oss',
      temperature: 0.2,
      systemPrompt: 'You are a skilled programmer. Generate clean, efficient, well-commented code. Follow best practices and include error handling where appropriate.',
      maxTokens: 400
    },
    review: {
      defaultModel: 'gpt-oss',
      temperature: 0.1,
      systemPrompt: 'You are a senior code reviewer. Analyze the code for bugs, security issues, performance problems, and style improvements. Provide constructive feedback.',
      maxTokens: 300
    },
    refactor: {
      defaultModel: 'gpt-oss',
      temperature: 0.15,
      systemPrompt: 'You are an expert at code refactoring. Improve code structure, readability, and maintainability while preserving functionality.',
      maxTokens: 400
    },
    debug: {
      defaultModel: 'gpt-oss',
      temperature: 0.1,
      systemPrompt: 'You are a debugging expert. Identify the problem, explain why it occurs, and provide a clear fix with explanation.',
      maxTokens: 250
    },
    explain: {
      defaultModel: 'gpt-oss',
      temperature: 0.1,
      systemPrompt: 'You are a programming teacher. Explain code clearly and concisely, breaking down complex concepts into understandable parts.',
      maxTokens: 300
    },
    optimize: {
      defaultModel: 'gpt-oss',
      temperature: 0.2,
      systemPrompt: 'You are a performance optimization expert. Analyze code for efficiency improvements, suggesting specific optimizations with reasoning.',
      maxTokens: 350
    },
    test: {
      defaultModel: 'gpt-oss',
      temperature: 0.2,
      systemPrompt: 'You are a testing expert. Generate comprehensive, realistic test cases that cover edge cases and common scenarios.',
      maxTokens: 400
    },
    document: {
      defaultModel: 'gpt-oss',
      temperature: 0.1,
      systemPrompt: 'You are a technical writer. Generate clear, comprehensive documentation with proper formatting and examples.',
      maxTokens: 350
    }
  };

  protected async executeOperation(params: any): Promise<CodeGenerationResult> {
    const request = this.inputSchema.parse(params);
    
    try {
      // Get task-specific configuration
      const taskConfig = this.taskConfigs[request.task];
      const model = request.options?.model || taskConfig.defaultModel;
      
      // Build context-aware prompt
      const fullPrompt = this.buildCodePrompt(request, taskConfig);
      
      // Configure generation parameters based on task and options
      const generateParams: OllamaGenerateParams = {
        model,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: request.options?.temperature ?? taskConfig.temperature,
          num_predict: request.options?.maxLength ?? taskConfig.maxTokens,
          top_k: request.options?.optimizeForSpeed ? 10 : 20,
          top_p: request.options?.optimizeForSpeed ? 0.7 : 0.8,
          num_ctx: this.calculateContextSize(request),
          repeat_penalty: 1.05,
          stop: ['</code>', '```\n\n', '\n\n---']
        }
      };

      // Execute generation with retry logic  
      const response = await (this as any).executeWithRetry(async () => {
        return await (this as any).client.generate(generateParams);
      });

      if (!response.success) {
        throw new Error(`Code generation failed: ${response.error}`);
      }

      // Process and structure the response
      const result = this.processCodeResponse(response.data!, request);
      
      // Log successful generation
      this.logger.info('Code generation completed', {
        task: request.task,
        language: request.language,
        model,
        responseTime: response.data!.total_duration ? Math.round(response.data!.total_duration / 1000000) : undefined,
        tokens: response.data!.eval_count
      });

      return result;

    } catch (error) {
      this.logger.error('Code generation error', { 
        error: error instanceof Error ? error.message : String(error),
        task: request.task,
        language: request.language
      });
      
      throw error;
    }
  }

  /**
   * Build a comprehensive prompt for code generation tasks
   */
  private buildCodePrompt(request: CodeGenerationRequest, taskConfig: any): string {
    const parts: string[] = [];
    
    // Add system context
    parts.push(taskConfig.systemPrompt);
    
    // Add language-specific context
    if (request.language) {
      parts.push(`\nLanguage: ${request.language}`);
    }
    
    // Add framework context
    if (request.context?.framework) {
      parts.push(`Framework/Library: ${request.context.framework}`);
    }
    
    // Add style preferences
    if (request.context?.style) {
      parts.push(`Code Style: ${request.context.style}`);
    }
    
    // Add requirements
    if (request.context?.requirements && request.context.requirements.length > 0) {
      parts.push(`\nRequirements:\n${request.context.requirements.map(req => `- ${req}`).join('\n')}`);
    }
    
    // Add examples if provided
    if (request.context?.examples) {
      parts.push(`\nExample/Pattern to follow:\n${request.context.examples}`);
    }
    
    // Add existing code for review/refactor/debug tasks
    if (request.code && ['review', 'refactor', 'debug', 'explain', 'optimize'].includes(request.task)) {
      parts.push(`\nCode to ${request.task}:\n\`\`\`${request.language || ''}\n${request.code}\n\`\`\``);
    }
    
    // Add the main task prompt
    parts.push(`\nTask: ${request.prompt}`);
    
    // Add specific instructions based on options
    const instructions: string[] = [];
    
    if (request.options?.includeComments !== false) {
      instructions.push('Include clear comments explaining the code');
    }
    
    if (request.options?.includeTests) {
      instructions.push('Include example usage or test cases');
    }
    
    if (request.task === 'generate') {
      instructions.push('Generate complete, working code');
      instructions.push('Include error handling where appropriate');
    }
    
    if (request.task === 'review') {
      instructions.push('Focus on bugs, security, performance, and style');
      instructions.push('Provide specific, actionable feedback');
    }
    
    if (request.task === 'debug') {
      instructions.push('Identify the exact problem and provide a clear fix');
      instructions.push('Explain why the issue occurs');
    }
    
    if (instructions.length > 0) {
      parts.push(`\nInstructions:\n${instructions.map(inst => `- ${inst}`).join('\n')}`);
    }
    
    // Format response requirements
    parts.push('\nProvide your response in a clear, structured format. Use code blocks with appropriate language tags.');
    
    return parts.join('\n');
  }

  /**
   * Calculate appropriate context size based on request complexity
   */
  private calculateContextSize(request: CodeGenerationRequest): number {
    let baseSize = 2048; // Base context
    
    // Increase for complex tasks
    if (['refactor', 'optimize', 'review'].includes(request.task)) {
      baseSize += 1024;
    }
    
    // Increase if code is provided
    if (request.code && request.code.length > 500) {
      baseSize += Math.min(2048, Math.floor(request.code.length / 2));
    }
    
    // Increase for complex context
    if (request.context?.requirements && request.context.requirements.length > 3) {
      baseSize += 512;
    }
    
    // Cap at reasonable maximum
    return Math.min(baseSize, 8192);
  }

  /**
   * Process and structure the code generation response
   */
  private processCodeResponse(response: any, request: CodeGenerationRequest): CodeGenerationResult {
    const text = response.response || '';
    
    // Extract code blocks
    const codeBlocks = this.extractCodeBlocks(text);
    
    // Extract main code (largest block or first block)
    const mainCode = codeBlocks.length > 0 
      ? codeBlocks.reduce((longest, current) => 
          current.code.length > longest.code.length ? current : longest
        ).code
      : '';
    
    // Extract explanation (text outside code blocks)
    const explanation = text
      .replace(/```[\s\S]*?```/g, '[CODE_BLOCK]')
      .replace(/\[CODE_BLOCK\]/g, '')
      .trim();
    
    // Determine success based on response quality
    const hasCode = mainCode.length > 0;
    const hasExplanation = explanation.length > 10;
    const success = request.task === 'explain' ? hasExplanation : hasCode;
    
    return {
      success,
      task: request.task,
      language: request.language || this.detectLanguage(mainCode),
      code: mainCode,
      explanation,
      codeBlocks,
      metadata: {
        model: response.model,
        tokens: response.eval_count || 0,
        duration: response.total_duration ? Math.round(response.total_duration / 1000000) : 0,
        promptTokens: response.prompt_eval_count || 0
      }
    };
  }

  /**
   * Extract code blocks from response text
   */
  private extractCodeBlocks(text: string): Array<{language: string; code: string}> {
    const blocks: Array<{language: string; code: string}> = [];
    const regex = /```(\w+)?\n?([\s\S]*?)```/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      blocks.push({
        language: match[1] || 'text',
        code: match[2].trim()
      });
    }
    
    return blocks;
  }

  /**
   * Detect programming language from code content
   */
  private detectLanguage(code: string): string {
    if (!code.trim()) return 'text';
    
    // Simple language detection based on common patterns
    const patterns = [
      { lang: 'python', patterns: ['def ', 'import ', 'from ', ':', '__init__'] },
      { lang: 'javascript', patterns: ['function', 'const ', 'let ', 'var ', '=>', '.js'] },
      { lang: 'typescript', patterns: ['interface', 'type ', ': string', ': number', '.ts'] },
      { lang: 'rust', patterns: ['fn ', 'let mut', 'impl', 'struct', '::'] },
      { lang: 'go', patterns: ['func ', 'package ', 'import (', ':=', 'fmt.'] },
      { lang: 'java', patterns: ['public class', 'private ', 'public static', 'import java'] },
      { lang: 'cpp', patterns: ['#include', 'std::', 'int main', 'cout', 'endl'] },
      { lang: 'sql', patterns: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE'] }
    ];
    
    const lowerCode = code.toLowerCase();
    
    for (const { lang, patterns } of patterns) {
      if (patterns.some(pattern => lowerCode.includes(pattern.toLowerCase()))) {
        return lang;
      }
    }
    
    return 'text';
  }

  /**
   * Generate code with streaming support
   */
  async generateCodeStream(params: any): Promise<AsyncIterableIterator<string>> {
    const request = this.inputSchema.parse(params);
    const taskConfig = this.taskConfigs[request.task];
    const model = request.options?.model || taskConfig.defaultModel;
    
    const fullPrompt = this.buildCodePrompt(request, taskConfig);
    
    const generateParams: OllamaGenerateParams = {
      model,
      prompt: fullPrompt,
      stream: true,
      options: {
        temperature: request.options?.temperature ?? taskConfig.temperature,
        num_predict: request.options?.maxLength ?? taskConfig.maxTokens,
        top_k: request.options?.optimizeForSpeed ? 10 : 20,
        top_p: request.options?.optimizeForSpeed ? 0.7 : 0.8,
        num_ctx: this.calculateContextSize(request)
      }
    };

    return (this as any).client.generateStream(generateParams);
  }
}