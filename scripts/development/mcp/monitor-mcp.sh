#!/bin/bash
# MosAIc SDK - MCP Service Monitoring Script
# Infrastructure Foundation - Phase 1

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
PID_FILE="$PROJECT_ROOT/.mosaic/mcp.pid"
LOG_FILE="$PROJECT_ROOT/.mosaic/logs/mcp-orchestrator.log"
HEALTH_URL="http://localhost:3456/health"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if service is running
check_process() {
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            echo "$pid"
        else
            echo ""
        fi
    else
        echo ""
    fi
}

# Check service health
check_health() {
    if curl -s --max-time 5 "$HEALTH_URL" >/dev/null 2>&1; then
        local health_data=$(curl -s --max-time 5 "$HEALTH_URL")
        local status=$(echo "$health_data" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
        echo "$status"
    else
        echo "unreachable"
    fi
}

# Get service metrics
get_metrics() {
    if curl -s --max-time 5 "$HEALTH_URL" >/dev/null 2>&1; then
        curl -s --max-time 5 "$HEALTH_URL" 2>/dev/null || echo "{}"
    else
        echo "{}"
    fi
}

# Monitor continuously
monitor_continuous() {
    log_info "Starting continuous monitoring (Ctrl+C to stop)..."
    log_info "Monitoring: MCP Orchestrator on port 3456"
    
    while true; do
        local pid=$(check_process)
        local health=$(check_health)
        local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        
        if [[ -n "$pid" ]]; then
            if [[ "$health" == "healthy" ]]; then
                echo -e "${timestamp} | ${GREEN}HEALTHY${NC} | PID: $pid | Status: $health"
            else
                echo -e "${timestamp} | ${YELLOW}DEGRADED${NC} | PID: $pid | Status: $health"
            fi
        else
            echo -e "${timestamp} | ${RED}DOWN${NC} | No process running"
        fi
        
        sleep 5
    done
}

# Quick status check
status_check() {
    log_info "MCP Orchestrator Status Check"
    echo "================================"
    
    local pid=$(check_process)
    local health=$(check_health)
    
    if [[ -n "$pid" ]]; then
        log_success "Process: Running (PID: $pid)"
        
        if [[ "$health" == "healthy" ]]; then
            log_success "Health: $health"
        else
            log_warn "Health: $health"
        fi
        
        # Get detailed metrics
        local metrics=$(get_metrics)
        echo "Metrics:"
        echo "$metrics" | jq '.' 2>/dev/null || echo "$metrics"
        
    else
        log_error "Process: Not running"
        log_error "Health: N/A"
    fi
    
    # Check log file
    if [[ -f "$LOG_FILE" ]]; then
        local log_size=$(du -h "$LOG_FILE" | cut -f1)
        local last_modified=$(stat -c %y "$LOG_FILE" 2>/dev/null | cut -d'.' -f1)
        echo "Log file: $LOG_FILE ($log_size, modified: $last_modified)"
        
        # Show last few log entries
        echo
        echo "Recent log entries:"
        echo "===================="
        tail -5 "$LOG_FILE" 2>/dev/null || echo "No log entries available"
    else
        log_warn "Log file not found: $LOG_FILE"
    fi
}

# Check tool availability
check_tools() {
    log_info "Checking tool availability..."
    
    local health=$(check_health)
    if [[ "$health" != "healthy" ]]; then
        log_error "Service not healthy, cannot check tools"
        return 1
    fi
    
    # Test critical planning tools
    local critical_tools=("mosaic_plan_business" "mosaic_plan_all")
    local tools_output
    
    cd "$PROJECT_ROOT/packages/mcp-orchestrator"
    tools_output=$(env NODE_ENV=production node dist/main.js tools 2>&1 | grep -v winston)
    cd "$PROJECT_ROOT"
    
    local total_tools=$(echo "$tools_output" | grep -c "Description:" 2>/dev/null || echo "0")
    log_info "Total tools available: $total_tools"
    
    for tool in "${critical_tools[@]}"; do
        if echo "$tools_output" | grep -q "$tool:"; then
            log_success "✅ $tool - Available"
        else
            log_error "❌ $tool - Missing"
        fi
    done
}

# Automated health check with restart
health_check_restart() {
    log_info "Performing automated health check with restart capability..."
    
    local pid=$(check_process)
    local health=$(check_health)
    
    if [[ -z "$pid" ]] || [[ "$health" != "healthy" ]]; then
        log_warn "Service is unhealthy, attempting restart..."
        
        # Try restart
        "$SCRIPT_DIR/start-unified-mcp.sh" restart
        
        # Verify restart was successful
        sleep 3
        local new_health=$(check_health)
        if [[ "$new_health" == "healthy" ]]; then
            log_success "Service restarted successfully"
        else
            log_error "Service restart failed"
            return 1
        fi
    else
        log_success "Service is healthy"
    fi
}

# Main execution
main() {
    case "${1:-status}" in
        status|check)
            status_check
            ;;
        monitor)
            monitor_continuous
            ;;
        tools)
            check_tools
            ;;
        restart-check)
            health_check_restart
            ;;
        metrics)
            get_metrics | jq '.' 2>/dev/null || get_metrics
            ;;
        *)
            echo "MCP Service Monitor"
            echo "==================="
            echo "Usage: $0 {status|monitor|tools|restart-check|metrics}"
            echo
            echo "Commands:"
            echo "  status        - Show current service status"
            echo "  monitor       - Continuous monitoring (Ctrl+C to stop)"
            echo "  tools         - Check tool availability"
            echo "  restart-check - Health check with automatic restart"
            echo "  metrics       - Show service metrics in JSON format"
            exit 1
            ;;
    esac
}

main "$@"