#!/bin/bash

# Tony Framework - Command Wrapper Generator
# v2.6.0 - Generates project-specific command wrappers for two-tier delegation
# Usage: generate-command-wrapper.sh <command-name> [options]

set -euo pipefail

# ============================================================================
# SCRIPT INITIALIZATION
# ============================================================================

# Get script directory and source Tony library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TONY_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$SCRIPT_DIR/lib/tony-lib.sh"

# Generator version
GENERATOR_VERSION="2.6.0"

# ============================================================================
# CONFIGURATION AND DEFAULTS
# ============================================================================

# Default configuration
DEFAULT_USER_TONY_PATH="$HOME/.tony/bin/tony"
DEFAULT_CONTEXT_DIR="$HOME/.tony/tmp"
TEMPLATE_FILE="$TONY_DIR/templates/commands/wrapper-template.sh"

# Command configuration
COMMAND_NAME=""
COMMAND_DESCRIPTION=""
OUTPUT_FILE=""
USER_TONY_PATH="$DEFAULT_USER_TONY_PATH"
PROJECT_CONTEXT_FILE=""
CUSTOM_FUNCTIONS=""
PRE_HOOK_CONTENT=""
POST_HOOK_CONTENT=""
OVERWRITE=false

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

# Show usage information
show_usage() {
    cat <<EOF
Tony Command Wrapper Generator v$GENERATOR_VERSION

USAGE:
    $(basename "$0") <command-name> [options]

ARGUMENTS:
    command-name              Name of the command to wrap (required)

OPTIONS:
    -d, --description TEXT    Command description
    -o, --output FILE         Output file path (default: ./tony-<command>)
    -u, --user-tony PATH      Path to user Tony installation
    -c, --context-file FILE   Project context file path
    -f, --functions FILE      Custom functions file to include
    --pre-hook CONTENT        Pre-command hook content
    --post-hook CONTENT       Post-command hook content
    --overwrite               Overwrite existing output file
    -h, --help                Show this help message

EXAMPLES:
    # Generate basic command wrapper
    $(basename "$0") deploy -d "Deploy application"
    
    # Generate wrapper with custom output path
    $(basename "$0") test -o ./scripts/tony-test -d "Run tests"
    
    # Generate wrapper with custom hooks
    $(basename "$0") build --pre-hook "npm install" --post-hook "npm run lint"

TEMPLATE PLACEHOLDERS:
    {{COMMAND_NAME}}              - Command name
    {{COMMAND_DESCRIPTION}}       - Command description  
    {{USER_TONY_PATH}}            - Path to user Tony
    {{PROJECT_CONTEXT_FILE}}      - Context file path
    {{GENERATION_TIMESTAMP}}      - Generation timestamp
    {{PRE_COMMAND_HOOK_CONTENT}}  - Pre-command hook code
    {{POST_COMMAND_HOOK_CONTENT}} - Post-command hook code
    {{CUSTOM_FUNCTIONS}}          - Custom function definitions

EOF
}

# Validate command arguments
validate_arguments() {
    if [ -z "$COMMAND_NAME" ]; then
        log_error "Command name is required"
        show_usage
        exit 1
    fi
    
    if [ ! -f "$TEMPLATE_FILE" ]; then
        log_error "Template file not found: $TEMPLATE_FILE"
        exit 1
    fi
    
    if [ -z "$OUTPUT_FILE" ]; then
        OUTPUT_FILE="./tony-$COMMAND_NAME"
    fi
    
    if [ -f "$OUTPUT_FILE" ] && [ "$OVERWRITE" = false ]; then
        log_error "Output file already exists: $OUTPUT_FILE"
        log_info "Use --overwrite to replace existing file"
        exit 1
    fi
    
    return 0
}

# Validate template file
validate_template() {
    if [ ! -f "$TEMPLATE_FILE" ]; then
        log_error "Template file not found: $TEMPLATE_FILE"
        return 1
    fi
    
    # Check for required placeholders
    local required_placeholders=(
        "{{COMMAND_NAME}}"
        "{{COMMAND_DESCRIPTION}}"
        "{{USER_TONY_PATH}}"
        "{{GENERATION_TIMESTAMP}}"
    )
    
    for placeholder in "${required_placeholders[@]}"; do
        if ! grep -q "$placeholder" "$TEMPLATE_FILE"; then
            log_error "Required placeholder missing in template: $placeholder"
            return 1
        fi
    done
    
    log_debug "Template validation passed"
    return 0
}

# ============================================================================
# GENERATOR FUNCTIONS
# ============================================================================

# Load custom functions from file
load_custom_functions() {
    local functions_file="$1"
    
    if [ -n "$functions_file" ] && [ -f "$functions_file" ]; then
        log_debug "Loading custom functions from: $functions_file"
        CUSTOM_FUNCTIONS=$(cat "$functions_file")
    else
        CUSTOM_FUNCTIONS="# No custom functions defined"
    fi
}

# Generate wrapper script
generate_wrapper() {
    log_info "Generating command wrapper for: $COMMAND_NAME"
    
    # Read template
    local template_content
    template_content=$(cat "$TEMPLATE_FILE")
    
    # Generate timestamp
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Set default project context file if not specified
    if [ -z "$PROJECT_CONTEXT_FILE" ]; then
        PROJECT_CONTEXT_FILE="$DEFAULT_CONTEXT_DIR/command-context-$COMMAND_NAME.json"
    fi
    
    # Replace placeholders
    local generated_content="$template_content"
    generated_content="${generated_content//\{\{COMMAND_NAME\}\}/$COMMAND_NAME}"
    generated_content="${generated_content//\{\{COMMAND_DESCRIPTION\}\}/$COMMAND_DESCRIPTION}"
    generated_content="${generated_content//\{\{USER_TONY_PATH\}\}/$USER_TONY_PATH}"
    generated_content="${generated_content//\{\{PROJECT_CONTEXT_FILE\}\}/$PROJECT_CONTEXT_FILE}"
    generated_content="${generated_content//\{\{GENERATION_TIMESTAMP\}\}/$timestamp}"
    generated_content="${generated_content//\{\{PRE_COMMAND_HOOK_CONTENT\}\}/$PRE_HOOK_CONTENT}"
    generated_content="${generated_content//\{\{POST_COMMAND_HOOK_CONTENT\}\}/$POST_HOOK_CONTENT}"
    generated_content="${generated_content//\{\{CUSTOM_FUNCTIONS\}\}/$CUSTOM_FUNCTIONS}"
    
    # Write generated wrapper
    echo "$generated_content" > "$OUTPUT_FILE"
    chmod +x "$OUTPUT_FILE"
    
    log_success "Command wrapper generated: $OUTPUT_FILE"
    
    # Show generated file info
    local file_size
    file_size=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null || echo "unknown")
    
    log_info "Generated wrapper details:"
    log_info "  Command: $COMMAND_NAME"
    log_info "  Output: $OUTPUT_FILE"
    log_info "  Size: $file_size bytes"
    log_info "  User Tony: $USER_TONY_PATH"
    log_info "  Context: $PROJECT_CONTEXT_FILE"
}

# Verify generated wrapper
verify_wrapper() {
    log_info "Verifying generated wrapper"
    
    # Check file exists and is executable
    if [ ! -f "$OUTPUT_FILE" ]; then
        log_error "Generated file not found: $OUTPUT_FILE"
        return 1
    fi
    
    if [ ! -x "$OUTPUT_FILE" ]; then
        log_error "Generated file is not executable: $OUTPUT_FILE"
        return 1
    fi
    
    # Check for bash syntax errors
    if ! bash -n "$OUTPUT_FILE"; then
        log_error "Generated wrapper has syntax errors"
        return 1
    fi
    
    # Check for required functions
    local required_functions=(
        "pre_command_hook"
        "delegate_to_user_tony"
        "post_command_hook"
        "main"
    )
    
    for func in "${required_functions[@]}"; do
        if ! grep -q "^$func()" "$OUTPUT_FILE"; then
            log_error "Required function missing: $func"
            return 1
        fi
    done
    
    log_success "Wrapper verification passed"
    return 0
}

# ============================================================================
# ARGUMENT PARSING
# ============================================================================

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--description)
                COMMAND_DESCRIPTION="$2"
                shift 2
                ;;
            -o|--output)
                OUTPUT_FILE="$2"
                shift 2
                ;;
            -u|--user-tony)
                USER_TONY_PATH="$2"
                shift 2
                ;;
            -c|--context-file)
                PROJECT_CONTEXT_FILE="$2"
                shift 2
                ;;
            -f|--functions)
                load_custom_functions "$2"
                shift 2
                ;;
            --pre-hook)
                PRE_HOOK_CONTENT="$2"
                shift 2
                ;;
            --post-hook)
                POST_HOOK_CONTENT="$2"
                shift 2
                ;;
            --overwrite)
                OVERWRITE=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            -*)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                if [ -z "$COMMAND_NAME" ]; then
                    COMMAND_NAME="$1"
                else
                    log_error "Unexpected argument: $1"
                    exit 1
                fi
                shift
                ;;
        esac
    done
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

# Main function
main() {
    log_info "Tony Command Wrapper Generator v$GENERATOR_VERSION"
    
    # Parse arguments
    parse_arguments "$@"
    
    # Set default description if not provided
    if [ -z "$COMMAND_DESCRIPTION" ]; then
        COMMAND_DESCRIPTION="Execute $COMMAND_NAME command via Tony Framework"
    fi
    
    # Validate inputs
    validate_arguments
    validate_template
    
    # Generate wrapper
    generate_wrapper
    
    # Verify generated wrapper
    verify_wrapper
    
    log_success "Command wrapper generation completed successfully"
    
    # Show usage instructions
    echo
    log_info "Usage instructions:"
    log_info "  ./$OUTPUT_FILE [arguments]"
    echo
    log_info "The wrapper will delegate to: $USER_TONY_PATH"
    log_info "Context will be saved to: $PROJECT_CONTEXT_FILE"
}

# Only run main if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi