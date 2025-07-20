#!/bin/bash

# Tony Framework - Multi-Phase Planning Engine Test Suite
# v2.7.0 - Comprehensive testing for Multi-Phase Planning Architecture
# Tests all components: Python engines, TypeScript integration, CLI commands

set -euo pipefail

# ============================================================================
# TEST CONFIGURATION
# ============================================================================

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TONY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Test configuration
TEST_PROJECT_NAME="TestProject-Planning-$(date +%s)"
TEST_WORKSPACE="/tmp/tony-planning-test-$(date +%s)"
TEST_RESULTS_DIR="$TEST_WORKSPACE/test-results"

# Test counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $*"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $*"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
}

# Test assertion functions
assert_file_exists() {
    local file="$1"
    local description="${2:-File exists}"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if [ -f "$file" ]; then
        log_success "$description: $file"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        log_error "$description: $file (NOT FOUND)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

assert_command_success() {
    local command="$1"
    local description="${2:-Command execution}"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if eval "$command" >/dev/null 2>&1; then
        log_success "$description: $command"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        log_error "$description: $command (FAILED)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

assert_python_script() {
    local script="$1"
    local config="$2"
    local description="${3:-Python script execution}"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if python3 "$script" "$config" >/dev/null 2>&1; then
        log_success "$description: $(basename "$script")"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        log_error "$description: $(basename "$script") (FAILED)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# ============================================================================
# TEST SETUP
# ============================================================================

setup_test_environment() {
    log_info "Setting up test environment..."
    
    # Create test workspace
    mkdir -p "$TEST_WORKSPACE"
    mkdir -p "$TEST_RESULTS_DIR"
    
    # Set environment variables
    export TONY_PLANNING_WORKSPACE="$TEST_WORKSPACE"
    
    log_info "Test workspace: $TEST_WORKSPACE"
    log_info "Test project: $TEST_PROJECT_NAME"
}

cleanup_test_environment() {
    log_info "Cleaning up test environment..."
    
    if [ -d "$TEST_WORKSPACE" ]; then
        rm -rf "$TEST_WORKSPACE"
        log_info "Test workspace cleaned: $TEST_WORKSPACE"
    fi
}

# ============================================================================
# COMPONENT TESTS
# ============================================================================

test_python_dependencies() {
    log_info "Testing Python dependencies..."
    
    assert_command_success "python3 --version" "Python 3 availability"
    assert_command_success "python3 -c 'import json'" "Python JSON module"
    assert_command_success "python3 -c 'import sys, os, datetime'" "Python standard modules"
}

test_planning_infrastructure() {
    log_info "Testing planning infrastructure..."
    
    # Test directory structure
    assert_file_exists "$TONY_DIR/core/planning/PhasePlanningEngine.ts" "Planning engine TypeScript"
    assert_file_exists "$TONY_DIR/core/planning/interfaces/index.ts" "Planning interfaces"
    assert_file_exists "$TONY_DIR/core/planning/types/index.ts" "Planning types"
    
    # Test Python scripts
    assert_file_exists "$TONY_DIR/scripts/planning/abstraction.py" "Phase 1 script"
    assert_file_exists "$TONY_DIR/scripts/planning/decomposition.py" "Phase 2 script"
    assert_file_exists "$TONY_DIR/scripts/planning/optimization.py" "Phase 3 script"
    assert_file_exists "$TONY_DIR/scripts/planning/certification.py" "Phase 4 script"
    
    # Test analysis components
    assert_file_exists "$TONY_DIR/scripts/planning/analysis/critical_path.py" "Critical path analyzer"
    assert_file_exists "$TONY_DIR/scripts/planning/analysis/resource_optimizer.py" "Resource optimizer"
    assert_file_exists "$TONY_DIR/scripts/planning/analysis/risk_assessor.py" "Risk assessor"
    
    # Test templates
    assert_file_exists "$TONY_DIR/templates/planning/phase-1-template.md" "Phase 1 template"
    assert_file_exists "$TONY_DIR/templates/planning/phase-2-template.md" "Phase 2 template"
    assert_file_exists "$TONY_DIR/templates/planning/phase-3-template.md" "Phase 3 template"
    assert_file_exists "$TONY_DIR/templates/planning/phase-4-template.md" "Phase 4 template"
    
    # Test command interface
    assert_file_exists "$TONY_DIR/scripts/tony-plan.sh" "Planning command script"
    assert_command_success "[ -x '$TONY_DIR/scripts/tony-plan.sh' ]" "Planning script executable"
}

test_python_phase_engines() {
    log_info "Testing Python phase engines..."
    
    # Test Phase 1: Abstraction
    local phase1_config='{"workspacePath": "'$TEST_WORKSPACE'/phase-1", "analyzeModel": true, "defineEpics": true}'
    mkdir -p "$TEST_WORKSPACE/phase-1"
    assert_python_script "$TONY_DIR/scripts/planning/abstraction.py" "$phase1_config" "Phase 1 abstraction engine"
    
    # Test Phase 2: Decomposition
    local phase2_config='{"workspacePath": "'$TEST_WORKSPACE'/phase-2", "decomposeTasks": true, "mapDependencies": true}'
    mkdir -p "$TEST_WORKSPACE/phase-2"
    assert_python_script "$TONY_DIR/scripts/planning/decomposition.py" "$phase2_config" "Phase 2 decomposition engine"
    
    # Test Phase 3: Optimization
    local phase3_config='{"workspacePath": "'$TEST_WORKSPACE'/phase-3", "optimizeCriticalPath": true, "optimizeResources": true}'
    mkdir -p "$TEST_WORKSPACE/phase-3"
    assert_python_script "$TONY_DIR/scripts/planning/optimization.py" "$phase3_config" "Phase 3 optimization engine"
    
    # Test Phase 4: Certification
    local phase4_config='{"workspacePath": "'$TEST_WORKSPACE'/phase-4", "skipValidation": false}'
    mkdir -p "$TEST_WORKSPACE/phase-4"
    assert_python_script "$TONY_DIR/scripts/planning/certification.py" "$phase4_config" "Phase 4 certification engine"
}

test_analysis_components() {
    log_info "Testing analysis components..."
    
    # Test Critical Path Analyzer
    local cp_config='{"analyze": true, "tasks": [{"id": "T1", "estimated_duration": 4}, {"id": "T2", "estimated_duration": 2}], "dependencies": [{"from": "T1", "to": "T2"}]}'
    assert_python_script "$TONY_DIR/scripts/planning/analysis/critical_path.py" "$cp_config" "Critical path analyzer"
    
    # Test Resource Optimizer
    local ro_config='{"optimize": true, "tasks": [{"id": "T1", "agent_type": "implementation"}], "agents": [{"id": "A1", "type": "implementation", "capacity": 8}]}'
    assert_python_script "$TONY_DIR/scripts/planning/analysis/resource_optimizer.py" "$ro_config" "Resource optimizer"
    
    # Test Risk Assessor
    local ra_config='{"assess": true, "project_data": {"name": "test"}, "tasks_data": [{"id": "T1"}], "resource_data": {}, "timeline_data": {}}'
    assert_python_script "$TONY_DIR/scripts/planning/analysis/risk_assessor.py" "$ra_config" "Risk assessor"
}

test_command_interface() {
    log_info "Testing command interface..."
    
    # Test help command
    assert_command_success "$TONY_DIR/scripts/tony-plan.sh --help" "Help command"
    
    # Test initialization
    cd "$TEST_WORKSPACE"
    assert_command_success "$TONY_DIR/scripts/tony-plan.sh init --project '$TEST_PROJECT_NAME' --methodology iterative" "Planning initialization"
    
    # Verify initialization artifacts
    assert_file_exists "$TEST_WORKSPACE/planning-state.json" "Planning state file created"
    
    # Test status command
    assert_command_success "$TONY_DIR/scripts/tony-plan.sh status" "Status command"
}

test_end_to_end_workflow() {
    log_info "Testing end-to-end planning workflow..."
    
    # Change to test workspace
    cd "$TEST_WORKSPACE"
    
    # Initialize planning session
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    if "$TONY_DIR/scripts/tony-plan.sh" init --project "$TEST_PROJECT_NAME" --methodology iterative >/dev/null 2>&1; then
        log_success "E2E: Planning session initialization"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        
        # Test each phase execution
        for phase in 1 2 3 4; do
            TESTS_TOTAL=$((TESTS_TOTAL + 1))
            if "$TONY_DIR/scripts/tony-plan.sh" "phase$phase" >/dev/null 2>&1; then
                log_success "E2E: Phase $phase execution"
                TESTS_PASSED=$((TESTS_PASSED + 1))
            else
                log_error "E2E: Phase $phase execution (FAILED)"
                TESTS_FAILED=$((TESTS_FAILED + 1))
            fi
        done
        
        # Test report generation
        TESTS_TOTAL=$((TESTS_TOTAL + 1))
        if "$TONY_DIR/scripts/tony-plan.sh" report >/dev/null 2>&1; then
            log_success "E2E: Report generation"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            log_error "E2E: Report generation (FAILED)"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
        
    else
        log_error "E2E: Planning session initialization (FAILED)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

test_error_handling() {
    log_info "Testing error handling..."
    
    cd "$TEST_WORKSPACE"
    
    # Test invalid phase
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    if ! "$TONY_DIR/scripts/tony-plan.sh" phase99 >/dev/null 2>&1; then
        log_success "Error handling: Invalid phase number"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        log_error "Error handling: Invalid phase number (SHOULD FAIL)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    # Test unknown command
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    if ! "$TONY_DIR/scripts/tony-plan.sh" invalidcommand >/dev/null 2>&1; then
        log_success "Error handling: Unknown command"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        log_error "Error handling: Unknown command (SHOULD FAIL)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

test_integration_with_existing_systems() {
    log_info "Testing integration with existing Tony systems..."
    
    # Test logging integration
    if [ -f "$TONY_DIR/scripts/lib/logging-utils.sh" ]; then
        assert_command_success "source '$TONY_DIR/scripts/lib/logging-utils.sh'" "Logging utils integration"
    fi
    
    # Test common utilities integration
    if [ -f "$TONY_DIR/scripts/lib/common-utils.sh" ]; then
        assert_command_success "source '$TONY_DIR/scripts/lib/common-utils.sh'" "Common utils integration"
    fi
    
    # Test with existing Tony workspace structure
    if [ -d "$TONY_DIR/docs" ]; then
        log_success "Integration: Tony documentation structure exists"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        log_warn "Integration: Tony documentation structure not found"
    fi
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
}

# ============================================================================
# PERFORMANCE TESTS
# ============================================================================

test_performance() {
    log_info "Testing performance with larger datasets..."
    
    # Test with larger task set
    local large_config='{
        "workspacePath": "'$TEST_WORKSPACE'/perf-test",
        "analyzeModel": true,
        "defineEpics": true,
        "testSize": "large"
    }'
    
    mkdir -p "$TEST_WORKSPACE/perf-test"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    local start_time=$(date +%s)
    
    if python3 "$TONY_DIR/scripts/planning/abstraction.py" "$large_config" >/dev/null 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        if [ $duration -lt 30 ]; then  # Should complete within 30 seconds
            log_success "Performance: Large dataset processing ($duration seconds)"
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            log_error "Performance: Large dataset processing too slow ($duration seconds)"
            TESTS_FAILED=$((TESTS_FAILED + 1))
        fi
    else
        log_error "Performance: Large dataset processing (FAILED)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

# ============================================================================
# MAIN TEST EXECUTION
# ============================================================================

run_test_suite() {
    echo
    echo "======================================================================="
    echo "Tony Framework - Multi-Phase Planning Architecture Test Suite v2.7.0"
    echo "======================================================================="
    echo
    
    setup_test_environment
    
    # Run all test categories
    test_python_dependencies
    test_planning_infrastructure
    test_python_phase_engines
    test_analysis_components
    test_command_interface
    test_end_to_end_workflow
    test_error_handling
    test_integration_with_existing_systems
    test_performance
    
    # Generate test report
    generate_test_report
    
    cleanup_test_environment
}

generate_test_report() {
    echo
    echo "======================================================================="
    echo "TEST RESULTS SUMMARY"
    echo "======================================================================="
    echo
    
    local success_rate=0
    if [ $TESTS_TOTAL -gt 0 ]; then
        success_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    fi
    
    echo "Total Tests: $TESTS_TOTAL"
    echo "Passed: $TESTS_PASSED"
    echo "Failed: $TESTS_FAILED"
    echo "Success Rate: $success_rate%"
    echo
    
    # Save detailed report
    cat > "$TEST_RESULTS_DIR/test-report.json" <<EOF
{
  "test_suite": "Tony Multi-Phase Planning Architecture",
  "version": "v2.7.0",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "results": {
    "total_tests": $TESTS_TOTAL,
    "tests_passed": $TESTS_PASSED,
    "tests_failed": $TESTS_FAILED,
    "success_rate": $success_rate
  },
  "test_environment": {
    "workspace": "$TEST_WORKSPACE",
    "project_name": "$TEST_PROJECT_NAME",
    "tony_directory": "$TONY_DIR"
  }
}
EOF
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 ALL TESTS PASSED! Multi-Phase Planning Architecture is ready for deployment.${NC}"
        echo
        exit 0
    else
        echo -e "${RED}❌ Some tests failed. Please review the issues above.${NC}"
        echo
        exit 1
    fi
}

# ============================================================================
# SCRIPT EXECUTION
# ============================================================================

# Handle command line arguments
case "${1:-run}" in
    run)
        run_test_suite
        ;;
    clean)
        cleanup_test_environment
        echo "Test environment cleaned."
        ;;
    --help|-h)
        echo "Tony Multi-Phase Planning Architecture Test Suite"
        echo
        echo "Usage: $0 [command]"
        echo
        echo "Commands:"
        echo "  run     Run the complete test suite (default)"
        echo "  clean   Clean up test environments"
        echo "  --help  Show this help message"
        echo
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use --help for usage information."
        exit 1
        ;;
esac