#!/bin/bash

# Trace delegation test
set -euo pipefail

# Source libraries
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TONY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$TONY_DIR/scripts/lib/tony-lib.sh"
source "$TONY_DIR/scripts/lib/delegation-logic.sh"

# Set debug level
export TONY_LOG_LEVEL="debug"

echo "Tracing delegation logic..."

# Create mock Tony
mkdir -p "$HOME/.tony/tmp/tests"
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
        exit 0 ;;
    "test-cmd") echo "Mock Tony executed: $*"; exit 0 ;;
    *) echo "Mock Tony: $*"; exit 0 ;;
esac
EOF
chmod +x "$HOME/.tony/tmp/tests/mock-tony"

# Create test context
cat > "$HOME/.tony/tmp/tests/test-context.json" << 'EOF'
{
    "command": "test-cmd",
    "timestamp": "2025-07-13T00:00:00Z"
}
EOF

echo "Testing primary delegation directly..."
if attempt_primary_delegation "test-cmd" "$HOME/.tony/tmp/tests/mock-tony" "$HOME/.tony/tmp/tests/test-context.json" "arg1"; then
    echo "✓ Primary delegation succeeded"
else
    echo "✗ Primary delegation failed"
fi

# Cleanup
rm -rf "$HOME/.tony/tmp/tests"

echo "Trace test completed!"