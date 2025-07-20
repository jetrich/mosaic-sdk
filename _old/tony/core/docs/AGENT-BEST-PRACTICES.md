# Agent Best Practices - Universal Coordination Standards

**Module**: AGENT-BEST-PRACTICES.md  
**Version**: 2.0 Modular Architecture  
**Dependencies**: None (Tony-independent)  
**Load Context**: Agent coordination sessions  
**Purpose**: Universal agent management standards for all development workflows  

## 🎯 Agent Coordination Philosophy

### Research-Driven Development
**Principle**: NO GUESSING - agents must research solutions thoroughly before implementation  
**Implementation**: All agents must use available tools to research, analyze, and validate solutions  
**Verification**: Agents must cite sources and demonstrate understanding before proceeding  

### Atomic Task Architecture
**Principle**: Deploy specialized agents for single, focused tasks (≤30 minutes)  
**Benefits**: Avoid command fatigue, prevent task pollution, ensure clear accountability  
**Implementation**: Break complex work into atomic units with specific, measurable objectives  

## 🔧 Tool Authorization & Configuration

### Universal Tool Requirements
All agents MUST be deployed with proper tool authorization:

```bash
# Planning and architecture agents (use Opus for complex reasoning)
claude -p "planning-instructions" --model opus --allowedTools="Read,Glob,Grep,WebSearch,WebFetch,Task"

# Research and analysis agents (use Opus for comprehensive analysis)
claude -p "research-instructions" --model opus --allowedTools="Read,Glob,Grep,WebSearch,WebFetch,Task"

# Development and coding agents (use Sonnet for implementation)
claude -p "dev-instructions" --model sonnet --allowedTools="Read,Write,Edit,MultiEdit,Bash,LS,Glob,Grep"

# Testing and QA agents (use Sonnet for testing implementation)
claude -p "test-instructions" --model sonnet --allowedTools="Read,Write,Edit,Bash,NotebookRead,NotebookEdit"

# Task breakdown and coordination (use Opus for complex task planning)
claude -p "coordination-instructions" --model opus --allowedTools="Read,Write,Edit,Glob,Grep,TodoRead,TodoWrite"
# Security and audit agents (use Opus for comprehensive analysis)
claude -p "security-instructions" --model opus --allowedTools="Read,Glob,Grep,WebSearch,WebFetch,Bash"

# QA validation agents (use Sonnet for verification implementation)
claude -p "qa-instructions" --model sonnet --allowedTools="Read,Bash,Glob,Grep"
```

## 🧠 Model Selection Strategy

### When to Use Opus (--model opus)
**Complex Reasoning Tasks**:
- **Planning & Architecture**: System design, complex feature planning, multi-step coordination
- **Research & Analysis**: Comprehensive codebase analysis, technology research, solution evaluation
- **Security Assessment**: Threat modeling, vulnerability analysis, attack vector identification
- **Task Coordination**: Breaking down complex projects, dependency analysis, resource planning
- **Problem Solving**: Debugging complex issues, optimization strategies, architectural decisions

**Characteristics**: Deep reasoning, comprehensive analysis, complex decision-making, strategic thinking

### When to Use Sonnet (--model sonnet)
**Implementation & Execution Tasks**:
- **Development & Coding**: Feature implementation, bug fixes, code refactoring, API development
- **Testing & QA**: Test writing, validation scripts, quality assurance verification
- **Configuration**: Environment setup, deployment scripts, build configurations
- **Documentation**: Code documentation, API docs, technical writing
- **Maintenance**: Code cleanup, dependency updates, routine optimizations

**Characteristics**: Fast execution, precise implementation, efficient coding, reliable outputs

### Model Selection Examples

```bash
# ✅ CORRECT: Use Opus for complex planning
claude -p "Plan the migration from monolithic to microservices architecture" \
  --model opus --allowedTools="Read,Glob,Grep,WebSearch,WebFetch"

# ✅ CORRECT: Use Sonnet for implementation
claude -p "Implement the user authentication API endpoints" \
  --model sonnet --allowedTools="Read,Write,Edit,MultiEdit,Bash"

# ✅ CORRECT: Use Opus for security analysis
claude -p "Perform comprehensive security audit and threat modeling" \
  --model opus --allowedTools="Read,Glob,Grep,WebSearch,Bash"

# ✅ CORRECT: Use Sonnet for testing
claude -p "Write unit tests for the payment processing module" \
  --model sonnet --allowedTools="Read,Write,Edit,Bash"
```

### Cost-Effectiveness Guidelines
- **Opus**: Reserve for tasks requiring deep reasoning and complex analysis (20-30% of tasks)
- **Sonnet**: Use for implementation and routine tasks (70-80% of tasks)
- **Task Duration**: Longer planning tasks justify Opus; shorter implementation tasks use Sonnet
- **Complexity Assessment**: If the task requires "thinking through" multiple approaches, use Opus

### Tool Security Standards
- **Read-Only Operations**: Use Read, Glob, Grep for analysis phases
- **Controlled Modifications**: Use Edit/MultiEdit for precise changes
- **System Operations**: Use Bash only for verified, safe commands
- **Web Research**: Use WebSearch/WebFetch for solution research
- **Validation**: Never grant more tools than needed for specific task

## 🔬 Test-First Development Methodology

### CRITICAL: Test-First Requirements (Updated July 2025)
**MANDATORY**: All agents MUST prepare tests BEFORE any coding implementation

**📋 Complete Testing Standards**: Agents must follow [TESTING-METHODOLOGY.md](./TESTING-METHODOLOGY.md) for comprehensive testing requirements and Tony Framework testing infrastructure usage.

#### Test-First Workflow
1. **Understand Requirements**: Analyze the task and expected behavior
2. **Write Test Cases**: Create comprehensive test cases covering all scenarios
3. **Verify Test Failure**: Ensure tests fail before implementation (red phase)
4. **Implement Code**: Write minimal code to make tests pass (green phase)
5. **Refactor**: Improve code quality while maintaining test success (refactor phase)
6. **Independent QA**: Submit for independent verification

#### Test Coverage Requirements
- **Unit Tests**: Cover all functions, methods, and edge cases
- **Integration Tests**: Verify component interactions
- **Edge Cases**: Include boundary conditions and error scenarios
- **Performance Tests**: For critical paths and bottlenecks
- **Security Tests**: For authentication, authorization, and data handling

#### Test-First Templates
```typescript
// EXAMPLE: Test-First Template for TypeScript
describe('FeatureName', () => {
  // Write these tests BEFORE implementing the feature
  it('should handle normal case', () => {
    // Test implementation
    expect(actualResult).toBe(expectedResult);
  });

  it('should handle edge case', () => {
    // Edge case test
  });

  it('should handle error case', () => {
    // Error handling test
  });
});
```

### Independent QA Verification Protocol (Added July 2025)
**MANDATORY**: All agent completion claims MUST be verified by an independent QA agent

#### QA Verification Requirements
1. **No Self-Certification**: Agents cannot verify their own work
2. **Independent Agent**: QA must be performed by a different agent
3. **Comprehensive Testing**: All tests must be re-run by QA agent
4. **Build Verification**: Ensure builds succeed in clean environment
5. **Documentation Review**: Verify all documentation is updated

#### QA Agent Deployment
```bash
# Deploy independent QA agent for verification
claude -p "Verify completion of task ${TASK_ID} implemented by ${ORIGINAL_AGENT}. 
Run all tests, verify build success, check documentation updates. 
Report PASS/FAIL with evidence." \
  --model sonnet \
  --allowedTools="Read,Bash,Glob,Grep"
```

#### QA Checklist
- [ ] All tests written before code implementation
- [ ] Test coverage meets minimum requirements (≥85%)
- [ ] All tests passing independently
- [ ] Build succeeds in clean environment
- [ ] No regressions in existing functionality
- [ ] Documentation updated appropriately
- [ ] Security scan shows no new vulnerabilities
- [ ] Performance within acceptable limits

## 🏗️ Atomic Task Decomposition

### Task Duration Standards
- **Maximum Duration**: 30 minutes per atomic task
- **Optimal Duration**: 5-10 minutes for maximum efficiency
- **Verification Time**: Include testing/validation in duration estimate
- **Documentation Time**: Include progress updates in duration estimate

### Task Breakdown Methodology
```markdown
# Atomic Task Template

## Task ID: P.TTT.SS.AA
- **P**: Phase Number (1 digit)
- **TTT**: Task Number (3 digits, resets per phase)  
- **SS**: Subtask Number (2 digits)
- **AA**: Atomic Task Number (2 digits)

## Task Definition
- **Objective**: Specific, measurable goal
- **Duration**: ≤ 30 minutes
- **Dependencies**: Prerequisites clearly listed
- **Success Criteria**: Verifiable completion conditions
- **Files Affected**: Specific file paths and operations
- **Testing**: Validation steps and expected results
```

### Task Complexity Guidelines
- **Simple Tasks (5-10 min)**: Single file edits, configuration changes, documentation updates
- **Medium Tasks (15-20 min)**: Multi-file changes, function implementations, test creation
- **Complex Tasks (25-30 min)**: Integration work, refactoring, complex algorithms
- **Invalid Tasks (>30 min)**: Must be broken into smaller atomic units

## 🎭 Agent Specialization Standards

### Agent Type Classifications

#### Research Agents
**Purpose**: Analysis, investigation, solution research  
**Tools**: Read, Glob, Grep, WebSearch, WebFetch, Task  
**Duration**: 10-20 minutes for comprehensive research  
**Deliverables**: Research reports, solution recommendations, technical analysis  

#### Development Agents  
**Purpose**: Code implementation, file modifications  
**Tools**: Read, Write, Edit, MultiEdit, Bash, LS, Glob, Grep  
**Duration**: 15-30 minutes for implementation tasks  
**Deliverables**: Working code, updated files, implementation documentation  

#### Testing Agents
**Purpose**: Test creation, validation, quality assurance  
**Tools**: Read, Write, Edit, Bash, NotebookRead, NotebookEdit  
**Duration**: 10-25 minutes for test implementation  
**Deliverables**: Test suites, coverage reports, validation results  

#### QA Validation Agents
**Purpose**: Independent verification of completion claims  
**Tools**: Read, Bash, Glob, Grep (verification-focused)  
**Duration**: 5-15 minutes for validation tasks  
**Deliverables**: Pass/fail reports, verification documentation  

#### Security Agents
**Purpose**: Security analysis, vulnerability assessment  
**Tools**: Read, Grep, WebSearch, Bash (security-focused)  
**Duration**: 15-30 minutes for security tasks  
**Deliverables**: Security reports, vulnerability assessments, remediation plans  

## 📊 Performance Standards & Quality Gates

### Code Quality Requirements
- **TypeScript Projects**: Strict mode enabled, zero TypeScript errors
- **JavaScript Projects**: ESLint zero errors, consistent style guide compliance
- **Python Projects**: Black formatting, mypy type checking, pylint score >8.0
- **All Projects**: Google Style Guide compliance for respective languages

### Testing Requirements
- **Minimum Coverage**: 85% test coverage for all new code
- **Test Success Rate**: 80% minimum passing tests before claiming completion
- **Integration Testing**: All components must have integration test coverage
- **Performance Testing**: Critical paths must have performance benchmarks

### Build & Deployment Gates
- **Build Success**: All builds must pass before claiming "production ready"
- **Environment Validation**: Test environments must be verified before test claims
- **Dependency Resolution**: All dependencies resolved and verified
- **Security Scanning**: No high-severity vulnerabilities in production builds

## 🚨 Session Management Protocols

### Concurrent Agent Limits
- **Maximum Concurrent**: 5 agents maximum per coordination session
- **Resource Monitoring**: Track CPU, memory, and file system usage
- **Process Management**: Monitor agent processes for health and performance
- **Graceful Degradation**: Reduce concurrent agents if system performance degrades

### Agent Lifecycle Management
```bash
# Agent deployment template with model selection
AGENT_NAME="analysis-agent"
TASK_ID="1.001.01.01"
TASK_TYPE="analysis"  # Options: planning, analysis, coding, testing, security
LOG_FILE="logs/agent-tasks/${AGENT_NAME}/${AGENT_NAME}-${TASK_ID}.log"

# Select model based on task type
case "$TASK_TYPE" in
    "planning"|"analysis"|"security"|"coordination")
        MODEL="opus"
        ;; 
    "coding"|"testing"|"configuration"|"documentation")
        MODEL="sonnet"
        ;;
    *)
        MODEL="sonnet"  # Default to Sonnet for unknown task types
        ;;
esac

# Launch agent with monitoring
nohup claude -p "${AGENT_INSTRUCTION_TEXT}" \
  --model "$MODEL" \
  --allowedTools="${REQUIRED_TOOLS}" \
  > "$LOG_FILE" 2>&1 &

# Monitor agent health
AGENT_PID=$!
echo "Agent ${AGENT_NAME} launched with PID ${AGENT_PID} using model: $MODEL"

# Example usage:
# TASK_TYPE="analysis" → Uses Opus for comprehensive analysis
# TASK_TYPE="coding" → Uses Sonnet for efficient implementation
```

### Agent Communication Protocols
- **Log-Based Communication**: All agents write to structured log files
- **Status Updates**: Regular progress updates in standardized format
- **Error Reporting**: Structured error reporting with context and recovery suggestions
- **Completion Verification**: Independent verification of all completion claims

## ⚡ Emergency & Crisis Management

### Crisis Response Protocols
- **Response Time**: <30 minutes for critical system failures
- **Emergency Agents**: Deploy immediate diagnostic and corrective agents
- **Escalation Path**: Clear escalation to senior agents for complex issues
- **Communication**: Update all stakeholders via coordination logs

### Error Recovery Procedures
- **Automatic Rollback**: Revert changes on critical failures
- **State Preservation**: Save working state before risky operations
- **Recovery Documentation**: Document all recovery procedures for future reference
- **Post-Incident Analysis**: Analyze failures to prevent recurrence

### Agent Accountability Measures
- **Completion Verification**: Independent QA validation for all completion claims
- **False Claim Prevention**: Zero tolerance for false completion claims
- **Build Verification**: Mandatory build success before "production ready" claims
- **Evidence Requirements**: Agents must provide verifiable evidence of completion

## 🔄 Agent Coordination Workflows

### Multi-Agent Coordination
```markdown
# Coordination Workflow Template

Phase 1: Research & Analysis
├── Research Agent: Solution investigation (15 min)
├── Analysis Agent: Technical assessment (20 min)
└── Planning Agent: Implementation strategy (10 min)

Phase 2: Implementation  
├── Frontend Agent: UI implementation (30 min)
├── Backend Agent: API implementation (30 min)
└── Database Agent: Schema updates (20 min)

Phase 3: Quality Assurance
├── Testing Agent: Test implementation (25 min)
├── QA Agent: Verification and validation (15 min)
└── Security Agent: Security assessment (20 min)
```

### Dependency Management
- **Sequential Dependencies**: Clear ordering for dependent tasks
- **Parallel Execution**: Independent tasks run concurrently
- **Resource Conflicts**: Prevent multiple agents modifying same files
- **Communication**: Agents communicate via standardized log formats

### Progress Monitoring
- **Real-Time Monitoring**: Track agent progress via log analysis
- **Blocking Issue Detection**: Automated detection of agent failures or blocks
- **Resource Usage Tracking**: Monitor system resources during multi-agent operations
- **Performance Metrics**: Track task completion times and success rates

## 🚨 Automated Failure Recovery Protocol (Added July 2025)

### Self-Healing Recovery Workflow
When agent work fails QA verification or encounters blocking issues:

1. **Failure Detection & Parsing**
   - QA agents provide structured failure reports
   - Automated parsing extracts error details, affected files, root causes
   - Failure context prepared for planning agent

2. **Recovery Planning Agent Deployment**
   ```bash
   # Example automated recovery deployment
   claude -p "RECOVERY PLANNING AGENT:
   Failure Type: TypeScript Compilation Errors
   Affected Files: [List of files with errors]
   Error Count: [Number of errors]
   Previous Agent: [Agent that failed]
   
   Use Ultrathink to create remediation plan with:
   - Root cause analysis
   - Atomic task breakdown
   - Agent deployment sequence
   - Success criteria" \
   --model opus \
   --allowedTools="Read,Grep,Task"
   ```

3. **Iterative Test-Code-QA Cycles**
   - Deploy test fix agents first (RED phase)
   - Deploy implementation agents (GREEN phase)
   - Deploy QA verification (independent)
   - Repeat until success or max iterations

4. **Success Criteria**
   - All tests compile and run
   - Test coverage meets requirements
   - Independent QA passes
   - No regressions introduced
   - Documentation updated

### Recovery Agent Types

#### Environment Setup Agents
**Purpose**: Fix missing dependencies, configuration issues  
**Tools**: Read, Write, Edit, Bash  
**Success**: Environment allows tests to run  

#### Test Repair Agents  
**Purpose**: Fix compilation errors in tests  
**Tools**: Read, Write, Edit, MultiEdit  
**Success**: All tests compile without changing logic  

#### Implementation Agents
**Purpose**: Make tests pass through code changes  
**Tools**: Read, Write, Edit, MultiEdit, Bash  
**Success**: All tests pass (GREEN phase)  

#### Verification Agents
**Purpose**: Independent validation of fixes  
**Tools**: Read, Bash, Grep  
**Success**: Meet all quality gates  

### Failure Pattern Database
Document and learn from failures:
- **TypeScript Errors**: Missing types, wrong imports, interface mismatches
- **Test Failures**: Wrong assertions, missing mocks, environment issues
- **Build Failures**: Missing dependencies, configuration errors
- **Integration Issues**: API mismatches, version conflicts

### Maximum Iteration Limits
- **Simple Fixes**: 3 iterations maximum
- **Complex Issues**: 5 iterations maximum
- **Escalation**: Human intervention if limits exceeded

## 📈 Continuous Improvement

### Agent Performance Metrics
- **Task Completion Rate**: Percentage of successfully completed tasks
- **Accuracy Rate**: Correctness of agent outputs and claims
- **Efficiency**: Average time per task type
- **Quality Score**: Code quality metrics and standards compliance

### Feedback Loops
- **Post-Task Reviews**: Analyze agent performance after task completion
- **Process Optimization**: Improve agent instructions based on results
- **Tool Refinement**: Optimize tool authorization based on usage patterns
- **Standards Evolution**: Update best practices based on lessons learned

### Knowledge Management
- **Agent Learning**: Document successful patterns and approaches
- **Error Patterns**: Track common failure modes and prevention strategies
- **Best Practice Evolution**: Continuously refine agent coordination standards
- **Template Updates**: Improve agent instruction templates based on experience

---

**Module Status**: ✅ Agent coordination standards ready  
**Independence**: Usable without Tony framework  
**Integration**: Enhances any multi-agent workflow  
**Scalability**: Supports 1-5 concurrent agents efficiently  
**Quality Assurance**: Comprehensive verification and accountability measures