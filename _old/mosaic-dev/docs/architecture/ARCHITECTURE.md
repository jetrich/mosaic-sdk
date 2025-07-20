# Tony-NG Project Architecture

## Overview

Tony-NG is a comprehensive multi-agent development platform that combines two major components:

1. **Tech Lead Tony Framework** - A natural language orchestration system for AI agents
2. **Tony-NG Application** - A full-stack web application for managing multi-agent development workflows

This document clarifies the architecture, component relationships, and the distinction between these two parts.

## What is Claude?

Claude is Anthropic's AI assistant that powers all the agents in the Tony-NG ecosystem. When we refer to "agents" in this project, we mean instances of Claude that are given specific roles and instructions to perform development tasks. The Tony Framework orchestrates these Claude agents to work together on complex software projects.

## Component Architecture

### 1. Tech Lead Tony Framework

**Purpose**: Orchestrates multiple Claude AI agents to work autonomously on software development tasks.

**Location**: `framework/` (currently in root directory)

**Key Components**:
- **TONY-CORE.md**: Central coordination logic and session management
- **AGENT-BEST-PRACTICES.md**: Standards for agent deployment and quality
- **DEVELOPMENT-GUIDELINES.md**: Universal development standards
- **AGENT-HANDOFF-PROTOCOL.md**: Enables autonomous agent-to-agent handoffs
- **Context System**: JSON-based context passing between agents
- **Shell Scripts**: CLI tools for agent deployment and management

**How it Works**:
1. User provides a task or PRD (Product Requirements Document)
2. Tony analyzes and decomposes the task using UPP (Ultrathink Planning Protocol)
3. Tony deploys specialized Claude agents for each atomic task
4. Agents work autonomously, passing context between handoffs
5. Quality gates ensure test-first development and validation

### 2. Tony-NG Application

**Purpose**: Web-based platform for visualizing and managing multi-agent development workflows.

**Location**: `tony-ng/` subdirectory (to be renamed to `application/`)

**Technology Stack**:
- **Frontend**: React 18, TypeScript, Material-UI v7
- **Backend**: NestJS, TypeORM, PostgreSQL
- **Real-time**: WebSockets, Redis pub/sub
- **Terminal**: xterm.js with node-pty backend
- **API**: GraphQL and REST endpoints

**Key Features**:
- Project and task management dashboard
- Real-time agent activity monitoring
- Web-based terminal for direct interaction
- Task decomposition visualization
- Agent orchestration control panel
- Authentication and multi-tenancy

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                             │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐         │
│  │   Web UI    │  │   Terminal   │  │   REST/GraphQL │         │
│  │  (React)    │  │  (xterm.js)  │  │      API       │         │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘         │
│         │                 │                   │                   │
└─────────┼─────────────────┼───────────────────┼─────────────────┘
          │                 │                   │
┌─────────▼─────────────────▼───────────────────▼─────────────────┐
│                    Tony-NG Backend (NestJS)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐         │
│  │Orchestration│  │   WebSocket  │  │     Task       │         │
│  │   Service   │  │   Gateway    │  │ Decomposition  │         │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘         │
│         │                 │                   │                   │
└─────────┼─────────────────┼───────────────────┼─────────────────┘
          │                 │                   │
┌─────────▼─────────────────▼───────────────────▼─────────────────┐
│              Tech Lead Tony Framework (Shell/Node)               │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐         │
│  │   Context   │  │    Agent     │  │     Tony       │         │
│  │   System    │  │   Spawner    │  │     Core       │         │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘         │
│         │                 │                   │                   │
└─────────┼─────────────────┼───────────────────┼─────────────────┘
          │                 │                   │
          └─────────────────▼───────────────────┘
                            │
                  ┌─────────▼──────────┐
                  │   Claude AI API    │
                  │    (Anthropic)     │
                  └────────────────────┘
```

## Data Flow

### 1. Task Initiation Flow
```
User → Web UI → Backend API → Tony Framework → Task Decomposition
```

### 2. Agent Deployment Flow
```
Tony Core → Context Creation → Agent Spawner → Claude API → Agent Execution
```

### 3. Agent Handoff Flow
```
Agent A → Context Update → Handoff Protocol → Agent B → Continuation
```

### 4. Monitoring Flow
```
Agent Activity → WebSocket → Backend → Redis Pub/Sub → Web UI Updates
```

## Directory Structure (Current vs. Proposed)

### Current Structure (Confusing)
```
tony-ng/
├── framework files (mixed in root)
├── tony-ng/              # Nested application directory
│   ├── frontend/
│   ├── backend/
│   └── package.json
├── docs/
├── scripts/
└── junk/test-autonomous-tony/
```

### Proposed Structure (Clear)
```
tony-ng/
├── framework/            # Tony Framework components
│   ├── core/
│   ├── scripts/
│   └── templates/
├── application/          # Tony-NG Web Application
│   ├── frontend/
│   ├── backend/
│   └── shared/
├── infrastructure/       # Deployment configurations
├── docs/                # All documentation
├── examples/            # Example projects
└── scripts/            # Root-level utilities
```

## Key Concepts

### UPP (Ultrathink Planning Protocol)
A hierarchical task decomposition methodology:
- **E**pic: High-level project goals
- **F**eature: Major functional components
- **S**tory: User-facing functionality
- **T**ask: Developer-level work items
- **S**ubtask: Specific implementation steps
- **A**tomic: 30-minute maximum units of work

### Agent Types
- **Tech Lead Tony**: Master orchestrator and planner
- **Implementation Agents**: Code writers (frontend, backend, etc.)
- **QA Agents**: Testing and validation
- **Security Agents**: Security analysis and fixes
- **DevOps Agents**: Deployment and infrastructure
- **Recovery Agents**: Failure analysis and remediation

### Context System
JSON-based state transfer mechanism that enables agents to:
- Maintain session continuity
- Understand previous work
- Continue without re-instruction
- Track evidence and validation

## Deployment Architecture

### Development Environment
- Local Docker Compose setup
- Hot-reloading for frontend and backend
- Local PostgreSQL and Redis instances

### Production Environment
- Kubernetes deployment (optional)
- Horizontal scaling for backend services
- Redis cluster for session management
- PostgreSQL with replication
- CDN for static assets

## Security Architecture

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- API key management for external integrations
- Session management via Redis

### Agent Security
- Sandboxed execution environments
- Read-only access by default
- Explicit tool authorization required
- Audit logging of all agent actions

## Integration Points

### External Systems
1. **Claude API**: Core AI engine
2. **GitHub**: Code repository management
3. **CI/CD Systems**: Build and deployment triggers
4. **Monitoring**: Prometheus/Grafana compatible

### Internal APIs
1. **REST API**: Traditional CRUD operations
2. **GraphQL API**: Complex queries and subscriptions
3. **WebSocket**: Real-time updates
4. **Shell Scripts**: CLI integration

## Performance Considerations

### Scalability
- Stateless backend services
- Redis for distributed caching
- PostgreSQL connection pooling
- Horizontal pod autoscaling

### Optimization
- React code splitting
- GraphQL query optimization
- Database query indexing
- CDN for static assets

## Future Architecture Goals

1. **Microservices Migration**: Split monolithic backend
2. **Plugin System**: Extensible agent capabilities
3. **Multi-Model Support**: Beyond Claude to other AI models
4. **Distributed Execution**: Agent work across multiple nodes
5. **Enhanced Monitoring**: AI-powered anomaly detection

---

This architecture document will be updated as the project evolves. For specific component details, refer to the documentation in each module's directory.