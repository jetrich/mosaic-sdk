---
title: "Tony Persona System Requirements"
slug: "tony-persona-requirements"
description: "System requirements and dependencies for the MosAIc Agent Persona System"
priority: 5
tags: ["tony", "personas", "requirements", "dependencies"]
---

# Tony Persona System Requirements

## Overview

The MosAIc Agent Persona System requires specific tools for YAML processing and validation. This guide covers all required and optional dependencies.

## System Dependencies

### Required Dependencies

| Tool | Version | Purpose | Platform Support |
|------|---------|---------|------------------|
| yq | >= 4.0.0 | YAML processor | All platforms |
| jq | >= 1.6 | JSON processor | All platforms |
| bash | >= 4.0 | Shell scripts | All platforms |

### Optional Dependencies

| Tool | Version | Purpose | Installation |
|------|---------|---------|--------------|
| python3 | >= 3.8 | Advanced validation scripts | System package |
| pyyaml | Latest | Python YAML library | `pip install pyyaml` |
| jsonschema | Latest | JSON schema validation | `pip install jsonschema` |

## Installation Instructions

### Quick Setup

Run the automated setup script to check and install dependencies:

```bash
./tony/scripts/operations/agents/setup-persona-system.sh
```

This script will:
- Check for required dependencies
- Offer to install missing dependencies
- Verify the installation

### macOS Installation

```bash
# Using Homebrew
brew install yq jq

# Verify installation
yq --version
jq --version
```

### Linux Installation

#### Ubuntu/Debian
```bash
# Update package list
sudo apt-get update

# Install jq
sudo apt-get install -y jq

# Install yq (using snap)
sudo snap install yq

# Alternative: Direct download
sudo wget -qO /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64
sudo chmod +x /usr/local/bin/yq
```

#### CentOS/RHEL/Fedora
```bash
# Install jq
sudo yum install -y jq

# Install yq (direct download)
sudo wget -qO /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64
sudo chmod +x /usr/local/bin/yq
```

#### Alpine Linux
```bash
# Install both tools from Alpine packages
apk add jq yq
```

### Windows Installation

#### Using Chocolatey
```powershell
# Install Chocolatey if not already installed
# Visit https://chocolatey.org/install

# Install tools
choco install yq jq
```

#### Using Scoop
```powershell
# Install Scoop if not already installed
# Visit https://scoop.sh

# Install tools
scoop install yq jq
```

## Verification Steps

After installation, verify all dependencies are properly installed:

```bash
# Check yq version (should be 4.0.0 or higher)
yq --version

# Check jq version (should be 1.6 or higher)
jq --version

# Check bash version (should be 4.0 or higher)
bash --version | head -1

# Test yq functionality
echo "test: value" | yq eval '.test' -

# Test jq functionality
echo '{"test": "value"}' | jq '.test'
```

## Python Dependencies (Optional)

For advanced validation and processing scripts:

```bash
# Install Python dependencies
pip install pyyaml jsonschema

# Verify installation
python3 -c "import yaml; print('PyYAML installed')"
python3 -c "import jsonschema; print('jsonschema installed')"
```

## Troubleshooting

### Common Issues

1. **yq command not found**
   - Ensure `/usr/local/bin` is in your PATH
   - Try running with full path: `/usr/local/bin/yq`

2. **Permission denied when installing**
   - Use `sudo` for system-wide installation
   - Or install to user directory and add to PATH

3. **Wrong yq version**
   - Some systems have an older Python-based yq
   - Ensure you're using the Go-based yq from mikefarah/yq

### Platform-Specific Notes

- **Docker/Container environments**: Include dependencies in Dockerfile
- **CI/CD pipelines**: Add installation steps to pipeline configuration
- **Restricted environments**: Use portable binaries if package managers unavailable

## Related Documentation

- [Persona System Overview](../../projects/tony/agent-management/01-persona-system)
- [Tony Framework Setup](../installation/01-complete-guide)
- [Development Environment Setup](../quick-start/03-isolated-environment)