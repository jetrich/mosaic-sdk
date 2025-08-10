# Local Package Testing Guide

This guide explains how to test MosAIc SDK packages locally before publishing to production.

## Overview

Local testing uses Verdaccio, a lightweight private npm proxy registry, to simulate the package publishing workflow without affecting the production registry.

## Quick Start

```bash
# 1. Setup local registry (one-time)
./scripts/development/packages/setup-local-registry.sh setup

# 2. Configure NPM for local testing
./scripts/utilities/setup/configure-npm-auth.sh --local

# 3. Test all packages
./scripts/development/packages/test-package-publish.sh --all
```

## Detailed Setup

### Install Verdaccio

The setup script handles installation automatically, but you can also install manually:

```bash
# Global installation
npm install -g verdaccio

# Or use npx (no installation)
npx verdaccio
```

### Start Local Registry

```bash
# Start Verdaccio
./scripts/development/packages/setup-local-registry.sh start

# Check status
./scripts/development/packages/setup-local-registry.sh status

# Stop when done
./scripts/development/packages/setup-local-registry.sh stop
```

The local registry runs on: http://localhost:4873

### Configure NPM

```bash
# Configure for local testing
./scripts/utilities/setup/configure-npm-auth.sh --local
```

This creates a `.npmrc` file configured for local testing:
- Routes @mosaicstack/* packages to local registry
- Routes @dyorfoundation/* packages to local registry
- Other packages still use npm registry

## Testing Workflows

### Test Individual Package

```bash
# Full test (pack, install, publish)
./scripts/development/packages/test-package-publish.sh packages/mcp-common

# Test only packing
./scripts/development/packages/test-package-publish.sh --pack packages/mcp-common

# Test only installation
./scripts/development/packages/test-package-publish.sh --install packages/mcp-common

# Test only publishing
./scripts/development/packages/test-package-publish.sh --publish packages/mcp-common
```

### Test All Packages

```bash
# Test all packages in order
./scripts/development/packages/test-package-publish.sh --all
```

This tests packages in dependency order:
1. packages/mcp-common
2. packages/mcp-bookstack
3. packages/mcp-gitea-remote
4. packages/mcp-plane
5. packages/mcp-woodpecker
6. packages/mcp-integration
7. tony
8. mosaic-mcp
9. mosaic
10. mosaic-docs

### What Gets Tested

Each package test includes:

1. **Pack Test**
   - Creates npm package tarball
   - Verifies package contents
   - Checks package size

2. **Install Test**
   - Creates temporary project
   - Installs package as dependency
   - Verifies installation success

3. **Publish Test**
   - Dry run first
   - Publishes to local registry
   - Verifies package in registry

## Verdaccio Features

### Web Interface

Access the Verdaccio web UI at: http://localhost:4873

Features:
- Browse published packages
- View package details
- Search packages
- Download statistics

### User Management

Default test user (created automatically):
- Username: testuser
- Password: testpassword
- Email: test@mosaicstack.dev

Create additional users:
```bash
npm adduser --registry http://localhost:4873
```

### Package Management

View published packages:
```bash
# List all packages
npm search --registry http://localhost:4873

# View specific package
npm view @mosaicstack/mcp-common --registry http://localhost:4873

# View all versions
npm view @mosaicstack/mcp-common versions --registry http://localhost:4873
```

## Configuration

### Verdaccio Config

Location: `conf/development/verdaccio/config.yaml`

Key settings:
```yaml
# Storage location
storage: ./storage

# Package access rules
packages:
  '@mosaicstack/*':
    access: $all
    publish: $authenticated
    unpublish: $authenticated
    proxy: npmjs
  
  '@dyorfoundation/*':
    access: $all
    publish: $authenticated
    unpublish: $authenticated
    proxy: npmjs

# Max upload size
max_body_size: 100mb
```

### Custom Configuration

To use custom Verdaccio config:

```bash
# Edit config
vim conf/development/verdaccio/config.yaml

# Restart with new config
./scripts/development/packages/setup-local-registry.sh restart
```

## Testing Scenarios

### 1. Version Update Testing

```bash
# Bump version
./scripts/development/packages/bump-version.sh --type patch

# Test publishing new version
./scripts/development/packages/test-package-publish.sh --all
```

### 2. Dependency Testing

Create a test project:
```bash
mkdir /tmp/test-project
cd /tmp/test-project
npm init -y

# Install from local registry
npm install @mosaicstack/mcp-common --registry http://localhost:4873
```

### 3. Integration Testing

Test multiple packages together:
```bash
# In test project
npm install @mosaicstack/mosaic-mcp @mosaicstack/mcp-common \
  --registry http://localhost:4873

# Create test file
cat > test.js << EOF
const mcp = require('@mosaicstack/mosaic-mcp');
const common = require('@mosaicstack/mcp-common');
console.log('Packages loaded successfully');
EOF

# Run test
node test.js
```

### 4. Pre-release Testing

```bash
# Create beta version
./scripts/development/packages/bump-version.sh --prerelease beta

# Publish to local registry with beta tag
npm publish --tag beta --registry http://localhost:4873

# Install beta version
npm install @mosaicstack/package@beta --registry http://localhost:4873
```

## Troubleshooting

### Registry Not Starting

```bash
# Check if port is in use
lsof -i :4873

# Kill existing process
kill $(lsof -t -i :4873)

# Start fresh
./scripts/development/packages/setup-local-registry.sh start
```

### Authentication Issues

```bash
# Re-login to local registry
npm login --registry http://localhost:4873

# Check who you're logged in as
npm whoami --registry http://localhost:4873
```

### Package Not Found

```bash
# Check if package is published
npm view @mosaicstack/package --registry http://localhost:4873

# Check Verdaccio storage
ls -la ~/.local/share/verdaccio/storage/@mosaicstack/
```

### Clear Registry Data

```bash
# Stop Verdaccio
./scripts/development/packages/setup-local-registry.sh stop

# Clear storage
rm -rf ~/.local/share/verdaccio/storage/*

# Restart
./scripts/development/packages/setup-local-registry.sh start
```

## Best Practices

1. **Always Test Locally First**
   - Run full test suite before production publish
   - Verify package contents and dependencies
   - Test installation in clean environment

2. **Use Realistic Scenarios**
   - Test with actual dependency chains
   - Include peer dependencies
   - Test different Node.js versions

3. **Clean Testing**
   - Clear npm cache between tests: `npm cache clean --force`
   - Use fresh test directories
   - Reset Verdaccio storage for clean state

4. **Version Testing**
   - Test version bumps match expectations
   - Verify version consistency across workspace
   - Test pre-release versions

5. **Security Testing**
   - Check for accidental file inclusion
   - Verify no secrets in packages
   - Test with minimal permissions

## Advanced Usage

### Custom Registry Port

```bash
# Edit config to change port
sed -i 's/localhost:4873/localhost:5000/' conf/development/verdaccio/config.yaml

# Restart
./scripts/development/packages/setup-local-registry.sh restart
```

### Proxy Configuration

Verdaccio can proxy to npm for non-local packages:

```yaml
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
    timeout: 60s
    
packages:
  '**':
    proxy: npmjs  # Proxy all other packages to npm
```

### Storage Backends

Verdaccio supports various storage backends:
- Local filesystem (default)
- Amazon S3
- Google Cloud Storage
- Custom plugins

### Plugins

Useful Verdaccio plugins:
- `verdaccio-auth-memory`: In-memory auth
- `verdaccio-memory`: In-memory storage
- `verdaccio-gitlab`: GitLab authentication

Install plugins:
```bash
npm install -g verdaccio-plugin-name
```

## Conclusion

Local testing with Verdaccio provides a safe environment to:
- Test package publishing workflows
- Verify package contents and metadata
- Test installation and integration
- Practice version management
- Debug publishing issues

Always test locally before publishing to production!