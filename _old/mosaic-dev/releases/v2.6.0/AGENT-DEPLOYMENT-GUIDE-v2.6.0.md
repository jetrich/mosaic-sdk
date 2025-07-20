# Tony v2.6.0 Agent Deployment Guide

**Purpose**: Step-by-step guide for deploying Sonnet agents to implement v2.6.0 features  
**Duration**: ~26 hours of agent work across multiple sessions  
**Model**: Claude 3 Sonnet (optimized for coding)  

## 🎯 Overview

This guide coordinates the deployment of specialized Sonnet agents to implement Tony Framework v2.6.0 enhancements. Each agent handles atomic tasks (5-30 minutes) for maximum efficiency.

## 🤖 Agent Deployment Commands

### Step 1: Prepare Implementation
```bash
cd /home/jwoltje/src/tony-ng
./tony/scripts/coordinate-v2.6-implementation.sh plan
```

### Step 2: Deploy Wave 1 Agents (Parallel)

Deploy these three agents in separate Claude sessions simultaneously:

#### Architecture Agent
```bash
# New Claude session with Sonnet model
claude --model sonnet

# In the session:
cd /home/jwoltje/src/tony-ng
cat tony/.tony/agents/architecture-agent/instructions-T.001.01.01.01.md

# Agent implements plugin interface design (30 min)
```

#### Version Agent  
```bash
# New Claude session with Sonnet model
claude --model sonnet

# In the session:
cd /home/jwoltje/src/tony-ng
cat tony/.tony/agents/version-agent/instructions-T.001.02.01.01.md

# Agent implements version detection (30 min)
```

#### Command Agent
```bash
# New Claude session with Sonnet model
claude --model sonnet

# In the session:
cd /home/jwoltje/src/tony-ng
cat tony/.tony/agents/command-agent/instructions-T.001.03.01.01.md

# Agent implements command wrapper (30 min)
```

### Step 3: Monitor Progress
```bash
./tony/scripts/coordinate-v2.6-implementation.sh monitor
```

### Step 4: Deploy Next Tasks

After each agent completes their task, assign the next one:

```bash
# For architecture-agent:
cat tony/.tony/agents/architecture-agent/instructions-T.001.01.01.02.md

# For version-agent:
cat tony/.tony/agents/version-agent/instructions-T.001.02.01.02.md

# Continue with sequential tasks...
```

## 📋 Task Assignment Schedule

### Phase 1: Foundation (Day 1)

| Time | Agent | Task | Description |
|------|-------|------|-------------|
| 09:00 | architecture-agent | T.001.01.01.01 | Plugin interface design |
| 09:00 | version-agent | T.001.02.01.01 | Version detection |
| 09:00 | command-agent | T.001.03.01.01 | Command wrapper |
| 09:30 | architecture-agent | T.001.01.01.02 | Plugin loader |
| 09:30 | version-agent | T.001.02.01.02 | Version comparison |
| 09:30 | command-agent | T.001.03.01.02 | Delegation logic |
| 10:00 | architecture-agent | T.001.01.02.01 | Plugin registry |
| 10:00 | version-agent | T.001.02.02.01 | Upgrade analyzer |
| 10:00 | command-agent | T.001.03.02.01 | Hook system |

### Phase 2: Intelligence (Day 2)

| Time | Agent | Task | Description |
|------|-------|------|-------------|
| 09:00 | innovation-agent | T.002.01.01.01 | Pattern scanner |
| 09:30 | innovation-agent | T.002.01.01.02 | Comparison system |
| 10:00 | innovation-agent | T.002.01.02.01 | Scoring algorithm |
| 10:30 | signal-agent | T.002.02.01.01 | Signal file system |
| 11:00 | signal-agent | T.002.02.01.02 | Signal watcher |

## 🔧 Agent Instructions Template

Each agent receives specific instructions in this format:

```markdown
# Agent: [name]
# Task: [ID] - [Description]
# Duration: 30 minutes maximum

## Context
[Specific implementation context]

## Your Capabilities
- You are a Sonnet model optimized for coding
- Focus on implementation, not planning
- Complete within time limit
- Follow existing patterns

## Objectives
1. [Specific objective]
2. [Specific objective]
3. [Specific objective]

## Files to Create/Modify
- path/to/file1.ts
- path/to/file2.sh

## Success Criteria
- [ ] Implementation complete
- [ ] Tests passing
- [ ] Documentation updated
- [ ] No breaking changes
```

## 📊 Progress Tracking

### Real-time Monitoring
```bash
# Watch agent progress
watch -n 30 "./tony/scripts/coordinate-v2.6-implementation.sh monitor"
```

### Task Completion Checklist

#### Wave 1 (Parallel)
- [ ] T.001.01.01.01 - Plugin interface design
- [ ] T.001.01.01.02 - Plugin loader system
- [ ] T.001.01.02.01 - Plugin registry
- [ ] T.001.01.02.02 - Hot-reload capability
- [ ] T.001.02.01.01 - Version detection
- [ ] T.001.02.01.02 - Version comparison
- [ ] T.001.02.02.01 - Upgrade analyzer
- [ ] T.001.02.02.02 - Rollback mechanism
- [ ] T.001.03.01.01 - Command wrapper
- [ ] T.001.03.01.02 - Delegation logic
- [ ] T.001.03.02.01 - Hook system

#### Wave 2 (Sequential)
- [ ] T.002.01.01.01 - Pattern scanner
- [ ] T.002.01.01.02 - Comparison system
- [ ] T.002.01.02.01 - Scoring algorithm
- [ ] T.002.01.03.01 - Issue generator
- [ ] T.002.02.01.01 - Signal file system
- [ ] T.002.02.01.02 - Signal watcher
- [ ] T.002.02.02.01 - Handler system
- [ ] T.002.03.01.01 - Epic directory layout
- [ ] T.002.03.02.01 - Workspace isolation
- [ ] T.002.04.01.01 - Level 1 recovery
- [ ] T.002.04.01.02 - Level 2 recovery

## 🚀 Quick Start Commands

```bash
# 1. View the plan
cd /home/jwoltje/src/tony-ng
./tony/scripts/coordinate-v2.6-implementation.sh plan

# 2. Deploy first wave
./tony/scripts/coordinate-v2.6-implementation.sh deploy-wave1

# 3. Open 3 Claude Sonnet sessions and give each agent their task

# 4. Monitor progress
./tony/scripts/coordinate-v2.6-implementation.sh monitor

# 5. Validate completed work
./tony/scripts/coordinate-v2.6-implementation.sh validate
```

## 💡 Tips for Success

1. **Use Sonnet Model**: Optimized for coding tasks
2. **Keep Tasks Atomic**: 30 minutes or less
3. **Run Tests**: Each agent must verify their work
4. **Document Changes**: Update relevant docs
5. **Commit Frequently**: Small, focused commits

## 🎯 Expected Outcomes

After all agents complete their tasks:
- ✅ Bash automation library reducing API usage by 90%
- ✅ Plugin system for extensibility
- ✅ Three-tier version management
- ✅ Two-tier command architecture
- ✅ Innovation discovery system
- ✅ Signal-based activation
- ✅ Epic directory structure
- ✅ Emergency recovery protocols

---

Ready to deploy agents? Start with Wave 1 for maximum parallelization!