# MosAIc Development Workflow with Gitea

## Daily Development Flow

### 1. Local Development (Gitea-First)
```bash
# Start work on new feature
git checkout -b feature/new-feature

# Regular commits
git add .
git commit -m "feat: implement new feature"

# Push to Gitea
git push origin feature/new-feature

# Create PR in Gitea UI
# After approval and merge, sync to GitHub
```

### 2. Sync to GitHub (Automated)
Once GitHub Sync Agent completes:
- Automatic: Gitea pushes trigger GitHub sync
- Manual: `git push github main` for immediate sync

### 3. CI/CD Pipeline (Coming with Woodpecker)
```
Push to Gitea → Woodpecker CI → Tests → Deploy
                      ↓
                GitHub Sync → GitHub Actions (backup)
```

## Repository-Specific Workflows

### mosaic-mcp (development branch default)
```bash
# Feature development
git checkout development
git pull origin development
git checkout -b feature/mcp-enhancement
# ... work ...
git push origin feature/mcp-enhancement
# Create PR to development branch

# Release process
git checkout -b release/v0.2.0 development
# ... prepare release ...
# PR to main
# Tag on main
```

### tony / mosaic (main branch default)
```bash
# Standard feature flow
git checkout main
git pull origin main  
git checkout -b feature/tony-enhancement
# ... work ...
git push origin feature/tony-enhancement
# Create PR to main
```

## Best Practices

1. **Commit Messages**:
   ```
   type(scope): description
   
   - feat: New feature
   - fix: Bug fix
   - docs: Documentation
   - test: Testing
   - chore: Maintenance
   ```

2. **PR Process**:
   - Create in Gitea
   - Require review (1 minimum)
   - Squash merge for clean history
   - Delete branch after merge

3. **Release Tags**:
   ```bash
   # After merge to main
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   git push github v1.0.0  # Sync tag
   ```

## Emergency GitHub Push

If sync service is down:
```bash
# Push directly to GitHub
git push github main --force-with-lease

# Sync all branches
git push github --all

# Sync tags
git push github --tags
```