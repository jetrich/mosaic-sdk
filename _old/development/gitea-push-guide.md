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