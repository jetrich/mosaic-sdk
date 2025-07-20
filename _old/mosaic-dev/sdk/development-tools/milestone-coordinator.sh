#!/bin/bash
# Tony SDK - GitHub Milestone Coordination System
# Manages milestone planning, tracking, and coordination across repositories

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Utility functions
log_info() { echo -e "${BLUE}ℹ️${NC}  $1"; }
log_success() { echo -e "${GREEN}✅${NC}  $1"; }
log_warning() { echo -e "${YELLOW}⚠️${NC}  $1"; }
log_error() { echo -e "${RED}❌${NC}  $1"; }
log_debug() { echo -e "${MAGENTA}🔍${NC}  $1"; }

# Repository configuration
declare -A REPOS=(
    ["tony"]="jetrich/tony"
    ["tony-mcp"]="jetrich/tony-mcp"
    ["tony-dev"]="jetrich/tony-dev"
)

# Banner
show_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║           Tony Framework Milestone Coordinator              ║
║         GitHub Milestone Planning & Tracking                ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Get milestone information from GitHub
get_milestones() {
    local repo="$1"
    local full_repo="${REPOS[$repo]}"
    
    log_debug "Fetching milestones for $full_repo..."
    
    # Get milestones with issue counts
    gh api "repos/$full_repo/milestones" \
        --jq '.[] | {number: .number, title: .title, description: .description, state: .state, open_issues: .open_issues, closed_issues: .closed_issues, due_on: .due_on, html_url: .html_url}' \
        2>/dev/null || echo "[]"
}

# Get issues for a specific milestone
get_milestone_issues() {
    local repo="$1"
    local milestone_number="$2"
    local full_repo="${REPOS[$repo]}"
    
    log_debug "Fetching issues for milestone $milestone_number in $full_repo..."
    
    gh api "repos/$full_repo/issues" \
        --field milestone="$milestone_number" \
        --field state="all" \
        --jq '.[] | {number: .number, title: .title, state: .state, labels: [.labels[].name], assignees: [.assignees[].login], html_url: .html_url}' \
        2>/dev/null || echo "[]"
}

# Display milestone overview
show_milestone_overview() {
    echo
    echo -e "${CYAN}📋 Milestone Overview Across All Repositories${NC}"
    echo "=============================================="
    echo
    
    local total_milestones=0
    local total_open_issues=0
    local total_closed_issues=0
    
    for repo in "${!REPOS[@]}"; do
        echo -e "${YELLOW}📁 Repository: ${REPOS[$repo]}${NC}"
        echo "$(printf '%*s' 50 '' | tr ' ' '-')"
        
        local milestones
        milestones=$(get_milestones "$repo")
        
        if [ "$milestones" = "[]" ] || [ -z "$milestones" ]; then
            echo "  No milestones found"
            echo
            continue
        fi
        
        # Parse and display milestones
        while IFS= read -r milestone_json; do
            if [ -n "$milestone_json" ] && [ "$milestone_json" != "null" ]; then
                local title=$(echo "$milestone_json" | jq -r '.title')
                local open_issues=$(echo "$milestone_json" | jq -r '.open_issues')
                local closed_issues=$(echo "$milestone_json" | jq -r '.closed_issues')
                local state=$(echo "$milestone_json" | jq -r '.state')
                local due_on=$(echo "$milestone_json" | jq -r '.due_on')
                
                # Format due date
                local due_date="No due date"
                if [ "$due_on" != "null" ] && [ -n "$due_on" ]; then
                    due_date=$(date -d "$due_on" '+%Y-%m-%d' 2>/dev/null || echo "$due_on")
                fi
                
                # Color code based on state
                local state_color="${GREEN}"
                local state_icon="🟢"
                if [ "$state" = "closed" ]; then
                    state_color="${BLUE}"
                    state_icon="🔵"
                fi
                
                printf "  %s ${state_color}%-12s${NC} | %2d open, %2d closed | Due: %s\n" \
                       "$state_icon" "$title" "$open_issues" "$closed_issues" "$due_date"
                
                ((total_milestones++))
                ((total_open_issues += open_issues))
                ((total_closed_issues += closed_issues))
            fi
        done <<< "$(echo "$milestones" | jq -c '.')"
        
        echo
    done
    
    echo -e "${CYAN}📊 Summary${NC}"
    echo "=========="
    echo "Total Milestones: $total_milestones"
    echo "Total Open Issues: $total_open_issues"
    echo "Total Closed Issues: $total_closed_issues"
    echo
}

# Show detailed milestone breakdown
show_milestone_details() {
    local target_milestone="$1"
    
    echo
    echo -e "${CYAN}🔍 Detailed View: Milestone '$target_milestone'${NC}"
    echo "$(printf '=%.0s' {1..60})"
    echo
    
    local found_milestone=false
    
    for repo in "${!REPOS[@]}"; do
        local milestones
        milestones=$(get_milestones "$repo")
        
        if [ "$milestones" = "[]" ] || [ -z "$milestones" ]; then
            continue
        fi
        
        # Check if this repo has the target milestone
        local milestone_info
        milestone_info=$(echo "$milestones" | jq -c ".[] | select(.title == \"$target_milestone\")")
        
        if [ -n "$milestone_info" ] && [ "$milestone_info" != "null" ]; then
            found_milestone=true
            
            local milestone_number=$(echo "$milestone_info" | jq -r '.number')
            local description=$(echo "$milestone_info" | jq -r '.description')
            local open_issues=$(echo "$milestone_info" | jq -r '.open_issues')
            local closed_issues=$(echo "$milestone_info" | jq -r '.closed_issues')
            local state=$(echo "$milestone_info" | jq -r '.state')
            
            echo -e "${YELLOW}📁 ${REPOS[$repo]}${NC}"
            echo "Description: $description"
            echo "Status: $state | Open: $open_issues | Closed: $closed_issues"
            echo
            
            # Get and display issues
            if [ "$open_issues" -gt 0 ] || [ "$closed_issues" -gt 0 ]; then
                echo "Issues:"
                local issues
                issues=$(get_milestone_issues "$repo" "$milestone_number")
                
                if [ "$issues" != "[]" ] && [ -n "$issues" ]; then
                    while IFS= read -r issue_json; do
                        if [ -n "$issue_json" ] && [ "$issue_json" != "null" ]; then
                            local issue_number=$(echo "$issue_json" | jq -r '.number')
                            local issue_title=$(echo "$issue_json" | jq -r '.title')
                            local issue_state=$(echo "$issue_json" | jq -r '.state')
                            local labels=$(echo "$issue_json" | jq -r '.labels[]?' | tr '\n' ' ')
                            
                            local state_icon="🟢"
                            local state_color="${GREEN}"
                            if [ "$issue_state" = "closed" ]; then
                                state_icon="✅"
                                state_color="${BLUE}"
                            fi
                            
                            printf "  %s ${state_color}#%-4d${NC} %s" "$state_icon" "$issue_number" "$issue_title"
                            if [ -n "$labels" ]; then
                                echo " 🏷️  $labels"
                            else
                                echo
                            fi
                        fi
                    done <<< "$(echo "$issues" | jq -c '.')"
                fi
            else
                echo "  No issues assigned to this milestone"
            fi
            echo
        fi
    done
    
    if [ "$found_milestone" = false ]; then
        log_warning "Milestone '$target_milestone' not found in any repository"
    fi
}

# Show milestone roadmap for 2.7.x series
show_roadmap() {
    echo
    echo -e "${CYAN}🗺️  Tony Framework 2.7.x Roadmap${NC}"
    echo "================================="
    echo
    
    # Define the 2.7.x milestone sequence
    local milestones_270=(
        "2.7.0:Multi-Phase Planning Architecture - Core framework enhancements"
        "2.7.1:MCP Server Infrastructure - Core coordination server implementation and database foundation"
        "2.7.2:Hook Integration & Activity Logging - Claude hooks implementation with MCP coordination"
        "2.7.3:SDK Integration & Testing - Three-repository coordination with comprehensive testing framework"
    )
    
    echo -e "${BLUE}📅 Release Sequence${NC}"
    echo "-------------------"
    
    for milestone_def in "${milestones_270[@]}"; do
        local milestone_name="${milestone_def%%:*}"
        local milestone_desc="${milestone_def#*:}"
        
        echo
        echo -e "${YELLOW}🎯 $milestone_name${NC}"
        echo "   $milestone_desc"
        
        # Check status across repositories
        local total_open=0
        local total_closed=0
        local repos_with_milestone=0
        
        for repo in "${!REPOS[@]}"; do
            local milestones
            milestones=$(get_milestones "$repo")
            
            if [ "$milestones" != "[]" ] && [ -n "$milestones" ]; then
                local milestone_info
                milestone_info=$(echo "$milestones" | jq -c ".[] | select(.title == \"$milestone_name\")")
                
                if [ -n "$milestone_info" ] && [ "$milestone_info" != "null" ]; then
                    local open_issues=$(echo "$milestone_info" | jq -r '.open_issues')
                    local closed_issues=$(echo "$milestone_info" | jq -r '.closed_issues')
                    
                    ((total_open += open_issues))
                    ((total_closed += closed_issues))
                    ((repos_with_milestone++))
                    
                    if [ $((open_issues + closed_issues)) -gt 0 ]; then
                        printf "   📁 %-12s: %d open, %d closed\n" "${REPOS[$repo]}" "$open_issues" "$closed_issues"
                    fi
                fi
            fi
        done
        
        # Show milestone summary
        if [ $repos_with_milestone -gt 0 ]; then
            local total_issues=$((total_open + total_closed))
            local completion=0
            if [ $total_issues -gt 0 ]; then
                completion=$((total_closed * 100 / total_issues))
            fi
            
            printf "   📊 Progress: %d%% complete (%d/%d issues)\n" "$completion" "$total_closed" "$total_issues"
            
            if [ $total_open -eq 0 ] && [ $total_closed -gt 0 ]; then
                echo "   ✅ Ready for release"
            elif [ $total_open -eq 0 ]; then
                echo "   📋 No issues assigned"
            else
                echo "   🚧 In development"
            fi
        else
            echo "   📋 No milestone found in any repository"
        fi
    done
    
    echo
    echo -e "${CYAN}🎯 Next Milestone Actions${NC}"
    echo "-------------------------"
    echo "  • Review current milestone progress with './tools/milestone-coordinator.sh details 2.7.1'"
    echo "  • Create milestone-specific issues with 'gh issue create --milestone \"2.7.1\"'"
    echo "  • Track cross-repository coordination in SDK structure"
    echo
}

# Create milestone coordination report
generate_coordination_report() {
    local report_file="tools/MILESTONE-COORDINATION-$(date +%Y%m%d-%H%M).md"
    
    log_info "Generating milestone coordination report: $report_file"
    
    cat > "$report_file" << EOF
# Tony Framework Milestone Coordination Report

Generated: $(date -u '+%Y-%m-%d %H:%M:%S UTC')

## Cross-Repository Milestone Status

EOF
    
    # Add milestone data for each repository
    for repo in "${!REPOS[@]}"; do
        echo "### ${REPOS[$repo]}" >> "$report_file"
        echo >> "$report_file"
        
        local milestones
        milestones=$(get_milestones "$repo")
        
        if [ "$milestones" = "[]" ] || [ -z "$milestones" ]; then
            echo "No milestones configured" >> "$report_file"
            echo >> "$report_file"
            continue
        fi
        
        echo "| Milestone | Status | Open Issues | Closed Issues | Due Date |" >> "$report_file"
        echo "|-----------|--------|-------------|---------------|----------|" >> "$report_file"
        
        while IFS= read -r milestone_json; do
            if [ -n "$milestone_json" ] && [ "$milestone_json" != "null" ]; then
                local title=$(echo "$milestone_json" | jq -r '.title')
                local state=$(echo "$milestone_json" | jq -r '.state')
                local open_issues=$(echo "$milestone_json" | jq -r '.open_issues')
                local closed_issues=$(echo "$milestone_json" | jq -r '.closed_issues')
                local due_on=$(echo "$milestone_json" | jq -r '.due_on')
                local html_url=$(echo "$milestone_json" | jq -r '.html_url')
                
                local due_date="None"
                if [ "$due_on" != "null" ] && [ -n "$due_on" ]; then
                    due_date=$(date -d "$due_on" '+%Y-%m-%d' 2>/dev/null || echo "$due_on")
                fi
                
                echo "| [$title]($html_url) | $state | $open_issues | $closed_issues | $due_date |" >> "$report_file"
            fi
        done <<< "$(echo "$milestones" | jq -c '.')"
        
        echo >> "$report_file"
    done
    
    cat >> "$report_file" << EOF
## 2.7.x Release Roadmap

### 2.7.0 - Multi-Phase Planning Architecture
**Status**: Core framework enhancements
- Multi-phase task decomposition
- Enhanced UPP methodology integration
- Framework architecture updates

### 2.7.1 - MCP Server Infrastructure  
**Focus**: Database and coordination foundation
- SQLite database with project isolation
- TypeScript-based MCP server implementation
- Core tool interfaces (registerProject, registerAgent, logActivity)
- Docker containerization strategy

### 2.7.2 - Hook Integration & Activity Logging
**Focus**: Claude hooks and real-time monitoring
- PreToolUse, PostToolUse, SubagentStart, SubagentStop hooks
- Activity logging pipeline to MCP server
- Project GUID management with TONY_ID.json
- Performance monitoring and optimization

### 2.7.3 - SDK Integration & Testing
**Focus**: Three-repository coordination
- Cross-repository build and test systems
- Version coordination and release management
- Comprehensive SDK-wide testing framework
- Integration validation across all components

## Coordination Strategy

### Milestone Dependencies
- **2.7.1** → **2.7.2**: MCP server must be operational before hook integration
- **2.7.2** → **2.7.3**: Activity logging must work before SDK integration testing
- **2.7.0** + **2.7.3**: Framework and SDK must align for coordinated release

### Cross-Repository Issues
- Issues span multiple repositories requiring coordination
- Use GitHub project boards for cross-repo milestone tracking
- SDK tools provide unified build/test/release coordination

### Quality Gates
- All milestones require passing tests across all repositories
- Build success validation before milestone completion
- Documentation updates coordinated across repos

---
*Generated by Tony SDK Milestone Coordinator*
EOF
    
    log_success "Coordination report saved: $report_file"
    echo
    echo -e "${CYAN}📊 Report Summary:${NC}"
    echo "  • Report file: $report_file"
    echo "  • Cross-repository milestone analysis complete"
    echo "  • Use for milestone planning and coordination meetings"
}

# Main execution
main() {
    local action="${1:-overview}"
    local target="${2:-}"
    
    show_banner
    
    # Check if gh CLI is available
    if ! command -v gh > /dev/null 2>&1; then
        log_error "GitHub CLI (gh) is required but not installed"
        exit 1
    fi
    
    case "$action" in
        "overview"|"")
            show_milestone_overview
            ;;
        "details")
            if [ -z "$target" ]; then
                log_error "Please specify a milestone name for details"
                echo "Example: $0 details 2.7.1"
                exit 1
            fi
            show_milestone_details "$target"
            ;;
        "roadmap")
            show_roadmap
            ;;
        "report")
            show_milestone_overview
            generate_coordination_report
            ;;
        "help")
            echo "Usage: $0 [overview|details|roadmap|report|help] [milestone_name]"
            echo
            echo "Commands:"
            echo "  overview        - Show milestone overview across all repositories (default)"
            echo "  details <name>  - Show detailed view of specific milestone"
            echo "  roadmap         - Show 2.7.x release roadmap and progress"
            echo "  report          - Generate detailed coordination report"
            echo "  help            - Show this help message"
            echo
            echo "Examples:"
            echo "  $0 overview                    # Show all milestones"
            echo "  $0 details 2.7.1             # Show details for 2.7.1 milestone"
            echo "  $0 roadmap                    # Show 2.7.x roadmap"
            echo "  $0 report                     # Generate coordination report"
            echo
            ;;
        *)
            log_error "Unknown action: $action"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
    
    echo
    log_success "Milestone coordination complete"
}

# Execute main function
main "$@"