---
title: "Gitea Service"
order: 01
category: "services"
tags: ["gitea", "git", "vcs", "source-control"]
last_updated: "2025-01-19"
author: "system"
version: "1.0"
status: "published"
---

# Gitea Service Configuration

Gitea is the Git service powering the MosAIc Stack's source code management.

## Overview

Gitea provides:
- Git repository hosting
- Issue tracking
- Pull request workflows
- CI/CD integration
- OAuth2 provider
- Webhook support

## Configuration

### Basic Settings

```yaml
# docker-compose.yml
services:
  gitea:
    image: gitea/gitea:1.21.4
    container_name: mosaic-gitea
    environment:
      - USER_UID=1000
      - USER_GID=1000
      - GITEA__database__DB_TYPE=postgres
      - GITEA__database__HOST=postgres:5432
      - GITEA__database__NAME=gitea
      - GITEA__database__USER=postgres
      - GITEA__database__PASSWD=${POSTGRES_PASSWORD}
    volumes:
      - /opt/mosaic/gitea:/data
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
    ports:
      - "3000:3000"
      - "2222:22"
    networks:
      - mosaic-proxy
      - mosaic-db
    depends_on:
      - postgres
    restart: unless-stopped
```

### Environment Variables

```bash
# Core settings
GITEA__APP_NAME="MosAIc Git"
GITEA__RUN_USER=git
GITEA__RUN_MODE=prod

# Server configuration
GITEA__server__DOMAIN=git.mosaicstack.dev
GITEA__server__ROOT_URL=https://git.mosaicstack.dev/
GITEA__server__HTTP_PORT=3000
GITEA__server__SSH_DOMAIN=git.mosaicstack.dev
GITEA__server__SSH_PORT=2222
GITEA__server__START_SSH_SERVER=true
GITEA__server__LFS_START_SERVER=true

# Database
GITEA__database__DB_TYPE=postgres
GITEA__database__HOST=postgres:5432
GITEA__database__NAME=gitea
GITEA__database__USER=postgres
GITEA__database__PASSWD=${POSTGRES_PASSWORD}
GITEA__database__SSL_MODE=disable

# Cache (Redis)
GITEA__cache__ENABLED=true
GITEA__cache__ADAPTER=redis
GITEA__cache__HOST=redis://redis:6379/0?pool_size=100&idle_timeout=180s

# Session
GITEA__session__PROVIDER=redis
GITEA__session__PROVIDER_CONFIG=redis://redis:6379/1?pool_size=100&idle_timeout=180s

# Security
GITEA__security__SECRET_KEY=${GITEA_SECRET_KEY}
GITEA__security__INTERNAL_TOKEN=${GITEA_INTERNAL_TOKEN}
GITEA__security__INSTALL_LOCK=true
GITEA__security__PASSWORD_COMPLEXITY=lower,upper,digit,spec

# Service settings
GITEA__service__DISABLE_REGISTRATION=false
GITEA__service__REQUIRE_SIGNIN_VIEW=false
GITEA__service__REGISTER_EMAIL_CONFIRM=true
GITEA__service__DEFAULT_ALLOW_CREATE_ORGANIZATION=true
GITEA__service__DEFAULT_ENABLE_TIMETRACKING=true

# Webhook
GITEA__webhook__ALLOWED_HOST_LIST=*
GITEA__webhook__DELIVER_TIMEOUT=30
GITEA__webhook__SKIP_TLS_VERIFY=false

# OAuth2
GITEA__oauth2__JWT_SECRET=${GITEA_JWT_SECRET}
GITEA__oauth2__ENABLE=true
```

## Initial Setup

### 1. First Run Configuration

```bash
# Start Gitea
docker compose up -d gitea

# Wait for initialization
docker compose logs -f gitea

# Access web interface
# https://git.mosaicstack.dev
```

### 2. Admin User Creation

First user registered becomes admin, or create via CLI:

```bash
docker exec -it mosaic-gitea gitea admin user create \
  --username admin \
  --password 'secure-password' \
  --email admin@mosaicstack.dev \
  --admin
```

### 3. OAuth2 Application Setup

For Woodpecker CI integration:

```bash
# Navigate to Settings > Applications
# Create new OAuth2 Application:
# - Name: Woodpecker CI
# - Redirect URI: https://ci.mosaicstack.dev/authorize
# Save Client ID and Secret for Woodpecker config
```

## Repository Management

### Create Organization

```bash
# Via API
curl -X POST https://git.mosaicstack.dev/api/v1/orgs \
  -H "Authorization: token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "mosaic",
    "full_name": "MosAIc Organization",
    "description": "Official MosAIc repositories"
  }'
```

### Repository Settings

```bash
# Clone settings template
git clone https://git.mosaicstack.dev/mosaic/repo-template

# Key settings to configure:
# - Branch protection
# - Webhook notifications
# - Access permissions
# - Issue labels
# - Milestones
```

## SSH Configuration

### Server Side

```bash
# Generate host keys (if not exists)
docker exec -it mosaic-gitea ssh-keygen -A

# Verify SSH daemon
docker exec -it mosaic-gitea ps aux | grep sshd
```

### Client Side

```bash
# Add to ~/.ssh/config
Host git.mosaicstack.dev
    Port 2222
    User git
    IdentityFile ~/.ssh/id_ed25519

# Test connection
ssh -T git@git.mosaicstack.dev -p 2222
```

## Git LFS Setup

### Enable LFS

```bash
# Already enabled via environment
GITEA__server__LFS_START_SERVER=true

# Configure storage
GITEA__server__LFS_CONTENT_PATH=/data/git/lfs
GITEA__server__LFS_JWT_SECRET=${LFS_JWT_SECRET}
```

### Client Usage

```bash
# Install Git LFS
git lfs install

# Track large files
git lfs track "*.psd"
git lfs track "*.zip"
git add .gitattributes

# Normal git workflow
git add file.psd
git commit -m "Add design file"
git push
```

## Backup and Restore

### Backup

```bash
# Full backup
docker exec -it mosaic-gitea gitea dump \
  -c /data/gitea/conf/app.ini \
  -w /tmp \
  -t /tmp

# Copy backup out
docker cp mosaic-gitea:/tmp/gitea-dump-*.zip /opt/mosaic/backups/
```

### Restore

```bash
# Stop Gitea
docker compose stop gitea

# Extract backup
cd /opt/mosaic/gitea
unzip /opt/mosaic/backups/gitea-dump-*.zip

# Restore database
docker exec -i mosaic-postgres psql -U postgres gitea < gitea-db.sql

# Restore data
tar xzf gitea-repo.tar.gz -C /opt/mosaic/gitea/git/

# Start Gitea
docker compose start gitea
```

## Performance Tuning

### Database Connections

```bash
# Optimize connection pool
GITEA__database__MAX_OPEN_CONNS=50
GITEA__database__MAX_IDLE_CONNS=10
GITEA__database__CONN_MAX_LIFETIME=3600
```

### Caching

```bash
# Redis cache settings
GITEA__cache__ITEM_TTL=16h
GITEA__cache__CONN_STR=redis://redis:6379/0?pool_size=100&idle_timeout=180s
```

### Web Server

```bash
# Concurrent connections
GITEA__server__HTTP_PORT=3000
GITEA__server__PER_WRITE_TIMEOUT=30s
GITEA__server__PER_READ_TIMEOUT=30s
```

## Monitoring

### Health Check

```bash
# HTTP health endpoint
curl https://git.mosaicstack.dev/api/v1/version

# Metrics endpoint
curl https://git.mosaicstack.dev/metrics
```

### Prometheus Metrics

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'gitea'
    static_configs:
      - targets: ['gitea:3000']
    metrics_path: '/metrics'
    bearer_token: 'YOUR_METRICS_TOKEN'
```

### Log Analysis

```bash
# View logs
docker compose logs gitea --tail=100

# Common log patterns
grep "ERROR" /opt/mosaic/gitea/log/gitea.log
grep "WARN" /opt/mosaic/gitea/log/gitea.log
grep "Failed authentication" /opt/mosaic/gitea/log/gitea.log
```

## Security

### Access Control

```bash
# Disable registration
GITEA__service__DISABLE_REGISTRATION=true

# Require sign-in
GITEA__service__REQUIRE_SIGNIN_VIEW=true

# Limit user creation
GITEA__service__DEFAULT_ALLOW_CREATE_ORGANIZATION=false
```

### Two-Factor Authentication

```bash
# Enable 2FA
GITEA__security__TWO_FACTOR_AUTHENTICATION=true

# Enforce for admins
docker exec -it mosaic-gitea gitea admin user must-change-2fa --all
```

### Webhook Security

```bash
# Restrict webhook hosts
GITEA__webhook__ALLOWED_HOST_LIST=ci.mosaicstack.dev,localhost

# Webhook secrets
GITEA__webhook__SECRET=webhook-secret-key
```

## Troubleshooting

### Common Issues

1. **Cannot access web interface**
   ```bash
   # Check container status
   docker compose ps gitea
   
   # Check logs
   docker compose logs gitea
   
   # Verify network
   docker exec gitea wget -O- http://localhost:3000
   ```

2. **SSH connection refused**
   ```bash
   # Check SSH daemon
   docker exec gitea ps aux | grep sshd
   
   # Verify port mapping
   docker port mosaic-gitea 22
   
   # Test internal SSH
   docker exec gitea ssh -T git@localhost -p 22
   ```

3. **Database connection failed**
   ```bash
   # Test database connection
   docker exec gitea pg_isready -h postgres -p 5432
   
   # Check credentials
   docker exec gitea env | grep GITEA__database
   ```

## Integration

### Woodpecker CI

```yaml
# In Woodpecker configuration
WOODPECKER_GITEA=true
WOODPECKER_GITEA_URL=https://git.mosaicstack.dev
WOODPECKER_GITEA_CLIENT=oauth-client-id
WOODPECKER_GITEA_SECRET=oauth-client-secret
```

### External Authentication

```bash
# LDAP configuration
GITEA__security__LDAP_ENABLED=true
GITEA__security__LDAP_HOST=ldap.example.com
GITEA__security__LDAP_PORT=389
GITEA__security__LDAP_SECURITY_PROTOCOL=starttls
```

---

For more service configurations:
- [PostgreSQL Service](./02-postgres.md)
- [BookStack Service](./03-bookstack.md)
- [Woodpecker Service](./04-woodpecker.md)