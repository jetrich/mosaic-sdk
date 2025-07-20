---
title: "CI/CD Pipeline Templates"
order: 04
category: "pipeline-setup"
tags: ['cicd', 'pipelines', 'automation']
last_updated: "2025-07-19"
author: "consolidation"
version: "1.0"
status: "published"
---

# CI/CD Pipeline Templates

## Overview

This document describes the reusable CI/CD pipeline templates available for the MosAIc Stack. These templates provide standardized, best-practice configurations that can be customized for specific project needs.

## Available Templates

### 1. Base Pipeline Template
**File**: `templates/base-pipeline.yml`

The base template provides common functionality shared across all pipelines:
- Version information and metadata
- Secret scanning
- License checking
- Artifact collection
- Notifications
- Service definitions

### 2. Node.js/TypeScript Template
**File**: `templates/node-pipeline.yml`

Specialized for Node.js and TypeScript projects:
- npm/yarn dependency management
- ESLint and TypeScript checking
- Jest testing with coverage
- Bundle size analysis
- Next.js/React optimizations

### 3. Python Template
**File**: `templates/python-pipeline.yml`

Optimized for Python projects:
- pip/poetry/pipenv support
- Black formatting and isort
- Flake8 linting and mypy type checking
- pytest with coverage
- Bandit security scanning

### 4. Go Template
**File**: `templates/go-pipeline.yml`

Tailored for Go applications:
- Go modules management
- gofmt and go vet
- golangci-lint
- Race detection testing
- Cross-platform builds
- gosec security scanning

## Using Templates

### Basic Usage

1. **Copy the appropriate template** to your project's `.woodpecker.yml`:
```bash
cp docs/ci-cd/templates/node-pipeline.yml .woodpecker.yml
```

2. **Customize variables** at the top of the file:
```yaml
variables:
  - &node_version "20"  # Your Node.js version
  - &team_name "backend"
  - &environment "production"
```

3. **Enable/disable steps** as needed:
```yaml
steps:
  # Comment out steps you don't need
  # bundle-size:
  #   ...
```

### Extending Templates

Templates use YAML anchors for easy extension:

```yaml
# Override a step from the template
steps:
  test:
    <<: *base-step  # Inherit base configuration
    commands:
      # Your custom test commands
      - npm run test:unit
      - npm run test:integration
      - npm run test:e2e
```

### Composition

Combine multiple templates:

```yaml
# Include both base and language-specific templates
include:
  - templates/base-pipeline.yml
  - templates/node-pipeline.yml
  
# Add project-specific steps
steps:
  deploy:
    image: alpine
    commands:
      - ./deploy.sh
    when:
      - branch: main
      - event: push
```

## Customization Examples

### 1. Adding Custom Services

```yaml
services:
  # Add MongoDB for integration tests
  mongodb:
    image: mongo:7-alpine
    environment:
      - MONGO_INITDB_ROOT_USERNAME=test
      - MONGO_INITDB_ROOT_PASSWORD=test
    when:
      - event: [push, pull_request]
  
  # Add Elasticsearch
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
```

### 2. Custom Caching Strategy

```yaml
steps:
  # Multiple cache types
  restore-cache:
    parallel: true
    steps:
      - restore-deps-cache:
          image: meltwater/drone-cache
          settings:
            cache_key: "deps-{{ checksum \"package-lock.json\" }}"
            mount: node_modules
      
      - restore-build-cache:
          image: meltwater/drone-cache
          settings:
            cache_key: "build-{{ .Branch }}-{{ .Commit }}"
            mount: dist
```

### 3. Matrix Build Customization

```yaml
matrix:
  include:
    # Test against multiple Node versions and OS
    - NODE_VERSION: "18"
      OS: "alpine"
      IMAGE: "node:18-alpine"
    - NODE_VERSION: "18"
      OS: "debian"
      IMAGE: "node:18-slim"
    - NODE_VERSION: "20"
      OS: "alpine"
      IMAGE: "node:20-alpine"
```

### 4. Conditional Steps

```yaml
steps:
  # Only run expensive tests on main branch
  e2e-tests:
    when:
      - branch: main
      - event: push
    commands:
      - npm run test:e2e
  
  # Run security scan weekly
  deep-security-scan:
    when:
      - event: cron
      - cron: weekly-security-scan
    commands:
      - npm audit
      - snyk test
```

## Template Variables

### Global Variables

All templates support these variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_TYPE` | Application type (node, python, go) | Required |
| `TEAM_NAME` | Team responsible for the project | Required |
| `ENVIRONMENT` | Target environment | `development` |
| `WEBHOOK_URL` | Notification webhook URL | Optional |
| `CACHE_VERSION` | Cache version for invalidation | `v1` |

### Language-Specific Variables

**Node.js**:
- `NODE_VERSION`: Node.js version (e.g., "20")
- `NPM_REGISTRY`: Custom npm registry URL
- `BUILD_OUTPUT_DIR`: Build directory (dist, build, .next)

**Python**:
- `PYTHON_VERSION`: Python version (e.g., "3.11")
- `PACKAGE_MANAGER`: pip, poetry, or pipenv
- `PROJECT_DIR`: Source code directory

**Go**:
- `GO_VERSION`: Go version (e.g., "1.21")
- `GOPROXY`: Go proxy URL
- `CGO_ENABLED`: Enable CGO (0 or 1)

## Best Practices

### 1. Version Pinning

Always pin versions in templates:
```yaml
# Good
image: node:20.11.0-alpine

# Bad
image: node:latest
```

### 2. Fail Fast

Order steps from fastest to slowest:
```yaml
steps:
  - format-check    # Fastest
  - lint           # Fast
  - type-check     # Medium
  - test           # Slow
  - build          # Slowest
```

### 3. Resource Limits

Set appropriate resource limits:
```yaml
steps:
  build:
    resources:
      limits:
        memory: 4Gi
        cpu: 2
```

### 4. Timeouts

Add timeouts to prevent hanging:
```yaml
steps:
  test:
    timeout: 30m  # 30 minutes max
    commands:
      - npm test
```

## Advanced Features

### 1. Dynamic Configuration

```yaml
steps:
  configure:
    commands:
      - |
        # Generate config based on branch
        if [ "$DRONE_BRANCH" = "main" ]; then
          export ENV="production"
        else
          export ENV="development"
        fi
```

### 2. Artifact Publishing

```yaml
steps:
  publish-artifacts:
    image: plugins/s3
    settings:
      bucket: my-artifacts
      source: dist/**/*
      target: /${DRONE_REPO}/${DRONE_BUILD_NUMBER}/
    when:
      - event: push
      - branch: main
```

### 3. Multi-Stage Deployments

```yaml
steps:
  deploy-staging:
    when:
      - branch: develop
      - event: push
    commands:
      - ./deploy.sh staging
  
  deploy-production:
    when:
      - branch: main
      - event: push
    commands:
      - ./deploy.sh production
    depends_on:
      - deploy-staging
```

### 4. Rollback Capability

```yaml
steps:
  test-deployment:
    commands:
      - ./health-check.sh
    when:
      - event: deployment
  
  rollback:
    commands:
      - ./rollback.sh
    when:
      - status: failure
      - event: deployment
```

## Template Maintenance

### Versioning

Templates are versioned to ensure stability:

```yaml
# Template version
x-template-version: &template-version "1.0.0"

steps:
  version-check:
    commands:
      - echo "Using template version: *template-version"
```

### Updates

To update templates:

1. **Test changes** in a separate branch
2. **Document breaking changes** in CHANGELOG
3. **Provide migration guide** for existing users
4. **Version bump** the template

### Contributing

To contribute new templates:

1. Follow existing template structure
2. Include comprehensive comments
3. Add documentation to this guide
4. Test with real projects
5. Submit PR with examples

## Troubleshooting Templates

### Common Issues

1. **Template not loading**
   - Check YAML syntax
   - Verify include paths
   - Ensure no circular dependencies

2. **Variable substitution failing**
   - Use proper YAML anchor syntax
   - Check variable scope
   - Verify environment variables

3. **Steps running out of order**
   - Check `depends_on` declarations
   - Verify `when` conditions
   - Review parallel step grouping

### Debug Mode

Enable debug mode in templates:

```yaml
steps:
  debug:
    commands:
      - set -x  # Enable bash debug
      - echo "=== Environment ==="
      - env | sort
      - echo "=== File Structure ==="
      - find . -type f -name "*.yml" | head -20
    when:
      - evaluate: 'DEBUG == "true"'
```

## Conclusion

These templates provide a solid foundation for CI/CD pipelines while remaining flexible enough to accommodate project-specific needs. By using these templates, teams can:

- Reduce pipeline setup time
- Ensure consistency across projects
- Implement best practices automatically
- Focus on project-specific requirements

Regular updates and community contributions keep these templates current with evolving best practices and tool updates.