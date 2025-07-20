#!/bin/bash
# Redis Backup Script with Snapshot Management
# This script performs Redis RDB snapshots with automatic rotation

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backup/redis}"
CONTAINER_NAME="${REDIS_CONTAINER:-mosaic-redis}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/mosaic/backup-redis.log"
REDIS_DATA_DIR="/data"

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
log "Starting Redis backup..."

# Create backup directory if it doesn't exist
docker exec "$CONTAINER_NAME" mkdir -p "$BACKUP_DIR"

# Check Redis is running
if ! docker exec "$CONTAINER_NAME" redis-cli ping > /dev/null 2>&1; then
    log "ERROR: Redis is not responding!"
    exit 1
fi

# Get Redis info
REDIS_VERSION=$(docker exec "$CONTAINER_NAME" redis-cli --version | awk '{print $3}')
log "Redis version: $REDIS_VERSION"

# Get current memory usage
MEMORY_USAGE=$(docker exec "$CONTAINER_NAME" redis-cli info memory | grep used_memory_human | cut -d: -f2 | tr -d '\r')
log "Current memory usage: $MEMORY_USAGE"

# Trigger a background save
log "Initiating background save..."
docker exec "$CONTAINER_NAME" redis-cli BGSAVE

# Wait for background save to complete
while [ "$(docker exec "$CONTAINER_NAME" redis-cli LASTSAVE)" == "$(docker exec "$CONTAINER_NAME" redis-cli LASTSAVE)" ]; do
    SAVING=$(docker exec "$CONTAINER_NAME" redis-cli INFO persistence | grep rdb_bgsave_in_progress:1 || echo "")
    if [[ -z "$SAVING" ]]; then
        break
    fi
    log "Waiting for background save to complete..."
    sleep 2
done

log "Background save completed"

# Copy the RDB file to backup location
RDB_FILE="$REDIS_DATA_DIR/dump.rdb"
BACKUP_FILE="$BACKUP_DIR/redis_${TIMESTAMP}.rdb"
BACKUP_FILE_GZ="$BACKUP_DIR/redis_${TIMESTAMP}.rdb.gz"

log "Copying RDB file to backup location..."
docker exec "$CONTAINER_NAME" cp "$RDB_FILE" "$BACKUP_FILE"

# Compress the backup
log "Compressing backup..."
docker exec "$CONTAINER_NAME" gzip -c "$BACKUP_FILE" > "$BACKUP_FILE_GZ"
docker exec "$CONTAINER_NAME" rm "$BACKUP_FILE"

# Verify backup
SIZE=$(docker exec "$CONTAINER_NAME" stat -c%s "$BACKUP_FILE_GZ" 2>/dev/null || echo "0")
if [[ "$SIZE" -gt 0 ]]; then
    log "Successfully created backup ($(numfmt --to=iec-i --suffix=B "$SIZE"))"
else
    log "ERROR: Backup file is empty!"
    exit 1
fi

# Also backup AOF file if it exists
AOF_FILE="$REDIS_DATA_DIR/appendonly.aof"
if docker exec "$CONTAINER_NAME" test -f "$AOF_FILE"; then
    log "Backing up AOF file..."
    AOF_BACKUP="$BACKUP_DIR/redis_aof_${TIMESTAMP}.aof.gz"
    docker exec "$CONTAINER_NAME" bash -c "gzip -c '$AOF_FILE' > '$AOF_BACKUP'"
fi

# Export Redis configuration
CONFIG_BACKUP="$BACKUP_DIR/redis_config_${TIMESTAMP}.conf"
log "Exporting Redis configuration..."
docker exec "$CONTAINER_NAME" redis-cli CONFIG GET '*' > "$CONFIG_BACKUP" 2>/dev/null || true

# Export key statistics
STATS_FILE="$BACKUP_DIR/redis_stats_${TIMESTAMP}.txt"
log "Exporting key statistics..."
{
    echo "=== Redis Backup Statistics ==="
    echo "Timestamp: $(date)"
    echo "Memory Usage: $MEMORY_USAGE"
    echo ""
    echo "=== Key Count by Database ==="
    for i in {0..15}; do
        COUNT=$(docker exec "$CONTAINER_NAME" redis-cli -n $i DBSIZE | awk '{print $1}')
        if [[ "$COUNT" != "0" ]]; then
            echo "DB$i: $COUNT keys"
        fi
    done
    echo ""
    echo "=== Key Pattern Analysis ==="
    docker exec "$CONTAINER_NAME" redis-cli --scan --pattern '*' | head -1000 | \
        awk -F: '{print $1}' | sort | uniq -c | sort -rn | head -20
} > "$STATS_FILE"

# Rotation: Remove old backups
log "Removing backups older than $RETENTION_DAYS days..."
docker exec "$CONTAINER_NAME" find "$BACKUP_DIR" \
    \( -name "*.rdb.gz" -o -name "*.aof.gz" -o -name "*.conf" -o -name "*.txt" \) \
    -mtime +$RETENTION_DAYS -delete

# Create latest symlink for easy access
docker exec "$CONTAINER_NAME" bash -c "cd '$BACKUP_DIR' && ln -sf 'redis_${TIMESTAMP}.rdb.gz' 'latest.rdb.gz'"

# Generate backup report
BACKUP_COUNT=$(docker exec "$CONTAINER_NAME" find "$BACKUP_DIR" -name "*.gz" -type f | wc -l)
BACKUP_SIZE=$(docker exec "$CONTAINER_NAME" du -sh "$BACKUP_DIR" | cut -f1)

log "Backup completed successfully!"
log "Total backups: $BACKUP_COUNT"
log "Total size: $BACKUP_SIZE"

# Optional: Send notification
if [[ -n "${BACKUP_NOTIFICATION_WEBHOOK:-}" ]]; then
    curl -X POST "$BACKUP_NOTIFICATION_WEBHOOK" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"Redis backup completed: $BACKUP_COUNT files, $BACKUP_SIZE total, Memory: $MEMORY_USAGE\"}" \
        2>/dev/null || log "WARNING: Failed to send notification"
fi

exit 0