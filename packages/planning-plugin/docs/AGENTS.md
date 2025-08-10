# MosAIc Planning Plugin - Agent Architecture

## Overview

The MosAIc Planning Plugin implements a modular agent system where each business and technical planning function is handled by a specialized `upp-*-*-local` agent. These agents follow the established pattern from `upp-epic-planner-local` and use local Ollama models for cost-effective processing.

## Agent Architecture Pattern

All agents follow this consistent pattern:
- **Focused responsibility**: Each agent handles ONE specific planning domain
- **Local processing**: Uses Ollama models (llama3.2:1b, llama3.2:3b) for speed and cost efficiency
- **Standardized output**: Produces structured, machine-readable results
- **Fallback mechanisms**: Reliable operation even when Ollama is unavailable
- **CLAUDE.md compliance**: Follows all established standards and naming conventions

## Required Agents

### 1. `upp-business-planner-local`
**Purpose**: Top-level business strategy and vision planning  
**Input**: Project description, market context, stakeholder requirements  
**Output**: Strategic framework, business priorities, success metrics  
**Dependencies**: None (root agent)  
**Blocks**: All other agents until business strategy is defined  

**Key Functions**:
- Business viability assessment  
- Strategic priority definition  
- Success metrics and KPIs  
- Risk tolerance and constraints  
- Stakeholder alignment  

### 2. `upp-financial-planner-local`
**Purpose**: Revenue models and cost analysis with AI development factors  
**Input**: Business strategy, market data, development approach  
**Output**: Financial projections, cost models, budget constraints  
**Dependencies**: `upp-business-planner-local`  
**Blocks**: `upp-release-planner-local`  

**Key Functions**:
- Revenue model analysis (SaaS, one-time, hybrid)  
- AI-assisted development cost multipliers  
- Break-even analysis and funding requirements  
- ROI projections for different release strategies  
- Budget allocation recommendations  

### 3. `upp-marketing-planner-local`  
**Purpose**: Marketing strategy and go-to-market planning  
**Input**: Business strategy, target market, competitive landscape  
**Output**: Marketing strategy, positioning, messaging framework  
**Dependencies**: `upp-business-planner-local`  
**Blocks**: None (parallel execution with other agents)  

**Key Functions**:
- Go-to-market strategy  
- Brand positioning and messaging  
- Channel strategy and partnerships  
- Content marketing roadmap  
- Community building approach  

### 4. `upp-release-planner-local` ⭐ **CRITICAL SCOPE CONTROL AGENT**
**Purpose**: Release planning and semver strategy - THE KEY SCOPE CONTROL MECHANISM  
**Input**: Business strategy, financial constraints, feature requirements  
**Output**: Release roadmap, semver strategy, feature gates, scope boundaries  
**Dependencies**: `upp-business-planner-local`, `upp-financial-planner-local`  
**Blocks**: `upp-epic-planner-local`, `upp-tech-architecture-local`  

**Key Functions**:
- **MVP definition and scope boundaries**  
- **Semver-based release roadmap (v1.0.0, v1.1.0, v2.0.0)**  
- **Feature prioritization and gates**  
- Release timeline and dependencies  
- **PREVENTS "build everything at once" mentality**  

### 5. `upp-tech-architecture-local`
**Purpose**: Technology architecture and stack decisions  
**Input**: Business requirements, release constraints, scalability needs  
**Output**: Technology stack, architecture decisions, integration strategy  
**Dependencies**: `upp-release-planner-local`  
**Blocks**: None  

**Key Functions**:
- Technology stack selection based on business constraints  
- Scalability and cost analysis  
- Integration and API strategy  
- Development toolchain recommendations  
- Infrastructure and deployment approach  

### 6. `upp-epic-planner-local` (Existing - Enhanced)
**Purpose**: Technical task decomposition (Epic → Atomic) constrained by release scope  
**Input**: Release roadmap, feature scope for current version  
**Output**: Technical epics ONLY for current release scope  
**Dependencies**: `upp-release-planner-local`  
**Blocks**: None  

**Enhanced Functions**:
- **Scope-constrained epic generation** (only current release)  
- Integration with release roadmap  
- Epic categorization following CLAUDE.md standards  
- Time estimation aligned with release timeline  

## Additional Specialized Agents (Future Expansion)

### `upp-legal-compliance-local`
**Purpose**: Legal, regulatory, and compliance planning  
**Dependencies**: `upp-business-planner-local`  
**Key Functions**: HIPAA, GDPR, SOC2, IP considerations  

### `upp-operations-planner-local`  
**Purpose**: Infrastructure, monitoring, and operational planning  
**Dependencies**: `upp-tech-architecture-local`  
**Key Functions**: DevOps, monitoring, incident response, scaling  

### `upp-social-media-planner-local`
**Purpose**: Social media strategy and platform planning  
**Dependencies**: `upp-marketing-planner-local`  
**Key Functions**: Platform selection, content calendar, community engagement  

## Agent Integration Flow

```
Business Strategy (Root)
├── Financial Planning → Release Planning → Epic Planning
├── Marketing Planning → Social Media Planning  
└── Release Planning → Tech Architecture Planning
```

## Command-Agent Mapping

| Command | Agent | Purpose |
|---------|-------|---------|
| `/plan-business` | `upp-business-planner-local` | Business strategy |
| `/plan-financial` | `upp-financial-planner-local` | Financial modeling |
| `/plan-marketing` | `upp-marketing-planner-local` | Marketing strategy |
| `/plan-release` | `upp-release-planner-local` | **SCOPE CONTROL** |
| `/plan-tasks` | `upp-epic-planner-local` | Technical decomposition |
| `/plan-tech` | `upp-tech-architecture-local` | Technology decisions |

## Implementation Priority

1. **Core Infrastructure** (v0.1.0)
   - State tracking and dependency management
   - Command framework

2. **Critical Path Agents** (v0.2.0)
   - `upp-business-planner-local`
   - `upp-release-planner-local` (CRITICAL for scope control)
   - Enhanced `upp-epic-planner-local`

3. **Supporting Agents** (v0.3.0)
   - `upp-financial-planner-local`
   - `upp-marketing-planner-local`
   - `upp-tech-architecture-local`

4. **Specialized Agents** (v0.4.0+)
   - Legal, operations, social media agents

## Quality Standards

Every agent must:
- ✅ Follow CLAUDE.md naming conventions
- ✅ Use local Ollama models for processing
- ✅ Produce structured, validated output
- ✅ Include comprehensive fallback mechanisms
- ✅ Support dependency-aware execution
- ✅ Maintain state through the StateTracker
- ✅ Include proper error handling and logging
- ✅ Follow the focused, single-responsibility pattern

## Testing Requirements

Each agent requires:
- Unit tests for core logic
- Integration tests with dependency system
- Performance tests with local Ollama models
- Fallback mechanism validation
- Output format validation
- Real-world scenario testing (like Sage PHR project)

This agent architecture ensures proper separation of concerns while maintaining the critical dependency flow that prevents scope creep through the release planning agent.