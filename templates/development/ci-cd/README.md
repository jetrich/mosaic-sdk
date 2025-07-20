# CI/CD Pipeline Templates

Professional CI/CD pipeline templates for the MosAIc Stack, supporting multiple languages and deployment patterns.

## 🎯 Available Templates

### Base Pipeline Template
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

## 🚀 Usage

### Basic Usage
```bash
# Copy template to your project
cp templates/development/ci-cd/node-pipeline.yml .woodpecker.yml

# Customize variables
vim .woodpecker.yml  # Edit APP_TYPE, TEAM_NAME, etc.
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

## 📚 Documentation

For comprehensive usage instructions, see:
- [Pipeline Templates Documentation](../../../docs/engineering/cicd-handbook/pipeline-setup/03-pipeline-templates.md)