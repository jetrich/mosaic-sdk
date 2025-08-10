# Agent Quick Reference - E.200 OpenCode Integration

## 🚀 Your Mission Start Checklist

### 1. Read Your Briefing
```bash
# Your specific assignment
cat .mosaic/AGENT-CONTEXT/current-feature.md

# Overall mission status  
cat .mosaic/ACTIVE-EPIC.md

# Current tasks
cat .mosaic/AGENT-CONTEXT/current-tasks.md
```

### 2. Understand Your Role
- **Planning Agents** (Opus): Deep analysis, architecture, strategy
- **Implementation Agents** (Sonnet): Code, build, test, document
- **Your Persona**: Check AGENT-ASSIGNMENTS.md for your character

### 3. Know Your Task
- **Task ID**: Find in current-tasks.md
- **Dependencies**: Check dependencies.md
- **Output Location**: Specified in your task
- **Success Criteria**: Listed in context files

## 📍 Key Locations

### Documentation
```
docs/
├── task-management/
│   ├── planning/E.200-OPENCODE-TUI/    # Plans & specs
│   └── active/E.200/                   # Your outputs
└── architecture/
    └── OPENCODE-INTEGRATION.md         # Technical architecture
```

### Code
```
packages/
├── mcp-orchestrator/     # MCP server (Benjamin)
├── opencode-adapter/     # Integration (Felix)
└── shared-tokens/        # Design tokens (Fiona)

worktrees/
└── opencode/            # OpenCode source (READ ONLY!)
```

### Status & Context
```
.mosaic/
├── ACTIVE-EPIC.md              # Mission overview
├── INTEGRATION-STATUS.md       # Live progress
└── AGENT-CONTEXT/
    ├── current-feature.md      # Your assignment
    ├── current-tasks.md        # Task queue
    └── dependencies.md         # Blockers
```

## 🔧 Common Commands

### Status Updates
```bash
# Check your assignment
grep -A5 "Your Assignment" .mosaic/AGENT-CONTEXT/current-feature.md

# View integration progress
cat .mosaic/INTEGRATION-STATUS.md | grep -A10 "Active Tasks"

# Check dependencies
cat .mosaic/AGENT-CONTEXT/dependencies.md | grep -A5 "Immediate Blockers"
```

### Research Tasks
```bash
# Analyze OpenCode MCP
cd worktrees/opencode
find . -name "*.ts" -path "*/mcp/*" | head -20

# Search for patterns
grep -r "experimental_createMCPClient" --include="*.ts"
```

### Documentation Tasks
```bash
# Find files to update
cat docs/task-management/planning/E.200-OPENCODE-TUI/DOCUMENTATION-UPDATES.md

# Check current content
head -50 README.md
grep -n "OpenCode" CLAUDE.md
```

## 📝 Output Templates

### Research Report
```markdown
# [Topic] Analysis - Task [ID]

## Executive Summary
[Key findings in 3-5 bullets]

## Technical Details
[Detailed analysis]

## Integration Strategy
[How to integrate with MosAIc]

## Risks & Mitigations
[Identified risks and solutions]

## Recommendations
[Next steps]
```

### Handoff Document
```markdown
# Task Handoff - [Task ID]

## From: [Your Agent Name]
## To: [Next Agent Name]
## Date: [Date/Time]

### Completed Work
- [What you did]
- [Key decisions]
- [Files created/modified]

### Remaining Work  
- [What's left]
- [Open questions]
- [Blockers]

### Key Findings
[Important discoveries]

### Files
- Created: [paths]
- Modified: [paths]
- To Review: [paths]
```

## ⚡ Emergency Procedures

### If Blocked
1. Document the blocker in INTEGRATION-STATUS.md
2. Try alternative approach for 30 minutes
3. Escalate if still blocked
4. Find parallel work if possible

### If Confused
1. Re-read your context files
2. Check the architecture doc
3. Review similar completed tasks
4. Ask for clarification (escalate to Tony)

### If You Find Issues
1. Document immediately
2. Assess impact
3. Propose solution
4. Escalate if critical

## 🎯 Success Criteria

### For ALL Tasks
- [ ] Read context before starting
- [ ] Output in specified location
- [ ] Follow naming conventions
- [ ] Update status when done
- [ ] Create handoff document

### Quality Standards
- [ ] Code: ESLint clean, TypeScript strict
- [ ] Docs: Clear, accurate, complete
- [ ] Tests: >95% coverage
- [ ] Performance: Meet targets

## 💬 Communication

### Daily Sync Points
- **09:00**: Status check
- **13:00**: Blocker review  
- **17:00**: