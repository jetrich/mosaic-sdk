#!/bin/bash
# Separate script for CI/CD agent (run after Gitea is configured)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Starting CI/CD Integration Agent...${NC}"

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

Gitea is at http://localhost:3000 and Woodpecker will be at http://localhost:8000." > ~/src/mosaic-sdk/deployment/agents/logs/cicd-integration-agent.log 2>&1 &

pid=$!
echo -e "${GREEN}✓ CI/CD Integration Agent started with PID: $pid${NC}"
echo "$pid:CI/CD Integration Agent" >> ~/src/mosaic-sdk/deployment/agents/.agent-pids