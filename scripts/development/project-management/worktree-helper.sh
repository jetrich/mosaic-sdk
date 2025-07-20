#!/bin/bash
# worktree-helper.sh - Helper script for managing worktrees in MosAIc SDK

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
WORKTREES_DIR="$ROOT_DIR/worktrees"

# Function to display usage
usage() {
    echo -e "${BLUE}MosAIc SDK Worktree Helper${NC}"
    echo
    echo "Usage: $0 <command> [options]"
    echo
    echo "Commands:"
    echo "  list [component]     List all worktrees (or for specific component)"
    echo "  create <component> <branch-name> <worktree-name>"
    echo "                       Create a new worktree"
    echo "  remove <component> <worktree-name>"
    echo "                       Remove a worktree"
    echo "  clean                Clean up all prunable worktrees"
    echo "  status               Show status of all worktrees"
    echo
    echo "Components: mosaic, mosaic-mcp, mosaic-dev, tony"
    echo
    echo "Examples:"
    echo "  $0 list mosaic-mcp"
    echo "  $0 create mosaic-mcp feature/awesome-feature feature-awesome"
    echo "  $0 remove mosaic-mcp feature-awesome"
    echo "  $0 status"
}

# Function to list worktrees
list_worktrees() {
    local component="${1:-all}"
    
    if [ "$component" = "all" ]; then
        echo -e "${BLUE}=== All Worktrees ===${NC}"
        for comp in mosaic mosaic-mcp mosaic-dev tony; do
            if [ -d "$ROOT_DIR/$comp" ]; then
                echo -e "\n${YELLOW}$comp:${NC}"
                (cd "$ROOT_DIR/$comp" && git worktree list 2>/dev/null || echo "  No worktrees")
            fi
        done
    else
        if [ -d "$ROOT_DIR/$component" ]; then
            echo -e "${BLUE}=== $component Worktrees ===${NC}"
            (cd "$ROOT_DIR/$component" && git worktree list)
        else
            echo -e "${RED}Component '$component' not found${NC}"
            exit 1
        fi
    fi
}

# Function to create a worktree
create_worktree() {
    local component="$1"
    local branch="$2"
    local name="$3"
    
    if [ ! -d "$ROOT_DIR/$component" ]; then
        echo -e "${RED}Component '$component' not found${NC}"
        exit 1
    fi
    
    local worktree_path="$WORKTREES_DIR/${component}-worktrees/$name"
    
    echo -e "${YELLOW}Creating worktree for $component...${NC}"
    echo "Branch: $branch"
    echo "Location: $worktree_path"
    
    # Create worktrees directory if it doesn't exist
    mkdir -p "$WORKTREES_DIR/${component}-worktrees"
    
    # Create the worktree
    (cd "$ROOT_DIR/$component" && git worktree add "$worktree_path" "$branch")
    
    echo -e "${GREEN}✓ Worktree created successfully${NC}"
    echo
    echo "To use this worktree:"
    echo "  cd $worktree_path"
}

# Function to remove a worktree
remove_worktree() {
    local component="$1"
    local name="$2"
    
    if [ ! -d "$ROOT_DIR/$component" ]; then
        echo -e "${RED}Component '$component' not found${NC}"
        exit 1
    fi
    
    local worktree_path="$WORKTREES_DIR/${component}-worktrees/$name"
    
    echo -e "${YELLOW}Removing worktree '$name' for $component...${NC}"
    
    (cd "$ROOT_DIR/$component" && git worktree remove "$worktree_path")
    
    echo -e "${GREEN}✓ Worktree removed successfully${NC}"
}

# Function to clean up worktrees
clean_worktrees() {
    echo -e "${YELLOW}Cleaning up prunable worktrees...${NC}"
    
    for component in mosaic mosaic-mcp mosaic-dev tony; do
        if [ -d "$ROOT_DIR/$component" ]; then
            echo -e "\n${BLUE}Cleaning $component...${NC}"
            (cd "$ROOT_DIR/$component" && git worktree prune --verbose)
        fi
    done
    
    echo -e "\n${GREEN}✓ Cleanup complete${NC}"
}

# Function to show status
show_status() {
    echo -e "${BLUE}=== MosAIc SDK Worktree Status ===${NC}"
    
    # Count total worktrees
    local total=0
    for component in mosaic mosaic-mcp mosaic-dev tony; do
        if [ -d "$ROOT_DIR/$component" ]; then
            local count
            count=$(cd "$ROOT_DIR/$component" && git worktree list 2>/dev/null | grep -c "worktrees" || true)
            count=${count:-0}
            total=$((total + count))
        fi
    done
    
    echo -e "Total worktrees: ${GREEN}$total${NC}"
    echo
    
    # Show worktree directories
    if [ -d "$WORKTREES_DIR" ]; then
        echo -e "${YELLOW}Worktree directories:${NC}"
        find "$WORKTREES_DIR" -mindepth 2 -maxdepth 2 -type d | sort | while read -r dir; do
            echo "  - ${dir#$WORKTREES_DIR/}"
        done
    fi
    
    # Show disk usage
    if [ -d "$WORKTREES_DIR" ]; then
        echo
        echo -e "${YELLOW}Disk usage:${NC}"
        du -sh "$WORKTREES_DIR" 2>/dev/null || echo "Unable to calculate"
    fi
}

# Main script logic
case "${1:-help}" in
    list)
        list_worktrees "${2:-all}"
        ;;
    create)
        if [ $# -lt 4 ]; then
            echo -e "${RED}Error: create requires component, branch, and name${NC}"
            usage
            exit 1
        fi
        create_worktree "$2" "$3" "$4"
        ;;
    remove)
        if [ $# -lt 3 ]; then
            echo -e "${RED}Error: remove requires component and name${NC}"
            usage
            exit 1
        fi
        remove_worktree "$2" "$3"
        ;;
    clean)
        clean_worktrees
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        usage
        exit 1
        ;;
esac