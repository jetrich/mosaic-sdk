#!/bin/bash
# Publish Individual Package to Gitea NPM Registry
# Handles the complete publishing workflow for a single package

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
NPMRC_FILE=".npmrc"
GITEA_URL="https://git.mosaicstack.dev"

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"
    
    # Check if .npmrc exists
    if [ ! -f "$NPMRC_FILE" ]; then
        echo -e "${RED}Error: .npmrc not found${NC}"
        echo -e "${YELLOW}Run: ./scripts/utilities/setup/configure-npm-auth.sh${NC}"
        exit 1
    fi
    
    # Check if GITEA_NPM_TOKEN is set
    if [ -z "${GITEA_NPM_TOKEN:-}" ]; then
        echo -e "${RED}Error: GITEA_NPM_TOKEN environment variable not set${NC}"
        echo -e "${YELLOW}Export your Gitea personal access token:${NC}"
        echo -e "${YELLOW}  export GITEA_NPM_TOKEN='your-token'${NC}"
        exit 1
    fi
    
    # Check if npm is logged in
    if ! npm whoami --registry="$GITEA_URL/api/packages/mosaicstack/npm/" >/dev/null 2>&1; then
        echo -e "${YELLOW}Warning: Not logged in to Gitea registry${NC}"
    fi
    
    echo -e "${GREEN}✓ Prerequisites satisfied${NC}"
}

# Function to validate package
validate_package() {
    local package_path="$1"
    
    echo -e "${BLUE}Validating package...${NC}"
    
    # Check if package.json exists
    if [ ! -f "$package_path/package.json" ]; then
        echo -e "${RED}Error: package.json not found in $package_path${NC}"
        exit 1
    fi
    
    # Get package info
    local package_name=$(cd "$package_path" && node -p "require('./package.json').name")
    local package_version=$(cd "$package_path" && node -p "require('./package.json').version")
    local package_private=$(cd "$package_path" && node -p "require('./package.json').private || false")
    
    # Check if package is private
    if [ "$package_private" = "true" ]; then
        echo -e "${YELLOW}Warning: Package is marked as private${NC}"
        echo -e "${YELLOW}Private packages cannot be published${NC}"
        return 1
    fi
    
    # Check if package has required fields
    local has_name=$(cd "$package_path" && node -p "!!require('./package.json').name")
    local has_version=$(cd "$package_path" && node -p "!!require('./package.json').version")
    
    if [ "$has_name" != "true" ] || [ "$has_version" != "true" ]; then
        echo -e "${RED}Error: Package missing required fields (name or version)${NC}"
        return 1
    fi
    
    # Check if package is scoped correctly
    if [[ ! "$package_name" =~ ^@(mosaicstack|dyorfoundation)/ ]]; then
        echo -e "${YELLOW}Warning: Package not scoped to @mosaicstack or @dyorfoundation${NC}"
        echo -e "${YELLOW}Current name: $package_name${NC}"
    fi
    
    echo -e "${GREEN}✓ Package validation passed${NC}"
    echo -e "${CYAN}  Name: $package_name${NC}"
    echo -e "${CYAN}  Version: $package_version${NC}"
    
    return 0
}

# Function to check if version already exists
check_version_exists() {
    local package_name="$1"
    local package_version="$2"
    local org="mosaicstack"
    
    # Extract org from scoped package name
    if [[ "$package_name" =~ ^@([^/]+)/ ]]; then
        org="${BASH_REMATCH[1]}"
    fi
    
    echo -e "${BLUE}Checking if version exists in registry...${NC}"
    
    # Check if package version exists
    if npm view "$package_name@$package_version" --registry="$GITEA_URL/api/packages/$org/npm/" >/dev/null 2>&1; then
        echo -e "${YELLOW}Version $package_version already exists in registry${NC}"
        return 0
    else
        echo -e "${GREEN}✓ Version $package_version not found in registry (OK to publish)${NC}"
        return 1
    fi
}

# Function to run pre-publish checks
run_pre_publish_checks() {
    local package_path="$1"
    
    echo -e "${BLUE}Running pre-publish checks...${NC}"
    
    cd "$package_path"
    
    # Run tests if available
    if grep -q '"test"' package.json; then
        echo -e "${CYAN}Running tests...${NC}"
        if npm test; then
            echo -e "${GREEN}✓ Tests passed${NC}"
        else
            echo -e "${RED}✗ Tests failed${NC}"
            return 1
        fi
    fi
    
    # Run build if available
    if grep -q '"build"' package.json; then
        echo -e "${CYAN}Running build...${NC}"
        if npm run build; then
            echo -e "${GREEN}✓ Build successful${NC}"
        else
            echo -e "${RED}✗ Build failed${NC}"
            return 1
        fi
    fi
    
    # Check for uncommitted changes
    if ! git diff --quiet; then
        echo -e "${YELLOW}Warning: Uncommitted changes detected${NC}"
        echo -e "${YELLOW}Consider committing changes before publishing${NC}"
    fi
    
    cd "$ROOT_DIR"
    return 0
}

# Function to publish package
publish_package() {
    local package_path="$1"
    local dry_run="${2:-false}"
    local tag="${3:-latest}"
    
    # Get package info
    local package_name=$(cd "$package_path" && node -p "require('./package.json').name")
    local package_version=$(cd "$package_path" && node -p "require('./package.json').version")
    local org="mosaicstack"
    
    # Extract org from scoped package name
    if [[ "$package_name" =~ ^@([^/]+)/ ]]; then
        org="${BASH_REMATCH[1]}"
    fi
    
    local registry_url="$GITEA_URL/api/packages/$org/npm/"
    
    echo -e "${BLUE}Publishing $package_name@$package_version to $org organization...${NC}"
    
    cd "$package_path"
    
    # Prepare publish command
    local publish_cmd="npm publish --registry=$registry_url --tag=$tag"
    
    if [ "$dry_run" = "true" ]; then
        publish_cmd="$publish_cmd --dry-run"
        echo -e "${YELLOW}DRY RUN MODE - No actual publishing will occur${NC}"
    fi
    
    # Execute publish
    echo -e "${CYAN}Executing: $publish_cmd${NC}"
    
    if $publish_cmd; then
        if [ "$dry_run" = "true" ]; then
            echo -e "${GREEN}✓ Dry run completed successfully${NC}"
        else
            echo -e "${GREEN}✓ Published $package_name@$package_version successfully${NC}"
            
            # Verify publication
            sleep 2
            if npm view "$package_name@$package_version" --registry="$registry_url" >/dev/null 2>&1; then
                echo -e "${GREEN}✓ Package verified in registry${NC}"
            else
                echo -e "${YELLOW}⚠ Could not verify package in registry (may take time to propagate)${NC}"
            fi
        fi
    else
        echo -e "${RED}✗ Publishing failed${NC}"
        return 1
    fi
    
    cd "$ROOT_DIR"
    return 0
}

# Function to display usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS] <PACKAGE_PATH>

Publish a package to Gitea NPM registry

OPTIONS:
    -d, --dry-run           Perform a dry run (no actual publish)
    -t, --tag <TAG>         Publish with specific tag (default: latest)
    -f, --force             Skip version existence check
    -s, --skip-tests        Skip running tests before publish
    -b, --skip-build        Skip running build before publish
    -h, --help              Show this help message

ARGUMENTS:
    PACKAGE_PATH            Path to package directory

EXAMPLES:
    # Publish a package
    $0 packages/mcp-common

    # Dry run to see what would be published
    $0 --dry-run packages/mcp-common

    # Publish with beta tag
    $0 --tag beta packages/mcp-common

    # Force publish (skip version check)
    $0 --force packages/mcp-common

PREREQUISITES:
    1. Configure NPM auth: ./scripts/utilities/setup/configure-npm-auth.sh
    2. Export GITEA_NPM_TOKEN environment variable
    3. Ensure package version is updated

EOF
    exit 1
}

# Parse arguments
DRY_RUN=false
TAG="latest"
FORCE=false
SKIP_TESTS=false
SKIP_BUILD=false
PACKAGE_PATH=""

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
        -h|--help)
            usage
            ;;
        *)
            PACKAGE_PATH="$1"
            shift
            ;;
    esac
done

# Validate arguments
if [ -z "$PACKAGE_PATH" ]; then
    echo -e "${RED}Error: Package path not specified${NC}"
    usage
fi

# Main execution
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}MosAIc Package Publisher${NC}"
echo -e "${CYAN}========================================${NC}"

# Check prerequisites
check_prerequisites

# Validate package
if ! validate_package "$PACKAGE_PATH"; then
    exit 1
fi

# Get package info for checks
PACKAGE_NAME=$(cd "$PACKAGE_PATH" && node -p "require('./package.json').name")
PACKAGE_VERSION=$(cd "$PACKAGE_PATH" && node -p "require('./package.json').version")

# Check if version exists (unless forced)
if [ "$FORCE" != "true" ]; then
    if check_version_exists "$PACKAGE_NAME" "$PACKAGE_VERSION"; then
        echo -e "${RED}Error: Version already exists. Use --force to override${NC}"
        exit 1
    fi
fi

# Run pre-publish checks (unless skipped)
if [ "$SKIP_TESTS" != "true" ] || [ "$SKIP_BUILD" != "true" ]; then
    # Temporarily override test/build skip for pre-publish checks
    cd "$PACKAGE_PATH"
    if [ "$SKIP_TESTS" = "true" ]; then
        npm pkg set scripts.test="echo 'Tests skipped by --skip-tests flag'"
    fi
    if [ "$SKIP_BUILD" = "true" ]; then
        npm pkg set scripts.build="echo 'Build skipped by --skip-build flag'"
    fi
    cd "$ROOT_DIR"
    
    if ! run_pre_publish_checks "$PACKAGE_PATH"; then
        echo -e "${RED}Error: Pre-publish checks failed${NC}"
        exit 1
    fi
fi

# Publish the package
if publish_package "$PACKAGE_PATH" "$DRY_RUN" "$TAG"; then
    echo -e "\n${GREEN}✓ Publishing completed successfully!${NC}"
    
    if [ "$DRY_RUN" != "true" ]; then
        echo -e "\n${CYAN}Next steps:${NC}"
        echo -e "  1. Update CHANGELOG.md with release notes"
        echo -e "  2. Create git tag: git tag ${PACKAGE_NAME}@${PACKAGE_VERSION}"
        echo -e "  3. Push tag: git push --tags"
    fi
else
    echo -e "\n${RED}✗ Publishing failed${NC}"
    exit 1
fi