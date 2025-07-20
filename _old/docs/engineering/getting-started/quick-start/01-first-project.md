---
title: "01 First Project"
order: 01
category: "quick-start"
tags: ["quick-start", "getting-started", "documentation"]
last_updated: "2025-01-19"
author: "migration"
version: "1.0"
status: "published"
---
# MosAIc Stack Developer Quick Start

## Overview

This guide helps developers quickly get started with the MosAIc Stack for local development and contributing to MosAIc projects.

## Prerequisites

### Required Software
- **Docker Desktop** or Docker Engine 24.0+
- **Docker Compose** v2.20+
- **Git** 2.34+
- **Node.js** 18+ (for MosAIc SDK development)
- **Python** 3.10+ (for Tony Framework)
- **VS Code** or preferred IDE

### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "ms-azuretools.vscode-docker",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "redhat.vscode-yaml",
    "yzhang.markdown-all-in-one",
    "gruntfuggly.todo-tree"
  ]
}
```

## Quick Start (15 minutes)

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/jetrich/mosaic-sdk.git
cd mosaic-sdk

# Initialize submodules
git submodule update --init --recursive

# Copy environment template
cp .env.example .env

# Generate secure passwords
./scripts/generate-passwords.sh >> .env
```

### 2. Configure Development Environment

```bash
# Edit .env file with your settings
nano .env

# Key settings to update:
# DOMAIN_NAME=localhost
# ADMIN_EMAIL=dev@localhost
# DEVELOPMENT_MODE=true
```

### 3. Start Core Services

```bash
# Start databases first
docker compose -f docker-compose.dev.yml up -d postgres mariadb redis

# Wait for initialization
sleep 30

# Start remaining services
docker compose -f docker-compose.dev.yml up -d
```

### 4. Verify Installation

```bash
# Check all services are running
docker compose -f docker-compose.dev.yml ps

# Access services:
# - Gitea: http://localhost:3000
# - BookStack: http://localhost:6875
# - Woodpecker: http://localhost:8000
# - Portainer: http://localhost:9000
# - MCP: http://localhost:3456/health
```

## Development Workflow

### Working with Git Submodules

```bash
# Update all submodules
git submodule update --remote --merge

# Work on a specific submodule
cd mosaic-mcp
git checkout -b feature/my-feature
# Make changes
git add .
git commit -m "feat: Add new feature"
git push origin feature/my-feature

# Update parent repository
cd ..
git add mosaic-mcp
git commit -m "update: mosaic-mcp submodule"
```

### Local Development Setup

#### 1. MosAIc MCP Development

```bash
# Navigate to MCP directory
cd mosaic-mcp

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

#### 2. Tony Framework Development

```bash
# Navigate to Tony directory
cd tony

npm install

npm test

# Build
npm run build

# Test MCP integration
npm run test:mcp
```

#### 3. Frontend Development (MosAIc Platform)

```bash
# Navigate to platform directory
cd mosaic

cd frontend && npm install
cd ../backend && npm install

# Run development servers
npm run dev:frontend  # Terminal 1
npm run dev:backend   # Terminal 2
```

### Docker Development Environment

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  # Development overrides
  gitea:
    environment:
      - GITEA__log__LEVEL=debug
    volumes:
      - ./dev-repos:/data/git/repositories
  
  mcp:
    build:
      context: ./mosaic-mcp
      target: development
    volumes:
      - ./mosaic-mcp:/app
      - /app/node_modules
    command: npm run dev
  
  # Add development tools
  adminer:
    image: adminer
    ports:
      - "8080:8080"
    networks:
      - mosaic_internal
```

## Development Guidelines

### Code Style

#### TypeScript/JavaScript
```typescript
// Use TypeScript for all new code
// Enable strict mode
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}

// Follow ESLint rules
// Format with Prettier
```

#### Python (Tony Framework)
```python
# Follow PEP 8
# Use type hints
from typing import List, Dict, Optional

def process_task(task_id: str, options: Optional[Dict] = None) -> bool:
    """Process a task with given options."""
    pass

# Use Black for formatting
# black --line-length 100 .
```

### Git Workflow

```bash
# 1. Create feature branch
git checkout -b feature/EPIC-XXX-description

# 2. Make atomic commits
git add -p  # Stage selectively
git commit -m "feat(component): Add specific feature

- Detailed description
- Related to EPIC-XXX"

# 3. Keep branch updated
git fetch origin
git rebase origin/main

# 4. Create pull request
gh pr create --title "feat: Add feature X" --body "
## Summary
- Added feature X
- Updated documentation

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing complete

## Related Issues
Closes #123
"
```

### Testing

#### Unit Tests
```typescript
// Example Jest test
describe('MCPClient', () => {
  it('should connect to MCP server', async () => {
    const client = new MCPClient({ port: 3456 });
    await expect(client.connect()).resolves.toBe(true);
  });
  
  it('should handle connection errors', async () => {
    const client = new MCPClient({ port: 9999 });
    await expect(client.connect()).rejects.toThrow('Connection refused');
  });
});
```

#### Integration Tests
```bash
# Run integration test suite
npm run test:integration

# Test specific service integration
npm run test:integration -- --service=gitea

# Run E2E tests
npm run test:e2e
```

#### Manual Testing Checklist
- [ ] Feature works as expected
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Mobile responsive (if applicable)
- [ ] Accessibility standards met
- [ ] Documentation updated

### Debugging

#### Container Debugging
```bash
# Attach to running container
docker exec -it mosaic-mcp-1 /bin/bash

# View real-time logs
docker logs -f mosaic-mcp-1

# Debug Node.js application
docker exec -it mosaic-mcp-1 node --inspect=0.0.0.0:9229 dist/main.js
# Then connect Chrome DevTools to chrome://inspect
```

#### Database Debugging
```bash
# Connect to PostgreSQL
docker exec -it mosaic-postgres-1 psql -U postgres

# Connect to MariaDB
docker exec -it mosaic-mariadb-1 mysql -uroot -p

# Use Adminer GUI
# Open http://localhost:8080
# Server: postgres or mariadb
# Username/Password: from .env
```

#### Network Debugging
```bash
# Test container connectivity
docker exec mosaic-gitea-1 ping mariadb

# Inspect network
docker network inspect mosaic_net

# Monitor network traffic
docker exec mosaic-npm-1 tcpdump -i eth0
```

## API Development

### Creating New API Endpoints

#### 1. MosAIc MCP Tool
```typescript
// mosaic-mcp/src/tools/my-tool.ts
import { Tool } from '../types';

export const myTool: Tool = {
  name: 'my_tool',
  description: 'Does something useful',
  inputSchema: {
    type: 'object',
    properties: {
      param1: { type: 'string' },
      param2: { type: 'number' }
    },
    required: ['param1']
  },
  handler: async (input) => {
    // Implementation
    return { success: true, result: 'Done' };
  }
};

// Register in index.ts
export { myTool } from './my-tool';
```

#### 2. REST API Endpoint
```typescript
// mosaic/backend/src/controllers/my-controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';

@Controller('api/my-resource')
export class MyController {
  @Get()
  async list() {
    return { items: [] };
  }
  
  @Post()
  async create(@Body() dto: CreateDto) {
    // Implementation
    return { id: 1, ...dto };
  }
}
```

### API Documentation

Use OpenAPI/Swagger annotations:
```typescript
@ApiTags('resources')
@Controller('api/resources')
export class ResourceController {
  @ApiOperation({ summary: 'List all resources' })
  @ApiResponse({ status: 200, description: 'Success' })
  @Get()
  async list() {
    // Implementation
  }
}
```

## Contributing

### Before Submitting PR

1. **Run all tests**:
   ```bash
   npm test
   npm run lint
   npm run build
   ```

2. **Update documentation**:
   - API changes → Update API docs
   - New features → Update user guide
   - Configuration → Update deployment guide

3. **Follow commit conventions**:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation
   - `style:` Code style
   - `refactor:` Refactoring
   - `test:` Tests
   - `chore:` Maintenance

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests cover new functionality
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance impact considered
- [ ] Backward compatibility maintained

## Local Development Tips

### 1. Speed Up Development

```bash
# Use volume mounts for hot reload
docker compose -f docker-compose.dev.yml up

# Skip building images
docker compose up --no-build

# Only restart changed service
docker compose restart mcp
```

### 2. Mock External Services

```javascript
// Use MSW for API mocking
import { setupServer } from 'msw/node';
import { rest } from 'msw';

const server = setupServer(
  rest.get('/api/external', (req, res, ctx) => {
    return res(ctx.json({ mocked: true }));
  })
);
```

### 3. Development Shortcuts

```bash
# Alias for common commands
alias dc='docker compose'
alias dcl='docker compose logs -f'
alias dce='docker compose exec'

# Quick database access
alias psql-dev='docker exec -it mosaic-postgres-1 psql -U postgres'
alias mysql-dev='docker exec -it mosaic-mariadb-1 mysql -uroot -p'
```

## Troubleshooting Development Issues

### Common Issues

1. **Port already in use**:
   ```bash
   # Find process using port
   lsof -i :3000
   # Kill process
   kill -9 <PID>
   ```

2. **Permission errors**:
   ```bash
   # Fix volume permissions
   sudo chown -R $USER:$USER ./data
   ```

3. **Slow performance on Mac/Windows**:
   ```yaml
   # Use delegated consistency
   volumes:
     - ./src:/app/src:delegated
   ```

### Development Resources

- **Documentation**: `docs/` directory
- **Examples**: `examples/` in each submodule
- **Tests**: `tests/` or `__tests__/` directories
- **Scripts**: `scripts/` for automation

## Next Steps

1. **Explore the architecture**: Read [Architecture Overview](../architecture/overview.md)
2. **Set up your IDE**: Configure debugging and linting
3. **Join the community**: Discord/Slack for questions
4. **Pick an issue**: Look for "good first issue" labels
5. **Start contributing**: Make your first PR!

## Useful Commands Reference

```bash
# Development
npm run dev           # Start development server
npm run build         # Build for production
npm test             # Run tests
npm run lint         # Lint code
npm run format       # Format code

# Docker
docker compose up -d  # Start services
docker compose down   # Stop services
docker compose logs   # View logs
docker compose ps     # List services

# Git
git submodule update --remote  # Update submodules
git status --short            # Quick status
git log --oneline -10         # Recent commits
```

---

*Last Updated: January 2025 | MosAIc Developer Quick Start v1.0.0*

---

---

## Additional Content (Migrated)

# Environment Setup

This guide walks you through setting up your local development environment for the MosAIc Stack.

## Docker Environment

### Docker Compose Configuration

The MosAIc Stack uses Docker Compose for local development. Ensure you have the following setup:

```yaml
version: '3.8'

networks:
  mosaic-dev:
    driver: bridge

services:
  # Services will be added here
```

### Environment Variables

Create a `.env` file in your project root:

```bash
# Copy the template
cp .env.example .env

# Edit with your values
nano .env
```

Required environment variables:

```bash
# Domain Configuration
DOMAIN=localhost
GITEA_DOMAIN=git.localhost
BOOKSTACK_DOMAIN=docs.localhost
WOODPECKER_DOMAIN=ci.localhost

# Database Passwords
POSTGRES_PASSWORD=changeme
MARIADB_ROOT_PASSWORD=changeme
MARIADB_PASSWORD=changeme

# Service Tokens
GITEA_SECRET_KEY=changeme
BOOKSTACK_APP_KEY=changeme
WOODPECKER_AGENT_SECRET=changeme

# Development Settings
DEBUG=true
LOG_LEVEL=debug
```

## Git Configuration

### SSH Setup for Gitea

Configure SSH for your local Gitea instance:

```bash
# Add to ~/.ssh/config
Host localhost
    HostName localhost
    Port 2222
    User git
    IdentityFile ~/.ssh/id_ed25519_dev
    StrictHostKeyChecking no
```

### Git Global Settings

```bash
# Set your identity
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Useful aliases
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
```

## IDE Configuration

### VS Code

Recommended extensions:
- Docker
- Remote - Containers
- GitLens
- ESLint
- Prettier
- TypeScript

Settings (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.updateImportsOnFileMove.enabled": "always"
}
```

### IntelliJ IDEA

1. Install Docker plugin
2. Configure Node.js interpreter
3. Set up TypeScript compiler
4. Enable ESLint integration

## Language-Specific Setup

### Node.js/TypeScript

```bash
# Install Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js LTS
nvm install --lts
nvm use --lts

# Install global packages
npm install -g typescript ts-node nodemon jest
```

### Python

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# Install development dependencies
pip install -r requirements-dev.txt
```

### Go

```bash
# Set Go workspace
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin

# Install development tools
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
go install golang.org/x/tools/gopls@latest
```

## Local Services Setup

### Start Core Services

```bash
# Start databases and cache
docker compose up -d postgres mariadb redis

# Verify services are running
docker compose ps

# Check logs
docker compose logs -f
```

### Initialize Databases

```bash
# PostgreSQL setup
docker exec -it mosaic-postgres psql -U postgres -c "CREATE DATABASE gitea;"
docker exec -it mosaic-postgres psql -U postgres -c "CREATE DATABASE plane;"

# MariaDB setup
docker exec -it mosaic-mariadb mysql -uroot -p -e "CREATE DATABASE bookstack;"
docker exec -it mosaic-mariadb mysql -uroot -p -e "GRANT ALL ON bookstack.* TO 'bookstack'@'%';"
```

### 1. Clone Repository

```bash
# Clone with submodules
git clone --recurse-submodules git@git.mosaicstack.dev:mosaic/mosaic-sdk.git
cd mosaic-sdk

# If already cloned
git submodule update --init --recursive
```

### 2. Install Dependencies

```bash
# Install all dependencies
npm run install:all

# Build all packages
npm run build:all
```

### 3. Start Development Server

```bash
# Start MCP server
npm run dev:start

# In another terminal, start watch mode
npm run dev:watch

# View logs
npm run dev:logs
```

### 4. Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test suite
npm run test:mosaic
```

## Troubleshooting

#### Port Conflicts
```bash
# Check what's using a port
lsof -i :3000
netstat -tulpn | grep 3000

# Kill process using port
kill -9 $(lsof -t -i:3000)
```

#### Docker Issues
```bash
# Reset Docker environment
docker compose down -v
docker system prune -a
docker compose up -d
```

#### Permission Issues
```bash
# Fix Docker socket permissions
sudo usermod -aG docker $USER
newgrp docker

# Fix file permissions
sudo chown -R $USER:$USER .
```

### Debug Mode

Enable debug logging:
```bash
# In .env
DEBUG=true
LOG_LEVEL=debug

# For Node.js
DEBUG=* npm start

# For Docker Compose
COMPOSE_HTTP_TIMEOUT=200 docker compose up
```

With your environment set up:
1. Review the [Project Structure](./03-project-structure.md)
2. Learn about [Development Guidelines](../best-practices/01-coding-standards.md)
3. Set up [Git Workflows](../../git-guide/workflows/01-branching-strategy.md)
4. Configure [CI/CD Pipelines](../../ci-cd/setup/01-woodpecker-setup.md)

---

For platform-specific setup instructions, see:
- [Windows Setup](../platform-specific/01-windows-setup.md)
- [macOS Setup](../platform-specific/02-macos-setup.md)
- [Linux Setup](../platform-specific/03-linux-setup.md)

---

---

# Prerequisites

Before you begin developing with the MosAIc Stack, ensure you have the following prerequisites installed and configured.

## System Requirements

### Hardware
- **CPU**: 4+ cores recommended
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 50GB+ available disk space
- **Network**: Stable internet connection

### Operating System
- **Linux**: Ubuntu 20.04+, Debian 11+, RHEL 8+
- **macOS**: 11.0+ (Big Sur or later)
- **Windows**: Windows 10+ with WSL2

## Required Software

### Docker
- **Version**: 24.0.0 or higher
- **Docker Compose**: v2.20.0 or higher

Installation:
```bash
# Linux
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# macOS
brew install --cask docker

# Verify installation
docker --version
docker compose version
```

### Git
- **Version**: 2.25.0 or higher

```bash
sudo apt-get install git  # Debian/Ubuntu
sudo yum install git      # RHEL/CentOS

brew install git

# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Development Tools

#### Node.js (for TypeScript/JavaScript development)
- **Version**: 18.0.0+ LTS recommended

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
nvm use --lts
```

#### Python (for Python development)
- **Version**: 3.9+ recommended

```bash
sudo apt-get install python3 python3-pip python3-venv

brew install python@3.11
```

#### Go (for Go development)
- **Version**: 1.20+ recommended

```bash
# Download from https://go.dev/dl/
# Or use package manager
brew install go  # macOS
```

### Additional Tools

#### jq (JSON processor)
```bash
sudo apt-get install jq

brew install jq
```

#### OpenSSL
```bash
# Usually pre-installed, verify with:
openssl version
```

#### curl
```bash
curl --version
```

## Account Setup

### GitHub Account
- Create account at [github.com](https://github.com)
- Set up SSH keys for Git operations

### Gitea Account
- Will be created during MosAIc Stack setup
- SSH keys will be configured

## Network Requirements

### Ports
Ensure the following ports are available:
- `3000`: Gitea web interface
- `2222`: Gitea SSH
- `6875`: BookStack
- `8080`: Woodpecker CI/CD
- `5432`: PostgreSQL (internal)
- `6379`: Redis (internal)
- `3306`: MariaDB (internal)

### Firewall
Configure firewall to allow Docker networking:
```bash
# UFW (Ubuntu)
sudo ufw allow 3000/tcp
sudo ufw allow 2222/tcp
sudo ufw allow 6875/tcp
sudo ufw allow 8080/tcp
```

## Verification

Run this script to verify all prerequisites:

```bash
#!/bin/bash
echo "Checking prerequisites..."

# Check Docker
if command -v docker &> /dev/null; then
    echo "✓ Docker: $(docker --version)"
else
    echo "✗ Docker not found"
fi

# Check Docker Compose
if docker compose version &> /dev/null; then
    echo "✓ Docker Compose: $(docker compose version)"
else
    echo "✗ Docker Compose v2 not found"
fi

# Check Git
if command -v git &> /dev/null; then
    echo "✓ Git: $(git --version)"
else
    echo "✗ Git not found"
fi

# Check disk space
AVAILABLE=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$AVAILABLE" -gt 50 ]; then
    echo "✓ Disk space: ${AVAILABLE}GB available"
else
    echo "✗ Disk space: Only ${AVAILABLE}GB available (50GB+ recommended)"
fi

# Check memory
MEMORY=$(free -g | awk '/^Mem:/{print $2}')
if [ "$MEMORY" -ge 8 ]; then
    echo "✓ Memory: ${MEMORY}GB RAM"
else
    echo "⚠ Memory: ${MEMORY}GB RAM (8GB+ recommended)"
fi
```

Once all prerequisites are met:
1. Clone the MosAIc SDK repository
2. Run the interactive setup script
3. Configure your development environment
4. Start developing!

---

For detailed setup instructions, see [Environment Setup](./02-environment-setup.md).
