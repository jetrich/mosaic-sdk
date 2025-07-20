---
title: "Runbook: Procedure Name"
order: 01
category: "runbooks"
tags: ["runbook", "operations", "incident-type"]
last_updated: "2025-01-19"
author: "system"
severity: "critical"  # critical, high, medium, low
estimated_time: "30 minutes"
status: "published"
---

# Runbook: Procedure Name

## Overview

**Purpose**: Brief description of when and why this runbook is used.  
**Severity**: Critical/High/Medium/Low  
**Estimated Time**: 30 minutes  
**On-Call Required**: Yes/No  

## When to Use This Runbook

Use this runbook when:
- Condition 1 is met
- Condition 2 occurs
- Alert X fires

Do NOT use this runbook for:
- Situation Y (use [Other Runbook](./other-runbook.md) instead)
- Situation Z

## Prerequisites

### Access Requirements
- [ ] SSH access to production servers
- [ ] Admin access to service dashboard
- [ ] Database read/write permissions
- [ ] AWS/GCP console access

### Tools Required
- `kubectl` v1.28+
- `psql` client
- `redis-cli`
- Company VPN connection

### Knowledge Required
- Basic understanding of Component X
- Familiarity with Service Y
- Database query skills

## Pre-Checks

Before proceeding, verify:

1. **Check current system status**
   ```bash
   kubectl get pods -n production
   ```
   Expected output: All pods should be Running

2. **Verify monitoring alerts**
   - Check [Grafana Dashboard](https://monitor.mosaicstack.dev/d/system-health)
   - Confirm alert details match this scenario

3. **Check recent changes**
   ```bash
   git log --oneline -10
   ```
   Look for recent deployments or configuration changes

## Procedure

### Step 1: Identify the Problem

1.1. **Check service logs**
```bash
kubectl logs -n production deployment/service-name --tail=100
```

1.2. **Check error rates**
```bash
curl -s http://metrics.internal/api/v1/errors | jq .rate
```

1.3. **Document findings**
- Error type: _______________
- Error rate: _______________
- Started at: _______________

### Step 2: Immediate Mitigation

2.1. **If high error rate (>50%)**
```bash
# Scale up replicas
kubectl scale deployment/service-name --replicas=10 -n production
```

2.2. **If database connection errors**
```bash
# Check connection pool
psql -h db.internal -U admin -c "SELECT count(*) FROM pg_stat_activity;"
```

2.3. **Enable circuit breaker** (if not auto-enabled)
```bash
curl -X POST http://service.internal/admin/circuit-breaker/enable
```

### Step 3: Root Cause Analysis

3.1. **Collect diagnostics**
```bash
# Generate diagnostic bundle
./scripts/collect-diagnostics.sh --service=service-name --duration=1h
```

3.2. **Check dependencies**
- [ ] Database: `psql -h db.internal -c "\l"`
- [ ] Redis: `redis-cli ping`
- [ ] External APIs: `curl -s http://api.external/health`

3.3. **Review recent deployments**
```bash
kubectl rollout history deployment/service-name -n production
```

### Step 4: Resolution

Based on root cause:

#### Option A: Rollback Deployment
```bash
# Rollback to previous version
kubectl rollout undo deployment/service-name -n production

# Verify rollback
kubectl rollout status deployment/service-name -n production
```

#### Option B: Fix Configuration
```bash
# Update configmap
kubectl edit configmap/service-config -n production

# Restart pods to pick up changes
kubectl rollout restart deployment/service-name -n production
```

#### Option C: Database Issues
```sql
-- Kill long-running queries
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'active' 
  AND query_start < now() - interval '5 minutes';

-- Vacuum tables if needed
VACUUM ANALYZE table_name;
```

### Step 5: Verification

5.1. **Verify service health**
```bash
# Check pod status
kubectl get pods -n production -l app=service-name

# Check endpoints
curl -s http://service.internal/health | jq .
```

5.2. **Monitor error rates**
- Watch [Grafana Dashboard](https://monitor.mosaicstack.dev/d/service-health) for 10 minutes
- Confirm error rate returns to normal (<1%)

5.3. **Test functionality**
```bash
# Run smoke tests
./scripts/smoke-test.sh --service=service-name
```

## Post-Incident Actions

### Immediate (Within 1 hour)
1. **Update incident ticket** with:
   - Root cause
   - Actions taken
   - Current status

2. **Notify stakeholders**
   ```bash
   ./scripts/notify-stakeholders.sh --incident-id=INC-12345 --status=resolved
   ```

3. **Update status page**
   - Mark incident as resolved
   - Add customer-facing explanation

### Follow-up (Within 24 hours)
1. **Create post-mortem document**
   - Use [template](../templates/post-mortem-template.md)
   - Schedule review meeting

2. **File improvement tickets**
   - Automation opportunities
   - Monitoring gaps
   - Process improvements

3. **Update this runbook**
   - Add new scenarios discovered
   - Clarify unclear steps
   - Update time estimates

## Escalation

If unable to resolve within 30 minutes:

1. **Page senior engineer**
   - On-call phone: +1-555-ONCALL
   - Slack: #incidents-critical

2. **Engage vendor support** (if applicable)
   - Support portal: https://vendor.com/support
   - Account #: 12345

3. **Consider emergency maintenance**
   - Get approval from: Director of Engineering
   - Use [maintenance runbook](./emergency-maintenance.md)

## Common Issues

### Issue: "Connection pool exhausted"
**Quick Fix**: 
```bash
kubectl exec -it deployment/service-name -- kill -USR1 1
```
This triggers connection pool reset.

### Issue: "Memory leak detected"
**Quick Fix**: 
```bash
kubectl set env deployment/service-name GOGC=50 -n production
kubectl rollout restart deployment/service-name -n production
```

### Issue: "Disk space full"
**Quick Fix**: 
```bash
# Clean up old logs
find /var/log/app -mtime +7 -delete

# Clean docker images
docker system prune -af
```

## Related Documentation

- [Architecture Overview](../../architecture/system-design/01-overview.md)
- [Service Documentation](../../services/service-name/01-overview.md)
- [Monitoring Guide](../monitoring/01-setup.md)
- [Incident Response Process](./00-incident-response-overview.md)

## Runbook Metadata

- **Version**: 1.0
- **Last Tested**: 2025-01-19
- **Owner**: Platform Team
- **Review Frequency**: Monthly

---

*If you find issues with this runbook, please update it immediately and notify the team.*