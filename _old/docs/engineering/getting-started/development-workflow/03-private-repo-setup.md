---
title: "Git Configuration for Private Repositories"
order: 01
category: "git-setup"
tags: ["git", "ssh", "authentication", "gitea"]
last_updated: "2025-01-19"
author: "system"
version: "1.0"
status: "published"
---

# Git Configuration for Private Repositories

This guide explains how to configure Git to work with your private Gitea repositories at mosaicstack.dev.

## Prerequisites

- Git installed locally
- SSH key pair generated
- Access to Gitea instance at git.mosaicstack.dev

## SSH Configuration

### 1. Generate SSH Key (if needed)

```bash
# Generate a new ED25519 SSH key
ssh-keygen -t ed25519 -C "your-email@example.com" -f ~/.ssh/id_ed25519_gitea

# Or RSA if ED25519 is not supported
ssh-keygen -t rsa -b 4096 -C "your-email@example.com" -f ~/.ssh/id_rsa_gitea
```

### 2. Add SSH Key to SSH Agent

```bash
# Start SSH agent
eval "$(ssh-agent -s)"

# Add your SSH key
ssh-add ~/.ssh/id_ed25519_gitea
```

### 3. Configure SSH for Gitea

Create or edit `~/.ssh/config`:

```ssh-config
# Gitea at mosaicstack.dev
Host git.mosaicstack.dev
    HostName git.mosaicstack.dev
    Port 2222
    User git
    IdentityFile ~/.ssh/id_ed25519_gitea
    IdentitiesOnly yes
    AddKeysToAgent yes
    
# Alternative shorter alias
Host gitea
    HostName git.mosaicstack.dev
    Port 2222
    User git
    IdentityFile ~/.ssh/id_ed25519_gitea
    IdentitiesOnly yes
    AddKeysToAgent yes
```

### 4. Add SSH Key to Gitea

1. Copy your public key:
   ```bash
   cat ~/.ssh/id_ed25519_gitea.pub
   ```

2. Login to Gitea at https://git.mosaicstack.dev

3. Go to Settings → SSH / GPG Keys

4. Click "Add Key" and paste your public key

5. Give it a descriptive name (e.g., "Workstation SSH Key")

### 5. Test SSH Connection

```bash
# Test connection
ssh -T git@git.mosaicstack.dev -p 2222

# Expected output:
# Hi <username>! You've successfully authenticated, but Gitea does not provide shell access.
```

## Repository Configuration

### Clone Private Repository

```bash
# Using full SSH URL
git clone ssh://git@git.mosaicstack.dev:2222/mosaic/repository-name.git

# Using SSH config alias
git clone gitea:mosaic/repository-name.git

# Clone with specific branch
git clone -b develop ssh://git@git.mosaicstack.dev:2222/mosaic/repository-name.git
```

### Add Remote to Existing Repository

```bash
# Add Gitea remote
git remote add gitea ssh://git@git.mosaicstack.dev:2222/mosaic/repository-name.git

# Verify remotes
git remote -v

# Push to Gitea
git push gitea main
```

### Configure Multiple Remotes

```bash
# Keep GitHub as origin
git remote add origin git@github.com:username/repository.git

# Add Gitea as secondary
git remote add gitea ssh://git@git.mosaicstack.dev:2222/mosaic/repository.git

# Push to both
git push origin main
git push gitea main

# Or create alias to push to all
git config alias.pushall '!git push origin main && git push gitea main'
```

## HTTPS Configuration

### 1. Store Credentials

```bash
# Enable credential helper
git config --global credential.helper store

# Configure for specific host
git config --global credential.https://git.mosaicstack.dev.username your-username
```

### 2. Clone with HTTPS

```bash
# Clone (will prompt for password once)
git clone https://git.mosaicstack.dev/mosaic/repository-name.git

# Credentials will be saved for future use
```

### 3. Personal Access Token

For better security, use a personal access token instead of password:

1. Login to Gitea
2. Go to Settings → Applications
3. Generate New Token
4. Select appropriate permissions
5. Use token as password when prompted

```bash
# Clone with token
git clone https://your-username:your-token@git.mosaicstack.dev/mosaic/repository.git

# Or configure separately
git config --global credential.https://git.mosaicstack.dev.username your-username
git config --global credential.https://git.mosaicstack.dev.password your-token
```

## CI/CD Token Configuration

### For Woodpecker CI

1. Create a dedicated CI user or use organization token
2. Generate access token with repository read permissions
3. Configure in Woodpecker secrets:

```yaml
# In .woodpecker.yml
clone:
  git:
    image: woodpeckerci/plugin-git
    settings:
      netrc_machine: git.mosaicstack.dev
      netrc_username: ci-bot
      netrc_password:
        from_secret: gitea_token
```

### For Other CI Systems

```bash
# Configure git with token
git config --global url."https://oauth2:${GITEA_TOKEN}@git.mosaicstack.dev/".insteadOf "https://git.mosaicstack.dev/"

# Or for specific repository
git remote set-url origin https://oauth2:${GITEA_TOKEN}@git.mosaicstack.dev/mosaic/repo.git
```

## Common Issues and Solutions

### SSH Key Permissions

```bash
# Fix permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519_gitea
chmod 644 ~/.ssh/id_ed25519_gitea.pub
chmod 644 ~/.ssh/config
```

### Port 22 Blocked

If port 2222 is blocked, use HTTPS instead or configure SSH over HTTPS:

```ssh-config
Host git.mosaicstack.dev
    HostName git.mosaicstack.dev
    Port 443
    User git
    IdentityFile ~/.ssh/id_ed25519_gitea
    ProxyCommand nc -X connect -x proxy:8080 %h %p  # If using proxy
```

### Multiple SSH Keys

```bash
# List loaded keys
ssh-add -l

# Clear all keys
ssh-add -D

# Add specific key
ssh-add ~/.ssh/id_ed25519_gitea
```

### Debugging Connection

```bash
# Verbose SSH connection test
ssh -vvv -T git@git.mosaicstack.dev -p 2222

# Test specific config
ssh -F ~/.ssh/config -T gitea

# Check SSH agent
echo $SSH_AUTH_SOCK
ssh-add -l
```

## Best Practices

### 1. Use SSH Keys
- More secure than passwords
- No need to enter credentials repeatedly
- Can be easily revoked if compromised

### 2. Separate Keys for Different Services
- Use different SSH keys for GitHub, GitLab, Gitea
- Easier to manage and revoke
- Better security isolation

### 3. Regular Key Rotation
- Rotate SSH keys annually
- Remove unused keys from Gitea
- Keep backup of current keys

### 4. Secure Key Storage
- Use SSH agent for key management
- Consider hardware keys (YubiKey) for high-security
- Encrypt private keys with passphrase

### 5. Repository Mirroring

Set up automatic mirroring to GitHub for backup:

```bash
# In Gitea repository settings
# Settings → Repository → Mirror Settings
# Add GitHub as push mirror
```

## Quick Reference

### Clone Commands
```bash
# SSH (recommended)
git clone ssh://git@git.mosaicstack.dev:2222/org/repo.git

# HTTPS with saved credentials
git clone https://git.mosaicstack.dev/org/repo.git

# HTTPS with token
git clone https://username:token@git.mosaicstack.dev/org/repo.git
```

### Remote Commands
```bash
# Add remote
git remote add gitea ssh://git@git.mosaicstack.dev:2222/org/repo.git

# Change remote URL
git remote set-url gitea ssh://git@git.mosaicstack.dev:2222/org/new-repo.git

# Remove remote
git remote remove gitea
```

### Push/Pull Commands
```bash
# Push to specific remote
git push gitea main

# Pull from specific remote
git pull gitea main

# Fetch all remotes
git fetch --all
```

## Next Steps

1. Configure SSH keys for all developers
2. Set up repository mirroring
3. Configure CI/CD pipelines
4. Enable two-factor authentication in Gitea
5. Set up GPG signing for commits

---

For more help, see the [Gitea documentation](https://docs.gitea.io) or contact your system administrator.