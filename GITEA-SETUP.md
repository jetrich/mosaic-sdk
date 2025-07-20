# Gitea Setup and Configuration

This document explains how to set up and work with Gitea as the primary repository for the MosAIc SDK.

## Overview

The MosAIc SDK uses Gitea (https://git.mosaicstack.dev) as the primary repository with automatic mirroring to GitHub. This provides:
- Full control over our infrastructure
- Private repositories
- Self-hosted CI/CD with Woodpecker
- GitHub as automatic backup

## Initial Setup

### 1. Get Access
Contact the team administrator to get an account on https://git.mosaicstack.dev

### 2. Configure Authentication

Run the setup script:
```bash
./scripts/utilities/setup/configure-gitea-auth.sh
```

Or manually configure:

#### Option A: Access Token with .netrc (Recommended)
1. Create an access token at https://git.mosaicstack.dev/user/settings/applications
2. Add to `~/.netrc`:
   ```
   machine git.mosaicstack.dev login YOUR_USERNAME password YOUR_TOKEN
   ```
3. Set permissions: `chmod 600 ~/.netrc`

#### Option B: SSH Key
1. Generate SSH key: `ssh-keygen -t ed25519 -f ~/.ssh/gitea_ed25519`
2. Add to `~/.ssh/config`:
   ```
   Host git.mosaicstack.dev
       HostName git.mosaicstack.dev
       User git
       IdentityFile ~/.ssh/gitea_ed25519
   ```
3. Add public key to Gitea account settings

## Repository Configuration

All repositories are configured with dual push to both Gitea (primary) and GitHub (mirror).

### Remote Structure
```
origin -> Gitea (fetch and push)
       -> GitHub (push only)
github -> GitHub (fetch and push - fallback)
```

### How It Works
1. `git pull` - Pulls from Gitea
2. `git push` - Pushes to BOTH Gitea and GitHub automatically
3. `git push github` - Direct push to GitHub if needed

## Daily Workflow

### Normal Development
```bash
# Pull latest changes (from Gitea)
git pull

# Make changes
git add .
git commit -m "feat: your changes"

# Push to both Gitea and GitHub
git push
```

### Creating Pull Requests
1. Push feature branch: `git push origin feature/your-feature`
2. Create PR in Gitea UI at https://git.mosaicstack.dev/mosaic/[repo]/pulls
3. After merge, changes automatically sync to GitHub

### Emergency GitHub Access
If Gitea is unavailable:
```bash
# Pull from GitHub
git pull github main

# Push directly to GitHub
git push github main
```

## Cloning Repositories

### New Developer Setup
```bash
# Clone with submodules from Gitea
git clone --recursive https://git.mosaicstack.dev/mosaic/mosaic-sdk.git

# Configure authentication
cd mosaic-sdk
./scripts/utilities/setup/configure-gitea-auth.sh
```

### Existing Clone Migration
If you have an existing clone from GitHub:
```bash
# Run the remote configuration script
./scripts/services/gitea/update-remotes.sh
```

## CI/CD with Woodpecker

Woodpecker CI is configured to run on Gitea pushes. See `.woodpecker.yml` for pipeline configuration.

### Required Secrets in Woodpecker
- `npm_token` - For package publishing
- `gitea_token` - For creating releases
- `gitea_url` - Set to https://git.mosaicstack.dev

## Troubleshooting

### Authentication Failed
1. Check token is valid: `curl -H "Authorization: token YOUR_TOKEN" https://git.mosaicstack.dev/api/v1/user`
2. Verify .netrc permissions: `ls -la ~/.netrc` (should be 600)
3. Try verbose mode: `GIT_TRACE=1 git push`

### Push to Gitea Failed
1. Check remote configuration: `git remote -v`
2. Verify dual push setup: `git config --get-all remote.origin.pushurl`
3. Test Gitea connectivity: `git ls-remote origin`

### Submodule Issues
1. Sync submodule URLs: `git submodule sync`
2. Update submodules: `git submodule update --init --recursive`
3. Check .gitmodules points to Gitea URLs

## Benefits

1. **Independence**: Not dependent on GitHub's infrastructure
2. **Privacy**: Private repositories under our control
3. **Reliability**: GitHub serves as automatic backup
4. **Simplicity**: Single `git push` updates both locations
5. **Flexibility**: Can work with either remote if needed

## Security Notes

- Never commit `.netrc` or access tokens
- Access tokens are safer than passwords for CLI usage
- Tokens can be revoked without changing passwords
- Use specific scopes when creating tokens

## Migration Status

✅ All repositories migrated to Gitea
✅ Dual push configured for all repos
✅ Woodpecker CI configured
✅ Documentation updated

For questions or issues, contact the development team.