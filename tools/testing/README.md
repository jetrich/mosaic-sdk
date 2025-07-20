# Tony Framework Testing Framework

Complete test suite, coverage analysis, and performance benchmarking for Tony Framework development.

## 📦 Contents

### Test Suites
- **`tests/`** - Main test directory with integration and unit tests
- **`core-tests/`** - Core framework component tests
- **`types-tests/`** - TypeScript type definition tests
- **`utils-tests/`** - Utility function tests
- **`version-tests/`** - Version management system tests

### Coverage Analysis
- **`coverage/`** - Test coverage reports and analysis
- **`version-coverage/`** - Version-specific coverage reports

### Configuration
- **`vitest.config.ts`** - Vitest configuration for modern testing
- **`jest.config.js`** - Jest configuration for legacy tests

### Test Utilities
- **`scripts/`** - Test execution and validation scripts
- **`fixtures/`** - Test data and mock configurations

## 🚀 Quick Start

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Performance tests only
npm run test:performance

# Core framework tests
npm run test:core

# Type definition tests
npm run test:types

# Version system tests
npm run test:version
```

### Coverage Analysis
```bash
# Generate coverage report
npm run coverage

# View coverage in browser
npm run coverage:open

# Coverage threshold check
npm run coverage:check
```

## 📋 Test Organization

### Test Categories

#### **Unit Tests** (`tests/unit/`, `core-tests/`, `types-tests/`, `utils-tests/`)
- Individual function and method testing
- Component isolation testing
- Type safety validation
- Error handling verification

#### **Integration Tests** (`tests/integration/`)
- Component interaction testing
- Workflow validation
- API integration testing
- Plugin system testing

#### **Performance Tests** (`tests/performance/`)
- Load testing and benchmarking
- Memory usage analysis
- Build time optimization
- Runtime performance validation

#### **End-to-End Tests** (`tests/e2e/`)
- Complete workflow testing
- Agent spawning validation
- Context transfer testing
- Hot-reload functionality

### Test Structure
```
testing-framework/
├── tests/                     # Main test directory
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   ├── performance/           # Performance tests
│   └── e2e/                   # End-to-end tests
├── core-tests/                # Core component tests
├── types-tests/               # TypeScript type tests
├── utils-tests/               # Utility function tests
├── version-tests/             # Version system tests
├── coverage/                  # Coverage reports
├── scripts/                   # Test execution scripts
└── fixtures/                  # Test data and mocks
```

## 🧪 Test Configuration

### Vitest Configuration (`vitest.config.ts`)
Modern test runner with TypeScript support:
```typescript
export default {
  test: {
    coverage: {
      threshold: {
        global: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        }
      }
    }
  }
}
```

### Jest Configuration (`jest.config.js`)
Legacy test runner for compatibility:
```javascript
module.exports = {
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  }
}
```

## 📊 Coverage Requirements

### Minimum Coverage Thresholds
- **Branches**: 95%
- **Functions**: 95%
- **Lines**: 95%
- **Statements**: 95%

### Coverage Reporting
- **HTML Reports**: Interactive coverage visualization
- **LCOV Reports**: Integration with CI/CD systems
- **JSON Reports**: Programmatic coverage analysis
- **Text Reports**: Command-line coverage summary

## 🔧 Test Utilities

### Test Scripts (`scripts/`)
- **`run-all-tests.sh`** - Execute complete test suite
- **`run-coverage.sh`** - Generate coverage reports
- **`validate-tests.sh`** - Validate test configuration
- **`performance-benchmark.sh`** - Run performance benchmarks

### Test Fixtures (`fixtures/`)
- **`test-contexts.json`** - Agent context test data
- **`mock-plugins.ts`** - Plugin system mocks
- **`sample-configs.json`** - Configuration test data

## 🚀 Performance Testing

### Benchmark Categories
- **Framework Loading**: Initialization time measurement
- **Plugin System**: Hot-reload performance testing
- **Agent Spawning**: Context injection speed testing
- **Memory Usage**: Resource consumption analysis

### Performance Scripts
```bash
# Run performance benchmarks
npm run perf:benchmark

# Memory usage analysis
npm run perf:memory

# Load testing
npm run perf:load

# Stress testing
npm run perf:stress
```

## 🔍 Test Development

### Writing Tests

#### Unit Test Example
```typescript
import { describe, it, expect } from 'vitest';
import { PluginSystem } from '../src/plugin-system';

describe('PluginSystem', () => {
  it('should initialize successfully', () => {
    const system = new PluginSystem();
    expect(system).toBeDefined();
    expect(system.isInitialized()).toBe(false);
  });

  it('should load plugins correctly', async () => {
    const system = new PluginSystem();
    await system.initialize();
    const result = await system.loadPlugin('test-plugin');
    expect(result.success).toBe(true);
  });
});
```

#### Integration Test Example
```typescript
import { describe, it, expect } from 'vitest';
import { spawnAgent } from '../src/spawn-agent';

describe('Agent Spawning Integration', () => {
  it('should spawn agent with context', async () => {
    const context = await loadTestContext();
    const result = await spawnAgent(context);
    expect(result.success).toBe(true);
    expect(result.agentId).toBeDefined();
  });
});
```

### Test Best Practices
1. **Descriptive Names**: Clear test descriptions
2. **Isolated Tests**: No dependencies between tests
3. **Mock External Dependencies**: Use mocks for external services
4. **Test Edge Cases**: Include error conditions and boundary cases
5. **Performance Awareness**: Monitor test execution time

## 📋 CI/CD Integration

### Test Automation
```yaml
# GitHub Actions example
- name: Run Tests
  run: |
    npm install
    npm run test:ci
    npm run coverage:check
```

### Quality Gates
- All tests must pass
- Coverage thresholds must be met
- Performance benchmarks must not regress
- No security vulnerabilities in test dependencies

## 🆘 Troubleshooting

### Common Issues

#### Test Failures
```bash
# Run tests in debug mode
npm run test:debug

# Run specific failing test
npm run test -- --reporter=verbose test-name
```

#### Coverage Issues
```bash
# Check coverage details
npm run coverage:detailed

# Identify uncovered code
npm run coverage:uncovered
```

#### Performance Issues
```bash
# Profile test execution
npm run test:profile

# Check memory usage
npm run test:memory-check
```

### Debug Tools
- **Test Reporter**: Detailed test execution reporting
- **Coverage Visualization**: Interactive coverage exploration
- **Performance Profiler**: Test execution time analysis
- **Memory Monitor**: Resource usage tracking

---

**Tony Framework Testing Framework** - Ensuring quality and reliability through comprehensive testing.