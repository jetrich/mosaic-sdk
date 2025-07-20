#!/bin/bash

# Tony Framework Diagnostic Script
# Comprehensive health check and repair recommendations

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
TONY_HOME="$HOME/.tony"
CLAUDE_DIR="$HOME/.claude"

# Helper functions
log_info() { echo -e "${BLUE}ℹ${NC}  $1"; }
log_success() { echo -e "${GREEN}✓${NC}  $1"; }
log_warning() { echo -e "${YELLOW}⚠${NC}  $1"; }
log_error() { echo -e "${RED}✗${NC}  $1"; }

# Diagnostic functions
check_installation() {
    echo -e "${CYAN}Tony Installation Check${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local issues=0
    
    # Check Tony home directory
    if [ -d "$TONY_HOME" ]; then
        log_success "Tony directory found: $TONY_HOME"
    else
        log_error "Tony directory not found: $TONY_HOME"
        issues=$((issues + 1))
    fi
    
    # Check version file
    if [ -f "$TONY_HOME/VERSION" ]; then
        local version=$(head -1 "$TONY_HOME/VERSION")
        log_success "Version: $version"
    else
        log_error "VERSION file missing"
        issues=$((issues + 1))
    fi
    
    # Check CLI
    if [ -f "$TONY_HOME/bin/tony" ] && [ -x "$TONY_HOME/bin/tony" ]; then
        log_success "Tony CLI installed"
        if command -v tony &> /dev/null; then
            log_success "Tony CLI in PATH"
        else
            log_warning "Tony CLI not in PATH"
            echo "   Run: source ~/.bashrc or restart terminal"
            issues=$((issues + 1))
        fi
    else
        log_error "Tony CLI missing or not executable"
        issues=$((issues + 1))
    fi
    
    return $issues
}

check_core_components() {
    echo
    echo -e "${CYAN}Core Components Check${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local issues=0
    local components=(
        "core/TONY-CORE.md:Core framework"
        "core/UPP-METHODOLOGY.md:UPP methodology"
        "core/AGENT-HANDOFF-PROTOCOL.md:Agent protocols"
        "scripts/spawn-agent.sh:Agent spawning"
        "scripts/context-manager.sh:Context management"
        "templates/agent-context-schema.json:Context templates"
    )
    
    for component in "${components[@]}"; do
        local file="${component%%:*}"
        local name="${component#*:}"
        
        if [ -f "$TONY_HOME/$file" ]; then
            log_success "$name"
        else
            log_error "$name missing: $file"
            issues=$((issues + 1))
        fi
    done
    
    return $issues
}

check_dependencies() {
    echo
    echo -e "${CYAN}Dependencies Check${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local issues=0
    
    # Check Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -ge 18 ]; then
            log_success "Node.js $(node -v)"
        else
            log_warning "Node.js version too old: $(node -v) (need 18+)"
            issues=$((issues + 1))
        fi
    else
        log_error "Node.js not found"
        issues=$((issues + 1))
    fi
    
    # Check Git
    if command -v git &> /dev/null; then
        log_success "Git $(git --version | cut -d' ' -f3)"
    else
        log_error "Git not found"
        issues=$((issues + 1))
    fi
    
    # Check Claude CLI
    if command -v claude &> /dev/null; then
        log_success "Claude CLI available"
    else
        log_warning "Claude CLI not found (recommended)"
        echo "   Install from: https://claude.ai/download"
    fi
    
    # Check Claude directory
    if [ -d "$CLAUDE_DIR" ]; then
        log_success "Claude directory found"
        
        # Check Claude commands integration
        if [ -f "$CLAUDE_DIR/commands/tony.md" ]; then
            log_success "Tony commands integrated"
        else
            log_warning "Tony commands not found"
            issues=$((issues + 1))
        fi
        
        # Check CLAUDE.md integration
        if [ -f "$CLAUDE_DIR/CLAUDE.md" ]; then
            if grep -q "Tony Framework" "$CLAUDE_DIR/CLAUDE.md" 2>/dev/null; then
                log_success "Tony framework integrated in CLAUDE.md"
            else
                log_warning "Tony framework not integrated in CLAUDE.md"
                echo "   'Hey Tony' triggers may not work"
                issues=$((issues + 1))
            fi
        else
            log_warning "CLAUDE.md not found"
            echo "   'Hey Tony' triggers will not work"
            issues=$((issues + 1))
        fi
    else
        log_warning "Claude directory not found"
        echo "   Install Claude CLI for full functionality"
    fi
    
    return $issues
}

check_permissions() {
    echo
    echo -e "${CYAN}Permissions Check${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    local issues=0
    
    # Check Tony home permissions
    if [ -w "$TONY_HOME" ]; then
        log_success "Tony directory writable"
    else
        log_error "Tony directory not writable"
        issues=$((issues + 1))
    fi
    
    # Check script permissions
    local scripts=(
        "bin/tony"
        "scripts/spawn-agent.sh"
        "scripts/context-manager.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [ -f "$TONY_HOME/$script" ]; then
            if [ -x "$TONY_HOME/$script" ]; then
                log_success "$(basename "$script") executable"
            else
                log_error "$(basename "$script") not executable"
                issues=$((issues + 1))
            fi
        fi
    done
    
    return $issues
}

check_logs_and_temp() {
    echo
    echo -e "${CYAN}Workspace Check${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Check logs directory
    if [ -d "$TONY_HOME/logs" ]; then
        local log_count=$(find "$TONY_HOME/logs" -name "*.log" 2>/dev/null | wc -l)
        if [ "$log_count" -gt 0 ]; then
            log_info "$log_count log files found"
        else
            log_info "No log files (clean workspace)"
        fi
    else
        log_info "Logs directory will be created when needed"
    fi
    
    # Check temp directory
    if [ -d "$TONY_HOME/temp" ]; then
        local temp_size=$(du -sh "$TONY_HOME/temp" 2>/dev/null | cut -f1)
        log_info "Temp directory size: $temp_size"
    else
        log_info "Temp directory will be created when needed"
    fi
    
    # Check for backup directories
    local backup_count=$(find "$HOME" -maxdepth 1 -name ".tony.backup.*" 2>/dev/null | wc -l)
    if [ "$backup_count" -gt 0 ]; then
        log_info "$backup_count backup directories found"
        echo "   Use 'tony clean' to remove old backups"
    fi
}

generate_repair_recommendations() {
    local total_issues=$1
    
    echo
    echo -e "${CYAN}Recommendations${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ "$total_issues" -eq 0 ]; then
        log_success "Tony installation is healthy!"
        echo "   No action required"
    else
        log_warning "$total_issues issues found"
        echo
        echo "Repair options:"
        echo "  ${YELLOW}tony repair${NC}     - Automatic repair"
        echo "  ${YELLOW}./install.sh --repair${NC} - Manual repair"
        echo "  ${YELLOW}./install.sh${NC}     - Fresh installation"
        echo
        echo "For help:"
        echo "  ${YELLOW}tony help${NC}       - Tony commands"
        echo "  GitHub: https://github.com/jetrich/tony"
    fi
}

# Main diagnostic function
main() {
    echo -e "${BLUE}Tony Framework Diagnostic${NC}"
    echo -e "${BLUE}Version $(cat "$TONY_HOME/VERSION" 2>/dev/null | head -1 || echo "Unknown")${NC}"
    echo
    
    local total_issues=0
    
    check_installation
    total_issues=$((total_issues + $?))
    
    check_core_components
    total_issues=$((total_issues + $?))
    
    check_dependencies
    total_issues=$((total_issues + $?))
    
    check_permissions
    total_issues=$((total_issues + $?))
    
    check_logs_and_temp
    
    generate_repair_recommendations "$total_issues"
    
    echo
    if [ "$total_issues" -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Run diagnostic
main "$@"