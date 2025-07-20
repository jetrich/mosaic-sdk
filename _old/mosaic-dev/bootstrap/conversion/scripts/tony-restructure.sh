#!/bin/bash

# Tony Framework Restructuring Script
# Upgrades projects to new directory structure

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Script info
SCRIPT_VERSION="2.5.0"
SCRIPT_NAME="Tony Restructure"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRAMEWORK_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Banner
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    Tony Framework Restructure                   ║${NC}"
echo -e "${CYAN}║                         Version ${SCRIPT_VERSION}                          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo

# Function to check if project needs restructuring
needs_restructuring() {
    local project_path="$1"
    
    # Check for old structure indicators
    if [[ -d "$project_path/tony-ng" ]]; then
        echo -e "${YELLOW}Found nested tony-ng/ directory${NC}"
        return 0
    fi
    
    if [[ ! -d "$project_path/framework" ]] && [[ -f "$project_path/framework/TONY-CORE.md" ]]; then
        echo -e "${YELLOW}Framework files not properly organized${NC}"
        return 0
    fi
    
    if [[ -f "$project_path/ARCHITECTURE.md" ]] || [[ -f "$project_path/GLOSSARY.md" ]]; then
        echo -e "${YELLOW}Documentation files in root directory${NC}"
        return 0
    fi
    
    return 1
}

# Function to create backup
create_backup() {
    local project_path="$1"
    local backup_dir="$project_path/.tony-restructure-backup-$(date +%Y%m%d-%H%M%S)"
    
    echo -e "${BLUE}Creating backup at: $backup_dir${NC}"
    mkdir -p "$backup_dir"
    
    # Backup key directories and files
    for item in "tony-ng" "framework" "scripts" "templates" "docs" "*.md"; do
        if [[ -e "$project_path/$item" ]]; then
            cp -r "$project_path/$item" "$backup_dir/" 2>/dev/null || true
        fi
    done
    
    echo "$backup_dir"
}

# Function to restructure project
restructure_project() {
    local project_path="$1"
    
    echo -e "${CYAN}Restructuring project at: $project_path${NC}"
    
    # Step 1: Rename tony-ng to application
    if [[ -d "$project_path/tony-ng" ]]; then
        echo -e "${GREEN}✓${NC} Renaming tony-ng/ to application/"
        mv "$project_path/tony-ng" "$project_path/application"
    fi
    
    # Step 2: Create framework directory structure
    echo -e "${GREEN}✓${NC} Creating framework directory structure"
    mkdir -p "$project_path/framework"/{core,scripts,templates/context}
    
    # Step 3: Move framework components
    echo -e "${GREEN}✓${NC} Moving framework components"
    
    # Move core framework files
    for file in "TONY-CORE.md" "AGENT-BEST-PRACTICES.md" "DEVELOPMENT-GUIDELINES.md" "AGENT-HANDOFF-PROTOCOL.md"; do
        if [[ -f "$project_path/framework/$file" ]]; then
            mv "$project_path/framework/$file" "$project_path/framework/core/" 2>/dev/null || true
        fi
    done
    
    # Move scripts
    for script in "spawn-agent.sh" "context-manager.sh" "validate-context.js"; do
        if [[ -f "$project_path/scripts/$script" ]]; then
            mv "$project_path/scripts/$script" "$project_path/framework/scripts/" 2>/dev/null || true
        fi
    done
    
    # Move templates
    if [[ -f "$project_path/templates/agent-context-schema.json" ]]; then
        mv "$project_path/templates/agent-context-schema.json" "$project_path/framework/templates/" 2>/dev/null || true
    fi
    if [[ -d "$project_path/templates/context" ]]; then
        mv "$project_path/templates/context"/* "$project_path/framework/templates/context/" 2>/dev/null || true
    fi
    
    # Step 4: Organize documentation
    echo -e "${GREEN}✓${NC} Organizing documentation"
    mkdir -p "$project_path/docs"/{architecture,getting-started,project-management}
    
    # Move docs from root
    [[ -f "$project_path/ARCHITECTURE.md" ]] && mv "$project_path/ARCHITECTURE.md" "$project_path/docs/architecture/"
    [[ -f "$project_path/GLOSSARY.md" ]] && mv "$project_path/GLOSSARY.md" "$project_path/docs/getting-started/"
    [[ -f "$project_path/MIGRATION-PLAN.md" ]] && mv "$project_path/MIGRATION-PLAN.md" "$project_path/docs/project-management/"
    [[ -f "$project_path/CHANGELOG.md" ]] && mv "$project_path/CHANGELOG.md" "$project_path/docs/project-management/"
    
    # Step 5: Create infrastructure directory
    echo -e "${GREEN}✓${NC} Creating infrastructure directory"
    mkdir -p "$project_path/infrastructure"/{docker,kubernetes,scripts}
    
    # Move Docker files if they exist
    if [[ -d "$project_path/application/infrastructure" ]]; then
        mv "$project_path/application/infrastructure"/* "$project_path/infrastructure/" 2>/dev/null || true
    fi
    
    # Step 6: Create examples directory
    echo -e "${GREEN}✓${NC} Creating examples directory"
    mkdir -p "$project_path/examples"
    
    # Move test projects
    if [[ -d "$project_path/junk/test-autonomous-tony" ]]; then
        mv "$project_path/junk/test-autonomous-tony" "$project_path/examples/taskmaster"
    fi
    
    # Step 7: Update paths in scripts
    echo -e "${GREEN}✓${NC} Updating script paths"
    update_script_paths "$project_path"
    
    # Step 8: Create project config
    echo -e "${GREEN}✓${NC} Creating project configuration"
    create_project_config "$project_path"
}

# Function to update paths in scripts
update_script_paths() {
    local project_path="$1"
    
    # Update paths in framework scripts
    if [[ -d "$project_path/framework/scripts" ]]; then
        for script in "$project_path/framework/scripts"/*.sh; do
            if [[ -f "$script" ]]; then
                # Update PROJECT_ROOT calculation
                sed -i 's|PROJECT_ROOT="\$(cd "\$SCRIPT_DIR/.." && pwd)"|PROJECT_ROOT="\$(cd "\$SCRIPT_DIR/../.." && pwd)"|g' "$script"
                # Add FRAMEWORK_DIR
                sed -i '/PROJECT_ROOT=/a FRAMEWORK_DIR="\$(cd "\$SCRIPT_DIR/.." && pwd)"' "$script"
            fi
        done
    fi
    
    # Update imports in various files
    find "$project_path" -type f \( -name "*.sh" -o -name "*.js" -o -name "*.ts" -o -name "*.md" \) | while read file; do
        # Skip backup directories
        if [[ "$file" == *"backup"* ]]; then
            continue
        fi
        
        # Update paths
        sed -i 's|tony-ng/frontend|application/frontend|g' "$file" 2>/dev/null || true
        sed -i 's|tony-ng/backend|application/backend|g' "$file" 2>/dev/null || true
        sed -i 's|scripts/spawn-agent|framework/scripts/spawn-agent|g' "$file" 2>/dev/null || true
        sed -i 's|scripts/context-manager|framework/scripts/context-manager|g' "$file" 2>/dev/null || true
    done
}

# Function to create project config
create_project_config() {
    local project_path="$1"
    
    mkdir -p "$project_path/.tony"
    
    cat > "$project_path/.tony/project-config.json" << EOF
{
  "frameworkVersion": "$SCRIPT_VERSION",
  "structureVersion": "2",
  "lastUpgrade": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "restructured": true,
  "components": {
    "framework": true,
    "application": $([ -d "$project_path/application" ] && echo "true" || echo "false"),
    "infrastructure": $([ -d "$project_path/infrastructure" ] && echo "true" || echo "false"),
    "examples": $([ -d "$project_path/examples" ] && echo "true" || echo "false")
  }
}
EOF
}

# Function to verify restructuring
verify_restructuring() {
    local project_path="$1"
    local errors=0
    
    echo -e "\n${CYAN}Verifying restructuring...${NC}"
    
    # Check directory structure
    [[ -d "$project_path/framework/core" ]] || { echo -e "${RED}✗ Missing framework/core${NC}"; ((errors++)); }
    [[ ! -d "$project_path/tony-ng" ]] || { echo -e "${RED}✗ Old tony-ng directory still exists${NC}"; ((errors++)); }
    [[ -d "$project_path/application" ]] || [[ ! -d "$project_path/tony-ng" ]] || { echo -e "${RED}✗ Application directory missing${NC}"; ((errors++)); }
    
    # Check documentation organization
    [[ ! -f "$project_path/ARCHITECTURE.md" ]] || { echo -e "${RED}✗ ARCHITECTURE.md still in root${NC}"; ((errors++)); }
    [[ ! -f "$project_path/GLOSSARY.md" ]] || { echo -e "${RED}✗ GLOSSARY.md still in root${NC}"; ((errors++)); }
    
    if [[ $errors -eq 0 ]]; then
        echo -e "${GREEN}✓ Restructuring verified successfully!${NC}"
        return 0
    else
        echo -e "${RED}✗ Restructuring verification failed with $errors errors${NC}"
        return 1
    fi
}

# Main execution
main() {
    local target="$1"
    local project_path="$2"
    
    case "$target" in
        "check")
            if [[ -z "$project_path" ]]; then
                project_path="."
            fi
            if needs_restructuring "$project_path"; then
                echo -e "${YELLOW}Project needs restructuring${NC}"
                exit 0
            else
                echo -e "${GREEN}Project structure is up to date${NC}"
                exit 1
            fi
            ;;
            
        "project")
            if [[ -z "$project_path" ]]; then
                echo -e "${RED}Error: Project path required${NC}"
                echo "Usage: $0 project <path>"
                exit 1
            fi
            
            if ! needs_restructuring "$project_path"; then
                echo -e "${GREEN}Project already restructured!${NC}"
                exit 0
            fi
            
            # Create backup
            backup_dir=$(create_backup "$project_path")
            
            # Perform restructuring
            restructure_project "$project_path"
            
            # Verify
            if verify_restructuring "$project_path"; then
                echo -e "\n${GREEN}✅ Restructuring completed successfully!${NC}"
                echo -e "${CYAN}Backup saved at: $backup_dir${NC}"
                
                # Create rollback script
                cat > "$project_path/rollback-restructure.sh" << EOF
#!/bin/bash
# Rollback script for restructuring
echo "Rolling back restructuring..."
rm -rf framework application infrastructure
cp -r "$backup_dir"/* .
echo "Rollback complete!"
EOF
                chmod +x "$project_path/rollback-restructure.sh"
                echo -e "${CYAN}Rollback script created: rollback-restructure.sh${NC}"
            else
                echo -e "\n${RED}⚠️  Restructuring completed with warnings${NC}"
                echo -e "${YELLOW}Review the errors above and fix manually if needed${NC}"
            fi
            ;;
            
        "all")
            echo -e "${CYAN}Finding all Tony projects...${NC}"
            # Find all projects with .tony directory or CLAUDE.md
            find ~ -type d -name ".tony" -o -type f -name "CLAUDE.md" | while read item; do
                if [[ -d "$item" ]]; then
                    project_dir="$(dirname "$item")"
                else
                    project_dir="$(dirname "$item")"
                fi
                
                if [[ -f "$project_dir/framework/TONY-CORE.md" ]] || [[ -d "$project_dir/tony-ng" ]]; then
                    echo -e "\n${MAGENTA}Found Tony project: $project_dir${NC}"
                    $0 project "$project_dir"
                fi
            done
            ;;
            
        *)
            echo "Usage: $0 <command> [options]"
            echo
            echo "Commands:"
            echo "  check [path]     Check if project needs restructuring"
            echo "  project <path>   Restructure a specific project"
            echo "  all             Find and restructure all Tony projects"
            echo
            echo "Examples:"
            echo "  $0 check"
            echo "  $0 project /path/to/project"
            echo "  $0 all"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"