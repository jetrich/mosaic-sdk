#!/bin/bash
# Script to start all infrastructure agents with proper setup

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 MosAIc Infrastructure Agent Deployment Script${NC}"
echo "================================================="

# Create logs directory
mkdir -p logs

# Function to start an agent
start_agent() {
    local name=$1
    local repo=$2
    local prompt=$3
    
    echo -e "${YELLOW}Starting $name...${NC}"
    cd ~/src/$repo
    nohup claude -p "$prompt" > ~/src/mosaic-sdk/deployment/agents/logs/${name,,}-agent.log 2>&1 &
    local pid=$!
    echo -e "${GREEN}✓ $name started with PID: $pid${NC}"
    echo "$pid:$name" >> ~/src/mosaic-sdk/deployment/agents/.agent-pids
    sleep 2
}

# Clear previous PID tracking
> ~/src/mosaic-sdk/deployment/agents/.agent-pids

# Priority 1: Critical Unblocking Agents
echo -e "\n${YELLOW}Phase 1: Critical Unblocking Agents${NC}"
echo "-----------------------------------"

# Start Milestone Fix Agent
start_agent "Milestone Fix Agent" "mosaic-mcp" "You are the Milestone Fix Agent. Your task is to correct the milestone sequencing in the mosaic-mcp repository. Execute these fixes:

1. Review the milestone fix script at ~/src/mosaic-sdk/deployment/milestone-fixes/fix-mosaic-mcp-milestones.sh
2. Run the script with confirmation (y) to fix milestone dates
3. Move Issue #81 to milestone 5 (v0.0.3) for faster delivery
4. Create new issues for:
   - Minimal MCP Interface Implementation
   - MCP Interface Testing Suite
   - Tony 2.8.0 Integration Guide
5. Update the project README with corrected milestone timeline
6. Document all changes in a summary report

Use gh CLI commands and ensure all changes are logged."

# Start MCP Integration Agent
start_agent "MCP Integration Agent" "mosaic-mcp" "You are the MCP Integration Agent. Your task is to implement the minimal MCP interface that was designed to unblock Tony 2.8.0. The interface design is in ~/src/tony-sdk/tony/mcp-unblock/. Your specific tasks:

1. Create a new branch: feature/minimal-mcp-interface
2. Copy the interface definitions from tony/mcp-unblock/minimal-mcp-interface.ts
3. Implement a proper server using the MCP SDK that adheres to this interface
4. Add database persistence using the existing PostgreSQL setup
5. Create comprehensive tests
6. Update the README with usage instructions
7. Create a PR with description explaining this unblocks Tony 2.8.0

Use the existing mosaic-mcp structure and follow the patterns already established. Reference Issue #81 in your commits."

echo -e "\n${YELLOW}Waiting 30 seconds before starting Phase 2...${NC}"
sleep 30

# Phase 2: Infrastructure Agents
echo -e "\n${YELLOW}Phase 2: Infrastructure Agents${NC}"
echo "------------------------------"

# Start GitHub Sync Agent
start_agent "GitHub Sync Agent" "mosaic-sdk" "You are the GitHub Sync Agent. Your task is to set up one-way synchronization from Gitea to GitHub. Tasks:

1. Read the Gitea API documentation
2. Create a sync service in deployment/sync-service/ with:
   - Docker container that monitors Gitea webhooks
   - Script to push changes to GitHub
   - Configuration for repository mapping
   - Proper error handling and logging
3. Document the webhook URLs needed for Gitea configuration
4. Create a systemd service file for non-Docker deployment option
5. Test with a sample repository

Gitea is running at http://localhost:3000. Assume admin credentials are available."

# Start Monitoring Stack Agent
start_agent "Monitoring Stack Agent" "mosaic-sdk" "You are the Monitoring Stack Agent. Your task is to deploy Grafana Alloy and the monitoring stack. Tasks:

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

Ensure all components use the mosaicstack-internal network."

echo -e "\n${GREEN}✅ All agents deployed!${NC}"
echo -e "\nMonitor progress with:"
echo -e "  ${YELLOW}tail -f ~/src/mosaic-sdk/deployment/agents/logs/*-agent.log${NC}"
echo -e "\nView active agents:"
echo -e "  ${YELLOW}ps aux | grep 'claude -p'${NC}"
echo -e "\nAgent PIDs saved to: .agent-pids"

# Note about CI/CD agent
echo -e "\n${YELLOW}NOTE:${NC} CI/CD Integration Agent should be started manually after Gitea setup is complete:"
echo -e "  ${YELLOW}cd ~/src/mosaic-sdk && ./deployment/agents/start-cicd-agent.sh${NC}"