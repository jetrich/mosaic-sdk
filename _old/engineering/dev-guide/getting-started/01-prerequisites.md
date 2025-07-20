---
title: "Prerequisites"
order: 01
category: "getting-started"
tags: ["setup", "requirements", "installation"]
last_updated: "2025-01-19"
author: "system"
version: "1.0"
status: "published"
---

# Prerequisites

Before you begin developing with the MosAIc Stack, ensure you have the following prerequisites installed and configured.

## System Requirements

### Hardware
- **CPU**: 4+ cores recommended
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 50GB+ available disk space
- **Network**: Stable internet connection

### Operating System
- **Linux**: Ubuntu 20.04+, Debian 11+, RHEL 8+
- **macOS**: 11.0+ (Big Sur or later)
- **Windows**: Windows 10+ with WSL2

## Required Software

### Docker
- **Version**: 24.0.0 or higher
- **Docker Compose**: v2.20.0 or higher

Installation:
```bash
# Linux
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# macOS
brew install --cask docker

# Verify installation
docker --version
docker compose version
```

### Git
- **Version**: 2.25.0 or higher

```bash
# Linux
sudo apt-get install git  # Debian/Ubuntu
sudo yum install git      # RHEL/CentOS

# macOS
brew install git

# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Development Tools

#### Node.js (for TypeScript/JavaScript development)
- **Version**: 18.0.0+ LTS recommended

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
nvm use --lts
```

#### Python (for Python development)
- **Version**: 3.9+ recommended

```bash
# Linux
sudo apt-get install python3 python3-pip python3-venv

# macOS
brew install python@3.11
```

#### Go (for Go development)
- **Version**: 1.20+ recommended

```bash
# Download from https://go.dev/dl/
# Or use package manager
brew install go  # macOS
```

### Additional Tools

#### jq (JSON processor)
```bash
# Linux
sudo apt-get install jq

# macOS
brew install jq
```

#### OpenSSL
```bash
# Usually pre-installed, verify with:
openssl version
```

#### curl
```bash
# Usually pre-installed, verify with:
curl --version
```

## Account Setup

### GitHub Account
- Create account at [github.com](https://github.com)
- Set up SSH keys for Git operations

### Gitea Account
- Will be created during MosAIc Stack setup
- SSH keys will be configured

## Network Requirements

### Ports
Ensure the following ports are available:
- `3000`: Gitea web interface
- `2222`: Gitea SSH
- `6875`: BookStack
- `8080`: Woodpecker CI/CD
- `5432`: PostgreSQL (internal)
- `6379`: Redis (internal)
- `3306`: MariaDB (internal)

### Firewall
Configure firewall to allow Docker networking:
```bash
# UFW (Ubuntu)
sudo ufw allow 3000/tcp
sudo ufw allow 2222/tcp
sudo ufw allow 6875/tcp
sudo ufw allow 8080/tcp
```

## Verification

Run this script to verify all prerequisites:

```bash
#!/bin/bash
echo "Checking prerequisites..."

# Check Docker
if command -v docker &> /dev/null; then
    echo "✓ Docker: $(docker --version)"
else
    echo "✗ Docker not found"
fi

# Check Docker Compose
if docker compose version &> /dev/null; then
    echo "✓ Docker Compose: $(docker compose version)"
else
    echo "✗ Docker Compose v2 not found"
fi

# Check Git
if command -v git &> /dev/null; then
    echo "✓ Git: $(git --version)"
else
    echo "✗ Git not found"
fi

# Check disk space
AVAILABLE=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$AVAILABLE" -gt 50 ]; then
    echo "✓ Disk space: ${AVAILABLE}GB available"
else
    echo "✗ Disk space: Only ${AVAILABLE}GB available (50GB+ recommended)"
fi

# Check memory
MEMORY=$(free -g | awk '/^Mem:/{print $2}')
if [ "$MEMORY" -ge 8 ]; then
    echo "✓ Memory: ${MEMORY}GB RAM"
else
    echo "⚠ Memory: ${MEMORY}GB RAM (8GB+ recommended)"
fi
```

## Next Steps

Once all prerequisites are met:
1. Clone the MosAIc SDK repository
2. Run the interactive setup script
3. Configure your development environment
4. Start developing!

---

For detailed setup instructions, see [Environment Setup](./02-environment-setup.md).