# CI/CD Pipeline Templates

Professional CI/CD pipeline templates for the MosAIc Stack, supporting multiple languages and deployment patterns.

## 🎯 Available Templates

### Base Templates

#### Tony-Proven Node.js Pipeline
**File**: `tony-proven-node-pipeline.yml`  
**Purpose**: Proven production template based on Tony Framework v2.8.0 success patterns
- Independent install step (resolves Woodpecker requirements)
- Parallel quality checks (lint, typecheck, security)
- Comprehensive testing pipeline (unit, integration, coverage)
- ASCII-only characters with graceful error handling
- Cache optimization and artifact management

#### Base Pipeline Template
**File**: `base-pipeline.yml`  
**Purpose**: Foundation template with common functionality
- Security scanning (TruffleHog, license checks)
- Artifact collection and management
- Notification system
- Service definitions (PostgreSQL, Redis, MongoDB)

### Language-Specific Templates

#### Node.js/TypeScript Template  
**File**: `node-pipeline.yml`
- npm/yarn dependency management
- ESLint and TypeScript checking
- Jest testing with coverage
- Bundle size analysis

#### Advanced TypeScript Template
**File**: `typescript-pipeline.yml`
- Strict TypeScript configuration validation
- Declaration file generation and testing
- Module resolution verification (ESM/CommonJS)
- Type definition testing and documentation
- Package export validation

#### Python Template
**File**: `python-pipeline.yml`  
- pip/poetry/pipenv support
- Black formatting and isort
- pytest with coverage
- Bandit security scanning

#### Go Template
**File**: `go-pipeline.yml`
- Go modules management
- gofmt and go vet
- golangci-lint
- Race detection testing

### Project-Type Specific Templates

#### Database Project Template
**File**: `database-pipeline.yml`
- Database migration testing (up/down/reset)
- Schema validation and integrity checks
- Transaction and constraint testing
- Performance and load testing for database operations
- Backup and recovery procedure validation
- Multi-database service support (PostgreSQL, MySQL, Redis)

#### MCP Server Template
**File**: `mcp-server-pipeline.yml`
- Model Context Protocol compliance validation
- Server lifecycle management testing
- Communication protocol verification
- Performance and load testing for MCP servers
- Security and authentication testing
- Multi-client connection testing
- Message exchange validation

## 🚀 Usage

### Template Selection Guide

#### For New Projects (Recommended)
```bash
# Use Tony-proven template for Node.js projects
cp templates/development/ci-cd/tony-proven-node-pipeline.yml .woodpecker.yml
```

#### For Specific Project Types
```bash
# TypeScript projects with strict type checking
cp templates/development/ci-cd/typescript-pipeline.yml .woodpecker.yml

# Database-heavy projects (migrations, schema validation)
cp templates/development/ci-cd/database-pipeline.yml .woodpecker.yml

# MCP servers (protocol compliance, communication testing)
cp templates/development/ci-cd/mcp-server-pipeline.yml .woodpecker.yml
```

### Basic Usage
```bash
# Copy template to your project
cp templates/development/ci-cd/tony-proven-node-pipeline.yml .woodpecker.yml

# Customize for your project (optional - templates work out of the box)
vim .woodpecker.yml  # Adjust npm script names if needed
```

### Template Inheritance
```yaml
# Extend base template
include:
  - templates/development/ci-cd/base-pipeline.yml

# Add custom steps
steps:
  custom-deploy:
    image: alpine:latest
    commands:
      - ./deploy.sh
```

### Which Template Should I Use?

| Project Type | Template | Best For |
|-------------|----------|----------|
| **Standard Node.js/TypeScript** | `tony-proven-node-pipeline.yml` | Most projects - proven patterns |
| **Advanced TypeScript** | `typescript-pipeline.yml` | Libraries, strict typing, declaration files |
| **Database Projects** | `database-pipeline.yml` | Migration testing, schema validation |
| **MCP Servers** | `mcp-server-pipeline.yml` | Protocol compliance, server testing |
| **Legacy/Custom** | `node-pipeline.yml` | Existing projects with custom setups |

### Template Features Comparison

| Feature | Tony-Proven | TypeScript | Database | MCP Server |
|---------|------------|------------|----------|------------|
| **Woodpecker Compatible** | ✓ | ✓ | ✓ | ✓ |
| **ASCII-Only** | ✓ | ✓ | ✓ | ✓ |
| **Graceful Error Handling** | ✓ | ✓ | ✓ | ✓ |
| **Parallel Execution** | ✓ | ✓ | ✓ | ✓ |
| **Declaration Generation** | Basic | ✓ | - | - |
| **Database Testing** | - | - | ✓ | ✓ |
| **Protocol Compliance** | - | - | - | ✓ |
| **Migration Testing** | - | - | ✓ | ✓ |
| **Performance Testing** | Basic | ✓ | ✓ | ✓ |

## 📚 Documentation

For comprehensive usage instructions, see:
- [CI/CD Standards](../../../docs/sdk/development/CI-CD-STANDARDS.md)
- [Tony Framework Implementation](../../../tony/docs/CI-CD-IMPLEMENTATION.md)