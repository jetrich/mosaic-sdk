# Agent Deployment Guide for MosAIc Infrastructure Tasks

## Overview

This guide provides instructions for deploying specialized agents to complete the MosAIc infrastructure setup and resolve blocking issues.

## Agent Deployment Commands

### 1. MCP Integration Agent (CRITICAL - Unblocks Tony 2.8.0)

**Repository**: mosaic-mcp  
**Purpose**: Implement minimal MCP interface to unblock Tony 2.8.0

```bash
cd ~/src/mosaic-mcp
nohup claude -p "You are the MCP Integration Agent. Your task is to implement the minimal MCP interface that was designed to unblock Tony 2.8.0. The interface design is in ~/src/tony-sdk/tony/mcp-unblock/. Your specific tasks:

1. Create a new branch: feature/minimal-mcp-interface
2. Copy the interface definitions from tony/mcp-unblock/minimal-mcp-interface.ts
3. Implement a proper server using the MCP SDK that adheres to this interface
4. Add database persistence using the existing PostgreSQL setup
5. Create comprehensive tests
6. Update the README with usage instructions
7. Create a PR with description explaining this unblocks Tony 2.8.0

Use the existing mosaic-mcp structure and follow the patterns already established. Reference Issue #81 in your commits." > logs/mcp-integration-agent.log 2>&1 &
```

### 2. GitHub Sync Agent

**Repository**: mosaic-sdk  
**Purpose**: Configure Gitea-GitHub synchronization

```bash
cd ~/src/mosaic-sdk
nohup claude -p "You are the GitHub Sync Agent. Your task is to set up one-way synchronization from Gitea to GitHub. Tasks:

1. Read the Gitea API documentation
2. Create a sync service in deployment/sync-service/ with:
   - Docker container that monitors Gitea webhooks
   - Script to push changes to GitHub
   - Configuration for repository mapping
   - Proper error handling and logging
3. Document the webhook URLs needed for Gitea configuration
4. Create a systemd service file for non-Docker deployment option
5. Test with a sample repository

Gitea is running at http://localhost:3000. Assume admin credentials are available." > logs/github-sync-agent.log 2>&1 &
```

### 3. Milestone Fix Agent

**Repository**: mosaic-mcp  
**Purpose**: Fix milestone sequencing issues

```bash
cd ~/src/mosaic-mcp
nohup claude -p "You are the Milestone Fix Agent. Your task is to correct the milestone sequencing in the mosaic-mcp repository. Execute these fixes:

1. Review the milestone fix script at ~/src/mosaic-sdk/deployment/milestone-fixes/fix-mosaic-mcp-milestones.sh
2. Run the script with confirmation (y) to fix milestone dates
3. Move Issue #81 to milestone 5 (v0.0.3) for faster delivery
4. Create new issues for:
   - Minimal MCP Interface Implementation
   - MCP Interface Testing Suite
   - Tony 2.8.0 Integration Guide
5. Update the project README with corrected milestone timeline
6. Document all changes in a summary report

Use gh CLI commands and ensure all changes are logged." > logs/milestone-fix-agent.log 2>&1 &
```

### 4. Monitoring Stack Agent

**Repository**: mosaic-sdk  
**Purpose**: Deploy Grafana Alloy monitoring

```bash
cd ~/src/mosaic-sdk
nohup claude -p "You are the Monitoring Stack Agent. Your task is to deploy Grafana Alloy and the monitoring stack. Tasks:

1. Create deployment/monitoring/docker-compose.yml with:
   - Grafana Alloy (latest version)
   - Prometheus
   - Grafana
   - Loki for logs
   - Pre-configured dashboards
2. Configure Alloy to collect metrics from:
   - Docker containers
   - PostgreSQL
   - Redis
   - Gitea
3. Create dashboards for:
   - Infrastructure overview
   - Agent activity monitoring
   - Git repository statistics
4. Set up alerts for critical issues
5. Document access URLs and default credentials

Ensure all components use the mosaicstack-internal network." > logs/monitoring-stack-agent.log 2>&1 &
```

### 5. CI/CD Integration Agent

**Repository**: mosaic-sdk  
**Purpose**: Configure Woodpecker CI with Gitea

```bash
cd ~/src/mosaic-sdk
nohup claude -p "You are the CI/CD Integration Agent. Your task is to complete the Woodpecker CI setup with Gitea integration. Tasks:

1. Create Gitea OAuth application for Woodpecker
2. Update deployment/docker-compose.portainer.yml with Woodpecker configuration
3. Create example .woodpecker.yml pipelines for:
   - Node.js projects
   - Python projects
   - Docker image builds
4. Configure Woodpecker agents for parallel builds
5. Set up build caching with Redis
6. Document the complete CI/CD workflow

Gitea is at http://localhost:3000 and Woodpecker will be at http://localhost:8000." > logs/cicd-integration-agent.log 2>&1 &
```

## Monitoring Agent Progress

Check agent logs:
```bash
tail -f logs/*-agent.log
```

List active agents:
```bash
ps aux | grep "claude -p"
```

## Task Coordination

Agents should work in this order for dependencies:
1. **Milestone Fix Agent** - Fixes GitHub issues (no dependencies)
2. **MCP Integration Agent** - Critical for Tony 2.8.0 (no dependencies)
3. **GitHub Sync Agent** - Needs Gitea running
4. **CI/CD Integration Agent** - Needs Gitea running
5. **Monitoring Stack Agent** - Can run independently

## Success Criteria

- [ ] Milestones reordered correctly
- [ ] Issue #81 moved to earlier milestone
- [ ] Minimal MCP interface implemented
- [ ] GitHub sync service deployed
- [ ] Woodpecker CI integrated with Gitea
- [ ] Monitoring stack operational
- [ ] All services accessible and documented