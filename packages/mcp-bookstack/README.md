# @mosaicstack/mcp-bookstack

BookStack integration for MosAIc SDK implementing the **Project = Shelf** mapping strategy for automated documentation synchronization.

## Features

### 🚀 Core Sync Engine

- **Project = Shelf Mapping**: Each top-level directory in `docs/` becomes a BookStack shelf
- **Automatic Structure Discovery**: Recursively scans documentation structure
- **Two-way Synchronization**: Supports both Git → BookStack and BookStack → Git sync
- **Conflict Resolution**: Intelligent conflict detection with configurable resolution strategies
- **Metadata Preservation**: Tracks sync state with `.bookstack/` metadata files

### 📊 Monitoring & Alerting

- **Real-time Monitoring**: Health checks, performance metrics, and sync statistics
- **Alert System**: Configurable alerts for failures, conflicts, and performance issues
- **Dashboard Data**: Comprehensive metrics for monitoring dashboards
- **Webhook Notifications**: Slack and email notifications for important events

### 🔄 CI/CD Integration

- **Pipeline Integration**: Automated sync on git events (push, PR, release)
- **Environment Support**: Development, staging, and production deployments
- **Rollback Capabilities**: Automatic rollback on sync failures
- **Status Reporting**: Detailed deployment results and notifications

### 🛡️ Enterprise Features

- **Rate Limiting**: Configurable API rate limiting with burst protection
- **Error Handling**: Comprehensive error handling with retry logic
- **Security**: Secure API token management and validation
- **Scalability**: Designed for large documentation repositories

## Installation

```bash
npm install @mosaicstack/mcp-bookstack
```

## Quick Start

### 1. Initialize Configuration

```bash
npx bookstack-sync init --docs-root ./docs --bookstack-url https://your-bookstack.com
```

This creates a `bookstack-sync.json` configuration file.

### 2. Configure API Credentials

Edit the generated configuration file:

```json
{
  "sync": {
    "docsRoot": "./docs",
    "bookstack": {
      "baseUrl": "https://your-bookstack.com",
      "tokenId": "your-api-token-id",
      "tokenSecret": "your-api-token-secret"
    }
  }
}
```

### 3. Run Sync

```bash
npx bookstack-sync sync
```

## Documentation Structure

The sync engine expects a specific directory structure that maps to BookStack's hierarchy:

```
docs/
├── engineering/           → BookStack Shelf: "Engineering Documentation"
│   ├── getting-started/   → BookStack Book: "Getting Started"
│   │   ├── prerequisites/ → BookStack Chapter: "Prerequisites"
│   │   │   ├── 01-system-requirements.md → BookStack Page
│   │   │   └── 02-development-tools.md   → BookStack Page
│   │   └── quick-start/
│   │       └── 01-first-project.md
│   └── api-documentation/
│       └── rest-apis/
│           └── 01-api-overview.md
├── platform/              → BookStack Shelf: "Platform Documentation"
│   ├── installation/
│   └── operations/
└── projects/              → BookStack Shelf: "Project Documentation"
    ├── architecture/
    └── project-management/
```

### Mapping Rules

- **Project (Top-level directory)** → **BookStack Shelf**
- **Book (Second-level directory)** → **BookStack Book**
- **Chapter (Third-level directory)** → **BookStack Chapter**
- **Page (Markdown files)** → **BookStack Page**

## Configuration

### Complete Configuration Example

```json
{
  "sync": {
    "docsRoot": "./docs",
    "bookstack": {
      "baseUrl": "https://bookstack.example.com",
      "tokenId": "your-token-id",
      "tokenSecret": "your-token-secret",
      "rateLimit": {
        "requestsPerMinute": 60,
        "burstLimit": 10
      },
      "retryConfig": {
        "maxRetries": 3,
        "backoffMs": 1000
      }
    },
    "dryRun": false,
    "conflictResolution": "manual",
    "excludePatterns": ["node_modules", ".git", ".bookstack", "dist", "build"]
  },
  "monitoring": {
    "metricsPath": "./data/bookstack-metrics",
    "healthCheckInterval": 60000,
    "retentionDays": 30,
    "thresholds": {
      "errorRate": 10,
      "syncDuration": 300000,
      "conflictRate": 5
    },
    "alertWebhooks": ["https://hooks.slack.com/your-webhook"]
  },
  "cicd": {
    "enabled": true,
    "triggers": {
      "onPush": true,
      "onPullRequest": false,
      "onRelease": true,
      "branches": ["main", "master", "develop"]
    },
    "deployment": {
      "environment": "production",
      "requireApproval": true,
      "rollbackOnFailure": true
    },
    "notifications": {
      "slack": {
        "webhook": "https://hooks.slack.com/your-webhook",
        "channel": "#documentation"
      }
    }
  }
}
```

## CLI Commands

### Sync Operations

```bash
# Basic sync
npx bookstack-sync sync

# Dry run (no changes made)
npx bookstack-sync sync --dry-run

# Sync with custom config
npx bookstack-sync sync --config ./custom-config.json

# Override configuration via CLI
npx bookstack-sync sync --docs-root ./documentation --bookstack-url https://docs.company.com
```

### Health & Monitoring

```bash
# Check system health
npx bookstack-sync health

# View dashboard data
npx bookstack-sync dashboard

# Get dashboard data as JSON
npx bookstack-sync dashboard --json
```

### CI/CD Operations

```bash
# Execute CI/CD pipeline
npx bookstack-sync cicd --trigger push --branch main --environment production

# Manual deployment
npx bookstack-sync cicd --trigger manual --environment staging
```

### Validation

```bash
# Validate configuration and connectivity
npx bookstack-sync validate

# Initialize new configuration
npx bookstack-sync init --docs-root ./docs --bookstack-url https://your-bookstack.com
```

## Programmatic Usage

### Basic Sync

```typescript
import { createBookStackIntegration } from "@mosaicstack/mcp-bookstack";

const integration = createBookStackIntegration({
  docsRoot: "./docs",
  bookstack: {
    baseUrl: "https://bookstack.example.com",
    tokenId: "your-token-id",
    tokenSecret: "your-token-secret",
  },
});

await integration.initialize();
const stats = await integration.sync();
console.log("Sync completed:", stats);
integration.shutdown();
```

### With Monitoring

```typescript
import {
  createBookStackIntegration,
  defaultConfigs,
} from "@mosaicstack/mcp-bookstack";

const integration = createBookStackIntegration(
  {
    docsRoot: "./docs",
    bookstack: {
      baseUrl: "https://bookstack.example.com",
      tokenId: "your-token-id",
      tokenSecret: "your-token-secret",
    },
  },
  {
    monitoring: {
      ...defaultConfigs.monitoring,
      alertWebhooks: ["https://hooks.slack.com/your-webhook"],
    },
  },
);

// Listen to events
integration.monitoringSystem?.on("alert", (alert) => {
  console.log("Alert:", alert.title, alert.message);
});

await integration.initialize();
const stats = await integration.sync();
const health = integration.getHealthStatus();
integration.shutdown();
```

### CI/CD Pipeline

```typescript
import { createBookStackIntegration } from "@mosaicstack/mcp-bookstack";

const integration = createBookStackIntegration(syncConfig, {
  cicd: {
    enabled: true,
    triggers: {
      onPush: true,
      onPullRequest: false,
      onRelease: true,
      branches: ["main"],
    },
    deployment: {
      environment: "production",
      requireApproval: false,
      rollbackOnFailure: true,
    },
  },
});

const result = await integration.executePipeline({
  trigger: "push",
  branch: "main",
  commit: "abc123",
  author: "developer@company.com",
  message: "Update documentation",
  environment: "production",
});

console.log("Deployment result:", result);
```

## Frontmatter Support

Pages support YAML frontmatter for metadata:

```markdown
---
title: "API Overview"
tags: ["api", "rest", "documentation"]
order: 1
category: "api-reference"
last_updated: "2025-01-19"
author: "engineering-team"
version: "1.0"
status: "published"
---

# API Overview

Your content here...
```

## Conflict Resolution

The system detects conflicts when both Git and BookStack versions have been modified since the last sync:

### Resolution Strategies

- **`manual`** (default): Emit conflict events for manual resolution
- **`git_wins`**: Always use Git version
- **`bookstack_wins`**: Always use BookStack version

### Conflict Metadata

Conflicts include detailed information:

```typescript
interface ConflictInfo {
  entity_type: string;
  entity_id: number;
  git_content: string;
  bookstack_content: string;
  git_updated: string;
  bookstack_updated: string;
  resolution_strategy: "git_wins" | "bookstack_wins" | "manual";
}
```

## Monitoring & Alerts

### Health Checks

The system continuously monitors:

- BookStack API connectivity
- Git repository status
- File system accessibility
- Sync performance metrics

### Alert Types

- **Info**: General information (retries, rate limits)
- **Warning**: Performance issues, conflicts
- **Error**: Sync failures, API errors
- **Critical**: System unavailability

### Metrics Collection

Comprehensive metrics are collected:

```typescript
interface SyncMetrics {
  timestamp: string;
  duration: number;
  stats: SyncStats;
  success: boolean;
  errorMessage?: string;
  performance: {
    apiCalls: number;
    rateLimitHits: number;
    retries: number;
    avgResponseTime: number;
  };
}
```

## Error Handling

### Rate Limiting

- Configurable requests per minute
- Burst protection
- Automatic backoff and retry

### Retry Logic

- Exponential backoff
- Configurable max retries
- Detailed retry logging

### Error Recovery

- Graceful degradation
- Partial sync completion
- Detailed error reporting

## Security

### API Token Management

- Secure token storage
- Token validation
- Automatic token refresh (if supported)

### Content Security

- No sensitive data logging
- Secure webhook payloads
- Input validation and sanitization

## Performance

### Optimization Features

- Incremental sync (only changed content)
- Content hash comparison
- Parallel API requests (within rate limits)
- Efficient metadata caching

### Scalability

- Designed for large documentation repositories
- Memory-efficient processing
- Configurable batch sizes

## Troubleshooting

### Common Issues

1. **API Connection Failed**

   ```bash
   npx bookstack-sync validate
   ```

2. **Rate Limit Exceeded**
   - Reduce `requestsPerMinute` in configuration
   - Increase `burstLimit` for better distribution

3. **Sync Conflicts**
   - Review conflict resolution strategy
   - Manually resolve conflicts in BookStack
   - Re-run sync

4. **Missing Content**
   - Check directory structure matches expected format
   - Verify file permissions
   - Review exclude patterns

### Debug Mode

Enable verbose logging:

```bash
npx bookstack-sync sync --verbose
```

### Log Files

Monitor logs in:

- `./data/bookstack-metrics/sync-metrics.json`
- `./data/bookstack-metrics/alerts.json`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- GitHub Issues: [Report bugs and feature requests](https://github.com/jetrich/mosaic-sdk/issues)
- Documentation: [Full documentation](https://mosaicstack.dev)
- Community: [Join our Discord](https://discord.gg/mosaicstack)
