#!/bin/bash

# Tony Framework - Status Script
# Quick status reporting with zero API usage

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
MODE="quick"
INCLUDE_PROJECTS=false
INCLUDE_LOGS=false
VERBOSE=false
OUTPUT_FORMAT="console"

# Display usage information
show_usage() {
    show_banner "Tony Framework Status Script" "Instant status reporting with zero API usage"
    
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --quick               Quick status check (default)"
    echo "  --detailed            Detailed status with all information"
    echo "  --user-level          User-level framework status only"
    echo "  --include-projects    Include project deployment status"
    echo "  --include-logs        Include recent log entries"
    echo "  --check-github        Check GitHub for updates (uses API)"
    echo "  --format=FORMAT       Output format (console, json, yaml)"
    echo "  --verbose             Enable verbose output"
    echo "  --help                Show this help message"
    echo ""
    echo "Output Formats:"
    echo "  console               Formatted console output (default)"
    echo "  json                  JSON format for automation"
    echo "  yaml                  YAML format for configuration"
    echo ""
    echo "Examples:"
    echo "  $0 --quick                          # Fast status check"
    echo "  $0 --detailed --include-projects    # Complete status"
    echo "  $0 --format=json --user-level       # JSON output for scripts"
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --quick)
                MODE="quick"
                ;;
            --detailed)
                MODE="detailed"
                INCLUDE_PROJECTS=true
                INCLUDE_LOGS=true
                ;;
            --user-level)
                MODE="user-level"
                ;;
            --include-projects)
                INCLUDE_PROJECTS=true
                ;;
            --include-logs)
                INCLUDE_LOGS=true
                ;;
            --check-github)
                MODE="check-github"
                ;;
            --format=*)
                OUTPUT_FORMAT="${1#*=}"
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

# Get framework installation status
get_framework_status() {
    local status="unknown"
    local version="unknown"
    local architecture="unknown"
    local install_date="unknown"
    
    if [ -d "$TONY_USER_DIR" ]; then
        status="installed"
        
        # Get version information
        if [ -f "$TONY_USER_DIR/metadata/VERSION" ]; then
            version=$(grep "Framework-Version:" "$TONY_USER_DIR/metadata/VERSION" | cut -d' ' -f2 2>/dev/null || echo "unknown")
            architecture=$(grep "Architecture:" "$TONY_USER_DIR/metadata/VERSION" | cut -d' ' -f2 2>/dev/null || echo "unknown")
            install_date=$(grep "Installation-Date:" "$TONY_USER_DIR/metadata/VERSION" | cut -d' ' -f2- 2>/dev/null || echo "unknown")
        fi
        
        # Check component health
        local components=("TONY-CORE.md" "TONY-TRIGGERS.md" "TONY-SETUP.md" "AGENT-BEST-PRACTICES.md" "DEVELOPMENT-GUIDELINES.md")
        local healthy_count=0
        
        for component in "${components[@]}"; do
            if [ -f "$TONY_USER_DIR/$component" ] && [ -s "$TONY_USER_DIR/$component" ]; then
                ((healthy_count++))
            fi
        done
        
        if [ $healthy_count -eq ${#components[@]} ]; then
            status="healthy"
        elif [ $healthy_count -gt 0 ]; then
            status="partial"
        else
            status="broken"
        fi
    else
        status="not-installed"
    fi
    
    # Return as structured data
    echo "status:$status"
    echo "version:$version"
    echo "architecture:$architecture"
    echo "install_date:$install_date"
    echo "components:$healthy_count/${#components[@]}"
}

# Get user integration status
get_integration_status() {
    local claude_md="$HOME/.claude/CLAUDE.md"
    local integration_status="unknown"
    local integration_version="unknown"
    
    if [ ! -f "$claude_md" ]; then
        integration_status="no-claude-md"
    elif grep -q "Tony Framework.*Integration" "$claude_md"; then
        integration_status="active"
        integration_version=$(grep "Tony Framework Version" "$claude_md" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 2>/dev/null || echo "unknown")
    else
        integration_status="not-integrated"
    fi
    
    echo "integration_status:$integration_status"
    echo "integration_version:$integration_version"
}

# Get project deployment status
get_project_status() {
    local project_versions
    project_versions=$(get_project_versions)
    
    local project_count=0
    local active_count=0
    local legacy_count=0
    local recent_activity=""
    
    if [ -n "$project_versions" ]; then
        while IFS= read -r line; do
            if [ -n "$line" ]; then
                local project_path project_version last_activity
                IFS=':' read -r project_path project_version last_activity <<< "$line"
                
                ((project_count++))
                
                # Check if recently active (within 24 hours)
                if [ "$last_activity" != "0" ]; then
                    local current_time
                    current_time=$(date +%s)
                    local time_diff=$((current_time - last_activity))
                    
                    if [ $time_diff -lt 86400 ]; then
                        ((active_count++))
                        if [ -z "$recent_activity" ]; then
                            recent_activity="$(basename "$project_path")"
                        fi
                    fi
                fi
                
                # Check if legacy version
                if [[ $project_version =~ ^1\. ]]; then
                    ((legacy_count++))
                fi
            fi
        done <<< "$project_versions"
    fi
    
    echo "project_count:$project_count"
    echo "active_count:$active_count"
    echo "legacy_count:$legacy_count"
    echo "recent_activity:$recent_activity"
}

# Get GitHub status (optional - uses API)
get_github_status() {
    local github_available="unknown"
    local latest_version="unknown"
    local connectivity="unknown"
    
    if check_github_connectivity >/dev/null 2>&1; then
        connectivity="ok"
        github_available="true"
        
        latest_version=$(get_github_latest_release 2>/dev/null || echo "unknown")
        if [ "$latest_version" = "unknown" ]; then
            latest_version=$(get_github_latest_tag_fallback 2>/dev/null || echo "unknown")
        fi
    else
        connectivity="failed"
        github_available="false"
    fi
    
    echo "github_available:$github_available"
    echo "latest_version:$latest_version"
    echo "connectivity:$connectivity"
}

# Get system resource status
get_system_status() {
    local disk_usage log_size
    
    # Check disk usage for Tony directory
    if [ -d "$TONY_USER_DIR" ]; then
        disk_usage=$(du -sh "$TONY_USER_DIR" 2>/dev/null | cut -f1 || echo "unknown")
    else
        disk_usage="0B"
    fi
    
    # Check log file size
    if [ -f "$TONY_USER_DIR/logs/tony-commands.log" ]; then
        log_size=$(stat -c%s "$TONY_USER_DIR/logs/tony-commands.log" 2>/dev/null || echo "0")
        log_size=$(format_size $log_size)
    else
        log_size="0B"
    fi
    
    echo "disk_usage:$disk_usage"
    echo "log_size:$log_size"
}

# Get recent log entries
get_recent_logs() {
    local log_file="$TONY_USER_DIR/logs/tony-commands.log"
    local line_count="${1:-10}"
    
    if [ -f "$log_file" ]; then
        tail -n "$line_count" "$log_file" 2>/dev/null || echo "No recent log entries"
    else
        echo "No log file found"
    fi
}

# Format output for console
format_console_output() {
    local framework_data integration_data project_data github_data system_data
    
    # Parse input data
    while IFS= read -r line; do
        if [[ $line == framework:* ]]; then
            framework_data="${line#framework:}"
        elif [[ $line == integration:* ]]; then
            integration_data="${line#integration:}"
        elif [[ $line == projects:* ]]; then
            project_data="${line#projects:}"
        elif [[ $line == github:* ]]; then
            github_data="${line#github:}"
        elif [[ $line == system:* ]]; then
            system_data="${line#system:}"
        fi
    done
    
    show_banner "Tony Framework Status" "Real-time system status"
    
    # Framework Status
    print_subsection "Framework Installation"
    
    local status version architecture install_date components
    IFS='|' read -r status version architecture install_date components <<< "$framework_data"
    
    case "$status" in
        "healthy")
            echo -e "  ${GREEN}✅ Status: Healthy${NC}"
            ;;
        "partial")
            echo -e "  ${YELLOW}⚠️  Status: Partial Installation${NC}"
            ;;
        "broken")
            echo -e "  ${RED}❌ Status: Broken${NC}"
            ;;
        "not-installed")
            echo -e "  ${RED}❌ Status: Not Installed${NC}"
            ;;
        *)
            echo -e "  ${YELLOW}❓ Status: Unknown${NC}"
            ;;
    esac
    
    if [ "$status" != "not-installed" ]; then
        echo "  📦 Version: $version"
        echo "  🏗️  Architecture: $architecture"
        echo "  📅 Installed: $install_date"
        echo "  🧩 Components: $components"
    fi
    
    # Integration Status
    if [ -n "$integration_data" ]; then
        print_subsection "User Integration"
        
        local int_status int_version
        IFS='|' read -r int_status int_version <<< "$integration_data"
        
        case "$int_status" in
            "active")
                echo -e "  ${GREEN}✅ CLAUDE.md Integration: Active${NC}"
                echo "  🔗 Integration Version: $int_version"
                ;;
            "not-integrated")
                echo -e "  ${YELLOW}⚠️  CLAUDE.md Integration: Not Active${NC}"
                ;;
            "no-claude-md")
                echo -e "  ${RED}❌ CLAUDE.md Integration: No CLAUDE.md File${NC}"
                ;;
        esac
    fi
    
    # Project Status
    if [ "$INCLUDE_PROJECTS" = true ] && [ -n "$project_data" ]; then
        print_subsection "Project Deployments"
        
        local proj_count active_count legacy_count recent_activity
        IFS='|' read -r proj_count active_count legacy_count recent_activity <<< "$project_data"
        
        echo "  📁 Total Projects: $proj_count"
        if [ "$proj_count" != "0" ]; then
            echo "  🟢 Recently Active: $active_count"
            echo "  🔴 Legacy Versions: $legacy_count"
            if [ -n "$recent_activity" ]; then
                echo "  ⏰ Most Recent: $recent_activity"
            fi
        fi
    fi
    
    # GitHub Status
    if [ "$MODE" = "check-github" ] && [ -n "$github_data" ]; then
        print_subsection "GitHub Repository"
        
        local gh_available latest_version connectivity
        IFS='|' read -r gh_available latest_version connectivity <<< "$github_data"
        
        case "$connectivity" in
            "ok")
                echo -e "  ${GREEN}✅ Connectivity: OK${NC}"
                echo "  🌐 Latest Version: $latest_version"
                
                # Compare with installed version
                local installed_version
                IFS='|' read -r _ installed_version _ _ _ <<< "$framework_data"
                
                if [ "$installed_version" != "unknown" ] && [ "$latest_version" != "unknown" ]; then
                    local comparison
                    comparison=$(compare_versions "$latest_version" "$installed_version")
                    case "$comparison" in
                        "greater")
                            echo -e "  ${YELLOW}⬆️  Update Available${NC}"
                            ;;
                        "equal")
                            echo -e "  ${GREEN}✅ Up to Date${NC}"
                            ;;
                        "less")
                            echo -e "  ${CYAN}🚀 Ahead of GitHub${NC}"
                            ;;
                    esac
                fi
                ;;
            "failed")
                echo -e "  ${RED}❌ Connectivity: Failed${NC}"
                ;;
        esac
    fi
    
    # System Status
    if [ "$MODE" = "detailed" ] && [ -n "$system_data" ]; then
        print_subsection "System Resources"
        
        local disk_usage log_size
        IFS='|' read -r disk_usage log_size <<< "$system_data"
        
        echo "  💾 Disk Usage: $disk_usage"
        echo "  📝 Log Size: $log_size"
    fi
    
    # Quick Actions
    echo ""
    echo -e "${CYAN}⚡ Quick Actions:${NC}"
    if [ "$status" = "not-installed" ]; then
        echo "  • Install Tony: /tony install"
    elif [ "$status" = "healthy" ]; then
        echo "  • Check for updates: /tony upgrade"
        echo "  • Verify installation: /tony verify"
        echo "  • Deploy to project: Say 'Hey Tony' in project directory"
    else
        echo "  • Repair installation: /tony install --mode=update"
        echo "  • Verify components: /tony verify"
    fi
    
    # Recent Logs
    if [ "$INCLUDE_LOGS" = true ]; then
        print_subsection "Recent Activity"
        get_recent_logs 5 | sed 's/^/  /'
    fi
}

# Format output as JSON
format_json_output() {
    local framework_data integration_data project_data github_data system_data
    
    # Parse input data
    while IFS= read -r line; do
        if [[ $line == framework:* ]]; then
            framework_data="${line#framework:}"
        elif [[ $line == integration:* ]]; then
            integration_data="${line#integration:}"
        elif [[ $line == projects:* ]]; then
            project_data="${line#projects:}"
        elif [[ $line == github:* ]]; then
            github_data="${line#github:}"
        elif [[ $line == system:* ]]; then
            system_data="${line#system:}"
        fi
    done
    
    echo "{"
    echo "  \"tony_framework\": {"
    
    # Framework data
    if [ -n "$framework_data" ]; then
        local status version architecture install_date components
        IFS='|' read -r status version architecture install_date components <<< "$framework_data"
        
        echo "    \"status\": \"$status\","
        echo "    \"version\": \"$version\","
        echo "    \"architecture\": \"$architecture\","
        echo "    \"install_date\": \"$install_date\","
        echo "    \"components\": \"$components\""
    fi
    
    # Integration data
    if [ -n "$integration_data" ]; then
        local int_status int_version
        IFS='|' read -r int_status int_version <<< "$integration_data"
        
        echo "    ,\"integration\": {"
        echo "      \"status\": \"$int_status\","
        echo "      \"version\": \"$int_version\""
        echo "    }"
    fi
    
    # Project data
    if [ "$INCLUDE_PROJECTS" = true ] && [ -n "$project_data" ]; then
        local proj_count active_count legacy_count recent_activity
        IFS='|' read -r proj_count active_count legacy_count recent_activity <<< "$project_data"
        
        echo "    ,\"projects\": {"
        echo "      \"total\": $proj_count,"
        echo "      \"active\": $active_count,"
        echo "      \"legacy\": $legacy_count,"
        echo "      \"recent_activity\": \"$recent_activity\""
        echo "    }"
    fi
    
    # GitHub data
    if [ "$MODE" = "check-github" ] && [ -n "$github_data" ]; then
        local gh_available latest_version connectivity
        IFS='|' read -r gh_available latest_version connectivity <<< "$github_data"
        
        echo "    ,\"github\": {"
        echo "      \"available\": $gh_available,"
        echo "      \"latest_version\": \"$latest_version\","
        echo "      \"connectivity\": \"$connectivity\""
        echo "    }"
    fi
    
    # System data
    if [ "$MODE" = "detailed" ] && [ -n "$system_data" ]; then
        local disk_usage log_size
        IFS='|' read -r disk_usage log_size <<< "$system_data"
        
        echo "    ,\"system\": {"
        echo "      \"disk_usage\": \"$disk_usage\","
        echo "      \"log_size\": \"$log_size\""
        echo "    }"
    fi
    
    echo "  },"
    echo "  \"timestamp\": \"$(date -u '+%Y-%m-%d %H:%M:%S UTC')\""
    echo "}"
}

# Collect and format status data
collect_status_data() {
    # Collect framework status
    local framework_info
    framework_info=$(get_framework_status)
    
    local status version architecture install_date components
    while IFS= read -r line; do
        case "$line" in
            status:*) status="${line#status:}" ;;
            version:*) version="${line#version:}" ;;
            architecture:*) architecture="${line#architecture:}" ;;
            install_date:*) install_date="${line#install_date:}" ;;
            components:*) components="${line#components:}" ;;
        esac
    done <<< "$framework_info"
    
    echo "framework:$status|$version|$architecture|$install_date|$components"
    
    # Collect integration status
    local integration_info
    integration_info=$(get_integration_status)
    
    local int_status int_version
    while IFS= read -r line; do
        case "$line" in
            integration_status:*) int_status="${line#integration_status:}" ;;
            integration_version:*) int_version="${line#integration_version:}" ;;
        esac
    done <<< "$integration_info"
    
    echo "integration:$int_status|$int_version"
    
    # Collect project status if requested
    if [ "$INCLUDE_PROJECTS" = true ]; then
        local project_info
        project_info=$(get_project_status)
        
        local proj_count active_count legacy_count recent_activity
        while IFS= read -r line; do
            case "$line" in
                project_count:*) proj_count="${line#project_count:}" ;;
                active_count:*) active_count="${line#active_count:}" ;;
                legacy_count:*) legacy_count="${line#legacy_count:}" ;;
                recent_activity:*) recent_activity="${line#recent_activity:}" ;;
            esac
        done <<< "$project_info"
        
        echo "projects:$proj_count|$active_count|$legacy_count|$recent_activity"
    fi
    
    # Collect GitHub status if requested
    if [ "$MODE" = "check-github" ]; then
        local github_info
        github_info=$(get_github_status)
        
        local gh_available latest_version connectivity
        while IFS= read -r line; do
            case "$line" in
                github_available:*) gh_available="${line#github_available:}" ;;
                latest_version:*) latest_version="${line#latest_version:}" ;;
                connectivity:*) connectivity="${line#connectivity:}" ;;
            esac
        done <<< "$github_info"
        
        echo "github:$gh_available|$latest_version|$connectivity"
    fi
    
    # Collect system status if detailed mode
    if [ "$MODE" = "detailed" ]; then
        local system_info
        system_info=$(get_system_status)
        
        local disk_usage log_size
        while IFS= read -r line; do
            case "$line" in
                disk_usage:*) disk_usage="${line#disk_usage:}" ;;
                log_size:*) log_size="${line#log_size:}" ;;
            esac
        done <<< "$system_info"
        
        echo "system:$disk_usage|$log_size"
    fi
}

# Main execution
main() {
    # Parse arguments
    parse_arguments "$@"
    
    # Collect status data
    local status_data
    status_data=$(collect_status_data)
    
    # Format and display output
    case "$OUTPUT_FORMAT" in
        "console")
            format_console_output <<< "$status_data"
            ;;
        "json")
            format_json_output <<< "$status_data"
            ;;
        "yaml")
            # YAML format could be implemented here
            log_error "YAML output format not yet implemented"
            exit 1
            ;;
        *)
            log_error "Unknown output format: $OUTPUT_FORMAT"
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"