#!/bin/bash

# Tony Framework Uninstaller
# Safely removes Tony installation with backup option

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
TONY_HOME="$HOME/.tony"
CLAUDE_DIR="$HOME/.claude"

# Helper functions
log_info() { echo -e "${BLUE}ℹ${NC}  $1"; }
log_success() { echo -e "${GREEN}✓${NC}  $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC}  $1"; }
log_error() { echo -e "${RED}✗${NC}  $1"; }

# Banner
echo -e "${BLUE}Tony Framework Uninstaller${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# Check if Tony is installed
if [ ! -d "$TONY_HOME" ]; then
    log_error "Tony not found at $TONY_HOME"
    echo "Nothing to uninstall."
    exit 0
fi

# Show what will be removed
echo -e "${YELLOW}The following will be removed:${NC}"
echo "  • Tony directory: $TONY_HOME"
echo "  • Shell PATH entries for Tony"
if [ -f "$CLAUDE_DIR/commands/tony.md" ]; then
    echo "  • Claude integration: $CLAUDE_DIR/commands/tony.md"
fi
echo

# Confirm uninstallation
read -p "Continue with uninstallation? (y/N): " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Uninstallation cancelled."
    exit 0
fi

# Offer backup
read -p "Create backup before uninstalling? (Y/n): " backup
if [[ ! "$backup" =~ ^[Nn]$ ]]; then
    BACKUP_DIR="$HOME/.tony.backup.$(date +%Y%m%d%H%M%S)"
    log_info "Creating backup at $BACKUP_DIR..."
    cp -r "$TONY_HOME" "$BACKUP_DIR"
    log_success "Backup created: $BACKUP_DIR"
fi

echo
log_info "Uninstalling Tony Framework..."

# Remove Tony directory
if [ -d "$TONY_HOME" ]; then
    rm -rf "$TONY_HOME"
    log_success "Removed Tony directory"
fi

# Remove Claude integration
if [ -f "$CLAUDE_DIR/commands/tony.md" ]; then
    rm -f "$CLAUDE_DIR/commands/tony.md"
    log_success "Removed Tony commands"
fi

# Remove Tony integration from CLAUDE.md
if [ -f "$CLAUDE_DIR/CLAUDE.md" ] && grep -q "Tony Framework" "$CLAUDE_DIR/CLAUDE.md" 2>/dev/null; then
    log_info "Removing Tony integration from CLAUDE.md..."
    
    # Create backup
    cp "$CLAUDE_DIR/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md.backup.$(date +%Y%m%d%H%M%S)"
    
    # Remove Tony sections using precise AWK pattern matching
    local temp_file=$(mktemp)
    awk '
    BEGIN { in_tony_section = 0 }
    
    # Detect start of Tony section
    /^# Tony Framework Integration/ {
        in_tony_section = 1
        next
    }
    
    # Detect end of Tony section (next major section starting with #)
    /^#[^#]/ && in_tony_section {
        in_tony_section = 0
        print $0
        next
    }
    
    # Skip lines in Tony section
    in_tony_section { next }
    
    # Print non-Tony lines
    !in_tony_section { print $0 }
    ' "$CLAUDE_DIR/CLAUDE.md" > "$temp_file"
    
    mv "$temp_file" "$CLAUDE_DIR/CLAUDE.md"
    log_success "Removed Tony integration from CLAUDE.md"
fi

# Remove PATH entries from shell configs
for shell_rc in "$HOME/.bashrc" "$HOME/.zshrc"; do
    if [ -f "$shell_rc" ] && grep -q "# Tony Framework" "$shell_rc" 2>/dev/null; then
        # Create temporary file without Tony entries
        grep -v "# Tony Framework" "$shell_rc" | grep -v "/.tony/bin" > "${shell_rc}.tmp"
        mv "${shell_rc}.tmp" "$shell_rc"
        log_success "Removed PATH entries from $(basename "$shell_rc")"
    fi
done

echo
log_success "Tony Framework uninstalled successfully!"

if [[ ! "$backup" =~ ^[Nn]$ ]]; then
    echo
    log_info "Your backup is preserved at:"
    echo "  $BACKUP_DIR"
    echo
    echo "To restore Tony from backup:"
    echo "  mv '$BACKUP_DIR' '$TONY_HOME'"
    echo "  source ~/.bashrc"
fi

echo
echo "To reinstall Tony:"
echo "  Download from: https://github.com/jetrich/tony"
echo "  Run: ./install.sh"
echo