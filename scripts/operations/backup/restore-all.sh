#!/bin/bash
# Universal Restore Script for MosAIc Stack
# This script provides restoration procedures for all services

set -euo pipefail

# Configuration
BACKUP_BASE_DIR="${BACKUP_BASE_DIR:-/backup}"
LOG_FILE="/var/log/mosaic/restore.log"
RESTORE_TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Colored output functions
error() {
    echo -e "${RED}ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}SUCCESS: $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

# Show usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS] SERVICE [BACKUP_FILE]

Services:
  postgres    Restore PostgreSQL databases
  mariadb     Restore MariaDB databases (BookStack)
  redis       Restore Redis data
  gitea       Restore Gitea (repositories, config, data)
  all         Restore all services (interactive)

Options:
  -h, --help           Show this help message
  -l, --list           List available backups
  -f, --force          Force restore without confirmation
  -d, --date DATE      Restore from specific date (YYYYMMDD)
  --latest             Use latest backup (default)

Examples:
  $0 --list postgres
  $0 postgres
  $0 postgres /backup/postgres/gitea_20240119_120000.sql.gz
  $0 --date 20240119 gitea
  $0 all

EOF
    exit 1
}

# List available backups
list_backups() {
    local service=$1
    local backup_dir="$BACKUP_BASE_DIR/$service"
    
    echo "Available backups for $service:"
    echo "==============================="
    
    if [[ -d "$backup_dir" ]]; then
        ls -lah "$backup_dir" | grep -E "\.(sql|rdb|tar|zip)\.gz$|\.zip$" | sort -k9 -r
    else
        error "No backup directory found for $service"
    fi
}

# Get confirmation
confirm() {
    if [[ "${FORCE:-0}" == "1" ]]; then
        return 0
    fi
    
    local message=$1
    read -p "$message (yes/no): " -n 3 -r
    echo
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        return 0
    else
        return 1
    fi
}

# Stop service
stop_service() {
    local container=$1
    log "Stopping $container..."
    docker stop "$container" || error "Failed to stop $container"
}

# Start service
start_service() {
    local container=$1
    log "Starting $container..."
    docker start "$container" || error "Failed to start $container"
    sleep 5 # Give service time to initialize
}

# Restore PostgreSQL
restore_postgres() {
    local backup_file=${1:-"$BACKUP_BASE_DIR/postgres/latest_full_cluster.sql.gz"}
    local container="mosaic-postgres"
    
    log "Starting PostgreSQL restore from: $backup_file"
    
    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    warning "This will overwrite all PostgreSQL databases!"
    if ! confirm "Are you sure you want to restore PostgreSQL?"; then
        log "PostgreSQL restore cancelled"
        return 1
    fi
    
    # Stop dependent services
    log "Stopping dependent services..."
    docker stop mosaic-gitea mosaic-plane-api mosaic-plane-worker mosaic-plane-beat 2>/dev/null || true
    
    # Restore database
    log "Restoring PostgreSQL databases..."
    docker exec "$container" bash -c "gunzip -c '$backup_file' | psql -U postgres"
    
    if [[ $? -eq 0 ]]; then
        success "PostgreSQL restore completed successfully"
    else
        error "PostgreSQL restore failed"
        return 1
    fi
    
    # Restart dependent services
    log "Restarting dependent services..."
    docker start mosaic-gitea mosaic-plane-api mosaic-plane-worker mosaic-plane-beat 2>/dev/null || true
    
    return 0
}

# Restore MariaDB
restore_mariadb() {
    local backup_file=${1:-"$BACKUP_BASE_DIR/mariadb/latest_all_databases.sql.gz"}
    local container="mosaic-mariadb"
    
    log "Starting MariaDB restore from: $backup_file"
    
    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    warning "This will overwrite all MariaDB databases!"
    if ! confirm "Are you sure you want to restore MariaDB?"; then
        log "MariaDB restore cancelled"
        return 1
    fi
    
    # Stop dependent services
    log "Stopping dependent services..."
    docker stop mosaic-bookstack 2>/dev/null || true
    
    # Restore database
    log "Restoring MariaDB databases..."
    docker exec "$container" bash -c "gunzip -c '$backup_file' | mysql -uroot -p\${MYSQL_ROOT_PASSWORD}"
    
    if [[ $? -eq 0 ]]; then
        success "MariaDB restore completed successfully"
    else
        error "MariaDB restore failed"
        return 1
    fi
    
    # Restart dependent services
    log "Restarting dependent services..."
    docker start mosaic-bookstack 2>/dev/null || true
    
    return 0
}

# Restore Redis
restore_redis() {
    local backup_file=${1:-"$BACKUP_BASE_DIR/redis/latest.rdb.gz"}
    local container="mosaic-redis"
    
    log "Starting Redis restore from: $backup_file"
    
    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    warning "This will overwrite all Redis data!"
    if ! confirm "Are you sure you want to restore Redis?"; then
        log "Redis restore cancelled"
        return 1
    fi
    
    # Stop Redis
    stop_service "$container"
    
    # Backup current data
    log "Backing up current Redis data..."
    docker exec "$container" mv /data/dump.rdb "/data/dump.rdb.before_restore_${RESTORE_TIMESTAMP}" 2>/dev/null || true
    
    # Restore data
    log "Restoring Redis data..."
    docker exec "$container" bash -c "gunzip -c '$backup_file' > /data/dump.rdb"
    
    # Fix permissions
    docker exec "$container" chown redis:redis /data/dump.rdb
    
    # Start Redis
    start_service "$container"
    
    # Verify restore
    if docker exec "$container" redis-cli ping > /dev/null 2>&1; then
        success "Redis restore completed successfully"
        
        # Show key count
        local db_size=$(docker exec "$container" redis-cli DBSIZE | awk '{print $1}')
        log "Restored $db_size keys"
    else
        error "Redis restore failed"
        return 1
    fi
    
    return 0
}

# Restore Gitea
restore_gitea() {
    local backup_file=${1:-"$BACKUP_BASE_DIR/gitea/latest_full.zip"}
    local container="mosaic-gitea"
    
    log "Starting Gitea restore from: $backup_file"
    
    if [[ ! -f "$backup_file" ]]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    warning "This will overwrite all Gitea data!"
    if ! confirm "Are you sure you want to restore Gitea?"; then
        log "Gitea restore cancelled"
        return 1
    fi
    
    # Stop Gitea
    stop_service "$container"
    
    # Create restore directory
    local restore_dir="/tmp/gitea_restore_${RESTORE_TIMESTAMP}"
    docker exec "$container" mkdir -p "$restore_dir"
    
    # Extract backup
    log "Extracting Gitea backup..."
    docker exec "$container" unzip -q "$backup_file" -d "$restore_dir"
    
    # Restore data
    log "Restoring Gitea data..."
    docker exec -u root "$container" bash -c "
        # Backup current data
        mv /data /data.before_restore_${RESTORE_TIMESTAMP}
        
        # Create new data directory
        mkdir -p /data
        
        # Restore from backup
        cd $restore_dir
        tar -xzf gitea-repo.zip -C /data
        tar -xzf gitea-db.sql.gz -C /tmp
        
        # Fix permissions
        chown -R git:git /data
    "
    
    # Restore database (if using external PostgreSQL)
    if docker exec "$container" test -f "/tmp/gitea-db.sql"; then
        log "Restoring Gitea database..."
        docker exec mosaic-postgres bash -c "psql -U gitea gitea < /tmp/gitea-db.sql"
    fi
    
    # Start Gitea
    start_service "$container"
    
    # Wait for Gitea to be ready
    log "Waiting for Gitea to start..."
    local max_attempts=30
    local attempt=0
    while [[ $attempt -lt $max_attempts ]]; do
        if docker exec "$container" curl -s http://localhost:3000/api/v1/version > /dev/null; then
            success "Gitea restore completed successfully"
            return 0
        fi
        sleep 2
        ((attempt++))
    done
    
    error "Gitea failed to start after restore"
    return 1
}

# Restore all services
restore_all() {
    log "Starting full system restore..."
    
    warning "This will restore ALL services from their latest backups!"
    if ! confirm "Are you sure you want to restore all services?"; then
        log "Full restore cancelled"
        return 1
    fi
    
    local failed_services=()
    
    # Restore in order of dependencies
    echo
    echo "1. Restoring PostgreSQL..."
    restore_postgres || failed_services+=("postgres")
    
    echo
    echo "2. Restoring MariaDB..."
    restore_mariadb || failed_services+=("mariadb")
    
    echo
    echo "3. Restoring Redis..."
    restore_redis || failed_services+=("redis")
    
    echo
    echo "4. Restoring Gitea..."
    restore_gitea || failed_services+=("gitea")
    
    echo
    echo "======================================="
    echo "Full System Restore Summary:"
    echo "======================================="
    
    if [[ ${#failed_services[@]} -eq 0 ]]; then
        success "All services restored successfully!"
    else
        error "Failed to restore: ${failed_services[*]}"
        return 1
    fi
}

# Main script logic
main() {
    local service=""
    local backup_file=""
    local list_mode=0
    local use_date=""
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                usage
                ;;
            -l|--list)
                list_mode=1
                shift
                ;;
            -f|--force)
                FORCE=1
                shift
                ;;
            -d|--date)
                use_date="$2"
                shift 2
                ;;
            --latest)
                # Default behavior
                shift
                ;;
            postgres|mariadb|redis|gitea|all)
                service="$1"
                shift
                if [[ $# -gt 0 && ! "$1" =~ ^- ]]; then
                    backup_file="$1"
                    shift
                fi
                ;;
            *)
                error "Unknown option: $1"
                usage
                ;;
        esac
    done
    
    # Validate service
    if [[ -z "$service" ]]; then
        error "No service specified"
        usage
    fi
    
    # List mode
    if [[ $list_mode -eq 1 ]]; then
        list_backups "$service"
        exit 0
    fi
    
    # Find backup by date if specified
    if [[ -n "$use_date" && -z "$backup_file" ]]; then
        case $service in
            postgres)
                backup_file=$(ls -1 "$BACKUP_BASE_DIR/postgres/full_cluster_${use_date}"*.sql.gz 2>/dev/null | head -1)
                ;;
            mariadb)
                backup_file=$(ls -1 "$BACKUP_BASE_DIR/mariadb/all_databases_${use_date}"*.sql.gz 2>/dev/null | head -1)
                ;;
            redis)
                backup_file=$(ls -1 "$BACKUP_BASE_DIR/redis/redis_${use_date}"*.rdb.gz 2>/dev/null | head -1)
                ;;
            gitea)
                backup_file=$(ls -1 "$BACKUP_BASE_DIR/gitea/gitea-backup-${use_date}"*.zip 2>/dev/null | head -1)
                ;;
        esac
        
        if [[ -z "$backup_file" ]]; then
            error "No backup found for date: $use_date"
            exit 1
        fi
    fi
    
    # Perform restore
    case $service in
        postgres)
            restore_postgres "$backup_file"
            ;;
        mariadb)
            restore_mariadb "$backup_file"
            ;;
        redis)
            restore_redis "$backup_file"
            ;;
        gitea)
            restore_gitea "$backup_file"
            ;;
        all)
            restore_all
            ;;
        *)
            error "Unknown service: $service"
            usage
            ;;
    esac
}

# Run main function
main "$@"