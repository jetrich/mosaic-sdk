---
title: "Environment Variables"
order: 01
category: "config"
tags: ["configuration", "environment", "security", "deployment"]
last_updated: "2025-01-19"
author: "system"
version: "1.0"
status: "published"
---

# Environment Variables Configuration

This guide details all environment variables used in the MosAIc Stack deployment.

## Overview

Environment variables are used to configure services without hardcoding sensitive information. They are loaded from `.env` files and Docker secrets.

## File Structure

```
deployment/
├── .env.example        # Template with all variables
├── .env               # Local configuration (git ignored)
├── .env.production    # Production defaults
├── .env.staging       # Staging defaults
└── secrets/           # Docker secrets directory
```

## Core Configuration

### Domain Settings

```bash
# Primary domain for your installation
DOMAIN=mosaicstack.dev

# Service subdomains
GITEA_DOMAIN=git.mosaicstack.dev
BOOKSTACK_DOMAIN=docs.mosaicstack.dev
WOODPECKER_DOMAIN=ci.mosaicstack.dev
PLANE_DOMAIN=plane.mosaicstack.dev
GRAFANA_DOMAIN=grafana.mosaicstack.dev

# Email configuration
ACME_EMAIL=admin@mosaicstack.dev
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@mosaicstack.dev
SMTP_PASSWORD=your-smtp-password
```

### Database Configuration

```bash
# PostgreSQL (shared by Gitea, Plane, Woodpecker)
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure-postgres-password
POSTGRES_DB=postgres

# Service-specific databases
GITEA_DB_NAME=gitea
PLANE_DB_NAME=plane
WOODPECKER_DB_NAME=woodpecker

# MariaDB (for BookStack)
MARIADB_HOST=mariadb
MARIADB_PORT=3306
MARIADB_ROOT_PASSWORD=secure-root-password
MARIADB_DATABASE=bookstack
MARIADB_USER=bookstack
MARIADB_PASSWORD=secure-mariadb-password

# Redis (shared cache)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=secure-redis-password
```

## Service-Specific Variables

### Gitea

```bash
# Basic configuration
GITEA__APP_NAME="MosAIc Git"
GITEA__RUN_MODE=prod
GITEA__RUN_USER=git

# Security
GITEA__security__SECRET_KEY=generate-64-char-secret
GITEA__security__INTERNAL_TOKEN=generate-64-char-token
GITEA__security__INSTALL_LOCK=true

# Server settings
GITEA__server__DOMAIN=${GITEA_DOMAIN}
GITEA__server__ROOT_URL=https://${GITEA_DOMAIN}/
GITEA__server__SSH_DOMAIN=${GITEA_DOMAIN}
GITEA__server__SSH_PORT=2222
GITEA__server__HTTP_PORT=3000
GITEA__server__DISABLE_SSH=false
GITEA__server__START_SSH_SERVER=true
GITEA__server__LFS_START_SERVER=true

# Database
GITEA__database__DB_TYPE=postgres
GITEA__database__HOST=${POSTGRES_HOST}:${POSTGRES_PORT}
GITEA__database__NAME=${GITEA_DB_NAME}
GITEA__database__USER=${POSTGRES_USER}
GITEA__database__PASSWD=${POSTGRES_PASSWORD}

# Cache
GITEA__cache__ENABLED=true
GITEA__cache__ADAPTER=redis
GITEA__cache__HOST=redis://:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}/0

# Mail
GITEA__mailer__ENABLED=true
GITEA__mailer__FROM=${SMTP_USER}
GITEA__mailer__HOST=${SMTP_HOST}:${SMTP_PORT}
GITEA__mailer__USER=${SMTP_USER}
GITEA__mailer__PASSWD=${SMTP_PASSWORD}

# OAuth2
GITEA__oauth2__JWT_SECRET=generate-32-char-secret
```

### BookStack

```bash
# Application
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:generate-32-char-key
APP_URL=https://${BOOKSTACK_DOMAIN}
APP_TIMEZONE=UTC
APP_LOCALE=en

# Database
DB_CONNECTION=mysql
DB_HOST=${MARIADB_HOST}
DB_PORT=${MARIADB_PORT}
DB_DATABASE=${MARIADB_DATABASE}
DB_USERNAME=${MARIADB_USER}
DB_PASSWORD=${MARIADB_PASSWORD}

# Cache and Session
CACHE_DRIVER=redis
SESSION_DRIVER=redis
REDIS_HOST=${REDIS_HOST}
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_PORT=${REDIS_PORT}

# Mail
MAIL_DRIVER=smtp
MAIL_HOST=${SMTP_HOST}
MAIL_PORT=${SMTP_PORT}
MAIL_USERNAME=${SMTP_USER}
MAIL_PASSWORD=${SMTP_PASSWORD}
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=${SMTP_USER}

# Authentication
AUTH_METHOD=standard
# LDAP_SERVER=ldap://ldap.example.com
# LDAP_BASE_DN=dc=example,dc=com
# LDAP_DN=cn=admin,dc=example,dc=com
# LDAP_PASS=ldap-password

# Storage
STORAGE_TYPE=local
STORAGE_ATTACHMENT_TYPE=local
```

### Woodpecker CI

```bash
# Server configuration
WOODPECKER_HOST=https://${WOODPECKER_DOMAIN}
WOODPECKER_ADMIN=admin
WOODPECKER_OPEN=false

# Agent configuration
WOODPECKER_AGENT_SECRET=generate-secure-agent-secret
WOODPECKER_MAX_PROCS=4

# Git integration
WOODPECKER_GITEA=true
WOODPECKER_GITEA_URL=https://${GITEA_DOMAIN}
WOODPECKER_GITEA_CLIENT=oauth-client-id
WOODPECKER_GITEA_SECRET=oauth-client-secret

# Database
WOODPECKER_DATABASE_DRIVER=postgres
WOODPECKER_DATABASE_DATASOURCE=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${WOODPECKER_DB_NAME}?sslmode=disable

# Security
WOODPECKER_ENCRYPTION_KEY=generate-32-char-key
```

### Plane

```bash
# Application
NEXT_PUBLIC_DEPLOY_URL=https://${PLANE_DOMAIN}
SECRET_KEY=generate-secret-key

# Database
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${PLANE_DB_NAME}

# Redis
REDIS_URL=redis://:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}/1

# Storage
USE_MINIO=0
AWS_S3_ENDPOINT_URL=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=
AWS_REGION=us-east-1

# Email
EMAIL_HOST=${SMTP_HOST}
EMAIL_PORT=${SMTP_PORT}
EMAIL_USE_TLS=1
EMAIL_HOST_USER=${SMTP_USER}
EMAIL_HOST_PASSWORD=${SMTP_PASSWORD}
DEFAULT_FROM_EMAIL=${SMTP_USER}

# Authentication
ENABLE_SIGNUP=1
ENABLE_EMAIL_PASSWORD=1
ENABLE_MAGIC_LINK_LOGIN=0

# OpenAI Integration (optional)
OPENAI_API_BASE=https://api.openai.com/v1
OPENAI_API_KEY=your-openai-key
GPT_ENGINE=gpt-3.5-turbo
```

## Security Variables

### Secrets Management

```bash
# JWT Secrets
JWT_SECRET=generate-long-random-string
JWT_EXPIRY=7d

# Session Secrets
SESSION_SECRET=generate-long-random-string
SESSION_EXPIRY=24h

# API Keys
INTERNAL_API_KEY=generate-api-key
WEBHOOK_SECRET=generate-webhook-secret

# Encryption Keys
ENCRYPTION_KEY=generate-32-byte-key
ENCRYPTION_SALT=generate-16-byte-salt
```

### OAuth2 Configuration

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# GitLab OAuth
GITLAB_CLIENT_ID=your-gitlab-client-id
GITLAB_CLIENT_SECRET=your-gitlab-client-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Monitoring Variables

### Prometheus

```bash
# Retention
PROMETHEUS_RETENTION_TIME=30d
PROMETHEUS_RETENTION_SIZE=10GB

# External labels
PROMETHEUS_EXTERNAL_LABELS=cluster="production",region="us-east"
```

### Grafana

```bash
# Admin credentials
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=secure-admin-password

# Configuration
GF_SERVER_ROOT_URL=https://${GRAFANA_DOMAIN}
GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
GF_USERS_ALLOW_SIGN_UP=false
GF_SMTP_ENABLED=true
GF_SMTP_HOST=${SMTP_HOST}:${SMTP_PORT}
GF_SMTP_USER=${SMTP_USER}
GF_SMTP_PASSWORD=${SMTP_PASSWORD}
```

### Loki

```bash
# Storage
LOKI_STORAGE_TYPE=filesystem
LOKI_STORAGE_PATH=/loki

# Retention
LOKI_RETENTION_PERIOD=168h
LOKI_RETENTION_DELETE_DELAY=2h
```

## Performance Tuning

### Resource Limits

```bash
# PostgreSQL
POSTGRES_MAX_CONNECTIONS=200
POSTGRES_SHARED_BUFFERS=256MB
POSTGRES_EFFECTIVE_CACHE_SIZE=1GB

# Redis
REDIS_MAXMEMORY=512mb
REDIS_MAXMEMORY_POLICY=allkeys-lru

# Application limits
MAX_UPLOAD_SIZE=100M
REQUEST_TIMEOUT=30s
WORKER_PROCESSES=4
```

### Caching

```bash
# Cache TTL
CACHE_TTL_DEFAULT=3600
CACHE_TTL_SESSION=86400
CACHE_TTL_STATIC=604800

# Cache warming
CACHE_WARM_ON_START=true
CACHE_WARM_PATHS=/api/v1/status,/api/v1/health
```

## Development Variables

### Debug Settings

```bash
# Enable debug mode
DEBUG=true
LOG_LEVEL=debug
VERBOSE_LOGGING=true

# Development tools
ENABLE_PROFILING=true
ENABLE_QUERY_LOGGING=true
SLOW_QUERY_THRESHOLD=100ms
```

### Local Development

```bash
# Local URLs
LOCAL_DOMAIN=localhost
LOCAL_GITEA_PORT=3000
LOCAL_BOOKSTACK_PORT=6875
LOCAL_WOODPECKER_PORT=8000
LOCAL_PLANE_PORT=3001

# Mock services
USE_MOCK_EMAIL=true
USE_MOCK_STORAGE=true
```

## Best Practices

### Security
1. **Never commit `.env` files** containing real credentials
2. **Use strong passwords** - minimum 32 characters for secrets
3. **Rotate secrets regularly** - at least every 90 days
4. **Use Docker secrets** for production deployments
5. **Encrypt sensitive values** at rest

### Organization
1. **Group related variables** together
2. **Use consistent naming** - UPPERCASE with underscores
3. **Provide defaults** in `.env.example`
4. **Document each variable** with comments
5. **Validate required variables** on startup

### Example `.env.example`
```bash
# MosAIc Stack Configuration
# Copy this file to .env and fill in your values

#############
# DOMAINS
#############
DOMAIN=your-domain.com
GITEA_DOMAIN=git.your-domain.com
# ... more examples with descriptions
```

## Validation Script

```bash
#!/bin/bash
# validate-env.sh - Validates required environment variables

required_vars=(
  "DOMAIN"
  "POSTGRES_PASSWORD"
  "REDIS_PASSWORD"
  "GITEA__security__SECRET_KEY"
  "WOODPECKER_AGENT_SECRET"
)

missing_vars=()

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing_vars+=("$var")
  fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
  echo "Missing required environment variables:"
  printf '%s\n' "${missing_vars[@]}"
  exit 1
fi

echo "All required environment variables are set!"
```

---

For more configuration guides, see:
- [Docker Compose Configuration](./02-docker-compose.md)
- [Service Configuration](./03-service-config.md)
- [SSL/TLS Setup](../security/01-ssl-setup.md)