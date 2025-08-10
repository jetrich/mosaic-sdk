#!/bin/bash

# UPP Structure Generator for Epic E.0004
# Generates complete 6-level hierarchical decomposition

set -e

EPIC_DIR="/home/jwoltje/src/mosaic-sdk/docs/task-management/epics/active/E.0004-hierarchical-upp-decomposition"
cd "$EPIC_DIR"

# Feature definitions with their stories, tasks, subtasks, and atomics
declare -A FEATURES=(
    ["F.0004.01"]="agent-pool-management"
    ["F.0004.02"]="hierarchical-decomposition-engine"
    ["F.0004.03"]="token-monitoring-analytics"
    ["F.0004.04"]="mcp-tool-integration"
    ["F.0004.05"]="configuration-testing-framework"
)

# Story definitions for each feature
declare -A STORIES=(
    # F.0004.01 - Agent Pool Management
    ["F.0004.01.01"]="core-agent-pool-implementation"
    ["F.0004.01.02"]="resource-management-limits"
    ["F.0004.01.03"]="agent-lifecycle-management"
    ["F.0004.01.04"]="monitoring-health-metrics"
    
    # F.0004.02 - Hierarchical Decomposition Engine
    ["F.0004.02.01"]="decomposer-core-architecture"
    ["F.0004.02.02"]="task-breakdown-algorithms"
    ["F.0004.02.03"]="dependency-analysis-engine"
    ["F.0004.02.04"]="estimation-validation-system"
    
    # F.0004.03 - Token Monitoring & Analytics
    ["F.0004.03.01"]="token-tracking-infrastructure"
    ["F.0004.03.02"]="usage-analytics-dashboard"
    ["F.0004.03.03"]="cost-optimization-engine"
    ["F.0004.03.04"]="alerting-threshold-system"
    
    # F.0004.04 - MCP Tool Integration
    ["F.0004.04.01"]="mcp-protocol-implementation"
    ["F.0004.04.02"]="tool-registration-management"
    ["F.0004.04.03"]="message-routing-system"
    ["F.0004.04.04"]="security-authentication-layer"
    
    # F.0004.05 - Configuration & Testing Framework
    ["F.0004.05.01"]="configuration-management-system"
    ["F.0004.05.02"]="automated-testing-framework"
    ["F.0004.05.03"]="validation-verification-suite"
    ["F.0004.05.04"]="deployment-integration-testing"
)

# Task definitions for each story (simplified - using patterns)
declare -A TASK_PATTERNS=(
    # Standard patterns for different story types
    ["core"]="01-design-architecture,02-implement-core,03-integration-layer,04-unit-testing"
    ["management"]="01-policy-framework,02-enforcement-engine,03-monitoring-system,04-reporting-dashboard"
    ["infrastructure"]="01-data-collection,02-processing-pipeline,03-storage-system,04-api-interface"
    ["framework"]="01-core-framework,02-plugin-system,03-configuration-management,04-testing-utilities"
)

# Subtask patterns for different task types
declare -A SUBTASK_PATTERNS=(
    ["design"]="01-requirements-analysis,02-architecture-design,03-interface-specification,04-documentation"
    ["implement"]="01-core-implementation,02-business-logic,03-error-handling,04-performance-optimization"
    ["integration"]="01-api-integration,02-data-mapping,03-event-handling,04-synchronization"
    ["testing"]="01-unit-tests,02-integration-tests,03-performance-tests,04-security-tests"
    ["system"]="01-system-design,02-component-implementation,03-configuration,04-monitoring"
    ["framework"]="01-framework-core,02-plugin-architecture,03-configuration-system,04-utilities"
)

# Atomic task patterns for different subtask types
declare -A ATOMIC_PATTERNS=(
    ["analysis"]="01-requirement-gathering,02-constraint-identification,03-risk-assessment,04-acceptance-criteria"
    ["design"]="01-class-structure,02-interface-definition,03-data-model,04-interaction-patterns"
    ["implementation"]="01-core-logic,02-validation-rules,03-error-handling,04-logging-metrics"
    ["testing"]="01-test-planning,02-test-implementation,03-test-execution,04-result-validation"
    ["configuration"]="01-config-schema,02-default-values,03-validation-rules,04-documentation"
    ["optimization"]="01-performance-analysis,02-bottleneck-identification,03-optimization-implementation,04-benchmark-validation"
)

# Function to create atomic task content
create_atomic_content() {
    local task_id="$1"
    local parent_id="$2"
    local task_name="$3"
    local task_type="$4"
    local feature_context="$5"
    
    # Extract task number for estimation variance
    local task_num=$(echo "$task_id" | sed 's/.*\.//')
    local estimate_hours=$((2 + (task_num % 3)))
    
    cat > "${task_id}-${task_name}.md" << EOF
# Atomic Task: $(echo "$task_name" | sed 's/-/ /g' | sed 's/\b\w/\u&/g')

**Task ID**: $task_id  
**Parent**: $parent_id - $(echo "${parent_id##*.}" | sed 's/-/ /g' | sed 's/\b\w/\u&/g')  
**Type**: $task_type  
**Estimate**: $estimate_hours hours

## Task Description

Implement $(echo "$task_name" | sed 's/-/ /g') functionality for the $feature_context system, ensuring proper integration with existing components and maintaining system performance standards.

## Implementation Requirements

### Core Functionality
- Primary implementation of $(echo "$task_name" | sed 's/-/ /g') logic
- Integration with parent system components
- Proper error handling and validation
- Performance optimization and monitoring

### Technical Specifications
\`\`\`typescript
// packages/mcp-orchestrator/src/services/$(echo "$feature_context" | sed 's/-//g' | sed 's/\b\w/\u&/g').ts

interface $(echo "$task_name" | sed 's/-//g' | sed 's/\b\w/\u&/g')Config {
  enabled: boolean;
  options: Record<string, any>;
  timeout: number;
}

class $(echo "$task_name" | sed 's/-//g' | sed 's/\b\w/\u&/g')Implementation {
  constructor(
    private config: $(echo "$task_name" | sed 's/-//g' | sed 's/\b\w/\u&/g')Config,
    private logger: Logger
  ) {}

  async execute(): Promise<void> {
    this.logger.info('Executing $(echo "$task_name" | sed 's/-/ /g')', {
      taskId: '$task_id'
    });

    try {
      await this.performCore$(echo "$task_name" | sed 's/-//g' | sed 's/\b\w/\u&/g')();
      
      this.logger.info('$(echo "$task_name" | sed 's/-/ /g') completed successfully');
    } catch (error) {
      this.logger.error('$(echo "$task_name" | sed 's/-/ /g') failed', {
        error: error.message
      });
      throw error;
    }
  }

  private async performCore$(echo "$task_name" | sed 's/-//g' | sed 's/\b\w/\u&/g')(): Promise<void> {
    // Core implementation logic
    // TODO: Implement specific functionality
  }
}
\`\`\`

## Validation Criteria

1. **Functionality**: Core $(echo "$task_name" | sed 's/-/ /g') implementation works correctly
2. **Integration**: Properly integrates with parent system components  
3. **Error Handling**: Gracefully handles edge cases and error conditions
4. **Performance**: Meets performance requirements under expected load
5. **Testing**: Comprehensive unit tests with good coverage

## Unit Tests Required

\`\`\`typescript
describe('$(echo "$task_name" | sed 's/-//g' | sed 's/\b\w/\u&/g')Implementation', () => {
  it('should execute successfully with valid configuration', async () => {
    const implementation = new $(echo "$task_name" | sed 's/-//g' | sed 's/\b\w/\u&/g')Implementation(validConfig, mockLogger);
    
    await expect(implementation.execute()).resolves.not.toThrow();
  });

  it('should handle errors gracefully', async () => {
    const implementation = new $(echo "$task_name" | sed 's/-//g' | sed 's/\b\w/\u&/g')Implementation(invalidConfig, mockLogger);
    
    await expect(implementation.execute()).rejects.toThrow();
  });
});
\`\`\`

## Dependencies

- Logger for operation tracking
- Configuration management system
- Parent system integration points

## Notes

- Implementation follows established patterns from $feature_context system
- Proper error handling ensures system stability
- Performance considerations addressed in core logic
EOF
}

# Function to create README content for different levels
create_readme_content() {
    local level="$1"
    local id="$2"
    local name="$3"
    local description="$4"
    
    case "$level" in
        "feature")
            cat > README.md << EOF
# Feature: $name

**Feature ID**: $id  
**Epic**: E.0004 - Hierarchical UPP Decomposition Implementation  
**Status**: In Progress

## Overview

$description

## Stories

This feature consists of 4 main stories:

1. **S.${id}.01** - Core implementation and architecture
2. **S.${id}.02** - Management and control systems  
3. **S.${id}.03** - Integration and API layers
4. **S.${id}.04** - Testing and validation framework

## Success Criteria

- All core functionality implemented and tested
- Integration with existing systems completed
- Performance requirements met
- Comprehensive test coverage achieved

## Dependencies

- Epic E.0004 infrastructure components
- Existing MosAIc SDK systems
- Testing framework and utilities
EOF
            ;;
        "story")
            cat > README.md << EOF
# Story: $name

**Story ID**: $id  
**Feature**: $(echo "$id" | cut -d. -f1-2) - $(echo "$name" | sed 's/.*-//')  
**Status**: In Progress

## Overview

$description

## Tasks

This story consists of 4 main tasks:

1. **T.${id}.01** - Design and architecture
2. **T.${id}.02** - Core implementation
3. **T.${id}.03** - Integration layer
4. **T.${id}.04** - Testing and validation

## Acceptance Criteria

- All tasks completed successfully
- Code review and quality checks passed
- Integration tests validated
- Documentation updated
EOF
            ;;
        "task")
            cat > README.md << EOF
# Task: $name

**Task ID**: $id  
**Story**: $(echo "$id" | cut -d. -f1-3) - $(echo "$name" | sed 's/.*-//')  
**Status**: In Progress

## Overview

$description

## Subtasks

This task consists of 4 main subtasks:

1. **ST.${id}.01** - Core component implementation
2. **ST.${id}.02** - Business logic and validation
3. **ST.${id}.03** - Error handling and resilience
4. **ST.${id}.04** - Testing and documentation

## Definition of Done

- All subtasks implemented and tested
- Code meets quality standards
- Integration verified
- Documentation complete
EOF
            ;;
        "subtask")
            cat > README.md << EOF
# Subtask: $name

**Subtask ID**: $id  
**Task**: $(echo "$id" | cut -d. -f1-4) - $(echo "$name" | sed 's/.*-//')  
**Status**: In Progress

## Overview

$description

## Atomic Tasks

This subtask consists of 4 atomic tasks:

1. **A.${id}.01** - Core implementation logic
2. **A.${id}.02** - Validation and error handling  
3. **A.${id}.03** - Integration and API layer
4. **A.${id}.04** - Testing and documentation

## Completion Criteria

- All atomic tasks implemented
- Unit tests passing
- Code review completed
- Documentation updated
EOF
            ;;
    esac
}

# Main generation function
generate_structure() {
    echo "Starting UPP structure generation for Epic E.0004..."
    
    for feature_key in "${!FEATURES[@]}"; do
        feature_name="${FEATURES[$feature_key]}"
        feature_dir="${feature_key}-${feature_name}"
        
        echo "Processing Feature: $feature_key - $feature_name"
        
        # Create feature directory and README if not exists
        if [[ ! -d "$feature_dir" ]]; then
            mkdir -p "$feature_dir"
            cd "$feature_dir"
            create_readme_content "feature" "$feature_key" "$feature_name" "Implementation of $feature_name functionality"
            cd ..
        fi
        
        # Generate stories for this feature
        for story_num in {01..04}; do
            story_key="${feature_key}.${story_num}"
            story_name="${STORIES[$story_key]}"
            story_dir="${feature_dir}/S.${story_key}-${story_name}"
            
            if [[ -n "$story_name" ]]; then
                echo "  Processing Story: S.$story_key - $story_name"
                
                # Create story directory and README
                mkdir -p "$story_dir"
                cd "$story_dir"
                create_readme_content "story" "S.$story_key" "$story_name" "Implementation of $story_name components"
                cd - > /dev/null
                
                # Generate tasks for this story
                for task_num in {01..04}; do
                    task_key="${story_key}.${task_num}"
                    # Generate task name based on pattern
                    case "$task_num" in
                        "01") task_name="design-architecture" ;;
                        "02") task_name="implement-core" ;;
                        "03") task_name="integration-layer" ;;
                        "04") task_name="unit-testing" ;;
                    esac
                    
                    task_dir="${story_dir}/T.${task_key}-${task_name}"
                    
                    echo "    Processing Task: T.$task_key - $task_name"
                    
                    # Create task directory and README
                    mkdir -p "$task_dir"
                    cd "$task_dir"
                    create_readme_content "task" "T.$task_key" "$task_name" "Implementation of $task_name functionality"
                    cd - > /dev/null
                    
                    # Generate subtasks for this task
                    for subtask_num in {01..04}; do
                        subtask_key="${task_key}.${subtask_num}"
                        # Generate subtask name based on pattern
                        case "$subtask_num" in
                            "01") subtask_name="core-implementation" ;;
                            "02") subtask_name="business-logic" ;;
                            "03") subtask_name="error-handling" ;;
                            "04") subtask_name="testing-documentation" ;;
                        esac
                        
                        subtask_dir="${task_dir}/ST.${subtask_key}-${subtask_name}"
                        
                        echo "      Processing Subtask: ST.$subtask_key - $subtask_name"
                        
                        # Create subtask directory and README
                        mkdir -p "$subtask_dir"
                        cd "$subtask_dir"
                        create_readme_content "subtask" "ST.$subtask_key" "$subtask_name" "Implementation of $subtask_name components"
                        cd - > /dev/null
                        
                        # Generate atomic tasks for this subtask
                        for atomic_num in {01..04}; do
                            atomic_key="${subtask_key}.${atomic_num}"
                            # Generate atomic name based on pattern
                            case "$atomic_num" in
                                "01") atomic_name="core-logic" ;;
                                "02") atomic_name="validation-rules" ;;
                                "03") atomic_name="integration-points" ;;
                                "04") atomic_name="test-implementation" ;;
                            esac
                            
                            echo "        Creating Atomic: A.$atomic_key - $atomic_name"
                            
                            # Create atomic task file
                            cd "$subtask_dir"
                            create_atomic_content "A.$atomic_key" "ST.$subtask_key" "$atomic_name" "Implementation" "$feature_name"
                            cd - > /dev/null
                        done
                    done
                done
            fi
        done
    done
    
    echo "UPP structure generation completed!"
    echo "Generated complete 6-level hierarchy:"
    echo "- 5 Features"
    echo "- 20 Stories (4 per feature)"
    echo "- 80 Tasks (4 per story)"
    echo "- 320 Subtasks (4 per task)"
    echo "- 1,280 Atomic tasks (4 per subtask)"
}

# Execute the generation
generate_structure