#!/bin/bash

# Tony Framework - Secrets Detection Utilities
# Prevent secrets from being committed to repositories

set -euo pipefail

# Source logging utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/logging-utils.sh"

# Secrets detection configuration
SECRETS_TEMP_DIR="/tmp/tony-secrets-$$"
SECRETS_PATTERNS_FILE="$SCRIPT_DIR/secrets-patterns.txt"

# Common secrets patterns (regex)
SECRETS_PATTERNS=(
    # API Keys
    "sk-[a-zA-Z0-9]{48}"                           # OpenAI API keys
    "AIza[0-9A-Za-z_-]{35}"                        # Google API keys
    "AKIA[0-9A-Z]{16}"                             # AWS Access Key ID
    "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"  # UUIDs (potential API keys)
    
    # Database connections
    "mongodb://.*:.*@"                             # MongoDB connection strings
    "mysql://.*:.*@"                               # MySQL connection strings
    "postgresql://.*:.*@"                          # PostgreSQL connection strings
    "redis://.*:.*@"                               # Redis connection strings
    
    # Generic patterns
    "['\"]([a-zA-Z_]+)_?(key|secret|token|password)['\"]:\s*['\"][^'\"]{8,}['\"]"  # JSON secrets
    "^[A-Z_]+_(KEY|SECRET|TOKEN|PASSWORD)=.+"      # Environment variable secrets
    "-----BEGIN (RSA )?PRIVATE KEY-----"           # Private keys
    "-----BEGIN CERTIFICATE-----"                  # Certificates
    
    # Specific services
    "ghp_[a-zA-Z0-9]{36}"                          # GitHub Personal Access Tokens
    "github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}"   # GitHub Fine-grained tokens
    "gho_[a-zA-Z0-9]{36}"                          # GitHub OAuth tokens
    "xoxb-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}"     # Slack Bot tokens
    "xoxp-[0-9]{11}-[0-9]{11}-[a-zA-Z0-9]{24}"     # Slack User tokens
)

# File patterns to always ignore (these are typically secrets)
DANGEROUS_FILE_PATTERNS=(
    "*.env"
    "*.env.*"
    ".env.backup*"
    "*.pem"
    "*.key"
    "*.p12"
    "*.pfx"
    "*secret*"
    "*password*"
    "id_rsa"
    "id_dsa"
    "id_ecdsa"
    "id_ed25519"
    ".aws/credentials"
    ".ssh/id_*"
    "*.sql"
    "dump.rdb"
)

# Initialize secrets detection
init_secrets_detection() {
    log_debug "Initializing secrets detection"
    
    # Create temp directory
    mkdir -p "$SECRETS_TEMP_DIR"
    
    # Create patterns file if it doesn't exist
    if [ ! -f "$SECRETS_PATTERNS_FILE" ]; then
        printf '%s\n' "${SECRETS_PATTERNS[@]}" > "$SECRETS_PATTERNS_FILE"
        log_debug "Created secrets patterns file: $SECRETS_PATTERNS_FILE"
    fi
    
    return 0
}

# Scan text content for secrets
scan_content_for_secrets() {
    local content="$1"
    local file_path="${2:-unknown}"
    local secrets_found=0
    
    # Create temp file with content
    local temp_file="$SECRETS_TEMP_DIR/content.tmp"
    echo "$content" > "$temp_file"
    
    log_debug "Scanning content for secrets: $file_path"
    
    # Scan with each pattern
    while IFS= read -r pattern; do
        if [ -n "$pattern" ] && [[ ! "$pattern" =~ ^# ]]; then
            if grep -qE "$pattern" "$temp_file" 2>/dev/null; then
                log_warning "Potential secret detected in $file_path: pattern matches $pattern"
                ((secrets_found++))
                
                # Log the match (but don't expose the actual secret)
                local line_numbers
                line_numbers=$(grep -nE "$pattern" "$temp_file" | cut -d: -f1 | tr '\n' ',' | sed 's/,$//')
                echo "$file_path:$line_numbers:$pattern" >> "$SECRETS_TEMP_DIR/secrets_found.txt"
            fi
        fi
    done < "$SECRETS_PATTERNS_FILE"
    
    # Clean up temp file
    rm -f "$temp_file"
    
    return $secrets_found
}

# Scan file for secrets
scan_file_for_secrets() {
    local file_path="$1"
    local secrets_found=0
    
    # Check if file exists and is readable
    if [ ! -f "$file_path" ] || [ ! -r "$file_path" ]; then
        log_debug "File not readable: $file_path"
        return 0
    fi
    
    # Check file size (skip very large files)
    local file_size
    file_size=$(stat -c%s "$file_path" 2>/dev/null || echo "0")
    if [ "$file_size" -gt 1048576 ]; then  # 1MB
        log_debug "Skipping large file: $file_path ($file_size bytes)"
        return 0
    fi
    
    # Check if file is binary
    if file "$file_path" | grep -q "binary"; then
        log_debug "Skipping binary file: $file_path"
        return 0
    fi
    
    log_debug "Scanning file for secrets: $file_path"
    
    # Read file content
    local content
    content=$(cat "$file_path" 2>/dev/null || echo "")
    
    # Scan content
    if ! scan_content_for_secrets "$content" "$file_path"; then
        secrets_found=$?
    fi
    
    return $secrets_found
}

# Check if file matches dangerous patterns
is_dangerous_file() {
    local file_path="$1"
    local filename
    filename=$(basename "$file_path")
    
    for pattern in "${DANGEROUS_FILE_PATTERNS[@]}"; do
        # Use bash pattern matching
        if [[ "$filename" == $pattern ]] || [[ "$file_path" == *"$pattern"* ]]; then
            log_warning "File matches dangerous pattern '$pattern': $file_path"
            echo "$file_path:DANGEROUS_FILE_PATTERN:$pattern" >> "$SECRETS_TEMP_DIR/dangerous_files.txt"
            return 0
        fi
    done
    
    return 1
}

# Scan git staged files for secrets
scan_git_staged_files() {
    log_info "Scanning git staged files for secrets"
    
    # Initialize
    init_secrets_detection
    
    local total_secrets=0
    local total_dangerous=0
    local files_scanned=0
    
    # Get staged files
    local staged_files
    if ! staged_files=$(git diff --cached --name-only 2>/dev/null); then
        log_error "Not in a git repository or no staged files"
        return 1
    fi
    
    if [ -z "$staged_files" ]; then
        log_info "No staged files to scan"
        return 0
    fi
    
    # Scan each staged file
    while IFS= read -r file_path; do
        if [ -n "$file_path" ]; then
            ((files_scanned++))
            
            # Check for dangerous file patterns
            if is_dangerous_file "$file_path"; then
                ((total_dangerous++))
            fi
            
            # Scan file content for secrets
            local secrets_in_file=0
            if ! scan_file_for_secrets "$file_path"; then
                secrets_in_file=$?
                total_secrets=$((total_secrets + secrets_in_file))
            fi
        fi
    done <<< "$staged_files"
    
    # Report results
    log_info "Secrets scan complete: $files_scanned files scanned"
    
    if [ $total_dangerous -gt 0 ]; then
        log_error "Found $total_dangerous files with dangerous patterns"
        log_error "These files should NEVER be committed:"
        if [ -f "$SECRETS_TEMP_DIR/dangerous_files.txt" ]; then
            while IFS=: read -r file_path pattern_type pattern; do
                echo "  ❌ $file_path (matches: $pattern)"
            done < "$SECRETS_TEMP_DIR/dangerous_files.txt"
        fi
    fi
    
    if [ $total_secrets -gt 0 ]; then
        log_error "Found $total_secrets potential secrets in staged files"
        log_error "Review these potential secrets:"
        if [ -f "$SECRETS_TEMP_DIR/secrets_found.txt" ]; then
            while IFS=: read -r file_path line_numbers pattern; do
                echo "  🔑 $file_path (lines: $line_numbers)"
            done < "$SECRETS_TEMP_DIR/secrets_found.txt"
        fi
    fi
    
    # Return error code if secrets or dangerous files found
    local total_issues=$((total_secrets + total_dangerous))
    if [ $total_issues -gt 0 ]; then
        log_error "SECURITY ISSUE: Found $total_issues potential secrets/dangerous files"
        log_error "Commit blocked to prevent secrets leak!"
        return 1
    else
        log_success "No secrets detected - safe to commit"
        return 0
    fi
}

# Scan directory for secrets
scan_directory_for_secrets() {
    local directory="$1"
    local recursive="${2:-true}"
    
    log_info "Scanning directory for secrets: $directory"
    
    # Initialize
    init_secrets_detection
    
    local total_secrets=0
    local total_dangerous=0
    local files_scanned=0
    
    # Find files to scan
    local find_args=("$directory" "-type" "f")
    if [ "$recursive" != "true" ]; then
        find_args+=("-maxdepth" "1")
    fi
    
    # Scan files
    while IFS= read -r -d '' file_path; do
        ((files_scanned++))
        
        # Check for dangerous file patterns
        if is_dangerous_file "$file_path"; then
            ((total_dangerous++))
        fi
        
        # Scan file content for secrets
        local secrets_in_file=0
        if ! scan_file_for_secrets "$file_path"; then
            secrets_in_file=$?
            total_secrets=$((total_secrets + secrets_in_file))
        fi
        
    done < <(find "${find_args[@]}" -print0 2>/dev/null)
    
    # Report results
    log_info "Directory scan complete: $files_scanned files scanned"
    log_info "Found $total_dangerous dangerous files, $total_secrets potential secrets"
    
    return $((total_secrets + total_dangerous))
}

# Create emergency cleanup script for leaked secrets
create_emergency_cleanup() {
    local repo_path="$1"
    
    log_warning "Creating emergency secrets cleanup script"
    
    local cleanup_script="$repo_path/EMERGENCY_SECRETS_CLEANUP.sh"
    
    cat > "$cleanup_script" << 'EOF'
#!/bin/bash
# EMERGENCY SECRETS CLEANUP SCRIPT
# WARNING: This will rewrite git history - use with caution!

set -euo pipefail

echo "🚨 EMERGENCY SECRETS CLEANUP"
echo "================================"
echo ""
echo "This script will remove secrets files from git history."
echo "WARNING: This rewrites git history and requires force push!"
echo ""

# Files to remove from history
SECRETS_FILES=(
    ".env"
    ".env.*"
    ".env.backup*"
    "*.pem"
    "*.key"
    "*secret*"
    "*password*"
)

echo "Files that will be removed from git history:"
for pattern in "${SECRETS_FILES[@]}"; do
    echo "  - $pattern"
done

echo ""
read -p "Are you sure you want to proceed? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cleanup cancelled"
    exit 0
fi

echo ""
echo "🔧 Removing secrets from git history..."

# Use git-filter-repo if available, otherwise use filter-branch
if command -v git-filter-repo >/dev/null 2>&1; then
    echo "Using git-filter-repo (recommended)"
    
    for pattern in "${SECRETS_FILES[@]}"; do
        echo "Removing pattern: $pattern"
        git filter-repo --path-glob "$pattern" --invert-paths --force
    done
else
    echo "Using git filter-branch (slower)"
    
    # Build filter-branch command
    local filter_index=""
    for pattern in "${SECRETS_FILES[@]}"; do
        filter_index="$filter_index git rm --cached --ignore-unmatch '$pattern' || true;"
    done
    
    git filter-branch --index-filter "$filter_index" --prune-empty --tag-name-filter cat -- --all
fi

echo ""
echo "✅ Secrets removed from git history"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Force push to all remotes: git push --force --all"
echo "2. Force push tags: git push --force --tags"
echo "3. Notify all team members to re-clone the repository"
echo "4. Revoke/regenerate any exposed secrets immediately"
echo "5. Consider the repository compromised until secrets are rotated"
echo ""
echo "🔐 Security Actions Required:"
echo "- Rotate all API keys, passwords, and tokens"
echo "- Check access logs for unauthorized usage"
echo "- Update all affected services with new credentials"
echo ""

EOF
    
    chmod +x "$cleanup_script"
    log_warning "Emergency cleanup script created: $cleanup_script"
    echo "$cleanup_script"
}

# Cleanup function
cleanup_secrets_detection() {
    if [ -n "${SECRETS_TEMP_DIR:-}" ] && [ -d "$SECRETS_TEMP_DIR" ]; then
        rm -rf "$SECRETS_TEMP_DIR"
    fi
}

# Export functions
export -f init_secrets_detection
export -f scan_content_for_secrets
export -f scan_file_for_secrets
export -f is_dangerous_file
export -f scan_git_staged_files
export -f scan_directory_for_secrets
export -f create_emergency_cleanup
export -f cleanup_secrets_detection

# Trap for cleanup
trap cleanup_secrets_detection EXIT