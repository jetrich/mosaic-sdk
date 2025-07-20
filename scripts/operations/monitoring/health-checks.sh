#!/bin/bash
# Comprehensive Health Check Script for MosAIc Stack
# This script performs health checks on all services and reports status

set -euo pipefail

# Configuration
LOG_FILE="/var/log/mosaic/health-checks.log"
WEBHOOK_URL="${HEALTH_CHECK_WEBHOOK:-}"
TIMEOUT=10

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Service definitions
declare -A SERVICES=(
    ["traefik"]="mosaic-traefik"
    ["postgres"]="mosaic-postgres"
    ["mariadb"]="mosaic-mariadb"
    ["redis"]="mosaic-redis"
    ["gitea"]="mosaic-gitea"
    ["plane-frontend"]="mosaic-plane-frontend"
    ["plane-api"]="mosaic-plane-api"
    ["plane-worker"]="mosaic-plane-worker"
    ["bookstack"]="mosaic-bookstack"
    ["portainer"]="mosaic-portainer"
)

# Health check results
declare -A RESULTS
TOTAL_CHECKS=0
FAILED_CHECKS=0

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Print colored status
print_status() {
    local service=$1
    local status=$2
    local details=$3
    
    if [[ "$status" == "HEALTHY" ]]; then
        echo -e "${GREEN}✓${NC} $service: ${GREEN}$status${NC} - $details"
    elif [[ "$status" == "WARNING" ]]; then
        echo -e "${YELLOW}⚠${NC} $service: ${YELLOW}$status${NC} - $details"
    else
        echo -e "${RED}✗${NC} $service: ${RED}$status${NC} - $details"
    fi
}

# Check if container is running
check_container_running() {
    local container=$1
    docker ps --format '{{.Names}}' | grep -q "^${container}$"
}

# Get container health status
get_container_health() {
    local container=$1
    docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none"
}

# Check PostgreSQL
check_postgres() {
    local container="${SERVICES[postgres]}"
    local status="UNKNOWN"
    local details=""
    
    ((TOTAL_CHECKS++))
    
    if ! check_container_running "$container"; then
        status="FAILED"
        details="Container not running"
        ((FAILED_CHECKS++))
    else
        if docker exec "$container" pg_isready -U postgres -t "$TIMEOUT" &>/dev/null; then
            # Get additional metrics
            local db_count=$(docker exec "$container" psql -U postgres -t -c "SELECT count(*) FROM pg_database WHERE NOT datistemplate;" 2>/dev/null | xargs)
            local conn_count=$(docker exec "$container" psql -U postgres -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | xargs)
            status="HEALTHY"
            details="$db_count databases, $conn_count connections"
        else
            status="FAILED"
            details="PostgreSQL not responding"
            ((FAILED_CHECKS++))
        fi
    fi
    
    RESULTS["postgres"]="$status|$details"
    print_status "PostgreSQL" "$status" "$details"
}

# Check MariaDB
check_mariadb() {
    local container="${SERVICES[mariadb]}"
    local status="UNKNOWN"
    local details=""
    
    ((TOTAL_CHECKS++))
    
    if ! check_container_running "$container"; then
        status="FAILED"
        details="Container not running"
        ((FAILED_CHECKS++))
    else
        if docker exec "$container" healthcheck.sh --connect &>/dev/null; then
            # Get table count
            local table_count=$(docker exec "$container" mysql -uroot -p"${MARIADB_ROOT_PASSWORD}" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'bookstack';" -s 2>/dev/null || echo "0")
            status="HEALTHY"
            details="BookStack DB OK, $table_count tables"
        else
            status="FAILED"
            details="MariaDB not responding"
            ((FAILED_CHECKS++))
        fi
    fi
    
    RESULTS["mariadb"]="$status|$details"
    print_status "MariaDB" "$status" "$details"
}

# Check Redis
check_redis() {
    local container="${SERVICES[redis]}"
    local status="UNKNOWN"
    local details=""
    
    ((TOTAL_CHECKS++))
    
    if ! check_container_running "$container"; then
        status="FAILED"
        details="Container not running"
        ((FAILED_CHECKS++))
    else
        if docker exec "$container" redis-cli ping 2>/dev/null | grep -q "PONG"; then
            # Get memory usage
            local memory=$(docker exec "$container" redis-cli info memory 2>/dev/null | grep used_memory_human | cut -d: -f2 | tr -d '\r' || echo "unknown")
            local keys=$(docker exec "$container" redis-cli DBSIZE 2>/dev/null | awk '{print $1}' || echo "0")
            status="HEALTHY"
            details="$keys keys, $memory memory"
        else
            status="FAILED"
            details="Redis not responding"
            ((FAILED_CHECKS++))
        fi
    fi
    
    RESULTS["redis"]="$status|$details"
    print_status "Redis" "$status" "$details"
}

# Check Gitea
check_gitea() {
    local container="${SERVICES[gitea]}"
    local status="UNKNOWN"
    local details=""
    
    ((TOTAL_CHECKS++))
    
    if ! check_container_running "$container"; then
        status="FAILED"
        details="Container not running"
        ((FAILED_CHECKS++))
    else
        local response=$(docker exec "$container" curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/version 2>/dev/null || echo "000")
        if [[ "$response" == "200" ]]; then
            local version=$(docker exec "$container" curl -s http://localhost:3000/api/v1/version 2>/dev/null | jq -r .version 2>/dev/null || echo "unknown")
            status="HEALTHY"
            details="Version $version"
        else
            status="FAILED"
            details="HTTP $response"
            ((FAILED_CHECKS++))
        fi
    fi
    
    RESULTS["gitea"]="$status|$details"
    print_status "Gitea" "$status" "$details"
}

# Check Plane
check_plane() {
    local api_container="${SERVICES[plane-api]}"
    local frontend_container="${SERVICES[plane-frontend]}"
    local worker_container="${SERVICES[plane-worker]}"
    local status="UNKNOWN"
    local details=""
    
    ((TOTAL_CHECKS++))
    
    # Check API
    if ! check_container_running "$api_container"; then
        status="FAILED"
        details="API container not running"
        ((FAILED_CHECKS++))
    else
        local response=$(docker exec "$api_container" curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health/ 2>/dev/null || echo "000")
        if [[ "$response" == "200" ]]; then
            # Check worker
            if check_container_running "$worker_container"; then
                status="HEALTHY"
                details="API and worker OK"
            else
                status="WARNING"
                details="API OK, worker down"
            fi
        else
            status="FAILED"
            details="API HTTP $response"
            ((FAILED_CHECKS++))
        fi
    fi
    
    RESULTS["plane"]="$status|$details"
    print_status "Plane" "$status" "$details"
}

# Check BookStack
check_bookstack() {
    local container="${SERVICES[bookstack]}"
    local status="UNKNOWN"
    local details=""
    
    ((TOTAL_CHECKS++))
    
    if ! check_container_running "$container"; then
        status="FAILED"
        details="Container not running"
        ((FAILED_CHECKS++))
    else
        local response=$(docker exec "$container" curl -s -o /dev/null -w "%{http_code}" http://localhost:80 2>/dev/null || echo "000")
        if [[ "$response" == "200" ]] || [[ "$response" == "302" ]]; then
            status="HEALTHY"
            details="HTTP $response"
        else
            status="FAILED"
            details="HTTP $response"
            ((FAILED_CHECKS++))
        fi
    fi
    
    RESULTS["bookstack"]="$status|$details"
    print_status "BookStack" "$status" "$details"
}

# Check Portainer
check_portainer() {
    local container="${SERVICES[portainer]}"
    local status="UNKNOWN"
    local details=""
    
    ((TOTAL_CHECKS++))
    
    if ! check_container_running "$container"; then
        status="FAILED"
        details="Container not running"
        ((FAILED_CHECKS++))
    else
        local response=$(docker exec "$container" curl -s -o /dev/null -w "%{http_code}" http://localhost:9000 2>/dev/null || echo "000")
        if [[ "$response" == "200" ]]; then
            status="HEALTHY"
            details="UI accessible"
        else
            status="FAILED"
            details="HTTP $response"
            ((FAILED_CHECKS++))
        fi
    fi
    
    RESULTS["portainer"]="$status|$details"
    print_status "Portainer" "$status" "$details"
}

# Check disk space
check_disk_space() {
    local status="UNKNOWN"
    local details=""
    
    ((TOTAL_CHECKS++))
    
    local usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    local available=$(df -h / | awk 'NR==2 {print $4}')
    
    if [[ $usage -lt 80 ]]; then
        status="HEALTHY"
        details="${usage}% used, ${available} available"
    elif [[ $usage -lt 90 ]]; then
        status="WARNING"
        details="${usage}% used, ${available} available"
    else
        status="FAILED"
        details="${usage}% used, ${available} available"
        ((FAILED_CHECKS++))
    fi
    
    RESULTS["disk"]="$status|$details"
    print_status "Disk Space" "$status" "$details"
}

# Check memory usage
check_memory() {
    local status="UNKNOWN"
    local details=""
    
    ((TOTAL_CHECKS++))
    
    local total=$(free -m | awk 'NR==2{print $2}')
    local used=$(free -m | awk 'NR==2{print $3}')
    local usage=$((used * 100 / total))
    
    if [[ $usage -lt 80 ]]; then
        status="HEALTHY"
        details="${usage}% used (${used}MB/${total}MB)"
    elif [[ $usage -lt 90 ]]; then
        status="WARNING"
        details="${usage}% used (${used}MB/${total}MB)"
    else
        status="FAILED"
        details="${usage}% used (${used}MB/${total}MB)"
        ((FAILED_CHECKS++))
    fi
    
    RESULTS["memory"]="$status|$details"
    print_status "Memory" "$status" "$details"
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    if [[ -n "$WEBHOOK_URL" ]]; then
        local color="#36a64f"  # Green
        [[ "$status" == "WARNING" ]] && color="#ff9900"  # Orange
        [[ "$status" == "FAILED" ]] && color="#ff0000"   # Red
        
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"username\": \"MosAIc Health Check\",
                \"icon_emoji\": \":heartbeat:\",
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"Health Check $status\",
                    \"text\": \"$message\",
                    \"timestamp\": $(date +%s)
                }]
            }" 2>/dev/null || log "Failed to send notification"
    fi
}

# Generate summary
generate_summary() {
    local overall_status="HEALTHY"
    local summary=""
    
    if [[ $FAILED_CHECKS -gt 0 ]]; then
        overall_status="FAILED"
    fi
    
    summary="Health Check Summary: $TOTAL_CHECKS checks, $FAILED_CHECKS failed"
    
    echo
    echo "======================================="
    echo -e "Overall Status: $(
        if [[ "$overall_status" == "HEALTHY" ]]; then
            echo -e "${GREEN}$overall_status${NC}"
        else
            echo -e "${RED}$overall_status${NC}"
        fi
    )"
    echo "$summary"
    echo "======================================="
    
    # Log to file
    log "$summary"
    
    # Send notification if there are failures
    if [[ $FAILED_CHECKS -gt 0 ]]; then
        send_notification "$overall_status" "$summary"
    fi
}

# Main execution
main() {
    echo -e "${BLUE}MosAIc Stack Health Check${NC}"
    echo -e "${BLUE}========================${NC}"
    echo "Timestamp: $(date)"
    echo
    
    # System checks
    echo -e "${BLUE}System Health:${NC}"
    check_disk_space
    check_memory
    echo
    
    # Database checks
    echo -e "${BLUE}Database Services:${NC}"
    check_postgres
    check_mariadb
    check_redis
    echo
    
    # Application checks
    echo -e "${BLUE}Application Services:${NC}"
    check_gitea
    check_plane
    check_bookstack
    check_portainer
    
    # Summary
    generate_summary
}

# Run health checks
main