#!/bin/bash
# Agent-ATHMS Task Assignment Engine
set -e

INTEGRATION_DIR="$(dirname "$0")"
ATHMS_ROOT="$INTEGRATION_DIR/.."

assign_task_to_agent() {
    local task_id="$1"
    local agent_type="$2"
    local priority="$3"
    
    local task_path="$ATHMS_ROOT/active/$task_id"
    local assignment_id="$(date +%s)-$task_id"
    
    if [ ! -d "$task_path" ]; then
        echo "❌ Task $task_id not found in active tasks"
        return 1
    fi
    
    # Create assignment record
    jq -n \
        --arg task_id "$task_id" \
        --arg agent_type "$agent_type" \
        --arg priority "$priority" \
        --arg assigned_at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --arg status "assigned" \
        '{
            task_id: $task_id,
            agent_type: $agent_type,
            priority: $priority,
            assigned_at: $assigned_at,
            status: $status,
            progress: 0,
            evidence_collected: [],
            last_update: $assigned_at
        }' > "$INTEGRATION_DIR/assignments/$assignment_id.json"
    
    # Update task status
    jq '.assignment = {
        assignment_id: "'$assignment_id'",
        agent_type: "'$agent_type'",
        assigned_at: "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
        status: "assigned"
    }' "$task_path/task.json" > "$task_path/task.json.tmp" && mv "$task_path/task.json.tmp" "$task_path/task.json"
    
    echo "✅ Task $task_id assigned to $agent_type agent (Assignment: $assignment_id)"
    return 0
}

auto_assign_available_tasks() {
    echo "🔄 Auto-assigning available tasks..."
    
    local assigned_count=0
    for task_dir in "$ATHMS_ROOT/active"/*; do
        if [ -d "$task_dir" ]; then
            local task_id=$(basename "$task_dir")
            local task_json="$task_dir/task.json"
            
            if [ -f "$task_json" ]; then
                local has_assignment=$(jq -r '.assignment // empty' "$task_json")
                local dependencies_met=$(jq -r '.dependencies_met // false' "$task_json")
                
                if [ -z "$has_assignment" ] && [ "$dependencies_met" = "true" ]; then
                    local task_type=$(jq -r '.task_type // "general"' "$task_json")
                    local priority=$(jq -r '.priority // "medium"' "$task_json")
                    
                    case "$task_type" in
                        "security"|"audit") assign_task_to_agent "$task_id" "security" "$priority" ;;
                        "qa"|"test"|"validation") assign_task_to_agent "$task_id" "qa" "$priority" ;;
                        "documentation"|"docs") assign_task_to_agent "$task_id" "documentation" "$priority" ;;
                        "integration"|"api") assign_task_to_agent "$task_id" "integration" "$priority" ;;
                        *) assign_task_to_agent "$task_id" "general" "$priority" ;;
                    esac
                    
                    if [ $? -eq 0 ]; then
                        ((assigned_count++))
                    fi
                fi
            fi
        fi
    done
    
    echo "📊 Auto-assigned $assigned_count tasks to agents"
}

monitor_agent_progress() {
    echo "📈 Monitoring agent progress..."
    
    local total_assignments=0
    local completed_assignments=0
    local failed_assignments=0
    
    for assignment_file in "$INTEGRATION_DIR/assignments"/*.json; do
        if [ -f "$assignment_file" ]; then
            ((total_assignments++))
            local status=$(jq -r '.status' "$assignment_file")
            case "$status" in
                "completed") ((completed_assignments++)) ;;
                "failed") ((failed_assignments++)) ;;
            esac
        fi
    done
    
    echo "📊 Agent Assignment Status:"
    echo "  Total: $total_assignments"
    echo "  Completed: $completed_assignments"
    echo "  Failed: $failed_assignments"
    echo "  Active: $((total_assignments - completed_assignments - failed_assignments))"
}

case "${1:-help}" in
    assign)
        assign_task_to_agent "$2" "$3" "${4:-medium}"
        ;;
    auto)
        auto_assign_available_tasks
        ;;
    monitor)
        monitor_agent_progress
        ;;
    *)
        echo "Usage: $0 {assign|auto|monitor}"
        echo "  assign <task_id> <agent_type> [priority]"
        echo "  auto - Auto-assign available tasks"
        echo "  monitor - Show agent progress"
        ;;
esac
