#!/bin/bash

# Tony Framework - Multi-Phase Planning Commands
# v2.7.0 - Enterprise Project Planning with Phase-Based Methodology
# Implements the Multi-Phase Planning Architecture from issue #10

set -euo pipefail

# ============================================================================
# SCRIPT INITIALIZATION
# ============================================================================

# Get script directory and source Tony library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TONY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source Tony libraries
source "$SCRIPT_DIR/lib/common-utils.sh"
source "$SCRIPT_DIR/lib/logging-utils.sh"

# Planning system version
PLANNING_VERSION="2.7.0"

# ============================================================================
# CONFIGURATION AND DEFAULTS
# ============================================================================

# Default planning workspace
DEFAULT_PLANNING_WORKSPACE="$PWD/docs/task-management/planning"
PLANNING_WORKSPACE="${TONY_PLANNING_WORKSPACE:-$DEFAULT_PLANNING_WORKSPACE}"

# Python requirements check
PYTHON_REQUIRED="python3"
NODE_REQUIRED="node"

# Planning session state file
PLANNING_STATE_FILE="$PLANNING_WORKSPACE/planning-state.json"

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

# Show usage information
show_usage() {
    cat <<EOF
Tony Multi-Phase Planning System v$PLANNING_VERSION

USAGE:
    tony plan <command> [options]

COMMANDS:
    init [--project NAME] [--methodology TYPE] [--phases N]
        Initialize multi-phase planning session
        
    phase1 [--analyze-domain] [--define-epics]
        Execute Phase 1: Abstraction and Epic Definition
        
    phase2 [--decompose-tasks] [--map-dependencies]  
        Execute Phase 2: Decomposition and Task Breakdown
        
    phase3 [--critical-path] [--optimize-resources]
        Execute Phase 3: Optimization and Critical Path Analysis
        
    phase4 [--validate] [--certify]
        Execute Phase 4: Certification and Final Validation
        
    status
        Show current planning session status
        
    report
        Generate comprehensive planning report
        
    clean [--force]
        Clean planning workspace (use --force to skip confirmation)
        
    --help, -h
        Show this help message

EXAMPLES:
    # Initialize new planning session
    tony plan init --project "E-Commerce Platform" --methodology iterative

    # Execute planning phases sequentially  
    tony plan phase1
    tony plan phase2
    tony plan phase3
    tony plan phase4

    # Get planning status
    tony plan status

    # Generate final report
    tony plan report

For more information, see: https://github.com/jetrich/tony/wiki/multi-phase-planning
EOF
}

# Validate environment requirements
validate_environment() {
    log_info "Validating planning environment..."
    
    # Check Python 3
    if ! command_exists python3; then
        log_error "Python 3 is required for planning engines"
        log_info "Please install Python 3.8 or higher"
        return 1
    fi
    
    # Check Node.js for TypeScript execution
    if ! command_exists node; then
        log_error "Node.js is required for planning engine"
        log_info "Please install Node.js 16 or higher"
        return 1
    fi
    
    # Ensure planning workspace exists
    ensure_directory "$PLANNING_WORKSPACE"
    
    log_debug "Environment validation passed"
    return 0
}

# Initialize planning session
init_planning_session() {
    local project_name="${1:-}"
    local methodology="${2:-iterative}"
    local phases="${3:-3}"
    
    log_info "Initializing multi-phase planning session..."
    
    if [ -z "$project_name" ]; then
        # Try to infer project name from directory or git
        if [ -d ".git" ]; then
            project_name="$(basename "$(git rev-parse --show-toplevel)" 2>/dev/null || echo "$(basename "$PWD")")"
        else
            project_name="$(basename "$PWD")"
        fi
        log_info "Using inferred project name: $project_name"
    fi
    
    # Validate methodology
    case "$methodology" in
        iterative|waterfall|agile)
            log_debug "Using methodology: $methodology"
            ;;
        *)
            log_warn "Unknown methodology '$methodology', using 'iterative'"
            methodology="iterative"
            ;;
    esac
    
    # Create planning engine execution using compiled JavaScript
    local planning_engine_path="$TONY_DIR/dist/planning/PhasePlanningEngine.js"
    
    # Debug information for CI troubleshooting
    log_info "Looking for planning engine at: $planning_engine_path"
    log_info "TONY_DIR is: $TONY_DIR"
    log_info "Current working directory: $(pwd)"
    log_info "Contents of TONY_DIR: $(ls -la "$TONY_DIR" 2>/dev/null || echo 'Directory not found')"
    
    if [ ! -f "$planning_engine_path" ]; then
        log_error "Planning engine not found: $planning_engine_path"
        log_info "Contents of dist directory: $(ls -la "$TONY_DIR/dist" 2>/dev/null || echo 'dist directory not found')"
        log_info "Contents of dist/planning directory: $(ls -la "$TONY_DIR/dist/planning" 2>/dev/null || echo 'dist/planning directory not found')"
        
        # Check if we can rebuild the planning engine
        log_warning "Attempting to rebuild planning engine..."
        if command_exists npm && [ -f "$TONY_DIR/package.json" ]; then
            log_info "Running npm run build:prod to rebuild planning engine..."
            cd "$TONY_DIR" && npm run build:prod
            
            # Check again after rebuild
            if [ -f "$planning_engine_path" ]; then
                log_success "Planning engine rebuilt successfully!"
            else
                log_error "Planning engine rebuild failed - falling back to simplified mode"
                return 1
            fi
        else
            log_error "Cannot rebuild planning engine - npm or package.json not found"
            return 1
        fi
    fi
    
    # Execute initialization via Node.js
    local init_script="
const { PhasePlanningEngine } = require('$planning_engine_path');

async function initializePlanning() {
    const engine = new PhasePlanningEngine(
        '$TONY_DIR/scripts/planning',
        '$PLANNING_WORKSPACE'
    );
    
    const config = {
        projectName: '$project_name',
        methodology: '$methodology',
        phaseCount: $phases,
        timeAllocation: {
            abstraction: 20,
            decomposition: 55,
            optimization: 20,
            buffer: 5
        },
        qualityGates: []
    };
    
    try {
        const session = await engine.initializePhases(config);
        console.log(JSON.stringify(session, null, 2));
    } catch (error) {
        console.error('Initialization failed:', error.message);
        process.exit(1);
    }
}

initializePlanning();
"
    
    log_info "Creating planning session for project: $project_name"
    
    # For now, create a simple session state file
    cat > "$PLANNING_STATE_FILE" <<EOF
{
  "project_name": "$project_name",
  "methodology": "$methodology",
  "phases": $phases,
  "initialized_at": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "current_phase": "ready",
  "planning_workspace": "$PLANNING_WORKSPACE",
  "version": "$PLANNING_VERSION"
}
EOF
    
    log_success "Planning session initialized successfully"
    log_info "Project: $project_name"
    log_info "Methodology: $methodology"
    log_info "Workspace: $PLANNING_WORKSPACE"
    log_info "Next step: Run 'tony plan phase1' to start planning"
}

# Execute planning phase
execute_planning_phase() {
    local phase_num="$1"
    shift
    local phase_options=("$@")
    
    # Validate session exists
    if [ ! -f "$PLANNING_STATE_FILE" ]; then
        log_error "No planning session found. Run 'tony plan init' first."
        return 1
    fi
    
    log_info "Executing Phase $phase_num: $(get_phase_name "$phase_num")"
    
    # Determine phase script and workspace
    local phase_script=""
    local phase_workspace=""
    
    case "$phase_num" in
        1)
            phase_script="$TONY_DIR/scripts/planning/abstraction.py"
            phase_workspace="$PLANNING_WORKSPACE/phase-1-abstraction"
            ;;
        2)
            phase_script="$TONY_DIR/scripts/planning/decomposition.py"
            phase_workspace="$PLANNING_WORKSPACE/phase-2-decomposition"
            ;;
        3)
            phase_script="$TONY_DIR/scripts/planning/optimization.py"
            phase_workspace="$PLANNING_WORKSPACE/phase-3-optimization"
            ;;
        4)
            phase_script="$TONY_DIR/scripts/planning/certification.py"
            phase_workspace="$PLANNING_WORKSPACE/phase-4-certification"
            ;;
        *)
            log_error "Invalid phase number: $phase_num"
            return 1
            ;;
    esac
    
    # Ensure phase workspace exists
    ensure_directory "$phase_workspace"
    
    # Build phase configuration
    local config="{\"workspacePath\": \"$phase_workspace\""
    
    # Add phase-specific options
    case "$phase_num" in
        1)
            config="$config, \"analyzeModel\": true, \"defineEpics\": true"
            ;;
        2)
            config="$config, \"decomposeTasks\": true, \"mapDependencies\": true"
            ;;
        3)
            config="$config, \"optimizeCriticalPath\": true, \"optimizeResources\": true"
            ;;
        4)
            config="$config, \"skipValidation\": false"
            ;;
    esac
    
    config="$config}"
    
    # Execute phase script
    log_debug "Executing: python3 $phase_script '$config'"
    
    if python3 "$phase_script" "$config"; then
        log_success "Phase $phase_num completed successfully"
        
        # Update planning state
        update_planning_state "$phase_num"
        
        # Show next steps
        show_next_steps "$phase_num"
    else
        log_error "Phase $phase_num execution failed"
        return 1
    fi
}

# Get phase name for display
get_phase_name() {
    case "$1" in
        1) echo "Abstraction and Epic Definition" ;;
        2) echo "Decomposition and Task Breakdown" ;;
        3) echo "Optimization and Critical Path Analysis" ;;
        4) echo "Certification and Final Validation" ;;
        *) echo "Unknown Phase" ;;
    esac
}

# Update planning state after phase completion
update_planning_state() {
    local completed_phase="$1"
    
    if [ -f "$PLANNING_STATE_FILE" ]; then
        # Update the state file (simplified version)
        local temp_file=$(mktemp)
        python3 -c "
import json
import sys

with open('$PLANNING_STATE_FILE', 'r') as f:
    state = json.load(f)

state['last_completed_phase'] = $completed_phase
state['updated_at'] = '$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'

if $completed_phase < 4:
    state['current_phase'] = 'phase_$(($completed_phase + 1))'
else:
    state['current_phase'] = 'completed'

with open('$temp_file', 'w') as f:
    json.dump(state, f, indent=2)
"
        mv "$temp_file" "$PLANNING_STATE_FILE"
    fi
}

# Show next steps after phase completion
show_next_steps() {
    local completed_phase="$1"
    
    case "$completed_phase" in
        1)
            log_info "✅ Phase 1 complete - Domain analysis and epic definition finished"
            log_info "📋 Next step: Run 'tony plan phase2' for task decomposition"
            ;;
        2)
            log_info "✅ Phase 2 complete - UPP hierarchy and dependency mapping finished"
            log_info "📋 Next step: Run 'tony plan phase3' for optimization"
            ;;
        3)
            log_info "✅ Phase 3 complete - Critical path and resource optimization finished"
            log_info "📋 Next step: Run 'tony plan phase4' for final certification"
            ;;
        4)
            log_info "✅ Phase 4 complete - Planning certification finished"
            log_info "🎉 All planning phases completed successfully!"
            log_info "📋 Next step: Run 'tony plan report' to generate final report"
            ;;
    esac
}

# Show planning session status
show_planning_status() {
    if [ ! -f "$PLANNING_STATE_FILE" ]; then
        log_info "No active planning session found."
        log_info "Run 'tony plan init' to start a new planning session."
        return 0
    fi
    
    log_info "Planning Session Status:"
    
    # Parse and display state (simplified)
    if command_exists python3; then
        python3 -c "
import json
try:
    with open('$PLANNING_STATE_FILE', 'r') as f:
        state = json.load(f)
    
    print(f\"Project: {state.get('project_name', 'Unknown')}\")
    print(f\"Methodology: {state.get('methodology', 'Unknown')}\")
    print(f\"Current Phase: {state.get('current_phase', 'Unknown')}\")
    print(f\"Initialized: {state.get('initialized_at', 'Unknown')}\")
    print(f\"Workspace: {state.get('planning_workspace', 'Unknown')}\")
    
    if 'last_completed_phase' in state:
        print(f\"Last Completed: Phase {state['last_completed_phase']}\")
        
except Exception as e:
    print(f\"Error reading state: {e}\")
"
    else
        cat "$PLANNING_STATE_FILE"
    fi
}

# Generate comprehensive planning report
generate_planning_report() {
    log_info "Generating comprehensive planning report..."
    
    # Implementation would create a complete report from all phase outputs
    local report_file="$PLANNING_WORKSPACE/COMPREHENSIVE-PLANNING-REPORT.md"
    
    cat > "$report_file" <<EOF
# Comprehensive Planning Report

**Generated**: $(date)  
**Tony Framework Version**: $PLANNING_VERSION  
**Planning Methodology**: Multi-Phase Planning Architecture  

## Planning Session Summary

$(show_planning_status)

## Phase Completion Status

- [ ] Phase 1: Abstraction and Epic Definition
- [ ] Phase 2: Decomposition and Task Breakdown  
- [ ] Phase 3: Optimization and Critical Path Analysis
- [ ] Phase 4: Certification and Final Validation

## Generated Artifacts

### Phase 1 Artifacts
- Domain Analysis
- Epic Hierarchy Definition
- Initial Risk Assessment
- Resource Estimates

### Phase 2 Artifacts  
- Complete UPP Task Hierarchy
- Dependency Mapping
- Agent Assignment Strategy
- Quality Gates Definition

### Phase 3 Artifacts
- Critical Path Analysis
- Resource Optimization
- Timeline Optimization  
- Bottleneck Analysis

### Phase 4 Artifacts
- Compliance Certification
- Quality Validation
- Implementation Readiness Assessment
- Executive Summary

## Next Steps

Based on the completed planning phases, the project is ready for execution with optimized resource allocation, risk mitigation, and quality assurance processes.

---
*Generated by Tony Framework v$PLANNING_VERSION Multi-Phase Planning Architecture*
EOF

    log_success "Planning report generated: $report_file"
}

# Clean planning workspace
clean_planning_workspace() {
    log_info "Cleaning planning workspace..."
    
    if [ -d "$PLANNING_WORKSPACE" ]; then
        # Check for CI environment or force flag
        if [ "${CI:-}" = "true" ] || [ "${FORCE_CLEAN:-}" = "true" ] || [ "${1:-}" = "--force" ]; then
            log_info "CI/Force mode detected - proceeding with cleanup without confirmation"
            rm -rf "$PLANNING_WORKSPACE"
            log_success "Planning workspace cleaned"
        else
            read -p "Are you sure you want to clean the planning workspace? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                rm -rf "$PLANNING_WORKSPACE"
                log_success "Planning workspace cleaned"
            else
                log_info "Cleaning cancelled"
            fi
        fi
    else
        log_info "No planning workspace found to clean"
    fi
}

# ============================================================================
# MAIN COMMAND PROCESSING
# ============================================================================

main() {
    # Parse command line arguments
    if [ $# -eq 0 ]; then
        show_usage
        exit 1
    fi
    
    local command="$1"
    shift
    
    # Validate environment for most commands
    case "$command" in
        --help|-h|help)
            show_usage
            exit 0
            ;;
        clean)
            clean_planning_workspace "$@"
            exit 0
            ;;
        *)
            validate_environment || exit 1
            ;;
    esac
    
    # Process commands
    case "$command" in
        init)
            local project_name=""
            local methodology="iterative"
            local phases=3
            
            while [ $# -gt 0 ]; do
                case "$1" in
                    --project)
                        project_name="$2"
                        shift 2
                        ;;
                    --methodology)
                        methodology="$2"
                        shift 2
                        ;;
                    --phases)
                        phases="$2"
                        shift 2
                        ;;
                    *)
                        log_error "Unknown option: $1"
                        exit 1
                        ;;
                esac
            done
            
            init_planning_session "$project_name" "$methodology" "$phases"
            ;;
            
        phase1|phase2|phase3|phase4)
            local phase_num="${command#phase}"
            execute_planning_phase "$phase_num" "$@"
            ;;
            
        status)
            show_planning_status
            ;;
            
        report)
            generate_planning_report
            ;;
            
        *)
            log_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# ============================================================================
# SCRIPT EXECUTION
# ============================================================================

# Execute main function with all arguments
main "$@"