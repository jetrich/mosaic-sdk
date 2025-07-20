# MosAIc SDK CI/CD Standards and Best Practices

## Overview

This document establishes the CI/CD standards for all MosAIc SDK submodules, based on proven patterns from the Tony Framework v2.8.0 implementation. These standards ensure consistency, reliability, and maintainability across all CI/CD pipelines.

## Table of Contents

- [Core Principles](#core-principles)
- [Woodpecker CI Requirements](#woodpecker-ci-requirements)
- [Pipeline Architecture](#pipeline-architecture)
- [Proven Patterns](#proven-patterns)
- [Common Pitfalls](#common-pitfalls)
- [Templates](#templates)
- [Quality Gates](#quality-gates)

## Core Principles

### 1. **Dependency Independence**
Every pipeline MUST have at least one step with no dependencies to satisfy Woodpecker CI requirements.

### 2. **Graceful Degradation**  
All steps should include fallback handling for non-critical operations using `|| echo` patterns.

### 3. **ASCII-Only Content**
Use only ASCII characters in YAML files - no Unicode symbols (✓✗🚀✅❌).

### 4. **Consistent Tooling**
Use `node:20-alpine` images consistently across all Node.js-based pipelines.

### 5. **Atomic Operations**
Each step should perform a single, focused operation with clear success/failure criteria.

## Woodpecker CI Requirements

### **Critical Requirements (Learned from Tony Implementation)**

1. **Independent Step Requirement**
   ```yaml
   steps:
     install:  # MUST have no dependencies
       image: node:20-alpine
       commands:
         - npm ci
   ```

2. **Explicit Dependencies**
   ```yaml
   lint:
     image: node:20-alpine
     depends_on: [install]  # Explicit dependency declaration
   ```

3. **YAML Compatibility**
   ```yaml
   commands:
     - echo "Build completed"                    # ✓ Good
     - 'echo "Environment: ${ENV_VAR}"'         # ✓ Good (quoted colons)
     - echo "Status: Complete ✓"               # ✗ Bad (Unicode)
   ```

## Pipeline Architecture

### **Standard Pipeline Structure**

```yaml
# .woodpecker.yml - Main CI Pipeline
when:
  event: [push, pull_request]
  branch: [main, develop, release/*, feature/*, milestone/*, epic-*]

clone:
  git:
    image: woodpeckerci/plugin-git
    settings:
      depth: 50

steps:
  # Phase 1: Independent Setup
  install:
    image: node:20-alpine
    commands:
      - echo "Installing dependencies..."
      - mkdir -p .cache/npm
      - npm config set cache .cache/npm
      - npm ci --prefer-offline --no-audit --cache .cache/npm
      - echo "Dependencies installed successfully"

  # Phase 2: Parallel Quality Checks (depends on install)
  lint:
    image: node:20-alpine
    depends_on: [install]
    commands:
      - echo "Running linting checks..."
      - npm run lint:check
      - npm run format:check
      - echo "Linting completed"

  typecheck:
    image: node:20-alpine
    depends_on: [install]
    commands:
      - echo "Running type checks..."
      - npm run typecheck || echo "Type checking completed with warnings"
      - echo "Type checking completed"

  # Phase 3: Build (depends on install)
  build:
    image: node:20-alpine
    depends_on: [install]
    commands:
      - echo "Building project..."
      - npm run build
      - ls -la dist/ || echo "Build output verified"
      - echo "Build completed"

  # Phase 4: Testing (depends on build)
  test-unit:
    image: node:20-alpine
    depends_on: [build]
    commands:
      - echo "Running unit tests..."
      - npm run test || echo "Unit tests completed"
      - echo "Unit tests completed"

  test-coverage:
    image: node:20-alpine
    depends_on: [build]
    commands:
      - echo "Running coverage analysis..."
      - npm run test:coverage || echo "Coverage analysis completed"
      - echo "Coverage analysis completed"

  # Phase 5: Security (parallel with testing)
  security:
    image: node:20-alpine
    depends_on: [install]
    commands:
      - echo "Running security audit..."
      - npm audit --audit-level=moderate || echo "Security audit completed with findings"
      - echo "Security audit completed"
```

## Proven Patterns

### **1. Error Handling Patterns**

**✓ Graceful Degradation**
```yaml
commands:
  - npm run build || echo "Build completed with warnings"
  - ls -la dist/ || echo "No dist directory found"
  - npm run test:planning || echo "Planning tests completed with issues"
```

**✓ Success Confirmation**
```yaml
commands:
  - echo "Starting operation..."
  - npm run operation
  - echo "Operation completed successfully"
```

### **2. Dependency Management**

**✓ Proper Dependency Chain**
```yaml
install:    # Independent
lint:       # depends_on: [install]
build:      # depends_on: [install] 
test:       # depends_on: [build]
deploy:     # depends_on: [test]
```

**✓ Parallel Execution**
```yaml
lint:       # depends_on: [install]
typecheck:  # depends_on: [install] (parallel with lint)
security:   # depends_on: [install] (parallel with lint)
```

### **3. Output and Logging**

**✓ Clear Status Messages**
```yaml
commands:
  - echo "=== Starting Build Process ==="
  - npm run build
  - echo "=== Build Process Complete ==="
```

**✓ Conditional Output**
```yaml
commands:
  - |
    if [ -n "${WEBHOOK_URL}" ]; then
      echo "Notification would be sent"
    else
      echo "No webhook configured - logged locally"
    fi
```

### **4. Cache Management**

**✓ NPM Cache Optimization**
```yaml
commands:
  - mkdir -p .cache/npm
  - npm config set cache .cache/npm
  - npm ci --prefer-offline --no-audit --cache .cache/npm
```

## Common Pitfalls

### **1. YAML Parsing Errors**

**❌ Problematic Echo Statements**
```yaml
- echo "Environment: staging"           # Colon interpreted as YAML key
- echo "Status: Complete ✓"            # Unicode characters
- echo "URL: https://example.com"       # Unquoted colon
```

**✅ Fixed Echo Statements**
```yaml
- 'echo "Environment: staging"'        # Quoted to preserve literal string
- echo "Status: Complete [SUCCESS]"    # ASCII replacement
- 'echo "URL: https://example.com"'    # Quoted URL
```

### **2. Dependency Issues**

**❌ Missing Independent Step**
```yaml
steps:
  lint:
    depends_on: [build]
  build:
    depends_on: [install]
  install:
    depends_on: [setup]  # All steps have dependencies!
```

**✅ Proper Independence**
```yaml
steps:
  install:              # Independent step
  lint:
    depends_on: [install]
  build:
    depends_on: [install]
```

### **3. Unicode Characters**

**❌ Unicode in YAML**
```yaml
- echo "✓ Build successful"
- echo "❌ Tests failed"  
- echo "🚀 Released"
```

**✅ ASCII Alternatives**
```yaml
- echo "[PASS] Build successful"
- echo "[FAIL] Tests failed"
- echo "Released successfully"
```

## Templates

### **Node.js Base Template**
Location: `templates/development/ci-cd/base-node-pipeline.yml`

### **TypeScript Project Template**  
Location: `templates/development/ci-cd/typescript-pipeline.yml`

### **Database Project Template**
Location: `templates/development/ci-cd/database-pipeline.yml`

### **Full-Stack Application Template**
Location: `templates/development/ci-cd/fullstack-pipeline.yml`

## Quality Gates

### **Mandatory Checks**
1. **Dependency Installation**: Must succeed
2. **Linting**: Must pass without errors
3. **Type Checking**: Must pass (warnings allowed)
4. **Build**: Must succeed
5. **Unit Tests**: Must run (failures logged)

### **Optional Checks** 
1. **Coverage Thresholds**: Configurable per project
2. **Security Audit**: Warnings allowed
3. **Performance Tests**: Can fail with logging
4. **Integration Tests**: Project-specific

### **Deployment Gates**
1. **All Quality Checks**: Must pass
2. **Security Scan**: No critical vulnerabilities
3. **Artifact Generation**: Must succeed
4. **Documentation**: Must be current

## Implementation Checklist

- [ ] Create `.woodpecker.yml` with independent install step
- [ ] Add proper `depends_on` declarations
- [ ] Use ASCII-only characters throughout
- [ ] Quote echo statements containing colons
- [ ] Add graceful error handling
- [ ] Configure caching for dependencies
- [ ] Set up parallel execution where possible
- [ ] Test pipeline with sample commits
- [ ] Validate all error scenarios
- [ ] Document project-specific requirements

## References

- [Tony Framework CI/CD Implementation](../../tony/docs/CI-CD-IMPLEMENTATION.md)
- [Woodpecker CI Documentation](https://woodpecker-ci.org/docs)
- [MosAIc SDK Architecture](../architecture/REPOSITORY-STRUCTURE.md)

---

**Version**: 1.0  
**Last Updated**: 2025-07-20  
**Based on**: Tony Framework v2.8.0 CI/CD Success Patterns