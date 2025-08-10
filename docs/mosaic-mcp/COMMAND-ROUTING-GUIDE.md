# MosAIc Command Routing System

## Overview

The MCP Gateway includes an intelligent command routing system that translates natural language and slash commands into appropriate MCP operations. This enables intuitive interaction with the MosAIc ecosystem through both Claude and OpenCode.

## Features

- **Slash Command Support**: Direct commands like `/project list`
- **Natural Language Processing**: Understands "show me all projects"
- **Plane Integration**: Direct connection to Plane.so for issue tracking
- **Context-Aware Routing**: Routes commands to appropriate MCP tools
- **Extensible Design**: Easy to add new commands and integrations

## Command Types

### 1. Project Commands

**Slash Commands:**
```
/project list                     # List all projects
/project create "Project Name"    # Create new project
/project switch "Project Name"    # Switch active project
```

**Natural Language:**
```
"show me all projects"
"list projects"
"create a new project called MosAIc v2"
"switch to project Frontend"
```

### 2. Task Commands

**Slash Commands:**
```
/task create "Task Title"         # Create new task
/task list [status]              # List tasks (all/pending/active/completed)
/task assign <id> <agent>        # Assign task to agent
/task depend <id> <depends-on>   # Set task dependencies
```

**Natural Language:**
```
"create a task for implementing login"
"show me all active tasks"
"list pending tasks"
"assign task TASK-001 to BE-BACKEND-BENJAMIN"
```

### 3. Agent Commands

**Slash Commands:**
```
/agent list                      # List available agents
/agent spawn <persona>           # Deploy agent with persona
/agent status <name>             # Check agent status
/agent message <name> "message"  # Send message to agent
```

**Natural Language:**
```
"show available agents"
"spawn backend developer Benjamin"
"deploy BE-BACKEND-BENJAMIN"
"what agents are currently active?"
```

### 4. Plane Integration Commands

**Slash Commands:**
```
/plane create-issue "Title"      # Create Plane issue
/plane list-issues               # List Plane issues
/plane sync                      # Sync MosAIc project with Plane
```

**Natural Language:**
```
"create plane issue for bug fix"
"show plane issues"
"sync tasks to plane"
```

### 5. Status and Help Commands

**Slash Commands:**
```
/status                          # Show current project status
/help                           # Show command help
/cost                           # Show token usage and costs
```

**Natural Language:**
```
"what's the current status?"
"show me the project progress"
"help"
"how much have we spent on tokens?"
```

## Architecture

### Command Flow

```
User Input → Command Parser → Command Router → MCP Message → Backend
     ↓              ↓               ↓               ↓            ↓
"create task"  Parse Natural   Route to Task   tools/call    Execute
              Language or      Handler         mosaic_task_  Operation
              Slash Command                    create
```

### Components

1. **CommandRouter**: Parses and routes commands
2. **MessageRouter**: Integrates commands with MCP protocol
3. **PlaneIntegration**: Handles Plane.so API operations
4. **Transport Layer**: Delivers commands via SSE/REST

## Configuration

### Enable Plane Integration

Add to `gateway-config.json`:
```json
{
  "plane": {
    "apiUrl": "http://localhost:8091",
    "apiKey": "YOUR_PLANE_API_KEY",
    "workspaceSlug": "mosaic",
    "projectId": "YOUR_PROJECT_ID"
  }
}
```

### Environment Variables
```bash
export PLANE_API_KEY="your-api-key"
export PLANE_WORKSPACE="mosaic"
export PLANE_PROJECT_ID="project-id"
```

## Implementation Examples

### Processing Natural Language

```typescript
// Input: "create a new task for fixing authentication"
const command = commandRouter.parseCommand(input);
// Result: { 
//   type: 'task', 
//   action: 'create', 
//   args: ['fixing authentication'] 
// }

const message = commandRouter.commandToMessage(command);
// Result: MCP tools/call for mosaic_task_create
```

### Handling Slash Commands

```typescript
// Input: "/project create 'MosAIc v2'"
const command = commandRouter.parseCommand(input);
// Result: { 
//   type: 'project', 
//   action: 'create', 
//   args: ['MosAIc v2'] 
// }
```

### Plane Integration

```typescript
// Create Plane issue from MosAIc task
const issue = await planeIntegration.createIssueFromTask({
  title: "Implement user authentication",
  type: "feature",
  assignedTo: "BE-BACKEND-BENJAMIN"
});
```

## Usage in Claude/OpenCode

### In Claude
Simply type commands naturally:
```
"Create a new project called MosAIc v2"
"List all active tasks"
"Show me the current status"
```

### In OpenCode
Use either natural language or slash commands:
```
/project list
/task create "Implement login system"
create plane issue for the authentication bug
```

## Extending the System

### Adding New Commands

1. Update `CommandRouter.parseCommand()`:
```typescript
if (lower.includes('deploy') && lower.includes('production')) {
  return { 
    type: CommandType.DEPLOY, 
    action: 'production', 
    args: [], 
    raw: input 
  };
}
```

2. Add command handler:
```typescript
this.registerHandler(CommandType.DEPLOY, {
  toMessage: (cmd, id) => ({
    jsonrpc: '2.0',
    id,
    method: 'tools/call',
    params: {
      name: 'mosaic_deploy_production',
      arguments: {}
    }
  })
});
```

### Adding New Integrations

1. Create integration class:
```typescript
export class JiraIntegration {
  async createIssue(params: IssueParams): Promise<JiraIssue> {
    // Implementation
  }
}
```

2. Register in MessageRouter:
```typescript
if (config.jira) {
  this.jiraIntegration = new JiraIntegration(config.jira);
}
```

## Benefits

1. **Intuitive Interaction**: Natural language understanding
2. **Unified Interface**: Same commands work in Claude and OpenCode
3. **Direct Integration**: Connect to external tools like Plane
4. **Extensible Design**: Easy to add new commands
5. **Context Preservation**: Commands understand project context

## Future Enhancements

1. **Multi-language Support**: Commands in different languages
2. **Voice Commands**: Speech-to-command integration
3. **Command Aliases**: Custom shortcuts
4. **Command History**: Recall and repeat previous commands
5. **Batch Commands**: Execute multiple operations at once

---

The command routing system makes MosAIc accessible through natural, intuitive interactions while maintaining the power and flexibility of the underlying MCP protocol.