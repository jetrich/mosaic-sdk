# UPP MCP Design Document

**Version**: 0.0.2  
**Status**: Core Component Design  
**Date**: August 3, 2025  

## Overview

The UPP (Unified Planning Protocol) MCP is the intelligent task decomposition engine that enforces MosAIc's hierarchical planning methodology while learning from patterns to dramatically reduce token usage over time.

## Core Purpose

Transform high-level requirements into perfectly decomposed, agent-ready tasks following the 6-level UPP hierarchy while leveraging Sequential Thinking and pattern recognition to minimize API tokens.

## The UPP Hierarchy

```
┌─────────────────────────────────────────────────┐
│                    EPIC                         │
│            (Major Feature Area)                 │
│              3-6 month scope                    │
└────────────────────┬────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼────┐            ┌────▼────┐
    │ FEATURE │            │ FEATURE │
    │ 2-4 weeks│            │ 2-4 weeks│
    └────┬────┘            └────┬────┘
         │                       │
    ┌────▼────┐            ┌────▼────┐
    │  STORY  │            │  STORY  │
    │ 3-5 days│            │ 3-5 days│
    └────┬────┘            └────┬────┘
         │                       │
    ┌────▼────┐            ┌────▼────┐
    │  TASK   │            │  TASK   │
    │ 4-8 hours│           │ 4-8 hours│
    └────┬────┘            └────┬────┘
         │                       │
    ┌────▼────┐            ┌────▼────┐
    │ SUBTASK │            │ SUBTASK │
    │ 1-2 hours│           │ 1-2 hours│
    └────┬────┘            └────┬────┘
         │                       │
    ┌────▼────┐            ┌────▼────┐
    │ ATOMIC  │            │ ATOMIC  │
    │15-30 min│            │15-30 min│
    └─────────┘            └─────────┘
```

## Architecture

### Component Design

```typescript
interface UPPMCP {
  // Core services
  decomposer: TaskDecomposer;
  patternMatcher: PatternMatcher;
  sequentialThinking: SequentialThinkingClient;
  validator: UPPValidator;
  estimator: TimeEstimator;
  agentMatcher: AgentMatcher;
  
  // Storage
  patternLibrary: PatternLibrary;
  cache: DecompositionCache;
  
  // API
  tools: MCPTool[];
}
```

### Decomposition Flow

```
User Input: "Build user authentication system"
            ↓
    ┌───────────────────┐
    │ Pattern Matcher   │ ←── Check pattern library
    └────────┬──────────┘
             │ Found?
             ├─── Yes ──→ Return cached (500 tokens)
             │
             └─── No
                  ↓
    ┌───────────────────┐
    │ Complexity Analyzer│ ←── Determine starting level
    └────────┬──────────┘
             ↓
    ┌───────────────────┐
    │Sequential Thinking│ ←── Intelligent breakdown
    └────────┬──────────┘
             ↓
    ┌───────────────────┐
    │  UPP Validator    │ ←── Ensure hierarchy rules
    └────────┬──────────┘
             ↓
    ┌───────────────────┐
    │  Time Estimator   │ ←── Add time estimates
    └────────┬──────────┘
             ↓
    ┌───────────────────┐
    │  Agent Matcher    │ ←── Assign to agents
    └────────┬──────────┘
             ↓
    ┌───────────────────┐
    │  Pattern Saver    │ ←── Cache for reuse
    └────────┬──────────┘
             ↓
         Output to User
```

## Core Components

### 1. Pattern Matcher

```typescript
class PatternMatcher {
  async findSimilar(input: string): Promise<Pattern | null> {
    // Semantic similarity search
    const embedding = await this.embed(input);
    const candidates = await this.patternLibrary.search(embedding, {
      threshold: 0.85,  // 85% similarity required
      limit: 5
    });
    
    // Verify applicability
    for (const candidate of candidates) {
      if (await this.isApplicable(input, candidate)) {
        return this.adapt(candidate, input);
      }
    }
    
    return null;
  }
  
  private async isApplicable(input: string, pattern: Pattern): boolean {
    // Check context compatibility
    const inputContext = await this.extractContext(input);
    const patternContext = pattern.context;
    
    return this.contextMatches(inputContext, patternContext);
  }
}
```

### 2. Complexity Analyzer

```typescript
class ComplexityAnalyzer {
  analyze(input: string): UPPLevel {
    const indicators = {
      epic: [
        /system|platform|infrastructure/i,
        /multiple\s+months/i,
        /entire|complete|full/i
      ],
      feature: [
        /implement|build|create/i,
        /module|component|service/i,
        /weeks?\s+of\s+work/i
      ],
      story: [
        /add|update|modify/i,
        /user\s+can|as\s+a\s+user/i,
        /days?\s+of\s+work/i
      ],
      task: [
        /fix|refactor|optimize/i,
        /specific|particular/i,
        /hours?\s+of\s+work/i
      ]
    };
    
    // Score each level
    const scores = Object.entries(indicators).map(([level, patterns]) => ({
      level,
      score: patterns.filter(p => p.test(input)).length
    }));
    
    // Return highest scoring level
    return scores.sort((a, b) => b.score - a.score)[0].level as UPPLevel;
  }
}
```

### 3. Sequential Thinking Integration

```typescript
class SequentialThinkingIntegration {
  async decompose(input: string, level: UPPLevel): Promise<Decomposition> {
    const prompt = this.buildPrompt(input, level);
    
    // Use Sequential Thinking for intelligent breakdown
    const response = await this.sequentialThinking.think({
      prompt,
      constraints: {
        format: 'upp-hierarchy',
        maxDepth: this.getDepth(level),
        timeEstimates: true,
        agentAssignment: true
      }
    });
    
    return this.parseResponse(response);
  }
  
  private buildPrompt(input: string, level: UPPLevel): string {
    return `
      Decompose this ${level}: "${input}"
      
      Follow UPP hierarchy:
      - Epic: 3-6 months, major feature area
      - Feature: 2-4 weeks, complete functionality
      - Story: 3-5 days, user-facing capability
      - Task: 4-8 hours, developer work item
      - Subtask: 1-2 hours, specific implementation
      - Atomic: 15-30 minutes, single action
      
      For each item provide:
      1. Clear description
      2. Acceptance criteria
      3. Time estimate
      4. Suggested agent (from MosAIc personas)
      5. Dependencies
    `;
  }
}
```

### 4. UPP Validator

```typescript
class UPPValidator {
  validate(decomposition: Decomposition): ValidationResult {
    const rules = {
      hierarchy: this.checkHierarchy(decomposition),
      timeEstimates: this.checkTimeEstimates(decomposition),
      completeness: this.checkCompleteness(decomposition),
      dependencies: this.checkDependencies(decomposition),
      agentCapabilities: this.checkAgentMatch(decomposition)
    };
    
    const errors = Object.entries(rules)
      .filter(([_, result]) => !result.valid)
      .map(([rule, result]) => ({ rule, ...result }));
    
    return {
      valid: errors.length === 0,
      errors,
      warnings: this.getWarnings(decomposition)
    };
  }
  
  private checkTimeEstimates(decomposition: Decomposition): RuleResult {
    const limits = {
      epic: { min: 60, max: 180 },      // days
      feature: { min: 10, max: 30 },    // days
      story: { min: 3, max: 5 },        // days
      task: { min: 0.5, max: 1 },       // days
      subtask: { min: 1, max: 2 },      // hours
      atomic: { min: 0.25, max: 0.5 }   // hours
    };
    
    // Validate each level's estimates
    return this.validateEstimates(decomposition, limits);
  }
}
```

### 5. Agent Matcher

```typescript
class AgentMatcher {
  async assignAgents(decomposition: Decomposition): Promise<Decomposition> {
    const agentPool = await this.loadAgentPersonas();
    
    // Match based on task requirements and agent capabilities
    for (const item of decomposition.allItems()) {
      const requirements = this.extractRequirements(item);
      const bestAgent = this.findBestMatch(requirements, agentPool);
      
      item.assignedAgent = bestAgent;
      item.assignmentReason = this.explainMatch(requirements, bestAgent);
    }
    
    // Balance workload
    return this.balanceWorkload(decomposition);
  }
  
  private findBestMatch(requirements: Requirements, agents: Agent[]): Agent {
    const scores = agents.map(agent => ({
      agent,
      score: this.calculateMatchScore(requirements, agent)
    }));
    
    return scores.sort((a, b) => b.score - a.score)[0].agent;
  }
}
```

## Pattern Library Design

### Pattern Structure

```yaml
pattern:
  id: "auth-system-rest-api-v3"
  name: "REST API Authentication System"
  description: "Complete auth system with JWT, OAuth, and 2FA"
  
  metadata:
    created: "2025-08-03"
    usage_count: 47
    success_rate: 0.94
    average_token_savings: 36700
    tags: ["auth", "api", "security", "user-management"]
    
  context:
    tech_stack: ["nodejs", "express", "postgresql", "redis"]
    prerequisites: ["database-setup", "redis-cache"]
    constraints: ["GDPR-compliant", "SOC2-ready"]
    
  decomposition:
    epic:
      name: "User Authentication System"
      estimate: "3 months"
      features:
        - name: "User Registration"
          estimate: "2 weeks"
          stories: [...]
        - name: "Authentication Flow"
          estimate: "3 weeks"
          stories: [...]
        - name: "Security Features"
          estimate: "2 weeks"
          stories: [...]
          
  variations:
    - id: "auth-graphql"
      name: "GraphQL variant"
      diff: "Replace REST endpoints with GraphQL mutations"
    - id: "auth-microservice"
      name: "Microservice variant"
      diff: "Separate auth service with gRPC"
```

### Pattern Learning

```typescript
class PatternLearner {
  async learn(decomposition: Decomposition, feedback: Feedback): Promise<void> {
    // Extract pattern from successful decomposition
    const pattern = this.extractPattern(decomposition);
    
    // Generalize for reuse
    const generalized = this.generalize(pattern, feedback);
    
    // Test against existing patterns
    const similarity = await this.checkSimilarity(generalized);
    
    if (similarity < 0.7) {
      // New pattern
      await this.patternLibrary.add(generalized);
    } else {
      // Update existing pattern
      await this.patternLibrary.merge(generalized, similarity.pattern);
    }
  }
}
```

## Tool Definitions

### 1. /plan Command

```typescript
const planTool: MCPTool = {
  name: "plan",
  description: "Decompose a requirement using UPP hierarchy",
  
  parameters: {
    requirement: {
      type: "string",
      description: "The requirement to decompose"
    },
    level: {
      type: "string",
      enum: ["auto", "epic", "feature", "story", "task"],
      default: "auto",
      description: "Starting level for decomposition"
    },
    usePatterns: {
      type: "boolean",
      default: true,
      description: "Check pattern library first"
    },
    project: {
      type: "string",
      description: "Project context for decomposition"
    }
  },
  
  handler: async (params) => {
    if (params.usePatterns) {
      const pattern = await patternMatcher.find(params.requirement);
      if (pattern) {
        return adaptPattern(pattern, params);
      }
    }
    
    return await uppDecomposer.decompose(params);
  }
};
```

### 2. /pattern Command

```typescript
const patternTool: MCPTool = {
  name: "pattern",
  description: "Manage decomposition patterns",
  
  subcommands: {
    save: {
      description: "Save current decomposition as pattern",
      handler: async (name: string) => {
        const current = await getCurrentDecomposition();
        return await patternLibrary.save(current, name);
      }
    },
    
    list: {
      description: "List available patterns",
      handler: async (filter?: string) => {
        return await patternLibrary.list(filter);
      }
    },
    
    apply: {
      description: "Apply pattern to new requirement",
      handler: async (patternId: string, requirement: string) => {
        const pattern = await patternLibrary.get(patternId);
        return await adaptPattern(pattern, requirement);
      }
    }
  }
};
```

### 3. /estimate Command

```typescript
const estimateTool: MCPTool = {
  name: "estimate",
  description: "Estimate time for tasks",
  
  parameters: {
    items: {
      type: "array",
      description: "Items to estimate"
    },
    confidence: {
      type: "boolean",
      default: false,
      description: "Include confidence intervals"
    }
  },
  
  handler: async (params) => {
    const estimates = await timeEstimator.batch(params.items);
    
    if (params.confidence) {
      return addConfidenceIntervals(estimates);
    }
    
    return estimates;
  }
};
```

## Integration Examples

### With Plane.so

```typescript
// After decomposition, sync to Plane.so
const syncToPlan = async (decomposition: Decomposition) => {
  const planeClient = new PlaneClient();
  
  // Create project structure
  for (const epic of decomposition.epics) {
    const project = await planeClient.createProject({
      name: epic.name,
      description: epic.description,
      lead: epic.assignedAgent
    });
    
    // Create issues hierarchy
    for (const feature of epic.features) {
      await planeClient.createIssue({
        project: project.id,
        type: 'feature',
        title: feature.name,
        parent: epic.id
      });
    }
  }
};
```

### With Context7

```typescript
// Enhance decomposition with documentation
const enhanceWithDocs = async (decomposition: Decomposition) => {
  const context7 = new Context7Client();
  
  for (const atomic of decomposition.getAtomicTasks()) {
    // Find relevant documentation
    const docs = await context7.search({
      query: atomic.description,
      libraries: atomic.techStack
    });
    
    atomic.documentation = docs.top(3);
    atomic.codeExamples = docs.examples();
  }
};
```

## Success Metrics

### Token Reduction
- Pattern cache hit rate: >60% after 3 months
- Average tokens per decomposition: <5,000 (vs 37,200 baseline)
- Cumulative token savings: Track monthly

### Quality Metrics
- Decomposition acceptance rate: >90%
- Agent assignment accuracy: >85%
- Time estimate accuracy: ±20%

### Usage Metrics
- Daily decompositions: Track growth
- Pattern contributions: Team participation
- Cross-project reuse: Pattern effectiveness

## Configuration

```yaml
upp:
  sequential_thinking:
    enabled: true
    model: "claude-3-opus"
    max_tokens: 5000
    
  patterns:
    enabled: true
    similarity_threshold: 0.85
    auto_save: true
    share_mode: "team"
    
  validation:
    strict: true
    time_estimates: "required"
    agent_assignment: "suggested"
    
  hierarchy:
    epic:
      min_duration: "2 months"
      max_duration: "6 months"
      max_features: 8
      
    feature:
      min_duration: "2 weeks"
      max_duration: "4 weeks"
      max_stories: 12
      
    story:
      min_duration: "3 days"
      max_duration: "5 days"
      max_tasks: 8
      
  agents:
    pool: "mosaic-personas"
    load_balancing: true
    skill_matching: true
```

## Next Steps

1. Implement core pattern matching algorithm
2. Create Sequential Thinking integration
3. Build UPP validation rules engine
4. Design pattern storage schema
5. Create time estimation model
6. Test with real decomposition scenarios

---

The UPP MCP is the brain of MosAIc's planning system, turning vague requirements into perfectly structured, token-efficient task hierarchies that teams can execute with confidence.