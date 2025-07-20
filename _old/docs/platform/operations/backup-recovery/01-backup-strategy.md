---
title: "01 Backup Strategy"
order: 01
category: "backup-recovery"
tags: ["backup-recovery", "operations", "documentation"]
last_updated: "2025-01-19"
author: "migration"
version: "1.0"
status: "published"
---
# Backup Overview

The MosAIc Stack implements a comprehensive backup strategy to protect your data and ensure business continuity.

## Backup Philosophy

Our backup strategy follows the 3-2-1 rule:
- **3** copies of important data
- **2** different storage media types
- **1** offsite backup copy

## What Gets Backed Up

### Databases
- **PostgreSQL**: Full cluster backups with WAL archiving
- **MariaDB**: Full database dumps with binary logs
- **Redis**: RDB snapshots and AOF logs

### Application Data
- **Gitea**: Repositories, LFS data, configurations
- **BookStack**: Attachments, images, themes
- **Plane**: Uploaded files, user content
- **Woodpecker**: Build logs, artifacts

### Configurations
- Docker compose files
- Environment variables (encrypted)
- SSL certificates
- Service configurations

## Backup Schedule

### Automated Backups
```
Daily (Incremental):
- 02:00 UTC - Database incremental
- 02:30 UTC - Application data sync
- 03:00 UTC - Configuration backup

Weekly (Full):
- Sunday 01:00 UTC - Full database dumps
- Sunday 02:00 UTC - Full application backup
- Sunday 03:00 UTC - Full system snapshot

Monthly (Archive):
- 1st Sunday - Create monthly archive
- Compress and encrypt
- Upload to cold storage
```

## Backup Types

### 1. Hot Backups (Online)
No downtime required:
```bash
# PostgreSQL continuous archiving
pg_basebackup -D /backup/postgres/base -Ft -z -P

# MariaDB online backup
mariabackup --backup --target-dir=/backup/mariadb/

# Redis background save
redis-cli BGSAVE
```

### 2. Snapshot Backups
Using filesystem or volume snapshots:
```bash
# LVM snapshot
lvcreate -L 10G -s -n backup_snapshot /dev/vg/data

# ZFS snapshot
zfs snapshot pool/data@backup-$(date +%Y%m%d)

# Docker volume backup
docker run --rm -v mosaic_gitea_data:/data -v /backup:/backup alpine tar czf /backup/gitea-data.tar.gz /data
```

### 3. Application-Level Backups
Using built-in backup features:
```bash
# Gitea backup
docker exec mosaic-gitea gitea dump -c /data/gitea/conf/app.ini

# BookStack backup
docker exec mosaic-bookstack php artisan backup:run

# Plane export
docker exec mosaic-plane-api python manage.py dumpdata > plane-backup.json
```

## Storage Locations

### Local Storage
```
/opt/mosaic/backups/
├── daily/
│   ├── postgres/
│   ├── mariadb/
│   ├── redis/
│   └── apps/
├── weekly/
├── monthly/
└── configs/
```

### Remote Storage
- **Primary**: S3-compatible object storage
- **Secondary**: Remote server via rsync
- **Archive**: Glacier or cold storage

## Retention Policy

| Backup Type | Retention Period | Storage Location |
|-------------|------------------|------------------|
| Daily | 7 days | Local + Remote |
| Weekly | 4 weeks | Local + Remote |
| Monthly | 12 months | Remote + Archive |
| Yearly | 7 years | Archive only |

## Quick Start

### 1. Run Manual Backup
```bash
# Backup all services
./scripts/backup-all.sh

# Backup specific service
./scripts/backup-postgres.sh
./scripts/backup-gitea.sh
```

### 2. Verify Backup
```bash
# List recent backups
./scripts/list-backups.sh

# Verify backup integrity
./scripts/verify-backup.sh /opt/mosaic/backups/daily/postgres/latest.tar.gz
```

### 3. Schedule Automated Backups
```bash
# Install backup cron jobs
./scripts/install-backup-cron.sh

# Or use systemd timers
sudo systemctl enable mosaic-backup.timer
sudo systemctl start mosaic-backup.timer
```

## Backup Scripts

### backup-all.sh
```bash
#!/bin/bash
# Main backup orchestrator

BACKUP_DIR="/opt/mosaic/backups/daily/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

echo "Starting MosAIc Stack backup..."

# Backup databases
./backup-postgres.sh "$BACKUP_DIR"
./backup-mariadb.sh "$BACKUP_DIR"
./backup-redis.sh "$BACKUP_DIR"

# Backup applications
./backup-gitea.sh "$BACKUP_DIR"
./backup-bookstack.sh "$BACKUP_DIR"
./backup-plane.sh "$BACKUP_DIR"

# Backup configurations
./backup-configs.sh "$BACKUP_DIR"

# Sync to remote
./sync-to-remote.sh "$BACKUP_DIR"

echo "Backup completed successfully!"
```

## Monitoring Backups

### Health Checks
```bash
# Check backup status
curl https://monitoring.your-domain.com/api/v1/backup/status

# Prometheus metrics
backup_last_success_timestamp
backup_duration_seconds
backup_size_bytes
backup_failure_total
```

### Alerts
Configure alerts for:
- Backup failures
- Missing backups
- Storage space issues
- Verification failures

## Testing Backups

Regular testing ensures backups are restorable:

### Monthly Restore Test
1. Spin up test environment
2. Restore from backup
3. Verify data integrity
4. Document results

### Disaster Recovery Drill
Quarterly full DR test:
1. Simulate failure scenario
2. Execute recovery procedure
3. Measure RTO/RPO
4. Update documentation

## Security Considerations

### Encryption
- Encrypt backups at rest
- Use strong encryption keys
- Rotate keys regularly
- Store keys separately

### Access Control
- Limit backup access
- Use service accounts
- Audit access logs
- Implement MFA

### Example Encryption
```bash
# Encrypt backup
openssl enc -aes-256-cbc -salt -in backup.tar.gz -out backup.tar.gz.enc

# Decrypt backup
openssl enc -d -aes-256-cbc -in backup.tar.gz.enc -out backup.tar.gz
```

## Best Practices

1. **Test Regularly**: Monthly restore tests
2. **Monitor Continuously**: Alert on failures
3. **Document Everything**: Keep runbooks updated
4. **Automate Process**: Reduce human error
5. **Verify Integrity**: Check backup validity
6. **Secure Storage**: Encrypt sensitive data
7. **Plan for Growth**: Scale storage accordingly
8. **Practice Recovery**: Regular DR drills

---

Next steps:
- [PostgreSQL Backup](./02-postgres-backup.md)
- [MariaDB Backup](./03-mariadb-backup.md)
- [Application Backup](./04-application-backup.md)
- [Restore Procedures](../restore/01-restore-overview.md)