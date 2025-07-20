# MosAIc Stack Quick Reference Card

## 🚨 Emergency Procedures

### System Down
```bash
# Check status
docker ps -a | grep mosaic

# Quick restart
cd /home/jwoltje/src/mosaic-sdk
./deployment/scripts/check-all-services.sh
docker compose -f deployment/docker-compose.production.yml restart

# If databases are down
docker compose -f deployment/docker-compose.production.yml up -d postgres mariadb redis
```

### Emergency Contacts
- **On-Call**: Check PagerDuty
- **Escalation**: +1-555-ESCALATE
- **Incident Bridge**: +1-555-INCIDENT

## 🚀 Common Operations

### Start Services
```bash
# Full stack
cd /home/jwoltje/src/mosaic-sdk
./deployment/scripts/startup-all.sh

# Individual service
docker compose -f deployment/gitea/docker-compose.yml up -d
```

### Stop Services
```bash
# Graceful shutdown
./deployment/scripts/shutdown-all.sh

# Emergency stop
docker stop $(docker ps -q --filter "label=com.docker.compose.project=mosaic")
```

### Check Health
```bash
# All services
./deployment/scripts/health-checks.sh all

# Specific service
docker exec mosaic-postgres pg_isready
docker exec mosaic-mariadb mysqladmin ping -u root -p$MARIADB_ROOT_PASSWORD
docker exec mosaic-redis redis-cli ping
curl -s https://git.example.com/api/healthz
```

## 📊 Service URLs

| Service | Internal | External | Port |
|---------|----------|----------|------|
| Gitea | gitea:3000 | https://git.${DOMAIN} | 3000 |
| Plane | plane-api:8000 | https://plane.${DOMAIN} | 8000 |
| BookStack | bookstack:80 | https://docs.${DOMAIN} | 80 |
| Grafana | grafana:3000 | https://grafana.${DOMAIN} | 3000 |
| Prometheus | prometheus:9090 | http://localhost:9090 | 9090 |

## 🔧 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs <container> --tail 50

# Check resources
df -h
free -h
docker system df
```

### Database Issues
```bash
# PostgreSQL connections
docker exec mosaic-postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# MariaDB status
docker exec mosaic-mariadb mysql -u root -p$MARIADB_ROOT_PASSWORD -e "SHOW PROCESSLIST;"

# Redis memory
docker exec mosaic-redis redis-cli INFO memory
```

### Network Problems
```bash
# Check networks
docker network ls
docker network inspect mosaic_default

# Test connectivity
docker exec mosaic-gitea ping postgres
docker exec mosaic-gitea nc -zv mariadb 3306
```

## 🛠️ Maintenance Tasks

### Backup Now
```bash
./deployment/scripts/backup/backup-all.sh manual
```

### Clear Logs
```bash
# Docker logs
docker compose logs --tail=0 --follow

# Application logs
find /var/log/mosaic -name "*.log" -mtime +7 -delete
```

### Update Services
```bash
# Pull latest images
docker compose -f deployment/docker-compose.production.yml pull

# Recreate with new images
docker compose -f deployment/docker-compose.production.yml up -d
```

## 📈 Performance Checks

### Database Performance
```sql
-- PostgreSQL slow queries
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- MariaDB slow queries
SELECT * FROM mysql.slow_log
ORDER BY query_time DESC
LIMIT 10;
```

### Resource Usage
```bash
# Container stats
docker stats --no-stream

# Disk I/O
iostat -x 1 5

# Network traffic
iftop -i eth0
```

## 🔐 Security Commands

### Rotate Secrets
```bash
# Generate new secrets
./deployment/scripts/generate-secrets.sh

# Update services
docker compose -f deployment/docker-compose.production.yml up -d
```

### Check Access Logs
```bash
# Failed logins
grep "Failed" /var/log/mosaic/*/access.log | tail -20

# Suspicious activity
grep -E "(DROP|INSERT|UPDATE|DELETE)" /var/log/mosaic/*/access.log
```

## 📝 Log Locations

| Service | Container Logs | Application Logs |
|---------|---------------|------------------|
| Gitea | `docker logs mosaic-gitea` | `/var/lib/mosaic/gitea/log/` |
| Plane | `docker logs mosaic-plane-api` | `/var/lib/mosaic/plane/logs/` |
| BookStack | `docker logs mosaic-bookstack` | `/var/lib/mosaic/bookstack/logs/` |
| PostgreSQL | `docker logs mosaic-postgres` | `/var/lib/mosaic/postgres/pg_log/` |

## 🎯 Quick Wins

### Free Disk Space
```bash
# Clean Docker
docker system prune -af --volumes

# Clear old backups
find /var/backups/mosaic -name "*.tar.gz" -mtime +7 -delete

# Truncate large logs
truncate -s 0 /var/log/mosaic/large.log
```

### Speed Up Services
```bash
# Restart slow service
docker restart <container>

# Clear application cache
docker exec mosaic-gitea gitea admin flush-queues
docker exec mosaic-bookstack php artisan cache:clear
```

### Fix Common Issues
```bash
# Fix permissions
docker exec <container> chown -R user:group /data

# Rebuild search index
docker exec mosaic-gitea gitea admin reindex

# Clear stuck jobs
docker exec mosaic-redis redis-cli FLUSHDB
```

## 🆘 When All Else Fails

1. **Document everything** - What you see, what you tried
2. **Check backups** - Ensure recent backup exists
3. **Call for help** - Don't hesitate to escalate
4. **Consider rollback** - Sometimes going back is best

```bash
# Last resort - restore from backup
./deployment/scripts/backup/restore-all.sh --latest --emergency
```

---
**Remember**: Stay calm, follow procedures, document actions, ask for help when needed!