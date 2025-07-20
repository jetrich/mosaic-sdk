#!/bin/bash

# Tony Framework - Docker Management Script
# Enforce Docker Compose v2 and best practices

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source shared utilities
source "$SCRIPT_DIR/shared/logging-utils.sh"
source "$SCRIPT_DIR/shared/docker-utils.sh"

# Configuration
MODE="validate"
PROJECT_PATH=""
OUTPUT_DIR="docs/audit/docker"
BACKUP=true
FORCE=false
VERBOSE=false

# Display usage information
show_usage() {
    show_banner "Tony Docker Management" "Enforce Docker Compose v2 and container best practices"
    
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  validate              Validate Docker Compose v2 setup (default)"
    echo "  scan                  Scan project for Docker Compose files and issues"
    echo "  check-deprecated      Check for deprecated docker compose usage"
    echo "  auto-fix              Automatically fix deprecated docker compose usage"
    echo "  generate-report       Generate comprehensive Docker best practices report"
    echo ""
    echo "Options:"
    echo "  --path=PATH           Target project path (default: current directory)"
    echo "  --output-dir=DIR      Output directory for reports (default: docs/audit/docker)"
    echo "  --no-backup           Don't create backup files when auto-fixing"
    echo "  --force               Force operation without confirmation"
    echo "  --verbose             Enable verbose output"
    echo "  --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 validate                                    # Validate Docker setup"
    echo "  $0 scan --path=/home/user/project             # Scan specific project"
    echo "  $0 check-deprecated                           # Check for deprecated usage"
    echo "  $0 auto-fix --no-backup                       # Fix without backups"
    echo "  $0 generate-report --output-dir=reports       # Generate report"
}

# Parse command line arguments
parse_arguments() {
    if [ $# -eq 0 ]; then
        MODE="validate"
        return 0
    fi
    
    # First argument is the command
    MODE="$1"
    shift
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --path=*)
                PROJECT_PATH="${1#*=}"
                ;;
            --output-dir=*)
                OUTPUT_DIR="${1#*=}"
                ;;
            --no-backup)
                BACKUP=false
                ;;
            --force)
                FORCE=true
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
    
    # Set default project path
    if [ -z "$PROJECT_PATH" ]; then
        PROJECT_PATH="$(pwd)"
    fi
}

# Validate Docker Compose setup
validate_command() {
    print_section "Docker Compose v2 Validation"
    
    # Initialize docker utilities
    if ! init_docker_utils; then
        log_error "Failed to initialize Docker utilities"
        return 1
    fi
    
    # Validate Docker Compose
    if validate_docker_compose; then
        echo ""
        log_success "🐳 Docker Compose v2 setup is correct"
        echo ""
        echo "✅ Verification complete:"
        echo "  • Docker Compose v2 available"
        echo "  • Modern 'docker compose' command works"
        echo "  • Ready for container orchestration"
        return 0
    else
        echo ""
        log_error "❌ Docker Compose v2 setup issues detected"
        echo ""
        echo "🔧 Required actions:"
        echo "  1. Install Docker Desktop (includes Compose v2)"
        echo "  2. Or install Docker Compose v2 plugin manually"
        echo "  3. Verify with: docker compose version"
        return 1
    fi
}

# Scan project for Docker-related files and issues
scan_command() {
    print_section "Docker Project Analysis: $PROJECT_PATH"
    
    local issues_found=0
    
    # Initialize docker utilities
    if ! init_docker_utils; then
        log_warning "Docker not properly configured"
        ((issues_found++))
    fi
    
    # Scan for compose files
    echo ""
    print_subsection "Docker Compose Files"
    if scan_docker_compose_files "$PROJECT_PATH"; then
        log_success "Docker Compose files found"
    else
        log_info "No Docker Compose files detected"
    fi
    
    # Check for deprecated usage
    echo ""
    print_subsection "Deprecated Usage Check"
    if check_deprecated_docker_compose_usage "$PROJECT_PATH"; then
        log_success "No deprecated 'docker compose' usage found"
    else
        log_warning "Deprecated 'docker compose' usage detected"
        ((issues_found++))
    fi
    
    # Summary
    echo ""
    if [ $issues_found -eq 0 ]; then
        log_success "🐳 Docker analysis complete - no issues found"
    else
        log_warning "🐳 Docker analysis complete - $issues_found issue(s) found"
        echo ""
        echo "🔧 Recommended actions:"
        echo "  1. Run: $0 auto-fix                    # Fix deprecated usage"
        echo "  2. Run: $0 generate-report             # Get detailed report"
    fi
    
    return $issues_found
}

# Check for deprecated docker compose usage
check_deprecated_command() {
    print_section "Checking for Deprecated docker compose Usage"
    
    if check_deprecated_docker_compose_usage "$PROJECT_PATH"; then
        echo ""
        log_success "✅ No deprecated 'docker compose' usage found"
        echo ""
        echo "🐳 Project follows Docker Compose v2 best practices:"
        echo "  • Uses 'docker compose' command"
        echo "  • No legacy docker compose references"
        echo "  • Ready for modern Docker workflows"
        return 0
    else
        echo ""
        log_warning "⚠️  Deprecated 'docker compose' usage found"
        echo ""
        echo "🔧 To fix automatically:"
        echo "  $0 auto-fix"
        echo ""
        echo "🔧 To fix manually:"
        echo "  sed -i 's/docker compose/docker compose/g' script.sh"
        return 1
    fi
}

# Auto-fix deprecated docker compose usage
auto_fix_command() {
    print_section "Auto-Fixing Deprecated docker compose Usage"
    
    # Check if there's anything to fix
    if check_deprecated_docker_compose_usage "$PROJECT_PATH" >/dev/null 2>&1; then
        log_info "No deprecated usage found - nothing to fix"
        return 0
    fi
    
    echo ""
    log_info "🔧 Found deprecated 'docker compose' usage in project"
    echo ""
    echo "This will replace all instances of 'docker compose' with 'docker compose'"
    
    if [ "$BACKUP" = true ]; then
        echo "📁 Backup files will be created (.backup extension)"
    else
        echo "⚠️  No backups will be created"
    fi
    
    if [ "$FORCE" != true ]; then
        echo ""
        read -p "Proceed with auto-fix? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log_info "Auto-fix cancelled"
            return 0
        fi
    fi
    
    echo ""
    if auto_fix_deprecated_usage "$PROJECT_PATH" "$BACKUP"; then
        echo ""
        log_success "🎉 Auto-fix completed successfully!"
        echo ""
        echo "🔍 Next steps:"
        echo "  1. Test your scripts: docker compose --version"
        echo "  2. Run your compose commands: docker compose up"
        echo "  3. Commit changes: git add . && git commit -m 'fix: update to docker compose v2'"
        return 0
    else
        log_error "Auto-fix failed"
        return 1
    fi
}

# Generate comprehensive Docker best practices report
generate_report_command() {
    print_section "Generating Docker Best Practices Report"
    
    # Create output directory
    mkdir -p "$OUTPUT_DIR"
    
    local report_file="$OUTPUT_DIR/docker-best-practices-$(date +%Y-%m-%d).md"
    
    if generate_docker_best_practices_report "$PROJECT_PATH" "$report_file"; then
        echo ""
        log_success "📊 Docker best practices report generated"
        echo ""
        echo "📁 Report location: $report_file"
        echo ""
        echo "📋 Report includes:"
        echo "  • Docker Compose v2 compliance analysis"
        echo "  • Deprecated usage detection"
        echo "  • Best practices recommendations"
        echo "  • Migration guidance"
        echo ""
        echo "🔍 View report: cat '$report_file'"
        return 0
    else
        log_error "Failed to generate report"
        return 1
    fi
}

# Main execution
main() {
    # Parse arguments
    parse_arguments "$@"
    
    # Execute command
    case "$MODE" in
        "validate")
            validate_command
            ;;
        "scan")
            scan_command
            ;;
        "check-deprecated")
            check_deprecated_command
            ;;
        "auto-fix")
            auto_fix_command
            ;;
        "generate-report")
            generate_report_command
            ;;
        *)
            log_error "Unknown command: $MODE"
            show_usage
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"