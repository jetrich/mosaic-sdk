#!/bin/bash
# Centralized State Synchronization Engine
set -e

STATE_DIR="$(dirname "$0")"
GLOBAL_STATE="$STATE_DIR/global-state.json"
USER_TONY_DIR="$HOME/.claude/tony"

sync_global_state() {
    echo "🔄 Synchronizing global Tony state..."
    
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    
    # Update deployment timestamp if not set
    if [ "$(jq -r '.deployment_timestamp' "$GLOBAL_STATE")" = "null" ] || [ "$(jq -r '.deployment_timestamp' "$GLOBAL_STATE")" = "" ]; then
        jq --arg timestamp "$timestamp" '.deployment_timestamp = $timestamp' "$GLOBAL_STATE" > "$GLOBAL_STATE.tmp" && mv "$GLOBAL_STATE.tmp" "$GLOBAL_STATE"
    fi
    
    # Count active projects
    local project_count=0
    if [ -d "$USER_TONY_DIR/projects" ]; then
        project_count=$(find "$USER_TONY_DIR/projects" -maxdepth 1 -type d | wc -l)
        ((project_count--)) # Remove the projects directory itself
    fi
    
    # Count active agents
    local agent_count=0
    for project_dir in "$USER_TONY_DIR/projects"/*; do
        if [ -d "$project_dir/logs/agent-tasks" ]; then
            local project_agents=$(find "$project_dir/logs/agent-tasks" -maxdepth 1 -type d | wc -l)
            ((project_agents--)) # Remove the agent-tasks directory itself
            agent_count=$((agent_count + project_agents))
        fi
    done
    
    # Update global state
    jq \
        --arg timestamp "$timestamp" \
        --arg project_count "$project_count" \
        --arg agent_count "$agent_count" \
        '.coordination_status.total_active_tasks = 0 |
         .coordination_status.total_agents = ($agent_count | tonumber) |
         .coordination_status.system_health = "healthy" |
         .last_updated = $timestamp' \
        "$GLOBAL_STATE" > "$GLOBAL_STATE.tmp" && mv "$GLOBAL_STATE.tmp" "$GLOBAL_STATE"
    
    echo "✅ Global state synchronized"
    echo "📊 Projects: $project_count, Agents: $agent_count"
}

register_project() {
    local project_name="$1"
    local project_path="$2"
    
    echo "📝 Registering project: $project_name"
    
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    
    # Register project in global state
    jq \
        --arg project "$project_name" \
        --arg path "$project_path" \
        --arg timestamp "$timestamp" \
        '.active_projects[$project] = {
            path: $path,
            registered_at: $timestamp,
            status: "active",
            last_activity: $timestamp
        } |
        .last_updated = $timestamp' \
        "$GLOBAL_STATE" > "$GLOBAL_STATE.tmp" && mv "$GLOBAL_STATE.tmp" "$GLOBAL_STATE"
    
    # Create project state file
    local project_state="$STATE_DIR/projects/$project_name.json"
    mkdir -p "$(dirname "$project_state")"
    
    jq -n \
        --arg project "$project_name" \
        --arg path "$project_path" \
        --arg timestamp "$timestamp" \
        '{
            project_name: $project,
            project_path: $path,
            registered_at: $timestamp,
            status: "active",
            athms_enabled: false,
            active_agents: {},
            task_summary: {
                total_tasks: 0,
                completed_tasks: 0,
                failed_tasks: 0
            },
            last_updated: $timestamp
        }' > "$project_state"
    
    echo "✅ Project $project_name registered"
}

register_agent() {
    local project_name="$1"
    local agent_name="$2"
    local agent_type="$3"
    
    echo "🤖 Registering agent: $agent_name ($agent_type)"
    
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local project_state="$STATE_DIR/projects/$project_name.json"
    
    if [ ! -f "$project_state" ]; then
        echo "❌ Project $project_name not registered"
        return 1
    fi
    
    # Register agent in project state
    jq \
        --arg agent "$agent_name" \
        --arg type "$agent_type" \
        --arg timestamp "$timestamp" \
        '.active_agents[$agent] = {
            agent_type: $type,
            registered_at: $timestamp,
            status: "active",
            assigned_tasks: [],
            last_activity: $timestamp
        } |
        .last_updated = $timestamp' \
        "$project_state" > "$project_state.tmp" && mv "$project_state.tmp" "$project_state"
    
    # Create agent state file
    local agent_state="$STATE_DIR/agents/$project_name-$agent_name.json"
    mkdir -p "$(dirname "$agent_state")"
    
    jq -n \
        --arg project "$project_name" \
        --arg agent "$agent_name" \
        --arg type "$agent_type" \
        --arg timestamp "$timestamp" \
        '{
            project_name: $project,
            agent_name: $agent,
            agent_type: $type,
            registered_at: $timestamp,
            status: "active",
            current_task: null,
            task_history: [],
            performance_metrics: {
                tasks_completed: 0,
                tasks_failed: 0,
                average_completion_time: 0
            },
            last_updated: $timestamp
        }' > "$agent_state"
    
    echo "✅ Agent $agent_name registered"
}

get_system_status() {
    echo "📊 Tony Framework System Status"
    echo "================================"
    
    if [ ! -f "$GLOBAL_STATE" ]; then
        echo "❌ Global state not found"
        return 1
    fi
    
    local framework_version=$(jq -r '.framework_version' "$GLOBAL_STATE")
    local deployment_time=$(jq -r '.deployment_timestamp' "$GLOBAL_STATE")
    local project_count=$(jq -r '.active_projects | length' "$GLOBAL_STATE")
    local agent_count=$(jq -r '.coordination_status.total_agents' "$GLOBAL_STATE")
    local system_health=$(jq -r '.coordination_status.system_health' "$GLOBAL_STATE")
    
    echo "Framework Version: $framework_version"
    echo "Deployment Time: $deployment_time"
    echo "Active Projects: $project_count"
    echo "Active Agents: $agent_count"
    echo "System Health: $system_health"
    
    echo ""
    echo "Integration Status:"
    local athms_enabled=$(jq -r '.integration_points.athms_enabled' "$GLOBAL_STATE")
    local bridge_enabled=$(jq -r '.integration_points.agent_bridge_enabled' "$GLOBAL_STATE")
    local cicd_enabled=$(jq -r '.integration_points.cicd_integration' "$GLOBAL_STATE")
    local monitoring_enabled=$(jq -r '.integration_points.monitoring_enabled' "$GLOBAL_STATE")
    
    echo "  ATHMS: $athms_enabled"
    echo "  Agent Bridge: $bridge_enabled"
    echo "  CI/CD Integration: $cicd_enabled"
    echo "  Monitoring: $monitoring_enabled"
}

case "${1:-help}" in
    sync)
        sync_global_state
        ;;
    register-project)
        register_project "$2" "$3"
        ;;
    register-agent)
        register_agent "$2" "$3" "$4"
        ;;
    status)
        get_system_status
        ;;
    *)
        echo "Usage: $0 {sync|register-project|register-agent|status}"
        echo "  sync - Synchronize global state"
        echo "  register-project <name> <path>"
        echo "  register-agent <project> <agent> <type>"
        echo "  status - Show system status"
        ;;
esac
