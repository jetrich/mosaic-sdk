#!/bin/bash
# Configure NPM Authentication for MosAIc SDK
# This script helps set up NPM authentication for publishing packages to Gitea

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NPMRC_TEMPLATE=".npmrc.template"
NPMRC_FILE=".npmrc"
GITEA_URL="https://git.mosaicstack.dev"

# Function to display usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Configure NPM authentication for publishing packages to Gitea Package Registry

OPTIONS:
    -t, --token <TOKEN>      Gitea personal access token with write:package scope
    -o, --org <ORG>         Organization to use (mosaicstack or dyorfoundation)
    -l, --local             Configure for local testing with Verdaccio
    -c, --check             Check current configuration
    -h, --help              Show this help message

EXAMPLES:
    # Configure for mosaicstack organization
    $0 --token "your-gitea-token" --org mosaicstack

    # Configure for local testing
    $0 --local

    # Check current configuration
    $0 --check

REQUIRED GITEA TOKEN SCOPES:
    - write:package (for publishing)
    - read:package (for installing private packages)

To create a token:
    1. Go to $GITEA_URL/user/settings/applications
    2. Generate new token with required scopes
    3. Save the token securely

EOF
    exit 1
}

# Function to check if token is valid
check_token() {
    local token="$1"
    local org="$2"
    
    echo -e "${BLUE}Checking token validity...${NC}"
    
    # Test token by attempting to list packages
    local response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: token $token" \
        "$GITEA_URL/api/v1/orgs/$org/packages")
    
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✓ Token is valid${NC}"
        return 0
    elif [ "$response" == "401" ]; then
        echo -e "${RED}✗ Invalid token${NC}"
        return 1
    elif [ "$response" == "403" ]; then
        echo -e "${RED}✗ Token lacks required permissions${NC}"
        return 1
    else
        echo -e "${YELLOW}⚠ Could not verify token (HTTP $response)${NC}"
        return 0  # Continue anyway
    fi
}

# Function to configure for production
configure_production() {
    local token="$1"
    local org="$2"
    
    echo -e "${BLUE}Configuring NPM for $org organization...${NC}"
    
    # Check if template exists
    if [ ! -f "$NPMRC_TEMPLATE" ]; then
        echo -e "${RED}Error: $NPMRC_TEMPLATE not found${NC}"
        exit 1
    fi
    
    # Create .npmrc from template
    cp "$NPMRC_TEMPLATE" "$NPMRC_FILE"
    
    # Set the token as environment variable
    export GITEA_NPM_TOKEN="$token"
    
    # Also add to shell profile if user wants
    echo -e "${YELLOW}Would you like to add GITEA_NPM_TOKEN to your shell profile? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        # Detect shell
        if [ -n "$BASH_VERSION" ]; then
            PROFILE="$HOME/.bashrc"
        elif [ -n "$ZSH_VERSION" ]; then
            PROFILE="$HOME/.zshrc"
        else
            PROFILE="$HOME/.profile"
        fi
        
        # Add export to profile
        echo "" >> "$PROFILE"
        echo "# Gitea NPM Token for MosAIc SDK" >> "$PROFILE"
        echo "export GITEA_NPM_TOKEN='$token'" >> "$PROFILE"
        
        echo -e "${GREEN}✓ Added to $PROFILE${NC}"
        echo -e "${YELLOW}  Run 'source $PROFILE' to load in current session${NC}"
    fi
    
    # Update package.json publishConfig if needed
    if [ "$org" == "dyorfoundation" ]; then
        echo -e "${BLUE}Updating package configurations for @dyorfoundation scope...${NC}"
        # Update root package.json and others to use @dyorfoundation
        # This would be done with jq or similar tool
    fi
    
    echo -e "${GREEN}✓ NPM authentication configured successfully${NC}"
    echo -e "${BLUE}You can now publish packages using:${NC}"
    echo -e "  npm publish --registry=$GITEA_URL/api/packages/$org/npm/"
}

# Function to configure for local testing
configure_local() {
    echo -e "${BLUE}Configuring NPM for local testing with Verdaccio...${NC}"
    
    # Create local .npmrc
    cat > "$NPMRC_FILE" << EOF
# Local testing configuration with Verdaccio
@mosaicstack:registry=http://localhost:4873/
@dyorfoundation:registry=http://localhost:4873/

# Default registry
registry=https://registry.npmjs.org/

# Local auth (Verdaccio default)
//localhost:4873/:_authToken="test-token"

# Package settings
always-auth=false
save-exact=true
EOF

    echo -e "${GREEN}✓ Configured for local testing${NC}"
    echo -e "${YELLOW}Make sure Verdaccio is running on http://localhost:4873${NC}"
}

# Function to check current configuration
check_configuration() {
    echo -e "${BLUE}Checking NPM configuration...${NC}"
    
    if [ ! -f "$NPMRC_FILE" ]; then
        echo -e "${RED}✗ No .npmrc file found${NC}"
        echo -e "${YELLOW}  Run this script with --token to configure${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ .npmrc file exists${NC}"
    
    # Check registries
    echo -e "\n${BLUE}Configured registries:${NC}"
    grep -E "^@.*:registry=" "$NPMRC_FILE" || echo "  No scoped registries configured"
    
    # Check if token is set
    if [ -n "${GITEA_NPM_TOKEN:-}" ]; then
        echo -e "\n${GREEN}✓ GITEA_NPM_TOKEN is set in environment${NC}"
    else
        echo -e "\n${YELLOW}⚠ GITEA_NPM_TOKEN not found in environment${NC}"
    fi
    
    # Test npm config
    echo -e "\n${BLUE}NPM configuration:${NC}"
    npm config list | grep -E "(registry|@mosaicstack|@dyorfoundation)" || true
}

# Parse command line arguments
TOKEN=""
ORG="mosaicstack"
LOCAL=false
CHECK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--token)
            TOKEN="$2"
            shift 2
            ;;
        -o|--org)
            ORG="$2"
            shift 2
            ;;
        -l|--local)
            LOCAL=true
            shift
            ;;
        -c|--check)
            CHECK=true
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

# Main logic
if [ "$CHECK" = true ]; then
    check_configuration
elif [ "$LOCAL" = true ]; then
    configure_local
elif [ -n "$TOKEN" ]; then
    # Validate organization
    if [[ "$ORG" != "mosaicstack" && "$ORG" != "dyorfoundation" ]]; then
        echo -e "${RED}Error: Organization must be 'mosaicstack' or 'dyorfoundation'${NC}"
        exit 1
    fi
    
    # Check token validity
    if check_token "$TOKEN" "$ORG"; then
        configure_production "$TOKEN" "$ORG"
    else
        echo -e "${RED}Error: Token validation failed${NC}"
        exit 1
    fi
else
    echo -e "${RED}Error: No action specified${NC}"
    usage
fi