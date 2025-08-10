# Documentation Updates Required - E.200 OpenCode Integration

**Epic**: E.200  
**Status**: Pending Updates  
**Priority**: High  
**Last Updated**: 2025-07-21  

## Critical Updates (Must Complete Before Implementation)

### 1. README.md (Root)
**File**: `/home/jwoltje/src/mosaic-sdk/README.md`  
**Assigned**: DOC-TECHNICAL-DIANA  
**Priority**: Critical  

**Updates Required**:
- [ ] Add OpenCode integration section after "Quick Start"
- [ ] Update prerequisites to include Bun runtime
- [ ] Add TUI launch commands
- [ ] Update architecture diagram to show OpenCode
- [ ] Add links to OpenCode setup guide

**Example Addition**:
```markdown
## 🖥️ Terminal UI (OpenCode Integration)

MosAIc Stack includes integration with OpenCode for a sophisticated terminal-based development experience.

### Prerequisites
- Bun runtime (latest version)
- OpenCode CLI

### Quick Start
```bash
# Launch OpenCode TUI with MosAIc integration
mosaic tui

# Or use specific modes
mosaic tui --mode mosaic-plan    # Planning mode
mosaic tui --mode mosaic-execute  # Execution mode
```

See [OpenCode Setup Guide](docs/sdk/operations/OPENCODE-SETUP-GUIDE.md) for detailed configuration.
```

### 2. CLAUDE.md (Project Instructions)
**File**: `/home/jwoltje/src/mosaic-sdk/CLAUDE.md`  
**Assigned**: DOC-TECHNICAL-DIANA  
**Priority**: Critical  

**Updates Required**:
- [ ] Add OpenCode TUI commands section
- [ ] Document MCP server configuration
- [ ] Add agent coordination for TUI tasks
- [ ] Include OpenCode-specific personas
- [ ] Add TUI development guidelines

**Sections to Add**:
- "OpenCode TUI Integration"
- "MCP Server Extensions"
- "TUI Agent Coordination"
- "Terminal Development Workflow"

### 3. Architecture Documentation
**File**: `/home/jwoltje/src/mosaic-sdk/docs/sdk/architecture/README.md`  
**Assigned**: ARCH-SYSTEMS-ALEX  
**Priority**: High  

**Updates Required**:
- [ ] Add OpenCode integration architecture section
- [ ] Update component diagram
- [ ] Document MCP extension points
- [ ] Add data flow diagrams
- [ ] Document plugin architecture

### 4. Package Documentation
**File**: `/home/jwoltje/src/mosaic-sdk/packages/README.md`  
**Assigned**: BE-BACKEND-BENJAMIN  
**Priority**: High  

**Updates Required**:
- [ ] Add @mosaicstack/mcp-orchestrator description
- [ ] Add @mosaicstack/opencode-adapter description
- [ ] Update dependency graph
- [ ] Add package interaction diagram
- [ ] Document new package APIs

## Secondary Updates (Can Complete During Implementation)

### 5. mosaic-site Documentation
**File**: `/home/jwoltje/src/mosaic-sdk/mosaic-site/README.md`  
**Assigned**: FE-FRONTEND-FIONA  
**Priority**: Medium  

**Updates Required**:
- [ ] Document shared component usage
- [ ] Add monitoring UI section
- [ ] Style consistency guidelines
- [ ] Add tabbed interface documentation
- [ ] Terminal integration guide

### 6. Configuration Files

#### package.json (Root)
**File**: `/home/jwoltje/src/mosaic-sdk/package.json`  
**Assigned**: DEVOPS-OPERATIONS-OLIVER  
**Priority**: Medium  

**Updates Required**:
- [ ] Add OpenCode-related dependencies
- [ ] Add TUI-specific scripts
- [ ] Update workspace configuration

#### tsconfig.json
**File**: `/home/jwoltje/src/mosaic-sdk/tsconfig.json`  
**Assigned**: BE-BACKEND-BENJAMIN  
**Priority**: Medium  

**Updates Required**:
- [ ] Add new package paths
- [ ] Update module resolution
- [ ] Add OpenCode type definitions

#### .gitignore
**File**: `/home/jwoltje/src/mosaic-sdk/.gitignore`  
**Assigned**: DEVOPS-OPERATIONS-OLIVER  
**Priority**: Low  

**Updates Required**:
- [ ] Add OpenCode cache directories
- [ ] Add Bun-specific ignores
- [ ] Add TUI session files

### 7. Development Guides

#### LOCAL-TESTING-GUIDE.md
**File**: `/home/jwoltje/src/mosaic-sdk/docs/sdk/operations/LOCAL-TESTING-GUIDE.md`  
**Assigned**: QA-QUALITY-QUINN  
**Priority**: Medium  

**Updates Required**:
- [ ] Add OpenCode TUI testing section
- [ ] Document MCP server testing
- [ ] Add integration test procedures
- [ ] Include performance benchmarks

#### New: TUI-DEVELOPMENT-GUIDE.md
**File**: `/home/jwoltje/src/mosaic-sdk/docs/sdk/development/TUI-DEVELOPMENT-GUIDE.md`  
**Assigned**: DOC-TECHNICAL-DIANA  
**Priority**: High  
**Status**: To Be Created  

**Content Required**:
- TUI development workflow
- OpenCode configuration
- MCP server development
- Debugging techniques
- Best practices

#### CONTRIBUTING.md
**File**: `/home/jwoltje/src/mosaic-sdk/CONTRIBUTING.md`  
**Assigned**: DOC-TECHNICAL-DIANA  
**Priority**: Medium  

**Updates Required**:
- [ ] Add TUI contribution guidelines
- [ ] Document OpenCode plugin development
- [ ] Add MCP tool contribution process
- [ ] Update testing requirements

### 8. CI/CD Configuration

#### GitHub Actions
**Files**: `.github/workflows/*.yml`  
**Assigned**: DEVOPS-OPERATIONS-OLIVER  
**Priority**: Medium  

**Updates Required**:
- [ ] Add Bun runtime to CI environment
- [ ] Add OpenCode integration tests
- [ ] Update build pipeline for new packages
- [ ] Add TUI-specific test jobs

### 9. API Documentation

#### New: MCP-ORCHESTRATOR-API.md
**File**: `/home/jwoltje/src/mosaic-sdk/docs/api/MCP-ORCHESTRATOR-API.md`  
**Assigned**: BE-BACKEND-BENJAMIN  
**Priority**: High  
**Status**: To Be Created  

**Content Required**:
- MCP server endpoints
- Tool specifications
- Protocol documentation
- Integration examples

### 10. User Documentation

#### New: OPENCODE-SETUP-GUIDE.md
**File**: `/home/jwoltje/src/mosaic-sdk/docs/sdk/operations/OPENCODE-SETUP-GUIDE.md`  
**Assigned**: DOC-TECHNICAL-DIANA  
**Priority**: Critical  
**Status**: To Be Created  

**Content Required**:
- Installation instructions
- Configuration guide
- Mode explanations
- Troubleshooting
- FAQ

## Documentation in mosaic-docs Submodule

### Public Documentation
**Location**: `mosaic-docs/`  
**Assigned**: DOC-TECHNICAL-DIANA  
**Priority**: Medium (after internal docs)  

**Files to Create/Update**:
- `architecture/integrations/opencode-tui.md`
- `guides/developer/tui-web-interface.md`
- `api/mcp-extensions/mosaic-orchestrator.md`
- `tutorials/getting-started-tui.md`

## Version Control Considerations

### Documentation Versioning
- All documentation must include version headers
- Track changes in CHANGELOG.md
- Use semantic versioning for API docs
- Include "Last Updated" timestamps

### Review Process
1. Technical review by feature lead
2. Consistency review by Diana
3. Final approval by Tony
4. Merge to main branch

## Templates to Create

### 1. MCP Tool Documentation Template
```markdown
# MCP Tool: [Tool Name]

## Overview
Brief description of tool purpose

## Parameters
- `param1`: Description (type, required/optional)
- `param2`: Description (type, required/optional)

## Returns
Description of return value

## Examples
```typescript
// Example usage
```

## Error Handling
Common errors and solutions

## Best Practices
Usage recommendations
```

### 2. Agent Handoff Template
Already created in AGENT-ASSIGNMENTS.md

### 3. Feature Documentation Template
```markdown
# Feature: [Feature Name]

## Overview
Feature description and purpose

## Architecture
Technical architecture overview

## Configuration
Required configuration steps

## Usage
How to use the feature

## API Reference
Link to API documentation

## Troubleshooting
Common issues and solutions
```

## Timeline

### Week 1 (Documentation Sprint)
- Day 1-2: Critical updates (README, CLAUDE.md)
- Day 3-4: Architecture and package docs
- Day 5: New guide creation

### Week 2-5 (During Implementation)
- Update documentation as features complete
- Create API documentation alongside code
- Update configuration files as needed

## Tracking

### Documentation Status Dashboard
Create tracking file: `docs/task-management/active/E.200/DOCUMENTATION-STATUS.md`

Track:
- [ ] Document name
- [ ] Assigned agent
- [ ] Status (Not Started/In Progress/Review/Complete)
- [ ] Review status
- [ ] Merge status

## Notes

- All documentation must follow MosAIc documentation standards
- Include code examples where applicable
- Test all commands and configurations
- Maintain consistency with existing documentation style
- Update table of contents in parent documents