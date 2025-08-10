# Intelligent Routing for MosAIc Planning Commands

**Unified configuration system for `/plan-*` commands with intelligent routing between Ollama (local), hybrid, and remote API processing.**

## Overview

The MosAIc Planning Plugin now includes intelligent routing capabilities that seamlessly switch between local Ollama models and remote APIs based on task complexity, model availability, and user preferences. The system uses environment variables from the existing `.claude.json` MCP configuration, eliminating the need for separate configuration files.

## Features

✅ **Environment-based Configuration**: Uses existing `.claude.json` MCP server configuration  
✅ **User-specified Models**: Configurable model preferences for different task types  
✅ **Intelligent Routing**: Automatic selection based on task complexity and type  
✅ **Local-first Strategy**: Cost-effective Ollama processing with remote fallback  
✅ **Command-level Override**: Per-command routing strategy control  
✅ **Performance Tracking**: Routing decisions tracked in planning sessions  

## Configuration

### Environment Variables in `.claude.json`

The routing system uses environment variables in the existing `mosaic` MCP server configuration:

```json
{
  "mcpServers": {
    "mosaic": {
      "command": "node",
      "args": ["/home/jwoltje/.config/mosaic/mcp-server/dist/main.js", "serve"],
      "env": {
        "MOSAIC_ROUTING_STRATEGY": "local-first",
        "MOSAIC_CODING_MODEL": "gpt-oss",
        "MOSAIC_GENERAL_MODEL": "llama3.2:3b",
        "MOSAIC_FALLBACK_MODEL": "codellama:7b",
        "MOSAIC_OLLAMA_URL": "http://localhost:11434",
        "MOSAIC_PLANNING_MODE": "hybrid"
      }
    }
  }
}
```

### Configuration Options

| Variable | Options | Description |
|----------|---------|-------------|
| `MOSAIC_ROUTING_STRATEGY` | `local-first`, `remote-first`, `local-only`, `remote-only`, `hybrid` | Primary routing strategy |
| `MOSAIC_CODING_MODEL` | Any model name | Model for coding/technical tasks |
| `MOSAIC_GENERAL_MODEL` | Any model name | Model for general planning tasks |
| `MOSAIC_FALLBACK_MODEL` | Any model name | Fallback model when primary fails |
| `MOSAIC_OLLAMA_URL` | URL | Ollama server endpoint |
| `MOSAIC_PLANNING_MODE` | `local`, `remote`, `hybrid` | Overall planning approach |

## Usage

### Basic Planning Commands

The routing system works transparently with all existing `/plan-*` commands:

```bash
# Business planning - uses general model (llama3.2:3b)
/plan-business --project=my-project --description="SaaS platform"

# Technical planning - uses coding model (gpt-oss)  
/plan-tasks --project=my-project

# Release planning - uses general model with hybrid fallback
/plan-release --project=my-project
```

### Command-level Routing Override

You can override the global routing strategy for individual commands:

```bash
# Force local processing
/plan-business --routing=local --project=my-project

# Force remote processing
/plan-tasks --routing=remote --project=my-project

# Force hybrid approach
/plan-release --routing=hybrid --project=my-project
```

## Routing Logic

### Task Type Detection

Commands are automatically mapped to task types for model selection:

- **Code Tasks**: `/plan-tasks`, `/plan-tech` → Uses `MOSAIC_CODING_MODEL`
- **Analysis Tasks**: `/plan-release`, complex planning → Uses `MOSAIC_GENERAL_MODEL`  
- **General Tasks**: `/plan-business`, `/plan-marketing` → Uses `MOSAIC_GENERAL_MODEL`

### Complexity Assessment

The system assesses task complexity (1-5 scale) based on:

- Content size and detail level
- Operation type keywords (`complex`, `detailed`, `comprehensive`)
- Domain-specific complexity requirements
- Number of constraints and parameters

### Processing Mode Selection

| Strategy | Low Complexity | High Complexity | Code Tasks |
|----------|----------------|-----------------|------------|
| `local-first` | local | hybrid | local |
| `remote-first` | remote | remote | remote |
| `local-only` | local | local | local |
| `remote-only` | remote | remote | remote |
| `hybrid` | hybrid | hybrid | hybrid |

## Implementation Architecture

### Core Components

1. **EnvironmentConfigLoader** - Processes MCP environment variables
2. **PlanningRoutingConfig** - Makes routing decisions based on task analysis
3. **UnifiedPlanningAgent** - Enhanced base class with routing integration
4. **TaskRouter Integration** - Leverages existing Ollama/Claude routing

### Class Hierarchy

```
UnifiedPlanningAgent (Enhanced)
├── EnvironmentConfigLoader (Singleton)
├── PlanningRoutingConfig (Per-agent)
└── TaskRouter Integration (Existing)
```

### Key Files

- `packages/planning-plugin/src/config/environment-loader.ts` - Environment variable processing
- `packages/planning-plugin/src/config/routing-config.ts` - Routing decision logic  
- `packages/planning-plugin/src/agents/base/UnifiedPlanningAgent.ts` - Enhanced base agent
- `mosaic-mcp/src/services/router.ts` - Existing TaskRouter service

## Model Selection Examples

Based on the current configuration:

### Coding Tasks (`/plan-tasks`, `/plan-tech`)
- **Primary**: `gpt-oss` (local)
- **Fallback**: `codellama:7b`
- **Strategy**: Local-first with fallback

### General Tasks (`/plan-business`, `/plan-release`)  
- **Primary**: `llama3.2:3b` (local)
- **Fallback**: `codellama:7b`
- **Strategy**: Local-first with hybrid fallback

### High Complexity Tasks (Complexity ≥ 4)
- **Primary**: Hybrid approach (try local, fallback to remote)
- **Remote Model**: `claude-3-5-sonnet-20241022`
- **Strategy**: Quality-focused with cost optimization

## Performance Benefits

### Cost Optimization
- **Local Processing**: 10x cost reduction vs cloud APIs
- **Intelligent Fallback**: Only use expensive APIs when necessary
- **Model Right-sizing**: Fast models for simple tasks, powerful models for complex tasks

### Response Time
- **Local Models**: 45 second timeout for better quality
- **Remote APIs**: 30 second timeout for faster response  
- **Hybrid**: 60 second timeout allowing for fallback

### Quality Assurance
- **Task-Model Matching**: Specialized models for different task types
- **Complexity Routing**: High-quality models for complex tasks
- **Fallback Safety**: Always have a backup processing option

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loaded**
   ```bash
   # Verify MCP server configuration
   cat ~/.claude.json | jq '.mcpServers.mosaic.env'
   ```

2. **Ollama Models Not Available**
   ```bash
   # Check available models
   ollama list
   
   # Install missing models
   ollama pull llama3.2:3b
   ollama pull codellama:7b
   ```

3. **Routing Decisions Not Optimal**
   ```bash
   # Check routing logs in planning session
   /plan-status --verbose
   ```

### Configuration Validation

The system validates environment variables on startup:

- ✅ All required environment variables present
- ✅ Model configurations valid
- ✅ Endpoint configurations accessible
- ✅ Routing strategy valid

### Debug Mode

Enable detailed routing logs by setting:

```json
{
  "env": {
    "MOSAIC_DEBUG_ROUTING": "true"
  }
}
```

## Migration from Previous Versions

### From Separate Config Files
If you previously used separate `planning-config.json`:

1. **Move settings** to `.claude.json` MCP env vars
2. **Update agents** to use `UnifiedPlanningAgent`  
3. **Test routing** with `/plan-status --verbose`

### From Individual Agent Configs
The new system replaces individual agent configurations:

- ❌ `upp-business-planner-local` - Use `upp-business-planner` with routing
- ❌ `upp-financial-planner-local` - Use `upp-financial-planner` with routing
- ❌ `upp-release-planner-local` - Use `upp-release-planner` with routing

## Future Enhancements

### Planned Features (v0.2.0)
- **A/B Testing**: Compare local vs remote quality for same tasks
- **Performance Learning**: Adapt routing based on historical performance
- **Cost Tracking**: Detailed cost analysis per routing decision
- **Custom Models**: Support for additional local and remote model providers

### Advanced Configuration (v0.3.0)  
- **Per-Domain Routing**: Different strategies for different business domains
- **Time-based Routing**: Switch strategies based on time of day/load
- **Quality Metrics**: Route based on required output quality level
- **Multi-Agent Coordination**: Coordinate routing across multiple agents

## Testing

### Manual Testing

```bash
# Test routing configuration
node test-routing.js

# Test with actual commands
/plan-business --project=test --routing=local
/plan-tasks --project=test --routing=remote  
/plan-release --project=test --routing=hybrid
```

### Validation Commands

```bash
# Check current configuration
/plan-status --config

# Validate environment  
/plan-status --validate

# Test routing decisions
/plan-status --routing-test
```

## Support

For issues or questions about intelligent routing:

1. **Check Configuration**: Verify `.claude.json` MCP environment variables
2. **Test Components**: Run `node test-routing.js` for component testing
3. **Review Logs**: Check planning session metadata for routing decisions  
4. **Validate Models**: Ensure Ollama models are available and functional

---

**The intelligent routing system transforms MosAIc planning commands from static local-only execution to dynamic, cost-optimized, quality-focused processing that adapts to task requirements while respecting user preferences.**