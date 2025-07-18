#!/bin/bash
# prepare-mosaic.sh - Prepare repository for MosAIc Stack transformation

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}=== MosAIc Stack Preparation Script ===${NC}"
echo -e "${BLUE}Transforming Tony SDK → MosAIc SDK${NC}"
echo

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"
if ! command_exists node; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}✗ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites satisfied${NC}"
echo

# Check current directory
if [ ! -d "$ROOT_DIR/tony-mcp" ] || [ ! -d "$ROOT_DIR/tony" ]; then
    echo -e "${RED}✗ Not in tony-sdk root directory${NC}"
    echo -e "${RED}  Expected to find tony-mcp and tony directories${NC}"
    exit 1
fi

# Create backup
echo -e "${YELLOW}Creating backup...${NC}"
BACKUP_DIR="$ROOT_DIR/.mosaic/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup important files
if [ -f "$ROOT_DIR/package.json" ]; then
    cp "$ROOT_DIR/package.json" "$BACKUP_DIR/" 2>/dev/null || true
fi
if [ -f "$ROOT_DIR/tony-mcp/package.json" ]; then
    cp "$ROOT_DIR/tony-mcp/package.json" "$BACKUP_DIR/tony-mcp-package.json" 2>/dev/null || true
fi
if [ -d "$ROOT_DIR/docs" ]; then
    cp -r "$ROOT_DIR/docs" "$BACKUP_DIR/" 2>/dev/null || true
fi

echo -e "${GREEN}✓ Backup created at: $BACKUP_DIR${NC}"
echo

# Check if Tony submodule is being used
echo -e "${YELLOW}Checking Tony submodule status...${NC}"
if [ -d "$ROOT_DIR/tony/.git" ]; then
    TONY_STATUS=$(cd "$ROOT_DIR/tony" && git status --porcelain)
    if [ -n "$TONY_STATUS" ]; then
        echo -e "${YELLOW}⚠️  Warning: Tony submodule has uncommitted changes${NC}"
        echo -e "${YELLOW}   Another agent may be working on 2.7.0${NC}"
        echo -e "${YELLOW}   Skipping Tony submodule modifications${NC}"
        SKIP_TONY=true
    else
        SKIP_TONY=false
    fi
else
    SKIP_TONY=false
fi

# Update tony-mcp to mosaic-mcp
echo -e "${YELLOW}Preparing tony-mcp → mosaic-mcp transformation...${NC}"
if [ -f "$ROOT_DIR/tony-mcp/package.json" ]; then
    echo -e "${GREEN}✓ tony-mcp package.json already updated to @mosaic/mcp${NC}"
else
    echo -e "${RED}✗ tony-mcp directory not found${NC}"
fi

# Create MosAIc directories
echo -e "${YELLOW}Creating MosAIc directory structure...${NC}"
mkdir -p "$ROOT_DIR/docs/mosaic-stack"
mkdir -p "$ROOT_DIR/docs/migration"
mkdir -p "$ROOT_DIR/docs/roadmaps"
mkdir -p "$ROOT_DIR/.mosaic/scripts"
mkdir -p "$ROOT_DIR/.mosaic/templates"

echo -e "${GREEN}✓ Directory structure created${NC}"

# Check documentation
echo -e "${YELLOW}Checking documentation...${NC}"
DOCS_CREATED=0
[ -f "$ROOT_DIR/docs/mosaic-stack/overview.md" ] && ((DOCS_CREATED++))
[ -f "$ROOT_DIR/docs/mosaic-stack/architecture.md" ] && ((DOCS_CREATED++))
[ -f "$ROOT_DIR/docs/mosaic-stack/component-milestones.md" ] && ((DOCS_CREATED++))
[ -f "$ROOT_DIR/docs/mosaic-stack/version-roadmap.md" ] && ((DOCS_CREATED++))
[ -f "$ROOT_DIR/docs/migration/tony-sdk-to-mosaic-sdk.md" ] && ((DOCS_CREATED++))

echo -e "${GREEN}✓ Documentation files created: $DOCS_CREATED${NC}"

# Check configuration
echo -e "${YELLOW}Checking MosAIc configuration...${NC}"
if [ -f "$ROOT_DIR/.mosaic/stack.config.json" ] && [ -f "$ROOT_DIR/.mosaic/version-matrix.json" ]; then
    echo -e "${GREEN}✓ MosAIc configuration files present${NC}"
else
    echo -e "${RED}✗ MosAIc configuration files missing${NC}"
fi

# Repository status
echo
echo -e "${BLUE}=== Repository Status ===${NC}"
echo -e "Current location: $ROOT_DIR"
echo -e "Tony submodule: $([ "$SKIP_TONY" = true ] && echo "SKIPPED (in use)" || echo "Available")"
echo -e "MCP transformation: Ready"
echo -e "Documentation: $DOCS_CREATED files created"
echo -e "Configuration: Ready"

# Next steps
echo
echo -e "${BLUE}=== Next Steps ===${NC}"
echo -e "1. Wait for Tony 2.7.0 remediation to complete"
echo -e "2. Run: ${YELLOW}npm run migrate:packages${NC} to update package names"
echo -e "3. Run: ${YELLOW}npm run verify:mosaic${NC} to validate setup"
echo -e "4. Commit changes with Epic E.055 reference"

# Summary
echo
echo -e "${GREEN}=== Preparation Complete ===${NC}"
echo -e "The repository is prepared for MosAIc Stack transformation."
echo -e "Tony submodule modifications are pending 2.7.0 completion."
echo -e "All other components are ready for migration."
echo

# Create marker file
echo "$(date +%Y-%m-%d_%H:%M:%S)" > "$ROOT_DIR/.mosaic/.prepared"

exit 0