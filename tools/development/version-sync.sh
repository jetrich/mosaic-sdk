#!/bin/bash
# Tony SDK - Cross-Repository Version Coordination
# Manages versions, compatibility, and synchronization across all repositories

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

# Version tracking
declare -A VERSIONS
declare -A VERSION_FILES
declare -A GIT_COMMITS
declare -A GIT_BRANCHES

# Banner
show_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║            Tony Framework Version Coordination              ║
║             Cross-Repository Synchronization                ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Get version from various source types
get_version() {
    local repo_name="$1"
    local repo_path="$2"
    
    if [ ! -d "$repo_path" ]; then
        VERSIONS["$repo_name"]="NOT_FOUND"
        VERSION_FILES["$repo_name"]="Directory not found"
        return 1
    fi
    
    cd "$repo_path"
    
    # Check for VERSION file
    if [ -f "VERSION" ]; then
        local version=$(cat VERSION | tr -d '\n\r')
        VERSIONS["$repo_name"]="$version"
        VERSION_FILES["$repo_name"]="VERSION file"
        log_debug "$repo_name version from VERSION: $version"
    # Check for package.json
    elif [ -f "package.json" ]; then
        if command -v node > /dev/null 2>&1; then
            local version=$(node -p "require('./package.json').version" 2>/dev/null || echo "PARSE_ERROR")
            VERSIONS["$repo_name"]="$version"
            VERSION_FILES["$repo_name"]="package.json"
            log_debug "$repo_name version from package.json: $version"
        else
            # Fallback to grep/sed parsing
            local version=$(grep '"version"' package.json | sed 's/.*"version": *"\([^"]*\)".*/\1/' 2>/dev/null || echo "PARSE_ERROR")
            VERSIONS["$repo_name"]="$version"
            VERSION_FILES["$repo_name"]="package.json (fallback)"
            log_debug "$repo_name version from package.json (fallback): $version"
        fi
    # Check for Cargo.toml (Rust projects)
    elif [ -f "Cargo.toml" ]; then
        local version=$(grep '^version = ' Cargo.toml | sed 's/version = "\([^"]*\)"/\1/' 2>/dev/null || echo "PARSE_ERROR")
        VERSIONS["$repo_name"]="$version"
        VERSION_FILES["$repo_name"]="Cargo.toml"
        log_debug "$repo_name version from Cargo.toml: $version"
    # Check for setup.py (Python projects)
    elif [ -f "setup.py" ]; then
        local version=$(grep -o "version=['\"][^'\"]*['\"]" setup.py | sed "s/version=['\"]//;s/['\"]$//" 2>/dev/null || echo "PARSE_ERROR")
        VERSIONS["$repo_name"]="$version"
        VERSION_FILES["$repo_name"]="setup.py"
        log_debug "$repo_name version from setup.py: $version"
    else
        VERSIONS["$repo_name"]="NO_VERSION"
        VERSION_FILES["$repo_name"]="No version file found"
        log_debug "$repo_name: No version information found"
    fi
    
    # Get git information
    if [ -d ".git" ]; then
        GIT_COMMITS["$repo_name"]=$(git rev-parse HEAD 2>/dev/null || echo "NO_GIT")
        GIT_BRANCHES["$repo_name"]=$(git branch --show-current 2>/dev/null || echo "NO_BRANCH")
    else
        GIT_COMMITS["$repo_name"]="NO_GIT"
        GIT_BRANCHES["$repo_name"]="NO_GIT"
    fi
    
    cd - > /dev/null
}

# Display version information in a formatted table
show_version_table() {
    echo
    echo -e "${CYAN}📊 Version Information${NC}"
    echo "======================"
    echo
    
    # Calculate column widths
    local max_repo_width=15
    local max_version_width=20
    local max_source_width=25
    local max_branch_width=25
    
    # Header
    printf "%-${max_repo_width}s | %-${max_version_width}s | %-${max_source_width}s | %-${max_branch_width}s\n" \
           "Repository" "Version" "Source" "Git Branch"
    printf "%s+%s+%s+%s\n" \
           "$(printf '%*s' $max_repo_width '' | tr ' ' '-')" \
           "$(printf '%*s' $((max_version_width + 2)) '' | tr ' ' '-')" \
           "$(printf '%*s' $((max_source_width + 2)) '' | tr ' ' '-')" \
           "$(printf '%*s' $((max_branch_width + 2)) '' | tr ' ' '-')"
    
    # Data rows
    for repo in "Tony Framework" "Tony-MCP" "Tony-Dev"; do
        local version="${VERSIONS[$repo]:-UNKNOWN}"
        local source="${VERSION_FILES[$repo]:-UNKNOWN}"
        local branch="${GIT_BRANCHES[$repo]:-UNKNOWN}"
        
        # Color code based on version status
        local version_color=""
        case "$version" in
            *"beta"*|*"alpha"*|*"dev"*|*"0.0."*)
                version_color="${YELLOW}"
                ;;
            "NOT_FOUND"|"NO_VERSION"|"PARSE_ERROR")
                version_color="${RED}"
                ;;
            *)
                version_color="${GREEN}"
                ;;
        esac
        
        printf "%-${max_repo_width}s | ${version_color}%-${max_version_width}s${NC} | %-${max_source_width}s | %-${max_branch_width}s\n" \
               "$repo" "$version" "$source" "$branch"
    done
    echo
}

# Analyze version compatibility
analyze_compatibility() {
    echo -e "${CYAN}🔍 Compatibility Analysis${NC}"
    echo "========================="
    echo
    
    local tony_version="${VERSIONS['Tony Framework']}"
    local mcp_version="${VERSIONS['Tony-MCP']}"
    local dev_version="${VERSIONS['Tony-Dev']}"
    
    # Tony Framework analysis
    if [[ "$tony_version" =~ v?2\.[0-9]+\.[0-9]+(-dev)? ]]; then
        log_success "Tony Framework: v2.x series (current architecture)"
    elif [[ "$tony_version" =~ v?1\.[0-9]+\.[0-9]+ ]]; then
        log_warning "Tony Framework: v1.x series (legacy - consider upgrading)"
    else
        log_error "Tony Framework: Unrecognized version format: $tony_version"
    fi
    
    # Tony-MCP analysis
    if [[ "$mcp_version" =~ 0\.0\.[0-9]+ ]]; then
        log_info "Tony-MCP: Beta development version (v$mcp_version)"
    elif [[ "$mcp_version" =~ 1\.[0-9]+\.[0-9]+ ]]; then
        log_success "Tony-MCP: Stable release (v$mcp_version)"
    else
        log_warning "Tony-MCP: Unknown version format: $mcp_version"
    fi
    
    # Tony-Dev analysis
    if [[ "$dev_version" != "NO_VERSION" && "$dev_version" != "NOT_FOUND" ]]; then
        log_success "Tony-Dev: Development tools available (v$dev_version)"
    else
        log_info "Tony-Dev: No explicit version (development repository)"
    fi
    
    echo
    
    # Cross-compatibility checks
    echo -e "${CYAN}🔗 Cross-Repository Compatibility${NC}"
    echo "=================================="
    echo
    
    # Check if all repos are present
    local missing_repos=0
    for repo in "Tony Framework" "Tony-MCP" "Tony-Dev"; do
        if [ "${VERSIONS[$repo]}" = "NOT_FOUND" ]; then
            log_error "$repo: Repository not found"
            ((missing_repos++))
        fi
    done
    
    if [ $missing_repos -eq 0 ]; then
        log_success "All repositories are present"
    else
        log_error "$missing_repos repositories are missing"
    fi
    
    # Check for version mismatches that might cause issues
    if [[ "$tony_version" =~ v?2\.7\.[0-9]+(-dev)? ]] && [[ "$mcp_version" =~ 0\.0\.[0-9]+ ]]; then
        log_success "Compatible: Tony v2.7.x + MCP v0.0.x (designed for integration)"
    elif [[ "$tony_version" =~ v?2\.[0-6]\.[0-9]+ ]] && [[ "$mcp_version" =~ 0\.0\.[0-9]+ ]]; then
        log_warning "Potential compatibility issue: Tony v2.0-2.6 with MCP v0.0.x"
        echo "  💡 Consider upgrading Tony Framework to v2.7.x for full MCP support"
    fi
    
    echo
}

# Generate version report
generate_report() {
    local report_file="tools/VERSION-REPORT-$(date +%Y%m%d-%H%M).md"
    
    log_info "Generating version report: $report_file"
    
    cat > "$report_file" << EOF
# Tony Framework Version Report

Generated: $(date -u '+%Y-%m-%d %H:%M:%S UTC')

## Repository Versions

| Repository | Version | Source | Git Branch | Git Commit |
|------------|---------|--------|------------|------------|
EOF
    
    for repo in "Tony Framework" "Tony-MCP" "Tony-Dev"; do
        local version="${VERSIONS[$repo]:-UNKNOWN}"
        local source="${VERSION_FILES[$repo]:-UNKNOWN}"
        local branch="${GIT_BRANCHES[$repo]:-UNKNOWN}"
        local commit="${GIT_COMMITS[$repo]:-UNKNOWN}"
        
        # Truncate commit hash
        if [ "$commit" != "NO_GIT" ] && [ "$commit" != "UNKNOWN" ]; then
            commit="${commit:0:8}"
        fi
        
        echo "| $repo | $version | $source | $branch | $commit |" >> "$report_file"
    done
    
    cat >> "$report_file" << EOF

## Compatibility Analysis

### Tony Framework
EOF
    
    local tony_version="${VERSIONS['Tony Framework']}"
    if [[ "$tony_version" =~ v?2\.[0-9]+\.[0-9]+(-dev)? ]]; then
        echo "- ✅ Current v2.x architecture" >> "$report_file"
    else
        echo "- ⚠️ Version: $tony_version" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF

### Tony-MCP
EOF
    
    local mcp_version="${VERSIONS['Tony-MCP']}"
    if [[ "$mcp_version" =~ 0\.0\.[0-9]+ ]]; then
        echo "- 🔄 Beta development (v$mcp_version)" >> "$report_file"
    else
        echo "- 📊 Version: $mcp_version" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF

### Tony-Dev
- 🛠️ Development tools and testing framework
- 📁 Repository: $([ "${VERSIONS['Tony-Dev']}" != "NOT_FOUND" ] && echo "Available" || echo "Missing")

## Development Status

### Current Sprint Focus
- Tony Framework: Multi-Phase Planning Architecture (v2.7.0-dev)
- Tony-MCP: Beta coordination server development
- Tony-Dev: Testing and development infrastructure

### Next Steps
1. Complete Tony-MCP beta implementation
2. Integration testing across all repositories
3. Prepare for Tony Framework v2.7.0 stable release
4. Coordinate version alignment for v1.0.0 ecosystem release

---
*Generated by Tony SDK Version Coordination System*
EOF
    
    log_success "Version report saved: $report_file"
}

# Synchronize versions with milestone awareness
synchronize_versions() {
    echo -e "${CYAN}🔄 Version Synchronization${NC}"
    echo "=========================="
    echo
    
    log_info "Version synchronization analysis:"
    echo
    
    # Check for sync recommendations
    local tony_version="${VERSIONS['Tony Framework']}"
    local mcp_version="${VERSIONS['Tony-MCP']}"
    
    # Milestone-aware version analysis
    if [[ "$tony_version" =~ v?2\.7\.[0-9]+(-dev)? ]]; then
        log_success "Tony Framework: 2.7.x series (current milestone track)"
        
        if [[ "$mcp_version" =~ 0\.0\.[0-9]+ ]]; then
            log_success "Tony-MCP: Beta development aligned with 2.7.x milestones"
        else
            log_warning "MCP version should be 0.0.x for Tony v2.7.x development"
        fi
        
        # Suggest milestone alignment
        if [[ "$tony_version" == "2.7.0-dev" ]]; then
            log_info "Milestone suggestion: Ready for 2.7.0 stable release"
        elif [[ "$tony_version" =~ 2\.7\.[1-3] ]]; then
            log_info "Milestone track: 2.7.x incremental releases (MCP integration)"
        fi
    fi
    
    echo
    log_info "Milestone-coordinated synchronization:"
    echo "  • 2.7.0: Core framework (Multi-Phase Planning Architecture)"
    echo "  • 2.7.1: MCP Server Infrastructure"
    echo "  • 2.7.2: Hook Integration & Activity Logging"
    echo "  • 2.7.3: SDK Integration & Testing"
    echo
    echo "Available actions:"
    echo "  • ./tools/milestone-coordinator.sh roadmap - View 2.7.x roadmap"
    echo "  • ./tools/release-coordinator.sh plan - Generate milestone-aware release plan"
    echo "  • Manual version updates aligned with milestone completion"
    echo
    log_info "Use './tools/milestone-coordinator.sh details 2.7.1' for current milestone status"
}

# Main execution
main() {
    local action="${1:-status}"
    
    show_banner
    
    log_info "Analyzing Tony Framework SDK versions..."
    echo
    
    # Collect version information
    get_version "Tony Framework" "framework-source/tony"
    get_version "Tony-MCP" "framework-source/tony-mcp"
    get_version "Tony-Dev" "framework-source/tony-dev"
    
    case "$action" in
        "status"|"")
            show_version_table
            analyze_compatibility
            ;;
        "report")
            show_version_table
            analyze_compatibility
            generate_report
            ;;
        "sync")
            show_version_table
            synchronize_versions
            ;;
        "help")
            echo "Usage: $0 [status|report|sync|help]"
            echo
            echo "Commands:"
            echo "  status  - Show version information and compatibility (default)"
            echo "  report  - Generate detailed version report file"
            echo "  sync    - Analyze and recommend version synchronization"
            echo "  help    - Show this help message"
            echo
            ;;
        *)
            log_error "Unknown action: $action"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
    
    echo
    log_success "Version coordination analysis complete"
    echo
    echo -e "${CYAN}💡 Quick Actions:${NC}"
    echo "  • './tools/version-sync.sh report' - Generate detailed report"
    echo "  • './tools/build-all.sh' - Build all components with current versions"
    echo "  • './testing/run-all-tests.sh' - Test version compatibility"
}

# Execute main function
main "$@"