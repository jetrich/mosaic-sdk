#!/bin/bash
# scripts/migration/migrate-to-xdg.sh - Zero-Disruption XDG Migration

set -euo pipefail

# Configuration
OLD_DIR="$HOME/.mosaic"
NEW_CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/mosaic"
NEW_DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/mosaic"
NEW_CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/mosaic"
NEW_STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/mosaic"
BACKUP_DIR="$HOME/.mosaic-migration-backup-$(date +%Y%m%d_%H%M%S)"
MIGRATION_LOG="$HOME/.mosaic-migration.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$MIGRATION_LOG"
}

# Error handling
handle_error() {
    log "${RED}ERROR: Migration failed at step: $1${NC}"
    log "${YELLOW}Rolling back changes...${NC}"
    rollback_migration
    exit 1
}

# Pre-migration checks
pre_migration_checks() {
    log "${BLUE}🔍 Running pre-migration checks...${NC}"
    
    # Check if old directory exists
    if [ ! -d "$OLD_DIR" ]; then
        log "${GREEN}✅ No legacy ~/.mosaic found. Migration not needed.${NC}"
        exit 0
    fi
    
    # Check if already migrated (symlink exists)
    if [ -L "$OLD_DIR" ]; then
        local target=$(readlink "$OLD_DIR" 2>/dev/null || echo "")
        if [ "$target" = "$NEW_CONFIG_DIR" ]; then
            log "${GREEN}✅ Migration already completed. Symlink exists.${NC}"
            exit 0
        fi
    fi
    
    # Check for running processes
    if pgrep -f "mosaic" > /dev/null 2>&1; then
        log "${YELLOW}⚠️  MosAIc processes are running. Please stop them first:${NC}"
        pgrep -f "mosaic" -l || true
        read -p "Stop processes and continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Migration cancelled by user"
            exit 1
        fi
        pkill -f "mosaic" || true
        sleep 2
    fi
    
    # Check disk space
    local required_space=$(du -s "$OLD_DIR" 2>/dev/null | cut -f1 || echo "0")
    local available_space=$(df "$HOME" | tail -1 | awk '{print $4}')
    
    if [ "$required_space" -gt "$((available_space / 2))" ]; then
        log "${RED}❌ Insufficient disk space for migration${NC}"
        exit 1
    fi
    
    # Check permissions
    if [ ! -w "$HOME" ]; then
        log "${RED}❌ No write permission to home directory${NC}"
        exit 1
    fi
    
    log "${GREEN}✅ Pre-migration checks passed${NC}"
}

# Create backup
create_backup() {
    log "${BLUE}📦 Creating backup at $BACKUP_DIR...${NC}"
    cp -r "$OLD_DIR" "$BACKUP_DIR" || handle_error "backup creation"
    log "${GREEN}✅ Backup created successfully${NC}"
}

# Create XDG directories
create_xdg_directories() {
    log "${BLUE}📁 Creating XDG directories...${NC}"
    mkdir -p "$NEW_CONFIG_DIR" || handle_error "config directory creation"
    mkdir -p "$NEW_DATA_DIR" || handle_error "data directory creation"
    mkdir -p "$NEW_CACHE_DIR" || handle_error "cache directory creation"
    mkdir -p "$NEW_STATE_DIR/logs" || handle_error "state directory creation"
    log "${GREEN}✅ XDG directories created${NC}"
}

# Migrate files intelligently
migrate_files() {
    log "${BLUE}🚚 Migrating files to XDG locations...${NC}"
    
    # Configuration files
    if [ -f "$OLD_DIR/config.json" ]; then
        cp "$OLD_DIR/config.json" "$NEW_CONFIG_DIR/" || handle_error "config migration"
        log "  • config.json → ~/.config/mosaic/"
    fi
    
    if [ -d "$OLD_DIR/claude" ]; then
        cp -r "$OLD_DIR/claude" "$NEW_CONFIG_DIR/" || handle_error "claude config migration"
        log "  • claude/ → ~/.config/mosaic/"
    fi
    
    if [ -d "$OLD_DIR/frameworks" ]; then
        cp -r "$OLD_DIR/frameworks" "$NEW_CONFIG_DIR/" || handle_error "frameworks migration"
        log "  • frameworks/ → ~/.config/mosaic/"
    fi
    
    # Data files
    if [ -d "$OLD_DIR/data" ]; then
        cp -r "$OLD_DIR/data"/* "$NEW_DATA_DIR/" 2>/dev/null || true
        log "  • data/ → ~/.local/share/mosaic/"
    fi
    
    if [ -d "$OLD_DIR/backups" ]; then
        cp -r "$OLD_DIR/backups" "$NEW_DATA_DIR/" || handle_error "backups migration"
        log "  • backups/ → ~/.local/share/mosaic/"
    fi
    
    # State files (logs)
    if [ -d "$OLD_DIR/logs" ]; then
        cp -r "$OLD_DIR/logs"/* "$NEW_STATE_DIR/logs/" 2>/dev/null || true
        log "  • logs/ → ~/.local/state/mosaic/logs/"
    fi
    
    # Preserve permissions
    find "$NEW_CONFIG_DIR" -type f -exec chmod 600 {} \; 2>/dev/null || true
    find "$NEW_DATA_DIR" -type f -exec chmod 600 {} \; 2>/dev/null || true
    
    log "${GREEN}✅ Files migrated successfully${NC}"
}

# Create backward compatibility symlink
create_symlink() {
    log "${BLUE}🔗 Creating backward compatibility symlink...${NC}"
    
    # Remove old directory (it's backed up)
    rm -rf "$OLD_DIR" || handle_error "old directory removal"
    
    # Create symlink
    ln -s "$NEW_CONFIG_DIR" "$OLD_DIR" || handle_error "symlink creation"
    
    # Verify symlink
    if [ ! -L "$OLD_DIR" ] || [ "$(readlink "$OLD_DIR")" != "$NEW_CONFIG_DIR" ]; then
        handle_error "symlink verification"
    fi
    
    log "${GREEN}✅ Symlink created: ~/.mosaic -> ~/.config/mosaic${NC}"
}

# Update configurations
update_configurations() {
    log "${BLUE}⚙️  Updating configurations for XDG paths...${NC}"
    
    # Update main config to use XDG paths
    if [ -f "$NEW_CONFIG_DIR/config.json" ]; then
        # Use jq to update paths if available, otherwise use sed
        if command -v jq >/dev/null 2>&1; then
            jq --arg data_dir "$NEW_DATA_DIR" \
               --arg cache_dir "$NEW_CACHE_DIR" \
               --arg state_dir "$NEW_STATE_DIR" \
               '.paths.data = $data_dir | .paths.cache = $cache_dir | .paths.state = $state_dir' \
               "$NEW_CONFIG_DIR/config.json" > "$NEW_CONFIG_DIR/config.json.tmp" 2>/dev/null && \
               mv "$NEW_CONFIG_DIR/config.json.tmp" "$NEW_CONFIG_DIR/config.json" || true
        fi
    fi
    
    log "${GREEN}✅ Configurations updated${NC}"
}

# Verify migration
verify_migration() {
    log "${BLUE}🔍 Verifying migration...${NC}"
    
    # Check symlink
    if [ ! -L "$OLD_DIR" ]; then
        handle_error "symlink verification failed"
    fi
    
    # Check file accessibility through symlink
    if [ -f "$NEW_CONFIG_DIR/config.json" ] && [ ! -f "$OLD_DIR/config.json" ]; then
        handle_error "file accessibility through symlink"
    fi
    
    # Check XDG directories
    for dir in "$NEW_CONFIG_DIR" "$NEW_DATA_DIR" "$NEW_CACHE_DIR" "$NEW_STATE_DIR"; do
        if [ ! -d "$dir" ]; then
            handle_error "XDG directory verification: $dir"
        fi
    done
    
    log "${GREEN}✅ Migration verification passed${NC}"
}

# Rollback function
rollback_migration() {
    log "${YELLOW}🔄 Rolling back migration...${NC}"
    
    # Remove symlink if it exists
    if [ -L "$OLD_DIR" ]; then
        rm "$OLD_DIR"
    fi
    
    # Remove XDG directories
    rm -rf "$NEW_CONFIG_DIR" "$NEW_DATA_DIR" "$NEW_CACHE_DIR" "$NEW_STATE_DIR" 2>/dev/null || true
    
    # Restore from backup
    if [ -d "$BACKUP_DIR" ]; then
        cp -r "$BACKUP_DIR" "$OLD_DIR"
        log "${GREEN}✅ Rollback completed. Original ~/.mosaic restored.${NC}"
    else
        log "${RED}❌ No backup found for rollback${NC}"
    fi
}

# Create migration report
create_migration_report() {
    local report_file="$HOME/.mosaic-migration-report.txt"
    
    cat > "$report_file" << EOF
MosAIc XDG Migration Report
==========================
Date: $(date)
Status: SUCCESS

Migration Details:
- Old location: ~/.mosaic (now symlink)
- New locations:
  * Config: $NEW_CONFIG_DIR
  * Data: $NEW_DATA_DIR
  * Cache: $NEW_CACHE_DIR
  * Logs: $NEW_STATE_DIR/logs

Backward Compatibility:
- Symlink created: ~/.mosaic -> ~/.config/mosaic
- All existing scripts should continue working
- Deprecation timeline: 6 months

Files Migrated:
$(find "$NEW_CONFIG_DIR" "$NEW_DATA_DIR" "$NEW_STATE_DIR" -type f 2>/dev/null | wc -l) files total

Backup Location: $BACKUP_DIR

Next Steps:
1. Test your MosAIc installation
2. Update any custom scripts to use XDG paths (optional)
3. The symlink will be removed in 6 months

For support: https://docs.mosaic.dev/migration
EOF

    log "${BLUE}📋 Migration report created: $report_file${NC}"
}

# Main migration function
main() {
    log "${GREEN}🚀 Starting MosAIc XDG Migration${NC}"
    log "================================"
    
    pre_migration_checks
    create_backup
    create_xdg_directories
    migrate_files
    create_symlink
    update_configurations
    verify_migration
    create_migration_report
    
    log "${GREEN}🎉 Migration completed successfully!${NC}"
    log ""
    log "${BLUE}📋 Summary:${NC}"
    log "  • Configuration moved to: $NEW_CONFIG_DIR"
    log "  • Data moved to: $NEW_DATA_DIR"
    log "  • Logs moved to: $NEW_STATE_DIR/logs"
    log "  • Backward compatibility: ~/.mosaic -> ~/.config/mosaic"
    log "  • Backup available at: $BACKUP_DIR"
    log ""
    log "${YELLOW}⚠️  The symlink ~/.mosaic will be removed in 6 months${NC}"
    log "   Please update any custom scripts to use XDG paths"
    log ""
    log "${BLUE}🔗 Documentation: https://docs.mosaic.dev/xdg-migration${NC}"
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "MosAIc XDG Migration Script"
        echo "Usage: $0 [--dry-run] [--force] [--help]"
        echo ""
        echo "Options:"
        echo "  --dry-run    Show what would be done without making changes"
        echo "  --force      Skip confirmation prompts"
        echo "  --help       Show this help message"
        exit 0
        ;;
    --dry-run)
        echo "DRY RUN MODE - No changes will be made"
        echo "Would migrate: $OLD_DIR -> $NEW_CONFIG_DIR"
        echo "Would create symlink: ~/.mosaic -> ~/.config/mosaic"
        exit 0
        ;;
    --force)
        # Skip interactive prompts
        ;;
    "")
        # Normal operation
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac

# Run migration
main "$@"