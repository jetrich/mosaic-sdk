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

# Install dependencies
npm install

# Run tests
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

# Install dependencies
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