#!/bin/bash

# context-manager.sh - Context lifecycle management for Tony-NG Framework
# Handles context creation, updates, merging, and queries

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FRAMEWORK_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Default values
ACTION=""
CONTEXT_FILE=""
OUTPUT_FILE=""
PARENT_CONTEXT=""
FIELD=""
STATUS=""
AGENT=""
END_TIME=""
LOG_FILE=""
DEBUG=false

# Usage function
usage() {
    cat << EOF
Usage: $0 --action <action> --context <file> [options]

Required:
  --action <action>       Action to perform: create|update|merge|query
  --context <file>        Input context file (or template for create)

Options:
  --output <file>         Output file (default: updates input file)
  --parent-context <file> Parent context for merge operations
  --field <json-path>     Field to query (for query action)
  --status <status>       Agent completion status (for update)
  --agent <type>          Agent type (for update)
  --end-time <timestamp>  End timestamp (for update)
  --log-file <file>       Agent log file to parse (for update)
  --debug                 Enable debug output

Actions:
  create  - Create new context from template
  update  - Update context with agent completion info
  merge   - Merge parent and child contexts
  query   - Query specific field from context

Examples:
  # Create new context
  $0 --action create --context templates/context/planning-handoff.json --output /tmp/context.json

  # Update context after agent completion
  $0 --action update --context /tmp/context.json --status completed --agent implementation-agent

  # Query specific field
  $0 --action query --context /tmp/context.json --field session.session_id

EOF
    exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --action)
            ACTION="$2"
            shift 2
            ;;
        --context)
            CONTEXT_FILE="$2"
            shift 2
            ;;
        --output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        --parent-context)
            PARENT_CONTEXT="$2"
            shift 2
            ;;
        --field)
            FIELD="$2"
            shift 2
            ;;
        --status)
            STATUS="$2"
            shift 2
            ;;
        --agent)
            AGENT="$2"
            shift 2
            ;;
        --end-time)
            END_TIME="$2"
            shift 2
            ;;
        --log-file)
            LOG_FILE="$2"
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
if [ -z "$ACTION" ] || [ -z "$CONTEXT_FILE" ]; then
    echo -e "${RED}Error: Missing required parameters${NC}"
    usage
fi

# Set output file if not specified
if [ -z "$OUTPUT_FILE" ]; then
    OUTPUT_FILE="$CONTEXT_FILE"
fi

# Debug function
debug() {
    if [ "$DEBUG" = true ]; then
        echo -e "${BLUE}Debug: $1${NC}" >&2
    fi
}

# Generate UUID-like session ID
generate_session_id() {
    # Generate random hex strings
    local p1=$(openssl rand -hex 4 | tr '[:lower:]' '[:upper:]')
    local p2=$(openssl rand -hex 2 | tr '[:lower:]' '[:upper:]')
    local p3=$(openssl rand -hex 2 | tr '[:lower:]' '[:upper:]')
    local p4=$(openssl rand -hex 2 | tr '[:lower:]' '[:upper:]')
    local p5=$(openssl rand -hex 6 | tr '[:lower:]' '[:upper:]')
    echo "${p1}-${p2}-${p3}-${p4}-${p5}"
}

# Get current timestamp
get_timestamp() {
    date -u +"%Y-%m-%dT%H:%M:%S.000Z"
}

# Simple JSON field extraction (fallback when jq not available)
extract_json_field() {
    local file=$1
    local field=$2
    grep -o "\"$field\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" "$file" | cut -d'"' -f4 | head -1
}

# Update JSON field (simple implementation)
update_json_field() {
    local file=$1
    local field=$2
    local value=$3
    local temp_file=$(mktemp)
    
    # This is a simplified implementation
    # In production, use jq or a proper JSON parser
    sed "s/\"$field\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"$field\": \"$value\"/" "$file" > "$temp_file"
    mv "$temp_file" "$file"
}

# Create new context from template
create_context() {
    debug "Creating new context from template: $CONTEXT_FILE"
    
    if [ ! -f "$CONTEXT_FILE" ]; then
        echo -e "${RED}Error: Template file not found: $CONTEXT_FILE${NC}"
        exit 1
    fi
    
    # Copy template to output
    cp "$CONTEXT_FILE" "$OUTPUT_FILE"
    
    # Generate new session ID
    local new_session_id=$(generate_session_id)
    local timestamp=$(get_timestamp)
    
    # Update session info (using sed for compatibility)
    if command -v jq &> /dev/null; then
        # Use jq for proper JSON manipulation
        jq ".session.session_id = \"$new_session_id\" | .session.timestamp = \"$timestamp\"" "$OUTPUT_FILE" > "$OUTPUT_FILE.tmp"
        mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"
    else
        # Fallback to sed
        update_json_field "$OUTPUT_FILE" "session_id" "$new_session_id"
        update_json_field "$OUTPUT_FILE" "timestamp" "$timestamp"
    fi
    
    echo -e "${GREEN}✓ Created new context with session ID: $new_session_id${NC}"
}

# Update context with agent completion
update_context() {
    debug "Updating context with agent completion"
    
    if [ ! -f "$CONTEXT_FILE" ]; then
        echo -e "${RED}Error: Context file not found: $CONTEXT_FILE${NC}"
        exit 1
    fi
    
    # Copy to output if different
    if [ "$CONTEXT_FILE" != "$OUTPUT_FILE" ]; then
        cp "$CONTEXT_FILE" "$OUTPUT_FILE"
    fi
    
    # Create temporary file for updates
    local temp_file=$(mktemp)
    
    if command -v jq &> /dev/null; then
        # Update agent chain with completion info
        local update_query=".session.agent_chain[-1].completion_status = \"$STATUS\""
        
        if [ -n "$END_TIME" ]; then
            update_query="$update_query | .session.agent_chain[-1].end_time = \"$END_TIME\""
        fi
        
        # Add new agent to chain if different
        if [ -n "$AGENT" ]; then
            local current_agent=$(jq -r '.session.agent_chain[-1].agent_id' "$OUTPUT_FILE")
            if [ "$current_agent" != "$AGENT" ]; then
                local new_agent="{\"agent_id\": \"$AGENT\", \"start_time\": \"$END_TIME\", \"completion_status\": \"in_progress\", \"tasks_completed\": []}"
                update_query="$update_query | .session.agent_chain += [$new_agent]"
            fi
        fi
        
        # Extract evidence from log file if provided
        if [ -n "$LOG_FILE" ] && [ -f "$LOG_FILE" ]; then
            # Look for test results, coverage, etc.
            local coverage=$(grep -o 'Coverage: [0-9.]*%' "$LOG_FILE" | grep -o '[0-9.]*' | head -1)
            if [ -n "$coverage" ]; then
                update_query="$update_query | .evidence_tracking.coverage_metrics.line_coverage = $coverage"
            fi
        fi
        
        # Apply updates
        jq "$update_query" "$OUTPUT_FILE" > "$temp_file"
        mv "$temp_file" "$OUTPUT_FILE"
    else
        echo -e "${YELLOW}Warning: jq not found, limited update capabilities${NC}"
        # Basic update using sed
        if [ -n "$STATUS" ]; then
            update_json_field "$OUTPUT_FILE" "completion_status" "$STATUS"
        fi
    fi
    
    echo -e "${GREEN}✓ Context updated${NC}"
}

# Merge parent and child contexts
merge_context() {
    debug "Merging contexts"
    
    if [ ! -f "$CONTEXT_FILE" ] || [ ! -f "$PARENT_CONTEXT" ]; then
        echo -e "${RED}Error: Context files not found${NC}"
        exit 1
    fi
    
    if command -v jq &> /dev/null; then
        # Merge contexts preserving child overrides
        jq -s '.[0] * .[1]' "$PARENT_CONTEXT" "$CONTEXT_FILE" > "$OUTPUT_FILE"
        
        # Merge agent chains
        jq -s '.[0].session.agent_chain + .[1].session.agent_chain | unique_by(.agent_id)' "$PARENT_CONTEXT" "$CONTEXT_FILE" > chain.tmp
        jq --slurpfile chain chain.tmp '.session.agent_chain = $chain[0]' "$OUTPUT_FILE" > "$OUTPUT_FILE.tmp"
        mv "$OUTPUT_FILE.tmp" "$OUTPUT_FILE"
        rm chain.tmp
    else
        echo -e "${RED}Error: jq required for merge operation${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Contexts merged${NC}"
}

# Query context field
query_context() {
    debug "Querying field: $FIELD"
    
    if [ ! -f "$CONTEXT_FILE" ]; then
        echo -e "${RED}Error: Context file not found: $CONTEXT_FILE${NC}"
        exit 1
    fi
    
    if [ -z "$FIELD" ]; then
        echo -e "${RED}Error: Field parameter required for query${NC}"
        exit 1
    fi
    
    if command -v jq &> /dev/null; then
        # Use jq for proper JSON path query
        jq -r ".$FIELD // empty" "$CONTEXT_FILE"
    else
        # Fallback to grep
        local field_name=$(echo "$FIELD" | awk -F'.' '{print $NF}')
        extract_json_field "$CONTEXT_FILE" "$field_name"
    fi
}

# Main execution
case "$ACTION" in
    create)
        create_context
        ;;
    update)
        update_context
        ;;
    merge)
        merge_context
        ;;
    query)
        query_context
        ;;
    *)
        echo -e "${RED}Error: Unknown action: $ACTION${NC}"
        usage
        ;;
esac