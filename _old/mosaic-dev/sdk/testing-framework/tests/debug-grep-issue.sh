#!/bin/bash

# Debug the grep issue
set -euo pipefail

echo "Testing the exact grep issue..."

# Create mock Tony
mkdir -p /tmp/debug
cat > /tmp/debug/mock-tony << 'EOF'
#!/bin/bash
case "$1" in
    "--help") echo "Mock Help"; echo "  --context Accept context"; exit 0 ;;
    *) echo "Mock: $*"; exit 0 ;;
esac
EOF
chmod +x /tmp/debug/mock-tony

echo "1. Testing Tony help output:"
/tmp/debug/mock-tony --help

echo ""
echo "2. Testing the problematic grep command:"
echo "Running: /tmp/debug/mock-tony --help 2>/dev/null | grep -q -- \"--context\""
if /tmp/debug/mock-tony --help 2>/dev/null | grep -q -- "--context"; then
    echo "✓ Found --context using double quotes"
else
    echo "✗ Did not find --context using double quotes"
fi

echo ""
echo "3. Testing with different quoting:"
echo "Running: /tmp/debug/mock-tony --help 2>/dev/null | grep -q -F -- \"--context\""
if /tmp/debug/mock-tony --help 2>/dev/null | grep -q -F -- "--context"; then
    echo "✓ Found --context using -F flag"
else
    echo "✗ Did not find --context using -F flag"
fi

echo ""
echo "4. Testing pipeline directly:"
help_output=$(/tmp/debug/mock-tony --help 2>/dev/null)
echo "Help output: '$help_output'"
echo "Piping to grep: echo \"\$help_output\" | grep -q -- \"--context\""
if echo "$help_output" | grep -q -- "--context"; then
    echo "✓ Found via variable"
else
    echo "✗ Not found via variable"
fi

rm -rf /tmp/debug
echo "Debug completed!"