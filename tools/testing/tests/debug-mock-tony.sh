#!/bin/bash

# Debug mock Tony output
set -euo pipefail

echo "Testing mock Tony help output..."

# Setup
TEST_TMPDIR="$HOME/.tony/tmp/tests"
TEST_USER_TONY="$TEST_TMPDIR/mock-tony"

mkdir -p "$TEST_TMPDIR"

# Create mock user Tony (exact copy from test)
cat > "$TEST_USER_TONY" << 'EOF'
#!/bin/bash

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

echo "Testing mock Tony --help output:"
"$TEST_USER_TONY" --help

echo ""
echo "Testing grep for --context in help output:"
help_output=$("$TEST_USER_TONY" --help 2>/dev/null)
echo "Help output: $help_output"

echo ""
echo "Testing grep command directly:"
if echo "$help_output" | grep -q -- "--context"; then
    echo "✓ Found --context in help output"
else
    echo "✗ Did not find --context in help output"
fi

# Cleanup
rm -rf "$TEST_TMPDIR"

echo "Debug completed!"