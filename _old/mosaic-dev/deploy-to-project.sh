#!/bin/bash

# Tony Framework - Manual Project Deployment Script
# Use this to manually deploy Tony infrastructure to a specific project

set -euo pipefail

# Check if we're in a project directory
if [ ! -f "package.json" ] && [ ! -f "requirements.txt" ] && [ ! -f "go.mod" ] && [ ! -f "Cargo.toml" ] && [ ! -f ".git/config" ]; then
    echo "⚠️  Warning: This doesn't appear to be a project directory"
    echo "   Consider running from a project root directory"
    echo ""
fi

PROJECT_DIR=$(pwd)
PROJECT_NAME=$(basename "$PROJECT_DIR")

echo "🤖 Tony Framework - Manual Project Deployment"
echo "=============================================="
echo "Project: $PROJECT_NAME"
echo "Directory: $PROJECT_DIR"
echo ""

# Check if user-level framework is installed
if [ ! -d "$HOME/.claude/tony" ]; then
    echo "❌ User-level Tony framework not found"
    echo "   Please install framework first in tech-lead-tony directory:"
    echo "   ./scripts/tony-install.sh --mode=install --source=local --auto-confirm"
    exit 1
fi

echo "✅ User-level framework found"

# Create project directory structure
echo "📁 Creating project directory structure..."
mkdir -p .claude/commands
mkdir -p docs/agent-management/tech-lead-tony
mkdir -p docs/agent-management/templates
mkdir -p docs/project-management
mkdir -p logs/agent-sessions
mkdir -p logs/coordination
mkdir -p scripts/automation

echo "✅ Directory structure created"

# Create project-level Tony commands
echo "📋 Creating project-level Tony commands..."
cat > .claude/commands/tony.md << 'EOF'
# Project-Level Tony Commands

**Purpose**: Project-specific Tony commands that delegate to user-level framework  
**Context**: Available in project Claude sessions for local Tony management  
**Integration**: Seamlessly integrates with user-level `/tony` commands  

## Command Implementations

### `/tony status`
**Purpose**: Show project-specific Tony status plus user-level framework status  
**Delegation**: Calls user-level status script with project context  

```bash
# Execute user-level status with project context
if [ -f "$HOME/.claude/tony/scripts/tony-status.sh" ]; then
    "$HOME/.claude/tony/scripts/tony-status.sh" --include-projects --verbose
else
    echo "❌ Tony framework not installed at user level"
    echo "   Install framework: git clone <repo> && ./install-modular.sh"
fi
```

### `/tony upgrade`
**Purpose**: Upgrade project deployment from user-level framework  
**Delegation**: Calls user-level upgrade with project migration  

```bash
# Execute user-level upgrade with project migration
if [ -f "$HOME/.claude/tony/scripts/tony-upgrade.sh" ]; then
    "$HOME/.claude/tony/scripts/tony-upgrade.sh" --hierarchy-check --include-projects
else
    echo "❌ Tony framework not installed at user level"
    echo "   Install framework first, then redeploy to project"
fi
```

### `/tony verify`
**Purpose**: Verify project-specific Tony infrastructure health  
**Delegation**: Calls user-level verify focused on this project  

```bash
# Execute user-level verification with project focus
if [ -f "$HOME/.claude/tony/scripts/tony-verify.sh" ]; then
    "$HOME/.claude/tony/scripts/tony-verify.sh" --comprehensive --include-projects
else
    echo "❌ Tony framework not installed at user level"
    echo "   Install framework to enable verification"
fi
```

### `/tony plan`
**Purpose**: Execute ultrathink planning protocol for current project  
**Delegation**: Calls user-level ATHMS planning system  
**Documentation**: All planning documents stored in docs/task-management/planning/ (consistent across projects)

```bash
# Execute user-level ATHMS planning with project context
# All planning documents are stored in docs/task-management/planning/ for consistency
if [ -f "$HOME/.claude/tony/scripts/tony-tasks.sh" ]; then
    "$HOME/.claude/tony/scripts/tony-tasks.sh" "$@"
else
    echo "❌ Tony framework not installed at user level"
    echo "   Install framework to enable ATHMS planning"
fi
```

### `/tony task`
**Purpose**: Execute task management operations for current project  
**Delegation**: Calls user-level ATHMS task system  

```bash
# Execute user-level ATHMS task management with project context
if [ -f "$HOME/.claude/tony/scripts/tony-tasks.sh" ]; then
    "$HOME/.claude/tony/scripts/tony-tasks.sh" "$@"
else
    echo "❌ Tony framework not installed at user level"
    echo "   Install framework to enable ATHMS task management"
fi
```

### `/tony backup`
**Purpose**: Create comprehensive ATHMS state backup for current project  
**Delegation**: Calls user-level ATHMS backup system  

```bash
# Execute user-level ATHMS backup with project context
if [ -f "$HOME/.claude/tony/scripts/tony-tasks.sh" ]; then
    "$HOME/.claude/tony/scripts/tony-tasks.sh" backup
else
    echo "❌ Tony framework not installed at user level"
    echo "   Install framework to enable ATHMS backup"
fi
```

### `/tony restore`
**Purpose**: Restore ATHMS state from backup for current project  
**Delegation**: Calls user-level ATHMS restoration system  

```bash
# Execute user-level ATHMS restore with project context
if [ -f "$HOME/.claude/tony/scripts/tony-tasks.sh" ]; then
    "$HOME/.claude/tony/scripts/tony-tasks.sh" restore "$@"
else
    echo "❌ Tony framework not installed at user level"
    echo "   Install framework to enable ATHMS restore"
fi
```

### `/tony validate`
**Purpose**: Validate and repair ATHMS state integrity for current project  
**Delegation**: Calls user-level ATHMS validation system  

```bash
# Execute user-level ATHMS validation with project context
if [ -f "$HOME/.claude/tony/scripts/tony-tasks.sh" ]; then
    "$HOME/.claude/tony/scripts/tony-tasks.sh" validate
else
    echo "❌ Tony framework not installed at user level"
    echo "   Install framework to enable ATHMS validation"
fi
```

### `/tony emergency`
**Purpose**: Execute emergency ATHMS recovery protocol for current project  
**Delegation**: Calls user-level ATHMS emergency recovery system  

```bash
# Execute user-level ATHMS emergency recovery with project context
if [ -f "$HOME/.claude/tony/scripts/tony-tasks.sh" ]; then
    "$HOME/.claude/tony/scripts/tony-tasks.sh" emergency
else
    echo "❌ Tony framework not installed at user level"
    echo "   Install framework to enable ATHMS emergency recovery"
fi
```

### `/tony dashboard`
**Purpose**: Comprehensive system health monitoring dashboard  
**Delegation**: Calls user-level health monitoring system  

```bash
# Execute user-level system health dashboard
if [ -f "$HOME/.claude/tony/scripts/tony-dashboard.sh" ]; then
    "$HOME/.claude/tony/scripts/tony-dashboard.sh" "$@"
else
    echo "❌ Tony framework not installed at user level"
    echo "   Install framework to enable health monitoring"
fi
```

### `/tony logs`
**Purpose**: Show recent Tony activity for this project  
**Implementation**: Local project log aggregation  

```bash
# Show project-specific Tony logs
echo "📋 Recent Tony Activity for $(basename $(pwd))"
echo "============================================="

# ATHMS task management logs
if [ -d "docs/task-management/logs" ]; then
    echo ""
    echo "📋 ATHMS Task Management:"
    tail -10 docs/task-management/logs/*.log 2>/dev/null | head -20
fi

# Coordination logs
if [ -f "logs/coordination/coordination-status.log" ]; then
    echo ""
    echo "🔧 Coordination Status:"
    tail -10 logs/coordination/coordination-status.log
fi

# Agent session logs
if [ -d "logs/agent-sessions" ]; then
    echo ""
    echo "🤖 Recent Agent Activity:"
    find logs/agent-sessions -name "*.log" -type f -exec tail -5 {} \; 2>/dev/null | tail -20
fi

# Tony scratchpad updates
if [ -f "docs/agent-management/tech-lead-tony/scratchpad.md" ]; then
    echo ""
    echo "📝 Scratchpad Status:"
    grep -E "IMMEDIATE|NEXT.*MINUTES|URGENT|CRITICAL" docs/agent-management/tech-lead-tony/scratchpad.md | tail -5
fi
```

---

**Integration Note**: These project-level commands provide seamless access to Tony functionality while maintaining the separation between user-level framework management and project-specific operations.
EOF

echo "✅ Project-level Tony commands created"

# Create engage command
echo "📋 Creating engage command for session continuity..."
cat > .claude/commands/engage.md << 'EOF'
# Tony Engagement Protocol - Zero Data Loss Session Handoff

## STEP 1: Identity & Role Confirmation
I am Tech Lead Tony. I coordinate agents, provide infrastructure, and monitor progress.
I do NOT code directly - I delegate to specialized agents per CLAUDE.md instructions.
Current session starting with zero data loss handoff protocol.

## STEP 2: Project Context Recovery
Read: ./CLAUDE.md (Project instructions)
Read: ~/.claude/CLAUDE.md (Global instructions)
Read: docs/project-management/MASTER_TASK_LIST.md
Read: README.md (Project overview)

## STEP 3: Session Context Recovery (MANDATORY)
Read: docs/agent-management/tech-lead-tony/scratchpad.md

## STEP 4: Agent Status Assessment
ps aux | grep "claude -p" | grep -v grep
tail -20 logs/coordination/coordination-status.log
grep -i "critical\|urgent\|blocked\|error" logs/agent-sessions/*.log | tail -10

## STEP 5: Immediate Priorities Identification
grep -A10 "IMMEDIATE\|NEXT.*MINUTES\|URGENT\|CRITICAL" docs/agent-management/tech-lead-tony/scratchpad.md

## Context Validation Complete ✅
Ready to proceed with agent coordination.
EOF

echo "✅ Engage command created"

# Create initial scratchpad
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_TIME=$(date +%H:%M)

cat > docs/agent-management/tech-lead-tony/scratchpad.md << EOF
# TECH LEAD TONY SESSION SCRATCHPAD

**Session Date**: $CURRENT_DATE
**Session Start**: $CURRENT_TIME UTC
**Current Status**: Manual Infrastructure Deployment
**Phase**: 1 - Project Setup & Planning
**Project**: $PROJECT_NAME
**Project Type**: Auto-detected during deployment
**Tech Stack**: To be determined

## CRITICAL ALERTS & IMMEDIATE ACTIONS REQUIRED

### 🎯 INFRASTRUCTURE DEPLOYED
- **Status**: **PROJECT INFRASTRUCTURE READY** - Tony v2.0 deployed manually
- **Next Actions**: Begin project analysis and agent coordination
- **Setup Method**: Manual deployment script

## ACTIVE AGENT DELEGATION

### 🔍 Current Agent Status
*No agents currently active - use this section to track launched agents*

## PHASE STATUS

### ✅ COMPLETED TASKS
- Tony project infrastructure deployment ✅
- Directory structure creation ✅
- Project-level command system ✅
- Session continuity protocols ✅

### 🔄 IN PROGRESS TASKS
*Track active tasks here*

### ⏳ PENDING TASKS
1. Project type detection and analysis
2. Master task list creation
3. Agent coordination strategy planning
4. Initial task decomposition

## INFRASTRUCTURE STATUS

### ✅ PROJECT INFRASTRUCTURE COMPLETE
- **Project-level commands** - /tony commands available in project
- **Session continuity** - /engage command for zero data loss handoffs
- **Directory structure** - Standard Tony project organization
- **Integration** - Connected to user-level framework v2.0

### 📁 KEY DOCUMENTATION LOCATIONS
- **Master Task List**: docs/project-management/MASTER_TASK_LIST.md ⚠️ *Create if needed*
- **Tony Scratchpad**: docs/agent-management/tech-lead-tony/scratchpad.md ✅
- **Session Continuity**: .claude/commands/engage.md ✅
- **Agent Logs**: logs/agent-sessions/ ✅
- **Coordination Logs**: logs/coordination/ ✅

## PROJECT CONTEXT

### 🔍 Project Analysis (To be completed)
- **Type**: To be detected
- **Technology**: To be analyzed
- **Structure**: $(ls -la | wc -l) items in root directory
- **Git Repository**: $(git remote get-url origin 2>/dev/null || echo "Local repository or no git")

---

**Last Updated**: $CURRENT_DATE $CURRENT_TIME UTC
**Next Review**: $(date -d "+30 minutes" +"%Y-%m-%d %H:%M UTC")
**Session Handoff Readiness**: ✅ Ready for Tony session transfer
**Manual Deployment**: ✅ Project infrastructure deployed successfully
EOF

echo "✅ Initial scratchpad created"

# Create coordination status log
mkdir -p logs/coordination
cat > logs/coordination/coordination-status.log << EOF
$(date): Tony Project Infrastructure Manual Deployment Complete
Project: $PROJECT_NAME
Infrastructure: All systems deployed and ready
Status: Ready for agent coordination
Deployment: Manual deployment script v2.0

Next Actions:
1. Detect project type and technology stack
2. Create/update MASTER_TASK_LIST.md with project analysis
3. Launch analysis agents for project assessment
4. Begin atomic task decomposition
5. Establish concurrent agent coordination

Manual Deployment: ✅ Project infrastructure ready
Session Continuity: ✅ /engage command available
Agent Management: ✅ Templates and infrastructure deployed
User Framework: ✅ Connected to user-level Tony v2.0
EOF

echo "✅ Coordination monitoring initialized"

# Detect project type
PROJECT_TYPE="Generic"
TECH_STACK="Multi-language"

if [ -f "package.json" ]; then
    PROJECT_TYPE="Node.js"
    TECH_STACK="JavaScript/TypeScript"
elif [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
    PROJECT_TYPE="Python" 
    TECH_STACK="Python"
elif [ -f "go.mod" ]; then
    PROJECT_TYPE="Go"
    TECH_STACK="Go"
elif [ -f "Cargo.toml" ]; then
    PROJECT_TYPE="Rust"
    TECH_STACK="Rust"
fi

echo "✅ Project type detected: $PROJECT_TYPE ($TECH_STACK)"

# Update scratchpad with detected info
sed -i "s/Project Type**: Auto-detected during deployment/Project Type**: $PROJECT_TYPE/" docs/agent-management/tech-lead-tony/scratchpad.md
sed -i "s/Tech Stack**: To be determined/Tech Stack**: $TECH_STACK/" docs/agent-management/tech-lead-tony/scratchpad.md

echo ""
echo "🎉 Tony Project Infrastructure Deployment Complete!"
echo ""
echo "📋 Deployment Summary:"
echo "  ✅ Project Type: $PROJECT_TYPE ($TECH_STACK)"
echo "  ✅ Directory Structure: Created"
echo "  ✅ Project Commands: /tony commands available"
echo "  ✅ Session Continuity: /engage command ready"
echo "  ✅ Infrastructure: Connected to user-level framework"
echo ""
echo "🚀 Ready for Tony Coordination!"
echo "   Start a Claude session in this directory and:"
echo "   • Use /engage to begin Tony coordination"
echo "   • Use /tony status to check system health"
echo "   • Say 'Hey Tony' to activate coordination mode"
echo ""
echo "📂 Project Infrastructure Created:"
echo "   .claude/commands/  - Project-level Tony commands"
echo "   docs/agent-management/  - Agent coordination files"
echo "   logs/  - Activity monitoring"
EOF