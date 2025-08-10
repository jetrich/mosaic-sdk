#!/usr/bin/env node
/**
 * CLI tool for OpenCode MCP token management
 */

import { TokenExtractor } from "./token-extractor";

const extractor = new TokenExtractor();

function showHelp(): void {
  console.log(`
🔧 MosAIc OpenCode Token Manager

Usage: opencode-mcp-tokens <command> [options]

Commands:
  extract     Extract tokens from available sources
  validate    Validate existing tokens
  setup       Setup OpenCode integration with token extraction
  secure      Store tokens in secure storage
  show        Show current token configuration (masked)

Options:
  --help, -h  Show this help message
  --verbose   Show detailed output

Examples:
  opencode-mcp-tokens extract
  opencode-mcp-tokens setup
  opencode-mcp-tokens validate --verbose
`);
}

function maskToken(token: string): string {
  if (!token || token.length < 8) return "***";
  return token.substring(0, 8) + "***" + token.substring(token.length - 4);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];
  const verbose = args.includes("--verbose");

  if (!command || command === "--help" || command === "-h") {
    showHelp();
    return;
  }

  try {
    switch (command) {
      case "extract": {
        console.log("🔍 Extracting tokens from available sources...");
        const tokens = extractor.extractTokens();

        console.log("\n📋 Token Status:");
        console.log(
          `• Claude/Anthropic: ${tokens.claude ? "✅ Found" : "❌ Not found"}`,
        );
        console.log(`• OpenAI: ${tokens.openai ? "✅ Found" : "❌ Not found"}`);
        console.log(`• MosAIc: ${tokens.mosaic ? "✅ Found" : "❌ Not found"}`);

        if (verbose) {
          console.log("\n🔍 Token Details (masked):");
          if (tokens.claude)
            console.log(`• Claude: ${maskToken(tokens.claude)}`);
          if (tokens.openai)
            console.log(`• OpenAI: ${maskToken(tokens.openai)}`);
          if (tokens.mosaic)
            console.log(`• MosAIc: ${maskToken(tokens.mosaic)}`);
        }

        extractor.saveTokens(tokens);
        console.log("\n✅ Tokens saved to MosAIc configuration");
        break;
      }

      case "validate": {
        console.log("🧪 Validating tokens...");
        const tokens = extractor.extractTokens();

        let allValid = true;

        if (tokens.claude) {
          const valid = extractor.validateToken(tokens.claude, "claude");
          console.log(
            `• Claude/Anthropic: ${valid ? "✅ Valid" : "❌ Invalid format"}`,
          );
          if (!valid) allValid = false;
          if (verbose) console.log(`  Token: ${maskToken(tokens.claude)}`);
        } else {
          console.log("• Claude/Anthropic: ❌ Not found");
          allValid = false;
        }

        if (tokens.openai) {
          const valid = extractor.validateToken(tokens.openai, "openai");
          console.log(`• OpenAI: ${valid ? "✅ Valid" : "❌ Invalid format"}`);
          if (!valid) allValid = false;
          if (verbose) console.log(`  Token: ${maskToken(tokens.openai)}`);
        } else {
          console.log("• OpenAI: ⚠️  Not found (optional)");
        }

        console.log(
          `\n🎯 Overall Status: ${allValid ? "✅ All tokens valid" : "❌ Some tokens invalid or missing"}`,
        );
        break;
      }

      case "setup": {
        console.log("🚀 Setting up OpenCode integration...");
        extractor.setupOpenCodeIntegration();
        console.log("✅ OpenCode integration setup complete");
        break;
      }

      case "secure": {
        console.log("🔒 Creating secure token storage...");
        const tokens = extractor.extractTokens();

        if (!tokens.claude && !tokens.openai) {
          console.log("❌ No tokens found to store");
          process.exit(1);
        }

        extractor.createSecureStorage(tokens);
        console.log("✅ Tokens stored securely");
        break;
      }

      case "show": {
        console.log("📋 Current token configuration:");

        // Try to load from secure storage first
        let tokens = extractor.loadSecureStorage();
        if (!tokens) {
          tokens = extractor.extractTokens();
        }

        console.log("\n🔑 Available Tokens:");
        console.log(
          `• Claude/Anthropic: ${tokens.claude ? maskToken(tokens.claude) : "Not found"}`,
        );
        console.log(
          `• OpenAI: ${tokens.openai ? maskToken(tokens.openai) : "Not found"}`,
        );
        console.log(
          `• MosAIc: ${tokens.mosaic ? maskToken(tokens.mosaic) : "Not found"}`,
        );

        if (tokens.custom && Object.keys(tokens.custom).length > 0) {
          console.log("\n🎛️  Custom Tokens:");
          for (const [key, value] of Object.entries(tokens.custom)) {
            console.log(`• ${key}: ${maskToken(value)}`);
          }
        }
        break;
      }

      default:
        console.log(`❌ Unknown command: ${command}`);
        console.log("Use --help for available commands");
        process.exit(1);
    }
  } catch (error) {
    console.error(
      "❌ Error:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

// Run CLI if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { main as runCLI };
