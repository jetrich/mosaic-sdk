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

## Troubleshooting

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