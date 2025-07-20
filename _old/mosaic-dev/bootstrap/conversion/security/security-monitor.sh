#!/bin/bash

# Tony Framework - Security Monitoring Daemon
# Real-time security monitoring and threat detection

set -euo pipefail

SECURITY_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SECURITY_ROOT")"
source "$PROJECT_ROOT/scripts/shared/logging-utils.sh"

MONITOR_LOG="$SECURITY_ROOT/logs/security-monitor.log"
ALERT_DIR="$SECURITY_ROOT/monitoring/alerts"
METRICS_DIR="$SECURITY_ROOT/monitoring/metrics"
PID_FILE="$SECURITY_ROOT/security-monitor.pid"

# Start security monitoring
start_monitoring() {
    log_info "Starting security monitoring daemon..."
    
    # Check if already running
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        log_warning "Security monitor already running (PID: $(cat "$PID_FILE"))"
        return 0
    fi
    
    # Start monitoring in background
    monitor_security_events &
    echo $! > "$PID_FILE"
    
    log_success "Security monitoring started (PID: $(cat "$PID_FILE"))"
}

# Stop security monitoring
stop_monitoring() {
    log_info "Stopping security monitoring daemon..."
    
    if [ -f "$PID_FILE" ]; then
        local pid
        pid=$(cat "$PID_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            rm -f "$PID_FILE"
            log_success "Security monitoring stopped"
        else
            log_warning "Security monitor was not running"
            rm -f "$PID_FILE"
        fi
    else
        log_warning "Security monitor PID file not found"
    fi
}

# Monitor security events
monitor_security_events() {
    log_info "Security monitoring daemon started"
    
    while true; do
        # Monitor access logs
        monitor_access_logs
        
        # Monitor system resources
        monitor_system_resources
        
        # Monitor file integrity
        monitor_file_integrity
        
        # Monitor network activity
        monitor_network_activity
        
        # Check for security alerts
        process_security_alerts
        
        # Sleep for monitoring interval
        sleep 30
    done
}

# Monitor access logs
monitor_access_logs() {
    local access_log="$SECURITY_ROOT/logs/access/access.log"
    
    if [ -f "$access_log" ]; then
        # Check for suspicious patterns in last 1 minute
        local recent_logs
        recent_logs=$(tail -n 100 "$access_log" | grep "$(date -d '1 minute ago' '+%Y-%m-%d %H:%M')" || true)
        
        if [ -n "$recent_logs" ]; then
            # Check for failed login attempts
            local failed_attempts
            failed_attempts=$(echo "$recent_logs" | grep -c "ACCESS_DENIED" || echo "0")
            
            if [ "$failed_attempts" -gt 5 ]; then
                generate_security_alert "brute_force_attempt" "high" \
                    "Multiple failed access attempts detected ($failed_attempts in last minute)"
            fi
        fi
    fi
}

# Monitor system resources
monitor_system_resources() {
    # Check CPU usage
    local cpu_usage
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 | cut -d',' -f1)
    
    # Check memory usage
    local mem_usage
    mem_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    
    # Check disk usage
    local disk_usage
    disk_usage=$(df "$PROJECT_ROOT" | tail -1 | awk '{print $5}' | cut -d'%' -f1)
    
    # Record metrics
    record_metric "cpu_usage" "$cpu_usage"
    record_metric "memory_usage" "$mem_usage"
    record_metric "disk_usage" "$disk_usage"
    
    # Check for anomalies
    if (( $(echo "$cpu_usage > 90" | bc -l) )); then
        generate_security_alert "high_cpu_usage" "medium" \
            "High CPU usage detected: ${cpu_usage}%"
    fi
    
    if (( $(echo "$mem_usage > 90" | bc -l) )); then
        generate_security_alert "high_memory_usage" "medium" \
            "High memory usage detected: ${mem_usage}%"
    fi
    
    if [ "$disk_usage" -gt 90 ]; then
        generate_security_alert "high_disk_usage" "high" \
            "High disk usage detected: ${disk_usage}%"
    fi
}

# Monitor file integrity
monitor_file_integrity() {
    local integrity_file="$SECURITY_ROOT/config/file-integrity.txt"
    
    # Create baseline if it doesn't exist
    if [ ! -f "$integrity_file" ]; then
        create_integrity_baseline
        return
    fi
    
    # Check critical files
    local critical_files=(
        "$PROJECT_ROOT/scripts/tony-tasks.sh"
        "$SECURITY_ROOT/config/security-config.json"
        "$SECURITY_ROOT/config/security-policies.json"
    )
    
    for file in "${critical_files[@]}"; do
        if [ -f "$file" ]; then
            local current_hash
            current_hash=$(sha256sum "$file" | cut -d' ' -f1)
            
            local stored_hash
            stored_hash=$(grep "$(basename "$file")" "$integrity_file" | cut -d':' -f2 2>/dev/null || echo "")
            
            if [ -n "$stored_hash" ] && [ "$current_hash" != "$stored_hash" ]; then
                generate_security_alert "file_integrity_violation" "critical" \
                    "File integrity violation detected: $file"
            fi
        fi
    done
}

# Create integrity baseline
create_integrity_baseline() {
    local integrity_file="$SECURITY_ROOT/config/file-integrity.txt"
    
    log_info "Creating file integrity baseline..."
    
    # Hash critical files
    local critical_files=(
        "$PROJECT_ROOT/scripts/tony-tasks.sh"
        "$SECURITY_ROOT/config/security-config.json"
        "$SECURITY_ROOT/config/security-policies.json"
    )
    
    > "$integrity_file"
    for file in "${critical_files[@]}"; do
        if [ -f "$file" ]; then
            local hash
            hash=$(sha256sum "$file" | cut -d' ' -f1)
            echo "$(basename "$file"):$hash" >> "$integrity_file"
        fi
    done
    
    log_success "File integrity baseline created"
}

# Record metric
record_metric() {
    local metric_name="$1"
    local metric_value="$2"
    local timestamp
    timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
    
    local metric_file="$METRICS_DIR/${metric_name}.log"
    echo "[$timestamp] $metric_value" >> "$metric_file"
}

# Generate security alert
generate_security_alert() {
    local alert_type="$1"
    local severity="$2"
    local description="$3"
    local timestamp
    timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ')
    
    local alert_id="ALERT-$(date +%s)-$(shuf -i 1000-9999 -n 1)"
    local alert_file="$ALERT_DIR/${alert_id}.json"
    
    cat > "$alert_file" << ALERT_EOF
{
  "alert_id": "$alert_id",
  "alert_type": "$alert_type",
  "severity": "$severity",
  "description": "$description",
  "timestamp": "$timestamp",
  "source": "security_monitor",
  "status": "active",
  "escalation_required": $([ "$severity" = "critical" ] && echo "true" || echo "false")
}
ALERT_EOF
    
    log_warning "Security alert generated: $alert_id ($severity) - $description"
    
    # Send immediate notification for critical alerts
    if [ "$severity" = "critical" ]; then
        send_critical_alert_notification "$alert_file"
    fi
}

# Send critical alert notification
send_critical_alert_notification() {
    local alert_file="$1"
    
    # Log critical alert
    log_error "CRITICAL SECURITY ALERT: $(jq -r '.description' "$alert_file")"
    
    # Could integrate with external notification systems here
    # e.g., email, Slack, PagerDuty, etc.
}

# Process security alerts
process_security_alerts() {
    # Clean up old alerts (older than 7 days)
    find "$ALERT_DIR" -name "*.json" -mtime +7 -delete 2>/dev/null || true
    
    # Check for active critical alerts
    local critical_alerts
    critical_alerts=$(find "$ALERT_DIR" -name "*.json" -exec grep -l '"severity": "critical"' {} \; 2>/dev/null | wc -l)
    
    if [ "$critical_alerts" -gt 0 ]; then
        log_warning "$critical_alerts active critical security alerts"
    fi
}

# Main execution
case "${1:-start}" in
    "start")
        start_monitoring
        ;;
    "stop")
        stop_monitoring
        ;;
    "restart")
        stop_monitoring
        sleep 2
        start_monitoring
        ;;
    "status")
        if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
            echo "Security monitor is running (PID: $(cat "$PID_FILE"))"
        else
            echo "Security monitor is not running"
        fi
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
