#!/bin/bash

# Tony Framework - Version Utilities
# Shared functions for version comparison and analysis

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Version comparison function - semantic version aware
version_greater() {
    local version1="$1"
    local version2="$2"
    
    # Remove 'v' prefix if present
    version1=${version1#v}
    version2=${version2#v}
    
    # Use sort -V for semantic version comparison
    if [ "$(printf '%s\n%s' "$version1" "$version2" | sort -V | tail -n1)" = "$version1" ]; then
        [ "$version1" != "$version2" ]
    else
        false
    fi
}

# Get GitHub latest version
get_github_version() {
    local repo_url="https://github.com/jetrich/tech-lead-tony.git"
    
    # Try multiple methods to get latest version
    if command -v git >/dev/null 2>&1; then
        # Method 1: Use git ls-remote if available
        local latest_tag
        latest_tag=$(git ls-remote --tags "$repo_url" 2>/dev/null | \
                    grep -v '{}' | \
                    sed 's|.*refs/tags/||' | \
                    sort -V | \
                    tail -1)
        
        if [ -n "$latest_tag" ]; then
            echo "$latest_tag"
            return 0
        fi
    fi
    
    # Method 2: Check local repository if we're in it
    if [ -d ".git" ]; then
        local latest_tag
        latest_tag=$(git tag --sort=-version:refname | head -1 2>/dev/null || echo "")
        if [ -n "$latest_tag" ]; then
            echo "$latest_tag"
            return 0
        fi
    fi
    
    # Method 3: Default to current version from changelog
    if [ -f "CHANGELOG.md" ]; then
        grep -m1 "## \[" CHANGELOG.md | sed 's/.*\[\([^]]*\)\].*/\1/' || echo "2.0.0"
    else
        echo "2.0.0"
    fi
}

# Get user-level framework version
get_user_version() {
    local version_file="$HOME/.claude/tony/metadata/VERSION"
    
    if [ -f "$version_file" ]; then
        grep "Framework-Version:" "$version_file" | cut -d' ' -f2 || echo "unknown"
    else
        echo "not-installed"
    fi
}

# Get project-level versions from all detected Tony deployments
get_project_versions() {
    local search_dirs=("$HOME" "$HOME/src" "$HOME/projects" "$HOME/work" "$(pwd)")
    local project_versions=()
    
    for search_dir in "${search_dirs[@]}"; do
        if [ ! -d "$search_dir" ]; then
            continue
        fi
        
        # Find projects with Tony infrastructure
        while IFS= read -r -d '' project_dir; do
            local project_path
            project_path=$(dirname "$project_dir")
            
            # Resolve any relative paths and tilde expansion properly
            # This fixes the bug where ~/ in project paths wasn't being expanded
            project_path=$(realpath "$project_path" 2>/dev/null || readlink -f "$project_path" 2>/dev/null || echo "$project_path")
            
            # Skip if this looks like a nested ~/.claude/tony path (invalid)
            if [[ "$project_path" == *"/.claude/tony"* ]]; then
                continue
            fi
            
            # Extract version from project CLAUDE.md if available
            local project_version="unknown"
            if [ -f "$project_path/CLAUDE.md" ]; then
                project_version=$(grep -i "tony.*version\|framework.*version" "$project_path/CLAUDE.md" | \
                                head -1 | \
                                grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")
            fi
            
            # Get last activity timestamp
            local last_activity
            if [ -f "$project_dir/scratchpad.md" ]; then
                last_activity=$(stat -c %Y "$project_dir/scratchpad.md" 2>/dev/null || echo "0")
            else
                last_activity="0"
            fi
            
            project_versions+=("$project_path:$project_version:$last_activity")
            
        done < <(find "$search_dir" -maxdepth 3 -name "tech-lead-tony" -type d -print0 2>/dev/null || true)
    done
    
    # Sort by last activity (most recent first) and output
    printf '%s\n' "${project_versions[@]}" | sort -t: -k3 -nr
}

# Compare version strings and return comparison result
compare_versions() {
    local version1="$1"
    local version2="$2"
    
    if [ "$version1" = "$version2" ]; then
        echo "equal"
    elif version_greater "$version1" "$version2"; then
        echo "greater"
    else
        echo "less"
    fi
}

# Format version for display
format_version_display() {
    local version="$1"
    local context="$2"  # github, user, project
    
    case "$context" in
        "github")
            echo -e "${GREEN}$version${NC} (GitHub latest)"
            ;;
        "user")
            echo -e "${BLUE}$version${NC} (user-level)"
            ;;
        "project")
            echo -e "${CYAN}$version${NC} (project-level)"
            ;;
        *)
            echo "$version"
            ;;
    esac
}

# Analyze version hierarchy and return upgrade recommendation
analyze_upgrade_path() {
    local github_version user_version
    github_version=$(get_github_version)
    user_version=$(get_user_version)
    
    echo "🔍 Version Analysis:"
    echo "  GitHub:    $(format_version_display "$github_version" "github")"
    echo "  User:      $(format_version_display "$user_version" "user")"
    echo ""
    
    # Determine upgrade path
    local github_vs_user
    github_vs_user=$(compare_versions "$github_version" "$user_version")
    
    case "$github_vs_user" in
        "greater")
            echo "🚀 Recommended Action: GitHub → User → Projects upgrade"
            echo "   • New framework features available"
            echo "   • User-level framework will be updated"
            echo "   • All projects will inherit improvements"
            return 0  # Upgrade available
            ;;
        "equal")
            echo "✅ Framework Status: Up to date"
            echo "   • User-level matches latest GitHub version"
            echo "   • Consider project-level propagation if needed"
            return 1  # No upgrade needed
            ;;
        "less")
            echo "⚠️  Framework Status: User has newer version than GitHub"
            echo "   • Local development version detected"
            echo "   • Consider contributing changes to GitHub"
            return 2  # User ahead of GitHub
            ;;
    esac
}

# Validate version format
is_valid_version() {
    local version="$1"
    
    # Check semantic version format (X.Y.Z)
    if [[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        return 0
    else
        return 1
    fi
}

# Get version from any Tony component file
extract_version_from_component() {
    local component_file="$1"
    
    if [ ! -f "$component_file" ]; then
        echo "unknown"
        return 1
    fi
    
    # Look for version patterns in component files
    local version
    version=$(grep -i "version.*[0-9]\+\.[0-9]\+\.[0-9]\+" "$component_file" | \
              head -1 | \
              grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")
    
    echo "$version"
}

# Export functions for use in other scripts
export -f version_greater
export -f get_github_version
export -f get_user_version
export -f get_project_versions
export -f compare_versions
export -f format_version_display
export -f analyze_upgrade_path
export -f is_valid_version
export -f extract_version_from_component