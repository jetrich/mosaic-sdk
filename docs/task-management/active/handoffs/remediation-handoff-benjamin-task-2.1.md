# 🧪 Remediation Handoff: Task 2.1 - Test Task Management Tools

**From**: TL-LEAD-TONY  
**To**: BE-BACKEND-BENJAMIN  
**Date**: 2025-01-23T16:20:00Z  
**Priority**: HIGH - Phase 2 Start  
**Task ID**: 2.1  

---

## 🎯 MISSION: Create Comprehensive Tests for Task Management Tools

### **Context**
You just successfully completed Phase 1, achieving 75% test suite pass rate. Now we begin Phase 2 - testing the actual MCP tools that are currently at 0% coverage.

### **Your Assignment**
Create comprehensive tests for all 5 Task Management tools:
1. `mosaic_task_create`
2. `mosaic_task_assign` 
3. `mosaic_task_depend`
4. `mosaic_task_list`
5. `mosaic_task_update`

### **Current State**
- ✅ TaskService implementation exists and works
- ✅ Basic TaskService tests pass
- ❌ No tests for the actual MCP tool handlers
- ❌ 0% coverage on TaskTools.ts

---

## 📋 REQUIREMENTS

### **Success Criteria**
1. ✅ 80%+ code coverage for TaskTools.ts
2. ✅ All 5 task tools have comprehensive tests
3. ✅ Input validation tested for each tool
4. ✅ Service integration tested
5. ✅ Error scenarios covered
6. ✅ Tests follow Phase 1 patterns

### **Test Categories per Tool**
1. **Input Validation** - Zod schema validation
2. **Service Integration** - Actual TaskService calls
3. **Error Handling** - Various failure scenarios
4. **Response Formatting** - Correct output structure
5. **Edge Cases** - Boundary conditions

---

## 🛠️ IMPLEMENTATION GUIDE

### **Step 1: Analyze Existing Code** (1 hour)
1. Review `/packages/mcp-orchestrator/src/tools/TaskTools.ts`
2. Understand each tool's implementation
3. Note the Zod schemas used
4. Identify service dependencies

### **Step 2: Create Test Structure** (1 hour)
```typescript
// /packages/mcp-orchestrator/tests/tools/TaskTools.test.ts
import { TaskTools } from '../../src/tools/TaskTools';
import { TaskService } from '../../src/services/TaskService';
import { Logger } from '../../src/utils/Logger';

describe('TaskTools', () => {
  let taskTools: TaskTools;
  let mockTaskService: jest.Mocked<TaskService>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Setup mocks using Phase 1 patterns
  });

  describe('mosaic_task_create', () => {
    describe('input validation', () => {
      // Test required fields
      // Test optional fields
      // Test invalid inputs
    });

    describe('service integration', () => {
      // Test successful creation
      // Test with all parameters
      // Test service errors
    });

    describe('response format', () => {
      // Test success response
      // Test error response
    });
  });

  // Repeat for other 4 tools...
});
```

### **Step 3: Implement Tests per Tool** (6 hours)

#### **mosaic_task_create Tests**
- Required fields: title, type
- Optional: description, status, priority, etc.
- Test project context integration
- Test response formatting

#### **mosaic_task_assign Tests**
- Required: task_id, assignee
- Test agent name validation (DOMAIN-ROLE-NAME)
- Test priority changes
- Test deadline setting

#### **mosaic_task_depend Tests**
- Required: task_id, depends_on_task_id
- Test circular dependency prevention
- Test dependency types
- Test validation rules

#### **mosaic_task_list Tests**
- Test filtering options
- Test pagination
- Test sorting
- Test empty results

#### **mosaic_task_update Tests**
- Test partial updates
- Test status transitions
- Test field validation
- Test non-existent tasks

### **Step 4: Integration Tests** (2 hours)
- Create end-to-end test scenarios
- Test tool combinations (create → assign → depend)
- Test with real database (integration style)

---

## 📁 KEY FILES

### **File to Test**
`/packages/mcp-orchestrator/src/tools/TaskTools.ts`

### **Create Test File**
`/packages/mcp-orchestrator/tests/tools/TaskTools.test.ts`

### **Reference These Patterns**
- `/packages/mcp-orchestrator/tests/unit/services/TaskService.test.ts` - Mocking patterns
- `/packages/mcp-orchestrator/tests/TaskService.simple.test.ts` - Simple test patterns
- `/packages/mcp-orchestrator/tests/workflow.test.ts` - Tool testing approach

### **Service to Mock**
`/packages/mcp-orchestrator/src/services/TaskService.ts`

---

## ⚠️ TESTING NOTES

### **Common Patterns to Follow**
```typescript
// Input validation test
it('should validate required fields', async () => {
  const result = await taskTools.handleTaskCreate({
    // Missing required field
    type: 'task'
  });
  expect(result.error).toBeDefined();
  expect(result.error.message).toContain('required');
});

// Service integration test
it('should create task via service', async () => {
  mockTaskService.createTask.mockResolvedValue(mockTask);
  
  const result = await taskTools.handleTaskCreate({
    title: 'Test Task',
    type: 'task'
  });
  
  expect(mockTaskService.createTask).toHaveBeenCalledWith({
    title: 'Test Task',
    type: 'task'
  });
  expect(result.success).toBe(true);
});

// Error handling test
it('should handle service errors gracefully', async () => {
  mockTaskService.createTask.mockRejectedValue(new Error('DB Error'));
  
  const result = await taskTools.handleTaskCreate(validInput);
  
  expect(result.error).toBeDefined();
  expect(result.error.message).toContain('DB Error');
});
```

### **Zod Schema Testing**
- Test that schemas match tool definitions
- Validate required vs optional fields
- Test type coercion (if any)
- Test default values

---

## 📊 TRACKING & REPORTING

### **Progress Checkpoints**
- [ ] Test structure created
- [ ] mosaic_task_create tests complete
- [ ] mosaic_task_assign tests complete  
- [ ] mosaic_task_depend tests complete
- [ ] mosaic_task_list tests complete
- [ ] mosaic_task_update tests complete
- [ ] Integration tests complete
- [ ] 80%+ coverage achieved

### **Update Tracker**
- Every 2 hours
- After each tool is fully tested
- Report coverage percentage
- Note any implementation issues

---

## 🎯 TIME ALLOCATION

**Total Estimated Time**: 2 days

- **Day 1**: Structure + 3 tools (create, assign, depend)
- **Day 2**: 2 tools (list, update) + integration tests

**Goal**: Complete by end of Day 2 with 80%+ coverage

---

## 🚨 ESCALATION TRIGGERS

Escalate if you find:
- Tools that don't match their documented interface
- Service methods that don't exist
- Fundamental design flaws
- Security vulnerabilities
- Performance issues

---

**You're starting Phase 2! Your work enables testing all other tool categories. Focus on quality and comprehensive coverage.**

Good luck, Benjamin!