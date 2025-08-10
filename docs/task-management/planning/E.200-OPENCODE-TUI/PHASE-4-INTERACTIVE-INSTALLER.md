# Phase 4 Enhancement - Interactive MosAIc Installer

**Epic**: E.200 - OpenCode TUI Integration  
**Phase**: 4 - Interactive Installation System  
**Status**: PLANNING  
**Priority**: CRITICAL  
**Estimated Duration**: 1 week

## Overview

Create an interactive installer that guides users through MosAIc setup, including MCP server location configuration (local or remote), authentication setup, and project discovery.

## Installer Flow

```
┌─────────────────────────────────────────────────────────┐
│                 MosAIc SDK Installer                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Welcome to MosAIc SDK Setup!                          │
│                                                         │
│  This installer will help you configure:               │
│  • MCP Server connection (local/remote)                │
│  • Authentication credentials                           │
│  • Project directories                                 │
│  • OpenCode integration                                │
│                                                         │
│  [Continue]  [Documentation]  [Exit]                   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                MCP Server Configuration                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  How would you like to connect to MCP server?          │
│                                                         │
│  ○ Local Installation (This machine)                   │
│  ● Remote Server (TCP connection)                      │
│  ○ Docker Container (Local Docker)                     │
│  ○ Kubernetes Cluster                                  │
│                                                         │
│  [Next]  [Back]                                        │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Remote Server Configuration                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Server Host: [mcp.company.internal___________]        │
│  Server Port: [3456_____]                              │
│                                                         │
│  Connection Security:                                   │
│  ☑ Use TLS/SSL                                        │
│  ☐ Verify Server Certificate                          │
│                                                         │
│  [Test Connection]  [Next]  [Back]                     │
└─────────────────────────────────────────────────────────┘
```

## Enhancement Structure (UPP Methodology)

### FEATURE F.200.23: Interactive Installer System

**Status**: PLANNING  
**Priority**: CRITICAL  
**Duration**: 1 week

#### STORY S.200.23.01: Installer Framework

**Description**: Create the core installer framework  
**Acceptance Criteria**:

- Cross-platform compatibility (Linux, macOS, Windows)
- Interactive CLI interface
- Web-based option for remote setup

##### TASK T.200.23.01.01: Design Installer Architecture

**Duration**: 3 hours  
**Agent**: ARCH-SYSTEMS-ALEX  
**Dependencies**: None  
**Subtasks**:

- ST.200.23.01.01.01: Define installer stages (30 min)
- ST.200.23.01.01.02: Design configuration schema (30 min)
- ST.200.23.01.01.03: Plan validation flow (30 min)
- ST.200.23.01.01.04: Design rollback mechanism (30 min)
- ST.200.23.01.01.05: Create state management (30 min)
- ST.200.23.01.01.06: Document architecture (30 min)

##### TASK T.200.23.01.02: Implement CLI Installer

**Duration**: 6 hours  
**Agent**: FE-FRONTEND-FIONA  
**Dependencies**: T.200.23.01.01  
**Subtasks**:

- ST.200.23.01.02.01: Create installer CLI framework (30 min)
- ST.200.23.01.02.02: Implement interactive prompts (30 min)
- ST.200.23.01.02.03: Add progress indicators (30 min)
- ST.200.23.01.02.04: Create validation logic (30 min)
- ST.200.23.01.02.05: Implement error handling (30 min)
- ST.200.23.01.02.06: Add color and formatting (30 min)
- ST.200.23.01.02.07: Create help system (30 min)
- ST.200.23.01.02.08: Implement state persistence (30 min)
- ST.200.23.01.02.09: Add installer logging (30 min)
- ST.200.23.01.02.10: Create installer config (30 min)
- ST.200.23.01.02.11: Test on all platforms (30 min)
- ST.200.23.01.02.12: Document CLI usage (30 min)

#### STORY S.200.23.02: MCP Server Configuration

**Description**: Interactive MCP server setup  
**Acceptance Criteria**:

- Auto-detection of local MCP servers
- Remote server configuration with validation
- Connection testing before proceeding

##### TASK T.200.23.02.01: Implement Server Detection

**Duration**: 3 hours  
**Agent**: BE-BACKEND-BENJAMIN  
**Dependencies**: T.200.23.01.02  
**Subtasks**:

- ST.200.23.02.01.01: Create local server scanner (30 min)
- ST.200.23.02.01.02: Implement port detection (30 min)
- ST.200.23.02.01.03: Add Docker detection (30 min)
- ST.200.23.02.01.04: Check Kubernetes services (30 min)
- ST.200.23.02.01.05: Create server list UI (30 min)
- ST.200.23.02.01.06: Test detection logic (30 min)

##### TASK T.200.23.02.02: Create Connection Wizard

**Duration**: 4 hours  
**Agent**: FS-FULLSTACK-FELIX  
**Dependencies**: T.200.23.02.01  
**Subtasks**:

- ST.200.23.02.02.01: Design connection flow (30 min)
- ST.200.23.02.02.02: Create server type selection (30 min)
- ST.200.23.02.02.03: Implement host/port input (30 min)
- ST.200.23.02.02.04: Add TLS configuration (30 min)
- ST.200.23.02.02.05: Create connection testing (30 min)
- ST.200.23.02.02.06: Implement retry logic (30 min)
- ST.200.23.02.02.07: Add troubleshooting help (30 min)
- ST.200.23.02.02.08: Save connection profile (30 min)

##### TASK T.200.23.02.03: Implement Authentication Setup

**Duration**: 3 hours  
**Agent**: SEC-SECURITY-SARAH  
**Dependencies**: T.200.23.02.02  
**Subtasks**:

- ST.200.23.02.03.01: Create auth method selection (30 min)
- ST.200.23.02.03.02: Implement token generation (30 min)
- ST.200.23.02.03.03: Add certificate setup (30 min)
- ST.200.23.02.03.04: Create credential storage (30 min)
- ST.200.23.02.03.05: Implement auth testing (30 min)
- ST.200.23.02.03.06: Add security warnings (30 min)

#### STORY S.200.23.03: Project Configuration

**Description**: Configure project directories and settings  
**Acceptance Criteria**:

- Auto-discovery of existing projects
- Manual project path addition
- Project validation

##### TASK T.200.23.03.01: Create Project Discovery

**Duration**: 3 hours  
**Agent**: BE-BACKEND-BENJAMIN  
**Dependencies**: T.200.23.02.03  
**Subtasks**:

- ST.200.23.03.01.01: Implement project scanner (30 min)
- ST.200.23.03.01.02: Add Git repository detection (30 min)
- ST.200.23.03.01.03: Create project validator (30 min)
- ST.200.23.03.01.04: Implement project listing (30 min)
- ST.200.23.03.01.05: Add project selection UI (30 min)
- ST.200.23.03.01.06: Test discovery logic (30 min)

##### TASK T.200.23.03.02: Implement Project Setup

**Duration**: 3 hours  
**Agent**: FS-FULLSTACK-FELIX  
**Dependencies**: T.200.23.03.01  
**Subtasks**:

- ST.200.23.03.02.01: Create project addition flow (30 min)
- ST.200.23.03.02.02: Implement path validation (30 min)
- ST.200.23.03.02.03: Add project metadata (30 min)
- ST.200.23.03.02.04: Create default project selection (30 min)
- ST.200.23.03.02.05: Implement project templates (30 min)
- ST.200.23.03.02.06: Save project configuration (30 min)

#### STORY S.200.23.04: OpenCode Integration Setup

**Description**: Configure OpenCode with MosAIc MCP  
**Acceptance Criteria**:

- Detect existing OpenCode installation
- Update OpenCode configuration
- Verify integration

##### TASK T.200.23.04.01: Implement OpenCode Detection

**Duration**: 2 hours  
**Agent**: FE-FRONTEND-FIONA  
**Dependencies**: T.200.23.03.02  
**Subtasks**:

- ST.200.23.04.01.01: Check OpenCode installation (30 min)
- ST.200.23.04.01.02: Read existing config (30 min)
- ST.200.23.04.01.03: Detect OpenCode version (30 min)
- ST.200.23.04.01.04: Validate compatibility (30 min)

##### TASK T.200.23.04.02: Configure OpenCode Integration

**Duration**: 3 hours  
**Agent**: FS-FULLSTACK-FELIX  
**Dependencies**: T.200.23.04.01  
**Subtasks**:

- ST.200.23.04.02.01: Backup existing config (30 min)
- ST.200.23.04.02.02: Generate MCP config (30 min)
- ST.200.23.04.02.03: Update OpenCode config (30 min)
- ST.200.23.04.02.04: Test MCP connection (30 min)
- ST.200.23.04.02.05: Verify tool availability (30 min)
- ST.200.23.04.02.06: Create success summary (30 min)

### FEATURE F.200.24: Advanced Installer Features

**Status**: PLANNING  
**Priority**: HIGH  
**Duration**: 3 days

#### STORY S.200.24.01: Unattended Installation

**Description**: Support for automated deployment  
**Acceptance Criteria**:

- Configuration file support
- Command-line arguments
- Silent mode operation

##### TASK T.200.24.01.01: Create Config File Support

**Duration**: 3 hours  
**Agent**: DEVOPS-OPERATIONS-OLIVER  
**Dependencies**: F.200.23 completion  
**Subtasks**:

- ST.200.24.01.01.01: Design config file schema (30 min)
- ST.200.24.01.01.02: Implement config parser (30 min)
- ST.200.24.01.01.03: Add validation logic (30 min)
- ST.200.24.01.01.04: Create config generator (30 min)
- ST.200.24.01.01.05: Implement override logic (30 min)
- ST.200.24.01.01.06: Test config scenarios (30 min)

##### TASK T.200.24.01.02: Implement CLI Arguments

**Duration**: 2 hours  
**Agent**: BE-BACKEND-BENJAMIN  
**Dependencies**: T.200.24.01.01  
**Subtasks**:

- ST.200.24.01.02.01: Define CLI arguments (30 min)
- ST.200.24.01.02.02: Implement argument parser (30 min)
- ST.200.24.01.02.03: Add argument validation (30 min)
- ST.200.24.01.02.04: Create help documentation (30 min)

#### STORY S.200.24.02: Web-Based Installer

**Description**: Browser-based installation option  
**Acceptance Criteria**:

- Local web server for setup
- Same features as CLI
- Mobile-friendly interface

##### TASK T.200.24.02.01: Create Web Installer UI

**Duration**: 4 hours  
**Agent**: FE-FRONTEND-FIONA  
**Dependencies**: F.200.23 completion  
**Subtasks**:

- ST.200.24.02.01.01: Design web UI layout (30 min)
- ST.200.24.02.01.02: Create React components (30 min)
- ST.200.24.02.01.03: Implement form validation (30 min)
- ST.200.24.02.01.04: Add progress tracking (30 min)
- ST.200.24.02.01.05: Create responsive design (30 min)
- ST.200.24.02.01.06: Implement error handling (30 min)
- ST.200.24.02.01.07: Add help tooltips (30 min)
- ST.200.24.02.01.08: Test on devices (30 min)

##### TASK T.200.24.02.02: Implement Web Backend

**Duration**: 3 hours  
**Agent**: BE-BACKEND-BENJAMIN  
**Dependencies**: T.200.24.02.01  
**Subtasks**:

- ST.200.24.02.02.01: Create Express server (30 min)
- ST.200.24.02.02.02: Implement API endpoints (30 min)
- ST.200.24.02.02.03: Add WebSocket support (30 min)
- ST.200.24.02.02.04: Create installer bridge (30 min)
- ST.200.24.02.02.05: Implement security (30 min)
- ST.200.24.02.02.06: Test web installer (30 min)

## Installer Configuration Examples

### Interactive CLI Flow

```bash
$ mosaic install

🎯 MosAIc SDK Installer v1.0.0
================================

? How would you like to connect to the MCP server? (Use arrow keys)
❯ Remote Server (TCP connection)
  Local Installation (This machine)
  Docker Container (Local Docker)
  Kubernetes Cluster

? Enter MCP server host: mcp.company.internal
? Enter MCP server port: (3456)
? Use TLS/SSL for connection? (Y/n) Y
? Verify server certificate? (y/N) y

🔍 Testing connection to mcp.company.internal:3456...
✅ Connection successful!

? Select authentication method: (Use arrow keys)
❯ API Token
  JWT Token
  Client Certificate
  Username/Password

? Enter your API token: **********************
✅ Authentication successful!

? Where are your projects located? (Press <space> to select, <enter> to continue)
❯◉ /home/user/projects (15 projects found)
 ◯ /home/user/work (8 projects found)
 ◯ Add custom path...

? Select default project: (Use arrow keys)
❯ mosaic-sdk
  my-app
  client-project

? Configure OpenCode integration? (Y/n) Y
✅ OpenCode configuration updated

📋 Installation Summary:
━━━━━━━━━━━━━━━━━━━━━━
• MCP Server: mcp.company.internal:3456 (TLS)
• Authentication: API Token
• Projects: 23 projects configured
• Default: mosaic-sdk
• OpenCode: ✅ Integrated

? Proceed with installation? (Y/n) Y

🚀 Installing MosAIc SDK...
[████████████████████████] 100% | Configuration written
[████████████████████████] 100% | OpenCode updated
[████████████████████████] 100% | Projects indexed

✅ Installation complete!

🎉 MosAIc SDK is ready to use!

Quick start:
  $ mosaic status          # Check connection
  $ opencode              # Launch OpenCode with MosAIc
  $ mosaic project list   # View available projects

Documentation: https://docs.mosaic.dev
```

### Unattended Installation

```bash
# Using configuration file
$ mosaic install --config mosaic-install.yaml --silent

# Using command-line arguments
$ mosaic install \
  --server-type remote \
  --server-host mcp.company.internal \
  --server-port 3456 \
  --use-tls \
  --auth-type token \
  --auth-token "$MOSAIC_TOKEN" \
  --project-paths "/home/user/projects,/home/user/work" \
  --default-project mosaic-sdk \
  --integrate-opencode \
  --accept-defaults
```

### Configuration File (mosaic-install.yaml)

```yaml
version: 1.0
server:
  type: remote
  host: mcp.company.internal
  port: 3456
  tls:
    enabled: true
    verify: true

auth:
  type: token
  token: ${MOSAIC_TOKEN}

projects:
  paths:
    - /home/user/projects
    - /home/user/work
  default: mosaic-sdk
  autoDiscover: true

integrations:
  opencode:
    enabled: true
    updateConfig: true

options:
  createBackups: true
  verbose: false
  acceptDefaults: true
```

## Post-Installation

### Generated Configuration

The installer creates configuration in XDG-compliant locations:

```
~/.config/mosaic/
├── config.json          # Main configuration
├── connection.json      # MCP server connection
├── projects.json        # Project registry
└── auth/               # Secure credentials
    └── token.enc

~/.config/opencode/
└── config.json         # Updated with MosAIc MCP
```

### Verification Commands

```bash
# Verify installation
$ mosaic doctor

🏥 MosAIc Installation Check
━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Configuration: Valid
✅ MCP Connection: Active
✅ Authentication: Valid
✅ Projects: 23 found
✅ OpenCode: Integrated
✅ Permissions: Correct

🎉 All systems operational!

# Test MCP connection
$ mosaic test-connection
✅ Connected to mcp.company.internal:3456
   Latency: 12ms
   Version: 1.0.0
   Status: Healthy
```

## Summary

The interactive installer provides a user-friendly way to configure MosAIc with:

- Flexible MCP server configuration (local/remote/container)
- Secure authentication setup
- Automatic project discovery
- Seamless OpenCode integration
- Both interactive and unattended modes
- Web-based option for remote setup

This ensures users can easily connect to their MCP server regardless of deployment architecture.
