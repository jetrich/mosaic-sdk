# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🔴 IMMEDIATE ACTION REQUIRED

**YOU ARE IN THE MOSAIC-SDK PROJECT - TONY 2.8.0 WITH MCP REQUIRED**

Before doing ANYTHING else, you MUST:
1. Type exactly: `cat .mosaic/AGENT-QUICK-REFERENCE.md`
2. Review the Epic E.055 status and project structure below
3. Confirm you understand the current project state

**DO NOT PROCEED WITHOUT COMPLETING THE ABOVE STEPS**

## 📚 CRITICAL: Documentation MUST Follow BookStack Structure

**ALL DOCUMENTATION MUST FOLLOW THE 4-LEVEL HIERARCHY:**
- Shelf → Book → Chapter → Page
- See `ORGANIZATIONAL-STRUCTURE.md` for domain organization rules
- See `docs/bookstack/bookstack-structure-optimized.yaml` for documentation hierarchy
- NEVER create documentation outside the defined structure

## 🚨 CRITICAL: Epic E.055 - MosAIc Stack Transformation In Progress

### ⚡ MANDATORY FIRST READ - ALL AGENTS
**STOP! Before doing ANY work, you MUST:**
1. Check: `.mosaic/AGENT-QUICK-REFERENCE.md` for current status
2. Review: Project structure and active work areas below
3. Verify: Existing worktrees with `git worktree list`

### 🔒 BLOCKED AREAS - DO NOT MODIFY
- ❌ **mosaic/** submodule - Existing platform (NOT our @mosaic/core!)
- ❌ GitHub repository names - Already renamed
- ❌ User-level Tony (~/.claude/tony/) - Testing 2.8.0 here only

### ✅ ACTIVE WORK AREAS
1. **@mosaic/core** (NEW PACKAGE)
   - Worktree: `worktrees/mosaic-worktrees/core-orchestration/`
   - Branch: `feature/core-orchestration`
   - Status: MCP integration complete ✅
   - Next: Enhance with more features

2. **mosaic-mcp** (Renamed from tony-mcp)
   - Add orchestration-specific tools
   - Already integrated with @mosaic/core
   - Port: 3456 (isolated development)

3. **mosaic-dev** (Renamed from tony-dev)
   - Update to @mosaic/dev namespace
   - Maintain SDK testing tools

4. **tony/** submodule (Framework integration)
   - Agent persona system fully migrated here
   - Scripts, templates, and configurations organized
   - Ready for Tony 2.8.0 MCP integration

### 📁 Project Structure
```
mosaic-sdk/
├── .mosaic/                    # MosAIc configuration
│   ├── AGENT-QUICK-REFERENCE.md
│   ├── cache/                  # Build cache
│   ├── claude/                 # Claude config (MCP settings)
│   ├── conf/                   # Configuration files (TODO)
│   ├── data/                   # Isolated database
│   ├── logs/                   # Server logs
│   ├── scripts/                # Utility scripts
│   ├── templates/              # Project templates
│   ├── stack.config.json       # Stack configuration
│   └── version-matrix.json     # Version tracking
├── .claude/                    # Project Claude settings (TODO)
│   ├── settings.json           # Override user settings
│   ├── settings.local.json     # Personal overrides
│   └── commands/               # Project commands
├── mosaic/                     # Submodule (DO NOT MODIFY)
├── mosaic-mcp/                 # MCP server submodule
├── mosaic-dev/                 # Dev tools submodule
├── tony/                       # Tony Framework submodule
│   ├── personas/               # Agent persona definitions
│   │   ├── {domain}/          # Personas by domain
│   │   └── schemas/           # Validation schemas
│   ├── scripts/                # Tony scripts
│   │   └── operations/agents/  # Persona management scripts
│   ├── templates/              # Tony templates
│   │   └── personas/          # Persona templates
│   └── conf/                   # Tony configuration
│       └── paths.conf         # Centralized path config
└── worktrees/                  # Git worktrees
    ├── mosaic-worktrees/
    │   └── core-orchestration/ # @mosaic/core (ACTIVE)
    ├── mosaic-mcp-worktrees/   # For MCP work
    ├── mosaic-dev-worktrees/   # For dev tools
    └── tony-worktrees/         # DO NOT USE YET
```

### 🎯 Epic E.055 Progress Summary
- [x] Repository structure created
- [x] GitHub repos renamed (mosaic-mcp, mosaic-dev)
- [x] @mosaic/core implemented with MCP client
- [x] Isolated dev environment (port 3456)
- [x] MCP integration tested successfully
- [x] Agent persona system migrated to tony submodule
- [x] Tony submodule organized for 2.8.0 integration
- [ ] Tony 2.8.0 MCP requirement implementation
- [ ] Full stack integration testing

### ⚠️ Critical Instructions
1. **ALWAYS** check existing worktrees before creating new ones
2. **NEVER** modify mosaic/ submodule (it's not @mosaic/core)
3. **ALWAYS** use isolated MCP (port 3456) for testing
4. **NEVER** touch tony/ until 2.7.0 complete
5. **ALWAYS** read E055-PROGRESS.md first

## Build Commands

### Initial Setup
```bash
npm run setup          # Install and initialize all submodules
npm run install:all    # Install dependencies in all packages
```

### Development Server
```bash
npm run dev:start      # Start isolated MCP server (port 3456)
npm run dev:stop       # Stop MCP server
npm run dev:status     # Check server status
npm run dev:logs       # View server logs
```

### Building
```bash
npm run build:all      # Build all components
npm run build:mosaic   # Build MosAIc core only
npm run build:mcp      # Build MCP server only
npm run build:dev      # Build dev tools only
```

### Testing
```bash
npm test               # Run all tests
npm run test:mosaic    # Test MosAIc core
npm run test:mcp       # Test MCP server
npm run test:dev       # Test dev tools
```

### Maintenance
```bash
npm run verify         # Verify structure and submodules
npm run update         # Update submodules
npm run clean          # Clean build artifacts
npm run fresh          # Clean install (removes node_modules)
```

### MosAIc CLI Usage
```bash
./mosaic dev start     # Start isolated environment
./mosaic tony plan     # Use MosAIc Tony with isolated MCP
./mosaic claude -p "Help"  # Use MosAIc Claude with isolated MCP
```

## MosAIc SDK Overview

The MosAIc SDK is the evolution of Tony SDK, transforming into an enterprise-scale AI development platform. This meta-repository orchestrates components via Git submodules:

### Core Components
- **@mosaic/core**: NEW orchestration engine for multi-project coordination
- **mosaic-mcp**: Model Context Protocol server (renamed from tony-mcp)
- **mosaic-dev**: Development tools and SDK (renamed from tony-dev)
- **tony**: Tony Framework 2.8.0 with mandatory MCP (pending 2.7.0 completion)

### Version Strategy
- Tony Framework: 2.5.0 (current) → 2.7.0 (in progress) → 2.8.0 (MCP required)
- @mosaic/core: 0.1.0 (new component)
- @mosaic/mcp: 0.1.0 (continuing from tony-mcp)
- @mosaic/dev: 0.1.0 (continuing from tony-dev)

## Architecture Overview

### Project Structure
The MosAIc SDK is a monorepo with git submodules:
- `mosaic/` - Existing MosAIc Platform (separate project - DO NOT MODIFY)
- `mosaic-mcp/` - MCP Server for coordination (@mosaic/mcp)
- `mosaic-dev/` - Development tools and SDK (@mosaic/dev)
- `tony/` - Tony Framework integration (@tony/core)
- `worktrees/` - Git worktrees for parallel development

### MCP-First Architecture
Starting with v2.8.0, all components communicate through MCP (Model Context Protocol):
- Unified state management via MCP server
- Isolated development environment on port 3456
- SQLite database at `.mosaic/data/mcp.db`
- Configuration in `.mosaic/claude/config.json`

### Key Design Principles
1. **Isolation**: Development environment runs independently from other Tony projects
2. **Modularity**: Each component is a separate npm package with its own build
3. **TypeScript**: All code is written in TypeScript with strict mode
4. **Testing**: Comprehensive test coverage with Jest and Playwright
5. **MCP Communication**: All agent coordination happens through MCP infrastructure

### Development Workflow
1. Start the isolated MCP server with `npm run dev:start`
2. Use `./mosaic` CLI wrapper for MosAIc-specific commands
3. Each submodule can be developed independently
4. Changes to submodules require commits in both submodule and parent repo

### Session Context & Agent Coordination

#### Initial Setup for ALL Agents
```bash
# 1. ALWAYS start by checking your location
pwd  # Should be in mosaic-sdk, not tony-sdk

# 2. Read the current status
cat .mosaic/AGENT-QUICK-REFERENCE.md

# 3. Check existing worktrees
git worktree list

# 4. Read Epic E.055 progress
cat docs/agent-management/tech-lead-tony/E055-PROGRESS.md
```

#### Working with Worktrees
```bash
# Create new worktree (if needed)
./scripts/worktree-helper.sh create <repo> <branch> <dir>

# Switch to existing worktree
cd worktrees/mosaic-worktrees/core-orchestration

# Always pull latest changes
git pull origin <branch>
```

#### Tony 2.5.0 vs 2.8.0 Testing
- Production systems use Tony 2.5.0 (stable)
- MosAIc SDK tests Tony 2.8.0 (MCP required)
- Use isolated MCP (port 3456) for 2.8.0 testing
- Project-level config overrides user-level

### Configuration Files
- `.mosaic/claude/config.json` - MCP server configuration
- `.env.development` - Environment variables
- `tsconfig.*.json` - TypeScript configs for different environments
- Each submodule has its own `package.json` and build configuration

### Database Schema
The MCP server uses SQLite for local development with tables for:
- Sessions and state management
- Message history and coordination
- Agent registry and capabilities
- Task tracking and dependencies

When making changes, ensure compatibility with the MCP infrastructure and follow the existing TypeScript patterns in each submodule.

## Important Patterns

### Git Submodules & Worktrees
This meta-repository uses both submodules and worktrees:
```bash
# Update submodules
git pull && git submodule update --init --recursive

# Check worktrees (ALWAYS do this first!)
git worktree list
./scripts/worktree-helper.sh list

# Work in a worktree
cd worktrees/mosaic-worktrees/core-orchestration
```

### Isolated Development Environment
The MosAIc SDK includes an isolated MCP server for testing:
```bash
# Start isolated MCP (port 3456)
./scripts/dev-environment.sh start

# Use MosAIc Tony with isolated MCP
./mosaic tony plan "Create feature X"

# Stop isolated MCP
./scripts/dev-environment.sh stop
```

## Critical Files & Locations

### Epic E.055 Documentation
- `docs/agent-management/tech-lead-tony/E055-PROGRESS.md`: Current status
- `.mosaic/AGENT-QUICK-REFERENCE.md`: Quick reference
- `docs/mosaic-stack/*.md`: Architecture documentation

### @mosaic/core (NEW)
- `worktrees/mosaic-worktrees/core-orchestration/packages/core/`
- Key files: MosaicCore.ts, MCPClient.ts, ProjectManager.ts

### mosaic-mcp (Renamed)
- `mosaic-mcp/src/server/index.ts`: MCP server entry
- `mosaic-mcp/src/tools/`: Orchestration tools
- Database: `.mosaic/data/mcp.db`

### Configuration
- `.mosaic/claude/config.json`: MCP configuration
- `.mosaic/stack.config.json`: Stack configuration
- `.mosaic/version-matrix.json`: Version tracking

## 🎭 Agent Persona System

### Mandatory Persona Assignment
**ALL AGENTS MUST USE A PREDEFINED PERSONA** - No exceptions!

The MosAIc Framework enforces consistent agent behavior through mandatory personas:
- **Naming Pattern**: `DOMAIN-ROLE-NAME` (e.g., BE-BACKEND-BENJAMIN)
- **Domains**: EXECUTIVE, MANAGEMENT, DEVELOPMENT, QUALITY, SECURITY, OPERATIONS, DATA, SUPPORT
- **Validation**: Only personas defined in `tony/personas/` are allowed

### Automatic Persona Selection
The supervisor agent (Tony) automatically selects personas based on task keywords:

**Development Tasks**:
- `backend`, `API`, `server` → **BE-BACKEND-BENJAMIN**
- `frontend`, `UI`, `React` → **FE-FRONTEND-FIONA**
- `full stack`, `integration` → **FS-FULLSTACK-FELIX**
- `database`, `SQL`, `schema` → **DB-DATABASE-DIANA**
- `machine learning`, `ML`, `AI` → **ML-LEARNING-MARCUS**

**Quality & Testing**:
- `testing`, `QA`, `quality` → **QA-QUALITY-QUINN**
- `test automation`, `E2E` → **TEST-AUTOMATION-TARA**
- `performance`, `load testing` → **PERF-PERFORMANCE-PETER**

**Security & Compliance**:
- `security`, `vulnerability` → **SEC-SECURITY-SARAH**
- `compliance`, `audit` → **AUDIT-COMPLIANCE-ALEX**

**Operations**:
- `DevOps`, `deployment`, `CI/CD` → **DEVOPS-OPERATIONS-OLIVER**
- `reliability`, `SRE`, `monitoring` → **SRE-RELIABILITY-RACHEL**

**Management**:
- `coordinate`, `orchestrate` → **TL-LEAD-TONY**
- `project management`, `timeline` → **PM-PROJECT-PAUL**
- `team management` → **EM-ENGINEERING-EMMA**

**Executive**:
- `strategy`, `business plan` → **CEO-STRATEGIC-SOPHIA**
- `architecture`, `system design` → **CTO-TECHNICAL-THOMAS**
- `product`, `user experience` → **CPO-PRODUCT-PATRICIA**

### Manual Persona Override
Supervisors can explicitly assign personas:
```
"Deploy BE-BACKEND-BENJAMIN for task T.055.01.02"
"Use SEC-SECURITY-SARAH to review this code"
```

### Persona Integration with spawn-agent.sh
```bash
# Automatic persona injection
./scripts/spawn-agent.sh \
  --context context.json \
  --agent-type backend-agent \
  --persona BE-BACKEND-BENJAMIN

# List available personas
./tony/scripts/operations/agents/persona-loader.sh --list

# Search for specific personas
./tony/scripts/operations/agents/persona-loader.sh --search frontend
```

### Persona Enforcement Rules
1. **Mandatory Assignment**: Every agent MUST have a persona
2. **Domain Matching**: Persona domain must match task type
3. **No Custom Personas**: Only predefined personas in the system
4. **Model Respect**: Use the persona's preferred model unless overridden
5. **Tool Authorization**: Respect persona's tool restrictions
6. **Communication Style**: Maintain persona's communication patterns

### Persona Files Location
- **Definitions**: `tony/personas/{domain}/{PERSONA-ID}.yaml`
- **Schema**: `tony/personas/schemas/persona-schema.json`
- **Loader**: `tony/scripts/operations/agents/persona-loader.sh`
- **Context**: Extended `tony/personas/schemas/agent-context-schema.json`
- **Base Template**: `tony/templates/personas/base-persona-template.yaml`
- **Documentation**: `docs/projects/tony/agent-management/01-persona-system.md`
- **Requirements**: `docs/stack/setup/prerequisites/05-tony-persona-requirements.md`
- **Path Config**: `tony/conf/paths.conf`

## Notes for Agents

- The SDK uses a two-level deployment: user-level (~/.claude/tony/) and project-level
- All agent logs go to `logs/agent-tasks/{agent-name}/`
- Documentation follows strict directory structure in `docs/`
- Never commit without running tests and build verification
- Use atomic commits with task IDs in commit messages
- **ALWAYS use assigned persona traits and communication style**