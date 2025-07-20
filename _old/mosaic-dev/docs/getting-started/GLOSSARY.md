# Tony-NG Project Glossary

This glossary defines key terms used throughout the Tony-NG project to ensure clarity and consistency.

## A

**Agent**
- An instance of Claude AI given a specific role and instructions to perform development tasks
- Examples: implementation-agent, qa-agent, security-agent

**Agent Chain**
- The sequence of agents that have worked on a particular task or session
- Tracked in the context system for accountability and continuity

**Agent Handoff**
- The process of one agent completing its work and passing context to the next agent
- Enabled by the Agent Handoff Protocol for autonomous operation

**Atomic Task**
- The smallest unit of work in the UPP hierarchy
- Must be completable in 30 minutes or less
- Format: A.XXX.XX.XX.XX.XX.XX

**ATHMS**
- Autonomous Task Hierarchy Management System
- Manages task decomposition and agent assignments

## C

**Claude**
- Anthropic's AI assistant that powers all agents in the Tony-NG ecosystem
- Available in different models: Opus (complex tasks) and Sonnet (standard tasks)

**Context**
- JSON-based state information passed between agents
- Contains session info, task details, project state, and handoff instructions

**Context Injection**
- The process of providing an agent with full context from previous agents
- Enables autonomous operation without manual re-instruction

**Context System**
- The infrastructure for creating, validating, and managing agent contexts
- Includes scripts like spawn-agent.sh and context-manager.sh

## E

**Epic**
- Highest level in the UPP task hierarchy
- Represents major project goals or components
- Format: E.XXX

## F

**Feature**
- Second level in the UPP hierarchy under Epic
- Represents major functional components
- Format: F.XXX.XX

## M

**Model Selection**
- Choosing between Claude Opus (complex) or Sonnet (standard) based on task complexity
- Opus for planning/architecture, Sonnet for implementation

## P

**PRD**
- Product Requirements Document
- Defines what needs to be built
- Starting point for Tony's task decomposition

## Q

**QA Agent**
- Quality Assurance agent that validates implementations
- Performs testing, code review, and verification
- Must provide independent validation (no self-certification)

## S

**Scratchpad**
- Markdown file where agents maintain session notes and continuity
- Located in docs/agent-management/{agent-name}/scratchpad.md
- Being replaced by the context system

**Session**
- A continuous workflow involving multiple agents
- Identified by a unique session ID (UUID format)
- Maintains continuity across agent handoffs

**Sonnet**
- Claude's standard model for most development tasks
- More token-efficient than Opus
- Default choice for implementation work

**Story**
- Third level in the UPP hierarchy
- Represents user-facing functionality
- Format: S.XXX.XX.XX

**Subtask**
- Fifth level in the UPP hierarchy
- Specific implementation steps
- Format: ST.XXX.XX.XX.XX.XX

## T

**Task**
- Fourth level in the UPP hierarchy
- Developer-level work items
- Format: T.XXX.XX.XX.XX

**Tech Lead Tony**
- The master orchestrator agent
- Analyzes requirements, creates plans, and coordinates other agents
- Uses natural language understanding for task management

**Test-First Development**
- Mandatory methodology where tests are written before implementation
- Part of Tony Framework v2.3.0 requirements
- Ensures quality and prevents false completion claims

**Tony Framework**
- The orchestration system that manages AI agents
- Includes core components, best practices, and handoff protocols
- Enables natural language software development

**Tony-NG**
- Next Generation of the Tony platform
- Refers to both the overall project and the web application
- Full-stack platform for multi-agent development

## U

**UPP**
- Ultrathink Planning Protocol
- Hierarchical task decomposition methodology
- Epic → Feature → Story → Task → Subtask → Atomic

**Ultrathink**
- Deep analytical thinking process
- Used for complex planning and problem-solving
- Produces comprehensive, well-reasoned solutions

## V

**Validation**
- Process of verifying that implementations meet requirements
- Includes automated tests, manual review, and success criteria
- Required before marking any task as complete

## W

**WebSocket Gateway**
- Real-time communication channel in the backend
- Enables live updates, terminal sessions, and agent monitoring
- Built with NestJS WebSocket support

## Special Terms

**Context-Aware Agent Spawning**
- Launching agents with full context from previous work
- Eliminates need for manual instruction repetition
- Core feature of the autonomous system

**Multi-Agent Orchestration**
- Coordinating multiple AI agents to work on complex projects
- Includes parallel execution, dependencies, and handoffs
- Managed by the Tony Framework

**Natural Language Commands**
- Instructions given to Tony in plain English
- Automatically interpreted and converted to agent deployments
- Example: "Hey Tony, implement user authentication"

**Session Continuity**
- Maintaining state and context across multiple agent invocations
- Prevents loss of work context between agents
- Critical for autonomous operation

---

This glossary is a living document and will be updated as new terms are introduced or existing terms evolve.