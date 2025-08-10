import { z } from 'zod';
import { OllamaTool } from './OllamaTool.js';
import { OllamaGenerateParams } from '../types/index.js';
import { ServiceOperation, AsyncResult } from '@mosaicstack/mcp-common';

/**
 * Simplified Ollama tool for immediate use
 * Handles basic text generation and code tasks
 */
export class OllamaSimpleTool extends OllamaTool {
  readonly name = 'ollama_generate';
  
  // Schema for simple generation requests
  readonly inputSchema = z.object({
    prompt: z.string().describe('The prompt for text generation'),
    model: z.string().optional().describe('Specific model to use'),
    task_type: z.enum(['text', 'code', 'review', 'explain']).optional().describe('Type of task'),
    language: z.string().optional().describe('Programming language for code tasks'),
    config: z.enum(['ultra_fast', 'development', 'comprehensive']).optional().describe('Performance configuration'),
    options: z.object({
      temperature: z.number().min(0).max(1).optional(),
      max_tokens: z.number().optional(),
      stream: z.boolean().optional()
    }).optional().describe('Generation options')
  });

  protected async executeOperation(operation: ServiceOperation, args: any): AsyncResult<any> {
    const request = this.inputSchema.parse(args);
    
    try {
      // Select configuration based on task type and preference
      const config = this.selectConfig(request.task_type, request.config);
      const model = request.model || 'gpt-oss';
      
      // Build context-aware prompt
      const enhancedPrompt = this.enhancePrompt(request);
      
      const generateParams: OllamaGenerateParams = {
        model,
        prompt: enhancedPrompt,
        stream: request.options?.stream || false,
        options: {
          temperature: request.options?.temperature || config.temperature,
          num_predict: request.options?.max_tokens || config.num_predict,
          top_k: config.top_k,
          top_p: config.top_p,
          num_ctx: config.num_ctx,
          repeat_penalty: config.repeat_penalty
        }
      };

      // Use the client to generate response
      const client = (this as any).ollamaClient;
      if (!client) {
        throw new Error('Ollama client not initialized');
      }

      const response = await client.generate(generateParams);
      
      if (!response.success) {
        throw new Error(`Generation failed: ${response.error}`);
      }

      return {
        success: true,
        data: {
          response: response.data?.response || '',
          model: model,
          config: request.config || 'auto',
          task_type: request.task_type || 'text',
          metadata: {
            tokens: response.data?.eval_count || 0,
            duration: response.data?.total_duration ? Math.round(response.data.total_duration / 1000000) : 0,
            prompt_tokens: response.data?.prompt_eval_count || 0
          }
        }
      };

    } catch (error) {
      this.logger.error('Ollama generation failed', {
        error: error instanceof Error ? error.message : String(error),
        task_type: request.task_type,
        model: request.model
      });
      
      return {
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: error instanceof Error ? error.message : String(error),
          details: { task_type: request.task_type, model: request.model }
        }
      };
    }
  }

  /**
   * Select optimal configuration based on task type and preference
   */
  private selectConfig(taskType?: string, preference?: string) {
    const configs = {
      ultra_fast: {
        temperature: 0.1,
        num_predict: 50,
        top_k: 10,
        top_p: 0.7,
        num_ctx: 1024,
        repeat_penalty: 1.0
      },
      development: {
        temperature: 0.2,
        num_predict: 80,
        top_k: 15,
        top_p: 0.75,
        num_ctx: 1536,
        repeat_penalty: 1.05
      },
      comprehensive: {
        temperature: 0.2,
        num_predict: 150,
        top_k: 20,
        top_p: 0.8,
        num_ctx: 2048,
        repeat_penalty: 1.05
      }
    };

    // Use preference if provided
    if (preference && preference in configs) {
      return configs[preference as keyof typeof configs];
    }

    // Auto-select based on task type
    switch (taskType) {
      case 'code':
      case 'review':
        return configs.development;
      case 'explain':
        return configs.comprehensive;
      default:
        return configs.ultra_fast;
    }
  }

  /**
   * Enhance prompt based on task type and context
   */
  private enhancePrompt(request: any): string {
    let prompt = request.prompt;
    
    // Add task-specific context
    if (request.task_type === 'code' && request.language) {
      prompt = `Generate ${request.language} code for the following request:\n${prompt}\n\nProvide clean, working code with appropriate comments.`;
    } else if (request.task_type === 'review') {
      prompt = `Review the following code and provide feedback on bugs, performance, and best practices:\n${prompt}`;
    } else if (request.task_type === 'explain') {
      prompt = `Explain the following in clear, understandable terms:\n${prompt}`;
    }
    
    return prompt;
  }
}