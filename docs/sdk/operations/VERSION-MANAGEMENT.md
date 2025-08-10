# Version Management Guide

This guide covers version management strategies and workflows for the MosAIc SDK monorepo.

## Overview

The MosAIc SDK uses a synchronized versioning strategy where all packages in the workspace maintain the same version number. This simplifies dependency management and release coordination.

## Version Strategy

### Synchronized Versioning

All packages share the same version:
- Root package.json
- All workspace packages
- VERSION file (source of truth)

Benefits:
- Simplified dependency management
- Clear release boundaries
- Easier troubleshooting
- Consistent user experience

### Semantic Versioning

We follow [Semantic Versioning 2.0.0](https://semver.org/):

- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

Pre-release versions:
- **1.2.3-beta** (beta release)
- **1.2.3-rc.1** (release candidate)
- **1.2.3-alpha.20240115** (alpha with date)

## Version Management Tools

### Bump Version Script

The primary tool for version management:

```bash
./scripts/development/packages/bump-version.sh
```

### Basic Usage

```bash
# Bump patch version (1.2.3 → 1.2.4)
./scripts/development/packages/bump-version.sh

# Bump minor version (1.2.3 → 1.3.0)
./scripts/development/packages/bump-version.sh --type minor

# Bump major version (1.2.3 → 2.0.0)
./scripts/development/packages/bump-version.sh --type major

# Set specific version
./scripts/development/packages/bump-version.sh --set 2.0.0
```

### Pre-release Versions

```bash
# Create beta release (1.2.3 → 1.3.0-beta)
./scripts/development/packages/bump-version.sh --type minor --prerelease beta

# Create release candidate (1.3.0-beta → 1.3.0-rc.1)
./scripts/development/packages/bump-version.sh --set 1.3.0 --prerelease rc.1

# Create dated alpha (1.2.3 → 1.3.0-alpha.20240115)
./scripts/development/packages/bump-version.sh --type minor --prerelease alpha.$(date +%Y%m%d)
```

### Dry Run Mode

Always test version changes first:

```bash
# See what would change without modifying files
./scripts/development/packages/bump-version.sh --type major --dry-run
```

## Version Workflows

### Standard Release Workflow

1. **Prepare Release**
   ```bash
   # Create release branch
   git checkout -b release/v1.3.0
   
   # Bump version
   ./scripts/development/packages/bump-version.sh --type minor
   ```

2. **Update Documentation**
   - Update CHANGELOG.md
   - Update migration guides
   - Review README files

3. **Commit Version Bump**
   ```bash
   git add -A
   git commit -m "chore: bump version to 1.3.0"
   ```

4. **Create Pull Request**
   ```bash
   gh pr create --title "Release v1.3.0" \
     --body "$(cat RELEASE_NOTES.md)"
   ```

5. **After Merge**
   ```bash
   # Tag the release
   git tag -a v1.3.0 -m "Release version 1.3.0"
   git push origin v1.3.0
   ```

### Pre-release Workflow

1. **Create Beta**
   ```bash
   # From develop branch
   ./scripts/development/packages/bump-version.sh \
     --type minor --prerelease beta
   
   git commit -am "chore: prepare 1.3.0-beta"
   git tag v1.3.0-beta
   ```

2. **Test Beta**
   ```bash
   # Publish to registry with beta tag
   ./scripts/development/packages/publish-all.sh --tag beta
   ```

3. **Release Candidate**
   ```bash
   # After beta testing
   ./scripts/development/packages/bump-version.sh \
     --set 1.3.0 --prerelease rc.1
   
   git commit -am "chore: prepare 1.3.0-rc.1"
   git tag v1.3.0-rc.1
   ```

4. **Final Release**
   ```bash
   # Remove pre-release
   ./scripts/development/packages/bump-version.sh --set 1.3.0
   
   git commit -am "chore: release 1.3.0"
   git tag v1.3.0
   ```

### Hotfix Workflow

1. **Create Hotfix Branch**
   ```bash
   # From main/master
   git checkout -b hotfix/v1.2.4
   ```

2. **Apply Fix and Bump Patch**
   ```bash
   # Make fixes...
   
   # Bump patch version
   ./scripts/development/packages/bump-version.sh --type patch
   
   git commit -am "fix: critical bug in module X"
   ```

3. **Fast-track Release**
   ```bash
   # Merge to main
   git checkout main
   git merge --no-ff hotfix/v1.2.4
   
   # Tag immediately
   git tag v1.2.4
   git push origin main --tags
   ```

## Version Files

### VERSION File

Root-level file containing current version:
```
1.2.3
```

This is the source of truth for workspace version.

### Package.json Files

All package.json files are updated automatically:
```json
{
  "name": "@mosaicstack/package",
  "version": "1.2.3"
}
```

### Where Versions Appear

The bump script updates versions in:
- `/VERSION`
- `/package.json`
- `/tony/package.json`
- `/mosaic/package.json`
- `/mosaic-mcp/package.json`
- `/mosaic-docs/package.json`
- `/packages/*/package.json`

## Version Dependencies

### Workspace Dependencies

When packages depend on each other:
```json
{
  "dependencies": {
    "@mosaicstack/mcp-common": "workspace:*"
  }
}
```

The `workspace:*` protocol ensures local development uses the workspace version.

### Published Dependencies

After publishing, dependencies use the actual version:
```json
{
  "dependencies": {
    "@mosaicstack/mcp-common": "^1.2.3"
  }
}
```

## Branching Strategies

### Git Flow

```
main (stable releases)
├── develop (next release)
│   ├── feature/new-feature
│   └── feature/another-feature
├── release/v1.3.0 (release prep)
└── hotfix/v1.2.4 (urgent fixes)
```

### Version Branches

For major versions with long-term support:
```
main (latest)
├── v2.x (version 2 maintenance)
├── v1.x (version 1 maintenance)
└── v0.x (legacy support)
```

## Release Checklist

### Before Version Bump

- [ ] All tests passing
- [ ] No uncommitted changes
- [ ] CHANGELOG.md updated
- [ ] Breaking changes documented
- [ ] Migration guide prepared (if needed)

### Version Bump Process

- [ ] Run version bump script
- [ ] Review changed files
- [ ] Commit with message: `chore: bump version to X.Y.Z`
- [ ] Create pull request
- [ ] Get approval from maintainers

### After Version Bump

- [ ] Merge to main branch
- [ ] Create git tag: `git tag v1.2.3`
- [ ] Push tag: `git push --tags`
- [ ] Publish packages
- [ ] Create GitHub release
- [ ] Announce to users

## Version Guidelines

### When to Bump Versions

**Patch Version (x.x.Z)**
- Bug fixes
- Security patches
- Documentation updates
- Performance improvements (no API change)

**Minor Version (x.Y.x)**
- New features
- New APIs (backward compatible)
- Deprecations (with warnings)
- Significant improvements

**Major Version (X.x.x)**
- Breaking API changes
- Removal of deprecated features
- Major architectural changes
- Incompatible dependency updates

### Pre-release Guidelines

**Alpha**
- Early development
- Unstable APIs
- For internal testing
- Format: `1.3.0-alpha.1`

**Beta**
- Feature complete
- APIs stabilizing
- For community testing
- Format: `1.3.0-beta`

**Release Candidate**
- Production ready
- Final testing phase
- No new features
- Format: `1.3.0-rc.1`

## Automation

### CI/CD Integration

Example Woodpecker CI configuration:

```yaml
# .woodpecker/release.yml
pipeline:
  version-check:
    image: node:18
    commands:
      - ./scripts/development/packages/bump-version.sh --dry-run
    when:
      event: tag
      tag: v*

  publish:
    image: node:18
    commands:
      - ./scripts/development/packages/publish-all.sh
    when:
      event: tag
      tag: v*
```

### Git Hooks

Pre-commit hook for version consistency:

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check version consistency
if ! ./scripts/development/packages/check-versions.sh; then
  echo "Version mismatch detected. Run bump-version.sh"
  exit 1
fi
```

## Troubleshooting

### Version Mismatch

```bash
# Check all versions
find . -name "package.json" -not -path "*/node_modules/*" \
  -exec jq -r '.name + "@" + .version' {} \; | sort

# Fix mismatches
./scripts/development/packages/bump-version.sh --set $(cat VERSION)
```

### Failed Version Bump

```bash
# Revert changes
git checkout -- .

# Try again with verbose output
bash -x ./scripts/development/packages/bump-version.sh
```

### Tag Issues

```bash
# Delete local tag
git tag -d v1.2.3

# Delete remote tag
git push origin :refs/tags/v1.2.3

# Recreate tag
git tag -a v1.2.3 -m "Release version 1.2.3"
git push origin v1.2.3
```

## Best Practices

1. **Always Use the Script**
   - Don't manually edit versions
   - Ensures consistency across workspace
   - Maintains VERSION file sync

2. **Test Before Release**
   - Use dry run mode
   - Test in local registry
   - Verify all packages build

3. **Clear Commit Messages**
   - `chore: bump version to X.Y.Z`
   - Include reason for major/minor bumps
   - Reference issues/PRs

4. **Tag Consistently**
   - Always prefix with 'v': `v1.2.3`
   - Sign tags for security: `git tag -s`
   - Push tags immediately

5. **Document Changes**
   - Update CHANGELOG.md first
   - Include migration guides
   - Announce breaking changes

## Version History

Track version history in CHANGELOG.md:

```markdown
# Changelog

## [1.3.0] - 2024-01-15
### Added
- New feature X
- Enhanced API for Y

### Changed
- Improved performance of Z

### Fixed
- Bug in module A
- Security issue in B

## [1.2.3] - 2024-01-01
### Fixed
- Critical bug in production
```

## Conclusion

Consistent version management is crucial for:
- User trust and expectations
- Dependency resolution
- Support and troubleshooting
- Release coordination

Always follow the established workflows and use the provided tools to maintain version consistency across the MosAIc SDK workspace.