/**
 * @mosaicstack/config
 * Configuration management for MosAIc Stack multi-mode architecture
 */

// Core types
export * from "./types/ConfigTypes";

// Configuration loading
export { ConfigLoader } from "./loaders/ConfigLoader";

// Environment resolution
export { EnvResolverImpl } from "./validators/EnvResolver";

// Mode defaults
export {
  MODE_DEFAULTS,
  getModeDefaults,
  mergeWithDefaults,
} from "./defaults/ModeDefaults";

// Path management
export { MosaicPaths } from "./paths";

// Convenience exports
import { ConfigLoader } from "./loaders/ConfigLoader";
import { getModeDefaults } from "./defaults/ModeDefaults";

/**
 * Global configuration loader instance
 */
let globalLoader: ConfigLoader | null = null;

/**
 * Get the global configuration loader instance
 */
export function getGlobalConfigLoader(): ConfigLoader {
  if (!globalLoader) {
    globalLoader = new ConfigLoader();
  }
  return globalLoader;
}

/**
 * Quick configuration loading with sensible defaults
 *
 * @example
 * ```typescript
 * // Load with defaults
 * const config = await loadConfig();
 *
 * // Load specific mode
 * const config = await loadConfig({ mode: 'local' });
 *
 * // Load from specific file
 * const config = await loadConfig({
 *   configPath: './my-config.yaml',
 *   mode: 'hybrid'
 * });
 * ```
 */
export async function loadConfig(options?: {
  configPath?: string;
  mode?: "local" | "hybrid" | "cloud";
  envFile?: string;
  validateSchema?: boolean;
}) {
  const loader = getGlobalConfigLoader();
  return loader.load(options);
}

/**
 * Generate configuration template for a specific mode
 *
 * @example
 * ```typescript
 * const template = getConfigTemplate('local');
 * console.log(JSON.stringify(template, null, 2));
 * ```
 */
export function getConfigTemplate(mode: "local" | "hybrid" | "cloud") {
  const loader = getGlobalConfigLoader();
  return loader.getTemplate(mode);
}

/**
 * Validate configuration
 *
 * @example
 * ```typescript
 * const validation = await validateConfig(config);
 * if (!validation.valid) {
 *   console.error('Configuration errors:', validation.errors);
 * }
 * ```
 */
export async function validateConfig(config: any) {
  const loader = getGlobalConfigLoader();
  return loader.validate(config);
}

/**
 * Save configuration to file
 *
 * @example
 * ```typescript
 * await saveConfig(config, './mosaic.config.json');
 * await saveConfig(config, './mosaic.config.yaml');
 * ```
 */
export async function saveConfig(config: any, filePath: string) {
  const loader = getGlobalConfigLoader();
  return loader.save(config, filePath);
}
