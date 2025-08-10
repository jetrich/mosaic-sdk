/**
 * @mosaicstack/stack - MosAIc Stack Meta-Package
 * 
 * Complete enterprise AI development platform orchestrator providing
 * unified access to all MosAIc Stack components with multi-mode architecture.
 */

// Core orchestrator
export { StackOrchestrator } from './orchestrator/StackOrchestrator.js';
export type { OrchestratorOptions } from './orchestrator/StackOrchestrator.js';

// Multi-mode support
export { ModeManager } from './modes/ModeManager.js';
export type { ModeConfig } from './modes/types.js';

// CLI integration
export { StackCLI } from './cli/StackCLI.js';
export type { CLIOptions } from './cli/types.js';

// Providers integration
export { ProviderOrchestrator } from './providers/ProviderOrchestrator.js';
export type { ProviderConfig } from './providers/types.js';

// Utilities
export { StackUtils } from './utils/StackUtils.js';
export { ValidationService } from './utils/ValidationService.js';

// Package metadata
export const VERSION = '0.1.0';
export const STACK_NAME = '@mosaicstack/stack';

// Supported operation modes
export const OPERATION_MODES = [
  'local',
  'hybrid',
  'cloud'
] as const;

export type OperationMode = typeof OPERATION_MODES[number];

// Component registry - all @mosaicstack packages
export const COMPONENTS = {
  'config': '@mosaicstack/config',
  'providers': '@mosaicstack/providers',
  'cli': '@mosaicstack/cli',
  'tony': '@mosaicstack/tony',
  'mcp': '@mosaicstack/mcp'
} as const;

export type ComponentName = keyof typeof COMPONENTS;

// Main stack factory
export { createStack } from './createStack.js';
export type { StackOptions, StackInstance } from './types.js';