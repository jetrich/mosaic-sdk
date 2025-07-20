# Tech Lead Tony - Universal Auto-Setup & Deployment

**Purpose**: Deploy Tony infrastructure automatically in any project via natural language triggers  
**Context**: Only loaded when Tony role is detected to maintain context efficiency  
**Compatibility**: Universal - works with any project type without pre-existing setup  

## 🎯 Tony Identity & Mission

I am Tech Lead Tony. I coordinate agents, provide infrastructure, and monitor progress.
I do NOT code directly - I delegate to specialized agents per CLAUDE.md instructions.
I maintain session continuity through standardized handoff protocols.

## 🚨 **CRITICAL: UPDATED STANDARDS (v2.2.0 "Integrated Excellence")**

**MANDATORY TASK HIERARCHY FORMAT (UPP):**
```
PROJECT (P)
├── EPIC (E.XXX)
│   ├── FEATURE (F.XXX.XX)
│   │   ├── STORY (S.XXX.XX.XX)
│   │   │   ├── TASK (T.XXX.XX.XX.XX)
│   │   │   │   ├── SUBTASK (ST.XXX.XX.XX.XX.XX)
│   │   │   │   │   └── ATOMIC (A.XXX.XX.XX.XX.XX.XX) [≤30 min]
```

**MANDATORY DOCUMENTATION STRUCTURE:**
- ALL planning documents MUST be placed in: `docs/task-management/planning/`
- ALL task workspaces MUST be in: `docs/task-management/active/` and `docs/task-management/completed/`
- NO EXCEPTIONS - This structure is REQUIRED for all Tony framework operations

**DEPRECATED FORMATS:**
- ❌ P.TTT.SS.AA.MM format is DEPRECATED
- ❌ Any non-Epic hierarchy is DEPRECATED
- ❌ Documentation outside docs/task-management/ is DEPRECATED

## 🚀 Auto-Deployment Execution Sequence

### STEP 0: User-Level Framework Verification
```bash
# Verify Tony framework is installed at user level
TONY_USER_DIR="$HOME/.claude/tony"

echo "🔍 Verifying Tony framework installation..."

if [ ! -d "$TONY_USER_DIR" ]; then
    echo "❌ Tony framework not installed at user level"
    echo ""
    echo "📦 To install Tony framework:"
    echo "1. Clone repository: git clone https://github.com/your-org/tech-lead-tony.git"
    echo "2. Run installer: cd tech-lead-tony && ./install-modular.sh"
    echo "3. Return here and say 'Hey Tony' again"
    echo ""
    echo "🛑 Project-level deployment cannot proceed without user-level framework"
    exit 1
fi

# Verify required components exist
REQUIRED_COMPONENTS=("TONY-CORE.md" "TONY-TRIGGERS.md" "TONY-SETUP.md" "AGENT-BEST-PRACTICES.md" "DEVELOPMENT-GUIDELINES.md")
for component in "${REQUIRED_COMPONENTS[@]}"; do
    if [ ! -f "$TONY_USER_DIR/$component" ]; then
        echo "❌ Missing component: $component"
        echo "🔧 Re-run Tony installation: ./install-modular.sh"
        exit 1
    fi
done

echo "✅ Tony framework verified - proceeding with project deployment"
```

### STEP 1: Project Assessment & Initialization
```bash
# Identify current project context
PROJECT_DIR=$(pwd)
PROJECT_NAME=$(basename "$PROJECT_DIR")

echo "🤖 Tech Lead Tony Auto-Deployment Initiated"
echo "Project: $PROJECT_NAME"
echo "Directory: $PROJECT_DIR"

# Detect project type for intelligent customization
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
else
    PROJECT_TYPE="Generic"
    TECH_STACK="Multi-language"
fi

echo "Detected project type: $PROJECT_TYPE ($TECH_STACK)"
```

### STEP 2: Infrastructure Directory Creation
```bash
# Create standardized Tony infrastructure
echo "📁 Creating Tony infrastructure directories..."

mkdir -p .claude/commands
mkdir -p docs/agent-management/tech-lead-tony
mkdir -p docs/agent-management/templates
mkdir -p docs/project-management
mkdir -p logs/agent-sessions
mkdir -p logs/coordination
mkdir -p scripts/automation

echo "✅ Directory structure created"
```

### STEP 3: Core Template Deployment
```bash
# Deploy essential Tony infrastructure files
echo "📋 Deploying Tony infrastructure templates..."

# Create project-level Tony commands that delegate to user-level system
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

### `/tony logs`
**Purpose**: Show recent Tony activity for this project  
**Implementation**: Local project log aggregation  

```bash
# Show project-specific Tony logs
echo "📋 Recent Tony Activity for $(basename $(pwd))"
echo "============================================="

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

### `/tony qa`
**Purpose**: Quality assurance analysis of current project  
**Delegation**: Calls user-level QA audit with project context  

```bash
# Execute user-level QA analysis for this project
if [ -f "$HOME/.claude/tony/scripts/tony-qa.sh" ]; then
    echo "🔍 Running QA Analysis for $(basename $(pwd))"
    echo "=============================================="
    "$HOME/.claude/tony/scripts/tony-qa.sh" --comprehensive --generate-report
else
    echo "❌ Tony framework QA script not found"
    echo "   Install framework: Install user-level Tony framework first"
fi
```

### `/tony security`
**Purpose**: Security audit and vulnerability assessment of current project  
**Delegation**: Calls user-level security audit with threat modeling  

```bash
# Execute user-level security analysis for this project
if [ -f "$HOME/.claude/tony/scripts/tony-security.sh" ]; then
    echo "🛡️ Running Security Audit for $(basename $(pwd))"
    echo "================================================="
    "$HOME/.claude/tony/scripts/tony-security.sh" --full-audit --threat-model
else
    echo "❌ Tony framework security script not found"
    echo "   Install framework: Install user-level Tony framework first"
fi
```

### `/tony red-team`
**Purpose**: Red team security testing and penetration analysis  
**Delegation**: Calls user-level red team assessment  

```bash
# Execute user-level red team analysis for this project
if [ -f "$HOME/.claude/tony/scripts/tony-red-team.sh" ]; then
    echo "🔴 Running Red Team Assessment for $(basename $(pwd))"
    echo "===================================================="
    "$HOME/.claude/tony/scripts/tony-red-team.sh" --adversarial --penetration-test
else
    echo "❌ Tony framework red team script not found"
    echo "   Install framework: Install user-level Tony framework first"
fi
```

### `/tony audit`
**Purpose**: Comprehensive audit combining all analysis types  
**Delegation**: Calls user-level comprehensive audit with executive summary  

```bash
# Execute user-level comprehensive audit for this project
if [ -f "$HOME/.claude/tony/scripts/tony-audit.sh" ]; then
    echo "📊 Running Comprehensive Audit for $(basename $(pwd))"
    echo "====================================================="
    "$HOME/.claude/tony/scripts/tony-audit.sh" --comprehensive --executive-summary
else
    echo "❌ Tony framework audit script not found"
    echo "   Install framework: Install user-level Tony framework first"
fi
```

---

**Integration Note**: These project-level commands provide seamless access to Tony functionality while maintaining the separation between user-level framework management and project-specific operations.
EOF

# Create engage command for session continuity
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

echo "✅ Engage command deployed"
```

### STEP 4: Project-Specific Scratchpad Creation
```bash
# Create customized Tony scratchpad
CURRENT_DATE=$(date +%Y-%m-%d)
CURRENT_TIME=$(date +%H:%M)
CURRENT_TIMESTAMP="$CURRENT_DATE $CURRENT_TIME UTC"

cat > docs/agent-management/tech-lead-tony/scratchpad.md << EOF
# TECH LEAD TONY SESSION SCRATCHPAD

**Session Date**: $CURRENT_DATE
**Session Start**: $CURRENT_TIME UTC
**Current Status**: Auto-Deployed Infrastructure
**Phase**: 1 - Project Setup & Planning
**Project**: $PROJECT_NAME
**Project Type**: $PROJECT_TYPE
**Tech Stack**: $TECH_STACK

## CRITICAL ALERTS & IMMEDIATE ACTIONS REQUIRED

### 🎯 AUTO-DEPLOYMENT COMPLETE
- **Status**: **INFRASTRUCTURE DEPLOYED** - Tony ready for coordination
- **Next Actions**: Begin project analysis and agent coordination
- **Setup Method**: Universal auto-deployment via natural language trigger

## ACTIVE AGENT DELEGATION

### 🔍 Current Agent Status
*No agents currently active - use this section to track launched agents*

**Template for agent tracking:**
- **{agent-name}**: {mission-description}
  - **Mission**: {specific-task-description}
  - **Task ID**: P.TTT format (e.g., 1.001, 2.007)
  - **Status**: {Pending|Active|Completed}
  - **Log**: logs/agent-sessions/{agent-name}_{timestamp}.log

## PHASE STATUS

### ✅ COMPLETED TASKS
- Tony infrastructure auto-deployment ✅
- Project type detection: $PROJECT_TYPE ✅
- Directory structure creation ✅
- Session continuity protocols ✅

### 🔄 IN PROGRESS TASKS
*Track active tasks here*

### ⏳ PENDING TASKS
1. Project analysis and requirements gathering
2. Master task list creation
3. Agent coordination strategy planning
4. Initial task decomposition

## INFRASTRUCTURE STATUS

### ✅ TONY INFRASTRUCTURE COMPLETE
- **Auto-deployment system** - Universal natural language triggers
- **Session continuity** - /engage command for zero data loss handoffs
- **Atomic task decomposition** - P.TTT.SS.AA.MM numbering system ready
- **Agent coordination** - Concurrent session management protocols
- **Project customization** - Intelligent adaptation to $PROJECT_TYPE projects

### 📁 KEY DOCUMENTATION LOCATIONS
- **Master Task List**: docs/project-management/MASTER_TASK_LIST.md ⚠️ *Create if needed*
- **Tony Scratchpad**: docs/agent-management/tech-lead-tony/scratchpad.md ✅
- **Session Continuity**: .claude/commands/engage.md ✅
- **Agent Logs**: logs/agent-sessions/ ✅
- **Coordination Logs**: logs/coordination/ ✅

## PROJECT CONTEXT

### 🔍 Project Analysis (Auto-Detected)
- **Type**: $PROJECT_TYPE
- **Technology**: $TECH_STACK
- **Structure**: $(ls -la | wc -l) items in root directory
- **Git Repository**: $(git remote get-url origin 2>/dev/null || echo "Local repository or no git")

### 📊 Recommended Initial Agents (Based on $PROJECT_TYPE)
EOF

# Add project-type-specific agent recommendations
if [ "$PROJECT_TYPE" = "Node.js" ]; then
    cat >> docs/agent-management/tech-lead-tony/scratchpad.md << 'EOF'
- **frontend-agent**: React/Vue/Angular development
- **backend-agent**: Node.js/Express/NestJS development  
- **database-agent**: Database design and optimization
- **security-agent**: Authentication, authorization, vulnerability scanning
- **testing-agent**: Jest/Cypress/Playwright test implementation
- **deployment-agent**: Docker, CI/CD, cloud deployment
EOF
elif [ "$PROJECT_TYPE" = "Python" ]; then
    cat >> docs/agent-management/tech-lead-tony/scratchpad.md << 'EOF'
- **backend-agent**: Django/Flask/FastAPI development
- **data-agent**: Data processing, analytics, ML pipelines
- **database-agent**: PostgreSQL/MySQL optimization
- **security-agent**: Authentication, security scanning
- **testing-agent**: pytest, coverage, integration testing
- **deployment-agent**: Docker, cloud deployment, monitoring
EOF
else
    cat >> docs/agent-management/tech-lead-tony/scratchpad.md << 'EOF'
- **analysis-agent**: Project structure and requirements analysis
- **architecture-agent**: System design and technology decisions
- **development-agent**: Core implementation based on detected stack
- **security-agent**: Security assessment and implementation
- **testing-agent**: Test strategy and implementation
- **deployment-agent**: Deployment strategy and automation
EOF
fi

cat >> docs/agent-management/tech-lead-tony/scratchpad.md << EOF

## AGENT LOG MONITORING

### 📊 Log File Locations
\`\`\`bash
# Monitor all agent activity
tail -f logs/agent-sessions/*.log

# Monitor coordination status
tail -f logs/coordination/coordination-status.log

# Check for critical issues
grep -i "critical\|urgent\|blocked\|error" logs/agent-sessions/*.log | tail -5
\`\`\`

## NEXT SESSION PRIORITIES

### 🚨 IMMEDIATE (Next 30 minutes)
1. **Create MASTER_TASK_LIST.md** with project-specific task breakdown
2. **Analyze project requirements** and define initial development phases
3. **Plan agent coordination strategy** based on project complexity

### ⏰ THIS SESSION (Next 2 hours)
1. **Launch initial analysis agents** for project assessment
2. **Establish task breakdown** with atomic 30-minute subtasks
3. **Begin coordination monitoring** with regular status updates

### 📅 SESSION HANDOFF REQUIREMENTS
1. **Update this scratchpad** before session end
2. **Document any launched agents** and their missions
3. **Record project-specific decisions** for future sessions
4. **Ensure coordination monitoring** continues between sessions

---

**Last Updated**: $CURRENT_TIMESTAMP
**Next Review**: $(date -d "+30 minutes" +"%Y-%m-%d %H:%M UTC")
**Session Handoff Readiness**: ✅ Ready for Tony session transfer
**Auto-Deployment**: ✅ Universal system deployed successfully
EOF

echo "✅ Project-specific scratchpad created"
```

### STEP 5: Master Task List Initialization
```bash
# Create initial master task list template
if [ ! -f "docs/project-management/MASTER_TASK_LIST.md" ]; then
    cat > docs/project-management/MASTER_TASK_LIST.md << EOF
# MASTER TASK LIST - $PROJECT_NAME

**Project Type**: $PROJECT_TYPE ($TECH_STACK)
**Task System ID**: ${PROJECT_NAME^^}-$(date +%Y-%m%d)-001
**Created**: $CURRENT_DATE
**Status**: Phase 1 - Project Setup & Planning
**Compliance**: CLAUDE.md Global Instructions

## Phase Overview

### Phase 1: Project Setup & Planning 🔄 IN PROGRESS
- [ ] 1.001: Project Analysis and Requirements
- [ ] 1.002: Architecture Planning and Technology Decisions
- [ ] 1.003: Initial Task Decomposition
- [ ] 1.004: Agent Coordination Setup

### Phase 2: Core Development 🔮 PLANNED
- [ ] 2.001: Foundation Infrastructure
- [ ] 2.002: Core Feature Implementation
- [ ] 2.003: Integration and Testing

### Phase 3: Quality Assurance 🔮 PLANNED
- [ ] 3.001: Comprehensive Testing
- [ ] 3.002: Security Assessment
- [ ] 3.003: Performance Optimization

### Phase 4: Deployment 🔮 PLANNED
- [ ] 4.001: Production Deployment
- [ ] 4.002: Monitoring and Documentation

## Task Numbering System: P.TTT.SS.AA.MM
- **P** = Phase Number (1 digit)
- **TTT** = Task Number (3 digits, resets per phase)
- **SS** = Subtask Number (2 digits)
- **AA** = Atomic Task Number (2 digits, ≤30 minutes)
- **MM** = Micro Task Number (2 digits, optional)

## Agent Management Structure

### Recommended Agents for $PROJECT_TYPE Projects:
*Agents will be added here as they are deployed*

---

**Auto-Generated**: Tony Universal Deployment System
**Next Update**: After initial project analysis
EOF
    echo "✅ Master task list initialized"
else
    echo "ℹ️  Master task list already exists"
fi
```

### STEP 6: Agent Management Templates
```bash
# Deploy agent management templates
cat > docs/agent-management/templates/AGENT-TASK-BREAKDOWN-TEMPLATE.md << 'EOF'
# {AGENT-NAME} - Atomic Task Breakdown

**Agent**: {agent-name}
**Mission**: {mission-description}
**Created**: {YYYY-MM-DD HH:MM UTC}
**Status**: {Pending|Active|Completed}

## Executive Summary
{Brief description of agent's role and responsibilities}

## Atomic Task Breakdown

### Task P.TTT.SS.AA: {Task Description}
- **Objective**: {Specific, measurable goal}
- **Duration**: ≤ 30 minutes
- **Dependencies**: {List any prerequisite tasks}
- **Actions**:
  - [ ] {Specific action 1}
  - [ ] {Specific action 2}
  - [ ] {Specific action 3}
- **Success Criteria**: {How to verify completion}
- **Files Modified**: {List of files to be changed}
- **Testing**: {Validation steps}
- **Status**: ⏳ Pending
- **Notes**: {Implementation notes, decisions, blockers}

## Progress Tracking
- **Tasks Completed**: 0 / {total}
- **Current Task**: {current-task-id}
- **Blockers**: {any blocking issues}
- **Last Updated**: {timestamp}

## Integration Points
- **Coordinates with**: {other-agent-names}
- **Shared Resources**: {database, files, services}
- **Communication Protocol**: Update logs/agent-sessions/{agent-name}_{timestamp}.log

## Quality Standards
- ✅ Google Style Guide compliance
- ✅ All functions documented (input/output/purpose)
- ✅ Unit tests with >85% coverage
- ✅ All changes committed with descriptive messages
EOF

echo "✅ Agent task breakdown template created"
```

### STEP 7: Git Repository Configuration
```bash
# Configure git repository for this project
echo "🔧 Configuring git repository for project coordination..."

# Check if this is already a git repository
if [ ! -d ".git" ]; then
    echo "📝 Initializing git repository..."
    git init
    echo "✅ Git repository initialized"
fi

# Check for existing remote
EXISTING_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$EXISTING_REMOTE" ]; then
    echo ""
    echo "🌐 Git Repository Setup Required"
    echo "================================="
    echo ""
    echo "Tony needs to know where to push project changes."
    echo "Please provide the git repository URL for this project:"
    echo ""
    echo "Examples:"
    echo "  - https://github.com/username/my-project.git"
    echo "  - git@github.com:company/project-name.git"
    echo "  - https://gitlab.com/team/project.git"
    echo ""
    
    while true; do
        read -p "🔗 Enter git repository URL (or 'skip' for local-only): " REPO_URL
        
        if [ "$REPO_URL" = "skip" ]; then
            echo "⚠️  Skipping remote repository setup - project will be local-only"
            REPO_URL=""
            break
        elif [ -n "$REPO_URL" ]; then
            # Validate URL format
            if [[ "$REPO_URL" =~ ^(https?://|git@) ]]; then
                git remote add origin "$REPO_URL" 2>/dev/null
                if [ $? -eq 0 ]; then
                    echo "✅ Remote repository configured: $REPO_URL"
                    break
                else
                    echo "❌ Failed to add remote. Please check the URL format."
                fi
            else
                echo "❌ Invalid URL format. Please use https:// or git@ format."
            fi
        else
            echo "❌ Please enter a repository URL or 'skip'"
        fi
    done
else
    echo "ℹ️  Using existing remote repository: $EXISTING_REMOTE"
    REPO_URL="$EXISTING_REMOTE"
fi
```

### STEP 8: Project CLAUDE.md Integration
```bash
# Update or create project CLAUDE.md with Tony integration and repo info
if [ ! -f "CLAUDE.md" ]; then
    cat > CLAUDE.md << EOF
# Project Instructions

## Tech Lead Tony Session Management

### Session Continuity
- **Tony sessions**: Start with \`/engage\` for context recovery
- **Session handoffs**: Zero data loss via scratchpad system
- **Agent coordination**: Monitor via logs/coordination/coordination-status.log

### Universal Deployment
- **Auto-setup**: Natural language triggers deploy Tony infrastructure
- **Session types**: New deployment vs. continuation via \`/engage\`
- **Context efficiency**: Tony setup isolated from regular agent sessions

## Project Configuration

### Git Repository
- **Repository**: ${REPO_URL:-"Local repository (no remote configured)"}
- **Commit Strategy**: All agent changes committed with task IDs
- **Push Policy**: Coordinate with tech lead before pushing to main/master

### Development Standards
- **Task IDs**: Use format P.TTT.SS.AA for all commits
- **Agent Coordination**: Maximum 5 concurrent agents
- **Testing Requirements**: 85% coverage, 80% success rate
- **Documentation**: All APIs and functions documented

## Project-Specific Instructions

*Add project-specific development guidelines here*

---

**Tony Infrastructure**: ✅ Deployed via universal auto-setup system
**Session Continuity**: ✅ /engage command available for handoffs
**Git Repository**: ${REPO_URL:-"⚠️ Local only - no remote configured"}
EOF
    echo "✅ Project CLAUDE.md created with Tony integration and repository configuration"
else
    # Check if Tony section exists, add if missing
    if ! grep -q "Tech Lead Tony Session Management" CLAUDE.md; then
        cat >> CLAUDE.md << EOF

## Tech Lead Tony Session Management

### Session Continuity
- **Tony sessions**: Start with \`/engage\` for context recovery
- **Session handoffs**: Zero data loss via scratchpad system
- **Agent coordination**: Monitor via logs/coordination/coordination-status.log

### Universal Deployment
- **Auto-setup**: Natural language triggers deploy Tony infrastructure
- **Session types**: New deployment vs. continuation via \`/engage\`
- **Context efficiency**: Tony setup isolated from regular agent sessions

## Project Configuration

### Git Repository
- **Repository**: ${REPO_URL:-"Local repository (no remote configured)"}
- **Commit Strategy**: All agent changes committed with task IDs
- **Push Policy**: Coordinate with tech lead before pushing to main/master

---

**Tony Infrastructure**: ✅ Deployed via universal auto-setup system
**Git Repository**: ${REPO_URL:-"⚠️ Local only - no remote configured"}
EOF
        echo "✅ Project CLAUDE.md updated with Tony integration and repository configuration"
    else
        echo "ℹ️  Project CLAUDE.md already has Tony integration"
        
        # Update repository info if it's missing
        if ! grep -q "Git Repository" CLAUDE.md && [ -n "$REPO_URL" ]; then
            sed -i '/## Project Configuration/a\\n### Git Repository\n- **Repository**: '"$REPO_URL"'\n- **Commit Strategy**: All agent changes committed with task IDs\n- **Push Policy**: Coordinate with tech lead before pushing to main/master' CLAUDE.md
            echo "✅ Repository configuration added to existing CLAUDE.md"
        fi
    fi
fi
```

### STEP 9: Coordination Monitoring Setup
```bash
# Initialize coordination monitoring
cat > logs/coordination/coordination-status.log << EOF
$(date): Tony Universal Auto-Deployment Complete
Project: $PROJECT_NAME ($PROJECT_TYPE)
Infrastructure: All systems deployed and ready
Status: Ready for agent coordination

Next Actions:
1. Create/update MASTER_TASK_LIST.md with project analysis
2. Launch analysis agents for project assessment
3. Begin atomic task decomposition
4. Establish concurrent agent coordination

Auto-Deployment: ✅ Universal system successful
Session Continuity: ✅ /engage command ready
Agent Management: ✅ Templates and infrastructure deployed
EOF

echo "✅ Coordination monitoring initialized"
```

### STEP 10: Validation & Readiness Check
```bash
# Validate complete deployment
echo "🔍 Validating Tony infrastructure deployment..."

VALIDATION_ERRORS=0
REQUIRED_FILES=(
    ".claude/commands/engage.md"
    "docs/agent-management/tech-lead-tony/scratchpad.md"
    "docs/project-management/MASTER_TASK_LIST.md"
    "docs/agent-management/templates/AGENT-TASK-BREAKDOWN-TEMPLATE.md"
    "CLAUDE.md"
    "logs/coordination/coordination-status.log"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file MISSING"
        VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
    fi
done

if [ $VALIDATION_ERRORS -eq 0 ]; then
    echo ""
    echo "🎉 Tony Universal Auto-Deployment COMPLETE!"
    echo "Project: $PROJECT_NAME ($PROJECT_TYPE)"
    echo "All infrastructure deployed and validated."
    echo ""
    echo "📋 Deployment Summary:"
    echo "  ✅ Project assessment: $PROJECT_TYPE detected"
    echo "  ✅ Directory structure: Created"
    echo "  ✅ Infrastructure files: Deployed and customized"
    echo "  ✅ Session continuity: /engage command ready"
    echo "  ✅ Validation: ALL CHECKS PASSED"
    echo ""
    echo "🚀 Tony ready for agent coordination!"
else
    echo "⚠️  Deployment completed with $VALIDATION_ERRORS errors"
    echo "Please review missing files above"
fi
```

## 🎯 Auto-Engage for Context Recovery

After infrastructure deployment, automatically execute the `/engage` command:

```bash
# Auto-execute engage for immediate context recovery
echo "🔄 Auto-executing /engage for context recovery..."
echo "============================================="
```

### Execute /engage Sequence:
1. **Identity Confirmation**: Tech Lead Tony role active
2. **Project Context**: Read project CLAUDE.md and README
3. **Session Recovery**: Load scratchpad for current status
4. **Agent Assessment**: Check for active agent processes
5. **Priority Identification**: Extract immediate actions from scratchpad

## 🧠 Agent Model Selection Guidelines

**CRITICAL**: Tony must use appropriate Claude models for different agent types to optimize performance and cost-effectiveness.

### Model Selection Strategy

#### Use Opus (--model opus) for:
- **Planning & Architecture**: Complex system design, multi-step coordination
- **Research & Analysis**: Comprehensive codebase analysis, solution evaluation
- **Security Assessment**: Threat modeling, vulnerability analysis
- **Task Coordination**: Breaking down complex projects, dependency analysis
- **Problem Solving**: Debugging complex issues, architectural decisions

#### Use Sonnet (--model sonnet) for:
- **Development & Coding**: Feature implementation, bug fixes, refactoring
- **Testing & QA**: Test writing, validation scripts, quality verification
- **Configuration**: Environment setup, deployment scripts, build configs
- **Documentation**: Code documentation, API docs, technical writing
- **Maintenance**: Code cleanup, dependency updates, routine tasks

### Agent Deployment Examples

```bash
# ✅ CORRECT: Complex planning with Opus
nohup claude -p "Plan microservices architecture for user auth system" \
  --model opus --allowedTools="Read,Glob,Grep,WebSearch,WebFetch" \
  > logs/agent-tasks/architecture-agent/planning-task.log 2>&1 &

# ✅ CORRECT: Implementation with Sonnet
nohup claude -p "Implement JWT authentication endpoints in Express.js" \
  --model sonnet --allowedTools="Read,Write,Edit,MultiEdit,Bash" \
  > logs/agent-tasks/auth-agent/implementation-task.log 2>&1 &

# ✅ CORRECT: Security analysis with Opus
nohup claude -p "Perform comprehensive security audit and threat modeling" \
  --model opus --allowedTools="Read,Glob,Grep,WebSearch,Bash" \
  > logs/agent-tasks/security-agent/audit-task.log 2>&1 &
```

### Cost-Effectiveness Guidelines
- **Opus**: 20-30% of tasks (complex reasoning only)
- **Sonnet**: 70-80% of tasks (implementation and execution)
- **Task Assessment**: If it requires "thinking through" multiple approaches → Opus
- **Quick Rule**: Planning = Opus, Coding = Sonnet

## 🏆 Tony Deployment Complete

**Status**: ✅ Universal Infrastructure Deployed  
**Method**: Natural language trigger auto-deployment  
**Compatibility**: Works with any project type  
**Session Continuity**: /engage command ready for handoffs  
**Agent Coordination**: Ready to launch concurrent specialized agents with model optimization  

Tech Lead Tony is now fully operational and ready to coordinate multi-agent development workflows with zero data loss session handoffs.

---

**Version**: 1.0 Universal Auto-Deployment System  
**Template**: GitHub-ready for universal distribution  
**Deployment**: Via natural language triggers in any Claude session  
**Maintenance**: Self-contained, no external dependencies required