# MosAIc Stack API Reference

## Overview

This document provides a comprehensive reference for all APIs available in the MosAIc Stack. Each service exposes its own API for integration and automation.

## API Index

1. [Gitea API](#gitea-api) - Git repository management
2. [BookStack API](#bookstack-api) - Documentation platform
3. [Woodpecker API](#woodpecker-api) - CI/CD automation
4. [MosAIc MCP API](#mosaic-mcp-api) - Model Context Protocol
5. [Tony Framework API](#tony-framework-api) - AI orchestration
6. [Portainer API](#portainer-api) - Container management

## Authentication Methods

### API Token Authentication
Most services use Bearer token authentication:
```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
  https://api.example.com/endpoint
```

### OAuth2 Authentication
Services supporting OAuth2:
```bash
# Authorization URL
https://service.example.com/oauth/authorize?client_id=CLIENT_ID&redirect_uri=REDIRECT_URI

# Token exchange
curl -X POST https://service.example.com/oauth/token \
  -d "grant_type=authorization_code&code=AUTH_CODE&client_id=CLIENT_ID&client_secret=CLIENT_SECRET"
```

---

## Gitea API

**Base URL**: `https://git.example.com/api/v1`  
**Authentication**: Token or OAuth2  
**Documentation**: [Swagger UI](https://git.example.com/api/swagger)

### Core Endpoints

#### Repositories

```bash
# List repositories
GET /user/repos
GET /orgs/{org}/repos
GET /repos/{owner}/{repo}

# Create repository
POST /user/repos
{
  "name": "repo-name",
  "description": "Repository description",
  "private": false,
  "auto_init": true
}

# Update repository
PATCH /repos/{owner}/{repo}
{
  "description": "Updated description",
  "default_branch": "main"
}

# Delete repository
DELETE /repos/{owner}/{repo}
```

#### Issues

```bash
# List issues
GET /repos/{owner}/{repo}/issues
GET /repos/{owner}/{repo}/issues/{index}

# Create issue
POST /repos/{owner}/{repo}/issues
{
  "title": "Issue title",
  "body": "Issue description",
  "assignees": ["username"],
  "labels": [1, 2],
  "milestone": 1
}

# Update issue
PATCH /repos/{owner}/{repo}/issues/{index}
{
  "state": "closed",
  "body": "Updated description"
}
```

#### Pull Requests

```bash
# List pull requests
GET /repos/{owner}/{repo}/pulls
GET /repos/{owner}/{repo}/pulls/{index}

# Create pull request
POST /repos/{owner}/{repo}/pulls
{
  "title": "PR title",
  "head": "feature-branch",
  "base": "main",
  "body": "PR description"
}

# Merge pull request
POST /repos/{owner}/{repo}/pulls/{index}/merge
{
  "merge_method": "squash",
  "delete_branch_after_merge": true
}
```

#### Webhooks

```bash
# List webhooks
GET /repos/{owner}/{repo}/hooks

# Create webhook
POST /repos/{owner}/{repo}/hooks
{
  "type": "gitea",
  "config": {
    "url": "https://ci.example.com/hook",
    "content_type": "json",
    "secret": "webhook_secret"
  },
  "events": ["push", "pull_request"],
  "active": true
}
```

### Advanced Features

#### Repository Migration

```bash
POST /repos/migrate
{
  "clone_addr": "https://github.com/owner/repo",
  "repo_name": "migrated-repo",
  "repo_owner": "my-org",
  "mirror": false,
  "private": false,
  "description": "Migrated from GitHub"
}
```

#### Organization Management

```bash
# Create organization
POST /orgs
{
  "username": "my-org",
  "full_name": "My Organization",
  "description": "Organization description"
}

# Add team member
PUT /teams/{id}/members/{username}
```

---

## BookStack API

**Base URL**: `https://docs.example.com/api`  
**Authentication**: Token ID + Token Secret  
**Documentation**: [API Docs](https://docs.example.com/api/docs)

### Authentication Header
```bash
Authorization: Token {id}:{secret}
```

### Core Endpoints

#### Books

```bash
# List books
GET /books

# Create book
POST /books
{
  "name": "My Book",
  "description": "Book description",
  "tags": [{"name": "Category", "value": "Technical"}]
}

# Update book
PUT /books/{id}
{
  "name": "Updated Book Name",
  "description": "Updated description"
}

# Delete book
DELETE /books/{id}
```

#### Pages

```bash
# List pages
GET /pages

# Create page
POST /pages
{
  "book_id": 1,
  "chapter_id": 2,
  "name": "Page Title",
  "html": "<h1>Content</h1><p>Page content</p>",
  "tags": [{"name": "Type", "value": "Guide"}]
}

# Update page
PUT /pages/{id}
{
  "name": "Updated Title",
  "html": "<h1>Updated Content</h1>",
  "markdown": "# Updated Content"
}

# Export page
GET /pages/{id}/export/pdf
GET /pages/{id}/export/html
GET /pages/{id}/export/markdown
```

#### Search

```bash
# Search all content
GET /search?query=keyword&type=page&filters[book_id]=1

# Search options
- query: Search term
- type: all|page|book|chapter|shelf
- filters[{property}]: Filter results
```

#### Attachments

```bash
# Upload attachment
POST /attachments
Content-Type: multipart/form-data

name=file.pdf
uploaded_to=page_{id}
file=@/path/to/file.pdf

# List attachments
GET /attachments?filter[uploaded_to]=page_123
```

---

## Woodpecker API

**Base URL**: `https://ci.example.com/api`  
**Authentication**: Bearer token  
**Documentation**: [API Reference](https://woodpecker-ci.org/docs/next/api)

### Core Endpoints

#### Repositories

```bash
# List repositories
GET /user/repos

# Enable repository
POST /repos/{owner}/{name}

# Get repository
GET /repos/{owner}/{name}

# Update repository settings
PATCH /repos/{owner}/{name}
{
  "allow_pr": true,
  "protected": false,
  "trusted": true
}
```

#### Builds

```bash
# List builds
GET /repos/{owner}/{name}/builds

# Get build
GET /repos/{owner}/{name}/builds/{number}

# Restart build
POST /repos/{owner}/{name}/builds/{number}

# Cancel build
DELETE /repos/{owner}/{name}/builds/{number}

# Get build logs
GET /repos/{owner}/{name}/logs/{number}/{job}
```

#### Secrets

```bash
# List secrets
GET /repos/{owner}/{name}/secrets

# Create secret
POST /repos/{owner}/{name}/secrets
{
  "name": "SECRET_NAME",
  "value": "secret_value",
  "event": ["push", "tag", "pull_request"]
}

# Update secret
PATCH /repos/{owner}/{name}/secrets/{name}
{
  "value": "new_value"
}
```

#### Agents

```bash
# List agents
GET /agents

# Get agent
GET /agents/{id}

# Agent tasks
GET /agents/{id}/tasks
```

### Webhook Events

```json
// Push event
{
  "event": "push",
  "repo": {
    "owner": "owner",
    "name": "repo"
  },
  "build": {
    "number": 123,
    "status": "success",
    "commit": "abc123"
  }
}
```

---

## MosAIc MCP API

**Base URL**: `http://localhost:3456`  
**Authentication**: Agent tokens  
**Protocol**: JSON-RPC 2.0

### Core Methods

#### Agent Management

```json
// Register agent
{
  "jsonrpc": "2.0",
  "method": "agent.register",
  "params": {
    "name": "implementation-agent",
    "capabilities": ["code", "test", "deploy"]
  },
  "id": 1
}

// List agents
{
  "jsonrpc": "2.0",
  "method": "agent.list",
  "params": {},
  "id": 2
}

// Send message
{
  "jsonrpc": "2.0",
  "method": "agent.message",
  "params": {
    "to": "agent-id",
    "content": "Task assignment",
    "metadata": {}
  },
  "id": 3
}
```

#### Tool Invocation

```json
// List tools
{
  "jsonrpc": "2.0",
  "method": "tools.list",
  "params": {},
  "id": 4
}

// Invoke tool
{
  "jsonrpc": "2.0",
  "method": "tools.invoke",
  "params": {
    "tool": "tony_project_create",
    "arguments": {
      "name": "my-project",
      "description": "Project description"
    }
  },
  "id": 5
}
```

#### Session Management

```json
// Create session
{
  "jsonrpc": "2.0",
  "method": "session.create",
  "params": {
    "project": "my-project",
    "metadata": {}
  },
  "id": 6
}

// Get session state
{
  "jsonrpc": "2.0",
  "method": "session.getState",
  "params": {
    "sessionId": "session-123"
  },
  "id": 7
}
```

### REST Endpoints

```bash
# Health check
GET /health

# Metrics
GET /metrics

# OpenAPI spec
GET /openapi.json
```

---

## Tony Framework API

**Base URL**: Embedded library  
**Authentication**: Project-based  
**Protocol**: TypeScript/JavaScript API

### Core Classes

#### TonyCore

```typescript
import { TonyCore } from '@tony/core';

// Initialize Tony
const tony = new TonyCore({
  projectPath: '/path/to/project',
  config: {
    mcp: {
      enabled: true,
      endpoint: 'http://localhost:3456'
    }
  }
});

// Start planning session
const plan = await tony.planning.createPlan({
  description: 'Build a web application',
  methodology: 'UPP'
});

// Deploy agents
const agents = await tony.agents.deploy([
  { type: 'implementation', name: 'impl-1' },
  { type: 'qa', name: 'qa-1' }
]);

// Execute plan
await tony.execution.run(plan, agents);
```

#### Agent Coordination

```typescript
// Create coordinator
const coordinator = tony.createCoordinator();

// Register agent
await coordinator.registerAgent({
  id: 'agent-1',
  capabilities: ['typescript', 'react'],
  status: 'ready'
});

// Assign task
await coordinator.assignTask({
  agentId: 'agent-1',
  task: {
    type: 'implement',
    description: 'Create login component',
    requirements: []
  }
});

// Monitor progress
coordinator.on('task:progress', (event) => {
  console.log(`Task ${event.taskId}: ${event.progress}%`);
});
```

#### State Management

```typescript
// Get project state
const state = await tony.state.getProjectState();

// Update state
await tony.state.updateState({
  phase: 'implementation',
  progress: 45,
  activeAgents: ['impl-1', 'qa-1']
});

// Subscribe to changes
tony.state.subscribe((newState) => {
  console.log('State updated:', newState);
});
```

---

## Portainer API

**Base URL**: `https://admin.example.com/api`  
**Authentication**: JWT token  
**Documentation**: [Portainer API](https://docs.portainer.io/api/intro)

### Authentication

```bash
# Get JWT token
POST /auth
{
  "username": "admin",
  "password": "password"
}

# Response
{
  "jwt": "eyJ..."
}

# Use token
curl -H "Authorization: Bearer eyJ..." https://admin.example.com/api/endpoints
```

### Core Endpoints

#### Endpoints (Docker Environments)

```bash
# List endpoints
GET /endpoints

# Get endpoint
GET /endpoints/{id}

# Create endpoint
POST /endpoints
{
  "Name": "local",
  "EndpointCreationType": 1,
  "URL": "unix:///var/run/docker.sock"
}
```

#### Containers

```bash
# List containers
GET /endpoints/{id}/docker/containers/json

# Create container
POST /endpoints/{id}/docker/containers/create
{
  "Image": "nginx:latest",
  "Name": "my-nginx",
  "ExposedPorts": {
    "80/tcp": {}
  }
}

# Start container
POST /endpoints/{id}/docker/containers/{containerId}/start

# Stop container
POST /endpoints/{id}/docker/containers/{containerId}/stop
```

#### Stacks

```bash
# List stacks
GET /stacks

# Create stack
POST /stacks
{
  "Name": "my-stack",
  "SwarmID": "",
  "StackFileContent": "version: '3'\nservices:\n  web:\n    image: nginx"
}

# Update stack
PUT /stacks/{id}
{
  "StackFileContent": "updated content",
  "Prune": true
}
```

---

## Common Patterns

### Pagination

Most APIs support pagination:
```bash
GET /api/resource?page=1&per_page=50
GET /api/resource?limit=50&offset=100
```

### Filtering

Common filter patterns:
```bash
GET /api/resource?filter[status]=active
GET /api/resource?q=search_term
GET /api/resource?created_after=2024-01-01
```

### Rate Limiting

Check headers for rate limit info:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200
```

### Error Responses

Standard error format:
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource was not found",
    "details": {
      "resource": "repository",
      "id": "123"
    }
  }
}
```

## SDK Examples

### JavaScript/TypeScript

```typescript
// Gitea client
import { GiteaClient } from '@mosaic/gitea-sdk';

const gitea = new GiteaClient({
  baseUrl: 'https://git.example.com',
  token: process.env.GITEA_TOKEN
});

const repos = await gitea.repos.list();

// BookStack client
import { BookStackClient } from '@mosaic/bookstack-sdk';

const bookstack = new BookStackClient({
  baseUrl: 'https://docs.example.com',
  tokenId: process.env.BOOKSTACK_TOKEN_ID,
  tokenSecret: process.env.BOOKSTACK_TOKEN_SECRET
});

const books = await bookstack.books.list();
```

### Python

```python
# Woodpecker client
from mosaic_sdk import WoodpeckerClient

woodpecker = WoodpeckerClient(
    base_url="https://ci.example.com",
    token=os.environ["WOODPECKER_TOKEN"]
)

builds = woodpecker.repos.get_builds("owner", "repo")

# MCP client
from mosaic_sdk import MCPClient

mcp = MCPClient("http://localhost:3456")
agents = mcp.agents.list()
```

### CLI Tools

```bash
# Gitea CLI
gitea repo create --name my-repo --private

# Tony CLI
tony agent deploy --type implementation --name impl-1

# MCP CLI
mcp tool invoke tony_project_list
```

---

*Last Updated: January 2025 | MosAIc API Reference v1.0.0*