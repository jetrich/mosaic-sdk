# Service Shutdown Procedures

## Graceful Complete Stack Shutdown

### Pre-Shutdown Checklist
- [ ] Notify users of planned maintenance
- [ ] Stop incoming traffic at load balancer
- [ ] Wait for active requests to complete
- [ ] Initiate backup if needed
- [ ] Document reason for shutdown

### Shutdown Sequence (Reverse of Startup)

#### 1. Application Services (2 minutes)
```bash
# Stop MosAIc services first
cd /home/jwoltje/src/mosaic-sdk

# Stop MosAIc core
pkill -f "node.*mosaic-core" || true

# Stop MCP server
cd mosaic-mcp
npm run stop || pkill -f "node.*mcp-server" || true
cd ..

# Verify processes stopped
ps aux | grep -E "(mosaic|mcp)" | grep -v grep
```

#### 2. CI/CD Services (2 minutes)
```bash
# Stop Woodpecker agents first
docker compose -f deployment/services/woodpecker/docker-compose.yml stop woodpecker-agent

# Wait for jobs to complete
sleep 10

# Stop Woodpecker server
docker compose -f deployment/services/woodpecker/docker-compose.yml stop woodpecker-server
```

#### 3. Platform Services (5 minutes)
```bash
# Stop BookStack
docker compose -f deployment/docker-compose.bookstack-mariadb.yml stop bookstack

# Stop Plane services
docker compose -f deployment/services/plane/docker-compose.yml stop

# Stop Gitea (allow time for git operations to complete)
docker exec gitea gitea manager flush-queues
sleep 10
docker compose -f deployment/gitea/docker-compose.yml stop
```

#### 4. Monitoring Stack (2 minutes)
```bash
# Stop monitoring services
docker compose -f deployment/docker-compose.monitoring.yml stop alertmanager grafana promtail
sleep 5
docker compose -f deployment/docker-compose.monitoring.yml stop loki prometheus
```

#### 5. Infrastructure Services (3 minutes)
```bash
# Stop Redis (flush memory to disk first)
docker exec mosaic-redis redis-cli BGSAVE
sleep 5
docker compose -f deployment/docker-compose.production.yml stop redis

# Stop databases (checkpoint first)
docker exec mosaic-postgres psql -U postgres -c "CHECKPOINT"
docker exec mosaic-mariadb mysql -u root -p${MARIADB_ROOT_PASSWORD} -e "FLUSH TABLES"
sleep 5

docker compose -f deployment/docker-compose.production.yml stop postgres mariadb
```

### Post-Shutdown Verification
```bash
# Verify all containers stopped
docker ps --filter "label=com.docker.compose.project=mosaic"

# Check for orphaned processes
ps aux | grep -E "(postgres|mysql|redis|gitea|plane)" | grep -v grep

# Verify ports are freed
netstat -tulpn | grep -E "(5432|3306|6379|3000|8000)"
```

## Emergency Shutdown

### Immediate Shutdown (Data Loss Risk)
```bash
#!/bin/bash
# WARNING: Use only in critical situations

echo "EMERGENCY SHUTDOWN INITIATED"
echo "Data loss may occur!"

# Stop all Mosaic containers immediately
docker stop $(docker ps -q --filter "label=com.docker.compose.project=mosaic")

# Kill any remaining processes
pkill -f mosaic
pkill -f gitea
pkill -f plane
```

### Forced Shutdown with Minimal Data Loss
```bash
#!/bin/bash
# Faster shutdown with basic data preservation

# Quick flush databases
docker exec mosaic-redis redis-cli BGSAVE
docker exec mosaic-postgres psql -U postgres -c "CHECKPOINT"
docker exec mosaic-mariadb mysql -u root -p${MARIADB_ROOT_PASSWORD} -e "FLUSH TABLES WITH READ LOCK"

# Stop all services with 30-second timeout
docker compose -f deployment/docker-compose.production.yml stop -t 30
docker compose -f deployment/gitea/docker-compose.yml stop -t 30
docker compose -f deployment/services/plane/docker-compose.yml stop -t 30
docker compose -f deployment/docker-compose.monitoring.yml stop -t 30
```

## Individual Service Shutdown

### Database Shutdown Procedures

#### PostgreSQL
```bash
# Graceful shutdown
docker exec mosaic-postgres psql -U postgres -c "CHECKPOINT"
docker compose -f deployment/docker-compose.production.yml stop postgres

# Verify stopped
docker exec mosaic-postgres pg_isready && echo "Still running!" || echo "Stopped"
```

#### MariaDB
```bash
# Flush tables
docker exec mosaic-mariadb mysql -u root -p${MARIADB_ROOT_PASSWORD} -e "FLUSH TABLES"
docker compose -f deployment/docker-compose.production.yml stop mariadb
```

#### Redis
```bash
# Save to disk
docker exec mosaic-redis redis-cli BGSAVE
# Wait for save to complete
docker exec mosaic-redis redis-cli LASTSAVE
docker compose -f deployment/docker-compose.production.yml stop redis
```

### Application Service Shutdown

#### Gitea
```bash
# Flush queues
docker exec gitea gitea manager flush-queues

# Graceful stop
docker compose -f deployment/gitea/docker-compose.yml stop
```

#### Plane
```bash
# Stop workers first
docker compose -f deployment/services/plane/docker-compose.yml stop worker beat

# Then API and web
docker compose -f deployment/services/plane/docker-compose.yml stop api web

# Finally proxy
docker compose -f deployment/services/plane/docker-compose.yml stop proxy
```

#### BookStack
```bash
# Clear cache
docker exec bookstack php artisan cache:clear

# Stop service
docker compose -f deployment/docker-compose.bookstack-mariadb.yml stop bookstack
```

## Maintenance Mode Procedures

### Enable Maintenance Mode
```bash
# Set maintenance flag
echo "maintenance" > /var/lib/mosaic/MAINTENANCE

# Update nginx to show maintenance page
docker exec mosaic-nginx nginx -s reload
```

### Partial Shutdown (Keep Databases Running)
```bash
# Stop application services only
docker compose -f deployment/gitea/docker-compose.yml stop
docker compose -f deployment/services/plane/docker-compose.yml stop
docker compose -f deployment/docker-compose.bookstack-mariadb.yml stop bookstack

# Databases remain available for maintenance
```

## Shutdown Troubleshooting

### Container Won't Stop
```bash
# Check what's keeping it running
docker logs <container> --tail 50

# Force stop after timeout
docker stop -t 60 <container>

# Last resort - kill
docker kill <container>
```

### Process Still Running After Shutdown
```bash
# Find process
ps aux | grep <service>

# Graceful termination
kill -TERM <pid>

# Force kill if needed
kill -KILL <pid>
```

### Data Corruption Prevention
```bash
# Always checkpoint databases before shutdown
docker exec mosaic-postgres psql -U postgres -c "CHECKPOINT"

# Verify write operations completed
docker exec mosaic-postgres psql -U postgres -c "SELECT * FROM pg_stat_bgwriter"
```

## Post-Shutdown Tasks

### Verify Clean Shutdown
```bash
# Check logs for errors
docker compose logs --tail=50 | grep -i error

# Verify file integrity
find /var/lib/mosaic -name "*.lock" -o -name "*.pid"

# Check for core dumps
find /var/lib/mosaic -name "core.*"
```

### Prepare for Next Startup
```bash
# Clean up temporary files
rm -f /var/lib/mosaic/*/tmp/*

# Reset maintenance flags
rm -f /var/lib/mosaic/MAINTENANCE

# Document shutdown
echo "$(date): Shutdown completed - Reason: $REASON" >> /var/log/mosaic/shutdowns.log
```