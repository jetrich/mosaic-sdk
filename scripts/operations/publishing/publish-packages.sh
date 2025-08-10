#!/bin/bash

# MosAIc SDK Package Publishing Script
# Publishes all packages to @mosaicstack NPM organization

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DRY_RUN=${DRY_RUN:-false}
PUBLISH_TAG=${PUBLISH_TAG:-latest}
FORCE_PUBLISH=${FORCE_PUBLISH:-false}

echo -e "${BLUE}=== MosAIc SDK Package Publishing ===${NC}"
echo "Dry run: $DRY_RUN"
echo "Tag: $PUBLISH_TAG"
echo "Force: $FORCE_PUBLISH"
echo ""

# Check registry configuration
REGISTRY=$(npm config get registry)
echo -e "${BLUE}Publishing to registry: $REGISTRY${NC}"

# Check NPM authentication (skip for local registry)
if [[ "$REGISTRY" == "http://localhost:4873/"* ]]; then
    echo -e "${YELLOW}⚠️  Using local Verdaccio registry - skipping authentication checks${NC}"
else
    echo -e "${BLUE}Checking NPM authentication...${NC}"
    if ! npm whoami > /dev/null 2>&1; then
        echo -e "${RED}❌ Not logged into NPM. Please run 'npm login'${NC}"
        exit 1
    fi

    NPM_USER=$(npm whoami)
    echo -e "${GREEN}✅ Logged in as: $NPM_USER${NC}"

    # Check organization access
    echo -e "${BLUE}Checking @mosaicstack organization access...${NC}"
    if ! npm org ls @mosaicstack > /dev/null 2>&1; then
        echo -e "${RED}❌ No access to @mosaicstack organization${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Organization access confirmed${NC}"
fi

# Build all packages
echo -e "${BLUE}Building all packages...${NC}"
npm run build:all
echo -e "${GREEN}✅ Build completed${NC}"

# Package directories
PACKAGES=(
    "packages/config"
    "packages/providers" 
    "packages/cli"
    "packages/stack"
)

# Function to publish a package
publish_package() {
    local package_dir=$1
    local package_name=$(node -p "require('./$package_dir/package.json').name")
    local package_version=$(node -p "require('./$package_dir/package.json').version")
    
    echo -e "${BLUE}Publishing $package_name@$package_version...${NC}"
    
    # Check if version already exists
    if npm view "$package_name@$package_version" version > /dev/null 2>&1; then
        if [ "$FORCE_PUBLISH" = "false" ]; then
            echo -e "${YELLOW}⚠️  Version $package_version already exists. Skipping.${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  Version $package_version exists but force publishing...${NC}"
        fi
    fi
    
    cd "$package_dir"
    
    if [ "$DRY_RUN" = "true" ]; then
        echo -e "${YELLOW}🔍 DRY RUN: Would publish $package_name@$package_version${NC}"
        npm publish --dry-run --tag "$PUBLISH_TAG"
    else
        npm publish --tag "$PUBLISH_TAG"
        echo -e "${GREEN}✅ Published $package_name@$package_version${NC}"
    fi
    
    cd - > /dev/null
}

# Publish each package
echo -e "${BLUE}Publishing packages...${NC}"
for package_dir in "${PACKAGES[@]}"; do
    if [ -d "$package_dir" ] && [ -f "$package_dir/package.json" ]; then
        publish_package "$package_dir"
    else
        echo -e "${RED}❌ Package directory not found: $package_dir${NC}"
        exit 1
    fi
done

echo ""
echo -e "${GREEN}🎉 Package publishing completed!${NC}"

# Show published packages
echo -e "${BLUE}Published packages:${NC}"
for package_dir in "${PACKAGES[@]}"; do
    if [ -f "$package_dir/package.json" ]; then
        package_name=$(node -p "require('./$package_dir/package.json').name")
        package_version=$(node -p "require('./$package_dir/package.json').version")
        echo "  📦 $package_name@$package_version"
    fi
done

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Verify packages at: https://www.npmjs.com/org/mosaicstack"
echo "  2. Test installation: npm install @mosaicstack/config"
echo "  3. Update documentation with new versions"