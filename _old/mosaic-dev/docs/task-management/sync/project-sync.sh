#!/bin/bash
# Cross-Project State Synchronization Engine

SYNC_DIR="$(dirname "$0")"
ATHMS_ROOT="$SYNC_DIR/.."
USER_TONY_DIR="$HOME/.claude/tony"

sync_all_projects() {
    echo "🌐 Synchronizing state across all Tony projects..."
    
    local sync_timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local total_projects=0
    local synced_projects=0
    local failed_syncs=0
    
    # Create federation state
    local federation_state="$SYNC_DIR/federation/global-federation.json"
    mkdir -p "$(dirname "$federation_state")"
    
    jq -n \
        --arg timestamp "$sync_timestamp" \
        '{
            sync_timestamp: $timestamp,
            federation_version: "1.0.0",
            projects: {},
            global_metrics: {
                total_tasks: 0,
                total_agents: 0,
                total_projects: 0,
                health_score: 100
            },
            last_sync: $timestamp
        }' > "$federation_state"
    
    # Discover and sync all Tony-enabled projects
    if [ -d "$USER_TONY_DIR/projects" ]; then
        for project_dir in "$USER_TONY_DIR/projects"/*; do
            if [ -d "$project_dir" ]; then
                ((total_projects++))
                local project_name=$(basename "$project_dir")
                
                echo "🔄 Syncing project: $project_name"
                
                if sync_single_project "$project_name" "$project_dir"; then
                    ((synced_projects++))
                    echo "✅ $project_name synchronized"
                else
                    ((failed_syncs++))
                    echo "❌ Failed to sync $project_name"
                fi
            fi
        done
    fi
    
    # Update federation statistics
    jq \
        --arg total "$total_projects" \
        --arg synced "$synced_projects" \
        --arg failed "$failed_syncs" \
        --arg timestamp "$sync_timestamp" \
        '.global_metrics.total_projects = ($total | tonumber) |
         .global_metrics.synced_projects = ($synced | tonumber) |
         .global_metrics.failed_syncs = ($failed | tonumber) |
         .global_metrics.health_score = (($synced | tonumber) * 100 / (($total | tonumber) > 0 ? ($total | tonumber) : 1)) |
         .last_sync = $timestamp' \
        "$federation_state" > "$federation_state.tmp" && mv "$federation_state.tmp" "$federation_state"
    
    echo "📊 Cross-project sync complete:"
    echo "  Total Projects: $total_projects"
    echo "  Synced: $synced_projects"
    echo "  Failed: $failed_syncs"
    echo "  Health Score: $(jq -r '.global_metrics.health_score' "$federation_state")%"
}

sync_single_project() {
    local project_name="$1"
    local project_path="$2"
    
    local project_sync_file="$SYNC_DIR/projects/$project_name.json"
    mkdir -p "$(dirname "$project_sync_file")"
    
    # Check if project has Tony infrastructure
    local tony_script="$project_path/scripts/tony-tasks.sh"
    local athms_exists=false
    local task_count=0
    local agent_count=0
    
    if [ -f "$tony_script" ]; then
        athms_exists=true
        
        # Count tasks if ATHMS is deployed
        local project_task_dir="$project_path/docs/task-management"
        if [ -d "$project_task_dir/active" ]; then
            task_count=$(find "$project_task_dir/active" -maxdepth 1 -type d | wc -l)
            ((task_count--)) # Remove active directory itself
        fi
        
        # Count agents
        if [ -d "$project_path/logs/agent-tasks" ]; then
            agent_count=$(find "$project_path/logs/agent-tasks" -maxdepth 1 -type d | wc -l)
            ((agent_count--)) # Remove agent-tasks directory itself
        fi
    fi
    
    # Create project sync record
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    
    jq -n \
        --arg project "$project_name" \
        --arg path "$project_path" \
        --arg timestamp "$timestamp" \
        --arg athms_exists "$athms_exists" \
        --arg task_count "$task_count" \
        --arg agent_count "$agent_count" \
        '{
            project_name: $project,
            project_path: $path,
            sync_timestamp: $timestamp,
            tony_enabled: ($athms_exists | test("true")),
            metrics: {
                active_tasks: ($task_count | tonumber),
                active_agents: ($agent_count | tonumber),
                health_status: (if ($athms_exists | test("true")) then "healthy" else "not_deployed" end)
            },
            integration_status: {
                athms_deployed: ($athms_exists | test("true")),
                state_sync_enabled: true,
                last_activity: $timestamp
            }
        }' > "$project_sync_file"
    
    # Update federation state with project data
    local federation_state="$SYNC_DIR/federation/global-federation.json"
    if [ -f "$federation_state" ]; then
        jq \
            --arg project "$project_name" \
            --arg path "$project_path" \
            --arg timestamp "$timestamp" \
            --arg task_count "$task_count" \
            --arg agent_count "$agent_count" \
            '.projects[$project] = {
                path: $path,
                last_sync: $timestamp,
                active_tasks: ($task_count | tonumber),
                active_agents: ($agent_count | tonumber),
                status: "synchronized"
            } |
            .global_metrics.total_tasks += ($task_count | tonumber) |
            .global_metrics.total_agents += ($agent_count | tonumber)' \
            "$federation_state" > "$federation_state.tmp" && mv "$federation_state.tmp" "$federation_state"
    fi
    
    return 0
}

propagate_user_changes() {
    echo "📡 Propagating user-level changes to all projects..."
    
    local user_templates="$USER_TONY_DIR/templates"
    local user_config="$USER_TONY_DIR/config"
    local changes_propagated=0
    
    if [ -d "$USER_TONY_DIR/projects" ]; then
        for project_dir in "$USER_TONY_DIR/projects"/*; do
            if [ -d "$project_dir" ]; then
                local project_name=$(basename "$project_dir")
                echo "🔄 Propagating to $project_name..."
                
                # Update project templates if user templates are newer
                if [ -d "$user_templates" ] && [ -d "$project_dir/docs/agent-management" ]; then
                    rsync -au "$user_templates/" "$project_dir/docs/agent-management/templates/" 2>/dev/null && {
                        echo "✅ Templates updated for $project_name"
                        ((changes_propagated++))
                    }
                fi
                
                # Update project configuration
                if [ -f "$user_config/global-settings.json" ] && [ -d "$project_dir/.claude" ]; then
                    cp "$user_config/global-settings.json" "$project_dir/.claude/global-settings.json" 2>/dev/null && {
                        echo "✅ Configuration updated for $project_name"
                    }
                fi
            fi
        done
    fi
    
    echo "📊 Propagated changes to $changes_propagated projects"
}

monitor_federation_health() {
    echo "💓 Monitoring Tony Federation Health..."
    
    local federation_state="$SYNC_DIR/federation/global-federation.json"
    
    if [ ! -f "$federation_state" ]; then
        echo "❌ Federation state not found"
        return 1
    fi
    
    local total_projects=$(jq -r '.global_metrics.total_projects' "$federation_state")
    local total_tasks=$(jq -r '.global_metrics.total_tasks' "$federation_state")
    local total_agents=$(jq -r '.global_metrics.total_agents' "$federation_state")
    local health_score=$(jq -r '.global_metrics.health_score' "$federation_state")
    local last_sync=$(jq -r '.last_sync' "$federation_state")
    
    echo "🌐 Tony Federation Status:"
    echo "  Projects: $total_projects"
    echo "  Active Tasks: $total_tasks"
    echo "  Active Agents: $total_agents"
    echo "  Health Score: $health_score%"
    echo "  Last Sync: $last_sync"
    
    # Check for unhealthy projects
    local unhealthy_projects=()
    while IFS= read -r project; do
        if [ -n "$project" ]; then
            unhealthy_projects+=("$project")
        fi
    done < <(jq -r '.projects | to_entries[] | select(.value.status != "synchronized") | .key' "$federation_state" 2>/dev/null)
    
    if [ ${#unhealthy_projects[@]} -gt 0 ]; then
        echo "⚠️  Unhealthy Projects: ${unhealthy_projects[*]}"
    fi
    
    # Health threshold check
    if [ "$(echo "$health_score < 90" | bc 2>/dev/null || echo 0)" = "1" ]; then
        echo "🚨 FEDERATION HEALTH WARNING: Score below 90%"
        return 1
    fi
    
    echo "✅ Federation health: GOOD"
    return 0
}

case "${1:-help}" in
    sync-all)
        sync_all_projects
        ;;
    sync-project)
        sync_single_project "$2" "$3"
        ;;
    propagate)
        propagate_user_changes
        ;;
    health)
        monitor_federation_health
        ;;
    *)
        echo "Usage: $0 {sync-all|sync-project|propagate|health}"
        echo "  sync-all - Synchronize all Tony projects"
        echo "  sync-project <name> <path> - Sync specific project"
        echo "  propagate - Propagate user-level changes"
        echo "  health - Monitor federation health"
        ;;
esac
