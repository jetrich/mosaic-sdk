# Agent Handoff Protocol

**Version**: 2.0  
**Last Updated**: 2025-01-22  
**Status**: Active  

## Overview

This document defines the standardized protocol for task handoffs between agents, ensuring continuity, quality, and efficient collaboration across the MosAIc SDK development.

## Handoff Types

### 1. Task Completion Handoff
When an agent completes a task and hands off to the next agent in the workflow.

### 2. Shift Change Handoff
When an agent's session ends and another agent takes over the same task.

### 3. Expertise Handoff
When a task requires different expertise and is transferred between specialists.

### 4. Escalation Handoff
When a task encounters blockers and needs higher-level intervention.

## Standard Handoff Template

```markdown
# Task Handoff: [Task ID] - [Task Title]

**From Agent**: [Agent Name]  
**To Agent**: [Agent Name]  
**Handoff Type**: [Completion/Shift/Expertise/Escalation]  
**Date/Time**: [ISO 8601]  

## Task Status

**Current State**: [Not Started/In Progress/Blocked/Complete]  
**Completion**: [X]% complete  
**Time Spent**: [X] hours  
**Remaining Estimate**: [X] hours  

## Work Completed

### Accomplishments
- ✅ [Specific item completed]
- ✅ [Another completed item]

### Code Changes
- File: [path/to/file] - [Description of changes]
- File: [path/to/file] - [Description of changes]

### Artifacts Created
- [Document/Diagram/Config] - [Location]

## Current State

### Active Files
- [path/to/file] - [Why it's relevant]

### Environment State
- Branch: [branch-name]
- Last Commit: [commit-hash]
- Tests: [Passing/Failing]
- Build: [Success/Failed]

## Next Steps

### Immediate Actions Required
1. [Specific next action]
2. [Another action]

### Recommended Approach
[Brief guidance on how to proceed]

### Potential Challenges
- ⚠️ [Warning about complexity]
- ⚠️ [Known issue to watch for]

## Context & Decisions

### Key Decisions Made
- [Decision] - [Rationale]

### Open Questions
- ❓ [Unresolved question]

### Dependencies
- Blocked by: [What's blocking]
- Blocks: [What this blocks]

## Resources

### Documentation
- [Relevant doc] - [Link/Location]

### Related Tasks
- [Task ID] - [How it relates]

### Contacts
- [Role/Team] - [When to contact them]

## Handoff Checklist

- [ ] All code changes committed
- [ ] Tests passing (or documented why not)
- [ ] Documentation updated
- [ ] Active files listed
- [ ] Next steps clear
- [ ] Questions documented
```

## Specific Handoff Scenarios

### Backend to Frontend Handoff

**Additional Required Information**:
- API endpoints created/modified
- Request/Response schemas
- Authentication requirements
- Example API calls
- Integration points

### Development to QA Handoff

**Additional Required Information**:
- Test scenarios to focus on
- Known issues/limitations
- Test data requirements
- Performance expectations
- Edge cases to verify

### Implementation to Documentation Handoff

**Additional Required Information**:
- Feature overview
- User workflows
- Configuration options
- Code examples
- Common troubleshooting

### Individual to Team Lead Handoff

**Additional Required Information**:
- Strategic decisions needed
- Resource requirements
- Risk assessment
- Timeline impacts
- Stakeholder communications

## Handoff Best Practices

### DO:
1. **Be Specific**: Use exact file paths, function names, and line numbers
2. **Show Progress**: Include completion percentages and time spent
3. **Provide Context**: Explain WHY decisions were made
4. **Document Blockers**: Clearly state what's preventing progress
5. **Include Examples**: Show code snippets, commands, or configs
6. **Test Before Handoff**: Ensure the work is in a stable state

### DON'T:
1. **Don't Assume Knowledge**: Explain domain-specific terms
2. **Don't Leave Loose Ends**: Commit all changes, close all files
3. **Don't Skip Testing**: Always run tests before handoff
4. **Don't Forget Documentation**: Update relevant docs
5. **Don't Hide Problems**: Be transparent about issues

## Emergency Handoff Protocol

When time is critical or unexpected handoff is needed:

### Minimum Required Information
```markdown
# EMERGENCY HANDOFF: [Task ID]

**Critical Issue**: [What's wrong]
**Immediate Action**: [What must be done NOW]
**Current State**: [Branch/Commit/File]
**Contact**: [Who to reach for questions]

## Quick Status
- Last Action: [What was just done]
- Next Action: [What needs doing]
- Blocker: [What's stopping progress]
```

## Handoff Quality Checklist

### Before Creating Handoff:
- [ ] All work saved and committed
- [ ] Tests run (results documented)
- [ ] Build status checked
- [ ] Documentation reviewed
- [ ] Dependencies identified

### Handoff Document Quality:
- [ ] Uses standard template
- [ ] All sections completed
- [ ] Specific and actionable
- [ ] Includes necessary context
- [ ] References all resources

### After Handoff:
- [ ] Receiving agent acknowledged
- [ ] Questions answered
- [ ] Handoff document saved
- [ ] Task status updated
- [ ] Time logged

## Handoff Storage

### Location Standards
- **Active Handoffs**: `/docs/task-management/active/handoffs/`
- **Completed Handoffs**: `/docs/task-management/completed/[epic-id]/handoffs/`
- **Emergency Handoffs**: `/docs/task-management/active/emergency/`

### Naming Convention
- Standard: `handoff-[from-agent]-[to-agent]-[task-id]-[YYYYMMDD].md`
- Emergency: `emergency-handoff-[task-id]-[YYYYMMDD-HHMM].md`

## Handoff Metrics

### Track for Improvement:
1. **Handoff Clarity Score**: Receiving agent rates 1-5
2. **Rework Required**: How much needed redoing
3. **Time to Productive**: How long to resume progress
4. **Questions Generated**: Number of clarifications needed

### Quality Indicators:
- ✅ Receiving agent productive within 15 minutes
- ✅ No critical information missing
- ✅ Less than 3 clarification questions
- ✅ No rework required

## Current Active Handoffs

| From | To | Task | Type | Status | Document |
|------|-----|------|------|---------|----------|
| Tony | Benjamin | T.200.02.01.01 | Expertise | Pending | [Link] |
| Tony | Felix | T.200.02.02.01 | Expertise | Pending | [Link] |
| Tony | Quinn | T.200.02.03.01 | Expertise | Pending | [Link] |

---

**Remember**: Good handoffs save more time than they take to create. When in doubt, over-communicate!