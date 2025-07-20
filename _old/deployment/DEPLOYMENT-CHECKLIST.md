# Mosaic Stack Deployment Checklist

## Pre-Deployment Validation

### 1. Environment Prerequisites
- [ ] Docker Engine v24.0+ installed
- [ ] Docker Compose v2.20+ installed
- [ ] Minimum 16GB RAM available
- [ ] Minimum 50GB disk space available
- [ ] Required ports available (see SERVICE-ENDPOINTS.md)
- [ ] SSL certificates generated (if using HTTPS)

### 2. Configuration Validation
- [ ] All environment variables defined in `.env`
- [ ] Database credentials configured
- [ ] Service secrets generated
- [ ] Backup paths configured
- [ ] Monitoring endpoints configured

### 3. Infrastructure Validation
- [ ] Docker daemon running
- [ ] Network connectivity verified
- [ ] DNS resolution working
- [ ] Firewall rules configured
- [ ] Storage volumes accessible

## Service Startup Sequence

### Phase 1: Core Infrastructure
```bash
# 1. Start database services
docker-compose -f deployment/docker-compose.production.yml up -d postgres mariadb redis

# 2. Wait for databases to be healthy
./deployment/scripts/health-checks.sh databases

# 3. Initialize databases
./deployment/scripts/init-databases.sh
```

### Phase 2: Platform Services
```bash
# 4. Start Gitea
docker-compose -f deployment/gitea/docker-compose.yml up -d

# 5. Wait for Gitea
./deployment/scripts/health-checks.sh gitea

# 6. Start Plane
docker-compose -f deployment/services/plane/docker-compose.yml up -d

# 7. Start BookStack
docker-compose -f deployment/docker-compose.bookstack-mariadb.yml up -d
```

### Phase 3: CI/CD Services
```bash
# 8. Start Woodpecker
docker-compose -f deployment/services/woodpecker/docker-compose.yml up -d

# 9. Configure Woodpecker agents
./deployment/agents/START_AGENTS.sh
```

### Phase 4: Monitoring Stack
```bash
# 10. Start monitoring services
docker-compose -f deployment/docker-compose.monitoring.yml up -d

# 11. Wait for monitoring stack
./deployment/scripts/health-checks.sh monitoring
```

### Phase 5: MosAIc Services
```bash
# 12. Start MosAIc MCP server
cd mosaic-mcp && npm run start:production

# 13. Start MosAIc core services
cd ../worktrees/mosaic-worktrees/core-orchestration && npm run start
```

## Configuration Verification

### 1. Service Endpoints
- [ ] Gitea accessible at https://gitea.localhost.com
- [ ] Plane accessible at https://plane.localhost.com
- [ ] BookStack accessible at https://bookstack.localhost.com
- [ ] Grafana accessible at https://grafana.localhost.com
- [ ] Prometheus accessible at http://localhost:9090

### 2. Database Connections
```bash
# Test PostgreSQL
./deployment/scripts/check-which-db.sh postgres

# Test MariaDB
./deployment/scripts/check-which-db.sh mariadb

# Test Redis
docker exec -it mosaic-redis redis-cli ping
```

### 3. Service Integration
- [ ] Gitea webhooks configured
- [ ] Woodpecker connected to Gitea
- [ ] Plane connected to databases
- [ ] BookStack authentication working
- [ ] Monitoring collecting metrics

## Health Check Procedures

### Automated Health Checks
```bash
# Run comprehensive health check
./deployment/scripts/check-all-services.sh

# Check specific service
./deployment/scripts/health-checks.sh <service-name>
```

### Manual Health Checks
1. **Gitea**: Create test repository
2. **Plane**: Create test project
3. **BookStack**: Create test page
4. **Woodpecker**: Trigger test pipeline
5. **Monitoring**: Verify metrics collection

## Post-Deployment Validation

### 1. Security Validation
- [ ] All default passwords changed
- [ ] SSL certificates valid
- [ ] Firewall rules active
- [ ] Backup encryption enabled
- [ ] Access logs configured

### 2. Performance Baseline
```bash
# Capture initial metrics
curl -s http://localhost:9090/api/v1/query?query=up | jq

# Test response times
./deployment/scripts/performance-baseline.sh
```

### 3. Backup Verification
```bash
# Test backup procedures
./deployment/scripts/backup/backup-all.sh test

# Verify backup integrity
./deployment/scripts/backup/verify-backups.sh
```

### 4. Monitoring Validation
- [ ] All services appear in Prometheus
- [ ] Grafana dashboards loading
- [ ] Alerts configured and tested
- [ ] Log aggregation working
- [ ] Metrics retention configured

## Rollback Procedures

### Service Rollback
```bash
# Stop all services
docker-compose -f deployment/docker-compose.production.yml down

# Restore from backup
./deployment/scripts/backup/restore-all.sh <backup-date>

# Start services with previous version
docker-compose -f deployment/docker-compose.production.yml up -d
```

## Sign-off Checklist

### Technical Sign-off
- [ ] All services running
- [ ] All health checks passing
- [ ] Performance acceptable
- [ ] Security measures active
- [ ] Backups operational

### Operational Sign-off
- [ ] Documentation complete
- [ ] Runbooks tested
- [ ] Team trained
- [ ] Support contacts defined
- [ ] Escalation procedures documented

### Business Sign-off
- [ ] Functionality verified
- [ ] Performance acceptable
- [ ] Security approved
- [ ] Compliance verified
- [ ] Go-live approved

## Post-Deployment Tasks

1. **Monitor for 24 hours**
   - Check error rates
   - Monitor resource usage
   - Review access logs
   - Verify backup completion

2. **Update documentation**
   - Record actual configurations
   - Note any deviations
   - Update runbooks
   - Document lessons learned

3. **Schedule reviews**
   - Week 1: Initial review
   - Week 2: Performance tuning
   - Month 1: Security audit
   - Quarterly: Capacity planning

---

**Deployment Date**: ________________  
**Deployed By**: ____________________  
**Version**: _______________________  
**Sign-off**: ______________________