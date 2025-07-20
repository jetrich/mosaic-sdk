---
title: "Restore Procedures"
order: 03
category: "backup-recovery"
tags: ["restore", "recovery", "procedures", "disaster-recovery"]
---

# Restore Procedures

Comprehensive procedures for restoring the MosAIc Stack from backups, including full stack recovery and individual service restoration.

## Restore Strategy Overview

### Pre-Restore Checklist

Before initiating any restore operation:

- [ ] Identify the exact backup to restore from
- [ ] Verify backup integrity and availability
- [ ] Document the reason for restore
- [ ] Notify affected users/teams
- [ ] Prepare restore environment
- [ ] Have rollback plan ready
- [ ] Ensure sufficient disk space
- [ ] Verify network connectivity
- [ ] Check service dependencies

### Restore Types

1. **Complete Stack Restore**: Full system recovery from backup
2. **Service-Specific Restore**: Individual service restoration
3. **Point-in-Time Recovery**: Restore to specific timestamp
4. **Partial Data Restore**: Selective data recovery
5. **Disaster Recovery**: Complete infrastructure rebuild

## Complete Stack Restore

### Full System Recovery Procedure

Master script for complete stack restoration:

```bash
#!/bin/bash
# /opt/mosaic/scripts/restore-all.sh

set -euo pipefail

# Configuration
BACKUP_DATE=${1:-$(cat /opt/mosaic/backups/.last-successful-backup)}
BACKUP_ROOT="/opt/mosaic/backups"
RESTORE_LOG="/var/log/mosaic/restore-$(date +%Y%m%d_%H%M%S).log"

# Validate inputs
if [ -z "$BACKUP_DATE" ]; then
    echo "ERROR: No backup date provided and no last successful backup found"
    exit 1
fi

# Setup logging
exec 1> >(tee -a "${RESTORE_LOG}")
exec 2>&1

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

# Find backup location
if [ -d "${BACKUP_ROOT}/daily/${BACKUP_DATE}" ]; then
    BACKUP_DIR="${BACKUP_ROOT}/daily/${BACKUP_DATE}"
elif [ -f "${BACKUP_ROOT}/weekly/${BACKUP_DATE}.tar.gz.gpg" ]; then
    log "Extracting weekly backup"
    # Decrypt and extract
    gpg --batch --yes --passphrase-file /etc/mosaic/.backup-key \
        --decrypt "${BACKUP_ROOT}/weekly/${BACKUP_DATE}.tar.gz.gpg" | \
        tar -xzf - -C "${BACKUP_ROOT}/weekly/"
    BACKUP_DIR="${BACKUP_ROOT}/weekly/${BACKUP_DATE}"
else
    # Try remote storage
    log "Backup not found locally, checking remote storage"
    aws s3 sync "s3://mosaic-backups/daily/${BACKUP_DATE}/" \
        "${BACKUP_ROOT}/restore-tmp/${BACKUP_DATE}/"
    BACKUP_DIR="${BACKUP_ROOT}/restore-tmp/${BACKUP_DATE}"
fi

if [ ! -d "$BACKUP_DIR" ]; then
    error_exit "Backup directory not found: ${BACKUP_DATE}"
fi

log "Starting complete stack restore from: ${BACKUP_DIR}"

# Phase 1: Stop all services
log "Phase 1: Stopping all services"
cd /home/jwoltje/src/mosaic-sdk
docker compose -f deployment/docker-compose.production.yml down
docker compose -f deployment/gitea/docker-compose.yml down
docker compose -f deployment/services/plane/docker-compose.yml down
docker compose -f deployment/docker-compose.bookstack-mariadb.yml down
docker compose -f deployment/services/woodpecker/docker-compose.yml down
docker compose -f deployment/docker-compose.monitoring.yml down

# Phase 2: Restore databases
log "Phase 2: Restoring databases"
./restore-postgres.sh "${BACKUP_DIR}/databases" || error_exit "PostgreSQL restore failed"
./restore-mariadb.sh "${BACKUP_DIR}/databases" || error_exit "MariaDB restore failed"
./restore-redis.sh "${BACKUP_DIR}/databases" || error_exit "Redis restore failed"

# Phase 3: Restore application data
log "Phase 3: Restoring application data"
./restore-gitea.sh "${BACKUP_DIR}/applications" || error_exit "Gitea restore failed"
./restore-bookstack.sh "${BACKUP_DIR}/applications" || error_exit "BookStack restore failed"
./restore-plane.sh "${BACKUP_DIR}/applications" || error_exit "Plane restore failed"
./restore-woodpecker.sh "${BACKUP_DIR}/applications" || error_exit "Woodpecker restore failed"

# Phase 4: Restore configurations
log "Phase 4: Restoring configurations"
./restore-configs.sh "${BACKUP_DIR}/configs" || error_exit "Configuration restore failed"

# Phase 5: Start services
log "Phase 5: Starting services"
./startup-all.sh || error_exit "Service startup failed"

# Phase 6: Verify restoration
log "Phase 6: Verifying restoration"
./verify-restore.sh || log "WARNING: Some verification checks failed"

# Cleanup temporary files
if [[ "$BACKUP_DIR" == *"restore-tmp"* ]]; then
    rm -rf "$BACKUP_DIR"
fi

log "Complete stack restore finished successfully!"
log "Restore log available at: ${RESTORE_LOG}"
```

## Database Restore Procedures

### PostgreSQL Restore

Complete PostgreSQL restoration with verification:

```bash
#!/bin/bash
# /opt/mosaic/scripts/restore-postgres.sh

set -euo pipefail

BACKUP_DIR=$1
PG_CONTAINER="mosaic-postgres"

log() {
    echo "[PostgreSQL Restore] $1"
}

# Start PostgreSQL container only
log "Starting PostgreSQL container"
cd /home/jwoltje/src/mosaic-sdk
docker compose -f deployment/docker-compose.production.yml up -d postgres

# Wait for PostgreSQL to be ready
log "Waiting for PostgreSQL to be ready"
until docker exec ${PG_CONTAINER} pg_isready -U postgres; do
    sleep 2
done

# Find latest backup files
LATEST_BASE=$(find "${BACKUP_DIR}/postgres" -name "base_*.tar.gz" -type f | sort -r | head -1)
LATEST_GLOBALS=$(find "${BACKUP_DIR}/postgres" -name "globals_*.sql" -type f | sort -r | head -1)

if [ -z "$LATEST_BASE" ]; then
    log "ERROR: No base backup found"
    exit 1
fi

# Stop PostgreSQL for base restore
log "Stopping PostgreSQL for base restore"
docker compose -f deployment/docker-compose.production.yml stop postgres

# Backup current data directory (safety measure)
log "Backing up current data directory"
if [ -d "/var/lib/mosaic/postgres/data" ]; then
    mv /var/lib/mosaic/postgres/data /var/lib/mosaic/postgres/data.old.$(date +%Y%m%d_%H%M%S)
fi

# Extract base backup
log "Extracting base backup"
mkdir -p /var/lib/mosaic/postgres/data
tar -xzf "$LATEST_BASE" -C /var/lib/mosaic/postgres/data/
chown -R 999:999 /var/lib/mosaic/postgres/data

# Start PostgreSQL
log "Starting PostgreSQL with restored data"
docker compose -f deployment/docker-compose.production.yml up -d postgres

# Wait for PostgreSQL
until docker exec ${PG_CONTAINER} pg_isready -U postgres; do
    sleep 2
done

# Restore global objects if available
if [ -f "$LATEST_GLOBALS" ]; then
    log "Restoring global objects"
    docker exec -i ${PG_CONTAINER} psql -U postgres < "$LATEST_GLOBALS"
fi

# Alternative: Restore from individual database dumps
if [ -d "${BACKUP_DIR}/postgres/dumps" ]; then
    log "Restoring individual database dumps"
    
    # Drop and recreate databases
    for dump_file in "${BACKUP_DIR}/postgres/dumps"/*.dump; do
        if [ -f "$dump_file" ]; then
            db_name=$(basename "$dump_file" | cut -d'_' -f1)
            log "Restoring database: $db_name"
            
            # Drop existing database
            docker exec ${PG_CONTAINER} dropdb -U postgres --if-exists "$db_name"
            
            # Create new database
            docker exec ${PG_CONTAINER} createdb -U postgres "$db_name"
            
            # Restore dump
            docker cp "$dump_file" ${PG_CONTAINER}:/tmp/
            docker exec ${PG_CONTAINER} pg_restore -U postgres -d "$db_name" \
                -v "/tmp/$(basename "$dump_file")"
            
            # Cleanup
            docker exec ${PG_CONTAINER} rm "/tmp/$(basename "$dump_file")"
        fi
    done
fi

# Verify restoration
log "Verifying restoration"
docker exec ${PG_CONTAINER} psql -U postgres -c "\l" | grep -E "(gitea|plane|woodpecker)"

# Run ANALYZE to update statistics
log "Updating database statistics"
for db in gitea plane woodpecker; do
    docker exec ${PG_CONTAINER} psql -U postgres -d "$db" -c "ANALYZE;"
done

log "PostgreSQL restore completed successfully"
```

### MariaDB Restore

MariaDB restoration procedure:

```bash
#!/bin/bash
# /opt/mosaic/scripts/restore-mariadb.sh

set -euo pipefail

BACKUP_DIR=$1
MARIADB_CONTAINER="mosaic-mariadb"

log() {
    echo "[MariaDB Restore] $1"
}

# Start MariaDB container
log "Starting MariaDB container"
cd /home/jwoltje/src/mosaic-sdk
docker compose -f deployment/docker-compose.production.yml up -d mariadb

# Wait for MariaDB to be ready
log "Waiting for MariaDB to be ready"
until docker exec ${MARIADB_CONTAINER} mysqladmin ping -u root -p${MARIADB_ROOT_PASSWORD} --silent; do
    sleep 2
done

# Find latest backup
LATEST_DUMP=$(find "${BACKUP_DIR}/mariadb/dumps" -name "all_databases_*.sql.gz" -type f | sort -r | head -1)

if [ -z "$LATEST_DUMP" ]; then
    log "ERROR: No database dump found"
    exit 1
fi

# Restore from dump
log "Restoring from dump: $(basename "$LATEST_DUMP")"
gunzip -c "$LATEST_DUMP" | docker exec -i ${MARIADB_CONTAINER} mysql -u root -p${MARIADB_ROOT_PASSWORD}

# Alternative: Restore from physical backup if available
MARIABACKUP=$(find "${BACKUP_DIR}/mariadb" -name "mariabackup_*.tar.gz" -type f | sort -r | head -1)
if [ -n "$MARIABACKUP" ] && [ "$2" == "--physical" ]; then
    log "Restoring from physical backup"
    
    # Stop MariaDB
    docker compose -f deployment/docker-compose.production.yml stop mariadb
    
    # Backup current data
    mv /var/lib/mosaic/mariadb/data /var/lib/mosaic/mariadb/data.old.$(date +%Y%m%d_%H%M%S)
    
    # Extract backup
    mkdir -p /var/lib/mosaic/mariadb/data
    tar -xzf "$MARIABACKUP" -C /var/lib/mosaic/mariadb/
    mv /var/lib/mosaic/mariadb/mariabackup/* /var/lib/mosaic/mariadb/data/
    rmdir /var/lib/mosaic/mariadb/mariabackup
    
    # Fix permissions
    chown -R 999:999 /var/lib/mosaic/mariadb/data
    
    # Start MariaDB
    docker compose -f deployment/docker-compose.production.yml up -d mariadb
fi

# Verify restoration
log "Verifying restoration"
docker exec ${MARIADB_CONTAINER} mysql -u root -p${MARIADB_ROOT_PASSWORD} \
    -e "SHOW DATABASES;" | grep -E "(bookstack)"

# Flush privileges
log "Flushing privileges"
docker exec ${MARIADB_CONTAINER} mysql -u root -p${MARIADB_ROOT_PASSWORD} \
    -e "FLUSH PRIVILEGES;"

log "MariaDB restore completed successfully"
```

### Redis Restore

Redis data restoration:

```bash
#!/bin/bash
# /opt/mosaic/scripts/restore-redis.sh

set -euo pipefail

BACKUP_DIR=$1
REDIS_CONTAINER="mosaic-redis"

log() {
    echo "[Redis Restore] $1"
}

# Find latest RDB backup
LATEST_RDB=$(find "${BACKUP_DIR}/redis/rdb" -name "dump_*.rdb" -type f | sort -r | head -1)

if [ -z "$LATEST_RDB" ]; then
    log "ERROR: No RDB backup found"
    exit 1
fi

log "Found backup: $(basename "$LATEST_RDB")"

# Stop Redis container
log "Stopping Redis container"
cd /home/jwoltje/src/mosaic-sdk
docker compose -f deployment/docker-compose.production.yml stop redis

# Backup current RDB file
if [ -f "/var/lib/mosaic/redis/data/dump.rdb" ]; then
    cp /var/lib/mosaic/redis/data/dump.rdb \
       /var/lib/mosaic/redis/data/dump.rdb.old.$(date +%Y%m%d_%H%M%S)
fi

# Copy new RDB file
log "Copying RDB file"
cp "$LATEST_RDB" /var/lib/mosaic/redis/data/dump.rdb
chown 999:999 /var/lib/mosaic/redis/data/dump.rdb

# Start Redis
log "Starting Redis container"
docker compose -f deployment/docker-compose.production.yml up -d redis

# Wait for Redis to load the data
log "Waiting for Redis to load data"
sleep 5

# Verify restoration
log "Verifying restoration"
KEY_COUNT=$(docker exec ${REDIS_CONTAINER} redis-cli DBSIZE | awk '{print $2}')
log "Restored keys: $KEY_COUNT"

# Restore from AOF if available and requested
if [ "$2" == "--with-aof" ]; then
    LATEST_AOF=$(find "${BACKUP_DIR}/redis/aof" -name "appendonly_*.aof" -type f | sort -r | head -1)
    if [ -n "$LATEST_AOF" ]; then
        log "Restoring from AOF file"
        docker compose -f deployment/docker-compose.production.yml stop redis
        cp "$LATEST_AOF" /var/lib/mosaic/redis/data/appendonly.aof
        chown 999:999 /var/lib/mosaic/redis/data/appendonly.aof
        docker compose -f deployment/docker-compose.production.yml up -d redis
    fi
fi

log "Redis restore completed successfully"
```

## Application Restore Procedures

### Gitea Restore

Complete Gitea restoration:

```bash
#!/bin/bash
# /opt/mosaic/scripts/restore-gitea.sh

set -euo pipefail

BACKUP_DIR=$1
GITEA_CONTAINER="gitea"
GITEA_DATA="/var/lib/mosaic/gitea"

log() {
    echo "[Gitea Restore] $1"
}

# Stop Gitea service
log "Stopping Gitea service"
cd /home/jwoltje/src/mosaic-sdk
docker compose -f deployment/gitea/docker-compose.yml stop

# Find latest Gitea dump
LATEST_DUMP=$(find "${BACKUP_DIR}/gitea/dump" -name "gitea-dump-*.zip" -type f | sort -r | head -1)

if [ -n "$LATEST_DUMP" ]; then
    log "Restoring from Gitea dump: $(basename "$LATEST_DUMP")"
    
    # Create temporary directory
    TEMP_DIR="/tmp/gitea-restore-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$TEMP_DIR"
    
    # Extract dump
    unzip -q "$LATEST_DUMP" -d "$TEMP_DIR"
    
    # Restore database (already done in PostgreSQL restore)
    # The dump includes SQL that we skip since we restored the full database
    
    # Restore repositories
    if [ -d "$TEMP_DIR/repos" ]; then
        log "Restoring repositories"
        rm -rf "${GITEA_DATA}/git/repositories.old"
        mv "${GITEA_DATA}/git/repositories" "${GITEA_DATA}/git/repositories.old" 2>/dev/null || true
        mv "$TEMP_DIR/repos" "${GITEA_DATA}/git/repositories"
    fi
    
    # Restore custom directory
    if [ -d "$TEMP_DIR/custom" ]; then
        log "Restoring custom directory"
        rm -rf "${GITEA_DATA}/gitea/custom.old"
        mv "${GITEA_DATA}/gitea/custom" "${GITEA_DATA}/gitea/custom.old" 2>/dev/null || true
        mv "$TEMP_DIR/custom" "${GITEA_DATA}/gitea/"
    fi
    
    # Restore configuration
    if [ -f "$TEMP_DIR/app.ini" ]; then
        log "Restoring configuration"
        cp "${GITEA_DATA}/gitea/conf/app.ini" "${GITEA_DATA}/gitea/conf/app.ini.old"
        cp "$TEMP_DIR/app.ini" "${GITEA_DATA}/gitea/conf/"
    fi
    
    # Cleanup
    rm -rf "$TEMP_DIR"
else
    log "No Gitea dump found, restoring from individual components"
    
    # Restore repositories
    LATEST_REPOS=$(find "${BACKUP_DIR}/gitea/repos" -name "repositories_*.tar.gz" | sort -r | head -1)
    if [ -n "$LATEST_REPOS" ]; then
        log "Restoring repositories"
        mv "${GITEA_DATA}/git/repositories" "${GITEA_DATA}/git/repositories.old" 2>/dev/null || true
        tar -xzf "$LATEST_REPOS" -C "${GITEA_DATA}/git/"
    fi
    
    # Restore LFS data
    LATEST_LFS=$(find "${BACKUP_DIR}/gitea/lfs" -name "lfs_*.tar.gz" | sort -r | head -1)
    if [ -n "$LATEST_LFS" ]; then
        log "Restoring LFS data"
        mv "${GITEA_DATA}/git/lfs" "${GITEA_DATA}/git/lfs.old" 2>/dev/null || true
        tar -xzf "$LATEST_LFS" -C "${GITEA_DATA}/git/"
    fi
    
    # Restore custom directory
    LATEST_CUSTOM=$(find "${BACKUP_DIR}/gitea/custom" -name "custom_*.tar.gz" | sort -r | head -1)
    if [ -n "$LATEST_CUSTOM" ]; then
        log "Restoring custom directory"
        mv "${GITEA_DATA}/gitea/custom" "${GITEA_DATA}/gitea/custom.old" 2>/dev/null || true
        tar -xzf "$LATEST_CUSTOM" -C "${GITEA_DATA}/gitea/"
    fi
fi

# Fix permissions
log "Fixing permissions"
chown -R 1000:1000 "${GITEA_DATA}/git"
chown -R 1000:1000 "${GITEA_DATA}/gitea"

# Start Gitea
log "Starting Gitea service"
docker compose -f deployment/gitea/docker-compose.yml up -d

# Wait for Gitea to start
log "Waiting for Gitea to start"
until curl -s http://localhost:3000/api/healthz | grep -q "ok"; do
    sleep 5
done

# Regenerate hooks
log "Regenerating Git hooks"
docker exec -u git ${GITEA_CONTAINER} gitea admin regenerate hooks

# Resync repositories
log "Resyncing repositories"
docker exec -u git ${GITEA_CONTAINER} gitea admin repo-sync

log "Gitea restore completed successfully"
```

### BookStack Restore

BookStack restoration procedure:

```bash
#!/bin/bash
# /opt/mosaic/scripts/restore-bookstack.sh

set -euo pipefail

BACKUP_DIR=$1
BOOKSTACK_CONTAINER="bookstack"
BOOKSTACK_DATA="/var/lib/mosaic/bookstack"

log() {
    echo "[BookStack Restore] $1"
}

# Stop BookStack service
log "Stopping BookStack service"
cd /home/jwoltje/src/mosaic-sdk
docker compose -f deployment/docker-compose.bookstack-mariadb.yml stop bookstack

# Restore uploads
LATEST_UPLOADS=$(find "${BACKUP_DIR}/bookstack/uploads" -name "uploads_*.tar.gz" | sort -r | head -1)
if [ -n "$LATEST_UPLOADS" ]; then
    log "Restoring uploads"
    rm -rf "${BOOKSTACK_DATA}/uploads.old"
    mv "${BOOKSTACK_DATA}/uploads" "${BOOKSTACK_DATA}/uploads.old" 2>/dev/null || true
    tar -xzf "$LATEST_UPLOADS" -C "${BOOKSTACK_DATA}/"
fi

# Restore public uploads
LATEST_PUBLIC=$(find "${BACKUP_DIR}/bookstack/uploads" -name "public_uploads_*.tar.gz" | sort -r | head -1)
if [ -n "$LATEST_PUBLIC" ]; then
    log "Restoring public uploads"
    rm -rf "${BOOKSTACK_DATA}/public/uploads.old"
    mv "${BOOKSTACK_DATA}/public/uploads" "${BOOKSTACK_DATA}/public/uploads.old" 2>/dev/null || true
    tar -xzf "$LATEST_PUBLIC" -C "${BOOKSTACK_DATA}/public/"
fi

# Restore themes
LATEST_THEMES=$(find "${BACKUP_DIR}/bookstack/themes" -name "themes_*.tar.gz" | sort -r | head -1)
if [ -n "$LATEST_THEMES" ]; then
    log "Restoring themes"
    rm -rf "${BOOKSTACK_DATA}/themes.old"
    mv "${BOOKSTACK_DATA}/themes" "${BOOKSTACK_DATA}/themes.old" 2>/dev/null || true
    tar -xzf "$LATEST_THEMES" -C "${BOOKSTACK_DATA}/"
fi

# Restore configuration
LATEST_ENV=$(find "${BACKUP_DIR}/bookstack/config" -name "env_*" | sort -r | head -1)
if [ -n "$LATEST_ENV" ]; then
    log "Restoring environment configuration"
    docker cp "$LATEST_ENV" ${BOOKSTACK_CONTAINER}:/app/www/.env.restore
    # Manual verification needed before replacing .env
fi

# Fix permissions
log "Fixing permissions"
chown -R 33:33 "${BOOKSTACK_DATA}"

# Start BookStack
log "Starting BookStack service"
docker compose -f deployment/docker-compose.bookstack-mariadb.yml up -d bookstack

# Wait for BookStack to start
log "Waiting for BookStack to start"
sleep 10

# Clear caches
log "Clearing caches"
docker exec ${BOOKSTACK_CONTAINER} php artisan cache:clear
docker exec ${BOOKSTACK_CONTAINER} php artisan config:clear
docker exec ${BOOKSTACK_CONTAINER} php artisan view:clear

# Regenerate search index
log "Regenerating search index"
docker exec ${BOOKSTACK_CONTAINER} php artisan bookstack:regenerate-search

log "BookStack restore completed successfully"
```

### Plane Restore

Plane project management restoration:

```bash
#!/bin/bash
# /opt/mosaic/scripts/restore-plane.sh

set -euo pipefail

BACKUP_DIR=$1
PLANE_API_CONTAINER="plane-api"
PLANE_DATA="/var/lib/mosaic/plane"

log() {
    echo "[Plane Restore] $1"
}

# Stop Plane services
log "Stopping Plane services"
cd /home/jwoltje/src/mosaic-sdk
docker compose -f deployment/services/plane/docker-compose.yml down

# Start only the database services
docker compose -f deployment/docker-compose.production.yml up -d postgres redis

# Wait for services
sleep 10

# Restore Django data
LATEST_EXPORT=$(find "${BACKUP_DIR}/plane/exports" -name "plane_data_*.json.gz" | sort -r | head -1)
if [ -n "$LATEST_EXPORT" ]; then
    log "Restoring Plane data from export"
    
    # Start API container only
    docker compose -f deployment/services/plane/docker-compose.yml up -d api
    sleep 20
    
    # Load data
    gunzip -c "$LATEST_EXPORT" | docker exec -i ${PLANE_API_CONTAINER} \
        python manage.py loaddata --format=json -
fi

# Restore media files
LATEST_MEDIA=$(find "${BACKUP_DIR}/plane/media" -name "media_*.tar.gz" | sort -r | head -1)
if [ -n "$LATEST_MEDIA" ]; then
    log "Restoring media files"
    rm -rf "${PLANE_DATA}/media.old"
    mv "${PLANE_DATA}/media" "${PLANE_DATA}/media.old" 2>/dev/null || true
    tar -xzf "$LATEST_MEDIA" -C "${PLANE_DATA}/"
fi

# Fix permissions
log "Fixing permissions"
chown -R 1001:1001 "${PLANE_DATA}"

# Run migrations
log "Running database migrations"
docker exec ${PLANE_API_CONTAINER} python manage.py migrate

# Collect static files
log "Collecting static files"
docker exec ${PLANE_API_CONTAINER} python manage.py collectstatic --noinput

# Start all Plane services
log "Starting all Plane services"
docker compose -f deployment/services/plane/docker-compose.yml up -d

log "Plane restore completed successfully"
```

## Configuration Restore

Restore all configuration files:

```bash
#!/bin/bash
# /opt/mosaic/scripts/restore-configs.sh

set -euo pipefail

BACKUP_DIR=$1

log() {
    echo "[Config Restore] $1"
}

# Restore Docker Compose files
if [ -d "${BACKUP_DIR}/docker" ]; then
    log "Restoring Docker Compose files"
    # Create backup of current configs
    tar -czf /tmp/docker-configs-current-$(date +%Y%m%d_%H%M%S).tar.gz \
        -C /home/jwoltje/src/mosaic-sdk/deployment .
    
    # Restore configs
    cp -r "${BACKUP_DIR}/docker/"* /home/jwoltje/src/mosaic-sdk/deployment/
fi

# Restore environment files
if [ -d "${BACKUP_DIR}/env" ]; then
    log "Restoring environment files"
    for env_file in "${BACKUP_DIR}/env/"*.gpg; do
        if [ -f "$env_file" ]; then
            filename=$(basename "$env_file" | sed 's/_[0-9]*\.gpg$//')
            log "Decrypting $filename"
            gpg --batch --yes --passphrase-file /etc/mosaic/.backup-key \
                --decrypt "$env_file" > "/tmp/$filename"
            
            # Verify decrypted file
            if grep -q "=" "/tmp/$filename"; then
                cp "/tmp/$filename" "/home/jwoltje/src/mosaic-sdk/$filename"
                rm "/tmp/$filename"
            else
                log "ERROR: Failed to decrypt $filename"
            fi
        fi
    done
fi

# Restore Nginx configurations
if [ -f "${BACKUP_DIR}/nginx/nginx_configs_"*.tar.gz ]; then
    log "Restoring Nginx configurations"
    latest_nginx=$(ls -t "${BACKUP_DIR}/nginx/nginx_configs_"*.tar.gz | head -1)
    tar -xzf "$latest_nginx" -C /etc/nginx/
    nginx -t && systemctl reload nginx
fi

# Restore SSL certificates
if [ -f "${BACKUP_DIR}/certs/letsencrypt_"*.tar.gz ]; then
    log "Restoring SSL certificates"
    latest_certs=$(ls -t "${BACKUP_DIR}/certs/letsencrypt_"*.tar.gz | head -1)
    tar -xzf "$latest_certs" -C /etc/
fi

# Restore cron jobs
if [ -f "${BACKUP_DIR}/crontab_"*.txt ]; then
    log "Restoring cron jobs"
    latest_cron=$(ls -t "${BACKUP_DIR}/crontab_"*.txt | head -1)
    crontab "$latest_cron"
fi

# Restore systemd services
if [ -f "${BACKUP_DIR}/systemd_"*.tar.gz ]; then
    log "Restoring systemd services"
    latest_systemd=$(ls -t "${BACKUP_DIR}/systemd_"*.tar.gz | head -1)
    tar -xzf "$latest_systemd" -C /
    systemctl daemon-reload
fi

log "Configuration restore completed successfully"
```

## Point-in-Time Recovery

### PostgreSQL PITR

Restore PostgreSQL to specific point in time:

```bash
#!/bin/bash
# /opt/mosaic/scripts/postgres-pitr.sh

set -euo pipefail

TARGET_TIME=$1  # Format: "2024-01-15 14:30:00"
BACKUP_DIR="/opt/mosaic/backups"

log() {
    echo "[PostgreSQL PITR] $1"
}

# Find base backup before target time
BASE_BACKUP=$(find "${BACKUP_DIR}"/*/postgres -name "base_*.tar.gz" \
    -newermt "${TARGET_TIME}" -not -newermt "${TARGET_TIME} + 1 day" \
    | sort | head -1)

if [ -z "$BASE_BACKUP" ]; then
    log "ERROR: No suitable base backup found for target time"
    exit 1
fi

log "Using base backup: $BASE_BACKUP"

# Stop PostgreSQL
docker compose -f deployment/docker-compose.production.yml stop postgres

# Backup current data
mv /var/lib/mosaic/postgres/data /var/lib/mosaic/postgres/data.pitr-backup

# Extract base backup
mkdir -p /var/lib/mosaic/postgres/data
tar -xzf "$BASE_BACKUP" -C /var/lib/mosaic/postgres/data/

# Create recovery configuration
cat > /var/lib/mosaic/postgres/data/recovery.conf <<EOF
restore_command = 'cp /archive/%f %p'
recovery_target_time = '${TARGET_TIME}'
recovery_target_action = 'promote'
EOF

# Copy WAL files
WAL_DIR=$(dirname "$BASE_BACKUP")/wal
if [ -d "$WAL_DIR" ]; then
    mkdir -p /var/lib/mosaic/postgres/archive
    find "$WAL_DIR" -name "*.tar.gz" -exec tar -xzf {} -C /var/lib/mosaic/postgres/archive/ \;
fi

# Fix permissions
chown -R 999:999 /var/lib/mosaic/postgres/

# Start PostgreSQL
docker compose -f deployment/docker-compose.production.yml up -d postgres

# Monitor recovery
docker logs -f mosaic-postgres 2>&1 | grep -E "(recovery|restored)"

log "PITR completed to: ${TARGET_TIME}"
```

## Verification Procedures

### Post-Restore Verification

Comprehensive verification after restore:

```bash
#!/bin/bash
# /opt/mosaic/scripts/verify-restore.sh

set -euo pipefail

VERIFY_LOG="/var/log/mosaic/verify-restore-$(date +%Y%m%d_%H%M%S).log"
ERROR_COUNT=0

log() {
    echo "[Verify] $1" | tee -a "$VERIFY_LOG"
}

check_service() {
    local service=$1
    local check_cmd=$2
    
    if eval "$check_cmd"; then
        log "✓ $service is operational"
    else
        log "✗ $service check failed"
        ((ERROR_COUNT++))
    fi
}

# Check databases
log "Checking databases..."
check_service "PostgreSQL" "docker exec mosaic-postgres pg_isready -U postgres"
check_service "MariaDB" "docker exec mosaic-mariadb mysqladmin ping -u root -p\${MARIADB_ROOT_PASSWORD}"
check_service "Redis" "docker exec mosaic-redis redis-cli ping | grep -q PONG"

# Check applications
log "Checking applications..."
check_service "Gitea" "curl -s http://localhost:3000/api/healthz | grep -q ok"
check_service "BookStack" "curl -s http://localhost:80 | grep -q BookStack"
check_service "Plane" "curl -s http://localhost:8000/api/health | grep -q ok"
check_service "Woodpecker" "curl -s http://localhost:8000/healthz | grep -q ok"

# Check data integrity
log "Checking data integrity..."

# PostgreSQL databases
for db in gitea plane woodpecker; do
    if docker exec mosaic-postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -qw "$db"; then
        log "✓ Database $db exists"
    else
        log "✗ Database $db missing"
        ((ERROR_COUNT++))
    fi
done

# Check file permissions
log "Checking file permissions..."
for dir in /var/lib/mosaic/{gitea,bookstack,plane}; do
    if [ -d "$dir" ]; then
        log "✓ Directory $dir exists"
    else
        log "✗ Directory $dir missing"
        ((ERROR_COUNT++))
    fi
done

# Check connectivity
log "Checking service connectivity..."
check_service "Gitea Web" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 | grep -q 200"
check_service "BookStack Web" "curl -s -o /dev/null -w '%{http_code}' http://localhost:80 | grep -q 200"

# Summary
log "======================================"
log "Verification completed with $ERROR_COUNT errors"
log "Full log: $VERIFY_LOG"

exit $ERROR_COUNT
```

## Disaster Recovery Procedures

### Complete Infrastructure Recovery

When recovering to new infrastructure:

```bash
#!/bin/bash
# /opt/mosaic/scripts/disaster-recovery.sh

set -euo pipefail

# This script assumes new infrastructure is provisioned
# and Docker is installed

REMOTE_BACKUP="s3://mosaic-backups/dr-latest/"
DR_LOG="/var/log/mosaic/disaster-recovery-$(date +%Y%m%d_%H%M%S).log"

log() {
    echo "[DR] $1" | tee -a "$DR_LOG"
}

# Phase 1: Environment preparation
log "Phase 1: Preparing environment"
mkdir -p /opt/mosaic/{backups,scripts}
mkdir -p /var/lib/mosaic/{postgres,mariadb,redis,gitea,bookstack,plane}
mkdir -p /var/log/mosaic

# Phase 2: Clone repository
log "Phase 2: Cloning MosAIc SDK repository"
cd /home/jwoltje/src
git clone https://github.com/yourusername/mosaic-sdk.git
cd mosaic-sdk
git submodule update --init --recursive

# Phase 3: Download latest backups
log "Phase 3: Downloading backups from remote storage"
aws s3 sync "$REMOTE_BACKUP" /opt/mosaic/backups/dr-restore/

# Phase 4: Restore configurations first
log "Phase 4: Restoring configurations"
/opt/mosaic/scripts/restore-configs.sh /opt/mosaic/backups/dr-restore/configs

# Phase 5: Source environment variables
source .env

# Phase 6: Create Docker networks
log "Phase 6: Creating Docker networks"
docker network create mosaic_default || true

# Phase 7: Restore complete stack
log "Phase 7: Restoring complete stack"
/opt/mosaic/scripts/restore-all.sh dr-restore

# Phase 8: Update DNS records
log "Phase 8: Update DNS records to point to new infrastructure"
# This would typically be done via your DNS provider's API

# Phase 9: Install SSL certificates
log "Phase 9: Installing SSL certificates"
if [ ! -d "/etc/letsencrypt" ]; then
    # Restore from backup or request new certificates
    certbot certonly --standalone -d your-domain.com
fi

# Phase 10: Final verification
log "Phase 10: Running final verification"
/opt/mosaic/scripts/verify-restore.sh

log "Disaster recovery completed!"
log "Please update DNS records and verify all services"
```

## Best Practices

1. **Always verify backups** before starting restore
2. **Test restore procedures** regularly in non-production
3. **Document all restore operations** with timestamps
4. **Keep restore scripts updated** with infrastructure changes
5. **Have rollback procedures** ready in case restore fails
6. **Monitor restoration progress** and check for errors
7. **Verify data integrity** after every restore
8. **Update security credentials** after disaster recovery
9. **Communicate status** to stakeholders during restore
10. **Conduct post-restore review** to improve procedures

---

Related documentation:
- [Backup Procedures](./02-backup-procedures.md)
- [Disaster Recovery Plan](./04-disaster-recovery.md)
- [Point-in-Time Recovery](./05-point-in-time-recovery.md)
- [Testing Procedures](./06-backup-testing.md)