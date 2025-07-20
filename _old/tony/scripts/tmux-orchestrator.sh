#!/bin/bash

# tmux-orchestrator.sh - Core tmux orchestration system for Tony-NG Framework
# Provides session management, layout templates, and agent coordination

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory and project paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Default session and window names
MAIN_SESSION="tony-main"
COORDINATOR_WINDOW="coordination"  # Changed to match architecture spec
AGENT_WINDOW_PREFIX="agent"
IMPL_WINDOW="implementation"
QA_SEC_WINDOW="qa-security"
DOC_WINDOW="documentation"

# Session naming variables
PROJECT_NAME="${PROJECT_NAME:-default}"
SESSION_TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

# Session persistence configuration
TMUX_CONFIG_DIR="$HOME/.tony/tmux"
TMUX_LAYOUTS_DIR="$TMUX_CONFIG_DIR/layouts"
TMUX_SESSIONS_DIR="$TMUX_CONFIG_DIR/sessions"
TMUX_BACKUPS_DIR="$TMUX_CONFIG_DIR/backups"
TMUX_PIPES_DIR="$TMUX_CONFIG_DIR/pipes"
TMUX_STATUS_DIR="$TMUX_CONFIG_DIR/status"

# Communication configuration
STATUS_PIPE="$TMUX_PIPES_DIR/tony-status.pipe"
COMMAND_PIPE="$TMUX_PIPES_DIR/tony-command.pipe"
CONTEXT_DIR="/tmp/tony-context"

# Performance configuration
PANE_CREATION_TIMEOUT=100  # milliseconds
MESSAGE_LATENCY_TARGET=50  # milliseconds
MAX_AGENTS_PER_WINDOW=6
MAX_IMPL_AGENTS=3
MAX_QA_AGENTS=2

# Usage function
usage() {
    cat << EOF
Usage: $0 <command> [options]

Commands:
  init [project]          Initialize tmux orchestration environment
  status                  Show session and agent status
  list                    List all tmux sessions and windows
  attach [session]        Attach to orchestration session
  create-layout <layout>  Create predefined window layout
  save <name>             Save current session state
  restore <backup>        Restore session from backup
  spawn-agent <type>      Spawn agent in appropriate window/pane
  send-message <msg>      Send message via inter-pane protocol
  monitor                 Start real-time monitoring dashboard
  cleanup                 Clean up orphaned sessions and windows
  help                    Show this help message

Layouts:
  standard   - Default layout (coordination + implementation + qa + docs)
  dense      - Dense layout for 20+ agents
  minimal    - Minimal layout (coordination only)

Examples:
  $0 init
  $0 create-layout development
  $0 save checkpoint1
  $0 restore checkpoint1
  $0 status
  $0 attach

EOF
    exit 1
}

# Ensure required directories exist
ensure_directories() {
    mkdir -p "$TMUX_CONFIG_DIR"
    mkdir -p "$TMUX_LAYOUTS_DIR"
    mkdir -p "$TMUX_SESSIONS_DIR"
    mkdir -p "$TMUX_BACKUPS_DIR"
    mkdir -p "$TMUX_PIPES_DIR"
    mkdir -p "$TMUX_STATUS_DIR"
    mkdir -p "$CONTEXT_DIR"
}

# Initialize tmux orchestration environment
init_tmux() {
    echo -e "${CYAN}Initializing Tony tmux orchestration environment...${NC}"
    
    # Create required directories
    ensure_directories
    
    # Check if tmux is available
    if ! command -v tmux &> /dev/null; then
        echo -e "${RED}Error: tmux is not installed${NC}"
        echo "Please install tmux: sudo apt-get install tmux"
        exit 1
    fi
    
    # Check if main session already exists
    if tmux has-session -t "$MAIN_SESSION" 2>/dev/null; then
        echo -e "${YELLOW}Main session '$MAIN_SESSION' already exists${NC}"
        echo -e "${CYAN}Use '$0 attach' to connect${NC}"
        return 0
    fi
    
    # Create main session with coordinator window
    echo -e "${CYAN}Creating main session: $MAIN_SESSION${NC}"
    tmux new-session -d -s "$MAIN_SESSION" -n "$COORDINATOR_WINDOW" -c "$PROJECT_ROOT"
    
    # Set up coordinator window
    tmux send-keys -t "$MAIN_SESSION:$COORDINATOR_WINDOW" 'echo "🤖 Tony Tech Lead Coordinator"' C-m
    tmux send-keys -t "$MAIN_SESSION:$COORDINATOR_WINDOW" 'echo "Session ready for agent coordination"' C-m
    tmux send-keys -t "$MAIN_SESSION:$COORDINATOR_WINDOW" 'echo "Use: tmux list-windows -t tony-main"' C-m
    
    # Set up status bar
    tmux set-option -t "$MAIN_SESSION" status-left "#[fg=green][#S] "
    tmux set-option -t "$MAIN_SESSION" status-right "#[fg=cyan]%H:%M %d-%b"
    tmux set-option -t "$MAIN_SESSION" status-bg black
    tmux set-option -t "$MAIN_SESSION" status-fg white
    
    echo -e "${GREEN}✓ Tmux orchestration environment initialized${NC}"
    echo -e "${CYAN}Attach with: tmux attach -t $MAIN_SESSION${NC}"
    echo -e "${CYAN}View status: $0 status${NC}"
}

# Show session and agent status
show_status() {
    echo -e "${CYAN}=== Tony Tmux Orchestration Status ===${NC}"
    echo "Timestamp: $(date)"
    echo ""
    
    # Check if main session exists
    if ! tmux has-session -t "$MAIN_SESSION" 2>/dev/null; then
        echo -e "${YELLOW}Main session not initialized${NC}"
        echo -e "${CYAN}Run: $0 init${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Main Session: $MAIN_SESSION ✓${NC}"
    
    # List windows and their status
    echo ""
    echo -e "${CYAN}Active Windows:${NC}"
    tmux list-windows -t "$MAIN_SESSION" -F "#{window_index}: #{window_name} [#{pane_current_command}]" | while read line; do
        if echo "$line" | grep -q "$AGENT_WINDOW_PREFIX"; then
            echo -e "  🤖 $line"
        elif echo "$line" | grep -q "$COORDINATOR_WINDOW"; then
            echo -e "  👑 $line"
        else
            echo -e "  📋 $line"
        fi
    done
    
    # Count active agent windows
    AGENT_COUNT=$(tmux list-windows -t "$MAIN_SESSION" -F "#{window_name}" | grep -c "$AGENT_WINDOW_PREFIX" || echo "0")
    echo ""
    echo -e "${CYAN}Active Agents: ${AGENT_COUNT}${NC}"
    
    # Show recent agent activity if any
    if [ "$AGENT_COUNT" -gt 0 ]; then
        echo ""
        echo -e "${CYAN}Recent Agent Activity:${NC}"
        # This would show recent log entries in a real implementation
        echo "  (Log monitoring would appear here)"
    fi
    
    echo ""
    echo -e "${CYAN}Commands:${NC}"
    echo "  Attach:     tmux attach -t $MAIN_SESSION"
    echo "  List all:   tmux list-windows -t $MAIN_SESSION"
    echo "  Kill agent: tmux kill-window -t $MAIN_SESSION:<window-name>"
}

# List all tmux sessions and windows
list_all() {
    echo -e "${CYAN}=== All Tmux Sessions ===${NC}"
    
    if ! tmux list-sessions 2>/dev/null; then
        echo -e "${YELLOW}No tmux sessions found${NC}"
        return 0
    fi
    
    echo ""
    echo -e "${CYAN}=== Windows in $MAIN_SESSION ===${NC}"
    if tmux has-session -t "$MAIN_SESSION" 2>/dev/null; then
        tmux list-windows -t "$MAIN_SESSION"
    else
        echo -e "${YELLOW}Main session not found${NC}"
    fi
}

# Attach to main orchestration session
attach_session() {
    if ! tmux has-session -t "$MAIN_SESSION" 2>/dev/null; then
        echo -e "${YELLOW}Main session not found, initializing...${NC}"
        init_tmux
    fi
    
    echo -e "${CYAN}Attaching to session: $MAIN_SESSION${NC}"
    tmux attach -t "$MAIN_SESSION"
}

# Create predefined window layouts
create_layout() {
    local layout="$1"
    
    if [ -z "$layout" ]; then
        echo -e "${RED}Error: Layout name required${NC}"
        echo "Available layouts: standard, dense, minimal"
        exit 1
    fi
    
    # Ensure main session exists
    if ! tmux has-session -t "$MAIN_SESSION" 2>/dev/null; then
        echo -e "${CYAN}Initializing main session first...${NC}"
        init_tmux
    fi
    
    case "$layout" in
        "minimal")
            echo -e "${CYAN}Creating minimal layout (coordinator only)${NC}"
            # Minimal layout is already created with init
            ;;
        "standard")
            echo -e "${CYAN}Creating standard layout${NC}"
            
            # Create implementation agents windows
            tmux new-window -t "$MAIN_SESSION" -n "$IMPL_WINDOW" -c "$PROJECT_ROOT"
            tmux send-keys -t "$MAIN_SESSION:$IMPL_WINDOW" 'echo "🔧 Implementation Agents"' C-m
            
            # Split for multiple implementation agents
            tmux split-window -t "$MAIN_SESSION:$IMPL_WINDOW" -h -c "$PROJECT_ROOT"
            tmux send-keys -t "$MAIN_SESSION:$IMPL_WINDOW.1" 'echo "Agent slot 2"' C-m
            
            # Create QA/Security window
            tmux new-window -t "$MAIN_SESSION" -n "$QA_SEC_WINDOW" -c "$PROJECT_ROOT"
            tmux send-keys -t "$MAIN_SESSION:$QA_SEC_WINDOW" 'echo "🛡️ QA & Security Agents"' C-m
            
            # Create documentation window
            tmux new-window -t "$MAIN_SESSION" -n "$DOC_WINDOW" -c "$PROJECT_ROOT"
            tmux send-keys -t "$MAIN_SESSION:$DOC_WINDOW" 'echo "📚 Documentation Agents"' C-m
            ;;
        "dense")
            echo -e "${CYAN}Creating dense layout for 20+ agents${NC}"
            
            # Standard layout first
            create_layout "standard"
            
            # Add additional panes to implementation window
            tmux split-window -t "$MAIN_SESSION:$IMPL_WINDOW" -v -c "$PROJECT_ROOT"
            tmux split-window -t "$MAIN_SESSION:$IMPL_WINDOW.2" -h -c "$PROJECT_ROOT"
            
            # Add additional panes to QA/Security window
            tmux split-window -t "$MAIN_SESSION:$QA_SEC_WINDOW" -h -c "$PROJECT_ROOT"
            ;;
        *)
            echo -e "${RED}Error: Unknown layout '$layout'${NC}"
            echo "Available layouts: standard, dense, minimal"
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}✓ Layout '$layout' created${NC}"
    echo -e "${CYAN}Attach with: tmux attach -t $MAIN_SESSION${NC}"
}

# Save current session state
save_session() {
    local backup_name="$1"
    
    if [ -z "$backup_name" ]; then
        echo -e "${RED}Error: Backup name required${NC}"
        echo "Usage: $0 save <backup-name>"
        exit 1
    fi
    
    ensure_directories
    
    local backup_file="$TMUX_BACKUPS_DIR/${backup_name}.tmux"
    local metadata_file="$TMUX_BACKUPS_DIR/${backup_name}.json"
    
    echo -e "${CYAN}Saving session state as: $backup_name${NC}"
    
    # Check if main session exists
    if ! tmux has-session -t "$MAIN_SESSION" 2>/dev/null; then
        echo -e "${RED}Error: Main session '$MAIN_SESSION' not found${NC}"
        exit 1
    fi
    
    # Save session layout and window information
    {
        echo "# Tony session backup created: $(date)"
        echo "# Session: $MAIN_SESSION"
        echo "# Backup name: $backup_name"
        echo ""
        echo "# Session creation command"
        echo "tmux new-session -d -s '$MAIN_SESSION' -c '$PROJECT_ROOT'"
        echo ""
        echo "# Window recreation commands"
        tmux list-windows -t "$MAIN_SESSION" -F "tmux new-window -t '$MAIN_SESSION' -n '#{window_name}' -c '$PROJECT_ROOT'"
        echo ""
        echo "# Pane layout restoration"
        tmux list-windows -t "$MAIN_SESSION" -F "tmux select-layout -t '$MAIN_SESSION:#{window_index}' '#{window_layout}'"
        echo ""
    } > "$backup_file"
    
    # Save metadata
    {
        echo "{"
        echo "  \"backup_name\": \"$backup_name\","
        echo "  \"session_name\": \"$MAIN_SESSION\","
        echo "  \"created_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")\","
        echo "  \"windows\": ["
        
        local first=true
        tmux list-windows -t "$MAIN_SESSION" -F "#{window_index}:#{window_name}:#{window_layout}" | while IFS=: read index name layout; do
            if [ "$first" = true ]; then
                first=false
            else
                echo ","
            fi
            echo -n "    {\"index\": $index, \"name\": \"$name\", \"layout\": \"$layout\"}"
        done
        
        echo ""
        echo "  ],"
        echo "  \"project_root\": \"$PROJECT_ROOT\""
        echo "}"
    } > "$metadata_file"
    
    echo -e "${GREEN}✓ Session state saved to: $backup_file${NC}"
    echo -e "${CYAN}Metadata saved to: $metadata_file${NC}"
    
    # List existing backups
    echo ""
    echo -e "${CYAN}Available backups:${NC}"
    ls -la "$TMUX_BACKUPS_DIR"/*.tmux 2>/dev/null | sed 's/.*\//  /' | sed 's/\.tmux$//' || echo "  No backups found"
}

# Restore session from backup
restore_session() {
    local backup_name="$1"
    
    if [ -z "$backup_name" ]; then
        echo -e "${RED}Error: Backup name required${NC}"
        echo "Usage: $0 restore <backup-name>"
        echo ""
        echo "Available backups:"
        ls -1 "$TMUX_BACKUPS_DIR"/*.tmux 2>/dev/null | sed 's/.*\//  /' | sed 's/\.tmux$//' || echo "  No backups found"
        exit 1
    fi
    
    local backup_file="$TMUX_BACKUPS_DIR/${backup_name}.tmux"
    local metadata_file="$TMUX_BACKUPS_DIR/${backup_name}.json"
    
    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}Error: Backup file not found: $backup_file${NC}"
        echo ""
        echo "Available backups:"
        ls -1 "$TMUX_BACKUPS_DIR"/*.tmux 2>/dev/null | sed 's/.*\//  /' | sed 's/\.tmux$//' || echo "  No backups found"
        exit 1
    fi
    
    echo -e "${CYAN}Restoring session from backup: $backup_name${NC}"
    
    # Check if session already exists
    if tmux has-session -t "$MAIN_SESSION" 2>/dev/null; then
        echo -e "${YELLOW}Warning: Session '$MAIN_SESSION' already exists${NC}"
        read -p "Kill existing session and restore? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Restore cancelled"
            return 0
        fi
        tmux kill-session -t "$MAIN_SESSION"
    fi
    
    # Execute restoration commands
    echo -e "${CYAN}Executing restoration commands...${NC}"
    
    # Filter and execute tmux commands from backup
    grep "^tmux" "$backup_file" | while read -r cmd; do
        echo "  Executing: $cmd"
        eval "$cmd" || echo "    Warning: Command failed"
    done
    
    echo -e "${GREEN}✓ Session restored from backup: $backup_name${NC}"
    
    if [ -f "$metadata_file" ]; then
        echo -e "${CYAN}Backup metadata:${NC}"
        if command -v jq &> /dev/null; then
            jq . "$metadata_file"
        else
            cat "$metadata_file"
        fi
    fi
    
    echo ""
    echo -e "${CYAN}Attach with: tmux attach -t $MAIN_SESSION${NC}"
}

# Clean up orphaned sessions and windows
cleanup() {
    echo -e "${CYAN}Cleaning up tmux environment...${NC}"
    
    # List and optionally remove old sessions
    echo -e "${CYAN}Current sessions:${NC}"
    tmux list-sessions 2>/dev/null || echo "No sessions found"
    
    # Ask user for confirmation before cleaning up
    echo ""
    echo -e "${YELLOW}This will clean up orphaned agent windows and old sessions${NC}"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cleanup cancelled"
        return 0
    fi
    
    # Remove old agent windows (implementation would check for completed agents)
    if tmux has-session -t "$MAIN_SESSION" 2>/dev/null; then
        echo -e "${CYAN}Checking for completed agent windows...${NC}"
        
        # This is a placeholder - real implementation would check agent status
        tmux list-windows -t "$MAIN_SESSION" -F "#{window_name}" | grep "$AGENT_WINDOW_PREFIX" | while read window; do
            echo "  Found agent window: $window"
            # Could add logic to check if agent is still active
        done
    fi
    
    echo -e "${GREEN}✓ Cleanup complete${NC}"
}

# Main execution
case "${1:-}" in
    "init")
        init_tmux
        ;;
    "status")
        show_status
        ;;
    "list")
        list_all
        ;;
    "attach")
        attach_session
        ;;
    "create-layout")
        create_layout "$2"
        ;;
    "save")
        save_session "$2"
        ;;
    "restore")
        restore_session "$2"
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|"--help"|"-h")
        usage
        ;;
    "")
        echo -e "${RED}Error: Command required${NC}"
        usage
        ;;
    *)
        echo -e "${RED}Error: Unknown command '$1'${NC}"
        usage
        ;;
esac