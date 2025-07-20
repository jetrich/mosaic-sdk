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
USE_TMUX=true  # Default to tmux mode as per E.052 requirements

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
  --tmux                  Use tmux orchestration (default)
  --no-tmux               Disable tmux orchestration (legacy mode)
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
        --tmux)
            USE_TMUX=true
            shift
            ;;
        --no-tmux)
            USE_TMUX=false
            shift
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

# Tmux orchestration setup
if [ "$USE_TMUX" = true ]; then
    # Check if tmux is available
    if ! command -v tmux &> /dev/null; then
        echo -e "${YELLOW}Warning: tmux not found, falling back to legacy mode${NC}"
        USE_TMUX=false
    else
        # Initialize tmux environment if needed
        TMUX_ORCHESTRATOR="$SCRIPT_DIR/tmux-orchestrator.sh"
        if [ ! -f "$TMUX_ORCHESTRATOR" ]; then
            echo -e "${RED}Error: tmux-orchestrator.sh not found at $TMUX_ORCHESTRATOR${NC}"
            exit 1
        fi
        
        # Initialize tmux environment if not already done
        if ! tmux has-session -t "tony-main" 2>/dev/null; then
            echo -e "${CYAN}Initializing tmux orchestration environment...${NC}"
            "$TMUX_ORCHESTRATOR" init
        fi
        
        # Generate unique session name for this agent
        AGENT_SESSION_NAME="${AGENT_TYPE}-$(date +%s)-$(shuf -i 1000-9999 -n 1)"
    fi
fi

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

if [ "$USE_TMUX" = true ]; then
    echo -e "${CYAN}Mode: Tmux orchestration (session: $AGENT_SESSION_NAME)${NC}"
else
    echo -e "${CYAN}Mode: Legacy (background process)${NC}"
fi

# Run the command and capture output
set +e  # Don't exit on error
if [ "$DEBUG" = true ]; then
    echo -e "${BLUE}Debug: Executing: $CLAUDE_CMD${NC}"
    if [ "$USE_TMUX" = true ]; then
        echo -e "${BLUE}Debug: Tmux session: $AGENT_SESSION_NAME${NC}"
    fi
fi

if [ "$USE_TMUX" = true ]; then
    # Execute in tmux pane
    WINDOW_NAME="agent-${AGENT_SESSION_NAME}"
    
    # Build command to run in tmux
    TMUX_CMD="cd '$PROJECT_ROOT' && $CLAUDE_CMD < '$PROMPT_FILE' 2>&1 | tee '$TEMP_OUTPUT'; AGENT_EXIT_CODE=\${PIPESTATUS[0]}; echo \"Agent completed with exit code: \$AGENT_EXIT_CODE\"; echo \"Output saved to: $TEMP_OUTPUT\"; echo \"Press any key to close...\"; read -n 1"
    
    # Create new window in main session
    tmux new-window -t "tony-main" -n "$WINDOW_NAME" "$TMUX_CMD"
    
    # Store window info for monitoring
    echo "$WINDOW_NAME" > "${TEMP_OUTPUT}.tmux_window"
    echo "tony-main:$WINDOW_NAME" > "${TEMP_OUTPUT}.tmux_session"
    
    echo -e "${GREEN}Agent spawned in tmux window: $WINDOW_NAME${NC}"
    echo -e "${CYAN}Switch to agent: tmux select-window -t 'tony-main:$WINDOW_NAME'${NC}"
    echo -e "${CYAN}Attach to session: tmux attach -t tony-main${NC}"
    
    # Wait for completion or timeout
    echo -e "${CYAN}Monitoring agent execution...${NC}"
    WAIT_COUNT=0
    MAX_WAIT=$((TIMEOUT / 5))  # Check every 5 seconds
    
    while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
        # Check if window still exists
        if ! tmux list-windows -t "tony-main" | grep -q "$WINDOW_NAME"; then
            echo -e "${GREEN}Agent window closed - execution completed${NC}"
            break
        fi
        
        sleep 5
        WAIT_COUNT=$((WAIT_COUNT + 1))
        
        if [ $((WAIT_COUNT % 12)) -eq 0 ]; then  # Every minute
            echo -e "${CYAN}Agent still running... (${WAIT_COUNT}/${MAX_WAIT})${NC}"
        fi
    done
    
    # Check if we timed out
    if [ $WAIT_COUNT -eq $MAX_WAIT ]; then
        echo -e "${YELLOW}Warning: Agent execution timeout reached${NC}"
        echo -e "${YELLOW}Agent may still be running in tmux window: $WINDOW_NAME${NC}"
    fi
    
    # Try to determine exit code from output file
    if [ -f "$TEMP_OUTPUT" ]; then
        AGENT_EXIT_CODE=0  # Assume success if we have output
    else
        AGENT_EXIT_CODE=1  # No output suggests failure
    fi
else
    # Legacy mode: Execute and capture both stdout and stderr, piping prompt from file
    $CLAUDE_CMD < "$PROMPT_FILE" 2>&1 | tee "$TEMP_OUTPUT"
    AGENT_EXIT_CODE=${PIPESTATUS[0]}
fi
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

# Clean up tmux tracking files if they exist
if [ "$USE_TMUX" = true ]; then
    rm -f "${TEMP_OUTPUT}.tmux_window" "${TEMP_OUTPUT}.tmux_session"
fi

echo -e "${GREEN}✓ Agent handoff complete${NC}"
if [ "$USE_TMUX" = true ]; then
    echo -e "${CYAN}Tmux session remains active for debugging${NC}"
    echo -e "${CYAN}View status: $SCRIPT_DIR/tmux-orchestrator.sh status${NC}"
fi