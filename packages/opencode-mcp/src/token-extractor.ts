/**
 * Token Extraction System for OpenCode Integration
 * Extracts and manages authentication tokens for MosAIc services
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export interface TokenConfig {
  claude?: string;
  openai?: string;
  anthropic?: string;
  mosaic?: string;
  custom?: Record<string, string>;
}

export interface TokenSource {
  name: string;
  path: string;
  extractor: (content: string) => string | null;
}

export class TokenExtractor {
  private tokenSources: TokenSource[] = [
    // Claude Desktop configuration
    {
      name: "claude-desktop",
      path: join(homedir(), ".config", "claude", "config.json"),
      extractor: (content: string) => {
        try {
          const config = JSON.parse(content);
          return config.anthropic?.apiKey || null;
        } catch {
          return null;
        }
      },
    },

    // OpenCode configuration
    {
      name: "opencode",
      path: join(homedir(), ".config", "opencode", "config.json"),
      extractor: (content: string) => {
        try {
          const config = JSON.parse(content);
          return config.anthropic?.apiKey || config.claude?.apiKey || null;
        } catch {
          return null;
        }
      },
    },

    // Environment variables file
    {
      name: "env-file",
      path: join(homedir(), ".env"),
      extractor: (content: string) => {
        const lines = content.split("\n");
        for (const line of lines) {
          if (
            line.startsWith("ANTHROPIC_API_KEY=") ||
            line.startsWith("CLAUDE_API_KEY=")
          ) {
            return line.split("=")[1]?.trim().replace(/['"]/g, "") || null;
          }
        }
        return null;
      },
    },

    // MosAIc configuration
    {
      name: "mosaic",
      path: join(homedir(), ".mosaic", "config.json"),
      extractor: (content: string) => {
        try {
          const config = JSON.parse(content);
          return config.tokens?.claude || config.tokens?.anthropic || null;
        } catch {
          return null;
        }
      },
    },
  ];

  /**
   * Extract tokens from all available sources
   */
  public extractTokens(): TokenConfig {
    const tokens: TokenConfig = {};

    // Extract from environment variables first
    tokens.claude = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    tokens.openai = process.env.OPENAI_API_KEY;
    tokens.anthropic = process.env.ANTHROPIC_API_KEY;

    // Extract from configuration files
    for (const source of this.tokenSources) {
      if (existsSync(source.path)) {
        try {
          const content = readFileSync(source.path, "utf-8");
          const token = source.extractor(content);

          if (token && !tokens.claude) {
            tokens.claude = token;
            tokens.anthropic = token;
          }
        } catch (error) {
          console.warn(`Failed to extract token from ${source.name}:`, error);
        }
      }
    }

    return tokens;
  }

  /**
   * Save tokens to MosAIc configuration
   */
  public saveTokens(tokens: TokenConfig): void {
    const mosaicConfigPath = join(homedir(), ".mosaic", "config.json");
    let config: any = {};

    // Load existing configuration
    if (existsSync(mosaicConfigPath)) {
      try {
        config = JSON.parse(readFileSync(mosaicConfigPath, "utf-8"));
      } catch {
        config = {};
      }
    }

    // Update tokens section
    config.tokens = {
      ...config.tokens,
      ...tokens,
      updatedAt: new Date().toISOString(),
    };

    // Ensure directory exists
    const mosaicDir = join(homedir(), ".mosaic");
    if (!existsSync(mosaicDir)) {
      require("fs").mkdirSync(mosaicDir, { recursive: true });
    }

    // Save configuration
    writeFileSync(mosaicConfigPath, JSON.stringify(config, null, 2));
  }

  /**
   * Validate token format and accessibility
   */
  public validateToken(
    token: string,
    provider: "claude" | "openai" = "claude",
  ): boolean {
    if (!token || typeof token !== "string") {
      return false;
    }

    switch (provider) {
      case "claude":
        // Anthropic API keys start with 'sk-ant-'
        return token.startsWith("sk-ant-") && token.length > 20;
      case "openai":
        // OpenAI API keys start with 'sk-'
        return token.startsWith("sk-") && token.length > 20;
      default:
        return token.length > 10;
    }
  }

  /**
   * Get token for specific provider with fallbacks
   */
  public getToken(
    provider: "claude" | "openai" | "anthropic" | "mosaic",
  ): string | null {
    const tokens = this.extractTokens();

    switch (provider) {
      case "claude":
      case "anthropic":
        return tokens.claude || tokens.anthropic || null;
      case "openai":
        return tokens.openai || null;
      case "mosaic":
        return tokens.mosaic || tokens.claude || null;
      default:
        return null;
    }
  }

  /**
   * Setup token extraction for OpenCode integration
   */
  public setupOpenCodeIntegration(): void {
    const tokens = this.extractTokens();

    if (!tokens.claude && !tokens.anthropic) {
      console.warn(
        "⚠️  No Claude/Anthropic API key found. OpenCode integration may not work properly.",
      );
      console.log(
        "💡 Please set ANTHROPIC_API_KEY environment variable or configure it in:",
      );
      console.log("   • ~/.config/claude/config.json");
      console.log("   • ~/.config/opencode/config.json");
      console.log("   • ~/.mosaic/config.json");
      return;
    }

    // Save tokens to MosAIc configuration
    this.saveTokens(tokens);

    // Update OpenCode configuration if it exists
    const opencodeConfigPath = join(
      homedir(),
      ".config",
      "opencode",
      "config.json",
    );
    if (existsSync(opencodeConfigPath)) {
      try {
        const config = JSON.parse(readFileSync(opencodeConfigPath, "utf-8"));

        // Ensure MCP configuration includes token environment
        if (config.mcp?.mosaic) {
          config.mcp.mosaic.environment = {
            ...config.mcp.mosaic.environment,
            ANTHROPIC_API_KEY: tokens.claude || tokens.anthropic,
            MOSAIC_TOKEN: tokens.mosaic || tokens.claude,
          };

          writeFileSync(opencodeConfigPath, JSON.stringify(config, null, 2));
          console.log("✅ OpenCode configuration updated with tokens");
        }
      } catch (error) {
        console.warn("⚠️  Failed to update OpenCode configuration:", error);
      }
    }
  }

  /**
   * Create secure token storage
   */
  public createSecureStorage(tokens: TokenConfig): void {
    const secureConfigPath = join(homedir(), ".mosaic", "secure.json");

    // Simple obfuscation (not encryption, just to avoid plain text)
    const obfuscated = Buffer.from(JSON.stringify(tokens)).toString("base64");

    const secureConfig = {
      version: "1.0",
      created: new Date().toISOString(),
      data: obfuscated,
    };

    writeFileSync(secureConfigPath, JSON.stringify(secureConfig, null, 2), {
      mode: 0o600,
    });
    console.log("🔒 Tokens stored securely in ~/.mosaic/secure.json");
  }

  /**
   * Load tokens from secure storage
   */
  public loadSecureStorage(): TokenConfig | null {
    const secureConfigPath = join(homedir(), ".mosaic", "secure.json");

    if (!existsSync(secureConfigPath)) {
      return null;
    }

    try {
      const secureConfig = JSON.parse(readFileSync(secureConfigPath, "utf-8"));
      const deobfuscated = Buffer.from(secureConfig.data, "base64").toString(
        "utf-8",
      );
      return JSON.parse(deobfuscated);
    } catch {
      return null;
    }
  }
}
