# MCP Server Deployment Guide

## Overview

This guide covers the complete deployment process for the MosAIc MCP Server, from development to production installation at `~/.config/mosaic`.

## Development to Production Pipeline

```
Development (packages/mcp-server)
    ↓ Build
TypeScript → JavaScript (dist/)
    ↓ Install Script
Deploy to ~/.config/mosaic/mcp-server
    ↓ Configure
Update ~/.claude.json
    ↓ Use
Claude Code spawns MCP server
```

## Step-by-Step Deployment

### 1. Prepare the Source

```bash
# Navigate to the package
cd packages/mcp-server

# Ensure package.json is correct
cat package.json | grep '"name"'
# Should output: "@mosaicstack/mcp-server"

# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Verify build output
ls -la dist/main.js dist/utils/zodToJsonSchema.js
```

### 2. Run Installation Script

The `install-central-mcp.sh` script handles the deployment:

```bash
# From project root
cd /home/jwoltje/src/mosaic-sdk

# Run installation
bash scripts/install-central-mcp.sh
```

What the script does:
1. Creates directory structure at `~/.config/mosaic`
2. Copies the built MCP server files
3. Copies the planning plugin
4. Creates startup wrapper script
5. Sets up default configuration
6. Installs production dependencies

### 3. Manual Installation (Alternative)

If the script fails or you need manual control:

```bash
# Create directories
mkdir -p ~/.config/mosaic/{bin,data,logs,config,mcp-server}

# Copy server files
cp -r packages/mcp-server/* ~/.config/mosaic/mcp-server/

# Copy planning plugin
cp -r packages/planning-plugin ~/.config/mosaic/mcp-server/

# Install production dependencies
cd ~/.config/mosaic/mcp-server
npm install --production

# Create configuration
cat > ~/.config/mosaic/config/config.json << 'EOF'
{
  "version": "1.0.0",
  "transport": {
    "type": "stdio",
    "timeout": 30000
  },
  "database": {
    "path": "~/.config/mosaic/data/mcp.db"
  },
  "logging": {
    "level": "info",
    "file": "~/.config/mosaic/logs/mcp.log"
  }
}
EOF
```

### 4. Configure Claude Code

Update `~/.claude.json` to register the MCP server:

```json
{
  "mcpServers": {
    "mosaic": {
      "command": "node",
      "args": [
        "/home/jwoltje/.config/mosaic/mcp-server/dist/main.js",
        "serve"
      ],
      "env": {
        "MOSAIC_CONFIG": "/home/jwoltje/.config/mosaic/config/config.json",
        "MOSAIC_DATA_DIR": "/home/jwoltje/.config/mosaic/data",
        "MOSAIC_OLLAMA_URL": "http://10.1.1.42:11434"
      }
    }
  }
}
```

### 5. Verify Installation

```bash
# Test tool listing
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | \
  node ~/.config/mosaic/mcp-server/dist/main.js serve 2>/dev/null | \
  jq '.result.tools | length'
# Should output: 33

# Check specific tool
node ~/.config/mosaic/mcp-server/dist/main.js tools | grep mosaic_task_create

# Test in Claude Code
# Restart Claude Code and run:
# /mcp
# Should show "mosaic" with 33 tools
```

## Directory Structure After Deployment

```
~/.config/mosaic/
├── bin/
│   └── mosaic-mcp-server      # Wrapper script
├── config/
│   └── config.json            # Main configuration
├── data/
│   └── mcp.db                # SQLite database
├── logs/
│   └── mcp.log               # Server logs
└── mcp-server/
    ├── dist/                 # Compiled JavaScript
    │   ├── main.js
    │   ├── server/
    │   ├── services/
    │   ├── tools/
    │   └── utils/
    ├── planning-plugin/      # Planning tools
    ├── node_modules/         # Dependencies
    └── package.json
```

## Environment-Specific Configuration

### Development

```json
{
  "transport": {
    "type": "stdio"
  },
  "logging": {
    "level": "debug",
    "console": true
  }
}
```

### Production

```json
{
  "transport": {
    "type": "stdio"
  },
  "logging": {
    "level": "info",
    "console": false,
    "file": "~/.config/mosaic/logs/mcp.log"
  },
  "security": {
    "rate_limiting": {
      "enabled": true,
      "max_requests_per_minute": 100
    }
  }
}
```

## Updating the Deployment

When making changes to the MCP server:

```bash
# 1. Make changes in packages/mcp-server/src/
cd packages/mcp-server

# 2. Rebuild
npm run build

# 3. Test locally
npm test

# 4. Redeploy
cd ../..
bash scripts/install-central-mcp.sh

# 5. Restart Claude Code to pick up changes
```

## Rollback Procedure

If a deployment causes issues:

```bash
# 1. Backup current (broken) version
mv ~/.config/mosaic/mcp-server ~/.config/mosaic/mcp-server.broken

# 2. Restore previous version (if backed up)
cp -r ~/.config/mosaic/mcp-server.backup ~/.config/mosaic/mcp-server

# 3. Or reinstall from a known good commit
git checkout <good-commit-hash>
cd packages/mcp-server
npm run build
cd ../..
bash scripts/install-central-mcp.sh
```

## Troubleshooting Deployment

### Issue: "Cannot find module" errors

```bash
# Reinstall dependencies
cd ~/.config/mosaic/mcp-server
npm install --production
```

### Issue: Permission denied

```bash
# Fix permissions
chmod -R u+rwX ~/.config/mosaic
chmod +x ~/.config/mosaic/bin/mosaic-mcp-server
```

### Issue: Database locked

```bash
# Stop all MCP processes
pkill -f mcp-server

# Remove lock file if exists
rm -f ~/.config/mosaic/data/mcp.db-journal
```

### Issue: Old version still running

```bash
# Find and kill old processes
ps aux | grep mcp-server
kill <pid>

# Restart Claude Code to spawn new version
```

## Production Considerations

### 1. Logging

Configure appropriate log levels and rotation:

```bash
# Add to crontab for log rotation
0 0 * * * find ~/.config/mosaic/logs -name "*.log" -mtime +7 -delete
```

### 2. Monitoring

Set up monitoring for:
- Process health
- Disk usage (database growth)
- Error rates in logs
- Response times

### 3. Backup

Regular backups of:
- `~/.config/mosaic/data/mcp.db` - Database
- `~/.config/mosaic/config/` - Configuration
- `~/.claude.json` - Claude Code settings

### 4. Security

- Restrict file permissions
- Use environment variables for sensitive data
- Enable rate limiting
- Audit tool access logs

## Multi-User Deployment

For shared systems:

```bash
# System-wide installation
sudo mkdir -p /opt/mosaic/mcp-server
sudo cp -r packages/mcp-server/* /opt/mosaic/mcp-server/
sudo npm install --production --prefix /opt/mosaic/mcp-server

# User-specific configuration
mkdir -p ~/.config/mosaic
cat > ~/.config/mosaic/config.json << EOF
{
  "database": {
    "path": "~/.config/mosaic/data/mcp.db"
  }
}
EOF

# Update Claude Code config to use system installation
# but user-specific data directory
```

## Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY packages/mcp-server/package*.json ./
RUN npm ci --production

COPY packages/mcp-server/dist ./dist
COPY packages/planning-plugin ./planning-plugin

EXPOSE 3456

CMD ["node", "dist/main.js", "serve", "--http", "--port", "3456"]
```

## CI/CD Integration

```yaml
# .github/workflows/deploy-mcp.yml
name: Deploy MCP Server

on:
  push:
    branches: [main]
    paths:
      - 'packages/mcp-server/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Build
        run: |
          cd packages/mcp-server
          npm ci
          npm run build
          npm test
      
      - name: Deploy
        run: |
          bash scripts/install-central-mcp.sh
```

## Conclusion

The deployment process is designed to be:
- **Repeatable**: Script-driven for consistency
- **Testable**: Verify at each step
- **Reversible**: Rollback capability
- **Scalable**: Single-user to multi-user setups

Always test changes in development before deploying to `~/.config/mosaic`!