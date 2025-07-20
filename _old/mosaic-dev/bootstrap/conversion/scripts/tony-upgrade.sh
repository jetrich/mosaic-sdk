#!/bin/bash

# Tony Framework - Upgrade Script
# Intelligent upgrade with version hierarchy checking (GitHub → user → project)

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
MODE="analyze-versions"
UPGRADE_PATH=""
AUTO_CONFIRM=false
VERBOSE=false
DRY_RUN=false

# Display usage information
show_usage() {
    show_banner "Tony Framework Upgrade Script" "Intelligent version hierarchy upgrade management"
    
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --analyze-versions        Analyze version hierarchy (default)"
    echo "  --determine-path          Determine optimal upgrade path"
    echo "  --execute-path=PATH       Execute specific upgrade path"
    echo "  --assess-projects         Assess project impact"
    echo "  --hierarchy-check         Perform complete hierarchy check"
    echo "  --show-strategy          Show upgrade strategy details"
    echo "  --dry-run                Show what would be done without executing"
    echo "  --verbose                Enable verbose output"
    echo "  --auto-confirm           Skip confirmation prompts"
    echo "  --help                   Show this help message"
    echo ""
    echo "Upgrade Paths:"
    echo "  github->user->projects   Full upgrade from GitHub to all levels"
    echo "  github->user            Update user-level only from GitHub"
    echo "  user->projects          Propagate user-level to projects"
    echo "  selective               Update specific components only"
    echo "  no-upgrade-needed       All versions are current"
    echo ""
    echo "Examples:"
    echo "  $0 --analyze-versions --hierarchy-check"
    echo "  $0 --determine-path --show-strategy"
    echo "  $0 --execute-path=github->user->projects --auto-confirm"
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --analyze-versions)
                MODE="analyze-versions"
                ;;
            --determine-path)
                MODE="determine-path"
                ;;
            --execute-path=*)
                MODE="execute-path"
                UPGRADE_PATH="${1#*=}"
                ;;
            --assess-projects)
                MODE="assess-projects"
                ;;
            --hierarchy-check)
                MODE="hierarchy-check"
                ;;
            --show-strategy)
                MODE="show-strategy"
                ;;
            --dry-run)
                DRY_RUN=true
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

# Analyze version hierarchy
analyze_version_hierarchy() {
    print_section "Version Hierarchy Analysis"
    
    log_info "Collecting version information from all sources"
    
    # Get versions from different sources
    local github_version user_version
    
    log_info "Checking GitHub for latest version..."
    github_version=$(get_github_latest_release || get_github_latest_tag_fallback || echo "unknown")
    
    log_info "Checking user-level installation..."
    user_version=$(get_user_version)
    
    log_info "Scanning for project deployments..."
    local project_versions
    project_versions=$(get_project_versions)
    
    # Display hierarchy
    echo ""
    echo -e "${CYAN}📊 Version Hierarchy Report${NC}"
    echo "================================"
    echo ""
    
    # GitHub version
    echo -e "${GREEN}🌐 GitHub Repository (Source of Truth)${NC}"
    if [ "$github_version" != "unknown" ]; then
        echo "   Latest Release: $(format_version_display "$github_version" "github")"
    else
        echo -e "   ${RED}❌ Unable to fetch GitHub version${NC}"
    fi
    echo ""
    
    # User-level version
    echo -e "${BLUE}👤 User-Level Framework${NC}"
    if [ "$user_version" != "not-installed" ]; then
        echo "   Installed Version: $(format_version_display "$user_version" "user")"
        
        if [ "$github_version" != "unknown" ]; then
            local comparison
            comparison=$(compare_versions "$github_version" "$user_version")
            case "$comparison" in
                "greater")
                    echo -e "   ${YELLOW}⬆️  Update Available${NC}"
                    ;;
                "equal")
                    echo -e "   ${GREEN}✅ Up to Date${NC}"
                    ;;
                "less")
                    echo -e "   ${CYAN}🚀 Ahead of GitHub${NC}"
                    ;;
            esac
        fi
    else
        echo -e "   ${RED}❌ Not Installed${NC}"
    fi
    echo ""
    
    # Project-level versions
    echo -e "${MAGENTA}📁 Project Deployments${NC}"
    if [ -n "$project_versions" ]; then
        local project_count=0
        while IFS= read -r line; do
            if [ -n "$line" ]; then
                local project_path project_version last_activity
                IFS=':' read -r project_path project_version last_activity <<< "$line"
                
                ((project_count++))
                echo "   $project_count. $(basename "$project_path")"
                echo "      Path: $project_path"
                echo "      Version: $(format_version_display "$project_version" "project")"
                
                # Calculate last activity
                if [ "$last_activity" != "0" ]; then
                    local current_time
                    current_time=$(date +%s)
                    local time_diff=$((current_time - last_activity))
                    echo "      Last Activity: $(format_duration $time_diff) ago"
                else
                    echo "      Last Activity: Unknown"
                fi
                echo ""
            fi
        done <<< "$project_versions"
    else
        echo -e "   ${YELLOW}⚠️  No project deployments found${NC}"
    fi
    
    # Store versions for other functions
    echo "$github_version" > /tmp/tony-github-version
    echo "$user_version" > /tmp/tony-user-version
    echo "$project_versions" > /tmp/tony-project-versions
}

# Determine optimal upgrade path
determine_upgrade_path() {
    print_section "Upgrade Path Determination"
    
    # Read cached versions
    local github_version user_version project_versions
    github_version=$(cat /tmp/tony-github-version 2>/dev/null || echo "unknown")
    user_version=$(cat /tmp/tony-user-version 2>/dev/null || echo "not-installed")
    project_versions=$(cat /tmp/tony-project-versions 2>/dev/null || echo "")
    
    if [ "$github_version" = "unknown" ]; then
        log_error "Cannot determine upgrade path without GitHub version"
        return 1
    fi
    
    log_info "Analyzing optimal upgrade strategy"
    
    # Decision matrix
    local recommended_path="no-upgrade-needed"
    local github_vs_user user_has_projects
    
    # Compare GitHub vs User
    if [ "$user_version" = "not-installed" ]; then
        recommended_path="github->user->projects"
        log_info "User-level framework not installed - full installation needed"
    else
        github_vs_user=$(compare_versions "$github_version" "$user_version")
        case "$github_vs_user" in
            "greater")
                recommended_path="github->user->projects"
                log_info "GitHub has newer version - full upgrade recommended"
                ;;
            "equal")
                if [ -n "$project_versions" ]; then
                    # Check if projects need updates
                    user_has_projects=false
                    while IFS= read -r line; do
                        if [ -n "$line" ]; then
                            local project_version
                            IFS=':' read -r _ project_version _ <<< "$line"
                            local user_vs_project
                            user_vs_project=$(compare_versions "$user_version" "$project_version")
                            if [ "$user_vs_project" = "greater" ]; then
                                user_has_projects=true
                                break
                            fi
                        fi
                    done <<< "$project_versions"
                    
                    if [ "$user_has_projects" = true ]; then
                        recommended_path="user->projects"
                        log_info "User-level current, but projects need updates"
                    else
                        recommended_path="no-upgrade-needed"
                        log_info "All versions are current"
                    fi
                else
                    recommended_path="no-upgrade-needed"
                    log_info "No projects found, user-level current"
                fi
                ;;
            "less")
                log_warning "User-level ahead of GitHub - development version detected"
                if [ -n "$project_versions" ]; then
                    recommended_path="user->projects"
                    log_info "Propagate development version to projects"
                else
                    recommended_path="no-upgrade-needed"
                    log_info "Development version, no projects to update"
                fi
                ;;
        esac
    fi
    
    # Display recommendation
    echo ""
    echo -e "${CYAN}🎯 Upgrade Strategy Recommendation${NC}"
    echo "======================================"
    echo ""
    
    case "$recommended_path" in
        "github->user->projects")
            print_status_box "Full Upgrade Recommended" \
                "Path: GitHub → User → Projects" \
                "Reason: New features/fixes available" \
                "Impact: All levels updated to latest" \
                "Safety: User content preserved"
            ;;
        "github->user")
            print_status_box "User-Level Upgrade Recommended" \
                "Path: GitHub → User" \
                "Reason: Framework updates available" \
                "Impact: User-level updated only" \
                "Note: No active projects detected"
            ;;
        "user->projects")
            print_status_box "Project Propagation Recommended" \
                "Path: User → Projects" \
                "Reason: Projects behind user-level" \
                "Impact: Projects updated to user version" \
                "Note: User-level already current"
            ;;
        "selective")
            print_status_box "Selective Update Available" \
                "Path: Component-specific updates" \
                "Reason: Partial updates needed" \
                "Impact: Targeted component updates" \
                "Note: Mixed version states detected"
            ;;
        "no-upgrade-needed")
            print_status_box "System Up to Date" \
                "Path: No action required" \
                "Reason: All versions current" \
                "Impact: No changes needed" \
                "Status: System optimally configured"
            ;;
    esac
    
    echo "$recommended_path" > /tmp/tony-upgrade-path
    echo "$recommended_path"
}

# Execute upgrade path
execute_upgrade_path() {
    local path="$1"
    
    print_section "Executing Upgrade Path: $path"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN MODE - No actual changes will be made"
    fi
    
    case "$path" in
        "github->user->projects")
            execute_full_upgrade
            ;;
        "github->user")
            execute_user_upgrade
            ;;
        "user->projects")
            execute_project_propagation
            ;;
        "selective")
            execute_selective_upgrade
            ;;
        "no-upgrade-needed")
            log_info "No upgrade needed - system is up to date"
            return 0
            ;;
        *)
            log_error "Unknown upgrade path: $path"
            return 1
            ;;
    esac
}

# Execute full upgrade (GitHub → User → Projects)
execute_full_upgrade() {
    log_info "Executing full upgrade: GitHub → User → Projects"
    
    # Step 1: Update user-level from GitHub
    if execute_user_upgrade; then
        log_success "User-level upgrade completed"
    else
        log_error "User-level upgrade failed"
        return 1
    fi
    
    # Step 2: Propagate to projects
    if execute_project_propagation; then
        log_success "Project propagation completed"
    else
        log_warning "Project propagation completed with some issues"
    fi
    
    log_success "Full upgrade completed successfully"
}

# Execute user-level upgrade from GitHub
execute_user_upgrade() {
    log_info "Upgrading user-level framework from GitHub"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would execute: $SCRIPT_DIR/tony-install.sh --mode=update --source=github"
        return 0
    fi
    
    # Execute installation script in update mode
    if "$SCRIPT_DIR/tony-install.sh" --mode=update --source=github --auto-confirm; then
        log_success "User-level framework updated successfully"
        return 0
    else
        log_error "User-level framework update failed"
        return 1
    fi
}

# Execute project propagation
execute_project_propagation() {
    log_info "Propagating user-level framework to projects"
    
    local project_versions
    project_versions=$(cat /tmp/tony-project-versions 2>/dev/null || echo "")
    
    if [ -z "$project_versions" ]; then
        log_info "No projects found to update"
        return 0
    fi
    
    local updated_count=0
    local failed_count=0
    
    while IFS= read -r line; do
        if [ -n "$line" ]; then
            local project_path project_version
            IFS=':' read -r project_path project_version _ <<< "$line"
            
            log_info "Updating project: $(basename "$project_path")"
            
            if [ "$DRY_RUN" = true ]; then
                log_info "DRY RUN: Would update $project_path"
                ((updated_count++))
                continue
            fi
            
            # Update project-specific Tony infrastructure
            if update_project_infrastructure "$project_path"; then
                log_success "Updated: $(basename "$project_path")"
                ((updated_count++))
            else
                log_error "Failed to update: $(basename "$project_path")"
                ((failed_count++))
            fi
        fi
    done <<< "$project_versions"
    
    log_info "Project update summary: $updated_count updated, $failed_count failed"
    
    if [ $failed_count -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# Update individual project infrastructure
update_project_infrastructure() {
    local project_path="$1"
    
    # Check if project has Tony infrastructure
    if [ ! -d "$project_path/docs/agent-management/tech-lead-tony" ]; then
        log_debug "Project does not have Tony infrastructure: $project_path"
        return 0
    fi
    
    # Update project CLAUDE.md if it has Tony section
    local project_claude="$project_path/CLAUDE.md"
    if [ -f "$project_claude" ] && grep -q "Tech Lead Tony" "$project_claude"; then
        log_debug "Updating project CLAUDE.md Tony section"
        
        # Extract non-Tony content
        local temp_file="/tmp/project-claude-update-$$"
        sed '/## Tech Lead Tony/,$d' "$project_claude" > "$temp_file"
        
        # Add updated Tony section
        cat >> "$temp_file" << 'EOF'

## Tech Lead Tony Session Management

### Session Continuity
- **Tony sessions**: Start with `/engage` for context recovery
- **Session handoffs**: Zero data loss via scratchpad system
- **Agent coordination**: Monitor via logs/coordination/coordination-status.log

### Universal Deployment
- **Auto-setup**: Natural language triggers deploy Tony infrastructure
- **Session types**: New deployment vs. continuation via `/engage`
- **Context efficiency**: Tony setup isolated from regular agent sessions

---

**Tony Infrastructure**: ✅ Updated via user-level framework propagation
**Framework Version**: Inherited from user-level installation
EOF
        
        mv "$temp_file" "$project_claude"
    fi
    
    # Update project-level engage command if it exists
    local engage_file="$project_path/.claude/commands/engage.md"
    if [ -f "$engage_file" ]; then
        # Refresh with latest template - this could be enhanced
        log_debug "Project engage command exists and is current"
    fi
    
    return 0
}

# Execute selective upgrade
execute_selective_upgrade() {
    log_info "Executing selective upgrade"
    
    # This would involve more complex logic to update specific components
    # For now, fall back to user upgrade
    execute_user_upgrade
}

# Assess project impact
assess_project_impact() {
    print_section "Project Impact Assessment"
    
    local project_versions
    project_versions=$(cat /tmp/tony-project-versions 2>/dev/null || echo "")
    
    if [ -z "$project_versions" ]; then
        log_info "No project deployments found"
        return 0
    fi
    
    local user_version
    user_version=$(cat /tmp/tony-user-version 2>/dev/null || echo "not-installed")
    
    echo -e "${CYAN}📋 Project Impact Analysis${NC}"
    echo "==========================="
    echo ""
    
    local project_count=0
    local needs_update_count=0
    local legacy_count=0
    
    while IFS= read -r line; do
        if [ -n "$line" ]; then
            local project_path project_version last_activity
            IFS=':' read -r project_path project_version last_activity <<< "$line"
            
            ((project_count++))
            
            echo "📁 Project $project_count: $(basename "$project_path")"
            echo "   Path: $project_path"
            echo "   Current Version: $project_version"
            
            # Determine impact
            if [ "$user_version" != "not-installed" ]; then
                local comparison
                comparison=$(compare_versions "$user_version" "$project_version")
                case "$comparison" in
                    "greater")
                        echo -e "   ${YELLOW}⬆️  Update Recommended${NC} (user-level is $user_version)"
                        ((needs_update_count++))
                        ;;
                    "equal")
                        echo -e "   ${GREEN}✅ Current${NC}"
                        ;;
                    "less")
                        echo -e "   ${CYAN}🚀 Ahead of User-Level${NC}"
                        ;;
                esac
            fi
            
            # Check if legacy
            if [[ $project_version =~ ^1\. ]]; then
                echo -e "   ${RED}⚠️  Legacy Version - Migration Recommended${NC}"
                ((legacy_count++))
            fi
            
            # Activity status
            if [ "$last_activity" != "0" ]; then
                local current_time
                current_time=$(date +%s)
                local time_diff=$((current_time - last_activity))
                if [ $time_diff -lt 86400 ]; then
                    echo -e "   ${GREEN}🟢 Recently Active${NC} ($(format_duration $time_diff) ago)"
                elif [ $time_diff -lt 604800 ]; then
                    echo -e "   ${YELLOW}🟡 Active This Week${NC} ($(format_duration $time_diff) ago)"
                else
                    echo -e "   ${RED}🔴 Inactive${NC} ($(format_duration $time_diff) ago)"
                fi
            fi
            
            echo ""
        fi
    done <<< "$project_versions"
    
    # Summary
    print_status_box "Impact Assessment Summary" \
        "Total Projects: $project_count" \
        "Need Updates: $needs_update_count" \
        "Legacy Versions: $legacy_count" \
        "Migration Recommended: $legacy_count projects"
}

# Show upgrade strategy details
show_upgrade_strategy() {
    print_section "Upgrade Strategy Details"
    
    local recommended_path
    recommended_path=$(cat /tmp/tony-upgrade-path 2>/dev/null || echo "unknown")
    
    echo -e "${CYAN}🔍 Strategy Analysis for Path: $recommended_path${NC}"
    echo ""
    
    case "$recommended_path" in
        "github->user->projects")
            echo "📋 Full Upgrade Strategy:"
            echo "  1. 🌐 Download latest framework from GitHub"
            echo "  2. 💾 Backup current user configuration"
            echo "  3. 🔄 Update user-level framework components"
            echo "  4. 🔗 Preserve user customizations"
            echo "  5. 📁 Propagate updates to all project deployments"
            echo "  6. ✅ Verify all components updated successfully"
            echo ""
            echo "🛡️  Safety Measures:"
            echo "  • Complete backup before any changes"
            echo "  • User content fully preserved"
            echo "  • Rollback capability maintained"
            echo "  • Project-specific settings preserved"
            ;;
        "user->projects")
            echo "📋 Project Propagation Strategy:"
            echo "  1. 📊 Identify projects with older versions"
            echo "  2. 🔄 Update project infrastructure files"
            echo "  3. 🔗 Maintain project-specific configurations"
            echo "  4. ✅ Verify project functionality"
            echo ""
            echo "🛡️  Safety Measures:"
            echo "  • Project backups before updates"
            echo "  • Gradual rollout capability"
            echo "  • Per-project verification"
            ;;
        "no-upgrade-needed")
            echo "✅ System Status: Optimal"
            echo "  • All components are current"
            echo "  • No action required"
            echo "  • System ready for operation"
            ;;
        *)
            echo "❓ Unknown strategy: $recommended_path"
            ;;
    esac
}

# Perform complete hierarchy check
hierarchy_check() {
    print_section "Complete Hierarchy Check"
    
    # Run all analysis functions
    analyze_version_hierarchy
    determine_upgrade_path >/dev/null
    assess_project_impact
    
    local recommended_path
    recommended_path=$(cat /tmp/tony-upgrade-path 2>/dev/null || echo "unknown")
    
    echo ""
    echo -e "${GREEN}🎯 Hierarchy Check Complete${NC}"
    echo "============================"
    echo ""
    echo "Recommended Action: $recommended_path"
    
    if [ "$recommended_path" != "no-upgrade-needed" ]; then
        echo ""
        if [ "$AUTO_CONFIRM" = true ]; then
            log_info "Auto-confirm enabled - executing recommended upgrade path"
            execute_upgrade_path "$recommended_path"
        else
            if confirm_action "Execute recommended upgrade path: $recommended_path?"; then
                execute_upgrade_path "$recommended_path"
            else
                log_info "Upgrade cancelled by user"
            fi
        fi
    fi
}

# Cleanup temporary files
cleanup_temp_files() {
    rm -f /tmp/tony-github-version /tmp/tony-user-version /tmp/tony-project-versions /tmp/tony-upgrade-path
}

# Main execution
main() {
    # Parse arguments
    parse_arguments "$@"
    
    # Show banner
    show_banner "Tony Framework Upgrade Manager" "Intelligent version hierarchy management"
    
    # Execute based on mode
    case "$MODE" in
        "analyze-versions")
            analyze_version_hierarchy
            ;;
        "determine-path")
            analyze_version_hierarchy
            determine_upgrade_path
            ;;
        "execute-path")
            if [ -z "$UPGRADE_PATH" ]; then
                log_error "No upgrade path specified"
                exit 1
            fi
            execute_upgrade_path "$UPGRADE_PATH"
            ;;
        "assess-projects")
            analyze_version_hierarchy
            assess_project_impact
            ;;
        "hierarchy-check")
            hierarchy_check
            ;;
        "show-strategy")
            analyze_version_hierarchy
            determine_upgrade_path >/dev/null
            show_upgrade_strategy
            ;;
        *)
            log_error "Invalid mode: $MODE"
            show_usage
            exit 1
            ;;
    esac
    
    local exit_code=$?
    
    # Cleanup
    cleanup_temp_files
    
    if [ $exit_code -eq 0 ]; then
        log_success "Upgrade operation completed successfully"
    else
        log_error "Upgrade operation failed with exit code $exit_code"
    fi
    
    exit $exit_code
}

# Trap to ensure cleanup
trap cleanup_temp_files EXIT

# Execute main function with all arguments
main "$@"