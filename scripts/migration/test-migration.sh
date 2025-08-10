#!/bin/bash
# Test script for XDG migration system

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing MosAIc XDG Migration System${NC}"
echo "======================================"

# Create a test .mosaic directory
TEST_HOME="/tmp/mosaic-migration-test"
TEST_MOSAIC="$TEST_HOME/.mosaic"

echo -e "${YELLOW}📁 Setting up test environment...${NC}"
rm -rf "$TEST_HOME"
mkdir -p "$TEST_HOME"

# Create fake .mosaic structure
mkdir -p "$TEST_MOSAIC"/{data,logs,frameworks/tony,claude}

# Create test files
echo '{"version": "1.0.0", "mode": "hybrid"}' > "$TEST_MOSAIC/config.json"
echo '{"claude": {"enabled": true}}' > "$TEST_MOSAIC/claude/config.json"
echo 'test data' > "$TEST_MOSAIC/data/test.db"
echo 'test log' > "$TEST_MOSAIC/logs/test.log"
echo 'tony config' > "$TEST_MOSAIC/frameworks/tony/config.json"

echo -e "${GREEN}✅ Test environment created${NC}"

# Test the migration script
echo -e "${YELLOW}🚀 Running migration script...${NC}"

# Set HOME to test directory for this script
export HOME="$TEST_HOME"

# Run migration script
bash "$(dirname "$0")/migrate-to-xdg.sh" --force

echo -e "${YELLOW}🔍 Verifying migration results...${NC}"

# Check if symlink was created
if [ -L "$TEST_MOSAIC" ]; then
    echo -e "${GREEN}✅ Symlink created${NC}"
else
    echo -e "${RED}❌ Symlink not created${NC}"
    exit 1
fi

# Check if XDG directories exist
XDG_CONFIG="$TEST_HOME/.config/mosaic"
XDG_DATA="$TEST_HOME/.local/share/mosaic"
XDG_STATE="$TEST_HOME/.local/state/mosaic"

if [ -d "$XDG_CONFIG" ]; then
    echo -e "${GREEN}✅ XDG config directory created${NC}"
else
    echo -e "${RED}❌ XDG config directory missing${NC}"
    exit 1
fi

if [ -d "$XDG_DATA" ]; then
    echo -e "${GREEN}✅ XDG data directory created${NC}"
else
    echo -e "${RED}❌ XDG data directory missing${NC}"
    exit 1
fi

if [ -d "$XDG_STATE" ]; then
    echo -e "${GREEN}✅ XDG state directory created${NC}"
else
    echo -e "${RED}❌ XDG state directory missing${NC}"
    exit 1
fi

# Check if files were migrated correctly
if [ -f "$XDG_CONFIG/config.json" ]; then
    echo -e "${GREEN}✅ Config file migrated${NC}"
else
    echo -e "${RED}❌ Config file not migrated${NC}"
    exit 1
fi

if [ -f "$XDG_DATA/test.db" ]; then
    echo -e "${GREEN}✅ Data file migrated${NC}"
else
    echo -e "${RED}❌ Data file not migrated${NC}"
    exit 1
fi

if [ -f "$XDG_STATE/logs/test.log" ]; then
    echo -e "${GREEN}✅ Log file migrated${NC}"
else
    echo -e "${RED}❌ Log file not migrated${NC}"
    exit 1
fi

# Test backward compatibility through symlink
if [ -f "$TEST_MOSAIC/config.json" ]; then
    echo -e "${GREEN}✅ Backward compatibility works${NC}"
else
    echo -e "${RED}❌ Backward compatibility broken${NC}"
    exit 1
fi

# Check if backup was created
if ls "$TEST_HOME"/.mosaic-migration-backup-* 1> /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backup created${NC}"
else
    echo -e "${RED}❌ Backup not created${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 All tests passed!${NC}"
echo ""
echo -e "${BLUE}📋 Test Results Summary:${NC}"
echo "  • Symlink creation: ✅"
echo "  • XDG directories: ✅"
echo "  • File migration: ✅"
echo "  • Backward compatibility: ✅"
echo "  • Backup creation: ✅"

# Cleanup
echo -e "${YELLOW}🧹 Cleaning up test environment...${NC}"
rm -rf "$TEST_HOME"

echo -e "${GREEN}✅ Migration system test completed successfully!${NC}"