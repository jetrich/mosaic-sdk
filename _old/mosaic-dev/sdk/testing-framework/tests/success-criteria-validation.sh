#!/bin/bash

# Success Criteria Validation for T.001.03.01.02
# Validates all success criteria from the context file

set -euo pipefail

# Source libraries
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TONY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$TONY_DIR/scripts/lib/tony-lib.sh"
source "$TONY_DIR/scripts/lib/delegation-logic.sh"

echo "==================================================================="
echo "SUCCESS CRITERIA VALIDATION - T.001.03.01.02"
echo "Delegation Logic Implementation"
echo "==================================================================="
echo

# Test setup
mkdir -p "$HOME/.tony/tmp/tests"

# Create mock user Tony
cat > "$HOME/.tony/tmp/tests/mock-tony" << 'EOF'
#!/bin/bash
case "$1" in
    "--version") echo "v2.6.0"; exit 0 ;;
    "--help") 
        echo "Mock Tony Help"
        echo "Options:"
        echo "  --version      Show version"
        echo "  --help         Show help"
        echo "  --context      Accept context file"
        echo "  --environment  Accept environment file"
        echo "  --project      Accept project path"
        exit 0 ;;
    "test-command") echo "Mock Tony executed: $*"; exit 0 ;;
    *) echo "Mock Tony: $*"; exit 0 ;;
esac
EOF
chmod +x "$HOME/.tony/tmp/tests/mock-tony"

# Create test context
cat > "$HOME/.tony/tmp/tests/test-context.json" << 'EOF'
{
    "metadata": {
        "command": "test-command",
        "description": "Test command for validation",
        "timestamp": "2025-07-13T00:00:00Z"
    },
    "project": {
        "path": "/test/project",
        "git": {"branch": "main"}
    },
    "delegation": {
        "enabled": true,
        "context_merging": true,
        "environment_passing": true
    }
}
EOF

echo "SUCCESS CRITERION 1: Delegation from project to user Tony works"
echo "================================================================="

if delegate_command_enhanced "test-command" "$HOME/.tony/tmp/tests/mock-tony" "$HOME/.tony/tmp/tests/test-context.json" "arg1" "arg2" >/dev/null 2>&1; then
    echo "✅ PASSED: Delegation from project to user Tony works"
    CRITERION_1=PASS
else
    echo "❌ FAILED: Delegation from project to user Tony failed"
    CRITERION_1=FAIL
fi
echo

echo "SUCCESS CRITERION 2: Context merging between levels"
echo "===================================================="

merged_context=$(create_merged_context "$HOME/.tony/tmp/tests/test-context.json" "$HOME/.tony/tmp/tests/mock-tony")
if [ -f "$merged_context" ] && grep -q "merged_at" "$merged_context" && grep -q "user_tony" "$merged_context"; then
    echo "✅ PASSED: Context merging between levels works"
    CRITERION_2=PASS
    cleanup_merged_context "$merged_context"
else
    echo "❌ FAILED: Context merging between levels failed"
    CRITERION_2=FAIL
fi
echo

echo "SUCCESS CRITERION 3: Fallback handling for missing commands"
echo "============================================================"

# Test with non-existent Tony
if delegate_command_enhanced "status" "/nonexistent/tony" "$HOME/.tony/tmp/tests/test-context.json" >/dev/null 2>&1; then
    echo "✅ PASSED: Fallback handling for missing commands works"
    CRITERION_3=PASS
else
    echo "❌ FAILED: Fallback handling for missing commands failed"
    CRITERION_3=FAIL
fi
echo

echo "SUCCESS CRITERION 4: Environment variable passing"
echo "=================================================="

env_file=$(export_environment_vars)
if [ -f "$env_file" ] && grep -q "PATH=" "$env_file" && grep -q "HOME=" "$env_file"; then
    echo "✅ PASSED: Environment variable passing works"
    CRITERION_4=PASS
    rm -f "$env_file"
else
    echo "❌ FAILED: Environment variable passing failed"
    CRITERION_4=FAIL
fi
echo

echo "SUCCESS CRITERION 5: Tests written and passing"
echo "================================================"

# Run the comprehensive test suite
if tony/tests/lib/delegation-logic.test.sh >/dev/null 2>&1; then
    echo "✅ PASSED: Tests written and passing"
    CRITERION_5=PASS
else
    echo "❌ FAILED: Some tests are failing"
    CRITERION_5=FAIL
fi
echo

# Summary
echo "==================================================================="
echo "SUMMARY OF SUCCESS CRITERIA VALIDATION"
echo "==================================================================="
echo "1. Delegation from project to user Tony works:    $CRITERION_1"
echo "2. Context merging between levels:                $CRITERION_2"
echo "3. Fallback handling for missing commands:        $CRITERION_3"
echo "4. Environment variable passing:                  $CRITERION_4"
echo "5. Tests written and passing:                     $CRITERION_5"
echo

# Overall result
if [ "$CRITERION_1" = "PASS" ] && [ "$CRITERION_2" = "PASS" ] && [ "$CRITERION_3" = "PASS" ] && [ "$CRITERION_4" = "PASS" ] && [ "$CRITERION_5" = "PASS" ]; then
    echo "🎉 ALL SUCCESS CRITERIA PASSED!"
    echo "✅ T.001.03.01.02 - Delegation Logic Implementation - COMPLETE"
    OVERALL_RESULT=0
else
    echo "❌ SOME SUCCESS CRITERIA FAILED"
    echo "❌ T.001.03.01.02 - Delegation Logic Implementation - INCOMPLETE"
    OVERALL_RESULT=1
fi

# Cleanup
rm -rf "$HOME/.tony/tmp/tests"

exit $OVERALL_RESULT