#!/bin/bash

# Tony Framework - Status Command
# Shows framework status using bash automation library
# Demonstrates 90% API reduction through bash operations

set -euo pipefail

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source Tony bash automation library
source "$SCRIPT_DIR/lib/tony-lib.sh"

# Main status function
show_tony_status() {
    show_banner "Tony Framework Status" "v$(get_tony_lib_version)"
    
    # Track this as bash operation (no API needed)
    track_bash_call
    
    # Version information
    print_section "Version Information"
    
    local github_version user_version
    github_version=$(get_github_version)
    user_version=$(get_user_version)
    
    print_status_box "Version Hierarchy" \
        "GitHub Latest: $github_version" \
        "User Installed: $user_version" \
        "Library Version: $(get_tony_lib_version)"
    
    # Installation status
    print_section "Installation Status"
    
    if [ "$user_version" = "not-installed" ]; then
        print_error_box "Not Installed" \
            "Tony Framework is not installed at user level" \
            "Run: tony install"
    else
        local tony_home="$HOME/.tony"
        local components=(
            "$tony_home/core/TONY-CORE.md"
            "$tony_home/core/TONY-TRIGGERS.md"
            "$tony_home/core/TONY-SETUP.md"
            "$tony_home/core/AGENT-BEST-PRACTICES.md"
            "$tony_home/core/DEVELOPMENT-GUIDELINES.md"
        )
        
        print_file_list "Core Components" "${components[@]}"
    fi
    
    # Git repository status (if in a git repo)
    if is_git_repo; then
        print_section "Git Repository Status"
        
        local current_branch repo_url
        current_branch=$(get_current_branch)
        repo_url=$(get_remote_url)
        
        print_status_box "Repository Information" \
            "Current Branch: $current_branch" \
            "Remote URL: ${repo_url:-No remote configured}" \
            "Working Dir: $(has_uncommitted_changes && echo 'Modified' || echo 'Clean')"
    fi
    
    # Project deployments
    print_section "Project Deployments"
    
    local project_count=0
    while IFS=: read -r project_path version last_activity; do
        ((project_count++))
        local activity_date="Never"
        if [ "$last_activity" != "0" ]; then
            activity_date=$(date -d "@$last_activity" "+%Y-%m-%d %H:%M" 2>/dev/null || echo "Unknown")
        fi
        
        echo -e "${CYAN}📁 $project_path${NC}"
        echo -e "   Version: ${BLUE}$version${NC}"
        echo -e "   Last Active: ${GREEN}$activity_date${NC}"
        echo ""
    done < <(get_project_versions | head -5)
    
    if [ $project_count -eq 0 ]; then
        log_info "No Tony project deployments found"
    else
        log_info "Found $project_count project deployment(s)"
    fi
    
    # Library statistics
    print_section "Performance Metrics"
    show_lib_stats
    
    # Upgrade recommendation
    print_section "Recommendations"
    analyze_upgrade_path
}

# Parse command line arguments
VERBOSE=false
QUICK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            VERBOSE=true
            enable_verbose
            shift
            ;;
        -q|--quick)
            QUICK=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -v, --verbose    Show detailed output"
            echo "  -q, --quick      Quick status (version only)"
            echo "  -h, --help       Show this help message"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Main execution
if [ "$QUICK" = true ]; then
    # Quick mode - just show versions
    echo "Tony Framework: $(get_user_version)"
    echo "Library: $(get_tony_lib_version)"
else
    # Full status
    show_tony_status
fi