#!/bin/bash

# Tony Framework - Logging Utilities
# Shared functions for consistent logging and output formatting

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Logging configuration
TONY_LOG_DIR="$HOME/.claude/tony/logs"
TONY_LOG_FILE="$TONY_LOG_DIR/tony-commands.log"
VERBOSE_MODE=false

# Initialize logging system
init_logging() {
    mkdir -p "$TONY_LOG_DIR"
    
    # Rotate log if it gets too large (>10MB)
    if [ -f "$TONY_LOG_FILE" ] && [ $(stat -c%s "$TONY_LOG_FILE" 2>/dev/null || echo 0) -gt 10485760 ]; then
        mv "$TONY_LOG_FILE" "$TONY_LOG_FILE.old"
    fi
}

# Core logging function
log_message() {
    local level="$1"
    local message="$2"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S UTC')
    
    # Write to log file
    echo "[$timestamp] [$level] $message" >> "$TONY_LOG_FILE"
    
    # Also output to console with formatting
    case "$level" in
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "DEBUG")
            if [ "$VERBOSE_MODE" = true ]; then
                echo -e "${MAGENTA}🔍 $message${NC}"
            fi
            ;;
        *)
            echo "$message"
            ;;
    esac
}

# Convenience logging functions
log_info() {
    log_message "INFO" "$1"
}

log_success() {
    log_message "SUCCESS" "$1"
}

log_warning() {
    log_message "WARNING" "$1"
}

log_error() {
    log_message "ERROR" "$1"
}

log_debug() {
    log_message "DEBUG" "$1"
}

# Enable verbose mode
enable_verbose() {
    VERBOSE_MODE=true
    log_debug "Verbose mode enabled"
}

# Disable verbose mode
disable_verbose() {
    VERBOSE_MODE=false
}

# Progress indicator functions
show_spinner() {
    local pid=$1
    local message="$2"
    local spin='-\|/'
    local i=0
    
    echo -n "$message "
    while kill -0 $pid 2>/dev/null; do
        i=$(( (i+1) %4 ))
        printf "\r$message ${spin:$i:1}"
        sleep 0.1
    done
    printf "\r$message ✅\n"
}

# Progress bar function
show_progress() {
    local current="$1"
    local total="$2"
    local message="$3"
    local percent=$((current * 100 / total))
    local filled=$((percent / 2))
    local empty=$((50 - filled))
    
    printf "\r$message ["
    printf "%*s" $filled | tr ' ' '='
    printf "%*s" $empty | tr ' ' '-'
    printf "] %d%%" $percent
    
    if [ $current -eq $total ]; then
        echo " ✅"
    fi
}

# Section headers
print_section() {
    local title="$1"
    local width=60
    local title_length=${#title}
    local padding=$(( (width - title_length - 2) / 2 ))
    
    echo ""
    echo -e "${CYAN}$(printf '═%.0s' $(seq 1 $width))${NC}"
    printf "${CYAN}║%*s${YELLOW}%s${CYAN}%*s║${NC}\n" $padding "" "$title" $padding ""
    echo -e "${CYAN}$(printf '═%.0s' $(seq 1 $width))${NC}"
    echo ""
}

# Subsection headers
print_subsection() {
    local title="$1"
    echo ""
    echo -e "${BLUE}🔹 $title${NC}"
    echo -e "${BLUE}$(printf '─%.0s' $(seq 1 $((${#title} + 3))))${NC}"
}

# Status box for important information
print_status_box() {
    local title="$1"
    shift
    local lines=("$@")
    local max_length=0
    
    # Find the longest line
    for line in "$title" "${lines[@]}"; do
        if [ ${#line} -gt $max_length ]; then
            max_length=${#line}
        fi
    done
    
    local box_width=$((max_length + 4))
    
    echo ""
    echo -e "${GREEN}┌$(printf '─%.0s' $(seq 1 $((box_width - 2))))┐${NC}"
    printf "${GREEN}│${NC} ${YELLOW}%-*s${NC} ${GREEN}│${NC}\n" $((box_width - 4)) "$title"
    echo -e "${GREEN}├$(printf '─%.0s' $(seq 1 $((box_width - 2))))┤${NC}"
    
    for line in "${lines[@]}"; do
        printf "${GREEN}│${NC} %-*s ${GREEN}│${NC}\n" $((box_width - 4)) "$line"
    done
    
    echo -e "${GREEN}└$(printf '─%.0s' $(seq 1 $((box_width - 2))))┘${NC}"
    echo ""
}

# Error box for critical issues
print_error_box() {
    local title="$1"
    shift
    local lines=("$@")
    local max_length=0
    
    # Find the longest line
    for line in "$title" "${lines[@]}"; do
        if [ ${#line} -gt $max_length ]; then
            max_length=${#line}
        fi
    done
    
    local box_width=$((max_length + 4))
    
    echo ""
    echo -e "${RED}┌$(printf '─%.0s' $(seq 1 $((box_width - 2))))┐${NC}"
    printf "${RED}│${NC} ${YELLOW}%-*s${NC} ${RED}│${NC}\n" $((box_width - 4)) "$title"
    echo -e "${RED}├$(printf '─%.0s' $(seq 1 $((box_width - 2))))┤${NC}"
    
    for line in "${lines[@]}"; do
        printf "${RED}│${NC} %-*s ${RED}│${NC}\n" $((box_width - 4)) "$line"
    done
    
    echo -e "${RED}└$(printf '─%.0s' $(seq 1 $((box_width - 2))))┘${NC}"
    echo ""
}

# Format file lists
print_file_list() {
    local title="$1"
    shift
    local files=("$@")
    
    echo -e "${BLUE}📁 $title:${NC}"
    for file in "${files[@]}"; do
        if [ -f "$file" ] || [ -d "$file" ]; then
            echo -e "  ${GREEN}✅${NC} $file"
        else
            echo -e "  ${RED}❌${NC} $file"
        fi
    done
    echo ""
}

# Format command output
print_command_result() {
    local command="$1"
    local result="$2"
    local success="$3"
    
    echo -e "${CYAN}💻 Command:${NC} $command"
    if [ "$success" = "true" ]; then
        echo -e "${GREEN}✅ Result:${NC}"
    else
        echo -e "${RED}❌ Result:${NC}"
    fi
    
    # Indent the result
    echo "$result" | sed 's/^/   /'
    echo ""
}

# Confirmation prompt with colors
confirm_action() {
    local message="$1"
    local default="${2:-n}"
    
    echo -e "${YELLOW}❓ $message${NC}"
    if [ "$default" = "y" ]; then
        read -p "   Continue? (Y/n): " response
        response=${response:-y}
    else
        read -p "   Continue? (y/N): " response
        response=${response:-n}
    fi
    
    case "$response" in
        [Yy]|[Yy][Ee][Ss])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Banner display
show_banner() {
    local title="$1"
    local subtitle="$2"
    
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    printf "║ %-60s ║\n" "$title"
    if [ -n "$subtitle" ]; then
        printf "║ %-60s ║\n" "$subtitle"
    fi
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Time duration formatting
format_duration() {
    local seconds="$1"
    local hours=$((seconds / 3600))
    local minutes=$(((seconds % 3600) / 60))
    local secs=$((seconds % 60))
    
    if [ $hours -gt 0 ]; then
        printf "%dh %dm %ds" $hours $minutes $secs
    elif [ $minutes -gt 0 ]; then
        printf "%dm %ds" $minutes $secs
    else
        printf "%ds" $secs
    fi
}

# File size formatting
format_size() {
    local bytes="$1"
    
    if [ $bytes -gt 1073741824 ]; then
        printf "%.1fGB" $(echo "scale=1; $bytes / 1073741824" | bc)
    elif [ $bytes -gt 1048576 ]; then
        printf "%.1fMB" $(echo "scale=1; $bytes / 1048576" | bc)
    elif [ $bytes -gt 1024 ]; then
        printf "%.1fKB" $(echo "scale=1; $bytes / 1024" | bc)
    else
        printf "%dB" $bytes
    fi
}

# Export functions for use in other scripts
export -f init_logging
export -f log_message
export -f log_info
export -f log_success
export -f log_warning
export -f log_error
export -f log_debug
export -f enable_verbose
export -f disable_verbose
export -f show_spinner
export -f show_progress
export -f print_section
export -f print_subsection
export -f print_status_box
export -f print_error_box
export -f print_file_list
export -f print_command_result
export -f confirm_action
export -f show_banner
export -f format_duration
export -f format_size

# Initialize logging when sourced
init_logging