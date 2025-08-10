/**
 * @fileoverview Ollama text generation tool for MCP
 * @module @mosaicstack/mcp-ollama/tools
 */

import { z } from 'zod';
import { OllamaTool } from './OllamaTool.js';
import { 
  OllamaGenerateInputSchema,
  OllamaOperation,
  OllamaConfig
} from '../types/index.js';
import { AsyncResult, ServiceOperation } from '@mosaicstack/mcp-common';

/**
 * Tool for generating text completions using Ollama
 */
export class OllamaGenerateTool extends OllamaTool {
  constructor(config?: Partial<OllamaConfig>) {
    super('generate', config);
  }

  get name(): string {
    return 'ollama_generate';
  }

  get description(): string {
    return 'Generate text completions using Ollama models with support for structured outputs and streaming';
  }

  get inputSchema(): z.ZodObject<any, any, any, any, any> {
    return OllamaGenerateInputSchema;
  }

  /**
   * Execute the generation operation
   */
  protected async executeOperation(
    operation: ServiceOperation,
    args: z.infer<typeof OllamaGenerateInputSchema>
  ): AsyncResult<any> {
    const startTime = Date.now();
    
    try {
      // Validate connection
      const connected = await this.testConnection();
      if (!connected) {
        return this.createErrorResult(
          'CONNECTION_ERROR',
          'Failed to connect to Ollama',
          { endpoint: this.ollamaClient.getCurrentEndpoint() }
        );
      }

      // Determine model to use
      const model = args.model || this.getCurrentModel();
      
      // Check if model needs to be switched
      if (args.model && args.model !== this.getCurrentModel()) {
        const switchResult = await this.switchModel(args.model);
        if (!switchResult.success) {
          return switchResult;
        }
      }

      // Prepare options
      const options = {
        ...this.ollamaConfig.options,
        ...args.options,
        system: args.system,
        format: args.format,
        stream: args.stream ?? false
      };

      // Handle streaming vs non-streaming
      if (options.stream) {
        return await this.handleStreamingGeneration(model, args.prompt, options);
      } else {
        return await this.handleNonStreamingGeneration(model, args.prompt, options);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Generation failed', {
        error: error instanceof Error ? error.message : String(error),
        duration,
        args: this.sanitizeArgs(args)
      });
      
      return this.handleError(error, operation);
    }
  }

  /**
   * Handle non-streaming generation
   */
  private async handleNonStreamingGeneration(
    model: string,
    prompt: string,
    options: any
  ): AsyncResult<any> {
    const startTime = Date.now();
    
    try {
      const response = await this.ollamaClient.generate(model, prompt, options);
      const duration = Date.now() - startTime;
      
      // Record usage
      this.recordModelUsage(model, duration, true);
      
      // Parse JSON if format is set
      let output = response.response;
      if (options.format === 'json' || typeof options.format === 'object') {
        try {
          output = JSON.parse(response.response);
        } catch (parseError) {
          this.logger.warn('Failed to parse JSON response', {
            error: parseError instanceof Error ? parseError.message : String(parseError),
            response: response.response
          });
        }
      }
      
      return this.createSuccessResult({
        response: output,
        model: response.model,
        created_at: response.created_at,
        done_reason: response.done_reason,
        context: response.context,
        metrics: {
          total_duration: response.total_duration,
          load_duration: response.load_duration,
          prompt_eval_count: response.prompt_eval_count,
          prompt_eval_duration: response.prompt_eval_duration,
          eval_count: response.eval_count,
          eval_duration: response.eval_duration
        }
      }, {
        operation: OllamaOperation.GENERATE,
        duration,
        model
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordModelUsage(model, duration, false);
      throw error;
    }
  }

  /**
   * Handle streaming generation
   */
  private async handleStreamingGeneration(
    model: string,
    prompt: string,
    options: any
  ): AsyncResult<any> {
    const startTime = Date.now();
    const chunks: string[] = [];
    let finalResponse: any = null;
    
    try {
      const stream = this.ollamaClient.generateStream(model, prompt, options);
      
      for await (const chunk of stream) {
        chunks.push(chunk.response);
        
        if (chunk.done) {
          finalResponse = chunk;
          break;
        }
      }
      
      const duration = Date.now() - startTime;
      const fullResponse = chunks.join('');
      
      // Record usage
      this.recordModelUsage(model, duration, true);
      
      // Parse JSON if needed
      let output = fullResponse;
      if (options.format === 'json' || typeof options.format === 'object') {
        try {
          output = JSON.parse(fullResponse);
        } catch (parseError) {
          this.logger.warn('Failed to parse JSON response from stream', {
            error: parseError instanceof Error ? parseError.message : String(parseError),
            response: fullResponse
          });
        }
      }
      
      return this.createSuccessResult({
        response: output,
        model: model,
        created_at: finalResponse?.created_at || new Date().toISOString(),
        done_reason: finalResponse?.done_reason,
        context: finalResponse?.context,
        stream_info: {
          chunks_received: chunks.length,
          total_length: fullResponse.length
        },
        metrics: finalResponse ? {
          total_duration: finalResponse.total_duration,
          load_duration: finalResponse.load_duration,
          prompt_eval_count: finalResponse.prompt_eval_count,
          prompt_eval_duration: finalResponse.prompt_eval_duration,
          eval_count: finalResponse.eval_count,
          eval_duration: finalResponse.eval_duration
        } : undefined
      }, {
        operation: OllamaOperation.GENERATE,
        duration,
        model,
        streamed: true
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordModelUsage(model, duration, false);
      throw error;
    }
  }

  /**
   * Generate with specific format (convenience method)
   */
  async generateJSON(
    prompt: string,
    schema?: Record<string, any>,
    model?: string
  ): AsyncResult<any> {
    const args = {
      prompt,
      model,
      format: schema || 'json' as 'json' | Record<string, any>,
      stream: false
    };
    
    return await this.executeOperation(ServiceOperation.CREATE, args);
  }

  /**
   * Generate with system prompt (convenience method)
   */
  async generateWithSystem(
    prompt: string,
    system: string,
    model?: string
  ): AsyncResult<any> {
    const args = {
      prompt,
      system,
      model,
      stream: false
    };
    
    return await this.executeOperation(ServiceOperation.CREATE, args);
  }

  /**
   * Generate code (convenience method for code-specific generation)
   */
  async generateCode(
    prompt: string,
    language: string,
    model?: string
  ): AsyncResult<any> {
    const codePrompt = `Generate ${language} code for the following requirement:\n\n${prompt}\n\nProvide only the code without explanation.`;
    const codeModel = model || this.getBestModelForTask('code');
    
    const args = {
      prompt: codePrompt,
      model: codeModel,
      options: {
        temperature: 0.2, // Lower temperature for code generation
        top_p: 0.95
      },
      stream: false
    };
    
    return await this.executeOperation(ServiceOperation.CREATE, args);
  }

  /**
   * Generate with context continuation
   */
  async continueContext(
    prompt: string,
    _context: number[], // Context continuation not yet supported in current implementation
    model?: string
  ): AsyncResult<any> {
    const targetModel = model || this.getCurrentModel();
    
    try {
      const response = await this.ollamaClient.generate(targetModel, prompt, {
        ...this.ollamaConfig.options
        // context is not supported in current Ollama API options
      });
      
      return this.createSuccessResult({
        response: response.response,
        context: response.context,
        model: response.model
      }, {
        operation: OllamaOperation.GENERATE,
        continued: true
      });
    } catch (error) {
      return this.handleError(error, ServiceOperation.CREATE);
    }
  }
}