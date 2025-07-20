# Isolated MosAIc Development Environment

## Overview

The MosAIc SDK includes an isolated development environment that allows you to use and test the MosAIc Stack (with mandatory MCP) without affecting your other Tony-based projects. This is perfect for developing the framework while still using it.

## Key Features

- **Complete Isolation**: MCP server runs on a different port (3456)
- **Separate Configuration**: Uses `.mosaic/claude/config.json`
- **Independent Database**: SQLite database at `.mosaic/data/mcp.db`
- **No Global Impact**: Your other projects continue using their current Tony versions
- **Easy Toggle**: Switch between isolated and regular environments instantly

## Quick Start

### 1. Start the Isolated Environment

```bash
cd ~/src/mosaic-sdk
npm run dev:start

# Or using the script directly
./scripts/dev-environment.sh start
```

This will:
- Start an isolated MCP server on port 3456
- Create necessary directories
- Initialize the database
- Set up configuration files

### 2. Use the Isolated Environment

#### Option A: Using the `mosaic` CLI wrapper (Recommended)

```bash
# Use Tony with MosAIc MCP
./scripts/mosaic tony plan

# Use Claude with MosAIc MCP
./scripts/mosaic claude -p "Create a new feature"

# Check status
./scripts/mosaic test
```

#### Option B: Using aliases in a session

```bash
# Activate the environment
source .mosaic/dev-session.sh

# Now use special aliases
mosaic-tony plan
mosaic-claude -p "Help with code"

# Regular 'tony' and 'claude' remain unchanged
```

#### Option C: Direct usage with environment variables

```bash
# Set the environment for one command
CLAUDE_CONFIG_DIR="$(pwd)/.mosaic/claude" claude -p "Test MosAIc"
```

### 3. Monitor the Environment

```bash
# Check if MCP server is running
npm run dev:status

# View logs
npm run dev:logs

# Stop the server
npm run dev:stop
```

## Architecture

```
mosaic-sdk/
├── .mosaic/                    # Isolated environment directory
│   ├── claude/                 # Claude/Tony configuration
│   │   └── config.json        # Points to local MCP
│   ├── data/                  # Isolated data storage
│   │   └── mcp.db            # SQLite database
│   ├── logs/                  # Server logs
│   │   └── mcp-server.log    # MCP server output
│   ├── cache/                 # Temporary cache
│   └── mcp.pid               # Process ID for management
├── .env.development           # Environment configuration
└── scripts/
    ├── dev-environment.sh     # Environment management
    └── mosaic                 # CLI wrapper
```

## Configuration

The `.env.development` file contains:

```env
MCP_MODE=local
MCP_PORT=3456
MCP_HOST=localhost
MCP_DATABASE_PATH=./.mosaic/data/mcp.db
TONY_MCP_REQUIRED=true
MOSAIC_SDK_ISOLATED=true
```

## Use Cases

### 1. Testing MosAIc Features

```bash
# Start isolated environment
./scripts/mosaic dev start

# Test new MCP features
./scripts/mosaic tony create-agent --name test-agent

# Your changes only affect this directory
```

### 2. Development Workflow

```bash
# Make changes to mosaic-mcp
cd mosaic-mcp
vim src/server/index.ts

# Restart to test changes
cd ..
npm run dev:restart

# Test with isolated Tony
./scripts/mosaic tony test-feature
```

### 3. Side-by-Side Comparison

```bash
# Terminal 1: Regular Tony (your other projects)
cd ~/src/my-project
tony plan  # Uses existing Tony version

# Terminal 2: MosAIc Tony (isolated)
cd ~/src/mosaic-sdk
./scripts/mosaic tony plan  # Uses MosAIc with MCP
```

## Troubleshooting

### MCP Server Won't Start

```bash
# Check if port is in use
lsof -i:3456

# Clean start
./scripts/dev-environment.sh stop
rm -rf .mosaic/data/mcp.db
./scripts/dev-environment.sh start
```

### Can't Connect to MCP

```bash
# Test connection
curl http://localhost:3456/health

# Check logs
tail -f .mosaic/logs/mcp-server.log
```

### Database Issues

```bash
# Recreate database
cd mosaic-mcp
rm ../.mosaic/data/mcp.db
npm run migrate
```

## Best Practices

1. **Always use the wrapper**: The `mosaic` CLI ensures proper isolation
2. **Check status before starting**: Avoid multiple server instances
3. **Monitor logs**: Keep an eye on `.mosaic/logs/mcp-server.log`
4. **Clean shutdown**: Always use `dev:stop` to properly shut down

## Integration with Development

The isolated environment is perfect for:

- Testing MCP integration changes
- Developing new MosAIc features
- Running parallel experiments
- Demonstrating MosAIc capabilities
- Training and documentation

## Security Notes

- The isolated MCP server only listens on localhost
- Database is stored locally in `.mosaic/data/`
- No external network access required
- Configuration is directory-specific

---

This isolated environment ensures you can develop and test the MosAIc Stack without any risk to your production projects or other development work.