#!/bin/bash
# PostgreSQL Backup Script with Rotation
# This script performs full database backups with automatic rotation

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backup/postgres}"
CONTAINER_NAME="${POSTGRES_CONTAINER:-mosaic-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/mosaic/backup-postgres.log"

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
log "Starting PostgreSQL backup..."

# Create backup directory if it doesn't exist
docker exec "$CONTAINER_NAME" mkdir -p "$BACKUP_DIR"

# Get list of databases (excluding templates)
log "Fetching database list..."
DATABASES=$(docker exec "$CONTAINER_NAME" psql -U postgres -t -c "SELECT datname FROM pg_database WHERE NOT datistemplate AND datname != 'postgres';")

# Backup each database
for DB in $DATABASES; do
    DB=$(echo "$DB" | xargs) # Trim whitespace
    if [[ -n "$DB" ]]; then
        BACKUP_FILE="$BACKUP_DIR/${DB}_${TIMESTAMP}.sql.gz"
        log "Backing up database: $DB"
        
        # Perform backup with compression
        docker exec "$CONTAINER_NAME" bash -c "pg_dump -U postgres -d '$DB' --verbose --clean --if-exists | gzip > '$BACKUP_FILE'"
        
        # Check backup file size
        SIZE=$(docker exec "$CONTAINER_NAME" stat -c%s "$BACKUP_FILE" 2>/dev/null || echo "0")
        if [[ "$SIZE" -gt 0 ]]; then
            log "Successfully backed up $DB ($(numfmt --to=iec-i --suffix=B "$SIZE"))"
        else
            log "WARNING: Backup file for $DB is empty!"
        fi
    fi
done

# Backup global objects (roles, tablespaces)
GLOBALS_FILE="$BACKUP_DIR/globals_${TIMESTAMP}.sql.gz"
log "Backing up global objects..."
docker exec "$CONTAINER_NAME" bash -c "pg_dumpall -U postgres --globals-only | gzip > '$GLOBALS_FILE'"

# Create a full cluster backup as well
FULL_BACKUP="$BACKUP_DIR/full_cluster_${TIMESTAMP}.sql.gz"
log "Creating full cluster backup..."
docker exec "$CONTAINER_NAME" bash -c "pg_dumpall -U postgres | gzip > '$FULL_BACKUP'"

# Rotation: Remove old backups
log "Removing backups older than $RETENTION_DAYS days..."
docker exec "$CONTAINER_NAME" find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Create latest symlinks for easy access
docker exec "$CONTAINER_NAME" bash -c "cd '$BACKUP_DIR' && ln -sf 'full_cluster_${TIMESTAMP}.sql.gz' 'latest_full_cluster.sql.gz'"

# Generate backup report
BACKUP_COUNT=$(docker exec "$CONTAINER_NAME" find "$BACKUP_DIR" -name "*.sql.gz" -type f | wc -l)
BACKUP_SIZE=$(docker exec "$CONTAINER_NAME" du -sh "$BACKUP_DIR" | cut -f1)

log "Backup completed successfully!"
log "Total backups: $BACKUP_COUNT"
log "Total size: $BACKUP_SIZE"

# Optional: Send notification
if [[ -n "${BACKUP_NOTIFICATION_WEBHOOK:-}" ]]; then
    curl -X POST "$BACKUP_NOTIFICATION_WEBHOOK" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"PostgreSQL backup completed: $BACKUP_COUNT files, $BACKUP_SIZE total\"}" \
        2>/dev/null || log "WARNING: Failed to send notification"
fi

exit 0