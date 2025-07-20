#!/bin/bash
# CI/CD Webhook Handler for Tony Framework
set -e

WEBHOOK_DIR="$(dirname "$0")"
CICD_DIR="$(dirname "$WEBHOOK_DIR")"

handle_github_webhook() {
    local payload="$1"
    
    echo "📨 Processing GitHub webhook..."
    
    local action=$(echo "$payload" | jq -r '.action // empty')
    local status=$(echo "$payload" | jq -r '.status // .state // empty')
    local commit_sha=$(echo "$payload" | jq -r '.sha // .head_commit.id // empty')
    
    case "$action" in
        "completed")
            if [ "$status" = "success" ]; then
                echo "✅ GitHub Action completed successfully for $commit_sha"
                # Update Tony ATHMS with success
                "$CICD_DIR/evidence-validator.sh" validate-build "$commit_sha" "success" "" "85"
            else
                echo "❌ GitHub Action failed for $commit_sha"
                # Update Tony ATHMS with failure
                "$CICD_DIR/evidence-validator.sh" validate-build "$commit_sha" "failed" "" "0"
            fi
            ;;
    esac
}

handle_gitlab_webhook() {
    local payload="$1"
    
    echo "📨 Processing GitLab webhook..."
    
    local status=$(echo "$payload" | jq -r '.object_attributes.status // empty')
    local commit_sha=$(echo "$payload" | jq -r '.sha // .object_attributes.sha // empty')
    
    case "$status" in
        "success")
            echo "✅ GitLab pipeline completed successfully for $commit_sha"
            "$CICD_DIR/evidence-validator.sh" validate-build "$commit_sha" "success" "" "85"
            ;;
        "failed")
            echo "❌ GitLab pipeline failed for $commit_sha"
            "$CICD_DIR/evidence-validator.sh" validate-build "$commit_sha" "failed" "" "0"
            ;;
    esac
}

case "${1:-help}" in
    github)
        handle_github_webhook "$2"
        ;;
    gitlab)
        handle_gitlab_webhook "$2"
        ;;
    *)
        echo "Usage: $0 {github|gitlab} <payload>"
        ;;
esac
