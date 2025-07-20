#!/bin/bash

# Tony Framework Standalone Test Script
# Verifies Tony can be installed and used independently

set -e

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Tony Framework Standalone Test${NC}"
echo -e "${BLUE}================================${NC}"
echo

# Test directory
TEST_DIR="/tmp/tony-standalone-test-$$"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo -e "${YELLOW}Test directory: $TEST_DIR${NC}"
echo

# Function to check command success
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1${NC}"
        exit 1
    fi
}

# Test 1: Installation
echo -e "${BLUE}Test 1: Installation${NC}"
cp -r $(dirname "$0") "$TEST_DIR/tony-framework"
cd "$TEST_DIR/tony-framework"
./install.sh > install.log 2>&1
check_success "Installation completed"

# Test 2: CLI availability
echo -e "\n${BLUE}Test 2: CLI Availability${NC}"
export PATH="$HOME/.tony/bin:$PATH"
which tony > /dev/null 2>&1
check_success "Tony CLI found in PATH"

# Test 3: Version check
echo -e "\n${BLUE}Test 3: Version Check${NC}"
TONY_VERSION=$(cat "$HOME/.tony/VERSION" | head -1)
if [ "$TONY_VERSION" = "2.5.0" ]; then
    check_success "Correct version installed: $TONY_VERSION"
else
    echo -e "${RED}✗ Wrong version: $TONY_VERSION${NC}"
    exit 1
fi

# Test 4: Core files
echo -e "\n${BLUE}Test 4: Core Files${NC}"
CORE_FILES=(
    "$HOME/.tony/core/TONY-CORE.md"
    "$HOME/.tony/core/UPP-METHODOLOGY.md"
    "$HOME/.tony/core/AGENT-HANDOFF-PROTOCOL.md"
    "$HOME/.tony/scripts/spawn-agent.sh"
    "$HOME/.tony/templates/agent-context-schema.json"
)

for file in "${CORE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ Found: $(basename $file)${NC}"
    else
        echo -e "${RED}✗ Missing: $file${NC}"
        exit 1
    fi
done

# Test 5: Context validation
echo -e "\n${BLUE}Test 5: Context Validation${NC}"
cd "$TEST_DIR"
mkdir -p test-project
cd test-project

# Create test context
cat > test-context.json << 'EOF'
{
  "agent_info": {
    "name": "test-agent",
    "type": "implementation",
    "version": "1.0.0"
  },
  "task_context": {
    "current_task": {
      "id": "T.001.01.01.01",
      "title": "Test Task",
      "description": "Validate Tony standalone"
    }
  }
}
EOF

# Validate context
node "$HOME/.tony/scripts/validate-context.js" test-context.json > /dev/null 2>&1
check_success "Context validation works"

# Test 6: Script execution
echo -e "\n${BLUE}Test 6: Script Execution${NC}"
"$HOME/.tony/scripts/context-manager.sh" validate test-context.json > /dev/null 2>&1
check_success "Context manager script works"

# Test 7: Independence from MosAIc
echo -e "\n${BLUE}Test 7: Independence Test${NC}"
# Check that no MosAIc dependencies exist
if grep -r "mosaic" "$HOME/.tony" > /dev/null 2>&1; then
    echo -e "${RED}✗ Found MosAIc dependencies in Tony${NC}"
    exit 1
else
    check_success "No MosAIc dependencies found"
fi

# Test 8: Claude integration
echo -e "\n${BLUE}Test 8: Claude Integration${NC}"
if [ -d "$HOME/.claude/commands" ]; then
    if [ -f "$HOME/.claude/commands/tony.md" ]; then
        check_success "Claude integration created"
    else
        echo -e "${YELLOW}⚠ Claude commands not created${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Claude not installed - skipping integration test${NC}"
fi

# Summary
echo -e "\n${BLUE}================================${NC}"
echo -e "${GREEN}All tests passed!${NC}"
echo -e "${BLUE}================================${NC}"
echo
echo -e "${YELLOW}Tony Framework is working standalone.${NC}"
echo -e "${YELLOW}Test directory: $TEST_DIR${NC}"
echo
echo "To test in Claude:"
echo "1. Navigate to a project directory"
echo "2. Start Claude"
echo "3. Say 'Hey Tony' to activate the framework"

# Cleanup option
echo
read -p "Clean up test directory? (y/N): " cleanup
if [[ "$cleanup" =~ ^[Yy]$ ]]; then
    cd /
    rm -rf "$TEST_DIR"
    echo -e "${GREEN}Test directory cleaned up${NC}"
fi