# Tony SDK Testing Framework Structure

This document describes the testing framework structure for the Tony Development SDK.

## 📁 Test Directory Organization

```
sdk/testing-framework/
├── core-tests/                          # Basic infrastructure tests
│   └── testing-infrastructure.spec.ts  # Testing framework validation
├── development-tools-tests/             # Development tools testing
│   └── development-tools.spec.ts       # Package configs, TypeScript setup
├── migration-tools-tests/               # Migration tools testing
│   └── migration-tools.spec.ts         # Scripts, utilities, safety checks
├── task-management-tests/               # Task management testing
│   └── task-management.spec.ts         # State, planning, integration
├── testing-framework-tests/             # Testing framework self-testing
│   └── testing-framework-self.spec.ts  # Vitest config, test infrastructure
├── tests/                               # Shared test utilities
│   ├── test-setup.ts                   # Global test configuration
│   └── fixtures/                       # Test fixtures and mock data
└── coverage/                            # Coverage reports (generated)
```

## 🎯 Test Categories

### Core Tests (`core-tests/`)
- Basic testing infrastructure validation
- Vitest functionality verification
- Mock creation and validation

### Development Tools Tests (`development-tools-tests/`)
- Package.json validation
- TypeScript configuration testing
- Build tool configuration verification
- SDK component structure validation

### Migration Tools Tests (`migration-tools-tests/`)
- Shell script structure and safety
- Upgrade utility functionality
- Cleanup and diagnostic tools
- Distribution packaging validation

### Task Management Tests (`task-management-tests/`)
- Planning system validation
- State management testing
- CI/CD integration verification
- Agent coordination testing

### Testing Framework Tests (`testing-framework-tests/`)
- Vitest configuration validation
- Test setup and teardown
- Coverage configuration
- Test runner functionality

## 🧪 Test Types

### Unit Tests
- Individual component testing
- Configuration validation
- Utility function testing
- Mock behavior verification

### Integration Tests
- Component interaction testing
- Configuration interoperability
- Script execution validation
- JSON schema compliance

### Infrastructure Tests
- Directory structure validation
- File existence checking
- Permission and security validation
- Performance benchmarking

## 🚀 Running Tests

### All Tests
```bash
npm test                    # Run all test suites
npm run test:all           # Comprehensive test run
```

### Specific Test Categories
```bash
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:performance   # Performance tests only
```

### Individual Test Suites
```bash
# Development tools
vitest run development-tools-tests

# Migration tools
vitest run migration-tools-tests

# Task management
vitest run task-management-tests

# Testing framework
vitest run testing-framework-tests
```

### Coverage
```bash
npm run coverage           # Generate coverage report
npm run coverage:open      # Open coverage in browser
npm run coverage:check     # Validate coverage thresholds
```

## 📊 Coverage Standards

- **Minimum Coverage**: 80% (branches, functions, lines, statements)
- **Target Coverage**: 95% for new SDK components
- **Coverage Excludes**: Build artifacts, node_modules, fixtures

## 🔧 Test Configuration

### Vitest Configuration (`vitest.config.ts`)
- SDK-focused module resolution
- Node.js environment
- Coverage reporting with v8 provider
- Global test utilities

### Test Setup (`tests/test-setup.ts`)
- Global test utilities
- Console mocking for clean output
- SDK-specific mock helpers
- Configuration validation utilities

## 🛡️ Testing Best Practices

### Test Isolation
- Each test should be independent
- Use beforeEach/afterEach for cleanup
- Avoid shared state between tests

### SDK Focus
- Test SDK components, not framework code
- Validate configurations and structure
- Focus on integration points

### Safety First
- Validate shell scripts for security
- Check for dangerous patterns
- Ensure backup mechanisms exist

### Performance
- Keep tests fast (< 10 seconds per suite)
- Use mocks for external dependencies
- Parallel test execution when possible

## 🔍 Test Utilities

### Global Test Utils
Available in all test files via `testUtils`:

```typescript
// Create temporary directories
const tempDir = await testUtils.createTempDir();
await testUtils.cleanupTempDir(tempDir);

// Create mock configurations
const mockPkg = testUtils.createMockPackageJson('@tony/test');
const mockConfig = testUtils.createMockConfig('tsconfig');

// Validate JSON files
const isValid = await testUtils.validateJsonFile('config.json');
```

### Mock Helpers
- Configuration object creation
- Package.json mocking
- Shell command mocking
- File system utilities

## 📝 Writing Tests

### Test File Naming
- Use `.spec.ts` extension
- Descriptive file names
- Group related tests in same file

### Test Structure
```typescript
describe('Component Name', () => {
  describe('Feature Group', () => {
    it('should validate specific behavior', () => {
      // Test implementation
    });
  });
});
```

### Assertions
- Use appropriate matchers
- Test both positive and negative cases
- Validate error conditions

## 🚨 Troubleshooting

### Common Issues
1. **Module Resolution**: Check vitest.config.ts aliases
2. **Coverage Gaps**: Review exclude patterns
3. **Test Timeouts**: Increase timeout for slow operations
4. **Mock Issues**: Clear mocks in beforeEach hooks

### Debug Mode
```bash
npm run test:debug         # Run with debug output
npm run test:ui           # Visual test interface
```

## 📈 Metrics and Reporting

### Test Execution
- Total test count
- Pass/fail rates
- Execution time per suite
- Coverage percentage

### Quality Gates
- All tests must pass
- Coverage thresholds must be met
- No TypeScript errors
- ESLint compliance

---

**Tony Development SDK Testing Framework** - Ensuring quality and reliability for all SDK components.