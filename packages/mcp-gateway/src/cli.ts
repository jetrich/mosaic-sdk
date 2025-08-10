#!/usr/bin/env node

import { Command } from 'commander';
import { MCPGateway } from './core/MCPGateway.js';
import { createConfig } from './config/DefaultConfig.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const program = new Command();

// Read package.json for version
const packagePath = resolve(process.cwd(), 'package.json');
let version = '0.0.2';
try {
  const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
  version = pkg.version || version;
} catch {
  // Use default version if package.json not found
}

program
  .name('mcp-gateway')
  .description('Universal MCP transport gateway for MosAIc Stack')
  .version(version);

program
  .command('serve')
  .description('Start the MCP gateway server')
  .option('-p, --port <port>', 'Port to listen on', '3456')
  .option('-h, --host <host>', 'Host to bind to', '0.0.0.0')
  .option('-c, --config <path>', 'Configuration file path')
  .option('--no-sse', 'Disable SSE transport')
  .option('--no-rest', 'Disable REST transport')
  .option('--enable-websocket', 'Enable WebSocket transport (experimental)')
  .option('--debug', 'Enable debug logging')
  .action(async (options) => {
    try {
      let config = createConfig();
      
      // Load config file if provided
      if (options.config) {
        try {
          const configFile = readFileSync(options.config, 'utf-8');
          const fileConfig = JSON.parse(configFile);
          config = createConfig(fileConfig);
        } catch (error) {
          console.error(`Failed to load config file: ${error}`);
          process.exit(1);
        }
      }
      
      // Apply CLI overrides
      if (options.port) {
        config.port = parseInt(options.port);
      }
      
      if (options.host) {
        config.host = options.host;
      }
      
      if (options.sse === false) {
        config.transports.sse.enabled = false;
      }
      
      if (options.rest === false) {
        config.transports.rest.enabled = false;
      }
      
      if (options.enableWebsocket) {
        config.transports.websocket.enabled = true;
      }
      
      if (options.debug) {
        config.monitoring.logging = 'debug';
      }
      
      // Validate config
      if (!config.transports.sse.enabled && !config.transports.rest.enabled && !config.transports.websocket.enabled) {
        console.error('Error: At least one transport must be enabled');
        process.exit(1);
      }
      
      console.log('Starting MCP Gateway...');
      console.log(`Configuration: ${JSON.stringify(config, null, 2)}`);
      
      const gateway = new MCPGateway(config);
      await gateway.start();
      
      // Graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\\nReceived SIGINT, shutting down gracefully...');
        await gateway.stop();
        process.exit(0);
      });
      
      process.on('SIGTERM', async () => {
        console.log('\\nReceived SIGTERM, shutting down gracefully...');
        await gateway.stop();
        process.exit(0);
      });
      
    } catch (error) {
      console.error('Failed to start MCP Gateway:', error);
      process.exit(1);
    }
  });

program
  .command('health')
  .description('Check gateway health')
  .option('-u, --url <url>', 'Gateway URL', 'http://localhost:3456')
  .action(async (options) => {
    try {
      const response = await fetch(`${options.url}/health`);
      const health = await response.json() as any;
      
      console.log('Gateway Health Check:');
      console.log(JSON.stringify(health, null, 2));
      
      if (health.status === 'healthy') {
        console.log('✅ Gateway is healthy');
        process.exit(0);
      } else {
        console.log('❌ Gateway is unhealthy');
        process.exit(1);
      }
    } catch (error) {
      console.error('Health check failed:', error);
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Generate default configuration file')
  .option('-o, --output <path>', 'Output file path', 'gateway.config.json')
  .action((options) => {
    try {
      const config = createConfig();
      const configJson = JSON.stringify(config, null, 2);
      
      if (options.output === '-') {
        console.log(configJson);
      } else {
        const fs = require('fs');
        fs.writeFileSync(options.output, configJson);
        console.log(`Configuration written to: ${options.output}`);
      }
    } catch (error) {
      console.error('Failed to generate config:', error);
      process.exit(1);
    }
  });

program
  .command('test')
  .description('Test transport connectivity')
  .option('-u, --url <url>', 'Gateway URL', 'http://localhost:3456')
  .option('-t, --transport <type>', 'Transport to test', 'sse')
  .action(async (options) => {
    console.log(`Testing ${options.transport} transport at ${options.url}...`);
    
    try {
      switch (options.transport) {
        case 'sse':
          await testSSE(options.url);
          break;
        case 'rest':
          await testREST(options.url);
          break;
        default:
          console.error(`Unknown transport: ${options.transport}`);
          process.exit(1);
      }
      
      console.log('✅ Transport test successful');
    } catch (error) {
      console.error('❌ Transport test failed:', error);
      process.exit(1);
    }
  });

async function testSSE(baseUrl: string): Promise<void> {
  const response = await fetch(`${baseUrl}/mcp`, {
    headers: {
      'Accept': 'text/event-stream',
      'User-Agent': 'mcp-gateway-test/1.0'
    }
  });
  
  if (!response.ok) {
    throw new Error(`SSE connection failed: ${response.status}`);
  }
  
  console.log('SSE connection established');
}

async function testREST(baseUrl: string): Promise<void> {
  const response = await fetch(`${baseUrl}/api/v1/tools`);
  
  if (!response.ok) {
    throw new Error(`REST request failed: ${response.status}`);
  }
  
  const data = await response.json() as any;
  console.log('REST endpoint responded:', data);
}

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}