# Sequential Thinking MCP Integration - Proof of Concept

**Date**: August 2, 2025  
**Status**: Implementation Guide  
**Epic**: Task Management Control & Sequential Thinking

## Overview

This document provides a complete implementation guide for integrating Sequential Thinking MCP with the MosAIc SDK to enable atomic task decomposition and hierarchical task management.

## Architecture

```
User Request
    ↓
Sequential Thinking MCP (Decomposition)
    ↓
Tony Hierarchy Mapper (UPP Structure)
    ↓
MosAIc Task Service (Storage & Management)
    ↓
Agent Assignment & Execution
```

## Implementation Plan

### Phase 1: Sequential Thinking MCP Setup

#### 1.1 Installation & Configuration

```bash
# Add to ~/.config/mosaic/claude/config.json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "env": {
        "MAX_THINKING_DEPTH": "6",
        "ENABLE_TASK_DECOMPOSITION": "true"
      }
    }
  }
}
```

#### 1.2 Test Sequential Thinking

```bash
# Test command
"Use sequential thinking to break down: Create a user authentication system with OAuth2, JWT tokens, and role-based access control"

# Expected output structure
{
  "thoughts": [
    {
      "type": "epic",
      "content": "Authentication System Implementation",
      "subtasks": [...]
    }
  ]
}
```

### Phase 2: Tony Hierarchy Mapper Implementation

#### 2.1 Core Mapper Service

Location: `packages/mcp-orchestrator/src/services/TonyHierarchyMapper.ts`

```typescript
import { z } from 'zod';
import { TaskType, TaskLevel, Task } from '../types';

export interface SequentialThought {
  content: string;
  type?: string;
  subtasks?: SequentialThought[];
  dependencies?: string[];
  estimatedHours?: number;
}

export interface TaskDecomposition {
  epic: Task;
  features: Task[];
  stories: Task[];
  tasks: Task[];
  subtasks: Task[];
  atomic: Task[];
  dependencies: TaskDependency[];
}

export class TonyHierarchyMapper {
  private taskIdCounter = 0;
  private taskMap = new Map<string, Task>();

  /**
   * Convert Sequential Thinking output to Tony hierarchy
   */
  async mapSequentialToHierarchy(
    thoughts: SequentialThought[],
    projectContext: ProjectContext
  ): Promise<TaskDecomposition> {
    const decomposition: TaskDecomposition = {
      epic: null,
      features: [],
      stories: [],
      tasks: [],
      subtasks: [],
      atomic: [],
      dependencies: []
    };

    // Process thoughts recursively
    for (const thought of thoughts) {
      await this.processThought(thought, decomposition, null);
    }

    // Validate hierarchy completeness
    this.validateHierarchy(decomposition);

    return decomposition;
  }

  private async processThought(
    thought: SequentialThought,
    decomposition: TaskDecomposition,
    parentId: string | null
  ): Promise<Task> {
    const level = this.determineTaskLevel(thought, parentId);
    const task = this.createTaskFromThought(thought, level, parentId);
    
    // Store in appropriate array
    this.addTaskToDecomposition(task, decomposition);
    
    // Process subtasks recursively
    if (thought.subtasks) {
      for (const subtask of thought.subtasks) {
        await this.processThought(subtask, decomposition, task.id);
      }
    }

    // Process dependencies
    if (thought.dependencies) {
      this.processDependencies(task, thought.dependencies, decomposition);
    }

    return task;
  }

  private determineTaskLevel(
    thought: SequentialThought,
    parentId: string | null
  ): TaskLevel {
    // Heuristic-based level determination
    const content = thought.content.toLowerCase();
    
    if (!parentId && (content.includes('system') || content.includes('platform'))) {
      return TaskLevel.EPIC;
    }
    
    if (content.includes('feature') || content.includes('capability')) {
      return TaskLevel.FEATURE;
    }
    
    if (content.includes('as a') || content.includes('user story')) {
      return TaskLevel.STORY;
    }
    
    if (content.includes('implement') || content.includes('create')) {
      return TaskLevel.TASK;
    }
    
    if (content.includes('sub') || content.includes('component')) {
      return TaskLevel.SUBTASK;
    }
    
    // Default to atomic for leaf nodes
    return TaskLevel.ATOMIC;
  }

  private createTaskFromThought(
    thought: SequentialThought,
    level: TaskLevel,
    parentId: string | null
  ): Task {
    const taskId = `T-${++this.taskIdCounter}`;
    
    const task: Task = {
      id: taskId,
      title: this.extractTitle(thought.content),
      description: thought.content,
      type: level,
      parentId: parentId,
      status: 'pending',
      priority: this.determinePriority(thought),
      estimatedHours: thought.estimatedHours || this.estimateHours(level),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.taskMap.set(taskId, task);
    return task;
  }

  private extractTitle(content: string): string {
    // Extract first sentence or up to 60 characters
    const firstSentence = content.split('.')[0];
    return firstSentence.length > 60 
      ? firstSentence.substring(0, 57) + '...'
      : firstSentence;
  }

  private estimateHours(level: TaskLevel): number {
    const estimates = {
      [TaskLevel.EPIC]: 160,
      [TaskLevel.FEATURE]: 40,
      [TaskLevel.STORY]: 16,
      [TaskLevel.TASK]: 8,
      [TaskLevel.SUBTASK]: 4,
      [TaskLevel.ATOMIC]: 2
    };
    return estimates[level] || 2;
  }
}
```

#### 2.2 Integration with Task Service

Location: `packages/mcp-orchestrator/src/services/TaskService.ts` (additions)

```typescript
export class TaskService {
  private hierarchyMapper: TonyHierarchyMapper;

  constructor(config: MCPServerConfig, logger: Logger) {
    // ... existing constructor
    this.hierarchyMapper = new TonyHierarchyMapper();
  }

  /**
   * Decompose a high-level task using Sequential Thinking
   */
  async decomposeTask(
    description: string,
    context: DecompositionContext
  ): Promise<TaskDecomposition> {
    try {
      // Call Sequential Thinking MCP
      const thoughts = await this.callSequentialThinking(description);
      
      // Map to Tony hierarchy
      const decomposition = await this.hierarchyMapper.mapSequentialToHierarchy(
        thoughts,
        context
      );
      
      // Store tasks in database
      await this.storeDecomposition(decomposition);
      
      // Track metrics
      this.trackDecompositionMetrics(decomposition);
      
      return decomposition;
    } catch (error) {
      this.logger.error('Task decomposition failed', error);
      throw new TaskDecompositionError(error.message);
    }
  }

  private async callSequentialThinking(
    description: string
  ): Promise<SequentialThought[]> {
    // Implementation to call Sequential Thinking MCP
    // This would use the MCP client to communicate with the server
    const response = await this.mcpClient.callTool(
      'sequential-thinking',
      'think',
      {
        prompt: description,
        mode: 'task_decomposition',
        maxDepth: 6
      }
    );
    
    return this.parseSequentialResponse(response);
  }
}
```

### Phase 3: New MCP Tools

#### 3.1 Sequential Task Tools

Location: `packages/mcp-orchestrator/src/tools/SequentialTaskTools.ts`

```typescript
import { z } from 'zod';
import { MCPTool, ToolResponse } from '../types';
import { TaskService } from '../services/TaskService';
import { Logger } from '../utils/Logger';

const DecomposeTaskSchema = z.object({
  description: z.string().min(10).max(1000),
  context: z.object({
    projectId: z.string().optional(),
    domain: z.string().optional(),
    constraints: z.array(z.string()).optional(),
    targetAgents: z.array(z.string()).optional()
  }).optional(),
  options: z.object({
    maxDepth: z.number().min(1).max(6).default(6),
    includeEstimates: z.boolean().default(true),
    autoAssign: z.boolean().default(false)
  }).optional()
});

const BatchEstimateSchema = z.object({
  taskIds: z.array(z.string()).min(1).max(100),
  estimationMethod: z.enum(['ai', 'historical', 'manual']).default('ai'),
  confidence: z.enum(['low', 'medium', 'high']).default('medium')
});

const IntelligentAssignSchema = z.object({
  taskIds: z.array(z.string()).min(1).max(50),
  strategy: z.enum(['skill_match', 'load_balance', 'priority', 'hybrid']).default('hybrid'),
  constraints: z.object({
    maxTasksPerAgent: z.number().optional(),
    requiredSkills: z.array(z.string()).optional(),
    preferredAgents: z.array(z.string()).optional(),
    excludeAgents: z.array(z.string()).optional()
  }).optional()
});

export class SequentialTaskTools {
  private taskService: TaskService;
  private logger: Logger;

  constructor(taskService: TaskService, logger: Logger) {
    this.taskService = taskService;
    this.logger = logger;
  }

  getTools(): MCPTool[] {
    return [
      {
        name: 'decompose',
        description: 'Decompose a high-level task into atomic subtasks using Sequential Thinking',
        inputSchema: DecomposeTaskSchema,
        handler: this.decomposeTask.bind(this)
      },
      {
        name: 'estimate_batch',
        description: 'Estimate time for multiple tasks efficiently using AI or historical data',
        inputSchema: BatchEstimateSchema,
        handler: this.batchEstimate.bind(this)
      },
      {
        name: 'assign_intelligent',
        description: 'Intelligently assign tasks to agents based on skills and workload',
        inputSchema: IntelligentAssignSchema,
        handler: this.intelligentAssign.bind(this)
      }
    ];
  }

  private async decomposeTask(args: any): Promise<ToolResponse> {
    const startTime = Date.now();
    
    try {
      const input = DecomposeTaskSchema.parse(args);
      
      this.logger.info('Decomposing task', { 
        description: input.description.substring(0, 50) + '...' 
      });

      // Perform decomposition
      const decomposition = await this.taskService.decomposeTask(
        input.description,
        input.context || {}
      );

      // Format output
      const output = this.formatDecompositionOutput(decomposition);

      return {
        title: 'Task Decomposition Complete',
        metadata: {
          operation: 'task_decompose',
          status: 'success',
          timestamp: new Date().toISOString(),
          execution_time_ms: Date.now() - startTime,
          stats: {
            total_tasks: this.countTotalTasks(decomposition),
            hierarchy_depth: 6,
            estimated_total_hours: this.calculateTotalHours(decomposition)
          }
        },
        output
      };
    } catch (error) {
      this.logger.error('Task decomposition failed', error);
      return this.createErrorResponse('task_decompose', error, Date.now() - startTime);
    }
  }

  private formatDecompositionOutput(decomposition: TaskDecomposition): string {
    const lines = [];
    
    lines.push('📋 Task Hierarchy Created:');
    lines.push('');
    
    // Epic
    if (decomposition.epic) {
      lines.push(`🎯 Epic: ${decomposition.epic.title}`);
      lines.push(`   ID: ${decomposition.epic.id}`);
      lines.push(`   Estimated: ${decomposition.epic.estimatedHours}h`);
      lines.push('');
    }
    
    // Features
    if (decomposition.features.length > 0) {
      lines.push(`📦 Features (${decomposition.features.length}):`);
      decomposition.features.forEach(f => {
        lines.push(`   - ${f.title} (${f.estimatedHours}h)`);
      });
      lines.push('');
    }
    
    // Stories
    if (decomposition.stories.length > 0) {
      lines.push(`📖 User Stories (${decomposition.stories.length}):`);
      decomposition.stories.slice(0, 5).forEach(s => {
        lines.push(`   - ${s.title}`);
      });
      if (decomposition.stories.length > 5) {
        lines.push(`   ... and ${decomposition.stories.length - 5} more`);
      }
      lines.push('');
    }
    
    // Summary
    lines.push('📊 Summary:');
    lines.push(`   Total Tasks: ${this.countTotalTasks(decomposition)}`);
    lines.push(`   Total Hours: ${this.calculateTotalHours(decomposition)}`);
    lines.push(`   Dependencies: ${decomposition.dependencies.length}`);
    
    return lines.join('\n');
  }

  private countTotalTasks(decomposition: TaskDecomposition): number {
    return 1 + // epic
      decomposition.features.length +
      decomposition.stories.length +
      decomposition.tasks.length +
      decomposition.subtasks.length +
      decomposition.atomic.length;
  }

  private calculateTotalHours(decomposition: TaskDecomposition): number {
    // Only count atomic task hours to avoid double counting
    return decomposition.atomic.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
  }
}
```

### Phase 4: Testing & Validation

#### 4.1 Test Scenarios

Location: `docs/mosaic-mcp/sequential-thinking-tests.md`

```markdown
# Sequential Thinking Test Scenarios

## Test 1: Simple Web Application
**Input**: "Create a TODO list web application with user authentication"

**Expected Decomposition**:
- 1 Epic: TODO List Application
- 2-3 Features: Authentication, TODO Management, UI
- 5-6 Stories: User registration, Login, Create TODO, etc.
- 10-15 Tasks: Implementation details
- 20-30 Atomic tasks: Specific coding tasks

## Test 2: Complex System
**Input**: "Build an e-commerce platform with inventory management, payment processing, and shipping integration"

**Expected Decomposition**:
- 3-4 Epics: Core Platform, Payment System, Inventory, Shipping
- 10-15 Features: Product catalog, Cart, Checkout, etc.
- 30-40 Stories: Detailed user interactions
- 100+ Tasks: Technical implementation
- 200+ Atomic tasks: Individual work items

## Test 3: API Development
**Input**: "Create a RESTful API for a blog platform with posts, comments, and user management"

**Expected Decomposition**:
- 1 Epic: Blog API Platform
- 4 Features: Posts API, Comments API, Users API, Auth
- 12-15 Stories: CRUD operations for each entity
- 30-40 Tasks: Endpoint implementations
- 60-80 Atomic tasks: Individual endpoints and tests
```

#### 4.2 Integration Tests

Location: `packages/mcp-orchestrator/tests/sequential-thinking.test.ts`

```typescript
import { TonyHierarchyMapper } from '../src/services/TonyHierarchyMapper';
import { SequentialTaskTools } from '../src/tools/SequentialTaskTools';

describe('Sequential Thinking Integration', () => {
  let mapper: TonyHierarchyMapper;
  let tools: SequentialTaskTools;

  beforeEach(() => {
    mapper = new TonyHierarchyMapper();
    // Setup tools with mock services
  });

  test('should decompose simple task correctly', async () => {
    const thoughts = [
      {
        content: 'Create user authentication system',
        subtasks: [
          { content: 'Implement user registration feature' },
          { content: 'Create login functionality' }
        ]
      }
    ];

    const decomposition = await mapper.mapSequentialToHierarchy(thoughts, {});
    
    expect(decomposition.epic).toBeDefined();
    expect(decomposition.features).toHaveLength(2);
    expect(decomposition.epic.title).toContain('authentication');
  });

  test('should handle deep hierarchies', async () => {
    // Test with 6-level deep hierarchy
  });

  test('should estimate hours appropriately', async () => {
    // Test hour estimation logic
  });

  test('should track dependencies', async () => {
    // Test dependency tracking
  });
});
```

### Phase 5: Usage Examples

#### 5.1 Basic Usage

```bash
# Simple decomposition
mosaic_task_decompose {
  "description": "Create a user profile management system",
  "options": {
    "maxDepth": 4,
    "includeEstimates": true
  }
}

# With context
mosaic_task_decompose {
  "description": "Implement real-time chat feature",
  "context": {
    "projectId": "proj-123",
    "domain": "messaging",
    "constraints": ["websocket", "scalable", "encrypted"]
  }
}
```

#### 5.2 Advanced Workflows

```bash
# Full workflow: Decompose → Estimate → Assign
# Step 1: Decompose
mosaic_task_decompose {
  "description": "Build a dashboard with analytics and reporting",
  "options": { "autoAssign": false }
}

# Step 2: Batch estimate atomic tasks
mosaic_task_estimate_batch {
  "taskIds": ["T-101", "T-102", "T-103", ...],
  "estimationMethod": "ai",
  "confidence": "high"
}

# Step 3: Intelligent assignment
mosaic_task_assign_intelligent {
  "taskIds": ["T-101", "T-102", "T-103", ...],
  "strategy": "hybrid",
  "constraints": {
    "maxTasksPerAgent": 5,
    "requiredSkills": ["react", "typescript", "d3js"]
  }
}
```

## Next Steps

1. **Implement Core Components**
   - TonyHierarchyMapper service
   - SequentialTaskTools implementation
   - Integration with existing TaskService

2. **Add Sequential Thinking Client**
   - MCP client for Sequential Thinking server
   - Response parsing and validation
   - Error handling and retries

3. **Create Database Schema Updates**
   - Add hierarchy support to tasks table
   - Implement dependency tracking
   - Add estimation confidence fields

4. **Build UI Components**
   - Task hierarchy visualization
   - Decomposition review interface
   - Progress tracking dashboard

5. **Performance Optimization**
   - Implement caching for decompositions
   - Batch database operations
   - Optimize recursive queries

## Configuration

### Environment Variables

```bash
# Sequential Thinking
SEQUENTIAL_THINKING_ENABLED=true
SEQUENTIAL_THINKING_MAX_DEPTH=6
SEQUENTIAL_THINKING_TIMEOUT=30000

# Task Decomposition
TASK_DECOMPOSITION_AUTO_ASSIGN=false
TASK_DECOMPOSITION_DEFAULT_ESTIMATION=ai
TASK_DECOMPOSITION_CACHE_TTL=3600

# API Usage Control
API_RATE_LIMIT_PER_MINUTE=60
API_BATCH_SIZE=50
API_QUEUE_MAX_SIZE=1000
```

### MCP Configuration

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "env": {
        "MAX_THINKING_DEPTH": "6"
      }
    },
    "mosaic": {
      "command": "mosaic-mcp",
      "args": ["serve"],
      "env": {
        "SEQUENTIAL_THINKING_ENABLED": "true"
      }
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Sequential Thinking timeout**
   - Increase SEQUENTIAL_THINKING_TIMEOUT
   - Reduce MAX_THINKING_DEPTH
   - Simplify input descriptions

2. **Hierarchy too deep**
   - Adjust level determination heuristics
   - Merge similar tasks at atomic level
   - Use task grouping for related items

3. **Poor time estimates**
   - Calibrate estimation model with historical data
   - Use confidence levels for uncertainty
   - Allow manual override for critical tasks

## References

- [Sequential Thinking MCP Documentation](https://github.com/modelcontextprotocol/servers/tree/main/src/sequential-thinking)
- [Tony Framework UPP Methodology](../tony-framework/UPP-METHODOLOGY.md)
- [MosAIc Task Management](./TASK-MANAGEMENT-GUIDE.md)