#!/bin/bash
# Gitea Complete Backup Script
# This script performs full Gitea backups including repositories, database, and configuration

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backup/gitea}"
CONTAINER_NAME="${GITEA_CONTAINER:-mosaic-gitea}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/mosaic/backup-gitea.log"
GITEA_DATA_DIR="/data"

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
log "Starting Gitea backup..."

# Create backup directory if it doesn't exist
docker exec "$CONTAINER_NAME" mkdir -p "$BACKUP_DIR"

# Check Gitea is running
if ! docker exec "$CONTAINER_NAME" curl -s http://localhost:3000/api/v1/version > /dev/null; then
    log "ERROR: Gitea is not responding!"
    exit 1
fi

# Get Gitea version
GITEA_VERSION=$(docker exec "$CONTAINER_NAME" gitea --version | grep "Gitea version" | awk '{print $3}')
log "Gitea version: $GITEA_VERSION"

# Use Gitea's built-in backup command
log "Creating Gitea backup using built-in command..."
BACKUP_NAME="gitea-backup-${TIMESTAMP}"

# Run Gitea backup
docker exec -u git "$CONTAINER_NAME" bash -c "cd /data && gitea dump \
    --file '${BACKUP_DIR}/${BACKUP_NAME}.zip' \
    --verbose \
    --type zip"

# Check if backup was created
if docker exec "$CONTAINER_NAME" test -f "${BACKUP_DIR}/${BACKUP_NAME}.zip"; then
    SIZE=$(docker exec "$CONTAINER_NAME" stat -c%s "${BACKUP_DIR}/${BACKUP_NAME}.zip")
    log "Gitea backup created successfully ($(numfmt --to=iec-i --suffix=B "$SIZE"))"
else
    log "ERROR: Gitea backup file not found!"
    exit 1
fi

# Also create individual component backups for granular restore

# 1. Backup repositories separately
log "Creating separate repository backup..."
REPO_BACKUP="${BACKUP_DIR}/gitea_repos_${TIMESTAMP}.tar.gz"
docker exec "$CONTAINER_NAME" tar -czf "$REPO_BACKUP" -C "$GITEA_DATA_DIR" git/repositories

# 2. Backup LFS data if exists
if docker exec "$CONTAINER_NAME" test -d "$GITEA_DATA_DIR/git/lfs"; then
    log "Backing up LFS data..."
    LFS_BACKUP="${BACKUP_DIR}/gitea_lfs_${TIMESTAMP}.tar.gz"
    docker exec "$CONTAINER_NAME" tar -czf "$LFS_BACKUP" -C "$GITEA_DATA_DIR" git/lfs
fi

# 3. Backup avatars and attachments
log "Backing up avatars and attachments..."
AVATARS_BACKUP="${BACKUP_DIR}/gitea_avatars_${TIMESTAMP}.tar.gz"
docker exec "$CONTAINER_NAME" tar -czf "$AVATARS_BACKUP" -C "$GITEA_DATA_DIR" avatars attachments 2>/dev/null || true

# 4. Export configuration
CONFIG_BACKUP="${BACKUP_DIR}/gitea_config_${TIMESTAMP}.tar.gz"
log "Backing up configuration..."
docker exec "$CONTAINER_NAME" tar -czf "$CONFIG_BACKUP" -C "$GITEA_DATA_DIR/gitea" conf

# 5. Create repository statistics
STATS_FILE="${BACKUP_DIR}/gitea_stats_${TIMESTAMP}.txt"
log "Generating repository statistics..."
{
    echo "=== Gitea Backup Statistics ==="
    echo "Timestamp: $(date)"
    echo "Version: $GITEA_VERSION"
    echo ""
    echo "=== Repository Count ==="
    docker exec "$CONTAINER_NAME" find "$GITEA_DATA_DIR/git/repositories" -type d -name "*.git" | wc -l
    echo ""
    echo "=== Repository Sizes ==="
    docker exec "$CONTAINER_NAME" du -sh "$GITEA_DATA_DIR/git/repositories/"* 2>/dev/null | sort -hr | head -20
    echo ""
    echo "=== LFS Storage ==="
    docker exec "$CONTAINER_NAME" du -sh "$GITEA_DATA_DIR/git/lfs" 2>/dev/null || echo "No LFS data"
    echo ""
    echo "=== Total Data Size ==="
    docker exec "$CONTAINER_NAME" du -sh "$GITEA_DATA_DIR"
} > "$STATS_FILE"

# 6. Backup custom templates if they exist
if docker exec "$CONTAINER_NAME" test -d "$GITEA_DATA_DIR/gitea/templates"; then
    log "Backing up custom templates..."
    TEMPLATES_BACKUP="${BACKUP_DIR}/gitea_templates_${TIMESTAMP}.tar.gz"
    docker exec "$CONTAINER_NAME" tar -czf "$TEMPLATES_BACKUP" -C "$GITEA_DATA_DIR/gitea" templates
fi

# Rotation: Remove old backups
log "Removing backups older than $RETENTION_DAYS days..."
docker exec "$CONTAINER_NAME" find "$BACKUP_DIR" \
    \( -name "gitea-backup-*.zip" -o -name "gitea_*.tar.gz" -o -name "gitea_*.txt" \) \
    -mtime +$RETENTION_DAYS -delete

# Create latest symlinks for easy access
docker exec "$CONTAINER_NAME" bash -c "cd '$BACKUP_DIR' && ln -sf 'gitea-backup-${TIMESTAMP}.zip' 'latest_full.zip'"
docker exec "$CONTAINER_NAME" bash -c "cd '$BACKUP_DIR' && ln -sf 'gitea_repos_${TIMESTAMP}.tar.gz' 'latest_repos.tar.gz'"

# Verify backup integrity
log "Verifying backup integrity..."
if docker exec "$CONTAINER_NAME" unzip -t "${BACKUP_DIR}/${BACKUP_NAME}.zip" > /dev/null 2>&1; then
    log "Backup integrity check passed"
else
    log "WARNING: Backup integrity check failed!"
fi

# Generate backup report
BACKUP_COUNT=$(docker exec "$CONTAINER_NAME" find "$BACKUP_DIR" -name "gitea*" -type f | wc -l)
BACKUP_SIZE=$(docker exec "$CONTAINER_NAME" du -sh "$BACKUP_DIR" | cut -f1)

log "Backup completed successfully!"
log "Total backups: $BACKUP_COUNT"
log "Total size: $BACKUP_SIZE"

# Optional: Send notification
if [[ -n "${BACKUP_NOTIFICATION_WEBHOOK:-}" ]]; then
    curl -X POST "$BACKUP_NOTIFICATION_WEBHOOK" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"Gitea backup completed: $BACKUP_COUNT files, $BACKUP_SIZE total\"}" \
        2>/dev/null || log "WARNING: Failed to send notification"
fi

exit 0