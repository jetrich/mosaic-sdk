#!/bin/bash

# Debug delegation test
set -euo pipefail

# Source libraries
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TONY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$TONY_DIR/scripts/lib/tony-lib.sh"
source "$TONY_DIR/scripts/lib/delegation-logic.sh"

# Set debug level
export TONY_LOG_LEVEL="debug"

echo "Debugging delegation logic..."

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

echo "Testing Tony validation..."
if validate_user_tony_enhanced "$HOME/.tony/tmp/tests/mock-tony"; then
    echo "✓ Tony validation passed"
else
    echo "✗ Tony validation failed"
fi

echo "Testing version compatibility directly..."
if version_compatible "v2.6.0" "2.0.0"; then
    echo "✓ Version compatibility passed"
else
    echo "✗ Version compatibility failed"
fi

echo "Checking Tony capabilities..."
capabilities=$(get_tony_capabilities "$HOME/.tony/tmp/tests/mock-tony")
echo "Capabilities: $capabilities"

# Cleanup
rm -rf "$HOME/.tony/tmp/tests"

echo "Debug test completed!"