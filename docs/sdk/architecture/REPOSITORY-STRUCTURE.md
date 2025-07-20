# MosAIc SDK Repository Structure Guide

This guide provides a comprehensive overview of the MosAIc SDK repository organization and best practices for maintaining it.

## 🏗️ Repository Overview

The MosAIc SDK is a meta-repository that orchestrates multiple components through Git submodules. Each component is independently versioned and maintained.

```
mosaic-sdk/                      # Meta-repository (this repo)
├── tony/                        # Tony Framework (@tony/core)
├── mosaic/                      # MosAIc Platform (@mosaic/core) - DO NOT MODIFY
├── mosaic-mcp/                  # MCP Server (@mosaic/mcp)
├── mosaic-dev/                  # Development Tools (@mosaic/dev)
└── worktrees/                   # Git worktrees for parallel development
```

## 📁 Detailed Structure

### Root Directory
```
mosaic-sdk/
├── .mosaic/                     # MosAIc configuration
│   ├── AGENT-QUICK-REFERENCE.md # Quick status reference
│   ├── cache/                   # Build cache
│   ├── claude/                  # Claude/MCP configuration
│   │   └── config.json         # MCP server settings
│   ├── data/                    # Isolated database
│   │   └── mcp.db              # SQLite for development
│   ├── logs/                    # Server and agent logs
│   ├── scripts/                 # Utility scripts
│   ├── templates/               # Project templates
│   ├── stack.config.json        # Stack configuration
│   └── version-matrix.json      # Version tracking
├── .claude/                     # Project Claude settings
│   ├── settings.json           # Override user settings
│   ├── settings.local.json     # Personal overrides (gitignored)
│   └── commands/               # Project-specific commands
├── .woodpecker.yml             # CI/CD pipeline configuration
├── .gitignore                  # Git ignore rules
├── .gitmodules                 # Submodule configuration
├── CLAUDE.md                   # Claude AI instructions
├── REPOSITORY-STRUCTURE.md     # This file
├── README.md                   # Main documentation
├── package.json                # Root package configuration
├── Dockerfile                  # Development container
└── mosaic                      # CLI wrapper script
```

### Submodules

#### tony/ - Tony Framework
```
tony/
├── src/                        # Source code
│   ├── core/                   # Core framework
│   ├── cli/                    # CLI implementation
│   ├── planning/               # UPP methodology
│   └── agents/                 # Agent orchestration
├── dist/                       # Built artifacts
├── tests/                      # Test suites
├── docs/                       # Documentation
└── package.json               # Package configuration
```

#### mosaic-mcp/ - MCP Server
```
mosaic-mcp/
├── src/
│   ├── server/                 # MCP server core
│   ├── tools/                  # MCP tool implementations
│   ├── services/               # Core services
│   └── db/                     # Database layer
├── dist/                       # Built artifacts
├── tests/                      # Test suites
└── Dockerfile                  # Production container
```

#### mosaic-dev/ - Development Tools
```
mosaic-dev/
├── sdk/                        # Development SDK
│   ├── development-tools/      # Build tools
│   ├── testing-framework/      # Test infrastructure
│   ├── migration-tools/        # Migration utilities
│   └── contributor-guides/     # Contributor docs
├── tools/                      # CLI tools
├── templates/                  # Project templates
└── releases/                   # Version artifacts
```

#### mosaic/ - MosAIc Platform (READ-ONLY)
```
mosaic/
├── frontend/                   # React web interface
├── backend/                    # NestJS API server
├── shared/                     # Shared types/utilities
└── infrastructure/             # Deployment configs
```

### Worktrees
```
worktrees/
├── mosaic-worktrees/           # For @mosaic/core work
│   └── core-orchestration/     # Feature branch
├── mosaic-mcp-worktrees/       # For MCP development
├── mosaic-dev-worktrees/       # For dev tools
└── tony-worktrees/             # For Tony framework
```

### Documentation
```
docs/
├── README.md                   # Documentation index
├── api/                        # API documentation
├── architecture/               # Architecture guides
├── deployment/                 # Deployment guides
├── development/                # Development guides
├── mcp-integration/            # MCP documentation
├── operations/                 # Operations guides
├── services/                   # Service documentation
└── troubleshooting/            # Troubleshooting guides
```

### Deployment
```
deployment/
├── docker/                     # Docker configurations
├── infrastructure/             # Infrastructure configs
├── services/                   # Service configurations
│   ├── gitea/                 # Git service
│   ├── bookstack/             # Documentation
│   ├── woodpecker/            # CI/CD
│   └── plane/                 # Project management
├── scripts/                    # Deployment scripts
├── agents/                     # Agent deployment
└── backup/                     # Backup configurations
```

## 🔧 Working with Submodules

### Initial Setup
```bash
# Clone with submodules
git clone --recursive https://github.com/jetrich/mosaic-sdk.git

# Or initialize after cloning
git submodule update --init --recursive
```

### Updating Submodules
```bash
# Update all submodules to latest
git submodule update --remote

# Update specific submodule
cd mosaic-mcp
git pull origin main
cd ..
git add mosaic-mcp
git commit -m "Update mosaic-mcp to latest"
```

### Working in Submodules
```bash
# Make changes in submodule
cd mosaic-mcp
git checkout -b feature/my-feature
# ... make changes ...
git commit -m "Add feature"
git push origin feature/my-feature

# Update parent repository
cd ..
git add mosaic-mcp
git commit -m "Update mosaic-mcp ref"
```

## 🌿 Working with Worktrees

### Creating Worktrees
```bash
# Use the helper script
./scripts/worktree-helper.sh create mosaic-mcp feature/new-tool new-tool

# Or manually
cd mosaic-mcp
git worktree add ../worktrees/mosaic-mcp-worktrees/new-tool feature/new-tool
```

### Benefits of Worktrees
- Work on multiple features simultaneously
- Keep main submodule clean
- Easy context switching
- Parallel development

## 📝 Best Practices

### 1. Submodule Management
- Always commit submodule changes first
- Update parent repo reference after submodule changes
- Use descriptive commit messages for submodule updates
- Keep submodules on stable branches in production

### 2. Version Management
- Follow semantic versioning for all components
- Update `.mosaic/version-matrix.json` when releasing
- Tag releases in both submodules and parent repo
- Maintain compatibility matrix

### 3. Development Workflow
- Use worktrees for feature development
- Keep main branches stable
- Run tests before pushing
- Update documentation with code changes

### 4. Documentation
- Keep README files up to date
- Document breaking changes
- Update API documentation
- Maintain changelog

### 5. CI/CD
- All changes trigger CI pipeline
- Tests must pass before merging
- Use branch protection rules
- Automate releases where possible

## 🚫 Common Pitfalls

### 1. Forgetting to Update Submodules
```bash
# Always run after pulling
git submodule update --init --recursive
```

### 2. Committing to Wrong Directory
- Check `pwd` before making changes
- Use `git status` to verify location

### 3. Detached HEAD in Submodules
```bash
# Fix detached HEAD
cd submodule-name
git checkout main
git pull
```

### 4. Merge Conflicts in Submodules
- Resolve in submodule first
- Then update parent reference

## 🔐 Security Considerations

### 1. Environment Files
- Never commit `.env` files
- Use `.env.example` as template
- Store secrets securely

### 2. Database Files
- Keep `*.db` files gitignored
- Don't commit test data
- Use migrations for schema

### 3. Credentials
- No hardcoded credentials
- Use environment variables
- Rotate keys regularly

## 🆘 Getting Help

### Resources
- [Main README](README.md)
- [CLAUDE.md](CLAUDE.md) - AI agent instructions
- [Documentation Index](docs/README.md)
- [Troubleshooting Guide](docs/troubleshooting/README.md)

### Support Channels
- GitHub Issues: Component-specific issues
- Discord: Community support
- Email: enterprise@mosaicstack.dev

---

This structure is designed to support enterprise-scale development while maintaining simplicity for individual developers. Each component can evolve independently while the meta-repository ensures compatibility and coordination.