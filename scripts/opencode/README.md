# OpenCode Integration Scripts

This directory contains scripts for OpenCode integration with MosAIc SDK.

## Scripts

### `fix-opencode-config-v2.sh`

**Purpose**: Fix OpenCode configuration issues by creating a minimal, valid configuration.

**Usage**:

```bash
./scripts/opencode/fix-opencode-config-v2.sh
```

**What it does**:

- Backs up existing OpenCode configuration
- Creates minimal MCP-only configuration
- Tests OpenCode functionality
- Provides usage instructions

### `test-integration.cjs`

**Purpose**: Comprehensive test suite for OpenCode MCP integration.

**Usage**:

```bash
node scripts/opencode/test-integration.cjs
```

**What it tests**:

- MCP server startup
- Token extraction and validation
- Configuration template validity
- Setup script functionality
- Package build completeness

## Configuration Files

The scripts create these configuration files:

### Global Configuration (`~/.config/opencode/config.json`)

```json
{
  "mcp": {
    "mosaic": {
      "type": "local",
      "command": ["@mosaicstack/opencode-mcp"],
      "environment": {
        "MOSAIC_CONFIG": "~/.mosaic/config.json",
        "MOSAIC_DATA_DIR": "~/.mosaic/data",
        "MOSAIC_PROJECT_ROOT": "."
      }
    }
  }
}
```

### Project Configuration (`./opencode.json`)

Same as global configuration but project-specific.

## Available MosAIc Tools

Once OpenCode is configured, these tools are available via MCP:

- **`mosaic_task_create`** - Create tasks with UPP hierarchy
- **`mosaic_task_assign`** - Assign tasks to agents
- **`mosaic_project_switch`** - Switch project context
- **`mosaic_project_list`** - List available projects
- **`mosaic_agent_spawn`** - Spawn specialized agents
- **`mosaic_agent_coordinate`** - Coordinate multi-agent tasks

## Usage Examples

### Starting OpenCode

```bash
# Start in project directory
cd /path/to/your/project
opencode
```

### Using MosAIc Tools

Once OpenCode starts, ask Claude to use the tools:

```
"Use mosaic_task_create to create a new task for implementing user authentication"
"Use mosaic_agent_spawn to create a backend development agent"
"Use mosaic_project_list to show me available projects"
```

## Troubleshooting

### Configuration Errors

If you see "Unrecognized key(s)" errors:

```bash
./scripts/opencode/fix-opencode-config-v2.sh
```

### MCP Server Not Found

Ensure the OpenCode MCP package is built:

```bash
cd packages/opencode-mcp
npm run build
```

### Token Issues

Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

## Integration Architecture

```
OpenCode CLI
    ↓
MCP Protocol
    ↓
@mosaicstack/opencode-mcp
    ↓
MosAIc SDK Tools
```

The integration uses the Model Context Protocol (MCP) to provide MosAIc tools as callable functions within OpenCode's Claude interface.
