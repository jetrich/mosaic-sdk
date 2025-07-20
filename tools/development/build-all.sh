#!/bin/bash
# Tony SDK - Comprehensive Build System
# Builds and validates all Tony Framework repositories

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

# Build results tracking
TOTAL_BUILDS=0
SUCCESSFUL_BUILDS=0
FAILED_BUILDS=0
SKIPPED_BUILDS=0

# Banner
show_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                Tony Framework SDK Builder                    ║
║              Comprehensive Build System                      ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Build summary
show_summary() {
    echo
    echo -e "${CYAN}🏗️  Build Summary${NC}"
    echo "=================="
    echo -e "Total Builds: ${TOTAL_BUILDS}"
    echo -e "✅ Successful: ${GREEN}${SUCCESSFUL_BUILDS}${NC}"
    echo -e "❌ Failed: ${RED}${FAILED_BUILDS}${NC}"
    echo -e "⏭️  Skipped: ${YELLOW}${SKIPPED_BUILDS}${NC}"
    echo
    
    if [ $FAILED_BUILDS -eq 0 ]; then
        echo -e "${GREEN}🎉 All builds successful!${NC}"
        return 0
    else
        echo -e "${RED}💥 Some builds failed!${NC}"
        return 1
    fi
}

# Build a specific repository component
build_component() {
    local component_name="$1"
    local component_path="$2"
    local build_type="${3:-standard}"
    
    echo
    log_info "Building $component_name..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ ! -d "$component_path" ]; then
        log_warning "$component_name directory not found, skipping..."
        ((SKIPPED_BUILDS++))
        return 0
    fi
    
    cd "$component_path"
    
    # Check for build requirements based on type
    case "$build_type" in
        "typescript")
            build_typescript_component "$component_name"
            ;;
        "node")
            build_node_component "$component_name"
            ;;
        "standard")
            build_standard_component "$component_name"
            ;;
        "framework")
            build_framework_component "$component_name"
            ;;
        *)
            log_warning "$component_name: Unknown build type, trying standard build..."
            build_standard_component "$component_name"
            ;;
    esac
    
    cd - > /dev/null
}

# Build TypeScript components
build_typescript_component() {
    local name="$1"
    
    if [ ! -f "package.json" ]; then
        log_warning "$name has no package.json, skipping..."
        ((SKIPPED_BUILDS++))
        return 0
    fi
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        log_info "Installing $name dependencies..."
        if npm install; then
            log_success "$name dependencies installed"
        else
            log_error "$name dependency installation failed"
            ((FAILED_BUILDS++))
            ((TOTAL_BUILDS++))
            return 1
        fi
    fi
    
    # Check if TypeScript build script exists
    if npm run | grep -q "build"; then
        log_info "Running TypeScript build for $name..."
        if npm run build; then
            log_success "$name TypeScript build successful"
            ((SUCCESSFUL_BUILDS++))
        else
            log_error "$name TypeScript build failed"
            ((FAILED_BUILDS++))
        fi
    else
        log_warning "$name has no build script, checking for tsc..."
        if command -v tsc > /dev/null && [ -f "tsconfig.json" ]; then
            log_info "Running direct TypeScript compilation for $name..."
            if tsc; then
                log_success "$name direct TypeScript build successful"
                ((SUCCESSFUL_BUILDS++))
            else
                log_error "$name direct TypeScript build failed"
                ((FAILED_BUILDS++))
            fi
        else
            log_warning "$name has no TypeScript build capability, skipping..."
            ((SKIPPED_BUILDS++))
            return 0
        fi
    fi
    
    ((TOTAL_BUILDS++))
}

# Build Node.js components
build_node_component() {
    local name="$1"
    
    if [ ! -f "package.json" ]; then
        log_warning "$name has no package.json, skipping..."
        ((SKIPPED_BUILDS++))
        return 0
    fi
    
    # Install dependencies
    log_info "Installing $name dependencies..."
    if npm install; then
        log_success "$name dependencies installed"
    else
        log_error "$name dependency installation failed"
        ((FAILED_BUILDS++))
        ((TOTAL_BUILDS++))
        return 1
    fi
    
    # Run build if available
    if npm run | grep -q "build"; then
        log_info "Running build for $name..."
        if npm run build; then
            log_success "$name build successful"
            ((SUCCESSFUL_BUILDS++))
        else
            log_error "$name build failed"
            ((FAILED_BUILDS++))
        fi
    else
        log_info "$name has no build script, dependencies only"
        ((SUCCESSFUL_BUILDS++))
    fi
    
    ((TOTAL_BUILDS++))
}

# Build standard components
build_standard_component() {
    local name="$1"
    
    # Check for different build systems
    if [ -f "package.json" ]; then
        build_node_component "$name"
    elif [ -f "Makefile" ]; then
        log_info "Running make for $name..."
        if make; then
            log_success "$name make build successful"
            ((SUCCESSFUL_BUILDS++))
        else
            log_error "$name make build failed"
            ((FAILED_BUILDS++))
        fi
        ((TOTAL_BUILDS++))
    elif [ -f "build.sh" ]; then
        log_info "Running build.sh for $name..."
        if bash build.sh; then
            log_success "$name build script successful"
            ((SUCCESSFUL_BUILDS++))
        else
            log_error "$name build script failed"
            ((FAILED_BUILDS++))
        fi
        ((TOTAL_BUILDS++))
    else
        log_warning "$name has no recognized build system, skipping..."
        ((SKIPPED_BUILDS++))
    fi
}

# Build framework-specific components
build_framework_component() {
    local name="$1"
    
    # Check for Tony Framework specific build requirements
    if [ -f "VERSION" ]; then
        local version=$(cat VERSION)
        log_info "$name version: $version"
    fi
    
    # Build any package.json based components
    if [ -f "package.json" ]; then
        build_node_component "$name"
    else
        log_info "$name is a framework component without build requirements"
        ((SUCCESSFUL_BUILDS++))
        ((TOTAL_BUILDS++))
    fi
}

# Validate build results
validate_builds() {
    log_info "Validating build results..."
    
    local validation_errors=0
    
    # Check Tony-MCP TypeScript compilation
    if [ -d "framework-source/tony-mcp/dist" ]; then
        log_success "Tony-MCP compilation artifacts found"
    elif [ -f "framework-source/tony-mcp/package.json" ]; then
        log_warning "Tony-MCP compiled but no dist directory found"
        ((validation_errors++))
    fi
    
    # Check for common build artifacts
    local repos=("tony" "tony-mcp" "tony-dev")
    for repo in "${repos[@]}"; do
        if [ -d "framework-source/$repo/node_modules" ]; then
            log_success "$repo dependencies installed"
        elif [ -f "framework-source/$repo/package.json" ]; then
            log_warning "$repo has package.json but no node_modules"
            ((validation_errors++))
        fi
    done
    
    if [ $validation_errors -eq 0 ]; then
        log_success "Build validation passed"
        return 0
    else
        log_warning "Build validation found $validation_errors issues"
        return 1
    fi
}

# Main execution
main() {
    # Check if we're in the right directory
    if [ ! -d "framework-source" ]; then
        log_error "Not in Tony SDK directory. Please run from SDK root."
        exit 1
    fi
    
    show_banner
    
    log_info "Starting comprehensive Tony Framework SDK build process..."
    echo
    
    # Build Tony Framework Core
    log_info "Building Tony Framework Core..."
    build_component "Tony Framework" "framework-source/tony" "framework"
    
    # Build Tony-MCP Server
    log_info "Building Tony-MCP Coordination Server..."
    build_component "Tony-MCP" "framework-source/tony-mcp" "typescript"
    
    # Build Tony-Dev Tools
    log_info "Building Tony-Dev Tools..."
    build_component "Tony-Dev Main" "framework-source/tony-dev" "standard"
    
    # Build Tony-Dev Testing Framework
    if [ -d "framework-source/tony-dev/sdk/testing-framework" ]; then
        build_component "Testing Framework" "framework-source/tony-dev/sdk/testing-framework" "node"
    fi
    
    # Build Tony-Dev Development Tools
    if [ -d "framework-source/tony-dev/sdk/development-tools" ]; then
        build_component "Development Tools" "framework-source/tony-dev/sdk/development-tools" "node"
    fi
    
    # Build Tony-Dev Migration Tools
    if [ -d "framework-source/tony-dev/sdk/migration-tools" ]; then
        build_component "Migration Tools" "framework-source/tony-dev/sdk/migration-tools" "node"
    fi
    
    # Build Tony-Dev Task Management
    if [ -d "framework-source/tony-dev/sdk/task-management" ]; then
        build_component "Task Management" "framework-source/tony-dev/sdk/task-management" "node"
    fi
    
    # Validate all builds
    echo
    validate_builds
    
    # Show summary and exit with appropriate code
    if show_summary; then
        echo
        echo -e "${CYAN}🚀 Next Steps:${NC}"
        echo "  • Run './testing/run-all-tests.sh' to validate builds"
        echo "  • Check './tools/version-sync.sh' for version compatibility"
        echo "  • Use './tools/git-status-all.sh' to check repository status"
        exit 0
    else
        echo
        echo -e "${RED}🔧 Troubleshooting:${NC}"
        echo "  • Check build logs above for specific error details"
        echo "  • Ensure all dependencies are available"
        echo "  • Run './tools/setup-development.sh' to reset environment"
        exit 1
    fi
}

# Execute main function
main "$@"