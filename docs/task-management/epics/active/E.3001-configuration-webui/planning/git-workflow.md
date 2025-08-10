# Git Workflow for Dual Repository Management

## Overview

The mosaic-webui component maintains two git repositories:

- **Primary**: https://git.mosaicstack.dev/mosaic/mosaic-webui (CI/CD enabled)
- **Mirror**: https://github.com/jetrich/mosaic-webui (Public visibility)

## Repository Configuration

### Initial Setup

```bash
# Clone from primary
git clone https://git.mosaicstack.dev/mosaic/mosaic-webui.git
cd mosaic-webui

# Add GitHub as secondary remote
git remote add github https://github.com/jetrich/mosaic-webui.git

# Verify remotes
git remote -v
# origin    https://git.mosaicstack.dev/mosaic/mosaic-webui.git (fetch)
# origin    https://git.mosaicstack.dev/mosaic/mosaic-webui.git (push)
# github    https://github.com/jetrich/mosaic-webui.git (fetch)
# github    https://github.com/jetrich/mosaic-webui.git (push)
```

### Push Configuration

```bash
# Configure push to both remotes
git config --add remote.origin.pushurl https://git.mosaicstack.dev/mosaic/mosaic-webui.git
git config --add remote.origin.pushurl https://github.com/jetrich/mosaic-webui.git

# Now 'git push' updates both repositories
```

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/E.3001-config-editor

# Make changes
git add .
git commit -m "feat(config): implement visual configuration editor"

# Push to both remotes
git push origin feature/E.3001-config-editor
git push github feature/E.3001-config-editor
```

### 2. Pull Request Process

- **Primary PR**: Create on git.mosaicstack.dev for CI/CD
- **Mirror PR**: Optionally create on GitHub for visibility
- **Merge**: Always merge on primary first

### 3. Synchronization

```bash
# If repositories get out of sync
git fetch origin
git fetch github

# Check differences
git log origin/main..github/main
git log github/main..origin/main

# Force sync GitHub to match primary
git push github origin/main:main --force-with-lease
```

## CI/CD Integration

### Primary Repository (git.mosaicstack.dev)

```yaml
# .gitlab-ci.yml or equivalent
stages:
  - test
  - build
  - deploy

test:
  script:
    - npm install
    - npm run test
    - npm run lint

build:
  script:
    - npm run build
    - docker build -t mosaic-webui .

deploy:
  script:
    - docker push registry.mosaicstack.dev/mosaic-webui
    - kubectl apply -f k8s/
  only:
    - main
```

### Mirror Repository (GitHub)

```yaml
# .github/workflows/sync-notification.yml
name: Sync Notification
on:
  push:
    branches: [main]

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Notify of sync
        run: |
          echo "Code synced from primary repository"
          echo "CI/CD runs on git.mosaicstack.dev"
```

## Commit Standards

### Conventional Commits

```
feat(scope): add new feature
fix(scope): fix bug
docs(scope): update documentation
style(scope): formatting changes
refactor(scope): code restructuring
test(scope): add tests
chore(scope): maintenance tasks
```

### Scope Examples

- `config`: Configuration editor
- `dashboard`: Project dashboard
- `epic`: Epic visualization
- `agent`: Agent monitoring
- `api`: API integration

## Branch Protection

### Primary Repository

- Require PR reviews
- Run CI/CD checks
- No direct pushes to main
- Require up-to-date branches

### Mirror Repository

- Sync-only for main branch
- Feature branches allowed
- PRs for community contributions

## Troubleshooting

### Out of Sync

```bash
# Check status
git fetch --all
git branch -vv

# Reset mirror to match primary
git checkout main
git reset --hard origin/main
git push github main --force-with-lease
```

### Failed Push

```bash
# Push to repositories individually
git push origin
git push github

# Check for errors
git remote show origin
git remote show github
```

### Merge Conflicts

Always resolve on primary repository first, then sync to mirror.

## Security Considerations

1. **Credentials**: Use SSH keys or tokens, not passwords
2. **Secrets**: Never commit secrets, use environment variables
3. **Access**: Limit GitHub access, primary repo is source of truth
4. **Audit**: All changes tracked in primary repository

## Best Practices

1. **Always push to both repositories**
2. **Create PRs on primary for CI/CD**
3. **Keep commit messages consistent**
4. **Tag releases on both repositories**
5. **Document any sync issues**

## Automation Script

```bash
#!/bin/bash
# push-both.sh
set -e

echo "Pushing to primary repository..."
git push origin "$@"

echo "Pushing to mirror repository..."
git push github "$@"

echo "✅ Successfully pushed to both repositories"
```

Make executable: `chmod +x push-both.sh`
Usage: `./push-both.sh main`
