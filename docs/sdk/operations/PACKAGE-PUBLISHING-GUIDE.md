# MosAIc SDK Package Publishing Guide

This guide covers the complete workflow for publishing packages from the MosAIc SDK to the Gitea NPM registry.

## Prerequisites

### 1. Gitea Personal Access Token

Create a token with package write permissions:

1. Navigate to https://git.mosaicstack.dev/user/settings/applications
2. Generate new token with scopes:
   - `write:package` (required for publishing)
   - `read:package` (for verifying published packages)
3. Save the token securely

### 2. Configure NPM Authentication

```bash
# Configure for production (Gitea)
./scripts/utilities/setup/configure-npm-auth.sh \
  --token "your-gitea-token" \
  --org mosaicstack

# Or configure for dyorfoundation org
./scripts/utilities/setup/configure-npm-auth.sh \
  --token "your-gitea-token" \
  --org dyorfoundation
```

The script will:
- Create `.npmrc` from template
- Set up authentication for the selected organization
- Optionally save token to your shell profile

### 3. Set Environment Variable

If not saved to profile:
```bash
export GITEA_NPM_TOKEN="your-gitea-token"
```

## Local Testing Before Publishing

### 1. Setup Local Registry

```bash
# Complete setup (install, configure, start)
./scripts/development/packages/setup-local-registry.sh setup

# Or just start if already configured
./scripts/development/packages/setup-local-registry.sh start
```

### 2. Configure for Local Testing

```bash
./scripts/utilities/setup/configure-npm-auth.sh --local
```

### 3. Test Package Publishing

```bash
# Test all packages
./scripts/development/packages/test-package-publish.sh --all

# Test specific package
./scripts/development/packages/test-package-publish.sh packages/mcp-common
```

## Version Management

### Update Versions

Before publishing, ensure all packages have the correct version:

```bash
# Bump patch version (default)
./scripts/development/packages/bump-version.sh

# Bump minor version
./scripts/development/packages/bump-version.sh --type minor

# Set specific version
./scripts/development/packages/bump-version.sh --set 1.0.0

# Create beta release
./scripts/development/packages/bump-version.sh --type minor --prerelease beta
```

### Version Consistency

The workspace maintains version consistency across all packages. The root `VERSION` file is the source of truth.

## Publishing Workflow

### 1. Dry Run Analysis

Always start with a dry run to see what would be published:

```bash
# Analyze all packages
./scripts/development/packages/publish-dry-run.sh

# Analyze specific package
./scripts/development/packages/publish-dry-run.sh --package packages/mcp-common

# Summary only
./scripts/development/packages/publish-dry-run.sh --summary
```

### 2. Publish Individual Package

```bash
# Publish a package
./scripts/development/packages/publish-package.sh packages/mcp-common

# Dry run first
./scripts/development/packages/publish-package.sh --dry-run packages/mcp-common

# Publish with beta tag
./scripts/development/packages/publish-package.sh --tag beta packages/mcp-common

# Skip tests/build (not recommended)
./scripts/development/packages/publish-package.sh \
  --skip-tests --skip-build packages/mcp-common
```

### 3. Publish All Packages

```bash
# Publish all packages
./scripts/development/packages/publish-all.sh

# Dry run first
./scripts/development/packages/publish-all.sh --dry-run

# Interactive mode (confirm each package)
./scripts/development/packages/publish-all.sh --interactive

# Continue on error
./scripts/development/packages/publish-all.sh --continue-on-error

# Publish with specific tag
./scripts/development/packages/publish-all.sh --tag beta
```

## Package Configuration

### Package.json Requirements

Each package must have:

```json
{
  "name": "@mosaicstack/package-name",
  "version": "1.0.0",
  "description": "Package description",
  "private": false,
  "publishConfig": {
    "registry": "https://git.mosaicstack.dev/api/packages/mosaicstack/npm/",
    "access": "public"
  },
  "files": [
    "dist",
    "src",
    "README.md"
  ],
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
}
```

### Files to Include

The `files` field in package.json controls what gets published:
- Source files (if needed)
- Built artifacts
- Type definitions
- Documentation
- License file

### Files to Exclude

These are automatically excluded:
- `node_modules/`
- Test files
- Configuration files
- `.git/`
- Development scripts

## Organization Management

### Using @mosaicstack

Default organization for official packages:
```bash
./scripts/utilities/setup/configure-npm-auth.sh \
  --token "your-token" \
  --org mosaicstack
```

### Using @dyorfoundation

For foundation packages:
```bash
./scripts/utilities/setup/configure-npm-auth.sh \
  --token "your-token" \
  --org dyorfoundation
```

## Troubleshooting

### Authentication Issues

```bash
# Check current configuration
./scripts/utilities/setup/configure-npm-auth.sh --check

# Verify token
curl -H "Authorization: token $GITEA_NPM_TOKEN" \
  https://git.mosaicstack.dev/api/v1/user
```

### Version Already Exists

```bash
# Force publish (use carefully)
./scripts/development/packages/publish-package.sh --force packages/mcp-common

# Or bump version first
./scripts/development/packages/bump-version.sh --type patch
```

### Local Registry Issues

```bash
# Check status
./scripts/development/packages/setup-local-registry.sh status

# Restart
./scripts/development/packages/setup-local-registry.sh restart

# Check logs
tail -f verdaccio.log
```

## Best Practices

1. **Always Test Locally First**
   - Use Verdaccio for local testing
   - Run the test-package-publish script
   - Verify package contents with dry run

2. **Version Management**
   - Follow semantic versioning
   - Keep all packages at same version
   - Update VERSION file and package.json files together

3. **Pre-publish Checks**
   - Run tests: `npm test`
   - Build packages: `npm run build`
   - Check for uncommitted changes
   - Verify package contents

4. **Documentation**
   - Update CHANGELOG.md before publishing
   - Ensure README.md is current
   - Document breaking changes

5. **Git Workflow**
   - Commit version bumps
   - Tag releases: `git tag v1.0.0`
   - Push tags: `git push --tags`

## CI/CD Integration

For automated publishing with Woodpecker CI, see the CI configuration in `.woodpecker/publish.yml`.

The CI pipeline:
1. Runs on version tags (v*)
2. Builds all packages
3. Runs all tests
4. Publishes to Gitea registry
5. Creates GitHub release

## Security Considerations

1. **Token Management**
   - Never commit `.npmrc` with tokens
   - Use environment variables
   - Rotate tokens regularly

2. **Package Verification**
   - Review package contents before publishing
   - Check for sensitive files
   - Verify dependencies

3. **Access Control**
   - Limit token scopes to minimum required
   - Use organization teams for access management
   - Audit package access regularly