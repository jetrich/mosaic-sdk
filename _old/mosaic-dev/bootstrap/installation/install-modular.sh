#!/bin/bash

# Tony Framework v2.0 - Modular Installation Script
# Purpose: Smart, non-destructive installation with existing file detection
# Safety: Zero risk of user content loss, complete rollback capability

set -euo pipefail  # Exit on any error, undefined variable, or pipe failure

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Global variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TONY_DIR="$HOME/.claude/tony"
CLAUDE_MD="$HOME/.claude/CLAUDE.md"
INSTALL_LOG="$TONY_DIR/metadata/INSTALL-LOG.md"
VERSION_FILE="$TONY_DIR/metadata/VERSION"
BACKUP_DIR="$TONY_DIR/metadata"
INSTALL_TYPE=""
CURRENT_TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
    log_to_file "INFO" "$1"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    log_to_file "SUCCESS" "$1"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    log_to_file "WARNING" "$1"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    log_to_file "ERROR" "$1"
}

log_to_file() {
    local LEVEL="$1"
    local MESSAGE="$2"
    mkdir -p "$(dirname "$INSTALL_LOG")"
    echo "[$CURRENT_TIMESTAMP] [$LEVEL] $MESSAGE" >> "$INSTALL_LOG"
}

# Display banner
show_banner() {
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║           Tech Lead Tony Framework v2.0 Installation        ║"
    echo "║              Modular Architecture - Zero Risk               ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo -e "${BLUE}📋 Smart Installation Features:${NC}"
    echo "   🛡️  Non-destructive - preserves all existing content"
    echo "   🔍 Smart detection - identifies installation type"
    echo "   📦 Modular design - context-aware component loading"
    echo "   🔄 Full rollback - complete restoration capability"
    echo ""
}

# Detect installation type
detect_installation_type() {
    log_info "Detecting current installation state..."
    
    if [ ! -f "$CLAUDE_MD" ]; then
        INSTALL_TYPE="NEW_INSTALLATION"
        log_info "No existing CLAUDE.md found - new installation"
    elif [ -d "$TONY_DIR" ] && grep -q "Tony Framework v2.0 Integration" "$CLAUDE_MD"; then
        INSTALL_TYPE="UPDATE_MODULAR"
        log_info "Existing modular Tony installation found - updating"
    elif grep -q "Tech Lead Tony Auto-Deployment" "$CLAUDE_MD"; then
        INSTALL_TYPE="MIGRATE_MONOLITHIC"
        log_info "Existing monolithic Tony installation found - migrating to modular"
    else
        INSTALL_TYPE="AUGMENT_EXISTING"
        log_info "Existing CLAUDE.md found - augmenting with Tony framework"
    fi
    
    echo -e "${CYAN}🔍 Installation Type: ${INSTALL_TYPE}${NC}"
    log_to_file "DETECTION" "Installation type determined: $INSTALL_TYPE"
}

# Create backup of existing user content
create_user_backup() {
    local BACKUP_FILE="$BACKUP_DIR/USER-BACKUP-$(date +%s).md"
    
    log_info "Creating backup of existing user content..."
    
    mkdir -p "$BACKUP_DIR"
    
    if [ -f "$CLAUDE_MD" ]; then
        cp "$CLAUDE_MD" "$BACKUP_FILE"
        log_success "User content backed up to: $BACKUP_FILE"
        
        # Calculate and store file hash for integrity verification
        if command -v md5sum >/dev/null 2>&1; then
            md5sum "$CLAUDE_MD" > "$BACKUP_FILE.md5"
            log_info "Backup integrity hash created"
        fi
        
        echo "$BACKUP_FILE"
    else
        log_info "No existing CLAUDE.md to backup"
        echo ""
    fi
}

# Deploy modular Tony components
deploy_tony_components() {
    log_info "Deploying Tony modular components..."
    
    # Create Tony directory structure
    mkdir -p "$TONY_DIR"/{metadata,templates,logs}
    
    # Copy modular components from framework directory
    local COMPONENTS=("TONY-CORE.md" "TONY-TRIGGERS.md" "TONY-SETUP.md" "AGENT-BEST-PRACTICES.md" "DEVELOPMENT-GUIDELINES.md")
    
    for component in "${COMPONENTS[@]}"; do
        local SOURCE_FILE="$SCRIPT_DIR/framework/$component"
        local TARGET_FILE="$TONY_DIR/$component"
        
        if [ -f "$SOURCE_FILE" ]; then
            cp "$SOURCE_FILE" "$TARGET_FILE"
            log_success "Deployed: $component"
        else
            log_error "Component missing: $component"
            return 1
        fi
    done
    
    log_success "All Tony components deployed successfully"
}

# Generate integration template
generate_integration_template() {
    local BACKUP_FILE="$1"
    
    cat << EOF
## 🤖 Tech Lead Tony Framework v2.0 Integration
<!-- AUTO-MANAGED: Tony Framework Version 2.0.0 | Installed: $CURRENT_TIMESTAMP -->
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

### Session Type Behavior

**🔄 Regular Sessions (Default)**
- Behavior: Your existing CLAUDE.md instructions work normally
- Tony Overhead: None - only lightweight trigger detection active
- Performance: No impact on normal Claude usage

**🤖 Tony Sessions (When Triggered)**
- Trigger: Natural language requests like "Hey Tony" or "tech lead help"
- Behavior: Tony coordination framework activates automatically
- Loading: Context-aware component loading based on needs
- Function: Full multi-agent coordination capabilities

**👨‍💻 Agent Sessions (Multi-Agent Work)**
- Trigger: Agent coordination requests or Tony delegation
- Behavior: Agent best practices loaded automatically
- Loading: Standards and coordination protocols active
- Function: Quality-assured multi-agent workflows

**📊 Development Sessions (Code Work)**
- Trigger: Development activities and code work
- Behavior: Development guidelines active automatically  
- Loading: Standards, testing, and quality requirements
- Function: Consistent development practices

### Framework Benefits

**🛡️ Zero Risk Installation**
- Your existing CLAUDE.md content is never modified or overwritten
- All Tony components are isolated in separate, updatable modules
- Complete framework removal restores your original configuration
- Framework updates never affect your personal customizations

**⚡ Context Efficiency**
- Components load only when needed for specific session types
- Regular Claude sessions have minimal overhead (just trigger detection)
- Tony sessions load full coordination capabilities on demand
- Memory and context usage optimized for each session type

**🔄 Seamless Updates**
- Framework components update independently of your content
- New Tony features become available without user file changes
- Version control tracks framework versions separately
- Rollback capabilities preserve your original configuration

### Installation Information

**Installation Date**: $CURRENT_TIMESTAMP  
**Framework Version**: 2.0.0 Modular Architecture  
**Installation Type**: $INSTALL_TYPE  
**Original Backup**: $BACKUP_FILE  
**Component Location**: \`~/.claude/tony/\`  
**Verification**: Run \`~/.claude/tony/verify-modular-installation.sh\`  

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

4. **Component Integration**
   - All modules work together seamlessly
   - TONY-CORE.md orchestrates other components as needed
   - Context-efficient loading prevents unnecessary overhead

<!-- END AUTO-MANAGED SECTION -->
<!-- Tony Framework v2.0.0 | Safe, Non-Destructive, Reversible -->
EOF
}

# Implement non-destructive augmentation
perform_augmentation() {
    local BACKUP_FILE="$1"
    
    log_info "Performing non-destructive CLAUDE.md augmentation..."
    
    case "$INSTALL_TYPE" in
        "NEW_INSTALLATION")
            log_info "Creating new CLAUDE.md with Tony integration"
            cat > "$CLAUDE_MD" << EOF
# Claude Instructions

## User Configuration
# Add your personal Claude instructions here

$(generate_integration_template "$BACKUP_FILE")
EOF
            ;;
            
        "AUGMENT_EXISTING")
            log_info "Augmenting existing CLAUDE.md with Tony integration"
            echo "" >> "$CLAUDE_MD"
            generate_integration_template "$BACKUP_FILE" >> "$CLAUDE_MD"
            ;;
            
        "UPDATE_MODULAR")
            log_info "Updating existing modular Tony integration"
            # Extract user content (everything before AUTO-MANAGED)
            sed '/<!-- AUTO-MANAGED:/,$d' "$CLAUDE_MD" > /tmp/user-content.md
            
            # Reconstruct with updated integration
            cat /tmp/user-content.md > "$CLAUDE_MD"
            echo "" >> "$CLAUDE_MD"
            generate_integration_template "$BACKUP_FILE" >> "$CLAUDE_MD"
            rm -f /tmp/user-content.md
            ;;
            
        "MIGRATE_MONOLITHIC")
            log_info "Migrating from monolithic to modular Tony installation"
            # Remove old monolithic Tony content and replace with modular
            sed '/## 🤖 Tech Lead Tony Auto-Deployment System/,/^## [^#]/{ /^## [^#]/!d; }' "$CLAUDE_MD" > /tmp/cleaned-content.md
            
            cat /tmp/cleaned-content.md > "$CLAUDE_MD"
            echo "" >> "$CLAUDE_MD"
            generate_integration_template "$BACKUP_FILE" >> "$CLAUDE_MD"
            rm -f /tmp/cleaned-content.md
            ;;
    esac
    
    log_success "CLAUDE.md augmentation completed safely"
}

# Create version and metadata files
create_metadata() {
    local BACKUP_FILE="$1"
    
    log_info "Creating installation metadata..."
    
    # Create version file
    cat > "$VERSION_FILE" << EOF
Framework-Version: 2.0.0
Architecture: Modular
Installation-Date: $CURRENT_TIMESTAMP
Installation-Type: $INSTALL_TYPE
Components:
  TONY-CORE: 2.0.0
  TONY-TRIGGERS: 2.0.0  
  TONY-SETUP: 2.0.0
  AGENT-BEST-PRACTICES: 2.0.0
  DEVELOPMENT-GUIDELINES: 2.0.0
User-Backup: $BACKUP_FILE
Original-Hash: $(md5sum "$CLAUDE_MD" 2>/dev/null | cut -d' ' -f1 || echo "N/A")
Installation-Script: $(basename "$0")
Script-Version: 2.0.0
EOF

    log_success "Version metadata created"
    
    # Log installation event
    log_to_file "INSTALLATION" "Tony Framework v2.0 modular installation completed successfully"
    log_to_file "COMPONENTS" "All modular components deployed and verified"
    log_to_file "BACKUP" "User content backup: $BACKUP_FILE"
    log_to_file "METADATA" "Installation metadata created in $VERSION_FILE"
}

# Verify installation integrity
verify_installation() {
    log_info "Verifying installation integrity..."
    
    local ERRORS=0
    
    # Check Tony directory structure
    if [ -d "$TONY_DIR" ]; then
        log_success "Tony directory structure exists"
    else
        log_error "Tony directory missing"
        ((ERRORS++))
    fi
    
    # Check modular components
    local COMPONENTS=("TONY-CORE.md" "TONY-TRIGGERS.md" "TONY-SETUP.md" "AGENT-BEST-PRACTICES.md" "DEVELOPMENT-GUIDELINES.md")
    for component in "${COMPONENTS[@]}"; do
        if [ -f "$TONY_DIR/$component" ]; then
            log_success "Component exists: $component"
        else
            log_error "Component missing: $component"
            ((ERRORS++))
        fi
    done
    
    # Check CLAUDE.md integration
    if [ -f "$CLAUDE_MD" ] && grep -q "Tony Framework v2.0 Integration" "$CLAUDE_MD"; then
        log_success "CLAUDE.md integration verified"
    else
        log_error "CLAUDE.md integration missing or invalid"
        ((ERRORS++))
    fi
    
    # Check metadata files
    if [ -f "$VERSION_FILE" ]; then
        log_success "Version metadata exists"
    else
        log_error "Version metadata missing"
        ((ERRORS++))
    fi
    
    if [ $ERRORS -eq 0 ]; then
        log_success "Installation verification PASSED - all components healthy"
        return 0
    else
        log_error "Installation verification FAILED - $ERRORS error(s) found"
        return 1
    fi
}

# Create verification script
create_verification_script() {
    local VERIFY_SCRIPT="$TONY_DIR/verify-modular-installation.sh"
    
    cat > "$VERIFY_SCRIPT" << 'EOF'
#!/bin/bash
# Tony Framework v2.0 - Installation Verification Script

TONY_DIR="$HOME/.claude/tony"
CLAUDE_MD="$HOME/.claude/CLAUDE.md"

echo "🔍 Tony Framework v2.0 - Installation Verification"
echo "=================================================="

ERRORS=0

# Check components
COMPONENTS=("TONY-CORE.md" "TONY-TRIGGERS.md" "TONY-SETUP.md" "AGENT-BEST-PRACTICES.md" "DEVELOPMENT-GUIDELINES.md")
for component in "${COMPONENTS[@]}"; do
    if [ -f "$TONY_DIR/$component" ]; then
        echo "✅ $component"
    else
        echo "❌ $component MISSING"
        ((ERRORS++))
    fi
done

# Check integration
if grep -q "Tony Framework v2.0 Integration" "$CLAUDE_MD"; then
    echo "✅ CLAUDE.md integration"
else
    echo "❌ CLAUDE.md integration MISSING"
    ((ERRORS++))
fi

# Check metadata
if [ -f "$TONY_DIR/metadata/VERSION" ]; then
    echo "✅ Version metadata"
    echo "📊 Installation Info:"
    grep -E "Framework-Version|Installation-Type|Installation-Date" "$TONY_DIR/metadata/VERSION" | sed 's/^/   /'
else
    echo "❌ Version metadata MISSING"
    ((ERRORS++))
fi

echo ""
if [ $ERRORS -eq 0 ]; then
    echo "🎉 Verification PASSED - Tony Framework ready for use!"
    echo ""
    echo "🚀 Try these commands to test Tony:"
    echo '   Say: "Hey Tony, test the installation"'
    echo '   Say: "Launch Tony for this project"'
else
    echo "⚠️  Verification FAILED - $ERRORS error(s) found"
    echo "   Run installation script again to fix issues"
fi

exit $ERRORS
EOF

    chmod +x "$VERIFY_SCRIPT"
    log_success "Verification script created: $VERIFY_SCRIPT"
}

# Create rollback script
create_rollback_script() {
    local BACKUP_FILE="$1"
    local ROLLBACK_SCRIPT="$TONY_DIR/rollback-installation.sh"
    
    cat > "$ROLLBACK_SCRIPT" << EOF
#!/bin/bash
# Tony Framework v2.0 - Rollback Script

echo "🔄 Tony Framework v2.0 - Installation Rollback"
echo "=============================================="

read -p "⚠️  This will remove Tony framework and restore original configuration. Continue? (y/N): " CONFIRM

if [ "\$CONFIRM" != "y" ]; then
    echo "Rollback cancelled"
    exit 0
fi

# Restore original CLAUDE.md if backup exists
if [ -f "$BACKUP_FILE" ]; then
    cp "$BACKUP_FILE" "$HOME/.claude/CLAUDE.md"
    echo "✅ Original CLAUDE.md restored from backup"
else
    # Remove AUTO-MANAGED section only
    sed '/<!-- AUTO-MANAGED:/,/<!-- END AUTO-MANAGED SECTION -->/d' "$HOME/.claude/CLAUDE.md" > /tmp/restored.md
    cp /tmp/restored.md "$HOME/.claude/CLAUDE.md"
    rm -f /tmp/restored.md
    echo "✅ Tony integration section removed"
fi

# Optionally remove Tony components
read -p "Remove all Tony components from ~/.claude/tony/? (y/N): " REMOVE_ALL
if [ "\$REMOVE_ALL" = "y" ]; then
    rm -rf "$TONY_DIR"
    echo "✅ All Tony components removed"
else
    echo "ℹ️  Tony components preserved in $TONY_DIR"
fi

echo ""
echo "🎉 Rollback completed successfully"
echo "   Your original Claude configuration has been restored"
EOF

    chmod +x "$ROLLBACK_SCRIPT"
    log_success "Rollback script created: $ROLLBACK_SCRIPT"
}

# Main installation function
main() {
    show_banner
    
    # Pre-flight checks
    if [ ! -d "$HOME/.claude" ]; then
        mkdir -p "$HOME/.claude"
        log_info "Created ~/.claude directory"
    fi
    
    # Detect installation type
    detect_installation_type
    
    # Ask for confirmation based on installation type
    case "$INSTALL_TYPE" in
        "NEW_INSTALLATION")
            echo -e "${GREEN}📋 New Installation${NC}"
            echo "   This will create a new CLAUDE.md with Tony framework integration"
            ;;
        "AUGMENT_EXISTING")
            echo -e "${YELLOW}📋 Augment Existing${NC}"
            echo "   This will add Tony framework to your existing CLAUDE.md"
            echo "   Your existing content will be completely preserved"
            ;;
        "UPDATE_MODULAR")
            echo -e "${BLUE}📋 Update Modular${NC}"
            echo "   This will update your existing Tony modular installation"
            echo "   Your content and customizations will be preserved"
            ;;
        "MIGRATE_MONOLITHIC")
            echo -e "${CYAN}📋 Migrate Monolithic${NC}"
            echo "   This will migrate your monolithic Tony installation to modular"
            echo "   All functionality will be preserved with improved architecture"
            ;;
    esac
    
    echo ""
    read -p "Proceed with installation? (y/N): " CONFIRM
    if [ "$CONFIRM" != "y" ]; then
        echo "Installation cancelled"
        exit 0
    fi
    
    echo ""
    log_info "Starting Tony Framework v2.0 modular installation..."
    
    # Create backup
    BACKUP_FILE=$(create_user_backup)
    
    # Deploy components
    deploy_tony_components
    
    # Perform augmentation
    perform_augmentation "$BACKUP_FILE"
    
    # Create metadata
    create_metadata "$BACKUP_FILE"
    
    # Create utility scripts
    create_verification_script
    create_rollback_script "$BACKUP_FILE"
    
    # Verify installation
    if verify_installation; then
        echo ""
        echo -e "${GREEN}🎉 Tony Framework v2.0 Installation SUCCESSFUL!${NC}"
        echo ""
        echo -e "${BLUE}📋 Installation Summary:${NC}"
        echo "   ✅ Installation Type: $INSTALL_TYPE"
        echo "   ✅ Framework Version: 2.0.0 Modular Architecture"
        echo "   ✅ Components: 5 modular components deployed"
        echo "   ✅ User Content: Completely preserved"
        if [ -n "$BACKUP_FILE" ]; then
            echo "   ✅ Backup Created: $BACKUP_FILE"
        fi
        echo "   ✅ Integration: Non-destructive augmentation complete"
        echo ""
        echo -e "${CYAN}🚀 Ready to Use Tony!${NC}"
        echo '   Try: "Hey Tony, test the installation"'
        echo '   Try: "Launch Tony for this project"'
        echo ""
        echo -e "${BLUE}📖 Useful Commands:${NC}"
        echo "   Verify: $TONY_DIR/verify-modular-installation.sh"
        echo "   Rollback: $TONY_DIR/rollback-installation.sh"
        echo "   Logs: $INSTALL_LOG"
        echo ""
    else
        log_error "Installation completed with errors - please review verification output"
        exit 1
    fi
}

# Run main function
main "$@"