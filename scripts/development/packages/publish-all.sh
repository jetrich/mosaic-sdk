#!/bin/bash
# Publish All Packages in MosAIc SDK Workspace
# Handles coordinated publishing of all workspace packages

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
ROOT_DIR="$(pwd)"
PUBLISH_SCRIPT="./scripts/development/packages/publish-package.sh"
VERSION_FILE="VERSION"

# Default package order (dependencies first)
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

# Function to check if all packages have same version
check_version_consistency() {
    echo -e "${BLUE}Checking version consistency across packages...${NC}"
    
    local expected_version=""
    if [ -f "$VERSION_FILE" ]; then
        expected_version=$(cat "$VERSION_FILE")
    else
        # Get version from root package.json
        if [ -f "package.json" ]; then
            expected_version=$(node -p "require('./package.json').version")
        fi
    fi
    
    if [ -z "$expected_version" ]; then
        echo -e "${RED}Error: Could not determine expected version${NC}"
        return 1
    fi
    
    echo -e "${CYAN}Expected version: $expected_version${NC}"
    
    local all_match=true
    for pkg in "${PACKAGE_ORDER[@]}"; do
        if [ -d "$pkg" ] && [ -f "$pkg/package.json" ]; then
            local pkg_version=$(cd "$pkg" && node -p "require('./package.json').version")
            local pkg_name=$(cd "$pkg" && node -p "require('./package.json').name")
            
            if [ "$pkg_version" != "$expected_version" ]; then
                echo -e "${YELLOW}  ⚠ $pkg_name: $pkg_version (mismatch)${NC}"
                all_match=false
            else
                echo -e "${GREEN}  ✓ $pkg_name: $pkg_version${NC}"
            fi
        fi
    done
    
    if [ "$all_match" = true ]; then
        echo -e "${GREEN}✓ All packages have consistent versions${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ Version mismatch detected${NC}"
        return 1
    fi
}

# Function to get packages that need publishing
get_publishable_packages() {
    local dry_run="$1"
    local force="$2"
    local publishable=()
    
    echo -e "${BLUE}Checking which packages need publishing...${NC}"
    
    for pkg in "${PACKAGE_ORDER[@]}"; do
        if [ -d "$pkg" ] && [ -f "$pkg/package.json" ]; then
            local pkg_name=$(cd "$pkg" && node -p "require('./package.json').name")
            local pkg_version=$(cd "$pkg" && node -p "require('./package.json').version")
            local pkg_private=$(cd "$pkg" && node -p "require('./package.json').private || false")
            
            # Skip private packages
            if [ "$pkg_private" = "true" ]; then
                echo -e "${YELLOW}  ⚠ Skipping $pkg_name (private package)${NC}"
                continue
            fi
            
            # Check if version already published (unless forced)
            if [ "$force" != "true" ]; then
                local org="mosaicstack"
                if [[ "$pkg_name" =~ ^@([^/]+)/ ]]; then
                    org="${BASH_REMATCH[1]}"
                fi
                
                if npm view "$pkg_name@$pkg_version" --registry="https://git.mosaicstack.dev/api/packages/$org/npm/" >/dev/null 2>&1; then
                    echo -e "${YELLOW}  ⚠ Skipping $pkg_name@$pkg_version (already published)${NC}"
                    continue
                fi
            fi
            
            echo -e "${GREEN}  ✓ Will publish $pkg_name@$pkg_version${NC}"
            publishable+=("$pkg")
        fi
    done
    
    echo "${publishable[@]}"
}

# Function to publish packages in order
publish_packages() {
    local packages=("$@")
    local dry_run="${DRY_RUN:-false}"
    local tag="${TAG:-latest}"
    local skip_tests="${SKIP_TESTS:-false}"
    local skip_build="${SKIP_BUILD:-false}"
    
    local total=${#packages[@]}
    local current=0
    local failed=0
    
    echo -e "\n${BLUE}Publishing $total packages...${NC}"
    
    for pkg in "${packages[@]}"; do
        ((current++))
        local pkg_name=$(cd "$pkg" && node -p "require('./package.json').name")
        
        echo -e "\n${CYAN}[$current/$total] Publishing $pkg_name...${NC}"
        echo -e "${CYAN}========================================${NC}"
        
        # Build publish command
        local cmd="$PUBLISH_SCRIPT \"$pkg\""
        [ "$dry_run" = "true" ] && cmd="$cmd --dry-run"
        [ "$tag" != "latest" ] && cmd="$cmd --tag $tag"
        [ "$skip_tests" = "true" ] && cmd="$cmd --skip-tests"
        [ "$skip_build" = "true" ] && cmd="$cmd --skip-build"
        
        # Execute publish
        if eval "$cmd"; then
            echo -e "${GREEN}✓ Successfully published $pkg_name${NC}"
        else
            echo -e "${RED}✗ Failed to publish $pkg_name${NC}"
            ((failed++))
            
            if [ "$CONTINUE_ON_ERROR" != "true" ]; then
                echo -e "${RED}Stopping due to error. Use --continue-on-error to continue${NC}"
                return 1
            fi
        fi
        
        # Add delay between publishes to avoid rate limiting
        if [ "$current" -lt "$total" ] && [ "$dry_run" != "true" ]; then
            echo -e "${CYAN}Waiting 2 seconds before next publish...${NC}"
            sleep 2
        fi
    done
    
    if [ $failed -eq 0 ]; then
        echo -e "\n${GREEN}✓ All packages published successfully!${NC}"
        return 0
    else
        echo -e "\n${YELLOW}⚠ Published $((total - failed))/$total packages${NC}"
        echo -e "${RED}✗ $failed packages failed${NC}"
        return 1
    fi
}

# Function to display summary
display_summary() {
    local packages=("$@")
    
    echo -e "\n${CYAN}========================================${NC}"
    echo -e "${CYAN}Publishing Summary${NC}"
    echo -e "${CYAN}========================================${NC}"
    
    echo -e "${BLUE}Packages to publish:${NC}"
    for pkg in "${packages[@]}"; do
        local pkg_name=$(cd "$pkg" && node -p "require('./package.json').name")
        local pkg_version=$(cd "$pkg" && node -p "require('./package.json').version")
        echo -e "  • $pkg_name@$pkg_version"
    done
    
    echo -e "\n${BLUE}Configuration:${NC}"
    echo -e "  • Tag: ${TAG:-latest}"
    echo -e "  • Dry run: ${DRY_RUN:-false}"
    echo -e "  • Skip tests: ${SKIP_TESTS:-false}"
    echo -e "  • Skip build: ${SKIP_BUILD:-false}"
    echo -e "  • Continue on error: ${CONTINUE_ON_ERROR:-false}"
}

# Function to display usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Publish all packages in the MosAIc SDK workspace

OPTIONS:
    -d, --dry-run              Perform a dry run (no actual publish)
    -t, --tag <TAG>           Publish with specific tag (default: latest)
    -f, --force               Publish even if versions exist
    -s, --skip-tests          Skip running tests before publish
    -b, --skip-build          Skip running build before publish
    -c, --continue-on-error   Continue publishing if a package fails
    -i, --interactive         Confirm before publishing each package
    -h, --help                Show this help message

EXAMPLES:
    # Publish all packages
    $0

    # Dry run to see what would be published
    $0 --dry-run

    # Publish with beta tag
    $0 --tag beta

    # Force publish all packages
    $0 --force

    # Continue even if some packages fail
    $0 --continue-on-error

NOTES:
    - Packages are published in dependency order
    - Private packages are automatically skipped
    - Already published versions are skipped (unless --force)
    - Version consistency is checked before publishing

EOF
    exit 1
}

# Parse arguments
DRY_RUN=false
TAG="latest"
FORCE=false
SKIP_TESTS=false
SKIP_BUILD=false
CONTINUE_ON_ERROR=false
INTERACTIVE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -b|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -c|--continue-on-error)
            CONTINUE_ON_ERROR=true
            shift
            ;;
        -i|--interactive)
            INTERACTIVE=true
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
echo -e "${CYAN}MosAIc Workspace Publisher${NC}"
echo -e "${CYAN}========================================${NC}"

# Check prerequisites
if [ ! -f "$PUBLISH_SCRIPT" ]; then
    echo -e "${RED}Error: publish-package.sh not found${NC}"
    exit 1
fi

# Make sure publish script is executable
chmod +x "$PUBLISH_SCRIPT"

# Check version consistency
if ! check_version_consistency; then
    if [ "$FORCE" != "true" ]; then
        echo -e "\n${YELLOW}Use --force to publish anyway${NC}"
        echo -e "${YELLOW}Or run: ./scripts/development/packages/bump-version.sh${NC}"
        exit 1
    fi
fi

# Get publishable packages
PUBLISHABLE_PACKAGES=($(get_publishable_packages "$DRY_RUN" "$FORCE"))

if [ ${#PUBLISHABLE_PACKAGES[@]} -eq 0 ]; then
    echo -e "\n${YELLOW}No packages need publishing${NC}"
    exit 0
fi

# Display summary
display_summary "${PUBLISHABLE_PACKAGES[@]}"

# Interactive confirmation
if [ "$INTERACTIVE" = "true" ] && [ "$DRY_RUN" != "true" ]; then
    echo -e "\n${YELLOW}Do you want to proceed with publishing? (y/n)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Publishing cancelled${NC}"
        exit 0
    fi
fi

# Publish packages
if publish_packages "${PUBLISHABLE_PACKAGES[@]}"; then
    echo -e "\n${GREEN}✓ Workspace publishing completed successfully!${NC}"
    
    if [ "$DRY_RUN" != "true" ]; then
        echo -e "\n${CYAN}Next steps:${NC}"
        echo -e "  1. Update CHANGELOG.md with release notes"
        echo -e "  2. Create git tag: git tag v\$(cat VERSION)"
        echo -e "  3. Push tag: git push --tags"
        echo -e "  4. Create release on Gitea"
    fi
else
    echo -e "\n${RED}✗ Workspace publishing failed${NC}"
    exit 1
fi