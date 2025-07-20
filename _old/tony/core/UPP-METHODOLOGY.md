# UPP - Ultrathink Planning Protocol

## Overview

The Ultrathink Planning Protocol (UPP) is Tony's core methodology for breaking down complex software projects into manageable, atomic tasks that can be implemented by specialized AI agents.

## The Six-Level Hierarchy

### 1. Epic (E.XXX)
**Definition**: High-level project goals or major system components  
**Duration**: Weeks to months  
**Example**: `E.001 - User Authentication System`

**Characteristics**:
- Represents a complete, deployable feature set
- Contains multiple features
- Aligns with business objectives
- Has clear success criteria

### 2. Feature (F.XXX.XX)
**Definition**: Major functional components within an epic  
**Duration**: Days to weeks  
**Example**: `F.001.01 - User Registration`

**Characteristics**:
- User-facing functionality
- Can be released independently
- Contains multiple user stories
- Has measurable outcomes

### 3. Story (S.XXX.XX.XX)
**Definition**: Specific user-facing functionality  
**Duration**: 1-3 days  
**Example**: `S.001.01.01 - Email Registration Flow`

**Characteristics**:
- Written from user perspective
- Has acceptance criteria
- Independently testable
- Delivers user value

### 4. Task (T.XXX.XX.XX.XX)
**Definition**: Developer-level implementation work  
**Duration**: 2-8 hours  
**Example**: `T.001.01.01.01 - Create User Model`

**Characteristics**:
- Technical implementation unit
- Assigned to specific agent type
- Has clear technical requirements
- Produces working code

### 5. Subtask (ST.XXX.XX.XX.XX.XX)
**Definition**: Specific implementation steps  
**Duration**: 30 minutes - 2 hours  
**Example**: `ST.001.01.01.01.01 - Define User Schema`

**Characteristics**:
- Focused technical work
- Single responsibility
- Clear input/output
- Easily verifiable

### 6. Atomic (A.XXX.XX.XX.XX.XX.XX)
**Definition**: Smallest unit of work  
**Duration**: ≤30 minutes  
**Example**: `A.001.01.01.01.01.01 - Create user.model.js file`

**Characteristics**:
- Cannot be broken down further
- Single file or function
- Immediately testable
- Clear completion criteria

## UPP Best Practices

### 1. Decomposition Rules
- Each level should have 2-7 children (optimal: 3-5)
- Total atomic tasks per epic: 50-200
- Maintain clear dependencies
- Ensure no orphaned tasks

### 2. Naming Conventions
```
E.001 - Authentication System
  F.001.01 - User Registration
    S.001.01.01 - Email Registration
      T.001.01.01.01 - Backend API
        ST.001.01.01.01.01 - User Model
          A.001.01.01.01.01.01 - Schema Definition
```

### 3. Time Estimation
- Atomic: 15-30 minutes
- Subtask: 30-120 minutes
- Task: 2-8 hours
- Story: 1-3 days
- Feature: 3-10 days
- Epic: 2-8 weeks

### 4. Agent Assignment
Different agent types handle different levels:
- **Tech Lead Tony**: Epic/Feature planning
- **Implementation Agents**: Task/Subtask/Atomic execution
- **QA Agents**: Story/Task validation
- **Documentation Agents**: Feature/Epic documentation

## Example Decomposition

```
E.001 - E-Commerce Shopping Cart
  F.001.01 - Cart Management
    S.001.01.01 - Add Items to Cart
      T.001.01.01.01 - Frontend Implementation
        ST.001.01.01.01.01 - Cart Component
          A.001.01.01.01.01.01 - Create CartItem.jsx
          A.001.01.01.01.01.02 - Add item click handler
          A.001.01.01.01.01.03 - Update cart state
        ST.001.01.01.01.02 - API Integration
          A.001.01.01.01.02.01 - Create addToCart API call
          A.001.01.01.01.02.02 - Handle API response
          A.001.01.01.01.02.03 - Error handling
      T.001.01.01.02 - Backend Implementation
        ST.001.01.01.02.01 - Cart Model
          A.001.01.01.02.01.01 - Define cart schema
          A.001.01.01.02.01.02 - Create model file
        ST.001.01.01.02.02 - Cart Controller
          A.001.01.01.02.02.01 - Create POST endpoint
          A.001.01.01.02.02.02 - Validate input
          A.001.01.01.02.02.03 - Save to database
```

## Task Dependencies

### Dependency Types
1. **Sequential**: Task B requires Task A completion
2. **Parallel**: Tasks can execute simultaneously
3. **Conditional**: Task execution depends on outcome
4. **Resource**: Tasks share limited resources

### Dependency Notation
```
T.001.01.01.01 → T.001.01.01.02 (Sequential)
T.001.01.01.03 || T.001.01.01.04 (Parallel)
T.001.01.01.05 ? T.001.01.01.06 : T.001.01.01.07 (Conditional)
```

## Quality Gates

### Per Level Requirements
- **Atomic**: Code compiles, basic functionality works
- **Subtask**: Unit tests pass, code reviewed
- **Task**: Integration tests pass, documented
- **Story**: Acceptance criteria met, user tested
- **Feature**: Performance validated, deployed
- **Epic**: Business objectives achieved, metrics tracked

## Automation with Tony

### 1. Natural Language Planning
```
"Hey Tony, break down a user authentication system"
```

### 2. Automatic Decomposition
Tony analyzes requirements and creates:
- Complete UPP hierarchy
- Time estimates
- Agent assignments
- Dependency graph

### 3. Progressive Execution
- Tony executes atomic tasks first
- Validates subtasks when atoms complete
- Bubbles up completion through hierarchy
- Maintains project status in real-time

## Benefits of UPP

### 1. Predictability
- Accurate time estimates
- Clear progress tracking
- Early risk identification

### 2. Parallelization
- Multiple agents work simultaneously
- Optimal resource utilization
- Faster delivery

### 3. Quality
- Each level has validation
- Problems caught early
- Consistent standards

### 4. Flexibility
- Easy to adjust scope
- Reusable components
- Clear impact analysis

## Integration with Context System

Each UPP level maintains context:
```json
{
  "task_context": {
    "current_task": {
      "id": "T.001.01.01.01",
      "hierarchy": {
        "epic": "E.001",
        "feature": "F.001.01",
        "story": "S.001.01.01",
        "task": "T.001.01.01.01"
      }
    }
  }
}
```

This enables seamless handoffs between agents at any level of the hierarchy.

---

The UPP methodology is the foundation of Tony's ability to manage complex projects autonomously. By breaking work into atomic units, Tony ensures that every piece of functionality is implemented correctly, tested thoroughly, and integrated seamlessly.