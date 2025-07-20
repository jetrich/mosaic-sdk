#!/bin/bash

# Tony Framework - Verification Script
# Comprehensive framework validation with detailed reporting

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source shared utilities
source "$SCRIPT_DIR/shared/logging-utils.sh"
source "$SCRIPT_DIR/shared/version-utils.sh"
source "$SCRIPT_DIR/shared/github-utils.sh"

# Configuration
TONY_USER_DIR="$HOME/.claude/tony"
MODE="comprehensive"
INCLUDE_PROJECTS=false
FIX_ISSUES=false
VERBOSE=false
OUTPUT_FORMAT="console"

# Display usage information
show_usage() {
    show_banner "Tony Framework Verification Script" "Comprehensive system validation and health checks"
    
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --comprehensive       Complete verification (default)"
    echo "  --quick               Quick health check only"
    echo "  --components          Verify framework components only"
    echo "  --integration         Verify CLAUDE.md integration only"
    echo "  --include-projects    Include project deployment verification"
    echo "  --fix-issues          Attempt to fix detected issues"
    echo "  --format=FORMAT       Output format (console, json, report)"
    echo "  --verbose             Enable verbose output"
    echo "  --help                Show this help message"
    echo ""
    echo "Output Formats:"
    echo "  console               Formatted console output (default)"
    echo "  json                  JSON format for automation"
    echo "  report                Detailed text report"
    echo ""
    echo "Examples:"
    echo "  $0 --comprehensive --include-projects    # Full system verification"
    echo "  $0 --quick                              # Fast health check"
    echo "  $0 --components --fix-issues            # Fix component issues"
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --comprehensive)
                MODE="comprehensive"
                ;;
            --quick)
                MODE="quick"
                ;;
            --components)
                MODE="components"
                ;;
            --integration)
                MODE="integration"
                ;;
            --include-projects)
                INCLUDE_PROJECTS=true
                ;;
            --fix-issues)
                FIX_ISSUES=true
                ;;
            --format=*)
                OUTPUT_FORMAT="${1#*=}"
                ;;
            --verbose)
                VERBOSE=true
                enable_verbose
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
        shift
    done
}

# Initialize verification system
init_verification() {
    log_debug "Initializing verification system"
    
    # Create temporary directory for verification data
    VERIFY_TEMP_DIR="/tmp/tony-verify-$$"
    mkdir -p "$VERIFY_TEMP_DIR"
    
    # Initialize counters
    TOTAL_CHECKS=0
    PASSED_CHECKS=0
    FAILED_CHECKS=0
    WARNING_CHECKS=0
    FIXED_ISSUES=0
}

# Verification check function
verify_check() {
    local check_name="$1"
    local check_description="$2"
    local check_command="$3"
    local fix_command="${4:-}"
    local check_level="${5:-error}"  # error, warning, info
    
    ((TOTAL_CHECKS++))
    
    log_debug "Running check: $check_name"
    
    # Run the check
    local check_result=0
    eval "$check_command" >/dev/null 2>&1 || check_result=$?
    
    if [ $check_result -eq 0 ]; then
        ((PASSED_CHECKS++))
        echo "PASS|$check_name|$check_description|OK|" >> "$VERIFY_TEMP_DIR/results"
        log_debug "✅ $check_name: PASSED"
    else
        case "$check_level" in
            "warning")
                ((WARNING_CHECKS++))
                echo "WARN|$check_name|$check_description|Warning|$fix_command" >> "$VERIFY_TEMP_DIR/results"
                log_debug "⚠️  $check_name: WARNING"
                ;;
            *)
                ((FAILED_CHECKS++))
                echo "FAIL|$check_name|$check_description|Failed|$fix_command" >> "$VERIFY_TEMP_DIR/results"
                log_debug "❌ $check_name: FAILED"
                
                # Attempt to fix if requested and fix command provided
                if [ "$FIX_ISSUES" = true ] && [ -n "$fix_command" ]; then
                    log_info "Attempting to fix: $check_name"
                    if eval "$fix_command" >/dev/null 2>&1; then
                        ((FIXED_ISSUES++))
                        log_success "Fixed: $check_name"
                        
                        # Re-run the check
                        if eval "$check_command" >/dev/null 2>&1; then
                            ((FAILED_CHECKS--))
                            ((PASSED_CHECKS++))
                            # Update result
                            sed -i "s/FAIL|$check_name|/PASS|$check_name|/" "$VERIFY_TEMP_DIR/results"
                        fi
                    else
                        log_error "Failed to fix: $check_name"
                    fi
                fi
                ;;
        esac
    fi
}

# Verify framework directory structure
verify_directory_structure() {
    print_subsection "Directory Structure Verification"
    
    # Required directories
    local required_dirs=(
        "$TONY_USER_DIR"
        "$TONY_USER_DIR/metadata"
        "$TONY_USER_DIR/logs"
        "$TONY_USER_DIR/backups"
    )
    
    for dir in "${required_dirs[@]}"; do
        verify_check \
            "dir_$(basename "$dir")" \
            "Directory exists: $dir" \
            "[ -d \"$dir\" ]" \
            "mkdir -p \"$dir\""
    done
    
    # Check directory permissions
    verify_check \
        "dir_permissions" \
        "Tony directory writable" \
        "[ -w \"$TONY_USER_DIR\" ]" \
        "chmod 755 \"$TONY_USER_DIR\""
}

# Verify framework components
verify_framework_components() {
    print_subsection "Framework Components Verification"
    
    local components=(
        "TONY-CORE.md:Core coordination framework"
        "TONY-TRIGGERS.md:Natural language trigger detection"
        "TONY-SETUP.md:Project deployment automation"
        "AGENT-BEST-PRACTICES.md:Agent coordination standards"
        "DEVELOPMENT-GUIDELINES.md:Development standards"
    )
    
    for component in "${components[@]}"; do
        local file_name description
        IFS=':' read -r file_name description <<< "$component"
        local file_path="$TONY_USER_DIR/$file_name"
        
        # Check if file exists
        verify_check \
            "component_exists_$(basename "$file_name" .md)" \
            "Component exists: $file_name" \
            "[ -f \"$file_path\" ]" \
            "log_error 'Component missing - reinstall framework'"
        
        # Check if file has content
        verify_check \
            "component_content_$(basename "$file_name" .md)" \
            "Component has content: $file_name" \
            "[ -s \"$file_path\" ]" \
            "log_error 'Component empty - reinstall framework'"
        
        # Check for valid markdown structure
        if [ -f "$file_path" ]; then
            verify_check \
                "component_structure_$(basename "$file_name" .md)" \
                "Component structure valid: $file_name" \
                "grep -q '^# ' \"$file_path\"" \
                "" \
                "warning"
        fi
    done
    
    # Verify component versions match
    local version_consistency=true
    local expected_version
    expected_version=$(get_user_version)
    
    if [ "$expected_version" != "not-installed" ] && [ "$expected_version" != "unknown" ]; then
        for component in "${components[@]}"; do
            local file_name
            IFS=':' read -r file_name _ <<< "$component"
            local file_path="$TONY_USER_DIR/$file_name"
            
            if [ -f "$file_path" ]; then
                local component_version
                component_version=$(extract_version_from_component "$file_path")
                if [ "$component_version" != "$expected_version" ] && [ "$component_version" != "unknown" ]; then
                    version_consistency=false
                    break
                fi
            fi
        done
        
        verify_check \
            "component_versions" \
            "Component versions consistent" \
            "[ \"$version_consistency\" = true ]" \
            "log_warning 'Version mismatch - consider reinstall'"
    fi
}

# Verify metadata integrity
verify_metadata() {
    print_subsection "Metadata Verification"
    
    local version_file="$TONY_USER_DIR/metadata/VERSION"
    
    # Check version file exists
    verify_check \
        "metadata_version_file" \
        "Version metadata file exists" \
        "[ -f \"$version_file\" ]" \
        "log_error 'Metadata missing - reinstall framework'"
    
    if [ -f "$version_file" ]; then
        # Check required fields
        local required_fields=(
            "Framework-Version"
            "Architecture"
            "Installation-Date"
        )
        
        for field in "${required_fields[@]}"; do
            verify_check \
                "metadata_field_$(echo "$field" | tr '-' '_' | tr '[:upper:]' '[:lower:]')" \
                "Metadata field exists: $field" \
                "grep -q \"^$field:\" \"$version_file\"" \
                ""
        done
        
        # Validate version format
        local version
        version=$(grep "Framework-Version:" "$version_file" | cut -d' ' -f2 2>/dev/null || echo "")
        if [ -n "$version" ]; then
            verify_check \
                "metadata_version_format" \
                "Version format valid" \
                "is_valid_version \"$version\"" \
                ""
        fi
    fi
}

# Verify CLAUDE.md integration
verify_claude_integration() {
    print_subsection "CLAUDE.md Integration Verification"
    
    local claude_md="$HOME/.claude/CLAUDE.md"
    
    # Check if CLAUDE.md exists
    verify_check \
        "claude_md_exists" \
        "CLAUDE.md file exists" \
        "[ -f \"$claude_md\" ]" \
        "log_warning 'CLAUDE.md missing - Tony not integrated'"
    
    if [ -f "$claude_md" ]; then
        # Check for Tony integration
        verify_check \
            "claude_integration_present" \
            "Tony integration section present" \
            "grep -q 'Tony Framework.*Integration' \"$claude_md\"" \
            "log_warning 'Integration missing - run install script'"
        
        # Check integration version
        if grep -q "Tony Framework.*Integration" "$claude_md"; then
            verify_check \
                "claude_integration_version" \
                "Integration version detected" \
                "grep -q 'Framework Version' \"$claude_md\"" \
                "" \
                "warning"
            
            # Check for AUTO-MANAGED sections
            verify_check \
                "claude_auto_managed" \
                "AUTO-MANAGED sections properly marked" \
                "grep -q 'AUTO-MANAGED:' \"$claude_md\" && grep -q 'END AUTO-MANAGED' \"$claude_md\"" \
                "" \
                "warning"
        fi
        
        # Check file is not corrupted
        verify_check \
            "claude_md_readable" \
            "CLAUDE.md file readable" \
            "[ -r \"$claude_md\" ]" \
            "chmod 644 \"$claude_md\""
    fi
}

# Verify system dependencies
verify_system_dependencies() {
    print_subsection "System Dependencies Verification"
    
    local required_tools=(
        "git:Git version control"
        "curl:HTTP client for GitHub API"
        "grep:Text pattern matching"
        "sed:Stream editor"
        "sort:Text sorting"
        "tail:File tail utility"
        "md5sum:File integrity checking"
    )
    
    for tool in "${required_tools[@]}"; do
        local tool_name description
        IFS=':' read -r tool_name description <<< "$tool"
        
        verify_check \
            "tool_$tool_name" \
            "Required tool available: $tool_name" \
            "command -v \"$tool_name\" >/dev/null 2>&1" \
            "log_error 'Install $tool_name package'"
    done
    
    # Check bash version
    verify_check \
        "bash_version" \
        "Bash version 4.0+ available" \
        "[ \"\${BASH_VERSION%%.*}\" -ge 4 ]" \
        "log_warning 'Upgrade bash to version 4.0+'" \
        "warning"
}

# Verify project deployments
verify_project_deployments() {
    print_subsection "Project Deployments Verification"
    
    local project_versions
    project_versions=$(get_project_versions)
    
    if [ -z "$project_versions" ]; then
        log_info "No project deployments found"
        return 0
    fi
    
    local project_count=0
    while IFS= read -r line; do
        if [ -n "$line" ]; then
            local project_path project_version
            IFS=':' read -r project_path project_version _ <<< "$line"
            
            ((project_count++))
            local project_name
            project_name=$(basename "$project_path")
            
            # Check project infrastructure
            verify_check \
                "project_${project_count}_infrastructure" \
                "Project $project_name: Infrastructure exists" \
                "[ -d \"$project_path/docs/agent-management\" ]" \
                "log_warning 'Project infrastructure incomplete'"
            
            # Check engage command
            verify_check \
                "project_${project_count}_engage" \
                "Project $project_name: Engage command exists" \
                "[ -f \"$project_path/.claude/commands/engage.md\" ]" \
                "log_warning 'Engage command missing'" \
                "warning"
            
            # Check scratchpad
            verify_check \
                "project_${project_count}_scratchpad" \
                "Project $project_name: Scratchpad exists" \
                "[ -f \"$project_path/docs/agent-management/tech-lead-tony/scratchpad.md\" ]" \
                "log_warning 'Scratchpad missing'" \
                "warning"
        fi
    done <<< "$project_versions"
    
    log_info "Verified $project_count project deployments"
}

# Verify file integrity
verify_file_integrity() {
    print_subsection "File Integrity Verification"
    
    # Check for backup files
    if [ -d "$TONY_USER_DIR/backups" ]; then
        local backup_count
        backup_count=$(find "$TONY_USER_DIR/backups" -name "*.md" -type f | wc -l)
        
        verify_check \
            "backups_exist" \
            "User content backups exist" \
            "[ $backup_count -gt 0 ]" \
            "log_info 'No backups found - normal for new installation'" \
            "warning"
    fi
    
    # Check log files
    if [ -f "$TONY_USER_DIR/logs/tony-commands.log" ]; then
        verify_check \
            "log_file_readable" \
            "Log file readable" \
            "[ -r \"$TONY_USER_DIR/logs/tony-commands.log\" ]" \
            "chmod 644 \"$TONY_USER_DIR/logs/tony-commands.log\""
        
        # Check log file size
        local log_size
        log_size=$(stat -c%s "$TONY_USER_DIR/logs/tony-commands.log" 2>/dev/null || echo "0")
        verify_check \
            "log_file_size" \
            "Log file size reasonable (<50MB)" \
            "[ $log_size -lt 52428800 ]" \
            "mv \"$TONY_USER_DIR/logs/tony-commands.log\" \"$TONY_USER_DIR/logs/tony-commands.log.old\"" \
            "warning"
    fi
}

# Generate verification report
generate_report() {
    print_section "Verification Report"
    
    local results_file="$VERIFY_TEMP_DIR/results"
    
    if [ ! -f "$results_file" ]; then
        log_error "No verification results found"
        return 1
    fi
    
    # Summary statistics
    print_status_box "Verification Summary" \
        "Total Checks: $TOTAL_CHECKS" \
        "Passed: $PASSED_CHECKS" \
        "Failed: $FAILED_CHECKS" \
        "Warnings: $WARNING_CHECKS" \
        "Issues Fixed: $FIXED_ISSUES"
    
    # Detailed results
    if [ "$FAILED_CHECKS" -gt 0 ] || [ "$WARNING_CHECKS" -gt 0 ]; then
        echo ""
        echo -e "${RED}❌ Failed Checks:${NC}"
        grep "^FAIL|" "$results_file" | while IFS='|' read -r status name description result fix_cmd; do
            echo "  • $name: $description"
            if [ -n "$fix_cmd" ] && [ "$fix_cmd" != "log_error "* ]; then
                echo "    Fix: $fix_cmd"
            fi
        done
        
        if [ "$WARNING_CHECKS" -gt 0 ]; then
            echo ""
            echo -e "${YELLOW}⚠️  Warning Checks:${NC}"
            grep "^WARN|" "$results_file" | while IFS='|' read -r status name description result fix_cmd; do
                echo "  • $name: $description"
            done
        fi
    fi
    
    # Overall status
    echo ""
    if [ "$FAILED_CHECKS" -eq 0 ]; then
        if [ "$WARNING_CHECKS" -eq 0 ]; then
            print_status_box "Overall Status: ✅ EXCELLENT" \
                "All verification checks passed" \
                "System is healthy and ready for use" \
                "No issues detected"
        else
            print_status_box "Overall Status: ✅ GOOD" \
                "All critical checks passed" \
                "$WARNING_CHECKS minor warning(s) detected" \
                "System is functional"
        fi
        return 0
    else
        print_error_box "Overall Status: ❌ ISSUES DETECTED" \
            "$FAILED_CHECKS critical issue(s) found" \
            "$WARNING_CHECKS warning(s) detected" \
            "System may not function correctly" \
            "Run with --fix-issues to attempt repairs"
        return 1
    fi
}

# Format JSON output
format_json_output() {
    local results_file="$VERIFY_TEMP_DIR/results"
    
    echo "{"
    echo "  \"verification_summary\": {"
    echo "    \"total_checks\": $TOTAL_CHECKS,"
    echo "    \"passed_checks\": $PASSED_CHECKS,"
    echo "    \"failed_checks\": $FAILED_CHECKS,"
    echo "    \"warning_checks\": $WARNING_CHECKS,"
    echo "    \"fixed_issues\": $FIXED_ISSUES,"
    echo "    \"overall_status\": \"$([ $FAILED_CHECKS -eq 0 ] && echo "PASS" || echo "FAIL")\""
    echo "  },"
    echo "  \"check_results\": ["
    
    if [ -f "$results_file" ]; then
        local first_entry=true
        while IFS='|' read -r status name description result fix_cmd; do
            if [ "$first_entry" = false ]; then
                echo ","
            fi
            first_entry=false
            
            echo "    {"
            echo "      \"name\": \"$name\","
            echo "      \"description\": \"$description\","
            echo "      \"status\": \"$status\","
            echo "      \"result\": \"$result\""
            if [ -n "$fix_cmd" ]; then
                echo "      ,\"fix_command\": \"$fix_cmd\""
            fi
            echo -n "    }"
        done < "$results_file"
    fi
    
    echo ""
    echo "  ],"
    echo "  \"timestamp\": \"$(date -u '+%Y-%m-%d %H:%M:%S UTC')\""
    echo "}"
}

# Main verification function
run_verification() {
    case "$MODE" in
        "comprehensive")
            verify_directory_structure
            verify_framework_components
            verify_metadata
            verify_claude_integration
            verify_system_dependencies
            verify_file_integrity
            if [ "$INCLUDE_PROJECTS" = true ]; then
                verify_project_deployments
            fi
            ;;
        "quick")
            verify_directory_structure
            verify_framework_components
            verify_claude_integration
            ;;
        "components")
            verify_framework_components
            verify_metadata
            ;;
        "integration")
            verify_claude_integration
            ;;
        *)
            log_error "Invalid verification mode: $MODE"
            return 1
            ;;
    esac
}

# Cleanup function
cleanup_verification() {
    if [ -d "$VERIFY_TEMP_DIR" ]; then
        rm -rf "$VERIFY_TEMP_DIR"
    fi
}

# Main execution
main() {
    # Parse arguments
    parse_arguments "$@"
    
    # Initialize verification
    init_verification
    
    # Show banner
    show_banner "Tony Framework Verification" "Comprehensive system health check"
    
    # Run verification checks
    run_verification
    
    # Generate and display report
    case "$OUTPUT_FORMAT" in
        "console")
            generate_report
            local exit_code=$?
            ;;
        "json")
            format_json_output
            local exit_code=0
            [ "$FAILED_CHECKS" -eq 0 ] || exit_code=1
            ;;
        "report")
            # Text report format could be implemented here
            generate_report > "$TONY_USER_DIR/verification-report.txt"
            log_info "Detailed report saved to: $TONY_USER_DIR/verification-report.txt"
            local exit_code=0
            [ "$FAILED_CHECKS" -eq 0 ] || exit_code=1
            ;;
        *)
            log_error "Unknown output format: $OUTPUT_FORMAT"
            local exit_code=1
            ;;
    esac
    
    # Cleanup
    cleanup_verification
    
    exit $exit_code
}

# Trap for cleanup
trap cleanup_verification EXIT

# Execute main function with all arguments
main "$@"