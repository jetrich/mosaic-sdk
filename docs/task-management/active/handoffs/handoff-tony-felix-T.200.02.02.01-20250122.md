# Task Handoff: T.200.02.02.01 - Implement mosaic_project_switch

**From Agent**: TL-LEAD-TONY  
**To Agent**: FS-FULLSTACK-FELIX  
**Handoff Type**: Expertise  
**Date/Time**: 2025-01-22T10:00:00Z  

## Task Status

**Current State**: Not Started  
**Completion**: 0% complete  
**Time Spent**: 0 hours  
**Remaining Estimate**: 4 hours  

## Work Completed

### Accomplishments
- ✅ Created ProjectService with basic structure
- ✅ Created ProjectTools with mock implementation
- ✅ Defined ProjectSwitchSchema for input validation

### Code Changes
- File: `/packages/mcp-orchestrator/src/tools/ProjectTools.ts` - Created switchProject mock
- File: `/packages/mcp-orchestrator/src/services/ProjectService.ts` - Basic service structure
- File: `/packages/mcp-orchestrator/src/services/TaskService.ts` - Has setCurrentProject method

### Artifacts Created
- Tool Specification - In MCP-SERVER-SPECIFICATION.md
- Database schema - Projects table already created

## Current State

### Active Files
- `/packages/mcp-orchestrator/src/tools/ProjectTools.ts` - Contains switchProject to implement
- `/packages/mcp-orchestrator/src/services/ProjectService.ts` - Needs project management methods
- `/packages/mcp-orchestrator/src/services/TaskService.ts` - Has project context methods

### Environment State
- Branch: main
- Last Commit: Phase 1 implementation complete
- Tests: None yet
- Build: Not built

## Next Steps

### Immediate Actions Required

1. Enhance ProjectService with:
   ```typescript
   async switchProject(projectName: string, options?: {
     projectId?: string;
     createIfMissing?: boolean;
   }): Promise<Project> {
     // Logic to switch active project
   }
   ```

2. Implement actual project switching:
   - Check if project exists by name or ID
   - Create project if `createIfMissing` is true
   - Update current project context in TaskService
   - Return project details

3. Connect ProjectTools to ProjectService:
   - Remove mock implementation
   - Call actual service method
   - Handle errors appropriately

### Recommended Approach

The key insight is that TaskService already tracks the current project:

```typescript
// In ProjectService
async switchProject(projectName: string, options) {
  // 1. Find project by name or create if needed
  let project = await this.findProjectByName(projectName);
  
  if (!project && options.createIfMissing) {
    project = await this.createProject({
      name: projectName,
      status: 'active'
    });
  }
  
  if (!project) {
    throw new Error(`Project not found: ${projectName}`);
  }
  
  // 2. Update current context in TaskService
  this.taskService.setCurrentProject(project.id);
  
  // 3. Return project details
  return project;
}
```

### Potential Challenges
- ⚠️ Project name uniqueness - enforce in database
- ⚠️ Task synchronization - what happens to in-progress tasks?
- ⚠️ State persistence - current project should persist across restarts

## Context & Decisions

### Key Decisions Made
- Project names must be unique
- Default project ("default") always exists
- Switching project affects all new tasks
- `sync_tasks` parameter reserved for future use

### Open Questions
- ❓ Should project switch affect existing task queries? (No for MVP)
- ❓ How to persist current project between sessions? (Consider config file)
- ❓ Should we validate project status before switch? (Yes, only active/on_hold)

### Dependencies
- Requires: TaskService for context management
- Blocks: Multi-project workflows

## Resources

### Documentation
- Project Model - See `Project` interface in types/index.ts
- TaskService - Check setCurrentProject/getCurrentProject methods
- Database Schema - Projects table in StateService

### Related Tasks
- T.200.02.02.02 - Project status (next task)
- T.200.02.01.01 - Task assignment (parallel work)

### Contacts
- Tony - Architecture decisions
- Benjamin - If you need TaskService help
- Quinn - Will test this functionality

## Handoff Checklist

- [x] All code changes committed
- [x] Tests passing (none yet)
- [x] Documentation updated
- [x] Active files listed
- [x] Next steps clear
- [x] Questions documented

## Additional Notes

The ProjectSwitchSchema expects:
```typescript
{
  project_name: string;      // Required
  project_id?: string;       // Optional, for direct ID switch
  create_if_missing?: bool;  // Default false
  sync_tasks?: bool;         // Default true (future feature)
}
```

Key integration points:
1. TaskService already has project context methods
2. Projects table exists with proper schema
3. Every task has a project_id field

For MVP, focus on:
1. Finding project by name
2. Creating if requested
3. Updating TaskService context
4. Clear success/error messages

The mock shows expected response format. Keep it simple - we can enhance later!

Good luck, Felix!