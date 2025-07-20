---
title: "Backup Strategy Overview"
order: 01
category: "backup-recovery"
tags: ["backup", "disaster-recovery", "data-protection", "operations"]
---

# Backup Strategy Overview

The MosAIc Stack implements a comprehensive backup strategy following industry best practices to ensure data protection and business continuity.

## Backup Philosophy

Our backup strategy adheres to the **3-2-1 Rule**:
- **3** copies of important data (production + 2 backups)
- **2** different storage media types (local disk + cloud/remote)
- **1** offsite backup copy (geographical separation)

This approach ensures protection against:
- Hardware failures
- Data corruption
- Human errors
- Natural disasters
- Cyber attacks
- Site-wide failures

## What Gets Backed Up

### Critical Data Categories

#### 1. Databases
- **PostgreSQL**: Full cluster backups with WAL archiving
  - Gitea database
  - Plane database
  - Woodpecker database
  - Custom application databases
- **MariaDB**: Full database dumps with binary logs
  - BookStack database
  - Additional service databases
- **Redis**: RDB snapshots and AOF logs
  - Session data
  - Cache data
  - Queue data

#### 2. Application Data
- **Gitea**:
  - Git repositories
  - LFS (Large File Storage) data
  - User avatars and attachments
  - Configuration files
- **BookStack**:
  - Uploaded images
  - File attachments
  - Custom themes
  - User content
- **Plane**:
  - Project files
  - Issue attachments
  - User uploads
  - Workspace data
- **Woodpecker**:
  - Build logs
  - Artifacts
  - Pipeline configurations

#### 3. Configuration Files
- Docker compose files
- Environment variables (encrypted)
- SSL/TLS certificates
- Service configurations
- Nginx configurations
- System settings

#### 4. System State
- Docker volumes
- Container configurations
- Network settings
- Firewall rules
- Cron jobs
- System packages list

## Backup Types and Schedule

### Automated Backup Schedule

```yaml
# Daily Schedule (Incremental)
02:00 UTC:
  - Database incremental backups
  - Transaction log backups
  - Configuration snapshots

02:30 UTC:
  - Application data sync
  - File system changes
  - Docker volume updates

03:00 UTC:
  - Configuration backup
  - Certificate backup
  - Environment verification

# Weekly Schedule (Full)
Sunday 01:00 UTC:
  - Full database dumps (all databases)
  - Complete file system backup
  - Full Docker volume snapshots

Sunday 02:00 UTC:
  - Full application data backup
  - Repository compression
  - LFS data archival

Sunday 03:00 UTC:
  - Full system state snapshot
  - Configuration archive
  - Verification run

# Monthly Schedule (Archive)
1st Sunday 00:00 UTC:
  - Create monthly archive
  - Compress all backups
  - Encrypt archive
  - Upload to cold storage
  - Rotate old archives
```

### Backup Types Explained

#### 1. Hot Backups (Online)
No service interruption required:
```bash
# PostgreSQL continuous archiving
pg_basebackup -h localhost -D /backup/postgres/base -U postgres -Ft -z -P -Xs

# MariaDB online backup
mariabackup --backup --user=root --password=$MARIADB_ROOT_PASSWORD --target-dir=/backup/mariadb/

# Redis background save
redis-cli BGSAVE
```

#### 2. Snapshot Backups
Using filesystem or Docker volume snapshots:
```bash
# LVM snapshot creation
lvcreate -L 10G -s -n backup_snapshot /dev/vg_mosaic/lv_data

# ZFS snapshot
zfs snapshot pool/mosaic@backup-$(date +%Y%m%d-%H%M%S)

# Docker volume backup
docker run --rm \
  -v mosaic_gitea_data:/source:ro \
  -v /backup/volumes:/backup \
  alpine tar czf /backup/gitea-data-$(date +%Y%m%d).tar.gz -C /source .
```

#### 3. Application-Level Backups
Using built-in backup features:
```bash
# Gitea integrated backup
docker exec -u git gitea gitea dump -c /data/gitea/conf/app.ini

# BookStack backup
docker exec bookstack php artisan backup:run

# Plane data export
docker exec plane-api python manage.py dumpdata --natural-foreign --natural-primary > plane-backup.json
```

## Storage Architecture

### Storage Locations

```
/opt/mosaic/backups/                    # Local backup root
├── daily/                              # Daily incremental backups
│   ├── postgres/                       # PostgreSQL incrementals
│   │   ├── wal/                       # WAL archives
│   │   └── base/                      # Base backups
│   ├── mariadb/                       # MariaDB incrementals
│   │   ├── binlog/                    # Binary logs
│   │   └── incremental/               # Incremental backups
│   ├── redis/                         # Redis snapshots
│   └── apps/                          # Application data
│       ├── gitea/
│       ├── bookstack/
│       └── plane/
├── weekly/                            # Weekly full backups
│   ├── full-backup-20240115/
│   └── full-backup-20240122/
├── monthly/                           # Monthly archives
│   ├── archive-202401.tar.gz.enc
│   └── archive-202402.tar.gz.enc
└── configs/                           # Configuration backups
    ├── current/                       # Latest configs
    └── history/                       # Config history
```

### Remote Storage Targets

#### Primary Remote Storage (S3-Compatible)
```bash
# S3 bucket structure
s3://mosaic-backups/
├── daily/
├── weekly/
├── monthly/
└── manifests/
```

#### Secondary Remote Storage (SFTP/SSH)
```bash
# Remote server structure
remote-backup-server:/backups/mosaic/
├── mirror/        # Mirror of local backups
├── archives/      # Long-term archives
└── emergency/     # Emergency recovery set
```

#### Cold Storage (Archive)
- AWS Glacier or equivalent
- Google Cloud Archive
- Azure Archive Storage
- Tape libraries (enterprise)

## Retention Policy

| Backup Type | Local Retention | Remote Retention | Archive Retention |
|-------------|-----------------|------------------|-------------------|
| Daily Incremental | 7 days | 14 days | - |
| Weekly Full | 4 weeks | 8 weeks | - |
| Monthly Archive | 3 months | 12 months | 24 months |
| Yearly Archive | 1 year | 2 years | 7 years |
| Configuration | 30 days | 90 days | 1 year |
| Transaction Logs | 3 days | 7 days | - |

### Retention Policy Rules

1. **Daily backups** are kept for quick recovery of recent changes
2. **Weekly backups** provide point-in-time recovery for the past month
3. **Monthly archives** enable recovery from longer-term issues
4. **Yearly archives** meet compliance and audit requirements
5. **Configuration backups** track all system changes
6. **Transaction logs** enable point-in-time recovery between backups

## Quick Start Guide

### 1. Manual Backup Execution

```bash
# Run complete backup
/opt/mosaic/scripts/backup-all.sh

# Backup specific service
/opt/mosaic/scripts/backup-postgres.sh
/opt/mosaic/scripts/backup-gitea.sh

# Backup with custom options
/opt/mosaic/scripts/backup-all.sh --type full --compress --encrypt
```

### 2. Verify Backup Integrity

```bash
# List recent backups
/opt/mosaic/scripts/list-backups.sh --days 7

# Verify specific backup
/opt/mosaic/scripts/verify-backup.sh /opt/mosaic/backups/daily/postgres/backup-20240115.tar.gz

# Run integrity check on all backups
/opt/mosaic/scripts/verify-all-backups.sh --detailed
```

### 3. Enable Automated Backups

```bash
# Install backup cron jobs
sudo /opt/mosaic/scripts/install-backup-cron.sh

# Or use systemd timers (recommended)
sudo systemctl enable mosaic-backup-daily.timer
sudo systemctl enable mosaic-backup-weekly.timer
sudo systemctl enable mosaic-backup-monthly.timer

# Start timers
sudo systemctl start mosaic-backup-daily.timer
sudo systemctl start mosaic-backup-weekly.timer
sudo systemctl start mosaic-backup-monthly.timer
```

## Backup Monitoring

### Health Check Metrics

Monitor these key metrics:
- **backup_last_success_timestamp**: Time of last successful backup
- **backup_duration_seconds**: How long backups take
- **backup_size_bytes**: Size of backup files
- **backup_failure_total**: Count of failed backups
- **backup_storage_used_percent**: Storage utilization

### Alerting Rules

Configure alerts for:
- Backup failures (immediate)
- Missing backups (after grace period)
- Storage space < 20% free
- Backup duration > 2x average
- Verification failures
- Replication lag > 1 hour

### Dashboard Example

```bash
# Check backup status
curl https://monitoring.example.com/api/v1/backup/status

# Response
{
  "status": "healthy",
  "last_backup": "2024-01-15T02:00:00Z",
  "next_backup": "2024-01-16T02:00:00Z",
  "storage_used": "245GB",
  "storage_free": "755GB",
  "recent_failures": 0
}
```

## Security Considerations

### Encryption Standards

All backups are encrypted using:
- **At-rest**: AES-256-CBC encryption
- **In-transit**: TLS 1.3 for transfers
- **Key management**: Separate key storage
- **Key rotation**: Quarterly rotation

### Access Control

- Backup service accounts with minimal permissions
- Multi-factor authentication for backup systems
- Audit logging of all backup access
- Role-based access control (RBAC)
- Network isolation for backup infrastructure

### Encryption Implementation

```bash
# Encrypt backup file
openssl enc -aes-256-cbc -salt -pbkdf2 \
  -in backup.tar.gz \
  -out backup.tar.gz.enc \
  -k "$BACKUP_ENCRYPTION_KEY"

# Decrypt backup file
openssl enc -d -aes-256-cbc -pbkdf2 \
  -in backup.tar.gz.enc \
  -out backup.tar.gz \
  -k "$BACKUP_ENCRYPTION_KEY"

# Using GPG for encryption
gpg --symmetric --cipher-algo AES256 \
  --compress-algo zlib \
  --output backup.tar.gz.gpg \
  backup.tar.gz
```

## Testing and Validation

### Monthly Restore Tests

Regular testing ensures backups are restorable:

1. **Select random backup** from the past week
2. **Restore to test environment**
3. **Verify data integrity**
4. **Test application functionality**
5. **Document results**
6. **Update procedures if needed**

### Quarterly Disaster Recovery Drills

Full DR testing includes:
1. **Simulate failure scenario**
2. **Execute recovery procedures**
3. **Measure RTO/RPO achievement**
4. **Identify improvement areas**
5. **Update documentation**
6. **Train team members**

### Validation Checklist

- [ ] All critical data is included in backups
- [ ] Backups complete within maintenance window
- [ ] Encryption keys are accessible and working
- [ ] Remote replication is functioning
- [ ] Restore procedures are documented
- [ ] Team members know their roles
- [ ] Contact information is current
- [ ] Compliance requirements are met

## Best Practices

1. **Test Regularly**
   - Monthly restore tests
   - Quarterly DR drills
   - Annual full recovery exercise

2. **Monitor Continuously**
   - Real-time backup status
   - Alert on failures immediately
   - Track trends and patterns

3. **Document Everything**
   - Keep runbooks updated
   - Document all procedures
   - Maintain decision logs

4. **Automate Processes**
   - Reduce human error
   - Ensure consistency
   - Enable rapid recovery

5. **Verify Integrity**
   - Check backup validity
   - Test restore procedures
   - Validate data completeness

6. **Secure Storage**
   - Encrypt sensitive data
   - Control access strictly
   - Audit all activities

7. **Plan for Growth**
   - Scale storage proactively
   - Adjust retention as needed
   - Optimize backup windows

8. **Practice Recovery**
   - Regular DR drills
   - Cross-train team members
   - Update procedures based on lessons learned

---

Next steps:
- [Backup Procedures](./02-backup-procedures.md)
- [Restore Procedures](./03-restore-procedures.md)
- [Disaster Recovery Plan](./04-disaster-recovery.md)
- [Point-in-Time Recovery](./05-point-in-time-recovery.md)