# Tony Framework Development SDK - Claude Instructions

**Repository**: `jetrich/tony-dev`  
**Purpose**: Development SDK for Tony Framework contributors  
**Audience**: Framework developers, contributors, and maintainers  

## 📋 Repository Organization Standards

### 🎯 Core Principles

1. **Clear Separation**: Development tools, production framework, and support materials must remain clearly separated
2. **Zero Data Loss**: All development assets must be preserved and accessible
3. **Professional Structure**: Maintain enterprise-grade organization and documentation
4. **Contributor Focus**: Structure optimized for developer experience and contribution workflows

### 📁 Mandatory Directory Structure

```
tony-dev/
├── sdk/                        # Development SDK Components (CORE)
│   ├── development-tools/      # Build tools, TypeScript configs
│   ├── testing-framework/      # Complete test suite and coverage
│   ├── migration-tools/        # Version migration utilities
│   └── contributor-guides/     # Developer documentation
├── releases/                   # Version Management (ARCHIVE)
│   └── v2.6.0/                # Version-specific artifacts
│       ├── release-notes/      # Release documentation
│       ├── distribution/       # Distribution packages
│       └── migration-guides/   # Version migration guides
├── framework-source/           # Framework Source Code (PROTECTED)
│   ├── tony/                   # Clean production framework
│   └── development-assets/     # Development documentation
├── bootstrap/                  # Installation & Conversion (LEGACY)
│   ├── installation/           # Installation scripts
│   ├── legacy/                 # Legacy compatibility
│   └── conversion/             # Polyrepo conversion tools
├── docs/                       # Development Documentation
├── examples/                   # Usage Examples & Tutorials
└── scripts/                    # Development Automation
```

## 🚨 CRITICAL: Protected Areas

### ⚠️ Framework Source Protection (`framework-source/tony/`)
- **NEVER** add development artifacts to this directory
- **NEVER** add test files, coverage reports, or build artifacts
- **NEVER** add version-specific documentation
- **ONLY** production-ready code, essential scripts, and production documentation
- This directory must remain clean for extraction to `jetrich/tony` production repository

### 🔒 Version Archive Protection (`releases/`)
- **NEVER** modify existing version directories
- **ONLY** add new versions in new directories
- **MAINTAIN** complete version history and artifacts
- **PRESERVE** distribution packages and documentation

## 📝 File Organization Rules

### Development Tools (`sdk/development-tools/`)
- TypeScript configurations for all environments
- Build and compilation tools
- Development dependency management
- Code quality tools (ESLint, Prettier, etc.)

### Testing Framework (`sdk/testing-framework/`)
- All test files (`.spec.ts`, `.test.ts`, `.test.sh`)
- Coverage reports and analysis
- Test configuration files (vitest.config.ts, jest.config.js)
- Mock data and test fixtures

### Migration Tools (`sdk/migration-tools/`)
- Version upgrade scripts (`upgrade/`)
- Framework conversion tools (`conversion/`)
- Diagnostic and troubleshooting tools (`diagnostic/`)
- Cleanup and maintenance utilities (`cleanup/`)
- Distribution packaging tools (`packaging/`)

### Documentation Standards (`docs/`)
- Development setup guides
- Architecture and design documentation
- API documentation and references
- Troubleshooting guides

## 🔄 Workflow Standards

### Adding New Components
1. **Determine Category**: Identify if it's development tool, test, migration tool, or documentation
2. **Follow Structure**: Place in appropriate SDK subdirectory
3. **Update Documentation**: Add to relevant README.md files
4. **Maintain Separation**: Keep production framework clean

### Version Management
1. **New Releases**: Create new directory under `releases/vX.Y.Z/`
2. **Archive Artifacts**: Store all distribution packages and documentation
3. **Migration Guides**: Document upgrade procedures
4. **Clean Production**: Extract clean framework to production repository

### Testing Changes
1. **Test Isolation**: All tests must be in `sdk/testing-framework/`
2. **Coverage Maintenance**: Maintain 95% minimum coverage
3. **Documentation**: Update testing documentation for new tests
4. **Validation**: Run full test suite before commits

## 🎯 Quality Standards

### Code Quality
- **TypeScript Strict Mode**: All TypeScript must pass strict compilation
- **ESLint Zero Errors**: No linting errors allowed
- **Test Coverage**: 95% minimum coverage for new code
- **Documentation**: JSDoc comments for all public APIs

### Documentation Quality
- **Complete Coverage**: Every component must have documentation
- **Clear Examples**: Provide usage examples for all features
- **Up-to-Date**: Documentation must be updated with code changes
- **Professional Tone**: Maintain professional, clear writing

### Commit Standards
```
type(scope): brief description

Detailed description if needed

- List specific changes
- Include breaking changes if any
- Reference issues if applicable

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types**: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `build`, `ci`
**Scopes**: `sdk`, `testing`, `migration`, `docs`, `framework`, `release`

## 🛠️ Development Environment

### Required Tools
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher  
- **TypeScript**: v5.0.0 or higher
- **Git**: v2.30.0 or higher

### Setup Commands
```bash
# Clone repository
git clone https://github.com/jetrich/tony-dev.git
cd tony-dev

# Install dependencies
npm install

# Setup development environment
npm run sdk:setup

# Verify installation
npm run sdk:verify
```

### Available Scripts
```bash
# Development
npm run dev                     # Start development environment
npm run build                   # Build all components
npm run test                    # Run test suite

# Quality
npm run lint                    # Run linting
npm run type-check              # TypeScript checking
npm run quality:check           # Complete quality check

# SDK Management
npm run sdk:install             # Install SDK components
npm run sdk:clean               # Clean build artifacts
npm run sdk:update              # Update dependencies
```

## 🚫 Common Mistakes to Avoid

### ❌ Don't Do This
- Add test files to `framework-source/tony/`
- Mix development and production code
- Modify existing version directories
- Add build artifacts to git
- Use inconsistent naming conventions
- Skip documentation updates

### ✅ Do This Instead
- Keep all tests in `sdk/testing-framework/`
- Maintain clear separation of concerns
- Create new version directories for releases
- Use `.gitignore` for build artifacts
- Follow consistent naming patterns
- Update documentation with code changes

## 🎯 Contribution Guidelines

### For Framework Contributors
1. **Make changes in `framework-source/tony/`**
2. **Run tests from `sdk/testing-framework/`**
3. **Update documentation as needed**
4. **Maintain production framework cleanliness**

### For SDK Contributors
1. **Work in appropriate `sdk/` subdirectories**
2. **Follow component organization rules**
3. **Add tests for new functionality**
4. **Update SDK documentation**

### For Documentation Contributors
1. **Update relevant README files**
2. **Maintain consistency across docs**
3. **Provide clear examples**
4. **Keep documentation current**

## 📊 Success Metrics

### Repository Health
- All builds pass
- Test coverage ≥95%
- Zero TypeScript errors
- Zero ESLint errors
- Documentation completeness

### Organization Quality
- Clear separation maintained
- No development artifacts in production framework
- Consistent naming and structure
- Complete version archives

## 🆘 Getting Help

### Resources
- **README.md**: Repository overview and quick start
- **CONTRIBUTING.md**: Detailed contribution guidelines
- **SDK Documentation**: Component-specific documentation
- **Examples**: Usage examples and tutorials

### Support Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community discussion
- **Documentation**: Comprehensive guides for all use cases

## 🔮 Future Evolution

### Planned Enhancements
- Enhanced automation scripts
- Additional development tools
- Expanded testing frameworks
- Improved contributor experience

### Principles to Maintain
- Zero data loss policy
- Clear organizational structure
- Professional documentation standards
- Contributor-focused design

---

## 🎯 Remember: This is a Development SDK

This repository exists to support Tony Framework development. Every file, directory, and organizational decision should optimize for:

1. **Contributor Experience**: Easy to understand, navigate, and contribute
2. **Framework Quality**: Tools and processes that ensure high-quality output
3. **Production Readiness**: Clean separation enabling professional deployment
4. **Long-term Maintainability**: Structure that scales with project growth

**When in doubt, prioritize clarity, separation of concerns, and contributor experience.**

---

**Tony Framework Development SDK** - Organized for excellence, built for collaboration.