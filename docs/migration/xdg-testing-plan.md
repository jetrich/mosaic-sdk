# XDG Migration: Comprehensive Testing Plan

## Overview

This document outlines the testing strategy for the MosAIc XDG Base Directory migration, ensuring reliability, compatibility, and zero data loss.

## Test Categories

### 1. Unit Tests

#### Path Resolution Tests
```typescript
// packages/config/test/paths.test.ts
describe('MosaicPaths', () => {
  describe('Path Resolution', () => {
    test('should prefer XDG paths when available');
    test('should fallback to legacy paths via symlink');
    test('should create XDG paths for new files');
    test('should handle missing directories gracefully');
    test('should respect environment variable overrides');
  });

  describe('Migration Detection', () => {
    test('should detect pending migration');
    test('should detect completed migration');
    test('should detect broken symlinks');
    test('should handle permission errors');
  });

  describe('Deprecation Warnings', () => {
    test('should show warning on legacy path usage');
    test('should suppress warnings with env var');
    test('should track warning display count');
  });
});
```

#### Configuration Loader Tests
```typescript
// packages/mcp-orchestrator/test/config.test.ts
describe('ConfigLoader with XDG', () => {
  test('should load config from XDG path');
  test('should migrate config from legacy path');
  test('should handle missing config files');
  test('should validate migrated configurations');
  test('should preserve custom settings during migration');
});
```

### 2. Integration Tests

#### Migration Script Tests
```bash
#!/bin/bash
# tests/integration/xdg-migration.test.sh

# Test 1: Fresh migration
test_fresh_migration() {
    # Setup legacy environment
    setup_legacy_mosaic
    
    # Run migration
    ./scripts/migration/migrate-to-xdg.sh
    
    # Verify results
    assert_symlink_exists
    assert_files_migrated
    assert_permissions_preserved
}

# Test 2: Idempotent migration
test_idempotent_migration() {
    # Run migration twice
    ./scripts/migration/migrate-to-xdg.sh
    ./scripts/migration/migrate-to-xdg.sh
    
    # Should not fail or duplicate
    assert_no_errors
    assert_no_duplicates
}

# Test 3: Rollback functionality
test_rollback() {
    # Migrate
    ./scripts/migration/migrate-to-xdg.sh
    
    # Simulate failure and rollback
    trigger_rollback
    
    # Verify restoration
    assert_legacy_restored
    assert_no_data_loss
}
```

#### Component Integration Tests
```typescript
// tests/integration/xdg-components.test.ts
describe('Component XDG Integration', () => {
  test('MCP Orchestrator starts with XDG paths');
  test('CLI creates projects in XDG locations');
  test('Scripts execute with XDG environment');
  test('Tony framework finds personas in XDG');
  test('Logging works with XDG state directory');
});
```

### 3. End-to-End Tests

#### User Journey Tests
```typescript
// tests/e2e/xdg-user-journey.test.ts
describe('XDG Migration User Journeys', () => {
  test('New user installation uses XDG by default');
  test('Existing user sees migration prompt');
  test('Power user can customize XDG paths');
  test('CI/CD environment works with XDG');
  test('Docker container handles XDG properly');
});
```

#### Scenario-Based Tests
1. **Fresh Installation**
   - No legacy directory exists
   - Should use XDG paths exclusively
   - No warnings or prompts

2. **Existing Installation**
   - Legacy directory exists
   - Should offer migration
   - Maintain functionality during transition

3. **Partial Migration**
   - Some files in XDG, some in legacy
   - Should merge intelligently
   - No data loss

4. **Broken State Recovery**
   - Corrupted migration state
   - Should recover gracefully
   - Provide clear error messages

### 4. Performance Tests

#### Benchmark Suite
```typescript
// tests/performance/xdg-performance.test.ts
describe('XDG Performance Impact', () => {
  test('Path resolution performance', async () => {
    const iterations = 10000;
    const start = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      MosaicPaths.resolvePath('config.json');
    }
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100); // < 100ms for 10k resolutions
  });

  test('Startup time with migration check');
  test('File I/O performance with XDG paths');
  test('Memory usage with path caching');
});
```

### 5. Compatibility Tests

#### Cross-Platform Tests
```yaml
# .github/workflows/xdg-compatibility.yml
name: XDG Compatibility Tests

on: [push, pull_request]

jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node: [18, 20, 22]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node }}
      
      - name: Test XDG on ${{ matrix.os }}
        run: |
          npm install
          npm run test:xdg-compatibility
```

#### Environment Tests
- Standard Linux with XDG
- Linux without XDG env vars
- macOS with custom paths
- Windows with WSL
- Docker containers
- Read-only filesystems
- Network filesystems

### 6. Security Tests

#### Permission Tests
```bash
# tests/security/xdg-permissions.test.sh

test_secure_permissions() {
    # Run migration
    ./scripts/migration/migrate-to-xdg.sh
    
    # Check permissions
    assert_permission "$HOME/.config/mosaic" "700"
    assert_permission "$HOME/.config/mosaic/config.json" "600"
    assert_permission "$HOME/.local/share/mosaic" "700"
}

test_sensitive_data_protection() {
    # Ensure secrets are properly protected
    assert_no_world_readable_files
    assert_proper_ownership
}
```

### 7. Regression Tests

#### Backward Compatibility Suite
```typescript
// tests/regression/xdg-backward-compat.test.ts
describe('Backward Compatibility', () => {
  test('Legacy scripts continue working');
  test('Old configuration formats supported');
  test('Existing integrations unaffected');
  test('Third-party tools compatibility');
});
```

## Test Data Management

### Test Fixtures
```
tests/fixtures/xdg/
├── legacy-installation/
│   └── .mosaic/
│       ├── config.json
│       ├── data/
│       └── logs/
├── migrated-installation/
│   ├── .config/mosaic/
│   └── .mosaic -> .config/mosaic
└── corrupted-state/
    └── various error scenarios
```

### Test Utilities
```typescript
// tests/utils/xdg-test-helpers.ts
export class XDGTestHelper {
  static setupLegacyEnvironment(): void;
  static setupXDGEnvironment(): void;
  static simulateMigration(): void;
  static verifyMigrationSuccess(): void;
  static cleanupTestEnvironment(): void;
}
```

## Test Execution Strategy

### Continuous Integration
1. **Pre-commit**: Unit tests only (fast)
2. **Pull Request**: Unit + Integration tests
3. **Main Branch**: Full test suite
4. **Release**: Full suite + manual testing

### Test Phases by Migration Phase

#### Phase 1: Core Infrastructure
- Focus on unit tests
- Path resolution accuracy
- Configuration loading

#### Phase 2: Script Migration
- Shell script testing
- Cross-platform compatibility
- Error handling

#### Phase 3: Integration
- Component integration
- End-to-end workflows
- Performance benchmarks

#### Phase 4: User Migration
- User journey testing
- Migration success rates
- Support ticket tracking

## Test Metrics and Reporting

### Coverage Requirements
- **Unit Tests**: 90% code coverage
- **Integration Tests**: 80% feature coverage
- **E2E Tests**: Critical user paths 100%

### Key Metrics
1. **Test Execution Time**: < 5 minutes for CI
2. **Flakiness Rate**: < 1% flaky tests
3. **Coverage Trend**: Increasing or stable
4. **Defect Detection**: > 95% before release

### Reporting Dashboard
```typescript
// Test results visualization
interface TestReport {
  coverage: {
    unit: number;
    integration: number;
    e2e: number;
  };
  performance: {
    avgExecutionTime: number;
    p95ExecutionTime: number;
  };
  reliability: {
    passRate: number;
    flakyTests: string[];
  };
}
```

## Manual Testing Checklist

### Developer Testing
- [ ] Fresh installation on clean system
- [ ] Migration from legacy installation
- [ ] Rollback procedure
- [ ] Performance comparison
- [ ] Error scenarios

### QA Testing
- [ ] User acceptance criteria
- [ ] Cross-platform validation
- [ ] Integration with external tools
- [ ] Documentation accuracy
- [ ] Support runbook validation

### Beta Testing
- [ ] Internal team dogfooding
- [ ] Selected power users
- [ ] Community beta program
- [ ] Feedback collection
- [ ] Issue prioritization

## Risk-Based Testing

### High-Risk Areas (Extensive Testing)
1. Data migration logic
2. Path resolution algorithm
3. Rollback procedures
4. Permission handling
5. Cross-platform compatibility

### Medium-Risk Areas (Standard Testing)
1. Configuration updates
2. Script modifications
3. Warning messages
4. Documentation updates

### Low-Risk Areas (Basic Testing)
1. Cosmetic changes
2. Log messages
3. Comments and documentation

## Test Automation

### Automated Test Pipeline
```yaml
# .github/workflows/xdg-test-pipeline.yml
name: XDG Migration Test Pipeline

on:
  push:
    paths:
      - 'packages/config/**'
      - 'scripts/migration/**'
      - 'tests/**'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:unit

  integration-tests:
    needs: unit-tests
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:integration

  e2e-tests:
    needs: integration-tests
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:e2e

  performance-tests:
    needs: integration-tests
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:performance
```

## Success Criteria

### Test Plan Success
1. All test categories implemented
2. > 95% test pass rate
3. No critical bugs in production
4. < 5% support tickets
5. Positive user feedback

### Migration Success
1. Zero data loss incidents
2. < 1% failed migrations
3. Performance maintained
4. Smooth rollback if needed
5. Clear documentation

This comprehensive testing plan ensures the XDG migration is thoroughly validated before release.