/**
 * Utility functions for MosAIc Stack operations
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export class StackUtils {
  private static readonly STACK_DIR = join(homedir(), '.mosaicstack');
  private static readonly CONFIG_FILE = join(StackUtils.STACK_DIR, 'config.json');
  private static readonly STATE_FILE = join(StackUtils.STACK_DIR, 'state.json');

  /**
   * Ensure MosAIc Stack directory exists
   */
  static async ensureStackDirectory(): Promise<void> {
    try {
      await fs.access(StackUtils.STACK_DIR);
    } catch {
      await fs.mkdir(StackUtils.STACK_DIR, { recursive: true });
    }
  }

  /**
   * Get MosAIc Stack directory path
   */
  static getStackDirectory(): string {
    return StackUtils.STACK_DIR;
  }

  /**
   * Get config file path
   */
  static getConfigPath(): string {
    return StackUtils.CONFIG_FILE;
  }

  /**
   * Get state file path
   */
  static getStatePath(): string {
    return StackUtils.STATE_FILE;
  }

  /**
   * Save stack state
   */
  static async saveState(state: Record<string, unknown>): Promise<void> {
    await StackUtils.ensureStackDirectory();
    await fs.writeFile(StackUtils.STATE_FILE, JSON.stringify(state, null, 2));
  }

  /**
   * Load stack state
   */
  static async loadState(): Promise<Record<string, unknown> | null> {
    try {
      const data = await fs.readFile(StackUtils.STATE_FILE, 'utf8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Check if process is running on given port
   */
  static async isPortInUse(port: number): Promise<boolean> {
    try {
      const { createConnection } = await import('net');
      
      return new Promise<boolean>((resolve) => {
        const connection = createConnection({ port, host: 'localhost' }, () => {
          connection.end();
          resolve(true);
        });
        
        connection.on('error', () => {
          resolve(false);
        });
      });
    } catch {
      return false;
    }
  }

  /**
   * Get system information
   */
  static getSystemInfo() {
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      pid: process.pid,
      cwd: process.cwd(),
      home: homedir(),
      stackDir: StackUtils.STACK_DIR,
    };
  }

  /**
   * Format bytes to human readable string
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format uptime to human readable string
   */
  static formatUptime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Validate mode string
   */
  static isValidMode(mode: string): mode is 'local' | 'hybrid' | 'cloud' {
    return ['local', 'hybrid', 'cloud'].includes(mode);
  }

  /**
   * Validate port number
   */
  static isValidPort(port: number): boolean {
    return Number.isInteger(port) && port >= 1 && port <= 65535;
  }

  /**
   * Get default configuration for mode
   */
  static getDefaultConfig(mode: 'local' | 'hybrid' | 'cloud') {
    const baseConfig = {
      version: '0.1.0',
      mode,
      port: 3456,
      timeout: 30000,
      logging: {
        level: 'info',
        console: true,
        format: 'text',
      },
      telemetry: {
        enabled: false,
        timeout: 5000,
      },
    };

    switch (mode) {
      case 'local':
        return {
          ...baseConfig,
          providers: [
            {
              name: 'ollama',
              type: 'local',
              enabled: true,
              config: {
                baseUrl: 'http://localhost:11434',
              },
            },
          ],
        };

      case 'hybrid':
        return {
          ...baseConfig,
          providers: [
            {
              name: 'ollama',
              type: 'local',
              enabled: true,
              priority: 1,
              config: {
                baseUrl: 'http://localhost:11434',
              },
            },
            {
              name: 'claude',
              type: 'cloud',
              enabled: true,
              priority: 2,
              config: {},
            },
          ],
        };

      case 'cloud':
        return {
          ...baseConfig,
          providers: [
            {
              name: 'claude',
              type: 'cloud',
              enabled: true,
              priority: 1,
              config: {},
            },
            {
              name: 'openai',
              type: 'cloud',
              enabled: true,
              priority: 2,
              config: {},
            },
          ],
        };

      default:
        return baseConfig;
    }
  }
}