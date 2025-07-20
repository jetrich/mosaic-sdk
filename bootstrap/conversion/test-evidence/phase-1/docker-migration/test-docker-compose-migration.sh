#!/bin/bash

# Comprehensive test suite for Docker Compose v2 migration
# Tests all identified files and validates the migration

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test tracking
TESTS_PASSED=0
TESTS_FAILED=0
FILES_FIXED=0
FILES_TO_FIX=()

# Log functions
log_test() {
    echo -e "\n${BLUE}🧪 TEST:${NC} $1"
}

log_pass() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
    ((TESTS_PASSED++))
}

log_fail() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    ((TESTS_FAILED++))
}

log_info() {
    echo -e "${YELLOW}ℹ️  INFO:${NC} $1"
}

# Test individual file for docker-compose usage
test_file_for_deprecated_usage() {
    local file="$1"
    local file_name=$(basename "$file")
    
    if [ ! -f "$file" ]; then
        log_info "File not found: $file"
        return 2
    fi
    
    if grep -q "docker-compose" "$file" 2>/dev/null; then
        log_fail "$file_name contains deprecated 'docker-compose'"
        FILES_TO_FIX+=("$file")
        
        # Show occurrences
        echo "  Occurrences:"
        grep -n "docker-compose" "$file" | head -5 | while read -r line; do
            echo "    Line $line"
        done
        
        return 1
    else
        log_pass "$file_name uses correct 'docker compose' or no compose commands"
        return 0
    fi
}

# Test docker-utils.sh configuration
test_docker_utils_config() {
    log_test "Docker Utils Configuration"
    
    local utils_file="/home/jwoltje/src/tony-ng/scripts/shared/docker-utils.sh"
    
    if [ ! -f "$utils_file" ]; then
        log_fail "docker-utils.sh not found"
        return 1
    fi
    
    # Check DEPRECATED_DOCKER_COMPOSE_CMD is set correctly
    local deprecated_cmd=$(grep 'DEPRECATED_DOCKER_COMPOSE_CMD=' "$utils_file" | cut -d'"' -f2)
    
    if [ "$deprecated_cmd" = "docker-compose" ]; then
        log_pass "docker-utils.sh correctly identifies 'docker-compose' as deprecated"
        return 0
    else
        log_fail "docker-utils.sh has incorrect deprecated command: '$deprecated_cmd' (should be 'docker-compose')"
        FILES_TO_FIX+=("$utils_file")
        return 1
    fi
}

# Test all identified files
test_all_files() {
    log_test "Testing all files for deprecated docker-compose usage"
    
    # Critical files to test
    local files_to_test=(
        "/home/jwoltje/src/tony-ng/tony-ng/package.json"
        "/home/jwoltje/src/tony-ng/tony-ng/README.md"
        "/home/jwoltje/src/tony-ng/tony-ng/scripts/test-runner.sh"
        "/home/jwoltje/src/tony-ng/tony-ng/scripts/backup.sh"
        "/home/jwoltje/src/tony-ng/tony-ng/deploy.sh"
        "/home/jwoltje/src/tony-ng/scripts/shared/docker-utils.sh"
        "/home/jwoltje/src/tony-ng/tony-ng/infrastructure/backup-recovery/README.md"
        "/home/jwoltje/src/tony-ng/tony-ng/infrastructure/backup-recovery/docs/recovery-procedures.md"
        "/home/jwoltje/src/tony-ng/tony-ng/docs/deployment/README.md"
        "/home/jwoltje/src/tony-ng/tony-ng/docs/developer-guide/setup/development-environment.md"
        "/home/jwoltje/src/tony-ng/tony-ng/docs/developer-guide/README.md"
    )
    
    for file in "${files_to_test[@]}"; do
        test_file_for_deprecated_usage "$file"
    done
}

# Test Docker Compose v2 availability
test_docker_compose_v2() {
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

# Test that docker compose commands work
test_docker_compose_functionality() {
    log_test "Docker Compose v2 Command Functionality"
    
    local compose_file="/home/jwoltje/src/tony-ng/tony-ng/docker-compose.yml"
    
    if [ ! -f "$compose_file" ]; then
        log_fail "docker-compose.yml not found"
        return 1
    fi
    
    # Test config command
    if docker compose -f "$compose_file" config --services >/dev/null 2>&1; then
        log_pass "docker compose config command works"
    else
        log_fail "docker compose config command failed"
        return 1
    fi
    
    # Test that deprecated command would fail (if it exists)
    if command -v docker-compose >/dev/null 2>&1; then
        log_info "Legacy docker-compose v1 is installed - this should be uninstalled"
    else
        log_pass "Legacy docker-compose v1 is not installed (good)"
    fi
    
    return 0
}

# Generate detailed report
generate_detailed_report() {
    local report_file="/home/jwoltje/src/tony-ng/test-evidence/phase-1/docker-migration/migration-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# Docker Compose v2 Migration Report

**Date**: $(date)
**Total Tests**: $((TESTS_PASSED + TESTS_FAILED))
**Passed**: $TESTS_PASSED
**Failed**: $TESTS_FAILED
**Files Requiring Fixes**: ${#FILES_TO_FIX[@]}

## Executive Summary

$(if [ $TESTS_FAILED -eq 0 ]; then
    echo "✅ **All tests passed!** The Tony-NG project is fully compliant with Docker Compose v2."
else
    echo "❌ **Migration required!** Found $TESTS_FAILED issues that need to be fixed."
fi)

## Test Results

### Docker Compose v2 Availability
- Docker Compose v2: $(docker compose version 2>&1 || echo "Not available")
- Legacy docker-compose: $(docker-compose --version 2>&1 || echo "Not installed")

### Files Requiring Updates

$(if [ ${#FILES_TO_FIX[@]} -gt 0 ]; then
    echo "The following files contain deprecated 'docker-compose' commands:"
    echo ""
    for file in "${FILES_TO_FIX[@]}"; do
        echo "- \`$file\`"
        echo "  - Occurrences: $(grep -c "docker-compose" "$file" 2>/dev/null || echo "0")"
    done
else
    echo "No files require updates - all are compliant with Docker Compose v2."
fi)

## Migration Commands

### Automated Fix Commands

\`\`\`bash
# Fix package.json
sed -i 's/docker-compose/docker compose/g' /home/jwoltje/src/tony-ng/tony-ng/package.json

# Fix docker-utils.sh
sed -i 's/DEPRECATED_DOCKER_COMPOSE_CMD="docker compose"/DEPRECATED_DOCKER_COMPOSE_CMD="docker-compose"/g' /home/jwoltje/src/tony-ng/scripts/shared/docker-utils.sh

# Fix all shell scripts
find /home/jwoltje/src/tony-ng -name "*.sh" -type f -exec sed -i 's/docker-compose/docker compose/g' {} +

# Fix all markdown files
find /home/jwoltje/src/tony-ng -name "*.md" -type f -exec sed -i 's/docker-compose/docker compose/g' {} +

# Fix all YAML files
find /home/jwoltje/src/tony-ng -name "*.yml" -o -name "*.yaml" -type f -exec sed -i 's/docker-compose/docker compose/g' {} +
\`\`\`

### Manual Verification Commands

\`\`\`bash
# Verify no deprecated usage remains
grep -r "docker-compose" /home/jwoltje/src/tony-ng --include="*.sh" --include="*.json" --include="*.md" --include="*.yml" --include="*.yaml"

# Test Docker Compose v2
docker compose version
docker compose -f /home/jwoltje/src/tony-ng/tony-ng/docker-compose.yml config
\`\`\`

## Recommendations

1. **Immediate Actions**:
   - Run the automated fix commands above
   - Test all Docker Compose functionality
   - Update CI/CD pipelines if necessary

2. **Best Practices**:
   - Always use \`docker compose\` (with space) for v2
   - Remove any legacy docker-compose v1 installations
   - Update documentation to reflect v2 usage
   - Add pre-commit hooks to prevent regression

3. **Testing**:
   - Run full test suite after migration
   - Verify all services start correctly
   - Test backup and restore procedures

## Compliance Status

$(if [ $TESTS_FAILED -eq 0 ]; then
    cat << 'COMPLIANT'
### ✅ FULLY COMPLIANT

The Tony-NG project is fully compliant with Docker Compose v2 standards:
- All scripts use the modern \`docker compose\` command
- No deprecated \`docker-compose\` usage found
- Docker Compose v2 is properly installed and functional
COMPLIANT
else
    cat << 'NONCOMPLIANT'
### ❌ NON-COMPLIANT

The Tony-NG project requires migration to Docker Compose v2:
- Found ${#FILES_TO_FIX[@]} files with deprecated usage
- Migration is required for production readiness
- Use the automated fix commands provided above
NONCOMPLIANT
fi)

---
*Generated by Docker Migration Agent 1.2*
EOF
    
    echo -e "\n📊 Detailed report generated: $report_file"
}

# Main execution
main() {
    echo "🔧 Docker Compose v2 Migration Test Suite"
    echo "========================================"
    echo "Comprehensive testing for Docker Compose v2 compliance"
    echo ""
    
    # Run tests
    test_docker_compose_v2
    test_docker_utils_config
    test_docker_compose_functionality
    test_all_files
    
    # Summary
    echo -e "\n========================================"
    echo "Test Summary:"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    
    if [ ${#FILES_TO_FIX[@]} -gt 0 ]; then
        echo -e "\n${YELLOW}Files requiring fixes:${NC}"
        for file in "${FILES_TO_FIX[@]}"; do
            echo "  - $file"
        done
    fi
    
    # Generate report
    generate_detailed_report
    
    # Exit code
    if [ $TESTS_FAILED -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Run main
main