#!/bin/bash

# Docker Compose v2 Migration Tests
# Test-first development approach for validating docker compose v2 functionality

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TEST_DETAILS=""

# Log functions
log_test() {
    echo -e "\n🧪 TEST: $1"
}

log_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((TESTS_PASSED++))
    TEST_DETAILS="${TEST_DETAILS}\n✅ PASS: $1"
}

log_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((TESTS_FAILED++))
    TEST_DETAILS="${TEST_DETAILS}\n❌ FAIL: $1"
}

log_info() {
    echo -e "${YELLOW}ℹ️  INFO${NC}: $1"
}

# Test 1: Verify docker compose v2 is available
test_docker_compose_v2_available() {
    log_test "Docker Compose v2 Availability"
    
    if docker compose version >/dev/null 2>&1; then
        local version=$(docker compose version --short 2>/dev/null || echo "unknown")
        log_pass "Docker Compose v2 is available (version: $version)"
        return 0
    else
        log_fail "Docker Compose v2 is not available"
        return 1
    fi
}

# Test 2: Check for deprecated docker-compose command usage
test_no_deprecated_commands() {
    log_test "Deprecated docker-compose Command Usage"
    
    local deprecated_found=false
    local files_with_deprecated=()
    
    # Search for docker-compose usage in scripts
    while IFS= read -r -d '' file; do
        if grep -q "docker-compose" "$file" 2>/dev/null; then
            deprecated_found=true
            files_with_deprecated+=("$file")
        fi
    done < <(find /home/jwoltje/src/tony-ng -type f \( -name "*.sh" -o -name "*.bash" -o -name "Makefile" -o -name "*.mk" \) -print0 2>/dev/null)
    
    # Check docker-compose.yml specifically
    if [ -f "/home/jwoltje/src/tony-ng/tony-ng/docker-compose.yml" ]; then
        if grep -q "docker-compose" "/home/jwoltje/src/tony-ng/tony-ng/docker-compose.yml" 2>/dev/null; then
            deprecated_found=true
            files_with_deprecated+=("/home/jwoltje/src/tony-ng/tony-ng/docker-compose.yml")
        fi
    fi
    
    if [ "$deprecated_found" = false ]; then
        log_pass "No deprecated 'docker-compose' commands found"
        return 0
    else
        log_fail "Found deprecated 'docker-compose' usage in ${#files_with_deprecated[@]} file(s):"
        for file in "${files_with_deprecated[@]}"; do
            echo "  - $file"
        done
        return 1
    fi
}

# Test 3: Validate docker-compose.yml syntax with v2
test_compose_file_syntax() {
    log_test "Docker Compose File Syntax Validation"
    
    local compose_file="/home/jwoltje/src/tony-ng/tony-ng/docker-compose.yml"
    
    if [ ! -f "$compose_file" ]; then
        log_fail "docker-compose.yml not found at: $compose_file"
        return 1
    fi
    
    if docker compose -f "$compose_file" config >/dev/null 2>&1; then
        log_pass "docker-compose.yml has valid syntax for v2"
        return 0
    else
        log_fail "docker-compose.yml has invalid syntax for v2"
        docker compose -f "$compose_file" config 2>&1 | head -20
        return 1
    fi
}

# Test 4: Check docker-utils.sh for correct configuration
test_docker_utils_configuration() {
    log_test "Docker Utils Configuration"
    
    local utils_file="/home/jwoltje/src/tony-ng/scripts/shared/docker-utils.sh"
    
    if [ ! -f "$utils_file" ]; then
        log_fail "docker-utils.sh not found"
        return 1
    fi
    
    # Check if DEPRECATED_DOCKER_COMPOSE_CMD is correctly set
    if grep -q 'DEPRECATED_DOCKER_COMPOSE_CMD="docker-compose"' "$utils_file"; then
        log_pass "docker-utils.sh correctly identifies 'docker-compose' as deprecated"
        return 0
    else
        log_fail "docker-utils.sh has incorrect deprecated command configuration"
        grep "DEPRECATED_DOCKER_COMPOSE_CMD" "$utils_file" || echo "Pattern not found"
        return 1
    fi
}

# Test 5: Verify all scripts use correct docker compose command
test_scripts_use_correct_command() {
    log_test "Scripts Use Correct Docker Compose Command"
    
    local correct_usage=true
    local files_checked=0
    
    # Check all shell scripts for docker compose usage
    while IFS= read -r -d '' file; do
        ((files_checked++))
        # Skip checking for docker-compose (deprecated) - that's a separate test
        # Here we check if they use "docker compose" when they should
        if grep -q "docker.*compose" "$file" 2>/dev/null; then
            # Make sure it's "docker compose" not "docker-compose"
            if grep -E "docker\s+compose" "$file" >/dev/null 2>&1; then
                : # Correct usage
            elif grep -q "docker-compose" "$file" 2>/dev/null; then
                correct_usage=false
                log_info "Incorrect usage in: $file"
            fi
        fi
    done < <(find /home/jwoltje/src/tony-ng -type f -name "*.sh" -print0 2>/dev/null)
    
    if [ "$correct_usage" = true ]; then
        log_pass "All scripts use correct 'docker compose' command format (checked $files_checked files)"
        return 0
    else
        log_fail "Some scripts use incorrect docker compose command format"
        return 1
    fi
}

# Test 6: Verify docker compose commands work
test_docker_compose_commands() {
    log_test "Docker Compose v2 Commands Functionality"
    
    local compose_file="/home/jwoltje/src/tony-ng/tony-ng/docker-compose.yml"
    
    # Test config command
    if docker compose -f "$compose_file" config --services >/dev/null 2>&1; then
        log_pass "docker compose config command works"
    else
        log_fail "docker compose config command failed"
        return 1
    fi
    
    # Test version command
    if docker compose version >/dev/null 2>&1; then
        log_pass "docker compose version command works"
    else
        log_fail "docker compose version command failed"
        return 1
    fi
    
    return 0
}

# Generate test report
generate_test_report() {
    local report_file="/home/jwoltje/src/tony-ng/test-evidence/phase-1/docker-migration/test-results-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# Docker Compose v2 Migration Test Results

**Date**: $(date)
**Total Tests**: $((TESTS_PASSED + TESTS_FAILED))
**Passed**: $TESTS_PASSED
**Failed**: $TESTS_FAILED

## Test Summary

$(echo -e "$TEST_DETAILS")

## Docker Environment

### Docker Version
\`\`\`
$(docker --version 2>&1 || echo "Docker not available")
\`\`\`

### Docker Compose Version
\`\`\`
$(docker compose version 2>&1 || echo "Docker Compose v2 not available")
\`\`\`

### Legacy docker-compose Version (if present)
\`\`\`
$(docker-compose --version 2>&1 || echo "docker-compose (v1) not found")
\`\`\`

## Recommendations

$(if [ $TESTS_FAILED -gt 0 ]; then
    echo "### Actions Required:"
    echo "1. Install Docker Compose v2 if not available"
    echo "2. Update all scripts to use 'docker compose' instead of 'docker-compose'"
    echo "3. Fix docker-utils.sh configuration"
    echo "4. Validate docker-compose.yml syntax"
else
    echo "✅ All tests passed! Docker Compose v2 migration is complete."
fi)
EOF
    
    echo -e "\n📊 Test report generated: $report_file"
}

# Main execution
main() {
    echo "🔧 Docker Compose v2 Migration Test Suite"
    echo "========================================"
    echo "Testing Docker Compose v2 compatibility and migration status"
    
    # Run all tests
    test_docker_compose_v2_available
    test_no_deprecated_commands
    test_compose_file_syntax
    test_docker_utils_configuration
    test_scripts_use_correct_command
    test_docker_compose_commands
    
    # Summary
    echo -e "\n========================================"
    echo "Test Results Summary:"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    
    # Generate report
    generate_test_report
    
    # Exit with appropriate code
    if [ $TESTS_FAILED -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Run main
main