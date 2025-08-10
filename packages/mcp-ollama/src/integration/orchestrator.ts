/**
 * @fileoverview Integration with MCP Orchestrator
 * @module @mosaicstack/mcp-ollama/integration
 */

import { OllamaGenerateTool } from '../tools/OllamaGenerateTool.js';
// import { OllamaCodeTool } from '../tools/OllamaCodeTool.js';
// import { OllamaModelTool } from '../tools/OllamaModelTool.js';
import { OllamaConfig } from '../types/index.js';

/**
 * Register Ollama tools with MCP Orchestrator
 */
export function registerOllamaTools(
  registerTool: (tool: any) => void,
  config?: Partial<OllamaConfig>
) {
  // Create tool instances
  const generateTool = new OllamaGenerateTool(config);
  // const codeTool = new OllamaCodeTool(config);
  // const modelTool = new OllamaModelTool(config);
  
  // Register each tool
  registerTool(generateTool);
  // registerTool(codeTool);
  // registerTool(modelTool);
  
  console.log('Ollama tools registered with MCP Orchestrator:');
  console.log('  - ollama_generate: Text generation with Ollama models');
  // console.log('  - ollama_code: Code generation with specialized models');
  // console.log('  - ollama_model: Model management operations');
  
  return {
    generate: generateTool,
    // code: codeTool,
    // model: modelTool
  };
}

/**
 * Create Ollama tool configurations for MCP server
 */
export function getOllamaToolConfigs() {
  return [
    {
      name: 'ollama_generate',
      description: 'Generate text completions using local Ollama models',
      category: 'generation',
      priority: 10
    },
    {
      name: 'ollama_code',
      description: 'Generate code using specialized Ollama models',
      category: 'code',
      priority: 10
    },
    {
      name: 'ollama_model',
      description: 'Manage Ollama models (list, switch, pull, delete)',
      category: 'management',
      priority: 5
    },
    {
      name: 'ollama_execute',
      description: 'Execute generated code in a sandboxed environment',
      category: 'execution',
      priority: 5
    },
    {
      name: 'ollama_optimize',
      description: 'Optimize code using Ollama models',
      category: 'optimization',
      priority: 5
    }
  ];
}

/**
 * Initialize Ollama for use with task processing
 */
export async function initializeOllamaForTasks(config?: Partial<OllamaConfig>) {
  const generateTool = new OllamaGenerateTool(config);
  
  // Test connection
  const connected = await generateTool.testConnection();
  if (!connected) {
    throw new Error('Failed to connect to Ollama. Please ensure Ollama is running.');
  }
  
  return {
    /**
     * Enhance task description using Ollama
     */
    async enhanceTaskDescription(description: string): Promise<string> {
      const result = await generateTool.call({
        prompt: `Enhance and clarify this task description, making it more specific and actionable:\n\n${description}\n\nEnhanced description:`,
        model: config?.models?.default,
        options: {
          temperature: 0.3,
          num_predict: 200
        }
      });
      
      return result.success ? result.data.response : description;
    },
    
    /**
     * Generate implementation code for a task
     */
    async generateTaskImplementation(task: {
      name: string;
      description: string;
      language: string;
    }): Promise<string> {
      const result = await generateTool.generateCode(
        `${task.name}: ${task.description}`,
        task.language
      );
      
      return result.success ? result.data : '';
    },
    
    /**
     * Review code for quality and suggest improvements
     */
    async reviewCode(code: string, language: string): Promise<{
      issues: string[];
      suggestions: string[];
      improved: string;
    }> {
      const result = await generateTool.call({
        prompt: `Review this ${language} code and provide:
1. List of issues or problems
2. Suggestions for improvement
3. An improved version of the code

Code:
\`\`\`${language}
${code}
\`\`\`

Response format: JSON with keys "issues", "suggestions", "improved"`,
        format: 'json',
        model: config?.models?.code || config?.models?.default,
        options: {
          temperature: 0.2
        }
      });
      
      if (result.success && typeof result.data.response === 'object') {
        return result.data.response;
      }
      
      return {
        issues: [],
        suggestions: [],
        improved: code
      };
    },
    
    /**
     * Generate tests for code
     */
    async generateTests(code: string, language: string): Promise<string> {
      const testFramework = {
        javascript: 'Jest',
        typescript: 'Jest',
        python: 'pytest',
        java: 'JUnit',
        go: 'testing package',
        rust: 'cargo test'
      }[language] || 'appropriate testing framework';
      
      const result = await generateTool.call({
        prompt: `Generate comprehensive unit tests for this ${language} code using ${testFramework}:

\`\`\`${language}
${code}
\`\`\`

Provide only the test code without explanation.`,
        model: config?.models?.code || config?.models?.default,
        options: {
          temperature: 0.2
        }
      });
      
      return result.success ? result.data.response : '';
    }
  };
}