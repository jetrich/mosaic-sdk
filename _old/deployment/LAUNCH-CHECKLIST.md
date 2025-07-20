# MosAIc Stack Launch Checklist

**Generated**: January 2025  
**Agent**: Agent 12 - Final Integration Agent  
**Purpose**: Comprehensive checklist for launching the MosAIc Stack with Tony 2.8.0 MCP Integration

## 🚀 Pre-Launch Requirements

### Infrastructure Prerequisites
- [ ] **Server Requirements**
  - [ ] Docker Engine v24.0+ installed
  - [ ] Docker Compose v2.20+ installed
  - [ ] Minimum 8GB RAM available
  - [ ] Minimum 50GB disk space
  - [ ] Ports available: 3000, 2222, 6875, 8080, 5432, 6379, 3306
  - [ ] SSL certificates for domain (or use Let's Encrypt)

### Domain & Network Setup
- [ ] **Domain Configuration**
  - [ ] Primary domain registered and DNS configured
  - [ ] Subdomains configured:
    - [ ] git.yourdomain.com → Gitea
    - [ ] docs.yourdomain.com → BookStack
    - [ ] ci.yourdomain.com → Woodpecker
    - [ ] monitor.yourdomain.com → Grafana
  - [ ] SSL/TLS certificates obtained or auto-SSL configured

### Environment Configuration
- [ ] **Environment Files**
  - [ ] Copy `.env.example` to `.env` in deployment directory
  - [ ] Set all required passwords (minimum 16 characters):
    - [ ] POSTGRES_PASSWORD
    - [ ] REDIS_PASSWORD
    - [ ] MARIADB_ROOT_PASSWORD
    - [ ] MARIADB_PASSWORD
    - [ ] GITEA_ADMIN_PASSWORD
    - [ ] BOOKSTACK_DB_PASS
  - [ ] Configure domain names in `.env`
  - [ ] Set appropriate email addresses

## 📦 Component Deployment

### 1. Database Layer
- [ ] **PostgreSQL Setup**
  - [ ] Start PostgreSQL container
  - [ ] Verify health check passes
  - [ ] Test connection: `psql -h localhost -U postgres`
  - [ ] Confirm multiple databases created

- [ ] **Redis Setup**
  - [ ] Start Redis container
  - [ ] Verify health check passes
  - [ ] Test connection: `redis-cli ping`
  - [ ] Confirm password authentication works

- [ ] **MariaDB Setup** (for BookStack)
  - [ ] Start MariaDB container
  - [ ] Verify health check passes
  - [ ] Test connection
  - [ ] Confirm BookStack database created

### 2. Core Services
- [ ] **Gitea Deployment**
  - [ ] Start Gitea container
  - [ ] Access web interface at http://localhost:3000
  - [ ] Complete initial setup wizard
  - [ ] Create admin user
  - [ ] Test Git operations over SSH (port 2222)
  - [ ] Configure OAuth applications for Woodpecker

- [ ] **BookStack Deployment**
  - [ ] Start BookStack container
  - [ ] Access web interface at http://localhost:6875
  - [ ] Login with default credentials
  - [ ] Change admin password immediately
  - [ ] Create initial documentation structure

- [ ] **Woodpecker CI/CD**
  - [ ] Start Woodpecker server
  - [ ] Configure Gitea OAuth integration
  - [ ] Test authentication flow
  - [ ] Start Woodpecker agent(s)
  - [ ] Create test pipeline

### 3. Monitoring Stack (Optional)
- [ ] **Prometheus**
  - [ ] Deploy Prometheus container
  - [ ] Configure scrape targets
  - [ ] Verify metrics collection

- [ ] **Grafana**
  - [ ] Deploy Grafana container
  - [ ] Configure data sources
  - [ ] Import dashboards
  - [ ] Set up alerts

## 🔧 Tony 2.8.0 MCP Integration

### MCP Server Setup
- [ ] **Local MCP Testing**
  - [ ] Run `npm run dev:start` in mosaic-mcp directory
  - [ ] Verify MCP server starts (stdio mode)
  - [ ] Check database creation at `.mosaic/data/mcp.db`
  - [ ] Review server logs for errors

### Tony Framework Validation
- [ ] **Core Files Present**
  - [ ] `tony/core/mcp/minimal-interface.ts`
  - [ ] `tony/core/mcp/minimal-implementation.ts`
  - [ ] `tony/core/mcp/tony-integration.ts`
  - [ ] `tony/core/mcp/tony-mcp-enhanced.ts`

- [ ] **Integration Testing**
  - [ ] Tony can register with MCP
  - [ ] Specialized agents can be deployed
  - [ ] Task routing works correctly
  - [ ] Health monitoring functions

## 🚦 CI/CD Pipeline Setup

### Repository Configuration
- [ ] **Push Repositories to Gitea**
  ```bash
  # For each repository (mosaic-sdk, mosaic-mcp, mosaic-dev, tony)
  git remote add gitea git@git.yourdomain.com:organization/repo-name.git
  git push gitea main
  ```

### Pipeline Activation
- [ ] **Enable Repositories in Woodpecker**
  - [ ] Login to Woodpecker UI
  - [ ] Navigate to repository list
  - [ ] Enable each repository
  - [ ] Configure secrets if needed

- [ ] **Test Pipeline Execution**
  - [ ] Make a test commit
  - [ ] Verify pipeline triggers
  - [ ] Check all stages pass
  - [ ] Review build artifacts

### Pipeline Templates
- [ ] **Verify Templates Available**
  - [ ] Node.js pipeline template
  - [ ] Python pipeline template
  - [ ] Go pipeline template
  - [ ] Base pipeline template

## 🔐 Security Hardening

### Access Control
- [ ] **Change All Default Passwords**
  - [ ] Database passwords
  - [ ] Service admin passwords
  - [ ] API tokens

- [ ] **Configure Firewall**
  - [ ] Allow only necessary ports
  - [ ] Restrict database access to internal network
  - [ ] Enable fail2ban for SSH

### Backup Configuration
- [ ] **Automated Backups**
  - [ ] Configure backup scripts
  - [ ] Set up cron jobs
  - [ ] Test restore procedures
  - [ ] Verify offsite backup storage

## ✅ Post-Launch Validation

### Service Health Checks
- [ ] Run service communication test:
  ```bash
  ./tests/integration/service-communication-test.sh
  ```

### Integration Tests
- [ ] **Gitea Operations**
  - [ ] Create test repository
  - [ ] Clone via HTTPS and SSH
  - [ ] Test webhooks

- [ ] **CI/CD Flow**
  - [ ] Push code to trigger pipeline
  - [ ] Verify build completion
  - [ ] Check artifacts

- [ ] **Documentation**
  - [ ] Create test page in BookStack
  - [ ] Verify search functionality
  - [ ] Test user permissions

### Performance Baseline
- [ ] **Metrics Collection**
  - [ ] Record initial response times
  - [ ] Document resource usage
  - [ ] Set up monitoring alerts

## 🎯 Final Steps

### Documentation
- [ ] **Update Documentation**
  - [ ] Record all customizations
  - [ ] Document access credentials (securely)
  - [ ] Create runbooks for common tasks

### Team Onboarding
- [ ] **User Accounts**
  - [ ] Create user accounts in all services
  - [ ] Configure appropriate permissions
  - [ ] Send onboarding instructions

### Go-Live
- [ ] **Production Cutover**
  - [ ] Update DNS records
  - [ ] Enable SSL/TLS
  - [ ] Monitor for first 24 hours
  - [ ] Address any issues immediately

## 📋 Quick Commands Reference

```bash
# Start entire stack
cd deployment/docker
docker-compose -f docker-compose.mosaicstack-portainer.yml up -d

# Check service status
docker ps --format "table {{.Names}}\t{{.Status}}"

# View logs
docker logs -f <service-name>

# Stop services
docker-compose -f docker-compose.mosaicstack-portainer.yml down

# Backup databases
./scripts/backup.sh

# Run integration tests
./tests/integration/service-communication-test.sh
```

## 🚨 Rollback Plan

If issues occur during launch:

1. **Immediate Actions**
   - Stop affected services: `docker stop <service>`
   - Check logs: `docker logs <service>`
   - Restore from backup if needed

2. **Communication**
   - Notify team of issues
   - Document problems encountered
   - Create incident report

3. **Recovery**
   - Fix identified issues
   - Test in staging environment
   - Re-attempt deployment

---

**Note**: This checklist should be reviewed and customized based on your specific requirements and environment. Ensure all team members have access to this checklist and understand their responsibilities during the launch process.