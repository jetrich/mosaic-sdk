/**
 * Configuration Loader
 * Loads, validates, and processes MosAIc Stack configuration
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { config as loadEnv } from "dotenv";
import Ajv from "ajv";
import addFormats from "ajv-formats";

import {
  MosaicConfig,
  LoaderOptions,
  ValidationResult,
  EnvResolver,
  OperationMode,
} from "../types/ConfigTypes";
import { getModeDefaults, mergeWithDefaults } from "../defaults/ModeDefaults";
import { EnvResolverImpl } from "../validators/EnvResolver";
import { MosaicPaths } from "../paths";

// Load JSON schema for validation
const configSchema = require(
  path.join(__dirname, "../schemas/config-schema.json"),
);

export class ConfigLoader {
  private ajv: Ajv;
  private envResolver: EnvResolver;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
    this.envResolver = new EnvResolverImpl();
  }

  /**
   * Load configuration from file or defaults
   */
  async load(options: LoaderOptions = {}): Promise<MosaicConfig> {
    // Load environment variables
    if (options.envFile) {
      loadEnv({ path: options.envFile });
    } else {
      loadEnv(); // Load from .env if it exists
    }

    let config: Partial<MosaicConfig>;

    // Load configuration file if specified
    if (options.configPath) {
      config = await this.loadFromFile(options.configPath);
    } else {
      // Try to find configuration file in common locations
      const configFile = this.findConfigFile();
      if (configFile) {
        config = await this.loadFromFile(configFile);
      } else {
        // Use minimal config, rely on defaults
        config = {
          mode: options.mode || "hybrid",
          version: "1.0.0",
        };
      }
    }

    // Ensure mode is set
    if (!config.mode) {
      config.mode = options.mode || "hybrid";
    }

    // Apply mode-specific defaults
    if (options.applyDefaults !== false) {
      config = mergeWithDefaults(config, config.mode);
    }

    // Resolve environment variables
    if (options.resolveEnv !== false) {
      config = this.envResolver.resolveObject(config);
    }

    // Validate schema
    if (options.validateSchema !== false) {
      const validation = this.validate(config as MosaicConfig);
      if (!validation.valid) {
        throw new Error(
          `Configuration validation failed: ${validation.errors.map((e) => e.message).join(", ")}`,
        );
      }
    }

    return config as MosaicConfig;
  }

  /**
   * Load configuration from file
   */
  private async loadFromFile(filePath: string): Promise<Partial<MosaicConfig>> {
    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Configuration file not found: ${absolutePath}`);
    }

    const content = fs.readFileSync(absolutePath, "utf8");
    const extension = path.extname(filePath).toLowerCase();

    try {
      switch (extension) {
        case ".json":
          return JSON.parse(content);
        case ".yaml":
        case ".yml":
          return yaml.load(content) as Partial<MosaicConfig>;
        default:
          throw new Error(
            `Unsupported configuration file format: ${extension}`,
          );
      }
    } catch (error) {
      throw new Error(
        `Failed to parse configuration file: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Find configuration file in common locations
   */
  private findConfigFile(): string | null {
    const candidates = [
      "mosaic.config.json",
      "mosaic.config.yaml",
      "mosaic.config.yml",
      ".mosaicrc.json",
      ".mosaicrc.yaml",
      ".mosaicrc.yml",
      "mosaic.json",
      "mosaic.yaml",
      "mosaic.yml",
    ];

    // Check current directory first
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    // Check XDG config directory (with backward compatibility)
    const configDir = MosaicPaths.resolvePath("");
    if (fs.existsSync(configDir)) {
      for (const candidate of candidates) {
        const fullPath = path.join(configDir, candidate);
        if (fs.existsSync(fullPath)) {
          return fullPath;
        }
      }
    }

    return null;
  }

  /**
   * Validate configuration against schema
   */
  validate(config: MosaicConfig): ValidationResult {
    const validate = this.ajv.compile(configSchema);
    const valid = validate(config);

    const errors = (validate.errors || []).map((error) => ({
      path: error.instancePath || "root",
      message: error.message || "Validation error",
      value: error.data,
    }));

    // Add warnings for common issues
    const warnings = this.generateWarnings(config);

    return {
      valid: !!valid,
      errors,
      warnings,
    };
  }

  /**
   * Generate configuration warnings
   */
  private generateWarnings(
    config: MosaicConfig,
  ): Array<{ path: string; message: string; suggestion?: string }> {
    const warnings = [];

    // Check for common misconfigurations
    if (config.mode === "local" && config.providers?.claude?.enabled) {
      warnings.push({
        path: "providers.claude.enabled",
        message: "Claude provider enabled in local mode",
        suggestion: "Consider disabling Claude for true local-only operation",
      });
    }

    if (
      config.mode === "cloud" &&
      !config.providers?.claude?.apiKey &&
      config.providers?.claude?.access === "api"
    ) {
      warnings.push({
        path: "providers.claude.apiKey",
        message: "Claude API access configured but no API key provided",
        suggestion:
          "Set ANTHROPIC_API_KEY environment variable or configure apiKey",
      });
    }

    if (
      config.providers?.ollama?.enabled &&
      config.providers.ollama.location === "local"
    ) {
      // Could check if Ollama is actually running
      warnings.push({
        path: "providers.ollama.url",
        message: "Ollama local configuration detected",
        suggestion:
          "Ensure Ollama is installed and running on the specified URL",
      });
    }

    // Check for performance settings
    if (config.routing?.cache?.enabled === false && config.mode !== "local") {
      warnings.push({
        path: "routing.cache.enabled",
        message: "Response caching disabled",
        suggestion:
          "Enable caching for better performance and cost optimization",
      });
    }

    return warnings;
  }

  /**
   * Save configuration to file
   */
  async save(config: MosaicConfig, filePath: string): Promise<void> {
    const extension = path.extname(filePath).toLowerCase();
    let content: string;

    switch (extension) {
      case ".json":
        content = JSON.stringify(config, null, 2);
        break;
      case ".yaml":
      case ".yml":
        content = yaml.dump(config, {
          indent: 2,
          lineWidth: -1,
          noRefs: true,
        });
        break;
      default:
        throw new Error(`Unsupported configuration file format: ${extension}`);
    }

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, content, "utf8");
  }

  /**
   * Get configuration template for a specific mode
   */
  getTemplate(mode: OperationMode): MosaicConfig {
    const defaults = getModeDefaults(mode);

    // Add helpful comments and examples
    const template = {
      $schema: "https://mosaicstack.dev/schemas/config.json",
      ...defaults,
    } as MosaicConfig;

    return template;
  }

  /**
   * Initialize configuration with interactive wizard
   * Returns a basic configuration that can be extended
   */
  initializeConfig(answers: {
    mode: OperationMode;
    ollamaUrl?: string;
    claudeAccess?: "subscription" | "api" | "both";
    claudeApiKey?: string;
    mcpPort?: number;
  }): MosaicConfig {
    const template = this.getTemplate(answers.mode);

    // Apply user answers
    if (answers.ollamaUrl && template.providers.ollama) {
      template.providers.ollama.url = answers.ollamaUrl;
      template.providers.ollama.location = answers.ollamaUrl.includes(
        "localhost",
      )
        ? "local"
        : "remote";
    }

    if (answers.claudeAccess && template.providers.claude) {
      template.providers.claude.access = answers.claudeAccess;
      if (answers.claudeApiKey) {
        template.providers.claude.apiKey = answers.claudeApiKey;
      }
    }

    if (answers.mcpPort) {
      template.mcp.port = answers.mcpPort;
    }

    return template;
  }
}
