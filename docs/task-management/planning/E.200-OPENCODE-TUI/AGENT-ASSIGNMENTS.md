# Agent Assignments - E.200 OpenCode TUI Integration

**Epic**: E.200  
**Document Version**: 1.0  
**Last Updated**: 2025-07-21  
**Status**: Active Planning  

## Agent Persona Definitions

### Planning & Architecture Agents (Opus Model)

#### TL-LEAD-TONY
**Role**: Tech Lead / Epic Coordinator  
**Model**: Opus  
**Responsibilities**:
- Epic-level coordination and planning
- Cross-feature dependency management
- Architecture decisions
- Agent task assignment
- Risk assessment and mitigation

**Tools**: `Read,Glob,Grep,WebSearch,WebFetch,Task,TodoWrite,TodoRead`

#### ARCH-SYSTEMS-ALEX
**Role**: Systems Architect  
**Model**: Opus  
**Responsibilities**:
- System architecture design
- Integration patterns
- Technical specifications
- Performance architecture
- Security architecture

**Tools**: `Read,Glob,Grep,WebSearch,WebFetch,Task`

#### PLAN-STRATEGIC-PAULA
**Role**: Strategic Planner  
**Model**: Opus  
**Responsibilities**:
- Feature breakdown and dependencies
- Resource planning
- Timeline estimation
- Risk identification
- Success criteria definition

**Tools**: `Read,Glob,Grep,TodoWrite,TodoRead`

### Research & Analysis Agents (Opus Model)

#### RESEARCH-ANALYST-RYAN
**Role**: Research Analyst  
**Model**: Opus  
**Responsibilities**:
- OpenCode codebase analysis
- Technology research
- Best practices identification
- Integration point discovery
- Solution evaluation

**Tools**: `Read,Glob,Grep,WebSearch,WebFetch,Task`

#### SEC-SECURITY-SARAH
**Role**: Security Analyst  
**Model**: Opus  
**Responsibilities**:
- Security implications assessment
- Vulnerability analysis
- Authentication/authorization review
- Data privacy compliance
- Security best practices

**Tools**: `Read,Glob,Grep,WebSearch,WebFetch,Bash`

#### PERF-OPTIMIZER-OLIVIA
**Role**: Performance Analyst  
**Model**: Opus  
**Responsibilities**:
- Performance impact analysis
- Bottleneck identification
- Optimization strategies
- Benchmark design
- Resource utilization analysis

**Tools**: `Read,Glob,Grep,WebSearch,WebFetch,Bash`

### Implementation Agents (Sonnet Model)

#### BE-BACKEND-BENJAMIN
**Role**: Backend Developer  
**Model**: Sonnet  
**Responsibilities**:
- MCP server implementation
- API development
- Database integration
- Server-side logic
- Integration layer development

**Tools**: `Read,Write,Edit,MultiEdit,Bash,LS,Glob,Grep`

#### FE-FRONTEND-FIONA
**Role**: Frontend Developer  
**Model**: Sonnet  
**Responsibilities**:
- Web UI components
- React/TypeScript development
- Terminal integration
- User interface implementation
- Responsive design

**Tools**: `Read,Write,Edit,MultiEdit,Bash,LS,Glob,Grep`

#### FS-FULLSTACK-FELIX
**Role**: Full Stack Developer  
**Model**: Sonnet  
**Responsibilities**:
- Integration layer development
- End-to-end features
- API connectivity
- WebSocket implementation
- Cross-system coordination

**Tools**: `Read,Write,Edit,MultiEdit,Bash,LS,Glob,Grep`

#### DEVOPS-OPERATIONS-OLIVER
**Role**: DevOps Engineer  
**Model**: Sonnet  
**Responsibilities**:
- Deployment configuration
- CI/CD pipeline updates
- Container setup
- Infrastructure as code
- Monitoring setup

**Tools**: `Read,Write,Edit,MultiEdit,Bash,LS,Glob,Grep`

### Quality Assurance Agents (Sonnet Model)

#### QA-QUALITY-QUINN
**Role**: QA Engineer  
**Model**: Sonnet  
**Responsibilities**:
- Integration testing
- End-to-end testing
- Bug identification
- Test plan creation
- Quality metrics

**Tools**: `Read,Write,Edit,Bash,NotebookRead,NotebookEdit`

#### TEST-AUTOMATION-TARA
**Role**: Test Automation Engineer  
**Model**: Sonnet  
**Responsibilities**:
- Test suite development
- Automated test creation
- CI/CD test integration
- Performance testing
- Test coverage analysis

**Tools**: `Read,Write,Edit,Bash,NotebookRead,NotebookEdit`

#### DOC-TECHNICAL-DIANA
**Role**: Technical Writer  
**Model**: Sonnet  
**Responsibilities**:
- Documentation updates
- API documentation
- User guides
- Developer guides
- README maintenance

**Tools**: `Read,Write,Edit,MultiEdit,Glob,Grep`

## Feature-Level Assignments

### F.200.01: MCP Server Plugin Architecture

**Lead**: BE-BACKEND-BENJAMIN  
**Support**: ARCH-SYSTEMS-ALEX, FS-FULLSTACK-FELIX  

#### Story Assignments
- **S.200.01.01**: RESEARCH-ANALYST-RYAN → ARCH-SYSTEMS-ALEX
- **S.200.01.02**: BE-BACKEND-BENJAMIN
- **S.200.01.03**: BE-BACKEND-BENJAMIN → FS-FULLSTACK-FELIX
- **S.200.01.04**: QA-QUALITY-QUINN → TEST-AUTOMATION-TARA

### F.200.02: Configuration Integration

**Lead**: FS-FULLSTACK-FELIX  
**Support**: BE-BACKEND-BENJAMIN  

#### Story Assignments
- **S.200.02.01**: FS-FULLSTACK-FELIX
- **S.200.02.02**: FS-FULLSTACK-FELIX → BE-BACKEND-BENJAMIN
- **S.200.02.03**: BE-BACKEND-BENJAMIN

### F.200.03: Web UI Tabbed Interface

**Lead**: FE-FRONTEND-FIONA  
**Support**: FS-FULLSTACK-FELIX  

#### Story Assignments
- **S.200.03.01**: FE-FRONTEND-FIONA
- **S.200.03.02**: FS-FULLSTACK-FELIX → FE-FRONTEND-FIONA
- **S.200.03.03**: FE-FRONTEND-FIONA
- **S.200.03.04**: FE-FRONTEND-FIONA

### F.200.04: Task Synchronization

**Lead**: BE-BACKEND-BENJAMIN  
**Support**: FS-FULLSTACK-FELIX  

#### Story Assignments
- **S.200.04.01**: FS-FULLSTACK-FELIX
- **S.200.04.02**: BE-BACKEND-BENJAMIN
- **S.200.04.03**: BE-BACKEND-BENJAMIN → FS-FULLSTACK-FELIX
- **S.200.04.04**: FS-FULLSTACK-FELIX

### F.200.05: Style Consistency Framework

**Lead**: FE-FRONTEND-FIONA  
**Support**: DOC-TECHNICAL-DIANA  

#### Story Assignments
- **S.200.05.01**: FE-FRONTEND-FIONA
- **S.200.05.02**: FE-FRONTEND-FIONA
- **S.200.05.03**: FE-FRONTEND-FIONA → FS-FULLSTACK-FELIX

## Task Assignment Protocol

### Assignment Process
1. Tony assigns features to lead agents
2. Lead agents break down stories into tasks
3. Tasks assigned based on agent expertise
4. Handoffs documented in context files
5. Progress tracked in task management system

### Handoff Protocol
```markdown
# Task Handoff Template

## From: [Agent Name]
## To: [Agent Name]
## Task: [Task ID - Description]

### Completed Work
- What was done
- Key decisions made
- Files modified

### Remaining Work
- What needs to be done
- Open questions
- Blockers

### Resources
- Relevant files
- Documentation
- Dependencies

### Context
- Why this approach
- Alternative considered
- Risk factors
```

## Agent Deployment Commands

### Planning & Architecture
```bash
# Tony - Epic Coordination
claude -p "You are Tech Lead Tony coordinating E.200 OpenCode TUI Integration" \
  --model opus \
  --allowedTools="Read,Glob,Grep,WebSearch,WebFetch,Task,TodoWrite,TodoRead"

# Alex - System Architecture
claude -p "You are Systems Architect Alex designing the MCP server architecture" \
  --model opus \
  --allowedTools="Read,Glob,Grep,WebSearch,WebFetch,Task"
```

### Research & Analysis
```bash
# Ryan - Research Analyst
claude -p "You are Research Analyst Ryan analyzing OpenCode implementation" \
  --model opus \
  --allowedTools="Read,Glob,Grep,WebSearch,WebFetch,Task"

# Sarah - Security Analyst
claude -p "You are Security Analyst Sarah reviewing security implications" \
  --model opus \
  --allowedTools="Read,Glob,Grep,WebSearch,WebFetch,Bash"
```

### Implementation
```bash
# Benjamin - Backend Developer
claude -p "You are Backend Developer Benjamin implementing MCP server" \
  --model sonnet \
  --allowedTools="Read,Write,Edit,MultiEdit,Bash,LS,Glob,Grep"

# Fiona - Frontend Developer
claude -p "You are Frontend Developer Fiona creating Web UI components" \
  --model sonnet \
  --allowedTools="Read,Write,Edit,MultiEdit,Bash,LS,Glob,Grep"
```

### Quality Assurance
```bash
# Quinn - QA Engineer
claude -p "You are QA Engineer Quinn testing OpenCode integration" \
  --model sonnet \
  --allowedTools="Read,Write,Edit,Bash,NotebookRead,NotebookEdit"

# Diana - Technical Writer
claude -p "You are Technical Writer Diana updating documentation" \
  --model sonnet \
  --allowedTools="Read,Write,Edit,MultiEdit,Glob,Grep"
```

## Communication Channels

### Daily Sync Points
- **Morning**: Task assignments reviewed
- **Midday**: Blocker identification
- **Evening**: Progress updates

### Documentation Updates
- Agent context files: Real-time
- Task status: On completion
- Handoff documents: Before transition
- Epic tracking: Daily summary

## Success Metrics Per Agent

### Planning Agents
- Clear task decomposition
- Accurate time estimates
- Risk identification rate
- Dependency mapping

### Implementation Agents
- Code quality (ESLint score)
- Test coverage (>95%)
- Performance targets met
- Zero security vulnerabilities

### QA Agents
- Bug discovery rate
- Test automation coverage
- Documentation completeness
- User guide clarity

## Escalation Path

1. **Task Blockers**: Agent → Feature Lead
2. **Feature Issues**: Feature Lead → Tony
3. **Epic Risks**: Tony → Project Management
4. **Technical Decisions**: Alex → Architecture Board

## Notes

- All agents must read their context files before starting
- Handoffs must include all necessary context
- Daily progress updates required
- Atomic tasks should complete in ≤30 minutes