# Tony Framework Testing Methodology

**Version**: 2.3.0 "Test-First Excellence"  
**Effective Date**: July 2025  
**Mandatory Compliance**: All Tony Framework development  

## 🎯 Testing Philosophy

The Tony Framework adopts a **test-first, quality-driven approach** to ensure reliability, maintainability, and professional-grade software development. This methodology is **MANDATORY** for all framework development and **STRONGLY RECOMMENDED** for all projects using the Tony Framework.

### Core Principles

1. **Tests Before Code**: Write comprehensive tests before any implementation
2. **Comprehensive Coverage**: Achieve 95% test coverage minimum for framework components
3. **Isolation & Independence**: Every test must run in complete isolation
4. **Dependency Injection**: Use proper abstractions for all external dependencies
5. **Independent QA**: All code must be verified by an independent QA process

## 🏗️ Testing Architecture

### Framework Testing Infrastructure

Tony Framework provides a comprehensive testing infrastructure located in:

```
framework-source/tony/core/testing/
├── interfaces/           # Core testing contracts
├── dependency-injection/ # DI container and mock factory
├── helpers/             # Specialized testing utilities
└── index.ts             # Public testing API
```

This infrastructure ships with the production framework to enable testing of Tony-based applications while maintaining a clean deployment for end users.

### Testing Layers

#### 1. Framework Testing Infrastructure (Production)
- **Purpose**: Provides testing capabilities TO framework users
- **Location**: `framework-source/tony/core/testing/`
- **Components**: Interfaces, dependency injection, testing helpers
- **Deployment**: Ships with production Tony Framework

#### 2. Framework Development Tests (SDK Only)
- **Purpose**: Tests the Tony Framework itself during development
- **Location**: `sdk/testing-framework/`
- **Components**: Test suites, coverage analysis, CI/CD integration
- **Deployment**: Never ships to end users

## 🔬 Test-First Development Workflow

### MANDATORY: Red-Green-Refactor Cycle

**Every piece of code MUST follow this exact sequence:**

#### Phase 1: RED (Write Failing Tests)
```typescript
// 1. Write comprehensive test cases BEFORE any implementation
describe('PluginLoader', () => {
  it('should load plugin with proper validation', async () => {
    const loader = await createTestPluginLoader();
    const result = await loader.loadPlugin('/test/plugin.js');
    
    expect(result.plugin.name).toBe('test-plugin');
    expect(result.state).toBe('loaded');
  });
  
  it('should handle validation failures', async () => {
    const loader = await createTestPluginLoader({
      validator: createMockValidator({ valid: false })
    });
    
    await expect(loader.loadPlugin('/invalid.js'))
      .rejects.toThrow('Plugin validation failed');
  });
});
```

#### Phase 2: GREEN (Minimal Implementation)
```typescript
// 2. Write MINIMAL code to make tests pass
export class PluginLoader implements TestableComponent {
  async loadPlugin(path: string): Promise<LoadedPlugin> {
    const validation = await this.validator.validate(path);
    if (!validation.valid) {
      throw new Error('Plugin validation failed');
    }
    
    return {
      plugin: { name: 'test-plugin' },
      state: 'loaded'
    };
  }
}
```

#### Phase 3: REFACTOR (Improve While Maintaining Tests)
```typescript
// 3. Refactor for quality while keeping all tests green
export class PluginLoader implements TestableComponent {
  async loadPlugin(path: string): Promise<LoadedPlugin> {
    const resolvedPath = this.resolvePath(path);
    const module = await this.moduleLoader.load(resolvedPath);
    const plugin = this.extractPlugin(module);
    
    const validation = await this.validator.validate(plugin);
    if (!validation.valid) {
      throw new Error(`Plugin validation failed: ${validation.errors.join(', ')}`);
    }
    
    return this.createLoadedPlugin(plugin, resolvedPath);
  }
}
```

## 🧪 Testing Infrastructure Usage

### Creating Test Environments

```typescript
import { createTestEnvironment, TestEnvironment } from '@tony/testing';

describe('My Component Tests', () => {
  let testEnv: TestEnvironment;
  
  beforeEach(async () => {
    testEnv = createTestEnvironment();
  });
  
  afterEach(async () => {
    await testEnv.cleanup();
  });
  
  it('should test component in isolation', async () => {
    await testEnv.runInTestScope(async () => {
      // Test code here runs in complete isolation
      const component = await createTestComponent();
      const result = await component.doSomething();
      expect(result).toBeDefined();
    });
  });
});
```

### Implementing Testable Components

```typescript
import { TestableComponent, BaseTestableComponent } from '@tony/testing';

export class MyComponent extends BaseTestableComponent {
  getDependencies(): string[] {
    return ['fileSystem', 'logger', 'configService'];
  }
  
  async doSomething(): Promise<Result> {
    const fs = this.getDependency<FileSystemOperations>('fileSystem');
    const logger = this.getDependency<Logger>('logger');
    
    // Implementation using injected dependencies
    const data = await fs.readFile('/config.json');
    logger.info('Config loaded');
    
    return { success: true, data };
  }
}
```

### Creating and Using Mocks

```typescript
import { createMock, MockConfig } from '@tony/testing';

it('should handle file system operations', async () => {
  const mockFs = createMock<FileSystemOperations>({
    readFile: async (path: string) => `mock content for ${path}`,
    exists: (path: string) => !path.includes('missing')
  });
  
  const component = new MyComponent('test-component');
  await component.initialize(new Map([
    ['fileSystem', mockFs],
    ['logger', createMockLogger()]
  ]));
  
  const result = await component.doSomething();
  expect(result.success).toBe(true);
});
```

## 📊 Testing Standards & Requirements

### Coverage Requirements

| Component Type | Minimum Coverage | Target Coverage |
|---------------|------------------|-----------------|
| Framework Core | 95% | 98% |
| Framework Extensions | 90% | 95% |
| User Applications | 85% | 90% |
| Utility Functions | 95% | 98% |

### Test Categories (All Required)

#### 1. Unit Tests
- **Purpose**: Test individual functions/methods in isolation
- **Scope**: Single component, mocked dependencies
- **Coverage**: 100% of public API

```typescript
describe('Unit: VersionChecker', () => {
  it('should compare versions correctly', () => {
    const checker = new VersionChecker();
    expect(checker.compareVersions('1.2.3', '1.2.4')).toBe(-1);
    expect(checker.compareVersions('2.0.0', '1.9.9')).toBe(1);
  });
});
```

#### 2. Integration Tests
- **Purpose**: Test component interactions
- **Scope**: Multiple components working together
- **Coverage**: All component interfaces

```typescript
describe('Integration: Plugin Loading', () => {
  it('should load and validate plugin through full pipeline', async () => {
    const testEnv = createTestEnvironment();
    const loader = await createPluginLoader(testEnv.container);
    
    testEnv.pluginHelper.setupMockPluginDirectory([
      { name: 'test-plugin', version: '1.0.0' }
    ]);
    
    const result = await loader.loadPlugin('/plugins/test-plugin.js');
    expect(result.plugin.name).toBe('test-plugin');
  });
});
```

#### 3. End-to-End Tests
- **Purpose**: Test complete workflows
- **Scope**: Full system integration
- **Coverage**: Critical user journeys

```typescript
describe('E2E: Plugin Lifecycle', () => {
  it('should complete full plugin lifecycle', async () => {
    const framework = await createTestFramework();
    
    // Discover -> Register -> Load -> Activate -> Deactivate -> Unload
    const plugins = await framework.discoverPlugins('/plugins');
    const registered = await framework.register(plugins[0]);
    const loaded = await framework.load(registered.name);
    const activated = await framework.activate(loaded.name);
    
    expect(activated.state).toBe('active');
    
    await framework.deactivate(activated.name);
    await framework.unload(activated.name);
  });
});
```

#### 4. Performance Tests
- **Purpose**: Validate performance requirements
- **Scope**: Critical paths and bottlenecks
- **Coverage**: All performance-sensitive operations

```typescript
describe('Performance: Plugin Loading', () => {
  it('should load plugin within time limit', async () => {
    const start = Date.now();
    const loader = await createTestPluginLoader();
    await loader.loadPlugin('/test/plugin.js');
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(1000); // 1 second max
  });
});
```

#### 5. Security Tests
- **Purpose**: Validate security requirements
- **Scope**: Authentication, authorization, data handling
- **Coverage**: All security-critical code paths

```typescript
describe('Security: Plugin Validation', () => {
  it('should reject malicious plugin code', async () => {
    const loader = await createTestPluginLoader();
    
    await expect(loader.loadPlugin('/malicious/plugin.js'))
      .rejects.toThrow('Security validation failed');
  });
});
```

## 🔒 Independent QA Verification Protocol

### MANDATORY: No Self-Certification

**CRITICAL RULE**: Developers cannot verify their own work. All completion claims must be independently validated.

#### QA Agent Deployment

```bash
# Deploy independent QA agent for verification
claude -p "Independent QA for task T.XXX.XX.XX:
- Verify all tests were written before code implementation
- Re-run complete test suite in clean environment  
- Validate test coverage meets requirements (≥95%)
- Check build success in clean environment
- Verify documentation updates are accurate
- Report PASS/FAIL with detailed evidence" \
--model sonnet \
--allowedTools="Read,Bash,Glob,Grep"
```

#### QA Verification Checklist

**Pre-Implementation Verification:**
- [ ] Tests written and failing before any code (RED phase verified)
- [ ] Test cases cover all requirements and edge cases
- [ ] Tests follow framework testing standards

**Implementation Verification:**
- [ ] All tests passing independently (100% success rate)
- [ ] Test coverage meets minimum requirements (≥95%)
- [ ] No test skipping or xdescribe/xit usage
- [ ] Build succeeds in completely clean environment

**Quality Verification:**
- [ ] No regressions in existing functionality
- [ ] Code follows Tony Framework standards
- [ ] Documentation accurately reflects changes
- [ ] Security scans show no new vulnerabilities

**Performance Verification:**
- [ ] Performance within acceptable thresholds
- [ ] No memory leaks or resource issues
- [ ] Critical paths meet performance requirements

### QA Reporting Format

```markdown
# QA Verification Report
**Task**: T.XXX.XX.XX  
**Original Developer**: [Agent Name]  
**QA Agent**: [Independent Agent Name]  
**Verification Date**: [Date]  

## Test Verification: PASS/FAIL
- Tests written before code: ✅/❌
- All tests passing: ✅/❌ (X/Y tests)
- Coverage requirement: ✅/❌ (X% achieved, ≥95% required)

## Build Verification: PASS/FAIL
- Clean environment build: ✅/❌
- No compilation errors: ✅/❌
- No linting errors: ✅/❌

## Quality Verification: PASS/FAIL
- No regressions: ✅/❌
- Documentation updated: ✅/❌
- Standards compliance: ✅/❌

## Overall Result: PASS/FAIL
**Evidence**: [Detailed evidence with file paths, test outputs, coverage reports]
```

## 🚀 Test Automation & CI/CD Integration

### Automated Quality Gates

All Tony Framework projects MUST implement these automated checks:

```yaml
# .github/workflows/test-quality-gate.yml
name: Test Quality Gate

on: [push, pull_request]

jobs:
  test-first-validation:
    runs-on: ubuntu-latest
    steps:
      - name: Verify test-first compliance
        run: |
          # Check git history to ensure tests were committed before code
          npm run validate:test-first
      
      - name: Run complete test suite
        run: |
          npm run test:all
          npm run coverage:check
      
      - name: Validate coverage requirements
        run: |
          npm run coverage:validate -- --minimum=95
      
      - name: Security scan
        run: |
          npm audit --audit-level=high
          npm run security:scan
```

### Testing Commands

All projects must implement these npm scripts:

```json
{
  "scripts": {
    "test": "npm run test:all",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:unit": "vitest run --coverage tests/unit",
    "test:integration": "vitest run --coverage tests/integration", 
    "test:e2e": "vitest run tests/e2e",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "coverage": "vitest run --coverage",
    "coverage:check": "vitest run --coverage --reporter=verbose",
    "coverage:validate": "nyc check-coverage --lines 95 --functions 95 --branches 95",
    "validate:test-first": "node scripts/validate-test-first.js",
    "qa:verify": "node scripts/independent-qa.js"
  }
}
```

## 🛠️ Testing Tools & Configuration

### Required Testing Stack

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "happy-dom": "^12.0.0",
    "jsdom": "^23.0.0",
    "@tony/testing-framework": "^1.0.0"
  }
}
```

### Standard Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { createTonyTestConfig } from '@tony/testing-framework';

export default defineConfig({
  test: {
    ...createTonyTestConfig(),
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        }
      }
    }
  }
});
```

## 📚 Testing Best Practices

### Do's and Don'ts

#### ✅ DO:
- Write tests before writing any implementation code
- Use dependency injection for all external dependencies
- Create focused, isolated tests with clear assertions
- Use descriptive test names that explain the expected behavior
- Test edge cases, error conditions, and boundary values
- Mock all external dependencies (file system, network, etc.)
- Run tests in parallel when possible
- Keep test data and fixtures organized and reusable

#### ❌ DON'T:
- Write implementation code before writing tests
- Skip tests or use `.skip()` without approval
- Test implementation details instead of behavior
- Create tests that depend on other tests or external state
- Use real file system, network, or database operations in unit tests
- Write tests that are flaky or non-deterministic
- Ignore failing tests or reduce coverage requirements
- Mix test types (unit/integration/e2e) in the same test file

### Test Organization

```
tests/
├── unit/                # Isolated component tests
│   ├── components/      # Component unit tests
│   ├── services/        # Service unit tests
│   └── utils/           # Utility function tests
├── integration/         # Component interaction tests
│   ├── plugin-system/   # Plugin system integration
│   └── api/             # API integration tests
├── e2e/                 # End-to-end workflow tests
│   ├── user-journeys/   # Complete user workflows
│   └── system/          # System-level tests
├── performance/         # Performance and load tests
├── security/            # Security validation tests
├── fixtures/            # Test data and mock objects
└── helpers/             # Test utility functions
```

## 🔄 Continuous Improvement

### Testing Metrics Tracking

Track these metrics for continuous improvement:

- **Test Coverage**: Percentage of code covered by tests
- **Test Success Rate**: Percentage of tests passing
- **Test Execution Time**: Time to run complete test suite
- **Defect Escape Rate**: Issues found in production vs. testing
- **Test Maintenance Cost**: Time spent maintaining test suite

### Regular Testing Reviews

- **Weekly**: Review test coverage reports and address gaps
- **Monthly**: Analyze test metrics and identify improvement opportunities  
- **Quarterly**: Review testing methodology and update practices
- **Per Release**: Conduct comprehensive testing retrospective

## 🎯 Success Criteria

### Framework Quality Gates

Before marking any work as complete, ALL of these criteria must be met:

1. **Test-First Compliance**: Evidence that tests were written before code
2. **Coverage Requirements**: Minimum 95% coverage achieved
3. **Test Success**: 100% of written tests pass independently
4. **Independent QA**: Independent verification confirms quality
5. **Build Success**: Clean build in fresh environment
6. **No Regressions**: Existing functionality remains intact
7. **Documentation**: All changes documented accurately
8. **Performance**: Meets all performance requirements

### Agent Accountability

- **No False Claims**: Zero tolerance for false completion claims
- **Evidence Required**: Agents must provide verifiable evidence
- **Independent Verification**: All work must pass independent QA
- **Build Verification**: Mandatory build success before completion claims

---

**This methodology is MANDATORY for Tony Framework development and represents the foundation of professional-grade software engineering practices. Adherence to these standards ensures reliability, maintainability, and user confidence in the Tony Framework ecosystem.**

**Version**: 2.3.0 "Test-First Excellence"  
**Next Review**: October 2025  
**Framework Integration**: Effective immediately for all Tony Framework development