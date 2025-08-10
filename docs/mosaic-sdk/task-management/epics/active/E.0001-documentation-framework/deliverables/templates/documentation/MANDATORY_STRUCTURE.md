# MANDATORY_STRUCTURE.md - {{PROJECT_NAME}}

**Project Type**: {{PROJECT_TYPE}}  
**Generated**: {{GENERATION_DATE}}  
**Template Version**: 1.0.0  
**Framework**: MosAIc Universal Documentation Framework

## 🚨 CRITICAL: SINGLE SOURCE OF TRUTH

This file MUST be the ONLY `MANDATORY_STRUCTURE.md` in the project.

### ❌ PROHIBITED LOCATIONS
- `MANDATORY_STRUCTURE.md` (project root)
- `docs/MANDATORY_STRUCTURE.md` 
- Any location other than `docs/{{PROJECT_NAME}}/task-management/MANDATORY_STRUCTURE.md`

### ✅ CORRECT LOCATION
- `docs/{{PROJECT_NAME}}/task-management/MANDATORY_STRUCTURE.md` (THIS FILE)

**ENFORCEMENT**: Any duplicate files MUST be deleted immediately. Use validation script to detect duplicates.

## 📁 MANDATORY PROJECT STRUCTURE

### Universal Base Structure (ALL PROJECTS)

```
{{PROJECT_NAME}}/
├── docs/{{PROJECT_NAME}}/                    # Project = Shelf principle
│   ├── task-management/                      # UPP task hierarchy
│   │   ├── MANDATORY_STRUCTURE.md           # THIS FILE (single source)
│   │   ├── epics/                           # Epic-centric organization
│   │   │   ├── active/                      # Current epics
│   │   │   │   └── E.XXX-epic-name/         # Self-contained epic
│   │   │   │       ├── README.md            # Epic overview
│   │   │   │       ├── STATUS               # Current status
│   │   │   │       ├── planning/            # Strategic documents
│   │   │   │       │   ├── epic-plan.md
│   │   │   │       │   └── requirements.md
│   │   │   │       ├── features/            # F.XXX.XX/
│   │   │   │       ├── stories/             # S.XXX.XX.XX/
│   │   │   │       ├── tasks/               # T.XXX.XX.XX.XX/
│   │   │   │       ├── subtasks/            # ST.XXX.XX.XX.XX.XX/
│   │   │   │       ├── atomics/             # A.XXX.XX.XX.XX.XX.XX/
│   │   │   │       └── workspace/           # Working documents
│   │   │   └── completed/                   # Finished epics
│   │   ├── agent-tracking/                  # Agent session management
│   │   │   ├── active-sessions/
│   │   │   ├── completed-sessions/
│   │   │   └── handoff-logs/
│   │   └── _index/                          # Automated indexes
│   │       ├── ACTIVE_EPICS.txt
│   │       ├── WORK_QUEUE.md
│   │       └── ASSIGNMENTS.json
│   ├── architecture/                        # BookStack domain
│   ├── api/                                 # BookStack domain
│   ├── operations/                          # BookStack domain
│   └── _project.yaml                        # Project metadata
└── scripts/                                 # External session management
    └── create-agent-session.sh              # MANDATORY: Agent date/time
```

## 🎯 UPP HIERARCHY RULES (MANDATORY)

### 6-Level Decomposition (NEVER DEVIATE)

```
E.XXX         → Epic (Strategic initiative)
F.XXX.XX      → Feature (Major capability)
S.XXX.XX.XX   → Story (User-facing functionality)
T.XXX.XX.XX.XX → Task (Implementation unit)
ST.XXX.XX.XX.XX.XX → Subtask (Detailed work)
A.XXX.XX.XX.XX.XX.XX → Atomic (≤30 minutes)
```

### Directory Organization (MANDATORY)

- **ALWAYS** create directories by type: `features/`, `stories/`, `tasks/`, `subtasks/`, `atomics/`
- **NEVER** mix UPP levels in same directory
- **ALWAYS** include README.md and STATUS in epic root
- **NEVER** create task files outside epic structure

### File Naming (MANDATORY)

```
features/F.001.01-feature-name.md
stories/S.001.01.01-story-name.md
tasks/T.001.01.01.01-task-name.md
subtasks/ST.001.01.01.01.01-subtask-name.md
atomics/A.001.01.01.01.01.01-atomic-name.md
```

## 🔒 WORKSPACE SEPARATION (MANDATORY)

### Strategic vs Tactical Documents

**planning/** Directory (Strategic):
- Epic-level planning documents
- Requirements analysis
- Architecture decisions
- Strategic roadmaps

**workspace/** Directory (Tactical):
- Working documents
- Analysis artifacts
- Temporary files
- Agent collaboration space

**UPP Directories** (Implementation):
- features/, stories/, tasks/, subtasks/, atomics/
- Implementation-focused documents
- Progress tracking
- Deliverable documentation

### ENFORCEMENT RULES

- **NEVER** put UPP files in planning/
- **NEVER** put planning docs in UPP directories
- **ALWAYS** maintain clear separation
- **ALWAYS** use workspace/ for temporary documents

{{DOMAIN_SPECIFIC_SECTIONS}}

## 🤖 AGENT SESSION MANAGEMENT

### External Script Requirement (MANDATORY)

**Problem**: Agents lack reliable date/time access
**Solution**: External session creation script

### Required Script: `scripts/create-agent-session.sh`

```bash
#!/bin/bash
# MANDATORY: All projects must have this script

AGENT_NAME="$1"
EPIC_ID="$2"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
SESSION_DIR="docs/{{PROJECT_NAME}}/task-management/agent-tracking/active-sessions"

mkdir -p "$SESSION_DIR"
cat > "$SESSION_DIR/${AGENT_NAME}_${EPIC_ID}_${TIMESTAMP}.md" << EOF
# Agent Session: $AGENT_NAME

**Epic**: $EPIC_ID
**Started**: $(date)
**Status**: Active

## Context
[Agent context and objectives]

## Progress Log
[Timestamped progress updates]
EOF

echo "Session created: $SESSION_DIR/${AGENT_NAME}_${EPIC_ID}_${TIMESTAMP}.md"
```

### Agent Handoff Protocol

1. **Session Creation**: Use external script for timestamp accuracy
2. **Context Transfer**: Document in handoff-logs/
3. **Progress Tracking**: Update session files regularly
4. **Session Closure**: Move to completed-sessions/

## 📊 INDEX SYSTEM (AUTOMATED)

### Required Index Files

**_index/ACTIVE_EPICS.txt** (Simple list):
```
E.001-documentation-framework
E.002-security-enhancement
E.003-performance-optimization
```

**_index/WORK_QUEUE.md** (Prioritized tasks):
```markdown
# Work Queue - {{PROJECT_NAME}}

## High Priority
- [ ] T.001.01.01.01 - Critical bug fix
- [ ] T.002.01.01.01 - Security patch

## Medium Priority
- [ ] T.001.02.01.01 - Feature enhancement
```

**_index/ASSIGNMENTS.json** (Agent assignments):
```json
{
  "assignments": {
    "BE-BACKEND-BENJAMIN": ["T.001.01.01.01", "T.001.01.01.02"],
    "FE-FRONTEND-FIONA": ["T.002.01.01.01"],
    "DOC-DOCUMENTATION-DAVID": ["T.001.03.01.01"]
  },
  "updated": "2025-01-27T10:30:00Z"
}
```

### Index Maintenance

- **NEVER** manually edit index files
- **ALWAYS** use automated generation
- **ALWAYS** validate index consistency
- **NEVER** commit stale indexes

## 🚫 ANTI-PATTERNS (NEVER DO THESE)

### 1. Multiple MANDATORY_STRUCTURE.md Files
- **Problem**: Confusion, outdated guidance
- **Prevention**: Automated duplicate detection
- **Validation**: Run `find . -name "MANDATORY_STRUCTURE.md"` - should return only this file

### 2. Mixed Content in Directories
- **Problem**: UPP files in planning/, planning docs in UPP directories
- **Prevention**: Clear separation rules, validation scripts

### 3. Manual Index Maintenance
- **Problem**: Outdated indexes, maintenance burden
- **Prevention**: Automated index generation only

### 4. Weak Enforcement Language
- **Problem**: Ambiguous requirements, non-compliance
- **Prevention**: Use NEVER/ALWAYS/MUST language consistently

### 5. Project-Specific Paths
- **Problem**: Reduces universality, breaks automation
- **Prevention**: Standardize on `docs/{{PROJECT_NAME}}/task-management/`

## 🔍 VALIDATION CHECKLIST

### Structure Validation
- [ ] Single MANDATORY_STRUCTURE.md file in correct location
- [ ] Epic directories follow E.XXX-name pattern
- [ ] UPP hierarchy properly separated by type
- [ ] All epics have README.md and STATUS files
- [ ] External session script exists and is executable

### Content Validation
- [ ] No duplicate task IDs across epics
- [ ] All UPP files follow naming conventions
- [ ] Workspace separation maintained
- [ ] Index files are current and accurate

### Agent Compliance
- [ ] All agents use external session creation
- [ ] Agent handoffs properly documented
- [ ] Session files regularly updated
- [ ] Completed sessions properly archived

## 🛠️ VALIDATION COMMANDS

### Duplicate Detection
```bash
# Should return only this file
find . -name "MANDATORY_STRUCTURE.md"

# Should return empty (no duplicates)
find . -name "MANDATORY_STRUCTURE.md" -not -path "./docs/{{PROJECT_NAME}}/task-management/MANDATORY_STRUCTURE.md"
```

### Structure Validation
```bash
# Verify epic structure
find docs/{{PROJECT_NAME}}/task-management/epics -type d -name "E.*" | head -5

# Check UPP directory separation
ls docs/{{PROJECT_NAME}}/task-management/epics/active/E.*/
```

### Index Validation
```bash
# Check index files exist
ls docs/{{PROJECT_NAME}}/task-management/_index/

# Validate index content
wc -l docs/{{PROJECT_NAME}}/task-management/_index/ACTIVE_EPICS.txt
```

## 📋 PROJECT METADATA

### _project.yaml (MANDATORY)
```yaml
project:
  name: "{{PROJECT_NAME}}"
  type: "{{PROJECT_TYPE}}"
  framework: "MosAIc Universal Documentation Framework"
  
structure:
  version: "1.0.0"
  path_pattern: "docs/{{PROJECT_NAME}}/"
  task_management: "docs/{{PROJECT_NAME}}/task-management/"
  
compliance:
  mandatory_structure: true
  upp_hierarchy: true
  epic_centric: true
  single_source: true

{{PROJECT_METADATA}}
```

## 🎭 AGENT PERSONAS

### Universal Personas (ALL PROJECTS)
- **BE-BACKEND-BENJAMIN**: Backend development, APIs, databases
- **FE-FRONTEND-FIONA**: Frontend development, UI/UX, components
- **FS-FULLSTACK-FELIX**: Full-stack development, integration
- **DOC-DOCUMENTATION-DAVID**: Technical writing, documentation
- **QA-QUALITY-QUINN**: Quality assurance, testing
- **DEVOPS-OPERATIONS-OLIVER**: DevOps, deployment, infrastructure
- **SEC-SECURITY-SARAH**: Security analysis, vulnerability assessment

{{AGENT_SPECIALIZATIONS}}

## 📚 BOOKSTACK INTEGRATION

### Project = Shelf Principle
- **{{PROJECT_NAME}}** → BookStack Shelf: "{{PROJECT_NAME}}"
- **docs/{{PROJECT_NAME}}/architecture/** → Book: "Architecture"
- **docs/{{PROJECT_NAME}}/api/** → Book: "API Documentation"
- **docs/{{PROJECT_NAME}}/operations/** → Book: "Operations"
- **docs/{{PROJECT_NAME}}/task-management/** → Book: "Task Management"

### Sync Configuration
```yaml
bookstack_sync:
  shelf_name: "{{PROJECT_NAME}}"
  base_path: "docs/{{PROJECT_NAME}}/"
  exclude_patterns:
    - "workspace/"
    - "_index/"
    - "*.tmp"
```

## 🔄 MAINTENANCE

### Regular Tasks
- **Daily**: Update agent session progress
- **Weekly**: Validate structure compliance
- **Monthly**: Archive completed epics
- **Quarterly**: Review and update this document

### Automation Scripts
- `scripts/validate-structure.sh` - Structure compliance check
- `scripts/generate-indexes.sh` - Automated index generation
- `scripts/archive-epic.sh` - Epic completion workflow
- `scripts/detect-duplicates.sh` - Duplicate file detection

## 📞 SUPPORT

### Issues and Questions
- **Structure Violations**: Run validation scripts first
- **Agent Coordination**: Check agent-tracking/ logs
- **Epic Management**: Review epic README.md and STATUS
- **Index Problems**: Regenerate using automation scripts

### Emergency Procedures
- **Duplicate Files**: Delete all except this file, regenerate if needed
- **Structure Corruption**: Restore from git history, validate
- **Agent Conflicts**: Check handoff-logs/, coordinate resolution

---

**REMEMBER**: This structure is MANDATORY and UNIVERSAL. No exceptions, no variations, no "project-specific needs" that override these rules. Compliance is not optional.

**VALIDATION**: Before any work begins, verify this structure exists and is followed. Non-compliance blocks all development activities.

**ENFORCEMENT**: Any agent or developer who violates this structure must immediately correct violations before continuing work.