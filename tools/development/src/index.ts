/**
 * @tony/development-tools
 * 
 * Central exports for Tony Framework development tools and configurations
 */

// Import configurations for internal use
import packageJson from '../package.json';
import tsConfigJson from '../tsconfig.json';
import versionTsConfigJson from '../version-tsconfig.json';
import versionPackageJson from '../version-package.json';

// Re-export configurations
export const packageConfig = packageJson;
export const tsConfig = tsConfigJson;
export const versionTsConfig = versionTsConfigJson;
export const versionPackageConfig = versionPackageJson;

// Configuration types
export interface DevelopmentToolsConfig {
  typescript: {
    version: string;
    strict: boolean;
    exactOptionalPropertyTypes: boolean;
    isolatedModules: boolean;
  };
  build: {
    target: string;
    module: string;
    outDir: string;
    sourceMap: boolean;
  };
  optimization: {
    minify: boolean;
    treeshake: boolean;
    compress: boolean;
  };
  development: {
    watch: boolean;
    incremental: boolean;
    hotReload: boolean;
  };
}

// Export configuration helper
export function getDevelopmentConfig(): DevelopmentToolsConfig | undefined {
  // Safely access config property
  const pkg = packageJson as Record<string, unknown>;
  if (pkg.config && typeof pkg.config === 'object') {
    return pkg.config as DevelopmentToolsConfig;
  }
  return undefined;
}

// Version information
export const VERSION = packageJson.version;
export const NAME = packageJson.name;