#!/bin/bash

# Tony Framework - CI/CD Pipeline Management
# Automates GitHub CI/CD setup and Docker image management

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source shared utilities
source "$SCRIPT_DIR/shared/logging-utils.sh"

# Configuration
MODE="setup"
PROJECT_TYPE="detect"
REGISTRY="ghcr.io"
VERBOSE=false
AUTO_CONFIRM=false
OUTPUT_DIR=".github/workflows"

# Display usage information
show_usage() {
    show_banner "Tony CI/CD Pipeline Management" "Automated GitHub Actions and Docker pipeline setup"
    
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  setup-cicd         Generate complete CI/CD pipeline for current project"
    echo "  validate-pipeline  Validate existing CI/CD configuration"
    echo "  audit-cicd         Security audit of deployment configuration"
    echo "  pipeline-performance  Analyze build pipeline performance"
    echo "  generate-dockerfile   Create optimized Dockerfile for project type"
    echo "  setup-compose      Generate Docker Compose files for all environments"
    echo ""
    echo "Options:"
    echo "  --project-type=TYPE    Project type (node, python, go, rust, auto-detect)"
    echo "  --registry=REGISTRY    Container registry (default: ghcr.io)"
    echo "  --verbose              Enable verbose output"
    echo "  --auto-confirm         Skip confirmation prompts"
    echo "  --help                 Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup-cicd --project-type=node"
    echo "  $0 validate-pipeline --verbose"
    echo "  $0 generate-dockerfile --project-type=python"
}

# Parse command line arguments
parse_arguments() {
    if [ $# -eq 0 ]; then
        show_usage
        exit 1
    fi
    
    MODE="$1"
    shift
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --project-type=*)
                PROJECT_TYPE="${1#*=}"
                ;;
            --registry=*)
                REGISTRY="${1#*=}"
                ;;
            --verbose)
                VERBOSE=true
                enable_verbose
                ;;
            --auto-confirm)
                AUTO_CONFIRM=true
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
        shift
    done
}

# Detect project type
detect_project_type() {
    if [ "$PROJECT_TYPE" != "detect" ]; then
        log_debug "Using specified project type: $PROJECT_TYPE"
        return 0
    fi
    
    log_info "Detecting project type"
    
    if [ -f "package.json" ]; then
        PROJECT_TYPE="node"
        log_info "Detected Node.js project"
    elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
        PROJECT_TYPE="python"
        log_info "Detected Python project"
    elif [ -f "go.mod" ]; then
        PROJECT_TYPE="go"
        log_info "Detected Go project"
    elif [ -f "Cargo.toml" ]; then
        PROJECT_TYPE="rust"
        log_info "Detected Rust project"
    elif [ -f "pom.xml" ]; then
        PROJECT_TYPE="java"
        log_info "Detected Java project"
    elif [ -f "composer.json" ]; then
        PROJECT_TYPE="php"
        log_info "Detected PHP project"
    else
        PROJECT_TYPE="generic"
        log_warning "Could not detect project type, using generic configuration"
    fi
}

# Generate GitHub Actions workflow
generate_github_workflow() {
    print_subsection "Generating GitHub Actions CI/CD Workflow"
    
    local workflow_file="$OUTPUT_DIR/ci-cd.yml"
    
    # Create workflows directory
    mkdir -p "$OUTPUT_DIR"
    
    log_info "Creating CI/CD workflow: $workflow_file"
    
    # Get project name for image naming
    local project_name
    project_name=$(basename "$(pwd)")
    
    cat > "$workflow_file" << EOF
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  release:
    types: [ published ]

env:
  REGISTRY: $REGISTRY
  IMAGE_NAME: \${{ github.repository }}

jobs:
  code-quality:
    name: Code Quality Gate
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup language environment
        $(generate_language_setup)
        
      - name: Install dependencies
        run: |
          $(generate_dependency_install)
          
      - name: Run linting
        run: |
          $(generate_linting_commands)
          
      - name: Security scan - Secrets detection
        run: |
          # Install gitleaks for secrets detection
          curl -sSfL https://github.com/zricethezav/gitleaks/releases/latest/download/gitleaks_linux_x64.tar.gz | tar xz
          chmod +x gitleaks
          ./gitleaks detect --source . --verbose || exit 1
          
      - name: Security scan - Dependencies
        run: |
          $(generate_dependency_audit)
          
      - name: Run tests
        run: |
          $(generate_test_commands)
          
      - name: Upload coverage
        if: \${{ always() }}
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml
          fail_ci_if_error: false
        
  build:
    name: Build Docker Images
    needs: code-quality
    runs-on: ubuntu-latest
    outputs:
      image-tag: \${{ steps.meta.outputs.tags }}
      image-digest: \${{ steps.build.outputs.digest }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3
        
      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
          
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}
            
      - name: Build and push
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            BUILD_DATE=\${{ steps.meta.outputs.created }}
            VCS_REF=\${{ github.sha }}
            VERSION=\${{ steps.meta.outputs.version }}
          
  test:
    name: Integration Testing
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Docker Compose
        run: |
          # Docker Compose v2 is pre-installed on GitHub Actions runners
          docker compose version
          
      - name: Run integration tests
        run: |
          # Use built image for integration testing
          export IMAGE_TAG=\${{ needs.build.outputs.image-tag }}
          docker compose -f docker-compose.test.yml up --abort-on-container-exit
          docker compose -f docker-compose.test.yml down
          
      - name: Run E2E tests
        if: \${{ always() }}
        run: |
          $(generate_e2e_commands)
          
  security:
    name: Security Scanning
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: \${{ needs.build.outputs.image-tag }}
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'
          
      - name: Upload Trivy scan results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'
          
      - name: Container security best practices check
        run: |
          # Check for non-root user
          docker run --rm \${{ needs.build.outputs.image-tag }} whoami | grep -v root || (echo "Container runs as root - security issue" && exit 1)
          
  performance:
    name: Performance Testing
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name != 'pull_request'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Performance testing
        run: |
          $(generate_performance_tests)
          
  deploy-staging:
    name: Deploy to Staging
    needs: [test, security]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging environment
        run: |
          echo "Deploying \${{ needs.build.outputs.image-tag }} to staging"
          # Add staging deployment logic here
          
  deploy-production:
    name: Deploy to Production
    needs: [test, security, performance]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production environment
        run: |
          echo "Deploying \${{ needs.build.outputs.image-tag }} to production"
          # Add production deployment logic here
EOF

    log_success "GitHub Actions workflow created: $workflow_file"
}

# Generate language-specific setup
generate_language_setup() {
    case "$PROJECT_TYPE" in
        "node")
            cat << 'EOF'
uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
EOF
            ;;
        "python")
            cat << 'EOF'
uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'
EOF
            ;;
        "go")
            cat << 'EOF'
uses: actions/setup-go@v4
        with:
          go-version: '1.21'
          cache: true
EOF
            ;;
        "rust")
            cat << 'EOF'
uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          profile: minimal
          override: true
          components: rustfmt, clippy
EOF
            ;;
        *)
            echo "# Language-specific setup for $PROJECT_TYPE"
            ;;
    esac
}

# Generate dependency installation commands
generate_dependency_install() {
    case "$PROJECT_TYPE" in
        "node")
            echo "npm ci"
            ;;
        "python")
            cat << 'EOF'
python -m pip install --upgrade pip
pip install -r requirements.txt
if [ -f requirements-dev.txt ]; then pip install -r requirements-dev.txt; fi
EOF
            ;;
        "go")
            echo "go mod download"
            ;;
        "rust")
            echo "cargo build --release"
            ;;
        *)
            echo "# Add dependency installation commands for $PROJECT_TYPE"
            ;;
    esac
}

# Generate linting commands
generate_linting_commands() {
    case "$PROJECT_TYPE" in
        "node")
            cat << 'EOF'
npm run lint || echo "Linting failed, but continuing"
if command -v prettier >/dev/null 2>&1; then
  npx prettier --check .
fi
EOF
            ;;
        "python")
            cat << 'EOF'
if command -v flake8 >/dev/null 2>&1; then
  flake8 .
fi
if command -v black >/dev/null 2>&1; then
  black --check .
fi
if command -v pylint >/dev/null 2>&1; then
  pylint **/*.py || echo "Pylint issues found"
fi
EOF
            ;;
        "go")
            cat << 'EOF'
go fmt ./...
go vet ./...
if command -v golangci-lint >/dev/null 2>&1; then
  golangci-lint run
fi
EOF
            ;;
        "rust")
            cat << 'EOF'
cargo fmt --all -- --check
cargo clippy -- -D warnings
EOF
            ;;
        *)
            echo "# Add linting commands for $PROJECT_TYPE"
            ;;
    esac
}

# Generate dependency audit commands
generate_dependency_audit() {
    case "$PROJECT_TYPE" in
        "node")
            echo "npm audit --audit-level=high"
            ;;
        "python")
            cat << 'EOF'
if command -v safety >/dev/null 2>&1; then
  safety check
fi
if command -v bandit >/dev/null 2>&1; then
  bandit -r . -f json -o bandit-report.json || echo "Bandit scan completed"
fi
EOF
            ;;
        "go")
            cat << 'EOF'
if command -v govulncheck >/dev/null 2>&1; then
  govulncheck ./...
fi
EOF
            ;;
        "rust")
            cat << 'EOF'
if command -v cargo-audit >/dev/null 2>&1; then
  cargo audit
fi
EOF
            ;;
        *)
            echo "# Add dependency audit commands for $PROJECT_TYPE"
            ;;
    esac
}

# Generate test commands
generate_test_commands() {
    case "$PROJECT_TYPE" in
        "node")
            cat << 'EOF'
npm test
if npm run test:coverage >/dev/null 2>&1; then
  npm run test:coverage
fi
EOF
            ;;
        "python")
            cat << 'EOF'
if command -v pytest >/dev/null 2>&1; then
  pytest --cov=. --cov-report=xml --cov-report=html
else
  python -m unittest discover
fi
EOF
            ;;
        "go")
            echo "go test -v -race -coverprofile=coverage.out ./..."
            ;;
        "rust")
            echo "cargo test --all-features"
            ;;
        *)
            echo "# Add test commands for $PROJECT_TYPE"
            ;;
    esac
}

# Generate E2E test commands
generate_e2e_commands() {
    case "$PROJECT_TYPE" in
        "node")
            cat << 'EOF'
if npm run e2e >/dev/null 2>&1; then
  npm run e2e
elif command -v cypress >/dev/null 2>&1; then
  npx cypress run
elif command -v playwright >/dev/null 2>&1; then
  npx playwright test
fi
EOF
            ;;
        "python")
            cat << 'EOF'
if command -v selenium >/dev/null 2>&1; then
  python -m pytest tests/e2e/
fi
EOF
            ;;
        *)
            echo "# Add E2E test commands for $PROJECT_TYPE"
            ;;
    esac
}

# Generate performance test commands
generate_performance_tests() {
    case "$PROJECT_TYPE" in
        "node")
            cat << 'EOF'
if npm run perf >/dev/null 2>&1; then
  npm run perf
elif command -v lighthouse >/dev/null 2>&1; then
  # Web performance testing
  npx lighthouse http://localhost:3000 --output=json --output-path=lighthouse-report.json
fi
EOF
            ;;
        *)
            cat << 'EOF'
# Performance testing with built image
docker run --rm -d --name perf-test -p 8080:3000 ${{ needs.build.outputs.image-tag }}
sleep 10
# Basic performance check
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8080/health
docker stop perf-test
EOF
            ;;
    esac
}

# Generate Dockerfile
generate_dockerfile() {
    print_subsection "Generating Optimized Dockerfile"
    
    local dockerfile="Dockerfile"
    
    if [ -f "$dockerfile" ] && [ "$AUTO_CONFIRM" != true ]; then
        read -p "Dockerfile already exists. Overwrite? (y/N): " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            log_info "Skipping Dockerfile generation"
            return 0
        fi
    fi
    
    log_info "Creating optimized Dockerfile for $PROJECT_TYPE project"
    
    case "$PROJECT_TYPE" in
        "node")
            cat > "$dockerfile" << 'EOF'
# Multi-stage build for Node.js application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build 2>/dev/null || echo "No build script found"

# Production stage
FROM node:18-alpine AS runtime

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist 2>/dev/null || \
     COPY --from=builder --chown=nodejs:nodejs /app/build ./build 2>/dev/null || \
     COPY --from=builder --chown=nodejs:nodejs /app/public ./public 2>/dev/null || true
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE ${PORT:-3000}

# Start application
CMD ["npm", "start"]
EOF
            ;;
        "python")
            cat > "$dockerfile" << 'EOF'
# Multi-stage build for Python application
FROM python:3.11-slim AS builder

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements*.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.11-slim AS runtime

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Security: Create non-root user
RUN useradd --create-home --shell /bin/bash app

# Set working directory
WORKDIR /app

# Copy Python dependencies from builder
COPY --from=builder /root/.local /home/app/.local

# Copy application code
COPY --chown=app:app . .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Switch to non-root user
USER app

# Add local Python packages to PATH
ENV PATH=/home/app/.local/bin:$PATH

# Expose port
EXPOSE ${PORT:-8000}

# Start application
CMD ["python", "-m", "app"]
EOF
            ;;
        "go")
            cat > "$dockerfile" << 'EOF'
# Multi-stage build for Go application
FROM golang:1.21-alpine AS builder

# Install ca-certificates and git
RUN apk --no-cache add ca-certificates git

# Set working directory
WORKDIR /build

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags '-extldflags "-static"' -o app .

# Production stage
FROM scratch AS runtime

# Import ca-certificates from builder
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy the binary from builder
COPY --from=builder /build/app /app

# Health check (requires static binary with health endpoint)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["/app", "health"] || exit 1

# Expose port
EXPOSE ${PORT:-8080}

# Run the application
ENTRYPOINT ["/app"]
EOF
            ;;
        "rust")
            cat > "$dockerfile" << 'EOF'
# Multi-stage build for Rust application
FROM rust:1.70 AS builder

# Set working directory
WORKDIR /app

# Copy manifest files
COPY Cargo.toml Cargo.lock ./

# Create src directory with dummy main to cache dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Build dependencies (cached layer)
RUN cargo build --release && rm -rf src

# Copy actual source code
COPY src ./src

# Build application
RUN cargo build --release

# Production stage
FROM debian:bullseye-slim AS runtime

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Security: Create non-root user
RUN useradd --create-home --shell /bin/bash app

# Set working directory
WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/target/release/app /usr/local/bin/app

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

# Switch to non-root user
USER app

# Expose port
EXPOSE ${PORT:-8000}

# Start application
CMD ["app"]
EOF
            ;;
        *)
            cat > "$dockerfile" << 'EOF'
# Generic Dockerfile template
FROM alpine:latest

# Install basic dependencies
RUN apk --no-cache add curl

# Security: Create non-root user
RUN adduser -D -s /bin/sh app

# Set working directory
WORKDIR /app

# Copy application files
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

# Switch to non-root user
USER app

# Expose port
EXPOSE ${PORT:-8080}

# Start application (customize as needed)
CMD ["./start.sh"]
EOF
            ;;
    esac
    
    log_success "Dockerfile created for $PROJECT_TYPE project"
}

# Generate Docker Compose files
generate_docker_compose() {
    print_subsection "Generating Docker Compose Files"
    
    local project_name
    project_name=$(basename "$(pwd)")
    
    # Base docker-compose.yml
    log_info "Creating base docker-compose.yml"
    
    cat > "docker-compose.yml" << EOF
version: '3.8'

services:
  app:
    build: .
    image: $REGISTRY/\${GITHUB_REPOSITORY:-$project_name}:\${TAG:-latest}
    container_name: ${project_name}-app
    environment:
      - NODE_ENV=\${NODE_ENV:-production}
      - PORT=\${PORT:-3000}
    ports:
      - "\${PORT:-3000}:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  app-data:
    driver: local
EOF

    # Test docker-compose.test.yml
    log_info "Creating docker-compose.test.yml"
    
    cat > "docker-compose.test.yml" << EOF
version: '3.8'

services:
  app:
    build: .
    environment:
      - NODE_ENV=test
      - CI=true
    volumes:
      - .:/app
      - /app/node_modules
    command: npm test
    networks:
      - test-network

  test-db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=testdb
      - POSTGRES_USER=testuser
      - POSTGRES_PASSWORD=testpass
    networks:
      - test-network
    tmpfs:
      - /var/lib/postgresql/data

networks:
  test-network:
    driver: bridge
EOF

    # Development docker-compose.dev.yml
    log_info "Creating docker-compose.dev.yml"
    
    cat > "docker-compose.dev.yml" << EOF
version: '3.8'

services:
  app:
    build:
      context: .
      target: builder
    environment:
      - NODE_ENV=development
      - DEBUG=*
    ports:
      - "3000:3000"
      - "9229:9229"  # Node.js debug port
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev
    networks:
      - dev-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=devdb
      - POSTGRES_USER=devuser
      - POSTGRES_PASSWORD=devpass
    ports:
      - "5432:5432"
    volumes:
      - dev-db-data:/var/lib/postgresql/data
    networks:
      - dev-network

networks:
  dev-network:
    driver: bridge

volumes:
  dev-db-data:
    driver: local
EOF

    # Production docker-compose.prod.yml
    log_info "Creating docker-compose.prod.yml"
    
    cat > "docker-compose.prod.yml" << EOF
version: '3.8'

services:
  app:
    image: $REGISTRY/\${GITHUB_REPOSITORY:-$project_name}:\${TAG:-latest}
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
    networks:
      - prod-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl:ro
    depends_on:
      - app
    networks:
      - prod-network

networks:
  prod-network:
    driver: overlay
    attachable: true

volumes:
  prod-data:
    driver: local
EOF

    log_success "Docker Compose files created"
}

# Validate existing CI/CD pipeline
validate_pipeline() {
    print_subsection "Validating CI/CD Pipeline Configuration"
    
    local validation_errors=0
    
    # Check for workflow file
    if [ ! -f ".github/workflows/ci-cd.yml" ]; then
        log_error "Missing GitHub Actions workflow file"
        ((validation_errors++))
    else
        log_success "GitHub Actions workflow file found"
    fi
    
    # Check for Dockerfile
    if [ ! -f "Dockerfile" ]; then
        log_error "Missing Dockerfile"
        ((validation_errors++))
    else
        log_success "Dockerfile found"
        
        # Validate Dockerfile best practices
        if grep -q "FROM.*:latest" Dockerfile; then
            log_warning "Dockerfile uses 'latest' tag - consider pinning versions"
        fi
        
        if ! grep -q "USER " Dockerfile; then
            log_warning "Dockerfile may run as root - security concern"
        fi
        
        if grep -q "HEALTHCHECK" Dockerfile; then
            log_success "Dockerfile includes health check"
        else
            log_warning "Dockerfile missing health check"
        fi
    fi
    
    # Check for Docker Compose files
    if [ ! -f "docker-compose.yml" ]; then
        log_error "Missing docker-compose.yml"
        ((validation_errors++))
    else
        log_success "Docker Compose configuration found"
    fi
    
    # Check for test configuration
    if [ -f "docker-compose.test.yml" ]; then
        log_success "Test configuration found"
    else
        log_warning "Missing test configuration"
    fi
    
    # Validate Docker Compose v2 usage
    if grep -r "docker-compose" .github/ scripts/ Makefile 2>/dev/null | grep -v "docker-compose.yml" | grep -v "docker-compose.yaml"; then
        log_error "Found deprecated 'docker-compose' commands - update to 'docker compose'"
        ((validation_errors++))
    fi
    
    log_info "Validation completed with $validation_errors errors"
    
    if [ "$validation_errors" -eq 0 ]; then
        log_success "CI/CD pipeline validation passed"
        return 0
    else
        log_error "CI/CD pipeline validation failed"
        return 1
    fi
}

# Security audit of CI/CD configuration
audit_cicd_security() {
    print_subsection "CI/CD Security Audit"
    
    local security_issues=0
    
    # Check for hardcoded secrets
    if grep -r -i "password\|secret\|key\|token" .github/ --include="*.yml" --include="*.yaml" | grep -v "\${{"; then
        log_error "Potential hardcoded secrets found in workflow files"
        ((security_issues++))
    fi
    
    # Check for proper secret management
    if [ -f ".github/workflows/ci-cd.yml" ]; then
        if grep -q "secrets\." ".github/workflows/ci-cd.yml"; then
            log_success "Proper secret management detected"
        else
            log_warning "No secret usage detected - ensure sensitive data is handled properly"
        fi
    fi
    
    # Check container security
    if [ -f "Dockerfile" ]; then
        if grep -q "USER.*root\|USER.*0" Dockerfile; then
            log_error "Container runs as root user - security risk"
            ((security_issues++))
        fi
        
        if grep -q "RUN.*apt.*update.*&&.*apt.*install" Dockerfile; then
            if ! grep -q "rm.*-rf.*/var/lib/apt/lists" Dockerfile; then
                log_warning "Package cache not cleaned - image size and security concern"
            fi
        fi
    fi
    
    log_info "Security audit completed with $security_issues critical issues"
    
    if [ "$security_issues" -eq 0 ]; then
        log_success "CI/CD security audit passed"
        return 0
    else
        log_error "CI/CD security audit failed"
        return 1
    fi
}

# Analyze pipeline performance
analyze_pipeline_performance() {
    print_subsection "Pipeline Performance Analysis"
    
    log_info "Analyzing GitHub Actions workflow performance"
    
    # Check for caching opportunities
    if [ -f ".github/workflows/ci-cd.yml" ]; then
        if grep -q "cache:" ".github/workflows/ci-cd.yml"; then
            log_success "Dependency caching configured"
        else
            log_warning "No dependency caching found - consider adding cache configuration"
        fi
        
        if grep -q "cache-from: type=gha" ".github/workflows/ci-cd.yml"; then
            log_success "Docker layer caching configured"
        else
            log_warning "No Docker layer caching found"
        fi
    fi
    
    # Check for parallel job execution
    if [ -f ".github/workflows/ci-cd.yml" ]; then
        local job_count
        job_count=$(grep -c "^[[:space:]]*[a-zA-Z-]*:" ".github/workflows/ci-cd.yml" | head -1)
        log_info "Found $job_count jobs in workflow"
        
        if grep -q "needs:" ".github/workflows/ci-cd.yml"; then
            log_success "Job dependencies configured for optimal parallelization"
        else
            log_warning "No job dependencies found - jobs may run unnecessarily in sequence"
        fi
    fi
    
    log_success "Pipeline performance analysis completed"
}

# Main execution
main() {
    parse_arguments "$@"
    
    show_banner "Tony CI/CD Pipeline Management" "GitHub Actions and Docker automation"
    
    detect_project_type
    
    case "$MODE" in
        "setup-cicd")
            generate_github_workflow
            generate_dockerfile
            generate_docker_compose
            log_success "CI/CD pipeline setup completed"
            ;;
        "validate-pipeline")
            validate_pipeline
            ;;
        "audit-cicd")
            audit_cicd_security
            ;;
        "pipeline-performance")
            analyze_pipeline_performance
            ;;
        "generate-dockerfile")
            generate_dockerfile
            ;;
        "setup-compose")
            generate_docker_compose
            ;;
        *)
            log_error "Unknown command: $MODE"
            show_usage
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"