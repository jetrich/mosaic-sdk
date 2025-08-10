#!/bin/bash
# Setup Local NPM Registry with Verdaccio
# This allows testing package publishing without affecting production

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VERDACCIO_PORT=4873
VERDACCIO_CONFIG="conf/development/verdaccio/config.yaml"
VERDACCIO_STORAGE="$HOME/.local/share/verdaccio/storage"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Verdaccio
install_verdaccio() {
    echo -e "${BLUE}Installing Verdaccio...${NC}"
    
    if command_exists npm; then
        npm install -g verdaccio
        echo -e "${GREEN}✓ Verdaccio installed successfully${NC}"
    else
        echo -e "${RED}Error: npm not found. Please install Node.js first${NC}"
        exit 1
    fi
}

# Function to create Verdaccio configuration
create_config() {
    echo -e "${BLUE}Creating Verdaccio configuration...${NC}"
    
    mkdir -p "$(dirname "$VERDACCIO_CONFIG")"
    
    cat > "$VERDACCIO_CONFIG" << 'EOF'
# Verdaccio configuration for MosAIc SDK local testing

# Storage location
storage: ./storage

# Authentication
auth:
  htpasswd:
    file: ./htpasswd
    max_users: 1000

# Uplinks (proxy to npm)
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
    timeout: 60s

# Packages configuration
packages:
  '@mosaicstack/*':
    access: $all
    publish: $authenticated
    unpublish: $authenticated
    proxy: npmjs
  
  '@dyorfoundation/*':
    access: $all
    publish: $authenticated
    unpublish: $authenticated
    proxy: npmjs
  
  '**':
    access: $all
    publish: $authenticated
    unpublish: $authenticated
    proxy: npmjs

# Server configuration
server:
  keepAliveTimeout: 60

# Middleware
middlewares:
  audit:
    enabled: true

# Log settings
logs:
  - {type: stdout, format: pretty, level: http}

# Listen
listen: localhost:4873

# Web UI
web:
  enable: true
  title: MosAIc Local Registry
  gravatar: true
  sort_packages: asc

# Security
security:
  api:
    jwt:
      sign:
        expiresIn: 60d
        notBefore: 1
  web:
    sign:
      expiresIn: 7d

# Max body size
max_body_size: 100mb
EOF

    echo -e "${GREEN}✓ Verdaccio configuration created${NC}"
}

# Function to start Verdaccio
start_verdaccio() {
    echo -e "${BLUE}Starting Verdaccio...${NC}"
    
    # Check if already running
    if lsof -Pi :$VERDACCIO_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠ Verdaccio is already running on port $VERDACCIO_PORT${NC}"
        return 0
    fi
    
    # Start in background
    nohup verdaccio --config "$VERDACCIO_CONFIG" > verdaccio.log 2>&1 &
    VERDACCIO_PID=$!
    
    # Wait for startup
    sleep 3
    
    # Check if started successfully
    if lsof -Pi :$VERDACCIO_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Verdaccio started successfully (PID: $VERDACCIO_PID)${NC}"
        echo -e "${BLUE}  Web UI: http://localhost:$VERDACCIO_PORT${NC}"
        echo -e "${BLUE}  Registry: http://localhost:$VERDACCIO_PORT${NC}"
        
        # Save PID for later
        echo $VERDACCIO_PID > .verdaccio.pid
    else
        echo -e "${RED}✗ Failed to start Verdaccio${NC}"
        echo -e "${YELLOW}Check verdaccio.log for details${NC}"
        exit 1
    fi
}

# Function to stop Verdaccio
stop_verdaccio() {
    echo -e "${BLUE}Stopping Verdaccio...${NC}"
    
    if [ -f .verdaccio.pid ]; then
        PID=$(cat .verdaccio.pid)
        if kill -0 $PID 2>/dev/null; then
            kill $PID
            rm .verdaccio.pid
            echo -e "${GREEN}✓ Verdaccio stopped${NC}"
        else
            echo -e "${YELLOW}⚠ Verdaccio not running (stale PID file)${NC}"
            rm .verdaccio.pid
        fi
    else
        # Try to find by port
        PID=$(lsof -Pi :$VERDACCIO_PORT -sTCP:LISTEN -t 2>/dev/null || true)
        if [ -n "$PID" ]; then
            kill $PID
            echo -e "${GREEN}✓ Verdaccio stopped${NC}"
        else
            echo -e "${YELLOW}⚠ Verdaccio not running${NC}"
        fi
    fi
}

# Function to create test user
create_test_user() {
    echo -e "${BLUE}Creating test user for Verdaccio...${NC}"
    
    # Wait for Verdaccio to be ready
    sleep 2
    
    # Create user using npm
    npm adduser --registry http://localhost:$VERDACCIO_PORT <<EOF
testuser
testpassword
test@mosaicstack.dev
EOF
    
    echo -e "${GREEN}✓ Test user created${NC}"
    echo -e "${YELLOW}  Username: testuser${NC}"
    echo -e "${YELLOW}  Password: testpassword${NC}"
}

# Function to display usage
usage() {
    cat << EOF
Usage: $0 [COMMAND]

Setup and manage local NPM registry for testing package publishing

COMMANDS:
    start       Start Verdaccio local registry
    stop        Stop Verdaccio local registry
    restart     Restart Verdaccio local registry
    status      Check if Verdaccio is running
    install     Install Verdaccio globally
    setup       Complete setup (install, configure, start)
    help        Show this help message

EXAMPLES:
    # Complete setup
    $0 setup

    # Start registry
    $0 start

    # Check status
    $0 status

EOF
    exit 1
}

# Parse command
COMMAND="${1:-help}"

case $COMMAND in
    install)
        install_verdaccio
        ;;
    start)
        create_config
        start_verdaccio
        ;;
    stop)
        stop_verdaccio
        ;;
    restart)
        stop_verdaccio
        sleep 1
        start_verdaccio
        ;;
    status)
        if lsof -Pi :$VERDACCIO_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "${GREEN}✓ Verdaccio is running on http://localhost:$VERDACCIO_PORT${NC}"
        else
            echo -e "${RED}✗ Verdaccio is not running${NC}"
        fi
        ;;
    setup)
        # Check if Verdaccio is installed
        if ! command_exists verdaccio; then
            install_verdaccio
        fi
        create_config
        start_verdaccio
        create_test_user
        
        echo -e "\n${GREEN}✓ Local registry setup complete!${NC}"
        echo -e "${BLUE}To use the local registry:${NC}"
        echo -e "  1. Run: ${YELLOW}./scripts/utilities/setup/configure-npm-auth.sh --local${NC}"
        echo -e "  2. Publish: ${YELLOW}npm publish --registry=http://localhost:$VERDACCIO_PORT${NC}"
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        usage
        ;;
esac