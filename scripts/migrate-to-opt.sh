#!/bin/bash
# Migration script to update paths from /var/lib to /opt/mosaic
# Epic E.058 - Feature F.058.03: Update all paths

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
RESET='\033[0m'

# Configuration
OLD_PATH="/var/lib"
NEW_PATH="/opt/mosaic"
DRY_RUN=false
BACKUP=true

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --no-backup)
            BACKUP=false
            shift
            ;;
        --old-path)
            OLD_PATH="$2"
            shift 2
            ;;
        --new-path)
            NEW_PATH="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--dry-run] [--no-backup] [--old-path PATH] [--new-path PATH]"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}=== MosAIc Stack Path Migration Tool ===${RESET}"
echo -e "${CYAN}Migrating from: ${OLD_PATH}${RESET}"
echo -e "${CYAN}Migrating to:   ${NEW_PATH}${RESET}"
echo

if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}Running in DRY RUN mode - no changes will be made${RESET}"
fi

# Function to update file
update_file() {
    local file=$1
    local description=$2
    
    if [[ ! -f "$file" ]]; then
        echo -e "${YELLOW}Skip: $file not found${RESET}"
        return
    fi
    
    # Check if file contains old path
    if ! grep -q "$OLD_PATH" "$file"; then
        echo -e "${GREEN}Skip: $file (no changes needed)${RESET}"
        return
    fi
    
    echo -e "${BLUE}Updating: $file${RESET}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "  Would replace: $OLD_PATH → $NEW_PATH"
        grep -n "$OLD_PATH" "$file" | head -5
        return
    fi
    
    # Backup file
    if [[ "$BACKUP" == "true" ]]; then
        cp "$file" "${file}.backup"
    fi
    
    # Update file
    sed -i "s|${OLD_PATH}|${NEW_PATH}|g" "$file"
    
    echo -e "${GREEN}  ✓ Updated${RESET}"
}

# Files to update
echo -e "${CYAN}Updating Docker Compose files...${RESET}"
update_file "deployment/docker/docker-compose.mosaicstack-portainer.yml" "Main stack compose file"
update_file "deployment/docker-compose.production.yml" "Production compose file"
update_file "deployment/docker-compose.monitoring.yml" "Monitoring compose file"
update_file "deployment/services/gitea/docker-compose.yml" "Gitea compose file"
update_file "deployment/services/bookstack/docker-compose.yml" "BookStack compose file"
update_file "deployment/services/woodpecker/docker-compose.yml" "Woodpecker compose file"

echo
echo -e "${CYAN}Updating configuration files...${RESET}"
update_file "deployment/.env.example" "Environment template"
update_file "deployment/.env.production" "Production environment"
update_file "deployment/configs/redis/redis.conf" "Redis configuration"

echo
echo -e "${CYAN}Updating documentation...${RESET}"
update_file "deployment/README.md" "Deployment README"
update_file "deployment/DEPLOYMENT-CHECKLIST.md" "Deployment checklist"
update_file "deployment/OPERATIONAL-RUNBOOKS.md" "Operational runbooks"
update_file "deployment/SERVICE-ENDPOINTS.md" "Service endpoints"
update_file "docs/deployment/*.md" "Deployment docs"

echo
echo -e "${CYAN}Updating scripts...${RESET}"
update_file "scripts/backup-mosaic.sh" "Backup script"
update_file "scripts/restore-mosaic.sh" "Restore script"
update_file "deployment/scripts/*.sh" "Deployment scripts"

# Summary
echo
echo -e "${CYAN}=== Migration Summary ===${RESET}"

if [[ "$DRY_RUN" == "true" ]]; then
    echo -e "${YELLOW}Dry run complete. No files were modified.${RESET}"
    echo "Run without --dry-run to apply changes."
else
    echo -e "${GREEN}Path migration complete!${RESET}"
    
    if [[ "$BACKUP" == "true" ]]; then
        echo
        echo "Backup files created with .backup extension"
        echo "To restore: for f in *.backup; do mv \"\$f\" \"\${f%.backup}\"; done"
    fi
    
    echo
    echo -e "${YELLOW}Next steps:${RESET}"
    echo "1. Review the changes"
    echo "2. Update any running containers:"
    echo "   docker compose down"
    echo "   docker compose up -d"
    echo "3. If using existing data, migrate it:"
    echo "   sudo mv $OLD_PATH/* $NEW_PATH/"
fi