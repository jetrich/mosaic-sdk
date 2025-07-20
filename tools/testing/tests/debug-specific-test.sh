#!/bin/bash

# Debug specific test
set -euo pipefail

# Source libraries
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TONY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$TONY_DIR/scripts/lib/tony-lib.sh"
source "$TONY_DIR/scripts/lib/delegation-logic.sh"

echo "Testing enhanced delegation command building..."

# Setup
TEST_TMPDIR="$HOME/.tony/tmp/tests"
TEST_USER_TONY="$TEST_TMPDIR/mock-tony"
TEST_CONTEXT_FILE="$TEST_TMPDIR/test-context.json"

mkdir -p "$TEST_TMPDIR"

# Create mock user Tony
cat > "$TEST_USER_TONY" << 'EOF'
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
    *) echo "Mock Tony: $*"; exit 0 ;;
esac
EOF
chmod +x "$TEST_USER_TONY"

# Create test context
cat > "$TEST_CONTEXT_FILE" << 'EOF'
{
    "command": "test-command",
    "timestamp": "2025-07-13T00:00:00Z"
}
EOF

echo "Building delegation command..."
cmd=$(build_enhanced_delegation_command "$TEST_USER_TONY" "test-command" "$TEST_CONTEXT_FILE" "arg1" "arg2")

echo "Generated command: $cmd"

echo "Checking if command contains --context..."
if echo "$cmd" | grep -q -F -- "--context"; then
    echo "✓ Command contains --context flag"
else
    echo "✗ Command does not contain --context flag"
fi

echo "Checking if command contains context file path..."
if echo "$cmd" | grep -q -F "$TEST_CONTEXT_FILE"; then
    echo "✓ Command contains context file path"
else
    echo "✗ Command does not contain context file path"
fi

# Cleanup
rm -rf "$TEST_TMPDIR"

echo "Debug test completed!"