#!/bin/bash
# Agent Progress Reporting System
set -e

INTEGRATION_DIR="$(dirname "$0")"
ATHMS_ROOT="$INTEGRATION_DIR/.."

report_progress() {
    local assignment_id="$1"
    local progress_percent="$2"
    local evidence_path="$3"
    local notes="$4"
    
    local assignment_file="$INTEGRATION_DIR/assignments/$assignment_id.json"
    
    if [ ! -f "$assignment_file" ]; then
        echo "❌ Assignment $assignment_id not found"
        return 1
    fi
    
    # Update assignment progress
    jq \
        --arg progress "$progress_percent" \
        --arg evidence "$evidence_path" \
        --arg notes "$notes" \
        --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        '.progress = ($progress | tonumber) |
         .evidence_collected += [$evidence] |
         .notes = $notes |
         .last_update = $timestamp' \
        "$assignment_file" > "$assignment_file.tmp" && mv "$assignment_file.tmp" "$assignment_file"
    
    # Update task progress
    local task_id=$(jq -r '.task_id' "$assignment_file")
    local task_path="$ATHMS_ROOT/active/$task_id"
    
    if [ -d "$task_path" ]; then
        jq \
            --arg progress "$progress_percent" \
            --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            '.assignment.progress = ($progress | tonumber) |
             .assignment.last_update = $timestamp' \
            "$task_path/task.json" > "$task_path/task.json.tmp" && mv "$task_path/task.json.tmp" "$task_path/task.json"
    fi
    
    echo "✅ Progress updated: $assignment_id → $progress_percent%"
}

complete_assignment() {
    local assignment_id="$1"
    local evidence_path="$2"
    local completion_notes="$3"
    
    local assignment_file="$INTEGRATION_DIR/assignments/$assignment_id.json"
    
    if [ ! -f "$assignment_file" ]; then
        echo "❌ Assignment $assignment_id not found"
        return 1
    fi
    
    # Mark assignment as completed
    jq \
        --arg evidence "$evidence_path" \
        --arg notes "$completion_notes" \
        --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        '.status = "completed" |
         .progress = 100 |
         .evidence_collected += [$evidence] |
         .completion_notes = $notes |
         .completed_at = $timestamp |
         .last_update = $timestamp' \
        "$assignment_file" > "$assignment_file.tmp" && mv "$assignment_file.tmp" "$assignment_file"
    
    # Move task to completed
    local task_id=$(jq -r '.task_id' "$assignment_file")
    local task_path="$ATHMS_ROOT/active/$task_id"
    
    if [ -d "$task_path" ]; then
        # Update task status
        jq \
            --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            '.status = "completed" |
             .completed_at = $timestamp |
             .assignment.status = "completed" |
             .assignment.completed_at = $timestamp' \
            "$task_path/task.json" > "$task_path/task.json.tmp" && mv "$task_path/task.json.tmp" "$task_path/task.json"
        
        # Move to completed directory
        mv "$task_path" "$ATHMS_ROOT/completed/"
        echo "✅ Task $task_id completed and moved to completed directory"
    fi
    
    echo "✅ Assignment $assignment_id marked as completed"
}

case "${1:-help}" in
    progress)
        report_progress "$2" "$3" "$4" "$5"
        ;;
    complete)
        complete_assignment "$2" "$3" "$4"
        ;;
    *)
        echo "Usage: $0 {progress|complete}"
        echo "  progress <assignment_id> <percent> <evidence_path> [notes]"
        echo "  complete <assignment_id> <evidence_path> [notes]"
        ;;
esac
