# Agent Handoff Protocol v1.0

## Overview

The Agent Handoff Protocol enables autonomous session continuity between Claude agents in the Tony-NG framework. This protocol solves the fundamental challenge of context loss between agent sessions, allowing seamless handoffs without manual re-instruction.

## Core Components

### 1. Context Schema
- **Location**: `templates/agent-context-schema.json`
- **Purpose**: Standardized structure for all agent handoffs
- **Key Sections**:
  - Session identification and tracking
  - Task hierarchy and current state
  - Project state and modifications
  - Execution context and constraints
  - Handoff instructions for next agent
  - Evidence tracking and validation

### 2. Wrapper Scripts
- **spawn-agent.sh**: Context-aware agent spawning
- **context-manager.sh**: Context lifecycle management
- **validate-context.js**: Context validation

### 3. Context Templates
- **planning-handoff.json**: Tony → Implementation agents
- **implementation-handoff.json**: Dev → QA agents
- **qa-handoff.json**: QA → Remediation agents
- **recovery-handoff.json**: Failure recovery scenarios

## Usage Examples

### Basic Agent Handoff
```bash
# Create initial context from template
./scripts/context-manager.sh \
  --action create \
  --context templates/context/planning-handoff.json \
  --output /tmp/session-context.json

# Spawn implementation agent with context
./scripts/spawn-agent.sh \
  --context /tmp/session-context.json \
  --agent-type implementation-agent \
  --output-context /tmp/next-context.json

# Spawn QA agent with updated context
./scripts/spawn-agent.sh \
  --context /tmp/next-context.json \
  --agent-type qa-agent \
  --output-context /tmp/qa-context.json
```

### Tony Framework Integration
```bash
# Tony creates initial context
claude --model opus "As Tech Lead Tony, create implementation plan for E.001 and generate context handoff"

# Tony spawns implementation agent
./scripts/spawn-agent.sh \
  --context docs/agent-management/tech-lead-tony/context/E.001-handoff.json \
  --agent-type backend-agent

# Implementation agent completes work and updates context
./scripts/context-manager.sh \
  --action update \
  --context docs/agent-management/tech-lead-tony/context/E.001-handoff.json \
  --status completed \
  --agent backend-agent
```

### Autonomous Recovery Flow
```bash
# Detect failure and create recovery context
if [ $BUILD_STATUS -ne 0 ]; then
  ./scripts/context-manager.sh \
    --action create \
    --context templates/context/recovery-handoff.json \
    --output /tmp/recovery-context.json
  
  # Spawn recovery agent with Opus model
  ./scripts/spawn-agent.sh \
    --context /tmp/recovery-context.json \
    --agent-type recovery-agent \
    --model opus
fi
```

## Context Structure

### Minimal Valid Context
```json
{
  "schema_version": "1.0.0",
  "session": {
    "session_id": "A1B2C3D4-E5F6-7890-1234-567890ABCDEF",
    "timestamp": "2025-07-12T10:00:00.000Z",
    "agent_chain": []
  },
  "task_context": {
    "current_task": {
      "id": "T.001.01.01.01",
      "title": "Implement feature X",
      "status": "pending",
      "priority": "high"
    },
    "task_hierarchy": {
      "epic": {
        "id": "E.001",
        "title": "System Enhancement"
      },
      "current_path": ["E.001", "F.001.01", "S.001.01.01", "T.001.01.01.01"]
    },
    "phase_info": {
      "current_phase": "phase-1",
      "phase_status": "in_progress"
    }
  },
  "project_state": {
    "working_directory": "/home/user/project",
    "git_status": {
      "branch": "main",
      "is_clean": true
    }
  },
  "execution_context": {
    "model_selection": {
      "current_model": "sonnet",
      "reason": "Standard implementation task"
    },
    "tool_authorizations": ["Bash", "Read", "Write", "Edit", "Grep", "Glob"]
  },
  "handoff_instructions": {
    "next_agent_type": "qa-agent",
    "continuation_point": "Validate implementation of feature X",
    "success_criteria": [
      {
        "criterion": "All tests pass",
        "validation_method": "automated_test",
        "priority": "required"
      }
    ]
  }
}
```

## Integration Points

### 1. Tony Framework
Update Tony's agent deployment commands:
```bash
# Old way (manual)
claude --model sonnet "You are the implementation agent. Implement JWT validation..."

# New way (autonomous)
./scripts/spawn-agent.sh --context $CONTEXT_FILE --agent-type implementation-agent
```

### 2. Orchestration Service
```typescript
// backend/src/orchestration/services/agent-spawner.service.ts
async spawnAgent(context: AgentContext): Promise<AgentResult> {
  const contextFile = await this.writeContext(context);
  const result = await this.executeCommand(
    `./scripts/spawn-agent.sh --context ${contextFile} --agent-type ${context.agentType}`
  );
  return this.parseAgentResult(result);
}
```

### 3. CI/CD Pipeline
```yaml
# .github/workflows/agent-handoff.yml
- name: Spawn Test Agent
  run: |
    ./scripts/spawn-agent.sh \
      --context ${{ steps.context.outputs.file }} \
      --agent-type testing-agent \
      --output-context /tmp/test-results.json
```

## Best Practices

### 1. Context Size Management
- Keep contexts under 10KB for optimal performance
- Use context pruning for long agent chains
- Store large artifacts separately with references

### 2. Error Handling
- Always validate contexts before spawning agents
- Implement retry logic for transient failures
- Preserve failure contexts for debugging

### 3. Session Continuity
- Maintain session ID throughout workflow
- Track agent lineage for accountability
- Use timestamps for performance analysis

### 4. Security
- Never store secrets in context files
- Validate file paths before access
- Implement access controls for sensitive operations

## Troubleshooting

### Common Issues

1. **Context Validation Failures**
   - Check schema version compatibility
   - Verify required fields are present
   - Validate JSON syntax

2. **Agent Spawn Failures**
   - Ensure claude CLI is in PATH
   - Check tool authorization permissions
   - Verify model availability

3. **Session Continuity Breaks**
   - Check for gaps in agent chain
   - Verify timestamp ordering
   - Ensure proper context updates

### Debug Mode
```bash
# Enable debug output
./scripts/spawn-agent.sh --context context.json --agent-type dev-agent --debug

# Query specific context fields
./scripts/context-manager.sh --action query --context context.json --field session.session_id
```

## Migration Guide

### From Manual Coordination
1. Create context templates for your workflows
2. Update agent deployment scripts
3. Add context validation to CI/CD
4. Monitor handoff success rates

### From Scratchpad System
1. Export scratchpad data to context format
2. Update agent instructions for context reading
3. Gradually migrate workflows
4. Maintain backwards compatibility

## Future Enhancements

### Planned Features
- Distributed context storage
- Real-time handoff monitoring
- Context compression for large projects
- Multi-agent parallel coordination
- Automatic context recovery

### Version 2.0 Roadmap
- GraphQL API for context queries
- WebSocket streaming for live updates
- Context encryption for sensitive data
- Machine learning for optimal handoffs
- Performance analytics dashboard