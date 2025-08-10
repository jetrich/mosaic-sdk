# @mosaicstack/cli

Command-line interface for MosAIc Stack multi-mode architecture with SIBKISS methodology (3-step configuration).

## Features

- **SIBKISS Setup**: See It Big, Keep It Simple & Straightforward (3-step configuration)
- **Multi-Mode Support**: Local, Hybrid, and Cloud operation modes
- **Interactive Configuration**: Guided setup with intelligent defaults
- **Comprehensive Management**: Full lifecycle management of MosAIc Stack
- **Beautiful UI**: Rich terminal interface with colors, spinners, and progress bars
- **Provider Management**: Test, monitor, and manage AI providers
- **System Testing**: Comprehensive test suite for validation

## Installation

```bash
npm install -g @mosaicstack/cli
```

## Quick Start

### 1. Initialize MosAIc Stack (SIBKISS 3-Step Setup)

```bash
mosaic init
```

**Step 1**: Choose operation mode (Local/Hybrid/Cloud)  
**Step 2**: Configure providers (Ollama, Claude, etc.)  
**Step 3**: Finalize settings (ports, environment)

### 2. Start MosAIc Stack

```bash
mosaic start
```

### 3. Check Status

```bash
mosaic status
```

## Commands

### Core Commands

#### `mosaic init`
Initialize MosAIc Stack with SIBKISS 3-step setup.

```bash
mosaic init                    # Interactive setup
mosaic init --mode hybrid     # Quick setup with mode
mosaic init --no-interactive  # Use defaults
mosaic init --force          # Overwrite existing config
```

#### `mosaic start`
Start MosAIc Stack services.

```bash
mosaic start                  # Start normally
mosaic start --port 3500     # Custom MCP port
mosaic start --daemon        # Run as daemon
mosaic start --dev           # Development mode
```

#### `mosaic stop`
Stop MosAIc Stack services.

```bash
mosaic stop                   # Graceful stop
mosaic stop --force          # Force stop
```

#### `mosaic status`
Check system status and health.

```bash
mosaic status                 # Full status
mosaic status --json         # JSON output
mosaic status --health       # Include health checks
```

### Configuration Management

#### `mosaic config`
Manage configuration files.

```bash
# View current configuration
mosaic config show
mosaic config show --json

# Validate configuration
mosaic config validate
mosaic config validate --config ./custom.yaml

# Generate templates
mosaic config template hybrid
mosaic config template local --output ./local.yaml
mosaic config template cloud --format json
```

### Provider Management

#### `mosaic providers`
Manage AI providers.

```bash
# List all providers
mosaic providers list
mosaic providers list --json

# Check provider health
mosaic providers health
mosaic providers health --json

# Test specific provider
mosaic providers test ollama
mosaic providers test claude --model claude-3-sonnet
```

### System Testing

#### `mosaic test`
Run comprehensive system tests.

```bash
mosaic test                   # Full test suite
mosaic test --providers       # Provider tests only
mosaic test --integration     # Integration tests only
mosaic test --config ./test.yaml
```

### Development Utilities

#### `mosaic dev`
Development and debugging tools.

```bash
# View logs
mosaic dev logs
mosaic dev logs --follow
mosaic dev logs --lines 100

# Reset environment
mosaic dev reset
mosaic dev reset --hard       # Remove all data
```

### Information

#### `mosaic info`
Show system information.

```bash
mosaic info                   # Human-readable
mosaic info --json           # Machine-readable
```

## Configuration Modes

### Local Mode - Complete Privacy

Zero external API calls, Ollama-only operation:

```bash
mosaic init --mode local
```

**Features**:
- 🏠 Complete data privacy
- 🔒 No external API calls
- 🦙 Ollama-only operation
- ✈️ Air-gapped capable

### Hybrid Mode - Intelligent Routing (Default)

Smart balance between local and cloud:

```bash
mosaic init --mode hybrid
```

**Features**:
- 🔀 Intelligent task routing
- 💰 Cost optimization
- 🏠 Local preference with cloud fallback
- ⚖️ Best of both worlds

### Cloud Mode - Maximum Capability

Cloud-first with maximum performance:

```bash
mosaic init --mode cloud
```

**Features**:
- ☁️ Maximum performance
- 🚀 All provider integrations
- 👥 Enterprise collaboration
- 📊 Advanced monitoring

## Environment Variables

The CLI supports secure environment variable management:

```bash
# Provider credentials
ANTHROPIC_API_KEY=your_claude_api_key
OPENROUTER_API_KEY=your_openrouter_key
OLLAMA_URL=http://localhost:11434

# System configuration
MOSAIC_CONFIG_PATH=./custom-config.yaml
MOSAIC_NO_BANNER=true
MOSAIC_LOG_LEVEL=debug
```

### Generate .env Template

```bash
mosaic config template hybrid --output config.yaml
# Creates config.yaml and config.env.example
```

## Configuration Files

The CLI automatically searches for configuration in:

1. `mosaic.config.yaml`
2. `mosaic.config.json`  
3. `.mosaicrc.yaml`
4. `.mosaicrc.json`
5. `.mosaic/mosaic.config.yaml`

### Example Configuration

```yaml
$schema: "https://mosaicstack.dev/schemas/config.json"
mode: "hybrid"
version: "1.0.0"

mcp:
  port: 3456
  autoStart: true

providers:
  ollama:
    enabled: true
    url: "http://localhost:11434"
    
  claude:
    enabled: true
    access: "subscription"
    fallbackToApi: true
    apiKey: "env:ANTHROPIC_API_KEY"

routing:
  strategy: "intelligent"
  preferLocal: true
  costOptimization: true

tony:
  enabled: true
  personas: true
  upp: true
  multiAgent: true
  maxConcurrentAgents: 5
```

## Status and Monitoring

### System Status

```bash
mosaic status
```

Shows:
- ✅ Running status and uptime
- 🔧 Configuration details  
- 🔌 Provider status
- ⚙️ Service health
- 📊 Performance metrics

### Provider Health

```bash
mosaic providers health
```

Checks:
- 🌐 Network connectivity
- 🔑 Authentication status
- 📦 Available models
- ⚡ Response times

## Testing and Validation

### System Tests

```bash
mosaic test
```

Validates:
- 📋 Configuration structure
- 🔌 Provider connectivity
- 🔗 Integration workflows
- ⚙️ System components
- 🔒 Security settings

### Provider Testing

```bash
mosaic providers test ollama
```

Tests:
- 🏥 Health checks
- 📦 Model availability  
- 💬 Chat functionality
- ⚡ Performance metrics

## Error Handling

The CLI provides comprehensive error handling:

- **Configuration errors**: Clear validation messages
- **Network issues**: Retry mechanisms with timeouts
- **Provider failures**: Automatic fallback chains
- **Process management**: Graceful shutdown handling

### Common Issues

#### Port Already in Use
```bash
mosaic start --port 3500
```

#### Provider Connection Failed
```bash
mosaic providers health
mosaic providers test ollama
```

#### Configuration Invalid
```bash
mosaic config validate
mosaic config template hybrid --output new-config.yaml
```

## Development

### Building from Source

```bash
git clone https://github.com/mosaicstack/mosaic-sdk
cd mosaic-sdk/packages/cli
npm install
npm run build
```

### Running in Development

```bash
npm run dev -- --help
npm run dev -- init --mode local
```

### Testing

```bash
npm test
npm run test:watch
npm run test:coverage
```

## Integration with MosAIc Stack

This CLI integrates seamlessly with:

- **@mosaicstack/config** - Configuration management
- **@mosaicstack/providers** - Provider abstraction  
- **@mosaicstack/stack** - Meta-package orchestration
- **@mosaicstack/mcp** - MCP server
- **@mosaicstack/tony** - Tony Framework

### Programmatic Usage

```typescript
import { InitCommand, StartCommand } from '@mosaicstack/cli';

// Initialize programmatically
const initCmd = new InitCommand();
await initCmd.execute({ mode: 'hybrid', interactive: false });

// Start services
const startCmd = new StartCommand();
await startCmd.execute({ port: '3456' });
```

## Examples

### Quick Local Setup

```bash
# 1. Install CLI
npm install -g @mosaicstack/cli

# 2. Initialize for local-only operation
mosaic init --mode local --no-interactive

# 3. Start services
mosaic start

# 4. Verify everything works
mosaic status
mosaic test --providers
```

### Enterprise Hybrid Setup

```bash
# 1. Interactive setup with all options
mosaic init

# 2. Configure environment variables
cp .env.example .env
# Edit .env with your API keys

# 3. Validate configuration
mosaic config validate

# 4. Start with custom port
mosaic start --port 3500

# 5. Monitor health
mosaic providers health
mosaic status --health
```

### CI/CD Integration

```bash
# Non-interactive setup for automation
export ANTHROPIC_API_KEY="your_key"
export MOSAIC_NO_BANNER=true

mosaic init --mode cloud --no-interactive
mosaic test
mosaic start --daemon
```

## SIBKISS Methodology

The CLI implements SIBKISS (See It Big, Keep It Simple & Straightforward):

### See It Big
- **Vision**: Complete AI development platform
- **Scope**: Local to enterprise-scale deployment
- **Integration**: Seamless multi-provider orchestration

### Keep It Simple
- **3-Step Setup**: Mode → Providers → Launch
- **Smart Defaults**: Production-ready out of the box
- **Auto-Detection**: Discovers services and configurations

### Straightforward
- **Clear Commands**: Intuitive command structure
- **Helpful Errors**: Actionable error messages
- **Progressive Enhancement**: Start simple, scale up

## License

MIT - See LICENSE file for details.