---
title: "Environment Setup"
order: 02
category: "getting-started"
tags: ["setup", "development", "environment", "docker"]
last_updated: "2025-01-19"
author: "system"
version: "1.0"
status: "published"
---

# Environment Setup

This guide walks you through setting up your local development environment for the MosAIc Stack.

## Docker Environment

### Docker Compose Configuration

The MosAIc Stack uses Docker Compose for local development. Ensure you have the following setup:

```yaml
# docker-compose.dev.yml
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

## Development Workflow

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

### Common Issues

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

## Next Steps

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