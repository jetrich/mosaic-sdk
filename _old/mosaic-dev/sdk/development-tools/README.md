# Tony Framework Development Tools

Build tools, TypeScript configurations, and development dependencies for Tony Framework development.

## 📦 Contents

### Configuration Files
- **`tsconfig.json`** - Main TypeScript configuration
- **`version-tsconfig.json`** - Version system TypeScript configuration
- **`version-package.json`** - Version system package configuration
- **`package-lock.json`** - Development dependency lock file

### Build Tools
- **`scripts/`** - Build and development automation scripts
- **`configs/`** - Environment-specific configurations
- **`templates/`** - Project templates and scaffolding

### Development Utilities
- **`linting/`** - Code quality and linting tools
- **`formatting/`** - Code formatting configurations
- **`debugging/`** - Debugging and profiling tools

## 🚀 Quick Start

### Setup Development Environment
```bash
npm run setup-dev-env
```

### Build Framework
```bash
npm run build:framework
npm run build:production
```

### Development Mode
```bash
npm run dev:watch
npm run dev:hot-reload
```

## 🔧 TypeScript Configuration

### Main Configuration (`tsconfig.json`)
Production-ready TypeScript configuration with strict type checking:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "outDir": "./dist"
  }
}
```

### Version System Configuration (`version-tsconfig.json`)
Specialized configuration for version management components:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist/version"
  },
  "include": ["../../framework-source/tony/core/version/**/*"]
}
```

## 🛠️ Build System

### Available Build Scripts

#### Framework Building
```bash
# Production build
npm run build:production

# Development build
npm run build:development

# Watch mode
npm run build:watch

# Clean build
npm run build:clean
```

#### Component Building
```bash
# Core components
npm run build:core

# Plugin system
npm run build:plugins

# Version system
npm run build:version

# Utilities
npm run build:utils
```

### Build Optimization
- **Tree Shaking**: Unused code elimination
- **Code Splitting**: Dynamic import optimization
- **Minification**: Production code compression
- **Source Maps**: Debugging support

## 🎯 Development Workflows

### Hot Development
```bash
# Start development server
npm run dev:start

# Watch for changes
npm run dev:watch

# Hot reload plugins
npm run dev:hot-reload
```

### Code Quality
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format

# Full quality check
npm run quality:check
```

### Testing Integration
```bash
# Build and test
npm run build:test

# Test with coverage
npm run test:coverage

# Performance testing
npm run test:performance
```

## 📋 Environment Configurations

### Development Environment
```bash
# Development mode settings
NODE_ENV=development
TONY_DEV_MODE=true
TONY_HOT_RELOAD=true
TONY_DEBUG=true
```

### Production Environment
```bash
# Production mode settings
NODE_ENV=production
TONY_OPTIMIZE=true
TONY_MINIFY=true
TONY_SOURCE_MAPS=false
```

### Testing Environment
```bash
# Testing mode settings
NODE_ENV=test
TONY_TEST_MODE=true
TONY_MOCK_EXTERNAL=true
TONY_COVERAGE=true
```

## 🔍 Code Quality Tools

### ESLint Configuration
```javascript
module.exports = {
  extends: [
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error'
  }
};
```

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

## 🚀 Performance Optimization

### Build Performance
- **Incremental Compilation**: Faster rebuilds
- **Parallel Processing**: Multi-core utilization
- **Caching**: Build result caching
- **Watch Mode**: Efficient file watching

### Runtime Performance
- **Bundle Analysis**: Size optimization
- **Code Splitting**: Lazy loading
- **Tree Shaking**: Dead code elimination
- **Minification**: Size reduction

## 🔧 Development Scripts

### Setup Scripts
```bash
# Initial environment setup
./scripts/setup-development.sh

# Dependencies installation
./scripts/install-dependencies.sh

# Tool verification
./scripts/verify-tools.sh
```

### Build Scripts
```bash
# Complete build process
./scripts/build-framework.sh

# Production packaging
./scripts/package-production.sh

# Development setup
./scripts/setup-dev-environment.sh
```

### Maintenance Scripts
```bash
# Dependency updates
./scripts/update-dependencies.sh

# Clean workspace
./scripts/clean-workspace.sh

# Reset environment
./scripts/reset-development.sh
```

## 📊 Monitoring & Analytics

### Build Metrics
- Build time tracking
- Bundle size analysis
- Dependency analysis
- Performance benchmarks

### Development Metrics
- Hot reload performance
- Type checking speed
- Linting execution time
- Test execution performance

## 🆘 Troubleshooting

### Common Issues

#### TypeScript Compilation Errors
```bash
# Clean TypeScript cache
npm run ts:clean

# Rebuild type definitions
npm run ts:rebuild

# Verify configuration
npm run ts:verify
```

#### Build Failures
```bash
# Clean build artifacts
npm run build:clean

# Reset dependencies
npm run deps:reset

# Rebuild from scratch
npm run rebuild:all
```

#### Development Server Issues
```bash
# Reset development server
npm run dev:reset

# Clear development cache
npm run dev:clean

# Restart with debug
npm run dev:debug
```

### Debug Tools
- **Source Maps**: Debug compiled code
- **Type Inspector**: TypeScript type analysis
- **Build Analyzer**: Bundle composition analysis
- **Performance Profiler**: Build performance analysis

## 📚 Documentation

### Configuration Guides
- [TypeScript Setup Guide](docs/typescript-setup.md)
- [Build System Guide](docs/build-system.md)
- [Development Workflow](docs/development-workflow.md)
- [Performance Optimization](docs/performance-optimization.md)

### Best Practices
- [Code Quality Standards](docs/code-quality.md)
- [Development Guidelines](docs/development-guidelines.md)
- [Build Optimization](docs/build-optimization.md)
- [Debugging Techniques](docs/debugging.md)

---

**Tony Framework Development Tools** - Professional development environment for framework contributors.