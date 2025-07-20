---
title: Complete MosAIc Stack Deployment Guide
description: Comprehensive guide for deploying the complete MosAIc Stack from scratch
keywords: deployment, installation, mosaic, setup, docker, portainer, nginx
weight: 10
bookFlatSection: false
bookToc: true
bookHidden: false
bookCollapseSection: false
---

# Complete MosAIc Stack Deployment Guide

## Overview

The MosAIc Stack represents the evolution of AI-powered software development, combining the power of Tony Framework with enterprise-grade orchestration capabilities. This comprehensive guide provides step-by-step instructions for deploying the complete stack from scratch.

### Architecture Overview

The MosAIc Stack is built on a microservices architecture with the following core components:

```
┌─────────────────────────────────────────────────────────────┐
│                    MosAIc Stack                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ @tony/core  │  │@mosaic/core │  │ @mosaic/mcp │        │
│  │   v2.8.0    │  │   v0.1.0    │  │   v0.1.0    │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         └─────────────────┴─────────────────┘              │
│                           │                                 │
│                  @mosaic/tony-adapter                       │
│                    (Integration Layer)                      │
└─────────────────────────────────────────────────────────────┘
```

### Key Features

- **MCP-First Architecture**: Starting with v2.8.0, all components communicate through Model Context Protocol
- **Progressive Enhancement**: Scale from individual developer to enterprise deployment
- **Component Independence**: Each module maintains clear boundaries and responsibilities
- **Enterprise Ready**: Built for scalability, compliance, and team collaboration

## Prerequisites

### System Requirements

#### Minimum Hardware Requirements

| Component | Minimum Specification |
|-----------|---------------------|
| CPU | 4 cores |
| RAM | 16 GB |
| Storage | 100 GB SSD |
| Network | 100 Mbps connection |
| OS | Ubuntu 22.04 LTS or Debian 12 |

#### Recommended Hardware Requirements

| Component | Recommended Specification |
|-----------|--------------------------|
| CPU | 8+ cores |
| RAM | 32 GB |
| Storage | 500 GB NVMe SSD |
| Network | 1 Gbps connection |
| Backup | External backup solution |

### Software Requirements

#### Docker Installation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install prerequisites
sudo apt install -y \
  curl \
  wget \
  git \
  htop \
  iotop \
  net-tools \
  ca-certificates \
  gnupg \
  lsb-release

# Install Docker using official script
curl -fsSL https://get.docker.com | bash

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose v2
sudo apt install docker-compose-plugin

# Verify installations
docker --version
docker compose version
```

#### Domain and DNS Setup

Configure the following DNS A records pointing to your server IP:

| Service | Subdomain | Example |
|---------|-----------|---------|
| Git Repository | git | git.example.com |
| Documentation | docs | docs.example.com |
| CI/CD Pipeline | ci | ci.example.com |
| Admin Interface | admin | admin.example.com |
| Proxy Manager | npm | npm.example.com |

#### Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 81/tcp    # NPM Admin
sudo ufw allow 9000/tcp  # Portainer
sudo ufw enable
```

## Installation Methods

### Method 1: Automated Deployment (Recommended)

#### Step 1: Clone Repository

```bash
# Create project directory
sudo mkdir -p /opt/mosaic
sudo chown $USER:$USER /opt/mosaic
cd /opt/mosaic

# Clone repository with submodules
git clone https://github.com/jetrich/mosaic-sdk.git
cd mosaic-sdk
git submodule update --init --recursive
```

#### Step 2: Run Setup Script

```bash
# Run the automated setup script
sudo ./scripts/setup-host-filesystem.sh

# This script will:
# - Create directory structure in /opt/mosaic/
# - Generate all configuration files
# - Set proper permissions (1000:1000)
# - Create backup scripts
# - Provide environment variable template
```

#### Step 3: Configure Environment

```bash
# Copy and edit environment configuration
cp .env.example .env
nano .env
```

Update the following essential variables:

```env
# Domain Configuration
DOMAIN_NAME=example.com
ADMIN_EMAIL=admin@example.com

# Database Passwords (generate strong passwords)
POSTGRES_PASSWORD=<generate-strong-password>
MARIADB_ROOT_PASSWORD=<generate-strong-password>
MARIADB_PASSWORD=<generate-strong-password>
REDIS_PASSWORD=<generate-strong-password>

# Application Secrets
GITEA_SECRET_KEY=<generate-secret>
BOOKSTACK_APP_KEY=<generate-32-char-key>
WOODPECKER_AGENT_SECRET=<generate-secret>

# MCP Configuration
MCP_PORT=3456
MCP_DATABASE=/var/lib/mosaic/mcp/mcp.db
```

Generate secure passwords and keys:

```bash
# Generate secure password
openssl rand -base64 32

# Generate BookStack APP_KEY
echo "base64:$(openssl rand -base64 32)"
```

#### Step 4: Deploy Stack

```bash
# Deploy core infrastructure
docker compose -f docker-compose.mosaicstack.yml up -d

# Monitor deployment
docker compose logs -f
```

### Method 2: Portainer Deployment

#### Step 1: Prepare Host Filesystem

```bash
# Download and run setup script
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/jetrich/mosaic-sdk/main/scripts/setup-host-filesystem.sh)"

# Verify directory structure
ls -la /opt/mosaic/
```

#### Step 2: Create Stack in Portainer

1. Navigate to **Stacks** in Portainer
2. Click **Add Stack** with name: `mosaicstack`
3. Configure repository settings:
   - **Build Method**: Repository
   - **Repository URL**: `https://github.com/jetrich/mosaic-sdk`
   - **Repository Reference**: `main`
   - **Compose Path**: `docker-compose.portainer.yml`

#### Step 3: Configure Environment Variables

Add the following environment variables in Portainer:

```
POSTGRES_PASSWORD=your_secure_postgres_password_here
REDIS_PASSWORD=your_secure_redis_password_here
WOODPECKER_GITEA_CLIENT=your_gitea_oauth_client_id
WOODPECKER_GITEA_SECRET=your_gitea_oauth_client_secret
WOODPECKER_AGENT_SECRET=your_woodpecker_agent_secret
PLANE_SECRET_KEY=your_plane_secret_key_here
GITEA_DISABLE_REGISTRATION=true
GITEA_REQUIRE_SIGNIN=true
WOODPECKER_ADMIN=admin
```

#### Step 4: Deploy and Monitor

1. Click **Deploy the stack**
2. Monitor deployment in Portainer logs
3. Verify all services are healthy

## Service Configuration

### Nginx Proxy Manager Setup

Access NPM at `http://YOUR_SERVER_IP:81` with default credentials:
- Email: `admin@example.com`
- Password: `changeme`

#### SSL Certificate Configuration

1. Navigate to **SSL Certificates**
2. Add Let's Encrypt Certificate:
   - Domain Names: `*.example.com, example.com`
   - Email: `admin@example.com`
   - Agree to Terms of Service
   - Save

#### Proxy Host Configuration

Create proxy hosts for each service with the following settings:

##### Gitea (git.example.com)

**Details Tab:**
- Domain Names: `git.example.com`
- Scheme: `http`
- Forward Hostname/IP: `mosaicstack-gitea` or container IP
- Forward Port: `3000`
- Cache Assets: ✅
- Block Common Exploits: ✅
- Websockets Support: ✅

**SSL Tab:**
- SSL Certificate: Select created certificate
- Force SSL: ✅
- HTTP/2 Support: ✅
- HSTS Enabled: ✅
- HSTS Subdomains: ✅

**Advanced Tab:**
```nginx
# Handle Gitea-specific headers
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Host $host;

# Increase timeouts for Git operations
proxy_connect_timeout 600s;
proxy_send_timeout 600s;
proxy_read_timeout 600s;

# Handle large Git pushes
client_max_body_size 0;
```

##### BookStack (docs.example.com)

**Details Tab:**
- Domain Names: `docs.example.com`
- Forward Hostname/IP: `mosaicstack-bookstack`
- Forward Port: `8080`
- Other settings similar to Gitea

**Advanced Tab:**
```nginx
# Standard headers for BookStack
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

# File upload support
client_max_body_size 100M;
```

##### Woodpecker CI (ci.example.com)

**Details Tab:**
- Domain Names: `ci.example.com`
- Forward Hostname/IP: `mosaicstack-woodpecker-server`
- Forward Port: `8000`
- Websockets Support: ✅ (Required for real-time logs)

**Advanced Tab:**
```nginx
# WebSocket support for build logs
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

# Longer timeouts for build operations
proxy_connect_timeout 300s;
proxy_send_timeout 300s;
proxy_read_timeout 300s;
```

##### Portainer (admin.example.com)

**Details Tab:**
- Domain Names: `admin.example.com`
- Forward Hostname/IP: `portainer`
- Forward Port: `9000`
- Configure similar SSL and security settings

### Initial Service Setup

#### Gitea Configuration

1. Access Gitea at `https://git.example.com`
2. Complete installation wizard:
   - **Database Type**: MySQL
   - **Host**: mariadb:3306
   - **Database Name**: gitea
   - **Username**: gitea
   - **Password**: (from .env)
3. Configure site settings:
   - **Site Title**: MosAIc Git
   - **Repository Root Path**: /data/git/repositories
   - **LFS Root Path**: /data/git/lfs
4. Create admin account

#### BookStack Configuration

1. Access BookStack at `https://docs.example.com`
2. Login with default credentials:
   - Email: `admin@admin.com`
   - Password: `password`
3. **Change admin credentials immediately**
4. Configure email settings if needed

#### Woodpecker CI OAuth Integration

1. In Gitea: Settings → Applications → OAuth2 Applications
2. Create new OAuth2 application:
   - **Application Name**: Woodpecker CI
   - **Redirect URI**: `https://ci.example.com/authorize`
3. Copy Client ID and Secret to environment variables
4. Restart Woodpecker services
5. Access Woodpecker and login via Gitea

#### MosAIc MCP Server

```bash
# Build and deploy MCP server
cd mosaic-mcp
npm install
npm run build

# Start MCP server
docker compose -f ../docker-compose.mosaicstack.yml up -d mcp

# Verify MCP health
curl http://localhost:3456/health
```

## Post-Installation

### Security Hardening

#### Docker Security Configuration

```bash
# Configure Docker daemon security
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true
}
EOF

# Restart Docker
sudo systemctl restart docker
```

#### Fail2Ban Installation

```bash
# Install and configure fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Backup Configuration

#### Automated Backup Script

```bash
# Create backup script
cat > /opt/mosaic/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/mosaic/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup databases
docker exec mosaic-postgres-1 pg_dumpall -U postgres > $BACKUP_DIR/postgres.sql
docker exec mosaic-mariadb-1 mysqldump --all-databases -uroot -p$MARIADB_ROOT_PASSWORD > $BACKUP_DIR/mariadb.sql

# Backup volumes
docker run --rm -v mosaic_gitea_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/gitea_data.tar.gz /data
docker run --rm -v mosaic_bookstack_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/bookstack_data.tar.gz /data

echo "Backup completed: $BACKUP_DIR"
EOF

chmod +x /opt/mosaic/backup.sh

# Schedule daily backups at 2 AM
echo "0 2 * * * /opt/mosaic/backup.sh" | crontab -
```

### Monitoring Setup

#### Health Check Script

```bash
# Create monitoring script
cat > /opt/mosaic/health-check.sh << 'EOF'
services=("gitea" "bookstack" "woodpecker-server" "postgres" "mariadb" "redis" "npm" "mcp")

for service in "${services[@]}"; do
    if docker ps | grep -q "mosaic-$service"; then
        echo "✓ $service is running"
    else
        echo "✗ $service is NOT running"
        # Configure alerting here
    fi
done
EOF

chmod +x /opt/mosaic/health-check.sh
```

## Verification and Testing

### Service Health Checks

```bash
# Check all services status
docker compose -f docker-compose.mosaicstack.yml ps

# Test service endpoints
curl -k https://git.example.com/api/v1/version
curl -k https://docs.example.com/api/docs
curl -k https://ci.example.com/api/info
curl http://localhost:3456/health
```

### Integration Testing

#### Gitea-Woodpecker Integration

1. Create test repository in Gitea
2. Add `.woodpecker.yml` file:
   ```yaml
   pipeline:
     test:
       image: alpine
       commands:
         - echo "Hello from Woodpecker!"
   ```
3. Push changes and verify CI triggers

#### MCP Integration Test

```bash
# Test MCP connection
cd /opt/mosaic/mosaic-sdk
./scripts/test-mcp.js
```

## Troubleshooting

### Common Issues and Solutions

#### Service Won't Start

```bash
# Check service logs
docker logs mosaic-<service>-1

# Verify system resources
df -h          # Check disk space
free -h        # Check memory
docker ps -a   # Check container status
```

#### Database Connection Errors

```bash
# Test database connectivity
docker exec mosaic-postgres-1 pg_isready
docker exec mosaic-mariadb-1 mysqladmin ping -h localhost

# Check database logs
docker logs mosaic-postgres-1
docker logs mosaic-mariadb-1
```

#### SSL Certificate Issues

1. Verify DNS resolution: `nslookup git.example.com`
2. Check NPM logs for Let's Encrypt errors
3. Ensure port 80 is accessible for validation
4. Verify certificate renewal cron job

#### Permission Errors

```bash
# Fix volume permissions
sudo chown -R 1000:1000 /var/lib/mosaic/gitea
sudo chown -R 33:33 /var/lib/mosaic/bookstack
sudo chown -R $USER:$USER /opt/mosaic
```

#### Network Connectivity Issues

```bash
# Verify Docker networks
docker network ls

# Test internal connectivity
docker exec mosaicstack-gitea ping -c 1 postgres

# Connect services to proxy network if needed
docker network connect nginx-proxy-manager_default mosaicstack-gitea
```

### Log Analysis

| Service | Container Logs | Application Logs |
|---------|---------------|------------------|
| Gitea | `docker logs mosaic-gitea-1` | `/var/lib/mosaic/gitea/log/` |
| BookStack | `docker logs mosaic-bookstack-1` | `/var/lib/mosaic/bookstack/logs/` |
| Woodpecker | `docker logs mosaic-woodpecker-server-1` | Inside container |
| PostgreSQL | `docker logs mosaic-postgres-1` | `/var/lib/mosaic/postgres/` |
| MCP Server | `docker logs mosaic-mcp-1` | `/var/lib/mosaic/mcp/logs/` |

## Maintenance

### Regular Maintenance Tasks

#### Daily Tasks

- Check service health status
- Monitor disk usage and system resources
- Review error logs for anomalies
- Verify backup completion

#### Weekly Tasks

- Update Docker images
- Check for security updates
- Review backup integrity
- Clean up old logs and temporary files

#### Monthly Tasks

- Rotate application logs
- Review and update SSL certificates
- Performance analysis and optimization
- Security audit

### Update Procedures

```bash
# Pull latest code changes
cd /opt/mosaic/mosaic-sdk
git pull
git submodule update --recursive

# Update Docker images
docker compose -f docker-compose.mosaicstack.yml pull

# Restart services with minimal downtime
docker compose -f docker-compose.mosaicstack.yml up -d --force-recreate

# Verify all services are healthy
docker compose ps
./health-check.sh
```

### Performance Optimization

#### Database Optimization

```bash
# PostgreSQL maintenance
docker exec mosaic-postgres-1 psql -U postgres -c "VACUUM ANALYZE;"

# Monitor PostgreSQL performance
docker exec mosaic-postgres-1 pg_stat_activity
```

#### Redis Optimization

```bash
# Check Redis memory usage
docker exec mosaic-redis-1 redis-cli INFO memory

# Configure eviction policy if needed
docker exec mosaic-redis-1 redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

#### Container Resource Management

Add resource limits to docker-compose.yml:

```yaml
services:
  gitea:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Security Best Practices

### Access Control

1. **Disable Public Registration**: Configure in Gitea and other services
2. **Use Strong Passwords**: Minimum 16 characters with mixed case and symbols
3. **Enable 2FA**: Configure two-factor authentication where available
4. **Regular Access Reviews**: Audit user permissions monthly

### Network Security

1. **Firewall Rules**: Only expose necessary ports
2. **SSL/TLS**: Force HTTPS for all services
3. **Rate Limiting**: Configure in Nginx Proxy Manager
4. **IP Whitelisting**: For administrative interfaces

### Data Security

1. **Encrypted Backups**: Use GPG for backup encryption
2. **Secure Storage**: Store backups on encrypted volumes
3. **Access Logs**: Monitor and retain access logs
4. **Regular Updates**: Apply security patches promptly

## Advanced Configuration

### High Availability Setup

For production deployments requiring high availability:

1. **Database Replication**: Configure PostgreSQL streaming replication
2. **Redis Sentinel**: Set up Redis Sentinel for failover
3. **Load Balancing**: Use HAProxy or Nginx for service distribution
4. **Shared Storage**: Implement GlusterFS or Ceph for volumes

### Kubernetes Deployment

For enterprise-scale deployments:

```yaml
# Example Kubernetes manifest structure
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mosaic-gitea
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gitea
  template:
    metadata:
      labels:
        app: gitea
    spec:
      containers:
      - name: gitea
        image: gitea/gitea:latest
        ports:
        - containerPort: 3000
```

### Monitoring Integration

Integrate with monitoring solutions:

1. **Prometheus**: Export metrics from all services
2. **Grafana**: Create dashboards for visualization
3. **AlertManager**: Configure alerts for critical events
4. **ELK Stack**: Centralize logs for analysis

## Migration Guide

### From Standalone Tony (2.7.0)

```bash
# Install migration tool
npm install -g @mosaic/migrate

# Run migration
npx @mosaic/migrate from-standalone

# This will:
# 1. Add MCP configuration
# 2. Update Tony to 2.8.0
# 3. Migrate existing projects
# 4. Validate the setup
```

### From Legacy Systems

1. **Export Data**: Backup existing repositories and documentation
2. **Plan Migration**: Map services to MosAIc components
3. **Test Migration**: Run in staging environment first
4. **Execute Migration**: Follow service-specific migration guides
5. **Validate**: Ensure all data and functionality transferred

## Support and Resources

### Documentation

- [Architecture Deep Dive](../../../architecture/overview.md)
- [Component Documentation](../../../services/)
- [API Reference](../../../api/)
- [Troubleshooting Guide](../../../troubleshooting/)

### Community

- GitHub Issues: Report bugs and request features
- Discord Channel: Real-time community support
- Forum: Long-form discussions and guides
- Documentation Wiki: Community-contributed guides

### Professional Support

- Enterprise Support Plans available
- Consulting services for complex deployments
- Training programs for teams
- Custom development services

---

*Last Updated: January 2025 | MosAIc Stack Complete Deployment Guide v2.0.0*

---

---

## Additional Content (Migrated)

# MosAIc Stack Complete Deployment Guide

This guide provides step-by-step instructions for deploying the complete MosAIc Stack from scratch. Follow these instructions carefully to ensure a successful deployment.

#### Minimum Requirements
- **CPU**: 4 cores
- **RAM**: 16 GB
- **Storage**: 100 GB SSD
- **OS**: Ubuntu 22.04 LTS or Debian 12
- **Docker**: 24.0+
- **Docker Compose**: v2.20+

#### Recommended Requirements
- **CPU**: 8+ cores
- **RAM**: 32 GB
- **Storage**: 500 GB NVMe SSD
- **Network**: 1 Gbps connection
- **Backup**: External backup solution

### Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

sudo apt install -y \
  curl \
  wget \
  git \
  htop \
  iotop \
  net-tools \
  ca-certificates \
  gnupg \
  lsb-release

# Install Docker
curl -fsSL https://get.docker.com | bash
sudo usermod -aG docker $USER

sudo apt install docker-compose-plugin

docker --version
docker compose version
```

### Domain Setup

1. **DNS Records**: Configure the following DNS A records:
   ```
   git.example.com     → YOUR_SERVER_IP
   docs.example.com    → YOUR_SERVER_IP
   ci.example.com      → YOUR_SERVER_IP
   admin.example.com   → YOUR_SERVER_IP
   npm.example.com     → YOUR_SERVER_IP
   ```

2. **Firewall Rules**: Open required ports:
   ```bash
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw allow 81/tcp    # NPM Admin
   sudo ufw allow 9000/tcp  # Portainer
   sudo ufw enable
   ```

## Deployment Steps

### Step 1: Clone MosAIc SDK Repository

```bash
sudo mkdir -p /opt/mosaic
sudo chown $USER:$USER /opt/mosaic
cd /opt/mosaic

# Clone repository
git clone https://github.com/jetrich/mosaic-sdk.git
cd mosaic-sdk

# Initialize submodules
git submodule update --init --recursive
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit environment file
nano .env
```

Update the following variables:
```env
DOMAIN_NAME=example.com
ADMIN_EMAIL=admin@example.com

POSTGRES_PASSWORD=<generate-strong-password>
MARIADB_ROOT_PASSWORD=<generate-strong-password>
MARIADB_PASSWORD=<generate-strong-password>
REDIS_PASSWORD=<generate-strong-password>

GITEA_SECRET_KEY=<generate-secret>
BOOKSTACK_APP_KEY=<generate-32-char-key>
WOODPECKER_AGENT_SECRET=<generate-secret>

MCP_PORT=3456
MCP_DATABASE=/var/lib/mosaic/mcp/mcp.db
```

Generate secure passwords:
```bash
# Generate passwords
openssl rand -base64 32

echo "base64:$(openssl rand -base64 32)"
```

### Step 3: Create Directory Structure

```bash
# Create required directories
sudo mkdir -p /var/lib/mosaic/{gitea,bookstack,woodpecker,mcp,portainer}
sudo mkdir -p /var/lib/mosaic/gitea/{git,ssh}
sudo mkdir -p /var/lib/mosaic/bookstack/{uploads,images}
sudo mkdir -p /var/lib/mosaic/woodpecker/{cache,artifacts}
sudo mkdir -p /var/log/mosaic

# Set permissions
sudo chown -R $USER:$USER /var/lib/mosaic
sudo chown -R $USER:$USER /var/log/mosaic
```

### Step 4: Deploy Core Infrastructure

#### 4.1 Deploy Databases and Cache

```bash
# Start database services first
docker compose -f docker-compose.mosaicstack.yml up -d postgres mariadb redis

# Wait for databases to initialize
sleep 30

# Verify databases are running
docker compose ps
docker logs mosaic-postgres-1
docker logs mosaic-mariadb-1
```

#### 4.2 Deploy Nginx Proxy Manager

```bash
# Start Nginx Proxy Manager
docker compose -f docker-compose.mosaicstack.yml up -d npm

# Wait for NPM to start
sleep 20

# Get initial admin credentials
echo "Default NPM Login:"
echo "Email: admin@example.com"
echo "Password: changeme"
```

Access NPM at: http://YOUR_SERVER_IP:81

**Initial NPM Setup**:
1. Login with default credentials
2. Change admin email and password immediately
3. Configure SSL certificates (Let's Encrypt)
4. Add proxy hosts for each service

### Step 5: Deploy Application Services

#### 5.1 Deploy Gitea

```bash
# Start Gitea
docker compose -f docker-compose.mosaicstack.yml up -d gitea

# Monitor logs
docker logs -f mosaic-gitea-1
```

**Gitea Initial Setup**:
1. Access http://YOUR_SERVER_IP:3000
2. Complete installation wizard:
   - Database Type: MySQL
   - Host: mariadb:3306
   - Database Name: gitea
   - Username: gitea
   - Password: (from .env)
3. Configure site settings:
   - Site Title: MosAIc Git
   - Repository Root Path: /data/git/repositories
   - LFS Root Path: /data/git/lfs
4. Create admin account

#### 5.2 Deploy BookStack

```bash
# Start BookStack
docker compose -f docker-compose.mosaicstack.yml up -d bookstack

docker logs -f mosaic-bookstack-1
```

**BookStack Setup**:
1. Access http://YOUR_SERVER_IP:6875
2. Default login:
   - Email: admin@admin.com
   - Password: password
3. Change admin credentials immediately
4. Configure email settings if needed

#### 5.3 Deploy Woodpecker CI

```bash
# Start Woodpecker server
docker compose -f docker-compose.mosaicstack.yml up -d woodpecker-server

# Start Woodpecker agent
docker compose -f docker-compose.mosaicstack.yml up -d woodpecker-agent

docker logs -f mosaic-woodpecker-server-1
docker logs -f mosaic-woodpecker-agent-1
```

**Woodpecker Setup**:
1. Configure Gitea OAuth application:
   - Go to Gitea Settings → Applications
   - Create new OAuth2 Application
   - Application Name: Woodpecker CI
   - Redirect URI: https://ci.example.com/authorize
2. Update .env with OAuth credentials
3. Restart Woodpecker server
4. Access https://ci.example.com and login via Gitea

### Step 6: Deploy MosAIc Components

#### 6.1 Deploy MosAIc MCP Server

```bash
# Build MCP server
cd mosaic-mcp
npm install
npm run build

docker compose -f ../docker-compose.mosaicstack.yml up -d mcp

# Verify MCP is running
curl http://localhost:3456/health
```

#### 6.2 Configure Tony Framework Integration

```bash
# Navigate to Tony directory
cd ../tony

# Install dependencies
npm install

# Build Tony with MCP support
npm run build

# Verify Tony version
cat VERSION  # Should show 2.8.0
```

### Step 7: Deploy Portainer

```bash
# Start Portainer
docker compose -f docker-compose.mosaicstack.yml up -d portainer

# Access Portainer
echo "Access Portainer at: http://YOUR_SERVER_IP:9000"
```

**Portainer Setup**:
1. Create admin user on first access
2. Choose "Local" environment
3. Configure Docker endpoint

### Step 8: Configure SSL/HTTPS

In Nginx Proxy Manager:

1. **Add SSL Certificates**:
   - Go to SSL Certificates
   - Add Let's Encrypt Certificate
   - Domain Names: *.example.com, example.com
   - Email: admin@example.com
   - Agree to ToS

2. **Configure Proxy Hosts**:

   **Gitea**:
   - Domain: git.example.com
   - Forward to: gitea:3000
   - Enable SSL, Force SSL, HTTP/2

   **BookStack**:
   - Domain: docs.example.com
   - Forward to: bookstack:80
   - Enable SSL, Force SSL, HTTP/2

   **Woodpecker**:
   - Domain: ci.example.com
   - Forward to: woodpecker-server:8000
   - Enable SSL, Force SSL, HTTP/2, WebSocket support

   **Portainer**:
   - Domain: admin.example.com
   - Forward to: portainer:9000
   - Enable SSL, Force SSL, HTTP/2

### Step 9: Post-Deployment Configuration

#### 9.1 Configure Backup Script

```bash
cat > /opt/mosaic/backup.sh << 'EOF'
BACKUP_DIR="/backup/mosaic/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

docker exec mosaic-postgres-1 pg_dumpall -U postgres > $BACKUP_DIR/postgres.sql
docker exec mosaic-mariadb-1 mysqldump --all-databases -uroot -p$MARIADB_ROOT_PASSWORD > $BACKUP_DIR/mariadb.sql

docker run --rm -v mosaic_gitea_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/gitea_data.tar.gz /data
docker run --rm -v mosaic_bookstack_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/bookstack_data.tar.gz /data

echo "Backup completed: $BACKUP_DIR"
EOF

chmod +x /opt/mosaic/backup.sh

# Add to crontab
echo "0 2 * * * /opt/mosaic/backup.sh" | crontab -
```

#### 9.2 Configure Monitoring

```bash
cat > /opt/mosaic/health-check.sh << 'EOF'
services=("gitea" "bookstack" "woodpecker-server" "postgres" "mariadb" "redis" "npm" "mcp")

for service in "${services[@]}"; do
    if docker ps | grep -q "mosaic-$service"; then
        echo "✓ $service is running"
    else
        echo "✗ $service is NOT running"
        # Send alert (configure your alerting here)
    fi
done
EOF

chmod +x /opt/mosaic/health-check.sh
```

#### 9.3 Security Hardening

```bash
# Secure Docker daemon
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true
}
EOF

sudo systemctl restart docker

# Set up fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### Step 10: Verification

#### 10.1 Service Health Checks

```bash
# Check all services are running
docker compose -f docker-compose.mosaicstack.yml ps

# Test service connectivity
curl -k https://git.example.com/api/v1/version
curl -k https://docs.example.com/api/docs
curl -k https://ci.example.com/api/info
curl http://localhost:3456/health
```

#### 10.2 Integration Tests

1. **Gitea-Woodpecker Integration**:
   - Create a test repository in Gitea
   - Add .woodpecker.yml file
   - Push changes and verify CI triggers

2. **MCP Integration**:
   ```bash
   # Test MCP connection
   cd /opt/mosaic/mosaic-sdk
   ./scripts/test-mcp.js
   ```

3. **Documentation Access**:
   - Create a test page in BookStack
   - Verify images upload correctly
   - Test search functionality

### Common Issues

1. **Service won't start**:
   ```bash
   # Check logs
   docker logs mosaic-<service>-1
   
   # Check disk space
   df -h
   
   # Check memory
   free -h
   ```

2. **Database connection errors**:
   ```bash
   # Test database connectivity
   docker exec mosaic-postgres-1 pg_isready
   docker exec mosaic-mariadb-1 mysqladmin ping -h localhost
   ```

3. **SSL certificate issues**:
   - Verify DNS is resolving correctly
   - Check NPM logs for Let's Encrypt errors
   - Ensure port 80 is accessible for validation

4. **Permission errors**:
   ```bash
   # Fix volume permissions
   sudo chown -R 1000:1000 /var/lib/mosaic/gitea
   sudo chown -R 33:33 /var/lib/mosaic/bookstack
   ```

### Regular Tasks

1. **Daily**:
   - Check service health
   - Monitor disk usage
   - Review error logs

2. **Weekly**:
   - Update Docker images
   - Check for security updates
   - Review backup integrity

3. **Monthly**:
   - Rotate logs
   - Update SSL certificates
   - Performance review

### Update Procedure

```bash
# Pull latest changes
cd /opt/mosaic/mosaic-sdk
git pull
git submodule update --recursive

docker compose -f docker-compose.mosaicstack.yml pull

docker compose -f docker-compose.mosaicstack.yml up -d --force-recreate
```

## Next Steps

- Review [Service Documentation](../services/) for detailed configuration
- Set up [Monitoring](../operations/monitoring.md)
- Configure [Backups](../operations/backup-strategy.md)
- Implement [Security Hardening](./security-hardening.md)

---

*Last Updated: January 2025 | MosAIc Complete Deployment Guide v1.0.0*
