# Tony Framework Command Wrapper System v2.6.0

## Overview

The Command Wrapper System provides two-tier delegation for Tony Framework commands, enabling project-specific command wrappers that delegate to the user's Tony installation while maintaining context and providing error handling.

## Architecture

```
Project Command Wrapper → User Tony Installation → Actual Command Execution
         ↓                        ↓                        ↓
    Context Creation         Context Processing        Result Processing
```

### Key Components

1. **Wrapper Template** (`templates/commands/wrapper-template.sh`)
   - Base template with placeholder substitution
   - Pre/post command hooks
   - Error handling and recovery
   - Context passing via JSON

2. **Generator Script** (`scripts/generate-command-wrapper.sh`)
   - Creates project-specific wrappers from template
   - Supports customization and hooks
   - Validates generated output

3. **Command Utilities** (`scripts/lib/command-utils.sh`)
   - Context management functions
   - Delegation utilities
   - Error handling helpers
   - Hook execution framework

## Usage

### Generating a Command Wrapper

```bash
# Basic wrapper generation
./scripts/generate-command-wrapper.sh deploy -d "Deploy application"

# Custom output path
./scripts/generate-command-wrapper.sh test \
  -o ./scripts/tony-test \
  -d "Run tests with Tony coordination"

# With custom hooks
./scripts/generate-command-wrapper.sh build \
  --pre-hook "npm install" \
  --post-hook "npm run lint" \
  -d "Build with dependency check"
```

### Generated Wrapper Usage

```bash
# Execute via generated wrapper
./tony-deploy --environment staging

# The wrapper will:
# 1. Execute pre-command hooks
# 2. Create execution context
# 3. Delegate to user Tony installation
# 4. Execute post-command hooks
# 5. Handle errors and cleanup
```

## Template Placeholders

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{{COMMAND_NAME}}` | Command name | `deploy` |
| `{{COMMAND_DESCRIPTION}}` | Command description | `Deploy application` |
| `{{USER_TONY_PATH}}` | Path to user Tony | `$HOME/.tony/bin/tony` |
| `{{PROJECT_CONTEXT_FILE}}` | Context file path | `/tmp/command-context.json` |
| `{{GENERATION_TIMESTAMP}}` | Generation time | `2025-07-13T10:30:00Z` |
| `{{PRE_COMMAND_HOOK_CONTENT}}` | Pre-command hook code | Custom validation |
| `{{POST_COMMAND_HOOK_CONTENT}}` | Post-command hook code | Cleanup operations |
| `{{CUSTOM_FUNCTIONS}}` | Custom function definitions | Project-specific helpers |

## Context Structure

The wrapper creates a JSON context file with project and execution information:

```json
{
    "metadata": {
        "command": "deploy",
        "description": "Deploy application",
        "timestamp": "2025-07-13T10:30:00Z",
        "wrapper_version": "2.6.0",
        "pid": 12345
    },
    "project": {
        "path": "/path/to/project",
        "git": {
            "branch": "main",
            "modified_files": 2,
            "remote": "git@github.com:user/repo.git"
        }
    },
    "execution": {
        "args": ["--environment", "staging"],
        "env": {
            "USER": "developer",
            "PWD": "/path/to/project",
            "SHELL": "/bin/bash"
        }
    },
    "system": {
        "hostname": "dev-machine",
        "os": "Linux",
        "arch": "x86_64"
    }
}
```

## Hook System

### Pre-Command Hooks

Execute before delegating to user Tony:

```bash
pre_command_hook() {
    log_debug "Executing pre-command hook for $COMMAND_NAME"
    
    # Validate environment
    if [ ! -f "package.json" ]; then
        log_error "Not a Node.js project"
        return 1
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        npm install
    fi
    
    return 0
}
```

### Post-Command Hooks

Execute after command completion:

```bash
post_command_hook() {
    local exit_code=$1
    log_debug "Executing post-command hook (exit: $exit_code)"
    
    # Run linting if command succeeded
    if [ $exit_code -eq 0 ]; then
        log_info "Running post-deployment checks..."
        npm run lint
    fi
    
    # Cleanup temporary files
    rm -f .deployment-temp
    
    return 0
}
```

## Error Handling

The wrapper system provides comprehensive error handling:

### User Tony Missing

```bash
handle_missing_tony() {
    log_error "User Tony Framework not found"
    echo
    echo "To install Tony Framework:"
    echo "  curl -fsSL https://tony.jetrich.com/install | bash"
    echo
    exit 1
}
```

### Command Delegation Errors

```bash
handle_delegation_error() {
    local exit_code=$1
    local error_msg="${2:-Unknown error}"
    
    log_error "Command failed: $error_msg"
    
    # Provide recovery suggestions based on exit code
    case $exit_code in
        1) echo "  - Check command arguments and syntax" ;;
        127) echo "  - Command not found - check Tony installation" ;;
        130) echo "  - Command interrupted (Ctrl+C)" ;;
    esac
    
    exit $exit_code
}
```

## Examples

### Basic Deployment Wrapper

```bash
# Generate deployment wrapper
./scripts/generate-command-wrapper.sh deploy \
  -d "Deploy application with Tony coordination" \
  -o ./scripts/deploy

# Use the wrapper
./scripts/deploy --environment production --verbose
```

### Test Runner Wrapper

```bash
# Generate test wrapper with hooks
./scripts/generate-command-wrapper.sh test \
  --pre-hook "npm ci" \
  --post-hook "npm run coverage" \
  -d "Run tests with dependency installation"

# Execute tests
./tony-test --suite integration
```

### Build Wrapper with Custom Functions

Create a custom functions file:

```bash
# build-functions.sh
validate_build_environment() {
    if [ ! -f "Dockerfile" ]; then
        log_error "Dockerfile not found"
        return 1
    fi
    
    if ! command_exists docker; then
        log_error "Docker not installed"
        return 1
    fi
    
    return 0
}

post_build_deploy() {
    local exit_code=$1
    if [ $exit_code -eq 0 ]; then
        log_info "Build successful, pushing to registry..."
        docker push myapp:latest
    fi
}
```

Generate wrapper with custom functions:

```bash
./scripts/generate-command-wrapper.sh build \
  -f ./build-functions.sh \
  --pre-hook "validate_build_environment" \
  --post-hook "post_build_deploy" \
  -d "Build and deploy application"
```

## Integration with Tony Library

The wrapper system integrates with the Tony library for consistent functionality:

```bash
# Source Tony library
source "$SCRIPT_DIR/lib/tony-lib.sh"

# Use Tony utilities
log_info "Starting command delegation"
ensure_directory "$HOME/.tony/tmp"
track_bash_call  # Track API reduction metrics
```

## Security Considerations

1. **Input Validation**: All user inputs are validated before processing
2. **Path Sanitization**: File paths are sanitized to prevent directory traversal
3. **Execution Context**: Commands execute in controlled environment
4. **Error Information**: Sensitive information is not exposed in error messages

## Performance Optimization

1. **Context Caching**: Reuse context for multiple commands
2. **Lazy Loading**: Load utilities only when needed
3. **Parallel Execution**: Support concurrent wrapper execution
4. **Resource Cleanup**: Automatic cleanup of temporary files

## Troubleshooting

### Common Issues

1. **Wrapper Not Executable**
   ```bash
   chmod +x ./tony-command
   ```

2. **User Tony Not Found**
   ```bash
   # Install Tony Framework
   curl -fsSL https://tony.jetrich.com/install | bash
   ```

3. **Context File Errors**
   ```bash
   # Check permissions and disk space
   mkdir -p ~/.tony/tmp
   chmod 755 ~/.tony/tmp
   ```

### Debug Mode

Enable debug logging for troubleshooting:

```bash
export TONY_DEBUG=1
./tony-command --verbose
```

## API Reference

### Generator Script Options

```bash
generate-command-wrapper.sh <command-name> [options]

Options:
  -d, --description TEXT    Command description
  -o, --output FILE         Output file path
  -u, --user-tony PATH      Path to user Tony installation
  -c, --context-file FILE   Project context file path
  -f, --functions FILE      Custom functions file
  --pre-hook CONTENT        Pre-command hook content
  --post-hook CONTENT       Post-command hook content
  --overwrite               Overwrite existing output file
  -h, --help                Show help message
```

### Utility Functions

```bash
# Environment validation
validate_wrapper_environment()
check_user_tony(tony_path)

# Context management
create_command_context(name, description, args...)
save_command_context(json, file)
load_command_context(file)

# Command delegation
build_delegation_command(tony_path, command, context_file, args...)
execute_delegated_command(command, context_file)

# Error handling
handle_delegation_error(exit_code, command, message, context_file)
suggest_error_recovery(exit_code, command)

# Hook execution
execute_hook(hook_name, function_name, args...)
validate_hook_function(function_name)

# Lifecycle management
init_command_wrapper(command_name, description)
cleanup_command_wrapper(context_file)
```

## Version History

- **v2.6.0**: Initial command wrapper system implementation
- **v2.6.1**: Enhanced error handling and recovery suggestions
- **v2.6.2**: Added custom function support and hook validation
- **v2.6.3**: Improved context management and parallel execution support