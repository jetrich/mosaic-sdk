#!/bin/bash

# Tony Framework - Delegation Logic Test Suite
# v2.6.0 - Comprehensive tests for enhanced delegation logic
# Tests delegation, fallback handling, context merging, and environment passing

set -euo pipefail

# ============================================================================
# TEST FRAMEWORK SETUP
# ============================================================================

# Get test directory
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TONY_DIR="$(cd "$TEST_DIR/.." && pwd)"

# Source Tony library and delegation logic
source "$TONY_DIR/scripts/lib/tony-lib.sh"
source "$TONY_DIR/scripts/lib/command-utils.sh"
source "$TONY_DIR/scripts/lib/delegation-logic.sh"

# Test configuration
TEST_USER_TONY_PATH="$TEST_DIR/mock-tony"
TEST_CONTEXT_FILE="$TEST_DIR/test-context.json"
TEST_TEMP_DIR="$TEST_DIR/temp"
TEST_PROJECT_DIR="$TEST_DIR/mock-project"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# ============================================================================
# TEST UTILITIES
# ============================================================================

# Setup test environment
setup_test_environment() {
    log_info "Setting up test environment"
    
    # Create test directories
    mkdir -p "$TEST_TEMP_DIR"
    mkdir -p "$TEST_PROJECT_DIR"
    
    # Create mock Tony executable
    create_mock_tony_executable
    
    # Create test context
    create_test_context
    
    # Setup mock project
    setup_mock_project
    
    log_success "Test environment setup completed"
}

# Create mock Tony executable
create_mock_tony_executable() {
    cat > "$TEST_USER_TONY_PATH" <<'EOF'
#!/bin/bash
# Mock Tony executable for testing

case "$1" in
    "--version")
        echo "Tony Framework v2.6.0-test"
        exit 0
        ;;
    "--help")
        echo "Usage: tony [options] <command>"
        echo "Options:"
        echo "  --version     Show version"
        echo "  --help        Show help"
        echo "  --context     Context file"
        echo "  --project     Project path"
        echo "  --environment Environment file"
        echo "Commands:"
        echo "  test          Run tests"
        echo "  build         Build project"
        echo "  deploy        Deploy project"
        exit 0
        ;;
    "--context")
        if [ -f "$2" ]; then
            echo "Mock execution with context: $2"
            echo "Command: $3"
            echo "Args: ${@:4}"
            exit 0
        else
            echo "Context file not found: $2"
            exit 1
        fi
        ;;
    "test")
        echo "Mock test execution successful"
        exit 0
        ;;
    "build")
        echo "Mock build execution successful"
        exit 0
        ;;
    "fail")
        echo "Mock command failure"
        exit 1
        ;;
    *)
        echo "Unknown command: $1"
        exit 127
        ;;
esac
EOF
    
    chmod +x "$TEST_USER_TONY_PATH"
}

# Create test context file
create_test_context() {
    cat > "$TEST_CONTEXT_FILE" <<EOF
{
    "metadata": {
        "command": "test",
        "description": "Test command",
        "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
        "wrapper_version": "2.6.0",
        "pid": $$
    },
    "project": {
        "path": "$TEST_PROJECT_DIR",
        "git": {
            "branch": "main",
            "modified_files": 0,
            "remote": "https://github.com/test/repo.git"
        }
    },
    "execution": {
        "args": ["test", "arg1", "arg2"],
        "env": {
            "USER": "testuser",
            "PWD": "$TEST_PROJECT_DIR",
            "SHELL": "/bin/bash"
        }
    }
}
EOF
}

# Setup mock project
setup_mock_project() {
    cd "$TEST_PROJECT_DIR"
    
    # Initialize git repo
    git init --quiet
    git config user.email "test@example.com"
    git config user.name "Test User"
    
    # Create project files
    echo '{"name": "test-project"}' > package.json
    echo "# Test Project" > README.md
    echo "test file" > test.txt
    
    # Initial commit
    git add .
    git commit --quiet -m "Initial commit"
    
    cd - >/dev/null
}

# Cleanup test environment
cleanup_test_environment() {
    log_info "Cleaning up test environment"
    
    # Remove test files
    rm -rf "$TEST_TEMP_DIR"
    rm -f "$TEST_USER_TONY_PATH"
    rm -f "$TEST_CONTEXT_FILE"
    rm -rf "$TEST_PROJECT_DIR"
    
    log_success "Test environment cleanup completed"
}

# Assert test result
assert_test() {
    local test_name="$1"
    local expected="$2"
    local actual="$3"
    
    ((TESTS_RUN++))
    
    if [ "$expected" = "$actual" ]; then
        ((TESTS_PASSED++))
        log_success "✓ $test_name"
        return 0
    else
        ((TESTS_FAILED++))
        log_error "✗ $test_name"
        log_error "  Expected: $expected"
        log_error "  Actual: $actual"
        return 1
    fi
}

# Assert command success
assert_command_success() {
    local test_name="$1"
    local command="$2"
    
    ((TESTS_RUN++))
    
    if eval "$command" >/dev/null 2>&1; then
        ((TESTS_PASSED++))
        log_success "✓ $test_name"
        return 0
    else
        ((TESTS_FAILED++))
        log_error "✗ $test_name (command failed)"
        return 1
    fi
}

# Assert command failure
assert_command_failure() {
    local test_name="$1"
    local command="$2"
    
    ((TESTS_RUN++))
    
    if ! eval "$command" >/dev/null 2>&1; then
        ((TESTS_PASSED++))
        log_success "✓ $test_name"
        return 0
    else
        ((TESTS_FAILED++))
        log_error "✗ $test_name (command should have failed)"
        return 1
    fi
}

# ============================================================================
# DELEGATION LOGIC TESTS
# ============================================================================

# Test primary delegation success
test_primary_delegation_success() {
    log_info "Testing primary delegation success"
    
    # Test successful delegation
    if attempt_primary_delegation "test" "$TEST_USER_TONY_PATH" "$TEST_CONTEXT_FILE" "arg1" "arg2"; then
        assert_test "Primary delegation with valid Tony" "0" "0"
    else
        assert_test "Primary delegation with valid Tony" "0" "1"
    fi
}

# Test primary delegation failure
test_primary_delegation_failure() {
    log_info "Testing primary delegation failure"
    
    # Test with non-existent Tony path
    if attempt_primary_delegation "test" "/nonexistent/tony" "$TEST_CONTEXT_FILE" "arg1"; then
        assert_test "Primary delegation with invalid Tony" "1" "0"
    else
        assert_test "Primary delegation with invalid Tony" "1" "1"
    fi
}

# Test fallback locations
test_fallback_locations() {
    log_info "Testing fallback locations"
    
    # Create fallback location
    mkdir -p "$TEST_TEMP_DIR/fallback"
    cp "$TEST_USER_TONY_PATH" "$TEST_TEMP_DIR/fallback/tony"
    
    # Test fallback with modified function to use our test location
    local original_locations=(
        "$TEST_TEMP_DIR/fallback/tony"
    )
    
    # Mock the fallback function to use our test location
    attempt_fallback_locations_test() {
        local command_name="$1"
        local context_file="$2"
        shift 2
        local args=("$@")
        
        for location in "${original_locations[@]}"; do
            if [ -f "$location" ] && [ -x "$location" ]; then
                if attempt_primary_delegation "$command_name" "$location" "$context_file" "${args[@]}"; then
                    return 0
                fi
            fi
        done
        return 1
    }
    
    if attempt_fallback_locations_test "test" "$TEST_CONTEXT_FILE" "arg1"; then
        assert_test "Fallback locations work" "0" "0"
    else
        assert_test "Fallback locations work" "0" "1"
    fi
    
    # Cleanup
    rm -f "$TEST_TEMP_DIR/fallback/tony"
}

# Test context-only execution
test_context_only_execution() {
    log_info "Testing context-only execution"
    
    # Test built-in status command
    if attempt_context_only_execution "status" "$TEST_CONTEXT_FILE"; then
        assert_test "Context-only status command" "0" "0"
    else
        assert_test "Context-only status command" "0" "1"
    fi
    
    # Test built-in help command
    if attempt_context_only_execution "help" "$TEST_CONTEXT_FILE"; then
        assert_test "Context-only help command" "0" "0"
    else
        assert_test "Context-only help command" "0" "1"
    fi
    
    # Test unsupported command
    if attempt_context_only_execution "unsupported" "$TEST_CONTEXT_FILE"; then
        assert_test "Context-only unsupported command" "1" "0"
    else
        assert_test "Context-only unsupported command" "1" "1"
    fi
}

# Test emergency execution
test_emergency_execution() {
    log_info "Testing emergency execution"
    
    # Create emergency script
    mkdir -p "$TEST_TEMP_DIR/scripts/emergency"
    cat > "$TEST_TEMP_DIR/scripts/emergency/test.sh" <<'EOF'
#!/bin/bash
echo "Emergency script executed"
exit 0
EOF
    chmod +x "$TEST_TEMP_DIR/scripts/emergency/test.sh"
    
    # Change to test directory to test relative path
    cd "$TEST_TEMP_DIR"
    
    if attempt_emergency_execution "test" "arg1" "arg2"; then
        assert_test "Emergency execution works" "0" "0"
    else
        assert_test "Emergency execution works" "0" "1"
    fi
    
    cd - >/dev/null
    
    # Test non-existent emergency script
    if attempt_emergency_execution "nonexistent" "arg1"; then
        assert_test "Emergency execution fails for missing script" "1" "0"
    else
        assert_test "Emergency execution fails for missing script" "1" "1"
    fi
}

# ============================================================================
# VALIDATION TESTS
# ============================================================================

# Test Tony validation
test_tony_validation() {
    log_info "Testing Tony validation"
    
    # Test valid Tony
    if validate_user_tony_enhanced "$TEST_USER_TONY_PATH"; then
        assert_test "Valid Tony validation" "0" "0"
    else
        assert_test "Valid Tony validation" "0" "1"
    fi
    
    # Test non-existent Tony
    if validate_user_tony_enhanced "/nonexistent/tony"; then
        assert_test "Invalid Tony validation" "1" "0"
    else
        assert_test "Invalid Tony validation" "1" "1"
    fi
    
    # Test non-executable Tony
    local non_exec_tony="$TEST_TEMP_DIR/non-exec-tony"
    echo "#!/bin/bash" > "$non_exec_tony"
    # Don't make it executable
    
    if validate_user_tony_enhanced "$non_exec_tony"; then
        assert_test "Non-executable Tony validation" "1" "0"
    else
        assert_test "Non-executable Tony validation" "1" "1"
    fi
}

# Test version compatibility
test_version_compatibility() {
    log_info "Testing version compatibility"
    
    # Test compatible versions
    assert_test "Version 2.0.0 >= 2.0.0" "0" "$(version_compatible "v2.0.0" "2.0.0"; echo $?)"
    assert_test "Version 2.5.1 >= 2.0.0" "0" "$(version_compatible "v2.5.1" "2.0.0"; echo $?)"
    assert_test "Version 3.0.0 >= 2.0.0" "0" "$(version_compatible "v3.0.0" "2.0.0"; echo $?)"
    
    # Test incompatible versions
    assert_test "Version 1.9.9 < 2.0.0" "1" "$(version_compatible "v1.9.9" "2.0.0"; echo $?)"
    assert_test "Version 1.0.0 < 2.0.0" "1" "$(version_compatible "v1.0.0" "2.0.0"; echo $?)"
}

# ============================================================================
# CONTEXT MERGING TESTS
# ============================================================================

# Test context creation
test_context_creation() {
    log_info "Testing context creation"
    
    cd "$TEST_PROJECT_DIR"
    
    # Test enhanced context creation
    local context
    context=$(create_command_context "test" "Test command" "arg1" "arg2")
    
    # Validate context structure
    if echo "$context" | grep -q '"command": "test"'; then
        assert_test "Context contains command name" "0" "0"
    else
        assert_test "Context contains command name" "0" "1"
    fi
    
    if echo "$context" | grep -q '"delegation_version": "2.6.0"'; then
        assert_test "Context contains delegation version" "0" "0"
    else
        assert_test "Context contains delegation version" "0" "1"
    fi
    
    if echo "$context" | grep -q '"detected_frameworks"'; then
        assert_test "Context contains detected frameworks" "0" "0"
    else
        assert_test "Context contains detected frameworks" "0" "1"
    fi
    
    cd - >/dev/null
}

# Test context merging
test_context_merging() {
    log_info "Testing context merging"
    
    # Test merged context creation
    local merged_context_file
    merged_context_file=$(create_merged_context "$TEST_CONTEXT_FILE" "$TEST_USER_TONY_PATH")
    
    if [ -f "$merged_context_file" ]; then
        assert_test "Merged context file created" "0" "0"
        
        # Validate merged context structure
        if grep -q '"delegation"' "$merged_context_file"; then
            assert_test "Merged context contains delegation metadata" "0" "0"
        else
            assert_test "Merged context contains delegation metadata" "0" "1"
        fi
        
        if grep -q '"user_tony"' "$merged_context_file"; then
            assert_test "Merged context contains user Tony info" "0" "0"
        else
            assert_test "Merged context contains user Tony info" "0" "1"
        fi
        
        # Cleanup
        cleanup_merged_context "$merged_context_file"
    else
        assert_test "Merged context file created" "0" "1"
    fi
}

# Test Tony capabilities detection
test_tony_capabilities() {
    log_info "Testing Tony capabilities detection"
    
    local capabilities
    capabilities=$(get_tony_capabilities "$TEST_USER_TONY_PATH")
    
    # Should detect context capability
    if echo "$capabilities" | grep -q '"context"'; then
        assert_test "Detects context capability" "0" "0"
    else
        assert_test "Detects context capability" "0" "1"
    fi
    
    # Should detect project capability
    if echo "$capabilities" | grep -q '"project"'; then
        assert_test "Detects project capability" "0" "0"
    else
        assert_test "Detects project capability" "0" "1"
    fi
}

# ============================================================================
# ENHANCED COMMAND BUILDING TESTS
# ============================================================================

# Test enhanced delegation command building
test_enhanced_command_building() {
    log_info "Testing enhanced delegation command building"
    
    local delegation_cmd
    delegation_cmd=$(build_enhanced_delegation_command "$TEST_USER_TONY_PATH" "test" "$TEST_CONTEXT_FILE" "arg1" "arg with spaces")
    
    # Should include context flag
    if echo "$delegation_cmd" | grep -q "\--context"; then
        assert_test "Command includes context flag" "0" "0"
    else
        assert_test "Command includes context flag" "0" "1"
    fi
    
    # Should properly quote arguments with spaces
    if echo "$delegation_cmd" | grep -q '"arg with spaces"'; then
        assert_test "Command properly quotes spaced arguments" "0" "0"
    else
        assert_test "Command properly quotes spaced arguments" "0" "1"
    fi
}

# Test environment variable export
test_environment_export() {
    log_info "Testing environment variable export"
    
    local env_file
    env_file=$(export_environment_vars)
    
    if [ -f "$env_file" ]; then
        assert_test "Environment file created" "0" "0"
        
        # Should contain key variables
        if grep -q "PATH=" "$env_file"; then
            assert_test "Environment contains PATH" "0" "0"
        else
            assert_test "Environment contains PATH" "0" "1"
        fi
        
        if grep -q "HOME=" "$env_file"; then
            assert_test "Environment contains HOME" "0" "0"
        else
            assert_test "Environment contains HOME" "0" "1"
        fi
        
        # Cleanup
        rm -f "$env_file"
    else
        assert_test "Environment file created" "0" "1"
    fi
}

# ============================================================================
# INTEGRATION TESTS
# ============================================================================

# Test full enhanced delegation
test_full_enhanced_delegation() {
    log_info "Testing full enhanced delegation"
    
    # Test successful delegation
    if delegate_command_enhanced "test" "$TEST_USER_TONY_PATH" "$TEST_CONTEXT_FILE" "arg1" "arg2"; then
        assert_test "Full enhanced delegation success" "0" "0"
    else
        assert_test "Full enhanced delegation success" "0" "1"
    fi
    
    # Test delegation with command failure
    if delegate_command_enhanced "fail" "$TEST_USER_TONY_PATH" "$TEST_CONTEXT_FILE"; then
        assert_test "Enhanced delegation handles command failure" "1" "0"
    else
        assert_test "Enhanced delegation handles command failure" "1" "1"
    fi
}

# Test delegation with all fallbacks
test_delegation_all_fallbacks() {
    log_info "Testing delegation with all fallbacks"
    
    # Test with non-existent primary Tony (should use fallbacks)
    if delegate_command_enhanced "status" "/nonexistent/tony" "$TEST_CONTEXT_FILE"; then
        assert_test "Delegation with fallbacks to context-only" "0" "0"
    else
        assert_test "Delegation with fallbacks to context-only" "0" "1"
    fi
}

# ============================================================================
# MAIN TEST EXECUTION
# ============================================================================

# Run all tests
run_all_tests() {
    log_info "Starting Tony Framework Delegation Logic Test Suite"
    echo "================================================================"
    
    # Setup
    setup_test_environment
    
    # Delegation logic tests
    test_primary_delegation_success
    test_primary_delegation_failure
    test_fallback_locations
    test_context_only_execution
    test_emergency_execution
    
    # Validation tests
    test_tony_validation
    test_version_compatibility
    
    # Context merging tests
    test_context_creation
    test_context_merging
    test_tony_capabilities
    
    # Enhanced command building tests
    test_enhanced_command_building
    test_environment_export
    
    # Integration tests
    test_full_enhanced_delegation
    test_delegation_all_fallbacks
    
    # Cleanup
    cleanup_test_environment
    
    # Report results
    echo "================================================================"
    log_info "Test Results:"
    log_info "  Tests Run: $TESTS_RUN"
    log_success "  Tests Passed: $TESTS_PASSED"
    if [ $TESTS_FAILED -gt 0 ]; then
        log_error "  Tests Failed: $TESTS_FAILED"
    else
        log_info "  Tests Failed: $TESTS_FAILED"
    fi
    
    local success_rate=$((TESTS_PASSED * 100 / TESTS_RUN))
    log_info "  Success Rate: $success_rate%"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        log_success "All tests passed! 🎉"
        return 0
    else
        log_error "Some tests failed! ❌"
        return 1
    fi
}

# Only run tests if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    run_all_tests
fi