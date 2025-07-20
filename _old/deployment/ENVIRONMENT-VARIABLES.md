# Environment Variables Documentation

## Required Environment Variables

### Domain Configuration
- `DOMAIN` - Base domain for all services (e.g., `example.com`)
- `ACME_EMAIL` - Email for Let's Encrypt SSL certificates

### Admin Configuration
- `ADMIN_EMAIL` - Administrator email address
- `TRAEFIK_ADMIN_PASSWORD` - Traefik dashboard password (htpasswd format)

### Database Credentials

#### PostgreSQL
- `POSTGRES_PASSWORD` - Root password for PostgreSQL
- `GITEA_DB_PASSWORD` - Password for Gitea database user
- `PLANE_DB_PASSWORD` - Password for Plane database user
- `WOODPECKER_DB_PASSWORD` - Password for Woodpecker database user

#### MariaDB
- `MARIADB_ROOT_PASSWORD` - Root password for MariaDB
- `BOOKSTACK_DB_PASSWORD` - Password for BookStack database user

#### Redis
- `REDIS_PASSWORD` - Password for Redis (optional but recommended)

### Service-Specific Secrets

#### Gitea
- `GITEA_SECRET_KEY` - Secret key for Gitea (generate with `openssl rand -hex 32`)
- `GITEA_INTERNAL_TOKEN` - Internal API token (generate with `openssl rand -hex 32`)
- `GITEA_LFS_JWT_SECRET` - LFS JWT secret (generate with `openssl rand -hex 32`)

#### Plane
- `PLANE_SECRET_KEY` - Django secret key (generate with `openssl rand -hex 32`)
- `PLANE_API_KEY` - API key for Plane services

#### BookStack
- `BOOKSTACK_APP_KEY` - Application key (generate with `openssl rand -base64 32`)

#### Woodpecker
- `WOODPECKER_AGENT_SECRET` - Shared secret for agents (generate with `openssl rand -hex 32`)
- `WOODPECKER_GITHUB_CLIENT` - GitHub OAuth client ID (if using GitHub)
- `WOODPECKER_GITHUB_SECRET` - GitHub OAuth client secret (if using GitHub)

### Optional Variables

#### SMTP Configuration
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port (default: 587)
- `SMTP_USER` - SMTP username
- `SMTP_PASSWORD` - SMTP password
- `SMTP_FROM` - From email address

#### Storage Configuration
- `BACKUP_PATH` - Path for backup storage (default: `/var/backups/mosaic`)
- `DATA_PATH` - Path for persistent data (default: `/var/lib/mosaic`)
- `LOG_PATH` - Path for logs (default: `/var/log/mosaic`)

#### Performance Tuning
- `POSTGRES_MAX_CONNECTIONS` - PostgreSQL max connections (default: 100)
- `REDIS_MAX_MEMORY` - Redis max memory (default: 256mb)
- `NGINX_WORKER_PROCESSES` - Nginx worker processes (default: auto)

## Example .env File

```bash
# Domain Configuration
DOMAIN=example.com
ACME_EMAIL=admin@example.com

# Admin Configuration
ADMIN_EMAIL=admin@example.com
TRAEFIK_ADMIN_PASSWORD=$2y$10$... # Generated with: htpasswd -nb admin password

# PostgreSQL
POSTGRES_PASSWORD=strong_postgres_password_here
GITEA_DB_PASSWORD=gitea_db_password_here
PLANE_DB_PASSWORD=plane_db_password_here
WOODPECKER_DB_PASSWORD=woodpecker_db_password_here

# MariaDB
MARIADB_ROOT_PASSWORD=strong_mariadb_password_here
BOOKSTACK_DB_PASSWORD=bookstack_db_password_here

# Redis
REDIS_PASSWORD=redis_password_here

# Gitea
GITEA_SECRET_KEY=$(openssl rand -hex 32)
GITEA_INTERNAL_TOKEN=$(openssl rand -hex 32)
GITEA_LFS_JWT_SECRET=$(openssl rand -hex 32)

# Plane
PLANE_SECRET_KEY=$(openssl rand -hex 32)
PLANE_API_KEY=$(openssl rand -hex 32)

# BookStack
BOOKSTACK_APP_KEY=base64:$(openssl rand -base64 32)

# Woodpecker
WOODPECKER_AGENT_SECRET=$(openssl rand -hex 32)

# Optional: SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@example.com
SMTP_PASSWORD=smtp_password_here
SMTP_FROM=Mosaic Stack <notifications@example.com>

# Optional: Storage
BACKUP_PATH=/var/backups/mosaic
DATA_PATH=/var/lib/mosaic
LOG_PATH=/var/log/mosaic
```

## Generating Secrets

### Script to Generate All Secrets
```bash
#!/bin/bash
# generate-secrets.sh

echo "# Generated Secrets - $(date)"
echo "GITEA_SECRET_KEY=$(openssl rand -hex 32)"
echo "GITEA_INTERNAL_TOKEN=$(openssl rand -hex 32)"
echo "GITEA_LFS_JWT_SECRET=$(openssl rand -hex 32)"
echo "PLANE_SECRET_KEY=$(openssl rand -hex 32)"
echo "PLANE_API_KEY=$(openssl rand -hex 32)"
echo "BOOKSTACK_APP_KEY=base64:$(openssl rand -base64 32)"
echo "WOODPECKER_AGENT_SECRET=$(openssl rand -hex 32)"
```

### Password Generation
```bash
# Generate strong passwords
openssl rand -base64 32

# Generate htpasswd for Traefik
htpasswd -nb admin your_password_here
```

## Security Best Practices

1. **Never commit .env files** - Add to .gitignore
2. **Use strong passwords** - Minimum 32 characters
3. **Rotate secrets regularly** - Every 90 days
4. **Encrypt at rest** - Use encrypted filesystems
5. **Limit access** - Set file permissions to 600
6. **Use secrets management** - Consider HashiCorp Vault for production

## Validation

### Check All Variables Set
```bash
#!/bin/bash
# validate-env.sh

required_vars=(
    "DOMAIN"
    "ACME_EMAIL"
    "ADMIN_EMAIL"
    "POSTGRES_PASSWORD"
    "MARIADB_ROOT_PASSWORD"
    "GITEA_SECRET_KEY"
    "PLANE_SECRET_KEY"
    "BOOKSTACK_APP_KEY"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "ERROR: $var is not set"
        exit 1
    fi
done

echo "All required variables are set"
```