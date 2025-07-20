# Development Guidelines - Universal Standards

**Module**: DEVELOPMENT-GUIDELINES.md  
**Version**: 2.0 Modular Architecture  
**Dependencies**: None (Tony-independent)  
**Load Context**: All development sessions  
**Purpose**: Universal development practices and quality standards  

## 🎯 Development Philosophy

### Quality-First Approach
Every development activity must prioritize long-term maintainability, readability, and reliability over short-term convenience or speed.

### Documentation-Driven Development
All code, APIs, and system components must be thoroughly documented with clear input/output specifications and dependencies.

### Atomic Task Principle
All work must be broken into atomic units (≤30 minutes) with clear objectives, dependencies, and success criteria.

## 📋 Task Management & Tracking

### Hierarchical Task Numbering System
Use structured numbering for comprehensive task tracking:

```markdown
# Task Numbering Format: P.TTT.SS.AA.MM

P     = Phase Number (1 digit)
TTT   = Task Number (3 digits, resets per phase)
SS    = Subtask Number (2 digits)
AA    = Atomic Task Number (2 digits)
MM    = Micro Task Number (2 digits, optional)

# Examples:
1.001         = Phase 1, Task 1
1.001.01      = Phase 1, Task 1, Subtask 1  
1.001.01.01   = Phase 1, Task 1, Subtask 1, Atomic Task 1
1.001.01.01.01 = Phase 1, Task 1, Subtask 1, Atomic Task 1, Micro Task 1
```

### Task Documentation Requirements
Every task must include:
- **Objective**: Specific, measurable goal
- **Duration**: Realistic time estimate (≤30 minutes for atomic tasks)
- **Dependencies**: Prerequisites and blocking conditions
- **Success Criteria**: Verifiable completion conditions
- **Files Affected**: Specific paths and expected changes
- **Testing Requirements**: Validation steps and expected results
- **Notes**: Implementation decisions, blockers, and context

### Master Task List Structure
Maintain `docs/project-management/MASTER_TASK_LIST.md` with:
- High-level abstracted master tasks
- Task status, blockers, and dependencies
- Assigned agents and difficulty estimates
- Phase planning and milestone tracking

## 🧪 Testing & Verification Standards

### CRITICAL: Test-First Development Mandate (Updated July 2025)
**MANDATORY**: All development MUST follow test-first methodology. NO EXCEPTIONS.

### Testing Requirements
- **Test Coverage**: Minimum 85% coverage for all new code
- **Test Success Rate**: Minimum 80% passing tests before completion claims
- **Test Documentation**: All test cases documented with purpose and expected outcomes
- **Integration Testing**: All components must have integration test coverage
- **Test-First Compliance**: Tests MUST be written and failing BEFORE any implementation

### Test-First Development Workflow
```markdown
# MANDATORY Test-First Workflow (Updated July 2025)

1. BEFORE ANY CODING - Write Tests First:
   - Analyze requirements and expected behavior
   - Write comprehensive test cases for all scenarios
   - Include edge cases, error conditions, and happy paths
   - Verify all tests FAIL before implementation (RED phase)

2. Implementation Phase:
   - Write MINIMAL code to make tests pass (GREEN phase)
   - Do not add functionality not covered by tests
   - Focus on making tests pass, not optimization

3. Refactoring Phase:
   - Improve code quality while maintaining test success
   - Optimize performance and readability
   - Ensure all tests still pass after refactoring

4. Independent QA Verification (MANDATORY):
   - Submit work to independent QA agent
   - Provide test evidence and coverage reports
   - Wait for QA approval before marking complete
   - Address any QA feedback or failures

5. Test Categories Required:
   - Unit Tests: Individual function/method testing
   - Integration Tests: Component interaction testing  
   - End-to-End Tests: Complete workflow validation
   - Performance Tests: Critical path benchmarking
   - Security Tests: Authentication, authorization, data handling

6. Verification Before Completion:
   - All tests must pass (100% of written tests)
   - Test coverage must meet minimum (≥85%)
   - Independent QA must verify and approve
   - Build must succeed in clean environment
   - Documentation must be updated
```

### Independent QA Verification Protocol (Mandatory as of July 2025)
```markdown
# QA Verification Requirements

1. Independence Rule:
   - Original developer CANNOT verify their own work
   - QA must be performed by different agent/developer
   - No self-certification under any circumstances

2. QA Agent Responsibilities:
   - Re-run all tests in clean environment
   - Verify test coverage meets requirements
   - Check for test quality (not just quantity)
   - Validate documentation updates
   - Confirm build success
   - Check for regressions

3. QA Deployment Command:
   claude -p "Independent QA for task [TASK-ID]:
   - Verify all tests were written before code
   - Re-run test suite and verify coverage
   - Check build in clean environment
   - Validate documentation updates
   - Report PASS/FAIL with evidence" \
   --model sonnet \
   --allowedTools="Read,Bash,Glob,Grep"

4. QA Checklist:
   - [ ] Tests written before implementation (verify timestamps)
   - [ ] All tests passing independently (100%)
   - [ ] Coverage meets requirements (≥85%)
   - [ ] Build succeeds in clean environment
   - [ ] No regressions in existing functionality
   - [ ] Documentation accurately reflects changes
   - [ ] Security scans show no new vulnerabilities
   - [ ] Performance within acceptable thresholds
```

### Build Verification
- **Build Success**: All builds must pass before claiming completion
- **Environment Validation**: Test environments verified before test execution
- **Dependency Resolution**: All dependencies resolved without conflicts
- **Deployment Testing**: Deployment process validated in staging environments

## 📚 Documentation Standards

### API Documentation Requirements
All APIs must include:
- **Endpoint Description**: Purpose and functionality
- **Input Parameters**: Type, format, validation rules, examples
- **Output Format**: Response structure, data types, examples
- **Error Handling**: Error codes, messages, recovery procedures
- **Authentication**: Security requirements and implementation
- **Rate Limiting**: Usage limits and throttling behavior

### Function Documentation Requirements
All functions must include:
- **Purpose**: What the function does and why it exists
- **Input Parameters**: Types, constraints, default values
- **Return Values**: Type, format, possible values
- **Side Effects**: File system, database, network operations
- **Dependencies**: Required libraries, services, or data
- **Examples**: Usage examples with expected outcomes

### Data Flow Documentation
For complex systems, document:
- **Data Sources**: Where data originates and how it's acquired
- **Processing Pipeline**: Transformation steps and business logic
- **Data Storage**: Persistence layers and data models
- **Data Consumers**: How and where data is used
- **Error Handling**: Data validation and error recovery

## 💻 Code Quality Standards

### Style Guide Compliance
All projects must follow Google Style Guides:
- **JavaScript/TypeScript**: [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)
- **Python**: [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html)
- **Java**: [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
- **C++**: [Google C++ Style Guide](https://google.github.io/styleguide/cppguide.html)
- **Go**: [Effective Go](https://golang.org/doc/effective_go.html)

### Code Quality Gates
- **Linting**: Zero linting errors (ESLint, pylint, etc.)
- **Type Checking**: Strict type checking enabled (TypeScript, mypy)
- **Code Formatting**: Consistent formatting (Prettier, Black, gofmt)
- **Security Scanning**: No high-severity vulnerabilities
- **Performance**: Critical paths meet performance benchmarks

### Code Review Requirements
- **Self-Review**: Author reviews their own code before submission
- **Peer Review**: Independent review by team member
- **Documentation Review**: Ensure all documentation is accurate and complete
- **Test Review**: Verify test coverage and quality
- **Security Review**: Check for security vulnerabilities and best practices

## 📁 File Organization Standards

### Directory Structure
```
project-root/
├── docs/                    # All documentation
│   ├── api/                # API documentation
│   ├── development/        # Development guides and standards
│   ├── user/              # User-facing documentation
│   └── project-management/ # Project planning and tracking
├── scripts/               # Automation and utility scripts
├── logs/                  # Application and development logs
├── tests/                 # Test suites and test data
├── src/                   # Source code
│   ├── components/        # Reusable components
│   ├── services/          # Business logic and external services
│   ├── utils/             # Utility functions and helpers
│   └── config/            # Configuration files
└── build/                 # Build artifacts and distribution files
```

### File Naming Conventions
- **Use kebab-case** for files and directories: `user-service.js`, `api-documentation.md`
- **Use PascalCase** for class files: `UserService.js`, `ApiController.py`
- **Use UPPERCASE** for constants and environment files: `CONFIG.js`, `.ENV`
- **Include purpose** in filename: `user-auth-service.js`, `database-migration-001.sql`

### File Size Guidelines
- **Maximum File Size**: 500 lines for maintainability and context management
- **Function Size**: Maximum 50 lines per function
- **Class Size**: Maximum 300 lines per class
- **Module Cohesion**: Each file should have a single, well-defined purpose

## 🔄 Version Control & Git Practices

### Git Repository Standards
- **Project Repository**: Each project must have its own dedicated repository (configured during Tony deployment)
- **Repository Structure**: Follow industry standard practices for branching and releases
- **Branch Naming**: Use descriptive names: `feature/user-authentication`, `bugfix/login-error`
- **Commit Messages**: Descriptive messages including task IDs and purpose
- **Version Tracking**: Start with version 0.0.1 and follow semantic versioning
- **Remote Configuration**: Tony configures project repository during initial deployment

### Commit Standards
```bash
# Commit Message Format
[TASK-ID]: <type>: <description>

# Examples:
[1.001.01]: feat: implement user authentication service
[1.002.03]: fix: resolve database connection timeout issue  
[1.003.01]: docs: add API documentation for user endpoints
[1.004.02]: test: add integration tests for payment processing

# Commit Types:
feat     = New feature implementation
fix      = Bug fix or issue resolution
docs     = Documentation updates
test     = Test creation or updates
refactor = Code restructuring without functionality changes
style    = Code formatting and style improvements
perf     = Performance improvements
chore    = Maintenance tasks and dependency updates
```

### Repository Setup & Maintenance
- **Project Repository**: Each project must have its own dedicated repository
- **Repository Configuration**: Tony prompts for project repository URL during deployment
- **Regular Commits**: Commit frequently with meaningful messages including task IDs
- **Feature Branches**: Use branches for all feature development
- **Code Reviews**: All commits must pass review before merging
- **Release Tagging**: Tag all releases with version numbers
- **Changelog**: Maintain detailed changelog for all releases

### Git Repository Guidelines
- **One Repository Per Project**: Never mix multiple projects in one repository
- **Repository URL Format**: Use standard Git URLs (https:// or git@)
- **Remote Configuration**: Tony configures 'origin' remote during project setup
- **Commit Message Format**: Include task IDs (P.TTT.SS.AA) in all commit messages
- **Push Policy**: Coordinate with team lead before pushing to main/master branch

## 📊 Version Tracking & Release Management

### Version File Management
- **VERSION File**: Maintain `VERSION` file in project root
- **Version Format**: Use semantic versioning (MAJOR.MINOR.PATCH)
- **Version Updates**: Update version file with every release
- **Change Documentation**: Document all changes in `CHANGELOG.md`

### Release Standards
```markdown
# Release Checklist

Pre-Release:
- [ ] All tests passing (85%+ coverage, 80%+ success rate)
- [ ] Documentation updated and accurate  
- [ ] Security scan completed (no high-severity issues)
- [ ] Performance benchmarks met
- [ ] Version number updated
- [ ] Changelog updated with release notes

Release Process:
- [ ] Create release branch
- [ ] Final testing in staging environment
- [ ] Tag release with version number
- [ ] Deploy to production environment
- [ ] Monitor deployment for issues
- [ ] Update documentation links

Post-Release:
- [ ] Monitor system metrics and logs
- [ ] Address any immediate issues
- [ ] Plan next release cycle
- [ ] Document lessons learned
```

## 🛡️ Security & Compliance Standards

### Security Best Practices
- **Never expose secrets**: No API keys, passwords, or tokens in code
- **Input Validation**: Validate all user inputs and external data
- **Authentication**: Implement robust authentication and authorization
- **HTTPS Only**: All network communication must use encryption
- **Dependency Management**: Keep dependencies updated and scan for vulnerabilities

### Compliance Requirements
- **Data Privacy**: Follow GDPR, CCPA, and applicable privacy regulations
- **Audit Trails**: Maintain logs for all system operations and user actions
- **Access Control**: Implement principle of least privilege
- **Data Retention**: Define and enforce data retention policies
- **Incident Response**: Have procedures for security incident handling

## 🔍 Quality Assurance Process

### Continuous Quality Monitoring
- **Automated Testing**: Run tests on every commit
- **Code Quality Metrics**: Monitor code quality scores and trends
- **Performance Monitoring**: Track system performance and resource usage
- **Security Scanning**: Regular vulnerability assessments
- **Dependency Auditing**: Monitor dependencies for security issues

### Review Process
- **Design Review**: Review system design before implementation
- **Code Review**: Review all code changes before merging
- **Test Review**: Review test coverage and quality
- **Documentation Review**: Ensure documentation accuracy and completeness
- **Security Review**: Review changes for security implications

## 🐳 Container & Deployment Standards

### Docker Compose Requirements (MANDATORY)
- **MUST USE**: `docker compose` (v2) command exclusively
- **NEVER USE**: `docker-compose` (v1) - deprecated and not supported
- **Validation**: Run `docker compose config` to validate syntax
- **Installation**: Use Docker Desktop or Docker Compose v2 plugin

### Container Best Practices
- Use Docker for containerization with multi-stage builds
- Implement health checks for all services using `healthcheck` directive
- Use semantic versioning for container images (never `latest` in production)
- Secure container configurations and secrets management
- Optimize image size and build time with multi-stage builds
- Use specific base image versions with security updates

### Docker Compose File Standards
- Use `docker-compose.yml` as the primary file
- Implement proper service dependencies with `depends_on` and `condition`
- Configure resource limits (`memory`, `cpu`) and restart policies
- Use external networks and volumes when appropriate
- Document service configurations and environment variables
- Use `.env` files for environment-specific configurations (never commit these)

### Migration from Docker Compose v1
If migrating from deprecated `docker-compose` (v1):

```bash
# Automated fix using Tony
/tony docker auto-fix

# Manual fix for scripts and Makefiles
find . -type f -name "*.sh" -exec sed -i 's/docker-compose/docker compose/g' {} +
find . -type f -name "Makefile" -exec sed -i 's/docker-compose/docker compose/g' {} +

# Validate updated files
docker compose config

# Test services
docker compose up --dry-run
```

### Docker Security Standards
- Never run containers as root unless absolutely necessary
- Use read-only filesystems where possible
- Scan images for vulnerabilities regularly
- Use secrets management (Docker secrets or external vaults)
- Limit container capabilities and system calls
- Use network policies to restrict container communication

## 🚀 GitHub CI/CD Build Processes

**MANDATORY**: All projects must implement comprehensive GitHub CI/CD pipelines with Docker image management for deployments and testing.

### CI/CD Pipeline Requirements

#### Essential Workflow Stages
All projects must implement these pipeline stages:

1. **Code Quality Gate**
   - Linting and code style validation
   - Security scanning (secrets detection, dependency vulnerabilities)
   - Unit test execution with coverage requirements (≥80%)

2. **Build Stage**
   - Docker image building with multi-stage optimization
   - Semantic versioning and tagging
   - Build artifact caching for performance

3. **Testing Stage**
   - Integration testing with containerized services
   - End-to-end testing in Docker environments
   - Performance and load testing (where applicable)

4. **Security Stage**
   - Container image vulnerability scanning
   - Static application security testing (SAST)
   - Dependency security audit

5. **Deployment Preparation**
   - Image pushing to container registry
   - Environment-specific configuration validation
   - Deployment artifact preparation

### GitHub Actions Workflow Structure

#### Standard Workflow Template
All projects must use this standardized GitHub Actions structure:

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  release:
    types: [ published ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  code-quality:
    name: Code Quality Gate
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup language environment
        # Language-specific setup (Node.js, Python, Go, etc.)
        
      - name: Install dependencies
        run: |
          # Install project dependencies
          
      - name: Run linting
        run: |
          # ESLint, flake8, golint, etc.
          
      - name: Security scan
        run: |
          # Dependency vulnerability scan
          # Secrets detection scan
          
      - name: Run tests
        run: |
          # Unit tests with coverage
          
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        
  build:
    name: Build Docker Images
    needs: code-quality
    runs-on: ubuntu-latest
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      image-digest: ${{ steps.build.outputs.digest }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3
        
      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-
            
      - name: Build and push
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          
  test:
    name: Integration Testing
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Docker Compose
        run: |
          # Setup test environment with Docker Compose v2
          
      - name: Run integration tests
        run: |
          # Docker Compose-based integration testing
          docker compose -f docker-compose.test.yml up --abort-on-container-exit
          
      - name: Run E2E tests
        run: |
          # End-to-end testing with built images
          
  security:
    name: Security Scanning
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ needs.build.outputs.image-tag }}
          format: 'sarif'
          output: 'trivy-results.sarif'
          
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
          
  deploy-staging:
    name: Deploy to Staging
    needs: [test, security]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging environment
        run: |
          # Staging deployment logic
          
  deploy-production:
    name: Deploy to Production
    needs: [test, security]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production environment
        run: |
          # Production deployment logic
```

### Docker Image Management Standards

#### Image Naming and Tagging Strategy
```bash
# Registry: GitHub Container Registry (ghcr.io)
# Format: ghcr.io/organization/repository:tag

# Development builds
ghcr.io/company/project:develop-abc1234

# Feature branches  
ghcr.io/company/project:feature-auth-abc1234

# Pull requests
ghcr.io/company/project:pr-123-abc1234

# Release versions
ghcr.io/company/project:v1.2.3
ghcr.io/company/project:v1.2
ghcr.io/company/project:latest  # Points to latest stable release
```

#### Multi-Stage Docker Build Template
```dockerfile
# Dockerfile
# Stage 1: Dependencies and build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Application build
COPY . .
RUN npm run build

# Stage 3: Runtime
FROM node:18-alpine AS runtime
WORKDIR /app

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Switch to non-root user
USER nextjs

EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Management

#### Environment-Specific Configurations
```yaml
# docker-compose.yml (base)
version: '3.8'
services:
  app:
    image: ghcr.io/company/project:${TAG:-latest}
    environment:
      - NODE_ENV=${NODE_ENV:-production}
    ports:
      - "${PORT:-3000}:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

# docker-compose.staging.yml (override)
version: '3.8'
services:
  app:
    environment:
      - NODE_ENV=staging
      - API_URL=https://api-staging.company.com
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
          
# docker-compose.production.yml (override)  
version: '3.8'
services:
  app:
    environment:
      - NODE_ENV=production
      - API_URL=https://api.company.com
    deploy:
      replicas: 5
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

### Testing with Docker Images

#### Test Automation Requirements
```bash
# Integration testing with Docker Compose
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit

# Load testing with built images
docker run --rm -it \
  --network project_default \
  ghcr.io/company/load-testing:latest \
  --target http://app:3000 \
  --users 100 \
  --duration 60s

# Security testing
docker run --rm -it \
  -v $(pwd):/workspace \
  aquasec/trivy:latest \
  image ghcr.io/company/project:latest
```

### Deployment Strategies

#### Blue-Green Deployment
```yaml
# GitHub Actions deployment job
deploy:
  name: Blue-Green Deployment
  runs-on: ubuntu-latest
  steps:
    - name: Deploy new version (Green)
      run: |
        # Deploy to green environment
        docker service create --name app-green \
          --network app-network \
          ghcr.io/company/project:${{ github.sha }}
        
    - name: Health check green deployment
      run: |
        # Wait for green deployment health
        timeout 300 bash -c 'until curl -f http://green.app.com/health; do sleep 5; done'
        
    - name: Switch traffic to green
      run: |
        # Update load balancer to point to green
        # Remove blue deployment
        docker service rm app-blue || true
        docker service update --name app-green app
```

#### Rolling Updates
```yaml
deploy:
  name: Rolling Update
  runs-on: ubuntu-latest
  steps:
    - name: Rolling update
      run: |
        docker service update \
          --image ghcr.io/company/project:${{ github.sha }} \
          --update-order start-first \
          --update-parallelism 1 \
          --update-delay 30s \
          app
```

### Quality Gates and Compliance

#### Required Checks Before Deployment
1. **Build Success**: All stages must pass
2. **Test Coverage**: ≥80% coverage required
3. **Security Scan**: No high/critical vulnerabilities
4. **Performance**: Response time within SLA
5. **Image Size**: Optimized image size (documented baseline)

#### Branch Protection Rules
```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "code-quality",
      "build",
      "test",
      "security"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 2,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  },
  "restrictions": {
    "teams": ["senior-developers"],
    "users": []
  }
}
```

### Monitoring and Observability

#### Container Metrics and Logging
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  app:
    image: ghcr.io/company/project:latest
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    labels:
      - "prometheus.io/scrape=true"
      - "prometheus.io/port=3000"
      - "prometheus.io/path=/metrics"
      
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Project Initialization Checklist

When starting a new project, ensure:

- [ ] GitHub repository created with proper access controls
- [ ] Branch protection rules configured  
- [ ] CI/CD workflow file created (`.github/workflows/ci-cd.yml`)
- [ ] Multi-stage Dockerfile implemented
- [ ] Docker Compose files for all environments
- [ ] Container registry access configured
- [ ] Environment-specific secrets configured
- [ ] Health check endpoints implemented
- [ ] Monitoring and logging configured
- [ ] Documentation updated with deployment procedures

### Tony CI/CD Integration

Tony framework provides automated CI/CD setup and validation:

```bash
# Generate CI/CD pipeline for current project
/tony git setup-cicd

# Validate existing CI/CD configuration
/tony docker validate-pipeline

# Security audit of deployment configuration
/tony security audit-cicd

# Performance analysis of build pipeline
/tony audit pipeline-performance
```

---

**Module Status**: ✅ Development guidelines ready  
**Independence**: Usable without any framework dependencies  
**Scope**: Universal standards for all development projects  
**Compliance**: Industry best practices and security standards  
**Maintainability**: Clear structure for long-term project success