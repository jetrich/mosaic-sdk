# MosAIc Stack - Portainer Deployment Guide

## Overview

The `docker-compose.mosaicstack-portainer.yml` file is designed for deployment through Portainer using bind mounts on `/opt/mosaic/` to preserve existing data and maintain compatibility with your current setup.

## Required Server Files

Before deployment, place these files on your server:

1. **PostgreSQL init script**: `/opt/mosaic/postgres/init-databases.sh`
   - Copy from: `deployment/scripts/init-databases.sh`
   - Make executable: `chmod +x /opt/mosaic/postgres/init-databases.sh`

2. **Redis configuration**: `/opt/mosaic/redis/redis.conf`
   - Copy from: `deployment/scripts/redis.conf`

## Key Features

1. **Bind Mounts**: Uses `/opt/mosaic/` paths to preserve existing data
2. **Dual Network**: Internal network for databases, external for web services
3. **No Port Exposure**: PostgreSQL and Redis are internal-only
4. **Health Checks**: All services include health monitoring

## Prerequisites

1. **Portainer** installed and running
2. **nginx-proxy-manager** network created
3. **Environment variables** configured in Portainer

## Environment Variables

Create these environment variables in Portainer before deployment:

```bash
# Required
POSTGRES_PASSWORD=<secure_password>
REDIS_PASSWORD=<secure_password>
WOODPECKER_AGENT_SECRET=<secure_secret>
PLANE_SECRET_KEY=<32_char_secret>

# Gitea Settings
GITEA_DISABLE_REGISTRATION=true
GITEA_REQUIRE_SIGNIN=true

# Woodpecker OAuth (set after Gitea OAuth2 app creation)
WOODPECKER_GITEA_CLIENT=<from_gitea>
WOODPECKER_GITEA_SECRET=<from_gitea>
WOODPECKER_ADMIN=admin
```

## Deployment Steps

### 1. Create External Network (if not exists)

On the Docker host:
```bash
docker network create nginx-proxy-manager_default
```

### 2. Deploy Stack in Portainer

1. In Portainer, go to **Stacks** → **Add stack**
2. Name: `mosaicstack`
3. **Web editor**: Paste contents of `docker-compose.mosaicstack-portainer.yml`
4. **Environment variables**: Add all required variables
5. Click **Deploy the stack**

### 3. Verify Services

After deployment, check that all services are healthy:
- PostgreSQL: All databases created
- Redis: Accepting connections
- Gitea: Accessible at port 3000
- Other services starting up

### 4. Post-Deployment Configuration

#### Configure Gitea OAuth for Woodpecker

1. Access Gitea at `http://<server>:3000`
2. Login as admin
3. Go to Settings → Applications
4. Create OAuth2 Application:
   - Name: `Woodpecker CI`
   - Redirect URI: `https://ci.mosaicstack.dev/authorize`
5. Copy Client ID and Secret
6. Update Woodpecker environment variables in Portainer
7. Restart Woodpecker services

#### Configure nginx-proxy-manager Routes

For each service, create a proxy host:

- **Gitea**: `git.mosaicstack.dev` → `http://mosaicstack-gitea:3000`
- **Woodpecker**: `ci.mosaicstack.dev` → `http://mosaicstack-woodpecker-server:8000`
- **BookStack**: `docs.mosaicstack.dev` → `http://mosaicstack-bookstack:80`
- **Plane**: `pm.mosaicstack.dev` → `http://mosaicstack-plane-web:3000`

## Service URLs

Once configured with nginx-proxy-manager:

- Git Repository: https://git.mosaicstack.dev
- CI/CD: https://ci.mosaicstack.dev
- Documentation: https://docs.mosaicstack.dev
- Project Management: https://pm.mosaicstack.dev

## Troubleshooting

### Check Service Logs
In Portainer, click on any container to view its logs.

### Database Connection Issues
The `postgres-init` container ensures all databases exist. Check its logs if services can't connect.

### Network Issues
Verify both networks are attached to services:
- `nginx-proxy-manager_default` for external access
- `mosaicstack-internal` for service communication

### Redis Connection
Redis config is generated at startup. Check the redis container logs for any issues.

## Data Persistence

All data is stored in bind mounts under `/opt/mosaic/`:
- `/opt/mosaic/postgres/data` - PostgreSQL databases
- `/opt/mosaic/redis/data` - Redis persistence
- `/opt/mosaic/gitea/data` - Gitea repositories and data
- `/opt/mosaic/gitea/config` - Gitea configuration
- `/opt/mosaic/woodpecker/data` - CI/CD server data
- `/opt/mosaic/woodpecker/agent_data` - CI/CD agent data
- `/opt/mosaic/bookstack/data` - Documentation data
- `/opt/mosaic/plane/media` - Project management media
- `/opt/mosaic/plane/static` - Project management static files

## Backup Strategy

Since data is in bind mounts, you can backup directly from the filesystem:
```bash
# Backup all MosAIc data
tar -czf /backup/mosaic-backup-$(date +%Y%m%d).tar.gz -C /opt/mosaic .

# Or backup individual services
tar -czf /backup/gitea-backup-$(date +%Y%m%d).tar.gz -C /opt/mosaic/gitea .
```

## Security Notes

1. Change all default passwords before deployment
2. The internal network is isolated from external access
3. Only necessary ports are exposed
4. Consider implementing fail2ban for SSH (port 2222)