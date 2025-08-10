# Task Handoff: T.200.02.01.01 - Implement mosaic_task_assign

**From Agent**: TL-LEAD-TONY  
**To Agent**: BE-BACKEND-BENJAMIN  
**Handoff Type**: Expertise  
**Date/Time**: 2025-01-22T10:00:00Z  

## Task Status

**Current State**: Not Started  
**Completion**: 0% complete  
**Time Spent**: 0 hours  
**Remaining Estimate**: 4 hours  

## Work Completed

### Accomplishments
- ✅ Designed tool specification in MCP-SERVER-SPECIFICATION.md
- ✅ Created basic tool structure in TaskTools.ts
- ✅ Implemented mock handler returning simulated response

### Code Changes
- File: `/packages/mcp-orchestrator/src/tools/TaskTools.ts` - Created assignTask mock implementation
- File: `/packages/mcp-orchestrator/src/types/index.ts` - Defined types for task assignment

### Artifacts Created
- Tool Specification - `/docs/task-management/active/E.200/design/MCP-SERVER-SPECIFICATION.md`
- Input Schema - Already defined in `AssignTaskSchema`

## Current State

### Active Files
- `/packages/mcp-orchestrator/src/tools/TaskTools.ts` - Contains the assignTask method to implement
- `/packages/mcp-orchestrator/src/services/TaskService.ts` - Has the assignTask method that needs enhancement

### Environment State
- Branch: main
- Last Commit: Implemented Phase 1 of mcp-orchestrator
- Tests: None yet (to be created)
- Build: Not yet built

## Next Steps

### Immediate Actions Required
1. Enhance `TaskService.assignTask()` method with:
   - Validation that assignee exists (for now, just format validation)
   - Priority override if provided
   - Deadline tracking
   - Assignment history/audit trail

2. Update the `assignTask` tool handler in TaskTools.ts to:
   - Remove the "simulation" warning
   - Actually call the TaskService
   - Handle all input parameters properly

3. Add database support for:
   - Assignment history table (optional for MVP)
   - Assignee validation (basic for now)

### Recommended Approach

```typescript
// In TaskService.ts
async assignTask(taskId: string, assignee: string, options?: {
  priority?: Priority;
  deadline?: string;
  notes?: string;
  assigneeType?: 'agent' | 'human' | 'team';
}): Promise<Task> {
  // 1. Validate task exists
  // 2. Validate assignee format (DOMAIN-ROLE-NAME for agents)
  // 3. Update task with new assignee and options
  // 4. Log assignment in history (if implemented)
  // 5. Return updated task
}
```

### Potential Challenges
- ⚠️ Assignee validation - for MVP, just validate format, don't check existence
- ⚠️ Assignment history - could be skipped for MVP, just add TODO
- ⚠️ Concurrent assignments - use transactions if implementing history

## Context & Decisions

### Key Decisions Made
- Tool accepts both priority override and deadline
- Three assignee types: agent, human, team
- Format validation for agent names (DOMAIN-ROLE-NAME pattern)

### Open Questions
- ❓ Should we track assignment history in MVP? (Recommend: No, add TODO)
- ❓ Should we validate assignee exists? (Recommend: No, just format validation)

### Dependencies
- Blocked by: Nothing
- Blocks: Testing of task assignment workflows

## Resources

### Documentation
- MCP Specification - `/packages/mcp-orchestrator/src/types/index.ts`
- Task Model - See `Task` interface in types
- Tool Patterns - Check other tools in TaskTools.ts for patterns

### Related Tasks
- T.200.02.01.02 - Implement task dependencies (next task)
- T.200.02.03.01 - Unit tests will test this

### Contacts
- Tony - Architecture questions
- Felix - If you need integration help
- Quinn - Will need this for testing

## Handoff Checklist

- [x] All code changes committed
- [x] Tests passing (none exist yet)
- [x] Documentation updated
- [x] Active files listed
- [x] Next steps clear
- [x] Questions documented

## Additional Notes

The AssignTaskSchema already defines the expected inputs:
```typescript
{
  task_id: string;          // Required
  assignee: string;         // Required  
  assignee_type?: string;   // Optional: agent|human|team
  priority?: Priority;      // Optional: priority override
  deadline?: string;        // Optional: ISO date string
  notes?: string;          // Optional: assignment notes
}
```

Focus on getting basic assignment working first, then enhance with history/validation if time permits. The mock implementation shows the expected response format.

Good luck, Benjamin! This should be straightforward - the patterns are already established from the create and status tools.