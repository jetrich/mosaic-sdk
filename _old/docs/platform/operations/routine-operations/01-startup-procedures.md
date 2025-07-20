---
title: "Service Startup Procedures"
order: 01
category: "routine-operations"
tags: ["operations", "startup", "deployment", "services"]
---

# Service Startup Procedures

Comprehensive procedures for starting MosAIc Stack services in the correct order with proper health verification.

## Complete Stack Startup

### Prerequisites Checklist

Before initiating startup, verify:

- [ ] Host system is running and healthy
- [ ] Docker daemon is active (`systemctl status docker`)
- [ ] Network connectivity verified
- [ ] Storage volumes mounted (`df -h /var/lib/mosaic`)
- [ ] Environment variables loaded (`source .env`)
- [ ] No conflicting services on required ports

### Startup Sequence Overview

Services must be started in dependency order to ensure proper initialization:

1. **Infrastructure Services** (5 minutes)
   - PostgreSQL, MariaDB, Redis
2. **Core Platform Services** (10 minutes)
   - Gitea, Plane, BookStack
3. **CI/CD Services** (5 minutes)
   - Woodpecker Server and Agents
4. **Monitoring Stack** (5 minutes)
   - Prometheus, Grafana, Loki
5. **MosAIc Services** (3 minutes)
   - MCP Server, MosAIc Core

### Detailed Startup Procedures

#### Phase 1: Infrastructure Services

Start the database and cache services first as they are dependencies for all other services:

```bash
#!/bin/bash
# Start infrastructure services

cd /home/jwoltje/src/mosaic-sdk

# Start databases and cache
echo "Starting infrastructure services..."
docker compose -f deployment/docker-compose.production.yml up -d postgres mariadb redis

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until docker exec mosaic-postgres psql -U postgres -c "SELECT 1" >/dev/null 2>&1; do
    echo -n "."
    sleep 2
done
echo " Ready!"

# Wait for MariaDB to be ready
echo "Waiting for MariaDB..."
until docker exec mosaic-mariadb mysql -u root -p${MARIADB_ROOT_PASSWORD} -e "SELECT 1" >/dev/null 2>&1; do
    echo -n "."
    sleep 2
done
echo " Ready!"

# Verify Redis
echo "Verifying Redis..."
docker exec mosaic-redis redis-cli ping
```

#### Phase 2: Core Platform Services

Once databases are ready, start the main application services:

```bash
# Start core platform services

# Start Gitea
echo "Starting Gitea..."
docker compose -f deployment/gitea/docker-compose.yml up -d

# Wait for Gitea to be fully initialized
until curl -s http://localhost:3000/api/healthz | grep -q "ok"; do
    echo "Waiting for Gitea initialization..."
    sleep 5
done

# Start Plane services
echo "Starting Plane..."
docker compose -f deployment/services/plane/docker-compose.yml up -d

# Start BookStack
echo "Starting BookStack..."
docker compose -f deployment/docker-compose.bookstack-mariadb.yml up -d

# Verify all services are running
docker ps --filter "status=running" --filter "name=mosaic-*"
```

#### Phase 3: CI/CD Services

Start the CI/CD pipeline components:

```bash
# Start CI/CD services

# Start Woodpecker server first
echo "Starting Woodpecker server..."
docker compose -f deployment/services/woodpecker/docker-compose.yml up -d woodpecker-server

# Wait for server to be ready before starting agents
echo "Waiting for Woodpecker server..."
sleep 20

# Start Woodpecker agents
echo "Starting Woodpecker agents..."
docker compose -f deployment/services/woodpecker/docker-compose.yml up -d woodpecker-agent

# Verify Woodpecker is operational
curl -s http://localhost:8000/healthz
```

#### Phase 4: Monitoring Stack

Start monitoring and observability services:

```bash
# Start monitoring services

echo "Starting monitoring stack..."
docker compose -f deployment/docker-compose.monitoring.yml up -d

# Wait for Prometheus to start collecting metrics
sleep 10

# Verify Prometheus is operational
if curl -s http://localhost:9090/api/v1/query?query=up | grep -q "success"; then
    echo "Prometheus is collecting metrics"
else
    echo "Warning: Prometheus may not be collecting metrics properly"
fi

# Check Grafana
curl -s http://localhost:3001/api/health
```

#### Phase 5: MosAIc Services

Finally, start the MosAIc-specific services:

```bash
# Start MosAIc services

# Start MCP server
echo "Starting MCP server..."
cd mosaic-mcp
npm run start:production &
MCP_PID=$!

# Wait for MCP to be ready
until curl -s http://localhost:3456/health | grep -q "ok"; do
    echo "Waiting for MCP server..."
    sleep 5
done

# Start MosAIc core
echo "Starting MosAIc core..."
cd ../worktrees/mosaic-worktrees/core-orchestration
npm run start &
CORE_PID=$!

# Save PIDs for later shutdown
echo $MCP_PID > /var/run/mosaic-mcp.pid
echo $CORE_PID > /var/run/mosaic-core.pid
```

### Post-Startup Verification

After all services are started, run comprehensive health checks:

```bash
# Comprehensive health check script

echo "=== MosAIc Stack Health Check ==="
echo "Running at: $(date)"
echo

# Check Docker containers
echo "Docker Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.State}}" | grep mosaic

# Check service endpoints
echo -e "\nService Endpoint Checks:"
endpoints=(
    "PostgreSQL:5432"
    "MariaDB:3306" 
    "Redis:6379"
    "Gitea:3000"
    "Plane:8000"
    "BookStack:80"
    "Prometheus:9090"
    "Grafana:3001"
    "MCP:3456"
)

for endpoint in "${endpoints[@]}"; do
    service="${endpoint%%:*}"
    port="${endpoint##*:}"
    if nc -z localhost $port 2>/dev/null; then
        echo "✓ $service is accessible on port $port"
    else
        echo "✗ $service is NOT accessible on port $port"
    fi
done

# Check disk space
echo -e "\nDisk Space:"
df -h | grep -E "(^Filesystem|/var/lib/mosaic)"

# Check memory usage
echo -e "\nMemory Usage:"
free -h
```

## Individual Service Startup

### Database Services

#### PostgreSQL
```bash
# Start PostgreSQL
docker compose -f deployment/docker-compose.production.yml up -d postgres

# Verify startup
docker exec mosaic-postgres pg_isready -U postgres
```

#### MariaDB
```bash
# Start MariaDB
docker compose -f deployment/docker-compose.production.yml up -d mariadb

docker exec mosaic-mariadb mysqladmin ping -u root -p${MARIADB_ROOT_PASSWORD}
```

#### Redis
```bash
# Start Redis
docker compose -f deployment/docker-compose.production.yml up -d redis

docker exec mosaic-redis redis-cli ping
```

### Application Services

#### Gitea
```bash
docker compose -f deployment/gitea/docker-compose.yml up -d

# Check health endpoint
curl -s http://localhost:3000/api/healthz
```

#### Plane
```bash
# Run database migrations first
docker compose -f deployment/services/plane/docker-compose.yml run --rm api python manage.py migrate

# Start all Plane services
docker compose -f deployment/services/plane/docker-compose.yml up -d

# Verify API is responding
curl -s http://localhost:8000/api/health
```

#### BookStack
```bash
# Run migrations if needed
docker compose -f deployment/docker-compose.bookstack-mariadb.yml run --rm bookstack php artisan migrate --force

docker compose -f deployment/docker-compose.bookstack-mariadb.yml up -d bookstack

# Check application
curl -s http://localhost:80 | grep -q "BookStack"
```

## Troubleshooting Startup Issues

### Container Won't Start

If a container fails to start:

```bash
# Check container logs
docker logs <container-name> --tail 50

# Check system resources
docker system df
df -h
free -h

# Check port conflicts
netstat -tulpn | grep <port>
lsof -i :<port>

# Inspect container configuration
docker inspect <container-name>
```

### Database Connection Issues

For database connection problems:

```bash
# Test database connectivity from host
docker exec <db-container> <db-cli> -h localhost -u <user> -p

# Check environment variables
docker exec <app-container> env | grep _PASSWORD

# Verify network connectivity
docker network inspect mosaic_default
docker exec <app-container> ping <db-container>
```

### Service Health Check Failures

When health checks fail:

```bash
# Check health status details
docker inspect <container> | jq '.[0].State.Health'

# Run health check manually
docker exec <container> /health.sh

# View recent health check logs
docker inspect <container> | jq '.[0].State.Health.Log'

# Restart with verbose logging
docker compose -f <compose-file> up <service>
```

## Emergency Startup Procedures

### Minimal Services (Critical Only)

For emergency situations, start only critical services:

```bash
# Emergency minimal startup

# Start only databases and Gitea
docker compose -f deployment/docker-compose.production.yml up -d postgres redis
docker compose -f deployment/gitea/docker-compose.yml up -d

echo "Minimal services started. Access Gitea at http://localhost:3000"
```

### Recovery Mode Startup

Start services in maintenance mode:

```bash
# Start in maintenance mode

export MAINTENANCE_MODE=true
export READ_ONLY=false

# Start infrastructure
docker compose -f deployment/docker-compose.production.yml up -d

# Services will start in maintenance mode
echo "Services started in maintenance mode"
```

### Safe Mode (Read-Only)

Start services in read-only mode for investigation:

```bash
# Start in read-only mode

export READ_ONLY=true
export MAINTENANCE_MODE=false

# Start with read-only flags
docker compose -f deployment/docker-compose.production.yml up -d

echo "Services started in read-only mode"
```

## Startup Best Practices

1. **Always verify prerequisites** before starting services
2. **Follow the dependency order** to avoid initialization failures
3. **Monitor logs during startup** to catch issues early
4. **Run health checks** after each phase
5. **Document any deviations** from standard procedures
6. **Keep startup scripts updated** with configuration changes
7. **Test startup procedures** regularly in non-production environments
8. **Have rollback plans** ready in case of startup failures

## Automated Startup Script

Complete automated startup script with error handling:

```bash
# /opt/mosaic/scripts/startup-all.sh

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/mosaic/startup-$(date +%Y%m%d-%H%M%S).log"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handler
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Start services
log "Starting MosAIc Stack startup sequence..."

# Phase 1: Infrastructure
log "Phase 1: Starting infrastructure services..."
cd "$SCRIPT_DIR/.."
docker compose -f deployment/docker-compose.production.yml up -d postgres mariadb redis || error_exit "Failed to start infrastructure"

# Wait for databases
log "Waiting for databases to be ready..."
sleep 30

# Continue with remaining phases...
# [Rest of startup sequence]

log "MosAIc Stack startup completed successfully!"
```

---

Related documentation:
- [Shutdown Procedures](./02-shutdown-procedures.md)
- [Health Monitoring](../monitoring/health-checks.md)
- [Troubleshooting Guide](../../troubleshooting/common-issues.md)

---

---

## Additional Content (Migrated)

### Prerequisites
- [ ] Host system is running
- [ ] Docker daemon is active
- [ ] Network connectivity verified
- [ ] Storage volumes mounted
- [ ] Environment variables loaded

### Startup Sequence

#### 1. Infrastructure Services (5 minutes)
```bash
# Start databases first
cd /home/jwoltje/src/mosaic-sdk
docker compose -f deployment/docker-compose.production.yml up -d postgres mariadb redis

# Wait for databases to be ready
echo "Waiting for databases..."
sleep 30

# Verify database connectivity
docker exec mosaic-postgres psql -U postgres -c "SELECT 1"
docker exec mosaic-mariadb mysql -u root -p${MARIADB_ROOT_PASSWORD} -e "SELECT 1"
docker exec mosaic-redis redis-cli ping
```

#### 2. Core Platform Services (10 minutes)
```bash
docker compose -f deployment/gitea/docker-compose.yml up -d

# Wait for Gitea initialization
echo "Waiting for Gitea..."
until curl -s http://localhost:3000/api/healthz | grep -q "ok"; do
    sleep 5
done

docker compose -f deployment/services/plane/docker-compose.yml up -d

docker compose -f deployment/docker-compose.bookstack-mariadb.yml up -d
```

#### 3. CI/CD Services (5 minutes)
```bash
# Start Woodpecker server
docker compose -f deployment/services/woodpecker/docker-compose.yml up -d woodpecker-server

# Wait for server
sleep 20

docker compose -f deployment/services/woodpecker/docker-compose.yml up -d woodpecker-agent
```

#### 4. Monitoring Stack (5 minutes)
```bash
docker compose -f deployment/docker-compose.monitoring.yml up -d

# Verify Prometheus is collecting metrics
curl -s http://localhost:9090/api/v1/query?query=up | grep -q "success"
```

#### 5. MosAIc Services (3 minutes)
```bash
cd mosaic-mcp
npm run start:production &

until curl -s http://localhost:3456/health | grep -q "ok"; do
    sleep 5
done

cd ../worktrees/mosaic-worktrees/core-orchestration
npm run start &
```

```bash
# Run comprehensive health check
/home/jwoltje/src/mosaic-sdk/deployment/scripts/check-all-services.sh

# Check all endpoints
/home/jwoltje/src/mosaic-sdk/deployment/scripts/health-checks.sh all
```

### PostgreSQL
```bash
docker compose -f deployment/docker-compose.production.yml up -d postgres
docker exec mosaic-postgres pg_isready
```

### MariaDB
```bash
docker compose -f deployment/docker-compose.production.yml up -d mariadb
docker exec mosaic-mariadb mysqladmin ping -u root -p${MARIADB_ROOT_PASSWORD}
```

### Redis
```bash
docker compose -f deployment/docker-compose.production.yml up -d redis
docker exec mosaic-redis redis-cli ping
```

### Gitea
```bash
docker compose -f deployment/gitea/docker-compose.yml up -d
curl -s http://localhost:3000/api/healthz
```

### Plane
```bash
# Start database migrations first
docker compose -f deployment/services/plane/docker-compose.yml run --rm api python manage.py migrate

# Then start services
docker compose -f deployment/services/plane/docker-compose.yml up -d
```

### BookStack
```bash
# Run migrations
docker compose -f deployment/docker-compose.bookstack-mariadb.yml run --rm bookstack php artisan migrate

# Start service
docker compose -f deployment/docker-compose.bookstack-mariadb.yml up -d bookstack
```

### Woodpecker
```bash
# Start server first
docker compose -f deployment/services/woodpecker/docker-compose.yml up -d woodpecker-server

# Then agents
sleep 20
docker compose -f deployment/services/woodpecker/docker-compose.yml up -d woodpecker-agent
```

### Monitoring Stack
```bash
# Start in order: Prometheus, Grafana, Loki, AlertManager
docker compose -f deployment/docker-compose.monitoring.yml up -d prometheus
sleep 10
docker compose -f deployment/docker-compose.monitoring.yml up -d grafana loki alertmanager
```

```bash
# Check logs
docker logs <container-name> --tail 50

# Check resources
docker system df
df -h
free -h

# Check ports
netstat -tulpn | grep <port>
```

### Database Connection Failed
```bash
# Test connectivity
docker exec <db-container> <db-cli> -h localhost -u <user> -p

# Check credentials
grep <DB>_PASSWORD .env

# Check network
docker network ls
docker network inspect mosaic_default
```

### Service Unhealthy
```bash
# Check health status
docker inspect <container> | jq '.[0].State.Health'

# Force health check
docker exec <container> /health.sh

docker compose -f <compose-file> up <service>
```

## Emergency Procedures

### Quick Start (Minimal Services)
```bash
# Start only critical services
docker compose -f deployment/docker-compose.production.yml up -d postgres redis
docker compose -f deployment/gitea/docker-compose.yml up -d
```

### Recovery Mode
```bash
# Start with maintenance mode
export MAINTENANCE_MODE=true
docker compose -f deployment/docker-compose.production.yml up -d
```

```bash
# Start services in read-only mode
export READ_ONLY=true
docker compose -f deployment/docker-compose.production.yml up -d
```
