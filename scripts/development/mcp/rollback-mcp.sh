#!/bin/bash
# MosAIc SDK - MCP Infrastructure Rollback Script
# Infrastructure Foundation - Phase 1

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/.mosaic/backups"
LOGS_DIR="$PROJECT_ROOT/.mosaic/logs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create rollback point
create_rollback_point() {
    local rollback_name="${1:-$(date +%Y%m%d-%H%M%S)}"
    local rollback_dir="$BACKUP_DIR/rollback-$rollback_name"
    
    log_info "Creating rollback point: $rollback_name"
    
    mkdir -p "$rollback_dir"
    
    # Backup current configuration
    cp -r "$PROJECT_ROOT/.claude" "$rollback_dir/" 2>/dev/null || true
    cp -r "$PROJECT_ROOT/.mosaic/claude" "$rollback_dir/" 2>/dev/null || true
    
    # Backup database
    if [[ -f "$PROJECT_ROOT/.mosaic/data/mcp.db" ]]; then
        cp "$PROJECT_ROOT/.mosaic/data/mcp.db" "$rollback_dir/mcp.db"
        log_success "Database backed up"
    fi
    
    # Backup PID files
    cp "$PROJECT_ROOT/.mosaic/mcp.pid" "$rollback_dir/" 2>/dev/null || true
    cp "$PROJECT_ROOT/.mosaic/mcp-gateway.pid" "$rollback_dir/" 2>/dev/null || true
    
    # Save current service status
    "$SCRIPT_DIR/monitor-mcp.sh" status > "$rollback_dir/service-status.txt" 2>&1 || true
    
    # Save current tool inventory
    if ./scripts/development/mcp/start-unified-mcp.sh status >/dev/null 2>&1; then
        cd "$PROJECT_ROOT/packages/mcp-orchestrator"
        env NODE_ENV=production node dist/main.js tools > "$rollback_dir/tools-inventory.txt" 2>/dev/null || true
        cd "$PROJECT_ROOT"
    fi
    
    log_success "Rollback point created: $rollback_dir"
    echo "Rollback ID: $rollback_name"
}

# List available rollback points
list_rollback_points() {
    log_info "Available rollback points:"
    echo "=========================="
    
    if [[ -d "$BACKUP_DIR" ]]; then
        local count=0
        for rollback_dir in "$BACKUP_DIR"/rollback-*; do
            if [[ -d "$rollback_dir" ]]; then
                local rollback_name=$(basename "$rollback_dir" | sed 's/rollback-//')
                local created=$(stat -c %y "$rollback_dir" 2>/dev/null | cut -d'.' -f1)
                echo "$rollback_name (created: $created)"
                count=$((count + 1))
            fi
        done
        
        if [[ $count -eq 0 ]]; then
            log_warn "No rollback points available"
        else
            log_info "Total rollback points: $count"
        fi
    else
        log_warn "No backup directory found"
    fi
}

# Restore from rollback point
restore_rollback_point() {
    local rollback_name="$1"
    local rollback_dir="$BACKUP_DIR/rollback-$rollback_name"
    
    if [[ ! -d "$rollback_dir" ]]; then
        log_error "Rollback point not found: $rollback_name"
        list_rollback_points
        return 1
    fi
    
    log_info "Restoring from rollback point: $rollback_name"
    log_warn "This will overwrite current configuration and database!"
    
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Rollback cancelled"
        return 0
    fi
    
    # Stop current services
    log_info "Stopping current services..."
    "$SCRIPT_DIR/start-unified-mcp.sh" stop 2>/dev/null || true
    
    # Create backup of current state before rollback
    create_rollback_point "pre-restore-$(date +%Y%m%d-%H%M%S)"
    
    # Restore configuration files
    if [[ -d "$rollback_dir/.claude" ]]; then
        log_info "Restoring Claude configuration..."
        rm -rf "$PROJECT_ROOT/.claude"
        cp -r "$rollback_dir/.claude" "$PROJECT_ROOT/"
    fi
    
    if [[ -d "$rollback_dir/claude" ]]; then
        log_info "Restoring Mosaic configuration..."
        rm -rf "$PROJECT_ROOT/.mosaic/claude"
        cp -r "$rollback_dir/claude" "$PROJECT_ROOT/.mosaic/"
    fi
    
    # Restore database
    if [[ -f "$rollback_dir/mcp.db" ]]; then
        log_info "Restoring database..."
        cp "$rollback_dir/mcp.db" "$PROJECT_ROOT/.mosaic/data/mcp.db"
    fi
    
    # Clean up PID files (they'll be recreated)
    rm -f "$PROJECT_ROOT/.mosaic/mcp.pid" "$PROJECT_ROOT/.mosaic/mcp-gateway.pid"
    
    log_success "Rollback restoration complete"
    log_info "Use 'start-unified-mcp.sh start' to start services"
}

# Emergency recovery
emergency_recovery() {
    log_warn "Performing emergency recovery..."
    log_info "This will reset MCP infrastructure to a known good state"
    
    # Stop all MCP services
    log_info "Stopping all MCP services..."
    for port in 3456 3457; do
        local pids=$(lsof -t -i:$port 2>/dev/null || true)
        if [[ -n "$pids" ]]; then
            log_warn "Killing processes on port $port: $pids"
            kill -TERM $pids 2>/dev/null || true
            sleep 2
            kill -KILL $pids 2>/dev/null || true
        fi
    done
    
    # Clean up PID files
    rm -f "$PROJECT_ROOT/.mosaic/mcp.pid" "$PROJECT_ROOT/.mosaic/mcp-gateway.pid"
    
    # Reset to basic configuration
    log_info "Resetting configuration to defaults..."
    mkdir -p "$PROJECT_ROOT/.claude"
    
    cat > "$PROJECT_ROOT/.claude/mcp.json" << 'EOF'
{
  "mcpServers": {
    "mosaic-orchestrator": {
      "command": "node",
      "args": [
        "/home/jwoltje/src/mosaic-sdk/packages/mcp-orchestrator/dist/main.js",
        "serve",
        "--http",
        "--port",
        "3456"
      ],
      "env": {
        "NODE_ENV": "development",
        "LOG_LEVEL": "debug",
        "DATABASE_PATH": "/home/jwoltje/src/mosaic-sdk/.mosaic/data/mcp.db",
        "HTTP_PORT": "3456",
        "HTTP_HOST": "localhost"
      }
    }
  }
}
EOF
    
    # Ensure database directory exists with proper permissions
    mkdir -p "$PROJECT_ROOT/.mosaic/data" "$PROJECT_ROOT/.mosaic/logs"
    chmod 755 "$PROJECT_ROOT/.mosaic/data" "$PROJECT_ROOT/.mosaic/logs"
    
    if [[ -f "$PROJECT_ROOT/.mosaic/data/mcp.db" ]]; then
        chmod 644 "$PROJECT_ROOT/.mosaic/data/mcp.db"
    fi
    
    log_success "Emergency recovery complete"
    log_info "Use 'start-unified-mcp.sh start' to start services"
}

# Clean up old rollback points
cleanup_old_rollbacks() {
    local days="${1:-7}"
    log_info "Cleaning up rollback points older than $days days..."
    
    if [[ -d "$BACKUP_DIR" ]]; then
        local count=0
        find "$BACKUP_DIR" -name "rollback-*" -type d -mtime +$days -print0 | while IFS= read -r -d '' dir; do
            local rollback_name=$(basename "$dir" | sed 's/rollback-//')
            log_info "Removing old rollback: $rollback_name"
            rm -rf "$dir"
            count=$((count + 1))
        done
        
        log_success "Cleanup complete"
    else
        log_warn "No backup directory found"
    fi
}

# Main execution
main() {
    case "${1:-help}" in
        create)
            create_rollback_point "${2:-}"
            ;;
        list)
            list_rollback_points
            ;;
        restore)
            if [[ -z "${2:-}" ]]; then
                log_error "Please specify a rollback point ID"
                list_rollback_points
                exit 1
            fi
            restore_rollback_point "$2"
            ;;
        emergency)
            emergency_recovery
            ;;
        cleanup)
            cleanup_old_rollbacks "${2:-7}"
            ;;
        *)
            echo "MCP Infrastructure Rollback Tool"
            echo "================================="
            echo "Usage: $0 {create|list|restore|emergency|cleanup}"
            echo
            echo "Commands:"
            echo "  create [name]     - Create a rollback point (optional name)"
            echo "  list              - List available rollback points"
            echo "  restore <id>      - Restore from a rollback point"
            echo "  emergency         - Emergency recovery to known good state"
            echo "  cleanup [days]    - Clean up rollback points older than N days (default: 7)"
            echo
            echo "Examples:"
            echo "  $0 create before-upgrade    # Create named rollback point"
            echo "  $0 restore 20250810-141500  # Restore from specific point"
            echo "  $0 emergency                 # Emergency reset"
            exit 1
            ;;
    esac
}

main "$@"