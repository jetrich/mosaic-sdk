# CI/CD Workflows Documentation

## Overview

This document describes the CI/CD workflows implemented for the MosAIc Stack using Woodpecker CI. Each workflow is designed to ensure code quality, security, and reliability across different technology stacks.

## Table of Contents

1. [Common Pipeline Structure](#common-pipeline-structure)
2. [Node.js/TypeScript Workflow](#nodejstypescript-workflow)
3. [React/Next.js Workflow](#reactnextjs-workflow)
4. [Python/FastAPI Workflow](#pythonfastapi-workflow)
5. [Go Workflow](#go-workflow)
6. [Best Practices](#best-practices)
7. [Performance Optimization](#performance-optimization)

## Common Pipeline Structure

All pipelines follow a similar structure with these key stages:

### 1. **Trigger Conditions**
```yaml
when:
  - event: [push, pull_request]
    branch: [main, develop, feature/*, hotfix/*]
```

### 2. **Core Stages**
- **Cache Restoration**: Speed up builds by caching dependencies
- **Install/Dependencies**: Install project dependencies
- **Quality Checks**: Linting, formatting, type checking
- **Testing**: Unit tests, integration tests, coverage
- **Build**: Compile/build the application
- **Security**: Vulnerability scanning, SAST
- **Docker**: Build and test containers
- **Deploy**: Deployment notifications/artifacts

### 3. **Services**
External services needed for testing:
- PostgreSQL for database tests
- Redis for caching tests
- Other application-specific services

## Node.js/TypeScript Workflow

### Pipeline Stages

1. **Cache Management**
   ```yaml
   restore-cache:
     image: meltwater/drone-cache:latest
     settings:
       cache_key: "node-{{ checksum \"package-lock.json\" }}"
       mount:
         - node_modules
   ```

2. **Quality Assurance**
   - ESLint for code quality
   - TypeScript compiler for type checking
   - Prettier for formatting (if configured)

3. **Testing Strategy**
   - Jest for unit testing
   - Coverage threshold: 80%
   - Fail pipeline if coverage drops

4. **Build Process**
   - TypeScript compilation to JavaScript
   - Source map generation
   - Production optimizations

### Key Features
- Automatic dependency caching
- Parallel execution of lint and type-check
- Coverage reporting with thresholds
- Docker multi-stage builds
- Matrix builds for multiple Node versions

### Example Commands
```bash
npm ci                    # Install dependencies
npm run lint             # Run ESLint
npm run type-check       # TypeScript checking
npm run test:coverage    # Run tests with coverage
npm run build            # Build production code
```

## React/Next.js Workflow

### Pipeline Stages

1. **Next.js Specific Checks**
   - Next.js built-in linting
   - Component type checking
   - Build optimization analysis

2. **Testing Layers**
   - **Unit Tests**: React Testing Library
   - **Integration Tests**: API route testing
   - **E2E Tests**: Playwright for full user flows

3. **Performance Analysis**
   - Bundle size analysis
   - Lighthouse CI for performance metrics
   - Build time optimization

4. **Production Build**
   - Static optimization
   - Image optimization
   - Code splitting analysis

### Key Features
- Playwright for cross-browser E2E testing
- Bundle analyzer integration
- Lighthouse performance scoring
- Preview deployments for branches
- Security headers validation

### Example Commands
```bash
npm run dev              # Development server
npm run build            # Production build
npm run test:e2e         # E2E tests with Playwright
npm run analyze          # Bundle analysis
```

## Python/FastAPI Workflow

### Pipeline Stages

1. **Code Quality Tools**
   - **Black**: Code formatting
   - **isort**: Import sorting
   - **Flake8**: Linting
   - **mypy**: Type checking

2. **Security Scanning**
   - **Bandit**: SAST for Python
   - **Safety**: Dependency vulnerabilities
   - Custom security checks

3. **Testing Framework**
   - **pytest**: Unit and integration tests
   - **pytest-cov**: Coverage reporting
   - **pytest-asyncio**: Async test support

4. **API Documentation**
   - Automatic OpenAPI generation
   - Swagger UI integration
   - API versioning support

### Key Features
- Strict type checking with mypy
- Security-first approach with multiple scanners
- Async testing support
- Multi-stage Docker builds
- Matrix testing for Python 3.10, 3.11, 3.12

### Example Commands
```bash
black app/ tests/        # Format code
flake8 app/ tests/       # Lint code
mypy app/                # Type check
pytest --cov=app         # Run tests with coverage
uvicorn app.main:app     # Run server
```

## Go Workflow

### Pipeline Stages

1. **Go-Specific Tools**
   - **gofmt**: Standard formatting
   - **go vet**: Static analysis
   - **golangci-lint**: Comprehensive linting
   - **gosec**: Security scanning

2. **Testing Strategy**
   - Unit tests with race detection
   - Benchmark tests for performance
   - Integration tests
   - Coverage analysis

3. **Build Targets**
   - Cross-platform builds (Linux, macOS, Windows)
   - Multiple architectures (amd64, arm64)
   - Static binary compilation
   - Version embedding

4. **Performance**
   - Benchmark testing
   - Binary size optimization
   - Memory usage profiling

### Key Features
- Race condition detection
- Cross-compilation support
- Security scanning with gosec
- Vulnerability checking with govulncheck
- Makefile automation
- Swagger documentation generation

### Example Commands
```bash
go mod download          # Download dependencies
go fmt ./...            # Format code
go vet ./...            # Run static analysis
go test -race ./...     # Test with race detection
go build -o app         # Build binary
```

## Best Practices

### 1. **Caching Strategy**
- Cache dependencies based on lock files
- Cache build artifacts when appropriate
- Use cache keys with checksums
- Clean cache periodically

### 2. **Parallel Execution**
- Run independent steps in parallel
- Use `depends_on` for step dependencies
- Optimize pipeline execution time
- Balance resource usage

### 3. **Security**
- Run security scans on every push
- Use `failure: ignore` for non-critical security checks
- Keep security tools updated
- Regular vulnerability assessments

### 4. **Testing**
- Enforce minimum coverage thresholds
- Run tests in isolated environments
- Use test databases and services
- Implement different test levels (unit, integration, e2e)

### 5. **Docker Best Practices**
- Multi-stage builds for smaller images
- Non-root users in containers
- Health checks for all services
- Layer caching optimization

### 6. **Error Handling**
- Clear error messages
- Proper exit codes
- Artifact collection on failure
- Notification on critical failures

## Performance Optimization

### 1. **Build Speed**
- **Dependency Caching**: Cache node_modules, pip packages, go modules
- **Parallel Steps**: Run lint, type-check, and tests in parallel
- **Incremental Builds**: Use build caches where possible
- **Docker Layer Caching**: Optimize Dockerfile order

### 2. **Resource Usage**
- **Container Sizing**: Use appropriate resource limits
- **Service Optimization**: Only start required services
- **Cleanup Steps**: Remove temporary files and caches
- **Efficient Images**: Use Alpine-based images

### 3. **Pipeline Optimization**
```yaml
# Example of optimized pipeline structure
steps:
  # Fast checks first
  - syntax-check    # Fails fast on syntax errors
  - lint            # Quick static analysis
  
  # Parallel execution
  - group: quality
    steps:
      - type-check
      - security-scan
      - format-check
  
  # Heavy operations last
  - test
  - build
  - docker
```

### 4. **Monitoring and Metrics**
- Track build times
- Monitor failure rates
- Analyze bottlenecks
- Set up alerts for long-running builds

## Matrix Builds

Use matrix builds to test against multiple versions:

```yaml
matrix:
  include:
    - NODE_VERSION: "18"
      NODE_IMAGE: "node:18-alpine"
    - NODE_VERSION: "20"
      NODE_IMAGE: "node:20-alpine"
    - NODE_VERSION: "21"
      NODE_IMAGE: "node:21-alpine"
```

This ensures compatibility across different runtime versions.

## Deployment Strategies

### 1. **Branch-Based Deployments**
- `main` → Production
- `develop` → Staging
- `feature/*` → Preview environments

### 2. **Artifact Management**
- Build once, deploy many
- Version tagging
- Artifact signing
- Retention policies

### 3. **Notifications**
- Success/failure notifications
- Deployment status updates
- Performance regression alerts
- Security vulnerability alerts

## Conclusion

These CI/CD workflows provide comprehensive quality assurance, security scanning, and deployment automation. They can be customized based on project requirements while maintaining the core principles of:

- **Fast feedback** through early failure detection
- **Quality assurance** through automated testing
- **Security** through vulnerability scanning
- **Reliability** through consistent builds
- **Performance** through optimization techniques

Regular review and updates of these pipelines ensure they continue to meet evolving project needs.