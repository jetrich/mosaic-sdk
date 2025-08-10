/**
 * Test setup for OpenCode MCP integration
 */

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock file system operations
jest.mock("fs", () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

// Mock os module
jest.mock("os", () => ({
  homedir: jest.fn(() => "/mock/home"),
}));

// Mock path module
jest.mock("path", () => ({
  join: jest.fn((...args) => args.join("/")),
}));

// Set up test environment variables
process.env.NODE_ENV = "test";
