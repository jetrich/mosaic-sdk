---
title: "01 Cicd Patterns"
order: 01
category: "best-practices"
tags: ["best-practices", "cicd-handbook", "documentation"]
last_updated: "2025-01-19"
author: "migration"
version: "1.0"
status: "published"
---
# CI/CD Best Practices Guide

## Introduction

This guide outlines best practices for implementing and maintaining CI/CD pipelines in the MosAIc Stack. Following these practices ensures reliable, secure, and efficient software delivery.

## Table of Contents

1. [Pipeline Design Principles](#pipeline-design-principles)
2. [Code Quality Standards](#code-quality-standards)
3. [Testing Strategies](#testing-strategies)
4. [Security Practices](#security-practices)
5. [Performance Optimization](#performance-optimization)
6. [Docker & Containerization](#docker--containerization)
7. [Monitoring & Observability](#monitoring--observability)
8. [Documentation Standards](#documentation-standards)

## Pipeline Design Principles

### 1. Fail Fast
```yaml
# Run quick checks first
steps:
  - syntax-check    # Fastest - fails immediately on syntax errors
  - lint            # Fast - catches style issues
  - type-check      # Medium - validates types
  - test            # Slower - runs test suite
  - build           # Slowest - full compilation
```

### 2. Idempotency
- Pipelines should produce the same result when run multiple times
- Avoid side effects that persist between runs
- Clean workspace between builds

### 3. Reproducibility
```yaml
# Pin all versions
variables:
  - &node_image "node:20.11.0-alpine"  # Specific version
  - &python_image "python:3.11.7-slim"  # Not just "3.11"
```

### 4. Isolation
- Each pipeline step should be independent
- Use containers for consistent environments
- Don't rely on host machine state

## Code Quality Standards

### 1. Linting Configuration

**JavaScript/TypeScript (ESLint)**
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
```

**Python (Flake8 + Black)**
```ini
# setup.cfg
[flake8]
max-line-length = 88
extend-ignore = E203, W503
exclude = .git,__pycache__,venv

[tool:black]
line-length = 88
target-version = ['py311']
```

**Go (golangci-lint)**
```yaml
# .golangci.yml
linters:
  enable:
    - gofmt
    - govet
    - errcheck
    - staticcheck
    - gosec
    - ineffassign
    - typecheck
```

### 2. Type Safety

- **TypeScript**: Enable strict mode
- **Python**: Use mypy with strict settings
- **Go**: Already statically typed, use interfaces

### 3. Code Formatting

Enforce consistent formatting:
```yaml
format-check:
  commands:
    - npm run prettier:check      # JavaScript/TypeScript
    - black --check app/          # Python
    - test -z "$(gofmt -l .)"    # Go
```

## Testing Strategies

### 1. Test Pyramid

```
        /\
       /  \      E2E Tests (10%)
      /----\     - Critical user paths
     /      \    - Cross-browser testing
    /--------\   Integration Tests (30%)
   /          \  - API endpoints
  /            \ - Database operations
 /--------------\ Unit Tests (60%)
                  - Business logic
                  - Pure functions
```

### 2. Coverage Requirements

Set minimum coverage thresholds:

```json
// package.json (Jest)
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

```yaml
# Python pytest
test-coverage:
  commands:
    - pytest --cov=app --cov-fail-under=80
```

### 3. Test Categories

**Unit Tests**
- Fast execution (< 100ms per test)
- No external dependencies
- Test single units of code

**Integration Tests**
- Test component interactions
- May use test databases
- Slower but more realistic

**E2E Tests**
- Test complete user workflows
- Use real browsers (Playwright/Cypress)
- Run on critical paths only

### 4. Test Data Management

```python
# Use fixtures for test data
@pytest.fixture
def sample_user():
    return {
        "id": 1,
        "name": "Test User",
        "email": "test@example.com"
    }

# Use factories for complex objects
class UserFactory:
    @staticmethod
    def create(**kwargs):
        defaults = {
            "name": "Test User",
            "email": f"test{random.randint(1000, 9999)}@example.com"
        }
        return User(**{**defaults, **kwargs})
```

## Security Practices

### 1. Dependency Scanning

**Regular Updates**
```yaml
dependency-check:
  schedule: "0 9 * * 1"  # Weekly on Mondays
  commands:
    - npm audit --production
    - safety check --json
    - go mod verify
```

**Automated PRs**
- Use Dependabot or Renovate
- Configure for security updates
- Auto-merge patch updates

### 2. Static Application Security Testing (SAST)

```yaml
security-scan:
  parallel: true
  steps:
    - javascript-scan:
        commands:
          - npm audit
          - npx snyk test
    
    - python-scan:
        commands:
          - bandit -r app/
          - safety check
    
    - go-scan:
        commands:
          - gosec ./...
          - nancy go.sum
```

### 3. Secret Management

**Never commit secrets**
```yaml
# Use environment variables
environment:
  - DATABASE_URL: ${SECRET_DATABASE_URL}
  - API_KEY: ${SECRET_API_KEY}
```

**Scan for secrets**
```yaml
secret-scan:
  image: trufflesecurity/trufflehog
  commands:
    - trufflehog filesystem . --only-verified
```

### 4. Container Security

```dockerfile
# Use specific versions
FROM node:20.11.0-alpine

# Run as non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy with correct permissions
COPY --chown=nodejs:nodejs . .

USER nodejs
```

## Performance Optimization

### 1. Pipeline Speed

**Caching Strategy**
```yaml
restore-cache:
  settings:
    cache_key: "{{ .Repo.Name }}-{{ checksum \"package-lock.json\" }}"
    mount:
      - node_modules
      - .next/cache
```

**Parallel Execution**
```yaml
steps:
  - install-deps

  - group: parallel-checks
    depends_on: [install-deps]
    steps:
      - lint
      - type-check
      - security-scan
```

### 2. Build Optimization

**Node.js**
```javascript
// next.config.js
module.exports = {
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};
```

**Go**
```makefile
build:
	CGO_ENABLED=0 go build -ldflags="-s -w" -o app
	upx --best app  # Further compression
```

### 3. Resource Limits

```yaml
steps:
  heavy-task:
    resources:
      limits:
        memory: 2Gi
        cpu: 2
    commands:
      - npm run build
```

## Docker & Containerization

### 1. Multi-Stage Builds

```dockerfile
# Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

USER nodejs
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### 2. Image Optimization

- Use Alpine-based images
- Remove unnecessary files
- Combine RUN commands
- Order layers by change frequency

### 3. Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1
```

## Monitoring & Observability

### 1. Build Metrics

Track key metrics:
- Build duration
- Success/failure rate
- Test execution time
- Code coverage trends

### 2. Notifications

```yaml
notify-slack:
  image: plugins/slack
  settings:
    webhook: ${SLACK_WEBHOOK}
    channel: ci-cd
    template: |
      {{#success build.status}}
        ✅ Build #{{build.number}} succeeded
      {{else}}
        ❌ Build #{{build.number}} failed
      {{/success}}
      Commit: {{build.commit}}
      Author: {{build.author}}
  when:
    status: [success, failure]
```

### 3. Artifacts

```yaml
upload-artifacts:
  commands:
    - tar -czf artifacts.tar.gz dist/ coverage/
  artifacts:
    - artifacts.tar.gz
```

## Documentation Standards

### 1. Pipeline Documentation

```yaml
# Each pipeline should have:
# 1. Purpose description
# 2. Trigger conditions
# 3. Required secrets/env vars
# 4. Output artifacts

# Example:
# This pipeline builds and tests the Node.js application
# Triggers: Push to main, develop, or PR
# Requires: NPM_TOKEN for private packages
# Outputs: Docker image tagged with commit SHA
```

### 2. Inline Comments

```yaml
steps:
  # Install dependencies with frozen lockfile
  # This ensures reproducible builds
  install:
    commands:
      - npm ci  # Use ci instead of install for speed
```

### 3. README Integration

Include CI/CD badges and instructions:

```markdown
# Project Name

![Build Status](https://ci.example.com/api/badges/org/repo/status.svg)
![Coverage](https://img.shields.io/codecov/c/github/org/repo)

## CI/CD

This project uses Woodpecker CI for automated testing and deployment.

### Running Tests Locally
```bash
npm test
npm run lint
npm run type-check
```

### Pipeline Stages
1. **Install**: Install dependencies
2. **Lint**: Check code style
3. **Test**: Run unit tests with coverage
4. **Build**: Create production build
5. **Deploy**: Deploy to staging/production
```

## Common Patterns

### 1. Feature Branch Workflow

```yaml
when:
  - event: push
    branch: main
    # Full pipeline with deployment
  
  - event: push
    branch: develop
    # Full pipeline to staging
  
  - event: push
    branch: feature/*
    # Tests only, no deployment
  
  - event: pull_request
    # Tests + preview deployment
```

### 2. Semantic Versioning

```yaml
tag-release:
  when:
    event: push
    branch: main
  commands:
    - npm version patch -m "Release %s"
    - git push --tags
```

### 3. Database Migrations

```yaml
migrate-database:
  image: migrate/migrate
  commands:
    - migrate -path ./migrations -database ${DATABASE_URL} up
  when:
    event: deployment
    environment: production
```

## Troubleshooting Tips

### 1. Debugging Failed Builds

```yaml
debug-info:
  commands:
    - echo "Current directory: $(pwd)"
    - echo "Files in directory:"
    - ls -la
    - echo "Environment variables:"
    - env | grep -E "NODE|CI" | sort
  when:
    status: failure
```

### 2. Local Testing

Create scripts to test pipelines locally:

```bash
#!/bin/bash
# test-pipeline.sh
docker run --rm \
  -v $(pwd):/workspace \
  -w /workspace \
  node:20-alpine \
  sh -c "npm ci && npm test"
```

### 3. Common Issues

- **Cache conflicts**: Clear cache when dependencies change significantly
- **Flaky tests**: Use retry logic for network-dependent tests
- **Resource limits**: Increase limits for memory-intensive operations
- **Permission errors**: Ensure proper file ownership in Docker

## Conclusion

Following these CI/CD best practices ensures:

1. **Reliability**: Consistent, reproducible builds
2. **Security**: Early detection of vulnerabilities
3. **Performance**: Fast feedback loops
4. **Quality**: Enforced standards across the team
5. **Maintainability**: Clear, documented processes

Regular review and iteration of these practices keeps the CI/CD pipeline aligned with project needs and industry standards.