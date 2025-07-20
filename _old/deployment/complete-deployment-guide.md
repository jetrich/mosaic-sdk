# MosAIc Stack Complete Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the complete MosAIc Stack from scratch. Follow these instructions carefully to ensure a successful deployment.

## Prerequisites

### System Requirements

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

# Install Docker
curl -fsSL https://get.docker.com | bash
sudo usermod -aG docker $USER

# Install Docker Compose v2
sudo apt install docker-compose-plugin

# Verify installations
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
# Create project directory
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

Generate secure passwords:
```bash
# Generate passwords
openssl rand -base64 32

# Generate BookStack APP_KEY
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

# Monitor logs
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

# Monitor logs
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

# Start MCP server
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

# Add to crontab
echo "0 2 * * * /opt/mosaic/backup.sh" | crontab -
```

#### 9.2 Configure Monitoring

```bash
# Create monitoring script
cat > /opt/mosaic/health-check.sh << 'EOF'
#!/bin/bash
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

# Restart Docker
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

## Troubleshooting

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

## Maintenance

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

# Update Docker images
docker compose -f docker-compose.mosaicstack.yml pull

# Restart services with minimal downtime
docker compose -f docker-compose.mosaicstack.yml up -d --force-recreate
```

## Next Steps

- Review [Service Documentation](../services/) for detailed configuration
- Set up [Monitoring](../operations/monitoring.md)
- Configure [Backups](../operations/backup-strategy.md)
- Implement [Security Hardening](./security-hardening.md)

---

*Last Updated: January 2025 | MosAIc Complete Deployment Guide v1.0.0*