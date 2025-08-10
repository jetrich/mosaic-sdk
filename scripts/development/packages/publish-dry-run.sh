#!/bin/bash
# Perform Dry Run Publishing for All Packages
# This script helps preview what would be published without actually doing it

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
ROOT_DIR="$(pwd)"
TEMP_DIR="/tmp/mosaic-publish-dry-run"

# Package order (dependencies first)
PACKAGE_ORDER=(
    "packages/mcp-common"
    "packages/mcp-bookstack"
    "packages/mcp-gitea-remote"
    "packages/mcp-plane"
    "packages/mcp-woodpecker"
    "packages/mcp-integration"
    "tony"
    "mosaic-mcp"
    "mosaic"
    "mosaic-docs"
)

# Function to get package info
get_package_info() {
    local pkg_path="$1"
    
    if [ ! -f "$pkg_path/package.json" ]; then
        return 1
    fi
    
    cd "$pkg_path"
    
    local info=$(node -p "JSON.stringify({
        name: require('./package.json').name,
        version: require('./package.json').version,
        description: require('./package.json').description || '',
        private: require('./package.json').private || false,
        publishConfig: require('./package.json').publishConfig || {},
        files: require('./package.json').files || null,
        main: require('./package.json').main || 'index.js',
        types: require('./package.json').types || null,
        dependencies: Object.keys(require('./package.json').dependencies || {}),
        devDependencies: Object.keys(require('./package.json').devDependencies || {}),
        peerDependencies: Object.keys(require('./package.json').peerDependencies || {}),
        scripts: Object.keys(require('./package.json').scripts || {})
    })")
    
    cd "$ROOT_DIR"
    echo "$info"
}

# Function to analyze package contents
analyze_package_contents() {
    local pkg_path="$1"
    local pkg_name="$2"
    
    echo -e "\n${CYAN}Package contents analysis:${NC}"
    
    cd "$pkg_path"
    
    # Create temporary pack to analyze
    local temp_pack=$(npm pack --dry-run 2>&1)
    
    # Extract file list from npm pack output
    echo -e "${BLUE}Files that would be included:${NC}"
    echo "$temp_pack" | grep -E "^npm notice [0-9]+B" | sed 's/npm notice [0-9]*B */  • /' | head -20
    
    # Count files
    local file_count=$(echo "$temp_pack" | grep -c "^npm notice [0-9]+B" || true)
    if [ "$file_count" -gt 20 ]; then
        echo "  ... and $((file_count - 20)) more files"
    fi
    
    # Get package size
    local size_line=$(echo "$temp_pack" | grep "npm notice package size:" || true)
    if [ -n "$size_line" ]; then
        local size=$(echo "$size_line" | sed 's/npm notice package size: *//')
        echo -e "\n${BLUE}Package size: ${YELLOW}$size${NC}"
    fi
    
    # Get unpacked size
    local unpacked_line=$(echo "$temp_pack" | grep "npm notice unpacked size:" || true)
    if [ -n "$unpacked_line" ]; then
        local unpacked=$(echo "$unpacked_line" | sed 's/npm notice unpacked size: *//')
        echo -e "${BLUE}Unpacked size: ${YELLOW}$unpacked${NC}"
    fi
    
    cd "$ROOT_DIR"
}

# Function to check registry status
check_registry_status() {
    local pkg_name="$1"
    local pkg_version="$2"
    local org="mosaicstack"
    
    # Extract org from scoped package name
    if [[ "$pkg_name" =~ ^@([^/]+)/ ]]; then
        org="${BASH_REMATCH[1]}"
    fi
    
    local registry_url="https://git.mosaicstack.dev/api/packages/$org/npm/"
    
    echo -e "\n${CYAN}Registry status:${NC}"
    
    # Check if package exists in registry
    if npm view "$pkg_name" --registry="$registry_url" >/dev/null 2>&1; then
        local latest_version=$(npm view "$pkg_name" version --registry="$registry_url" 2>/dev/null || echo "unknown")
        echo -e "${BLUE}Latest published version: ${YELLOW}$latest_version${NC}"
        
        # Check if current version exists
        if npm view "$pkg_name@$pkg_version" --registry="$registry_url" >/dev/null 2>&1; then
            echo -e "${YELLOW}⚠ Version $pkg_version already published${NC}"
            return 1
        else
            echo -e "${GREEN}✓ Version $pkg_version not yet published${NC}"
        fi
    else
        echo -e "${GREEN}✓ Package not yet published to registry${NC}"
    fi
    
    return 0
}

# Function to check dependencies
check_dependencies() {
    local deps="$1"
    local type="$2"
    
    if [ -z "$deps" ] || [ "$deps" = "[]" ]; then
        return
    fi
    
    echo -e "\n${CYAN}$type:${NC}"
    
    # Parse JSON array
    local dep_list=$(echo "$deps" | jq -r '.[]')
    
    for dep in $dep_list; do
        # Check if it's a workspace package
        if [[ "$dep" =~ ^@(mosaicstack|dyorfoundation)/ ]]; then
            echo -e "  ${MAGENTA}• $dep (workspace package)${NC}"
        else
            echo -e "  • $dep"
        fi
    done
}

# Function to analyze single package
analyze_package() {
    local pkg_path="$1"
    
    echo -e "\n${CYAN}========================================${NC}"
    
    # Get package info
    local info=$(get_package_info "$pkg_path")
    if [ -z "$info" ]; then
        echo -e "${RED}Error: Could not read package info from $pkg_path${NC}"
        return 1
    fi
    
    # Parse package info
    local pkg_name=$(echo "$info" | jq -r '.name')
    local pkg_version=$(echo "$info" | jq -r '.version')
    local pkg_desc=$(echo "$info" | jq -r '.description')
    local pkg_private=$(echo "$info" | jq -r '.private')
    
    echo -e "${CYAN}Package: ${YELLOW}$pkg_name@$pkg_version${NC}"
    echo -e "${CYAN}Path: $pkg_path${NC}"
    [ -n "$pkg_desc" ] && echo -e "${CYAN}Description: $pkg_desc${NC}"
    
    # Check if private
    if [ "$pkg_private" = "true" ]; then
        echo -e "\n${YELLOW}⚠ This is a private package and will not be published${NC}"
        return 0
    fi
    
    # Check registry status
    check_registry_status "$pkg_name" "$pkg_version"
    
    # Analyze contents
    analyze_package_contents "$pkg_path" "$pkg_name"
    
    # Check dependencies
    local deps=$(echo "$info" | jq -c '.dependencies')
    local devDeps=$(echo "$info" | jq -c '.devDependencies')
    local peerDeps=$(echo "$info" | jq -c '.peerDependencies')
    
    check_dependencies "$deps" "Dependencies"
    check_dependencies "$devDeps" "Dev Dependencies"
    check_dependencies "$peerDeps" "Peer Dependencies"
    
    # Check scripts
    local scripts=$(echo "$info" | jq -c '.scripts')
    if [ "$scripts" != "[]" ]; then
        echo -e "\n${CYAN}Available scripts:${NC}"
        echo "$scripts" | jq -r '.[]' | while read -r script; do
            echo "  • npm run $script"
        done
    fi
    
    # Check publish config
    local publishConfig=$(echo "$info" | jq -c '.publishConfig')
    if [ "$publishConfig" != "{}" ]; then
        echo -e "\n${CYAN}Publish configuration:${NC}"
        echo "$publishConfig" | jq .
    fi
    
    return 0
}

# Function to generate summary report
generate_summary() {
    local total=0
    local publishable=0
    local private=0
    local already_published=0
    
    echo -e "\n${CYAN}========================================${NC}"
    echo -e "${CYAN}DRY RUN SUMMARY${NC}"
    echo -e "${CYAN}========================================${NC}"
    
    echo -e "\n${BLUE}Packages analyzed:${NC}"
    
    for pkg in "${PACKAGE_ORDER[@]}"; do
        if [ -d "$pkg" ] && [ -f "$pkg/package.json" ]; then
            ((total++))
            
            local info=$(get_package_info "$pkg")
            local pkg_name=$(echo "$info" | jq -r '.name')
            local pkg_version=$(echo "$info" | jq -r '.version')
            local pkg_private=$(echo "$info" | jq -r '.private')
            
            if [ "$pkg_private" = "true" ]; then
                echo -e "  ${YELLOW}⚠ $pkg_name@$pkg_version (private)${NC}"
                ((private++))
            else
                local org="mosaicstack"
                if [[ "$pkg_name" =~ ^@([^/]+)/ ]]; then
                    org="${BASH_REMATCH[1]}"
                fi
                
                if npm view "$pkg_name@$pkg_version" --registry="https://git.mosaicstack.dev/api/packages/$org/npm/" >/dev/null 2>&1; then
                    echo -e "  ${YELLOW}⚠ $pkg_name@$pkg_version (already published)${NC}"
                    ((already_published++))
                else
                    echo -e "  ${GREEN}✓ $pkg_name@$pkg_version (ready to publish)${NC}"
                    ((publishable++))
                fi
            fi
        fi
    done
    
    echo -e "\n${BLUE}Statistics:${NC}"
    echo -e "  Total packages: $total"
    echo -e "  Ready to publish: ${GREEN}$publishable${NC}"
    echo -e "  Already published: ${YELLOW}$already_published${NC}"
    echo -e "  Private packages: ${YELLOW}$private${NC}"
    
    if [ $publishable -gt 0 ]; then
        echo -e "\n${GREEN}✓ $publishable package(s) ready for publishing${NC}"
        echo -e "\n${CYAN}To publish these packages, run:${NC}"
        echo -e "  ${YELLOW}./scripts/development/packages/publish-all.sh${NC}"
    else
        echo -e "\n${YELLOW}No packages need publishing${NC}"
    fi
}

# Function to display usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Perform a comprehensive dry run analysis of all packages

OPTIONS:
    -p, --package <PATH>    Analyze specific package only
    -s, --summary          Show summary only (no detailed analysis)
    -v, --verbose          Show verbose output
    -h, --help             Show this help message

EXAMPLES:
    # Analyze all packages
    $0

    # Analyze specific package
    $0 --package packages/mcp-common

    # Show summary only
    $0 --summary

WHAT THIS SCRIPT DOES:
    - Checks which packages would be published
    - Verifies package versions against registry
    - Analyzes package contents and size
    - Validates dependencies
    - Reports any issues or warnings

EOF
    exit 1
}

# Parse arguments
SPECIFIC_PACKAGE=""
SUMMARY_ONLY=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--package)
            SPECIFIC_PACKAGE="$2"
            shift 2
            ;;
        -s|--summary)
            SUMMARY_ONLY=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            ;;
    esac
done

# Main execution
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}MosAIc Package Publishing Dry Run${NC}"
echo -e "${CYAN}========================================${NC}"
echo -e "${YELLOW}This is a dry run - no packages will be published${NC}"

# Check prerequisites
if ! command -v jq >/dev/null 2>&1; then
    echo -e "${RED}Error: jq is required for JSON parsing${NC}"
    echo -e "${YELLOW}Install with: apt-get install jq${NC}"
    exit 1
fi

# Create temp directory
mkdir -p "$TEMP_DIR"

# Analyze packages
if [ -n "$SPECIFIC_PACKAGE" ]; then
    # Analyze single package
    if [ "$SUMMARY_ONLY" != "true" ]; then
        analyze_package "$SPECIFIC_PACKAGE"
    fi
else
    # Analyze all packages
    if [ "$SUMMARY_ONLY" != "true" ]; then
        for pkg in "${PACKAGE_ORDER[@]}"; do
            if [ -d "$pkg" ] && [ -f "$pkg/package.json" ]; then
                analyze_package "$pkg" || true
            fi
        done
    fi
    
    # Generate summary
    generate_summary
fi

# Cleanup
rm -rf "$TEMP_DIR"