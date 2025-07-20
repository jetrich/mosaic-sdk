# Git Workflow Guide for MosAIc SDK

This document outlines the Git workflow and best practices for the MosAIc SDK project.

## Repository Structure

The MosAIc SDK uses a monorepo structure with Git submodules:

```
mosaic-sdk/              # Main meta-repository
├── mosaic/             # MosAIc platform (submodule)
├── mosaic-mcp/         # MCP server (submodule)
├── mosaic-dev/         # Dev tools (submodule)
└── tony/               # Tony framework (submodule)
```

## Workflow Overview

### 1. Initial Setup

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/jetrich/mosaic-sdk.git
cd mosaic-sdk

# If you already cloned without submodules
git submodule update --init --recursive
```

### 2. Feature Development

#### Working in the Main Repository

```bash
# Create feature branch
git checkout -b feat/your-feature-name

# Make changes
# ... edit files ...

# Stage changes
git add -A

# Commit with conventional format
git commit -m "feat: add new orchestration capability"

# Push to remote
git push origin feat/your-feature-name
```

#### Working with Submodules

```bash
# Navigate to submodule
cd mosaic-mcp

# Create feature branch
git checkout -b feat/mcp-enhancement

# Make changes and commit
git add -A
git commit -m "feat: enhance MCP protocol handling"

# Push submodule changes
git push origin feat/mcp-enhancement

# Go back to main repo
cd ..

# Update submodule reference
git add mosaic-mcp
git commit -m "feat: update mosaic-mcp with protocol enhancements"

# Push main repo changes
git push origin feat/your-feature-name
```

### 3. Keeping Up to Date

```bash
# Update main repository
git pull origin main

# Update all submodules
git submodule update --remote --merge

# Or update specific submodule
git submodule update --remote --merge mosaic-mcp
```

## Branch Naming Conventions

- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation only
- `style/` - Code style changes (formatting, etc.)
- `refactor/` - Code refactoring
- `perf/` - Performance improvements
- `test/` - Test additions or fixes
- `build/` - Build system changes
- `ci/` - CI/CD changes
- `chore/` - Other changes (dependencies, etc.)

## Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Examples

```bash
# Feature
git commit -m "feat: add WebSocket support to MCP server"

# Bug fix with scope
git commit -m "fix(mcp): resolve connection timeout issue"

# Breaking change
git commit -m "feat!: require MCP for all Tony agents

BREAKING CHANGE: Tony 2.8.0 now requires MCP server connection"

# Multiple changes
git commit -m "feat: implement session recovery

- Add session persistence to database
- Implement reconnection logic
- Add session recovery tests

Closes #123"
```

## Pull Request Process

### 1. Before Creating PR

- [ ] Run all tests: `npm test`
- [ ] Build project: `npm run build:all`
- [ ] Update documentation
- [ ] Update CHANGELOG.md
- [ ] Check for sensitive data
- [ ] Lint code: `npm run lint`

### 2. Creating the PR

```bash
# Push your branch
git push origin feat/your-feature-name

# Create PR via GitHub web interface or CLI
gh pr create --title "feat: Add new feature" \
  --body "## Summary
  
  Describe your changes...
  
  ## Testing
  - [ ] Unit tests pass
  - [ ] Integration tests pass
  - [ ] Manual testing completed
  
  ## Checklist
  - [ ] Code follows style guidelines
  - [ ] Documentation updated
  - [ ] CHANGELOG.md updated"
```

### 3. PR Review Process

1. Automated CI/CD checks must pass
2. At least one code review approval required
3. No merge conflicts
4. All conversations resolved
5. Branch is up to date with main

## Submodule Best Practices

### 1. Always Commit Submodule Changes First

```bash
# In submodule directory
cd mosaic-mcp
git add -A
git commit -m "fix: resolve memory leak"
git push origin fix/memory-leak

# Then in main repo
cd ..
git add mosaic-mcp
git commit -m "fix: update mosaic-mcp memory leak fix"
```

### 2. Check Submodule Status Regularly

```bash
# See current submodule commits
git submodule status

# Check for updates
git submodule foreach git fetch
git submodule foreach git status
```

### 3. Coordinate Submodule Updates

When updating multiple submodules:

```bash
# Update all submodules to latest
git submodule foreach git pull origin main

# Stage all submodule updates
git add mosaic mosaic-mcp mosaic-dev tony

# Commit with clear message
git commit -m "chore: update all submodules to latest versions"
```

## Handling Conflicts

### Main Repository Conflicts

```bash
# Fetch latest changes
git fetch origin

# Rebase your branch
git rebase origin/main

# Resolve conflicts
# Edit conflicted files
git add <resolved-files>
git rebase --continue
```

### Submodule Conflicts

```bash
# If submodule reference conflicts
git status  # Shows conflicted submodule

# Choose the correct commit
cd <submodule>
git checkout <correct-commit>

# Update reference
cd ..
git add <submodule>
git commit -m "fix: resolve submodule conflict"
```

## Git Hooks

Consider setting up these Git hooks for consistency:

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Run linting
npm run lint || exit 1

# Check for console.log
git diff --cached --name-only | grep -E '\.(js|ts)$' | xargs grep -n 'console.log' && echo "Remove console.log statements" && exit 1

exit 0
```

### Commit Message Hook

```bash
#!/bin/bash
# .git/hooks/commit-msg

# Check commit message format
commit_regex='^(feat|fix|docs|style|refactor|perf|test|build|ci|chore)(\(.+\))?: .{1,50}'

if ! grep -qE "$commit_regex" "$1"; then
    echo "Invalid commit message format!"
    echo "Format: <type>(<scope>): <subject>"
    exit 1
fi
```

## Emergency Procedures

### Undoing Changes

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Revert a pushed commit
git revert <commit-hash>
```

### Recovering Lost Work

```bash
# Find lost commits
git reflog

# Recover commit
git checkout <lost-commit-hash>
```

## Security Considerations

1. **Never commit**:
   - API keys or tokens
   - Passwords or credentials
   - Private keys or certificates
   - `.env` files with real values

2. **Use `.gitignore`** properly
3. **Review changes** before committing: `git diff --staged`
4. **Use Git secrets scanning** tools

## Additional Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules)