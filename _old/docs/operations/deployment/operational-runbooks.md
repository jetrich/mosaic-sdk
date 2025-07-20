# MosAIc Stack Operational Runbooks

## Table of Contents
1. [Initial Deployment](#initial-deployment)
2. [Service Management](#service-management)
3. [Backup Operations](#backup-operations)
4. [Monitoring Setup](#monitoring-setup)
5. [SSL Certificate Management](#ssl-certificate-management)
6. [Database Operations](#database-operations)
7. [Emergency Procedures](#emergency-procedures)
8. [Maintenance Windows](#maintenance-windows)
9. [Scaling Operations](#scaling-operations)
10. [Troubleshooting Guide](#troubleshooting-guide)

---

## Initial Deployment

### Prerequisites Checklist
```bash
# 1. Verify Docker and Docker Compose versions
docker --version  # Should be 20.10+
docker compose version  # Should be 2.0+

# 2. Check system resources
free -h  # Minimum 8GB RAM recommended
df -h    # Minimum 50GB free disk space

# 3. Verify domain DNS
dig +short your-domain.com  # Should return server IP
dig +short git.your-domain.com
dig +short plane.your-domain.com
dig +short docs.your-domain.com
```

### Step-by-Step Deployment
```bash
# 1. Clone repository
git clone https://github.com/your-org/mosaic-stack.git
cd mosaic-stack/deployment

# 2. Create networks
docker network create mosaic-proxy
docker network create mosaic-db
docker network create mosaic-cache
docker network create mosaic-monitoring
docker network create mosaic-backup

# 3. Copy and configure environment
cp .env.production .env
# Edit .env with your values
nano .env

# 4. Generate secure passwords
./scripts/generate-passwords.sh >> .env

# 5. Create required directories
mkdir -p secrets backups logs
chmod 700 secrets

# 6. Deploy core services first
docker compose -f docker-compose.production.yml up -d traefik postgres mariadb redis

# 7. Wait for databases to initialize
./scripts/wait-for-databases.sh

# 8. Deploy application services
docker compose -f docker-compose.production.yml up -d

# 9. Verify all services are running
./scripts/health-checks.sh

# 10. Deploy monitoring stack
docker compose -f docker-compose.monitoring.yml up -d
```

---

## Service Management

### Starting Services
```bash
# Start all services
docker compose -f docker-compose.production.yml up -d

# Start specific service
docker compose -f docker-compose.production.yml up -d gitea

# Start with logs
docker compose -f docker-compose.production.yml up -d && docker compose logs -f
```

### Stopping Services
```bash
# Stop all services gracefully
docker compose -f docker-compose.production.yml stop

# Stop specific service
docker compose -f docker-compose.production.yml stop gitea

# Stop and remove containers
docker compose -f docker-compose.production.yml down

# Stop and remove everything (including volumes - CAUTION!)
docker compose -f docker-compose.production.yml down -v
```

### Restarting Services
```bash
# Restart specific service
docker compose -f docker-compose.production.yml restart gitea

# Restart with zero downtime (rolling restart)
docker compose -f docker-compose.production.yml up -d --no-deps gitea

# Restart all services
docker compose -f docker-compose.production.yml restart
```

### Viewing Logs
```bash
# View all logs
docker compose -f docker-compose.production.yml logs

# View specific service logs
docker compose -f docker-compose.production.yml logs gitea

# Follow logs in real-time
docker compose -f docker-compose.production.yml logs -f

# View last 100 lines
docker compose -f docker-compose.production.yml logs --tail=100
```

---

## Backup Operations

### Manual Backup Execution
```bash
# Backup all services
./scripts/backup/backup-all.sh

# Backup specific service
./scripts/backup/backup-postgres.sh
./scripts/backup/backup-mariadb.sh
./scripts/backup/backup-redis.sh
./scripts/backup/backup-gitea.sh

# Backup with custom retention
RETENTION_DAYS=30 ./scripts/backup/backup-postgres.sh
```

### Restore Operations
```bash
# List available backups
./scripts/backup/restore-all.sh --list postgres

# Restore latest backup
./scripts/backup/restore-all.sh postgres

# Restore specific backup
./scripts/backup/restore-all.sh postgres /backup/postgres/full_cluster_20240119_120000.sql.gz

# Restore from specific date
./scripts/backup/restore-all.sh --date 20240119 gitea

# Restore all services (interactive)
./scripts/backup/restore-all.sh all
```

### Backup Verification
```bash
# Verify backup integrity
docker exec mosaic-postgres gunzip -t /backup/postgres/latest_full_cluster.sql.gz
docker exec mosaic-gitea unzip -t /backup/gitea/latest_full.zip

# Test restore in staging
docker compose -f docker-compose.staging.yml up -d
./scripts/backup/restore-all.sh --staging all
```

---

## Monitoring Setup

### Initial Grafana Configuration
```bash
# 1. Access Grafana
https://grafana.your-domain.com
# Login: admin / ${GRAFANA_ADMIN_PASSWORD}

# 2. Import dashboards
# Go to Dashboards > Import
# Import IDs:
# - 1860 (Node Exporter Full)
# - 7362 (PostgreSQL Database)
# - 763 (Redis Dashboard)
# - 11835 (Traefik 2)
# - 893 (Docker Dashboard)

# 3. Configure alerts
# Go to Alerting > Contact points
# Add email/slack/webhook notifications
```

### Prometheus Queries
```bash
# Check scrape targets
curl http://localhost:9090/api/v1/targets

# Query examples
# CPU usage: 100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
# Memory usage: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
# Container count: count(container_last_seen)
```

### Setting Up Alerts
```yaml
# Add to configs/prometheus/alerts.yml
- alert: ServiceDown
  expr: up{job="docker"} == 0
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Service {{ $labels.container_name }} is down"
```

---

## SSL Certificate Management

### Let's Encrypt Auto-Renewal
```bash
# Check certificate expiry
docker exec mosaic-traefik cat /letsencrypt/acme.json | jq '.Certificates[].certificate' | base64 -d | openssl x509 -noout -dates

# Force renewal (if needed)
docker exec mosaic-traefik rm /letsencrypt/acme.json
docker restart mosaic-traefik

# Monitor renewal logs
docker logs mosaic-traefik | grep -i "certificate"
```

### Using Custom Certificates
```bash
# 1. Create certificate directory
mkdir -p configs/traefik/certs

# 2. Copy certificates
cp your-cert.pem configs/traefik/certs/
cp your-key.pem configs/traefik/certs/

# 3. Update Traefik configuration
# Add to traefik.yml:
tls:
  certificates:
    - certFile: /certs/your-cert.pem
      keyFile: /certs/your-key.pem
```

---

## Database Operations

### PostgreSQL Management
```bash
# Connect to PostgreSQL
docker exec -it mosaic-postgres psql -U postgres

# Create backup of specific database
docker exec mosaic-postgres pg_dump -U postgres gitea > gitea_backup.sql

# Restore specific database
docker exec -i mosaic-postgres psql -U postgres gitea < gitea_backup.sql

# Check database sizes
docker exec mosaic-postgres psql -U postgres -c "SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) AS size FROM pg_database ORDER BY pg_database_size(pg_database.datname) DESC;"

# Vacuum and analyze
docker exec mosaic-postgres psql -U postgres -c "VACUUM ANALYZE;"
```

### MariaDB Management
```bash
# Connect to MariaDB
docker exec -it mosaic-mariadb mysql -uroot -p

# Create backup of BookStack
docker exec mosaic-mariadb mysqldump -uroot -p bookstack > bookstack_backup.sql

# Check table sizes
docker exec mosaic-mariadb mysql -uroot -p -e "SELECT table_schema, SUM(data_length + index_length) / 1024 / 1024 AS 'DB Size in MB' FROM information_schema.tables GROUP BY table_schema;"

# Optimize tables
docker exec mosaic-mariadb mysqlcheck -uroot -p --optimize bookstack
```

### Redis Management
```bash
# Connect to Redis
docker exec -it mosaic-redis redis-cli

# Check memory usage
docker exec mosaic-redis redis-cli INFO memory

# Clear specific cache
docker exec mosaic-redis redis-cli --scan --pattern "gitea:*" | xargs docker exec mosaic-redis redis-cli DEL

# Create snapshot
docker exec mosaic-redis redis-cli BGSAVE
```

---

## Emergency Procedures

### Service Recovery
```bash
# 1. Check what's wrong
./scripts/health-checks.sh
docker compose -f docker-compose.production.yml ps

# 2. View error logs
docker compose -f docker-compose.production.yml logs --tail=100 [service-name]

# 3. Restart failed service
docker compose -f docker-compose.production.yml restart [service-name]

# 4. If container won't start, recreate it
docker compose -f docker-compose.production.yml up -d --force-recreate [service-name]
```

### Database Recovery
```bash
# PostgreSQL recovery
docker compose -f docker-compose.production.yml stop gitea plane-api plane-worker
docker compose -f docker-compose.production.yml restart postgres
# Wait for recovery
docker compose -f docker-compose.production.yml start gitea plane-api plane-worker

# MariaDB recovery
docker compose -f docker-compose.production.yml stop bookstack
docker compose -f docker-compose.production.yml restart mariadb
docker compose -f docker-compose.production.yml start bookstack
```

### Full System Recovery
```bash
# 1. Stop all services
docker compose -f docker-compose.production.yml down

# 2. Restore from backup
./scripts/backup/restore-all.sh all

# 3. Start services
docker compose -f docker-compose.production.yml up -d

# 4. Verify recovery
./scripts/health-checks.sh
```

---

## Maintenance Windows

### Pre-Maintenance Checklist
```bash
# 1. Notify users (send email/slack)
./scripts/notify-maintenance.sh "Maintenance window starting in 1 hour"

# 2. Create fresh backup
./scripts/backup/backup-all.sh

# 3. Document current state
docker compose -f docker-compose.production.yml ps > pre-maintenance-state.txt
./scripts/health-checks.sh > pre-maintenance-health.txt
```

### During Maintenance
```bash
# 1. Enable maintenance mode (if supported)
docker exec mosaic-gitea gitea admin maintenance --enable
docker exec mosaic-bookstack php artisan down

# 2. Perform updates
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d

# 3. Run migrations if needed
docker exec mosaic-gitea gitea migrate
docker exec mosaic-bookstack php artisan migrate
```

### Post-Maintenance
```bash
# 1. Disable maintenance mode
docker exec mosaic-gitea gitea admin maintenance --disable
docker exec mosaic-bookstack php artisan up

# 2. Verify services
./scripts/health-checks.sh

# 3. Compare states
docker compose -f docker-compose.production.yml ps > post-maintenance-state.txt
diff pre-maintenance-state.txt post-maintenance-state.txt

# 4. Notify completion
./scripts/notify-maintenance.sh "Maintenance completed successfully"
```

---

## Scaling Operations

### Horizontal Scaling (Adding Replicas)
```yaml
# In docker-compose.production.yml
services:
  plane-api:
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: any
```

### Vertical Scaling (Resource Limits)
```yaml
# Increase resources in docker-compose.production.yml
services:
  postgres:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
```

### Database Connection Pooling
```bash
# PostgreSQL max connections
docker exec mosaic-postgres psql -U postgres -c "ALTER SYSTEM SET max_connections = 200;"
docker restart mosaic-postgres

# Application connection pools
# Update in service configurations
GITEA__database__MAX_OPEN_CONNS=50
GITEA__database__MAX_IDLE_CONNS=10
```

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Service Won't Start
```bash
# Check logs
docker logs mosaic-[service] --tail=50

# Check resource constraints
docker stats --no-stream

# Verify network connectivity
docker exec mosaic-[service] ping postgres
docker exec mosaic-[service] nslookup postgres
```

#### Database Connection Issues
```bash
# Test PostgreSQL connection
docker exec mosaic-gitea pg_isready -h postgres -p 5432

# Test MariaDB connection
docker exec mosaic-bookstack mysql -h mariadb -u bookstack -p -e "SELECT 1"

# Check firewall rules
docker network inspect mosaic-db
```

#### SSL Certificate Issues
```bash
# Check Traefik logs
docker logs mosaic-traefik | grep -i "error\|warn"

# Verify ACME configuration
docker exec mosaic-traefik cat /letsencrypt/acme.json

# Test certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

#### Performance Issues
```bash
# Check system resources
htop
iostat -x 1
netstat -tuln

# Docker resource usage
docker stats

# Database slow queries
docker exec mosaic-postgres psql -U postgres -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

### Debug Mode
```bash
# Enable debug logging
# Update .env
DEBUG=1
LOG_LEVEL=debug

# Restart services
docker compose -f docker-compose.production.yml up -d

# View debug logs
docker compose -f docker-compose.production.yml logs -f | grep -i "debug"
```

### Getting Help
```bash
# Collect diagnostic information
./scripts/collect-diagnostics.sh

# Information to provide:
# - Output of health-checks.sh
# - Recent logs from affected service
# - Docker and system versions
# - Any recent changes made
```

---

## Quick Reference Commands

```bash
# Health check
./scripts/health-checks.sh

# View all logs
docker compose logs -f

# Restart all services
docker compose restart

# Backup everything
./scripts/backup/backup-all.sh

# Check disk usage
df -h
du -sh /var/lib/docker/volumes/*

# Monitor in real-time
watch -n 5 docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```