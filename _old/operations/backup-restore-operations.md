# Backup and Restore Operations

## Backup Strategy Overview

### Backup Schedule
- **Full Backups**: Weekly (Sunday 2:00 AM)
- **Incremental Backups**: Daily (2:00 AM)
- **Transaction Logs**: Every 15 minutes
- **Configuration Backups**: On change + daily

### Retention Policy
- **Daily Backups**: 7 days
- **Weekly Backups**: 4 weeks
- **Monthly Backups**: 12 months
- **Yearly Backups**: 5 years

## Automated Backup Procedures

### Complete Stack Backup
```bash
#!/bin/bash
# /opt/mosaic/scripts/backup-all.sh

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_ROOT="/var/backups/mosaic"
BACKUP_DIR="${BACKUP_ROOT}/${BACKUP_DATE}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Backup databases
./backup-postgres.sh "${BACKUP_DIR}"
./backup-mariadb.sh "${BACKUP_DIR}"
./backup-redis.sh "${BACKUP_DIR}"

# Backup application data
./backup-gitea.sh "${BACKUP_DIR}"
./backup-plane.sh "${BACKUP_DIR}"
./backup-bookstack.sh "${BACKUP_DIR}"

# Backup configurations
./backup-configs.sh "${BACKUP_DIR}"

# Create manifest
./create-manifest.sh "${BACKUP_DIR}"

# Compress and encrypt
tar -czf "${BACKUP_DIR}.tar.gz" -C "${BACKUP_ROOT}" "${BACKUP_DATE}"
gpg --encrypt --recipient backup@example.com "${BACKUP_DIR}.tar.gz"

# Upload to remote storage
rclone copy "${BACKUP_DIR}.tar.gz.gpg" remote:mosaic-backups/

# Cleanup local files older than 7 days
find "${BACKUP_ROOT}" -name "*.tar.gz*" -mtime +7 -delete
```

### Database Backup Procedures

#### PostgreSQL Backup
```bash
#!/bin/bash
# backup-postgres.sh

BACKUP_DIR=$1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Dump all databases
docker exec mosaic-postgres pg_dumpall -U postgres > "${BACKUP_DIR}/postgres_all_${TIMESTAMP}.sql"

# Individual database dumps
for db in gitea plane woodpecker; do
    docker exec mosaic-postgres pg_dump -U postgres -d $db -F custom -f "/tmp/${db}.dump"
    docker cp mosaic-postgres:/tmp/${db}.dump "${BACKUP_DIR}/${db}_${TIMESTAMP}.dump"
done

# Backup roles and permissions
docker exec mosaic-postgres psql -U postgres -c "\du+" > "${BACKUP_DIR}/postgres_roles_${TIMESTAMP}.txt"

# Compress SQL dump
gzip "${BACKUP_DIR}/postgres_all_${TIMESTAMP}.sql"
```

#### MariaDB Backup
```bash
#!/bin/bash
# backup-mariadb.sh

BACKUP_DIR=$1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Full backup with mysqldump
docker exec mosaic-mariadb mysqldump \
    --all-databases \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    -u root -p${MARIADB_ROOT_PASSWORD} \
    > "${BACKUP_DIR}/mariadb_all_${TIMESTAMP}.sql"

# Backup individual databases
docker exec mosaic-mariadb mysqldump \
    --single-transaction \
    -u root -p${MARIADB_ROOT_PASSWORD} \
    bookstack > "${BACKUP_DIR}/bookstack_${TIMESTAMP}.sql"

# Compress
gzip "${BACKUP_DIR}/"*.sql
```

#### Redis Backup
```bash
#!/bin/bash
# backup-redis.sh

BACKUP_DIR=$1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Trigger backup
docker exec mosaic-redis redis-cli BGSAVE

# Wait for completion
while [ $(docker exec mosaic-redis redis-cli LASTSAVE) -eq $(docker exec mosaic-redis redis-cli LASTSAVE) ]; do
    sleep 1
done

# Copy dump file
docker cp mosaic-redis:/data/dump.rdb "${BACKUP_DIR}/redis_${TIMESTAMP}.rdb"

# Also export as commands for portability
docker exec mosaic-redis redis-cli --rdb /tmp/redis-backup.rdb
docker cp mosaic-redis:/tmp/redis-backup.rdb "${BACKUP_DIR}/redis_portable_${TIMESTAMP}.rdb"
```

### Application Data Backup

#### Gitea Backup
```bash
#!/bin/bash
# backup-gitea.sh

BACKUP_DIR=$1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Use Gitea's built-in backup
docker exec -u git gitea gitea dump -c /data/gitea/conf/app.ini -w /tmp -t /tmp

# Copy backup file
docker cp gitea:/tmp/gitea-dump-*.zip "${BACKUP_DIR}/gitea_${TIMESTAMP}.zip"

# Backup repositories separately
tar -czf "${BACKUP_DIR}/gitea_repos_${TIMESTAMP}.tar.gz" -C /var/lib/mosaic gitea/git/repositories

# Backup LFS data
tar -czf "${BACKUP_DIR}/gitea_lfs_${TIMESTAMP}.tar.gz" -C /var/lib/mosaic gitea/git/lfs
```

#### Plane Backup
```bash
#!/bin/bash
# backup-plane.sh

BACKUP_DIR=$1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup uploaded files
tar -czf "${BACKUP_DIR}/plane_media_${TIMESTAMP}.tar.gz" -C /var/lib/mosaic plane/media

# Backup static files
tar -czf "${BACKUP_DIR}/plane_static_${TIMESTAMP}.tar.gz" -C /var/lib/mosaic plane/static

# Export workspace data
docker exec plane-api python manage.py dumpdata \
    --exclude contenttypes \
    --exclude auth.permission \
    > "${BACKUP_DIR}/plane_data_${TIMESTAMP}.json"
```

## Restore Procedures

### Complete Stack Restore
```bash
#!/bin/bash
# restore-all.sh

BACKUP_DATE=$1
BACKUP_ROOT="/var/backups/mosaic"
BACKUP_DIR="${BACKUP_ROOT}/${BACKUP_DATE}"

if [ ! -d "${BACKUP_DIR}" ]; then
    # Download from remote if not local
    rclone copy remote:mosaic-backups/${BACKUP_DATE}.tar.gz.gpg .
    gpg --decrypt ${BACKUP_DATE}.tar.gz.gpg | tar -xzf - -C "${BACKUP_ROOT}"
fi

# Stop all services
docker compose -f deployment/docker-compose.production.yml down
docker compose -f deployment/gitea/docker-compose.yml down
docker compose -f deployment/services/plane/docker-compose.yml down

# Restore databases
./restore-postgres.sh "${BACKUP_DIR}"
./restore-mariadb.sh "${BACKUP_DIR}"
./restore-redis.sh "${BACKUP_DIR}"

# Restore application data
./restore-gitea.sh "${BACKUP_DIR}"
./restore-plane.sh "${BACKUP_DIR}"
./restore-bookstack.sh "${BACKUP_DIR}"

# Restore configurations
./restore-configs.sh "${BACKUP_DIR}"

# Start services
./startup-all.sh

# Verify restore
./verify-restore.sh
```

### Database Restore Procedures

#### PostgreSQL Restore
```bash
#!/bin/bash
# restore-postgres.sh

BACKUP_DIR=$1

# Start only PostgreSQL
docker compose -f deployment/docker-compose.production.yml up -d postgres
sleep 10

# Drop existing databases (careful!)
for db in gitea plane woodpecker; do
    docker exec mosaic-postgres dropdb -U postgres --if-exists $db
done

# Restore from full dump
gunzip -c "${BACKUP_DIR}"/postgres_all_*.sql.gz | docker exec -i mosaic-postgres psql -U postgres

# Or restore individual databases
for db in gitea plane woodpecker; do
    if [ -f "${BACKUP_DIR}/${db}_"*.dump ]; then
        docker exec mosaic-postgres createdb -U postgres $db
        docker cp "${BACKUP_DIR}/${db}_"*.dump mosaic-postgres:/tmp/${db}.dump
        docker exec mosaic-postgres pg_restore -U postgres -d $db /tmp/${db}.dump
    fi
done
```

#### MariaDB Restore
```bash
#!/bin/bash
# restore-mariadb.sh

BACKUP_DIR=$1

# Start MariaDB
docker compose -f deployment/docker-compose.production.yml up -d mariadb
sleep 10

# Restore from dump
gunzip -c "${BACKUP_DIR}"/mariadb_all_*.sql.gz | \
    docker exec -i mosaic-mariadb mysql -u root -p${MARIADB_ROOT_PASSWORD}

# Verify databases
docker exec mosaic-mariadb mysql -u root -p${MARIADB_ROOT_PASSWORD} -e "SHOW DATABASES"
```

#### Redis Restore
```bash
#!/bin/bash
# restore-redis.sh

BACKUP_DIR=$1

# Stop Redis
docker compose -f deployment/docker-compose.production.yml stop redis

# Copy backup file
docker cp "${BACKUP_DIR}"/redis_*.rdb mosaic-redis:/data/dump.rdb

# Start Redis
docker compose -f deployment/docker-compose.production.yml up -d redis

# Verify
docker exec mosaic-redis redis-cli ping
```

## Point-in-Time Recovery

### PostgreSQL PITR
```bash
# Configure continuous archiving in postgresql.conf
archive_mode = on
archive_command = 'test ! -f /var/lib/postgresql/archive/%f && cp %p /var/lib/postgresql/archive/%f'

# Restore to specific time
pg_basebackup -D /tmp/recovery -F tar -x
echo "recovery_target_time = '2024-01-15 14:30:00'" >> /tmp/recovery/recovery.conf
```

### Transaction Log Replay
```bash
# Apply transaction logs after base restore
for logfile in "${BACKUP_DIR}"/pg_xlog_*.tar.gz; do
    tar -xzf "$logfile" -C /var/lib/postgresql/data/pg_wal/
done
```

## Backup Verification

### Automated Verification
```bash
#!/bin/bash
# verify-backup.sh

BACKUP_DIR=$1
VERIFY_DIR="/tmp/verify_$$"
mkdir -p "${VERIFY_DIR}"

# Test PostgreSQL dumps
for dump in "${BACKUP_DIR}"/*.dump; do
    pg_restore --list "$dump" > /dev/null || echo "ERROR: $dump is corrupted"
done

# Test tar archives
for archive in "${BACKUP_DIR}"/*.tar.gz; do
    tar -tzf "$archive" > /dev/null || echo "ERROR: $archive is corrupted"
done

# Test SQL dumps
for sql in "${BACKUP_DIR}"/*.sql.gz; do
    gunzip -t "$sql" || echo "ERROR: $sql is corrupted"
done

# Cleanup
rm -rf "${VERIFY_DIR}"
```

### Restore Testing
```bash
# Monthly restore test to separate environment
./restore-all.sh --target test-environment --backup-date $LATEST_BACKUP
./run-smoke-tests.sh test-environment
```

## Disaster Recovery Procedures

### Complete System Recovery
1. **Provision new infrastructure**
2. **Install Docker and dependencies**
3. **Clone mosaic-sdk repository**
4. **Restore from latest backup**
5. **Update DNS records**
6. **Verify all services**

### Data Center Failover
```bash
#!/bin/bash
# failover-to-dr.sh

# Update DNS to point to DR site
./update-dns.sh --target dr

# Restore latest backup at DR site
ssh dr-server "cd /opt/mosaic && ./restore-all.sh --latest"

# Start services at DR
ssh dr-server "cd /opt/mosaic && ./startup-all.sh"

# Verify DR site
./verify-dr-site.sh
```

## Backup Monitoring

### Backup Job Monitoring
```bash
# Check last backup status
grep "Backup completed" /var/log/mosaic/backup.log | tail -1

# Alert on backup failure
if ! ./check-backup-status.sh; then
    ./send-alert.sh "Backup failed: $(date)"
fi
```

### Storage Monitoring
```bash
# Check backup storage usage
df -h /var/backups/mosaic
rclone size remote:mosaic-backups

# Alert on low space
USAGE=$(df /var/backups/mosaic | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $USAGE -gt 80 ]; then
    ./send-alert.sh "Backup storage above 80%"
fi
```