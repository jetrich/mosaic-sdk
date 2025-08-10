#!/bin/bash
# Test Package Publishing Locally
# This script helps test package publishing to ensure everything works before production

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
LOCAL_REGISTRY="http://localhost:4873"
TEMP_DIR="/tmp/mosaic-package-test"
ROOT_DIR="$(pwd)"

# Function to check if Verdaccio is running
check_verdaccio() {
    if ! curl -s "$LOCAL_REGISTRY" >/dev/null 2>&1; then
        echo -e "${RED}Error: Verdaccio is not running${NC}"
        echo -e "${YELLOW}Run: ./scripts/development/packages/setup-local-registry.sh start${NC}"
        exit 1
    fi
}

# Function to test package packing
test_pack() {
    local package_path="$1"
    local package_name=$(cd "$package_path" && node -p "require('./package.json').name")
    local package_version=$(cd "$package_path" && node -p "require('./package.json').version")
    
    echo -e "${BLUE}Testing pack for $package_name@$package_version...${NC}"
    
    cd "$package_path"
    
    # Run npm pack
    local tarball=$(npm pack 2>&1 | tail -n 1)
    
    if [ -f "$tarball" ]; then
        echo -e "${GREEN}✓ Pack successful: $tarball${NC}"
        
        # Check tarball contents
        echo -e "${CYAN}  Tarball contents:${NC}"
        tar -tzf "$tarball" | head -10
        echo "  ..."
        
        # Check size
        local size=$(du -h "$tarball" | cut -f1)
        echo -e "${CYAN}  Size: $size${NC}"
        
        # Cleanup
        rm "$tarball"
        
        return 0
    else
        echo -e "${RED}✗ Pack failed${NC}"
        return 1
    fi
}

# Function to test package installation
test_install() {
    local package_path="$1"
    local package_name=$(cd "$package_path" && node -p "require('./package.json').name")
    
    echo -e "${BLUE}Testing installation of $package_name...${NC}"
    
    # Create temporary test directory
    mkdir -p "$TEMP_DIR"
    cd "$TEMP_DIR"
    
    # Initialize test project
    cat > package.json << EOF
{
  "name": "test-install",
  "version": "1.0.0",
  "private": true
}
EOF
    
    # Try to install the package
    if npm install "$package_path" --registry="$LOCAL_REGISTRY"; then
        echo -e "${GREEN}✓ Installation successful${NC}"
        
        # Check if package is in node_modules
        if [ -d "node_modules/$package_name" ]; then
            echo -e "${GREEN}✓ Package found in node_modules${NC}"
        else
            echo -e "${RED}✗ Package not found in node_modules${NC}"
        fi
        
        # Cleanup
        cd "$ROOT_DIR"
        rm -rf "$TEMP_DIR"
        
        return 0
    else
        echo -e "${RED}✗ Installation failed${NC}"
        cd "$ROOT_DIR"
        rm -rf "$TEMP_DIR"
        return 1
    fi
}

# Function to test publish to local registry
test_publish() {
    local package_path="$1"
    local package_name=$(cd "$package_path" && node -p "require('./package.json').name")
    local package_version=$(cd "$package_path" && node -p "require('./package.json').version")
    
    echo -e "${BLUE}Testing publish of $package_name@$package_version to local registry...${NC}"
    
    cd "$package_path"
    
    # Configure for local registry
    npm config set registry "$LOCAL_REGISTRY"
    
    # Attempt dry run first
    echo -e "${CYAN}Running dry run...${NC}"
    if npm publish --dry-run --registry="$LOCAL_REGISTRY" 2>&1 | grep -q "npm notice"; then
        echo -e "${GREEN}✓ Dry run successful${NC}"
        
        # Now do actual publish
        echo -e "${CYAN}Publishing to local registry...${NC}"
        if npm publish --registry="$LOCAL_REGISTRY"; then
            echo -e "${GREEN}✓ Published successfully to local registry${NC}"
            
            # Verify it's available
            if npm view "$package_name@$package_version" --registry="$LOCAL_REGISTRY" >/dev/null 2>&1; then
                echo -e "${GREEN}✓ Package is available in local registry${NC}"
            else
                echo -e "${RED}✗ Package not found in local registry${NC}"
            fi
        else
            echo -e "${RED}✗ Publish failed${NC}"
        fi
    else
        echo -e "${RED}✗ Dry run failed${NC}"
    fi
    
    # Reset registry
    npm config set registry "https://registry.npmjs.org/"
}

# Function to run all tests for a package
test_package() {
    local package_path="$1"
    
    if [ ! -f "$package_path/package.json" ]; then
        echo -e "${RED}Error: No package.json found in $package_path${NC}"
        return 1
    fi
    
    local package_name=$(cd "$package_path" && node -p "require('./package.json').name")
    
    echo -e "\n${CYAN}========================================${NC}"
    echo -e "${CYAN}Testing package: $package_name${NC}"
    echo -e "${CYAN}Path: $package_path${NC}"
    echo -e "${CYAN}========================================${NC}\n"
    
    # Run tests
    local failures=0
    
    test_pack "$package_path" || ((failures++))
    echo ""
    
    test_install "$package_path" || ((failures++))
    echo ""
    
    test_publish "$package_path" || ((failures++))
    echo ""
    
    if [ $failures -eq 0 ]; then
        echo -e "${GREEN}✓ All tests passed for $package_name${NC}"
        return 0
    else
        echo -e "${RED}✗ $failures test(s) failed for $package_name${NC}"
        return 1
    fi
}

# Function to display usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS] [PACKAGE_PATH]

Test package publishing workflow locally before production

OPTIONS:
    -a, --all           Test all packages in workspace
    -p, --pack          Test only npm pack
    -i, --install       Test only installation
    -u, --publish       Test only publishing
    -h, --help          Show this help message

ARGUMENTS:
    PACKAGE_PATH        Path to package directory (default: current directory)

EXAMPLES:
    # Test current package
    $0

    # Test specific package
    $0 packages/mcp-common

    # Test all packages
    $0 --all

    # Test only packing
    $0 --pack packages/mcp-common

Prerequisites:
    1. Verdaccio must be running (use setup-local-registry.sh)
    2. Local NPM config must be set (use configure-npm-auth.sh --local)

EOF
    exit 1
}

# Parse arguments
TEST_ALL=false
TEST_PACK_ONLY=false
TEST_INSTALL_ONLY=false
TEST_PUBLISH_ONLY=false
PACKAGE_PATH="."

while [[ $# -gt 0 ]]; do
    case $1 in
        -a|--all)
            TEST_ALL=true
            shift
            ;;
        -p|--pack)
            TEST_PACK_ONLY=true
            shift
            ;;
        -i|--install)
            TEST_INSTALL_ONLY=true
            shift
            ;;
        -u|--publish)
            TEST_PUBLISH_ONLY=true
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

# Check Verdaccio
check_verdaccio

# Main execution
if [ "$TEST_ALL" = true ]; then
    echo -e "${BLUE}Testing all packages in workspace...${NC}"
    
    # Find all packages
    PACKAGES=(
        "tony"
        "packages/mcp-common"
        "packages/mcp-bookstack"
        "packages/mcp-gitea-remote"
        "packages/mcp-plane"
        "packages/mcp-woodpecker"
        "packages/mcp-integration"
        "mosaic-mcp"
    )
    
    total_failures=0
    for pkg in "${PACKAGES[@]}"; do
        if [ -d "$pkg" ] && [ -f "$pkg/package.json" ]; then
            test_package "$pkg" || ((total_failures++))
            echo -e "\n"
        fi
    done
    
    if [ $total_failures -eq 0 ]; then
        echo -e "\n${GREEN}✓ All packages passed testing${NC}"
    else
        echo -e "\n${RED}✗ $total_failures package(s) failed testing${NC}"
        exit 1
    fi
elif [ "$TEST_PACK_ONLY" = true ]; then
    test_pack "$PACKAGE_PATH"
elif [ "$TEST_INSTALL_ONLY" = true ]; then
    test_install "$PACKAGE_PATH"
elif [ "$TEST_PUBLISH_ONLY" = true ]; then
    test_publish "$PACKAGE_PATH"
else
    test_package "$PACKAGE_PATH"
fi