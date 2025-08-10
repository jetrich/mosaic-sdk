#!/bin/bash
# MosAIc Framework Backup Script - Safe Rollback Strategy
# Version: 1.0.0
# Purpose: Create comprehensive backup before framework upgrade

set -euo pipefail

# Configuration
BACKUP_ROOT="/home/jwoltje/src/mosaic-sdk/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_ROOT}/framework_backup_${TIMESTAMP}"
SDK_ROOT="/home/jwoltje/src/mosaic-sdk"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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
create_backup_structure() {
    log_info "Creating backup directory structure..."
    mkdir -p "${BACKUP_DIR}"/{submodules,config,database,logs,state}
    mkdir -p "${BACKUP_DIR}/submodules"/{mosaic-tony,mosaic,mosaic-mcp}
}

# Backup git state
backup_git_state() {
    log_info "Backing up git state..."
    cd "${SDK_ROOT}"
    
    # Save current branch and commit info
    git branch -vv > "${BACKUP_DIR}/git-branch-state.txt"
    git status > "${BACKUP_DIR}/git-status.txt"
    git log --oneline -n 20 > "${BACKUP_DIR}/git-log.txt"
    
    # Save submodule state
    git submodule status > "${BACKUP_DIR}/git-submodule-state.txt"
    
    # Save stash if exists
    if git stash list | grep -q .; then
        log_warning "Git stash exists - saving..."
        git stash list > "${BACKUP_DIR}/git-stash-list.txt"
    fi
}

# Backup submodules
backup_submodules() {
    log_info "Backing up submodules..."
    
    # Tony Framework
    if [ -d "${SDK_ROOT}/mosaic-tony" ]; then
        log_info "Backing up Tony Framework..."
        cd "${SDK_ROOT}/mosaic-tony"
        git log --oneline -n 1 > "${BACKUP_DIR}/submodules/mosaic-tony/commit.txt"
        cp -r .tony "${BACKUP_DIR}/submodules/mosaic-tony/" 2>/dev/null || true
        cp VERSION "${BACKUP_DIR}/submodules/mosaic-tony/" 2>/dev/null || true
    fi
    
    # MosAIc Platform
    if [ -d "${SDK_ROOT}/mosaic" ]; then
        log_info "Backing up MosAIc Platform..."
        cd "${SDK_ROOT}/mosaic"
        git log --oneline -n 1 > "${BACKUP_DIR}/submodules/mosaic/commit.txt"
        cp VERSION "${BACKUP_DIR}/submodules/mosaic/" 2>/dev/null || true
    fi
    
    # MosAIc MCP
    if [ -d "${SDK_ROOT}/mosaic-mcp" ]; then
        log_info "Backing up MosAIc MCP..."
        cd "${SDK_ROOT}/mosaic-mcp"
        git log --oneline -n 1 > "${BACKUP_DIR}/submodules/mosaic-mcp/commit.txt"
        cp package.json "${BACKUP_DIR}/submodules/mosaic-mcp/" 2>/dev/null || true
    fi
}

# Backup configuration files
backup_configurations() {
    log_info "Backing up configuration files..."
    cd "${SDK_ROOT}"
    
    # Main configs
    cp -r .mosaic "${BACKUP_DIR}/config/" 2>/dev/null || true
    cp package.json "${BACKUP_DIR}/config/"
    cp package-lock.json "${BACKUP_DIR}/config/" 2>/dev/null || true
    cp CLAUDE.md "${BACKUP_DIR}/config/" 2>/dev/null || true
    
    # Version matrix
    if [ -f ".mosaic/version-matrix.json" ]; then
        cp .mosaic/version-matrix.json "${BACKUP_DIR}/config/"
    fi
}

# Backup databases and state
backup_databases() {
    log_info "Backing up databases and state..."
    
    # MCP database
    if [ -f "${SDK_ROOT}/.mosaic/data/mcp.db" ]; then
        cp "${SDK_ROOT}/.mosaic/data/mcp.db" "${BACKUP_DIR}/database/"
    fi
    
    # Any SQLite databases
    find "${SDK_ROOT}" -name "*.db" -o -name "*.sqlite" | while read -r db; do
        relative_path="${db#${SDK_ROOT}/}"
        mkdir -p "${BACKUP_DIR}/database/$(dirname "$relative_path")"
        cp "$db" "${BACKUP_DIR}/database/$relative_path"
    done
}

# Create restore script
create_restore_script() {
    log_info "Creating restore script..."
    cat > "${BACKUP_DIR}/restore.sh" << 'EOF'
#!/bin/bash
# MosAIc Framework Restore Script
# Auto-generated restore script for this backup

set -euo pipefail

BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SDK_ROOT="/home/jwoltje/src/mosaic-sdk"

echo "MosAIc Framework Restore"
echo "========================"
echo "Backup: ${BACKUP_DIR}"
echo "Target: ${SDK_ROOT}"
echo ""
read -p "Are you sure you want to restore from this backup? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Stop any running services
echo "Stopping services..."
cd "${SDK_ROOT}"
npm run dev:stop 2>/dev/null || true

# Restore git state
echo "Restoring git state..."
cd "${SDK_ROOT}"
git stash || true

# Reset submodules to backed up commits
if [ -f "${BACKUP_DIR}/submodules/mosaic-tony/commit.txt" ]; then
    echo "Restoring Tony Framework..."
    cd "${SDK_ROOT}/mosaic-tony"
    commit=$(head -n1 "${BACKUP_DIR}/submodules/mosaic-tony/commit.txt" | awk '{print $1}')
    git checkout "$commit"
fi

if [ -f "${BACKUP_DIR}/submodules/mosaic/commit.txt" ]; then
    echo "Restoring MosAIc Platform..."
    cd "${SDK_ROOT}/mosaic"
    commit=$(head -n1 "${BACKUP_DIR}/submodules/mosaic/commit.txt" | awk '{print $1}')
    git checkout "$commit"
fi

if [ -f "${BACKUP_DIR}/submodules/mosaic-mcp/commit.txt" ]; then
    echo "Restoring MosAIc MCP..."
    cd "${SDK_ROOT}/mosaic-mcp"
    commit=$(head -n1 "${BACKUP_DIR}/submodules/mosaic-mcp/commit.txt" | awk '{print $1}')
    git checkout "$commit"
fi

# Restore configurations
echo "Restoring configurations..."
cd "${SDK_ROOT}"
cp -r "${BACKUP_DIR}/config/.mosaic" . 2>/dev/null || true
cp "${BACKUP_DIR}/config/package.json" .
cp "${BACKUP_DIR}/config/package-lock.json" . 2>/dev/null || true

# Restore databases
echo "Restoring databases..."
if [ -d "${BACKUP_DIR}/database" ]; then
    cp -r "${BACKUP_DIR}/database/"* "${SDK_ROOT}/" 2>/dev/null || true
fi

# Reinstall dependencies
echo "Reinstalling dependencies..."
cd "${SDK_ROOT}"
npm run install:all

echo ""
echo "Restore completed successfully!"
echo "Please verify the system state and run tests."
EOF
    
    chmod +x "${BACKUP_DIR}/restore.sh"
}

# Create backup manifest
create_manifest() {
    log_info "Creating backup manifest..."
    cat > "${BACKUP_DIR}/manifest.json" << EOF
{
  "backup_timestamp": "${TIMESTAMP}",
  "backup_date": "$(date)",
  "sdk_version": "$(cat ${SDK_ROOT}/package.json | grep version | head -1 | awk -F'"' '{print $4}')",
  "components": {
    "tony": "$(cd ${SDK_ROOT}/mosaic-tony && git describe --tags --always 2>/dev/null || echo 'unknown')",
    "mosaic": "$(cd ${SDK_ROOT}/mosaic && git describe --tags --always 2>/dev/null || echo 'unknown')",
    "mosaic-mcp": "$(cd ${SDK_ROOT}/mosaic-mcp && git describe --tags --always 2>/dev/null || echo 'unknown')"
  },
  "backup_size": "$(du -sh ${BACKUP_DIR} | cut -f1)",
  "backup_location": "${BACKUP_DIR}"
}
EOF
}

# Main execution
main() {
    log_info "MosAIc Framework Backup Starting..."
    log_info "Backup location: ${BACKUP_DIR}"
    
    # Create backup structure
    create_backup_structure
    
    # Perform backups
    backup_git_state
    backup_submodules
    backup_configurations
    backup_databases
    
    # Create restore utilities
    create_restore_script
    create_manifest
    
    # Calculate backup size
    BACKUP_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
    
    log_success "Backup completed successfully!"
    log_info "Backup location: ${BACKUP_DIR}"
    log_info "Backup size: ${BACKUP_SIZE}"
    log_info "To restore, run: ${BACKUP_DIR}/restore.sh"
    
    # Save backup info for reference
    echo "${BACKUP_DIR}" > "${SDK_ROOT}/.last-backup"
}

# Execute main function
main