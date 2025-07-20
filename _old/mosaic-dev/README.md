# MosAIc Development SDK

[![CI/CD](https://ci.mosaicstack.dev/api/badges/3/status.svg)](https://ci.mosaicstack.dev/repos/3)
[![Version](https://img.shields.io/npm/v/@mosaic/dev.svg)](https://www.npmjs.com/package/@mosaic/dev)
[![License](https://img.shields.io/npm/l/@mosaic/dev.svg)](LICENSE)

**Complete Development Environment for MosAIc Stack Contributors**

## 🎯 Overview

The MosAIc Development SDK provides a comprehensive development environment for contributors, maintainers, and developers extending the MosAIc Stack. This repository contains all development tools, testing infrastructure, migration utilities, and contributor resources.

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/jetrich/mosaic-dev.git
cd mosaic-dev

# Install dependencies
npm install

# Run development environment
npm run dev

# Run tests
npm test
```

## 📦 Repository Structure

```
mosaic-dev/
├── sdk/                        # Development SDK Components
│   ├── development-tools/      # Build tools, TypeScript configs, dev dependencies
│   ├── testing-framework/      # Complete test suite and coverage tools
│   ├── migration-tools/        # Version migration and upgrade utilities
│   └── contributor-guides/     # Contributor documentation and guides
├── releases/                   # Version Management
│   └── v0.1.0/                # Version-specific artifacts
│       ├── release-notes/      # Release documentation
│       ├── distribution/       # Distribution packages and artifacts
│       └── migration-guides/   # Version migration guides
├── tools/                      # Development Tools
│   ├── cli/                   # CLI development tools
│   ├── generators/            # Code generators and scaffolding
│   ├── analyzers/             # Code analysis tools
│   └── debuggers/             # Debugging utilities
├── templates/                  # Project Templates
│   ├── mcp-tool/              # MCP tool template
│   ├── orchestration-agent/   # Agent template
│   └── mosaic-plugin/         # Plugin template
├── examples/                   # Usage Examples & Tutorials
├── docs/                       # Development Documentation
└── scripts/                    # Development Automation Scripts
```

## 🛠️ Development Tools

### CLI Tools

```bash
# Scaffold a new MCP tool
mosaic-dev generate mcp-tool my-tool

# Create an orchestration agent
mosaic-dev generate agent my-agent

# Analyze code quality
mosaic-dev analyze ./src

# Debug MCP connections
mosaic-dev debug mcp --port 3456
```

### Testing Framework

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:e2e

# Generate coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Migration Tools

```bash
# Migrate from Tony SDK
mosaic-dev migrate from-tony --version 2.7.0

# Update to latest MosAIc version
mosaic-dev migrate update

# Check compatibility
mosaic-dev migrate check
```

## 🔧 Configuration

### Development Environment

```bash
# .env.development
MOSAIC_DEV_MODE=true
MOSAIC_LOG_LEVEL=debug
MOSAIC_MCP_PORT=3456
MOSAIC_TEST_TIMEOUT=30000
```

### TypeScript Configuration

The SDK provides optimized TypeScript configurations:
- `tsconfig.base.json` - Base configuration
- `tsconfig.lib.json` - Library builds
- `tsconfig.app.json` - Application builds
- `tsconfig.test.json` - Test configuration

## 📚 Documentation

### For Contributors

- [Contributing Guide](docs/CONTRIBUTING.md)
- [Development Setup](docs/development-setup.md)
- [Testing Guide](docs/testing-guide.md)
- [Code Style Guide](docs/code-style.md)
- [Release Process](docs/release-process.md)

### API Documentation

- [SDK API Reference](docs/api/README.md)
- [CLI Commands](docs/cli-commands.md)
- [Generator Templates](docs/generators.md)

## 🧪 Testing

### Unit Tests

```bash
npm run test:unit
```

Tests individual components and utilities.

### Integration Tests

```bash
npm run test:integration
```

Tests component interactions and MCP integration.

### End-to-End Tests

```bash
npm run test:e2e
```

Full workflow testing with real MosAIc Stack.

### Performance Tests

```bash
npm run test:performance
```

Benchmarks and performance regression testing.

## 🚀 CI/CD Integration

The SDK includes CI/CD templates and configurations:

### Woodpecker CI

```yaml
# .woodpecker.yml template included
pipeline:
  test:
    image: node:20
    commands:
      - npm install
      - npm test
      - npm run build
```

### GitHub Actions

```yaml
# .github/workflows/ci.yml template included
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
```

## 🔄 Version Management

### Semantic Versioning

MosAIc Dev follows semantic versioning:
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes

### Release Channels

- `stable` - Production ready
- `beta` - Feature complete, testing
- `alpha` - Early development
- `canary` - Nightly builds

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Code Quality

All contributions must:
- Pass all tests
- Maintain 80%+ coverage
- Follow ESLint rules
- Use Prettier formatting
- Include documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [MosAIc Docs](https://docs.mosaicstack.dev)
- **Issues**: [GitHub Issues](https://github.com/jetrich/mosaic-dev/issues)
- **Discord**: [Join our Discord](https://discord.gg/mosaicstack)

---

Part of the [MosAIc Stack](https://github.com/jetrich/mosaic-sdk) - Enterprise AI Development Platform