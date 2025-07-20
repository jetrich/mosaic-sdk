---
title: "Backup Procedures"
order: 02
category: "backup-recovery"
tags: ["backup", "procedures", "automation", "scripts"]
---

# Backup Procedures

Detailed procedures for performing backups of the MosAIc Stack, including automated scripts and manual processes.

## Automated Backup System

### Master Backup Script

The main orchestrator script that coordinates all backup operations:

```bash
#!/bin/bash
# /opt/mosaic/scripts/backup-all.sh

set -euo pipefail

# Configuration
BACKUP_ROOT="/opt/mosaic/backups"
REMOTE_STORAGE="s3://mosaic-backups"
LOG_DIR="/var/log/mosaic/backups"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_TYPE=${1:-incremental}  # full or incremental

# Create backup directory structure
BACKUP_DIR="${BACKUP_ROOT}/daily/${BACKUP_DATE}"
mkdir -p "${BACKUP_DIR}"/{databases,applications,configs,manifests}
mkdir -p "${LOG_DIR}"

# Logging setup
LOG_FILE="${LOG_DIR}/backup-${BACKUP_DATE}.log"
exec 1> >(tee -a "${LOG_FILE}")
exec 2>&1

# Functions
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

error_exit() {
    log "ERROR: $1"
    send_alert "Backup failed: $1"
    exit 1
}

send_alert() {
    # Send alert via your monitoring system
    curl -X POST https://monitoring.example.com/api/alerts \
        -H "Content-Type: application/json" \
        -d "{\"severity\": \"critical\", \"message\": \"$1\"}"
}

# Pre-backup checks
log "Starting MosAIc Stack backup - Type: ${BACKUP_TYPE}"
log "Backup directory: ${BACKUP_DIR}"

# Check available space
AVAILABLE_SPACE=$(df "${BACKUP_ROOT}" | awk 'NR==2 {print $4}')
REQUIRED_SPACE=52428800  # 50GB in KB
if [ "${AVAILABLE_SPACE}" -lt "${REQUIRED_SPACE}" ]; then
    error_exit "Insufficient disk space. Available: ${AVAILABLE_SPACE}KB, Required: ${REQUIRED_SPACE}KB"
fi

# Backup databases
log "Phase 1: Backing up databases"
"${SCRIPT_DIR}/backup-postgres.sh" "${BACKUP_DIR}/databases" || error_exit "PostgreSQL backup failed"
"${SCRIPT_DIR}/backup-mariadb.sh" "${BACKUP_DIR}/databases" || error_exit "MariaDB backup failed"
"${SCRIPT_DIR}/backup-redis.sh" "${BACKUP_DIR}/databases" || error_exit "Redis backup failed"

# Backup applications
log "Phase 2: Backing up application data"
"${SCRIPT_DIR}/backup-gitea.sh" "${BACKUP_DIR}/applications" || error_exit "Gitea backup failed"
"${SCRIPT_DIR}/backup-bookstack.sh" "${BACKUP_DIR}/applications" || error_exit "BookStack backup failed"
"${SCRIPT_DIR}/backup-plane.sh" "${BACKUP_DIR}/applications" || error_exit "Plane backup failed"
"${SCRIPT_DIR}/backup-woodpecker.sh" "${BACKUP_DIR}/applications" || error_exit "Woodpecker backup failed"

# Backup configurations
log "Phase 3: Backing up configurations"
"${SCRIPT_DIR}/backup-configs.sh" "${BACKUP_DIR}/configs" || error_exit "Configuration backup failed"

# Create backup manifest
log "Phase 4: Creating backup manifest"
"${SCRIPT_DIR}/create-manifest.sh" "${BACKUP_DIR}" || error_exit "Manifest creation failed"

# Compress backup (for full backups)
if [ "${BACKUP_TYPE}" = "full" ]; then
    log "Phase 5: Compressing backup"
    cd "${BACKUP_ROOT}/daily"
    tar -czf "${BACKUP_DATE}.tar.gz" "${BACKUP_DATE}/"
    rm -rf "${BACKUP_DATE}/"
    BACKUP_FILE="${BACKUP_ROOT}/daily/${BACKUP_DATE}.tar.gz"
else
    BACKUP_FILE="${BACKUP_DIR}"
fi

# Encrypt backup
log "Phase 6: Encrypting backup"
if [ "${BACKUP_TYPE}" = "full" ]; then
    gpg --batch --yes --passphrase-file /etc/mosaic/.backup-key \
        --symmetric --cipher-algo AES256 \
        --output "${BACKUP_FILE}.gpg" "${BACKUP_FILE}"
    rm -f "${BACKUP_FILE}"
    BACKUP_FILE="${BACKUP_FILE}.gpg"
fi

# Upload to remote storage
log "Phase 7: Uploading to remote storage"
aws s3 sync "${BACKUP_DIR}" "${REMOTE_STORAGE}/daily/${BACKUP_DATE}/" \
    --storage-class STANDARD_IA \
    --sse AES256 || error_exit "Remote upload failed"

# Verify backup
log "Phase 8: Verifying backup"
"${SCRIPT_DIR}/verify-backup.sh" "${BACKUP_FILE}" || error_exit "Backup verification failed"

# Cleanup old backups
log "Phase 9: Cleaning up old backups"
"${SCRIPT_DIR}/cleanup-backups.sh" || log "WARNING: Cleanup failed (non-critical)"

# Update backup status
echo "${BACKUP_DATE}" > "${BACKUP_ROOT}/.last-successful-backup"

log "Backup completed successfully!"
log "Backup location: ${BACKUP_FILE}"
log "Remote location: ${REMOTE_STORAGE}/daily/${BACKUP_DATE}/"

# Send success notification
send_alert "Backup completed successfully: ${BACKUP_DATE}"
```

## Database Backup Procedures

### PostgreSQL Backup

Comprehensive PostgreSQL backup with WAL archiving:

```bash
# /opt/mosaic/scripts/backup-postgres.sh

set -euo pipefail

BACKUP_DIR=$1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PG_CONTAINER="mosaic-postgres"

log() {
    echo "[PostgreSQL] $1"
}

# Create PostgreSQL backup directory
mkdir -p "${BACKUP_DIR}/postgres"/{dumps,wal,configs}

# Perform full cluster backup using pg_basebackup
log "Starting PostgreSQL base backup"
docker exec ${PG_CONTAINER} pg_basebackup \
    -h localhost \
    -U postgres \
    -D /tmp/pgbackup \
    -Ft \
    -z \
    -P \
    -Xs \
    -c fast

# Copy base backup to host
docker cp ${PG_CONTAINER}:/tmp/pgbackup/base.tar.gz \
    "${BACKUP_DIR}/postgres/base_${TIMESTAMP}.tar.gz"

# Backup individual databases
log "Backing up individual databases"
DBS=$(docker exec ${PG_CONTAINER} psql -U postgres -t -c "SELECT datname FROM pg_database WHERE datistemplate = false AND datname != 'postgres';")

for db in $DBS; do
    log "Backing up database: $db"
    
    # Custom format for flexibility
    docker exec ${PG_CONTAINER} pg_dump \
        -U postgres \
        -d "$db" \
        -F custom \
        -b \
        -v \
        -f "/tmp/${db}_${TIMESTAMP}.dump"
    
    # SQL format for portability
    docker exec ${PG_CONTAINER} pg_dump \
        -U postgres \
        -d "$db" \
        --no-owner \
        --no-privileges \
        -f "/tmp/${db}_${TIMESTAMP}.sql"
    
    # Copy to host
    docker cp ${PG_CONTAINER}:/tmp/${db}_${TIMESTAMP}.dump \
        "${BACKUP_DIR}/postgres/dumps/${db}_${TIMESTAMP}.dump"
    docker cp ${PG_CONTAINER}:/tmp/${db}_${TIMESTAMP}.sql \
        "${BACKUP_DIR}/postgres/dumps/${db}_${TIMESTAMP}.sql"
    
    # Compress SQL dump
    gzip "${BACKUP_DIR}/postgres/dumps/${db}_${TIMESTAMP}.sql"
done

# Backup global objects (roles, tablespaces)
log "Backing up global objects"
docker exec ${PG_CONTAINER} pg_dumpall \
    -U postgres \
    --globals-only \
    -f /tmp/globals_${TIMESTAMP}.sql

docker cp ${PG_CONTAINER}:/tmp/globals_${TIMESTAMP}.sql \
    "${BACKUP_DIR}/postgres/globals_${TIMESTAMP}.sql"

# Backup PostgreSQL configuration
log "Backing up PostgreSQL configuration"
docker exec ${PG_CONTAINER} tar -czf /tmp/pgconfig.tar.gz \
    /var/lib/postgresql/data/postgresql.conf \
    /var/lib/postgresql/data/pg_hba.conf \
    /var/lib/postgresql/data/pg_ident.conf

docker cp ${PG_CONTAINER}:/tmp/pgconfig.tar.gz \
    "${BACKUP_DIR}/postgres/configs/pgconfig_${TIMESTAMP}.tar.gz"

# Archive WAL files
log "Archiving WAL files"
docker exec ${PG_CONTAINER} tar -czf /tmp/wal_archive.tar.gz \
    -C /var/lib/postgresql/data/pg_wal .

docker cp ${PG_CONTAINER}:/tmp/wal_archive.tar.gz \
    "${BACKUP_DIR}/postgres/wal/wal_archive_${TIMESTAMP}.tar.gz"

# Cleanup temporary files
docker exec ${PG_CONTAINER} rm -rf /tmp/pgbackup /tmp/*.dump /tmp/*.sql /tmp/*.tar.gz

# Create metadata file
cat > "${BACKUP_DIR}/postgres/metadata.json" <<EOF
{
    "timestamp": "${TIMESTAMP}",
    "type": "postgresql",
    "version": "$(docker exec ${PG_CONTAINER} psql -U postgres -t -c 'SELECT version();' | head -1)",
    "databases": [$(echo $DBS | tr ' ' '\n' | sed 's/^/"/;s/$/",/' | tr '\n' ' ' | sed 's/, $//')],
    "size": "$(du -sh ${BACKUP_DIR}/postgres | cut -f1)",
    "wal_included": true,
    "compression": "gzip"
}
EOF

log "PostgreSQL backup completed"
```

### MariaDB Backup

MariaDB backup using both mysqldump and mariabackup:

```bash
# /opt/mosaic/scripts/backup-mariadb.sh

set -euo pipefail

BACKUP_DIR=$1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
MARIADB_CONTAINER="mosaic-mariadb"

log() {
    echo "[MariaDB] $1"
}

# Create MariaDB backup directory
mkdir -p "${BACKUP_DIR}/mariadb"/{dumps,binlogs,configs}

# Get root password from environment
MARIADB_ROOT_PASSWORD=$(docker exec ${MARIADB_CONTAINER} printenv MARIADB_ROOT_PASSWORD)

# Full backup with mysqldump
log "Starting MariaDB full backup with mysqldump"
docker exec ${MARIADB_CONTAINER} mysqldump \
    --all-databases \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --quick \
    --lock-tables=false \
    --user=root \
    --password="${MARIADB_ROOT_PASSWORD}" \
    > "${BACKUP_DIR}/mariadb/dumps/all_databases_${TIMESTAMP}.sql"

# Compress the dump
gzip "${BACKUP_DIR}/mariadb/dumps/all_databases_${TIMESTAMP}.sql"

log "Backing up individual databases"
DBS=$(docker exec ${MARIADB_CONTAINER} mysql -u root -p"${MARIADB_ROOT_PASSWORD}" -e "SHOW DATABASES;" | grep -Ev "(Database|information_schema|performance_schema|mysql|sys)")

for db in $DBS; do
    log "Backing up database: $db"
    docker exec ${MARIADB_CONTAINER} mysqldump \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --databases "$db" \
        --user=root \
        --password="${MARIADB_ROOT_PASSWORD}" \
        > "${BACKUP_DIR}/mariadb/dumps/${db}_${TIMESTAMP}.sql"
    
    gzip "${BACKUP_DIR}/mariadb/dumps/${db}_${TIMESTAMP}.sql"
done

# Physical backup with mariabackup (if available)
if docker exec ${MARIADB_CONTAINER} which mariabackup >/dev/null 2>&1; then
    log "Creating physical backup with mariabackup"
    
    # Prepare backup directory in container
    docker exec ${MARIADB_CONTAINER} mkdir -p /tmp/mariabackup
    
    # Run mariabackup
    docker exec ${MARIADB_CONTAINER} mariabackup \
        --backup \
        --target-dir=/tmp/mariabackup \
        --user=root \
        --password="${MARIADB_ROOT_PASSWORD}"
    
    # Prepare the backup
    docker exec ${MARIADB_CONTAINER} mariabackup \
        --prepare \
        --target-dir=/tmp/mariabackup
    
    # Compress and copy to host
    docker exec ${MARIADB_CONTAINER} tar -czf /tmp/mariabackup.tar.gz -C /tmp mariabackup
    docker cp ${MARIADB_CONTAINER}:/tmp/mariabackup.tar.gz \
        "${BACKUP_DIR}/mariadb/mariabackup_${TIMESTAMP}.tar.gz"
    
    # Cleanup
    docker exec ${MARIADB_CONTAINER} rm -rf /tmp/mariabackup /tmp/mariabackup.tar.gz
fi

# Backup binary logs
log "Backing up binary logs"
docker exec ${MARIADB_CONTAINER} mysql -u root -p"${MARIADB_ROOT_PASSWORD}" \
    -e "FLUSH LOGS"

# Get binary log list
BINLOGS=$(docker exec ${MARIADB_CONTAINER} mysql -u root -p"${MARIADB_ROOT_PASSWORD}" \
    -e "SHOW BINARY LOGS" | tail -n +2 | awk '{print $1}')

# Copy binary logs
for binlog in $BINLOGS; do
    docker cp ${MARIADB_CONTAINER}:/var/lib/mysql/$binlog \
        "${BACKUP_DIR}/mariadb/binlogs/" 2>/dev/null || true
done

# Backup MariaDB configuration
log "Backing up MariaDB configuration"
docker exec ${MARIADB_CONTAINER} tar -czf /tmp/mariadb-config.tar.gz \
    /etc/mysql/

docker cp ${MARIADB_CONTAINER}:/tmp/mariadb-config.tar.gz \
    "${BACKUP_DIR}/mariadb/configs/mariadb-config_${TIMESTAMP}.tar.gz"

cat > "${BACKUP_DIR}/mariadb/metadata.json" <<EOF
{
    "timestamp": "${TIMESTAMP}",
    "type": "mariadb",
    "version": "$(docker exec ${MARIADB_CONTAINER} mysql --version | awk '{print $5}' | sed 's/,$//')",
    "databases": [$(echo $DBS | tr ' ' '\n' | sed 's/^/"/;s/$/",/' | tr '\n' ' ' | sed 's/, $//')],
    "backup_method": ["mysqldump", "mariabackup"],
    "binary_logs": true,
    "compression": "gzip"
}
EOF

log "MariaDB backup completed"
```

### Redis Backup

Redis backup with RDB and AOF:

```bash
# /opt/mosaic/scripts/backup-redis.sh

set -euo pipefail

BACKUP_DIR=$1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REDIS_CONTAINER="mosaic-redis"

log() {
    echo "[Redis] $1"
}

# Create Redis backup directory
mkdir -p "${BACKUP_DIR}/redis"/{rdb,aof,configs}

# Trigger background save
log "Triggering Redis background save"
docker exec ${REDIS_CONTAINER} redis-cli BGSAVE

# Wait for background save to complete
log "Waiting for background save to complete"
while [ $(docker exec ${REDIS_CONTAINER} redis-cli LASTSAVE) -eq \
         $(docker exec ${REDIS_CONTAINER} redis-cli LASTSAVE) ]; do
    sleep 1
done

# Copy RDB file
log "Copying RDB snapshot"
docker cp ${REDIS_CONTAINER}:/data/dump.rdb \
    "${BACKUP_DIR}/redis/rdb/dump_${TIMESTAMP}.rdb"

# Copy AOF file if exists
if docker exec ${REDIS_CONTAINER} test -f /data/appendonly.aof; then
    log "Copying AOF file"
    docker cp ${REDIS_CONTAINER}:/data/appendonly.aof \
        "${BACKUP_DIR}/redis/aof/appendonly_${TIMESTAMP}.aof"
fi

# Export data as Redis commands (for portability)
log "Exporting data as Redis commands"
docker exec ${REDIS_CONTAINER} redis-cli --rdb /tmp/export.rdb

# Get all keys and export
docker exec ${REDIS_CONTAINER} sh -c 'redis-cli --scan | while read key; do
    echo "SET \"$key\" \"$(redis-cli GET "$key")\""
done' > "${BACKUP_DIR}/redis/redis_commands_${TIMESTAMP}.txt"

# Backup Redis configuration
log "Backing up Redis configuration"
docker exec ${REDIS_CONTAINER} redis-cli CONFIG GET "*" \
    > "${BACKUP_DIR}/redis/configs/redis_config_${TIMESTAMP}.txt"

# Get Redis info
docker exec ${REDIS_CONTAINER} redis-cli INFO \
    > "${BACKUP_DIR}/redis/redis_info_${TIMESTAMP}.txt"

# Compress files
gzip "${BACKUP_DIR}/redis/redis_commands_${TIMESTAMP}.txt"
gzip "${BACKUP_DIR}/redis/configs/redis_config_${TIMESTAMP}.txt"

cat > "${BACKUP_DIR}/redis/metadata.json" <<EOF
{
    "timestamp": "${TIMESTAMP}",
    "type": "redis",
    "version": "$(docker exec ${REDIS_CONTAINER} redis-cli INFO server | grep redis_version | cut -d: -f2 | tr -d '\r')",
    "persistence": {
        "rdb": true,
        "aof": $(docker exec ${REDIS_CONTAINER} test -f /data/appendonly.aof && echo "true" || echo "false")
    },
    "memory_usage": "$(docker exec ${REDIS_CONTAINER} redis-cli INFO memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')",
    "keys_count": $(docker exec ${REDIS_CONTAINER} redis-cli DBSIZE | awk '{print $2}')
}
EOF

log "Redis backup completed"
```

## Application Backup Procedures

### Gitea Backup

Complete Gitea backup including repositories and LFS:

```bash
# /opt/mosaic/scripts/backup-gitea.sh

set -euo pipefail

BACKUP_DIR=$1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
GITEA_CONTAINER="gitea"
GITEA_DATA="/var/lib/mosaic/gitea"

log() {
    echo "[Gitea] $1"
}

# Create Gitea backup directory
mkdir -p "${BACKUP_DIR}/gitea"/{dump,repos,lfs,custom}

# Use Gitea's built-in backup command
log "Running Gitea dump"
docker exec -u git ${GITEA_CONTAINER} gitea dump \
    -c /data/gitea/conf/app.ini \
    -w /tmp \
    -t /tmp \
    --skip-lfs-data \
    -f gitea-dump-${TIMESTAMP}.zip

# Copy dump file
docker cp ${GITEA_CONTAINER}:/tmp/gitea-dump-${TIMESTAMP}.zip \
    "${BACKUP_DIR}/gitea/dump/"

# Backup repositories separately (for granular restore)
log "Backing up Git repositories"
if [ -d "${GITEA_DATA}/git/repositories" ]; then
    tar -czf "${BACKUP_DIR}/gitea/repos/repositories_${TIMESTAMP}.tar.gz" \
        -C "${GITEA_DATA}/git" repositories/
fi

# Backup LFS data
log "Backing up LFS data"
if [ -d "${GITEA_DATA}/git/lfs" ]; then
    tar -czf "${BACKUP_DIR}/gitea/lfs/lfs_${TIMESTAMP}.tar.gz" \
        -C "${GITEA_DATA}/git" lfs/
fi

# Backup custom directory (themes, templates)
log "Backing up custom directory"
if [ -d "${GITEA_DATA}/gitea/custom" ]; then
    tar -czf "${BACKUP_DIR}/gitea/custom/custom_${TIMESTAMP}.tar.gz" \
        -C "${GITEA_DATA}/gitea" custom/
fi

# Get repository statistics
log "Gathering repository statistics"
docker exec ${GITEA_CONTAINER} sh -c 'find /data/git/repositories -name "*.git" -type d | wc -l' \
    > "${BACKUP_DIR}/gitea/repo_count.txt"

# Calculate sizes
REPOS_SIZE=$(du -sh "${GITEA_DATA}/git/repositories" 2>/dev/null | cut -f1 || echo "0")
LFS_SIZE=$(du -sh "${GITEA_DATA}/git/lfs" 2>/dev/null | cut -f1 || echo "0")

cat > "${BACKUP_DIR}/gitea/metadata.json" <<EOF
{
    "timestamp": "${TIMESTAMP}",
    "type": "gitea",
    "version": "$(docker exec ${GITEA_CONTAINER} gitea --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')",
    "backup_components": ["database", "repositories", "lfs", "custom", "configuration"],
    "repository_count": $(cat "${BACKUP_DIR}/gitea/repo_count.txt"),
    "sizes": {
        "repositories": "${REPOS_SIZE}",
        "lfs": "${LFS_SIZE}"
    }
}
EOF

# Cleanup
docker exec ${GITEA_CONTAINER} rm -f /tmp/gitea-dump-${TIMESTAMP}.zip
rm -f "${BACKUP_DIR}/gitea/repo_count.txt"

log "Gitea backup completed"
```

### BookStack Backup

BookStack backup including database and uploads:

```bash
# /opt/mosaic/scripts/backup-bookstack.sh

set -euo pipefail

BACKUP_DIR=$1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BOOKSTACK_CONTAINER="bookstack"
BOOKSTACK_DATA="/var/lib/mosaic/bookstack"

log() {
    echo "[BookStack] $1"
}

# Create BookStack backup directory
mkdir -p "${BACKUP_DIR}/bookstack"/{uploads,themes,config}

# Run Laravel backup command if available
log "Running BookStack backup"
if docker exec ${BOOKSTACK_CONTAINER} php artisan list | grep -q backup:run; then
    docker exec ${BOOKSTACK_CONTAINER} php artisan backup:run \
        --only-files \
        --disable-notifications
    
    # Copy backup
    docker cp ${BOOKSTACK_CONTAINER}:/app/www/storage/app/backups/ \
        "${BACKUP_DIR}/bookstack/laravel-backup/"
fi

# Backup uploaded files
log "Backing up uploaded files"
if [ -d "${BOOKSTACK_DATA}/uploads" ]; then
    tar -czf "${BACKUP_DIR}/bookstack/uploads/uploads_${TIMESTAMP}.tar.gz" \
        -C "${BOOKSTACK_DATA}" uploads/
fi

# Backup public uploads
log "Backing up public uploads"
if [ -d "${BOOKSTACK_DATA}/public/uploads" ]; then
    tar -czf "${BACKUP_DIR}/bookstack/uploads/public_uploads_${TIMESTAMP}.tar.gz" \
        -C "${BOOKSTACK_DATA}/public" uploads/
fi

# Backup themes
log "Backing up themes"
if [ -d "${BOOKSTACK_DATA}/themes" ]; then
    tar -czf "${BACKUP_DIR}/bookstack/themes/themes_${TIMESTAMP}.tar.gz" \
        -C "${BOOKSTACK_DATA}" themes/
fi

# Backup .env file
log "Backing up configuration"
docker cp ${BOOKSTACK_CONTAINER}:/app/www/.env \
    "${BACKUP_DIR}/bookstack/config/env_${TIMESTAMP}"

# Export application settings
docker exec ${BOOKSTACK_CONTAINER} php artisan tinker --execute="
    \$settings = \App\Settings\SettingService::all();
    echo json_encode(\$settings, JSON_PRETTY_PRINT);
" > "${BACKUP_DIR}/bookstack/config/settings_${TIMESTAMP}.json" 2>/dev/null || true

# Get statistics
BOOKS_COUNT=$(docker exec ${BOOKSTACK_CONTAINER} php artisan tinker --execute="echo \App\Entities\Models\Book::count();" 2>/dev/null || echo "0")
PAGES_COUNT=$(docker exec ${BOOKSTACK_CONTAINER} php artisan tinker --execute="echo \App\Entities\Models\Page::count();" 2>/dev/null || echo "0")
USERS_COUNT=$(docker exec ${BOOKSTACK_CONTAINER} php artisan tinker --execute="echo \App\Auth\User::count();" 2>/dev/null || echo "0")

cat > "${BACKUP_DIR}/bookstack/metadata.json" <<EOF
{
    "timestamp": "${TIMESTAMP}",
    "type": "bookstack",
    "version": "$(docker exec ${BOOKSTACK_CONTAINER} php artisan --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')",
    "statistics": {
        "books": ${BOOKS_COUNT},
        "pages": ${PAGES_COUNT},
        "users": ${USERS_COUNT}
    },
    "backup_components": ["database", "uploads", "themes", "configuration"]
}
EOF

log "BookStack backup completed"
```

### Plane Backup

Plane backup for project management data:

```bash
# /opt/mosaic/scripts/backup-plane.sh

set -euo pipefail

BACKUP_DIR=$1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PLANE_API_CONTAINER="plane-api"
PLANE_DATA="/var/lib/mosaic/plane"

log() {
    echo "[Plane] $1"
}

# Create Plane backup directory
mkdir -p "${BACKUP_DIR}/plane"/{media,exports,config}

# Export Django data
log "Exporting Plane data"
docker exec ${PLANE_API_CONTAINER} python manage.py dumpdata \
    --natural-foreign \
    --natural-primary \
    --exclude contenttypes \
    --exclude auth.permission \
    --exclude sessions \
    --indent 2 \
    > "${BACKUP_DIR}/plane/exports/plane_data_${TIMESTAMP}.json"

# Compress the export
gzip "${BACKUP_DIR}/plane/exports/plane_data_${TIMESTAMP}.json"

# Backup media files
log "Backing up media files"
if [ -d "${PLANE_DATA}/media" ]; then
    tar -czf "${BACKUP_DIR}/plane/media/media_${TIMESTAMP}.tar.gz" \
        -C "${PLANE_DATA}" media/
fi

# Backup static files if customized
if [ -d "${PLANE_DATA}/static" ]; then
    tar -czf "${BACKUP_DIR}/plane/static_${TIMESTAMP}.tar.gz" \
        -C "${PLANE_DATA}" static/
fi

# Export specific data models
log "Exporting specific models"
for model in workspace project issue cycle module; do
    docker exec ${PLANE_API_CONTAINER} python manage.py dumpdata \
        db.$model \
        --indent 2 \
        > "${BACKUP_DIR}/plane/exports/${model}_${TIMESTAMP}.json" 2>/dev/null || true
    
    [ -f "${BACKUP_DIR}/plane/exports/${model}_${TIMESTAMP}.json" ] && \
        gzip "${BACKUP_DIR}/plane/exports/${model}_${TIMESTAMP}.json"
done

WORKSPACES=$(docker exec ${PLANE_API_CONTAINER} python manage.py shell -c "from db.models import Workspace; print(Workspace.objects.count())" 2>/dev/null || echo "0")
PROJECTS=$(docker exec ${PLANE_API_CONTAINER} python manage.py shell -c "from db.models import Project; print(Project.objects.count())" 2>/dev/null || echo "0")
ISSUES=$(docker exec ${PLANE_API_CONTAINER} python manage.py shell -c "from db.models import Issue; print(Issue.objects.count())" 2>/dev/null || echo "0")
USERS=$(docker exec ${PLANE_API_CONTAINER} python manage.py shell -c "from db.models import User; print(User.objects.count())" 2>/dev/null || echo "0")

cat > "${BACKUP_DIR}/plane/metadata.json" <<EOF
{
    "timestamp": "${TIMESTAMP}",
    "type": "plane",
    "statistics": {
        "workspaces": ${WORKSPACES},
        "projects": ${PROJECTS},
        "issues": ${ISSUES},
        "users": ${USERS}
    },
    "backup_components": ["database_export", "media_files", "configuration"]
}
EOF

log "Plane backup completed"
```

## Configuration Backup

Backup all configuration files:

```bash
# /opt/mosaic/scripts/backup-configs.sh

set -euo pipefail

BACKUP_DIR=$1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

log() {
    echo "[Config] $1"
}

# Create config backup directory
mkdir -p "${BACKUP_DIR}"/{docker,nginx,certs,env}

# Backup Docker Compose files
log "Backing up Docker Compose files"
find /home/jwoltje/src/mosaic-sdk/deployment -name "*.yml" -o -name "*.yaml" | \
    while read -r file; do
        relative_path=${file#/home/jwoltje/src/mosaic-sdk/deployment/}
        mkdir -p "${BACKUP_DIR}/docker/$(dirname "$relative_path")"
        cp "$file" "${BACKUP_DIR}/docker/$relative_path"
    done

# Backup environment files
log "Backing up environment files"
find /home/jwoltje/src/mosaic-sdk -name ".env*" -type f | \
    while read -r file; do
        filename=$(basename "$file")
        # Encrypt sensitive env files
        gpg --batch --yes --passphrase-file /etc/mosaic/.backup-key \
            --symmetric --cipher-algo AES256 \
            --output "${BACKUP_DIR}/env/${filename}_${TIMESTAMP}.gpg" \
            "$file"
    done

# Backup Nginx configurations
log "Backing up Nginx configurations"
if [ -d "/etc/nginx/sites-available" ]; then
    tar -czf "${BACKUP_DIR}/nginx/nginx_configs_${TIMESTAMP}.tar.gz" \
        -C /etc/nginx sites-available/ sites-enabled/
fi

# Backup SSL certificates
log "Backing up SSL certificates"
if [ -d "/etc/letsencrypt" ]; then
    tar -czf "${BACKUP_DIR}/certs/letsencrypt_${TIMESTAMP}.tar.gz" \
        -C /etc letsencrypt/
fi

# Backup cron jobs
log "Backing up cron jobs"
crontab -l > "${BACKUP_DIR}/crontab_${TIMESTAMP}.txt" 2>/dev/null || true
find /etc/cron.* -type f | tar -czf "${BACKUP_DIR}/cron_${TIMESTAMP}.tar.gz" -T -

# Backup systemd service files
log "Backing up systemd services"
find /etc/systemd/system -name "mosaic-*" | \
    tar -czf "${BACKUP_DIR}/systemd_${TIMESTAMP}.tar.gz" -T -

# Create configuration inventory
cat > "${BACKUP_DIR}/inventory.json" <<EOF
{
    "timestamp": "${TIMESTAMP}",
    "components": {
        "docker_compose": true,
        "environment_files": true,
        "nginx": $([ -d "/etc/nginx" ] && echo "true" || echo "false"),
        "ssl_certificates": $([ -d "/etc/letsencrypt" ] && echo "true" || echo "false"),
        "cron_jobs": true,
        "systemd_services": true
    }
}
EOF

log "Configuration backup completed"
```

## Backup Verification

Verify backup integrity:

```bash
# /opt/mosaic/scripts/verify-backup.sh

set -euo pipefail

BACKUP_PATH=$1
VERIFY_LOG="/var/log/mosaic/backups/verify-$(date +%Y%m%d_%H%M%S).log"

log() {
    echo "[Verify] $1" | tee -a "$VERIFY_LOG"
}

error_count=0

# Verify file exists and is readable
if [ ! -r "$BACKUP_PATH" ]; then
    log "ERROR: Backup file not found or not readable: $BACKUP_PATH"
    exit 1
fi

# Check file integrity based on type
if [[ "$BACKUP_PATH" == *.tar.gz ]]; then
    log "Verifying tar.gz archive"
    if ! tar -tzf "$BACKUP_PATH" >/dev/null 2>&1; then
        log "ERROR: Tar archive is corrupted"
        ((error_count++))
    fi
elif [[ "$BACKUP_PATH" == *.sql.gz ]]; then
    log "Verifying gzipped SQL dump"
    if ! gunzip -t "$BACKUP_PATH" 2>&1; then
        log "ERROR: Gzip file is corrupted"
        ((error_count++))
    fi
elif [[ "$BACKUP_PATH" == *.gpg ]]; then
    log "Verifying GPG encrypted file"
    if ! gpg --batch --passphrase-file /etc/mosaic/.backup-key \
         --decrypt "$BACKUP_PATH" >/dev/null 2>&1; then
        log "ERROR: GPG file is corrupted or key is wrong"
        ((error_count++))
    fi
elif [[ "$BACKUP_PATH" == *.dump ]]; then
    log "Verifying PostgreSQL dump"
    if ! pg_restore --list "$BACKUP_PATH" >/dev/null 2>&1; then
        log "ERROR: PostgreSQL dump is corrupted"
        ((error_count++))
    fi
fi

# For directories, verify structure
if [ -d "$BACKUP_PATH" ]; then
    log "Verifying backup directory structure"
    
    # Check for expected subdirectories
    for dir in databases applications configs; do
        if [ ! -d "$BACKUP_PATH/$dir" ]; then
            log "WARNING: Missing directory: $dir"
        fi
    done
    
    # Check for metadata files
    find "$BACKUP_PATH" -name "metadata.json" | while read -r metadata; do
        if ! jq empty "$metadata" 2>/dev/null; then
            log "ERROR: Invalid metadata file: $metadata"
            ((error_count++))
        fi
    done
    
    # Check file count
    file_count=$(find "$BACKUP_PATH" -type f | wc -l)
    log "Total files in backup: $file_count"
    
    if [ "$file_count" -lt 10 ]; then
        log "WARNING: Suspiciously low file count"
    fi
fi

# Calculate and verify checksums
log "Calculating checksums"
if [ -f "$BACKUP_PATH" ]; then
    sha256sum "$BACKUP_PATH" > "$BACKUP_PATH.sha256"
    log "SHA256: $(cat "$BACKUP_PATH.sha256")"
fi

# Summary
if [ "$error_count" -eq 0 ]; then
    log "Backup verification completed successfully"
    exit 0
else
    log "Backup verification failed with $error_count errors"
    exit 1
fi
```

## Backup Cleanup

Remove old backups according to retention policy:

```bash
# /opt/mosaic/scripts/cleanup-backups.sh

set -euo pipefail

BACKUP_ROOT="/opt/mosaic/backups"
LOG_FILE="/var/log/mosaic/backups/cleanup-$(date +%Y%m%d_%H%M%S).log"

log() {
    echo "[Cleanup] $1" | tee -a "$LOG_FILE"
}

# Retention settings (in days)
DAILY_RETENTION=7
WEEKLY_RETENTION=28
MONTHLY_RETENTION=90
YEARLY_RETENTION=365

# Cleanup daily backups
log "Cleaning up daily backups older than ${DAILY_RETENTION} days"
find "${BACKUP_ROOT}/daily" -type f -name "*.tar.gz*" -mtime +${DAILY_RETENTION} -delete -print | \
    while read -r file; do
        log "Deleted: $file"
    done

# Cleanup weekly backups
log "Cleaning up weekly backups older than ${WEEKLY_RETENTION} days"
find "${BACKUP_ROOT}/weekly" -type f -name "*.tar.gz*" -mtime +${WEEKLY_RETENTION} -delete -print | \
    while read -r file; do
        log "Deleted: $file"
    done

# Cleanup monthly backups
log "Cleaning up monthly backups older than ${MONTHLY_RETENTION} days"
find "${BACKUP_ROOT}/monthly" -type f -name "*.tar.gz*" -mtime +${MONTHLY_RETENTION} -delete -print | \
    while read -r file; do
        log "Deleted: $file"
    done

# Remove empty directories
log "Removing empty directories"
find "${BACKUP_ROOT}" -type d -empty -delete

# Clean up old log files
log "Cleaning up old log files"
find "/var/log/mosaic/backups" -name "*.log" -mtime +30 -delete

# Check disk usage
USAGE=$(df "${BACKUP_ROOT}" | awk 'NR==2 {print $5}' | sed 's/%//')
log "Backup storage usage after cleanup: ${USAGE}%"

if [ "$USAGE" -gt 80 ]; then
    log "WARNING: Backup storage still above 80% after cleanup"
    # Could trigger additional cleanup or alerts here
fi

log "Backup cleanup completed"
```

## Automated Backup Installation

Install automated backup system:

```bash
# /opt/mosaic/scripts/install-backup-automation.sh

set -euo pipefail

log() {
    echo "[Install] $1"
}

# Create systemd service for daily backups
cat > /etc/systemd/system/mosaic-backup-daily.service <<EOF
[Unit]
Description=MosAIc Daily Backup
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
ExecStart=/opt/mosaic/scripts/backup-all.sh incremental
User=root
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Create systemd timer for daily backups
cat > /etc/systemd/system/mosaic-backup-daily.timer <<EOF
[Unit]
Description=Run MosAIc Daily Backup at 2:00 AM
Requires=mosaic-backup-daily.service

[Timer]
OnCalendar=daily
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Create weekly full backup service
cat > /etc/systemd/system/mosaic-backup-weekly.service <<EOF
[Unit]
Description=MosAIc Weekly Full Backup
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
ExecStart=/opt/mosaic/scripts/backup-all.sh full
User=root
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Create weekly timer
cat > /etc/systemd/system/mosaic-backup-weekly.timer <<EOF
[Unit]
Description=Run MosAIc Weekly Full Backup on Sunday at 1:00 AM
Requires=mosaic-backup-weekly.service

[Timer]
OnCalendar=weekly
OnCalendar=Sun *-*-* 01:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Enable and start timers
systemctl daemon-reload
systemctl enable mosaic-backup-daily.timer mosaic-backup-weekly.timer
systemctl start mosaic-backup-daily.timer mosaic-backup-weekly.timer

log "Backup automation installed successfully"
log "Check timer status with: systemctl list-timers | grep mosaic-backup"
```

## Best Practices Implementation

1. **Always test backups** by performing regular restore drills
2. **Monitor backup jobs** and alert on failures immediately
3. **Encrypt sensitive data** before storage
4. **Verify backup integrity** after each run
5. **Document all procedures** and keep them updated
6. **Rotate backup media** to prevent single point of failure
7. **Store encryption keys** separately from backups
8. **Automate everything** to reduce human error
9. **Keep multiple copies** in different locations
10. **Review and update** retention policies regularly

---

Related documentation:
- [Restore Procedures](./03-restore-procedures.md)
- [Disaster Recovery Plan](./04-disaster-recovery.md)
- [Backup Monitoring](../monitoring/backup-monitoring.md)
- [Security Best Practices](../../security/data-protection.md)

---

---

## Additional Content (Migrated)

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

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_ROOT="/var/backups/mosaic"
BACKUP_DIR="${BACKUP_ROOT}/${BACKUP_DATE}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

./backup-postgres.sh "${BACKUP_DIR}"
./backup-mariadb.sh "${BACKUP_DIR}"
./backup-redis.sh "${BACKUP_DIR}"

# Backup application data
./backup-gitea.sh "${BACKUP_DIR}"
./backup-plane.sh "${BACKUP_DIR}"
./backup-bookstack.sh "${BACKUP_DIR}"

./backup-configs.sh "${BACKUP_DIR}"

# Create manifest
./create-manifest.sh "${BACKUP_DIR}"

# Compress and encrypt
tar -czf "${BACKUP_DIR}.tar.gz" -C "${BACKUP_ROOT}" "${BACKUP_DATE}"
gpg --encrypt --recipient backup@example.com "${BACKUP_DIR}.tar.gz"

rclone copy "${BACKUP_DIR}.tar.gz.gpg" remote:mosaic-backups/

# Cleanup local files older than 7 days
find "${BACKUP_ROOT}" -name "*.tar.gz*" -mtime +7 -delete
```

### Database Backup Procedures

#### PostgreSQL Backup
```bash
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
# backup-mariadb.sh

BACKUP_DIR=$1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

docker exec mosaic-mariadb mysqldump \
    --all-databases \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    -u root -p${MARIADB_ROOT_PASSWORD} \
    > "${BACKUP_DIR}/mariadb_all_${TIMESTAMP}.sql"

docker exec mosaic-mariadb mysqldump \
    --single-transaction \
    -u root -p${MARIADB_ROOT_PASSWORD} \
    bookstack > "${BACKUP_DIR}/bookstack_${TIMESTAMP}.sql"

# Compress
gzip "${BACKUP_DIR}/"*.sql
```

#### Redis Backup
```bash
# backup-redis.sh

BACKUP_DIR=$1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Trigger backup
docker exec mosaic-redis redis-cli BGSAVE

# Wait for completion
while [ $(docker exec mosaic-redis redis-cli LASTSAVE) -eq $(docker exec mosaic-redis redis-cli LASTSAVE) ]; do
    sleep 1
done

docker cp mosaic-redis:/data/dump.rdb "${BACKUP_DIR}/redis_${TIMESTAMP}.rdb"

# Also export as commands for portability
docker exec mosaic-redis redis-cli --rdb /tmp/redis-backup.rdb
docker cp mosaic-redis:/tmp/redis-backup.rdb "${BACKUP_DIR}/redis_portable_${TIMESTAMP}.rdb"
```

### Application Data Backup

#### Gitea Backup
```bash
# backup-gitea.sh

BACKUP_DIR=$1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Use Gitea's built-in backup
docker exec -u git gitea gitea dump -c /data/gitea/conf/app.ini -w /tmp -t /tmp

# Copy backup file
docker cp gitea:/tmp/gitea-dump-*.zip "${BACKUP_DIR}/gitea_${TIMESTAMP}.zip"

# Backup repositories separately
tar -czf "${BACKUP_DIR}/gitea_repos_${TIMESTAMP}.tar.gz" -C /var/lib/mosaic gitea/git/repositories

tar -czf "${BACKUP_DIR}/gitea_lfs_${TIMESTAMP}.tar.gz" -C /var/lib/mosaic gitea/git/lfs
```

#### Plane Backup
```bash
# backup-plane.sh

BACKUP_DIR=$1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

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
# restore-redis.sh

BACKUP_DIR=$1

# Stop Redis
docker compose -f deployment/docker-compose.production.yml stop redis

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

### Automated Verification
```bash
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
