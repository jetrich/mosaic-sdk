#!/bin/bash

# Trace the exact execution
set -euo pipefail
set -x  # Enable tracing

echo "Tracing execution..."

# Source libraries
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TONY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$TONY_DIR/scripts/lib/tony-lib.sh"
source "$TONY_DIR/scripts/lib/delegation-logic.sh"

# Setup
TEST_TMPDIR="$HOME/.tony/tmp/tests"
TEST_USER_TONY="$TEST_TMPDIR/mock-tony"
TEST_CONTEXT_FILE="$TEST_TMPDIR/test-context.json"

mkdir -p "$TEST_TMPDIR"

cat > "$TEST_USER_TONY" << 'EOF'
#!/bin/bash
case "$1" in
    "--help") echo "Mock Help"; echo "  --context Accept context"; exit 0 ;;
    *) echo "Mock: $*"; exit 0 ;;
esac
EOF
chmod +x "$TEST_USER_TONY"

echo '{"test": true}' > "$TEST_CONTEXT_FILE"

# This should trigger the grep error
cmd=$(build_enhanced_delegation_command "$TEST_USER_TONY" "test-cmd" "$TEST_CONTEXT_FILE" "arg1")
echo "Result: $cmd"

rm -rf "$TEST_TMPDIR"