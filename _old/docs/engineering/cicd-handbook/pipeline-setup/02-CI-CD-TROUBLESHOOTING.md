---
title: "CI/CD Troubleshooting Guide"
order: 02
category: "pipeline-setup"
tags: ['cicd', 'pipelines', 'automation']
last_updated: "2025-07-19"
author: "consolidation"
version: "1.0"
status: "published"
---

# CI/CD Troubleshooting Guide

## Overview

This guide helps diagnose and resolve common issues in CI/CD pipelines. It covers error patterns, debugging techniques, and solutions for the MosAIc Stack pipelines.

## Table of Contents

1. [Common Pipeline Failures](#common-pipeline-failures)
2. [Language-Specific Issues](#language-specific-issues)
3. [Docker & Container Issues](#docker--container-issues)
4. [Performance Problems](#performance-problems)
5. [Environment & Configuration](#environment--configuration)
6. [Debugging Techniques](#debugging-techniques)
7. [Emergency Procedures](#emergency-procedures)

## Common Pipeline Failures

### 1. Dependency Installation Failures

#### Symptom
```
npm ERR! code EINTEGRITY
npm ERR! Verification failed while extracting package
```

#### Causes & Solutions

**Corrupted Cache**
```yaml
# Clear and rebuild cache
steps:
  clear-cache:
    image: node:20-alpine
    commands:
      - rm -rf node_modules package-lock.json
      - npm cache clean --force
      - npm install
```

**Network Issues**
```yaml
# Add retry logic
install-with-retry:
  commands:
    - npm ci || npm ci || npm ci  # Retry 3 times
```

**Registry Problems**
```bash
# Use different registry
npm config set registry https://registry.npmjs.org/
# Or for specific scope
npm config set @company:registry https://npm.company.com/
```

### 2. Test Failures

#### Symptom
```
FAIL src/calculator.test.ts
  ● Calculator › should add numbers correctly
    expect(received).toBe(expected)
```

#### Debugging Steps

1. **Check for Environment Differences**
```yaml
debug-test-env:
  commands:
    - echo "Node version: $(node --version)"
    - echo "NPM version: $(npm --version)"
    - echo "Current directory: $(pwd)"
    - echo "Test files:"
    - find . -name "*.test.*" -type f
```

2. **Run Tests in Isolation**
```bash
# Run single test file
npm test -- calculator.test.ts

# Run with verbose output
npm test -- --verbose --no-coverage

# Run with specific test name
npm test -- -t "should add numbers"
```

3. **Check for Timing Issues**
```javascript
// Increase timeout for slow tests
test('slow operation', async () => {
  // ...
}, 10000); // 10 second timeout
```

### 3. Build Failures

#### Symptom
```
ERROR in ./src/index.ts
Module not found: Error: Can't resolve './missing-module'
```

#### Common Causes

**Missing Files**
```yaml
# List all source files to verify
debug-files:
  commands:
    - find src -type f -name "*.ts" -o -name "*.tsx" | head -20
    - test -f src/index.ts || echo "Entry point missing!"
```

**Case Sensitivity**
```bash
# Check for case mismatches (Linux is case-sensitive)
find . -type f -name "*.ts" | grep -i component
```

**TypeScript Configuration**
```json
// Ensure tsconfig.json includes all files
{
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Language-Specific Issues

### Node.js/TypeScript

#### Issue: Memory Errors
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solution**
```yaml
build-with-memory:
  environment:
    - NODE_OPTIONS=--max-old-space-size=4096
  commands:
    - npm run build
```

#### Issue: TypeScript Version Conflicts
```
error TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'
```

**Solution**
```json
// Ensure consistent TypeScript version
{
  "devDependencies": {
    "typescript": "5.3.3"  // Pin exact version
  }
}
```

### Python/FastAPI

#### Issue: Import Errors
```
ModuleNotFoundError: No module named 'app'
```

**Solution**
```yaml
test-with-pythonpath:
  environment:
    - PYTHONPATH=/drone/src
  commands:
    - pytest tests/
```

#### Issue: Async Test Failures
```
RuntimeError: This event loop is already running
```

**Solution**
```python
# Use pytest-asyncio properly
import pytest

@pytest.mark.asyncio
async def test_async_function():
    result = await async_function()
    assert result == expected
```

### Go

#### Issue: Module Download Failures
```
go: github.com/pkg/errors@v0.9.1: reading github.com/pkg/errors/go.mod at revision v0.9.1: git ls-remote -q origin
```

**Solution**
```yaml
go-private-modules:
  environment:
    - GOPRIVATE=github.com/company/*
    - GOPROXY=https://proxy.golang.org,direct
  commands:
    - go mod download
```

#### Issue: Build Cache Problems
```
go: cannot find main module, but found .git/config
```

**Solution**
```bash
# Clean module cache
go clean -modcache
go mod download
```

### React/Next.js

#### Issue: Build Memory Issues
```
<--- Last few GCs --->
FATAL ERROR: Ineffective mark-compacts near heap limit
```

**Solution**
```javascript
// next.config.js
module.exports = {
  experimental: {
    workerThreads: false,
    cpus: 1
  }
}
```

## Docker & Container Issues

### 1. Build Context Too Large

#### Symptom
```
Sending build context to Docker daemon 1.2GB
```

#### Solution
```dockerfile
# Use .dockerignore
node_modules
.git
dist
coverage
*.log
```

### 2. Layer Caching Not Working

#### Symptom
Every build rebuilds all layers

#### Solution
```dockerfile
# Order layers by change frequency
# Less frequently changed items first
COPY package*.json ./
RUN npm ci
# More frequently changed items last
COPY . .
RUN npm run build
```

### 3. Permission Errors

#### Symptom
```
Error: EACCES: permission denied, mkdir '/app/node_modules'
```

#### Solution
```dockerfile
# Set correct ownership
FROM node:20-alpine
WORKDIR /app
# Create app directory with correct permissions
RUN mkdir -p /app && chown -R node:node /app
USER node
COPY --chown=node:node . .
```

## Performance Problems

### 1. Slow Dependency Installation

#### Diagnosis
```yaml
time-install:
  commands:
    - time npm ci
    - du -sh node_modules
```

#### Solutions

**Use Caching**
```yaml
cache:
  key: ${DRONE_REPO_NAME}-npm-${DRONE_BRANCH}
  mount:
    - node_modules
    - ~/.npm
```

**Parallel Installation**
```json
{
  "npm-install-mode": "parallel"
}
```

### 2. Slow Tests

#### Diagnosis
```bash
# Find slow tests
npm test -- --verbose --detectOpenHandles
```

#### Solutions

**Run Tests in Parallel**
```javascript
// jest.config.js
module.exports = {
  maxWorkers: '50%',  // Use 50% of available CPU cores
};
```

**Skip Expensive Tests in CI**
```javascript
describe.skipIf(process.env.CI)('Expensive tests', () => {
  // ...
});
```

### 3. Large Docker Images

#### Diagnosis
```bash
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

#### Solutions

**Multi-stage Builds**
```dockerfile
# Final stage with minimal dependencies
FROM alpine:3.19
RUN apk add --no-cache nodejs
COPY --from=builder /app/dist /app
COPY --from=builder /app/node_modules /app/node_modules
```

**Remove Dev Dependencies**
```dockerfile
RUN npm ci --only=production
```

## Environment & Configuration

### 1. Missing Environment Variables

#### Symptom
```
Error: Missing required environment variable: DATABASE_URL
```

#### Debugging
```yaml
check-env:
  commands:
    - env | sort
    - echo "DATABASE_URL is: ${DATABASE_URL:-NOT SET}"
```

#### Solution
```yaml
# Set defaults for CI
environment:
  - DATABASE_URL=${DATABASE_URL:-postgresql://test:test@postgres:5432/test}
  - REDIS_URL=${REDIS_URL:-redis://redis:6379}
```

### 2. Service Connection Issues

#### Symptom
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

#### Solution
```yaml
services:
  postgres:
    image: postgres:17.5-alpine
    environment:
      - POSTGRES_USER=test
      - POSTGRES_PASSWORD=test
      - POSTGRES_DB=test

steps:
  wait-for-db:
    commands:
      # Wait for service to be ready
      - for i in {1..30}; do pg_isready -h postgres && break || sleep 1; done
```

## Debugging Techniques

### 1. Interactive Debugging

```yaml
# Add debugging step
debug-shell:
  image: node:20-alpine
  commands:
    - apk add --no-cache bash
    - echo "=== Debug Information ==="
    - pwd
    - ls -la
    - cat package.json | jq .scripts
    - node --version
    - npm --version
  when:
    status: failure
```

### 2. Verbose Logging

```yaml
verbose-build:
  commands:
    - npm run build -- --verbose
    - npm test -- --verbose --runInBand
```

### 3. Artifact Collection

```yaml
collect-logs:
  commands:
    - mkdir -p artifacts
    - cp -r logs/* artifacts/ || true
    - cp -r coverage/* artifacts/ || true
    - tar -czf debug-artifacts.tar.gz artifacts/
  when:
    status: [success, failure]
```

### 4. SSH Debug Session

For complex issues, enable SSH access:

```yaml
debug-ssh:
  image: drone/drone-runner-docker:1
  commands:
    - echo "SSH available at: $(hostname -I | cut -d' ' -f1):22"
    - sleep 3600  # Keep alive for 1 hour
  when:
    status: failure
```

## Emergency Procedures

### 1. Pipeline Stuck/Hanging

**Symptoms**
- Pipeline running for hours
- No output from steps

**Solutions**
1. Add timeouts to steps:
```yaml
test:
  commands:
    - timeout 300 npm test  # 5 minute timeout
```

2. Add health checks:
```yaml
health-check:
  commands:
    - while [ ! -f /tmp/app-ready ]; do sleep 1; done
    - timeout 60 curl -f http://localhost:3000/health
```

### 2. Rollback Procedures

```yaml
rollback-on-failure:
  when:
    status: failure
    branch: main
  commands:
    - git revert HEAD --no-edit
    - git push origin main
```

### 3. Emergency Disable

Create `.skip-ci` file to temporarily disable CI:

```yaml
when:
  - event: push
    evaluate: 'CI_SKIP_FILE not in files'
```

## Quick Reference Card

### Common Fixes Checklist

- [ ] Clear cache and reinstall dependencies
- [ ] Check environment variables
- [ ] Verify service connections
- [ ] Review recent dependency updates
- [ ] Check disk space
- [ ] Validate configuration files
- [ ] Test locally with same environment
- [ ] Review logs for hidden errors
- [ ] Check for API rate limits
- [ ] Verify network connectivity

### Useful Commands

```bash
# Node.js
npm ci --verbose
npm test -- --detectOpenHandles
npm run build -- --stats-error-details

# Python
pip install -v -r requirements.txt
pytest -vvs --tb=short
python -m py_compile app/**/*.py

# Go
go mod download -x
go test -v -race ./...
go build -v -x ./...

# Docker
docker build --progress=plain --no-cache .
docker run --rm -it image:tag sh
docker logs container-name --tail 50 -f
```

### Performance Profiling

```yaml
profile-pipeline:
  commands:
    - date +%s > /tmp/start_time
    - npm ci
    - echo "Install took: $(($(date +%s) - $(cat /tmp/start_time)))s"
    - date +%s > /tmp/start_time
    - npm test
    - echo "Tests took: $(($(date +%s) - $(cat /tmp/start_time)))s"
```

## Conclusion

Most CI/CD issues fall into these categories:
1. **Environment differences** between local and CI
2. **Dependency problems** (versions, cache, network)
3. **Resource constraints** (memory, CPU, disk)
4. **Timing issues** (race conditions, timeouts)
5. **Configuration errors** (missing variables, wrong paths)

When troubleshooting:
1. **Reproduce locally** with same environment
2. **Add logging** to understand the failure
3. **Isolate the problem** by running steps individually
4. **Check recent changes** that might have introduced the issue
5. **Document the solution** for future reference