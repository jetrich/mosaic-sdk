/**
 * Types for CLI integration
 */

export interface CLIOptions {
  verbose?: boolean;
  quiet?: boolean;
  configPath?: string;
  mode?: 'local' | 'hybrid' | 'cloud';
  port?: number;
  timeout?: number;
}