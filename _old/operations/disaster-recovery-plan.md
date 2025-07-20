# Disaster Recovery Plan

## Overview

This document outlines procedures for recovering the MosAIc Stack from various disaster scenarios.

### Recovery Objectives
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 1 hour
- **MTTR (Mean Time To Recovery)**: 2 hours

## Disaster Classifications

### Severity Levels
1. **Critical** - Complete system failure
2. **High** - Multiple service failures
3. **Medium** - Single service failure
4. **Low** - Performance degradation

### Disaster Types
- Hardware failure
- Data corruption
- Cyber attack
- Natural disaster
- Human error
- Software bugs

## Emergency Contacts

### Primary Team
| Role | Name | Phone | Email |
|------|------|-------|-------|
| Incident Commander | John Doe | +1-555-0101 | john@example.com |
| Technical Lead | Jane Smith | +1-555-0102 | jane@example.com |
| Database Admin | Bob Johnson | +1-555-0103 | bob@example.com |
| Security Lead | Alice Brown | +1-555-0104 | alice@example.com |

### Escalation Path
1. On-call engineer (5 minutes)
2. Technical lead (15 minutes)
3. Incident commander (30 minutes)
4. Executive team (1 hour)

## Disaster Response Procedures

### Initial Response (0-15 minutes)
```bash
#!/bin/bash
# initial-response.sh

# 1. Assess the situation
echo "=== Disaster Response Initiated: $(date) ==="
echo "Incident ID: DR-$(date +%Y%m%d-%H%M%S)"

# 2. Check system status
./check-all-services.sh > /tmp/dr-status.log

# 3. Identify affected components
docker ps --filter status=exited
docker ps --filter health=unhealthy

# 4. Capture current state
docker logs --since 1h mosaic-* > /tmp/dr-logs.log
dmesg | tail -100 > /tmp/dr-system.log

# 5. Alert team
./send-alert.sh "DISASTER: System failure detected" --priority critical
```

### Triage and Assessment (15-30 minutes)

#### System Health Matrix
| Component | Check Command | Healthy Response |
|-----------|--------------|------------------|
| PostgreSQL | `docker exec mosaic-postgres pg_isready` | "accepting connections" |
| MariaDB | `docker exec mosaic-mariadb mysqladmin ping` | "mysqld is alive" |
| Redis | `docker exec mosaic-redis redis-cli ping` | "PONG" |
| Gitea | `curl -s https://git.example.com/api/healthz` | "ok" |
| Plane | `curl -s https://plane.example.com/api/health` | HTTP 200 |
| Network | `ping -c 1 8.8.8.8` | 0% packet loss |

#### Decision Tree
```
Is the host system responsive?
├─ NO → Execute Hardware Failure Recovery
└─ YES → Are databases accessible?
    ├─ NO → Execute Database Recovery
    └─ YES → Are applications running?
        ├─ NO → Execute Application Recovery
        └─ YES → Execute Service-Specific Recovery
```

## Recovery Procedures by Scenario

### 1. Complete System Failure

#### Phase 1: Infrastructure Recovery (0-1 hour)
```bash
# Boot from recovery media
# Mount filesystems
mount /dev/sda1 /mnt
mount /dev/sda2 /mnt/var

# Verify data integrity
fsck -y /dev/sda1
fsck -y /dev/sda2

# Restore system from backup
tar -xzf /backup/system-backup.tar.gz -C /mnt

# Reinstall bootloader
grub-install /dev/sda
update-grub
```

#### Phase 2: Service Recovery (1-2 hours)
```bash
# Start Docker
systemctl start docker

# Restore application data
./restore-all.sh --latest --emergency

# Start core services only
docker compose -f deployment/docker-compose.production.yml up -d postgres redis
docker compose -f deployment/gitea/docker-compose.yml up -d

# Verify core functionality
./verify-core-services.sh
```

#### Phase 3: Full Recovery (2-4 hours)
```bash
# Start remaining services
./startup-all.sh --gradual

# Restore from transaction logs
./apply-transaction-logs.sh --since "last backup"

# Full verification
./run-full-tests.sh
```

### 2. Database Corruption

#### PostgreSQL Recovery
```bash
# Stop affected service
docker stop mosaic-postgres

# Attempt repair
docker run --rm -v mosaic_postgres_data:/var/lib/postgresql/data postgres:15 \
    postgres --single -D /var/lib/postgresql/data postgres <<EOF
REINDEX DATABASE gitea;
REINDEX DATABASE plane;
VACUUM FULL;
EOF

# If repair fails, restore from backup
./restore-postgres.sh --point-in-time "$(date -d '1 hour ago')"
```

#### MariaDB Recovery
```bash
# Stop service
docker stop mosaic-mariadb

# Run recovery
docker run --rm -v mosaic_mariadb_data:/var/lib/mysql mariadb:10.11 \
    mysqld --innodb-force-recovery=4

# Dump and restore
docker exec mosaic-mariadb mysqldump --all-databases > emergency-dump.sql
docker exec mosaic-mariadb mysql < emergency-dump.sql
```

### 3. Ransomware Attack

#### Immediate Actions
```bash
#!/bin/bash
# ransomware-response.sh

# 1. Isolate system
iptables -I INPUT -j DROP
iptables -I OUTPUT -j DROP
iptables -I INPUT -s 10.0.0.0/8 -j ACCEPT  # Allow internal only

# 2. Stop all services
docker stop $(docker ps -q)

# 3. Snapshot current state for forensics
dd if=/dev/sda of=/external/forensic-image.dd bs=4M

# 4. Identify encrypted files
find /var/lib/mosaic -name "*.encrypted" -o -name "*.locked"

# 5. Check backup integrity
./verify-all-backups.sh --offline
```

#### Recovery Steps
1. **Isolate** - Disconnect from network
2. **Assess** - Identify encrypted files
3. **Report** - Contact security team and law enforcement
4. **Restore** - Clean install from known-good backup
5. **Harden** - Apply additional security measures
6. **Monitor** - Enhanced monitoring for 30 days

### 4. Data Center Failure

#### Failover to DR Site
```bash
#!/bin/bash
# dc-failover.sh

# 1. Verify DR site readiness
ssh dr-site "cd /opt/mosaic && ./pre-failover-check.sh"

# 2. Update DNS records
./update-dns.sh --ttl 60 --target dr-site

# 3. Sync final data
rsync -avz --partial /var/lib/mosaic/ dr-site:/var/lib/mosaic/

# 4. Start services at DR
ssh dr-site "cd /opt/mosaic && ./startup-all.sh --dr-mode"

# 5. Verify services
./verify-dr-services.sh

# 6. Update monitoring
./update-monitoring.sh --primary dr-site
```

#### DR Site Architecture
```
Primary DC (US-East)          DR Site (US-West)
├── Production Services       ├── Standby Services
├── Real-time Replication --> ├── Replica Databases
├── Primary DNS              ├── Secondary DNS
└── Monitoring               └── DR Monitoring
```

### 5. Human Error Recovery

#### Accidental Deletion
```bash
# Recover deleted data
./restore-file.sh --path "/var/lib/mosaic/gitea/repos/important.git" \
                  --timestamp "2024-01-15 10:00:00"

# Recover dropped database
./restore-postgres.sh --database gitea --point-in-time "5 minutes ago"

# Recover deleted container
docker run -d --name recovered-service \
    -v backup-volume:/data \
    original-image:tag
```

#### Configuration Mistakes
```bash
# Rollback configuration
cd /etc/mosaic
git log --oneline config/
git revert HEAD
./reload-configs.sh

# Test configuration before applying
./validate-config.sh new-config.yml
./apply-config.sh --dry-run new-config.yml
```

## Communication Procedures

### Status Page Updates
```bash
# Update public status page
curl -X POST https://status.example.com/api/v1/incidents \
    -H "Authorization: Bearer $STATUS_API_KEY" \
    -d '{
        "incident": {
            "name": "Service Disruption",
            "status": "investigating",
            "impact": "major",
            "body": "We are investigating issues with service availability."
        }
    }'
```

### Stakeholder Notifications
1. **T+0**: Detect issue
2. **T+5min**: Initial assessment
3. **T+15min**: First stakeholder update
4. **T+30min**: Detailed status update
5. **Hourly**: Progress updates
6. **Resolution**: Final report

### Communication Templates
```
Subject: [URGENT] MosAIc Stack Service Disruption

Status: Investigating | Identified | Monitoring | Resolved
Time: [TIMESTAMP]
Impact: Critical | High | Medium | Low
Affected Services: [LIST]

Current Status:
- What happened
- What we're doing
- Expected resolution time

Next Update: [TIME]

Contact: incident-response@example.com
Status Page: https://status.example.com
```

## Post-Incident Procedures

### Immediate Actions (0-24 hours)
1. **Ensure stability** - Monitor for recurring issues
2. **Document timeline** - Create incident timeline
3. **Collect artifacts** - Logs, configs, screenshots
4. **Initial report** - Executive summary

### Follow-up Actions (1-7 days)
1. **Root cause analysis** - 5-why analysis
2. **Blameless postmortem** - Team review meeting
3. **Action items** - Preventive measures
4. **Update runbooks** - Incorporate learnings

### Long-term Improvements (7-30 days)
1. **Implement fixes** - Address root causes
2. **Update monitoring** - Add detection for similar issues
3. **Disaster recovery drill** - Test improvements
4. **Training** - Team knowledge sharing

## Testing and Drills

### Monthly Drills
- **Week 1**: Backup restoration test
- **Week 2**: Service failover test
- **Week 3**: Database recovery test
- **Week 4**: Full DR drill

### Annual Exercises
- **Q1**: Data center failover
- **Q2**: Ransomware simulation
- **Q3**: Complete system recovery
- **Q4**: Multi-region failover

### Drill Checklist
```bash
#!/bin/bash
# dr-drill.sh

echo "=== Disaster Recovery Drill: $(date) ==="

# Pre-drill snapshot
./snapshot-system.sh --label "pre-drill"

# Execute drill scenario
case $1 in
    "database-failure")
        docker stop mosaic-postgres
        sleep 30
        ./recover-database.sh postgres
        ;;
    "service-crash")
        docker kill mosaic-gitea
        ./auto-recovery.sh
        ;;
    "network-partition")
        iptables -I INPUT -s 10.0.0.0/8 -j DROP
        sleep 60
        iptables -D INPUT -s 10.0.0.0/8 -j DROP
        ;;
esac

# Verify recovery
./verify-all-services.sh

# Document results
echo "Drill completed: $(date)"
echo "Recovery time: $SECONDS seconds"
```

## Appendix

### Recovery Toolbox
- System rescue ISO: `/recovery/systemrescue.iso`
- Backup encryption keys: Stored in secure vault
- Network diagrams: `/docs/network/`
- Service dependencies: `/docs/architecture/`
- Vendor contacts: `/docs/vendors/`

### Critical File Locations
```
/etc/mosaic/              # Configuration files
/var/lib/mosaic/          # Application data
/var/backups/mosaic/      # Local backups
/var/log/mosaic/          # Log files
/opt/mosaic/scripts/      # Recovery scripts
```

### Recovery Metrics
Track and report:
- Time to detection
- Time to resolution
- Data loss (if any)
- Affected users
- Root cause
- Prevention measures