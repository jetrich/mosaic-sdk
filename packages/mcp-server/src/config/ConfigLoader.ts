import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { z } from 'zod';
import * as yaml from 'js-yaml';
import { MCPServerConfig, ConfigurationError } from '../types';

// Zod schema for configuration validation
const ToolConfigSchema = z.object({
  enabled: z.boolean(),
  namespace: z.string(),
  rate_limit: z.number().optional(),
  permissions: z.array(z.string()).optional()
});

const MCPServerConfigSchema = z.object({
  server: z.object({
    name: z.string(),
    version: z.string(),
    description: z.string()
  }),
  transport: z.object({
    type: z.enum(['stdio', 'sse', 'websocket']),
    port: z.number().optional(),
    host: z.string().optional(),
    timeout: z.number()
  }),
  tools: z.object({
    task_management: ToolConfigSchema,
    project_coordination: ToolConfigSchema,
    agent_orchestration: ToolConfigSchema
  }),
  storage: z.object({
    type: z.enum(['sqlite', 'postgresql']),
    connection_string: z.string(),
    migrations_path: z.string(),
    backup_enabled: z.boolean(),
    backup_interval: z.string()
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']),
    file: z.string().optional(),
    console: z.boolean(),
    structured: z.boolean()
  }),
  security: z.object({
    max_concurrent_tools: z.number(),
    tool_timeout: z.number(),
    rate_limiting: z.object({
      enabled: z.boolean(),
      requests_per_minute: z.number()
    })
  })
});

export class ConfigLoader {
  private static readonly DEFAULT_CONFIG: MCPServerConfig = {
    server: {
      name: 'mosaic-mcp-orchestrator',
      version: '1.0.0',
      description: 'MosAIc Stack MCP orchestrator for OpenCode integration'
    },
    transport: {
      type: 'stdio',
      timeout: 30000
    },
    tools: {
      task_management: {
        enabled: true,
        namespace: 'mosaic_task',
        rate_limit: 60
      },
      project_coordination: {
        enabled: true,
        namespace: 'mosaic_project',
        rate_limit: 30
      },
      agent_orchestration: {
        enabled: true,
        namespace: 'mosaic_agent',
        rate_limit: 10
      }
    },
    storage: {
      type: 'sqlite',
      connection_string: '~/.mosaic/data/mcp.db',
      migrations_path: './migrations',
      backup_enabled: true,
      backup_interval: '1h'
    },
    logging: {
      level: 'info',
      file: '~/.mosaic/logs/mcp.log',
      console: false,
      structured: true
    },
    security: {
      max_concurrent_tools: 5,
      tool_timeout: 300000,
      rate_limiting: {
        enabled: true,
        requests_per_minute: 100
      }
    }
  };

  static async load(configPath: string): Promise<MCPServerConfig> {
    try {
      const resolvedPath = this.resolvePath(configPath);
      
      // Check if file exists
      try {
        await fs.access(resolvedPath);
      } catch {
        throw new ConfigurationError(`Configuration file not found: ${resolvedPath}`);
      }

      // Read file content
      const content = await fs.readFile(resolvedPath, 'utf-8');
      
      // Parse based on file extension
      let config: any;
      const ext = path.extname(resolvedPath).toLowerCase();
      
      switch (ext) {
        case '.json':
          config = JSON.parse(content);
          break;
        case '.yaml':
        case '.yml':
          config = yaml.load(content);
          break;
        default:
          // Try JSON first, then YAML
          try {
            config = JSON.parse(content);
          } catch {
            config = yaml.load(content);
          }
      }

      // Merge with defaults before validation
      const mergedConfig = this.mergeWithDefaults(config);

      // Validate configuration
      const result = MCPServerConfigSchema.safeParse(mergedConfig);
      if (!result.success) {
        throw new ConfigurationError(
          'Invalid configuration format',
          result.error.issues
        );
      }

      // Resolve paths in configuration
      const resolvedConfig = this.resolvePaths(result.data);
      
      return resolvedConfig;
    } catch (error) {
      if (error instanceof ConfigurationError) {
        throw error;
      }
      throw new ConfigurationError(`Failed to load configuration: ${(error as Error).message}`, error);
    }
  }

  static async createDefault(configPath: string): Promise<void> {
    try {
      const resolvedPath = this.resolvePath(configPath);
      const dir = path.dirname(resolvedPath);
      
      // Create directory if it doesn't exist
      await fs.mkdir(dir, { recursive: true });
      
      // Create logs directory
      const logsDir = this.resolvePath('~/.mosaic/logs');
      await fs.mkdir(logsDir, { recursive: true });
      
      // Create data directory
      const dataDir = this.resolvePath('~/.mosaic/data');
      await fs.mkdir(dataDir, { recursive: true });
      
      // Write default configuration
      const content = JSON.stringify(this.DEFAULT_CONFIG, null, 2);
      await fs.writeFile(resolvedPath, content, 'utf-8');
      
    } catch (error) {
      throw new ConfigurationError(`Failed to create default configuration: ${(error as Error).message}`, error);
    }
  }

  static getDefault(): MCPServerConfig {
    return { ...this.DEFAULT_CONFIG };
  }

  private static resolvePath(filePath: string): string {
    if (filePath.startsWith('~/')) {
      return path.join(os.homedir(), filePath.slice(2));
    }
    return path.resolve(filePath);
  }

  private static resolvePaths(config: any): MCPServerConfig {
    return {
      ...config,
      storage: {
        ...config.storage,
        connection_string: this.resolvePath(config.storage.connection_string),
        migrations_path: this.resolvePath(config.storage.migrations_path)
      },
      logging: {
        level: config.logging.level,
        console: config.logging.console,
        structured: config.logging.structured,
        ...(config.logging.file && { file: this.resolvePath(config.logging.file) })
      }
    };
  }

  static mergeWithDefaults(config: Partial<MCPServerConfig>): MCPServerConfig {
    // Deep merge with defaults - config values should override defaults
    const merged: any = JSON.parse(JSON.stringify(this.DEFAULT_CONFIG));
    
    // Helper function to deep merge objects
    const deepMerge = (target: any, source: any) => {
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          if (source[key] !== null && source[key] !== undefined) {
            if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
              if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {};
              }
              deepMerge(target[key], source[key]);
            } else {
              // Override default with provided value
              target[key] = source[key];
            }
          }
        }
      }
    };
    
    deepMerge(merged, config);
    return merged;
  }

  static validate(config: any): void {
    const result = MCPServerConfigSchema.safeParse(config);
    if (!result.success) {
      throw new ConfigurationError(
        'Invalid configuration format',
        result.error.issues
      );
    }
  }

  static async exists(configPath: string): Promise<boolean> {
    try {
      const resolvedPath = this.resolvePath(configPath);
      await fs.access(resolvedPath);
      return true;
    } catch {
      return false;
    }
  }

  static async ensureDirectories(config: MCPServerConfig): Promise<void> {
    try {
      // Ensure storage directory exists
      const storageDir = path.dirname(config.storage.connection_string);
      await fs.mkdir(storageDir, { recursive: true });

      // Ensure log directory exists
      if (config.logging.file) {
        const logDir = path.dirname(config.logging.file);
        await fs.mkdir(logDir, { recursive: true });
      }

      // Ensure migrations directory exists
      await fs.mkdir(config.storage.migrations_path, { recursive: true });
    } catch (error) {
      throw new ConfigurationError(`Failed to create directories: ${(error as Error).message}`, error);
    }
  }
}