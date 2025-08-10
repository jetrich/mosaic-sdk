# Phase 4 Enhancement - MosAIc CLI MCP Configuration Commands

**Epic**: E.200 - OpenCode TUI Integration  
**Phase**: 4 - CLI MCP Management  
**Status**: PLANNING  
**Priority**: HIGH  
**Estimated Duration**: 1 week

## Overview

Extend the MosAIc CLI with comprehensive MCP server configuration commands, allowing users to manage connections, switch between servers, and configure settings without re-running the installer.

## CLI Command Structure

```
mosaic mcp
├── list              # List configured MCP servers
├── add               # Add new MCP server
├── remove            # Remove MCP server
├── switch            # Switch active server
├── status            # Check server status
├── config            # Configure server settings
├── test              # Test server connection
├── auth              # Manage authentication
├── projects          # Manage project mappings
└── doctor            # Diagnose connection issues
```

## Command Examples

### Basic MCP Management

```bash
# List all configured MCP servers
$ mosaic mcp list
┌─────────┬──────────────────────┬──────┬────────┬──────────┐
│ Active  │ Name                 │ Type │ Status │ Projects │
├─────────┼──────────────────────┼──────┼────────┼──────────┤
│   ✓     │ production          │ TCP  │   ✅   │    23    │
│         │ staging             │ TCP  │   ✅   │    15    │
│         │ local-docker        │ Docker│  ⚠️   │     -    │
│         │ dev-cluster         │ K8s  │   ✅   │    42    │
└─────────┴──────────────────────┴──────┴────────┴──────────┘

# Add a new MCP server interactively
$ mosaic mcp add
? Server name: staging-mcp
? Server type: (Use arrow keys)
❯ Remote TCP Server
  Local Installation
  Docker Container
  Kubernetes Service
? Server host: staging-mcp.company.internal
? Server port: (3456)
? Use TLS? (Y/n) Y
? Authentication method: API Token
? API Token: **********************
✅ Server 'staging-mcp' added successfully

# Add server with command-line options
$ mosaic mcp add production \
  --type tcp \
  --host mcp.company.internal \
  --port 3456 \
  --tls \
  --auth-type token \
  --auth-token "$MOSAIC_TOKEN"

# Switch active server
$ mosaic mcp switch staging
✅ Switched to server: staging
   Host: staging-mcp.company.internal:3456
   Projects: 15 available

# Check server status
$ mosaic mcp status
📊 MCP Server Status: production
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Host: mcp.company.internal:3456
• Status: ✅ Connected
• Latency: 12ms
• Version: 1.0.0
• Uptime: 15d 3h 42m
• Active Connections: 47
• Projects: 23
• Last Sync: 2 minutes ago
```

### Advanced Configuration

```bash
# Configure server settings
$ mosaic mcp config production
? What would you like to configure?
❯ Connection Settings
  Authentication
  TLS/SSL Options
  Performance Tuning
  Project Mappings

# Update specific settings
$ mosaic mcp config production set timeout 30000
$ mosaic mcp config production set retry-attempts 5
$ mosaic mcp config production set compression true

# View current configuration
$ mosaic mcp config production show
┌─────────────────────┬─────────────────────────┐
│ Setting             │ Value                   │
├─────────────────────┼─────────────────────────┤
│ host               │ mcp.company.internal    │
│ port               │ 3456                    │
│ tls                │ enabled                 │
│ timeout            │ 30000ms                 │
│ retry-attempts     │ 5                       │
│ compression        │ true                    │
│ auth-type          │ token                   │
└─────────────────────┴─────────────────────────┘
```

### Authentication Management

```bash
# Update authentication
$ mosaic mcp auth production
? Current auth type: token
? Update authentication? (y/N) y
? New authentication method:
❯ API Token
  JWT Token
  Client Certificate
  OAuth2
? Enter new API token: **********************
✅ Authentication updated

# Rotate credentials
$ mosaic mcp auth production rotate
⚠️  This will generate new credentials
? Continue? (y/N) y
✅ New token generated: mos_tk_a8f3d2...
   Old token will expire in: 24 hours

# Test authentication
$ mosaic mcp auth production test
✅ Authentication successful
   User: john.doe@company.com
   Permissions: read, write, admin
```

### Project Management

```bash
# List projects on server
$ mosaic mcp projects list
┌────────────────────┬──────────────────────┬─────────┬──────────┐
│ Project           │ Path                 │ Status  │ Last Used│
├────────────────────┼──────────────────────┼─────────┼──────────┤
│ mosaic-sdk        │ ~/projects/mosaic    │ Active  │ 2m ago   │
│ client-app        │ ~/work/client        │ Idle    │ 1d ago   │
│ api-service       │ ~/work/api           │ Active  │ 15m ago  │
└────────────────────┴──────────────────────┴─────────┴──────────┘

# Add project mapping
$ mosaic mcp projects add \
  --name "new-project" \
  --path "~/projects/new-project" \
  --server production

# Sync projects
$ mosaic mcp projects sync
🔄 Syncing projects with production server...
✅ Found 3 new projects
✅ Updated 2 project configurations
✅ Removed 1 stale project
   Total projects: 26
```

### Diagnostics and Troubleshooting

```bash
# Run diagnostics
$ mosaic mcp doctor
🏥 MCP Connection Diagnostics
━━━━━━━━━━━━━━━━━━━━━━━━━

Checking: production (mcp.company.internal:3456)

✅ DNS Resolution: mcp.company.internal → 10.0.1.50
✅ Port Connectivity: 3456 is reachable
✅ TLS Certificate: Valid until 2025-12-31
✅ Authentication: Token is valid
✅ API Version: Compatible (1.0.0)
⚠️  Latency: 45ms (higher than recommended 20ms)
✅ Projects Access: 23/23 accessible

Recommendations:
• Consider using a closer MCP server for better latency
• All systems operational

# Test specific connection
$ mosaic mcp test staging --verbose
🔍 Testing connection to staging...
[DEBUG] Resolving staging-mcp.company.internal...
[DEBUG] Connecting to 10.0.2.50:3456...
[DEBUG] TLS handshake initiated...
[DEBUG] Sending authentication...
[DEBUG] Retrieving server info...

✅ Connection test successful!
   Response time: 15ms
   Server version: 1.0.0
   Available tools: 16
```

## Enhancement Structure (UPP Methodology)

### FEATURE F.200.25: CLI MCP Commands

**Status**: PLANNING  
**Priority**: HIGH  
**Duration**: 1 week

#### STORY S.200.25.01: Core MCP Commands

**Description**: Implement basic MCP management commands  
**Acceptance Criteria**:

- List, add, remove, switch servers
- Status checking
- Connection testing

##### TASK T.200.25.01.01: Implement MCP List Command

**Duration**: 2 hours  
**Agent**: BE-BACKEND-BENJAMIN  
**Dependencies**: None  
**Subtasks**:

- ST.200.25.01.01.01: Create list command structure (30 min)
- ST.200.25.01.01.02: Read server configurations (30 min)
- ST.200.25.01.01.03: Check server status (30 min)
- ST.200.25.01.01.04: Format output table (30 min)

##### TASK T.200.25.01.02: Implement MCP Add Command

**Duration**: 4 hours  
**Agent**: FS-FULLSTACK-FELIX  
**Dependencies**: T.200.25.01.01  
**Subtasks**:

- ST.200.25.01.02.01: Create add command structure (30 min)
- ST.200.25.01.02.02: Implement interactive prompts (30 min)
- ST.200.25.01.02.03: Add CLI argument parsing (30 min)
- ST.200.25.01.02.04: Validate server configuration (30 min)
- ST.200.25.01.02.05: Test connection before saving (30 min)
- ST.200.25.01.02.06: Save server configuration (30 min)
- ST.200.25.01.02.07: Update active server list (30 min)
- ST.200.25.01.02.08: Add success confirmation (30 min)

##### TASK T.200.25.01.03: Implement MCP Switch Command

**Duration**: 2 hours  
**Agent**: BE-BACKEND-BENJAMIN  
**Dependencies**: T.200.25.01.02  
**Subtasks**:

- ST.200.25.01.03.01: Create switch command (30 min)
- ST.200.25.01.03.02: Validate target server (30 min)
- ST.200.25.01.03.03: Update active configuration (30 min)
- ST.200.25.01.03.04: Notify connected services (30 min)

##### TASK T.200.25.01.04: Implement MCP Status Command

**Duration**: 3 hours  
**Agent**: BE-BACKEND-BENJAMIN  
**Dependencies**: T.200.25.01.01  
**Subtasks**:

- ST.200.25.01.04.01: Create status command (30 min)
- ST.200.25.01.04.02: Gather server metrics (30 min)
- ST.200.25.01.04.03: Check connection health (30 min)
- ST.200.25.01.04.04: Format status display (30 min)
- ST.200.25.01.04.05: Add performance metrics (30 min)
- ST.200.25.01.04.06: Include project count (30 min)

#### STORY S.200.25.02: Configuration Commands

**Description**: Advanced configuration management  
**Acceptance Criteria**:

- View and modify settings
- Import/export configurations
- Validation of changes

##### TASK T.200.25.02.01: Implement Config Command

**Duration**: 4 hours  
**Agent**: FS-FULLSTACK-FELIX  
**Dependencies**: F.200.25.01 completion  
**Subtasks**:

- ST.200.25.02.01.01: Create config command structure (30 min)
- ST.200.25.02.01.02: Implement get/set operations (30 min)
- ST.200.25.02.01.03: Add configuration validation (30 min)
- ST.200.25.02.01.04: Create interactive editor (30 min)
- ST.200.25.02.01.05: Implement config backup (30 min)
- ST.200.25.02.01.06: Add config migration (30 min)
- ST.200.25.02.01.07: Test configuration changes (30 min)
- ST.200.25.02.01.08: Document config options (30 min)

##### TASK T.200.25.02.02: Implement Auth Command

**Duration**: 3 hours  
**Agent**: SEC-SECURITY-SARAH  
**Dependencies**: T.200.25.02.01  
**Subtasks**:

- ST.200.25.02.02.01: Create auth command structure (30 min)
- ST.200.25.02.02.02: Implement credential update (30 min)
- ST.200.25.02.02.03: Add credential rotation (30 min)
- ST.200.25.02.02.04: Create auth testing (30 min)
- ST.200.25.02.02.05: Implement secure storage (30 min)
- ST.200.25.02.02.06: Add auth validation (30 min)

#### STORY S.200.25.03: Project Management Commands

**Description**: Project-related MCP commands  
**Acceptance Criteria**:

- List and manage projects
- Sync project configurations
- Project access control

##### TASK T.200.25.03.01: Implement Projects Command

**Duration**: 3 hours  
**Agent**: BE-BACKEND-BENJAMIN  
**Dependencies**: F.200.25.01 completion  
**Subtasks**:

- ST.200.25.03.01.01: Create projects command (30 min)
- ST.200.25.03.01.02: Implement project listing (30 min)
- ST.200.25.03.01.03: Add project addition (30 min)
- ST.200.25.03.01.04: Create project sync (30 min)
- ST.200.25.03.01.05: Implement project removal (30 min)
- ST.200.25.03.01.06: Test project operations (30 min)

#### STORY S.200.25.04: Diagnostic Commands

**Description**: Troubleshooting and diagnostics  
**Acceptance Criteria**:

- Comprehensive diagnostics
- Clear error messages
- Actionable recommendations

##### TASK T.200.25.04.01: Implement Doctor Command

**Duration**: 4 hours  
**Agent**: SRE-RELIABILITY-RACHEL  
**Dependencies**: All other commands  
**Subtasks**:

- ST.200.25.04.01.01: Create doctor command (30 min)
- ST.200.25.04.01.02: Implement DNS checks (30 min)
- ST.200.25.04.01.03: Add port connectivity tests (30 min)
- ST.200.25.04.01.04: Check TLS certificates (30 min)
- ST.200.25.04.01.05: Validate authentication (30 min)
- ST.200.25.04.01.06: Test API compatibility (30 min)
- ST.200.25.04.01.07: Generate recommendations (30 min)
- ST.200.25.04.01.08: Format diagnostic report (30 min)

##### TASK T.200.25.04.02: Implement Test Command

**Duration**: 2 hours  
**Agent**: QA-QUALITY-QUINN  
**Dependencies**: T.200.25.04.01  
**Subtasks**:

- ST.200.25.04.02.01: Create test command (30 min)
- ST.200.25.04.02.02: Implement connection testing (30 min)
- ST.200.25.04.02.03: Add verbose mode (30 min)
- ST.200.25.04.02.04: Create test report (30 min)

## Configuration Storage

### Server Configuration Format

```json
{
  "version": "1.0",
  "activeServer": "production",
  "servers": {
    "production": {
      "type": "tcp",
      "host": "mcp.company.internal",
      "port": 3456,
      "tls": {
        "enabled": true,
        "verify": true,
        "ca": "/path/to/ca.crt"
      },
      "auth": {
        "type": "token",
        "tokenRef": "production-token"
      },
      "options": {
        "timeout": 30000,
        "retryAttempts": 5,
        "compression": true
      }
    },
    "staging": {
      "type": "tcp",
      "host": "staging-mcp.company.internal",
      "port": 3456,
      "tls": {
        "enabled": true,
        "verify": false
      },
      "auth": {
        "type": "token",
        "tokenRef": "staging-token"
      }
    },
    "local-docker": {
      "type": "docker",
      "container": "mosaic-mcp",
      "port": 3456,
      "auth": {
        "type": "none"
      }
    }
  }
}
```

### Secure Credential Storage

```
~/.config/mosaic/
├── servers.json         # Server configurations
└── auth/               # Secure credentials
    ├── production-token.enc
    ├── staging-token.enc
    └── keyring.json    # OS keyring references
```

## Integration with OpenCode

The CLI commands automatically update OpenCode configuration when switching servers:

```bash
# Switch server updates OpenCode config
$ mosaic mcp switch staging
✅ Switched to server: staging
✅ Updated OpenCode configuration
   Restart OpenCode to use new server

# Force OpenCode update
$ mosaic mcp switch production --update-opencode
✅ OpenCode configuration updated
✅ OpenCode restarted with new connection
```

## Benefits

1. **Dynamic Configuration**: Change MCP servers without reinstalling
2. **Multi-Environment Support**: Easy switching between dev/staging/prod
3. **Team Collaboration**: Share server configurations
4. **Troubleshooting**: Built-in diagnostics for connection issues
5. **Security**: Secure credential management with rotation
6. **Flexibility**: Support for various deployment types (TCP, Docker, K8s)

## Summary

The MosAIc CLI MCP commands provide comprehensive management capabilities for:

- Multiple MCP server configurations
- Dynamic server switching
- Secure authentication management
- Project synchronization
- Connection diagnostics
- Integration with OpenCode

This allows developers to easily manage their MCP connections and adapt to different environments without re-running installers or manually editing configuration files.
