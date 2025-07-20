#!/bin/bash

# Tony Framework - GitHub Utilities
# Shared functions for GitHub repository interaction

set -euo pipefail

# Source logging utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/logging-utils.sh"

# GitHub configuration
TONY_GITHUB_REPO="https://github.com/jetrich/tech-lead-tony.git"
TONY_GITHUB_API="https://api.github.com/repos/jetrich/tech-lead-tony"
TEMP_DIR="/tmp/tony-github-$$"

# Initialize GitHub utilities
init_github_utils() {
    log_debug "Initializing GitHub utilities"
    
    # Check for required tools
    local missing_tools=()
    
    if ! command -v git >/dev/null 2>&1; then
        missing_tools+=("git")
    fi
    
    if ! command -v curl >/dev/null 2>&1; then
        missing_tools+=("curl")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        return 1
    fi
    
    log_debug "GitHub utilities initialized successfully"
    return 0
}

# Check GitHub connectivity
check_github_connectivity() {
    log_debug "Checking GitHub connectivity"
    
    if curl -s --max-time 10 "https://github.com" >/dev/null 2>&1; then
        log_debug "GitHub connectivity: OK"
        return 0
    else
        log_warning "GitHub connectivity: Failed"
        return 1
    fi
}

# Get latest release version from GitHub API
get_github_latest_release() {
    log_debug "Fetching latest release from GitHub API"
    
    if ! check_github_connectivity; then
        log_warning "Cannot connect to GitHub - falling back to local version detection"
        return 1
    fi
    
    local api_response
    api_response=$(curl -s --max-time 30 "$TONY_GITHUB_API/releases/latest" 2>/dev/null || echo "")
    
    if [ -n "$api_response" ]; then
        local version
        version=$(echo "$api_response" | grep '"tag_name":' | sed 's/.*"tag_name": *"\([^"]*\)".*/\1/' | sed 's/^v//')
        
        if [ -n "$version" ] && [[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            log_debug "GitHub latest release: $version"
            echo "$version"
            return 0
        fi
    fi
    
    log_debug "GitHub API failed - falling back to git ls-remote"
    get_github_latest_tag_fallback
}

# Fallback method using git ls-remote
get_github_latest_tag_fallback() {
    log_debug "Using git ls-remote fallback for version detection"
    
    local latest_tag
    latest_tag=$(git ls-remote --tags "$TONY_GITHUB_REPO" 2>/dev/null | \
                grep -v '{}' | \
                sed 's|.*refs/tags/||' | \
                sed 's/^v//' | \
                grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | \
                sort -V | \
                tail -1)
    
    if [ -n "$latest_tag" ]; then
        log_debug "GitHub latest tag (fallback): $latest_tag"
        echo "$latest_tag"
        return 0
    else
        log_warning "Could not determine GitHub version"
        return 1
    fi
}

# Clone repository to temporary directory
clone_tony_repository() {
    local target_dir="$1"
    
    log_info "Cloning Tony repository to temporary location"
    
    # Clean up any existing temp directory
    cleanup_temp_directory
    
    # Create temp directory
    mkdir -p "$TEMP_DIR"
    
    # Clone repository
    if git clone --depth 1 "$TONY_GITHUB_REPO" "$TEMP_DIR" >/dev/null 2>&1; then
        log_success "Repository cloned successfully"
        
        # Copy to target if specified
        if [ -n "$target_dir" ]; then
            cp -r "$TEMP_DIR"/* "$target_dir/"
            log_success "Repository contents copied to $target_dir"
        fi
        
        echo "$TEMP_DIR"
        return 0
    else
        log_error "Failed to clone repository"
        cleanup_temp_directory
        return 1
    fi
}

# Update existing repository
update_tony_repository() {
    local repo_dir="$1"
    
    if [ ! -d "$repo_dir/.git" ]; then
        log_error "Not a git repository: $repo_dir"
        return 1
    fi
    
    log_info "Updating Tony repository"
    
    local current_dir
    current_dir=$(pwd)
    
    cd "$repo_dir"
    
    # Stash any local changes
    if ! git diff --quiet || ! git diff --cached --quiet; then
        log_warning "Local changes detected - stashing"
        git stash push -m "Tony auto-update stash $(date)" >/dev/null 2>&1
    fi
    
    # Pull latest changes
    if git pull origin main >/dev/null 2>&1; then
        log_success "Repository updated successfully"
        cd "$current_dir"
        return 0
    else
        log_error "Failed to update repository"
        cd "$current_dir"
        return 1
    fi
}

# Download specific version
download_version() {
    local version="$1"
    local target_dir="$2"
    
    log_info "Downloading Tony framework version $version"
    
    # Clean up any existing temp directory
    cleanup_temp_directory
    
    # Create temp directory
    mkdir -p "$TEMP_DIR"
    
    # Try to clone and checkout specific version
    if git clone "$TONY_GITHUB_REPO" "$TEMP_DIR" >/dev/null 2>&1; then
        cd "$TEMP_DIR"
        
        # Try to checkout the specific version (with or without 'v' prefix)
        if git checkout "v$version" >/dev/null 2>&1 || git checkout "$version" >/dev/null 2>&1; then
            cd - >/dev/null
            
            # Copy to target directory
            if [ -n "$target_dir" ]; then
                mkdir -p "$target_dir"
                cp -r "$TEMP_DIR"/* "$target_dir/"
                log_success "Version $version downloaded to $target_dir"
            fi
            
            echo "$TEMP_DIR"
            return 0
        else
            cd - >/dev/null
            log_error "Version $version not found in repository"
            cleanup_temp_directory
            return 1
        fi
    else
        log_error "Failed to clone repository for version download"
        cleanup_temp_directory
        return 1
    fi
}

# Check if repository is up to date
is_repository_up_to_date() {
    local repo_dir="$1"
    
    if [ ! -d "$repo_dir/.git" ]; then
        log_debug "Not a git repository: $repo_dir"
        return 1
    fi
    
    local current_dir
    current_dir=$(pwd)
    cd "$repo_dir"
    
    # Fetch latest information
    git fetch origin main >/dev/null 2>&1
    
    # Check if local is behind remote
    local local_commit remote_commit
    local_commit=$(git rev-parse HEAD)
    remote_commit=$(git rev-parse origin/main)
    
    cd "$current_dir"
    
    if [ "$local_commit" = "$remote_commit" ]; then
        log_debug "Repository is up to date"
        return 0
    else
        log_debug "Repository is behind remote"
        return 1
    fi
}

# Get commit information
get_commit_info() {
    local repo_dir="$1"
    local commit_ref="${2:-HEAD}"
    
    if [ ! -d "$repo_dir/.git" ]; then
        echo "Not a git repository"
        return 1
    fi
    
    local current_dir
    current_dir=$(pwd)
    cd "$repo_dir"
    
    local commit_hash commit_date commit_message
    commit_hash=$(git rev-parse --short "$commit_ref" 2>/dev/null || echo "unknown")
    commit_date=$(git log -1 --format="%ci" "$commit_ref" 2>/dev/null || echo "unknown")
    commit_message=$(git log -1 --format="%s" "$commit_ref" 2>/dev/null || echo "unknown")
    
    cd "$current_dir"
    
    echo "Hash: $commit_hash"
    echo "Date: $commit_date"
    echo "Message: $commit_message"
}

# Verify repository integrity
verify_repository_integrity() {
    local repo_dir="$1"
    
    log_debug "Verifying repository integrity for $repo_dir"
    
    if [ ! -d "$repo_dir/.git" ]; then
        log_error "Not a git repository: $repo_dir"
        return 1
    fi
    
    local current_dir
    current_dir=$(pwd)
    cd "$repo_dir"
    
    # Check git repository health
    if git fsck --quiet >/dev/null 2>&1; then
        log_debug "Git repository integrity: OK"
    else
        log_warning "Git repository integrity issues detected"
        cd "$current_dir"
        return 1
    fi
    
    # Check for required framework files
    local required_files=(
        "framework/TONY-CORE.md"
        "framework/TONY-TRIGGERS.md"
        "framework/TONY-SETUP.md"
        "framework/AGENT-BEST-PRACTICES.md"
        "framework/DEVELOPMENT-GUIDELINES.md"
        "install-modular.sh"
        "README.md"
    )
    
    local missing_files=()
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    cd "$current_dir"
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        log_debug "All required framework files present"
        return 0
    else
        log_error "Missing required files: ${missing_files[*]}"
        return 1
    fi
}

# Get repository statistics
get_repository_stats() {
    local repo_dir="$1"
    
    if [ ! -d "$repo_dir/.git" ]; then
        echo "Not a git repository"
        return 1
    fi
    
    local current_dir
    current_dir=$(pwd)
    cd "$repo_dir"
    
    local commit_count branch_name last_commit_date repository_size
    commit_count=$(git rev-list --count HEAD 2>/dev/null || echo "0")
    branch_name=$(git branch --show-current 2>/dev/null || echo "unknown")
    last_commit_date=$(git log -1 --format="%ci" 2>/dev/null || echo "unknown")
    repository_size=$(du -sh .git 2>/dev/null | cut -f1 || echo "unknown")
    
    cd "$current_dir"
    
    echo "Commits: $commit_count"
    echo "Branch: $branch_name"
    echo "Last Commit: $last_commit_date"
    echo "Repository Size: $repository_size"
}

# Cleanup temporary directory
cleanup_temp_directory() {
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
        log_debug "Cleaned up temporary directory: $TEMP_DIR"
    fi
}

# Trap to ensure cleanup on exit
trap cleanup_temp_directory EXIT

# Export functions for use in other scripts
export -f init_github_utils
export -f check_github_connectivity
export -f get_github_latest_release
export -f get_github_latest_tag_fallback
export -f clone_tony_repository
export -f update_tony_repository
export -f download_version
export -f is_repository_up_to_date
export -f get_commit_info
export -f verify_repository_integrity
export -f get_repository_stats
export -f cleanup_temp_directory

# Initialize when sourced
init_github_utils