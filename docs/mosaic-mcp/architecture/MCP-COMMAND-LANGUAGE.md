# MCP Command Language Specification

**Version**: 0.0.2  
**Status**: Core Interface Design  
**Date**: August 3, 2025  

## Overview

The MCP Command Language provides a natural, intuitive interface for interacting with MosAIc's MCP ecosystem. Users can use slash commands, natural language, or a combination of both across Claude and OpenCode.

## Design Principles

1. **Natural Language First**: Users shouldn't need to memorize syntax
2. **Progressive Enhancement**: Simple commands that accept more options
3. **Contextual Intelligence**: Commands understand project and task context
4. **Universal Compatibility**: Same commands work everywhere
5. **Discoverable**: Help and suggestions built-in

## Command Architecture

### Command Processing Pipeline

```
User Input: "plan the auth system"
           ↓
    ┌──────────────┐
    │ Input Parser │ → Detect intent and extract parameters
    └──────┬───────┘
           ↓
    ┌──────────────┐
    │Context Enricher│ → Add project, user, session context
    └──────┬───────┘
           ↓
    ┌──────────────┐
    │ Route Resolver│ → Map to specific MCP tool
    └──────┬───────┘
           ↓
    ┌──────────────┐
    │ MCP Executor │ → Call appropriate MCP server
    └──────┬───────┘
           ↓
    ┌──────────────┐
    │ Formatter    │ → Format response for client
    └──────┬───────┘
           ↓
    Response to User
```

## Core Commands

### 1. Task Planning (/plan)

**Purpose**: Decompose requirements using UPP methodology

**Syntax Variants**:
```bash
# Slash command
/plan "Build user authentication"
/plan epic "Complete payment system"
/plan story "User can reset password"

# Natural language
"Plan the authentication system"
"Break down the payment feature"
"I need to implement password reset"

# With options
/plan "API endpoints" --level task --project backend
/plan "Login flow" --patterns --assign @benjamin
```

**Parameters**:
```typescript
interface PlanCommand {
  requirement: string;
  options?: {
    level?: 'auto' | 'epic' | 'feature' | 'story' | 'task';
    project?: string;
    patterns?: boolean;  // Use pattern library
    assign?: string;     // Pre-assign to agent
    estimate?: boolean;  // Include time estimates
    export?: 'plane' | 'markdown' | 'json';
  };
}
```

**Examples**:
```bash
> plan authentication system
Planning epic: Authentication System...
✓ Found similar pattern: "auth-rest-api-v3" (94% match)
✓ Adapted to your context
✓ Token savings: 36,450

Epic: User Authentication System (3 months)
├── Feature: User Registration (2 weeks)
│   ├── Story: Email verification flow
│   ├── Story: Profile creation
│   └── Story: Welcome onboarding
├── Feature: Login System (3 weeks)
│   ├── Story: Password authentication
│   ├── Story: OAuth integration
│   └── Story: Session management
└── Feature: Security (2 weeks)
    ├── Story: Two-factor auth
    ├── Story: Password policies
    └── Story: Audit logging

→ 47 atomic tasks created
→ Assigned to: @BE-BACKEND-BENJAMIN (primary)
→ Synced to Plane.so: EPIC-2945
```

### 2. Task Management (/tasks, /t)

**Purpose**: View and manage tasks across projects

**Syntax Variants**:
```bash
# View tasks
/tasks                    # All tasks in current project
/tasks @benjamin          # Tasks assigned to Benjamin
/tasks in-progress        # Tasks by status
/tasks due-today          # Tasks by deadline
/t overdue               # Short alias

# Natural language
"What needs to be done?"
"Show me Benjamin's tasks"
"What's overdue?"
"Tasks for this sprint"

# Modify tasks
/tasks complete TASK-123
/tasks assign TASK-456 @sarah
/tasks depend TASK-789 on TASK-456
```

**Filters**:
```typescript
interface TaskFilters {
  project?: string;
  assignee?: string | '@agent';
  status?: 'todo' | 'in-progress' | 'review' | 'done';
  priority?: 'critical' | 'high' | 'medium' | 'low';
  due?: 'today' | 'week' | 'overdue' | Date;
  type?: 'epic' | 'feature' | 'story' | 'task' | 'subtask' | 'atomic';
  search?: string;
}
```

### 3. Project Management (/project, /p)

**Purpose**: Manage multi-project context

**Syntax Variants**:
```bash
# Project navigation
/project list             # Show all projects
/project switch backend   # Change active project
/project status          # Current project health
/p deps                  # Show dependencies

# Natural language
"Switch to the backend project"
"What projects do we have?"
"Show project dependencies"

# Project operations
/project create "Mobile App" --template react-native
/project archive legacy-api
/project clone backend backend-v2
```

**Project Context**:
```typescript
interface ProjectContext {
  id: string;
  name: string;
  active: boolean;
  settings: {
    defaultAgent?: string;
    techStack?: string[];
    conventions?: string;
  };
  metrics: {
    tasksTotal: number;
    tasksComplete: number;
    velocity: number;
  };
}
```

### 4. Documentation (/docs, /d)

**Purpose**: Instant access to documentation via Context7

**Syntax Variants**:
```bash
# Search documentation
/docs react hooks
/docs typescript generics
/d express middleware

# Natural language
"How do React hooks work?"
"Show me TypeScript generic examples"
"Documentation for Express middleware"

# With context
/docs --project current   # Use project's tech stack
/docs --cache            # Prefer cached results
/docs --examples         # Code examples only
```

### 5. Pattern Management (/pattern)

**Purpose**: Save and reuse successful decompositions

**Syntax Variants**:
```bash
# Pattern operations
/pattern save "auth-system"      # Save current decomposition
/pattern list                    # Show all patterns
/pattern search auth             # Find patterns
/pattern apply auth-v3 "New API" # Apply pattern

# Natural language
"Save this plan as a pattern"
"What patterns do we have for authentication?"
"Apply the auth pattern to the new API"

# Pattern sharing
/pattern share auth-v3 --team
/pattern import https://patterns.mosaicstack.dev/payment-v2
/pattern stats               # Usage statistics
```

### 6. Agent Coordination (/agent)

**Purpose**: Manage AI agent assignments and coordination

**Syntax Variants**:
```bash
# Agent management
/agent list                  # Available agents
/agent status               # Current assignments
/agent assign TASK-123 @benjamin
/agent workload             # Load balancing view

# Natural language
"Who's available to work on this?"
"Assign the backend tasks to Benjamin"
"Show me agent workload"

# Coordination
/agent handoff TASK-123 from @benjamin to @sarah
/agent collaborate EPIC-789 @benjamin @fiona
```

### 7. Usage & Optimization (/usage)

**Purpose**: Track token usage and optimize spending

**Note**: Uses `/usage` to avoid conflicts with Claude's built-in `/cost` command

**Syntax Variants**:
```bash
# Usage tracking
/usage                      # Current session usage
/usage today               # Daily usage  
/usage month               # Monthly report
/usage breakdown           # Detailed breakdown

# Natural language
"How many tokens have I used today?"
"Show my usage breakdown"
"What's our monthly burn rate?"

# Optimization
/usage optimize            # Suggestions for savings
/usage patterns            # Pattern ROI analysis
/usage compare last-month  # Trend analysis
```

## Natural Language Processing

### Intent Recognition

```typescript
class IntentRecognizer {
  private intents = {
    plan: [
      /plan|decompose|break down|split up/i,
      /how do I implement|how to build/i,
      /create tasks for|organize/i
    ],
    tasks: [
      /tasks?|todos?|work items?/i,
      /what.*do|what.*done|what.*working/i,
      /show.*assignments?|list.*work/i
    ],
    docs: [
      /docs?|documentation|how does.*work/i,
      /examples?|reference|tutorial/i,
      /explain|tell me about/i
    ]
  };
  
  recognize(input: string): Intent {
    // Check direct commands first
    if (input.startsWith('/')) {
      return this.parseSlashCommand(input);
    }
    
    // Natural language processing
    for (const [intent, patterns] of Object.entries(this.intents)) {
      if (patterns.some(p => p.test(input))) {
        return {
          type: intent,
          confidence: 0.85,
          parameters: this.extractParameters(input, intent)
        };
      }
    }
    
    // Fallback to AI interpretation
    return this.aiInterpret(input);
  }
}
```

### Context Enhancement

```typescript
class ContextEnhancer {
  enhance(command: ParsedCommand): EnhancedCommand {
    return {
      ...command,
      context: {
        project: this.getCurrentProject(),
        user: this.getCurrentUser(),
        session: this.getSessionContext(),
        history: this.getRecentCommands(5),
        state: this.getCurrentState()
      }
    };
  }
  
  // Use context for smarter responses
  async applyContext(command: EnhancedCommand): Promise<void> {
    // "Show my tasks" → tasks for current user in current project
    if (command.type === 'tasks' && !command.parameters.assignee) {
      command.parameters.assignee = command.context.user;
      command.parameters.project = command.context.project;
    }
    
    // "Continue planning" → resume from last plan command
    if (command.type === 'plan' && command.parameters.resume) {
      command.parameters.parent = command.context.history
        .find(h => h.type === 'plan')?.result;
    }
  }
}
```

## Command Aliases & Shortcuts

### Built-in Aliases

```yaml
aliases:
  # Task shortcuts
  t: tasks
  tl: tasks list
  ta: tasks add
  tc: tasks complete
  
  # Project shortcuts  
  p: project
  ps: project switch
  pl: project list
  
  # Documentation
  d: docs
  
  # Quick actions
  qa: "tasks @me in-progress"       # Quick access to my current tasks
  standup: "tasks @me since yesterday"
  blocked: "tasks status:blocked"
  
  # Natural language mappings
  "what should I do": "tasks @me todo priority:high"
  "what's next": "tasks @me todo limit:1"
  "help me with": "docs"
```

### Custom Aliases

```typescript
// Users can define custom aliases
interface CustomAlias {
  trigger: string;
  expansion: string;
  description?: string;
}

// Examples
const userAliases: CustomAlias[] = [
  {
    trigger: "backend",
    expansion: "project switch backend-api && tasks",
    description: "Switch to backend and show tasks"
  },
  {
    trigger: "morning",
    expansion: "tasks @me due:today && cost yesterday",
    description: "Morning standup routine"
  }
];
```

## Intelligent Features

### Auto-completion

```typescript
class CommandAutoComplete {
  suggest(partial: string): Suggestion[] {
    const suggestions = [];
    
    // Command suggestions
    if (partial.startsWith('/')) {
      suggestions.push(...this.matchCommands(partial));
    }
    
    // Parameter suggestions
    if (partial.includes(' ')) {
      suggestions.push(...this.matchParameters(partial));
    }
    
    // Context-aware suggestions
    if (this.context.lastCommand?.type === 'plan') {
      suggestions.push({
        text: '/pattern save',
        description: 'Save this plan as a reusable pattern'
      });
    }
    
    return suggestions;
  }
}
```

### Error Recovery

```typescript
class CommandErrorHandler {
  async handle(error: CommandError): Promise<Response> {
    switch (error.type) {
      case 'ambiguous':
        return {
          message: "Did you mean:",
          suggestions: error.suggestions,
          prompt: "Please select or clarify"
        };
        
      case 'missing_parameter':
        return {
          message: `Missing required: ${error.parameter}`,
          example: this.getExample(error.command),
          prompt: "Please provide the missing information"
        };
        
      case 'unknown_command':
        const closest = this.findClosest(error.input);
        return {
          message: `Unknown command: ${error.input}`,
          suggestion: `Did you mean: ${closest}?`,
          help: "Type /help for available commands"
        };
    }
  }
}
```

## Multi-modal Responses

### Formatted Output

```typescript
class ResponseFormatter {
  format(result: any, context: Context): FormattedResponse {
    // Determine best format based on client and content
    const format = this.selectFormat(context.client, result);
    
    switch (format) {
      case 'tree':
        return this.formatTree(result);
        
      case 'table':
        return this.formatTable(result);
        
      case 'markdown':
        return this.formatMarkdown(result);
        
      case 'interactive':
        return this.formatInteractive(result);
    }
  }
  
  // Example: Task list formatting
  private formatTaskList(tasks: Task[]): string {
    return tasks.map(task => 
      `${this.getStatusIcon(task.status)} ${task.id}: ${task.title}
   Assignee: ${task.assignee} | Due: ${task.due}
   Progress: ${this.getProgressBar(task.progress)}`
    ).join('\n\n');
  }
}
```

## Configuration

### Command Registry Configuration

```yaml
commands:
  # Core commands
  plan:
    description: "Decompose requirements using UPP"
    aliases: ["decompose", "break down"]
    mcp_server: "upp"
    tool: "decompose"
    
  tasks:
    description: "Manage tasks and work items"
    aliases: ["t", "todos", "work"]
    mcp_server: "plane"
    tool: "list"
    
  # Command options
  options:
    natural_language: true
    fuzzy_matching: true
    auto_complete: true
    suggestions: 5
    
  # Response formatting
  formatting:
    use_colors: true
    use_icons: true
    tree_style: "ascii"  # or "unicode"
    
  # Error handling
  errors:
    verbose: false
    suggestions: true
    examples: true
```

### Natural Language Settings

```yaml
nlp:
  # Intent recognition
  confidence_threshold: 0.75
  ambiguity_prompt: true
  
  # Context usage
  use_context: true
  context_window: 5  # Recent commands
  
  # Learning
  learn_from_usage: true
  pattern_detection: true
  
  # Localization
  language: "en"
  variants: ["en-US", "en-GB"]
```

## Integration Examples

### Claude Integration

```typescript
// In CLAUDE.md instructions
const claudeInstructions = `
When users input natural language requests:
1. Check if it matches a command intent
2. Use the MCP Command Router to process
3. Format response appropriately

Examples:
- "What should I work on?" → /tasks @me todo priority:high
- "Plan the new feature" → /plan {feature_description}
- "Show me the React docs" → /docs react
`;
```

### OpenCode Integration

```typescript
// OpenCode command handler
export function handleCommand(input: string): Promise<Response> {
  const command = commandParser.parse(input);
  const enhanced = contextEnhancer.enhance(command);
  const route = routeResolver.resolve(enhanced);
  
  return mcpExecutor.execute(route);
}
```

## Success Metrics

### Usage Metrics
- Command success rate: >95%
- Natural language understanding: >85%
- Average response time: <500ms
- Auto-complete usage: >60%

### User Satisfaction
- Error rate: <5%
- Retry rate: <10%
- Feature discovery: >80% use 3+ commands
- Alias creation: >40% create custom aliases

## Extensibility

### Adding New Commands

```typescript
// Register a new command
commandRegistry.register({
  name: 'review',
  description: 'Code review assistance',
  handler: async (params) => {
    // Implementation
  },
  parameters: {
    file: { type: 'string', required: true },
    type: { 
      type: 'enum',
      values: ['security', 'performance', 'style'],
      default: 'all'
    }
  }
});
```

### Plugin System

```typescript
// Commands can be added via plugins
interface CommandPlugin {
  name: string;
  version: string;
  commands: CommandDefinition[];
  setup?: (registry: CommandRegistry) => void;
}
```

## Next Steps

1. Implement core command parser
2. Build natural language processor
3. Create context enhancement system
4. Design response formatters
5. Add auto-completion engine
6. Test with real user inputs

---

The MCP Command Language makes MosAIc's powerful features accessible through natural, intuitive commands that work consistently across all interfaces.