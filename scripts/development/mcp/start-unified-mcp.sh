#!/bin/bash
# MosAIc SDK - Unified MCP Server Startup Script
# Infrastructure Foundation - Phase 1

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
MCP_ORCHESTRATOR_PATH="$PROJECT_ROOT/packages/mcp-orchestrator"
DATABASE_DIR="$PROJECT_ROOT/.mosaic/data"
LOGS_DIR="$PROJECT_ROOT/.mosaic/logs"
PID_FILE="$PROJECT_ROOT/.mosaic/mcp.pid"

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    node_version=$(node -v | sed 's/v//')
    required_version="18.0.0"
    if ! node -pe "process.exit(require('semver').gte('$node_version', '$required_version') ? 0 : 1)" 2>/dev/null; then
        log_error "Node.js version $node_version is below required $required_version"
        exit 1
    fi
    
    # Check if MCP Orchestrator is built
    if [[ ! -f "$MCP_ORCHESTRATOR_PATH/dist/main.js" ]]; then
        log_warn "MCP Orchestrator not built, building now..."
        cd "$MCP_ORCHESTRATOR_PATH"
        npm run build
        cd "$PROJECT_ROOT"
    fi
    
    log_success "Prerequisites check passed"
}

# Setup directories
setup_directories() {
    log_info "Setting up directories..."
    
    mkdir -p "$DATABASE_DIR" "$LOGS_DIR" "$DATABASE_DIR/backups"
    chmod 755 "$DATABASE_DIR" "$LOGS_DIR"
    
    log_success "Directories setup complete"
}

# Stop any running MCP services
cleanup_existing_services() {
    log_info "Cleaning up existing MCP services..."
    
    # Stop any processes on MCP ports
    for port in 3456 3457; do
        local pids=$(lsof -t -i:$port 2>/dev/null || true)
        if [[ -n "$pids" ]]; then
            log_warn "Stopping processes on port $port: $pids"
            kill -TERM $pids 2>/dev/null || true
            sleep 2
            kill -KILL $pids 2>/dev/null || true
        fi
    done
    
    # Clean up PID files
    rm -f "$PROJECT_ROOT/.mosaic/mcp-gateway.pid" "$PID_FILE"
    
    log_success "Cleanup complete"
}

# Start MCP Orchestrator
start_mcp_orchestrator() {
    log_info "Starting MCP Orchestrator..."
    
    export NODE_ENV=development
    export LOG_LEVEL=debug
    export DATABASE_PATH="$DATABASE_DIR/mcp.db"
    export HTTP_PORT=3456
    export HTTP_HOST=localhost
    
    cd "$MCP_ORCHESTRATOR_PATH"
    
    # Start in background and capture PID
    nohup node dist/main.js serve --http --port 3456 > "$LOGS_DIR/mcp-orchestrator.log" 2>&1 &
    pid=$!
    echo $pid > "$PID_FILE"
    
    # Wait a moment and check if it's still running
    sleep 2
    if kill -0 $pid 2>/dev/null; then
        log_success "MCP Orchestrator started with PID $pid"
    else
        log_error "MCP Orchestrator failed to start"
        cat "$LOGS_DIR/mcp-orchestrator.log" | tail -20
        exit 1
    fi
    
    cd "$PROJECT_ROOT"
}

# Verify service health
verify_service() {
    log_info "Verifying service health..."
    
    # Wait for service to be ready
    max_attempts=10
    attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -s http://localhost:3456/health >/dev/null 2>&1; then
            log_success "MCP Orchestrator is healthy and responding"
            
            # Get health status
            health_status=$(curl -s http://localhost:3456/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
            log_info "Service status: $health_status"
            
            return 0
        fi
        
        attempt=$((attempt + 1))
        log_warn "Attempt $attempt/$max_attempts: Service not ready, waiting..."
        sleep 2
    done
    
    log_error "Service failed health check"
    return 1
}

# Main execution
main() {
    log_info "Starting Unified MCP Server - Infrastructure Foundation Phase 1"
    
    check_prerequisites
    setup_directories
    cleanup_existing_services
    start_mcp_orchestrator
    verify_service
    
    log_success "Unified MCP Server startup complete!"
    log_info "Service running on: http://localhost:3456"
    log_info "Health endpoint: http://localhost:3456/health"
    log_info "Logs: $LOGS_DIR/mcp-orchestrator.log"
    log_info "PID file: $PID_FILE"
}

# Handle script arguments
case "${1:-start}" in
    start)
        main
        ;;
    stop)
        if [[ -f "$PID_FILE" ]]; then
            pid=$(cat "$PID_FILE")
            log_info "Stopping MCP Orchestrator (PID: $pid)..."
            kill -TERM $pid 2>/dev/null || true
            sleep 2
            kill -KILL $pid 2>/dev/null || true
            rm -f "$PID_FILE"
            log_success "MCP Orchestrator stopped"
        else
            log_warn "No PID file found"
        fi
        ;;
    status)
        if [[ -f "$PID_FILE" ]]; then
            pid=$(cat "$PID_FILE")
            if kill -0 $pid 2>/dev/null; then
                log_success "MCP Orchestrator running (PID: $pid)"
                curl -s http://localhost:3456/health 2>/dev/null || log_warn "Service not responding to health checks"
            else
                log_error "MCP Orchestrator not running (stale PID file)"
                rm -f "$PID_FILE"
            fi
        else
            log_error "MCP Orchestrator not running"
        fi
        ;;
    restart)
        $0 stop
        sleep 2
        $0 start
        ;;
    *)
        echo "Usage: $0 {start|stop|status|restart}"
        exit 1
        ;;
esac