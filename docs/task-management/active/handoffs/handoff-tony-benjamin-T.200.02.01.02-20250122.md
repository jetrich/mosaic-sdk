# Agent Handoff: T.200.02.01.02 - Implement mosaic_task_depend

**From**: TL-LEAD-TONY  
**To**: BE-BACKEND-BENJAMIN  
**Date**: 2025-01-22T11:30:00Z  
**Task ID**: T.200.02.01.02  
**Priority**: High  
**Epic**: E.200 - OpenCode TUI Integration  

## 🎯 Task Overview

Implement the `mosaic_task_depend` tool that allows agents to manage task dependencies, creating blocking relationships between tasks to ensure proper execution order.

## 📋 Previous Context

You've successfully completed:
- T.200.02.01.01: Implemented `mosaic_task_assign` with full validation and agent support
- The TaskService now has a robust `assignTask` method with proper validation

Felix has completed:
- T.200.02.02.01: Implemented `mosaic_project_switch` with project context management

## 🎯 Task Requirements

### 1. Implement TaskService.addDependency Method
```typescript
async addDependency(
  taskId: string, 
  dependsOnTaskId: string,
  options?: {
    type?: 'blocks' | 'depends_on';
    strict?: boolean;
  }
): Promise<TaskDependency>
```

### 2. Validation Requirements
- Both tasks must exist
- Cannot create circular dependencies
- Cannot depend on completed tasks (unless strict=false)
- Cannot depend on cancelled/archived tasks
- Validate dependency doesn't already exist

### 3. Database Schema
The `task_dependencies` table already exists:
```sql
CREATE TABLE task_dependencies (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  depends_on_task_id TEXT NOT NULL,
  dependency_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  created_by TEXT,
  notes TEXT,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id)
);
```

### 4. Tool Handler Update
Update `src/tools/handlers/taskHandlers.ts`:
```typescript
case 'mosaic_task_depend':
  // Implement using TaskService.addDependency
  // Handle the dependency type mapping
  // Return success with dependency details
```

### 5. Type Definitions
Add to `src/types/index.ts`:
```typescript
export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: 'blocks' | 'depends_on';
  created_at: Date;
  created_by?: string;
  notes?: string;
}
```

## 📁 Files to Modify

1. **src/services/TaskService.ts**
   - Add `addDependency` method
   - Add dependency validation logic
   - Add circular dependency detection

2. **src/tools/handlers/taskHandlers.ts**
   - Update case for 'mosaic_task_depend'
   - Map tool parameters to service method

3. **src/types/index.ts**
   - Add TaskDependency interface
   - Update any related types

4. **tests/task-dependency.test.ts** (create new)
   - Test successful dependency creation
   - Test circular dependency prevention
   - Test validation cases

## 🔧 Implementation Notes

1. **Circular Dependency Detection**:
   - Use recursive traversal to check for cycles
   - Consider performance for deep dependency chains

2. **Status Validation**:
   - By default, don't allow dependencies on completed tasks
   - The `strict` option can override this

3. **Error Messages**:
   - "Task not found: {taskId}"
   - "Circular dependency detected"
   - "Cannot depend on completed task"
   - "Dependency already exists"

## ✅ Success Criteria

1. Method successfully creates dependencies
2. Circular dependencies are prevented
3. All validation rules are enforced
4. Tool handler works correctly
5. Unit tests pass with good coverage
6. No TypeScript errors

## 🚀 Next Steps

After completing this task:
1. Update the tool handler test
2. Run the manual test script
3. Update this handoff with completion status
4. Move on to T.200.02.01.03 (Enhance task querying)

## 📝 Testing Commands

```bash
# Build and test
npm run build
npm test tests/task-dependency.test.ts

# Manual test
node tests/manual-test-dependencies.js
```

## 🎯 Estimated Time

2-3 hours for implementation and testing

---

**Remember**: 
- Check for existing patterns in the codebase
- Maintain consistency with the assignTask implementation
- Update tests as you go
- Ask if you need clarification