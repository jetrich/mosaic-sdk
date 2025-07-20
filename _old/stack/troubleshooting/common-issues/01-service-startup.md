---
title: "Service Startup Issues"
order: 01
category: "common-issues"
tags: ["troubleshooting", "docker", "startup", "debugging"]
last_updated: "2025-01-19"
author: "system"
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
# In docker-compose.yml
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
# In docker-compose.yml
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
# In docker-compose.yml
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
#!/bin/bash
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