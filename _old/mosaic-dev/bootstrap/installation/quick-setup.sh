#!/bin/bash

# Tony Framework v2.0 - Quick Setup Script
# Purpose: One-command setup for users who just cloned the repository

set -euo pipefail

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Quick banner
echo -e "${CYAN}"
echo "╔════════════════════════════════════════╗"
echo "║   Tech Lead Tony v2.0 - Quick Setup   ║"
echo "║     Zero Risk | Universal | Ready     ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}🚀 Quick Setup Process:${NC}"
echo "   1. Install Tony framework at user level (~/.claude/tony/)"
echo "   2. Augment your ~/.claude/CLAUDE.md (safely, non-destructively)"  
echo "   3. Ready to use 'Hey Tony' in any project directory"
echo ""

# Check if we're in the right directory
if [ ! -f "install-modular.sh" ] || [ ! -d "framework" ]; then
    echo -e "${YELLOW}⚠️  This script must be run from the tech-lead-tony repository directory${NC}"
    echo ""
    echo "If you just cloned the repository:"
    echo "   cd tech-lead-tony"
    echo "   ./quick-setup.sh"
    echo ""
    echo "Expected structure:"
    echo "   ./install-modular.sh    (installation script)"
    echo "   ./framework/            (Tony components)"
    echo ""
    exit 1
fi

# Quick confirmation
echo -e "${BLUE}This will install Tony framework components safely.${NC}"
echo -e "${GREEN}✅ Your existing Claude configuration will be preserved${NC}"
echo -e "${GREEN}✅ Complete rollback capability if you change your mind${NC}"
echo -e "${GREEN}✅ Zero risk - non-destructive installation process${NC}"
echo ""

read -p "Proceed with Tony framework installation? (y/N): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Setup cancelled. Run './quick-setup.sh' anytime to install."
    exit 0
fi

echo ""
echo -e "${BLUE}🔧 Running Tony framework installation...${NC}"
echo ""

# Run the main installation script
./install-modular.sh

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 Tony Framework v2.0 Quick Setup Complete!${NC}"
    echo ""
    echo -e "${CYAN}🚀 Ready to Use Tony:${NC}"
    echo "   1. Navigate to any project directory"
    echo "   2. Start a Claude session"  
    echo "   3. Say: 'Hey Tony, deploy infrastructure'"
    echo "   4. Tony will auto-deploy and begin coordination"
    echo ""
    echo -e "${BLUE}📋 Example Usage:${NC}"
    echo '   cd ~/my-project'
    echo '   # In Claude: "Hey Tony, coordinate this React project"'
    echo ""
    echo -e "${BLUE}🔧 Management Commands:${NC}"
    echo "   Verify:   ~/.claude/tony/verify-modular-installation.sh"
    echo "   Rollback: ~/.claude/tony/rollback-installation.sh"
    echo ""
    echo -e "${YELLOW}💡 Pro Tip:${NC} Tony works in ANY project type - Node.js, Python, Go, Rust, or generic!"
else
    echo ""
    echo -e "${YELLOW}⚠️  Installation encountered issues${NC}"
    echo "Check the installation output above for details"
    echo "You can safely re-run this script to try again"
fi