#!/bin/bash

# spawn-agent.sh - Context-aware agent spawning for Tony-NG Framework
# Enables autonomous agent handoffs with full context injection

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
MODEL="sonnet"
TIMEOUT=1800  # 30 minutes default
OUTPUT_CONTEXT=""
DEBUG=false

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FRAMEWORK_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Usage function
usage() {
    cat << EOF
Usage: $0 --context <context-file> --agent-type <agent-type> [options]

Required:
  --context <file>        Input context JSON file
  --agent-type <type>     Agent type (e.g., implementation-agent, qa-agent)

Options:
  --model <model>         Model to use (sonnet|opus) [default: sonnet]
  --timeout <seconds>     Timeout in seconds [default: 1800]
  --output-context <file> Output context file for next handoff
  --debug                 Enable debug output
  --help                  Show this help message

Example:
  $0 --context /tmp/context.json --agent-type implementation-agent --output-context /tmp/next-context.json

EOF
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --context)
            CONTEXT_FILE="$2"
            shift 2
            ;;
        --agent-type)
            AGENT_TYPE="$2"
            shift 2
            ;;
        --model)
            MODEL="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --output-context)
            OUTPUT_CONTEXT="$2"
            shift 2
            ;;
        --debug)
            DEBUG=true
            shift
            ;;
        --help)
            usage
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            ;;
    esac
done

# Validate required parameters
if [ -z "$CONTEXT_FILE" ] || [ -z "$AGENT_TYPE" ]; then
    echo -e "${RED}Error: Missing required parameters${NC}"
    usage
fi

# Validate context file exists
if [ ! -f "$CONTEXT_FILE" ]; then
    echo -e "${RED}Error: Context file not found: $CONTEXT_FILE${NC}"
    exit 1
fi

# Validate context with validation script
echo -e "${CYAN}Validating context...${NC}"
if ! node "$SCRIPT_DIR/validate-context.js" "$CONTEXT_FILE" > /dev/null 2>&1; then
    echo -e "${RED}Error: Invalid context file${NC}"
    node "$SCRIPT_DIR/validate-context.js" "$CONTEXT_FILE"
    exit 1
fi

# Extract context information using jq (or fallback to grep/sed)
if command -v jq &> /dev/null; then
    # Use jq for JSON parsing
    SESSION_ID=$(jq -r '.session.session_id' "$CONTEXT_FILE")
    CURRENT_TASK=$(jq -r '.task_context.current_task.title' "$CONTEXT_FILE")
    TASK_ID=$(jq -r '.task_context.current_task.id' "$CONTEXT_FILE")
    TASK_DESC=$(jq -r '.task_context.current_task.description' "$CONTEXT_FILE")
    EPIC_TITLE=$(jq -r '.task_context.task_hierarchy.epic.title' "$CONTEXT_FILE")
    NEXT_AGENT=$(jq -r '.handoff_instructions.next_agent_type' "$CONTEXT_FILE")
    CONTINUATION=$(jq -r '.handoff_instructions.continuation_point' "$CONTEXT_FILE")
    MODEL_FROM_CONTEXT=$(jq -r '.execution_context.model_selection.current_model // empty' "$CONTEXT_FILE")
    TOOLS=$(jq -r '.execution_context.tool_authorizations[]' "$CONTEXT_FILE" 2>/dev/null | tr '\n' ',' | sed 's/,$//')
else
    # Fallback to basic parsing
    echo -e "${YELLOW}Warning: jq not found, using basic parsing${NC}"
    SESSION_ID=$(grep -o '"session_id"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONTEXT_FILE" | cut -d'"' -f4 | head -1)
    CURRENT_TASK=$(grep -o '"title"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONTEXT_FILE" | cut -d'"' -f4 | head -1)
    TASK_ID=$(grep -o '"id"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONTEXT_FILE" | cut -d'"' -f4 | head -1)
    CONTINUATION=$(grep -o '"continuation_point"[[:space:]]*:[[:space:]]*"[^"]*"' "$CONTEXT_FILE" | cut -d'"' -f4 | head -1)
    TOOLS="Bash,Read,Write,Edit,Grep,Glob,LS"  # Default tools
fi

# Override model if specified in context
if [ -n "$MODEL_FROM_CONTEXT" ] && [ "$MODEL_FROM_CONTEXT" != "null" ]; then
    MODEL="$MODEL_FROM_CONTEXT"
fi

# Validate agent type matches expected
if [ "$AGENT_TYPE" != "$NEXT_AGENT" ] && [ "$NEXT_AGENT" != "null" ]; then
    echo -e "${YELLOW}Warning: Agent type mismatch. Expected: $NEXT_AGENT, Got: $AGENT_TYPE${NC}"
fi

# Generate timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

# Create agent prompt
echo -e "${CYAN}Constructing agent prompt...${NC}"

PROMPT="You are the $AGENT_TYPE for the Tony-NG Framework.

Session ID: $SESSION_ID
Task: $TASK_ID - $CURRENT_TASK
Epic: $EPIC_TITLE

Your specific mission: $CONTINUATION

Task Description: $TASK_DESC

First, read the full context at: $CONTEXT_FILE

Key files to review:"

# Add context files to prompt
if command -v jq &> /dev/null; then
    CONTEXT_FILES=$(jq -r '.handoff_instructions.context_files[]? | "- \(.path): \(.purpose)"' "$CONTEXT_FILE" 2>/dev/null)
    if [ -n "$CONTEXT_FILES" ]; then
        PROMPT="$PROMPT
$CONTEXT_FILES"
    fi
fi

PROMPT="$PROMPT

After completing your work:
1. Update any relevant documentation
2. Ensure all tests pass
3. Validate your implementation
4. Prepare handoff for the next agent

Remember: You have full context from the previous agent. No manual re-instruction needed."

# Debug output
if [ "$DEBUG" = true ]; then
    echo -e "${BLUE}Debug: Agent Type: $AGENT_TYPE${NC}"
    echo -e "${BLUE}Debug: Model: $MODEL${NC}"
    echo -e "${BLUE}Debug: Tools: $TOOLS${NC}"
    echo -e "${BLUE}Debug: Session ID: $SESSION_ID${NC}"
    echo -e "${BLUE}Debug: Task: $TASK_ID${NC}"
fi

# Create temporary file for agent output
TEMP_OUTPUT=$(mktemp /tmp/agent-output-XXXXXX.log)

# Construct claude command with --print flag for non-interactive mode
CLAUDE_CMD="claude --model $MODEL --print"

# Add tool authorizations if specified
if [ -n "$TOOLS" ]; then
    # Convert comma-separated to space-separated for claude CLI
    TOOLS_ARGS=$(echo "$TOOLS" | sed 's/,/ /g')
    CLAUDE_CMD="$CLAUDE_CMD --allowedTools $TOOLS_ARGS"
fi

# Create prompt file for piping to claude
PROMPT_FILE=$(mktemp /tmp/agent-prompt-XXXXXX.txt)
echo "$PROMPT" > "$PROMPT_FILE"

# Execute agent
echo -e "${GREEN}Spawning $AGENT_TYPE with model $MODEL...${NC}"
echo -e "${CYAN}Session: $SESSION_ID${NC}"
echo -e "${CYAN}Task: $TASK_ID - $CURRENT_TASK${NC}"

# Run the command and capture output
set +e  # Don't exit on error
if [ "$DEBUG" = true ]; then
    echo -e "${BLUE}Debug: Executing: $CLAUDE_CMD${NC}"
fi

# Execute and capture both stdout and stderr, piping prompt from file
$CLAUDE_CMD < "$PROMPT_FILE" 2>&1 | tee "$TEMP_OUTPUT"
AGENT_EXIT_CODE=${PIPESTATUS[0]}
set -e

# Check agent execution result
if [ $AGENT_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}Error: Agent execution failed with exit code $AGENT_EXIT_CODE${NC}"
    
    # Create failure context if output context requested
    if [ -n "$OUTPUT_CONTEXT" ]; then
        "$SCRIPT_DIR/context-manager.sh" \
            --action update \
            --context "$CONTEXT_FILE" \
            --output "$OUTPUT_CONTEXT" \
            --status failed \
            --agent "$AGENT_TYPE" \
            --end-time "$TIMESTAMP"
    fi
    
    rm -f "$TEMP_OUTPUT" "$PROMPT_FILE"
    exit $AGENT_EXIT_CODE
fi

echo -e "${GREEN}Agent completed successfully${NC}"

# Clean up prompt file
rm -f "$PROMPT_FILE"

# Generate output context if requested
if [ -n "$OUTPUT_CONTEXT" ]; then
    echo -e "${CYAN}Generating output context...${NC}"
    
    # Use context manager to update context
    "$SCRIPT_DIR/context-manager.sh" \
        --action update \
        --context "$CONTEXT_FILE" \
        --output "$OUTPUT_CONTEXT" \
        --status completed \
        --agent "$AGENT_TYPE" \
        --end-time "$TIMESTAMP" \
        --log-file "$TEMP_OUTPUT"
    
    echo -e "${GREEN}Output context saved to: $OUTPUT_CONTEXT${NC}"
    
    # Validate output context
    if node "$SCRIPT_DIR/validate-context.js" "$OUTPUT_CONTEXT" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Output context validated successfully${NC}"
    else
        echo -e "${YELLOW}⚠ Warning: Output context validation failed${NC}"
        node "$SCRIPT_DIR/validate-context.js" "$OUTPUT_CONTEXT"
    fi
fi

# Cleanup
rm -f "$TEMP_OUTPUT"

echo -e "${GREEN}✓ Agent handoff complete${NC}"