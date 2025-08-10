/**
 * @fileoverview Main entry point for Ollama MCP integration
 * @module @mosaicstack/mcp-ollama
 */

// Export client components
export { OllamaClient } from './client/OllamaClient.js';
export { ModelManager } from './client/ModelManager.js';

// Export base tool
export { OllamaTool } from './tools/OllamaTool.js';

// Export specific tools
export { OllamaGenerateTool } from './tools/OllamaGenerateTool.js';
// export { OllamaCodeTool } from './tools/OllamaCodeTool.js';
// export { OllamaModelTool } from './tools/OllamaModelTool.js';

// Export services
// export { CodeExecutionService } from './services/CodeExecutionService.js';
// export { GenerationService } from './services/GenerationService.js';
// export { CacheService } from './services/CacheService.js';

// Export types
export * from './types/index.js';

// Export integration helpers
export { 
  registerOllamaTools, 
  getOllamaToolConfigs,
  initializeOllamaForTasks 
} from './integration/orchestrator.js';

// Export default configuration
export const defaultConfig = require('./config/default.json');

/**
 * Create and configure all Ollama tools for MCP integration
 */
export function createOllamaTools(config?: Partial<import('./types/index.js').OllamaConfig>) {
  const { OllamaGenerateTool } = require('./tools/OllamaGenerateTool.js');
  return {
    generate: new OllamaGenerateTool(config),
    // code: new OllamaCodeTool(config),
    // model: new OllamaModelTool(config),
  };
}

/**
 * Initialize Ollama MCP integration
 */
export async function initializeOllamaMCP(config?: Partial<import('./types/index.js').OllamaConfig>) {
  const tools = createOllamaTools(config);
  
  // Test connection
  const connected = await tools.generate.testConnection();
  
  if (!connected) {
    throw new Error('Failed to connect to Ollama. Please ensure Ollama is running.');
  }
  
  return {
    tools,
    client: (tools.generate as any).ollamaClient,
    modelManager: (tools.generate as any).modelManager
  };
}