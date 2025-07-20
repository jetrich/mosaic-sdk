#!/bin/bash

# Tony Framework v2.5.0 Upgrade Script
# Combines restructuring with existing force upgrade

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                 Tony Framework v2.5.0 Upgrade                   ║${NC}"
echo -e "${CYAN}║              Structured Clarity + Force Upgrade                 ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo

# Function to run upgrade for a project
upgrade_project() {
    local project_path="$1"
    
    echo -e "\n${MAGENTA}═══ Upgrading Project: $project_path ═══${NC}"
    
    # Step 1: Check if restructuring is needed
    echo -e "\n${CYAN}Step 1: Checking structure...${NC}"
    if "$SCRIPT_DIR/tony-restructure.sh" check "$project_path" >/dev/null 2>&1; then
        echo -e "${YELLOW}→ Project needs restructuring${NC}"
        
        # Run restructuring
        echo -e "\n${CYAN}Step 2: Restructuring project...${NC}"
        "$SCRIPT_DIR/tony-restructure.sh" project "$project_path"
    else
        echo -e "${GREEN}✓ Project structure already up to date${NC}"
    fi
    
    # Step 2: Run force upgrade for v2.2.0 standards
    echo -e "\n${CYAN}Step 3: Applying v2.2.0 standards...${NC}"
    AUTO_CONFIRM=true "$SCRIPT_DIR/tony-force-upgrade.sh" project "$project_path"
    
    # Step 3: Update VERSION file
    echo -e "\n${CYAN}Step 4: Updating version information...${NC}"
    if [[ -d "$project_path/framework" ]]; then
        cat > "$project_path/framework/VERSION" << EOF
2.5.0
Structured Clarity
$(date -u +%Y-%m-%d)
Core-Components Framework Application Infrastructure
Integrated
Restructured
EOF
        echo -e "${GREEN}✓ Version updated to 2.5.0${NC}"
    fi
    
    # Step 4: Create upgrade summary
    echo -e "\n${CYAN}Step 5: Creating upgrade summary...${NC}"
    cat > "$project_path/UPGRADE-SUMMARY-v25.md" << EOF
# Tony Framework v2.5.0 Upgrade Summary

**Upgrade Date**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Previous Version**: Unknown/Legacy
**New Version**: 2.5.0 "Structured Clarity"

## Changes Applied

### Directory Restructuring
- ✅ Renamed \`tony-ng/\` to \`application/\`
- ✅ Organized framework files in \`framework/\` directory
- ✅ Moved documentation to \`docs/\` subdirectories
- ✅ Created \`infrastructure/\` and \`examples/\` directories

### Framework Standards (v2.2.0)
- ✅ E.XXX Epic hierarchy format enforced
- ✅ docs/task-management/ structure created
- ✅ Updated CLAUDE.md with latest standards
- ✅ Migrated existing task structures

### Path Updates
- ✅ Updated all script paths for new structure
- ✅ Fixed imports in configuration files
- ✅ Created project configuration file

## Next Steps

1. Review the changes in your project
2. Test that everything works correctly
3. Commit the upgrade changes
4. Update your team about the new structure

## Rollback

If needed, you can rollback:
- Structure changes: \`./rollback-restructure.sh\`
- Force upgrade: Check \`.tony-backup-*\` directories

## Documentation

- [Architecture Overview](docs/architecture/ARCHITECTURE.md)
- [Migration Plan](docs/project-management/MIGRATION-PLAN.md)
- [Framework README](framework/README.md)
EOF
    
    echo -e "${GREEN}✓ Upgrade summary created${NC}"
    
    echo -e "\n${GREEN}════ Project Upgrade Complete! ════${NC}"
}

# Main execution
main() {
    local command="$1"
    
    case "$command" in
        "all")
            echo -e "${CYAN}Upgrading all Tony projects to v2.5.0...${NC}"
            
            # Use the existing force upgrade script's project finding logic
            # but apply our combined upgrade
            local search_dirs=("$HOME" "$HOME/src" "$HOME/projects" "$HOME/work" "$(pwd)")
            
            for search_dir in "${search_dirs[@]}"; do
                if [ ! -d "$search_dir" ]; then
                    continue
                fi
                
                # Find projects with Tony infrastructure
                find "$search_dir" -type d -name "tech-lead-tony" -path "*/docs/agent-management/*" 2>/dev/null | while read -r tony_dir; do
                    local project_path="$(cd "$tony_dir/../../.." && pwd)"
                    upgrade_project "$project_path"
                done
            done
            ;;
            
        "project")
            local project_path="${2:-.}"
            upgrade_project "$project_path"
            ;;
            
        "check")
            local project_path="${2:-.}"
            echo -e "${CYAN}Checking upgrade status...${NC}"
            
            # Check restructuring
            if "$SCRIPT_DIR/tony-restructure.sh" check "$project_path" >/dev/null 2>&1; then
                echo -e "${YELLOW}✗ Needs restructuring${NC}"
            else
                echo -e "${GREEN}✓ Structure up to date${NC}"
            fi
            
            # Check version
            if [[ -f "$project_path/framework/VERSION" ]]; then
                local version=$(head -n1 "$project_path/framework/VERSION")
                echo -e "${CYAN}Current version: $version${NC}"
            else
                echo -e "${YELLOW}✗ No version file found${NC}"
            fi
            ;;
            
        *)
            echo "Tony Framework v2.5.0 Upgrade"
            echo
            echo "Usage: $0 <command> [options]"
            echo
            echo "Commands:"
            echo "  check [path]     Check if upgrade is needed"
            echo "  project [path]   Upgrade a specific project"
            echo "  all              Upgrade all Tony projects"
            echo
            echo "This combines:"
            echo "  - Directory restructuring (tony-ng → application)"
            echo "  - Documentation organization"
            echo "  - v2.2.0 force upgrade standards"
            echo
            echo "Examples:"
            echo "  $0 check"
            echo "  $0 project /path/to/project"
            echo "  $0 all"
            exit 1
            ;;
    esac
}

# Run main
main "$@"