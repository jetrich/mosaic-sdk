#!/bin/bash
# Version Bump Script for MosAIc SDK
# Manages version updates across all packages in the workspace

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
VERSION_FILE="VERSION"

# Function to get current version
get_current_version() {
    local package_path="$1"
    if [ -f "$package_path/package.json" ]; then
        node -p "require('$package_path/package.json').version"
    else
        echo "0.0.0"
    fi
}

# Function to validate semver
validate_semver() {
    local version="$1"
    if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$ ]]; then
        echo -e "${RED}Error: Invalid version format: $version${NC}"
        echo -e "${YELLOW}Expected format: MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]${NC}"
        return 1
    fi
    return 0
}

# Function to bump version
bump_version() {
    local current="$1"
    local bump_type="$2"
    
    # Parse current version
    IFS='.' read -r major minor patch <<< "${current%%-*}"
    
    case "$bump_type" in
        major)
            ((major++))
            minor=0
            patch=0
            ;;
        minor)
            ((minor++))
            patch=0
            ;;
        patch)
            ((patch++))
            ;;
        *)
            echo "$current"
            return
            ;;
    esac
    
    echo "$major.$minor.$patch"
}

# Function to update package.json version
update_package_version() {
    local package_path="$1"
    local new_version="$2"
    
    if [ ! -f "$package_path/package.json" ]; then
        return 1
    fi
    
    local package_name=$(node -p "require('$package_path/package.json').name")
    echo -e "${CYAN}  Updating $package_name to $new_version${NC}"
    
    # Update version in package.json
    local tmp_file=$(mktemp)
    jq --arg version "$new_version" '.version = $version' "$package_path/package.json" > "$tmp_file"
    mv "$tmp_file" "$package_path/package.json"
    
    return 0
}

# Function to update root VERSION file
update_version_file() {
    local new_version="$1"
    echo "$new_version" > "$VERSION_FILE"
    echo -e "${GREEN}✓ Updated VERSION file to $new_version${NC}"
}

# Function to update all packages
update_all_packages() {
    local new_version="$1"
    local packages_updated=0
    
    echo -e "${BLUE}Updating all packages to version $new_version...${NC}"
    
    # Update root package
    if [ -f "package.json" ]; then
        update_package_version "." "$new_version" && ((packages_updated++))
    fi
    
    # Update workspace packages
    local workspace_packages=(
        "tony"
        "mosaic"
        "mosaic-mcp"
        "mosaic-docs"
        "packages/mcp-common"
        "packages/mcp-bookstack"
        "packages/mcp-gitea-remote"
        "packages/mcp-plane"
        "packages/mcp-woodpecker"
        "packages/mcp-integration"
    )
    
    for pkg in "${workspace_packages[@]}"; do
        if [ -d "$pkg" ] && [ -f "$pkg/package.json" ]; then
            update_package_version "$pkg" "$new_version" && ((packages_updated++))
        fi
    done
    
    echo -e "${GREEN}✓ Updated $packages_updated packages${NC}"
}

# Function to display usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS] [VERSION]

Bump version across all packages in the MosAIc SDK workspace

OPTIONS:
    -t, --type <TYPE>       Bump type: major, minor, patch (default: patch)
    -p, --package <PATH>    Update only specific package
    -a, --all              Update all packages (default)
    -s, --set <VERSION>    Set specific version (e.g., 1.2.3)
    -r, --prerelease <ID>  Add prerelease identifier (e.g., beta, rc)
    -n, --dry-run          Show what would be changed without updating
    -h, --help             Show this help message

EXAMPLES:
    # Bump patch version for all packages
    $0

    # Bump minor version
    $0 --type minor

    # Set specific version
    $0 --set 1.0.0

    # Create beta release
    $0 --type minor --prerelease beta

    # Update only specific package
    $0 --package packages/mcp-common --type patch

    # Dry run to see changes
    $0 --type major --dry-run

NOTES:
    - Updates package.json files and root VERSION file
    - Maintains version consistency across workspace
    - Follows semantic versioning (semver)

EOF
    exit 1
}

# Parse arguments
BUMP_TYPE="patch"
SPECIFIC_VERSION=""
PRERELEASE=""
DRY_RUN=false
UPDATE_ALL=true
SPECIFIC_PACKAGE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            BUMP_TYPE="$2"
            shift 2
            ;;
        -p|--package)
            SPECIFIC_PACKAGE="$2"
            UPDATE_ALL=false
            shift 2
            ;;
        -a|--all)
            UPDATE_ALL=true
            shift
            ;;
        -s|--set)
            SPECIFIC_VERSION="$2"
            shift 2
            ;;
        -r|--prerelease)
            PRERELEASE="$2"
            shift 2
            ;;
        -n|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            # If it looks like a version, use it as specific version
            if [[ "$1" =~ ^[0-9]+\.[0-9]+\.[0-9]+ ]]; then
                SPECIFIC_VERSION="$1"
            else
                echo -e "${RED}Unknown option: $1${NC}"
                usage
            fi
            shift
            ;;
    esac
done

# Validate bump type
if [[ ! "$BUMP_TYPE" =~ ^(major|minor|patch)$ ]]; then
    echo -e "${RED}Error: Invalid bump type: $BUMP_TYPE${NC}"
    echo -e "${YELLOW}Valid types: major, minor, patch${NC}"
    exit 1
fi

# Get current version
if [ -f "$VERSION_FILE" ]; then
    CURRENT_VERSION=$(cat "$VERSION_FILE")
else
    CURRENT_VERSION=$(get_current_version ".")
fi

echo -e "${BLUE}Current version: $CURRENT_VERSION${NC}"

# Determine new version
if [ -n "$SPECIFIC_VERSION" ]; then
    NEW_VERSION="$SPECIFIC_VERSION"
else
    NEW_VERSION=$(bump_version "$CURRENT_VERSION" "$BUMP_TYPE")
fi

# Add prerelease if specified
if [ -n "$PRERELEASE" ]; then
    # Check if version already has prerelease
    if [[ "$NEW_VERSION" =~ - ]]; then
        # Replace existing prerelease
        NEW_VERSION="${NEW_VERSION%%-*}-$PRERELEASE"
    else
        # Add new prerelease
        NEW_VERSION="$NEW_VERSION-$PRERELEASE"
    fi
fi

# Validate new version
if ! validate_semver "$NEW_VERSION"; then
    exit 1
fi

echo -e "${BLUE}New version: $NEW_VERSION${NC}"

# Dry run check
if [ "$DRY_RUN" = true ]; then
    echo -e "\n${YELLOW}DRY RUN - No changes will be made${NC}"
    
    if [ "$UPDATE_ALL" = true ]; then
        echo -e "\n${CYAN}Would update:${NC}"
        echo -e "  - VERSION file"
        echo -e "  - All package.json files in workspace"
    else
        echo -e "\n${CYAN}Would update:${NC}"
        echo -e "  - $SPECIFIC_PACKAGE/package.json"
    fi
    
    exit 0
fi

# Perform update
if [ "$UPDATE_ALL" = true ]; then
    update_all_packages "$NEW_VERSION"
    update_version_file "$NEW_VERSION"
else
    if [ -n "$SPECIFIC_PACKAGE" ]; then
        update_package_version "$SPECIFIC_PACKAGE" "$NEW_VERSION"
    fi
fi

echo -e "\n${GREEN}✓ Version bump complete!${NC}"
echo -e "${CYAN}New version: $NEW_VERSION${NC}"
echo -e "\n${YELLOW}Don't forget to:${NC}"
echo -e "  1. Update CHANGELOG.md with version notes"
echo -e "  2. Commit changes: git commit -am \"chore: bump version to $NEW_VERSION\""
echo -e "  3. Tag release: git tag -a v$NEW_VERSION -m \"Release version $NEW_VERSION\""
echo -e "  4. Push changes: git push && git push --tags"