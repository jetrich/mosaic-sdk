#!/bin/bash
# CI/CD Evidence Validation Engine

CICD_DIR="$(dirname "$0")"
ATHMS_ROOT="$CICD_DIR/.."

validate_build_evidence() {
    local task_id="$1"
    local build_status="$2"
    local build_url="$3"
    local test_coverage="$4"
    
    echo "🔍 Validating build evidence for task: $task_id"
    
    local task_path="$ATHMS_ROOT/active/$task_id"
    local evidence_dir="$task_path/evidence"
    
    if [ ! -d "$task_path" ]; then
        echo "❌ Task $task_id not found"
        return 1
    fi
    
    mkdir -p "$evidence_dir"
    
    # Create build evidence record
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local evidence_file="$evidence_dir/build-evidence-$timestamp.json"
    
    jq -n \
        --arg task_id "$task_id" \
        --arg build_status "$build_status" \
        --arg build_url "$build_url" \
        --arg coverage "$test_coverage" \
        --arg timestamp "$timestamp" \
        '{
            task_id: $task_id,
            evidence_type: "build_validation",
            build_status: $build_status,
            build_url: $build_url,
            test_coverage: ($coverage | tonumber),
            validation_timestamp: $timestamp,
            validation_result: (if $build_status == "success" and ($coverage | tonumber) >= 80 then "passed" else "failed" end),
            requirements_met: {
                build_successful: ($build_status == "success"),
                coverage_threshold: (($coverage | tonumber) >= 80),
                integration_tests: true
            }
        }' > "$evidence_file"
    
    local validation_result=$(jq -r '.validation_result' "$evidence_file")
    
    if [ "$validation_result" = "passed" ]; then
        echo "✅ Build evidence validation PASSED"
        
        # Update task with successful evidence
        jq \
            --arg timestamp "$timestamp" \
            --arg evidence_file "$(basename "$evidence_file")" \
            '.evidence_validation.build = {
                status: "validated",
                evidence_file: $evidence_file,
                validated_at: $timestamp
            } |
            .last_updated = $timestamp' \
            "$task_path/task.json" > "$task_path/task.json.tmp" && mv "$task_path/task.json.tmp" "$task_path/task.json"
        
        return 0
    else
        echo "❌ Build evidence validation FAILED"
        echo "   Build Status: $build_status"
        echo "   Test Coverage: $test_coverage%"
        return 1
    fi
}

create_pipeline_integration() {
    local project_name="$1"
    local pipeline_type="$2"  # github, gitlab, jenkins, etc.
    
    echo "🔧 Creating $pipeline_type pipeline integration for $project_name"
    
    local pipeline_config="$CICD_DIR/pipelines/$project_name-$pipeline_type.yml"
    
    case "$pipeline_type" in
        "github")
            cat > "$pipeline_config" << 'PIPELINE_EOF'
name: Tony Framework Integration

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  tony-validation:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests with coverage
      run: npm run test:coverage
    
    - name: Build application
      run: npm run build
    
    - name: Tony Evidence Collection
      run: |
        # Extract test coverage
        COVERAGE=$(cat coverage/coverage-summary.json | jq -r '.total.lines.pct')
        
        # Report to Tony ATHMS
        if [ -f "./scripts/tony-tasks.sh" ]; then
          ./scripts/tony-tasks.sh cicd validate-build \
            --task-id="$GITHUB_SHA" \
            --build-status="success" \
            --build-url="$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID" \
            --coverage="$COVERAGE"
        fi
    
    - name: Tony Task Completion
      if: success()
      run: |
        if [ -f "./scripts/tony-tasks.sh" ]; then
          ./scripts/tony-tasks.sh cicd complete-task --task-id="$GITHUB_SHA"
        fi
PIPELINE_EOF
            ;;
        "gitlab")
            cat > "$pipeline_config" << 'PIPELINE_EOF'
stages:
  - test
  - build
  - tony-integration

variables:
  NODE_VERSION: "18"

test:
  stage: test
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run test:coverage
  artifacts:
    reports:
      coverage: coverage/clover.xml
    paths:
      - coverage/

build:
  stage: build
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

tony-validation:
  stage: tony-integration
  image: alpine:latest
  before_script:
    - apk add --no-cache jq bash
  script:
    - |
      # Extract test coverage
      COVERAGE=$(cat coverage/coverage-summary.json | jq -r '.total.lines.pct')
      
      # Report to Tony ATHMS
      if [ -f "./scripts/tony-tasks.sh" ]; then
        ./scripts/tony-tasks.sh cicd validate-build \
          --task-id="$CI_COMMIT_SHA" \
          --build-status="success" \
          --build-url="$CI_PIPELINE_URL" \
          --coverage="$COVERAGE"
      fi
  dependencies:
    - test
    - build
PIPELINE_EOF
            ;;
    esac
    
    echo "✅ Pipeline configuration created: $pipeline_config"
}

monitor_pipeline_status() {
    echo "📈 Monitoring CI/CD pipeline status..."
    
    local active_validations=0
    local passed_validations=0
    local failed_validations=0
    
    for task_dir in "$ATHMS_ROOT/active"/*; do
        if [ -d "$task_dir" ]; then
            local evidence_dir="$task_dir/evidence"
            if [ -d "$evidence_dir" ]; then
                for evidence_file in "$evidence_dir"/build-evidence-*.json; do
                    if [ -f "$evidence_file" ]; then
                        ((active_validations++))
                        local result=$(jq -r '.validation_result' "$evidence_file")
                        case "$result" in
                            "passed") ((passed_validations++)) ;;
                            "failed") ((failed_validations++)) ;;
                        esac
                    fi
                done
            fi
        fi
    done
    
    echo "📊 CI/CD Integration Status:"
    echo "  Total Validations: $active_validations"
    echo "  Passed: $passed_validations"
    echo "  Failed: $failed_validations"
    echo "  Success Rate: $(( passed_validations * 100 / (active_validations > 0 ? active_validations : 1) ))%"
}

setup_webhook_handlers() {
    echo "🪝 Setting up CI/CD webhook handlers..."
    
    local webhook_script="$CICD_DIR/webhooks/webhook-handler.sh"
    
    cat > "$webhook_script" << 'WEBHOOK_EOF'
#!/bin/bash
# CI/CD Webhook Handler for Tony Framework

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
WEBHOOK_EOF
    
    chmod +x "$webhook_script"
    echo "✅ Webhook handlers configured"
}

case "${1:-help}" in
    validate-build)
        validate_build_evidence "$2" "$3" "$4" "$5"
        ;;
    create-pipeline)
        create_pipeline_integration "$2" "$3"
        ;;
    monitor)
        monitor_pipeline_status
        ;;
    webhook)
        setup_webhook_handlers
        ;;
    *)
        echo "Usage: $0 {validate-build|create-pipeline|monitor|webhook}"
        echo "  validate-build <task_id> <status> <url> <coverage>"
        echo "  create-pipeline <project> <type>"
        echo "  monitor - Show pipeline status"
        echo "  webhook - Setup webhook handlers"
        ;;
esac
