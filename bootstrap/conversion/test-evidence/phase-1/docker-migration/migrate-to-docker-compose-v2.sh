#!/bin/bash

# Docker Compose v2 Migration Script
# Migrates all docker-compose (v1) usage to docker compose (v2)

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Tracking
FILES_UPDATED=0
TOTAL_REPLACEMENTS=0
BACKUP_DIR="/home/jwoltje/src/tony-ng/test-evidence/phase-1/docker-migration/backups-$(date +%Y%m%d-%H%M%S)"

# Log functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
create_backups() {
    log_info "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
}

# Backup file before modification
backup_file() {
    local file="$1"
    local backup_path="$BACKUP_DIR/$(basename "$file").backup"
    cp "$file" "$backup_path"
    echo "$backup_path"
}

# Fix docker-utils.sh specifically
fix_docker_utils() {
    local file="/home/jwoltje/src/tony-ng/scripts/shared/docker-utils.sh"
    
    if [ ! -f "$file" ]; then
        log_warning "docker-utils.sh not found"
        return
    fi
    
    log_info "Fixing docker-utils.sh configuration..."
    
    # Backup first
    backup_file "$file"
    
    # Fix the DEPRECATED_DOCKER_COMPOSE_CMD line
    sed -i 's/DEPRECATED_DOCKER_COMPOSE_CMD="docker compose"/DEPRECATED_DOCKER_COMPOSE_CMD="docker-compose"/g' "$file"
    
    # Also fix any other docker-compose references in checking logic
    sed -i 's/docker-compose/docker-compose/g' "$file"
    sed -i 's/docker compose/docker compose/g' "$file"
    
    log_success "Fixed docker-utils.sh"
    ((FILES_UPDATED++))
}

# Migrate individual file
migrate_file() {
    local file="$1"
    
    if [ ! -f "$file" ]; then
        return
    fi
    
    # Check if file contains docker-compose
    if ! grep -q "docker-compose" "$file" 2>/dev/null; then
        return
    fi
    
    # Count replacements
    local count=$(grep -c "docker-compose" "$file" 2>/dev/null || echo "0")
    
    if [ "$count" -gt 0 ]; then
        log_info "Processing: $file (found $count occurrences)"
        
        # Backup file
        local backup_path=$(backup_file "$file")
        
        # Special handling for different file types
        case "$file" in
            *.md)
                # For markdown files, be careful about code blocks
                # Replace docker-compose commands but preserve references to filenames
                sed -i 's/docker-compose up/docker compose up/g' "$file"
                sed -i 's/docker-compose down/docker compose down/g' "$file"
                sed -i 's/docker-compose ps/docker compose ps/g' "$file"
                sed -i 's/docker-compose exec/docker compose exec/g' "$file"
                sed -i 's/docker-compose logs/docker compose logs/g' "$file"
                sed -i 's/docker-compose build/docker compose build/g' "$file"
                sed -i 's/docker-compose start/docker compose start/g' "$file"
                sed -i 's/docker-compose stop/docker compose stop/g' "$file"
                sed -i 's/docker-compose restart/docker compose restart/g' "$file"
                sed -i 's/docker-compose pull/docker compose pull/g' "$file"
                sed -i 's/docker-compose -f/docker compose -f/g' "$file"
                sed -i 's/docker-compose --version/docker compose version/g' "$file"
                # Don't replace references to docker-compose.yml filenames
                ;;
            *.sh|*.bash)
                # For shell scripts, replace all docker-compose commands
                sed -i 's/docker-compose/docker compose/g' "$file"
                ;;
            *.json)
                # For JSON files (like package.json), replace docker-compose commands
                sed -i 's/"docker-compose/"docker compose/g' "$file"
                ;;
            *.yml|*.yaml)
                # For YAML files, be careful about comments and values
                sed -i 's/docker-compose /docker compose /g' "$file"
                ;;
            *)
                # Default: replace all occurrences
                sed -i 's/docker-compose/docker compose/g' "$file"
                ;;
        esac
        
        # Verify changes
        local new_count=$(grep -c "docker-compose" "$file" 2>/dev/null || echo "0")
        local replacements=$((count - new_count))
        
        if [ "$replacements" -gt 0 ]; then
            log_success "Updated $file: $replacements replacements made"
            ((FILES_UPDATED++))
            ((TOTAL_REPLACEMENTS += replacements))
        else
            log_warning "No replacements made in $file (might need manual review)"
        fi
    fi
}

# Main migration function
main() {
    log_info "Starting Docker Compose v2 Migration"
    echo "===================================="
    
    # Create backups
    create_backups
    
    # First, fix docker-utils.sh
    fix_docker_utils
    
    # Find and migrate all files
    log_info "Finding and migrating files..."
    
    # Process different file types
    while IFS= read -r -d '' file; do
        migrate_file "$file"
    done < <(find /home/jwoltje/src/tony-ng -type f \( -name "*.sh" -o -name "*.bash" -o -name "*.json" -o -name "*.md" -o -name "*.yml" -o -name "*.yaml" -o -name "Makefile" -o -name "*.mk" \) -not -path "*/test-evidence/*" -not -path "*/node_modules/*" -not -path "*/.git/*" -print0)
    
    # Summary
    echo ""
    echo "===================================="
    log_success "Migration Complete!"
    echo ""
    echo "Summary:"
    echo "  Files updated: $FILES_UPDATED"
    echo "  Total replacements: $TOTAL_REPLACEMENTS"
    echo "  Backups saved to: $BACKUP_DIR"
    
    # Verification
    echo ""
    log_info "Running verification..."
    
    # Check for remaining docker-compose usage
    local remaining=$(grep -r "docker-compose" /home/jwoltje/src/tony-ng \
        --include="*.sh" \
        --include="*.json" \
        --include="*.md" \
        --include="*.yml" \
        --include="*.yaml" \
        --exclude-dir="test-evidence" \
        --exclude-dir="node_modules" \
        2>/dev/null | grep -v "docker-compose.yml" | grep -v "docker-compose.*.yml" | wc -l)
    
    if [ "$remaining" -eq 0 ]; then
        log_success "✅ All docker-compose commands have been migrated to docker compose!"
    else
        log_warning "⚠️  Found $remaining remaining references to docker-compose that may need manual review"
        echo ""
        echo "Remaining references (excluding filenames):"
        grep -r "docker-compose" /home/jwoltje/src/tony-ng \
            --include="*.sh" \
            --include="*.json" \
            --include="*.md" \
            --include="*.yml" \
            --include="*.yaml" \
            --exclude-dir="test-evidence" \
            --exclude-dir="node_modules" \
            2>/dev/null | grep -v "docker-compose.yml" | grep -v "docker-compose.*.yml" | head -10
    fi
    
    # Test docker compose v2
    echo ""
    log_info "Testing Docker Compose v2..."
    if docker compose version >/dev/null 2>&1; then
        log_success "Docker Compose v2 is working correctly"
    else
        log_error "Docker Compose v2 test failed"
    fi
}

# Run main
main