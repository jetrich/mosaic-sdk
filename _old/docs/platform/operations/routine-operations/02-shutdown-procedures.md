---
title: "Service Shutdown Procedures"
order: 02
category: "routine-operations"
tags: ["operations", "shutdown", "maintenance", "services"]
---

# Service Shutdown Procedures

Comprehensive procedures for safely shutting down MosAIc Stack services with data integrity preservation.

## Graceful Complete Stack Shutdown

### Pre-Shutdown Checklist

Before initiating shutdown:

- [ ] Notify users of planned maintenance window
- [ ] Stop incoming traffic at load balancer/proxy
- [ ] Wait for active requests to complete (grace period)
- [ ] Initiate backup if required
- [ ] Document reason for shutdown in operations log
- [ ] Verify team members are aware of shutdown

### Shutdown Sequence Overview

Services must be stopped in reverse dependency order:

1. **Application Services** (2 minutes)
   - MosAIc Core, MCP Server
2. **CI/CD Services** (2 minutes)
   - Woodpecker Agents, then Server
3. **Platform Services** (5 minutes)
   - BookStack, Plane, Gitea
4. **Monitoring Stack** (2 minutes)
   - AlertManager, Grafana, Loki, Prometheus
5. **Infrastructure Services** (3 minutes)
   - Redis, MariaDB, PostgreSQL

### Detailed Shutdown Procedures

#### Phase 1: Application Services Shutdown

Stop MosAIc-specific services first:

```bash
#!/bin/bash
# Shutdown MosAIc services

cd /home/jwoltje/src/mosaic-sdk

# Stop MosAIc Core gracefully
echo "Stopping MosAIc Core..."
if [ -f /var/run/mosaic-core.pid ]; then
    kill -TERM $(cat /var/run/mosaic-core.pid)
    sleep 5
    # Verify stopped
    if ps -p $(cat /var/run/mosaic-core.pid) > /dev/null 2>&1; then
        echo "Force stopping MosAIc Core..."
        kill -KILL $(cat /var/run/mosaic-core.pid)
    fi
    rm -f /var/run/mosaic-core.pid
fi

# Stop MCP Server gracefully
echo "Stopping MCP Server..."
cd mosaic-mcp
npm run stop || {
    if [ -f /var/run/mosaic-mcp.pid ]; then
        kill -TERM $(cat /var/run/mosaic-mcp.pid)
        sleep 5
        rm -f /var/run/mosaic-mcp.pid
    fi
}

# Verify all Node.js processes stopped
ps aux | grep -E "(mosaic|mcp)" | grep -v grep || echo "All MosAIc services stopped"
```

#### Phase 2: CI/CD Services Shutdown

Stop CI/CD services, ensuring no builds are interrupted:

```bash
# Shutdown CI/CD services

# Stop Woodpecker agents first to prevent new jobs
echo "Stopping Woodpecker agents..."
docker compose -f deployment/services/woodpecker/docker-compose.yml stop woodpecker-agent

# Wait for running jobs to complete (max 5 minutes)
echo "Waiting for active CI/CD jobs to complete..."
timeout=300
while [ $timeout -gt 0 ] && docker exec woodpecker-server woodpecker-cli build ls --status running | grep -q .; do
    echo "Active jobs detected, waiting... ($timeout seconds remaining)"
    sleep 10
    timeout=$((timeout - 10))
done

# Stop Woodpecker server
echo "Stopping Woodpecker server..."
docker compose -f deployment/services/woodpecker/docker-compose.yml stop woodpecker-server
```

#### Phase 3: Platform Services Shutdown

Gracefully stop application services:

```bash
# Shutdown platform services

# Stop BookStack
echo "Stopping BookStack..."
docker exec bookstack php artisan down  # Enable maintenance mode
sleep 5
docker compose -f deployment/docker-compose.bookstack-mariadb.yml stop bookstack

# Stop Plane services in order
echo "Stopping Plane services..."
docker compose -f deployment/services/plane/docker-compose.yml stop worker beat
sleep 5
docker compose -f deployment/services/plane/docker-compose.yml stop api web
sleep 5
docker compose -f deployment/services/plane/docker-compose.yml stop proxy

# Stop Gitea with queue flush
echo "Stopping Gitea..."
docker exec gitea gitea manager flush-queues
sleep 10
docker compose -f deployment/gitea/docker-compose.yml stop
```

#### Phase 4: Monitoring Stack Shutdown

Stop monitoring services:

```bash
# Shutdown monitoring stack

echo "Stopping monitoring services..."
# Stop in reverse dependency order
docker compose -f deployment/docker-compose.monitoring.yml stop alertmanager grafana promtail
sleep 5
docker compose -f deployment/docker-compose.monitoring.yml stop loki prometheus

echo "Monitoring stack stopped"
```

#### Phase 5: Infrastructure Services Shutdown

Finally, stop database and cache services with data preservation:

```bash
# Shutdown infrastructure services

# Flush Redis to disk
echo "Flushing Redis to disk..."
docker exec mosaic-redis redis-cli BGSAVE
# Wait for background save to complete
while [ $(docker exec mosaic-redis redis-cli LASTSAVE) -eq $(docker exec mosaic-redis redis-cli LASTSAVE) ]; do
    sleep 1
done
docker compose -f deployment/docker-compose.production.yml stop redis

# Checkpoint PostgreSQL
echo "Checkpointing PostgreSQL..."
docker exec mosaic-postgres psql -U postgres -c "CHECKPOINT"
docker exec mosaic-postgres psql -U postgres -c "SELECT pg_switch_wal()"  # Force WAL rotation
sleep 5
docker compose -f deployment/docker-compose.production.yml stop postgres

# Flush MariaDB tables
echo "Flushing MariaDB tables..."
docker exec mosaic-mariadb mysql -u root -p${MARIADB_ROOT_PASSWORD} -e "FLUSH TABLES WITH READ LOCK; UNLOCK TABLES;"
docker exec mosaic-mariadb mysql -u root -p${MARIADB_ROOT_PASSWORD} -e "FLUSH LOGS"
sleep 5
docker compose -f deployment/docker-compose.production.yml stop mariadb
```

### Post-Shutdown Verification

Verify all services have stopped cleanly:

```bash
# Post-shutdown verification

echo "=== Post-Shutdown Verification ==="
echo "Time: $(date)"
echo

# Check for running containers
echo "Checking for running containers..."
running_containers=$(docker ps --filter "label=com.docker.compose.project=mosaic" -q)
if [ -z "$running_containers" ]; then
    echo "✓ All MosAIc containers stopped"
else
    echo "✗ Warning: Some containers still running:"
    docker ps --filter "label=com.docker.compose.project=mosaic"
fi

# Check for orphaned processes
echo -e "\nChecking for orphaned processes..."
if ps aux | grep -E "(postgres|mysql|redis|gitea|plane)" | grep -v grep; then
    echo "✗ Warning: Orphaned processes detected"
else
    echo "✓ No orphaned processes found"
fi

# Verify ports are freed
echo -e "\nChecking port availability..."
ports=(5432 3306 6379 3000 8000 3001 9090 3456)
for port in "${ports[@]}"; do
    if netstat -tln | grep -q ":$port "; then
        echo "✗ Port $port is still in use"
    else
        echo "✓ Port $port is free"
    fi
done

# Check for lock files
echo -e "\nChecking for lock files..."
find /var/lib/mosaic -name "*.lock" -o -name "*.pid" 2>/dev/null || echo "✓ No lock files found"
```

## Emergency Shutdown Procedures

### Immediate Shutdown (Critical Situations)

**WARNING**: Use only when data loss is acceptable or system is compromised.

```bash
# Emergency immediate shutdown
# WARNING: Risk of data loss!

echo "EMERGENCY SHUTDOWN INITIATED AT $(date)"
echo "WARNING: Data loss may occur!"

# Log the emergency
echo "$(date): Emergency shutdown initiated by $(whoami)" >> /var/log/mosaic/emergency.log

# Stop all containers immediately (10 second timeout)
docker stop -t 10 $(docker ps -q --filter "label=com.docker.compose.project=mosaic") 2>/dev/null

# Kill any remaining containers
docker kill $(docker ps -q --filter "label=com.docker.compose.project=mosaic") 2>/dev/null

# Kill any remaining processes
pkill -9 -f mosaic
pkill -9 -f gitea
pkill -9 -f plane
pkill -9 -f woodpecker

echo "Emergency shutdown completed"
```

### Forced Shutdown with Minimal Data Loss

Faster shutdown while attempting to preserve critical data:

```bash
# Forced shutdown with basic data preservation

echo "Forced shutdown initiated - attempting data preservation..."

# Quick flush of critical data (5 second timeout each)
timeout 5 docker exec mosaic-redis redis-cli BGSAVE || echo "Redis save failed"
timeout 5 docker exec mosaic-postgres psql -U postgres -c "CHECKPOINT" || echo "PostgreSQL checkpoint failed"
timeout 5 docker exec mosaic-mariadb mysql -u root -p${MARIADB_ROOT_PASSWORD} -e "FLUSH TABLES" || echo "MariaDB flush failed"

# Stop all services with 30-second timeout
docker compose -f deployment/docker-compose.production.yml stop -t 30
docker compose -f deployment/gitea/docker-compose.yml stop -t 30
docker compose -f deployment/services/plane/docker-compose.yml stop -t 30
docker compose -f deployment/docker-compose.monitoring.yml stop -t 30

echo "Forced shutdown completed"
```

## Individual Service Shutdown

### Database Services

#### PostgreSQL Shutdown
```bash
# Graceful PostgreSQL shutdown
docker exec mosaic-postgres psql -U postgres -c "CHECKPOINT"
docker exec mosaic-postgres psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid <> pg_backend_pid()"
docker compose -f deployment/docker-compose.production.yml stop postgres

# Verify stopped
docker exec mosaic-postgres pg_isready 2>/dev/null && echo "Still running!" || echo "Stopped"
```

#### MariaDB Shutdown
```bash
# Graceful MariaDB shutdown
docker exec mosaic-mariadb mysql -u root -p${MARIADB_ROOT_PASSWORD} -e "FLUSH TABLES WITH READ LOCK; UNLOCK TABLES;"
docker exec mosaic-mariadb mysql -u root -p${MARIADB_ROOT_PASSWORD} -e "FLUSH LOGS"
docker exec mosaic-mariadb mysql -u root -p${MARIADB_ROOT_PASSWORD} -e "SHUTDOWN"
# or
docker compose -f deployment/docker-compose.production.yml stop mariadb
```

#### Redis Shutdown
```bash
# Save data and shutdown Redis
docker exec mosaic-redis redis-cli BGSAVE
# Monitor save progress
watch -n 1 'docker exec mosaic-redis redis-cli LASTSAVE'
# Shutdown
docker exec mosaic-redis redis-cli SHUTDOWN SAVE
docker compose -f deployment/docker-compose.production.yml stop redis
```

### Application Services

#### Gitea Shutdown
```bash
# Flush queues and stop Gitea
docker exec gitea gitea manager flush-queues
docker exec gitea gitea manager pause
sleep 5
docker compose -f deployment/gitea/docker-compose.yml stop
```

#### Plane Shutdown
```bash
docker compose -f deployment/services/plane/docker-compose.yml stop worker beat
sleep 5
docker compose -f deployment/services/plane/docker-compose.yml stop api web space
sleep 5
docker compose -f deployment/services/plane/docker-compose.yml stop proxy
```

#### BookStack Shutdown
```bash
# Enable maintenance mode and stop
docker exec bookstack php artisan down
docker exec bookstack php artisan cache:clear
docker compose -f deployment/docker-compose.bookstack-mariadb.yml stop bookstack
```

## Maintenance Mode Procedures

### Enable Maintenance Mode

Put services in maintenance mode without full shutdown:

```bash
# Enable maintenance mode

# Set global maintenance flag
echo "$(date): Maintenance mode enabled" > /var/lib/mosaic/MAINTENANCE

# Enable maintenance mode for each service
docker exec bookstack php artisan down --message="Scheduled maintenance" --retry=3600
docker exec gitea gitea manager pause
docker exec plane-api python manage.py maintenance_mode on

# Update reverse proxy to show maintenance page
docker exec mosaic-nginx nginx -s reload

echo "Maintenance mode enabled - services accessible but read-only"
```

### Partial Shutdown

Keep databases running while stopping applications:

```bash
# Partial shutdown - databases remain available

# Stop application services only
docker compose -f deployment/gitea/docker-compose.yml stop
docker compose -f deployment/services/plane/docker-compose.yml stop
docker compose -f deployment/docker-compose.bookstack-mariadb.yml stop bookstack
docker compose -f deployment/services/woodpecker/docker-compose.yml stop

# Databases and Redis remain running
echo "Application services stopped - databases still available"
```

## Shutdown Troubleshooting

### Container Won't Stop

When containers refuse to stop gracefully:

```bash
# Handle stuck container

CONTAINER=$1

# Check what's keeping it running
echo "Checking container logs..."
docker logs $CONTAINER --tail 50

# Try graceful stop with extended timeout
echo "Attempting graceful stop (60s timeout)..."
docker stop -t 60 $CONTAINER

# If still running, check processes
if docker ps | grep -q $CONTAINER; then
    echo "Container still running, checking processes..."
    docker exec $CONTAINER ps aux
    
    # Force stop
    echo "Force stopping container..."
    docker kill $CONTAINER
fi
```

### Process Still Running After Shutdown

Handle orphaned processes:

```bash
# Clean up orphaned processes

# Find processes by name
for service in postgres mysql redis gitea plane; do
    pids=$(pgrep -f $service)
    if [ ! -z "$pids" ]; then
        echo "Found $service processes: $pids"
        # Try graceful termination
        kill -TERM $pids
        sleep 5
        # Force kill if needed
        pgrep -f $service && kill -KILL $(pgrep -f $service)
    fi
done
```

### Data Corruption Prevention

Always ensure data is flushed before shutdown:

```bash
# Pre-shutdown data integrity check

# PostgreSQL - check for active transactions
active_tx=$(docker exec mosaic-postgres psql -U postgres -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active'")
if [ $active_tx -gt 1 ]; then
    echo "Warning: $active_tx active transactions in PostgreSQL"
    echo "Waiting for transactions to complete..."
    sleep 10
fi

# MariaDB - check for open tables
open_tables=$(docker exec mosaic-mariadb mysql -u root -p${MARIADB_ROOT_PASSWORD} -e "SHOW OPEN TABLES WHERE In_use > 0" | wc -l)
if [ $open_tables -gt 1 ]; then
    echo "Warning: Open tables detected in MariaDB"
fi

# Redis - ensure background save completed
docker exec mosaic-redis redis-cli BGSAVE
while [ $(docker exec mosaic-redis redis-cli LASTSAVE) -eq $(docker exec mosaic-redis redis-cli LASTSAVE) ]; do
    echo "Waiting for Redis background save..."
    sleep 1
done
```

## Post-Shutdown Tasks

### Cleanup and Verification

After shutdown, perform cleanup:

```bash
# Post-shutdown cleanup

# Remove temporary files
echo "Cleaning temporary files..."
rm -f /var/lib/mosaic/*/tmp/*
rm -f /var/run/mosaic-*.pid

# Clear old lock files
find /var/lib/mosaic -name "*.lock" -mtime +1 -delete

# Remove maintenance flags
rm -f /var/lib/mosaic/MAINTENANCE

# Log the shutdown
echo "$(date): Shutdown completed - Reason: ${SHUTDOWN_REASON:-Planned maintenance}" >> /var/log/mosaic/shutdowns.log

# Verify no containers running
if [ -z "$(docker ps -q --filter label=com.docker.compose.project=mosaic)" ]; then
    echo "✓ All containers successfully stopped"
else
    echo "✗ Warning: Some containers may still be running"
    docker ps --filter label=com.docker.compose.project=mosaic
fi
```

### Prepare for Next Startup

Ensure system is ready for clean startup:

```bash
# Prepare for next startup

# Check and clean Docker system
docker system prune -f --volumes=false

# Verify network configuration
docker network ls | grep mosaic

# Check storage availability
df -h /var/lib/mosaic

# Document shutdown completion
cat >> /var/log/mosaic/operations.log <<EOF
=== Shutdown Report ===
Time: $(date)
Type: ${SHUTDOWN_TYPE:-Graceful}
Duration: ${SHUTDOWN_DURATION:-Unknown}
Issues: ${SHUTDOWN_ISSUES:-None}
Next Action: ${NEXT_ACTION:-Startup when ready}
===================
EOF
```

## Automated Shutdown Script

Complete automated shutdown script with error handling:

```bash
# /opt/mosaic/scripts/shutdown-all.sh

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/mosaic/shutdown-$(date +%Y%m%d-%H%M%S).log"

# Configuration
GRACE_PERIOD=${GRACE_PERIOD:-60}
SHUTDOWN_TYPE=${1:-graceful}  # graceful, forced, emergency

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handler
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Graceful shutdown function
graceful_shutdown() {
    log "Starting graceful shutdown sequence..."
    
    # Pre-shutdown tasks
    log "Running pre-shutdown tasks..."
    "$SCRIPT_DIR/pre-shutdown-checks.sh" || log "WARNING: Pre-shutdown checks failed"
    
    # Shutdown in reverse order
    log "Phase 1: Stopping application services..."
    "$SCRIPT_DIR/shutdown-mosaic-services.sh" || log "WARNING: Some MosAIc services failed to stop"
    
    log "Phase 2: Stopping CI/CD services..."
    "$SCRIPT_DIR/shutdown-cicd.sh" || log "WARNING: CI/CD shutdown issues"
    
    log "Phase 3: Stopping platform services..."
    "$SCRIPT_DIR/shutdown-platform.sh" || log "WARNING: Platform shutdown issues"
    
    log "Phase 4: Stopping monitoring..."
    "$SCRIPT_DIR/shutdown-monitoring.sh" || log "WARNING: Monitoring shutdown issues"
    
    log "Phase 5: Stopping infrastructure..."
    "$SCRIPT_DIR/shutdown-infrastructure.sh" || error_exit "Infrastructure shutdown failed"
    
    log "Graceful shutdown completed successfully"
}

# Main execution
case $SHUTDOWN_TYPE in
    graceful)
        graceful_shutdown
        ;;
    forced)
        log "Forced shutdown requested"
        "$SCRIPT_DIR/forced-shutdown.sh"
        ;;
    emergency)
        log "EMERGENCY SHUTDOWN"
        "$SCRIPT_DIR/emergency-shutdown.sh"
        ;;
    *)
        error_exit "Unknown shutdown type: $SHUTDOWN_TYPE"
        ;;
esac

"$SCRIPT_DIR/post-shutdown-cleanup.sh"

log "Shutdown sequence completed"
```

## Best Practices

1. **Always follow the shutdown sequence** to prevent data corruption
2. **Allow grace periods** for services to complete active operations
3. **Flush data to disk** before stopping databases
4. **Document the reason** for every shutdown
5. **Verify shutdown completion** before maintenance tasks
6. **Monitor for orphaned processes** that may prevent clean startup
7. **Test shutdown procedures** regularly in non-production
8. **Keep shutdown scripts updated** with service changes
9. **Have emergency procedures ready** but use sparingly
10. **Automate where possible** to reduce human error

---

Related documentation:
- [Startup Procedures](./01-startup-procedures.md)
- [Maintenance Windows](./03-maintenance-windows.md)
- [Emergency Response](../incident-response/01-emergency-procedures.md)

---

---

## Additional Content (Migrated)

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

docker compose -f deployment/services/woodpecker/docker-compose.yml stop woodpecker-server
```

#### 3. Platform Services (5 minutes)
```bash
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

```bash
# Verify all containers stopped
docker ps --filter "label=com.docker.compose.project=mosaic"

ps aux | grep -E "(postgres|mysql|redis|gitea|plane)" | grep -v grep

netstat -tulpn | grep -E "(5432|3306|6379|3000|8000)"
```

## Emergency Shutdown

### Immediate Shutdown (Data Loss Risk)
```bash
# WARNING: Use only in critical situations

echo "EMERGENCY SHUTDOWN INITIATED"
echo "Data loss may occur!"

# Stop all Mosaic containers immediately
docker stop $(docker ps -q --filter "label=com.docker.compose.project=mosaic")

pkill -f mosaic
pkill -f gitea
pkill -f plane
```

```bash
# Faster shutdown with basic data preservation

# Quick flush databases
docker exec mosaic-redis redis-cli BGSAVE
docker exec mosaic-postgres psql -U postgres -c "CHECKPOINT"
docker exec mosaic-mariadb mysql -u root -p${MARIADB_ROOT_PASSWORD} -e "FLUSH TABLES WITH READ LOCK"

docker compose -f deployment/docker-compose.production.yml stop -t 30
docker compose -f deployment/gitea/docker-compose.yml stop -t 30
docker compose -f deployment/services/plane/docker-compose.yml stop -t 30
docker compose -f deployment/docker-compose.monitoring.yml stop -t 30
```

### Database Shutdown Procedures

#### PostgreSQL
```bash
# Graceful shutdown
docker exec mosaic-postgres psql -U postgres -c "CHECKPOINT"
docker compose -f deployment/docker-compose.production.yml stop postgres

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

```bash
# Set maintenance flag
echo "maintenance" > /var/lib/mosaic/MAINTENANCE

# Update nginx to show maintenance page
docker exec mosaic-nginx nginx -s reload
```

### Partial Shutdown (Keep Databases Running)
```bash
docker compose -f deployment/gitea/docker-compose.yml stop
docker compose -f deployment/services/plane/docker-compose.yml stop
docker compose -f deployment/docker-compose.bookstack-mariadb.yml stop bookstack

# Databases remain available for maintenance
```

```bash
docker logs <container> --tail 50

# Force stop after timeout
docker stop -t 60 <container>

# Last resort - kill
docker kill <container>
```

```bash
# Find process
ps aux | grep <service>

# Graceful termination
kill -TERM <pid>

# Force kill if needed
kill -KILL <pid>
```

```bash
# Always checkpoint databases before shutdown
docker exec mosaic-postgres psql -U postgres -c "CHECKPOINT"

# Verify write operations completed
docker exec mosaic-postgres psql -U postgres -c "SELECT * FROM pg_stat_bgwriter"
```

### Verify Clean Shutdown
```bash
# Check logs for errors
docker compose logs --tail=50 | grep -i error

# Verify file integrity
find /var/lib/mosaic -name "*.lock" -o -name "*.pid"

# Check for core dumps
find /var/lib/mosaic -name "core.*"
```

```bash
# Clean up temporary files
rm -f /var/lib/mosaic/*/tmp/*

# Reset maintenance flags
rm -f /var/lib/mosaic/MAINTENANCE

# Document shutdown
echo "$(date): Shutdown completed - Reason: $REASON" >> /var/log/mosaic/shutdowns.log
```
