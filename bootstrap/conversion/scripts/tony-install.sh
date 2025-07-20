#!/bin/bash

# Tony Framework - Installation Script
# Handles framework installation and updates with API usage reduction

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source shared utilities
source "$SCRIPT_DIR/shared/logging-utils.sh"
source "$SCRIPT_DIR/shared/version-utils.sh"
source "$SCRIPT_DIR/shared/github-utils.sh"

# Configuration
TONY_USER_DIR="$HOME/.claude/tony"
CLAUDE_MD="$HOME/.claude/CLAUDE.md"
BACKUP_DIR="$TONY_USER_DIR/backups"
MODE="install"
SOURCE="github"
PRESERVE_USER_CONTENT=true
VERBOSE=false
AUTO_CONFIRM=false

# Display usage information
show_usage() {
    show_banner "Tony Framework Installation Script" "Automated installation with API usage reduction"
    
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --mode=MODE           Installation mode (install, update, integrate, verify)"
    echo "  --source=SOURCE       Source for installation (github, local)"
    echo "  --preserve-user-content  Preserve existing user content (default: true)"
    echo "  --verbose             Enable verbose output"
    echo "  --auto-confirm        Skip confirmation prompts"
    echo "  --help                Show this help message"
    echo ""
    echo "Modes:"
    echo "  install               Full installation from GitHub"
    echo "  update                Update existing installation"
    echo "  integrate             Update user CLAUDE.md integration only"
    echo "  verify                Verify installation integrity"
    echo ""
    echo "Examples:"
    echo "  $0 --mode=install --source=github"
    echo "  $0 --mode=update --verbose"
    echo "  $0 --mode=verify --auto-confirm"
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --mode=*)
                MODE="${1#*=}"
                ;;
            --source=*)
                SOURCE="${1#*=}"
                ;;
            --preserve-user-content)
                PRESERVE_USER_CONTENT=true
                ;;
            --verbose)
                VERBOSE=true
                enable_verbose
                ;;
            --auto-confirm)
                AUTO_CONFIRM=true
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
        shift
    done
}

# Validate installation prerequisites
validate_prerequisites() {
    log_info "Validating installation prerequisites"
    
    local errors=0
    
    # Check required tools
    local required_tools=("git" "curl" "grep" "sed" "sort")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            log_error "Required tool not found: $tool"
            ((errors++))
        fi
    done
    
    # Check directory permissions
    if [ ! -w "$HOME" ]; then
        log_error "No write permission to home directory: $HOME"
        ((errors++))
    fi
    
    # Check .claude directory
    if [ ! -d "$HOME/.claude" ]; then
        if mkdir -p "$HOME/.claude" 2>/dev/null; then
            log_info "Created .claude directory"
        else
            log_error "Cannot create .claude directory"
            ((errors++))
        fi
    fi
    
    if [ $errors -eq 0 ]; then
        log_success "All prerequisites validated"
        return 0
    else
        log_error "Prerequisites validation failed with $errors error(s)"
        return 1
    fi
}

# Create backup of existing user content
create_user_backup() {
    if [ ! -f "$CLAUDE_MD" ]; then
        log_info "No existing CLAUDE.md to backup"
        return 0
    fi
    
    log_info "Creating backup of existing user content"
    
    mkdir -p "$BACKUP_DIR"
    
    local backup_file="$BACKUP_DIR/CLAUDE-BACKUP-$(date +%s).md"
    
    if cp "$CLAUDE_MD" "$backup_file"; then
        log_success "User content backed up to: $backup_file"
        
        # Create integrity hash
        if command -v md5sum >/dev/null 2>&1; then
            md5sum "$CLAUDE_MD" > "$backup_file.md5"
            log_debug "Backup integrity hash created"
        fi
        
        echo "$backup_file"
    else
        log_error "Failed to create backup"
        return 1
    fi
}

# Install Tony framework components from source
install_framework_components() {
    local source_dir="$1"
    
    log_info "Installing Tony framework components"
    
    # Create Tony directory structure
    mkdir -p "$TONY_USER_DIR"/{metadata,logs,backups}
    
    # Framework components to install
    local components=(
        "framework/TONY-CORE.md"
        "framework/TONY-TRIGGERS.md"
        "framework/TONY-SETUP.md"
        "framework/AGENT-BEST-PRACTICES.md"
        "framework/DEVELOPMENT-GUIDELINES.md"
    )
    
    local installed_count=0
    for component in "${components[@]}"; do
        local source_file="$source_dir/$component"
        local target_file="$TONY_USER_DIR/$(basename "$component")"
        
        if [ -f "$source_file" ]; then
            if cp "$source_file" "$target_file"; then
                log_success "Installed: $(basename "$component")"
                ((installed_count++))
            else
                log_error "Failed to install: $(basename "$component")"
                return 1
            fi
        else
            log_error "Component not found: $component"
            return 1
        fi
    done
    
    # Copy installation script for verification
    if [ -f "$source_dir/install-modular.sh" ]; then
        cp "$source_dir/install-modular.sh" "$TONY_USER_DIR/install-modular.sh"
        chmod +x "$TONY_USER_DIR/install-modular.sh"
        log_debug "Installation script copied for reference"
    fi
    
    log_success "Framework components installed: $installed_count/${#components[@]}"
    return 0
}

# Update user CLAUDE.md integration
update_user_integration() {
    local backup_file="$1"
    local framework_version="$2"
    
    log_info "Updating user CLAUDE.md integration"
    
    # Generate integration content
    local integration_content
    integration_content=$(generate_integration_content "$framework_version" "$backup_file")
    
    # Determine integration strategy
    if [ ! -f "$CLAUDE_MD" ]; then
        # New installation
        log_info "Creating new CLAUDE.md with Tony integration"
        cat > "$CLAUDE_MD" << EOF
# Universal Claude Instructions

## User Configuration
# Add your personal Claude instructions here

$integration_content
EOF
    elif grep -q "Tony Framework.*Integration" "$CLAUDE_MD"; then
        # Update existing integration
        log_info "Updating existing Tony integration"
        
        # Extract user content (everything before AUTO-MANAGED)
        local user_content
        user_content=$(sed '/<!-- AUTO-MANAGED:/,$d' "$CLAUDE_MD")
        
        # Reconstruct file with updated integration
        {
            echo "$user_content"
            echo ""
            echo "$integration_content"
        } > "$CLAUDE_MD"
    else
        # Augment existing file
        log_info "Augmenting existing CLAUDE.md with Tony integration"
        {
            cat "$CLAUDE_MD"
            echo ""
            echo "$integration_content"
        } > "$CLAUDE_MD.tmp"
        
        mv "$CLAUDE_MD.tmp" "$CLAUDE_MD"
    fi
    
    log_success "User CLAUDE.md integration updated"
}

# Generate integration content for CLAUDE.md
generate_integration_content() {
    local version="$1"
    local backup_file="$2"
    local timestamp
    timestamp=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
    
    cat << EOF
## 🤖 Tech Lead Tony Framework v${version} Integration
<!-- AUTO-MANAGED: Tony Framework Version ${version} | Updated: ${timestamp} -->
<!-- WARNING: Do not manually edit this section - managed by Tony installation system -->

### Framework Status: ✅ Modular Architecture Installed

The Tony framework uses intelligent, context-aware component loading:

**🔍 Trigger Detection** (Always Active - Lightweight)
- Module: \`~/.claude/tony/TONY-TRIGGERS.md\`
- Purpose: Natural language trigger phrase detection
- Load: All sessions (minimal overhead)
- Function: Detects Tony coordination requests

**🎯 Core Coordination** (Tony Sessions Only)  
- Module: \`~/.claude/tony/TONY-CORE.md\`
- Purpose: Central Tony coordination and session management
- Load: When trigger phrases detected
- Function: Orchestrates multi-agent workflows

**🚀 Auto-Deployment** (Deployment Sequences Only)
- Module: \`~/.claude/tony/TONY-SETUP.md\`  
- Purpose: Infrastructure creation and project setup
- Load: During Tony infrastructure deployment
- Function: Creates project-specific Tony infrastructure

**👥 Agent Standards** (Agent Coordination Sessions)
- Module: \`~/.claude/tony/AGENT-BEST-PRACTICES.md\`
- Purpose: Universal agent coordination standards
- Load: When agent coordination is needed
- Function: Ensures quality agent management

**📋 Development Guidelines** (Development Sessions)  
- Module: \`~/.claude/tony/DEVELOPMENT-GUIDELINES.md\`
- Purpose: Universal development standards and practices
- Load: During development activities
- Function: Maintains code quality and project standards

### Tony Component Loading Instructions (For Claude)

When Tony triggers are detected in user input:

1. **Identity Confirmation**
   - Acknowledge: "I am Tech Lead Tony - deploying universal coordination infrastructure"
   - Load core coordination module: ~/.claude/tony/TONY-CORE.md

2. **Context Assessment**
   - Analyze user request for specific Tony functions needed
   - Load additional modules based on context:
     * Infrastructure setup → ~/.claude/tony/TONY-SETUP.md
     * Agent coordination → ~/.claude/tony/AGENT-BEST-PRACTICES.md  
     * Development work → ~/.claude/tony/DEVELOPMENT-GUIDELINES.md

3. **Session Activation**
   - Execute Tony auto-deployment sequence if infrastructure needed
   - Begin coordination activities with appropriate component set
   - Maintain session continuity through project-specific scratchpad

### Installation Information

**Installation Date**: ${timestamp}  
**Framework Version**: ${version} Modular Architecture  
**Original Backup**: ${backup_file}  
**Component Location**: \`~/.claude/tony/\`  
**Command System**: \`/tony\` commands available for framework management  

<!-- END AUTO-MANAGED SECTION -->
<!-- Tony Framework v${version} | Safe, Non-Destructive, Reversible -->
EOF
}

# Create framework metadata
create_framework_metadata() {
    local version="$1"
    local backup_file="$2"
    local source_info="$3"
    
    log_info "Creating framework metadata"
    
    local version_file="$TONY_USER_DIR/metadata/VERSION"
    local timestamp
    timestamp=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
    
    mkdir -p "$(dirname "$version_file")"
    
    cat > "$version_file" << EOF
Framework-Version: $version
Architecture: Modular
Installation-Date: $timestamp
Installation-Mode: $MODE
Installation-Source: $SOURCE
Components:
  TONY-CORE: $version
  TONY-TRIGGERS: $version
  TONY-SETUP: $version
  AGENT-BEST-PRACTICES: $version
  DEVELOPMENT-GUIDELINES: $version
User-Backup: $backup_file
Source-Info: $source_info
Script-Version: 1.0.0
EOF
    
    log_success "Framework metadata created"
}

# Verify installation integrity
verify_installation() {
    log_info "Verifying installation integrity"
    
    local errors=0
    
    # Check Tony directory structure
    local required_dirs=(
        "$TONY_USER_DIR"
        "$TONY_USER_DIR/metadata"
        "$TONY_USER_DIR/logs"
        "$TONY_USER_DIR/backups"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [ -d "$dir" ]; then
            log_debug "Directory exists: $dir"
        else
            log_error "Directory missing: $dir"
            ((errors++))
        fi
    done
    
    # Check framework components
    local components=("TONY-CORE.md" "TONY-TRIGGERS.md" "TONY-SETUP.md" "AGENT-BEST-PRACTICES.md" "DEVELOPMENT-GUIDELINES.md")
    for component in "${components[@]}"; do
        local component_file="$TONY_USER_DIR/$component"
        if [ -f "$component_file" ]; then
            log_debug "Component exists: $component"
            
            # Verify component has content
            if [ -s "$component_file" ]; then
                log_debug "Component has content: $component"
            else
                log_error "Component is empty: $component"
                ((errors++))
            fi
        else
            log_error "Component missing: $component"
            ((errors++))
        fi
    done
    
    # Check CLAUDE.md integration
    if [ -f "$CLAUDE_MD" ] && grep -q "Tony Framework.*Integration" "$CLAUDE_MD"; then
        log_debug "CLAUDE.md integration verified"
    else
        log_error "CLAUDE.md integration missing or invalid"
        ((errors++))
    fi
    
    # Check metadata
    if [ -f "$TONY_USER_DIR/metadata/VERSION" ]; then
        log_debug "Framework metadata exists"
    else
        log_error "Framework metadata missing"
        ((errors++))
    fi
    
    if [ $errors -eq 0 ]; then
        log_success "Installation verification PASSED - all components healthy"
        return 0
    else
        log_error "Installation verification FAILED - $errors error(s) found"
        return 1
    fi
}

# Main installation function for install mode
install_mode() {
    print_section "Tony Framework Installation"
    
    local source_dir
    local framework_version
    
    if [ "$SOURCE" = "github" ]; then
        log_info "Installing from GitHub repository"
        
        # Get latest version
        framework_version=$(get_github_latest_release || get_github_latest_tag_fallback || echo "2.0.0")
        log_info "Target version: $framework_version"
        
        # Clone repository
        source_dir=$(clone_tony_repository "")
        if [ $? -ne 0 ]; then
            log_error "Failed to clone repository"
            return 1
        fi
    else
        log_info "Installing from local source"
        source_dir="$PROJECT_ROOT"
        framework_version=$(extract_version_from_component "$source_dir/CHANGELOG.md" || echo "2.0.0")
    fi
    
    # Create backup
    local backup_file
    backup_file=$(create_user_backup)
    
    # Install components
    if ! install_framework_components "$source_dir"; then
        log_error "Component installation failed"
        return 1
    fi
    
    # Update integration
    if ! update_user_integration "$backup_file" "$framework_version"; then
        log_error "Integration update failed"
        return 1
    fi
    
    # Create metadata
    if ! create_framework_metadata "$framework_version" "$backup_file" "$SOURCE"; then
        log_error "Metadata creation failed"
        return 1
    fi
    
    # Verify installation
    if verify_installation; then
        print_status_box "Tony Framework Installation Complete" \
            "Version: $framework_version" \
            "Components: 5/5 installed successfully" \
            "User content: Completely preserved" \
            "Integration: Active and verified" \
            "Command system: /tony commands available"
        return 0
    else
        log_error "Installation verification failed"
        return 1
    fi
}

# Main update function for update mode
update_mode() {
    print_section "Tony Framework Update"
    
    # Check if framework is installed
    if [ ! -d "$TONY_USER_DIR" ]; then
        log_error "Tony framework not installed - use install mode instead"
        return 1
    fi
    
    local current_version
    current_version=$(get_user_version)
    log_info "Current version: $current_version"
    
    local latest_version
    latest_version=$(get_github_latest_release || get_github_latest_tag_fallback || echo "2.0.0")
    log_info "Latest version: $latest_version"
    
    # Check if update is needed
    if [ "$current_version" = "$latest_version" ]; then
        log_info "Framework is already up to date"
        return 0
    fi
    
    if version_greater "$current_version" "$latest_version"; then
        log_warning "Current version is newer than GitHub - development version detected"
        if [ "$AUTO_CONFIRM" != true ]; then
            if ! confirm_action "Proceed with update anyway?"; then
                log_info "Update cancelled by user"
                return 0
            fi
        fi
    fi
    
    # Proceed with update using install mode logic
    MODE="update"
    install_mode
}

# Integration mode - update CLAUDE.md only
integrate_mode() {
    print_section "Tony Framework Integration Update"
    
    if [ ! -d "$TONY_USER_DIR" ]; then
        log_error "Tony framework not installed - use install mode first"
        return 1
    fi
    
    local current_version
    current_version=$(get_user_version)
    
    local backup_file
    backup_file=$(create_user_backup)
    
    if update_user_integration "$backup_file" "$current_version"; then
        log_success "Integration updated successfully"
        return 0
    else
        log_error "Integration update failed"
        return 1
    fi
}

# Verify mode - check installation integrity
verify_mode() {
    print_section "Tony Framework Verification"
    
    if verify_installation; then
        local current_version
        current_version=$(get_user_version)
        
        print_status_box "Tony Framework Verification Complete" \
            "Status: All components healthy" \
            "Version: $current_version" \
            "Integration: Active and verified" \
            "Ready for coordination"
        return 0
    else
        print_error_box "Tony Framework Verification Failed" \
            "Some components are missing or damaged" \
            "Run installation to fix issues" \
            "Check logs for detailed error information"
        return 1
    fi
}

# Main execution
main() {
    # Parse arguments
    parse_arguments "$@"
    
    # Show banner
    show_banner "Tony Framework Installation" "Automated installation with reduced API usage"
    
    # Validate prerequisites
    if ! validate_prerequisites; then
        exit 1
    fi
    
    # Execute based on mode
    case "$MODE" in
        "install")
            install_mode
            ;;
        "update")
            update_mode
            ;;
        "integrate")
            integrate_mode
            ;;
        "verify")
            verify_mode
            ;;
        *)
            log_error "Invalid mode: $MODE"
            show_usage
            exit 1
            ;;
    esac
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        log_success "Operation completed successfully"
    else
        log_error "Operation failed with exit code $exit_code"
    fi
    
    exit $exit_code
}

# Execute main function with all arguments
main "$@"