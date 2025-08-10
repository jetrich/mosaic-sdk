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

See [Isolated Environment Guide](mosaic-docs/engineering/getting-started/quick-start/03-isolated-environment.md) for details.

## 📚 Documentation

### SDK Documentation
- [Organizational Structure](docs/sdk/architecture/ORGANIZATIONAL-STRUCTURE.md) - 4-domain architecture
- [Repository Structure](docs/sdk/architecture/REPOSITORY-STRUCTURE.md) - Component overview  
- [Git Setup Guide](docs/sdk/development/GIT-SETUP-SUMMARY.md) - Version control setup
- [Pre-Push Checklist](docs/sdk/development/PRE-PUSH-CHECKLIST.md) - Quality checks
- [Project Status](docs/sdk/operations/STATUS.md) - Current state

### Full Documentation
Complete documentation is available in the [mosaic-docs](mosaic-docs/) submodule.

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

## 🖥️ Terminal UI (OpenCode Integration)

MosAIc Stack includes integration with [OpenCode](https://github.com/sst/opencode) for a sophisticated terminal-based development experience that combines OpenCode's professional TUI with MosAIc's enterprise capabilities.

### Prerequisites

```bash
# Install Bun runtime (required by OpenCode)
curl -fsSL https://bun.sh/install | bash

# Install OpenCode CLI
npm install -g opencode-ai@latest

# Verify installation
opencode --version
```

### Quick Start with TUI

```bash
# Configure OpenCode for MosAIc integration
mosaic tui setup

# Launch OpenCode TUI with MosAIc integration
mosaic tui

# Or use specific modes
mosaic tui --mode mosaic-plan    # Enterprise planning mode
mosaic tui --mode mosaic-execute # Full development mode
```

### Available Modes

- **`mosaic-plan`**: Planning mode with enterprise task management tools
- **`mosaic-execute`**: Full development mode with agent orchestration
- **`build`**: Standard OpenCode build mode (default)
- **`plan`**: Standard OpenCode planning mode

### Integration Features

- ✅ **Zero OpenCode Modifications**: Plugin-based integration via MCP servers
- ✅ **Enterprise Task Management**: Hierarchical task tracking with UPP methodology
- ✅ **Multi-Project Coordination**: Switch between projects seamlessly
- ✅ **Agent Orchestration**: Spawn and coordinate specialized AI agents
- ✅ **Automatic Updates**: Benefit from OpenCode team's continuous improvements
- ✅ **Web Monitoring**: Optional web UI for task and progress monitoring

### Configuration

The integration works through Model Context Protocol (MCP) servers. Configuration is automatically generated, but can be customized:

```json
{
  "mcp": {
    "mosaic": {
      "type": "local",
      "command": ["mosaic-mcp", "serve"],
      "environment": {
        "MOSAIC_CONFIG": "~/.mosaic/config.json"
      }
    }
  },
  "mode": {
    "mosaic-plan": {
      "prompt": "You are using MosAIc planning mode with enterprise task management tools.",
      "tools": {
        "mosaic_task_create": true,
        "mosaic_task_assign": true,
        "mosaic_project_switch": true
      }
    }
  }
}
```

For detailed setup instructions, see the [OpenCode Setup Guide](docs/sdk/operations/OPENCODE-SETUP-GUIDE.md).

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

### Agent Persona System
- **Consistent Agent Behaviors**: 20+ predefined personas across all development domains
- **Personality-Driven Interactions**: Each agent has unique communication style and expertise
- **Automatic Persona Selection**: Tony intelligently assigns personas based on task keywords
- **Domain Specialization**: From CEO-level strategy to backend implementation
- **Tool & Model Optimization**: Each persona uses appropriate tools and AI models

### For Individual Developers
- Tony Framework with AI-powered development
- Local MCP server for coordination
- CLI-driven workflow
- Minimal infrastructure requirements
- Personality-driven agent assistance

### For Teams
- Multi-project orchestration
- Real-time collaboration
- Shared resource management
- Web-based dashboards
- Consistent agent behaviors across team

### For Enterprises
- Kubernetes-native deployment
- Advanced security and compliance
- Multi-region support
- Enterprise SLAs
- Standardized agent personas for quality control

## 🛠️ Development

### Prerequisites
- Node.js >= 18.0.0
- Git
- npm or yarn
- yq (YAML processor) - Required for Agent Persona System
  - macOS: `brew install yq`
  - Linux: `sudo snap install yq` or see [persona requirements](.mosaic/templates/agents/requirements.txt)

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
├── .woodpecker.yml       # CI/CD pipeline configuration
├── Dockerfile            # Development environment container
├── tony/                 # Tony Framework (submodule)
├── mosaic/              # MosAIc Platform (submodule)
├── mosaic-mcp/          # MCP Server (submodule)
├── mosaic-dev/          # Development SDK (submodule)
└── worktrees/           # Git worktrees for development
```

## 🚀 CI/CD Pipeline

MosAIc SDK uses Woodpecker CI for continuous integration across all components:

### Pipeline Features
- **Submodule Management**: Automatic initialization and updates
- **Component Testing**: Parallel testing of all SDK components
- **Integration Testing**: Cross-component integration validation
- **Isolated MCP Testing**: Validates isolated development environment
- **Security Auditing**: Vulnerability scanning across all dependencies
- **Docker Support**: Multi-component containerization
- **Release Automation**: Automated release artifact creation

### Running CI/CD Locally
```bash
# Verify structure and submodules
npm run verify

# Build all components
npm run build:all

# Run all tests
npm test

# Test isolated MCP environment
npm run dev:start
npm run dev:status
npm run dev:stop
```

### Docker Images
Each component has its own optimized Docker image:
- **tony-framework**: CLI framework with planning engine
- **mosaic-frontend**: React web interface
- **mosaic-backend**: NestJS API server
- **mosaic-mcp**: MCP coordination server
- **mosaic-dev**: Development tools container
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