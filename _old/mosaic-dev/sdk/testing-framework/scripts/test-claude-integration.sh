#!/bin/bash

# Tony Framework Claude Integration Test
# Verifies "Hey Tony" triggers work correctly

set -e

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CLAUDE_DIR="$HOME/.claude"

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Tony Claude Integration Test${NC}"
echo -e "${BLUE}================================${NC}"
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

# Test 1: Claude directory exists
echo -e "${BLUE}Test 1: Claude Directory${NC}"
if [ -d "$CLAUDE_DIR" ]; then
    check_success "Claude directory found"
else
    echo -e "${RED}✗ Claude directory not found at $CLAUDE_DIR${NC}"
    echo "   Please install Claude CLI first"
    exit 1
fi

# Test 2: CLAUDE.md exists
echo -e "\n${BLUE}Test 2: CLAUDE.md File${NC}"
if [ -f "$CLAUDE_DIR/CLAUDE.md" ]; then
    check_success "CLAUDE.md found"
else
    echo -e "${RED}✗ CLAUDE.md not found${NC}"
    echo "   Run 'tony repair' to create it"
    exit 1
fi

# Test 3: Tony Framework integration
echo -e "\n${BLUE}Test 3: Tony Framework Integration${NC}"
if grep -q "Tony Framework" "$CLAUDE_DIR/CLAUDE.md" 2>/dev/null; then
    check_success "Tony Framework integration found"
else
    echo -e "${RED}✗ Tony Framework not integrated${NC}"
    echo "   Run 'tony repair' to add integration"
    exit 1
fi

# Test 4: Trigger phrases
echo -e "\n${BLUE}Test 4: Trigger Phrases${NC}"
trigger_phrases=(
    "Hey Tony"
    "Hi Tony" 
    "Tony help"
    "Tech lead"
    "Agent coordination"
)

for phrase in "${trigger_phrases[@]}"; do
    if grep -q "$phrase" "$CLAUDE_DIR/CLAUDE.md" 2>/dev/null; then
        check_success "Trigger phrase: '$phrase'"
    else
        echo -e "${RED}✗ Missing trigger phrase: '$phrase'${NC}"
        exit 1
    fi
done

# Test 5: Tony installation path
echo -e "\n${BLUE}Test 5: Installation Path Reference${NC}"
if grep -q "~/.tony/" "$CLAUDE_DIR/CLAUDE.md" 2>/dev/null; then
    check_success "Tony installation path referenced"
else
    echo -e "${RED}✗ Tony installation path not referenced${NC}"
    exit 1
fi

# Test 6: Core files referenced
echo -e "\n${BLUE}Test 6: Core Files Reference${NC}"
core_files=(
    "TONY-CORE.md"
    "UPP-METHODOLOGY.md"
    "AGENT-HANDOFF-PROTOCOL.md"
)

for file in "${core_files[@]}"; do
    if grep -q "$file" "$CLAUDE_DIR/CLAUDE.md" 2>/dev/null; then
        check_success "Core file referenced: $file"
    else
        echo -e "${RED}✗ Missing core file reference: $file${NC}"
        exit 1
    fi
done

# Test 7: Commands integration
echo -e "\n${BLUE}Test 7: Commands Integration${NC}"
if [ -f "$CLAUDE_DIR/commands/tony.md" ]; then
    check_success "Tony commands file exists"
else
    echo -e "${RED}✗ Tony commands file missing${NC}"
    exit 1
fi

# Test 8: Show current integration status
echo -e "\n${BLUE}Test 8: Integration Status${NC}"
echo -e "${YELLOW}Current CLAUDE.md contains:${NC}"
grep -n "Tony" "$CLAUDE_DIR/CLAUDE.md" | head -5
echo

# Summary
echo -e "\n${BLUE}================================${NC}"
echo -e "${GREEN}All tests passed!${NC}"
echo -e "${BLUE}================================${NC}"
echo
echo -e "${YELLOW}'Hey Tony' should now work in Claude sessions!${NC}"
echo

echo "To test the integration:"
echo "1. Start a new Claude session"
echo "2. Navigate to a project directory"
echo "3. Say: 'Hey Tony, help me with this project'"
echo "4. Claude should respond as Tech Lead Tony"

echo
echo "If it doesn't work:"
echo "- Run: tony diagnose"
echo "- Run: tony repair"
echo "- Check: tony status"