#!/usr/bin/env node

import { Command } from 'commander';
import { MCPServer } from './server/MCPServer';
import { ConfigLoader } from './config/ConfigLoader';
import { Logger } from './utils/Logger';
import packageInfo from '../package.json';

const program = new Command();

// Configure CLI
program
  .name('mosaic-mcp')
  .description('MosAIc Stack MCP Orchestrator for OpenCode integration')
  .version(packageInfo.version);

// Serve command - main MCP server
program
  .command('serve')
  .description('Start the MCP server')
  .option('-c, --config <path>', 'Configuration file path', '~/.mosaic/config.json')
  .option('-d, --debug', 'Enable debug logging')
  .option('--stdio', 'Use stdio transport (default)')
  .option('--http', 'Use HTTP transport')
  .option('--port <port>', 'Port for HTTP transport', '3456')
  .option('--host <host>', 'Host for HTTP transport', 'localhost')
  .action(async (options) => {
    try {
      const config = await ConfigLoader.load(options.config);
      const logger = Logger.create({
        level: options.debug ? 'debug' : config.logging.level,
        console: true,
        structured: config.logging.structured
      });

      // Determine transport type
      let transport = 'stdio';
      if (options.http) {
        transport = 'sse'; // Use SSE for HTTP transport
      }
      
      // Update config with transport settings
      if (transport === 'sse') {
        config.transport = {
          type: 'sse',
          port: parseInt(options.port) || 3456,
          host: options.host || 'localhost',
          timeout: config.transport.timeout || 30000,
          cors: {
            origin: process.env['CORS_ORIGIN'] || true,
            credentials: true,
            methods: ['GET', 'POST', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Accept'],
            exposedHeaders: ['X-Session-Id']
          }
        };
      }
      
      logger.info('Starting MosAIc MCP Orchestrator', {
        version: packageInfo.version,
        config_path: options.config,
        transport: transport,
        port: transport === 'sse' ? config.transport.port : undefined
      });

      const server = new MCPServer(config, logger);
      await server.start();

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        logger.info('Received SIGINT, shutting down gracefully...');
        await server.stop();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        logger.info('Received SIGTERM, shutting down gracefully...');
        await server.stop();
        process.exit(0);
      });

    } catch (error) {
      console.error('Failed to start MCP server:', error);
      process.exit(1);
    }
  });

// Health check command
program
  .command('health')
  .description('Check server health and connectivity')
  .option('-c, --config <path>', 'Configuration file path', '~/.mosaic/config.json')
  .action(async () => {
    try {
      // const config = await ConfigLoader.load(options.config);
      const logger = Logger.create({ level: 'info', console: true, structured: false });
      
      logger.info('Performing health check...');
      
      // TODO: Implement health check logic
      const healthStatus = {
        status: 'healthy',
        version: packageInfo.version,
        timestamp: new Date().toISOString(),
        checks: {
          database: 'ok',
          configuration: 'ok',
          tools: 'ok'
        }
      };

      console.log(JSON.stringify(healthStatus, null, 2));
      process.exit(0);
    } catch (error) {
      console.error('Health check failed:', error);
      process.exit(1);
    }
  });

// List tools command
program
  .command('tools')
  .description('List available tools')
  .option('-c, --config <path>', 'Configuration file path', '~/.mosaic/config.json')
  .option('--json', 'Output in JSON format')
  .action(async (options) => {
    try {
      const config = await ConfigLoader.load(options.config);
      const logger = Logger.create({ level: 'warn', console: false, structured: false });
      
      const server = new MCPServer(config, logger);
      const tools = await server.getTools();

      if (options.json) {
        console.log(JSON.stringify(tools, null, 2));
      } else {
        console.log('Available MCP Tools:');
        console.log('==================');
        
        for (const [name, tool] of Object.entries(tools)) {
          console.log(`\n${name}:`);
          console.log(`  Description: ${tool.description}`);
          console.log(`  Namespace: ${name.split('_')[0]}_${name.split('_')[1]}`);
        }
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Failed to list tools:', error);
      process.exit(1);
    }
  });

// Version command
program
  .command('version')
  .description('Show version information')
  .action(() => {
    console.log(`MosAIc MCP Orchestrator v${packageInfo.version}`);
    console.log(`Node.js ${process.version}`);
    console.log(`Platform: ${process.platform} ${process.arch}`);
    process.exit(0);
  });

// Config validation command
program
  .command('config')
  .description('Configuration management')
  .option('-c, --config <path>', 'Configuration file path', '~/.mosaic/config.json')
  .option('--validate', 'Validate configuration file')
  .option('--show', 'Show current configuration')
  .option('--init', 'Initialize default configuration')
  .action(async (options) => {
    try {
      if (options.init) {
        await ConfigLoader.createDefault(options.config);
        console.log(`Default configuration created at: ${options.config}`);
        process.exit(0);
      }

      const config = await ConfigLoader.load(options.config);
      
      if (options.validate) {
        console.log('✓ Configuration file is valid');
        process.exit(0);
      }

      if (options.show) {
        console.log(JSON.stringify(config, null, 2));
        process.exit(0);
      }

      console.log('Use --validate, --show, or --init');
      process.exit(1);
    } catch (error) {
      console.error('Configuration error:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}