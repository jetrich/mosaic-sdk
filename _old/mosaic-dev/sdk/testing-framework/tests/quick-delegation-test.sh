#!/bin/bash

# Quick delegation test
set -euo pipefail

# Source libraries
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TONY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$TONY_DIR/scripts/lib/tony-lib.sh"
source "$TONY_DIR/scripts/lib/delegation-logic.sh"

echo "Testing delegation logic..."

# Create mock Tony
mkdir -p "$HOME/.tony/tmp/tests"
cat > "$HOME/.tony/tmp/tests/mock-tony" << 'EOF'
#!/bin/bash
case "$1" in
    "--version") echo "v2.6.0"; exit 0 ;;
    "--help") echo "Mock Tony Help"; echo "  --context  Accept context"; exit 0 ;;
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

echo "Testing enhanced delegation..."
if delegate_command_enhanced "test-cmd" "$HOME/.tony/tmp/tests/mock-tony" "$HOME/.tony/tmp/tests/test-context.json" "arg1"; then
    echo "✓ Enhanced delegation succeeded"
else
    echo "✗ Enhanced delegation failed"
fi

echo "Testing context-only execution..."
if attempt_context_only_execution "status" "$HOME/.tony/tmp/tests/test-context.json"; then
    echo "✓ Context-only execution succeeded"
else
    echo "✗ Context-only execution failed"
fi

echo "Testing version compatibility..."
if version_compatible "v2.6.0" "2.0.0"; then
    echo "✓ Version compatibility check passed"
else
    echo "✗ Version compatibility check failed"
fi

# Cleanup
rm -rf "$HOME/.tony/tmp/tests"

echo "Quick test completed!"