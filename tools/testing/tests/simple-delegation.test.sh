#!/bin/bash

# Simple delegation logic validation test
# Quick test to validate basic delegation functionality

set -euo pipefail

# Test directory
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TONY_DIR="$(cd "$TEST_DIR/.." && pwd)"

# Source libraries
source "$TONY_DIR/scripts/lib/tony-lib.sh"
source "$TONY_DIR/scripts/lib/command-utils.sh"
source "$TONY_DIR/scripts/lib/delegation-logic.sh"

echo "=== Tony Framework Delegation Logic Validation ==="

# Test 1: Version compatibility function
echo -n "Testing version compatibility... "
if version_compatible "v2.6.0" "2.0.0"; then
    echo "✓ PASS"
else
    echo "✗ FAIL"
    exit 1
fi

# Test 2: Context creation
echo -n "Testing context creation... "
cd /tmp
context=$(create_command_context "test" "Test command" "arg1" "arg2")
if echo "$context" | grep -q '"command": "test"'; then
    echo "✓ PASS"
else
    echo "✗ FAIL"
    exit 1
fi

# Test 3: Built-in help command
echo -n "Testing built-in help... "
if execute_builtin_help >/dev/null 2>&1; then
    echo "✓ PASS"
else
    echo "✗ FAIL"
    exit 1
fi

# Test 4: Built-in status command
echo -n "Testing built-in status... "
if execute_builtin_status '{}' >/dev/null 2>&1; then
    echo "✓ PASS"
else
    echo "✗ FAIL"
    exit 1
fi

# Test 5: Enhanced Tony validation (should fail for non-existent path)
echo -n "Testing Tony validation (should fail)... "
if ! validate_user_tony_enhanced "/nonexistent/tony" >/dev/null 2>&1; then
    echo "✓ PASS"
else
    echo "✗ FAIL"
    exit 1
fi

echo
echo "All validation tests passed! ✅"
echo "Delegation logic implementation is working correctly."