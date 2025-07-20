#!/bin/bash
# Tony SDK - Release Coordination System
# Manages coordinated releases across all Tony Framework repositories

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

# Release tracking
declare -A CURRENT_VERSIONS
declare -A NEXT_VERSIONS
declare -A RELEASE_READY
declare -A RELEASE_BLOCKERS

# Banner
show_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║           Tony Framework Release Coordinator                ║
║            Cross-Repository Release Management              ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Check release readiness for a repository
check_release_readiness() {
    local repo_name="$1"
    local repo_path="$2"
    
    if [ ! -d "$repo_path" ]; then
        RELEASE_READY["$repo_name"]=false
        RELEASE_BLOCKERS["$repo_name"]="Repository not found"
        return 1
    fi
    
    cd "$repo_path"
    
    local blockers=()
    
    # Check git status
    if [ -d ".git" ]; then
        # Check for uncommitted changes
        if ! git diff-index --quiet HEAD --; then
            blockers+=("Uncommitted changes")
        fi
        
        # Check for untracked files (excluding common ignores)
        local untracked=$(git ls-files --others --exclude-standard)
        if [ -n "$untracked" ]; then
            blockers+=("Untracked files")
        fi
        
        # Check if we're on a release branch
        local current_branch=$(git branch --show-current 2>/dev/null || echo "detached")
        if [[ ! "$current_branch" =~ ^(main|master|release/.*)$ ]]; then
            blockers+=("Not on release branch (current: $current_branch)")
        fi
    else
        blockers+=("Not a git repository")
    fi
    
    # Check build status
    if [ -f "package.json" ]; then
        if ! npm run build 2>/dev/null >/dev/null; then
            blockers+=("Build failing")
        fi
        
        # Check for test script and run basic tests
        if npm run | grep -q "test"; then
            if ! npm test 2>/dev/null >/dev/null; then
                blockers+=("Tests failing")
            fi
        fi
    fi
    
    # Repository-specific checks
    case "$repo_name" in
        "Tony Framework")
            # Check for VERSION file
            if [ ! -f "VERSION" ]; then
                blockers+=("Missing VERSION file")
            fi
            
            # Check for documentation
            if [ ! -f "README.md" ]; then
                blockers+=("Missing README.md")
            fi
            ;;
        "Tony-MCP")
            # Check for proper package.json
            if [ -f "package.json" ]; then
                local version=$(node -p "require('./package.json').version" 2>/dev/null || echo "")
                if [[ "$version" =~ 0\.0\.[0-9]+ ]]; then
                    log_info "$repo_name is in beta (v$version) - beta releases allowed"
                fi
            else
                blockers+=("Missing package.json")
            fi
            
            # Check for Docker configuration
            if [ ! -f "Dockerfile" ] && [ ! -f "docker-compose.yml" ]; then
                blockers+=("Missing Docker configuration")
            fi
            ;;
        "Tony-Dev")
            # Check for testing framework
            if [ ! -d "sdk/testing-framework" ]; then
                blockers+=("Missing testing framework")
            fi
            ;;
    esac
    
    cd - > /dev/null
    
    # Set release readiness
    if [ ${#blockers[@]} -eq 0 ]; then
        RELEASE_READY["$repo_name"]=true
        RELEASE_BLOCKERS["$repo_name"]="None"
    else
        RELEASE_READY["$repo_name"]=false
        RELEASE_BLOCKERS["$repo_name"]=$(IFS=', '; echo "${blockers[*]}")
    fi
}

# Get current and suggest next versions
analyze_versions() {
    local repo_name="$1"
    local repo_path="$2"
    
    if [ ! -d "$repo_path" ]; then
        CURRENT_VERSIONS["$repo_name"]="NOT_FOUND"
        NEXT_VERSIONS["$repo_name"]="N/A"
        return 1
    fi
    
    cd "$repo_path"
    
    local current_version=""
    
    # Get current version
    if [ -f "VERSION" ]; then
        current_version=$(cat VERSION | tr -d '\n\r')
    elif [ -f "package.json" ]; then
        current_version=$(node -p "require('./package.json').version" 2>/dev/null || echo "0.0.0")
    else
        current_version="NO_VERSION"
    fi
    
    CURRENT_VERSIONS["$repo_name"]="$current_version"
    
    # Suggest next version based on current version and repo type
    local next_version=""
    case "$repo_name" in
        "Tony Framework")
            if [[ "$current_version" =~ v?2\.7\.0-dev ]]; then
                next_version="2.7.0"
            elif [[ "$current_version" =~ v?2\.([0-9]+)\.([0-9]+)(-dev)? ]]; then
                local major=2
                local minor=${BASH_REMATCH[1]}
                local patch=$((${BASH_REMATCH[2]} + 1))
                next_version="$major.$minor.$patch"
            else
                next_version="2.7.0"
            fi
            ;;
        "Tony-MCP")
            if [[ "$current_version" =~ 0\.0\.([0-9]+) ]]; then
                local patch=$((${BASH_REMATCH[1]} + 1))
                next_version="0.0.$patch-beta.1"
            else
                next_version="0.0.1-beta.1"
            fi
            ;;
        "Tony-Dev")
            if [[ "$current_version" =~ ([0-9]+)\.([0-9]+)\.([0-9]+) ]]; then
                local major=${BASH_REMATCH[1]}
                local minor=${BASH_REMATCH[2]}
                local patch=$((${BASH_REMATCH[3]} + 1))
                next_version="$major.$minor.$patch"
            else
                next_version="1.0.0"
            fi
            ;;
    esac
    
    NEXT_VERSIONS["$repo_name"]="$next_version"
    
    cd - > /dev/null
}

# Display release status table
show_release_status() {
    echo
    echo -e "${CYAN}📋 Release Status Overview${NC}"
    echo "=========================="
    echo
    
    # Calculate column widths
    local max_repo_width=15
    local max_version_width=20
    local max_next_width=20
    local max_ready_width=10
    local max_blockers_width=40
    
    # Header
    printf "%-${max_repo_width}s | %-${max_version_width}s | %-${max_next_width}s | %-${max_ready_width}s | %-${max_blockers_width}s\n" \
           "Repository" "Current Version" "Next Version" "Ready" "Blockers"
    printf "%s+%s+%s+%s+%s\n" \
           "$(printf '%*s' $max_repo_width '' | tr ' ' '-')" \
           "$(printf '%*s' $((max_version_width + 2)) '' | tr ' ' '-')" \
           "$(printf '%*s' $((max_next_width + 2)) '' | tr ' ' '-')" \
           "$(printf '%*s' $((max_ready_width + 2)) '' | tr ' ' '-')" \
           "$(printf '%*s' $((max_blockers_width + 2)) '' | tr ' ' '-')"
    
    # Data rows
    for repo in "Tony Framework" "Tony-MCP" "Tony-Dev"; do
        local current="${CURRENT_VERSIONS[$repo]:-UNKNOWN}"
        local next="${NEXT_VERSIONS[$repo]:-UNKNOWN}"
        local ready="${RELEASE_READY[$repo]:-false}"
        local blockers="${RELEASE_BLOCKERS[$repo]:-UNKNOWN}"
        
        # Truncate blockers if too long
        if [ ${#blockers} -gt $max_blockers_width ]; then
            blockers="${blockers:0:$((max_blockers_width-3))}..."
        fi
        
        # Color code readiness
        local ready_color=""
        local ready_text=""
        if [ "$ready" = "true" ]; then
            ready_color="${GREEN}"
            ready_text="✅ Yes"
        else
            ready_color="${RED}"
            ready_text="❌ No"
        fi
        
        printf "%-${max_repo_width}s | %-${max_version_width}s | %-${max_next_width}s | ${ready_color}%-${max_ready_width}s${NC} | %-${max_blockers_width}s\n" \
               "$repo" "$current" "$next" "$ready_text" "$blockers"
    done
    echo
}

# Generate release plan
generate_release_plan() {
    echo -e "${CYAN}📅 Release Plan Generation${NC}"
    echo "========================="
    echo
    
    local plan_file="tools/RELEASE-PLAN-$(date +%Y%m%d-%H%M).md"
    
    log_info "Generating release plan: $plan_file"
    
    cat > "$plan_file" << EOF
# Tony Framework Release Plan

Generated: $(date -u '+%Y-%m-%d %H:%M:%S UTC')

## Release Overview

### Coordinated Release Strategy
This plan coordinates releases across all Tony Framework repositories to ensure compatibility and proper dependency management.

## Repository Status

| Repository | Current | Next | Ready | Blockers |
|------------|---------|------|-------|----------|
EOF
    
    for repo in "Tony Framework" "Tony-MCP" "Tony-Dev"; do
        local current="${CURRENT_VERSIONS[$repo]}"
        local next="${NEXT_VERSIONS[$repo]}"
        local ready="${RELEASE_READY[$repo]}"
        local blockers="${RELEASE_BLOCKERS[$repo]}"
        
        local status_icon="❌"
        if [ "$ready" = "true" ]; then
            status_icon="✅"
        fi
        
        echo "| $repo | $current | $next | $status_icon | $blockers |" >> "$plan_file"
    done
    
    cat >> "$plan_file" << EOF

## Release Sequence

### Phase 1: Preparation
1. **Tony-Dev** - Release development tools first
   - Current: ${CURRENT_VERSIONS['Tony-Dev']}
   - Target: ${NEXT_VERSIONS['Tony-Dev']}
   - Status: $([ "${RELEASE_READY['Tony-Dev']}" = "true" ] && echo "Ready" || echo "Blocked: ${RELEASE_BLOCKERS['Tony-Dev']}")

### Phase 2: MCP Server
2. **Tony-MCP** - Release coordination server
   - Current: ${CURRENT_VERSIONS['Tony-MCP']}
   - Target: ${NEXT_VERSIONS['Tony-MCP']}
   - Status: $([ "${RELEASE_READY['Tony-MCP']}" = "true" ] && echo "Ready" || echo "Blocked: ${RELEASE_BLOCKERS['Tony-MCP']}")
   - Note: Beta releases acceptable during development

### Phase 3: Core Framework
3. **Tony Framework** - Release core framework
   - Current: ${CURRENT_VERSIONS['Tony Framework']}
   - Target: ${NEXT_VERSIONS['Tony Framework']}
   - Status: $([ "${RELEASE_READY['Tony Framework']}" = "true" ] && echo "Ready" || echo "Blocked: ${RELEASE_BLOCKERS['Tony Framework']}")

## Pre-Release Checklist

### All Repositories
- [ ] All tests passing
- [ ] Build successful
- [ ] Documentation updated
- [ ] Git status clean
- [ ] On appropriate release branch

### Tony Framework Specific
- [ ] VERSION file updated
- [ ] Multi-Phase Planning Architecture complete
- [ ] Backward compatibility verified
- [ ] Migration guides updated

### Tony-MCP Specific
- [ ] Docker images built and tested
- [ ] Database migrations tested
- [ ] API documentation complete
- [ ] Performance benchmarks passed

### Tony-Dev Specific
- [ ] Testing framework operational
- [ ] Development tools functional
- [ ] SDK structure validated
- [ ] Cross-repository tests passing

## Release Commands

### Automated Release (Recommended)
\`\`\`bash
# Full coordinated release
./tools/release-coordinator.sh execute

# Test release process
./tools/release-coordinator.sh dry-run
\`\`\`

### Manual Release Steps
\`\`\`bash
# 1. Build and test all components
./tools/build-all.sh
./testing/run-all-tests.sh

# 2. Update versions
./tools/version-sync.sh sync

# 3. Create release tags
./tools/release-coordinator.sh tag-all

# 4. Push releases
./tools/release-coordinator.sh push-releases
\`\`\`

## Post-Release Tasks

- [ ] Update user installation documentation
- [ ] Create release announcements
- [ ] Update SDK documentation
- [ ] Monitor for post-release issues
- [ ] Begin next development cycle

## Risk Assessment

### High Risk
- Breaking changes in core framework
- Database schema changes in MCP
- Dependency version conflicts

### Medium Risk
- New features in development tools
- Beta features in MCP server
- Documentation inconsistencies

### Low Risk
- Bug fixes and patches
- Performance improvements
- Test coverage improvements

---
*Generated by Tony SDK Release Coordinator*
EOF
    
    log_success "Release plan saved: $plan_file"
    echo
    echo -e "${CYAN}📖 Release Plan Summary:${NC}"
    
    local ready_count=0
    local total_count=0
    for repo in "Tony Framework" "Tony-MCP" "Tony-Dev"; do
        ((total_count++))
        if [ "${RELEASE_READY[$repo]}" = "true" ]; then
            ((ready_count++))
        fi
    done
    
    echo "  • Ready for release: $ready_count/$total_count repositories"
    echo "  • Plan file: $plan_file"
    
    if [ $ready_count -eq $total_count ]; then
        echo -e "  • ${GREEN}🚀 All repositories ready for coordinated release!${NC}"
    else
        echo -e "  • ${YELLOW}⚠️  Some repositories have blockers - review plan for details${NC}"
    fi
}

# Execute release (dry-run or actual)
execute_release() {
    local mode="${1:-dry-run}"
    
    echo -e "${CYAN}🚀 Release Execution${NC}"
    echo "==================="
    echo
    
    if [ "$mode" = "dry-run" ]; then
        log_info "DRY RUN MODE - No actual changes will be made"
        echo
    fi
    
    # Check if all repositories are ready
    local all_ready=true
    for repo in "Tony Framework" "Tony-MCP" "Tony-Dev"; do
        if [ "${RELEASE_READY[$repo]}" != "true" ]; then
            all_ready=false
            log_error "$repo is not ready for release: ${RELEASE_BLOCKERS[$repo]}"
        fi
    done
    
    if [ "$all_ready" != "true" ]; then
        log_error "Cannot proceed with release - some repositories are not ready"
        echo "Run './tools/release-coordinator.sh status' to see details"
        return 1
    fi
    
    log_success "All repositories are ready for release"
    echo
    
    # Execute release sequence
    for repo in "Tony-Dev" "Tony-MCP" "Tony Framework"; do
        log_info "Processing $repo release..."
        
        local repo_path=""
        case "$repo" in
            "Tony Framework") repo_path="framework-source/tony" ;;
            "Tony-MCP") repo_path="framework-source/tony-mcp" ;;
            "Tony-Dev") repo_path="framework-source/tony-dev" ;;
        esac
        
        if [ "$mode" = "execute" ]; then
            # Actual release commands would go here
            log_warning "Actual release execution not yet implemented"
            log_info "Would execute: git tag ${NEXT_VERSIONS[$repo]}"
        else
            log_info "Would tag $repo with version ${NEXT_VERSIONS[$repo]}"
        fi
    done
    
    echo
    if [ "$mode" = "dry-run" ]; then
        log_success "Dry run completed - no changes made"
    else
        log_success "Release execution completed"
    fi
}

# Main execution
main() {
    local action="${1:-status}"
    
    show_banner
    
    log_info "Analyzing Tony Framework SDK release readiness..."
    echo
    
    # Analyze all repositories
    for repo in "Tony Framework" "Tony-MCP" "Tony-Dev"; do
        local repo_path=""
        case "$repo" in
            "Tony Framework") repo_path="framework-source/tony" ;;
            "Tony-MCP") repo_path="framework-source/tony-mcp" ;;
            "Tony-Dev") repo_path="framework-source/tony-dev" ;;
        esac
        
        check_release_readiness "$repo" "$repo_path"
        analyze_versions "$repo" "$repo_path"
    done
    
    case "$action" in
        "status"|"")
            show_release_status
            ;;
        "plan")
            show_release_status
            generate_release_plan
            ;;
        "dry-run")
            show_release_status
            execute_release "dry-run"
            ;;
        "execute")
            show_release_status
            execute_release "execute"
            ;;
        "help")
            echo "Usage: $0 [status|plan|dry-run|execute|help]"
            echo
            echo "Commands:"
            echo "  status   - Show release readiness status (default)"
            echo "  plan     - Generate detailed release plan"
            echo "  dry-run  - Simulate release execution"
            echo "  execute  - Execute coordinated release"
            echo "  help     - Show this help message"
            echo
            ;;
        *)
            log_error "Unknown action: $action"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
    
    echo
    log_success "Release coordination analysis complete"
}

# Execute main function
main "$@"