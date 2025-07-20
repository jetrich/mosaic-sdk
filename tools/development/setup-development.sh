#!/bin/bash
# Tony SDK Development Environment Setup
# Coordinates setup across all three repositories

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Utility functions
log_info() { echo -e "${BLUE}ℹ️${NC}  $1"; }
log_success() { echo -e "${GREEN}✅${NC}  $1"; }
log_warning() { echo -e "${YELLOW}⚠️${NC}  $1"; }
log_error() { echo -e "${RED}❌${NC}  $1"; }

# Banner
show_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                    Tony Framework SDK                        ║
║                Development Environment Setup                 ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Check if we're in the right directory
check_sdk_structure() {
    if [ ! -d "framework-source" ]; then
        log_error "Not in Tony SDK directory. Please run from SDK root."
        exit 1
    fi
    
    if [ ! -L "tools" ] || [ ! -L "testing" ]; then
        log_error "SDK symlinks not found. Please check SDK structure."
        exit 1
    fi
    
    log_success "Tony SDK directory structure verified"
}

# Setup Tony Framework repository
setup_tony_framework() {
    log_info "Setting up Tony Framework repository..."
    
    cd framework-source/tony
    
    # Check if it's a git repository
    if [ ! -d ".git" ]; then
        log_warning "Tony Framework not initialized as git repository"
        log_info "Initializing connection to jetrich/tony..."
        git init
        git remote add origin https://github.com/jetrich/tony.git
        git fetch origin
        git checkout -b main origin/main
    fi
    
    # Checkout or create feature branch for MCP integration
    if git show-ref --verify --quiet refs/heads/feature/mcp-integration; then
        git checkout feature/mcp-integration
        log_info "Switched to existing feature/mcp-integration branch"
    else
        git checkout -b feature/mcp-integration
        log_info "Created new feature/mcp-integration branch"
    fi
    
    # Install dependencies if package.json exists
    if [ -f "package.json" ]; then
        log_info "Installing Tony Framework dependencies..."
        npm install
    fi
    
    cd ../..
    log_success "Tony Framework setup complete"
}

# Setup Tony-MCP repository
setup_tony_mcp() {
    log_info "Setting up Tony-MCP repository..."
    
    cd framework-source/tony-mcp
    
    # Check if directory is empty (need to initialize)
    if [ -z "$(ls -A .)" ]; then
        log_info "Initializing Tony-MCP repository..."
        git init
        git remote add origin https://github.com/jetrich/tony-mcp.git
        
        # Create initial structure for beta development
        mkdir -p src/{server,tools,db,types}
        
        # Create basic package.json
        cat > package.json << 'EOF'
{
  "name": "@tony-framework/mcp",
  "version": "0.0.1-beta.1",
  "description": "Tony Framework MCP Coordination Server",
  "main": "dist/main.js",
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/server/main.ts",
    "test": "jest"
  },
  "keywords": ["tony-framework", "mcp", "coordination"],
  "author": "Tony Framework Team",
  "license": "MIT",
  "devDependencies": {
    "typescript": "^5.0.0",
    "ts-node": "^10.0.0",
    "@types/node": "^20.0.0",
    "jest": "^29.0.0"
  },
  "dependencies": {
    "sqlite3": "^5.1.6",
    "express": "^4.18.0"
  }
}
EOF
        
        # Create initial TypeScript config
        cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
        
        # Create basic MCP server entry point
        cat > src/server/main.ts << 'EOF'
// Tony Framework MCP Server v0.0.1-beta
console.log("Tony MCP Server starting...");
console.log("Version: 0.0.1-beta.1");
EOF
        
        git add .
        git commit -m "Initial Tony-MCP structure for beta development"
        
        log_info "Created initial Tony-MCP structure"
    fi
    
    # Checkout or create develop branch
    if git show-ref --verify --quiet refs/heads/develop; then
        git checkout develop
        log_info "Switched to existing develop branch"
    else
        git checkout -b develop
        log_info "Created new develop branch for beta development"
    fi
    
    # Install dependencies
    if [ -f "package.json" ]; then
        log_info "Installing Tony-MCP dependencies..."
        npm install
    fi
    
    cd ../..
    log_success "Tony-MCP setup complete"
}

# Setup Tony-Dev repository (already cloned)
setup_tony_dev() {
    log_info "Setting up Tony-Dev repository..."
    
    cd framework-source/tony-dev
    
    # Update to latest
    git fetch origin
    git checkout main
    git pull origin main
    
    # Install dependencies if package.json exists
    if [ -f "package.json" ]; then
        log_info "Installing Tony-Dev dependencies..."
        npm install
    fi
    
    # Setup testing framework dependencies
    if [ -f "sdk/testing-framework/package.json" ]; then
        cd sdk/testing-framework
        log_info "Installing testing framework dependencies..."
        npm install
        cd ../..
    fi
    
    # Setup development tools dependencies
    if [ -f "sdk/development-tools/package.json" ]; then
        cd sdk/development-tools
        log_info "Installing development tools dependencies..."
        npm install
        cd ../..
    fi
    
    cd ../..
    log_success "Tony-Dev setup complete"
}

# Create SDK-level coordination scripts
create_coordination_scripts() {
    log_info "Creating SDK coordination scripts..."
    
    # Create git status script for all repos
    cat > tools/git-status-all.sh << 'EOF'
#!/bin/bash
# Check git status across all Tony Framework repositories

echo "🔍 Git Status Across All Repositories"
echo "====================================="

repos=("tony" "tony-mcp" "tony-dev")
for repo in "${repos[@]}"; do
    echo
    echo "📁 $repo:"
    if [ -d "framework-source/$repo/.git" ]; then
        cd "framework-source/$repo"
        git status --short
        if [ $? -eq 0 ]; then
            current_branch=$(git branch --show-current)
            echo "   Branch: $current_branch"
        fi
        cd ../..
    else
        echo "   ❌ Not a git repository"
    fi
done
EOF
    
    chmod +x tools/git-status-all.sh
    
    # Create build script for all components
    cat > tools/build-all.sh << 'EOF'
#!/bin/bash
# Build all Tony Framework components

echo "🔨 Building All Tony Framework Components"
echo "========================================"

# Build Tony Framework (if it has build requirements)
echo "📁 Building Tony Framework..."
cd framework-source/tony
if [ -f "package.json" ]; then
    npm run build 2>/dev/null || echo "   No build script found"
fi
cd ../..

# Build Tony-MCP
echo "📁 Building Tony-MCP..."
cd framework-source/tony-mcp
if [ -f "package.json" ]; then
    npm run build 2>/dev/null || echo "   No build script found or dependencies not installed"
fi
cd ../..

# Build Tony-Dev tools
echo "📁 Building Tony-Dev Tools..."
cd framework-source/tony-dev
if [ -f "sdk/development-tools/package.json" ]; then
    cd sdk/development-tools
    npm run build 2>/dev/null || echo "   No build script found"
    cd ../..
fi
cd ../..

echo "✅ Build process complete"
EOF
    
    chmod +x tools/build-all.sh
    
    log_success "SDK coordination scripts created"
}

# Create version coordination script
create_version_coordination() {
    log_info "Creating version coordination tools..."
    
    cat > tools/version-sync.sh << 'EOF'
#!/bin/bash
# Synchronize and report versions across all repositories

echo "📊 Tony Framework Version Coordination"
echo "===================================="

# Get Tony Framework version
echo "🔍 Checking versions..."
echo

if [ -f "framework-source/tony/VERSION" ]; then
    TONY_VERSION=$(cat framework-source/tony/VERSION)
    echo "Tony Framework: $TONY_VERSION"
else
    echo "Tony Framework: Version file not found"
fi

if [ -f "framework-source/tony-mcp/package.json" ]; then
    MCP_VERSION=$(cd framework-source/tony-mcp && node -p "require('./package.json').version" 2>/dev/null)
    echo "Tony-MCP: $MCP_VERSION"
else
    echo "Tony-MCP: Package.json not found"
fi

if [ -f "framework-source/tony-dev/VERSION" ]; then
    DEV_VERSION=$(cat framework-source/tony-dev/VERSION)
    echo "Tony-Dev: $DEV_VERSION"
else
    echo "Tony-Dev: Version file not found"
fi

echo
echo "🎯 Version Compatibility Status"
echo "==============================="
echo "All components are in active development"
echo "Tony-MCP is in beta (0.0.x versions)"
echo "Integration testing recommended before releases"
EOF
    
    chmod +x tools/version-sync.sh
    
    log_success "Version coordination tools created"
}

# Main execution
main() {
    show_banner
    
    log_info "Initializing Tony Framework SDK development environment..."
    echo
    
    check_sdk_structure
    setup_tony_framework
    setup_tony_mcp
    setup_tony_dev
    create_coordination_scripts
    create_version_coordination
    
    echo
    log_success "Tony Framework SDK development environment ready!"
    echo
    echo -e "${CYAN}Next Steps:${NC}"
    echo "  • Run './tools/git-status-all.sh' to check repository status"
    echo "  • Run './tools/build-all.sh' to build all components"
    echo "  • Run './tools/version-sync.sh' to check version coordination"
    echo "  • See './testing/README.md' for testing information"
    echo
    echo -e "${YELLOW}Repository Branches:${NC}"
    echo "  • Tony Framework: feature/mcp-integration"
    echo "  • Tony-MCP: develop (beta v0.0.1+)"
    echo "  • Tony-Dev: main (latest tools)"
}

# Execute main function
main "$@"