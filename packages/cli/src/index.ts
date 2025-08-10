/**
 * @mosaicstack/cli
 * Command-line interface for MosAIc Stack multi-mode architecture
 */

// Export all commands
export { InitCommand } from './commands/InitCommand';
export { StartCommand } from './commands/StartCommand';
export { StatusCommand } from './commands/StatusCommand';
export { ConfigCommand } from './commands/ConfigCommand';
export { ProvidersCommand } from './commands/ProvidersCommand';
export { TestCommand } from './commands/TestCommand';
export { TelemetryCommand } from './commands/TelemetryCommand';

// Export utilities
export { TelemetryService } from './utils/TelemetryService';

// Export types
export type { InitOptions } from './commands/InitCommand';
export type { StartOptions, StopOptions, LogsOptions, ResetOptions } from './commands/StartCommand';
export type { StatusOptions, SystemStatus, ProviderStatus, ServiceStatus, HealthCheck } from './commands/StatusCommand';
export type { ShowOptions, ValidateOptions, TemplateOptions } from './commands/ConfigCommand';
export type { ListOptions, HealthOptions, TestOptions } from './commands/ProvidersCommand';
export type { TestOptions as SystemTestOptions } from './commands/TestCommand';
export type { TelemetryOptions } from './commands/TelemetryCommand';

// Export telemetry types
export type { TelemetryData, TelemetryPreferences } from './utils/TelemetryService';

// Note: CLI entry point available via dist/bin/mosaic.js