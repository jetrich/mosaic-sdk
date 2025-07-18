# MosAIc SDK

**The Enterprise AI Development Platform**

## 🌟 Overview

MosAIc SDK is the evolution of Tony SDK, transforming from a single framework into a comprehensive enterprise platform for AI-powered software development. Starting with version 2.8.0, MCP (Model Context Protocol) is mandatory, providing the foundation for all agent coordination and state management.

## 🏗️ Architecture

The MosAIc Stack consists of four core components:

- **[@tony/core](https://github.com/jetrich/tony)** (2.8.0+) - The AI development framework with UPP methodology
- **[@mosaic/core](https://github.com/jetrich/mosaic)** (0.1.0+) - Enterprise orchestration platform
- **[@mosaic/mcp](https://github.com/jetrich/mosaic-mcp)** (0.1.0+) - Infrastructure backbone for coordination
- **[@mosaic/dev](https://github.com/jetrich/mosaic-dev)** (0.1.0+) - Development tools and SDK

## 🔬 Isolated Development Environment

Develop and test MosAIc without affecting your other projects:

```bash
# Start isolated MCP server (port 3456)
./mosaic dev start

# Use MosAIc Tony/Claude in this directory only
./mosaic tony plan              # Uses MosAIc with MCP
./mosaic claude -p "Help"       # Isolated from other projects

# Your other projects remain unaffected
cd ~/other-project && tony plan  # Still uses your current Tony version
```

See [Isolated Environment Guide](docs/development/isolated-environment.md) for details.

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/jetrich/mosaic-sdk.git
cd mosaic-sdk

# Initialize submodules
git submodule update --init --recursive

# Install the MosAIc CLI
npm install -g @mosaic/cli

# Initialize MosAIc Stack
mosaic init
```

### Basic Usage

```typescript
// Tony Framework with mandatory MCP
import { TonyFramework } from '@tony/core';
import { createMCPServer } from '@mosaic/mcp';

const mcp = createMCPServer({ mode: 'local' });
const tony = new TonyFramework({ mcp });

// For enterprise orchestration
import { MosAIcCore } from '@mosaic/core';
const mosaic = new MosAIcCore({ mcp });
```

## 📦 Component Versions

| Component | Current Version | Next Milestone | GA Target |
|-----------|----------------|----------------|-----------|
| @tony/core | 2.8.0 | 2.9.0 | 3.0.0 |
| @mosaic/mcp | 0.1.0 | 0.2.0 | 1.0.0 |
| @mosaic/core | 0.1.0 | 0.2.0 | 1.0.0 |
| @mosaic/dev | 0.1.0 | 0.2.0 | 1.0.0 |

## 🔄 Migration from Tony SDK

If you're coming from Tony SDK 2.7.0 or earlier:

```bash
# Use the migration tool
npx @mosaic/migrate from-standalone

# This will:
# 1. Add MCP configuration
# 2. Update dependencies
# 3. Migrate existing projects
# 4. Validate the setup
```

See the [Migration Guide](docs/migration/tony-sdk-to-mosaic-sdk.md) for detailed instructions.

## 📚 Documentation

- [MosAIc Stack Overview](docs/mosaic-stack/overview.md)
- [Architecture Guide](docs/mosaic-stack/architecture.md)
- [Component Milestones](docs/mosaic-stack/component-milestones.md)
- [Version Roadmap](docs/mosaic-stack/version-roadmap.md)
- [Migration Documentation](docs/migration/)

## 🎯 Key Features

### For Individual Developers
- Tony Framework with AI-powered development
- Local MCP server for coordination
- CLI-driven workflow
- Minimal infrastructure requirements

### For Teams
- Multi-project orchestration
- Real-time collaboration
- Shared resource management
- Web-based dashboards

### For Enterprises
- Kubernetes-native deployment
- Advanced security and compliance
- Multi-region support
- Enterprise SLAs

## 🛠️ Development

### Prerequisites
- Node.js >= 18.0.0
- Git
- npm or yarn

### Building from Source

```bash
# Install dependencies
npm install

# Build all components
npm run build:all

# Run tests
npm test

# Start development environment
npm run dev
```

### Repository Structure

```
mosaic-sdk/
├── tony/           # Tony Framework (@tony/core) - Added after 2.7.0
├── mosaic/         # MosAIc Platform (@mosaic/core)
├── mosaic-mcp/     # MCP Server (@mosaic/mcp)
├── mosaic-dev/     # Development Tools (@mosaic/dev)
├── worktrees/      # Git worktrees for parallel development
│   ├── mosaic-worktrees/
│   ├── mosaic-mcp-worktrees/
│   └── tony-worktrees/
├── docs/           # Documentation
├── scripts/        # Build and migration scripts
└── .mosaic/        # Configuration files
```

## 🔮 Roadmap

### Q1 2025: Foundation (Current)
- ✅ MCP mandatory implementation
- ✅ Basic multi-project orchestration
- ✅ Migration tools
- 🔄 Performance optimizations

### Q2 2025: Enhancement
- Enhanced coordination algorithms
- Advanced UI components
- Machine learning integration
- Cross-project dependencies

### Q3 2025: Maturity
- Enterprise features
- Advanced analytics
- Predictive optimization
- Platform tools

### Q4 2025: General Availability
- MosAIc Stack 1.0.0
- Long-term support
- Enterprise partnerships
- Global deployment

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Process
1. Fork the repository
2. Create a feature branch (or use worktrees for parallel work)
3. Make your changes
4. Add tests
5. Submit a pull request

### Using Worktrees
```bash
# Create a new worktree for feature development
./scripts/worktree-helper.sh create mosaic-mcp feature/awesome feature-awesome

# List all worktrees
./scripts/worktree-helper.sh list

# Remove a worktree when done
./scripts/worktree-helper.sh remove mosaic-mcp feature-awesome
```

See [Worktrees Guide](docs/development/worktrees-guide.md) for detailed information.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [https://docs.mosaicstack.dev](https://docs.mosaicstack.dev)
- **GitHub Issues**: [Report bugs and request features](https://github.com/jetrich/mosaic-sdk/issues)
- **Discord Community**: [Join our Discord](https://discord.gg/mosaicstack)
- **Enterprise Support**: [enterprise@mosaicstack.dev](mailto:enterprise@mosaicstack.dev)

## 🙏 Acknowledgments

- Built on the foundation of [Tony Framework](https://github.com/jetrich/tony)
- Powered by Claude and the AI development community
- Special thanks to all contributors and early adopters

---

**MosAIc Stack** - Enterprise AI Development at Scale

*From individual productivity to enterprise orchestration*