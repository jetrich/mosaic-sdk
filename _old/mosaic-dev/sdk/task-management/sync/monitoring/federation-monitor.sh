#!/bin/bash
# Federation Monitoring Dashboard
set -e

MONITOR_DIR="$(dirname "$0")"
SYNC_DIR="$(dirname "$MONITOR_DIR")"

generate_federation_report() {
    echo "📊 Generating Tony Federation Report..."
    
    local report_file="$MONITOR_DIR/federation-report-$(date +%Y%m%d-%H%M).md"
    local federation_state="$SYNC_DIR/federation/global-federation.json"
    
    if [ ! -f "$federation_state" ]; then
        echo "❌ Federation state not found"
        return 1
    fi
    
    cat > "$report_file" << REPORT_EOF
# Tony Framework Federation Report
Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

## Executive Summary
$(jq -r '
"- **Total Projects**: " + (.global_metrics.total_projects | tostring) + "\n" +
"- **Active Tasks**: " + (.global_metrics.total_tasks | tostring) + "\n" +
"- **Active Agents**: " + (.global_metrics.total_agents | tostring) + "\n" +
"- **Health Score**: " + (.global_metrics.health_score | tostring) + "%\n" +
"- **Last Sync**: " + .last_sync
' "$federation_state")

## Project Details
$(jq -r '
.projects | to_entries[] | 
"### " + .key + "\n" +
"- **Path**: " + .value.path + "\n" +
"- **Status**: " + .value.status + "\n" +
"- **Tasks**: " + (.value.active_tasks | tostring) + "\n" +
"- **Agents**: " + (.value.active_agents | tostring) + "\n" +
"- **Last Sync**: " + .value.last_sync + "\n"
' "$federation_state")

## Health Analysis
$(if [ "$(jq -r '.global_metrics.health_score < 90' "$federation_state")" = "true" ]; then
    echo "🚨 **WARNING**: Federation health below 90%"
    echo
    echo "**Recommended Actions**:"
    echo "1. Check failed project synchronizations"
    echo "2. Verify Tony deployment status across projects"
    echo "3. Review agent coordination efficiency"
else
    echo "✅ **HEALTHY**: All systems operating normally"
fi)

## Synchronization Status
- **Sync Method**: Cross-project state federation
- **Sync Frequency**: On-demand with health monitoring
- **State Persistence**: JSON-based with backup/restore
- **Integration Points**: ATHMS, Agent Bridge, CI/CD Layer

REPORT_EOF

    echo "📋 Federation report generated: $report_file"
    
    # Show summary
    echo ""
    echo "📊 Current Federation Status:"
    jq -r '
    "Projects: " + (.global_metrics.total_projects | tostring) + "\n" +
    "Tasks: " + (.global_metrics.total_tasks | tostring) + "\n" +
    "Agents: " + (.global_metrics.total_agents | tostring) + "\n" +
    "Health: " + (.global_metrics.health_score | tostring) + "%"
    ' "$federation_state"
}

watch_federation() {
    echo "👁️  Watching Tony Federation (Press Ctrl+C to stop)..."
    
    while true; do
        clear
        echo "🌐 Tony Framework Federation Monitor"
        echo "=================================="
        echo "$(date)"
        echo
        
        "$SYNC_DIR/project-sync.sh" health
        
        echo
        echo "🔄 Auto-refresh in 30 seconds..."
        sleep 30
    done
}

case "${1:-help}" in
    report)
        generate_federation_report
        ;;
    watch)
        watch_federation
        ;;
    *)
        echo "Usage: $0 {report|watch}"
        echo "  report - Generate federation status report"
        echo "  watch - Real-time federation monitoring"
        ;;
esac
