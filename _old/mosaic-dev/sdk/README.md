# Tony Framework SDK Components

The Tony Framework SDK provides comprehensive development tools and infrastructure for framework contributors.

## 📦 SDK Components

### 🔧 Development Tools (`development-tools/`)
Build tools, TypeScript configurations, and development dependencies for framework development.

**Contents:**
- TypeScript configurations for various environments
- Build and compilation scripts
- Development dependency manifests
- Code quality and linting tools
- Environment setup utilities

**Usage:**
```bash
cd sdk/development-tools
npm install
npm run setup-dev-env
```

### 🧪 Testing Framework (`testing-framework/`)
Complete test suite, coverage analysis, and performance benchmarking tools.

**Contents:**
- Unit test suites for all framework components
- Integration tests for workflow validation
- Performance benchmarks and stress tests
- Coverage analysis and reporting
- Mock data and test fixtures

**Usage:**
```bash
cd sdk/testing-framework
npm test
npm run coverage
npm run performance
```

### 🔄 Migration Tools (`migration-tools/`)
Version migration utilities, upgrade scripts, and legacy compatibility tools.

**Contents:**
- Framework version upgrade utilities
- Legacy compatibility layers
- Migration validation tools
- Conversion scripts for structural changes
- Rollback and recovery utilities

**Usage:**
```bash
cd sdk/migration-tools
./upgrade-framework.sh --from v2.5.0 --to v2.6.0
./validate-migration.sh
```

### 📚 Contributor Guides (`contributor-guides/`)
Documentation and guides for framework contributors and maintainers.

**Contents:**
- Development environment setup guides
- Coding standards and best practices
- Architecture and design documentation
- Release management procedures
- Troubleshooting and debugging guides

**Usage:**
```bash
# Reference documentation
cat sdk/contributor-guides/setup-guide.md
cat sdk/contributor-guides/coding-standards.md
```

## 🚀 Quick Start

### Full SDK Setup
```bash
# Install all SDK components
npm run sdk:install

# Setup development environment
npm run sdk:setup

# Verify installation
npm run sdk:verify
```

### Individual Component Setup
```bash
# Development tools only
npm run setup:dev-tools

# Testing framework only  
npm run setup:testing

# Migration tools only
npm run setup:migration
```

## 📋 Available Scripts

### SDK Management
```bash
npm run sdk:install           # Install all SDK components
npm run sdk:setup             # Setup complete development environment
npm run sdk:verify            # Verify SDK installation
npm run sdk:clean             # Clean all build artifacts
npm run sdk:update            # Update all components
```

### Development
```bash
npm run dev:framework         # Start framework development mode
npm run dev:tools             # Start tools development mode
npm run build:all             # Build all components
npm run build:framework       # Build production framework
npm run build:tools           # Build development tools
```

### Testing
```bash
npm run test:all              # Run all test suites
npm run test:unit             # Run unit tests only
npm run test:integration      # Run integration tests only
npm run test:performance      # Run performance tests only
npm run coverage              # Generate coverage reports
```

### Quality Assurance
```bash
npm run lint                  # Run all linters
npm run lint:fix              # Fix linting issues
npm run type-check            # TypeScript type checking
npm run format                # Format code with Prettier
npm run quality:check         # Complete quality check
```

### Migration & Maintenance
```bash
npm run migrate:prepare       # Prepare migration environment
npm run migrate:execute       # Execute migration
npm run migrate:validate      # Validate migration results
npm run migrate:rollback      # Rollback migration
```

## 🔧 Configuration

### Environment Variables
```bash
# Development mode
TONY_DEV_MODE=true

# Testing configuration
TONY_TEST_ENV=development
TONY_COVERAGE_THRESHOLD=95

# Build configuration
TONY_BUILD_MODE=development
TONY_OPTIMIZE_BUILD=false
```

### Configuration Files
- **`sdk.config.js`** - Main SDK configuration
- **`development-tools/tsconfig.json`** - TypeScript configuration
- **`testing-framework/vitest.config.ts`** - Test configuration
- **`migration-tools/migration.config.js`** - Migration configuration

## 📊 Monitoring & Analytics

### Development Metrics
- Build times and performance
- Test execution times
- Coverage trending
- Code quality metrics

### Testing Analytics
- Test pass/fail rates
- Coverage analysis
- Performance benchmarks
- Regression detection

### Migration Tracking
- Migration success rates
- Rollback frequency
- Compatibility metrics
- User adoption tracking

## 🆘 Troubleshooting

### Common Issues

#### SDK Installation Problems
```bash
# Clean and reinstall
npm run sdk:clean
npm run sdk:install
```

#### Test Failures
```bash
# Run specific test suite
npm run test:debug
# Check test environment
npm run test:env-check
```

#### Build Issues
```bash
# Clean build
npm run build:clean
npm run build:all
```

### Debug Mode
```bash
# Enable debug logging
export TONY_DEBUG=true
npm run dev:framework
```

### Support Resources
- **Documentation**: [docs/troubleshooting.md](../docs/troubleshooting.md)
- **Issues**: [GitHub Issues](https://github.com/jetrich/tony-dev/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jetrich/tony-dev/discussions)

---

**Tony Framework SDK** - Complete development infrastructure for framework contributors.