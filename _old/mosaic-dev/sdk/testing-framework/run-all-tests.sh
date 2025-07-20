#!/bin/bash
# Tony SDK - Unified Testing Script
# Runs comprehensive tests across all Tony Framework repositories

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

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Banner
show_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                Tony Framework SDK Testing                    ║
║             Comprehensive Test Suite Runner                  ║
╚══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Test summary
show_summary() {
    echo
    echo -e "${CYAN}📊 Test Summary${NC}"
    echo "==============="
    echo -e "Total Tests: ${TOTAL_TESTS}"
    echo -e "✅ Passed: ${GREEN}${PASSED_TESTS}${NC}"
    echo -e "❌ Failed: ${RED}${FAILED_TESTS}${NC}"
    echo -e "⏭️  Skipped: ${YELLOW}${SKIPPED_TESTS}${NC}"
    echo
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed!${NC}"
        return 0
    else
        echo -e "${RED}💥 Some tests failed!${NC}"
        return 1
    fi
}

# Run tests for a specific repository
run_repo_tests() {
    local repo_name="$1"
    local repo_path="$2"
    
    echo
    log_info "Testing $repo_name..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ ! -d "$repo_path" ]; then
        log_warning "$repo_name directory not found, skipping..."
        ((SKIPPED_TESTS++))
        return 0
    fi
    
    cd "$repo_path"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        log_warning "$repo_name has no package.json, skipping npm tests..."
        cd - > /dev/null
        ((SKIPPED_TESTS++))
        return 0
    fi
    
    # Check if test script exists
    if ! npm run | grep -q "test"; then
        log_warning "$repo_name has no test script defined, skipping..."
        cd - > /dev/null
        ((SKIPPED_TESTS++))
        return 0
    fi
    
    # Run tests
    log_info "Running $repo_name tests..."
    if npm test; then
        log_success "$repo_name tests passed"
        ((PASSED_TESTS++))
    else
        log_error "$repo_name tests failed"
        ((FAILED_TESTS++))
    fi
    
    ((TOTAL_TESTS++))
    cd - > /dev/null
}

# Run Tony Framework specific tests
test_tony_framework() {
    log_info "Running Tony Framework Core Tests..."
    
    run_repo_tests "Tony Framework" "framework-source/tony"
    
    # Run additional Tony-specific tests if they exist
    if [ -f "framework-source/tony/test-standalone.sh" ]; then
        log_info "Running Tony standalone tests..."
        cd framework-source/tony
        if bash test-standalone.sh; then
            log_success "Tony standalone tests passed"
            ((PASSED_TESTS++))
        else
            log_error "Tony standalone tests failed"
            ((FAILED_TESTS++))
        fi
        ((TOTAL_TESTS++))
        cd - > /dev/null
    fi
}

# Run Tony-MCP specific tests
test_tony_mcp() {
    log_info "Running Tony-MCP Tests..."
    
    run_repo_tests "Tony-MCP" "framework-source/tony-mcp"
    
    # Run MCP-specific integration tests
    log_info "Running MCP integration tests..."
    if test_mcp_integration; then
        log_success "MCP integration tests passed"
        ((PASSED_TESTS++))
    else
        log_error "MCP integration tests failed"
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))
}

# Run Tony-Dev testing framework tests
test_tony_dev() {
    log_info "Running Tony-Dev Testing Framework..."
    
    # Run the comprehensive testing framework tests
    run_repo_tests "Tony-Dev Testing Framework" "testing"
    
    # Run development tools tests
    if [ -d "framework-source/tony-dev/sdk/development-tools" ]; then
        run_repo_tests "Development Tools" "framework-source/tony-dev/sdk/development-tools"
    fi
}

# MCP integration test
test_mcp_integration() {
    log_info "Testing MCP server integration..."
    
    # Check if we can build a basic MCP container
    if [ -f "framework-source/tony-mcp/package.json" ]; then
        cd framework-source/tony-mcp
        
        # Try to build the project
        if npm run build 2>/dev/null; then
            log_success "MCP build successful"
            cd - > /dev/null
            return 0
        else
            log_warning "MCP build failed or no build script"
            cd - > /dev/null
            return 1
        fi
    else
        log_warning "MCP package.json not found"
        return 1
    fi
}

# Cross-repository integration tests
test_cross_repository_integration() {
    log_info "Running Cross-Repository Integration Tests..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Test 1: Version compatibility
    log_info "Testing version compatibility..."
    if test_version_compatibility; then
        log_success "Version compatibility test passed"
        ((PASSED_TESTS++))
    else
        log_error "Version compatibility test failed"
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))
    
    # Test 2: Repository structure
    log_info "Testing repository structure..."
    if test_repository_structure; then
        log_success "Repository structure test passed"
        ((PASSED_TESTS++))
    else
        log_error "Repository structure test failed"
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))
    
    # Test 3: SDK symlinks
    log_info "Testing SDK symlinks..."
    if test_sdk_symlinks; then
        log_success "SDK symlinks test passed"
        ((PASSED_TESTS++))
    else
        log_error "SDK symlinks test failed"
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))
}

# Version compatibility test
test_version_compatibility() {
    local tony_version=""
    local mcp_version=""
    local dev_version=""
    
    # Get versions
    if [ -f "framework-source/tony/VERSION" ]; then
        tony_version=$(cat framework-source/tony/VERSION)
    fi
    
    if [ -f "framework-source/tony-mcp/package.json" ]; then
        mcp_version=$(cd framework-source/tony-mcp && node -p "require('./package.json').version" 2>/dev/null)
    fi
    
    if [ -f "framework-source/tony-dev/VERSION" ]; then
        dev_version=$(cat framework-source/tony-dev/VERSION)
    fi
    
    log_info "Version check: Tony($tony_version) MCP($mcp_version) Dev($dev_version)"
    
    # Basic validation - ensure we have at least some version info
    if [ -n "$tony_version" ] || [ -n "$mcp_version" ] || [ -n "$dev_version" ]; then
        return 0
    else
        return 1
    fi
}

# Repository structure test
test_repository_structure() {
    local required_dirs=("framework-source/tony" "framework-source/tony-mcp" "framework-source/tony-dev")
    
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            log_error "Required directory missing: $dir"
            return 1
        fi
    done
    
    return 0
}

# SDK symlinks test
test_sdk_symlinks() {
    local required_links=("tools" "testing" "docs" "examples")
    
    for link in "${required_links[@]}"; do
        if [ ! -L "$link" ]; then
            log_error "Required symlink missing: $link"
            return 1
        fi
        
        if [ ! -e "$link" ]; then
            log_error "Symlink broken: $link"
            return 1
        fi
    done
    
    return 0
}

# Main execution
main() {
    # Check if we're in the right directory
    if [ ! -d "framework-source" ]; then
        log_error "Not in Tony SDK directory. Please run from SDK root."
        exit 1
    fi
    
    show_banner
    
    log_info "Starting comprehensive Tony Framework SDK test suite..."
    echo
    
    # Run repository-specific tests
    test_tony_framework
    test_tony_mcp
    test_tony_dev
    
    # Run cross-repository integration tests
    test_cross_repository_integration
    
    # Show summary and exit with appropriate code
    if show_summary; then
        exit 0
    else
        exit 1
    fi
}

# Execute main function
main "$@"