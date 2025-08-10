#!/bin/bash

# MosAIc Framework Structure Validation Script
# CI/CD integration for framework alignment enforcement

set -e

# Configuration
PROJECT_PATH="${1:-$(pwd)}"
OUTPUT_FORMAT="${2:-human}"
FAIL_ON_WARNINGS="${3:-false}"
VERBOSE="${4:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if mosaic CLI is available
check_mosaic_cli() {
    if ! command -v mosaic &> /dev/null; then
        log_error "MosAIc CLI not found. Please install @mosaicstack/cli"
        exit 1
    fi
}

# Validate project structure
validate_structure() {
    local project_path="$1"
    local output_format="$2"
    local verbose_flag=""
    
    if [ "$VERBOSE" = "true" ]; then
        verbose_flag="--verbose"
    fi
    
    log_info "Validating project structure at: $project_path"
    
    if [ "$output_format" = "json" ]; then
        # JSON output for CI/CD parsing
        mosaic docs validate --path "$project_path" --json $verbose_flag
    else
        # Human-readable output
        mosaic docs validate --path "$project_path" $verbose_flag
    fi
}

# Parse validation results for CI/CD
parse_results() {
    local exit_code=$1
    
    if [ $exit_code -eq 0 ]; then
        log_success "Project structure is framework-aligned ✅"
        return 0
    else
        log_error "Project structure validation failed ❌"
        
        if [ "$OUTPUT_FORMAT" = "json" ]; then
            log_info "Run 'mosaic docs validate --verbose' for detailed error information"
        fi
        
        log_info "Available fixes:"
        log_info "  • Auto-fix: mosaic docs validate --fix"
        log_info "  • Migrate: mosaic docs migrate"
        log_info "  • Initialize: mosaic docs init"
        
        return 1
    fi
}

# Main execution
main() {
    log_info "MosAIc Framework Structure Validation"
    log_info "======================================"
    
    # Check prerequisites
    check_mosaic_cli
    
    # Validate project path exists
    if [ ! -d "$PROJECT_PATH" ]; then
        log_error "Project path does not exist: $PROJECT_PATH"
        exit 1
    fi
    
    # Run validation
    if validate_structure "$PROJECT_PATH" "$OUTPUT_FORMAT"; then
        validation_exit_code=0
    else
        validation_exit_code=$?
    fi
    
    # Parse and report results
    parse_results $validation_exit_code
    exit $validation_exit_code
}

# Help function
show_help() {
    cat << EOF
MosAIc Framework Structure Validation Script

Usage: $0 [PROJECT_PATH] [OUTPUT_FORMAT] [FAIL_ON_WARNINGS] [VERBOSE]

Arguments:
  PROJECT_PATH      Path to project to validate (default: current directory)
  OUTPUT_FORMAT     Output format: 'human' or 'json' (default: human)
  FAIL_ON_WARNINGS  Fail on warnings: 'true' or 'false' (default: false)
  VERBOSE          Verbose output: 'true' or 'false' (default: false)

Examples:
  $0                                    # Validate current directory
  $0 /path/to/project                   # Validate specific project
  $0 /path/to/project json              # JSON output for CI/CD
  $0 /path/to/project human true true   # Verbose, fail on warnings

Environment Variables:
  MOSAIC_VALIDATION_STRICT=true        # Fail on warnings
  MOSAIC_VALIDATION_VERBOSE=true       # Enable verbose output
  MOSAIC_VALIDATION_FORMAT=json        # Set output format

CI/CD Integration:
  # GitHub Actions
  - name: Validate Structure
    run: ./scripts/validate-structure.sh . json
  
  # GitLab CI
  validate_structure:
    script:
      - ./scripts/validate-structure.sh \$CI_PROJECT_DIR json

Exit Codes:
  0  - Validation passed
  1  - Validation failed
  2  - CLI error or missing dependencies
EOF
}

# Handle command line arguments
case "${1:-}" in
    -h|--help|help)
        show_help
        exit 0
        ;;
    *)
        main
        ;;
esac