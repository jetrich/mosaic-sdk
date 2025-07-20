#!/bin/bash

# Tony Framework - Delegation Logic Tests
# v2.6.0 - Comprehensive tests for delegation logic implementation
# Tests T.001.03.01.02 - Delegation Logic Implementation

set -euo pipefail

# ============================================================================
# TEST INFRASTRUCTURE
# ============================================================================

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TONY_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Source libraries
source "$TONY_DIR/scripts/lib/tony-lib.sh"
source "$TONY_DIR/scripts/lib/delegation-logic.sh"

# Test configuration
TEST_TMPDIR="$HOME/.tony/tmp/tests"
TEST_USER_TONY="$TEST_TMPDIR/mock-tony"
TEST_CONTEXT_FILE="$TEST_TMPDIR/test-context.json"
TEST_OUTPUT_FILE="$TEST_TMPDIR/test-output.log"

# Test counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# ============================================================================
# TEST UTILITIES
# ============================================================================

# Initialize test environment
setup_test_environment() {
    log_info "Setting up test environment"
    
    # Create test directories
    mkdir -p "$TEST_TMPDIR"
    mkdir -p "$HOME/.tony/tmp"
    
    # Create mock user Tony
    create_mock_user_tony
    
    # Create test context
    create_test_context
    
    log_debug "Test environment setup completed"
}

# Cleanup test environment
cleanup_test_environment() {
    log_info "Cleaning up test environment"
    
    # Remove test directory
    if [ -d "$TEST_TMPDIR" ]; then
        rm -rf "$TEST_TMPDIR"
    fi
    
    # Clean up temporary files
    find "$HOME/.tony/tmp" -name "test-*" -type f -delete 2>/dev/null || true
    find "$HOME/.tony/tmp" -name "mock-*" -type f -delete 2>/dev/null || true
    
    log_debug "Test environment cleanup completed"
}

# Create mock user Tony installation
create_mock_user_tony() {
    cat > "$TEST_USER_TONY" << 'EOF'
#!/bin/bash

# Mock Tony implementation for testing
case "$1" in
    "--version")
        echo "v2.6.0"
        exit 0
        ;;
    "--help")
        echo "Mock Tony Help"
        echo "Options:"
        echo "  --version      Show version"
        echo "  --help         Show help"
        echo "  --context      Accept context file"
        echo "  --environment  Accept environment file"
        echo "  --project      Accept project path"
        exit 0
        ;;
    "config")
        if [ "$2" = "--export-json" ]; then
            echo '{"mock": "config", "version": "2.6.0"}'
            exit 0
        fi
        ;;
    "test-command")
        echo "Mock Tony executed: test-command $*"
        exit 0
        ;;
    "failing-command")
        echo "Mock Tony failed: failing-command"
        exit 1
        ;;
    *)
        echo "Mock Tony: Unknown command $1"
        exit 0
        ;;
esac
EOF
    
    chmod +x "$TEST_USER_TONY"
}

# Create test context file
create_test_context() {
    cat > "$TEST_CONTEXT_FILE" << EOF
{
    "metadata": {
        "command": "test-command",
        "description": "Test command for delegation",
        "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
        "wrapper_version": "2.6.0",
        "delegation_version": "2.6.0",
        "pid": $$
    },
    "project": {
        "path": "$(pwd)",
        "git": {
            "branch": "test-branch",
            "modified_files": 0,
            "remote": "test-remote",
            "commit": "test-commit"
        },
        "detected_frameworks": ["nodejs", "git"]
    },
    "execution": {
        "args": ["arg1", "arg2"],
        "env": {
            "USER": "${USER:-test}",
            "PWD": "$PWD",
            "SHELL": "${SHELL:-/bin/bash}",
            "PATH": "${PATH:-/usr/bin}",
            "TERM": "${TERM:-xterm}"
        },
        "context_type": "project_wrapper"
    },
    "system": {
        "hostname": "$(hostname)",
        "os": "$(uname -s)",
        "arch": "$(uname -m)",
        "kernel": "$(uname -r 2>/dev/null || echo 'unknown')"
    },
    "delegation": {
        "enabled": true,
        "fallback_strategies": ["primary", "fallback_locations", "context_only", "emergency"],
        "context_merging": true,
        "environment_passing": true
    }
}
EOF
}

# Test assertion helpers
assert_equals() {
    local expected="$1"
    local actual="$2"
    local message="${3:-}"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if [ "$expected" = "$actual" ]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        log_success "✓ $message"
        return 0
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        log_error "✗ $message"
        log_error "  Expected: $expected"
        log_error "  Actual: $actual"
        return 1
    fi
}

assert_success() {
    local exit_code="$1"
    local message="${2:-Command should succeed}"
    
    assert_equals "0" "$exit_code" "$message"
}

assert_failure() {
    local exit_code="$1"
    local message="${2:-Command should fail}"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if [ "$exit_code" -ne 0 ]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        log_success "✓ $message"
        return 0
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        log_error "✗ $message (expected failure but got success)"
        return 1
    fi
}

assert_file_exists() {
    local file_path="$1"
    local message="${2:-File should exist: $file_path}"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if [ -f "$file_path" ]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        log_success "✓ $message"
        return 0
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        log_error "✗ $message"
        return 1
    fi
}

assert_contains() {
    local substring="$1"
    local text="$2"
    local message="${3:-Text should contain: $substring}"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if echo "$text" | grep -q -F "$substring"; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        log_success "✓ $message"
        return 0
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        log_error "✗ $message"
        log_error "  Text: $text"
        return 1
    fi
}

# ============================================================================
# DELEGATION LOGIC TESTS
# ============================================================================

# Test enhanced delegation success path
test_enhanced_delegation_success() {
    log_info "Testing enhanced delegation success path"
    
    local exit_code=0
    delegate_command_enhanced "test-command" "$TEST_USER_TONY" "$TEST_CONTEXT_FILE" "arg1" "arg2" || exit_code=$?
    
    assert_success "$exit_code" "Enhanced delegation should succeed with valid Tony"
}

# Test enhanced delegation with invalid Tony path
test_enhanced_delegation_invalid_tony() {
    log_info "Testing enhanced delegation with invalid Tony path"
    
    local exit_code=0
    delegate_command_enhanced "test-command" "/nonexistent/tony" "$TEST_CONTEXT_FILE" "arg1" "arg2" || exit_code=$?
    
    assert_failure "$exit_code" "Enhanced delegation should fail with invalid Tony path"
}

# Test primary delegation
test_primary_delegation() {
    log_info "Testing primary delegation"
    
    local exit_code=0
    attempt_primary_delegation "test-command" "$TEST_USER_TONY" "$TEST_CONTEXT_FILE" "arg1" "arg2" || exit_code=$?
    
    assert_success "$exit_code" "Primary delegation should succeed"
}

# Test primary delegation failure
test_primary_delegation_failure() {
    log_info "Testing primary delegation failure"
    
    local exit_code=0
    attempt_primary_delegation "failing-command" "$TEST_USER_TONY" "$TEST_CONTEXT_FILE" "arg1" "arg2" || exit_code=$?
    
    assert_failure "$exit_code" "Primary delegation should fail for failing command"
}

# Test fallback locations
test_fallback_locations() {
    log_info "Testing fallback locations"
    
    # Create a fallback Tony in a known location
    local fallback_location="$HOME/.local/bin/tony"
    mkdir -p "$(dirname "$fallback_location")"
    cp "$TEST_USER_TONY" "$fallback_location"
    
    local exit_code=0
    attempt_fallback_locations "test-command" "$TEST_CONTEXT_FILE" "arg1" "arg2" || exit_code=$?
    
    # Clean up
    rm -f "$fallback_location"
    
    assert_success "$exit_code" "Fallback locations should work"
}

# Test context-only execution
test_context_only_execution() {
    log_info "Testing context-only execution"
    
    local exit_code=0
    attempt_context_only_execution "status" "$TEST_CONTEXT_FILE" || exit_code=$?
    
    assert_success "$exit_code" "Context-only execution should work for built-in commands"
}

# Test context-only execution for unsupported command
test_context_only_execution_unsupported() {
    log_info "Testing context-only execution for unsupported command"
    
    local exit_code=0
    attempt_context_only_execution "unsupported-command" "$TEST_CONTEXT_FILE" || exit_code=$?
    
    assert_failure "$exit_code" "Context-only execution should fail for unsupported commands"
}

# Test emergency execution
test_emergency_execution() {
    log_info "Testing emergency execution"
    
    # Create emergency script
    local emergency_script="./scripts/emergency/test-emergency.sh"
    mkdir -p "$(dirname "$emergency_script")"
    cat > "$emergency_script" << 'EOF'
#!/bin/bash
echo "Emergency script executed: $*"
exit 0
EOF
    chmod +x "$emergency_script"
    
    local exit_code=0
    attempt_emergency_execution "test-emergency" "arg1" "arg2" || exit_code=$?
    
    # Clean up
    rm -f "$emergency_script"
    rmdir "$(dirname "$emergency_script")" 2>/dev/null || true
    
    assert_success "$exit_code" "Emergency execution should work when script exists"
}

# ============================================================================
# VALIDATION TESTS
# ============================================================================

# Test enhanced Tony validation
test_enhanced_tony_validation() {
    log_info "Testing enhanced Tony validation"
    
    local result=0
    validate_user_tony_enhanced "$TEST_USER_TONY" || result=$?
    
    assert_success "$result" "Enhanced Tony validation should pass for valid Tony"
}

# Test enhanced Tony validation failure
test_enhanced_tony_validation_failure() {
    log_info "Testing enhanced Tony validation failure"
    
    local result=0
    validate_user_tony_enhanced "/nonexistent/tony" || result=$?
    
    assert_failure "$result" "Enhanced Tony validation should fail for invalid Tony"
}

# Test version compatibility
test_version_compatibility() {
    log_info "Testing version compatibility"
    
    local result=0
    version_compatible "v2.6.0" "2.0.0" || result=$?
    assert_success "$result" "Version 2.6.0 should be compatible with 2.0.0"
    
    result=0
    version_compatible "v1.9.0" "2.0.0" || result=$?
    assert_failure "$result" "Version 1.9.0 should not be compatible with 2.0.0"
    
    result=0
    version_compatible "v2.0.0" "2.0.0" || result=$?
    assert_success "$result" "Version 2.0.0 should be compatible with 2.0.0"
}

# ============================================================================
# CONTEXT MERGING TESTS
# ============================================================================

# Test context merging
test_context_merging() {
    log_info "Testing context merging"
    
    local merged_file
    merged_file=$(create_merged_context "$TEST_CONTEXT_FILE" "$TEST_USER_TONY")
    
    assert_file_exists "$merged_file" "Merged context file should be created"
    
    # Validate merged content
    local merged_content
    merged_content=$(cat "$merged_file")
    
    assert_contains "merged_at" "$merged_content" "Merged context should contain merge timestamp"
    assert_contains "user_tony" "$merged_content" "Merged context should contain user Tony info"
    assert_contains "delegation" "$merged_content" "Merged context should contain delegation metadata"
    
    # Clean up
    cleanup_merged_context "$merged_file"
}

# Test user Tony context generation
test_user_tony_context() {
    log_info "Testing user Tony context generation"
    
    local user_context
    user_context=$(get_user_tony_context "$TEST_USER_TONY")
    
    assert_contains "user_tony" "$user_context" "User context should contain user_tony section"
    assert_contains "path" "$user_context" "User context should contain Tony path"
    assert_contains "version" "$user_context" "User context should contain Tony version"
    assert_contains "capabilities" "$user_context" "User context should contain Tony capabilities"
}

# Test Tony capabilities detection
test_tony_capabilities() {
    log_info "Testing Tony capabilities detection"
    
    local capabilities
    capabilities=$(get_tony_capabilities "$TEST_USER_TONY")
    
    assert_contains "context" "$capabilities" "Capabilities should include context support"
    assert_contains "environment" "$capabilities" "Capabilities should include environment support"
}

# ============================================================================
# COMMAND BUILDING TESTS
# ============================================================================

# Test enhanced delegation command building
test_enhanced_delegation_command_building() {
    log_info "Testing enhanced delegation command building"
    
    local cmd
    cmd=$(build_enhanced_delegation_command "$TEST_USER_TONY" "test-command" "$TEST_CONTEXT_FILE" "arg1" "arg2")
    
    assert_contains "$TEST_USER_TONY" "$cmd" "Command should contain Tony path"
    assert_contains "test-command" "$cmd" "Command should contain command name"
    assert_contains "--context" "$cmd" "Command should contain context flag"
    assert_contains "arg1" "$cmd" "Command should contain first argument"
    assert_contains "arg2" "$cmd" "Command should contain second argument"
}

# Test environment variable export
test_environment_export() {
    log_info "Testing environment variable export"
    
    local env_file
    env_file=$(export_environment_vars)
    
    assert_file_exists "$env_file" "Environment file should be created"
    
    local env_content
    env_content=$(cat "$env_file")
    
    assert_contains "PATH=" "$env_content" "Environment should contain PATH"
    assert_contains "HOME=" "$env_content" "Environment should contain HOME"
    assert_contains "USER=" "$env_content" "Environment should contain USER"
    
    # Clean up
    rm -f "$env_file"
}

# ============================================================================
# BUILT-IN COMMANDS TESTS
# ============================================================================

# Test built-in status command
test_builtin_status() {
    log_info "Testing built-in status command"
    
    local context_data
    context_data=$(cat "$TEST_CONTEXT_FILE")
    
    local output
    output=$(execute_builtin_status "$context_data" 2>&1)
    
    assert_contains "Tony Framework - Project Status" "$output" "Status should show header"
    assert_contains "Project Path:" "$output" "Status should show project path"
    assert_contains "Git Branch:" "$output" "Status should show git branch"
    assert_contains "Tony Version:" "$output" "Status should show Tony version"
}

# Test built-in help command
test_builtin_help() {
    log_info "Testing built-in help command"
    
    local output
    output=$(execute_builtin_help 2>&1)
    
    assert_contains "Tony Framework - Command Wrapper Help" "$output" "Help should show header"
    assert_contains "Available built-in commands:" "$output" "Help should show available commands"
    assert_contains "status" "$output" "Help should mention status command"
    assert_contains "help" "$output" "Help should mention help command"
    assert_contains "version" "$output" "Help should mention version command"
}

# Test built-in version command
test_builtin_version() {
    log_info "Testing built-in version command"
    
    local output
    output=$(execute_builtin_version 2>&1)
    
    assert_contains "Tony Framework Command Wrapper v2.6.0" "$output" "Version should show wrapper version"
    assert_contains "fallback mode" "$output" "Version should indicate fallback mode"
}

# ============================================================================
# INTEGRATION TESTS
# ============================================================================

# Test complete delegation workflow
test_complete_delegation_workflow() {
    log_info "Testing complete delegation workflow"
    
    # Test successful delegation
    local exit_code=0
    delegate_command_enhanced "test-command" "$TEST_USER_TONY" "$TEST_CONTEXT_FILE" "arg1" "arg2" > "$TEST_OUTPUT_FILE" 2>&1 || exit_code=$?
    
    assert_success "$exit_code" "Complete delegation workflow should succeed"
    
    local output
    output=$(cat "$TEST_OUTPUT_FILE")
    assert_contains "Mock Tony executed: test-command" "$output" "Output should show mock Tony execution"
}

# Test delegation with missing Tony
test_delegation_with_missing_tony() {
    log_info "Testing delegation with missing Tony"
    
    local exit_code=0
    delegate_command_enhanced "status" "/nonexistent/tony" "$TEST_CONTEXT_FILE" > "$TEST_OUTPUT_FILE" 2>&1 || exit_code=$?
    
    # Should succeed with built-in status command
    assert_success "$exit_code" "Delegation should succeed with built-in commands even without Tony"
    
    local output
    output=$(cat "$TEST_OUTPUT_FILE")
    assert_contains "Tony Framework - Project Status" "$output" "Should show built-in status output"
}

# ============================================================================
# TEST RUNNER
# ============================================================================

# Run all tests
run_all_tests() {
    log_info "Starting delegation logic tests"
    
    # Setup
    setup_test_environment
    
    # Run tests
    test_enhanced_delegation_success
    test_enhanced_delegation_invalid_tony
    test_primary_delegation
    test_primary_delegation_failure
    test_fallback_locations
    test_context_only_execution
    test_context_only_execution_unsupported
    test_emergency_execution
    
    test_enhanced_tony_validation
    test_enhanced_tony_validation_failure
    test_version_compatibility
    
    test_context_merging
    test_user_tony_context
    test_tony_capabilities
    
    test_enhanced_delegation_command_building
    test_environment_export
    
    test_builtin_status
    test_builtin_help
    test_builtin_version
    
    test_complete_delegation_workflow
    test_delegation_with_missing_tony
    
    # Cleanup
    cleanup_test_environment
}

# Show test results
show_test_results() {
    echo
    log_info "Test Results Summary"
    echo "===================="
    echo "Total Tests: $TESTS_TOTAL"
    echo "Passed: $TESTS_PASSED"
    echo "Failed: $TESTS_FAILED"
    echo
    
    if [ $TESTS_FAILED -eq 0 ]; then
        log_success "All tests passed! ✓"
        return 0
    else
        log_error "$TESTS_FAILED tests failed! ✗"
        return 1
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

# Main function
main() {
    init_tony_lib
    
    log_info "Tony Framework - Delegation Logic Tests v2.6.0"
    echo
    
    run_all_tests
    show_test_results
}

# Only run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi