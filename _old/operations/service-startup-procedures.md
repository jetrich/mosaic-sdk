# Service Startup Procedures

## Complete Stack Startup

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
# Start Gitea
docker compose -f deployment/gitea/docker-compose.yml up -d

# Wait for Gitea initialization
echo "Waiting for Gitea..."
until curl -s http://localhost:3000/api/healthz | grep -q "ok"; do
    sleep 5
done

# Start Plane services
docker compose -f deployment/services/plane/docker-compose.yml up -d

# Start BookStack
docker compose -f deployment/docker-compose.bookstack-mariadb.yml up -d
```

#### 3. CI/CD Services (5 minutes)
```bash
# Start Woodpecker server
docker compose -f deployment/services/woodpecker/docker-compose.yml up -d woodpecker-server

# Wait for server
sleep 20

# Start Woodpecker agents
docker compose -f deployment/services/woodpecker/docker-compose.yml up -d woodpecker-agent
```

#### 4. Monitoring Stack (5 minutes)
```bash
# Start monitoring services
docker compose -f deployment/docker-compose.monitoring.yml up -d

# Verify Prometheus is collecting metrics
curl -s http://localhost:9090/api/v1/query?query=up | grep -q "success"
```

#### 5. MosAIc Services (3 minutes)
```bash
# Start MCP server
cd mosaic-mcp
npm run start:production &

# Wait for MCP to be ready
until curl -s http://localhost:3456/health | grep -q "ok"; do
    sleep 5
done

# Start MosAIc core
cd ../worktrees/mosaic-worktrees/core-orchestration
npm run start &
```

### Post-Startup Verification
```bash
# Run comprehensive health check
/home/jwoltje/src/mosaic-sdk/deployment/scripts/check-all-services.sh

# Check all endpoints
/home/jwoltje/src/mosaic-sdk/deployment/scripts/health-checks.sh all
```

## Individual Service Startup

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

## Troubleshooting Startup Issues

### Container Won't Start
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

# Restart with verbose logging
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

### Safe Mode (Read-Only)
```bash
# Start services in read-only mode
export READ_ONLY=true
docker compose -f deployment/docker-compose.production.yml up -d
```