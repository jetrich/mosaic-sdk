# Contributing to Tony Framework

Welcome to the Tony Framework Development SDK! This guide will help you get started with contributing to the Tony Framework ecosystem.

## 🎯 Ways to Contribute

### 🔧 Core Framework Development
- Bug fixes and feature development
- Performance improvements
- Documentation updates
- Plugin system enhancements

### 🧪 Testing & Quality Assurance
- Writing and improving tests
- Performance benchmarking
- Coverage analysis
- Quality assurance validation

### 📚 Documentation & Examples
- Developer documentation
- Usage examples and tutorials
- Migration guides
- Best practices documentation

### 🛠️ Development Tools
- Build and development tooling
- Testing infrastructure
- Migration utilities
- Contributor experience improvements

## 🚀 Getting Started

### 1. Development Environment Setup

```bash
# Clone the development SDK
git clone https://github.com/jetrich/tony-dev.git
cd tony-dev

# Install dependencies
npm install

# Verify setup
npm test
npm run build
```

### 2. Repository Structure Understanding

Familiarize yourself with the repository structure:

- **`framework-source/tony/`** - Production framework source code
- **`sdk/development-tools/`** - Build and development tools
- **`sdk/testing-framework/`** - Test suites and coverage tools
- **`sdk/migration-tools/`** - Version migration utilities
- **`releases/`** - Version artifacts and distribution packages

### 3. Development Workflow

1. **Fork & Clone**: Fork the repository and clone your fork
2. **Branch**: Create a feature branch from `main`
3. **Develop**: Make your changes following our coding standards
4. **Test**: Run tests and ensure coverage requirements
5. **Document**: Update documentation as needed
6. **Submit**: Create a pull request with clear description

## 📋 Development Standards

### Code Quality Requirements

#### TypeScript Standards
- Strict TypeScript configuration required
- 100% type coverage for new code
- ESLint configuration must pass
- Prettier formatting enforced

#### Testing Requirements
- 95% minimum test coverage for new features
- Unit tests for all new functions/methods
- Integration tests for new workflows
- Performance tests for performance-critical changes

#### Documentation Requirements
- JSDoc comments for all public APIs
- README updates for new features
- Migration guides for breaking changes
- Examples for new functionality

### Commit Message Format

```
type(scope): brief description

Detailed description if needed

Fixes #issue-number
```

**Types**: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `build`, `ci`

**Examples**:
```
feat(core): add hot-reload capability for plugins
fix(testing): resolve race condition in test suite
docs(contrib): update contributor guidelines
```

## 🧪 Testing Guidelines

### Running Tests

```bash
# All tests
npm test

# Specific test suites
npm run test:unit
npm run test:integration
npm run test:performance

# Coverage analysis
npm run test:coverage
```

### Test Organization

- **Unit Tests**: `sdk/testing-framework/tests/unit/`
- **Integration Tests**: `sdk/testing-framework/tests/integration/`
- **Performance Tests**: `sdk/testing-framework/tests/performance/`
- **Fixtures**: `sdk/testing-framework/fixtures/`

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { PluginSystem } from '../src/plugin-system';

describe('PluginSystem', () => {
  it('should initialize successfully', () => {
    const system = new PluginSystem();
    expect(system).toBeDefined();
  });
});
```

## 📦 Build & Release Process

### Development Builds

```bash
# Build framework
npm run build:framework

# Build SDK tools
npm run build:sdk

# Build all
npm run build
```

### Release Process

1. **Version Bump**: Update versions in package.json files
2. **Changelog**: Update CHANGELOG.md with new features/fixes
3. **Testing**: Run full test suite including performance tests
4. **Documentation**: Update documentation and examples
5. **Release**: Create release PR and tag

## 🔧 Framework Development

### Core Framework (`framework-source/tony/`)

This contains the production-ready Tony Framework code. When making changes:

1. **Maintain Compatibility**: Ensure backward compatibility
2. **Clean Structure**: Keep production framework free of dev artifacts
3. **Documentation**: Update framework documentation
4. **Testing**: Verify production build works correctly

### SDK Development (`sdk/`)

When developing SDK tools:

1. **Tool Quality**: Ensure tools work across environments
2. **Documentation**: Provide clear usage examples
3. **Testing**: Test tools with various scenarios
4. **Integration**: Ensure tools work together seamlessly

## 🚨 Issue Guidelines

### Reporting Bugs

Use the bug report template and include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment information
- Relevant logs or screenshots

### Feature Requests

Use the feature request template and include:
- Problem statement
- Proposed solution
- Alternative solutions considered
- Implementation considerations

### Pull Requests

- **Clear Title**: Descriptive title summarizing changes
- **Description**: Detailed description of changes and reasoning
- **Testing**: Evidence of testing (screenshots, test output)
- **Documentation**: Updated documentation if needed
- **Breaking Changes**: Clearly marked if applicable

## 📚 Resources

### Documentation
- [Development Setup Guide](docs/development-setup.md)
- [Architecture Overview](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Testing Guide](docs/testing-guide.md)

### Communication
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and community discussion
- **Pull Requests**: Code review and collaboration

### Learning Resources
- [Tony Framework Documentation](https://tony-framework.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)

## 🏆 Recognition

Contributors are recognized through:
- Contributor list in README
- Release notes acknowledgments
- GitHub contributor statistics
- Optional contributor Discord access

## 📄 License

By contributing to Tony Framework, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Tony Framework! Your contributions help make AI development orchestration better for everyone. 🎉