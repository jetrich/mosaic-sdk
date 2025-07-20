# Git Hooks for MosAIc SDK

This directory contains Git hooks to ensure code quality and consistency across the MosAIc SDK project.

## Installation

To install all hooks:

```bash
./.git-hooks/install-hooks.sh
```

To uninstall all hooks:

```bash
./.git-hooks/uninstall-hooks.sh
```

## Available Hooks

### pre-commit
Runs before each commit to check:
- No merge conflicts
- No console.log statements (with override option)
- No sensitive information (passwords, API keys)
- Linting passes
- TypeScript compilation succeeds
- File sizes are reasonable (<100MB)
- No .env files are committed
- Counts TODO/FIXME comments

### commit-msg
Validates commit messages follow Conventional Commits format:
- Correct type prefix (feat, fix, docs, etc.)
- Proper format: `<type>(<scope>): <subject>`
- Message length recommendations
- Suggests issue references

### pre-push
Final checks before pushing:
- Warns about pushing to protected branches
- Runs all tests
- Checks for uncommitted changes
- Verifies submodules are pushed
- Runs build process
- Security audit
- Checks for large files (>50MB)

## Skipping Hooks

To skip hooks temporarily (use sparingly):

```bash
# Skip pre-commit and commit-msg
git commit --no-verify -m "emergency: quick fix"

# Skip pre-push
git push --no-verify
```

## Customization

Each hook can be customized by editing the respective file:
- `pre-commit` - Modify checks before commit
- `commit-msg` - Adjust message format requirements
- `pre-push` - Change push validations

## Troubleshooting

### Hook not executing
```bash
# Check if hook is installed
ls -la .git/hooks/

# Reinstall hooks
./.git-hooks/install-hooks.sh
```

### Hook failing incorrectly
```bash
# Run with debug info
bash -x .git/hooks/pre-commit

# Check specific command
npm run lint
```

### Permission denied
```bash
# Fix permissions
chmod +x .git-hooks/*
```

## Contributing

When adding new hooks:
1. Create hook file in `.git-hooks/`
2. Make it executable: `chmod +x hook-name`
3. Update `install-hooks.sh` to include it
4. Document in this README
5. Test on multiple platforms