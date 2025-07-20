#!/bin/bash

# Tony Framework - Secrets Management Script
# Prevent secrets from being committed and provide emergency cleanup

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source shared utilities
source "$SCRIPT_DIR/shared/logging-utils.sh"
source "$SCRIPT_DIR/shared/secrets-detection-utils.sh"

# Configuration
MODE="scan-staged"
TARGET_PATH=""
RECURSIVE=true
VERBOSE=false
FORCE=false

# Display usage information
show_usage() {
    show_banner "Tony Secrets Management" "Prevent secrets leaks and provide emergency cleanup"
    
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  scan-staged           Scan git staged files for secrets (default)"
    echo "  scan-directory        Scan directory for secrets"
    echo "  pre-commit-hook       Run as git pre-commit hook"
    echo "  emergency-cleanup     Create emergency cleanup script for leaked secrets"
    echo "  install-hook          Install git pre-commit hook"
    echo "  uninstall-hook        Remove git pre-commit hook"
    echo ""
    echo "Options:"
    echo "  --path=PATH           Target path for directory scanning"
    echo "  --no-recursive        Don't scan subdirectories"
    echo "  --force               Force operation (bypass confirmations)"
    echo "  --verbose             Enable verbose output"
    echo "  --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 scan-staged                              # Scan git staged files"
    echo "  $0 scan-directory --path=/home/user/project # Scan project directory"
    echo "  $0 install-hook                             # Install pre-commit hook"
    echo "  $0 emergency-cleanup                        # Create cleanup script"
}

# Parse command line arguments
parse_arguments() {
    if [ $# -eq 0 ]; then
        MODE="scan-staged"
        return 0
    fi
    
    # First argument is the command
    MODE="$1"
    shift
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --path=*)
                TARGET_PATH="${1#*=}"
                ;;
            --no-recursive)
                RECURSIVE=false
                ;;
            --force)
                FORCE=true
                ;;
            --verbose)
                VERBOSE=true
                enable_verbose
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

# Scan git staged files
scan_staged_command() {
    print_section "Scanning Git Staged Files for Secrets"
    
    if ! scan_git_staged_files; then
        echo ""
        echo "🚨 SECURITY ALERT: Potential secrets detected in staged files!"
        echo ""
        echo "🛠️  Recommended Actions:"
        echo "1. Review the flagged files and remove any secrets"
        echo "2. Use environment variables or secure vaults instead"
        echo "3. Add sensitive files to .gitignore"
        echo "4. Run: git reset HEAD <file> to unstage files"
        echo ""
        echo "🔧 Quick fixes:"
        echo "  git reset HEAD .env.backup.*    # Unstage .env files"
        echo "  echo '.env*' >> .gitignore      # Ignore all .env files"
        echo "  git add .gitignore              # Stage .gitignore"
        echo ""
        return 1
    else
        log_success "No secrets detected in staged files - safe to commit"
        return 0
    fi
}

# Scan directory for secrets
scan_directory_command() {
    if [ -z "$TARGET_PATH" ]; then
        TARGET_PATH="$(pwd)"
    fi
    
    print_section "Scanning Directory for Secrets: $TARGET_PATH"
    
    local result
    if scan_directory_for_secrets "$TARGET_PATH" "$RECURSIVE"; then
        result=$?
        if [ $result -gt 0 ]; then
            echo ""
            echo "⚠️  Found $result potential security issues in directory"
            echo ""
            echo "🛠️  Recommended Actions:"
            echo "1. Review flagged files and remove or encrypt secrets"
            echo "2. Add sensitive files to .gitignore"
            echo "3. Use environment variables or secure vaults"
            echo "4. Never commit .env, .key, or credential files"
            return 1
        else
            log_success "Directory scan complete - no major security issues found"
            return 0
        fi
    else
        log_error "Directory scan failed"
        return 1
    fi
}

# Run as pre-commit hook
pre_commit_hook_command() {
    log_debug "Running Tony secrets detection as pre-commit hook"
    
    # Silent operation for hooks
    exec 3>&1 4>&2
    exec 1>/dev/null 2>/dev/null
    
    # Run scan
    local result=0
    if ! scan_git_staged_files; then
        result=1
    fi
    
    # Restore output
    exec 1>&3 2>&4
    
    if [ $result -ne 0 ]; then
        echo "🚨 Tony Secrets Detection: COMMIT BLOCKED"
        echo ""
        echo "Potential secrets detected in staged files!"
        echo "Run: tony-secrets.sh scan-staged"
        echo "For detailed analysis and remediation steps."
        echo ""
        return 1
    fi
    
    return 0
}

# Create emergency cleanup script
emergency_cleanup_command() {
    print_section "Creating Emergency Secrets Cleanup Script"
    
    local repo_path
    repo_path=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
    
    if [ ! -d "$repo_path/.git" ]; then
        log_error "Not in a git repository"
        return 1
    fi
    
    log_warning "🚨 EMERGENCY PROCEDURE: Secrets have been committed to git history"
    echo ""
    echo "This will create a script to remove secrets from git history."
    echo "⚠️  WARNING: This rewrites git history and affects all collaborators!"
    echo ""
    
    if [ "$FORCE" != true ]; then
        read -p "Create emergency cleanup script? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log_info "Emergency cleanup cancelled"
            return 0
        fi
    fi
    
    local cleanup_script
    cleanup_script=$(create_emergency_cleanup "$repo_path")
    
    echo ""
    log_warning "🔧 Emergency cleanup script created: $cleanup_script"
    echo ""
    echo "🚨 IMMEDIATE ACTIONS REQUIRED:"
    echo "1. Stop all services using the leaked credentials"
    echo "2. Rotate/regenerate all exposed secrets immediately"
    echo "3. Run the cleanup script: ./$cleanup_script"
    echo "4. Force push to remove secrets from remote: git push --force --all"
    echo "5. Notify all team members to re-clone the repository"
    echo ""
    echo "🔐 Security Checklist:"
    echo "□ Revoke exposed API keys"
    echo "□ Change exposed passwords"
    echo "□ Regenerate exposed tokens"
    echo "□ Check access logs for unauthorized usage"
    echo "□ Update all affected services"
    echo "□ Consider the repository compromised until cleanup is complete"
    
    return 0
}

# Install git pre-commit hook
install_hook_command() {
    print_section "Installing Tony Secrets Detection Pre-Commit Hook"
    
    local repo_path
    repo_path=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
    
    if [ ! -d "$repo_path/.git" ]; then
        log_error "Not in a git repository"
        return 1
    fi
    
    local hook_path="$repo_path/.git/hooks/pre-commit"
    local script_path="$SCRIPT_DIR/tony-secrets.sh"
    
    # Check if hook already exists
    if [ -f "$hook_path" ] && [ "$FORCE" != true ]; then
        log_warning "Pre-commit hook already exists"
        read -p "Overwrite existing hook? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log_info "Hook installation cancelled"
            return 0
        fi
    fi
    
    # Create pre-commit hook
    cat > "$hook_path" << EOF
#!/bin/bash
# Tony Secrets Detection Pre-Commit Hook
# Automatically prevents secrets from being committed

# Run Tony secrets detection
if ! "$script_path" pre-commit-hook; then
    echo ""
    echo "🚨 COMMIT BLOCKED: Potential secrets detected!"
    echo ""
    echo "To review and fix:"
    echo "  $script_path scan-staged"
    echo ""
    echo "To bypass (NOT RECOMMENDED):"
    echo "  git commit --no-verify"
    echo ""
    exit 1
fi

# Allow commit if no secrets detected
exit 0
EOF
    
    chmod +x "$hook_path"
    
    log_success "Tony secrets detection pre-commit hook installed"
    echo ""
    echo "✅ The hook will now automatically:"
    echo "  • Scan all staged files before each commit"
    echo "  • Block commits containing potential secrets"
    echo "  • Provide guidance for fixing security issues"
    echo ""
    echo "🔧 To bypass the hook (NOT RECOMMENDED):"
    echo "  git commit --no-verify"
    echo ""
}

# Uninstall git pre-commit hook
uninstall_hook_command() {
    print_section "Uninstalling Tony Secrets Detection Pre-Commit Hook"
    
    local repo_path
    repo_path=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
    
    if [ ! -d "$repo_path/.git" ]; then
        log_error "Not in a git repository"
        return 1
    fi
    
    local hook_path="$repo_path/.git/hooks/pre-commit"
    
    if [ ! -f "$hook_path" ]; then
        log_info "No pre-commit hook found"
        return 0
    fi
    
    # Check if it's our hook
    if grep -q "Tony Secrets Detection" "$hook_path" 2>/dev/null; then
        rm -f "$hook_path"
        log_success "Tony secrets detection pre-commit hook removed"
    else
        log_warning "Pre-commit hook exists but is not Tony's hook"
        echo "Manual removal required: $hook_path"
        return 1
    fi
}

# Generate comprehensive .gitignore for secrets
generate_gitignore_additions() {
    print_section "Generating .gitignore Additions for Secrets Protection"
    
    local gitignore_additions
    gitignore_additions=$(cat << 'EOF'

# ===== TONY SECRETS PROTECTION =====
# Automatically generated - DO NOT EDIT manually

# Environment files
.env
.env.*
.env.local
.env.development
.env.test
.env.production
.env.staging
.env.backup*

# SSH Keys
id_rsa
id_dsa
id_ecdsa
id_ed25519
*.pem
*.key
*.pub

# SSL Certificates
*.crt
*.cer
*.der
*.p7b
*.p7c
*.p12
*.pfx

# Database files
*.db
*.sqlite
*.sqlite3
dump.rdb
*.sql

# AWS Config
.aws/credentials
.aws/config

# Google Cloud
*.json
service-account*.json
gcloud-service-key.json

# Azure
azure.json

# Terraform
*.tfstate
*.tfstate.*
terraform.tfvars

# Secrets and passwords
*secret*
*password*
*credentials*
secrets.yml
secrets.yaml

# Logs that might contain secrets
*.log
logs/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# ===== END TONY SECRETS PROTECTION =====
EOF
)
    
    local gitignore_path=".gitignore"
    
    if [ -f "$gitignore_path" ]; then
        if grep -q "TONY SECRETS PROTECTION" "$gitignore_path"; then
            log_info ".gitignore already contains Tony secrets protection"
        else
            echo "$gitignore_additions" >> "$gitignore_path"
            log_success "Added Tony secrets protection to .gitignore"
        fi
    else
        echo "$gitignore_additions" > "$gitignore_path"
        log_success "Created .gitignore with Tony secrets protection"
    fi
    
    echo ""
    echo "🛡️  Protected file patterns added to .gitignore:"
    echo "  • Environment files (.env*)"
    echo "  • SSH keys and certificates"  
    echo "  • Database files"
    echo "  • Cloud service credentials"
    echo "  • Secret/password files"
    echo ""
    echo "Remember to commit the updated .gitignore:"
    echo "  git add .gitignore"
    echo "  git commit -m 'Add Tony secrets protection to .gitignore'"
}

# Main execution
main() {
    # Parse arguments
    parse_arguments "$@"
    
    # Execute command
    case "$MODE" in
        "scan-staged")
            scan_staged_command
            ;;
        "scan-directory")
            scan_directory_command
            ;;
        "pre-commit-hook")
            pre_commit_hook_command
            ;;
        "emergency-cleanup")
            emergency_cleanup_command
            ;;
        "install-hook")
            install_hook_command
            ;;
        "uninstall-hook")
            uninstall_hook_command
            ;;
        "generate-gitignore")
            generate_gitignore_additions
            ;;
        *)
            log_error "Unknown command: $MODE"
            show_usage
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"