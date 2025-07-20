---
title: "01 Git Workflow"
order: 01
category: "development-workflow"
tags: ["development-workflow", "getting-started", "documentation"]
last_updated: "2025-01-19"
author: "migration"
version: "1.0"
status: "published"
---
# Gitea Push Guide for MosAIc SDK

This guide provides step-by-step instructions for pushing the MosAIc SDK repositories to Gitea.

## Prerequisites

- [ ] Gitea instance is running and accessible
- [ ] User account created with appropriate permissions
- [ ] SSH keys configured for authentication
- [ ] Git configured with user name and email

## Repository Setup

### 1. Create Repositories in Gitea

Create the following repositories in Gitea:
- `mosaic-sdk` (main meta-repository)
- `mosaic` (platform submodule)
- `mosaic-mcp` (MCP server submodule)
- `mosaic-dev` (dev tools submodule)
- `tony` (framework submodule)

### 2. Configure Remote URLs

```bash
# Main repository
cd /home/jwoltje/src/mosaic-sdk
git remote add gitea git@gitea.local:jetrich/mosaic-sdk.git

# Submodules
cd mosaic && git remote add gitea git@gitea.local:jetrich/mosaic.git && cd ..
cd mosaic-mcp && git remote add gitea git@gitea.local:jetrich/mosaic-mcp.git && cd ..
cd mosaic-dev && git remote add gitea git@gitea.local:jetrich/mosaic-dev.git && cd ..
cd tony && git remote add gitea git@gitea.local:jetrich/tony.git && cd ..
```

## Pre-Push Checklist

### Security Audit
- [ ] No API keys or tokens in code
- [ ] No passwords or credentials
- [ ] No private keys or certificates
- [ ] No production .env files
- [ ] No customer data or PII

### Code Quality
- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build:all`)
- [ ] No console.log in production code
- [ ] TypeScript compilation succeeds

### Documentation
- [ ] README.md is current
- [ ] CHANGELOG.md updated
- [ ] API docs generated
- [ ] Setup instructions tested
- [ ] License files present

### Git Hygiene
- [ ] Commits follow conventional format
- [ ] No large files (>100MB)
- [ ] .gitignore properly configured
- [ ] No unnecessary files tracked
- [ ] Submodule references correct

## Push Process

### 1. Stage All Changes

```bash
# Check current status
git status

# Review changes
git diff

# Stage all changes
git add -A

# Review staged changes
git diff --staged
```

### 2. Commit Changes

```bash
# Create comprehensive commit
git commit -m "feat: complete MosAIc SDK implementation

- Implement Tony 2.8.0 with mandatory MCP
- Add comprehensive CI/CD pipeline
- Create production deployment configs
- Enhance documentation structure
- Configure Git best practices

This commit represents the full implementation of the MosAIc SDK
with all components properly configured for production use."
```

### 3. Push Submodules First

```bash
# Push each submodule
cd mosaic
git push gitea main
cd ..

cd mosaic-mcp
git push gitea main
cd ..

cd mosaic-dev
git push gitea main
cd ..

cd tony
git push gitea main
cd ..
```

### 4. Push Main Repository

```bash
# Push main repository
git push gitea main

# Push tags if any
git push gitea --tags
```

## Post-Push Verification

### 1. Verify in Gitea UI
- [ ] All repositories visible
- [ ] Commits show correctly
- [ ] Submodule links work
- [ ] Files can be browsed
- [ ] No push errors

### 2. Test Clone
```bash
# Test cloning fresh copy
cd /tmp
git clone --recurse-submodules git@gitea.local:jetrich/mosaic-sdk.git
cd mosaic-sdk
npm run setup
```

### 3. Verify CI/CD
- [ ] Woodpecker CI triggered
- [ ] Pipeline passes
- [ ] Artifacts generated
- [ ] Notifications sent

## Troubleshooting

### Permission Denied
```bash
# Check SSH key
ssh -T git@gitea.local

# Add SSH key to agent
ssh-add ~/.ssh/id_rsa
```

### Submodule Issues
```bash
# Update .gitmodules with new URLs
git config --file=.gitmodules submodule.mosaic.url git@gitea.local:jetrich/mosaic.git
# Repeat for each submodule

# Sync configuration
git submodule sync
```

### Large File Errors
```bash
# Install Git LFS
git lfs install

# Track large files
git lfs track "*.zip"
git lfs track "*.tar.gz"

# Add .gitattributes
git add .gitattributes
git commit -m "chore: add Git LFS tracking"
```

### Force Push (Emergency Only)
```bash
# Only if absolutely necessary
git push --force gitea main

# For submodules
cd submodule-name
git push --force gitea main
```

## Branch Protection Setup

After pushing, configure branch protection in Gitea:

1. Go to Settings → Branches
2. Add protection for `main`
3. Enable:
   - Require pull requests
   - Require approvals (1+)
   - Dismiss stale reviews
   - Require status checks
   - Restrict push access

## Mirror Configuration (Optional)

To maintain GitHub mirror:

```bash
# Add GitHub as second remote
git remote add github https://github.com/jetrich/mosaic-sdk.git

# Push to both remotes
git push gitea main
git push github main
```

## Final Steps

1. **Document Push**
   - Record push date/time
   - Note any issues encountered
   - Update team wiki/docs

2. **Notify Team**
   - Send completion notice
   - Share repository URLs
   - Provide access instructions

3. **Monitor**
   - Watch for CI/CD status
   - Check error logs
   - Verify functionality

## Quick Reference Commands

```bash
# Full push sequence
./scripts/push-to-gitea.sh

# Individual repository push
git push gitea main

# Push everything including tags
git push gitea --all
git push gitea --tags

# Verify remotes
git remote -v

# Check submodule status
git submodule status
```

## Support

For issues or questions:
- Check Gitea logs: `/var/log/gitea/`
- Review push output for errors
- Consult team documentation
- Contact system administrator

---

---

## Additional Content (Migrated)

# Git Worktrees Guide for MosAIc SDK

## Overview

The MosAIc SDK uses Git worktrees to enable parallel development across multiple branches without the overhead of switching branches or maintaining multiple clones. Each submodule has its own worktrees directory for managing feature branches, releases, and experiments.

## Directory Structure

```
mosaic-sdk/
├── worktrees/
│   ├── mosaic-worktrees/      # Worktrees for mosaic submodule
│   ├── mosaic-mcp-worktrees/  # Worktrees for mosaic-mcp submodule
│   └── tony-worktrees/        # Worktrees for tony submodule
├── mosaic/                    # Main mosaic submodule
├── mosaic-mcp/                # Main mosaic-mcp submodule
├── mosaic-dev/                # Main mosaic-dev submodule
└── tony/                      # Main tony submodule (pending)
```

## Using Worktrees

### Creating a New Worktree

To create a new worktree for a feature branch:

```bash
# For mosaic component
cd mosaic
git worktree add ../worktrees/mosaic-worktrees/feature-xyz feature/xyz

# For mosaic-mcp component
cd mosaic-mcp
git worktree add ../worktrees/mosaic-mcp-worktrees/mcp-enhancement feature/mcp-enhancement

# For tony component (when available)
cd tony
git worktree add ../worktrees/tony-worktrees/tony-2.8.0 feature/mcp-mandatory
```

### Listing Worktrees

```bash
# From within any submodule directory
git worktree list
```

### Working in a Worktree

```bash
# Navigate to the worktree
cd worktrees/mosaic-mcp-worktrees/mcp-enhancement

# Work normally - it's a full checkout
npm install
npm test
git add .
git commit -m "feat: implement enhancement"
git push origin feature/mcp-enhancement
```

### Removing a Worktree

```bash
# First, remove the worktree
git worktree remove worktrees/mosaic-worktrees/feature-xyz

# Or if you have uncommitted changes
git worktree remove --force worktrees/mosaic-worktrees/feature-xyz
```

## Best Practices

### 1. Naming Conventions

Use descriptive names that indicate the purpose:
- `feature-<name>` for feature branches
- `fix-<issue>` for bug fixes
- `release-<version>` for release preparation
- `experiment-<name>` for experimental work

### 2. Worktree Organization

Keep worktrees organized by purpose:
```bash
worktrees/
└── mosaic-mcp-worktrees/
    ├── feature-sequential-thinking/
    ├── fix-issue-68/
    ├── release-0.2.0/
    └── experiment-performance/
```

### 3. Clean Up Regularly

Remove worktrees when branches are merged:
```bash
# After merging a feature
git worktree remove worktrees/mosaic-mcp-worktrees/feature-sequential-thinking
git branch -d feature/sequential-thinking
```

### 4. Avoid Submodule Conflicts

When working with worktrees in a submodule setup:
- Always commit and push changes in worktrees before updating submodules
- Use `git submodule update --remote` carefully
- Communicate with team members about active worktrees

## Common Workflows

### Feature Development

```bash
# 1. Create feature worktree
cd mosaic-mcp
git worktree add ../worktrees/mosaic-mcp-worktrees/feature-awesome feature/awesome

# 2. Develop in the worktree
cd ../worktrees/mosaic-mcp-worktrees/feature-awesome
npm install
# ... make changes ...
npm test

# 3. Commit and push
git add .
git commit -m "feat: add awesome feature"
git push origin feature/awesome

# 4. Create PR and clean up after merge
# ... PR merged ...
cd ../../mosaic-mcp
git worktree remove ../worktrees/mosaic-mcp-worktrees/feature-awesome
```

### Parallel Development

Work on multiple features simultaneously:
```bash
# Terminal 1: Feature A
cd worktrees/mosaic-worktrees/feature-a
npm run dev

# Terminal 2: Feature B
cd worktrees/mosaic-worktrees/feature-b
npm run dev

# No branch switching needed!
```

### Release Preparation

```bash
# Create release worktree
cd mosaic
git worktree add ../worktrees/mosaic-worktrees/release-0.2.0 release/0.2.0

# Prepare release
cd ../worktrees/mosaic-worktrees/release-0.2.0
npm version minor
npm run build
npm run test

# Tag and push
git tag v0.2.0
git push origin release/0.2.0 --tags
```

### Worktree Locked Error

If you get "worktree is locked" error:
```bash
# Check why it's locked
git worktree list --verbose

# Unlock if safe
git worktree unlock worktrees/path/to/worktree
```

### Corrupt Worktree

If a worktree becomes corrupt:
```bash
# Remove and recreate
git worktree remove --force worktrees/corrupt-worktree
git worktree prune
git worktree add worktrees/new-worktree branch-name
```

### Submodule Worktree Issues

If submodule paths get confused:
```bash
# From the main repository
git submodule update --init --recursive
git submodule foreach 'git worktree prune'
```

## Integration with MosAIc Development

The worktree structure is particularly useful for:

1. **MCP Integration Work**: Develop MCP features without affecting main branch
2. **Tony 2.8.0 Development**: When ready, create worktree for MCP mandatory implementation
3. **Cross-Component Features**: Work on related features across multiple components
4. **Testing Integration**: Test how components work together without merging

## Security Considerations

- Don't create worktrees in public or shared directories
- Ensure worktrees follow the same security practices as main checkouts
- Be careful with credentials and secrets in worktree configurations

---

For more information on Git worktrees, see the [official Git documentation](https://git-scm.com/docs/git-worktree).

---

---

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
