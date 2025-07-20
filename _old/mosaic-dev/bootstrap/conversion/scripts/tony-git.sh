#!/bin/bash

# Tony Framework - Git Workflow Management Script
# Proper git branch management for Tony agent coordination

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source shared utilities
source "$SCRIPT_DIR/shared/logging-utils.sh"
source "$SCRIPT_DIR/shared/git-workflow-utils.sh"

# Configuration
MODE="status"
TASK_ID=""
AGENT_NAME=""
DESCRIPTION=""
BASE_BRANCH="main"
FORCE=false
VERBOSE=false

# Display usage information
show_usage() {
    show_banner "Tony Git Workflow Management" "Proper git workflow for agent coordination"
    
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  status                Show git workflow status"
    echo "  create-branch         Create feature branch for agent task"
    echo "  commit                Commit agent changes with proper formatting"
    echo "  push                  Push feature branch to remote"
    echo "  create-pr             Create pull request for current branch"
    echo "  merge                 Merge feature branch back to base"
    echo "  release               Create release tag"
    echo "  cleanup               Clean up merged feature branches"
    echo "  list-branches         List active Tony feature branches"
    echo ""
    echo "Options:"
    echo "  --task-id=ID          Task identifier (required for create-branch, commit)"
    echo "  --agent=NAME          Agent name (required for commit)"
    echo "  --description=DESC    Task description"
    echo "  --base-branch=BRANCH  Base branch (default: main)"
    echo "  --force               Force operation (use with caution)"
    echo "  --verbose             Enable verbose output"
    echo "  --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 status                                           # Show git status"
    echo "  $0 create-branch --task-id=2.001 --description=\"User auth\"  # Create feature branch"
    echo "  $0 commit --task-id=2.001 --agent=auth-agent       # Commit changes"
    echo "  $0 push                                             # Push current branch"
    echo "  $0 create-pr --task-id=2.001 --description=\"Add auth\" # Create pull request"
    echo "  $0 merge                                            # Merge current branch"
    echo "  $0 release --description=\"v2.1.0\"                   # Create release tag"
    echo "  $0 cleanup                                          # Clean merged branches"
}

# Parse command line arguments
parse_arguments() {
    if [ $# -eq 0 ]; then
        show_usage
        exit 0
    fi
    
    # First argument is the command
    MODE="$1"
    shift
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --task-id=*)
                TASK_ID="${1#*=}"
                ;;
            --agent=*)
                AGENT_NAME="${1#*=}"
                ;;
            --description=*)
                DESCRIPTION="${1#*=}"
                ;;
            --base-branch=*)
                BASE_BRANCH="${1#*=}"
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

# Show git workflow status
show_git_status() {
    print_section "Tony Git Workflow Status"
    
    # Initialize git workflow
    local init_result
    init_git_workflow
    init_result=$?
    
    case $init_result in
        0)
            echo "✅ Git repository: Clean working directory"
            ;;
        1)
            echo "❌ Git repository: Not in a git repository"
            return 1
            ;;
        2)
            echo "⚠️  Git repository: Uncommitted changes detected"
            ;;
    esac
    
    # Current branch info
    local current_branch
    current_branch=$(get_current_branch)
    echo "🌿 Current branch: $current_branch"
    
    # Remote status
    if git remote get-url origin >/dev/null 2>&1; then
        local remote_url
        remote_url=$(git remote get-url origin)
        echo "🌐 Remote origin: $remote_url"
        
        # Check if branch exists on remote
        if git ls-remote --exit-code origin "$current_branch" >/dev/null 2>&1; then
            echo "☁️  Remote tracking: Up to date"
        else
            echo "☁️  Remote tracking: Local branch only"
        fi
    else
        echo "⚠️  Remote origin: Not configured"
    fi
    
    # Show active Tony branches
    echo ""
    list_feature_branches
    
    # Show recent commits
    echo ""
    echo "📝 Recent commits:"
    git log --oneline -5 --pretty=format:"  %h %s" 2>/dev/null || echo "  No commits found"
    
    # Show working directory status
    echo ""
    if ! git diff --quiet; then
        echo "📋 Unstaged changes:"
        git diff --name-only | sed 's/^/  - /'
    fi
    
    if ! git diff --cached --quiet; then
        echo "📋 Staged changes:"
        git diff --cached --name-only | sed 's/^/  - /'
    fi
    
    if git diff --quiet && git diff --cached --quiet; then
        echo "✅ Working directory: Clean"
    fi
}

# Create feature branch for agent task
create_feature_branch_command() {
    if [ -z "$TASK_ID" ]; then
        log_error "Task ID required: --task-id=ID"
        return 1
    fi
    
    if [ -z "$DESCRIPTION" ]; then
        log_error "Description required: --description=DESC"
        return 1
    fi
    
    print_section "Creating Feature Branch"
    
    # Initialize git workflow
    if ! init_git_workflow; then
        return 1
    fi
    
    # Create feature branch
    local branch_name
    if branch_name=$(create_feature_branch "$TASK_ID" "$DESCRIPTION" "$BASE_BRANCH"); then
        echo "✅ Feature branch created: $branch_name"
        echo "🚀 Ready for agent development"
        echo ""
        echo "Next steps:"
        echo "  1. Implement your changes"
        echo "  2. Run: $0 commit --task-id=$TASK_ID --agent=YOUR_AGENT"
        echo "  3. Run: $0 push"
        echo "  4. Run: $0 create-pr --task-id=$TASK_ID --description=\"Brief description\""
        return 0
    else
        return 1
    fi
}

# Commit agent changes
commit_changes_command() {
    if [ -z "$TASK_ID" ]; then
        log_error "Task ID required: --task-id=ID"
        return 1
    fi
    
    if [ -z "$AGENT_NAME" ]; then
        log_error "Agent name required: --agent=NAME"
        return 1
    fi
    
    if [ -z "$DESCRIPTION" ]; then
        DESCRIPTION="Implement task $TASK_ID"
    fi
    
    print_section "Committing Agent Changes"
    
    # Initialize git workflow
    if ! init_git_workflow >/dev/null 2>&1; then
        log_warning "Working directory has uncommitted changes - proceeding with commit"
    fi
    
    # Detect changed files
    local changed_files=""
    if ! git diff --quiet || ! git diff --cached --quiet; then
        changed_files=$(git diff --name-only HEAD 2>/dev/null | tr '\n' ', ' | sed 's/,$//')
    fi
    
    # Commit changes
    local commit_hash
    if commit_hash=$(commit_agent_changes "$TASK_ID" "$AGENT_NAME" "$DESCRIPTION" "$changed_files"); then
        echo "✅ Changes committed: $commit_hash"
        echo "📁 Files changed: ${changed_files:-"No changes detected"}"
        echo ""
        echo "Next steps:"
        echo "  1. Run: $0 push"
        echo "  2. Run: $0 create-pr --task-id=$TASK_ID --description=\"Brief description\""
        return 0
    else
        return 1
    fi
}

# Push feature branch
push_branch_command() {
    print_section "Pushing Feature Branch"
    
    local current_branch
    current_branch=$(get_current_branch)
    
    if [[ ! $current_branch =~ ^feature/tony- ]]; then
        log_warning "Current branch ($current_branch) doesn't appear to be a Tony feature branch"
        if [ "$FORCE" != true ]; then
            log_error "Use --force to push non-feature branches"
            return 1
        fi
    fi
    
    # Push branch
    if push_feature_branch "$current_branch" "$FORCE"; then
        echo "✅ Feature branch pushed: $current_branch"
        echo ""
        echo "Next step:"
        echo "  Run: $0 create-pr --task-id=ID --description=\"Brief description\""
        return 0
    else
        return 1
    fi
}

# Create pull request
create_pr_command() {
    if [ -z "$TASK_ID" ]; then
        log_error "Task ID required: --task-id=ID"
        return 1
    fi
    
    if [ -z "$DESCRIPTION" ]; then
        log_error "Description required: --description=DESC"
        return 1
    fi
    
    print_section "Creating Pull Request"
    
    local current_branch
    current_branch=$(get_current_branch)
    
    local title="Task $TASK_ID: $DESCRIPTION"
    
    # Create pull request
    local pr_url
    if pr_url=$(create_pull_request "$TASK_ID" "$title" "$DESCRIPTION" "$BASE_BRANCH"); then
        echo "✅ Pull request created: $pr_url"
        echo ""
        echo "Pull request details:"
        echo "  Title: $title"
        echo "  Branch: $current_branch → $BASE_BRANCH"
        echo "  URL: $pr_url"
        return 0
    else
        echo ""
        echo "Manual PR creation required:"
        local remote_url
        remote_url=$(git remote get-url origin 2>/dev/null || echo "No remote configured")
        echo "  URL: $remote_url/compare/$current_branch"
        return 1
    fi
}

# Merge feature branch
merge_branch_command() {
    print_section "Merging Feature Branch"
    
    local current_branch
    current_branch=$(get_current_branch)
    
    if [[ ! $current_branch =~ ^feature/tony- ]]; then
        log_warning "Current branch ($current_branch) doesn't appear to be a Tony feature branch"
        if [ "$FORCE" != true ]; then
            log_error "Use --force to merge non-feature branches"
            return 1
        fi
    fi
    
    # Merge branch
    if merge_feature_branch "$current_branch" "$BASE_BRANCH" true; then
        echo "✅ Feature branch merged and cleaned up"
        echo "🌿 Now on branch: $(get_current_branch)"
        return 0
    else
        echo ""
        echo "Merge failed - consider rebasing first:"
        echo "  git rebase $BASE_BRANCH"
        return 1
    fi
}

# Create release tag
create_release_command() {
    if [ -z "$DESCRIPTION" ]; then
        log_error "Description/version required: --description=v2.1.0"
        return 1
    fi
    
    print_section "Creating Release Tag"
    
    # Extract version from description
    local version
    version=$(echo "$DESCRIPTION" | sed 's/^v//')
    
    if ! [[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        log_error "Version must be in format: v1.2.3 or 1.2.3"
        return 1
    fi
    
    # Create release tag
    if create_release_tag "$version" "Release $version" "$BASE_BRANCH"; then
        echo "✅ Release tag created: v$version"
        echo "🏷️  Tag created on branch: $BASE_BRANCH"
        return 0
    else
        return 1
    fi
}

# Main execution
main() {
    # Parse arguments
    parse_arguments "$@"
    
    # Execute command
    case "$MODE" in
        "status")
            show_git_status
            ;;
        "create-branch")
            create_feature_branch_command
            ;;
        "commit")
            commit_changes_command
            ;;
        "push")
            push_branch_command
            ;;
        "create-pr")
            create_pr_command
            ;;
        "merge")
            merge_branch_command
            ;;
        "release")
            create_release_command
            ;;
        "cleanup")
            cleanup_merged_branches "$BASE_BRANCH"
            ;;
        "list-branches")
            list_feature_branches
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