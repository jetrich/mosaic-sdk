/**
 * Tests for OpenCode MCP Server
 */

import { OpenCodeMCPServer } from "../index";
import { TokenExtractor } from "../token-extractor";

// Mock the MCP SDK
jest.mock("@modelcontextprotocol/sdk/server/index.js", () => ({
  Server: jest.fn().mockImplementation(() => ({
    setRequestHandler: jest.fn(),
    connect: jest.fn(),
  })),
}));

jest.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
  StdioServerTransport: jest.fn(),
}));

describe("OpenCodeMCPServer", () => {
  let server: OpenCodeMCPServer;

  beforeEach(() => {
    server = new OpenCodeMCPServer();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should create a server instance", () => {
      expect(server).toBeInstanceOf(OpenCodeMCPServer);
    });

    it("should initialize with correct server configuration", () => {
      const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
      expect(Server).toHaveBeenCalledWith(
        {
          name: "opencode-mcp-server",
          version: "0.1.0",
        },
        {
          capabilities: {
            tools: {},
          },
        },
      );
    });
  });

  describe("start", () => {
    it("should start the server with stdio transport", async () => {
      const mockConnect = jest.fn().mockResolvedValue(undefined);
      const mockServer = {
        setRequestHandler: jest.fn(),
        connect: mockConnect,
      };

      // Mock the server instance
      (server as any).server = mockServer;

      await server.start();

      expect(mockConnect).toHaveBeenCalled();
    });
  });
});

describe("TokenExtractor", () => {
  let extractor: TokenExtractor;

  beforeEach(() => {
    extractor = new TokenExtractor();
    // Clear environment variables
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.CLAUDE_API_KEY;
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("extractTokens", () => {
    it("should extract tokens from environment variables", () => {
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";
      process.env.OPENAI_API_KEY = "sk-test-openai-key";

      const tokens = extractor.extractTokens();

      expect(tokens.claude).toBe("sk-ant-test-key");
      expect(tokens.anthropic).toBe("sk-ant-test-key");
      expect(tokens.openai).toBe("sk-test-openai-key");
    });

    it("should return empty tokens when no environment variables are set", () => {
      const tokens = extractor.extractTokens();

      expect(tokens.claude).toBeUndefined();
      expect(tokens.anthropic).toBeUndefined();
      expect(tokens.openai).toBeUndefined();
    });
  });

  describe("validateToken", () => {
    it("should validate Claude API key format", () => {
      const validKey = "sk-ant-api03-1234567890abcdef";
      const invalidKey = "invalid-key";

      expect(extractor.validateToken(validKey, "claude")).toBe(true);
      expect(extractor.validateToken(invalidKey, "claude")).toBe(false);
    });

    it("should validate OpenAI API key format", () => {
      const validKey = "sk-1234567890abcdef1234567890abcdef";
      const invalidKey = "invalid-key";

      expect(extractor.validateToken(validKey, "openai")).toBe(true);
      expect(extractor.validateToken(invalidKey, "openai")).toBe(false);
    });

    it("should return false for empty or null tokens", () => {
      expect(extractor.validateToken("", "claude")).toBe(false);
      expect(extractor.validateToken(null as any, "claude")).toBe(false);
      expect(extractor.validateToken(undefined as any, "claude")).toBe(false);
    });
  });

  describe("getToken", () => {
    it("should return Claude token for claude provider", () => {
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-key";

      const token = extractor.getToken("claude");

      expect(token).toBe("sk-ant-test-key");
    });

    it("should return OpenAI token for openai provider", () => {
      process.env.OPENAI_API_KEY = "sk-test-openai-key";

      const token = extractor.getToken("openai");

      expect(token).toBe("sk-test-openai-key");
    });

    it("should return null when token is not available", () => {
      const token = extractor.getToken("claude");

      expect(token).toBeNull();
    });
  });
});
