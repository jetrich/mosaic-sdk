---
title: "01 Incident Handling"
order: 01
category: "incident-response"
tags: ["incident-response", "operations", "documentation"]
last_updated: "2025-01-19"
author: "migration"
version: "1.0"
status: "published"
---
# Incident Response Procedures

## Incident Response Framework

### Incident Severity Levels

| Severity | Description | Response Time | Example |
|----------|-------------|---------------|---------|
| **P1 - Critical** | Complete service outage | < 15 minutes | All services down |
| **P2 - High** | Major functionality impaired | < 30 minutes | Database unavailable |
| **P3 - Medium** | Minor functionality affected | < 2 hours | Single service degraded |
| **P4 - Low** | Minimal impact | < 24 hours | UI glitch |
| **P5 - Info** | No immediate impact | Best effort | Documentation error |

### Incident Lifecycle
1. **Detection** - Automated or manual discovery
2. **Triage** - Assess severity and impact
3. **Response** - Implement immediate fixes
4. **Resolution** - Restore normal operation
5. **Post-mortem** - Analyze and improve

## Detection and Alerting

### Automated Detection
```yaml
# Prometheus alert rules
groups:
  - name: critical_alerts
    rules:
      - alert: ServiceDown
        expr: up == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.instance }} is down"
          
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: high
        annotations:
          summary: "High error rate on {{ $labels.service }}"
          
      - alert: DatabaseConnectionFailure
        expr: mysql_up == 0 or pg_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database connection failed"
```

### Manual Detection Checklist
- [ ] User reports via support channels
- [ ] Monitoring dashboard anomalies
- [ ] Log file errors
- [ ] Performance degradation
- [ ] Security alerts

## Initial Response Procedures

### P1 - Critical Incident Response (< 15 minutes)

#### Minute 0-5: Assessment
```bash
#!/bin/bash
# critical-response.sh

# Create incident record
INCIDENT_ID="INC-$(date +%Y%m%d-%H%M%S)"
mkdir -p /var/log/mosaic/incidents/$INCIDENT_ID

# Capture initial state
docker ps -a > /var/log/mosaic/incidents/$INCIDENT_ID/docker-state.log
df -h > /var/log/mosaic/incidents/$INCIDENT_ID/disk-state.log
free -h > /var/log/mosaic/incidents/$INCIDENT_ID/memory-state.log

# Check critical services
for service in postgres mariadb redis gitea plane; do
    echo "Checking $service..."
    docker inspect mosaic-$service > /var/log/mosaic/incidents/$INCIDENT_ID/$service-inspect.log
done
```

#### Minute 5-10: Notification
```bash
# Alert incident commander
./send-page.sh --priority critical --to incident-commander \
    --message "P1 Incident: $INCIDENT_ID - System outage detected"

# Update status page
curl -X POST https://status.example.com/api/incidents \
    -d "status=investigating&impact=major"

# Join incident bridge
echo "Incident Bridge: +1-555-INCIDENT ext $INCIDENT_ID"
```

#### Minute 10-15: Mitigation
```bash
# Attempt automatic recovery
./auto-recovery.sh --incident $INCIDENT_ID

# If auto-recovery fails, manual intervention
if [ $? -ne 0 ]; then
    # Restart critical services
    docker compose -f deployment/docker-compose.production.yml restart
    
    # Failover if needed
    ./failover-to-backup.sh
fi
```

### P2 - High Severity Response (< 30 minutes)

```bash
#!/bin/bash
# high-severity-response.sh

# 1. Isolate the problem
AFFECTED_SERVICE=$(identify-affected-service.sh)

# 2. Implement workaround
case $AFFECTED_SERVICE in
    "database")
        # Switch to read replica
        ./switch-to-replica.sh
        ;;
    "storage")
        # Clear cache and temp files
        ./emergency-cleanup.sh
        ;;
    "network")
        # Restart network stack
        docker network prune -f
        systemctl restart docker
        ;;
esac

# 3. Monitor recovery
watch -n 5 ./check-service-health.sh $AFFECTED_SERVICE
```

## Incident Commander Responsibilities

### Initial Actions
1. **Assume command** - "I am the Incident Commander for INC-XXXX"
2. **Assess situation** - Gather initial information
3. **Assemble team** - Page required personnel
4. **Establish communication** - Set up incident bridge
5. **Direct response** - Coordinate team efforts

### During Incident
```bash
# Incident commander dashboard
tmux new-session -s incident \; \
    split-window -h \; \
    send-keys 'watch -n 5 docker ps' C-m \; \
    split-window -v \; \
    send-keys 'tail -f /var/log/mosaic/incidents/current.log' C-m \; \
    select-pane -t 0 \; \
    send-keys './incident-dashboard.sh' C-m
```

### Communication Flow
```
Incident Commander
├── Technical Team Lead
│   ├── Database Admin
│   ├── System Admin
│   └── Application Dev
├── Communications Lead
│   ├── Status Page Updates
│   ├── Customer Notifications
│   └── Internal Updates
└── Business Liaison
    ├── Executive Updates
    └── Stakeholder Comms
```

## Common Incident Scenarios

### Scenario 1: Database Connection Pool Exhausted

#### Symptoms
- Slow application response
- Connection timeout errors
- Database CPU at 100%

#### Response
```bash
# 1. Identify connections
docker exec mosaic-postgres psql -U postgres -c "
    SELECT pid, usename, application_name, state, query_start 
    FROM pg_stat_activity 
    WHERE state != 'idle' 
    ORDER BY query_start;"

# 2. Kill long-running queries
docker exec mosaic-postgres psql -U postgres -c "
    SELECT pg_terminate_backend(pid) 
    FROM pg_stat_activity 
    WHERE state != 'idle' 
    AND query_start < now() - interval '10 minutes';"

# 3. Increase connection limit temporarily
docker exec mosaic-postgres psql -U postgres -c "
    ALTER SYSTEM SET max_connections = 200;"
docker restart mosaic-postgres

# 4. Investigate root cause
grep -r "connection pool" /var/log/mosaic/ | tail -100
```

### Scenario 2: Disk Space Exhaustion

#### Symptoms
- Write operations failing
- Services crashing
- Log entries about disk space

#### Response
```bash
# 1. Identify space usage
df -h | sort -k5 -hr
du -sh /var/lib/mosaic/* | sort -hr | head -20

# 2. Emergency cleanup
# Remove old logs
find /var/log/mosaic -name "*.log" -mtime +7 -delete

# Clean Docker
docker system prune -af --volumes

# Clear temp files
rm -rf /tmp/*
rm -rf /var/tmp/*

# 3. Move data if needed
# Move backups to external storage
mv /var/backups/mosaic/*.tar.gz /mnt/external-storage/

# 4. Add monitoring
echo "0 * * * * root /opt/mosaic/scripts/disk-cleanup.sh" >> /etc/crontab
```

### Scenario 3: Memory Leak

#### Symptoms
- Gradual performance degradation
- OOM killer activating
- Swap usage increasing

#### Response
```bash
# 1. Identify memory consumers
docker stats --no-stream | sort -k4 -hr

# 2. Restart affected services
docker restart $(docker ps --format "{{.Names}}" | grep mosaic)

# 3. Analyze memory patterns
for container in $(docker ps --format "{{.Names}}"); do
    echo "=== $container ==="
    docker exec $container ps aux | sort -k4 -hr | head -5
done

# 4. Apply memory limits
docker update --memory 2g --memory-swap 2g mosaic-gitea
```

### Scenario 4: Security Breach

#### Symptoms
- Unauthorized access attempts
- Suspicious processes
- Modified files
- Unusual network traffic

#### Response
```bash
#!/bin/bash
# security-incident-response.sh

# 1. ISOLATE immediately
iptables -I INPUT -j DROP
iptables -I OUTPUT -m state --state NEW -j DROP

# 2. Preserve evidence
dd if=/dev/sda of=/secure-storage/forensic-image.dd

# 3. Check for compromise
find /var/lib/mosaic -type f -mtime -1 -ls
ps aux | grep -E "(nc|wget|curl)" | grep -v grep
netstat -tulpn | grep ESTABLISHED

# 4. Reset credentials
./rotate-all-secrets.sh --emergency

# 5. Rebuild from clean backup
./security-rebuild.sh
```

## Incident Communication

### Internal Communication Template
```
Subject: [P1] Incident INC-XXXX: Service Outage

Status: [Investigating/Identified/Monitoring/Resolved]
Commander: [Name]
Started: [Time]
Impact: [Description of impact]

Current Status:
- What we know
- What we're doing
- ETA for resolution

Resources:
- Incident Bridge: +1-555-INCIDENT ext XXXX
- Slack: #incident-XXXX
- Wiki: https://wiki/incident/INC-XXXX

Next Update: [Time]
```

### Customer Communication Template
```
Subject: Service Disruption Notification

Dear Customer,

We are currently experiencing technical difficulties affecting [services].

Impact: [User-facing description]
Status: Our team is actively working on resolution
Started: [Time in customer timezone]

We apologize for any inconvenience and will provide updates every [30] minutes.

Updates: https://status.example.com
Support: support@example.com
```

## Post-Incident Procedures

### Immediate (Within 24 hours)
```bash
#!/bin/bash
# post-incident-immediate.sh

INCIDENT_ID=$1

# 1. Ensure stability
./monitor-recovery.sh --duration 2h

# 2. Collect logs
tar -czf /var/log/mosaic/incidents/$INCIDENT_ID/logs.tar.gz \
    /var/log/mosaic/*.log \
    /var/log/syslog \
    /var/log/docker/

# 3. Create timeline
./generate-timeline.sh --incident $INCIDENT_ID > \
    /var/log/mosaic/incidents/$INCIDENT_ID/timeline.md

# 4. Initial report
cat > /var/log/mosaic/incidents/$INCIDENT_ID/initial-report.md <<EOF
# Incident Report: $INCIDENT_ID

## Summary
- Start: $(date)
- End: $(date)
- Duration: XX minutes
- Severity: P1
- Impact: [Affected services and users]

## Timeline
[Generated timeline]

## Initial Findings
[What went wrong]

## Immediate Actions Taken
[What we did]

## Follow-up Required
[What needs to be done]
EOF
```

### Post-Mortem Meeting (Within 5 days)

#### Agenda Template
1. **Timeline Review** (10 min)
   - What happened when
   - Detection to resolution

2. **Root Cause Analysis** (20 min)
   - 5 Whys exercise
   - Contributing factors

3. **What Went Well** (10 min)
   - Effective responses
   - Good decisions

4. **What Could Improve** (15 min)
   - Gaps in monitoring
   - Process improvements

5. **Action Items** (15 min)
   - Preventive measures
   - Owner assignment
   - Due dates

#### 5 Whys Template
```
Problem: Service outage at 2:15 PM

Why? → Database connection pool exhausted
Why? → Application creating too many connections
Why? → Connection leak in new code deployment
Why? → Code review missed the connection handling
Why? → No automated checks for connection leaks

Root Cause: Lack of automated resource leak detection in CI/CD
```

### Action Items Tracking
```yaml
# post-mortem-actions.yml
incident: INC-20240115-1430
actions:
  - id: 1
    description: "Add connection pool monitoring"
    owner: "john.doe"
    due: "2024-01-22"
    status: "in-progress"
    
  - id: 2  
    description: "Implement automatic connection leak detection"
    owner: "jane.smith"
    due: "2024-01-29"
    status: "planned"
    
  - id: 3
    description: "Update deployment checklist"
    owner: "bob.jones"
    due: "2024-01-20"
    status: "complete"
```

## Incident Response Tools

### Monitoring Dashboard
```bash
# Create incident monitoring dashboard
cat > /opt/mosaic/scripts/incident-monitor.sh <<'EOF'
#!/bin/bash
while true; do
    clear
    echo "=== Incident Monitor: $(date) ==="
    echo
    echo "Service Status:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.State}}"
    echo
    echo "Resource Usage:"
    docker stats --no-stream
    echo
    echo "Recent Errors:"
    docker compose logs --tail=10 2>&1 | grep -i error
    sleep 5
done
EOF
```

### Recovery Automation
```python
#!/usr/bin/env python3
# auto-recovery.py

import docker
import time
import logging

client = docker.from_env()

def check_health(container_name):
    try:
        container = client.containers.get(container_name)
        return container.attrs['State']['Health']['Status'] == 'healthy'
    except:
        return False

def restart_unhealthy():
    for container in client.containers.list():
        if not check_health(container.name):
            logging.warning(f"Restarting unhealthy container: {container.name}")
            container.restart()
            time.sleep(30)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    while True:
        restart_unhealthy()
        time.sleep(60)
```

### Incident Analysis Queries

#### PostgreSQL Analysis
```sql
-- Long running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Lock analysis
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

#### Application Log Analysis
```bash
# Error frequency
grep -h ERROR /var/log/mosaic/*.log | 
    awk '{print $1, $2}' | 
    cut -d: -f1-2 | 
    sort | uniq -c | 
    sort -nr | head -20

# Response time analysis
grep "response_time" /var/log/mosaic/api.log | 
    awk '{print $NF}' | 
    sort -n | 
    awk '{
        count[NR] = $1;
        total += $1
    }
    END {
        print "Average:", total/NR;
        print "P50:", count[int(NR*0.5)];
        print "P95:", count[int(NR*0.95)];
        print "P99:", count[int(NR*0.99)]
    }'
```