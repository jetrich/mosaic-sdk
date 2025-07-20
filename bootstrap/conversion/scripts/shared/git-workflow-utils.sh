#!/bin/bash

# Tony Framework - Git Workflow Utilities
# Proper git branch management, PR workflow, and version control

set -euo pipefail

# Source logging utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/logging-utils.sh"

# Git workflow configuration
DEFAULT_BASE_BRANCH="main"
FEATURE_BRANCH_PREFIX="feature/tony"
HOTFIX_BRANCH_PREFIX="hotfix/tony"
RELEASE_BRANCH_PREFIX="release/tony"

# Initialize git workflow utilities
init_git_workflow() {
    log_debug "Initializing git workflow utilities"
    
    # Verify git repository
    if ! git rev-parse --git-dir >/dev/null 2>&1; then
        log_error "Not in a git repository"
        return 1
    fi
    
    # Ensure we have a remote origin
    if ! git remote get-url origin >/dev/null 2>&1; then
        log_warning "No remote origin configured - some operations may fail"
    fi
    
    # Check for uncommitted changes
    if ! git diff --quiet || ! git diff --cached --quiet; then
        log_warning "Working directory has uncommitted changes"
        return 2
    fi
    
    log_debug "Git workflow initialized successfully"
    return 0
}

# Create feature branch for agent task
create_feature_branch() {
    local task_id="$1"
    local description="$2"
    local base_branch="${3:-$DEFAULT_BASE_BRANCH}"
    
    log_info "Creating feature branch for task $task_id"
    
    # Sanitize branch name
    local branch_name="$FEATURE_BRANCH_PREFIX-$task_id-$(echo "$description" | tr ' ' '-' | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]//g')"
    
    # Ensure we're on base branch and up to date
    if ! checkout_and_update_branch "$base_branch"; then
        log_error "Failed to checkout and update base branch: $base_branch"
        return 1
    fi
    
    # Create and checkout feature branch
    if git checkout -b "$branch_name" >/dev/null 2>&1; then
        log_success "Created feature branch: $branch_name"
        echo "$branch_name"
        return 0
    else
        log_error "Failed to create feature branch: $branch_name"
        return 1
    fi
}

# Checkout and update branch to latest
checkout_and_update_branch() {
    local branch_name="$1"
    
    log_debug "Checking out and updating branch: $branch_name"
    
    # Stash any uncommitted changes
    local stash_created=false
    if ! git diff --quiet || ! git diff --cached --quiet; then
        log_info "Stashing uncommitted changes"
        git stash push -m "Tony auto-stash before branch switch $(date)" >/dev/null 2>&1
        stash_created=true
    fi
    
    # Checkout branch
    if ! git checkout "$branch_name" >/dev/null 2>&1; then
        log_error "Failed to checkout branch: $branch_name"
        return 1
    fi
    
    # Pull latest changes if remote exists
    if git remote get-url origin >/dev/null 2>&1; then
        if git pull origin "$branch_name" >/dev/null 2>&1; then
            log_debug "Updated branch $branch_name from remote"
        else
            log_debug "Branch $branch_name not found on remote (new branch)"
        fi
    fi
    
    # Restore stash if we created one
    if [ "$stash_created" = true ]; then
        log_info "Restoring stashed changes"
        git stash pop >/dev/null 2>&1 || log_warning "Failed to restore stash"
    fi
    
    log_success "Checked out and updated: $branch_name"
    return 0
}

# Commit agent changes with proper formatting
commit_agent_changes() {
    local task_id="$1"
    local agent_name="$2"
    local description="$3"
    local files_changed="${4:-}"
    
    log_info "Committing agent changes for task $task_id"
    
    # Add all changes
    git add . >/dev/null 2>&1
    
    # Check if there are changes to commit
    if git diff --cached --quiet; then
        log_info "No changes to commit"
        return 0
    fi
    
    # Generate commit message
    local commit_message="$(cat <<EOF
$agent_name: $description

Task ID: $task_id
Agent: $agent_name
Files: ${files_changed:-"Auto-detected changes"}

Co-Authored-By: Tony Framework <tony@example.com>
EOF
)"
    
    # Commit changes
    if git commit -m "$commit_message" >/dev/null 2>&1; then
        log_success "Committed changes for task $task_id"
        
        # Get commit hash
        local commit_hash
        commit_hash=$(git rev-parse --short HEAD)
        echo "$commit_hash"
        return 0
    else
        log_error "Failed to commit changes for task $task_id"
        return 1
    fi
}

# Push feature branch to remote
push_feature_branch() {
    local branch_name="$1"
    local force="${2:-false}"
    
    log_info "Pushing feature branch: $branch_name"
    
    # Check if remote exists
    if ! git remote get-url origin >/dev/null 2>&1; then
        log_warning "No remote origin configured - cannot push"
        return 1
    fi
    
    # Push branch
    local push_args=()
    if [ "$force" = true ]; then
        push_args+=("--force-with-lease")
    fi
    
    if git push origin "$branch_name" "${push_args[@]}" >/dev/null 2>&1; then
        log_success "Pushed feature branch: $branch_name"
        return 0
    else
        log_error "Failed to push feature branch: $branch_name"
        return 1
    fi
}

# Create pull request (requires gh CLI)
create_pull_request() {
    local task_id="$1"
    local title="$2"
    local description="$3"
    local base_branch="${4:-$DEFAULT_BASE_BRANCH}"
    
    log_info "Creating pull request for task $task_id"
    
    # Check if gh CLI is available
    if ! command -v gh >/dev/null 2>&1; then
        log_warning "GitHub CLI (gh) not installed - cannot create PR automatically"
        log_info "Manual PR creation required at: $(git remote get-url origin)/compare/$(git branch --show-current)"
        return 1
    fi
    
    # Create PR body
    local pr_body="$(cat <<EOF
## Summary
$description

## Task Details
- **Task ID**: $task_id
- **Agent**: $(whoami)
- **Branch**: $(git branch --show-current)

## Changes
$(git log --oneline "$base_branch"..HEAD --pretty=format:"- %s")

## Testing
- [ ] Code builds successfully
- [ ] Tests pass
- [ ] Manual testing completed
- [ ] Documentation updated

## Review Checklist
- [ ] Code follows style guidelines
- [ ] Security considerations addressed
- [ ] Performance impact assessed
- [ ] Breaking changes documented

---
Generated by Tony Framework
EOF
)"
    
    # Create pull request
    if gh pr create --title "$title" --body "$pr_body" --base "$base_branch" >/dev/null 2>&1; then
        local pr_url
        pr_url=$(gh pr view --json url --jq .url)
        log_success "Created pull request: $pr_url"
        echo "$pr_url"
        return 0
    else
        log_error "Failed to create pull request"
        return 1
    fi
}

# Merge feature branch back to base (fast-forward only)
merge_feature_branch() {
    local feature_branch="$1"
    local base_branch="${2:-$DEFAULT_BASE_BRANCH}"
    local delete_branch="${3:-true}"
    
    log_info "Merging feature branch $feature_branch into $base_branch"
    
    # Checkout base branch and update
    if ! checkout_and_update_branch "$base_branch"; then
        log_error "Failed to checkout base branch: $base_branch"
        return 1
    fi
    
    # Merge feature branch (fast-forward only for clean history)
    if git merge --ff-only "$feature_branch" >/dev/null 2>&1; then
        log_success "Merged $feature_branch into $base_branch"
        
        # Delete feature branch if requested
        if [ "$delete_branch" = true ]; then
            git branch -d "$feature_branch" >/dev/null 2>&1
            log_info "Deleted feature branch: $feature_branch"
            
            # Delete remote branch if it exists
            if git remote get-url origin >/dev/null 2>&1; then
                git push origin --delete "$feature_branch" >/dev/null 2>&1 || log_debug "Remote branch already deleted"
            fi
        fi
        
        return 0
    else
        log_error "Failed to merge $feature_branch (fast-forward only)"
        log_info "Consider rebasing the feature branch first"
        return 1
    fi
}

# Create release tag
create_release_tag() {
    local version="$1"
    local description="$2"
    local branch="${3:-$DEFAULT_BASE_BRANCH}"
    
    log_info "Creating release tag: v$version"
    
    # Checkout release branch
    if ! checkout_and_update_branch "$branch"; then
        log_error "Failed to checkout branch: $branch"
        return 1
    fi
    
    # Create annotated tag
    if git tag -a "v$version" -m "$description" >/dev/null 2>&1; then
        log_success "Created release tag: v$version"
        
        # Push tag to remote
        if git remote get-url origin >/dev/null 2>&1; then
            if git push origin "v$version" >/dev/null 2>&1; then
                log_success "Pushed release tag to remote: v$version"
            else
                log_warning "Failed to push tag to remote"
            fi
        fi
        
        return 0
    else
        log_error "Failed to create release tag: v$version"
        return 1
    fi
}

# Get current branch name
get_current_branch() {
    git branch --show-current 2>/dev/null || echo "unknown"
}

# Check if branch exists
branch_exists() {
    local branch_name="$1"
    git show-ref --verify --quiet "refs/heads/$branch_name" 2>/dev/null
}

# List feature branches
list_feature_branches() {
    log_info "Active Tony feature branches:"
    git branch --list "$FEATURE_BRANCH_PREFIX-*" 2>/dev/null | sed 's/^../- /' || echo "No active feature branches"
}

# Cleanup old feature branches
cleanup_merged_branches() {
    local base_branch="${1:-$DEFAULT_BASE_BRANCH}"
    
    log_info "Cleaning up merged feature branches"
    
    # Get merged branches
    local merged_branches
    merged_branches=$(git branch --merged "$base_branch" | grep "$FEATURE_BRANCH_PREFIX-" | sed 's/^..//' || echo "")
    
    if [ -n "$merged_branches" ]; then
        while IFS= read -r branch; do
            if [ -n "$branch" ] && [ "$branch" != "$base_branch" ]; then
                log_info "Deleting merged branch: $branch"
                git branch -d "$branch" >/dev/null 2>&1
                
                # Delete remote branch if exists
                if git remote get-url origin >/dev/null 2>&1; then
                    git push origin --delete "$branch" >/dev/null 2>&1 || log_debug "Remote branch already deleted"
                fi
            fi
        done <<< "$merged_branches"
        
        log_success "Cleanup completed"
    else
        log_info "No merged feature branches to clean up"
    fi
}

# Export functions for use in other scripts
export -f init_git_workflow
export -f create_feature_branch
export -f checkout_and_update_branch
export -f commit_agent_changes
export -f push_feature_branch
export -f create_pull_request
export -f merge_feature_branch
export -f create_release_tag
export -f get_current_branch
export -f branch_exists
export -f list_feature_branches
export -f cleanup_merged_branches