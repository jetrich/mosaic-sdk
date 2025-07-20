#!/bin/bash

# Tony Framework - Upgrade Script
# Simple upgrade management for Tony Framework

set -e

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TONY_HOME="$HOME/.tony"

# Source shared utilities
if [ -f "$SCRIPT_DIR/shared/logging-utils.sh" ]; then
    source "$SCRIPT_DIR/shared/logging-utils.sh"
else
    # Fallback logging functions
    log_info() { echo "ℹ  $1"; }
    log_success() { echo "✓ $1"; }
    log_warning() { echo "⚠ $1"; }
    log_error() { echo "✗ $1"; }
fi

# Configuration
AUTO_CONFIRM=false
DRY_RUN=false

# Simple version comparison
version_gte() {
    [ "$1" = "$(echo -e "$1\n$2" | sort -V | tail -n1)" ]
}

# Get current Tony version
get_current_version() {
    if [ -f "$TONY_HOME/VERSION" ]; then
        head -1 "$TONY_HOME/VERSION" | tr -d ' \n'
    else
        echo "unknown"
    fi
}

# Get latest version from GitHub
get_latest_version() {
    if command -v curl &> /dev/null; then
        curl -s "https://api.github.com/repos/jetrich/tony/releases/latest" 2>/dev/null | \
        grep '"tag_name":' | \
        sed -E 's/.*"([^"]+)".*/\1/' | \
        sed 's/^v//' || echo "unknown"
    else
        echo "unknown"
    fi
}

# Display usage information
show_usage() {
    echo "Tony Framework Upgrade Script"
    echo
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Tony Framework upgrades are GLOBAL - upgrading once updates ALL projects"
    echo
    echo "Options:"
    echo "  --check     Check for available updates"
    echo "  --dry-run   Show what would be done"
    echo "  --yes       Auto-confirm upgrade"
    echo "  --help      Show this help"
    echo
    echo "Upgrade Sources (in priority order):"
    echo "  1. GitHub Release (jetrich/tony) - Latest stable versions"
    echo "  2. Local Installation (~/.tony) - Current installation"
    echo
}

# Check for updates
check_updates() {
    log_info "Checking for Tony Framework updates..."
    
    local current_version=$(get_current_version)
    local latest_version=$(get_latest_version)
    
    echo "Current version: $current_version"
    echo "Latest version:  $latest_version"
    
    if [ "$latest_version" = "unknown" ]; then
        log_warning "Could not check latest version (network issue?)"
        return 1
    fi
    
    if [ "$current_version" = "unknown" ]; then
        log_warning "Could not determine current version"
        return 1
    fi
    
    if version_gte "$current_version" "$latest_version"; then
        log_success "Tony is up to date!"
        log_info "Current installation serves ALL projects on this system"
        return 0
    else
        log_info "Update available: $current_version → $latest_version"
        log_warning "Upgrading will update Tony for ALL projects on this system"
        return 1
    fi
}

# Perform upgrade
perform_upgrade() {
    local temp_dir=$(mktemp -d)
    
    log_info "Downloading latest Tony Framework..."
    
    # Clone latest version
    if ! git clone --depth 1 https://github.com/jetrich/tony.git "$temp_dir" 2>/dev/null; then
        log_error "Failed to download latest version"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Backup current installation
    local backup_dir="$HOME/.tony.backup.$(date +%Y%m%d%H%M%S)"
    log_info "Creating backup at $backup_dir..."
    cp -r "$TONY_HOME" "$backup_dir"
    
    # Run installer from downloaded version
    log_info "Installing update..."
    cd "$temp_dir"
    chmod +x install.sh
    ./install.sh
    
    # Cleanup
    rm -rf "$temp_dir"
    
    log_success "Tony Framework upgraded successfully!"
    log_success "GLOBAL upgrade complete - all projects now use updated Tony"
    log_info "Backup available at: $backup_dir"
    
    # Verify upgrade
    local new_version=$(get_current_version)
    echo
    log_info "Upgrade verification:"
    echo "   • Old version: backed up to $backup_dir"
    echo "   • New version: $new_version"
    echo "   • Installation: $TONY_HOME"
    echo "   • Scope: ALL projects on this system"
}

# Main upgrade function
main() {
    local check_only=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --check)
                check_only=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --yes)
                AUTO_CONFIRM=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Check Tony installation
    if [ ! -d "$TONY_HOME" ]; then
        log_error "Tony not installed at $TONY_HOME"
        echo "Run: git clone https://github.com/jetrich/tony.git && cd tony && ./install.sh"
        exit 1
    fi
    
    # Check for updates
    if check_updates; then
        # Already up to date
        exit 0
    fi
    
    if [ "$check_only" = true ]; then
        exit 1
    fi
    
    # Confirm upgrade
    if [ "$AUTO_CONFIRM" != true ]; then
        echo
        read -p "Proceed with upgrade? (y/N): " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            echo "Upgrade cancelled."
            exit 0
        fi
    fi
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would upgrade Tony Framework"
        exit 0
    fi
    
    # Perform upgrade
    perform_upgrade
}

# Run upgrade
main "$@"