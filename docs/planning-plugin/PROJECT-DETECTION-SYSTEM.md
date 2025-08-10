# MosAIc Project Detection System

**Complete implementation of local project detection with .mosaic directory support**

## Overview

The MosAIc Project Detection System solves the critical issue of duplicate project creation across multiple Claude sessions. Like Git's `.git` directory, MosAIc now uses `.mosaic` directories to mark and identify project boundaries, enabling automatic project detection and session continuity.

## Problem Solved

**Before:**
- Multiple Claude sessions in the same directory created duplicate MosAIc projects
- No local project context or state persistence  
- Planning data scattered across sessions
- No project boundary detection

**After:**
- ✅ Automatic project detection across sessions
- ✅ Single `.mosaic` directory per project (like `.git`)
- ✅ Unified project state and configuration
- ✅ Session continuity across terminals
- ✅ No duplicate project creation

## System Architecture

### Core Components

1. **ProjectInitializationService** - Creates `.mosaic` directories for new projects
2. **ProjectDetectionService** - Auto-detects existing projects by traversing directory tree
3. **InitMosaicTool** - `/init-mosaic` MCP tool with interactive interface
4. **Enhanced StateTracker** - Uses `.mosaic/data/planning` consistently  
5. **Enhanced UnifiedPlanningAgent** - Auto-detects project context

### Directory Structure

```
project-root/
└── .mosaic/                  # Project marker directory
    ├── project.json          # Greenfield: project metadata
    ├── link.json            # Brownfield: link to remote project  
    ├── config/              # Project-specific configuration
    │   ├── routing.json     # Local routing overrides
    │   ├── agents.json      # Agent preferences
    │   └── planning.json    # Planning settings
    ├── data/                # Local project data storage
    │   ├── planning/        # Planning session files (StateTracker)
    │   ├── tasks/          # Task decomposition history
    │   ├── sessions/       # Session continuity data
    │   └── sync/           # Brownfield sync state
    ├── cache/              # Temporary cache data
    └── .mosaicignore       # Files to ignore
```

## Project Types

### Greenfield Projects (New)

**Created when:** Starting a completely new MosAIc project

**Files:**
- `.mosaic/project.json` - Contains project metadata, ID, description
- Local project data only
- No remote synchronization

**Example project.json:**
```json
{
  "type": "greenfield",
  "id": "mosaic-uuid-generated",
  "name": "My New Project",
  "description": "A new MosAIc project",
  "created": "2025-08-10T12:00:00Z",
  "updated": "2025-08-10T12:30:00Z",
  "local": true,
  "remote_sync": false,
  "mosaic": {
    "version": "0.1.0", 
    "initialized_by": "/init-mosaic"
  },
  "status": "active"
}
```

### Brownfield Projects (Linked)

**Created when:** Linking a local directory to an existing remote MosAIc project

**Files:**
- `.mosaic/link.json` - Contains link to remote project
- `.mosaic/cache/remote-project.json` - Cached remote metadata
- Bidirectional synchronization enabled

**Example link.json:**
```json
{
  "type": "brownfield",
  "local_id": "mosaic-local-uuid",
  "remote_project": {
    "id": "sage-phr-remote-uuid", 
    "name": "Sage PHR Business Planning",
    "mcp_server": "localhost:3456"
  },
  "sync": {
    "enabled": true,
    "last_sync": "2025-08-10T12:30:00Z",
    "strategy": "bidirectional"
  },
  "created": "2025-08-10T12:00:00Z"
}
```

## Usage

### `/init-mosaic` Command

**Interactive Mode (Default):**
```bash
/init-mosaic
```

Presents interactive prompts:
1. Choose project type (greenfield/brownfield)
2. Enter project details
3. For brownfield: select from available remote projects
4. Creates `.mosaic` directory structure

**Non-Interactive Mode:**
```bash
# Greenfield project
/init-mosaic --path=/project/path --project_type=greenfield --project_name="My Project" --interactive=false

# Brownfield project  
/init-mosaic --path=/project/path --project_type=brownfield --remote_project_id="existing-id" --interactive=false
```

### Automatic Detection

**On Agent Initialization:**
- All planning agents automatically detect `.mosaic` directories
- Project context loaded and logged
- Planning operations use detected project ID
- State persistence uses `.mosaic/data/planning`

**User Experience:**
```
🚀 MosAIc Project Initialization

Current directory: /home/user/my-project

Choose project type:
1) 📁 Greenfield - Create new MosAIc project  
2) 🔗 Brownfield - Link to existing MosAIc project

Choice [1-2]: 2

🔍 Available Remote Projects:
1) Sage PHR Business Planning (sage-phr-123)
2) E-commerce Platform (ecomm-456)
3) Marketing Automation (marketing-789)

Select project [1-3]: 1

✅ Project linked successfully!
📁 Created .mosaic directory  
🔗 Linked to "Sage PHR Business Planning"
🎯 Ready for planning commands!
```

## Integration Points

### StateTracker Enhancement

**Before:**
```typescript
// Fixed path, no project detection
dataDir: join(process.cwd(), '.mosaic', 'planning')
```

**After:**
```typescript
// Auto-detects project root and uses .mosaic/data/planning
const projectRoot = await this.detectionService.getProjectRoot();
if (projectRoot) {
  dataDir = join(projectRoot, '.mosaic', 'data', 'planning');
  // Also extracts project ID from metadata
}
```

### UnifiedPlanningAgent Enhancement  

**Automatic Project Context:**
- Detects `.mosaic` directory on initialization
- Loads project metadata into planning context
- Validates project structure
- Provides recommendations for repairs

**Enhanced Logging:**
```
[AGENT] Detected MosAIc project: Sage PHR Business Planning
[AGENT] Type: brownfield, Path: /home/user/sage-phr-test-2
[AGENT] Project ID: sage-phr-remote-uuid
[AGENT] Relative Path: .
```

### Planning Command Integration

**Auto-Context Detection:**
- `/plan-business` automatically uses detected project context
- No need to specify `--project` parameter
- Project-specific configuration applied
- Session data stored in project's `.mosaic` directory

## Solution to User's Issue

### Problem: sage-phr-test-2 Duplicate Projects

**Issue:**
1. User worked in `/home/jwoltje/src/sage-phr-test-2/` in one Claude session
2. Opened new Claude session in same directory  
3. New session created duplicate "Sage PHR Business Planning" project
4. No way to detect existing project work

### Solution Implementation

**Step 1:** Run `/init-mosaic` in sage-phr-test-2
```bash
cd /home/jwoltje/src/sage-phr-test-2/
/init-mosaic
```

**Step 2:** Choose Brownfield Project
```
Choice [1-2]: 2  # Brownfield - Link to existing
```

**Step 3:** Select Existing Project
```
Available projects:
1) Sage PHR Business Planning (existing project)

Select project [1]: 1
```

**Step 4:** Automatic Detection in Future Sessions
- Creates `.mosaic/link.json` in sage-phr-test-2/
- New Claude sessions automatically detect linked project
- No more duplicate projects!
- Unified project state across all sessions

## Testing and Validation

### Test Results

```bash
node test-project-detection.cjs
```

**Output Demonstrates:**
✅ Automatic project detection in mosaic-sdk (has existing `.mosaic`)
✅ Duplicate project prevention (fails gracefully if already initialized)
✅ Greenfield project creation workflow
✅ Brownfield project linking workflow  
✅ Complete `.mosaic` directory structure creation
✅ Next steps guidance for users

### Directory Tree Traversal

**Algorithm:**
1. Start from current directory
2. Check for `.mosaic` directory  
3. If found: validate project type and load metadata
4. If not found: check parent directory
5. Repeat up to 10 levels (prevent infinite traversal)
6. Skip common directories: `node_modules`, `.git`, `dist`, etc.

**Performance:**
- Efficient upward traversal
- Early exit on project detection
- Skips irrelevant directories
- Caches detection results

## Configuration and Customization

### Project-Specific Routing

**`.mosaic/config/routing.json`:**
```json
{
  "routing": {
    "inherit_global": true,
    "overrides": {
      "MOSAIC_CODING_MODEL": "codellama:7b",
      "MOSAIC_GENERAL_MODEL": "llama3.2:3b"  
    },
    "preferences": {
      "healthcare_tasks": "remote",
      "hipaa_analysis": "hybrid"
    }
  }
}
```

### Agent Preferences

**`.mosaic/config/agents.json`:**
```json
{
  "agents": {
    "preferred": [
      "upp-business-planner",
      "upp-release-planner", 
      "healthcare-compliance-agent"
    ],
    "assignments": {
      "financial_planning": "upp-financial-planner",
      "technical_tasks": "upp-tech-architecture"
    }
  }
}
```

### Planning Settings

**`.mosaic/config/planning.json`:**
```json
{
  "planning": {
    "default_complexity": 3,
    "auto_decompose": true,
    "state_persistence": true,
    "session_timeout": 3600,
    "auto_save_interval": 30000
  }
}
```

## Error Handling and Recovery

### Common Issues

**1. Corrupted .mosaic Directory**
```bash
# Validation detects missing subdirectories or files
[VALIDATION] Missing directories: data/planning, config
[VALIDATION] Recommendation: Run /init-mosaic to repair
```

**2. Permission Issues**  
```bash
[ERROR] Cannot create .mosaic directory: Permission denied
[SOLUTION] Check write permissions for current directory
```

**3. Brownfield Sync Issues**
```bash
[WARNING] Remote project cache stale, last sync: 2 days ago  
[RECOMMENDATION] Sync with remote project
```

### Recovery Commands

**Repair Project Structure:**
```bash
/init-mosaic --repair
```

**Force Re-detection:**
```bash  
/project-status --validate --repair
```

**Manual Cleanup:**
```bash
# Remove .mosaic directory and re-initialize
rm -rf .mosaic
/init-mosaic
```

## Future Enhancements

### Planned Features

**v0.2.0 - Enhanced Sync:**
- Real-time brownfield project synchronization
- Conflict resolution for concurrent edits
- Offline mode with sync queue

**v0.3.0 - Multi-Project Workspace:**
- Detect multiple projects in workspace
- Project switching commands
- Cross-project task dependencies

**v0.4.0 - Advanced Configuration:**
- Project templates and scaffolding
- Custom .mosaic directory locations  
- Project inheritance hierarchies

## Migration Guide

### For Existing Projects

**Before Project Detection System:**
- Manual project specification: `--project=name`
- Scattered session data
- No local project context

**After Migration:**
1. Run `/init-mosaic` in existing project directories
2. Choose appropriate project type (greenfield/brownfield)
3. Existing planning data automatically migrated
4. Future sessions auto-detect project context

### Best Practices

1. **One .mosaic per project root** - Don't create nested .mosaic directories
2. **Use brownfield for existing remote projects** - Link don't duplicate
3. **Commit .mosaic to git** - Share project context with team (exclude cache/)
4. **Regular validation** - Check project structure health
5. **Backup before major changes** - .mosaic contains important project state

---

**The MosAIc Project Detection System transforms project management from manual, error-prone processes to automatic, Git-like project boundary detection with full session continuity support.**