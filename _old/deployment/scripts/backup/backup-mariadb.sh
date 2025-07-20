#!/bin/bash
# MariaDB Backup Script for BookStack
# This script performs full database backups with automatic rotation

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backup/mariadb}"
CONTAINER_NAME="${MARIADB_CONTAINER:-mosaic-mariadb}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/mosaic/backup-mariadb.log"

# Database credentials (from environment or defaults)
DB_USER="${MARIADB_USER:-root}"
DB_PASS="${MARIADB_ROOT_PASSWORD}"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
handle_error() {
    log "ERROR: Backup failed at line $1"
    exit 1
}
trap 'handle_error $LINENO' ERR

# Start backup
log "Starting MariaDB backup..."

# Create backup directory if it doesn't exist
docker exec "$CONTAINER_NAME" mkdir -p "$BACKUP_DIR"

# Get list of databases (excluding system databases)
log "Fetching database list..."
DATABASES=$(docker exec "$CONTAINER_NAME" mysql -u"$DB_USER" -p"$DB_PASS" -e "SHOW DATABASES;" | grep -Ev "(Database|information_schema|performance_schema|mysql|sys)")

# Backup each database
for DB in $DATABASES; do
    if [[ -n "$DB" ]]; then
        BACKUP_FILE="$BACKUP_DIR/${DB}_${TIMESTAMP}.sql.gz"
        log "Backing up database: $DB"
        
        # Perform backup with compression
        docker exec "$CONTAINER_NAME" bash -c "mysqldump -u'$DB_USER' -p'$DB_PASS' \
            --single-transaction \
            --routines \
            --triggers \
            --events \
            --add-drop-database \
            --databases '$DB' | gzip > '$BACKUP_FILE'"
        
        # Check backup file size
        SIZE=$(docker exec "$CONTAINER_NAME" stat -c%s "$BACKUP_FILE" 2>/dev/null || echo "0")
        if [[ "$SIZE" -gt 0 ]]; then
            log "Successfully backed up $DB ($(numfmt --to=iec-i --suffix=B "$SIZE"))"
        else
            log "WARNING: Backup file for $DB is empty!"
        fi
    fi
done

# Create a full backup of all databases
FULL_BACKUP="$BACKUP_DIR/all_databases_${TIMESTAMP}.sql.gz"
log "Creating full database backup..."
docker exec "$CONTAINER_NAME" bash -c "mysqldump -u'$DB_USER' -p'$DB_PASS' \
    --all-databases \
    --single-transaction \
    --routines \
    --triggers \
    --events | gzip > '$FULL_BACKUP'"

# Backup BookStack uploads directory if it exists
if docker exec "$CONTAINER_NAME" test -d "/var/www/bookstack/public/uploads"; then
    log "Backing up BookStack uploads..."
    UPLOADS_BACKUP="$BACKUP_DIR/bookstack_uploads_${TIMESTAMP}.tar.gz"
    docker exec "$CONTAINER_NAME" tar -czf "$UPLOADS_BACKUP" -C /var/www/bookstack/public uploads 2>/dev/null || true
fi

# Rotation: Remove old backups
log "Removing backups older than $RETENTION_DAYS days..."
docker exec "$CONTAINER_NAME" find "$BACKUP_DIR" -name "*.sql.gz" -o -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Create latest symlinks for easy access
docker exec "$CONTAINER_NAME" bash -c "cd '$BACKUP_DIR' && ln -sf 'all_databases_${TIMESTAMP}.sql.gz' 'latest_all_databases.sql.gz'"

# Generate backup report
BACKUP_COUNT=$(docker exec "$CONTAINER_NAME" find "$BACKUP_DIR" -name "*.gz" -type f | wc -l)
BACKUP_SIZE=$(docker exec "$CONTAINER_NAME" du -sh "$BACKUP_DIR" | cut -f1)

log "Backup completed successfully!"
log "Total backups: $BACKUP_COUNT"
log "Total size: $BACKUP_SIZE"

# Verify backup integrity
log "Verifying backup integrity..."
if docker exec "$CONTAINER_NAME" bash -c "gunzip -t '$FULL_BACKUP' 2>/dev/null"; then
    log "Backup integrity check passed"
else
    log "ERROR: Backup integrity check failed!"
    exit 1
fi

# Optional: Send notification
if [[ -n "${BACKUP_NOTIFICATION_WEBHOOK:-}" ]]; then
    curl -X POST "$BACKUP_NOTIFICATION_WEBHOOK" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"MariaDB backup completed: $BACKUP_COUNT files, $BACKUP_SIZE total\"}" \
        2>/dev/null || log "WARNING: Failed to send notification"
fi

exit 0