#!/bin/bash

# Tony Framework - Force Upgrade Script for Existing Projects
# CRITICAL: Updates existing projects to use v2.2.0 standards

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source shared utilities
source "$SCRIPT_DIR/shared/logging-utils.sh"

# Configuration
TONY_USER_DIR="$HOME/.claude/tony"

force_upgrade_all_projects() {
    print_section "CRITICAL: Force Upgrading All Tony Projects to v2.2.0 Standards"
    
    log_warning "This will update ALL existing Tony projects to use:"
    echo "  • E.XXX Epic hierarchy format (not P.TTT.SS.AA.MM)"
    echo "  • docs/task-management/ folder structure"
    echo "  • Updated Tony framework instructions"
    echo ""
    
    if [ "${AUTO_CONFIRM:-false}" != "true" ]; then
        read -p "⚠️  Continue with force upgrade? (y/N): " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            log_info "Force upgrade cancelled"
            exit 0
        fi
    fi
    
    local updated_count=0
    local failed_count=0
    
    # Find all projects with Tony infrastructure
    log_info "🔍 Scanning for Tony-enabled projects..."
    
    # Common project locations
    local search_dirs=("$HOME" "$HOME/src" "$HOME/projects" "$HOME/work" "$(pwd)")
    
    for search_dir in "${search_dirs[@]}"; do
        if [ ! -d "$search_dir" ]; then
            continue
        fi
        
        log_debug "Searching: $search_dir"
        
        # Find projects with Tony infrastructure
        while IFS= read -r -d '' tony_dir; do
            local project_path
            # Check if this is a docs/agent-management/tech-lead-tony structure
            if [[ "$tony_dir" == *"/docs/agent-management/tech-lead-tony" ]]; then
                # Go up 3 levels to get the project root
                project_path=$(dirname "$(dirname "$(dirname "$tony_dir")")")
            else
                # This is the framework itself, skip it
                continue
            fi
            
            log_info "📁 Found Tony project: $project_path"
            
            if force_upgrade_single_project "$project_path"; then
                ((updated_count++))
                log_success "✅ Updated: $(basename "$project_path")"
            else
                ((failed_count++))
                log_error "❌ Failed: $(basename "$project_path")"
            fi
            
        done < <(find "$search_dir" -maxdepth 5 -name "tech-lead-tony" -type d -print0 2>/dev/null || true)
    done
    
    echo ""
    log_success "🎯 Force upgrade summary:"
    echo "  ✅ Updated: $updated_count projects"
    echo "  ❌ Failed: $failed_count projects"
    
    if [ $updated_count -gt 0 ]; then
        echo ""
        log_success "🚀 CRITICAL UPGRADE COMPLETE"
        echo "All updated projects now use:"
        echo "  • E.XXX Epic hierarchy format"
        echo "  • docs/task-management/ structure"
        echo "  • v2.2.0 'Integrated Excellence' standards"
        echo ""
        echo "📋 IMPORTANT: Restart any active Tony sessions in updated projects"
    fi
}

force_upgrade_single_project() {
    local project_path="$1"
    local project_name=$(basename "$project_path")
    
    log_info "🔧 Force upgrading project: $project_name"
    log_info "📁 Project path: $project_path"
    
    # Validate project path exists
    if [ ! -d "$project_path" ]; then
        log_error "❌ Project path does not exist: $project_path"
        return 1
    fi
    
    # Backup existing Tony infrastructure
    local backup_dir="$project_path/.tony-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    if [ -d "$project_path/docs/agent-management" ]; then
        cp -r "$project_path/docs/agent-management" "$backup_dir/" 2>/dev/null || true
    fi
    
    # 1. Update project CLAUDE.md with new Tony instructions
    update_project_claude "$project_path"
    
    # 2. Migrate any existing task structure to new format
    migrate_task_structure "$project_path"
    
    # 3. Update any existing .claude/commands with new standards
    update_project_commands "$project_path"
    
    # 4. Create/update docs/task-management structure
    ensure_standard_structure "$project_path"
    
    # 5. Create upgrade notice
    create_upgrade_notice "$project_path"
    
    log_success "✅ Project upgrade complete: $project_name"
    log_success "   • E.XXX Epic hierarchy format enforced"
    log_success "   • docs/task-management/ structure created"
    log_success "   • v2.2.0 standards applied"
    
    return 0
}

update_project_claude() {
    local project_path="$1"
    local claude_file="$project_path/CLAUDE.md"
    
    if [ ! -f "$claude_file" ]; then
        log_debug "No CLAUDE.md found in project"
        return 0
    fi
    
    # Check if it has Tony section
    if ! grep -q "Tech Lead Tony\|Tony Framework" "$claude_file"; then
        log_debug "No Tony section found in CLAUDE.md"
        return 0
    fi
    
    log_debug "Updating CLAUDE.md with v2.2.0 standards"
    
    # Create backup
    cp "$claude_file" "$claude_file.backup-$(date +%Y%m%d-%H%M%S)"
    
    # Extract non-Tony content (everything before Tony section)
    sed '/## Tech Lead Tony\|## TECH LEAD TONY\|# Tony Framework/,$d' "$claude_file" > "$claude_file.temp"
    
    # Add updated Tony section
    cat >> "$claude_file.temp" << 'EOF'

## 🤖 Tech Lead Tony v2.2.0 "Integrated Excellence"

### CRITICAL: UPDATED STANDARDS MANDATORY

**TASK HIERARCHY FORMAT (UPP - Ultrathink Planning Protocol):**
```
PROJECT (P)
├── EPIC (E.XXX)
│   ├── FEATURE (F.XXX.XX)
│   │   ├── STORY (S.XXX.XX.XX)
│   │   │   ├── TASK (T.XXX.XX.XX.XX)
│   │   │   │   ├── SUBTASK (ST.XXX.XX.XX.XX.XX)
│   │   │   │   │   └── ATOMIC (A.XXX.XX.XX.XX.XX.XX) [≤30 min]
```

**MANDATORY DOCUMENTATION STRUCTURE:**
- ALL planning documents: `docs/task-management/planning/`
- ALL active tasks: `docs/task-management/active/`
- ALL completed tasks: `docs/task-management/completed/`
- NO EXCEPTIONS - This structure is REQUIRED

**DEPRECATED (DO NOT USE):**
- ❌ P.TTT.SS.AA.MM format is DEPRECATED
- ❌ Any non-Epic hierarchy is DEPRECATED  
- ❌ Documentation outside docs/task-management/ is DEPRECATED

### Session Management

**Tony Deployment**: Use `/setup-tony` or natural language triggers ("Hey Tony")
**Task Planning**: Use `/tony plan start` for FULL UPP execution with E.XXX Epic format
**Task Management**: Use `/tony task` commands with standardized structure
**Health Monitoring**: Use `/tony dashboard health` for system status

### Critical Instructions

- **Tony MUST** use E.XXX Epic hierarchy format for ALL task planning
- **Tony MUST** place ALL documentation in docs/task-management/ structure  
- **Tony MUST** follow UPP (Ultrathink Planning Protocol) for all planning
- **Agents MUST** be specialized and use evidence-based completion validation
- **NO agent** should use deprecated P.TTT.SS.AA.MM format

---

**Framework Version**: v2.2.0 "Integrated Excellence"  
**Last Updated**: Force upgrade $(date +%Y-%m-%d)
EOF

    mv "$claude_file.temp" "$claude_file"
    log_debug "✅ CLAUDE.md updated with v2.2.0 standards"
}

migrate_task_structure() {
    local project_path="$1"
    
    # Look for existing task structures to migrate
    local old_structures=(
        "$project_path/docs/agent-management"
        "$project_path/tasks"
        "$project_path/planning"
    )
    
    local new_base="$project_path/docs/task-management"
    
    for old_dir in "${old_structures[@]}"; do
        if [ -d "$old_dir" ]; then
            log_debug "Migrating: $old_dir → $new_base"
            
            mkdir -p "$new_base"
            
            # Migrate planning documents
            if [ -d "$old_dir/planning" ]; then
                cp -r "$old_dir/planning"/* "$new_base/planning/" 2>/dev/null || true
            fi
            
            # Migrate active tasks
            if [ -d "$old_dir/active" ]; then
                cp -r "$old_dir/active"/* "$new_base/active/" 2>/dev/null || true
            fi
            
            # Migrate completed tasks
            if [ -d "$old_dir/completed" ]; then
                cp -r "$old_dir/completed"/* "$new_base/completed/" 2>/dev/null || true
            fi
            
            # Create migration notice
            echo "# MIGRATED TO docs/task-management/" > "$old_dir/MIGRATED-$(date +%Y%m%d).md"
            echo "This directory has been migrated to the standardized docs/task-management/ structure." >> "$old_dir/MIGRATED-$(date +%Y%m%d).md"
            echo "See: docs/task-management/ for current task management files." >> "$old_dir/MIGRATED-$(date +%Y%m%d).md"
        fi
    done
}

update_project_commands() {
    local project_path="$1"
    local commands_dir="$project_path/.claude/commands"
    
    if [ ! -d "$commands_dir" ]; then
        return 0
    fi
    
    # Update any Tony-related commands with new standards
    for cmd_file in "$commands_dir"/*.md; do
        if [ -f "$cmd_file" ] && grep -q "Tony\|task.*management\|planning" "$cmd_file"; then
            log_debug "Updating command file: $(basename "$cmd_file")"
            
            # Add upgrade notice at top
            local temp_file="$(mktemp)"
            cat > "$temp_file" << EOF
<!-- FORCE UPGRADED TO v2.2.0 "Integrated Excellence" -->
<!-- MANDATORY: Use E.XXX Epic hierarchy, docs/task-management/ structure -->

EOF
            cat "$cmd_file" >> "$temp_file"
            mv "$temp_file" "$cmd_file"
        fi
    done
}

ensure_standard_structure() {
    local project_path="$1"
    local task_mgmt_dir="$project_path/docs/task-management"
    
    # Create standardized directory structure
    local required_dirs=(
        "$task_mgmt_dir"
        "$task_mgmt_dir/planning"
        "$task_mgmt_dir/planning/phase-1-abstraction"
        "$task_mgmt_dir/planning/phase-2-decomposition"
        "$task_mgmt_dir/planning/phase-3-second-pass"
        "$task_mgmt_dir/active"
        "$task_mgmt_dir/completed"
        "$task_mgmt_dir/templates"
        "$task_mgmt_dir/integration"
        "$task_mgmt_dir/state"
        "$task_mgmt_dir/cicd"
        "$task_mgmt_dir/sync"
        "$task_mgmt_dir/reports"
        "$task_mgmt_dir/metrics"
        "$task_mgmt_dir/backups"
    )
    
    for dir in "${required_dirs[@]}"; do
        mkdir -p "$dir"
    done
    
    # Create structure documentation
    cat > "$task_mgmt_dir/README.md" << 'EOF'
# Task Management Structure (v2.2.0 Standards)

This directory contains the standardized Tony Framework task management structure.

## Directory Structure
- `planning/` - UPP (Ultrathink Planning Protocol) documents with E.XXX Epic hierarchy
- `active/` - Currently active task workspaces
- `completed/` - Completed task archives
- `templates/` - Task and planning templates
- `integration/` - Agent-ATHMS integration components
- `state/` - Centralized state management
- `cicd/` - CI/CD integration layer
- `sync/` - Cross-project synchronization
- `reports/` - Progress and health reports
- `metrics/` - Performance and analytics data
- `backups/` - State and task backups

## MANDATORY Standards
- Use E.XXX Epic hierarchy format (NOT P.TTT.SS.AA.MM)
- All planning documents in planning/ subdirectories
- All task workspaces in active/ or completed/
- Follow UPP (Ultrathink Planning Protocol) for all planning

## Framework Version
v2.2.0 "Integrated Excellence" - Force upgraded
EOF

    log_debug "✅ Standard directory structure created"
}

create_upgrade_notice() {
    local project_path="$1"
    local notice_file="$project_path/TONY-UPGRADE-NOTICE.md"
    
    cat > "$notice_file" << EOF
# 🚨 CRITICAL: Tony Framework Force Upgrade Complete

## Project Upgraded to v2.2.0 "Integrated Excellence"

**Upgrade Date**: $(date)
**Previous Version**: v2.1.0 or earlier
**New Version**: v2.2.0 "Integrated Excellence"

## MANDATORY CHANGES APPLIED

### 1. Task Hierarchy Format Updated
- **NEW**: E.XXX Epic hierarchy format
- **DEPRECATED**: P.TTT.SS.AA.MM format (DO NOT USE)

### 2. Documentation Structure Standardized
- **NEW**: docs/task-management/ structure
- **MIGRATED**: Existing task files moved to new structure

### 3. Planning Protocol Updated
- **NEW**: UPP (Ultrathink Planning Protocol) with full automation
- **COMMAND**: Use \`/tony plan start\` for complete UPP execution

## IMMEDIATE ACTIONS REQUIRED

### For Active Tony Sessions
1. **RESTART** any currently active Tony sessions
2. **VERIFY** agents are using E.XXX format (not P.TTT.SS.AA.MM)
3. **CHECK** all documentation is in docs/task-management/

### For New Planning
1. Use \`/tony plan start\` for full UPP execution
2. Ensure Epic format: E.001, E.002, etc.
3. All planning documents will be in docs/task-management/planning/

## Backup Information
- **Backup Created**: .tony-backup-$(date +%Y%m%d-%H%M%S)/
- **Original Files**: Preserved in backup directory

## Support
If you encounter issues with the upgrade:
1. Check CLAUDE.md for updated Tony instructions
2. Verify docs/task-management/ structure exists
3. Restart Tony sessions in this project

---
**Status**: ✅ FORCE UPGRADE COMPLETE
**Next Step**: Restart any active Tony sessions
EOF

    log_debug "✅ Upgrade notice created"
}

# Main execution
case "${1:-help}" in
    "all")
        force_upgrade_all_projects
        ;;
    "project")
        if [ -z "${2:-}" ]; then
            log_error "Project path required"
            echo "Usage: $0 project <path>"
            exit 1
        fi
        force_upgrade_single_project "$2"
        ;;
    *)
        echo "Tony Framework Force Upgrade v2.2.0"
        echo "===================================="
        echo ""
        echo "🚨 CRITICAL: Updates existing projects to v2.2.0 standards"
        echo ""
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  all            - Force upgrade ALL Tony projects"
        echo "  project <path> - Force upgrade specific project"
        echo ""
        echo "Changes Applied:"
        echo "  • E.XXX Epic hierarchy format (not P.TTT.SS.AA.MM)"
        echo "  • docs/task-management/ folder structure"
        echo "  • Updated framework instructions in CLAUDE.md"
        echo "  • Migrated existing task structures"
        echo ""
        echo "⚠️  WARNING: This will modify existing projects"
        echo "Backups are created automatically"
        ;;
esac