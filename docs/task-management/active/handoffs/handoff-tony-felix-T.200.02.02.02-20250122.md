# Agent Handoff: T.200.02.02.02 - Implement mosaic_project_status

**From**: TL-LEAD-TONY  
**To**: FS-FULLSTACK-FELIX  
**Date**: 2025-01-22T11:30:00Z  
**Task ID**: T.200.02.02.02  
**Priority**: High  
**Epic**: E.200 - OpenCode TUI Integration  

## 🎯 Task Overview

Enhance the `mosaic_project_status` tool to provide comprehensive project status information including task statistics, agent activity, and project health metrics.

## 📋 Previous Context

You've successfully completed:
- T.200.02.02.01: Implemented `mosaic_project_switch` with full project management capabilities
- The ProjectService now has methods for switching, creating, and finding projects

Benjamin has completed:
- T.200.02.01.01: Implemented `mosaic_task_assign` with agent validation

## 🎯 Task Requirements

### 1. Enhance ProjectService.getProjectStatus Method

The basic method exists but needs enhancement:

```typescript
async getProjectStatus(projectId: string): Promise<ProjectStatusReport>
```

### 2. Comprehensive Status Report Structure

```typescript
export interface ProjectStatusReport {
  project: {
    id: string;
    name: string;
    status: ProjectStatus;
    owner: string;
    created_at: Date;
    updated_at: Date;
  };
  
  task_statistics: {
    total: number;
    by_status: Record<TaskStatus, number>;
    by_type: Record<TaskType, number>;
    by_priority: Record<Priority, number>;
    overdue: number;
    due_today: number;
    due_this_week: number;
  };
  
  agent_activity: {
    active_agents: string[];
    tasks_by_agent: Record<string, number>;
    recent_completions: Array<{
      task_id: string;
      task_title: string;
      completed_by: string;
      completed_at: Date;
    }>;
  };
  
  project_health: {
    completion_rate: number;  // percentage
    on_time_rate: number;     // percentage
    blocked_tasks: number;
    critical_path_length: number;
    estimated_completion: Date | null;
  };
  
  recent_activity: Array<{
    timestamp: Date;
    type: 'task_created' | 'task_completed' | 'task_updated' | 'agent_assigned';
    description: string;
    actor?: string;
  }>;
}
```

### 3. SQL Queries Needed

1. Task statistics by status, type, priority
2. Overdue tasks (deadline < now && status != 'completed')
3. Tasks due today/this week
4. Active agents (distinct assignees with in_progress tasks)
5. Recent completions (last 10)
6. Recent activity (last 20 events)

### 4. Tool Handler Update

Update the handler to support optional filters:
```typescript
case 'mosaic_project_status':
  // Support project_name or project_id
  // Add optional include_agents filter
  // Add optional include_activity filter
  // Format the response nicely
```

## 📁 Files to Modify

1. **src/services/ProjectService.ts**
   - Enhance `getProjectStatus` method
   - Add multiple SQL queries for statistics
   - Calculate health metrics

2. **src/tools/handlers/projectHandlers.ts**
   - Update case for 'mosaic_project_status'
   - Add support for filters
   - Format response for readability

3. **src/types/index.ts**
   - Add ProjectStatusReport interface
   - Add related type definitions

4. **tests/project-status.test.ts** (create new)
   - Test comprehensive status report
   - Test with various project states
   - Test calculation accuracy

## 🔧 Implementation Notes

1. **Performance Considerations**:
   - Use efficient SQL queries with proper indexes
   - Consider caching for expensive calculations
   - Limit activity logs to recent items

2. **Health Metrics**:
   - Completion rate = (completed_tasks / total_tasks) * 100
   - On-time rate = (tasks completed before deadline / total completed) * 100
   - Critical path = longest chain of dependencies

3. **Date Calculations**:
   - Use proper timezone handling
   - Consider business days for estimates

## ✅ Success Criteria

1. Comprehensive status report with all sections
2. Accurate statistics and calculations
3. Efficient SQL queries (< 100ms total)
4. Clear, formatted tool output
5. Unit tests with good coverage
6. Handles edge cases (empty projects, etc.)

## 🚀 Next Steps

After completing this task:
1. Create visual status dashboard design (future)
2. Add trend analysis (future enhancement)
3. Move to E.100 package structure planning

## 📝 Testing Commands

```bash
# Build and test
npm run build
npm test tests/project-status.test.ts

# Manual test
node tests/manual-test-project-status.js
```

## 🎯 Estimated Time

3-4 hours for implementation and testing

## 📊 Example Output

```
Project Status: MosAIc SDK Development
Status: active | Owner: system
Created: 2025-01-20 | Updated: 2025-01-22

📊 Task Statistics:
Total Tasks: 47
├─ By Status:
│  ├─ pending: 15
│  ├─ in_progress: 8
│  ├─ completed: 20
│  └─ blocked: 4
├─ By Priority:
│  ├─ critical: 3
│  ├─ high: 12
│  └─ medium: 32
└─ Timeline:
   ├─ Overdue: 2
   ├─ Due Today: 5
   └─ Due This Week: 18

👥 Agent Activity:
Active Agents: 6
├─ BE-BACKEND-BENJAMIN: 5 tasks
├─ FS-FULLSTACK-FELIX: 4 tasks
└─ QA-QUALITY-QUINN: 3 tasks

🏥 Project Health:
├─ Completion Rate: 42.6%
├─ On-Time Rate: 87.5%
├─ Blocked Tasks: 4
└─ Est. Completion: 2025-02-15
```

---

**Remember**: 
- Focus on providing actionable insights
- Keep performance in mind
- Make the output human-readable
- Test with various project states