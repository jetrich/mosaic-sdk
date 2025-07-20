#!/bin/bash

# Simple test to reproduce the issue
set -euo pipefail

echo "Running simple test to find grep issue..."

# Source the test file functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TONY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$TONY_DIR/scripts/lib/tony-lib.sh"
source "$TONY_DIR/scripts/lib/delegation-logic.sh"

# Test setup (minimal version of what the main test does)
TEST_TMPDIR="$HOME/.tony/tmp/tests"
TEST_USER_TONY="$TEST_TMPDIR/mock-tony"
TEST_CONTEXT_FILE="$TEST_TMPDIR/test-context.json"

mkdir -p "$TEST_TMPDIR"

# Create mock Tony (simple version)
cat > "$TEST_USER_TONY" << 'EOF'
#!/bin/bash
case "$1" in
    "--help") echo "Mock Tony Help"; echo "  --context Accept context"; exit 0 ;;
    *) echo "Mock: $*"; exit 0 ;;
esac
EOF
chmod +x "$TEST_USER_TONY"

# Create context
echo '{"test": true}' > "$TEST_CONTEXT_FILE"

echo "Testing build_enhanced_delegation_command..."
cmd=$(build_enhanced_delegation_command "$TEST_USER_TONY" "test-cmd" "$TEST_CONTEXT_FILE" "arg1")
echo "Generated: $cmd"

echo "Testing assert_contains function..."
# Define assert_contains function
assert_contains() {
    local substring="$1"
    local text="$2"
    local message="${3:-Text should contain: $substring}"
    
    if echo "$text" | grep -q -F "$substring"; then
        echo "✓ $message"
        return 0
    else
        echo "✗ $message"
        echo "  Text: $text"
        return 1
    fi
}

assert_contains "--context" "$cmd" "Command should contain context flag"

rm -rf "$TEST_TMPDIR"
echo "Simple test completed!"