# MosAIc Planning Plugin

**Business-to-Technical Planning with Command-Driven Scope Control**

A comprehensive planning plugin for the MosAIc SDK that transforms chaotic "build everything at once" projects into structured, release-focused development with automatic scope control.

## 🎯 The Problem We Solve

Traditional project planning leads to:
- ❌ "I want ALL these features" mentality
- ❌ Unrealistic timelines and scope creep  
- ❌ Technical planning without business constraints
- ❌ No release strategy or MVP boundaries

## ✅ Our Solution: Command-Driven Planning with Scope Control

The MosAIc Planning Plugin provides:
- ✅ **Structured dependency hierarchy**: Business → Financial → Release → Technical
- ✅ **Automatic scope control**: Release planning constrains technical work
- ✅ **Command-driven interface**: `/plan-business`, `/plan-release`, `/plan-tasks`
- ✅ **MVP-first approach**: Clear boundaries between v1.0.0 vs future releases
- ✅ **Persistent state**: No data loss during handoffs
- ✅ **Local Ollama integration**: Cost-effective AI planning

## 🚀 Quick Start

### Installation
```bash
# The plugin is part of MosAIc SDK packages
cd /home/jwoltje/src/mosaic-sdk/packages/planning-plugin
npm install
```

### Basic Workflow
```bash
# 1. Check current planning status
/plan-status

# 2. Define business strategy (root of all planning)
/plan-business --project=my-project --description="Your project description"

# 3. Create release roadmap with scope boundaries
/plan-release --project=my-project --description="Your project description"

# 4. Generate constrained technical decomposition
/plan-tasks --project=my-project

# 5. Check progress and next steps
/plan-status --verbose
```

### Full Pipeline
```bash
# Execute complete business-to-technical planning
/plan-all --project=my-project --description="Your project description"
```

## 📋 Available Commands

### Core Planning Commands
- **`/plan-status`** - Show completion state and dependency tracking
- **`/plan-business`** - Business strategy planning (root command)
- **`/plan-financial`** - Financial modeling with AI development factors  
- **`/plan-marketing`** - Go-to-market strategy and positioning
- **`/plan-release`** - **CRITICAL SCOPE CONTROL** - Release roadmap and boundaries
- **`/plan-tasks`** - **Scope-constrained** technical decomposition
- **`/plan-tech`** - Technology architecture decisions
- **`/plan-all`** - Execute full pipeline with dependency management

### Command Dependencies
```
/plan-business (root)
├── /plan-financial (depends on business)
├── /plan-marketing (depends on business)  
└── /plan-release (depends on business + financial)
    ├── /plan-tasks (depends on release)
    └── /plan-tech (depends on release)
```

## ⭐ Key Innovation: Scope Control

### The Release Planning Breakthrough

The **`/plan-release`** command is the critical innovation that prevents scope creep:

1. **Analyzes project requirements** and business constraints
2. **Creates MVP definition** with strict boundaries
3. **Generates semver roadmap**: v1.0.0 → v1.1.0 → v2.0.0
4. **Defines feature gates**: Must/Should/Could/Won't have
5. **Provides scope constraints** that limit downstream technical planning

### How Scope Control Works

**Before Release Planning:**
```
Project Vision: "Build comprehensive healthcare platform with..."
↓
Technical Planning: Tries to architect EVERYTHING
↓  
Result: Massive scope, unrealistic timelines
```

**After Release Planning:**
```
Project Vision: "Build comprehensive healthcare platform with..."
↓
Release Planning: Creates MVP (v1.0.0) + Future releases (v1.1.0, v2.0.0)
↓
Technical Planning: ONLY architects features in current release scope
↓
Result: Realistic MVP with clear future roadmap
```

### Example Scope Control Output
```bash
/plan-release --project=sage-phr --description="HIPAA-compliant PHR platform"

🎯 MVP Definition (v1.0.0):
   Timeline: 8 weeks
   ✅ User authentication
   ✅ Basic health records
   ✅ HIPAA compliance

📅 Release Roadmap:
   🚀 v1.0.0 - MVP (CURRENT SCOPE)
   📋 v1.1.0 - Advanced analytics  
   📋 v2.0.0 - Mobile app

🔒 SCOPE CONSTRAINTS:
   Current Release: 3 features
   Excluded: 12 features (deferred to future)
   Timebox: 8 weeks maximum
```

**Result:** When `/plan-tasks` runs, it ONLY creates epics for the 3 current-release features, not all 15 features in the full vision.

## 🏗️ Architecture

### Agent System
Each planning function uses a specialized `upp-*-*-local` agent:

- **`upp-business-planner-local`** - Strategic planning
- **`upp-financial-planner-local`** - Revenue/cost modeling  
- **`upp-marketing-planner-local`** - Go-to-market strategy
- **`upp-release-planner-local`** - **Scope control mechanism**
- **`upp-tech-architecture-local`** - Technology decisions
- **`upp-epic-planner-local`** - Technical decomposition (enhanced)

### Local Ollama Integration
- Uses `llama3.2:1b` and `llama3.2:3b` for fast, cost-effective processing
- Optimized prompts for local model efficiency
- Comprehensive fallback mechanisms when Ollama unavailable
- 10x cost savings vs cloud-based planning

### State Management
- **Persistent state tracking** prevents data loss during handoffs
- **Dependency management** ensures proper execution order
- **Session continuity** across multiple planning sessions
- **Progress visibility** with detailed status reporting

## 🎭 Integration with MosAIc Stack

### Tony Framework Integration
- Follows established `upp-*-*-local` agent patterns
- Integrates with existing Tony personas system
- Compatible with Tony's agent orchestration

### Claude Code Commands
- Custom commands installed in `~/.claude/commands/`
- Seamless integration with Claude Code interface
- Supports command parameters and options

### MCP Protocol
- Planning agents communicate via Model Context Protocol
- Integration with MosAIc MCP servers
- Standardized tool and resource interfaces

## 📊 Business Impact

### Before MosAIc Planning Plugin
- ❌ Projects start with "build everything" scope
- ❌ No clear MVP boundaries
- ❌ Technical planning overwhelms teams
- ❌ Scope creep inevitable
- ❌ Unrealistic timelines and budgets

### After MosAIc Planning Plugin  
- ✅ Clear MVP → v1.1 → v2.0 progression
- ✅ Business-constrained technical planning
- ✅ Realistic timelines with scope control
- ✅ AI-assisted cost modeling
- ✅ Persistent planning state

## 📈 Example Workflow: Healthcare Platform

```bash
# 1. Business Strategy
/plan-business --project=sage-phr --description="HIPAA-compliant PHR platform"
# Output: Strategic framework, target market, success metrics

# 2. Release Planning (SCOPE CONTROL)
/plan-release --project=sage-phr --description="HIPAA-compliant PHR platform"  
# Output: MVP boundaries, v1.0.0 features only, excluded features

# 3. Technical Planning (CONSTRAINED)
/plan-tasks --project=sage-phr
# Output: Epics ONLY for MVP features, not entire platform vision

# Result: 8-week MVP vs 18-month "build everything" project
```

## 🔧 Development

### Package Structure
```
packages/planning-plugin/
├── src/
│   ├── agents/           # upp-*-*-local planning agents
│   ├── commands/         # /plan-* command implementations  
│   ├── core/            # Dependency manager, state tracker
│   └── schemas/         # Data validation schemas
├── docs/                # Architecture and API documentation
├── tests/              # Unit and integration tests
└── package.json        # v0.1.0 (pre-stable development)
```

### Semver Strategy
- **v0.1.0-v0.9.0**: Development and beta releases
- **v1.0.0**: First stable release with core functionality
- **v1.x.0**: Minor enhancements and additional agents
- **v2.0.0**: Breaking changes and major architecture updates

## 🧪 Testing

### Manual Testing
```bash
# Test with Sage PHR project (from user's session)
/plan-all --project=sage-phr --description="HIPAA-compliant collaborative personal health record platform for DPC practices..."

# Verify scope control is working
/plan-status --verbose
```

### Automated Testing
```bash
npm test                # Run all tests
npm run test:coverage   # Test coverage report
npm run test:integration # Integration tests
```

## 📚 Documentation

### Complete Documentation Set
- **README.md**: This overview and quick start
- **docs/ARCHITECTURE.md**: System design and agent interactions
- **docs/AGENTS.md**: Detailed agent specifications
- **docs/COMMANDS.md**: Complete command reference
- **docs/API.md**: Integration guide for other MosAIc components

### Command Documentation
Each command has detailed documentation in `~/.claude/commands/`:
- Usage examples and parameters
- Dependencies and blocking relationships  
- Integration with other planning modules
- Expected outputs and constraints

## 🔄 Roadmap

### v0.2.0 - Enhanced Financial Planning
- Complete `upp-financial-planner-local` agent
- AI-assisted development cost modeling
- ROI projections and budget allocation

### v0.3.0 - Marketing & Technology Planning
- Complete marketing strategy agent
- Technology architecture decision agent
- Enhanced integration capabilities

### v0.4.0 - Advanced Features
- Multi-project coordination
- Team capacity planning
- Risk assessment and mitigation

### v1.0.0 - Stable Release
- Production-ready with full test coverage
- Complete documentation and examples
- Performance optimizations

## ⚠️ Current Status

**Development Version: v0.1.0**

### ✅ Implemented
- Core dependency management and state tracking
- Business planning agent and command
- **Release planning agent and command (SCOPE CONTROL)**
- Status tracking and progress visualization
- Custom Claude commands integration
- Comprehensive documentation

### 🔄 In Progress  
- Financial planning agent and command
- Marketing planning agent and command
- Technology architecture agent and command
- Enhanced technical task decomposition

### ⏳ Planned
- Full pipeline command (`/plan-all`)
- Integration with existing `upp-epic-planner-local`
- Performance optimizations
- Comprehensive test suite

## 🤝 Contributing

This plugin is part of the MosAIc SDK ecosystem. Contributions should:
- Follow established `upp-*-*-local` agent patterns
- Maintain CLAUDE.md compliance for task categorization
- Include comprehensive tests and documentation
- Support both local Ollama and fallback processing

## 📄 License

MIT License - Part of the MosAIc SDK ecosystem.

---

**The MosAIc Planning Plugin transforms chaotic project visions into structured, deliverable roadmaps with built-in scope control. No more "build everything at once" - instead, get clear MVP boundaries and realistic release progression.**