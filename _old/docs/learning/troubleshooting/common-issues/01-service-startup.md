---
title: "01 Service Startup"
order: 01
category: "common-issues"
tags: ["common-issues", "troubleshooting", "documentation"]
last_updated: "2025-01-19"
author: "migration"
version: "1.0"
status: "published"
---
# Service Startup Issues

This guide helps diagnose and resolve common service startup problems in the MosAIc Stack.

## Quick Diagnostics

Run this diagnostic script first:
```bash
#!/bin/bash
echo "=== MosAIc Stack Diagnostics ==="
echo "Docker version: $(docker --version)"
echo "Compose version: $(docker compose version)"
echo ""
echo "=== Service Status ==="
docker compose ps
echo ""
echo "=== Failed Services ==="
docker compose ps | grep -E "(Exit|Restarting)"
echo ""
echo "=== Recent Logs ==="
docker compose logs --tail=20 | grep -E "(ERROR|FATAL|Failed)"
```

## Common Startup Issues

### 1. Port Conflicts

**Symptoms:**
- Error: `bind: address already in use`
- Service fails to start
- Container exits immediately

**Diagnosis:**
```bash
# Check what's using the port
sudo lsof -i :3000
sudo netstat -tulpn | grep :3000

# Check all MosAIc ports
for port in 3000 2222 6875 8000 5432 3306 6379; do
  echo "Port $port:"
  sudo lsof -i :$port
done
```

**Solutions:**

1. **Kill conflicting process:**
```bash
# Find and kill process
sudo kill -9 $(sudo lsof -t -i:3000)
```

2. **Change service port:**
```yaml
# In docker-compose.yml
services:
  gitea:
    ports:
      - "3001:3000"  # Changed from 3000:3000
```

3. **Use different interface:**
```yaml
services:
  gitea:
    ports:
      - "127.0.0.1:3000:3000"  # Bind to localhost only
```

### 2. Database Connection Failures

**Symptoms:**
- Error: `connection refused`
- Error: `FATAL: password authentication failed`
- Services keep restarting

**Diagnosis:**
```bash
# Check database containers
docker compose ps postgres mariadb

# Test PostgreSQL connection
docker exec -it mosaic-postgres pg_isready

# Test MariaDB connection
docker exec -it mosaic-mariadb mysqladmin ping -h localhost

# Check database logs
docker compose logs postgres --tail=50
docker compose logs mariadb --tail=50
```

**Solutions:**

1. **Wait for database initialization:**
```bash
# Add health check to docker-compose.yml
services:
  postgres:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  gitea:
    depends_on:
      postgres:
        condition: service_healthy
```

2. **Fix authentication:**
```bash
# Verify environment variables
docker compose exec gitea env | grep -E "(DB_|DATABASE_)"

# Reset database password
docker compose exec postgres psql -U postgres -c "ALTER USER postgres PASSWORD 'newpassword';"
```

3. **Network connectivity:**
```bash
# Test network between containers
docker compose exec gitea ping postgres
docker compose exec gitea nslookup postgres
```

### 3. Permission Denied Errors

**Symptoms:**
- Error: `permission denied`
- Cannot write to directories
- Files owned by wrong user

**Diagnosis:**
```bash
# Check volume permissions
ls -la /opt/mosaic/

# Check container user
docker compose exec gitea id

# Check file ownership inside container
docker compose exec gitea ls -la /data/
```

**Solutions:**

1. **Fix directory permissions:**
```bash
# Set correct ownership
sudo chown -R 1000:1000 /opt/mosaic/gitea
sudo chown -R 999:999 /opt/mosaic/postgres
sudo chown -R 1000:1000 /opt/mosaic/bookstack

# Set correct permissions
sudo chmod -R 755 /opt/mosaic/
```

2. **Use correct UID/GID:**
```yaml
services:
  gitea:
    environment:
      - USER_UID=1000
      - USER_GID=1000
```

3. **Run init container:**
```yaml
services:
  gitea:
    volumes:
      - gitea_data:/data
    user: "1000:1000"
```

### 4. Memory/Resource Issues

**Symptoms:**
- Error: `Cannot allocate memory`
- Container killed (exit code 137)
- System becomes unresponsive

**Diagnosis:**
```bash
# Check system resources
free -h
df -h
top

# Check Docker resources
docker system df
docker stats --no-stream

# Check container limits
docker inspect mosaic-postgres | grep -E "(Memory|Cpu)"
```

**Solutions:**

1. **Increase system resources:**
```bash
# Add swap space
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

2. **Set resource limits:**
```yaml
services:
  postgres:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

3. **Clean up Docker:**
```bash
# Remove unused resources
docker system prune -a
docker volume prune
docker image prune -a
```

### 5. SSL/TLS Certificate Issues

**Symptoms:**
- Error: `SSL certificate problem`
- Cannot access HTTPS URLs
- Traefik shows certificate errors

**Diagnosis:**
```bash
# Check Traefik logs
docker compose logs traefik | grep -i "certificate"

# Check ACME configuration
docker exec mosaic-traefik cat /letsencrypt/acme.json | jq

# Test certificate
curl -v https://git.your-domain.com
```

**Solutions:**

1. **Fix ACME email:**
```yaml
# In traefik.yml
certificatesResolvers:
  letsencrypt:
    acme:
      email: valid-email@domain.com  # Must be valid
```

2. **Use staging for testing:**
```yaml
certificatesResolvers:
  letsencrypt:
    acme:
      caServer: https://acme-staging-v02.api.letsencrypt.org/directory
```

3. **Manual certificate:**
```bash
# Place certificates in
mkdir -p /opt/mosaic/traefik/certs
cp fullchain.pem /opt/mosaic/traefik/certs/
cp privkey.pem /opt/mosaic/traefik/certs/
```

### 6. Network Issues

**Symptoms:**
- Services cannot communicate
- Error: `no such host`
- Intermittent connection failures

**Diagnosis:**
```bash
# List networks
docker network ls

# Inspect network
docker network inspect mosaic-proxy

# Test connectivity
docker compose exec gitea ping postgres
docker compose exec gitea curl http://bookstack:80
```

**Solutions:**

1. **Create missing networks:**
```bash
docker network create mosaic-proxy
docker network create mosaic-db
docker network create mosaic-cache
```

2. **Fix network configuration:**
```yaml
services:
  gitea:
    networks:
      - mosaic-proxy
      - mosaic-db
      - mosaic-cache

networks:
  mosaic-proxy:
    external: true
  mosaic-db:
    external: true
```

3. **Reset Docker networking:**
```bash
# Warning: This affects all containers
docker compose down
docker network prune
docker compose up -d
```

## Service-Specific Issues

### Gitea Won't Start

```bash
# Check Gitea logs
docker compose logs gitea --tail=100

# Common fixes:
# 1. Database not ready
docker compose restart gitea

# 2. Invalid configuration
docker compose exec gitea gitea doctor

# 3. SSH key issues
docker compose exec gitea ssh-keygen -A
```

### BookStack Shows Blank Page

```bash
# Generate APP_KEY if missing
docker compose exec bookstack php artisan key:generate

# Clear cache
docker compose exec bookstack php artisan cache:clear
docker compose exec bookstack php artisan config:clear

# Run migrations
docker compose exec bookstack php artisan migrate --force
```

### Woodpecker Agent Won't Connect

```bash
# Verify agent secret matches
docker compose exec woodpecker-server printenv | grep AGENT_SECRET
docker compose exec woodpecker-agent printenv | grep AGENT_SECRET

# Check server accessibility
docker compose exec woodpecker-agent curl http://woodpecker-server:8000/api/info
```

## Recovery Procedures

### Complete Reset

```bash
# WARNING: This will delete all data!

# Stop all services
docker compose down

# Remove volumes (data loss!)
docker volume rm $(docker volume ls -q | grep mosaic)

# Remove networks
docker network rm mosaic-proxy mosaic-db mosaic-cache

# Clean system
docker system prune -a

# Recreate from scratch
./scripts/setup-mosaic-stack.sh
```

### Selective Service Reset

```bash
# Reset single service
docker compose stop gitea
docker compose rm -f gitea
docker volume rm mosaic_gitea_data
docker compose up -d gitea
```

## Prevention Tips

1. **Always use health checks:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

2. **Set proper dependencies:**
```yaml
depends_on:
  postgres:
    condition: service_healthy
```

3. **Use restart policies:**
```yaml
restart: unless-stopped
# or
deploy:
  restart_policy:
    condition: on-failure
    delay: 5s
    max_attempts: 3
```

4. **Monitor resources:**
```bash
# Add monitoring
docker run -d \
  --name=cadvisor \
  --volume=/var/run/docker.sock:/var/run/docker.sock:ro \
  --volume=/sys:/sys:ro \
  --volume=/var/lib/docker/:/var/lib/docker:ro \
  --publish=8080:8080 \
  gcr.io/cadvisor/cadvisor:latest
```

---

For more troubleshooting guides, see:
- [Performance Issues](./02-performance.md)
- [Database Problems](./03-database.md)
- [Network Troubleshooting](./04-networking.md)

---

---

## Additional Content (Migrated)

# MosAIc Stack Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered when running the MosAIc Stack. Each issue includes symptoms, diagnosis steps, and resolution procedures.

## Quick Diagnostic Commands

```bash
# Check all services status
docker compose -f docker-compose.mosaicstack.yml ps

# View logs for a specific service
docker logs mosaic-<service>-1 --tail 100

df -h && free -h && docker system df

# Test service connectivity
curl -f http://localhost:3456/health  # MCP
curl -f https://git.example.com/api/healthz  # Gitea
```

## Common Issues by Service

### Nginx Proxy Manager

#### Issue: 502 Bad Gateway

**Symptoms:**
- Browser shows "502 Bad Gateway"
- Services are unreachable through proxy
- Direct access to services works

**Diagnosis:**
```bash
# Check NPM logs
docker logs mosaic-npm-1 --tail 50

# Verify upstream services
docker ps | grep mosaic

# Test direct connection
curl http://gitea:3000  # From inside NPM container
```

**Resolution:**
1. Verify service is running:
   ```bash
   docker compose restart <service>
   ```

2. Check proxy configuration:
   ```nginx
   # Correct format
   server {
       listen 80;
       server_name git.example.com;
       location / {
           proxy_pass http://gitea:3000;  # Use service name, not IP
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

3. Ensure services are on same network:
   ```bash
   docker network inspect mosaic_net
   ```

#### Issue: SSL Certificate Errors

**Symptoms:**
- "Certificate not trusted" warnings
- HTTPS not working
- Let's Encrypt validation fails

**Diagnosis:**
```bash
# Check certificate status
docker exec mosaic-npm-1 certbot certificates

# View NPM SSL logs
docker logs mosaic-npm-1 | grep -i ssl

# Test DNS resolution
nslookup git.example.com
```

**Resolution:**
1. Verify DNS points to server:
   ```bash
   dig git.example.com +short
   ```

2. Ensure port 80 is accessible for validation:
   ```bash
   sudo ufw allow 80/tcp
   ```

3. Force certificate renewal:
   ```bash
   docker exec mosaic-npm-1 certbot renew --force-renewal
   ```

### Gitea

#### Issue: Cannot Push to Repository

**Symptoms:**
- Git push fails with authentication error
- "Permission denied" errors
- Push hangs indefinitely

**Diagnosis:**
```bash
docker logs mosaic-gitea-1 | grep -i error

# Verify SSH key
ssh -T git@git.example.com

# Check repository permissions
docker exec mosaic-gitea-1 gitea admin user list
```

**Resolution:**
1. Verify SSH key is added to account:
   ```bash
   # Generate new key if needed
   ssh-keygen -t ed25519 -C "your_email@example.com"
   
   # Add to Gitea account via web UI
   cat ~/.ssh/id_ed25519.pub
   ```

2. Check repository URL format:
   ```bash
   # Correct formats
   git@git.example.com:username/repo.git  # SSH
   https://git.example.com/username/repo.git  # HTTPS
   ```

3. Reset git credentials:
   ```bash
   git config --global --unset credential.helper
   git push -u origin main  # Re-enter credentials
   ```

#### Issue: Gitea Web Interface Slow

**Symptoms:**
- Pages load slowly
- Timeouts when viewing large repositories
- Database query timeouts

**Diagnosis:**
```bash
# Check database performance
docker exec mosaic-mariadb-1 mysql -uroot -p$MARIADB_ROOT_PASSWORD -e "SHOW PROCESSLIST;"

# Monitor Gitea resource usage
docker stats mosaic-gitea-1

# Check for large repositories
docker exec mosaic-gitea-1 du -sh /data/git/repositories/* | sort -hr | head -10
```

**Resolution:**
1. Optimize database:
   ```sql
   OPTIMIZE TABLE repository;
   OPTIMIZE TABLE issue;
   ANALYZE TABLE repository;
   ```

2. Enable caching:
   ```ini
   # In app.ini
   [cache]
   ENABLED = true
   ADAPTER = redis
   HOST = redis:6379
   ```

3. Increase resource limits:
   ```yaml
   # docker-compose.override.yml
   services:
     gitea:
       deploy:
         resources:
           limits:
             memory: 4G
   ```

### BookStack

#### Issue: Images Not Loading

**Symptoms:**
- Broken image icons
- Upload failures
- Missing attachments

**Diagnosis:**
```bash
# Check file permissions
docker exec mosaic-bookstack-1 ls -la /var/www/html/public/uploads

# View upload errors
docker logs mosaic-bookstack-1 | grep -i upload

# Verify storage volume
docker volume inspect mosaic_bookstack_data
```

**Resolution:**
1. Fix permissions:
   ```bash
   docker exec mosaic-bookstack-1 chown -R www-data:www-data /var/www/html/public/uploads
   docker exec mosaic-bookstack-1 chmod -R 755 /var/www/html/public/uploads
   ```

2. Check APP_URL setting:
   ```env
   # Must match actual URL
   APP_URL=https://docs.example.com
   ```

3. Clear cache:
   ```bash
   docker exec mosaic-bookstack-1 php artisan cache:clear
   docker exec mosaic-bookstack-1 php artisan view:clear
   ```

#### Issue: Search Not Working

**Symptoms:**
- Search returns no results
- Search index errors
- Slow search performance

**Resolution:**
1. Rebuild search index:
   ```bash
   docker exec mosaic-bookstack-1 php artisan bookstack:regenerate-search
   ```

2. Check database encoding:
   ```sql
   ALTER DATABASE bookstack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

### Woodpecker CI

#### Issue: Builds Not Starting

**Symptoms:**
- Builds stay in "pending" state
- No agent picks up jobs
- Webhook received but nothing happens

**Diagnosis:**
```bash
# Check agent status
docker logs mosaic-woodpecker-agent-1

# Verify agent registration
docker logs mosaic-woodpecker-server-1 | grep agent

# Check webhook delivery
# In Gitea: Settings -> Webhooks -> Recent Deliveries
```

**Resolution:**
1. Restart agent with correct secret:
   ```bash
   # Ensure WOODPECKER_AGENT_SECRET matches server
   docker compose restart woodpecker-agent
   ```

2. Verify Docker socket access:
   ```yaml
   # docker-compose.yml
   woodpecker-agent:
     volumes:
       - /var/run/docker.sock:/var/run/docker.sock
   ```

3. Check repository is activated in Woodpecker UI

#### Issue: Pipeline Syntax Errors

**Symptoms:**
- Build fails immediately
- "Invalid pipeline configuration" error
- Yaml parsing errors

**Resolution:**
1. Validate YAML syntax:
   ```bash
   # Online validator or
   yamllint .woodpecker.yml
   ```

2. Common fixes:
   ```yaml
   # Correct format
   steps:
     build:
       image: node:18
       commands:
         - npm install
         - npm test
   ```

3. Check Woodpecker version compatibility

### PostgreSQL

#### Issue: Connection Limit Reached

**Symptoms:**
- "too many connections" error
- Services can't connect to database
- Intermittent connection failures

**Diagnosis:**
```bash
# Check current connections
docker exec mosaic-postgres-1 psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# View connection details
docker exec mosaic-postgres-1 psql -U postgres -c "SELECT pid, usename, application_name, state FROM pg_stat_activity;"
```

**Resolution:**
1. Kill idle connections:
   ```sql
   SELECT pg_terminate_backend(pid) 
   FROM pg_stat_activity 
   WHERE state = 'idle' 
   AND state_change < current_timestamp - interval '1 hour';
   ```

2. Increase connection limit:
   ```sql
   ALTER SYSTEM SET max_connections = 200;
   -- Restart required
   ```

3. Configure connection pooling:
   ```yaml
   # For Woodpecker
   WOODPECKER_DATABASE_DATASOURCE: postgres://user:pass@postgres/woodpecker?sslmode=disable&max_conns=20
   ```

#### Issue: Disk Space Full

**Symptoms:**
- "could not extend file" errors
- Database stops accepting writes
- Services fail to start

**Resolution:**
1. Check disk usage:
   ```bash
   df -h
   docker system df
   ```

2. Clean up old data:
   ```sql
   -- In PostgreSQL
   VACUUM FULL;
   
   -- Remove old Woodpecker builds
   DELETE FROM builds WHERE created < NOW() - INTERVAL '30 days';
   ```

3. Prune Docker resources:
   ```bash
   docker system prune -a --volumes
   ```

### MariaDB

#### Issue: Table Corruption

**Symptoms:**
- "Table is marked as crashed" errors
- Data inconsistencies
- Random query failures

**Diagnosis:**
```bash
# Check table status
docker exec mosaic-mariadb-1 mysqlcheck -u root -p$MARIADB_ROOT_PASSWORD --all-databases
```

**Resolution:**
1. Repair tables:
   ```bash
   # Repair specific table
   docker exec mosaic-mariadb-1 mysqlcheck -u root -p$MARIADB_ROOT_PASSWORD --repair gitea repository
   
   # Repair all tables
   docker exec mosaic-mariadb-1 mysqlcheck -u root -p$MARIADB_ROOT_PASSWORD --repair --all-databases
   ```

2. If repair fails, restore from backup:
   ```bash
   /opt/mosaic/scripts/restore.sh /backup/mosaic/latest
   ```

### Redis

#### Issue: Memory Limit Exceeded

**Symptoms:**
- "OOM command not allowed" errors
- Cache misses increase
- Performance degradation

**Resolution:**
1. Check memory usage:
   ```bash
   docker exec mosaic-redis-1 redis-cli INFO memory
   ```

2. Configure eviction policy:
   ```bash
   docker exec mosaic-redis-1 redis-cli CONFIG SET maxmemory-policy allkeys-lru
   ```

3. Increase memory limit:
   ```yaml
   # docker-compose.override.yml
   services:
     redis:
       command: redis-server --maxmemory 2gb
   ```

### MosAIc MCP

#### Issue: MCP Server Not Responding

**Symptoms:**
- Health check fails
- Cannot connect on port 3456
- Tony Framework can't reach MCP

**Diagnosis:**
```bash
# Check if MCP is running
docker ps | grep mcp

# View MCP logs
docker logs mosaic-mcp-1 --tail 100

curl -v http://localhost:3456/health
```

**Resolution:**
1. Check port binding:
   ```yaml
   # docker-compose.yml
   mcp:
     ports:
       - "3456:3456"
   ```

2. Verify database file:
   ```bash
   ls -la /var/lib/mosaic/mcp/mcp.db
   ```

3. Restart with clean state:
   ```bash
   docker compose stop mcp
   rm -f /var/lib/mosaic/mcp/mcp.db
   docker compose up -d mcp
   ```

## System-Wide Issues

### Issue: Docker Daemon Unresponsive

**Symptoms:**
- Docker commands hang
- Containers stop responding
- Cannot start/stop services

**Resolution:**
1. Check Docker status:
   ```bash
   sudo systemctl status docker
   sudo journalctl -u docker --since "1 hour ago"
   ```

2. Restart Docker daemon:
   ```bash
   sudo systemctl restart docker
   ```

3. If daemon won't stop:
   ```bash
   sudo killall -9 dockerd
   sudo systemctl start docker
   ```

### Issue: Disk I/O Performance

**Symptoms:**
- Slow response times
- High iowait in top
- Database queries timeout

**Diagnosis:**
```bash
# Check I/O statistics
iostat -x 1 10

# Find heavy I/O processes
iotop -o

# Check for disk errors
dmesg | grep -i error
```

**Resolution:**
1. Move to SSD storage
2. Enable write caching:
   ```bash
   hdparm -W1 /dev/sda
   ```
3. Optimize mount options:
   ```fstab
   /dev/sda1 /var/lib/docker ext4 noatime,nodiratime 0 0
   ```

### Issue: Memory Exhaustion

**Symptoms:**
- OOM killer terminates containers
- System becomes unresponsive
- Random service crashes

**Resolution:**
1. Add swap space:
   ```bash
   sudo fallocate -l 8G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

2. Configure memory limits:
   ```yaml
   # docker-compose.override.yml
   services:
     gitea:
       deploy:
         resources:
           limits:
             memory: 2G
   ```

3. Tune kernel parameters:
   ```bash
   echo "vm.overcommit_memory = 1" >> /etc/sysctl.conf
   sysctl -p
   ```

## Debugging Tools

### Container Debugging

```bash
# Enter container shell
docker exec -it mosaic-<service>-1 /bin/bash

# View real-time logs
docker logs -f mosaic-<service>-1

# Inspect container configuration
docker inspect mosaic-<service>-1

# Copy files from container
docker cp mosaic-<service>-1:/path/to/file ./local-file
```

### Network Debugging

```bash
# Test connectivity between containers
docker exec mosaic-gitea-1 ping mariadb

# View network configuration
docker network inspect mosaic_net

# Check port bindings
netstat -tlnp | grep docker

# Trace network path
docker exec mosaic-npm-1 traceroute gitea
```

### Performance Debugging

```bash
# Monitor container resources
docker stats

# Profile specific container
docker exec mosaic-<service>-1 top

# Check disk I/O
docker exec mosaic-<service>-1 iostat -x 1

# Analyze database queries
docker exec mosaic-postgres-1 psql -U postgres -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

## Prevention Strategies

### Regular Maintenance

1. **Weekly Tasks:**
   - Review logs for errors
   - Check disk space
   - Update containers
   - Verify backups

2. **Monthly Tasks:**
   - Performance review
   - Security updates
   - Database optimization
   - Certificate renewal

### Monitoring Setup

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'docker'
    static_configs:
      - targets: ['localhost:9323']
  
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
  
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']
```

### Alerting Rules

```yaml
# alerts.yml
groups:
  - name: mosaic_alerts
    rules:
      - alert: ContainerDown
        expr: up{job="docker"} == 0
        for: 5m
        annotations:
          summary: "Container {{ $labels.name }} is down"
      
      - alert: DiskSpaceLow
        expr: node_filesystem_free_bytes / node_filesystem_size_bytes < 0.1
        for: 5m
        annotations:
          summary: "Less than 10% disk space remaining"
      
      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) > 0.9
        for: 5m
        annotations:
          summary: "Memory usage above 90%"
```

## Getting Help

### Collect Diagnostic Information

```bash
# diagnostic-report.sh

REPORT_DIR="mosaic-diagnostic-$(date +%Y%m%d-%H%M%S)"
mkdir -p $REPORT_DIR

# System information
uname -a > $REPORT_DIR/system.txt
df -h >> $REPORT_DIR/system.txt
free -h >> $REPORT_DIR/system.txt

# Docker information
docker version > $REPORT_DIR/docker.txt
docker compose version >> $REPORT_DIR/docker.txt
docker ps -a >> $REPORT_DIR/docker.txt
docker compose -f docker-compose.mosaicstack.yml ps >> $REPORT_DIR/docker.txt

# Service logs (last 1000 lines)
for service in npm gitea bookstack woodpecker-server postgres mariadb redis mcp; do
    docker logs mosaic-${service}-1 --tail 1000 > $REPORT_DIR/${service}.log 2>&1
done

# Configuration files
cp .env $REPORT_DIR/
cp docker-compose.*.yml $REPORT_DIR/

# Create archive
tar -czf $REPORT_DIR.tar.gz $REPORT_DIR/
echo "Diagnostic report created: $REPORT_DIR.tar.gz"
```

### Community Resources

- **GitHub Issues**: https://github.com/jetrich/mosaic-sdk/issues
- **Documentation**: https://docs.mosaic.example.com
- **Community Forum**: https://forum.mosaic.example.com
- **Discord**: https://discord.gg/mosaic

### Commercial Support

For production deployments, consider:
- Professional support contracts
- Managed hosting services
- Consulting services
- Training programs

---

*Last Updated: January 2025 | MosAIc Troubleshooting Guide v1.0.0*
